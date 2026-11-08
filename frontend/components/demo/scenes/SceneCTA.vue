<template>
  <div class="min-h-[60vh] flex items-center justify-center">
    <div class="text-center max-w-2xl mx-auto px-4">
      <!-- Logo -->
      <div class="mb-8">
        <img src="@/assets/musicbizlogo.png" alt="MBQ" class="h-12 mx-auto" />
      </div>

      <!-- Headline -->
      <h1 class="text-4xl md:text-5xl font-bold text-white mb-4">
        Ready to grow your audience?
      </h1>

      <!-- Subline -->
      <p class="text-xl text-white/70 mb-8">
        Join thousands of artists using MBQ to turn every scan into a connection.
      </p>

      <!-- Value Props -->
      <div class="flex flex-wrap justify-center gap-4 mb-10">
        <div class="flex items-center gap-2 text-white/80">
          <svg class="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" />
          </svg>
          <span>Smart links with full analytics</span>
        </div>
        <div class="flex items-center gap-2 text-white/80">
          <svg class="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" />
          </svg>
          <span>Fan moments that drive shares</span>
        </div>
        <div class="flex items-center gap-2 text-white/80">
          <svg class="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" />
          </svg>
          <span>Real-time city & platform data</span>
        </div>
      </div>

      <!-- CTA Buttons -->
      <div class="flex flex-col sm:flex-row justify-center gap-4 mb-8">
        <NuxtLink
          to="/signup"
          class="px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 text-white font-semibold text-lg shadow-lg hover:from-purple-500 hover:to-violet-500 transition transform hover:-translate-y-0.5"
        >
          Start Free Trial
        </NuxtLink>
        <NuxtLink
          to="/contact"
          class="px-8 py-4 rounded-xl border border-white/20 text-white font-semibold text-lg hover:bg-white/5 transition"
        >
          Book a 10-min Setup
        </NuxtLink>
      </div>

      <!-- Secondary Links -->
      <div class="flex justify-center gap-6 text-sm">
        <NuxtLink to="/" class="text-white/50 hover:text-white transition">
          View Pricing
        </NuxtLink>
        <NuxtLink to="/contact" class="text-white/50 hover:text-white transition">
          Contact Sales
        </NuxtLink>
        <button
          type="button"
          class="text-white/50 hover:text-white transition"
          @click="restartDemo"
        >
          Restart Demo
        </button>
      </div>

      <!-- Stats Recap -->
      <div class="mt-12 pt-8 border-t border-white/10">
        <div class="text-white/40 text-sm mb-4">Your demo session</div>
        <div class="grid grid-cols-3 gap-4 max-w-md mx-auto">
          <div class="text-center">
            <div class="text-2xl font-bold text-white tabular-nums">{{ demoStats.profileVisits }}</div>
            <div class="text-white/50 text-xs">Visits Tracked</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-white tabular-nums">{{ demoStats.momentsCreated }}</div>
            <div class="text-white/50 text-xs">Moments Created</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-white tabular-nums">{{ demoStats.momentsShared }}</div>
            <div class="text-white/50 text-xs">Moments Shared</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useDemoShow } from '@/composables/useDemoShow'

const { demoStats, restart } = useDemoShow()

function restartDemo() {
  restart()
}
</script>
