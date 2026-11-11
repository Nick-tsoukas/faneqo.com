'use strict';

/**
 * Payment eligibility: the single answer to "may this band take a fan payment
 * right now?", used by checkout, the public artist page and the artist's own
 * Payments panel. Never trusts the stored paymentsEnabled flag on its own.
 *
 * Order (first failing check decides the state):
 *   1. security  band exists, owner exists and is not blocked, band not on
 *                the suspension list, not on the review-hold list
 *                → 'unavailable' / 'review'
 *   2. billing   Lifetime Pro, an unexpired named exception, a verified paid
 *                subscription (firstPaidAt + active), or past due within the
 *                3-day grace → otherwise 'upgrade' (trialing) / 'trial_ended' /
 *                'canceled' / 'past_due'
 *   3. Stripe    connected account, details submitted, charges allowed
 *                → 'payout_setup' / 'stripe_review'
 *   4. approval  the Ops-0 approval gate (FANEQO_PAYMENTS_REQUIRE_APPROVAL)
 *                → 'security_review'
 *   → 'live'
 *
 * Paying $12 is necessary, never sufficient: every other check still applies.
 *
 * FANEQO_PAYMENTS_REQUIRE_PAID: 'enforce' refuses on step 2. Anything else is
 * shadow mode: step 2 is computed and logged but does not refuse, so today's
 * behaviour is unchanged until the switch is approved.
 */

const access = require('./paymentAccess');
const { isBillingExemptLifetimePro } = require('../billing/artistEntitlement');

const KV_UID = 'api::system-kv.system-kv';
const EXCEPTIONS_KEY = 'payments:billing-exceptions';
const REVIEW_KEY = 'payments:review-bands';
const GRACE_MS = 3 * 24 * 60 * 60 * 1000;
const CACHE_MS = 30 * 1000;
const cache = new Map();

function requirePaidMode(env = process.env) {
  return String(env.FANEQO_PAYMENTS_REQUIRE_PAID || '').trim().toLowerCase() === 'enforce' ? 'enforce' : 'shadow';
}

async function readKvValue(strapi, key, now = Date.now()) {
  const hit = cache.get(key);
  if (hit && now - hit.at < CACHE_MS) return hit.value;
  let value = null;
  try {
    const rows = await strapi.entityService.findMany(KV_UID, { filters: { key }, limit: 1 });
    value = rows?.[0]?.value ?? null;
  } catch (err) {
    strapi.log?.warn?.(`[payments] could not read ${key}: ${err.message}`);
    if (hit) return hit.value;
  }
  cache.set(key, { at: now, value });
  return value;
}

function clearEligibilityCache() {
  cache.clear();
}

/**
 * The band's unexpired billing exception, if any. Pure.
 * Value shape: { exceptions: [{ bandId, reason, grantedAt, reviewBy, expiresAt }] }
 */
function activeException(value, bandId, now = Date.now()) {
  const list = Array.isArray(value?.exceptions) ? value.exceptions : [];
  const hit = list.find((e) => String(e?.bandId) === String(bandId));
  if (!hit) return null;
  const expires = Date.parse(hit.expiresAt);
  if (!Number.isFinite(expires) || expires <= now) return null;
  return { reason: hit.reason || null, expiresAt: new Date(expires).toISOString(), reviewBy: hit.reviewBy || null };
}

/**
 * Billing standing of the band owner. Pure.
 * @returns {{ entitled: boolean, standing: 'lifetime'|'exception'|'paid'|'grace'|'trial'|'trial_ended'|'canceled'|'past_due'|'unverified', graceEndsAt?: string }}
 */
function billingStanding(owner, { exception = null, now = Date.now() } = {}) {
  if (isBillingExemptLifetimePro(owner)) return { entitled: true, standing: 'lifetime' };
  if (exception) return { entitled: true, standing: 'exception' };
  const status = String(owner?.subscriptionStatus || '').trim();
  const paidOnce = Boolean(owner?.firstPaidAt);
  if (status === 'active') return paidOnce ? { entitled: true, standing: 'paid' } : { entitled: false, standing: 'unverified' };
  if (status === 'pastDue' || status === 'past_due') {
    const start = Date.parse(owner?.gracePeriodStart);
    const graceEnds = Number.isFinite(start) ? start + GRACE_MS : null;
    if (paidOnce && graceEnds && now <= graceEnds) return { entitled: true, standing: 'grace', graceEndsAt: new Date(graceEnds).toISOString() };
    return { entitled: false, standing: 'past_due', ...(graceEnds ? { graceEndsAt: new Date(graceEnds).toISOString() } : {}) };
  }
  if (status === 'trialing') return { entitled: false, standing: 'trial' };
  return { entitled: false, standing: paidOnce ? 'canceled' : 'trial_ended' };
}

const BILLING_STATE = { trial: 'upgrade', trial_ended: 'trial_ended', canceled: 'canceled', past_due: 'past_due', unverified: 'canceled' };

/** Stripe stage from the stored Connect mirror. Pure. */
function connectState(band) {
  if (!band?.stripeAccountId || band.stripeOnboardingComplete !== true) return 'payout_setup';
  if (band.paymentsEnabled !== true) return 'stripe_review';
  return null;
}

async function paymentEligibility(strapi, bandId, { env = process.env, now = Date.now() } = {}) {
  let band = null;
  try {
    band = await strapi.entityService.findOne('api::band.band', bandId, {
      fields: ['id', 'stripeAccountId', 'paymentsEnabled', 'stripeOnboardingComplete'],
      populate: { users_permissions_user: { fields: ['id', 'blocked', 'subscriptionStatus', 'plan', 'firstPaidAt', 'gracePeriodStart', 'trialEndsAt'] } },
      publicationState: 'preview',
    });
  } catch (err) {
    strapi.log?.warn?.(`[payments] eligibility lookup failed for band ${bandId}: ${err.message}`);
    return { eligible: false, state: 'unavailable', reason: 'lookup_failed' };
  }
  if (!band) return { eligible: false, state: 'unavailable', reason: 'not_found' };
  const owner = band.users_permissions_user;

  // 1. security
  if (!owner?.id || owner.blocked === true) return { eligible: false, state: 'unavailable', reason: 'unavailable' };
  if (await access.isPaymentsSuspended(strapi, band.id)) return { eligible: false, state: 'unavailable', reason: 'unavailable' };
  if (access.parseBandIds(await readKvValue(strapi, REVIEW_KEY, now)).has(String(band.id))) {
    return { eligible: false, state: 'review', reason: 'review' };
  }

  // 2. billing
  const exception = activeException(await readKvValue(strapi, EXCEPTIONS_KEY, now), band.id, now);
  const billing = billingStanding(owner, { exception, now });
  const mode = requirePaidMode(env);
  const billingInfo = {
    standing: billing.standing,
    entitled: billing.entitled,
    trialEndsAt: owner.trialEndsAt || null,
    graceEndsAt: billing.graceEndsAt || null,
    exceptionExpiresAt: exception?.expiresAt || null,
  };
  if (!billing.entitled && mode === 'enforce') {
    return { eligible: false, state: BILLING_STATE[billing.standing] || 'upgrade', reason: 'billing_required', billing: billingInfo, mode };
  }

  // 3. Stripe details submitted, then 4. the Ops-0 approval gate, then Stripe charges.
  // The stored paymentsEnabled flag already folds in the approval gate
  // (connectFlagsFor), so an unapproved band must be reported as awaiting
  // Faneqo's review, not as "Stripe verifying".
  let state;
  if (connectState(band) === 'payout_setup') state = 'payout_setup';
  else if (!(await access.isPaymentsApproved(strapi, band.id, env))) state = 'security_review';
  else state = connectState(band) || 'live';
  const result = { eligible: state === 'live', state, reason: state === 'live' ? null : state, billing: billingInfo, mode };

  if (!billing.entitled) {
    // Shadow mode: what enforcement would have decided, for review before the switch.
    result.shadowState = BILLING_STATE[billing.standing] || 'upgrade';
    if (state === 'live') {
      strapi.log?.info?.(`[payments-eligibility] shadow: band ${band.id} is live but would need Pro (${billing.standing})`);
    }
  }
  return result;
}

/**
 * May this band open a NEW Stripe Connect account? Only with a paid
 * entitlement (Lifetime Pro, an unexpired exception, verified paid, or grace)
 * while FANEQO_PAYMENTS_REQUIRE_PAID=enforce. Shadow mode always allows (and
 * logs what enforcement would refuse). Bands that already have an account are
 * not asked: they keep finishing setup.
 */
async function canCreateConnectAccount(strapi, bandId, { env = process.env, now = Date.now() } = {}) {
  let band;
  try {
    band = await strapi.entityService.findOne('api::band.band', bandId, {
      fields: ['id'],
      populate: { users_permissions_user: { fields: ['id', 'blocked', 'subscriptionStatus', 'plan', 'firstPaidAt', 'gracePeriodStart'] } },
      publicationState: 'preview',
    });
  } catch (err) {
    strapi.log?.warn?.(`[payments] onboarding entitlement lookup failed for band ${bandId}: ${err.message}`);
    return { allowed: requirePaidMode(env) !== 'enforce', reason: 'lookup_failed' };
  }
  const owner = band?.users_permissions_user;
  const exception = activeException(await readKvValue(strapi, EXCEPTIONS_KEY, now), bandId, now);
  const billing = billingStanding(owner, { exception, now });
  if (billing.entitled) return { allowed: true, standing: billing.standing };
  if (requirePaidMode(env) !== 'enforce') {
    strapi.log?.info?.(`[payments-eligibility] shadow: band ${bandId} opens a Stripe account without Pro (${billing.standing})`);
    return { allowed: true, standing: billing.standing, shadow: true };
  }
  return { allowed: false, standing: billing.standing };
}

module.exports = {
  canCreateConnectAccount,
  EXCEPTIONS_KEY,
  REVIEW_KEY,
  GRACE_MS,
  requirePaidMode,
  activeException,
  billingStanding,
  connectState,
  paymentEligibility,
  clearEligibilityCache,
};
