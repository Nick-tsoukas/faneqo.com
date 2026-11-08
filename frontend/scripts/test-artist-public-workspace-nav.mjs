/**
 * NAV.1 — authenticated artist workspace escape on PUBLIC pages.
 * Route context stays PUBLIC. Capability, not user existence, unlocks nav.
 * Run: node scripts/test-artist-public-workspace-nav.mjs
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse, compileScript, compileTemplate } from '@vue/compiler-sfc'
import {
  APP_SHELL,
  headerPrimaryLabels,
  headerPrimaryLinks,
  headerShowsArtistAdmin,
  headerShowsArtistWorkspaceNav,
  headerShowsPublicGuestNav,
  resolveAppShellContext,
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

const artistCapable = {
  hasUser: true,
  hasArtistWorkspaceAccess: true,
  artistSlug: 'burning-thunder',
  userSlug: 'burning-thunder',
}

test('CASE A — logged-out PUBLIC keeps guest nav', () => {
  assert.equal(resolveAppShellContext('/burning-thunder'), APP_SHELL.PUBLIC)
  assert.deepEqual(headerPrimaryLabels('/burning-thunder'), ['Home', 'Signup', 'Login'])
  assert.equal(headerShowsPublicGuestNav('/burning-thunder', { hasUser: false }), true)
  assert.equal(headerShowsArtistWorkspaceNav('/burning-thunder'), false)
  assert.equal(headerShowsArtistAdmin('/burning-thunder'), false)
})

test('CASE B — artist-capable on own public page gets workspace destinations', () => {
  const labels = headerPrimaryLabels('/burning-thunder', artistCapable)
  assert.deepEqual(labels, ['Dashboard', 'Messages', 'Galleries', 'Artist Page'])
  const tos = headerPrimaryLinks('/burning-thunder', artistCapable).map((l) => l.to)
  assert.deepEqual(tos, ['/dashboard', '/messages', '/galleries', '/burning-thunder'])
  assert.equal(headerShowsArtistWorkspaceNav('/burning-thunder', artistCapable), true)
  assert.equal(resolveAppShellContext('/burning-thunder'), APP_SHELL.PUBLIC)
})

test('CASE C — artist on another public page still links to THEIR artist slug', () => {
  const links = headerPrimaryLinks('/other-band', artistCapable)
  assert.equal(links.find((l) => l.label === 'Artist Page')?.to, '/burning-thunder')
  assert.ok(!links.some((l) => l.to === '/other-band'))
  assert.ok(links.some((l) => l.to === '/dashboard'))
})

test('CASE D — fan-only authenticated user does not get artist chrome', () => {
  const opts = { hasUser: true }
  assert.deepEqual(headerPrimaryLabels('/burning-thunder', opts), ['Artists', 'Messages', 'Passport'])
  assert.equal(headerShowsArtistWorkspaceNav('/burning-thunder', opts), false)
  assert.equal(headerShowsPublicGuestNav('/burning-thunder', opts), false)
})

test('authenticated user + userSlug still is not artist proof', () => {
  const opts = { hasUser: true, userSlug: 'burning-thunder' }
  assert.deepEqual(headerPrimaryLabels('/burning-thunder', opts), ['Artists', 'Messages', 'Passport'])
  assert.equal(headerShowsArtistWorkspaceNav('/burning-thunder', opts), false)
})

test('CASE E — dual-role: /fan/* wins; public may expose workspace; artist routes stay artist', () => {
  assert.deepEqual(headerPrimaryLabels('/fan', artistCapable), ['Artists', 'Messages', 'Passport'])
  assert.deepEqual(headerPrimaryLabels('/fan/messages', artistCapable), [
    'Artists',
    'Messages',
    'Passport',
  ])
  assert.equal(headerShowsArtistWorkspaceNav('/fan', artistCapable), false)
  assert.equal(headerShowsArtistAdmin('/fan'), false)

  assert.deepEqual(headerPrimaryLabels('/burning-thunder', artistCapable), [
    'Dashboard',
    'Messages',
    'Galleries',
    'Artist Page',
  ])
  assert.equal(resolveAppShellContext('/burning-thunder'), APP_SHELL.PUBLIC)

  assert.ok(headerPrimaryLabels('/dashboard', artistCapable).includes('Dashboard'))
  assert.ok(headerPrimaryLabels('/messages', artistCapable).includes('Messages'))
  assert.equal(headerShowsArtistAdmin('/dashboard'), true)
  assert.equal(headerShowsArtistAdmin('/messages'), true)
})

test('Header mobile artist entries stay gated by showArtistChrome', () => {
  const header = read('components/Header.vue')
  assert.match(header, /v-if="showArtistChrome"/)
  assert.match(header, /to="\/dashboard"/)
  // Band-aware since Multi-Band Workspace: carries ?bandId= when scoped.
  assert.match(header, /:to="galleriesPath"/)
  assert.match(header, />My Artist Page</)
  assert.match(header, /to="\/account"/)
  assert.match(header, /headerShowsArtistWorkspaceNav/)
  assert.match(header, /resolveWorkspaceBand/)
  // The band-access fetch moved into the one shared active-workspace helper so
  // a single useAsyncData key cannot have two competing handlers.
  assert.match(header, /useWorkspaceBand\(\)/)
  const workspaceComposable = read('composables/useWorkspaceBand.js')
  assert.match(workspaceComposable, /getMyBandAccess/)
  assert.match(workspaceComposable, /server:\s*false/)
  assert.match(workspaceComposable, /token\.value/)
  assert.match(header, /refreshBandAccess/)
})

test('workspace band prefers owned over team; team-only still has access', () => {
  assert.equal(resolveWorkspaceBand({ owned: [], teamAccess: [] }), null)

  const mixed = resolveWorkspaceBand({
    owned: [{ bandId: 1, slug: 'burning-thunder', role: 'owner' }],
    teamAccess: [{ bandId: 2, slug: 'viewed-band', role: 'viewer' }],
  })
  assert.equal(mixed.slug, 'burning-thunder')

  const manager = resolveWorkspaceBand({
    owned: [],
    teamAccess: [{ bandId: 4, slug: 'managed-act', role: 'manager' }],
  })
  assert.equal(manager.slug, 'managed-act')
  assert.equal(manager.role, 'manager')
})

test('a new band refreshes workspace access before its artist page renders', () => {
  // Creating a band changes neither user id nor token, so the cached
  // /api/me/band-access answer (owned: []) would otherwise outlive it.
  const createband = read('pages/createband.vue')
  assert.match(createband, /await refreshWorkspaceAccess\(\);[\s\S]{0,200}router\.push\(target\)/)
  const composable = read('composables/useWorkspaceBand.js')
  assert.match(composable, /export function refreshWorkspaceAccess\(\)[\s\S]{0,80}refreshNuxtData\(\[ACCESS_KEY, 'user-band-nav'\]\)/)
  // Accepting a team invite is the same situation.
  assert.match(read('pages/invite/accept.vue'), /refreshWorkspaceAccess\(\)/)
  // Still one fetch definition for the shared key.
  assert.equal([...composable.matchAll(/useAsyncData\(\s*ACCESS_KEY/g)].length, 1)
  assert.doesNotMatch(read('components/Header.vue'), /useAsyncData\(\s*['"]user-band-access/)
})

test('capability counts only an answer fetched for the account signed in now', () => {
  const composable = read('composables/useWorkspaceBand.js')
  assert.match(composable, /return \{ \.\.\.payload, forUserId: userId \}/)
  assert.match(composable, /String\(access\.value\?\.forUserId \?\? ''\) === String\(user\.value\.id\)/)
})

test('unresolved capability shows no fan links on public pages', () => {
  const header = read('components/Header.vue')
  assert.match(header, /bandAccessResolved\.value \? resolveWorkspaceBand\(bandAccess\.value\) : null/)
  assert.match(header, /const capabilityPending = computed\(\(\) => !!user\.value && !bandAccessResolved\.value\)/)
  assert.match(header, /!capabilityPending\.value && headerShowsFanPublicNav/)
  assert.match(header, /if \(isPublicHeader\.value && capabilityPending\.value\) return \[\]/)
  // /fan/* stays fan-facing for a dual-role artist; /fans is the artist workspace.
  assert.deepEqual(headerPrimaryLabels('/fan/passport', { hasUser: true, hasArtistWorkspaceAccess: true }), ['Artists', 'Messages', 'Passport'])
  assert.equal(resolveAppShellContext('/fans'), APP_SHELL.ARTIST)
})

test('touched SFCs compile', () => {
  compileSfc('components/Header.vue')
  compileSfc('pages/createband.vue')
  compileSfc('pages/invite/accept.vue')
})

console.log(`\n=== artist public workspace nav: ${passed} passed ===`)
