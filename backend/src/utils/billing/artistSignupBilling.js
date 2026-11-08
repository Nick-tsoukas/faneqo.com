'use strict';

const { normalizeSubscriptionStatusForUserRow } = require('./subscriptionStatus');

function buildArtistBillingFields({ customerId, subscription, subscriptionId } = {}) {
  const sub = subscription || {};
  return {
    customerId: customerId || null,
    subscriptionId: subscriptionId || sub.id || null,
    subscriptionStatus: normalizeSubscriptionStatusForUserRow(sub.status),
    trialEndsAt: sub.trial_end ? new Date(sub.trial_end * 1000) : null,
  };
}

function hasRequiredBillingMetadata(user) {
  if (!user) return false;
  if (!user.customerId) return false;
  if (!user.subscriptionId) return false;
  if (!user.subscriptionStatus) return false;
  if (user.subscriptionStatus === 'trialing' && !user.trialEndsAt) return false;
  return true;
}

function hasProvenStripeRelationship(user) {
  return Boolean(user?.customerId);
}

function isIncompleteArtistBilling(user) {
  if (!user) return true;
  if (hasProvenStripeRelationship(user) && user.subscriptionId) return false;
  return true;
}

function canReturnRegisterSuccess(user) {
  return hasRequiredBillingMetadata(user);
}

module.exports = {
  buildArtistBillingFields,
  hasRequiredBillingMetadata,
  hasProvenStripeRelationship,
  isIncompleteArtistBilling,
  canReturnRegisterSuccess,
};
