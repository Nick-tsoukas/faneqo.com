'use strict';

/**
 * One lazily created Stripe client for the billing code, replaceable in tests
 * (focused tests drive the real controllers offline with a fake client).
 */

let client = null;

function getStripe() {
  if (!client) {
    const StripePackage = require('stripe');
    const Stripe = StripePackage.default || StripePackage;
    client = new Stripe(process.env.STRIPE_SECRET_KEY || '');
  }
  return client;
}

/** Tests only. */
function setStripeForTests(fake) {
  client = fake;
}

/** A stand-in that resolves the client on every property access. */
const lazyStripe = new Proxy({}, { get: (_target, key) => getStripe()[key] });

module.exports = { getStripe, setStripeForTests, lazyStripe };
