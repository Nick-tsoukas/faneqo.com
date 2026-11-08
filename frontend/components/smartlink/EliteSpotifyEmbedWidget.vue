<template>
  <div ref="rootEl" class="elite-spotify-widget w-full">
    <!-- Preview Mode (compact horizontal card) -->
    <div 
      v-if="!showPlayer" 
      class="flex items-center gap-4 p-3 rounded-xl bg-black border border-white/10 hover:border-green-500/30 transition-all group"
    >
      <!-- Album Art -->
      <div class="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 shadow-lg">
        <img
          v-if="thumbnailUrl"
          :src="thumbnailUrl"
          :alt="title"
          class="w-full h-full object-cover"
          loading="lazy"
        />
        <div v-else class="w-full h-full bg-gradient-to-br from-green-900/60 to-black flex items-center justify-center">
          <svg class="w-8 h-8 text-green-500/70" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
          </svg>
        </div>
        <!-- Type badge overlay -->
        <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-1.5 py-0.5">
          <span class="text-[9px] font-bold uppercase tracking-wider text-green-400">{{ typeLabel }}</span>
        </div>
      </div>
      
      <!-- Content -->
      <div class="flex-1 min-w-0">
        <h3 class="text-white font-semibold text-sm leading-tight line-clamp-1 mb-0.5">
          {{ songName }}
        </h3>
        <div class="flex items-center gap-1.5 text-white/50 text-xs">
          <svg class="w-3 h-3 text-green-500 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
          </svg>
          <span class="line-clamp-1">{{ subtitle }}</span>
        </div>
      </div>
      
      <!-- Action buttons -->
      <div class="flex items-center gap-2 flex-shrink-0">
        <a
          :href="spotifyUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="w-9 h-9 flex items-center justify-center rounded-full bg-green-500 hover:bg-green-400 hover:scale-105 text-black transition-all"
          title="Open in Spotify"
          @click="handleSpotifyClick"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
        <button
          type="button"
          @click="handlePlayClick"
          class="h-9 px-4 flex items-center justify-center gap-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-all border border-white/10 hover:border-green-500/30"
        >
          <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z"/>
          </svg>
          Play
        </button>
      </div>
    </div>
    
    <!-- Player Mode (iframe loaded) -->
    <div v-else class="rounded-xl overflow-hidden border border-green-500/30 relative">
      <!-- Loading overlay -->
      <div 
        v-if="!iframeLoaded && !iframeError" 
        class="absolute inset-0 bg-black/80 flex items-center justify-center z-10"
      >
        <div class="flex flex-col items-center gap-2">
          <div class="w-6 h-6 border-2 border-green-500/30 border-t-green-500 rounded-full animate-spin"></div>
          <span class="text-white/50 text-xs">Loading player...</span>
        </div>
      </div>
      
      <!-- Error state with retry button -->
      <div 
        v-if="iframeError" 
        class="absolute inset-0 bg-black/90 flex items-center justify-center z-10"
      >
        <div class="flex flex-col items-center gap-3 text-center px-4">
          <svg class="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p class="text-white/70 text-sm">Player failed to load</p>
          <button 
            @click="manualRetry" 
            class="px-4 py-2 bg-green-500 hover:bg-green-400 text-black text-sm font-medium rounded-full transition-all"
          >
            Try Again
          </button>
          <a 
            :href="spotifyUrl" 
            target="_blank" 
            rel="noopener noreferrer"
            class="text-green-400 hover:text-green-300 text-xs underline"
          >
            Open in Spotify instead
          </a>
        </div>
      </div>
      
      <!-- Iframe container -->
      <div class="w-full" :style="{ height: iframeHeight }">
        <div :key="iframeKey" v-html="iframeHtml" class="w-full h-full" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onBeforeUnmount } from 'vue'

const props = defineProps({
  spotifyUrl: {
    type: String,
    required: true
  },
  title: {
    type: String,
    default: ''
  },
  thumbnailUrl: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    default: 'track',
    validator: (v) => ['track', 'album', 'playlist', 'artist'].includes(v)
  },
  iframeHtml: {
    type: String,
    default: ''
  },
  artistName: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['spotify-click', 'spotify-play'])

const rootEl = ref(null)
const showPlayer = ref(false)
const iframeLoaded = ref(false)
const iframeError = ref(false)
const retryCount = ref(0)
const maxRetries = 3
const iframeKey = ref(0) // Used to force re-render
let monitorTimer = null
let retryTimer = null

function clearMonitorTimers() {
  if (monitorTimer) {
    clearTimeout(monitorTimer)
    monitorTimer = null
  }
  if (retryTimer) {
    clearTimeout(retryTimer)
    retryTimer = null
  }
}

function handleSpotifyClick() {
  emit('spotify-click', { url: props.spotifyUrl, type: props.type })
}

function handlePlayClick() {
  showPlayer.value = true
  iframeLoaded.value = false
  iframeError.value = false
  retryCount.value = 0
  emit('spotify-play', { url: props.spotifyUrl, type: props.type })

  nextTick(() => {
    setupIframeMonitoring()
  })
}

function setupIframeMonitoring() {
  clearMonitorTimers()
  monitorTimer = setTimeout(() => {
    monitorTimer = null
    checkIframeLoaded()
  }, 3000)
}

function checkIframeLoaded() {
  if (!showPlayer.value) return

  const container = rootEl.value?.querySelector?.('iframe')
  if (container) {
    iframeLoaded.value = true
    iframeError.value = false
  } else if (retryCount.value < maxRetries) {
    retryEmbed()
  } else {
    iframeError.value = true
  }
}

function retryEmbed() {
  retryCount.value++
  iframeKey.value++

  nextTick(() => {
    clearMonitorTimers()
    retryTimer = setTimeout(() => {
      retryTimer = null
      checkIframeLoaded()
    }, 3000)
  })
}

function manualRetry() {
  retryCount.value = 0
  iframeError.value = false
  iframeKey.value++

  nextTick(() => {
    setupIframeMonitoring()
  })
}

onBeforeUnmount(() => {
  clearMonitorTimers()
})

const typeLabel = computed(() => {
  switch (props.type) {
    case 'track': return 'Track'
    case 'album': return 'Album'
    case 'playlist': return 'Playlist'
    case 'artist': return 'Artist'
    default: return 'Track'
  }
})

// Song name is just the title from oEmbed
const songName = computed(() => {
  return props.title || 'Spotify Content'
})

// Subtitle - show artist name if provided, otherwise type-based fallback
const subtitle = computed(() => {
  if (props.artistName) {
    return props.artistName
  }
  switch (props.type) {
    case 'track': return 'Song on Spotify'
    case 'album': return 'Album on Spotify'
    case 'playlist': return 'Playlist on Spotify'
    case 'artist': return 'Artist on Spotify'
    default: return 'on Spotify'
  }
})

const iframeHeight = computed(() => {
  switch (props.type) {
    case 'track': return '152px'
    case 'album':
    case 'playlist':
    case 'artist':
      return '380px'
    default:
      return '152px'
  }
})

</script>

<style scoped>
.elite-spotify-widget :deep(iframe) {
  width: 100%;
  height: 100%;
  border: none;
  border-radius: 0;
}
</style>
