<template>
  <AgencyLayout>
    <div class="max-w-4xl mx-auto">
      <!-- Page Header -->
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-white mb-2">Cities Hub</h1>
        <p class="text-gray-400">Discover territorial opportunities across your roster</p>
      </div>

      <!-- City Stacks Alert -->
      <div v-if="cityStacks.length" class="mb-6">
        <div class="bg-violet-600/10 border border-violet-500/30 rounded-2xl p-4">
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-xl bg-violet-600/20 flex items-center justify-center flex-shrink-0">
              <svg class="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <div class="text-violet-300 font-semibold">City Stacks Detected</div>
              <p class="text-violet-400/70 text-sm mt-1">
                {{ cityStacks.length }} cit{{ cityStacks.length === 1 ? 'y has' : 'ies have' }} multiple roster artists performing well. 
                Consider coordinated territorial strategies.
              </p>
              <div class="flex flex-wrap gap-2 mt-3">
                <button 
                  v-for="stack in cityStacks" 
                  :key="stack.name"
                  @click="openCityDetail(stack)"
                  class="px-3 py-1.5 bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 text-sm rounded-lg transition-colors"
                >
                  {{ stack.name }} ({{ stack.artistCount }})
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Search -->
      <div class="mb-6">
        <div class="relative">
          <svg class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search cities..."
            class="w-full pl-12 pr-4 py-3 bg-gray-900/60 border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
          />
        </div>
      </div>

      <!-- Cities Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AgencyCityTile
          v-for="city in filteredCities"
          :key="city.name"
          :city="city"
          @open="openCityDetail"
        />
      </div>

      <!-- Empty State -->
      <div v-if="!filteredCities.length" class="text-center py-12">
        <div class="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          </svg>
        </div>
        <h3 class="text-white font-medium mb-1">No cities found</h3>
        <p class="text-gray-500 text-sm">Try adjusting your search</p>
      </div>
    </div>

    <!-- City Detail Drawer -->
    <AgencyCityDetailDrawer
      :is-open="cityDetailOpen"
      :city="selectedCity"
      @close="cityDetailOpen = false"
      @open-artist="openArtist"
    />
  </AgencyLayout>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAgencyPortalStore } from '~/stores/agencyPortal'

definePageMeta({
  layout: 'agency'
})

useHead({
  title: 'Cities Hub - Agency Portal',
  meta: [
    { name: 'robots', content: 'noindex,nofollow' }
  ]
})

const router = useRouter()
const route = useRoute()
const store = useAgencyPortalStore()

const searchQuery = ref('')
const cityDetailOpen = ref(false)
const selectedCity = ref(null)

// V1.1: Use cityHeatScores instead of activeCities for proper ranking
const cities = computed(() => store.cityHeatScores)
const cityStacks = computed(() => cities.value.filter(c => c.isStack))

const filteredCities = computed(() => {
  if (!searchQuery.value) return cities.value
  const q = searchQuery.value.toLowerCase()
  return cities.value.filter(city => city.name.toLowerCase().includes(q))
})

// V1.2: Handle query param for auto-opening city drawer
onMounted(() => {
  checkQueryParam()
})

watch(() => route.query.city, () => {
  checkQueryParam()
})

function checkQueryParam() {
  const cityName = route.query.city
  if (cityName) {
    const city = cities.value.find(c => c.name === cityName)
    if (city) {
      openCityDetail(city)
    }
    // Clear the query param after opening
    router.replace({ query: {} })
  }
}

function openCityDetail(city) {
  selectedCity.value = city
  cityDetailOpen.value = true
}

function openArtist(bandId) {
  cityDetailOpen.value = false
  router.push(`/agency/artists/${bandId}`)
}
</script>
