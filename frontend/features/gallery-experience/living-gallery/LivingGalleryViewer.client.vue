<template>
  <Teleport v-if="stageHost && stageOn" :to="stageHost">
    <PhotographicStage
      :mode="stageMode"
      :field="field"
      :rect="photoUv"
      :tuning="tuning"
      :opacity="atmosphere"
      :reduced="reduced"
      :velocity="progress.velocity || 0"
      @backend="onBackend"
    />
  </Teleport>
  <Teleport v-if="chromeHost" :to="chromeHost">
    <p class="fq-lg-live" aria-live="polite" aria-atomic="true">{{ liveStatus }}</p>
    <MemoryResidueLayer
      ref="residueRef"
      :enabled="residueEnabled"
      :preset="residuePresetId"
      :params="lab.residueParams"
      :reduced="reduced"
      :clip-style="residueClip"
      @backend="onResidueBackend"
    />
    <LivingGalleryChrome
      :chrome-on="chromeOn"
      :pure-variant="lab.pureVariant"
      :index="progress.index"
      :total="memories.length"
      :device="composition.device"
      :orientation="composition.orientation"
      :reduced="reduced"
      :photo-rect="composition.imageRect"
      :viewport-height="viewH"
      @close="closeFromChrome"
      @pin="pinChrome"
      @unpin="unpinChrome"
    />
    <LivingGalleryStageIdentity
      :night="night"
      :memory="activeMemory"
      :region="editorial.stageIdentityRegion"
      :density="editorial.contextDensity"
      :style-vars="stageIdentityStyle"
      :settled="arriveSettled"
      :dense="editorial.contextDensity === 'rich'"
      :index="progress.index"
      :total="memories.length"
      :device="composition.device"
    />
    <LivingGalleryDock
      :class="`fq-lg-dock--${composition.device}`"
      :style="stageIdentityStyle"
      :chrome-on="chromeOn"
      :photos-on="photosOn"
      :info-on="engine.infoOn"
      :items="engine.thumbnails"
      :night="night"
      :memory="activeMemory"
      :share-status="shareStatus"
      :reduced="reduced"
      :info-max-height="infoMaxHeight"
      :index="progress.index"
      :total="memories.length"
      :show-plate="editorial.showPlate"
      :plate-dense="editorial.plateDense"
      :rail-resident="editorial.railResident"
      @photos="onTogglePhotos"
      @info="onToggleInfo"
      @share="onShare"
      @select="onSelectThumbnail"
      @keydown="onThumbnailKey"
      @pin="pinChrome"
      @unpin="unpinChrome"
    />
  </Teleport>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { usePreferredReducedMotion } from '@vueuse/core'
import { lockOverlayScroll, unlockOverlayScroll } from '~/utils/ui/overlayScrollLock'
import { createLivingGalleryAdapter } from './LivingGalleryAdapter'
import { createLivingGalleryHistory } from './livingGalleryHistory'
import { createLivingGalleryController } from './livingGalleryController'
import {
  hideContinuityElement,
  resolveThumbBounds,
  resolveThumbElement,
  restoreContinuityElements,
} from './livingGallerySource'
import { CHROME_IDLE_MS } from './livingGalleryChrome'
import LivingGalleryChrome from './LivingGalleryChrome.vue'
import LivingGalleryDock from './LivingGalleryDock.vue'
import LivingGalleryStageIdentity from './LivingGalleryStageIdentity.vue'
import MemoryResidueLayer from '../memory-residue/MemoryResidueLayer.client.vue'
import { lightFieldAtProgress } from '../core/lightField'
import {
  AFTERLIGHT_DEFAULT_STRENGTH,
  resolveAfterlightStyle,
} from './livingGalleryAfterlight'
import {
  editorialStageStyle,
  resolveEditorialStage,
} from './livingGalleryEditorialStage'
import { isResiduePreset, residuePresetParams } from '../memory-residue/memoryResiduePresets'
import {
  RESIDUE_INTENT_CLOSE,
  RESIDUE_INTENT_NEXT,
  RESIDUE_INTENT_OPEN,
  resolveResidueBudget,
  scaleResidueParams,
} from '../memory-residue/memoryResidueBudget'
import { resolveGalleryTransition } from './livingGalleryTransition'
import {
  photoRectToUv,
  readSafeInsets,
  resolvePhotoComposition,
} from '../core/photoComposition'
import { STAGE_MODE_BLACK } from '../core/presentationState'
import { analyzeMemoryLightField, peekLightField, seedLightField } from '../stage/analyzeLightField'
import PhotographicStage from '../stage/PhotographicStage.client.vue'
import 'photoswipe/style.css'
import './livingGallery.css'

const props = defineProps({
  open: { type: Boolean, default: false },
  memories: { type: Array, default: () => [] },
  index: { type: Number, default: 0 },
  tuning: { type: Object, default: () => ({}) },
  night: { type: Object, default: () => ({}) },
  source: { type: Object, default: null },
  lab: { type: Object, default: () => ({ pureVariant: 'A', residuePreset: 'off', transition: 'print' }) },
})

const emit = defineEmits(['close', 'change', 'progress', 'metrics', 'chrome', 'event'])

const reducedMotion = usePreferredReducedMotion()
const reduced = computed(() => reducedMotion.value === 'reduce')
const stageHost = ref(null)
const chromeHost = ref(null)
const residueRef = ref(null)
const shareStatus = ref('')
const residueBackend = ref('none')
const chromePinned = ref(false)
const arriveSettled = ref(false)
let idleTimer = 0
let shareTimer = 0
let arriveTimer = 0
const atmosphere = ref(1)
const backend = ref('black')
const viewW = ref(typeof window !== 'undefined' ? window.innerWidth : 390)
const viewH = ref(typeof window !== 'undefined' ? window.innerHeight : 844)
const safe = ref({ top: 0, right: 0, bottom: 0, left: 0 })
const fieldsTick = ref(0)
const engineTick = ref(0)
const progress = ref({
  index: 0,
  from: 0,
  to: 0,
  t: 0,
  indexFloat: 0,
  shift: 0,
  velocity: 0,
  shifted: false,
})

let adapter
let residueArmed = false
let lastResidueNavAt = 0
const history = createLivingGalleryHistory({
  onPopClose() {
    adapter?.close()
  },
})
const controller = createLivingGalleryController({
  history,
  env: {
    reducedMotion: reduced.value,
  },
  onEvent(name, payload) {
    emit('event', { name, payload })
  },
})
controller.subscribe(() => {
  engineTick.value += 1
})
const engine = computed(() => {
  engineTick.value
  return controller.getState()
})
const liveStatus = computed(() => engine.value.liveStatus || '')
const chromeOn = computed(() => engine.value.chromeOn)
const photosOn = computed(() => (
  chromeOn.value && engine.value.thumbnailsOn && props.memories.length > 1
))
const afterlightEnabled = computed(() => props.lab?.afterlight !== false)
const afterlightStrength = computed(() => (
  props.lab?.afterlightStrength || AFTERLIGHT_DEFAULT_STRENGTH
))
const transition = computed(() => resolveGalleryTransition(props.lab?.transition))
const residuePresetId = computed(() => {
  if (isResiduePreset(props.lab?.residuePreset)) return props.lab.residuePreset
  return transition.value.residue ? transition.value.residuePreset : 'off'
})
const residueEnabled = computed(() => (
  !reduced.value && (transition.value.residue || isResiduePreset(residuePresetId.value))
))

const stageMode = computed(() => props.tuning?.stageMode || STAGE_MODE_BLACK)
const stageOn = computed(() => stageMode.value === 'gpu' || stageMode.value === 'css')

const fields = computed(() => {
  fieldsTick.value
  return props.memories.map((memory) => peekLightField(memory))
})

const field = computed(() => lightFieldAtProgress(fields.value, progress.value, {
  reduced: reduced.value,
  softness: props.tuning?.transitionSoftness,
}))

const activeMemory = computed(() => props.memories[progress.value.index] || props.memories[0])

/**
 * Whether an editorial column is *allowed*, not whether one appears. Each
 * photograph earns its own column inside the resolver, so PhotoSwipe and the
 * chrome derive identical geometry from the same item. A gallery-wide flag
 * cannot describe a mixed gallery and previously let the two disagree.
 * Deliberately independent of chrome visibility — if this flipped on tap the
 * photograph would resize under the finger.
 */
const editorialBias = computed(() => (props.lab?.contextOn === false ? false : null))

const composition = computed(() => resolvePhotoComposition({
  viewportWidth: viewW.value,
  viewportHeight: viewH.value,
  imageWidth: activeMemory.value?.width,
  imageHeight: activeMemory.value?.height,
  safeTop: safe.value.top,
  safeRight: safe.value.right,
  safeBottom: safe.value.bottom,
  safeLeft: safe.value.left,
  scaleBias: props.tuning?.photoScaleBias,
  surroundExtra: props.tuning?.imageSurround,
  chromeOn: false,
  opticalMode: props.lab?.opticalMode,
  opticalOffset: props.lab?.opticalOffset,
  editorialBias: editorialBias.value,
  hasSheet: props.memories.length > 1,
}))

const editorial = computed(() => resolveEditorialStage(composition.value, {
  contextOn: props.lab?.contextOn !== false && chromeOn.value,
  chromeOn: chromeOn.value,
  overlaysBusy: photosOn.value || engine.value.infoOn,
}))

const stageIdentityStyle = computed(() => editorialStageStyle(composition.value, editorial.value))

/**
 * Info takes the shelf the plate and contact sheet were using. Where the shelf
 * is tight it may encroach on the print's lower edge — the shelf backing keeps
 * type readable — but it must always hold the editorial block without
 * scrolling on the tightest gate (2:3 portrait).
 */
const infoMaxHeight = computed(() => {
  const shelf = Math.max(0, Number(composition.value.bottomBreath) || 0)
  const bar = Number(composition.value.shelf?.bar) || 56
  return Math.min(340, Math.max(150, shelf - bar - 10))
})

const afterlightStyle = computed(() => resolveAfterlightStyle(
  field.value,
  composition.value.imageRect,
  { width: viewW.value, height: viewH.value },
  {
    enabled: afterlightEnabled.value,
    reduced: reduced.value,
    strength: afterlightStrength.value,
  },
))

watch(afterlightStyle, (style) => {
  const root = chromeHost.value
  if (!root?.style || !style) return
  Object.entries(style).forEach(([key, value]) => {
    root.style.setProperty(key, value)
  })
}, { immediate: true })

watch(chromeHost, (host) => {
  if (!host?.style) return
  Object.entries(afterlightStyle.value || {}).forEach(([key, value]) => {
    host.style.setProperty(key, value)
  })
})

watch([chromeHost, arriveSettled], ([host, settled]) => {
  if (!host?.classList) return
  host.classList.toggle('is-arriving', Boolean(settled))
  host.classList.toggle('is-settled', Boolean(settled))
})

function triggerArrival() {
  if (arriveTimer) {
    clearTimeout(arriveTimer)
    arriveTimer = 0
  }
  arriveSettled.value = false
  const delay = reduced.value ? 40 : 90
  arriveTimer = window.setTimeout(() => {
    arriveSettled.value = true
    arriveTimer = window.setTimeout(() => {
      arriveTimer = 0
    }, reduced.value ? 80 : 180)
  }, delay)
}

const residueClip = computed(() => {
  const r = composition.value.imageRect
  if (!r) return {}
  return {
    clipPath: `inset(${Math.round(r.y)}px ${Math.round(viewW.value - r.x - r.w)}px ${Math.round(viewH.value - r.y - r.h)}px ${Math.round(r.x)}px)`,
  }
})

const photoUv = computed(() => photoRectToUv(
  composition.value.imageRect,
  viewW.value,
  viewH.value,
  progress.value.shift || 0,
))

function photoUvRect() {
  return photoRectToUv(composition.value.imageRect, viewW.value, viewH.value)
}

async function warmFields(index) {
  const list = props.memories
  const targets = [list[index], list[index - 1], list[index + 1]].filter(Boolean)
  // Always seed stage palette for Afterlight. Image analysis only when Stage is on.
  targets.forEach((memory) => seedLightField(memory))
  fieldsTick.value += 1
  if (!stageOn.value) return
  await Promise.all(targets.map(async (memory) => {
    await analyzeMemoryLightField(memory)
    fieldsTick.value += 1
  }))
}

function rendererLabel(value) {
  if (!stageOn.value) return 'BLACK'
  if (value === 'webgl2') return 'GPU/WebGL2'
  if (value === 'webgl') return 'GPU/WebGL'
  if (stageMode.value === 'css') return 'DOM/CSS'
  return 'BLACK'
}

function emitMetrics(extra = {}) {
  const snap = controller.getState()
  emit('metrics', {
    slide: progress.value.index,
    progress: progress.value,
    renderer: rendererLabel(backend.value),
    open: snap.open,
    zoom: snap.zoom,
    decodedCount: snap.decodedCount,
    fullscreen: snap.isFullscreen,
    thumbnails: snap.thumbnailsOn,
    chrome: snap.chromeOn,
    info: snap.infoOn,
    residue: residueBackend.value,
    composition: {
      viewport: composition.value.viewportLabel,
      aspectClass: composition.value.aspectClass,
      aspectRatio: composition.value.aspectRatio,
      rule: composition.value.rule,
      stageFamily: composition.value.stageFamily,
      opticalMode: composition.value.opticalMode,
      opticalAy: composition.value.opticalAy,
      imageRect: composition.value.imageRectLabel,
      orientation: composition.value.orientation,
      leftoverBelow: composition.value.bottomBreath,
      stageAlignment: editorial.value.stageAlignment,
      contextPlacement: editorial.value.contextPlacement,
    },
    ...extra,
  })
}

function onBackend(value) {
  backend.value = value
  emitMetrics({ renderer: rendererLabel(value) })
}

function syncComposition() {
  adapter.setComposition({
    surround: props.tuning?.imageSurround,
    scaleBias: props.tuning?.photoScaleBias,
    safe: safe.value,
    chromeOn: false,
    opticalMode: props.lab?.opticalMode,
    opticalOffset: props.lab?.opticalOffset,
    stageMode: stageMode.value,
    editorialBias: editorialBias.value,
  })
}

adapter = createLivingGalleryAdapter({
  onStageHost(host, root) {
    stageHost.value = host
    chromeHost.value = root || host?.parentElement || null
  },
  onOpen(index) {
    lockOverlayScroll('living-gallery')
    if (typeof document !== 'undefined') document.documentElement.classList.add('fq-gx-hide-devtools')
    progress.value = {
      index, from: index, to: index, t: 0, indexFloat: index, shift: 0, velocity: 0, shifted: false,
    }
    controller.setMemories(props.memories, props.night)
    controller.handleOpened(index, { source: props.source })
    hideContinuityElement(resolveThumbElement(index, props.memories, {
      ...controller.getState().source,
      ...(props.source || {}),
    }, document))
    emit('change', index)
    emitMetrics()
    warmFields(index)
    armIdleHide()
    triggerArrival()
  },
  onChange(index) {
    settleResidueOnChange()
    controller.handleIndexChanged(index)
    emit('change', index)
    emit('chrome', controller.getState().chromeOn)
    warmFields(index)
    triggerArrival()
  },
  onProgress(next) {
    progress.value = next
    armResidueFromProgress(next)
    emit('progress', next)
    emitMetrics()
  },
  onAtmosphereOpacity(value) {
    atmosphere.value = value
  },
  onToggleChrome() {
    if (controller.getState().chromeOn) controller.hideOverlays()
    else controller.showChrome()
    emit('chrome', controller.getState().chromeOn)
  },
  onZoom() {
    controller.handleZoomChanged()
    emitMetrics()
    if (controller.getState().chromeOn) armIdleHide()
  },
  onDecoded(counts) {
    controller.handleDecoded(counts?.decoded)
    emitMetrics()
  },
  onOpeningStart(index) {
    hideContinuityElement(resolveThumbElement(index, props.memories, {
      ...controller.getState().source,
      ...(props.source || {}),
    }, document))
  },
  onOpeningEnd() {
    if (transition.value.residue) playResidue({ intent: RESIDUE_INTENT_OPEN, force: true })
    triggerArrival()
  },
  onClosingStart(index) {
    hideContinuityElement(resolveThumbElement(index, props.memories, {
      ...controller.getState().source,
      ...(props.source || {}),
    }, document))
  },
  onClosingEnd() {
    restoreContinuityElements()
  },
  onClose(index) {
    clearIdle()
    if (arriveTimer) {
      clearTimeout(arriveTimer)
      arriveTimer = 0
    }
    arriveSettled.value = false
    residueRef.value?.sleep?.()
    controller.handleClosed(index)
    unlockOverlayScroll('living-gallery')
    if (typeof document !== 'undefined') document.documentElement.classList.remove('fq-gx-hide-devtools')
    stageHost.value = null
    chromeHost.value = null
    emit('close', index)
  },
})
controller.bindAdapter(adapter)

const rawNext = adapter.next
adapter.next = () => {
  if (props.lab?.residueOnNext && residueEnabled.value) {
    playResidue({ intent: RESIDUE_INTENT_NEXT, force: true }).finally(() => rawNext())
    return
  }
  rawNext()
}

function closeFromChrome() {
  playResidue({ intent: RESIDUE_INTENT_CLOSE })
  controller.close()
}

function clearIdle() {
  if (idleTimer) {
    clearTimeout(idleTimer)
    idleTimer = 0
  }
}

function armIdleHide() {
  clearIdle()
  // Lab-only inspection escape hatch. Production never passes idleHide.
  if (props.lab?.idleHide === false) return
  /*
   * Chrome only needs to get out of the way when it is in the way. Where the
   * composition reserved a shelf, the controls sit outside the photograph and
   * the reserve is part of the layout — fading them left a two-hundred pixel
   * band of unexplained black under the print a few seconds after every open.
   * A deliberate tap still clears the screen; time alone no longer does.
   */
  if (composition.value.shelfHeight > 0) return
  const snap = controller.getState()
  if (chromePinned.value || snap.infoOn || snap.thumbnailsOn) return
  if (snap.zoom?.isZoomed) return
  idleTimer = window.setTimeout(() => {
    const now = controller.getState()
    if (chromePinned.value || now.infoOn || now.thumbnailsOn) return
    if (now.zoom?.isZoomed) return
    controller.hideOverlays()
  }, CHROME_IDLE_MS)
}

function pinChrome() {
  chromePinned.value = true
  clearIdle()
  if (!controller.getState().chromeOn) controller.showChrome()
}

function unpinChrome() {
  chromePinned.value = false
  if (controller.getState().chromeOn) armIdleHide()
}

function onToggleInfo() {
  if (controller.getState().infoOn) {
    controller.hideInfo()
  } else {
    controller.closeThumbnails()
    controller.showInfo()
    controller.showChrome()
    clearIdle()
  }
  if (controller.getState().infoOn) clearIdle()
  else armIdleHide()
}

function onTogglePhotos() {
  if (controller.getState().thumbnailsOn) {
    controller.closeThumbnails()
    armIdleHide()
    return
  }
  controller.hideInfo()
  controller.openThumbnails()
  controller.showChrome()
  clearIdle()
}

function residueBudget(intent, force = false) {
  if (force) {
    return { play: !reduced.value && residueEnabled.value, scale: 1, reason: 'lab-force' }
  }
  const now = typeof performance !== 'undefined' ? performance.now() : Date.now()
  const intervalMs = lastResidueNavAt ? now - lastResidueNavAt : 9999
  return resolveResidueBudget({
    velocity: progress.value.velocity,
    intervalMs,
    reduced: reduced.value,
    enabled: residueEnabled.value,
    intent,
  })
}

function armResidueFromProgress(next) {
  if (!residueEnabled.value || reduced.value) return
  if (next?.shifted && !residueArmed) {
    if (residueRef.value?.isActive?.()) residueRef.value.interrupt()
    residueRef.value?.capture?.({
      image: adapter.getImageElement?.(),
      rect: photoUvRect(),
    })
    residueArmed = true
  }
}

function settleResidueOnChange() {
  const now = typeof performance !== 'undefined' ? performance.now() : Date.now()
  if (!residueArmed) {
    lastResidueNavAt = now
    return
  }
  const budget = residueBudget(RESIDUE_INTENT_NEXT)
  lastResidueNavAt = now
  residueArmed = false
  if (!budget.play) {
    residueRef.value?.interrupt?.()
    return
  }
  const params = scaleResidueParams(residuePresetParams(residuePresetId.value) || {}, budget.scale)
  residueRef.value?.startDecay?.(params)
}

async function playResidue({ intent = RESIDUE_INTENT_NEXT, force = false } = {}) {
  if (reduced.value || !residueEnabled.value) return false
  const budget = residueBudget(intent, force)
  if (!budget.play) {
    residueRef.value?.interrupt?.()
    return false
  }
  const image = adapter.getImageElement?.()
  const params = scaleResidueParams(residuePresetParams(residuePresetId.value) || {}, budget.scale)
  return residueRef.value?.play({
    image,
    rect: photoUvRect(),
    params,
  })
}

async function nextWithResidue() {
  await playResidue()
  rawNext()
}

function showControls() {
  controller.showChrome()
}

async function onShare() {
  const result = await controller.shareCurrentPhoto()
  shareStatus.value = result?.method === 'clipboard' ? 'copied' : (result?.ok ? 'shared' : '')
  if (shareTimer) clearTimeout(shareTimer)
  shareTimer = window.setTimeout(() => { shareStatus.value = '' }, 1600)
}

function onResidueBackend(payload) {
  residueBackend.value = payload?.ready ? payload.backend : 'none'
  emitMetrics({ residue: residueBackend.value, webgpu: payload?.webgpu })
}

function onSelectThumbnail(indexOrSource) {
  if (residueEnabled.value && !reduced.value) {
    residueRef.value?.interrupt?.()
    residueRef.value?.capture?.({
      image: adapter.getImageElement?.(),
      rect: photoUvRect(),
    })
    residueArmed = true
  }
  controller.selectThumbnail(indexOrSource)
  armIdleHide()
}

function onThumbnailKey(event) {
  controller.handleKeydown(event, 'thumbnails')
}

watch(
  () => [
    props.tuning?.imageSurround,
    props.tuning?.photoScaleBias,
    stageMode.value,
    props.lab?.opticalMode,
    props.lab?.opticalOffset,
    // Navigating landscape → portrait changes whether a column is reserved.
    editorialBias.value,
  ],
  () => {
    if (!props.open) return
    syncComposition()
    emitMetrics()
  },
)

watch(chromeOn, (on) => {
  if (on) armIdleHide()
  else clearIdle()
})

watch(
  () => [props.memories, props.night],
  () => {
    controller.setMemories(props.memories, props.night)
  },
  { immediate: true },
)

function getThumbBounds(index) {
  return resolveThumbBounds(index, props.memories, {
    ...controller.getState().source,
    ...(props.source || {}),
  }, document)
}

function measureView() {
  viewW.value = window.innerWidth
  viewH.value = window.innerHeight
  safe.value = readSafeInsets(document)
  if (props.open) {
    syncComposition()
    residueRef.value?.resize?.()
  }
}

watch(
  () => props.open,
  async (open) => {
    if (!open) {
      adapter.close()
      return
    }
    measureView()
    backend.value = stageOn.value ? 'css' : 'black'
    await adapter.open(props.memories, props.index, {
      reduced: reduced.value,
      surround: props.tuning?.imageSurround,
      scaleBias: props.tuning?.photoScaleBias,
      safe: safe.value,
      chromeOn: false,
      opticalMode: props.lab?.opticalMode,
      opticalOffset: props.lab?.opticalOffset,
      stageMode: stageMode.value,
      editorialBias: editorialBias.value,
      trapFocus: false,
      getThumbBounds,
      showHide: transition.value.showHide,
      openMs: transition.value.openMs,
      closeMs: transition.value.closeMs,
    })
  },
  { immediate: true },
)

watch(() => props.index, (index) => {
  if (!props.open) return
  if (adapter.getIndex() !== index) adapter.goTo(index)
})

onMounted(() => {
  measureView()
  history.attach()
  window.addEventListener('resize', measureView)
})

onBeforeUnmount(() => {
  clearIdle()
  if (arriveTimer) clearTimeout(arriveTimer)
  if (shareTimer) clearTimeout(shareTimer)
  window.removeEventListener('resize', measureView)
  history.detach()
  restoreContinuityElements()
  controller.destroy()
  adapter.destroy()
  unlockOverlayScroll('living-gallery')
})

defineExpose({
  adapter,
  controller,
  playResidue,
  nextWithResidue,
  showControls,
})
</script>
