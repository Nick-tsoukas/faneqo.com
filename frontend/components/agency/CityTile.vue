<template>
  <div 
    class="bg-gray-900/60 border border-gray-800 rounded-2xl p-4 hover:border-gray-700 transition-all cursor-pointer"
    @click="$emit('open', city)"
  >
    <div class="flex items-start justify-between mb-3">
      <div class="flex items-center gap-3">
        <div 
          class="w-10 h-10 rounded-xl flex items-center justify-center"
          :class="heatBgClass"
        >
          <!-- V1.1: Show heat score in icon -->
          <span class="text-sm font-bold" :class="heatTextClass">{{ city.heatScore || 0 }}</span>
        </div>
        <div>
          <h3 class="text-white font-medium">{{ city.name }}</h3>
          <p class="text-gray-500 text-xs">{{ city.activeArtists || 0 }} active artist{{ city.activeArtists !== 1 ? 's' : '' }}</p>
        </div>
      </div>
      
      <!-- Stack Badge -->
      <span 
        v-if="city.isStack"
        class="text-xs px-2 py-1 rounded-full bg-violet-600/20 text-violet-400 border border-violet-500/30"
      >
        STACK
      </span>
    </div>

    <!-- V1.1: Heat Score Bar -->
    <div class="mb-3">
      <div class="flex items-center justify-between text-xs mb-1">
        <span class="text-gray-500">City Heat</span>
        <span :class="heatTextClass" class="font-medium">{{ city.heatScore || 0 }}</span>
      </div>
      <div class="h-2 bg-gray-800 rounded-full overflow-hidden">
        <div 
          class="h-full rounded-full transition-all"
          :class="heatBarClass"
          :style="{ width: `${city.heatScore || 0}%` }"
        />
      </div>
    </div>

    <!-- V1.1: Artist Stats -->
    <div class="bg-gray-800/50 rounded-xl p-3 mb-3">
      <div class="grid grid-cols-2 gap-3 text-center">
        <div>
          <div class="text-lg font-bold text-white">{{ city.activeArtists || 0 }}</div>
          <div class="text-xs text-gray-500">Active</div>
        </div>
        <div>
          <div class="text-lg font-bold" :class="city.highMomentumArtists >= 2 ? 'text-emerald-400' : 'text-gray-400'">
            {{ city.highMomentumArtists || 0 }}
          </div>
          <div class="text-xs text-gray-500">High Momentum</div>
        </div>
      </div>
    </div>

    <!-- Artists Preview -->
    <div class="flex items-center gap-2">
      <div class="flex -space-x-2">
        <div 
          v-for="bandId in displayBandIds" 
          :key="bandId"
          class="w-7 h-7 rounded-full bg-gray-700 border-2 border-gray-900 flex items-center justify-center text-xs text-gray-300"
          :title="getBandName(bandId)"
        >
          {{ getBandInitial(bandId) }}
        </div>
        <div 
          v-if="totalBands > 4"
          class="w-7 h-7 rounded-full bg-gray-800 border-2 border-gray-900 flex items-center justify-center text-xs text-gray-400"
        >
          +{{ totalBands - 4 }}
        </div>
      </div>
    </div>

    <!-- Open Button -->
    <button 
      @click.stop="$emit('open', city)"
      class="w-full mt-3 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium rounded-lg transition-colors"
    >
      Open City
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAgencyPortalStore } from '~/stores/agencyPortal'

const props = defineProps({
  city: {
    type: Object,
    required: true
  }
})

defineEmits(['open'])

const store = useAgencyPortalStore()

// V1.1: Heat-based styling
const heatScore = computed(() => props.city.heatScore || 0)

const heatBgClass = computed(() => {
  if (heatScore.value >= 80) return 'bg-rose-500/20'
  if (heatScore.value >= 60) return 'bg-amber-500/20'
  if (heatScore.value >= 40) return 'bg-blue-500/20'
  return 'bg-gray-800'
})

const heatTextClass = computed(() => {
  if (heatScore.value >= 80) return 'text-rose-400'
  if (heatScore.value >= 60) return 'text-amber-400'
  if (heatScore.value >= 40) return 'text-blue-400'
  return 'text-gray-400'
})

const heatBarClass = computed(() => {
  if (heatScore.value >= 80) return 'bg-gradient-to-r from-rose-600 to-rose-400'
  if (heatScore.value >= 60) return 'bg-gradient-to-r from-amber-600 to-amber-400'
  if (heatScore.value >= 40) return 'bg-gradient-to-r from-blue-600 to-blue-400'
  return 'bg-gray-600'
})

// V1.1: Get band IDs from new structure
const displayBandIds = computed(() => {
  const ids = props.city.activeBandIds || props.city.highMomentumBandIds || []
  return ids.slice(0, 4)
})

const totalBands = computed(() => {
  return (props.city.activeBandIds || []).length
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
