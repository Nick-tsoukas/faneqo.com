<template>
  <div class="pn">
    <ArtistWorldChrome
      :artist-name="artistName"
      :artist-path="artistPath"
      :back-to="navReturn.to"
      :back-label="navReturn.label"
      allow-share
      :sharing="sharing"
      :overlay="!!backdropSrc"
      @share="$emit('share')"
    />

    <article class="pn__page">
      <section class="pn__hero" :class="[`is-${heroMode}`]">
        <div v-if="backdropSrc" class="pn__stage">
          <img
            v-if="!hasNightHero && artistPresentation.ambient"
            class="pn__ambient"
            :src="backdropSrc"
            :style="{ objectPosition: artistPresentation.objectPosition }"
            alt=""
            aria-hidden="true"
          >
          <img
            class="pn__backdrop"
            :class="{
              'is-atmosphere': !hasNightHero,
              'is-contain': !hasNightHero && artistPresentation.objectFit === 'contain',
            }"
            :src="backdropSrc"
            :alt="hasNightHero ? (headline.primary || artistName) : artistName"
            :style="backdropStyle"
            fetchpriority="high"
            @error="onBackdropError"
          >
          <div class="pn__fade" />
          <div v-if="eventSrc" class="pn__event">
            <img :src="eventSrc" :alt="headline.primary || 'Show artwork'" @error="eventBroken = true">
          </div>
        </div>

        <div class="pn__hero-band">
          <div class="pn__identity">
            <p v-if="isRecapPreview" class="pn__preview">Viewing as fan</p>
            <p class="pn__artist">{{ artistName }}</p>
            <h1 class="pn__title">{{ headline.primary || artistName }}</h1>
            <p v-if="showLine" class="pn__place">{{ showLine }}</p>
            <p v-if="dateLine" class="pn__date">{{ dateLine }}</p>
            <div v-if="youWereThere" class="pn__there">
              <p class="pn__there-mark">
                <Check :size="16" :stroke-width="2" aria-hidden="true" />
                You were there
              </p>
              <p v-if="ordinalLine" class="pn__ordinal">{{ ordinalLine }}</p>
            </div>
            <div class="pn__actions">
              <button type="button" class="pn__share" :disabled="sharing" @click="$emit('share')">
                <Share2 :size="18" :stroke-width="1.75" aria-hidden="true" />
                {{ sharing ? 'Opening…' : 'Share Night' }}
              </button>
              <NuxtLink v-if="youWereThere" to="/fan/passport" class="pn__action">
                View in Fan Passport →
              </NuxtLink>
            </div>
            <p v-if="shareStatus" class="pn__status" role="status">{{ shareStatus }}</p>
          </div>
          <aside v-if="memorySrc" class="pn__memory">
            <button
              type="button"
              class="pn__memory-btn"
              aria-label="View Night poster"
              @click="openMemory"
            >
              <img
                :src="memorySrc"
                :alt="headline.primary || 'Night poster'"
                @error="memoryBroken = true"
              >
            </button>
            <div class="pn__memory-copy">
              <p class="pn__memory-label">Night poster</p>
              <button type="button" class="pn__action" @click="openMemory">
                <Image :size="18" :stroke-width="1.75" aria-hidden="true" />
                View poster
              </button>
            </div>
          </aside>
        </div>
      </section>

      <div class="pn__body" :class="{ 'is-rail': lineup.length }">
        <div class="pn__main">
        <section v-if="publicStory" class="pn__section pn__story-block">
          <h2>The story</h2>
          <p class="pn__story">{{ publicStory }}</p>
        </section>
        <p v-if="attendance && !youWereThere" class="pn__crowd">{{ attendance }}</p>

        <PublicNightRecordings
          :recordings="recordings"
          :artist-name="artistName"
        />

        <section v-if="galleries.length" class="pn__from">
          <h2>From the night</h2>
          <ul class="pn__chapters">
            <li v-for="gallery in galleries" :key="gallery.slug || gallery.title">
              <div v-if="chapterCanStack(gallery)" class="pn__chapter is-stack">
                <FaneqoGalleryStack
                  :media="gallery.media"
                  :title="gallery.title || 'Photos'"
                  :count="gallery.photoCount"
                  size="archive"
                  :priority="gallery === galleries[0]"
                  :active-index="stackIndexFor(gallery)"
                  @update:active-index="onStackIndex(gallery, $event)"
                  @activate="openGallery(gallery, $event)"
                />
                <button type="button" class="pn__chapter-copy" @click="openGallery(gallery)">
                  <span class="pn__chapter-title">{{ gallery.title || 'Photos' }}</span>
                  <span v-if="galleryCount(gallery)" class="pn__chapter-count">{{ galleryCount(gallery) }}</span>
                </button>
              </div>
              <button
                v-else
                type="button"
                class="pn__chapter"
                :class="{ 'is-locked': gallery.locked }"
                @click="openGallery(gallery)"
              >
                <span class="pn__chapter-media">
                  <img
                    v-if="chapterPreview(gallery)"
                    class="pn__chapter-img"
                    :src="chapterPreview(gallery)"
                    :style="chapterImageStyle(gallery)"
                    alt=""
                    loading="lazy"
                    @error="markPreviewFailed(gallery)"
                  >
                  <span
                    v-else
                    class="pn__chapter-fallback"
                    aria-hidden="true"
                  >{{ artistName }}</span>
                  <span v-if="gallery.locked" class="pn__chapter-veil" aria-hidden="true" />
                </span>
                <span class="pn__chapter-copy">
                  <span class="pn__chapter-title">{{ gallery.title || 'Photos' }}</span>
                  <span v-if="galleryCount(gallery)" class="pn__chapter-count">{{ galleryCount(gallery) }}</span>
                  <span v-if="gallery.locked" class="pn__chapter-lock">{{ chapterLockLine(gallery) }}</span>
                </span>
              </button>
            </li>
          </ul>
        </section>
        </div>

        <PublicNightLineup v-if="lineup.length" class="pn__on-stage" :lineup="lineup" />
      </div>

      <footer class="pn__end">
        <section class="pn__stay">
          <h2>Stay with {{ artistName }}</h2>
          <ArtistWorldIdentity
            :name="artistName"
            :to="artistPath"
            :image="artistSrc"
            :focal-x="artist.focalX"
            :focal-y="artist.focalY"
            size="end"
          >
            <NuxtLink :to="artistPath" class="pn__action">
              View artist page
              <ArrowUpRight :size="16" :stroke-width="1.75" aria-hidden="true" />
            </NuxtLink>
          </ArtistWorldIdentity>
        </section>
        <NuxtLink to="/" class="pn__made">Made with Faneqo</NuxtLink>
      </footer>
    </article>

    <FaneqoMediaLightbox
      :open="lightboxOpen"
      :items="lightboxItems"
      :start-index="0"
      :title="lightboxTitle"
      zoomable
      @close="lightboxOpen = false"
    />
    <NightGalleryViewer
      :open="!!activeGallery"
      :gallery="activeGallery"
      :share-path="activeGalleryPath"
      public-experience
      :locked="!!activeGallery?.locked"
      :lock-copy="activeGallery ? chapterLockLine(activeGallery) : ''"
      :teaser-url="activeGallery ? chapterPreview(activeGallery) : ''"
      :artist-name="artistName"
      :artist-path="artistPath"
      :artist-image="artistSrc"
      :artist-focal-x="artist.focalX"
      :artist-focal-y="artist.focalY"
      :place-line="showLine"
      :night-date="dateLine"
      :you-were-there="youWereThere"
      :start-index="activeGalleryStartIndex"
      :auto-open-lightbox="activeGalleryAutoOpen"
      @close="closeGallery"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { ArrowUpRight, Check, Image, Share2 } from '@lucide/vue'
import { lockOverlayScroll, unlockOverlayScroll } from '~/utils/ui/overlayScrollLock'
import ArtistWorldChrome from '~/components/nights/ArtistWorldChrome.vue'
import ArtistWorldIdentity from '~/components/nights/ArtistWorldIdentity.vue'
import NightGalleryViewer from '~/components/nights/NightGalleryViewer.vue'
import PublicNightLineup from '~/components/nights/PublicNightLineup.vue'
import PublicNightRecordings from '~/components/nights/PublicNightRecordings.vue'
import FaneqoMediaLightbox from '~/components/media/FaneqoMediaLightbox.vue'
import FaneqoGalleryStack from '~/components/media/FaneqoGalleryStack.vue'
import { galleryPath } from '~/utils/nights/publicNightPaths'
import { isShowRecapPath, resolveNightReturn } from '~/utils/nights/artistWorldReturn'
import {
  attendanceLine,
  displayPlaceName,
  formatNightDateLong,
  galleryChapterLockLine,
  galleryChapterPreviewUrl,
  nightHeadline,
  nightSafeTeaserFallbacks,
  samePublicImageUrl,
  uniqueNightGalleries,
} from '~/utils/nights/nightDisplay'
import { publicNightRecordings } from '~/utils/nights/nightRecordings'
import { yourShowOrdinalSentence } from '~/utils/nights/showOrdinalCopy'
import { nightStoryCountLine } from '~/utils/updates/nightStoryCopy'
import { resolveFaneqoMediaSrc } from '~/utils/media/faneqoMedia'
import { getArtistFocalStyle, readArtistImageFraming, resolveArtistImagePresentation } from '~/utils/media/artistImage'
import { resolvePublicNightHero } from '~/utils/nights/publicNightHero'
import { rememberStackIndex, recalledStackIndex } from '~/utils/galleries/stackBrowseMemory'
import { authorizedStackIndex, resolveNightGalleryOpen } from '~/utils/galleries/stackOpenNavigation'

const props = defineProps({
  payload: { type: Object, required: true },
  bandSlug: { type: String, default: '' },
  sharing: { type: Boolean, default: false },
  shareStatus: { type: String, default: '' },
  from: { type: [String, Array], default: '' },
})

defineEmits(['share'])

const config = useRuntimeConfig()
const mediaOrigin = computed(() => String(config.public?.strapiUrl || '').replace(/\/+$/, ''))
const artistBroken = ref(false)
const heroBroken = ref(false)
const eventBroken = ref(false)
const memoryBroken = ref(false)
const failedPreviews = ref(new Set())
const activeGallerySlug = ref('')
const activeGalleryStartIndex = ref(0)
const activeGalleryAutoOpen = ref(false)
const stackIndexes = reactive({})
const lightboxOpen = ref(false)
const lightboxItems = ref([])
const lightboxTitle = ref('')
const mobileHero = ref(false)
let heroMedia = null

const night = computed(() => props.payload?.night || {})
const artist = computed(() => props.payload?.artist || {})
const viewer = computed(() => props.payload?.viewer || {})
const artistName = computed(() => String(artist.value.name || '').trim() || 'Artist')
const artistPath = computed(() => (props.bandSlug ? `/${props.bandSlug}` : '/'))
const navReturn = computed(() => resolveNightReturn({
  from: props.from,
  artistPath: artistPath.value,
  artistName: artistName.value,
}))
const isRecapPreview = computed(() => isShowRecapPath(props.from))
const headline = computed(() => nightHeadline({ title: night.value.title, venue: night.value.venue }))
const venueName = computed(() => displayPlaceName(night.value.venue))
const cityName = computed(() => displayPlaceName(night.value.city))
const showLine = computed(() => {
  const venue = venueName.value && headline.value.primary !== venueName.value ? venueName.value : ''
  return [venue, cityName.value].filter(Boolean).join(' · ')
})
const dateLine = computed(() => formatNightDateLong(
  night.value.date || night.value.performanceStartsAt,
  night.value.timezone,
))
const youWereThere = computed(() => !!viewer.value.youWereThere)
const ordinalLine = computed(() => yourShowOrdinalSentence({
  showOrdinal: viewer.value.showOrdinal,
  artistName: artistName.value,
}) || '')
const publicStory = computed(() => String(night.value.publicStory || '').trim())
const lineup = computed(() =>
  Array.isArray(night.value.lineup)
    ? night.value.lineup.filter((row) => String(row?.name || '').trim())
    : []
)
const galleries = computed(() => uniqueNightGalleries(props.payload?.galleries))
const recordings = computed(() => publicNightRecordings(props.payload?.recordings))
const attendance = computed(() => attendanceLine(night.value.attendanceCount))

const heroPlan = computed(() => resolvePublicNightHero(props.payload))
const hasNightHero = computed(() => heroPlan.value.hasNightHero && !heroBroken.value)
const artistRaw = computed(() => artist.value.image?.url || '')
const eventRaw = computed(() => heroPlan.value.eventUrl)
const coverRaw = computed(() => heroPlan.value.coverUrl)
const artistSrc = computed(() => {
  if (artistBroken.value || !artistRaw.value) return ''
  return resolveFaneqoMediaSrc(artistRaw.value, mediaOrigin.value) || ''
})
const backdropSrc = computed(() => {
  if (hasNightHero.value) {
    return resolveFaneqoMediaSrc(heroPlan.value.backdropUrl, mediaOrigin.value) || ''
  }
  return artistSrc.value
})
const eventSrc = computed(() => {
  if (eventBroken.value || !eventRaw.value) return ''
  if (samePublicImageUrl(eventRaw.value, backdropSrc.value || heroPlan.value.backdropUrl)) return ''
  return resolveFaneqoMediaSrc(eventRaw.value, mediaOrigin.value) || ''
})
const memorySrc = computed(() => {
  if (memoryBroken.value || !coverRaw.value) return ''
  if (samePublicImageUrl(coverRaw.value, backdropSrc.value || heroPlan.value.backdropUrl)) return ''
  if (samePublicImageUrl(coverRaw.value, eventRaw.value)) return ''
  return resolveFaneqoMediaSrc(coverRaw.value, mediaOrigin.value) || ''
})
const chapterFallbacks = computed(() => nightSafeTeaserFallbacks({
  coverUrl: memorySrc.value,
  eventUrl: eventSrc.value,
  artistUrl: artistSrc.value,
}))
const heroMode = computed(() => {
  if (backdropSrc.value && eventSrc.value) return 'artist-event'
  if (backdropSrc.value) return 'artist'
  return 'type'
})

const artistFraming = computed(() => readArtistImageFraming({
  layoutConfig: artist.value.imageFit ? { imageFit: artist.value.imageFit } : null,
  cyberedImagePositionX: artist.value.focalX,
  cyberedImagePositionY: artist.value.focalY,
}, artist.value.image))
const artistPresentation = computed(() => resolveArtistImagePresentation({
  ...artistFraming.value,
  context: mobileHero.value ? 'hero-mobile' : 'hero-desktop',
}))
const backdropStyle = computed(() => {
  if (hasNightHero.value) {
    return {
      objectFit: 'cover',
      ...getArtistFocalStyle({
        positionX: heroPlan.value.heroFocalX,
        positionY: heroPlan.value.heroFocalY,
      }),
    }
  }
  return {
    objectFit: artistPresentation.value.objectFit,
    objectPosition: artistPresentation.value.objectPosition,
  }
})

function onBackdropError() {
  if (hasNightHero.value) heroBroken.value = true
  else artistBroken.value = true
}

const activeGallery = computed(() =>
  galleries.value.find((row) => row.slug === activeGallerySlug.value) || null,
)
const activeGalleryPath = computed(() => {
  if (!activeGallery.value) return ''
  return activeGallery.value.canonicalPath || galleryPath(props.bandSlug, activeGallery.value.slug) || ''
})

function galleryCount(gallery) {
  return nightStoryCountLine(gallery?.photoCount)
}

function chapterCanStack(gallery) {
  return !gallery?.locked && Array.isArray(gallery?.media) && gallery.media.some((item) => item?.url)
}

function openMemory() {
  if (!memorySrc.value) return
  lightboxItems.value = [{ url: memorySrc.value, alt: headline.value.primary || 'Night poster' }]
  lightboxTitle.value = 'Night poster'
  lightboxOpen.value = true
}

function chapterLockLine(gallery) {
  return galleryChapterLockLine({
    lockReason: gallery?.lockReason,
    visibility: gallery?.visibility,
  })
}

function chapterPreview(gallery) {
  const key = gallery?.slug || gallery?.title || ''
  if (failedPreviews.value.has(`${key}:gone`)) return ''
  const raw = galleryChapterPreviewUrl(gallery, chapterFallbacks.value)
  if (failedPreviews.value.has(key)) {
    const next = chapterFallbacks.value.find((url) => !samePublicImageUrl(url, raw))
    return resolveFaneqoMediaSrc(next, mediaOrigin.value) || ''
  }
  return resolveFaneqoMediaSrc(raw, mediaOrigin.value) || ''
}

function chapterImageStyle(gallery) {
  const src = chapterPreview(gallery)
  if (src && samePublicImageUrl(src, artistSrc.value)) {
    return { objectPosition: artistPresentation.value.objectPosition }
  }
  return undefined
}

function markPreviewFailed(gallery) {
  const key = gallery?.slug || gallery?.title || ''
  const next = new Set(failedPreviews.value)
  if (next.has(key)) next.add(`${key}:gone`)
  else next.add(key)
  failedPreviews.value = next
}

function galleryKey(gallery) {
  return String(gallery?.slug || gallery?.id || '')
}

function stackIndexFor(gallery) {
  const key = galleryKey(gallery)
  if (key && Object.prototype.hasOwnProperty.call(stackIndexes, key)) return stackIndexes[key]
  return recalledStackIndex(key)
}

function onStackIndex(gallery, index) {
  const key = galleryKey(gallery)
  const next = authorizedStackIndex(index, gallery?.media)
  if (!key || next == null) return
  stackIndexes[key] = next
  rememberStackIndex(key, next)
}

function openGallery(gallery, payload) {
  if (!gallery?.slug) return
  const plan = resolveNightGalleryOpen({
    gallery,
    payload,
    rememberedIndex: stackIndexFor(gallery),
  })
  if (plan.index != null) {
    stackIndexes[galleryKey(gallery)] = plan.index
    rememberStackIndex(galleryKey(gallery), plan.index)
  }
  activeGalleryStartIndex.value = plan.index ?? 0
  activeGalleryAutoOpen.value = plan.autoOpen
  lockOverlayScroll('public-night-gallery')
  activeGallerySlug.value = gallery.slug
}

function closeGallery() {
  activeGallerySlug.value = ''
  activeGalleryAutoOpen.value = false
  unlockOverlayScroll('public-night-gallery')
}

const onHeroMedia = () => {
  mobileHero.value = Boolean(heroMedia?.matches)
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    heroMedia = window.matchMedia('(max-width: 767px)')
    onHeroMedia()
    heroMedia.addEventListener('change', onHeroMedia)
  }
})

onUnmounted(() => {
  heroMedia?.removeEventListener?.('change', onHeroMedia)
  unlockOverlayScroll('public-night-gallery')
})
</script>

<style scoped>
.pn {
  --bg-app: #050506;
  --text-primary: #f5f5f6;
  --text-secondary: rgba(245, 245, 246, 0.62);
  --text-muted: rgba(245, 245, 246, 0.4);
  --text-identity: rgba(245, 245, 246, 0.82);
  --pn-kicker-size: 0.875rem;
  --pn-kicker-tracking: 0.12em;
  --pn-kicker-color: rgba(245, 245, 246, 0.72);
  position: relative;
  min-height: 100dvh;
  overflow-x: clip;
  background: var(--bg-app);
  color: var(--text-primary);
  font-family: Poppins, ui-sans-serif, system-ui, sans-serif;
}
.pn__page { padding-bottom: calc(1.8rem + env(safe-area-inset-bottom, 0px)); }
.pn__hero { position: relative; }
.pn__stage {
  position: relative;
  overflow: hidden;
  height: min(80vh, 36rem);
  background: #050506;
}
.pn__backdrop {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.pn__backdrop.is-contain {
  object-fit: contain;
  background: transparent;
}
.pn__backdrop.is-atmosphere { filter: saturate(0.86); }
.pn__ambient {
  position: absolute;
  inset: -10%;
  width: 120%;
  height: 120%;
  object-fit: cover;
  object-position: 50% 50%;
  filter: blur(22px) saturate(0.7) brightness(0.34);
  pointer-events: none;
}
.pn__fade {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(5, 5, 6, 0.18) 0%, rgba(5, 5, 6, 0.42) 42%, #050506 100%);
  pointer-events: none;
}
.pn__event {
  position: absolute;
  left: 1.25rem;
  bottom: 1.1rem;
  z-index: 2;
  width: 92px;
}
.pn__event img {
  display: block;
  width: 100%;
  aspect-ratio: 4 / 5;
  object-fit: contain;
  background: #0a0a0c;
  border-radius: 2px;
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.42);
}
.pn__hero-band {
  position: relative;
  z-index: 2;
  max-width: 56rem;
  margin: 0 auto;
  padding: 0.9rem 1.25rem 0.2rem;
}
.pn__identity { position: relative; }
.pn__hero.is-artist .pn__identity {
  margin-top: -5.5rem;
}
.pn__hero.is-artist-event .pn__identity {
  margin-top: -8.6rem;
  padding-left: 7.35rem;
  min-height: 8.4rem;
}
.pn__hero.is-type .pn__identity {
  padding-top: 4.6rem;
  padding-bottom: 0.6rem;
}
.pn__hero.is-type .pn__title {
  font-size: clamp(2.4rem, 12vw, 4.2rem);
}
.pn__preview {
  margin: 0 0 0.55rem;
  font-size: 0.8125rem;
  font-weight: 650;
  letter-spacing: 0.04em;
  color: var(--text-secondary);
}
.pn__artist {
  margin: 0;
  font-size: 0.92rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  line-height: 1.2;
  color: var(--text-primary);
}
.pn__title {
  margin: 0.55rem 0 0;
  font-size: clamp(2rem, 8vw, 3.4rem);
  font-weight: 800;
  letter-spacing: -0.045em;
  line-height: 0.96;
  overflow-wrap: anywhere;
  color: var(--text-primary);
}
.pn__place,
.pn__date {
  margin: 0.7rem 0 0;
  font-size: 1.125rem;
  font-weight: 500;
  line-height: 1.4;
  color: var(--text-identity);
  overflow-wrap: anywhere;
}
.pn__date { margin-top: 0.22rem; }
.pn__crowd {
  margin: 0.85rem 0 0;
  font-size: 0.95rem;
  color: var(--text-muted);
}
.pn__there { margin-top: 1.15rem; }
.pn__there-mark {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin: 0;
  font-size: 0.86rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-primary);
}
.pn__ordinal {
  margin: 0.35rem 0 0;
  font-size: 1.05rem;
  color: var(--text-identity);
}
.pn__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem 1rem;
  margin-top: 1.15rem;
}
.pn__share,
.pn__action {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  min-height: 44px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--text-primary);
  font: inherit;
  font-weight: 650;
  text-decoration: none;
  cursor: pointer;
}
.pn__share:disabled { opacity: 0.55; cursor: wait; }
.pn__share:hover,
.pn__action:hover { opacity: 0.78; }
.pn__body,
.pn__rail {
  max-width: 56rem;
  margin: 0 auto;
  padding: 0 1.25rem;
}
.pn__main { min-width: 0; }
.pn__on-stage { margin-top: 2.6rem; }
.pn__story-block { margin-top: 2.6rem; }
.pn__story {
  margin: 0;
  max-width: 42rem;
  font-size: 1.125rem;
  line-height: 1.7;
  color: var(--text-primary);
  white-space: pre-wrap;
}
.pn__section { margin-top: 2.6rem; }
.pn__section h2,
.pn__from h2,
.pn__stay h2,
.pn__memory-label,
.pn__main :deep(.pnr h2) {
  margin: 0 0 1.05rem;
  font-size: var(--pn-kicker-size);
  font-weight: 700;
  letter-spacing: var(--pn-kicker-tracking);
  text-transform: uppercase;
  color: var(--pn-kicker-color);
}
.pn__memory {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  margin-top: 1.15rem;
}
.pn__memory-btn {
  display: block;
  flex: 0 0 4.75rem;
  width: 4.75rem;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
}
.pn__memory-btn img {
  display: block;
  width: 100%;
  aspect-ratio: 4 / 5;
  object-fit: cover;
  border-radius: 2px;
  box-shadow: 0 10px 22px rgba(0, 0, 0, 0.32);
  outline: 1px solid rgba(255, 255, 255, 0.08);
}
.pn__memory-copy {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
.pn__memory-label { margin-bottom: 0.1rem; }
.pn__from { margin-top: 2.15rem; }
.pn__main :deep(.pnr) { margin-top: 2.6rem; }
.pn__chapters {
  display: flex;
  gap: 0.85rem;
  margin: 0 -1.25rem;
  padding: 0 1.25rem 0.35rem;
  list-style: none;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}
.pn__chapters::-webkit-scrollbar { display: none; }
.pn__chapters li {
  flex: 0 0 80vw;
  max-width: 22rem;
  scroll-snap-align: start;
}
.pn__chapter {
  display: block;
  width: 100%;
  min-width: 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
}
.pn__chapter-media {
  position: relative;
  display: block;
  width: 100%;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  background: #111318;
  border: 1px solid rgba(255, 255, 255, 0.06);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.16);
  transition: transform 140ms ease, box-shadow 140ms ease;
}
.pn__chapter:hover .pn__chapter-media,
.pn__chapter:focus-visible .pn__chapter-media {
  transform: scale(1.012);
  box-shadow: 0 12px 26px rgba(0, 0, 0, 0.2);
}
.pn__chapter:active .pn__chapter-media {
  transform: scale(0.97);
}
.pn__chapter-img,
.pn__chapter-fallback {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}
.pn__chapter-fallback {
  display: flex;
  align-items: flex-end;
  padding: 0.9rem;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(245, 245, 246, 0.4);
}
.pn__chapter-veil {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(5, 5, 6, 0.08) 40%, rgba(5, 5, 6, 0.42) 100%);
  pointer-events: none;
}
.pn__chapter.is-stack { cursor: default; }
.pn__chapter-copy { display: block; }
.pn__chapter.is-stack .pn__chapter-copy {
  width: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
}
.pn__chapter-title {
  display: block;
  margin: 0.7rem 0 0;
  font-size: 1.18rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--text-primary);
  overflow-wrap: anywhere;
}
.pn__chapter-count,
.pn__chapter-lock {
  display: block;
  margin: 0.22rem 0 0;
  color: var(--text-secondary);
  font-size: 0.92rem;
}
.pn__chapter-lock { color: var(--text-muted); }
.pn__end {
  max-width: 56rem;
  margin: 3.2rem auto 0;
  padding: 0 1.25rem;
}
.pn__stay {
  padding-top: 1.8rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}
.pn__stay h2 { margin-bottom: 0.85rem; }
.pn__status { margin: 0.35rem 0 0; color: var(--text-muted); }
.pn__made {
  display: flex;
  align-items: center;
  min-height: 44px;
  margin-top: 1.1rem;
  color: var(--text-muted);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-size: 0.72rem;
  text-decoration: none;
}
.pn__share:focus-visible,
.pn__action:focus-visible,
.pn__made:focus-visible,
.pn__chapter:focus-visible,
.pn__chapter-copy:focus-visible,
.pn__memory-btn:focus-visible {
  outline: 2px solid #39d5ff;
  outline-offset: 3px;
}
@media (min-width: 768px) {
  .pn__stage { height: min(58vh, 34rem); }
  .pn__event {
    left: max(1.5rem, calc(50% - 26.5rem));
    bottom: 1.6rem;
    width: 124px;
  }
  .pn__hero-band {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: end;
    column-gap: 2rem;
  }
  .pn__hero.is-artist .pn__hero-band { margin-top: -5.5rem; }
  .pn__hero.is-artist-event .pn__hero-band {
    margin-top: -8.6rem;
    padding-left: max(1.25rem, 11.4rem);
  }
  .pn__hero.is-artist .pn__identity,
  .pn__hero.is-artist-event .pn__identity {
    margin-top: 0;
    padding-left: 0;
    min-height: 0;
  }
  .pn__hero.is-type .pn__title { font-size: clamp(3.2rem, 7vw, 5.2rem); }
  .pn__story { max-width: 44rem; font-size: 1.25rem; }
  .pn__memory {
    flex-direction: column;
    align-items: stretch;
    width: 11.5rem;
    margin-top: 0;
  }
  .pn__memory-btn {
    flex-basis: auto;
    width: 11.5rem;
  }
  .pn__body.is-rail {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 11.5rem;
    column-gap: 2rem;
    align-items: start;
  }
  .pn__on-stage { margin-top: 2.6rem; }
  .pn__chapters {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.4rem 1.6rem;
    margin: 0;
    padding: 0;
    overflow: visible;
  }
  .pn__chapters li { flex: none; max-width: none; }
}
@media (prefers-reduced-motion: reduce) {
  .pn * { animation: none !important; transition: none !important; }
}
</style>
