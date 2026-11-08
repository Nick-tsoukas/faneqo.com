'use strict';

/**
 * Amount rules for payment buttons. Pure; shared by checkout and tests.
 *
 * Stripe's USD minimum is $0.50. Presets mode accepts any listed preset, and
 * also a custom amount at or above the smallest preset, because the profile
 * page offers "+ Custom" next to the presets.
 */

const MIN_CENTS = 50;
const MAX_CENTS = 99999999;

const toCents = (dollars) => Math.round(Number(dollars) * 100);

/** @returns {{ ok: true, cents: number } | { ok: false, error: string }} */
function resolveCheckoutCents(btn, amount) {
  if (!btn) return { ok: false, error: 'This payment option is not enabled' };
  let cents;

  if (btn.pricingMode === 'fixed') {
    cents = toCents(btn.fixedAmount || 0);
  } else if (btn.pricingMode === 'presets') {
    const a = Number(amount);
    if (!Number.isFinite(a) || a <= 0) return { ok: false, error: 'Invalid amount' };
    const presets = (Array.isArray(btn.presetAmounts) ? btn.presetAmounts : [])
      .map(Number)
      .filter((p) => Number.isFinite(p) && p > 0);
    const isPreset = presets.some((p) => toCents(p) === toCents(a));
    const smallest = presets.length ? Math.min(...presets) : 0;
    if (!isPreset && toCents(a) < Math.max(MIN_CENTS, toCents(smallest))) {
      return { ok: false, error: 'Amount too low' };
    }
    cents = toCents(a);
  } else if (btn.pricingMode === 'min') {
    const a = Number(amount);
    if (!Number.isFinite(a) || a <= 0) return { ok: false, error: 'Amount too low' };
    if (toCents(a) < Math.max(MIN_CENTS, toCents(btn.minAmount || 0))) {
      return { ok: false, error: 'Amount too low' };
    }
    cents = toCents(a);
  } else {
    return { ok: false, error: 'Unsupported pricingMode' };
  }

  if (!cents || cents < MIN_CENTS) return { ok: false, error: 'Amount invalid' };
  if (cents > MAX_CENTS) return { ok: false, error: 'Amount too high' };
  return { ok: true, cents };
}

module.exports = { resolveCheckoutCents, MIN_CENTS, MAX_CENTS };
