<template>
  <div>
    <div v-if="mode !== 'upload'" class="space-y-4">
      <div class="form-field">
        <label :for="ids.platform" class="form-label">Streaming service</label>
        <div class="relative">
          <select
            :id="ids.platform"
            :value="platform"
            class="form-input appearance-none cursor-pointer pr-10"
            @change="$emit('update:platform', $event.target.value)"
          >
            <option v-if="!platform" value="" disabled>Select a service</option>
            <option v-for="item in platforms" :key="item.id" :value="item.id">
              {{ item.label }}
            </option>
          </select>
          <span class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-white/40" aria-hidden="true">
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        </div>
      </div>

      <div v-if="platform === 'spotify'" class="space-y-4">
        <div v-if="spotifyPreview && showPreview" class="overflow-hidden rounded-xl border border-white/10 bg-white/5">
          <div class="p-4">
            <p class="mb-2 text-xs font-medium text-[#45D6A7]">Featured track added</p>
            <h4 class="font-semibold text-white">{{ spotifyPreview.title || 'Spotify track' }}</h4>
            <p class="mt-1 text-sm text-white/50">Spotify</p>
          </div>
          <div class="flex border-t border-white/10">
            <img
              v-if="spotifyPreview.thumbnailUrl"
              :src="spotifyPreview.thumbnailUrl"
              :alt="spotifyPreview.title"
              class="h-24 w-24 object-cover"
            />
            <div class="flex flex-1 items-center justify-end gap-3 p-4">
              <button type="button" class="text-sm text-white/60 transition hover:text-white" @click="$emit('change-spotify')">
                Change
              </button>
              <button type="button" class="text-sm text-red-400 transition hover:text-red-300" @click="$emit('clear-spotify')">
                Remove
              </button>
            </div>
          </div>
        </div>

        <div v-else class="space-y-3">
          <div class="form-field">
            <label :for="ids.spotify" class="form-label">{{ currentPlatform.trackLabel }}</label>
            <div class="relative">
              <input
                :id="ids.spotify"
                type="text"
                :value="spotifyUrl"
                class="form-input"
                :class="{ 'is-error': spotifyError }"
                :placeholder="currentPlatform.placeholder"
                autocomplete="off"
                spellcheck="false"
                :aria-invalid="spotifyError ? 'true' : 'false'"
                :aria-describedby="spotifyDescribedBy"
                @input="onSpotifyInput"
              />
            </div>
            <p :id="ids.spotifyHelp" class="text-xs text-white/50">{{ currentPlatform.helper }}</p>
          </div>
          <p v-if="spotifyLoading" class="text-sm text-white/50" role="status">Adding track…</p>
          <p v-else-if="spotifyError" :id="ids.spotifyError" class="text-sm text-red-400" role="alert">
            {{ spotifyError }}
          </p>
        </div>
      </div>

      <div v-else class="space-y-3">
        <div class="form-field">
          <label :for="ids.title" class="form-label">Song title</label>
          <input
            :id="ids.title"
            type="text"
            :value="title"
            class="form-input"
            placeholder="Enter song title"
            @input="$emit('update:title', $event.target.value)"
          />
        </div>
        <div class="form-field">
          <label :for="ids.embed" class="form-label">{{ currentPlatform.trackLabel }}</label>
          <textarea
            :id="ids.embed"
            :value="embedHtml"
            class="form-input form-textarea font-mono text-sm"
            rows="5"
            :placeholder="currentPlatform.placeholder"
            :aria-describedby="ids.embedHelp"
            @input="$emit('update:embedHtml', $event.target.value)"
          />
          <p :id="ids.embedHelp" class="text-xs text-white/50">{{ currentPlatform.helper }}</p>
        </div>
        <button
          v-if="embedHtml"
          type="button"
          class="text-sm text-red-400 transition hover:text-red-300"
          @click="$emit('clear-embed')"
        >
          Remove track
        </button>
      </div>

      <button
        type="button"
        class="fq-upload-audio"
        @click="$emit('update:mode', 'upload')"
      >
        <svg class="h-4 w-4 shrink-0" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
        <span>Upload your own audio</span>
        <span aria-hidden="true">→</span>
      </button>
    </div>

    <div v-else class="space-y-4">
      <div class="form-field">
        <label :for="ids.title" class="form-label">Song title</label>
        <input
          :id="ids.title"
          type="text"
          :value="title"
          class="form-input"
          placeholder="Enter song title"
          @input="$emit('update:title', $event.target.value)"
        />
      </div>

      <div class="form-field">
        <p :id="ids.fileLabel" class="form-label">Upload your own audio</p>

        <div v-if="hasFile" class="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4">
          <div class="flex min-w-0 items-center gap-3">
            <div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-white/10">
              <svg class="h-5 w-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <div class="min-w-0">
              <span class="block truncate text-white">{{ fileLabel }}</span>
              <span v-if="fileFresh" class="text-sm text-white/50">New file selected</span>
              <span v-else-if="existingFile" class="text-sm text-white/50">Current file</span>
            </div>
          </div>
          <button type="button" class="ml-2 flex-shrink-0 text-sm text-red-400 transition hover:text-red-300" @click="$emit('remove-file')">
            Remove
          </button>
        </div>

        <label
          v-else
          :for="ids.file"
          class="group flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-white/20 bg-[#111217] transition hover:border-white/35 hover:bg-white/[0.03]"
        >
          <span class="text-white/80">Choose audio file</span>
          <span class="mt-1 text-sm text-white/40">MP3, WAV, OGG supported</span>
          <input
            :id="ids.file"
            type="file"
            class="sr-only"
            accept="audio/*"
            :key="fileKey"
            :aria-labelledby="ids.fileLabel"
            @change="$emit('upload', $event)"
          />
        </label>

        <label
          v-if="hasFile"
          :for="ids.replace"
          class="mt-2 inline-flex cursor-pointer text-sm text-white/55 transition hover:text-white"
        >
          Change file
          <input
            :id="ids.replace"
            type="file"
            class="sr-only"
            accept="audio/*"
            :key="fileKey"
            @change="$emit('upload', $event)"
          />
        </label>
      </div>

      <button
        type="button"
        class="text-sm text-white/55 transition hover:text-white"
        @click="$emit('update:mode', 'embed')"
      >
        Use a streaming link instead
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { FEATURED_MUSIC_PLATFORMS, getFeaturedMusicPlatform } from '@/utils/bands/featuredMusic'

const props = defineProps({
  mode: { type: String, default: 'embed' },
  platform: { type: String, default: 'spotify' },
  title: { type: String, default: '' },
  embedHtml: { type: String, default: '' },
  spotifyUrl: { type: String, default: '' },
  spotifyPreview: { type: Object, default: null },
  spotifyLoading: { type: Boolean, default: false },
  spotifyError: { type: String, default: '' },
  fileName: { type: String, default: '' },
  existingFile: { type: Boolean, default: false },
  fileFresh: { type: Boolean, default: false },
  fileKey: { type: [String, Number], default: 0 },
  idPrefix: { type: String, default: 'featured-music' },
})

const emit = defineEmits([
  'update:mode',
  'update:platform',
  'update:title',
  'update:embedHtml',
  'update:spotifyUrl',
  'add-track',
  'change-spotify',
  'clear-spotify',
  'clear-embed',
  'remove-file',
  'upload',
])

const platforms = FEATURED_MUSIC_PLATFORMS
const currentPlatform = computed(() => getFeaturedMusicPlatform(props.platform) || FEATURED_MUSIC_PLATFORMS[0])
const hasFile = computed(() => props.fileFresh || props.existingFile)
const fileLabel = computed(() => props.fileName || 'Audio file')
// Pasting a link adds the track (the page does it); the preview is the confirmation.
const showPreview = computed(() => !!props.spotifyPreview && !props.spotifyLoading)
const ids = computed(() => ({
  platform: `${props.idPrefix}-platform`,
  spotify: `${props.idPrefix}-spotify`,
  spotifyHelp: `${props.idPrefix}-spotify-help`,
  spotifyError: `${props.idPrefix}-spotify-error`,
  embed: `${props.idPrefix}-embed`,
  embedHelp: `${props.idPrefix}-embed-help`,
  title: `${props.idPrefix}-title`,
  file: `${props.idPrefix}-file`,
  fileLabel: `${props.idPrefix}-file-label`,
  replace: `${props.idPrefix}-replace`,
}))
const spotifyDescribedBy = computed(() =>
  [ids.value.spotifyHelp, props.spotifyError ? ids.value.spotifyError : null].filter(Boolean).join(' ')
)

function onSpotifyInput(event) {
  emit('update:spotifyUrl', event.target.value)
}
</script>

<style scoped>
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

.form-input.is-error,
.form-input.is-error:focus {
  border-color: rgba(248, 113, 113, 0.7);
  box-shadow: 0 0 0 1px rgba(248, 113, 113, 0.18);
  background-color: #111217;
}

.fq-upload-audio {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 2.5rem;
  padding: 0.5rem 0.85rem 0.5rem 0.7rem;
  border-radius: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.86);
  font-size: 0.875rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  transition: border-color 160ms ease, background-color 160ms ease, color 160ms ease;
}

.fq-upload-audio:hover {
  border-color: rgba(255, 255, 255, 0.22);
  background: rgba(255, 255, 255, 0.07);
  color: #fff;
}
</style>
