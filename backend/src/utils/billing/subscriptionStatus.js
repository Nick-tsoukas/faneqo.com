'use strict';

/**
 * Persist Stripe subscription status using existing user-schema values.
 * Unknown / incomplete states fail closed to `unpaid` (not `trialing`).
 */
function normalizeSubscriptionStatusForUserRow(status) {
  const s = String(status || '').trim();
  if (s === 'past_due') return 'pastDue';
  if (s === 'active') return 'active';
  if (s === 'trialing') return 'trialing';
  if (s === 'canceled') return 'canceled';
  if (s === 'unpaid') return 'unpaid';
  if (s === 'canceling') return 'unpaid';
  if (s === 'incomplete' || s === 'incomplete_expired' || s === 'paused') return 'unpaid';
  return 'unpaid';
}

function isBlockedSubscriptionStatus(status) {
  const s = String(status || '').trim();
  return !s || s === 'unpaid' || s === 'canceled' || s === 'past_due';
}

module.exports = {
  normalizeSubscriptionStatusForUserRow,
  isBlockedSubscriptionStatus,
};
