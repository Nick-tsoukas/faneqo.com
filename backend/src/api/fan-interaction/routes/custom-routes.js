'use strict';

/**
 * Custom routes for fan-interaction
 */

module.exports = {
  routes: [
    // Public endpoint for tracking interactions (no auth required)
    {
      method: 'POST',
      path: '/fan-interactions/track',
      handler: 'fan-interaction.track',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    // Public endpoint for show check-ins (no auth required)
    {
      method: 'POST',
      path: '/fan-interactions/check-in',
      handler: 'fan-interaction.checkIn',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    // Self-scoped canonical attendance lookup. Returns a boolean only.
    {
      method: 'GET',
      path: '/fan-interactions/check-in-status',
      handler: 'fan-interaction.checkInStatus',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    // Authenticated endpoints for dashboard
    {
      method: 'GET',
      path: '/fan-interactions/recent/:bandId',
      handler: 'fan-interaction.recent',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/fan-interactions/breakdown/:bandId',
      handler: 'fan-interaction.breakdown',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/fan-interactions/session/:bandId',
      handler: 'fan-interaction.session',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
