'use strict';

/**
 * scan router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

// Reads are signed-in and band-scoped (controller). Ingestion goes through /scans/track
// (create kept for the legacy direct-QR page); rows are never edited or deleted over HTTP.
module.exports = createCoreRouter('api::scan.scan', { only: ['find', 'findOne', 'create'] });
