<template>
  <p v-if="on" class="fq-lab-metrics" aria-live="off">
    {{ open ? 'open' : 'closed' }}
    · slide {{ slide + 1 }}
    · t {{ t }}
    · z {{ zoomLabel }}
    · dec {{ decodedCount }}
    · {{ thumbnails ? 'thumbs' : 'no-thumbs' }}
    · {{ fullscreen ? 'fs' : 'win' }}
    · {{ fps }} fps
    · {{ renderer }}
  </p>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps({
  on: { type: Boolean, default: false },
  slide: { type: Number, default: 0 },
  progress: { type: Object, default: null },
  renderer: { type: String, default: 'DOM/CSS' },
  zoom: { type: Object, default: null },
  decodedCount: { type: Number, default: 0 },
  open: { type: Boolean, default: false },
  fullscreen: { type: Boolean, default: false },
  thumbnails: { type: Boolean, default: false },
})

const fps = ref(0)
let frames = 0
let last = 0
let raf = 0

const t = computed(() => {
  const value = Number(props.progress?.t)
  if (!Number.isFinite(value)) return '0.00'
  return value.toFixed(2)
})

const zoomLabel = computed(() => {
  const level = Number(props.zoom?.level)
  if (!Number.isFinite(level)) return '1.00'
  return level.toFixed(2)
})

function loop(now) {
  if (!props.on) return
  if (!last) last = now
  frames += 1
  if (now - last >= 1000) {
    fps.value = frames
    frames = 0
    last = now
  }
  raf = requestAnimationFrame(loop)
}

watch(() => props.on, (on) => {
  if (on) {
    frames = 0
    last = 0
    raf = requestAnimationFrame(loop)
  } else if (raf) {
    cancelAnimationFrame(raf)
    raf = 0
  }
})

onMounted(() => {
  if (props.on) raf = requestAnimationFrame(loop)
})
onBeforeUnmount(() => {
  if (raf) cancelAnimationFrame(raf)
})
</script>

<style scoped>
.fq-lab-metrics {
  position: fixed;
  left: max(0.8rem, env(safe-area-inset-left, 0px));
  bottom: max(0.8rem, env(safe-area-inset-bottom, 0px));
  z-index: 100060;
  margin: 0;
  color: rgba(247, 249, 252, 0.38);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.68rem;
  letter-spacing: 0.02em;
  pointer-events: none;
}
</style>
