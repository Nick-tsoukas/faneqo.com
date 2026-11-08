/**
 * Fan Account V1 — Slice C: global fan profile UI.
 * Run: node scripts/test-fan-profile.mjs
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse, compileScript, compileTemplate } from '@vue/compiler-sfc'
import { isFanAuthPath, isFaneqoAppPath } from '../utils/ui/appSurface.js'
import { fanNavActiveTab, isFanNavVisible } from '../utils/ui/fanNav.js'
import {
  FAN_PROFILE_LIMITS,
  FAN_PROFILE_WRITABLE_FIELDS,
  fanProfileChosenName,
  fanProfileDisplayName,
  fanProfileFallbackName,
  fanProfileFieldError,
  fanProfileFormValues,
  fanProfileInitials,
  fanProfileNeedsCompletion,
  fanProfilePatchBody,
  fanProfileStructuredName,
} from '../utils/fan/fanProfileIdentity.js'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8')

let passed = 0
function test(name, fn) {
  fn()
  passed += 1
  console.log(`  ✅ ${name}`)
}

function compileSfc(rel) {
  const source = read(rel)
  const { descriptor, errors } = parse(source, { filename: rel })
  assert.deepEqual(errors, [], `${rel} parse errors`)
  const script = compileScript(descriptor, { id: rel, filename: rel })
  assert.ok(script.content, `${rel} script compiled`)
  const template = compileTemplate({
    source: descriptor.template.content,
    filename: rel,
    id: rel,
  })
  assert.deepEqual(template.errors, [], `${rel} template compile errors`)
  return { source, descriptor }
}

const page = read('pages/fan/profile.vue')
const home = read('pages/fan/index.vue')
const avatar = read('components/fan/FanAvatar.vue')
const composable = read('composables/useFanProfile.js')
const nav = read('components/messages/FanMobileBottomNav.vue')
const artistLogin = read('pages/login.vue')

/* ----------------------------------------------------------- compile ------ */

test('touched profile SFCs compile', () => {
  compileSfc('pages/fan/profile.vue')
  compileSfc('components/fan/FanAvatar.vue')
  compileSfc('components/fan/FanAvatarControl.vue')
  compileSfc('pages/fan/index.vue')
  compileSfc('components/messages/FanMobileBottomNav.vue')
})

/* ----------------------------------------------------------- auth load ---- */

test('authenticated profile load uses GET /api/fan-account/profile', () => {
  assert.match(composable, /\/api\/fan-account\/profile/)
  assert.match(composable, /async function loadProfile/)
  assert.match(composable, /\$fetch\(`\$\{baseUrl\}\/api\/fan-account\/profile`, \{ headers: authHeaders\(\) \}\)/)
  assert.match(composable, /export function useFanProfile/)
  assert.match(page, /useFanProfile/)
  assert.match(page, /await loadProfile\(\{ force: true \}\)/)
})

test('unauthenticated visitors are redirected before an editable shell renders', () => {
  assert.match(page, /\/fan\/login\?redirect=\/fan\/profile/)
  assert.match(page, /phase === 'resolving'/)
  assert.match(page, /if \(!token\.value\) return toLogin\(\)/)
  assert.match(page, /statusOf\(err\) === 401/)
  assert.match(page, /<template v-else>/)
  assert.match(page, /v-if="!loadFailed && editing"/)
  assert.doesNotMatch(page, /to="\/login"/)
  assert.doesNotMatch(page, /path: '\/login'/)
})

/* -------------------------------------------------------- identity rules -- */

test('displayName is the chosen social identity when present', () => {
  assert.equal(
    fanProfileDisplayName({
      displayName: 'drumkid92',
      firstName: 'Nik',
      lastName: 'Tsoukas',
      email: 'nik@example.com',
    }),
    'drumkid92'
  )
  assert.equal(fanProfileChosenName({ displayName: 'Nik Beats' }), 'Nik Beats')
  assert.equal(fanProfileInitials({ displayName: 'Nik Beats' }), 'NB')
})

test('read view falls back to first name plus last initial, never email', () => {
  assert.equal(fanProfileFallbackName({ firstName: 'Nik', lastName: 'Tsoukas' }), 'Nik T.')
  assert.equal(fanProfileDisplayName({ firstName: 'Nik', lastName: 'Tsoukas' }), 'Nik T.')
  assert.equal(fanProfileDisplayName({ firstName: 'Nik' }), 'Nik')
  assert.equal(fanProfileStructuredName({ firstName: 'Nik', lastName: 'Tsoukas' }), 'Nik Tsoukas')
  assert.equal(fanProfileInitials({ firstName: 'Nik', lastName: 'Tsoukas' }), 'NT')

  assert.equal(fanProfileDisplayName({ email: 'nikbeats@example.com' }), null)
  assert.equal(fanProfileDisplayName({ displayName: '', firstName: '', email: 'fan@example.com' }), null)
  assert.equal(
    fanProfileDisplayName({
      displayName: null,
      firstName: null,
      lastName: null,
      email: 'nikbeats@example.com',
    }),
    null
  )
  assert.equal(fanProfileInitials({ email: 'nikbeats@example.com' }), '')
  assert.doesNotMatch(page, /email\.split|split\('@'\)|localPart|usernameFromEmail/)
  assert.doesNotMatch(composable, /email\.split|split\('@'\)/)
})

test('incomplete copy waits for load and never uses the email username', () => {
  assert.match(page, /phase === 'resolving'/)
  assert.match(page, /Complete your profile/)
  assert.match(page, /Add the name artists will see when you connect with them\./)
  assert.match(page, /Add profile/)
  assert.doesNotMatch(page, /v-if="needsCompletion"/)
})

test('editor leaves displayName empty unless the fan chose one', () => {
  assert.deepEqual(fanProfileFormValues({ firstName: 'Nik', lastName: 'Tsoukas', email: 'nik@example.com' }), {
    displayName: '',
    firstName: 'Nik',
    lastName: 'Tsoukas',
  })
  assert.deepEqual(fanProfileFormValues({ displayName: 'drumkid92', firstName: 'Nik' }), {
    displayName: 'drumkid92',
    firstName: 'Nik',
    lastName: '',
  })
  assert.match(page, /fanProfileFormValues\(profile\.value\)/)
  assert.match(page, /The name artists see on Faneqo\./)
  assert.match(page, /for="fan-profile-display-name"/)
  assert.match(page, /for="fan-profile-first-name"/)
  assert.match(page, /for="fan-profile-last-name"/)
})

/* --------------------------------------------------------------- PATCH ---- */

test('PATCH is limited to displayName, firstName, lastName', () => {
  assert.deepEqual(FAN_PROFILE_WRITABLE_FIELDS, ['displayName', 'firstName', 'lastName'])
  assert.deepEqual(fanProfilePatchBody({
    displayName: 'Nik Beats',
    firstName: 'Nik',
    lastName: 'Tsoukas',
    email: 'nik@example.com',
    avatarUrl: '/uploads/x.png',
    avatar: 9,
    profileCompletedAt: '2026-01-01T00:00:00.000Z',
    userId: 11,
    profileId: 4,
  }), {
    displayName: 'Nik Beats',
    firstName: 'Nik',
    lastName: 'Tsoukas',
  })
  assert.match(composable, /async function saveProfile/)
  assert.match(composable, /method: 'PATCH'/)
  assert.match(composable, /fanProfilePatchBody\(form\)/)
  assert.doesNotMatch(composable, /\/api\/fan-account\/profile[\s\S]{0,80}method: 'POST'/)
  assert.doesNotMatch(page, /updateFanProfile/)
})

test('clearing optional fields is an explicit empty write, not an omission', () => {
  assert.deepEqual(fanProfilePatchBody({ displayName: '  ', firstName: 'Nik', lastName: '' }), {
    displayName: '',
    firstName: 'Nik',
    lastName: '',
  })
  assert.equal(Object.keys(fanProfilePatchBody({})).length, 3)
})

test('backend validation errors map onto the field that caused them', () => {
  assert.deepEqual(
    fanProfileFieldError({
      name: 'displayName_too_long',
      message: `displayName must be ${FAN_PROFILE_LIMITS.displayName} characters or fewer.`,
    }),
    {
      field: 'displayName',
      message: `Display name must be ${FAN_PROFILE_LIMITS.displayName} characters or fewer.`,
    }
  )
  assert.deepEqual(
    fanProfileFieldError({ name: 'displayName_invalid', message: 'displayName contains characters we can\'t use.' }),
    { field: 'displayName', message: 'Enter a valid display name.' }
  )
  assert.deepEqual(
    fanProfileFieldError({ name: 'firstName_invalid', message: 'firstName cannot be an email address.' }),
    { field: 'firstName', message: 'Enter a valid first name.' }
  )
  assert.equal(fanProfileFieldError({ name: 'unauthorized', message: 'Authentication required' }), null)
  assert.match(page, /fieldErrors\.displayName/)
  assert.match(page, /fieldErrors\.firstName/)
  assert.match(page, /fieldErrors\.lastName/)
  assert.match(page, /aria-describedby/)
})

test('successful save stays on the page and shows restrained Saved feedback', () => {
  assert.match(page, /await saveProfile\(form\)/)
  assert.match(page, /editing\.value = false/)
  assert.match(page, /flashSaved\(message = 'Saved'\)|flashSaved\(\)/)
  assert.match(page, /justSaved/)
  assert.doesNotMatch(page, /reload\(|location\.href|window\.location/)
  assert.doesNotMatch(page, /🎉|toast-celebration|Profile updated!/)
})

/* ---------------------------------------------------------- passwordless -- */

test('profile has no password controls and explains passwordless sign-in', () => {
  assert.match(page, /Passwordless sign-in/)
  assert.match(page, /We'll email you a secure sign-in link whenever you need to sign in on a new device\./)
  assert.match(page, /profile\?\.email/)
  assert.doesNotMatch(page, /type="password"/)
  assert.doesNotMatch(page, /autocomplete="(current|new)-password"/)
  assert.doesNotMatch(page, /Change password|Forgot password|Reset password|Current password|Set password/i)
  assert.doesNotMatch(avatar, /type="file"|<input[^>]+file|Change photo|Remove photo/)
})

/* -------------------------------------------------------------- sign out -- */

test('sign out ends the Strapi session and returns to /fan/login', () => {
  assert.match(page, /const \{ logout \} = useStrapiAuth\(\)/)
  assert.match(page, /await logout\(\)/)
  assert.match(page, /router\.replace\('\/fan\/login'\)/)
  assert.match(page, /reset\(\)/)
  assert.doesNotMatch(page, /clearVisitor|deleteVisitor|useSavedBands\(|checkedInShowCount|_vid/)
})

/* ----------------------------------------------------------- fan home ----- */

test('/fan shows a compact identity entry to /fan/profile', () => {
  assert.match(home, /to="\/fan\/profile"/)
  assert.match(home, /useFanProfile/)
  assert.match(home, /loadProfile/)
  assert.match(home, /fanProfileDisplayName/)
  assert.match(home, /FanAvatar/)
  assert.match(home, /fanName \? 'Profile'/)
  assert.match(home, /Your Artists/)
  assert.match(home, /to="\/fan\/messages"/)
  assert.match(home, /to="\/fan\/passport"/)
})

/* ----------------------------------------------------------------- nav ---- */

test('Profile is an active fan-nav tab, hidden on login and verify', () => {
  assert.equal(fanNavActiveTab('/fan/profile'), 'profile')
  assert.equal(fanNavActiveTab('/fan/profile/'), 'profile')
  assert.equal(fanNavActiveTab('/fan/profilefoo'), null)
  assert.equal(isFanNavVisible('/fan/profile'), true)
  assert.equal(isFanNavVisible('/fan/login'), false)
  assert.equal(isFanNavVisible('/fan/verify'), false)
  assert.equal(fanNavActiveTab('/fan/login'), null)
  assert.equal(fanNavActiveTab('/fan/verify'), null)
  assert.equal(fanNavActiveTab('/fans'), null)
  assert.equal(isFanNavVisible('/fans'), false)
  assert.equal(isFanAuthPath('/fan/profile'), false)
  assert.equal(isFaneqoAppPath('/fan/profile'), true)
  assert.equal(isFaneqoAppPath('/fan/login'), false)

  assert.match(nav, /to="\/fan\/profile"/)
  assert.match(nav, />\s*Artists\s*</)
  assert.match(nav, />\s*Messages\s*</)
  assert.match(nav, />\s*Passport\s*</)
  assert.match(nav, />\s*Profile\s*</)
  assert.match(nav, /isProfile/)
  assert.match(nav, /aria-current/)
  assert.match(nav, /isFanNavVisible\(route\.path\)/)
})

/* -------------------------------------------------------- artist login ---- */

test('artist login is unaffected', () => {
  assert.match(artistLogin, /id="password"/)
  assert.match(artistLogin, /login\(\{ identifier, password: values\.password \}\)/)
  assert.match(artistLogin, /loginWithGoogle/)
  assert.match(artistLogin, /authAccountSwitchTo\("\/forgot-password"/)
  assert.match(artistLogin, /"\/dashboard"/)
  assert.doesNotMatch(page, /artist role|team account|band member/i)
})

/* ---------------------------------------------------- completion / gate -- */

test('an incomplete profile is enrichment, not a gate', () => {
  assert.equal(fanProfileNeedsCompletion({ profileCompletedAt: null }), true)
  assert.equal(fanProfileNeedsCompletion({ displayName: 'Nik', profileCompletedAt: '2026-01-01' }), false)
  assert.doesNotMatch(page, /v-if="needsCompletion"/)
  assert.doesNotMatch(page, /modal|blocked|must complete|finish your profile to/i)
  assert.doesNotMatch(home, /profileCompletedAt/)
})

console.log(`\n=== fan profile: ${passed} passed ===`)
