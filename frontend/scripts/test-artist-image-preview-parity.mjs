/**
 * Editor preview must use the same Cybered public hero frame + photo style.
 * Run: node scripts/test-artist-image-preview-parity.mjs
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse, compileScript, compileTemplate } from '@vue/compiler-sfc'
import { getCyberedHeroPhotoStyle } from '../utils/media/artistImage.js'
import {
  CYBERED_PREVIEW_DESKTOP_VIEWPORT,
  CYBERED_PREVIEW_PHONE_VIEWPORT,
  getCyberedEditorPreviewFrame,
  getCyberedPublicHeroFrame,
} from '../utils/media/cyberedHeroGeometry.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

function read(rel) {
  return readFileSync(join(root, rel), 'utf8')
}

function compileSfc(rel) {
  const source = read(rel)
  const { descriptor, errors } = parse(source, { filename: rel })
  assert.equal(errors.length, 0, `${rel} parse errors`)
  if (descriptor.scriptSetup || descriptor.script) {
    compileScript(descriptor, { id: 'test' })
  }
  if (descriptor.template) {
    compileTemplate({
      source: descriptor.template.content,
      filename: rel,
      id: 'test',
    })
  }
}

let passed = 0
function test(name, fn) {
  fn()
  passed += 1
  console.log(`  ✅ ${name}`)
}

const rockers = { width: 1000, height: 1500 }
const landscape = { width: 2047, height: 1151 }
const square = { width: 1300, height: 1300 }

test('compiles editor, public hero, and setup pages', () => {
  compileSfc('components/bands/FaneqoArtistImageEditor.vue')
  compileSfc('components/band/BandPageCybered.vue')
  compileSfc('pages/createband.vue')
  compileSfc('pages/editband/[id].vue')
})

test('phone 390 deep portrait matches public mobile cap, not form width', () => {
  const phone = getCyberedPublicHeroFrame({
    surface: 'phone',
    image: rockers,
    viewportWidth: 390,
    viewportHeight: 844,
  })
  assert.equal(phone.surface, 'phone')
  assert.equal(phone.band, 'deep')
  assert.equal(phone.width, 366)
  assert.equal(phone.height, 405.12)
  assert.ok(Math.abs(phone.ratio - 366 / 405.12) < 0.0001)
  assert.equal(phone.objectFit, 'cover')

  const editor = getCyberedEditorPreviewFrame({ surface: 'phone', image: rockers })
  assert.deepEqual(
    { width: editor.width, height: editor.height, ratio: editor.ratio, objectFit: editor.objectFit },
    { width: phone.width, height: phone.height, ratio: phone.ratio, objectFit: phone.objectFit },
  )
  assert.equal(editor.viewportWidth, CYBERED_PREVIEW_PHONE_VIEWPORT.width)
})

test('phone 320 / 430 stay on the public portrait cap', () => {
  const narrow = getCyberedPublicHeroFrame({
    surface: 'phone',
    image: rockers,
    viewportWidth: 320,
    viewportHeight: 568,
  })
  assert.equal(narrow.width, 296)
  assert.equal(narrow.height, 380)

  const wide = getCyberedPublicHeroFrame({
    surface: 'phone',
    image: rockers,
    viewportWidth: 430,
    viewportHeight: 932,
  })
  assert.equal(wide.width, 406)
  assert.equal(wide.height, 430)
})

test('desktop 1440 / 1280 / 1600 use the cinematic stage, not source ratio', () => {
  const at1440 = getCyberedPublicHeroFrame({
    surface: 'desktop',
    image: rockers,
    viewportWidth: 1440,
    viewportHeight: 900,
  })
  assert.equal(at1440.surface, 'desktop')
  assert.equal(at1440.width, Math.round((1440 * 0.68 - 32) * 100) / 100)
  assert.equal(at1440.height, 504)
  assert.ok(at1440.ratio > 1.8)
  assert.equal(at1440.objectFit, 'cover')

  const editor = getCyberedEditorPreviewFrame({ surface: 'desktop', image: rockers })
  assert.equal(editor.width, at1440.width)
  assert.equal(editor.height, at1440.height)
  assert.equal(editor.viewportWidth, CYBERED_PREVIEW_DESKTOP_VIEWPORT.width)

  const at1280 = getCyberedPublicHeroFrame({
    surface: 'desktop',
    image: rockers,
    viewportWidth: 1280,
    viewportHeight: 800,
  })
  assert.equal(at1280.height, 496)
  assert.equal(at1280.width, 838.4)

  const at1600 = getCyberedPublicHeroFrame({
    surface: 'desktop',
    image: rockers,
    viewportWidth: 1600,
    viewportHeight: 900,
  })
  assert.equal(at1600.width, 960)
  assert.equal(at1600.height, 504)
})

test('landscape and square phone frames follow public min-height, not a generic portrait hole', () => {
  const wide = getCyberedPublicHeroFrame({
    surface: 'phone',
    image: landscape,
    viewportWidth: 390,
    viewportHeight: 844,
  })
  assert.equal(wide.band, 'wide')
  assert.equal(wide.width, 366)
  assert.equal(wide.height, 280)

  const box = getCyberedPublicHeroFrame({
    surface: 'phone',
    image: square,
    viewportWidth: 390,
    viewportHeight: 844,
  })
  assert.equal(box.band, 'square')
  assert.equal(box.width, 366)
  assert.equal(box.height, 366)
})

test('phone and desktop preview frames stay independent boxes', () => {
  const style = getCyberedHeroPhotoStyle({ positionX: 48, positionY: 22, zoom: 1.06 })
  assert.equal(style.objectPosition, '48% 22%')
  assert.equal(style.transform, 'scale(1.06)')
  assert.equal(style.transformOrigin, '48% 22%')

  const phone = getCyberedEditorPreviewFrame({ surface: 'phone', image: rockers })
  const desktop = getCyberedEditorPreviewFrame({ surface: 'desktop', image: rockers })
  assert.notEqual(phone.ratio, desktop.ratio)
  const editor = read('components/bands/FaneqoArtistImageEditor.vue')
  assert.match(editor, /activeSurface/)
  assert.match(editor, /update:phone/)
  assert.match(editor, /update:desktop/)
})

test('editor and public page share the photo helper and do not use a preview-only fit', () => {
  const editor = read('components/bands/FaneqoArtistImageEditor.vue')
  const cybered = read('components/band/BandPageCybered.vue')
  assert.match(editor, /getCyberedSurfacePhotoStyle/)
  assert.match(editor, /getCyberedEditorPreviewFrame/)
  assert.match(editor, /object-fit:\s*cover/)
  assert.match(cybered, /getCyberedSurfacePhotoStyle/)
  assert.match(cybered, /object-fit:\s*cover/)
  assert.doesNotMatch(editor, /surface="preview"/)
  assert.doesNotMatch(editor, /CYBERED_HERO_PREVIEW_FIT/)
  assert.doesNotMatch(editor, /resolveArtistImageFit/)
  assert.doesNotMatch(cybered, /resolveArtistImageFit/)
})

test('edit omits framing unless the image section was changed', () => {
  const edit = read('pages/editband/[id].vue')
  assert.match(edit, /imageSectionDirty/)
  assert.match(edit, /hydratedImageSignature/)
  assert.match(edit, /phoneFramingDirty/)
  assert.match(edit, /desktopFramingDirty/)
  assert.match(edit, /buildCyberedFramingSavePayload/)
  assert.match(edit, /@framing-change="onArtistFramingChange"/)
  const upload = edit.slice(
    edit.indexOf('async function handleImageUpload'),
    edit.indexOf('function handleSingleSongUpload'),
  )
  assert.match(upload, /applyNewImagePresentation\(\)/)
})

console.log(`\nartist-image-preview-parity: ${passed} tests passed`)
