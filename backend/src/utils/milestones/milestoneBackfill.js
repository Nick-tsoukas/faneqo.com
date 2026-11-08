'use strict';

/**
 * Idempotent fan-milestone backfill from canonical attendance + fan_replied events.
 *
 * Default is dry-run. Does not mutate attendance, fans, or RelationshipEvent.
 * Repeat execution is safe via idempotencyKey.
 */

const { FIRST_SHOW, SECOND_SHOW, FIRST_REPLY, milestoneIdempotencyKey } = require('./milestoneKeys');
const {
  evaluateFirstShow,
  evaluateSecondShow,
  evaluateFirstReply,
  orderedCanonicalAttendances,
} = require('./milestonePure');
const {
  resolveLayout,
  rawRows,
  attendanceFanExpr,
  attendanceFanJoin,
} = require('../integrity/fanAttendanceIntegrity');

function emptyReport() {
  return {
    scanned: 0,
    eligibleFirstShow: 0,
    eligibleSecondShow: 0,
    eligibleFirstReply: 0,
    existing: 0,
    wouldCreate: 0,
    wouldUpdate: 0,
    wouldArchive: 0,
    created: 0,
    updated: 0,
    archived: 0,
    errors: 0,
  };
}

function attendanceBandExpr(layout) {
  return layout.attBand === 'inline' ? 'a.band_id' : 'bl.band_id';
}

function attendanceBandJoin(layout) {
  return layout.attBand === 'links'
    ? 'INNER JOIN fan_show_attendances_band_links bl ON bl.fan_show_attendance_id = a.id'
    : '';
}

function pairKey(bandId, fanId) {
  return `${bandId}:${fanId}`;
}

async function loadExistingMilestones(knex) {
  const byKey = new Map();
  if (!(await knex.schema.hasTable('milestones'))) return byKey;
  if (!(await knex.schema.hasColumn('milestones', 'idempotency_key'))) return byKey;
  const hasStatus = await knex.schema.hasColumn('milestones', 'status');
  const hasOccurred = await knex.schema.hasColumn('milestones', 'occurred_at');
  const hasEvidence = await knex.schema.hasColumn('milestones', 'evidence');
  const cols = ['idempotency_key'];
  if (hasStatus) cols.push('status');
  if (hasOccurred) cols.push('occurred_at');
  if (hasEvidence) cols.push('evidence');
  const rows = rawRows(await knex.raw(`SELECT ${cols.join(', ')} FROM milestones`));
  for (const row of rows || []) {
    if (row.idempotency_key) byKey.set(String(row.idempotency_key), row);
  }
  return byKey;
}

async function scanAttendances(knex) {
  const layout = await resolveLayout(knex);
  if (layout.attFan === 'missing' || layout.attBand === 'missing') return [];
  const fanExpr = attendanceFanExpr(layout);
  const fanJoin = attendanceFanJoin(layout);
  const bandExpr = attendanceBandExpr(layout);
  const bandJoin = attendanceBandJoin(layout);
  const sql = `
    SELECT a.id AS id,
           ${fanExpr} AS fan_id,
           ${bandExpr} AS band_id,
           a.checked_in_at AS checked_in_at,
           a.suppressed_duplicate AS suppressed_duplicate
    FROM fan_show_attendances a
    ${fanJoin}
    ${bandJoin}
    ORDER BY a.checked_in_at ASC, a.id ASC
  `;
  return rawRows(await knex.raw(sql));
}

async function columnExists(knex, table, column) {
  try {
    return await knex.schema.hasColumn(table, column);
  } catch {
    return false;
  }
}

async function scanEarliestReplies(knex) {
  if (!(await knex.schema.hasTable('relationship_events'))) return [];
  const hasType = await columnExists(knex, 'relationship_events', 'type');
  const hasOccurred = await columnExists(knex, 'relationship_events', 'occurred_at');
  if (!hasType || !hasOccurred) return [];

  const hasBandCol = await columnExists(knex, 'relationship_events', 'band_id');
  const hasFanCol = await columnExists(knex, 'relationship_events', 'fan_id');
  let bandExpr = 'e.band_id';
  let fanExpr = 'e.fan_id';
  let joins = '';
  if (!hasBandCol) {
    const hasBandLinks = await knex.schema.hasTable('relationship_events_band_links');
    if (!hasBandLinks) return [];
    joins += ' INNER JOIN relationship_events_band_links ebl ON ebl.relationship_event_id = e.id';
    bandExpr = 'ebl.band_id';
  }
  if (!hasFanCol) {
    const hasFanLinks = await knex.schema.hasTable('relationship_events_fan_links');
    if (!hasFanLinks) return [];
    joins += ' INNER JOIN relationship_events_fan_links efl ON efl.relationship_event_id = e.id';
    fanExpr = 'efl.fan_id';
  }

  const sql = `
    SELECT e.id AS id,
           ${bandExpr} AS band_id,
           ${fanExpr} AS fan_id,
           e.occurred_at AS occurred_at
    FROM relationship_events e
    ${joins}
    WHERE e.type = 'fan_replied'
      AND ${fanExpr} IS NOT NULL
    ORDER BY e.occurred_at ASC, e.id ASC
  `;
  return rawRows(await knex.raw(sql));
}

function parseEvidence(value) {
  if (!value) return null;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(String(value));
  } catch {
    return null;
  }
}

function classifyDesired(existing, desired) {
  if (!desired) {
    if (existing && String(existing.status) !== 'archived') return 'archive';
    return 'skip';
  }
  if (!existing) return 'create';
  const occurred = existing.occurred_at || existing.occurredAt;
  const desiredIso = desired.occurredAt;
  const existingIso = occurred ? new Date(occurred).toISOString() : null;
  const evidence = parseEvidence(existing.evidence);
  const existingId = evidence?.attendanceId || evidence?.relationshipEventId || null;
  const desiredId = desired.evidence?.attendanceId || desired.evidence?.relationshipEventId || null;
  if (String(existing.status) === 'archived') return 'update';
  if (existingIso !== desiredIso || String(existingId) !== String(desiredId)) return 'update';
  return 'existing';
}

async function planFanMilestoneBackfill(knex) {
  const report = emptyReport();
  const pairs = new Map();

  const attendanceRows = await scanAttendances(knex);
  for (const row of attendanceRows || []) {
    const bandId = Number(row.band_id);
    const fanId = Number(row.fan_id);
    if (!bandId || !fanId) continue;
    const key = pairKey(bandId, fanId);
    if (!pairs.has(key)) {
      pairs.set(key, { bandId, fanId, attendances: [], earliestReply: null });
    }
    pairs.get(key).attendances.push({
      id: row.id,
      checkedInAt: row.checked_in_at,
      suppressedDuplicate: row.suppressed_duplicate === true || row.suppressed_duplicate === 1,
    });
  }

  const replies = await scanEarliestReplies(knex);
  for (const row of replies || []) {
    const bandId = Number(row.band_id);
    const fanId = Number(row.fan_id);
    if (!bandId || !fanId) continue;
    const key = pairKey(bandId, fanId);
    if (!pairs.has(key)) {
      pairs.set(key, { bandId, fanId, attendances: [], earliestReply: null });
    }
    const pair = pairs.get(key);
    if (!pair.earliestReply) {
      pair.earliestReply = {
        id: row.id,
        type: 'fan_replied',
        occurredAt: row.occurred_at,
      };
    }
  }

  const existing = await loadExistingMilestones(knex);
  const jobs = [];

  for (const pair of pairs.values()) {
    report.scanned += 1;
    const attendances = orderedCanonicalAttendances(pair.attendances);
    const desiredMap = {
      [FIRST_SHOW]: evaluateFirstShow(attendances),
      [SECOND_SHOW]: evaluateSecondShow(attendances),
      [FIRST_REPLY]: evaluateFirstReply(pair.earliestReply),
    };
    if (desiredMap[FIRST_SHOW]) report.eligibleFirstShow += 1;
    if (desiredMap[SECOND_SHOW]) report.eligibleSecondShow += 1;
    if (desiredMap[FIRST_REPLY]) report.eligibleFirstReply += 1;

    for (const [type, desired] of Object.entries(desiredMap)) {
      const key = milestoneIdempotencyKey({
        bandId: pair.bandId,
        subjectFanId: pair.fanId,
        type,
      });
      const action = classifyDesired(existing.get(key), desired);
      if (action === 'create') {
        report.wouldCreate += 1;
        jobs.push({ bandId: pair.bandId, fanId: pair.fanId, type, action });
      } else if (action === 'update') {
        report.wouldUpdate += 1;
        jobs.push({ bandId: pair.bandId, fanId: pair.fanId, type, action });
      } else if (action === 'archive') {
        report.wouldArchive += 1;
        jobs.push({ bandId: pair.bandId, fanId: pair.fanId, type, action });
      } else if (desired) {
        report.existing += 1;
      }
    }
  }

  return { report, jobs };
}

async function applyFanMilestoneBackfill(strapi, plan) {
  const report = { ...(plan?.report || emptyReport()) };
  report.created = 0;
  report.updated = 0;
  report.archived = 0;
  report.errors = 0;
  const seen = new Set();
  const { reconcileFanArtistMilestones } = require('./milestoneReconcile');
  for (const job of plan?.jobs || []) {
    const key = pairKey(job.bandId, job.fanId);
    if (seen.has(key)) continue;
    seen.add(key);
    try {
      const result = await reconcileFanArtistMilestones(strapi, {
        bandId: job.bandId,
        fanId: job.fanId,
      });
      report.created += result.created;
      report.updated += result.updated;
      report.archived += result.archived;
      report.errors += result.errors;
    } catch {
      report.errors += 1;
    }
  }
  return report;
}

module.exports = {
  emptyReport,
  classifyDesired,
  planFanMilestoneBackfill,
  applyFanMilestoneBackfill,
};
