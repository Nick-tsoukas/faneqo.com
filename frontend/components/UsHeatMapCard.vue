<template>
  <div class="chart-card">
    <div class="flex items-center justify-between mb-2">
      <button
        @click="isExpanded = !isExpanded"
        class="flex items-center gap-2 text-lg font-semibold text-white hover:text-emerald-400 transition-colors"
      >
        <svg
          class="w-4 h-4 transition-transform duration-200"
          :class="{ 'rotate-90': isExpanded }"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
        USA Heat Map
      </button>
      <div v-if="isExpanded" class="flex items-center gap-2">
        <!-- Metric selector -->
        <select
          v-model="selectedMetric"
          class="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          <option v-for="opt in metricOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
        
        <!-- Range selector -->
        <select
          v-model="selectedRange"
          class="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          <option value="7d">7 Days</option>
          <option value="30d">30 Days</option>
          <option value="90d">90 Days</option>
          <option value="365d">1 Year</option>
        </select>
      </div>
    </div>
    
    <!-- Collapsed state summary -->
    <div v-if="!isExpanded && data && data.total > 0" class="text-sm text-slate-400 mt-1">
      {{ data.total.toLocaleString() }} {{ metricLabel }} across {{ data.states.length }} states
      <span v-if="topState" class="text-emerald-400">• Top: {{ topState.state }}</span>
    </div>
    <div v-else-if="!isExpanded" class="text-sm text-slate-500 mt-1">
      Click to expand map
    </div>
    
    <div v-if="isExpanded && loading" class="flex items-center justify-center h-48">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
    </div>
    
    <div v-else-if="isExpanded && error" class="flex items-center justify-center h-48 text-red-400 text-sm">
      {{ error }}
    </div>
    
    <div v-else-if="isExpanded && (!data || data.total === 0)" class="flex flex-col items-center justify-center h-48 text-slate-400">
      <svg class="w-12 h-12 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
      <p class="text-sm">No US data for this period</p>
    </div>
    
    <div v-else-if="isExpanded && data">
      <UsChoroplethMap
        :states="data?.states ?? []"
        :max="data?.max ?? 0"
        :metric="selectedMetric"
        @state-selected="handleStateSelected"
        @state-hover="handleStateHover"
      />
      
      <!-- Stats summary -->
      <div class="mt-3 grid grid-cols-3 gap-3 text-center">
        <div>
          <div class="text-2xl font-bold text-white">{{ (data?.total ?? 0).toLocaleString() }}</div>
          <div class="text-xs text-slate-400">Total {{ metricLabel }}</div>
        </div>
        <div>
          <div class="text-2xl font-bold text-white">{{ data?.states?.length ?? 0 }}</div>
          <div class="text-xs text-slate-400">States</div>
        </div>
        <div v-if="topState">
          <div class="text-2xl font-bold text-emerald-400">{{ topState.state }}</div>
          <div class="text-xs text-slate-400">Top State ({{ topState.count.toLocaleString() }})</div>
        </div>
      </div>
      
      <!-- Top states list -->
      <div v-if="(data?.states?.length ?? 0) > 0" class="mt-3">
        <div class="text-xs text-slate-400 mb-1">Top States</div>
        <div class="flex flex-wrap gap-2">
          <div
            v-for="state in topStates"
            :key="state.state"
            class="px-2 py-1 bg-slate-700/50 rounded text-xs"
            :class="selectedState === state.state ? 'ring-1 ring-emerald-500' : ''"
          >
            <span class="text-white font-medium">{{ state.state }}</span>
            <span class="text-slate-400 ml-1">{{ state.count.toLocaleString() }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'

interface StateCount {
  state: string
  count: number
}

interface GeoStatesResponse {
  ok: boolean
  entityType: string
  entityId: number
  range: string
  metric: string
  total: number
  max: number
  states: StateCount[]
}

interface Props {
  entityType: 'band' | 'event' | 'qr'
  entityId: number | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'stateSelected', state: string | null): void
}>()

const client = useStrapiClient()

const loading = ref(false)
const error = ref<string | null>(null)
const data = ref<GeoStatesResponse | null>(null)
const selectedRange = ref('30d')
const selectedMetric = ref('views')
const selectedState = ref<string | null>(null)
const isExpanded = ref(false)

const metricOptions = computed(() => {
  // Only metrics with region/country geo data are supported
  if (props.entityType === 'band') {
    return [
      { value: 'views', label: 'Page Views' },
      { value: 'qrScans', label: 'QR Scans' },
    ]
  } else if (props.entityType === 'event') {
    return [
      { value: 'views', label: 'Page Views' },
      { value: 'qrScans', label: 'QR Scans' },
    ]
  } else {
    return [
      { value: 'qrScans', label: 'QR Scans' },
    ]
  }
})

const metricLabel = computed(() => {
  const labels: Record<string, string> = {
    views: 'views',
    qrScans: 'scans',
    linkClicks: 'clicks',
    follows: 'follows'
  }
  return labels[selectedMetric.value] || selectedMetric.value
})

const topState = computed(() => {
  if (!data.value || data.value.states.length === 0) return null
  return data.value.states[0]
})

const topStates = computed(() => {
  if (!data.value) return []
  return data.value.states.slice(0, 5)
})

async function fetchData() {
  if (!props.entityId) return
  
  loading.value = true
  error.value = null
  
  try {
    const res = await client<GeoStatesResponse>('/analytics/geo-states', {
      params: {
        entityType: props.entityType,
        entityId: props.entityId,
        range: selectedRange.value,
        metric: selectedMetric.value,
      }
    })
    data.value = res
  } catch (err: any) {
    console.error('[UsHeatMapCard] Fetch error:', err)
    error.value = err?.message || 'Failed to load heat map data'
  } finally {
    loading.value = false
  }
}

function handleStateSelected(state: string | null) {
  selectedState.value = state
  emit('stateSelected', state)
}

function handleStateHover(state: string | null) {
  // Could add hover effects here if needed
}

watch([() => props.entityId, selectedRange, selectedMetric], () => {
  fetchData()
})

onMounted(() => {
  // Set default metric based on entity type
  if (props.entityType === 'qr') {
    selectedMetric.value = 'qrScans'
  }
  fetchData()
})
</script>
