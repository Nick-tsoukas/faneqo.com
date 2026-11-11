/**
 * Gallery draft composer contracts.
 *
 * Audience is decided before a byte moves, the decision locks on the first
 * upload, and changing it clears what was staged under the old one. 60 photos
 * is the ceiling everywhere, and publish is idempotent.
 *
 * Run: node scripts/test-gallery-draft-composer.mjs
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse, compileScript, compileTemplate } from '@vue/compiler-sfc'
import { reactive } from 'vue'
import {
  FANEQO_IMAGE_MAX_BYTES,
  FANEQO_PHOTO_CAPTION_MAX,
  FANEQO_SHOW_MAX_IMAGES,
  FANEQO_SHOW_TOO_MANY_COPY,
  FANEQO_UPDATE_MAX_IMAGES,
  FANEQO_UPLOAD_CONCURRENCY,
  createFaneqoMediaUploadQueue,
} from '../utils/media/faneqoMedia.js'
import { ownedCaptionMap } from '../utils/galleries/galleryCaptions.js'
import { deriveShowPhotosTitle } from '../utils/shows/formatShowNightDate.js'

const root = dirname(fileURLToPath(import.meta.url))
const read = (rel) => readFileSync(resolve(root, '..', rel), 'utf8')

let passed = 0
const queued = []
function test(name, fn) {
  queued.push([name, fn])
}

function jpeg(size = 1024) {
  return { type: 'image/jpeg', size, name: `${size}.jpg` }
}

function wait(ms = 0) {
  return new Promise((done) => setTimeout(done, ms))
}

async function flush() {
  await wait(0)
  await wait(0)
}

async function settle(queue, budget = 1500) {
  const started = Date.now()
  while (Date.now() - started < budget && queue.busy) await wait(5)
  await flush()
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

/**
 * Stand-in for the draft session. Classification is a property of the session
 * audience, exactly as the server derives it — the caller never sends it.
 */
function draftSession({ visibility = 'public' } = {}) {
  const session = {
    visibility,
    audienceLocked: false,
    uploads: [],
    removed: [],
    publishes: [],
    cleared: 0,
    nextId: 1,
  }
  session.upload = async (file, { signal } = {}) => {
    if (signal?.aborted) {
      const err = new Error('aborted')
      err.name = 'AbortError'
      throw err
    }
    session.audienceLocked = true
    const mediaId = session.nextId
    session.nextId += 1
    session.uploads.push({ mediaId, visibility: session.visibility, size: file.size })
    return {
      mediaId,
      thumbUrl: `/api/gallery-drafts/s1/media/${mediaId}/thumb`,
      protected: session.visibility !== 'public',
      width: 1600,
      height: 1067,
    }
  }
  session.setAudience = ({ visibility: next, confirmClear = false }) => {
    if (session.uploads.length && !confirmClear) {
      const err = new Error('Staged media must be cleared')
      err.code = 'audience_clear_required'
      throw err
    }
    if (confirmClear && session.uploads.length) {
      session.cleared += session.uploads.length
      session.uploads = []
      session.audienceLocked = false
    }
    session.visibility = next
    return { visibility: next, audienceLocked: session.audienceLocked }
  }
  session.publish = async (key) => {
    const existing = session.publishes.find((row) => row.key === key)
    if (existing) return existing
    const row = { key, id: 4100, slug: 'nashville-oct-18', band: { slug: 'the-band' } }
    session.publishes.push(row)
    return row
  }
  return session
}

/* ---- limits -------------------------------------------------------------- */

test('60 is the ceiling for every gallery kind and 8 MB stays the file cap', () => {
  assert.equal(FANEQO_SHOW_MAX_IMAGES, 60)
  assert.equal(FANEQO_UPDATE_MAX_IMAGES, 60)
  assert.equal(FANEQO_IMAGE_MAX_BYTES, 8 * 1024 * 1024)
  assert.equal(FANEQO_SHOW_TOO_MANY_COPY, 'Galleries can include up to 60 photos.')
  assert.equal(FANEQO_PHOTO_CAPTION_MAX, 300)
})

test('a 61st file is refused and never reaches the draft session', async () => {
  const session = draftSession()
  const queue = createFaneqoMediaUploadQueue({
    maxItems: FANEQO_SHOW_MAX_IMAGES,
    stateFactory: reactive,
    uploadFn: session.upload,
  })
  queue.addFiles(Array.from({ length: 61 }, (_, i) => jpeg(i + 1)))
  await settle(queue, 3000)
  assert.equal(queue.items.length, 60)
  assert.equal(session.uploads.length, 60)
  assert.equal(queue.canAdd, false)
})

/* ---- audience before upload --------------------------------------------- */

test('Everyone is the default and photos can start immediately', () => {
  const composer = read('components/updates/ArtistUpdateComposer.vue')
  /* Audience markup precedes the picker in the template, not just in prose. */
  const audienceAt = composer.indexOf('Who can see these')
  const pickerAt = composer.indexOf('<FaneqoMediaPicker')
  const titleAt = composer.indexOf('id="auc-title"')
  const captionAt = composer.indexOf('id="auc-caption"')
  assert.ok(audienceAt > 0 && pickerAt > audienceAt, 'audience comes before the picker')
  assert.ok(titleAt > audienceAt && titleAt < pickerAt, 'title sits between audience and photos')
  assert.ok(captionAt > titleAt && captionAt < pickerAt, 'caption sits between title and photos')
  /* The default lives in real state, not just a checked-looking radio. */
  assert.match(composer, /const visibility = ref\('public'\)/)
  assert.match(composer, /const audienceConfirmed = ref\(true\)/)
  assert.match(composer, /const appliedVisibility = ref\('public'\)/)
  assert.match(composer, /canAddPhotos = computed\(\(\) =>[\s\S]*audienceConfirmed\.value/)
  /* No mandatory pre-upload question survives. */
  assert.doesNotMatch(composer, /Confirm the audience above to start adding photos/)
  assert.doesNotMatch(composer, /Continue with \$\{audienceShortLabel\}/)
})

test('audience is a quiet summary with a Change affordance', () => {
  const composer = read('components/updates/ArtistUpdateComposer.vue')
  assert.match(composer, /auc__audience-value/)
  assert.match(composer, /@click="openAudienceChange"/)
  /* Collapsed by default so it never dominates the page. */
  assert.match(composer, /const audienceExpanded = ref\(false\)/)
  assert.match(composer, /v-if="!audienceExpanded"/)
})

test('clearing is demanded only when the storage class actually changes', () => {
  const composer = read('components/updates/ArtistUpdateComposer.vue')
  assert.match(composer, /storageClassOf = \(value\) => \(value === 'public' \? 'public' : 'protected'\)/)
  assert.match(composer, /audienceChangeNeedsClear = computed/)
  assert.match(composer, /storageClassOf\(visibility\.value\) !== storageClassOf\(appliedVisibility\.value\)/)
  /* The confirm dialog is only opened on a real storage-class crossing. */
  assert.match(composer, /if \(audienceChangeNeedsClear\.value\) \{\s*audienceChangeOpen\.value = true/)
  assert.match(composer, /confirmClear: true/)
})

test('title is offered for general galleries too and falls back server-side', () => {
  const composer = read('components/updates/ArtistUpdateComposer.vue')
  /* One unconditional title field: no `v-if="showPhotosMode"` gate on it. */
  assert.match(composer, /<label class="auc__label" for="auc-title">Title<\/label>/)
  assert.doesNotMatch(composer, /v-if="showPhotosMode"\s+id="auc-title"/)
  assert.match(composer, /maxlength="120"/)
  assert.match(composer, /maxlength="1200"/)
  /* Blank title is simply not sent; the server names the gallery. */
  assert.match(composer, /title: String\(title\.value \|\| ''\)\.trim\(\)/)
  assert.equal(deriveShowPhotosTitle({ city: 'Nashville', date: '2024-10-18' }), 'Nashville — Oct 18')
  assert.equal(deriveShowPhotosTitle({}), null)
})

test('classification follows the session audience, never a client flag', async () => {
  const session = draftSession({ visibility: 'show_attendees' })
  const queue = createFaneqoMediaUploadQueue({ maxItems: 60, stateFactory: reactive, uploadFn: session.upload })
  queue.addFiles([jpeg(), jpeg()])
  await settle(queue)
  assert.deepEqual(session.uploads.map((row) => row.visibility), ['show_attendees', 'show_attendees'])
  assert.equal(queue.items.every((row) => row.protected === true), true)
  const composer = read('components/updates/ArtistUpdateComposer.vue')
  assert.match(composer, /uploadFn: \(file, \{ signal \}\) => uploadDraftMedia\(sessionId\.value, file, \{ signal \}\)/)
  assert.doesNotMatch(composer, /visibility: visibility\.value[^\n]*body\.append/)
})

test('audience locks on the first upload and unlocks only by deliberate change', async () => {
  const session = draftSession()
  const queue = createFaneqoMediaUploadQueue({ maxItems: 60, stateFactory: reactive, uploadFn: session.upload })
  assert.equal(session.audienceLocked, false)
  queue.addFiles([jpeg()])
  await settle(queue)
  assert.equal(session.audienceLocked, true)
  assert.throws(() => session.setAudience({ visibility: 'fan_list' }), /Staged media/)
  const composer = read('components/updates/ArtistUpdateComposer.vue')
  /* The lock is the collapsed summary: changing takes a deliberate click, and
     crossing storage classes then takes an explicit confirmation on top. */
  assert.match(composer, /v-if="!audienceExpanded"/)
  assert.match(composer, />Change</)
  assert.match(composer, /confirmClear: true/)
  assert.match(composer, /audienceChangeNeedsClear = computed/)
  assert.match(composer, /Change and clear photos/)
  /* A locally-rejected file never locks the audience. */
  assert.match(composer, /accepted\.some\(\(row\) => row\.state === 'preparing'\)\) uploadsStarted\.value = true/)
})

test('changing the audience clears the queue and re-classifies new uploads', async () => {
  const session = draftSession()
  const queue = createFaneqoMediaUploadQueue({ maxItems: 60, stateFactory: reactive, uploadFn: session.upload })
  queue.addFiles([jpeg(1), jpeg(2)])
  await settle(queue)
  assert.equal(queue.items.length, 2)
  session.setAudience({ visibility: 'fan_list', confirmClear: true })
  queue.clear()
  assert.equal(session.cleared, 2)
  assert.equal(queue.items.length, 0)
  queue.addFiles([jpeg(3)])
  await settle(queue)
  assert.deepEqual(session.uploads.map((row) => row.visibility), ['fan_list'])
  assert.equal(queue.items[0].protected, true)
})

test('a gated choice is never silently downgraded to public', () => {
  const composer = read('components/updates/ArtistUpdateComposer.vue')
  /* No auto-flip at all any more: the radios disable and publish explains. */
  assert.doesNotMatch(composer, /visibility\.value = 'public'\s*\n\s*\} catch/)
  assert.doesNotMatch(composer, /!audienceConfirmed\.value\) visibility\.value = 'public'/)
  assert.match(composer, /gated_delivery_unavailable/)
  assert.match(composer, /Private delivery isn’t available right now/)
  assert.match(composer, /:disabled="!canChooseGated"/)
})

/* ---- upload progress ----------------------------------------------------- */

test('progress is honest item counts in one polite live region', () => {
  const composer = read('components/updates/ArtistUpdateComposer.vue')
  assert.match(composer, /of \$\{maxPhotos\} selected/)
  assert.match(composer, /\$\{queue\.readyCount\} uploaded/)
  assert.match(composer, /\$\{queue\.uploadingCount\} uploading/)
  assert.match(composer, /\$\{queue\.failedCount\} failed/)
  assert.match(composer, /Retry \{\{ queue\.failedCount \}\} failed/)
  assert.match(composer, /Cancel remaining uploads/)
  assert.match(composer, /Discard gallery/)
  assert.match(composer, /Add more photos/)
  assert.equal((composer.match(/aria-live="polite"/g) || []).length, 1)
  /* No invented byte percentages: no <progress>, no /100 arithmetic. */
  assert.doesNotMatch(composer, /<progress/)
  assert.doesNotMatch(composer, /\* 100\)/)
  assert.doesNotMatch(composer, /loaded \/ total|bytesUploaded/)
})

test('failed items retry individually without touching successes', async () => {
  let n = 0
  const queue = createFaneqoMediaUploadQueue({
    maxItems: 60,
    concurrency: 1,
    stateFactory: reactive,
    uploadFn: async (file) => {
      n += 1
      if (n === 2) throw new Error('flaky network')
      return { mediaId: file.size }
    },
  })
  queue.addFiles([jpeg(1), jpeg(2), jpeg(3)])
  await settle(queue)
  assert.equal(queue.failedCount, 1)
  assert.equal(queue.readyCount, 2)
  assert.equal(queue.retryFailed(), 1)
  await settle(queue)
  assert.equal(queue.readyCount, 3)
  assert.deepEqual(queue.readyAttachments().map((row) => row.mediaId), [1, 2, 3])
})

test('cancel remaining keeps landed photos and abandons the rest', async () => {
  const hold = []
  const queue = createFaneqoMediaUploadQueue({
    maxItems: 60,
    concurrency: 1,
    stateFactory: reactive,
    uploadFn: (file, { signal }) => new Promise((done, fail) => {
      if (file.size === 1) {
        done({ mediaId: 1 })
        return
      }
      hold.push(done)
      signal?.addEventListener('abort', () => {
        const err = new Error('aborted')
        err.name = 'AbortError'
        fail(err)
      }, { once: true })
    }),
  })
  queue.addFiles([jpeg(1), jpeg(2), jpeg(3)])
  const started = Date.now()
  while (Date.now() - started < 800 && queue.readyCount < 1) await wait(5)
  assert.equal(queue.cancelPending(), 2)
  hold.forEach((done) => done({ mediaId: 77 }))
  await flush()
  assert.deepEqual(queue.readyAttachments().map((row) => row.mediaId), [1])
})

test('a late completion after removal cannot resurrect the item', async () => {
  let finish
  const queue = createFaneqoMediaUploadQueue({
    maxItems: 60,
    stateFactory: reactive,
    uploadFn: () => new Promise((done) => {
      finish = done
    }),
  })
  queue.addFiles([jpeg()])
  await flush()
  const localId = queue.items[0].localId
  queue.remove(localId)
  finish({ mediaId: 55, thumbUrl: '/api/t/55' })
  await flush()
  await wait(20)
  assert.equal(queue.items.length, 0)
  assert.equal(queue.readyAttachments().length, 0)
})

test('reordering during upload uses mediaId identity and never re-uploads', async () => {
  let calls = 0
  const gate = []
  const queue = createFaneqoMediaUploadQueue({
    maxItems: 60,
    concurrency: 3,
    stateFactory: reactive,
    uploadFn: (file) => new Promise((done) => {
      calls += 1
      gate.push(() => done({ mediaId: file.size, thumbUrl: `/api/t/${file.size}` }))
    }),
  })
  queue.addFiles([jpeg(1), jpeg(2), jpeg(3)])
  await flush()
  assert.equal(queue.move(queue.items[2].localId, -2), true)
  gate.forEach((release) => release())
  await settle(queue)
  assert.equal(calls, 3)
  assert.deepEqual(queue.readyAttachments().map((row) => row.mediaId), [3, 1, 2])
})

/* ---- cover, captions ----------------------------------------------------- */

test('the first ordered photo is the default cover and Make cover overrides it', () => {
  const preview = read('components/media/FaneqoMediaPreview.vue')
  assert.match(preview, /function isCover\(item, index\)/)
  assert.match(preview, /return index === 0/)
  assert.match(preview, /Make photo \$\{index \+ 1\} the cover/)
  assert.match(preview, /fq-media-prev__frame\.is-cover/)
  const composer = read('components/updates/ArtistUpdateComposer.vue')
  assert.match(composer, /:cover-media-id="coverMediaId"/)
  assert.match(composer, /@cover="onMakeCover"/)
  assert.match(composer, /function onMakeCover\(\{ mediaId \}\)/)
  /* Removing the cover falls back to the first photo rather than a blank. */
  assert.match(composer, /=== String\(mediaId\)\) coverMediaId\.value = null/)
})

test('per-photo captions are keyed by mediaId and bounded at 300', () => {
  const preview = read('components/media/FaneqoMediaPreview.vue')
  assert.match(preview, /:maxlength="captionMax"/)
  assert.match(preview, /captionMax: \{ type: Number, default: FANEQO_PHOTO_CAPTION_MAX \}/)
  assert.match(preview, /Caption for photo \$\{index \+ 1\}/)
  assert.match(preview, /mediaId: item\.mediaId, caption: \$event\.target\.value/)
  const composer = read('components/updates/ArtistUpdateComposer.vue')
  assert.match(composer, /slice\(0, FANEQO_PHOTO_CAPTION_MAX\)/)
  assert.match(composer, /mediaCaptions\[String\(mediaId\)\]/)
  assert.match(composer, /ownedCaptionMap\(mediaCaptions, mediaOrder\)/)
  assert.deepEqual(
    ownedCaptionMap({ 10: 'Keep', 99: 'Stale', notAnId: 'Nope' }, [10]),
    { 10: 'Keep' },
  )
})

test('the management grid renders derivatives only, never originals', () => {
  const preview = read('components/media/FaneqoMediaPreview.vue')
  assert.match(preview, /function thumbSrc\(item\)/)
  assert.match(preview, /item\?\.thumbUrl \|\| item\?\.thumbnailUrl \|\| item\?\.previewUrl/)
  assert.match(preview, /loading="lazy"/)
  assert.match(preview, /decoding="async"/)
  assert.doesNotMatch(preview, /originalUrl/)
  assert.doesNotMatch(preview, /fullSrc|largeUrl/)
  /* No hidden full-resolution viewer is mounted behind the grid. */
  assert.doesNotMatch(preview, /FaneqoMediaLightbox|GalleryViewer/)
})

/* ---- persistence, recovery, publish -------------------------------------- */

test('draft autosave is debounced and only ever stores a session pointer', () => {
  const composer = read('components/updates/ArtistUpdateComposer.vue')
  assert.match(composer, /function scheduleSave\(\)/)
  assert.match(composer, /setTimeout\([\s\S]{0,120}800\)/)
  assert.match(composer, /patchDraft\(sessionId\.value, savePayload\(\)\)/)
  assert.match(composer, /const mediaOrder = orderedMediaIds\(\)/)
  assert.match(composer, /ownedCaptionMap\(mediaCaptions, mediaOrder\)/)
  assert.match(composer, /coverMediaId: coverMediaId\.value/)
  /* Client storage holds the pointer, never bytes and never the whole draft. */
  assert.match(composer, /sessionStorage\.setItem\(pointerKey\(\), String\(id\)\)/)
  assert.doesNotMatch(composer, /localStorage/)
  assert.doesNotMatch(composer, /JSON\.stringify\(\s*(queue|savePayload)/)
})

test('an unfinished draft offers Continue or Start fresh', () => {
  const composer = read('components/updates/ArtistUpdateComposer.vue')
  assert.match(composer, /getActiveDraft\(\{/)
  assert.match(composer, />\s*Continue draft\s*</)
  assert.match(composer, />\s*Start fresh\s*</)
  assert.match(composer, /function draftHasWork\(row\)/)
  assert.match(composer, /discardDraft\(stale\)/)
  assert.match(composer, /onBeforeRouteLeave/)
  assert.match(composer, /beforeunload/)
})

test('publish is idempotent, so a double-click cannot mint a second gallery', async () => {
  const session = draftSession()
  const key = 'idem-key-1'
  const first = await session.publish(key)
  const second = await session.publish(key)
  assert.equal(session.publishes.length, 1)
  assert.equal(first.id, second.id)
  const third = await session.publish('idem-key-2')
  assert.equal(session.publishes.length, 2)
  assert.notEqual(third.key, first.key)

  const composer = read('components/updates/ArtistUpdateComposer.vue')
  assert.match(composer, /const saved = await saveNow\(\)/)
  assert.match(composer, /if \(!saved\) return/)
  assert.match(composer, /publishDraft\(sessionId\.value, \{\s*publishIdempotencyKey: publishIdempotencyKey\.value,\s*showOnArtistPage: artistPageState\.value\.shouldFeature,\s*\}\)/)
  /* The guard flips before the first await; a second click sees canPublish false. */
  assert.match(composer, /if \(!canPublish\.value\) return[\s\S]{0,140}?publishing\.value = true/)
  assert.match(composer, /publishedLock\.value = true/)
  assert.match(composer, /canPublish = computed\(\(\) =>\s*!publishing\.value\s*&& !publishedLock\.value/)
})

test('the canonical handoff uses the slugs the publish response returned', () => {
  const page = read('pages/galleries/new.vue')
  assert.match(page, /row\?\.band\?\.slug \|\| row\?\.bandSlug/)
  assert.match(page, /\/\$\{bandSlug\.value\}\/gallery\/\$\{published\.value\.slug\}/)
  /* The publish reveal owns the "View gallery" link; the page hands it the canonical path. */
  assert.match(page, /<GalleryPublishReveal[\s\S]*?:gallery-path="galleryPath \|\| ''"/)
  const reveal = read('components/galleries/GalleryPublishReveal.vue')
  assert.match(reveal, /:to="galleryPath"[^>]*>\s*View gallery/)
  /* The message-composer return still attaches the new gallery exactly once. */
  assert.match(page, /buildGalleryComposerReturn/)
  assert.equal((page.match(/returningToComposer\.value = true/g) || []).length, 1)
})

test('audience, gating and draft wiring compile', () => {
  compileSfc('components/updates/ArtistUpdateComposer.vue')
  compileSfc('components/media/FaneqoMediaPreview.vue')
  compileSfc('components/galleries/FaneqoGalleryConfirm.vue')
  compileSfc('pages/galleries/new.vue')
  const composable = read('composables/useGalleryDrafts.js')
  for (const fn of [
    'createDraft',
    'getActiveDraft',
    'getDraft',
    'patchDraft',
    'setAudience',
    'uploadDraftMedia',
    'removeDraftMedia',
    'publishDraft',
    'discardDraft',
    'getManageGallery',
    'saveManageGallery',
  ]) {
    assert.match(composable, new RegExp(`function ${fn}\\(`), `useGalleryDrafts exports ${fn}`)
  }
  assert.match(composable, /Authorization: `Bearer \$\{token\.value\}`/)
  assert.match(composable, /\/api\/gallery-drafts/)
  assert.match(composable, /\/api\/artist-updates\/\$\{id\}\/manage/)
  assert.equal(FANEQO_UPLOAD_CONCURRENCY, 3)
})

;(async () => {
  for (const [name, fn] of queued) {
    await fn()
    passed += 1
    console.log(`  ok  ${name}`)
  }
  console.log(`test-gallery-draft-composer: ${passed} ok`)
})().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
