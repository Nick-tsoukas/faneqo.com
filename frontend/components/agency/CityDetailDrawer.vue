<template>
  <Teleport to="body">
    <Transition name="drawer">
      <div v-if="isOpen && city" class="fixed inset-0 z-50">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/60" @click="$emit('close')" />
        
        <!-- Drawer -->
        <div class="absolute right-0 top-0 bottom-0 w-full max-w-lg bg-gray-900 border-l border-gray-800 flex flex-col">
          <!-- Header -->
          <div class="p-4 border-b border-gray-800">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div 
                  class="w-12 h-12 rounded-xl flex items-center justify-center"
                  :class="heatBgClass"
                >
                  <!-- V1.1: Show heat score -->
                  <span class="text-lg font-bold" :class="heatTextClass">{{ city.heatScore || 0 }}</span>
                </div>
                <div>
                  <h2 class="text-white font-semibold text-lg">{{ city.name }}</h2>
                  <div class="flex items-center gap-2">
                    <span class="text-gray-400 text-sm">{{ city.activeArtists || 0 }} artists</span>
                    <span 
                      v-if="city.isStack"
                      class="text-xs px-2 py-0.5 rounded-full bg-violet-600/20 text-violet-400 border border-violet-500/30"
                    >
                      CITY STACK
                    </span>
                  </div>
                </div>
              </div>
              <button @click="$emit('close')" class="p-2 text-gray-400 hover:text-white">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Content -->
          <div class="flex-1 overflow-y-auto p-4">
            <!-- V1.1: City Heat Score -->
            <div class="bg-gray-800/50 rounded-xl p-4 mb-4">
              <div class="flex items-center justify-between mb-2">
                <span class="text-gray-400 text-sm">City Heat Score</span>
                <span class="text-2xl font-bold" :class="heatTextClass">{{ city.heatScore || 0 }}</span>
              </div>
              <div class="h-3 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  class="h-full rounded-full transition-all"
                  :class="heatBarClass"
                  :style="{ width: `${city.heatScore || 0}%` }"
                />
              </div>
              <div class="grid grid-cols-2 gap-4 mt-3 text-center">
                <div>
                  <div class="text-lg font-bold text-white">{{ city.activeArtists || 0 }}</div>
                  <div class="text-xs text-gray-500">Active Artists</div>
                </div>
                <div>
                  <div class="text-lg font-bold" :class="(city.highMomentumArtists || 0) >= 2 ? 'text-emerald-400' : 'text-gray-400'">
                    {{ city.highMomentumArtists || 0 }}
                  </div>
                  <div class="text-xs text-gray-500">High Momentum</div>
                </div>
              </div>
            </div>

            <!-- V1.2: Copy City Brief Button -->
            <button
              @click="copyCityBrief"
              class="w-full mb-4 px-4 py-3 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {{ copyFeedback ? 'Copied!' : 'Copy City Claim Brief' }}
            </button>

            <!-- Stack Alert -->
            <div 
              v-if="city.isStack"
              class="bg-violet-600/10 border border-violet-500/30 rounded-xl p-4 mb-4"
            >
              <div class="flex items-start gap-3">
                <svg class="w-5 h-5 text-violet-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <div>
                  <div class="text-violet-300 font-medium text-sm">City Stack Detected</div>
                  <p class="text-violet-400/70 text-xs mt-1">
                    {{ city.highMomentumArtists || 0 }} roster artists have high momentum in {{ city.name }}. 
                    Consider coordinated territorial strategy.
                  </p>
                </div>
              </div>
            </div>

            <!-- V1.1: Top 3 Artists with momentum -->
            <div class="space-y-3">
              <h3 class="text-gray-400 text-sm font-medium">Top Artists in {{ city.name }}</h3>
              
              <div 
                v-for="bandId in topArtistIds" 
                :key="bandId"
                class="bg-gray-800/50 border border-gray-700 rounded-xl p-3"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-gray-700 flex items-center justify-center">
                      <span class="text-gray-300 font-medium">{{ getBandInitial(bandId) }}</span>
                    </div>
                    <div>
                      <div class="text-white font-medium text-sm">{{ getBandName(bandId) }}</div>
                      <div class="flex items-center gap-2 mt-0.5">
                        <AgencySignalPill :state="getBandMomentumState(bandId)" size="sm" />
                        <span 
                          class="text-xs font-medium"
                          :class="getBandVelocity(bandId) >= 0 ? 'text-emerald-400' : 'text-red-400'"
                        >
                          {{ getBandVelocity(bandId) >= 0 ? '+' : '' }}{{ getBandVelocity(bandId) }}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button 
                    @click="$emit('openArtist', bandId)"
                    class="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs font-medium rounded-lg transition-colors"
                  >
                    Open
                  </button>
                </div>
              </div>

              <!-- Show more if available -->
              <div 
                v-if="allArtistIds.length > 3"
                class="text-center text-xs text-gray-500 py-2"
              >
                + {{ allArtistIds.length - 3 }} more artist{{ allArtistIds.length - 3 !== 1 ? 's' : '' }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAgencyPortalStore } from '~/stores/agencyPortal'
import { cityClaimBrief } from '~/utils/agencyPortal/briefGenerators'

const props = defineProps({
  isOpen: Boolean,
  city: Object
})

defineEmits(['close', 'openArtist'])

const store = useAgencyPortalStore()
const copyFeedback = ref(false)

// V1.2: Copy City Claim Brief
async function copyCityBrief() {
  if (!props.city) return
  try {
    const cityBands = props.city.activeBandIds || []
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
    
    const text = cityClaimBrief({
      city: props.city,
      window: '7d',
      topArtists
    })
    await navigator.clipboard.writeText(text)
    copyFeedback.value = true
    setTimeout(() => { copyFeedback.value = false }, 2000)
  } catch (e) {
    console.error('Failed to copy:', e)
  }
}

// V1.1: Heat-based styling
const heatScore = computed(() => props.city?.heatScore || 0)

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

// V1.1: Get artist IDs from new structure
const allArtistIds = computed(() => {
  return props.city?.activeBandIds || props.city?.highMomentumBandIds || []
})

const topArtistIds = computed(() => {
  return allArtistIds.value.slice(0, 3)
})

function getBandName(bandId) {
  const band = store.getBandById(bandId)
  return band?.name || 'Unknown'
}

function getBandInitial(bandId) {
  const band = store.getBandById(bandId)
  return band?.name?.charAt(0) || '?'
}

function getBandMomentumState(bandId) {
  return store.getBandMomentumState(bandId)
}

function getBandVelocity(bandId) {
  return store.getBandVelocity7d(bandId)
}
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
</style>
