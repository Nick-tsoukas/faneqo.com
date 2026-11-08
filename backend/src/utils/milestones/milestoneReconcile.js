'use strict';

/**
 * Reconcile fan-scoped milestones against current canonical truth.
 *
 * Creates missing valid milestones, updates evidence/occurredAt when the
 * chronological sequence legitimately changes, and archives milestones
 * that canonical truth no longer supports.
 *
 * Canonical attendance / reply writes must not depend on this succeeding.
 */

const { canonicalAttendanceFilters } = require('../fans/canonicalAttendance');
const { PHASE_07_TYPES, FIRST_SHOW, SECOND_SHOW, FIRST_REPLY } = require('./milestoneKeys');
const {
  toId,
  orderedCanonicalAttendances,
  evaluateFirstShow,
  evaluateSecondShow,
  evaluateFirstReply,
  draftFromEvaluation,
  needsUpdate,
  isActiveMilestone,
} = require('./milestonePure');
const {
  persistMilestone,
  archiveMilestone,
  restoreAndUpdateMilestone,
  listFanMilestones,
  logWrite,
} = require('./milestoneService');

function emptyResult() {
  return {
    created: 0,
    updated: 0,
    archived: 0,
    unchanged: 0,
    skipped: 0,
    errors: 0,
    rows: [],
  };
}

async function loadOrderedCanonicalAttendances(strapi, { bandId, fanId }) {
  const rows = await strapi.entityService.findMany('api::fan-show-attendance.fan-show-attendance', {
    filters: canonicalAttendanceFilters({ fan: fanId, band: bandId }),
    fields: ['id', 'checkedInAt', 'suppressedDuplicate', 'campaignId'],
    populate: {
      fan: { fields: ['id'] },
      band: { fields: ['id'] },
    },
    sort: ['checkedInAt:asc', 'id:asc'],
    limit: 500,
  });
  return orderedCanonicalAttendances(rows);
}

/**
 * Targeted earliest fan_replied query. Not the 200-item progression slice.
 */
async function findEarliestFanReply(strapi, { bandId, fanId }) {
  const rows = await strapi.entityService.findMany('api::relationship-event.relationship-event', {
    filters: {
      band: bandId,
      fan: fanId,
      type: 'fan_replied',
    },
    fields: ['id', 'type', 'occurredAt'],
    sort: ['occurredAt:asc', 'id:asc'],
    limit: 1,
  });
  return rows?.[0] || null;
}

function evaluationsFromFacts({ attendances, earliestReply }) {
  return {
    [FIRST_SHOW]: evaluateFirstShow(attendances),
    [SECOND_SHOW]: evaluateSecondShow(attendances),
    [FIRST_REPLY]: evaluateFirstReply(earliestReply),
  };
}

function existingByType(rows) {
  const map = new Map();
  for (const row of rows || []) {
    if (row?.type) map.set(String(row.type), row);
  }
  return map;
}

async function applyDesired(strapi, { existing, desired, bandId, fanId }) {
  if (!desired) {
    if (existing && isActiveMilestone(existing)) {
      const archived = await archiveMilestone(strapi, existing, { reason: 'canonical_invalid' });
      return { action: 'archived', row: archived };
    }
    return { action: 'skipped', row: existing || null };
  }

  const draft = draftFromEvaluation({ bandId, subjectFanId: fanId, evaluation: desired });
  if (!existing) {
    const created = await persistMilestone(strapi, draft);
    return { action: created._duplicate ? 'unchanged' : 'created', row: created };
  }

  if (!needsUpdate(existing, draft) && isActiveMilestone(existing)) {
    return { action: 'unchanged', row: existing };
  }

  const updated = await restoreAndUpdateMilestone(strapi, existing, draft, {
    reason: isActiveMilestone(existing) ? 'reconciled' : 'restored',
  });
  return { action: 'updated', row: updated };
}

async function reconcileFanArtistMilestones(strapi, { bandId, fanId } = {}) {
  const bid = toId(bandId);
  const fid = toId(fanId);
  const result = emptyResult();
  if (!bid || !fid) {
    result.skipped = PHASE_07_TYPES.length;
    return result;
  }

  const [attendances, earliestReply, existingRows] = await Promise.all([
    loadOrderedCanonicalAttendances(strapi, { bandId: bid, fanId: fid }),
    findEarliestFanReply(strapi, { bandId: bid, fanId: fid }),
    listFanMilestones(strapi, { bandId: bid, fanId: fid, includeArchived: true }),
  ]);

  const desired = evaluationsFromFacts({ attendances, earliestReply });
  const existing = existingByType(existingRows);

  for (const type of PHASE_07_TYPES) {
    try {
      const applied = await applyDesired(strapi, {
        existing: existing.get(type) || null,
        desired: desired[type],
        bandId: bid,
        fanId: fid,
      });
      result[applied.action] += 1;
      if (applied.row) result.rows.push(applied.row);
    } catch (err) {
      result.errors += 1;
      strapi?.log?.warn?.(
        `[Milestone] reconcile type=${type} bandId=${bid} fanId=${fid} error=${err.message}`
      );
    }
  }

  return result;
}

async function reconcileFanArtistMilestonesSafe(strapi, { bandId, fanId } = {}) {
  const started = Date.now();
  const bid = toId(bandId);
  const fid = toId(fanId);
  try {
    const result = await reconcileFanArtistMilestones(strapi, { bandId: bid, fanId: fid });
    logWrite(strapi, {
      status: result.errors ? 'partial' : 'ok',
      bandId: bid,
      fanId: fid,
      created: result.created,
      updated: result.updated,
      archived: result.archived,
      durationMs: Date.now() - started,
    });
    return result;
  } catch (err) {
    logWrite(strapi, {
      status: 'error',
      bandId: bid,
      fanId: fid,
      durationMs: Date.now() - started,
      errorCode: err.code || 'write_failed',
    });
    strapi?.log?.warn?.(
      `[Milestone] repairable reconcile failure bandId=${bid} fanId=${fid} error=${err.message}`
    );
    return null;
  }
}

module.exports = {
  emptyResult,
  loadOrderedCanonicalAttendances,
  findEarliestFanReply,
  evaluationsFromFacts,
  reconcileFanArtistMilestones,
  reconcileFanArtistMilestonesSafe,
};
