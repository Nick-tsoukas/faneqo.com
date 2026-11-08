/**
 * Artist Page Follow sheet — reuse, join write, scroll lock, coherence.
 * Run: node scripts/test-follow-artist-sheet.mjs
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse, compileScript, compileTemplate } from '@vue/compiler-sfc'
import {
  isValidFanEmail,
  joinArtistFanList,
  normalizeFanEmail,
} from '../utils/fan/joinArtistFanList.js'
import { isContactableFan, isFollowingFan } from '../utils/fan/artistFollow.js'

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

const sheet = read('components/band/FollowArtistSheet.vue')
const joinHelper = read('utils/fan/joinArtistFanList.js')
const page = read('pages/[bandSlug]/index.vue')
const capture = read('components/band/FanCaptureSection.vue')
const follow = read('composables/useArtistPageFollow.js')
const lock = read('utils/ui/overlayScrollLock.js')
const share = read('components/ShareQrDrawer.vue')

let passed = 0
function test(name, fn) {
  fn()
  passed += 1
  console.log(`  ok  ${name}`)
}

console.log('\n=== Follow Artist Sheet ===\n')

test('email helper rejects invalid and normalizes', () => {
  assert.equal(normalizeFanEmail('  A@B.COM  '), 'a@b.com')
  assert.equal(isValidFanEmail('not-an-email'), false)
  assert.equal(isValidFanEmail('fan@example.com'), true)
})

test('join helper coerces unknown source/surface to existing Fan enums', () => {
  assert.match(joinHelper, /follow_modal/)
  assert.match(joinHelper, /band_page/)
  assert.doesNotMatch(joinHelper, /follow_sheet/)
})

test('join helper fails closed without inventing a backend', async () => {
  const invalid = await joinArtistFanList({ strapiUrl: 'http://x', email: 'nope', bandId: 1 })
  assert.equal(invalid.ok, false)
  assert.equal(invalid.reason, 'invalid_email')
  const missing = await joinArtistFanList({ strapiUrl: '', email: 'fan@example.com', bandId: 1 })
  assert.equal(missing.ok, false)
  assert.equal(missing.reason, 'missing_band')
})

test('Follow sheet reuses Share QR chrome, not a new overlay system', () => {
  assert.match(sheet, /Teleport to="body"/)
  assert.match(sheet, /useFocusTrap/)
  assert.match(sheet, /lockOverlayScroll\(LOCK_ID\)/)
  assert.match(sheet, /unlockOverlayScroll\(LOCK_ID\)/)
  assert.match(sheet, /const LOCK_ID = 'artist-follow'/)
  assert.match(share, /const LOCK_ID = 'artist-share-qr'/)
  assert.doesNotMatch(sheet, /document\.body\.style\.overflow/)
  assert.match(lock, /pageScrollTop/)
  assert.match(lock, /if \(!locks\.has\(key\)\) return/)
})

test('sheet copy is follow, not newsletter or account creation', () => {
  assert.match(sheet, /Follow \{\{ displayName \}\}/)
  assert.match(sheet, /Stay close to the band/)
  assert.match(sheet, /You’re following \{\{ displayName \}\}/)
  assert.match(sheet, /You’re in/)
  assert.match(sheet, /Save to Fan Passport/)
  assert.match(sheet, /Not now/)
  assert.match(sheet, /Already have a Fan Passport\? Sign in/)
  assert.doesNotMatch(sheet, /newsletter/i)
  assert.doesNotMatch(sheet, /Create your account/)
  assert.doesNotMatch(sheet, /Sign up/)
  assert.doesNotMatch(sheet, /showAfterFanJoin/)
})

test('anonymous Follow and inline Fan List share one subscribe write', () => {
  assert.match(sheet, /joinArtistFanList/)
  assert.match(sheet, /source: 'follow_modal'/)
  assert.match(sheet, /captureSurface: 'follow_modal'/)
  assert.match(joinHelper, /safeFanSource/)
  assert.match(joinHelper, /safeFanSurface/)
  assert.match(joinHelper, /\/api\/fans\/subscribe/)
  assert.match(joinHelper, /subscribeEndpoints/)
  assert.match(joinHelper, /isTransportFailure/)
  assert.match(sheet, /const \{ ensureSession, getVisitorToken \} = useFanIdentity\(\)/)
  assert.doesNotMatch(sheet, /useFanIdentity\(\)\s*\n\s*await ensureSession/)
  assert.match(capture, /joinArtistFanList/)
  assert.match(page, /onFollowSheetJoined/)
  assert.match(page, /onFanSubscribed/)
  assert.match(page, /:followed="isNativeFollowing"/)
  assert.match(page, /:subscribed="isFanListContactable"/)
  assert.match(follow, /onAnonymousFollow/)
  assert.doesNotMatch(page, /FollowBandModal/)
})

test('Passport sign-in is secondary and reuses follow intent', () => {
  assert.match(sheet, /emit\('sign-in', \{ email:/)
  assert.match(sheet, /emit\('claim-passport', \{ email:/)
  assert.match(page, /@sign-in="onFollowPassportPath"/)
  assert.match(page, /@claim-passport="onFollowPassportPath"/)
  assert.match(page, /followSheetOpen.value = false/)
  assert.match(page, /offerFollowPassport\(payload\?\.email\)/)
  assert.match(follow, /function offerFollowPassport\(email\)/)
  assert.match(follow, /email,/)
  assert.doesNotMatch(sheet, /showAfterFollowIntent/)
})

test('Follow and Fan List stay independent truths', () => {
  assert.equal(isFollowingFan({ status: 'subscribed' }), false)
  assert.equal(isContactableFan({ isFollowing: true, status: 'unsubscribed' }), false)
  assert.equal(isContactableFan({ status: 'subscribed' }), true)
  assert.match(capture, /showFollowOnlyCapture/)
  assert.match(capture, /Keep me in the loop/)
  assert.match(follow, /if \(followed\.value\) \{[\s\S]*?onConfirmUnfollow/)
  assert.doesNotMatch(follow, /if \(followed\.value\) \{\s*await unfollow/)
})

test('desktop is a centered card, mobile is a bottom sheet', () => {
  assert.match(sheet, /align-items: flex-end/)
  assert.match(sheet, /@media \(min-width: 768px\)/)
  assert.match(sheet, /align-items: center/)
  assert.match(sheet, /width: min\(26rem, 100%\)/)
  assert.match(sheet, /env\(safe-area-inset-bottom/)
})

test('Follow sheet clears leftover success after Unfollow', () => {
  assert.match(sheet, /watch\(\(\) => props\.followed/)
  assert.match(sheet, /if \(!followed\) justFollowed\.value = false/)
  assert.match(sheet, /if \(!props\.followed\) \{\s*justFollowed\.value = false/)
})

test('Follow sheet compiles', () => {
  compileSfc('components/band/FollowArtistSheet.vue')
})

console.log(`test-follow-artist-sheet: ${passed} passed`)
