'use strict';

/**
 * Draft logic lives in `src/utils/galleries/galleryDraftService.js` so it stays
 * unit-testable. This stub exists only for Strapi's factory wiring.
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::gallery-draft.gallery-draft');
