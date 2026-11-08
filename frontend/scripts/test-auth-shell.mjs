/**
 * Auth shell — dedicated chrome, safe returnTo, shared primitives.
 * Run: node scripts/test-auth-shell.mjs
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse, compileScript, compileTemplate } from '@vue/compiler-sfc'
import {
  AUTH_PRESENTATION_PATHS,
  authAccountSwitchTo,
  firstReturnQuery,
  isAuthPresentationPath,
  readSafeAuthReturnTo,
  sanitizeAuthReturnTo,
  withAuthReturnTo,
} from '../utils/auth/safeAuthReturnTo.js'
import { sanitizeFanReturnTo } from '../utils/fan/safeFanReturnTo.js'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8')

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

let passed = 0
function test(name, fn) {
  fn()
  passed += 1
  console.log(`  ✅ ${name}`)
}

const AUTH_PAGES = [
  'pages/login.vue',
  'pages/signup.vue',
  'pages/forgot-password.vue',
  'pages/reset-password.vue',
  'pages/fan/login.vue',
  'pages/fan/verify.vue',
  'pages/signupSuccess.vue',
]

test('auth presentation paths are complete and loop-rejected', () => {
  for (const dest of [
    '/login',
    '/signup',
    '/forgot-password',
    '/reset-password',
    '/fan/login',
    '/fan/verify',
    '/signupSuccess',
    '/signupCancelled',
  ]) {
    assert.equal(isAuthPresentationPath(dest), true, dest)
    assert.equal(sanitizeAuthReturnTo(dest, { fallback: null }), null, dest)
  }
  assert.ok(AUTH_PRESENTATION_PATHS.includes('/login'))
})

test('sanitizeAuthReturnTo reuses the fan sanitizer and rejects off-site / protocol-relative', () => {
  const rejected = [
    'https://evil.com',
    '//evil.com',
    '//domain.com',
    'javascript:alert(1)',
    '/../etc',
  ]
  for (const value of rejected) {
    assert.equal(sanitizeAuthReturnTo(value, { fallback: null }), null, value)
    assert.equal(sanitizeFanReturnTo(value, { fallback: null }), null, value)
  }
  // Nested query is not itself a destination; the auth-path wrapper is rejected.
  assert.equal(sanitizeAuthReturnTo('/login?redirect=https://evil.com', { fallback: null }), null)
  assert.equal(readSafeAuthReturnTo({ redirect: 'https://evil.com' }, { fallback: null }), null)
  assert.equal(readSafeAuthReturnTo({ returnTo: '//domain.com' }, { fallback: null }), null)
})

test('valid internal returnTo is preserved after login (artist, night, gallery, fan)', () => {
  const allowed = [
    '/badflower',
    '/badflower/night/nashville-sep-5',
    '/badflower/gallery/show-photos',
    '/fan/passport',
    '/messages',
    '/dashboard',
  ]
  for (const dest of allowed) {
    assert.equal(sanitizeAuthReturnTo(dest), dest, dest)
  }
})

test('firstReturnQuery prefers redirect then returnTo', () => {
  assert.equal(firstReturnQuery({ redirect: '/badflower', returnTo: '/fan' }), '/badflower')
  assert.equal(firstReturnQuery({ returnTo: '/badflower' }), '/badflower')
  assert.equal(
    readSafeAuthReturnTo({ redirect: '//evil.com' }, { fallback: '/dashboard' }),
    '/dashboard'
  )
})

test('withAuthReturnTo carries a safe from-path and leaves homepage bare', () => {
  assert.equal(withAuthReturnTo('/login', '/'), '/login')
  assert.deepEqual(withAuthReturnTo('/login', '/badflower/night/x'), {
    path: '/login',
    query: { redirect: '/badflower/night/x' },
  })
  assert.equal(withAuthReturnTo('/login', 'https://evil.com'), '/login')
  assert.equal(withAuthReturnTo('/login', '/login'), '/login')
  assert.deepEqual(withAuthReturnTo('/signup', '/badflower'), {
    path: '/signup',
    query: { redirect: '/badflower' },
  })
})

test('account-switch links preserve redirect / returnTo / as', () => {
  assert.deepEqual(authAccountSwitchTo('/signup', { redirect: '/badflower', as: 'fan' }), {
    path: '/signup',
    query: { redirect: '/badflower', as: 'fan' },
  })
  assert.equal(authAccountSwitchTo('/login', {}), '/login')
})

test('auth pages use the dedicated auth layout and AuthShell', () => {
  for (const rel of AUTH_PAGES) {
    const source = read(rel)
    assert.match(source, /layout:\s*['"]auth['"]/, `${rel} missing auth layout`)
    assert.match(source, /AuthShell/, `${rel} missing AuthShell`)
    assert.doesNotMatch(source, /Welcome Back/, `${rel} still has Welcome Back`)
    assert.doesNotMatch(source, /Sign in as an artist or team member/, rel)
    assert.doesNotMatch(source, /or continue with/, rel)
    assert.doesNotMatch(source, /Search Bands/, rel)
    assert.doesNotMatch(source, /<Header/, rel)
  }

  const layout = read('layouts/auth.vue')
  assert.match(layout, /<Header/)
  assert.match(layout, /hidden lg:block/)
  assert.match(layout, /auth-layout__nav/)
  assert.doesNotMatch(layout, /Explore Faneqo/)
})

test('login hierarchy, mode switch, and Google stay on the existing helpers', () => {
  const page = read('pages/login.vue')
  assert.match(page, /<h1 class="auth-title">Sign in<\/h1>/)
  assert.match(page, /AuthModeSwitch/)
  assert.match(page, /AuthSocialButton/)
  assert.match(page, /autocomplete="email"/)
  assert.match(page, /autocomplete="current-password"/)
  assert.match(page, /loginWithGoogle\(\{ postLoginPath: resolvePostLoginPath\(\) \}\)/)
  assert.match(page, /sanitizeAuthReturnTo\(firstReturnQuery\(route\.query\)/)
  assert.match(page, /safeFanPostAuthRedirect/)
  assert.match(page, /"\/dashboard"/)
  assert.match(page, /New to Faneqo\?/)
  assert.match(page, /Create account/)
})

test('signup inherits the same shell, then signs in and opens the dashboard', () => {
  const page = read('pages/signup.vue')
  assert.match(page, /<h1 class="auth-title">Create your artist account<\/h1>/)
  assert.doesNotMatch(page, /auth-title--signup/)
  assert.match(page, /registerUser/)
  assert.match(page, /await login\(\{ identifier: email, password \}\)/)
  assert.match(page, /"\/dashboard"/)
  assert.match(page, /activateInviteFromRedirectParam/)
  assert.match(page, /loginWithGoogle/)
  assert.match(page, /autocomplete="new-password"/)
  assert.match(page, /Already have an account\?/)
  assert.doesNotMatch(page, /alert\(`✅ Welcome/)
  // Honeypot still leaves without creating a session.
  assert.match(page, /\/signupSuccess/)
})

test('Header guest Login / Signup carry a sanitized return', () => {
  const header = read('components/Header.vue')
  assert.match(header, /withAuthReturnTo/)
  assert.match(header, /guestLoginTo/)
  assert.match(header, /guestSignupTo/)
  assert.match(header, /:to="guestLoginTo"/)
  assert.match(header, /:to="guestSignupTo"/)
})

test('auth primitives keep native-field quality', () => {
  const field = read('components/auth/AuthField.vue')
  assert.match(field, /font-size: 1rem/)
  assert.match(field, /height: 52px/)
  assert.match(field, /Show password/)
  assert.match(field, /Hide password/)
  assert.match(field, /width: 44px/)
  assert.match(field, /height: 44px/)
  assert.match(field, /prefers-reduced-motion/)
  assert.match(field, /border-color: rgba\(192, 132, 252, 0\.58\)/)

  const social = read('components/auth/AuthSocialButton.vue')
  assert.match(social, /Continue with Google/)
  assert.match(social, /height: 52px/)

  const shell = read('components/auth/AuthShell.vue')
  assert.match(shell, /to="\/"/)
  assert.match(shell, /src="\/faneqo-logo\.png"/)
  assert.match(shell, /560 \/ 748/)
  assert.match(shell, /auth-shell__brand/)
  assert.match(shell, /They need fans/)
  assert.match(shell, /auth-shell__brand-copy-end/)
  assert.match(shell, /readSafeAuthReturnTo/)
  assert.match(shell, /#050506/)
  assert.match(shell, /min-height: calc\(100dvh - var\(--header-height\)\)/)
  assert.match(shell, /27\.5rem/)
  assert.match(shell, /faneqo-wordmark\.svg/)
  assert.doesNotMatch(shell, /Explore Faneqo/)
  assert.doesNotMatch(shell, /Search [Bb]ands/)
  assert.doesNotMatch(shell, /radial-gradient/)
  assert.doesNotMatch(shell, /auth-shell__brand::before/)
  assert.doesNotMatch(shell, /drop-shadow/)
  assert.doesNotMatch(shell, /<Header/)
})

test('auth submit mark is CSS-only until a dedicated .riv exists', () => {
  const mark = read('components/auth/AuthSubmitMark.vue')
  assert.match(mark, /faneqo-auth-submit\.riv/)
  assert.doesNotMatch(mark, /import FaneqoRive/)
  assert.doesNotMatch(mark, /@rive-app/)
  assert.match(read('pages/login.vue'), /AuthSubmitMark/)
  assert.match(read('pages/signup.vue'), /AuthSubmitMark/)
})

test('touched auth SFCs compile', () => {
  compileSfc('components/auth/AuthShell.vue')
  compileSfc('components/auth/AuthField.vue')
  compileSfc('components/auth/AuthModeSwitch.vue')
  compileSfc('components/auth/AuthSocialButton.vue')
  compileSfc('layouts/auth.vue')
  compileSfc('components/auth/AuthSubmitMark.vue')
  for (const rel of AUTH_PAGES) compileSfc(rel)
})

console.log(`\n=== auth shell: ${passed} passed ===`)
