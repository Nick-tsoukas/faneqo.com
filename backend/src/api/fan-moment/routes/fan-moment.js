'use strict';

/**
 * fan-moment router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

// A single moment backs the public share page and its OG image. Listing, and the core
// create/update/delete, are not used and exposed every row; fans earn moments via /fan-moments/earn.
module.exports = createCoreRouter('api::fan-moment.fan-moment', { only: ['findOne'] });
