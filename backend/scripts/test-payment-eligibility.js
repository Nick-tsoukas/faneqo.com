/**
 * Payment eligibility: who may take a fan payment, decided once on the server.
 *
 *   - security first (blocked owner, suspension, review hold), then billing
 *     (Lifetime Pro, dated exception, verified paid subscription, grace), then
 *     Stripe readiness, then the Ops-0 approval gate
 *   - a paid subscription is necessary, never sufficient
 *   - shadow mode (default) never refuses on billing; enforce does
 *   - direct POST /bands/:id/payments/checkout cannot bypass any of it
 *
 * Run: node scripts/test-payment-eligibility.js
 */
'use strict';

const assert = require('assert');
const path = require('path');
const Module = require('module');

process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_dummy';
delete process.env.FANEQO_PAYMENTS_REQUIRE_APPROVAL;
delete process.env.FANEQO_PAYMENTS_REQUIRE_PAID;

// Stripe stand-in for the checkout controller: records sessions, never calls out.
const sessions = [];
const stripeCalls = [];
function FakeStripe() {
  this.checkout = { sessions: { create: async (params, opts) => { sessions.push({ params, opts }); return { id: 'cs_t', url: 'https://checkout.stripe.test/cs_t', payment_intent: null }; } } };
  this.accounts = {
    create: async (p) => { stripeCalls.push('accounts.create'); return { id: 'acct_new' }; },
    retrieve: async (id) => { stripeCalls.push('accounts.retrieve'); return { id, details_submitted: false, charges_enabled: false }; },
    update: async () => { stripeCalls.push('accounts.update'); return {}; },
  };
  this.accountLinks = { create: async () => { stripeCalls.push('accountLinks.create'); return { url: 'https://connect.stripe.test/setup' }; } };
}
const realLoad = Module._load;
Module._load = function load(request, ...rest) { return request === 'stripe' ? FakeStripe : realLoad.call(this, request, ...rest); };

const el = require('../src/utils/payments/paymentEligibility');
const access = require('../src/utils/payments/paymentAccess');

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

const NOW = Date.parse('2026-11-09T12:00:00Z');
const DAY = 24 * 60 * 60 * 1000;
const READY = { stripeAccountId: 'acct_x', paymentsEnabled: true, stripeOnboardingComplete: true };
const PAID = { id: 7, blocked: false, subscriptionStatus: 'active', plan: null, firstPaidAt: '2026-11-01T00:00:00Z' };
const TRIAL = { id: 7, blocked: false, subscriptionStatus: 'trialing', plan: null, firstPaidAt: null, trialEndsAt: '2026-12-01' };

function world({ band = {}, owner = PAID, kv = {}, throwOnBand = false } = {}) {
  access.clearPaymentAccessCache();
  const record = { id: 30, ...READY, ...band, users_permissions_user: owner };
  return {
    log: { warn() {}, info() {}, error() {} },
    entityService: {
      findOne: async (uid) => {
        if (throwOnBand) throw new Error('db down');
        return uid === 'api::band.band' ? record : null;
      },
      findMany: async (uid, opts) => {
        if (uid !== 'api::system-kv.system-kv') return [];
        const v = kv[opts.filters.key];
        return v === undefined ? [] : [{ key: opts.filters.key, value: v }];
      },
      create: async (uid, { data }) => ({ id: 99, ...data }),
      update: async () => ({}),
    },
  };
}
const ENFORCE = { FANEQO_PAYMENTS_REQUIRE_PAID: 'enforce' };
const decide = (w, env = ENFORCE, now = NOW) => el.paymentEligibility(w, 30, { env, now });

(async () => {
  console.log('\nBilling standing (pure)');
  await test('Lifetime Pro and an unexpired exception are entitled without a subscription', () => {
    assert.deepEqual(el.billingStanding({ plan: 'free', subscriptionStatus: 'canceled' }), { entitled: true, standing: 'lifetime' });
    assert.deepEqual(el.billingStanding({ subscriptionStatus: 'free' }), { entitled: true, standing: 'lifetime' });
    assert.deepEqual(el.billingStanding({ subscriptionStatus: 'canceled' }, { exception: { expiresAt: 'x' } }), { entitled: true, standing: 'exception' });
  });

  await test('active needs a verified first payment; trialing is never entitled', () => {
    assert.deepEqual(el.billingStanding(PAID), { entitled: true, standing: 'paid' });
    assert.deepEqual(el.billingStanding({ subscriptionStatus: 'active' }), { entitled: false, standing: 'unverified' });
    assert.deepEqual(el.billingStanding(TRIAL), { entitled: false, standing: 'trial' });
  });

  await test('past due: entitled only within 3 days of grace and only if paid before', () => {
    const pd = (start, paid = true) => el.billingStanding({ subscriptionStatus: 'pastDue', gracePeriodStart: start, firstPaidAt: paid ? '2026-10-01' : null }, { now: NOW });
    assert.equal(pd(new Date(NOW - 2 * DAY).toISOString()).standing, 'grace');
    assert.equal(pd(new Date(NOW - 2 * DAY).toISOString()).entitled, true);
    assert.equal(pd(new Date(NOW - 4 * DAY).toISOString()).standing, 'past_due');
    assert.equal(pd(new Date(NOW - 1 * DAY).toISOString(), false).standing, 'past_due');
    assert.equal(pd(null).standing, 'past_due');
  });

  await test('lapsed artists: canceled if they paid before, trial ended if they never did', () => {
    assert.equal(el.billingStanding({ subscriptionStatus: 'canceled', firstPaidAt: '2026-01-01' }).standing, 'canceled');
    assert.equal(el.billingStanding({ subscriptionStatus: 'canceled' }).standing, 'trial_ended');
    assert.equal(el.billingStanding({ subscriptionStatus: 'unpaid' }).standing, 'trial_ended');
  });

  await test('exceptions apply only to their band and only until they expire', () => {
    const v = { exceptions: [{ bandId: 30, reason: 'grandfathered', reviewBy: '2026-12-01', expiresAt: '2026-12-15T00:00:00Z' }] };
    assert.ok(el.activeException(v, 30, NOW));
    assert.equal(el.activeException(v, 31, NOW), null);
    assert.equal(el.activeException(v, 30, Date.parse('2026-12-16T00:00:00Z')), null);
    assert.equal(el.activeException({ exceptions: [{ bandId: 30, expiresAt: 'never' }] }, 30, NOW), null, 'bad date fails closed');
    assert.equal(el.activeException(null, 30, NOW), null);
  });

  console.log('\nOrder of checks (enforce mode)');
  await test('security wins over everything: blocked owner, missing owner, suspension', async () => {
    assert.equal((await decide(world({ owner: { ...PAID, blocked: true } }))).state, 'unavailable');
    assert.equal((await decide(world({ owner: null }))).state, 'unavailable');
    assert.equal((await decide(world({ owner: { id: 7, plan: 'free' }, kv: { 'payments:suspended-bands': { bandIds: [30] } } }))).state, 'unavailable', 'even Lifetime Pro');
    assert.equal((await decide(world({ owner: TRIAL, kv: { 'payments:suspended-bands': { bandIds: [30] } } }))).state, 'unavailable', 'before billing');
  });

  await test('an automatic review hold pauses payments (state review)', async () => {
    const r = await decide(world({ kv: { 'payments:review-bands': { bandIds: [30] } } }));
    assert.deepEqual([r.eligible, r.state], [false, 'review']);
  });

  await test('a trialing artist with Stripe ready cannot take payments (upgrade)', async () => {
    const r = await decide(world({ owner: TRIAL }));
    assert.deepEqual([r.eligible, r.state, r.reason], [false, 'upgrade', 'billing_required']);
  });

  await test('lapsed / past-due artists get their own states', async () => {
    assert.equal((await decide(world({ owner: { id: 7, subscriptionStatus: 'canceled', firstPaidAt: '2026-01-01' } }))).state, 'canceled');
    assert.equal((await decide(world({ owner: { id: 7, subscriptionStatus: 'canceled' } }))).state, 'trial_ended');
    assert.equal((await decide(world({ owner: { id: 7, subscriptionStatus: 'pastDue', firstPaidAt: '2026-01-01', gracePeriodStart: new Date(NOW - 5 * DAY).toISOString() } }))).state, 'past_due');
  });

  await test('paid is necessary, never sufficient: Stripe setup and review still apply', async () => {
    assert.equal((await decide(world({ band: { stripeAccountId: null } }))).state, 'payout_setup');
    assert.equal((await decide(world({ band: { stripeOnboardingComplete: false } }))).state, 'payout_setup');
    assert.equal((await decide(world({ band: { paymentsEnabled: false } }))).state, 'stripe_review');
  });

  await test('the Ops-0 approval gate still applies to paid artists', async () => {
    const env = { ...ENFORCE, FANEQO_PAYMENTS_REQUIRE_APPROVAL: 'true' };
    assert.equal((await decide(world(), env)).state, 'security_review');
    // The stored flag is already false for an unapproved band (connectFlagsFor folds
    // the gate in): it must still read as awaiting approval, not "Stripe verifying".
    assert.equal((await decide(world({ band: { paymentsEnabled: false } }), env)).state, 'security_review');
    assert.equal((await decide(world({ band: { stripeAccountId: null } }), env)).state, 'payout_setup', 'setup still comes first');
    const ok = await decide(world({ kv: { 'payments:approved-bands': { bandIds: [30, 110] } } }), env);
    assert.deepEqual([ok.eligible, ok.state], [true, 'live']);
  });

  await test('manual approval takes effect at once, with no Stripe update needed', async () => {
    const env = { ...ENFORCE, FANEQO_PAYMENTS_REQUIRE_APPROVAL: 'true' };
    // Stored flags now mirror Stripe + suspension only (approval is not folded in).
    const flags = await access.connectFlagsForBand(world(), 30, { details_submitted: true, charges_enabled: true });
    assert.deepEqual(flags, { stripeOnboardingComplete: true, paymentsEnabled: true });
    const pending = await decide(world({ band: flags }), env);
    assert.deepEqual([pending.eligible, pending.state], [false, 'security_review']);
    const approved = await decide(world({ band: flags, kv: { 'payments:approved-bands': { bandIds: [30] } } }), env);
    assert.deepEqual([approved.eligible, approved.state], [true, 'live'], 'the operator adds the id: live');
    const removed = await decide(world({ band: flags }), env);
    assert.equal(removed.eligible, false, 'removing the id switches it off again');
  });

  await test('suspension is still folded into the stored flag (Ops-0 protection)', async () => {
    const flags = await access.connectFlagsForBand(world({ kv: { 'payments:suspended-bands': { bandIds: [30] } } }), 30, { details_submitted: true, charges_enabled: true });
    assert.equal(flags.paymentsEnabled, false);
  });

  await test('paid, Stripe-ready, not held: live', async () => {
    const r = await decide(world());
    assert.deepEqual([r.eligible, r.state], [true, 'live']);
  });

  await test('Lifetime Pro: no charge, same Stripe and security checks', async () => {
    assert.deepEqual((await decide(world({ owner: { id: 7, plan: 'free' } }))).state, 'live');
    assert.deepEqual((await decide(world({ owner: { id: 7, subscriptionStatus: 'free' }, band: { stripeAccountId: null } }))).state, 'payout_setup');
  });

  await test('band 30 exception keeps a canceled owner live until it expires', async () => {
    const kv = { 'payments:billing-exceptions': { exceptions: [{ bandId: 30, reason: 'grandfathered', expiresAt: '2026-12-15T00:00:00Z' }] } };
    const owner = { id: 7, subscriptionStatus: 'canceled' };
    const during = await decide(world({ owner, kv }));
    assert.deepEqual([during.eligible, during.billing.standing, during.billing.exceptionExpiresAt], [true, 'exception', '2026-12-15T00:00:00.000Z']);
    const after = await decide(world({ owner, kv }), ENFORCE, Date.parse('2026-12-16T00:00:00Z'));
    assert.deepEqual([after.eligible, after.state], [false, 'trial_ended']);
  });

  await test('past due inside grace stays live; a suspension still wins over grace', async () => {
    const owner = { id: 7, subscriptionStatus: 'pastDue', firstPaidAt: '2026-01-01', gracePeriodStart: new Date(NOW - DAY).toISOString() };
    assert.equal((await decide(world({ owner }))).state, 'live');
    assert.equal((await decide(world({ owner, kv: { 'payments:suspended-bands': { bandIds: [30] } } }))).state, 'unavailable');
  });

  await test('a failed lookup fails closed', async () => {
    const r = await decide(world({ throwOnBand: true }));
    assert.deepEqual([r.eligible, r.state], [false, 'unavailable']);
  });

  console.log('\nShadow mode (default)');
  await test('shadow mode never refuses on billing but reports what enforce would do', async () => {
    const r = await decide(world({ owner: TRIAL }), {});
    assert.deepEqual([r.eligible, r.state, r.shadowState, r.mode], [true, 'live', 'upgrade', 'shadow']);
  });

  await test('shadow mode still enforces security, Stripe and the approval gate', async () => {
    assert.equal((await decide(world({ owner: { ...TRIAL, blocked: true } }), {})).state, 'unavailable');
    assert.equal((await decide(world({ owner: TRIAL, band: { paymentsEnabled: false } }), {})).state, 'stripe_review');
    assert.equal((await decide(world({ owner: TRIAL }), { FANEQO_PAYMENTS_REQUIRE_APPROVAL: 'true' })).state, 'security_review');
  });

  await test('bands 30 and 110 stay live in shadow mode with today\'s Ops-0 settings', async () => {
    const env = { FANEQO_PAYMENTS_REQUIRE_APPROVAL: 'true' };
    const kv = { 'payments:approved-bands': { bandIds: [30, 110] } };
    // band 30: canceled owner (no exception written yet); band 110: Lifetime Pro
    assert.equal((await decide(world({ owner: { id: 366, subscriptionStatus: 'canceled' }, kv }), env)).state, 'live');
    assert.equal((await decide(world({ owner: { id: 368, plan: 'free' }, kv }), env)).state, 'live');
  });

  console.log('\nDirect API: POST /bands/:id/payments/checkout');
  const checkout = require(path.join(__dirname, '..', 'src/api/band/controllers/checkout.js'));
  const ctx = () => {
    const c = { params: { id: '30' }, request: { body: { buttonKey: 'support_band', amount: 10, attemptId: `t${Math.random().toString(36).slice(2, 12)}` }, headers: {} }, status: 200, body: null, set() {} };
    c.badRequest = (m) => { c.status = 400; c.body = m; };
    c.forbidden = (m) => { c.status = 403; c.body = m; };
    c.notFound = (m) => { c.status = 404; c.body = m; };
    c.tooManyRequests = (m) => { c.status = 429; c.body = m; };
    return c;
  };
  const withButtons = (w) => {
    const orig = w.entityService.findOne;
    w.entityService.findOne = async (...a) => ({ ...(await orig(...a)), name: 'Band', slug: 'band', paymentButtons: [{ key: 'support_band', enabled: true, title: 'Support the Band', pricingMode: 'min', minAmount: 5 }] });
    return w;
  };
  const attempt = async (w, env) => {
    const saved = process.env.FANEQO_PAYMENTS_REQUIRE_PAID;
    if (env.FANEQO_PAYMENTS_REQUIRE_PAID) process.env.FANEQO_PAYMENTS_REQUIRE_PAID = env.FANEQO_PAYMENTS_REQUIRE_PAID;
    else delete process.env.FANEQO_PAYMENTS_REQUIRE_PAID;
    global.strapi = withButtons(w);
    sessions.length = 0;
    const c = ctx();
    try { await checkout.create(c); } finally {
      if (saved === undefined) delete process.env.FANEQO_PAYMENTS_REQUIRE_PAID; else process.env.FANEQO_PAYMENTS_REQUIRE_PAID = saved;
    }
    return c;
  };

  for (const [label, w] of [
    ['trialing owner (enforce)', () => world({ owner: TRIAL })],
    ['blocked owner', () => world({ owner: { ...PAID, blocked: true } })],
    ['suspended band with stored flags on', () => world({ kv: { 'payments:suspended-bands': { bandIds: [30] } } })],
    ['review hold', () => world({ kv: { 'payments:review-bands': { bandIds: [30] } } })],
    ['past due beyond grace', () => world({ owner: { id: 7, subscriptionStatus: 'pastDue', firstPaidAt: '2026-01-01', gracePeriodStart: '2026-01-01' } })],
  ]) {
    await test(`refused before any Stripe session: ${label}`, async () => {
      const c = await attempt(w(), ENFORCE);
      assert.equal(c.status, 403, JSON.stringify(c.body));
      assert.equal(sessions.length, 0);
    });
  }

  await test('manual approval through checkout: refused before approval, accepted after, no Stripe account update', async () => {
    const gate = process.env.FANEQO_PAYMENTS_REQUIRE_APPROVAL;
    process.env.FANEQO_PAYMENTS_REQUIRE_APPROVAL = 'true';
    try {
      // An existing Stripe-connected band: stored flags as the webhook now stores them (Stripe + suspension).
      const flags = await access.connectFlagsForBand(world(), 30, { details_submitted: true, charges_enabled: true });
      stripeCalls.length = 0;
      const before = await attempt(world({ band: flags }), ENFORCE);
      assert.equal(before.status, 403, 'not approved yet');
      const after = await attempt(world({ band: flags, kv: { 'payments:approved-bands': { bandIds: [30] } } }), ENFORCE);
      assert.equal(after.status, 200, JSON.stringify(after.body));
      assert.equal(sessions.length, 1);
      assert.deepEqual(stripeCalls, [], 'no Stripe account read or update was needed');
    } finally {
      if (gate === undefined) delete process.env.FANEQO_PAYMENTS_REQUIRE_APPROVAL; else process.env.FANEQO_PAYMENTS_REQUIRE_APPROVAL = gate;
    }
  });

  await test('a paid, ready band opens a session that expires in 30 minutes', async () => {
    const before = Math.floor(Date.now() / 1000);
    const c = await attempt(world(), ENFORCE);
    assert.equal(c.status, 200, JSON.stringify(c.body));
    assert.equal(sessions.length, 1);
    const ttl = sessions[0].params.expires_at - before;
    assert.ok(ttl >= 1795 && ttl <= 1805, `ttl ${ttl}`);
  });

  console.log('\nConnect onboarding: new Stripe accounts need Pro when enforced');
  const paymentsCtl = require(path.join(__dirname, '..', 'src/api/band/controllers/payments.js'));
  const onboard = async (w, env) => {
    const saved = process.env.FANEQO_PAYMENTS_REQUIRE_PAID;
    if (env.FANEQO_PAYMENTS_REQUIRE_PAID) process.env.FANEQO_PAYMENTS_REQUIRE_PAID = env.FANEQO_PAYMENTS_REQUIRE_PAID;
    else delete process.env.FANEQO_PAYMENTS_REQUIRE_PAID;
    global.strapi = w;
    stripeCalls.length = 0;
    const c = { params: { id: '30' }, request: { body: { from: 'editband' } }, status: 200, body: null, set() {} };
    c.notFound = (m) => { c.status = 404; c.body = m; };
    try { await paymentsCtl.onboard(c); } finally {
      if (saved === undefined) delete process.env.FANEQO_PAYMENTS_REQUIRE_PAID; else process.env.FANEQO_PAYMENTS_REQUIRE_PAID = saved;
    }
    return c;
  };
  const noAccount = { stripeAccountId: null, paymentsEnabled: false, stripeOnboardingComplete: false };

  await test('enforced: an unpaid trial artist cannot create a Stripe account (no Stripe call)', async () => {
    const c = await onboard(world({ owner: TRIAL, band: noAccount }), ENFORCE);
    assert.equal(c.status, 403);
    assert.equal(c.body.error.details.code, 'billing_required');
    assert.deepEqual(stripeCalls, []);
  });

  await test('enforced: lapsed, past due beyond grace and unverified artists are refused too', async () => {
    for (const owner of [{ id: 7, subscriptionStatus: 'canceled' }, { id: 7, subscriptionStatus: 'pastDue', firstPaidAt: '2026-01-01', gracePeriodStart: '2026-01-01' }, { id: 7, subscriptionStatus: 'active' }]) {
      const c = await onboard(world({ owner, band: noAccount }), ENFORCE);
      assert.equal(c.status, 403, JSON.stringify(owner));
      assert.ok(!stripeCalls.includes('accounts.create'));
    }
  });

  await test('enforced: paid, Lifetime Pro and the band 30 exception can create one', async () => {
    const kv = { 'payments:billing-exceptions': { exceptions: [{ bandId: 30, expiresAt: '2099-01-01T00:00:00Z' }] } };
    for (const make of [() => world({ band: noAccount }), () => world({ owner: { id: 7, plan: 'free' }, band: noAccount }), () => world({ owner: { id: 7, subscriptionStatus: 'canceled' }, band: noAccount, kv })]) {
      const c = await onboard(make(), ENFORCE);
      assert.equal(c.body?.url, 'https://connect.stripe.test/setup', JSON.stringify(c.body));
      assert.ok(stripeCalls.includes('accounts.create'));
    }
  });

  await test('enforced: a band that already has an account keeps finishing setup (no new account)', async () => {
    const c = await onboard(world({ owner: TRIAL, band: { stripeAccountId: 'acct_existing', paymentsEnabled: false, stripeOnboardingComplete: false } }), ENFORCE);
    assert.equal(c.body?.url, 'https://connect.stripe.test/setup');
    assert.ok(!stripeCalls.includes('accounts.create'));
  });

  await test('shadow mode (default): onboarding works exactly as today for trial artists', async () => {
    const c = await onboard(world({ owner: TRIAL, band: noAccount }), {});
    assert.equal(c.body?.url, 'https://connect.stripe.test/setup');
    assert.ok(stripeCalls.includes('accounts.create'));
  });

  console.log('\nArtist Payments panel endpoint');
  await test('the panel view states the outcome without naming any fraud rule', async () => {
    const payments = require(path.join(__dirname, '..', 'src/api/band/controllers/payments.js'));
    const view = async (w) => {
      global.strapi = w;
      const c = { params: { id: '30' }, set() {}, body: null };
      await payments.eligibility(c);
      return c.body;
    };
    const blocked = await view(world({ owner: { ...PAID, blocked: true } }));
    const suspended = await view(world({ kv: { 'payments:suspended-bands': { bandIds: [30] } } }));
    assert.deepEqual(blocked, suspended, 'blocked and suspended look the same to the artist');
    assert.equal(blocked.state, 'unavailable');
    assert.ok(!JSON.stringify(blocked).match(/blocked|suspend|fraud/i));
    const trial = await view(world({ owner: TRIAL }));
    assert.equal(trial.billing.standing, 'trial');
    assert.deepEqual(trial.billing.price, { amountCents: 1200, currency: 'usd', interval: 'month' });
    assert.equal(trial.enforced, false);
  });

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed) process.exit(1);
})();
