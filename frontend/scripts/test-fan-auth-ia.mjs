/**
 * Fan auth IA — returning passwordless sign-in, dead-end links, app chrome.
 * Run: node scripts/test-fan-auth-ia.mjs
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { isFanAppAuthPath, isFanAuthPath, isFaneqoAppPath } from '../utils/ui/appSurface.js'
import { fanNavActiveTab, isFanNavVisible, isFanSectionPath } from '../utils/ui/fanNav.js'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8')
const exists = (rel) => fs.existsSync(path.join(root, rel))

let passed = 0
function test(name, fn) {
  fn()
  passed += 1
  console.log(`  ✅ ${name}`)
}

/* ---------------------------------------------------------------- chrome --- */

test('fan auth routes are auth surfaces, not app surfaces', () => {
  assert.equal(isFanAuthPath('/fan/login'), true)
  assert.equal(isFanAuthPath('/fan/verify'), true)
  assert.equal(isFanAuthPath('/fan/verify?token=abc'), true)
  assert.equal(isFanAuthPath('/fan'), false)
  assert.equal(isFanAuthPath('/fan/passport'), false)
  assert.equal(isFanAppAuthPath('/fan'), true)
  assert.equal(isFanAppAuthPath('/fan/login'), false)
  assert.equal(isFanAppAuthPath('/fan/verify'), false)

  assert.equal(isFaneqoAppPath('/fan/login'), false)
  assert.equal(isFaneqoAppPath('/fan/verify'), false)
  assert.equal(isFaneqoAppPath('/fan'), true)
  assert.equal(isFaneqoAppPath('/fan/messages'), true)
  assert.equal(isFaneqoAppPath('/fan/passport'), true)
  assert.equal(isFaneqoAppPath('/fan/profile'), true)
})

test('app surface matching stays segment-bounded', () => {
  assert.equal(isFaneqoAppPath('/dashboard'), true)
  assert.equal(isFaneqoAppPath('/dashboard/fans/12'), true)
  assert.equal(isFaneqoAppPath('/fans'), true)
  // Public artist pages must not be swallowed by an app prefix.
  assert.equal(isFaneqoAppPath('/fanclub-band'), false)
  assert.equal(isFaneqoAppPath('/accountability'), false)
  assert.equal(isFaneqoAppPath('/'), false)
})

/* ------------------------------------------------------------- fan nav ---- */

test('fan section excludes the artist-facing /fans list', () => {
  assert.equal(isFanSectionPath('/fan'), true)
  assert.equal(isFanSectionPath('/fan/'), true)
  assert.equal(isFanSectionPath('/fan/passport'), true)
  assert.equal(isFanSectionPath('/fans'), false)
  assert.equal(isFanSectionPath('/fans/recaps/3'), false)
})

test('fan nav hides on auth surfaces, immersive threads, and non-fan routes', () => {
  assert.equal(isFanNavVisible('/fan'), true)
  assert.equal(isFanNavVisible('/fan/passport'), true)
  assert.equal(isFanNavVisible('/fan/messages'), true)
  assert.equal(isFanNavVisible('/fan/profile'), true)
  assert.equal(isFanNavVisible('/fan/login'), false)
  assert.equal(isFanNavVisible('/fan/verify'), false)
  assert.equal(isFanNavVisible('/fan/messages/99'), false)
  assert.equal(isFanNavVisible('/fans'), false)
  assert.equal(isFanNavVisible('/dashboard'), false)
})

test('active tab is exact or null — never a misleading highlight', () => {
  assert.equal(fanNavActiveTab('/fan'), 'artists')
  assert.equal(fanNavActiveTab('/fan/'), 'artists')
  assert.equal(fanNavActiveTab('/fan?welcome=1'), 'artists')
  assert.equal(fanNavActiveTab('/fan/passport'), 'passport')
  assert.equal(fanNavActiveTab('/fan/passport/gallery/42'), 'passport')
  assert.equal(fanNavActiveTab('/fan/messages'), 'messages')
  assert.equal(fanNavActiveTab('/fan/messages/12'), 'messages')
  assert.equal(fanNavActiveTab('/fan/profile'), 'profile')
  assert.equal(fanNavActiveTab('/fan/profile/'), 'profile')

  // Auth surfaces and unclaimed nested fan routes highlight nothing.
  assert.equal(fanNavActiveTab('/fan/login'), null)
  assert.equal(fanNavActiveTab('/fan/verify'), null)
  // Prefix look-alikes must not claim a tab.
  assert.equal(fanNavActiveTab('/fan/passportfoo'), null)
  assert.equal(fanNavActiveTab('/fan/messagesfoo'), null)
  assert.equal(fanNavActiveTab('/fan/profilefoo'), null)
  assert.equal(fanNavActiveTab('/fans'), null)
})

test('fan nav component derives visibility and active state from the helper', () => {
  const nav = read('components/messages/FanMobileBottomNav.vue')
  assert.match(nav, /isFanNavVisible\(route\.path\)/)
  assert.match(nav, /fanNavActiveTab\(route\.path\)/)
  assert.match(nav, /aria-current/)
  // The loose prefix test that put fan nav on /fans is gone.
  assert.doesNotMatch(nav, /startsWith\('\/fan'\)/)
})

test('artist bottom nav yields to the fan section only, not to /fans', () => {
  const nav = read('components/MobileBottomNav.vue')
  assert.match(nav, /isFanSectionPath\(route\.path\)/)
  // The loose prefix hid the artist nav on the artist-facing /fans list.
  assert.doesNotMatch(nav, /route\.path\.startsWith\('\/fan'\)/)
})

test('layout drops app bottom padding on fan auth surfaces', () => {
  const layout = read('layouts/default.vue')
  assert.match(layout, /isFanAuthPath/)
  assert.match(layout, /isFanAuthPath\(route\.path\)/)
})

/* ----------------------------------------------------------- fan login ---- */

test('/fan/login exists and is passwordless', () => {
  assert.equal(exists('pages/fan/login.vue'), true)
  const page = read('pages/fan/login.vue')

  assert.match(page, /Sign in/)
  assert.match(page, /secure sign-in link/)
  assert.match(page, /No password needed\./)
  assert.match(page, /type="email"/)
  assert.doesNotMatch(page, /Welcome back/)

  // No password affordance of any kind. "passwordless" copy is allowed.
  assert.doesNotMatch(page, /type="password"/)
  assert.doesNotMatch(page, /autocomplete="(current|new)-password"/)
  assert.doesNotMatch(page, /forgot-password/i)
  assert.doesNotMatch(page, /password(?!\s*needed|less)/i)
})

test('/fan/login is noindex and uses the dedicated auth shell', () => {
  const page = read('pages/fan/login.vue')
  assert.match(page, /robots: 'noindex, nofollow'/)
  assert.match(page, /layout: 'auth'/)
  assert.match(page, /AuthShell/)

  const shell = read('components/auth/AuthShell.vue')
  assert.match(shell, /100dvh/)
  assert.match(shell, /env\(safe-area-inset-bottom/)
  const field = read('components/auth/AuthField.vue')
  assert.match(field, /height: 52px/)
})

test('fan login reuses the existing request-link endpoint', () => {
  const composable = read('composables/useFanLogin.js')
  assert.match(composable, /\/api\/fan-account\/request-link/)
  assert.match(composable, /method: 'POST'/)
  // No second auth endpoint, and no credential handling on this screen.
  assert.doesNotMatch(composable, /\/api\/auth\/local/)
  assert.doesNotMatch(composable, /fan-account\/verify/)
  assert.doesNotMatch(composable, /password(?!less)/i)
  assert.doesNotMatch(composable, /setToken/)

  const page = read('pages/fan/login.vue')
  assert.match(page, /useFanLogin/)
})

test('fan login keeps the generic non-enumerating response contract', () => {
  const composable = read('composables/useFanLogin.js')
  // Masked email comes from the server; the client never asserts existence.
  assert.match(composable, /emailMasked/)
  assert.doesNotMatch(composable, /not_found|no_account|unknown_email/)
})

test('fan login honours only sanitized internal redirects, including magic-link returnTo', () => {
  const page = read('pages/fan/login.vue')
  assert.match(page, /resolveFanLoginReturnTo/)
  assert.match(page, /returnTo: intendedReturnTo/)
  assert.match(page, /router\.replace/)
})

test('check-email step shows masked address and resend', () => {
  const page = read('pages/fan/login.vue')
  assert.match(page, /Check your email/)
  assert.match(page, /Resend link/)
})

/* ------------------------------------------------------- dead-end links --- */

test('unauthenticated fan surfaces point at /fan/login', () => {
  assert.match(read('pages/fan/index.vue'), /to="\/fan\/login"/)
  assert.match(read('components/passport/FanPassportHome.vue'), /path: '\/fan\/login'/)
  assert.match(read('pages/fan/passport/gallery/[id].vue'), /path: '\/fan\/login'/)
  assert.match(read('components/messages/FanMessagesHome.vue'), /to="\/fan\/login"/)
})

test('no fan surface still routes to the artist password form', () => {
  const fanSurfaces = [
    'pages/fan/index.vue',
    'pages/fan/profile.vue',
    'pages/fan/verify.vue',
    'components/passport/FanPassportHome.vue',
    'pages/fan/passport/gallery/[id].vue',
    'components/messages/FanMessagesHome.vue',
  ]
  for (const rel of fanSurfaces) {
    const source = read(rel)
    assert.doesNotMatch(source, /to="\/login"/, `${rel} still links to /login`)
    assert.doesNotMatch(source, /path: '\/login'/, `${rel} still links to /login`)
  }
})

/* ----------------------------------------------------------- /fan/verify -- */

test('/fan/verify stores the session, redirects to the safe return, and offers recovery', () => {
  const page = read('pages/fan/verify.vue')
  assert.match(page, /\/api\/fan-account\/verify/)
  assert.match(page, /setToken\(jwt\)/)
  assert.match(page, /await fetchUser\(\)/)
  assert.match(page, /FAN_VERIFY_FALLBACK/)

  // Expired / used / invalid all resolve to a usable next step.
  assert.match(page, /token_expired/)
  assert.match(page, /token_used/)
  assert.match(page, /Send a new link/)
  assert.match(page, /to="\/fan\/login"/)

  // Token is still stripped from the address bar after failure.
  assert.match(page, /router\.replace\(\{ path: '\/fan\/verify', query: \{\} \}\)/)
})

test('/fan/verify redirect cannot leave the site', () => {
  const page = read('pages/fan/verify.vue')
  assert.match(page, /resolveFanLoginReturnTo/)
  assert.match(page, /FAN_VERIFY_FALLBACK/)
})

/* --------------------------------------------------- artist login intact -- */

test('generic /login is a universal Artist / Fan gateway', () => {
  const page = read('pages/login.vue')
  const mode = read('components/auth/AuthModeSwitch.vue')
  assert.match(page, /AuthModeSwitch/)
  assert.match(mode, /Artist &amp; Team/)
  assert.match(mode, />\s*Fan\s*</)
  assert.match(page, /useFanLogin/)
  assert.match(page, /Email me a sign-in link/)
  assert.match(page, /No password needed/)
  assert.doesNotMatch(page, /Came from a show/)
  assert.doesNotMatch(page, /google-icon\.png/)
})

test('artist login behaviour is unchanged', () => {
  const page = read('pages/login.vue')
  // Password + Google remain, and still resolve through the same helpers.
  assert.match(page, /id="password"/)
  assert.match(page, /password-toggle/)
  assert.match(page, /login\(\{ identifier, password: values\.password \}\)/)
  assert.match(page, /loginWithGoogle/)
  assert.match(page, /forgot-password/)
  // Default artist destination is still the dashboard.
  assert.match(page, /"\/dashboard"/)
  assert.match(page, /safeFanPostAuthRedirect\(route\.query\.redirect\)/)

  // The artist inbox gate is deliberately still the artist login.
  assert.match(read('components/messages/MessagesHome.vue'), /to="\/login"/)
})

console.log(`\n=== fan auth IA: ${passed} passed ===`)
