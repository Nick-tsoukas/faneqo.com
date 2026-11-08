'use strict';

module.exports = {
  type: 'content-api',
  routes: [
    {
      // Public receipt by unguessable token (new payments)
      method: 'GET',
      path: '/payment-receipts/:token',
      handler: 'support-moment.receipt',
      config: {
        auth: false,
      },
    },
    {
      // Legacy receipt links (?sm=<id>): token-less payments from the last 30 days only
      method: 'GET',
      path: '/support-moments/:id/summary',
      handler: 'support-moment.summary',
      config: {
        auth: false,
      },
    },
  ],
};
