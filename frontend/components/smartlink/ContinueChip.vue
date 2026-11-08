<template>
  <Transition name="slide-fade">
    <div 
      v-if="showChip && continueData"
      class="continue-chip flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-500/10 to-violet-500/5 border border-purple-400/20"
    >
      <div class="flex items-center gap-3 min-w-0">
        <span class="text-lg">{{ continueData.icon }}</span>
        <div class="min-w-0">
          <div class="text-white text-sm font-medium truncate">{{ continueData.label }}</div>
          <div class="text-white/50 text-xs">Pick up where you left off</div>
        </div>
      </div>
      
      <div class="flex items-center gap-2 shrink-0">
        <button
          @click="handleContinue"
          class="px-3 py-1.5 rounded-lg bg-purple-500/20 border border-purple-400/30 text-purple-300 text-sm font-medium hover:bg-purple-500/30 transition"
        >
          Continue
        </button>
        <button
          @click="dismiss"
          class="p-1.5 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/5 transition"
          aria-label="Dismiss"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const props = defineProps({
  bandSlug: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['continue', 'dismiss'])

const STORAGE_KEY_PREFIX = 'smartlink_continue_'
const DISMISS_KEY_PREFIX = 'smartlink_continue_dismissed_'
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

const lastAction = ref(null)
const isDismissed = ref(false)

const platformIcons = {
  spotify: '🎵',
  appleMusic: '🍎',
  youtube: '▶️',
  soundcloud: '☁️',
  bandcamp: '💿',
  deezer: '🎧',
  featured_song: '🎵',
  featured_video: '🎬',
}

const platformLabels = {
  spotify: 'Continue on Spotify',
  appleMusic: 'Continue on Apple Music',
  youtube: 'Continue on YouTube',
  soundcloud: 'Continue on SoundCloud',
  bandcamp: 'Continue on Bandcamp',
  deezer: 'Continue on Deezer',
  featured_song: 'Continue listening',
  featured_video: 'Continue watching',
}

const showChip = computed(() => {
  return lastAction.value && !isDismissed.value
})

const continueData = computed(() => {
  if (!lastAction.value) return null
  
  return {
    icon: platformIcons[lastAction.value.type] || '🎵',
    label: platformLabels[lastAction.value.type] || 'Continue',
    url: lastAction.value.url,
    type: lastAction.value.type,
  }
})

function loadLastAction() {
  if (typeof window === 'undefined') return
  
  try {
    const key = STORAGE_KEY_PREFIX + props.bandSlug
    const stored = localStorage.getItem(key)
    if (!stored) return
    
    const data = JSON.parse(stored)
    
    // Check if expired
    if (Date.now() - data.timestamp > MAX_AGE_MS) {
      localStorage.removeItem(key)
      return
    }
    
    lastAction.value = data
    
    // Check if dismissed
    const dismissKey = DISMISS_KEY_PREFIX + props.bandSlug
    const dismissedAt = localStorage.getItem(dismissKey)
    if (dismissedAt && Date.now() - parseInt(dismissedAt) < 24 * 60 * 60 * 1000) {
      isDismissed.value = true
    }
  } catch (err) {
    console.warn('[ContinueChip] Failed to load:', err)
  }
}

function handleContinue() {
  if (!continueData.value) return
  
  if (continueData.value.url) {
    window.open(continueData.value.url, '_blank')
  }
  
  emit('continue', continueData.value)
}

function dismiss() {
  isDismissed.value = true
  
  if (typeof window !== 'undefined') {
    const dismissKey = DISMISS_KEY_PREFIX + props.bandSlug
    localStorage.setItem(dismissKey, Date.now().toString())
  }
  
  emit('dismiss')
}

/**
 * Record a user action for "continue" functionality
 * Call this from parent when user clicks a link or plays media
 */
function recordAction(type, url = null) {
  if (typeof window === 'undefined') return
  
  try {
    const key = STORAGE_KEY_PREFIX + props.bandSlug
    const data = {
      type,
      url,
      timestamp: Date.now(),
    }
    localStorage.setItem(key, JSON.stringify(data))
    lastAction.value = data
  } catch (err) {
    console.warn('[ContinueChip] Failed to save:', err)
  }
}

onMounted(() => {
  loadLastAction()
})

defineExpose({
  recordAction,
})
</script>

<style scoped>
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
