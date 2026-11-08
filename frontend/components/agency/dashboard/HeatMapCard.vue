<template>
  <div class="bg-gray-900/60 border border-gray-800 rounded-2xl p-5">
    <div class="flex items-center justify-between mb-4">
      <div>
        <h3 class="text-white font-semibold">City Heat Map</h3>
        <p class="text-gray-500 text-xs mt-0.5">Top cities by heat score</p>
      </div>
    </div>

    <!-- Top Cities Table -->
    <div class="space-y-2">
      <div 
        v-for="(city, idx) in topCities" 
        :key="city.name"
        class="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-gray-800/50 transition-colors"
        :class="idx === 0 ? 'bg-violet-600/10' : 'bg-gray-800/30'"
        @click="$emit('openCity', city)"
      >
        <div 
          class="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
          :class="getHeatClass(city.heatScore)"
        >
          {{ city.heatScore }}
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <span class="text-white font-medium text-sm">{{ city.name }}</span>
            <span 
              v-if="city.isStack"
              class="text-[10px] px-1.5 py-0.5 rounded bg-violet-600/20 text-violet-400"
            >
              STACK
            </span>
          </div>
          <div class="text-xs text-gray-500">
            {{ city.activeArtists }} active • {{ city.highMomentumArtists }} hot
          </div>
        </div>
        <div class="w-16">
          <!-- Mini heat bar -->
          <div class="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div 
              class="h-full rounded-full transition-all"
              :class="getHeatBarClass(city.heatScore)"
              :style="{ width: `${city.heatScore}%` }"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Mini Tile Grid (decorative) -->
    <div class="mt-4 pt-4 border-t border-gray-800">
      <div class="grid grid-cols-8 gap-1">
        <div 
          v-for="(city, idx) in allCities.slice(0, 16)" 
          :key="idx"
          class="aspect-square rounded"
          :class="getTileClass(city.heatScore)"
          :title="`${city.name}: ${city.heatScore}`"
        />
      </div>
      <p class="text-xs text-gray-600 mt-2 text-center">{{ allCities.length }} cities tracked</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAgencyPortalStore } from '~/stores/agencyPortal'
import { safeInt, isValidNumber } from '~/utils/agencyPortal/validateMockData'

defineEmits(['openCity'])

const store = useAgencyPortalStore()

const allCities = computed(() => store.cityHeatScores)
const topCities = computed(() => allCities.value.slice(0, 5))

function getHeatClass(score) {
  if (score >= 80) return 'bg-rose-500/20 text-rose-400'
  if (score >= 60) return 'bg-amber-500/20 text-amber-400'
  if (score >= 40) return 'bg-blue-500/20 text-blue-400'
  return 'bg-gray-500/20 text-gray-400'
}

function getHeatBarClass(score) {
  if (score >= 80) return 'bg-gradient-to-r from-rose-600 to-rose-400'
  if (score >= 60) return 'bg-gradient-to-r from-amber-600 to-amber-400'
  if (score >= 40) return 'bg-gradient-to-r from-blue-600 to-blue-400'
  return 'bg-gray-500'
}

function getTileClass(score) {
  if (score >= 80) return 'bg-rose-500/60'
  if (score >= 60) return 'bg-amber-500/50'
  if (score >= 40) return 'bg-blue-500/40'
  if (score >= 20) return 'bg-violet-500/30'
  return 'bg-gray-700/50'
}
</script>
