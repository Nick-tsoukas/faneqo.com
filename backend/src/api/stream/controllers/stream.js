'use strict';

/**
 * stream controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

const { creatorOwnedWrites } = require('../../../utils/creatorOwnedWrites');

const UID = 'api::stream.stream';

// Writes are limited to the user who created the record (see creatorOwnedWrites).
module.exports = createCoreController(UID, ({ strapi }) => ({
  ...creatorOwnedWrites(strapi, UID, 'users_permissions_user'),
}));
