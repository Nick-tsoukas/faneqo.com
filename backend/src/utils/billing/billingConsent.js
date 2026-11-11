'use strict';

/**
 * Billing consent and disclosure (Billing A+B). Pure: no network, no Strapi.
 *
 * Every Faneqo action that can authorize a recurring charge is described here
 * from SERVER data only (the artist's live Stripe subscription and the
 * configured default price), never from anything the client sends:
 *
 *   start_pro actions (decideStartPro in startPro.js):
 *     end_trial         trialing → Checkout (setup) → trial ends, charged now
 *     new_subscription  none / trial over / canceled → Checkout (subscription)
 *     pay_invoice       past_due / unpaid / incomplete → hosted invoice or portal
 *   billing portal, only where the portal can create charges:
 *     portal_add_card   trialing with no card: a saved card renews at trial end
 *     portal_pay_due    past_due / unpaid / incomplete: may charge what's due
 *
 * Prices: an existing subscription is always described at ITS OWN Stripe price
 * (legacy $7 stays $7); a new subscription at the configured default price.
 * Unknown price → wording with no amount. The amount due on an open invoice is
 * never stated (it isn't read here).
 *
 * Consent is bound to the exact terms by `termsKey` (a hash of the version,
 * action and price terms). The client must echo the key it was shown; the
 * server recomputes it, so a price change between display and click is caught.
 */

const crypto = require('crypto');

const CONSENT_VERSION = 'faneqo-pro-billing-v1-2026-11-11';
const CANCEL_HOW = 'Cancel anytime from Account → Manage Billing Info.';
const PORTAL_PAY_STATUSES = new Set(['past_due', 'unpaid', 'incomplete']);
const CHECKOUT_TEXT_MAX = 1200; // Stripe custom_text.*.message limit

/** "$12" for a price in minor units, or null. Whole amounts drop the cents. */
function formatAmount(cents, currency) {
  const n = Number(cents);
  if (!Number.isFinite(n) || n <= 0 || !currency) return null;
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: String(currency).toUpperCase(),
      minimumFractionDigits: n % 100 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(n / 100);
  } catch {
    return null;
  }
}

/**
 * Normalised price terms from a Stripe Price object (unit_amount, recurring)
 * or an already-safe price ({ unitAmount, interval, intervalCount }).
 * Null when anything needed is missing: callers then word without an amount.
 */
function priceTerms(price) {
  if (!price || typeof price !== 'object') return null;
  const cents = price.unit_amount ?? price.unitAmount;
  const currency = price.currency;
  const interval = price.recurring?.interval ?? price.interval;
  const intervalCount = Number(price.recurring?.interval_count ?? price.intervalCount ?? 1) || 1;
  const amount = formatAmount(cents, currency);
  if (!amount || !interval) return null;
  const label = intervalCount === 1 ? `${amount}/${interval}` : `${amount} every ${intervalCount} ${interval}s`;
  return { amountCents: Number(cents), currency: String(currency).toLowerCase(), interval, intervalCount, amount, label };
}

/** The price on a Stripe subscription (first item), as price terms or null. */
function subscriptionPriceTerms(subscription) {
  return priceTerms(subscription?.items?.data?.[0]?.price || subscription?.plan || null);
}

function termsKeyFor({ action, price, previousLabel = null }) {
  const material = JSON.stringify({
    v: CONSENT_VERSION,
    action,
    amountCents: price?.amountCents ?? null,
    currency: price?.currency ?? null,
    interval: price?.interval ?? null,
    intervalCount: price?.intervalCount ?? null,
    previousLabel,
  });
  return crypto.createHash('sha256').update(material).digest('hex').slice(0, 24);
}

function finish({ action, price, summary, previousLabel = null, immediateCharge }) {
  const checkoutMessage = `${summary} ${CANCEL_HOW}`.slice(0, CHECKOUT_TEXT_MAX);
  return {
    action,
    consentRequired: true,
    version: CONSENT_VERSION,
    termsKey: termsKeyFor({ action, price, previousLabel }),
    immediateCharge,
    price: price ? { amountCents: price.amountCents, currency: price.currency, interval: price.interval, intervalCount: price.intervalCount, label: price.label } : null,
    previousLabel,
    summary: `${summary} ${CANCEL_HOW}`,
    checkoutMessage,
  };
}

/**
 * Terms for POST /stripe/start-pro.
 * @param {{ decision: { action: string }, subscription?: object|null, defaultPrice?: object|null }} input
 * @returns {object|null} null for refusals (Lifetime Pro, already active)
 */
function describeStartPro({ decision, subscription = null, defaultPrice = null } = {}) {
  const action = decision?.action;
  if (action === 'end_trial') {
    const price = subscriptionPriceTerms(subscription);
    const summary = price
      ? `Starting Pro ends the rest of your free trial and charges ${price.amount} today, then ${price.label} until you cancel.`
      : 'Starting Pro ends the rest of your free trial and charges your Pro membership today at your plan’s price, then it renews until you cancel.';
    return finish({ action, price, summary, immediateCharge: true });
  }
  if (action === 'pay_invoice') {
    const price = subscriptionPriceTerms(subscription);
    const renew = price ? `Pro renews at ${price.label}` : 'Pro renews at your plan’s price';
    return finish({ action, price, summary: `Paying settles the amount that’s due now. After that, ${renew} until you cancel.`, immediateCharge: true });
  }
  if (action === 'new_subscription') {
    const price = priceTerms(defaultPrice);
    const previous = subscription ? subscriptionPriceTerms(subscription) : null;
    const previousLabel = previous && price && previous.label !== price.label ? previous.label : null;
    const restart = Boolean(subscription);
    let summary;
    if (price) {
      const was = previousLabel ? `Pro is now ${price.label}; your previous membership was ${previousLabel}. ` : '';
      const at = restart ? ' at the current price' : '';
      summary = `${was}${restart ? 'Restarting' : 'Starting'} Pro begins a new membership${at}: ${price.amount} today, then ${price.label} until you cancel.`;
    } else {
      summary = `${restart ? 'Restarting' : 'Starting'} Pro begins a new membership at the current price, charged today and then renewing until you cancel.`;
    }
    return finish({ action, price, summary, previousLabel, immediateCharge: true });
  }
  return null;
}

/**
 * Terms for the billing portal, only where opening it can authorize a charge.
 * @returns {object} { consentRequired: false } when no consent is needed
 */
function describePortal({ subscription = null, hasPaymentMethod = false } = {}) {
  const status = subscription?.status;
  const price = subscriptionPriceTerms(subscription);
  if (status === 'trialing' && !hasPaymentMethod) {
    const renew = price
      ? `Pro is ${price.label} from the day your trial ends and renews until you cancel.`
      : 'Pro then renews at your plan’s price until you cancel.';
    return finish({ action: 'portal_add_card', price, summary: `Adding a card keeps Faneqo Pro after your free trial. You won’t be charged today. ${renew}`, immediateCharge: false });
  }
  if (PORTAL_PAY_STATUSES.has(status)) {
    const renew = price ? `Pro renews at ${price.label}` : 'Pro renews at your plan’s price';
    return finish({ action: 'portal_pay_due', price, summary: `Paying or updating your card may charge the amount that’s due right away. After that, ${renew} until you cancel.`, immediateCharge: true });
  }
  return { action: 'portal_manage', consentRequired: false, version: CONSENT_VERSION };
}

/**
 * Checks what the client sent against the server's terms.
 * @returns {{ ok: true } | { ok: false, code: 'consent_required' | 'terms_changed' }}
 */
function checkConsent(consent, terms) {
  if (!terms?.consentRequired) return { ok: true };
  if (!consent || typeof consent !== 'object' || consent.accepted !== true) return { ok: false, code: 'consent_required' };
  if (consent.version !== terms.version || consent.termsKey !== terms.termsKey) return { ok: false, code: 'terms_changed' };
  return { ok: true };
}

/** What the client may see: never the internal action names' Stripe ids. */
function publicTerms(terms) {
  if (!terms) return null;
  const { action, consentRequired, version, termsKey, immediateCharge, price, previousLabel, summary } = terms;
  return { action, consentRequired, version, termsKey, immediateCharge: Boolean(immediateCharge), price: price || null, previousLabel: previousLabel || null, summary: summary || null };
}

module.exports = {
  CONSENT_VERSION,
  CANCEL_HOW,
  CHECKOUT_TEXT_MAX,
  formatAmount,
  priceTerms,
  subscriptionPriceTerms,
  termsKeyFor,
  describeStartPro,
  describePortal,
  checkConsent,
  publicTerms,
};
