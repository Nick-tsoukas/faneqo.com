<template>
  <div class="film" :style="filmStyle">
    <PhotoField class="film__photo" :media="photo" fade="deep" />
    <div class="film__veil" aria-hidden="true" />

    <div class="mark">
      <img src="/faneqo-wordmark.svg" alt="Faneqo" />
    </div>

    <header class="type">
      <p v-if="c.kicker" class="kicker">{{ c.kicker }}</p>
      <h1 :style="{ fontSize: `calc(var(--h1) * ${headlineScale([c.headlineTop, c.headlineAccent])})` }">
        <span class="line">{{ c.headlineTop }}</span>
        <span v-if="c.headlineAccent" class="line line--accent">{{ c.headlineAccent }}</span>
      </h1>
    </header>

    <div v-if="enabled" class="card">
      <p class="card__kicker">Follow</p>
      <h2>{{ listHeadline }}</h2>
      <p class="card__lede">Stay close to {{ name }}.</p>
      <div class="card__field" aria-hidden="true">Email address</div>
      <div class="card__button">{{ buttonLabel }}</div>
      <div v-if="thumbs.length" class="thumbs">
        <p>From the gallery</p>
        <div class="thumbs__row">
          <PhotoField v-for="(frame, index) in thumbs" :key="frame.url + index" class="thumbs__photo" :media="frame" fade="none" />
        </div>
      </div>
    </div>
    <p v-else class="off">Fan list is off on this page. The join card stays hidden until it is turned on.</p>

    <footer class="end">
      <p class="end__copy">
        <span v-for="(line, index) in lines" :key="`${index}-${line}`" :class="{ 'is-accent': index === lines.length - 1 && lines.length > 1 }">{{ line }}</span>
      </p>
      <img src="/faneqo-wordmark.svg" alt="Faneqo" />
      <span v-if="c.cta">{{ c.cta }}</span>
    </footer>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import PhotoField from '@/features/ads/studio/primitives/PhotoField.vue'
import { headlineScale } from '@/features/ads/studio/board.js'
import { closeLines } from '@/features/ads/studio/motion.js'
import { galleryPhotos } from '@/features/ads/studio/campaigns.js'

/**
 * Fan list campaign. The card follows the artist-page join: email, the artist's
 * button, and gallery photographs when that gallery exists. Nothing submits.
 */
const props = defineProps({
  content: { type: Object, required: true },
  snapshot: { type: Object, default: null },
  pose: { type: Object, default: null },
})

const c = computed(() => props.content || {})
const name = computed(() => props.snapshot?.name || 'the artist')
const enabled = computed(() => props.snapshot?.fanList?.enabled !== false)
const listHeadline = computed(() => props.snapshot?.fanList?.headline || 'Join the fan list')
const buttonLabel = computed(() => props.snapshot?.fanList?.buttonLabel || 'Join fan list')
const photo = computed(() => c.value.photo || props.snapshot?.hero || null)
const thumbs = computed(() => galleryPhotos(props.snapshot).filter((frame) => frame.url !== photo.value?.url).slice(0, 3))
const lines = computed(() => closeLines(c.value.motion?.close))
const filmStyle = computed(() => {
  const pose = props.pose
  if (!pose) return null
  return {
    '--fl-kicker': pose.kicker,
    '--fl-line1': pose.line1,
    '--fl-line2': pose.line2,
    '--fl-line1-y': `${pose.line1Y}px`,
    '--fl-line2-y': `${pose.line2Y}px`,
    '--fl-card': pose.card,
    '--fl-card-y': `${pose.cardY}px`,
    '--fl-thumbs': pose.thumbs,
    '--fl-close': pose.close,
    '--fl-close-y': `${pose.closeY}px`,
  }
})
</script>

<style scoped>
.film {
  position: absolute;
  inset: 0;
  color: #f7f9fc;
  font-family: Poppins, ui-sans-serif, system-ui, sans-serif;
}

.film__photo { position: absolute; inset: 0; }

.mark {
  position: absolute;
  top: var(--safe-top);
  right: var(--safe-x);
  z-index: 3;
  opacity: calc(1 - var(--fl-close, 0));
}

.mark img { height: 22px; }

.film__veil {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(5, 5, 7, 0.2) 0%, rgba(5, 5, 7, 0.08) 28%, rgba(5, 5, 7, 0.55) 58%, #050507 100%);
}

.type {
  position: absolute;
  top: var(--type-top);
  right: var(--safe-x);
  left: var(--safe-x);
  z-index: 2;
}

.kicker {
  margin: 0 0 14px;
  color: #7ee7ff;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  opacity: var(--fl-kicker, 1);
}

h1 {
  margin: 0;
  font-weight: 800;
  letter-spacing: -0.045em;
  line-height: 0.92;
}

.line { display: block; }
.line:first-child {
  opacity: var(--fl-line1, 1);
  transform: translate3d(0, var(--fl-line1-y, 0px), 0);
}
.line--accent {
  background: linear-gradient(90deg, #ff4ad8 0%, #c084fc 48%, #67e8f9 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  opacity: var(--fl-line2, 1);
  transform: translate3d(0, var(--fl-line2-y, 0px), 0);
}

.card,
.off {
  position: absolute;
  right: var(--safe-x);
  bottom: calc(var(--safe-bottom) + 28px);
  left: var(--safe-x);
  z-index: 2;
}

.card {
  padding: 28px 28px 24px;
  border: 1px solid rgba(139, 108, 255, 0.3);
  border-radius: 28px;
  background:
    radial-gradient(ellipse 90% 42% at 50% -6%, rgba(139, 108, 255, 0.1) 0%, transparent 58%),
    #0b0c10;
  box-shadow: inset 0 1px 0 rgba(186, 168, 255, 0.2);
  opacity: var(--fl-card, 1);
  transform: translate3d(0, var(--fl-card-y, 0px), 0);
}

.card::before {
  content: '';
  position: absolute;
  top: 0;
  right: 11%;
  left: 11%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(167, 139, 255, 0.7), transparent);
}

.card__kicker {
  margin: 0 0 8px;
  color: rgba(247, 249, 252, 0.62);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

h2 {
  margin: 0;
  font-size: 36px;
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.05;
}

.card__lede {
  margin: 8px 0 18px;
  color: rgba(247, 249, 252, 0.72);
  font-size: 20px;
}

.card__field {
  display: flex;
  align-items: center;
  min-height: 64px;
  margin-bottom: 12px;
  padding: 0 18px;
  border: 1px solid rgba(247, 249, 252, 0.16);
  border-radius: 16px;
  background: #08090d;
  color: rgba(247, 249, 252, 0.46);
  font-size: 20px;
}

.card__button {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 64px;
  border-radius: 16px;
  background: linear-gradient(180deg, #ffffff 0%, #ece8f6 100%);
  color: #0c0d12;
  font-size: 22px;
  font-weight: 700;
}

.thumbs {
  margin-top: 18px;
  opacity: var(--fl-thumbs, 1);
}

.thumbs p {
  margin: 0 0 10px;
  color: rgba(247, 249, 252, 0.55);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.thumbs__row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.thumbs__photo { height: 92px; }

.off {
  margin: 0;
  color: rgba(247, 249, 252, 0.72);
  font-size: 22px;
}

.end {
  position: absolute;
  right: var(--safe-x);
  bottom: calc(var(--safe-bottom) + 48px);
  left: var(--safe-x);
  z-index: 3;
  opacity: var(--fl-close, 0);
  transform: translate3d(0, var(--fl-close-y, 0px), 0);
  pointer-events: none;
}

.end__copy {
  max-width: 11em;
  margin: 0 0 22px;
  font-size: calc(var(--h1) * 0.84);
  font-weight: 800;
  letter-spacing: -0.045em;
  line-height: 0.92;
}

.end__copy span { display: block; }
.end__copy .is-accent {
  background: linear-gradient(90deg, #ff4ad8, #c084fc 50%, #67e8f9);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.end img { height: 40px; }
.end > span {
  display: block;
  margin-top: 16px;
  color: #f7f9fc;
  font-size: calc(var(--h1) * 0.34);
  font-weight: 600;
}
</style>
