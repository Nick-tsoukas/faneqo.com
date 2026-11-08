/**
 * F.2 — Fan App auth boundary, return sanitization, public shell, Saved.
 * Run: node scripts/test-fan-auth-boundary.mjs
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse, compileScript, compileTemplate } from '@vue/compiler-sfc'
import { isFanAppAuthPath, isFanAuthPath } from '../utils/ui/appSurface.js'
import {
  FAN_VERIFY_FALLBACK,
  fanLoginLocation,
  isFanOrientedReturnTo,
  isSafeFanReturnTo,
  resolveFanLoginReturnTo,
  sanitizeFanReturnTo,
} from '../utils/fan/safeFanReturnTo.js'
import {
  APP_SHELL,
  headerAccountTo,
  headerPrimaryLabels,
  headerShowsArtistAdmin,
  headerShowsArtistWorkspaceNav,
  headerShowsPublicGuestNav,
  resolveAppShellContext,
} from '../utils/ui/appShell.js'

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

/* ----------------------------------------------------- FAN AUTH BOUNDARY -- */

test('fan app routes sit inside the auth boundary; login/verify do not', () => {
  for (const dest of ['/fan', '/fan/messages', '/fan/messages/123', '/fan/passport', '/fan/profile']) {
    assert.equal(isFanAppAuthPath(dest), true, dest)
    const login = fanLoginLocation(dest)
    assert.equal(login.path, '/fan/login')
    assert.equal(login.query.redirect, dest)
  }
  assert.equal(isFanAuthPath('/fan/login'), true)
  assert.equal(isFanAuthPath('/fan/verify'), true)
  assert.equal(isFanAppAuthPath('/fan/login'), false)
  assert.equal(isFanAppAuthPath('/fan/verify'), false)
  assert.equal(isFanAppAuthPath('/dashboard'), false)
  assert.equal(isFanAppAuthPath('/badflower'), false)
  assert.equal(isFanAppAuthPath('/fans'), false)
})

test('fan-auth middleware is global, hydrates pending tokens, and skips auth surfaces', () => {
  const mw = read('middleware/fan-auth.global.ts')
  assert.match(mw, /isFanAppAuthPath/)
  assert.match(mw, /fanLoginLocation/)
  assert.match(mw, /useStrapiToken/)
  assert.match(mw, /fetchUser/)
  assert.match(mw, /replace: true/)
  assert.doesNotMatch(mw, /navigateTo\('\/'\)/)
  assert.doesNotMatch(mw, /userSlug/)
})

test('login and verify pages are not wrapped in the fan-auth boundary', () => {
  assert.doesNotMatch(read('pages/fan/login.vue'), /middleware:\s*['"]fan-auth['"]/)
  assert.doesNotMatch(read('pages/fan/verify.vue'), /middleware:\s*['"]fan-auth['"]/)
})

/* --------------------------------------------------- RETURN SANITIZATION -- */

test('sanitizeFanReturnTo allows safe internal fan and gallery paths', () => {
  assert.equal(sanitizeFanReturnTo('/fan'), '/fan')
  assert.equal(sanitizeFanReturnTo('/fan/passport'), '/fan/passport')
  assert.equal(sanitizeFanReturnTo('/fan/messages/123'), '/fan/messages/123')
  assert.equal(sanitizeFanReturnTo('/artist-slug/updates/gallery-slug'), '/artist-slug/updates/gallery-slug')
  assert.equal(sanitizeFanReturnTo('/artist-slug/gallery/gallery-slug'), '/artist-slug/gallery/gallery-slug')
  assert.equal(sanitizeFanReturnTo('/artist-slug/night/nashville-sep-5'), '/artist-slug/night/nashville-sep-5')
  assert.equal(sanitizeFanReturnTo('/fan/passport?from=show'), '/fan/passport?from=show')
  assert.equal(sanitizeFanReturnTo('/the-rockers?feq_intent=follow'), '/the-rockers?feq_intent=follow')
  assert.equal(isSafeFanReturnTo('/fan/passport'), true)
})

test('sanitizeFanReturnTo rejects external, scheme, traversal, and control tricks', () => {
  const rejected = [
    'https://evil.com',
    '//evil.com',
    '\\evil',
    'javascript:alert(1)',
    '/fan/../../../etc',
    '/fan/%2e%2e/dashboard',
    '/fan/thing\\evil',
    '/fan/\r\nLocation: https://evil.com',
    'https://evil.com/fan',
    '/fan/login',
    '/fan/verify?token=abc',
  ]
  for (const value of rejected) {
    assert.equal(sanitizeFanReturnTo(value), '/fan', value)
    assert.equal(isSafeFanReturnTo(value), false, value)
  }
  assert.equal(sanitizeFanReturnTo(''), '/fan')
  assert.equal(sanitizeFanReturnTo(null, { fallback: FAN_VERIFY_FALLBACK }), FAN_VERIFY_FALLBACK)
})

test('legacy Passport Night login returns to Passport home, not a Night', () => {
  assert.equal(resolveFanLoginReturnTo('/fan/passport'), '/fan/passport')
  assert.equal(resolveFanLoginReturnTo('/fan/passport/nights/18'), '/fan/passport')
  assert.equal(resolveFanLoginReturnTo('/the-rockers/night/the-rad-spot'), '/the-rockers/night/the-rad-spot')
  assert.equal(fanLoginLocation('/fan/passport/nights/18').query.redirect, '/fan/passport')
  assert.equal(fanLoginLocation('/the-rockers/night/the-rad-spot').query.redirect, '/the-rockers/night/the-rad-spot')
  assert.equal(sanitizeFanReturnTo('/fan/passport/nights/18'), '/fan/passport/nights/18')
})

test('login gateway treats /fan and durable galleries as fan-oriented returns', () => {
  assert.equal(isFanOrientedReturnTo('/fan/passport'), true)
  assert.equal(isFanOrientedReturnTo('/artist-slug/updates/gallery-slug'), true)
  assert.equal(isFanOrientedReturnTo('/artist-slug/gallery/gallery-slug'), true)
  assert.equal(isFanOrientedReturnTo('/artist-slug/night/nashville-sep-5'), true)
  assert.equal(isFanOrientedReturnTo('/dashboard'), false)
  assert.equal(isFanOrientedReturnTo('https://evil.com'), false)
})

/* ----------------------------------------------------------- MAGIC LINK -- */

test('useFanLogin and conversion requestLink send sanitized returnTo', () => {
  const login = read('composables/useFanLogin.js')
  assert.match(login, /sanitizeFanReturnTo/)
  assert.match(login, /body\.returnTo/)
  assert.match(login, /\/api\/fan-account\/request-link/)

  const conversion = read('composables/useFanAccountConversion.js')
  assert.match(conversion, /async function requestLink\(\{ email, returnTo \}/)
  assert.match(conversion, /body\.returnTo/)

  assert.match(read('pages/fan/login.vue'), /returnTo: intendedReturnTo/)
  assert.match(read('pages/login.vue'), /sendFanLink\(\{ returnTo:/)
  assert.match(read('components/fan/FanAccountPrompt.vue'), /context\?\.returnTo \|\| route\.fullPath/)
})

test('/fan/verify uses the backend redirect through the shared sanitizer', () => {
  const page = read('pages/fan/verify.vue')
  assert.match(page, /resolveFanLoginReturnTo\(res\?\.data\?\.redirectTo/)
  assert.match(page, /FAN_VERIFY_FALLBACK/)
  assert.match(page, /router\.replace/)
  assert.doesNotMatch(page, /internalDestination/)
})

/* ---------------------------------------------------------- PUBLIC SHELL -- */

test('logged-in PUBLIC route does not expose artist admin destinations', () => {
  assert.equal(resolveAppShellContext('/badflower'), APP_SHELL.PUBLIC)
  assert.equal(headerShowsArtistAdmin('/badflower'), false)
  assert.equal(headerShowsArtistWorkspaceNav('/badflower'), false)
  assert.equal(headerShowsPublicGuestNav('/badflower', { hasUser: true }), false)
  assert.equal(headerShowsPublicGuestNav('/badflower', { hasUser: false }), true)

  const labels = headerPrimaryLabels('/badflower', { hasUser: true, userSlug: 'badflower' })
  assert.deepEqual(labels, ['Artists', 'Messages', 'Passport'])
  assert.ok(!labels.includes('Dashboard'))
  assert.ok(!labels.includes('Galleries'))
  assert.ok(!labels.includes('Artist Page'))
  assert.ok(!labels.includes('Account'))
  assert.equal(headerAccountTo('/badflower'), '/account')
})

test('Header drives public containment from appShell helpers', () => {
  const header = read('components/Header.vue')
  assert.match(header, /headerShowsArtistWorkspaceNav/)
  assert.match(header, /hasArtistWorkspaceAccess/)
  assert.match(header, /headerShowsPublicGuestNav/)
  assert.match(header, /headerShowsFanPublicNav/)
  // Band access is fetched by the shared active-workspace helper.
  assert.match(header, /useWorkspaceBand\(\)/)
  assert.match(read('composables/useWorkspaceBand.js'), /getMyBandAccess/)
  assert.doesNotMatch(header, /APP_SHELL\.ARTIST \|\| ctx === APP_SHELL\.PUBLIC/)
  assert.doesNotMatch(header, /filters\[users_permissions_user\]\[id\]\[\$eq\]/)
})

/* ------------------------------------------------------------- DUAL ROLE -- */

test('userSlug present on /fan still resolves FAN; artist and public stay themselves', () => {
  assert.equal(resolveAppShellContext('/fan'), APP_SHELL.FAN)
  assert.equal(resolveAppShellContext('/fan/passport'), APP_SHELL.FAN)
  assert.equal(resolveAppShellContext('/dashboard'), APP_SHELL.ARTIST)
  assert.equal(resolveAppShellContext('/messages'), APP_SHELL.ARTIST)
  assert.equal(resolveAppShellContext('/badflower'), APP_SHELL.PUBLIC)
  assert.equal(headerShowsArtistAdmin('/fan'), false)
  assert.equal(headerShowsArtistAdmin('/dashboard'), true)
  const fanLabels = headerPrimaryLabels('/fan', { hasUser: true, userSlug: 'badflower' })
  assert.deepEqual(fanLabels, ['Artists', 'Messages', 'Passport'])
  assert.ok(!fanLabels.includes('Dashboard'))
})

test('dashboard is not guessed from missing userSlug', () => {
  assert.doesNotMatch(read('pages/dashboard/index.vue'), /redirect\('\/fan'\)/)
  assert.doesNotMatch(read('pages/dashboard/index.vue'), /hasArtistWorkspace/)
  assert.doesNotMatch(read('middleware/fan-auth.global.ts'), /\/dashboard/)
})

/* ---------------------------------------------------------------- SAVED -- */

test('authenticated /fan does not render browser-local Saved section', () => {
  const home = read('pages/fan/index.vue')
  assert.doesNotMatch(home, /Saved on this device/)
  assert.doesNotMatch(home, /savedBands/)
  assert.doesNotMatch(home, /useSavedBands/)
  assert.match(home, /Your Artists/)
  assert.match(home, /to="\/fan\/messages"/)
  assert.match(home, /to="\/fan\/passport"/)
  assert.match(home, /to="\/fan\/profile"/)
})

/* -------------------------------------------------------------- compile -- */

test('touched F.2 SFCs compile', () => {
  compileSfc('components/Header.vue')
  compileSfc('pages/login.vue')
  compileSfc('pages/fan/login.vue')
  compileSfc('pages/fan/verify.vue')
  compileSfc('pages/fan/index.vue')
  compileSfc('pages/fan/profile.vue')
  compileSfc('components/fan/FanAccountPrompt.vue')
  compileSfc('pages/[bandSlug]/updates/[slug].vue')
})

console.log(`\n=== fan auth boundary: ${passed} passed ===`)
