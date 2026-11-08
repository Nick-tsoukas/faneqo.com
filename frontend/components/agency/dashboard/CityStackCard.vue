<template>
  <div class="bg-gray-900/60 border border-gray-800 rounded-2xl p-5">
    <div class="flex items-center justify-between mb-4">
      <div>
        <h3 class="text-white font-semibold">City Stacks</h3>
        <p class="text-gray-500 text-xs mt-0.5">Cities with 2+ high-momentum artists</p>
      </div>
      <span 
        v-if="stacks.length"
        class="text-xs px-2 py-1 rounded-full bg-violet-600/20 text-violet-400"
      >
        {{ stacks.length }} active
      </span>
    </div>

    <!-- Stack List -->
    <div v-if="stacks.length" class="space-y-3">
      <div 
        v-for="stack in stacks" 
        :key="stack.name"
        class="bg-violet-600/10 border border-violet-500/20 rounded-xl p-3 cursor-pointer hover:border-violet-500/40 transition-colors"
        @click="$emit('openCity', stack)"
      >
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            <span class="text-white font-medium">{{ stack.name }}</span>
          </div>
          <span class="text-violet-400 text-sm font-bold">{{ stack.heatScore }}</span>
        </div>

        <!-- Stacked Avatars -->
        <div class="flex items-center gap-2">
          <div class="flex -space-x-2">
            <div 
              v-for="bandId in stack.highMomentumBandIds.slice(0, 5)" 
              :key="bandId"
              class="w-7 h-7 rounded-full bg-violet-600/30 border-2 border-gray-900 flex items-center justify-center text-xs text-violet-300 font-medium"
              :title="getBandName(bandId)"
            >
              {{ getBandInitial(bandId) }}
            </div>
            <div 
              v-if="stack.highMomentumBandIds.length > 5"
              class="w-7 h-7 rounded-full bg-gray-800 border-2 border-gray-900 flex items-center justify-center text-xs text-gray-400"
            >
              +{{ stack.highMomentumBandIds.length - 5 }}
            </div>
          </div>
          <span class="text-xs text-gray-500">
            {{ stack.highMomentumBandIds.length }} artist{{ stack.highMomentumBandIds.length !== 1 ? 's' : '' }} hot
          </span>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-8">
      <div class="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center mx-auto mb-3">
        <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      </div>
      <p class="text-gray-500 text-sm">No city stacks detected</p>
      <p class="text-gray-600 text-xs mt-1">Need 2+ artists with momentum ≥75 in same city</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAgencyPortalStore } from '~/stores/agencyPortal'

defineEmits(['openCity'])

const store = useAgencyPortalStore()

const stacks = computed(() => {
  return store.cityHeatScores.filter(city => city.isStack)
})

function getBandName(bandId) {
  const band = store.getBandById(bandId)
  return band?.name || 'Unknown'
}

function getBandInitial(bandId) {
  const band = store.getBandById(bandId)
  return band?.name?.charAt(0) || '?'
}
</script>
