<template>
  <Transition
    enter-active-class="transition-all duration-300 ease-out"
    enter-from-class="opacity-0 -translate-y-2"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition-all duration-200 ease-in"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 -translate-y-2"
  >
    <div
      v-if="showIndicator"
      class="fixed top-4 left-1/2 -translate-x-1/2 z-50"
    >
      <NuxtLink
        :to="isOnline ? undefined : '/offline'"
        :class="[
          'inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium shadow-lg backdrop-blur-sm',
          isOnline 
            ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
            : 'bg-red-500/20 text-red-400 border border-red-500/30 cursor-pointer hover:bg-red-500/30'
        ]"
      >
        <span 
          :class="[
            'w-2 h-2 rounded-full',
            isOnline ? 'bg-green-400' : 'bg-red-400 animate-pulse'
          ]"
        />
        {{ isOnline ? 'Back online' : 'Offline mode' }}
      </NuxtLink>
    </div>
  </Transition>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { usePwa } from '~/composables/usePwa'

const { isOnline } = usePwa()

const showIndicator = ref(false)
const wasOffline = ref(false)
let hideTimeout = null

const clearHideTimeout = () => {
  if (hideTimeout) {
    clearTimeout(hideTimeout)
    hideTimeout = null
  }
}

watch(isOnline, (online, prevOnline) => {
  clearHideTimeout()
  
  if (!online) {
    // Going offline - show immediately
    wasOffline.value = true
    showIndicator.value = true
  } else if (wasOffline.value) {
    // Coming back online after being offline
    showIndicator.value = true
    hideTimeout = setTimeout(() => {
      showIndicator.value = false
    }, 3000)
  }
}, { immediate: false })

onMounted(() => {
  // Initial offline check
  if (!isOnline.value) {
    wasOffline.value = true
    showIndicator.value = true
  }
})

onUnmounted(() => {
  clearHideTimeout()
})
</script>
