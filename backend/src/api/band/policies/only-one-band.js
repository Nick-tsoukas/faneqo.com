// path: src/api/band/policies/only-one-band.js
'use strict';

const { errors } = require('@strapi/utils');

/**
 * Band creation limit.
 *
 * - A regular artist account may own one band.
 * - Manually approved agency accounts may own up to ten.
 * - Only bands the account owns (the band's users_permissions_user) count.
 *   Team Access memberships are band-member rows, not ownership, so an
 *   account can manage any number of assigned artists and still create its own.
 *
 * Strapi v4 lets a request through when a policy returns `true` or `undefined`,
 * so a refusal must throw. The old `response.forbidden()` only set a 403 body
 * and returned undefined, and the controller went on to create the band.
 */
const DEFAULT_BAND_LIMIT = 1;
const AGENCY_BAND_LIMIT = 10;

// Manually approved multi-band (agency) accounts.
const AGENCY_EMAILS = new Set([
  'mjc773@gmail.com',
  'partner@musicbizqr.com',
]);

function bandLimitFor(user) {
  const email = String(user?.email || '').trim().toLowerCase();
  return AGENCY_EMAILS.has(email) ? AGENCY_BAND_LIMIT : DEFAULT_BAND_LIMIT;
}

async function countOwnedBands(strapi, userId) {
  return strapi.db.query('api::band.band').count({
    where: { users_permissions_user: { id: userId } },
  });
}

module.exports = async (policyContext, config, { strapi }) => {
  const user = policyContext.state?.user;
  if (!user?.id) {
    throw new errors.UnauthorizedError('You must be logged in.');
  }

  const limit = bandLimitFor(user);
  const owned = await countOwnedBands(strapi, user.id);
  if (owned >= limit) {
    throw new errors.PolicyError(`You may only create up to ${limit} band(s).`);
  }

  return true;
};

module.exports.bandLimitFor = bandLimitFor;
module.exports.DEFAULT_BAND_LIMIT = DEFAULT_BAND_LIMIT;
module.exports.AGENCY_BAND_LIMIT = AGENCY_BAND_LIMIT;
