'use strict';

/**
 * Canonical artist×fan show summary.
 *
 * Truth is unsuppressed fan_show_attendances rows (one row = one show),
 * never fans.checkedInShowCount, RelationshipEvent counts, or QR scans.
 *
 * returning = showCount >= 2
 */

const { canonicalAttendanceFilters, showStatsFromAttendances } = require('./canonicalAttendance');
const {
  resolveLayout,
  dialectOf,
  rawRows,
  validAttendanceExpr,
  attendanceFanExpr,
  attendanceFanJoin,
} = require('../integrity/fanAttendanceIntegrity');

function emptyShowSummary() {
  return {
    showCount: 0,
    firstShowAt: null,
    latestShowAt: null,
    returning: false,
  };
}

function summaryFromStats(stats) {
  const showCount = Number(stats?.showCount) || 0;
  return {
    showCount,
    firstShowAt: stats?.firstShow?.checkedInAt || null,
    latestShowAt: stats?.latestShow?.checkedInAt || null,
    returning: showCount >= 2,
  };
}

function rowToSummary(row) {
  const showCount = Number(row?.show_count ?? row?.showCount) || 0;
  return {
    showCount,
    firstShowAt: row?.first_show_at || row?.firstShowAt || null,
    latestShowAt: row?.latest_show_at || row?.latestShowAt || null,
    returning: showCount >= 2,
  };
}

function overlayFanShowSummary(fan, summary) {
  if (!fan) return fan;
  const next = summary || emptyShowSummary();
  const showCount = Number(next.showCount) || 0;
  return {
    ...fan,
    showCount,
    checkedInShowCount: showCount,
    firstShowAt: next.firstShowAt || null,
    latestShowAt: next.latestShowAt || null,
    returning: next.returning === true || showCount >= 2,
  };
}

function summariesFromAttendanceRows(rows) {
  const byFan = {};
  for (const row of rows || []) {
    const fanId = Number(row.fan?.id ?? row.fan);
    if (!fanId) continue;
    if (!byFan[fanId]) byFan[fanId] = [];
    byFan[fanId].push(row);
  }
  const out = {};
  for (const [fanId, list] of Object.entries(byFan)) {
    out[Number(fanId)] = summaryFromStats(showStatsFromAttendances(list));
  }
  return out;
}

function normalizeFanIds(fanIds) {
  return [...new Set((fanIds || []).map((id) => Number(id)).filter((n) => Number.isInteger(n) && n > 0))];
}

async function queryGroupedSummaries(knex, fanIds) {
  const layout = await resolveLayout(knex);
  if (layout.attFan === 'missing') return null;
  const dialect = dialectOf(knex);
  const fanExpr = attendanceFanExpr(layout);
  const fanJoin = attendanceFanJoin(layout);
  const valid = validAttendanceExpr(dialect, 'a');
  const placeholders = fanIds.map(() => '?').join(',');
  const sql = `
    SELECT ${fanExpr} AS fan_id,
           COUNT(*) AS show_count,
           MIN(a.checked_in_at) AS first_show_at,
           MAX(a.checked_in_at) AS latest_show_at
    FROM fan_show_attendances a
    ${fanJoin}
    WHERE ${fanExpr} IN (${placeholders})
      AND ${valid}
    GROUP BY ${fanExpr}
  `;
  return rawRows(await knex.raw(sql, fanIds));
}

async function getCanonicalFanShowSummaries(strapi, { fanIds } = {}) {
  const ids = normalizeFanIds(fanIds);
  const out = {};
  for (const id of ids) out[id] = emptyShowSummary();
  if (!ids.length) return out;

  const knex = strapi?.db?.connection;
  if (knex) {
    try {
      const grouped = await queryGroupedSummaries(knex, ids);
      if (grouped) {
        for (const row of grouped) {
          const fanId = Number(row.fan_id);
          if (!Object.prototype.hasOwnProperty.call(out, fanId)) continue;
          out[fanId] = rowToSummary(row);
        }
        return out;
      }
    } catch (err) {
      strapi.log?.warn?.(`[ShowSummary] grouped query failed: ${err.message}`);
    }
  }

  const rows = await strapi.entityService.findMany('api::fan-show-attendance.fan-show-attendance', {
    filters: canonicalAttendanceFilters({ fan: { id: { $in: ids } } }),
    fields: ['id', 'checkedInAt', 'suppressedDuplicate'],
    populate: { fan: { fields: ['id'] } },
    limit: Math.min(Math.max(ids.length * 80, 200), 5000),
  });
  const fromRows = summariesFromAttendanceRows(rows);
  for (const id of ids) {
    out[id] = fromRows[id] || emptyShowSummary();
  }
  return out;
}

async function getCanonicalFanShowSummary(strapi, { bandId, fanId } = {}) {
  const fid = Number(fanId);
  if (!fid) return emptyShowSummary();
  if (bandId) {
    const fan = await strapi.entityService.findOne('api::fan.fan', fid, {
      fields: ['id'],
      populate: { band: { fields: ['id'] } },
    });
    if (!fan) return emptyShowSummary();
    const bid = fan.band?.id ?? fan.band;
    if (Number(bid) !== Number(bandId)) return emptyShowSummary();
  }
  const map = await getCanonicalFanShowSummaries(strapi, { fanIds: [fid] });
  return map[fid] || emptyShowSummary();
}

function attendanceBandExpr(layout) {
  return layout.attBand === 'inline' ? 'a.band_id' : 'bl.band_id';
}

function attendanceBandJoin(layout) {
  return layout.attBand === 'links'
    ? 'INNER JOIN fan_show_attendances_band_links bl ON bl.fan_show_attendance_id = a.id'
    : '';
}

/**
 * Dashboard "repeat attendees" = subscribed fans of this band with canonical
 * showCount >= 2. One grouped query. Not fans.checkedInShowCount.
 */
async function queryReturningFanCount(knex, bandId, subscribedOnly) {
  const layout = await resolveLayout(knex);
  if (layout.attFan === 'missing') return null;
  if (layout.attBand === 'missing') return null;
  const dialect = dialectOf(knex);
  const fanExpr = attendanceFanExpr(layout);
  const fanJoin = attendanceFanJoin(layout);
  const bandExpr = attendanceBandExpr(layout);
  const bandJoin = attendanceBandJoin(layout);
  const valid = validAttendanceExpr(dialect, 'a');
  const statusJoin = subscribedOnly
    ? `INNER JOIN fans f ON f.id = ${fanExpr} AND f.status = 'subscribed'`
    : '';
  const sql = `
    SELECT COUNT(*) AS n FROM (
      SELECT ${fanExpr} AS fan_id
      FROM fan_show_attendances a
      ${fanJoin}
      ${bandJoin}
      ${statusJoin}
      WHERE ${bandExpr} = ?
        AND ${valid}
      GROUP BY ${fanExpr}
      HAVING COUNT(*) >= 2
    ) returning_fans
  `;
  const rows = rawRows(await knex.raw(sql, [bandId]));
  return Number(rows[0]?.n || rows[0]?.count || 0);
}

async function countCanonicalReturningFans(strapi, { bandId, subscribedOnly = true } = {}) {
  const bid = Number(bandId);
  if (!bid) return 0;

  const knex = strapi?.db?.connection;
  if (knex) {
    try {
      const grouped = await queryReturningFanCount(knex, bid, subscribedOnly);
      if (grouped != null) return grouped;
    } catch (err) {
      strapi.log?.warn?.(`[ShowSummary] returning-fan count failed: ${err.message}`);
    }
  }

  const rows = await strapi.entityService.findMany('api::fan-show-attendance.fan-show-attendance', {
    filters: canonicalAttendanceFilters({ band: bid }),
    fields: ['id', 'checkedInAt', 'suppressedDuplicate'],
    populate: { fan: { fields: ['id', 'status'] } },
    limit: 5000,
  });
  const byFan = {};
  for (const row of rows || []) {
    const fanId = Number(row.fan?.id ?? row.fan);
    if (!fanId) continue;
    if (subscribedOnly && row.fan && row.fan.status && row.fan.status !== 'subscribed') continue;
    if (!byFan[fanId]) byFan[fanId] = [];
    byFan[fanId].push(row);
  }
  let n = 0;
  for (const list of Object.values(byFan)) {
    if (summaryFromStats(showStatsFromAttendances(list)).returning) n += 1;
  }
  return n;
}

module.exports = {
  emptyShowSummary,
  summaryFromStats,
  overlayFanShowSummary,
  getCanonicalFanShowSummary,
  getCanonicalFanShowSummaries,
  countCanonicalReturningFans,
};
