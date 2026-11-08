<template>
  <main class="gedit">
    <div v-if="loading" class="gedit__state" role="status">Opening gallery…</div>

    <div v-else-if="loadError" class="gedit__state" role="alert">
      <h1>We couldn’t open that gallery</h1>
      <p>{{ loadError }}</p>
      <NuxtLink to="/galleries">Back to galleries</NuxtLink>
    </div>

    <!-- A stale version is a real fork. Never paper over it with a save. -->
    <div v-else-if="conflict" class="gedit__state" role="alert">
      <h1>This gallery changed somewhere else</h1>
      <p>Someone — maybe you in another tab — edited this gallery while you were working. Reload to see the current version before editing again.</p>
      <div class="gedit__conflict-actions">
        <button type="button" class="gedit__publish is-inline" @click="reload">Reload gallery</button>
        <NuxtLink to="/galleries" class="gedit__ghost">Back to galleries</NuxtLink>
      </div>
    </div>

    <section v-else class="gedit__body">
      <header class="gedit__head">
        <NuxtLink to="/galleries" class="gedit__back">Back</NuxtLink>
        <p class="gedit__kicker">Edit gallery</p>
        <h1>{{ gallery.title || 'Untitled gallery' }}</h1>
        <p class="gedit__context">{{ contextLine }}</p>
        <p class="gedit__canonical">Its link never changes: <code>/gallery/{{ gallery.slug }}</code></p>
      </header>

      <label class="gedit__label" for="gedit-title">Title</label>
      <input id="gedit-title" v-model="title" class="gedit__title" type="text" maxlength="120" placeholder="Untitled gallery" />

      <label class="gedit__label" for="gedit-caption">Caption</label>
      <textarea id="gedit-caption" v-model="caption" class="gedit__caption" rows="3" maxlength="1200" placeholder="Optional" />

      <fieldset class="gedit__who">
        <legend class="gedit__label">Who can see these photos?</legend>
        <label class="gedit__choice">
          <input v-model="visibility" type="radio" name="gedit-visibility" value="public">
          <span>Everyone<span class="gedit__sub">Anyone with the link</span></span>
        </label>
        <label class="gedit__choice">
          <input v-model="visibility" type="radio" name="gedit-visibility" value="fan_list">
          <span>Fans<span class="gedit__sub">Fans of this artist</span></span>
        </label>
        <label v-if="gallery.showRecapId" class="gedit__choice">
          <input v-model="visibility" type="radio" name="gedit-visibility" value="show_attendees">
          <span>People who were there<span class="gedit__sub">People who checked in at this show</span></span>
        </label>
      </fieldset>

      <div class="gedit__feature">
        <p class="gedit__label">Artist profile</p>
        <button
          type="button"
          class="gedit__feature-btn"
          :class="{ 'is-on': featuredOnProfile }"
          :aria-pressed="featuredOnProfile ? 'true' : 'false'"
          :disabled="featuring || !canFeature"
          @click="onFeatureToggle"
        >
          {{ featuring ? 'Saving…' : (featuredOnProfile ? 'Featured on artist profile' : 'Feature on artist profile') }}
        </button>
        <p v-if="featureReason" class="gedit__hint">{{ featureReason }}</p>
        <p v-if="featureNote" class="gedit__saved" role="status">{{ featureNote }}</p>
        <p v-if="featureError" class="gedit__error" role="alert">{{ featureError }}</p>
      </div>

      <div v-if="rocksnapsEligible" class="gedit__feature">
        <p id="gedit-rocksnaps-label" class="gedit__label">RockSnaps Publishing</p>
        <button
          type="button"
          class="gedit__feature-btn"
          :class="{ 'is-on': rocksnapsOn }"
          :aria-pressed="rocksnapsOn ? 'true' : 'false'"
          aria-describedby="gedit-rocksnaps-help"
          :disabled="rocksnapsBusy || (!rocksnapsCanToggle)"
          @click="onRocksnapsToggle"
        >
          {{ rocksnapsBusy ? 'Saving…' : (rocksnapsOn ? 'Showing on RockSnaps' : 'Show on RockSnaps') }}
        </button>
        <p id="gedit-rocksnaps-help" class="gedit__hint">When enabled, this gallery will be available to display on rocksnaps.com.</p>
        <p class="gedit__hint">{{ rocksnapsStateLine }}</p>
        <p v-if="rocksnapsReason" class="gedit__hint">{{ rocksnapsReason }}</p>
        <p v-if="rocksnapsNote" class="gedit__saved" role="status">{{ rocksnapsNote }}</p>
        <p v-if="rocksnapsError" class="gedit__error" role="alert">{{ rocksnapsError }}</p>
      </div>

      <p class="gedit__label">Photos</p>
      <FaneqoMediaPicker
        class="gedit__picker"
        multiple
        variant="labeled"
        :can-add="canAddPhotos"
        :disabled="!canAddPhotos"
        label="Add photos"
        @select="onPick"
      />
      <p class="gedit__hint">iPhone photos, JPEG, PNG, or WebP · up to {{ maxPhotos }} · 8 MB each</p>
      <p class="gedit__count" aria-live="polite">{{ uploadSummary }}</p>

      <div v-if="queue.failedCount || queue.uploadingCount" class="gedit__queue-tools">
        <button v-if="queue.failedCount" type="button" class="gedit__ghost" @click="queue.retryFailed()">
          Retry {{ queue.failedCount }} failed
        </button>
        <button v-if="queue.uploadingCount" type="button" class="gedit__ghost" @click="queue.cancelPending()">
          Cancel remaining uploads
        </button>
      </div>

      <p v-if="queue.items.length" class="gedit__hint">
        The cover is the photo fans see first. Use ★ on any photo to make it the cover.
      </p>
      <FaneqoMediaPreview
        v-if="queue.items.length"
        :items="queue.items"
        :compact="false"
        cover
        :cover-media-id="coverMediaId"
        :captions="mediaCaptions"
        @remove="askRemove"
        @retry="queue.retry"
        @move="onMove"
        @cover="onMakeCover"
        @caption="onCaption"
      />
      <p v-else class="gedit__hint">This gallery has no photos yet.</p>

      <p v-if="error" class="gedit__error" role="alert">
        <span class="gedit__error-mark" aria-hidden="true">!</span>{{ error }}
      </p>
      <p v-if="saved" class="gedit__saved" role="status">Saved.</p>

      <div class="gedit__actions">
        <button
          type="button"
          class="gedit__publish"
          :disabled="!canSave"
          :aria-describedby="saveBlock ? 'gedit-save-block' : undefined"
          @click="onSave"
        >
          {{ saving ? 'Saving…' : 'Save changes' }}
        </button>
        <NuxtLink v-if="publicPath" :to="publicPath" class="gedit__ghost">View gallery</NuxtLink>
      </div>
      <p v-if="saveBlock" id="gedit-save-block" class="gedit__hint gedit__save-block" role="status">{{ saveBlock }}</p>
    </section>

    <FaneqoGalleryConfirm
      :open="!!pendingRemoval"
      heading="Remove this photo?"
      body="It leaves this gallery when you save. Fans who saved the gallery will no longer see it."
      confirm-label="Remove photo"
      danger
      @cancel="pendingRemoval = null"
      @confirm="confirmRemove"
    />
  </main>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import FaneqoGalleryConfirm from '~/components/galleries/FaneqoGalleryConfirm.vue'
import FaneqoMediaPicker from '~/components/media/FaneqoMediaPicker.vue'
import FaneqoMediaPreview from '~/components/media/FaneqoMediaPreview.vue'
import { useGalleryDrafts, galleryDraftErrorCode, isVersionConflict, ownedCaptionMap } from '~/composables/useGalleryDrafts'
import { useMediaUploadQueue } from '~/composables/useMediaUploadQueue'
import {
  galleryEditDirty,
  galleryEditSaveBlock,
  galleryEditSnapshot,
  hasGalleryVersion,
} from '~/utils/galleries/galleryEditState'
import {
  FANEQO_PHOTO_CAPTION_MAX,
  FANEQO_SHOW_MAX_IMAGES,
  FANEQO_SHOW_TOO_MANY_COPY,
  FANEQO_UPLOAD_CONCURRENCY,
} from '~/utils/media/faneqoMedia'

definePageMeta({ middleware: 'auth' })
useHead({ title: 'Edit Gallery · Faneqo', meta: [{ name: 'robots', content: 'noindex' }] })

const route = useRoute()
const galleryId = computed(() => String(route.params.id || ''))
const {
  createDraft,
  uploadDraftMedia,
  removeDraftMedia,
  discardDraft,
  getManageGallery,
  saveManageGallery,
  featureGalleryOnProfile,
  unfeatureGalleryOnProfile,
  setRocksnapsPublication,
} = useGalleryDrafts()

const maxPhotos = FANEQO_SHOW_MAX_IMAGES
const loading = ref(true)
const loadError = ref('')
const conflict = ref(false)
const gallery = ref(null)
const rocksnaps = ref(null)
const rocksnapsBusy = ref(false)
const rocksnapsNote = ref('')
const rocksnapsError = ref('')
const version = ref(null)
/* What the server holds. Save compares the live form against this. */
const baseline = ref(null)
const title = ref('')
const caption = ref('')
const visibility = ref('public')
const coverMediaId = ref(null)
const mediaCaptions = reactive({})
const sessionId = ref('')
const saving = ref(false)
const saved = ref(false)
const error = ref('')
const featuring = ref(false)
const featureNote = ref('')
const featureError = ref('')
const pendingRemoval = ref(null)

/* New photos join through an edit-mode draft session so the server, not the
   browser, decides how they are stored for this gallery's audience. */
const queue = useMediaUploadQueue({
  maxItems: maxPhotos,
  concurrency: FANEQO_UPLOAD_CONCURRENCY,
  uploadFn: (file, { signal }) => uploadDraftMedia(sessionId.value, file, { signal }),
})

const canAddPhotos = computed(() => queue.canAdd && !saving.value)

/* Only photos that have landed count; an upload in flight has no mediaId yet. */
const currentMediaOrder = computed(() => (
  queue.items.filter((row) => row.mediaId != null).map((row) => row.mediaId)
))
const currentSnapshot = computed(() => galleryEditSnapshot({
  title: title.value,
  caption: caption.value,
  visibility: visibility.value,
  coverMediaId: coverMediaId.value,
  mediaOrder: currentMediaOrder.value,
  mediaCaptions: mediaCaptions,
}))
const dirty = computed(() => galleryEditDirty(baseline.value, currentSnapshot.value))
/*
 * Version 0 is every gallery that has never been edited, so it must count as
 * present. Only a missing version (the manage read failed to give one) blocks.
 */
const saveBlock = computed(() => galleryEditSaveBlock({
  saving: saving.value,
  uploadingCount: queue.uploadingCount,
  failedCount: queue.failedCount,
  photoCount: currentMediaOrder.value.length,
  hasVersion: hasGalleryVersion(version.value),
}))
const canSave = computed(() => !saving.value && !saveBlock.value && dirty.value)
const publicPath = computed(() => {
  const slug = gallery.value?.slug
  const band = gallery.value?.bandSlug || gallery.value?.band?.slug
  return slug && band ? `/${band}/gallery/${slug}` : null
})
const featuredOnProfile = computed(() => gallery.value?.featuredOnProfile === true)
const featureReason = computed(() => {
  const row = gallery.value
  if (!row || featuredOnProfile.value) return ''
  if (row.status === 'hidden') return 'This gallery is hidden.'
  if (row.status && row.status !== 'published') return 'Publish this gallery before featuring it.'
  if (row.visibility && row.visibility !== 'public') return 'Make this gallery public before featuring it on your artist profile.'
  if (!orderedMedia(row).length) return 'Add a photo before featuring this gallery.'
  return ''
})
const canFeature = computed(() => !featureReason.value || featuredOnProfile.value)
const rocksnapsEligible = computed(() => rocksnaps.value?.eligible === true)
const rocksnapsOn = computed(() => rocksnaps.value?.enabled === true)
const audienceDirty = computed(() => visibility.value !== (gallery.value?.visibility || 'public'))
const rocksnapsCanToggle = computed(() => {
  if (rocksnapsBusy.value) return false
  if (rocksnapsOn.value) return true
  return rocksnaps.value?.canEnable === true && !audienceDirty.value
})
const rocksnapsReason = computed(() => {
  if (!rocksnapsEligible.value || rocksnapsOn.value) return ''
  if (audienceDirty.value) return 'Save who can see these photos before showing this gallery on RockSnaps.'
  return rocksnaps.value?.reason || ''
})
const rocksnapsStateLine = computed(() => {
  if (!rocksnapsOn.value) return 'Not on RockSnaps.'
  const when = rocksnaps.value?.publishedAt
  if (!when) return 'On RockSnaps.'
  const date = new Date(when)
  if (Number.isNaN(date.getTime())) return 'On RockSnaps.'
  return `On RockSnaps since ${date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}.`
})
const contextLine = computed(() => {
  const row = gallery.value
  if (!row) return ''
  const parts = [row.kind === 'show' ? 'Show gallery' : 'Gallery', row.status]
  return parts.filter(Boolean).join(' · ')
})
const uploadSummary = computed(() => {
  const total = queue.items.length
  const parts = [`${total} of ${maxPhotos} photos`]
  if (queue.uploadingCount) parts.push(`${queue.uploadingCount} uploading`)
  if (queue.failedCount) parts.push(`${queue.failedCount} failed`)
  return parts.join(' · ')
})

function orderedMedia(row) {
  const media = Array.isArray(row?.media) ? row.media : []
  return [...media].sort((a, b) => (Number(a.order ?? 0) - Number(b.order ?? 0)))
}

function adopt(row) {
  gallery.value = row
  rocksnaps.value = row.rocksnaps || null
  version.value = row.version
  title.value = row.title || ''
  caption.value = row.caption || ''
  visibility.value = row.visibility || 'public'
  coverMediaId.value = row.coverMediaId ?? null
  for (const key of Object.keys(mediaCaptions)) delete mediaCaptions[key]
  const ordered = orderedMedia(row)
  for (const item of ordered) {
    if (item.caption) mediaCaptions[String(item.mediaId)] = item.caption
  }
  queue.clear()
  queue.adopt(ordered)
  baseline.value = galleryEditSnapshot({
    title: row.title,
    caption: row.caption,
    visibility: row.visibility,
    coverMediaId: row.coverMediaId,
    mediaOrder: ordered.map((item) => item.mediaId),
    mediaCaptions,
  })
}

async function load() {
  loading.value = true
  loadError.value = ''
  conflict.value = false
  try {
    const result = await getManageGallery(galleryId.value)
    if (!result?.data) {
      loadError.value = 'That gallery is unavailable or belongs to another artist.'
      return
    }
    adopt(result.data)
  } catch (err) {
    loadError.value = readableError(err) || 'Could not open that gallery.'
  } finally {
    loading.value = false
  }
}

async function reload() {
  conflict.value = false
  error.value = ''
  await load()
}

onMounted(load)

async function ensureSession() {
  if (sessionId.value) return sessionId.value
  const result = await createDraft({
    bandId: gallery.value?.bandId ?? undefined,
    kind: gallery.value?.kind || 'general',
    updateId: galleryId.value,
    showRecapId: gallery.value?.showRecapId || undefined,
    eventId: gallery.value?.eventId || undefined,
  })
  const row = result?.data
  if (!row?.sessionId) throw new Error('Could not open an upload session for this gallery.')
  sessionId.value = row.sessionId
  return sessionId.value
}

async function onPick(files) {
  const incoming = Array.from(files || [])
  if (incoming.length + queue.items.length > maxPhotos) {
    error.value = FANEQO_SHOW_TOO_MANY_COPY
    return
  }
  error.value = ''
  saved.value = false
  try {
    await ensureSession()
  } catch (err) {
    error.value = readableError(err) || 'Could not start the upload.'
    return
  }
  queue.addFiles(incoming)
}

function onMove({ localId, delta }) {
  saved.value = false
  queue.move(localId, delta)
}

function onMakeCover({ mediaId }) {
  if (mediaId == null) return
  saved.value = false
  coverMediaId.value = mediaId
}

function onCaption({ mediaId, caption: text }) {
  if (mediaId == null) return
  saved.value = false
  mediaCaptions[String(mediaId)] = String(text || '').slice(0, FANEQO_PHOTO_CAPTION_MAX)
}

function askRemove(localId) {
  const row = queue.items.find((item) => item.localId === localId)
  if (!row) return
  /* A freshly staged upload has not been published; drop it without ceremony. */
  if (!row.mediaId || row.state !== 'ready' || isStaged(row)) {
    removeNow(localId)
    return
  }
  pendingRemoval.value = localId
}

function isStaged(row) {
  return !!row.file
}

async function removeNow(localId) {
  const index = queue.items.findIndex((item) => item.localId === localId)
  const row = queue.items[index]
  const mediaId = row?.mediaId
  const staged = row ? isStaged(row) : false
  queue.remove(localId)
  saved.value = false
  if (mediaId != null) {
    if (String(coverMediaId.value ?? '') === String(mediaId)) coverMediaId.value = null
    delete mediaCaptions[String(mediaId)]
    /* Only a staged file is deleted outright. Published media leaves the
       gallery on save, so the server can keep the file if anything else uses it. */
    if (staged && sessionId.value) await removeDraftMedia(sessionId.value, mediaId).catch(() => {})
  }
  await focusAfterRemoval(index)
}

async function confirmRemove() {
  const localId = pendingRemoval.value
  pendingRemoval.value = null
  if (localId) await removeNow(localId)
}

async function focusAfterRemoval(index) {
  await nextTick()
  if (typeof document === 'undefined') return
  const buttons = [...document.querySelectorAll('.gedit .fq-media-prev__remove')]
  const next = buttons[Math.min(index, buttons.length - 1)]
  next?.focus?.()
}

function readableError(err) {
  const code = galleryDraftErrorCode(err)
  if (code === 'unsafe_visibility_transition') {
    return 'These photos were published publicly, so they have to be re-uploaded before this gallery can become private.'
  }
  if (code === 'gated_delivery_unavailable') {
    return 'Private delivery isn’t available right now, so this gallery can’t become Fans-only yet.'
  }
  const raw = String(err?.data?.error?.message || err?.message || '')
  if (/too many|up to \d+ photos/i.test(raw)) return FANEQO_SHOW_TOO_MANY_COPY
  return raw
}

async function onRocksnapsToggle() {
  if (!gallery.value?.id || !rocksnapsCanToggle.value) return
  rocksnapsBusy.value = true
  rocksnapsError.value = ''
  rocksnapsNote.value = ''
  const next = !rocksnapsOn.value
  try {
    await setRocksnapsPublication(gallery.value.id, next)
    const fresh = await getManageGallery(galleryId.value)
    if (fresh?.data?.rocksnaps) {
      rocksnaps.value = fresh.data.rocksnaps
      gallery.value = { ...gallery.value, rocksnaps: fresh.data.rocksnaps }
    }
    rocksnapsNote.value = next ? 'This gallery is now available to RockSnaps.' : 'Removed from RockSnaps.'
  } catch (err) {
    rocksnapsError.value = readableError(err) || 'Could not update RockSnaps publishing.'
  } finally {
    rocksnapsBusy.value = false
  }
}

async function onFeatureToggle() {
  if (!gallery.value?.id || featuring.value || !canFeature.value) return
  featuring.value = true
  featureError.value = ''
  featureNote.value = ''
  const wasFeatured = featuredOnProfile.value
  try {
    const result = wasFeatured
      ? await unfeatureGalleryOnProfile(gallery.value.id)
      : await featureGalleryOnProfile(gallery.value.id)
    gallery.value = {
      ...gallery.value,
      featuredOnProfile: result?.data?.featuredOnProfile === true,
    }
    featureNote.value = gallery.value.featuredOnProfile
      ? 'Featured on your artist profile.'
      : 'Removed from your artist profile.'
  } catch (err) {
    featureError.value = readableError(err) || 'Could not update the artist profile.'
  } finally {
    featuring.value = false
  }
}

async function onSave() {
  if (!canSave.value) return
  saving.value = true
  error.value = ''
  saved.value = false
  try {
    const mediaOrder = currentMediaOrder.value
    const result = await saveManageGallery(galleryId.value, {
      version: version.value,
      title: String(title.value || '').trim(),
      caption: caption.value,
      mediaOrder,
      mediaCaptions: ownedCaptionMap(mediaCaptions, mediaOrder),
      coverMediaId: coverMediaId.value,
      visibility: visibility.value,
      ...(sessionId.value ? { sessionId: sessionId.value } : {}),
    })
    if (result?.data) {
      sessionId.value = ''
      adopt(result.data)
      saved.value = true
    }
  } catch (err) {
    if (isVersionConflict(err)) {
      conflict.value = true
      return
    }
    error.value = readableError(err) || 'Could not save your changes.'
  } finally {
    saving.value = false
  }
}

onBeforeUnmount(() => {
  /* An abandoned edit session must not leave orphan staged files behind. */
  if (sessionId.value) discardDraft(sessionId.value).catch(() => {})
})
</script>

<style scoped>
.gedit {
  min-height: 100dvh;
  padding: calc(var(--header-height, 70px) + 0.75rem) max(1rem, env(safe-area-inset-left, 0px)) calc(3rem + env(safe-area-inset-bottom, 0px));
  background:
    radial-gradient(760px 320px at 8% -8%, rgba(57, 213, 255, 0.08), transparent 54%),
    #050608;
  color: #fff;
}
.gedit__body {
  max-width: 36rem;
  margin: 0 auto;
}
.gedit__back {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  color: rgba(255, 255, 255, 0.58);
  text-decoration: none;
  font-size: 0.85rem;
}
.gedit__kicker {
  margin: 0;
  color: #39d5ff;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.gedit__head h1 {
  margin: 0.2rem 0 0;
  font-size: clamp(1.5rem, 5vw, 2.1rem);
  font-weight: 750;
  letter-spacing: -0.04em;
}
.gedit__context,
.gedit__canonical {
  margin: 0.4rem 0 0;
  color: rgba(247, 249, 252, 0.45);
  font-size: 0.78rem;
  line-height: 1.45;
}
.gedit__canonical code {
  color: rgba(247, 249, 252, 0.68);
  font-size: 0.76rem;
}
.gedit__label { display: block; margin: 1.25rem 0 0.4rem; font-weight: 650; }
.gedit__title,
.gedit__caption {
  width: 100%;
  min-height: 44px;
  padding: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 0.85rem;
  background: #0b0c10;
  color: #fff;
  font: inherit;
}
.gedit__caption { min-height: 6rem; }
.gedit__title:focus,
.gedit__caption:focus {
  outline: none;
  border-color: #39d5ff;
  box-shadow: 0 0 0 1px #39d5ff;
}
.gedit__who {
  border: 0;
  margin: 1.25rem 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.gedit__feature {
  margin-top: 1.25rem;
}
.gedit__feature-btn {
  margin-top: 0.35rem;
  min-height: 44px;
  padding: 0.55rem 0.9rem;
  border-radius: 0.7rem;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: transparent;
  color: rgba(247, 249, 252, 0.82);
  font: inherit;
  font-size: 0.92rem;
  cursor: pointer;
}
.gedit__feature-btn.is-on {
  border-color: rgba(255, 255, 255, 0.42);
  color: #f7f9fc;
}
.gedit__feature-btn:disabled {
  opacity: 0.45;
  cursor: default;
}
.gedit__choice {
  display: flex;
  align-items: flex-start;
  gap: 0.7rem;
  min-height: 44px;
  padding: 0.45rem 0;
  cursor: pointer;
}
.gedit__choice input { margin-top: 0.3rem; min-width: 1.1rem; min-height: 1.1rem; }
.gedit__sub {
  display: block;
  margin-top: 0.15rem;
  font-size: 0.78rem;
  color: rgba(247, 249, 252, 0.42);
}
.gedit__hint {
  margin: 0.35rem 0 0;
  color: rgba(255, 255, 255, 0.34);
  font-size: 0.72rem;
  line-height: 1.45;
}
.gedit__count {
  margin: 0.45rem 0 0.6rem;
  color: rgba(247, 249, 252, 0.72);
  font-size: 0.78rem;
  font-variant-numeric: tabular-nums;
}
.gedit__picker { margin-top: 0.2rem; }
.gedit__queue-tools {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 0.2rem 0 0.7rem;
}
.gedit__ghost {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: 0 0.85rem;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 0.7rem;
  background: transparent;
  color: #f7f9fc;
  font: inherit;
  font-size: 0.84rem;
  font-weight: 650;
  text-decoration: none;
  cursor: pointer;
}
.gedit__ghost:hover { background: rgba(255, 255, 255, 0.05); }
.gedit__ghost:focus-visible { outline: 2px solid #39d5ff; outline-offset: 2px; }
.gedit__error {
  display: flex;
  align-items: flex-start;
  gap: 0.4rem;
  color: #fca5a5;
  font-size: 0.88rem;
  line-height: 1.5;
}
.gedit__error-mark {
  display: grid;
  place-items: center;
  flex: none;
  width: 1.05rem;
  height: 1.05rem;
  margin-top: 0.15rem;
  border-radius: 999px;
  background: #fca5a5;
  color: #1b0606;
  font-size: 0.72rem;
  font-weight: 800;
  line-height: 1;
}
.gedit__saved { color: #45e3ae; font-size: 0.88rem; }
.gedit__save-block { color: rgba(247, 249, 252, 0.6); }
.gedit__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.6rem;
  margin-top: 1.35rem;
}
.gedit__publish {
  flex: 1 1 14rem;
  min-height: 48px;
  border: 0;
  border-radius: 0.9rem;
  background: linear-gradient(100deg, #4ca6ff 0%, #39d5ff 48%, #45e3ae 100%);
  color: #04140f;
  font: inherit;
  font-weight: 750;
  cursor: pointer;
}
.gedit__publish.is-inline { flex: none; min-height: 44px; padding: 0 1rem; border-radius: 0.7rem; }
.gedit__publish:disabled { opacity: 0.45; cursor: default; }
.gedit__publish:focus-visible { outline: 2px solid #39d5ff; outline-offset: 3px; }
.gedit__state {
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 0.6rem;
  min-height: 18rem;
  max-width: 38rem;
  margin: 0 auto;
  text-align: center;
  color: rgba(255, 255, 255, 0.55);
}
.gedit__state a { color: #39d5ff; }
.gedit__conflict-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.6rem;
  margin-top: 0.6rem;
}
@media (max-width: 390px) {
  .gedit :deep(.fq-media-prev.is-composer) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
