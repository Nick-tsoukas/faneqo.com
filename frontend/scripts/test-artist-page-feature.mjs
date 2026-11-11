/**
 * Galleries-page artist profile selection.
 * Run: node scripts/test-artist-page-feature.mjs
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  applyArtistPageFeature,
  artistPageFeatureView,
  featureProfileBlock,
} from '../utils/galleries/artistPageFeature.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const read = (rel) => readFileSync(join(root, rel), 'utf8')

let passed = 0
function test(name, fn) {
  fn()
  passed += 1
  console.log(`  ok  ${name}`)
}

function gallery(overrides = {}) {
  return {
    id: 1,
    title: 'Backstage',
    status: 'published',
    visibility: 'public',
    media: [{ id: 4, url: '/photo.jpg' }],
    featuredOnProfile: false,
    ...overrides,
  }
}

test('no galleries and unfeatured galleries leave the artist page empty', () => {
  assert.equal(artistPageFeatureView([]).kind, 'none')
  assert.equal(artistPageFeatureView([gallery(), gallery({ id: 2, title: 'Lobby' })]).kind, 'none')
})

test('one eligible gallery can be featured, and a second replaces it', () => {
  const only = gallery()
  assert.equal(featureProfileBlock(only).eligible, true)
  const featured = applyArtistPageFeature([only, gallery({ id: 2, title: 'Lobby' })], 1, true)
  assert.equal(artistPageFeatureView(featured).kind, 'featured')
  assert.equal(artistPageFeatureView(featured).gallery.title, 'Backstage')
  const replaced = applyArtistPageFeature(featured, 2, true)
  assert.equal(replaced.filter((row) => row.featuredOnProfile).length, 1)
  assert.equal(artistPageFeatureView(replaced).gallery.id, 2)
})

test('removing the featured gallery clears the selection', () => {
  const rows = applyArtistPageFeature([gallery(), gallery({ id: 2 })], 1, true)
  const cleared = applyArtistPageFeature(rows, 1, false)
  assert.equal(artistPageFeatureView(cleared).kind, 'none')
  assert.equal(cleared.some((row) => row.featuredOnProfile), false)
})

test('draft, private, empty, and hidden galleries are not clickable features', () => {
  assert.equal(featureProfileBlock(gallery({ status: 'draft' })).reason, 'Publish first')
  assert.equal(featureProfileBlock(gallery({ visibility: 'fan_list' })).reason, 'Make public first')
  assert.equal(featureProfileBlock(gallery({ visibility: 'show_attendees' })).reason, 'Make public first')
  assert.equal(featureProfileBlock(gallery({ media: [] })).reason, 'Add photos first')
  assert.equal(featureProfileBlock(gallery({ status: 'hidden' })).reason, 'Restore first')
  assert.equal(featureProfileBlock(gallery({ status: 'draft' })).eligible, false)
})

test('an ineligible featured gallery asks for attention instead of looking fine', () => {
  const view = artistPageFeatureView([
    gallery({ status: 'draft', featuredOnProfile: true }),
    gallery({ id: 2 }),
  ])
  assert.equal(view.kind, 'attention')
  assert.equal(view.block.detail, 'Publish this gallery before showing it on your artist page.')
})

test('a deleted featured gallery is no longer selected', () => {
  const view = artistPageFeatureView([gallery({ id: 2, title: 'Lobby' })])
  assert.equal(view.kind, 'none')
})

test('the galleries index owns the control and does not add a route', () => {
  const page = read('pages/galleries/index.vue')
  const archive = read('components/galleries/FaneqoGalleryArchive.vue')
  const item = read('components/galleries/FaneqoGalleryArchiveItem.vue')
  assert.match(page, /applyArtistPageFeature/)
  assert.match(page, /@featured="onFeatured"/)
  assert.match(archive, /No gallery is currently shown on your artist page/)
  assert.match(archive, /Featured selection needs attention/)
  assert.match(archive, /is now showing on your artist page/)
  assert.match(archive, /featureGalleryOnProfile/)
  assert.match(archive, /unfeatureGalleryOnProfile/)
  assert.match(item, /Show on artist page/)
  assert.match(item, /Showing on artist page/)
  assert.match(item, /Remove from artist page/)
  assert.doesNotMatch(page, /\/galleries\/feature/)
  assert.doesNotMatch(archive, /type="checkbox"/)
  assert.doesNotMatch(item, /type="checkbox"/)
})

console.log(`\n${passed} artist page feature checks passed`)
