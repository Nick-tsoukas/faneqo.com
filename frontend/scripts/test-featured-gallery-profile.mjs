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
import { featuredGalleryTeaser } from '../utils/galleries/publicFeaturedGallery.js'

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
  assert.match(cybered, /resolvePublicFeaturedGallery/)
  assert.match(read('utils/galleries/publicFeaturedGallery.js'), /if \(!raw \|\| typeof raw !== 'object'/)
  assert.match(read('components/band/BandPageCompact.vue'), /resolvePublicFeaturedGallery/)
  assert.match(read('components/band/BandPageBold.vue'), /resolvePublicFeaturedGallery/)
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

test('fan list teaser uses the featured gallery and stays hidden without one', () => {
  const photos = [
    { id: 1, url: '/large-1.jpg', thumbnailUrl: '/thumb-1.jpg', alt: 'Stage' },
    { id: 2, url: '/large-2.jpg', thumbnailUrl: '/thumb-2.jpg', alt: '' },
    { id: 3, url: '/large-3.jpg', alt: 'Crowd' },
    { id: 4, url: '/large-4.jpg', alt: 'Extra' },
  ]
  const teaser = featuredGalleryTeaser({
    canonicalPath: '/ada/gallery/night',
    photos,
  })
  assert.equal(teaser.path, '/ada/gallery/night')
  assert.equal(teaser.photos.length, 3)
  assert.equal(teaser.photos[0].src, '/thumb-1.jpg')
  assert.equal(teaser.photos[2].src, '/large-3.jpg')
  assert.equal(featuredGalleryTeaser({
    canonicalPath: '/ada/gallery/one',
    photos: [{ id: 9, url: '/only.jpg' }],
  }).photos.length, 1)
  assert.equal(featuredGalleryTeaser({ photos: [{ id: 1, url: '/a.jpg' }] }), null)
  assert.equal(featuredGalleryTeaser(null), null)
  assert.equal(featuredGalleryTeaser({ canonicalPath: '/ada/gallery/night', photos: [] }), null)

  const capture = read('components/band/FanCaptureSection.vue')
  const page = read('pages/[bandSlug]/index.vue')
  assert.match(capture, /featuredGalleryTeaser/)
  assert.match(capture, /From the gallery/)
  assert.match(capture, /loading="lazy"/)
  assert.doesNotMatch(capture, /subscribers only|exclusive to fans|fan list only/i)
  assert.match(page, /composition="close"[\s\S]*:featured-gallery="band\.data\.featuredGallery/)
  const closeAt = page.indexOf('composition="close"')
  const propAt = page.indexOf(':featured-gallery="band.data.featuredGallery')
  assert.ok(closeAt > 0 && propAt > closeAt)
  assert.equal(page.split(':featured-gallery=').length, 2)
})

test('gallery management can feature and unfeature through the artist-update action', () => {
  const edit = read('pages/galleries/[id]/edit.vue')
  const drafts = read('composables/useGalleryDrafts.js')
  assert.match(edit, /Show on artist page/)
  assert.match(edit, /Showing on artist page/)
  assert.match(edit, /Remove from artist page/)
  assert.match(edit, /featureGalleryOnProfile/)
  assert.match(edit, /unfeatureGalleryOnProfile/)
  assert.match(drafts, /\/feature-on-profile/)
  assert.match(drafts, /\/unfeature-on-profile/)
  assert.doesNotMatch(drafts, /featured:\s*true/)
})

console.log(`\n${passed} featured gallery profile checks passed`)
