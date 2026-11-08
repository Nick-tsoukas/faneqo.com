<template>
  <article
    class="board"
    :class="[`v-${variant}`, { 'has-art': Boolean(artSrc) }]"
    :data-format="formatId"
    :style="vars"
    :aria-label="`${c.title} by ${artistName}.`"
  >
    <!-- Bleed: the artwork, blurred, becomes the room the record sits in -->
    <div v-if="variant === 'bleed' && artSrc" class="room" aria-hidden="true">
      <img class="room__img" :src="artSrc" alt="" />
      <div class="room__veil" />
    </div>

    <!-- Colour pulled from the artwork, used once, under the record -->
    <div class="glow" aria-hidden="true" />

    <header class="kicker"><p>{{ c.kicker }}</p></header>

    <div class="stage">
      <div v-if="variant === 'sleeve'" class="disc" aria-hidden="true">
        <div class="disc__label" />
      </div>
      <div class="art" :style="artBox">
        <img v-if="artSrc" class="art__img" :src="artSrc" alt="" />
        <div v-else class="art__empty"><span>No artwork</span></div>
      </div>
    </div>

    <div class="copy">
      <p class="artist" :style="{ fontSize: `calc(var(--artist) * ${nameScale(artistName, { short: 14, medium: 22, long: 32 })})` }">{{ artistName }}</p>
      <h1 :style="{ fontSize: `calc(var(--h1) * ${titleScale})` }">{{ c.title }}</h1>
      <p v-if="c.line" class="line">{{ c.line }}</p>
      <div v-if="c.releaseLabel || c.playerExcerpt" class="meta">
        <div v-if="c.playerExcerpt" class="player" inert>
          <div class="player__play"><svg viewBox="0 0 24 24"><path d="M9 6.8v10.4L18.2 12 9 6.8z" /></svg></div>
          <div class="player__bar"><i /></div>
          <span class="player__time">Play</span>
        </div>
        <span v-if="c.releaseLabel" class="release">{{ c.releaseLabel }}</span>
      </div>
    </div>

    <CreativeClose class="foot" :cta="c.cta" :site="c.site" />
  </article>
</template>

<script setup>
import { computed } from 'vue'
import CreativeClose from '@/features/ads/studio/primitives/CreativeClose.vue'
import { boardVars, nameScale } from '@/features/ads/studio/board.js'
import { studioImageUrl } from '@/features/ads/studio/mediaUrl.js'
import { isAdFormat } from '@/features/ads/formats.js'

/**
 * Song / Release Spotlight. The artwork is the star; everything else serves it.
 * Variants: cover (artwork centred over a colour glow), bleed (blurred artwork
 * as the room), sleeve (artwork with a record half-drawn behind it).
 */
const props = defineProps({
  format: { type: String, default: 'post' },
  content: { type: Object, required: true },
  snapshot: { type: Object, default: null },
  scene: { type: Number, default: 0 },
})

const LAYOUTS = {
  post: { 'kicker-top': 96, 'stage-top': 190, art: 720, 'copy-top': 980, h1: 92, artist: 20, 'foot-bottom': 96 },
  feed: { 'kicker-top': 96, 'stage-top': 180, art: 660, 'copy-top': 900, h1: 88, artist: 20, 'foot-bottom': 96 },
  story: { 'kicker-top': 290, 'stage-top': 400, art: 800, 'copy-top': 1270, h1: 100, artist: 22, 'foot-bottom': 344 },
  square: { 'kicker-top': 80, 'stage-top': 150, art: 520, 'copy-top': 710, h1: 72, artist: 18, 'foot-bottom': 80 },
}

const formatId = computed(() => (isAdFormat(props.format) ? props.format : 'post'))
const c = computed(() => props.content || {})
const variant = computed(() => (['cover', 'bleed', 'sleeve'].includes(c.value.variant) ? c.value.variant : 'cover'))
const accent = computed(() => c.value.accent || '#c084fc')
const vars = computed(() => ({ ...boardVars(formatId.value, LAYOUTS), '--accent': accent.value }))
const artistName = computed(() => c.value.artistName || props.snapshot?.name || 'Artist')
const art = computed(() => c.value.art || props.snapshot?.song?.art || null)
const artSrc = computed(() => studioImageUrl(art.value?.url))
/* Square covers fill the box; portrait or landscape artwork keeps its own proportions inside it, never cropped. */
const artBox = computed(() => {
  const w = Number(art.value?.width)
  const h = Number(art.value?.height)
  if (!w || !h || Math.abs(w / h - 1) < 0.04) return null
  return w > h
    ? { width: 'var(--box)', height: 'auto', aspectRatio: `${w} / ${h}` }
    : { width: 'auto', height: 'var(--box)', aspectRatio: `${w} / ${h}` }
})
const titleScale = computed(() => {
  const n = String(c.value.title || '').length
  return n <= 10 ? 1 : n <= 16 ? 0.84 : n <= 24 ? 0.7 : n <= 34 ? 0.56 : 0.46
})
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

.room {
  position: absolute;
  inset: -80px;
  overflow: hidden;
}

.room__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: blur(70px) saturate(1.2) brightness(0.45);
  transform: scale(1.2);
}

.room__veil {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, rgba(5, 5, 6, 0.35) 0%, rgba(5, 5, 6, 0.55) 55%, rgba(5, 5, 6, 0.96) 100%);
}

.glow {
  position: absolute;
  top: calc(var(--stage-top) + var(--art) * 0.35);
  left: 50%;
  width: calc(var(--art) * 1.25);
  height: calc(var(--art) * 0.9);
  transform: translateX(-50%);
  border-radius: 50%;
  background: radial-gradient(closest-side, var(--accent) 0%, rgba(5, 5, 6, 0) 72%);
  opacity: 0.42;
}

.v-bleed .glow { opacity: 0.22; }
.v-sleeve .glow { left: 58%; opacity: 0.32; }

.kicker {
  position: absolute;
  top: var(--kicker-top);
  left: var(--safe-x);
  z-index: 2;
}

.kicker p {
  margin: 0;
  color: #7ee7ff;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

.stage {
  position: absolute;
  top: var(--stage-top);
  right: var(--safe-x);
  left: var(--safe-x);
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  height: var(--art);
}

.v-sleeve .stage {
  justify-content: flex-start;
}

.art {
  position: relative;
  z-index: 2;
  flex: 0 0 auto;
  --box: var(--art);
  width: var(--box);
  height: var(--box);
  overflow: hidden;
  border-radius: 10px;
  background: #0b0b0e;
  box-shadow: 0 50px 110px rgba(0, 0, 0, 0.62), 0 0 0 1px rgba(255, 255, 255, 0.06);
}

.v-sleeve .art {
  --box: calc(var(--art) * 0.86);
  border-radius: 6px;
}

.art__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.art__empty {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #1a1b20 0%, #0b0b0e 70%);
  color: rgba(247, 249, 252, 0.3);
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.disc {
  position: absolute;
  top: calc(var(--art) * 0.07);
  left: calc(var(--art) * 0.46);
  z-index: 1;
  display: grid;
  place-items: center;
  width: calc(var(--art) * 0.86);
  height: calc(var(--art) * 0.86);
  border-radius: 50%;
  background:
    repeating-radial-gradient(circle, rgba(255, 255, 255, 0.045) 0 2px, rgba(0, 0, 0, 0) 2px 7px),
    radial-gradient(circle, #15161a 0%, #0a0a0c 62%, #050506 100%);
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.6), inset 0 0 0 1px rgba(255, 255, 255, 0.08);
}

.disc__label {
  width: 32%;
  height: 32%;
  border-radius: 50%;
  background: radial-gradient(circle, #050506 0 12%, var(--accent) 13%, var(--accent) 100%);
  opacity: 0.9;
}

.copy {
  position: absolute;
  top: var(--copy-top);
  right: var(--safe-x);
  left: var(--safe-x);
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.artist {
  margin: 0;
  color: rgba(247, 249, 252, 0.72);
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

h1 {
  margin: 0;
  font-weight: 800;
  letter-spacing: -0.05em;
  line-height: 0.9;
  text-transform: uppercase;
  overflow-wrap: anywhere;
}

.line {
  margin: 2px 0 0;
  color: rgba(247, 249, 252, 0.72);
  font-size: 24px;
  font-weight: 500;
  letter-spacing: -0.02em;
  line-height: 1.3;
}

.meta {
  display: flex;
  align-items: center;
  gap: 22px;
  margin-top: 6px;
}

.player {
  display: flex;
  flex: 1;
  align-items: center;
  gap: 16px;
  max-width: 520px;
}

.player__play {
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #f4f6f8;
  color: #050506;
}

.player__play svg { width: 24px; height: 24px; margin-left: 2px; fill: currentColor; }

.player__bar {
  position: relative;
  flex: 1;
  height: 4px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.16);
}

.player__bar i {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 22%;
  border-radius: 999px;
  background: #f7f9fc;
}

.player__time {
  color: rgba(247, 249, 252, 0.5);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.release {
  padding: 10px 16px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 999px;
  font-size: 14px;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  white-space: nowrap;
}

.foot {
  position: absolute;
  right: var(--safe-x);
  bottom: var(--foot-bottom);
  left: var(--safe-x);
  z-index: 2;
  width: auto;
}
</style>
