'use strict';

/**
 * event-page-view router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

// Reads are signed-in and band-scoped (controller). Ingestion uses create or /event-page-views/track;
// rows are never edited or deleted over HTTP.
module.exports = createCoreRouter('api::event-page-view.event-page-view', { only: ['find', 'findOne', 'create'] });
