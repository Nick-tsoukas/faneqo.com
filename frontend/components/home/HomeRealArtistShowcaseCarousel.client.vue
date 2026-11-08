<template>
  <div class="relative" :class="{ 'is-refined-shell': refined }">
    <button
      type="button"
      class="showcase-nav showcase-nav--prev hidden lg:flex"
      aria-label="Previous artist"
      @click="slidePrev"
    >
      <svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
    </button>
    <button
      type="button"
      class="showcase-nav showcase-nav--next hidden lg:flex"
      aria-label="Next artist"
      @click="slideNext"
    >
      <svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </button>

    <Swiper
      :modules="modules"
      :slides-per-view="refined ? 1.16 : 1.42"
      :space-between="refined ? 12 : 12"
      :centered-slides="true"
      :centered-slides-bounds="false"
      :grab-cursor="true"
      :loop="false"
      :rewind="artists.length > 1"
      :initial-slide="clampedInitialIndex"
      :speed="speed"
      :keyboard="{ enabled: true }"
      :mousewheel="false"
      :watch-overflow="true"
      :a11y="{
        enabled: true,
        prevSlideMessage: 'Previous artist',
        nextSlideMessage: 'Next artist',
      }"
      :pagination="refined
        ? false
        : {
            clickable: true,
            bulletClass: 'showcase-bullet',
            bulletActiveClass: 'showcase-bullet-active',
          }"
      :breakpoints="breakpoints"
      class="artist-showcase-swiper"
      :class="{ 'is-reduced-motion': reducedMotion, 'is-refined': refined }"
      @swiper="onSwiper"
      @slideChange="onSlideChange"
    >
      <SwiperSlide
        v-for="artist in artists"
        :key="artist.slug"
      >
        <div class="showcase-slide-inner">
          <HomeArtistProofCard
            v-if="refined"
            :artist="artist"
          />
          <DemoArtistProfileShowcase
            v-else
            :artist="artist"
            mode="showcase"
            :animated="false"
          />
        </div>
      </SwiperSlide>
    </Swiper>

    <p
      v-if="artists.length > 1"
      class="mt-1 flex items-center justify-center gap-2 text-xs text-white/40 sm:hidden"
      aria-hidden="true"
    >
      <span class="tracking-wide">Swipe artists</span>
      <svg class="h-3.5 w-3.5 opacity-80" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M8 9l-4 3 4 3M16 9l4 3-4 3" />
      </svg>
    </p>
  </div>
</template>

<script setup>
/**
 * Client-only Swiper shell.
 * Must remain a .client.vue file so Swiper never enters the Nitro SSR bundle.
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Swiper, SwiperSlide } from 'swiper/vue'
import { A11y, Keyboard, Pagination } from 'swiper/modules'
import DemoArtistProfileShowcase from '@/components/marketing/DemoArtistProfileShowcase.vue'
import HomeArtistProofCard from '@/components/home/HomeArtistProofCard.vue'

import 'swiper/css'
import 'swiper/css/pagination'

const props = defineProps({
  artists: {
    type: Array,
    required: true,
  },
  /** Prefer 2 so the 3rd phone is centered with neighbors peeking. */
  initialIndex: {
    type: Number,
    default: 2,
  },
  /** Homepage V2: one dominant card + peek. Production `/` leaves this false. */
  refined: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['active-change'])

const modules = computed(() =>
  props.refined ? [Keyboard, A11y] : [Pagination, Keyboard, A11y]
)
const swiperRef = ref(null)
const reducedMotion = ref(false)

const artists = computed(() =>
  (props.artists || []).filter((a) => a && typeof a.slug === 'string' && a.slug)
)

/** Always prefer the 3rd slide (index 2) when there are enough phones. */
const clampedInitialIndex = computed(() => {
  const n = artists.value.length
  if (n <= 1) return 0
  const preferred = Number.isFinite(props.initialIndex) ? props.initialIndex : 2
  return Math.min(Math.max(preferred, 0), n - 1)
})

const speed = computed(() => (reducedMotion.value ? 0 : 520))

const breakpoints = computed(() => {
  if (props.refined) {
    return {
      0: { slidesPerView: 1.12, spaceBetween: 12 },
      480: { slidesPerView: 1.35, spaceBetween: 14 },
      640: { slidesPerView: 2.05, spaceBetween: 18 },
      900: { slidesPerView: 2.65, spaceBetween: 20 },
      1024: { slidesPerView: 3.05, spaceBetween: 22 },
      1280: { slidesPerView: 3.35, spaceBetween: 24 },
    }
  }
  return {
    0: { slidesPerView: 1.42, spaceBetween: 12 },
    480: { slidesPerView: 1.55, spaceBetween: 14 },
    640: { slidesPerView: 1.85, spaceBetween: 18 },
    768: { slidesPerView: 2.25, spaceBetween: 22 },
    1024: { slidesPerView: 2.65, spaceBetween: 28 },
    1280: { slidesPerView: 2.85, spaceBetween: 32 },
  }
})

function emitActive(index) {
  const list = artists.value
  if (!list.length) return
  const i = ((index % list.length) + list.length) % list.length
  emit('active-change', { index: i, artist: list[i] })
}

function jumpToInitial(swiper = swiperRef.value) {
  if (!swiper || !artists.value.length) return
  const start = clampedInitialIndex.value
  swiper.slideTo(start, 0)
  emitActive(start)
}

function onSwiper(swiper) {
  swiperRef.value = swiper
  // initial-slide should already be set; reinforce after layout so centered peeks stick.
  jumpToInitial(swiper)
  nextTick(() => jumpToInitial(swiper))
}

function onSlideChange(swiper) {
  emitActive(swiper.realIndex ?? swiper.activeIndex ?? 0)
}

function slidePrev() {
  swiperRef.value?.slidePrev()
}

function slideNext() {
  swiperRef.value?.slideNext()
}

let mq = null
let onMq = null

onMounted(() => {
  mq = window.matchMedia('(prefers-reduced-motion: reduce)')
  reducedMotion.value = mq.matches
  onMq = (e) => {
    reducedMotion.value = e.matches
  }
  mq.addEventListener('change', onMq)

  // One more pass after paint — Swiper can settle on 0 before slides measure.
  requestAnimationFrame(() => jumpToInitial())

  if (import.meta.dev) {
    console.log('[ArtistShowcase] carousel mounted', {
      count: artists.value.length,
      slugs: artists.value.map((a) => a.slug),
      initialIndex: clampedInitialIndex.value,
    })
  }
})

watch(
  () => [artists.value.length, clampedInitialIndex.value],
  () => {
    nextTick(() => jumpToInitial())
  }
)

onBeforeUnmount(() => {
  if (mq && onMq) mq.removeEventListener('change', onMq)
  swiperRef.value = null
})
</script>

<style scoped>
.is-refined-shell {
  width: min(100%, 76rem);
  margin-inline: auto;
}

.artist-showcase-swiper {
  overflow: visible;
  padding-bottom: 2.25rem;
  /* Bleed slightly so side phones aren't clipped by section padding */
  margin-inline: -0.5rem;
}

@media (min-width: 640px) {
  .artist-showcase-swiper {
    margin-inline: 0;
  }
}

.artist-showcase-swiper :deep(.swiper-slide) {
  display: flex;
  align-items: stretch;
  height: auto;
  opacity: 0.55;
  transform: scale(0.88);
  transition:
    opacity 0.45s ease,
    transform 0.45s cubic-bezier(0.22, 1, 0.36, 1),
    filter 0.45s ease;
}

.artist-showcase-swiper.is-refined :deep(.swiper-slide) {
  opacity: 0.62;
  transform: scale(0.92);
  filter: none;
}

.artist-showcase-swiper :deep(.swiper-slide-active) {
  opacity: 1;
  transform: scale(1);
  z-index: 2;
}

.artist-showcase-swiper.is-refined :deep(.swiper-slide-active) {
  filter: none;
}

.artist-showcase-swiper :deep(.swiper-slide-prev),
.artist-showcase-swiper :deep(.swiper-slide-next) {
  opacity: 0.7;
  transform: scale(0.9);
}

.artist-showcase-swiper.is-refined :deep(.swiper-slide-prev),
.artist-showcase-swiper.is-refined :deep(.swiper-slide-next) {
  opacity: 0.9;
  transform: scale(0.955);
  filter: none;
}

.artist-showcase-swiper.is-reduced-motion :deep(.swiper-slide),
.artist-showcase-swiper.is-reduced-motion :deep(.swiper-slide-active),
.artist-showcase-swiper.is-reduced-motion :deep(.swiper-slide-prev),
.artist-showcase-swiper.is-reduced-motion :deep(.swiper-slide-next) {
  transition: none;
  transform: none;
  filter: none;
}

.artist-showcase-swiper :deep(.swiper-pagination) {
  bottom: 0;
  display: flex;
  justify-content: center;
  gap: 0.35rem;
}

.artist-showcase-swiper :deep(.showcase-bullet) {
  display: inline-block;
  width: 0.4rem;
  height: 0.4rem;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.28);
  opacity: 1;
  cursor: pointer;
  transition:
    width 0.3s ease,
    background 0.3s ease;
}

.artist-showcase-swiper :deep(.showcase-bullet-active) {
  width: 1.35rem;
  background: linear-gradient(90deg, #ec4899, #a855f7);
}

.showcase-slide-inner {
  width: 100%;
  height: 100%;
  max-width: min(320px, 82vw);
  margin: 0 auto;
}

.artist-showcase-swiper.is-refined {
  padding: 1rem 0.35rem 1.15rem;
}

.artist-showcase-swiper.is-refined .showcase-slide-inner {
  display: block;
  width: 100%;
  max-width: min(20.5rem, 84vw);
  height: 100%;
}

.artist-showcase-swiper.is-refined .showcase-slide-inner > * {
  height: 100%;
}

@media (min-width: 640px) {
  .showcase-slide-inner {
    max-width: 360px;
  }
}

@media (min-width: 1024px) {
  .showcase-slide-inner {
    max-width: 400px;
  }
}

.showcase-nav {
  position: absolute;
  top: 42%;
  z-index: 20;
  width: 2.75rem;
  height: 2.75rem;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(0, 0, 0, 0.55);
  color: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(10px);
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease;
}

.showcase-nav:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(236, 72, 153, 0.45);
  color: white;
}

.showcase-nav:focus-visible {
  outline: 2px solid #39d5ff;
  outline-offset: 3px;
}

.is-refined-shell .showcase-nav {
  top: 44%;
  width: 2.75rem;
  height: 2.75rem;
  background: rgba(5, 6, 8, 0.72);
}

.showcase-nav--prev {
  left: 0;
}

.showcase-nav--next {
  right: 0;
}

@media (prefers-reduced-motion: reduce) {
  .artist-showcase-swiper :deep(.swiper-slide) {
    transition: none;
    transform: none;
  }
}
</style>
