<template>
  <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
    <!-- Hottest City -->
    <div 
      class="bg-gray-900/60 border border-gray-800 rounded-xl p-3 cursor-pointer hover:border-gray-700 transition-colors"
      @click="navigateToCity"
    >
      <div class="text-xs text-gray-500 mb-1">Hottest City</div>
      <div class="text-white font-medium text-sm truncate">{{ hottestCityName }}</div>
      <div class="text-amber-400 text-xs">Heat {{ hottestCityScore }}</div>
    </div>

    <!-- Biggest Mover -->
    <div 
      class="bg-gray-900/60 border border-gray-800 rounded-xl p-3 cursor-pointer hover:border-gray-700 transition-colors"
      @click="navigateToMover"
    >
      <div class="text-xs text-gray-500 mb-1">Top Mover</div>
      <div class="text-white font-medium text-sm truncate">{{ topMoverName }}</div>
      <div class="text-emerald-400 text-xs">{{ topMoverVelocity }}</div>
    </div>

    <!-- Needs Action -->
    <div 
      class="bg-gray-900/60 border border-gray-800 rounded-xl p-3 cursor-pointer hover:border-gray-700 transition-colors"
      @click="navigateToSignals"
    >
      <div class="text-xs text-gray-500 mb-1">Needs Action</div>
      <div class="text-2xl font-bold text-violet-400">{{ needsActionCount }}</div>
    </div>

    <!-- Overdue Tasks -->
    <div 
      class="bg-gray-900/60 border border-gray-800 rounded-xl p-3 cursor-pointer hover:border-gray-700 transition-colors"
      @click="navigateToTasks"
    >
      <div class="text-xs text-gray-500 mb-1">Overdue Tasks</div>
      <div 
        class="text-2xl font-bold" 
        :class="overdueCount > 0 ? 'text-red-400' : 'text-emerald-400'"
      >
        {{ overdueCount }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAgencyPortalStore } from '~/stores/agencyPortal'
import { safeInt, safeVelocity, isValidNumber } from '~/utils/agencyPortal/validateMockData'

const router = useRouter()
const store = useAgencyPortalStore()

// Hottest City
const hottestCity = computed(() => {
  const cities = store.cityHeatScores || []
  return cities[0] || null
})

const hottestCityName = computed(() => {
  return hottestCity.value?.name || 'N/A'
})

const hottestCityScore = computed(() => {
  const score = hottestCity.value?.heatScore
  return isValidNumber(score) ? safeInt(score) : '—'
})

// Top Mover
const topMover = computed(() => {
  const movers = store.topMovers || []
  return movers[0] || null
})

const topMoverName = computed(() => {
  return topMover.value?.bandName || 'N/A'
})

const topMoverVelocity = computed(() => {
  const velocity = topMover.value?.velocity
  return isValidNumber(velocity) ? safeVelocity(velocity) : '—'
})

// Needs Action Count
const NEEDS_ACTION_TYPES = ['MOMENTUM_SURGE', 'AFTER_SHOW_ENERGY', 'CITY_CLAIM', 'SHARE_CHAIN', 'PEAK_HOUR', 'PLATFORM_PULL']

const needsActionCount = computed(() => {
  const signals = store.inboxSignals || []
  const count = signals.filter(s => {
    return s.score >= 85 && NEEDS_ACTION_TYPES.includes(s.type) && !store.isSignalHandled(s.id)
  }).length
  return safeInt(count, 0)
})

// Overdue Tasks
const overdueCount = computed(() => {
  const count = store.overdueTasks?.length || 0
  return safeInt(count, 0)
})

// Navigation
function navigateToCity() {
  if (hottestCity.value?.name) {
    router.push(`/agency/cities?city=${encodeURIComponent(hottestCity.value.name)}`)
  } else {
    router.push('/agency/cities')
  }
}

function navigateToMover() {
  if (topMover.value?.bandId) {
    router.push(`/agency/artists/${topMover.value.bandId}`)
  }
}

function navigateToSignals() {
  router.push('/agency/signals')
}

function navigateToTasks() {
  router.push('/agency/tasks')
}
</script>
