'use strict';

module.exports = {
  routes: [
    // Authenticated routes
    {
      method: 'GET',
      path: '/fans/my-fans',
      handler: 'fan.myFans',
      config: {
        policies: ['plugin::users-permissions.isAuthenticated'],
      },
    },
    {
      method: 'GET',
      path: '/fans/my-fans-analytics',
      handler: 'fan.myFansAnalytics',
      config: {
        policies: ['plugin::users-permissions.isAuthenticated'],
      },
    },
    {
      method: 'POST',
      path: '/fans/import',
      handler: 'fan.import',
      config: {
        policies: ['plugin::users-permissions.isAuthenticated'],
      },
    },
    {
      method: 'GET',
      path: '/fans/export',
      handler: 'fan.export',
      config: {
        policies: ['plugin::users-permissions.isAuthenticated'],
      },
    },
    {
      method: 'POST',
      path: '/fans/add',
      handler: 'fan.add',
      config: {
        policies: ['plugin::users-permissions.isAuthenticated'],
      },
    },
    // V3: Fan detail endpoint
    {
      method: 'GET',
      path: '/fans/:fanId/detail',
      handler: 'fan.fanDetail',
      config: {
        policies: ['plugin::users-permissions.isAuthenticated'],
      },
    },
    // Soft-remove from this band's active Fan List (owner: manageFanList)
    {
      method: 'POST',
      path: '/fans/:fanId/remove-from-list',
      handler: 'fan.removeFromList',
      config: {
        policies: ['plugin::users-permissions.isAuthenticated'],
      },
    },
    // Public route for fan capture
    {
      method: 'POST',
      path: '/fans/subscribe',
      handler: 'fan.subscribe',
      config: {
        auth: false,
      },
    },
    // Public unsubscribe: the mailed token is the credential
    {
      method: 'POST',
      path: '/fans/unsubscribe',
      handler: 'fan.unsubscribe',
      config: {
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/fans/resubscribe',
      handler: 'fan.resubscribe',
      config: {
        auth: false,
      },
    },
  ],
};
