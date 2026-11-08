/**
 * Native Artist Page Follow — UI contracts, intent, isolation from email/check-in.
 * Run: node scripts/test-native-follow.mjs
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse, compileScript, compileTemplate } from '@vue/compiler-sfc'
import { FAN_ACCOUNT_PROMPTS_ENABLED } from '../config/fanAccountFeatureFlags.js'
import {
  artistFollowReturnTo,
  artistRelSessionKey,
  hasFollowIntent,
  isContactableFan,
  isFollowingFan,
  stripFollowIntentQuery,
} from '../utils/fan/artistFollow.js'
import { sanitizeFanReturnTo } from '../utils/fan/safeFanReturnTo.js'

const here = dirname(fileURLToPath(import.meta.url))
const read = (rel) => readFileSync(resolve(here, '..', rel), 'utf8')

function compileSfc(rel) {
  const source = read(rel)
  const { descriptor, errors } = parse(source, { filename: rel })
  assert.deepEqual(errors, [], `${rel} parse errors`)
  if (descriptor.scriptSetup || descriptor.script) {
    const script = compileScript(descriptor, { id: rel, filename: rel })
    assert.ok(script.content, `${rel} script compiled`)
  }
  const template = compileTemplate({
    source: descriptor.template.content,
    filename: rel,
    id: rel,
  })
  assert.deepEqual(template.errors, [], `${rel} template compile errors`)
}

const page = read('pages/[bandSlug]/index.vue')
const actions = read('components/band/ArtistPageActions.vue')
const conversion = read('composables/useFanAccountConversion.js')
const followComposable = read('composables/useArtistPageFollow.js')
const capture = read('components/band/FanCaptureSection.vue')
const prompt = read('components/fan/FanAccountPrompt.vue')
const checkIn = read('scripts/test-show-checkin-experience.mjs')
const passportUi = read('utils/passport/passportPresentation.js')

let passed = 0
function test(name, fn) {
  fn()
  passed += 1
  console.log(`  ok  ${name}`)
}

console.log('\n=== Native Artist Page Follow ===\n')

test('Follow label is Following when followed, for every variant', () => {
  assert.match(actions, /props\.followed \? 'Following' : 'Follow'/)
  assert.doesNotMatch(actions, /if \(props\.followed\) return/)
  assert.doesNotMatch(actions, /Unfollow\?/)
  assert.doesNotMatch(actions, /unfollowArmed/)
  assert.doesNotMatch(actions, /polish-test' && props\.followed/)
})

test('Artist Page Follow no longer opens FollowBandModal', () => {
  assert.doesNotMatch(page, /FollowBandModal/)
  assert.doesNotMatch(page, /openFollowModal/)
  assert.match(page, /onFollowAction/)
  assert.match(page, /useArtistPageFollow/)
})

test('Follow visibility is not gated on social platforms', () => {
  assert.match(page, /:show-follow="isSectionVisible\('follow'\)"/)
  const compact = read('components/band/BandPageCompact.vue')
  const bold = read('components/band/BandPageBold.vue')
  assert.match(compact, /:show-follow="true"/)
  assert.match(bold, /:show-follow="true"/)
})

test('signed-in Follow uses self-scoped endpoints and timestamp truth', () => {
  assert.match(followComposable, /\/api\/fan-account\/artists\/\$\{bandId\.value\}\/follow/)
  assert.match(followComposable, /\/api\/fan-account\/artists\/\$\{bandId\.value\}\/unfollow/)
  assert.match(followComposable, /\/api\/fan-account\/artists/)
  assert.match(followComposable, /isFollowingFan\(match\)/)
  assert.match(followComposable, /isContactableFan\(match\)/)
  assert.doesNotMatch(followComposable, /localStorage/)
})

test('anonymous Follow opens FollowArtistSheet, not an account-creation prompt', () => {
  assert.equal(FAN_ACCOUNT_PROMPTS_ENABLED, false)
  assert.match(page, /FollowArtistSheet/)
  assert.match(page, /onAnonymousFollow/)
  assert.match(page, /followSheetOpen/)
  assert.match(followComposable, /onAnonymousFollow/)
  assert.match(followComposable, /offerFollowPassport/)
  assert.match(conversion, /function showAfterFollowIntent\(\{ bandName, returnTo, email \}/)
  assert.match(conversion, /emailInput: normalized/)
  assert.match(conversion, /trigger: 'follow_intent'/)
  assert.doesNotMatch(conversion, /function showAfterFollowIntent[\s\S]*isFanAccountPromptsEnabled/)
  assert.match(conversion, /if \(trigger === 'follow_intent'\) followIntentDismissed\.value = true/)
  assert.match(prompt, /useFanAccountConversion/)
})

test('prompt dismiss creates no Follow and does not enumerate accounts', () => {
  assert.match(conversion, /if \(followIntentDismissed\.value\) return false/)
  assert.doesNotMatch(conversion, /already has an account/)
  assert.doesNotMatch(prompt, /already has an account/)
  assert.match(followComposable, /if \(!user\.value\) \{[\s\S]*?onAnonymousFollow/)
  assert.match(followComposable, /if \(!result\.ok && typeof onAnonymousFollow === 'function'\)/)
  assert.doesNotMatch(conversion, /\/fan-account\/artists\/.*\/follow/)
})

test('magic-link return preserves sanitized follow intent and consumes it once', () => {
  assert.equal(artistFollowReturnTo('the-rockers'), '/the-rockers?feq_intent=follow')
  assert.equal(sanitizeFanReturnTo('/the-rockers?feq_intent=follow'), '/the-rockers?feq_intent=follow')
  assert.equal(hasFollowIntent({ feq_intent: 'follow' }), true)
  assert.deepEqual(stripFollowIntentQuery({ feq_intent: 'follow', x: '1' }), { x: '1' })
  assert.match(followComposable, /consumeFollowIntent/)
  assert.match(followComposable, /intentConsumed/)
  assert.match(followComposable, /clearFollowIntentFromUrl/)
  assert.match(prompt, /context\?\.returnTo \|\| route\.fullPath/)
})

test('Join Fan List same-session can show Following; already-joined is email subscribed only', () => {
  assert.match(page, /markSessionFollowed\(\{ subscribed: true \}\)/)
  assert.match(page, /:followed="isNativeFollowing"/)
  assert.match(page, /:subscribed="isFanListContactable"/)
  assert.match(capture, /match\?\.status === 'subscribed'/)
  assert.match(capture, /isContactableFan|contactable/)
  assert.match(capture, /showFollowOnlyCapture/)
  assert.match(capture, /joinArtistFanList/)
  assert.match(followComposable, /sessionFollowed/)
  assert.match(followComposable, /sessionSubscribed/)
})

test('isFollowingFan ignores existence and email status', () => {
  assert.equal(isFollowingFan({ isFollowing: true }), true)
  assert.equal(isFollowingFan({ followedAt: '2026-01-01T00:00:00.000Z' }), true)
  assert.equal(isFollowingFan({ status: 'subscribed', bandId: 1 }), false)
  assert.equal(isFollowingFan({ followedAt: '2026-01-01T00:00:00.000Z', unfollowedAt: '2026-02-01T00:00:00.000Z' }), false)
  assert.equal(isContactableFan({ status: 'subscribed' }), true)
  assert.equal(isContactableFan({ status: 'unsubscribed', isFollowing: true }), false)
  assert.equal(isContactableFan({ followedAt: '2026-01-01T00:00:00.000Z' }), false)
  assert.equal(artistRelSessionKey(9), 'faneqo-artist-rel:9')
})

test('check-in and Passport surfaces stay attendance-derived', () => {
  assert.match(checkIn, /canonical attendance/)
  assert.doesNotMatch(passportUi, /followedAt/)
  assert.doesNotMatch(page, /check-in[\s\S]{0,80}onFollowAction/)
})

test('failure keeps the prior Follow label', () => {
  assert.match(followComposable, /Could not follow this artist/)
  assert.match(followComposable, /Could not unfollow/)
  assert.match(followComposable, /isFollowing\.value = !!res\?\.data\?\.isFollowing/)
  assert.match(followComposable, /if \(res\?\.data\?\.isFollowing\)/)
})

test('Following opens Unfollow confirmation, then ends Follow and Fan List', () => {
  const unfollowSheet = read('components/band/UnfollowArtistSheet.vue')
  assert.match(page, /UnfollowArtistSheet/)
  assert.match(page, /onConfirmUnfollow/)
  assert.match(page, /onUnfollowConfirmed/)
  assert.match(followComposable, /function endRelationship/)
  assert.match(followComposable, /if \(followed\.value\) \{[\s\S]*?onConfirmUnfollow/)
  assert.match(followComposable, /followed: false, subscribed: false/)
  assert.match(unfollowSheet, /Unfollow \{\{ displayName \}\}\?/)
  assert.match(unfollowSheet, /lockOverlayScroll\(LOCK_ID\)/)
  assert.match(unfollowSheet, /const LOCK_ID = 'artist-unfollow'/)
  assert.match(unfollowSheet, /leave their Fan List/)
  assert.match(unfollowSheet, /You can follow again anytime/)
  assert.match(unfollowSheet, /Cancel/)
  assert.doesNotMatch(unfollowSheet, /Manage Relationship/)
  assert.match(capture, /prev && !next/)
  compileSfc('components/band/UnfollowArtistSheet.vue')
})

test('native Follow SFCs compile', () => {
  compileSfc('components/band/ArtistPageActions.vue')
  compileSfc('components/fan/FanAccountPrompt.vue')
  compileSfc('components/band/FanCaptureSection.vue')
  compileSfc('components/band/FollowArtistSheet.vue')
})

console.log(`test-native-follow: ${passed} passed`)
