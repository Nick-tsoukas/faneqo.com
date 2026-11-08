'use strict';

/**
 * Where Stripe sends an artist back after payout setup, and what to tell them
 * when they arrive. Pure, so the return URLs and stages are testable.
 */

const RETURN_TARGETS = new Set(['dashboard', 'editband']);

/**
 * Return/refresh URLs for one band's Stripe onboarding link. Only the origin of
 * STRIPE_CONNECT_RETURN_URL is used and the path is built from a fixed list, so
 * a caller can't turn this into an open redirect. Without a usable env URL the
 * configured URLs are passed through unchanged (the previous behaviour).
 */
function onboardingUrls({ bandId, from, env = process.env } = {}) {
  const fallback = {
    return_url: env.STRIPE_CONNECT_RETURN_URL,
    refresh_url: env.STRIPE_CONNECT_REFRESH_URL,
  };
  const id = Number(bandId);
  if (!Number.isInteger(id) || id <= 0) return fallback;

  let origin;
  try {
    origin = new URL(env.STRIPE_CONNECT_RETURN_URL).origin;
  } catch {
    return fallback;
  }

  const target = RETURN_TARGETS.has(from) ? from : 'dashboard';
  const at = (payouts) =>
    target === 'editband'
      ? `${origin}/editband/${id}?payouts=${payouts}`
      : `${origin}/dashboard?bandId=${id}&payouts=${payouts}`;
  return { return_url: at('return'), refresh_url: at('refresh') };
}

/**
 * The artist-facing stage of payout setup.
 * - not_started: no Stripe account yet
 * - in_progress: Stripe still needs onboarding details
 * - review: details submitted, Stripe hasn't enabled charges (verification or more info)
 * - paused: Stripe allows charges but Faneqo has payments off for this band
 * - live: checkout accepts payments
 *
 * @param {{ hasAccount: boolean, account?: object|null, paymentsEnabled: boolean, stripeOnboardingComplete: boolean }} input
 */
function payoutStage({ hasAccount, account = null, paymentsEnabled, stripeOnboardingComplete }) {
  if (!hasAccount) return 'not_started';
  if (paymentsEnabled === true && stripeOnboardingComplete === true) return 'live';
  if (account) {
    if (account.details_submitted !== true) return 'in_progress';
    if (account.charges_enabled !== true) return 'review';
    return 'paused';
  }
  // Stripe unreachable: answer from the stored flags.
  return stripeOnboardingComplete === true ? 'review' : 'in_progress';
}

/** How many items Stripe says are still due (never the item names themselves). */
function requirementsDueCount(account) {
  const due = account?.requirements?.currently_due;
  return Array.isArray(due) ? due.length : 0;
}

module.exports = { onboardingUrls, payoutStage, requirementsDueCount };
