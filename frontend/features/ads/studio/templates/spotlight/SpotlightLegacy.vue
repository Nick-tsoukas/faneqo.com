<template>
  <article
    class="board"
    :class="[`v-${variant}`]"
    :data-format="formatId"
    :data-treatment="treatment"
    :style="vars"
    :aria-label="`${c.headlineTop} ${c.headlineAccent}. ${artistName}.`"
  >
    <!-- Portrait: the photograph is the whole field -->
    <PhotoField v-if="variant === 'portrait'" class="field" :media="photo" :focal="focal" fade="deep" />

    <!-- Story: a 9:16 frame around a landscape band would otherwise be black above and below. The photograph, blurred and dimmed, fills the room. -->
    <div v-if="roomFill" class="room" aria-hidden="true">
      <PhotoField class="room__photo" :media="photo" :focal="focal" fade="none" />
      <div class="room__veil" />
    </div>

    <!-- Photo band and page excerpt open with the editorial label; the artist's name below is the hero. In square the badge shares this row. -->
    <header v-if="variant !== 'portrait'" class="series">
      <h1 class="label">
        <span>{{ c.headlineTop }}</span>
        <span v-if="labelAccent" class="line--accent">{{ labelAccent }}</span>
      </h1>
      <div v-if="badgeInSeries" class="badge badge--series">
        <i />
        <span>{{ c.badgeText }}</span>
      </div>
    </header>

    <PhotoField v-if="variant === 'photo'" class="hero" :media="photo" :focal="focal" fade="bottom" />

    <div v-if="variant === 'product'" class="page">
      <ProductExcerpt kind="page" :snapshot="excerptSnapshot" :photo="excerptPhoto" :song-art="songArt" compact :max-links="2" />
    </div>

    <div class="lower">
      <h1 v-if="variant === 'portrait'" class="label">
        <span>{{ c.headlineTop }}</span>
        <span v-if="labelAccent" class="line--accent">{{ labelAccent }}</span>
      </h1>
      <!-- Reading order: photograph, artist name, then the featured song as the secondary beat. -->
      <h2 :style="{ fontSize: `calc(var(--h2) * ${nameScale(artistName)})` }">{{ artistName }}</h2>
      <p v-if="c.description" class="desc">{{ c.description }}</p>

      <div v-if="variant !== 'product' && c.songTitle" class="product" inert>
        <img v-if="songArtSrc" class="product__art" :src="songArtSrc" alt="" />
        <div v-else class="product__art product__art--empty" />
        <div class="product__copy">
          <strong>{{ c.songTitle }}</strong>
          <span>Featured song</span>
        </div>
        <div class="product__play" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="M9 6.8v10.4L18.2 12 9 6.8z" /></svg>
        </div>
      </div>

      <div v-if="c.badgeText && !badgeInSeries" class="badge">
        <i />
        <span>{{ c.badgeText }}</span>
      </div>
    </div>

    <CreativeClose class="foot" :cta="c.cta" :site="c.site" />
  </article>
</template>

<script setup>
import { computed } from 'vue'
import CreativeClose from '@/features/ads/studio/primitives/CreativeClose.vue'
import PhotoField from '@/features/ads/studio/primitives/PhotoField.vue'
import ProductExcerpt from '@/features/ads/studio/primitives/ProductExcerpt.vue'
import { boardVars, nameScale } from '@/features/ads/studio/board.js'
import { studioImageUrl } from '@/features/ads/studio/mediaUrl.js'
import { isAdFormat } from '@/features/ads/formats.js'

/**
 * Artist Spotlight. Photograph dominant, artist name the hero, featured song
 * secondary, one close.
 * Variants: photo (editorial band), portrait (full-bleed), product (page excerpt).
 *
 * Every block is placed from the per-format table below so nothing overlaps
 * by accident: band → lower block → foot are stacked with explicit gaps.
 */
const props = defineProps({
  format: { type: String, default: 'post' },
  content: { type: Object, required: true },
  snapshot: { type: Object, default: null },
  scene: { type: Number, default: 0 },
})

/*
 * Vertical budgets (board height − foot − safe zones) by format. The foot is ~88px tall.
 *   post   1440: label 104–~138 · band 184–904 · lower 936–~1206 · foot top ~1252
 *   feed   1350: label 104–~138 · band 184–814 · lower 846–~1116 · foot top ~1162
 *   story  1920: label 272–~308 · band 356–1132 · lower 1164–~1440 · foot top ~1500 (ends 1592, inside the 320 safe)
 *   square 1080: label 84–~112 · band 156–656 · lower 684–~858 · foot top ~908
 * The close is its own tier: the lower block ends at least ~45px above it in every format.
 * Portrait anchors the lower block to the foot instead; its name size is `h2-portrait`.
 */
const LAYOUTS = {
  post: { 'series-top': 104, 'hero-top': 184, 'hero-h': 720, 'lower-top': 936, 'lower-gap': 16, h2: 84, 'h2-portrait': 104, label: 30, desc: 26, 'foot-bottom': 96, 'lower-lift': 140, 'page-top': 184, 'page-h': 1016 },
  feed: { 'series-top': 104, 'hero-top': 184, 'hero-h': 630, 'lower-top': 846, 'lower-gap': 16, h2: 80, 'h2-portrait': 100, label: 30, desc: 26, 'foot-bottom': 96, 'lower-lift': 140, 'page-top': 184, 'page-h': 916 },
  story: { 'series-top': 272, 'hero-top': 356, 'hero-h': 776, 'lower-top': 1164, 'lower-gap': 16, h2: 92, 'h2-portrait': 112, label: 32, desc: 28, 'foot-bottom': 328, 'lower-lift': 146, 'page-top': 356, 'page-h': 1096 },
  square: { 'series-top': 84, 'hero-top': 156, 'hero-h': 500, 'lower-top': 684, 'lower-gap': 14, h2: 60, 'h2-portrait': 78, label: 24, desc: 24, 'foot-bottom': 80, 'lower-lift': 128, 'page-top': 156, 'page-h': 708 },
}

const TREATMENTS = ['natural', 'balanced', 'deep']

const formatId = computed(() => (isAdFormat(props.format) ? props.format : 'post'))
const c = computed(() => props.content || {})
const variant = computed(() => (['photo', 'portrait', 'product'].includes(c.value.variant) ? c.value.variant : 'photo'))
/* Photograph treatment: how much shade the frame lays over the photograph. Missing on older creatives = balanced. */
const treatment = computed(() => (TREATMENTS.includes(c.value.treatment) ? c.value.treatment : 'balanced'))
const vars = computed(() => {
  const v = boardVars(formatId.value, LAYOUTS)
  if (variant.value === 'portrait') v['--h2'] = v['--h2-portrait']
  return v
})
const badgeInSeries = computed(() => formatId.value === 'square' && variant.value === 'photo' && Boolean(c.value.badgeText))
const roomFill = computed(() => formatId.value === 'story' && variant.value !== 'portrait' && Boolean(photo.value))
const artistName = computed(() => c.value.artistName || props.snapshot?.name || 'Artist')
/* "Meet / {artist}": when the accent line is the artist's name, the name below is the hero and the label keeps only the lead word. */
const norm = (s) => String(s || '').trim().toLowerCase().replace(/\s+/g, ' ')
const labelAccent = computed(() => (norm(c.value.headlineAccent) && norm(c.value.headlineAccent) === norm(artistName.value) ? '' : c.value.headlineAccent))
const photo = computed(() => c.value.photo || props.snapshot?.hero || null)
const focal = computed(() => c.value.focal || photo.value?.focal || null)
/* The page excerpt crops its own hero; hand it the creative's focal so the framing matches the other variants. */
const excerptPhoto = computed(() => (photo.value ? { ...photo.value, focal: focal.value || photo.value.focal || null } : null))
/* Square has no room for the fan-list card under the link rows; without it the excerpt ends cleanly and the hero gets the height. */
const excerptSnapshot = computed(() => {
  if (formatId.value !== 'square' || !props.snapshot) return props.snapshot
  return { ...props.snapshot, fanList: { ...(props.snapshot.fanList || {}), enabled: false } }
})
/* `null` is an explicit "no artwork" from the editor; only a missing key falls back to the page's song art. */
const songArt = computed(() => (c.value.songArt === null ? null : c.value.songArt || props.snapshot?.song?.art || null))
const songArtSrc = computed(() => studioImageUrl(songArt.value?.url))
</script>

<style scoped>
.board {
  position: relative;
  width: var(--board-w, 1080px);
  height: var(--board-h, 1440px);
  overflow: hidden;
  background: #050506;
  color: #f7f9fc;
  font-family: Poppins, ui-sans-serif, system-ui, sans-serif;
}

.field {
  position: absolute;
  inset: 0;
}

.series {
  position: absolute;
  top: var(--series-top);
  right: var(--safe-x);
  left: var(--safe-x);
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

/* Story room fill: the photograph itself, out of focus, so the frame around the band is never flat black. */
.room {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
}

.room__photo {
  position: absolute;
  inset: -48px;
  filter: blur(44px) saturate(1.15) brightness(0.5);
  transform: scale(1.08);
}

.room__veil {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(5, 5, 6, 0.62) 0%,
    rgba(5, 5, 6, 0.5) 20%,
    rgba(5, 5, 6, 0.6) 60%,
    rgba(5, 5, 6, 0.9) 82%,
    #050506 100%
  );
}

.line--accent {
  background: linear-gradient(90deg, #ff4ad8 0%, #c084fc 46%, #67e8f9 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

/* The headline as an editorial label: one line, tracked, the accent word in colour. */
.label {
  display: flex;
  flex-wrap: wrap;
  gap: 0 0.5em;
  margin: 0 0 -2px;
  font-size: var(--label);
  font-weight: 800;
  letter-spacing: 0.1em;
  line-height: 1.1;
  text-transform: uppercase;
}

.series .label { margin: 0; }

.hero {
  position: absolute;
  top: var(--hero-top);
  right: 0;
  left: 0;
  z-index: 1;
  height: var(--hero-h);
}

/*
 * Treatment presets. Balanced is the gradient as designed; Natural lifts the
 * shade for photographs that are already dark or moody; Deep adds shade for
 * bright, high-key photographs so the type still sits on something solid.
 */
.board[data-treatment="natural"] .hero :deep(.photo__shade),
.board[data-treatment="natural"] .field :deep(.photo__shade),
.board[data-treatment="natural"] .page :deep(.hero__photo .photo__shade) { opacity: 0.72; }

.board[data-treatment="deep"] .hero :deep(.photo__img),
.board[data-treatment="deep"] .field :deep(.photo__img),
.board[data-treatment="deep"] .page :deep(.hero__photo .photo__img) { filter: brightness(0.84) contrast(1.06); }

/* Deep ramps start earlier and reach text-safe density sooner; the top of the photograph stays open. */
.board[data-treatment="deep"].v-photo .hero :deep(.photo__shade) {
  background: linear-gradient(
    to bottom,
    rgba(5, 5, 6, 0.34) 0%,
    rgba(5, 5, 6, 0) 12%,
    rgba(5, 5, 6, 0) 58%,
    rgba(5, 5, 6, 0.5) 80%,
    rgba(5, 5, 6, 0.86) 100%
  );
}

.board[data-treatment="deep"].v-portrait .field :deep(.photo__shade) {
  background: linear-gradient(
    to bottom,
    rgba(5, 5, 6, 0.3) 0%,
    rgba(5, 5, 6, 0) 12%,
    rgba(5, 5, 6, 0) 36%,
    rgba(5, 5, 6, 0.46) 48%,
    rgba(5, 5, 6, 0.86) 61%,
    rgba(5, 5, 6, 0.97) 76%,
    #050506 100%
  );
}

.board[data-format="square"][data-treatment="deep"].v-portrait .field :deep(.photo__shade) {
  background: linear-gradient(
    to bottom,
    rgba(5, 5, 6, 0.3) 0%,
    rgba(5, 5, 6, 0) 12%,
    rgba(5, 5, 6, 0) 22%,
    rgba(5, 5, 6, 0.62) 38%,
    rgba(5, 5, 6, 0.93) 52%,
    rgba(5, 5, 6, 0.98) 76%,
    #050506 100%
  );
}

.board[data-treatment="deep"].v-product .page :deep(.hero__photo .photo__shade) {
  background: linear-gradient(
    to bottom,
    rgba(5, 5, 6, 0.26) 0%,
    rgba(5, 5, 6, 0) 18%,
    rgba(5, 5, 6, 0) 42%,
    rgba(5, 5, 6, 0.68) 74%,
    rgba(5, 5, 6, 0.94) 100%
  );
}

/*
 * Photographic treatment. The band keeps its contrast: a whisper of shade at
 * the top so it seats into the dark field, and a soft foot so the edge never
 * reads as a hard rectangle. The lower block sits below the band, not on it.
 */
.v-photo .hero :deep(.photo__shade) {
  background: linear-gradient(
    to bottom,
    rgba(5, 5, 6, 0.4) 0%,
    rgba(5, 5, 6, 0) 13%,
    rgba(5, 5, 6, 0) 76%,
    rgba(5, 5, 6, 0.38) 90%,
    rgba(5, 5, 6, 0.74) 100%
  );
}

/* Portrait: open top, the ramp begins only where the type lives. */
.v-portrait .field :deep(.photo__shade) {
  background: linear-gradient(
    to bottom,
    rgba(5, 5, 6, 0.22) 0%,
    rgba(5, 5, 6, 0) 11%,
    rgba(5, 5, 6, 0) 42%,
    rgba(5, 5, 6, 0.38) 54%,
    rgba(5, 5, 6, 0.8) 67%,
    rgba(5, 5, 6, 0.96) 82%,
    #050506 100%
  );
}

/* Square portrait: the type stack starts higher up the photograph, so the ramp starts earlier. */
.board[data-format="square"].v-portrait .field :deep(.photo__shade) {
  background: linear-gradient(
    to bottom,
    rgba(5, 5, 6, 0.22) 0%,
    rgba(5, 5, 6, 0) 11%,
    rgba(5, 5, 6, 0) 28%,
    rgba(5, 5, 6, 0.56) 44%,
    rgba(5, 5, 6, 0.9) 58%,
    rgba(5, 5, 6, 0.97) 80%,
    #050506 100%
  );
}

.page {
  position: absolute;
  top: var(--page-top);
  right: 72px;
  left: 72px;
  height: var(--page-h);
  z-index: 2;
}

/* Square: the bio line goes too, so the hero inside the page is tall enough to hold a face. */
.board[data-format="square"].v-product .page :deep(.bio) { display: none; }

/* Page excerpt: the hero inside the page keeps its light; only the name strip is shaded. */
.v-product .page :deep(.hero__photo .photo__shade) {
  background: linear-gradient(
    to bottom,
    rgba(5, 5, 6, 0.16) 0%,
    rgba(5, 5, 6, 0) 14%,
    rgba(5, 5, 6, 0) 54%,
    rgba(5, 5, 6, 0.52) 80%,
    rgba(5, 5, 6, 0.88) 100%
  );
}

.lower {
  position: absolute;
  top: var(--lower-top);
  right: var(--safe-x);
  left: var(--safe-x);
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: var(--lower-gap);
}

.v-portrait .lower {
  top: auto;
  bottom: calc(var(--foot-bottom) + var(--lower-lift));
}

.v-product .lower {
  display: none;
}

/* Song row: art, title, play — one compact unit, never stretched across the frame. */
.product {
  display: flex;
  align-items: center;
  align-self: flex-start;
  gap: 18px;
  max-width: 100%;
}

.product__art {
  width: 64px;
  height: 64px;
  border-radius: 8px;
  object-fit: cover;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.4);
}

.product__art--empty {
  background: linear-gradient(135deg, #1c1d22, #0b0b0e);
}

.product__copy {
  display: flex;
  flex: 0 1 auto;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.product__copy strong {
  overflow: hidden;
  color: rgba(247, 249, 252, 0.9);
  font-size: 28px;
  font-weight: 600;
  letter-spacing: -0.025em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product__copy span {
  color: rgba(247, 249, 252, 0.55);
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.product__play {
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  width: 52px;
  height: 52px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);
  color: #f7f9fc;
}

.product__play svg {
  width: 22px;
  height: 22px;
  margin-left: 3px;
  fill: currentColor;
}

h2 {
  margin: 0;
  font-weight: 800;
  letter-spacing: -0.045em;
  line-height: 0.95;
  text-transform: uppercase;
}

.v-portrait h2 {
  letter-spacing: -0.05em;
  line-height: 0.9;
  text-shadow: 0 2px 24px rgba(0, 0, 0, 0.35);
}

.desc {
  display: -webkit-box;
  margin: -4px 0 0;
  overflow: hidden;
  color: rgba(247, 249, 252, 0.74);
  font-size: var(--desc);
  font-weight: 500;
  letter-spacing: -0.02em;
  line-height: 1.3;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.board[data-format="square"].v-photo .desc { -webkit-line-clamp: 1; }

.badge {
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  gap: 10px;
  height: 46px;
  padding: 0 18px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 999px;
  font-size: 18px;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.badge--series {
  flex: 0 0 auto;
  height: 42px;
  padding: 0 16px;
  font-size: 16px;
}

.badge i {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ff4ad8;
}

.foot {
  position: absolute;
  right: var(--safe-x);
  bottom: var(--foot-bottom);
  left: var(--safe-x);
  z-index: 2;
  width: auto;
}

/* The action tier has to survive a ~400px phone render of a 1080 board: CTA and destination sized to be read, not decoded. */
.foot :deep(.close__cta) { height: 60px; padding: 0 22px; font-size: 22px; }
.foot :deep(.close__cta svg) { width: 18px; height: 18px; }
.foot :deep(.close__rule) { height: 60px; }
.foot :deep(.close__site) { color: rgba(247, 249, 252, 0.72); font-size: 18px; letter-spacing: 0.12em; }

/* Page excerpt copy: the bio is the only artist copy in that variant, so it gets a readable size. */
.v-product .page :deep(.bio) { font-size: 22px; }
</style>
