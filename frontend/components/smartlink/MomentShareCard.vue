<template>
  <div class="moment-share-card">
    <!-- Card Preview -->
    <div 
      class="relative overflow-hidden rounded-2xl border border-white/10 p-5"
      :class="cardClasses"
    >
      <!-- Background decoration -->
      <div class="absolute inset-0 opacity-30 pointer-events-none">
        <div class="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl" />
        <div class="absolute bottom-0 left-0 w-24 h-24 bg-pink-500/20 rounded-full blur-2xl" />
      </div>

      <div class="relative text-center">
        <!-- Icon -->
        <div class="text-3xl mb-2">{{ momentIcon }}</div>
        
        <!-- Headline -->
        <div class="text-lg font-bold text-white">{{ momentHeadline }}</div>
        
        <!-- Subtext -->
        <div class="text-white/60 text-sm mt-1">{{ momentSubtext }}</div>
        
        <!-- Band name -->
        <div class="text-purple-300 font-semibold mt-3">{{ bandName }}</div>
      </div>
    </div>

    <!-- Share Button -->
    <button
      @click="handleShare"
      class="w-full mt-3 py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white font-semibold text-sm transition flex items-center justify-center gap-2"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
      </svg>
      Share this moment
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  momentType: {
    type: String,
    default: 'default',
    validator: (v) => ['default', 'you_were_here', 'support_received', 'heating_up', 'post_show'].includes(v)
  },
  bandName: {
    type: String,
    default: 'the band'
  },
  customHeadline: String,
  customSubtext: String,
})

const emit = defineEmits(['share'])

const momentConfig = {
  default: {
    icon: '🎵',
    headline: 'I found something good',
    subtext: 'Check them out',
    gradient: 'from-purple-900/40 via-violet-900/30 to-pink-900/40',
  },
  you_were_here: {
    icon: '🎤',
    headline: 'I was there',
    subtext: 'Live show energy',
    gradient: 'from-orange-900/40 via-amber-900/30 to-yellow-900/40',
  },
  support_received: {
    icon: '💜',
    headline: 'I backed the band',
    subtext: 'Supporting independent music',
    gradient: 'from-purple-900/40 via-pink-900/30 to-rose-900/40',
  },
  heating_up: {
    icon: '🔥',
    headline: 'Something\'s happening',
    subtext: 'The buzz is real',
    gradient: 'from-red-900/40 via-orange-900/30 to-amber-900/40',
  },
  post_show: {
    icon: '🙏',
    headline: 'What a night',
    subtext: 'Thanks for the show',
    gradient: 'from-blue-900/40 via-purple-900/30 to-violet-900/40',
  },
}

const config = computed(() => momentConfig[props.momentType] || momentConfig.default)

const momentIcon = computed(() => config.value.icon)
const momentHeadline = computed(() => props.customHeadline || config.value.headline)
const momentSubtext = computed(() => props.customSubtext || config.value.subtext)

const cardClasses = computed(() => {
  return `bg-gradient-to-br ${config.value.gradient}`
})

function handleShare() {
  emit('share', {
    type: props.momentType,
    headline: momentHeadline.value,
    subtext: momentSubtext.value,
    bandName: props.bandName,
  })
}
</script>
