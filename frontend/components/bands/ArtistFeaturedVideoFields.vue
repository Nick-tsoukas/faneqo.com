<template>
  <div>
    <div v-if="preview && showPreview" class="overflow-hidden rounded-xl border border-white/10 bg-white/5">
      <div class="p-4">
        <p class="mb-2 text-xs font-medium text-[#45D6A7]">Featured video added</p>
        <h4 class="font-semibold text-white">{{ preview.title || 'YouTube video' }}</h4>
        <p class="mt-1 text-sm text-white/50">YouTube</p>
      </div>
      <div class="flex border-t border-white/10">
        <img
          v-if="preview.thumbnailUrl"
          :src="preview.thumbnailUrl"
          :alt="preview.title"
          class="h-24 w-40 object-cover"
        />
        <div class="flex flex-1 items-center justify-end gap-3 p-4">
          <button type="button" class="text-sm text-white/60 transition hover:text-white" @click="$emit('change-video')">
            Change
          </button>
          <button type="button" class="text-sm text-red-400 transition hover:text-red-300" @click="$emit('remove-video')">
            Remove
          </button>
        </div>
      </div>
    </div>

    <div v-else class="space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="form-field">
          <label :for="ids.title" class="form-label">Video Title</label>
          <input
            :id="ids.title"
            type="text"
            :value="title"
            class="form-input"
            placeholder="Enter video title"
            @input="$emit('update:title', $event.target.value)"
          />
        </div>
        <div class="form-field">
          <label :for="ids.youtube" class="form-label">YouTube link</label>
          <input
            :id="ids.youtube"
            type="url"
            :value="youtubeUrl"
            class="form-input"
            :class="{ 'is-error': error }"
            placeholder="https://youtube.com/watch?v=..."
            autocomplete="off"
            spellcheck="false"
            :aria-invalid="error ? 'true' : 'false'"
            :aria-describedby="error ? ids.error : undefined"
            @input="$emit('update:youtubeUrl', $event.target.value)"
          />
        </div>
      </div>
      <p v-if="error && !loading" :id="ids.error" class="text-sm text-red-400" role="alert">
        {{ error }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: { type: String, default: '' },
  youtubeUrl: { type: String, default: '' },
  preview: { type: Object, default: null },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
  idPrefix: { type: String, default: 'featured-video' },
})

defineEmits([
  'update:title',
  'update:youtubeUrl',
  'add-video',
  'change-video',
  'remove-video',
])

// Pasting a link adds the video (the page does it); the preview is the confirmation.
const showPreview = computed(() => !!props.preview && !props.loading)
const ids = computed(() => ({
  title: `${props.idPrefix}-title`,
  youtube: `${props.idPrefix}-youtube`,
  error: `${props.idPrefix}-error`,
}))
</script>

<style scoped>
.form-input.is-error,
.form-input.is-error:focus {
  border-color: rgba(248, 113, 113, 0.7);
  box-shadow: 0 0 0 1px rgba(248, 113, 113, 0.18);
  background-color: #111217;
}
</style>
