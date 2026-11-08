'use strict';

/**
 * band-share router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

// Share telemetry is written through /band-shares/record only. The core routes exposed every
// row (visitor ids) to anyone and let anyone edit or delete them.
module.exports = createCoreRouter('api::band-share.band-share', { only: [] });
