<template>
  <aside
    v-if="visible"
    class="fq-lab-tune"
    :class="{ 'is-open': open }"
    aria-label="Development tuning"
  >
    <button type="button" class="fq-lab-tune__toggle" @click="open = !open">
      {{ open ? 'Hide tune' : 'Tune' }}
    </button>
    <div v-show="open" class="fq-lab-tune__body">
      <p class="fq-lab-tune__kicker">Lab only · not artist-facing</p>
      <p class="fq-lab-tune__label">Stage</p>
      <div class="fq-lab-tune__modes">
        <button
          v-for="mode in stageModes"
          :key="mode.id"
          type="button"
          :class="{ 'is-on': (tuning.stageMode || 'black') === mode.id }"
          @click="setStageMode(mode.id)"
        >
          {{ mode.label }}
        </button>
      </div>
      <label v-for="row in rows" :key="row.key">
        <span>{{ row.label }}</span>
        <input
          type="range"
          :min="row.min"
          :max="row.max"
          :step="row.step"
          :value="Number(tuning[row.key]) / row.scale"
          @input="onInput(row.key, $event.target.value, row.scale)"
        >
      </label>
    </div>
  </aside>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  tuning: { type: Object, required: true },
  visible: { type: Boolean, default: true },
})
const emit = defineEmits(['update:tuning'])
const open = ref(false)
const stageModes = [
  { id: 'black', label: 'Black' },
  { id: 'css', label: 'CSS Matte' },
  { id: 'gpu', label: 'GPU Stage' },
]

const rows = [
  { key: 'photoScaleBias', label: 'Photo scale bias', min: 78, max: 106, step: 1, scale: 0.01 },
  { key: 'imageSurround', label: 'Photo surround', min: 0, max: 48, step: 1, scale: 1 },
  { key: 'matteIntensity', label: 'Stage intensity', min: 0, max: 100, step: 1, scale: 0.01 },
  { key: 'lightSpread', label: 'Edge spill', min: 0, max: 100, step: 1, scale: 0.01 },
  { key: 'highlightIntensity', label: 'Highlight intensity', min: 0, max: 100, step: 1, scale: 0.01 },
  { key: 'highlightRadius', label: 'Highlight radius', min: 8, max: 90, step: 1, scale: 0.01 },
  { key: 'haze', label: 'Haze', min: 0, max: 100, step: 1, scale: 0.01 },
  { key: 'darkness', label: 'Black level', min: 0, max: 100, step: 1, scale: 0.01 },
  { key: 'spatialFidelity', label: 'Spatial fidelity', min: 0, max: 100, step: 1, scale: 0.01 },
  { key: 'transitionSoftness', label: 'Transition softness', min: 0, max: 100, step: 1, scale: 0.01 },
  { key: 'velocityResponse', label: 'Velocity response', min: 0, max: 100, step: 1, scale: 0.01 },
  { key: 'persistence', label: 'Persistence', min: 0, max: 100, step: 1, scale: 0.01 },
  { key: 'persistenceDecay', label: 'Persistence decay', min: 50, max: 98, step: 1, scale: 0.01 },
]

function setStageMode(stageMode) {
  emit('update:tuning', {
    ...props.tuning,
    stageMode,
  })
}

function onInput(key, raw, scale) {
  emit('update:tuning', {
    ...props.tuning,
    [key]: Number(raw) * scale,
  })
}
</script>

<style scoped>
.fq-lab-tune {
  position: fixed;
  top: max(0.45rem, env(safe-area-inset-top, 0px));
  right: max(0.55rem, env(safe-area-inset-right, 0px));
  z-index: 100060;
  width: min(18.5rem, calc(100vw - 1.4rem));
  font-family: Poppins, ui-sans-serif, system-ui, sans-serif;
  pointer-events: auto;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}
.fq-lab-tune__toggle {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  margin-left: auto;
  padding: 0 0.85rem;
  border: 1px solid rgba(247, 249, 252, 0.14);
  background: #0a0b0d;
  color: rgba(247, 249, 252, 0.62);
  font-size: 0.78rem;
  font-weight: 500;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.fq-lab-tune__body {
  margin-top: 0.45rem;
  padding: 0.85rem 0.9rem 0.95rem;
  border: 1px solid rgba(247, 249, 252, 0.12);
  background: #0a0b0d;
  max-height: min(72dvh, 34rem);
  overflow: auto;
}
.fq-lab-tune__kicker {
  margin: 0 0 0.7rem;
  font-size: 0.62rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(247, 249, 252, 0.38);
}
.fq-lab-tune__label {
  margin: 0 0 0.35rem;
  font-size: 0.72rem;
  color: rgba(247, 249, 252, 0.62);
}
.fq-lab-tune__modes {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 0.28rem;
  margin: 0 0 0.85rem;
}
.fq-lab-tune__modes button {
  min-height: 36px;
  padding: 0 0.2rem;
  border: 1px solid rgba(247, 249, 252, 0.14);
  background: transparent;
  color: rgba(247, 249, 252, 0.48);
  font-size: 0.62rem;
  font-weight: 500;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.fq-lab-tune__modes button.is-on {
  background: #f7f9fc;
  color: #090a0c;
  border-color: #f7f9fc;
}
.fq-lab-tune label {
  display: grid;
  gap: 0.28rem;
  margin: 0 0 0.7rem;
  color: rgba(247, 249, 252, 0.7);
  font-size: 0.78rem;
}
.fq-lab-tune label:last-child {
  margin-bottom: 0;
}
.fq-lab-tune input[type='range'] {
  width: 100%;
  accent-color: #f7f9fc;
}
</style>
