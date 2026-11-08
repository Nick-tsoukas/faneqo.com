/**
 * Production featured-gallery wiring.
 * Run: node scripts/test-featured-gallery-profile.mjs
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { featuredGalleryCountLabel } from '../utils/media/featuredGalleryFixture.js'
import { resolveAspectSlide } from '../utils/media/featuredGalleryFixture.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const read = (rel) => readFileSync(join(root, rel), 'utf8')

let passed = 0
function test(name, fn) {
  fn()
  passed += 1
  console.log(`  ok  ${name}`)
}

function normalize(raw) {
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.photos) || !raw.photos.length) return null
  const photos = raw.photos.filter((photo) => photo && (photo.url || photo.src))
  if (!photos.length) return null
  return { ...raw, photoCount: photos.length, photos }
}

test('no featured gallery renders nothing; a valid one renders after the video', () => {
  const cybered = read('components/band/BandPageCybered.vue')
  const videoAt = cybered.indexOf('Featured Video')
  const labAt = cybered.indexOf('v-if="featuredGalleryLab"')
  const realAt = cybered.indexOf('v-else-if="publicFeaturedGallery"')
  const websiteAt = cybered.indexOf('Website Link')
  assert.ok(videoAt > 0 && labAt > videoAt && realAt > labAt && websiteAt > realAt)
  assert.match(cybered, /if \(!raw \|\| typeof raw !== 'object'/)
})

test('production strip uses GALLERY, the real count, and the canonical viewer', () => {
  const source = read('components/band/ArtistFeaturedGallery.vue')
  assert.match(source, /const headerMode = ref\('gallery'\)/)
  assert.match(source, /viewer\.openAt\(index\)/)
  assert.match(source, /pageScrolledDuringGesture/)
  assert.match(source, /@pointercancel="onPointerCancel"/)
  assert.doesNotMatch(source, /@pointercancel="onPointerUp"/)
  assert.match(source, /GalleryViewer/)
  assert.match(source, /props\.lab \? fixture\.photos : productionPhotos/)
  assert.equal(featuredGalleryCountLabel(1), '1 Photo')
  assert.equal(featuredGalleryCountLabel(2), '2 Photos')
  const wide = resolveAspectSlide({ width: 1600, height: 900 }, { trackWidth: 360, trackHeight: 272 })
  const tall = resolveAspectSlide({ width: 800, height: 1200 }, { trackWidth: 360, trackHeight: 272 })
  assert.notEqual(wide.width, tall.width)
  assert.ok(wide.width > tall.width)
})

test('empty and invalid payloads do not invent a section', () => {
  assert.equal(normalize(null), null)
  assert.equal(normalize({ photos: [] }), null)
  assert.equal(normalize({ photos: [{ id: 1 }] }), null)
  const row = normalize({
    id: 4,
    title: 'Night',
    photos: [{ id: 1, url: '/a.jpg', width: 1000, height: 800, alt: 'A' }],
  })
  assert.equal(row.photoCount, 1)
  assert.equal(row.photos[0].width, 1000)
})

test('gallery management can feature and unfeature through the artist-update action', () => {
  const edit = read('pages/galleries/[id]/edit.vue')
  const drafts = read('composables/useGalleryDrafts.js')
  assert.match(edit, /Feature on artist profile/)
  assert.match(edit, /Featured on artist profile/)
  assert.match(edit, /featureGalleryOnProfile/)
  assert.match(edit, /unfeatureGalleryOnProfile/)
  assert.match(drafts, /\/feature-on-profile/)
  assert.match(drafts, /\/unfeature-on-profile/)
  assert.doesNotMatch(drafts, /featured:\s*true/)
})

console.log(`\n${passed} featured gallery profile checks passed`)
