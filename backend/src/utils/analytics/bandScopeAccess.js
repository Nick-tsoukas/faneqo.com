'use strict';

/**
 * Shared authorization for band-scoped read routes registered with
 * `auth: false` — the established pattern in this repo (see
 * `src/api/labs/utils/labsAuth.js`). Route-level `auth: false` keeps a route
 * out of the users-permissions role matrix, so the guard must identify the
 * caller itself rather than relying on `ctx.state.user`.
 *
 * The band is always derived from the requested resource and then checked
 * against the caller's band role. An id in the URL never grants access.
 *
 * Fails closed: anything unresolved is a denial, never a pass-through.
 */

const SCOPE_BAND = 'band';
const SCOPE_EVENT = 'event';
const SCOPE_QR = 'qr';
const SCOPE_ENTITY = 'entity';
const SCOPE_RECORD = 'record';

const SCOPES = [SCOPE_BAND, SCOPE_EVENT, SCOPE_QR, SCOPE_ENTITY, SCOPE_RECORD];

/** `entityType` values accepted by the multi-entity analytics reads. */
const ENTITY_TYPE_TO_KIND = {
  band: SCOPE_BAND,
  event: SCOPE_EVENT,
  qr: SCOPE_QR,
};

const DEFAULT_PERMISSION = 'viewAnalytics';

/**
 * Denial message for anything the caller is not entitled to see. Deliberately
 * identical whether the resource is missing or simply not theirs, so the route
 * cannot be used to enumerate band, event or QR ids.
 */
const DENY_MESSAGE = 'You do not have access to this band';

function parsePositiveInt(raw) {
  if (raw === null || raw === undefined || raw === '') return null;
  const n = Number(raw);
  if (!Number.isInteger(n) || n <= 0) return null;
  return n;
}

function parseBearerToken(header) {
  const raw = typeof header === 'string' ? header : '';
  if (!raw.startsWith('Bearer ')) return '';
  return raw.slice(7).trim();
}

function denied(status, message, reason) {
  return { ok: false, status, message, reason };
}

/**
 * Which resource the route is scoped to. Pure — runs no queries.
 *
 * @returns {{ ok: true, kind: string, id: number } | { ok: false }}
 */
function resolveScopeTarget(scope, { query = {}, params = {} } = {}) {
  if (scope === SCOPE_ENTITY) {
    const entityType = String(query.entityType || '').toLowerCase();
    const kind = ENTITY_TYPE_TO_KIND[entityType];
    if (!kind) {
      return denied(400, 'entityType must be band, event, or qr', 'bad_entity_type');
    }
    const id = parsePositiveInt(query.entityId);
    if (!id) return denied(400, 'entityId required', 'missing_id');
    return { ok: true, kind, id };
  }

  if (scope === SCOPE_RECORD) {
    const id = parsePositiveInt(params.id);
    if (!id) return denied(400, 'id required', 'missing_id');
    return { ok: true, kind: SCOPE_RECORD, id };
  }

  if (scope === SCOPE_BAND) {
    const id = parsePositiveInt(query.bandId);
    if (!id) return denied(400, 'bandId required', 'missing_id');
    return { ok: true, kind: SCOPE_BAND, id };
  }

  if (scope === SCOPE_EVENT) {
    const id = parsePositiveInt(query.eventId);
    if (!id) return denied(400, 'eventId required', 'missing_id');
    return { ok: true, kind: SCOPE_EVENT, id };
  }

  if (scope === SCOPE_QR) {
    const id = parsePositiveInt(query.qrId);
    if (!id) return denied(400, 'qrId required', 'missing_id');
    return { ok: true, kind: SCOPE_QR, id };
  }

  return denied(403, DENY_MESSAGE, 'bad_scope_config');
}

/**
 * Identify the caller. `stateUser` is honoured when a route happens to run
 * under the default auth strategy; otherwise the bearer token is verified.
 */
async function resolveCallerId({ authorizationHeader, stateUser, verifyToken }) {
  if (stateUser && parsePositiveInt(stateUser.id)) {
    return parsePositiveInt(stateUser.id);
  }

  const token = parseBearerToken(authorizationHeader);
  if (!token) return null;
  if (typeof verifyToken !== 'function') return null;

  try {
    const payload = await verifyToken(token);
    return parsePositiveInt(payload?.id);
  } catch {
    return null;
  }
}

async function resolveBandId(kind, id, uid, deps) {
  if (kind === SCOPE_BAND) return id;

  try {
    if (kind === SCOPE_EVENT) return parsePositiveInt(await deps.findEventBandId(id));
    if (kind === SCOPE_QR) return parsePositiveInt(await deps.findQrBandId(id));
    if (kind === SCOPE_RECORD) return parsePositiveInt(await deps.findRecordBandId(uid, id));
  } catch {
    return null;
  }

  return null;
}

/**
 * Authorize a band-scoped request.
 *
 * Order matters: the caller is identified before any resource is read, so an
 * anonymous request never touches the database and never learns whether an id
 * exists.
 *
 * @returns {Promise<{ ok: true, userId: number, bandId: number, access: object, scopeKind: string }
 *   | { ok: false, status: number, message: string, reason: string }>}
 */
async function resolveBandScopeAccess({
  scope = SCOPE_BAND,
  uid = null,
  query = {},
  params = {},
  authorizationHeader = '',
  stateUser = null,
  deps = {},
} = {}) {
  if (!SCOPES.includes(scope)) {
    return denied(403, DENY_MESSAGE, 'bad_scope_config');
  }
  if (typeof deps.requirePermission !== 'function') {
    return denied(403, DENY_MESSAGE, 'guard_unavailable');
  }

  const userId = await resolveCallerId({
    authorizationHeader,
    stateUser,
    verifyToken: deps.verifyToken,
  });
  if (!userId) {
    return denied(401, 'Authentication required', 'unauthenticated');
  }

  const target = resolveScopeTarget(scope, { query, params });
  if (!target.ok) return target;

  const bandId = await resolveBandId(target.kind, target.id, uid, deps);
  if (!bandId) {
    return denied(403, DENY_MESSAGE, 'unknown_resource');
  }

  let access = null;
  try {
    access = await deps.requirePermission(userId, bandId);
  } catch {
    return denied(403, DENY_MESSAGE, 'permission_check_failed');
  }
  if (!access) {
    return denied(403, DENY_MESSAGE, 'no_band_access');
  }

  return { ok: true, userId, bandId, access, scopeKind: target.kind };
}

module.exports = {
  SCOPE_BAND,
  SCOPE_EVENT,
  SCOPE_QR,
  SCOPE_ENTITY,
  SCOPE_RECORD,
  SCOPES,
  DEFAULT_PERMISSION,
  DENY_MESSAGE,
  parsePositiveInt,
  parseBearerToken,
  resolveScopeTarget,
  resolveCallerId,
  resolveBandScopeAccess,
};
