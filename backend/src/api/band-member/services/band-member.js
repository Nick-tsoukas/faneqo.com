'use strict';

/**
 * band-member service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::band-member.band-member');
