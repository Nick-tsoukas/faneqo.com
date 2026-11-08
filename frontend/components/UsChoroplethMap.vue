<template>
  <div class="us-choropleth-map" ref="mapContainer">
    <div v-if="loading" class="flex items-center justify-center h-40">
      <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500"></div>
    </div>
    <div v-else-if="error" class="flex items-center justify-center h-40 text-red-400 text-sm">
      {{ error }}
    </div>
    <div v-else class="relative w-full" style="aspect-ratio: 1.6;">
      <svg
        :viewBox="viewBox"
        class="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <g class="states">
          <path
            v-for="state in statesData"
            :key="state.id"
            :id="state.id"
            :d="state.d"
            :fill="getStateFill(state.id)"
            :stroke="selectedState === state.id ? '#10b981' : '#475569'"
            :stroke-width="selectedState === state.id ? 1.5 : 0.5"
            class="state-path cursor-pointer transition-colors duration-150"
            @mouseenter="handleHover(state.id, $event)"
            @mouseleave="handleHoverEnd"
            @click="handleClick(state.id)"
          />
        </g>
      </svg>
      
      <!-- Tooltip -->
      <div
        v-if="hoveredState && tooltipPos"
        class="absolute pointer-events-none bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs shadow-lg z-10"
        :style="{ left: tooltipPos.x + 'px', top: tooltipPos.y + 'px', transform: 'translate(-50%, -100%)' }"
      >
        <div class="font-medium text-white">{{ getStateName(hoveredState) }}</div>
        <div class="text-slate-300">{{ getStateCount(hoveredState).toLocaleString() }} {{ metricLabel }}</div>
      </div>
    </div>
    
    <!-- Legend -->
    <div v-if="!loading && !error" class="flex items-center justify-center mt-1 gap-2 text-xs text-slate-400">
      <span>Low</span>
      <div class="w-20 h-1 rounded" :style="{ background: legendGradient }"></div>
      <span>High</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { STATE_NAMES } from '~/composables/useUsStatesMap'

interface StateCount {
  state: string
  count: number
}

interface Props {
  states: StateCount[]
  max: number
  metric?: string
  colorLow?: string
  colorHigh?: string
}

const props = withDefaults(defineProps<Props>(), {
  metric: 'views',
  colorLow: '#1e293b',
  colorHigh: '#10b981'
})

const emit = defineEmits<{
  (e: 'stateSelected', state: string | null): void
  (e: 'stateHover', state: string | null): void
}>()

const mapContainer = ref<HTMLElement | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const statesData = ref<Array<{ id: string; d: string }>>([])
const viewBox = ref('0 0 960 600')
const hoveredState = ref<string | null>(null)
const selectedState = ref<string | null>(null)
const tooltipPos = ref<{ x: number; y: number } | null>(null)

// Create count lookup
const countLookup = computed(() => {
  const lookup: Record<string, number> = {}
  for (const s of props.states) {
    lookup[s.state] = s.count
  }
  return lookup
})

const metricLabel = computed(() => {
  const labels: Record<string, string> = {
    views: 'views',
    qrScans: 'scans',
    linkClicks: 'clicks',
    follows: 'follows'
  }
  return labels[props.metric] || props.metric
})

const legendGradient = computed(() => {
  return `linear-gradient(to right, ${props.colorLow}, ${props.colorHigh})`
})

function getStateName(id: string): string {
  return STATE_NAMES[id] || id
}

function getStateCount(id: string): number {
  return countLookup.value[id] || 0
}

function getStateFill(id: string): string {
  const count = getStateCount(id)
  if (count === 0 || props.max === 0) return props.colorLow
  
  // Use log scale for better distribution
  const logCount = Math.log(count + 1)
  const logMax = Math.log(props.max + 1)
  const ratio = Math.min(logCount / logMax, 1)
  
  return interpolateColor(props.colorLow, props.colorHigh, ratio)
}

function interpolateColor(color1: string, color2: string, ratio: number): string {
  const hex = (c: string) => parseInt(c, 16)
  const r1 = hex(color1.slice(1, 3)), g1 = hex(color1.slice(3, 5)), b1 = hex(color1.slice(5, 7))
  const r2 = hex(color2.slice(1, 3)), g2 = hex(color2.slice(3, 5)), b2 = hex(color2.slice(5, 7))
  
  const r = Math.round(r1 + (r2 - r1) * ratio)
  const g = Math.round(g1 + (g2 - g1) * ratio)
  const b = Math.round(b1 + (b2 - b1) * ratio)
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

function handleHover(stateId: string, event: MouseEvent) {
  hoveredState.value = stateId
  emit('stateHover', stateId)
  
  if (mapContainer.value) {
    const rect = mapContainer.value.getBoundingClientRect()
    tooltipPos.value = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top - 10
    }
  }
}

function handleHoverEnd() {
  hoveredState.value = null
  tooltipPos.value = null
  emit('stateHover', null)
}

function handleClick(stateId: string) {
  selectedState.value = selectedState.value === stateId ? null : stateId
  emit('stateSelected', selectedState.value)
}

// State name to code mapping
const NAME_TO_CODE: Record<string, string> = {
  'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR', 'California': 'CA',
  'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE', 'Florida': 'FL', 'Georgia': 'GA',
  'Hawaii': 'HI', 'Idaho': 'ID', 'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA',
  'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
  'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS', 'Missouri': 'MO',
  'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ',
  'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH',
  'Oklahoma': 'OK', 'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
  'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT', 'Vermont': 'VT',
  'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV', 'Wisconsin': 'WI', 'Wyoming': 'WY',
  'District of Columbia': 'DC', 'Puerto Rico': 'PR'
}

// Albers USA projection (simplified)
function projectAlbersUsa(lon: number, lat: number): [number, number] {
  // Constants for Albers USA projection centered on continental US
  const lambda0 = -96 * Math.PI / 180
  const phi0 = 38.5 * Math.PI / 180
  const phi1 = 29.5 * Math.PI / 180
  const phi2 = 45.5 * Math.PI / 180
  
  const lambda = lon * Math.PI / 180
  const phi = lat * Math.PI / 180
  
  const n = (Math.sin(phi1) + Math.sin(phi2)) / 2
  const c = Math.cos(phi1) * Math.cos(phi1) + 2 * n * Math.sin(phi1)
  const rho0 = Math.sqrt(c - 2 * n * Math.sin(phi0)) / n
  const rho = Math.sqrt(c - 2 * n * Math.sin(phi)) / n
  const theta = n * (lambda - lambda0)
  
  let x = rho * Math.sin(theta)
  let y = rho0 - rho * Math.cos(theta)
  
  // Scale and translate to fit viewBox
  x = x * 1000 + 480
  y = -y * 1000 + 300
  
  return [x, y]
}

function geoJsonToSvgPath(geometry: any): string {
  if (!geometry || !geometry.coordinates) return ''
  
  const processRing = (ring: number[][]) => {
    if (!ring || ring.length === 0) return ''
    const points = ring.map(coord => {
      const [x, y] = projectAlbersUsa(coord[0], coord[1])
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    return 'M' + points.join('L') + 'Z'
  }
  
  let path = ''
  if (geometry.type === 'Polygon') {
    for (const ring of geometry.coordinates) {
      path += processRing(ring)
    }
  } else if (geometry.type === 'MultiPolygon') {
    for (const polygon of geometry.coordinates) {
      for (const ring of polygon) {
        path += processRing(ring)
      }
    }
  }
  
  return path
}

async function loadMapData() {
  loading.value = true
  error.value = null
  
  try {
    const response = await fetch('https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json')
    if (!response.ok) throw new Error('Failed to load map data')
    
    const geojson = await response.json()
    
    const states: Array<{ id: string; d: string }> = []
    for (const feature of geojson.features) {
      const name = feature.properties?.name
      const code = NAME_TO_CODE[name]
      if (!code) continue
      
      const d = geoJsonToSvgPath(feature.geometry)
      if (d) {
        states.push({ id: code, d })
      }
    }
    
    statesData.value = states
    
    // Calculate bounding box for viewBox
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (const state of states) {
      const matches = state.d.match(/[\d.]+,[\d.]+/g) || []
      for (const match of matches) {
        const [x, y] = match.split(',').map(Number)
        minX = Math.min(minX, x)
        minY = Math.min(minY, y)
        maxX = Math.max(maxX, x)
        maxY = Math.max(maxY, y)
      }
    }
    
    if (minX !== Infinity) {
      const padding = 20
      const width = maxX - minX + padding * 2
      const height = maxY - minY + padding * 2
      viewBox.value = `${minX - padding} ${minY - padding} ${width} ${height}`
    }
    
  } catch (err) {
    console.error('[UsChoroplethMap] Error loading map:', err)
    error.value = 'Failed to load map'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadMapData()
})
</script>

<style scoped>
.state-path:hover {
  filter: brightness(1.3);
}
</style>
