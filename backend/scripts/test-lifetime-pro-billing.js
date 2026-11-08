/**
 * Lifetime Pro (complimentary, plan or subscriptionStatus "free") protection.
 *
 * Drives the real billing webhook with correctly signed Stripe test events
 * (stripe.webhooks.generateTestHeaderString) and proves a Lifetime Pro user
 * is never rewritten to active / pastDue / canceled / trialing, while a normal
 * artist still is. Also checks the paid-feature policy and the billing
 * endpoints treat Lifetime Pro as entitled without touching Stripe.
 *
 * Run: node scripts/test-lifetime-pro-billing.js
 */
'use strict';

const assert = require('assert');

process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_dummy';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_unit_test_secret';

const Stripe = require('stripe');
const stripeLib = new (Stripe.default || Stripe)('sk_test_dummy');
const UNPARSED = Symbol.for('unparsedBody');

let passed = 0;
let failed = 0;
async function test(name, fn) {
  try {
    await fn();
    passed += 1;
    console.log(`  PASS  ${name}`);
  } catch (err) {
    failed += 1;
    console.log(`  FAIL  ${name}\n        ${err.message}`);
  }
}

function signedCtx(event) {
  const payload = JSON.stringify(event);
  const header = stripeLib.webhooks.generateTestHeaderString({ payload, secret: process.env.STRIPE_WEBHOOK_SECRET });
  const calls = [];
  return {
    calls,
    request: { headers: { 'stripe-signature': header }, body: { [UNPARSED]: payload } },
    badRequest: (m) => calls.push(['badRequest', m]),
    internalServerError: (m) => calls.push(['internalServerError', m]),
    send: (b) => calls.push(['send', b]),
  };
}

function withUser(user, fn) {
  const writes = [];
  global.strapi = {
    log: { debug() {}, info() {}, warn() {}, error() {} },
    entityService: {
      findMany: async () => [user],
      update: async (_uid, id, { data }) => { writes.push({ id, data }); return { ...user, ...data }; },
    },
  };
  return Promise.resolve(fn(writes)).finally(() => { delete global.strapi; });
}

const events = {
  'checkout.session.completed': { id: 'cs_1', customer: 'cus_1', subscription: 'sub_1', trial_end: null },
  'invoice.payment_succeeded': { id: 'in_1', customer: 'cus_1', subscription: 'sub_1', paid: true, amount_paid: 1200, total: 1200 },
  'invoice.payment_failed': { id: 'in_2', customer: 'cus_1', subscription: 'sub_1' },
  'customer.subscription.updated': { id: 'sub_1', customer: 'cus_1', status: 'past_due', items: { data: [] } },
  'customer.subscription.deleted': { id: 'sub_1', customer: 'cus_1', status: 'canceled' },
};
const evt = (type) => ({ id: `evt_${type}`, object: 'event', type, data: { object: events[type] } });

async function main() {
  const controller = require('../src/api/subscription/controllers/subscription.js');

  console.log('\nBilling webhook vs Lifetime Pro');
  const lifetimeUsers = [
    { id: 1, customerId: 'cus_1', subscriptionId: 'sub_1', subscriptionStatus: 'free', plan: null },
    { id: 2, customerId: 'cus_1', subscriptionId: 'sub_1', subscriptionStatus: 'active', plan: 'free' },
  ];
  for (const type of Object.keys(events)) {
    await test(`${type}: Lifetime Pro is never rewritten`, async () => {
      for (const user of lifetimeUsers) {
        await withUser(user, async (writes) => {
          const ctx = signedCtx(evt(type));
          await controller.webhook(ctx);
          assert.deepEqual(ctx.calls.at(-1)?.[0], 'send', JSON.stringify(ctx.calls));
          assert.equal(writes.length, 0, `wrote ${JSON.stringify(writes)} for ${JSON.stringify(user)}`);
        });
      }
    });
  }

  await test('a normal artist is still updated by the same events', async () => {
    const expected = {
      'checkout.session.completed': 'active',
      'invoice.payment_succeeded': 'active',
      'invoice.payment_failed': 'pastDue',
      'customer.subscription.updated': 'pastDue',
      'customer.subscription.deleted': 'canceled',
    };
    for (const [type, status] of Object.entries(expected)) {
      await withUser({ id: 3, customerId: 'cus_1', subscriptionId: 'sub_1', subscriptionStatus: 'trialing', plan: 'Pro' }, async (writes) => {
        await controller.webhook(signedCtx(evt(type)));
        assert.equal(writes.length, 1, type);
        assert.equal(writes[0].data.subscriptionStatus, status, type);
      });
    }
  });

  await test('an unsigned or wrongly signed event changes nothing', async () => {
    await withUser({ id: 4, customerId: 'cus_1', subscriptionStatus: 'trialing' }, async (writes) => {
      const ctx = signedCtx(evt('invoice.payment_failed'));
      ctx.request.headers['stripe-signature'] = 't=1,v1=deadbeef';
      await controller.webhook(ctx);
      assert.equal(ctx.calls[0][0], 'badRequest');
      assert.equal(writes.length, 0);
    });
  });

  console.log('\nEntitlement');
  await test('paid-feature policy admits Lifetime Pro whatever its Stripe-side status', () => {
    const policy = require('../src/policies/subscription-active.js');
    const { isBillingExemptLifetimePro } = require('../src/utils/billing/artistEntitlement');
    assert.equal(isBillingExemptLifetimePro({ plan: 'free', subscriptionStatus: 'canceled' }), true);
    assert.equal(isBillingExemptLifetimePro({ plan: null, subscriptionStatus: 'free' }), true);
    assert.equal(isBillingExemptLifetimePro({ plan: 'Pro', subscriptionStatus: 'canceled' }), false);
    assert.equal(typeof policy, 'function');
    const src = require('fs').readFileSync(require.resolve('../src/policies/subscription-active.js'), 'utf8');
    assert.match(src, /if \(isBillingExemptLifetimePro\(user\)\) \{\s*return true;/);
  });

  await test('billing endpoints answer Lifetime Pro without calling Stripe', () => {
    const fs = require('fs');
    for (const f of ['../src/api/stripe/controllers/stripe.js', '../src/api/subscription/controllers/subscription.js']) {
      const src = fs.readFileSync(require.resolve(f), 'utf8');
      const status = src.slice(src.indexOf('async subscriptionStatus(ctx)'), src.indexOf('stripe.subscriptions.list', src.indexOf('async subscriptionStatus(ctx)')));
      assert.match(status, /isBillingExemptLifetimePro\(dbUser\)/, f);
    }
  });

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed) process.exit(1);
}

main();
