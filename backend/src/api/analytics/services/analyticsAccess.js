'use strict';

/**
 * Authorization gate for private artist analytics.
 *
 * Every analytics read is scoped by an id in the query string (`bandId`,
 * `eventId`, `qrId`, or `entityType`+`entityId`). Those ids are guessable
 * sequential integers, so an id is an argument — never proof of access. This
 * module resolves the owning band for whatever the caller asked about and then
 * checks the caller's real band role.
 *
 * Returns a denial descriptor instead of writing to `ctx` so each controller
 * keeps using the repo's `return ctx.unauthorized(...)` convention.
 */

const { requireBandPermission, getBandRole } = require('../../../utils/bandRoles');

const ENTITY_TYPES = ['band', 'event', 'qr'];

const deny = (status, message) => ({ ok: false, status, message });
const allow = (bandId, access) => ({ ok: true, bandId, access });

/**
 * Identify the caller the same way `src/api/labs/utils/labsAuth.js` does:
 * prefer `ctx.state.user`, otherwise verify the Bearer token ourselves.
 *
 * Route config drift to `auth: false` is what created this exposure in the
 * first place, and `auth: false` leaves `ctx.state.user` unset. Resolving the
 * caller here means the gate keeps working either way instead of silently
 * depending on route configuration.
 */
async function resolveAnalyticsUser(ctx, strapi) {
  if (ctx.state?.user?.id) return ctx.state.user;

  const header = ctx.request?.headers?.authorization || ctx.request?.headers?.Authorization || '';
  const raw = typeof header === 'string' ? header : '';
  const token = raw.startsWith('Bearer ') ? raw.slice(7).trim() : '';
  if (!token) return null;

  try {
    const payload = await strapi.plugins['users-permissions'].services.jwt.verify(token);
    const id = payload?.id;
    if (!id) return null;
    return strapi.db.query('plugin::users-permissions.user').findOne({
      where: { id },
      select: ['id', 'email'],
    });
  } catch {
    return null;
  }
}

/** Resolve a band by slug (used by the follows read, which accepts either). */
async function resolveBandIdFromSlug(strapi, bandSlug) {
  const slug = String(bandSlug || '').trim();
  if (!slug) return null;

  const bands = await strapi.entityService.findMany('api::band.band', {
    filters: { slug },
    fields: ['id'],
    limit: 1,
  });

  return bands.length ? bands[0].id : null;
}

/**
 * Authorize a band-scoped analytics read.
 *
 * @param {'viewAnalytics'} permissionKey
 */
async function bandGate(user, strapi, bandId, permissionKey) {
  const id = Number(bandId);
  if (!Number.isFinite(id) || id <= 0) return deny(400, 'A valid band is required');

  const access = await requireBandPermission(strapi, user.id, id, permissionKey);
  if (!access) return deny(403, "You do not have access to this band's analytics");

  return allow(id, access);
}

async function requireBandAnalytics(ctx, strapi, bandId, permissionKey = 'viewAnalytics') {
  const user = await resolveAnalyticsUser(ctx, strapi);
  if (!user) return deny(401, 'Authentication required');

  return bandGate(user, strapi, bandId, permissionKey);
}

/**
 * Authorize an event-scoped analytics read by resolving the event's band.
 * A 404 for a missing event is safe: event pages are public, so existence is
 * not a secret. The analytics behind them still requires band access.
 */
async function requireEventAnalytics(ctx, strapi, eventId) {
  const user = await resolveAnalyticsUser(ctx, strapi);
  if (!user) return deny(401, 'Authentication required');

  const id = Number(eventId);
  if (!Number.isFinite(id) || id <= 0) return deny(400, 'A valid event is required');

  const event = await strapi.entityService.findOne('api::event.event', id, {
    fields: ['id'],
    populate: { band: { fields: ['id'] } },
  });
  if (!event) return deny(404, 'Event not found');

  const bandId = event.band?.id || event.band;
  if (!bandId) return deny(403, 'This event is not linked to a band you can access');

  return bandGate(user, strapi, bandId, 'viewAnalytics');
}

/**
 * Authorize a QR-scoped analytics read.
 *
 * Mirrors `api::qr.owns-qr`: band owner/manager/viewer via the band, OR the
 * legacy per-user QR owner (`users_permissions_user`) for QRs created before
 * bands existed. Dropping the legacy path would lock those artists out of
 * their own scan history.
 */
async function requireQrAnalytics(ctx, strapi, qrId) {
  const user = await resolveAnalyticsUser(ctx, strapi);
  if (!user) return deny(401, 'Authentication required');

  const id = Number(qrId);
  if (!Number.isFinite(id) || id <= 0) return deny(400, 'A valid QR is required');

  const qr = await strapi.entityService.findOne('api::qr.qr', id, {
    fields: ['id'],
    populate: {
      band: { fields: ['id'] },
      users_permissions_user: { fields: ['id'] },
    },
  });
  if (!qr) return deny(404, 'QR not found');

  if (String(qr.users_permissions_user?.id) === String(user.id)) {
    return allow(qr.band?.id || null, { role: 'owner', legacyQrOwner: true });
  }

  const bandId = qr.band?.id || qr.band;
  if (!bandId) return deny(403, 'You do not have access to this QR');

  const role = await getBandRole(strapi, bandId, user.id);
  if (!role) return deny(403, "You do not have access to this QR's analytics");

  return allow(bandId, { role });
}

/**
 * Authorize the `entityType` + `entityId` shaped reads (pulse, geo-states).
 */
async function requireEntityAnalytics(ctx, strapi, entityType, entityId) {
  const type = String(entityType || '').toLowerCase();
  if (!ENTITY_TYPES.includes(type)) {
    return deny(400, 'entityType must be band, event, or qr');
  }

  if (type === 'band') return requireBandAnalytics(ctx, strapi, entityId);
  if (type === 'event') return requireEventAnalytics(ctx, strapi, entityId);
  return requireQrAnalytics(ctx, strapi, entityId);
}

/** Apply a denial descriptor using the controller's ctx helpers. */
function respondDenied(ctx, denial) {
  if (denial.status === 401) return ctx.unauthorized(denial.message);
  if (denial.status === 403) return ctx.forbidden(denial.message);
  if (denial.status === 404) return ctx.notFound(denial.message);
  return ctx.badRequest(denial.message);
}

module.exports = {
  ENTITY_TYPES,
  resolveAnalyticsUser,
  resolveBandIdFromSlug,
  requireBandAnalytics,
  requireEventAnalytics,
  requireQrAnalytics,
  requireEntityAnalytics,
  respondDenied,
};
