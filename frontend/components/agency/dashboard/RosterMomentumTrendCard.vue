<template>
  <div 
    class="bg-gray-900/60 border border-gray-800 rounded-2xl p-5 cursor-pointer hover:border-gray-700 transition-colors"
    @click="$emit('click')"
  >
    <div class="flex items-center justify-between mb-4">
      <div>
        <h3 class="text-white font-semibold">Roster Momentum</h3>
        <p class="text-gray-500 text-xs mt-0.5">Average momentum index across roster</p>
      </div>
      <div class="flex gap-1">
        <button 
          @click="days = 7"
          class="px-3 py-1 text-xs rounded-lg transition-colors"
          :class="days === 7 ? 'bg-violet-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'"
        >
          7d
        </button>
        <button 
          @click="days = 30"
          class="px-3 py-1 text-xs rounded-lg transition-colors"
          :class="days === 30 ? 'bg-violet-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'"
        >
          30d
        </button>
      </div>
    </div>

    <!-- Current Value -->
    <div class="flex items-end gap-3 mb-4">
      <span class="text-4xl font-bold text-white">{{ currentAvg }}</span>
      <span 
        class="text-sm font-medium mb-1"
        :class="trendDirection >= 0 ? 'text-emerald-400' : 'text-red-400'"
      >
        {{ trendDirection >= 0 ? '+' : '' }}{{ trendDirection }}
      </span>
    </div>

    <!-- Sparkline Chart -->
    <div class="h-16 relative">
      <!-- Empty state when no data -->
      <div v-if="!hasValidData" class="absolute inset-0 flex flex-col items-center justify-center text-center">
        <p class="text-gray-500 text-xs">Not enough momentum data</p>
        <p class="text-gray-600 text-[10px] mt-1">Add bandDailyMetrics for the last {{ days }} days</p>
      </div>
      
      <!-- Chart when data exists -->
      <svg v-else class="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <!-- Grid lines -->
        <line x1="0" y1="25" x2="100" y2="25" stroke="#374151" stroke-width="0.5" stroke-dasharray="2" />
        <line x1="0" y1="50" x2="100" y2="50" stroke="#374151" stroke-width="0.5" stroke-dasharray="2" />
        <line x1="0" y1="75" x2="100" y2="75" stroke="#374151" stroke-width="0.5" stroke-dasharray="2" />
        
        <!-- Area fill -->
        <path 
          :d="areaPath" 
          fill="url(#momentumGradient)" 
          opacity="0.3"
        />
        
        <!-- Line -->
        <polyline 
          :points="linePoints" 
          fill="none" 
          stroke="#8b5cf6" 
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          vector-effect="non-scaling-stroke"
        />
        
        <!-- Gradient definition -->
        <defs>
          <linearGradient id="momentumGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#8b5cf6" />
            <stop offset="100%" stop-color="#8b5cf6" stop-opacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>

    <!-- Labels -->
    <div class="flex justify-between text-xs text-gray-500 mt-2">
      <span>{{ days }}d ago</span>
      <span>Today</span>
    </div>

    <!-- Dev-only Debug Panel -->
    <div v-if="isDev && debugOpen" class="mt-3 p-2 bg-gray-800 rounded text-xs text-gray-400 font-mono">
      <div>Window: {{ days }}d | Series: {{ trendData.length }} pts</div>
      <div v-if="trendData.length">First: {{ trendData[0]?.date }} ({{ trendData[0]?.avgIndex }})</div>
      <div v-if="trendData.length">Last: {{ trendData[trendData.length-1]?.date }} ({{ trendData[trendData.length-1]?.avgIndex }})</div>
      <div>Min/Max: {{ debugMin }}/{{ debugMax }}</div>
    </div>
    <button 
      v-if="isDev" 
      @click.stop="debugOpen = !debugOpen"
      class="absolute top-2 right-2 text-[10px] text-gray-600 hover:text-gray-400"
    >
      {{ debugOpen ? '✕' : '🐛' }}
    </button>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAgencyPortalStore } from '~/stores/agencyPortal'
import { safeInt, isValidNumber } from '~/utils/agencyPortal/validateMockData'

defineEmits(['click'])

// Dev mode detection
const isDev = process.dev || import.meta.dev || process.env.NODE_ENV !== 'production'
const debugOpen = ref(false)

const store = useAgencyPortalStore()
const days = ref(7)

const trendData = computed(() => {
  const data = store.rosterMomentumTrend(days.value)
  // Filter out invalid data points
  return (data || []).filter(d => isValidNumber(d?.avgIndex))
})

// Check if we have valid data to render
const hasValidData = computed(() => {
  return trendData.value.length >= 2
})

const currentAvg = computed(() => {
  if (!trendData.value.length) return '—'
  const val = trendData.value[trendData.value.length - 1]?.avgIndex
  return isValidNumber(val) ? safeInt(val) : '—'
})

const trendDirection = computed(() => {
  if (trendData.value.length < 2) return 0
  const first = trendData.value[0]?.avgIndex
  const last = trendData.value[trendData.value.length - 1]?.avgIndex
  if (!isValidNumber(first) || !isValidNumber(last)) return 0
  return Math.round(last - first)
})

// Debug helpers
const debugMin = computed(() => {
  if (!trendData.value.length) return 0
  return Math.min(...trendData.value.map(d => d.avgIndex))
})

const debugMax = computed(() => {
  if (!trendData.value.length) return 0
  return Math.max(...trendData.value.map(d => d.avgIndex))
})

// SVG line points (numeric coordinates for viewBox 0 0 100 100)
const linePoints = computed(() => {
  if (!trendData.value.length) return ''
  const values = trendData.value.map(d => d.avgIndex)
  const max = Math.max(...values, 100)
  const min = Math.min(...values, 0)
  const range = max - min || 1
  
  return trendData.value.map((d, i) => {
    const x = trendData.value.length === 1 ? 50 : (i / (trendData.value.length - 1)) * 100
    const y = 100 - ((d.avgIndex - min) / range) * 100
    // Clamp y to valid range
    const safeY = Math.max(5, Math.min(95, y))
    return `${x},${safeY}`
  }).join(' ')
})

// SVG area path (for gradient fill)
const areaPath = computed(() => {
  if (!trendData.value.length) return ''
  const values = trendData.value.map(d => d.avgIndex)
  const max = Math.max(...values, 100)
  const min = Math.min(...values, 0)
  const range = max - min || 1
  
  const points = trendData.value.map((d, i) => {
    const x = trendData.value.length === 1 ? 50 : (i / (trendData.value.length - 1)) * 100
    const y = 100 - ((d.avgIndex - min) / range) * 100
    const safeY = Math.max(5, Math.min(95, y))
    return { x, y: safeY }
  })
  
  const firstY = points[0]?.y || 50
  const lastX = points[points.length - 1]?.x || 100
  
  return `M 0 100 L 0 ${firstY} ` +
         points.map(p => `L ${p.x} ${p.y}`).join(' ') +
         ` L ${lastX} 100 Z`
})
</script>
