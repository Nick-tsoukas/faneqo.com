'use strict';

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/email-events/resend',
      handler: 'email-event.resend',
      config: {
        // Authenticated by Svix signature inside the handler, not by session.
        auth: false,
      },
    },
  ],
};
