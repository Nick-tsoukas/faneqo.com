'use strict';

/**
 * Anonymous fan identity session (public).
 * Path kept product-facing: /api/fan-identity/session
 */

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/fan-identity/session',
      handler: 'fan-visitor.session',
      config: {
        auth: false,
      },
    },
  ],
};
