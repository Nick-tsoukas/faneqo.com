// path: src/api/qr/policies/only-one-qr.js
'use strict';

const QR_LIMIT = 10;

module.exports = async (policyContext, config, { strapi }) => {
  const { state, response } = policyContext;
  const user = state.user;

  // 1) Must be logged in
  if (!user) {
    return response.unauthorized('You must be logged in to create a QR code.');
  }

  // 2) Count how many QR codes this user already has
  const existing = await strapi.entityService.findMany('api::qr.qr', {
    filters: { users_permissions_user: user.id },
    pagination: { pageSize: QR_LIMIT + 1 },
  });

  // 3) Enforce limit (all users: up to 10)
  if (existing.length >= QR_LIMIT) {
    return response.forbidden(`You may only create up to ${QR_LIMIT} QR code(s).`);
  }

  return true;
};
