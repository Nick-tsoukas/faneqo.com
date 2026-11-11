'use strict';

/**
 * Who may take payments, decided on the server.
 *
 * - Suspension: an admin-maintained list of band ids (system-kv key
 *   `payments:suspended-bands`, value `{ "bandIds": [70, 73] }`). A suspended
 *   band cannot open checkout, and neither the Connect webhook nor payment
 *   onboarding can switch it back on. Edit the row in the Strapi admin
 *   Content Manager (System-kv); no deploy needed.
 * - Approval (optional): when FANEQO_PAYMENTS_REQUIRE_APPROVAL=true, only
 *   bands in `payments:approved-bands` may take payments. Off by default.
 * - Connect state: `paymentsEnabled` follows Stripe. It is true only while
 *   the account has submitted details AND Stripe allows charges, so an
 *   account Stripe rejects or restricts switches off by itself.
 */

const KV_UID = 'api::system-kv.system-kv';
const SUSPENDED_KEY = 'payments:suspended-bands';
const APPROVED_KEY = 'payments:approved-bands';
const CACHE_MS = 30 * 1000;

const cache = new Map(); // key -> { at, ids: Set<string> }

function approvalRequired(env = process.env) {
  return String(env.FANEQO_PAYMENTS_REQUIRE_APPROVAL || '').trim().toLowerCase() === 'true';
}

function parseBandIds(value) {
  const list = Array.isArray(value) ? value : Array.isArray(value?.bandIds) ? value.bandIds : [];
  return new Set(list.map((id) => String(id).trim()).filter((id) => /^\d+$/.test(id)));
}

async function readBandIdSet(strapi, key, now = Date.now()) {
  const hit = cache.get(key);
  if (hit && now - hit.at < CACHE_MS) return hit.ids;
  let ids = new Set();
  try {
    const rows = await strapi.entityService.findMany(KV_UID, { filters: { key }, limit: 1 });
    ids = parseBandIds(rows?.[0]?.value);
  } catch (err) {
    strapi.log?.warn?.(`[payments] could not read ${key}: ${err.message}`);
    // Keep the last known list rather than failing open on a transient error.
    if (hit) return hit.ids;
  }
  cache.set(key, { at: now, ids });
  return ids;
}

async function isPaymentsSuspended(strapi, bandId) {
  return (await readBandIdSet(strapi, SUSPENDED_KEY)).has(String(bandId));
}

async function isPaymentsApproved(strapi, bandId, env = process.env) {
  if (!approvalRequired(env)) return true;
  return isOnApprovedList(strapi, bandId);
}

/** Operator-vetted band (in `payments:approved-bands`), whether or not the approval gate is on. */
async function isOnApprovedList(strapi, bandId) {
  return (await readBandIdSet(strapi, APPROVED_KEY)).has(String(bandId));
}

/**
 * Band flags for a Stripe Connect account snapshot. Pure.
 * @param {{ details_submitted?: boolean, charges_enabled?: boolean }} account
 * @param {{ suspended?: boolean, approved?: boolean }} gates
 */
function connectFlagsFor(account, { suspended = false, approved = true } = {}) {
  const submitted = account?.details_submitted === true;
  const charges = account?.charges_enabled === true;
  return {
    stripeOnboardingComplete: submitted,
    paymentsEnabled: submitted && charges && !suspended && approved,
  };
}

/**
 * Flags to store for a band after reading its Connect account: Stripe's state
 * plus the suspension list. The approval gate is NOT folded in: every checkout
 * and page view checks it live (paymentEligibility), so an operator's approval
 * or removal takes effect at once instead of waiting for the next Stripe update.
 */
async function connectFlagsForBand(strapi, bandId, account) {
  const suspended = await isPaymentsSuspended(strapi, bandId);
  return connectFlagsFor(account, { suspended });
}

/** The stored half of the checkout gate: flags plus a connected account. Pure. */
function storedFlagsAllowCheckout(band) {
  return band?.paymentsEnabled === true && band?.stripeOnboardingComplete === true && Boolean(band?.stripeAccountId);
}

/**
 * The band's owner account exists and is not blocked. Blocking an owner is how
 * an operator shuts a fraudulent account, and it must stop payments even while
 * the band's stored flags still say "on" (a Connect webhook can set them).
 * Fails closed: no owner, or a failed lookup, means no payments.
 */
async function isOwnerAllowed(strapi, bandId) {
  try {
    const band = await strapi.entityService.findOne('api::band.band', bandId, {
      fields: ['id'],
      populate: { users_permissions_user: { fields: ['id', 'blocked'] } },
      publicationState: 'preview',
    });
    const owner = band?.users_permissions_user;
    return Boolean(owner?.id) && owner.blocked !== true;
  } catch (err) {
    strapi.log?.warn?.(`[payments] owner check failed for band ${bandId}: ${err.message}`);
    return false;
  }
}

/**
 * Whether checkout would accept this band right now. Public pages show payment
 * buttons only when this is true, so a fan never meets a button checkout
 * refuses. The stored flags are only a fast "no"; the answer is the same
 * paymentEligibility() checkout uses (owner, suspension, review hold, billing,
 * Stripe, approval gate).
 */
async function isCheckoutReady(strapi, band) {
  if (!storedFlagsAllowCheckout(band)) return false;
  // Required here, not at the top: paymentEligibility requires this module.
  const { paymentEligibility } = require('./paymentEligibility');
  return (await paymentEligibility(strapi, band.id)).eligible === true;
}

function clearPaymentAccessCache() {
  cache.clear();
  require('./paymentEligibility').clearEligibilityCache();
}

/**
 * Stripe fraud signals (an early fraud warning, or a dispute with reason
 * `fraudulent`) are logged for review. Automatic suspension (payments off,
 * account intact) is off unless FANEQO_SUSPEND_ON_FRAUD_SIGNAL=true: product
 * decision 2026-11-05, no artist is suspended automatically for now.
 * When enabled, an operator lifts a suspension by removing the id from
 * `payments:suspended-bands`, and vetted bands (`payments:approved-bands`)
 * are still only logged.
 */
function suspendOnFraudSignal(env = process.env) {
  return String(env.FANEQO_SUSPEND_ON_FRAUD_SIGNAL || '').trim().toLowerCase() === 'true';
}

/** True for the Connect events that indicate a stolen card on a direct charge. Pure. */
function isFraudSignal(event) {
  if (event?.type === 'radar.early_fraud_warning.created') return true;
  return event?.type === 'charge.dispute.created' && event?.data?.object?.reason === 'fraudulent';
}

/** Add a band to the suspension list and switch its payments off. Idempotent. */
async function suspendBandPayments(strapi, bandId) {
  const id = String(bandId);
  const rows = await strapi.entityService.findMany(KV_UID, { filters: { key: SUSPENDED_KEY }, limit: 1 });
  const row = rows?.[0];
  const ids = parseBandIds(row?.value);
  const added = !ids.has(id);
  if (added) {
    ids.add(id);
    const value = { bandIds: [...ids].map(Number) };
    if (row) await strapi.entityService.update(KV_UID, row.id, { data: { value } });
    else await strapi.entityService.create(KV_UID, { data: { key: SUSPENDED_KEY, value } });
  }
  cache.delete(SUSPENDED_KEY);
  await strapi.entityService.update('api::band.band', bandId, { data: { paymentsEnabled: false } });
  return { added };
}

module.exports = {
  SUSPENDED_KEY,
  APPROVED_KEY,
  approvalRequired,
  parseBandIds,
  isPaymentsSuspended,
  isPaymentsApproved,
  isOnApprovedList,
  connectFlagsFor,
  connectFlagsForBand,
  storedFlagsAllowCheckout,
  isOwnerAllowed,
  isCheckoutReady,
  clearPaymentAccessCache,
  suspendOnFraudSignal,
  isFraudSignal,
  suspendBandPayments,
};
