'use strict';

/**
 * message-campaign service — thin Strapi factory wrapper.
 * Business logic lives in utils/messaging/*.
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::message-campaign.message-campaign');
