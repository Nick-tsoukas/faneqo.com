<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  videoId: { type: String, required: true },
  hideDescription: { type: Boolean, default: false },

  title: { type: String, default: '' },
  /**
   * Optional custom thumbnail URL. If not provided,
   * we auto-use YouTube’s maxresdefault/hqdefault.
   */
  thumb: { type: String, default: '' },
  /**
   * Aspect ratio classes (taller than 16:9 by default).
   * You can override with something like: "aspect-video".
   */
  aspect: {
    type: String,
    default: 'aspect-[4/3] md:aspect-[3/2] lg:aspect-[16/10]',
  },
  autoplay: { type: Boolean, default: true },
})

const isPlaying = ref(false)
const thumbUrl = ref(
  props.thumb || `https://img.youtube.com/vi/${props.videoId}/maxresdefault.jpg`
)
const fallback = props.thumb || `https://img.youtube.com/vi/${props.videoId}/hqdefault.jpg`

function onThumbError() {
  if (thumbUrl.value !== fallback) thumbUrl.value = fallback
}

const embedUrl = computed(() => {
  const base = `https://www.youtube-nocookie.com/embed/${props.videoId}`
  const params = new URLSearchParams({
    rel: '0',
    modestbranding: '1',
    playsinline: '1',
    autoplay: props.autoplay ? '1' : '0',
  })
  return `${base}?${params.toString()}`
})
</script>

<template>
  <div class="group">
    <div
      class="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-black/40 shadow-[0_18px_50px_rgba(0,0,0,0.45)] transition group-hover:bg-white/5"
      :class="aspect"
    >
      <!-- Thumbnail -->
      <button
        v-if="!isPlaying"
        @click="isPlaying = true"
        class="w-full h-full relative block text-left focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
        :aria-label="'Play ' + title"
      >
        <img
          :src="thumbUrl"
          :alt="title"
          @error="onThumbError"
          class="absolute inset-0 w-full h-full object-cover opacity-90 transition duration-300 group-hover:opacity-100 scale-[1.02] group-hover:scale-[1.04]"
          loading="lazy"
        />
        <!-- gradient overlay -->
        <div class="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent"></div>

        <div class="pointer-events-none absolute inset-0">
          <div class="absolute -top-20 -right-20 h-48 w-48 rounded-full bg-violet-500/15 blur-3xl"></div>
          <div class="absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl"></div>
        </div>

        <!-- Play button -->
        <div class="absolute inset-0 flex items-center justify-center">
          <span
            class="inline-flex items-center justify-center h-16 w-16 rounded-full bg-white/10 backdrop-blur border border-white/15 shadow-lg transition group-hover:scale-105 group-hover:bg-white/15"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" class="h-8 w-8 text-white ml-1">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </div>

        <!-- Title on thumbnail -->
        <div class="absolute bottom-0 left-0 right-0 p-4">
          <!-- <h3 class="text-white font-semibold text-lg drop-shadow-md">
            {{ title }}
          </h3> -->
        </div>
      </button>

      <!-- Iframe -->
      <iframe
        v-else
        class="absolute inset-0 w-full h-full"
        :src="embedUrl"
        :title="title || 'Video player'"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerpolicy="strict-origin-when-cross-origin"
        allowfullscreen
      ></iframe>
    </div>

    <!-- Caption (optional) -->
    <p v-if="title" class="mt-3 text-white/90 text-base font-semibold leading-snug line-clamp-2">
      {{ title }}
    </p>
  </div>
</template>
