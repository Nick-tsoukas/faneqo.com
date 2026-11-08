'use strict';

/**
 * howtovideo controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

const { adminOnlyWrites } = require('../../../utils/creatorOwnedWrites');

// Read-only over the content API; edited in the Strapi admin panel.
module.exports = createCoreController('api::howtovideo.howtovideo', () => ({
  ...adminOnlyWrites,
}));
