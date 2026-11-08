'use strict';

const assert = require('assert');
const {
  planStripeSignupCleanup,
  shouldCancelSubscription,
  shouldDeleteCustomer,
  runStripeSignupCleanup,
} = require('../src/utils/billing/stripeSignupCleanup');

let passed = 0;
function test(name, fn) {
  return Promise.resolve()
    .then(fn)
    .then(() => {
      passed += 1;
      console.log(`  ✅ ${name}`);
    });
}

async function run() {
  console.log('\n=== Stripe signup cleanup ownership ===\n');

  await test('newly created customer+subscription are owned for cleanup', () => {
    const plan = planStripeSignupCleanup({
      createdCustomer: true,
      createdSubscription: true,
      customerId: 'cus_new',
      subscriptionId: 'sub_new',
    });
    assert.strictEqual(plan.cancelSubscriptionId, 'sub_new');
    assert.strictEqual(plan.deleteCustomerId, 'cus_new');
    assert.strictEqual(shouldCancelSubscription(plan), true);
    assert.strictEqual(shouldDeleteCustomer(plan), true);
  });

  await test('pre-existing customer is never deleted', () => {
    const plan = planStripeSignupCleanup({
      createdCustomer: false,
      createdSubscription: true,
      customerId: 'cus_old',
      subscriptionId: 'sub_new',
    });
    assert.strictEqual(plan.deleteCustomerId, null);
    assert.strictEqual(plan.cancelSubscriptionId, 'sub_new');
  });

  await test('pre-existing / grandfathered subscription is never canceled', () => {
    const plan = planStripeSignupCleanup({
      createdCustomer: false,
      createdSubscription: false,
      customerId: 'cus_old',
      subscriptionId: 'sub_7_grandfathered',
    });
    assert.strictEqual(plan.cancelSubscriptionId, null);
    assert.strictEqual(plan.deleteCustomerId, null);
    assert.strictEqual(shouldCancelSubscription(plan), false);
  });

  await test('cleanup runner only touches owned IDs', async () => {
    const canceled = [];
    const deleted = [];
    const stripe = {
      subscriptions: { cancel: async (id) => canceled.push(id) },
      customers: { del: async (id) => deleted.push(id) },
    };
    await runStripeSignupCleanup({
      stripe,
      plan: planStripeSignupCleanup({
        createdCustomer: true,
        createdSubscription: true,
        customerId: 'cus_new',
        subscriptionId: 'sub_new',
      }),
      log: { error() {} },
    });
    await runStripeSignupCleanup({
      stripe,
      plan: planStripeSignupCleanup({
        createdCustomer: false,
        createdSubscription: false,
        customerId: 'cus_old',
        subscriptionId: 'sub_7',
      }),
      log: { error() {} },
    });
    assert.deepStrictEqual(canceled, ['sub_new']);
    assert.deepStrictEqual(deleted, ['cus_new']);
  });

  console.log(`\n=== stripe signup cleanup: ${passed} passed ===`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
