<template>
  <Teleport to="body">
    <div v-if="open" class="gallery-picker" role="dialog" aria-modal="true" aria-labelledby="gallery-picker-title">
      <button class="gallery-picker__backdrop" type="button" aria-label="Close gallery picker" @click="emit('close')" />
      <section class="gallery-picker__sheet">
        <header class="gallery-picker__header">
          <div>
            <p>Gallery</p>
            <h2 id="gallery-picker-title">Choose a Gallery</h2>
          </div>
          <button type="button" class="gallery-picker__close" aria-label="Close" @click="emit('close')">
            <component :is="icons.close" :size="20" :stroke-width="2" />
          </button>
        </header>

        <p class="gallery-picker__promise">
          {{ promiseCopy }}
        </p>

        <button
          type="button"
          class="gallery-picker__upload"
          @click="requestCreate"
        >
          <span class="gallery-picker__upload-icon" aria-hidden="true">
            <component :is="icons.image" :size="20" :stroke-width="1.8" />
          </span>
          <span class="gallery-picker__upload-copy">
            <strong>Upload new photos</strong>
            <small>{{ uploadHint }}</small>
          </span>
          <component :is="icons.chevronRight" :size="18" :stroke-width="1.8" aria-hidden="true" />
        </button>

        <div class="gallery-picker__body">
          <div v-if="loading" class="gallery-picker__state" role="status">Loading your galleries…</div>
          <div v-else-if="error" class="gallery-picker__state">
            <p>Couldn’t load your galleries.</p>
            <button type="button" @click="load">Try again</button>
          </div>
          <div v-else-if="!galleries.length" class="gallery-picker__state">
            <p>{{ emptyCopy }}</p>
            <p class="gallery-picker__empty-hint">{{ emptyHint }}</p>
            <button type="button" @click="requestCreate">Upload photos</button>
          </div>
          <template v-else>
            <section v-if="grouped.nights.length" class="gallery-picker__group">
              <p class="gallery-picker__list-kicker">Recent Nights</p>
              <ol class="gallery-picker__list">
                <li v-for="gallery in grouped.nights" :key="gallery.id">
                  <button type="button" class="gallery-picker__row" @click="emit('select', gallery)">
                    <FaneqoGalleryStack
                      v-if="stackMedia(gallery).length"
                      class="gallery-picker__stack"
                      :media="stackMedia(gallery)"
                      :title="gallery.title || 'Show photos'"
                      :count="photoCount(gallery)"
                      size="attachment"
                    />
                    <span class="gallery-picker__copy">
                      <strong>{{ gallery.title || 'Show photos' }}</strong>
                      <span>{{ nightLine(gallery) }}</span>
                      <small>{{ photoCount(gallery) }} photos</small>
                    </span>
                  </button>
                </li>
              </ol>
            </section>
            <section v-if="grouped.general.length" class="gallery-picker__group">
              <p class="gallery-picker__list-kicker">General</p>
              <ol class="gallery-picker__list">
                <li v-for="gallery in grouped.general" :key="gallery.id">
                  <button type="button" class="gallery-picker__row" @click="emit('select', gallery)">
                    <FaneqoGalleryStack
                      v-if="stackMedia(gallery).length"
                      class="gallery-picker__stack"
                      :media="stackMedia(gallery)"
                      :title="gallery.title || 'Tour photos'"
                      :count="photoCount(gallery)"
                      size="attachment"
                    />
                    <span class="gallery-picker__copy">
                      <strong>{{ gallery.title || 'Tour photos' }}</strong>
                      <small>{{ photoCount(gallery) }} photos</small>
                    </span>
                  </button>
                </li>
              </ol>
            </section>
          </template>
        </div>
      </section>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import FaneqoGalleryStack from '~/components/media/FaneqoGalleryStack.vue'
import { faneqoIcons } from '~/utils/messages/faneqoIcons'
import { galleryNightLine, groupComposerGalleries } from '~/utils/messages/composerPresentation'
import { buildComposerGalleryCreateQuery, isCompatibleBroadcastGallery } from '~/utils/updates/galleryComposerReturn'

const props = defineProps({
  open: { type: Boolean, default: false },
  bandId: { type: [String, Number], default: null },
  audienceType: { type: String, default: '' },
  recapId: { type: [String, Number], default: null },
  returnTo: { type: String, default: '/messages' },
})
const emit = defineEmits(['close', 'select', 'create'])
const icons = faneqoIcons
const updates = useArtistUpdates()
const galleries = ref([])
const loading = ref(false)
const error = ref(false)
let generation = 0

const createQuery = computed(() => buildComposerGalleryCreateQuery({
  bandId: props.bandId,
  from: props.returnTo || '/messages',
  audienceType: props.audienceType,
  recapId: props.recapId,
}))

const createPath = computed(() => ({
  path: '/galleries/new',
  query: createQuery.value,
}))

const promiseCopy = computed(() => props.audienceType === 'show_attendees'
  ? 'Photos shared here stay with the people from this show.'
  : 'Upload something new or choose a gallery you’ve already published.')

const uploadHint = computed(() => props.audienceType === 'show_attendees'
  ? 'Create photos for this show and attach them.'
  : 'Create a new gallery and attach it to this message.')

const emptyCopy = computed(() => props.audienceType === 'show_attendees'
  ? 'No galleries yet for this show.'
  : 'No galleries yet.')

const emptyHint = computed(() =>
  'Upload photos and Faneqo will create the gallery for you.'
)

function requestCreate() {
  emit('create', createPath.value)
  emit('close')
}

const grouped = computed(() => groupComposerGalleries(galleries.value))

function stackMedia(gallery) {
  return Array.isArray(gallery?.media) ? gallery.media : []
}

function photoCount(gallery) {
  return Number(gallery?.photoCount || gallery?.media?.length || 0)
}

function nightLine(gallery) {
  return galleryNightLine(gallery)
}

async function load() {
  const bandId = Number(props.bandId)
  if (!Number.isInteger(bandId) || bandId <= 0) {
    galleries.value = []
    error.value = true
    return
  }
  const run = ++generation
  loading.value = true
  error.value = false
  try {
    const result = await updates.listMine({ bandId })
    if (run !== generation) return
    galleries.value = (result?.data || []).filter((row) =>
      isCompatibleBroadcastGallery(row, {
        audienceType: props.audienceType,
        recapId: props.recapId,
      }) &&
      Number(row?.photoCount || row?.media?.length || 0) > 0 &&
      Array.isArray(row?.media) &&
      row.media.length > 0
    )
  } catch {
    if (run === generation) {
      galleries.value = []
      error.value = true
    }
  } finally {
    if (run === generation) loading.value = false
  }
}

watch(
  () => [props.open, props.bandId, props.audienceType, props.recapId],
  ([isOpen]) => {
    if (isOpen) load()
    else generation += 1
  },
  { immediate: true }
)
</script>

<style scoped>
.gallery-picker {
  position: fixed;
  inset: 0;
  z-index: 1200;
  display: grid;
  place-items: end center;
}

.gallery-picker__backdrop {
  position: absolute;
  inset: 0;
  width: 100%;
  border: 0;
  background: rgba(0, 0, 0, 0.72);
  backdrop-filter: blur(8px);
}

.gallery-picker__sheet {
  position: relative;
  display: flex;
  flex-direction: column;
  width: min(100%, 38rem);
  max-height: min(82dvh, 46rem);
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1.35rem 1.35rem 0 0;
  background: #0a0b0f;
  color: #f8fafc;
  box-shadow: 0 -24px 80px rgba(0, 0, 0, 0.55);
}

.gallery-picker__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.1rem 1.1rem 0.55rem;
}

.gallery-picker__header p {
  margin: 0;
  color: rgba(248, 250, 252, 0.42);
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.gallery-picker__header h2 {
  margin: 0.12rem 0 0;
  font-size: 1.28rem;
  letter-spacing: -0.04em;
}

.gallery-picker__close {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
}

.gallery-picker__promise {
  margin: 0;
  padding: 0 1.1rem 0.75rem;
  color: rgba(248, 250, 252, 0.52);
  font-size: 0.78rem;
  line-height: 1.5;
}

.gallery-picker__upload {
  display: grid;
  grid-template-columns: 2.5rem minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.7rem;
  width: calc(100% - 1.5rem);
  min-height: 3.4rem;
  margin: 0 0.75rem 0.55rem;
  padding: 0.55rem 0.65rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 0.9rem;
  background: rgba(255, 255, 255, 0.04);
  color: inherit;
  text-align: left;
  cursor: pointer;
}

.gallery-picker__upload:hover,
.gallery-picker__upload:focus-visible {
  background: rgba(255, 255, 255, 0.07);
  outline: none;
}

.gallery-picker__upload:focus-visible {
  outline: 2px solid #39d5ff;
  outline-offset: 2px;
}

.gallery-picker__upload-icon {
  display: grid;
  place-items: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.7rem;
  background: rgba(255, 255, 255, 0.06);
  color: #f5f5f6;
}

.gallery-picker__upload-copy {
  min-width: 0;
  display: grid;
  gap: 0.12rem;
}

.gallery-picker__upload-copy strong {
  font-size: 0.88rem;
  font-weight: 750;
}

.gallery-picker__upload-copy small {
  color: rgba(248, 250, 252, 0.5);
  font-size: 0.7rem;
  line-height: 1.35;
}

.gallery-picker__body {
  min-height: 0;
  overflow-y: auto;
  padding-bottom: calc(0.9rem + env(safe-area-inset-bottom, 0px));
}

.gallery-picker__list-kicker {
  margin: 0.15rem 1.1rem 0.35rem;
  color: rgba(248, 250, 252, 0.42);
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.gallery-picker__list {
  list-style: none;
  margin: 0;
  padding: 0 0.75rem;
}

.gallery-picker__row {
  width: 100%;
  display: grid;
  grid-template-columns: minmax(6.5rem, 8.5rem) minmax(0, 1fr);
  align-items: center;
  gap: 0.85rem;
  min-height: 5.15rem;
  padding: 0.7rem 0.35rem;
  border: 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
}

.gallery-picker__stack {
  width: 100%;
  pointer-events: none;
}

.gallery-picker__row:hover,
.gallery-picker__row:focus-visible {
  border-radius: 0.8rem;
  background: rgba(255, 255, 255, 0.055);
  outline: none;
}

.gallery-picker__cover {
  width: 4.3rem;
  height: 4.3rem;
  display: grid;
  place-items: center;
  overflow: hidden;
  border-radius: 0.72rem;
  background: rgba(109, 230, 255, 0.08);
  color: #6de6ff;
}

.gallery-picker__cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.gallery-picker__copy {
  min-width: 0;
  display: grid;
  gap: 0.15rem;
}

.gallery-picker__copy strong,
.gallery-picker__copy span,
.gallery-picker__copy small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.gallery-picker__copy strong { font-size: 0.86rem; }
.gallery-picker__copy span { color: rgba(248, 250, 252, 0.58); font-size: 0.73rem; }
.gallery-picker__copy small { color: rgba(248, 250, 252, 0.38); font-size: 0.66rem; }

.gallery-picker__state {
  min-height: 10rem;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 0.55rem;
  padding: 1.5rem 1.25rem;
  color: rgba(248, 250, 252, 0.6);
  text-align: center;
}

.gallery-picker__empty-hint {
  margin: 0;
  max-width: 18rem;
  color: rgba(248, 250, 252, 0.42);
  font-size: 0.76rem;
  line-height: 1.45;
}

.gallery-picker__state button {
  min-height: 40px;
  padding: 0.55rem 0.8rem;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 0.75rem;
  background: #f5f5f6;
  color: #0a0b0e;
  font-weight: 700;
}

@media (min-width: 768px) {
  .gallery-picker { place-items: center; }
  .gallery-picker__sheet { border-radius: 1.35rem; }
}
</style>
