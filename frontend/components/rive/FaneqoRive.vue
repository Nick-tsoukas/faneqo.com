<template>
  <div
    ref="rootEl"
    class="faneqo-rive"
    :class="rootClass"
  >
    <canvas
      ref="canvasEl"
      class="faneqo-rive__canvas"
      role="img"
      :aria-label="ariaLabel"
    />
  </div>
</template>

<script setup>
/**
 * Official Rive WebGL2 wrapper for Faneqo.
 * Instantiates only on the client. GSAP still owns page choreography.
 */
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import { usePreferredReducedMotion } from '@vueuse/core'
import { loadRiveRuntime } from '~/utils/rive/loadRiveRuntime'
import { getCachedRiveFile } from '~/utils/rive/riveFileCache'
import { resolveAlignment, resolveFit } from '~/utils/rive/layout'
import {
  fireLegacyInput,
  fireViewTrigger,
  getViewModelInstance,
  listStateMachineInputs,
  listViewProperties,
  setViewBoolean,
  setViewNumber,
  setViewString,
} from '~/utils/rive/viewModel'

const props = defineProps({
  src: { type: String, required: true },
  artboard: { type: String, default: '' },
  stateMachine: { type: String, default: '' },
  autoplay: { type: Boolean, default: true },
  autoBind: { type: Boolean, default: true },
  fit: { type: String, default: 'contain' },
  alignment: { type: String, default: 'center' },
  cacheFile: { type: Boolean, default: true },
  pauseOffscreen: { type: Boolean, default: true },
  respectReducedMotion: { type: Boolean, default: true },
  ariaLabel: { type: String, default: 'Animated graphic' },
  rootClass: { type: [String, Object, Array], default: '' },
})

const emit = defineEmits([
  'load',
  'load-error',
  'play',
  'pause',
  'stop',
  'state-change',
  'rive-event',
])

const rootEl = ref(null)
const canvasEl = ref(null)
const rive = shallowRef(null)
const loaded = ref(false)
const reducedPref = usePreferredReducedMotion()

const reducedMotion = computed(() =>
  props.respectReducedMotion && reducedPref.value === 'reduce'
)

let resizeObserver = null
let intersectionObserver = null
let wasPlaying = false
let offscreenPaused = false
let destroyed = false

function shouldAutoplay() {
  return props.autoplay && !reducedMotion.value
}

function resizeSurface() {
  const instance = rive.value
  if (!instance || !loaded.value) return
  try {
    instance.resizeDrawingSurfaceToCanvas()
  } catch {
    // Instance may already be tearing down.
  }
}

function bindObservers() {
  const root = rootEl.value
  if (!root || typeof ResizeObserver === 'undefined') return

  resizeObserver = new ResizeObserver(() => {
    resizeSurface()
  })
  resizeObserver.observe(root)

  if (!props.pauseOffscreen || typeof IntersectionObserver === 'undefined') return

  intersectionObserver = new IntersectionObserver(
    (entries) => {
      const entry = entries[0]
      if (!entry || !rive.value || !loaded.value) return
      if (entry.isIntersecting) {
        if (offscreenPaused) {
          rive.value.startRendering?.()
          if (wasPlaying && !reducedMotion.value) rive.value.play()
          offscreenPaused = false
        }
        return
      }
      wasPlaying = !reducedMotion.value && props.autoplay
      try {
        rive.value.pause()
        rive.value.stopRendering?.()
      } catch {
        /* ignore */
      }
      offscreenPaused = true
    },
    { root: null, threshold: 0.01, rootMargin: '80px' }
  )
  intersectionObserver.observe(root)
}

function unbindObservers() {
  resizeObserver?.disconnect()
  resizeObserver = null
  intersectionObserver?.disconnect()
  intersectionObserver = null
}

async function createInstance() {
  const canvas = canvasEl.value
  if (!canvas || destroyed) return

  const runtime = await loadRiveRuntime()
  if (destroyed) return

  const { Rive, Layout, Fit, Alignment, EventType } = runtime
  const layout = new Layout({
    fit: resolveFit(Fit, props.fit),
    alignment: resolveAlignment(Alignment, props.alignment),
  })

  const source = {}
  if (props.cacheFile) {
    source.riveFile = await getCachedRiveFile(props.src)
  } else {
    source.src = props.src
  }
  if (destroyed) return

  const instance = new Rive({
    ...source,
    canvas,
    layout,
    artboard: props.artboard || undefined,
    stateMachines: props.stateMachine || undefined,
    autoplay: shouldAutoplay(),
    autoBind: props.autoBind,
    useOffscreenRenderer: true,
    isTouchScrollEnabled: true,
    onLoad: () => {
      if (destroyed) return
      loaded.value = true
      instance.resizeDrawingSurfaceToCanvas()
      if (reducedMotion.value) {
        instance.pause()
      }
      emit('load', instance)
    },
    onLoadError: (event) => {
      emit('load-error', event)
    },
    onPlay: (event) => emit('play', event),
    onPause: (event) => emit('pause', event),
    onStop: (event) => emit('stop', event),
    onStateChange: (event) => emit('state-change', event),
  })

  instance.on?.(EventType.RiveEvent, (event) => {
    emit('rive-event', event)
  })

  rive.value = instance
  bindObservers()
}

function destroyInstance() {
  unbindObservers()
  loaded.value = false
  const instance = rive.value
  rive.value = null
  if (!instance) return
  try {
    instance.cleanup()
  } catch {
    /* ignore */
  }
}

async function restart() {
  destroyInstance()
  await createInstance()
}

onMounted(() => {
  destroyed = false
  createInstance()
})

onBeforeUnmount(() => {
  destroyed = true
  destroyInstance()
})

watch(
  () => [props.src, props.artboard, props.stateMachine, props.fit, props.alignment],
  () => {
    if (!rive.value) return
    restart()
  }
)

function play() {
  if (reducedMotion.value) return
  rive.value?.play()
}

function pause() {
  rive.value?.pause()
}

function stop() {
  rive.value?.stop()
}

function setBoolean(path, value) {
  if (setViewBoolean(rive.value, path, value)) return true
  return fireLegacyInput(rive.value, props.stateMachine, path, !!value)
}

function setNumber(path, value) {
  if (setViewNumber(rive.value, path, value)) return true
  return fireLegacyInput(rive.value, props.stateMachine, path, Number(value))
}

function setString(path, value) {
  return setViewString(rive.value, path, value)
}

function fireTrigger(path) {
  if (fireViewTrigger(rive.value, path)) return true
  return fireLegacyInput(rive.value, props.stateMachine, path)
}

defineExpose({
  instance: rive,
  loaded,
  reducedMotion,
  play,
  pause,
  stop,
  resize: resizeSurface,
  restart,
  setBoolean,
  setNumber,
  setString,
  fireTrigger,
  getViewModel: () => getViewModelInstance(rive.value),
  listViewProperties: () => listViewProperties(rive.value),
  listStateMachineInputs: () => listStateMachineInputs(rive.value, props.stateMachine),
})
</script>

<style scoped>
.faneqo-rive {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: inherit;
}

.faneqo-rive__canvas {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
