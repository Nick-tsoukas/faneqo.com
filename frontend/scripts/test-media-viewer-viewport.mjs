/**
 * Media viewer + Recap rail viewport contracts.
 * Run: node scripts/test-media-viewer-viewport.mjs
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse, compileScript, compileTemplate } from '@vue/compiler-sfc'
import {
  lockOverlayScroll,
  overlayScrollLockCount,
  resetOverlayScrollLockForTests,
  unlockOverlayScroll,
} from '../utils/ui/overlayScrollLock.js'

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

const lightbox = read('components/media/FaneqoMediaLightbox.vue')
const viewer = read('components/nights/NightGalleryViewer.vue')
const grid = read('components/media/FaneqoMediaGrid.vue')
const recap = read('components/dashboard/fans/ShowRecapDetailContent.vue')
const recapPage = read('pages/fans/recaps/[id].vue')
const night = read('components/nights/PublicNightExperience.vue')
const galleryPage = read('components/nights/PublicGalleryExperience.vue')

test('1. initial media viewer mode is contain/fit', () => {
  assert.match(lightbox, /data-fit="contain"/)
  assert.match(lightbox, /object-fit: contain/)
  assert.match(lightbox, /\.is-zoomable \.fq-mlb__img \{[\s\S]*?object-fit: contain/)
  assert.match(lightbox, /width: auto/)
  assert.match(lightbox, /height: auto/)
  assert.match(lightbox, /max-width: 100%/)
  assert.match(lightbox, /max-height: 100%/)
})

test('2. portrait image is not rendered as cover in the viewer', () => {
  const zoomableBlock = lightbox.match(/\.is-zoomable \.fq-mlb__img \{[\s\S]*?\}/)?.[0] || ''
  assert.match(zoomableBlock, /object-fit: contain/)
  assert.doesNotMatch(zoomableBlock, /object-fit:\s*cover/)
  assert.doesNotMatch(zoomableBlock, /(?<!max-)width:\s*100%/)
  assert.doesNotMatch(zoomableBlock, /(?<!max-)height:\s*100%/)
  assert.match(lightbox, /\.fq-mlb__thumb img \{[\s\S]*?object-fit: cover/)
})

test('3. viewer is fixed to the viewport', () => {
  assert.match(lightbox, /position: fixed/)
  assert.match(lightbox, /inset: 0/)
  assert.match(lightbox, /width: 100dvw/)
  assert.match(lightbox, /height: 100dvh/)
  assert.match(lightbox, /overflow: hidden/)
  assert.match(viewer, /position: fixed/)
  assert.match(viewer, /width: 100dvw/)
  assert.match(viewer, /height: 100dvh/)
  assert.match(viewer, /z-index: 100000000/)
  assert.doesNotMatch(viewer, /inset: 3vh 8vw/)
})

test('4. page body locks while the viewer is open', () => {
  assert.match(lightbox, /lockOverlayScroll\('lightbox'\)/)
  assert.match(viewer, /lockOverlayScroll\('night-gallery-viewer'\)/)
  assert.match(night, /lockOverlayScroll\('public-night-gallery'\)/)
})

test('5. viewers do not create horizontal overflow', () => {
  assert.match(lightbox, /max-width: 100dvw/)
  assert.match(viewer, /overflow-x: hidden/)
  assert.match(viewer, /max-width: 100dvw/)
  assert.match(recap, /overflow-x: clip/)
  assert.match(recapPage, /overflow-x: clip/)
})

test('6. viewer close restores the saved scroll position', () => {
  resetOverlayScrollLockForTests()
  let scrolledTo = null
  globalThis.window = {
    scrollY: 640,
    // The lock restores through `pageScroll.js`, which uses the options form.
    scrollTo(arg, y) { scrolledTo = arg && typeof arg === 'object' ? arg.top : y },
  }
  globalThis.document = {
    documentElement: { dataset: {}, style: {} },
    body: { dataset: {}, style: {} },
  }
  lockOverlayScroll('lightbox')
  assert.equal(overlayScrollLockCount(), 1)
  assert.equal(document.body.dataset.fqOverlayLockY, '640')
  assert.equal(document.body.style.overflow, 'hidden')
  lockOverlayScroll('night-gallery-viewer')
  assert.equal(overlayScrollLockCount(), 2)
  unlockOverlayScroll('lightbox')
  assert.equal(document.body.style.overflow, 'hidden')
  assert.equal(scrolledTo, null)
  unlockOverlayScroll('night-gallery-viewer')
  assert.equal(overlayScrollLockCount(), 0)
  assert.equal(scrolledTo, 640)
  assert.equal(document.body.style.overflow, '')
  resetOverlayScrollLockForTests()
  delete globalThis.window
  delete globalThis.document
})

/*
 * Faneqo's global `body { height: 100% }` makes <body> the scroll container,
 * so `window.scrollY` reads 0 on every route. An overlay that trusted it was
 * silently restoring the top of the page instead of the fan's place in it.
 */
test('6b. the lock follows a scrolling <body>, not window.scrollY', () => {
  resetOverlayScrollLockForTests()
  let bodyScrolledTo = null
  globalThis.window = { scrollY: 0, scrollTo() { bodyScrolledTo = 'window' } }
  globalThis.document = {
    documentElement: { dataset: {}, style: {}, scrollHeight: 800, clientHeight: 800 },
    body: {
      dataset: {},
      style: {},
      scrollHeight: 4000,
      clientHeight: 800,
      scrollTop: 640,
      scrollTo(opts) { bodyScrolledTo = opts.top },
    },
  }
  lockOverlayScroll('gallery-viewer')
  assert.equal(document.body.dataset.fqOverlayLockY, '640')
  unlockOverlayScroll('gallery-viewer')
  assert.equal(bodyScrolledTo, 640)
  resetOverlayScrollLockForTests()
  delete globalThis.window
  delete globalThis.document
})

/*
 * The artist page mounts ShareQrDrawer inside the hero-driven mobile nav, and
 * its `immediate` isOpen watcher unlocks on mount while closed. A blind restore
 * there threw the fan back to the top mid-scroll.
 */
test('6c. releasing a lock that was never held never moves the page', () => {
  resetOverlayScrollLockForTests()
  let scrolledTo = null
  globalThis.window = {
    scrollY: 900,
    scrollTo(arg, y) { scrolledTo = arg && typeof arg === 'object' ? arg.top : y },
  }
  globalThis.document = {
    documentElement: { dataset: {}, style: {}, scrollHeight: 4000, clientHeight: 800 },
    body: { dataset: {}, style: {}, scrollHeight: 4000, clientHeight: 800 },
  }

  unlockOverlayScroll('share-qr-drawer')
  assert.equal(scrolledTo, null)
  assert.equal(overlayScrollLockCount(), 0)

  // A real lock still restores, and a duplicate release stays inert.
  lockOverlayScroll('share-qr-drawer')
  unlockOverlayScroll('share-qr-drawer')
  assert.equal(scrolledTo, 900)
  scrolledTo = null
  unlockOverlayScroll('share-qr-drawer')
  assert.equal(scrolledTo, null)

  // One overlay must not release another overlay's lock.
  lockOverlayScroll('lightbox')
  unlockOverlayScroll('share-qr-drawer')
  assert.equal(overlayScrollLockCount(), 1)
  assert.equal(document.body.style.overflow, 'hidden')

  resetOverlayScrollLockForTests()
  delete globalThis.window
  delete globalThis.document
})

test('7. gallery viewer uses one intentional scroller', () => {
  assert.match(viewer, /overflow-y: auto/)
  assert.match(viewer, /scrollbar-width: none/)
  assert.match(viewer, /\.ngv__body::-webkit-scrollbar \{ display: none; \}/)
  assert.match(viewer, /surface="viewer"/)
  assert.match(grid, /is-viewer/)
  assert.match(grid, /surface: \{ type: String, default: 'page' \}/)
  assert.doesNotMatch(galleryPage, /surface="viewer"/)
})

test('8. Show Recap mobile gallery rail has end padding', () => {
  assert.match(recap, /padding-right: max\(1\.25rem, calc\(100vw - min\(80vw, 22rem\) - 1\.25rem\)\)/)
  assert.match(recap, /scroll-padding-inline: 1\.25rem/)
})

test('9. Recap rail snaps from the start and desktop stays two-up', () => {
  assert.match(recap, /scroll-snap-type: x mandatory/)
  assert.match(recap, /scroll-snap-align: start/)
  assert.match(recap, /flex: 0 0 min\(80vw, 22rem\)/)
  assert.match(recap, /grid-template-columns: 1fr 1fr/)
})

test('10. Recap bottom content clears nav and safe area', () => {
  assert.match(recap, /padding-bottom: calc\(1\.15rem \+ env\(safe-area-inset-bottom, 0px\)\)/)
  assert.match(recapPage, /padding-bottom: calc\(1\.15rem \+ env\(safe-area-inset-bottom, 0px\)\)/)
  assert.match(lightbox, /--fq-mlb-hint/)
  assert.match(lightbox, /env\(safe-area-inset-bottom/)
})

test('gallery viewer share is generic, not Share Kit', () => {
  assert.match(viewer, /shareFaneqoUrl/)
  assert.match(viewer, /canonicalPath: props.sharePath/)
  assert.doesNotMatch(viewer, /NightShareSheet/)
  assert.doesNotMatch(viewer, /useShareKit/)
  assert.doesNotMatch(viewer, /generateShareImage/)
  assert.doesNotMatch(viewer, /format="square"/)
})

test('gallery viewer identity is public, not management', () => {
  const identity = read('components/nights/ArtistWorldIdentity.vue')
  assert.match(viewer, /ArtistWorldIdentity/)
  assert.match(viewer, /size="viewer"/)
  assert.match(identity, /is-viewer/)
  assert.match(viewer, /countLine/)
  assert.doesNotMatch(viewer, /galleryAudienceLabel/)
  assert.doesNotMatch(viewer, / · Public/)
  assert.doesNotMatch(viewer, /People who were there/)
  assert.match(viewer, /gallery\?\.caption/)
  assert.match(viewer, /publicExperience && props.youWereThere && !props.locked/)
  assert.match(recap, /:artist-name="artistName"/)
  assert.match(night, /:artist-name="artistName"/)
  assert.match(night, /:you-were-there="youWereThere"/)
  assert.doesNotMatch(galleryPage, /size="viewer"/)
})

test('lightbox print corners and desktop-only prev/next', () => {
  assert.match(lightbox, /border-radius: 0;/)
  assert.doesNotMatch(lightbox, /border-radius: 0\.55rem/)
  assert.match(lightbox, /@media \(max-width: 767px\) \{\s*\.fq-mlb__nav \{ display: none; \}/)
  assert.match(lightbox, /\.fq-mlb:hover \.fq-mlb__nav/)
  assert.match(lightbox, /ArrowLeft/)
  assert.match(lightbox, /ArrowRight/)
})

test('viewer mosaic hover is desktop-only and reduced-motion safe', () => {
  assert.match(grid, /\.fq-media-grid\.is-viewer \.fq-media-grid__cell \{[\s\S]*box-shadow: inset/)
  assert.match(grid, /@media \(min-width: 768px\) \{[\s\S]*is-viewer[\s\S]*brightness\(1\.05\)/)
  assert.match(grid, /prefers-reduced-motion: reduce/)
  assert.doesNotMatch(grid, /is-viewer[\s\S]*transform: scale\(1\.012\)/)
})

test('desktop swipe hint is hidden; zoom/pinch/close stay', () => {
  assert.match(lightbox, /@media \(min-width: 768px\)/)
  assert.match(lightbox, /\.fq-mlb__hint \{\s*display: none;/)
  assert.match(lightbox, /Swipe down to close · pinch to zoom/)
  assert.match(lightbox, /zoomable/)
  assert.match(lightbox, /zoomBy/)
  assert.match(lightbox, /onPointerMove/)
})

test('touched SFCs compile', () => {
  compileSfc('components/media/FaneqoMediaLightbox.vue')
  compileSfc('components/media/FaneqoMediaGrid.vue')
  compileSfc('components/nights/NightGalleryViewer.vue')
  compileSfc('components/dashboard/fans/ShowRecapDetailContent.vue')
  compileSfc('components/nights/PublicNightExperience.vue')
  compileSfc('pages/fans/recaps/[id].vue')
  compileSfc('components/nights/ArtistWorldIdentity.vue')
})

console.log(`test-media-viewer-viewport: ${passed} ok`)
