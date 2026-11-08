<template>
  <Teleport to="body">
    <div v-if="open && gallery" class="ngv" role="dialog" aria-modal="true" aria-labelledby="ngv-title">
      <button type="button" class="ngv__backdrop" aria-label="Close gallery" @click="close" />
      <div class="ngv__sheet">
        <header class="ngv__head">
          <FaneqoIconButton
            class="ngv__ctrl"
            name="close"
            size="lg"
            aria-label="Close gallery"
            @click="close"
          />
          <span class="ngv__head-gap" aria-hidden="true" />
          <FaneqoIconButton
            v-if="sharePath && !locked"
            class="ngv__ctrl ngv__ctrl--end"
            name="share"
            size="lg"
            :disabled="sharing"
            :aria-label="sharing ? 'Sharing gallery' : 'Share gallery'"
            @click="share"
          />
          <span v-else class="ngv__ctrl-spacer" />
        </header>
        <div class="ngv__body">
          <div class="ngv__stage">
          <div class="ngv__intro">
            <ArtistWorldIdentity
              v-if="artistName"
              :name="artistName"
              :to="artistPath"
              :image="artistImage"
              :focal-x="artistFocalX"
              :focal-y="artistFocalY"
              size="viewer"
            />
            <h2 id="ngv-title">{{ gallery.title || 'Photos' }}</h2>
            <p v-if="nightLine" class="ngv__night">
              <NuxtLink v-if="nightHref && !publicExperience" :to="nightHref">{{ nightLine }}</NuxtLink>
              <span v-else>{{ nightLine }}</span>
            </p>
            <p v-if="countLine" class="ngv__count">{{ countLine }}</p>
          </div>
          <FaneqoMediaGrid
            v-if="media.length"
            :items="media"
            variant="gallery"
            surface="viewer"
            @open="onOpen"
          />
          <div v-else-if="locked" class="ngv__locked">
            <div v-if="teaserUrl" class="ngv__teaser-wrap">
              <img class="ngv__teaser" :src="teaserUrl" alt="">
            </div>
            <p class="ngv__lock-copy">{{ lockCopy || 'For the people who were there.' }}</p>
          </div>
          <p v-else class="ngv__empty">No photos in this gallery yet.</p>
          <div v-if="caption || showThere" class="ngv__after">
            <p v-if="caption" class="ngv__caption">{{ caption }}</p>
            <p v-if="showThere" class="ngv__there">You were there</p>
          </div>
          <p v-if="shareStatus" class="ngv__status" role="status">{{ shareStatus }}</p>
          </div>
        </div>
      </div>
      <FaneqoMediaLightbox
        :open="lightboxOpen"
        :items="media"
        :start-index="lightboxIndex"
        :title="gallery.title || 'Photos'"
        :shareable="!!sharePath && !locked"
        zoomable
        @close="lightboxOpen = false"
        @share="share"
      />
    </div>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, onUnmounted, ref, watch } from 'vue'
import ArtistWorldIdentity from '~/components/nights/ArtistWorldIdentity.vue'
import FaneqoIconButton from '~/components/ui/FaneqoIconButton.vue'
import FaneqoMediaGrid from '~/components/media/FaneqoMediaGrid.vue'
import FaneqoMediaLightbox from '~/components/media/FaneqoMediaLightbox.vue'
import { authorizedStackIndex } from '~/utils/galleries/stackOpenNavigation'
import { nightStoryCountLine } from '~/utils/updates/nightStoryCopy'
import { shareFaneqoUrl } from '~/utils/share/faneqoShare'
import { resolveFrontendOrigin } from '~/utils/site/faneqoOrigin'
import { lockOverlayScroll, unlockOverlayScroll } from '~/utils/ui/overlayScrollLock'

const props = defineProps({
  open: { type: Boolean, default: false },
  gallery: { type: Object, default: null },
  sharePath: { type: String, default: '' },
  publicExperience: { type: Boolean, default: false },
  locked: { type: Boolean, default: false },
  lockCopy: { type: String, default: '' },
  teaserUrl: { type: String, default: '' },
  artistName: { type: String, default: '' },
  artistPath: { type: String, default: '' },
  artistImage: { type: String, default: '' },
  artistFocalX: { type: [Number, String], default: 50 },
  artistFocalY: { type: [Number, String], default: 50 },
  placeLine: { type: String, default: '' },
  nightDate: { type: String, default: '' },
  nightHref: { type: String, default: '' },
  youWereThere: { type: Boolean, default: false },
  startIndex: { type: Number, default: 0 },
  autoOpenLightbox: { type: Boolean, default: false },
})

const emit = defineEmits(['close'])
const config = useRuntimeConfig()
const sharing = ref(false)
const shareStatus = ref('')
const lightboxOpen = ref(false)
const lightboxIndex = ref(0)

const media = computed(() => {
  if (props.locked) return []
  return Array.isArray(props.gallery?.media) ? props.gallery.media : []
})
const countLine = computed(() => {
  if (props.locked && props.publicExperience) return ''
  const n = media.value.length || props.gallery?.photoCount
  return nightStoryCountLine(n)
})
const caption = computed(() => String(props.gallery?.caption || '').trim())
const nightLine = computed(() => [props.placeLine, props.nightDate].filter(Boolean).join(' · '))
const showThere = computed(() => props.publicExperience && props.youWereThere && !props.locked)
const shareText = computed(() => [countLine.value, props.placeLine].filter(Boolean).join(' · '))

function onKey(event) {
  if (event.key === 'Escape' && !lightboxOpen.value) close()
}

function openAuthorizedLightbox(index) {
  if (props.locked) return
  const next = authorizedStackIndex(index, media.value)
  if (next == null) return
  lightboxIndex.value = next
  lightboxOpen.value = true
}

watch(() => props.open, (open) => {
  if (!open) {
    lightboxOpen.value = false
    shareStatus.value = ''
  }
  if (!import.meta.client) return
  if (open) {
    lockOverlayScroll('night-gallery-viewer')
    window.addEventListener('keydown', onKey)
    if (props.autoOpenLightbox) {
      nextTick(() => openAuthorizedLightbox(props.startIndex))
    }
  } else {
    window.removeEventListener('keydown', onKey)
    unlockOverlayScroll('night-gallery-viewer')
  }
})

onUnmounted(() => {
  if (import.meta.client) {
    window.removeEventListener('keydown', onKey)
    unlockOverlayScroll('night-gallery-viewer')
  }
})

function close() {
  emit('close')
}

function onOpen(payload) {
  openAuthorizedLightbox(payload?.index)
}

async function share() {
  // Generic native-share / copy. Future Share Kit 2.0 should replace this call, not rebuild the viewer.
  if (!props.sharePath || sharing.value) return
  sharing.value = true
  shareStatus.value = ''
  try {
    const origin = resolveFrontendOrigin({ configuredOrigin: config.public?.baseUrl })
    const result = await shareFaneqoUrl({
      title: props.gallery?.title || 'Gallery',
      text: shareText.value,
      canonicalPath: props.sharePath,
      origin,
    })
    shareStatus.value = result.method === 'share' ? 'Share sheet opened.' : 'Link copied.'
  } catch (error) {
    if (error?.name !== 'AbortError') {
      shareStatus.value = error?.message || 'Could not share this gallery.'
    }
  } finally {
    sharing.value = false
  }
}
</script>

<style scoped>
.ngv {
  position: fixed;
  inset: 0;
  z-index: 100000000;
  width: 100dvw;
  height: 100dvh;
  max-width: 100dvw;
  max-height: 100dvh;
  overflow: hidden;
  color: #f5f5f6;
  font-family: Poppins, ui-sans-serif, system-ui, sans-serif;
}
.ngv__backdrop {
  position: absolute;
  inset: 0;
  border: 0;
  background: #050506;
}
.ngv__sheet {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  max-width: 100dvw;
  max-height: 100dvh;
  overflow: hidden;
  background: #050506;
}
.ngv__head {
  display: grid;
  grid-template-columns: 5.5rem 1fr 5.5rem;
  align-items: center;
  min-height: 52px;
  padding: 0.3rem 0.7rem;
  padding-top: calc(0.3rem + env(safe-area-inset-top, 0px));
}
.ngv__head-gap { min-width: 0; }
.ngv :deep(.ngv__ctrl) {
  min-width: 48px;
  min-height: 48px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 999px;
  background: rgba(8, 9, 11, 0.42);
  color: rgba(245, 245, 246, 0.78);
  transition: background 140ms ease, color 140ms ease, transform 140ms ease;
}
.ngv :deep(.ngv__ctrl--end) { justify-self: end; }
.ngv :deep(.ngv__ctrl:hover:not(:disabled)) {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}
.ngv :deep(.ngv__ctrl.is-pressed) { transform: scale(0.96); }
.ngv :deep(.ngv__ctrl:focus-visible) {
  outline: 2px solid #39d5ff;
  outline-offset: 3px;
}
.ngv__ctrl-spacer {
  min-width: 48px;
  min-height: 48px;
}
@media (prefers-reduced-motion: reduce) {
  .ngv :deep(.ngv__ctrl),
  .ngv :deep(.ngv__ctrl.is-pressed) {
    transition: none;
    transform: none;
  }
}
.ngv__body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: none;
  padding: 0.85rem 0.85rem calc(1.25rem + env(safe-area-inset-bottom, 0px));
}
.ngv__body::-webkit-scrollbar { display: none; }
.ngv__stage {
  width: 100%;
  max-width: min(100%, 82.5rem);
  margin: 0 auto;
}
.ngv__intro {
  margin: 0 0 0.95rem;
  max-width: 36rem;
}
.ngv__intro h2 {
  margin: 0.7rem 0 0;
  font-size: 1.15rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.2;
  overflow-wrap: anywhere;
}
.ngv__night {
  margin: 0.35rem 0 0;
  color: rgba(245, 245, 246, 0.52);
  font-size: 0.88rem;
  overflow-wrap: anywhere;
}
.ngv__night a {
  color: inherit;
  text-decoration: none;
}
.ngv__night a:hover { color: #fff; }
.ngv__night a:focus-visible {
  outline: 2px solid #39d5ff;
  outline-offset: 3px;
}
.ngv__count {
  margin: 0.2rem 0 0;
  color: rgba(245, 245, 246, 0.4);
  font-size: 0.82rem;
}
.ngv__after {
  margin-top: 1.35rem;
  max-width: 36rem;
}
.ngv__caption {
  margin: 0;
  font-size: 1.05rem;
  line-height: 1.55;
  color: #f5f5f6;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.ngv__there {
  margin: 1.1rem 0 0;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #39d5ff;
}
.ngv__caption + .ngv__there { margin-top: 1.25rem; }
.ngv__empty, .ngv__status { color: rgba(245, 245, 246, 0.5); }
.ngv__locked {
  max-width: 40rem;
  margin: 0 auto;
}
.ngv__teaser-wrap {
  margin-inline: auto;
  max-width: 22rem;
  aspect-ratio: 4 / 5;
  max-height: min(52vh, 26rem);
  overflow: hidden;
  background: #111318;
}
.ngv__teaser {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.ngv__lock-copy {
  margin: 1.15rem 0 0;
  max-width: 22rem;
  font-size: 1.22rem;
  line-height: 1.55;
  color: #f5f5f6;
}
@media (min-width: 768px) {
  .ngv__body { padding: 1.25rem 1.5rem 1.6rem; }
}
</style>
