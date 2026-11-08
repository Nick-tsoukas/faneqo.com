/**
 * Isolated gallery-experience lab contracts.
 * Run: node scripts/test-gallery-experience-lab.mjs
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { basementEastNight } from '../features/gallery-experience/fixtures/basementEastNight.js'
import { memoriesToMediaItems } from '../features/gallery-experience/core/experienceManifest.js'
import { interpolateStage, stageAtProgress, createDefaultTuning } from '../features/gallery-experience/core/presentationState.js'
import { mixHex } from '../features/gallery-experience/core/color.js'
import {
  classifyDeviceClass,
  classifyPhotoAspectClass,
  classifyPhotoOrientation,
  resolvePhotoComposition,
} from '../features/gallery-experience/core/photoComposition.js'
import {
  COMPOSITION_SLOTS,
  livingGalleryMemories,
} from '../features/gallery-experience/fixtures/compositionMatrix.js'
import {
  analyzeImageData,
  interpolateLightField,
  lightFieldFromStage,
} from '../features/gallery-experience/core/lightField.js'
import {
  AFTERLIGHT_DEFAULT_STRENGTH,
  AFTERLIGHT_MAX_OPACITY,
  AFTERLIGHT_STRENGTHS,
  resolveAfterlightStrength,
  resolveAfterlightStyle,
} from '../features/gallery-experience/living-gallery/livingGalleryAfterlight.js'
import {
  resolveEditorialStage,
} from '../features/gallery-experience/living-gallery/livingGalleryEditorialStage.js'
import {
  galleryProgressFromScroll,
  photoSwipeSrcset,
  toPhotoSwipeDataSource,
} from '../features/gallery-experience/living-gallery/LivingGalleryAdapter.js'
import {
  createLivingGalleryHistory,
  LIVING_GALLERY_HISTORY_KEY,
  LIVING_GALLERY_HISTORY_HASH,
} from '../features/gallery-experience/living-gallery/livingGalleryHistory.js'
import { createLivingGalleryController } from '../features/gallery-experience/living-gallery/livingGalleryController.js'
import { LIVING_GALLERY_EVENT } from '../features/gallery-experience/living-gallery/livingGalleryEvents.js'
import { deriveLivingGalleryCapabilities } from '../features/gallery-experience/living-gallery/livingGalleryCapabilities.js'
import { neighborIndices, thumbnailItems, moveThumbnailIndex, handleThumbnailKeydown, shouldShowContactSheet, thumbnailContinuity } from '../features/gallery-experience/living-gallery/livingGalleryThumbnails.js'
import { joinContextParts, livingGalleryInfoGroups, livingGalleryInfoRows, livingGalleryVisibleContext, normalizeLivingGalleryContext } from '../features/gallery-experience/living-gallery/livingGalleryContext.js'
import { normalizeDoorwayContext, doorwayCountLabel } from '../features/gallery-experience/memory-system/galleryDoorway.js'
import { clampDeckIndex, commitDeckDrag, deckHasStack, deckLayers, deckLayerStyle, fitPhotoInStage } from '../features/gallery-experience/memory-system/memoryDeck.js'
import { resolvePhotosOpenLowerCompose } from '../features/gallery-experience/living-gallery/livingGalleryLowerCompose.js'
import { livingGalleryMemorySet, livingGalleryPresentationNight } from '../features/gallery-experience/fixtures/galleryContexts.js'
import { livingGalleryIdentityLines } from '../features/gallery-experience/living-gallery/livingGalleryChrome.js'
import { normalizeOpenSource, boundsFromElement } from '../features/gallery-experience/living-gallery/livingGallerySource.js'
import { shareWithFallback, buildPhotoSharePayload, canUseNativeShare } from '../features/gallery-experience/living-gallery/livingGalleryShare.js'
import { handleLivingGalleryKeydown, LIVING_GALLERY_KEYBOARD } from '../features/gallery-experience/living-gallery/livingGalleryKeyboard.js'
import { createStageRenderer } from '../features/gallery-experience/stage/stageRenderer.js'
import { createMemoryResidueRenderer } from '../features/gallery-experience/memory-residue/createMemoryResidueRenderer.js'
import { MEMORY_RESIDUE_PRESETS, residuePresetParams, RESIDUE_RETINAL, RESIDUE_SIGNATURE } from '../features/gallery-experience/memory-residue/memoryResiduePresets.js'
import { resolveResidueBudget, scaleResidueParams } from '../features/gallery-experience/memory-residue/memoryResidueBudget.js'
import { formatLivingGalleryIndex, livingGalleryInfoFields } from '../features/gallery-experience/living-gallery/livingGalleryChrome.js'
import { createLabComparisonState } from '../features/gallery-experience/lab/labComparisonState.js'
import { resolveGalleryTransition, GALLERY_TRANSITIONS } from '../features/gallery-experience/living-gallery/livingGalleryTransition.js'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')

assert.equal(basementEastNight.memories.length, 7)
assert.equal(basementEastNight.night.artist, 'BADFLOWER')
assert.equal(basementEastNight.night.venue, 'THE BASEMENT EAST')
assert.equal(basementEastNight.memories[0].role, 'recollection')
assert.equal(basementEastNight.memories[6].role, 'hero')
assert.equal(basementEastNight.memories[6].gravity, 1)
assert.equal(basementEastNight.memories[6].id, 'memory-g')

for (const memory of basementEastNight.memories) {
  const file = path.join(root, 'public', memory.src.replace(/^\//, ''))
  assert.equal(fs.existsSync(file), true, `missing ${memory.src}`)
  assert.ok(fs.statSync(file).size > 50_000, `${memory.src} too small`)
  assert.ok(memory.stage.deep && memory.stage.left && memory.stage.right && memory.stage.top && memory.stage.highlight)
}

const media = memoriesToMediaItems(basementEastNight.memories)
assert.equal(media[0].mediaId, 'memory-a')
assert.equal(media[0].url, basementEastNight.memories[0].src)

const slides = toPhotoSwipeDataSource(basementEastNight.memories)
assert.equal(slides.length, 7)
assert.equal(slides[0].width, 1024)
assert.equal(slides[0].height, 575)
assert.equal(slides[6].width, 938)
assert.equal(slides[6].height, 1024)
assert.ok(slides.every((row) => row.src && row.width && row.height))
assert.equal(slides[0].srcset, undefined)
assert.equal(photoSwipeSrcset(basementEastNight.memories[0]), undefined)
assert.deepEqual(basementEastNight.memories[0].srcsetCandidates, [])
assert.equal(media[0].srcsetCandidates.length, 0)
assert.equal(media[0].mediumUrl, media[0].url)
assert.equal(
  photoSwipeSrcset({ srcsetCandidates: [{ src: 'a.jpg', width: 1024 }] }),
  undefined,
  'single-candidate srcset must not be emitted',
)
assert.match(
  photoSwipeSrcset({
    srcsetCandidates: [
      { src: 'a.jpg', width: 800 },
      { src: 'b.jpg', width: 1600 },
    ],
  }),
  /1600w/,
)
assert.equal(createDefaultTuning().stageMode, 'black')

const mid = galleryProgressFromScroll({
  x: -200,
  currSlideX: 0,
  slideWidth: 400,
  currIndex: 0,
  count: 3,
})
assert.equal(mid.from, 0)
assert.equal(mid.to, 1)
assert.ok(Math.abs(mid.t - 0.5) < 0.001)
assert.equal(mid.shifted, true)

const rest = galleryProgressFromScroll({
  x: 0,
  currSlideX: 0,
  slideWidth: 400,
  currIndex: 1,
  count: 3,
})
assert.equal(rest.from, rest.to)
assert.equal(rest.t, 0)

const mixed = mixHex('#000000', '#ffffff', 0.5)
assert.match(mixed, /^#[0-9a-f]{6}$/i)
assert.notEqual(mixed, '#000000')
assert.notEqual(mixed, '#ffffff')

const stage = interpolateStage(
  basementEastNight.memories[0].stage,
  basementEastNight.memories[1].stage,
  0.5,
  0,
)
assert.match(stage.highlight, /^#/i)
const snapped = stageAtProgress(basementEastNight.memories, { index: 6, from: 6, to: 6, t: 0 }, { reduced: true })
assert.equal(snapped.highlight, basementEastNight.memories[6].stage.highlight)

const adapterSrc = fs.readFileSync(path.join(root, 'features/gallery-experience/living-gallery/LivingGalleryAdapter.js'), 'utf8')
assert.match(adapterSrc, /createLivingGalleryAdapter/)
assert.match(adapterSrc, /moveMainScroll/)
assert.match(adapterSrc, /mainScroll/)
assert.match(adapterSrc, /close: false/)
assert.match(adapterSrc, /getThumbBoundsFn/)
assert.doesNotMatch(adapterSrc, /from 'vue'|from "vue"/)

const mixedTop = interpolateStage(
  basementEastNight.memories[0].stage,
  basementEastNight.memories[2].stage,
  0.5,
  0,
)
assert.match(mixedTop.top, /^#/i)
assert.notEqual(mixedTop.top, basementEastNight.memories[0].stage.top)

const stack = fs.readFileSync(path.join(root, 'components/media/FaneqoGalleryStack.vue'), 'utf8')
const lightbox = fs.readFileSync(path.join(root, 'components/media/FaneqoMediaLightbox.vue'), 'utf8')
assert.doesNotMatch(stack, /gallery-experience|photoswipe/i)
assert.doesNotMatch(lightbox, /gallery-experience|photoswipe/i)

const labPage = fs.readFileSync(path.join(root, 'pages/labs/gallery-experience.vue'), 'utf8')
assert.match(labPage, /middleware: \['auth', 'labs'\]/)
assert.match(labPage, /GalleryExperienceLab/)
assert.doesNotMatch(labPage, /FaneqoMediaLightbox/)

const lab = fs.readFileSync(path.join(root, 'features/gallery-experience/lab/GalleryExperienceLab.vue'), 'utf8')
const doorwaySrc = fs.readFileSync(path.join(root, 'features/gallery-experience/memory-system/GalleryDoorway.vue'), 'utf8')
assert.match(doorwaySrc, /data-gx-print/)
assert.match(doorwaySrc, /Share Gallery/)
assert.match(fs.readFileSync(path.join(root, 'features/gallery-experience/memory-system/MemoryDeck.vue'), 'utf8'), /data-gx-deck-front/)
assert.match(lab, /GalleryDoorway/)
assert.match(lab, /openFromDeck/)
assert.doesNotMatch(lab, /Open Living Gallery/)
assert.match(lab, /Enter the Night/)
assert.match(lab, /setTransition\('print'\)/)
assert.match(lab, /setTransition\('hold'\)/)
assert.match(lab, /setTransition\('afterimage'\)/)
assert.doesNotMatch(lab, /v-show="!livingOpen"/)
assert.equal(GALLERY_TRANSITIONS.length, 3)
assert.equal(resolveGalleryTransition('print').showHide, 'zoom')
assert.equal(resolveGalleryTransition('hold').showHide, 'fade')
assert.equal(resolveGalleryTransition('afterimage').residue, true)
assert.equal(resolveGalleryTransition('afterimage').residuePreset, 'MR-B')
assert.match(fs.readFileSync(path.join(root, 'features/gallery-experience/memory-system/galleryDoorway.css'), 'utf8'), /object-fit: contain/)

const night = fs.readFileSync(path.join(root, 'features/gallery-experience/enter-night/EnterTheNight.client.vue'), 'utf8')
assert.match(night, /basementEastNight|memories/)
assert.match(night, /The Night remains/)

const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))
assert.ok(pkg.dependencies.photoswipe)
assert.ok(pkg.dependencies.three)

assert.equal(classifyPhotoAspectClass(1000, 1500), 'portrait-2-3')
assert.equal(classifyPhotoAspectClass(750, 1000), 'portrait-3-4')
assert.equal(classifyPhotoAspectClass(800, 1000), 'portrait-4-5')
assert.equal(classifyPhotoAspectClass(910, 1024), 'near-square')
assert.equal(classifyPhotoAspectClass(1023, 1024), 'square')
assert.equal(classifyPhotoAspectClass(1024, 682), 'landscape')
assert.equal(classifyPhotoAspectClass(1024, 575), 'wide')

const landscape = resolvePhotoComposition({
  viewportWidth: 390,
  viewportHeight: 844,
  imageWidth: 1024,
  imageHeight: 682,
})
assert.equal(landscape.orientation, 'landscape')
assert.equal(landscape.aspectClass, 'landscape')
assert.equal(landscape.device, 'phone')
assert.equal(landscape.rule, 'phone-landscape-width-field')
assert.equal(landscape.verticalAlign, 'shelf')
assert.ok(landscape.padding.left + landscape.padding.right < 24, 'landscape should approach viewport width')
assert.ok(landscape.imageRect.w > 360, `landscape image too narrow: ${landscape.imageRect.w}`)
/*
 * The Gallery Shelf: darkness a phone cannot give to the print pools into one
 * interval above it, and the print rests on the shelf that carries its caption.
 * Splitting the leftover above and below stranded the caption from the
 * photograph it names.
 */
assert.ok(landscape.topBreath > 240, `landscape matte should be one deliberate interval: ${landscape.topBreath}`)
assert.equal(landscape.bottomBreath, landscape.shelfHeight + landscape.shelf.gap)
assert.ok(landscape.railResident, 'a tall phone keeps the contact sheet on the shelf')

const wide = resolvePhotoComposition({
  viewportWidth: 390,
  viewportHeight: 844,
  imageWidth: 1024,
  imageHeight: 575,
})
assert.equal(wide.aspectClass, 'wide')
assert.equal(wide.rule, 'phone-wide-width-field')
assert.ok(wide.imageRect.w > 370, `wide should use nearly all width: ${wide.imageRect.w}`)
assert.equal(landscape.stageFamily, 'width-field')

const portrait = resolvePhotoComposition({
  viewportWidth: 390,
  viewportHeight: 844,
  imageWidth: 1000,
  imageHeight: 1500,
  safeTop: 47,
  safeBottom: 34,
})
assert.equal(portrait.orientation, 'portrait')
assert.equal(portrait.aspectClass, 'portrait-2-3')
assert.equal(portrait.rule, 'phone-portrait-monumental')
assert.ok(portrait.imageRect.h > 520, `true 2:3 should use height aggressively: ${portrait.imageRect.h}`)
assert.ok(portrait.imageRect.w > 360, `2:3 should still fill useful width: ${portrait.imageRect.w}`)
assert.ok(portrait.padding.top >= 47)
assert.equal(portrait.verticalAlign, 'shelf')
/*
 * The shelf shares the system insets instead of stacking its own reserve on
 * top of them, so a notched phone does not pay twice for the status bar and
 * the home indicator.
 */
const portraitNoInsets = resolvePhotoComposition({
  viewportWidth: 390,
  viewportHeight: 844,
  imageWidth: 1000,
  imageHeight: 1500,
})
assert.ok(
  portraitNoInsets.imageRect.h - portrait.imageRect.h < 24,
  `insets must not cost the print its height: ${portraitNoInsets.imageRect.h} vs ${portrait.imageRect.h}`,
)

const portraitChromeOff = resolvePhotoComposition({
  viewportWidth: 390,
  viewportHeight: 844,
  imageWidth: 1000,
  imageHeight: 1500,
  chromeOn: false,
})
const portraitChromeOn = resolvePhotoComposition({
  viewportWidth: 390,
  viewportHeight: 844,
  imageWidth: 1000,
  imageHeight: 1500,
  chromeOn: true,
})
assert.deepEqual(portraitChromeOff.imageRect, portraitChromeOn.imageRect)

const portrait430 = resolvePhotoComposition({
  viewportWidth: 430,
  viewportHeight: 932,
  imageWidth: 1000,
  imageHeight: 1500,
})
assert.equal(portrait430.orientation, 'portrait')
assert.equal(portrait430.device, 'phone')
assert.ok(portrait430.imageRect.w > 410, `430 portrait should use width aggressively: ${portrait430.imageRect.w}`)
assert.ok(portrait430.imageRect.h > 580, `430 2:3 should be tall: ${portrait430.imageRect.h}`)

const nearSquare = resolvePhotoComposition({
  viewportWidth: 390,
  viewportHeight: 844,
  imageWidth: 910,
  imageHeight: 1024,
})
assert.equal(nearSquare.aspectClass, 'near-square')
assert.equal(nearSquare.rule, 'phone-near-square-print')
assert.ok(nearSquare.imageRect.h < portraitChromeOff.imageRect.h - 80, 'near-square must not pretend to be a tall portrait')

const square = resolvePhotoComposition({
  viewportWidth: 390,
  viewportHeight: 844,
  imageWidth: 1023,
  imageHeight: 1024,
})
assert.equal(square.orientation, 'square')
assert.equal(square.aspectClass, 'square')
assert.equal(square.rule, 'phone-square-print')
assert.ok(square.sideSurround <= 4, 'square owns the width; do not invent a timid matte')
assert.ok(square.imageRect.w >= 386, `square presence width ${square.imageRect.w}`)
assert.ok(square.imageRect.h >= 380, `square should feel substantial: ${square.imageRect.h}`)
assert.ok(nearSquare.imageRect.h > square.imageRect.h, 'near-square remains taller than true square')
assert.equal(portrait.stageFamily, 'monumental')
assert.equal(square.stageFamily, 'print-balance')

/*
 * Optical placement is measured on a width-bound frame. A 2:3 print on a phone
 * is now exactly height-bound by the shelf, so there is no slack left to
 * distribute and nothing for the control to move.
 */
const center = resolvePhotoComposition({
  viewportWidth: 390,
  viewportHeight: 844,
  imageWidth: 1024,
  imageHeight: 682,
  opticalMode: 'center',
})
const higher = resolvePhotoComposition({
  viewportWidth: 390,
  viewportHeight: 844,
  imageWidth: 1024,
  imageHeight: 682,
  opticalMode: 'higher',
})
assert.ok(higher.imageRect.y < center.imageRect.y - 8, 'higher optical placement must lift the photograph')

for (const viewport of [[375, 812], [393, 852]]) {
  const check = resolvePhotoComposition({
    viewportWidth: viewport[0],
    viewportHeight: viewport[1],
    imageWidth: 1000,
    imageHeight: 1500,
  })
  assert.equal(check.device, 'phone')
  assert.ok(check.imageRect.w > viewport[0] - 16)
  assert.ok(check.imageRect.h > 500)
}

assert.equal(classifyPhotoOrientation(1024, 575), 'landscape')
assert.equal(classifyDeviceClass(390, 844), 'phone')
assert.equal(classifyDeviceClass(430, 932), 'phone')
assert.equal(classifyDeviceClass(844, 390), 'phone')
assert.equal(classifyDeviceClass(932, 430), 'phone')
assert.equal(classifyDeviceClass(768, 1024), 'tablet')
assert.equal(classifyDeviceClass(1440, 900), 'desktop')
assert.equal(classifyDeviceClass(1920, 1080), 'ultrawide')

const desktopLand = resolvePhotoComposition({
  viewportWidth: 1920,
  viewportHeight: 1080,
  imageWidth: 1024,
  imageHeight: 575,
})
assert.equal(desktopLand.device, 'ultrawide')
assert.ok(desktopLand.imageRect.w > 1024, `desktop composition may outsize fixtures for presence: ${desktopLand.imageRect.w}`)
assert.ok(desktopLand.imageRect.w <= 1024 * 1.75 + 1, `ultrawide upscale stays bounded: ${desktopLand.imageRect.w}`)
assert.ok(desktopLand.padding.left > 30)
assert.ok(desktopLand.padding.right > 30)

const desktopPort = resolvePhotoComposition({
  viewportWidth: 1440,
  viewportHeight: 900,
  imageWidth: 910,
  imageHeight: 1024,
})
/*
 * A column is earned by the photograph, not requested by the gallery. A
 * gallery-wide flag could not describe a mixed gallery: PhotoSwipe resolves
 * padding per item, so the flag put the editorial type on top of the print
 * whenever the open frame was a landscape one. A height-bound print with
 * readable leftover width gets a column; the print and the column are then
 * composed as one centred group.
 */
assert.equal(desktopPort.orientation, 'portrait')
assert.equal(desktopPort.horizontalAlign, 'editorial')
assert.ok(desktopPort.contextColumn >= 264, `portrait earns a real column: ${desktopPort.contextColumn}`)
const groupRight = desktopPort.columnRect.x + desktopPort.columnRect.w
assert.ok(
  Math.abs((1440 - groupRight) - desktopPort.imageRect.x) < 4,
  `print plus column is centred as one group: ${desktopPort.imageRect.x} vs ${1440 - groupRight}`,
)

const desktopPortNoContext = resolvePhotoComposition({
  viewportWidth: 1440,
  viewportHeight: 900,
  imageWidth: 910,
  imageHeight: 1024,
  editorialBias: false,
})
assert.equal(desktopPortNoContext.contextColumn, 0, 'context off means no column')
assert.equal(desktopPortNoContext.horizontalAlign, 'center')

const desktopLandNoColumn = resolvePhotoComposition({
  viewportWidth: 1440,
  viewportHeight: 900,
  imageWidth: 1024,
  imageHeight: 575,
})
assert.equal(desktopLandNoColumn.contextColumn, 0, 'a wide frame keeps the stage, not a magazine spread')

const midDesktop = resolvePhotoComposition({
  viewportWidth: 1440,
  viewportHeight: 900,
  imageWidth: 1024,
  imageHeight: 575,
})
assert.ok(midDesktop.imageRect.w > 1000)
assert.ok(midDesktop.imageRect.w <= 1024 * 1.55 + 1)

const tabletLand = resolvePhotoComposition({
  viewportWidth: 768,
  viewportHeight: 1024,
  imageWidth: 1024,
  imageHeight: 575,
})
assert.equal(tabletLand.device, 'tablet')
assert.ok(tabletLand.imageRect.w > 680)
assert.ok(tabletLand.padding.left >= 12)

const ultraPort = resolvePhotoComposition({
  viewportWidth: 1920,
  viewportHeight: 1080,
  imageWidth: 910,
  imageHeight: 1024,
})
assert.equal(ultraPort.horizontalAlign, 'editorial')
assert.ok(ultraPort.contextColumn >= 264, `ultrawide portrait earns a column too: ${ultraPort.contextColumn}`)
const ultraGroupRight = ultraPort.columnRect.x + ultraPort.columnRect.w
assert.ok(
  Math.abs((1920 - ultraGroupRight) - ultraPort.imageRect.x) < 4,
  'ultrawide print plus column stays centred as one group',
)

const ultraLand = resolvePhotoComposition({
  viewportWidth: 1920,
  viewportHeight: 1080,
  imageWidth: 1024,
  imageHeight: 575,
})
assert.ok(ultraLand.opticalAy <= 0.42, `desktop landscape should sit slightly high for a lower shelf: ${ultraLand.opticalAy}`)
assert.ok(ultraLand.bottomBreath > ultraLand.topBreath, 'lower shelf should be larger than top breath on desktop landscape')

const purple = new Uint8ClampedArray(24 * 24 * 4)
for (let y = 0; y < 24; y += 1) {
  for (let x = 0; x < 24; x += 1) {
    const i = (y * 24 + x) * 4
    if (y < 8) {
      purple[i] = 180
      purple[i + 1] = 80
      purple[i + 2] = 220
    } else {
      purple[i] = 8
      purple[i + 1] = 4
      purple[i + 2] = 12
    }
    purple[i + 3] = 255
  }
}
const purpleField = analyzeImageData({ data: purple, width: 24, height: 24 })
assert.ok(purpleField.cells[1].L > purpleField.cells[7].L, 'top of arena should be brighter than the crowd')
assert.ok(purpleField.chroma > 0.04, 'purple calibration should retain chroma')

const grey = new Uint8ClampedArray(24 * 24 * 4)
for (let i = 0; i < grey.length; i += 4) {
  const v = (i / 4) % 24 < 10 ? 220 : 12
  grey[i] = v
  grey[i + 1] = v
  grey[i + 2] = v
  grey[i + 3] = 255
}
const bwField = analyzeImageData({ data: grey, width: 24, height: 24 })
assert.ok(bwField.chroma < 0.02, `B&W chroma leaked: ${bwField.chroma}`)
assert.equal(bwField.cells[1].hex.slice(1, 3), bwField.cells[1].hex.slice(3, 5))

const mixedBw = interpolateLightField(purpleField, bwField, 1, 0)
assert.ok(mixedBw.chroma < 0.03, 'arriving on B&W must not keep the previous purple')

const seeded = lightFieldFromStage(basementEastNight.memories[6].stage)
assert.ok(seeded.cells.length === 9)
assert.match(seeded.highlight.hex, /^#/i)

assert.ok(Number.isFinite(mid.shift))
assert.ok(adapterSrc.includes('paddingFn'))
assert.doesNotMatch(adapterSrc, /paddingFn: \(\) => \{\s*const s = Math.max\(0, surroundPx\)/)
assert.match(adapterSrc, /tapAction/)
assert.match(adapterSrc, /preload: \[1, 2\]/)
assert.match(adapterSrc, /secondaryZoomLevel/)
assert.match(adapterSrc, /photoSwipeSrcset/)
assert.doesNotMatch(adapterSrc, /name: 'fq-close'/)
assert.doesNotMatch(adapterSrc, /srcset: memory\.srcset \|\| undefined/)

const stageGpu = fs.readFileSync(path.join(root, 'features/gallery-experience/stage/createGpuStage.js'), 'utf8')
assert.match(stageGpu, /webgl2/)
assert.doesNotMatch(stageGpu, /from 'tres'|pixi|gsap/i)

const viewer = fs.readFileSync(path.join(root, 'features/gallery-experience/living-gallery/LivingGalleryViewer.client.vue'), 'utf8')
assert.match(viewer, /PhotographicStage/)
assert.match(viewer, /LivingGalleryChrome/)
assert.match(fs.readFileSync(path.join(root, 'features/gallery-experience/living-gallery/livingGallery.css'), 'utf8'), /\.fq-lg-chrome\b/)
assert.match(fs.readFileSync(path.join(root, 'features/gallery-experience/living-gallery/LivingGalleryChrome.vue'), 'utf8'), /LivingGalleryControl/)
assert.match(fs.readFileSync(path.join(root, 'features/gallery-experience/living-gallery/LivingGalleryControl.vue'), 'utf8'), /fq-lg-ctrl/)
assert.match(viewer, /MemoryResidueLayer/)
assert.match(viewer, /getImageElement/)
assert.doesNotMatch(viewer, /FaneqoMediaLightbox|FaneqoGalleryStack/)
assert.match(adapterSrc, /getImageElement/)

assert.match(lab, /is-review/)
assert.match(lab, /Review/)
assert.doesNotMatch(lab, /<MatteStage/)
assert.match(night, /The Night remains/)
assert.doesNotMatch(night, /three|PhotographicStage|createGpuStage/)

const historySrc = fs.readFileSync(path.join(root, 'features/gallery-experience/living-gallery/livingGalleryHistory.js'), 'utf8')
assert.match(historySrc, /fqLivingGallery/)
assert.match(historySrc, /skipNextExit/)
assert.match(historySrc, /#living-gallery/)
assert.doesNotMatch(historySrc, /\.\.\.state, \[LIVING_GALLERY_HISTORY_KEY\]/)

let closed = 0
const states = [{ path: '/lab' }]
const fakeWin = {
  listeners: {},
  location: { pathname: '/lab', search: '', hash: '' },
  addEventListener(type, fn) {
    this.listeners[type] = this.listeners[type] || []
    this.listeners[type].push(fn)
  },
  removeEventListener(type, fn) {
    this.listeners[type] = (this.listeners[type] || []).filter((row) => row !== fn)
  },
}
const fakeHistory = {
  get state() {
    return states[states.length - 1]
  },
  pushState(state, _title, url) {
    states.push({ ...state })
    if (typeof url === 'string' && url.includes('#')) {
      fakeWin.location.hash = url.slice(url.indexOf('#'))
    }
  },
  back() {
    states.pop()
    fakeWin.location.hash = ''
    for (const fn of fakeWin.listeners.popstate || []) fn()
  },
}
const hist = createLivingGalleryHistory({
  history: fakeHistory,
  win: fakeWin,
  onPopClose() {
    closed += 1
    hist.exit()
  },
})
hist.attach()
hist.enter()
assert.equal(hist.isPushed(), true)
assert.equal(fakeHistory.state[LIVING_GALLERY_HISTORY_KEY], true)
assert.equal(fakeWin.location.hash, LIVING_GALLERY_HISTORY_HASH)
assert.equal(Object.keys(fakeHistory.state).join(','), LIVING_GALLERY_HISTORY_KEY)
assert.equal(states.length, 2)
states.pop()
fakeWin.listeners.popstate.forEach((fn) => fn())
assert.equal(closed, 1)
assert.equal(hist.isPushed(), false)
assert.equal(states.length, 1, 'popstate close must not history.back() a second time')

hist.enter()
assert.equal(states.length, 2)
hist.exit()
assert.equal(states.length, 1)
assert.equal(hist.isPushed(), false)
assert.equal(fakeWin.location.hash, '')

const publicNight = fs.readFileSync(path.join(root, 'components/nights/NightGalleryViewer.vue'), 'utf8')
assert.doesNotMatch(publicNight, /gallery-experience|photoswipe|three/i)
const publicGallery = fs.readFileSync(path.join(root, 'components/nights/PublicGalleryExperience.vue'), 'utf8')
assert.match(publicGallery, /gallery-experience/)
/*
 * The Gallery Page has been migrated to the canonical gallery. The Living
 * Gallery engine below is still exercised by this lab and by its own route,
 * but it is no longer a production gallery entry point.
 */
assert.match(publicGallery, /canonical\/GalleryOverview/)
assert.doesNotMatch(publicGallery, /LivingGalleryViewer/)
assert.doesNotMatch(publicGallery, /FaneqoMediaLightbox/)

assert.equal(LIVING_GALLERY_KEYBOARD.fullscreen, null)
assert.equal(LIVING_GALLERY_KEYBOARD.close, 'Escape')

const caps = deriveLivingGalleryCapabilities(
  { open: true, activeIndex: 0, total: 7, zoom: { isZoomed: false, canZoom: true, max: 4, initial: 1 } },
  { canFullscreen: true, canUseNativeShare: false, isTouch: true, reducedMotion: false, isStandalone: false },
)
assert.equal(caps.canPrevious, false)
assert.equal(caps.canNext, true)
assert.equal(caps.canShowThumbnails, true)
assert.equal(caps.canShare, true)
assert.equal(caps.canFullscreen, true)
assert.equal(caps.isTouch, true)

const standaloneCaps = deriveLivingGalleryCapabilities(
  { open: true, activeIndex: 3, total: 7, zoom: { isZoomed: true, canZoom: true } },
  { canFullscreen: true, isStandalone: true },
)
assert.equal(standaloneCaps.canFullscreen, false)
assert.equal(standaloneCaps.canPrevious, true)
assert.equal(standaloneCaps.canPan, true)

assert.deepEqual(neighborIndices(0, 7, 1, 2), [0, 1, 2])
assert.deepEqual(neighborIndices(5, 7, 1, 2), [4, 5, 6])
assert.equal(moveThumbnailIndex(0, 7, -1), 0)
assert.equal(moveThumbnailIndex(6, 7, 1), 6)
const thumbs = thumbnailItems(basementEastNight.memories, 2)
assert.equal(thumbs.length, 7)
assert.equal(thumbs[2].selected, true)
assert.equal(thumbs[2].src, basementEastNight.memories[2].src)

const source = normalizeOpenSource({
  sourceMediaId: 'memory-b',
  sourceGalleryId: 'lab:basement-east',
  sourceIndex: 1,
  sourceBounds: { x: 10, y: 20, w: 80, h: 90 },
})
assert.equal(source.sourceMediaId, 'memory-b')
assert.equal(source.sourceBounds.w, 80)
assert.equal(boundsFromElement(null), undefined)

let selected = null
handleThumbnailKeydown({ key: 'ArrowRight', preventDefault() {} }, {
  activeIndex: 1,
  total: 7,
  onSelect(i) { selected = i },
})
assert.equal(selected, 2)

const keys = []
handleLivingGalleryKeydown({ key: 'ArrowRight', preventDefault() { keys.push('r') } }, 'photo', {
  next() { keys.push('next') },
})
assert.deepEqual(keys, ['r', 'next'])

const shared = await shareWithFallback(
  buildPhotoSharePayload({ night: basementEastNight.night, memory: basementEastNight.memories[0], url: 'https://example.test/lab' }),
  {
    nav: { share: async () => {} },
    clipboard: { writeText: async () => {} },
  },
)
assert.equal(shared.ok, true)
assert.equal(shared.method, 'native')
assert.equal(canUseNativeShare({ share() {} }), true)

let copied = ''
const clipOnly = await shareWithFallback(
  { url: 'https://example.test/lab' },
  { nav: {}, clipboard: { writeText: async (text) => { copied = text } } },
)
assert.equal(clipOnly.ok, true)
assert.equal(clipOnly.method, 'clipboard')
assert.equal(copied, 'https://example.test/lab')

const engineEvents = []
const fakeAdapter = {
  index: 0,
  z: 1,
  async open(_list, index) { this.index = index },
  close() {},
  goTo(index) { this.index = index },
  prev() { this.index -= 1 },
  next() { this.index += 1 },
  getIndex() { return this.index },
  getZoomState() {
    return {
      level: this.z,
      min: 1,
      max: 4,
      initial: 1,
      isZoomed: this.z > 1.04,
      canZoom: true,
      canPan: this.z > 1.04,
    }
  },
  zoomIn() { this.z = 2 },
  zoomOut() { this.z = 1 },
  resetZoom() { this.z = 1 },
  getResourceSnapshot() { return { decoded: 3, cached: 3, total: 7 } },
}
const fakeHist = { entered: 0, exited: 0, enter() { this.entered += 1 }, exit() { this.exited += 1 } }
const engine = createLivingGalleryController({
  adapter: fakeAdapter,
  history: fakeHist,
  fullscreen: {
    canFullscreen: () => false,
    isFullscreen: () => false,
    enter: async () => false,
    exit: async () => false,
    toggle: async () => false,
    attach() {},
    detach() {},
  },
  env: { isTouch: false, reducedMotion: false, isStandalone: false },
  onEvent(name) { engineEvents.push(name) },
})
await engine.open(basementEastNight.memories, 1, { night: basementEastNight.night })
assert.equal(engine.getState().open, true)
assert.equal(engine.getState().activeIndex, 1)
assert.equal(engine.getState().total, 7)
assert.equal(engine.getState().liveStatus, 'Photograph 2 of 7')
assert.equal(engine.getState().capabilities.canPrevious, true)
assert.equal(fakeHist.entered, 1)
assert.equal(engine.getState().chromeOn, true, 'open briefly reveals chrome')
engine.next()
engine.handleIndexChanged(fakeAdapter.index)
assert.equal(engine.getState().activeIndex, 2)
engine.toggleChrome()
assert.equal(engine.getState().chromeOn, false, 'tap hides chrome after reveal')
engine.toggleChrome()
assert.equal(engine.getState().chromeOn, true)
engine.toggleInfo()
assert.equal(engine.getState().infoOn, true)
engine.toggleThumbnails()
assert.equal(engine.getState().thumbnailsOn, true)
engine.selectThumbnail(6)
engine.handleIndexChanged(6)
assert.equal(engine.getState().activeIndex, 6)
assert.equal(engine.getState().capabilities.canNext, false)
engine.zoomIn()
assert.equal(engine.getState().zoom.isZoomed, true)
engine.close()
assert.equal(engine.getState().open, false)
assert.equal(fakeHist.exited, 1)
assert.ok(engineEvents.includes(LIVING_GALLERY_EVENT.OPEN))
assert.ok(engineEvents.includes(LIVING_GALLERY_EVENT.CLOSE))
assert.ok(engineEvents.includes(LIVING_GALLERY_EVENT.THUMBNAIL_OPEN))
engine.destroy()

const stageContract = createStageRenderer()
assert.equal(typeof stageContract.init, 'function')
assert.equal(typeof stageContract.resize, 'function')
assert.equal(typeof stageContract.setMedia, 'function')
assert.equal(typeof stageContract.setProgress, 'function')
assert.equal(typeof stageContract.suspend, 'function')
assert.equal(typeof stageContract.resume, 'function')
assert.equal(typeof stageContract.destroy, 'function')

assert.match(viewer, /createLivingGalleryController/)
assert.match(viewer, /fq-lg-live/)
assert.match(viewer, /LivingGalleryDock/)
assert.match(viewer, /resolveAfterlightStyle/)
assert.match(lab, /Engine harness/)
assert.match(lab, /LabComparisonPanel/)
assert.match(lab, /:lab="compare"/)
assert.doesNotMatch(lab, /fq-gx__engine-dock/)
assert.match(adapterSrc, /getZoomState/)
assert.match(adapterSrc, /getResourceSnapshot/)

const enterNight = fs.readFileSync(path.join(root, 'features/gallery-experience/enter-night/EnterTheNight.client.vue'), 'utf8')
assert.doesNotMatch(enterNight, /createLivingGalleryController/)
assert.doesNotMatch(enterNight, /createMemoryResidueRenderer/)

assert.equal(formatLivingGalleryIndex(3, 27), '04 / 27')
const info = livingGalleryInfoFields(basementEastNight.night, basementEastNight.memories[1])
assert.equal(info.artist, 'BADFLOWER')
assert.equal(info.venue, 'THE BASEMENT EAST')
assert.equal(info.city, 'NASHVILLE')
assert.equal(info.photographer, '', 'do not invent photographer')

assert.ok(MEMORY_RESIDUE_PRESETS[RESIDUE_RETINAL])
assert.equal(RESIDUE_SIGNATURE, 'MR-B')
assert.equal(MEMORY_RESIDUE_PRESETS['MR-B'].role, 'signature')
assert.ok(residuePresetParams('MR-B').durationMs > 1000)
assert.equal(residuePresetParams('off'), null)
assert.equal(resolveResidueBudget({ reduced: true }).play, false)
assert.equal(resolveResidueBudget({ velocity: 4.2 }).play, false)
assert.equal(resolveResidueBudget({ intervalMs: 80 }).reason, 'fast-nav')
assert.equal(resolveResidueBudget({ velocity: 0.2, intervalMs: 900 }).reason, 'deliberate')
assert.equal(resolveResidueBudget({ velocity: 1.1, intervalMs: 400 }).reason, 'normal-swipe')
assert.ok(scaleResidueParams({ durationMs: 1000 }, 0.42).durationMs < 500)

const livingSet = livingGalleryMemories(basementEastNight)
assert.equal(basementEastNight.memories.length, 7)
assert.ok(livingSet.some((memory) => memory.id === 'matrix-23'))
assert.ok(COMPOSITION_SLOTS.every((slot) => livingSet.some((memory) => memory.id === slot.memoryId)))
assert.equal(COMPOSITION_SLOTS.find((slot) => slot.id === 'portrait-3-4').exact, false)
assert.equal(COMPOSITION_SLOTS.find((slot) => slot.id === 'portrait-4-5').exact, false)
const heroFile = path.join(root, 'public', 'images/homepage/artists/badflower-hero.webp')
assert.equal(fs.existsSync(heroFile), true, '2:3 hero missing')

const chromeSrc = fs.readFileSync(path.join(root, 'features/gallery-experience/living-gallery/LivingGalleryChrome.vue'), 'utf8')
const dockSrc = fs.readFileSync(path.join(root, 'features/gallery-experience/living-gallery/LivingGalleryDock.vue'), 'utf8')
const cssSrc = fs.readFileSync(path.join(root, 'features/gallery-experience/living-gallery/livingGallery.css'), 'utf8')
const afterlightSrc = fs.readFileSync(path.join(root, 'features/gallery-experience/living-gallery/livingGalleryAfterlight.js'), 'utf8')
assert.match(chromeSrc, /Close photograph/)
/*
 * The sequence position belongs to the caption plate and to the editorial
 * column, beside the words it qualifies. Floating alone in the top-right it
 * was a heads-up display readout on a photograph.
 */
assert.doesNotMatch(chromeSrc, /fq-lg-index-slot/)
assert.match(dockSrc, /fq-lg-plate__index/)
assert.doesNotMatch(chromeSrc, /text="More"/)
assert.doesNotMatch(chromeSrc, /name="more"/)
assert.match(dockSrc, /Photos/)
assert.match(dockSrc, /Info/)
assert.match(dockSrc, /Share/)
assert.match(dockSrc, /label="Photos"/)
assert.match(dockSrc, /label="Info"/)
assert.match(dockSrc, /:label="shareWord"/)
assert.match(dockSrc, /Memory Rail/)
assert.match(dockSrc, /fq-lg-dock__bar/)
assert.match(dockSrc, /fq-lg-dock__rail/)
assert.match(dockSrc, /fq-lg-dock__info/)
assert.match(dockSrc, /pointerdown\.capture/)
/*
 * Gallery actions are words, not icons with a 9px caption underneath. The
 * icon-plus-micro-label toolbar is the signature of a system photo viewer, and
 * two of the three glyphs had to be explained by type too small to read.
 */
assert.match(dockSrc, /LivingGalleryWord/)
assert.match(cssSrc, /fq-lg-word__label/)
assert.doesNotMatch(cssSrc, /fq-lg-ctrl--dock/)
assert.doesNotMatch(cssSrc, /fq-lg-ctrl__caption/)
assert.match(cssSrc, /fq-lg-ctrl__glyph/)
assert.doesNotMatch(dockSrc, /text="Photos"/)
assert.doesNotMatch(cssSrc, /emoji/)

const iconsSrc = fs.readFileSync(path.join(root, 'features/gallery-experience/living-gallery/livingGalleryIcons.js'), 'utf8')
assert.match(iconsSrc, /@lucide\/vue/)
assert.match(iconsSrc, /LIVING_GALLERY_ICON_FAMILY = 'lucide'/)
assert.match(iconsSrc, /LIVING_GALLERY_ICON_SIZE = 18/)
assert.match(iconsSrc, /LIVING_GALLERY_ICON_STROKE = 1\.75/)
assert.doesNotMatch(iconsSrc, /@heroicons/)
assert.doesNotMatch(iconsSrc, /@iconify/)

const chromeJs = fs.readFileSync(path.join(root, 'features/gallery-experience/living-gallery/livingGalleryChrome.js'), 'utf8')
assert.match(chromeJs, /CHROME_IDLE_MS = 2400/)
assert.match(viewer, /zoom\?\.isZoomed/)
assert.match(adapterSrc, /mediumSrc/)

assert.match(viewer, /onClosingEnd/)
assert.match(viewer, /onTogglePhotos/)
assert.match(viewer, /resolveAfterlightStyle/)
assert.match(viewer, /resolveResidueBudget/)
assert.match(cssSrc, /fq-lg-dock/)
assert.match(cssSrc, /fq-lg-afterlight/)
assert.match(cssSrc, /background: #000/)
assert.match(cssSrc, /data-gx-continuity/)
assert.match(afterlightSrc, /AFTERLIGHT_MAX_OPACITY/)
assert.match(afterlightSrc, /resolveAfterlightStyle/)
assert.doesNotMatch(chromeSrc, /Photograph actions/)

const panel = fs.readFileSync(path.join(root, 'features/gallery-experience/lab/LabComparisonPanel.vue'), 'utf8')
assert.match(panel, /Afterlight/)

const labState = createLabComparisonState()
assert.equal(labState.pureVariant, 'A')
assert.equal(labState.chromeVariant, 'hierarchical')
assert.equal(labState.contextOn, true)
assert.equal(labState.opticalMode, 'auto')
assert.equal(labState.residuePreset, 'off')
assert.equal(labState.residueOnNext, false)
assert.equal(labState.galleryKind, 'show')
assert.equal(labState.sheetVariant, 'rail')
assert.equal(labState.thumbGeometry, 'native')
assert.equal(labState.gallerySize, 'set')
assert.equal(labState.sheetAutoRecede, false)
assert.equal(labState.afterlight, true)
assert.equal(labState.afterlightStrength, 'B')

assert.equal(resolveAfterlightStrength('A').id, 'A')
assert.equal(resolveAfterlightStrength('B').maxOpacity, AFTERLIGHT_STRENGTHS.B.maxOpacity)
assert.ok(AFTERLIGHT_STRENGTHS.C.maxOpacity > AFTERLIGHT_STRENGTHS.B.maxOpacity)
assert.ok(AFTERLIGHT_STRENGTHS.B.edgeAlpha > AFTERLIGHT_STRENGTHS.A.edgeAlpha)
assert.equal(AFTERLIGHT_DEFAULT_STRENGTH, 'B')

/*
 * Context on a phone is the caption plate at the head of the shelf, not a
 * floating block under the print. It used to be placed against the photograph,
 * which left a band of unexplained black between the context and the controls.
 */
const landStage = resolveEditorialStage(landscape, { contextOn: true, chromeOn: true })
assert.equal(landStage.stageAlignment, 'width-field')
assert.equal(landStage.contextPlacement, 'caption-plate')
assert.equal(landStage.showPlate, true)
assert.equal(landStage.showStageIdentity, false)
assert.equal(landStage.railResident, true)
const portStage = resolveEditorialStage(portrait, { contextOn: true, chromeOn: true })
assert.equal(portStage.stageAlignment, 'monumental')
assert.equal(portStage.imageEmphasis, 'max')
const sqStage = resolveEditorialStage(square, { contextOn: true, chromeOn: true })
assert.equal(sqStage.stageAlignment, 'print-balance')
/* The column is the one absolute region, and only a desktop print earns it. */
const deskStage = resolveEditorialStage(desktopPort, { contextOn: true, chromeOn: true })
assert.equal(deskStage.contextPlacement, 'context-column')
assert.equal(deskStage.showStageIdentity, true)
assert.equal(deskStage.showPlate, false)

const alOn = resolveAfterlightStyle(
  lightFieldFromStage(basementEastNight.memories[0].stage),
  { x: 200, y: 100, w: 800, h: 450 },
  { width: 1440, height: 900 },
  { strength: 'A' },
)
assert.ok(Number(alOn['--fq-al-opacity']) > 0)
assert.ok(Number(alOn['--fq-al-opacity']) <= AFTERLIGHT_MAX_OPACITY)
const alB = resolveAfterlightStyle(
  lightFieldFromStage(basementEastNight.memories[0].stage),
  { x: 200, y: 100, w: 800, h: 450 },
  { width: 1440, height: 900 },
  { strength: 'B' },
)
assert.ok(Number(alB['--fq-al-opacity']) >= Number(alOn['--fq-al-opacity']))
const alOff = resolveAfterlightStyle(
  lightFieldFromStage(basementEastNight.memories[0].stage),
  { x: 200, y: 100, w: 800, h: 450 },
  { width: 1440, height: 900 },
  { enabled: false },
)
assert.equal(alOff['--fq-al-opacity'], '0')

assert.match(panel, /Sheet A/)
assert.match(panel, /Sheet B \(deferred\)/)
assert.match(panel, /Auto-recede/)
assert.match(panel, /General/)
assert.match(panel, /Minimal/)

const showNight = livingGalleryPresentationNight('show', basementEastNight.night)
const generalNight = livingGalleryPresentationNight('general', basementEastNight.night)
const minimalNight = livingGalleryPresentationNight('minimal', basementEastNight.night)
const showCtx = livingGalleryVisibleContext(normalizeLivingGalleryContext(showNight))
const generalCtx = livingGalleryVisibleContext(normalizeLivingGalleryContext(generalNight))
const minimalCtx = livingGalleryVisibleContext(normalizeLivingGalleryContext(minimalNight))
assert.equal(showCtx.artist, 'BADFLOWER')
assert.equal(showCtx.secondary, 'THE BASEMENT EAST')
assert.match(showCtx.place, /NASHVILLE/)
assert.match(showCtx.place, /OCTOBER 18/)
assert.doesNotMatch(showCtx.place, /unknown/i)
assert.equal(generalCtx.artist, 'BADFLOWER')
assert.equal(generalCtx.secondary, 'SUMMER TOUR PORTRAITS')
assert.equal(generalCtx.place, '')
assert.equal(generalCtx.venue, '')
assert.equal(minimalCtx.secondary, 'SUMMER TOUR PORTRAITS')
assert.equal(minimalCtx.place, '')
assert.equal(joinContextParts(['', ' ', null, 'NASHVILLE']), 'NASHVILLE')
assert.equal(joinContextParts(['', '']), '')

const generalInfo = livingGalleryInfoRows(generalNight, basementEastNight.memories[0])
assert.deepEqual(generalInfo.map((row) => row.label), ['Caption', 'Gallery', 'Artist'])
assert.equal(generalInfo.some((row) => row.label === 'Venue'), false)
assert.equal(generalInfo.some((row) => row.label === 'Date'), false)
const showInfo = livingGalleryInfoRows(showNight, basementEastNight.memories[0])
assert.equal(showInfo.some((row) => row.label === 'Venue'), true)
assert.equal(showInfo.some((row) => row.label === 'Date'), true)
assert.equal(showInfo.some((row) => row.label === 'Artist'), true)
assert.equal(livingGalleryIdentityLines(generalNight).venue, '')
assert.equal(livingGalleryVisibleContext(normalizeLivingGalleryContext(showNight), { compact: true }).place, '')
const generalInfoOpen = livingGalleryInfoRows(generalNight, basementEastNight.memories[0], { omitVisible: true })
assert.deepEqual(generalInfoOpen.map((row) => row.label), ['Caption'])
const showInfoOpen = livingGalleryInfoRows(showNight, basementEastNight.memories[0], { omitVisible: true })
assert.equal(showInfoOpen.some((row) => row.label === 'Artist'), false)
assert.equal(showInfoOpen.some((row) => row.label === 'Venue'), false)
assert.equal(showInfoOpen.some((row) => row.label === 'Date'), false, 'chrome already has place/date')
const showInfoExpand = livingGalleryInfoRows(showNight, basementEastNight.memories[1], { replaceChrome: true })
assert.equal(showInfoExpand.some((row) => row.label === 'Artist'), true)
assert.equal(showInfoExpand.some((row) => row.label === 'Caption'), true)
assert.equal(showInfoExpand.find((row) => row.label === 'Caption')?.value, 'Beside him.')
assert.ok(
  showInfoExpand.findIndex((row) => row.label === 'Caption')
  < showInfoExpand.findIndex((row) => row.label === 'Artist'),
  'Caption precedes Artist in Info hierarchy',
)
assert.equal(showInfoExpand.some((row) => row.label === 'Date'), true)
const showGroups = livingGalleryInfoGroups(showNight, basementEastNight.memories[1], { replaceChrome: true })
assert.equal(showGroups.story.some((row) => row.kind === 'caption'), true)
assert.ok(showGroups.place.length >= 1)
const doorShow = normalizeDoorwayContext(showNight, livingGalleryMemories(basementEastNight))
assert.equal(doorShow.artist, 'BADFLOWER')
assert.equal(doorShow.collection, 'THE BASEMENT EAST')
assert.match(doorShow.place, /NASHVILLE/)
assert.equal(doorwayCountLabel(1), '1 photograph')
const doorGeneral = normalizeDoorwayContext(generalNight, livingGalleryMemories(basementEastNight).slice(0, 1))
assert.equal(doorGeneral.collection, 'SUMMER TOUR PORTRAITS')
assert.equal(doorGeneral.place, '')
assert.equal(deckHasStack(1), false)
assert.equal(deckHasStack(8), true)
assert.equal(clampDeckIndex(-2, 8), 0)
assert.equal(clampDeckIndex(20, 8), 7)
assert.equal(deckLayers(livingGalleryMemories(basementEastNight), 0).at(-1).front, true)
assert.equal(deckLayers(livingGalleryMemories(basementEastNight), 0).length, 1)
assert.equal(deckLayers(livingGalleryMemories(basementEastNight).slice(0, 2), 0).filter((row) => !row.front).length, 0)
assert.equal(deckLayers(livingGalleryMemories(basementEastNight).slice(0, 1), 0).length, 1)
assert.equal(deckLayers(livingGalleryMemorySet(basementEastNight, 'large'), 0).length, 1)
const landFit = fitPhotoInStage(1024, 575, 351, 380)
assert.ok(landFit.w > landFit.h)
assert.ok(landFit.w + landFit.x <= 351)
assert.ok(landFit.h + landFit.y <= 380)
const portFit = fitPhotoInStage(1000, 1500, 351, 380)
assert.ok(portFit.h > portFit.w)
assert.ok(portFit.h + portFit.y <= 380)
const rearStyle = deckLayerStyle({ layer: 1, front: false })
assert.match(rearStyle.transform, /translate3d\(0px, 0px/)
assert.equal(commitDeckDrag({ dx: -80, index: 0, count: 8 }), 1)
assert.equal(commitDeckDrag({ dx: 80, index: 0, count: 8 }), 0)

function assertLowerCompose(label, viewport, image) {
  const rect = resolvePhotoComposition({
    viewportWidth: viewport[0],
    viewportHeight: viewport[1],
    imageWidth: image[0],
    imageHeight: image[1],
  }).imageRect
  const chromeOff = resolvePhotoComposition({
    viewportWidth: viewport[0],
    viewportHeight: viewport[1],
    imageWidth: image[0],
    imageHeight: image[1],
    chromeOn: true,
  }).imageRect
  assert.deepEqual(rect, chromeOff, `${label} chrome must not move imageRect`)
  const lower = resolvePhotosOpenLowerCompose({
    viewportHeight: viewport[1],
    imageRect: rect,
    safeBottom: 34,
    contextOn: true,
    sheetOpen: true,
  })
  assert.equal(lower.composed, true, label)
  assert.ok(lower.breathAbove >= 8 && lower.breathAbove <= 24, `${label} breathAbove ${lower.breathAbove}`)
  assert.ok(lower.breathBetween <= 12, `${label} context/sheet stay a family`)
  assert.ok(lower.contextTop >= lower.photoBottom + 8, `${label} context overlaps photo`)
  assert.ok(lower.sheetTop >= lower.contextTop + lower.contextHeight, `${label} sheet sits in the gap`)
  assert.ok(lower.sheetTop < viewport[1] - 40, `${label} sheet not just a bottom pin leftover`)
  const midGap = lower.sheetTop - (lower.contextTop + lower.contextHeight)
  assert.ok(midGap <= 12, `${label} accidental mid gap ${midGap}`)
  const minFinish = viewport[1] < 830 ? 6 : 8
  assert.ok(lower.leftoverBelow >= minFinish, `${label} finishing breath ${lower.leftoverBelow}`)
  assert.ok(lower.finish >= minFinish, `${label} finish ${lower.finish}`)
}

assertLowerCompose('390 2:3', [390, 844], [1000, 1500])
assertLowerCompose('390 near-square', [390, 844], [910, 1024])
assertLowerCompose('390 square', [390, 844], [1024, 1024])
assertLowerCompose('390 landscape', [390, 844], [1024, 682])
assertLowerCompose('390 wide', [390, 844], [1024, 575])
assertLowerCompose('430 2:3', [430, 932], [1000, 1500])
assertLowerCompose('430 near-square', [430, 932], [910, 1024])
assertLowerCompose('430 landscape', [430, 932], [1024, 682])
assertLowerCompose('375 2:3', [375, 812], [1000, 1500])
assertLowerCompose('393 landscape', [393, 852], [1024, 682])

const oneSet = livingGalleryMemorySet(basementEastNight, 'one')
const largeSet = livingGalleryMemorySet(basementEastNight, 'large')
assert.equal(oneSet.length, 1)
assert.equal(largeSet.length, livingGalleryMemories(basementEastNight).length * 3)
assert.equal(shouldShowContactSheet(1), false)
assert.equal(shouldShowContactSheet(8), true)
assert.equal(thumbnailItems(oneSet, 0).length, 1)
const continuity = thumbnailContinuity({ index: 4, item: { id: 'memory-e', mediaId: 'memory-e' } })
assert.equal(continuity.index, 4)
assert.equal(continuity.mediaId, 'memory-e')
assert.equal(continuity.thumbnailBounds, undefined)

const generalShare = buildPhotoSharePayload({
  night: generalNight,
  memory: basementEastNight.memories[0],
  url: 'https://example.test/lab',
})
assert.match(generalShare.text, /SUMMER TOUR PORTRAITS/)
assert.doesNotMatch(generalShare.text, /BASEMENT EAST/)

const thumbsSrc = fs.readFileSync(path.join(root, 'features/gallery-experience/living-gallery/LivingGalleryThumbnails.vue'), 'utf8')
assert.match(thumbsSrc, /fq-lg-sheet/)
assert.match(thumbsSrc, /thumbnailContinuity/)
assert.match(viewer, /LivingGalleryDock/)
assert.match(viewer, /onTogglePhotos/)

const singleEngine = createLivingGalleryController({
  adapter: {
    index: 0,
    async open() { this.index = 0 },
    close() {},
    goTo() {},
    getIndex() { return 0 },
    getZoomState() { return { level: 1, min: 1, max: 1, initial: 1, isZoomed: false, canZoom: false, canPan: false } },
  },
  history: { enter() {}, exit() {} },
  fullscreen: { canFullscreen: () => false, isFullscreen: () => false, enter: async () => false, exit: async () => false, toggle: async () => false, attach() {}, detach() {} },
  env: { isTouch: true, reducedMotion: false, isStandalone: false },
})
await singleEngine.open(oneSet, 0, { night: generalNight })
assert.equal(singleEngine.getState().total, 1)
assert.equal(singleEngine.getState().capabilities.canShowThumbnails, false)
singleEngine.toggleThumbnails()
assert.equal(singleEngine.getState().thumbnailsOn, false)
singleEngine.destroy()

assert.match(lab, /Portrait 2:3/)
assert.match(lab, /Doorway \+ Deck \+ Living Gallery/)
assert.match(lab, /setLab\('galleryKind', 'general'\)/)
assert.match(lab, /compareVisible/)
assert.match(panel, /Direct/)
assert.match(panel, /Hier/)
assert.doesNotMatch(panel, /Doorway/)
assert.match(panel, /Context on/)
assert.match(panel, /MR-A/)
assert.match(panel, /MR-B/)
assert.match(panel, /MR-C/)
assert.match(panel, /Slight high/)

const residueApi = createMemoryResidueRenderer()
assert.equal(typeof residueApi.init, 'function')
assert.equal(typeof residueApi.capture, 'function')
assert.equal(typeof residueApi.startDecay, 'function')
assert.equal(typeof residueApi.setProgress, 'function')
assert.equal(typeof residueApi.resize, 'function')
assert.equal(typeof residueApi.suspend, 'function')
assert.equal(typeof residueApi.resume, 'function')
assert.equal(typeof residueApi.destroy, 'function')
assert.equal(residueApi.isReady(), false)
const residueBoot = await residueApi.init(null)
assert.equal(residueBoot.ready, false)
assert.equal(createDefaultTuning().stageMode, 'black')

const residueSrc = fs.readFileSync(path.join(root, 'features/gallery-experience/memory-residue/createMemoryResidueRenderer.js'), 'utf8')
assert.match(residueSrc, /WebGLRenderer/)
assert.doesNotMatch(residueSrc, /from 'photoswipe'|from "photoswipe"/)

console.log('test-gallery-experience-lab: ok')
