<template>
  <div 
    v-if="content"
    class="now-banner w-full px-4 py-3 rounded-xl transition-all duration-300"
    :class="bannerClasses"
  >
    <div class="flex items-center justify-between gap-3">
      <div class="flex items-center gap-3 min-w-0">
        <!-- Icon -->
        <span v-if="content.icon" class="text-xl shrink-0">{{ content.icon }}</span>
        
        <!-- Text -->
        <div class="min-w-0">
          <div class="font-semibold text-white truncate">{{ content.headline }}</div>
          <div class="text-sm text-white/70 truncate">{{ content.subtext }}</div>
        </div>
      </div>

      <!-- CTA Button -->
      <button
        v-if="content.cta"
        @click="handleCtaClick"
        class="shrink-0 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
        :class="ctaClasses"
      >
        {{ content.cta }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  state: {
    type: String,
    required: true,
    validator: (v) => ['SHOW_TONIGHT', 'ON_TOUR', 'NEW_RELEASE', 'POST_SHOW_THANKS', 'QUIET_DEFAULT'].includes(v)
  },
  content: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['cta-click', 'scroll-to', 'share'])

const bannerClasses = computed(() => {
  const accent = props.content?.accent || 'neutral'
  
  const accentMap = {
    orange: '',
    purple: '',
    pink: '',
    blue: '',
    neutral: '',
  }
  
  return accentMap[accent] || accentMap.neutral
})

const ctaClasses = computed(() => {
  const accent = props.content?.accent || 'neutral'
  
  const accentMap = {
    orange: 'bg-orange-500 hover:bg-orange-400 text-white',
    purple: 'bg-purple-500 hover:bg-purple-400 text-white',
    pink: 'bg-pink-500 hover:bg-pink-400 text-white',
    blue: 'bg-blue-500 hover:bg-blue-400 text-white',
    neutral: 'bg-white/10 hover:bg-white/20 text-white',
  }
  
  return accentMap[accent] || accentMap.neutral
})

function handleCtaClick() {
  const content = props.content
  
  if (content.ctaLink) {
    // External link (e.g., ticket link)
    window.open(content.ctaLink, '_blank')
    emit('cta-click', { type: 'link', url: content.ctaLink })
  } else if (content.ctaAction) {
    // Internal action
    switch (content.ctaAction) {
      case 'share':
        emit('share')
        break
      case 'scroll-to-featured':
        emit('scroll-to', 'featured')
        break
      case 'scroll-to-events':
        emit('scroll-to', 'events')
        break
      default:
        emit('cta-click', { type: 'action', action: content.ctaAction })
    }
  }
}
</script>
