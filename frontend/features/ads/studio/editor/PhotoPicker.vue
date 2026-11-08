<template>
  <div class="pp">
    <div v-if="options.length || uploadable" class="pp__grid" role="listbox" :aria-label="label">
      <button
        v-if="allowNone"
        type="button"
        class="pp__opt pp__opt--none"
        :aria-pressed="!modelValue"
        @click="choose(null)"
      >
        <span>None</span>
      </button>
      <button
        v-for="opt in options"
        :key="opt.url"
        type="button"
        class="pp__opt"
        :aria-pressed="modelValue?.url === opt.url"
        :title="opt.label || opt.group"
        @click="choose(opt)"
      >
        <img :src="thumb(opt.url)" alt="" loading="lazy" />
        <!-- Rights label only when it carries information: non-organic use, or any use while building a paid ad. -->
        <span v-if="opt.use !== 'organic' || paid" class="pp__tag" :class="`is-${opt.use}`">{{ useLabel(opt) }}</span>
        <span v-if="opt.source === 'studio_upload'" class="pp__tag pp__tag--src">Uploaded</span>
      </button>
      <button
        v-if="uploadable"
        type="button"
        class="pp__opt pp__opt--upload"
        :disabled="uploading"
        :aria-busy="uploading"
        :title="uploadTitle"
        @click="openFilePicker"
      >
        <span>{{ uploading ? 'Uploading…' : uploadTitle }}</span>
      </button>
      <input
        v-if="uploadable"
        ref="fileInput"
        class="pp__file"
        type="file"
        :accept="accept"
        :aria-label="`${uploadTitle} for ${label}`"
        @change="onFile"
      >
    </div>
    <p v-else class="pp__empty">
      {{ emptyText }}
    </p>
    <p v-if="uploadError" class="pp__error" role="alert">{{ uploadError }}</p>

    <div v-if="modelValue" class="pp__detail">
      <p class="pp__caption">
        <strong>{{ modelValue.label || 'Selected' }}</strong>
        <span> · {{ sourceLabel(modelValue) }} · {{ useLabel(modelValue) }}<template v-if="modelValue.width && modelValue.height"> · {{ modelValue.width }}×{{ modelValue.height }}</template></span>
        <button v-if="allowNone" type="button" class="pp__remove" @click="choose(null)">Remove</button>
      </p>
      <p v-if="modelValue.credit" class="pp__credit">{{ modelValue.credit }}</p>

      <div v-if="withFocal" class="pp__focal">
        <button
          type="button"
          class="pp__focal-img"
          :aria-label="`Focal point ${fx}% across, ${fy}% down. Click to move.`"
          @click="onFocalClick"
        >
          <img :src="thumb(modelValue.url)" alt="" draggable="false" />
          <i class="pp__cross" :style="{ left: `${fx}%`, top: `${fy}%` }" aria-hidden="true" />
        </button>
        <div class="pp__sliders">
          <label>
            <span>Across <b>{{ fx }}%</b></span>
            <input type="range" min="0" max="100" :value="fx" @input="setFocal(Number($event.target.value), fy)" />
          </label>
          <label>
            <span>Down <b>{{ fy }}%</b></span>
            <input type="range" min="0" max="100" :value="fy" @input="setFocal(fx, Number($event.target.value))" />
          </label>
          <p class="pp__hint">The focal point stays in frame in every format.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { studioImageUrl } from '@/features/ads/studio/mediaUrl.js'
import { STUDIO_UPLOAD_ACCEPT } from '@/features/ads/studio/studioUploads.js'

const props = defineProps({
  options: { type: Array, default: () => [] },
  modelValue: { type: Object, default: null },
  focal: { type: Object, default: null },
  withFocal: { type: Boolean, default: false },
  allowNone: { type: Boolean, default: true },
  paid: { type: Boolean, default: false },
  label: { type: String, default: 'Photos' },
  emptyText: { type: String, default: 'This artist has no photographs on their page yet. Ask them to add one, or pick another artist.' },
  /* Manual upload. The parent owns the request (useStudioUploads) and reports state back. */
  uploadable: { type: Boolean, default: false },
  uploading: { type: Boolean, default: false },
  uploadError: { type: String, default: '' },
  uploadTitle: { type: String, default: 'Upload' },
  accept: { type: String, default: STUDIO_UPLOAD_ACCEPT },
})
const emit = defineEmits(['update:modelValue', 'update:focal', 'upload'])

const fileInput = ref(null)

function openFilePicker() {
  fileInput.value?.click()
}

function onFile(event) {
  const file = event.target?.files?.[0]
  if (file) emit('upload', file)
  // Reset so choosing the same file again re-fires change.
  if (event.target) event.target.value = ''
}

const fx = computed(() => Math.round(Number(props.focal?.x ?? props.modelValue?.focal?.x ?? 50)))
const fy = computed(() => Math.round(Number(props.focal?.y ?? props.modelValue?.focal?.y ?? 50)))

function thumb(url) {
  return studioImageUrl(url)
}

function useLabel(ref) {
  return { preview: 'Preview only', organic: 'Organic', paid: 'Paid OK' }[ref?.use] || 'Unknown rights'
}

function sourceLabel(ref) {
  return { band_upload: 'Artist upload', spotify_oembed: 'Spotify thumbnail', studio_asset: 'Studio asset', studio_upload: 'Uploaded here' }[ref?.source] || 'Unknown source'
}

function choose(opt) {
  emit('update:modelValue', opt ? { ...opt } : null)
  if (opt) emit('update:focal', { ...(opt.focal || { x: 50, y: 50 }) })
}

function setFocal(x, y) {
  emit('update:focal', { x: Math.min(100, Math.max(0, Math.round(x))), y: Math.min(100, Math.max(0, Math.round(y))) })
}

function onFocalClick(event) {
  const rect = event.currentTarget.getBoundingClientRect()
  if (!rect.width || !rect.height) return
  setFocal(((event.clientX - rect.left) / rect.width) * 100, ((event.clientY - rect.top) / rect.height) * 100)
}
</script>

<style scoped>
.pp { position: relative; display: flex; flex-direction: column; gap: 12px; }

.pp__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(64px, 1fr));
  gap: 6px;
}

.pp__opt {
  position: relative;
  aspect-ratio: 1;
  padding: 0;
  overflow: hidden;
  border: 2px solid transparent;
  border-radius: 10px;
  background: #15161b;
  cursor: pointer;
}

.pp__opt img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.pp__opt[aria-pressed="true"] { border-color: #7ee7ff; }
.pp__opt:focus-visible { outline: 1px solid rgba(126, 231, 255, 0.7); outline-offset: 2px; }

.pp__opt--none {
  display: grid;
  place-items: center;
  color: rgba(247, 249, 252, 0.55);
  font: inherit;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.pp__tag {
  position: absolute;
  right: 4px;
  bottom: 4px;
  padding: 2px 5px;
  border-radius: 999px;
  background: rgba(5, 5, 6, 0.8);
  color: #d7f9ff;
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.pp__tag.is-preview { color: #ffb4c8; }
.pp__tag.is-paid { color: #9af0a7; }
.pp__tag--src { right: auto; left: 4px; color: rgba(247, 249, 252, 0.75); }

.pp__opt--upload {
  display: grid;
  place-items: center;
  padding: 6px;
  border: 1px dashed rgba(126, 231, 255, 0.45);
  background: rgba(126, 231, 255, 0.06);
  color: #7ee7ff;
  font: inherit;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-align: center;
  text-transform: uppercase;
}

.pp__opt--upload:disabled { cursor: progress; opacity: 0.6; }

.pp__file {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  opacity: 0;
  pointer-events: none;
}

.pp__error {
  margin: 0;
  color: #ffb4c8;
  font-size: 12px;
  line-height: 1.45;
}

.pp__remove {
  margin-left: 8px;
  padding: 0;
  border: 0;
  background: none;
  color: #7ee7ff;
  font: inherit;
  font-size: 12px;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.pp__empty,
.pp__caption,
.pp__credit,
.pp__hint {
  margin: 0;
  color: rgba(247, 249, 252, 0.6);
  font-size: 12px;
  line-height: 1.45;
}

.pp__caption strong { color: #f7f9fc; font-weight: 600; }
.pp__credit { color: rgba(247, 249, 252, 0.45); font-style: italic; }
.pp__hint { color: rgba(247, 249, 252, 0.4); }

.pp__detail { display: flex; flex-direction: column; gap: 8px; }

.pp__focal {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 12px;
  align-items: start;
}

.pp__focal-img {
  position: relative;
  width: 120px;
  padding: 0;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 10px;
  background: #0b0b0e;
  cursor: crosshair;
}

.pp__focal-img img {
  display: block;
  width: 100%;
  height: auto;
}

.pp__cross {
  position: absolute;
  width: 18px;
  height: 18px;
  border: 2px solid #7ee7ff;
  border-radius: 999px;
  box-shadow: 0 0 0 2px rgba(5, 5, 6, 0.7);
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.pp__sliders { display: flex; flex-direction: column; gap: 8px; }

.pp__sliders label {
  display: flex;
  flex-direction: column;
  gap: 2px;
  color: rgba(247, 249, 252, 0.6);
  font-size: 11px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.pp__sliders b { color: #f7f9fc; font-weight: 600; }
.pp__sliders input { width: 100%; accent-color: #7ee7ff; }
</style>
