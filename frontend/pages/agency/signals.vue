<template>
  <AgencyLayout>
    <div class="max-w-4xl mx-auto">
      <!-- Page Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-white mb-2">Signals Feed</h1>
          <p class="text-gray-400">Label ops queue — search, filter, and act</p>
        </div>
        <!-- Saved Views Dropdown -->
        <div class="relative">
          <select
            v-model="selectedView"
            @change="applyView"
            class="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl focus:outline-none appearance-none pr-8 cursor-pointer"
          >
            <option value="">Views</option>
            <option value="myQueue">My Queue</option>
            <option value="highPriority">High Priority</option>
            <option value="unassigned">Unassigned</option>
            <option value="cityClaimWatch">City Claim Watch</option>
            <option value="afterShowWatch">After-Show Watch</option>
          </select>
          <svg class="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-white pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      <!-- Search + Sort Row -->
      <div class="flex flex-col md:flex-row gap-3 mb-4">
        <!-- Search Input -->
        <div class="relative flex-1">
          <svg class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref="searchInput"
            v-model="searchQuery"
            type="text"
            placeholder="Search bands, cities, headlines… (⌘K)"
            class="w-full pl-10 pr-10 py-2.5 bg-gray-900/60 border border-gray-800 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-violet-500"
          />
          <button 
            v-if="searchQuery"
            @click="searchQuery = ''"
            class="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-white"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Sort Dropdown -->
        <select
          v-model="sortMode"
          class="px-4 py-2.5 bg-gray-900/60 border border-gray-800 rounded-xl text-white text-sm focus:outline-none focus:border-violet-500"
        >
          <option value="priority">Sort: Priority</option>
          <option value="newest">Sort: Newest</option>
          <option value="highestScore">Sort: Highest Score</option>
          <option value="needsAction">Sort: Needs Action First</option>
          <option value="unassignedFirst">Sort: Unassigned First</option>
        </select>
      </div>

      <!-- Filter Chips Row -->
      <div class="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-4 px-4 lg:mx-0 lg:px-0">
        <button
          v-for="chip in filterChips"
          :key="chip.key"
          @click="toggleChip(chip.key)"
          class="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap"
          :class="activeChips.includes(chip.key) 
            ? 'bg-violet-600 text-white' 
            : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'"
        >
          {{ chip.label }}
        </button>
      </div>

      <!-- Filters Row -->
      <div class="flex flex-wrap gap-3 mb-6">
        <!-- Owner Filter -->
        <select
          v-model="filterOwner"
          class="px-4 py-2 bg-gray-900/60 border border-gray-800 rounded-xl text-white text-sm focus:outline-none focus:border-violet-500"
        >
          <option value="">All Owners</option>
          <option value="unassigned">Unassigned</option>
          <option v-for="member in store.members" :key="member.id" :value="member.id">
            {{ member.name }}
          </option>
        </select>

        <!-- Tier Filter -->
        <select
          v-model="filterTier"
          class="px-4 py-2 bg-gray-900/60 border border-gray-800 rounded-xl text-white text-sm focus:outline-none focus:border-violet-500"
        >
          <option value="">All Tiers</option>
          <option value="A">Tier A</option>
          <option value="B">Tier B</option>
          <option value="C">Tier C</option>
        </select>

        <!-- Score Filter -->
        <select
          v-model="filterScore"
          class="px-4 py-2 bg-gray-900/60 border border-gray-800 rounded-xl text-white text-sm focus:outline-none focus:border-violet-500"
        >
          <option value="">All Scores</option>
          <option value="85">85+ (High)</option>
          <option value="75">75–84</option>
          <option value="55">55–74</option>
          <option value="0">Below 55</option>
        </select>

        <!-- City Filter -->
        <select
          v-model="filterCity"
          class="px-4 py-2 bg-gray-900/60 border border-gray-800 rounded-xl text-white text-sm focus:outline-none focus:border-violet-500"
        >
          <option value="">All Cities</option>
          <option v-for="city in cities" :key="city" :value="city">
            {{ city }}
          </option>
        </select>

        <!-- Show Handled Toggle -->
        <label class="flex items-center gap-2 px-4 py-2 bg-gray-900/60 border border-gray-800 rounded-xl text-sm cursor-pointer">
          <input 
            v-model="showHandled" 
            type="checkbox" 
            class="w-4 h-4 rounded border-gray-600 bg-gray-800 text-violet-600 focus:ring-violet-500"
          />
          <span class="text-gray-300">Show handled</span>
        </label>

        <!-- Clear Filters -->
        <button 
          v-if="hasFilters"
          @click="clearFilters"
          class="px-4 py-2 text-gray-400 hover:text-white text-sm transition-colors"
        >
          Clear all
        </button>
      </div>

      <!-- Stats Row -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div class="bg-gray-900/60 border border-gray-800 rounded-xl p-3 text-center">
          <div class="text-2xl font-bold text-white">{{ filteredSignals.length }}</div>
          <div class="text-xs text-gray-500">Signals</div>
        </div>
        <div class="bg-gray-900/60 border border-gray-800 rounded-xl p-3 text-center">
          <div class="text-2xl font-bold text-emerald-400">{{ highScoreCount }}</div>
          <div class="text-xs text-gray-500">High Priority</div>
        </div>
        <div class="bg-gray-900/60 border border-gray-800 rounded-xl p-3 text-center">
          <div class="text-2xl font-bold text-violet-400">{{ handledCount }}</div>
          <div class="text-xs text-gray-500">Handled</div>
        </div>
        <div class="bg-gray-900/60 border border-gray-800 rounded-xl p-3 text-center">
          <div class="text-2xl font-bold text-amber-400">{{ unhandledCount }}</div>
          <div class="text-xs text-gray-500">Unhandled</div>
        </div>
      </div>

      <!-- Signals List (V1.2: Paginated with all actions) -->
      <div class="space-y-3">
        <AgencySignalFeedItem
          v-for="signal in paginatedSignals"
          :key="signal.id"
          :signal="signal"
          @open="openArtist"
          @handle="handleSignal"
          @task="openTaskDrawer"
          @assign="openAssignDrawer"
          @proof="openProofDrawer"
        />
      </div>

      <!-- V1.1: Load More Button -->
      <div v-if="hasMoreSignals" class="text-center mt-6">
        <button 
          @click="loadMore"
          class="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium rounded-xl transition-colors"
        >
          Load more ({{ remainingCount }} remaining)
        </button>
      </div>

      <!-- Empty State -->
      <div v-if="!paginatedSignals.length" class="text-center py-12">
        <div class="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h3 class="text-white font-medium mb-1">No signals found</h3>
        <p class="text-gray-500 text-sm">Try adjusting your filters</p>
      </div>
    </div>

    <!-- Task Drawer -->
    <AgencyTaskDrawer
      :is-open="taskDrawerOpen"
      :band-id="selectedSignal?.bandId"
      :signal="selectedSignal"
      @close="taskDrawerOpen = false"
    />

    <!-- Assign Owner Drawer -->
    <AgencyAssignOwnerDrawer
      :is-open="assignDrawerOpen"
      :band-id="selectedBandId"
      @close="assignDrawerOpen = false"
    />

    <!-- Proof Drawer -->
    <AgencyProofDrawer
      :is-open="proofDrawerOpen"
      :signal="selectedSignal"
      @close="proofDrawerOpen = false"
    />
  </AgencyLayout>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAgencyPortalStore } from '~/stores/agencyPortal'
import { SIGNAL_TYPES } from '~/utils/agencyPortal/mockData'

definePageMeta({
  layout: 'agency'
})

useHead({
  title: 'Signals Feed - Agency Portal',
  meta: [
    { name: 'robots', content: 'noindex,nofollow' }
  ]
})

const router = useRouter()
const route = useRoute()
const store = useAgencyPortalStore()

// V1.2: Filter chips definition
const filterChips = [
  { key: 'highPriority', label: 'High Priority' },
  { key: 'needsAction', label: 'Needs Action Today' },
  { key: 'myArtists', label: 'My Artists' },
  { key: 'unassigned', label: 'Unassigned' },
  { key: 'cityClaim', label: 'City Claim' },
  { key: 'afterShow', label: 'After-Show' },
  { key: 'shareChain', label: 'Share Chain' },
  { key: 'newCities', label: 'New Cities' }
]

// V1.2: Type mappings for chips
const CHIP_TYPE_MAP = {
  cityClaim: ['CITY_CLAIM', 'CITY_STACK', 'NEW_CITY_UNLOCKED'],
  afterShow: ['AFTER_SHOW_ENERGY', 'PEAK_HOUR'],
  shareChain: ['SHARE_CHAIN'],
  newCities: ['NEW_CITY_UNLOCKED']
}

const NEEDS_ACTION_TYPES = ['MOMENTUM_SURGE', 'AFTER_SHOW_ENERGY', 'CITY_CLAIM', 'SHARE_CHAIN', 'PEAK_HOUR', 'PLATFORM_PULL']

// V1.2: Type boosts for priority sorting
const TYPE_BOOSTS = {
  AFTER_SHOW_ENERGY: 10,
  CITY_CLAIM: 8,
  SHARE_CHAIN: 8,
  PLATFORM_PULL: 7,
  MOMENTUM_SURGE: 7,
  PEAK_HOUR: 5,
  NEW_CITY_UNLOCKED: 4
}

// State
const searchQuery = ref('')
const searchInput = ref(null)
const sortMode = ref('priority')
const activeChips = ref(['needsAction'])
const filterOwner = ref('')
const filterTier = ref('')
const filterCity = ref('')
const filterScore = ref('')
const showHandled = ref(false)
const selectedView = ref('')
const taskDrawerOpen = ref(false)
const assignDrawerOpen = ref(false)
const proofDrawerOpen = ref(false)
const selectedSignal = ref(null)
const selectedBandId = ref(null)

// V1.2: Pagination
const PAGE_SIZE = 20
const displayCount = ref(PAGE_SIZE)

// Current member ID (for "My Artists" filter)
const currentMemberId = computed(() => store.members[0]?.id || 'mem_001')

// Load saved view from localStorage and handle query params
onMounted(() => {
  // Check for query params first (deep links)
  const typeParam = route.query.type
  const platformParam = route.query.platform
  const sortParam = route.query.sort
  const chipParam = route.query.chip
  const ownerParam = route.query.owner
  const tierParam = route.query.tier
  
  const hasQueryParams = typeParam || platformParam || sortParam || chipParam || ownerParam || tierParam
  
  if (hasQueryParams) {
    // Clear default chips and apply query param filters
    activeChips.value = []
    
    // Apply sort param
    if (sortParam) {
      const validSorts = ['priority', 'newest', 'highestScore', 'needsAction', 'unassignedFirst']
      if (validSorts.includes(sortParam)) {
        sortMode.value = sortParam
      }
    }
    
    // Apply chip param
    if (chipParam) {
      const validChips = ['highPriority', 'needsAction', 'myArtists', 'unassigned', 'cityClaim', 'afterShow', 'shareChain', 'newCities']
      if (validChips.includes(chipParam)) {
        activeChips.value.push(chipParam)
      }
    }
    
    // Apply owner param
    if (ownerParam) {
      filterOwner.value = ownerParam
    }
    
    // Apply tier param
    if (tierParam && ['A', 'B', 'C'].includes(tierParam)) {
      filterTier.value = tierParam
    }
    
    if (typeParam) {
      // Map type to chip if applicable
      if (typeParam === 'PLATFORM_PULL') {
        // For platform pull, we'll filter by type in the search
        searchQuery.value = platformParam ? `platform:${platformParam}` : ''
      }
      // Set type-based chip if it matches
      if (['CITY_CLAIM', 'CITY_STACK', 'NEW_CITY_UNLOCKED'].includes(typeParam)) {
        activeChips.value.push('cityClaim')
      } else if (['AFTER_SHOW_ENERGY', 'PEAK_HOUR'].includes(typeParam)) {
        activeChips.value.push('afterShow')
      } else if (typeParam === 'SHARE_CHAIN') {
        activeChips.value.push('shareChain')
      }
    }
    
    // Clear query params after applying
    router.replace({ query: {} })
  } else {
    // Load saved view if no query params
    const savedView = localStorage.getItem('agencySignalsSelectedView')
    if (savedView) {
      selectedView.value = savedView
      applyView()
    }
  }
  
  // Keyboard shortcut: Cmd/Ctrl + K to focus search
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})

function handleKeydown(e) {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault()
    searchInput.value?.focus()
  }
}

const cities = computed(() => {
  const citySet = new Set()
  store.allSignals.forEach(s => {
    if (s.context?.city) citySet.add(s.context.city)
  })
  return Array.from(citySet).sort()
})

const hasFilters = computed(() => {
  return searchQuery.value || filterOwner.value || filterTier.value || 
         filterCity.value || filterScore.value || showHandled.value || 
         activeChips.value.length > 0
})

// V1.2: Priority score calculation
function calculatePriorityScore(signal) {
  let score = signal.score || 0
  
  // Recency boost
  const createdAt = new Date(signal.createdAt)
  const now = new Date()
  const hoursAgo = (now - createdAt) / (1000 * 60 * 60)
  
  if (hoursAgo <= 2) score += 12
  else if (hoursAgo <= 6) score += 8
  else if (hoursAgo <= 24) score += 4
  
  // Type boost
  score += TYPE_BOOSTS[signal.type] || 0
  
  // Unassigned boost
  const owner = store.getOwnerForBand(signal.bandId)
  if (!owner) score += 6
  
  // Unhandled boost
  if (!store.isSignalHandled(signal.id)) score += 6
  
  return score
}

// V1.2: Check if signal qualifies for "Needs Action Today"
function isNeedsAction(signal) {
  return signal.score >= 85 && NEEDS_ACTION_TYPES.includes(signal.type)
}

// V1.2: Sorting functions
function sortSignals(signals, mode) {
  const sorted = [...signals]
  
  switch (mode) {
    case 'priority':
      sorted.sort((a, b) => {
        const scoreA = calculatePriorityScore(a)
        const scoreB = calculatePriorityScore(b)
        if (scoreB !== scoreA) return scoreB - scoreA
        return new Date(b.createdAt) - new Date(a.createdAt)
      })
      break
    case 'newest':
      sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      break
    case 'highestScore':
      sorted.sort((a, b) => b.score - a.score)
      break
    case 'needsAction':
      sorted.sort((a, b) => {
        const aNeeds = isNeedsAction(a) ? 1 : 0
        const bNeeds = isNeedsAction(b) ? 1 : 0
        if (bNeeds !== aNeeds) return bNeeds - aNeeds
        return calculatePriorityScore(b) - calculatePriorityScore(a)
      })
      break
    case 'unassignedFirst':
      sorted.sort((a, b) => {
        const aOwner = store.getOwnerForBand(a.bandId)
        const bOwner = store.getOwnerForBand(b.bandId)
        const aUnassigned = !aOwner ? 1 : 0
        const bUnassigned = !bOwner ? 1 : 0
        if (bUnassigned !== aUnassigned) return bUnassigned - aUnassigned
        return calculatePriorityScore(b) - calculatePriorityScore(a)
      })
      break
  }
  
  return sorted
}

// V1.2: Main filtered signals computation
const filteredSignals = computed(() => {
  // Get hygiene-filtered signals
  let signals = store.feedSignals({ showHandled: showHandled.value })
  
  // 1) Owner filter
  if (filterOwner.value) {
    if (filterOwner.value === 'unassigned') {
      signals = signals.filter(s => !store.getOwnerForBand(s.bandId))
    } else {
      signals = signals.filter(s => {
        const owner = store.getOwnerForBand(s.bandId)
        return owner?.id === filterOwner.value
      })
    }
  }
  
  // 2) Tier filter
  if (filterTier.value) {
    signals = signals.filter(s => {
      const band = store.getBandById(s.bandId)
      return band?.tier === filterTier.value
    })
  }
  
  // 3) City filter
  if (filterCity.value) {
    signals = signals.filter(s => s.context?.city === filterCity.value)
  }
  
  // 4) Score filter
  if (filterScore.value) {
    const minScore = parseInt(filterScore.value)
    if (minScore === 0) {
      signals = signals.filter(s => s.score < 55)
    } else if (minScore === 55) {
      signals = signals.filter(s => s.score >= 55 && s.score < 75)
    } else if (minScore === 75) {
      signals = signals.filter(s => s.score >= 75 && s.score < 85)
    } else {
      signals = signals.filter(s => s.score >= minScore)
    }
  }
  
  // 5) Apply chip filters
  if (activeChips.value.length > 0) {
    signals = signals.filter(signal => {
      // Type-based chips (OR logic within type chips)
      const typeChips = ['cityClaim', 'afterShow', 'shareChain', 'newCities']
      const activeTypeChips = activeChips.value.filter(c => typeChips.includes(c))
      
      if (activeTypeChips.length > 0) {
        const allowedTypes = activeTypeChips.flatMap(chip => CHIP_TYPE_MAP[chip] || [])
        if (!allowedTypes.includes(signal.type)) return false
      }
      
      // High Priority chip
      if (activeChips.value.includes('highPriority') && signal.score < 85) {
        return false
      }
      
      // Needs Action Today chip
      if (activeChips.value.includes('needsAction') && !isNeedsAction(signal)) {
        return false
      }
      
      // My Artists chip
      if (activeChips.value.includes('myArtists')) {
        const owner = store.getOwnerForBand(signal.bandId)
        if (owner?.id !== currentMemberId.value) return false
      }
      
      // Unassigned chip
      if (activeChips.value.includes('unassigned')) {
        const owner = store.getOwnerForBand(signal.bandId)
        if (owner) return false
      }
      
      return true
    })
  }
  
  // 6) Search filter
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    signals = signals.filter(s => {
      const band = store.getBandById(s.bandId)
      const bandName = band?.name?.toLowerCase() || ''
      const city = s.context?.city?.toLowerCase() || ''
      const headline = s.headline?.toLowerCase() || ''
      const proof = s.proof?.toLowerCase() || ''
      
      return bandName.includes(q) || city.includes(q) || headline.includes(q) || proof.includes(q)
    })
  }
  
  // 7) Sort
  return sortSignals(signals, sortMode.value)
})

// V1.2: Paginated signals
const paginatedSignals = computed(() => {
  return filteredSignals.value.slice(0, displayCount.value)
})

const hasMoreSignals = computed(() => {
  return filteredSignals.value.length > displayCount.value
})

const remainingCount = computed(() => {
  return filteredSignals.value.length - displayCount.value
})

function loadMore() {
  displayCount.value += PAGE_SIZE
}

const highScoreCount = computed(() => filteredSignals.value.filter(s => s.score >= 85).length)
const handledCount = computed(() => store.allSignals.filter(s => store.isSignalHandled(s.id)).length)
const unhandledCount = computed(() => store.allSignals.filter(s => !store.isSignalHandled(s.id)).length)

// V1.2: Chip toggle
function toggleChip(key) {
  const idx = activeChips.value.indexOf(key)
  if (idx >= 0) {
    activeChips.value.splice(idx, 1)
  } else {
    activeChips.value.push(key)
  }
  displayCount.value = PAGE_SIZE
}

// V1.2: Saved views
function applyView() {
  // Save to localStorage
  localStorage.setItem('agencySignalsSelectedView', selectedView.value)
  
  // Reset all filters first
  searchQuery.value = ''
  activeChips.value = []
  filterOwner.value = ''
  filterTier.value = ''
  filterCity.value = ''
  filterScore.value = ''
  showHandled.value = false
  sortMode.value = 'priority'
  
  // Apply preset
  switch (selectedView.value) {
    case 'myQueue':
      activeChips.value = ['myArtists', 'needsAction']
      sortMode.value = 'priority'
      break
    case 'highPriority':
      activeChips.value = ['highPriority']
      sortMode.value = 'highestScore'
      break
    case 'unassigned':
      filterOwner.value = 'unassigned'
      sortMode.value = 'unassignedFirst'
      break
    case 'cityClaimWatch':
      activeChips.value = ['cityClaim']
      sortMode.value = 'priority'
      break
    case 'afterShowWatch':
      activeChips.value = ['afterShow']
      sortMode.value = 'newest'
      break
  }
  
  displayCount.value = PAGE_SIZE
}

function clearFilters() {
  searchQuery.value = ''
  activeChips.value = []
  filterOwner.value = ''
  filterTier.value = ''
  filterCity.value = ''
  filterScore.value = ''
  showHandled.value = false
  sortMode.value = 'priority'
  selectedView.value = ''
  displayCount.value = PAGE_SIZE
  localStorage.removeItem('agencySignalsSelectedView')
}

function openArtist(bandId) {
  router.push(`/agency/artists/${bandId}`)
}

function handleSignal(signalId) {
  store.handleSignal(signalId)
}

function openTaskDrawer(signal) {
  selectedSignal.value = signal
  taskDrawerOpen.value = true
}

function openAssignDrawer(bandId) {
  selectedBandId.value = bandId
  assignDrawerOpen.value = true
}

function openProofDrawer(signal) {
  selectedSignal.value = signal
  proofDrawerOpen.value = true
}
</script>
