<template>
  <button
    @click="$emit('select', item)"
    class="shareable-card flex-shrink-0 w-[280px] md:w-[320px] snap-start bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/10 rounded-2xl p-5 text-left hover:border-purple-500/40 hover:from-white/[0.08] transition-all group relative overflow-hidden"
  >
    <!-- Decorative gradient orb -->
    <div class="absolute -top-12 -right-12 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-purple-500/20 transition-colors"></div>

    <!-- Window label badge -->
    <div class="flex items-center gap-2 mb-3 relative z-10">
      <span 
        class="px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide"
        :class="badgeClass"
      >
        {{ item.windowLabel }}
      </span>
    </div>

    <!-- Title -->
    <h3 class="text-white text-lg font-bold mb-2 line-clamp-2 group-hover:text-purple-200 transition-colors relative z-10">
      {{ item.title }}
    </h3>

    <!-- Primary stat -->
    <p class="text-purple-400 text-sm font-semibold mb-1 relative z-10">
      {{ item.primaryStat }}
    </p>

    <!-- Secondary stat -->
    <p v-if="item.secondaryStat" class="text-white/50 text-sm mb-4 line-clamp-1 relative z-10">
      {{ item.secondaryStat }}
    </p>
    <div v-else class="mb-4"></div>

    <!-- Share Now button -->
    <button
      @click.stop="$emit('share', item)"
      class="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold text-sm hover:from-purple-500 hover:to-blue-500 transition-all flex items-center justify-center gap-2 relative z-10"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
      </svg>
      Share Now
    </button>
  </button>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
})

defineEmits(['select', 'share'])

const badgeClass = computed(() => {
  switch (props.item.source) {
    case 'recap':
      return 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
    case 'spike':
      return 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
    case 'prompt':
      return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
    default:
      return 'bg-white/10 text-white/60 border border-white/20'
  }
})
</script>

<style scoped>
.shareable-card {
  min-height: 200px;
}

.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
