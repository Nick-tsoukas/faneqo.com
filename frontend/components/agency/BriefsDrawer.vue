<template>
  <Teleport to="body">
    <Transition name="drawer">
      <div v-if="isOpen" class="fixed inset-0 z-50">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/60" @click="$emit('close')" />
        
        <!-- Drawer -->
        <div class="absolute right-0 top-0 bottom-0 w-full max-w-2xl bg-gray-900 border-l border-gray-800 flex flex-col">
          <!-- Header -->
          <div class="p-4 border-b border-gray-800">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-white font-semibold text-lg">Briefs & Proof Packs</h2>
                <p class="text-gray-400 text-sm">Copy-ready intel for labels & partners</p>
              </div>
              <button @click="$emit('close')" class="p-2 text-gray-400 hover:text-white">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- Window Toggle -->
            <div class="flex items-center gap-3 mt-4">
              <span class="text-gray-400 text-sm">Window:</span>
              <div class="flex rounded-lg overflow-hidden border border-gray-700">
                <button
                  @click="setWindow('7d')"
                  class="px-3 py-1.5 text-xs font-medium transition-colors"
                  :class="window === '7d' ? 'bg-violet-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'"
                >
                  7 days
                </button>
                <button
                  @click="setWindow('30d')"
                  class="px-3 py-1.5 text-xs font-medium transition-colors"
                  :class="window === '30d' ? 'bg-violet-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'"
                >
                  30 days
                </button>
              </div>
            </div>

            <!-- Tabs -->
            <div class="flex gap-1 mt-4">
              <button
                v-for="tab in tabs"
                :key="tab.key"
                @click="activeTab = tab.key"
                class="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
                :class="activeTab === tab.key ? 'bg-violet-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'"
              >
                {{ tab.label }}
              </button>
            </div>
          </div>

          <!-- Content -->
          <div class="flex-1 overflow-y-auto p-4 space-y-4">
            <!-- Daily Tab -->
            <template v-if="activeTab === 'daily'">
              <AgencyCopyBlock
                title="Daily Brief"
                :content="dailyBriefContent"
                :show-markdown-toggle="true"
                @copied="showToast('Daily brief copied!')"
              />
            </template>

            <!-- Weekly Tab -->
            <template v-if="activeTab === 'weekly'">
              <AgencyCopyBlock
                title="Weekly Deck Outline"
                :content="weeklyDeckContent"
                :show-markdown-toggle="true"
                @copied="showToast('Weekly deck outline copied!')"
              />
            </template>

            <!-- City Tab -->
            <template v-if="activeTab === 'city'">
              <!-- City Selector -->
              <div class="mb-4">
                <label class="block text-sm text-gray-400 mb-2">Select City</label>
                <select
                  v-model="selectedCityKey"
                  class="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-violet-500"
                >
                  <option value="">Choose a city...</option>
                  <option v-for="city in cities" :key="city.name" :value="city.name">
                    {{ city.name }} (Heat: {{ city.heatScore }})
                  </option>
                </select>
              </div>

              <AgencyCopyBlock
                v-if="selectedCity"
                title="City Claim Brief"
                :content="cityBriefContent"
                :show-markdown-toggle="true"
                @copied="showToast('City claim brief copied!')"
              />
              <div v-else class="text-center py-12 text-gray-500">
                Select a city to generate brief
              </div>
            </template>

            <!-- Artist Tab -->
            <template v-if="activeTab === 'artist'">
              <!-- Artist Selector -->
              <div class="mb-4">
                <label class="block text-sm text-gray-400 mb-2">Select Artist</label>
                <select
                  v-model="selectedArtistId"
                  class="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-violet-500"
                >
                  <option value="">Choose an artist...</option>
                  <option v-for="band in bands" :key="band.bandId" :value="band.bandId">
                    {{ band.name }}
                  </option>
                </select>
              </div>

              <template v-if="selectedArtist">
                <AgencyCopyBlock
                  title="Slack Update"
                  :content="artistSlackUpdate"
                  @copied="showToast('Slack update copied!')"
                />
                <AgencyCopyBlock
                  title="Slack Thread Pack (4 messages)"
                  :content="artistThreadPack"
                  @copied="showToast('Thread pack copied!')"
                />
                <AgencyCopyBlock
                  title="Artist Momentum Pack"
                  :content="artistMomentumPackContent"
                  :show-markdown-toggle="true"
                  @copied="showToast('Momentum pack copied!')"
                />
              </template>
              <div v-else class="text-center py-12 text-gray-500">
                Select an artist to generate briefs
              </div>
            </template>
          </div>
        </div>

        <!-- Toast -->
        <Transition name="toast">
          <div
            v-if="toastMessage"
            class="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-medium shadow-xl"
          >
            {{ toastMessage }}
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useAgencyPortalStore } from '~/stores/agencyPortal'
import {
  slackUpdate,
  slackThreadPack,
  dailyBrief,
  weeklyDeckOutline,
  cityClaimBrief,
  artistMomentumPack,
  generateNarrativeLines,
  generateProofLines
} from '~/utils/agencyPortal/briefGenerators'
import { getPlaybookForSignalType } from '~/utils/agencyPortal/mockData'

const props = defineProps({
  isOpen: Boolean
})

defineEmits(['close'])

const store = useAgencyPortalStore()

// State
const activeTab = ref('daily')
const window = ref('7d')
const selectedCityKey = ref('')
const selectedArtistId = ref('')
const toastMessage = ref('')

const tabs = [
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'city', label: 'City' },
  { key: 'artist', label: 'Artist' }
]

// Load preferences from localStorage
onMounted(() => {
  const savedWindow = localStorage.getItem('agencyBriefWindow')
  const savedCity = localStorage.getItem('agencyBriefLastCityKey')
  const savedArtist = localStorage.getItem('agencyBriefLastArtistId')
  
  if (savedWindow) window.value = savedWindow
  if (savedCity) selectedCityKey.value = savedCity
  if (savedArtist) selectedArtistId.value = savedArtist
})

// Persist preferences
function setWindow(w) {
  window.value = w
  localStorage.setItem('agencyBriefWindow', w)
}

watch(selectedCityKey, (val) => {
  if (val) localStorage.setItem('agencyBriefLastCityKey', val)
})

watch(selectedArtistId, (val) => {
  if (val) localStorage.setItem('agencyBriefLastArtistId', val)
})

// Data
const bands = computed(() => store.rosterBands)
const cities = computed(() => store.cityHeatScores)
const selectedCity = computed(() => cities.value.find(c => c.name === selectedCityKey.value))
const selectedArtist = computed(() => bands.value.find(b => b.bandId === selectedArtistId.value))

// Toast
function showToast(message) {
  toastMessage.value = message
  setTimeout(() => { toastMessage.value = '' }, 2000)
}

// =====================================================
// DAILY BRIEF
// =====================================================
const dailyBriefContent = computed(() => {
  const actionItems = store.inboxSignals.slice(0, 5).map(signal => {
    const band = store.getBandById(signal.bandId)
    const owner = store.getOwnerForBand(signal.bandId)
    return {
      bandId: signal.bandId,
      bandName: band?.name || 'Unknown',
      signalHeadline: signal.headline,
      topCity: signal.context?.city || store.getBandTopCity(signal.bandId),
      score: signal.score,
      ownerName: owner?.name || 'Unassigned'
    }
  })

  const topMovers = store.topMovers.slice(0, 5).map(m => ({
    bandName: m.bandName,
    velocity: m.velocity,
    momentumIndex: m.momentumIndex,
    topCity: m.topCity
  }))

  const topCities = cities.value.slice(0, 5)

  const overdueTasks = store.overdueTasks.map(t => {
    const band = store.getBandById(t.bandId)
    const owner = store.members.find(m => m.id === t.ownerId)
    return {
      title: t.title,
      bandName: band?.name || 'Unknown',
      ownerName: owner?.name || 'Unassigned',
      dueAt: t.dueAt
    }
  })

  return dailyBrief({
    orgName: store.org.name,
    window: window.value,
    actionItems,
    topMovers,
    topCities,
    overdueTasks
  })
})

// =====================================================
// WEEKLY DECK OUTLINE
// =====================================================
const weeklyDeckContent = computed(() => {
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const rosterTrend = store.rosterMomentumTrend
  const avgNow = rosterTrend.length > 0 ? rosterTrend[rosterTrend.length - 1]?.avg || 50 : 50
  const avgPrev = rosterTrend.length > 7 ? rosterTrend[rosterTrend.length - 8]?.avg || 50 : 50

  const topCity = cities.value[0] || { name: 'N/A', heatScore: 0 }
  const biggestMover = store.topMovers[0] || { bandName: 'N/A', velocity: 0 }

  const topMovers = store.topMovers.slice(0, 5).map(m => {
    const signal = store.getSignalsForBand(m.bandId)[0]
    const playbook = signal ? getPlaybookForSignalType(signal.type) : null
    return {
      bandName: m.bandName,
      whyNow: signal?.headline || 'Momentum detected',
      playbook: playbook?.name || 'Review'
    }
  })

  const topCities = cities.value.slice(0, 5)

  const actionSignals = store.inboxSignals.slice(0, 6).map(s => {
    const band = store.getBandById(s.bandId)
    const owner = store.getOwnerForBand(s.bandId)
    const playbook = getPlaybookForSignalType(s.type)
    return {
      bandName: band?.name || 'Unknown',
      signalHeadline: s.headline,
      ownerName: owner?.name || 'Unassigned',
      nextStep: playbook?.steps?.[0] || 'Review signal'
    }
  })

  const taskStats = {
    overdue: store.overdueTasks.length,
    open: store.openTasks.length,
    topOwners: getTopOwnersByTaskLoad()
  }

  const proofLines = store.allSignals
    .filter(s => s.score >= 80)
    .slice(0, 3)
    .map(s => {
      const band = store.getBandById(s.bandId)
      return `${band?.name || 'Artist'}: ${s.hero} (${s.windowLabel})`
    })

  return weeklyDeckOutline({
    orgName: store.org.name,
    dateRange: { start: weekAgo, end: now },
    rosterMomentum: { current: avgNow, previous: avgPrev, delta: avgNow - avgPrev },
    topCity,
    biggestMover,
    topMovers,
    topCities,
    actionSignals,
    taskStats,
    proofLines
  })
})

function getTopOwnersByTaskLoad() {
  const ownerCounts = {}
  store.openTasks.forEach(t => {
    if (t.ownerId) {
      ownerCounts[t.ownerId] = (ownerCounts[t.ownerId] || 0) + 1
    }
  })
  return Object.entries(ownerCounts)
    .map(([id, count]) => {
      const member = store.members.find(m => m.id === id)
      return { name: member?.name || 'Unknown', count }
    })
    .sort((a, b) => b.count - a.count)
}

// =====================================================
// CITY CLAIM BRIEF
// =====================================================
const cityBriefContent = computed(() => {
  if (!selectedCity.value) return ''

  const cityBands = selectedCity.value.activeBandIds || []
  const topArtists = cityBands.slice(0, 5).map(bandId => {
    const band = store.getBandById(bandId)
    const signals = store.getSignalsForBand(bandId)
    const topSignal = signals[0]
    return {
      bandId,
      bandName: band?.name || 'Unknown',
      momentumState: store.getBandMomentumState(bandId),
      momentumIndex: store.getBandMomentumIndex(bandId),
      topSignalProof: topSignal?.proof
    }
  })

  return cityClaimBrief({
    city: selectedCity.value,
    window: window.value,
    topArtists
  })
})

// =====================================================
// ARTIST BRIEFS
// =====================================================
const artistTopSignal = computed(() => {
  if (!selectedArtist.value) return null
  const signals = store.getSignalsForBand(selectedArtist.value.bandId)
  return signals.sort((a, b) => b.score - a.score)[0]
})

const artistPlaybook = computed(() => {
  if (!artistTopSignal.value) return null
  return getPlaybookForSignalType(artistTopSignal.value.type)
})

const artistOwner = computed(() => {
  if (!selectedArtist.value) return null
  return store.getOwnerForBand(selectedArtist.value.bandId)
})

const artistMetrics = computed(() => {
  if (!selectedArtist.value) return null
  const bandId = selectedArtist.value.bandId
  return {
    momentumState: store.getBandMomentumState(bandId),
    momentumIndex: store.getBandMomentumIndex(bandId),
    velocity7d: store.getBandVelocity7d(bandId),
    topCity: store.getBandTopCity(bandId),
    window: window.value
  }
})

const artistSlackUpdate = computed(() => {
  if (!selectedArtist.value || !artistTopSignal.value) return 'Select an artist with signals'
  return slackUpdate({
    signal: artistTopSignal.value,
    band: selectedArtist.value,
    owner: artistOwner.value,
    playbook: artistPlaybook.value
  })
})

const artistThreadPack = computed(() => {
  if (!selectedArtist.value || !artistTopSignal.value) return 'Select an artist with signals'
  
  const cityData = cities.value.find(c => c.name === artistMetrics.value?.topCity)
  
  return slackThreadPack({
    signal: artistTopSignal.value,
    band: selectedArtist.value,
    owner: artistOwner.value,
    playbook: artistPlaybook.value,
    metrics: artistMetrics.value,
    cityData
  })
})

const artistMomentumPackContent = computed(() => {
  if (!selectedArtist.value) return 'Select an artist'
  
  const signals = store.getSignalsForBand(selectedArtist.value.bandId)
  const narrativeLines = generateNarrativeLines(artistMetrics.value, artistTopSignal.value)
  const proofLines = generateProofLines(signals, selectedArtist.value)

  return artistMomentumPack({
    band: selectedArtist.value,
    signal: artistTopSignal.value,
    metrics: artistMetrics.value,
    playbook: artistPlaybook.value,
    owner: artistOwner.value,
    narrativeLines,
    proofLines
  })
})
</script>

<style scoped>
.drawer-enter-active,
.drawer-leave-active {
  transition: all 0.3s ease;
}
.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
}
.drawer-enter-from > div:last-child,
.drawer-leave-to > div:last-child {
  transform: translateX(100%);
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, 20px);
}
</style>
