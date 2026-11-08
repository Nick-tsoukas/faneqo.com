// path: src/api/qr/routes/qr.js
'use strict';

module.exports = {
  type: 'content-api',
  routes: [
    {
      // Scope is derived from ctx.state.user in the controller (see
      // src/utils/qrScope.js). This was `auth: false` with "filtering by user
      // happens in query", which made a query parameter the access check.
      method: 'GET',
      path: '/qrs',
      handler: 'qr.find',
      config: {
        policies: ['plugin::users-permissions.isAuthenticated'],
      },
    },
    {
      method: 'GET',
      path: '/qrs/:id',
      handler: 'qr.findOne',
      config: {
        policies: [
          'plugin::users-permissions.isAuthenticated',
          'api::qr.can-view-qr',
        ],
      },
    },
    {
      method: 'POST',
      path: '/qrs',
      handler: 'qr.create',
      config: {
        policies: [
          'plugin::users-permissions.isAuthenticated',
          'global::subscription-active',
          'api::qr.only-one-qr',
        ],
      },
    },
    {
      method: 'PUT',
      path: '/qrs/:id',
      handler: 'qr.update',
      config: {
        policies: [
          'plugin::users-permissions.isAuthenticated',
          'global::subscription-active',
          'api::qr.owns-qr',
        ],
      },
    },
    {
      method: 'DELETE',
      path: '/qrs/:id',
      handler: 'qr.delete',
      config: {
        policies: [
          'plugin::users-permissions.isAuthenticated',
          'global::subscription-active',
          'api::qr.owns-qr',
        ],
      },
    },
  ],
};
