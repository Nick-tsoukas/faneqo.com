<template>
  <button
    @click="$emit('select', shareable)"
    class="flex-shrink-0 w-[200px] snap-start bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-xl p-3 text-left hover:border-white/20 hover:bg-white/[0.04] transition-all group"
  >
    <!-- Window label badge -->
    <div class="flex items-center gap-2 mb-2">
      <span 
        class="px-2 py-0.5 rounded-full text-[10px] font-medium"
        :class="badgeClass"
      >
        {{ shareable.windowLabel }}
      </span>
    </div>

    <!-- Title -->
    <h4 class="text-white text-sm font-semibold line-clamp-2 mb-1 group-hover:text-purple-300 transition-colors">
      {{ shareable.title }}
    </h4>

    <!-- Stat -->
    <p class="text-purple-400 text-xs font-medium mb-1">{{ shareable.stat }}</p>

    <!-- Why (truncated) -->
    <p class="text-white/50 text-xs line-clamp-2">{{ shareable.why }}</p>

    <!-- Share icon indicator -->
    <div class="mt-2 flex items-center gap-1 text-white/40 text-xs">
      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
      </svg>
      <span>Tap to share</span>
    </div>
  </button>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  shareable: {
    type: Object,
    required: true,
  },
})

defineEmits(['select'])

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
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
