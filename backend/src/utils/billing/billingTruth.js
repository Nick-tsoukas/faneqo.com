'use strict';

/**
 * Safe Stripe billing read-model helpers.
 * Account price MUST come from the user's actual subscription Price object.
 * Never invent unit amounts. Never return card / secret Stripe payloads.
 */

const CURRENT_DISPLAY_STATUSES = ['trialing', 'active', 'past_due', 'unpaid', 'incomplete'];
const REUSE_STATUSES = ['trialing', 'active', 'past_due'];

function pickBestByStatus(subscriptions, statuses) {
  const list = Array.isArray(subscriptions) ? subscriptions : [];
  for (const status of statuses) {
    const found = list.find((sub) => sub && sub.status === status);
    if (found) return found;
  }
  return null;
}

function pickBestCurrentSubscription(subscriptions) {
  return pickBestByStatus(subscriptions, CURRENT_DISPLAY_STATUSES);
}

function pickBestReusableSubscription(subscriptions) {
  return pickBestByStatus(subscriptions, REUSE_STATUSES);
}

/**
 * Prefer the stored subscriptionId. Only then pick a meaningful current sub.
 * Does not fall back to an arbitrary canceled row.
 */
async function resolvePreferredSubscription({
  dbUser,
  retrieveSubscription,
  listSubscriptions,
} = {}) {
  if (dbUser?.subscriptionId && typeof retrieveSubscription === 'function') {
    try {
      const exact = await retrieveSubscription(dbUser.subscriptionId);
      if (exact) return exact;
    } catch (err) {
      if (err?.code !== 'resource_missing') throw err;
    }
  }
  if (!dbUser?.customerId || typeof listSubscriptions !== 'function') return null;
  const listed = await listSubscriptions(dbUser.customerId);
  return pickBestCurrentSubscription(listed?.data || listed);
}

function extractSafePrice(subscription) {
  const price = subscription?.items?.data?.[0]?.price;
  if (!price || typeof price !== 'object') return null;
  const unitAmount = price.unit_amount;
  if (unitAmount != null && !Number.isFinite(Number(unitAmount))) return null;
  const recurring = price.recurring || {};
  return {
    id: price.id || null,
    unitAmount: unitAmount == null ? null : Number(unitAmount),
    currency: price.currency || null,
    interval: recurring.interval || null,
    intervalCount: Number.isFinite(Number(recurring.interval_count))
      ? Number(recurring.interval_count)
      : 1,
  };
}

function shapeBillingSubscription(subscription) {
  if (!subscription) return null;
  const priceObj = subscription.items?.data?.[0]?.price;
  const planNickname =
    priceObj?.nickname ||
    subscription.items?.data?.[0]?.plan?.nickname ||
    null;

  return {
    id: subscription.id,
    status: subscription.status,
    trial_end: subscription.trial_end || null,
    current_period_end: subscription.current_period_end || null,
    plan: { nickname: planNickname },
    price: extractSafePrice(subscription),
  };
}

/**
 * Is there a card Stripe can charge for this subscription? A card can live on
 * the customer (invoice default or a legacy default source) or on the
 * subscription itself, depending on how it was added. Checking only the
 * customer told some artists with a saved card that they had none.
 */
function hasUsablePaymentMethod({ customer, subscription } = {}) {
  if (!customer || customer.deleted === true) return false;
  return Boolean(
    customer.invoice_settings?.default_payment_method ||
      subscription?.default_payment_method ||
      customer.default_source
  );
}

module.exports = {
  CURRENT_DISPLAY_STATUSES,
  hasUsablePaymentMethod,
  REUSE_STATUSES,
  pickBestCurrentSubscription,
  pickBestReusableSubscription,
  resolvePreferredSubscription,
  extractSafePrice,
  shapeBillingSubscription,
};
