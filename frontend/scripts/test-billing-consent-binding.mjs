/**
 * Review fix (#61): acceptance is bound to the exact terms it was given for.
 * Drives the REAL useBillingConsent composable (Vue reactivity, stubbed Nuxt
 * globals and fetch): a new disclosure, a reload, a refusal or another
 * account/action always needs a fresh tick. The 404 rollout path still works.
 * Run: node scripts/test-billing-consent-binding.mjs
 */
import assert from 'node:assert/strict'
import { termsIdentity, consentPayload } from '../composables/useBillingConsent.js'

let passed = 0
async function test(name, fn) {
  await fn()
  passed += 1
  console.log(`  ok  ${name}`)
}

// Minimal Nuxt globals the composable uses.
const token = { value: 'jwt-for-tests' }
globalThis.useRuntimeConfig = () => ({ public: { strapiUrl: 'http://api.test' } })
globalThis.useStrapiToken = () => token
let responses = []
globalThis.fetch = async () => {
  const r = responses.shift()
  return { ok: r.status === 200, status: r.status, json: async () => r.body }
}
const { useBillingConsent } = await import('../composables/useBillingConsent.js')

const T = (termsKey, extra = {}) => ({ action: 'portal_add_card', consentRequired: true, version: 'faneqo-pro-billing-v1-2026-11-11', termsKey, summary: `terms ${termsKey}`, ...extra })

await test('identity covers version, key and action', () => {
  assert.equal(termsIdentity(T('k1')), 'faneqo-pro-billing-v1-2026-11-11|k1|portal_add_card')
  assert.notEqual(termsIdentity(T('k1')), termsIdentity(T('k1', { action: 'portal_pay_due' })))
  assert.notEqual(termsIdentity(T('k1')), termsIdentity(T('k1', { version: 'v2' })))
  assert.equal(termsIdentity({ consentRequired: false }), null)
})

await test('a tick for one disclosure does not authorize a different one loaded afterwards', async () => {
  const c = useBillingConsent('portal')
  responses = [{ status: 200, body: T('k1') }]
  await c.load()
  c.agreed.value = true
  assert.equal(c.ready.value, true)
  assert.deepEqual(c.payload(), { accepted: true, version: T('k1').version, termsKey: 'k1' })
  responses = [{ status: 200, body: T('k2', { summary: 'Pro is $13/month…' }) }]
  await c.load()
  assert.equal(c.agreed.value, false, 'new terms read as unticked')
  assert.equal(c.ready.value, false)
  assert.equal(c.payload(), null, 'nothing would be sent for the new terms')
  c.agreed.value = true
  assert.equal(c.payload().termsKey, 'k2', 'the new tick binds to the new terms')
})

await test('reloading even identical terms needs a fresh tick (no carry-over across loads, accounts or actions)', async () => {
  const c = useBillingConsent('portal')
  responses = [{ status: 200, body: T('same') }]
  await c.load()
  c.agreed.value = true
  responses = [{ status: 200, body: T('same') }]
  await c.load()
  assert.equal(c.agreed.value, false)
  assert.equal(c.payload(), null)
})

await test('terms replaced directly (not via load) also invalidate the tick immediately', async () => {
  const c = useBillingConsent('portal')
  responses = [{ status: 200, body: T('a') }]
  await c.load()
  c.agreed.value = true
  c.terms.value = T('b')
  assert.equal(c.agreed.value, false, 'no watcher timing: the getter compares identities')
  assert.equal(c.payload(), null)
})

await test('a 409 terms_changed refusal shows the new terms unticked; ticking again sends the new key', async () => {
  const c = useBillingConsent('portal')
  responses = [{ status: 200, body: T('old') }]
  await c.load()
  c.agreed.value = true
  const handled = c.handleRefusal({ error: { status: 409, details: { code: 'terms_changed', terms: T('new') } } })
  assert.equal(handled, true)
  assert.equal(c.agreed.value, false)
  assert.equal(c.terms.value.termsKey, 'new')
  assert.match(c.notice.value, /terms changed/)
  c.agreed.value = true
  assert.equal(c.payload().termsKey, 'new')
})

await test('a failed load clears both terms and tick (action disabled)', async () => {
  const c = useBillingConsent('portal')
  responses = [{ status: 200, body: T('x') }]
  await c.load()
  c.agreed.value = true
  responses = [{ status: 500, body: null }]
  await c.load()
  assert.equal(c.terms.value, null)
  assert.equal(c.agreed.value, false)
  assert.equal(c.ready.value, false)
})

await test('404 rollout compatibility kept: old backend → proceed, nothing to send', async () => {
  const c = useBillingConsent('start_pro')
  responses = [{ status: 404, body: null }]
  await c.load()
  assert.deepEqual(c.terms.value, { consentRequired: false, legacyBackend: true })
  assert.equal(c.ready.value, true)
  assert.equal(c.payload(), null)
})

await test('consentPayload stays strict: only boolean true for consent-required terms', () => {
  assert.equal(consentPayload(T('k'), 'true'), null)
  assert.equal(consentPayload(T('k'), false), null)
  assert.ok(consentPayload(T('k'), true))
})

console.log(`\n=== billing consent binding: ${passed} passed ===`)
