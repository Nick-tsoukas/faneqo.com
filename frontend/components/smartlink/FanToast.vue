<template>
  <Teleport to="body">
    <Transition name="toast-slide">
      <div 
        v-if="visible"
        class="fixed bottom-6 left-1/2 -translate-x-1/2 z-[90] px-5 py-3 rounded-xl bg-gray-900/95 border border-white/10 shadow-xl backdrop-blur-sm max-w-sm"
      >
        <div class="flex items-center gap-3">
          <span class="text-lg">{{ currentToast?.icon }}</span>
          <span class="text-white text-sm">{{ currentToast?.message }}</span>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed } from 'vue'

// Toast queue and state
const toastQueue = ref([])
const currentToast = ref(null)
const visible = ref(false)

// Rate limiting
const TOAST_DURATION = 3000
const MIN_INTERVAL = 5000 // Minimum time between toasts
let lastToastTime = 0
let toastTimeout = null

// Predefined toast messages by action type
const TOAST_MESSAGES = {
  follow: {
    icon: '💜',
    messages: [
      'Following! Stay in the loop.',
      'You\'re in. Welcome to the fanbase.',
    ]
  },
  save: {
    icon: '⭐',
    messages: [
      'Saved. Welcome back anytime.',
      'Added to your collection.',
    ]
  },
  share: {
    icon: '🙌',
    messages: [
      'Shared — thanks for spreading the word.',
      'You\'re helping grow the fanbase.',
    ]
  },
  payment: {
    icon: '💜',
    messages: [
      'You\'re supporting independent music.',
      'Thanks for backing the band.',
      'Real fans support real music.',
    ]
  },
  link_click: {
    icon: '🎵',
    messages: [
      'Enjoy the music!',
    ]
  },
}

/**
 * Show a toast for a specific action
 * @param {string} actionType - Type of action (follow, save, share, payment, link_click)
 * @param {Object} options - Optional overrides
 */
function showToast(actionType, options = {}) {
  const now = Date.now()
  
  // Rate limit check
  if (now - lastToastTime < MIN_INTERVAL && !options.force) {
    return
  }
  
  const toastConfig = TOAST_MESSAGES[actionType]
  if (!toastConfig && !options.message) return
  
  const toast = {
    id: Date.now(),
    icon: options.icon || toastConfig?.icon || '✨',
    message: options.message || toastConfig.messages[Math.floor(Math.random() * toastConfig.messages.length)],
  }
  
  // If a toast is currently showing, queue this one
  if (visible.value) {
    toastQueue.value.push(toast)
    return
  }
  
  displayToast(toast)
}

function displayToast(toast) {
  currentToast.value = toast
  visible.value = true
  lastToastTime = Date.now()
  
  // Auto-hide after duration
  if (toastTimeout) clearTimeout(toastTimeout)
  toastTimeout = setTimeout(() => {
    hideToast()
  }, TOAST_DURATION)
}

function hideToast() {
  visible.value = false
  currentToast.value = null
  
  // Check queue for next toast
  if (toastQueue.value.length > 0) {
    setTimeout(() => {
      const next = toastQueue.value.shift()
      if (next) displayToast(next)
    }, 500)
  }
}

// Expose methods for parent component
defineExpose({
  showToast,
})
</script>

<style scoped>
.toast-slide-enter-active,
.toast-slide-leave-active {
  transition: all 0.3s ease;
}

.toast-slide-enter-from {
  opacity: 0;
  transform: translate(-50%, 20px);
}

.toast-slide-leave-to {
  opacity: 0;
  transform: translate(-50%, 20px);
}
</style>
