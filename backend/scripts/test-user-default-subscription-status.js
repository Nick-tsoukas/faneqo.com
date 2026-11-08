'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const policy = require('../src/policies/subscription-active');

const schema = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, '../src/extensions/users-permissions/content-types/user/schema.json'),
    'utf8'
  )
);
const userAdmin = fs.readFileSync(
  path.join(__dirname, '../src/api/user-admin/controllers/user-admin.js'),
  'utf8'
);

let passed = 0;
async function test(name, fn) {
  await fn();
  passed += 1;
  console.log(`  ✅ ${name}`);
}

(async () => {
console.log('\n=== User default subscription status ===\n');

await test('schema default is unpaid, not trialing', () => {
  assert.strictEqual(schema.attributes.subscriptionStatus.default, 'unpaid');
  assert.notStrictEqual(schema.attributes.subscriptionStatus.default, 'trialing');
  assert.ok(schema.attributes.subscriptionStatus.enum.includes('unpaid'));
});

await test('user-admin register explicitly writes unpaid', () => {
  assert.match(userAdmin, /subscriptionStatus: 'unpaid'/);
  assert.doesNotMatch(userAdmin, /subscriptionStatus: 'trialing'/);
});

await test('creating a users-permissions user without Stripe metadata is not Pro', async () => {
  const ctx = {
    state: { user: { subscriptionStatus: schema.attributes.subscriptionStatus.default } },
    response: {
      unauthorized: () => false,
      forbidden: () => false,
    },
  };
  assert.strictEqual(await policy(ctx, {}, { strapi: {} }), false);
});

console.log(`\n=== user default status: ${passed} passed ===`);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
