'use strict';

const { createCoreService } = require('@strapi/strapi').factories;

// Server-only record. There is deliberately no routes/ or controllers/ folder:
// consent records are never readable or writable through the public API.
module.exports = createCoreService('api::billing-consent.billing-consent');
