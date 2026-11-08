<template>
  <Teleport v-if="surface" :to="surface">
    <div class="fq-pv-chrome">
      <p class="fq-pv-live" aria-live="polite" aria-atomic="true">{{ liveStatus }}</p>

      <button
        type="button"
        class="fq-pv-close"
        aria-label="Close photograph"
        @click="requestClose"
      >
        <X :size="glyph" :stroke-width="1.75" />
      </button>

      <button
        v-if="pointerNav"
        type="button"
        class="fq-pv-step fq-pv-step--prev"
        aria-label="Previous photograph"
        :disabled="index <= 0 || zoom.isZoomed"
        @click="step(-1)"
      >
        <ChevronLeft :size="glyph + 6" :stroke-width="1.5" />
      </button>

      <button
        v-if="pointerNav"
        type="button"
        class="fq-pv-step fq-pv-step--next"
        aria-label="Next photograph"
        :disabled="index >= photos.length - 1 || zoom.isZoomed"
        @click="step(1)"
      >
        <ChevronRight :size="glyph + 6" :stroke-width="1.5" />
      </button>

      <!--
        The wall this photograph came off. Real photography, not chrome, filling
        the room a tall frame cannot use. Only where a large display has the
        space to give — never on a phone, never over the print.
      -->
      <template v-if="neighbours">
        <button
          v-for="side in neighbours"
          :key="side.key"
          type="button"
          class="fq-pv-near"
          :style="side.style"
          :aria-label="side.label"
          @click="select(side.index)"
        >
          <img :src="side.src" alt="" decoding="async">
        </button>
      </template>

      <div class="fq-pv-foot">
        <div class="fq-pv-foot__text">
          <p v-if="caption" class="fq-pv-caption">{{ caption }}</p>
          <p v-if="credit" class="fq-pv-credit">{{ credit }}</p>
        </div>

        <button
          type="button"
          class="fq-pv-index"
          :class="{ 'is-zoom': zoom.isZoomed }"
          :aria-label="indexLabel"
          @click="toggleSheet"
        >
          <template v-if="zoom.isZoomed">
            <span class="fq-pv-index__now">{{ zoom.percent }}%</span>
          </template>
          <template v-else>
            <span class="fq-pv-index__now">{{ pad(index + 1) }}</span>
            <span class="fq-pv-index__of">/ {{ pad(photos.length) }}</span>
          </template>
        </button>
      </div>

      <div v-if="photos.length > 1" class="fq-pv-rule" aria-hidden="true">
        <span class="fq-pv-rule__on" :style="ruleStyle" />
      </div>

      <ViewerContactSheet
        v-if="photos.length > 1"
        :photos="photos"
        :index="index"
        :open="sheetOpen"
        :reduced="reduced"
        @select="select"
        @close="sheetOpen = false"
      />
    </div>
  </Teleport>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { usePreferredReducedMotion } from '@vueuse/core'
import { ChevronLeft, ChevronRight, X } from '@lucide/vue'
import { lockOverlayScroll, unlockOverlayScroll } from '~/utils/ui/overlayScrollLock'
import ViewerContactSheet from './ViewerContactSheet.vue'
import { createViewerAdapter } from './viewerAdapter'
import { readSafeArea } from './viewerSafeArea'
import {
  VIEWER_DESKTOP,
  VIEWER_WALL,
  viewerLayout,
  viewerPadding,
  viewerSheetHeight,
} from './viewerGeometry'
import { createLivingGalleryHistory } from '../living-gallery/livingGalleryHistory'
import {
  hideContinuityElement,
  resolveThumbBounds,
  resolveThumbElement,
  restoreContinuityElements,
} from '../living-gallery/livingGallerySource'
import 'photoswipe/style.css'
import './photoViewer.css'

const props = defineProps({
  open: { type: Boolean, default: false },
  photos: { type: Array, default: () => [] },
  index: { type: Number, default: 0 },
  /** Continuity contract: which element the photograph travels from. */
  source: { type: Object, default: null },
  /** Lab escape hatches. Production passes nothing. */
  options: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['close', 'change'])

const reducedMotion = usePreferredReducedMotion()
const reduced = computed(() => reducedMotion.value === 'reduce')

const surface = ref(null)
const index = ref(0)
const peace = ref(false)
const sheetOpen = ref(false)
const zoom = ref({ percent: 100, isZoomed: false, canZoom: false })
const viewW = ref(typeof window !== 'undefined' ? window.innerWidth : 390)
const viewH = ref(typeof window !== 'undefined' ? window.innerHeight : 844)
const safe = ref({ top: 0, right: 0, bottom: 0, left: 0 })

let idleTimer = 0
let adapter
const IDLE_MS = 2800

const history = createLivingGalleryHistory({
  onPopClose() {
    adapter?.close()
  },
})

const photo = computed(() => props.photos[index.value] || props.photos[0] || null)

const layout = computed(() => viewerLayout({
  viewportWidth: viewW.value,
  viewportHeight: viewH.value,
  imageWidth: photo.value?.width,
  imageHeight: photo.value?.height,
  safeTop: safe.value.top,
  safeRight: safe.value.right,
  safeBottom: safe.value.bottom,
  safeLeft: safe.value.left,
}))

const glyph = computed(() => {
  const d = layout.value.device
  if (d === VIEWER_WALL) return 26
  if (d === VIEWER_DESKTOP) return 22
  return 20
})

/** A mouse gets edge affordances. A finger gets the photograph. */
const pointerNav = computed(() => (
  props.photos.length > 1
  && (layout.value.device === VIEWER_DESKTOP || layout.value.device === VIEWER_WALL)
))

const caption = computed(() => photo.value?.caption || '')
const credit = computed(() => {
  const name = photo.value?.photographer
  return name ? `Photograph · ${name}` : ''
})

const indexLabel = computed(() => (
  zoom.value.isZoomed
    ? `Enlarged to ${zoom.value.percent} percent`
    : `Photograph ${index.value + 1} of ${props.photos.length}. Show all photographs`
))

const liveStatus = computed(() => {
  if (!props.open || !props.photos.length) return ''
  const total = props.photos.length
  const name = caption.value || photo.value?.alt || ''
  return `Photograph ${index.value + 1} of ${total}${name ? `. ${name}` : ''}`
})

const ruleStyle = computed(() => {
  const total = Math.max(1, props.photos.length)
  return {
    width: `${(100 / total).toFixed(4)}%`,
    transform: `translate3d(${(index.value * 100).toFixed(2)}%, 0, 0)`,
  }
})

/**
 * Neighbouring prints, only where a large display leaves real room beside a
 * tall frame. Sized from the photographs themselves and hung so their lower
 * edges line up with the open print.
 */
const neighbours = computed(() => {
  if (props.options?.neighbours === false) return null
  const l = layout.value
  if (l.device !== VIEWER_DESKTOP && l.device !== VIEWER_WALL) return null
  if (props.photos.length < 2) return null
  const breath = l.device === VIEWER_WALL ? 48 : 36
  const roomLeft = l.gap.left - l.padding.left - breath
  const roomRight = l.gap.right - l.padding.right - breath
  const room = Math.min(roomLeft, roomRight)
  if (room < 116) return null
  const cap = Math.min(room, l.device === VIEWER_WALL ? 330 : 260)

  const build = (at, side) => {
    const near = props.photos[at]
    if (!near) return null
    const ratio = Math.max(0.4, (Number(near.width) || 3) / (Number(near.height) || 2))
    let w = cap
    let h = Math.round(w / ratio)
    const maxH = Math.round(l.print.h * 0.52)
    if (h > maxH) {
      h = maxH
      w = Math.round(h * ratio)
    }
    const top = l.print.y + l.print.h - h
    const style = side === 'prev'
      ? { width: `${w}px`, height: `${h}px`, top: `${top}px`, left: `${l.print.x - breath - w}px` }
      : { width: `${w}px`, height: `${h}px`, top: `${top}px`, left: `${l.print.x + l.print.w + breath}px` }
    return {
      key: side,
      index: at,
      src: near.mediumSrc || near.thumbSrc || near.src,
      label: side === 'prev' ? 'Previous photograph' : 'Next photograph',
      style,
    }
  }

  const list = [build(index.value - 1, 'prev'), build(index.value + 1, 'next')].filter(Boolean)
  return list.length ? list : null
})

function pad(value) {
  const n = Number(value) || 0
  return n < 10 ? `0${n}` : String(n)
}

function measure() {
  viewW.value = window.innerWidth
  viewH.value = window.innerHeight
  safe.value = readSafeArea(document)
}

/**
 * The chrome reads its geometry from the same numbers PhotoSwipe does. Written
 * onto the PhotoSwipe root so plain CSS can use them.
 */
function paintSurface() {
  const root = surface.value
  if (!root) return
  const l = layout.value
  root.dataset.device = l.device
  root.style.setProperty('--fq-pv-edge', `${l.padding.left - safe.value.left}px`)
  root.style.setProperty('--fq-pv-top', `${l.padding.top}px`)
  root.style.setProperty('--fq-pv-foot', `${l.padding.bottom}px`)
  root.style.setProperty('--fq-pv-sheet', `${viewerSheetHeight(l.device)}px`)
  root.style.setProperty('--fq-pv-safe-top', `${safe.value.top}px`)
  root.style.setProperty('--fq-pv-safe-bottom', `${safe.value.bottom}px`)
  root.style.setProperty('--fq-pv-print-x', `${l.print.x}px`)
  root.style.setProperty('--fq-pv-print-y', `${l.print.y}px`)
  root.style.setProperty('--fq-pv-print-w', `${l.print.w}px`)
  root.style.setProperty('--fq-pv-print-h', `${l.print.h}px`)
  root.classList.toggle('is-peace', peace.value)
}

function clearIdle() {
  if (idleTimer) {
    clearTimeout(idleTimer)
    idleTimer = 0
  }
}

/**
 * On a large display the words step aside on their own after a while, and one
 * mouse movement brings them back. A phone never does this: chrome that
 * disappears on a timer leaves a person tapping to find out what happened.
 */
function armIdle() {
  clearIdle()
  if (props.options?.idle === false) return
  if (!pointerNav.value) return
  if (sheetOpen.value) return
  idleTimer = window.setTimeout(() => {
    idleTimer = 0
    if (sheetOpen.value) return
    peace.value = true
  }, IDLE_MS)
}

function wake() {
  if (peace.value) peace.value = false
  armIdle()
}

function togglePeace() {
  if (sheetOpen.value) {
    sheetOpen.value = false
    return
  }
  peace.value = !peace.value
  if (!peace.value) armIdle()
  else clearIdle()
}

function toggleSheet() {
  if (zoom.value.isZoomed) {
    adapter?.toggleZoom()
    return
  }
  sheetOpen.value = !sheetOpen.value
  if (sheetOpen.value) {
    peace.value = false
    clearIdle()
  } else {
    armIdle()
  }
}

function step(direction) {
  peace.value = false
  adapter?.step(direction)
  armIdle()
}

function select(at) {
  peace.value = false
  adapter?.goTo(at)
  armIdle()
}

function requestClose() {
  adapter?.close()
}

function resolvePadding(viewportSize) {
  return viewerPadding({
    viewportWidth: viewportSize?.x ?? viewW.value,
    viewportHeight: viewportSize?.y ?? viewH.value,
    safeTop: safe.value.top,
    safeRight: safe.value.right,
    safeBottom: safe.value.bottom,
    safeLeft: safe.value.left,
  })
}

function sourceContext() {
  return { ...(props.source || {}) }
}

function getThumbBounds(at) {
  return resolveThumbBounds(at, props.photos, sourceContext(), document)
}

function hideSource(at) {
  hideContinuityElement(resolveThumbElement(at, props.photos, sourceContext(), document))
}

adapter = createViewerAdapter({
  resolvePadding,
  onSurfaceReady(root) {
    surface.value = root
    if (root) paintSurface()
  },
  onOpen(at) {
    index.value = at
    peace.value = false
    sheetOpen.value = false
    lockOverlayScroll('faneqo-photo-viewer')
    if (typeof document !== 'undefined') {
      document.documentElement.classList.add('fq-pv-hide-devtools')
    }
    history.enter()
    hideSource(at)
    emit('change', at)
    armIdle()
  },
  onChange(at) {
    index.value = at
    emit('change', at)
  },
  onZoom(state) {
    zoom.value = state
  },
  onOpeningStart(at) {
    hideSource(at)
  },
  onClosingStart(at) {
    hideSource(at)
  },
  onClosingEnd() {
    restoreContinuityElements()
  },
  onTogglePeace: togglePeace,
  onClose(at) {
    clearIdle()
    peace.value = false
    sheetOpen.value = false
    surface.value = null
    unlockOverlayScroll('faneqo-photo-viewer')
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('fq-pv-hide-devtools')
    }
    history.exit()
    restoreContinuityElements()
    emit('close', at)
  },
})

function onKeydown(event) {
  if (!props.open) return
  if (event.metaKey || event.ctrlKey || event.altKey) return
  const key = event.key
  if (key === 'ArrowRight' || key === 'ArrowDown') {
    event.preventDefault()
    step(1)
    return
  }
  if (key === 'ArrowLeft' || key === 'ArrowUp') {
    event.preventDefault()
    step(-1)
    return
  }
  if (key === 'Home') {
    event.preventDefault()
    select(0)
    return
  }
  if (key === 'End') {
    event.preventDefault()
    select(props.photos.length - 1)
    return
  }
  if (key === 'f' || key === 'F') {
    event.preventDefault()
    toggleSheet()
    return
  }
  if (key === 'z' || key === 'Z') {
    event.preventDefault()
    peace.value = false
    adapter?.toggleZoom()
    armIdle()
    return
  }
  if (key === 'Escape' && sheetOpen.value) {
    event.preventDefault()
    event.stopPropagation()
    sheetOpen.value = false
  }
}

/**
 * Pointer intent on a large display: movement wakes the words, and reaching for
 * the foot of the screen raises the contact sheet the way a drawer meets a hand.
 */
function onPointerMove(event) {
  if (!props.open) return
  if (event.pointerType === 'touch') return
  wake()
  if (!pointerNav.value) return
  if (zoom.value.isZoomed) return
  const fromBottom = viewH.value - event.clientY
  const trigger = viewerSheetHeight(layout.value.device) * 0.62
  if (fromBottom <= trigger && !sheetOpen.value) {
    sheetOpen.value = true
    clearIdle()
  } else if (sheetOpen.value && fromBottom > viewerSheetHeight(layout.value.device) + 140) {
    sheetOpen.value = false
    armIdle()
  }
}

watch([layout, peace], paintSurface)

watch(surface, (root) => {
  if (root) paintSurface()
})

watch(sheetOpen, (on) => {
  if (on) clearIdle()
  else armIdle()
})

watch(
  () => props.open,
  async (open) => {
    if (!open) {
      adapter.close()
      return
    }
    measure()
    index.value = props.index
    await adapter.open(props.photos, props.index, {
      reduced: reduced.value,
      trapFocus: false,
      getThumbBounds,
    })
  },
  { immediate: true },
)

watch(() => props.index, (at) => {
  if (!props.open) return
  if (adapter.getIndex() !== at) adapter.goTo(at)
})

function onResize() {
  measure()
  if (props.open) adapter.refresh()
}

onMounted(() => {
  measure()
  history.attach()
  window.addEventListener('resize', onResize)
  window.addEventListener('keydown', onKeydown)
  window.addEventListener('pointermove', onPointerMove, { passive: true })
})

onBeforeUnmount(() => {
  clearIdle()
  window.removeEventListener('resize', onResize)
  window.removeEventListener('keydown', onKeydown)
  window.removeEventListener('pointermove', onPointerMove)
  history.detach()
  restoreContinuityElements()
  adapter.destroy()
  unlockOverlayScroll('faneqo-photo-viewer')
})

defineExpose({ adapter })
</script>

<style>
html.fq-pv-hide-devtools nuxt-devtools,
html.fq-pv-hide-devtools .nuxt-devtools,
html.fq-pv-hide-devtools .nuxt-devtools-anchor,
html.fq-pv-hide-devtools .nuxt-devtools-panel,
html.fq-pv-hide-devtools .nuxt-devtools-glowing,
html.fq-pv-hide-devtools .nuxt-devtools-nuxt-button,
html.fq-pv-hide-devtools #nuxt-devtools-container {
  display: none !important;
}
</style>
