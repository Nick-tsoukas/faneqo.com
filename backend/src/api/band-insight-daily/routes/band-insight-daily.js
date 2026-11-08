'use strict';
const { createCoreRouter } = require('@strapi/strapi').factories;

// Daily insight rows are private artist analytics. The core find/findOne used to be
// auth: false ("dev-only; lock later") and listed every band's rows to anyone.
// Insights are served through the band-gated routes in band-insight-daily-custom.js.
module.exports = createCoreRouter('api::band-insight-daily.band-insight-daily', { only: [] });
