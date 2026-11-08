/**
 * Show check-in experience: no floating artist-page CTA, canonical attendance
 * gating, and a full-viewport check-in surface that carries its own composition.
 * Run: node scripts/test-show-checkin-experience.mjs
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { parse, compileTemplate, compileScript } from '@vue/compiler-sfc'

const here = dirname(fileURLToPath(import.meta.url))
const read = (rel) => readFileSync(resolve(here, '..', rel), 'utf8')

const modalPath = 'components/band/ShowCheckInModal.vue'
const modal = read(modalPath)
const bandPage = read('pages/[bandSlug]/index.vue')
const fanCapture = read('components/band/FanCaptureSection.vue')

let passed = 0
function test(name, fn) {
  fn()
  passed += 1
  console.log(`  ✅ ${name}`)
}

test('the check-in surface still compiles as an SFC', () => {
  const { descriptor, errors } = parse(modal, { filename: modalPath })
  assert.deepEqual(errors, [], 'SFC parse errors')

  const script = compileScript(descriptor, { id: 'checkin-test' })
  assert.ok(script.content.includes('handleOpenTonight'), 'script setup compiled')

  const template = compileTemplate({
    source: descriptor.template.content,
    filename: modalPath,
    id: 'checkin-test',
  })
  assert.deepEqual(template.errors, [], 'template compile errors')
})

test('the artist page renders no floating check-in CTA', () => {
  assert.ok(!bandPage.includes('show-checkin-floating-btn'), 'floating button markup removed')
  assert.ok(!bandPage.includes('floating-btn-glow'), 'floating button styles removed')
  assert.ok(!/Check In to Tonight/i.test(bandPage), 'floating CTA copy removed')
  assert.ok(!bandPage.includes('fixed bottom-6 left-1/2'), 'floating wrapper removed')
})

test('check-in entry paths that belong to the show context survive', () => {
  assert.ok(bandPage.includes('<ShowCheckInModal'), 'the check-in surface is still mounted')
  assert.ok(bandPage.includes('@open-check-in-modal="openCheckInModal"'), 'show module still opens check-in')
  assert.ok(fanCapture.includes('<ShowCheckInButton'), 'in-flow show module button preserved')
  assert.ok(/if \(!checkInModalOpen\.value\) openCheckInModal\(\)/.test(bandPage), 'zero-tap entry preserved')
})

test('attendance stays canonical and tri-state', () => {
  assert.ok(bandPage.includes("const attendanceState = ref('unknown')"), 'unknown is the initial truth')
  assert.ok(
    /canOfferCheckIn = computed\(\s*\(\) => isShowModeLive\.value && attendanceState\.value === 'not_checked_in'/.test(
      bandPage
    ),
    'check-in is only offered on confirmed non-attendance'
  )
  assert.ok(bandPage.includes("attendanceState.value = 'checked_in'"), 'success updates canonical state immediately')
  assert.ok(
    fanCapture.includes("v-if=\"showModeEnabled && attendanceResolved && !success && !isCheckedIn\""),
    'embedded entry waits for resolved attendance'
  )
})

test('no opacity/timeout masking is used to hide the resolving state', () => {
  assert.ok(!/opacity:\s*0;[^}]*checkin/i.test(bandPage), 'no opacity trick on the page')
  assert.ok(!/setTimeout\([^)]*attendanceState/.test(bandPage), 'attendance is not faked on a timer')
})

test('the surface is full-viewport and safe-area aware', () => {
  assert.ok(modal.includes('min-height: 100dvh'), '100dvh frame')
  assert.ok(modal.includes('env(safe-area-inset-top, 0px) + 12px'), 'top safe zone + breathing room')
  assert.ok(modal.includes('env(safe-area-inset-bottom, 0px) + 20px'), 'bottom safe zone')
  assert.ok(!modal.includes('checkin-backdrop'), 'no modal backdrop frame')
  assert.ok(!modal.includes('checkin-card'), 'no outer card')
})

test('the hero is inset, cropped deliberately, and fades into the canvas', () => {
  assert.ok(modal.includes('height: clamp(220px, 38dvh, 420px)'), 'hero uses the extra vertical room')
  assert.ok(modal.includes('max-height: min(42dvh, calc(100dvh - 26rem))'), 'hero cannot blow past the viewport')
  assert.ok(modal.includes('object-fit: cover'), 'cover crop')
  assert.ok(modal.includes('getArtistFocalStyle'), 'uses the artist focal contract')
  assert.ok(modal.includes('.show-hero-fade'), 'bottom fade, no hard seam')
  assert.ok(/@media \(max-height: 720px\)/.test(modal), 'short viewports tighten the photo first')
})

test('artist identity appears once per state', () => {
  const template = parse(modal, { filename: modalPath }).descriptor.template.content
  const [preCheckIn, postCheckIn] = template.split('CHECKED IN (fresh or already)')

  assert.equal((preCheckIn.match(/\{\{ bandName/g) || []).length, 1, 'one artist name before check-in')
  assert.equal((postCheckIn.match(/\{\{ bandName/g) || []).length, 1, 'one artist name after check-in')
  assert.ok(preCheckIn.includes('Live · Tonight'), 'live label above the name')
  assert.ok(preCheckIn.includes('{{ placeLine }}'), 'venue · city under the name')
  assert.ok(postCheckIn.includes('{{ compactShowLine }}'), 'venue · city · date collapses to one line')
})

test('the arrival hierarchy and benefit rows match the brief', () => {
  assert.ok(modal.includes('You’re here.'), 'lede')
  assert.ok(modal.includes('Check in to unlock tonight’s fan experience.'), 'explanation')
  assert.ok(modal.includes('Talk to the band'), 'benefit 1')
  assert.ok(modal.includes('Get exclusive photos &amp; updates'), 'benefit 2')
  assert.ok(modal.includes('Save tonight to your Fan Passport'), 'benefit 3')
  assert.ok(modal.includes('No spam. Just updates from the artist.'), 'quiet footer')
})

test('the primary CTA is text-only, full width, and lives inside the experience', () => {
  assert.ok(modal.includes('Check in to tonight’s show'), 'single primary action')
  assert.ok(!/📍|📌|🎟|🎫/.test(modal), 'no emoji in the CTA')
  assert.ok(/\.btn-primary \{[^}]*width: 100%;/.test(modal), 'CTA spans the width')
  assert.ok(/\.btn-primary \{[^}]*min-height: 56px;/.test(modal), 'CTA has a substantial height')
  assert.ok(!/\.btn-primary \{[^}]*position: fixed/.test(modal), 'CTA never floats')
})

test('the close control is overlay chrome, not a document row', () => {
  assert.ok(modal.includes('aria-label="Close check-in"'), 'labelled close control')
  assert.ok(/\.checkin-close \{[^}]*position: absolute/.test(modal), 'close overlays the composition')
  assert.ok(/\.checkin-close \{[^}]*width: 44px;/.test(modal), '44px target')
  assert.ok(!modal.includes('checkin-chrome'), 'no dedicated close row')
  assert.ok(modal.includes('padding-right: 56px'), 'titles clear the overlay control')
})

test('success does not interrupt with badge or account', () => {
  assert.ok(modal.includes('You’re in.'), 'success lede')
  assert.ok(modal.includes('Tonight is now part of your Fan Passport.'), 'passport confirmation')
  assert.ok(modal.includes('Open tonight'), 'primary next action is tonight')
  assert.ok(modal.includes('Talk to the band'), 'secondary messages action')
  assert.ok(modal.includes('View Fan Passport'), 'secondary passport action')
  assert.ok(!modal.includes('Get your badge'), 'badge is off the success path')
  assert.ok(!modal.includes('Create my free account'), 'account is not the success interruption')
  assert.ok(!modal.includes('Keep everything from tonight'), 'no post-success signup block')
})

test('the cinematic hero is not reused after check-in', () => {
  const template = parse(modal, { filename: modalPath }).descriptor.template.content

  assert.ok(template.includes('<template v-if="!isCheckedIn">'), 'hero and tall identity are gated on not-checked-in')
  const heroIndex = template.indexOf('class="show-hero"')
  const gateIndex = template.indexOf('<template v-if="!isCheckedIn">')
  const gateEnd = template.indexOf('</template>', gateIndex)
  assert.ok(heroIndex > gateIndex && heroIndex < gateEnd, 'the tall hero lives inside that gate')

  assert.ok(modal.includes('class="identity-thumb"'), 'success uses a thumbnail instead')
  assert.ok(/\.identity-thumb \{[^}]*width: 72px;/.test(modal), 'thumbnail sits in the 72-96px band')
  assert.ok(!/\.state-compact[^{]*\{[^}]*38dvh/.test(modal), 'no dvh-scale hero in the compact state')
})

test('the compact success layout flows from the top', () => {
  assert.ok(!/\.actions--footer \{[^}]*margin-top: auto;/.test(modal), 'success CTA is not pushed to the bottom')
  assert.ok(!/\.btn-primary \{[^}]*position: fixed/.test(modal), 'nothing is pinned over content')
  assert.ok(/\.state-compact \.btn-primary \{[^}]*min-height: 52px;/.test(modal), '44-52px touch target')
  assert.ok(/\.btn-primary \{[^}]*background: #f3f3f4;/.test(modal), 'near-white primary')
  assert.ok(modal.includes('animation: checkin-rise'), 'subtle state-change motion')
  assert.ok(
    /prefers-reduced-motion: reduce\)[\s\S]*\.state-compact \{\s*animation: none;/.test(modal),
    'reduced motion gets an immediate swap'
  )
})

test('success next actions use existing destinations', () => {
  assert.ok(modal.includes("leaveToFanApp('/fan/messages', 'messages')"), 'messages remains an existing destination')
  assert.ok(modal.includes("leaveToFanApp('/fan/passport', 'passport')"), 'passport remains an existing destination')
  assert.ok(modal.includes('fanLoginPathFor'), 'unclaimed fans skip the dead auth hop')
  assert.ok(modal.includes('Opening Fan Passport…'), 'passport row shows a leaving spinner')
  assert.ok(modal.includes('function handleOpenTonight()'), 'tonight routes to the live artist home')
  assert.ok(modal.includes('function artistHomePath()'), 'tonight uses the artist homepage, not a Night recap')
  assert.ok(!/createFanAccount|registerFan\(/.test(modal), 'no second identity system')
})

test('the check-in SFC no longer compiles a post-success account offer', () => {
  const { descriptor, errors } = parse(modal, { filename: modalPath })
  assert.deepEqual(errors, [], 'SFC parse errors')
  const script = compileScript(descriptor, { id: 'checkin-test-success' })
  assert.ok(script.content.includes('handleOpenTonight'), 'success path compiled')
  assert.ok(!script.content.includes('handleCreateAccount'), 'account offer removed from this surface')
})

test('badge failure stays local to the optional artifact', () => {
  const badge = read('components/band/ShowCheckInBadgeModal.vue')
  assert.ok(badge.includes('Your check-in is safe. Only this optional image failed.'), 'failure does not imply lost attendance')
  assert.ok(!badge.includes("We couldn't create your badge."), 'old check-in-sounding headline is gone')
  assert.ok(bandPage.includes('<ShowCheckInBadgeModal'), 'badge architecture remains mounted')
  assert.ok(!modal.includes('Get your badge'), 'success no longer promotes the badge')
})

test('attendance creation and analytics payload are untouched', () => {
  assert.ok(modal.includes('/api/fan-interactions/check-in'), 'same backend contract')
  assert.ok(modal.includes("surface: 'band_page'"), 'same surface attribution')
  assert.ok(modal.includes("interactionContext: 'show_mode'"), 'same interaction context')
  assert.ok(modal.includes('enqueue(payload)'), 'offline queue preserved')
})

console.log(`\n=== show check-in experience: ${passed} passed ===`)
