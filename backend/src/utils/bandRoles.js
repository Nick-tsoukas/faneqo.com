'use strict';

/**
 * Central band role/permission helper (Team Access V1).
 *
 * Roles (page/team access only — NOT equity or company ownership):
 *   owner   — full access: manage team, billing, payout/Connect, delete band, fan PII/messaging
 *   manager — edit page/links/music/video/events, Show Mode, analytics (no billing/payouts/delete/team/fan PII)
 *   viewer  — read-only dashboard/analytics/Show Mode status
 *
 * Source of truth:
 *   1. Active `band-member` row for (band, user).
 *   2. LEGACY FALLBACK: `band.users_permissions_user` relation → treated as
 *      `owner`. When the fallback matches, an owner member row is lazily
 *      backfilled (best-effort, never fatal) so future checks hit path 1.
 */

const ROLE_OWNER = 'owner';
const ROLE_MANAGER = 'manager';
const ROLE_VIEWER = 'viewer';

const ALL_ROLES = [ROLE_OWNER, ROLE_MANAGER, ROLE_VIEWER];

/** Band scalar/relation keys managers must not write via PUT /bands/:id */
const OWNER_ONLY_BAND_FIELDS = [
  'users_permissions_user',
  'stripeAccountId',
  'paymentsEnabled',
  'stripeOnboardingComplete',
  'stripeChargesEnabled',
  'stripeDetailsSubmitted',
  'stripePayoutsEnabled',
];

/**
 * Permission matrix — single authoritative product model.
 * Fan messaging / PII stay owner-only until Messaging expands this deliberately.
 */
function permissionsForRole(role) {
  if (role === ROLE_OWNER) {
    return {
      editBand: true,
      manageEvents: true,
      manageQrs: true,
      viewAnalytics: true,
      operateShowMode: true,
      viewShowMode: true,
      manageTeam: true,
      manageBilling: true,
      managePayments: true,
      deleteBand: true,
      viewFanPII: true,
      sendFanMessages: true,
      manageFanList: true,
      viewFanIntelligence: true,
    };
  }
  if (role === ROLE_MANAGER) {
    return {
      editBand: true,
      manageEvents: true,
      manageQrs: true,
      viewAnalytics: true,
      operateShowMode: true,
      viewShowMode: true,
      manageTeam: false,
      manageBilling: false,
      managePayments: false,
      deleteBand: false,
      viewFanPII: false,
      sendFanMessages: false,
      manageFanList: false,
      viewFanIntelligence: false,
    };
  }
  if (role === ROLE_VIEWER) {
    return {
      editBand: false,
      manageEvents: false,
      manageQrs: false,
      viewAnalytics: true,
      operateShowMode: false,
      viewShowMode: true,
      manageTeam: false,
      manageBilling: false,
      managePayments: false,
      deleteBand: false,
      viewFanPII: false,
      sendFanMessages: false,
      manageFanList: false,
      viewFanIntelligence: false,
    };
  }
  return {
    editBand: false,
    manageEvents: false,
    manageQrs: false,
    viewAnalytics: false,
    operateShowMode: false,
    viewShowMode: false,
    manageTeam: false,
    manageBilling: false,
    managePayments: false,
    deleteBand: false,
    viewFanPII: false,
    sendFanMessages: false,
    manageFanList: false,
    viewFanIntelligence: false,
  };
}

/**
 * Best-effort creation of the owner's band-member row.
 * Never throws; duplicates are guarded (and tolerated if racing).
 */
async function ensureOwnerMemberRow(strapi, bandId, userId) {
  try {
    const existing = await strapi.entityService.findMany('api::band-member.band-member', {
      filters: { band: bandId, user: userId },
      limit: 1,
    });
    if (existing.length) return;

    await strapi.entityService.create('api::band-member.band-member', {
      data: {
        band: bandId,
        user: userId,
        role: ROLE_OWNER,
        status: 'active',
        acceptedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    // Backfill is an optimization only — legacy fallback still grants owner.
    strapi.log.warn(`[bandRoles] owner member backfill failed (band ${bandId}, user ${userId}): ${err.message}`);
  }
}

/**
 * Resolve the caller's role for a band.
 *
 * @returns {Promise<'owner'|'manager'|'viewer'|null>} null = no access
 */
async function getBandRole(strapi, bandId, userId) {
  if (!bandId || !userId) return null;

  // 1) Explicit active membership
  const members = await strapi.entityService.findMany('api::band-member.band-member', {
    filters: { band: bandId, user: userId, status: 'active' },
    limit: 1,
  });
  if (members.length && ALL_ROLES.includes(members[0].role)) {
    return members[0].role;
  }

  // 2) Legacy owner fallback — canonical owner relation on the band
  const band = await strapi.entityService.findOne('api::band.band', bandId, {
    populate: ['users_permissions_user'],
  });
  if (!band) return null;

  // Same identity check as `api::band.owns-band` (string-coerced — Strapi ids may be number|string).
  if (String(band.users_permissions_user?.id) === String(userId)) {
    // Lazy backfill — best-effort only; legacy relation remains authoritative.
    await ensureOwnerMemberRow(strapi, bandId, userId);
    return ROLE_OWNER;
  }

  return null;
}

/**
 * Authoritative access object for a (user, band) pair.
 *
 * @returns {Promise<{ hasAccess: boolean, role: string|null, permissions: object }>}
 */
async function resolveBandAccess(strapi, userId, bandId) {
  const role = await getBandRole(strapi, bandId, userId);
  if (!role) {
    return {
      hasAccess: false,
      role: null,
      permissions: permissionsForRole(null),
    };
  }
  return {
    hasAccess: true,
    role,
    permissions: permissionsForRole(role),
  };
}

/**
 * Convenience: does the user hold one of the allowed roles for the band?
 *
 * @param {string[]} allowedRoles e.g. ['owner'] or ['owner','manager']
 */
async function userHasBandRole(strapi, bandId, userId, allowedRoles) {
  const roles = Array.isArray(allowedRoles) && allowedRoles.length ? allowedRoles : [ROLE_OWNER];
  const role = await getBandRole(strapi, bandId, userId);
  return role !== null && roles.includes(role);
}

/**
 * Require a named permission for a band. Returns access or null.
 *
 * @param {string} permissionKey e.g. 'editBand', 'viewFanPII'
 */
async function requireBandPermission(strapi, userId, bandId, permissionKey) {
  const access = await resolveBandAccess(strapi, userId, bandId);
  if (!access.hasAccess || !access.permissions?.[permissionKey]) {
    return null;
  }
  return access;
}

/**
 * Every band id where the user holds `permissionKey` (owner relation or active membership).
 * Used to scope list reads; per-band checks should keep using requireBandPermission.
 */
async function listBandIdsWithPermission(strapi, userId, permissionKey) {
  if (!userId) return [];
  const ids = new Set();

  const owned = await strapi.entityService.findMany('api::band.band', {
    filters: { users_permissions_user: { id: userId } },
    fields: ['id'],
    limit: 1000,
  });
  for (const band of owned || []) ids.add(band.id);

  const members = await strapi.entityService.findMany('api::band-member.band-member', {
    filters: { user: userId, status: 'active' },
    populate: { band: { fields: ['id'] } },
    limit: 1000,
  });
  for (const m of members || []) {
    if (m.band?.id && permissionsForRole(m.role)[permissionKey]) ids.add(m.band.id);
  }

  return [...ids];
}

function omitKeys(data, keys) {
  if (!data || typeof data !== 'object') return data;
  const next = { ...data };
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(next, key)) {
      delete next[key];
    }
  }
  return next;
}

/**
 * Strip owner-only keys from a band update payload (mutates a shallow copy).
 */
function stripOwnerOnlyBandFields(data) {
  return omitKeys(data, OWNER_ONLY_BAND_FIELDS);
}

/**
 * No client — owner included — may set these through band create/update.
 * Stripe Connect state is written only by payment onboarding and the Connect
 * webhook, or a suspended band could simply switch its own payments back on.
 * The owner comes from the signed-in account (see assignNewBandOwner), never
 * from the body, or an account could create or move a band into someone
 * else's name and slip past the one-band limit and blocked-owner checks.
 */
const SERVER_MANAGED_BAND_FIELDS = [...OWNER_ONLY_BAND_FIELDS];

function stripServerManagedBandFields(data) {
  return omitKeys(data, SERVER_MANAGED_BAND_FIELDS);
}

/** A new band always belongs to the account that creates it. */
function assignNewBandOwner(data, userId) {
  return { ...omitKeys(data, ['users_permissions_user']), users_permissions_user: userId };
}

module.exports = {
  ROLE_OWNER,
  ROLE_MANAGER,
  ROLE_VIEWER,
  ALL_ROLES,
  OWNER_ONLY_BAND_FIELDS,
  permissionsForRole,
  getBandRole,
  resolveBandAccess,
  userHasBandRole,
  requireBandPermission,
  listBandIdsWithPermission,
  ensureOwnerMemberRow,
  stripOwnerOnlyBandFields,
  SERVER_MANAGED_BAND_FIELDS,
  stripServerManagedBandFields,
  assignNewBandOwner,
};
