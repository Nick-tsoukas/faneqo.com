/**
 * Release C: the Account page loads Subscription Status with the dashboard's
 * authenticated client call, and shows every billing state truthfully.
 * Run: node scripts/test-account-billing-load.mjs
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadAccountBilling } from '../utils/billing/accountBillingLoad.js'
import { formatAccountRenewalCopy } from '../utils/billing/accountBillingDisplay.js'
import { accountBillingTerms, priceLabelFrom } from '../utils/billing/billingTerms.js'
import { isAmbassadorBilling } from '../utils/billing/artistEntitlement.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const page = fs.readFileSync(path.join(root, 'pages/account.vue'), 'utf8')
const dashboard = fs.readFileSync(path.join(root, 'pages/dashboard/index.vue'), 'utf8')
const tpl = page.slice(0, page.lastIndexOf('</template>'))
let passed = 0
async function test(name, fn) {
  await fn()
  passed += 1
  console.log(`  ok  ${name}`)
}

const price = (cents) => ({ unitAmount: cents, currency: 'usd', interval: 'month', intervalCount: 1 })
const payload = (status, cents, extra = {}) => ({ hasPaymentMethod: true, trialEndsAt: null, subscription: { status, price: cents ? price(cents) : null }, ...extra })
const ok = (body) => () => Promise.resolve(body)
const fails = () => Promise.reject(new Error('500'))

// What the page shows for a loaded payload (the same helpers the template uses).
function shown(data) {
  const status = data?.subscription?.status || ''
  return {
    renewal: formatAccountRenewalCopy(data),
    terms: accountBillingTerms({ status, priceLabel: priceLabelFrom(data?.subscription?.price), hasPaymentMethod: data?.hasPaymentMethod ?? null, billingExempt: isAmbassadorBilling(data) }).join(' '),
  }
}

await test('root cause fixed: no useFetch; the same authenticated client call as the dashboard', () => {
  const script = page.slice(page.indexOf('<script'))
  assert.doesNotMatch(script, /useFetch\(/, 'useFetch inside onMounted never sent the request in production')
  assert.match(script, /client\('\/stripe\/billing', \{ headers: \{ Authorization: `Bearer \$\{token\.value\}` \} \}\)/)
  assert.match(dashboard, /client\("\/stripe\/billing", \{\s*headers: \{ Authorization: `Bearer \$\{token\.value\}` \},/)
  assert.match(script, /onMounted\(async \(\) => \{[\s\S]*fetchBillingInfo\(\)/)
})

await test('$12 subscription: loads and shows $12', async () => {
  const r = await loadAccountBilling(ok(payload('active', 1200)))
  assert.equal(r.billingUnavailable, false)
  assert.equal(shown(r.billingData).renewal, 'Renews at $12.00/month')
})

await test('legacy $7 subscription: shows $7, never $12', async () => {
  const r = await loadAccountBilling(ok(payload('active', 700)))
  const s = shown(r.billingData)
  assert.equal(s.renewal, 'Renews at $7.00/month')
  assert.doesNotMatch(JSON.stringify(s), /\$12/)
})

await test('free trial: "After trial" with the real price; trial terms', async () => {
  const r = await loadAccountBilling(ok(payload('trialing', 1200, { hasPaymentMethod: false, trialEndsAt: '2026-12-10T00:00:00.000Z' })))
  const s = shown(r.billingData)
  assert.equal(s.renewal, 'After trial: $12.00/month')
  assert.match(s.terms, /Your trial is free\. With a card on file, Pro renews at \$12\/month when the trial ends/)
})

await test('past due: renews at its own price; the amount due is never stated', async () => {
  const r = await loadAccountBilling(ok(payload('past_due', 700)))
  const s = shown(r.billingData)
  assert.equal(s.renewal, 'Renews at $7.00/month')
  assert.match(s.terms, /Paying the invoice may charge the amount that’s due right away/)
})

await test('canceled: loads, but never says it renews and shows no billing terms', async () => {
  const r = await loadAccountBilling(ok(payload('canceled', 700)))
  assert.equal(r.billingUnavailable, false)
  const s = shown(r.billingData)
  assert.equal(s.renewal, null)
  assert.equal(s.terms, '')
})

await test('Lifetime Pro: ambassador payload shown as Lifetime Pro; never "unavailable", even on a failed read', async () => {
  const amb = { billingExempt: true, entitlement: 'lifetime_pro' }
  const r = await loadAccountBilling(ok(amb), { billingExemptUser: true })
  assert.equal(isAmbassadorBilling(r.billingData), true)
  assert.equal(shown(r.billingData).renewal, null)
  assert.equal(shown(r.billingData).terms, '')
  assert.deepEqual(await loadAccountBilling(fails, { billingExemptUser: true }), { billingData: null, billingUnavailable: false })
})

await test('unavailable: a failed or empty read says "temporarily unavailable" instead of showing nothing', async () => {
  assert.deepEqual(await loadAccountBilling(fails), { billingData: null, billingUnavailable: true })
  assert.deepEqual(await loadAccountBilling(ok(null)), { billingData: null, billingUnavailable: true })
  assert.deepEqual(await loadAccountBilling(ok('')), { billingData: null, billingUnavailable: true })
})

await test('missing price: no amount is invented', async () => {
  const r = await loadAccountBilling(ok(payload('active', null)))
  assert.equal(shown(r.billingData).renewal, null)
  assert.doesNotMatch(shown(r.billingData).terms, /\$/)
})

await test('template: Lifetime Pro → loaded → loading → unavailable, so the block never stays blank', () => {
  const order = ['v-if="isAmbassador"', 'v-else-if="billingData"', 'v-else-if="billingLoading"', 'v-else-if="billingUnavailable"'].map((s) => tpl.indexOf(s))
  assert.ok(order.every((i) => i > 0), 'all four branches present')
  assert.deepEqual([...order].sort((a, b) => a - b), order, 'in this order')
  assert.match(tpl, /data-testid="account-billing-loading"/)
  assert.match(page, /const billingLoading = ref\(true\)/)
  assert.match(page, /billingLoading\.value = false/)
})

console.log(`\n=== account billing load: ${passed} passed ===`)
