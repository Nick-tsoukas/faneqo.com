'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const policy = require('../src/policies/subscription-active');
const { normalizeSubscriptionStatusForUserRow } = require('../src/utils/billing/subscriptionStatus');

const schema = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, '../src/extensions/users-permissions/content-types/user/schema.json'),
    'utf8'
  )
);

async function runPolicy(user, strapi = {}) {
  const calls = [];
  const ctx = {
    state: { user },
    response: {
      unauthorized(message) {
        calls.push(['unauthorized', message]);
        return false;
      },
      forbidden(message) {
        calls.push(['forbidden', message]);
        return false;
      },
    },
  };
  const result = await policy(ctx, {}, { strapi });
  return { result, calls };
}

let passed = 0;
async function test(name, fn) {
  await fn();
  passed += 1;
  console.log(`  ✅ ${name}`);
}

async function run() {
  console.log('\n=== subscription-active policy ===\n');

  await test('active is allowed', async () => {
    const { result } = await runPolicy({ subscriptionStatus: 'active' });
    assert.strictEqual(result, true);
  });

  await test('legitimate persisted trialing is allowed', async () => {
    const { result } = await runPolicy({
      subscriptionStatus: 'trialing',
      customerId: 'cus_1',
      subscriptionId: 'sub_1',
    });
    assert.strictEqual(result, true);
  });

  await test('past due grace behavior is unchanged', async () => {
    const now = Date.now();
    const inGrace = await runPolicy({
      subscriptionStatus: 'pastDue',
      gracePeriodStart: new Date(now - 24 * 60 * 60 * 1000).toISOString(),
    });
    assert.strictEqual(inGrace.result, true);

    const noGrace = await runPolicy({ subscriptionStatus: 'pastDue' });
    assert.strictEqual(noGrace.result, false);
    assert.strictEqual(noGrace.calls[0][0], 'forbidden');
  });

  await test('unpaid is denied', async () => {
    const { result, calls } = await runPolicy({ subscriptionStatus: 'unpaid' });
    assert.strictEqual(result, false);
    assert.strictEqual(calls[0][0], 'forbidden');
  });

  await test('canceled is denied', async () => {
    const { result } = await runPolicy({ subscriptionStatus: 'canceled' });
    assert.strictEqual(result, false);
  });

  await test('new user with no Stripe / default unpaid is denied', async () => {
    const defaultStatus = schema.attributes.subscriptionStatus.default;
    assert.strictEqual(defaultStatus, 'unpaid');
    const { result } = await runPolicy({ subscriptionStatus: defaultStatus });
    assert.strictEqual(result, false);
    const bare = await runPolicy({});
    assert.strictEqual(bare.result, false);
  });

  await test('unknown Stripe statuses fail closed to unpaid, not trialing', () => {
    assert.strictEqual(normalizeSubscriptionStatusForUserRow('incomplete'), 'unpaid');
    assert.strictEqual(normalizeSubscriptionStatusForUserRow('paused'), 'unpaid');
    assert.strictEqual(normalizeSubscriptionStatusForUserRow('nope'), 'unpaid');
    assert.strictEqual(normalizeSubscriptionStatusForUserRow('past_due'), 'pastDue');
    assert.strictEqual(normalizeSubscriptionStatusForUserRow('trialing'), 'trialing');
  });

  await test('policy uses centralized lifetime-Pro grant and still allows Stripe active/trialing', async () => {
    const src = fs.readFileSync(path.join(__dirname, '../src/policies/subscription-active.js'), 'utf8');
    assert.match(src, /isBillingExemptLifetimePro/);
    assert.match(src, /subscriptionStatus === 'active' \|\|/);
    assert.doesNotMatch(src, /unpaid' \|\|/);
    const { result } = await runPolicy({ plan: 'free', subscriptionStatus: 'unpaid' });
    assert.strictEqual(result, true);
  });

  await test('JWT user missing plan still allows DB plan=free ambassador', async () => {
    const { result } = await runPolicy(
      { id: 88, subscriptionStatus: 'unpaid' },
      {
        entityService: {
          findOne: async () => ({ id: 88, plan: 'free', subscriptionStatus: 'unpaid' }),
        },
      }
    );
    assert.strictEqual(result, true);
  });

  console.log(`\n=== subscription-active policy: ${passed} passed ===`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
