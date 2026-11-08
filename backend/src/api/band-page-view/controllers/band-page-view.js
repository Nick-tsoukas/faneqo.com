'use strict';

/**
 * band-page-view controller
 */

const { createCoreController } = require('@strapi/strapi').factories;
const { scopedAnalyticsReads, directBand } = require('../../../utils/scopedAnalyticsReads');

const UID = 'api::band-page-view.band-page-view';

module.exports = createCoreController(UID, ({ strapi }) => ({
  ...scopedAnalyticsReads(strapi, UID, directBand),
}));
