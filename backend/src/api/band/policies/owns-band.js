// path: src/api/band/policies/owns-band.js
'use strict';

module.exports = async (policyContext, config, { strapi }) => {
  const { params, state } = policyContext;
  const bandId = params.id;
  const userId = state.user?.id;

  if (!userId) {
    return false; // 403 (the isAuthenticated policy before this one already answers 401)
  }

  // Fetch the band AND populate its users_permissions_user relation
  const band = await strapi.entityService.findOne(
    'api::band.band',
    bandId,
    { populate: ['users_permissions_user'] }
  );

  if (!band) {
    return false; // 403, so band ids cannot be probed
  }

  // policyContext has no ctx.forbidden()/notFound() helpers in Strapi v4 (calling
  // them threw a 500); returning false makes Strapi answer 403 Policy Failed.
  // Compare the related user’s ID (coerce — Strapi ids may be number|string)
  if (String(band.users_permissions_user?.id) !== String(userId)) {
    return false;
  }

  // All good
  return true;
};
