<template>
  <div
    class="proof-fallback"
    aria-label="Real Faneqo artist pages"
  >
    <NuxtLink
      v-for="artist in cards"
      :key="artist.slug"
      :to="`/${artist.slug}`"
      class="proof-fallback__card"
      :aria-label="`View ${artist.name} on Faneqo`"
    >
      <div class="proof-fallback__image">
        <img
          v-if="artist.heroImage"
          :src="artist.heroImage"
          :alt="artist.name"
          width="800"
          height="1000"
          loading="lazy"
          decoding="async"
        />
        <div v-else class="proof-fallback__image-empty" aria-hidden="true" />
        <div class="proof-fallback__veil" aria-hidden="true" />
        <div class="proof-fallback__identity">
          <strong>{{ artist.name }}</strong>
          <span>Live Faneqo page</span>
        </div>
      </div>
      <span class="proof-fallback__action">
        View live page
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </span>
    </NuxtLink>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  artists: {
    type: Array,
    default: () => [],
  },
})

const cards = computed(() => {
  const seen = new Set()
  const next = []
  for (const artist of props.artists || []) {
    const slug = String(artist?.slug || '').trim()
    if (!slug || seen.has(slug)) continue
    seen.add(slug)
    next.push({
      slug,
      name: String(artist?.name || 'Artist').trim() || 'Artist',
      heroImage: artist?.heroImage || artist?.heroImageMobile || '',
    })
    if (next.length >= 3) break
  }
  return next
})
</script>

<style scoped>
.proof-fallback {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(16rem, 84%);
  gap: 0.9rem;
  width: min(100%, 64rem);
  margin: 0 auto;
  padding: 0.2rem 0.1rem 0.8rem;
  overflow-x: auto;
  overscroll-behavior-inline: contain;
  scroll-snap-type: inline mandatory;
  scrollbar-width: none;
}

.proof-fallback::-webkit-scrollbar {
  display: none;
}

.proof-fallback__card {
  display: flex;
  min-width: 0;
  flex-direction: column;
  overflow: hidden;
  scroll-snap-align: center;
  border-radius: 1.45rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: #0b0e14;
  color: #f7f9fc;
  text-decoration: none;
  box-shadow:
    0 24px 52px -16px rgba(0, 0, 0, 0.9),
    0 0 0 1px rgba(255, 255, 255, 0.04);
}

.proof-fallback__card:focus-visible {
  outline: 2px solid #39d5ff;
  outline-offset: 4px;
}

.proof-fallback__image {
  position: relative;
  min-height: 26rem;
  overflow: hidden;
  background: #111217;
}

.proof-fallback__image img,
.proof-fallback__image-empty {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 26rem;
  object-fit: cover;
  object-position: center 18%;
}

.proof-fallback__image-empty {
  background: linear-gradient(155deg, #24142f 0%, #111722 54%, #07141b 100%);
}

.proof-fallback__veil {
  position: absolute;
  inset: 35% 0 0;
  background: linear-gradient(180deg, transparent 0%, rgba(5, 6, 8, 0.94) 100%);
}

.proof-fallback__identity {
  position: absolute;
  inset: auto 0 0;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  padding: 1.15rem;
}

.proof-fallback__identity strong {
  font-size: 1.75rem;
  font-weight: 800;
  line-height: 0.95;
  letter-spacing: -0.045em;
}

.proof-fallback__identity span {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(247, 249, 252, 0.62);
}

.proof-fallback__action {
  display: flex;
  min-height: 3.25rem;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  font-size: 0.9rem;
  font-weight: 700;
}

.proof-fallback__action svg {
  width: 1rem;
  height: 1rem;
  color: #39d5ff;
}

@media (min-width: 768px) {
  .proof-fallback {
    grid-auto-flow: initial;
    grid-auto-columns: initial;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    overflow: visible;
  }

  .proof-fallback__image,
  .proof-fallback__image img,
  .proof-fallback__image-empty {
    min-height: 28rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .proof-fallback {
    scroll-behavior: auto;
  }
}
</style>
