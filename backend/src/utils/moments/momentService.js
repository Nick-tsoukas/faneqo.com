'use strict';

/**
 * Moment persistence. Callers never construct rows themselves.
 *
 * Canonical attendance must not fail because Moment persistence hiccuped.
 * Use ensureShowMomentForAttendanceSafe after the canonical write.
 */

const {
  assertKind,
  assertStatus,
  assertVisibility,
  assertCreatedByType,
  assertSourceType,
  SCHEMA_VERSION,
} = require('./momentKeys');
const pure = require('./momentPure');

const UID = 'api::moment.moment';

function logWrite(strapi, fields) {
  const parts = Object.entries(fields)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${k}=${v}`);
  strapi?.log?.info?.(`[Moment] evt=moment.write ${parts.join(' ')}`);
}

async function findByIdempotencyKey(strapi, key) {
  if (!key) return null;
  const rows = await strapi.entityService.findMany(UID, {
    filters: { idempotencyKey: key },
    limit: 1,
  });
  return rows?.[0] || null;
}

async function findBySource(strapi, { sourceType, sourceId }) {
  const rows = await strapi.entityService.findMany(UID, {
    filters: { sourceType, sourceId: String(sourceId) },
    limit: 4,
  });
  return rows || [];
}

async function persistMoment(strapi, input) {
  const kind = assertKind(input.kind);
  const status = assertStatus(input.status || 'candidate');
  const visibility = assertVisibility(input.visibility);
  const createdByType = assertCreatedByType(input.createdByType || 'system');
  const sourceType = assertSourceType(input.sourceType);
  const bandId = pure.toId(input.band);
  if (!bandId) {
    const err = new Error('band is required');
    err.code = 'band_required';
    throw err;
  }
  const sourceId = String(input.sourceId ?? '');
  if (!sourceId) {
    const err = new Error('sourceId is required');
    err.code = 'source_required';
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

  const existing = await findByIdempotencyKey(strapi, key);
  if (existing) return { ...existing, _duplicate: true };

  const data = {
    kind,
    status,
    visibility,
    band: bandId,
    subjectFan: pure.toId(input.subjectFan) || null,
    occurredAt,
    createdByType,
    createdByUserId: input.createdByUserId || null,
    sourceType,
    sourceId,
    idempotencyKey: key,
    shareable: input.shareable === true,
    publishedAt: input.publishedAt || null,
    archivedAt: input.archivedAt || null,
    schemaVersion: Number(input.schemaVersion) || SCHEMA_VERSION,
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

async function archiveMoment(strapi, row, { reason } = {}) {
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
    momentId: row.id,
    reason: reason || 'archive',
  });
  return updated;
}

async function listFanMoments(strapi, { bandId, fanId, includeArchived = false } = {}) {
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
    limit: 200,
  });
  return rows || [];
}

module.exports = {
  UID,
  findByIdempotencyKey,
  findBySource,
  persistMoment,
  archiveMoment,
  listFanMoments,
  logWrite,
};
