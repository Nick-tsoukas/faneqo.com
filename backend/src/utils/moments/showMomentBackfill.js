'use strict';

/**
 * Idempotent show-Moment backfill from canonical unsuppressed attendance.
 *
 * Default is dry-run. Does not mutate attendance or fans.
 * Repeat execution is safe via idempotencyKey.
 */

const { showMomentIdempotencyKey } = require('./momentKeys');
const { isCanonicalAttendance } = require('../fans/canonicalAttendance');
const {
  resolveLayout,
  rawRows,
  attendanceFanExpr,
  attendanceFanJoin,
} = require('../integrity/fanAttendanceIntegrity');

function emptyReport() {
  return {
    scanned: 0,
    eligible: 0,
    suppressedSkipped: 0,
    ineligibleSkipped: 0,
    existing: 0,
    wouldCreate: 0,
    created: 0,
    duplicatesSkipped: 0,
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

async function loadExistingKeys(knex) {
  const keys = new Set();
  if (!(await knex.schema.hasTable('moments'))) return keys;
  if (!(await knex.schema.hasColumn('moments', 'idempotency_key'))) return keys;
  const rows = rawRows(await knex.raw('SELECT idempotency_key FROM moments'));
  for (const row of rows || []) {
    if (row.idempotency_key) keys.add(String(row.idempotency_key));
  }
  return keys;
}

async function scanEligibleAttendance(knex) {
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
           a.campaign_id AS campaign_id,
           a.suppressed_duplicate AS suppressed_duplicate
    FROM fan_show_attendances a
    ${fanJoin}
    ${bandJoin}
    ORDER BY a.id ASC
  `;
  return rawRows(await knex.raw(sql));
}

function classifyRow(row, existingKeys) {
  const suppressed = row.suppressed_duplicate === true || row.suppressed_duplicate === 1;
  if (suppressed) return { action: 'suppressed' };
  if (!row.id || !row.fan_id || !row.band_id || !row.checked_in_at) return { action: 'ineligible' };
  const key = showMomentIdempotencyKey(row.id);
  if (existingKeys.has(key)) return { action: 'existing', key };
  return { action: 'create', key, attendance: row };
}

async function planShowMomentBackfill(knex) {
  const report = emptyReport();
  const rows = await scanEligibleAttendance(knex);
  const existingKeys = await loadExistingKeys(knex);
  const wouldCreate = [];
  report.scanned = rows.length;
  for (const row of rows) {
    const classified = classifyRow(row, existingKeys);
    if (classified.action === 'suppressed') {
      report.suppressedSkipped += 1;
      continue;
    }
    if (classified.action === 'ineligible') {
      report.ineligibleSkipped += 1;
      continue;
    }
    report.eligible += 1;
    if (classified.action === 'existing') {
      report.existing += 1;
      continue;
    }
    report.wouldCreate += 1;
    wouldCreate.push({
      attendanceId: row.id,
      fanId: row.fan_id,
      bandId: row.band_id,
      idempotencyKey: classified.key,
    });
  }
  return { report, wouldCreate };
}

async function applyShowMomentBackfill(strapi, plan, { ensure } = {}) {
  const report = { ...plan.report };
  const createFn = ensure || require('./showMomentProducer').ensureShowMomentForAttendanceSafe;
  for (const item of plan.wouldCreate || []) {
    try {
      const row = await createFn(strapi, {
        id: item.attendanceId,
        fan: item.fanId,
        band: item.bandId,
      });
      if (row?._duplicate) report.duplicatesSkipped += 1;
      else if (row?.id) report.created += 1;
      else report.errors += 1;
    } catch {
      report.errors += 1;
    }
  }
  return report;
}

function isCanonicalAttendanceRow(row) {
  return isCanonicalAttendance({ suppressedDuplicate: row?.suppressedDuplicate ?? row?.suppressed_duplicate });
}

module.exports = {
  emptyReport,
  classifyRow,
  planShowMomentBackfill,
  applyShowMomentBackfill,
  isCanonicalAttendanceRow,
  loadExistingKeys,
};
