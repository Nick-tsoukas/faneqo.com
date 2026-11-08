'use strict';

/**
 * Canonical attendance = a row that still counts as a show.
 * Schema default is false. Treat null the same as false so unique indexes
 * using `suppressed_duplicate IS NOT TRUE` match application lookups.
 *
 * Manual attendance with neither campaign nor event has no DB unique key
 * (the 24-hour heuristic is application-only). Do not invent one.
 */

const { isUniqueViolation } = require('./fanEmail');
const { attendanceIdentityKeys } = require('../integrity/canonicalIdentityKeys');

function isCanonicalAttendance(row) {
  if (!row) return false;
  return row.suppressedDuplicate !== true;
}

function canonicalAttendanceFilters(extra = {}) {
  return {
    ...extra,
    $or: [{ suppressedDuplicate: false }, { suppressedDuplicate: { $null: true } }],
  };
}

async function findAttendanceByIdentityKeys(strapi, { campaignIdentityKey = null, eventIdentityKey = null } = {}) {
  if (campaignIdentityKey) {
    const byCampaign = await strapi.entityService.findMany('api::fan-show-attendance.fan-show-attendance', {
      filters: canonicalAttendanceFilters({ campaignIdentityKey }),
      sort: ['id:asc'],
      limit: 1,
    });
    if (byCampaign?.[0]) return byCampaign[0];
  }
  if (eventIdentityKey) {
    const byEvent = await strapi.entityService.findMany('api::fan-show-attendance.fan-show-attendance', {
      filters: canonicalAttendanceFilters({ eventIdentityKey }),
      sort: ['id:asc'],
      limit: 1,
    });
    if (byEvent?.[0]) return byEvent[0];
  }
  return null;
}

async function findCanonicalAttendance(strapi, { fanId, campaignId = null, eventId = null }) {
  if (!fanId) return null;
  if (campaignId) {
    const byCampaign = await strapi.entityService.findMany('api::fan-show-attendance.fan-show-attendance', {
      filters: canonicalAttendanceFilters({ fan: fanId, campaignId }),
      sort: ['id:asc'],
      limit: 1,
    });
    if (byCampaign?.[0]) return byCampaign[0];
  }
  if (eventId) {
    const byEvent = await strapi.entityService.findMany('api::fan-show-attendance.fan-show-attendance', {
      filters: canonicalAttendanceFilters({ fan: fanId, event: eventId }),
      sort: ['id:asc'],
      limit: 1,
    });
    if (byEvent?.[0]) return byEvent[0];
  }
  return null;
}

function shouldIncrementCheckedInShowCount(attendanceCreated, isNewFan) {
  return attendanceCreated === true && isNewFan !== true;
}

function withAttendanceIdentityKeys(data) {
  const payload = { ...data };
  const keys = attendanceIdentityKeys({
    fanId: data?.fan,
    campaignId: data?.campaignId,
    eventId: data?.event,
    suppressedDuplicate: data?.suppressedDuplicate,
  });
  payload.campaignIdentityKey = keys.campaignIdentityKey;
  payload.eventIdentityKey = keys.eventIdentityKey;
  return payload;
}

async function createAttendanceIdempotent(strapi, data) {
  const payload = withAttendanceIdentityKeys(data);
  try {
    const attendance = await strapi.entityService.create('api::fan-show-attendance.fan-show-attendance', {
      data: payload,
    });
    return { created: true, attendance };
  } catch (err) {
    if (!isUniqueViolation(err)) throw err;
    const attendance =
      (await findAttendanceByIdentityKeys(strapi, {
        campaignIdentityKey: payload.campaignIdentityKey,
        eventIdentityKey: payload.eventIdentityKey,
      })) ||
      (await findCanonicalAttendance(strapi, {
        fanId: payload.fan,
        campaignId: payload.campaignId || null,
        eventId: payload.event || null,
      }));
    if (!attendance) throw err;
    return { created: false, attendance };
  }
}

/**
 * Canonical show-count contract for Passport / milestones.
 * Do not use checkedInShowCount, fan-interaction rows, QR scans, or RelationshipEvent counts.
 */
function showStatsFromAttendances(rows) {
  const canonical = (rows || []).filter(isCanonicalAttendance).sort((a, b) => {
    const ta = new Date(a.checkedInAt || 0).getTime();
    const tb = new Date(b.checkedInAt || 0).getTime();
    if (ta !== tb) return ta - tb;
    return Number(a.id) - Number(b.id);
  });
  const count = canonical.length;
  return {
    showCount: count,
    firstShow: canonical[0] || null,
    latestShow: count ? canonical[count - 1] : null,
    returningFan: count >= 2,
  };
}

function attendanceFanId(row) {
  return Number(row?.fan?.id ?? row?.fan) || 0;
}

function attendanceCity(row) {
  if (typeof row?.city !== 'string') return null;
  const city = row.city.trim();
  return city || null;
}

/**
 * Fans with more than one distinct non-empty city on canonical attendance.
 * Suppressed duplicates do not count. Empty / whitespace cities do not count.
 */
function countMultiCityAttendees(rows) {
  const citiesByFan = new Map();
  for (const row of rows || []) {
    if (!isCanonicalAttendance(row)) continue;
    const fanId = attendanceFanId(row);
    const city = attendanceCity(row);
    if (!fanId || !city) continue;
    if (!citiesByFan.has(fanId)) citiesByFan.set(fanId, new Set());
    citiesByFan.get(fanId).add(city);
  }
  let n = 0;
  for (const cities of citiesByFan.values()) {
    if (cities.size > 1) n += 1;
  }
  return n;
}

async function countBandMultiCityAttendees(strapi, { bandId } = {}) {
  const bid = Number(bandId);
  if (!Number.isInteger(bid) || bid <= 0) return 0;

  const rows = await strapi.entityService.findMany('api::fan-show-attendance.fan-show-attendance', {
    filters: canonicalAttendanceFilters({ band: bid }),
    fields: ['id', 'city', 'suppressedDuplicate'],
    populate: { fan: { fields: ['id'] } },
    limit: 5000,
  });
  return countMultiCityAttendees(rows);
}

module.exports = {
  isCanonicalAttendance,
  canonicalAttendanceFilters,
  findAttendanceByIdentityKeys,
  findCanonicalAttendance,
  shouldIncrementCheckedInShowCount,
  withAttendanceIdentityKeys,
  createAttendanceIdempotent,
  showStatsFromAttendances,
  countMultiCityAttendees,
  countBandMultiCityAttendees,
};
