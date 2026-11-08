/**
 * Google / social artist signup billing policy.
 * New signup: fail closed (no JWT) if Stripe is missing.
 * Existing billed user: identity login continues during temporary Stripe trouble.
 * Incomplete unpaid identity: retry Stripe, then authenticate only after persist.
 * Founder-granted ambassador (plan=free): never repair/provision Stripe.
 */

import { isBillingExemptLifetimePro } from './artistEntitlement.js'

export function classifySocialUser(user) {
  if (!user?.id) return 'new'
  if (isBillingExemptLifetimePro(user)) return 'existing_ambassador'
  if (user.customerId) return 'existing_billed'
  return 'existing_incomplete'
}

export function shouldAttemptStripeProvision(classification) {
  return classification === 'new' || classification === 'existing_incomplete'
}

export function shouldReturnJwtOnStripeFailure(classification) {
  return classification === 'existing_billed' || classification === 'existing_incomplete'
}

export function shouldFailClosedWithoutJwt(classification) {
  return classification === 'new'
}

export function defaultBlockedSubscriptionStatus() {
  return 'unpaid'
}
