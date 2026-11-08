/**
 * Artist profile-image setup contracts.
 * Run: node scripts/test-artist-image-setup.mjs
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse, compileScript, compileTemplate } from '@vue/compiler-sfc'

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

const editor = read('components/bands/FaneqoArtistImageEditor.vue')
const create = read('pages/createband.vue')
const edit = read('pages/editband/[id].vue')
const cybered = read('components/band/BandPageCybered.vue')
const hero = read('components/band/FaneqoArtistHeroImage.vue')

test('compiles image editor and setup pages', () => {
  compileSfc('components/bands/FaneqoArtistImageEditor.vue')
  compileSfc('components/bands/CyberedImagePositionEditor.vue')
  compileSfc('pages/createband.vue')
  compileSfc('pages/editband/[id].vue')
  compileSfc('pages/__dev/artist-image-framing.vue')
})

test('artist editor exposes Fill frame and Full photo per surface', () => {
  assert.match(editor, /Fill frame/)
  assert.match(editor, /Full photo/)
  assert.doesNotMatch(editor, /Show full image/)
  assert.doesNotMatch(editor, /Adaptive/)
  assert.doesNotMatch(editor, /name="artist-image-fit"/)
  assert.match(editor, /Adjust framing/)
  assert.match(editor, /getCyberedEditorPreviewFrame/)
  assert.match(editor, /getCyberedSurfacePhotoStyle/)
  assert.match(editor, />\s*Phone\s*</)
  assert.match(editor, />\s*Desktop\s*</)
  assert.doesNotMatch(editor, /Mobile mode/)
  assert.doesNotMatch(editor, /FaneqoArtistHeroImage/)
})

test('framing is on the live preview, not a second crop frame', () => {
  assert.match(editor, /@pointerdown="startDrag"/)
  assert.match(editor, /nextArtistFocalFromPointerDelta/)
  assert.match(editor, /controlId\('y'\)/)
  assert.match(editor, /controlId\('z'\)/)
  assert.doesNotMatch(editor, /framingOpen/)
  assert.doesNotMatch(editor, /CyberedImagePositionEditor/)
  assert.match(editor, /previewViewport === 'desktop'/)
  assert.match(editor, /previewViewport === 'phone'/)
  assert.match(create, /buildCyberedFramingSavePayload/)
  assert.match(edit, /buildCyberedFramingSavePayload/)
  assert.match(edit, /phoneFramingDirty/)
  assert.match(edit, /desktopFramingDirty/)
  assert.match(edit, /imageSectionDirty/)
})

test('create and edit reset presentation only when a new image is chosen', () => {
  assert.match(create, /resetCyberedSurfaceCrop/)
  assert.match(edit, /resetCyberedSurfaceCrop/)
  assert.match(create, /function applyNewImagePresentation/)
  assert.match(edit, /function applyNewImagePresentation/)
  assert.match(create, /applyNewImagePresentation\(\)/)
  assert.match(edit, /applyNewImagePresentation\(\)/)

  const createUpload = create.slice(
    create.indexOf('async function handleImageUpload'),
    create.indexOf('function handleSingleSongUpload'),
  )
  const editUpload = edit.slice(
    edit.indexOf('async function handleImageUpload'),
    edit.indexOf('function handleSingleSongUpload'),
  )
  assert.match(createUpload, /applyNewImagePresentation\(\)/)
  assert.match(editUpload, /applyNewImagePresentation\(\)/)
  assert.match(edit, /readCyberedSurfaceFraming\(attrs\)/)
  assert.match(edit, /resetCyberedSurfaceCrop/)
  assert.ok(!editUpload.includes('fetchBand'))
  assert.ok(edit.indexOf('readCyberedSurfaceFraming') < edit.indexOf('function applyNewImagePresentation'))
})

test('edit hydrates both surfaces and does not bulk-write defaults', () => {
  assert.match(edit, /readCyberedSurfaceFraming/)
  assert.match(edit, /phoneDirty: phoneFramingDirty.value/)
  assert.match(edit, /desktopDirty: desktopFramingDirty.value/)
  assert.doesNotMatch(edit, /layoutConfig\.imageFit = 'auto'/)
})

test('public Cybered hero uses persisted per-surface fill or full', () => {
  assert.match(cybered, /object-fit:\s*cover/)
  assert.match(cybered, /getCyberedSurfacePhotoStyle/)
  assert.match(cybered, /resolveCyberedSurfaceFraming/)
  assert.match(cybered, /data-hero-desktop-fit/)
  assert.doesNotMatch(cybered, /resolveArtistImageFit/)
  assert.doesNotMatch(cybered, /FaneqoArtistHeroImage/)
  assert.match(hero, /object-fit: cover/)
  assert.match(hero, /object-fit: contain/)
})

console.log(`\nartist-image-setup: ${passed} tests passed`)
