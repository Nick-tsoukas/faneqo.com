<template>
  <article
    class="board"
    :class="campaign === 'page'
      ? [`v-${variant}`, `x-${excerpt}`, { 'is-page': isPage, 'is-motion': motionLive }]
      : ['is-campaign', `is-${campaign}`, { 'is-motion': motionLive }]"
    :data-format="formatId"
    :style="boardStyle"
    :aria-label="`${c.headlineTop} ${c.headlineAccent}. Faneqo.`"
  >
    <FanListCampaign v-if="campaign === 'fan-list'" :content="c" :snapshot="snapshot" :pose="campaignPose" />
    <NightCampaign v-else-if="campaign === 'night'" :content="c" :snapshot="snapshot" :pose="campaignPose" />
    <ShowCampaign v-else-if="campaign === 'show'" :content="c" :snapshot="snapshot" />

    <!-- Artist page: a phone is the hero. Headline above it, the promise and brand below. -->
    <template v-else-if="isPage">
      <div class="glow" aria-hidden="true" />

      <header class="mast">
        <p v-if="c.kicker" class="kicker">{{ c.kicker }}</p>
        <h1 :style="{ fontSize: `calc(var(--h1) * ${headlineScale([c.headlineTop, c.headlineAccent])})` }">
          <span class="line">{{ c.headlineTop }}</span>
          <span v-if="c.headlineAccent" class="line line--accent">{{ c.headlineAccent }}</span>
        </h1>
        <p v-if="variant === 'bleed' && c.support" class="support">{{ c.support }}</p>
      </header>

      <div class="phone">
        <div class="phone__bezel">
          <div class="phone__screen">
            <ProductExcerpt
              frame="phone"
              kind="page"
              :snapshot="snapshot"
              :photo="c.photo"
              :song-art="c.songArt"
              :link-keys="c.showcaseLinks"
              :max-links="linkCap"
              :moving="motionLive"
              :shift="shiftPx"
              :drift="driftPx"
            />
          </div>
          <span class="phone__island" aria-hidden="true" />
          <span class="phone__fade" aria-hidden="true" />
        </div>
      </div>

      <div v-if="variant === 'bleed'" class="topmark">
        <img src="/faneqo-wordmark.svg" alt="Faneqo" />
        <span>{{ c.site }}</span>
      </div>
      <footer v-else class="dock">
        <p v-if="c.support" class="dock__support">{{ c.support }}</p>
        <div class="dock__brand">
          <img class="dock__mark" src="/faneqo-wordmark.svg" alt="Faneqo" />
          <span v-if="c.cta" class="dock__cta">{{ c.cta }} <i>→</i></span>
          <span class="dock__site">{{ c.site }}</span>
        </div>
      </footer>

      <footer v-if="motionLive" class="film-close">
        <p class="film-close__copy">
          <span v-for="(line, i) in lines" :key="`${i}-${line}`" :class="{ 'is-accent': i === lines.length - 1 && lines.length > 1 }">{{ line }}</span>
        </p>
        <img class="film-close__mark" src="/faneqo-wordmark.svg" alt="Faneqo" />
        <span v-if="c.cta || c.site" class="film-close__action">
          <span v-if="c.cta" class="film-close__cta">{{ c.cta }}</span>
          <span v-if="c.site" class="film-close__site">{{ c.site }}</span>
        </span>
      </footer>
    </template>

    <!-- Section excerpts stay a sheet: song, fan list, shows, gallery. -->
    <template v-else>
      <header class="mast">
        <p v-if="c.kicker" class="kicker">{{ c.kicker }}</p>
        <h1 :style="{ fontSize: `calc(var(--h1) * ${headlineScale([c.headlineTop, c.headlineAccent])})` }">
          <span class="line">{{ c.headlineTop }}</span>
          <span v-if="c.headlineAccent" class="line" :class="{ 'line--accent': c.accentLine }">{{ c.headlineAccent }}</span>
        </h1>
        <p v-if="c.support" class="support">{{ c.support }}</p>
      </header>

      <div class="product">
        <ProductExcerpt :kind="excerpt" :snapshot="snapshot" :photo="c.photo" :song-art="c.songArt" :compact="excerpt === 'page'" :max-links="2" />
      </div>

      <div v-if="variant === 'bleed'" class="topmark">
        <img src="/faneqo-wordmark.svg" alt="Faneqo" />
        <span>{{ c.site }}</span>
      </div>
      <CreativeClose v-else class="foot" :cta="c.cta" :site="c.site" />
    </template>
  </article>
</template>

<script setup>
import { computed } from 'vue'
import CreativeClose from '@/features/ads/studio/primitives/CreativeClose.vue'
import ProductExcerpt from '@/features/ads/studio/primitives/ProductExcerpt.vue'
import FanListCampaign from '@/features/ads/studio/templates/showcase/FanListCampaign.vue'
import NightCampaign from '@/features/ads/studio/templates/showcase/NightCampaign.vue'
import ShowCampaign from '@/features/ads/studio/templates/showcase/ShowCampaign.vue'
import { boardVars, headlineScale } from '@/features/ads/studio/board.js'
import { isAdFormat } from '@/features/ads/formats.js'
import { campaignFrames, productStyle } from '@/features/ads/studio/campaigns.js'
import { closeLines, fanListPose, motionSettings, nightPose, pageTravel, productMotionFilm, productShowcasePose } from '@/features/ads/studio/motion.js'

/**
 * Product Showcase. The artist-page excerpt is a phone: the real Faneqo page,
 * framed as a device, with the headline above and the promise, wordmark, and
 * CTA below. Other excerpts stay a sheet inside the frame.
 *
 * Bleed runs the phone off the bottom edge and moves the wordmark to the corner.
 */
const props = defineProps({
  format: { type: String, default: 'post' },
  content: { type: Object, required: true },
  snapshot: { type: Object, default: null },
  scene: { type: Number, default: 0 },
  /**
   * Playback time in milliseconds. Omitted (null) is the approved still,
   * including PNG export. A number seeks the story film to that frame.
   */
  t: { type: Number, default: null },
})

/* Sheet excerpts: headline, then the product, then the close. */
const CAMPAIGN = {
  post: { 'type-top': 96, h1: 72 },
  feed: { 'type-top': 88, h1: 68 },
  story: { 'type-top': 280, h1: 80 },
  square: { 'type-top': 72, h1: 48 },
}

const SHEET = {
  post: { 'mast-top': 96, h1: 76, 'product-top': 420, 'product-bottom': 230, 'foot-bottom': 96 },
  feed: { 'mast-top': 96, h1: 72, 'product-top': 400, 'product-bottom': 220, 'foot-bottom': 96 },
  story: { 'mast-top': 290, h1: 86, 'product-top': 660, 'product-bottom': 480, 'foot-bottom': 344 },
  square: { 'mast-top': 80, h1: 62, 'product-top': 330, 'product-bottom': 190, 'foot-bottom': 80 },
}

/* Phone excerpts. The device fills the space between the headline and the dock. */
const PHONE = {
  post: { 'mast-top': 72, h1: 76, 'phone-w': 520, 'phone-top': 280, 'phone-bottom': 210, 'phone-hero': 380, 'dock-bottom': 64 },
  feed: { 'mast-top': 60, h1: 70, 'phone-w': 500, 'phone-top': 232, 'phone-bottom': 196, 'phone-hero': 360, 'dock-bottom': 52 },
  story: { 'mast-top': 276, h1: 84, 'phone-w': 540, 'phone-top': 490, 'phone-bottom': 460, 'phone-hero': 440, 'dock-bottom': 308 },
  square: { 'mast-top': 48, h1: 54, 'phone-w': 420, 'phone-top': 188, 'phone-bottom': 176, 'phone-hero': 248, 'dock-bottom': 44 },
}

const EXCERPTS = ['page', 'song', 'fanlist', 'shows', 'gallery']

const formatId = computed(() => (isAdFormat(props.format) ? props.format : 'post'))
const c = computed(() => props.content || {})
const variant = computed(() => (c.value.variant === 'bleed' ? 'bleed' : 'stack'))
const excerpt = computed(() => (EXCERPTS.includes(c.value.excerpt) ? c.value.excerpt : 'page'))
const campaign = computed(() => productStyle(c.value))
const isPage = computed(() => excerpt.value === 'page')
const linkCap = computed(() => (formatId.value === 'square' ? 2 : 3))
const vars = computed(() => boardVars(formatId.value, campaign.value !== 'page' ? CAMPAIGN : (isPage.value ? PHONE : SHEET)))

/* Motion is opt-in, Story-only, and inert unless a time is passed. */
const motion = computed(() => motionSettings(c.value))
const film = computed(() => productMotionFilm(c.value))
const motionLive = computed(() => props.t != null && Number.isFinite(Number(props.t)) && formatId.value === 'story' && Boolean(film.value) && Boolean(motion.value))
const pose = computed(() => {
  if (!motionLive.value || film.value !== 'page') return null
  return productShowcasePose(Number(props.t), motion.value.durationMs)
})
const campaignPose = computed(() => {
  if (!motionLive.value || film.value === 'page') return null
  const time = Number(props.t)
  if (film.value === 'fan-list') return fanListPose(time, motion.value.durationMs)
  return nightPose(time, motion.value.durationMs, campaignFrames(props.snapshot).slice(0, 3).length || 1)
})
const lines = computed(() => closeLines(motion.value?.close))
const shiftPx = computed(() => (pose.value ? pose.value.scroll * pageTravel(props.snapshot) : 0))
const driftPx = computed(() => (pose.value ? pose.value.drift * 8 : 0))
const boardStyle = computed(() => {
  if (!pose.value) return vars.value
  const p = pose.value
  return {
    ...vars.value,
    '--m-kicker': p.kicker,
    '--m-line1': p.line1,
    '--m-line2': p.line2,
    '--m-line1-y': `${p.line1Y}px`,
    '--m-line2-y': `${p.line2Y}px`,
    '--m-mast-y': `${p.mastY}px`,
    '--m-mast-s': p.mastScale,
    '--m-phone-o': p.phoneOpacity,
    '--m-phone-y': `${p.phoneY}px`,
    '--m-phone-s': p.phoneScale,
    '--m-dock': p.dock,
    '--m-glow': p.glow,
    '--m-close': p.close,
    '--m-close-y': `${p.closeY}px`,
  }
})
</script>

<style scoped>
.board {
  position: relative;
  width: var(--board-w, 1080px);
  height: var(--board-h, 1440px);
  overflow: hidden;
  background: #050507;
  color: #f7f9fc;
  font-family: Poppins, ui-sans-serif, system-ui, sans-serif;
}

.glow {
  position: absolute;
  top: calc(var(--phone-top) - 40px);
  left: 50%;
  width: 980px;
  height: 980px;
  transform: translateX(-50%);
  background:
    radial-gradient(circle at 50% 42%, rgba(192, 132, 252, 0.22) 0%, rgba(255, 74, 216, 0.07) 34%, rgba(5, 5, 7, 0) 66%);
  pointer-events: none;
}

.mast {
  position: absolute;
  top: var(--mast-top);
  right: var(--safe-x);
  left: var(--safe-x);
  z-index: 2;
}

.kicker {
  margin: 0 0 12px;
  color: #7ee7ff;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

h1 {
  margin: 0;
  font-weight: 800;
  letter-spacing: -0.055em;
  line-height: 0.88;
  text-transform: uppercase;
}

.line { display: block; }

.line--accent {
  width: fit-content;
  max-width: 100%;
  background: linear-gradient(90deg, #ff4ad8 0%, #c084fc 55%, #67e8f9 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.support {
  max-width: 640px;
  margin: 16px 0 0;
  color: rgba(247, 249, 252, 0.72);
  font-size: 24px;
  font-weight: 500;
  letter-spacing: -0.02em;
  line-height: 1.3;
}

/* —— Phone —— */
.phone {
  position: absolute;
  top: var(--phone-top);
  bottom: var(--phone-bottom);
  left: 50%;
  z-index: 1;
  width: var(--phone-w);
  transform: translateX(-50%);
}

.phone__bezel {
  position: relative;
  height: 100%;
  padding: 14px;
  border-radius: 64px;
  background:
    linear-gradient(165deg, rgba(255, 255, 255, 0.55), rgba(255, 255, 255, 0) 16%),
    linear-gradient(180deg, #3a3c44 0%, #1a1b20 28%, #0c0d11 100%);
  box-shadow:
    0 36px 80px rgba(0, 0, 0, 0.55),
    0 0 0 1px rgba(255, 255, 255, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.28);
}

.phone__screen {
  height: 100%;
  overflow: hidden;
  border-radius: 50px;
  background: #070708;
}

.phone__island {
  position: absolute;
  top: 26px;
  left: 50%;
  z-index: 3;
  width: 112px;
  height: 32px;
  border-radius: 20px;
  background: #050506;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.05);
  transform: translateX(-50%);
}

/* The page continues; the fade keeps a cropped row from reading as a broken cut. */
.phone__fade {
  position: absolute;
  right: 14px;
  bottom: 14px;
  left: 14px;
  z-index: 2;
  height: 48px;
  border-radius: 0 0 50px 50px;
  background: linear-gradient(to bottom, rgba(7, 7, 8, 0) 0%, rgba(7, 7, 8, 0.72) 55%, #070708 100%);
  pointer-events: none;
}

.is-page.v-bleed .phone {
  bottom: -64px;
}

.is-page.v-bleed .phone__bezel {
  border-bottom-right-radius: 28px;
  border-bottom-left-radius: 28px;
}

.dock {
  position: absolute;
  right: var(--safe-x);
  bottom: var(--dock-bottom);
  left: var(--safe-x);
  z-index: 2;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 36px;
  align-items: end;
}

.dock__support {
  display: -webkit-box;
  max-width: 16em;
  margin: 0 0 4px;
  overflow: hidden;
  color: rgba(247, 249, 252, 0.82);
  font-size: 28px;
  font-weight: 500;
  letter-spacing: -0.03em;
  line-height: 1.2;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.dock__brand {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.dock__mark { width: 156px; height: auto; }

.dock__cta {
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1;
  white-space: nowrap;
}

.dock__cta i { font-style: normal; }

.dock__site {
  color: rgba(247, 249, 252, 0.46);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

/* —— Sheet excerpts (unchanged composition) —— */
.product {
  position: absolute;
  top: var(--product-top);
  right: var(--safe-x);
  bottom: var(--product-bottom);
  left: var(--safe-x);
  z-index: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

.x-page .product {
  right: 72px;
  left: 72px;
}

.v-bleed .product {
  right: 48px;
  bottom: -40px;
  left: 48px;
}

.v-bleed.x-page .product :deep(.kind-page) {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}

.x-song .product,
.x-fanlist .product,
.x-shows .product,
.x-gallery .product {
  justify-content: safe center;
}

.v-bleed:not(.x-page) .product {
  bottom: var(--product-bottom);
}

.foot {
  position: absolute;
  right: var(--safe-x);
  bottom: var(--foot-bottom);
  left: var(--safe-x);
  z-index: 2;
  width: auto;
}

.topmark {
  position: absolute;
  top: calc(var(--mast-top) - 6px);
  right: var(--safe-x);
  z-index: 3;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.topmark img { width: 136px; height: auto; }

.topmark span {
  color: rgba(247, 249, 252, 0.42);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.16em;
}

.v-bleed .mast { padding-right: 200px; }

.is-page.v-bleed .support { max-width: 460px; }

.board[data-format="square"] .kicker { margin-bottom: 8px; font-size: 13px; }
.board[data-format="square"] .dock__support { font-size: 22px; }
.board[data-format="square"] .dock__cta { font-size: 22px; }
.board[data-format="square"] .dock__mark { width: 132px; }
.board[data-format="square"] .phone__bezel { padding: 12px; border-radius: 52px; }
.board[data-format="square"] .phone__screen { border-radius: 40px; }
.board[data-format="square"] .phone__island { top: 22px; width: 92px; height: 26px; }
.board[data-format="square"] .phone__fade { right: 12px; bottom: 12px; left: 12px; height: 72px; border-radius: 0 0 40px 40px; }

.board[data-format="story"] .dock__support { font-size: 30px; }
.board[data-format="story"] .dock__cta { font-size: 28px; }
.board[data-format="story"] .dock__mark { width: 168px; }

/* Story film. These rules apply only while a playback time is passed. */
.board.is-motion .glow { opacity: var(--m-glow); }

.board.is-motion .mast {
  transform: translate3d(0, var(--m-mast-y), 0) scale(var(--m-mast-s));
  transform-origin: 0 0;
}

.board.is-motion .kicker { opacity: var(--m-kicker); }

.board.is-motion .line {
  opacity: var(--m-line1);
  transform: translate3d(0, var(--m-line1-y), 0);
}

.board.is-motion .line--accent {
  opacity: var(--m-line2);
  transform: translate3d(0, var(--m-line2-y), 0);
}

.board.is-motion .support { opacity: var(--m-line2); }

.board.is-motion .phone {
  opacity: var(--m-phone-o);
  transform: translate3d(-50%, var(--m-phone-y), 0) scale(var(--m-phone-s));
  transform-origin: 50% 22%;
}

.board.is-motion .dock,
.board.is-motion .topmark { opacity: var(--m-dock); }

/* The film's proof is the phone. The still keeps its caption and URL. */
.board.is-motion .dock__support,
.board.is-motion .dock__site { visibility: hidden; }

.film-close {
  position: absolute;
  right: var(--safe-x);
  bottom: 360px;
  left: var(--safe-x);
  z-index: 4;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 22px;
  opacity: var(--m-close);
  transform: translate3d(0, var(--m-close-y), 0);
  pointer-events: none;
}

.film-close__copy {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin: 0;
  font-size: 54px;
  font-weight: 700;
  letter-spacing: -0.045em;
  line-height: 1.02;
}

.film-close__copy span { display: block; }

.film-close__copy .is-accent {
  width: fit-content;
  max-width: 100%;
  background: linear-gradient(90deg, #ff4ad8 0%, #c084fc 55%, #67e8f9 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.film-close__mark { width: 168px; height: auto; }

.film-close__action {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.film-close__cta {
  color: #f7f9fc;
  font-size: 30px;
  font-weight: 700;
  letter-spacing: -0.03em;
}

/* The held last frame names where to go. */
.film-close__site {
  color: rgba(247, 249, 252, 0.56);
  font-size: 24px;
  font-weight: 500;
  letter-spacing: 0.01em;
}
</style>
