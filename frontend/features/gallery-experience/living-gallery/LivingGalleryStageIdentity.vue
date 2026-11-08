<template>
  <div
    v-if="visible"
    class="fq-lg-stage-identity"
    :class="[
      `fq-lg-stage-identity--${region}`,
      `fq-lg-stage-identity--${density}`,
      `fq-lg-stage-identity--on-${device}`,
      settled ? 'is-settled' : '',
    ]"
    :style="style"
    aria-hidden="true"
  >
    <p v-if="column.collection" class="fq-lg-stage-col__eyebrow">{{ column.collection }}</p>
    <p v-if="lines.artist" class="fq-lg-type--editorial fq-lg-stage-col__artist">{{ lines.artist }}</p>
    <p v-if="lines.secondary" class="fq-lg-type--editorial fq-lg-stage-col__venue">{{ lines.secondary }}</p>
    <p v-if="lines.place" class="fq-lg-type--editorial fq-lg-stage-col__place">{{ lines.place }}</p>
    <p v-if="column.caption" class="fq-lg-type--editorial fq-lg-stage-col__caption">{{ column.caption }}</p>
    <div class="fq-lg-stage-col__foot">
      <p v-if="column.credit" class="fq-lg-type--editorial fq-lg-stage-col__credit">{{ column.credit }}</p>
      <p v-if="indexLine" class="fq-lg-stage-col__index">{{ indexLine }}</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { formatLivingGalleryIndex, livingGalleryIdentityLines } from './livingGalleryChrome'
import { livingGalleryEditorialLines, normalizeLivingGalleryContext } from './livingGalleryContext'
import { CONTEXT_COLUMN } from './livingGalleryEditorialStage'

const props = defineProps({
  night: { type: Object, default: () => ({}) },
  memory: { type: Object, default: null },
  region: { type: String, default: 'none' },
  density: { type: String, default: 'quiet' },
  device: { type: String, default: 'desktop' },
  styleVars: { type: Object, default: () => ({}) },
  settled: { type: Boolean, default: false },
  dense: { type: Boolean, default: false },
  index: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
})

const lines = computed(() => livingGalleryIdentityLines(props.night, {
  compact: props.density === 'quiet',
}))

/**
 * The editorial column is the only place with room for the caption and credit.
 * It reuses the Info projection rather than inventing a second one, so the two
 * surfaces can never disagree about what this photograph is.
 */
const column = computed(() => {
  if (props.region !== CONTEXT_COLUMN) return {}
  const editorial = livingGalleryEditorialLines(props.night, props.memory)
  const ctx = normalizeLivingGalleryContext(props.night, { memory: props.memory })
  const pick = (kind) => editorial.find((line) => line.kind === kind)?.text || ''
  return {
    // Only a real collection title earns the eyebrow. Falling back to the venue
    // repeats the line directly beneath the artist name.
    collection: ctx.galleryTitle || '',
    caption: pick('caption') || pick('title'),
    credit: pick('credit'),
  }
})

const indexLine = computed(() => (
  props.total > 1 ? formatLivingGalleryIndex(props.index, props.total) : ''
))

const visible = computed(() => (
  props.region === CONTEXT_COLUMN
  && Boolean(lines.value.artist || lines.value.secondary || lines.value.place)
))

const style = computed(() => props.styleVars || {})
</script>
