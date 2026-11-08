/**
 * Past due banner truthfulness — ambassador / lifetime Pro artists owe nothing.
 * Run: node scripts/test-past-due-banner.mjs
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse, compileScript, compileTemplate } from '@vue/compiler-sfc'
import { shouldShowPastDueBanner, pastDueBannerCopy } from '../utils/billing/pastDueBanner.js'
import { isAmbassadorBilling, isBillingExemptLifetimePro } from '../utils/billing/artistEntitlement.js'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const bannerSrc = fs.readFileSync(path.join(root, 'components/PastDueBanner.vue'), 'utf8')
const dashboardSrc = fs.readFileSync(path.join(root, 'pages/dashboard/index.vue'), 'utf8')

function compileSfc(rel) {
  const source = fs.readFileSync(path.join(root, rel), 'utf8')
  const { descriptor, errors } = parse(source, { filename: rel })
  assert.deepEqual(errors, [], `${rel} parse errors`)
  if (descriptor.scriptSetup || descriptor.script) {
    compileScript(descriptor, { id: rel, filename: rel })
  }
  const template = compileTemplate({
    source: descriptor.template.content,
    filename: rel,
    id: rel,
  })
  assert.deepEqual(template.errors, [], `${rel} template compile errors`)
}

let passed = 0
function test(name, fn) {
  fn()
  passed += 1
  console.log(`  ✅ ${name}`)
}

console.log('\n=== Past due banner ===\n')

// This is exactly what qrserver returns for a billing-exempt artist:
// ambassadorSubscriptionStatusPayload() + ambassadorBillingInfoPayload().
test('ambassador lifetime Pro never sees Payment Overdue', () => {
  assert.equal(
    shouldShowPastDueBanner({
      status: 'active',
      daysLeft: null,
      hasPaymentMethod: false,
      billingExempt: true,
    }),
    false
  )
})

test('ambassador stays clear even if billingExempt has not loaded yet', () => {
  // status active alone is enough; no active subscription is ever overdue.
  assert.equal(
    shouldShowPastDueBanner({ status: 'active', daysLeft: null, hasPaymentMethod: false }),
    false
  )
  // Rows stamped subscriptionStatus 'free' rather than plan 'free'.
  assert.equal(
    shouldShowPastDueBanner({ status: 'free', daysLeft: null, hasPaymentMethod: false }),
    false
  )
})

test('entitlement helpers recognize both ambassador shapes', () => {
  assert.equal(isBillingExemptLifetimePro({ subscriptionStatus: 'free' }), true)
  assert.equal(isBillingExemptLifetimePro({ plan: 'free' }), true)
  assert.equal(isAmbassadorBilling({ billingExempt: true, entitlement: 'lifetime_pro' }), true)
  assert.equal(isBillingExemptLifetimePro({ subscriptionStatus: 'past_due' }), false)
})

test('genuinely delinquent artists still see the banner', () => {
  for (const status of ['past_due', 'unpaid', 'incomplete', 'incomplete_expired']) {
    assert.equal(shouldShowPastDueBanner({ status, hasPaymentMethod: true }), true, status)
  }
})

test('finished trial with no card still sees the banner', () => {
  assert.equal(
    shouldShowPastDueBanner({ status: 'trialing', daysLeft: 0, hasPaymentMethod: false }),
    true
  )
})

test('trial in progress with no card does not see the banner', () => {
  assert.equal(
    shouldShowPastDueBanner({ status: 'trialing', daysLeft: 5, hasPaymentMethod: false }),
    false
  )
})

test('unknown billing state does not accuse the artist', () => {
  assert.equal(shouldShowPastDueBanner({}), false)
  assert.equal(shouldShowPastDueBanner({ status: null, daysLeft: null, hasPaymentMethod: null }), false)
})

test('a trial that ended without a card is not called a failed payment', () => {
  const c = pastDueBannerCopy({ hasPaymentMethod: false })
  assert.equal(c.title, 'Your free trial has ended')
  assert.equal(c.action, 'Add a card')
  assert.doesNotMatch(JSON.stringify(c), /payment didn|overdue|invoice/i)
})

test('a failed charge on a saved card asks to update payment', () => {
  for (const hasPaymentMethod of [true, null]) {
    const c = pastDueBannerCopy({ hasPaymentMethod })
    assert.equal(c.action, 'Update payment')
    assert.match(c.title, /didn't go through/)
  }
})

test('banner copy never states a price', () => {
  for (const hasPaymentMethod of [true, false, null]) {
    assert.doesNotMatch(JSON.stringify(pastDueBannerCopy({ hasPaymentMethod })), /\$\d/)
  }
})

test('banner uses the shared copy and shows errors inline, not alert()', () => {
  assert.match(bannerSrc, /pastDueBannerCopy\(/)
  assert.doesNotMatch(bannerSrc, /alert\(/)
  assert.doesNotMatch(bannerSrc, /Payment Overdue|Pay Now/)
})

test('banner delegates to the shared helper, no inline heuristic', () => {
  assert.match(bannerSrc, /shouldShowPastDueBanner/)
  assert.doesNotMatch(bannerSrc, /trialOverNoCard/)
})

test('dashboard passes the exemption to both billing banners', () => {
  assert.match(dashboardSrc, /:billing-exempt="isBillingExempt"/)
  assert.match(dashboardSrc, /!isBillingExempt/)
  assert.match(dashboardSrc, /isAmbassadorBilling\(billingInfo\.value\)/)
  assert.match(dashboardSrc, /isBillingExemptLifetimePro\(user\.value\)/)
})

test('banner and dashboard compile', () => {
  compileSfc('components/PastDueBanner.vue')
  compileSfc('pages/dashboard/index.vue')
})

console.log(`\n=== past due banner: ${passed} passed ===`)
