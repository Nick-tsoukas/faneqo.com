<template>
  <section
    v-if="showSection"
    id="real-artists"
    class="home-proof relative z-10 overflow-x-clip"
    :class="refined ? 'feature' : 'px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-28'"
    aria-labelledby="real-artists-heading"
  >
    <div v-if="refined" class="feature__wrap">
      <HomeTypeReveal class="feature__copy">
        <p class="feature__kicker">Artist pages</p>
        <h2 id="real-artists-heading" class="feature__title">
          <span>A home that</span>
          <span>sounds like you.</span>
        </h2>
        <p class="feature__lede">
          Music, links, and the fans you can reach again.
        </p>
      </HomeTypeReveal>

      <div
        v-if="featuredArtists.length"
        class="feature__index"
        role="tablist"
        aria-label="Featured artists"
        aria-orientation="horizontal"
        @keydown="onIndexKeydown"
      >
        <button
          v-for="artist in featuredArtists"
          :id="`artist-feature-tab-${artist.slug}`"
          :key="artist.slug"
          type="button"
          class="feature__tab"
          role="tab"
          :aria-selected="artist.slug === activeSlug"
          aria-controls="artist-feature-panel"
          :tabindex="artist.slug === activeSlug ? 0 : -1"
          @click="selectArtist(artist.slug)"
        >
          <span v-if="artist.heroImage" class="feature__avatar">
            <img
              :src="artist.heroImage"
              alt=""
              :class="{ 'is-crop': Boolean(avatarCrop(artist)) }"
              :style="avatarStyle(artist)"
              width="64"
              height="64"
            />
          </span>
          <span class="feature__tab-name">{{ artist.name }}</span>
        </button>
      </div>

      <div
        id="artist-feature-panel"
        class="feature__stage"
        role="tabpanel"
        :aria-labelledby="activeArtist ? `artist-feature-tab-${activeArtist.slug}` : undefined"
      >
        <Transition name="feature-swap" mode="out-in">
          <HomeArtistPageStage
            v-if="activeArtist"
            :key="activeArtist.slug"
            :artist="activeArtist"
          />
        </Transition>
      </div>
    </div>

    <template v-else>
      <div
        class="pointer-events-none absolute inset-0"
        aria-hidden="true"
      >
        <div class="absolute left-1/2 top-1/3 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-fuchsia-600/10 blur-[120px]" />
        <div class="absolute left-[30%] bottom-1/4 h-[280px] w-[280px] rounded-full bg-purple-600/8 blur-[100px]" />
        <div class="absolute right-[28%] top-1/4 h-[240px] w-[240px] rounded-full blur-[90px] bg-emerald-500/6" />
      </div>

      <div class="relative mx-auto max-w-7xl">
        <HomeTypeReveal class="home-section-head mb-7 max-w-3xl sm:mb-8 lg:mb-10">
          <p class="home-kicker mb-3 text-pink-400/90 sm:mb-4">
            Real artists. Real Faneqo pages.
          </p>
          <h2 id="real-artists-heading" class="home-section-title">
            See what your band could look like.
          </h2>
        </HomeTypeReveal>

        <HomeArtistProofFallback
          v-if="showcaseFailed"
          :artists="proofArtists"
        />
        <ClientOnly v-else>
          <HomeRealArtistShowcaseCarousel
            v-if="stableArtists.length"
            :key="carouselKey"
            :artists="stableArtists"
            :initial-index="startIndex"
            @active-change="onActiveChange"
          />
          <template #fallback>
            <HomeArtistProofFallback :artists="proofArtists" />
          </template>
        </ClientOnly>

        <div class="mt-8 text-center sm:mt-10">
          <p class="font-extrabold tracking-wide text-white text-xl sm:text-2xl">
            {{ activeArtist?.name || 'Artist' }}
          </p>
          <p v-if="activeSubtitle" class="mt-1.5 text-sm text-white/45">
            {{ activeSubtitle }}
          </p>
          <NuxtLink
            v-if="activeArtist?.slug"
            :to="`/${activeArtist.slug}`"
            class="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-pink-300 transition hover:text-pink-200"
          >
            View live Faneqo page
            <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </NuxtLink>
        </div>
      </div>
    </template>
  </section>
</template>

<script setup>
import { computed, onErrorCaptured, ref, watch } from 'vue'
import HomeArtistPageStage from '@/components/home/HomeArtistPageStage.vue'
import HomeArtistProofFallback from '@/components/home/HomeArtistProofFallback.vue'
import HomeRealArtistShowcaseCarousel from '@/components/home/HomeRealArtistShowcaseCarousel.client.vue'
import { useHomepageShowcaseArtists } from '~/composables/useHomepageDemoArtist'
import { homepageDemoConfig, SHOWCASE_FALLBACK_ARTISTS, SHOWCASE_FEATURED_VIDEOS } from '~/config/homepageDemo'
import { cropImageStyle, showcasePrint } from '@/utils/home/showcaseFeature'

const props = defineProps({
  /** Homepage editorial feature. Classic `/home-classic` leaves this false. */
  refined: {
    type: Boolean,
    default: false,
  },
})

const showcaseSlugs = props.refined
  ? (homepageDemoConfig.featuredShowcaseSlugs || homepageDemoConfig.showcaseArtistSlugs)
  : homepageDemoConfig.showcaseArtistSlugs

const { showcaseArtists, pending } = useHomepageShowcaseArtists(showcaseSlugs)

const stableArtists = computed(() => {
  const seen = new Set()
  const next = []
  for (const artist of showcaseArtists.value || []) {
    const slug = String(artist?.slug || '').trim()
    if (!slug || seen.has(slug)) continue
    seen.add(slug)
    next.push(artist)
  }
  return next
})

function isRichArtist(artist) {
  if (!artist) return false
  if (artist.source === 'live') return true
  if (artist.featuredSong?.title) return true
  if (Array.isArray(artist.streaming) && artist.streaming.length) return true
  if (String(artist.bio || '').trim()) return true
  return false
}

function presentArtist(artist) {
  const slug = String(artist?.slug || '').trim().toLowerCase()
  return {
    ...artist,
    featuredVideo: artist.featuredVideo || SHOWCASE_FEATURED_VIDEOS[slug] || null,
    fanList: artist.fanList?.enabled === false
      ? artist.fanList
      : {
          enabled: true,
          buttonLabel: artist.fanList?.buttonLabel || 'Join Fan List',
          headline: artist.fanList?.headline || '',
          message: artist.fanList?.message || '',
        },
  }
}

// Shannon's own portrait, white-balanced to take the magenta cast off (nothing else changed).
const EDITORIAL_PORTRAITS = {
  shannontehya: { heroImage: '/images/home/shannon-tehya-editorial.jpg', heroImageMobile: '/images/home/shannon-tehya-editorial.jpg' },
}

const featuredArtists = computed(() => {
  const wanted = (homepageDemoConfig.featuredShowcaseSlugs || [])
    .map((slug) => String(slug || '').trim().toLowerCase())
    .filter(Boolean)
  const bySlug = new Map()
  for (const artist of SHOWCASE_FALLBACK_ARTISTS) {
    const slug = String(artist?.slug || '').trim().toLowerCase()
    if (slug) bySlug.set(slug, artist)
  }
  for (const artist of stableArtists.value) {
    const slug = String(artist?.slug || '').trim().toLowerCase()
    if (!slug) continue
    const previous = bySlug.get(slug)
    if (!previous || isRichArtist(artist)) {
      const crop = String(artist.heroObjectPosition || '').trim()
      const genericCrop = !crop || crop === 'center 10%'
      bySlug.set(slug, {
        ...artist,
        heroImage: artist.heroImage || previous?.heroImage || '',
        heroObjectPosition: genericCrop
          ? (previous?.heroObjectPosition || 'center 30%')
          : crop,
        streaming: artist.streaming?.length ? artist.streaming : (previous?.streaming || []),
        social: artist.social?.length ? artist.social : (previous?.social || []),
        website: artist.website || previous?.website || null,
        merchUrl: artist.merchUrl || previous?.merchUrl || null,
        featuredSong: artist.featuredSong?.title ? artist.featuredSong : (previous?.featuredSong || null),
        featuredVideo: artist.featuredVideo || previous?.featuredVideo || SHOWCASE_FEATURED_VIDEOS[slug] || null,
      })
    }
  }
  return wanted
    .map((slug) => bySlug.get(slug))
    .filter(Boolean)
    .slice(0, 3)
    .map(presentArtist)
    .map((artist) => (EDITORIAL_PORTRAITS[artist.slug] ? { ...artist, ...EDITORIAL_PORTRAITS[artist.slug] } : artist))
})

const proofArtists = computed(() => {
  const live = stableArtists.value
    .map((artist) => ({
      slug: artist.slug,
      name: artist.name,
      heroImage: artist.heroImage || artist.heroImageMobile,
    }))
    .filter((artist) => artist.slug && artist.heroImage)
  if (live.length >= 3) return live.slice(0, 5)
  const seen = new Set(live.map((artist) => artist.slug))
  const merged = [...live]
  for (const artist of SHOWCASE_FALLBACK_ARTISTS) {
    if (seen.has(artist.slug)) continue
    merged.push(artist)
    if (merged.length >= 5) break
  }
  return merged
})

const showcaseFailed = ref(false)

const showSection = computed(() => {
  if (props.refined) return featuredArtists.value.length > 0
  return pending.value || stableArtists.value.length > 0 || proofArtists.value.length > 0
})

const startIndex = computed(() => {
  const n = stableArtists.value.length
  if (n <= 1) return 0
  return Math.min(2, n - 1)
})

const carouselKey = computed(() => {
  const signature = stableArtists.value
    .map((artist) => String(artist?.slug || '').trim())
    .filter(Boolean)
    .join('|')
  return `showcase-classic-${signature}-${startIndex.value}`
})

const activeSlug = ref('')
const activeIndex = ref(0)

watch(
  featuredArtists,
  (list) => {
    if (!props.refined) return
    if (list.some((artist) => artist.slug === activeSlug.value)) return
    activeSlug.value = list[0]?.slug || ''
  },
  { immediate: true }
)

watch(
  startIndex,
  (index) => {
    if (!props.refined) activeIndex.value = index
  },
  { immediate: true }
)

const activeArtist = computed(() => {
  if (props.refined) {
    return featuredArtists.value.find((artist) => artist.slug === activeSlug.value)
      || featuredArtists.value[0]
      || null
  }
  const list = stableArtists.value
  if (!list.length) return null
  const index = ((activeIndex.value % list.length) + list.length) % list.length
  return list[index]
})

const activeSubtitle = computed(() => {
  const genre = String(activeArtist.value?.genre || '').trim()
  if (!genre) return ''
  return genre.split(/[,|]/)[0]?.trim() || ''
})

function selectArtist(slug) {
  activeSlug.value = slug
}

function avatarCrop(artist) {
  return showcasePrint(artist?.slug).avatarCrop || null
}

function avatarStyle(artist) {
  const frame = showcasePrint(artist?.slug)
  if (frame.avatarCrop) return cropImageStyle(frame.avatarCrop)
  return { objectPosition: frame.avatarPosition || 'center 30%' }
}

function onIndexKeydown(event) {
  const keys = ['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Home', 'End']
  if (!keys.includes(event.key)) return
  const list = featuredArtists.value
  if (list.length < 2) return
  event.preventDefault()
  const current = Math.max(0, list.findIndex((artist) => artist.slug === activeSlug.value))
  let next = current
  if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (current + 1) % list.length
  if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (current - 1 + list.length) % list.length
  if (event.key === 'Home') next = 0
  if (event.key === 'End') next = list.length - 1
  const artist = list[next]
  if (!artist) return
  activeSlug.value = artist.slug
  const tab = event.currentTarget?.querySelector?.(`#artist-feature-tab-${CSS.escape(artist.slug)}`)
  tab?.focus()
}

function onActiveChange({ index }) {
  if (typeof index === 'number' && index >= 0) activeIndex.value = index
}

onErrorCaptured((err, _instance, info) => {
  console.error('[ArtistShowcase] captured error', { message: err?.message || err, info })
  if (!props.refined) showcaseFailed.value = true
  return false
})
</script>

<style scoped>
.feature {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  padding: 4.25rem 1rem 4.75rem;
  background: #050608;
  scroll-margin-top: calc(var(--header-height, 70px) + 0.5rem);
  font-family: Poppins, ui-sans-serif, system-ui, sans-serif;
}

.feature__wrap {
  display: flex;
  flex-direction: column;
  gap: 1.65rem;
  width: min(100%, 76rem);
  margin-inline: auto;
}

.feature__copy {
  max-width: 38rem;
}

.feature__stage {
  position: relative;
  width: 100%;
  min-height: 28rem;
}

.feature__kicker {
  margin: 0 0 0.85rem;
  color: #9aa6b5;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.18em;
  line-height: 1;
  text-transform: uppercase;
}

.feature__title span {
  display: block;
}

.feature__title {
  display: flex;
  flex-direction: column;
  margin: 0;
  color: #f7f9fc;
  font-weight: 800;
  font-size: clamp(2.45rem, 8.6vw, 3.15rem);
  letter-spacing: -0.048em;
  line-height: 0.94;
}

.feature__lede {
  max-width: 28rem;
  margin: 1rem 0 0;
  color: rgba(247, 249, 252, 0.66);
  font-size: 1.02rem;
  line-height: 1.45;
}

.feature__index {
  display: flex;
  flex-wrap: wrap;
  gap: 0.15rem 1.15rem;
}

.feature__tab {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  min-height: 2.75rem;
  padding: 0.15rem 0.2rem;
  border: 0;
  background: transparent;
  color: rgba(247, 249, 252, 0.46);
  font: inherit;
  font-size: 0.95rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.1;
  cursor: pointer;
}

.feature__avatar {
  position: relative;
  width: 2rem;
  height: 2rem;
  overflow: hidden;
  border-radius: 999px;
  background: #14161c;
  flex: 0 0 auto;
}

.feature__avatar img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.feature__avatar img.is-crop {
  position: absolute;
  max-width: none;
  object-fit: fill;
}

.feature__tab:hover {
  color: rgba(247, 249, 252, 0.82);
}

.feature__tab[aria-selected='true'] {
  color: #f7f9fc;
}

.feature__tab[aria-selected='true'] .feature__avatar {
  box-shadow: 0 0 0 2px #050608, 0 0 0 3.5px #f7f9fc;
}

.feature__tab:focus-visible {
  outline: 2px solid #67e8f9;
  outline-offset: 3px;
}

.feature-swap-enter-active {
  transition: opacity 160ms ease;
}

.feature-swap-enter-from {
  opacity: 0;
}

.home-proof {
  scroll-margin-top: calc(var(--header-height, 70px) + 0.5rem);
}

@media (min-width: 640px) {
  .feature {
    padding-inline: 1.5rem;
  }
}

@media (min-width: 1024px) {
  .feature {
    padding: 5.5rem 2rem 6.25rem;
  }

  .feature__wrap {
    gap: 2rem;
  }

  .feature__title {
    font-size: clamp(3.1rem, 4.4vw, 4.35rem);
  }

  .feature__lede {
    margin-top: 1.15rem;
    font-size: 1.08rem;
  }

  .feature__stage {
    min-height: 36rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .feature-swap-enter-active {
    transition: none;
  }
}
</style>
