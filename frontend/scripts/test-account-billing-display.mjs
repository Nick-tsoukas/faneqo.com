/**
 * Account billing display — real Stripe price, no hardcoded $7.
 * Run: node scripts/test-account-billing-display.mjs
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse, compileScript, compileTemplate } from '@vue/compiler-sfc'
import {
  formatAccountRenewalCopy,
  formatPricePerInterval,
  formatStripeMoney,
} from '../utils/billing/accountBillingDisplay.js'
import {
  ambassadorPlanLabel,
  ambassadorStatusLabel,
  isAmbassadorBilling,
  isBillingExemptLifetimePro,
} from '../utils/billing/artistEntitlement.js'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const accountSrc = fs.readFileSync(path.join(root, 'pages/account.vue'), 'utf8')

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

console.log('\n=== Account billing display ===\n')

test('account page has no hardcoded Renews at $7.00', () => {
  assert.doesNotMatch(accountSrc, /Renews at \$7\.00/)
  assert.doesNotMatch(accountSrc, /\$7\.00 per month/)
  assert.doesNotMatch(accountSrc, /\$12\.00 per month/)
  assert.match(accountSrc, /formatAccountRenewalCopy/)
  assert.match(accountSrc, /Billing information is temporarily unavailable/)
})

test('$7 subscription renders $7.00/month', () => {
  const copy = formatAccountRenewalCopy({
    subscription: {
      status: 'active',
      price: { unitAmount: 700, currency: 'usd', interval: 'month', intervalCount: 1 },
    },
  })
  assert.equal(copy, 'Renews at $7.00/month')
})

test('$12 subscription renders $12.00/month', () => {
  assert.equal(
    formatPricePerInterval({ unitAmount: 1200, currency: 'usd', interval: 'month', intervalCount: 1 }),
    '$12.00/month'
  )
})

test('trial wording is truthful', () => {
  const copy = formatAccountRenewalCopy({
    subscription: {
      status: 'trialing',
      price: { unitAmount: 1200, currency: 'usd', interval: 'month', intervalCount: 1 },
    },
  })
  assert.equal(copy, 'After trial: $12.00/month')
})

test('active wording is truthful', () => {
  const copy = formatAccountRenewalCopy({
    subscription: {
      status: 'active',
      price: { unitAmount: 1200, currency: 'usd', interval: 'month', intervalCount: 1 },
    },
  })
  assert.equal(copy, 'Renews at $12.00/month')
})

test('unknown price renders no fake amount', () => {
  assert.equal(formatAccountRenewalCopy({ subscription: { status: 'active' } }), null)
  assert.equal(formatAccountRenewalCopy(null), null)
  assert.equal(formatStripeMoney(null, 'usd'), null)
})

test('currency formatting works', () => {
  assert.equal(formatStripeMoney(1200, 'usd'), '$12.00')
  assert.equal(formatStripeMoney(700, 'USD'), '$7.00')
})

test('interval formatting works', () => {
  assert.equal(
    formatPricePerInterval({ unitAmount: 12000, currency: 'usd', interval: 'year', intervalCount: 1 }),
    '$120.00/year'
  )
  assert.equal(
    formatPricePerInterval({ unitAmount: 2400, currency: 'usd', interval: 'month', intervalCount: 3 }),
    '$24.00/3 months'
  )
})

test('ambassador Account does not show renewal amount', () => {
  assert.equal(
    formatAccountRenewalCopy({
      billingExempt: true,
      entitlement: 'lifetime_pro',
      subscription: {
        status: 'active',
        price: { unitAmount: 1200, currency: 'usd', interval: 'month', intervalCount: 1 },
      },
    }),
    null
  )
  assert.equal(isAmbassadorBilling({ billingExempt: true }), true)
  assert.equal(isBillingExemptLifetimePro({ plan: 'free', subscriptionStatus: 'unpaid' }), true)
  assert.equal(ambassadorPlanLabel(), 'Lifetime Pro')
  assert.equal(ambassadorStatusLabel(), 'Complimentary')
  assert.match(accountSrc, /isAmbassador/)
  assert.match(accountSrc, /Lifetime Pro|ambassadorPlan/)
  assert.doesNotMatch(accountSrc, /v-if="isAmbassador"[\s\S]*Renews at/)
})

test('account page compiles', () => {
  compileSfc('pages/account.vue')
})

console.log(`\n=== account billing display: ${passed} passed ===`)
