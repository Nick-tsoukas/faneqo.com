// path: src/api/qr/policies/owns-qr.js
'use strict';

const { getBandRole, ROLE_OWNER, ROLE_MANAGER } = require('../../../utils/bandRoles');

/**
 * QR mutate gate:
 * 1) Legacy QR owner (`users_permissions_user`)
 * 2) Active band owner/manager when the QR is linked to a band
 */
module.exports = async (policyContext, config, { strapi }) => {
  const { state, response, params } = policyContext;
  const user = state.user;
  const qrId = params.id;

  if (!user) {
    return response.unauthorized('You must be logged in.');
  }

  if (!qrId) {
    return response.badRequest('Missing QR ID');
  }

  const qr = await strapi.entityService.findOne('api::qr.qr', qrId, {
    populate: {
      users_permissions_user: { fields: ['id'] },
      band: { fields: ['id'] },
    },
  });

  strapi.log.debug(`[owns-qr] QR ${qrId}: owner=${qr?.users_permissions_user?.id}, user=${user.id}`);

  if (!qr) {
    return response.notFound('QR not found.');
  }

  if (String(qr.users_permissions_user?.id) === String(user.id)) {
    return true;
  }

  const bandId = qr.band?.id || qr.band;
  if (bandId) {
    const role = await getBandRole(strapi, bandId, user.id);
    if (role === ROLE_OWNER || role === ROLE_MANAGER) {
      return true;
    }
  }

  strapi.log.debug(`[owns-qr] DENIED: QR owner ${qr.users_permissions_user?.id} !== user ${user.id}`);
  return response.forbidden('You do not have permission to modify this QR.');
};
