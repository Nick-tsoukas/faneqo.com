<template>
  <div v-if="mode !== 'black'" class="fq-stage" aria-hidden="true">
    <div ref="gpuHost" class="fq-stage__gpu-host" :class="{ 'is-live': backend !== 'css' }" />
    <MatteStage
      v-if="backend === 'css'"
      :field="cssField"
      :tuning="tuning"
      :opacity="opacity"
      :reduced="reduced"
    />
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { interpolateLightField, lightFieldToStage } from '../core/lightField'
import { DEFAULT_STAGE_TUNING } from '../core/presentationState'
import MatteStage from './MatteStage.vue'
import { createStageRenderer } from './stageRenderer'

const props = defineProps({
  mode: { type: String, default: 'gpu' },
  field: { type: Object, default: null },
  rect: { type: Object, default: null },
  tuning: { type: Object, default: () => ({ ...DEFAULT_STAGE_TUNING }) },
  opacity: { type: Number, default: 1 },
  reduced: { type: Boolean, default: false },
  velocity: { type: Number, default: 0 },
})

const emit = defineEmits(['backend'])

const gpuHost = ref(null)
const backend = ref('css')
let stage = null
let ready = false
let raf = 0
let displayed = null
let persist = { x: 0.5, y: 0.4, hex: '#000000', energy: 0 }
let lastHighlight = { x: 0.5, y: 0.4, hex: '#000000', L: 0 }
let onResize = null
let resizeObserver = null

const cssField = computed(() => lightFieldToStage(displayed || props.field))

function followRate() {
  if (props.reduced) return 1
  const response = Number(props.tuning?.velocityResponse)
  const r = Number.isFinite(response) ? response : DEFAULT_STAGE_TUNING.velocityResponse
  const speed = Math.abs(Number(props.velocity) || 0)
  return 0.28 + 0.72 / (1 + speed * r * 3.4)
}

function tick() {
  raf = 0
  const target = props.field
  if (!displayed) displayed = target
  else if (target) displayed = interpolateLightField(displayed, target, followRate(), 0.12)

  const persistAmt = Number(props.tuning?.persistence)
  const persistDecay = Number(props.tuning?.persistenceDecay)
  const amount = Number.isFinite(persistAmt) ? persistAmt : DEFAULT_STAGE_TUNING.persistence
  const decay = Number.isFinite(persistDecay) ? persistDecay : DEFAULT_STAGE_TUNING.persistenceDecay
  const speed = Math.abs(Number(props.velocity) || 0)
  const nextL = Number(target?.highlight?.L) || 0
  if (!props.reduced && speed > 1.15 && lastHighlight.L > nextL + 0.08 && lastHighlight.L > 0.42) {
    persist = {
      x: lastHighlight.x,
      y: lastHighlight.y,
      hex: lastHighlight.hex,
      energy: Math.min(0.55, amount * lastHighlight.L),
    }
  } else {
    persist = { ...persist, energy: persist.energy * (props.reduced ? 0 : decay) }
  }
  if (target?.highlight) {
    lastHighlight = {
      x: target.highlight.x,
      y: target.highlight.y,
      hex: target.highlight.hex,
      L: nextL,
    }
  }

  const payload = {
    field: displayed,
    rect: props.rect,
    persist,
    tuning: props.tuning,
    opacity: props.opacity,
  }
  stage?.setProgress(payload)
  stage?.render()

  const catching = Math.abs((displayed?.energy || 0) - (target?.energy || 0)) > 0.003
  if (ready && (speed > 0.02 || persist.energy > 0.008 || catching)) {
    raf = requestAnimationFrame(tick)
  }
}

function start() {
  if (raf || !ready) return
  raf = requestAnimationFrame(tick)
}

onMounted(async () => {
  if (props.mode !== 'gpu') {
    backend.value = 'css'
    emit('backend', 'css')
    return
  }
  stage = createStageRenderer()
  try {
    await stage.init(gpuHost.value)
  } catch {
    ready = false
  }
  displayed = props.field
  ready = stage.isReady()
  if (ready) {
    backend.value = stage.getBackend()
    emit('backend', backend.value)
    onResize = () => {
      stage.resize()
      start()
    }
    window.addEventListener('resize', onResize)
    resizeObserver = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(onResize)
      : null
    resizeObserver?.observe(gpuHost.value)
    stage.resize()
    stage.setProgress({
      field: displayed,
      rect: props.rect,
      persist,
      tuning: props.tuning,
      opacity: props.opacity,
    })
    stage.render()
    start()
  } else {
    backend.value = 'css'
    emit('backend', 'css')
  }
})

watch(() => [props.field, props.rect, props.velocity, props.opacity, props.tuning], () => {
  if (ready) start()
}, { deep: true })

onBeforeUnmount(() => {
  if (raf) cancelAnimationFrame(raf)
  if (onResize) window.removeEventListener('resize', onResize)
  resizeObserver?.disconnect()
  stage?.destroy()
  stage = null
  ready = false
})
</script>

<style scoped>
.fq-stage {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: #000;
}
.fq-stage__gpu-host {
  position: absolute;
  inset: 0;
  opacity: 0;
}
.fq-stage__gpu-host.is-live {
  opacity: 1;
}
.fq-stage__gpu-host :deep(.fq-stage__gpu) {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
