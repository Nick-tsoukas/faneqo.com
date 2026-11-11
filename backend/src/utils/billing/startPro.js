'use strict';

/**
 * Start Pro: the one way an artist pays for Faneqo Pro.
 *
 * Decides, from the artist's live Stripe subscription, which Stripe-hosted page
 * to open, and keeps the user row in step with Stripe afterwards:
 *
 *   trialing             → Checkout (setup mode) collects a card; then the SAME
 *                          subscription's trial is ended with
 *                          payment_behavior 'pending_if_incomplete', so a
 *                          declined or unapproved payment leaves the trial as it
 *                          was. One subscription, never two.
 *   past_due / unpaid /  → the open invoice's Stripe-hosted page
 *   incomplete / a
 *   pending trial end
 *   none / canceled /    → Checkout (subscription mode), default price, no trial
 *   incomplete_expired
 *   active               → refused (already_active)
 *   Lifetime Pro         → refused (billing_exempt), before any Stripe call
 *
 * The success redirect never changes anything by itself: the confirm call and
 * the signed webhook both read Stripe before writing.
 */

const { normalizeSubscriptionStatusForUserRow } = require('./subscriptionStatus');
const { isBillingExemptLifetimePro } = require('./artistEntitlement');

const END_TRIAL_INTENT = 'end_trial';
const START_INTENT = 'start_pro';

/** Live-first preference when a customer has several subscriptions. */
const PRIORITY = ['active', 'past_due', 'unpaid', 'trialing', 'incomplete'];

function idOf(v) {
  return typeof v === 'string' ? v : v?.id || null;
}

/** The subscription that decides the artist's billing state. Pure. */
function pickSubscription(subscriptions) {
  const list = Array.isArray(subscriptions) ? subscriptions.filter(Boolean) : [];
  for (const status of PRIORITY) {
    const hit = list.find((s) => s.status === status);
    if (hit) return hit;
  }
  // Nothing live: the most recent one (canceled / incomplete_expired), if any.
  return list.slice().sort((a, b) => (b.created || 0) - (a.created || 0))[0] || null;
}

/** What Start Pro does for this user and subscription. Pure. */
function decideStartPro({ user, subscription }) {
  if (isBillingExemptLifetimePro(user)) return { action: 'refuse', code: 'billing_exempt' };
  if (!subscription) return { action: 'new_subscription' };
  switch (subscription.status) {
    case 'active':
      return { action: 'refuse', code: 'already_active' };
    case 'trialing':
      // A trial end is already waiting on the bank: finish that payment instead.
      return subscription.pending_update ? { action: 'pay_invoice' } : { action: 'end_trial' };
    case 'past_due':
    case 'unpaid':
    case 'incomplete':
      return { action: 'pay_invoice' };
    default:
      return { action: 'new_subscription' };
  }
}

/** Return URLs: always the band's editor (a new band exists before checkout). Pure. */
function returnUrls({ appUrl, bandId }) {
  const origin = String(appUrl || '').replace(/\/+$/, '');
  const id = Number(bandId);
  const base = Number.isInteger(id) && id > 0 ? `${origin}/editband/${id}` : `${origin}/account`;
  return {
    success_url: `${base}?billing=return&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base}?billing=canceled`,
  };
}

/** Paid, non-zero invoice belonging to this subscription. Pure. */
function isVerifiedPaidInvoice(invoice, subscriptionId) {
  if (!invoice || !subscriptionId) return false;
  const paid = invoice.status === 'paid' || invoice.paid === true;
  return paid && Number(invoice.amount_paid) > 0 && idOf(invoice.subscription) === subscriptionId;
}

function paidAtOf(invoice) {
  const t = invoice?.status_transitions?.paid_at || invoice?.created;
  return t ? new Date(t * 1000) : new Date();
}

// trialEndsAt, cancelAt and gracePeriodStart are date-only columns; firstPaidAt is a datetime.
const DATE_ONLY = new Set(['trialEndsAt', 'cancelAt', 'gracePeriodStart']);
const DATE_KEYS = new Set([...DATE_ONLY, 'firstPaidAt']);
const stamp = (key, v) => {
  if (!v) return '';
  const iso = new Date(v).toISOString();
  return DATE_ONLY.has(key) ? iso.slice(0, 10) : iso;
};

/**
 * The user-row fields Stripe's live state implies, as a diff against `user`
 * (empty object = nothing to write). Lifetime Pro is never rewritten. Pure.
 *
 * firstPaidAt is set once, from a verified paid invoice of the subscription
 * that decides the state, and never cleared.
 */
function computeUserBillingUpdate({ user, subscription, invoice = null, now = new Date() }) {
  if (!user || isBillingExemptLifetimePro(user)) return {};
  const next = {};
  const status = normalizeSubscriptionStatusForUserRow(subscription ? subscription.status : 'canceled');
  next.subscriptionStatus = status;
  if (subscription) {
    next.subscriptionId = subscription.id;
    next.trialEndsAt = subscription.status === 'trialing' && subscription.trial_end ? new Date(subscription.trial_end * 1000) : null;
    next.cancelAt = subscription.cancel_at_period_end && subscription.cancel_at ? new Date(subscription.cancel_at * 1000) : null;
  }
  next.gracePeriodStart = status === 'pastDue' ? user.gracePeriodStart || now : null;

  const latest = subscription && typeof subscription.latest_invoice === 'object' ? subscription.latest_invoice : null;
  const proof = [invoice, latest].find((inv) => isVerifiedPaidInvoice(inv, subscription?.id));
  if (!user.firstPaidAt && proof) next.firstPaidAt = paidAtOf(proof);

  const diff = {};
  for (const [key, value] of Object.entries(next)) {
    const cur = user[key];
    const changed = DATE_KEYS.has(key) ? stamp(key, cur) !== stamp(key, value) : (cur ?? null) !== (value ?? null);
    if (changed) diff[key] = value;
  }
  return diff;
}

/** How a trial-end attempt stands, from the updated subscription. Pure. */
function endTrialOutcome(subscription) {
  if (!subscription) return { outcome: 'unknown' };
  if (subscription.status === 'active' && !subscription.pending_update) return { outcome: 'paid' };
  const invoice = typeof subscription.latest_invoice === 'object' ? subscription.latest_invoice : null;
  const pi = invoice && typeof invoice.payment_intent === 'object' ? invoice.payment_intent : null;
  if (subscription.pending_update) {
    if (pi?.status === 'requires_action' || pi?.status === 'requires_confirmation') {
      return { outcome: 'requires_action', invoiceUrl: invoice?.hosted_invoice_url || null };
    }
    if (pi?.status === 'requires_payment_method' || pi?.last_payment_error) {
      return { outcome: 'declined', invoiceUrl: invoice?.hosted_invoice_url || null };
    }
    return { outcome: 'pending', invoiceUrl: invoice?.hosted_invoice_url || null };
  }
  return { outcome: subscription.status === 'trialing' ? 'trialing' : subscription.status };
}

/**
 * End a trial after Checkout (setup mode) collected a card. Idempotent per
 * Checkout Session. Never touches a subscription that isn't trialing.
 */
async function applyEndTrial({ stripe, session, log = console }) {
  const customer = idOf(session.customer);
  const setupIntent = typeof session.setup_intent === 'object'
    ? session.setup_intent
    : await stripe.setupIntents.retrieve(idOf(session.setup_intent));
  const paymentMethod = idOf(setupIntent?.payment_method);
  const subscriptionId = session.metadata?.subscriptionId;
  if (!customer || !paymentMethod || !subscriptionId) return { outcome: 'unknown' };

  let sub = await stripe.subscriptions.retrieve(subscriptionId, { expand: ['latest_invoice.payment_intent'] });
  if (idOf(sub.customer) !== customer) {
    log.warn?.('[start-pro] setup session customer does not own the subscription; ignoring');
    return { outcome: 'unknown' };
  }
  if (sub.status !== 'trialing') return endTrialOutcome(sub);
  if (sub.pending_update) return endTrialOutcome(sub);

  // The card becomes the default first (a plain update, no payment)...
  await stripe.customers.update(customer, { invoice_settings: { default_payment_method: paymentMethod } }, { idempotencyKey: `end-trial-pm-${session.id}` });
  await stripe.subscriptions.update(subscriptionId, { default_payment_method: paymentMethod }, { idempotencyKey: `end-trial-subpm-${session.id}` });
  // ...then the trial ends only if the $12 is paid; otherwise the change stays pending.
  try {
    sub = await stripe.subscriptions.update(
      subscriptionId,
      { trial_end: 'now', proration_behavior: 'none', payment_behavior: 'pending_if_incomplete', expand: ['latest_invoice.payment_intent'] },
      { idempotencyKey: `end-trial-${session.id}` }
    );
  } catch (err) {
    log.warn?.('[start-pro] trial end payment did not go through', { code: err?.code || err?.type || 'error' });
    sub = await stripe.subscriptions.retrieve(subscriptionId, { expand: ['latest_invoice.payment_intent'] });
    const result = endTrialOutcome(sub);
    return result.outcome === 'trialing' ? { outcome: 'declined' } : result;
  }
  return endTrialOutcome(sub);
}

/**
 * Reuse an open Checkout Session of this kind for the customer, if Stripe has one.
 * With `termsKey` (Billing A+B) only a session opened for the same consented
 * terms is reused, so a session from before a price change, or from before
 * consent existed, is never handed out.
 */
async function findOpenSession({ stripe, customer, mode, intent, termsKey = null }) {
  try {
    const list = await stripe.checkout.sessions.list({ customer, status: 'open', limit: 10 });
    return (list.data || []).find((s) =>
      s.mode === mode && s.metadata?.faneqo_intent === intent && s.url && (!termsKey || s.metadata?.terms_key === termsKey)
    ) || null;
  } catch {
    return null;
  }
}

module.exports = {
  END_TRIAL_INTENT,
  START_INTENT,
  pickSubscription,
  decideStartPro,
  returnUrls,
  isVerifiedPaidInvoice,
  computeUserBillingUpdate,
  endTrialOutcome,
  applyEndTrial,
  findOpenSession,
};
