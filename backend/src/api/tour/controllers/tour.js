'use strict';

/**
 * tour controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

const { creatorOwnedWrites } = require('../../../utils/creatorOwnedWrites');

const UID = 'api::tour.tour';

// Writes are limited to the user who created the record (see creatorOwnedWrites).
module.exports = createCoreController(UID, ({ strapi }) => ({
  ...creatorOwnedWrites(strapi, UID, 'users_permissions_user'),
}));
