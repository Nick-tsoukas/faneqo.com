<template>
  <Teleport v-if="surface" :to="surface">
    <div class="stage">
      <GalleryViewerChrome
        :identity="identity"
        :caption="viewer.photo.value?.caption || ''"
        :index="viewer.index.value"
        :count="viewer.count.value"
        :visible="viewer.chromeVisible.value && !viewer.sheetOpen.value"
        :can-share="viewer.canShare.value"
        :sheet-open="viewer.sheetOpen.value"
        :can-prev="viewer.canPrev.value"
        :can-next="viewer.canNext.value"
        @close="requestClose('close-button')"
        @share="onShare"
        @sheet="viewer.toggleSheet()"
        @prev="step(-1)"
        @next="step(1)"
      />

      <GalleryContactSheet
        :photos="photos"
        :index="viewer.index.value"
        :open="viewer.sheetOpen.value"
        :viewport-width="viewport.width"
        @select="onSheetSelect"
        @close="viewer.closeSheet()"
      />

      <p v-if="shareStatus" class="stage__status" role="status">{{ shareStatus }}</p>

      <p class="stage__live" aria-live="polite">{{ liveText }}</p>
    </div>
  </Teleport>
</template>

<script setup>
/**
 * The canonical gallery viewer.
 *
 * PhotoSwipe v5 owns the physics — swipe, pinch, pan, bounds, momentum,
 * index, and the zoom flight out of and back into the wall. That is a locked
 * decision (LG-D001) and this component does not relitigate it: it reaches
 * PhotoSwipe only through `createViewerAdapter`, the same adapter the existing
 * Photo Viewer uses. Nothing here imports PhotoSwipe.
 *
 * What this component owns is everything the engine has no opinion about:
 * the stage reserves, the restrained chrome, the contact sheet, share, and —
 * critically — the meaning of a close.
 *
 * WHY WE OVERRIDE THE ENGINE'S ZOOM LEVELS
 * ----------------------------------------
 * PhotoSwipe's `fit` is `Math.min(1, ...)`, so a 1024px photograph renders as
 * a small print in the centre of a 1920px stage. `galleryEnlargement.js`
 * replaces that with an uncapped contain ratio under a device-density budget.
 * See that file for the rule and the reasoning.
 *
 * WHY WE TAKE OVER ESCAPE
 * -----------------------
 * PhotoSwipe's own `escKey` closes the viewer immediately, which would make
 * Escape skip the contact sheet, share and zoom layers. Escape has to dismiss
 * the thing most recently summoned, so we disable the library handler and
 * route every key through `resolveDismissIntent`.
 */
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import GalleryViewerChrome from './GalleryViewerChrome.vue'
import GalleryContactSheet from './GalleryContactSheet.vue'
import { createViewerAdapter } from '../viewer/viewerAdapter.js'
import { prefersReducedMotion } from '../effects/reducedMotion.js'
import {
  galleryInitialZoomLevel,
  gallerySecondaryZoomLevel,
  galleryMaxZoomLevel,
  galleryStageReserves,
  clampDevicePixelRatio,
} from './galleryEnlargement.js'
import { runGalleryShare } from './gallerySharePayload.js'
import 'photoswipe/style.css'
import './canonicalGallery.css'

const props = defineProps({
  /** The `useGalleryViewer` instance. State lives there, not here. */
  viewer: { type: Object, required: true },
  photos: { type: Array, default: () => [] },
  identity: { type: Object, required: true },
  origin: { type: String, default: '' },
  reduced: { type: Boolean, default: false },
  /** (index) => HTMLElement — the frame this photograph flies out of. */
  resolveFrame: { type: Function, default: null },
})

const emit = defineEmits(['shared'])

const { viewer } = props
const surface = shallowRef(null)
const shareStatus = ref('')
const viewport = ref({ width: 0, height: 0 })

let adapter = null
/** Why the current close was requested. Consumed once by the engine's close. */
let pendingReason = null
let statusTimer = 0

const liveText = computed(() => {
  const photo = viewer.photo.value
  if (!photo) return ''
  const position = `Photograph ${viewer.index.value + 1} of ${viewer.count.value}`
  return photo.caption ? `${position}. ${photo.caption}` : position
})

function measure() {
  if (typeof window === 'undefined') return
  viewport.value = { width: window.innerWidth, height: window.innerHeight }
}

function dpr() {
  return clampDevicePixelRatio(typeof window === 'undefined' ? 1 : window.devicePixelRatio)
}

/**
 * The stage reserves double as the readability budget for the chrome: the
 * caption sits in reserved space rather than on the photograph.
 */
function resolvePadding(viewportSize) {
  const reserves = galleryStageReserves(viewportSize?.x, viewportSize?.y)
  return {
    top: reserves.top,
    bottom: reserves.foot,
    left: reserves.edge,
    right: reserves.edge,
  }
}

function ensureAdapter() {
  if (adapter) return adapter
  adapter = createViewerAdapter({
    resolvePadding,
    onSurfaceReady: (root) => {
      if (root) {
        /*
         * PhotoSwipe sets these itself; we assert them so a library change
         * can never silently drop the viewer's dialog semantics. Screen
         * readers must treat the open photograph as a modal dialog, and the
         * overview behind it as inert.
         */
        root.setAttribute('role', 'dialog')
        root.setAttribute('aria-modal', 'true')
        root.setAttribute('aria-label', 'Photograph')
      }
      surface.value = root
    },
    onChange: (index) => {
      // The engine is the source of truth for index; mirror it into state.
      viewer.goTo(index)
    },
    onZoom: (zoom) => viewer.setZoomed(zoom.isZoomed),
    /*
     * PhotoSwipe binds its keyboard trap when the opening animation ends and
     * puts focus on its root at that moment. We move it on to Close after
     * that, so a keyboard fan is never parked on an unnamed container.
     */
    onOpeningEnd: () => focusClose(),
    onTogglePeace: () => viewer.toggleChrome(),
    onClose: () => {
      const reason = pendingReason || 'swipe-down'
      pendingReason = null
      viewer.dismiss(reason)
    },
  })
  return adapter
}

/**
 * Reduced motion is asked, not assumed. A parent may pass the preference in,
 * but the viewer checks for itself so a caller cannot accidentally animate a
 * fan who asked us not to. Reduced motion gets a clean dissolve with no
 * spatial movement — the adapter switches `showHideAnimationType` to `fade`.
 */
function isReduced() {
  return props.reduced || prefersReducedMotion()
}

async function openEngine() {
  if (typeof window === 'undefined') return
  measure()
  const list = props.photos
  if (!list.length) return
  await ensureAdapter().open(list, viewer.index.value, {
    reduced: isReduced(),
    trapFocus: true,
    /* This component owns Escape and focus-return — see the header. */
    escKey: false,
    returnFocus: false,
    /** Our own `.pswp` namespace, so two viewers cannot restyle each other. */
    surfaceClass: 'fq-cg',
    // Continuity: the photograph leaves and returns to its real frame.
    getThumbBounds: isReduced()
      ? undefined
      : (i) => {
        const el = props.resolveFrame?.(i)
        if (!el?.getBoundingClientRect) return undefined
        const rect = el.getBoundingClientRect()
        if (!(rect.width > 0)) return undefined
        return { x: rect.left, y: rect.top, w: rect.width }
      },
    initialZoomLevel: (level) => galleryInitialZoomLevel(level, { dpr: dpr() }),
    secondaryZoomLevel: (level) => gallerySecondaryZoomLevel(level, { dpr: dpr() }),
    maxZoomLevel: (level) => galleryMaxZoomLevel(level, { dpr: dpr() }),
  })
  focusClose()
}

/**
 * Focus lands on Close when the dialog opens. The engine traps focus inside
 * its root, so this is also where Tab starts; a keyboard fan arrives on the
 * way out rather than somewhere in the middle. `preventScroll` because the
 * overview behind is locked exactly where it was. Deferred a frame so it
 * lands after the engine's own root focus in the same event dispatch.
 */
function focusClose() {
  if (typeof window === 'undefined') return
  window.requestAnimationFrame(() => {
    if (!viewer.open.value) return
    const button = surface.value?.querySelector?.('[data-gallery-close]')
    if (button && typeof button.focus === 'function') button.focus({ preventScroll: true })
  })
}

function requestClose(reason) {
  pendingReason = reason
  viewer.sleepChrome()
  if (adapter) adapter.close()
  else viewer.dismiss(reason)
}

function onSheetSelect(index) {
  adapter?.goTo(index)
  viewer.closeSheet()
}

/**
 * One deliberate step, whether it came from an arrow key or the desktop step
 * control. The engine owns the index, so it also owns the bounds: its `step`
 * clamps, which is why neither caller has to re-check `canPrev`/`canNext`.
 * Without an engine (a photograph opened before PhotoSwipe resolved) the
 * state moves on its own rather than dropping the press.
 */
function step(direction) {
  if (!viewer.open.value) return
  if (adapter) {
    if (direction < 0) adapter.prev()
    else adapter.next()
    return
  }
  if (direction < 0) viewer.prev()
  else viewer.next()
}

function status(message) {
  shareStatus.value = message
  if (statusTimer) clearTimeout(statusTimer)
  statusTimer = window.setTimeout(() => { shareStatus.value = '' }, 2600)
}

/**
 * Share the photograph on screen, carrying its gallery context. Execution is
 * the canonical public helper: OS sheet, then clipboard. No second sheet.
 */
async function onShare() {
  const intents = viewer.shareIntents.value
  if (!intents?.default) return
  viewer.setShareOpen(true)
  try {
    const result = await runGalleryShare(intents.default, { origin: props.origin })
    if (result.method === 'copy') status('Link copied')
    emit('shared', { intent: intents.default, result })
  } catch (error) {
    if (error?.name !== 'AbortError') status('Could not share this photograph')
  } finally {
    viewer.setShareOpen(false)
  }
}

/* ---- keyboard: we own it, so Escape can respect the layers ---- */

function onKeydown(event) {
  if (!viewer.open.value) return
  const key = event.key

  if (key === 'Escape') {
    const intent = viewer.dismiss('escape')
    if (intent.closesViewer) requestClose('escape')
    event.preventDefault()
    return
  }
  // While the sheet is up it owns the arrows; the viewer index does not move.
  if (viewer.sheetOpen.value) return

  if (key === 'ArrowRight') {
    step(1)
    event.preventDefault()
    return
  }
  if (key === 'ArrowLeft') {
    step(-1)
    event.preventDefault()
    return
  }
  if (key === 'Home') {
    adapter?.goTo(0)
    event.preventDefault()
    return
  }
  if (key === 'End') {
    adapter?.goTo(viewer.count.value - 1)
    event.preventDefault()
    return
  }
  if (key.toLowerCase() === 'g') {
    viewer.toggleSheet()
    return
  }
  if (key === 'Tab') viewer.wakeChrome()
}

/**
 * A fan on a phone taps to bring the chrome back after clearing it. A desktop
 * has no equivalent gesture, and moving a mouse is the desktop way of asking
 * for controls, so it wakes the chrome.
 *
 * Guarded so it can never be mistaken for working the photograph: a held
 * button is a drag, a touch or pen belongs to the tap path, and a zoomed
 * photograph is being inspected rather than navigated.
 */
let lastWakeAt = 0
function onPointerMove(event) {
  if (!viewer.open.value) return
  if (event.pointerType && event.pointerType !== 'mouse') return
  if (event.buttons) return
  if (viewer.zoomed.value || viewer.sheetOpen.value) return
  const now = event.timeStamp || Date.now()
  if (now - lastWakeAt < 120) return
  lastWakeAt = now
  viewer.wakeChrome()
}

/*
 * Escape closes the viewer through `dismiss`, which flips `open` to false.
 * The engine is then told to close so the return flight still plays. Guarding
 * on `pendingReason` keeps that from looping back through `onClose`.
 */
watch(() => viewer.open.value, (isOpen, was) => {
  if (isOpen) {
    openEngine()
    return
  }
  if (was && adapter && !pendingReason) {
    // Closed by state (popstate/Back, or a parent). Bring the engine along.
    pendingReason = 'history-back'
    adapter.close()
    pendingReason = null
  }
})

watch(() => props.reduced, () => adapter?.refresh())

onMounted(() => {
  measure()
  window.addEventListener('resize', onResize, { passive: true })
  window.addEventListener('keydown', onKeydown)
  window.addEventListener('pointermove', onPointerMove, { passive: true })
  if (viewer.open.value) openEngine()
})

function onResize() {
  measure()
  adapter?.refresh()
}

onBeforeUnmount(() => {
  if (statusTimer) clearTimeout(statusTimer)
  window.removeEventListener('resize', onResize)
  window.removeEventListener('keydown', onKeydown)
  window.removeEventListener('pointermove', onPointerMove)
  adapter?.destroy()
  adapter = null
})

defineExpose({ requestClose })
</script>

<style scoped>
/*
 * The chrome layer sits inside PhotoSwipe's own root, above the photograph
 * and below nothing. It never intercepts a gesture: only `.hit` elements
 * inside the chrome take pointer events, and only while the chrome is awake.
 */
.stage {
  position: absolute;
  inset: 0;
  z-index: 10;
  pointer-events: none;
}

.stage :deep(.chrome),
.stage :deep(.sheet) {
  pointer-events: none;
}

.stage :deep(.sheet.is-up) {
  pointer-events: auto;
}

.stage__status {
  position: absolute;
  bottom: calc(64px + env(safe-area-inset-bottom));
  left: 50%;
  transform: translateX(-50%);
  margin: 0;
  padding: 7px 14px;
  border-radius: 999px;
  background: rgba(8, 10, 14, 0.86);
  color: rgba(247, 249, 252, 0.94);
  font-size: 12.5px;
  letter-spacing: 0.01em;
  white-space: nowrap;
}

.stage__live {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: 0;
  overflow: hidden;
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
}

@media (prefers-reduced-motion: reduce) {
  .stage__status {
    transition: none;
  }
}
</style>
