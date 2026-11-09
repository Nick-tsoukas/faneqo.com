// path: src/policies/subscription-active.js
//
// KNOWN GAP, LEFT IN PLACE ON PURPOSE (2026-11-09):
// `response.forbidden()` sets a 403 body but returns undefined, and Strapi v4
// treats an undefined policy result as a pass, so this policy does not block.
// Band and QR create/update/delete still run for lapsed accounts.
// Do NOT make it throw until Payments Activation's Start Pro recovery path
// (qrserver #30 billing/start-pro, musicbizqr #52) is deployed: today a lapsed
// trial has no way to pay, so enforcing would lock artists out of their own
// pages with no route back. See only-one-band.js for the throwing pattern.
const { isBillingExemptLifetimePro } = require('../utils/billing/artistEntitlement');

function deny(response, message) {
  return response.forbidden(message);
}

function evaluateSubscriptionAccess(user, response) {
  if (isBillingExemptLifetimePro(user)) {
    return true;
  }

  const { subscriptionStatus, gracePeriodStart, cancelAt } = user || {};
  const now = Date.now();

  if (subscriptionStatus === 'active' || subscriptionStatus === 'trialing') {
    return true;
  }

  if (subscriptionStatus === 'pastDue') {
    if (!gracePeriodStart) {
      return deny(response, 'Payment is past due. Please pay to continue.');
    }
    const graceStart = new Date(gracePeriodStart).getTime();
    const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;
    if (now - graceStart <= THREE_DAYS) {
      return true;
    }
    return deny(response, 'Your 3-day grace period has ended. Please pay to resume access.');
  }

  if (subscriptionStatus === 'canceling') {
    if (!cancelAt) {
      return deny(response, 'Your subscription is canceling. Please renew to continue.');
    }
    const cancelTime = new Date(cancelAt).getTime();
    if (now <= cancelTime) {
      return true;
    }
    return deny(response, 'Your subscription has ended. Please renew to regain access.');
  }

  return deny(response, 'Your subscription is not active. Please subscribe to use this feature.');
}

module.exports = async (policyContext, config, { strapi }) => {
  const { state, response } = policyContext;
  const user = state.user;

  if (!user) {
    return response.unauthorized('You must be logged in.');
  }

  if (isBillingExemptLifetimePro(user)) {
    return true;
  }

  const alreadyAllowed =
    user.subscriptionStatus === 'active' ||
    user.subscriptionStatus === 'trialing' ||
    (user.subscriptionStatus === 'pastDue' && user.gracePeriodStart) ||
    (user.subscriptionStatus === 'canceling' && user.cancelAt);

  if (!alreadyAllowed && user.id && strapi?.entityService?.findOne) {
    try {
      const dbUser = await strapi.entityService.findOne(
        'plugin::users-permissions.user',
        user.id,
        { fields: ['id', 'plan', 'subscriptionStatus'] }
      );
      if (isBillingExemptLifetimePro(dbUser)) {
        return true;
      }
    } catch (err) {
      // Fail closed to the in-memory evaluation below.
    }
  }

  return evaluateSubscriptionAccess(user, response);
};
