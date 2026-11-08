<template>
  <div class="mb-6">
    <!-- Header -->
    <button 
      @click="expanded = !expanded"
      class="w-full flex items-center justify-between p-3 rounded-xl transition-colors"
      :class="headerClass"
    >
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-lg flex items-center justify-center" :class="iconBgClass">
          <component :is="icon" class="w-4 h-4" :class="iconClass" />
        </div>
        <div class="text-left">
          <h2 class="text-white font-semibold text-sm">{{ title }}</h2>
          <p class="text-gray-500 text-xs">{{ subtitle }}</p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <span class="text-lg font-bold" :class="countClass">{{ items.length }}</span>
        <svg 
          class="w-5 h-5 text-gray-400 transition-transform" 
          :class="{ 'rotate-180': expanded }"
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </button>

    <!-- Content -->
    <Transition name="collapse">
      <div v-if="expanded" class="mt-3 space-y-3">
        <AgencyArtistInboxCard
          v-for="item in displayedItems"
          :key="item.band.bandId"
          :item="item"
          @open="$emit('open', $event)"
          @assign="$emit('assign', $event)"
          @proof="$emit('proof', $event)"
          @handle="$emit('handle', $event)"
        />
        
        <button 
          v-if="items.length > displayLimit && !showAll"
          @click="showAll = true"
          class="w-full py-3 text-center text-sm text-violet-400 hover:text-violet-300 bg-gray-900/40 rounded-xl border border-gray-800 hover:border-gray-700 transition-colors"
        >
          View all {{ items.length }} artists
        </button>

        <div v-if="items.length === 0" class="text-center py-8 text-gray-500 text-sm">
          No artists in this bucket
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, h } from 'vue'

const props = defineProps({
  bucket: {
    type: String,
    required: true,
    validator: (v) => ['needsAction', 'heatingUp', 'watching', 'cooling'].includes(v)
  },
  items: {
    type: Array,
    default: () => []
  },
  initialExpanded: {
    type: Boolean,
    default: true
  }
})

defineEmits(['open', 'assign', 'proof', 'handle'])

const expanded = ref(props.initialExpanded)
const showAll = ref(false)
const displayLimit = 5

const displayedItems = computed(() => {
  if (showAll) return props.items
  return props.items.slice(0, displayLimit)
})

const config = computed(() => {
  const configs = {
    needsAction: {
      title: 'Needs Action Today',
      subtitle: 'High-priority signals requiring immediate attention',
      headerClass: 'bg-rose-500/10 hover:bg-rose-500/15',
      iconBgClass: 'bg-rose-500/20',
      iconClass: 'text-rose-400',
      countClass: 'text-rose-400'
    },
    heatingUp: {
      title: 'Heating Up',
      subtitle: 'Building momentum, worth watching closely',
      headerClass: 'bg-amber-500/10 hover:bg-amber-500/15',
      iconBgClass: 'bg-amber-500/20',
      iconClass: 'text-amber-400',
      countClass: 'text-amber-400'
    },
    watching: {
      title: 'Watching',
      subtitle: 'Steady activity, monitor for changes',
      headerClass: 'bg-blue-500/10 hover:bg-blue-500/15',
      iconBgClass: 'bg-blue-500/20',
      iconClass: 'text-blue-400',
      countClass: 'text-blue-400'
    },
    cooling: {
      title: 'Cooling',
      subtitle: 'Low activity, may need re-engagement',
      headerClass: 'bg-gray-500/10 hover:bg-gray-500/15',
      iconBgClass: 'bg-gray-500/20',
      iconClass: 'text-gray-400',
      countClass: 'text-gray-400'
    }
  }
  return configs[props.bucket] || configs.watching
})

const title = computed(() => config.value.title)
const subtitle = computed(() => config.value.subtitle)
const headerClass = computed(() => config.value.headerClass)
const iconBgClass = computed(() => config.value.iconBgClass)
const iconClass = computed(() => config.value.iconClass)
const countClass = computed(() => config.value.countClass)

const FireIcon = () => h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z' }),
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z' })
])

const TrendingIcon = () => h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' })
])

const EyeIcon = () => h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z' }),
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' })
])

const SnowflakeIcon = () => h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M12 3v18m0-18l4 4m-4-4L8 7m4 14l4-4m-4 4l-4-4M3 12h18M3 12l4 4m-4-4l4-4m14 4l-4 4m4-4l-4-4' })
])

const icon = computed(() => {
  const icons = {
    needsAction: FireIcon,
    heatingUp: TrendingIcon,
    watching: EyeIcon,
    cooling: SnowflakeIcon
  }
  return icons[props.bucket] || EyeIcon
})
</script>

<style scoped>
.collapse-enter-active,
.collapse-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}
.collapse-enter-from,
.collapse-leave-to {
  opacity: 0;
  max-height: 0;
}
.collapse-enter-to,
.collapse-leave-from {
  opacity: 1;
  max-height: 2000px;
}
</style>
