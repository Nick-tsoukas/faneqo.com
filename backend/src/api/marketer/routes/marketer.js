'use strict';

module.exports = {
  routes: [
    // Protected routes for marketer dashboard
    {
      method: 'GET',
      path: '/marketer/me/stats',
      handler: 'marketer.myStats',
      config: {
        policies: ['plugin::users-permissions.isAuthenticated'],
      },
    },
    {
      method: 'GET',
      path: '/marketer/me/users',
      handler: 'marketer.myUsers',
      config: {
        policies: ['plugin::users-permissions.isAuthenticated'],
      },
    },
    // Public route to validate marketer code
    {
      method: 'GET',
      path: '/marketer/by-code/:code',
      handler: 'marketer.findByCode',
      config: {
        auth: false,
      },
    },
    // Public route to track link clicks
    {
      method: 'POST',
      path: '/marketer/track-click/:code',
      handler: 'marketer.trackClick',
      config: {
        auth: false,
      },
    },
  ],
};
