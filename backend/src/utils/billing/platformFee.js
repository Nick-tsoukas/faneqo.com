'use strict';

/**
 * Faneqo platform fee on fan payments (direct charges on connected accounts).
 *
 * FANEQO_PLATFORM_FEE_BPS sets the fee in basis points (200 = 2%). Unset, 0 or
 * anything invalid means off. The fee is taken out of the artist's proceeds by
 * Stripe (application_fee_amount); the buyer's price never changes.
 */

const MAX_BPS = 1000; // 10%: a guard against a mistyped env value

function platformFeeBps(env = process.env) {
  const bps = Number(env.FANEQO_PLATFORM_FEE_BPS);
  if (!Number.isInteger(bps) || bps <= 0 || bps > MAX_BPS) return 0;
  return bps;
}

/** Fee in cents for a gross amount in cents, rounded to the nearest cent. */
function platformFeeCents(grossCents, bps = platformFeeBps()) {
  const gross = Number(grossCents);
  if (!Number.isInteger(gross) || gross <= 0 || !bps) return 0;
  return Math.round((gross * bps) / 10000);
}

/**
 * payment_intent_data for a Checkout Session. Returns {} when the fee is off
 * (or rounds to zero), so application_fee_amount is omitted entirely.
 */
function platformFeePaymentIntentData(grossCents, bps = platformFeeBps()) {
  const fee = platformFeeCents(grossCents, bps);
  return fee > 0 ? { payment_intent_data: { application_fee_amount: fee } } : {};
}

module.exports = { platformFeeBps, platformFeeCents, platformFeePaymentIntentData };
