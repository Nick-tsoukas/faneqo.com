/**
 * Independent Phone/Desktop Cybered framing.
 * Run: node scripts/test-artist-image-framing.mjs
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getCyberedHeroPhotoStyle } from '../utils/media/artistImage.js'
import {
  buildCyberedFramingSavePayload,
  getCyberedSurfacePhotoStyle,
  getDefaultCyberedSurfaceFraming,
  isCyberedDesktopCropInherited,
  normalizeCyberedHeroFit,
  readCyberedSurfaceFraming,
  resetCyberedSurfaceCrop,
  resolveCyberedSurfaceFraming,
} from '../utils/media/cyberedArtistFraming.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

function read(rel) {
  return readFileSync(join(root, rel), 'utf8')
}

let passed = 0
function test(name, fn) {
  fn()
  passed += 1
  console.log(`  ✅ ${name}`)
}

const legacy = {
  cyberedImagePositionX: 44,
  cyberedImagePositionY: 21,
  cyberedImageZoom: 1.2,
}

test('null and missing fit mean Fill', () => {
  assert.equal(normalizeCyberedHeroFit(null), 'fill')
  assert.equal(normalizeCyberedHeroFit(undefined), 'fill')
  assert.equal(normalizeCyberedHeroFit(''), 'fill')
  assert.equal(normalizeCyberedHeroFit('auto'), 'fill')
  assert.equal(normalizeCyberedHeroFit('full'), 'full')
})

test('existing records keep the same desktop appearance via legacy fallback', () => {
  assert.equal(isCyberedDesktopCropInherited(legacy), true)
  assert.deepEqual(resolveCyberedSurfaceFraming(legacy, 'desktop'), {
    fit: 'fill',
    positionX: 44,
    positionY: 21,
    zoom: 1.2,
  })
  assert.deepEqual(resolveCyberedSurfaceFraming(legacy, 'phone'), {
    fit: 'fill',
    positionX: 44,
    positionY: 21,
    zoom: 1.2,
  })
})

test('fractional crop positions are saved as whole percents', () => {
  const payload = buildCyberedFramingSavePayload({
    phone: { fit: 'fill', positionX: 44.2, positionY: 10.6, zoom: 1.06 },
    desktop: { fit: 'fill', positionX: 12.4, positionY: 88.5, zoom: 1.4 },
    phoneDirty: true,
    desktopDirty: true,
  })
  assert.equal(payload.cyberedImagePositionX, 44)
  assert.equal(payload.cyberedImagePositionY, 11)
  assert.equal(payload.cyberedDesktopPositionX, 12)
  assert.equal(payload.cyberedDesktopPositionY, 89)
  assert.equal(payload.cyberedImageZoom, 1.06)
  assert.equal(payload.cyberedDesktopZoom, 1.4)
})

test('desktop-only payload never includes phone fields', () => {
  const payload = buildCyberedFramingSavePayload({
    phone: { fit: 'full', positionX: 10, positionY: 90, zoom: 2 },
    desktop: { fit: 'full', positionX: 12, positionY: 88, zoom: 1.4 },
    phoneDirty: false,
    desktopDirty: true,
  })
  assert.deepEqual(payload, {
    cyberedDesktopPositionX: 12,
    cyberedDesktopPositionY: 88,
    cyberedDesktopZoom: 1.4,
    cyberedDesktopFit: 'full',
  })
})

test('phone-only payload never includes desktop fields', () => {
  const payload = buildCyberedFramingSavePayload({
    phone: { fit: 'fill', positionX: 10, positionY: 90, zoom: 1.5 },
    desktop: { fit: 'full', positionX: 12, positionY: 88, zoom: 1.4 },
    phoneDirty: true,
    desktopDirty: false,
  })
  assert.deepEqual(payload, {
    cyberedImagePositionX: 10,
    cyberedImagePositionY: 90,
    cyberedImageZoom: 1.5,
    cyberedMobileFit: 'fill',
  })
})

test('Fill → Full keeps the stored crop, and Full renders at zoom 1', () => {
  const stored = { fit: 'full', positionX: 44, positionY: 21, zoom: 1.2 }
  const rendered = getCyberedSurfacePhotoStyle(stored)
  assert.equal(rendered.objectFit, 'contain')
  assert.equal(rendered.objectPosition, '50% 100%')
  assert.equal(rendered.transform, 'none')
  assert.equal(stored.positionX, 44)
  assert.equal(stored.zoom, 1.2)

  const restored = getCyberedSurfacePhotoStyle({ ...stored, fit: 'fill' })
  const live = getCyberedHeroPhotoStyle({ positionX: 44, positionY: 21, zoom: 1.2 })
  assert.equal(restored.objectFit, 'cover')
  assert.equal(restored.objectPosition, live.objectPosition)
  assert.equal(restored.transform, live.transform)
})

test('reset keeps the selected fit and writes a neutral crop', () => {
  const next = resetCyberedSurfaceCrop({ fit: 'full', positionX: 8, positionY: 92, zoom: 1.8 })
  assert.deepEqual(next, { fit: 'full', positionX: 50, positionY: 50, zoom: 1 })
})

test('explicit desktop values do not inherit later phone crops', () => {
  const band = {
    ...legacy,
    cyberedDesktopPositionX: 8,
    cyberedDesktopPositionY: 92,
    cyberedDesktopZoom: 1.8,
    cyberedDesktopFit: 'full',
    cyberedMobileFit: 'fill',
  }
  const surfaces = readCyberedSurfaceFraming({
    ...band,
    cyberedImagePositionX: 3,
    cyberedImagePositionY: 97,
    cyberedImageZoom: 2,
  })
  assert.equal(surfaces.desktopInherited, false)
  assert.equal(surfaces.phone.positionX, 3)
  assert.equal(surfaces.desktop.positionX, 8)
  assert.equal(surfaces.desktop.fit, 'full')
})

test('image replacement keeps each surface fit and resets crops', () => {
  const phone = resetCyberedSurfaceCrop({ fit: 'full', positionX: 10, positionY: 20, zoom: 1.4 })
  const desktop = resetCyberedSurfaceCrop({ fit: 'fill', positionX: 80, positionY: 15, zoom: 1.9 })
  assert.deepEqual(phone, { fit: 'full', positionX: 50, positionY: 50, zoom: 1 })
  assert.deepEqual(desktop, { fit: 'fill', positionX: 50, positionY: 50, zoom: 1 })
})

test('new artists start both surfaces on Fill with independent neutral crops', () => {
  assert.deepEqual(getDefaultCyberedSurfaceFraming(), {
    fit: 'fill',
    positionX: 50,
    positionY: 50,
    zoom: 1,
  })
})

test('editor and public page use the shared surface helper, not experiment storage', () => {
  const editor = read('components/bands/FaneqoArtistImageEditor.vue')
  const cybered = read('components/band/BandPageCybered.vue')
  const edit = read('pages/editband/[id].vue')
  const create = read('pages/createband.vue')
  assert.match(editor, /getCyberedSurfacePhotoStyle/)
  assert.match(editor, /Fill frame/)
  assert.match(editor, /Full photo/)
  assert.doesNotMatch(editor, /Adaptive/)
  assert.doesNotMatch(editor, /heroExperiment/)
  assert.doesNotMatch(editor, /automatic/i)
  assert.match(cybered, /resolveCyberedSurfaceFraming/)
  assert.match(cybered, /getCyberedSurfacePhotoStyle/)
  assert.match(cybered, /data-hero-desktop-fit/)
  assert.match(cybered, /useHeroExperiment/)
  assert.match(edit, /phoneFramingDirty/)
  assert.match(edit, /desktopFramingDirty/)
  assert.match(edit, /buildCyberedFramingSavePayload/)
  assert.match(create, /phoneDirty: true/)
  assert.match(create, /desktopDirty: true/)
  assert.doesNotMatch(edit, /createImageFitLayoutPatch/)
  assert.doesNotMatch(create, /createImageFitLayoutPatch/)
})

test('tab switching is local state and Recap stays a phone-only writer', () => {
  const editor = read('components/bands/FaneqoArtistImageEditor.vue')
  const sheet = read('components/nights/ArtistImagePositionSheet.vue')
  const recap = read('components/dashboard/fans/ShowRecapDetailContent.vue')
  assert.match(editor, /previewViewport = 'phone'/)
  assert.match(editor, /previewViewport = 'desktop'/)
  assert.doesNotMatch(editor, /@click="previewViewport = 'desktop';[\s\S]{0,80}emit\('framing-change'\)/)
  assert.match(sheet, /:surfaces="isNightHero \? 'both' : 'phone'"/)
  assert.match(recap, /cyberedImagePositionX: next.positionX/)
  assert.doesNotMatch(recap, /cyberedDesktopPositionX/)
})

console.log(`\nartist-image-framing: ${passed} tests passed`)
