<template>
  <div class="event-poster-field">
    <EventPosterFrame
      v-if="previewUrl"
      :src="previewUrl"
      :alt="alt"
      @open="lightboxOpen = true"
    />

    <label
      class="event-poster-field__drop"
      :class="{ 'is-drag': dragging }"
      @dragover.prevent="dragging = true"
      @dragenter.prevent="dragging = true"
      @dragleave.prevent="onDragLeave"
      @drop.prevent="onDrop"
    >
      <input
        :id="inputId"
        type="file"
        class="sr-only"
        accept="image/jpeg,image/png,image/webp,image/gif"
        :required="required && !previewUrl"
        @change="onFile"
      />
      <svg class="w-9 h-9 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
      </svg>
      <span class="event-poster-field__title">
        {{ previewUrl ? 'Replace poster' : 'Upload the full poster' }}
      </span>
      <span class="event-poster-field__copy">
        Tall flyers are welcome. Fans can zoom to read every line.
      </span>
      <span class="event-poster-field__meta">PNG, JPG, or WebP · up to 10MB</span>
    </label>

    <FaneqoMediaLightbox
      :open="lightboxOpen"
      :items="lightboxItems"
      :title="alt || 'Event poster'"
      zoomable
      @close="lightboxOpen = false"
    />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import EventPosterFrame from '@/components/events/EventPosterFrame.vue'
import FaneqoMediaLightbox from '@/components/media/FaneqoMediaLightbox.vue'

const props = defineProps({
  previewUrl: { type: String, default: '' },
  alt: { type: String, default: 'Event poster' },
  inputId: { type: String, required: true },
  required: { type: Boolean, default: false },
})

const emit = defineEmits(['select'])

const lightboxOpen = ref(false)
const dragging = ref(false)

const lightboxItems = computed(() => {
  if (!props.previewUrl) return []
  return [{ url: props.previewUrl, largeUrl: props.previewUrl, alt: props.alt || 'Event poster' }]
})

function takeFile(file) {
  if (!file || !file.type.startsWith('image/')) return
  emit('select', file)
}

function onFile(event) {
  takeFile(event.target.files?.[0])
  event.target.value = ''
}

function onDrop(event) {
  dragging.value = false
  takeFile(event.dataTransfer?.files?.[0])
}

function onDragLeave(event) {
  if (event.currentTarget.contains(event.relatedTarget)) return
  dragging.value = false
}
</script>

<style scoped>
.event-poster-field {
  display: grid;
  gap: 1rem;
}

.event-poster-field__drop {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  padding: 1.5rem 1.25rem;
  border: 2px dashed rgba(255, 255, 255, 0.2);
  border-radius: 0.95rem;
  cursor: pointer;
  text-align: center;
  transition: border-color 0.2s ease, background 0.2s ease;
}

.event-poster-field__drop:hover,
.event-poster-field__drop.is-drag {
  border-color: rgba(139, 108, 255, 0.55);
  background: rgba(139, 108, 255, 0.08);
}

.event-poster-field__drop:focus-within {
  outline: 2px solid #39d5ff;
  outline-offset: 3px;
}

.event-poster-field__title {
  margin-top: 0.35rem;
  color: rgba(255, 255, 255, 0.86);
  font-weight: 700;
}

.event-poster-field__copy {
  max-width: 22rem;
  color: rgba(255, 255, 255, 0.55);
  font-size: 0.875rem;
  line-height: 1.45;
}

.event-poster-field__meta {
  color: rgba(255, 255, 255, 0.38);
  font-size: 0.75rem;
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
