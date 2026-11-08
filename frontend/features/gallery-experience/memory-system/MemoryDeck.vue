<template>
  <div
    class="fq-md"
    :class="{ 'is-single': !stacked, 'is-dragging': dragging }"
    role="group"
    :aria-label="label"
  >
    <div ref="stageEl" class="fq-md__stage">
      <article
        v-for="layer in layers"
        :key="`${layer.memory?.id || layer.index}-${layer.layer}`"
        class="fq-md__card"
        :class="{ 'is-front': layer.front }"
        :style="cardStyle(layer)"
        :data-gx-deck-index="layer.index"
        :data-gx-deck-front="layer.front ? layer.memory?.id : undefined"
        :role="layer.front ? 'button' : undefined"
        :tabindex="layer.front ? 0 : -1"
        :aria-label="layer.front ? (layer.memory?.alt || 'Open photograph') : undefined"
        :aria-hidden="layer.front ? undefined : 'true'"
        @pointerdown="layer.front ? onDown($event) : undefined"
        @pointermove="layer.front ? onMove($event) : undefined"
        @pointerup="layer.front ? onUp($event) : undefined"
        @pointercancel="layer.front ? onUp($event) : undefined"
        @click="layer.front ? onActivate($event) : undefined"
        @keydown.enter.prevent="layer.front ? onActivate($event) : undefined"
        @keydown.space.prevent="layer.front ? onActivate($event) : undefined"
      >
        <img
          :src="layer.memory?.src"
          :alt="layer.front ? (layer.memory?.alt || 'Photograph') : ''"
          :width="layer.memory?.width"
          :height="layer.memory?.height"
          data-fit="contain"
          draggable="false"
        >
      </article>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import {
  clampDeckIndex,
  commitDeckDrag,
  deckHasStack,
  deckLayers,
  deckLayerStyle,
  fitPhotoInStage,
  resistDeckDrag,
} from './memoryDeck.js'

const props = defineProps({
  memories: { type: Array, default: () => [] },
  index: { type: Number, default: 0 },
  reduced: { type: Boolean, default: false },
})

const emit = defineEmits(['update:index', 'open'])

const stageEl = ref(null)
const stageSize = ref({ w: 340, h: 380 })
const dragX = ref(0)
const dragging = ref(false)
let observer = null
let pointerId = null
let originX = 0
let lastX = 0
let lastT = 0
let velocity = 0
let moved = false

const stacked = computed(() => deckHasStack(props.memories.length))
const layers = computed(() => deckLayers(props.memories, props.index))
const frontMemory = computed(() => {
  const list = props.memories
  return list[clampDeckIndex(props.index, list.length)] || null
})
const frontFit = computed(() => fitPhotoInStage(
  frontMemory.value?.width,
  frontMemory.value?.height,
  stageSize.value.w,
  stageSize.value.h,
))
const label = computed(() => {
  const n = props.memories.length
  const i = Math.min(n, (Number(props.index) || 0) + 1)
  return n ? `Gallery, photograph ${i} of ${n}` : 'Gallery photographs'
})

function cardStyle(layer) {
  return deckLayerStyle(layer, {
    dragX: dragX.value,
    reduced: props.reduced,
    fit: frontFit.value,
  })
}

function measure() {
  const rect = stageEl.value?.getBoundingClientRect()
  if (!rect || rect.width < 8 || rect.height < 8) return
  const w = Math.round(rect.width)
  const h = Math.round(rect.height)
  if (w === stageSize.value.w && h === stageSize.value.h) return
  stageSize.value = { w, h }
}

function onDown(event) {
  if (event.pointerType === 'mouse' && event.button !== 0) return
  pointerId = event.pointerId
  originX = event.clientX
  lastX = event.clientX
  lastT = performance.now()
  velocity = 0
  moved = false
  dragging.value = true
  event.currentTarget.setPointerCapture?.(event.pointerId)
}

function onMove(event) {
  if (!dragging.value || event.pointerId !== pointerId) return
  const now = performance.now()
  const dx = event.clientX - originX
  const dt = Math.max(1, now - lastT)
  velocity = (event.clientX - lastX) / dt
  lastX = event.clientX
  lastT = now
  if (Math.abs(dx) > 7) moved = true
  dragX.value = resistDeckDrag(dx, props.index, props.memories.length)
}

function onUp(event) {
  if (event.pointerId !== pointerId && pointerId != null) return
  const next = commitDeckDrag({
    dx: dragX.value,
    vx: velocity,
    index: props.index,
    count: props.memories.length,
  })
  dragX.value = 0
  dragging.value = false
  pointerId = null
  if (next !== props.index) emit('update:index', next)
}

function onActivate(event) {
  if (moved) {
    event.preventDefault()
    event.stopPropagation()
    moved = false
    return
  }
  const memory = props.memories[props.index]
  emit('open', {
    index: props.index,
    mediaId: memory?.id,
    thumbnailElement: event.currentTarget?.querySelector?.('img') || event.currentTarget,
  })
}

onMounted(() => {
  measure()
  if (typeof ResizeObserver === 'undefined' || !stageEl.value) return
  observer = new ResizeObserver(measure)
  observer.observe(stageEl.value)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
})
</script>
