<template>
  <div v-if="visibleBadges.length > 0" class="moment-badges flex flex-nowrap gap-2">
    <span
      v-for="badge in visibleBadges"
      :key="badge.key"
      class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium relative overflow-hidden shrink-0"
      :class="badge.classes"
    >
      <!-- Animated border effect -->
      <div class="absolute inset-0 rounded-full border-2 animate-pulse"></div>
      <div class="absolute inset-0 rounded-full border-2 animate-ping"></div>
      <!-- Content -->
      <span class="relative z-10">{{ badge.icon }}</span>
      <span class="relative z-10">{{ badge.label }}</span>
    </span>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  hasShowTonight: Boolean,
  isOnTour: Boolean,
  hasNewRelease: Boolean,
  hasMerchDrop: Boolean,
  hasNewVideo: Boolean,
  customBadges: {
    type: Array,
    default: () => []
  }
})

const visibleBadges = computed(() => {
  const badges = []

  if (props.hasShowTonight) {
    badges.push({
      key: 'show-tonight',
      icon: '🎤',
      label: 'New tonight',
      classes: 'text-orange-300 border-orange-400/50 shadow-lg shadow-orange-400/50',
    })
  }

  if (props.isOnTour) {
    badges.push({
      key: 'tour-week',
      icon: '🚐',
      label: 'Tour week',
      classes: 'text-purple-300 border-purple-400/50 shadow-lg shadow-purple-400/50',
    })
  }

  if (props.hasNewRelease) {
    badges.push({
      key: 'new-release',
      icon: '🔥',
      label: 'Fresh release',
      classes: 'text-green-300 border-green-400/50 shadow-lg shadow-green-400/50',
    })
  }

  if (props.hasNewVideo) {
    badges.push({
      key: 'new-video',
      icon: '🎬',
      label: 'Fresh video',
      classes: 'text-purple-300 border-purple-400/50 shadow-lg shadow-purple-400/50',
    })
  }

  if (props.hasMerchDrop) {
    badges.push({
      key: 'merch-drop',
      icon: '👕',
      label: 'Merch drop',
      classes: 'text-pink-300 border-pink-400/50 shadow-lg shadow-pink-400/50',
    })
  }

  // Add any custom badges
  props.customBadges.forEach(badge => {
    badges.push({
      key: badge.key || `custom-${badges.length}`,
      icon: badge.icon || '✨',
      label: badge.label,
      classes: badge.classes || 'text-white/80 border-white/20 shadow-lg shadow-white/20',
    })
  })

  // Limit to 3 badges max
  return badges.slice(0, 3)
})
</script>

<style scoped>
@keyframes neon-flicker {
  0%, 100% {
    opacity: 1;
    box-shadow: 0 0 10px currentColor, 0 0 20px currentColor, 0 0 30px currentColor;
  }
  50% {
    opacity: 0.8;
    box-shadow: 0 0 5px currentColor, 0 0 10px currentColor, 0 0 15px currentColor;
  }
}

.animate-pulse {
  animation: neon-flicker 2s ease-in-out infinite;
}

.animate-ping {
  animation: neon-flicker 2s ease-in-out infinite;
  animation-delay: 0.5s;
}
</style>
