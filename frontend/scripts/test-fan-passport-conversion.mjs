/**
 * Fan Passport conversion: consent split, message resume, invite gating.
 * Run: node scripts/test-fan-passport-conversion.mjs
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { artistMessageReturnTo, hasMessageIntent, stripMessageIntentQuery, writeMessageDraft, readMessageDraft } from '../utils/fan/messageIntent.js'
import { sanitizeFanReturnTo } from '../utils/fan/safeFanReturnTo.js'
import { passportSource } from '../utils/fan/passportAnalytics.js'
import { FAN_ACCOUNT_PROMPTS_ENABLED, FAN_PASSPORT_INVITES_ENABLED } from '../config/fanAccountFeatureFlags.js'

const here = dirname(fileURLToPath(import.meta.url))
const read = (rel) => readFileSync(resolve(here, '..', rel), 'utf8')

const conversion = read('composables/useFanAccountConversion.js')
const message = read('composables/useFanMessageRequest.js')
const follow = read('composables/useArtistPageFollow.js')
const sheet = read('components/band/FollowArtistSheet.vue')
const join = read('utils/fan/joinArtistFanList.js')
const prompt = read('components/fan/FanAccountPrompt.vue')
const flags = read('config/fanAccountFeatureFlags.js')

let passed = 0
function test(name, fn) {
  fn()
  passed += 1
  console.log(`  ok  ${name}`)
}

console.log('\n=== Fan Passport conversion ===\n')

test('ambient prompts stay off; contextual invites have their own switch', () => {
  assert.equal(FAN_ACCOUNT_PROMPTS_ENABLED, false)
  assert.equal(FAN_PASSPORT_INVITES_ENABLED, true)
  assert.match(flags, /isFanPassportInvitesEnabled/)
  assert.match(conversion, /if \(!isFanPassportInvitesEnabled\(\)\) return false/)
  assert.match(conversion, /trigger: 'fan_list_join'/)
  assert.match(conversion, /trigger: 'follow_saved'/)
  assert.match(conversion, /trigger: 'gallery'/)
})

test('follow by email does not grant marketing consent', () => {
  assert.match(sheet, /marketingConsent: false/)
  assert.match(join, /marketingConsent === false/)
  assert.match(join, /subscribed/)
  assert.match(sheet, /does not join their email list/)
})

test('message intent survives magic-link return without the draft in the URL', () => {
  assert.equal(artistMessageReturnTo('the-rockers'), '/the-rockers?feq_intent=message')
  assert.equal(sanitizeFanReturnTo('/the-rockers?feq_intent=message'), '/the-rockers?feq_intent=message')
  assert.equal(hasMessageIntent({ feq_intent: 'message' }), true)
  assert.equal(hasMessageIntent({ feq_intent: 'follow' }), false)
  assert.deepEqual(stripMessageIntentQuery({ feq_intent: 'message', from: 'ig' }), { from: 'ig' })
  assert.match(message, /artistMessageReturnTo/)
  assert.match(message, /consumeMessageIntent/)
  assert.doesNotMatch(read('utils/fan/messageIntent.js'), /bodyText=/)
  assert.match(read('components/band/FanMessageRequestSheet.vue'), /writeMessageDraft/)
  assert.match(read('pages/[bandSlug]/index.vue'), /consumeMessageIntent/)
})

test('draft stays in session storage and is not a URL', () => {
  const store = new Map()
  globalThis.sessionStorage = {
    setItem(key, value) { store.set(key, value) },
    getItem(key) { return store.has(key) ? store.get(key) : null },
    removeItem(key) { store.delete(key) },
  }
  writeMessageDraft(9, { bodyText: 'see you at the show', firstName: 'Ada' })
  assert.deepEqual(readMessageDraft(9), {
    bodyText: 'see you at the show',
    firstName: 'Ada',
    lastName: '',
  })
  assert.equal([...store.values()].some((value) => String(value).includes('http')), false)
})

test('sources and resume events stay free of message text', () => {
  assert.equal(passportSource('fan_list_join'), 'fanlist')
  assert.equal(passportSource('follow_saved'), 'follow')
  assert.equal(passportSource('message_click'), 'message')
  assert.equal(passportSource('gallery'), 'gallery')
  assert.match(prompt, /fan_passport_cta/)
  assert.match(follow, /fan_passport_resumed/)
  assert.match(read('pages/fan/verify.vue'), /fan_passport_verified/)
  assert.match(read('utils/fan/passportAnalytics.js'), /payload: \{\s*source:/)
  assert.doesNotMatch(read('utils/fan/passportAnalytics.js'), /bodyText|emailInput|messageBody/)
})

test('passport invitation is one sheet with a near-white action', () => {
  assert.match(prompt, /Create your free Fan Passport|Create free account/)
  assert.match(prompt, /#f5f4f2/)
  assert.match(prompt, /lockOverlayScroll/)
  assert.match(prompt, /Maybe later|copy\?\.dismiss/)
  assert.match(conversion, /You’re on the list\./)
  assert.match(conversion, /Create your free Fan Passport/)
})

console.log(`\n${passed} passed\n`)
