<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition name="fade">
      <div
        v-if="isOpen"
        class="fixed inset-0 bg-black/90 backdrop-blur-xl"
        style="z-index: 999999998 !important;"
        @click="close"
      />
    </Transition>

    <!-- Modal -->
    <Transition name="scale-fade">
      <div
        v-if="isOpen"
        class="fixed inset-0 flex flex-col items-center overflow-hidden"
        style="z-index: 999999998 !important;"
        @click.self="close"
        @keydown.esc="close"
      >
        <!-- Close button - more prominent -->
        <button
          @click="close"
          class="fixed top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all duration-200 border border-white/20 hover:border-white/40 shadow-lg"
          style="z-index: 999999999 !important;"
          aria-label="Close search"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <!-- Keyboard hint -->
        <div class="absolute top-4 left-4 hidden md:flex items-center gap-2 text-white/40 text-sm">
          <kbd class="px-2 py-1 rounded bg-white/15 text-xs font-mono border border-white/10">ESC</kbd>
          <span>to close</span>
        </div>

        <!-- Search container -->
        <div class="w-full max-w-2xl px-4 pt-16 md:pt-24">
          <!-- Search header -->
          <div class="text-center mb-6">
            <h2 class="text-2xl md:text-3xl font-bold text-white mb-1">
              {{ heading }}
            </h2>
            <p class="text-white/50 text-sm">
              {{ lead }}
            </p>
          </div>

          <!-- Search input -->
          <div class="relative group">
            <!-- Glow effect -->
            <div class="absolute -inset-1 bg-gradient-to-r from-purple-600/50 via-pink-500/50 to-purple-600/50 rounded-2xl blur-lg opacity-50 group-focus-within:opacity-100 transition-opacity duration-300"></div>
            
            <div class="relative flex items-center bg-gray-900/80 border border-white/20 rounded-2xl overflow-hidden focus-within:border-purple-500/50 transition-colors duration-300">
              <!-- Search icon -->
              <div class="pl-5 pr-3">
                <svg class="w-6 h-6 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              <input
                ref="searchInputRef"
                v-model="searchQuery"
                type="text"
                :placeholder="searchPlaceholder"
                class="flex-1 bg-transparent text-white text-xl md:text-2xl py-5 pr-5 placeholder-white/30 focus:outline-none"
                @input="onSearchInput"
              />

              <!-- Loading spinner -->
              <div v-if="isLoading" class="pr-5">
                <div class="w-6 h-6 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
              </div>

              <!-- Clear button -->
              <button
                v-else-if="searchQuery"
                @click="clearSearch"
                class="pr-5 text-white/40 hover:text-white transition-colors"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Results count -->
          <div v-if="searchQuery && !isLoading && results.length > 0" class="mt-4 text-center text-white/40 text-sm">
            Found {{ results.length }} artist{{ results.length !== 1 ? 's' : '' }}
          </div>
        </div>

        <!-- Results area -->
        <div class="flex-1 w-full max-w-2xl px-4 py-4 overflow-y-auto">
          <!-- Empty state - initial -->
          <div v-if="!searchQuery" class="flex flex-col items-center justify-center py-16 text-center">
            <div class="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-6">
              <svg class="w-10 h-10 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <p class="text-white/50 text-lg">Start typing to discover artists</p>
            <p class="text-white/30 text-sm mt-2">Search by band name</p>
          </div>

          <!-- No results -->
          <div v-else-if="!isLoading && searchQuery.length >= 2 && results.length === 0" class="flex flex-col items-center justify-center py-16 text-center">
            <div class="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
              <svg class="w-10 h-10 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p class="text-white/50 text-lg">No artists found for "{{ searchQuery }}"</p>
            <p class="text-white/30 text-sm mt-2">Try a different search term</p>
          </div>

          <!-- Min characters hint -->
          <div v-else-if="searchQuery.length < 2 && searchQuery.length > 0" class="flex flex-col items-center justify-center py-16 text-center">
            <p class="text-white/40">Type at least 2 characters to search</p>
          </div>

          <!-- Results grid -->
          <div v-else-if="results.length > 0" class="space-y-3">
            <TransitionGroup name="list">
              <BandSearchCard
                v-for="(band, index) in results"
                :key="band.id"
                :band="band"
                :link-results="linkResults"
                :style="{ transitionDelay: `${index * 50}ms` }"
                @select="onBandSelect"
              />
            </TransitionGroup>
          </div>
        </div>

        <!-- Footer hint -->
        <div class="w-full py-4 border-t border-white/5 bg-black/50 backdrop-blur">
          <div class="max-w-3xl mx-auto px-6 flex items-center justify-center gap-6 text-white/30 text-sm">
            <div class="hidden md:flex items-center gap-2">
              <kbd class="px-2 py-1 rounded bg-white/10 text-xs font-mono">↑</kbd>
              <kbd class="px-2 py-1 rounded bg-white/10 text-xs font-mono">↓</kbd>
              <span>to navigate</span>
            </div>
            <div class="hidden md:flex items-center gap-2">
              <kbd class="px-2 py-1 rounded bg-white/10 text-xs font-mono">Enter</kbd>
              <span>to select</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-purple-400">✨</span>
              <span>Powered by MusicBizQR</span>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRuntimeConfig } from '#imports'
import { useDebounceFn } from '@vueuse/core'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  heading: {
    type: String,
    default: 'Discover Artists',
  },
  lead: {
    type: String,
    default: 'Find your next favorite band',
  },
  searchPlaceholder: {
    type: String,
    default: 'Search for bands...',
  },
  linkResults: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['close', 'select'])

const config = useRuntimeConfig()
const searchInputRef = ref(null)
const searchQuery = ref('')
const results = ref([])
const isLoading = ref(false)
const selectedIndex = ref(-1)

function close() {
  searchQuery.value = ''
  results.value = []
  emit('close')
}

function clearSearch() {
  searchQuery.value = ''
  results.value = []
  searchInputRef.value?.focus()
}

function onBandSelect(band) {
  emit('select', band)
  close()
}

const searchBands = useDebounceFn(async (query) => {
  if (!query || query.length < 2) {
    results.value = []
    isLoading.value = false
    return
  }

  isLoading.value = true
  
  try {
    const response = await fetch(
      `${config.public.strapiUrl}/api/bands/search?q=${encodeURIComponent(query)}&limit=12`
    )
    const data = await response.json()
    results.value = data.data || []
  } catch (error) {
    console.error('[BandSearchModal] Search failed:', error)
    results.value = []
  } finally {
    isLoading.value = false
  }
}, 300)

function onSearchInput() {
  isLoading.value = true
  selectedIndex.value = -1
  searchBands(searchQuery.value)
}

// Focus input when modal opens
watch(() => props.isOpen, async (isOpen) => {
  if (isOpen) {
    await nextTick()
    searchInputRef.value?.focus()
  }
})

// Keyboard navigation
function handleKeydown(e) {
  if (!props.isOpen) return

  if (e.key === 'Escape') {
    close()
    return
  }

  if (e.key === 'ArrowDown') {
    e.preventDefault()
    selectedIndex.value = Math.min(selectedIndex.value + 1, results.value.length - 1)
  }

  if (e.key === 'ArrowUp') {
    e.preventDefault()
    selectedIndex.value = Math.max(selectedIndex.value - 1, -1)
  }

  if (e.key === 'Enter' && selectedIndex.value >= 0 && results.value[selectedIndex.value]) {
    onBandSelect(results.value[selectedIndex.value])
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
/* Fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Scale fade transition */
.scale-fade-enter-active,
.scale-fade-leave-active {
  transition: all 0.3s ease;
}
.scale-fade-enter-from,
.scale-fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

/* List transition */
.list-enter-active {
  transition: all 0.4s ease;
}
.list-leave-active {
  transition: all 0.2s ease;
}
.list-enter-from {
  opacity: 0;
  transform: translateY(20px);
}
.list-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}
</style>
