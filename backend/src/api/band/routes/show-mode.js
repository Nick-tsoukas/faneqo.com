'use strict';

/**
 * Show Mode Routes
 * Custom routes for show mode activation/deactivation
 */

module.exports = {
  routes: [
    // GET show mode status
    {
      method: 'GET',
      path: '/bands/:id/show-mode',
      handler: 'show-mode.getStatus',
      config: {
        policies: ['plugin::users-permissions.isAuthenticated'],
      },
    },
    // POST activate manual show mode
    {
      method: 'POST',
      path: '/bands/:id/show-mode/manual',
      handler: 'show-mode.activateManual',
      config: {
        policies: ['plugin::users-permissions.isAuthenticated'],
      },
    },
    // POST activate Show Mode from an existing Event
    {
      method: 'POST',
      path: '/bands/:id/show-mode/from-event',
      handler: 'show-mode.activateFromEvent',
      config: {
        policies: ['plugin::users-permissions.isAuthenticated'],
      },
    },
    // POST deactivate show mode
    {
      method: 'POST',
      path: '/bands/:id/show-mode/deactivate',
      handler: 'show-mode.deactivate',
      config: {
        policies: ['plugin::users-permissions.isAuthenticated'],
      },
    },
    // POST activate scheduled show mode now
    {
      method: 'POST',
      path: '/bands/:id/show-mode/activate-now',
      handler: 'show-mode.activateNow',
      config: {
        policies: ['plugin::users-permissions.isAuthenticated'],
      },
    },
    // PATCH change timing on the current live session
    {
      method: 'PATCH',
      path: '/bands/:id/show-mode/timing',
      handler: 'show-mode.updateTiming',
      config: {
        policies: ['plugin::users-permissions.isAuthenticated'],
      },
    },
  ],
};
