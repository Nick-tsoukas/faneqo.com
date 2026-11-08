<template>
  <div class="pgx">
    <GalleryTopBar
      :artist-name="name"
      :artist-path="artistPath"
      :back-to="artistPath"
      :back-label="name"
    />

    <main class="pgx__main">
      <header class="pgx__id">
        <div class="pgx__who">
          <NuxtLink :to="artistPath" class="pgx__artist">
            <span class="pgx__ring">
              <img
                v-if="artistImage.src"
                class="pgx__img"
                :src="artistImage.src"
                :srcset="artistImage.srcset || undefined"
                :sizes="artistImage.sizes || undefined"
                :style="focalStyle"
                alt=""
                decoding="async"
                fetchpriority="high"
              >
              <span v-else class="pgx__initial" aria-hidden="true">{{ artistInitial }}</span>
            </span>
            <span class="pgx__name">{{ name }}</span>
          </NuxtLink>
          <p v-if="countLine" class="pgx__tally">{{ countLine }}</p>
        </div>
        <h1 class="pgx__title">Galleries</h1>
        <div class="pgx__plate" aria-hidden="true" />
      </header>

      <p v-if="!galleries.length" class="pgx__empty">
        No public galleries yet.
      </p>

      <ul
        v-else
        class="pgx__list"
        :class="{ 'is-one': galleries.length === 1 }"
      >
        <li v-for="(item, index) in galleries" :key="item.id || item.slug">
          <NuxtLink :to="item.canonicalPath" class="pgx__item">
            <span class="pgx__cover">
              <img
                v-if="item.cover?.url"
                :src="item.cover.url"
                :alt="item.cover.alt || item.title || ''"
                :width="item.cover.width || undefined"
                :height="item.cover.height || undefined"
                :style="{ objectPosition: coverPosition(item.cover) }"
                :loading="index < 2 ? 'eager' : 'lazy'"
                :fetchpriority="index === 0 ? 'high' : 'auto'"
                sizes="(min-width: 1440px) 720px, (min-width: 800px) 44vw, 100vw"
                decoding="async"
              >
            </span>
            <span class="pgx__meta">
              <span class="pgx__work">{{ item.title || 'Gallery' }}</span>
              <span class="pgx__count">{{ photoLine(item.photoCount) }}</span>
            </span>
          </NuxtLink>
        </li>
      </ul>
    </main>
  </div>
</template>

<script setup>
/**
 * The public gallery index — whose work, and which collection to enter.
 *
 * This is a discovery surface, not the gallery itself. Covers hang in a
 * shared 3:2 frame so a visitor can read several collections in one scroll.
 * Native ratios belong on the gallery page. Titles sit at reading size
 * under the still, the same way the gallery ending presents More From.
 */
import { computed } from 'vue'
import GalleryTopBar from '~/features/gallery-experience/canonical/GalleryTopBar.vue'
import { publicGalleryCountLabel } from '~/utils/galleries/publicGalleryDiscovery'
import { getBestArtistImageSource } from '~/utils/media/artistImage'

const props = defineProps({
  artist: { type: Object, default: null },
  galleries: { type: Array, default: () => [] },
  bandSlug: { type: String, default: '' },
})

const name = computed(() => String(props.artist?.name || '').trim() || 'Artist')
const artistPath = computed(() => (props.bandSlug ? `/${props.bandSlug}` : '/'))
const artistInitial = computed(() => (name.value ? name.value.slice(0, 1).toUpperCase() : ''))
const artistImage = computed(() => getBestArtistImageSource(props.artist?.image, 'thumb'))
const focalStyle = computed(() => ({
  objectPosition: `${Number.isFinite(Number(props.artist?.focalX)) ? Number(props.artist.focalX) : 50}% ${Number.isFinite(Number(props.artist?.focalY)) ? Number(props.artist.focalY) : 50}%`,
}))
const countLine = computed(() => {
  const n = props.galleries.length
  if (!n) return ''
  return n === 1 ? 'One gallery' : `${n} galleries`
})

function photoLine(count) {
  return publicGalleryCountLabel(count)
}

/** Tall covers keep faces near the top of the 3:2 frame. Landscapes stay centered. */
function coverPosition(cover) {
  const width = Number(cover?.width) || 0
  const height = Number(cover?.height) || 0
  if (width > 0 && height > width * 1.08) return '50% 16%'
  return '50% 50%'
}
</script>

<style scoped>
.pgx {
  min-height: 100dvh;
  overflow-x: clip;
  background: #050608;
  color: #f7f9fc;
  font-family: Poppins, ui-sans-serif, system-ui, sans-serif;
}

.pgx__main {
  --pgx-x: max(20px, env(safe-area-inset-left, 0px));
  box-sizing: border-box;
  max-width: calc(1600px + 2 * var(--pgx-x));
  margin: 0 auto;
  padding: 4px var(--pgx-x) calc(72px + env(safe-area-inset-bottom, 0px));
}

@media (min-width: 640px) {
  .pgx__main { --pgx-x: max(32px, env(safe-area-inset-left, 0px)); padding-top: 8px; }
}

@media (min-width: 1024px) {
  .pgx__main { --pgx-x: max(56px, env(safe-area-inset-left, 0px)); padding-top: 12px; }
}

@media (min-width: 1440px) {
  .pgx__main { --pgx-x: max(72px, env(safe-area-inset-left, 0px)); }
}

.pgx__who {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.pgx__artist {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  min-height: 44px;
  color: rgba(247, 249, 252, 0.66);
  text-decoration: none;
  transition: color 160ms linear;
}

.pgx__artist:hover {
  color: rgba(247, 249, 252, 0.94);
}

.pgx__ring {
  display: grid;
  place-items: center;
  flex: none;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  overflow: hidden;
  background: #0b0e14;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.12);
}

@media (min-width: 1024px) {
  .pgx__ring { width: 28px; height: 28px; }
}

.pgx__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.pgx__initial {
  font-size: 11px;
  font-weight: 500;
  color: rgba(247, 249, 252, 0.7);
}

.pgx__name {
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (min-width: 1024px) {
  .pgx__name { font-size: 12.5px; }
}

.pgx__tally {
  margin: 0;
  flex: none;
  font-size: 12.5px;
  letter-spacing: 0.02em;
  color: rgba(247, 249, 252, 0.46);
  font-variant-numeric: tabular-nums;
}

.pgx__title {
  margin: 10px 0 0;
  font-size: clamp(1.5rem, 6.4vw, 1.75rem);
  font-weight: 600;
  letter-spacing: -0.032em;
  line-height: 1.08;
  color: #f7f9fc;
}

@media (min-width: 640px) {
  .pgx__title {
    margin-top: 14px;
    font-size: clamp(1.7rem, 3.2vw, 2.05rem);
  }
}

@media (min-width: 1024px) {
  .pgx__title {
    margin-top: 16px;
    font-size: clamp(1.85rem, 2.1vw, 2.25rem);
    letter-spacing: -0.036em;
    line-height: 1.05;
  }
}

.pgx__plate {
  margin: 18px 0 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

@media (min-width: 1024px) {
  .pgx__plate { margin-top: 22px; }
}

.pgx__list {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 28px;
  margin: 28px 0 0;
  padding: 0;
  list-style: none;
}

@media (min-width: 800px) {
  .pgx__list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 36px 28px;
    margin-top: 36px;
  }
  .pgx__list.is-one {
    grid-template-columns: minmax(0, 38rem);
  }
}

.pgx__item {
  display: block;
  color: inherit;
  text-decoration: none;
}

.pgx__cover {
  display: block;
  aspect-ratio: 3 / 2;
  overflow: hidden;
  background: #0b0c10;
}

.pgx__cover img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  transition: opacity 200ms linear;
}

.pgx__meta {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-top: 12px;
}

.pgx__work,
.pgx__count {
  display: block;
}

.pgx__work {
  font-size: 16px;
  font-weight: 600;
  letter-spacing: -0.018em;
  line-height: 1.3;
  overflow-wrap: anywhere;
}

@media (min-width: 1024px) {
  .pgx__work { font-size: 17px; }
}

.pgx__count {
  flex: none;
  color: rgba(247, 249, 252, 0.48);
  font-size: 13px;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.01em;
}

.pgx__empty {
  margin: 28px 0 0;
  max-width: 28rem;
  color: rgba(247, 249, 252, 0.62);
  font-size: 16px;
  line-height: 1.5;
}

.pgx__artist:focus-visible,
.pgx__item:focus-visible {
  outline: 2px solid rgba(247, 249, 252, 0.92);
  outline-offset: 3px;
}

@media (hover: hover) {
  .pgx__item:hover .pgx__cover img { opacity: 0.88; }
}

@media (prefers-reduced-motion: reduce) {
  .pgx__artist,
  .pgx__cover img { transition: none; }
}
</style>
