<template>
  <div
    ref="rootRef"
    class="fq-gstack"
    :class="rootClass"
    :role="interactive && !disabled ? 'button' : undefined"
    :tabindex="interactive && !disabled ? 0 : undefined"
    :aria-label="interactive ? activateLabel : undefined"
    :aria-disabled="disabled ? 'true' : undefined"
    :aria-busy="loading ? 'true' : undefined"
    :aria-keyshortcuts="canBrowse ? 'ArrowLeft ArrowRight Enter' : undefined"
    :style="rootStyle"
    @click="onActivate"
    @keydown="onKeydown"
    @pointerenter="onPointerEnter"
    @pointermove="onPointerMove"
    @pointerleave="onPointerLeave"
    @pointerdown="onPointerDown"
    @pointerup="onPointerUp"
    @pointercancel="onPointerUp"
    @blur="onBlur"
  >
    <span class="fq-gstack__stage" aria-hidden="true">
      <span
        v-for="layer in layers"
        :key="layerKey(layer.item)"
        class="fq-gstack__print"
        :class="`is-${layer.role}`"
        :style="layer.role === 'front' ? frontDragStyle : undefined"
      >
        <img
          v-if="layerSrc(layer.item, layer.role)"
          :src="layerSrc(layer.item, layer.role)"
          :data-fq-print="layerKey(layer.item)"
          alt=""
          :width="layer.item.width || undefined"
          :height="layer.item.height || undefined"
          :style="frontImgStyle(layer)"
          :loading="layer.role === 'front' || layer.role === 'back-a' || priority ? 'eager' : 'lazy'"
          :fetchpriority="priority && layer.role === 'front' ? 'high' : undefined"
          decoding="async"
          draggable="false"
          @error="onBroken(layer.item, $event)"
          @load="onLoaded(layer.item, $event)"
        />
        <!-- Missing photography becomes typography rather than a black hole. -->
        <span v-if="layer.role === 'front' && layerVoid(layer.item)" class="fq-gstack__void">
          <span class="fq-gstack__void-name">{{ voidLabel }}</span>
          <span class="fq-gstack__void-note">Photo unavailable</span>
        </span>
      </span>
      <span v-if="!layers.length && !loading" class="fq-gstack__print is-empty is-front">
        <span class="fq-gstack__empty">No photos</span>
      </span>
      <span v-if="loading" class="fq-gstack__print is-empty is-front is-loading" />
      <span v-if="positionLabel" class="fq-gstack__mark">{{ positionLabel }}</span>
    </span>
    <span v-if="livePosition" class="fq-gstack__sr" aria-live="polite">{{ livePosition }}</span>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { usePreferredReducedMotion } from '@vueuse/core'
import { faneqoMediaKey, resolveFaneqoMediaSrc } from '~/utils/media/faneqoMedia'
import {
  clampStackIndex,
  stackActivateLabel,
  stackActivatePayload,
  stackBrowsableMedia,
  stackDeckPlan,
  stackElasticDrag,
  stackGestureAxis,
  stackIsTap,
  stackLayerFit,
  stackLayerKind,
  stackLayerSource,
  stackObjectPosition,
  stackPhotoCount,
  stackPositionLabel,
  stackPrintRatio,
  stackShouldCommit,
  stackStepIndex,
  stackVisibleLayers,
  stackVisibleMedia,
} from '~/utils/media/faneqoGalleryStack'
import { consumeStackHint } from '~/utils/galleries/stackBrowseMemory'
import { stackDestinationSrc, stackPrintTransitionName } from '~/utils/galleries/stackOpenNavigation'

const props = defineProps({
  media: { type: Array, default: () => [] },
  title: { type: String, default: '' },
  count: { type: Number, default: null },
  size: { type: String, default: 'archive' },
  /**
   * Opt-in framing seam. Every default reproduces the historic behavior, so
   * surfaces that do not pass these are visually unchanged.
   *
   * frameRatio — share one frame across a row instead of deriving per print.
   * fit        — 'cover' (historic) | 'contain' | 'auto' (honor the computed fit).
   * plate      — archive plate treatment: one hairline on the front print only.
   */
  frameRatio: { type: Number, default: 0 },
  fit: { type: String, default: 'cover' },
  plate: { type: Boolean, default: false },
  interactive: { type: Boolean, default: true },
  browsable: { type: Boolean, default: true },
  activeIndex: { type: Number, default: 0 },
  disabled: { type: Boolean, default: false },
  selected: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  priority: { type: Boolean, default: false },
  transitionKey: { type: [String, Number], default: '' },
})

const emit = defineEmits(['activate', 'index-change', 'update:activeIndex'])
const config = useRuntimeConfig()
const mediaOrigin = computed(() => String(config.public?.strapiUrl || '').replace(/\/+$/, ''))
const reducedMotion = usePreferredReducedMotion()
const reduced = computed(() => reducedMotion.value === 'reduce')
const rootRef = ref(null)
const hovering = ref(false)
const pressing = ref(false)
const browsing = ref(false)
const dragging = ref(false)
const settling = ref(false)
const opening = ref(false)
const hinting = ref(false)
const livePosition = ref('')
const broken = reactive({})
const tiltX = ref(0)
const tiltY = ref(0)
const dragX = ref(0)
const reveal = ref(0)
const deck = computed(() => stackBrowsableMedia(props.media))
const photoCount = computed(() => stackPhotoCount(props.media, props.count) || deck.value.length)
const index = ref(clampStackIndex(props.activeIndex, deck.value.length))
const canBrowse = computed(() => props.browsable && !props.disabled && deck.value.length > 1)
const plan = computed(() => stackDeckPlan(props.media, index.value, dragDir.value))
const layers = computed(() => {
  if (!canBrowse.value) {
    return stackVisibleMedia(props.media).map((item, i) => ({
      item,
      role: i === 0 ? 'front' : (i === 1 ? 'back-a' : 'back-b'),
    }))
  }
  return stackVisibleLayers(props.media, index.value, dragDir.value)
})
const kind = computed(() => stackLayerKind(canBrowse.value ? plan.value.total : layers.value.length))
const activateLabel = computed(() => {
  const base = stackActivateLabel(props.title, photoCount.value)
  if (!canBrowse.value || plan.value.total <= 1) return base
  return `${base}, photo ${index.value + 1} of ${plan.value.total}`
})
const positionLabel = computed(() => (
  browsing.value && canBrowse.value ? stackPositionLabel(index.value, plan.value.total) : ''
))
const sizeName = computed(() => {
  if (props.size === 'compact' || props.size === 'attachment') return props.size
  return 'archive'
})
const dragDir = computed(() => {
  if (!dragging.value) return 0
  if (dragX.value < -4) return 1
  if (dragX.value > 4) return -1
  return 0
})

const rootClass = computed(() => ([
  `is-${kind.value}`,
  `is-${sizeName.value}`,
  {
    'is-plate': props.plate,
    'is-interactive': props.interactive && !props.disabled,
    'is-browsable': canBrowse.value,
    'is-disabled': props.disabled,
    'is-selected': props.selected,
    'is-loading': props.loading,
    'is-hover': hovering.value && !reduced.value && !dragging.value,
    'is-press': pressing.value && !dragging.value,
    'is-dragging': dragging.value,
    'is-settling': settling.value,
    'is-browsing': browsing.value,
    'is-opening': opening.value,
    'is-hint': hinting.value && !opening.value && !dragging.value,
    'is-reduced': reduced.value,
  },
]))

/* A shared row frame wins over the per-print ratio when one is supplied. */
const frameRatio = computed(() => (
  props.frameRatio > 0
    ? props.frameRatio
    : stackPrintRatio(deck.value[0] || layers.value[0]?.item)
))

const rootStyle = computed(() => ({
  '--fq-print-ratio': String(frameRatio.value),
  '--fq-tilt-x': `${tiltX.value}deg`,
  '--fq-tilt-y': `${tiltY.value}deg`,
  '--fq-reveal': String(reveal.value),
}))

const voidLabel = computed(() => String(props.title || '').trim() || 'Untitled')

const frontDragStyle = computed(() => {
  if (opening.value) return { transform: 'none' }
  if (!dragging.value && !settling.value) return undefined
  const rot = reduced.value ? 0 : dragX.value * 0.028
  return {
    transform: `translate3d(${dragX.value}px, 0, 18px) rotate(${rot}deg)`,
    transition: settling.value && !reduced.value
      ? 'transform 180ms cubic-bezier(0.22, 1, 0.36, 1)'
      : 'none',
  }
})

function frontImgStyle(layer) {
  const style = {}
  if (layer.role === 'front') style.objectPosition = stackObjectPosition(layer.item)
  const mode = layerFit(layer.item, layer.role)
  if (mode !== 'cover') {
    style.objectFit = mode
    /* Letterboxed prints centre on the matte rather than keeping a crop bias. */
    style.objectPosition = 'center center'
  }
  if (opening.value && layer.role === 'front' && printName.value) {
    style.viewTransitionName = printName.value
  }
  return Object.keys(style).length ? style : undefined
}

function layerFit(item, role) {
  if (props.fit === 'cover') return 'cover'
  return stackLayerFit(item, {
    policy: props.fit,
    frameRatio: frameRatio.value,
    sourceFit: layerPick(item, role)?.fit || '',
  })
}

const printName = computed(() => stackPrintTransitionName(props.transitionKey, plan.value.front))

let pointerId = null
let startX = 0
let startY = 0
let edgeGuard = false
let lastX = 0
let lastT = 0
let velocity = 0
let axis = null
let tapOk = false
let width = 320
let markTimer = 0
const preloaded = new Set()

watch(
  () => props.activeIndex,
  (value) => {
    const next = clampStackIndex(value, deck.value.length)
    if (next !== index.value) index.value = next
  },
)

watch(
  () => deck.value.length,
  () => {
    const next = clampStackIndex(index.value, deck.value.length)
    if (next !== index.value) setIndex(next, 'clamp')
  },
)

watch(
  () => [index.value, deck.value.length],
  () => preloadNeighbors(),
)

function setIndex(next, reason) {
  const clamped = clampStackIndex(next, deck.value.length)
  if (clamped === index.value && reason !== 'prop') return
  index.value = clamped
  emit('update:activeIndex', clamped)
  const payload = stackActivatePayload(props.media, clamped)
  emit('index-change', { ...payload, reason })
  if (reason === 'keyboard') {
    livePosition.value = stackPositionLabel(clamped, plan.value.total)
  }
  showMark()
}

function showMark() {
  if (!canBrowse.value) return
  browsing.value = true
  if (typeof window === 'undefined') return
  window.clearTimeout(markTimer)
  markTimer = window.setTimeout(() => {
    if (!dragging.value) browsing.value = false
  }, 1200)
}

function layerKey(item) {
  return faneqoMediaKey(item)
}

function layerPick(item, role) {
  return stackLayerSource(item, {
    layer: role === 'front' || role === 'back-a' ? 'front' : 'back',
    size: sizeName.value,
    dpr: 2,
  })
}

function layerSrc(item, role) {
  const pick = layerPick(item, role)
  return resolveFaneqoMediaSrc(pick?.url || item?.thumbnailUrl || item?.url, mediaOrigin.value)
}

/** A print with no resolvable source, or one the browser refused, reads as type. */
function layerVoid(item) {
  if (!item) return false
  if (broken[faneqoMediaKey(item)]) return true
  return !layerSrc(item, 'front')
}

function preloadNeighbors() {
  if (!canBrowse.value || typeof Image === 'undefined') return
  ;[index.value - 1, index.value + 1].forEach((i) => {
    const item = deck.value[i]
    if (!item) return
    const src = layerSrc(item, 'front')
    if (!src || preloaded.has(src)) return
    preloaded.add(src)
    const img = new Image()
    img.decoding = 'async'
    img.src = src
  })
}

function preloadDestination(item) {
  if (typeof Image === 'undefined') return
  const src = stackDestinationSrc(item, mediaOrigin.value)
  if (!src || preloaded.has(`dest:${src}`)) return
  preloaded.add(`dest:${src}`)
  const img = new Image()
  img.decoding = 'async'
  img.src = src
}

function finePointer(evt) {
  return evt?.pointerType === 'mouse' || evt?.pointerType === 'pen'
}

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n))
}

function updateTilt(evt) {
  if (reduced.value || !hovering.value || dragging.value) return
  const el = rootRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  if (!rect.width || !rect.height) return
  const nx = ((evt.clientX - rect.left) / rect.width) * 2 - 1
  const ny = ((evt.clientY - rect.top) / rect.height) * 2 - 1
  tiltY.value = clamp(nx * 1.5, -1.6, 1.6)
  tiltX.value = clamp(-ny * 1.35, -1.5, 1.5)
}

function onPointerEnter(evt) {
  if (props.disabled || reduced.value || !finePointer(evt)) return
  hovering.value = true
  updateTilt(evt)
}

function onPointerDown(evt) {
  if (props.disabled || settling.value) return
  tapOk = true
  axis = null
  pointerId = evt.pointerId
  startX = evt.clientX
  startY = evt.clientY
  lastX = evt.clientX
  lastT = evt.timeStamp || Date.now()
  velocity = 0
  dragX.value = 0
  reveal.value = 0
  const stage = rootRef.value?.querySelector?.('.fq-gstack__stage')
  width = stage?.getBoundingClientRect?.().width || 320
  if (evt.pointerType === 'touch' || evt.pointerType === 'pen') pressing.value = true
  const viewW = typeof window !== 'undefined' ? window.innerWidth : 390
  edgeGuard = evt.clientX <= 18 || evt.clientX >= viewW - 18
  preloadDestination(plan.value.front)
}

function onPointerMove(evt) {
  if (pointerId != null && evt.pointerId !== pointerId) return
  if (hovering.value && !dragging.value && finePointer(evt)) updateTilt(evt)
  if (pointerId == null) return
  const dx = evt.clientX - startX
  const dy = evt.clientY - startY
  if (!axis) {
    axis = stackGestureAxis(dx, dy)
    if (axis === 'x' && canBrowse.value && !edgeGuard) {
      dragging.value = true
      browsing.value = true
      tapOk = false
      tiltX.value = 0
      tiltY.value = 0
      hovering.value = false
      try { rootRef.value?.setPointerCapture?.(evt.pointerId) } catch {}
    } else if (axis === 'y') {
      tapOk = false
      releasePointer(evt)
      pointerId = null
      pressing.value = false
      return
    }
  }
  if (axis !== 'x' || !canBrowse.value) return
  evt.preventDefault?.()
  const now = evt.timeStamp || Date.now()
  const dt = Math.max(1, now - lastT)
  velocity = (evt.clientX - lastX) / dt
  lastX = evt.clientX
  lastT = now
  const raw = stackElasticDrag(dx, {
    canPrev: plan.value.canPrev,
    canNext: plan.value.canNext,
  })
  dragX.value = raw
  reveal.value = Math.min(1, Math.abs(raw) / Math.max(56, width * 0.22))
}

function releasePointer(evt) {
  const el = rootRef.value
  const id = evt?.pointerId ?? pointerId
  if (el && id != null && el.hasPointerCapture?.(id)) {
    try { el.releasePointerCapture(id) } catch {}
  }
}

function finishPointer(evt) {
  if (pointerId == null) return
  if (evt && pointerId !== evt.pointerId) return
  const dx = dragX.value
  const wasDrag = dragging.value
  pressing.value = false
  releasePointer(evt)
  pointerId = null
  if (axis === 'x' && canBrowse.value && wasDrag) {
    tapOk = false
    const delta = stackShouldCommit(dx, {
      canPrev: plan.value.canPrev,
      canNext: plan.value.canNext,
      width,
      velocity,
      reduced: reduced.value,
    })
    settleDrag(delta)
    return
  }
  if (!stackIsTap(axis, evt ? evt.clientX - startX : 0, evt ? evt.clientY - startY : 0)) {
    tapOk = false
  }
  axis = null
  dragging.value = false
  dragX.value = 0
  reveal.value = 0
}

function settleDrag(delta) {
  const target = delta ? (delta > 0 ? -width * 0.82 : width * 0.82) : 0
  if (reduced.value) {
    dragging.value = false
    settling.value = false
    dragX.value = 0
    reveal.value = 0
    axis = null
    if (delta) setIndex(stackStepIndex(index.value, deck.value.length, delta), 'swipe')
    else showMark()
    return
  }
  settling.value = true
  dragging.value = true
  dragX.value = target
  if (typeof window === 'undefined') {
    completeSettle(delta)
    return
  }
  window.setTimeout(() => completeSettle(delta), 180)
}

function completeSettle(delta) {
  settling.value = false
  dragging.value = false
  dragX.value = 0
  reveal.value = 0
  axis = null
  if (delta) setIndex(stackStepIndex(index.value, deck.value.length, delta), 'swipe')
  else showMark()
}

function onPointerUp(evt) {
  finishPointer(evt)
}

function onPointerLeave(evt) {
  hovering.value = false
  pressing.value = false
  tiltX.value = 0
  tiltY.value = 0
  if (dragging.value) finishPointer(evt)
}

function onBlur() {
  hovering.value = false
  pressing.value = false
  tiltX.value = 0
  tiltY.value = 0
}

function onActivate() {
  if (!props.interactive || props.disabled || !tapOk || dragging.value || settling.value) return
  opening.value = true
  const payload = stackActivatePayload(props.media, index.value)
  emit('activate', { ...payload, printName: printName.value })
}

function onKeydown(evt) {
  if (!props.interactive || props.disabled) return
  if (evt.key === 'Enter' || evt.key === ' ') {
    evt.preventDefault()
    tapOk = true
    opening.value = true
    const payload = stackActivatePayload(props.media, index.value)
    emit('activate', { ...payload, printName: printName.value })
    return
  }
  if (!canBrowse.value) return
  if (evt.key === 'ArrowRight') {
    evt.preventDefault()
    if (plan.value.canNext) setIndex(index.value + 1, 'keyboard')
    else showMark()
  }
  if (evt.key === 'ArrowLeft') {
    evt.preventDefault()
    if (plan.value.canPrev) setIndex(index.value - 1, 'keyboard')
    else showMark()
  }
}

/**
 * A print that failed while the server-rendered HTML was still parsing has
 * already fired its error event by the time Vue attaches a listener, so the
 * rendered images are inspected directly as well.
 */
function auditPrints() {
  const el = rootRef.value
  if (!el) return
  for (const img of el.querySelectorAll('.fq-gstack__print img')) {
    const key = img.getAttribute('data-fq-print')
    if (!key || !img.complete) continue
    if (img.naturalWidth > 0) continue
    img.classList.add('is-broken')
    broken[key] = true
  }
}

function onBroken(item, evt) {
  evt?.target?.classList?.add('is-broken')
  const key = faneqoMediaKey(item)
  if (key) broken[key] = true
}

function onLoaded(item, evt) {
  evt?.target?.classList?.remove('is-broken')
  const key = faneqoMediaKey(item)
  if (key) broken[key] = false
}

watch(layers, () => {
  nextTick(auditPrints)
})

onMounted(() => {
  auditPrints()
  if (reduced.value || !canBrowse.value || !props.priority) return
  if (!consumeStackHint()) return
  hinting.value = true
  window.setTimeout(() => {
    hinting.value = false
  }, 720)
})

onBeforeUnmount(() => {
  hovering.value = false
  pressing.value = false
  if (typeof window !== 'undefined') window.clearTimeout(markTimer)
})
</script>

<style scoped>
.fq-gstack {
  --fq-print-ratio: 0.8;
  --fq-tilt-x: 0deg;
  --fq-tilt-y: 0deg;
  --fq-reveal: 0;
  appearance: none;
  display: block;
  width: 100%;
  padding: 0.85rem 1.05rem 1.35rem;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: default;
  overflow: visible;
  perspective: 920px;
  touch-action: pan-y;
  -webkit-tap-highlight-color: transparent;
}
.fq-gstack.is-interactive {
  cursor: pointer;
}
.fq-gstack.is-interactive.is-browsable {
  cursor: grab;
}
.fq-gstack.is-interactive.is-dragging,
.fq-gstack.is-browsable.is-dragging {
  cursor: grabbing;
  touch-action: none;
}
.fq-gstack.is-disabled {
  opacity: 0.48;
  cursor: default;
}
.fq-gstack:focus {
  outline: none;
}
.fq-gstack:focus-visible {
  outline: 2px solid #f5f5f6;
  outline-offset: 4px;
  border-radius: 0.2rem;
}

.fq-gstack__stage {
  position: relative;
  display: block;
  width: 100%;
  aspect-ratio: var(--fq-print-ratio, 0.8);
  overflow: visible;
  transform-style: preserve-3d;
  transform: rotateX(var(--fq-tilt-x)) rotateY(var(--fq-tilt-y));
  transition: transform 220ms cubic-bezier(0.22, 1, 0.36, 1);
}
.fq-gstack.is-dragging .fq-gstack__stage,
.fq-gstack.is-reduced .fq-gstack__stage {
  transition: none;
  transform: none;
}

.fq-gstack__print {
  position: absolute;
  inset: 0;
  overflow: hidden;
  border-radius: 2px;
  background: #111318;
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.16),
    0 10px 22px rgba(0, 0, 0, 0.28);
  transform-origin: 50% 70%;
  transition: transform 220ms cubic-bezier(0.22, 1, 0.36, 1);
}
.fq-gstack__print.is-front {
  z-index: 3;
  transform: translate3d(0, 0, 0) rotate(0deg);
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.16),
    0 calc(10px + (var(--fq-reveal) * 5px)) calc(22px + (var(--fq-reveal) * 8px)) rgba(0, 0, 0, 0.3);
}
.fq-gstack__print.is-back-a {
  z-index: 2;
  background: #171a21;
  transform: translate3d(
    calc(11px + (var(--fq-reveal) * 7px)),
    calc(7px - (var(--fq-reveal) * 4px)),
    -12px
  ) rotate(2.1deg);
}
.fq-gstack__print.is-back-b {
  z-index: 1;
  background: #14171d;
  transform: translate3d(calc(-11px - (var(--fq-reveal) * 5px)), 12px, -22px) rotate(-2deg);
}
.fq-gstack.is-single .fq-gstack__print.is-front {
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.09),
    0 12px 24px rgba(0, 0, 0, 0.3);
}

.fq-gstack__print img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center center;
  pointer-events: none;
  user-select: none;
}
.fq-gstack__print img.is-broken {
  opacity: 0;
}

.fq-gstack__empty {
  display: grid;
  place-items: center;
  height: 100%;
  color: rgba(245, 245, 246, 0.62);
  font-size: 0.82rem;
  letter-spacing: 0.04em;
}

/* Typographic stand-in for a photograph that will not render. */
.fq-gstack__void {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: grid;
  align-content: center;
  gap: 0.3rem;
  padding: 1rem 1.05rem;
  background: #101319;
  text-align: left;
}
.fq-gstack__void-name {
  color: rgba(245, 245, 246, 0.82);
  font-size: 0.95rem;
  font-weight: 620;
  letter-spacing: -0.02em;
  line-height: 1.22;
  overflow-wrap: anywhere;
}
.fq-gstack__void-note {
  color: rgba(245, 245, 246, 0.62);
  font-size: 0.82rem;
  letter-spacing: 0.01em;
}
.fq-gstack.is-compact .fq-gstack__void,
.fq-gstack.is-attachment .fq-gstack__void {
  padding: 0.7rem 0.75rem;
}
.fq-gstack.is-compact .fq-gstack__void-name,
.fq-gstack.is-attachment .fq-gstack__void-name {
  font-size: 0.85rem;
}
.fq-gstack__print.is-loading {
  background:
    linear-gradient(90deg, #111318 0%, #171a21 46%, #111318 100%);
  background-size: 220% 100%;
  animation: fq-gstack-shimmer 1.5s linear infinite;
}
@keyframes fq-gstack-shimmer {
  from { background-position: 120% 0; }
  to { background-position: -120% 0; }
}

.fq-gstack__mark {
  position: absolute;
  right: 0.45rem;
  bottom: 0.42rem;
  z-index: 4;
  padding: 0.14rem 0.4rem;
  border-radius: 999px;
  background: rgba(8, 9, 11, 0.52);
  color: rgba(245, 245, 246, 0.82);
  font-size: 0.62rem;
  font-weight: 650;
  letter-spacing: 0.04em;
  font-variant-numeric: tabular-nums;
  pointer-events: none;
  opacity: 0;
  transition: opacity 160ms ease;
}
.fq-gstack.is-browsing .fq-gstack__mark,
.fq-gstack.is-dragging .fq-gstack__mark {
  opacity: 1;
}
.fq-gstack.is-reduced .fq-gstack__mark {
  transition: none;
}
.fq-gstack__sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
}

.fq-gstack.is-hover .fq-gstack__print.is-front {
  transform: translate3d(0, -2px, 14px) rotate(0deg);
}
.fq-gstack.is-hover .fq-gstack__print.is-back-a {
  transform: translate3d(16px, 3px, -8px) rotate(2.4deg);
}
.fq-gstack.is-hover .fq-gstack__print.is-back-b {
  transform: translate3d(-16px, 8px, -18px) rotate(-2.3deg);
}

.fq-gstack.is-press .fq-gstack__print.is-front {
  transform: translate3d(0, 1px, 0) scale(0.985);
}
.fq-gstack.is-press .fq-gstack__print.is-back-a {
  transform: translate3d(15px, 5px, -12px) rotate(2.3deg);
}
.fq-gstack.is-press .fq-gstack__print.is-back-b {
  transform: translate3d(-15px, 10px, -22px) rotate(-2.2deg);
}

.fq-gstack.is-hint .fq-gstack__print.is-front {
  transform: translate3d(3px, -2px, 10px) rotate(0deg);
}
.fq-gstack.is-hint .fq-gstack__print.is-back-a {
  transform: translate3d(16px, 3px, -8px) rotate(2.35deg);
}
.fq-gstack.is-hint .fq-gstack__print.is-back-b {
  transform: translate3d(-16px, 8px, -18px) rotate(-2.25deg);
}

.fq-gstack.is-opening .fq-gstack__stage {
  transform: none;
  transition: none;
}
.fq-gstack.is-opening .fq-gstack__print.is-front {
  transform: none;
  border-radius: 0;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.12);
}
.fq-gstack.is-opening .fq-gstack__print.is-back-a,
.fq-gstack.is-opening .fq-gstack__print.is-back-b {
  opacity: 0.62;
  transform: translate3d(8px, 10px, -18px) scale(0.985);
}

.fq-gstack.is-dragging .fq-gstack__print,
.fq-gstack.is-settling .fq-gstack__print.is-back-a,
.fq-gstack.is-settling .fq-gstack__print.is-back-b {
  transition: transform 180ms cubic-bezier(0.22, 1, 0.36, 1);
}
.fq-gstack.is-dragging .fq-gstack__print.is-front {
  transition: none;
}

.fq-gstack.is-selected .fq-gstack__print.is-front {
  box-shadow:
    0 0 0 1px rgba(245, 245, 246, 0.42),
    0 10px 22px rgba(0, 0, 0, 0.28);
}

/* Plate treatment: at archive card widths three offset hairlines read as
   misalignment, so only the front print is outlined and the backs become
   paper edges. */
.fq-gstack.is-plate .fq-gstack__print {
  border-radius: 3px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.34);
}
.fq-gstack.is-plate .fq-gstack__print.is-front {
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.1),
    0 calc(10px + (var(--fq-reveal) * 5px)) calc(24px + (var(--fq-reveal) * 8px)) rgba(0, 0, 0, 0.4);
}
.fq-gstack.is-plate.is-selected .fq-gstack__print.is-front {
  box-shadow:
    0 0 0 1px rgba(245, 245, 246, 0.5),
    0 12px 26px rgba(0, 0, 0, 0.4);
}

.fq-gstack.is-compact {
  padding: 0.45rem 0.55rem 0.8rem;
}
.fq-gstack.is-attachment {
  padding: 0.3rem 0.4rem 0.55rem;
}

@media (prefers-reduced-motion: reduce) {
  .fq-gstack__stage,
  .fq-gstack__print {
    transition: none;
  }
  .fq-gstack__print.is-loading {
    animation: none;
  }
  .fq-gstack.is-hover .fq-gstack__print.is-front,
  .fq-gstack.is-press .fq-gstack__print.is-front {
    transform: translate3d(0, 0, 0) rotate(0deg);
  }
  .fq-gstack.is-hover .fq-gstack__print.is-back-a,
  .fq-gstack.is-press .fq-gstack__print.is-back-a {
    transform: translate3d(11px, 7px, -12px) rotate(2.1deg);
  }
  .fq-gstack.is-hover .fq-gstack__print.is-back-b,
  .fq-gstack.is-press .fq-gstack__print.is-back-b {
    transform: translate3d(-11px, 12px, -22px) rotate(-2deg);
  }
}
</style>
