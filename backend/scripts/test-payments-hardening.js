'use strict';

/**
 * Payments hardening (October 2026 card-testing incident) — regression tests.
 *
 *   - paymentsEnabled follows Stripe (details submitted AND charges allowed)
 *   - an admin suspension list beats the webhook, onboarding and checkout
 *   - optional approval gate (FANEQO_PAYMENTS_REQUIRE_APPROVAL)
 *   - checkout amount rules, including presets "+ Custom" and the $0.50 floor
 *   - checkout limits per band and per visitor (not IP-only), repeat-tap reuse
 *
 * Run: node scripts/test-payments-hardening.js
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.join(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(repoRoot, rel), 'utf8');
const codeOnly = (src) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

let passed = 0;
let failed = 0;
async function test(name, fn) {
  try {
    await fn();
    passed += 1;
    console.log(`  PASS  ${name}`);
  } catch (err) {
    failed += 1;
    console.error(`  FAIL  ${name}`);
    console.error(`        ${err.message}`);
  }
}

const access = require('../src/utils/payments/paymentAccess');
const { resolveCheckoutCents } = require('../src/utils/payments/checkoutAmount');
const { createCheckoutGuard, clientIp } = require('../src/utils/payments/checkoutGuard');

// owners: { [bandId]: { id, blocked } | null | 'throw' }; bands not listed have an active owner.
function kvStrapi(rows, owners = {}) {
  return {
    log: { warn() {} },
    entityService: {
      async findMany(uid, opts) {
        assert.strictEqual(uid, 'api::system-kv.system-kv');
        const row = rows[opts.filters.key];
        return row === undefined ? [] : [{ key: opts.filters.key, value: row }];
      },
      async findOne(uid, id, opts) {
        assert.strictEqual(uid, 'api::band.band');
        assert.ok(opts?.populate?.users_permissions_user, 'owner is populated');
        const owner = Object.prototype.hasOwnProperty.call(owners, id) ? owners[id] : { id: 1, blocked: false };
        if (owner === 'throw') throw new Error('db down');
        // A Stripe-ready band (eligibility re-reads the flags rather than trusting the caller).
        return { id, stripeAccountId: 'acct_live', paymentsEnabled: true, stripeOnboardingComplete: true, users_permissions_user: owner };
      },
    },
  };
}

const ctxFor = (ip, ua) => ({ request: { headers: { 'x-forwarded-for': ip, 'user-agent': ua } } });

(async () => {
  console.log('\nConnect state');
  await test('payments are on only with details submitted AND charges allowed', () => {
    const f = access.connectFlagsFor;
    assert.deepStrictEqual(f({ details_submitted: true, charges_enabled: true }), { stripeOnboardingComplete: true, paymentsEnabled: true });
    assert.deepStrictEqual(f({ details_submitted: true, charges_enabled: false }), { stripeOnboardingComplete: true, paymentsEnabled: false });
    assert.deepStrictEqual(f({ details_submitted: false, charges_enabled: true }), { stripeOnboardingComplete: false, paymentsEnabled: false });
    assert.deepStrictEqual(f({}), { stripeOnboardingComplete: false, paymentsEnabled: false });
  });

  await test('suspension or a missing approval keeps payments off', () => {
    const live = { details_submitted: true, charges_enabled: true };
    assert.strictEqual(access.connectFlagsFor(live, { suspended: true }).paymentsEnabled, false);
    assert.strictEqual(access.connectFlagsFor(live, { approved: false }).paymentsEnabled, false);
  });

  console.log('\nSuspension and approval lists');
  await test('parseBandIds accepts {bandIds:[...]} or a bare array, ignoring junk', () => {
    assert.deepStrictEqual([...access.parseBandIds({ bandIds: [70, '73', 'x', null] })], ['70', '73']);
    assert.deepStrictEqual([...access.parseBandIds([5])], ['5']);
    assert.deepStrictEqual([...access.parseBandIds(null)], []);
  });

  await test('isPaymentsSuspended reads the system-kv list', async () => {
    access.clearPaymentAccessCache();
    const strapi = kvStrapi({ [access.SUSPENDED_KEY]: { bandIds: [70, 73] } });
    assert.strictEqual(await access.isPaymentsSuspended(strapi, 70), true);
    assert.strictEqual(await access.isPaymentsSuspended(strapi, '73'), true);
    assert.strictEqual(await access.isPaymentsSuspended(strapi, 30), false);
  });

  await test('approval gate is off by default and enforced when the env flag is true', async () => {
    access.clearPaymentAccessCache();
    const strapi = kvStrapi({ [access.APPROVED_KEY]: { bandIds: [30] } });
    assert.strictEqual(await access.isPaymentsApproved(strapi, 99, {}), true);
    assert.strictEqual(await access.isPaymentsApproved(strapi, 99, { FANEQO_PAYMENTS_REQUIRE_APPROVAL: 'true' }), false);
    assert.strictEqual(await access.isPaymentsApproved(strapi, 30, { FANEQO_PAYMENTS_REQUIRE_APPROVAL: 'true' }), true);
  });

  console.log('\nAmounts');
  await test('min mode enforces the larger of the artist minimum and $0.50', () => {
    assert.deepStrictEqual(resolveCheckoutCents({ pricingMode: 'min' }, 0.3), { ok: false, error: 'Amount too low' });
    assert.deepStrictEqual(resolveCheckoutCents({ pricingMode: 'min' }, 0.5), { ok: true, cents: 50 });
    assert.deepStrictEqual(resolveCheckoutCents({ pricingMode: 'min', minAmount: 5 }, 4), { ok: false, error: 'Amount too low' });
    assert.deepStrictEqual(resolveCheckoutCents({ pricingMode: 'min', minAmount: 5 }, 12.34), { ok: true, cents: 1234 });
  });

  await test('presets accept a listed amount or a custom amount at or above the smallest preset', () => {
    const btn = { pricingMode: 'presets', presetAmounts: [5, 10, 20] };
    assert.deepStrictEqual(resolveCheckoutCents(btn, 10), { ok: true, cents: 1000 });
    assert.deepStrictEqual(resolveCheckoutCents(btn, 15), { ok: true, cents: 1500 });
    assert.deepStrictEqual(resolveCheckoutCents(btn, 3), { ok: false, error: 'Amount too low' });
    assert.deepStrictEqual(resolveCheckoutCents(btn, 'abc'), { ok: false, error: 'Invalid amount' });
  });

  await test('fixed mode ignores the client amount; caps and unknown modes are rejected', () => {
    assert.deepStrictEqual(resolveCheckoutCents({ pricingMode: 'fixed', fixedAmount: 15 }, 1), { ok: true, cents: 1500 });
    assert.deepStrictEqual(resolveCheckoutCents({ pricingMode: 'fixed', fixedAmount: 0.2 }), { ok: false, error: 'Amount invalid' });
    assert.deepStrictEqual(resolveCheckoutCents({ pricingMode: 'min' }, 2000000), { ok: false, error: 'Amount too high' });
    assert.deepStrictEqual(resolveCheckoutCents({ pricingMode: 'weird' }, 5), { ok: false, error: 'Unsupported pricingMode' });
  });

  console.log('\nCheckout limits');
  await test('client IP is the rightmost X-Forwarded-For entry (the one the proxy appended)', () => {
    assert.strictEqual(clientIp(ctxFor('1.1.1.1, 203.0.113.9', 'ua')), '203.0.113.9');
    assert.strictEqual(clientIp({ ip: '10.0.0.1', request: { headers: {} } }), '10.0.0.1');
  });

  await test('per-visitor limit blocks one device but not others on the same IP', () => {
    let t = 0;
    const g = createCheckoutGuard({ now: () => t, env: { FANEQO_CHECKOUT_LIMIT_PER_VISITOR: '3', FANEQO_CHECKOUT_LIMIT_PER_BAND: '100' } });
    const phone = ctxFor('203.0.113.9', 'iPhone A');
    for (let i = 0; i < 3; i++) {
      assert.strictEqual(g.check(7, phone).ok, true);
      g.recordSession(7, phone);
    }
    const blocked = g.check(7, phone);
    assert.strictEqual(blocked.ok, false);
    assert.strictEqual(blocked.scope, 'visitor');
    assert.ok(blocked.retryAfterSec > 0);
    assert.strictEqual(g.check(7, ctxFor('203.0.113.9', 'Pixel B')).ok, true, 'same venue IP, other device');
    assert.strictEqual(g.check(8, phone).ok, true, 'other band');
    t += 10 * 60 * 1000 + 1;
    assert.strictEqual(g.check(7, phone).ok, true, 'window expired');
  });

  await test('per-band limit applies whatever the source', () => {
    const g = createCheckoutGuard({ now: () => 0, env: { FANEQO_CHECKOUT_LIMIT_PER_BAND: '2', FANEQO_CHECKOUT_LIMIT_PER_VISITOR: '50' } });
    g.recordSession(9, ctxFor('1.1.1.1', 'a'));
    g.recordSession(9, ctxFor('2.2.2.2', 'b'));
    const r = g.check(9, ctxFor('3.3.3.3', 'c'));
    assert.strictEqual(r.ok, false);
    assert.strictEqual(r.scope, 'band');
  });

  await test('a repeat tap with the same attemptId reuses the session; bad ids are ignored', () => {
    const g = createCheckoutGuard({ now: () => 0 });
    const key = g.attemptKey(7, 'attempt_12345678', 'tip_band', 500);
    assert.ok(key);
    assert.strictEqual(g.reuse(key), null);
    g.remember(key, { url: 'https://checkout.stripe.com/x', supportMomentId: 1 });
    assert.deepStrictEqual(g.reuse(key), { url: 'https://checkout.stripe.com/x', supportMomentId: 1 });
    assert.notStrictEqual(g.attemptKey(7, 'attempt_12345678', 'tip_band', 1000), key, 'amount is part of the key');
    assert.strictEqual(g.attemptKey(7, 'x', 'tip_band', 500), null);
    assert.strictEqual(g.attemptKey(7, '../../etc', 'tip_band', 500), null);
  });

  console.log('\nFraud signals');
  await test('early fraud warnings and fraudulent disputes are fraud signals; other disputes are not', () => {
    assert.strictEqual(access.isFraudSignal({ type: 'radar.early_fraud_warning.created', data: { object: {} } }), true);
    assert.strictEqual(access.isFraudSignal({ type: 'charge.dispute.created', data: { object: { reason: 'fraudulent' } } }), true);
    assert.strictEqual(access.isFraudSignal({ type: 'charge.dispute.created', data: { object: { reason: 'product_not_received' } } }), false);
    assert.strictEqual(access.isFraudSignal({ type: 'charge.dispute.updated', data: { object: { reason: 'fraudulent' } } }), false);
    assert.strictEqual(access.isFraudSignal(null), false);
  });

  await test('fraud signals only log unless FANEQO_SUSPEND_ON_FRAUD_SIGNAL=true', () => {
    assert.strictEqual(access.suspendOnFraudSignal({}), false, 'unset: log only');
    assert.strictEqual(access.suspendOnFraudSignal({ FANEQO_SUSPEND_ON_FRAUD_SIGNAL: '' }), false);
    assert.strictEqual(access.suspendOnFraudSignal({ FANEQO_SUSPEND_ON_FRAUD_SIGNAL: 'FALSE' }), false);
    assert.strictEqual(access.suspendOnFraudSignal({ FANEQO_SUSPEND_ON_FRAUD_SIGNAL: 'yes' }), false, 'only an explicit true arms it');
    assert.strictEqual(access.suspendOnFraudSignal({ FANEQO_SUSPEND_ON_FRAUD_SIGNAL: ' True ' }), true);
  });

  await test('suspendBandPayments adds the band once, keeps the others, and turns payments off', async () => {
    const kv = { id: 9, key: access.SUSPENDED_KEY, value: { bandIds: [70] } };
    const writes = [];
    const strapi = {
      entityService: {
        async findMany() { return kv.value ? [kv] : []; },
        async update(uid, id, { data }) {
          writes.push([uid, id, data]);
          if (uid === 'api::system-kv.system-kv') kv.value = data.value;
        },
        async create() { throw new Error('row exists; must update'); },
      },
    };
    access.clearPaymentAccessCache();
    assert.deepStrictEqual(await access.suspendBandPayments(strapi, 140), { added: true });
    assert.deepStrictEqual(kv.value, { bandIds: [70, 140] });
    assert.deepStrictEqual(writes.at(-1), ['api::band.band', 140, { paymentsEnabled: false }]);
    assert.deepStrictEqual(await access.suspendBandPayments(strapi, 140), { added: false });
    assert.deepStrictEqual(kv.value, { bandIds: [70, 140] });
    assert.strictEqual(await access.isPaymentsSuspended(strapi, 140), true, 'cache refreshed');
  });

  await test('suspendBandPayments creates the list when it does not exist', async () => {
    const created = [];
    const strapi = {
      entityService: {
        async findMany() { return []; },
        async update() {},
        async create(uid, { data }) { created.push(data); },
      },
    };
    await access.suspendBandPayments(strapi, 5);
    assert.deepStrictEqual(created, [{ key: access.SUSPENDED_KEY, value: { bandIds: [5] } }]);
  });

  console.log('\nPublic payment readiness matches checkout');
  const live = { id: 30, paymentsEnabled: true, stripeOnboardingComplete: true, stripeAccountId: 'acct_live' };
  await test('stored flags: all three are needed (flag, onboarding, account)', () => {
    assert.strictEqual(access.storedFlagsAllowCheckout(live), true);
    assert.strictEqual(access.storedFlagsAllowCheckout({ ...live, paymentsEnabled: false }), false);
    assert.strictEqual(access.storedFlagsAllowCheckout({ ...live, stripeOnboardingComplete: false }), false);
    assert.strictEqual(access.storedFlagsAllowCheckout({ ...live, stripeAccountId: null }), false);
    assert.strictEqual(access.storedFlagsAllowCheckout(null), false);
  });

  await test('isCheckoutReady: a live band is ready', async () => {
    access.clearPaymentAccessCache();
    assert.strictEqual(await access.isCheckoutReady(kvStrapi({}), live), true);
  });

  await test('isCheckoutReady: never set up (Emerge shape) is not ready', async () => {
    access.clearPaymentAccessCache();
    const emerge = { id: 60, paymentsEnabled: false, stripeOnboardingComplete: false, stripeAccountId: null };
    assert.strictEqual(await access.isCheckoutReady(kvStrapi({}), emerge), false);
  });

  await test('isCheckoutReady: suspended by hand while the stored flag is still true is not ready', async () => {
    access.clearPaymentAccessCache();
    assert.strictEqual(await access.isCheckoutReady(kvStrapi({ [access.SUSPENDED_KEY]: { bandIds: [30] } }), live), false);
  });

  await test('isCheckoutReady: approval gate on and band not approved is not ready', async () => {
    const prev = process.env.FANEQO_PAYMENTS_REQUIRE_APPROVAL;
    process.env.FANEQO_PAYMENTS_REQUIRE_APPROVAL = 'true';
    try {
      access.clearPaymentAccessCache();
      assert.strictEqual(await access.isCheckoutReady(kvStrapi({}), live), false);
      access.clearPaymentAccessCache();
      assert.strictEqual(await access.isCheckoutReady(kvStrapi({ [access.APPROVED_KEY]: { bandIds: [30] } }), live), true);
    } finally {
      if (prev === undefined) delete process.env.FANEQO_PAYMENTS_REQUIRE_APPROVAL;
      else process.env.FANEQO_PAYMENTS_REQUIRE_APPROVAL = prev;
    }
  });

  console.log('\nBlocked owners (November 2026 containment)');
  await test('isCheckoutReady: a blocked owner is not ready even with every flag on', async () => {
    access.clearPaymentAccessCache();
    assert.strictEqual(await access.isCheckoutReady(kvStrapi({}, { [live.id]: { id: 9, blocked: true } }), live), false);
  });

  await test('isCheckoutReady: a band with no owner is not ready', async () => {
    access.clearPaymentAccessCache();
    assert.strictEqual(await access.isCheckoutReady(kvStrapi({}, { [live.id]: null }), live), false);
  });

  await test('isOwnerAllowed fails closed when the lookup throws', async () => {
    assert.strictEqual(await access.isOwnerAllowed(kvStrapi({}, { 5: 'throw' }), 5), false);
    assert.strictEqual(await access.isOwnerAllowed(kvStrapi({}), 5), true, 'an active owner is allowed');
  });

  await test('checkout refuses through paymentEligibility before creating a Stripe session', () => {
    const src = codeOnly(read('src/api/band/controllers/checkout.js'));
    const gate = src.indexOf('await paymentEligibility(strapi, band.id)');
    const refuse = src.indexOf('if (!eligibility.eligible)');
    const session = src.indexOf('stripe.checkout.sessions.create(');
    const moment = src.indexOf('"api::support-moment.support-moment", {');
    assert.ok(gate > 0 && refuse > gate, 'checkout asks paymentEligibility and refuses on it');
    assert.ok(refuse < moment && refuse < session, 'before any record or Stripe session is created');
  });

  console.log('\nWiring');
  await test('the public band page reports paymentsEnabled from isCheckoutReady', () => {
    const src = codeOnly(read('src/api/band/controllers/band.js'));
    const start = src.indexOf('async findBySlug(ctx)');
    const body = src.slice(start, src.indexOf('async ', start + 20));
    assert.ok(body.includes('await isCheckoutReady(strapi, band[0])'), 'slug handler computes readiness');
    assert.ok(/presentPublicBand\(\{[^}]*paymentsEnabled[^}]*\}\)/.test(body), 'readiness replaces the stored flag');
  });

  await test('checkout uses the same stored-flag rule as the public page', () => {
    const src = codeOnly(read('src/api/band/controllers/checkout.js'));
    assert.ok(src.includes('if (!storedFlagsAllowCheckout(band))'), 'checkout gate shares storedFlagsAllowCheckout');
  });

  await test('the Connect webhook suspends the band on a fraud signal', () => {
    const src = codeOnly(read('src/api/stripe/controllers/connect-webhook.js'));
    assert.ok(src.includes('isFraudSignal(event) && event.account'), 'checks fraud signals on connected-account events');
    assert.ok(src.includes('suspendBandPayments(strapi, band.id)'), 'suspends the band');
    const vetted = src.indexOf('isOnApprovedList(strapi, band.id)');
    assert.ok(vetted > 0 && vetted < src.indexOf('suspendBandPayments(strapi, band.id)'), 'vetted bands are checked before suspending');
  });

  await test('vetted bands are on the approved list even when the approval gate is off', async () => {
    access.clearPaymentAccessCache();
    const strapi = kvStrapi({ [access.APPROVED_KEY]: { bandIds: [30] } });
    assert.strictEqual(await access.isOnApprovedList(strapi, 30), true);
    assert.strictEqual(await access.isOnApprovedList(strapi, 70), false);
    assert.strictEqual(await access.isPaymentsApproved(strapi, 70, {}), true, 'gate off: everyone may take payments');
  });

  await test('checkout checks suspension, amount rules and limits before creating a Stripe session', () => {
    const src = codeOnly(read('src/api/band/controllers/checkout.js'));
    const at = (needle) => {
      const i = src.indexOf(needle);
      assert.ok(i >= 0, `missing ${needle}`);
      return i;
    };
    const session = at('stripe.checkout.sessions.create(');
    // Suspension and the approval gate now live inside paymentEligibility (tested in test-payment-eligibility.js).
    for (const needle of ['paymentEligibility(strapi, band.id)', 'resolveCheckoutCents(btn, amount)', 'guard.check(band.id, ctx)']) {
      assert.ok(at(needle) < session, `${needle} must run before the session is created`);
    }
  });

  await test('webhook and onboarding no longer hard-code paymentsEnabled: true', () => {
    for (const rel of ['src/api/stripe/controllers/connect-webhook.js', 'src/api/band/controllers/payments.js']) {
      const src = codeOnly(read(rel));
      assert.ok(!/paymentsEnabled:\s*true/.test(src), `${rel} still sets paymentsEnabled: true`);
      assert.ok(src.includes('connectFlagsForBand(strapi'), `${rel} must use connectFlagsForBand`);
    }
  });

  await test('signup confirmation refuses known emails and creates subscriptions idempotently', () => {
    const src = codeOnly(read('src/api/stripe/controllers/stripe.js'));
    const start = src.indexOf('async confirmPayment(ctx)');
    const body = src.slice(start, src.indexOf('async ', start + 30));
    const userCheck = body.indexOf("query('plugin::users-permissions.user').findOne");
    const reuse = body.indexOf('stripe.subscriptions.list(');
    const create = body.indexOf('stripe.subscriptions.create(');
    assert.ok(userCheck > 0 && reuse > userCheck && create > reuse, 'check user, then reuse, then create');
    assert.ok(body.includes('idempotencyKey: `confirm-payment-${session_id}`'), 'idempotent create');
  });

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed) process.exit(1);
})();
