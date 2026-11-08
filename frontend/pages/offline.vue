<template>
  <div class="min-h-screen bg-black flex flex-col items-center justify-center px-6 text-center">
    <div class="max-w-md">
      <!-- Icon -->
      <div class="mb-8">
        <div class="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-accent to-neon-purple flex items-center justify-center">
          <svg class="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3" />
          </svg>
        </div>
      </div>

      <!-- Title -->
      <h1 class="text-3xl font-bold text-white mb-4">
        You're Offline
      </h1>

      <!-- Message -->
      <p class="text-gray-400 text-lg mb-8">
        Some live data may be unavailable. Check your connection and try again.
      </p>

      <!-- Retry Button -->
      <button
        @click="retry"
        class="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-accent to-neon-purple text-white font-semibold rounded-full hover:opacity-90 transition-all duration-200 shadow-lg shadow-accent/25"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Try Again
      </button>

      <!-- Secondary link -->
      <p class="mt-6 text-gray-500 text-sm">
        Cached pages may still be available
      </p>
    </div>

    <!-- Brand footer -->
    <div class="absolute bottom-8">
      <img src="/icons/icon-192.png" alt="MBQ" class="w-10 h-10 opacity-30" />
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: false
})

useHead({
  title: 'Offline - MusicBizQR'
})

const retry = () => {
  window.location.reload()
}
</script>
