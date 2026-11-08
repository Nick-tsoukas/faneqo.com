'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const policy = require('../src/policies/subscription-active');

const fanAccountSrc = fs.readFileSync(path.join(__dirname, '../src/utils/fanAccount.js'), 'utf8');
const createSlice = fanAccountSrc.slice(
  fanAccountSrc.indexOf('async function findOrCreateUserByEmail'),
  fanAccountSrc.indexOf('function planFanClaimLinks')
);

let passed = 0;
async function test(name, fn) {
  await fn();
  passed += 1;
  console.log(`  ✅ ${name}`);
}

(async () => {
console.log('\n=== Fan billing isolation ===\n');

await test('fan magic-link user create does not set trialing or free', () => {
  assert.match(createSlice, /subscriptionStatus: 'unpaid'/);
  assert.doesNotMatch(createSlice, /subscriptionStatus: 'trialing'/);
  assert.doesNotMatch(createSlice, /subscriptionStatus: 'free'/);
  assert.doesNotMatch(createSlice, /plan:\s*['"]free['"]/);
  assert.match(createSlice, /No Stripe trial/);
});

await test('fan-only unpaid identity is denied artist Pro writes', async () => {
  const ctx = {
    state: { user: { id: 9, subscriptionStatus: 'unpaid' } },
    response: {
      unauthorized: () => false,
      forbidden: () => false,
    },
  };
  assert.strictEqual(await policy(ctx, {}, { strapi: {} }), false);
});

await test('fan create path still has no Stripe provisioning', () => {
  assert.doesNotMatch(createSlice, /stripe\.customers/);
  assert.doesNotMatch(createSlice, /STRIPE_DEFAULT_PRICE_ID/);
});

console.log(`\n=== fan billing isolation: ${passed} passed ===`);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
