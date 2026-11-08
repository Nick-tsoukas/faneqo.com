/**
 * Logged-in fans keep a way home on public Home / Artist Page.
 * Run: node scripts/test-fan-public-nav.mjs
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  headerPrimaryLabels,
  headerShowsArtistWorkspaceNav,
  headerShowsFanPublicNav,
  headerShowsPublicGuestNav,
} from '../utils/ui/appShell.js'
import { isFanNavVisible } from '../utils/ui/fanNav.js'

const here = dirname(fileURLToPath(import.meta.url))
const read = (rel) => readFileSync(resolve(here, '..', rel), 'utf8')

let passed = 0
function test(name, fn) {
  fn()
  passed += 1
  console.log(`  ok  ${name}`)
}

const fanOnly = { hasUser: true }
const artist = {
  hasUser: true,
  hasArtistWorkspaceAccess: true,
  artistSlug: 'burning-thunder',
  userSlug: 'burning-thunder',
}

test('logged-in fan keeps Passport navigation on Home and Artist Page', () => {
  assert.deepEqual(headerPrimaryLabels('/', fanOnly), ['Presentation', 'Artists', 'Messages', 'Passport'])
  assert.deepEqual(headerPrimaryLabels('/badflower', fanOnly), ['Artists', 'Messages', 'Passport'])
  assert.equal(headerShowsFanPublicNav('/', fanOnly), true)
  assert.equal(headerShowsFanPublicNav('/badflower', fanOnly), true)
})

test('anonymous public chrome is unchanged', () => {
  assert.deepEqual(headerPrimaryLabels('/'), ['Home', 'Presentation', 'Signup', 'Login'])
  assert.deepEqual(headerPrimaryLabels('/deck'), ['Home', 'Presentation', 'Signup', 'Login'])
  assert.deepEqual(headerPrimaryLabels('/badflower'), ['Home', 'Signup', 'Login'])
  assert.equal(headerShowsPublicGuestNav('/', { hasUser: false }), true)
  assert.equal(headerShowsFanPublicNav('/', { hasUser: false }), false)
})

test('artist-owner public chrome stays workspace, not fan tabs', () => {
  assert.deepEqual(headerPrimaryLabels('/badflower', artist), [
    'Dashboard',
    'Messages',
    'Galleries',
    'Artist Page',
  ])
  assert.equal(headerShowsFanPublicNav('/badflower', artist), false)
  assert.equal(headerShowsArtistWorkspaceNav('/badflower', artist), true)
})

test('fan bottom nav still only lives on /fan app routes', () => {
  assert.equal(isFanNavVisible('/fan'), true)
  assert.equal(isFanNavVisible('/fan/passport'), true)
  assert.equal(isFanNavVisible('/fan/messages'), true)
  assert.equal(isFanNavVisible('/'), false)
  assert.equal(isFanNavVisible('/badflower'), false)
  assert.equal(isFanNavVisible('/badflower/night/nashville'), false)
})

test('Header hamburger exposes fan destinations on public pages', () => {
  const header = read('components/Header.vue')
  assert.match(header, /headerShowsFanPublicNav/)
  assert.match(header, /showFanPublicChrome/)
  assert.match(header, /to="\/fan\/passport"/)
  assert.match(header, /to="\/fan\/messages"/)
  assert.match(header, /to="\/fan"/)
  assert.match(header, /to="\/fan\/profile"/)
})

test('Native Follow action path is independent of this header chrome', () => {
  const page = read('pages/[bandSlug]/index.vue')
  const follow = read('composables/useArtistPageFollow.js')
  assert.match(page, /onFollowAction/)
  assert.match(follow, /\/api\/fan-account\/artists\/\$\{bandId\.value\}\/follow/)
  assert.doesNotMatch(follow, /headerPrimaryLinks/)
  assert.doesNotMatch(page, /headerShowsFanPublicNav/)
})

console.log(`test-fan-public-nav: ${passed} passed`)
