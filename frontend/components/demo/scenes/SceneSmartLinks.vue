<template>
  <div class="w-full">
    <!-- Subtle Demo Overlay -->
    <div class="flex items-center justify-between mb-4 px-2">
      <span class="text-white/40 text-xs font-medium uppercase tracking-wide">Demo: Smart Link</span>
      <div class="flex items-center gap-2">
        <button
          type="button"
          class="px-3 py-1.5 text-xs text-white/60 hover:text-white border border-white/10 rounded-lg hover:bg-white/5 transition flex items-center gap-1.5"
          @click="simulateClicks"
        >
          <span class="text-[10px]">+5</span>
          Simulate clicks
        </button>
        <button
          type="button"
          class="px-3 py-1.5 text-xs bg-purple-600/20 text-purple-300 border border-purple-400/30 rounded-lg hover:bg-purple-600/30 transition flex items-center gap-1.5"
          @click="nextScene"
        >
          Next
          <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Real Smart Link Component -->
    <div class="max-w-2xl mx-auto">
      <SmartLinkDemoInline />
    </div>
  </div>
</template>

<script setup>
import { useDemoShow } from '@/composables/useDemoShow'
import SmartLinkDemoInline from '@/components/demo/SmartLinkDemoInline.vue'

const { trackAction, goToScene } = useDemoShow()

function simulateClicks() {
  trackAction('spotify')
  trackAction('spotify')
  trackAction('follow')
  trackAction('tickets')
  trackAction('instagram')
}

function nextScene() {
  goToScene(1)
}
</script>
