'use strict';

/**
 * Server-derived scope for the QR list endpoint (`GET /qrs`).
 *
 * The endpoint used to be `auth: false` and read
 * `filters[users_permissions_user][id][$eq]` straight from the caller, so
 * changing one query parameter returned somebody else's QR codes — and omitting
 * it fell through to a full unscoped listing.
 *
 * Scope now comes from the session. Any user filter in the query string is
 * ignored rather than honoured. A caller may additionally ask for one band's
 * QRs, which is checked against their real band role using the same
 * owner/manager rule as `api::qr.owns-qr`.
 */

const { getBandRole, ROLE_OWNER, ROLE_MANAGER } = require('./bandRoles');

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

const deny = (status, message) => ({ ok: false, status, message });

function parsePositiveInt(raw) {
  if (raw == null || raw === '') return null;
  const n = Number(raw);
  if (!Number.isInteger(n) || n <= 0) return null;
  return n;
}

/**
 * A band may be requested as `?bandId=7` or through the Strapi filter shapes
 * the frontend already uses. Anything unparseable is treated as "not asked for"
 * so it falls back to the caller's own QRs instead of widening the scope.
 */
function readRequestedBandId(query = {}) {
  const band = query?.filters?.band;
  const candidates = [
    query?.bandId,
    band?.id?.$eq,
    band?.id?.['$eq'],
    band?.id,
    band?.$eq,
    typeof band === 'string' || typeof band === 'number' ? band : null,
  ];

  for (const candidate of candidates) {
    const parsed = parsePositiveInt(candidate);
    if (parsed) return parsed;
  }
  return null;
}

/**
 * Resolve the filters a QR list request is allowed to run with.
 *
 * @returns {Promise<{ok:true,filters:object,scope:'user'|'band'}|{ok:false,status:number,message:string}>}
 */
async function resolveQrListScope(ctx, strapi) {
  const user = ctx?.state?.user;
  if (!user?.id) return deny(401, 'Authentication required');

  const requestedBandId = readRequestedBandId(ctx.query);

  if (requestedBandId) {
    const role = await getBandRole(strapi, requestedBandId, user.id);
    if (role !== ROLE_OWNER && role !== ROLE_MANAGER) {
      return deny(403, "You do not have access to this band's QR codes");
    }
    return {
      ok: true,
      scope: 'band',
      bandId: requestedBandId,
      filters: { band: { id: requestedBandId } },
    };
  }

  return {
    ok: true,
    scope: 'user',
    userId: user.id,
    filters: { users_permissions_user: { id: user.id } },
  };
}

/**
 * Clamp pagination. The previous handler passed `pageSize` through untouched,
 * which let one request pull an unbounded page.
 */
function resolveListPagination(pagination = {}) {
  const pageSize = parsePositiveInt(pagination?.pageSize) || DEFAULT_PAGE_SIZE;
  const limit = Math.min(pageSize, MAX_PAGE_SIZE);
  const start = Number(pagination?.start);

  return {
    start: Number.isFinite(start) && start > 0 ? Math.floor(start) : 0,
    limit,
    pageSize: limit,
  };
}

/** Apply a denial using the controller's ctx helpers. */
function respondScopeDenied(ctx, denial) {
  if (denial.status === 401) return ctx.unauthorized(denial.message);
  if (denial.status === 403) return ctx.forbidden(denial.message);
  return ctx.badRequest(denial.message);
}

module.exports = {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  parsePositiveInt,
  readRequestedBandId,
  resolveQrListScope,
  resolveListPagination,
  respondScopeDenied,
};
