<template>
  <div 
    class="relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-purple-900/20 via-black/40 to-emerald-900/10 p-5"
  >
    <!-- Window label badge -->
    <div class="flex items-center gap-2 mb-3">
      <span 
        class="px-2.5 py-1 rounded-full text-xs font-medium"
        :class="badgeClass"
      >
        {{ categoryIcon }} {{ shareable.windowLabel }}
      </span>
    </div>

    <!-- Title -->
    <h3 class="text-xl font-bold text-white mb-2">{{ shareable.title }}</h3>

    <!-- Stat -->
    <p class="text-purple-400 text-sm font-semibold mb-2">{{ shareable.stat }}</p>

    <!-- Why -->
    <p class="text-white/60 text-sm mb-4">{{ shareable.why }}</p>

    <!-- Actions row -->
    <div class="flex items-center gap-3">
      <button
        @click="$emit('share', shareable)"
        class="flex-1 py-2.5 px-4 rounded-lg bg-gradient-to-r from-purple-600 to-emerald-600 text-white font-semibold text-sm hover:from-purple-500 hover:to-emerald-500 transition-all flex items-center justify-center gap-2"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
        Share Now
      </button>

      <button
        @click="$emit('select', shareable)"
        class="py-2.5 px-4 rounded-lg border border-white/20 text-white/80 text-sm hover:bg-white/5 transition-colors"
      >
        Customize
      </button>
    </div>

    <!-- Decorative elements -->
    <div class="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
    <div class="absolute bottom-0 left-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  shareable: {
    type: Object,
    required: true,
  },
})

defineEmits(['select', 'share'])

const badgeClass = computed(() => {
  switch (props.shareable.category) {
    case 'recap':
      return 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
    case 'spike':
      return 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
    case 'prompt':
      return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
    default:
      return 'bg-white/10 text-white/60 border border-white/20'
  }
})

const categoryIcon = computed(() => {
  switch (props.shareable.category) {
    case 'recap':
      return '📊'
    case 'spike':
      return '⚡'
    case 'prompt':
      return '🔥'
    default:
      return '✨'
  }
})
</script>
