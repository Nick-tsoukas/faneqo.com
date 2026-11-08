'use strict';

const { pickBestReusableSubscription } = require('./billingTruth');

async function provisionStripeCustomerAndTrial({
  stripe,
  email,
  name,
  priceId,
  trialDays = 30,
  appUserId = null,
  log = console,
} = {}) {
  if (!priceId) {
    const err = new Error('STRIPE_DEFAULT_PRICE_ID is not configured');
    err.code = 'missing_price_id';
    throw err;
  }

  let customer = null;
  let createdCustomer = false;
  let subscription = null;
  let createdSubscription = false;

  try {
    const existingCustomers = await stripe.customers.list({ email, limit: 1 });
    if (existingCustomers.data?.length > 0) {
      customer = existingCustomers.data[0];
      log.info?.('[provision-stripe] Found existing Stripe customer', { customerId: customer.id });

      const existingSubs = await stripe.subscriptions.list({
        customer: customer.id,
        status: 'all',
        limit: 20,
      });
      subscription = pickBestReusableSubscription(existingSubs.data);
      if (subscription) {
        log.info?.('[provision-stripe] Reusing existing subscription', {
          subscriptionId: subscription.id,
          status: subscription.status,
        });
      }
    } else {
      const createPayload = { email, name };
      if (appUserId != null) {
        createPayload.metadata = { appUserId: String(appUserId) };
      }
      customer = await stripe.customers.create(createPayload);
      createdCustomer = true;
      log.info?.('[provision-stripe] Stripe customer created', { customerId: customer.id });
    }
  } catch (err) {
    err.code = 'stripe_customer';
    err.createdCustomer = createdCustomer;
    err.customerId = customer?.id || null;
    throw err;
  }

  if (!subscription) {
    try {
      subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: priceId }],
        trial_period_days: Number(trialDays || 30),
      });
      createdSubscription = true;
      log.info?.('[provision-stripe] Stripe subscription created', {
        subscriptionId: subscription.id,
        status: subscription.status,
      });
    } catch (err) {
      err.code = 'stripe_subscription';
      err.createdCustomer = createdCustomer;
      err.customerId = customer?.id || null;
      throw err;
    }
  }

  return {
    customer,
    subscription,
    createdCustomer,
    createdSubscription,
    customerId: customer.id,
    subscriptionId: subscription.id,
  };
}

module.exports = {
  provisionStripeCustomerAndTrial,
};
