<template>
  <!--
    LOCAL-ONLY evaluation panel for the artist hero experiment.
    Dev + ?heroExperiment=1 only. Never rendered on the public path.
    These controls are for evaluation, not proposed artist-facing choices.
  -->
  <aside class="fq-hx" aria-label="Hero experiment controls (local only)">
    <button
      type="button"
      class="fq-hx__toggle"
      :aria-expanded="open ? 'true' : 'false'"
      aria-controls="fq-hx-body"
      @click="open = !open"
    >
      <span class="fq-hx__dot" aria-hidden="true" />
      Hero experiment
      <span class="fq-hx__badge">{{ modeLabel }}</span>
      <svg class="fq-hx__chev" :class="{ 'is-open': open }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 9l6 6 6-6" />
      </svg>
    </button>

    <div v-show="open" id="fq-hx-body" class="fq-hx__body">
      <fieldset class="fq-hx__group">
        <legend class="fq-hx__legend">Comparison</legend>
        <div class="fq-hx__radios" role="radiogroup" aria-label="Hero comparison">
          <label v-for="option in modeOptions" :key="option.value" class="fq-hx__radio">
            <input
              type="radio"
              name="fq-hx-mode"
              :value="option.value"
              :checked="mode === option.value"
              @change="$emit('update:mode', option.value)"
            />
            <span>{{ option.label }}</span>
          </label>
        </div>
      </fieldset>

      <p class="fq-hx__meta">
        Source {{ imageWidth || '?' }}&times;{{ imageHeight || '?' }}
        · ratio {{ sourceRatio ? sourceRatio.toFixed(3) : 'unknown' }}
        <template v-if="mode === 'adaptive'"> · {{ adaptivePresentation }}</template>
      </p>

      <fieldset v-if="showFraming" class="fq-hx__group">
        <legend class="fq-hx__legend">Desktop framing (local)</legend>

        <div class="fq-hx__radios" role="radiogroup" aria-label="Desktop fit">
          <label v-for="fit in fitOptions" :key="fit.value" class="fq-hx__radio">
            <input
              type="radio"
              name="fq-hx-fit"
              :value="fit.value"
              :checked="desktop.fit === fit.value"
              @change="$emit('update:desktop', { fit: fit.value })"
            />
            <span>{{ fit.label }}</span>
          </label>
        </div>

        <p v-if="cropWarning" class="fq-hx__warn">{{ cropWarning }}</p>

        <div class="fq-hx__row">
          <label for="fq-hx-x">Horizontal</label>
          <input
            id="fq-hx-x"
            type="range"
            min="0"
            max="100"
            step="1"
            :value="desktop.positionX"
            :disabled="framingLocked"
            @input="$emit('update:desktop', { positionX: Number($event.target.value) })"
          />
          <output>{{ Math.round(desktop.positionX) }}</output>
        </div>

        <div class="fq-hx__row">
          <label for="fq-hx-y">Vertical</label>
          <input
            id="fq-hx-y"
            type="range"
            min="0"
            max="100"
            step="1"
            :value="desktop.positionY"
            :disabled="framingLocked"
            @input="$emit('update:desktop', { positionY: Number($event.target.value) })"
          />
          <output>{{ Math.round(desktop.positionY) }}</output>
        </div>

        <div class="fq-hx__row">
          <label for="fq-hx-zoom">Zoom</label>
          <input
            id="fq-hx-zoom"
            type="range"
            min="1"
            max="2"
            step="0.01"
            :value="desktop.zoom"
            :disabled="framingLocked"
            @input="$emit('update:desktop', { zoom: Number($event.target.value) })"
          />
          <output>{{ Math.round(desktop.zoom * 100) }}%</output>
        </div>

        <p v-if="framingLocked" class="fq-hx__hint">
          Full photo shows the whole frame at zoom 1, so crop controls are off.
        </p>
      </fieldset>

      <button type="button" class="fq-hx__reset" @click="$emit('reset')">
        Reset local experiment
      </button>
      <p class="fq-hx__hint">
        Local only. Nothing is saved to the artist record.
      </p>
    </div>
  </aside>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  mode: { type: String, default: 'original' },
  desktop: { type: Object, required: true },
  sourceRatio: { type: Number, default: null },
  adaptivePresentation: { type: String, default: '' },
  imageWidth: { type: [Number, String], default: null },
  imageHeight: { type: [Number, String], default: null },
  /** Real desktop hero box ratio, so the crop warning is measured not guessed. */
  desktopHeroRatio: { type: Number, default: null },
})

defineEmits(['update:mode', 'update:desktop', 'reset'])

const open = ref(true)

const modeOptions = [
  { value: 'original', label: 'Original' },
  { value: 'improved', label: 'Improved hero' },
  { value: 'adaptive', label: 'Adaptive composition' },
]
const fitOptions = [
  { value: 'fill', label: 'Fill frame' },
  { value: 'full', label: 'Full photo' },
]

const modeLabel = computed(
  () => modeOptions.find((o) => o.value === props.mode)?.label || 'Original',
)

// Adaptive editorial/panorama preserve the whole photo, so framing is moot there.
const showFraming = computed(
  () => props.mode === 'improved'
    || (props.mode === 'adaptive' && props.adaptivePresentation === 'cinematic'),
)
const framingLocked = computed(() => props.desktop?.fit === 'full')

const cropWarning = computed(() => {
  if (framingLocked.value) return ''
  const sr = props.sourceRatio
  const hr = props.desktopHeroRatio
  if (!sr || !hr) return ''
  const zoom = Math.max(1, Number(props.desktop?.zoom) || 1)
  const keptH = Math.min(1, (sr > hr ? 1 : sr / hr) / zoom)
  const keptW = Math.min(1, (sr > hr ? hr / sr : 1) / zoom)
  const worst = Math.min(keptH, keptW)
  if (worst >= 0.6) return ''
  const axis = keptH <= keptW ? 'height' : 'width'
  return `Fill frame discards about ${Math.round((1 - worst) * 100)}% of the photo's ${axis} on desktop.`
})
</script>

<style scoped>
.fq-hx {
  position: fixed;
  right: 1rem;
  bottom: 1rem;
  z-index: 9999;
  width: min(20rem, calc(100vw - 2rem));
  border-radius: 0.9rem;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(8, 9, 12, 0.94);
  backdrop-filter: blur(12px);
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.55);
  color: #f4f6f8;
  font-size: 0.8125rem;
}

.fq-hx__toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  min-height: 2.75rem;
  padding: 0.6rem 0.75rem;
  background: transparent;
  border: 0;
  color: inherit;
  font: inherit;
  font-weight: 650;
  cursor: pointer;
}

.fq-hx__dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 999px;
  background: #45e3ae;
  flex: none;
}

.fq-hx__badge {
  margin-left: auto;
  padding: 0.15rem 0.45rem;
  border-radius: 0.4rem;
  background: rgba(255, 255, 255, 0.08);
  font-size: 0.6875rem;
  font-weight: 600;
  color: rgba(244, 246, 248, 0.8);
}

.fq-hx__chev {
  width: 1rem;
  height: 1rem;
  flex: none;
  transition: transform 160ms ease;
}
.fq-hx__chev.is-open { transform: rotate(180deg); }

.fq-hx__body {
  padding: 0 0.75rem 0.75rem;
  display: grid;
  gap: 0.7rem;
}

.fq-hx__group {
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.6rem;
  padding: 0.5rem 0.6rem 0.6rem;
  margin: 0;
  display: grid;
  gap: 0.4rem;
}

.fq-hx__legend {
  padding: 0 0.3rem;
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(244, 246, 248, 0.5);
}

.fq-hx__radios { display: grid; gap: 0.2rem; }

.fq-hx__radio {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 1.85rem;
  cursor: pointer;
}
.fq-hx__radio input { accent-color: #39d5ff; width: 1rem; height: 1rem; }
.fq-hx__radio input:focus-visible {
  outline: 2px solid rgba(57, 213, 255, 0.8);
  outline-offset: 2px;
}

.fq-hx__row {
  display: grid;
  grid-template-columns: 4.5rem 1fr 2.6rem;
  align-items: center;
  gap: 0.5rem;
}
.fq-hx__row label { color: rgba(244, 246, 248, 0.68); }
.fq-hx__row output {
  text-align: right;
  font-variant-numeric: tabular-nums;
  color: rgba(244, 246, 248, 0.5);
}
.fq-hx__row input[type='range'] { width: 100%; accent-color: #39d5ff; }
.fq-hx__row input[type='range']:disabled { opacity: 0.35; }
.fq-hx__row input[type='range']:focus-visible {
  outline: 2px solid rgba(57, 213, 255, 0.8);
  outline-offset: 3px;
}

.fq-hx__meta {
  margin: 0;
  font-size: 0.6875rem;
  font-variant-numeric: tabular-nums;
  color: rgba(244, 246, 248, 0.45);
}

.fq-hx__warn {
  margin: 0;
  font-size: 0.6875rem;
  color: #ffc79a;
}

.fq-hx__hint {
  margin: 0;
  font-size: 0.6875rem;
  color: rgba(244, 246, 248, 0.38);
}

.fq-hx__reset {
  min-height: 2.25rem;
  border-radius: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.05);
  color: inherit;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}
.fq-hx__reset:hover { background: rgba(255, 255, 255, 0.1); }
.fq-hx__reset:focus-visible {
  outline: 2px solid rgba(57, 213, 255, 0.8);
  outline-offset: 2px;
}
</style>
