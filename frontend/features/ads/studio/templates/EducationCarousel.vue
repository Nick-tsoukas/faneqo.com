<template>
  <article
    class="board"
    :class="[`v-${variant}`, `kind-${current.kind}`]"
    :data-format="formatId"
    :data-scene="sceneIndex"
    :style="vars"
    :aria-label="ariaLabel"
  >
    <!-- Cover -->
    <template v-if="current.kind === 'cover'">
      <header class="head"><p class="kicker">{{ c.kicker }}</p></header>
      <div class="cover">
        <h1 :style="{ fontSize: `calc(var(--h1) * ${coverScale})` }">{{ c.cover.headline }}</h1>
        <p v-if="c.cover.sub" class="sub">{{ c.cover.sub }}</p>
      </div>
      <div class="swipe" aria-hidden="true">
        <span>{{ scenes.length }} slides</span>
        <i />
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14m-6-6l6 6-6 6" /></svg>
      </div>
      <CreativeClose class="foot" :cta="''" :site="c.site" />
    </template>

    <!-- Content slide -->
    <template v-else-if="current.kind === 'slide'">
      <header class="head">
        <p class="kicker">{{ c.kicker }}</p>
        <p class="count"><strong>{{ pad(current.number) }}</strong><span>/ {{ pad(slideCount) }}</span></p>
      </header>
      <div class="body">
        <h2 :style="{ fontSize: `calc(var(--h2) * ${titleScale(current.slide.title)})` }">{{ current.slide.title }}</h2>
        <p class="text">{{ current.slide.body }}</p>
      </div>
      <footer class="rail">
        <div class="dots" aria-hidden="true">
          <i v-for="n in slideCount" :key="n" :class="{ 'is-on': n === current.number }" />
        </div>
        <img class="rail__mark" src="/faneqo-wordmark.svg" alt="Faneqo" />
      </footer>
    </template>

    <!-- Closing -->
    <template v-else>
      <header class="head"><p class="kicker">{{ c.kicker }}</p></header>
      <div class="closing">
        <h1 :style="{ fontSize: `calc(var(--h1) * 0.8 * ${titleScale(c.closing.headline)})` }">{{ c.closing.headline }}</h1>
        <p v-if="c.closing.line" class="sub">{{ c.closing.line }}</p>
      </div>
      <CreativeClose class="foot" :cta="c.closing.cta || c.cta" :site="c.site" />
    </template>
  </article>
</template>

<script setup>
import { computed } from 'vue'
import CreativeClose from '@/features/ads/studio/primitives/CreativeClose.vue'
import { boardVars } from '@/features/ads/studio/board.js'
import { isAdFormat } from '@/features/ads/formats.js'

/**
 * Musician Education. A cover, numbered content slides, optional closing
 * slide: one coherent post. Scene index selects the slide. Copy is curated and
 * accurate; nothing here invents statistics or capabilities.
 */
const props = defineProps({
  format: { type: String, default: 'square' },
  content: { type: Object, required: true },
  snapshot: { type: Object, default: null },
  scene: { type: Number, default: 0 },
})

const LAYOUTS = {
  square: { h1: 112, h2: 72, text: 34, 'foot-bottom': 80 },
  post: { h1: 124, h2: 78, text: 36, 'foot-bottom': 96 },
  feed: { h1: 120, h2: 76, text: 36, 'foot-bottom': 96 },
  story: { h1: 132, h2: 84, text: 40, 'foot-bottom': 344 },
}

const formatId = computed(() => (isAdFormat(props.format) ? props.format : 'square'))
const vars = computed(() => boardVars(formatId.value, LAYOUTS))
const c = computed(() => ({
  kicker: 'Faneqo notes',
  cover: {},
  slides: [],
  closing: null,
  site: 'faneqo.com',
  ...(props.content || {}),
}))
const variant = computed(() => (c.value.variant === 'cards' ? 'cards' : 'editorial'))
const slides = computed(() => (Array.isArray(c.value.slides) ? c.value.slides : []).filter((s) => s && (s.title || s.body)))
const slideCount = computed(() => slides.value.length)
const scenes = computed(() => {
  const list = [{ kind: 'cover' }]
  slides.value.forEach((slide, i) => list.push({ kind: 'slide', slide, number: i + 1 }))
  if (c.value.closing && (c.value.closing.headline || c.value.closing.cta)) list.push({ kind: 'closing' })
  return list
})
const sceneIndex = computed(() => Math.min(scenes.value.length - 1, Math.max(0, Number(props.scene) || 0)))
const current = computed(() => scenes.value[sceneIndex.value] || scenes.value[0])
const coverScale = computed(() => {
  const n = String(c.value.cover?.headline || '').length
  return n <= 18 ? 1 : n <= 28 ? 0.84 : n <= 40 ? 0.7 : 0.58
})
const ariaLabel = computed(() => (current.value.kind === 'slide' ? current.value.slide.title : c.value.cover?.headline || 'Faneqo'))

function titleScale(text) {
  const n = String(text || '').length
  return n <= 22 ? 1 : n <= 34 ? 0.86 : n <= 48 ? 0.74 : 0.62
}
function pad(n) {
  return String(n).padStart(2, '0')
}
</script>

<style scoped>
.board {
  position: relative;
  display: flex;
  flex-direction: column;
  width: var(--board-w, 1080px);
  height: var(--board-h, 1080px);
  padding: var(--safe-top) var(--safe-x) var(--foot-bottom);
  overflow: hidden;
  background: #050506;
  color: #f7f9fc;
  font-family: Poppins, ui-sans-serif, system-ui, sans-serif;
  box-sizing: border-box;
}

.kicker {
  margin: 0;
  color: #7ee7ff;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

.cover,
.closing {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  justify-content: center;
  gap: 26px;
  min-height: 0;
}

h1 {
  margin: 0;
  font-weight: 800;
  letter-spacing: -0.055em;
  line-height: 0.9;
  text-transform: uppercase;
  overflow-wrap: anywhere;
}

.sub {
  max-width: 820px;
  margin: 0;
  color: rgba(247, 249, 252, 0.72);
  font-size: 28px;
  font-weight: 500;
  letter-spacing: -0.02em;
  line-height: 1.3;
}

.swipe {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 40px;
  color: rgba(247, 249, 252, 0.55);
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.swipe i {
  width: 56px;
  height: 1px;
  background: rgba(247, 249, 252, 0.3);
}

.swipe svg {
  width: 20px;
  height: 20px;
}

/* Fixed chrome: the same row height on every scene so the eyebrow never drifts between slides. */
.head {
  display: flex;
  flex: 0 0 auto;
  align-items: flex-start;
  justify-content: space-between;
  height: 40px;
}

.head .kicker {
  padding-top: 10px;
}

.count {
  margin: 0;
  font-weight: 700;
  letter-spacing: 0.04em;
  line-height: 1;
}

.count strong {
  font-size: 34px;
  font-weight: 800;
  letter-spacing: -0.04em;
}

.count span {
  margin-left: 6px;
  color: rgba(247, 249, 252, 0.4);
  font-size: 16px;
}

.body {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  justify-content: center;
  gap: 30px;
  min-height: 0;
}

.v-cards .body {
  /* The card floats in the middle of the frame instead of hugging the header. */
  justify-content: center;
  margin: auto 0;
  min-height: 42%;
  padding: 56px 56px 64px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 32px;
  background: rgba(255, 255, 255, 0.035);
  flex: 0 1 auto;
}

h2 {
  margin: 0;
  font-weight: 800;
  letter-spacing: -0.045em;
  line-height: 0.95;
  text-transform: uppercase;
  overflow-wrap: anywhere;
}

.text {
  max-width: 860px;
  margin: 0;
  color: rgba(247, 249, 252, 0.8);
  font-size: var(--text);
  font-weight: 500;
  letter-spacing: -0.015em;
  line-height: 1.42;
}

.rail {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
}

/* Cards: the card alone takes the free space, so it sits centred between head and rail. */
.v-cards .rail {
  margin-top: 0;
}

.dots {
  display: flex;
  gap: 10px;
}

.dots i {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(247, 249, 252, 0.2);
}

.dots i.is-on {
  width: 32px;
  border-radius: 999px;
  background: #f7f9fc;
}

.rail__mark {
  width: 136px;
  height: auto;
  opacity: 0.9;
}

.foot {
  flex: 0 0 auto;
}
</style>
