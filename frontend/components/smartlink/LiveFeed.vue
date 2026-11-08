<template>
  <div v-if="hasFeedItems" class="live-feed space-y-2">
    <!-- Single item display (default) -->
    <div 
      v-if="displayMode === 'single' && primaryFeedItem"
      class="feed-item flex items-center gap-3 px-4 py-3"
    >
      <div :class="getIconClasses(primaryFeedItem.icon)" class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
        <component :is="getIconComponent(primaryFeedItem.icon)" class="w-4 h-4" />
      </div>
      <span class="text-white/90 text-sm font-medium flex-1">{{ primaryFeedItem.copy }}</span>
      <span class="text-white/40 text-xs shrink-0">{{ formatTime(primaryFeedItem.timestamp) }}</span>
    </div>

    <!-- Multi-item display -->
    <template v-else-if="displayMode === 'multi'">
      <div 
        v-for="item in feedItems.slice(0, maxItems)"
        :key="item.id"
        class="feed-item flex items-center gap-3 px-4 py-2.5"
      >
        <div :class="getIconClasses(item.icon)" class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0">
          <component :is="getIconComponent(item.icon)" class="w-3.5 h-3.5" />
        </div>
        <span class="text-white/90 text-sm font-medium flex-1">{{ item.copy }}</span>
        <span class="text-white/40 text-xs shrink-0">{{ formatTime(item.timestamp) }}</span>
      </div>
    </template>

    <!-- Compact inline display -->
    <div 
      v-else-if="displayMode === 'compact'"
      class="flex items-center gap-3 text-sm text-white/70"
    >
      <span v-for="(item, index) in feedItems.slice(0, 2)" :key="item.id" class="flex items-center gap-1.5">
        <div :class="getIconClasses(item.icon)" class="w-5 h-5 rounded flex items-center justify-center">
          <component :is="getIconComponent(item.icon)" class="w-3 h-3" />
        </div>
        <span>{{ item.copy }}</span>
        <span v-if="index < Math.min(feedItems.length, 2) - 1" class="text-white/30 mx-1">•</span>
      </span>
    </div>
  </div>
</template>

<script setup>
import { computed, h } from 'vue'

// SVG Icon Components
const LocationIcon = {
  render() {
    return h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' }),
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M15 11a3 3 0 11-6 0 3 3 0 016 0z' })
    ])
  }
}

const FireIcon = {
  render() {
    return h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z' }),
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z' })
    ])
  }
}

const TrendingIcon = {
  render() {
    return h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' })
    ])
  }
}

const MusicIcon = {
  render() {
    return h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3' })
    ])
  }
}

const HeartIcon = {
  render() {
    return h('svg', { fill: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { d: 'M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z' })
    ])
  }
}

// Icon mapping
function getIconComponent(emoji) {
  const map = {
    '📍': LocationIcon,
    '🔥': FireIcon,
    '📈': TrendingIcon,
    '🎵': MusicIcon,
    '💜': HeartIcon,
  }
  return map[emoji] || MusicIcon
}

// Icon background classes
function getIconClasses(emoji) {
  const map = {
    '📍': 'bg-blue-500/20 text-blue-400',
    '🔥': 'bg-orange-500/20 text-orange-400',
    '📈': 'bg-emerald-500/20 text-emerald-400',
    '🎵': 'bg-purple-500/20 text-purple-400',
    '💜': 'bg-pink-500/20 text-pink-400',
  }
  return map[emoji] || 'bg-white/10 text-white/70'
}

const props = defineProps({
  feedItems: {
    type: Array,
    default: () => []
  },
  primaryFeedItem: {
    type: Object,
    default: null
  },
  hasFeedItems: {
    type: Boolean,
    default: false
  },
  displayMode: {
    type: String,
    default: 'single',
    validator: (v) => ['single', 'multi', 'compact'].includes(v)
  },
  maxItems: {
    type: Number,
    default: 3
  }
})

function formatTime(timestamp) {
  if (!timestamp) return ''
  
  const now = Date.now()
  const diff = now - timestamp
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return 'today'
}
</script>
