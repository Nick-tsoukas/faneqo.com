/**
 * Does this artist actually owe money right now?
 *
 * Only a real Stripe delinquency, or a finished trial with no card on file,
 * counts. Two shapes look delinquent but are not:
 *
 *   - Founder-granted lifetime Pro (ambassador / white-glove): billing exempt,
 *     reports no card and no trial end because there is no Stripe subscription.
 *   - A healthy `active` subscription: never overdue, whatever the card and
 *     trial fields happen to say.
 *
 * Fails closed toward "not overdue": a false banner tells a paying or
 * complimentary artist their service is about to be cut off.
 */

const DELINQUENT_STATUSES = ['past_due', 'unpaid', 'incomplete', 'incomplete_expired']

export function shouldShowPastDueBanner({
  status = null,
  daysLeft = null,
  hasPaymentMethod = null,
  billingExempt = false,
} = {}) {
  if (billingExempt) return false

  const s = String(status || '').trim()
  if (DELINQUENT_STATUSES.includes(s)) return true
  if (s === 'active' || s === 'free') return false

  const trialOver = daysLeft === 0 || daysLeft === null
  return trialOver && hasPaymentMethod === false
}

/**
 * What the banner says. Most overdue artists never added a card: their free
 * trial ended and Stripe couldn't bill anyone. Telling them a payment failed
 * is wrong, so that case gets its own words. The amount, when known, comes
 * from the subscription's real price via billingTerms.pastDueChargeNote (C3).
 */
export function pastDueBannerCopy({ hasPaymentMethod = null } = {}) {
  if (hasPaymentMethod === false) {
    return {
      title: 'Your free trial has ended',
      text: 'Add a card to keep your artist page and tools running.',
      action: 'Add a card',
    }
  }
  return {
    title: "Your last payment didn't go through",
    text: 'Update your card to keep your artist page and tools running.',
    action: 'Update payment',
  }
}
