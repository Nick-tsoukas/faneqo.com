<template>
  <div class="bg-gray-900/60 border border-gray-800 rounded-2xl p-5">
    <div class="flex items-center justify-between mb-4">
      <div>
        <h3 class="text-white font-semibold">Top Movers</h3>
        <p class="text-gray-500 text-xs mt-0.5">Bands with highest 7-day velocity</p>
      </div>
    </div>

    <!-- Movers Table -->
    <div class="space-y-2">
      <div 
        v-for="(mover, idx) in topMovers" 
        :key="mover.band.bandId"
        class="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-gray-800/50 transition-colors"
        :class="idx === 0 ? 'bg-emerald-600/10' : ''"
        @click="$emit('openArtist', mover.band.bandId)"
      >
        <!-- Rank -->
        <div 
          class="w-6 h-6 rounded flex items-center justify-center text-xs font-bold"
          :class="idx < 3 ? 'bg-violet-600/20 text-violet-400' : 'bg-gray-800 text-gray-500'"
        >
          {{ idx + 1 }}
        </div>

        <!-- Band Info -->
        <div class="flex-1 min-w-0">
          <div class="text-white text-sm font-medium truncate">{{ mover.band.name }}</div>
          <div class="text-xs text-gray-500 truncate">{{ mover.topCity }}</div>
        </div>

        <!-- Velocity -->
        <div 
          class="text-sm font-bold"
          :class="mover.velocity >= 0 ? 'text-emerald-400' : 'text-red-400'"
        >
          {{ mover.velocity >= 0 ? '+' : '' }}{{ mover.velocity }}
        </div>

        <!-- Momentum Index -->
        <div class="w-10 text-right">
          <span class="text-xs text-gray-400">{{ mover.momentumIndex }}</span>
        </div>

        <!-- Top Signal Indicator -->
        <div 
          v-if="mover.topSignal"
          class="w-2 h-2 rounded-full"
          :class="getSignalDotClass(mover.topSignal.accent)"
          :title="mover.topSignal.headline"
        />
      </div>
    </div>

    <!-- View All Link -->
    <button 
      v-if="allMovers.length > 10"
      @click="$emit('viewAll')"
      class="w-full mt-3 py-2 text-center text-xs text-violet-400 hover:text-violet-300 transition-colors"
    >
      View all {{ allMovers.length }} artists
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAgencyPortalStore } from '~/stores/agencyPortal'

defineEmits(['openArtist', 'viewAll'])

const store = useAgencyPortalStore()

const allMovers = computed(() => store.topMovers)
const topMovers = computed(() => allMovers.value.slice(0, 10))

function getSignalDotClass(accent) {
  const classes = {
    violet: 'bg-violet-400',
    blue: 'bg-blue-400',
    emerald: 'bg-emerald-400',
    amber: 'bg-amber-400',
    rose: 'bg-rose-400'
  }
  return classes[accent] || classes.violet
}
</script>
