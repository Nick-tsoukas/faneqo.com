/**
 * Start Pro against Stripe TEST MODE: the trial-to-paid scenarios end to end,
 * using the real applyEndTrial / computeUserBillingUpdate code.
 *
 *   STRIPE_TEST_SECRET_KEY=sk_test_... node scripts/stripe-testmode-start-pro.js
 *
 * Refuses any key that is not a test-mode secret key. Creates only test-mode
 * customers, a test product/price and test clocks, and deletes the customers
 * and clocks it made when it finishes. Never touches live data.
 *
 * Scenarios:
 *   1 paid                 card charges: trial ends, $12 paid, one subscription
 *   2 declined             card declines: still trialing, trial end unchanged
 *   3 bank approval        3-D Secure required: still trialing until approved;
 *                          paying the invoice (the hosted page) ends the trial
 *   4 never approved       3-D Secure never completed: after Stripe's expiry the
 *                          subscription is still trialing (test clock)
 *   5 double click         two concurrent trial ends: one invoice, one subscription
 *   6 declined → retry     the open invoice paid with another card ends the trial
 *   7 restart              lapsed artist: subscription Checkout with no trial
 */
'use strict';

const assert = require('assert');
const StripePkg = require('stripe');
const Stripe = StripePkg.default || StripePkg;
const sp = require('../src/utils/billing/startPro');

const key = process.env.STRIPE_TEST_SECRET_KEY || '';
if (!/^sk_test_/.test(key)) {
  console.error('Refusing to run: STRIPE_TEST_SECRET_KEY must be a Stripe test-mode secret key (sk_test_...).');
  process.exit(2);
}
const stripe = new Stripe(key);
const log = { warn() {}, info() {} };
const DAY = 86400;
const made = { customers: [], clocks: [] };
const mask = (id) => `…${String(id).slice(-6)}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let passed = 0;
let failed = 0;
async function scenario(name, fn) {
  try {
    const note = await fn();
    passed += 1;
    console.log(`  PASS  ${name}${note ? `  (${note})` : ''}`);
  } catch (err) {
    failed += 1;
    console.log(`  FAIL  ${name}\n        ${err.message}`);
  }
}

async function proPrice() {
  const found = await stripe.prices.list({ lookup_keys: ['faneqo_pro_testmode_12'], limit: 1 });
  if (found.data[0]) return found.data[0].id;
  const product = await stripe.products.create({ name: 'Faneqo Pro (test mode)' });
  const price = await stripe.prices.create({ product: product.id, unit_amount: 1200, currency: 'usd', recurring: { interval: 'month' }, lookup_key: 'faneqo_pro_testmode_12' });
  return price.id;
}

/** A trialing artist (30-day no-card trial, as signup creates) with a card attached. */
async function trialingArtist(priceId, card, { clock = null } = {}) {
  const customer = await stripe.customers.create({ email: `start-pro-${Date.now()}@example.test`, ...(clock ? { test_clock: clock } : {}) });
  made.customers.push(customer.id);
  const subscription = await stripe.subscriptions.create({ customer: customer.id, items: [{ price: priceId }], trial_period_days: 30 });
  assert.equal(subscription.status, 'trialing');
  const pm = await stripe.paymentMethods.attach(card, { customer: customer.id });
  // What Checkout (setup mode) hands back: a completed session with a saved card.
  const session = {
    id: `cs_test_sim_${customer.id.slice(-8)}_${Math.random().toString(36).slice(2, 8)}`,
    customer: customer.id,
    setup_intent: { payment_method: pm.id },
    metadata: { faneqo_intent: sp.END_TRIAL_INTENT, subscriptionId: subscription.id },
  };
  return { customer, subscription, session, trialEnd: subscription.trial_end };
}

async function liveSubs(customerId) {
  const list = await stripe.subscriptions.list({ customer: customerId, status: 'all', limit: 10 });
  return list.data.filter((s) => ['active', 'trialing', 'past_due', 'unpaid'].includes(s.status));
}

async function paidInvoices(customerId) {
  const list = await stripe.invoices.list({ customer: customerId, status: 'paid', limit: 10 });
  return list.data.filter((i) => i.amount_paid > 0);
}

async function waitForClock(id) {
  for (let i = 0; i < 60; i += 1) {
    const c = await stripe.testHelpers.testClocks.retrieve(id);
    if (c.status === 'ready') return c;
    await sleep(2000);
  }
  throw new Error('test clock did not finish advancing');
}

(async () => {
  console.log('\nStart Pro · Stripe test mode');
  const priceId = await proPrice();

  await scenario('1 paid: trial ends, $12 paid, one subscription, firstPaidAt recorded', async () => {
    const a = await trialingArtist(priceId, 'pm_card_visa');
    const r = await sp.applyEndTrial({ stripe, session: a.session, log });
    assert.equal(r.outcome, 'paid', JSON.stringify(r));
    const sub = await stripe.subscriptions.retrieve(a.subscription.id, { expand: ['latest_invoice'] });
    assert.equal(sub.status, 'active');
    assert.equal(sub.latest_invoice.amount_paid, 1200);
    assert.equal((await liveSubs(a.customer.id)).length, 1);
    const row = sp.computeUserBillingUpdate({ user: { subscriptionStatus: 'trialing', subscriptionId: sub.id }, subscription: sub });
    assert.equal(row.subscriptionStatus, 'active');
    assert.ok(row.firstPaidAt instanceof Date, 'first payment recorded from the real invoice');
    return `invoice ${mask(sub.latest_invoice.id)} $12.00`;
  });

  let declined = null;
  await scenario('2 declined: still trialing, trial end unchanged, nothing paid', async () => {
    const a = await trialingArtist(priceId, 'pm_card_chargeCustomerFail');
    const r = await sp.applyEndTrial({ stripe, session: a.session, log });
    assert.equal(r.outcome, 'declined', JSON.stringify(r));
    const sub = await stripe.subscriptions.retrieve(a.subscription.id);
    assert.equal(sub.status, 'trialing');
    assert.equal(sub.trial_end, a.trialEnd, 'trial end unchanged');
    assert.equal((await paidInvoices(a.customer.id)).length, 0);
    const row = sp.computeUserBillingUpdate({ user: { subscriptionStatus: 'trialing', subscriptionId: sub.id, trialEndsAt: new Date(a.trialEnd * 1000) }, subscription: sub });
    assert.ok(!('firstPaidAt' in row) && row.subscriptionStatus !== 'pastDue', JSON.stringify(row));
    declined = a;
    return `pending_update ${sub.pending_update ? 'present' : 'none'}`;
  });

  await scenario('3 bank approval: requires action, trial intact; paying the invoice ends the trial', async () => {
    const a = await trialingArtist(priceId, 'pm_card_authenticationRequired');
    const r = await sp.applyEndTrial({ stripe, session: a.session, log });
    assert.equal(r.outcome, 'requires_action', JSON.stringify(r));
    assert.ok(/^https:\/\//.test(r.invoiceUrl || ''), 'hosted invoice page to approve on');
    let sub = await stripe.subscriptions.retrieve(a.subscription.id, { expand: ['latest_invoice'] });
    assert.equal(sub.status, 'trialing');
    assert.equal(sub.trial_end, a.trialEnd);
    // The artist completes payment on the hosted invoice page (here: pays with an approved card).
    const ok = await stripe.paymentMethods.attach('pm_card_visa', { customer: a.customer.id });
    await stripe.invoices.pay(sub.latest_invoice.id, { payment_method: ok.id });
    sub = await stripe.subscriptions.retrieve(a.subscription.id);
    assert.equal(sub.status, 'active');
    assert.equal(sub.pending_update, null);
    assert.equal((await liveSubs(a.customer.id)).length, 1);
    return 'approved → active, one subscription';
  });

  await scenario('4 never approved: after Stripe’s expiry the artist is still trialing', async () => {
    const clock = await stripe.testHelpers.testClocks.create({ frozen_time: Math.floor(Date.now() / 1000) });
    made.clocks.push(clock.id);
    const a = await trialingArtist(priceId, 'pm_card_authenticationRequired', { clock: clock.id });
    const r = await sp.applyEndTrial({ stripe, session: a.session, log });
    assert.equal(r.outcome, 'requires_action', JSON.stringify(r));
    await stripe.testHelpers.testClocks.advance(clock.id, { frozen_time: clock.frozen_time + DAY + 3600 });
    await waitForClock(clock.id);
    const sub = await stripe.subscriptions.retrieve(a.subscription.id, { expand: ['latest_invoice'] });
    assert.equal(sub.status, 'trialing', `status ${sub.status}`);
    assert.equal(sub.pending_update, null, 'pending update expired');
    assert.equal(sub.trial_end, a.trialEnd, 'trial end unchanged');
    assert.equal((await paidInvoices(a.customer.id)).length, 0);
    return `unapproved invoice ${sub.latest_invoice?.status || 'none'}`;
  });

  await scenario('5 double click: two concurrent trial ends → one paid invoice, one subscription', async () => {
    const a = await trialingArtist(priceId, 'pm_card_visa');
    const [r1, r2] = await Promise.all([
      sp.applyEndTrial({ stripe, session: a.session, log }),
      sp.applyEndTrial({ stripe, session: a.session, log }),
    ]);
    assert.ok([r1.outcome, r2.outcome].includes('paid'), JSON.stringify([r1, r2]));
    const again = await sp.applyEndTrial({ stripe, session: a.session, log });
    assert.equal(again.outcome, 'paid', 'a replay changes nothing');
    assert.equal((await paidInvoices(a.customer.id)).length, 1, 'charged once');
    assert.equal((await liveSubs(a.customer.id)).length, 1);
    return `${r1.outcome}/${r2.outcome}`;
  });

  await scenario('6 declined → retry: Start Pro routes to the open invoice; paying it ends the trial', async () => {
    assert.ok(declined, 'needs scenario 2');
    let sub = await stripe.subscriptions.retrieve(declined.subscription.id, { expand: ['latest_invoice'] });
    const decision = sp.decideStartPro({ user: { subscriptionStatus: 'trialing' }, subscription: sub });
    if (sub.pending_update) assert.deepEqual(decision, { action: 'pay_invoice' });
    else assert.deepEqual(decision, { action: 'end_trial' });
    const ok = await stripe.paymentMethods.attach('pm_card_visa', { customer: declined.customer.id });
    if (sub.pending_update) {
      await stripe.invoices.pay(sub.latest_invoice.id, { payment_method: ok.id });
    } else {
      const retry = { ...declined.session, id: `${declined.session.id}_retry`, setup_intent: { payment_method: ok.id } };
      assert.equal((await sp.applyEndTrial({ stripe, session: retry, log })).outcome, 'paid');
    }
    sub = await stripe.subscriptions.retrieve(declined.subscription.id);
    assert.equal(sub.status, 'active');
    assert.equal((await liveSubs(declined.customer.id)).length, 1);
    assert.equal((await paidInvoices(declined.customer.id)).length, 1);
    return decision.action;
  });

  await scenario('7 restart: a lapsed artist gets subscription Checkout with no new trial', async () => {
    const customer = await stripe.customers.create({ email: `restart-${Date.now()}@example.test` });
    made.customers.push(customer.id);
    const old = await stripe.subscriptions.create({ customer: customer.id, items: [{ price: priceId }], trial_period_days: 30 });
    await stripe.subscriptions.cancel(old.id);
    const listed = await stripe.subscriptions.list({ customer: customer.id, status: 'all', limit: 10 });
    const decision = sp.decideStartPro({ user: { subscriptionStatus: 'canceled' }, subscription: sp.pickSubscription(listed.data) });
    assert.deepEqual(decision, { action: 'new_subscription' });
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customer.id,
      line_items: [{ price: priceId, quantity: 1 }],
      ...sp.returnUrls({ appUrl: 'https://faneqo.com', bandId: 42 }),
      metadata: { faneqo_intent: sp.START_INTENT, userId: 'test' },
      subscription_data: { metadata: { userId: 'test' } },
    });
    assert.ok(/^https:\/\/checkout\.stripe\.com\//.test(session.url));
    assert.equal(session.mode, 'subscription');
    // What completing that Checkout produces: an active, paid subscription.
    const pm = await stripe.paymentMethods.attach('pm_card_visa', { customer: customer.id });
    const sub = await stripe.subscriptions.create({ customer: customer.id, items: [{ price: priceId }], default_payment_method: pm.id, expand: ['latest_invoice'] });
    assert.equal(sub.status, 'active');
    assert.equal(sub.trial_end, null, 'no new trial');
    const row = sp.computeUserBillingUpdate({ user: { subscriptionStatus: 'canceled', subscriptionId: old.id }, subscription: sub });
    assert.equal(row.subscriptionId, sub.id);
    assert.ok(row.firstPaidAt instanceof Date);
    return 'checkout opened; paid restart recorded';
  });

  // Clean up test-mode objects this run created.
  for (const id of made.customers) { try { await stripe.customers.del(id); } catch {} }
  for (const id of made.clocks) { try { await stripe.testHelpers.testClocks.del(id); } catch {} }

  console.log(`\n${passed} passed, ${failed} failed (test mode; ${made.customers.length} test customers and ${made.clocks.length} test clocks removed)`);
  if (failed) process.exit(1);
})().catch((e) => { console.error('ERR', e.type || '', e.code || '', e.message); process.exit(1); });
