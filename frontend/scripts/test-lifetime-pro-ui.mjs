/**
 * Lifetime Pro (complimentary; plan or subscriptionStatus "free") never meets
 * a paid path in the artist UI: no trial/upgrade prompt, no billing portal
 * button, no past-due banner, and social login never provisions Stripe for it.
 * Run: node scripts/test-lifetime-pro-ui.mjs
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { isBillingExemptLifetimePro } from '../utils/billing/artistEntitlement.js'
import { classifySocialUser, shouldAttemptStripeProvision } from '../utils/billing/socialSignupPolicy.js'
import { shouldShowPastDueBanner } from '../utils/billing/pastDueBanner.js'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8')

let passed = 0
function test(name, fn) {
  fn()
  passed += 1
  console.log(`  ok  ${name}`)
}

const lifetimeShapes = [
  { id: 1, subscriptionStatus: 'free', plan: null },
  { id: 2, subscriptionStatus: 'canceled', plan: 'free' },
]

test('both stored Lifetime shapes are recognized', () => {
  for (const u of lifetimeShapes) assert.equal(isBillingExemptLifetimePro(u), true)
  assert.equal(isBillingExemptLifetimePro({ subscriptionStatus: 'trialing', plan: 'Pro' }), false)
})

test('social login never creates a Stripe customer or trial for Lifetime Pro', () => {
  for (const u of lifetimeShapes) {
    const kind = classifySocialUser({ ...u, customerId: null })
    assert.equal(kind, 'existing_ambassador')
    assert.equal(shouldAttemptStripeProvision(kind), false)
  }
})

test('no past-due banner for Lifetime Pro', () => {
  assert.equal(shouldShowPastDueBanner({ status: 'free', daysLeft: null, hasPaymentMethod: false }), false)
})

test('dashboard trial / add-payment prompt is gated on not billing-exempt', () => {
  const src = read('pages/dashboard/index.vue')
  const banner = src.slice(src.indexOf('<TrialBanner'), src.indexOf('/>', src.indexOf('<TrialBanner')))
  assert.match(banner, /!isBillingExempt/)
  assert.match(src, /const isBillingExempt = computed\(\s*\(\) => isAmbassadorBilling\(billingInfo\.value\) \|\| isBillingExemptLifetimePro\(user\.value\)/)
})

test('account page hides the billing portal button for Lifetime Pro', () => {
  const src = read('pages/account.vue')
  const portalButton = src.indexOf('@click="goToBillingPortal()"')
  assert.ok(portalButton > 0)
  const guard = src.lastIndexOf('v-if="!isAmbassador"', portalButton)
  assert.ok(guard > 0 && portalButton - guard < 2000, 'billing portal button must sit inside v-if="!isAmbassador"')
  assert.match(src, /const isAmbassador = computed\(\(\) =>\s*isAmbassadorBilling\(billingData\.value\) \|\| isBillingExemptLifetimePro\(user\.value\)/)
})

console.log(`\n${passed} passed`)
