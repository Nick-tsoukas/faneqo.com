/**
 * Client-side amount rules for payment buttons. Mirrors the server
 * (qrserver src/utils/payments/checkoutAmount.js) so fans see the real
 * minimum before checkout instead of a server error after it.
 */

// Stripe's USD minimum.
export const MIN_CHECKOUT_DOLLARS = 0.5

function presetList(btn) {
  return (Array.isArray(btn?.presetAmounts) ? btn.presetAmounts : [])
    .map(Number)
    .filter((p) => Number.isFinite(p) && p > 0)
}

/** Smallest amount a fan may enter for a "min" button. */
export function minimumForMinMode(btn) {
  return Math.max(MIN_CHECKOUT_DOLLARS, Number(btn?.minAmount) || 0)
}

/** Smallest custom amount for a "presets" button (its smallest preset). */
export function minimumForCustomPreset(btn) {
  const presets = presetList(btn)
  return Math.max(MIN_CHECKOUT_DOLLARS, presets.length ? Math.min(...presets) : 0)
}

/** @returns {string|null} a message for the fan, or null when the amount is valid */
export function checkoutAmountError(btn, amount, { custom = false } = {}) {
  const a = Number(amount)
  if (btn?.pricingMode === 'min') {
    if (!Number.isFinite(a) || a <= 0) return 'Enter an amount'
    const min = minimumForMinMode(btn)
    if (a < min) return `Minimum is $${formatDollars(min)}`
    return null
  }
  if (btn?.pricingMode === 'presets') {
    if (!Number.isFinite(a) || a <= 0) return custom ? 'Enter an amount' : 'Select an amount'
    if (custom) {
      const min = minimumForCustomPreset(btn)
      if (a < min) return `Minimum is $${formatDollars(min)}`
    }
    return null
  }
  return null
}

export function formatDollars(n) {
  return Number.isInteger(n) ? String(n) : Number(n).toFixed(2)
}

/** One id per checkout start, so a retried request reuses the same session. */
export function newCheckoutAttemptId() {
  const c = globalThis.crypto
  if (c?.randomUUID) return c.randomUUID()
  return `a${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`
}
