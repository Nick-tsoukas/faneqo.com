/**
 * Gallery media quality + native control contracts.
 * Run: node scripts/test-gallery-media-quality.mjs
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse, compileScript, compileTemplate } from '@vue/compiler-sfc'
import {
  galleryLeadAspect,
  gallerySourceFitsSlot,
  selectGalleryMediaSource,
} from '../utils/media/faneqoGalleryLayout.js'

const root = dirname(fileURLToPath(import.meta.url))
const read = (rel) => readFileSync(resolve(root, '..', rel), 'utf8')

let passed = 0
function test(name, fn) {
  fn()
  passed += 1
  console.log(`  ✅ ${name}`)
}

function compileSfc(rel) {
  const source = read(rel)
  const { descriptor, errors } = parse(source, { filename: rel })
  assert.deepEqual(errors, [], `${rel} parse errors`)
  if (descriptor.script || descriptor.scriptSetup) {
    const script = compileScript(descriptor, { id: rel, filename: rel })
    assert.ok(script.content, `${rel} script compiled`)
  }
  if (descriptor.template) {
    const template = compileTemplate({
      source: descriptor.template.content,
      filename: rel,
      id: rel,
    })
    assert.deepEqual(template.errors, [], `${rel} template compile errors`)
  }
}

const tiger = {
  url: 'https://cdn.example/tiger-m.jpg',
  thumbnailUrl: 'https://cdn.example/tiger-t.jpg',
  largeUrl: 'https://cdn.example/tiger-l.jpg',
  originalUrl: 'https://cdn.example/tiger.jpg',
  width: 2155,
  height: 3232,
  aspectRatio: 0.667,
  formats: {
    thumbnail: { url: 'https://cdn.example/tiger-t.jpg', width: 104, height: 156 },
    small: { url: 'https://cdn.example/tiger-s.jpg', width: 333, height: 500 },
    medium: { url: 'https://cdn.example/tiger-m.jpg', width: 500, height: 750 },
    large: { url: 'https://cdn.example/tiger-l.jpg', width: 666, height: 1000 },
  },
}

const raccoon = {
  url: 'https://cdn.example/raccoon-m.jpg',
  thumbnailUrl: 'https://cdn.example/raccoon-t.jpg',
  largeUrl: 'https://cdn.example/raccoon-l.jpg',
  originalUrl: 'https://cdn.example/raccoon.jpg',
  width: 5472,
  height: 3648,
  aspectRatio: 1.5,
  formats: {
    thumbnail: { url: 'https://cdn.example/raccoon-t.jpg', width: 234, height: 156 },
    medium: { url: 'https://cdn.example/raccoon-m.jpg', width: 750, height: 500 },
    large: { url: 'https://cdn.example/raccoon-l.jpg', width: 1000, height: 667 },
  },
}

const grid = read('components/media/FaneqoMediaGrid.vue')
const lightbox = read('components/media/FaneqoMediaLightbox.vue')
const viewer = read('components/nights/NightGalleryViewer.vue')
const icons = read('utils/messages/faneqoIcons.js')

test('1. no image geometry distortion', () => {
  assert.match(grid, /object-fit: cover/)
  assert.match(grid, /img\.is-contain \{[\s\S]*object-fit: contain/)
  assert.match(grid, /width: auto/)
  assert.match(grid, /height: auto/)
  assert.match(lightbox, /object-fit: contain/)
  assert.doesNotMatch(grid, /is-gallery[\s\S]*object-fit:\s*fill/)
})

test('2. correct best-available image source selected', () => {
  const support = selectGalleryMediaSource(tiger, { role: 'support', targetCssPx: 590, dpr: 2 })
  const hero = selectGalleryMediaSource(raccoon, { role: 'hero', targetCssPx: 1100, dpr: 2 })
  const support1x = selectGalleryMediaSource(tiger, { role: 'support', targetCssPx: 180, dpr: 1 })
  assert.equal(support.url, tiger.originalUrl)
  assert.equal(support.key, 'original')
  assert.equal(hero.url, raccoon.originalUrl)
  assert.equal(hero.fit, 'cover')
  assert.ok(['small', 'medium'].includes(support1x.key))
})

test('3. thumbnail is not used for desktop lead/support when larger source exists', () => {
  const support = selectGalleryMediaSource(tiger, { role: 'support', targetCssPx: 720, dpr: 2 })
  const hero = selectGalleryMediaSource(raccoon, { role: 'hero', targetCssPx: 1100, dpr: 2 })
  assert.notEqual(support.url, tiger.thumbnailUrl)
  assert.notEqual(hero.url, raccoon.thumbnailUrl)
  assert.equal(selectGalleryMediaSource(tiger, { role: 'thumb' }).url, tiger.thumbnailUrl)
})

test('4. Gallery mosaic wrappers use intentional aspect ratios', () => {
  assert.match(grid, /--fq-lead-ratio/)
  assert.match(grid, /aspect-ratio: var\(--fq-lead-ratio/)
  assert.match(grid, /\.fq-media-grid__rest \.fq-media-grid__cell \{[\s\S]*aspect-ratio: 1 \/ 1/)
  assert.equal(galleryLeadAspect(raccoon), 1.5)
  assert.doesNotMatch(grid, /max-height:\s*min\(52vh/)
  assert.doesNotMatch(grid, /max-height:\s*min\(56vh/)
})

test('5. image uses cover/contain appropriately', () => {
  assert.equal(selectGalleryMediaSource(tiger, { role: 'support', targetCssPx: 590 }).fit, 'cover')
  assert.equal(selectGalleryMediaSource(tiger, { role: 'lightbox' }).fit, 'contain')
  assert.equal(gallerySourceFitsSlot(104, 590), false)
  assert.equal(gallerySourceFitsSlot(666, 590), true)
})

test('6. close control >=44px target', () => {
  assert.match(viewer, /min-width: 48px/)
  assert.match(viewer, /min-height: 48px/)
  assert.match(viewer, /name="close"/)
  assert.match(lightbox, /name="close"/)
  assert.match(lightbox, /min-width: 48px/)
})

test('7. share control >=44px target', () => {
  assert.match(viewer, /name="share"/)
  assert.match(lightbox, /name="share"/)
  assert.match(icons, /share: Share2/)
  assert.match(viewer, /Share gallery/)
})

test('8. previous/next keyboard support', () => {
  assert.match(lightbox, /ArrowLeft/)
  assert.match(lightbox, /ArrowRight/)
  assert.match(lightbox, /step\(-1\)/)
  assert.match(lightbox, /step\(1\)/)
})

test('9. Escape closes', () => {
  assert.match(lightbox, /onKeyStroke\('Escape'/)
  assert.match(lightbox, /close\(\)/)
})

test('10. photo index updates', () => {
  assert.match(lightbox, /\{\{ index \+ 1 \}\} \/ \{\{ items\.length \}\}/)
  assert.match(lightbox, /Photo \{\{ index \+ 1 \}\} of \{\{ items\.length \}\}/)
})

test('11. initial lightbox mode remains contain', () => {
  assert.match(lightbox, /data-fit="contain"/)
  assert.match(lightbox, /object-fit: contain/)
  assert.match(lightbox, /width: auto/)
  assert.match(lightbox, /height: auto/)
})

test('12. pinch/zoom architecture preserved', () => {
  assert.match(lightbox, /zoomBy/)
  assert.match(lightbox, /onPointerMove/)
  assert.match(lightbox, /lastPinch/)
  assert.match(lightbox, /onDoubleClick/)
  assert.match(lightbox, /name="fit"/)
})

test('13. no horizontal overflow', () => {
  assert.match(viewer, /overflow-x: hidden/)
  assert.match(viewer, /max-width: 100dvw/)
  assert.match(lightbox, /max-width: 100dvw/)
})

test('14. scroll restore preserved', () => {
  assert.match(viewer, /lockOverlayScroll\('night-gallery-viewer'\)/)
  assert.match(viewer, /unlockOverlayScroll\('night-gallery-viewer'\)/)
  assert.match(lightbox, /lockOverlayScroll\('lightbox'\)/)
})

test('15. reduced-motion respected for control animation', () => {
  assert.match(viewer, /prefers-reduced-motion: reduce/)
  assert.match(lightbox, /prefers-reduced-motion: reduce/)
  assert.match(lightbox, /is-chrome-dim/)
})

test('16. responsive sources and lightbox original stay public-safe', () => {
  assert.match(grid, /gallerySrcset/)
  assert.match(grid, /gallerySizes/)
  assert.match(grid, /fetchpriority/)
  assert.match(lightbox, /item\.originalUrl/)
  assert.match(lightbox, /!item\.protected && item\.originalUrl/)
})

test('touched SFCs compile', () => {
  compileSfc('components/media/FaneqoMediaGrid.vue')
  compileSfc('components/media/FaneqoMediaLightbox.vue')
  compileSfc('components/nights/NightGalleryViewer.vue')
  compileSfc('components/ui/FaneqoIconButton.vue')
})

console.log(`test-gallery-media-quality: ${passed} ok`)
