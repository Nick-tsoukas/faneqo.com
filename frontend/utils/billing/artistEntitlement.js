/**
 * Frontend mirror of founder-granted ambassador / white-glove Pro.
 *
 * plan === 'free' is LIFETIME FULL PRO, billing exempt.
 * Not a fan account. Not a failed signup. Not a future limited free artist tier.
 * Never infer from missing Stripe fields.
 */

export function isBillingExemptLifetimePro(user) {
  if (!user) return false
  if (String(user.plan || '').trim() === 'free') return true
  if (String(user.subscriptionStatus || '').trim() === 'free') return true
  return false
}

export function isAmbassadorBilling(billing) {
  return Boolean(billing?.billingExempt || billing?.entitlement === 'lifetime_pro')
}

export function ambassadorPlanLabel() {
  return 'Lifetime Pro'
}

export function ambassadorStatusLabel() {
  return 'Complimentary'
}
