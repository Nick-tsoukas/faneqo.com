/**
 * Fan front door + app shell / navigation.
 * Run: node scripts/test-fan-app-shell.mjs
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse, compileScript, compileTemplate } from '@vue/compiler-sfc'
import {
  APP_SHELL,
  headerAccountTo,
  headerForbiddenFanDestinations,
  headerLogoTo,
  headerLogoutTo,
  headerPrimaryLabels,
  headerPrimaryLinks,
  headerSearchCopy,
  headerShowsArtistAdmin,
  headerShowsArtistWorkspaceNav,
  headerShowsTemporaryDeckLink,
  resolveAppShellContext,
  resolveLoginGatewayMode,
} from '../utils/ui/appShell.js'
import { resolveWorkspaceBand } from '../utils/ui/artistWorkspace.js'

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

/* ------------------------------------------------------- route context --- */

test('fan routes are Fan Mode; /fans is not', () => {
  assert.equal(resolveAppShellContext('/fan'), APP_SHELL.FAN)
  assert.equal(resolveAppShellContext('/fan/messages'), APP_SHELL.FAN)
  assert.equal(resolveAppShellContext('/fan/messages/12'), APP_SHELL.FAN)
  assert.equal(resolveAppShellContext('/fan/passport'), APP_SHELL.FAN)
  assert.equal(resolveAppShellContext('/fan/passport/gallery/9'), APP_SHELL.FAN)
  assert.equal(resolveAppShellContext('/fan/profile'), APP_SHELL.FAN)
  assert.equal(resolveAppShellContext('/fans'), APP_SHELL.ARTIST)
  assert.equal(resolveAppShellContext('/fans/recaps/3'), APP_SHELL.ARTIST)
})

test('artist and public routes stay out of Fan Mode', () => {
  assert.equal(resolveAppShellContext('/dashboard'), APP_SHELL.ARTIST)
  assert.equal(resolveAppShellContext('/messages'), APP_SHELL.ARTIST)
  assert.equal(resolveAppShellContext('/galleries'), APP_SHELL.ARTIST)
  assert.equal(resolveAppShellContext('/account'), APP_SHELL.ARTIST)
  assert.equal(resolveAppShellContext('/saved'), APP_SHELL.ARTIST)
  assert.equal(resolveAppShellContext('/badflower'), APP_SHELL.PUBLIC)
  assert.equal(resolveAppShellContext('/'), APP_SHELL.PUBLIC)
})

test('temporary Presentation link is homepage-only, not artist pages', () => {
  assert.equal(headerShowsTemporaryDeckLink('/'), true)
  assert.equal(headerShowsTemporaryDeckLink('/deck'), true)
  assert.equal(headerShowsTemporaryDeckLink('/presentation'), true)
  assert.equal(headerShowsTemporaryDeckLink('/badflower'), false)
  assert.deepEqual(headerPrimaryLabels('/'), ['Home', 'Presentation', 'Signup', 'Login'])
  assert.deepEqual(headerPrimaryLabels('/badflower'), ['Home', 'Signup', 'Login'])
})

test('fan auth routes are their own shell, not authenticated Fan Mode', () => {
  assert.equal(resolveAppShellContext('/fan/login'), APP_SHELL.FAN_AUTH)
  assert.equal(resolveAppShellContext('/fan/verify'), APP_SHELL.FAN_AUTH)
  assert.equal(resolveAppShellContext('/fan/verify?token=abc'), APP_SHELL.FAN_AUTH)
})

/* --------------------------------------------------- desktop fan header -- */

test('fan header destinations are Artists, Messages, Passport, Profile', () => {
  const links = headerPrimaryLinks('/fan', { hasUser: true, userSlug: 'badflower' })
  assert.deepEqual(headerPrimaryLabels('/fan', { hasUser: true, userSlug: 'badflower' }), [
    'Artists',
    'Messages',
    'Passport',
  ])
  assert.deepEqual(links.map((link) => link.to), ['/fan', '/fan/messages', '/fan/passport'])
  assert.equal(headerAccountTo('/fan'), '/fan/profile')
  assert.equal(headerLogoTo('/fan'), '/fan')
  assert.equal(headerLogoutTo('/fan'), '/fan/login')
  assert.equal(headerSearchCopy('/fan'), 'Search artists')
})

test('userSlug does not override Fan Mode (dual-role)', () => {
  const labels = headerPrimaryLabels('/fan/messages', { hasUser: true, userSlug: 'badflower' })
  assert.deepEqual(labels, ['Artists', 'Messages', 'Passport'])
  assert.ok(!labels.includes('Dashboard'))
  assert.ok(!labels.includes('Galleries'))
  assert.ok(!labels.includes('Artist Page'))
  assert.ok(!labels.includes('Account'))
  assert.ok(!labels.includes('Saved'))
  assert.equal(headerShowsArtistAdmin('/fan'), false)
  assert.equal(headerShowsArtistAdmin('/fan/profile'), false)
})

test('fan header forbids artist admin destinations', () => {
  const tos = headerPrimaryLinks('/fan/passport', { hasUser: true, userSlug: 'x' }).map((l) => l.to)
  for (const dest of headerForbiddenFanDestinations()) {
    assert.ok(!tos.includes(dest), `fan header still links ${dest}`)
  }
  assert.notEqual(headerAccountTo('/fan'), '/account')
})

test('artist header still shows Dashboard when the route is artist', () => {
  const labels = headerPrimaryLabels('/dashboard', { hasUser: true, userSlug: 'badflower' })
  assert.ok(labels.includes('Dashboard'))
  assert.ok(labels.includes('Galleries'))
  assert.ok(labels.includes('Artist Page'))
  assert.equal(headerLogoTo('/dashboard'), '/')
  assert.equal(headerLogoutTo('/dashboard'), '/')
  assert.equal(headerAccountTo('/dashboard'), '/account')
  assert.equal(headerSearchCopy('/dashboard'), 'Search bands')
  assert.equal(headerShowsArtistAdmin('/dashboard'), true)
})

test('public artist slug stays public and does not become a fan or artist shell', () => {
  assert.equal(resolveAppShellContext('/badflower'), APP_SHELL.PUBLIC)
  assert.equal(headerLogoTo('/badflower'), '/')
  assert.equal(headerShowsArtistAdmin('/badflower'), false)
  assert.equal(headerShowsArtistWorkspaceNav('/badflower'), false)
  // hasUser + userSlug is not artist capability (F.2 containment).
  const labels = headerPrimaryLabels('/badflower', { hasUser: true, userSlug: 'badflower' })
  assert.deepEqual(labels, ['Artists', 'Messages', 'Passport'])
  assert.ok(!labels.includes('Dashboard'))
  assert.ok(!labels.includes('Galleries'))
  assert.ok(!labels.includes('Artist Page'))
})

test('artist capability does not mutate PUBLIC route context', () => {
  assert.equal(resolveAppShellContext('/burning-thunder'), APP_SHELL.PUBLIC)
  assert.equal(headerShowsArtistAdmin('/burning-thunder'), false)
  assert.equal(
    headerShowsArtistWorkspaceNav('/burning-thunder', { hasArtistWorkspaceAccess: true }),
    true
  )
  assert.equal(resolveAppShellContext('/burning-thunder'), APP_SHELL.PUBLIC)
})

test('artist-capable user gets workspace links on PUBLIC; fan-only does not', () => {
  const artistOpts = {
    hasUser: true,
    hasArtistWorkspaceAccess: true,
    artistSlug: 'burning-thunder',
    userSlug: 'burning-thunder',
  }
  const artistLabels = headerPrimaryLabels('/burning-thunder', artistOpts)
  assert.deepEqual(artistLabels, ['Dashboard', 'Messages', 'Galleries', 'Artist Page'])
  const artistTos = headerPrimaryLinks('/burning-thunder', artistOpts).map((l) => l.to)
  assert.deepEqual(artistTos, ['/dashboard', '/messages', '/galleries', '/burning-thunder'])

  const fanLabels = headerPrimaryLabels('/burning-thunder', { hasUser: true })
  assert.deepEqual(fanLabels, ['Artists', 'Messages', 'Passport'])

  const slugOnly = headerPrimaryLabels('/burning-thunder', {
    hasUser: true,
    userSlug: 'burning-thunder',
  })
  assert.deepEqual(slugOnly, ['Artists', 'Messages', 'Passport'])
})

test('Artist Page destination uses the user artist slug, not the viewed slug', () => {
  const links = headerPrimaryLinks('/other-band', {
    hasUser: true,
    hasArtistWorkspaceAccess: true,
    artistSlug: 'burning-thunder',
    userSlug: 'burning-thunder',
  })
  const artistPage = links.find((l) => l.label === 'Artist Page')
  assert.equal(artistPage?.to, '/burning-thunder')
  assert.ok(!links.some((l) => l.to === '/other-band'))
})

test('/fan/* always wins over artist capability (dual-role)', () => {
  const opts = {
    hasUser: true,
    hasArtistWorkspaceAccess: true,
    artistSlug: 'burning-thunder',
    userSlug: 'burning-thunder',
  }
  assert.deepEqual(headerPrimaryLabels('/fan', opts), ['Artists', 'Messages', 'Passport'])
  assert.deepEqual(headerPrimaryLabels('/fan/messages', opts), ['Artists', 'Messages', 'Passport'])
  assert.equal(headerShowsArtistWorkspaceNav('/fan', opts), false)
  assert.equal(headerShowsArtistAdmin('/fan'), false)
  assert.deepEqual(headerPrimaryLabels('/dashboard', opts).slice(0, 1), ['Dashboard'])
})

test('resolveWorkspaceBand prefers owned, then team; empty access is not capability', () => {
  assert.equal(resolveWorkspaceBand(null), null)
  assert.equal(resolveWorkspaceBand({ owned: [], teamAccess: [] }), null)
  assert.equal(resolveWorkspaceBand({ owned: [{}], teamAccess: [{}] }), null)

  const owned = resolveWorkspaceBand({
    owned: [{ bandId: 1, slug: 'burning-thunder', role: 'owner' }],
    teamAccess: [{ bandId: 2, slug: 'other-band', role: 'manager' }],
  })
  assert.equal(owned.slug, 'burning-thunder')
  assert.equal(owned.bandId, 1)

  const team = resolveWorkspaceBand({
    owned: [],
    teamAccess: [{ bandId: 9, slug: 'managed-band', role: 'manager' }],
  })
  assert.equal(team.slug, 'managed-band')
  assert.equal(team.role, 'manager')
})

/* -------------------------------------------------------------- mobile --- */

test('FanMobileBottomNav still owns Artists, Messages, Passport, Profile', () => {
  const nav = read('components/messages/FanMobileBottomNav.vue')
  assert.match(nav, /to="\/fan"/)
  assert.match(nav, /to="\/fan\/messages"/)
  assert.match(nav, /to="\/fan\/passport"/)
  assert.match(nav, /to="\/fan\/profile"/)
  assert.match(nav, />\s*Artists\s*</)
  assert.match(nav, />\s*Messages\s*</)
  assert.match(nav, />\s*Passport\s*</)
  assert.match(nav, />\s*Profile\s*</)
  assert.match(nav, /isFanNavVisible\(route\.path\)/)
})

test('artist MobileBottomNav still yields to the fan section', () => {
  const nav = read('components/MobileBottomNav.vue')
  assert.match(nav, /isFanSectionPath\(route\.path\)/)
})

test('fan hamburger has no artist Dashboard or admin items', () => {
  const header = read('components/Header.vue')
  assert.match(header, /resolveAppShellContext/)
  assert.match(header, /showArtistChrome/)
  assert.match(header, /isFanHeader/)
  assert.match(header, /Search artists/)
  assert.match(header, /v-if="showArtistChrome"/)
  assert.match(header, /v-if="user && showArtistChrome"/)
  assert.match(header, /to="\/fan\/profile"/)
  assert.match(header, /headerLogoutTo/)
  assert.match(header, /resetFanProfile/)
  // Artist capability still comes from /api/me/band-access, now via the one
  // shared active-workspace helper rather than a second copy in the header.
  assert.match(header, /useWorkspaceBand\(\)/)
  assert.match(header, /hasArtistWorkspaceAccess/)
  const workspaceComposable = read('composables/useWorkspaceBand.js')
  assert.match(workspaceComposable, /getMyBandAccess/)
  assert.match(workspaceComposable, /server:\s*false/)
  assert.doesNotMatch(header, /filters\[users_permissions_user\]\[id\]\[\$eq\]/)
  // Artist destinations remain in the file but only under artist/public chrome.
  assert.match(header, /to="\/dashboard"/)
  assert.match(header, /v-if="showArtistChrome"/)
})

/* ---------------------------------------------------------------- login -- */

test('universal /login keeps artist password + Google, fan uses useFanLogin', () => {
  const page = read('pages/login.vue')
  assert.match(page, /resolveLoginGatewayMode/)
  assert.match(page, /useFanLogin/)
  assert.match(page, /AuthModeSwitch/)
  assert.match(read('components/auth/AuthModeSwitch.vue'), /Artist &amp; Team/)
  assert.match(page, /id="password"/)
  assert.match(page, /loginWithGoogle/)
  assert.match(page, /authAccountSwitchTo\("\/forgot-password"/)
  assert.match(page, /Email me a sign-in link/)
  assert.match(page, /No password needed/)
  assert.match(page, /Resend link/)
  assert.match(page, /Use a different email/)
  assert.match(page, /fanStep === 'form'/)
  assert.doesNotMatch(page, /Came from a show/)
  assert.doesNotMatch(page, /google-icon\.png/)
  assert.equal(resolveLoginGatewayMode({}), 'artist')
  assert.equal(resolveLoginGatewayMode({ as: 'fan' }), 'fan')
  assert.equal(resolveLoginGatewayMode({ as: 'artist' }), 'artist')
  assert.equal(resolveLoginGatewayMode({ redirectIsFan: true }), 'fan')
  assert.equal(resolveLoginGatewayMode({ as: 'artist', redirectIsFan: true }), 'artist')
})

test('dedicated /fan/login stays passwordless and intact', () => {
  const page = read('pages/fan/login.vue')
  assert.match(page, /useFanLogin/)
  assert.match(page, /No password needed\./)
  assert.match(page, /type="email"/)
  assert.doesNotMatch(page, /type="password"/)
  assert.doesNotMatch(page, /forgot-password/i)
  assert.doesNotMatch(page, /loginWithGoogle/)
  assert.doesNotMatch(page, /Artist \/ Team/)
})

test('logout in Fan Mode returns to /fan/login', () => {
  assert.equal(headerLogoutTo('/fan'), '/fan/login')
  assert.equal(headerLogoutTo('/fan/messages'), '/fan/login')
  assert.equal(headerLogoutTo('/dashboard'), '/')
  const header = read('components/Header.vue')
  assert.match(header, /headerLogoutTo\(route\.path\)/)
  assert.match(read('pages/fan/profile.vue'), /router\.replace\('\/fan\/login'\)/)
})

/* -------------------------------------------------------------- home ----- */

test('authenticated fan home does not teach a second device-local artist list', () => {
  const home = read('pages/fan/index.vue')
  assert.doesNotMatch(home, /Saved on this device/)
  assert.doesNotMatch(home, /savedBands/)
  assert.doesNotMatch(home, /Cross-device sync comes with your account/)
  assert.doesNotMatch(home, /to="\/dashboard"/)
  assert.doesNotMatch(home, /to="\/saved"/)
  assert.doesNotMatch(home, /to="\/account"/)
  assert.match(home, /Your Artists/)
})

test('fan Messages CTA says Message an artist', () => {
  const fan = read('components/messages/FanMessagesHome.vue')
  const cta = read('components/messages/MessagesTabCta.vue')
  assert.match(fan, /label="Message an artist"/)
  assert.match(fan, /Message an artist/)
  assert.match(cta, /default: 'New conversation'/)
})

/* ----------------------------------------------------------- compile ----- */

test('touched shell SFCs compile', () => {
  compileSfc('components/Header.vue')
  compileSfc('pages/login.vue')
  compileSfc('pages/fan/login.vue')
  compileSfc('pages/fan/index.vue')
  compileSfc('components/messages/FanMessagesHome.vue')
  compileSfc('components/messages/MessagesTabCta.vue')
  compileSfc('components/messages/FanMobileBottomNav.vue')
})

console.log(`\n=== fan app shell: ${passed} passed ===`)
