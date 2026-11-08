<template>
  <article
    class="board"
    :class="[`v-${variant}`, `align-${align}`, `weight-${weight}`, { 'has-photo': Boolean(photo) }]"
    :data-format="formatId"
    :style="vars"
    :aria-label="lines.map((l) => l.text).join(' ')"
  >
    <PhotoField v-if="photo" class="field" :media="photo" :focal="c.focal || photo.focal" fade="none" />
    <div v-if="photo" class="veil" :style="{ opacity: veil }" aria-hidden="true" />

    <p v-if="c.kicker" class="kicker">{{ c.kicker }}</p>

    <div class="statement">
      <h1 :style="{ fontSize: `calc(var(--h1) * ${scaleFactor})` }">
        <span v-for="(line, i) in lines" :key="i" class="line" :class="`tone-${line.tone}`">{{ line.text }}</span>
      </h1>
      <span v-if="variant === 'manifesto'" class="rule" aria-hidden="true" />
      <p v-if="c.support" class="support">{{ c.support }}</p>
    </div>

    <CreativeClose class="foot" :cta="c.cta" :site="c.site" :align="align === 'center' ? 'center' : 'row'" />
  </article>
</template>

<script setup>
import { computed } from 'vue'
import CreativeClose from '@/features/ads/studio/primitives/CreativeClose.vue'
import PhotoField from '@/features/ads/studio/primitives/PhotoField.vue'
import { boardVars } from '@/features/ads/studio/board.js'
import { isAdFormat } from '@/features/ads/formats.js'

/**
 * Typography / Brand Statement. Oversized Poppins, two-tone emphasis, one
 * accent gradient at most, optional photograph behind a veil.
 * Variants: statement (left, vertically centred), poster (centred, stacked),
 * manifesto (left, hairline + supporting paragraph).
 */
const props = defineProps({
  format: { type: String, default: 'post' },
  content: { type: Object, required: true },
  snapshot: { type: Object, default: null },
  scene: { type: Number, default: 0 },
})

const LAYOUTS = {
  post: { h1: 150, 'kicker-top': 96, 'foot-bottom': 96 },
  feed: { h1: 144, 'kicker-top': 96, 'foot-bottom': 96 },
  story: { h1: 164, 'kicker-top': 290, 'foot-bottom': 344 },
  square: { h1: 124, 'kicker-top': 80, 'foot-bottom': 80 },
}

const SCALES = { xl: 1, l: 0.84, m: 0.68, s: 0.54 }

const formatId = computed(() => (isAdFormat(props.format) ? props.format : 'post'))
const vars = computed(() => boardVars(formatId.value, LAYOUTS))
const c = computed(() => props.content || {})
const variant = computed(() => (['statement', 'poster', 'manifesto'].includes(c.value.variant) ? c.value.variant : 'statement'))
const align = computed(() => (variant.value === 'poster' ? 'center' : 'left'))
const weight = computed(() => (c.value.weight === 'medium' ? 'medium' : 'heavy'))
const photo = computed(() => c.value.photo || null)
const veil = computed(() => {
  const n = Number(c.value.veil)
  return Number.isFinite(n) ? Math.min(0.95, Math.max(0.2, n)) : 0.72
})
const lines = computed(() => (Array.isArray(c.value.lines) ? c.value.lines : [])
  .map((line) => (typeof line === 'string' ? { text: line, tone: 'plain' } : line))
  .filter((line) => line && String(line.text || '').trim())
  .map((line) => ({ text: String(line.text).trim(), tone: ['plain', 'accent', 'muted'].includes(line.tone) ? line.tone : 'plain' }))
  .slice(0, 5))
const scaleFactor = computed(() => {
  const preset = SCALES[c.value.scale] ?? SCALES.l
  const longest = Math.max(1, ...lines.value.map((line) => line.text.length))
  // Auto-fit: the 920px text column holds about 9.6 uppercase Poppins 800
  // characters at 150px (≈0.62em each after tracking). Shrink from there so a
  // long line never leaves the safe area; the preset is only a ceiling.
  const fit = Math.min(1, 9.6 / longest)
  return Math.max(0.3, Math.min(preset, fit))
})
</script>

<style scoped>
.board {
  position: relative;
  display: flex;
  flex-direction: column;
  width: var(--board-w, 1080px);
  height: var(--board-h, 1440px);
  padding: var(--safe-top) var(--safe-x) var(--foot-bottom);
  overflow: hidden;
  background: #050506;
  color: #f7f9fc;
  font-family: Poppins, ui-sans-serif, system-ui, sans-serif;
  box-sizing: border-box;
}

.field,
.veil {
  position: absolute;
  inset: 0;
}

.veil {
  background: linear-gradient(to bottom, rgba(5, 5, 6, 0.75) 0%, rgba(5, 5, 6, 0.55) 45%, rgba(5, 5, 6, 0.92) 100%);
}

.kicker {
  position: absolute;
  top: var(--kicker-top);
  left: var(--safe-x);
  z-index: 2;
  margin: 0;
  color: #7ee7ff;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

.align-center .kicker {
  right: var(--safe-x);
  text-align: center;
}

.statement {
  position: relative;
  z-index: 2;
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  justify-content: center;
  gap: 28px;
  min-height: 0;
}

.v-manifesto .statement {
  justify-content: flex-start;
  padding-top: calc(var(--kicker-top) + 80px);
}

.align-center .statement {
  align-items: center;
  text-align: center;
}

h1 {
  margin: 0;
  font-weight: 800;
  letter-spacing: -0.06em;
  line-height: 0.86;
  text-transform: uppercase;
  overflow-wrap: anywhere;
}

.weight-medium h1 {
  font-weight: 500;
  letter-spacing: -0.045em;
  line-height: 0.92;
}

.line { display: block; }

.tone-accent {
  background: linear-gradient(90deg, #ff4ad8 0%, #c084fc 46%, #67e8f9 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.tone-muted {
  color: rgba(247, 249, 252, 0.34);
}

.has-photo .tone-muted {
  color: rgba(247, 249, 252, 0.55);
}

.rule {
  width: 120px;
  height: 2px;
  background: #f7f9fc;
}

.support {
  max-width: 820px;
  margin: 0;
  color: rgba(247, 249, 252, 0.72);
  font-size: 28px;
  font-weight: 500;
  letter-spacing: -0.02em;
  line-height: 1.3;
}

.v-manifesto .support {
  max-width: 760px;
  font-size: 30px;
  line-height: 1.35;
}

.foot {
  position: relative;
  z-index: 2;
  flex: 0 0 auto;
}
</style>
