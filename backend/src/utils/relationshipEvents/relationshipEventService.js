'use strict';

/**
 * RelationshipEvent write/read. Callers never construct ledger rows themselves.
 *
 * Canonical writes must not fail because the ledger hiccuped:
 * use recordRelationshipEventSafe after the canonical transaction.
 */

const {
  assertEventType,
  assertSourceType,
  assertVisibility,
  defaultVisibilityFor,
  idempotencyKey,
} = require('./relationshipEventKeys');

const UID = 'api::relationship-event.relationship-event';
const SCHEMA_VERSION = 1;
const DEFAULT_LIMIT = 30;
const MAX_LIMIT = 50;

const FORBIDDEN_METADATA_KEYS = new Set([
  'body',
  'bodyText',
  'html',
  'email',
  'message',
  'attachmentIds',
  'attachments',
  'token',
  'accessToken',
]);

function isUniqueViolation(err) {
  if (!err) return false;
  const code = String(err.code || '');
  if (code === '23505' || code === 'UNIQUE_VIOLATION' || code === 'SQLITE_CONSTRAINT') return true;
  const msg = String(err.message || '').toLowerCase();
  return msg.includes('unique') && (msg.includes('constraint') || msg.includes('duplicate') || msg.includes('idempotency'));
}

function toId(value) {
  if (value == null || value === '') return null;
  if (typeof value === 'object') return value.id || value.fanId || value.bandId || null;
  return value;
}

function sanitizeMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return null;
  const out = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (FORBIDDEN_METADATA_KEYS.has(key)) continue;
    if (value == null || value === '') continue;
    if (typeof value === 'object') continue;
    out[key] = value;
  }
  return Object.keys(out).length ? out : null;
}

function logWrite(strapi, fields) {
  const parts = Object.entries(fields)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${k}=${v}`);
  strapi?.log?.info?.(`[RelationshipEvent] evt=relationship_event.write ${parts.join(' ')}`);
}

async function findByIdempotencyKey(strapi, key) {
  const rows = await strapi.entityService.findMany(UID, {
    filters: { idempotencyKey: key },
    limit: 1,
  });
  return rows?.[0] || null;
}

async function recordRelationshipEvent(strapi, input) {
  const type = assertEventType(input.type);
  const sourceType = assertSourceType(input.sourceType);
  const bandId = toId(input.bandId ?? input.band);
  if (!bandId) {
    const err = new Error('bandId is required');
    err.code = 'band_required';
    throw err;
  }
  const fanId = toId(input.fanId ?? input.fan);
  const sourceId = String(input.sourceId ?? '');
  if (!sourceId) {
    const err = new Error('sourceId is required');
    err.code = 'source_required';
    throw err;
  }
  const visibility = assertVisibility(input.visibility || defaultVisibilityFor(type));
  const key = input.idempotencyKey ? String(input.idempotencyKey) : idempotencyKey(type, sourceId);
  const occurredAt = input.occurredAt || new Date().toISOString();

  const existing = await findByIdempotencyKey(strapi, key);
  if (existing) return { ...existing, _duplicate: true };

  const data = {
    type,
    band: bandId,
    fan: fanId || null,
    occurredAt,
    sourceType,
    sourceId,
    idempotencyKey: key,
    metadata: sanitizeMetadata(input.metadata),
    visibility,
    schemaVersion: SCHEMA_VERSION,
  };

  try {
    const row = await strapi.entityService.create(UID, { data });
    return { ...row, _duplicate: false };
  } catch (err) {
    if (isUniqueViolation(err)) {
      const again = await findByIdempotencyKey(strapi, key);
      if (again) return { ...again, _duplicate: true };
    }
    throw err;
  }
}

async function recordRelationshipEventSafe(strapi, input) {
  const started = Date.now();
  try {
    const row = await recordRelationshipEvent(strapi, input);
    logWrite(strapi, {
      status: row._duplicate ? 'duplicate' : 'ok',
      type: input.type,
      bandId: toId(input.bandId ?? input.band),
      fanId: toId(input.fanId ?? input.fan) || '',
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      durationMs: Date.now() - started,
    });
    return row;
  } catch (err) {
    logWrite(strapi, {
      status: 'error',
      type: input.type,
      bandId: toId(input.bandId ?? input.band),
      fanId: toId(input.fanId ?? input.fan) || '',
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      durationMs: Date.now() - started,
      errorCode: err.code || 'write_failed',
    });
    return null;
  }
}

function parseCursor(cursor) {
  if (!cursor || typeof cursor !== 'string') return null;
  const idx = cursor.lastIndexOf('|');
  if (idx < 1) return null;
  const occurredAt = cursor.slice(0, idx);
  const id = Number(cursor.slice(idx + 1));
  if (!occurredAt || !Number.isInteger(id) || id <= 0) return null;
  return { occurredAt, id };
}

function encodeCursor(row) {
  if (!row?.occurredAt || !row?.id) return null;
  const t = row.occurredAt instanceof Date ? row.occurredAt.toISOString() : String(row.occurredAt);
  return `${t}|${row.id}`;
}

function cursorWhere(cursor) {
  if (!cursor) return {};
  return {
    $or: [
      { occurredAt: { $lt: cursor.occurredAt } },
      { occurredAt: cursor.occurredAt, id: { $lt: cursor.id } },
    ],
  };
}

function toDto(row) {
  if (!row) return null;
  return {
    id: row.id,
    type: row.type,
    occurredAt: row.occurredAt,
    sourceType: row.sourceType,
    sourceId: row.sourceId,
    metadata: row.metadata && typeof row.metadata === 'object' ? row.metadata : null,
    visibility: row.visibility,
    schemaVersion: row.schemaVersion,
    fanId: toId(row.fan),
    bandId: toId(row.band),
  };
}

async function loadFanAttendanceKeys(strapi, { fanId, bandId }) {
  const rows = await strapi.entityService.findMany('api::fan-show-attendance.fan-show-attendance', {
    filters: require('../fans/canonicalAttendance').canonicalAttendanceFilters({ fan: fanId, band: bandId }),
    fields: ['id', 'campaignId'],
    populate: { event: { fields: ['id'] } },
    limit: 200,
  });
  const eventIds = new Set();
  const campaignIds = new Set();
  for (const row of rows || []) {
    const eventId = row.event?.id || row.event;
    if (eventId) eventIds.add(String(eventId));
    if (row.campaignId) campaignIds.add(String(row.campaignId));
  }
  return { eventIds, campaignIds };
}

function attendedFromKeys(keys, eventId, campaignId) {
  if (eventId && keys.eventIds.has(String(eventId))) return true;
  if (campaignId && keys.campaignIds.has(String(campaignId))) return true;
  return false;
}

function broadcastAllowed({ event, fan, attended, viewer, includeFanOnly }) {
  if (event.visibility === 'fan_only' && viewer === 'artist' && !includeFanOnly) return false;
  if (event.visibility === 'artist_only' && viewer === 'fan') return false;
  if (event.visibility !== 'derived_from_source') return true;

  const sourceVis = event.metadata?.visibility;
  if (sourceVis === 'public') return true;
  if (sourceVis === 'fan_list') return fan?.status === 'subscribed';
  if (sourceVis === 'show_attendees') return Boolean(attended);
  return false;
}

async function getRelationshipTimeline(strapi, { bandId, fanId, viewer = 'artist', includeFanOnly = false, cursor, limit } = {}) {
  const bid = toId(bandId);
  const fid = toId(fanId);
  if (!bid || !fid) {
    const err = new Error('bandId and fanId are required');
    err.code = 'timeline_context_required';
    throw err;
  }
  const take = Math.min(Math.max(Number(limit) || DEFAULT_LIMIT, 1), MAX_LIMIT);
  const parsed = parseCursor(cursor);
  const extra = cursorWhere(parsed);

  const [fanRows, broadcastRows, fan] = await Promise.all([
    strapi.entityService.findMany(UID, {
      filters: { band: bid, fan: fid, ...extra },
      sort: ['occurredAt:desc', 'id:desc'],
      limit: take,
    }),
    strapi.entityService.findMany(UID, {
      filters: { band: bid, fan: { $null: true }, ...extra },
      sort: ['occurredAt:desc', 'id:desc'],
      limit: take,
    }),
    strapi.entityService.findOne('api::fan.fan', fid, {
      fields: ['id', 'status', 'subscribedAt', 'email'],
      populate: { band: { fields: ['id'] } },
    }),
  ]);

  const fanBand = toId(fan?.band);
  if (!fan || String(fanBand) !== String(bid)) {
    return { items: [], nextCursor: null, fan: null };
  }

  const visibleBroadcast = [];
  const needsAttendance = (broadcastRows || []).some((row) => {
    const vis = row.metadata && typeof row.metadata === 'object' ? row.metadata.visibility : null;
    return vis === 'show_attendees' || row.type === 'show_gallery_added';
  });
  const attendanceKeys = needsAttendance
    ? await loadFanAttendanceKeys(strapi, { fanId: fid, bandId: bid })
    : { eventIds: new Set(), campaignIds: new Set() };

  for (const row of broadcastRows || []) {
    const meta = row.metadata && typeof row.metadata === 'object' ? row.metadata : {};
    const attended = attendedFromKeys(attendanceKeys, meta.eventId || null, meta.campaignId || null);
    if (broadcastAllowed({ event: { ...row, metadata: meta }, fan, attended, viewer, includeFanOnly })) {
      visibleBroadcast.push(row);
    }
  }

  const merged = [...(fanRows || []), ...visibleBroadcast]
    .filter((row) => {
      if (row.visibility === 'fan_only' && viewer === 'artist' && !includeFanOnly) return false;
      if (row.visibility === 'artist_only' && viewer === 'fan') return false;
      return true;
    })
    .sort((a, b) => {
      const ta = new Date(a.occurredAt).getTime();
      const tb = new Date(b.occurredAt).getTime();
      if (tb !== ta) return tb - ta;
      return Number(b.id) - Number(a.id);
    })
    .slice(0, take);

  const last = merged[merged.length - 1];
  return {
    items: merged.map(toDto),
    nextCursor: merged.length === take ? encodeCursor(last) : null,
    fan: {
      id: fan.id,
      status: fan.status,
      subscribedAt: fan.subscribedAt,
      email: fan.email,
    },
  };
}

async function countUnsuppressedAttendance(strapi, { fanId, bandId }) {
  return strapi.entityService.count('api::fan-show-attendance.fan-show-attendance', {
    filters: require('../fans/canonicalAttendance').canonicalAttendanceFilters({ fan: fanId, band: bandId }),
  });
}

module.exports = {
  UID,
  SCHEMA_VERSION,
  DEFAULT_LIMIT,
  MAX_LIMIT,
  FORBIDDEN_METADATA_KEYS,
  recordRelationshipEvent,
  recordRelationshipEventSafe,
  getRelationshipTimeline,
  countUnsuppressedAttendance,
  sanitizeMetadata,
  parseCursor,
  encodeCursor,
  broadcastAllowed,
  toDto,
};
