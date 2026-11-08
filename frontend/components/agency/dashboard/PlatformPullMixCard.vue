<template>
  <div class="bg-gray-900/60 border border-gray-800 rounded-2xl p-5">
    <div class="flex items-center justify-between mb-4">
      <div>
        <h3 class="text-white font-semibold">Platform Pull Mix</h3>
        <p class="text-gray-500 text-xs mt-0.5">Click distribution across platforms</p>
      </div>
      <div class="flex gap-1">
        <button 
          @click="days = 7"
          class="px-3 py-1 text-xs rounded-lg transition-colors"
          :class="days === 7 ? 'bg-violet-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'"
        >
          7d
        </button>
        <button 
          @click="days = 30"
          class="px-3 py-1 text-xs rounded-lg transition-colors"
          :class="days === 30 ? 'bg-violet-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'"
        >
          30d
        </button>
      </div>
    </div>

    <!-- Stacked Horizontal Bar -->
    <div class="h-8 flex rounded-lg overflow-hidden mb-4">
      <div 
        v-if="mix.percentages.spotify > 0"
        class="bg-emerald-500 flex items-center justify-center transition-all"
        :style="{ width: `${mix.percentages.spotify}%` }"
      >
        <span v-if="mix.percentages.spotify >= 15" class="text-xs text-white font-medium">
          {{ mix.percentages.spotify }}%
        </span>
      </div>
      <div 
        v-if="mix.percentages.youtube > 0"
        class="bg-red-500 flex items-center justify-center transition-all"
        :style="{ width: `${mix.percentages.youtube}%` }"
      >
        <span v-if="mix.percentages.youtube >= 15" class="text-xs text-white font-medium">
          {{ mix.percentages.youtube }}%
        </span>
      </div>
      <div 
        v-if="mix.percentages.tickets > 0"
        class="bg-amber-500 flex items-center justify-center transition-all"
        :style="{ width: `${mix.percentages.tickets}%` }"
      >
        <span v-if="mix.percentages.tickets >= 15" class="text-xs text-white font-medium">
          {{ mix.percentages.tickets }}%
        </span>
      </div>
      <div 
        v-if="mix.percentages.instagram > 0"
        class="bg-pink-500 flex items-center justify-center transition-all"
        :style="{ width: `${mix.percentages.instagram}%` }"
      >
        <span v-if="mix.percentages.instagram >= 15" class="text-xs text-white font-medium">
          {{ mix.percentages.instagram }}%
        </span>
      </div>
    </div>

    <!-- Legend (clickable) -->
    <div class="grid grid-cols-2 gap-2">
      <div 
        class="flex items-center gap-2 cursor-pointer hover:bg-gray-800/50 rounded p-1 -m-1 transition-colors"
        @click="$emit('filterPlatform', 'Spotify')"
      >
        <div class="w-3 h-3 rounded bg-emerald-500" />
        <span class="text-xs text-gray-400">Spotify</span>
        <span class="text-xs text-white font-medium ml-auto">{{ formatNumber(mix.totals.spotify) }}</span>
      </div>
      <div 
        class="flex items-center gap-2 cursor-pointer hover:bg-gray-800/50 rounded p-1 -m-1 transition-colors"
        @click="$emit('filterPlatform', 'YouTube')"
      >
        <div class="w-3 h-3 rounded bg-red-500" />
        <span class="text-xs text-gray-400">YouTube</span>
        <span class="text-xs text-white font-medium ml-auto">{{ formatNumber(mix.totals.youtube) }}</span>
      </div>
      <div 
        class="flex items-center gap-2 cursor-pointer hover:bg-gray-800/50 rounded p-1 -m-1 transition-colors"
        @click="$emit('filterPlatform', 'Tickets')"
      >
        <div class="w-3 h-3 rounded bg-amber-500" />
        <span class="text-xs text-gray-400">Tickets</span>
        <span class="text-xs text-white font-medium ml-auto">{{ formatNumber(mix.totals.tickets) }}</span>
      </div>
      <div 
        class="flex items-center gap-2 cursor-pointer hover:bg-gray-800/50 rounded p-1 -m-1 transition-colors"
        @click="$emit('filterPlatform', 'Instagram')"
      >
        <div class="w-3 h-3 rounded bg-pink-500" />
        <span class="text-xs text-gray-400">Instagram</span>
        <span class="text-xs text-white font-medium ml-auto">{{ formatNumber(mix.totals.instagram) }}</span>
      </div>
    </div>

    <!-- Total -->
    <div class="mt-4 pt-3 border-t border-gray-800 flex items-center justify-between">
      <span class="text-xs text-gray-500">Total clicks</span>
      <span class="text-lg font-bold text-white">{{ formatNumber(mix.total) }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAgencyPortalStore } from '~/stores/agencyPortal'

defineEmits(['filterPlatform'])

const store = useAgencyPortalStore()
const days = ref(7)

const mix = computed(() => store.platformPullMix(days.value))

function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}
</script>
