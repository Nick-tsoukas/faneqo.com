'use strict';

/**
 * Milestone persistence. Callers never construct rows themselves.
 *
 * Canonical attendance / reply must not fail because Milestone persistence hiccuped.
 * Use reconcileFanArtistMilestonesSafe after the canonical write.
 */

const { assertType, assertStatus, EVALUATOR_VERSION } = require('./milestoneKeys');
const pure = require('./milestonePure');

const UID = 'api::milestone.milestone';

function logWrite(strapi, fields) {
  const parts = Object.entries(fields)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${k}=${v}`);
  strapi?.log?.info?.(`[Milestone] evt=milestone.write ${parts.join(' ')}`);
}

async function findByIdempotencyKey(strapi, key) {
  if (!key) return null;
  const rows = await strapi.entityService.findMany(UID, {
    filters: { idempotencyKey: key },
    limit: 1,
  });
  return rows?.[0] || null;
}

async function persistMilestone(strapi, input) {
  const type = assertType(input.type);
  const status = assertStatus(input.status || 'active');
  const bandId = pure.toId(input.band);
  if (!bandId) {
    const err = new Error('band is required');
    err.code = 'band_required';
    throw err;
  }
  const key = String(input.idempotencyKey || '');
  if (!key) {
    const err = new Error('idempotencyKey is required');
    err.code = 'idempotency_required';
    throw err;
  }
  const occurredAt = input.occurredAt;
  if (!occurredAt) {
    const err = new Error('occurredAt is required');
    err.code = 'occurred_required';
    throw err;
  }
  const evidence = pure.sanitizeEvidence(type, input.evidence);

  const existing = await findByIdempotencyKey(strapi, key);
  if (existing) return { ...existing, _duplicate: true };

  const data = {
    type,
    value: input.value == null ? null : Number(input.value),
    evidence,
    occurredAt,
    version: Number(input.version) || EVALUATOR_VERSION,
    status,
    band: bandId,
    subjectFan: pure.toId(input.subjectFan) || null,
    idempotencyKey: key,
    archivedAt: input.archivedAt || null,
  };

  try {
    const row = await strapi.entityService.create(UID, { data });
    return { ...row, _duplicate: false };
  } catch (err) {
    if (pure.isUniqueViolation(err)) {
      const again = await findByIdempotencyKey(strapi, key);
      if (again) return { ...again, _duplicate: true };
    }
    throw err;
  }
}

async function archiveMilestone(strapi, row, { reason } = {}) {
  if (!row?.id) return null;
  if (row.status === 'archived') return row;
  const updated = await strapi.entityService.update(UID, row.id, {
    data: {
      status: 'archived',
      archivedAt: new Date().toISOString(),
    },
  });
  logWrite(strapi, {
    status: 'archived',
    milestoneId: row.id,
    type: row.type,
    reason: reason || 'archive',
  });
  return updated;
}

async function restoreAndUpdateMilestone(strapi, row, draft, { reason } = {}) {
  if (!row?.id || !draft) return row;
  const updated = await strapi.entityService.update(UID, row.id, {
    data: {
      type: draft.type,
      value: draft.value,
      evidence: draft.evidence,
      occurredAt: draft.occurredAt,
      version: draft.version,
      status: 'active',
      archivedAt: null,
    },
  });
  logWrite(strapi, {
    status: reason || 'updated',
    milestoneId: row.id,
    type: draft.type,
  });
  return updated;
}

async function listFanMilestones(strapi, { bandId, fanId, includeArchived = false } = {}) {
  const bid = pure.toId(bandId);
  const fid = pure.toId(fanId);
  if (!bid || !fid) return [];
  const filters = { band: bid, subjectFan: fid };
  if (!includeArchived) {
    filters.status = { $ne: 'archived' };
  }
  const rows = await strapi.entityService.findMany(UID, {
    filters,
    sort: ['occurredAt:asc', 'id:asc'],
    limit: 50,
  });
  return rows || [];
}

module.exports = {
  UID,
  findByIdempotencyKey,
  persistMilestone,
  archiveMilestone,
  restoreAndUpdateMilestone,
  listFanMilestones,
  logWrite,
};
