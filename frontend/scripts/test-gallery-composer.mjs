/**
 * G2: Recap composer tightening contracts.
 * Run: node scripts/test-gallery-composer.mjs
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse, compileScript, compileTemplate } from '@vue/compiler-sfc'
import {
  FANEQO_DM_MAX_IMAGES,
  FANEQO_SHOW_MAX_IMAGES,
  FANEQO_SHOW_UPLOAD_CONCURRENCY,
  FANEQO_UPDATE_MAX_IMAGES,
  FANEQO_UPLOAD_CONCURRENCY,
  createFaneqoMediaUploadQueue,
} from '../utils/media/faneqoMedia.js'
import { deriveShowPhotosTitle } from '../utils/shows/formatShowNightDate.js'
import { buildSharePhotosPath } from '../utils/updates/sharePhotosFromRecap.js'

const root = dirname(fileURLToPath(import.meta.url))
const read = (rel) => readFileSync(resolve(root, '..', rel), 'utf8')

let passed = 0
function test(name, fn) {
  fn()
  passed += 1
  console.log(`  ok  ${name}`)
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

test('every gallery kind is 60 photos; DM limit stays separate', () => {
  assert.equal(FANEQO_SHOW_MAX_IMAGES, 60)
  assert.equal(FANEQO_UPDATE_MAX_IMAGES, 60)
  assert.equal(FANEQO_DM_MAX_IMAGES, 4)
  assert.equal(FANEQO_SHOW_UPLOAD_CONCURRENCY, 2)
  assert.equal(FANEQO_UPLOAD_CONCURRENCY, 3)
})

test('queue accepts 60 show photos and drops a 61st', () => {
  const queue = createFaneqoMediaUploadQueue({
    maxItems: FANEQO_SHOW_MAX_IMAGES,
    uploadFn: async () => ({ mediaId: 1 }),
  })
  const files = Array.from({ length: 61 }, (_, i) => ({
    type: 'image/jpeg',
    size: 1024,
    name: `${i + 1}.jpg`,
  }))
  queue.addFiles(files)
  assert.equal(queue.items.length, 60)
})

test('title stays optional and derived title still works', () => {
  assert.equal(
    deriveShowPhotosTitle({ city: 'Nashville', venue: 'The Basement East', date: '2024-10-18' }),
    'Nashville — Oct 18',
  )
  const composer = read('components/updates/ArtistUpdateComposer.vue')
  assert.match(composer, /derivedTitle/)
  assert.match(composer, /title\.value/)
  assert.match(composer, /Optional/)
  assert.doesNotMatch(composer, /required.*title/i)
})

test('composer show-photos mode defaults to public and can choose show_attendees', () => {
  const composer = read('components/updates/ArtistUpdateComposer.vue')
  assert.match(composer, /FANEQO_SHOW_MAX_IMAGES/)
  assert.match(composer, /up to \$\{maxPhotos\}/)
  assert.match(composer, /iPhone photos, JPEG, PNG, or WebP/)
  assert.match(composer, /FANEQO_SHOW_TOO_MANY_COPY/)
  assert.match(composer, /FANEQO_UPLOAD_CONCURRENCY/)
  assert.match(composer, /visibility = ref\('public'\)/)
  assert.match(composer, /show_attendees/)
  assert.match(composer, /showRecapId/)
  assert.match(composer, /Photos from tonight/)
  assert.match(composer, /People who were there/)
  assert.match(composer, /Use ★ on any photo to make it the cover/)
  assert.doesNotMatch(composer, /contentKind/)
  assert.doesNotMatch(composer, /Audience Type/)
  assert.match(composer, /deliveryReady/)
  assert.match(composer, /Protected delivery isn’t available yet/)
})

test('caption remains optional; cover is explicit; reorder exists', () => {
  const composer = read('components/updates/ArtistUpdateComposer.vue')
  assert.match(composer, /caption: caption\.value/)
  const preview = read('components/media/FaneqoMediaPreview.vue')
  assert.match(preview, /return index === 0/)
  assert.match(preview, />Cover/)
  assert.match(preview, /Move earlier/)
  assert.match(preview, /Move later/)
  assert.match(preview, /Make cover/)
  assert.match(preview, /repeat\(4, minmax\(0, 1fr\)\)/)
  assert.match(preview, /repeat\(2, minmax\(0, 1fr\)\)/)
  assert.match(preview, /aspect-ratio: 1 \/ 1/)
  assert.doesNotMatch(preview, /#39ff14/i)
  assert.doesNotMatch(preview, /rgba\(57,\s*255,\s*20/)
})

test('recap list Share photos includes recapId', () => {
  const page = read('components/nights/NightHistoryRow.vue')
  assert.match(page, /Share photos/)
  assert.match(page, /buildSharePhotosPath/)
  const path = buildSharePhotosPath({ id: 41, city: 'Nashville' }, { from: '/fans/recaps' })
  assert.match(path, /recapId=41/)
  assert.match(path, /^\/galleries\/new\?/)
})

test('upload failure keeps ready photos and allows retry', async () => {
  let calls = 0
  const queue = createFaneqoMediaUploadQueue({
    maxItems: FANEQO_SHOW_MAX_IMAGES,
    concurrency: 1,
    uploadFn: async () => {
      calls += 1
      if (calls === 2) {
        const err = new Error('fail')
        err.status = 500
        throw err
      }
      return { mediaId: calls }
    },
  })
  queue.addFiles([
    { type: 'image/jpeg', size: 10, name: '1.jpg' },
    { type: 'image/jpeg', size: 10, name: '2.jpg' },
    { type: 'image/jpeg', size: 10, name: '3.jpg' },
  ])
  await new Promise((resolve) => setTimeout(resolve, 30))
  assert.equal(queue.items.filter((row) => row.state === 'ready').length, 2)
  assert.equal(queue.items.filter((row) => row.state === 'failed').length, 1)
  assert.equal(queue.ready, false)
  queue.retry(queue.items[1].localId)
  await new Promise((resolve) => setTimeout(resolve, 20))
  assert.equal(queue.items.every((row) => row.state === 'ready'), true)
  assert.equal(queue.ready, true)
})

test('general gallery composer uses labeled add-photos and no lime CTAs', () => {
  const composer = read('components/updates/ArtistUpdateComposer.vue')
  const picker = read('components/media/FaneqoMediaPicker.vue')
  /* Big inviting drop target while empty, compact "add more" once populated. */
  assert.match(composer, /queue\.items\.length \? 'labeled' : 'block'/)
  assert.match(picker, /variant === 'labeled'/)
  assert.match(picker, /Add photos/)
  assert.doesNotMatch(composer, /#39ff14/i)
  assert.doesNotMatch(composer, /rgba\(57,\s*255,\s*20/)
  assert.match(composer, /#39d5ff/)
  assert.match(composer, /#4ca6ff|#4CA6FF/)
})

test('touched composer SFCs compile', () => {
  compileSfc('components/updates/ArtistUpdateComposer.vue')
  compileSfc('pages/fans/recaps/index.vue')
  compileSfc('components/media/FaneqoMediaPreview.vue')
  compileSfc('components/media/FaneqoMediaPicker.vue')
  compileSfc('pages/galleries/index.vue')
  compileSfc('pages/galleries/new.vue')
  compileSfc('components/labs/SharePhotosLabBoard.vue')
  compileSfc('components/labs/GalleryLabBoard.vue')
})

console.log(`test-gallery-composer: ${passed} ok`)
