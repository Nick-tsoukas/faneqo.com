<template>
  <div class="shareables-gallery min-h-screen bg-black text-white">
    <!-- Header -->
    <div class="sticky top-0 z-50 bg-black/95 backdrop-blur-sm border-b border-white/10">
      <div class="max-w-7xl mx-auto px-4 py-4">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 class="text-xl font-bold">MBQ Internal Shareables Gallery</h1>
            <p class="text-white/50 text-sm">Review all card types and tones</p>
          </div>

          <!-- Controls -->
          <div class="flex flex-wrap items-center gap-3">
            <!-- View Toggle -->
            <div class="flex rounded-lg overflow-hidden border border-white/20">
              <button
                v-for="view in ['band', 'fan', 'both']"
                :key="view"
                @click="activeView = view"
                :class="[
                  'px-3 py-1.5 text-xs font-medium capitalize transition-colors',
                  activeView === view
                    ? 'bg-purple-600 text-white'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                ]"
              >
                {{ view === 'both' ? 'All' : view }}
              </button>
            </div>

            <!-- Tone Selector -->
            <div class="flex rounded-lg overflow-hidden border border-white/20">
              <button
                v-for="t in tones"
                :key="t.value"
                @click="selectedTone = t.value"
                :class="[
                  'px-3 py-1.5 text-xs font-medium transition-colors',
                  selectedTone === t.value
                    ? 'bg-purple-600 text-white'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                ]"
              >
                {{ t.emoji }} {{ t.label }}
              </button>
            </div>

            <!-- Regenerate All -->
            <button
              @click="regenerateAll"
              :disabled="regenerating"
              class="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <svg class="w-4 h-4" :class="{ 'animate-spin': regenerating }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Regenerate All
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="max-w-7xl mx-auto px-6 py-8 space-y-12">
      <!-- Band Shareables Section -->
      <section v-if="activeView === 'band' || activeView === 'both'">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-bold flex items-center gap-2">
            <span class="text-purple-400">📊</span>
            Band Shareables
            <span class="text-white/40 text-sm font-normal">(10 types)</span>
          </h2>

          <!-- Tab Filter -->
          <div class="flex gap-2 overflow-x-auto">
            <button
              v-for="tab in bandTabs"
              :key="tab.key"
              @click="activeBandTab = tab.key"
              :class="[
                'px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors',
                activeBandTab === tab.key
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              ]"
            >
              {{ tab.label }}
            </button>
          </div>
        </div>

        <!-- Band Cards Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <InternalShareablesTile
            v-for="card in filteredBandCards"
            :key="card.id"
            :ref="el => setBandTileRef(card.id, el)"
            :item="card"
            :tone="selectedTone"
            @toast="showToast"
            @regenerate="regenerateBandCard"
          />
        </div>
      </section>

      <!-- Fan Shares Section -->
      <section v-if="activeView === 'fan' || activeView === 'both'">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-bold flex items-center gap-2">
            <span class="text-emerald-400">✨</span>
            Fan Shares
            <span class="text-white/40 text-sm font-normal">(5 moment types)</span>
          </h2>

          <!-- Moment Filter -->
          <div class="flex gap-2 overflow-x-auto">
            <button
              v-for="moment in fanMomentTabs"
              :key="moment.key"
              @click="activeFanTab = moment.key"
              :class="[
                'px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors',
                activeFanTab === moment.key
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              ]"
            >
              {{ moment.label }}
            </button>
          </div>
        </div>

        <!-- Fan Cards Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <InternalShareablesTile
            v-for="item in filteredFanItems"
            :key="item.id"
            :ref="el => setFanTileRef(item.id, el)"
            :item="item"
            :tone="selectedTone"
            @toast="showToast"
            @regenerate="regenerateFanCard"
          />
        </div>
      </section>
    </div>

    <!-- Toast -->
    <Teleport to="body">
      <Transition name="toast">
        <div
          v-if="toastMessage"
          class="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] px-4 py-2.5 rounded-xl bg-black/90 border border-white/20 text-white text-sm shadow-xl backdrop-blur-sm"
        >
          {{ toastMessage }}
        </div>
      </Transition>
    </Teleport>

    <!-- Hidden canvas for image generation -->
    <canvas ref="canvasRef" width="1080" height="1080" class="hidden"></canvas>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getBandDemoCards } from '~/utils/shareables/demoDeck'
import { getFanDemoItems, DEMO_BAND } from '~/utils/fanShare/demoContexts'
import { useShareKit } from '~/composables/useShareKit'
import { generateFanShareImage } from '~/utils/fanShare/imageGenerator'

const { generateShareCardImage } = useShareKit()

// State
const activeView = ref('both')
const selectedTone = ref('hype')
const activeBandTab = ref('all')
const activeFanTab = ref('all')
const regenerating = ref(false)
const toastMessage = ref('')
const canvasRef = ref(null)

// Tile refs for image generation
const bandTileRefs = ref({})
const fanTileRefs = ref({})

function setBandTileRef(id, el) {
  if (el) bandTileRefs.value[id] = el
}

function setFanTileRef(id, el) {
  if (el) fanTileRefs.value[id] = el
}

// Data
const bandCards = ref([])
const fanItems = ref([])

// Tones
const tones = [
  { value: 'hype', label: 'Hype', emoji: '🔥' },
  { value: 'grateful', label: 'Grateful', emoji: '🙏' },
  { value: 'tease', label: 'Tease', emoji: '👀' },
]

// Band tabs
const bandTabs = [
  { key: 'all', label: 'All' },
  { key: 'recommended', label: 'Recommended' },
  { key: 'recaps', label: 'Recaps' },
  { key: 'spikes', label: 'Spikes' },
  { key: 'prompts', label: 'Prompts' },
]

// Fan moment tabs
const fanMomentTabs = [
  { key: 'all', label: 'All' },
  { key: 'FIRST_DISCOVERY', label: 'First Discovery' },
  { key: 'AFTER_SHOW_FAN', label: 'After Show' },
  { key: 'CITY_SUPPORT', label: 'City Support' },
  { key: 'RETURNING_FAN', label: 'Returning Fan' },
  { key: 'SUPER_FAN_ACTION', label: 'Super Fan' },
]

// Filtered data
const filteredBandCards = computed(() => {
  if (activeBandTab.value === 'all' || activeBandTab.value === 'recommended') {
    return bandCards.value
  }
  return bandCards.value.filter(card => card.tab === activeBandTab.value)
})

const filteredFanItems = computed(() => {
  if (activeFanTab.value === 'all') {
    return fanItems.value
  }
  return fanItems.value.filter(item => item.momentType === activeFanTab.value)
})

// Load demo data
onMounted(() => {
  bandCards.value = getBandDemoCards()
  fanItems.value = getFanDemoItems()
})

// Toast helper
function showToast(message) {
  toastMessage.value = message
  setTimeout(() => { toastMessage.value = '' }, 2000)
}

// Image generation
async function regenerateBandCard(card) {
  const tile = bandTileRefs.value[card.id]
  if (!tile || !canvasRef.value) return

  try {
    const blob = await generateShareCardImage({
      canvasEl: canvasRef.value,
      card: {
        headline: card.headline,
        hero: card.hero,
        proof: card.proof,
        accent: card.accent,
        microCaption: card.microCaption,
        selectedCaptionStyle: selectedTone.value,
      },
      bandName: card.band?.name || 'Artist',
      bandImageUrl: card.band?.imageUrl || null,
      isBandNameInLogo: card.band?.isBandNameInLogo || false,
      captionStyle: selectedTone.value,
    })
    
    if (blob && tile.setImage) {
      tile.setImage(blob)
    }
  } catch (err) {
    console.error('[Gallery] Failed to generate band card image:', err)
    showToast('Failed to generate image')
  }
}

async function regenerateFanCard(item) {
  const tile = fanTileRefs.value[item.id]
  if (!tile || !canvasRef.value) return

  try {
    const blob = await generateFanShareImage({
      canvasEl: canvasRef.value,
      headline: item.headline,
      bandName: item.band.name,
      bandImageUrl: item.band.imageUrl,
      isBandNameInLogo: item.band.isBandNameInLogo,
      momentType: item.momentType,
      loadImage: loadImageDirect,
    })
    
    if (blob && tile.setImage) {
      tile.setImage(blob)
    }
  } catch (err) {
    console.error('[Gallery] Failed to generate fan share image:', err)
    showToast('Failed to generate image')
  }
}

// Image loader (same as ShareBandStrip)
async function loadImageDirect(url, timeoutMs = 15000) {
  if (!url) throw new Error('No URL provided')

  try {
    const config = useRuntimeConfig()
    const proxyUrl = `${config.public.strapiUrl}/api/image-proxy?url=${encodeURIComponent(url)}`
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
    
    const response = await fetch(proxyUrl, { signal: controller.signal })
    clearTimeout(timeoutId)
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    
    const blob = await response.blob()
    const objectUrl = URL.createObjectURL(blob)
    
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = (err) => {
        URL.revokeObjectURL(objectUrl)
        reject(err || new Error('Image load error'))
      }
      img.src = objectUrl
    })
  } catch (err) {
    throw err
  }
}

// Regenerate all visible cards
async function regenerateAll() {
  regenerating.value = true
  showToast('Regenerating all cards...')

  try {
    // Regenerate band cards
    if (activeView.value === 'band' || activeView.value === 'both') {
      for (const card of filteredBandCards.value) {
        await regenerateBandCard(card)
      }
    }

    // Regenerate fan cards
    if (activeView.value === 'fan' || activeView.value === 'both') {
      for (const item of filteredFanItems.value) {
        await regenerateFanCard(item)
      }
    }

    showToast('All cards regenerated!')
  } catch (err) {
    console.error('[Gallery] Regenerate all failed:', err)
    showToast('Some cards failed to regenerate')
  } finally {
    regenerating.value = false
  }
}
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, 20px);
}
</style>
