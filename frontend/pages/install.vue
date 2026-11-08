<template>
  <div class="min-h-screen bg-black flex flex-col">
    <!-- Main content -->
    <div class="flex-1 flex flex-col items-center justify-center px-6 py-12">
      <div class="max-w-sm w-full text-center">
        <!-- App Icon -->
        <div class="mb-8">
          <img
            src="/icons/faneqo-icon-512.png"
            alt="Faneqo"
            class="w-28 h-28 mx-auto rounded-3xl shadow-2xl shadow-accent/20"
          />
        </div>

        <!-- Title -->
        <h1 class="text-3xl font-bold text-white mb-3">
          Install Faneqo
        </h1>

        <!-- Subtitle -->
        <p class="text-gray-400 text-lg mb-8">
          Opens like an app. Faster access. Works better at shows.
        </p>

        <!-- Benefits -->
        <div class="space-y-4 mb-10 text-left">
          <div class="flex items-center gap-4 p-4 bg-gray-900/50 rounded-xl border border-gray-800">
            <div class="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-neon-purple flex items-center justify-center flex-shrink-0">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <p class="text-white font-medium">Lightning fast</p>
              <p class="text-gray-500 text-sm">Instant access from your home screen</p>
            </div>
          </div>

          <div class="flex items-center gap-4 p-4 bg-gray-900/50 rounded-xl border border-gray-800">
            <div class="w-10 h-10 rounded-full bg-gradient-to-br from-neon-green to-complementary1 flex items-center justify-center flex-shrink-0">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <div>
              <p class="text-white font-medium">Works at shows</p>
              <p class="text-gray-500 text-sm">Reliable even with spotty venue wifi</p>
            </div>
          </div>

          <div class="flex items-center gap-4 p-4 bg-gray-900/50 rounded-xl border border-gray-800">
            <div class="w-10 h-10 rounded-full bg-gradient-to-br from-complementary2 to-accent flex items-center justify-center flex-shrink-0">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <div>
              <p class="text-white font-medium">Stay updated</p>
              <p class="text-gray-500 text-sm">Get notified about new features</p>
            </div>
          </div>
        </div>

        <!-- Install Button - Android/Desktop Chrome -->
        <div v-if="canInstall" class="space-y-4">
          <button
            @click="handleInstall"
            :disabled="installing"
            class="w-full px-8 py-4 bg-gradient-to-r from-accent to-neon-purple text-white font-semibold rounded-full hover:opacity-90 transition-all duration-200 shadow-lg shadow-accent/25 disabled:opacity-50"
          >
            <span v-if="!installing">Install Faneqo</span>
            <span v-else class="flex items-center justify-center gap-2">
              <svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Installing...
            </span>
          </button>
        </div>

        <!-- iOS Instructions -->
        <div v-else-if="isIOS" class="space-y-6">
          <div class="p-6 bg-gray-900/50 rounded-2xl border border-gray-800 text-left">
            <p class="text-white font-medium mb-4 text-center">Add to Home Screen</p>
            
            <div class="space-y-4">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-white font-bold text-sm">1</div>
                <div class="flex items-center gap-2">
                  <span class="text-gray-300">Tap</span>
                  <svg class="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  <span class="text-gray-300">Share</span>
                </div>
              </div>
              
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-white font-bold text-sm">2</div>
                <div class="flex items-center gap-2">
                  <span class="text-gray-300">Tap</span>
                  <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                  </svg>
                  <span class="text-gray-300">Add to Home Screen</span>
                </div>
              </div>
              
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-white font-bold text-sm">3</div>
                <span class="text-gray-300">Tap <span class="text-blue-400 font-medium">Add</span></span>
              </div>
            </div>
          </div>
        </div>

        <!-- Already installed or not supported -->
        <div v-else class="text-gray-500 text-sm">
          <p v-if="isStandalone" class="text-green-400">
            ✓ Faneqo is already installed
          </p>
          <p v-else>
            Open this page in Chrome or Safari to install
          </p>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="py-6 text-center">
      <NuxtLink to="/" class="text-gray-500 text-sm hover:text-white transition-colors">
        Continue in browser →
      </NuxtLink>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { usePwa } from '~/composables/usePwa'

definePageMeta({
  layout: false
})

useHead({
  title: 'Install Faneqo',
  meta: [
    { name: 'description', content: 'Install Faneqo for instant access from your home screen. Works faster at shows.' }
  ]
})

useSeoMeta({
  ogTitle: 'Install Faneqo',
  ogDescription: 'Install Faneqo for instant access from your home screen. Works faster at shows.',
  ogImage: '/icons/faneqo-icon-512.png',
})

const { canInstall, promptInstall } = usePwa()

const installing = ref(false)
const isIOS = ref(false)
const isStandalone = ref(false)

onMounted(() => {
  // Detect iOS
  const ua = navigator.userAgent
  isIOS.value = /iPad|iPhone|iPod/.test(ua) && !window.MSStream
  
  // Detect if already installed (standalone mode)
  isStandalone.value = window.matchMedia('(display-mode: standalone)').matches || 
                       window.navigator.standalone === true
})

const handleInstall = async () => {
  installing.value = true
  try {
    const success = await promptInstall()
    if (success) {
      // Could show a success message or redirect
    }
  } finally {
    installing.value = false
  }
}
</script>
