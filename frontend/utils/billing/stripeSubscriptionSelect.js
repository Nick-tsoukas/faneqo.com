/**
 * Pick a meaningful current Stripe subscription. Do not take the first
 * arbitrary list row when that row is an old canceled subscription.
 */

const REUSE_STATUSES = ['trialing', 'active', 'past_due']

export function pickBestReusableSubscription(subscriptions) {
  const list = Array.isArray(subscriptions) ? subscriptions : []
  for (const status of REUSE_STATUSES) {
    const found = list.find((sub) => sub && sub.status === status)
    if (found) return found
  }
  return null
}

export function mapStripeStatusForUserRow(status) {
  const s = String(status || '').trim()
  if (s === 'past_due') return 'pastDue'
  if (s === 'active') return 'active'
  if (s === 'trialing') return 'trialing'
  if (s === 'canceled') return 'canceled'
  if (s === 'unpaid') return 'unpaid'
  if (s === 'incomplete' || s === 'incomplete_expired' || s === 'paused') return 'unpaid'
  return 'unpaid'
}
