<template>
  <div class="fq-media-picker" :class="{ 'is-block': variant === 'block' }">
    <input
      ref="fileRef"
      type="file"
      class="sr-only"
      accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
      :multiple="multiple"
      @change="onChange"
    />
    <button
      v-if="variant === 'block'"
      type="button"
      class="fq-media-picker__block"
      :disabled="disabled || !canAdd"
      @click="open"
    >
      {{ label }}
    </button>
    <button
      v-else-if="variant === 'labeled'"
      type="button"
      class="fq-media-picker__labeled"
      :class="{ 'is-dense': dense }"
      :disabled="disabled || !canAdd"
      @click="open"
    >
      <svg class="fq-media-picker__glyph" viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="1.7" />
        <circle cx="8.2" cy="10" r="1.35" fill="currentColor" />
        <path d="M3.8 16.4 8.6 12l3.1 2.6 3.3-3.8 5.2 5.6" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" />
      </svg>
      {{ label }}
    </button>
    <FaneqoIconButton
      v-else
      name="image"
      :aria-label="label"
      :disabled="disabled || !canAdd"
      @click="open"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import FaneqoIconButton from '~/components/ui/FaneqoIconButton.vue'

defineProps({
  multiple: { type: Boolean, default: true },
  disabled: { type: Boolean, default: false },
  canAdd: { type: Boolean, default: true },
  label: { type: String, default: 'Add photos' },
  variant: { type: String, default: 'icon' },
  dense: { type: Boolean, default: false },
})

const emit = defineEmits(['select'])
const fileRef = ref(null)

function open() {
  fileRef.value?.click()
}

function onChange(evt) {
  const files = evt.target?.files
  if (files?.length) emit('select', files)
  if (fileRef.value) fileRef.value.value = ''
}

defineExpose({ open })
</script>

<style scoped>
.fq-media-picker { display: inline-flex; }
.fq-media-picker.is-block { display: block; width: 100%; }
.fq-media-picker__block {
  width: 100%;
  min-height: 64px;
  border: 1px solid rgba(247, 249, 252, 0.14);
  background: #111722;
  color: #f7f9fc;
  font: inherit;
  font-size: 1.02rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  cursor: pointer;
}
.fq-media-picker__block:disabled {
  opacity: 0.45;
  cursor: default;
}
.fq-media-picker__labeled {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  min-height: 44px;
  padding: 0 0.85rem;
  border: 1px solid rgba(247, 249, 252, 0.14);
  border-radius: 0.7rem;
  background: rgba(247, 249, 252, 0.03);
  color: #f7f9fc;
  font: inherit;
  font-size: 0.86rem;
  font-weight: 650;
  cursor: pointer;
}
.fq-media-picker__labeled.is-dense {
  min-height: 40px;
  padding: 0 0.7rem;
  font-size: 0.8rem;
}
.fq-media-picker__labeled:hover:not(:disabled) {
  border-color: rgba(57, 213, 255, 0.35);
  background: rgba(57, 213, 255, 0.06);
}
.fq-media-picker__labeled:focus-visible {
  outline: 2px solid #39d5ff;
  outline-offset: 2px;
}
.fq-media-picker__labeled:disabled {
  opacity: 0.45;
  cursor: default;
}
.fq-media-picker__glyph {
  width: 1.05rem;
  height: 1.05rem;
  flex: none;
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
