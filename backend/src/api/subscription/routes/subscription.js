'use strict';

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/stripe/subscription-status',
      handler: 'api::subscription.subscription.subscriptionStatus',
      config: {
        auth: { scope: [] },   // or auth: false to test without a JWT
      },
    },
    {
      method: 'POST',
      path: '/stripe/create-billing-portal-session',
      handler: 'api::subscription.subscription.createBillingPortalSession',
      config: {
        auth: { scope: [] },
      },
    },

    // Start Pro: open the right Stripe-hosted page, then confirm on return.
    // Signed-in only; the handlers also refuse a missing user.
    {
      method: 'POST',
      path: '/stripe/start-pro',
      handler: 'api::subscription.subscription.startPro',
      config: { policies: ['plugin::users-permissions.isAuthenticated'] },
    },
    {
      method: 'GET',
      path: '/stripe/start-pro/confirm',
      handler: 'api::subscription.subscription.startProConfirm',
      config: { policies: ['plugin::users-permissions.isAuthenticated'] },
    },
    // Billing A+B: the server's own terms for the consent step. Read-only.
    {
      method: 'GET',
      path: '/stripe/start-pro/terms',
      handler: 'api::subscription.subscription.startProTerms',
      config: { policies: ['plugin::users-permissions.isAuthenticated'] },
    },
    {
      method: 'GET',
      path: '/stripe/billing-portal/terms',
      handler: 'api::subscription.subscription.billingPortalTerms',
      config: { policies: ['plugin::users-permissions.isAuthenticated'] },
    },

    {
      method: 'POST',
      path:   '/stripe/register',
      handler:'api::subscription.subscription.register',
      config: {
        auth: false  // allow guests to sign up
      }
    },
  ],
};
