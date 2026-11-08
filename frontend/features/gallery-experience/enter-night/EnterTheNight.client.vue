<template>
  <Teleport to="body">
    <div
      v-if="open"
      ref="rootRef"
      class="fq-night"
      role="dialog"
      aria-modal="true"
      aria-label="Enter the Night"
      tabindex="-1"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
      @keydown="onKey"
    >
      <MatteStage
        :field="field"
        :tuning="tuning"
        :opacity="1"
        :reduced="reduced"
      />

      <button type="button" class="fq-night__leave" aria-label="Leave the Night" @click="leave">
        <span aria-hidden="true"></span>
      </button>

      <div class="fq-night__scene">
        <header class="fq-night__threshold" :style="thresholdStyle">
          <p class="fq-night__artist">{{ night.artist }}</p>
          <p class="fq-night__place">{{ night.venue }}</p>
          <p class="fq-night__place">{{ night.city }}</p>
          <p class="fq-night__date">{{ night.displayDate }}</p>
        </header>

        <figure
          v-for="(memory, index) in memories"
          v-show="printOpacity(index) > 0.02"
          :key="memory.id"
          class="fq-night__print"
          :class="{ 'is-hero': memory.role === 'hero' && printOpacity(index) > 0.72 }"
          :style="printStyle(index)"
        >
          <img
            :src="memory.src"
            :alt="memory.alt"
            :width="memory.width"
            :height="memory.height"
            draggable="false"
          />
        </figure>

        <p class="fq-night__after" :style="afterStyle">The Night remains.</p>
      </div>

      <p class="fq-night__sr" aria-live="polite">{{ live }}</p>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { onKeyStroke, usePreferredReducedMotion } from '@vueuse/core'
import { lockOverlayScroll, unlockOverlayScroll } from '~/utils/ui/overlayScrollLock'
import { memoryScale, stageAtProgress } from '../core/presentationState'
import MatteStage from '../stage/MatteStage.vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  night: { type: Object, default: () => ({}) },
  memories: { type: Array, default: () => [] },
  tuning: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['close', 'change'])
const reducedMotion = usePreferredReducedMotion()
const reduced = computed(() => reducedMotion.value === 'reduce')
const cursor = ref(0)
const drag = ref(0)
const dragging = ref(false)
const rootRef = ref(null)
let startX = 0
let lastX = 0
let lastT = 0
let velocity = 0
let pointerId = null

const maxCursor = computed(() => props.memories.length + 1)
const movement = computed(() => Math.min(maxCursor.value, Math.max(0, cursor.value + drag.value)))

const progress = computed(() => {
  const value = movement.value
  const count = props.memories.length
  if (count < 1) return { index: 0, from: 0, to: 0, t: 0, indexFloat: 0 }
  if (value <= 1) {
    return { index: 0, from: 0, to: 0, t: 0, indexFloat: 0 }
  }
  if (value >= count) {
    const last = count - 1
    return { index: last, from: last, to: last, t: 0, indexFloat: last }
  }
  const pos = value - 1
  const from = Math.min(count - 1, Math.max(0, Math.floor(pos)))
  const to = Math.min(count - 1, from + 1)
  const t = pos - from
  return {
    index: t > 0.5 ? to : from,
    from,
    to,
    t,
    indexFloat: pos,
  }
})

const field = computed(() => stageAtProgress(props.memories, progress.value, {
  reduced: reduced.value,
  softness: props.tuning?.transitionSoftness,
}))

const thresholdStyle = computed(() => {
  const fade = Math.max(0, 1 - movement.value / 0.92)
  return {
    opacity: String(fade),
    visibility: fade < 0.02 ? 'hidden' : 'visible',
  }
})

const afterStyle = computed(() => {
  const start = props.memories.length + 0.35
  const fade = Math.min(1, Math.max(0, (movement.value - start) / 0.65))
  return {
    opacity: String(fade),
    visibility: fade < 0.02 ? 'hidden' : 'visible',
  }
})

const live = computed(() => {
  if (movement.value < 0.5) return `${props.night.artist || 'Night'}. ${props.night.venue || ''}`
  if (movement.value >= props.memories.length + 0.5) return 'The Night remains.'
  const memory = props.memories[progress.value.index]
  return memory?.alt || `Photograph ${progress.value.index + 1}`
})

function printOpacity(index) {
  const value = movement.value
  const slot = index + 1
  if (index === 0 && value < 1) {
    return 0.06 * Math.max(0, 1 - value * 0.4)
  }
  const pos = value - slot
  if (pos <= -1 || pos >= 1) return 0
  if (pos <= 0) {
    const incoming = pos + 1
    if (incoming < 0.58) return 0.03 * (incoming / 0.58)
    return 0.03 + ((incoming - 0.58) / 0.42) * 0.97
  }
  if (pos < 0.58) return 1
  return Math.max(0, 1 - (pos - 0.58) / 0.42)
}

function printStyle(index) {
  const memory = props.memories[index]
  const opacity = printOpacity(index)
  const surround = Number(props.tuning?.imageSurround)
  const pad = Number.isFinite(surround) ? surround : 28
  const scale = memoryScale(memory?.gravity, memory?.energy)
  const value = movement.value
  const arriving = index === 0 && value < 0.9
  const nextScale = arriving ? 0.62 : scale
  return {
    opacity: String(opacity),
    transform: `scale(${nextScale})`,
    padding: `${Math.round(pad * 0.45)}px`,
  }
}

function emitIfMemory() {
  const value = Math.round(cursor.value)
  if (value >= 1 && value <= props.memories.length) {
    emit('change', value - 1)
  }
}

function settle(next = Math.round(movement.value)) {
  cursor.value = Math.min(maxCursor.value, Math.max(0, next))
  drag.value = 0
  emitIfMemory()
}

function step(dir) {
  settle(Math.round(cursor.value) + dir)
}

function onPointerDown(event) {
  if (event.button != null && event.button !== 0) return
  if (event.target?.closest?.('.fq-night__leave')) return
  dragging.value = true
  startX = event.clientX
  lastX = event.clientX
  lastT = performance.now()
  velocity = 0
  pointerId = event.pointerId
  event.currentTarget.setPointerCapture?.(event.pointerId)
}

function onPointerMove(event) {
  if (!dragging.value || event.pointerId !== pointerId) return
  if (reduced.value) return
  const now = performance.now()
  const dx = event.clientX - lastX
  const dt = Math.max(8, now - lastT)
  velocity = dx / dt
  lastX = event.clientX
  lastT = now
  drag.value = -(event.clientX - startX) / Math.max(240, window.innerWidth * 0.78)
}

function onPointerUp(event) {
  if (!dragging.value) return
  if (event.pointerId != null && event.pointerId !== pointerId) return
  dragging.value = false
  pointerId = null
  const dx = event.clientX - startX
  if (reduced.value) {
    if (Math.abs(dx) < 10) step(1)
    else settle()
    return
  }
  if (Math.abs(dx) < 10) {
    settle()
    return
  }
  const flick = velocity * -1
  if (flick > 0.35) step(1)
  else if (flick < -0.35) step(-1)
  else if (dx < -36) step(1)
  else if (dx > 36) step(-1)
  else settle()
}

function leave() {
  emit('close')
}

function onKey(event) {
  if (event.key === 'Escape') leave()
  if (event.key === 'ArrowRight') step(1)
  if (event.key === 'ArrowLeft') step(-1)
}

onKeyStroke('Escape', () => {
  if (props.open) leave()
})

watch(() => props.open, async (open) => {
  if (open) {
    cursor.value = 0
    drag.value = 0
    lockOverlayScroll('enter-night')
    await nextTick()
    rootRef.value?.focus?.()
  } else {
    unlockOverlayScroll('enter-night')
  }
})

onBeforeUnmount(() => unlockOverlayScroll('enter-night'))
</script>

<style scoped>
.fq-night {
  position: fixed;
  inset: 0;
  z-index: 100000;
  background: #000;
  color: #f7f9fc;
  font-family: Poppins, ui-sans-serif, system-ui, sans-serif;
  touch-action: none;
  user-select: none;
  overflow: hidden;
}
.fq-night__scene {
  position: relative;
  z-index: 1;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding:
    calc(3.2rem + env(safe-area-inset-top, 0px))
    1.05rem
    calc(2.4rem + env(safe-area-inset-bottom, 0px));
}
.fq-night__threshold {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding:
    0 1.35rem
    calc(16vh + env(safe-area-inset-bottom, 0px));
  z-index: 2;
  pointer-events: none;
}
.fq-night__artist {
  margin: 0;
  font-size: clamp(2.2rem, 11vw, 3.4rem);
  font-weight: 800;
  letter-spacing: -0.055em;
  line-height: 0.92;
}
.fq-night__place,
.fq-night__date {
  margin: 0.55rem 0 0;
  font-size: 0.7rem;
  font-weight: 500;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(247, 249, 252, 0.42);
}
.fq-night__date {
  margin-top: 0.32rem;
  color: rgba(247, 249, 252, 0.28);
}
.fq-night__print {
  position: absolute;
  max-width: min(86vw, 32rem);
  max-height: 78vh;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.fq-night__print img {
  display: block;
  max-width: 100%;
  max-height: 72vh;
  width: auto;
  height: auto;
  object-fit: contain;
}
.fq-night__print.is-hero {
  max-width: min(94vw, 36rem);
}
.fq-night__after {
  margin: 0;
  position: relative;
  z-index: 2;
  font-size: 0.88rem;
  letter-spacing: 0.06em;
  color: rgba(247, 249, 252, 0.38);
  pointer-events: none;
}
.fq-night__leave {
  position: absolute;
  top: max(0.25rem, env(safe-area-inset-top, 0px));
  left: max(0.15rem, env(safe-area-inset-left, 0px));
  z-index: 3;
  width: 48px;
  height: 48px;
  border: 0;
  background: transparent;
  color: rgba(247, 249, 252, 0.42);
}
.fq-night__leave span,
.fq-night__leave span::after {
  display: block;
  width: 13px;
  height: 1px;
  margin: 0 auto;
  background: currentColor;
  transform: rotate(45deg);
}
.fq-night__leave span::after {
  content: '';
  transform: rotate(-90deg);
}
.fq-night__sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
}
</style>
