<template>
  <div class="space-y-5">
    <!-- Content type + Category -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="form-field min-w-0">
        <label for="ed-form-content-type" class="form-label">Content type <span class="text-emerald-400">*</span></label>
        <div class="relative">
          <select
            id="ed-form-content-type"
            v-model="model.contentType"
            class="form-input appearance-none pr-10 cursor-pointer"
            :class="{ 'form-input-error': errors.contentType }"
            :aria-invalid="errors.contentType ? 'true' : 'false'"
            :aria-describedby="errors.contentType ? 'ed-form-content-type-error' : undefined"
          >
            <option
              v-for="t in EDITORIAL_CONTENT_TYPES"
              :key="t.value"
              :value="t.value"
              class="bg-neutral-900 text-white"
            >
              {{ t.label }}
            </option>
          </select>
          <svg class="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/45" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        <p v-if="errors.contentType" id="ed-form-content-type-error" class="form-error">{{ errors.contentType }}</p>
      </div>

      <div class="form-field min-w-0">
        <label for="ed-form-category" class="form-label">Category <span class="text-white/40 font-normal">(optional)</span></label>
        <input id="ed-form-category" v-model="model.category" type="text" class="form-input" placeholder="e.g. Live Review" maxlength="60" />
      </div>
    </div>

    <!-- Title -->
    <div class="form-field min-w-0">
      <div class="flex items-center justify-between">
        <label for="ed-form-title" class="form-label">Title <span class="text-emerald-400">*</span></label>
        <span class="text-white/40 text-xs tabular-nums">{{ (model.title || '').length }}/{{ EDITORIAL_TITLE_MAX }}</span>
      </div>
      <input
        id="ed-form-title"
        v-model="model.title"
        type="text"
        class="form-input"
        :class="{ 'form-input-error': errors.title }"
        :aria-invalid="errors.title ? 'true' : 'false'"
        :aria-describedby="errors.title ? 'ed-form-title-error' : undefined"
        :maxlength="EDITORIAL_TITLE_MAX"
        placeholder="Concert Review: A Night to Remember"
      />
      <p v-if="errors.title" id="ed-form-title-error" class="form-error">{{ errors.title }}</p>
    </div>

    <!-- URL -->
    <div class="form-field min-w-0">
      <label for="ed-form-url" class="form-label">URL <span class="text-emerald-400">*</span></label>
      <input
        id="ed-form-url"
        v-model="model.url"
        type="url"
        class="form-input"
        :class="{ 'form-input-error': errors.url }"
        :aria-invalid="errors.url ? 'true' : 'false'"
        :aria-describedby="errors.url ? 'ed-form-url-error' : undefined"
        placeholder="https://yourpublication.com/article"
        @blur="$emit('blur-url')"
      />
      <p v-if="errors.url" id="ed-form-url-error" class="form-error">{{ errors.url }}</p>
    </div>

    <!-- Excerpt -->
    <div class="form-field min-w-0">
      <div class="flex items-center justify-between">
        <label for="ed-form-excerpt" class="form-label">Excerpt <span class="text-white/40 font-normal">(optional)</span></label>
        <span
          class="text-xs tabular-nums"
          :class="(model.excerpt || '').length >= EDITORIAL_EXCERPT_MAX ? 'text-amber-400' : 'text-white/40'"
        >
          {{ (model.excerpt || '').length }} / {{ EDITORIAL_EXCERPT_MAX }}
        </span>
      </div>
      <textarea
        id="ed-form-excerpt"
        v-model="model.excerpt"
        class="form-input form-textarea min-h-[80px]"
        :maxlength="EDITORIAL_EXCERPT_MAX"
        rows="3"
        placeholder="A short, enticing summary that appears beneath the title."
      />
    </div>

    <!-- Cover image -->
    <div class="form-field">
      <label class="form-label">Cover image <span class="text-white/35 font-normal">(optional)</span></label>

      <div class="flex flex-col sm:flex-row sm:items-start gap-4">
        <!-- Preview frame (fixed 16:9) -->
        <div class="w-full sm:w-44 shrink-0 aspect-video rounded-xl overflow-hidden border border-white/10 bg-white/[0.03] flex items-center justify-center">
          <img v-if="imagePreview" :src="imagePreview" alt="Cover preview" class="w-full h-full object-cover" />
          <svg v-else class="w-9 h-9 text-white/20" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>

        <!-- Controls -->
        <div class="flex-1 min-w-0 space-y-2.5">
          <div class="flex flex-wrap gap-2">
            <label class="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/[0.06] border border-white/12 text-white/80 hover:bg-white/[0.1] hover:text-white cursor-pointer transition text-sm font-medium">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span>{{ imagePreview ? 'Replace image' : 'Upload image' }}</span>
              <input type="file" class="hidden" accept="image/*" @change="onFileChange" />
            </label>
            <button
              v-if="imagePreview"
              type="button"
              class="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-white/60 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/30 transition text-sm font-medium"
              @click="$emit('image-removed')"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Remove
            </button>
          </div>
          <p v-if="fileError" class="form-error">{{ fileError }}</p>
          <p v-else class="form-help">PNG or JPG, up to 10MB. Recommended 16:9.</p>
        </div>
      </div>
    </div>

    <!-- Featured toggle -->
    <label class="flex items-center justify-between gap-4 px-4 py-3 rounded-xl border border-white/10 bg-white/[0.02] cursor-pointer">
      <span class="min-w-0">
        <span class="text-white text-sm font-medium block">Feature this story</span>
        <span class="text-white/45 text-xs block mt-0.5">Shows as the large lead card on your profile. Only one story can be featured.</span>
      </span>
      <span class="relative shrink-0">
        <input v-model="model.isFeatured" type="checkbox" class="sr-only peer" aria-label="Feature this story" />
        <span class="block w-11 h-6 bg-white/15 rounded-full peer peer-checked:bg-emerald-500 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-400/50"></span>
        <span class="absolute left-[3px] top-[3px] w-[18px] h-[18px] bg-white rounded-full shadow transition-transform peer-checked:translate-x-5"></span>
      </span>
    </label>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { EDITORIAL_CONTENT_TYPES, EDITORIAL_EXCERPT_MAX, EDITORIAL_TITLE_MAX } from '@/utils/editorialShowcase';

const model = defineModel({ type: Object, required: true });

defineProps({
  errors: { type: Object, default: () => ({}) },
  imagePreview: { type: String, default: '' },
});

const emit = defineEmits(['blur-url', 'image-selected', 'image-removed']);

const fileError = ref('');
const MAX_BYTES = 10 * 1024 * 1024;

function onFileChange(e) {
  fileError.value = '';
  const file = e.target.files?.[0];
  if (file) {
    if (!file.type.startsWith('image/')) {
      fileError.value = 'Please choose an image file.';
    } else if (file.size > MAX_BYTES) {
      fileError.value = 'Image must be 10MB or smaller.';
    } else {
      emit('image-selected', file);
    }
  }
  e.target.value = '';
}
</script>

<style scoped>
.form-error {
  @apply text-red-400 text-xs mt-1;
}
</style>
