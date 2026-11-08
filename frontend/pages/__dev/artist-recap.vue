<template>
  <div class="dev">
    <nav class="dev__chrome" aria-label="Night">
      <span class="dev__icon" aria-hidden="true">
        <ArrowLeft :size="20" :stroke-width="1.75" />
      </span>
      <button
        v-if="nightCanShare"
        type="button"
        class="dev__icon"
        aria-label="Share Night"
        @click="content?.openShare()"
      >
        <Share2 :size="18" :stroke-width="1.75" />
      </button>
    </nav>
    <ShowRecapDetailContent
      ref="content"
      :recap="shown"
      :initial-galleries="galleries"
      :start-editing="openEditor"
      :start-share="openShare"
      :start-insights="openInsights"
      :start-adjust="openAdjust"
      @update:recap="onRecapUpdate"
    />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { ArrowLeft, Share2 } from '@lucide/vue'
import ShowRecapDetailContent from '~/components/dashboard/fans/ShowRecapDetailContent.vue'
import { nightPathFromRecap } from '~/utils/nights/publicNightPaths'
import { galleryLabConcertPrints } from '~/config/galleryArchiveLab.js'
import { nightRecordingLabStates } from '~/config/nightRecordingsLab'

definePageMeta({
  robots: 'noindex, nofollow',
  sitemap: false,
})

if (!import.meta.dev) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found' })
}

const route = useRoute()
const content = ref(null)
const openEditor = computed(() => route.query.edit === '1')
const openShare = computed(() => route.query.share === '1')
const openInsights = computed(() => route.query.insights === '1')
const openAdjust = computed(() => route.query.adjust === '1')
const combo = computed(() => String(route.query.combo || 'artist-event-night'))
const crop = computed(() => String(route.query.crop || 'wide'))
const nightHeroOn = computed(() => String(route.query.hero || '') === '1')
const recapPatch = ref(null)

const bandPlain = { id: 1, name: 'The Rockers', slug: 'the-rockers' }

function cropBand() {
  const key = crop.value
  const frames = {
    wide: { url: '/__dev/gallery/band-four.svg', width: 1600, height: 900 },
    portrait: { url: '/__dev/gallery/portrait-figure.svg', width: 800, height: 1200 },
    left: { url: '/__dev/gallery/band-four.svg', width: 1600, height: 900, x: 18, y: 40, fit: 'fill' },
    right: { url: '/__dev/gallery/band-four.svg', width: 1600, height: 900, x: 82, y: 40, fit: 'fill' },
    top: { url: '/__dev/gallery/portrait-figure.svg', width: 800, height: 1200, x: 50, y: 12 },
    square: { url: '/__dev/gallery/square-mark.svg', width: 800, height: 800 },
    fill: { url: '/__dev/gallery/band-four.svg', width: 1600, height: 900, fit: 'fill' },
    framed: { url: '/__dev/gallery/band-four.svg', width: 1600, height: 900, x: 50, y: 22, fit: 'fill' },
  }
  const frame = frames[key] || frames.wide
  return {
    id: 1,
    name: 'The Rockers',
    slug: 'the-rockers',
    bandImg: { url: frame.url, width: frame.width, height: frame.height },
    layoutConfig: { imageFit: frame.fit || 'auto' },
    cyberedImagePositionX: frame.x,
    cyberedImagePositionY: frame.y,
  }
}

const base = {
  id: 88,
  band: bandPlain,
  showTitle: 'hello new show 3',
  venue: 'The Rock',
  city: 'Chicago',
  date: '2026-09-04',
  showStartedAt: '2026-09-04T21:15:00',
  nightSlug: 'the-rock-chicago-sep-4-2026',
  publicStory: 'The room was already loud before we walked on.\n\nChicago always feels like a home show even when the set list is new. The lights hit the back wall, someone yelled the first line of the chorus, and the night stopped being a schedule.\n\nWe kept the encore shorter. The last photograph is from the merch table after the house lights came up.',
  privateArtistNote: 'Set felt long. Keep the encore shorter next time. Watch the second guitar solo — it drifted.',
  lineup: [
    { name: 'The Rockers', role: 'headliner', bandId: 1 },
    { name: 'The Waters', role: 'co_headliner' },
    { name: 'Hade Somes', role: 'direct_support' },
    { name: 'Fable', role: 'support' },
    { name: 'Drop Kick Murphy', role: 'support' },
    { name: 'The Midnight Revival Orchestra', role: 'opener' },
  ],
  coverImage: { url: '/__dev/gallery/landscape-stage.svg' },
  eventImageUrl: '/__dev/gallery/square-mark.svg',
  checkedInShowCount: 2,
  newFanCheckIns: 2,
  knownFanCheckIns: 0,
  fansCaptured: 2,
  interactionCount: 16,
  averageEngagementScore: 12,
  superfanSignalCount: 1,
  engagedFanCount: 4,
  warmFanCount: 6,
  spotifyClicks: 8,
  captureSurfaceBreakdown: { merch_table: 9, qr_scan: 5 },
  cityBreakdown: { Chicago: 11, Evanston: 3 },
  topFans: [{ id: 1, firstName: 'Alex', engagementScore: 40, engagementTier: 'engaged' }],
  recordings: nightRecordingLabStates.mixed,
}

const shown = computed(() => {
  const next = { ...base, band: cropBand() }
  const key = combo.value
  if (key === 'artist' || key === 'A') {
    next.coverImage = null
    next.eventImageUrl = ''
  } else if (key === 'artist-event' || key === 'B') {
    next.coverImage = null
  } else if (key === 'artist-night' || key === 'C') {
    next.eventImageUrl = ''
  } else if (key === 'event' || key === 'E') {
    next.band = bandPlain
    next.coverImage = null
  } else if (key === 'night' || key === 'F') {
    next.band = bandPlain
    next.eventImageUrl = ''
  } else if (key === 'none' || key === 'G' || key === 'type') {
    next.band = bandPlain
    next.coverImage = null
    next.eventImageUrl = ''
    next.nightSlug = ''
  }
  if (String(route.query.empty || '') === '1') {
    next.publicStory = ''
    next.privateArtistNote = ''
    next.lineup = []
    next.recordings = []
    next.coverImage = null
  }
  if (nightHeroOn.value) {
    next.heroImage = {
      url: '/__dev/gallery/portrait-crowd.svg',
      width: 900,
      height: 1200,
      alternativeText: 'Night hero',
    }
    next.heroFocalX = 42
    next.heroFocalY = 28
  }
  return recapPatch.value ? { ...next, ...recapPatch.value } : next
})

function onRecapUpdate(next) {
  recapPatch.value = {
    hero: next?.hero ?? null,
    heroImage: next?.heroImage ?? next?.hero ?? null,
    heroFocalX: next?.heroFocalX,
    heroFocalY: next?.heroFocalY,
    coverImage: next?.coverImage,
    cover: next?.cover,
    publicStory: next?.publicStory,
    privateArtistNote: next?.privateArtistNote,
    lineup: next?.lineup,
  }
}

const nightCanShare = computed(() => !!nightPathFromRecap(shown.value))

const galleries = [
  {
    id: 1,
    showRecapId: 88,
    slug: 'live-set',
    title: 'Fun Time Last gallery',
    caption: 'just adding a caption',
    photoCount: 8,
    visibility: 'public',
    status: 'published',
    media: galleryLabConcertPrints(8),
  },
  {
    id: 2,
    showRecapId: 88,
    slug: 'after',
    title: 'The Dead Zone Show vip section',
    photoCount: 5,
    visibility: 'show_attendees',
    status: 'published',
    media: galleryLabConcertPrints(5),
  },
]

useHead({ title: 'Artist recap lab · Faneqo', meta: [{ name: 'robots', content: 'noindex' }] })
</script>

<style scoped>
.dev {
  position: relative;
  min-height: 100dvh;
  padding-bottom: 5rem;
  background: #050506;
}
.dev__chrome {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  z-index: 8;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: calc(0.7rem + env(safe-area-inset-top, 0px)) 0.85rem 0.7rem;
  pointer-events: none;
}
.dev__chrome::before {
  content: '';
  position: absolute;
  inset: 0 0 auto;
  height: 4.25rem;
  background: linear-gradient(180deg, rgba(5, 5, 6, 0.28) 0%, transparent 100%);
  pointer-events: none;
}
.dev__icon {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  pointer-events: auto;
  border: 0;
  border-radius: 999px;
  background: rgba(5, 5, 6, 0.52);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.1);
  color: rgba(245, 245, 246, 0.92);
}
.dev__icon:hover,
.dev__icon:focus-visible {
  color: #fff;
  background: rgba(5, 5, 6, 0.62);
}
.dev__icon:focus-visible {
  outline: 2px solid #39d5ff;
  outline-offset: 3px;
}
@media (min-width: 1024px) {
  .dev { padding-top: var(--header-height, 70px); }
  .dev__chrome { top: var(--header-height, 70px); }
}
</style>
