/**
 * Band page checkout: amounts the server will accept, and no invented buttons.
 * Mirrors qrserver scripts/test-payments-hardening.js amount rules.
 * Run: node scripts/test-checkout-amount.mjs
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse, compileScript } from '@vue/compiler-sfc'
import {
  MIN_CHECKOUT_DOLLARS,
  checkoutAmountError,
  minimumForCustomPreset,
  minimumForMinMode,
  newCheckoutAttemptId,
} from '../utils/payments/checkoutAmount.js'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8')

let passed = 0
function test(name, fn) {
  fn()
  passed += 1
  console.log(`  ok  ${name}`)
}

test('min mode: the larger of the artist minimum and $0.50', () => {
  assert.equal(MIN_CHECKOUT_DOLLARS, 0.5)
  assert.equal(minimumForMinMode({ pricingMode: 'min' }), 0.5)
  assert.equal(minimumForMinMode({ pricingMode: 'min', minAmount: 5 }), 5)
  assert.equal(checkoutAmountError({ pricingMode: 'min' }, 0.3), 'Minimum is $0.50')
  assert.equal(checkoutAmountError({ pricingMode: 'min' }, 0), 'Enter an amount')
  assert.equal(checkoutAmountError({ pricingMode: 'min', minAmount: 5 }, 4), 'Minimum is $5')
  assert.equal(checkoutAmountError({ pricingMode: 'min', minAmount: 5 }, 5), null)
})

test('presets: listed amounts always; custom at or above the smallest preset', () => {
  const btn = { pricingMode: 'presets', presetAmounts: [10, 20] }
  assert.equal(minimumForCustomPreset(btn), 10)
  assert.equal(checkoutAmountError(btn, 20), null)
  assert.equal(checkoutAmountError(btn, 15, { custom: true }), null)
  assert.equal(checkoutAmountError(btn, 5, { custom: true }), 'Minimum is $10')
  assert.equal(checkoutAmountError(btn, null), 'Select an amount')
})

test('attempt ids match the server format', () => {
  const id = newCheckoutAttemptId()
  assert.match(id, /^[A-Za-z0-9_-]{8,64}$/)
  assert.notEqual(id, newCheckoutAttemptId())
})

test('band page compiles, has no invented fallback button, and validates with the shared rules', () => {
  const rel = 'pages/[bandSlug]/index.vue'
  const source = read(rel)
  const { descriptor, errors } = parse(source, { filename: rel })
  assert.deepEqual(errors, [])
  const script = compileScript(descriptor, { id: rel, filename: rel }).content
  assert.ok(!/FALLBACK_SUPPORT_BUTTON/.test(script), 'fallback button removed')
  assert.ok(/checkoutAmountError\(btn, a/.test(script), 'startCheckout uses checkoutAmountError')
  assert.ok(/attemptId: newCheckoutAttemptId\(\)/.test(script), 'checkout sends an attemptId')
  assert.ok(/b\.pricingMode !== 'fixed'/.test(script), 'quick tips skip fixed-price buttons')
  assert.ok(!/min="0"\s*\n\s*class="w-32/.test(source), 'no $0 minimum on the amount input')
})

console.log(`\n${passed} passed`)
