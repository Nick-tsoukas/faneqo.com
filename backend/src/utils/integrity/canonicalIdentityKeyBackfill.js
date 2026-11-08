'use strict';

/**
 * Dry-run / apply backfill for canonical integrity keys.
 * Default is dry-run. --apply never merges fans or suppresses attendance.
 */

const {
  buildFanCanonicalIdentityKey,
  buildCampaignAttendanceIdentityKey,
  buildEventAttendanceIdentityKey,
} = require('./canonicalIdentityKeys');
const {
  FAN_TABLE,
  ATT_TABLE,
  FAN_BAND_LINKS,
  ATT_FAN_LINKS,
  ATT_EVENT_LINKS,
  dialectOf,
  runIntegrityAudit,
  resolveLayout,
  tableExists,
  columnExists,
  rawRows,
  canActivateFanIdentityUnique,
  canActivateCampaignIdentityUnique,
  canActivateEventIdentityUnique,
  fanIdentityUniqueSql,
  campaignIdentityUniqueSql,
  eventIdentityUniqueSql,
  FAN_IDENTITY_UNIQUE,
  ATT_CAMPAIGN_IDENTITY_UNIQUE,
  ATT_EVENT_IDENTITY_UNIQUE,
} = require('./fanAttendanceIntegrity');

const BATCH_SIZE = 200;

function logLine(log, event, fields = {}) {
  if (typeof log === 'function') {
    log(event, fields);
    return;
  }
  const parts = Object.entries(fields)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${key}=${typeof value === 'object' ? JSON.stringify(value) : value}`);
  console.log(`[Faneqo Integrity Keys] ${event}${parts.length ? ` ${parts.join(' ')}` : ''}`);
}

async function fetchFanRowsNeedingKeys(knex, layout) {
  if (!(await columnExists(knex, FAN_TABLE, 'canonical_identity_key'))) return [];
  const bandSelect = layout.fanBand === 'inline' ? 'f.band_id' : 'bl.band_id';
  const bandJoin = layout.fanBand === 'links' ? `INNER JOIN ${FAN_BAND_LINKS} bl ON bl.fan_id = f.id` : '';
  const bandWhere = layout.fanBand === 'inline' ? 'AND f.band_id IS NOT NULL' : '';
  return rawRows(
    await knex.raw(
      `SELECT f.id, f.email, ${bandSelect} AS band_id
       FROM ${FAN_TABLE} f
       ${bandJoin}
       WHERE f.email IS NOT NULL AND trim(f.email) <> '' ${bandWhere}
         AND (f.canonical_identity_key IS NULL OR f.canonical_identity_key = '')`
    )
  );
}

async function fetchAttendanceRows(knex, layout) {
  const hasCampaignCol = await columnExists(knex, ATT_TABLE, 'campaign_identity_key');
  const hasEventCol = await columnExists(knex, ATT_TABLE, 'event_identity_key');
  if (!hasCampaignCol && !hasEventCol) return [];

  const fanSelect = layout.attFan === 'inline' ? 'a.fan_id' : 'fl.fan_id';
  const fanJoin = layout.attFan === 'links' ? `LEFT JOIN ${ATT_FAN_LINKS} fl ON fl.fan_show_attendance_id = a.id` : '';
  const eventSelect = layout.attEvent === 'inline' ? 'a.event_id' : 'el.event_id';
  const eventJoin =
    layout.attEvent === 'links' ? `LEFT JOIN ${ATT_EVENT_LINKS} el ON el.fan_show_attendance_id = a.id` : '';

  return rawRows(
    await knex.raw(
      `SELECT a.id, a.campaign_id, a.suppressed_duplicate,
              ${fanSelect} AS fan_id,
              ${layout.attEvent === 'missing' ? 'NULL' : eventSelect} AS event_id,
              ${hasCampaignCol ? 'a.campaign_identity_key' : 'NULL AS campaign_identity_key'},
              ${hasEventCol ? 'a.event_identity_key' : 'NULL AS event_identity_key'}
       FROM ${ATT_TABLE} a
       ${fanJoin}
       ${eventJoin}`
    )
  );
}

function attendanceNeedsKeys(row) {
  if (row.suppressed_duplicate === true || row.suppressed_duplicate === 1 || row.suppressed_duplicate === '1') {
    return false;
  }
  const campaignNeeded = Boolean(row.campaign_id) && !row.campaign_identity_key;
  const eventNeeded = row.event_id != null && row.event_id !== '' && !row.event_identity_key;
  return campaignNeeded || eventNeeded;
}

async function updateFanKeys(knex, rows) {
  let updated = 0;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    await knex.transaction(async (trx) => {
      for (const row of batch) {
        const key = buildFanCanonicalIdentityKey({ bandId: row.band_id, email: row.email });
        if (!key) continue;
        await trx(FAN_TABLE).where({ id: row.id }).update({ canonical_identity_key: key });
        updated += 1;
      }
    });
  }
  return updated;
}

async function updateAttendanceKeys(knex, rows) {
  let updated = 0;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    await knex.transaction(async (trx) => {
      for (const row of batch) {
        if (!attendanceNeedsKeys(row)) continue;
        const patch = {};
        if (row.campaign_id && !row.campaign_identity_key) {
          patch.campaign_identity_key = buildCampaignAttendanceIdentityKey({
            fanId: row.fan_id,
            campaignId: row.campaign_id,
          });
        }
        if (row.event_id != null && row.event_id !== '' && !row.event_identity_key) {
          patch.event_identity_key = buildEventAttendanceIdentityKey({
            fanId: row.fan_id,
            eventId: row.event_id,
          });
        }
        const keys = Object.keys(patch).filter((k) => patch[k]);
        if (!keys.length) continue;
        const data = {};
        for (const k of keys) data[k] = patch[k];
        await trx(ATT_TABLE).where({ id: row.id }).update(data);
        updated += 1;
      }
    });
  }
  return updated;
}

async function activateIdentityIndexes(knex, audit, log) {
  const applied = [];
  if (canActivateFanIdentityUnique(audit)) {
    await knex.raw(fanIdentityUniqueSql());
    applied.push(FAN_IDENTITY_UNIQUE);
    logLine(log, 'index-created', { index: FAN_IDENTITY_UNIQUE });
  }
  if (canActivateCampaignIdentityUnique(audit)) {
    await knex.raw(campaignIdentityUniqueSql());
    applied.push(ATT_CAMPAIGN_IDENTITY_UNIQUE);
    logLine(log, 'index-created', { index: ATT_CAMPAIGN_IDENTITY_UNIQUE });
  }
  if (canActivateEventIdentityUnique(audit)) {
    await knex.raw(eventIdentityUniqueSql());
    applied.push(ATT_EVENT_IDENTITY_UNIQUE);
    logLine(log, 'index-created', { index: ATT_EVENT_IDENTITY_UNIQUE });
  }
  return applied;
}

async function runCanonicalIdentityKeyBackfill(knex, { apply = false, log } = {}) {
  const audit = await runIntegrityAudit(knex);
  const layout = audit.physical?.layout || (await resolveLayout(knex));
  const coverage = audit.coverage || {};

  const summary = {
    mode: apply ? 'apply' : 'dry-run',
    dialect: dialectOf(knex),
    fansScanned: coverage.fansScanned || 0,
    fansMissingKey: coverage.fansMissingKey || 0,
    fanDuplicateGroups: audit.fans?.groups || 0,
    attendanceScanned: coverage.attendanceScanned || 0,
    campaignKeysMissing: coverage.campaignMissingKey || 0,
    eventKeysMissing: coverage.eventMissingKey || 0,
    campaignDuplicateGroups: audit.attendance?.campaignGroups || 0,
    eventDuplicateGroups: audit.attendance?.eventGroups || 0,
    fanDuplicateKeyGroups: coverage.fanDuplicateKeyGroups || 0,
    campaignDuplicateKeyGroups: coverage.campaignDuplicateKeyGroups || 0,
    eventDuplicateKeyGroups: coverage.eventDuplicateKeyGroups || 0,
    identityIndexes: audit.identityIndexes,
    productionStatus: 'UNKNOWN',
    stopped: false,
    reason: null,
    fansUpdated: 0,
    attendanceUpdated: 0,
    indexesCreated: [],
  };

  logLine(log, apply ? 'apply-start' : 'dry-run', {
    fansScanned: summary.fansScanned,
    fansMissingKey: summary.fansMissingKey,
    fanDuplicateGroups: summary.fanDuplicateGroups,
    attendanceScanned: summary.attendanceScanned,
    campaignKeysMissing: summary.campaignKeysMissing,
    eventKeysMissing: summary.eventKeysMissing,
    campaignDuplicateGroups: summary.campaignDuplicateGroups,
    eventDuplicateGroups: summary.eventDuplicateGroups,
    dialect: summary.dialect,
    productionStatus: 'UNKNOWN',
  });

  const dirty =
    summary.fanDuplicateGroups > 0 ||
    summary.campaignDuplicateGroups > 0 ||
    summary.eventDuplicateGroups > 0 ||
    summary.fanDuplicateKeyGroups > 0 ||
    summary.campaignDuplicateKeyGroups > 0 ||
    summary.eventDuplicateKeyGroups > 0;

  if (!apply) {
    if (dirty) {
      logLine(log, 'dry-run-conflicts', {
        note: 'Duplicate identity groups present. --apply would STOP. No merge/suppress.',
      });
    }
    logLine(log, 'dry-run-complete', { mutated: false });
    return summary;
  }

  if (dirty) {
    summary.stopped = true;
    summary.reason = 'duplicates_present';
    logLine(log, 'apply-stopped', {
      reason: 'duplicates_present',
      note: 'Dirty data. Do not merge fans or suppress attendance automatically.',
    });
    return summary;
  }

  const fanRows = await fetchFanRowsNeedingKeys(knex, layout);
  summary.fansUpdated = await updateFanKeys(knex, fanRows);

  const attendanceRows = (await fetchAttendanceRows(knex, layout)).filter(attendanceNeedsKeys);
  summary.attendanceUpdated = await updateAttendanceKeys(knex, attendanceRows);

  const after = await runIntegrityAudit(knex);
  summary.coverageAfter = after.coverage;
  summary.identityIndexesAfter = after.identityIndexes;

  const uncovered =
    Number(after.coverage?.fansMissingKey || 0) > 0 ||
    Number(after.coverage?.campaignMissingKey || 0) > 0 ||
    Number(after.coverage?.eventMissingKey || 0) > 0;
  const duplicateKeys =
    Number(after.coverage?.fanDuplicateKeyGroups || 0) > 0 ||
    Number(after.coverage?.campaignDuplicateKeyGroups || 0) > 0 ||
    Number(after.coverage?.eventDuplicateKeyGroups || 0) > 0;

  if (uncovered || duplicateKeys) {
    summary.stopped = true;
    summary.reason = uncovered ? 'coverage_incomplete' : 'duplicate_keys_after_backfill';
    logLine(log, 'apply-stopped', { reason: summary.reason, note: 'Unique indexes not created.' });
    return summary;
  }

  try {
    summary.indexesCreated = await activateIdentityIndexes(knex, after, log);
  } catch (err) {
    summary.stopped = true;
    summary.reason = err.message;
    logLine(log, 'apply-stopped', { reason: 'index_create_failed' });
    return summary;
  }

  const verified = await runIntegrityAudit(knex);
  summary.finalIndexes = verified.indexes;
  summary.identityIndexes = verified.identityIndexes;
  summary.coverageAfter = verified.coverage;
  logLine(log, 'apply-complete', {
    fansUpdated: summary.fansUpdated,
    attendanceUpdated: summary.attendanceUpdated,
    fanIndex: verified.identityIndexes?.fan,
    campaignIndex: verified.identityIndexes?.campaign,
    eventIndex: verified.identityIndexes?.event,
  });
  return summary;
}

module.exports = {
  BATCH_SIZE,
  runCanonicalIdentityKeyBackfill,
  fetchFanRowsNeedingKeys,
  fetchAttendanceRows,
  attendanceNeedsKeys,
};
