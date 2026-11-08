'use strict';

/**
 * album controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

const { creatorOwnedWrites } = require('../../../utils/creatorOwnedWrites');

const UID = 'api::album.album';

// Writes are limited to the user who created the record (see creatorOwnedWrites).
module.exports = createCoreController(UID, ({ strapi }) => ({
  ...creatorOwnedWrites(strapi, UID, 'users_permissions_user'),
}));
