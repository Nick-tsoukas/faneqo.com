'use strict';

/**
 * Future route policy: authenticated + internal_labs, else 404.
 * Does not replace owns-band / has-band-role / subscription-active.
 */

const { createFeatureService } = require('../utils/features/featureService');

module.exports = async (policyContext, _config, { strapi }) => {
  const user = policyContext.state.user;
  if (!user?.id) {
    return policyContext.notFound();
  }
  try {
    await createFeatureService(strapi).assertFeature('internal_labs', { user });
    return true;
  } catch {
    return policyContext.notFound();
  }
};
