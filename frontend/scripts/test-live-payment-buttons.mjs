/**
 * Artist pages show checkout only while the server says payments are live.
 * A band that enabled buttons but never finished Stripe setup (or is
 * suspended) shows none, in every layout, without losing its saved buttons.
 * Run: node scripts/test-live-payment-buttons.mjs
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse, compileScript, compileTemplate } from '@vue/compiler-sfc'
import { paymentsAreLive, livePaymentButtons } from '../utils/payments/livePaymentButtons.js'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8')

let passed = 0
function test(name, fn) {
  fn()
  passed += 1
  console.log(`  ok  ${name}`)
}

const buttons = () => [
  { key: 'support_band', enabled: true, pricingMode: 'min', minAmount: 5 },
  { key: 'tip_band', enabled: true, pricingMode: 'presets', presetAmounts: [5, 10] },
  { key: 'pay_entry', enabled: false, pricingMode: 'fixed', fixedAmount: 10 },
]

test('active payments: every enabled button shows, disabled ones do not', () => {
  const band = { paymentsEnabled: true, paymentButtons: buttons() }
  assert.equal(paymentsAreLive(band), true)
  assert.deepEqual(livePaymentButtons(band).map((b) => b.key), ['support_band', 'tip_band'])
})

test('incomplete Stripe onboarding (buttons enabled, payments not live): nothing shows', () => {
  // The Emerge shape: three buttons switched on, Stripe never connected.
  const band = { paymentsEnabled: false, stripeOnboardingComplete: false, paymentButtons: buttons() }
  assert.equal(paymentsAreLive(band), false)
  assert.deepEqual(livePaymentButtons(band), [])
})

test('suspended or Stripe-restricted band (server sets paymentsEnabled false): nothing shows', () => {
  assert.deepEqual(livePaymentButtons({ paymentsEnabled: false, stripeOnboardingComplete: true, paymentButtons: buttons() }), [])
})

test('missing or non-boolean readiness fails closed', () => {
  for (const paymentsEnabled of [undefined, null, 'true', 1]) {
    assert.deepEqual(livePaymentButtons({ paymentsEnabled, paymentButtons: buttons() }), [], String(paymentsEnabled))
  }
  assert.deepEqual(livePaymentButtons(null), [])
  assert.deepEqual(livePaymentButtons({ paymentsEnabled: true }), [])
})

test("the artist's saved button configuration is never changed", () => {
  const band = { paymentsEnabled: false, paymentButtons: buttons() }
  const before = JSON.stringify(band)
  livePaymentButtons(band)
  livePaymentButtons({ ...band, paymentsEnabled: true })
  assert.equal(JSON.stringify(band), before)
})

test('band page derives every payment surface from the one live list', () => {
  const rel = 'pages/[bandSlug]/index.vue'
  const source = read(rel)
  const { descriptor, errors } = parse(source, { filename: rel })
  assert.deepEqual(errors, [])
  const script = compileScript(descriptor, { id: rel, filename: rel }).content
  assert.match(script, /enabledPaymentButtons = computed\(\(\) => livePaymentButtons\(band\.value\?\.data\)\)/)
  assert.match(script, /canShowPayments = computed\(\(\) => enabledPaymentButtons\.value\.length > 0\)/)
  // No second, looser filter of the raw saved buttons anywhere on the page
  assert.doesNotMatch(script, /data\?\.paymentButtons[\s\S]{0,80}enabled === true/)
  const tpl = descriptor.template.content
  for (const layout of ['BandPageCompact', 'BandPageCybered', 'BandPageBold']) {
    const tag = tpl.match(new RegExp(`<${layout}[\\s\\S]*?>`))
    assert.ok(tag, `${layout} rendered`)
    assert.match(tag[0], /:enabled-payment-buttons="enabledPaymentButtons"/, `${layout} gets the live list`)
  }
  assert.match(tpl, /v-for="btn in enabledPaymentButtons"/, 'default layout iterates the live list')
  assert.match(tpl, /:has-pay-entry="enabledPaymentButtons\.length > 0"/, 'pay-entry chip follows the live list')
})

test('layouts only render buttons they are given, never the raw saved list', () => {
  const layouts = [
    'components/band/BandPageCompact.vue',
    'components/band/BandPageBold.vue',
    'components/band/BandPageCybered.vue',
    'components/publication/PublicationCyberedLayout.vue',
  ]
  for (const rel of layouts) {
    const source = read(rel)
    const { descriptor, errors } = parse(source, { filename: rel })
    assert.deepEqual(errors, [], `${rel} parses`)
    compileScript(descriptor, { id: rel, filename: rel })
    const t = compileTemplate({ source: descriptor.template.content, filename: rel, id: rel })
    assert.deepEqual(t.errors, [], `${rel} template compiles`)
    assert.match(source, /enabledPaymentButtons/, `${rel} uses the prop`)
    assert.doesNotMatch(source, /band\??\.paymentButtons/, `${rel} must not read band.paymentButtons`)
  }
  // The publication layout is fed by BandPageCybered with the same prop
  assert.match(read('components/band/BandPageCybered.vue'), /<PublicationCyberedLayout[\s\S]*?:enabled-payment-buttons="enabledPaymentButtons"/)
})

console.log(`\n${passed} passed`)
