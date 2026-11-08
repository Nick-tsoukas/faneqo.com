/**
 * Band editor payout guidance: an artist who switched payment options on
 * before payouts were ready is told why fans can't see them and gets one
 * button to fix it. Their choices are kept.
 * Run: node scripts/test-payment-setup-status.mjs
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse, compileScript, compileTemplate } from '@vue/compiler-sfc'
import { paymentSetupStatus, payoutReturnNotice, stageFromFlags } from '../utils/payments/paymentSetupStatus.js'
import { payoutReturnKind } from '../composables/usePayoutSetup.js'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8')

let passed = 0
function test(name, fn) {
  fn()
  passed += 1
  console.log(`  ok  ${name}`)
}

test('live payments: no action, says how many options fans see', () => {
  const s = paymentSetupStatus({ stripeAccountId: 'acct_1', stripeOnboardingComplete: true, paymentsEnabled: true, enabledOptionCount: 3 })
  assert.equal(s.state, 'live')
  assert.equal(s.tone, 'ready')
  assert.equal(s.action, null)
  assert.match(s.body, /3 payment options show on your artist page/)
  assert.match(paymentSetupStatus({ paymentsEnabled: true, enabledOptionCount: 1 }).body, /1 payment option shows/)
})

test('never connected with options on (the Emerge case): explains and offers setup', () => {
  const s = paymentSetupStatus({ stripeAccountId: null, stripeOnboardingComplete: false, paymentsEnabled: false, enabledOptionCount: 3 })
  assert.equal(s.state, 'not_started')
  assert.equal(s.action, 'Set up payouts')
  assert.equal(s.title, "Fans can't see your payment options yet")
  assert.match(s.body, /Your 3 payment options are saved/)
})

test('never connected, nothing switched on: a plain invitation', () => {
  const s = paymentSetupStatus({ enabledOptionCount: 0 })
  assert.equal(s.state, 'not_started')
  assert.equal(s.title, 'Set up payouts to accept support')
  assert.doesNotMatch(s.body, /saved/)
})

test('connected but onboarding unfinished: continue setup', () => {
  const s = paymentSetupStatus({ stripeAccountId: 'acct_1', stripeOnboardingComplete: false, paymentsEnabled: false, enabledOptionCount: 1 })
  assert.equal(s.state, 'in_progress')
  assert.equal(s.action, 'Continue payout setup')
  assert.match(s.body, /Your 1 payment option is saved/)
})

test('onboarded but payments off (Stripe review or a pause): check setup, no accusation', () => {
  const s = paymentSetupStatus({ stripeAccountId: 'acct_1', stripeOnboardingComplete: true, paymentsEnabled: false, enabledOptionCount: 2 })
  assert.equal(s.state, 'paused')
  assert.equal(s.action, 'Check payout setup')
  assert.doesNotMatch(JSON.stringify(s), /fraud|suspend|block/i)
})

test('copy never states a price or fee', () => {
  for (const args of [{}, { paymentsEnabled: true, enabledOptionCount: 2 }, { stripeAccountId: 'a' }, { stripeAccountId: 'a', stripeOnboardingComplete: true }]) {
    assert.doesNotMatch(JSON.stringify(paymentSetupStatus(args)), /\$\d|%/)
  }
})

test('server stage wins over stored flags: review is shown, never "live" by mistake', () => {
  const stored = { stripeAccountId: 'acct_1', stripeOnboardingComplete: true, paymentsEnabled: false, enabledOptionCount: 2 }
  assert.equal(paymentSetupStatus(stored).state, 'paused')
  const review = paymentSetupStatus({ ...stored, stage: 'review' })
  assert.equal(review.state, 'review')
  assert.equal(review.title, 'Stripe is reviewing your details')
  assert.match(review.body, /Your 2 payment options are saved/)
  assert.equal(paymentSetupStatus({ ...stored, paymentsEnabled: true, stage: 'in_progress' }).state, 'in_progress')
  assert.equal(paymentSetupStatus({ ...stored, stage: 'nonsense' }).state, 'paused', 'unknown stage falls back to flags')
  assert.equal(stageFromFlags({ paymentsEnabled: true }), 'live')
  assert.equal(stageFromFlags({}), 'not_started')
})

test('Stripe unreachable: the return never claims ready (or any fresh result)', () => {
  const n = payoutReturnNotice('live', { bandName: 'Emerge', verified: false })
  assert.notEqual(n.title, 'Your payments are ready!')
  assert.equal(n.tone, 'action')
  assert.equal(n.action, null)
  assert.match(n.title, /couldn't confirm/)
  // An expired link still offers to continue; that claims nothing about payments.
  assert.equal(payoutReturnNotice('live', { verified: false, expired: true }).action, 'setup')

  const dash = read('pages/dashboard/index.vue')
  assert.match(dash, /verified: status\?\.checkedWithStripe === true \|\| status\?\.stage === "not_started"/)
  const edit = read('pages/editband/[id].vue')
  assert.match(edit, /payoutVerified\.value = status\.checkedWithStripe === true \|\| status\.stage === "not_started";/)
  const card = edit.slice(edit.indexOf('const statusCard = computed'), edit.indexOf('const { openPayoutSetup'))
  assert.ok(card.indexOf('!payoutVerified.value') < card.indexOf('"Your payments are ready!"'), 'unverified check comes before the ready greeting')
})

test('return-from-Stripe message for each stage', () => {
  const live = payoutReturnNotice('live', { bandName: 'Emerge' })
  assert.equal(live.title, 'Your payments are ready!')
  assert.equal(live.action, 'options')
  assert.match(live.body, /^Emerge: /)
  assert.equal(payoutReturnNotice('review').action, null, 'nothing to do while Stripe reviews')
  assert.equal(payoutReturnNotice('paused').action, 'setup')
  assert.equal(payoutReturnNotice('in_progress').action, 'setup')
  assert.equal(payoutReturnNotice('in_progress', { expired: true }).title, 'Your setup link expired')
  for (const s of ['review', 'paused', 'in_progress', 'not_started']) {
    assert.notEqual(payoutReturnNotice(s).title, 'Your payments are ready!', `${s} never claims ready`)
    assert.doesNotMatch(JSON.stringify(payoutReturnNotice(s)), /fraud|suspend|block|\$\d|%/i)
  }
})

test('only known ?payouts= values are read', () => {
  assert.equal(payoutReturnKind({ payouts: 'return' }), 'return')
  assert.equal(payoutReturnKind({ payouts: ['refresh'] }), 'refresh')
  assert.equal(payoutReturnKind({ payouts: 'error' }), 'error')
  assert.equal(payoutReturnKind({ payouts: '<script>' }), null)
  assert.equal(payoutReturnKind({}), null)
})

test('one onboarding path: the composable posts where Stripe should return', () => {
  const src = read('composables/usePayoutSetup.js')
  assert.match(src, /\/payments\/onboard`/)
  assert.match(src, /body: JSON\.stringify\(\{ from \}\)/)
  assert.match(src, /\/payments\/status`/)
  for (const rel of ['pages/editband/[id].vue', 'pages/createband.vue', 'pages/dashboard/index.vue']) {
    assert.doesNotMatch(read(rel), /\/payments\/onboard`/, `${rel} goes through usePayoutSetup`)
  }
})

function sfc(rel) {
  const source = read(rel)
  const { descriptor, errors } = parse(source, { filename: rel })
  assert.deepEqual(errors, [])
  const script = compileScript(descriptor, { id: rel, filename: rel }).content
  const t = compileTemplate({ source: descriptor.template.content, filename: rel, id: rel })
  assert.deepEqual(t.errors, [])
  return { script, tpl: descriptor.template.content }
}

test('band editor: status above options, prompt on toggle, save before Stripe, return handled', () => {
  const { script, tpl } = sfc('pages/editband/[id].vue')
  assert.match(script, /setupStatus = computed\(\(\) =>\s*paymentSetupStatus\(/)
  assert.match(script, /stage: payoutStage\.value/)
  const status = tpl.indexOf('data-testid="payout-setup-status"')
  const options = tpl.indexOf('v-for="btn in paymentButtons"')
  assert.ok(status > 0 && status < options, 'status sits above the payment options')
  assert.match(tpl, /@click="saveThenSetUpPayouts"[\s\S]{0,80}statusCard\.action/)
  assert.match(tpl, /v-model="btn\.enabled"[\s\S]{0,200}@change="onPaymentToggle\(btn\)"/)
  assert.match(tpl, /<PayoutSetupPrompt[\s\S]{0,120}@setup="saveThenSetUpPayouts"[\s\S]{0,60}@dismiss="declinePayoutPrompt"/)
  // Toggling only asks; it never changes the artist's choice.
  const toggle = script.slice(script.indexOf('function onPaymentToggle'), script.indexOf('function declinePayoutPrompt'))
  assert.doesNotMatch(toggle, /btn\.enabled\s*=/)
  assert.match(toggle, /state === "live"\) return/)
  // Saved first, then Stripe; a failure keeps them here with a message.
  const submit = script.slice(script.indexOf('async function submitForm'))
  assert.match(submit, /const thenSetUpPayouts = payoutAfterSave\.value;/)
  const hop = submit.slice(submit.indexOf('if (thenSetUpPayouts)'), submit.indexOf('get the current slug'))
  assert.ok(submit.indexOf('if (thenSetUpPayouts)') > submit.indexOf('if (!put.ok) throw pj'), 'Stripe only after a successful save')
  assert.match(hop, /openPayoutSetup\(id, "editband"\)/)
  assert.match(hop, /payoutError\.value = `Your changes are saved\./)
  assert.doesNotMatch(hop, /alert\(/)
  // Return: refresh status from the server, then drop ?payouts= so reloads are quiet.
  const mount = script.slice(script.indexOf('payoutReturn.value = payoutReturnKind(route.query)'))
  assert.match(mount, /await refreshPayoutStatus\(\)/)
  assert.match(mount, /router\.replace\(\{ path: route\.path, hash: "#setup-support" \}\)/)
})

test('create band: setup waits for the band to exist, then opens Stripe for that band', () => {
  const { script, tpl } = sfc('pages/createband.vue')
  const note = tpl.indexOf('data-testid="create-payout-note"')
  assert.ok(note > 0 && note < tpl.indexOf('v-for="btn in paymentButtons"'), 'note sits above the options')
  assert.match(tpl, /@change="onPaymentToggle\(btn\)"/)
  assert.match(tpl, /<PayoutSetupPrompt[\s\S]{0,60}mode="create"/)
  assert.match(tpl, /Payment buttons won't appear on your artist page until payouts are set up/)
  const choose = script.slice(script.indexOf('function choosePayoutSetup'), script.indexOf('function declinePayoutPrompt'))
  assert.doesNotMatch(choose, /openPayoutSetup|fetch\(/, 'choosing setup only queues it')
  const submit = script.slice(script.indexOf('async function submitForm'))
  const created = submit.indexOf('if (!res.ok) throw json')
  const hop = submit.indexOf('openPayoutSetupForNewBand(newBandId)')
  assert.ok(created > 0 && hop > created, 'Stripe opens only after the band is created')
  const helper = script.slice(script.indexOf('async function openPayoutSetupForNewBand'))
  assert.match(helper, /history\.replaceState\([\s\S]{0,80}createdBandEditor\.value\)/, 'Back from Stripe never reopens this form')
  assert.match(helper, /openPayoutSetup\(bandId, "editband"\)/)
  assert.match(helper, /\/editband\/\$\{bandId\}\?payouts=error/)
})

test('dashboard: return shows the right band, refreshed from the server, with no alert()', () => {
  const { script, tpl } = sfc('pages/dashboard/index.vue')
  assert.match(tpl, /<PayoutReturnNotice[\s\S]{0,200}@action="onPayoutNoticeAction"/)
  const start = script.slice(script.indexOf('async function startPayoutOnboarding'), script.indexOf('async function handlePayoutReturn'))
  assert.match(start, /openPayoutSetup\(bandId, "dashboard"\)/)
  assert.doesNotMatch(start, /alert\(/)
  const ret = script.slice(script.indexOf('async function handlePayoutReturn'), script.indexOf('function onPayoutNoticeAction'))
  assert.match(ret, /fetchPayoutStatus\(bandId\)/)
  assert.match(ret, /bandItems\.value\.find/, 'only a band this user can access')
  assert.match(ret, /router\.replace/)
  const act = script.slice(script.indexOf('function onPayoutNoticeAction'), script.indexOf('function dismissPayoutNotice'))
  assert.match(act, /\/editband\/\$\{bandId\}#setup-support/)
})

test('prompt dialog is accessible and keeps the requested wording', () => {
  const { tpl } = sfc('components/payments/PayoutSetupPrompt.vue')
  assert.match(tpl, /role="dialog"/)
  assert.match(tpl, /aria-modal="true"/)
  assert.match(tpl, /aria-labelledby="payout-prompt-title"/)
  assert.match(tpl, /@keydown\.esc\.prevent="emit\('dismiss'\)"/)
  assert.match(tpl, />Ready to accept payments\?</)
  assert.match(tpl, /Set up secure payouts with Stripe to activate this payment option\./)
  assert.match(tpl, /Set Up Payouts/)
  assert.match(tpl, /Not Now/)
})

console.log(`\n${passed} passed`)
