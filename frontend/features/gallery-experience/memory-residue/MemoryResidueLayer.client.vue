<template>
  <div ref="hostRef" class="fq-lg-residue-host" aria-hidden="true" :style="clipStyle" />
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { createMemoryResidueRenderer } from './createMemoryResidueRenderer'
import { isResiduePreset, residuePresetParams } from './memoryResiduePresets'

const props = defineProps({
  enabled: { type: Boolean, default: false },
  preset: { type: String, default: 'off' },
  params: { type: Object, default: null },
  reduced: { type: Boolean, default: false },
  clipStyle: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['backend'])

const hostRef = ref(null)
const renderer = createMemoryResidueRenderer()
let initPromise = null

function mergedParams() {
  const preset = residuePresetParams(props.preset) || {}
  return { ...preset, ...(props.params || {}) }
}

async function ensure() {
  if (props.reduced || !props.enabled || !isResiduePreset(props.preset)) return false
  if (renderer.isReady()) return true
  if (!hostRef.value) return false
  if (!initPromise) {
    initPromise = renderer.init(hostRef.value).then((result) => {
      emit('backend', {
        backend: result.backend,
        webgpu: result.webgpu,
        ready: result.ready,
      })
      if (!result.ready) initPromise = null
      return result
    })
  }
  const result = await initPromise
  return Boolean(result?.ready)
}

async function play({ image, rect, params } = {}) {
  if (props.reduced) return false
  const ok = await ensure()
  if (!ok) return false
  const next = { ...mergedParams(), ...(params || {}) }
  renderer.setParams(next)
  renderer.resize()
  renderer.capture(image, rect)
  return renderer.startDecay(next)
}

async function capture({ image, rect } = {}) {
  if (props.reduced) return false
  const ok = await ensure()
  if (!ok) return false
  renderer.setParams(mergedParams())
  renderer.resize()
  return renderer.capture(image, rect)
}

function startDecay(params) {
  if (props.reduced || !renderer.isReady()) return false
  return renderer.startDecay(params || mergedParams())
}

function sleep() {
  renderer.suspend()
}

function interrupt() {
  renderer.sleep()
}

onMounted(() => {
  if (props.enabled && isResiduePreset(props.preset) && !props.reduced) {
    ensure()
  }
})

watch(
  () => [props.enabled, props.preset, props.reduced],
  ([enabled, preset, reduced]) => {
    if (!enabled || reduced || !isResiduePreset(preset)) sleep()
  },
)

onBeforeUnmount(() => {
  renderer.destroy()
})

defineExpose({
  play,
  capture,
  startDecay,
  sleep,
  interrupt,
  resize: () => renderer.resize(),
  getBackend: () => renderer.getBackend(),
  isReady: () => renderer.isReady(),
  isActive: () => renderer.isActive(),
  hasWebGpu: () => renderer.hasWebGpu(),
})
</script>
