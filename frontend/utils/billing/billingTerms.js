/**
 * Faneqo Pro billing and trial terms, in one place, for every surface that
 * starts a trial or can lead to a card being charged. Pure; no network.
 *
 * Facts this copy relies on (verify before changing any of them):
 *   - New accounts get a 30-day trial with no card (qrserver provisionStripeTrial,
 *     trial_period_days 30; production trial 2026-11-10 → 2026-12-10).
 *   - Faneqo Pro's default price is $12/month (STRIPE_DEFAULT_PRICE_ID, live).
 *   - With no card on file, nothing is ever charged: the trial simply lapses.
 *   - With a card on file, the first payment is charged when the trial ends.
 *   - Starting Pro early ends the trial and charges the subscription's price
 *     immediately (startPro.js); with no live subscription it starts a new one
 *     at the current $12. Legacy subscriptions (e.g. $7) keep their own price.
 *   - Cancelling in the billing portal stops renewal at the end of the paid period.
 *
 * Surfaces about an existing subscription pass that subscription's real price
 * (from /stripe/billing); without it they fall back to wording with no amount
 * rather than inventing one. Lifetime Pro never sees any of this.
 *
 * DRAFT wording pending legal review (payments certification C3).
 */

// The CURRENT price, for new subscriptions only. An existing subscription keeps
// its own Stripe price (legacy $7 members stay at $7): use priceLabelFrom().
export const PRO_PRICE_AMOUNT = '$12'
export const PRO_PRICE_LABEL = '$12/month'
export const TRIAL_DAYS = 30
export const CANCEL_HOW = 'Cancel anytime from Account → Manage Billing Info.'

/** Shown on signup, before the account (and its trial) is created. */
export const SIGNUP_TERMS =
  `Includes a ${TRIAL_DAYS}-day free trial of Faneqo Pro, no card needed. ` +
  `After the trial, Pro is ${PRO_PRICE_LABEL} and renews monthly, but only once you add a card. ` +
  `No card, no charge. ${CANCEL_HOW}`

/**
 * "$12/month" from a /stripe/billing price ({ unitAmount, currency, interval,
 * intervalCount }); whole amounts drop the cents. Null when anything is missing.
 */
export function priceLabelFrom(price, locale = 'en-US') {
  if (!price || !price.interval) return null
  const money = priceAmountFrom(price, locale)
  if (!money) return null
  const count = Number(price.intervalCount) > 1 ? Number(price.intervalCount) : 1
  return count === 1 ? `${money}/${price.interval}` : `${money} every ${count} ${price.interval}s`
}

/** "$12" (one billing period's price) from a /stripe/billing price, or null. */
export function priceAmountFrom(price, locale = 'en-US') {
  if (!price || price.unitAmount == null || !price.currency) return null
  const cents = Number(price.unitAmount)
  if (!Number.isFinite(cents) || cents <= 0) return null
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: String(price.currency).toUpperCase(),
      minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(cents / 100)
  } catch {
    return null
  }
}

/** Dashboard trial banner, whose button opens the billing portal to add a card. */
export function trialBannerText(priceLabel = null) {
  const renew = priceLabel
    ? `Pro is ${priceLabel} from the day your trial ends and renews monthly until you cancel.`
    : 'Pro then renews monthly at your plan’s price until you cancel.'
  return `Add a card to keep Faneqo Pro after your trial. You won’t be charged today. ${renew}`
}

/**
 * Past-due banner. Adding or updating a card here can pay the amount due right
 * away, so the banner says so before the click. The open invoice's amount isn't
 * read here, so it is never stated; the renewal uses the subscription's price.
 */
export function pastDueChargeNote(priceLabel = null) {
  const renew = priceLabel ? `Pro renews at ${priceLabel}` : 'Pro renews at your plan’s price'
  return `This may charge the amount that’s due right away. After that, ${renew} until you cancel.`
}

/**
 * Account page fine print under the billing button.
 * @param {{ status?: string|null, priceLabel?: string|null, hasPaymentMethod?: boolean|null }} billing
 * @returns {string[]} lines, empty for Lifetime Pro / no billing data
 */
export function accountBillingTerms({ status = null, priceLabel = null, hasPaymentMethod = null, billingExempt = false } = {}) {
  if (billingExempt) return []
  const s = String(status || '').trim()
  // Only a live subscription can renew or be cancelled; ended ones get no terms here.
  if (!['trialing', 'active', 'past_due', 'pastDue', 'unpaid'].includes(s)) return []
  const lines = []
  if (s === 'trialing') {
    lines.push(priceLabel
      ? `Your trial is free. With a card on file, Pro renews at ${priceLabel} when the trial ends. Without one, nothing is charged.`
      : 'Your trial is free. With a card on file, Pro renews monthly when the trial ends. Without one, nothing is charged.')
  } else if (['past_due', 'pastDue', 'unpaid'].includes(s)) {
    lines.push(hasPaymentMethod === false
      ? pastDueChargeNote(priceLabel).replace('This may', 'Adding a card may')
      : pastDueChargeNote(priceLabel).replace('This may', 'Paying the invoice may'))
  }
  lines.push(`${CANCEL_HOW.replace('from Account → ', 'in ')} Pro stays on until the end of your current trial or billing period and won’t renew after that. Any balance that’s already due may still be collected.`)
  return lines
}

/**
 * Shown beside "Continue with Google" on /login: Google sign-in there creates
 * an account and starts the trial for a new email (qrserver confirm-social /
 * utils/auth/socialLogin.js newUserFlow), without passing through /signup.
 */
export const GOOGLE_NEW_ACCOUNT_TERMS = `First time here? Continuing with Google creates your account. ${SIGNUP_TERMS}`
