/**
 * LOCAL-ONLY featured gallery experiment.
 * Run: node scripts/test-featured-gallery-lab.mjs
 *
 * Guards:
 *   1. the strip is inserted after Featured Video and before Website
 *   2. it cannot render without dev + ?featuredGalleryLab=1
 *   3. the fixture is local files, not a Strapi write
 */
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse, compileScript } from 'vue/compiler-sfc'
import {
  FEATURED_GALLERY_LAB_QUERY,
  FEATURED_GALLERY_VARIANTS,
  classifyFeaturedAspect,
  featuredGalleryCountLabel,
  featuredGalleryFixture,
  featuredGalleryKicker,
  resolveAspectRowHeight,
  resolveAspectSlide,
} from '../utils/media/featuredGalleryFixture.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const read = (rel) => readFileSync(join(root, rel), 'utf8')

function compiles(rel) {
  const source = read(rel)
  const { descriptor, errors } = parse(source, { filename: rel })
  assert.equal(errors.length, 0, `${rel} parse errors`)
  if (descriptor.scriptSetup || descriptor.script) compileScript(descriptor, { id: 'test' })
  return source
}

let passed = 0
function test(name, fn) {
  fn()
  passed += 1
  console.log(`  ok  ${name}`)
}

test('fixture is a local removable list with mixed ratios', () => {
  assert.equal(featuredGalleryFixture.id, 'featured-gallery-lab')
  assert.equal(featuredGalleryFixture.title, 'Live')
  assert.ok(featuredGalleryFixture.photos.length >= 5)
  const ratios = featuredGalleryFixture.photos.map((photo) => photo.width / photo.height)
  assert.ok(ratios.some((ratio) => ratio > 1.7), 'wide close-up')
  assert.ok(ratios.some((ratio) => Math.abs(ratio - 1) < 0.04), 'square')
  assert.ok(ratios.some((ratio) => ratio > 1.2 && ratio < 1.4), 'near-square landscape')
  for (const photo of featuredGalleryFixture.photos) {
    assert.match(photo.src, /^\/labs\/featured-gallery\//)
    assert.ok(photo.objectPosition)
    assert.ok(existsSync(join(root, 'public', photo.src.replace(/^\//, ''))))
  }
  assert.equal(featuredGalleryCountLabel(5), '5 Photos')
  assert.equal(featuredGalleryCountLabel(1), '1 Photo')
  assert.equal(featuredGalleryKicker('gallery', 'Live'), 'Gallery')
  assert.equal(featuredGalleryKicker('title', 'Live'), 'Live')
})

test('aspect-aware slides keep the photograph and clamp the extremes', () => {
  const phone = { trackWidth: 360, trackHeight: 272 }
  const wide = resolveAspectSlide({ width: 1500, height: 1000 }, phone)
  assert.equal(classifyFeaturedAspect(1500, 1000), 'landscape')
  assert.ok(wide.width / phone.trackWidth <= 0.86 + 0.02)
  assert.ok(wide.width / phone.trackWidth >= 0.82)
  assert.equal(wide.matte, false)
  assert.ok(Math.abs(wide.width / wide.height - 1.5) < 0.03)

  const square = resolveAspectSlide({ width: 1000, height: 1000 }, phone)
  assert.equal(square.kind, 'square')
  assert.ok(square.width / phone.trackWidth <= 0.72 + 0.02)
  assert.ok(square.width / phone.trackWidth >= 0.65)
  assert.equal(square.matte, false)
  assert.ok(Math.abs(square.width / square.height - 1) < 0.03)

  const portrait = resolveAspectSlide({ width: 800, height: 1200 }, phone)
  assert.equal(portrait.kind, 'portrait')
  assert.ok(portrait.width / phone.trackWidth >= 0.48)
  assert.ok(portrait.width / phone.trackWidth <= 0.58)
  assert.equal(portrait.height, 272)
  assert.equal(portrait.matte, false)
  assert.ok(Math.abs(portrait.width / portrait.height - (800 / 1200)) < 0.03)

  const extreme = resolveAspectSlide({ width: 300, height: 1200 }, phone)
  assert.equal(extreme.kind, 'portrait')
  assert.equal(extreme.matte, true)
  assert.ok(extreme.width / phone.trackWidth >= 0.48 - 0.02)
  assert.equal(extreme.height, 272)

  const phoneRow = resolveAspectRowHeight(360)
  const phoneVideo = (360 - 24) * (9 / 16)
  assert.ok(phoneRow < phoneVideo)
  assert.ok(phoneRow >= 140 && phoneRow <= 175)
  const desktopRow = resolveAspectRowHeight(960)
  assert.equal(desktopRow, 220)
  assert.equal(resolveAspectRowHeight(1400), desktopRow)
  assert.ok(desktopRow < 272)
  const desktop = resolveAspectSlide({ width: 1024, height: 682 }, { trackWidth: 960, trackHeight: desktopRow })
  assert.equal(desktop.matte, false)
  assert.equal(desktop.height, desktopRow)
  assert.ok(desktop.width < 960 * 0.86)
  assert.ok(Math.abs(desktop.width / desktop.height - (1024 / 682)) < 0.03)
})

test('three variants share one engine and stay inside the tuning bounds', () => {
  assert.deepEqual(Object.keys(FEATURED_GALLERY_VARIANTS), ['cinematic', 'editorial', 'film'])
  for (const preset of Object.values(FEATURED_GALLERY_VARIANTS)) {
    assert.ok(preset.width >= 52 && preset.width <= 92)
    assert.ok(preset.gap >= 4 && preset.gap <= 20)
    assert.ok(preset.radius >= 0 && preset.radius <= 24)
    assert.ok(preset.activeScale >= 0.97 && preset.activeScale <= 1)
    assert.ok(preset.adjacentScale >= 0.94 && preset.adjacentScale <= 1)
    assert.ok(preset.snap === 'start' || preset.snap === 'center')
  }
  assert.equal(FEATURED_GALLERY_VARIANTS.cinematic.snap, 'start')
  assert.equal(FEATURED_GALLERY_VARIANTS.cinematic.bottom, 10)
  assert.equal(FEATURED_GALLERY_VARIANTS.cinematic.headerGap, 16)
  assert.equal(FEATURED_GALLERY_VARIANTS.cinematic.breakout, 12)
  assert.ok(FEATURED_GALLERY_VARIANTS.cinematic.breakout >= 8 && FEATURED_GALLERY_VARIANTS.cinematic.breakout <= 16)
  assert.equal(FEATURED_GALLERY_VARIANTS.film.snap, 'center')
  assert.ok(FEATURED_GALLERY_VARIANTS.film.width < FEATURED_GALLERY_VARIANTS.cinematic.width)
  assert.ok(FEATURED_GALLERY_VARIANTS.editorial.gap > FEATURED_GALLERY_VARIANTS.cinematic.gap)
})

test('artist page mounts the strip only behind the lab flag, after video', () => {
  const cybered = read('components/band/BandPageCybered.vue')
  const videoAt = cybered.indexOf('Featured Video')
  const galleryAt = cybered.indexOf('<ArtistFeaturedGallery')
  const websiteAt = cybered.indexOf('Website Link')
  assert.ok(videoAt > 0 && galleryAt > videoAt && websiteAt > galleryAt)
  assert.match(cybered, /v-if="featuredGalleryLab"/)
  assert.match(cybered, /useFeaturedGalleryLab/)
  assert.doesNotMatch(cybered, /featuredGallery\s*:/)
  const gate = read('composables/useFeaturedGalleryLab.js')
  assert.match(gate, /import\.meta\.dev/)
  assert.match(gate, new RegExp(FEATURED_GALLERY_LAB_QUERY))
  assert.match(gate, /=== '1'/)
  assert.doesNotMatch(gate, /\/api\/|useStrapi|fetch\(/)
  assert.doesNotMatch(read('utils/media/featuredGalleryFixture.js'), /\/api\/|useStrapi/)
})

test('strip uses scroll-snap, the canonical viewer, and a dev-only panel', () => {
  const source = compiles('components/band/ArtistFeaturedGallery.vue')
  assert.match(source, /scroll-snap-type: x mandatory/)
  assert.match(source, /GalleryViewer/)
  assert.match(source, /useGalleryViewer/)
  assert.match(source, /v-if="showPanel && !viewer\.open\.value"/)
  assert.match(source, /import\.meta\.dev/)
  assert.match(source, /touch-action: pan-x pan-y/)
  assert.match(source, /prefers-reduced-motion: reduce/)
  assert.match(source, /const headerMode = ref\('gallery'\)/)
  assert.match(source, /const framing = ref\('aspect'\)/)
  assert.match(source, /font-weight: 650/)
  assert.match(source, /letter-spacing: 0\.16em/)
  assert.match(source, /#e8e8ec/)
  assert.match(source, /Fixed frame/)
  assert.match(source, /Aspect-aware/)
  assert.match(source, /Gallery breakout/)
  assert.match(source, /Gallery frame height/)
  assert.match(source, /10% shorter/)
  assert.match(source, /25% shorter/)
  assert.match(source, /min="0" max="24"/)
  assert.doesNotMatch(source, /localStorage/)
  assert.doesNotMatch(source, /\/api\/|useStrapi/)
})

console.log(`\n${passed} featured gallery lab checks passed`)
