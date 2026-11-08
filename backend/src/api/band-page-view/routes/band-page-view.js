'use strict';

/**
 * band-page-view router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

// Reads are signed-in and band-scoped (controller). Anonymous page-view ingestion uses create;
// rows are never edited or deleted over HTTP.
module.exports = createCoreRouter('api::band-page-view.band-page-view', { only: ['find', 'findOne', 'create'] });
