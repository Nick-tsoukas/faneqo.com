<template>
  <div class="auc" :class="{ 'auc--show': showPhotosMode }">
    <!-- 1. Context: what you are creating, for whom, from which night. -->
    <header class="auc__head">
      <NuxtLink :to="backTo" :replace="backReplace" class="auc__back">Back</NuxtLink>
      <div>
        <p class="auc__kicker">{{ kicker }}</p>
        <h1>{{ heading }}</h1>
        <p v-if="lede" class="auc__lede">{{ lede }}</p>
        <p class="auc__context">{{ contextLine }}</p>
      </div>
    </header>

    <p v-if="deliveryMessage" class="auc__delivery" role="status">{{ deliveryMessage }}</p>
    <p v-if="draftError" class="auc__error" role="alert">
      <span class="auc__error-mark" aria-hidden="true">!</span>{{ draftError }}
    </p>

    <!-- Recovery comes before anything else, or the choice is already lost. -->
    <section v-if="resumeDraft" class="auc__resume" aria-labelledby="auc-resume-head">
      <h2 id="auc-resume-head">You have an unfinished gallery</h2>
      <p>{{ resumeSummary }}</p>
      <div class="auc__resume-actions">
        <button type="button" class="auc__publish is-inline" :disabled="resuming" @click="continueDraft">
          Continue draft
        </button>
        <button type="button" class="auc__ghost" :disabled="resuming" @click="startFresh">
          Start fresh
        </button>
      </div>
    </section>

    <template v-else>
      <!-- 2. Audience. Everyone is the default, so this stays quiet until asked. -->
      <div v-if="!audienceExpanded" class="auc__audience">
        <p class="auc__audience-line">
          <span class="auc__audience-eyebrow">Who can see these</span>
          <strong class="auc__audience-value">{{ audienceShortLabel }}</strong>
          <span class="auc__audience-detail">{{ audienceDetailLabel }}</span>
        </p>
        <button type="button" class="auc__link" @click="openAudienceChange">Change</button>
      </div>

      <fieldset v-else class="auc__who">
        <legend class="auc__label">Who can see these photos?</legend>
        <label class="auc__choice">
          <input v-model="visibility" type="radio" name="auc-visibility" value="public" @change="onAudienceTouch">
          <span>
            Everyone
            <span class="auc__people-sub">Anyone with the link</span>
          </span>
        </label>
        <label class="auc__choice" :class="{ 'is-disabled': !canChooseGated }">
          <input
            v-model="visibility"
            type="radio"
            name="auc-visibility"
            value="fan_list"
            :disabled="!canChooseGated"
            @change="onAudienceTouch"
          >
          <span>
            Fans
            <span class="auc__people-sub">{{ canChooseGated ? `Fans of ${bandName || 'this artist'}` : 'Private delivery isn’t ready yet' }}</span>
          </span>
        </label>
        <label v-if="canChooseAttendees" class="auc__choice" :class="{ 'is-disabled': !canChooseGated }">
          <input
            v-model="visibility"
            type="radio"
            name="auc-visibility"
            value="show_attendees"
            :disabled="!canChooseGated"
            @change="onAudienceTouch"
          >
          <span>
            People who were there
            <span class="auc__people-sub">{{ canChooseGated ? 'People who checked in at this show' : 'Private delivery isn’t ready yet' }}</span>
          </span>
        </label>

        <p v-if="audienceChangeNeedsClear" class="auc__hint">{{ audienceChangeBody }}</p>
        <div class="auc__resume-actions">
          <button
            type="button"
            class="auc__publish is-inline"
            :disabled="audienceSaving || !sessionId"
            @click="commitAudience"
          >
            {{ audienceSaving ? 'Saving…' : 'Done' }}
          </button>
          <button type="button" class="auc__ghost" :disabled="audienceSaving" @click="abandonAudienceChange">
            Cancel
          </button>
        </div>
      </fieldset>

      <section class="auc__page" aria-labelledby="auc-page-label">
        <p id="auc-page-label" class="auc__label">Artist page</p>
        <button
          type="button"
          class="auc__page-btn"
          :class="{ 'is-on': artistPageState.pressed }"
          :aria-pressed="artistPageState.pressed ? 'true' : 'false'"
          aria-describedby="auc-page-help"
          :disabled="artistPageState.disabled || publishing"
          @click="onArtistPageToggle"
        >
          <span class="auc__page-copy">
            <span class="auc__page-title">Show on artist page</span>
            <span class="auc__page-support">{{ artistPageState.supporting }}</span>
          </span>
          <span class="auc__page-switch" aria-hidden="true" />
        </button>
        <p id="auc-page-help" class="auc__page-help">{{ artistPageState.help }}</p>
      </section>

      <!-- 3. Details. Name and words first, so the photos land in a place. -->
      <section class="auc__step" aria-labelledby="auc-details-head">
        <h2 id="auc-details-head" class="auc__step-head">Gallery details</h2>

        <label class="auc__label" for="auc-title">Title</label>
        <input
          id="auc-title"
          v-model="title"
          class="auc__title"
          type="text"
          maxlength="120"
          :placeholder="derivedTitle || 'Optional'"
        />

        <label class="auc__label" for="auc-caption">Caption</label>
        <textarea
          id="auc-caption"
          v-model="caption"
          class="auc__caption"
          rows="3"
          maxlength="1200"
          :placeholder="showPhotosMode ? 'Optional' : 'Nashville was insane. Thanks for coming out 🤘'"
        />
      </section>

      <section v-if="rocksnapsState.visible" class="auc__rocksnaps" aria-labelledby="auc-rocksnaps-label">
        <p id="auc-rocksnaps-label" class="auc__label">RockSnaps Publishing</p>
        <button
          type="button"
          class="auc__rocksnaps-btn"
          :class="{ 'is-on': rocksnapsState.pressed }"
          :aria-pressed="rocksnapsState.pressed ? 'true' : 'false'"
          aria-describedby="auc-rocksnaps-help"
          :disabled="rocksnapsState.disabled || publishing || !!rocksnapsHold"
          @click="onRocksnapsCreateToggle"
        >
          {{ rocksnapsState.pressed ? 'Showing on RockSnaps' : 'Show on RockSnaps' }}
        </button>
        <p id="auc-rocksnaps-help" class="auc__hint">Automatically display this gallery on rocksnaps.com when published.</p>
        <p v-if="rocksnapsState.blockedReason" class="auc__hint">{{ rocksnapsState.blockedReason }}</p>
        <p v-else class="auc__hint">{{ rocksnapsState.pressed ? 'Will show on RockSnaps when you publish.' : 'Will not show on RockSnaps.' }}</p>
      </section>

      <!-- 4. Photos: the loudest thing on the page, because it is the point. -->
      <section class="auc__step is-photos" aria-labelledby="auc-photos-head">
        <div class="auc__step-row">
          <h2 id="auc-photos-head" class="auc__step-head">Photos</h2>
          <!-- One live region for counts. Per-item chatter is not an announcement. -->
          <p class="auc__count" aria-live="polite">{{ uploadSummary }}</p>
        </div>

        <FaneqoMediaPicker
          class="auc__picker"
          multiple
          :variant="queue.items.length ? 'labeled' : 'block'"
          :dense="queue.items.length > 0"
          :can-add="canAddPhotos"
          :disabled="!canAddPhotos"
          :label="pickerLabel"
          @select="onPick"
        />
        <p class="auc__hint">{{ photoHint }}</p>

        <div v-if="queue.failedCount || queue.uploadingCount" class="auc__queue-tools">
          <button v-if="queue.failedCount" type="button" class="auc__ghost" @click="queue.retryFailed()">
            Retry {{ queue.failedCount }} failed
          </button>
          <button v-if="queue.uploadingCount" type="button" class="auc__ghost" @click="queue.cancelPending()">
            Cancel remaining uploads
          </button>
        </div>

        <p v-if="queue.items.length" class="auc__cover-hint">
          The cover is the photo fans see first. Use ★ on any photo to make it the cover.
        </p>
        <FaneqoMediaPreview
          v-if="queue.items.length"
          :items="queue.items"
          :compact="false"
          cover
          :cover-media-id="coverMediaId"
          :captions="mediaCaptions"
          @remove="onRemove"
          @retry="queue.retry"
          @move="onMove"
          @cover="onMakeCover"
          @caption="onCaption"
        />
      </section>

      <p v-if="error" class="auc__error" role="alert">
        <span class="auc__error-mark" aria-hidden="true">!</span>{{ error }}
      </p>

      <div v-if="rocksnapsHold" class="auc__rocksnaps-hold" role="alert">
        <p>This gallery is published on Faneqo, but it was not enabled for RockSnaps.</p>
        <p v-if="rocksnapsHold.message">{{ rocksnapsHold.message }}</p>
        <div class="auc__resume-actions">
          <button type="button" class="auc__publish is-inline" :disabled="rocksnapsRetrying" @click="retryRocksnaps">
            {{ rocksnapsRetrying ? 'Trying…' : 'Try RockSnaps again' }}
          </button>
          <NuxtLink v-if="rocksnapsHold.id" :to="`/galleries/${rocksnapsHold.id}/edit`" class="auc__ghost">Open gallery editor</NuxtLink>
        </div>
      </div>

      <!-- 5. Publish. -->
      <div class="auc__finish">
        <p v-if="queue.readyCount" class="auc__review-line">{{ reviewLine }}</p>
        <button ref="publishBtn" type="button" class="auc__publish" :disabled="!canPublish" @click="onPublish">
          {{ publishLabel }}
        </button>
        <button
          v-if="queue.items.length || title || caption"
          type="button"
          class="auc__ghost is-quiet"
          @click="discardOpen = true"
        >
          Discard gallery
        </button>
      </div>
    </template>

    <FaneqoGalleryConfirm
      :open="audienceChangeOpen"
      heading="Change who can see these photos?"
      :body="audienceChangeBody"
      confirm-label="Change and clear photos"
      busy-label="Clearing…"
      :busy="audienceSaving"
      danger
      @cancel="cancelAudienceChange"
      @confirm="applyAudienceChange"
    />
    <FaneqoGalleryConfirm
      :open="discardOpen"
      heading="Discard this gallery?"
      body="The photos you staged will be deleted and nothing will be published."
      confirm-label="Discard"
      busy-label="Discarding…"
      :busy="discarding"
      danger
      @cancel="discardOpen = false"
      @confirm="onDiscard"
    />
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import FaneqoGalleryConfirm from '~/components/galleries/FaneqoGalleryConfirm.vue'
import FaneqoMediaPicker from '~/components/media/FaneqoMediaPicker.vue'
import FaneqoMediaPreview from '~/components/media/FaneqoMediaPreview.vue'
import { useArtistUpdates } from '~/composables/useArtistUpdates'
import { useGalleryDrafts, galleryDraftErrorCode, ownedCaptionMap } from '~/composables/useGalleryDrafts'
import { useMediaUploadQueue } from '~/composables/useMediaUploadQueue'
import {
  FANEQO_PHOTO_CAPTION_MAX,
  FANEQO_SHOW_MAX_IMAGES,
  FANEQO_SHOW_TOO_MANY_COPY,
  FANEQO_UPDATE_MAX_IMAGES,
  FANEQO_UPLOAD_CONCURRENCY,
} from '~/utils/media/faneqoMedia'
import { artistUpdateUiLog } from '~/utils/media/mediaUiLog'
import { deriveShowPhotosTitle, formatShowNightDate } from '~/utils/shows/formatShowNightDate'
import {
  artistPageCreateState,
  readArtistPageCreatePreference,
  writeArtistPageCreatePreference,
} from '~/utils/galleries/artistPageCreate'
import {
  clearRocksnapsCreatePreference,
  readRocksnapsCreatePreference,
  rocksnapsCreateState,
  writeRocksnapsCreatePreference,
} from '~/utils/galleries/rocksnapsCreate'

const props = defineProps({
  bandId: { type: [String, Number], required: true },
  bandName: { type: String, default: '' },
  mode: { type: String, default: 'update' },
  eventId: { type: [String, Number], default: null },
  showRecapId: { type: [String, Number], default: null },
  showLabel: { type: String, default: '' },
  city: { type: String, default: '' },
  venue: { type: String, default: '' },
  showDate: { type: [String, Date, Number], default: '' },
  timeZone: { type: String, default: '' },
  backTo: { type: String, default: '/updates' },
  backReplace: { type: Boolean, default: false },
  assumeDeliveryReady: { type: Boolean, default: false },
  returnContext: { type: Object, default: null },
  rocksnaps: { type: Boolean, default: false },
})

const emit = defineEmits(['published'])
const { getDeliveryStatus } = useArtistUpdates()
const {
  createDraft,
  getActiveDraft,
  patchDraft,
  setAudience,
  uploadDraftMedia,
  removeDraftMedia,
  publishDraft,
  discardDraft,
  setRocksnapsPublication,
  getArtistPagePlacement,
  getRocksnapsCapability,
} = useGalleryDrafts()

const showPhotosMode = computed(() => props.mode === 'show-photos' || !!props.showRecapId)
const draftKind = computed(() => (showPhotosMode.value ? 'show' : 'general'))
const maxPhotos = FANEQO_SHOW_MAX_IMAGES

const sessionId = ref('')
const resumeDraft = ref(null)
const resuming = ref(false)
const draftError = ref('')
const visibility = ref('public')
/* Everyone is the default and is already applied to a fresh draft server-side,
   so the artist never has to answer a question they usually do not need to. */
const audienceConfirmed = ref(true)
const appliedVisibility = ref('public')
const audienceExpanded = ref(false)
const audienceSaving = ref(false)
const audienceChangeOpen = ref(false)
const audienceChanging = ref(false)
const pendingVisibility = ref('')
const uploadsStarted = ref(false)
const deliveryReady = ref(true)
const deliveryMessage = ref('')
const title = ref('')
const caption = ref('')
const mediaCaptions = reactive({})
const coverMediaId = ref(null)
const publishing = ref(false)
const publishedLock = ref(false)
const discardOpen = ref(false)
const discarding = ref(false)
const error = ref('')
const publishBtn = ref(null)
const publishIdempotencyKey = ref(newPublishIdempotencyKey())
const rocksnapsEligible = ref(false)
const rocksnapsPreference = ref(true)
const rocksnapsHold = ref(null)
const rocksnapsRetrying = ref(false)
const artistPagePlacement = ref(null)
const artistPagePreference = ref(false)
const artistPageReady = ref(false)

const artistPageState = computed(() => artistPageCreateState({
  loaded: artistPageReady.value,
  unknown: artistPagePlacement.value?.unknown === true,
  displaysOnArtistPage: artistPagePlacement.value?.displaysOnArtistPage !== false,
  hasFeatured: !!artistPagePlacement.value?.featuredGalleryId,
  featuredTitle: artistPagePlacement.value?.featuredTitle || '',
  preference: artistPagePreference.value,
  visibility: appliedVisibility.value,
  selectedVisibility: visibility.value,
}))

const rocksnapsState = computed(() => rocksnapsCreateState({
  eligible: rocksnapsEligible.value,
  preference: rocksnapsPreference.value,
  visibility: appliedVisibility.value,
  selectedVisibility: visibility.value,
}))

const gatedVisibility = computed(() => visibility.value === 'fan_list' || visibility.value === 'show_attendees')
const canChooseAttendees = computed(() => showPhotosMode.value || !!props.showRecapId)
const canChooseGated = computed(() => deliveryReady.value)
const storageClassOf = (value) => (value === 'public' ? 'public' : 'protected')
/* Only a storage-class change forces a re-upload. Public→public is free. */
const audienceChangeNeedsClear = computed(() =>
  queue.items.length > 0 && storageClassOf(visibility.value) !== storageClassOf(appliedVisibility.value)
)

/**
 * Every file goes through the draft session. Classification is the server's
 * call, derived from the draft audience — the client never sends it.
 */
const queue = useMediaUploadQueue({
  maxItems: maxPhotos,
  concurrency: FANEQO_UPLOAD_CONCURRENCY,
  uploadFn: (file, { signal }) => uploadDraftMedia(sessionId.value, file, { signal }),
})

const canAddPhotos = computed(() =>
  queue.canAdd
  && audienceConfirmed.value
  && !!sessionId.value
  && (!gatedVisibility.value || deliveryReady.value)
)

const cityLine = computed(() => String(props.city || '').trim() || String(props.showLabel || '').trim() || String(props.venue || '').trim())
const dateLine = computed(() => formatShowNightDate(props.showDate, { timeZone: props.timeZone || undefined }))
const whereLine = computed(() => {
  const venue = String(props.venue || '').trim()
  const date = dateLine.value
  const parts = []
  if (venue && venue !== cityLine.value) parts.push(venue)
  if (date) parts.push(date)
  return parts.join(' · ')
})

const heading = computed(() => {
  if (showPhotosMode.value) return cityLine.value || 'Tonight'
  return props.showLabel ? `Share photos from ${props.showLabel}` : 'New Gallery'
})
const kicker = computed(() => (showPhotosMode.value ? 'Photos from tonight' : 'Create a gallery'))
const lede = computed(() => {
  if (showPhotosMode.value) return whereLine.value
  return props.showLabel
    ? 'Add photos from tonight and give the fans who were there something to come back for.'
    : 'Add photos. Write a caption. Publish a gallery fans can return to.'
})
const contextLine = computed(() => {
  const artist = String(props.bandName || '').trim()
  const parts = [showPhotosMode.value ? 'Show gallery' : 'Gallery']
  if (artist) parts.push(artist)
  if (showPhotosMode.value) {
    const night = [cityLine.value, whereLine.value].filter(Boolean).join(' · ')
    if (night) parts.push(night)
  } else if (props.showLabel) {
    parts.push(props.showLabel)
  }
  return parts.join(' · ')
})
const derivedTitle = computed(() =>
  deriveShowPhotosTitle({
    city: props.city,
    venue: props.venue,
    date: props.showDate,
    showTitle: props.showLabel,
    timeZone: props.timeZone,
  }) || ''
)
const photoHint = computed(() => `iPhone photos, JPEG, PNG, or WebP · up to ${maxPhotos} · 8 MB each`)
const pickerLabel = computed(() => {
  if (queue.items.length) return 'Add more photos'
  return showPhotosMode.value ? 'Add photos from tonight' : 'Add photos'
})

const audienceShortLabel = computed(() => {
  if (visibility.value === 'show_attendees') return 'People who were there'
  if (visibility.value === 'fan_list') return 'Fans'
  return 'Everyone'
})
const audienceDetailLabel = computed(() => {
  if (visibility.value === 'show_attendees') return 'only people who checked in at this show'
  if (visibility.value === 'fan_list') return `only fans of ${props.bandName || 'this artist'}`
  return 'anyone with the link'
})
const pendingShortLabel = computed(() => {
  if (pendingVisibility.value === 'show_attendees') return 'People who were there'
  if (pendingVisibility.value === 'fan_list') return 'Fans'
  return 'Everyone'
})
const audienceChangeBody = computed(() => {
  const n = queue.items.length
  if (!n) return 'Changing the audience clears anything staged for the previous one.'
  return `The ${n} ${n === 1 ? 'photo' : 'photos'} you added were stored for “${pendingShortLabel.value}”. Changing the audience clears them and you will add them again.`
})

/* Honest item counts. A byte percentage across parallel uploads is a guess. */
const uploadSummary = computed(() => {
  const total = queue.items.length
  if (!total) return `0 of ${maxPhotos} photos added`
  const parts = [`${total} of ${maxPhotos} selected`, `${queue.readyCount} uploaded`]
  if (queue.uploadingCount) parts.push(`${queue.uploadingCount} uploading`)
  if (queue.failedCount) parts.push(`${queue.failedCount} failed`)
  return parts.join(' · ')
})
const reviewLine = computed(() => {
  const n = queue.readyCount
  const name = String(title.value || '').trim() || derivedTitle.value || 'Untitled gallery'
  return `“${name}” · ${n} ${n === 1 ? 'photo' : 'photos'} · ${audienceShortLabel.value}`
})
const resumeSummary = computed(() => {
  const row = resumeDraft.value
  if (!row) return ''
  const n = Array.isArray(row.media) ? row.media.length : 0
  const name = String(row.title || '').trim()
  const bits = [n ? `${n} ${n === 1 ? 'photo' : 'photos'}` : 'no photos yet']
  if (name) bits.unshift(`“${name}”`)
  return `${bits.join(' · ')}. Pick up where you left off, or start over.`
})

const publishLabel = computed(() => {
  if (publishing.value) return 'Publishing…'
  if (visibility.value === 'show_attendees') return 'Share with people from tonight'
  if (visibility.value === 'fan_list') return 'Share with fans'
  return showPhotosMode.value ? 'Share photos' : 'Publish gallery'
})
const canPublish = computed(() =>
  !publishing.value
  && !publishedLock.value
  && !!sessionId.value
  && audienceConfirmed.value
  && (!gatedVisibility.value || deliveryReady.value)
  && queue.ready
  && !queue.busy
  && queue.items.length > 0
  && queue.items.every((row) => row.state !== 'failed')
  && (!showPhotosMode.value || !!props.showRecapId)
  && artistPageReady.value
)

const meaningfulWork = computed(() =>
  queue.items.length > 0
  || !!String(caption.value || '').trim()
  || !!String(title.value || '').trim()
)

/* ---- draft lifecycle ----------------------------------------------------- */

function pointerKey() {
  return `faneqo:gallery-draft:${props.bandId}:${draftKind.value}:${props.showRecapId || ''}`
}

function rememberSession(id) {
  /* Only the pointer. Never image bytes, never the draft itself. */
  if (typeof sessionStorage === 'undefined') return
  try {
    if (id) sessionStorage.setItem(pointerKey(), String(id))
    else sessionStorage.removeItem(pointerKey())
  } catch {
    /* Private mode. The server draft is still the truth. */
  }
}

function preferenceStorage() {
  if (typeof sessionStorage === 'undefined') return null
  return sessionStorage
}

function restoreRocksnapsPreference() {
  if (!rocksnapsEligible.value || !sessionId.value) return
  rocksnapsPreference.value = readRocksnapsCreatePreference(preferenceStorage(), sessionId.value)
}

async function loadArtistPagePlacement() {
  try {
    const result = await getArtistPagePlacement(props.bandId)
    artistPagePlacement.value = result?.data || {
      featuredGalleryId: null,
      featuredTitle: '',
      displaysOnArtistPage: true,
    }
  } catch {
    artistPagePlacement.value = {
      featuredGalleryId: null,
      featuredTitle: '',
      displaysOnArtistPage: true,
      unknown: true,
    }
  }
}

function restoreArtistPagePreference() {
  if (!sessionId.value || !artistPagePlacement.value) return
  artistPagePreference.value = readArtistPageCreatePreference(preferenceStorage(), sessionId.value, {
    hasFeatured: !!artistPagePlacement.value.featuredGalleryId,
    unknown: artistPagePlacement.value.unknown === true,
  })
  artistPageReady.value = true
}

function onArtistPageToggle() {
  if (artistPageState.value.disabled || publishing.value) return
  artistPagePreference.value = !artistPageState.value.pressed
  writeArtistPageCreatePreference(preferenceStorage(), sessionId.value, artistPagePreference.value)
}

async function loadRocksnapsCapability() {
  if (props.rocksnaps !== true || !props.bandId) return
  try {
    const result = await getRocksnapsCapability(props.bandId)
    rocksnapsEligible.value = result?.data?.eligible === true
  } catch {
    rocksnapsEligible.value = false
  }
  restoreRocksnapsPreference()
}

function onRocksnapsCreateToggle() {
  if (rocksnapsState.value.disabled || publishing.value || rocksnapsHold.value) return
  rocksnapsPreference.value = !rocksnapsPreference.value
  writeRocksnapsCreatePreference(preferenceStorage(), sessionId.value, rocksnapsPreference.value)
}

function draftHasWork(row) {
  if (!row) return false
  if (Array.isArray(row.media) && row.media.length) return true
  return !!String(row.title || '').trim() || !!String(row.caption || '').trim()
}

function adoptDraft(row) {
  if (!row) return
  sessionId.value = row.sessionId
  rememberSession(row.sessionId)
  visibility.value = row.visibility || 'public'
  appliedVisibility.value = visibility.value
  audienceConfirmed.value = true
  title.value = row.title || ''
  caption.value = row.caption || ''
  coverMediaId.value = row.coverMediaId ?? null
  for (const key of Object.keys(mediaCaptions)) delete mediaCaptions[key]
  Object.assign(mediaCaptions, row.mediaCaptions || {})
  queue.clear()
  const ordered = orderedMedia(row)
  queue.adopt(ordered)
  uploadsStarted.value = ordered.length > 0
  restoreRocksnapsPreference()
  restoreArtistPagePreference()
}

function orderedMedia(row) {
  const media = Array.isArray(row?.media) ? row.media : []
  const order = Array.isArray(row?.mediaOrder) ? row.mediaOrder.map(String) : []
  if (!order.length) return media
  const byId = new Map(media.map((item) => [String(item.mediaId ?? item.id), item]))
  const sorted = order.map((id) => byId.get(id)).filter(Boolean)
  for (const item of media) {
    if (!order.includes(String(item.mediaId ?? item.id))) sorted.push(item)
  }
  return sorted
}

async function newDraft() {
  const result = await createDraft({
    bandId: props.bandId,
    kind: draftKind.value,
    showRecapId: props.showRecapId || undefined,
    eventId: props.eventId || undefined,
    returnContext: props.returnContext || undefined,
  })
  const row = result?.data
  if (!row?.sessionId) throw new Error('Could not open a gallery draft.')
  sessionId.value = row.sessionId
  rememberSession(row.sessionId)
  visibility.value = row.visibility || 'public'
  if (showPhotosMode.value && !title.value) title.value = derivedTitle.value
  restoreRocksnapsPreference()
  restoreArtistPagePreference()
  return row
}

async function openDraft() {
  try {
    const active = await getActiveDraft({
      bandId: props.bandId,
      kind: draftKind.value,
      showRecapId: props.showRecapId || undefined,
    })
    const row = active?.data
    if (draftHasWork(row)) {
      resumeDraft.value = row
      sessionId.value = row.sessionId
      return
    }
    if (row?.sessionId) {
      adoptDraft(row)
      uploadsStarted.value = false
      if (showPhotosMode.value && !title.value) title.value = derivedTitle.value
      return
    }
    await newDraft()
  } catch (err) {
    draftError.value = readableError(err) || 'Could not open a gallery draft. Reload and try again.'
  }
}

async function continueDraft() {
  resuming.value = true
  try {
    adoptDraft(resumeDraft.value)
    resumeDraft.value = null
  } finally {
    resuming.value = false
  }
}

async function startFresh() {
  resuming.value = true
  try {
    const stale = resumeDraft.value?.sessionId
    resumeDraft.value = null
    sessionId.value = ''
    if (stale) {
      clearRocksnapsCreatePreference(preferenceStorage(), stale)
      await discardDraft(stale).catch(() => {})
    }
    rememberSession('')
    await newDraft()
  } catch (err) {
    draftError.value = readableError(err) || 'Could not start a new gallery draft.'
  } finally {
    resuming.value = false
  }
}

/* ---- audience ------------------------------------------------------------ */

function onAudienceTouch() {
  error.value = ''
}

function openAudienceChange() {
  pendingVisibility.value = appliedVisibility.value || visibility.value
  audienceExpanded.value = true
}

/**
 * Applying the choice. Clearing staged photos is only ever required when the
 * storage class actually changes, so the warning is not shown for free moves.
 */
async function commitAudience() {
  if (!sessionId.value) return
  if (audienceChangeNeedsClear.value) {
    audienceChangeOpen.value = true
    return
  }
  audienceSaving.value = true
  error.value = ''
  try {
    const result = await setAudience(sessionId.value, { visibility: visibility.value })
    if (result?.data?.visibility) visibility.value = result.data.visibility
    appliedVisibility.value = visibility.value
    audienceConfirmed.value = true
    audienceExpanded.value = false
  } catch (err) {
    error.value = readableError(err)
  } finally {
    audienceSaving.value = false
  }
}

function cancelAudienceChange() {
  audienceChangeOpen.value = false
}

function abandonAudienceChange() {
  audienceChangeOpen.value = false
  audienceChanging.value = false
  audienceExpanded.value = false
  visibility.value = pendingVisibility.value || appliedVisibility.value || visibility.value
}

/**
 * The staged files were classified under the old audience, so the only honest
 * change is to clear them and re-upload. We never silently downgrade.
 */
async function applyAudienceChange() {
  audienceSaving.value = true
  error.value = ''
  try {
    await setAudience(sessionId.value, { visibility: visibility.value, confirmClear: true })
    queue.clear()
    for (const key of Object.keys(mediaCaptions)) delete mediaCaptions[key]
    coverMediaId.value = null
    uploadsStarted.value = false
    appliedVisibility.value = visibility.value
    audienceConfirmed.value = true
    audienceChanging.value = false
    audienceExpanded.value = false
    audienceChangeOpen.value = false
  } catch (err) {
    error.value = readableError(err)
  } finally {
    audienceSaving.value = false
  }
}

/* ---- photos -------------------------------------------------------------- */

function onPick(files) {
  const incoming = Array.from(files || []).length
  if (incoming + queue.items.length > maxPhotos) {
    error.value = FANEQO_SHOW_TOO_MANY_COPY
  } else if (error.value === FANEQO_SHOW_TOO_MANY_COPY) {
    error.value = ''
  }
  const accepted = queue.addFiles(files)
  /* Only a file that actually starts uploading locks the audience. A file
     rejected locally for type or size never reached the draft session. */
  if (accepted.some((row) => row.state === 'preparing')) uploadsStarted.value = true
}

function onMove({ localId, delta }) {
  queue.move(localId, delta)
  scheduleSave()
}

async function onRemove(localId) {
  const row = queue.items.find((item) => item.localId === localId)
  const index = queue.items.findIndex((item) => item.localId === localId)
  const mediaId = row?.mediaId
  queue.remove(localId)
  if (mediaId != null) {
    if (String(coverMediaId.value ?? '') === String(mediaId)) coverMediaId.value = null
    delete mediaCaptions[String(mediaId)]
    if (sessionId.value) {
      await removeDraftMedia(sessionId.value, mediaId).catch(() => {})
    }
  }
  scheduleSave()
  await focusAfterRemoval(index)
}

/* Focus must land somewhere deliberate, not at the top of the document. */
async function focusAfterRemoval(index) {
  await nextTick()
  if (typeof document === 'undefined') return
  const buttons = [...document.querySelectorAll('.auc .fq-media-prev__remove')]
  const next = buttons[Math.min(index, buttons.length - 1)]
  if (next) next.focus()
  else publishBtn.value?.focus?.()
}

function onMakeCover({ mediaId }) {
  if (mediaId == null) return
  coverMediaId.value = mediaId
  scheduleSave()
}

function onCaption({ mediaId, caption: text }) {
  if (mediaId == null) return
  mediaCaptions[String(mediaId)] = String(text || '').slice(0, FANEQO_PHOTO_CAPTION_MAX)
  scheduleSave()
}

/* ---- autosave ------------------------------------------------------------ */

let saveTimer = null

function orderedMediaIds() {
  return queue.items
    .filter((row) => row.state === 'ready' && row.mediaId != null)
    .map((row) => row.mediaId)
}

function savePayload() {
  const mediaOrder = orderedMediaIds()
  return {
    title: String(title.value || '').trim(),
    caption: caption.value,
    /* While photos are still landing, a partial order would last-write-wins
       captions and cover against the server's fuller list. */
    ...(queue.busy ? {} : { mediaOrder }),
    mediaCaptions: ownedCaptionMap(mediaCaptions, mediaOrder),
    coverMediaId: coverMediaId.value,
  }
}

async function saveNow() {
  if (!sessionId.value || publishedLock.value) return true
  try {
    await patchDraft(sessionId.value, savePayload())
    return true
  } catch (err) {
    error.value = readableError(err) || 'Could not save your draft.'
    return false
  }
}

function scheduleSave() {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    saveTimer = null
    saveNow()
  }, 800)
}

watch([title, caption], scheduleSave)
watch(() => queue.readyCount, scheduleSave)

/* ---- delivery probe ------------------------------------------------------ */

async function probeDelivery() {
  if (props.assumeDeliveryReady) {
    deliveryReady.value = true
    deliveryMessage.value = ''
    return
  }
  try {
    const delivery = await getDeliveryStatus()
    deliveryReady.value = delivery?.data?.ready === true
    deliveryMessage.value = deliveryReady.value
      ? ''
      : 'Protected delivery isn’t available yet. Everyone can still see a public gallery.'
    /* A gated choice is never silently downgraded to public. The radios are
       disabled instead, and publish refuses with an honest error. */
  } catch {
    deliveryReady.value = false
    deliveryMessage.value = 'Protected delivery isn’t available yet. Everyone can still see a public gallery.'
  }
}

/* ---- leaving ------------------------------------------------------------- */

function onBeforeUnload(evt) {
  if (!queue.busy) return
  evt.preventDefault()
  evt.returnValue = ''
}

onMounted(async () => {
  if (showPhotosMode.value && !title.value) title.value = derivedTitle.value
  await probeDelivery()
  await Promise.all([openDraft(), loadRocksnapsCapability(), loadArtistPagePlacement()])
  restoreRocksnapsPreference()
  restoreArtistPagePreference()
  if (typeof window !== 'undefined') window.addEventListener('beforeunload', onBeforeUnload)
})

onBeforeUnmount(() => {
  if (saveTimer) clearTimeout(saveTimer)
  if (typeof window !== 'undefined') window.removeEventListener('beforeunload', onBeforeUnload)
})

onBeforeRouteLeave(() => {
  if (publishedLock.value || !meaningfulWork.value) return true
  if (typeof window === 'undefined') return true
  return window.confirm('Leave without publishing? Your draft is saved and you can come back to it.')
})

/* ---- publish ------------------------------------------------------------- */

async function onDiscard() {
  discarding.value = true
  try {
    if (sessionId.value) await discardDraft(sessionId.value).catch(() => {})
    clearRocksnapsCreatePreference(preferenceStorage(), sessionId.value)
    queue.clear()
    rememberSession('')
    sessionId.value = ''
    for (const key of Object.keys(mediaCaptions)) delete mediaCaptions[key]
    coverMediaId.value = null
    title.value = ''
    caption.value = ''
    uploadsStarted.value = false
    audienceConfirmed.value = true
    appliedVisibility.value = 'public'
    audienceExpanded.value = false
    discardOpen.value = false
    await openDraft()
  } finally {
    discarding.value = false
  }
}

function newPublishIdempotencyKey() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `au_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}

function readableError(err) {
  const code = galleryDraftErrorCode(err)
  if (code === 'gated_delivery_unavailable') {
    return 'Private delivery isn’t available right now, so Fans and attendee-only galleries can’t be created yet.'
  }
  if (code === 'audience_clear_required') {
    return 'Changing the audience means the photos you already added have to be cleared and re-added.'
  }
  if (code === 'unsafe_visibility_transition') {
    return 'These photos were published publicly, so they have to be re-uploaded to become private.'
  }
  const raw = String(err?.data?.error?.message || err?.message || '')
  if (/too many|up to \d+ photos/i.test(raw)) return FANEQO_SHOW_TOO_MANY_COPY
  return raw
}

async function onPublish() {
  if (!canPublish.value) return
  /* The lock flips before the await so a double-click cannot get through. */
  publishing.value = true
  error.value = ''
  artistUpdateUiLog('update:create', { bandId: props.bandId, photoCount: queue.items.length, showPhotos: showPhotosMode.value })
  try {
    if (saveTimer) {
      clearTimeout(saveTimer)
      saveTimer = null
    }
    const saved = await saveNow()
    if (!saved) return
    const result = await publishDraft(sessionId.value, {
      publishIdempotencyKey: publishIdempotencyKey.value,
      showOnArtistPage: artistPageState.value.shouldFeature,
    })
    const row = result?.data
    publishedLock.value = true
    rememberSession('')
    artistUpdateUiLog('update:publish', { updateId: row?.id, photoCount: row?.photoCount })
    await finishRocksnapsAfterPublish(row)
  } catch (err) {
    error.value = readableError(err) || 'Could not publish.'
    artistUpdateUiLog('update:publish:error', { status: err?.status || 'unknown' })
  } finally {
    if (!publishedLock.value || rocksnapsHold.value) publishing.value = false
  }
}

async function finishRocksnapsAfterPublish(row) {
  if (!rocksnapsState.value.shouldEnable) {
    emit('published', row)
    return
  }
  if (!row?.id) {
    rocksnapsHold.value = {
      id: null,
      row,
      message: 'The gallery was published, but RockSnaps could not be enabled.',
    }
    return
  }
  try {
    await setRocksnapsPublication(row.id, true)
    emit('published', { ...row, rocksnapsEnabled: true })
  } catch (err) {
    rocksnapsHold.value = {
      id: row.id,
      row,
      message: readableError(err) || 'Could not enable RockSnaps.',
    }
  }
}

async function retryRocksnaps() {
  const hold = rocksnapsHold.value
  if (!hold?.id || rocksnapsRetrying.value) return
  rocksnapsRetrying.value = true
  try {
    await setRocksnapsPublication(hold.id, true)
    rocksnapsHold.value = null
    emit('published', { ...hold.row, id: hold.id, rocksnapsEnabled: true })
  } catch (err) {
    rocksnapsHold.value = {
      ...hold,
      message: readableError(err) || 'Could not enable RockSnaps.',
    }
  } finally {
    rocksnapsRetrying.value = false
  }
}
</script>

<style scoped>
.auc {
  max-width: 36rem;
  margin: 0 auto;
  padding: 1.25rem max(1rem, env(safe-area-inset-left, 0px)) calc(2rem + env(safe-area-inset-bottom, 0px));
  color: #fff;
}
.auc--show {
  font-family: Poppins, ui-sans-serif, system-ui, sans-serif;
  color: #f7f9fc;
}
.auc__head h1 {
  margin: 0.15rem 0 0;
  font-size: 1.45rem;
  font-weight: 750;
  letter-spacing: -0.03em;
}
.auc--show .auc__head h1 {
  font-size: clamp(1.55rem, 6vw, 2.1rem);
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 1.05;
}
.auc__kicker {
  margin: 0;
  font-size: 0.7rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #39d5ff;
}
.auc--show .auc__kicker {
  color: rgba(247, 249, 252, 0.55);
  letter-spacing: 0.16em;
}
.auc__lede { color: rgba(255,255,255,0.55); font-size: 0.9rem; }
.auc--show .auc__lede {
  margin: 0.35rem 0 0;
  color: rgba(247, 249, 252, 0.55);
}
.auc__context {
  margin: 0.5rem 0 0;
  color: rgba(247, 249, 252, 0.42);
  font-size: 0.76rem;
  line-height: 1.45;
}
.auc__back { color: rgba(255,255,255,0.6); text-decoration: none; font-size: 0.85rem; }
.auc--show .auc__back {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
}
.auc__hint { color: rgba(255,255,255,0.32); font-size: 0.7rem; line-height: 1.4; margin: 0; }
.auc__delivery {
  margin: 1rem 0 0;
  font-size: 0.88rem;
  line-height: 1.45;
  color: #fbbf24;
}
.auc__label { display: block; margin: 1.25rem 0 0.4rem; font-weight: 650; }
.auc--show .auc__label {
  font-size: 0.82rem;
  font-weight: 500;
  color: rgba(247, 249, 252, 0.55);
}
.auc__title,
.auc__caption {
  width: 100%; min-height: 6rem; border-radius: 0.85rem; border: 1px solid rgba(255,255,255,0.12);
  background: #0b0c10; color: #fff; padding: 0.75rem;
}
.auc__title:focus,
.auc__caption:focus {
  outline: none;
  border-color: #39d5ff;
  box-shadow: 0 0 0 1px #39d5ff;
}
.auc__title {
  min-height: 44px;
}
.auc__cover-hint {
  margin: 0.55rem 0;
  color: rgba(247, 249, 252, 0.46);
  font-size: 0.75rem;
  line-height: 1.45;
}
.auc--show .auc__title,
.auc--show .auc__caption {
  min-height: 3.2rem;
  border-radius: 0;
  background: transparent;
  border: 0;
  border-bottom: 1px solid rgba(247, 249, 252, 0.12);
  padding: 0.45rem 0 0.7rem;
  color: #f7f9fc;
}
.auc--show .auc__title {
  min-height: 44px;
}
.auc--show .auc__title:focus,
.auc--show .auc__caption:focus {
  box-shadow: none;
  border-color: transparent;
  border-bottom-color: #39d5ff;
}
.auc__people-sub {
  display: block;
  margin-top: 0.15rem;
  font-size: 0.78rem;
  font-weight: 500;
  color: rgba(247, 249, 252, 0.42);
}
.auc__who {
  border: 0;
  margin: 1.25rem 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.auc__who:disabled { opacity: 0.6; }
.auc__who legend { margin-bottom: 0.35rem; }
.auc__choice {
  display: flex;
  align-items: flex-start;
  gap: 0.7rem;
  min-height: 44px;
  padding: 0.45rem 0;
  cursor: pointer;
}
.auc__choice.is-disabled { opacity: 0.5; cursor: not-allowed; }
.auc__choice input { margin-top: 0.3rem; min-width: 1.1rem; min-height: 1.1rem; }
/* Two calm steps rather than a field-by-field form. */
.auc__step {
  margin: 1.6rem 0 0;
}
.auc__step-head {
  margin: 0 0 0.2rem;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(247, 249, 252, 0.38);
}
.auc__step-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}
.auc__step.is-photos {
  margin-top: 2rem;
  padding-top: 1.4rem;
  border-top: 1px solid rgba(247, 249, 252, 0.08);
}
.auc__step.is-photos .auc__picker { margin-top: 0.55rem; }
.auc__finish {
  display: grid;
  justify-items: stretch;
  gap: 0.5rem;
  margin-top: 2rem;
  padding-top: 1.4rem;
  border-top: 1px solid rgba(247, 249, 252, 0.08);
}
.auc__finish .auc__ghost.is-quiet {
  justify-self: center;
  border-color: transparent;
  color: rgba(247, 249, 252, 0.45);
}
/* Collapsed audience: a settled fact on one line, not a question. */
.auc__audience {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
  margin: 1.1rem 0 0;
  padding-bottom: 0.9rem;
  border-bottom: 1px solid rgba(247, 249, 252, 0.08);
}
.auc__audience-line {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 0.15rem 0.5rem;
  margin: 0;
  min-width: 0;
}
.auc__audience-eyebrow {
  font-size: 0.72rem;
  letter-spacing: 0.02em;
  color: rgba(247, 249, 252, 0.42);
}
.auc__audience-value {
  font-size: 0.95rem;
  font-weight: 700;
  color: #f7f9fc;
}
.auc__audience-detail {
  font-size: 0.78rem;
  color: rgba(247, 249, 252, 0.42);
}
.auc__link {
  flex: none;
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: 0 0.15rem;
  border: 0;
  background: none;
  color: #39d5ff;
  font: inherit;
  font-size: 0.84rem;
  font-weight: 650;
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
}
.auc__link:focus-visible { outline: 2px solid #39d5ff; outline-offset: 3px; border-radius: 0.35rem; }
.auc__resume {
  margin: 1.25rem 0 0;
  padding: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 0.9rem;
  background: rgba(255, 255, 255, 0.025);
}
.auc__resume h2 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}
.auc__resume p {
  margin: 0.4rem 0 0;
  color: rgba(247, 249, 252, 0.55);
  font-size: 0.86rem;
  line-height: 1.5;
}
.auc__resume-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
  margin-top: 0.95rem;
}
.auc__queue-tools {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 0.6rem 0 0;
}
.auc__ghost {
  min-height: 44px;
  padding: 0 0.85rem;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 0.7rem;
  background: transparent;
  color: #f7f9fc;
  font: inherit;
  font-size: 0.82rem;
  font-weight: 650;
  cursor: pointer;
}
.auc__ghost:hover:not(:disabled) { background: rgba(255, 255, 255, 0.05); }
.auc__ghost:focus-visible { outline: 2px solid #39d5ff; outline-offset: 2px; }
.auc__ghost:disabled { opacity: 0.45; cursor: default; }
.auc__ghost.is-quiet { color: rgba(247, 249, 252, 0.6); border-color: rgba(255, 255, 255, 0.09); }
.auc__review {
  margin-top: 1.1rem;
  padding: 0.85rem;
  border: 1px solid rgba(255, 255, 255, 0.09);
  border-radius: 0.8rem;
  background: rgba(255, 255, 255, 0.02);
}
.auc__review .auc__label { margin-top: 0; }
.auc__review-line {
  margin: 0;
  color: rgba(247, 249, 252, 0.8);
  font-size: 0.88rem;
  line-height: 1.5;
}
.auc__error {
  display: flex;
  align-items: flex-start;
  gap: 0.4rem;
  color: #fca5a5;
  font-size: 0.88rem;
  line-height: 1.5;
}
.auc__error-mark {
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
.auc__page { margin-top: 1.15rem; }
.auc__page-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.85rem;
  width: 100%;
  min-height: 4.5rem;
  margin-top: 0.35rem;
  padding: 0.8rem 0.9rem;
  border-radius: 0.85rem;
  border: 1px solid rgba(247, 249, 252, 0.28);
  background: rgba(247, 249, 252, 0.04);
  color: #f7f9fc;
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.auc__page-btn.is-on {
  border-color: #f7f9fc;
  background: rgba(247, 249, 252, 0.1);
}
.auc__page-btn:disabled { opacity: 0.55; cursor: default; }
.auc__page-btn:focus-visible { outline: 2px solid #39d5ff; outline-offset: 3px; }
.auc__page-copy { display: grid; gap: 0.2rem; min-width: 0; }
.auc__page-title {
  font-size: 1rem;
  font-weight: 750;
  letter-spacing: -0.02em;
  color: #f7f9fc;
}
.auc__page-support {
  color: rgba(247, 249, 252, 0.78);
  font-size: 0.84rem;
  line-height: 1.35;
}
.auc__page-switch {
  flex: none;
  width: 2.75rem;
  height: 1.6rem;
  border-radius: 999px;
  border: 1px solid rgba(247, 249, 252, 0.45);
  background: transparent;
  position: relative;
}
.auc__page-switch::after {
  content: '';
  position: absolute;
  top: 0.15rem;
  left: 0.15rem;
  width: 1.2rem;
  height: 1.2rem;
  border-radius: 999px;
  background: rgba(247, 249, 252, 0.55);
}
.auc__page-btn.is-on .auc__page-switch {
  background: #f7f9fc;
  border-color: #f7f9fc;
}
.auc__page-btn.is-on .auc__page-switch::after {
  left: 1.28rem;
  background: #08090a;
}
.auc__page-help {
  margin: 0.45rem 0 0;
  color: #f7f9fc;
  font-size: 0.86rem;
  line-height: 1.45;
}
.auc__rocksnaps { margin-top: 0.4rem; }
.auc__rocksnaps-btn {
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
.auc__rocksnaps-btn.is-on {
  border-color: rgba(255, 255, 255, 0.42);
  color: #f7f9fc;
}
.auc__rocksnaps-btn:disabled { opacity: 0.45; cursor: default; }
.auc__rocksnaps-btn:focus-visible { outline: 2px solid #39d5ff; outline-offset: 3px; }
.auc__rocksnaps-hold {
  margin-top: 1rem;
  padding: 0.9rem 1rem;
  border: 1px solid rgba(252, 165, 165, 0.35);
  border-radius: 0.85rem;
  color: #f7f9fc;
  line-height: 1.45;
}
.auc__rocksnaps-hold p { margin: 0 0 0.45rem; }
.auc__rocksnaps-hold .auc__ghost { display: inline-flex; align-items: center; text-decoration: none; }
.auc__publish {
  min-height: 48px; width: 100%; margin-top: 1.35rem; border: 0; border-radius: 0.9rem; font-weight: 750;
  background: linear-gradient(100deg, #4ca6ff 0%, #39d5ff 48%, #45e3ae 100%);
  color: #04140f; cursor: pointer; font: inherit; font-weight: 750;
}
.auc__publish.is-inline {
  width: auto;
  min-height: 44px;
  margin-top: 0;
  padding: 0 1rem;
  border-radius: 0.7rem;
  font-size: 0.86rem;
}
.auc__publish:hover:not(:disabled) { filter: brightness(1.06); }
.auc__publish:active:not(:disabled) { filter: brightness(0.94); }
.auc__publish:focus-visible {
  outline: 2px solid #39d5ff;
  outline-offset: 3px;
}
.auc--show .auc__publish {
  margin-top: 1.25rem;
  min-height: 52px;
  border-radius: 0;
  font-size: 1rem;
}
.auc--show .auc__publish.is-inline {
  min-height: 44px;
  border-radius: 0.7rem;
  font-size: 0.86rem;
}
.auc__publish:disabled { opacity: 0.45; cursor: default; filter: none; }
.auc__picker { margin: 0 0 0.35rem; }
.auc--show .auc__picker { margin-top: 0.4rem; }
.auc--show .auc__picker :deep(.fq-media-picker__block) {
  min-height: 9rem;
  background: #0b0e14;
  border-color: rgba(247, 249, 252, 0.1);
}
.auc--show :deep(.fq-media-prev.is-composer) {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.65rem;
}
.auc--show :deep(.fq-media-prev__item),
.auc--show :deep(.fq-media-prev.is-composer .fq-media-prev__item) {
  width: auto;
}
.auc--show :deep(.fq-media-prev.is-composer .fq-media-prev__frame) {
  border-radius: 0.5rem;
}
.auc--show :deep(.fq-media-prev__cover) {
  letter-spacing: 0.04em;
  text-transform: none;
  font-size: 0.66rem;
}
.auc--show :deep(.fq-media-prev__state.is-ready) {
  color: rgba(247, 249, 252, 0.7);
}

.auc__hint-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
}
.auc__count {
  margin: 0.45rem 0 0;
  color: rgba(247, 249, 252, 0.72);
  font-size: 0.78rem;
  font-variant-numeric: tabular-nums;
}
@media (max-width: 390px) {
  .auc__hint-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }
  /* 60 photos on a 390px phone: two readable columns beat six thumbnails. */
  .auc--show :deep(.fq-media-prev.is-composer) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (prefers-reduced-motion: reduce) {
  .auc__publish { transition: none; }
}
</style>
