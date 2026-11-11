/**
 * Billing A+B: explicit, server-enforced consent before any recurring
 * authorization, an auditable record, and Stripe Checkout text built from the
 * server's own price. Drives the real controller and portal helper with fakes.
 * No network, no real Stripe, no money.
 *
 * Run: node scripts/test-billing-consent.js
 */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_dummy';
process.env.PUBLIC_APP_URL = 'https://faneqo.com/';
process.env.STRIPE_DEFAULT_PRICE_ID = 'price_pro_12';
process.env.BILLING_RETURN_URL = 'https://faneqo.com/account';

const bc = require('../src/utils/billing/billingConsent');
const { setStripeForTests } = require('../src/utils/billing/stripeClient');
const { CONSENT_UID } = require('../src/utils/billing/consentRecord');
const { openBillingPortal, portalTerms } = require('../src/utils/billing/portalSession');
const controller = require('../src/api/subscription/controllers/subscription.js');

const UP = 'plugin::users-permissions.user';
const root = path.join(__dirname, '..');
let passed = 0;
let failed = 0;
async function test(name, fn) {
  try {
    await fn();
    passed += 1;
    console.log(`  PASS  ${name}`);
  } catch (err) {
    failed += 1;
    console.log(`  FAIL  ${name}\n        ${err.stack.split('\n').slice(0, 3).join(' | ')}`);
  }
}

// ── fixtures ────────────────────────────────────────────────────────────────
const price = (cents) => ({ id: `price_${cents}`, unit_amount: cents, currency: 'usd', recurring: { interval: 'month', interval_count: 1 } });
const sub = (status, cents, extra = {}) => ({ id: `sub_${status}`, customer: 'cus_1', status, items: { data: [{ price: cents ? price(cents) : null }] }, latest_invoice: null, ...extra });
const user = (extra = {}) => ({ id: 7, email: 'a@example.test', username: 'a', customerId: 'cus_1', subscriptionId: null, subscriptionStatus: 'trialing', plan: null, firstPaidAt: null, ...extra });

function makeStripe(o = {}) {
  const calls = [];
  const rec = (name, fn) => async (...args) => { calls.push({ name, args }); return fn(...args); };
  const subs = o.subs || [];
  return {
    calls,
    names: () => calls.map((c) => c.name),
    customers: {
      list: rec('customers.list', async () => ({ data: [] })),
      create: rec('customers.create', async () => ({ id: 'cus_new' })),
      retrieve: rec('customers.retrieve', async () => ({ id: 'cus_1', invoice_settings: { default_payment_method: o.hasCard ? 'pm_1' : null } })),
    },
    subscriptions: {
      list: rec('subscriptions.list', async () => ({ data: subs })),
      retrieve: rec('subscriptions.retrieve', async (id) => subs.find((s) => s.id === id) || null),
      update: rec('subscriptions.update', async (id, p) => ({ ...(subs.find((x) => x.id === id) || { id }), ...p, cancel_at: 1799999999 })),
    },
    prices: { retrieve: rec('prices.retrieve', async () => (o.defaultPrice === undefined ? price(1200) : o.defaultPrice)) },
    checkout: {
      sessions: {
        list: rec('sessions.list', async () => ({ data: o.openSessions || [] })),
        create: rec('sessions.create', async (p) => {
          if (o.failCreate) throw Object.assign(new Error('stripe down'), { type: 'StripeAPIError' });
          return { id: 'cs_new_1', url: 'https://checkout.stripe.test/cs_new_1', ...p };
        }),
      },
    },
    billingPortal: { sessions: { create: rec('portal.create', async (p) => ({ id: 'bps_1', url: 'https://billing.stripe.test/p', ...p })) } },
  };
}

function makeStrapi({ u = user(), failConsentWrite = false } = {}) {
  const consents = [];
  global.strapi = {
    log: { debug() {}, info() {}, warn() {}, error() {} },
    entityService: {
      findOne: async (uid, id) => (uid === UP ? (u && u.id === id ? u : null) : uid === 'api::band.band' ? { id, users_permissions_user: { id: id === 42 ? 7 : 99 } } : null),
      findMany: async (uid, q) => (uid === CONSENT_UID ? consents.filter((r) => r.dedupeKey === q.filters.dedupeKey) : []),
      update: async () => u,
      create: async (uid, { data }) => {
        if (failConsentWrite) throw new Error('db down');
        consents.push({ id: consents.length + 1, ...data });
        return { id: consents.length };
      },
    },
  };
  return { consents };
}

function ctx({ userId = 7, body = {}, query = {} } = {}) {
  const c = { state: { user: userId ? { id: userId } : null }, request: { body }, query, status: 200, body: null };
  c.send = (b) => { c.body = b; };
  c.unauthorized = (m) => { c.status = 401; c.body = m; };
  c.forbidden = (m) => { c.status = 403; c.body = m; };
  c.badRequest = (m) => { c.status = 400; c.body = m; };
  c.internalServerError = (m) => { c.status = 500; c.body = m; };
  return c;
}
async function termsFor(userId = 7) {
  const t = ctx({ userId });
  await controller.startProTerms(t);
  return t;
}
const consentOf = (t) => ({ accepted: true, version: t.body.version, termsKey: t.body.termsKey });

(async () => {
  console.log('\nTerms (pure): the price actually charged');
  await test('$12 trial → Start Pro ends the trial and charges $12 today, renews $12/month, cancel route', () => {
    const t = bc.describeStartPro({ decision: { action: 'end_trial' }, subscription: sub('trialing', 1200) });
    assert.equal(t.price.label, '$12/month');
    assert.match(t.summary, /^Starting Pro ends the rest of your free trial and charges \$12 today, then \$12\/month until you cancel\. Cancel anytime from Account → Manage Billing Info\.$/);
    assert.equal(t.immediateCharge, true);
    assert.ok(t.checkoutMessage.length <= bc.CHECKOUT_TEXT_MAX);
  });

  await test('$7 grandfathered: trial end, past due and portal all stay at $7, never $12', () => {
    const end = bc.describeStartPro({ decision: { action: 'end_trial' }, subscription: sub('trialing', 700) });
    const due = bc.describeStartPro({ decision: { action: 'pay_invoice' }, subscription: sub('past_due', 700) });
    const portal = bc.describePortal({ subscription: sub('past_due', 700) });
    for (const t of [end, due, portal]) {
      assert.match(t.summary, /\$7/);
      assert.doesNotMatch(t.summary + t.checkoutMessage, /\$12/);
    }
    assert.match(due.summary, /^Paying settles the amount that’s due now\. After that, Pro renews at \$7\/month/);
  });

  await test('new customer and restarts use the current $12; a canceled $7 member is told the new rate', () => {
    const fresh = bc.describeStartPro({ decision: { action: 'new_subscription' }, subscription: null, defaultPrice: price(1200) });
    assert.match(fresh.summary, /^Starting Pro begins a new membership: \$12 today, then \$12\/month until you cancel\./);
    const restart7 = bc.describeStartPro({ decision: { action: 'new_subscription' }, subscription: sub('canceled', 700), defaultPrice: price(1200) });
    assert.match(restart7.summary, /^Pro is now \$12\/month; your previous membership was \$7\/month\. Restarting Pro begins a new membership at the current price: \$12 today/);
    const restart12 = bc.describeStartPro({ decision: { action: 'new_subscription' }, subscription: sub('canceled', 1200), defaultPrice: price(1200) });
    assert.doesNotMatch(restart12.summary, /previous/);
  });

  await test('missing or invalid price: no amount is ever claimed', () => {
    for (const s of [sub('trialing', null), sub('trialing', 0), { id: 'x', status: 'trialing' }]) {
      const t = bc.describeStartPro({ decision: { action: 'end_trial' }, subscription: s });
      assert.equal(t.price, null);
      assert.doesNotMatch(t.summary, /\$\d/);
    }
    const n = bc.describeStartPro({ decision: { action: 'new_subscription' }, subscription: null, defaultPrice: null });
    assert.doesNotMatch(n.summary, /\$\d/);
    assert.equal(bc.priceTerms({ unit_amount: 1200, currency: 'usd' }), null, 'no interval → unknown');
  });

  await test('portal: consent only where it can charge (trial without card, past due); not for active, carded trial, canceled', () => {
    const trialNoCard = bc.describePortal({ subscription: sub('trialing', 1200), hasPaymentMethod: false });
    assert.equal(trialNoCard.consentRequired, true);
    assert.equal(trialNoCard.immediateCharge, false);
    assert.match(trialNoCard.summary, /You won’t be charged today\. Pro is \$12\/month from the day your trial ends/);
    for (const s of ['past_due', 'unpaid', 'incomplete']) assert.equal(bc.describePortal({ subscription: sub(s, 1200) }).consentRequired, true, s);
    assert.equal(bc.describePortal({ subscription: sub('trialing', 1200), hasPaymentMethod: true }).consentRequired, false);
    for (const s of ['active', 'canceled']) assert.equal(bc.describePortal({ subscription: sub(s, 1200), hasPaymentMethod: true }).consentRequired, false, s);
    assert.equal(bc.describePortal({ subscription: null }).consentRequired, false);
  });

  await test('consent check: missing, unticked, stale version or stale terms are refused; a price change changes the key', () => {
    const t = bc.describeStartPro({ decision: { action: 'end_trial' }, subscription: sub('trialing', 1200) });
    assert.deepEqual(bc.checkConsent(undefined, t), { ok: false, code: 'consent_required' });
    assert.deepEqual(bc.checkConsent({ accepted: false, version: t.version, termsKey: t.termsKey }, t), { ok: false, code: 'consent_required' });
    assert.deepEqual(bc.checkConsent({ accepted: 'true', version: t.version, termsKey: t.termsKey }, t), { ok: false, code: 'consent_required' }, 'only boolean true');
    assert.deepEqual(bc.checkConsent({ accepted: true, version: 'v0', termsKey: t.termsKey }, t), { ok: false, code: 'terms_changed' });
    assert.deepEqual(bc.checkConsent({ accepted: true, version: t.version, termsKey: 'x' }, t), { ok: false, code: 'terms_changed' });
    assert.deepEqual(bc.checkConsent({ accepted: true, version: t.version, termsKey: t.termsKey }, t), { ok: true });
    const t13 = bc.describeStartPro({ decision: { action: 'end_trial' }, subscription: sub('trialing', 1300) });
    assert.notEqual(t13.termsKey, t.termsKey);
  });

  console.log('\nGET /stripe/start-pro/terms');
  await test('read-only: never creates a customer, subscription or session; 401 when signed out', async () => {
    makeStrapi({ u: user({ customerId: null }) });
    const s = makeStripe();
    setStripeForTests(s);
    const t = await termsFor();
    assert.equal(t.status, 200);
    assert.equal(t.body.action, 'new_subscription');
    assert.ok(!s.names().some((n) => /create/.test(n)), s.names().join(','));
    const anon = ctx({ userId: null });
    await controller.startProTerms(anon);
    assert.equal(anon.status, 401);
  });

  await test('Lifetime Pro: 409 billing_exempt and no Stripe call', async () => {
    makeStrapi({ u: user({ plan: 'free' }) });
    const s = makeStripe();
    setStripeForTests(s);
    const t = await termsFor();
    assert.equal(t.status, 409);
    assert.equal(t.body.error.details.code, 'billing_exempt');
    assert.deepEqual(s.names(), []);
  });

  console.log('\nPOST /stripe/start-pro: consent enforced on the server');
  await test('no consent → 400 consent_required with the terms; no session, no record', async () => {
    const { consents } = makeStrapi();
    const s = makeStripe({ subs: [sub('trialing', 1200)] });
    setStripeForTests(s);
    const c = ctx({ body: { bandId: 42 } });
    await controller.startPro(c);
    assert.equal(c.status, 400);
    assert.equal(c.body.error.details.code, 'consent_required');
    assert.match(c.body.error.details.terms.summary, /\$12 today/);
    assert.ok(!s.names().includes('sessions.create'));
    assert.equal(consents.length, 0);
  });

  await test('bypass attempts: unticked, forged key, client-supplied price → refused or ignored', async () => {
    makeStrapi();
    setStripeForTests(makeStripe({ subs: [sub('trialing', 1200)] }));
    const t = await termsFor();
    for (const consent of [{ ...consentOf(t), accepted: false }, { ...consentOf(t), termsKey: 'forged' }, { accepted: true }]) {
      const c = ctx({ body: { consent } });
      await controller.startPro(c);
      assert.ok([400, 409].includes(c.status), JSON.stringify(consent));
    }
    // A client price is never read: the session and record use the server's $12.
    const { consents } = makeStrapi();
    const s = makeStripe({ subs: [sub('trialing', 1200)] });
    setStripeForTests(s);
    const ok = ctx({ body: { consent: consentOf(t), price: 1, amountCents: 1, priceLabel: '$0.01/month' } });
    await controller.startPro(ok);
    assert.equal(ok.status, 200);
    assert.equal(consents[0].priceLabel, '$12/month');
    assert.equal(consents[0].amountCents, 1200);
  });

  await test('accepted ($12 trial): setup Checkout carries the server text and terms key; record is auditable and minimal', async () => {
    const { consents } = makeStrapi();
    const s = makeStripe({ subs: [sub('trialing', 1200)] });
    setStripeForTests(s);
    const t = await termsFor();
    const c = ctx({ body: { bandId: 42, consent: consentOf(t) } });
    await controller.startPro(c);
    assert.equal(c.status, 200);
    const created = s.calls.find((x) => x.name === 'sessions.create');
    assert.equal(created.args[0].mode, 'setup');
    assert.equal(created.args[0].custom_text.submit.message, `${t.body.summary}`);
    assert.equal(created.args[0].metadata.terms_key, t.body.termsKey);
    assert.match(created.args[1].idempotencyKey, new RegExp(`^start-pro-setup-v2-7-42-${t.body.termsKey}-`));
    assert.equal(consents.length, 1);
    const r = consents[0];
    assert.equal(r.user, 7);
    assert.equal(r.action, 'end_trial');
    assert.equal(r.consentVersion, bc.CONSENT_VERSION);
    assert.equal(r.termsKey, t.body.termsKey);
    assert.equal(r.disclosedText, t.body.summary);
    assert.equal(r.stripeReferenceType, 'checkout_session');
    assert.equal(r.stripeReference, 'cs_new_1');
    assert.equal(r.stripeSubscriptionId, 'sub_trialing');
    assert.equal(r.bandId, 42);
    assert.equal(r.immediateCharge, true);
    assert.ok(!Object.keys(r).some((k) => /card|paymentMethod|payment_method|^ip$|ipAddress|email|secret/i.test(k)), Object.keys(r).join(','));
  });

  await test('$7 grandfathered trial: Checkout text says $7, never $12', async () => {
    makeStrapi();
    const s = makeStripe({ subs: [sub('trialing', 700)] });
    setStripeForTests(s);
    const t = await termsFor();
    const c = ctx({ body: { consent: consentOf(t) } });
    await controller.startPro(c);
    const msg = s.calls.find((x) => x.name === 'sessions.create').args[0].custom_text.submit.message;
    assert.match(msg, /charges \$7 today, then \$7\/month/);
    assert.doesNotMatch(msg, /\$12/);
  });

  await test('canceled $7 restarting: subscription Checkout at the default price, told the new $12 rate', async () => {
    const { consents } = makeStrapi({ u: user({ subscriptionStatus: 'canceled', firstPaidAt: '2025-01-01' }) });
    const s = makeStripe({ subs: [sub('canceled', 700)] });
    setStripeForTests(s);
    const t = await termsFor();
    const c = ctx({ body: { consent: consentOf(t) } });
    await controller.startPro(c);
    const p = s.calls.find((x) => x.name === 'sessions.create').args[0];
    assert.equal(p.mode, 'subscription');
    assert.deepEqual(p.line_items, [{ price: 'price_pro_12', quantity: 1 }]);
    assert.match(p.custom_text.submit.message, /^Pro is now \$12\/month; your previous membership was \$7\/month\./);
    assert.equal(p.subscription_data.metadata.terms_key, t.body.termsKey);
    assert.equal(consents[0].previousPriceLabel, '$7/month');
  });

  await test('past due: open invoice handed out only after consent, record references the invoice', async () => {
    const { consents } = makeStrapi({ u: user({ subscriptionStatus: 'pastDue' }) });
    setStripeForTests(makeStripe({ subs: [sub('past_due', 700, { latest_invoice: { id: 'in_9', status: 'open', hosted_invoice_url: 'https://invoice.stripe.test/in_9' } })] }));
    const t = await termsFor();
    const c = ctx({ body: { consent: consentOf(t) } });
    await controller.startPro(c);
    assert.equal(c.body.url, 'https://invoice.stripe.test/in_9');
    assert.equal(consents[0].stripeReferenceType, 'invoice');
    assert.equal(consents[0].stripeReference, 'in_9');
  });

  await test('duplicate requests: an open session for the same terms is reused with no second record', async () => {
    const { consents } = makeStrapi();
    setStripeForTests(makeStripe({ subs: [sub('trialing', 1200)] }));
    const t = await termsFor();
    const open = [{ id: 'cs_open_1', mode: 'setup', url: 'https://checkout.stripe.test/cs_open_1', metadata: { faneqo_intent: 'end_trial', terms_key: t.body.termsKey } }];
    const s = makeStripe({ subs: [sub('trialing', 1200)], openSessions: open });
    setStripeForTests(s);
    for (let i = 0; i < 3; i += 1) {
      const c = ctx({ body: { consent: consentOf(t) } });
      await controller.startPro(c);
      assert.equal(c.body.url, 'https://checkout.stripe.test/cs_open_1');
    }
    assert.ok(!s.names().includes('sessions.create'));
    assert.equal(consents.length, 1, 'one record per Stripe reference');
  });

  await test('an open session from older terms (or before consent existed) is not reused', async () => {
    makeStrapi();
    setStripeForTests(makeStripe({ subs: [sub('trialing', 1200)] }));
    const t = await termsFor();
    const s = makeStripe({ subs: [sub('trialing', 1200)], openSessions: [{ id: 'cs_old', mode: 'setup', url: 'https://x/cs_old', metadata: { faneqo_intent: 'end_trial' } }] });
    setStripeForTests(s);
    const c = ctx({ body: { consent: consentOf(t) } });
    await controller.startPro(c);
    assert.notEqual(c.body.url, 'https://x/cs_old');
    assert.ok(s.names().includes('sessions.create'));
  });

  await test('Stripe failure: 500, no consent record; consent write failure: 500, no URL (fail closed)', async () => {
    let st = makeStrapi();
    setStripeForTests(makeStripe({ subs: [sub('trialing', 1200)] }));
    const t = await termsFor();
    setStripeForTests(makeStripe({ subs: [sub('trialing', 1200)], failCreate: true }));
    const c = ctx({ body: { consent: consentOf(t) } });
    await controller.startPro(c);
    assert.equal(c.status, 500);
    assert.equal(st.consents.length, 0);
    st = makeStrapi({ failConsentWrite: true });
    setStripeForTests(makeStripe({ subs: [sub('trialing', 1200)] }));
    const d = ctx({ body: { consent: consentOf(t) } });
    await controller.startPro(d);
    assert.equal(d.status, 500);
    assert.ok(!(d.body && d.body.url), 'no checkout URL without a stored consent');
  });

  await test('cross-user: another artist’s band is refused before anything; terms only describe the caller', async () => {
    makeStrapi();
    const s = makeStripe({ subs: [sub('trialing', 1200)] });
    setStripeForTests(s);
    const t = await termsFor();
    const c = ctx({ body: { bandId: 43, consent: consentOf(t) } });
    await controller.startPro(c);
    assert.equal(c.status, 403);
    assert.ok(!s.names().includes('sessions.create'));
    const src = fs.readFileSync(path.join(root, 'src/api/subscription/controllers/subscription.js'), 'utf8');
    const termsHandler = src.slice(src.indexOf('async startProTerms('), src.indexOf('async startProTerms(') + 1500);
    assert.doesNotMatch(termsHandler, /request\.body|query\.userId|params\.id/, 'terms use ctx.state.user only');
  });

  console.log('\nConsent records: idempotent per agreement, distinct per terms');
  const { recordConsent } = require('../src/utils/billing/consentRecord');
  function slowStrapi({ failCreate = false } = {}) {
    const rows = [];
    const tick = () => new Promise((r) => setTimeout(r, 5));
    return {
      rows,
      entityService: {
        findMany: async (_uid, q) => { await tick(); return rows.filter((r) => r.dedupeKey === q.filters.dedupeKey); },
        create: async (_uid, { data }) => { await tick(); if (failCreate) throw new Error('db down'); rows.push({ id: rows.length + 1, ...data }); return { id: rows.length }; },
      },
    };
  }
  const termsA = bc.describeStartPro({ decision: { action: 'pay_invoice' }, subscription: sub('past_due', 1200) });
  const termsB = bc.describeStartPro({ decision: { action: 'pay_invoice' }, subscription: sub('past_due', 1300) });
  const rec = (s, terms, reference = 'in_same') => recordConsent({ strapi: s, user: { id: 7 }, terms, referenceType: 'invoice', reference });

  await test('same reference + same agreement retried → one record', async () => {
    const s = slowStrapi();
    const a = await rec(s, termsA);
    const b = await rec(s, termsA);
    assert.equal(a.created, true);
    assert.equal(b.created, false);
    assert.equal(b.id, a.id);
    assert.equal(s.rows.length, 1);
  });

  await test('same reference + changed terms accepted again → a new, distinct record', async () => {
    const s = slowStrapi();
    await rec(s, termsA);
    const b = await rec(s, termsB);
    assert.equal(b.created, true);
    assert.equal(s.rows.length, 2);
    assert.notEqual(s.rows[0].termsKey, s.rows[1].termsKey);
    assert.notEqual(s.rows[0].dedupeKey, s.rows[1].dedupeKey);
    assert.equal(s.rows[0].stripeReference, s.rows[1].stripeReference);
  });

  await test('concurrent duplicate requests → exactly one record', async () => {
    const s = slowStrapi();
    const results = await Promise.all(Array.from({ length: 6 }, () => rec(s, termsA, 'cs_concurrent')));
    assert.equal(s.rows.length, 1);
    assert.equal(results.filter((r) => r.created).length, 1);
    assert.ok(results.every((r) => r.id === results[0].id));
  });

  await test('DB write failure throws (caller fails closed) and a later retry can still record', async () => {
    const bad = slowStrapi({ failCreate: true });
    await assert.rejects(() => rec(bad, termsA, 'cs_fail'), /db down/);
    const good = slowStrapi();
    const r = await rec(good, termsA, 'cs_fail');
    assert.equal(r.created, true, 'no stale in-flight entry blocks the retry');
  });

  await test('a different user on the same reference is never merged', async () => {
    const s = slowStrapi();
    await rec(s, termsA, 'cs_shared');
    await recordConsent({ strapi: s, user: { id: 8 }, terms: termsA, referenceType: 'checkout_session', reference: 'cs_shared' });
    assert.equal(s.rows.length, 2);
  });

  console.log('\nBilling portal');
  const portalStripe = (o) => makeStripe(o);
  await test('trial without card: 400 consent_required, no portal; with consent: portal + record', async () => {
    const { consents } = makeStrapi({ u: user({ subscriptionId: 'sub_trialing' }) });
    const s = portalStripe({ subs: [sub('trialing', 1200)], hasCard: false });
    setStripeForTests(s);
    const no = ctx();
    await openBillingPortal({ ctx: no, strapi: global.strapi, stripe: s, returnUrl: 'https://faneqo.com/account' });
    assert.equal(no.status, 400);
    assert.equal(no.body.error.details.code, 'consent_required');
    assert.ok(!s.names().includes('portal.create'));
    const tt = ctx();
    await portalTerms({ ctx: tt, strapi: global.strapi, stripe: s });
    assert.equal(tt.body.consentRequired, true);
    assert.equal(tt.body.canCancel, true);
    const yes = ctx({ body: { consent: { accepted: true, version: tt.body.version, termsKey: tt.body.termsKey } } });
    await openBillingPortal({ ctx: yes, strapi: global.strapi, stripe: s, returnUrl: 'https://faneqo.com/account' });
    assert.equal(yes.body.url, 'https://billing.stripe.test/p');
    assert.equal(consents[0].action, 'portal_add_card');
    assert.equal(consents[0].stripeReferenceType, 'billing_portal_session');
    assert.equal(consents[0].immediateCharge, false);
  });

  await test('cancel stays easy and opens NO portal: intent "cancel" cancels the own subscription at period end, no consent, no record', async () => {
    const { consents } = makeStrapi({ u: user({ subscriptionId: 'sub_past_due', subscriptionStatus: 'pastDue' }) });
    const s = portalStripe({ subs: [sub('past_due', 700)] });
    const c = ctx({ body: { intent: 'cancel' } });
    await openBillingPortal({ ctx: c, strapi: global.strapi, stripe: s, returnUrl: 'https://faneqo.com/account' });
    assert.equal(c.body.canceled, true);
    const u = s.calls.find((x) => x.name === 'subscriptions.update');
    assert.equal(u.args[0], 'sub_past_due', 'the caller’s own subscription (from their row/customer)');
    assert.deepEqual(u.args[1], { cancel_at_period_end: true });
    assert.ok(!s.names().includes('portal.create'), 'no portal: its cancel flow links back to "Add payment method" (verified in test mode)');
    assert.equal(consents.length, 0);
  });

  await test('cancel: nothing live → 409 nothing_to_cancel; already cancelling → no second update; a body subscription id is ignored', async () => {
    makeStrapi({ u: user({ subscriptionId: 'sub_canceled', subscriptionStatus: 'canceled' }) });
    let s = portalStripe({ subs: [sub('canceled', 700)] });
    let c = ctx({ body: { intent: 'cancel', subscription: 'sub_someone_else' } });
    await openBillingPortal({ ctx: c, strapi: global.strapi, stripe: s, returnUrl: 'x' });
    assert.equal(c.status, 409);
    assert.equal(c.body.error.details.code, 'nothing_to_cancel');
    assert.ok(!s.names().includes('subscriptions.update'));
    makeStrapi({ u: user({ subscriptionId: 'sub_trialing' }) });
    s = portalStripe({ subs: [sub('trialing', 1200, { cancel_at_period_end: true, cancel_at: 1799999999 })] });
    c = ctx({ body: { intent: 'cancel' } });
    await openBillingPortal({ ctx: c, strapi: global.strapi, stripe: s, returnUrl: 'x' });
    assert.equal(c.body.already, true);
    assert.ok(!s.names().includes('subscriptions.update'));
  });

  await test('no code path uses the portal cancel flow any more', () => {
    const src = fs.readFileSync(path.join(root, 'src/utils/billing/portalSession.js'), 'utf8');
    assert.doesNotMatch(src.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, ''), /flow_data|subscription_cancel/);
  });

  await test('active subscriber, carded trial and Lifetime Pro open the portal without consent (renewal and management unchanged)', async () => {
    for (const [u, subs, hasCard] of [
      [user({ subscriptionId: 'sub_active', subscriptionStatus: 'active' }), [sub('active', 700)], true],
      [user({ subscriptionId: 'sub_trialing' }), [sub('trialing', 1200)], true],
      [user({ plan: 'free', subscriptionStatus: 'free' }), [], false],
    ]) {
      const { consents } = makeStrapi({ u });
      const s = portalStripe({ subs, hasCard });
      const c = ctx();
      await openBillingPortal({ ctx: c, strapi: global.strapi, stripe: s, returnUrl: 'https://faneqo.com/account' });
      assert.equal(c.body.url, 'https://billing.stripe.test/p', u.subscriptionStatus);
      assert.equal(consents.length, 0);
    }
  });

  await test('portal: signed out → 401; no Stripe customer → 400; customer comes from the user row, never the body', async () => {
    makeStrapi({ u: user({ customerId: null }) });
    const s = portalStripe({});
    const anon = ctx({ userId: null });
    await openBillingPortal({ ctx: anon, strapi: global.strapi, stripe: s, returnUrl: 'x' });
    assert.equal(anon.status, 401);
    const none = ctx({ body: { customer: 'cus_someone_else' } });
    await openBillingPortal({ ctx: none, strapi: global.strapi, stripe: s, returnUrl: 'x' });
    assert.equal(none.status, 400);
    assert.ok(!s.names().includes('portal.create'));
  });

  console.log('\nWiring');
  await test('both portal routes use the same gate; new terms routes need sign-in; consent records have no public API', () => {
    const stripeCtl = fs.readFileSync(path.join(root, 'src/api/stripe/controllers/stripe.js'), 'utf8');
    assert.match(stripeCtl, /async createBillingPortalSession\(ctx\) \{\s*return openBillingPortal\(/);
    const subCtl = fs.readFileSync(path.join(root, 'src/api/subscription/controllers/subscription.js'), 'utf8');
    assert.match(subCtl, /return openBillingPortal\(\{ ctx, strapi, stripe, returnUrl: process\.env\.BILLING_RETURN_URL \}\)/);
    const routes = fs.readFileSync(path.join(root, 'src/api/subscription/routes/subscription.js'), 'utf8');
    for (const p of ['/stripe/start-pro/terms', '/stripe/billing-portal/terms']) {
      assert.match(routes, new RegExp(`path: '${p.replace(/\//g, '\\/')}',\\s*handler: '[^']+',\\s*config: \\{ policies: \\['plugin::users-permissions\\.isAuthenticated'\\] \\}`), p);
    }
    const dir = path.join(root, 'src/api/billing-consent');
    assert.ok(fs.existsSync(path.join(dir, 'content-types/billing-consent/schema.json')));
    assert.ok(!fs.existsSync(path.join(dir, 'routes')), 'no routes');
    assert.ok(!fs.existsSync(path.join(dir, 'controllers')), 'no controllers');
    const schema = JSON.parse(fs.readFileSync(path.join(dir, 'content-types/billing-consent/schema.json'), 'utf8'));
    assert.equal(schema.options.draftAndPublish, false);
    assert.ok(!Object.keys(schema.attributes).some((k) => /card|paymentMethod|payment_method|^ip$|ipAddress|email|secret/i.test(k)), 'no card, IP, email or secret fields');
  });

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed) process.exit(1);
})();
