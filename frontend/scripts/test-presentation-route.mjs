/**
 * The flagship presentation has one public, shareable address: /presentation.
 *   - pages/presentation.vue exists, so the URL never falls through to the
 *     artist route (/[bandSlug] returned 404 for it)
 *   - it reuses the Corvana viewer with the flagship slug, no second deck
 *   - it carries title, description, canonical, Open Graph and Twitter tags
 *   - /deck redirects to it, and every Presentation link points at it
 *   - it stays public: no auth middleware, not on the noindex list
 * Run: node scripts/test-presentation-route.mjs
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { FLAGSHIP_DECK_PATH, FLAGSHIP_DECK_SLUG, getDeckBySlug } from '../corvana/decks/deckIndex.js'
import { headerPrimaryLinks } from '../utils/ui/appShell.js'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8')

let passed = 0
function test(name, fn) {
  fn()
  passed += 1
  console.log(`  ok  ${name}`)
}

test('flagship path is /presentation and resolves to the flagship deck', () => {
  assert.equal(FLAGSHIP_DECK_PATH, '/presentation')
  assert.ok(getDeckBySlug(FLAGSHIP_DECK_SLUG))
})

test('/presentation renders the existing viewer with the flagship slug', () => {
  const page = read('pages/presentation.vue')
  assert.match(page, /import DeckViewer from '~\/pages\/corvana\/decks\/\[id\]\.vue'/)
  assert.match(page, /<DeckViewer :deck-slug="FLAGSHIP_DECK_SLUG" \/>/)
  assert.match(page, /layout: false/)
  assert.doesNotMatch(page, /middleware/)
  assert.doesNotMatch(page, /navigateTo/)

  const viewer = read('pages/corvana/decks/[id].vue')
  assert.match(viewer, /deckSlug: \{ type: String, default: '' \}/)
  assert.match(viewer, /const deckId = props\.deckSlug \|\| route\.params\.id/)
  assert.doesNotMatch(viewer, /middleware/)
})

test('/presentation has share metadata with absolute URLs', () => {
  const page = read('pages/presentation.vue')
  assert.match(page, /const title = 'Faneqo \| The Artist Platform'/)
  assert.match(page, /titleTemplate: '%s'/)
  assert.match(page, /rel: 'canonical', href: url/)
  assert.match(page, /const url = `https:\/\/faneqo\.com\$\{FLAGSHIP_DECK_PATH\}`/)
  assert.match(page, /const image = 'https:\/\/faneqo\.com\/api\/og\/site\.png/)
  for (const key of ['description', 'ogTitle', 'ogDescription', 'ogUrl', 'ogImage', 'ogType', 'twitterCard', 'twitterTitle', 'twitterDescription', 'twitterImage']) {
    assert.match(page, new RegExp(`\\b${key}\\b`), `missing ${key}`)
  }
  assert.match(page, /twitterCard: 'summary_large_image'/)
})

test('/deck redirects permanently to /presentation and keeps the query', () => {
  const deck = read('pages/deck.vue')
  assert.match(deck, /path: FLAGSHIP_DECK_PATH, query: route\.query/)
  assert.match(deck, /redirectCode: 301/)
})

test('every Presentation link points at /presentation', () => {
  for (const rel of ['components/Header.vue', 'components/home-v2/HomeV2Page.vue', 'components/home-v2/story/HomeV2Closing.vue']) {
    const src = read(rel)
    assert.doesNotMatch(src, /to="\/deck"/, `${rel} still links /deck`)
    assert.match(src, /to="\/presentation"/, `${rel} has no /presentation link`)
  }
  for (const p of ['/', '/presentation']) {
    const link = headerPrimaryLinks(p).find((l) => l.label === 'Presentation')
    assert.equal(link?.to, '/presentation', `header on ${p}`)
  }
})

test('/presentation is not marked noindex', () => {
  const noindex = read('server/middleware/seo-noindex.ts')
  assert.doesNotMatch(noindex, /'\/presentation'/)
  assert.doesNotMatch(noindex, /'\/deck'/)
})

console.log(`\n${passed} passed`)
