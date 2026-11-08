/**
 * Canonical gallery overview + viewer contracts.
 *
 * The load-bearing assertion in this file is that closing the viewer is never
 * a navigation. Everything else — layout, enlargement, share, history — is
 * downstream of that one rule.
 *
 * Run: node scripts/test-canonical-gallery.mjs
 */

import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

import {
  resolveDismissIntent,
  galleryGestureAxis,
  shouldDismissVertical,
  shouldAdvanceHorizontal,
  shouldToggleChrome,
  pointerMoved,
  galleryPreloadWindow,
  GALLERY_DISMISS_REASONS,
} from '../features/gallery-experience/canonical/galleryDismissal.js'

import {
  galleryEnlargementCap,
  galleryContainRatio,
  galleryContainScale,
  galleryInitialZoomLevel,
  gallerySecondaryZoomLevel,
  galleryMaxZoomLevel,
  galleryStageSourceTarget,
  GALLERY_ENLARGE_BUDGET,
} from '../features/gallery-experience/canonical/galleryEnlargement.js'

import {
  planJustifiedRows,
  galleryPhotoRatio,
  galleryTargetRowHeight,
  galleryWallAvailableWidth,
  galleryPlateHeight,
  GALLERY_MAX_RATIO,
} from '../features/gallery-experience/canonical/galleryJustifiedRows.js'

import {
  planGallerySequence,
  sequenceOrientation,
  sequenceSizes,
  spreadEnlargeLimit,
  SEQUENCE_BREAKPOINTS,
  SEQUENCE_ENLARGE_BUDGET,
  SEQUENCE_GAP,
  SEQUENCE_MAX_WIDTH,
  SEQUENCE_MASONRY,
  SEQUENCE_PADDING,
} from '../features/gallery-experience/canonical/gallerySequence.js'

import {
  createGalleryViewerHistory,
  galleryPhotoHash,
  readGalleryPhotoHash,
  resolveDeepLinkedIndex,
  GALLERY_HISTORY_STATE_KEY,
} from '../features/gallery-experience/canonical/galleryViewerHistory.js'

import {
  normalizeGalleryPhoto,
  normalizeGalleryPhotos,
  normalizeGalleryIdentity,
  normalizeGalleryModel,
} from '../features/gallery-experience/canonical/galleryMediaModel.js'

import {
  canShareGallery,
  galleryShareIntents,
  galleryPhotoShareUrl,
  galleryShareUrl,
  galleryShareReachNote,
} from '../features/gallery-experience/canonical/gallerySharePayload.js'

import { useGalleryViewer } from '../features/gallery-experience/canonical/useGalleryViewer.js'

import { faneqoShareUrl } from '../utils/share/faneqoShare.js'
import { STACK_OPEN_INDEX_KEY } from '../utils/galleries/stackOpenNavigation.js'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')
const canonicalDir = join(root, 'features', 'gallery-experience', 'canonical')

let passed = 0
let failed = 0

function test(name, fn) {
  try {
    fn()
    passed += 1
    console.log(`  ✅ ${name}`)
  } catch (err) {
    failed += 1
    console.log(`  ❌ ${name}`)
    console.log(`     ${err.message}`)
  }
}

function read(relative) {
  const path = join(canonicalDir, relative)
  assert.ok(existsSync(path), `missing ${relative}`)
  return readFileSync(path, 'utf8')
}

/* ------------------------------------------------------------------ *
 * Part 2 — close is not Back. The four dismissal paths.
 * ------------------------------------------------------------------ */
console.log('\nDismissal — the four paths')

test('X closes the viewer, returns to the frame, and does not navigate', () => {
  const intent = resolveDismissIntent({ reason: 'close-button' })
  assert.equal(intent.action, 'close-viewer')
  assert.equal(intent.closesViewer, true)
  assert.equal(intent.returnsToFrame, true)
  assert.equal(intent.restoresScroll, true)
  assert.equal(intent.restoresFocus, true)
  assert.equal(intent.resetsZoom, true)
  assert.equal(intent.navigates, false)
})

test('X releases the history entry we pushed', () => {
  assert.equal(resolveDismissIntent({ reason: 'close-button' }).releasesHistoryEntry, true)
})

test('X still closes the viewer while zoomed, and resets zoom', () => {
  const intent = resolveDismissIntent({ reason: 'close-button', zoomed: true })
  assert.equal(intent.action, 'close-viewer')
  assert.equal(intent.resetsZoom, true)
})

test('browser/system Back closes the viewer without releasing the entry again', () => {
  const intent = resolveDismissIntent({ reason: 'history-back' })
  assert.equal(intent.action, 'close-viewer')
  assert.equal(intent.closesViewer, true)
  // popstate already spent the entry; a second pop would leave the gallery.
  assert.equal(intent.releasesHistoryEntry, false)
  assert.equal(intent.navigates, false)
})

test('swipe down closes the viewer and restores the overview exactly', () => {
  const intent = resolveDismissIntent({ reason: 'swipe-down' })
  assert.equal(intent.action, 'close-viewer')
  assert.equal(intent.restoresScroll, true)
  assert.equal(intent.restoresFocus, true)
  assert.equal(intent.releasesHistoryEntry, true)
  assert.equal(intent.navigates, false)
})

test('swipe down is suppressed while zoomed', () => {
  assert.equal(resolveDismissIntent({ reason: 'swipe-down', zoomed: true }).action, 'ignore')
})

test('swipe down is suppressed while the contact sheet is up', () => {
  assert.equal(resolveDismissIntent({ reason: 'swipe-down', sheetOpen: true }).action, 'ignore')
})

test('Escape closes the viewer and returns focus to the originating photograph', () => {
  const intent = resolveDismissIntent({ reason: 'escape' })
  assert.equal(intent.action, 'close-viewer')
  assert.equal(intent.restoresFocus, true)
  assert.equal(intent.navigates, false)
})

test('Escape dismisses layers in summon order: sheet, share, zoom, viewer', () => {
  assert.equal(resolveDismissIntent({ reason: 'escape', sheetOpen: true, shareOpen: true, zoomed: true }).action, 'close-sheet')
  assert.equal(resolveDismissIntent({ reason: 'escape', shareOpen: true, zoomed: true }).action, 'close-share')
  assert.equal(resolveDismissIntent({ reason: 'escape', zoomed: true }).action, 'reset-zoom')
  assert.equal(resolveDismissIntent({ reason: 'escape' }).action, 'close-viewer')
})

test('a missing origin frame degrades the animation, not the close', () => {
  const intent = resolveDismissIntent({ reason: 'close-button', hasOriginFrame: false })
  assert.equal(intent.closesViewer, true)
  assert.equal(intent.returnsToFrame, false)
  assert.equal(intent.restoresScroll, true)
})

test('NO dismissal path on ANY layer state ever navigates', () => {
  const flags = [true, false]
  for (const reason of GALLERY_DISMISS_REASONS) {
    for (const zoomed of flags) {
      for (const sheetOpen of flags) {
        for (const shareOpen of flags) {
          for (const hasOriginFrame of flags) {
            const intent = resolveDismissIntent({ reason, zoomed, sheetOpen, shareOpen, hasOriginFrame })
            assert.equal(
              intent.navigates,
              false,
              `${reason} z=${zoomed} sheet=${sheetOpen} share=${shareOpen} navigated`,
            )
          }
        }
      }
    }
  }
})

test('an unknown dismissal reason is ignored rather than guessed', () => {
  assert.equal(resolveDismissIntent({ reason: 'router-back' }).action, 'ignore')
  assert.equal(resolveDismissIntent({}).action, 'ignore')
})

/* ------------------------------------------------------------------ *
 * Gestures — vertical dismiss stays distinct from horizontal paging
 * ------------------------------------------------------------------ */
console.log('\nGestures')

test('axis stays undecided below the threshold', () => {
  assert.equal(galleryGestureAxis(4, 5), null)
})

test('a mostly horizontal drag is paging, not a dismiss', () => {
  assert.equal(galleryGestureAxis(40, 30), 'x')
  assert.equal(galleryGestureAxis(-40, 30), 'x')
})

test('vertical dismiss requires a clearly vertical drag', () => {
  // 1.2x bias: 30 across / 33 down is still paging.
  assert.equal(galleryGestureAxis(30, 33), 'x')
  assert.equal(galleryGestureAxis(30, 60), 'y')
})

test('a zoomed photograph has no axes — every drag is a pan', () => {
  assert.equal(galleryGestureAxis(100, 2, { zoomed: true }), 'pan')
  assert.equal(galleryGestureAxis(2, 100, { zoomed: true }), 'pan')
})

test('a slow short drag snaps back', () => {
  assert.equal(shouldAdvanceHorizontal({ dx: -40, velocity: -0.1, viewportWidth: 390 }), 0)
})

test('a fast intentional flick advances even when it barely moved', () => {
  assert.equal(shouldAdvanceHorizontal({ dx: -30, velocity: -0.9, viewportWidth: 390 }), 1)
  assert.equal(shouldAdvanceHorizontal({ dx: 30, velocity: 0.9, viewportWidth: 390 }), -1)
})

test('a long slow drag past the distance ratio advances', () => {
  assert.equal(shouldAdvanceHorizontal({ dx: -140, velocity: -0.05, viewportWidth: 390 }), 1)
})

test('a deliberate pull down dismisses; a short one does not', () => {
  assert.equal(shouldDismissVertical({ dy: 140, velocity: 0.1 }), true)
  assert.equal(shouldDismissVertical({ dy: 40, velocity: 0.1 }), false)
  assert.equal(shouldDismissVertical({ dy: 40, velocity: 0.9 }), true)
})

test('dragging a photograph upward never dismisses it', () => {
  assert.equal(shouldDismissVertical({ dy: -300, velocity: -2 }), false)
})

test('zoom suppresses vertical dismissal entirely', () => {
  assert.equal(shouldDismissVertical({ dy: 400, velocity: 2, zoomed: true }), false)
})

test('chrome answers a still tap only', () => {
  assert.equal(shouldToggleChrome({}), true)
  assert.equal(shouldToggleChrome({ moved: true }), false)
  assert.equal(shouldToggleChrome({ axis: 'x' }), false)
  assert.equal(shouldToggleChrome({ axis: 'pan' }), false)
  assert.equal(shouldToggleChrome({ doubleTap: true }), false)
  assert.equal(shouldToggleChrome({ zoomed: true }), false)
})

test('chrome stays visible while Share or the contact sheet is open', () => {
  assert.equal(shouldToggleChrome({ shareOpen: true }), false)
  assert.equal(shouldToggleChrome({ sheetOpen: true }), false)
})

test('no accidental single-tap action after a drag', () => {
  assert.equal(pointerMoved(0, 0), false)
  assert.equal(pointerMoved(3, 4), false)
  assert.equal(pointerMoved(40, 0), true)
  assert.equal(pointerMoved(0, 40), true)
})

test('chrome stays until the fan clears it; it never times out on its own', () => {
  const state = read('useGalleryViewer.js')
  assert.ok(!/setTimeout/.test(state), 'the chrome grew an idle timer')
  assert.ok(!/IDLE/.test(state), 'the chrome references an idle budget')
  const chrome = read('GalleryViewerChrome.vue')
  // Close is a real, named, focusable button that the viewer can land on.
  assert.match(chrome, /data-gallery-close/)
  assert.match(chrome, /aria-label="Close photograph"/)
  assert.match(read('GalleryViewer.client.vue'), /\[data-gallery-close\]/)
})

/* ------------------------------------------------------------------ *
 * Part 5 — loading: neighbours only
 * ------------------------------------------------------------------ */
console.log('\nLoading window')

test('only the immediate previous and next are preloaded', () => {
  assert.deepEqual(galleryPreloadWindow(5, 100), [4, 6])
})

test('the preload window never runs off either end', () => {
  assert.deepEqual(galleryPreloadWindow(0, 12), [1])
  assert.deepEqual(galleryPreloadWindow(11, 12), [10])
  assert.deepEqual(galleryPreloadWindow(0, 1), [])
  assert.deepEqual(galleryPreloadWindow(0, 0), [])
})

test('a 100-photograph Night never loads 100 photographs', () => {
  for (let i = 0; i < 100; i += 1) {
    assert.ok(galleryPreloadWindow(i, 100).length <= 2)
  }
})

/* ------------------------------------------------------------------ *
 * Part 5 — image sizing: the documented enlargement rule
 * ------------------------------------------------------------------ */
console.log('\nImage sizing')

test('the enlargement cap tightens as pixel density rises', () => {
  assert.equal(galleryEnlargementCap(1), 2.4)
  assert.equal(galleryEnlargementCap(2), 1.2)
  assert.equal(galleryEnlargementCap(3), 1)
  // Never below native, never above the budget.
  assert.equal(galleryEnlargementCap(10), 1)
  assert.equal(galleryEnlargementCap(0), 2.4)
})

test('contain ratio is uncapped, unlike PhotoSwipe fit', () => {
  // 1024px source on a 1920x1080 stage wants to grow.
  const ratio = galleryContainRatio({
    sourceWidth: 1024, sourceHeight: 575, stageWidth: 1920, stageHeight: 1080,
  })
  assert.ok(ratio > 1, `expected enlargement, got ${ratio}`)
})

test('a small photograph is enlarged on a 1x display instead of marooned', () => {
  const fit = galleryContainScale({
    sourceWidth: 1024, sourceHeight: 575, stageWidth: 1920, stageHeight: 1080, dpr: 1,
  })
  assert.equal(fit.enlarged, true)
  assert.ok(fit.width > 1024, `expected > 1024, got ${fit.width}`)
  // Not blocked at exactly 1x the way the old viewer blocked it.
  assert.ok(fit.scale > 1)
})

test('enlargement is capped, so a broken low-resolution file cannot dominate', () => {
  const fit = galleryContainScale({
    sourceWidth: 320, sourceHeight: 240, stageWidth: 1920, stageHeight: 1080, dpr: 1,
  })
  assert.equal(fit.capped, true)
  assert.equal(fit.scale, GALLERY_ENLARGE_BUDGET)
  assert.equal(fit.width, 768)
})

test('a large photograph is downscaled to contain, never cropped', () => {
  const fit = galleryContainScale({
    sourceWidth: 5506, sourceHeight: 3671, stageWidth: 1280, stageHeight: 800, dpr: 1,
  })
  assert.equal(fit.enlarged, false)
  assert.ok(fit.width <= 1280 && fit.height <= 800)
})

test('aspect ratio survives every sizing decision', () => {
  const cases = [
    { sourceWidth: 5506, sourceHeight: 3671, stageWidth: 1280, stageHeight: 800, dpr: 1 },
    { sourceWidth: 910, sourceHeight: 1024, stageWidth: 390, stageHeight: 780, dpr: 3 },
    { sourceWidth: 320, sourceHeight: 240, stageWidth: 1920, stageHeight: 1080, dpr: 1 },
  ]
  for (const input of cases) {
    const fit = galleryContainScale(input)
    const source = input.sourceWidth / input.sourceHeight
    const shown = fit.width / fit.height
    assert.ok(Math.abs(source - shown) < 0.02, `ratio drifted: ${source} vs ${shown}`)
  }
})

test('a dense phone display does not enlarge', () => {
  const fit = galleryContainScale({
    sourceWidth: 1024, sourceHeight: 575, stageWidth: 390, stageHeight: 780, dpr: 3,
  })
  assert.equal(fit.enlarged, false)
})

test('PhotoSwipe initial zoom uses uncapped contain, then the density budget', () => {
  const level = {
    panAreaSize: { x: 1920, y: 1080 },
    elementSize: { x: 1024, y: 575 },
    fit: 1,
  }
  const initial = galleryInitialZoomLevel(level, { dpr: 1 })
  assert.ok(initial > 1 && initial <= GALLERY_ENLARGE_BUDGET)
})

test('initial zoom falls back to PhotoSwipe fit before the slide is measured', () => {
  assert.equal(galleryInitialZoomLevel({ fit: 0.42 }, { dpr: 1 }), 0.42)
})

test('double tap magnifies 2.4x but never beyond 2.4x native', () => {
  const big = { panAreaSize: { x: 390, y: 780 }, elementSize: { x: 5506, y: 3671 }, fit: 0.07 }
  const initial = galleryInitialZoomLevel(big, { dpr: 3 })
  assert.ok(Math.abs(gallerySecondaryZoomLevel(big, { dpr: 3 }) - initial * 2.4) < 1e-9)

  const tiny = { panAreaSize: { x: 1920, y: 1080 }, elementSize: { x: 320, y: 240 }, fit: 1 }
  // Already enlarged to the cap: there is nothing left in the file to reveal.
  assert.equal(gallerySecondaryZoomLevel(tiny, { dpr: 1 }), GALLERY_ENLARGE_BUDGET)
  assert.equal(galleryInitialZoomLevel(tiny, { dpr: 1 }), GALLERY_ENLARGE_BUDGET)
})

test('pinch keeps real headroom above the double-tap level', () => {
  const level = { panAreaSize: { x: 390, y: 780 }, elementSize: { x: 5506, y: 3671 }, fit: 0.07 }
  assert.ok(galleryMaxZoomLevel(level, { dpr: 3 }) >= gallerySecondaryZoomLevel(level, { dpr: 3 }))
})

test('the responsive source target is the stage, not the file', () => {
  // Height-bound portrait asks for its displayed width, not the full stage.
  assert.equal(galleryStageSourceTarget({ stageWidth: 1400, stageHeight: 800, aspectRatio: 0.75 }), 600)
  assert.equal(galleryStageSourceTarget({ stageWidth: 390, stageHeight: 800, aspectRatio: 1.5 }), 390)
})

/* ------------------------------------------------------------------ *
 * Part 6 — the justified wall
 * ------------------------------------------------------------------ */
console.log('\nJustified wall')

const landscape = { width: 3000, height: 2000 }
const portrait = { width: 910, height: 1024 }

function gallery(count) {
  return Array.from({ length: count }, (_, i) => ({
    ...(i % 3 === 0 ? portrait : landscape),
    id: `p${i}`,
    index: i,
  }))
}

test('one photograph produces one row that does not tower', () => {
  const rows = planJustifiedRows(gallery(1), { availableWidth: 1200, targetHeight: 340, gap: 4 })
  assert.equal(rows.length, 1)
  assert.equal(rows[0].items.length, 1)
  assert.ok(rows[0].height <= 340, `lone frame grew to ${rows[0].height}`)
})

test('12 photographs lay out in justified rows that fill the width', () => {
  const rows = planJustifiedRows(gallery(12), { availableWidth: 1200, targetHeight: 340, gap: 4 })
  assert.ok(rows.length >= 2)
  for (const row of rows.slice(0, -1)) {
    const used = row.items.reduce((sum, item) => sum + item.width, 0) + 4 * (row.items.length - 1)
    assert.ok(Math.abs(used - 1200) <= row.items.length + 2, `row used ${used} of 1200`)
  }
})

test('100 photographs stay bounded and keep every frame', () => {
  const rows = planJustifiedRows(gallery(100), { availableWidth: 1440, targetHeight: 400, gap: 4 })
  const total = rows.reduce((sum, row) => sum + row.items.length, 0)
  assert.equal(total, 100)
  for (const row of rows) {
    assert.ok(row.height > 0 && row.height < 400 * 1.35, `row height ${row.height}`)
  }
})

test('the final row never stretches into a billboard', () => {
  // 13 landscapes: the leftover row is a single very wide frame.
  const rows = planJustifiedRows(
    Array.from({ length: 13 }, (_, i) => ({ ...landscape, id: `L${i}`, index: i })),
    { availableWidth: 1200, targetHeight: 300, gap: 4 },
  )
  const last = rows[rows.length - 1]
  assert.ok(last.height <= 300 * 1.3, `final row reached ${last.height}`)
})

test('portrait and landscape share a row without cropping', () => {
  const rows = planJustifiedRows([portrait, landscape, portrait], {
    availableWidth: 1200, targetHeight: 300, gap: 4,
  })
  const row = rows[0]
  for (const item of row.items) {
    const source = item.photo.width / item.photo.height
    const shown = item.width / item.height
    assert.ok(Math.abs(source - shown) < 0.03, 'a frame was cropped to fit')
  }
})

test('geometry is reserved from intrinsic dimensions, before any load', () => {
  const rows = planJustifiedRows(gallery(6), { availableWidth: 1200, targetHeight: 340, gap: 4 })
  for (const row of rows) {
    for (const item of row.items) {
      assert.ok(item.width > 0 && item.height > 0, 'a frame had no reserved geometry')
    }
  }
})

test('an extreme panorama cannot flatten its whole row', () => {
  assert.equal(galleryPhotoRatio({ width: 6000, height: 600 }), GALLERY_MAX_RATIO)
  assert.ok(galleryPhotoRatio({ width: 600, height: 6000 }) >= 0.45)
})

test('a photograph with no dimensions still lays out', () => {
  assert.equal(galleryPhotoRatio({}), 1.5)
  const rows = planJustifiedRows([{ id: 'x' }, { id: 'y' }], {
    availableWidth: 1200, targetHeight: 300, gap: 4,
  })
  assert.ok(rows.length >= 1)
})

test('an empty gallery plans no rows rather than throwing', () => {
  assert.deepEqual(planJustifiedRows([], { availableWidth: 1200, targetHeight: 300 }), [])
  assert.deepEqual(planJustifiedRows(null, { availableWidth: 1200, targetHeight: 300 }), [])
  assert.deepEqual(planJustifiedRows(gallery(3), { availableWidth: 0, targetHeight: 300 }), [])
})

test('the wall is edge to edge on a phone and inset on a desktop', () => {
  assert.equal(galleryWallAvailableWidth(390), 390)
  assert.ok(galleryWallAvailableWidth(1440) < 1440)
})

test('row height and plate height scale with the viewport', () => {
  assert.ok(galleryTargetRowHeight(390) < galleryTargetRowHeight(1440))
  assert.ok(galleryPlateHeight(390, 844) > 0)
  assert.ok(galleryPlateHeight(844, 390) > 0)
  assert.equal(galleryPlateHeight(0, 0), 0)
})

/* ------------------------------------------------------------------ *
 * The sequence — spreads, decided once, drawn by CSS
 * ------------------------------------------------------------------ */
console.log('\nSequence')

function dims(list) {
  return list.map(([w, h], i) => ({ id: `s${i}`, index: i, width: w, height: h }))
}

const L = [1500, 1000]
const P = [700, 1000]
const S = [1000, 1000]

function shape(plan) {
  return plan.map((spread) => `${spread.kind}:${spread.items.map((it) => it.orientation[0]).join('')}`)
}

test('orientation splits at the documented thresholds', () => {
  assert.equal(sequenceOrientation(0.7), 'portrait')
  assert.equal(sequenceOrientation(1.0), 'square')
  assert.equal(sequenceOrientation(1.5), 'landscape')
  assert.equal(sequenceOrientation(0), 'square')
})

test('every photograph is placed exactly once, in order', () => {
  for (const n of [1, 2, 3, 5, 8, 13, 40, 120]) {
    const photos = dims(Array.from({ length: n }, (_, i) => (i % 3 === 1 ? P : i % 5 === 2 ? S : L)))
    const plan = planGallerySequence(photos)
    const indexes = plan.flatMap((spread) => spread.items.map((it) => it.index))
    assert.deepEqual(indexes, photos.map((p) => p.index), `n=${n} lost or reordered a photograph`)
  }
})

test('the five-photograph mixed gallery is three spreads, never one plate and four thumbnails', () => {
  const plan = planGallerySequence(dims([[1920, 1281], [1920, 1440], [3513, 4918], [1920, 2559], [1920, 1280]]))
  assert.deepEqual(shape(plan), ['solo:l', 'pair:lp', 'pair:pl'])
  const theirs = planGallerySequence(dims([[600, 1000], [1000, 1000], [1500, 1000], [800, 1000], [2300, 1000]]))
  assert.ok(theirs.every((spread) => spread.count <= 2), 'a five-photograph gallery produced a trio')
  assert.ok(theirs.some((spread) => spread.kind === 'solo'), 'no photograph was given the stage')
})

test('one photograph is one solo, whatever its shape', () => {
  assert.deepEqual(shape(planGallerySequence(dims([P]))), ['solo:p'])
  assert.deepEqual(shape(planGallerySequence(dims([L]))), ['solo:l'])
})

test('two landscapes each get the stage; two portraits hang as a pair', () => {
  assert.deepEqual(shape(planGallerySequence(dims([L, L]))), ['solo:l', 'solo:l'])
  assert.deepEqual(shape(planGallerySequence(dims([P, P]))), ['pair:pp'])
})

test('a portrait always finds a partner in a wide column', () => {
  const plan = planGallerySequence(dims([L, P, L, L, P, L, L, P, L, L]))
  for (const spread of plan) {
    if (spread.kind === 'solo') assert.notEqual(spread.items[0].orientation, 'portrait', 'a portrait was left alone')
  }
})

test('trios appear only in long galleries, never back to back', () => {
  const short = planGallerySequence(dims([L, L, L, L, L, L]))
  assert.ok(short.every((spread) => spread.kind !== 'trio'), 'a six-photograph gallery produced a trio')
  const long = planGallerySequence(dims(Array.from({ length: 24 }, (_, i) => (i % 4 === 1 ? P : L))))
  let last = null
  for (const spread of long) {
    assert.ok(!(last === 'trio' && spread.kind === 'trio'), 'two trios in a row')
    last = spread.kind
  }
})

test('the same beat never repeats more than twice in a long landscape run', () => {
  const plan = planGallerySequence(dims(Array.from({ length: 12 }, () => L)))
  let run = 1
  for (let i = 1; i < plan.length; i += 1) {
    run = plan[i].kind === plan[i - 1].kind ? run + 1 : 1
    assert.ok(run <= 2, `the ${plan[i].kind} beat repeated ${run} times`)
  }
})

test('shares inside a spread sum to one and follow the ratios', () => {
  const plan = planGallerySequence(dims([L, P, L, L, P]))
  for (const spread of plan) {
    const sum = spread.items.reduce((acc, it) => acc + it.share, 0)
    assert.ok(Math.abs(sum - 1) < 1e-9)
    for (const it of spread.items) assert.ok(Math.abs(it.share - it.ratio / spread.ratioSum) < 1e-9)
  }
})

test('on a phone, adjacent portraits inside a spread stay a pair and everything else takes the row', () => {
  const plan = planGallerySequence(dims([P, P, L, P, L]))
  const items = plan.flatMap((spread) => spread.items)
  assert.equal(items[0].narrow, 'half')
  assert.equal(items[1].narrow, 'half')
  assert.ok(Math.abs(items[0].narrowShare + items[1].narrowShare - 1) < 1e-9)
  for (const it of items.slice(2)) assert.equal(it.narrow, 'full')
})

test('sizes name the print\'s share of the column at every breakpoint, in the CSS numbers', () => {
  const plan = planGallerySequence(dims([L, P]))
  const spread = plan.find((s) => s.count === 2)
  assert.ok(spread, 'expected a pair')
  const sizes = sequenceSizes(spread.items[0], spread)
  assert.match(sizes, new RegExp(`\\(min-width: ${SEQUENCE_BREAKPOINTS.xl}px\\) calc\\(\\(\\(min\\(${SEQUENCE_MASONRY.maxWidth}px`))
  assert.match(sizes, new RegExp(`\\(min-width: ${SEQUENCE_BREAKPOINTS.md}px\\) calc\\(\\(100vw - ${SEQUENCE_PADDING.md * 2 + SEQUENCE_GAP.md}px\\)`))
  assert.ok(sizes.trim().endsWith('100vw'), 'a full-row phone print should ask for 100vw')
  const halves = planGallerySequence(dims([P, P]))[0]
  assert.match(sequenceSizes(halves.items[0], halves), new RegExp(`calc\\(\\(100vw - ${SEQUENCE_GAP.sm}px\\) \\* 0\\.\\d+\\)$`))
})

test('the component CSS carries the same stage numbers the planner exports', () => {
  const style = read('GallerySequence.vue').split('<style')[1] || ''
  assert.match(style, new RegExp(`--seq-gap: ${SEQUENCE_GAP.sm}px`))
  assert.match(style, new RegExp(`@media \\(min-width: ${SEQUENCE_BREAKPOINTS.md}px\\) \\{\\s*\\.seq \\{ --seq-pad: ${SEQUENCE_PADDING.md}px; --seq-gap: ${SEQUENCE_GAP.md}px;`))
  assert.match(style, new RegExp(`@media \\(min-width: ${SEQUENCE_BREAKPOINTS.lg}px\\) \\{\\s*\\.seq \\{ --seq-pad: ${SEQUENCE_PADDING.lg}px; --seq-gap: ${SEQUENCE_GAP.lg}px;`))
  assert.match(style, new RegExp(`@media \\(min-width: ${SEQUENCE_BREAKPOINTS.xl}px\\) \\{\\s*\\.seq \\{ --seq-pad: ${SEQUENCE_PADDING.xl}px;`))
  assert.match(style, new RegExp(`max-width: calc\\(${SEQUENCE_MAX_WIDTH}px`))
  assert.match(style, new RegExp(`max-width: calc\\(${SEQUENCE_MASONRY.maxWidth}px`))
  assert.match(style, new RegExp(`gap: ${SEQUENCE_MASONRY.gap}px`))
})

test('the sequence is drawn by CSS from intrinsic ratios; nothing is measured or cropped', () => {
  const source = read('GallerySequence.vue')
  const style = source.split('<style')[1] || ''
  assert.ok(!/getBoundingClientRect|innerWidth|ResizeObserver/.test(source), 'the sequence measures the viewport')
  // Intrinsic dimensions reserve the box before load.
  assert.match(source, /:width="item\.photo\.width \|\| undefined"/)
  assert.match(source, /:height="item\.photo\.height \|\| undefined"/)
  assert.match(style, /aspect-ratio: var\(--r\)/)
  assert.match(style, /flex: var\(--grow\) 1 0px/)
  assert.ok(!/object-fit: cover/.test(style), 'a print is cropped')
  // Phone / tablet still height-cap a spread; desktop dissolves it into columns.
  assert.match(style, /max-width: min\(\s*calc\(var\(--spread-cap\) \* var\(--spread-sum\)/)
  assert.match(style, /calc\(var\(--spread-limit\) \+ var\(--spread-gaps\) \* var\(--seq-gap\)\)/)
  assert.match(source, /SEQUENCE_CAP\.solo/)
  assert.match(source, /dvh/)
  assert.match(style, /display: contents/)
  assert.match(style, /grid-template-columns: 1fr 1fr/)
})

test('desktop columns keep every print on its own width; a panorama spans both', () => {
  const rocksnaps = planGallerySequence(dims([[1024, 682], [1254, 1254], [1365, 2048], [349, 618]]))
  const items = rocksnaps.flatMap((spread) => spread.items)
  assert.equal(items.length, 4)
  assert.ok(items.every((it) => it.span === 'col'), 'a mixed four-print gallery spanned a column')
  assert.equal(items[3].frameLimit, Math.round(349 * SEQUENCE_ENLARGE_BUDGET))
  assert.ok(items[3].frameLimit > 800, 'the small portrait is still allowed a full column')
  const wide = planGallerySequence(dims([[2400, 800], [1000, 1500]]))[0].items[0]
  assert.equal(wide.span, 'wide')
  const three = planGallerySequence(dims([L, L, L])).flatMap((s) => s.items)
  assert.equal(three[2].span, 'wide')
  const one = planGallerySequence(dims([L]))[0].items[0]
  assert.equal(one.span, 'wide')
})

test('grow factors sum to 100 in every spread, so a lone portrait still fills its row', () => {
  // Flexbox hands out free space in proportion only once grow factors sum to ≥ 1.
  const source = read('GallerySequence.vue')
  assert.match(source, /item\.share \* 100000\) \/ 1000/)
  const plan = planGallerySequence(dims([P]))
  assert.equal(plan.length, 1)
  assert.ok(Math.abs(plan[0].items[0].share - 1) < 1e-9)
})

test('a small file stops growing at the enlargement budget; a large one never meets it', () => {
  const tiny = planGallerySequence(dims([[240, 160]]))[0]
  assert.equal(tiny.enlargeLimit, Math.round(240 * SEQUENCE_ENLARGE_BUDGET))
  const big = planGallerySequence(dims([[5506, 3671]]))[0]
  assert.ok(big.enlargeLimit > 10000)
  const pair = planGallerySequence(dims([[240, 160], [700, 1000]]))[0]
  const tinyItem = pair.items.find((it) => it.photo.width === 240)
  assert.equal(pair.enlargeLimit, Math.round((240 * SEQUENCE_ENLARGE_BUDGET) / tinyItem.share))
  assert.equal(spreadEnlargeLimit([{ photo: {}, share: 1 }]), null)
})

test('the overview no longer plans pixels and never crops', () => {
  const source = read('GalleryOverview.vue')
  assert.match(source, /GallerySequence/)
  assert.ok(!/planJustifiedRows|galleryContainScale|viewportWidth/.test(source), 'the overview went back to measuring')
  assert.ok(!/object-fit: cover/.test(source), 'the overview crops')
  assert.ok(!/closeLine/.test(source), 'the overview still repeats the gallery title under the prints')
  assert.match(source, /gov__close/)
})

/* ------------------------------------------------------------------ *
 * Part 2 / 4 — history: one entry, owned outright
 * ------------------------------------------------------------------ */
console.log('\nHistory and deep links')

function fakeBrowser({ pathname = '/badflower/gallery/the-basement-east', search = '', hash = '' } = {}) {
  const stack = [{ url: `${pathname}${search}${hash}`, state: null }]
  let popHandler = null
  const location = {
    get pathname() { return pathname },
    get search() { return search },
    get hash() { return stack[stack.length - 1].url.includes('#') ? `#${stack[stack.length - 1].url.split('#')[1]}` : '' },
  }
  const history = {
    get state() { return stack[stack.length - 1].state },
    pushState(state, _title, url) { stack.push({ url, state }) },
    replaceState(state, _title, url) { stack[stack.length - 1] = { url, state } },
    back() {
      if (stack.length > 1) stack.pop()
      popHandler?.()
    },
    get length() { return stack.length },
  }
  const win = {
    location,
    addEventListener(name, fn) { if (name === 'popstate') popHandler = fn },
    removeEventListener(name) { if (name === 'popstate') popHandler = null },
  }
  return { history, win, stack, pop: () => history.back() }
}

test('a photo hash round-trips and rejects anything else', () => {
  assert.equal(galleryPhotoHash('42'), '#photo-42')
  assert.equal(readGalleryPhotoHash('#photo-42'), '42')
  assert.equal(readGalleryPhotoHash('#living-gallery'), '')
  assert.equal(readGalleryPhotoHash(''), '')
  assert.equal(galleryPhotoHash(''), '')
  // No path or query smuggling through the fragment.
  assert.equal(galleryPhotoHash('a/b?c=1'), '#photo-abc1')
})

test('a deep link resolves only against authorized photographs', () => {
  const photos = [{ id: '10' }, { id: '11' }, { id: '12' }]
  assert.equal(resolveDeepLinkedIndex('#photo-11', photos), 1)
  // An id that is not in the authorized list opens the overview, not a guess.
  assert.equal(resolveDeepLinkedIndex('#photo-99', photos), null)
  assert.equal(resolveDeepLinkedIndex('', photos), null)
})

test('opening pushes exactly one entry', () => {
  const browser = fakeBrowser()
  const h = createGalleryViewerHistory(browser)
  h.enter('42')
  assert.equal(browser.stack.length, 2)
  assert.ok(browser.stack[1].url.endsWith('#photo-42'))
  assert.equal(browser.stack[1].state[GALLERY_HISTORY_STATE_KEY], true)
  // A second enter must not stack a second entry.
  h.enter('42')
  assert.equal(browser.stack.length, 2)
})

test('paging rewrites the entry instead of adding one', () => {
  const browser = fakeBrowser()
  const h = createGalleryViewerHistory(browser)
  h.enter('1')
  for (const id of ['2', '3', '4', '5']) h.sync(id)
  assert.equal(browser.stack.length, 2, 'paging added history entries')
  assert.ok(browser.stack[1].url.endsWith('#photo-5'), 'deep link did not follow paging')
})

test('release pops only the entry we own', () => {
  const browser = fakeBrowser()
  const h = createGalleryViewerHistory(browser)
  h.enter('42')
  assert.equal(h.ownsTopEntry(), true)
  assert.equal(h.release(), true)
  assert.equal(browser.stack.length, 1, 'release did not return to the overview entry')
})

/*
 * The Gallery Stack hands a gallery page a *numeric* photo index on
 * `history.state.fqGalleryPhoto`. The viewer's ownership marker must not
 * collide with it, in either direction.
 */
test('the viewer marker cannot collide with the Gallery Stack hand-off key', () => {
  assert.notEqual(
    GALLERY_HISTORY_STATE_KEY,
    STACK_OPEN_INDEX_KEY,
    'the viewer marker and the stack photo index share a history.state key',
  )

  // A stack hand-off of index 0 must not read as "we do not own this entry",
  // and index 3 must not read as "we do".
  for (const handoff of [0, 3]) {
    const browser = fakeBrowser()
    browser.stack[0].state = { [STACK_OPEN_INDEX_KEY]: handoff }
    const h = createGalleryViewerHistory(browser)
    h.enter('42')
    assert.equal(h.ownsTopEntry(), true, `stack index ${handoff} broke ownership`)
    // The stack's index survives underneath, unclobbered, for the page below.
    assert.equal(browser.stack[0].state[STACK_OPEN_INDEX_KEY], handoff)
    assert.equal(h.release(), true)
    assert.equal(browser.stack.length, 1, `stack index ${handoff} stranded an entry`)
  }
})

test('ownership requires our exact marker, not merely a truthy value', () => {
  const browser = fakeBrowser()
  const h = createGalleryViewerHistory(browser)
  h.enter('42')
  // Something else parks a truthy value of its own on our key.
  browser.stack[browser.stack.length - 1].state = { [GALLERY_HISTORY_STATE_KEY]: 7 }
  assert.equal(h.ownsTopEntry(), false, 'a foreign truthy value passed as our marker')
  assert.equal(h.release(), false)
  assert.equal(browser.stack.length, 2, 'release popped an entry we do not own')
})

test('release is inert when we do not own the top entry', () => {
  const browser = fakeBrowser()
  const h = createGalleryViewerHistory(browser)
  // Never opened: releasing must not touch anyone else's history.
  assert.equal(h.release(), false)
  assert.equal(browser.stack.length, 1)
})

test('a popstate close never pops again', () => {
  const browser = fakeBrowser()
  let closes = 0
  const h = createGalleryViewerHistory({ ...browser, onPopClose: () => { closes += 1 } })
  h.attach()
  h.enter('42')
  browser.pop()
  assert.equal(closes, 1, 'Back did not close the viewer')
  assert.equal(browser.stack.length, 1)
  // The dismissal intent says not to release, and the module agrees.
  assert.equal(h.release(), false)
  assert.equal(browser.stack.length, 1, 'a second pop left the gallery')
  h.detach()
})

test('Back from a shared deep link lands on that gallery overview', () => {
  // The fan arrived directly on #photo-42, so there is no gallery entry yet.
  const browser = fakeBrowser({ hash: '#photo-42' })
  const h = createGalleryViewerHistory(browser)
  h.enter('42')
  assert.equal(browser.stack.length, 2)
  // Entry 0 was rewritten to the bare gallery URL, so Back is the overview.
  assert.ok(!browser.stack[0].url.includes('#'), 'deep-link entry kept its hash')
  assert.ok(browser.stack[0].url.endsWith('/badflower/gallery/the-basement-east'))
  h.release()
  assert.equal(browser.stack.length, 1)
  assert.ok(!browser.stack[0].url.includes('#'))
})

test('history is inert without a window, so SSR cannot crash', () => {
  const h = createGalleryViewerHistory({ history: null, win: null })
  h.attach()
  h.enter('1')
  h.sync('2')
  assert.equal(h.release(), false)
  assert.equal(h.isPushed(), false)
  h.detach()
})

/* ------------------------------------------------------------------ *
 * Part 7 — one normalized media model at the boundary
 * ------------------------------------------------------------------ */
console.log('\nMedia model')

const mediaRow = {
  type: 'image',
  id: 77,
  mediaId: 77,
  url: 'https://qrcode101.s3.us-east-1.amazonaws.com/medium_night.jpg',
  thumbnailUrl: 'https://qrcode101.s3.us-east-1.amazonaws.com/thumbnail_night.jpg',
  largeUrl: 'https://qrcode101.s3.us-east-1.amazonaws.com/large_night.jpg',
  originalUrl: 'https://qrcode101.s3.us-east-1.amazonaws.com/night.jpg',
  width: 5506,
  height: 3671,
  alt: 'The room, the second the lights came up.',
  caption: 'The room, the second the lights came up.',
  protected: false,
  formats: {
    thumbnail: { url: 'https://qrcode101.s3.us-east-1.amazonaws.com/thumbnail_night.jpg', width: 245, height: 164 },
    small: { url: 'https://qrcode101.s3.us-east-1.amazonaws.com/small_night.jpg', width: 500, height: 333 },
    medium: { url: 'https://qrcode101.s3.us-east-1.amazonaws.com/medium_night.jpg', width: 750, height: 500 },
    large: { url: 'https://qrcode101.s3.us-east-1.amazonaws.com/large_night.jpg', width: 1000, height: 667 },
  },
}

const payload = {
  artist: {
    id: 3,
    name: 'Badflower',
    slug: 'badflower',
    image: {
      url: 'https://qrcode101.s3.us-east-1.amazonaws.com/badflower.jpg',
      width: 1200,
      height: 1200,
      alternativeText: 'Badflower',
      formats: {
        thumbnail: { url: 'https://qrcode101.s3.us-east-1.amazonaws.com/thumbnail_badflower.jpg', width: 156, height: 156 },
        small: { url: 'https://qrcode101.s3.us-east-1.amazonaws.com/small_badflower.jpg', width: 500, height: 500 },
      },
    },
    focalX: 50,
    focalY: 40,
  },
  gallery: {
    slug: 'the-basement-east',
    title: 'The Basement East',
    caption: 'Twelve frames from a loud room.',
    visibility: 'public',
    photoCount: 2,
    locked: false,
    media: [mediaRow, { ...mediaRow, id: 78, mediaId: 78 }],
    canonicalPath: '/badflower/gallery/the-basement-east',
  },
  night: {
    nightSlug: 'basement-east-2026-03-14',
    title: 'The Basement East',
    venue: 'The Basement East',
    city: 'Nashville',
    region: 'TN',
    performanceStartsAt: '2026-03-14T20:00:00.000Z',
    timezone: 'America/Chicago',
  },
  viewer: { authenticated: true, youWereThere: true, showOrdinal: 3 },
  share: {
    canonicalPath: '/badflower/gallery/the-basement-east',
    title: 'Badflower at The Basement East · Nashville',
    description: 'Twelve frames from a loud room.',
    image: { url: 'https://qrcode101.s3.us-east-1.amazonaws.com/large_night.jpg', width: 1000, height: 667 },
  },
}

test('a photograph normalizes to the flat shape the viewer needs', () => {
  const photo = normalizeGalleryPhoto(mediaRow, 0)
  assert.equal(photo.id, '77')
  assert.ok(photo.src)
  assert.ok(photo.fullSrc)
  assert.ok(photo.thumbSrc)
  assert.equal(photo.width, 5506)
  assert.equal(photo.height, 3671)
  assert.ok(photo.aspectRatio > 1)
  assert.ok(photo.alt)
  assert.equal(photo.protected, false)
})

test('a normalized photograph carries a multi-candidate srcset', () => {
  const photo = normalizeGalleryPhoto(mediaRow, 0)
  assert.ok(photo.srcset.includes(','), 'a single-candidate srcset makes zoom levels lie')
  assert.ok(photo.srcsetCandidates.length > 1)
  assert.ok(photo.sizes)
})

test('unavailable media is dropped and positions are re-indexed', () => {
  const photos = normalizeGalleryPhotos([
    mediaRow,
    { ...mediaRow, id: 78, mediaId: 78, unavailable: true },
    { ...mediaRow, id: 79, mediaId: 79 },
  ])
  assert.equal(photos.length, 2)
  assert.deepEqual(photos.map((p) => p.index), [0, 1])
  assert.deepEqual(photos.map((p) => p.id), ['77', '79'])
})

test('identity comes from the real band image, at a responsive size', () => {
  const identity = normalizeGalleryIdentity(payload)
  assert.equal(identity.artistName, 'Badflower')
  assert.equal(identity.artistPath, '/badflower')
  assert.ok(identity.artistImage.src)
  assert.ok(identity.artistImage.srcset.includes('w'))
  assert.ok(identity.artistImage.sizes)
  assert.equal(identity.focalY, 40)
})

test('identity degrades gracefully when the artist has no image', () => {
  const identity = normalizeGalleryIdentity({ artist: { name: 'Moon Dough', slug: 'moon-dough' }, gallery: {} })
  assert.equal(identity.artistImage, null)
  assert.equal(identity.artistInitial, 'M')
  assert.equal(identity.artistName, 'Moon Dough')
})

test('identity never invents a venue or a date', () => {
  const linked = normalizeGalleryIdentity(payload)
  assert.ok(linked.placeLine.includes('The Basement East'))
  assert.ok(linked.dateLine)
  assert.ok(linked.nightPath)

  const unlinked = normalizeGalleryIdentity({ ...payload, night: null })
  assert.equal(unlinked.placeLine, '')
  assert.equal(unlinked.dateLine, '')
  assert.equal(unlinked.nightPath, null)
  assert.equal(unlinked.showLinked, false)
})

test('the model normalizes once and reports real visibility', () => {
  const model = normalizeGalleryModel(payload, { bandSlug: 'badflower' })
  assert.equal(model.photos.length, 2)
  assert.equal(model.locked, false)
  assert.equal(model.visibility, 'public')
  assert.equal(model.isPublic, true)
  assert.equal(model.canonicalPath, '/badflower/gallery/the-basement-east')
  assert.equal(model.identity.photoCount, 2)
})

test('a locked gallery yields no photographs and cannot be unlocked client-side', () => {
  const model = normalizeGalleryModel({
    ...payload,
    gallery: { ...payload.gallery, locked: true, lockReason: 'show_attendees', visibility: 'show_attendees', media: [] },
  }, { bandSlug: 'badflower' })
  assert.equal(model.photos.length, 0)
  assert.equal(model.locked, true)
  assert.equal(model.isPublic, false)
  assert.equal(model.lockReason, 'show_attendees')
})

test('an attendee-only gallery is never reported as public', () => {
  const model = normalizeGalleryModel({
    ...payload,
    gallery: { ...payload.gallery, visibility: 'show_attendees' },
  }, { bandSlug: 'badflower' })
  assert.equal(model.isPublic, false)
})

/* ------------------------------------------------------------------ *
 * Part 4 — share: canonical helper, two intents, no media URLs
 * ------------------------------------------------------------------ */
console.log('\nShare')

const ORIGIN = 'https://faneqo.com'
const model = normalizeGalleryModel(payload, { bandSlug: 'badflower' })

test('the canonical helper now accepts a deliberate fragment', () => {
  assert.equal(
    faneqoShareUrl({ canonicalPath: '/badflower/gallery/x', origin: ORIGIN, hash: '#photo-7' }),
    'https://faneqo.com/badflower/gallery/x#photo-7',
  )
  // Unchanged for every existing caller.
  assert.equal(
    faneqoShareUrl({ canonicalPath: '/badflower/gallery/x', origin: ORIGIN }),
    'https://faneqo.com/badflower/gallery/x',
  )
})

test('the fragment cannot smuggle a query or a path', () => {
  assert.equal(
    faneqoShareUrl({ canonicalPath: '/badflower/gallery/x', origin: ORIGIN, hash: '#a?b=1&c=/d' }),
    'https://faneqo.com/badflower/gallery/x#ab1cd',
  )
})

test('Copy Link for the gallery is a clean public URL', () => {
  const url = galleryShareUrl({ canonicalPath: model.canonicalPath, origin: ORIGIN })
  assert.equal(url, 'https://faneqo.com/badflower/gallery/the-basement-east')
  assert.ok(!url.includes('?'))
  assert.ok(!url.includes('#'))
})

test('Copy Link for a photograph reopens that photograph', () => {
  const url = galleryPhotoShareUrl({ canonicalPath: model.canonicalPath, photoId: '78', origin: ORIGIN })
  assert.equal(url, 'https://faneqo.com/badflower/gallery/the-basement-east#photo-78')
  assert.equal(readGalleryPhotoHash(`#${url.split('#')[1]}`), '78')
})

test('share transport strips local navigation context', () => {
  const url = galleryShareUrl({
    canonicalPath: '/badflower/gallery/x?from=%2Fgalleries&photo=3',
    origin: ORIGIN,
  })
  assert.equal(url, 'https://faneqo.com/badflower/gallery/x')
})

test('both intents exist and the viewer defaults to the photograph', () => {
  const intents = galleryShareIntents({ model, photo: model.photos[1], origin: ORIGIN })
  assert.equal(intents.gallery.kind, 'gallery')
  assert.equal(intents.photo.kind, 'photo')
  assert.equal(intents.default.kind, 'photo')
  assert.ok(intents.photo.url.endsWith('#photo-78'))
  assert.ok(!intents.gallery.url.includes('#'))
})

test('a share intent never carries a media URL', () => {
  const intents = galleryShareIntents({ model, photo: model.photos[0], origin: ORIGIN })
  for (const intent of [intents.gallery, intents.photo]) {
    assert.ok(intent.url.startsWith('https://faneqo.com/'), intent.url)
    assert.ok(!intent.url.includes('amazonaws'), 'a media host reached a share link')
    assert.ok(!/X-Amz-Signature|faneqo-protected/i.test(intent.url))
  }
})

test('the preview image comes from the backend share contract only', () => {
  const intents = galleryShareIntents({ model, photo: model.photos[0], origin: ORIGIN })
  assert.equal(intents.photo.image, payload.share.image.url)

  const signed = galleryShareIntents({
    model: {
      ...model,
      share: { ...payload.share, image: { url: 'https://s3/x.jpg?X-Amz-Signature=abc' } },
    },
    photo: model.photos[0],
    origin: ORIGIN,
  })
  assert.equal(signed.photo.image, null, 'a signed URL reached a share preview')
})

test('a locked gallery cannot be shared at all', () => {
  const locked = normalizeGalleryModel({
    ...payload,
    gallery: { ...payload.gallery, locked: true, media: [] },
  }, { bandSlug: 'badflower' })
  assert.equal(canShareGallery(locked), false)
  assert.equal(galleryShareIntents({ model: locked, origin: ORIGIN }), null)
})

test('an unavailable gallery cannot be shared', () => {
  assert.equal(canShareGallery({ ...model, unavailable: true }), false)
})

test('a gallery with no canonical path cannot be shared', () => {
  assert.equal(canShareGallery({ ...model, canonicalPath: '' }), false)
})

test('reach is stated honestly for public and gated galleries', () => {
  assert.match(galleryShareReachNote({ isPublic: true }), /Anyone/)
  assert.match(galleryShareReachNote({ isPublic: false }), /checks who is opening it/)
  const gated = galleryShareIntents({
    model: { ...model, isPublic: false, visibility: 'show_attendees' },
    photo: model.photos[0],
    origin: ORIGIN,
  })
  assert.equal(gated.photo.requiresAccess, true)
})

/* ------------------------------------------------------------------ *
 * Desktop step controls — previous / next
 * ------------------------------------------------------------------ */
console.log('\nDesktop step')

/**
 * The real composable, driven directly. `useGalleryViewer` registers
 * `onBeforeUnmount`, which Vue warns about outside a component; the warning
 * is the only thing standing between this suite and the actual boundary
 * logic, so it is silenced rather than worked around.
 */
function viewerOver(count) {
  const photos = Array.from({ length: count }, (_, i) => ({
    id: `p${i}`, index: i, src: `/p${i}.jpg`, width: 1200, height: 800,
  }))
  const warn = console.warn
  console.warn = () => {}
  try {
    return useGalleryViewer({ photos: () => photos, model: () => null, origin: ORIGIN })
  } finally {
    console.warn = warn
  }
}

test('a one-photograph gallery offers no step in either direction', () => {
  const v = viewerOver(1)
  assert.equal(v.canPrev.value, false)
  assert.equal(v.canNext.value, false)
})

test('an empty gallery offers no step', () => {
  const v = viewerOver(0)
  assert.equal(v.canPrev.value, false)
  assert.equal(v.canNext.value, false)
})

test('the step is offered only in the direction that has a photograph', () => {
  const v = viewerOver(12)
  assert.equal(v.canPrev.value, false, 'a back step was offered on the first photograph')
  assert.equal(v.canNext.value, true)
  v.goTo(11)
  assert.equal(v.canPrev.value, true)
  assert.equal(v.canNext.value, false, 'a forward step was offered on the last photograph')
})

test('the step cannot walk off either end', () => {
  const v = viewerOver(12)
  v.prev()
  assert.equal(v.index.value, 0, 'prev moved before the first photograph')
  v.goTo(11)
  v.next()
  assert.equal(v.index.value, 11, 'next moved past the last photograph')
})

test('one step moves exactly one photograph', () => {
  const v = viewerOver(12)
  v.next()
  assert.equal(v.index.value, 1)
  v.next()
  assert.equal(v.index.value, 2)
  v.prev()
  assert.equal(v.index.value, 1)
})

test('a step resets zoom and never closes the viewer', () => {
  const v = viewerOver(12)
  v.setZoomed(true)
  v.next()
  assert.equal(v.zoomed.value, false, 'zoom survived a step')
  assert.equal(v.open.value, false, 'a step opened or closed the viewer')
})

test('stepping is not a dismissal reason', () => {
  for (const reason of ['next', 'prev', 'step']) {
    assert.equal(resolveDismissIntent({ reason }).action, 'ignore', `${reason} reached dismissal`)
  }
})

test('the step controls are guarded by the bounds, not merely styled', () => {
  const source = read('GalleryViewerChrome.vue')
  assert.match(source, /v-if="canPrev"/)
  assert.match(source, /v-if="canNext"/)
  assert.match(source, /canPrev: \{ type: Boolean, default: false \}/)
  assert.match(source, /canNext: \{ type: Boolean, default: false \}/)
})

test('the step controls are named for a screen reader', () => {
  const source = read('GalleryViewerChrome.vue')
  assert.match(source, /aria-label="Previous photograph"/)
  assert.match(source, /aria-label="Next photograph"/)
  // Real buttons, not clickable decoration.
  assert.match(source, /class="chrome__step chrome__step--prev hit"[\s\S]{0,40}aria-label/)
})

test('a step emits a step, never a close', () => {
  const source = read('GalleryViewerChrome.vue')
  assert.match(source, /@click\.stop="\$emit\('prev'\)"/)
  assert.match(source, /@click\.stop="\$emit\('next'\)"/)
  // A drag that begins on an arrow must not become a drag of the photograph.
  assert.match(source, /@pointerdown\.stop/)
})

test('side arrows start at tablet width; a phone carries the step in the foot', () => {
  const source = read('GalleryViewerChrome.vue')
  assert.match(source, /\.chrome__step \{\s*display: none;/)
  assert.match(source, /@media \(min-width: 640px\) \{\s*\.chrome__step \{/)
  assert.match(source, /@media \(min-width: 1024px\) and \(hover: hover\)/)
  // The phone step flanks the counter and stays put at the ends of the Night.
  assert.match(source, /class="chrome__footstep hit"[\s\S]{0,60}:disabled="!canPrev"/)
  assert.match(source, /class="chrome__footstep hit"[\s\S]{0,60}:disabled="!canNext"/)
  assert.match(source, /@media \(min-width: 640px\) \{\s*\.chrome__footstep \{\s*display: none;/)
})

test('the step lives in the chrome layer, not on the photograph', () => {
  const source = read('GalleryViewerChrome.vue')
  // `.hit` is what makes a control interactive, and only while chrome is awake.
  assert.match(source, /chrome__step chrome__step--prev hit/)
  assert.match(source, /chrome__step chrome__step--next hit/)
  assert.match(source, /\.chrome\.is-on \.hit \{\s*pointer-events: auto;/)
})

test('the step carries no adjacent-image preview', () => {
  // Markup only: the prose above it is allowed to name what it refuses to be.
  const template = read('GalleryViewerChrome.vue').split('</template>')[0]
  assert.ok(!/<img\b/.test(template), 'the chrome renders a photograph of its own')
  assert.ok(
    !/class="[^"]*(thumb|preview|filmstrip)/i.test(template),
    'the step grew an adjacent-image preview',
  )
})

test('the viewer feeds the bounds in and routes both directions through one step', () => {
  const source = read('GalleryViewer.client.vue')
  assert.match(source, /:can-prev="viewer\.canPrev\.value"/)
  assert.match(source, /:can-next="viewer\.canNext\.value"/)
  assert.match(source, /@prev="step\(-1\)"/)
  assert.match(source, /@next="step\(1\)"/)
  // Arrow keys take the same path, so they cannot drift from the controls.
  assert.match(source, /key === 'ArrowRight'\)\s*\{\s*step\(1\)/)
  assert.match(source, /key === 'ArrowLeft'\)\s*\{\s*step\(-1\)/)
})

test('a step falls back to state when the engine has not resolved', () => {
  const source = read('GalleryViewer.client.vue')
  assert.match(source, /function step\(direction\)/)
  assert.match(source, /if \(!viewer\.open\.value\) return/)
  assert.match(source, /viewer\.prev\(\)/)
  assert.match(source, /viewer\.next\(\)/)
})

test('the desktop chrome answers a moving mouse but not a drag', () => {
  const source = read('GalleryViewer.client.vue')
  assert.match(source, /addEventListener\('pointermove', onPointerMove/)
  assert.match(source, /removeEventListener\('pointermove', onPointerMove\)/)
  // A held button is a drag; touch and pen belong to the tap path.
  assert.match(source, /if \(event\.buttons\) return/)
  assert.match(source, /event\.pointerType !== 'mouse'/)
  assert.match(source, /viewer\.zoomed\.value \|\| viewer\.sheetOpen\.value/)
})

/* ------------------------------------------------------------------ *
 * Doctrine — what the viewer must never grow back
 * ------------------------------------------------------------------ */
console.log('\nDoctrine')

test('close is state-driven: no router.back or history.back as a close path', () => {
  for (const file of ['useGalleryViewer.js', 'GalleryViewer.client.vue', 'GalleryViewerChrome.vue']) {
    const source = read(file)
    assert.ok(!/router\.back\(/.test(source), `${file} calls router.back()`)
    assert.ok(!/router\.go\(-1\)/.test(source), `${file} calls router.go(-1)`)
    // history.back() may only be reached through the history module's release.
    assert.ok(!/history\.back\(/.test(source), `${file} calls history.back() directly`)
  }
})

test('only the history module may touch the history stack', () => {
  const source = read('galleryViewerHistory.js')
  assert.ok(source.includes('history.back()'))
  assert.ok(source.includes('ownsTopEntry'))
  // The pop is guarded by ownership, not attempted blindly.
  assert.match(source, /if \(!ownsTopEntry\(\)\)/)
})

test('the viewer chrome holds only the permitted controls', () => {
  const source = read('GalleryViewerChrome.vue')
  for (const banned of ['filmstrip', 'thumb-rail', 'thumbnail-rail', 'side-rail', 'toolbar']) {
    assert.ok(!new RegExp(banned, 'i').test(source), `chrome grew a ${banned}`)
  }
})

test('the overview does not wrap every photograph in a card', () => {
  const source = read('GallerySequence.vue')
  assert.ok(!/border-radius:\s*(?![0]\b)/.test(source.replace(/border-radius:\s*0/g, '')), 'a print gained rounded corners')
  assert.ok(!/box-shadow/.test(source), 'a print gained a shadow')
})

test('reduced motion is honored in the viewer and the wall', () => {
  for (const file of ['GalleryViewer.client.vue', 'GalleryOverview.vue']) {
    assert.match(read(file), /prefers-reduced-motion|reducedMotion|prefersReducedMotion/, `${file} ignores reduced motion`)
  }
})

test('the viewer declares dialog semantics', () => {
  const source = read('GalleryViewer.client.vue')
  assert.match(source, /role['"\s,]+dialog/)
  assert.match(source, /aria-modal/)
  assert.match(source, /aria-live/)
})

test('the overview goes inert behind an open photograph', () => {
  assert.match(read('GalleryOverview.vue'), /:inert="viewer\.open/)
})

test('the engine adapter is the only route to PhotoSwipe', () => {
  for (const file of ['GalleryViewer.client.vue', 'useGalleryViewer.js']) {
    assert.ok(!/from 'photoswipe'|import\('photoswipe'\)/.test(read(file)), `${file} imports PhotoSwipe directly`)
  }
})

console.log(
  `\ntest-canonical-gallery: ${passed} ok${failed ? `, ${failed} failed` : ''}`,
)
if (failed) process.exit(1)
