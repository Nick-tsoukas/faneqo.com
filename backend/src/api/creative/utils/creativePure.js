'use strict';

/**
 * Validation and shaping for creative records. Pure.
 */

const TEMPLATE_IDS = ['artist-spotlight', 'song-spotlight', 'product-showcase', 'type-statement', 'education', 'show-promo'];
const FORMAT_IDS = ['post', 'feed', 'story', 'square'];
const KINDS = ['post', 'ad'];
const STATUSES = ['draft', 'ready'];
const RIGHTS = ['clear', 'needs_permission'];
const MAX_CONTENT_BYTES = 64 * 1024;
const MAX_SNAPSHOT_BYTES = 192 * 1024;
const MAX_LIST = 200;

function jsonBytes(value) {
  try {
    return Buffer.byteLength(JSON.stringify(value == null ? null : value), 'utf8');
  } catch {
    return Infinity;
  }
}

function text(value, max) {
  if (value == null) return null;
  const out = String(value).trim();
  if (!out) return null;
  return out.slice(0, max);
}

/**
 * Returns { ok: true, data } with only the writable fields, or
 * { ok: false, errors }.
 */
function sanitizeCreativeInput(body, { partial = false } = {}) {
  const input = body && typeof body === 'object' ? body : {};
  const errors = [];
  const data = {};

  const has = (key) => Object.prototype.hasOwnProperty.call(input, key);

  if (has('title') || !partial) {
    const title = text(input.title, 160);
    if (!title && !partial) errors.push('title is required');
    if (title) data.title = title;
  }
  if (has('templateId') || !partial) {
    if (!TEMPLATE_IDS.includes(input.templateId)) errors.push('templateId is invalid');
    else data.templateId = input.templateId;
  }
  if (has('kind') || !partial) {
    const kind = input.kind == null && partial ? undefined : input.kind;
    if (kind !== undefined) {
      if (!KINDS.includes(kind)) errors.push('kind is invalid');
      else data.kind = kind;
    }
  }
  if (has('status')) {
    if (!STATUSES.includes(input.status)) errors.push('status is invalid');
    else data.status = input.status;
  } else if (!partial) {
    data.status = 'draft';
  }
  if (has('formats') || !partial) {
    const formats = Array.isArray(input.formats) ? input.formats : [];
    if (!formats.length || !formats.every((f) => FORMAT_IDS.includes(f))) errors.push('formats are invalid');
    else data.formats = [...new Set(formats)];
  }
  if (has('primaryFormat') || !partial) {
    if (!FORMAT_IDS.includes(input.primaryFormat)) errors.push('primaryFormat is invalid');
    else data.primaryFormat = input.primaryFormat;
  }
  if (has('variant')) data.variant = text(input.variant, 40);
  if (has('content') || !partial) {
    if (!input.content || typeof input.content !== 'object' || Array.isArray(input.content)) errors.push('content must be an object');
    else if (jsonBytes(input.content) > MAX_CONTENT_BYTES) errors.push('content is too large');
    else data.content = input.content;
  }
  if (has('snapshot')) {
    if (input.snapshot != null && (typeof input.snapshot !== 'object' || Array.isArray(input.snapshot))) errors.push('snapshot must be an object');
    else if (jsonBytes(input.snapshot) > MAX_SNAPSHOT_BYTES) errors.push('snapshot is too large');
    else data.snapshot = input.snapshot == null ? null : input.snapshot;
  }
  if (has('rightsStatus')) {
    if (!RIGHTS.includes(input.rightsStatus)) errors.push('rightsStatus is invalid');
    else data.rightsStatus = input.rightsStatus;
  }
  if (has('sceneCount')) {
    const n = Number(input.sceneCount);
    if (!Number.isInteger(n) || n < 1 || n > 20) errors.push('sceneCount is invalid');
    else data.sceneCount = n;
  }
  if (has('bandId')) {
    const n = input.bandId == null ? null : Number(input.bandId);
    if (n != null && (!Number.isInteger(n) || n <= 0)) errors.push('bandId is invalid');
    else data.bandId = n;
  }
  if (has('bandSlug')) data.bandSlug = text(input.bandSlug, 120);
  if (has('artistName')) data.artistName = text(input.artistName, 160);

  if (errors.length) return { ok: false, errors };
  return { ok: true, data };
}

/** Public shape: never leaks ownerEmail or the owner relation. */
function presentCreative(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    templateId: row.templateId,
    kind: row.kind,
    status: row.status,
    formats: Array.isArray(row.formats) ? row.formats : [],
    primaryFormat: row.primaryFormat,
    variant: row.variant || null,
    content: row.content && typeof row.content === 'object' ? row.content : {},
    snapshot: row.snapshot && typeof row.snapshot === 'object' ? row.snapshot : null,
    rightsStatus: row.rightsStatus || 'clear',
    sceneCount: row.sceneCount || 1,
    bandId: row.bandId ?? null,
    bandSlug: row.bandSlug || null,
    artistName: row.artistName || null,
    createdAt: row.createdAt || null,
    updatedAt: row.updatedAt || null,
  };
}

/** Light row for the library: no snapshot, no content. */
function presentCreativeCard(row) {
  const full = presentCreative(row);
  if (!full) return null;
  const { snapshot, ...rest } = full;
  return rest;
}

function parseId(raw) {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function clampPage(query = {}) {
  const start = Math.max(0, parseInt(query.start, 10) || 0);
  const limit = Math.min(MAX_LIST, Math.max(1, parseInt(query.limit, 10) || 100));
  return { start, limit };
}

module.exports = {
  TEMPLATE_IDS,
  FORMAT_IDS,
  KINDS,
  STATUSES,
  MAX_CONTENT_BYTES,
  MAX_SNAPSHOT_BYTES,
  sanitizeCreativeInput,
  presentCreative,
  presentCreativeCard,
  parseId,
  clampPage,
};
