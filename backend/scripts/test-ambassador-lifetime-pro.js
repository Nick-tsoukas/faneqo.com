'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const policy = require('../src/policies/subscription-active');
const {
  isBillingExemptLifetimePro,
  shouldSkipStripeProvision,
  ambassadorBillingInfoPayload,
  ambassadorSubscriptionStatusPayload,
} = require('../src/utils/billing/artistEntitlement');

const stripeCtrl = fs.readFileSync(
  path.join(__dirname, '../src/api/stripe/controllers/stripe.js'),
  'utf8'
);
const confirmSocial = stripeCtrl.slice(
  stripeCtrl.indexOf('async confirmSocial(ctx)'),
  stripeCtrl.indexOf('async testRoute(ctx)')
);
const billingFn = stripeCtrl.slice(
  stripeCtrl.indexOf('async getBillingInfo(ctx)'),
  stripeCtrl.indexOf('async createBillingPortalSession')
);
const statusFn = stripeCtrl.slice(
  stripeCtrl.indexOf('async subscriptionStatus(ctx)'),
  stripeCtrl.indexOf('async getBillingInfo(ctx)')
);
const fanCreate = fs.readFileSync(path.join(__dirname, '../src/utils/fanAccount.js'), 'utf8')
  .slice(
    fs.readFileSync(path.join(__dirname, '../src/utils/fanAccount.js'), 'utf8').indexOf('async function findOrCreateUserByEmail'),
    fs.readFileSync(path.join(__dirname, '../src/utils/fanAccount.js'), 'utf8').indexOf('function planFanClaimLinks')
  );

async function runPolicy(user, strapi = {}) {
  const ctx = {
    state: { user },
    response: {
      unauthorized: () => false,
      forbidden: () => false,
    },
  };
  return policy(ctx, {}, { strapi });
}

let passed = 0;
async function test(name, fn) {
  await fn();
  passed += 1;
  console.log(`  ✅ ${name}`);
}

async function run() {
  console.log('\n=== Ambassador / white-glove lifetime Pro ===\n');

  await test('plan=free ambassador + no Stripe is billing-exempt', async () => {
    const user = { id: 1, plan: 'free', subscriptionStatus: 'unpaid' };
    assert.strictEqual(isBillingExemptLifetimePro(user), true);
    assert.strictEqual(shouldSkipStripeProvision(user), true);
    assert.strictEqual(await runPolicy(user), true);
  });

  await test('plan=free + subscriptionStatus=unpaid is still Pro', async () => {
    assert.strictEqual(await runPolicy({ plan: 'free', subscriptionStatus: 'unpaid', customerId: null }), true);
  });

  await test('legacy subscriptionStatus=free is still Pro', async () => {
    assert.strictEqual(isBillingExemptLifetimePro({ subscriptionStatus: 'free' }), true);
    assert.strictEqual(await runPolicy({ subscriptionStatus: 'free' }), true);
  });

  await test('missing Stripe alone is not ambassador', async () => {
    assert.strictEqual(isBillingExemptLifetimePro({ id: 2, subscriptionStatus: 'unpaid' }), false);
    assert.strictEqual(isBillingExemptLifetimePro({}), false);
    assert.strictEqual(await runPolicy({ subscriptionStatus: 'unpaid' }), false);
  });

  await test('fan-only unpaid + no Stripe is denied artist Pro', async () => {
    assert.strictEqual(await runPolicy({ id: 9, subscriptionStatus: 'unpaid' }), false);
    assert.doesNotMatch(fanCreate, /plan:\s*['"]free['"]/);
  });

  await test('failed signup unpaid is denied', async () => {
    assert.strictEqual(await runPolicy({ subscriptionStatus: 'unpaid', customerId: null, subscriptionId: null }), false);
  });

  await test('active Stripe artist is allowed', async () => {
    assert.strictEqual(await runPolicy({ subscriptionStatus: 'active', customerId: 'cus_1' }), true);
  });

  await test('trialing Stripe artist is allowed', async () => {
    assert.strictEqual(await runPolicy({
      subscriptionStatus: 'trialing',
      customerId: 'cus_1',
      subscriptionId: 'sub_1',
    }), true);
  });

  await test('canceled Stripe artist is denied', async () => {
    assert.strictEqual(await runPolicy({ subscriptionStatus: 'canceled', customerId: 'cus_1' }), false);
  });

  await test('billing endpoint skips Stripe and does not require customerId for ambassador', () => {
  assert.match(billingFn, /isBillingExemptLifetimePro\(dbUser\)/);
  assert.match(billingFn, /ambassadorBillingInfoPayload/);
  const exemptBeforeCustomer = billingFn.indexOf('isBillingExemptLifetimePro');
  const customerCheck = billingFn.indexOf('!dbUser.customerId');
  assert.ok(exemptBeforeCustomer !== -1 && exemptBeforeCustomer < customerCheck);
  const payload = ambassadorBillingInfoPayload();
  assert.strictEqual(payload.billingExempt, true);
  assert.strictEqual(payload.entitlement, 'lifetime_pro');
  assert.strictEqual(payload.subscription, null);
  assert.strictEqual(payload.hasPaymentMethod, false);
});

  await test('subscription-status skips Stripe for ambassador', () => {
  assert.match(statusFn, /isBillingExemptLifetimePro\(dbUser\)/);
  assert.match(statusFn, /ambassadorSubscriptionStatusPayload/);
  assert.doesNotMatch(
    statusFn.slice(statusFn.indexOf('isBillingExemptLifetimePro'), statusFn.indexOf('if (!dbUser?.customerId)')),
    /stripe\./
  );
  const payload = ambassadorSubscriptionStatusPayload();
  assert.strictEqual(payload.status, 'active');
  assert.strictEqual(payload.plan, 'free');
  assert.strictEqual(payload.billingExempt, true);
});

  await test('Strapi Google login skips Stripe repair for ambassador', () => {
  assert.match(confirmSocial, /isBillingExemptLifetimePro\(existingUser\)/);
  assert.match(confirmSocial, /skipping Stripe/);
  const skip = confirmSocial.slice(
    confirmSocial.indexOf('isBillingExemptLifetimePro(existingUser)'),
    confirmSocial.indexOf('let billingReady')
  );
  assert.doesNotMatch(skip, /provisionStripeCustomerAndTrial/);
  assert.match(skip, /jwt\.issue/);
});

  await test('ambassador payloads never fabricate a price or subscription id', () => {
    const info = JSON.stringify(ambassadorBillingInfoPayload());
    const status = JSON.stringify(ambassadorSubscriptionStatusPayload());
    assert.doesNotMatch(info, /12|7\.00|price_|sub_/);
    assert.doesNotMatch(status, /12|7\.00|price_|sub_/);
  });

  console.log(`\n=== ambassador lifetime Pro: ${passed} passed ===`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
