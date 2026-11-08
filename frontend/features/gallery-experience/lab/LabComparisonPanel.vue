<template>
  <aside v-if="visible" class="fq-gx-compare" :class="{ 'is-open': open }" aria-label="Living Gallery comparison">
    <button type="button" class="fq-gx-compare__toggle" @click="open = !open">
      {{ open ? 'Hide compare' : 'Compare' }}
    </button>
    <div v-show="open" class="fq-gx-compare__body">
    <p>Lab compare · not viewer chrome</p>
    <div class="fq-gx-compare__row">
      <button
        v-for="slot in slots"
        :key="slot.id"
        type="button"
        :class="{ 'is-on': compare.matrixSlot === slot.id, 'is-approx': !slot.exact }"
        @click="chooseSlot(slot)"
      >{{ slot.label }}</button>
    </div>
    <div class="fq-gx-compare__row">
      <button type="button" :class="{ 'is-on': compare.pureVariant === 'A' && !chromeActive }" @click="setPure('A')">Pure A</button>
      <button type="button" :class="{ 'is-on': compare.pureVariant === 'B' && !chromeActive }" @click="setPure('B')">Pure B</button>
      <button type="button" :class="{ 'is-on': compare.chromeVariant === 'direct' && chromeActive }" @click="setChrome('direct')">Direct</button>
      <button type="button" :class="{ 'is-on': compare.chromeVariant === 'hierarchical' && chromeActive }" @click="setChrome('hierarchical')">Hier</button>
    </div>
    <div class="fq-gx-compare__row">
      <button type="button" :class="{ 'is-on': compare.contextOn }" @click="set('contextOn', true)">Context on</button>
      <button type="button" :class="{ 'is-on': !compare.contextOn }" @click="set('contextOn', false)">Context off</button>
    </div>
    <div class="fq-gx-compare__row">
      <button type="button" :class="{ 'is-on': compare.galleryKind === 'show' }" @click="set('galleryKind', 'show')">Show</button>
      <button type="button" :class="{ 'is-on': compare.galleryKind === 'general' }" @click="set('galleryKind', 'general')">General</button>
      <button type="button" :class="{ 'is-on': compare.galleryKind === 'minimal' }" @click="set('galleryKind', 'minimal')">Minimal</button>
      <button type="button" :class="{ 'is-on': compare.gallerySize === 'one' }" @click="set('gallerySize', 'one')">1</button>
      <button type="button" :class="{ 'is-on': compare.gallerySize === 'two' }" @click="set('gallerySize', 'two')">2</button>
      <button type="button" :class="{ 'is-on': compare.gallerySize === 'set' }" @click="set('gallerySize', 'set')">8</button>
      <button type="button" :class="{ 'is-on': compare.gallerySize === 'large' }" @click="set('gallerySize', 'large')">24</button>
      <button type="button" :class="{ 'is-on': compare.gallerySize === 'hires' }" @click="set('gallerySize', 'hires')">Hi-res</button>
    </div>
    <div class="fq-gx-compare__row">
      <button type="button" :class="{ 'is-on': compare.sheetVariant === 'rail' }" @click="set('sheetVariant', 'rail')">Sheet A</button>
      <button type="button" :class="{ 'is-on': compare.sheetVariant === 'grid' }" @click="set('sheetVariant', 'grid')">Sheet B (deferred)</button>
      <button type="button" :class="{ 'is-on': compare.sheetAutoRecede }" @click="set('sheetAutoRecede', !compare.sheetAutoRecede)">Auto-recede</button>
      <button type="button" :class="{ 'is-on': compare.thumbGeometry === 'native' }" @click="set('thumbGeometry', 'native')">Native</button>
      <button type="button" :class="{ 'is-on': compare.thumbGeometry === 'cropped' }" @click="set('thumbGeometry', 'cropped')">Cropped</button>
    </div>
    <div class="fq-gx-compare__row">
      <button type="button" :class="{ 'is-on': compare.opticalMode === 'center' }" @click="setOptical('center')">Center</button>
      <button type="button" :class="{ 'is-on': compare.opticalMode === 'slight-high' }" @click="setOptical('slight-high')">Slight high</button>
      <button type="button" :class="{ 'is-on': compare.opticalMode === 'higher' }" @click="setOptical('higher')">Higher</button>
      <button type="button" :class="{ 'is-on': compare.opticalMode === 'custom' }" @click="setOptical('custom')">Custom</button>
      <button type="button" :class="{ 'is-on': compare.opticalMode === 'auto' }" @click="setOptical('auto')">Auto</button>
    </div>
    <div v-if="compare.opticalMode === 'custom'" class="fq-gx-compare__row">
      <label class="fq-gx-compare__offset">
        <span>Offset {{ Number(compare.opticalOffset).toFixed(2) }}</span>
        <input
          type="range"
          min="-16"
          max="22"
          step="1"
          :value="Math.round((Number(compare.opticalOffset) || 0) * 100)"
          @input="set('opticalOffset', Number($event.target.value) / 100)"
        >
      </label>
    </div>
    <p v-if="readout" class="fq-gx-compare__readout">{{ readout }}</p>
    <p v-if="compare.matrixNote" class="fq-gx-compare__note">{{ compare.matrixNote }}</p>
    <div class="fq-gx-compare__row">
      <button type="button" :class="{ 'is-on': compare.transition === 'print' }" @click="setTransition('print')">Print</button>
      <button type="button" :class="{ 'is-on': compare.transition === 'hold' }" @click="setTransition('hold')">Hold</button>
      <button type="button" :class="{ 'is-on': compare.transition === 'afterimage' }" @click="setTransition('afterimage')">Afterimage</button>
    </div>
    <div class="fq-gx-compare__row">
      <button type="button" :class="{ 'is-on': compare.residuePreset === 'off' }" @click="set('residuePreset', 'off')">Residue off</button>
      <button type="button" :class="{ 'is-on': compare.residuePreset === 'MR-A' }" @click="set('residuePreset', 'MR-A')">MR-A</button>
      <button type="button" :class="{ 'is-on': compare.residuePreset === 'MR-B' }" @click="set('residuePreset', 'MR-B')">MR-B</button>
      <button type="button" :class="{ 'is-on': compare.residuePreset === 'MR-C' }" @click="set('residuePreset', 'MR-C')">MR-C</button>
    </div>
    <div class="fq-gx-compare__row">
      <button type="button" @click="$emit('trigger-residue')">Trigger residue</button>
      <button type="button" @click="$emit('next-residue')">Next + residue</button>
      <label>
        <input type="checkbox" :checked="compare.residueOnNext" @change="set('residueOnNext', $event.target.checked)">
        On next
      </label>
      <label>
        <input type="checkbox" :checked="compare.idleHide" @change="set('idleHide', $event.target.checked)">
        Idle hide
      </label>
      <label>
        <input type="checkbox" :checked="compare.afterlight !== false" @change="set('afterlight', $event.target.checked)">
        Afterlight
      </label>
    </div>
    <div class="fq-gx-compare__row">
      <button type="button" :class="{ 'is-on': compare.afterlightStrength === 'A' }" @click="set('afterlightStrength', 'A')">AL A · V0</button>
      <button type="button" :class="{ 'is-on': compare.afterlightStrength === 'B' }" @click="set('afterlightStrength', 'B')">AL B · +25%</button>
      <button type="button" :class="{ 'is-on': compare.afterlightStrength === 'C' }" @click="set('afterlightStrength', 'C')">AL C · +50%</button>
    </div>
    <div v-if="compare.residuePreset !== 'off' && params" class="fq-gx-compare__params">
      <label v-for="row in sliders" :key="row.key">
        <span>{{ row.label }}</span>
        <input
          type="range"
          :min="row.min"
          :max="row.max"
          :step="row.step"
          :value="sliderValue(row)"
          @input="onParam(row, $event.target.value)"
        >
      </label>
    </div>
    </div>
  </aside>
</template>

<script setup>
import { computed, ref } from 'vue'
import { COMPOSITION_SLOTS } from '../fixtures/compositionMatrix'
import { residuePresetParams } from '../memory-residue/memoryResiduePresets'
import { resolveGalleryTransition } from '../living-gallery/livingGalleryTransition'

const open = ref(false)
const chromeActive = ref(false)

const props = defineProps({
  visible: { type: Boolean, default: false },
  compare: { type: Object, required: true },
  composition: { type: Object, default: null },
})

const emit = defineEmits(['update:compare', 'controls', 'pure', 'trigger-residue', 'next-residue', 'slot'])

const slots = COMPOSITION_SLOTS

const params = computed(() => {
  const preset = residuePresetParams(props.compare.residuePreset)
  if (!preset) return null
  return { ...preset, ...(props.compare.residueParams || {}) }
})

const readout = computed(() => {
  const row = props.composition
  if (!row?.viewport) return ''
  const ay = Number(row.opticalAy)
  const ayLabel = Number.isFinite(ay) ? ay.toFixed(2) : '—'
  return `${row.viewport} · ${row.aspectClass} · ${row.rule} · ${row.imageRect} · ay ${ayLabel}`
})

const sliders = [
  { key: 'decay', label: 'Decay', min: 70, max: 97, step: 1, scale: 0.01 },
  { key: 'persistence', label: 'Persistence', min: 10, max: 80, step: 1, scale: 0.01 },
  { key: 'lumaThreshold', label: 'Luma thresh', min: 4, max: 40, step: 1, scale: 0.01 },
  { key: 'edge', label: 'Edge', min: 0, max: 40, step: 1, scale: 0.01 },
  { key: 'colorRetention', label: 'Color', min: 0, max: 60, step: 1, scale: 0.01 },
  { key: 'desaturation', label: 'Desat', min: 0, max: 100, step: 1, scale: 0.01 },
  { key: 'displace', label: 'Displace', min: 0, max: 24, step: 1, scale: 0.001 },
  { key: 'noise', label: 'Noise', min: 0, max: 16, step: 1, scale: 0.01 },
  { key: 'durationMs', label: 'Duration', min: 400, max: 2400, step: 40, scale: 1 },
]

function sliderValue(row) {
  return (Number(params.value?.[row.key]) || 0) / row.scale
}

function set(key, value) {
  const next = { ...props.compare, [key]: value }
  if (key === 'residuePreset') next.residueParams = null
  emit('update:compare', next)
}

function setTransition(id) {
  const t = resolveGalleryTransition(id)
  emit('update:compare', {
    ...props.compare,
    transition: t.id,
    residuePreset: t.residue ? t.residuePreset : 'off',
    residueParams: null,
  })
}

function setPure(variant) {
  chromeActive.value = false
  emit('update:compare', { ...props.compare, pureVariant: variant })
  emit('pure')
}

function setChrome(variant) {
  chromeActive.value = true
  emit('update:compare', { ...props.compare, chromeVariant: variant })
  emit('controls')
}

function setOptical(mode) {
  emit('update:compare', {
    ...props.compare,
    opticalMode: mode,
    opticalOffset: mode === 'custom' ? (Number(props.compare.opticalOffset) || 0.06) : props.compare.opticalOffset,
  })
}

function chooseSlot(slot) {
  emit('update:compare', {
    ...props.compare,
    matrixSlot: slot.id,
    matrixNote: slot.note || '',
  })
  emit('slot', slot.id)
}

function onParam(row, raw) {
  const current = { ...(params.value || {}) }
  current[row.key] = Number(raw) * row.scale
  emit('update:compare', { ...props.compare, residueParams: current })
}
</script>

<style scoped>
.fq-gx-compare {
  position: fixed;
  left: 0;
  right: 0;
  top: auto;
  bottom: 0;
  z-index: 100061;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0.2rem 0.75rem calc(0.35rem + env(safe-area-inset-bottom, 0px));
  background: transparent;
  color: rgba(247, 249, 252, 0.55);
  font-family: Poppins, ui-sans-serif, system-ui, sans-serif;
  pointer-events: none;
}
.fq-gx-compare.is-open {
  align-items: stretch;
  background: #000;
}
.fq-gx-compare__toggle,
.fq-gx-compare__body {
  pointer-events: auto;
}
.fq-gx-compare__toggle {
  min-height: 36px;
  margin: 0;
  padding: 0 0.15rem;
  border: 0;
  background: transparent;
  color: rgba(247, 249, 252, 0.34);
  font-size: 0.68rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.fq-gx-compare p {
  margin: 0 0 0.35rem;
  font-size: 0.58rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(247, 249, 252, 0.28);
}
.fq-gx-compare__readout,
.fq-gx-compare__note {
  text-transform: none;
  letter-spacing: 0.02em;
  line-height: 1.35;
  color: rgba(247, 249, 252, 0.42);
}
.fq-gx-compare__note {
  color: rgba(247, 249, 252, 0.32);
}
.fq-gx-compare__row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem 0.7rem;
  align-items: center;
  margin-top: 0.2rem;
}
.fq-gx-compare button {
  min-height: 36px;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: rgba(247, 249, 252, 0.42);
  font-size: 0.72rem;
  font-weight: 500;
}
.fq-gx-compare button.is-on {
  color: #f7f9fc;
}
.fq-gx-compare button.is-approx {
  font-style: italic;
}
.fq-gx-compare label {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  min-height: 36px;
  font-size: 0.68rem;
  color: rgba(247, 249, 252, 0.38);
}
.fq-gx-compare__offset {
  flex: 1 1 12rem;
  flex-direction: column;
  align-items: stretch;
  gap: 0;
}
.fq-gx-compare__params {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.15rem 0.8rem;
  margin-top: 0.35rem;
}
.fq-gx-compare__params label {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0;
  min-height: 0;
}
.fq-gx-compare__params span,
.fq-gx-compare__offset span {
  font-size: 0.56rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.fq-gx-compare input[type='range'] {
  width: 100%;
}
</style>
