<template>
  <div 
    class="bg-gray-900/60 border border-gray-800 rounded-2xl p-4 hover:border-gray-700 transition-all cursor-pointer"
    @click="$emit('open', item.band.bandId)"
  >
    <div class="flex items-start gap-3">
      <!-- Avatar -->
      <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600/20 to-purple-600/20 flex items-center justify-center flex-shrink-0 border border-gray-700">
        <span class="text-violet-400 font-bold text-lg">{{ item.band.name.charAt(0) }}</span>
      </div>

      <!-- Content -->
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 flex-wrap">
          <h3 class="text-white font-medium text-sm truncate">{{ item.band.name }}</h3>
          <AgencySignalPill :state="momentumState" />
          <!-- V1.1: Velocity indicator -->
          <span 
            v-if="velocity !== 0"
            class="text-xs font-medium"
            :class="velocity >= 0 ? 'text-emerald-400' : 'text-red-400'"
          >
            {{ velocity >= 0 ? '+' : '' }}{{ velocity }}
          </span>
        </div>

        <!-- Top Signal -->
        <div v-if="item.topSignal" class="mt-2">
          <div 
            class="text-xs font-bold tracking-wide"
            :class="accentTextClass"
          >
            {{ item.topSignal.headline }}
          </div>
          <div class="flex items-center gap-2 mt-1">
            <span 
              class="text-lg font-bold"
              :class="accentTextClass"
            >
              {{ item.topSignal.hero }}
            </span>
            <span class="text-gray-500 text-xs">{{ item.topSignal.windowLabel }}</span>
          </div>
          <p class="text-gray-400 text-xs mt-1 line-clamp-1">{{ item.topSignal.proof }}</p>
        </div>

        <!-- Meta Row -->
        <div class="flex items-center gap-3 mt-3 flex-wrap">
          <!-- V1.1: Mini Sparkline -->
          <div class="w-16 h-4" v-if="sparklineData.length">
            <svg class="w-full h-full" viewBox="0 0 64 16" preserveAspectRatio="none">
              <polyline 
                :points="sparklinePoints" 
                fill="none" 
                :stroke="sparklineColor" 
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>

          <!-- Top City -->
          <span v-if="topCity" class="inline-flex items-center gap-1 text-xs text-gray-400 bg-gray-800/50 px-2 py-1 rounded-lg">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {{ topCity }}
          </span>

          <!-- Timestamp -->
          <span class="text-xs text-gray-500">{{ timeAgo }}</span>

          <!-- Owner -->
          <span v-if="item.owner" class="text-xs text-gray-500 flex items-center gap-1">
            <span class="w-4 h-4 rounded-full bg-gray-700 flex items-center justify-center text-[10px] text-gray-300">
              {{ item.owner.name.charAt(0) }}
            </span>
            {{ item.owner.name.split(' ')[0] }}
          </span>
        </div>
      </div>

      <!-- Tier Badge -->
      <div 
        class="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
        :class="tierClass"
      >
        {{ item.band.tier }}
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="flex items-center gap-2 mt-4 pt-3 border-t border-gray-800">
      <button 
        @click.stop="$emit('open', item.band.bandId)"
        class="flex-1 px-3 py-2 bg-violet-600/20 hover:bg-violet-600/30 text-violet-400 text-xs font-medium rounded-lg transition-colors"
      >
        Open
      </button>
      <button 
        @click.stop="$emit('assign', item.band.bandId)"
        class="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium rounded-lg transition-colors"
      >
        Assign
      </button>
      <button 
        @click.stop="$emit('proof', item.topSignal)"
        class="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium rounded-lg transition-colors"
      >
        Share
      </button>
      <button 
        v-if="item.topSignal"
        @click.stop="$emit('handle', item.topSignal.id)"
        class="px-3 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-xs font-medium rounded-lg transition-colors"
      >
        Handled
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAgencyPortalStore } from '~/stores/agencyPortal'

const props = defineProps({
  item: {
    type: Object,
    required: true
  }
})

defineEmits(['open', 'assign', 'proof', 'handle'])

const store = useAgencyPortalStore()

// V1.1: Get velocity and momentum state from store
const velocity = computed(() => store.getBandVelocity7d(props.item.band.bandId))
const momentumState = computed(() => store.getBandMomentumState(props.item.band.bandId))

// V1.1: Sparkline data
const sparklineData = computed(() => store.getBandSparkline(props.item.band.bandId))

const sparklinePoints = computed(() => {
  if (!sparklineData.value.length) return ''
  const data = sparklineData.value
  const max = Math.max(...data, 100)
  const min = Math.min(...data, 0)
  const range = max - min || 1
  
  return data.map((val, i) => {
    const x = (i / (data.length - 1)) * 64
    const y = 16 - ((val - min) / range) * 16
    return `${x},${y}`
  }).join(' ')
})

const sparklineColor = computed(() => {
  if (velocity.value >= 5) return '#34d399' // emerald
  if (velocity.value <= -5) return '#f87171' // red
  return '#8b5cf6' // violet
})

const accentTextClass = computed(() => {
  const accent = props.item.topSignal?.accent || 'violet'
  const classes = {
    violet: 'text-violet-400',
    blue: 'text-blue-400',
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
    rose: 'text-rose-400'
  }
  return classes[accent] || classes.violet
})

const tierClass = computed(() => {
  const tier = props.item.band.tier
  const classes = {
    A: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    B: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    C: 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
  }
  return classes[tier] || classes.C
})

const topCity = computed(() => {
  return props.item.topSignal?.context?.city || props.item.band.homeCity
})

const timeAgo = computed(() => {
  if (!props.item.topSignal?.createdAt) return ''
  const date = new Date(props.item.topSignal.createdAt)
  const now = new Date()
  const diffMs = now - date
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)
  
  if (diffHours < 1) return 'Just now'
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return '1d ago'
  return `${diffDays}d ago`
})
</script>
