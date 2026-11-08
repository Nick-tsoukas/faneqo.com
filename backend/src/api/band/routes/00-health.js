'use strict';

module.exports = {
  type: 'content-api',
  routes: [
    {
      method: 'GET',
      path: '/health',
      handler: 'health.check',
      config: { auth: false, policies: [], middlewares: [] },
    },
  ],
};
