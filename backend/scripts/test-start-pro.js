/**
 * Start Pro: paying for Faneqo Pro (skip the trial, restart after a lapse,
 * recover a past-due invoice), and keeping the user row in step with Stripe.
 *
 * Drives the real controller and webhook with a fake Stripe client that
 * records every call, plus signed test events. No network.
 *
 * Run: node scripts/test-start-pro.js
 */
'use strict';

const assert = require('assert');

process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_dummy';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_unit_test_secret';
process.env.PUBLIC_APP_URL = 'https://faneqo.com/';
process.env.STRIPE_DEFAULT_PRICE_ID = 'price_pro_12';

const StripeLib = require('stripe');
const stripeLib = new (StripeLib.default || StripeLib)('sk_test_dummy');
const UNPARSED = Symbol.for('unparsedBody');
const UP = 'plugin::users-permissions.user';

const sp = require('../src/utils/billing/startPro');
const { setStripeForTests } = require('../src/utils/billing/stripeClient');
const controller = require('../src/api/subscription/controllers/subscription.js');
const { CONSENT_UID } = require('../src/utils/billing/consentRecord');

/** Billing A: send the consent the server itself describes, as the frontend does. */
async function startProConsented(c) {
  const t = ctx({ userId: c.state.user?.id });
  await controller.startProTerms(t);
  if (t.status === 200 && t.body?.termsKey) {
    c.request.body = { ...c.request.body, consent: { accepted: true, version: t.body.version, termsKey: t.body.termsKey } };
  }
  await controller.startPro(c);
  return t.body;
}

let passed = 0;
let failed = 0;
async function test(name, fn) {
  try {
    await fn();
    passed += 1;
    console.log(`  PASS  ${name}`);
  } catch (err) {
    failed += 1;
    console.log(`  FAIL  ${name}\n        ${err.stack.split('\n').slice(0, 2).join(' | ')}`);
  }
}

// ── fakes ────────────────────────────────────────────────────────────────────
function makeStripe(o = {}) {
  const calls = [];
  const rec = (name, fn) => async (...args) => {
    calls.push({ name, args });
    return fn ? fn(...args) : undefined;
  };
  const subs = () => (typeof o.subs === 'function' ? o.subs() : o.subs || []);
  return {
    calls,
    names: () => calls.map((c) => c.name),
    webhooks: stripeLib.webhooks,
    customers: {
      list: rec('customers.list', async () => ({ data: o.existingCustomer ? [{ id: o.existingCustomer }] : [] })),
      create: rec('customers.create', async () => ({ id: 'cus_new' })),
      update: rec('customers.update', async () => ({})),
    },
    subscriptions: {
      list: rec('subscriptions.list', async () => ({ data: subs() })),
      retrieve: rec('subscriptions.retrieve', async (id) => (o.retrieve ? o.retrieve(id) : subs().find((s) => s.id === id))),
      update: rec('subscriptions.update', async (id, params) => (o.onUpdate ? o.onUpdate(id, params) : { id, status: 'trialing' })),
    },
    setupIntents: { retrieve: rec('setupIntents.retrieve', async () => ({ id: 'seti_1', payment_method: 'pm_card' })) },
    checkout: {
      sessions: {
        list: rec('sessions.list', async () => ({ data: o.openSessions || [] })),
        create: rec('sessions.create', async (p) => ({ id: 'cs_new_1234567', url: 'https://checkout.stripe.test/cs_new', ...p })),
        retrieve: rec('sessions.retrieve', async () => o.session),
      },
    },
    billingPortal: { sessions: { create: rec('portal.create', async () => ({ id: 'bps_test_1', url: 'https://billing.stripe.test/portal' })) } },
    // Billing B: the configured default price, read server-side for new subscriptions.
    prices: { retrieve: rec('prices.retrieve', async (id) => ({ id, unit_amount: 1200, currency: 'usd', recurring: { interval: 'month', interval_count: 1 } })) },
  };
}

/** A client that fails the test on ANY Stripe use. */
const noStripe = new Proxy({}, { get: (_t, k) => (k === 'webhooks' ? stripeLib.webhooks : new Proxy({}, { get: () => () => { throw new Error(`Stripe called: ${String(k)}`); } })) });

function makeStrapi({ user = null, band = null } = {}) {
  const writes = [];
  const errors = [];
  global.strapi = {
    log: { debug() {}, info() {}, warn() {}, error: (...a) => errors.push(a) },
    entityService: {
      findOne: async (uid) => (uid === UP ? user : uid === 'api::band.band' ? band : null),
      findMany: async (uid, { filters }) => (uid === UP && user && filters.customerId && user.customerId === filters.customerId ? [user] : []),
      update: async (uid, id, { data }) => {
        writes.push({ uid, id, data });
        if (uid === UP && user) Object.assign(user, data);
        return user;
      },
      // Billing A: consent records.
      create: async (uid, { data }) => {
        writes.push({ uid, data });
        consents.push({ id: consents.length + 1, ...data });
        return { id: consents.length };
      },
    },
  };
  const consents = [];
  const findMany = global.strapi.entityService.findMany;
  global.strapi.entityService.findMany = async (uid, q) =>
    uid === CONSENT_UID ? consents.filter((r) => r.dedupeKey === q.filters.dedupeKey) : findMany(uid, q);
  return { writes, errors, consents };
}

function ctx({ userId = 7, body = {}, query = {} } = {}) {
  const c = { state: { user: userId ? { id: userId } : null }, request: { body }, query, status: 200, body: null };
  c.send = (b) => { c.body = b; };
  c.unauthorized = (m) => { c.status = 401; c.body = m; };
  c.forbidden = (m) => { c.status = 403; c.body = m; };
  c.badRequest = (m) => { c.status = 400; c.body = m; };
  c.internalServerError = (m) => { c.status = 500; c.body = m; };
  c.set = () => {};
  return c;
}

function signedCtx(event) {
  const payload = JSON.stringify(event);
  const header = stripeLib.webhooks.generateTestHeaderString({ payload, secret: process.env.STRIPE_WEBHOOK_SECRET });
  const c = ctx();
  c.request = { headers: { 'stripe-signature': header }, body: { [UNPARSED]: payload } };
  return c;
}
const evt = (type, object) => ({ id: `evt_${type}`, object: 'event', type, data: { object } });

const trialUser = (extra = {}) => ({ id: 7, email: 'a@example.test', username: 'a', customerId: 'cus_1', subscriptionId: 'sub_trial', subscriptionStatus: 'trialing', plan: null, firstPaidAt: null, gracePeriodStart: null, trialEndsAt: '2026-12-01', cancelAt: null, ...extra });
const ownBand = { id: 42, users_permissions_user: { id: 7 } };
const trialingSub = (extra = {}) => ({ id: 'sub_trial', customer: 'cus_1', status: 'trialing', trial_end: 1796083200, latest_invoice: null, ...extra });

(async () => {
  console.log('\nDecision table (pure)');
  await test('every billing state maps to one action; Lifetime Pro is refused first', () => {
    const d = (user, s) => sp.decideStartPro({ user, subscription: s });
    assert.deepEqual(d({ plan: 'free' }, { status: 'trialing' }), { action: 'refuse', code: 'billing_exempt' });
    assert.deepEqual(d({ subscriptionStatus: 'free' }, null), { action: 'refuse', code: 'billing_exempt' });
    assert.deepEqual(d({}, null), { action: 'new_subscription' });
    assert.deepEqual(d({}, { status: 'active' }), { action: 'refuse', code: 'already_active' });
    assert.deepEqual(d({}, { status: 'trialing' }), { action: 'end_trial' });
    assert.deepEqual(d({}, { status: 'trialing', pending_update: { trial_end: 1 } }), { action: 'pay_invoice' });
    for (const s of ['past_due', 'unpaid', 'incomplete']) assert.deepEqual(d({}, { status: s }), { action: 'pay_invoice' }, s);
    for (const s of ['canceled', 'incomplete_expired']) assert.deepEqual(d({}, { status: s }), { action: 'new_subscription' }, s);
  });

  await test('the live subscription wins; otherwise the most recent one', () => {
    const pick = sp.pickSubscription;
    assert.equal(pick([{ id: 'a', status: 'canceled', created: 9 }, { id: 'b', status: 'trialing' }, { id: 'c', status: 'active' }]).id, 'c');
    assert.equal(pick([{ id: 'a', status: 'trialing' }, { id: 'b', status: 'past_due' }]).id, 'b');
    assert.equal(pick([{ id: 'old', status: 'canceled', created: 1 }, { id: 'new', status: 'canceled', created: 5 }]).id, 'new');
    assert.equal(pick([]), null);
  });

  await test('return URLs go to the band editor (or Account), with the session placeholder', () => {
    const u = sp.returnUrls({ appUrl: 'https://faneqo.com/', bandId: 42 });
    assert.equal(u.success_url, 'https://faneqo.com/editband/42?billing=return&session_id={CHECKOUT_SESSION_ID}');
    assert.equal(u.cancel_url, 'https://faneqo.com/editband/42?billing=canceled');
    assert.equal(sp.returnUrls({ appUrl: 'https://faneqo.com', bandId: 'x' }).cancel_url, 'https://faneqo.com/account?billing=canceled');
  });

  console.log('\nUser row follows Stripe (pure)');
  await test('firstPaidAt only from a paid, non-zero invoice of the deciding subscription; set once', () => {
    const sub = { id: 'sub_1', status: 'active' };
    const paid = { status: 'paid', amount_paid: 1200, subscription: 'sub_1', status_transitions: { paid_at: 1796083200 } };
    const c = (user, invoice) => sp.computeUserBillingUpdate({ user: { subscriptionStatus: 'trialing', ...user }, subscription: sub, invoice });
    assert.equal(c({}, paid).firstPaidAt.toISOString(), new Date(1796083200 * 1000).toISOString());
    assert.equal(c({}, { ...paid, amount_paid: 0 }).firstPaidAt, undefined, 'zero invoice');
    assert.equal(c({}, { ...paid, subscription: 'sub_other' }).firstPaidAt, undefined, 'another subscription');
    assert.equal(c({}, { ...paid, status: 'open', paid: false }).firstPaidAt, undefined, 'not paid');
    assert.equal(c({ firstPaidAt: '2026-01-01T00:00:00.000Z' }, paid).firstPaidAt, undefined, 'never overwritten');
  });

  await test('a failed trial-end invoice leaves a trialing artist trialing (no past due, no grace)', () => {
    const out = sp.computeUserBillingUpdate({ user: { subscriptionStatus: 'trialing', subscriptionId: 'sub_1', trialEndsAt: '2026-12-01' }, subscription: { id: 'sub_1', status: 'trialing', trial_end: Date.parse('2026-12-01T00:00:00Z') / 1000 }, invoice: { status: 'open', amount_paid: 0, subscription: 'sub_1' } });
    assert.deepEqual(out, {}, JSON.stringify(out));
  });

  await test('past due starts grace once; active clears it; nothing changes twice', () => {
    const now = new Date('2026-11-09T10:00:00Z');
    const pd = sp.computeUserBillingUpdate({ user: { subscriptionStatus: 'active', subscriptionId: 's' }, subscription: { id: 's', status: 'past_due' }, now });
    assert.equal(pd.subscriptionStatus, 'pastDue');
    assert.equal(pd.gracePeriodStart, now);
    const again = sp.computeUserBillingUpdate({ user: { subscriptionStatus: 'pastDue', subscriptionId: 's', gracePeriodStart: '2026-11-08' }, subscription: { id: 's', status: 'past_due' }, now });
    assert.deepEqual(again, {}, 'grace start is kept');
    const back = sp.computeUserBillingUpdate({ user: { subscriptionStatus: 'pastDue', subscriptionId: 's', gracePeriodStart: '2026-11-08' }, subscription: { id: 's', status: 'active' } });
    assert.equal(back.subscriptionStatus, 'active');
    assert.equal(back.gracePeriodStart, null);
  });

  await test('Lifetime Pro is never rewritten', () => {
    assert.deepEqual(sp.computeUserBillingUpdate({ user: { plan: 'free', subscriptionStatus: 'canceled' }, subscription: { id: 's', status: 'active' } }), {});
    assert.deepEqual(sp.computeUserBillingUpdate({ user: { subscriptionStatus: 'free' }, subscription: null }), {});
  });

  await test('trial-end outcomes: paid, needs bank approval, declined, untouched', () => {
    const o = sp.endTrialOutcome;
    assert.equal(o({ status: 'active' }).outcome, 'paid');
    const pending = (status) => ({ status: 'trialing', pending_update: { trial_end: 1 }, latest_invoice: { hosted_invoice_url: 'https://inv', payment_intent: { status } } });
    assert.deepEqual(o(pending('requires_action')), { outcome: 'requires_action', invoiceUrl: 'https://inv' });
    assert.equal(o(pending('requires_payment_method')).outcome, 'declined');
    assert.equal(o({ status: 'trialing' }).outcome, 'trialing');
  });

  console.log('\nPOST /stripe/start-pro');
  await test('Lifetime Pro: 409 billing_exempt and no Stripe call at all', async () => {
    makeStrapi({ user: trialUser({ plan: 'free' }), band: ownBand });
    setStripeForTests(noStripe);
    const c = ctx({ body: { bandId: 42 } });
    await startProConsented(c);
    assert.equal(c.status, 409);
    assert.equal(c.body.error.details.code, 'billing_exempt');
  });

  await test("another artist's band: 403 before any Stripe call", async () => {
    makeStrapi({ user: trialUser(), band: { id: 42, users_permissions_user: { id: 99 } } });
    setStripeForTests(noStripe);
    const c = ctx({ body: { bandId: 42 } });
    await startProConsented(c);
    assert.equal(c.status, 403);
  });

  await test('already active: 409 already_active, no session, no subscription', async () => {
    makeStrapi({ user: trialUser({ subscriptionStatus: 'active' }), band: ownBand });
    const s = makeStripe({ subs: [{ id: 'sub_1', status: 'active', customer: 'cus_1' }] });
    setStripeForTests(s);
    const c = ctx({ body: { bandId: 42 } });
    await startProConsented(c);
    assert.equal(c.status, 409);
    assert.equal(c.body.error.details.code, 'already_active');
    assert.ok(!s.names().includes('sessions.create'));
  });

  await test('trialing: setup-mode Checkout for the SAME subscription, returning to the band editor', async () => {
    makeStrapi({ user: trialUser(), band: ownBand });
    const s = makeStripe({ subs: [trialingSub()] });
    setStripeForTests(s);
    const c = ctx({ body: { bandId: 42 } });
    await startProConsented(c);
    assert.equal(c.status, 200, JSON.stringify(c.body));
    assert.equal(c.body.kind, 'end_trial');
    const create = s.calls.find((x) => x.name === 'sessions.create');
    const [params, opts] = create.args;
    assert.equal(params.mode, 'setup');
    assert.equal(params.customer, 'cus_1');
    assert.equal(params.metadata.faneqo_intent, 'end_trial');
    assert.equal(params.metadata.subscriptionId, 'sub_trial');
    assert.equal(params.success_url, 'https://faneqo.com/editband/42?billing=return&session_id={CHECKOUT_SESSION_ID}');
    assert.equal(params.cancel_url, 'https://faneqo.com/editband/42?billing=canceled');
    assert.ok(opts.idempotencyKey, 'idempotent');
    assert.ok(!s.names().includes('subscriptions.update'), 'nothing changes until the card is saved');
  });

  await test('a second click reuses the open Checkout Session', async () => {
    makeStrapi({ user: trialUser(), band: ownBand });
    // The open session must have been opened for the same consented terms (Billing A+B).
    const terms = (await (async () => { setStripeForTests(makeStripe({ subs: [trialingSub()] })); const t = ctx(); await controller.startProTerms(t); return t.body; })());
    const s = makeStripe({ subs: [trialingSub()], openSessions: [{ id: 'cs_open', mode: 'setup', url: 'https://checkout.stripe.test/cs_open', metadata: { faneqo_intent: 'end_trial', terms_key: terms.termsKey } }] });
    setStripeForTests(s);
    const c = ctx({ body: { bandId: 42 } });
    await startProConsented(c);
    assert.equal(c.body.url, 'https://checkout.stripe.test/cs_open');
    assert.ok(!s.names().includes('sessions.create'));
  });

  await test('trial over / canceled: subscription Checkout at the default price with no trial', async () => {
    makeStrapi({ user: trialUser({ subscriptionStatus: 'canceled' }), band: ownBand });
    const s = makeStripe({ subs: [{ id: 'sub_old', status: 'canceled', customer: 'cus_1', created: 1 }] });
    setStripeForTests(s);
    const c = ctx({ body: { bandId: 42 } });
    await startProConsented(c);
    assert.equal(c.body.kind, 'subscription');
    const [params] = s.calls.find((x) => x.name === 'sessions.create').args;
    assert.equal(params.mode, 'subscription');
    assert.deepEqual(params.line_items, [{ price: 'price_pro_12', quantity: 1 }]);
    assert.ok(!('trial_period_days' in (params.subscription_data || {})), 'no new trial');
    assert.ok(!('trial_end' in (params.subscription_data || {})), 'no new trial');
  });

  await test('past due: the open invoice page, no new session or subscription', async () => {
    makeStrapi({ user: trialUser({ subscriptionStatus: 'pastDue' }), band: ownBand });
    const s = makeStripe({ subs: [{ id: 'sub_1', status: 'past_due', customer: 'cus_1', latest_invoice: { id: 'in_1', status: 'open', hosted_invoice_url: 'https://invoice.stripe.test/in_1' } }] });
    setStripeForTests(s);
    const c = ctx({ body: { bandId: 42 } });
    await startProConsented(c);
    assert.deepEqual(c.body, { url: 'https://invoice.stripe.test/in_1', kind: 'invoice' });
    assert.ok(!s.names().includes('sessions.create'));
  });

  await test('orphan trial (no Stripe customer): customer created once, then subscription Checkout', async () => {
    const { writes } = makeStrapi({ user: trialUser({ customerId: null, subscriptionId: null }), band: ownBand });
    const s = makeStripe({ subs: [] });
    setStripeForTests(s);
    const c = ctx({ body: { bandId: 42 } });
    await startProConsented(c);
    const create = s.calls.find((x) => x.name === 'customers.create');
    assert.ok(create.args[1].idempotencyKey);
    assert.equal(writes.find((w) => w.data.customerId).data.customerId, 'cus_new');
    assert.equal(c.body.kind, 'subscription');
  });

  console.log('\nEnding the trial (pending_if_incomplete)');
  const setupSession = { id: 'cs_setup_123456', mode: 'setup', status: 'complete', customer: 'cus_1', setup_intent: 'seti_1', metadata: { faneqo_intent: 'end_trial', subscriptionId: 'sub_trial' } };

  await test('paid: card made default, then the trial ends only through a pending-if-incomplete update', async () => {
    const s = makeStripe({ subs: [trialingSub()], onUpdate: (id, p) => (p.trial_end ? { id, status: 'active', latest_invoice: { status: 'paid' } } : { id, status: 'trialing' }) });
    const r = await sp.applyEndTrial({ stripe: s, session: setupSession, log: { warn() {} } });
    assert.equal(r.outcome, 'paid');
    const updates = s.calls.filter((x) => x.name === 'subscriptions.update');
    assert.equal(updates.length, 2);
    assert.deepEqual(updates[0].args[1], { default_payment_method: 'pm_card' });
    const [, params, opts] = updates[1].args;
    assert.equal(params.trial_end, 'now');
    assert.equal(params.payment_behavior, 'pending_if_incomplete');
    assert.equal(params.proration_behavior, 'none');
    assert.equal(opts.idempotencyKey, 'end-trial-cs_setup_123456');
  });

  await test('declined: the update stays pending, the artist stays trialing', async () => {
    const s = makeStripe({ subs: [trialingSub()], onUpdate: (id, p) => (p.trial_end ? trialingSub({ pending_update: { trial_end: 1 }, latest_invoice: { hosted_invoice_url: 'https://inv', payment_intent: { status: 'requires_payment_method' } } }) : trialingSub()) });
    const r = await sp.applyEndTrial({ stripe: s, session: setupSession, log: { warn() {} } });
    assert.equal(r.outcome, 'declined');
  });

  await test('bank approval needed: outcome requires_action with the invoice page to approve on', async () => {
    const s = makeStripe({ subs: [trialingSub()], onUpdate: (id, p) => (p.trial_end ? trialingSub({ pending_update: { trial_end: 1 }, latest_invoice: { hosted_invoice_url: 'https://inv/approve', payment_intent: { status: 'requires_action' } } }) : trialingSub()) });
    const r = await sp.applyEndTrial({ stripe: s, session: setupSession, log: { warn() {} } });
    assert.deepEqual(r, { outcome: 'requires_action', invoiceUrl: 'https://inv/approve' });
  });

  await test('a card error thrown by Stripe is reported as declined, trial untouched', async () => {
    const s = makeStripe({ subs: [trialingSub()], onUpdate: (id, p) => { if (p.trial_end) { const e = new Error('card_declined'); e.type = 'StripeCardError'; throw e; } return trialingSub(); } });
    const r = await sp.applyEndTrial({ stripe: s, session: setupSession, log: { warn() {} } });
    assert.equal(r.outcome, 'declined');
  });

  await test('no change when the subscription is no longer trialing, or belongs to another customer', async () => {
    let s = makeStripe({ subs: [{ id: 'sub_trial', customer: 'cus_1', status: 'active' }] });
    assert.equal((await sp.applyEndTrial({ stripe: s, session: setupSession, log: { warn() {} } })).outcome, 'paid');
    assert.ok(!s.names().includes('subscriptions.update'));
    s = makeStripe({ subs: [trialingSub({ customer: 'cus_other' })] });
    assert.equal((await sp.applyEndTrial({ stripe: s, session: setupSession, log: { warn() {} } })).outcome, 'unknown');
    assert.ok(!s.names().includes('subscriptions.update'));
  });

  console.log('\nGET /stripe/start-pro/confirm');
  await test("another customer's session: 403, nothing applied", async () => {
    makeStrapi({ user: trialUser() });
    const s = makeStripe({ session: { ...setupSession, customer: 'cus_other' } });
    setStripeForTests(s);
    const c = ctx({ query: { session_id: 'cs_setup_123456' } });
    await controller.startProConfirm(c);
    assert.equal(c.status, 403);
    assert.ok(!s.names().includes('subscriptions.update'));
  });

  await test('return from Stripe: verified with Stripe, trial ended, first payment recorded', async () => {
    const user = trialUser();
    makeStrapi({ user });
    let state = 'trialing';
    const paidInvoice = { status: 'paid', amount_paid: 1200, subscription: 'sub_trial', status_transitions: { paid_at: 1796083200 } };
    const s = makeStripe({
      session: setupSession,
      subs: () => [state === 'active' ? { id: 'sub_trial', customer: 'cus_1', status: 'active', latest_invoice: paidInvoice } : trialingSub()],
      onUpdate: (id, p) => { if (p.trial_end) { state = 'active'; return { id, status: 'active' }; } return trialingSub(); },
    });
    setStripeForTests(s);
    const c = ctx({ query: { session_id: 'cs_setup_123456' } });
    await controller.startProConfirm(c);
    assert.equal(c.body.outcome, 'paid', JSON.stringify(c.body));
    assert.equal(c.body.paid, true);
    assert.equal(user.subscriptionStatus, 'active');
    assert.ok(user.firstPaidAt instanceof Date);
  });

  console.log('\nBilling webhook (signed events, Stripe re-read)');
  await test('a declined trial-end invoice does not make a trialing artist past due', async () => {
    const user = trialUser();
    const { writes } = makeStrapi({ user });
    setStripeForTests(makeStripe({ subs: [trialingSub({ trial_end: Date.parse('2026-12-01T00:00:00Z') / 1000 })] }));
    await controller.webhook(signedCtx(evt('invoice.payment_failed', { id: 'in_1', customer: 'cus_1', subscription: 'sub_trial', status: 'open', amount_paid: 0 })));
    assert.equal(writes.length, 0, JSON.stringify(writes));
    assert.equal(user.subscriptionStatus, 'trialing');
  });

  await test('out of order: a late failure cannot demote an artist Stripe says is active', async () => {
    const user = trialUser({ subscriptionStatus: 'active', subscriptionId: 'sub_1', firstPaidAt: '2026-11-01T00:00:00.000Z', trialEndsAt: null });
    const { writes } = makeStrapi({ user });
    setStripeForTests(makeStripe({ subs: [{ id: 'sub_1', customer: 'cus_1', status: 'active', latest_invoice: null }] }));
    await controller.webhook(signedCtx(evt('invoice.payment_failed', { id: 'in_old', customer: 'cus_1', subscription: 'sub_1' })));
    assert.equal(writes.length, 0);
    assert.equal(user.subscriptionStatus, 'active');
  });

  await test('deleting an OLD subscription keeps the artist on the new active one', async () => {
    const user = trialUser({ subscriptionStatus: 'active', subscriptionId: 'sub_new', firstPaidAt: '2026-11-01T00:00:00.000Z', trialEndsAt: null });
    makeStrapi({ user });
    setStripeForTests(makeStripe({ subs: [{ id: 'sub_old', customer: 'cus_1', status: 'canceled', created: 1 }, { id: 'sub_new', customer: 'cus_1', status: 'active', created: 2, latest_invoice: null }] }));
    await controller.webhook(signedCtx(evt('customer.subscription.deleted', { id: 'sub_old', customer: 'cus_1', status: 'canceled' })));
    assert.equal(user.subscriptionStatus, 'active');
    assert.equal(user.subscriptionId, 'sub_new');
  });

  await test('a paid invoice for a different subscription does not record the first payment', async () => {
    const user = trialUser();
    makeStrapi({ user });
    setStripeForTests(makeStripe({ subs: [trialingSub()] }));
    await controller.webhook(signedCtx(evt('invoice.payment_succeeded', { id: 'in_x', customer: 'cus_1', subscription: 'sub_elsewhere', status: 'paid', amount_paid: 1200 })));
    assert.equal(user.firstPaidAt, null);
    assert.equal(user.subscriptionStatus, 'trialing');
  });

  await test('checkout.session.completed (setup) ends the trial from the webhook; a replay uses the same idempotency key', async () => {
    const keys = [];
    for (let i = 0; i < 2; i += 1) {
      makeStrapi({ user: trialUser() });
      const s = makeStripe({ subs: [trialingSub()], onUpdate: (id, p) => (p.trial_end ? trialingSub({ pending_update: { trial_end: 1 }, latest_invoice: { payment_intent: { status: 'requires_action' } } }) : trialingSub()) });
      setStripeForTests(s);
      await controller.webhook(signedCtx(evt('checkout.session.completed', setupSession)));
      const end = s.calls.find((x) => x.name === 'subscriptions.update' && x.args[1].trial_end === 'now');
      keys.push(end.args[2].idempotencyKey);
    }
    assert.equal(keys[0], keys[1]);
  });

  await test('two live subscriptions are flagged for review, never cancelled automatically', async () => {
    const { errors } = makeStrapi({ user: trialUser({ subscriptionStatus: 'active' }) });
    const s = makeStripe({ subs: [{ id: 'a', customer: 'cus_1', status: 'active' }, { id: 'b', customer: 'cus_1', status: 'trialing' }] });
    setStripeForTests(s);
    await controller.webhook(signedCtx(evt('customer.subscription.updated', { id: 'b', customer: 'cus_1' })));
    assert.ok(errors.some((e) => String(e[0]).includes('more than one live subscription')));
    assert.ok(!s.names().some((n) => /cancel|del/.test(n)));
  });

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed) process.exit(1);
})();
