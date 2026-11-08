// path: src/api/band/policies/has-band-role.js
'use strict';

/**
 * Role-aware band access policy (Team Access V1).
 *
 * Team management + payments still use `api::band.owns-band`.
 * Band PUT / similar product routes use this with ['owner','manager'].
 *
 * Usage:
 *   {
 *     name: 'api::band.has-band-role',
 *     config: { roles: ['owner', 'manager'] },
 *   }
 *
 * Defaults to owner-only when no roles are configured (legacy
 * `users_permissions_user` fallback lives inside getBandRole).
 *
 * Owner-only forever: payments/Connect, billing, band delete, team
 * management, fan PII / messaging — never configure those with more than ['owner'].
 */

const { getBandRole, ROLE_OWNER } = require('../../../utils/bandRoles');

module.exports = async (policyContext, config, { strapi }) => {
  const userId = policyContext.state.user?.id;
  if (!userId) {
    return policyContext.unauthorized('You must be logged in.');
  }

  const bandId = policyContext.params.id;
  if (!bandId) {
    return policyContext.badRequest('Missing band id.');
  }

  const allowedRoles =
    Array.isArray(config?.roles) && config.roles.length ? config.roles : [ROLE_OWNER];

  const role = await getBandRole(strapi, bandId, userId);

  if (role === null) {
    // Distinguish missing band from no-access without leaking membership info.
    const band = await strapi.entityService.findOne('api::band.band', bandId, { fields: ['id'] });
    if (!band) {
      return policyContext.notFound('Band not found.');
    }
    return policyContext.forbidden('You do not have access to this band.');
  }

  if (!allowedRoles.includes(role)) {
    return policyContext.forbidden('Your role does not allow this action.');
  }

  return true;
};
