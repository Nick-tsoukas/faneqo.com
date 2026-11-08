/**
 * Gallery edit route contracts.
 *
 * Editing reads the management payload, not the public one. A stale version is
 * a fork, not something to overwrite. The canonical URL never moves.
 *
 * Run: node scripts/test-gallery-edit-ui.mjs
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse, compileScript, compileTemplate } from '@vue/compiler-sfc'
import { reactive } from 'vue'
import {
  FANEQO_SHOW_MAX_IMAGES,
  createFaneqoMediaUploadQueue,
  normalizeFaneqoMediaList,
} from '../utils/media/faneqoMedia.js'
import { manageEditPath } from '../utils/galleries/archiveShelves.js'
import {
  galleryEditDirty,
  galleryEditSaveBlock,
  galleryEditSnapshot,
  hasGalleryVersion,
  resolveGalleryCover,
} from '../utils/galleries/galleryEditState.js'

const root = dirname(fileURLToPath(import.meta.url))
const read = (rel) => readFileSync(resolve(root, '..', rel), 'utf8')

const EDIT_PAGE = 'pages/galleries/[id]/edit.vue'
let passed = 0
function test(name, fn) {
  fn()
  passed += 1
  console.log(`  ok  ${name}`)
}
async function testAsync(name, fn) {
  await fn()
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
    const template = compileTemplate({ source: descriptor.template.content, filename: rel, id: rel })
    assert.deepEqual(template.errors, [], `${rel} template compile errors`)
  }
}

/** The management payload shape from `GET /api/artist-updates/:id/manage`. */
function managePayload({ visibility = 'public', count = 3 } = {}) {
  return {
    id: 4100,
    slug: 'nashville-oct-18',
    title: 'Nashville — Oct 18',
    caption: 'The room, right after.',
    visibility,
    status: 'published',
    kind: 'show',
    showRecapId: 41,
    eventId: 9,
    coverMediaId: 2,
    version: 7,
    media: Array.from({ length: count }, (_, i) => ({
      mediaId: i + 1,
      order: i,
      caption: i === 0 ? 'Opening chord' : '',
      protected: visibility !== 'public',
      thumbUrl: `/api/media/${i + 1}/thumb`,
      url: `/api/media/${i + 1}`,
      width: 1600,
      height: 1067,
    })),
  }
}

test('the archive offers an Edit entry point keyed by gallery id', () => {
  assert.equal(manageEditPath({ id: 4100 }), '/galleries/4100/edit')
  assert.equal(manageEditPath({}), null)
  const item = read('components/galleries/FaneqoGalleryArchiveItem.vue')
  assert.match(item, /manageEditPath/)
  assert.match(item, />\s*Edit gallery\s*</)
  assert.match(item, /`Edit \$\{stackTitle\}`/)
  assert.match(item, /role="menuitem"/)
})

test('the edit route is auth-guarded and reads the management payload only', () => {
  const page = read(EDIT_PAGE)
  const newPage = read('pages/galleries/new.vue')
  assert.match(newPage, /definePageMeta\(\{ middleware: 'auth' \}\)/)
  assert.match(page, /definePageMeta\(\{ middleware: 'auth' \}\)/)
  assert.match(page, /getManageGallery\(galleryId\.value\)/)
  /* Never the public payload, and never a second normalization model. */
  assert.doesNotMatch(page, /usePublicNight|getBySlug|normalizeGalleryModel/)
  assert.doesNotMatch(page, /public\/bands/)
  const composable = read('composables/useGalleryDrafts.js')
  assert.match(composable, /\/api\/artist-updates\/\$\{id\}\/manage/)
  assert.match(composable, /normalizeFaneqoMediaList/)
})

test('the manage payload loads into ordered ready items with captions and cover', () => {
  const payload = managePayload()
  const media = normalizeFaneqoMediaList(payload.media)
  const queue = createFaneqoMediaUploadQueue({
    maxItems: FANEQO_SHOW_MAX_IMAGES,
    stateFactory: reactive,
    uploadFn: async () => {
      throw new Error('existing media must never re-upload')
    },
  })
  queue.adopt([...media].sort((a, b) => Number(a.order) - Number(b.order)))
  assert.equal(queue.items.length, 3)
  assert.equal(queue.readyCount, 3)
  assert.equal(queue.busy, false)
  assert.deepEqual(queue.items.map((row) => row.mediaId), [1, 2, 3])
  assert.equal(queue.items.every((row) => row.file === null), true)
  assert.equal(queue.items[0].thumbUrl, '/api/media/1/thumb')
  const captions = {}
  for (const item of payload.media) {
    if (item.caption) captions[String(item.mediaId)] = item.caption
  }
  assert.deepEqual(captions, { 1: 'Opening chord' })
  assert.equal(payload.coverMediaId, 2)
})

test('a version conflict shows a reload state instead of overwriting', () => {
  const page = read(EDIT_PAGE)
  assert.match(page, /version: version\.value/)
  assert.match(page, /isVersionConflict\(err\)/)
  assert.match(page, /conflict\.value = true/)
  assert.match(page, /This gallery changed somewhere else/)
  assert.match(page, />Reload gallery</)
  /* Bailing out before any write is what makes this safe. */
  assert.match(page, /conflict\.value = true\s*\r?\n\s*return/)
  const composable = read('composables/useGalleryDrafts.js')
  assert.match(composable, /status === 409 \|\| name === 'version_conflict'/)
})

test('add, remove, reorder and cover removal all work on mediaId identity', () => {
  const page = read(EDIT_PAGE)
  assert.match(page, /@move="onMove"/)
  assert.match(page, /@cover="onMakeCover"/)
  assert.match(page, /@caption="onCaption"/)
  assert.match(page, /@remove="askRemove"/)
  assert.match(page, /queue\.items\.filter\(\(row\) => row\.mediaId != null\)\.map\(\(row\) => row\.mediaId\)/)
  assert.match(page, /const mediaOrder = currentMediaOrder\.value/)
  assert.match(page, /ownedCaptionMap\(mediaCaptions, mediaOrder\)/)
  assert.match(page, /=== String\(mediaId\)\) coverMediaId\.value = null/)
  /* New photos join through an edit-mode draft session created with updateId. */
  assert.match(page, /updateId: galleryId\.value/)
  assert.match(page, /uploadDraftMedia\(sessionId\.value, file, \{ signal \}\)/)
  assert.match(page, /discardDraft\(sessionId\.value\)/)

  const media = normalizeFaneqoMediaList(managePayload().media)
  const queue = createFaneqoMediaUploadQueue({
    maxItems: FANEQO_SHOW_MAX_IMAGES,
    stateFactory: reactive,
    uploadFn: async () => ({ mediaId: 99 }),
  })
  queue.adopt(media)
  assert.equal(queue.move(queue.items[2].localId, -2), true)
  assert.deepEqual(queue.items.map((row) => row.mediaId), [3, 1, 2])
  queue.remove(queue.items[0].localId)
  assert.deepEqual(queue.items.map((row) => row.mediaId), [1, 2])
})

test('the 60-photo ceiling holds when adding to an existing gallery', () => {
  const page = read(EDIT_PAGE)
  assert.match(page, /const maxPhotos = FANEQO_SHOW_MAX_IMAGES/)
  assert.match(page, /FANEQO_SHOW_TOO_MANY_COPY/)
  assert.match(page, /incoming\.length \+ queue\.items\.length > maxPhotos/)

  const media = normalizeFaneqoMediaList(managePayload({ count: 58 }).media)
  const queue = createFaneqoMediaUploadQueue({
    maxItems: FANEQO_SHOW_MAX_IMAGES,
    stateFactory: reactive,
    uploadFn: async () => ({ mediaId: 999 }),
  })
  queue.adopt(media)
  assert.equal(queue.remaining, 2)
  queue.addFiles(Array.from({ length: 5 }, () => ({ type: 'image/jpeg', size: 512 })))
  assert.equal(queue.items.length, 60)
  assert.equal(queue.canAdd, false)
})

test('an unsafe public→private transition is refused with honest copy', () => {
  const page = read(EDIT_PAGE)
  assert.match(page, /unsafe_visibility_transition/)
  assert.match(page, /have to be re-uploaded before this gallery can become private/)
  assert.match(page, /gated_delivery_unavailable/)
  /* Errors carry an icon, never colour alone. */
  assert.match(page, /gedit__error-mark/)
  assert.match(page, /role="alert"/)
})

test('the canonical URL and slug are preserved, never rewritten', () => {
  const page = read(EDIT_PAGE)
  assert.match(page, /Its link never changes/)
  assert.match(page, /\/gallery\/\{\{ gallery\.slug \}\}/)
  assert.match(page, /\/\$\{band\}\/gallery\/\$\{slug\}/)
  /* The edit form has no slug field at all. */
  assert.doesNotMatch(page, /v-model="slug"/)
  const composable = read('composables/useGalleryDrafts.js')
  const saveBody = composable.slice(composable.indexOf('function saveManageGallery'))
  assert.doesNotMatch(saveBody.slice(0, 900), /slug/)
})

test('editing is accessible and mobile-safe', () => {
  const page = read(EDIT_PAGE)
  assert.match(page, /for="gedit-title"/)
  assert.match(page, /id="gedit-title"/)
  assert.match(page, /for="gedit-caption"/)
  assert.match(page, /id="gedit-caption"/)
  assert.match(page, /<legend class="gedit__label">Who can see these photos\?<\/legend>/)
  assert.equal((page.match(/aria-live="polite"/g) || []).length, 1)
  assert.match(page, /min-height: 44px/)
  assert.match(page, /env\(safe-area-inset-bottom/)
  assert.match(page, /focusAfterRemoval/)
  assert.match(page, /FaneqoGalleryConfirm/)
})

test('the confirmation dialog traps focus, locks scroll and restores focus', () => {
  const confirm = read('components/galleries/FaneqoGalleryConfirm.vue')
  assert.match(confirm, /lockOverlayScroll\(lockId\)/)
  assert.match(confirm, /unlockOverlayScroll\(lockId\)/)
  assert.match(confirm, /restoreFocusTo/)
  assert.match(confirm, /evt\.key !== 'Tab'/)
  assert.match(confirm, /aria-modal="true"/)
  /* Escape and backdrop are both refused while irreversible work runs. */
  assert.match(confirm, /if \(props\.busy\) return/)
})

/* ------------------------------------------------------------------ *
 * Regression: an untouched gallery is version 0, and Save must work there.
 * ------------------------------------------------------------------ */

test('version 0 is a real version — Save is never blocked on an untouched gallery', () => {
  assert.equal(hasGalleryVersion(0), true)
  assert.equal(hasGalleryVersion('0'), true)
  assert.equal(hasGalleryVersion(7), true)
  assert.equal(hasGalleryVersion(null), false)
  assert.equal(hasGalleryVersion(undefined), false)
  assert.equal(hasGalleryVersion(''), false)
  assert.equal(hasGalleryVersion(-1), false)
  assert.equal(hasGalleryVersion('abc'), false)
  const page = read(EDIT_PAGE)
  /* The bug: `!!version.value` read 0 as "no version" and disabled Save forever. */
  assert.doesNotMatch(page, /!!version\.value/)
  assert.match(page, /hasVersion: hasGalleryVersion\(version\.value\)/)
  /* The server still receives the exact version it handed out, 0 included. */
  assert.match(page, /version: version\.value/)
  const composable = read('composables/useGalleryDrafts.js')
  assert.match(composable, /version: row\.version \?\? null/)
})

test('a freshly adopted gallery is clean; every meaningful edit makes it dirty', () => {
  const payload = managePayload()
  const base = () => galleryEditSnapshot({
    title: payload.title,
    caption: payload.caption,
    visibility: payload.visibility,
    coverMediaId: payload.coverMediaId,
    mediaOrder: payload.media.map((m) => m.mediaId),
    mediaCaptions: { 1: 'Opening chord' },
  })
  const form = (patch = {}) => galleryEditSnapshot({
    title: payload.title,
    caption: payload.caption,
    visibility: payload.visibility,
    coverMediaId: payload.coverMediaId,
    mediaOrder: [1, 2, 3],
    mediaCaptions: { 1: 'Opening chord' },
    ...patch,
  })
  assert.equal(galleryEditDirty(base(), form()), false, 'unchanged form is dirty')
  /* Whitespace is not a change; the server trims too. */
  assert.equal(galleryEditDirty(base(), form({ title: `  ${payload.title}  `, caption: `${payload.caption}\n` })), false)
  assert.equal(galleryEditDirty(base(), form({ mediaOrder: [1, 2, 3, 99] })), true, 'adding a photo')
  assert.equal(galleryEditDirty(base(), form({ mediaOrder: [1, 2, 3, 98, 99] })), true, 'adding several')
  assert.equal(galleryEditDirty(base(), form({ mediaOrder: [1, 3] })), true, 'removing a photo')
  assert.equal(galleryEditDirty(base(), form({ mediaOrder: [3, 1, 2] })), true, 'reordering')
  assert.equal(galleryEditDirty(base(), form({ coverMediaId: 3 })), true, 'changing the cover')
  assert.equal(galleryEditDirty(base(), form({ title: 'Nashville — Oct 19' })), true, 'title')
  assert.equal(galleryEditDirty(base(), form({ caption: 'Later.' })), true, 'caption')
  assert.equal(galleryEditDirty(base(), form({ visibility: 'fan_list' })), true, 'audience')
  assert.equal(galleryEditDirty(base(), form({ mediaCaptions: { 1: 'Opening chord', 2: 'Encore' } })), true, 'photo caption')
  assert.equal(galleryEditDirty(base(), form({ mediaCaptions: { 1: '' } })), true, 'clearing a photo caption')
  /* A caption left behind by a removed photo is not a change by itself. */
  assert.equal(galleryEditDirty(base(), form({ mediaCaptions: { 1: 'Opening chord', 77: 'ghost' } })), false)
  /* Combined text + photo edits are one dirty state, saved together. */
  assert.equal(galleryEditDirty(base(), form({ title: 'New', mediaOrder: [1, 2, 3, 99] })), true)
})

test('the cover resolves like the server: missing or removed falls back to the first photo', () => {
  assert.equal(resolveGalleryCover(2, [1, 2, 3]), 2)
  assert.equal(resolveGalleryCover(null, [1, 2, 3]), 1)
  assert.equal(resolveGalleryCover(9, [1, 2, 3]), 1)
  assert.equal(resolveGalleryCover(2, []), null)
  const base = galleryEditSnapshot({ coverMediaId: 1, mediaOrder: [1, 2] })
  /* Explicitly choosing the photo that is already the implicit cover is no change. */
  assert.equal(galleryEditDirty(base, galleryEditSnapshot({ coverMediaId: null, mediaOrder: [1, 2] })), false)
})

test('Save is blocked, with a reason, while uploads run or a photo failed', () => {
  const ok = { saving: false, uploadingCount: 0, failedCount: 0, photoCount: 3, hasVersion: true }
  assert.equal(galleryEditSaveBlock(ok), '')
  assert.match(galleryEditSaveBlock({ ...ok, uploadingCount: 1 }), /finish uploading/)
  assert.match(galleryEditSaveBlock({ ...ok, uploadingCount: 3 }), /3 photos to finish uploading/)
  assert.match(galleryEditSaveBlock({ ...ok, failedCount: 1 }), /Retry or remove the failed photo/)
  assert.match(galleryEditSaveBlock({ ...ok, photoCount: 0 }), /at least one photo/)
  assert.match(galleryEditSaveBlock({ ...ok, hasVersion: false }), /Reload/)
  /* While saving, the button already says so; no second message. */
  assert.equal(galleryEditSaveBlock({ ...ok, saving: true, uploadingCount: 1 }), '')
  const page = read(EDIT_PAGE)
  assert.match(page, /const canSave = computed\(\(\) => !saving\.value && !saveBlock\.value && dirty\.value\)/)
  assert.match(page, /id="gedit-save-block"/)
  assert.match(page, /:aria-describedby="saveBlock \? 'gedit-save-block' : undefined"/)
  /* The baseline is re-taken from the server's answer, so a save ends clean. */
  assert.match(page, /baseline\.value = galleryEditSnapshot\(/)
  assert.match(page, /adopt\(result\.data\)/)
})

await testAsync('a newly uploaded photo becomes dirty state as soon as it lands', async () => {
  const media = normalizeFaneqoMediaList(managePayload().media)
  const queue = createFaneqoMediaUploadQueue({
    maxItems: FANEQO_SHOW_MAX_IMAGES,
    stateFactory: reactive,
    uploadFn: async () => ({ mediaId: 99, url: '/api/media/99', width: 1600, height: 1067 }),
  })
  queue.adopt(media)
  const order = () => queue.items.filter((row) => row.mediaId != null).map((row) => row.mediaId)
  const base = galleryEditSnapshot({ mediaOrder: order(), coverMediaId: 2 })
  queue.addFiles([{ type: 'image/jpeg', size: 512, name: 'new.jpg' }])
  /* In flight: no mediaId yet, so the order is unchanged and the queue is busy. */
  assert.equal(queue.busy, true)
  assert.equal(galleryEditDirty(base, galleryEditSnapshot({ mediaOrder: order(), coverMediaId: 2 })), false)
  assert.notEqual(galleryEditSaveBlock({ uploadingCount: 1, failedCount: 0, photoCount: 3, hasVersion: true }), '')
  await new Promise((resolve) => setTimeout(resolve, 0))
  await new Promise((resolve) => setTimeout(resolve, 0))
  assert.equal(queue.busy, false)
  assert.deepEqual(order(), [1, 2, 3, 99])
  assert.equal(galleryEditDirty(base, galleryEditSnapshot({ mediaOrder: order(), coverMediaId: 2 })), true)
})

test('edit route and reused sub-components compile', () => {
  compileSfc(EDIT_PAGE)
  compileSfc('components/media/FaneqoMediaPreview.vue')
  compileSfc('components/media/FaneqoMediaPicker.vue')
  compileSfc('components/galleries/FaneqoGalleryConfirm.vue')
  compileSfc('components/galleries/FaneqoGalleryArchiveItem.vue')
})

console.log(`test-gallery-edit-ui: ${passed} ok`)
