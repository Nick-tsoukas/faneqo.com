<template>
  <Teleport to="body">
    <div
      v-if="open && current"
      ref="dialogRef"
      class="fq-mlb"
      :class="{
        'is-zoomable': zoomable,
        'is-zoomed': zoomable && scale > 1.02,
        'is-chrome-dim': !chromeOn,
      }"
      role="dialog"
      aria-modal="true"
      aria-label="Image"
      tabindex="-1"
      @pointermove="showChrome"
      @touchstart.passive="onTouchStart"
      @touchend="onTouchEnd"
    >
      <button type="button" class="fq-mlb__backdrop" aria-label="Close image" @click="close" />
      <header class="fq-mlb__bar" @focusin="pinChrome" @focusout="unpinChrome">
        <FaneqoIconButton class="fq-mlb__ctrl" name="close" size="lg" aria-label="Close" @click="close" />
        <p v-if="items.length > 1" class="fq-mlb__count">
          <span aria-hidden="true">{{ index + 1 }} / {{ items.length }}</span>
          <span class="fq-mlb__sr">Photo {{ index + 1 }} of {{ items.length }}</span>
        </p>
        <p v-else class="fq-mlb__count" />
        <div class="fq-mlb__tools">
          <template v-if="zoomable">
            <FaneqoIconButton class="fq-mlb__ctrl" name="zoomOut" aria-label="Zoom out" @click="zoomBy(-0.45)" />
            <FaneqoIconButton class="fq-mlb__ctrl" name="zoomIn" aria-label="Zoom in" @click="zoomBy(0.45)" />
            <FaneqoIconButton
              v-if="scale > 1.02"
              class="fq-mlb__ctrl"
              name="fit"
              aria-label="Fit photo"
              @click="resetZoom"
            />
          </template>
          <FaneqoIconButton
            v-if="shareable"
            class="fq-mlb__ctrl"
            name="share"
            size="lg"
            aria-label="Share gallery"
            @click="emit('share')"
          />
        </div>
      </header>
      <button
        v-if="items.length > 1"
        type="button"
        class="fq-mlb__nav is-prev"
        aria-label="Previous image"
        @click="step(-1)"
      >
        <component :is="chevronLeft" :size="20" :stroke-width="1.75" aria-hidden="true" />
      </button>
      <Motion :initial="reduced ? { opacity: 0 } : { opacity: 0, scale: 0.985 }" :animate="{ opacity: 1, scale: 1 }" :transition="motionTokens.standard">
        <div
          ref="stageRef"
          class="fq-mlb__stage"
          :class="{ 'is-zoomable': zoomable }"
          @wheel.prevent="onWheel"
          @pointerdown="onPointerDown"
          @pointermove="onPointerMove"
          @pointerup="onPointerUp"
          @pointercancel="onPointerUp"
          @dblclick.prevent="onDoubleClick"
        >
          <img
            :src="currentSrc"
            :alt="current.alt || 'Image'"
            class="fq-mlb__img"
            data-fit="contain"
            :style="imgStyle"
            draggable="false"
            @error="onBroken"
          />
        </div>
      </Motion>
      <nav
        v-if="items.length > 4"
        ref="filmstripRef"
        class="fq-mlb__filmstrip"
        aria-label="Gallery thumbnails"
      >
        <button
          v-for="(item, thumbIndex) in items"
          :key="`thumb-${item.mediaId || item.id || thumbIndex}`"
          type="button"
          class="fq-mlb__thumb"
          :class="{ 'is-current': thumbIndex === index }"
          :aria-label="`Open photo ${thumbIndex + 1}`"
          :aria-current="thumbIndex === index ? 'true' : undefined"
          @click="goTo(thumbIndex)"
        >
          <img :src="mediaThumbSrc(item)" alt="" loading="lazy" decoding="async" />
        </button>
      </nav>
      <p v-if="!broken" class="fq-mlb__hint" :class="{ 'has-filmstrip': items.length > 4 }">
        {{ hintCopy }}
      </p>
      <p v-if="broken" class="fq-mlb__broken" role="status">This photo could not be loaded.</p>
      <button
        v-if="items.length > 1"
        type="button"
        class="fq-mlb__nav is-next"
        aria-label="Next image"
        @click="step(1)"
      >
        <component :is="chevronRight" :size="20" :stroke-width="1.75" aria-hidden="true" />
      </button>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { Motion } from 'motion-v'
import { onKeyStroke, usePreferredReducedMotion } from '@vueuse/core'
import FaneqoIconButton from '~/components/ui/FaneqoIconButton.vue'
import { motionTokens } from '~/utils/ui/motionTokens'
import { faneqoIcon } from '~/utils/messages/faneqoIcons'
import { selectGalleryMediaSource } from '~/utils/media/faneqoGalleryLayout'
import { resolveFaneqoMediaSrc } from '~/utils/media/faneqoMedia'
import { lockOverlayScroll, unlockOverlayScroll } from '~/utils/ui/overlayScrollLock'

const props = defineProps({
  open: { type: Boolean, default: false },
  items: { type: Array, default: () => [] },
  startIndex: { type: Number, default: 0 },
  title: { type: String, default: '' },
  zoomable: { type: Boolean, default: false },
  shareable: { type: Boolean, default: false },
  transitionName: { type: String, default: '' },
})

const emit = defineEmits(['close', 'share'])
const chevronLeft = faneqoIcon('back')
const chevronRight = faneqoIcon('chevronRight')
const route = useRoute()
const dialogRef = ref(null)
const stageRef = ref(null)
const filmstripRef = ref(null)
const index = ref(0)
const broken = ref(false)
const reducedMotion = usePreferredReducedMotion()
const reduced = computed(() => reducedMotion.value === 'reduce')
const current = computed(() => props.items[index.value] || null)
const config = useRuntimeConfig()
const mediaOrigin = computed(() => String(config.public?.strapiUrl || '').replace(/\/+$/, ''))
const currentSrc = computed(() => {
  const item = current.value
  if (!item) return ''
  if (!item.protected && item.originalUrl) {
    return resolveFaneqoMediaSrc(item.originalUrl, mediaOrigin.value)
  }
  const pick = selectGalleryMediaSource(item, { role: 'lightbox', targetCssPx: 2000, dpr: 2 })
  return resolveFaneqoMediaSrc(pick?.url || item.largeUrl || item.url, mediaOrigin.value)
})
function mediaThumbSrc(item) {
  const pick = selectGalleryMediaSource(item, { role: 'thumb', targetCssPx: 160, dpr: 1 })
  return resolveFaneqoMediaSrc(pick?.url || item?.thumbnailUrl || item?.thumbUrl || item?.url, mediaOrigin.value)
}
const chromeOn = ref(true)
const chromePinned = ref(false)
let chromeTimer = 0
function showChrome() {
  chromeOn.value = true
  if (typeof window === 'undefined') return
  window.clearTimeout(chromeTimer)
  if (reduced.value || chromePinned.value) return
  chromeTimer = window.setTimeout(() => {
    if (chromePinned.value) return
    chromeOn.value = false
  }, 2800)
}
function pinChrome() {
  chromePinned.value = true
  chromeOn.value = true
  if (typeof window !== 'undefined') window.clearTimeout(chromeTimer)
}
function unpinChrome() {
  chromePinned.value = false
  showChrome()
}
const scale = ref(1)
const tx = ref(0)
const ty = ref(0)
const imgStyle = computed(() => {
  const named = props.transitionName
    ? { viewTransitionName: props.transitionName }
    : {}
  if (!props.zoomable) return Object.keys(named).length ? named : undefined
  return {
    ...named,
    transform: `translate3d(${tx.value}px, ${ty.value}px, 0) scale(${scale.value})`,
    cursor: scale.value > 1.02 ? 'grab' : 'zoom-in',
  }
})
const hintCopy = computed(() => {
  if (props.zoomable && scale.value > 1.02) return 'Drag to move · double-tap to reset'
  if (props.zoomable) return 'Swipe down to close · pinch to zoom'
  return 'Swipe down to close'
})
let returnFocus = null
let touchX = null
let touchY = null
let touchCount = 0
let pointers = new Map()
let lastPinch = 0
let lastTap = 0

const MIN_SCALE = 1
const MAX_SCALE = 4.5

function resetZoom() {
  scale.value = 1
  tx.value = 0
  ty.value = 0
}

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n))
}

function zoomAt(nextScale, clientX, clientY) {
  if (!props.zoomable) return
  const stage = stageRef.value
  if (!stage) {
    scale.value = clamp(nextScale, MIN_SCALE, MAX_SCALE)
    return
  }
  const prev = scale.value
  const next = clamp(nextScale, MIN_SCALE, MAX_SCALE)
  if (next === 1) {
    resetZoom()
    return
  }
  const rect = stage.getBoundingClientRect()
  const cx = clientX - rect.left - rect.width / 2
  const cy = clientY - rect.top - rect.height / 2
  const ratio = next / prev
  tx.value = cx - (cx - tx.value) * ratio
  ty.value = cy - (cy - ty.value) * ratio
  scale.value = next
}

function zoomBy(delta) {
  const stage = stageRef.value
  const rect = stage?.getBoundingClientRect()
  const cx = rect ? rect.left + rect.width / 2 : window.innerWidth / 2
  const cy = rect ? rect.top + rect.height / 2 : window.innerHeight / 2
  zoomAt(scale.value + delta, cx, cy)
}

function onWheel(evt) {
  if (!props.zoomable) return
  evt.preventDefault()
  const factor = evt.deltaY < 0 ? 1.12 : 0.89
  zoomAt(scale.value * factor, evt.clientX, evt.clientY)
}

function onDoubleClick(evt) {
  if (!props.zoomable) return
  if (scale.value > 1.05) resetZoom()
  else zoomAt(2.4, evt.clientX, evt.clientY)
}

function onPointerDown(evt) {
  if (!props.zoomable) return
  stageRef.value?.setPointerCapture?.(evt.pointerId)
  pointers.set(evt.pointerId, { x: evt.clientX, y: evt.clientY })
  if (pointers.size === 2) {
    const [a, b] = [...pointers.values()]
    lastPinch = Math.hypot(a.x - b.x, a.y - b.y)
  }
}

function onPointerMove(evt) {
  if (!props.zoomable || !pointers.has(evt.pointerId)) return
  const prev = pointers.get(evt.pointerId)
  pointers.set(evt.pointerId, { x: evt.clientX, y: evt.clientY })
  if (pointers.size === 2) {
    const [a, b] = [...pointers.values()]
    const dist = Math.hypot(a.x - b.x, a.y - b.y)
    if (lastPinch) {
      const midX = (a.x + b.x) / 2
      const midY = (a.y + b.y) / 2
      zoomAt(scale.value * (dist / lastPinch), midX, midY)
    }
    lastPinch = dist
    return
  }
  if (scale.value > 1.02 && prev) {
    tx.value += evt.clientX - prev.x
    ty.value += evt.clientY - prev.y
  }
}

function onPointerUp(evt) {
  if (!props.zoomable) return
  const now = Date.now()
  const wasTap = pointers.size === 1
  pointers.delete(evt.pointerId)
  if (pointers.size < 2) lastPinch = 0
  if (wasTap && evt.pointerType === 'touch' && now - lastTap < 280) {
    onDoubleClick(evt)
    lastTap = 0
  } else if (wasTap && evt.pointerType === 'touch') {
    lastTap = now
  }
}

function focusables() {
  const root = dialogRef.value
  if (!root) return []
  return [...root.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')]
    .filter((el) => !el.hasAttribute('disabled') && el.offsetParent !== null)
}

function trapFocus(evt) {
  if (!props.open || evt.key !== 'Tab') return
  const nodes = focusables()
  if (!nodes.length) {
    evt.preventDefault()
    dialogRef.value?.focus?.()
    return
  }
  const first = nodes[0]
  const last = nodes[nodes.length - 1]
  if (evt.shiftKey && document.activeElement === first) {
    evt.preventDefault()
    last.focus()
  } else if (!evt.shiftKey && document.activeElement === last) {
    evt.preventDefault()
    first.focus()
  }
}

function lockScroll(on) {
  if (on) lockOverlayScroll('lightbox')
  else unlockOverlayScroll('lightbox')
}

function close() {
  emit('close')
}

function goTo(next) {
  if (!props.items.length) return
  broken.value = false
  resetZoom()
  index.value = Math.max(0, Math.min(Number(next) || 0, props.items.length - 1))
  nextTick(() => {
    const currentThumb = filmstripRef.value?.querySelector?.('[aria-current="true"]')
    currentThumb?.scrollIntoView?.({ behavior: reduced.value ? 'auto' : 'smooth', block: 'nearest', inline: 'center' })
  })
}

function step(delta) {
  if (props.items.length < 2) return
  const next = (index.value + delta + props.items.length) % props.items.length
  goTo(next)
}

function onBroken() {
  broken.value = true
}

function onTouchStart(evt) {
  touchCount = evt.touches?.length || 1
  const touch = evt.changedTouches?.[0]
  touchX = touch?.clientX ?? null
  touchY = touch?.clientY ?? null
}

function onTouchEnd(evt) {
  const fingers = touchCount
  touchCount = evt.touches?.length || 0
  if (fingers > 1 || (props.zoomable && scale.value > 1.02)) {
    touchX = null
    touchY = null
    return
  }
  if (touchX == null || touchY == null) return
  const touch = evt.changedTouches?.[0]
  const dx = (touch?.clientX ?? touchX) - touchX
  const dy = (touch?.clientY ?? touchY) - touchY
  if (Math.abs(dy) > 72 && Math.abs(dy) > Math.abs(dx) * 1.35) {
    close()
    touchX = null
    touchY = null
    return
  }
  if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.25) {
    step(dx < 0 ? 1 : -1)
  }
  touchX = null
  touchY = null
}

watch(
  () => [props.open, props.startIndex],
  async ([open, start]) => {
    if (!open) return
    broken.value = false
    resetZoom()
    index.value = Math.max(0, Math.min(Number(start) || 0, props.items.length - 1))
    showChrome()
    await nextTick()
    dialogRef.value?.focus?.()
  }
)

watch(
  () => props.open,
  (open) => {
    if (typeof document === 'undefined') return
    if (open) {
      returnFocus = document.activeElement
      lockScroll(true)
      document.addEventListener('keydown', trapFocus, true)
    } else {
      document.removeEventListener('keydown', trapFocus, true)
      lockScroll(false)
      resetZoom()
      if (returnFocus?.focus) returnFocus.focus()
      returnFocus = null
    }
  }
)

watch(
  () => route.fullPath,
  () => {
    if (props.open) close()
  }
)

onKeyStroke('Escape', (evt) => {
  if (!props.open) return
  evt.preventDefault()
  showChrome()
  close()
})
onKeyStroke('ArrowLeft', () => {
  if (!props.open) return
  showChrome()
  step(-1)
})
onKeyStroke('ArrowRight', () => {
  if (!props.open) return
  showChrome()
  step(1)
})

onBeforeUnmount(() => {
  if (typeof document === 'undefined') return
  document.removeEventListener('keydown', trapFocus, true)
  if (props.open) lockScroll(false)
})
</script>

<style scoped>
.fq-mlb {
  --fq-mlb-bar: calc(3.55rem + env(safe-area-inset-top, 0px));
  --fq-mlb-hint: calc(2.35rem + env(safe-area-inset-bottom, 0px));
  --fq-mlb-stage-h: calc(100dvh - var(--fq-mlb-bar) - var(--fq-mlb-hint));
  position: fixed;
  inset: 0;
  z-index: 100000000;
  display: grid;
  place-items: center;
  width: 100dvw;
  height: 100dvh;
  max-width: 100dvw;
  max-height: 100dvh;
  overflow: hidden;
  padding: var(--fq-mlb-bar) 0.75rem var(--fq-mlb-hint);
}
.fq-mlb__backdrop {
  position: absolute;
  inset: 0;
  border: 0;
  background: #050608;
  cursor: pointer;
}
.fq-mlb__bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 3;
  display: grid;
  grid-template-columns: 3.2rem 1fr auto;
  align-items: center;
  gap: 0.45rem;
  padding: calc(0.45rem + env(safe-area-inset-top, 0px)) 0.7rem 0.55rem;
  background: linear-gradient(180deg, rgba(5, 6, 8, 0.72) 0%, rgba(5, 6, 8, 0) 100%);
  pointer-events: none;
  transition: opacity 140ms ease;
}
.fq-mlb__bar > * {
  pointer-events: auto;
}
.fq-mlb__count {
  margin: 0;
  justify-self: center;
  color: rgba(255, 255, 255, 0.62);
  font-size: 0.78rem;
  font-variant-numeric: tabular-nums;
}
.fq-mlb__sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
}
.fq-mlb__tools {
  display: flex;
  justify-content: flex-end;
  gap: 0.2rem;
}
.fq-mlb :deep(.fq-mlb__ctrl) {
  min-width: 48px;
  min-height: 48px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 999px;
  background: rgba(8, 9, 11, 0.42);
  color: rgba(255, 255, 255, 0.78);
  transition: background 140ms ease, color 140ms ease, transform 140ms ease, opacity 140ms ease;
}
.fq-mlb :deep(.fq-mlb__ctrl:hover:not(:disabled)) {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}
.fq-mlb :deep(.fq-mlb__ctrl.is-pressed) { transform: scale(0.96); }
.fq-mlb :deep(.fq-mlb__ctrl:focus-visible) {
  outline: 2px solid #39d5ff;
  outline-offset: 3px;
}
.fq-mlb__stage {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  max-width: 100%;
  min-width: 0;
  min-height: 0;
}
.fq-mlb__stage.is-zoomable {
  touch-action: none;
  overflow: hidden;
  width: min(100dvw, 64rem);
  height: var(--fq-mlb-stage-h);
  max-width: 100%;
}
.fq-mlb__img {
  position: relative;
  z-index: 1;
  display: block;
  width: auto;
  height: auto;
  max-width: min(94vw, 58rem);
  max-height: var(--fq-mlb-stage-h);
  object-fit: contain;
  object-position: center center;
  border-radius: 0;
  transform-origin: center center;
  user-select: none;
  -webkit-user-drag: none;
}
.is-zoomable .fq-mlb__img {
  width: auto;
  height: auto;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  object-position: center center;
}
.fq-mlb__hint {
  position: absolute;
  left: 50%;
  bottom: calc(0.7rem + env(safe-area-inset-bottom, 0px));
  z-index: 3;
  transform: translateX(-50%);
  margin: 0;
  padding: 0;
  border: 0;
  background: none;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.72rem;
  font-weight: 600;
  white-space: nowrap;
  pointer-events: none;
}
.fq-mlb__broken {
  position: relative;
  z-index: 2;
  margin: 0.75rem 0 0;
  color: rgba(255, 255, 255, 0.62);
  font-size: 0.85rem;
}
.fq-mlb__nav {
  position: absolute;
  top: var(--fq-mlb-bar);
  bottom: var(--fq-mlb-hint);
  z-index: 2;
  display: grid;
  place-items: center;
  width: 4.75rem;
  border: 0;
  background: transparent;
  color: rgba(255, 255, 255, 0.62);
  cursor: pointer;
  transition: opacity 140ms ease, color 140ms ease;
}
.fq-mlb__nav.is-prev { left: 0; }
.fq-mlb__nav.is-next { right: 0; }
.fq-mlb__nav:hover { color: #fff; }
.fq-mlb__nav:focus-visible {
  outline: 2px solid #39d5ff;
  outline-offset: -6px;
}
@media (max-width: 767px) {
  .fq-mlb__nav { display: none; }
}
@media (min-width: 768px) {
  .fq-mlb__nav {
    opacity: 0;
  }
  .fq-mlb:hover .fq-mlb__nav,
  .fq-mlb__nav:focus-visible {
    opacity: 1;
  }
}
.fq-mlb.is-chrome-dim .fq-mlb__bar,
.fq-mlb.is-chrome-dim .fq-mlb__nav,
.fq-mlb.is-chrome-dim .fq-mlb__hint {
  opacity: 0.28;
}
.fq-mlb.is-chrome-dim .fq-mlb__ctrl:focus-visible,
.fq-mlb.is-chrome-dim .fq-mlb__nav:focus-visible {
  opacity: 1;
}
@media (prefers-reduced-motion: reduce) {
  .fq-mlb.is-chrome-dim .fq-mlb__bar,
  .fq-mlb.is-chrome-dim .fq-mlb__nav,
  .fq-mlb.is-chrome-dim .fq-mlb__hint {
    opacity: 1;
  }
  .fq-mlb :deep(.fq-mlb__ctrl),
  .fq-mlb__nav {
    transition: none;
    transform: none;
  }
}
@media (max-width: 639px) {
  .fq-mlb {
    --fq-mlb-bar: calc(3.45rem + env(safe-area-inset-top, 0px));
    --fq-mlb-hint: calc(2.55rem + env(safe-area-inset-bottom, 0px));
    padding: var(--fq-mlb-bar) 0 var(--fq-mlb-hint);
  }
  .fq-mlb__img {
    max-width: 100dvw;
    max-height: var(--fq-mlb-stage-h);
    border-radius: 0;
  }
  .fq-mlb__stage.is-zoomable {
    width: 100dvw;
    height: var(--fq-mlb-stage-h);
  }
  .fq-mlb__hint {
    font-size: 0.68rem;
  }
  .fq-mlb__nav {
    width: 2.75rem;
    height: 2.75rem;
  }
}
@media (min-width: 768px) {
  .fq-mlb {
    --fq-mlb-hint: calc(0.85rem + env(safe-area-inset-bottom, 0px));
  }
  .fq-mlb__hint {
    display: none;
  }
}

.fq-mlb__filmstrip {
  position: absolute;
  left: 50%;
  bottom: calc(0.55rem + env(safe-area-inset-bottom, 0px));
  z-index: 4;
  display: flex;
  gap: 0.42rem;
  width: min(88vw, 48rem);
  padding: 0.35rem;
  overflow-x: auto;
  transform: translateX(-50%);
  scrollbar-width: none;
  overscroll-behavior-inline: contain;
  scroll-snap-type: x proximity;
}
.fq-mlb__filmstrip::-webkit-scrollbar { display: none; }
.fq-mlb__thumb {
  flex: 0 0 3.2rem;
  width: 3.2rem;
  height: 3.2rem;
  padding: 0;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 0.35rem;
  overflow: hidden;
  background: #0b0e14;
  opacity: 0.58;
  cursor: pointer;
  scroll-snap-align: center;
}
.fq-mlb__thumb.is-current {
  border-color: rgba(255, 255, 255, 0.88);
  opacity: 1;
  box-shadow: none;
}
.fq-mlb__thumb:focus-visible {
  outline: 2px solid #39d5ff;
  outline-offset: 2px;
}
.fq-mlb__thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.fq-mlb__hint.has-filmstrip {
  bottom: calc(4.7rem + env(safe-area-inset-bottom, 0px));
}
</style>
