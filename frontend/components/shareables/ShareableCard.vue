<template>
  <button
    @click="$emit('select', item)"
    class="shareable-card flex-shrink-0 snap-start text-left group relative overflow-hidden rounded-2xl"
    :class="[sizeClasses]"
    :style="cardStyle"
  >
    <!-- Background gradient based on accent -->
    <div class="absolute inset-0 bg-gradient-to-br" :class="gradientClasses"></div>
    
    <!-- Accent glow orb -->
    <div 
      class="absolute -top-16 -right-16 w-40 h-40 rounded-full blur-3xl opacity-30 transition-opacity group-hover:opacity-50"
      :style="{ backgroundColor: accentColors.primary }"
    ></div>
    
    <!-- Secondary decorative orb -->
    <div 
      class="absolute -bottom-12 -left-12 w-32 h-32 rounded-full blur-2xl opacity-15"
      :style="{ backgroundColor: accentColors.primary }"
    ></div>

    <!-- Content -->
    <div class="relative z-10 h-full flex flex-col p-5">
      <!-- Window label badge -->
      <div class="flex items-center gap-2 mb-3">
        <span 
          class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border"
          :style="badgeStyle"
        >
          {{ item.windowLabel }}
        </span>
      </div>

      <!-- Headline -->
      <h3 class="text-white text-base font-bold mb-3 line-clamp-2 leading-tight">
        {{ item.title }}
      </h3>

      <!-- Hero stat - BIG -->
      <div class="flex-1 flex items-center justify-center my-2 max-w-full overflow-hidden">
        <span 
          class="text-4xl md:text-5xl font-black tracking-tight text-center leading-none max-w-full break-words"
          :style="heroStyle"
        >
          {{ item.primaryStat }}
        </span>
      </div>

      <!-- Proof line -->
      <p class="text-white/60 text-xs font-medium text-center mb-4 line-clamp-1 uppercase tracking-wide">
        {{ item.secondaryStat }}
      </p>

      <!-- Share Now button -->
      <button
        @click.stop="$emit('share', item)"
        class="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold text-sm hover:from-purple-500 hover:to-blue-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
        Share
      </button>
    </div>
  </button>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
  size: {
    type: String,
    default: 'default', // 'default' | 'compact'
  },
})

defineEmits(['select', 'share'])

// Accent color palette
const ACCENT_COLORS = {
  violet: { primary: '#8B5CF6', glow: 'rgba(139, 92, 246, 0.3)', gradient: 'from-violet-900/80 via-gray-900 to-gray-900' },
  blue: { primary: '#3B82F6', glow: 'rgba(59, 130, 246, 0.3)', gradient: 'from-blue-900/80 via-gray-900 to-gray-900' },
  emerald: { primary: '#10B981', glow: 'rgba(16, 185, 129, 0.3)', gradient: 'from-emerald-900/80 via-gray-900 to-gray-900' },
  amber: { primary: '#F59E0B', glow: 'rgba(245, 158, 11, 0.3)', gradient: 'from-amber-900/80 via-gray-900 to-gray-900' },
  rose: { primary: '#F43F5E', glow: 'rgba(244, 63, 94, 0.3)', gradient: 'from-rose-900/80 via-gray-900 to-gray-900' },
}

const accentColors = computed(() => {
  return ACCENT_COLORS[props.item.accent] || ACCENT_COLORS.violet
})

const gradientClasses = computed(() => {
  return accentColors.value.gradient
})

const sizeClasses = computed(() => {
  return props.size === 'compact' 
    ? 'w-full min-h-[280px]' 
    : 'w-full md:w-[320px] min-h-[320px]'
})

const cardStyle = computed(() => ({
  border: `1px solid ${accentColors.value.primary}33`,
}))

const badgeStyle = computed(() => ({
  backgroundColor: `${accentColors.value.primary}20`,
  color: accentColors.value.primary,
  borderColor: `${accentColors.value.primary}40`,
}))

const heroStyle = computed(() => ({
  background: `linear-gradient(135deg, #F472B6, ${accentColors.value.primary}, #60A5FA, #34D399)`,
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
}))
</script>

<style scoped>
.shareable-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.shareable-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.5);
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
