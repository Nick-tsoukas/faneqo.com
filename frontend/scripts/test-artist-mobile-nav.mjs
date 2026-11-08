/**
 * Artist mobile bottom-nav: routes, dock language, a11y.
 * Run: node scripts/test-artist-mobile-nav.mjs
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse, compileScript, compileTemplate } from '@vue/compiler-sfc'
import {
  ARTIST_NAV_TABS,
  artistNavActiveTab,
  artistNavPreviewTab,
} from '../utils/ui/artistNav.js'

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
  console.log(`  ok  ${name}`)
}

const ctx = { slug: 'the-rockers', bandId: 42 }

test('dashboard and nested dashboard routes activate Dashboard', () => {
  assert.equal(artistNavActiveTab('/dashboard', ctx), 'dashboard')
  assert.equal(artistNavActiveTab('/dashboard/fans/9', ctx), 'dashboard')
  assert.equal(artistNavActiveTab('/dashboard/team/42', ctx), 'dashboard')
})

test('messages home and threads activate Messages', () => {
  assert.equal(artistNavActiveTab('/messages', ctx), 'messages')
  assert.equal(artistNavActiveTab('/messages/inbox/12', ctx), 'messages')
  assert.equal(artistNavActiveTab('/messages/compose', ctx), 'messages')
})

test('artist page and nested artist-world paths activate Artist', () => {
  assert.equal(artistNavActiveTab('/the-rockers', ctx), 'artist')
  assert.equal(artistNavActiveTab('/the-rockers/event/tonight', ctx), 'artist')
  assert.equal(artistNavActiveTab('/other-band', ctx), null)
})

test('analytics and child analytics routes activate Analytics', () => {
  assert.equal(artistNavActiveTab('/analytics/42', ctx), 'analytics')
  assert.equal(artistNavActiveTab('/analytics/42/qr', ctx), 'analytics')
  assert.equal(artistNavActiveTab('/analytics/99', ctx), null)
})

test('unclaimed workspace routes have no active tab', () => {
  assert.equal(artistNavActiveTab('/fans/recaps/8', ctx), null)
  assert.equal(artistNavActiveTab('/galleries', ctx), null)
  assert.equal(artistNavActiveTab('/editband/42', ctx), null)
  assert.equal(artistNavActiveTab('/__dev/artist-recap', ctx), null)
})

test('reserved prefixes win over a colliding artist slug', () => {
  const collision = { slug: 'dashboard', bandId: 1 }
  assert.equal(artistNavActiveTab('/dashboard', collision), 'dashboard')
  assert.equal(artistNavActiveTab('/messages', collision), 'messages')
})

test('preview tab helper only accepts known tabs', () => {
  assert.deepEqual(ARTIST_NAV_TABS, ['dashboard', 'messages', 'artist', 'analytics'])
  assert.equal(artistNavPreviewTab('dashboard'), 'dashboard')
  assert.equal(artistNavPreviewTab('share'), null)
  assert.equal(artistNavPreviewTab('insights'), null)
})

test('MobileBottomNav compiles and keeps hide + share contracts', () => {
  compileSfc('components/MobileBottomNav.vue')
  const nav = read('components/MobileBottomNav.vue')
  assert.match(nav, /isFanSectionPath\(route\.path\)/)
  assert.match(nav, /isImmersiveMessagesPath\(route\.path\)/)
  assert.doesNotMatch(nav, /route\.path\.startsWith\('\/fan'\)/)
  assert.match(nav, /artistNavActiveTab/)
  assert.match(nav, /ShareQrDrawer/)
  assert.match(nav, /:band-slug="shareTarget\.slug"/)
  assert.match(nav, /:band-name="shareTarget\.name"/)
  assert.match(nav, /:profile-image="shareTarget\.profileImage"/)
  assert.match(nav, /resolveDockShareTarget/)
  assert.match(nav, /openDockShare/)
  assert.match(nav, /shareTargetChanged/)
  assert.doesNotMatch(nav, /:band-slug="displayBand/)
  assert.doesNotMatch(nav, /:band-name="displayBand/)
  assert.match(nav, /path: `\/\$\{displayBand\.value\.slug\}`/)
  assert.match(nav, /aria-label="Artist workspace"/)
  assert.match(nav, /aria-current/)
  assert.match(nav, /aria-label="Share artist page"/)
  assert.match(nav, /icons\.share/)
  assert.match(nav, /icons\.user/)
  assert.match(nav, /label: 'Dashboard'/)
  assert.match(nav, /label: 'Messages'/)
  assert.match(nav, /label: 'Artist'/)
  assert.match(nav, /label: 'Analytics'/)
  assert.doesNotMatch(nav, /39ff14|39FF14|--fq-green/)
  assert.doesNotMatch(nav, /pulse-glow/)
  assert.doesNotMatch(nav, /backdrop-blur-xl/)
  assert.doesNotMatch(nav, /from '@lucide\/vue'[\s\S]*Music/)
  assert.match(nav, /env\(safe-area-inset-bottom/)
  assert.match(nav, /prefers-reduced-motion/)
  assert.match(nav, /min-height: 44px/)
})

test('shared layout clearance primitive is unchanged', () => {
  const layout = read('layouts/default.vue')
  assert.match(layout, /pb-20 lg:pb-0/)
  assert.match(layout, /<MobileBottomNav/)
})

test('dev dock lab is local-only', () => {
  compileSfc('pages/__dev/artist-nav.vue')
  const page = read('pages/__dev/artist-nav.vue')
  assert.match(page, /import\.meta\.dev/)
  assert.match(page, /noindex/)
})

console.log(`\n${passed} tests passed`)
