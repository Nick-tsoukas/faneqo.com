<template>
  <AgencyLayout>
    <div class="max-w-6xl mx-auto">
      <!-- Page Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-white mb-2">Dashboard</h1>
          <p class="text-gray-400">Roster performance overview and territorial insights</p>
        </div>
        <button
          @click="briefsDrawerOpen = true"
          class="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-colors flex items-center gap-2"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Briefs
        </button>
      </div>

      <!-- Daily Brief Strip -->
      <AgencyDailyBriefStrip />

      <!-- Dashboard Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <!-- Roster Momentum Trend -->
        <AgencyDashboardRosterMomentumTrendCard @click="navigateToMomentumSignals" />

        <!-- Platform Pull Mix -->
        <AgencyDashboardPlatformPullMixCard @filter-platform="navigateToPlatformSignals" />

        <!-- Heat Map -->
        <AgencyDashboardHeatMapCard @open-city="navigateToCity" />

        <!-- City Stacks -->
        <AgencyDashboardCityStackCard @open-city="openCityDetail" />

        <!-- After-Show Lift -->
        <AgencyDashboardAfterShowLiftCard @click="navigateToAfterShowSignals" />

        <!-- Top Movers -->
        <AgencyDashboardTopMoversCard 
          @open-artist="openArtist" 
          @view-all="navigateTo('/agency/admin')"
        />
      </div>
    </div>

    <!-- City Detail Drawer -->
    <AgencyCityDetailDrawer
      :is-open="cityDetailOpen"
      :city="selectedCity"
      @close="cityDetailOpen = false"
      @open-artist="openArtist"
    />

    <!-- V1.2: Briefs Drawer -->
    <AgencyBriefsDrawer
      :is-open="briefsDrawerOpen"
      @close="briefsDrawerOpen = false"
    />
  </AgencyLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAgencyPortalStore } from '~/stores/agencyPortal'
import { validateMockData } from '~/utils/agencyPortal/validateMockData'

definePageMeta({
  layout: 'agency'
})

useHead({
  title: 'Dashboard - Agency Portal',
  meta: [
    { name: 'robots', content: 'noindex,nofollow' }
  ]
})

const router = useRouter()
const store = useAgencyPortalStore()

const cityDetailOpen = ref(false)
const selectedCity = ref(null)
const briefsDrawerOpen = ref(false)

// Dev-only: Validate mock data on mount
onMounted(() => {
  if (process.env.NODE_ENV !== 'production') {
    validateMockData(store)
  }
})

function openCityDetail(city) {
  selectedCity.value = city
  cityDetailOpen.value = true
}

function navigateToCity(city) {
  if (city?.name) {
    router.push(`/agency/cities?city=${encodeURIComponent(city.name)}`)
  } else {
    router.push('/agency/cities')
  }
}

function openArtist(bandId) {
  cityDetailOpen.value = false
  router.push(`/agency/artists/${bandId}`)
}

// V1.3: OS Actions - click-through navigation
function navigateToMomentumSignals() {
  router.push('/agency/signals?sort=priority&chip=needsAction')
}

function navigateToPlatformSignals(platform) {
  router.push(`/agency/signals?type=PLATFORM_PULL&platform=${encodeURIComponent(platform)}`)
}

function navigateToAfterShowSignals() {
  router.push('/agency/signals?type=AFTER_SHOW_ENERGY')
}
</script>
