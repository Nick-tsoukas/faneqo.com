/**
 * Payments panel (Start Pro → payouts → verification → live) in the Support
 * section of Create and Edit Artist. The server decides; these check that each
 * server state reads correctly, that work is saved before any Stripe page opens,
 * and that the three payment options and today's live controls stay.
 *
 * Run: node scripts/test-payment-activation.mjs
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse, compileScript, compileTemplate } from '@vue/compiler-sfc'
import {
  activationView,
  billingReturnKind,
  billingReturnNotice,
  createPageEligibility,
  artistInitials,
  trialDaysLeft,
  keptTrialKey,
  DISCLOSURE_START,
  DISCLOSURE_RESTART,
} from '../utils/payments/paymentActivation.js'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8')
const editSrc = read('pages/editband/[id].vue')
const createSrc = read('pages/createband.vue')
const panelSrc = read('components/payments/PaymentsActivationPanel.vue')

let passed = 0
let failed = 0
function test(name, fn) {
  try {
    fn()
    passed += 1
    console.log(`  ✅ ${name}`)
  } catch (err) {
    failed += 1
    console.log(`  ❌ ${name}\n     ${err.message}`)
  }
}

const NOW = Date.parse('2026-11-09T12:00:00Z')
const el = (state, billing = {}, enforced = true) => ({ state, eligible: state === 'live', enforced, billing })
const view = (state, billing, opts = {}) => activationView(el(state, billing, opts.enforced ?? true), { now: NOW, ...opts })
// /stripe/billing's subscription at today's $12 price, in a given Stripe status.
const sub12 = (status) => ({ status, price: { unitAmount: 1200, currency: 'usd', interval: 'month', intervalCount: 1 } })

console.log('\nEvery server state reads distinctly')
test('no server answer keeps the editor’s previous UI (null)', () => {
  assert.equal(activationView(null), null)
  assert.equal(activationView({}), null)
})

test('trialing: the approved headline, days left, Start Pro and Keep my free trial', () => {
  const v = view('upgrade', { standing: 'trial', trialEndsAt: '2026-11-27T12:00:00Z' }, { subscription: sub12('trialing') })
  assert.equal(v.title, 'Ready to start earning?')
  assert.equal(v.body, 'Give fans more ways to support your music. Start Faneqo Pro to unlock payment setup for your artist page.')
  assert.equal(v.eyebrow, 'Faneqo Pro · 18 days left in your trial')
  assert.equal(v.primary, 'Start Pro — $12/month')
  assert.equal(v.secondary, 'Keep my free trial')
  assert.equal(v.disclosure, DISCLOSURE_START)
  assert.equal(v.step, 0)
  assert.equal(v.rowsLocked, true)
  assert.equal(v.badge, 'Locked')
})

test('trial ended, canceled, past due: no "days left", each with its own words', () => {
  const ended = view('trial_ended', { standing: 'trial_ended', trialEndsAt: '2026-11-01' })
  const canceled = view('canceled', { standing: 'canceled' }, { subscription: sub12('canceled') })
  const pastDue = view('past_due', { standing: 'past_due', graceEndsAt: '2026-11-11T00:00:00Z' })
  assert.equal(ended.eyebrow, 'Faneqo Pro · Your free trial has ended')
  assert.equal(canceled.eyebrow, 'Faneqo Pro · Membership ended')
  assert.equal(canceled.primary, 'Restart Pro — $12/month')
  assert.equal(pastDue.primary, 'Update payment')
  assert.match(pastDue.body, /Payments pause on November 11/)
  for (const v of [ended, canceled, pastDue]) {
    assert.ok(!/days left/.test(v.eyebrow), v.eyebrow)
    assert.equal(v.secondary, null, 'no "Keep my free trial" outside a trial')
  }
  assert.equal(ended.disclosure, DISCLOSURE_RESTART)
  assert.match(canceled.disclosure, /^Restarting Pro begins a new membership at the current price: \$12 today/)
  assert.equal(new Set([ended.title + ended.body, canceled.title + canceled.body, pastDue.title + pastDue.body]).size, 3)
})

test('past due after the grace period says payments are paused now', () => {
  const v = view('past_due', { standing: 'past_due', graceEndsAt: '2026-11-01T00:00:00Z' })
  assert.match(v.body, /payments are paused until it’s resolved/)
})

test('a trial with no date, or the last day, never shows a negative or "0 days"', () => {
  assert.equal(view('upgrade', { standing: 'trial' }).eyebrow, 'Faneqo Pro · Free trial')
  assert.equal(view('upgrade', { standing: 'trial', trialEndsAt: '2026-11-09T00:00:00Z' }).eyebrow, 'Faneqo Pro · Free trial')
  assert.equal(view('upgrade', { standing: 'trial', trialEndsAt: '2026-11-10T00:00:00Z' }).eyebrow, 'Faneqo Pro · 1 day left in your trial')
  assert.equal(trialDaysLeft('2026-10-01', NOW), 0)
})

test('payouts: Pro is active, and activation needs Stripe AND Faneqo checks', () => {
  const v = view('payout_setup', { standing: 'paid' })
  assert.equal(v.eyebrow, 'Faneqo Pro is active')
  assert.equal(v.eyebrowCheck, true)
  assert.equal(v.step, 1)
  assert.equal(v.primary, 'Set up payouts')
  assert.match(v.foot, /Faneqo team approves/)
  assert.equal(v.rowsLocked, false, 'paid artists can choose options before going live')
  assert.equal(v.badge, 'Not live yet')
})

test('verification distinguishes Stripe’s check from Faneqo’s security check', () => {
  const stripe = view('stripe_review', { standing: 'paid' })
  const faneqo = view('security_review', { standing: 'paid' })
  assert.equal(stripe.status, 'Stripe verification in progress')
  assert.equal(faneqo.status, 'Faneqo team review in progress')
  assert.notEqual(stripe.body, faneqo.body)
  for (const v of [stripe, faneqo]) {
    assert.equal(v.step, 2)
    assert.equal(v.badge, 'In review')
    assert.equal(v.quiet, 'Check status')
    assert.equal(v.primary, null, 'nothing to buy while verifying')
  }
})

test('Lifetime Pro: never offered a charge; its own first step and eyebrow', () => {
  const v = view('payout_setup', { standing: 'lifetime' })
  assert.equal(v.firstLabel, 'Lifetime Pro')
  assert.equal(v.eyebrow, 'Included with Lifetime Pro')
  assert.ok(!/\$12/.test(JSON.stringify(v)), 'no price anywhere')
  assert.equal(v.disclosure, null)
})

test('live: today’s controls and tiles stay; a dated exception offers Start Pro quietly', () => {
  const live = view('live', { standing: 'paid' })
  assert.equal(live.kind, 'live')
  assert.equal(live.showTiles, true)
  assert.equal(live.rowsLocked, false)
  assert.equal(live.primary, null)
  const excepted = view('live', { standing: 'exception', exceptionExpiresAt: '2026-12-15T00:00:00Z' }, { subscription: null })
  assert.match(excepted.liveNote, /until December 15/)
  assert.equal(excepted.primary, 'Start Pro — $12/month')
})

test('restricted and review: no offer, no rule names', () => {
  const unavailable = view('unavailable', {})
  const review = view('review', {})
  assert.equal(unavailable.kind, 'restricted')
  assert.equal(unavailable.primary, null)
  assert.equal(unavailable.hideRows, true)
  assert.equal(review.kind, 'restricted')
  for (const v of [unavailable, review]) assert.ok(!/block|suspend|fraud|reject/i.test(JSON.stringify(v)), JSON.stringify(v))
})

test('before enforcement, artists without Pro see no Pro step (today’s flow)', () => {
  const v = view('payout_setup', { standing: 'trial' }, { enforced: false })
  assert.equal(v.step, null)
  assert.equal(v.eyebrow, 'Payments')
})

// Contract with qrserver utils/payments/paymentEligibility.js: every state it can
// return. Keep in step with BILLING_STATE + payout_setup/stripe_review/
// security_review/live/review/unavailable there.
const SERVER_STATES = ['unavailable', 'review', 'upgrade', 'trial_ended', 'canceled', 'past_due', 'payout_setup', 'stripe_review', 'security_review', 'live']
test('every state the server can return has its own view (no silent fallback)', () => {
  const titles = new Set()
  for (const s of SERVER_STATES) {
    const v = view(s, { standing: 'paid' })
    assert.ok(v && v.title, s)
    if (s !== 'unavailable') assert.notEqual(v.title, view('unavailable', {}).title, `${s} must not fall back to "unavailable"`)
    titles.add(`${s}:${v.kind}:${v.title}:${v.status}`)
  }
  assert.equal(titles.size, SERVER_STATES.length)
})

test('manual approval: awaiting the Faneqo team is calm, promises no timing, and never says $12 activates payments', () => {
  const v = view('security_review', { standing: 'paid' })
  assert.equal(v.title, 'Your account is in review')
  assert.match(v.body, /You don’t need to do anything/)
  assert.ok(!/\b(hour|day|minute|instant|immediate)/i.test(v.body), v.body)
  for (const text of [DISCLOSURE_START, DISCLOSURE_RESTART]) assert.match(text, /paying for Pro does not activate them on its own/)
})

console.log('\nKeep my free trial (nondestructive)')
test('it collapses the panel for this visit and changes nothing in billing', () => {
  const v = view('upgrade', { standing: 'trial', trialEndsAt: '2026-11-27T12:00:00Z' }, { keptTrial: true })
  assert.equal(v.kind, 'collapsed')
  assert.equal(v.body, '18 days left in your free trial')
  assert.equal(v.primaryAction, 'start_pro')
  assert.equal(keptTrialKey(42), 'fq-keep-trial-42')
  const action = editSrc.slice(editSrc.indexOf('if (action === "keep_trial")'), editSrc.indexOf('if (action === "check_status")'))
  assert.ok(action.includes('sessionStorage.setItem(keptTrialKey'), 'remembered for this browser session only')
  assert.ok(!/fetch\(|startProUrl|submitForm/.test(action), 'no server call, no save, no billing change')
})

console.log('\nReturning from Stripe')
test('notices for paid, bank approval, declined, canceled', () => {
  assert.equal(billingReturnNotice({ outcome: 'paid' }).tone, 'success')
  const approve = billingReturnNotice({ outcome: 'requires_action', invoiceUrl: 'https://inv' })
  assert.equal(approve.url, 'https://inv')
  assert.match(approve.text, /free trial continues/)
  assert.match(billingReturnNotice({ outcome: 'declined' }).text, /nothing was charged/)
  assert.match(billingReturnNotice({ outcome: 'canceled' }).text, /no charge was made/)
  assert.equal(billingReturnNotice({ outcome: 'unknown' }), null)
  assert.equal(billingReturnKind({ billing: 'return' }), 'return')
  assert.equal(billingReturnKind({ billing: ['canceled'] }), 'canceled')
  assert.equal(billingReturnKind({ billing: 'paid' }), null, 'only known values')
})

test('the editor verifies the return with the server, never trusting the URL', () => {
  const mount = editSrc.slice(editSrc.indexOf('onMounted(async () => {'), editSrc.indexOf('// Handlers'))
  assert.ok(mount.includes('await confirmReturn(route.query.session_id)'))
  assert.ok(mount.includes('await loadEligibility()'))
  assert.ok(/router\.replace\(\{ path: route\.path, hash: "#setup-support" \}\)/.test(mount), 'drops ?billing= after reading it')
})

console.log('\nSave first, then Stripe')
test('Edit: Start Pro saves the artist first, then opens checkout for that band', () => {
  const submit = editSrc.slice(editSrc.indexOf('async function submitForm()'))
  const take = submit.indexOf('const thenStartPro = proAfterSave.value;')
  const open = submit.indexOf('const url = await startProUrl(id, pendingConsent.value);')
  const save = submit.indexOf('Saved on the way to Start Pro')
  assert.ok(take > 0 && save > take && open > save, 'flag read at the start, checkout only after the save succeeded')
  assert.ok(submit.includes('Your changes are saved.'), 'a failed checkout still reports the save')
  assert.ok(/function saveThenStartPro\(\) \{[\s\S]*?proAfterSave\.value = true;[\s\S]*?submitForm\(\);/.test(editSrc))
})

test('Create: Start Pro creates the band once, then checkout; cancel returns to its editor', () => {
  const submit = createSrc.slice(createSrc.indexOf('async function submitForm()'))
  const created = submit.indexOf('const newBandId = json.data?.id;')
  const pro = submit.indexOf('if (startProAfterCreate.value && newBandId)')
  assert.ok(created > 0 && pro > created, 'checkout only after the band exists')
  assert.ok(createSrc.includes('createdBandEditor.value = `/editband/${bandId}?billing=canceled`'), 'Back lands on the saved band, not this form')
  assert.ok(createSrc.includes('window.location.assign(`/editband/${bandId}?billing=error`)'), 'a failed checkout still keeps the band')
  assert.ok(/watch\(loading, \(on\) => \{[\s\S]*?startProAfterCreate\.value = false;/.test(createSrc), 'a validation stop cancels the queued checkout')
})

test('the server, not the page, decides: create shows the panel only when enforced', () => {
  assert.equal(createPageEligibility({ subscriptionStatus: 'trialing' }, { enforced: false }), null)
  assert.equal(createPageEligibility({ subscriptionStatus: 'trialing' }, { enforced: true }).state, 'upgrade')
  assert.equal(createPageEligibility({ plan: 'free' }, { enforced: true }).state, 'payout_setup')
  assert.equal(createPageEligibility({ subscriptionStatus: 'active', firstPaidAt: '2026-11-01' }, { enforced: true }).billing.standing, 'paid')
  assert.equal(createPageEligibility({ subscriptionStatus: 'canceled' }, { enforced: true }).state, 'trial_ended')
})

console.log('\nLocked options and the one action that unlocks them')
test('Edit and Create: a locked option cannot be switched ON; the click points at Start Pro', () => {
  for (const [label, src] of [['edit', editSrc], ['create', createSrc]]) {
    const guard = src.slice(src.indexOf('function guardLockedToggle(event, btn) {'), src.indexOf('function guardLockedToggle(event, btn) {') + 400)
    assert.ok(guard.includes('if (!paymentsLocked.value || btn.enabled) return;'), `${label}: switching off is always allowed`)
    assert.ok(guard.includes('event.preventDefault();'), `${label}: the click is cancelled, so the choice never flips`)
    assert.ok(guard.includes('activationPanel.value?.focusPrimary()'), `${label}: focus moves to the unlock action`)
    assert.ok(src.includes('@click="guardLockedToggle($event, btn)"'), `${label}: wired on the toggle`)
    const toggle = src.slice(src.indexOf('function onPaymentToggle(btn) {'), src.indexOf('function onPaymentToggle(btn) {') + 600)
    assert.doesNotMatch(toggle, /btn\.enabled\s*=/, `${label}: the artist’s choice is never rewritten`)
  }
})

test('all three payment options stay in Edit and Create, with Edit’s pricing controls', () => {
  for (const key of ['pay_entry', 'support_band', 'merch_table']) {
    assert.ok(editSrc.includes(`key: "${key}"`), `edit ${key}`)
    assert.ok(createSrc.includes(`key: "${key}"`), `create ${key}`)
  }
  assert.ok(editSrc.includes('v-for="btn in paymentButtons"'))
  assert.ok(editSrc.includes('v-model="btn.pricingMode"') && editSrc.includes('v-model.number="btn.minAmount"'))
  assert.ok(createSrc.includes('v-for="btn in paymentButtons"'))
})

test('live keeps the Payouts tiles; the old UI renders unchanged without a server answer', () => {
  assert.ok(editSrc.includes('<div v-if="!activation || activation.showTiles" class="setup-divider">'))
  assert.ok(/v-if="activation"[\s\S]*?class="payout-manage w-full"[\s\S]*?Manage payouts/.test(editSrc))
  assert.ok(/<PaymentsActivationPanel\s+v-if="activation"[\s\S]*?<div\s+v-else\s+class="payout-status mb-5"/.test(editSrc), 'status card is the fallback')
})

console.log('\nThe panel itself')
test('it previews the real artist name and photo, with initials as the fallback', () => {
  assert.ok(editSrc.includes(':artist-name="bandName"') && editSrc.includes(':artist-image="bandImgFullUrl"'))
  assert.ok(createSrc.includes(':artist-name="bandName"') && createSrc.includes(':artist-image="bandImgUrl"'))
  assert.ok(panelSrc.includes('@error="imageFailed = true"'), 'a broken photo falls back to initials')
  assert.equal(artistInitials('Juniper Hollow'), 'JH')
  assert.equal(artistInitials('Emerge'), 'EM')
  assert.equal(artistInitials(''), '♪')
})

test('Design North Star: near-white primary, no gradient buttons, reduced motion honoured', () => {
  const css = panelSrc.slice(panelSrc.indexOf('<style scoped>'))
  assert.match(css, /\.fq-act__primary \{ border: 0; background: #F5F5F6; color: #07080A; \}/)
  assert.ok(!/\.fq-act__primary[^{]*\{[^}]*gradient/.test(css), 'primary is never a gradient')
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/)
  assert.match(css, /@container \(max-width: 560px\)/, 'the card width decides the phone layout')
  assert.ok(/aria-busy|:disabled="!!busy"/.test(panelSrc), 'busy state blocks double submits')
  assert.ok(panelSrc.includes('role="status"') && panelSrc.includes('role="alert"'))
})

test('the three Vue files compile', () => {
  for (const rel of ['components/payments/PaymentsActivationPanel.vue', 'pages/editband/[id].vue', 'pages/createband.vue']) {
    const { descriptor, errors } = parse(read(rel), { filename: rel })
    assert.deepEqual(errors, [], rel)
    compileScript(descriptor, { id: rel, filename: rel })
    const t = compileTemplate({ source: descriptor.template.content, filename: rel, id: rel })
    assert.deepEqual(t.errors, [], `${rel} template`)
  }
})

console.log(`\n=== payment activation: ${passed} passed, ${failed} failed ===`)
if (failed) process.exit(1)
