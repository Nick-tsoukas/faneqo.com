'use strict';

/**
 * Payout onboarding return: Stripe sends the artist back to the band and page
 * they started from, and a status check tells them where setup stands.
 * Run: node scripts/test-payout-onboarding.js
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { onboardingUrls, payoutStage, requirementsDueCount } = require('../src/utils/payments/payoutOnboarding');

const read = (rel) => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
const env = {
  STRIPE_CONNECT_RETURN_URL: 'https://faneqo.com/dashboard',
  STRIPE_CONNECT_REFRESH_URL: 'https://faneqo.com/dashboard',
};

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log(`  PASS  ${name}`);
}

test('band editor setup returns to that band in the editor', () => {
  assert.deepStrictEqual(onboardingUrls({ bandId: 60, from: 'editband', env }), {
    return_url: 'https://faneqo.com/editband/60?payouts=return',
    refresh_url: 'https://faneqo.com/editband/60?payouts=refresh',
  });
});

test('dashboard setup (and any unknown origin page) returns to that band on the dashboard', () => {
  const expected = {
    return_url: 'https://faneqo.com/dashboard?bandId=7&payouts=return',
    refresh_url: 'https://faneqo.com/dashboard?bandId=7&payouts=refresh',
  };
  assert.deepStrictEqual(onboardingUrls({ bandId: '7', from: 'dashboard', env }), expected);
  assert.deepStrictEqual(onboardingUrls({ bandId: 7, env }), expected);
  assert.deepStrictEqual(onboardingUrls({ bandId: 7, from: 'https://evil.example/x', env }), expected);
});

test('only the configured origin is used, so the request cannot redirect elsewhere', () => {
  const urls = onboardingUrls({ bandId: 7, from: 'editband', env: { STRIPE_CONNECT_RETURN_URL: 'https://faneqo.com/some/path?x=1' } });
  assert.ok(urls.return_url.startsWith('https://faneqo.com/editband/7?'));
});

test('bad band id or missing config falls back to the configured URLs unchanged', () => {
  const fallback = { return_url: env.STRIPE_CONNECT_RETURN_URL, refresh_url: env.STRIPE_CONNECT_REFRESH_URL };
  assert.deepStrictEqual(onboardingUrls({ bandId: 'abc', from: 'editband', env }), fallback);
  assert.deepStrictEqual(onboardingUrls({ bandId: 0, env }), fallback);
  assert.deepStrictEqual(onboardingUrls({ bandId: 7, env: {} }), { return_url: undefined, refresh_url: undefined });
});

test('stages follow Stripe and the stored flags', () => {
  assert.strictEqual(payoutStage({ hasAccount: false, paymentsEnabled: false, stripeOnboardingComplete: false }), 'not_started');
  assert.strictEqual(payoutStage({ hasAccount: true, account: { details_submitted: false }, paymentsEnabled: false, stripeOnboardingComplete: false }), 'in_progress');
  assert.strictEqual(payoutStage({ hasAccount: true, account: { details_submitted: true, charges_enabled: false }, paymentsEnabled: false, stripeOnboardingComplete: true }), 'review');
  assert.strictEqual(payoutStage({ hasAccount: true, account: { details_submitted: true, charges_enabled: true }, paymentsEnabled: false, stripeOnboardingComplete: true }), 'paused');
  assert.strictEqual(payoutStage({ hasAccount: true, account: { details_submitted: true, charges_enabled: true }, paymentsEnabled: true, stripeOnboardingComplete: true }), 'live');
});

test('Stripe unreachable: stage comes from stored flags and never claims live without them', () => {
  assert.strictEqual(payoutStage({ hasAccount: true, paymentsEnabled: true, stripeOnboardingComplete: true }), 'live');
  assert.strictEqual(payoutStage({ hasAccount: true, paymentsEnabled: false, stripeOnboardingComplete: true }), 'review');
  assert.strictEqual(payoutStage({ hasAccount: true, paymentsEnabled: true, stripeOnboardingComplete: false }), 'in_progress');
});

test('requirements are counted, never echoed', () => {
  assert.strictEqual(requirementsDueCount({ requirements: { currently_due: ['individual.ssn_last_4', 'external_account'] } }), 2);
  assert.strictEqual(requirementsDueCount(null), 0);
});

test('onboard uses the band-specific URLs; status is owner-only and stores webhook-equivalent flags', () => {
  const controller = read('src/api/band/controllers/payments.js');
  assert.match(controller, /\.\.\.onboardingUrls\(\{ bandId, from: ctx\.request\.body\?\.from \}\)/);
  assert.doesNotMatch(controller, /return_url: process\.env/);
  const status = controller.slice(controller.indexOf('async status(ctx)'), controller.indexOf('async summary(ctx)'));
  assert.match(status, /connectFlagsForBand\(strapi, bandId, retrieved\)/, 'same rule as the Connect webhook');
  // checkedWithStripe is true only after the fresh flags were computed and stored.
  assert.ok(status.indexOf('account = retrieved;') > status.indexOf('flags = fresh;'), 'account set only after a complete check');
  assert.match(status, /checkedWithStripe: Boolean\(account\)/);
  assert.doesNotMatch(status, /accounts\.create|accountLinks/, 'status never creates Stripe objects');
  assert.doesNotMatch(status, /stripeAccountId:|currently_due\b(?!.*Count)/, 'no account id or requirement names in the response');

  const routes = read('src/api/band/routes/payments.js');
  const route = routes.slice(routes.indexOf('/bands/:id/payments/status'));
  assert.match(route.slice(0, 300), /isAuthenticated[\s\S]*api::band\.owns-band/);
});

test('signed-in artists are granted the status action at boot (or every call is 403)', () => {
  const index = read('src/index.js');
  const grants = index.slice(index.indexOf('async function ensurePaymentsPermissions'), index.indexOf('async function ensureMessagingPermissions'));
  assert.match(grants, /'api::band\.payments\.onboard'/);
  assert.match(grants, /'api::band\.payments\.status'/);
});

console.log(`\n${passed} passed`);
