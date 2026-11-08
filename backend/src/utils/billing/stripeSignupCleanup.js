'use strict';

/**
 * Compensating cleanup for Stripe objects created in THIS request only.
 * Never cancel a pre-existing / grandfathered subscription.
 * Never delete a pre-existing customer found by email.
 */
function planStripeSignupCleanup({
  createdCustomer = false,
  createdSubscription = false,
  customerId = null,
  subscriptionId = null,
} = {}) {
  return {
    cancelSubscriptionId: createdSubscription && subscriptionId ? subscriptionId : null,
    deleteCustomerId: createdCustomer && customerId ? customerId : null,
  };
}

function shouldCancelSubscription(plan) {
  return Boolean(plan?.cancelSubscriptionId);
}

function shouldDeleteCustomer(plan) {
  return Boolean(plan?.deleteCustomerId);
}

async function runStripeSignupCleanup({ stripe, plan, log = console } = {}) {
  const result = { canceledSubscriptionId: null, deletedCustomerId: null, errors: [] };
  if (!plan) return result;

  if (plan.cancelSubscriptionId) {
    try {
      await stripe.subscriptions.cancel(plan.cancelSubscriptionId);
      result.canceledSubscriptionId = plan.cancelSubscriptionId;
    } catch (err) {
      result.errors.push('subscription');
      log.error('[stripe-signup-cleanup] Failed to cancel newly created subscription', {
        subscriptionId: plan.cancelSubscriptionId,
        message: err?.message,
      });
    }
  }

  if (plan.deleteCustomerId) {
    try {
      await stripe.customers.del(plan.deleteCustomerId);
      result.deletedCustomerId = plan.deleteCustomerId;
    } catch (err) {
      result.errors.push('customer');
      log.error('[stripe-signup-cleanup] Failed to delete newly created customer', {
        customerId: plan.deleteCustomerId,
        message: err?.message,
      });
    }
  }

  return result;
}

module.exports = {
  planStripeSignupCleanup,
  shouldCancelSubscription,
  shouldDeleteCustomer,
  runStripeSignupCleanup,
};
