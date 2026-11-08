'use strict';

/**
 * GET /api/labs/status
 * GET /api/labs/features?bandId=
 *
 * auth: false so users-permissions cannot 403 and advertise the surface.
 * Controller resolves JWT, then 404 unless internal_labs is enabled.
 */

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/labs/status',
      handler: 'labs.status',
      config: { auth: false, policies: [], middlewares: [] },
    },
    {
      method: 'GET',
      path: '/labs/features',
      handler: 'labs.features',
      config: { auth: false, policies: [], middlewares: [] },
    },
    {
      method: 'GET',
      path: '/labs/relationship-fans',
      handler: 'labs.relationshipFans',
      config: { auth: false, policies: [], middlewares: [] },
    },
    {
      method: 'GET',
      path: '/labs/relationships',
      handler: 'labs.relationshipTimeline',
      config: { auth: false, policies: [], middlewares: [] },
    },
    {
      method: 'GET',
      path: '/labs/integrity',
      handler: 'labs.integrity',
      config: { auth: false, policies: [], middlewares: [] },
    },
    {
      method: 'GET',
      path: '/labs/relationship',
      handler: 'labs.artistFanProgression',
      config: { auth: false, policies: [], middlewares: [] },
    },
  ],
};
