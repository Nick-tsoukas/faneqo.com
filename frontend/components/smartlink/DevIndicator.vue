<template>
  <div 
    v-if="showIndicator"
    class="fixed bottom-2 left-2 z-[200] px-2 py-1 rounded bg-purple-600/90 text-white text-[10px] font-mono font-bold uppercase tracking-wider shadow-lg border border-purple-400/50"
  >
    🔴 Live Surface: ON
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { getDemoFlag } from '@/composables/useDemoFlags'

// Only show in development when Live Surface is enabled
const showIndicator = computed(() => {
  if (!getDemoFlag('SMARTLINK_LIVE_SURFACE_ENABLED')) return false
  // Check if we're in development mode
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production') return false
  return true
})
</script>
