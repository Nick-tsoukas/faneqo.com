<template>
  <Teleport to="body">
    <Transition name="drawer">
      <div v-if="isOpen" class="fixed inset-0 z-50">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/60" @click="$emit('close')" />
        
        <!-- Drawer -->
        <div class="absolute right-0 top-0 bottom-0 w-full max-w-md bg-gray-900 border-l border-gray-800 flex flex-col">
          <!-- Header -->
          <div class="p-4 border-b border-gray-800 flex items-center justify-between">
            <h2 class="text-white font-semibold">Share Proof</h2>
            <button @click="$emit('close')" class="p-2 text-gray-400 hover:text-white">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Content -->
          <div class="flex-1 overflow-y-auto p-4">
            <!-- Proof Card Preview -->
            <div 
              ref="proofCard"
              class="rounded-2xl p-6 border"
              :class="cardClasses"
            >
              <!-- Band Info -->
              <div v-if="band" class="flex items-center gap-3 mb-4">
                <div class="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <span class="font-bold text-white">{{ band.name.charAt(0) }}</span>
                </div>
                <div>
                  <div class="text-white font-medium text-sm">{{ band.name }}</div>
                  <div class="text-white/60 text-xs">{{ band.genre }}</div>
                </div>
              </div>

              <!-- Signal Content -->
              <div v-if="signal" class="space-y-3">
                <div class="text-xs font-bold tracking-wider text-white/80 uppercase">
                  {{ signal.headline }}
                </div>
                <div class="text-4xl font-bold text-white">
                  {{ signal.hero }}
                </div>
                <p class="text-white/70 text-sm">
                  {{ signal.proof }}
                </p>
                <div class="flex items-center gap-2 text-xs text-white/50">
                  <span>{{ signal.windowLabel }}</span>
                  <span>•</span>
                  <span>Faneqo</span>
                </div>
              </div>
            </div>

            <!-- Copy Summary -->
            <div class="mt-6">
              <label class="block text-sm text-gray-400 mb-2">Shareable Summary</label>
              <div class="bg-gray-800 rounded-xl p-4 text-sm text-gray-300 font-mono">
                {{ summaryText }}
              </div>
              <button 
                @click="copySummary"
                class="w-full mt-3 px-4 py-3 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                {{ copied === 'summary' ? 'Copied!' : 'Copy Summary' }}
              </button>
            </div>

            <!-- V1.2: Slack Copy Buttons -->
            <div class="mt-6 space-y-3">
              <label class="block text-sm text-gray-400 mb-2">Slack-Ready Outputs</label>
              <button 
                @click="copySlackUpdate"
                class="w-full px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2 border border-gray-700"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                {{ copied === 'slack' ? 'Copied!' : 'Copy Slack Update' }}
              </button>
              <button 
                @click="copyThreadPack"
                class="w-full px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2 border border-gray-700"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                </svg>
                {{ copied === 'thread' ? 'Copied!' : 'Copy Thread Pack (4 msgs)' }}
              </button>
            </div>

            <!-- Image Placeholder -->
            <div class="mt-6">
              <label class="block text-sm text-gray-400 mb-2">Proof Image</label>
              <div class="bg-gray-800/50 border border-dashed border-gray-700 rounded-xl p-8 text-center">
                <svg class="w-12 h-12 text-gray-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p class="text-gray-500 text-sm">Image export coming soon</p>
                <p class="text-gray-600 text-xs mt-1">Use screenshot for now</p>
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
import { slackUpdate, slackThreadPack } from '~/utils/agencyPortal/briefGenerators'
import { getPlaybookForSignalType } from '~/utils/agencyPortal/mockData'

const props = defineProps({
  isOpen: Boolean,
  signal: Object
})

defineEmits(['close'])

const store = useAgencyPortalStore()
const copied = ref('')
const proofCard = ref(null)

const band = computed(() => {
  if (!props.signal?.bandId) return null
  return store.getBandById(props.signal.bandId)
})

const owner = computed(() => {
  if (!props.signal?.bandId) return null
  return store.getOwnerForBand(props.signal.bandId)
})

const playbook = computed(() => {
  if (!props.signal?.type) return null
  return getPlaybookForSignalType(props.signal.type)
})

const cardClasses = computed(() => {
  const accent = props.signal?.accent || 'violet'
  const classes = {
    violet: 'bg-gradient-to-br from-violet-600/30 to-purple-600/30 border-violet-500/30',
    blue: 'bg-gradient-to-br from-blue-600/30 to-cyan-600/30 border-blue-500/30',
    emerald: 'bg-gradient-to-br from-emerald-600/30 to-teal-600/30 border-emerald-500/30',
    amber: 'bg-gradient-to-br from-amber-600/30 to-orange-600/30 border-amber-500/30',
    rose: 'bg-gradient-to-br from-rose-600/30 to-pink-600/30 border-rose-500/30'
  }
  return classes[accent] || classes.violet
})

const summaryText = computed(() => {
  if (!props.signal || !band.value) return ''
  return `🎵 ${band.value.name}\n📊 ${props.signal.headline}\n💥 ${props.signal.hero}\n📍 ${props.signal.proof}\n⏱️ ${props.signal.windowLabel}\n\n— via Faneqo`
})

async function copySummary() {
  try {
    await navigator.clipboard.writeText(summaryText.value)
    copied.value = 'summary'
    setTimeout(() => { copied.value = '' }, 2000)
  } catch (e) {
    console.error('Failed to copy:', e)
  }
}

async function copySlackUpdate() {
  if (!props.signal || !band.value) return
  try {
    const text = slackUpdate({
      signal: props.signal,
      band: band.value,
      owner: owner.value,
      playbook: playbook.value
    })
    await navigator.clipboard.writeText(text)
    copied.value = 'slack'
    setTimeout(() => { copied.value = '' }, 2000)
  } catch (e) {
    console.error('Failed to copy:', e)
  }
}

async function copyThreadPack() {
  if (!props.signal || !band.value) return
  try {
    const metrics = {
      momentumState: store.getBandMomentumState(props.signal.bandId),
      velocity7d: store.getBandVelocity7d(props.signal.bandId),
      topCity: store.getBandTopCity(props.signal.bandId)
    }
    const cityData = store.cityHeatScores.find(c => c.name === metrics.topCity)
    
    const text = slackThreadPack({
      signal: props.signal,
      band: band.value,
      owner: owner.value,
      playbook: playbook.value,
      metrics,
      cityData
    })
    await navigator.clipboard.writeText(text)
    copied.value = 'thread'
    setTimeout(() => { copied.value = '' }, 2000)
  } catch (e) {
    console.error('Failed to copy:', e)
  }
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
