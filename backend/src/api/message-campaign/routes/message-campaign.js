'use strict';

/**
 * Custom campaign routes only — no generic CRUD (PII / send powers).
 * Literal paths (/preview, /history) must be declared before `/:id…`.
 */

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/message-campaigns/preview',
      handler: 'message-campaign.preview',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/message-campaigns/history',
      handler: 'message-campaign.history',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/message-campaigns',
      handler: 'message-campaign.create',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/message-campaigns/:id',
      handler: 'message-campaign.detail',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/message-campaigns/:id/status',
      handler: 'message-campaign.status',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
