'use strict';

/**
 * Artist billing entitlement.
 *
 * CURRENT V1 FOUNDER GRANT:
 *   user.plan === 'free'
 *   means billing-exempt LIFETIME FULL PRO (ambassador / white-glove).
 *   No Stripe customer, subscription, card, or portal is required.
 *
 * This is NOT:
 *   - a fan account (also Stripe-free, usually unpaid)
 *   - an unpaid / failed artist signup
 *   - a canceled Stripe subscription
 *   - a future LIMITED free artist tier
 *
 * Do not infer this grant from missing customerId / subscriptionId.
 * Do not reuse plan=free later for a limited free artist product.
 *
 * Backward compatibility: subscriptionStatus === 'free' also grants,
 * because some historical rows used the status enum instead of plan.
 */

function isBillingExemptLifetimePro(user) {
  if (!user) return false;
  if (String(user.plan || '').trim() === 'free') return true;
  if (String(user.subscriptionStatus || '').trim() === 'free') return true;
  return false;
}

function shouldSkipStripeProvision(user) {
  return isBillingExemptLifetimePro(user);
}

function ambassadorSubscriptionStatusPayload() {
  return {
    status: 'active',
    plan: 'free',
    billingExempt: true,
    entitlement: 'lifetime_pro',
    trialEndsAt: null,
    gracePeriodStart: null,
  };
}

function ambassadorBillingInfoPayload() {
  return {
    billingExempt: true,
    entitlement: 'lifetime_pro',
    hasPaymentMethod: false,
    trialEndsAt: null,
    subscription: null,
  };
}

module.exports = {
  isBillingExemptLifetimePro,
  shouldSkipStripeProvision,
  ambassadorSubscriptionStatusPayload,
  ambassadorBillingInfoPayload,
};
