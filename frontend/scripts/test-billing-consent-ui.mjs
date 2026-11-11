/**
 * Billing A+B (frontend): every action that can authorize recurring charges
 * shows the SERVER's terms with an unticked box, stays disabled until it is
 * ticked, and sends exactly the consent contract the backend checks
 * (qrserver utils/billing/billingConsent.js: { accepted: true, version, termsKey };
 * refusals error.details.code consent_required | terms_changed with details.terms).
 * Run: node scripts/test-billing-consent-ui.mjs
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse, compileScript, compileTemplate } from '@vue/compiler-sfc'
import { consentPayload, consentErrorOf } from '../composables/useBillingConsent.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8')
const tpl = (src) => src.slice(0, src.lastIndexOf('</template>'))
let passed = 0
function test(name, fn) {
  fn()
  passed += 1
  console.log(`  ok  ${name}`)
}

const TERMS = { action: 'end_trial', consentRequired: true, version: 'faneqo-pro-billing-v1-2026-11-11', termsKey: 'abc123def456abc123def456', summary: 'Starting Pro ends the rest of your free trial and charges $12 today, then $12/month until you cancel.' }

test('consent payload: only when the server asked and the box is ticked; exact backend contract', () => {
  assert.deepEqual(consentPayload(TERMS, true), { accepted: true, version: TERMS.version, termsKey: TERMS.termsKey })
  assert.equal(consentPayload(TERMS, false), null, 'unticked → nothing sent (server answers 400)')
  assert.equal(consentPayload(TERMS, 'true'), null, 'only boolean true')
  assert.equal(consentPayload({ consentRequired: false }, true), null, 'no consent needed → none sent')
  assert.equal(consentPayload(null, true), null)
})

test('server refusals are recognized (400 consent_required, 409 terms_changed) and carry the new terms', () => {
  const r = consentErrorOf({ error: { status: 409, details: { code: 'terms_changed', terms: { ...TERMS, termsKey: 'new' } } } })
  assert.equal(r.code, 'terms_changed')
  assert.equal(r.terms.termsKey, 'new')
  assert.equal(consentErrorOf({ error: { status: 400, details: { code: 'consent_required', terms: TERMS } } }).code, 'consent_required')
  assert.equal(consentErrorOf({ error: { status: 409, details: { code: 'already_active' } } }), null, 'other 409s are not consent')
  assert.equal(consentErrorOf(null), null)
  // useStrapiClient throws the response body itself; a raw FetchError wraps it in .data. Both are recognized.
  assert.equal(consentErrorOf({ data: { error: { details: { code: 'terms_changed', terms: TERMS } } } }).code, 'terms_changed')
  assert.match(read('pages/account.vue'), /portalConsent\.handleRefusal\(e\)/)
  assert.match(read('components/PastDueBanner.vue'), /consent\.handleRefusal\(err\)/)
})

test('composable: terms come from the server endpoints; a refusal unticks and shows the server terms; 404 = backend not yet deployed', () => {
  const src = read('composables/useBillingConsent.js')
  assert.match(src, /\/stripe\/billing-portal\/terms/)
  assert.match(src, /\/stripe\/start-pro\/terms/)
  assert.match(src, /const agreedFor = ref\(null\)/, 'starts unticked')
  assert.match(src, /get: \(\) => agreedFor\.value !== null && agreedFor\.value === termsIdentity\(terms\.value\)/, 'bound to the exact terms')
  assert.match(src, /if \(refusal\.terms\) terms\.value = refusal\.terms\s*\n\s*agreedFor\.value = null/)
  assert.match(src, /if \(res\.status === 404\) \{\s*terms\.value = \{ consentRequired: false, legacyBackend: true \}/)
  assert.match(src, /terms\.value = res\.ok && json && typeof json\.consentRequired === 'boolean' \? json : null/, 'any other failure → no terms → action disabled')
  const payloadFn = src.slice(src.indexOf('export function consentPayload'), src.indexOf('export function consentErrorOf'))
  assert.match(payloadFn, /return { accepted: true, version: terms.version, termsKey: terms.termsKey }/)
  assert.doesNotMatch(payloadFn, /price|amount/i, 'the client never supplies a price')
})

test('consent component: the server summary, an UNCHECKED native checkbox, accessible, 44px target', () => {
  const src = read('components/billing/BillingConsent.vue')
  const t = tpl(src)
  assert.match(t, /\{\{ terms\.summary \}\}/)
  assert.match(t, /type="checkbox"\s*\n\s*:checked="modelValue"/)
  assert.doesNotMatch(t, /\schecked(?!=)|checked="true"/, 'never pre-checked')
  assert.match(src, /modelValue: \{ type: Boolean, default: false \}/)
  assert.match(t, /:aria-describedby="termsId"/)
  assert.match(src, /min-height: 44px/)
})

test('payments panel: charging buttons disabled until terms load and the box is ticked; consent travels with the action', () => {
  const src = read('components/payments/PaymentsActivationPanel.vue')
  const t = tpl(src)
  assert.equal((t.match(/:disabled="!!busy \|\| chargeBlocked"/g) || []).length, 3, 'collapsed, live and full layouts')
  assert.equal((t.match(/<BillingConsent v-if="showConsent" v-model="agreed"/g) || []).length, 3)
  assert.match(src, /const chargeBlocked = computed\(\(\) => isCharging\.value && \(!props\.consentTerms \|\| \(props\.consentTerms\.consentRequired && !agreed\.value\)\)\)/)
  assert.match(src, /emit\('action', name, \{ consent: consentPayload\(props\.consentTerms, agreed\.value\) \}\)/)
  assert.match(src, /if \(chargeBlocked\.value\) return/)
  assert.match(src, /get: \(\) => agreedFor\.value !== null && agreedFor\.value === termsIdentity\(props\.consentTerms\)/, 'new terms read as unticked')
  assert.match(src, /watch\(\(\) => termsIdentity\(props\.consentTerms\), \(\) => \{ agreedFor\.value = null \}\)/)
  assert.match(src, /const agreedFor = ref\(null\)/)
})

test('editor and Create Artist load the server terms with the price and send the consent to Start Pro', () => {
  const edit = read('pages/editband/[id].vue')
  assert.match(edit, /Promise\.all\(\[fetchBillingSubscription\(\), startProConsent\.load\(\{ bandId: route\.params\.id \}\)\]\)/)
  assert.match(edit, /:consent-terms="startProConsent\.terms\.value"/)
  assert.match(edit, /pendingConsent\.value = extra\?\.consent \|\| null/)
  assert.match(edit, /await startProUrl\(id, pendingConsent\.value\)/)
  assert.match(edit, /startProConsent\.handleRefusal\(e\.consentRefusal\)/)
  const create = read('pages/createband.vue')
  assert.match(create, /:consent-terms="startProConsent\.terms\.value"/)
  assert.match(create, /await startProUrl\(bandId, pendingConsent\.value\)/)
  assert.ok(create.indexOf('const startProConsent = useBillingConsent') < create.indexOf('// Read the price only when the panel can show a paying button'), 'declared before the immediate watcher')
  const comp = read('composables/usePaymentActivation.js')
  assert.match(comp, /body: JSON\.stringify\(\{ bandId: bandId \|\| null, consent: consent \|\| undefined \}\)/)
  assert.ok(comp.indexOf('const refusal = consentErrorOf(json)') < comp.indexOf('if (res.status === 409) {'), 'consent refusals handled before other 409s')
})

test('billing portal callers: trial banner, past-due banner and Account all gate on the server terms', () => {
  const trial = read('components/TrialBanner.vue')
  assert.match(trial, /useBillingConsent\('portal'\)/)
  assert.match(trial, /:disabled="disabled \|\| !consent\.ready\.value"/)
  assert.match(trial, /emit\('add-payment', \{ consent: consent\.payload\(\) \}\)/)
  const dash = read('pages/dashboard/index.vue')
  assert.match(dash, /body: payload\?\.consent \? \{ consent: payload\.consent \} : \{\}/)
  assert.match(dash, /trialBannerRef\.value\?\.handleRefusal\?\.\(err\)/, 'useStrapiClient throws the body itself')
  const pastDue = read('components/PastDueBanner.vue')
  assert.match(pastDue, /useBillingConsent\('portal'\)/)
  assert.match(pastDue, /:disabled="opening \|\| !consent\.ready\.value"/)
  assert.match(pastDue, /body: payload \? \{ consent: payload \} : \{\}/)
  const account = read('pages/account.vue')
  assert.match(account, /const portalConsent = useBillingConsent\('portal'\)/)
  assert.match(account, /:disabled="!portalConsent\.ready\.value"/)
  assert.match(account, /body: intent === 'cancel' \? \{ intent \} : consent \? \{ consent \} : \{\}/)
  assert.match(account, /v-if="portalConsent\.needsConsent\.value && portalConsent\.terms\.value\?\.canCancel"/, 'cancel stays one click, no consent')
  assert.match(account, /isAmbassador\.value \? null : portalConsent\.load\(\)/, 'Lifetime Pro never loads billing terms')
  // Cancel is done by the server (no portal, so no card form), after one confirmation.
  assert.match(account, /if \(res\?\.canceled\) \{/)
  assert.match(account, /window\.confirm\('Cancel Faneqo Pro\?/)
  assert.match(account, /data-testid="account-cancel-done"/)
  // cancel_at_period_end stops renewal; it doesn't forgive a balance already due. Say exactly that.
  const cancelCopy = account.slice(account.indexOf('async function goToBillingPortal'), account.indexOf('</script>'))
  assert.doesNotMatch(cancelCopy, /won’t be charged again|won't be charged again|never be charged/)
  assert.match(cancelCopy, /won’t renew after that\. Any balance that’s already due may still be collected\./, 'confirmation')
  assert.match(cancelCopy, /Your membership won’t renew\. Pro stays on until the end of your current trial or billing period\. Any balance that’s already due may still be collected\./, 'success message')
  // Still easy and still server-side: one confirm, no portal URL for cancel.
  assert.match(cancelCopy, /body: intent === 'cancel' \? \{ intent \}/)
})

test('protected states: Lifetime Pro sees no consent; C3 copy stays where no consent is needed; no client price', () => {
  const account = read('pages/account.vue')
  assert.match(tpl(account), /<div v-if="!isAmbassador" class="mt-8">/)
  assert.match(tpl(account), /v-else-if="billingTerms\.length"/, 'C3 terms when the portal can’t charge')
  const trial = tpl(read('components/TrialBanner.vue'))
  assert.match(trial, /v-if="!consent\.needsConsent\.value"[^>]*data-testid="trial-banner-terms"/)
  for (const f of ['components/TrialBanner.vue', 'components/PastDueBanner.vue', 'pages/account.vue', 'components/payments/PaymentsActivationPanel.vue']) {
    assert.doesNotMatch(read(f), /consent:\s*\{[^}]*(price|amount)/i, `${f} never sends a price`)
  }
})

test('touched components compile', () => {
  for (const f of ['components/billing/BillingConsent.vue', 'components/TrialBanner.vue', 'components/PastDueBanner.vue', 'components/payments/PaymentsActivationPanel.vue']) {
    const src = read(f)
    const { descriptor, errors } = parse(src, { filename: f })
    assert.equal(errors.length, 0, f)
    compileScript(descriptor, { id: f })
    const out = compileTemplate({ source: descriptor.template.content, filename: f, id: f })
    assert.equal(out.errors.length, 0, `${f}: ${out.errors.join('; ')}`)
  }
})

console.log(`\n=== billing consent UI: ${passed} passed ===`)
