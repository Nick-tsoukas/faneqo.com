<template>
  <AgencyLayout>
    <div class="max-w-4xl mx-auto">
      <!-- Page Header -->
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-white mb-2">Roster Admin</h1>
        <p class="text-gray-400">Manage your roster tiers and assignments</p>
      </div>

      <!-- Stats Row -->
      <div class="grid grid-cols-4 gap-3 mb-6">
        <div class="bg-gray-900/60 border border-gray-800 rounded-xl p-3 text-center">
          <div class="text-2xl font-bold text-white">{{ store.rosterBands.length }}</div>
          <div class="text-xs text-gray-500">Total Artists</div>
        </div>
        <div class="bg-gray-900/60 border border-amber-500/30 rounded-xl p-3 text-center">
          <div class="text-2xl font-bold text-amber-400">{{ tierCounts.A }}</div>
          <div class="text-xs text-gray-500">Tier A</div>
        </div>
        <div class="bg-gray-900/60 border border-blue-500/30 rounded-xl p-3 text-center">
          <div class="text-2xl font-bold text-blue-400">{{ tierCounts.B }}</div>
          <div class="text-xs text-gray-500">Tier B</div>
        </div>
        <div class="bg-gray-900/60 border border-gray-500/30 rounded-xl p-3 text-center">
          <div class="text-2xl font-bold text-gray-400">{{ tierCounts.C }}</div>
          <div class="text-xs text-gray-500">Tier C</div>
        </div>
      </div>

      <!-- Search & Filter -->
      <div class="flex flex-wrap gap-3 mb-6">
        <div class="flex-1 min-w-[200px]">
          <div class="relative">
            <svg class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search artists..."
              class="w-full pl-12 pr-4 py-2.5 bg-gray-900/60 border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
            />
          </div>
        </div>
        <select
          v-model="filterTier"
          class="px-4 py-2.5 bg-gray-900/60 border border-gray-800 rounded-xl text-white text-sm focus:outline-none focus:border-violet-500"
        >
          <option value="">All Tiers</option>
          <option value="A">Tier A</option>
          <option value="B">Tier B</option>
          <option value="C">Tier C</option>
        </select>
        <select
          v-model="filterOwner"
          class="px-4 py-2.5 bg-gray-900/60 border border-gray-800 rounded-xl text-white text-sm focus:outline-none focus:border-violet-500"
        >
          <option value="">All Owners</option>
          <option v-for="member in agents" :key="member.id" :value="member.id">
            {{ member.name }}
          </option>
        </select>
      </div>

      <!-- Roster Table -->
      <div class="bg-gray-900/60 border border-gray-800 rounded-2xl overflow-hidden">
        <!-- Header -->
        <div class="hidden md:grid md:grid-cols-12 gap-4 px-4 py-3 bg-gray-800/50 text-xs text-gray-400 font-medium uppercase tracking-wide">
          <div class="col-span-4">Artist</div>
          <div class="col-span-2">Genre</div>
          <div class="col-span-2">Home City</div>
          <div class="col-span-2">Tier</div>
          <div class="col-span-2">Owner</div>
        </div>

        <!-- Rows -->
        <div class="divide-y divide-gray-800">
          <div 
            v-for="band in filteredBands" 
            :key="band.bandId"
            class="p-4 hover:bg-gray-800/30 transition-colors"
          >
            <div class="md:grid md:grid-cols-12 md:gap-4 md:items-center">
              <!-- Artist -->
              <div class="col-span-4 flex items-center gap-3 mb-3 md:mb-0">
                <div class="w-10 h-10 rounded-xl bg-gray-700 flex items-center justify-center flex-shrink-0">
                  <span class="text-gray-300 font-medium">{{ band.name.charAt(0) }}</span>
                </div>
                <div>
                  <NuxtLink 
                    :to="`/agency/artists/${band.bandId}`"
                    class="text-white font-medium hover:text-violet-400 transition-colors"
                  >
                    {{ band.name }}
                  </NuxtLink>
                  <div class="text-xs text-gray-500 md:hidden">{{ band.genre }} • {{ band.homeCity }}</div>
                </div>
              </div>

              <!-- Genre (desktop) -->
              <div class="col-span-2 text-sm text-gray-400 hidden md:block">
                {{ band.genre }}
              </div>

              <!-- Home City (desktop) -->
              <div class="col-span-2 text-sm text-gray-400 hidden md:block">
                {{ band.homeCity }}
              </div>

              <!-- Tier -->
              <div class="col-span-2 mb-3 md:mb-0">
                <select
                  :value="band.tier"
                  @change="updateTier(band.bandId, $event.target.value)"
                  class="px-3 py-1.5 bg-gray-800 border rounded-lg text-sm focus:outline-none focus:border-violet-500"
                  :class="tierSelectClass(band.tier)"
                >
                  <option value="A">Tier A</option>
                  <option value="B">Tier B</option>
                  <option value="C">Tier C</option>
                </select>
              </div>

              <!-- Owner -->
              <div class="col-span-2">
                <select
                  :value="getOwnerId(band.bandId)"
                  @change="updateOwner(band.bandId, $event.target.value)"
                  class="w-full px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-violet-500"
                >
                  <option value="">Unassigned</option>
                  <option v-for="member in agents" :key="member.id" :value="member.id">
                    {{ member.name }}
                  </option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="!filteredBands.length" class="text-center py-12 text-gray-500">
          No artists match your filters
        </div>
      </div>
    </div>
  </AgencyLayout>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAgencyPortalStore } from '~/stores/agencyPortal'

definePageMeta({
  layout: 'agency'
})

useHead({
  title: 'Roster Admin - Agency Portal',
  meta: [
    { name: 'robots', content: 'noindex,nofollow' }
  ]
})

const store = useAgencyPortalStore()

const searchQuery = ref('')
const filterTier = ref('')
const filterOwner = ref('')

const agents = computed(() => store.members.filter(m => ['admin', 'agent'].includes(m.role)))

const tierCounts = computed(() => {
  const counts = { A: 0, B: 0, C: 0 }
  store.rosterBands.forEach(b => {
    if (counts[b.tier] !== undefined) counts[b.tier]++
  })
  return counts
})

const filteredBands = computed(() => {
  let bands = [...store.rosterBands]
  
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    bands = bands.filter(b => 
      b.name.toLowerCase().includes(q) ||
      b.genre?.toLowerCase().includes(q) ||
      b.homeCity?.toLowerCase().includes(q)
    )
  }
  
  if (filterTier.value) {
    bands = bands.filter(b => b.tier === filterTier.value)
  }
  
  if (filterOwner.value) {
    bands = bands.filter(b => {
      const ownerId = store.assignments[b.bandId] || b.ownerId
      return ownerId === filterOwner.value
    })
  }
  
  return bands.sort((a, b) => {
    const tierOrder = { A: 0, B: 1, C: 2 }
    return tierOrder[a.tier] - tierOrder[b.tier] || a.name.localeCompare(b.name)
  })
})

function getOwnerId(bandId) {
  return store.assignments[bandId] || store.getBandById(bandId)?.ownerId || ''
}

function tierSelectClass(tier) {
  const classes = {
    A: 'border-amber-500/50 text-amber-400',
    B: 'border-blue-500/50 text-blue-400',
    C: 'border-gray-500/50 text-gray-400'
  }
  return classes[tier] || classes.C
}

function updateTier(bandId, tier) {
  store.updateBandTier(bandId, tier)
}

function updateOwner(bandId, ownerId) {
  store.assignBand(bandId, ownerId || null)
}
</script>
