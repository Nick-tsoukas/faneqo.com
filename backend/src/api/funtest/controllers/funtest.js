'use strict';

/**
 * funtest controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

const { adminOnlyWrites } = require('../../../utils/creatorOwnedWrites');

// Read-only over the content API; edited in the Strapi admin panel.
module.exports = createCoreController('api::funtest.funtest', () => ({
  ...adminOnlyWrites,
}));
