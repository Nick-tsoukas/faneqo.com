"use strict";

/**
 * Artist billing routes. Each needs a logged-in user (standard
 * users-permissions auth; the handlers also refuse a missing ctx.state.user)
 * and reads the Stripe customer from the user's own row, never from the body.
 *
 * Intentionally NOT registered (2026-11 security pass):
 *   - POST /stripe/create-customer, /stripe/create-checkout-session and
 *     /stripe/confirm-payment: the legacy card-first signup. No frontend calls
 *     them (email signup is POST /stripe/register in the subscription API;
 *     cards are added in the billing portal). Granted to the Public role they
 *     returned the Stripe customer id of any email and opened card-setup
 *     sessions on any customer id.
 *   - GET /stripe/test: debug route.
 *   - POST /stripe/confirm-social: issued a JWT for any account by body email.
 *     Social login is served by the Nuxt route, which verifies a Firebase ID
 *     token and calls the secret-guarded /user-admin/issue-jwt.
 * Webhooks are separate routes with Stripe signature verification.
 */
module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/stripe/create-billing-portal-session',
      handler: 'stripe.createBillingPortalSession',
      config: { auth: {} },
    },
    {
      method: 'GET',
      path: '/stripe/subscription-status',
      handler: 'stripe.subscriptionStatus',
      config: { auth: {} },
    },
    {
      method: 'GET',
      path: '/stripe/billing',
      handler: 'stripe.getBillingInfo',
      config: { auth: {} },
    },
  ],
};
