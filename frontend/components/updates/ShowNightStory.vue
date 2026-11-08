<template>
  <article class="sns" :class="{ 'is-locked': locked, 'is-there': youWereThere, 'is-show': isShow }">
    <p class="sns__artist">{{ artistLine }}</p>

    <header class="sns__caption-block">
      <h1 v-if="placeLine" class="sns__place">{{ placeLine }}</h1>
      <p v-if="cityLine" class="sns__where">{{ cityLine }}</p>
      <p v-if="dateLine" class="sns__date">{{ dateLine }}</p>
      <p v-if="youWereThere && isShow" class="sns__there">
        <span class="sns__check" aria-hidden="true">✓</span>
        You were there
      </p>
      <p v-if="youWereThere && firstShow && isShow" class="sns__first">Your first show</p>
      <p v-if="!locked && caption" class="sns__caption">{{ caption }}</p>
      <p v-if="!locked && countLine" class="sns__count">{{ countLine }}</p>
    </header>

    <div v-if="showActions" class="sns__actions" aria-label="Gallery actions">
      <button
        v-if="allowPassport"
        type="button"
        class="sns__action"
        :disabled="saving"
        @click="emit(saved ? 'remove' : 'save', { artistUpdateId: updateId })"
      >
        <FaneqoGalleryMemoryMotion
          :artist-name="artistName"
          :photo-count="resolvedPhotoCount"
          :saving="saving"
          :saved="saved"
        />
        <span>{{ saving ? 'Saving…' : saved ? 'Saved to FanPassport' : 'Save to FanPassport' }}</span>
      </button>
      <button
        v-if="allowShare"
        type="button"
        class="sns__action is-share"
        :disabled="sharing"
        @click="emit('share', { artistUpdateId: updateId })"
      >
        {{ sharing ? 'Opening…' : 'Share' }}
      </button>
      <p v-if="actionStatus" class="sns__action-status" role="status">{{ actionStatus }}</p>
    </div>

    <div v-if="!locked" class="sns__media">
      <FaneqoMediaGrid
        :items="media"
        variant="gallery"
        @open="onOpen"
      />
    </div>

    <div v-if="locked" class="sns__locked">
      <p class="sns__locked-copy">{{ lockedCopy }}</p>
      <div class="sns__ask">
        <slot name="locked-action" />
      </div>
    </div>

    <FaneqoMediaLightbox
      :open="lightboxOpen"
      :items="media"
      :start-index="lightboxIndex"
      :title="artistName"
      zoomable
      @close="lightboxOpen = false"
    />
  </article>
</template>

<script setup>
import { computed, ref } from 'vue'
import FaneqoMediaGrid from '~/components/media/FaneqoMediaGrid.vue'
import FaneqoMediaLightbox from '~/components/media/FaneqoMediaLightbox.vue'
import FaneqoGalleryMemoryMotion from '~/components/rive/FaneqoGalleryMemoryMotion.vue'
import { formatShowNightDate } from '~/utils/shows/formatShowNightDate'
import {
  nightStoryCountLine,
  nightStoryHasShowContext,
  nightStoryLockedCopy,
  nightStoryPlaceLine,
} from '~/utils/updates/nightStoryCopy'

const props = defineProps({
  updateId: { type: [String, Number], default: null },
  artistName: { type: String, default: '' },
  city: { type: String, default: '' },
  venue: { type: String, default: '' },
  date: { type: [String, Date, Number], default: null },
  title: { type: String, default: '' },
  caption: { type: String, default: '' },
  youWereThere: { type: Boolean, default: false },
  firstShow: { type: Boolean, default: false },
  locked: { type: Boolean, default: false },
  lockReason: { type: String, default: '' },
  visibility: { type: String, default: '' },
  media: { type: Array, default: () => [] },
  photoCount: { type: Number, default: 0 },
  hasShowContext: { default: undefined },
  allowPassport: { type: Boolean, default: false },
  allowShare: { type: Boolean, default: false },
  saved: { type: Boolean, default: false },
  saving: { type: Boolean, default: false },
  sharing: { type: Boolean, default: false },
  actionStatus: { type: String, default: '' },
})

const emit = defineEmits(['open', 'save', 'remove', 'share'])

const lightboxOpen = ref(false)
const lightboxIndex = ref(0)
const showActions = computed(() =>
  (props.allowPassport && !props.locked && !!props.updateId) || props.allowShare
)
const resolvedPhotoCount = computed(() => Number(props.photoCount) || (props.media || []).length)
const isShow = computed(() => nightStoryHasShowContext({
  hasShowContext: props.hasShowContext,
  city: props.city,
  venue: props.venue,
  visibility: props.visibility,
}))

const artistLine = computed(() => String(props.artistName || '').trim() || 'Artist')

const placeLine = computed(() => nightStoryPlaceLine({
  title: props.title,
  city: props.city,
  venue: props.venue,
  hasShowContext: isShow.value,
}))

const cityLine = computed(() => {
  if (!isShow.value) return ''
  const city = String(props.city || '').trim()
  if (!city || city === placeLine.value) return ''
  return city
})

const dateLine = computed(() => {
  if (!isShow.value) return ''
  return formatShowNightDate(props.date)
})

const countLine = computed(() => nightStoryCountLine(resolvedPhotoCount.value))

const lockedCopy = computed(() => nightStoryLockedCopy({
  lockReason: props.lockReason,
  visibility: props.visibility,
  artistName: props.artistName,
}))

function onOpen({ index }) {
  lightboxIndex.value = index || 0
  lightboxOpen.value = true
  emit('open', { index: lightboxIndex.value })
}
</script>

<style scoped>
.sns {
  --sns-ink: #f7f9fc;
  --sns-mute: rgba(247, 249, 252, 0.62);
  --sns-faint: rgba(247, 249, 252, 0.46);
  --sns-echo: #45e3ae;
  color: var(--sns-ink);
  font-family: Poppins, ui-sans-serif, system-ui, sans-serif;
  max-width: min(100%, 56rem);
}

.sns__artist {
  margin: 0 0 0.85rem;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #39d5ff;
  animation: sns-arrive 0.21s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.sns__media {
  margin-top: 1.35rem;
  animation: sns-arrive 0.28s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.sns__media :deep(.fq-media-grid.is-pair-stack .fq-media-grid__cell img),
.sns__media :deep(.fq-media-grid.is-editorial .fq-media-grid__cell img) {
  max-height: min(46vh, 20rem);
}

.sns__media :deep(.fq-media-grid.is-pair-split) {
  max-height: min(52vh, 22rem);
}

.sns__caption-block {
  animation: sns-arrive 0.21s 0.04s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.sns__place {
  margin: 0;
  font-size: clamp(1.45rem, 5vw, 2.1rem);
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 1.05;
}

.sns__where,
.sns__date {
  margin: 0.35rem 0 0;
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--sns-mute);
}

.sns__there {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin: 0.7rem 0 0;
  font-size: 0.92rem;
  font-weight: 600;
  color: var(--sns-echo);
}

.sns__check { color: #39d5ff; }

.sns__first {
  margin: 0.25rem 0 0;
  font-size: 0.82rem;
  color: var(--sns-faint);
  min-height: 1.1rem;
}

.sns__caption {
  margin: 0.85rem 0 0;
  max-width: 36rem;
  font-size: 1rem;
  line-height: 1.55;
  color: rgba(247, 249, 252, 0.82);
  white-space: pre-wrap;
}

.sns__count {
  margin: 0.55rem 0 0;
  font-size: 0.75rem;
  color: var(--sns-faint);
}

.sns__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.65rem 0.9rem;
  margin-top: 1rem;
}

.sns__action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.42rem;
  min-height: 44px;
  padding: 0.65rem 0.95rem;
  border: 1px solid rgba(69, 227, 174, 0.42);
  border-radius: 999px;
  background: rgba(69, 227, 174, 0.08);
  color: #7bf1ca;
  font: inherit;
  font-size: 0.82rem;
  font-weight: 650;
  cursor: pointer;
}

.sns__action.is-share {
  border-color: rgba(247, 249, 252, 0.18);
  background: rgba(247, 249, 252, 0.04);
  color: rgba(247, 249, 252, 0.78);
}

.sns__action:disabled { opacity: 0.5; cursor: wait; }
.sns__action:focus-visible { outline: 2px solid #39d5ff; outline-offset: 3px; }
.sns__action-status { width: 100%; margin: 0; font-size: 0.78rem; color: var(--sns-faint); }

.sns__locked { margin-top: 1.15rem; }
.sns__locked-copy { margin: 0; max-width: 24rem; font-size: 0.95rem; line-height: 1.5; color: var(--sns-mute); }
.sns__ask { margin-top: 0.85rem; }

.sns__ask :deep(a),
.sns__ask :deep(button) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 0 1rem;
  border: 1px solid rgba(69, 227, 174, 0.45);
  background: transparent;
  color: #45e3ae;
  font: inherit;
  font-size: 0.92rem;
  text-decoration: none;
  cursor: pointer;
}

@keyframes sns-arrive { from { opacity: 0; } to { opacity: 1; } }

@media (max-width: 390px) {
  .sns__place { overflow-wrap: anywhere; }
  .sns__where, .sns__date, .sns__caption { overflow-wrap: anywhere; }
}

@media (prefers-reduced-motion: reduce) {
  .sns__artist, .sns__media, .sns__caption-block { animation: none; }
}
</style>
