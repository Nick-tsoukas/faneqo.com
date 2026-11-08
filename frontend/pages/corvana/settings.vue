<template>
  <div class="p-8">
    <div class="max-w-2xl mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-white mb-2">Settings</h1>
        <p class="text-white/50">Configure Corvana preferences</p>
      </div>

      <!-- Presentation Settings -->
      <div class="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
        <h2 class="text-lg font-semibold text-white mb-6 flex items-center gap-2">
          <svg class="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Presentation Defaults
        </h2>

        <div class="space-y-6">
          <!-- Start in Present Mode -->
          <div class="flex items-center justify-between">
            <div>
              <div class="text-white font-medium">Start in Present Mode</div>
              <div class="text-white/40 text-sm">Open decks in fullscreen presentation mode by default</div>
            </div>
            <button 
              @click="toggleSetting('startInPresentMode')"
              :class="settings.startInPresentMode ? 'bg-purple-500' : 'bg-white/10'"
              class="relative w-12 h-7 rounded-full transition-colors"
            >
              <div 
                :class="settings.startInPresentMode ? 'translate-x-6' : 'translate-x-1'"
                class="absolute top-1 w-5 h-5 bg-white rounded-full transition-transform"
              ></div>
            </button>
          </div>

          <!-- Use Progress Dots -->
          <div class="flex items-center justify-between">
            <div>
              <div class="text-white font-medium">Use Progress Dots</div>
              <div class="text-white/40 text-sm">Show slide progress dots instead of numbers</div>
            </div>
            <button 
              @click="toggleSetting('useProgressDots')"
              :class="settings.useProgressDots ? 'bg-purple-500' : 'bg-white/10'"
              class="relative w-12 h-7 rounded-full transition-colors"
            >
              <div 
                :class="settings.useProgressDots ? 'translate-x-6' : 'translate-x-1'"
                class="absolute top-1 w-5 h-5 bg-white rounded-full transition-transform"
              ></div>
            </button>
          </div>
        </div>
      </div>

      <!-- Accessibility Settings -->
      <div class="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h2 class="text-lg font-semibold text-white mb-6 flex items-center gap-2">
          <svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          Accessibility
        </h2>

        <div class="space-y-6">
          <!-- Reduce Motion -->
          <div class="flex items-center justify-between">
            <div>
              <div class="text-white font-medium">Reduce Motion</div>
              <div class="text-white/40 text-sm">Minimize animations and transitions</div>
            </div>
            <button 
              @click="toggleSetting('reduceMotion')"
              :class="settings.reduceMotion ? 'bg-purple-500' : 'bg-white/10'"
              class="relative w-12 h-7 rounded-full transition-colors"
            >
              <div 
                :class="settings.reduceMotion ? 'translate-x-6' : 'translate-x-1'"
                class="absolute top-1 w-5 h-5 bg-white rounded-full transition-transform"
              ></div>
            </button>
          </div>
        </div>
      </div>

      <!-- Save Indicator -->
      <div class="mt-6 text-center">
        <p class="text-white/30 text-sm">Settings are saved automatically</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'

definePageMeta({
  layout: 'corvana'
})

const settings = ref({
  startInPresentMode: false,
  useProgressDots: true,
  reduceMotion: false
})

// Load settings from localStorage
onMounted(() => {
  try {
    const saved = JSON.parse(localStorage.getItem('corvana_settings') || '{}')
    settings.value = { ...settings.value, ...saved }
  } catch (e) {
    // Use defaults
  }
})

// Save settings when changed
watch(settings, (newSettings) => {
  localStorage.setItem('corvana_settings', JSON.stringify(newSettings))
}, { deep: true })

const toggleSetting = (key) => {
  settings.value[key] = !settings.value[key]
}
</script>
