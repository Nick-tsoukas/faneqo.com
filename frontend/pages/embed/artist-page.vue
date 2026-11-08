<template>
  <div ref="rootRef" class="embed-artist-page">
    <BandPageCybered
      v-if="band"
      :band="band"
      :upcoming-events="upcomingEvents"
      :hidden-links="[]"
      :enabled-payment-buttons="[]"
      visual-variant="polish-test"
      test-mode
      deck-fold
      message-label="Message"
    />
  </div>
</template>

<script setup>
import BandPageCybered from '@/components/band/BandPageCybered.vue'
import { homepageDemoConfig } from '~/config/homepageDemo'
import {
  FALLBACK_SNAPSHOT,
  fetchBandBySlug,
} from '~/composables/useHomepageDemoArtist.js'

definePageMeta({
  layout: false,
  robots: 'noindex, nofollow',
  sitemap: false,
})

useHead({
  title: 'Artist page',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
  htmlAttrs: { class: 'embed-artist-lock' },
  bodyAttrs: { class: 'embed-artist-lock' },
})

const SILENT_WAV =
  'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA'

function bandFromDemoArtist(artist) {
  const band = {
    id: artist.id || 'demo-badflower',
    slug: artist.slug,
    name: artist.name,
    genre: artist.genre,
    bio: artist.bio,
    biotagline: '',
    isBandNameInLogo: false,
    fanCaptureEnabled: false,
    officialMerchUrl: '',
    websitelink: artist.website?.url || '',
    websitelinktext: artist.website?.label || '',
    bandImg: { url: artist.heroImage },
    singlesong: artist.featuredSong
      ? {
          title: artist.featuredSong.title,
          isEmbed: false,
          cover: { url: artist.featuredSong.thumbnailUrl },
          song: { url: SILENT_WAV },
        }
      : null,
    singlevideo: null,
  }

  for (const platform of artist.streaming || []) {
    band[platform.name] = platform.url
  }
  return band
}

const runtimeConfig = useRuntimeConfig()
const { data: liveBand } = await useAsyncData('embed-artist-page-band', async () => {
  const strapiUrl = runtimeConfig.public.strapiUrl || 'http://localhost:1337'
  const slug = homepageDemoConfig.artistSlug || 'badflower'
  try {
    return await fetchBandBySlug(strapiUrl, slug)
  } catch {
    return null
  }
})

const band = computed(() => liveBand.value || bandFromDemoArtist(FALLBACK_SNAPSHOT))
const upcomingEvents = computed(() => {
  const raw = band.value?.events
  if (!Array.isArray(raw)) return []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return raw
    .filter((event) => event?.date && new Date(`${event.date}T00:00:00`) >= today)
    .slice(0, 3)
})

/**
 * The deck phone frame sizes itself to this page, so the device shows the whole
 * composition with no scrollbar and no dead space under the action row.
 */
const rootRef = ref(null)
let observer = null

function reportHeight() {
  const height = rootRef.value?.getBoundingClientRect().height
  if (!height) return
  window.parent?.postMessage({ type: 'faneqo:embed-artist-height', height: Math.ceil(height) }, '*')
}

function lockScroll(event) {
  event.preventDefault()
}

onMounted(() => {
  reportHeight()
  if (typeof ResizeObserver !== 'undefined') {
    observer = new ResizeObserver(reportHeight)
    observer.observe(rootRef.value)
  }
  window.addEventListener('load', reportHeight)
  document.addEventListener('wheel', lockScroll, { passive: false })
  document.addEventListener('touchmove', lockScroll, { passive: false })
})

onBeforeUnmount(() => {
  observer?.disconnect()
  window.removeEventListener('load', reportHeight)
  document.removeEventListener('wheel', lockScroll)
  document.removeEventListener('touchmove', lockScroll)
})
</script>

<style>
html.embed-artist-lock,
body.embed-artist-lock {
  overflow: hidden;
  overscroll-behavior: none;
  background: #050506;
  scrollbar-width: none;
}

html.embed-artist-lock::-webkit-scrollbar,
body.embed-artist-lock::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}

.embed-artist-page {
  overflow: hidden;
  background: #050506;
}
</style>
