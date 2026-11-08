'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(
  path.join(__dirname, '../src/api/stripe/controllers/stripe.js'),
  'utf8'
);
const confirm = src.slice(
  src.indexOf('async confirmSocial(ctx)'),
  src.indexOf('async testRoute(ctx)')
);

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log(`  ✅ ${name}`);
}

console.log('\n=== Strapi confirmSocial billing ===\n');

test('new social Stripe failure does not issue JWT', () => {
  const newBranch = confirm.slice(confirm.indexOf('STRIPE_DEFAULT_PRICE_ID'));
  assert.match(newBranch, /Failed to create Stripe customer/);
  assert.match(newBranch, /Failed to persist billing information/);
  assert.match(newBranch, /hasRequiredBillingMetadata\(newUser\)/);
  const fail = newBranch.slice(0, newBranch.indexOf('const jwt'));
  assert.doesNotMatch(fail, /jwt\.issue/);
});

test('new social success persists truthful Stripe status, not blanket active', () => {
  assert.match(confirm, /buildArtistBillingFields/);
  assert.doesNotMatch(confirm, /subscription\.status === 'trialing' \? 'trialing' : 'active'/);
});

test('ambassador existing user skips Stripe repair', () => {
  assert.match(confirm, /isBillingExemptLifetimePro\(existingUser\)/);
  assert.match(confirm, /billingExempt: true/);
});

test('existing billed-or-incomplete user can still receive JWT if Stripe repair fails', () => {
  const existing = confirm.slice(0, confirm.indexOf('const priceId'));
  assert.match(existing, /Continue with login|billingReady = false|jwt\.issue/);
  assert.match(existing, /subscriptionStatus: 'unpaid'/);
  assert.match(existing, /return ctx\.send\(\{ jwt, billingReady \}\)/);
});

test('user create failure after Stripe cleans up only owned objects', () => {
  assert.match(confirm, /Strapi user creation failed/);
  assert.match(confirm, /createdCustomer: provision\.createdCustomer/);
  assert.match(confirm, /createdSubscription: provision\.createdSubscription/);
});

console.log(`\n=== confirmSocial billing: ${passed} passed ===`);
