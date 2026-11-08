'use strict';

const { createCoreRouter } = require('@strapi/strapi').factories;

// Snapshots are written by the daily cron (services/pulseSnapshot.js). No HTTP access.
module.exports = createCoreRouter('api::pulse-snapshot.pulse-snapshot', { only: [] });
