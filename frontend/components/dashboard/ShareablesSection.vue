<template>
  <div class="shareables-section">
    <!-- Headers -->
    <div class="flex items-start justify-between mb-4">
      <div>
        <h3 class="text-lg font-semibold text-white flex items-center gap-2">
          <span class="text-xl">✨</span>
          Shareables
        </h3>
        <p class="text-white/50 text-xs mt-0.5">
          Ready-to-post ideas based on your momentum
          <span class="inline-block ml-1 text-white/30" title="Nothing posts without you">ℹ️</span>
        </p>
      </div>
      <button
        v-if="!loading && cards.length > 0"
        @click="refresh"
        :disabled="refreshing"
        class="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/50 hover:text-white disabled:opacity-50"
        title="Refresh"
      >
        <svg 
          class="w-4 h-4" 
          :class="{ 'animate-spin': refreshing }"
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="animate-spin w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full"></div>
    </div>

    <!-- Content -->
    <div v-else>
      <!-- Tabs -->
      <div class="flex gap-2 mb-4 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
        <button
          v-for="tab in tabsWithCounts"
          :key="tab.key"
          @click="activeTab = tab.key"
          :class="[
            'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex-shrink-0',
            activeTab === tab.key
              ? 'bg-purple-600 text-white'
              : 'bg-white/5 text-white/60 hover:bg-white/10'
          ]"
        >
          {{ tab.label }}
          <span 
            v-if="tab.count > 0" 
            class="ml-1 px-1.5 py-0.5 rounded-full text-[10px]"
            :class="activeTab === tab.key ? 'bg-white/20' : 'bg-white/10'"
          >
            {{ tab.count }}
          </span>
        </button>
      </div>

      <!-- Cards carousel -->
      <div v-if="filteredCards.length > 0">
        <div class="flex gap-4 overflow-x-auto pb-3 -mx-1 px-1 snap-x snap-mandatory scrollbar-hide">
          <ShareableCard
            v-for="card in filteredCards"
            :key="card.id"
            :item="card"
            size="normal"
            @click="openCustomize"
            @share="openCustomize"
          />
        </div>
        
        <!-- Why this tooltip (for recommended) -->
        <p v-if="activeTab === 'recommended' && filteredCards.length > 0" class="text-white/30 text-xs mt-2">
          💡 Sorted by relevance score. Tap any card to customize & share.
        </p>
      </div>

      <!-- Empty state -->
      <div v-else class="text-center py-10">
        <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-500/10 flex items-center justify-center">
          <span class="text-2xl">✨</span>
        </div>
        <h4 class="text-white font-medium mb-2">
          {{ activeTab === 'recommended' ? 'No shareables yet' : `No ${activeTab} available` }}
        </h4>
        <p class="text-white/50 text-sm mb-5 max-w-xs mx-auto">
          Share your band link to spark activity — we'll generate recaps and post ideas automatically.
        </p>
        <div class="flex items-center justify-center gap-3 flex-wrap">
          <button
            @click="handleQuickShare"
            class="px-5 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-sm font-medium transition-all shadow-lg shadow-purple-500/20"
          >
            Share Band
          </button>
          <button
            @click="handleCopyLink"
            class="px-5 py-2.5 rounded-lg border border-white/20 text-white/70 text-sm hover:bg-white/5 transition-colors"
          >
            Copy Link
          </button>
        </div>
      </div>
    </div>

    <!-- Customize Share Drawer -->
    <ShareCustomizeDrawer
      v-model="drawerOpen"
      :item="activeItem"
    />

    <!-- DEV DEBUG PANEL (visible only in dev mode) -->
    <div 
      v-if="isDev"
      class="mt-4 border border-dashed border-white/20 rounded-lg overflow-hidden"
    >
      <!-- Toggle header -->
      <button
        @click="showDebugPanel = !showDebugPanel"
        class="w-full px-3 py-2 flex items-center justify-between bg-white/5 hover:bg-white/10 transition-colors text-xs"
      >
        <span class="text-white/50 font-mono">🛠️ Debug Panel</span>
        <span class="text-white/30">{{ showDebugPanel ? '▼' : '▶' }}</span>
      </button>

      <!-- Panel content -->
      <div v-if="showDebugPanel" class="p-3 space-y-3 bg-black/40 text-xs font-mono">
        <!-- Mode indicator -->
        <div class="flex items-center gap-2">
          <span class="text-white/40">Mode:</span>
          <span 
            class="px-2 py-0.5 rounded text-[10px] font-bold uppercase"
            :class="{
              'bg-emerald-500/20 text-emerald-400': dataMode === 'live',
              'bg-amber-500/20 text-amber-400': dataMode === 'mock',
              'bg-rose-500/20 text-rose-400': dataMode === 'edge',
            }"
          >
            {{ dataMode }}
          </span>
        </div>

        <!-- Stats -->
        <div class="text-white/40 space-y-1">
          <div>generatedAt: <span class="text-white/60">{{ generatedAt || 'N/A' }}</span></div>
          <div>Total cards: <span class="text-white/60">{{ cards.length }}</span></div>
          <div>Recommended: <span class="text-white/60">{{ recommended.length }}</span></div>
        </div>

        <!-- Card list -->
        <div class="max-h-32 overflow-y-auto bg-black/30 rounded p-2 space-y-1">
          <div 
            v-for="card in cards" 
            :key="card.id"
            class="flex items-center justify-between text-[10px]"
          >
            <span class="text-white/50 truncate max-w-[180px]">{{ card.id }}</span>
            <span class="text-purple-400">{{ card.score }}</span>
          </div>
          <div v-if="cards.length === 0" class="text-white/30 text-center py-2">
            No cards loaded
          </div>
        </div>

        <!-- Action buttons -->
        <div class="flex gap-2 flex-wrap">
          <button
            @click="refresh"
            :disabled="refreshing"
            class="px-2 py-1 rounded bg-white/10 text-white/60 hover:bg-white/20 hover:text-white transition-colors disabled:opacity-50"
          >
            {{ refreshing ? '...' : '↻ Reload' }}
          </button>
          <button
            @click="debugLoadMock"
            class="px-2 py-1 rounded bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-colors"
          >
            Load Mock
          </button>
          <button
            @click="debugLoadEdge"
            class="px-2 py-1 rounded bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 transition-colors"
          >
            Load Edge
          </button>
          <button
            @click="debugLoadLive"
            class="px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
          >
            Load Live
          </button>
        </div>

        <!-- Usage hint -->
        <div class="text-white/30 text-[10px] border-t border-white/10 pt-2">
          URL params: <code class="text-white/50">?shareables=mock</code> or <code class="text-white/50">?shareables=edge</code>
        </div>
      </div>
    </div>

    <!-- Toast -->
    <Teleport to="body">
      <Transition name="toast">
        <div
          v-if="toastMessage"
          class="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-black/90 border border-white/20 text-white text-sm shadow-xl backdrop-blur-sm"
        >
          {{ toastMessage }}
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
/**
 * ============================================================
 * MBQ Shareables Section — V1
 * ============================================================
 * 
 * QA GATES (all must pass before feature is complete):
 * 
 * [ ] QA-1: All 10 card types render without overflow
 * [ ] QA-2: Headlines wrap to max 2 lines (never clip)
 * [ ] QA-3: Hero text never clips (shrinks if needed)
 * [ ] QA-4: Missing microCaption falls back safely (empty string)
 * [ ] QA-5: Missing band image uses placeholder circle
 * [ ] QA-6: Unknown accent uses safe default (violet)
 * [ ] QA-7: Clicking ANY card opens Customize drawer
 * [ ] QA-8: Clicking Share button opens Customize drawer
 * [ ] QA-9: Mock and Live modes behave identically
 * [ ] QA-10: Edge cases render without errors
 * 
 * ============================================================
 */

import { ref, computed, onMounted, watch } from 'vue'
import { useRuntimeConfig, useRoute, useStrapiToken } from '#imports'
import { useShareKit } from '~/composables/useShareKit'
import { 
  TAB_DEFS, 
  filterCardsByTab,
  getTabCounts,
  getAccentConfig,
} from '~/utils/shareables/mappings'
import { 
  mockShareCards, 
  mockEdgeCases, 
  buildMockApiResponse,
} from '~/utils/shareables/fixtures'
import ShareableCard from '~/components/dashboard/shareables/ShareableCard.vue'
import ShareCustomizeDrawer from '~/components/shareables/ShareCustomizeDrawer.vue'

const props = defineProps({
  bandId: {
    type: [Number, String],
    required: true,
  },
  bandName: {
    type: String,
    required: true,
  },
  bandSlug: {
    type: String,
    required: true,
  },
  bandImageUrl: {
    type: String,
    default: null,
  },
  isBandNameInLogo: {
    type: Boolean,
    default: false,
  },
})

const config = useRuntimeConfig()
// /api/pulse/shareables is band-private and authenticated server-side.
const token = useStrapiToken()
const route = useRoute()
const { copyToClipboard, webShare } = useShareKit()

// ============================================================
// DEV MODE TOGGLE
// ============================================================

const isDev = process.dev === true

/**
 * Determine if mock mode is active
 * Mock mode enabled when:
 * - process.dev === true AND ?shareables=mock query param
 * - OR ?shareables=mock query param (for testing in prod preview)
 */
const useMockData = computed(() => {
  const queryParam = route.query?.shareables
  return queryParam === 'mock' || queryParam === 'edge'
})

const useEdgeCases = computed(() => {
  return route.query?.shareables === 'edge'
})

const dataMode = computed(() => {
  if (useEdgeCases.value) return 'edge'
  if (useMockData.value) return 'mock'
  return 'live'
})

// ============================================================
// STATE
// ============================================================

const loading = ref(true)
const refreshing = ref(false)
const activeTab = ref('recommended')
const cards = ref([])
const recommended = ref([])
const generatedAt = ref(null)
const drawerOpen = ref(false)
const activeItem = ref(null)
const toastMessage = ref('')
const showDebugPanel = ref(false)

// Band context for normalization
const bandContext = computed(() => ({
  id: props.bandId,
  slug: props.bandSlug,
  name: props.bandName,
  imageUrl: props.bandImageUrl,
  isBandNameInLogo: props.isBandNameInLogo,
}))

// ============================================================
// COMPUTED
// ============================================================

// Tabs with counts
const tabsWithCounts = computed(() => {
  const counts = getTabCounts(cards.value)
  return TAB_DEFS.map(tab => ({
    ...tab,
    count: counts[tab.key] || 0,
  }))
})

// Filtered cards for current tab
const filteredCards = computed(() => {
  if (activeTab.value === 'recommended') {
    return recommended.value.length > 0 
      ? recommended.value 
      : [...cards.value].sort((a, b) => (b.score || 0) - (a.score || 0))
  }
  return filterCardsByTab(cards.value, activeTab.value)
})

// Debug info
const debugInfo = computed(() => ({
  mode: dataMode.value,
  generatedAt: generatedAt.value,
  totalCards: cards.value.length,
  recommendedCount: recommended.value.length,
  cards: cards.value.map(c => ({ id: c.id, type: c.type, score: c.score })),
}))

// ============================================================
// HELPERS
// ============================================================

function showToast(message, duration = 2500) {
  toastMessage.value = message
  setTimeout(() => { toastMessage.value = '' }, duration)
}

function getBandUrl() {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://musicbizqr.com'
  return `${origin}/${props.bandSlug}`
}

/**
 * Normalize a card from API/mock to UI format
 * Handles missing fields gracefully (QA-4, QA-5, QA-6)
 */
function normalizeCard(card) {
  const accent = getAccentConfig(card.accent, card.type)
  
  return {
    ...card,
    // QA-4: Fallback for missing microCaption
    microCaption: card.microCaption || { hype: '', grateful: '', tease: '' },
    // QA-6: Ensure valid accent
    accent: card.accent && ['violet', 'blue', 'emerald', 'amber', 'rose'].includes(card.accent) 
      ? card.accent 
      : 'violet',
    // Add band context
    band: {
      id: props.bandId,
      slug: props.bandSlug,
      name: props.bandName,
      // QA-5: bandImageUrl can be null (card handles placeholder)
      imageUrl: props.bandImageUrl,
      isBandNameInLogo: props.isBandNameInLogo,
    },
    share: {
      shareUrl: getBandUrl(),
      ogUrl: getShareOgUrl(),
    },
    selectedCaptionStyle: 'hype',
  }
}

function getShareOgUrl() {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://musicbizqr.com'
  return `${origin}/share/band/${props.bandSlug}`
}

// Build Facebook share URL for a shareable card with all params for OG image
function buildShareableFacebookUrl(card) {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://musicbizqr.com'
  const params = new URLSearchParams({
    bandId: String(props.bandId),
    bandSlug: props.bandSlug,
    type: card.type || 'MILESTONE_DROP',
    hero: encodeURIComponent(card.hero || ''),
    headline: encodeURIComponent(card.headline || ''),
    proof: encodeURIComponent(card.proof || ''),
    accent: card.accent || 'violet',
  })
  return `${origin}/share/shareable/${card.id}?${params.toString()}`
}

// ============================================================
// DATA FETCHING
// ============================================================

/**
 * Load mock data (fixtures)
 */
function loadMockData() {
  const sourceCards = useEdgeCases.value ? mockEdgeCases : mockShareCards
  const mockResponse = buildMockApiResponse(sourceCards, props.bandId)
  
  cards.value = mockResponse.cards.map(normalizeCard)
  recommended.value = mockResponse.recommended.map(normalizeCard)
  generatedAt.value = mockResponse.generatedAt
  
  if (isDev) {
    console.log(`[ShareablesSection] Loaded ${dataMode.value} data:`, {
      cards: cards.value.length,
      recommended: recommended.value.length,
    })
  }
}

/**
 * Fetch pulse moments (real-time surges) from auto-active API
 */
async function fetchPulseMoments() {
  const strapiUrl = config.public.strapiUrl
  
  try {
    const response = await fetch(
      `${strapiUrl}/api/fan-moments/auto-active?bandId=${props.bandId}`
    )
    const data = await response.json()
    
    if (data.ok && data.moment) {
      // Convert moment to shareable card format
      const moment = data.moment
      return [{
        id: `moment-${moment.id}`,
        type: moment.momentType || 'PULSE_SURGE',
        category: 'moments',
        accent: moment.momentType === 'CITY_HEAT' ? 'blue' : 
                moment.momentType === 'MOMENT_MATTERED' ? 'violet' : 'amber',
        windowLabel: formatMomentExpiry(moment.expiresAt),
        headline: moment.shareTitle || 'Fan energy is surging',
        hero: moment.context?.velocity ? `${moment.context.velocity}x` : '🔥',
        proof: moment.context?.cityName 
          ? `${moment.context.cityName} is heating up`
          : 'Real-time fan energy spike',
        score: 95, // High priority for live moments
        microCaption: buildMomentCaptions(moment, props.bandName),
        isMoment: true,
        momentData: moment,
      }]
    }
    return []
  } catch (err) {
    console.error('[ShareablesSection] Failed to fetch pulse moments:', err)
    return []
  }
}

/**
 * Format moment expiry for window label
 */
function formatMomentExpiry(expiresAt) {
  if (!expiresAt) return '⚡ LIVE'
  const expiry = new Date(expiresAt)
  const now = new Date()
  const diffMs = expiry - now
  const diffMins = Math.floor(diffMs / (1000 * 60))
  if (diffMins <= 0) return '⚡ LIVE'
  if (diffMins < 60) return `⚡ ${diffMins}m left`
  const diffHours = Math.floor(diffMins / 60)
  return `⚡ ${diffHours}h left`
}

/**
 * Build captions for pulse moment
 */
function buildMomentCaptions(moment, bandName) {
  const cityName = moment.context?.cityName || ''
  const velocity = moment.context?.velocity || ''
  
  return {
    hype: cityName 
      ? `${cityName} is going off right now 🔥 ${bandName} is heating up!`
      : velocity 
        ? `${velocity}x the normal energy 🔥 ${bandName} is surging!`
        : `Something's happening with ${bandName} 🔥`,
    grateful: cityName 
      ? `${cityName}, we see you 🙏 Thank you for the love.`
      : `Thank you for being part of this moment 🙏`,
    tease: cityName 
      ? `${cityName}… we might need to come see you 👀`
      : `Something's building… stay close 👀`,
  }
}

/**
 * Fetch live data from API
 */
async function fetchLiveData() {
  const strapiUrl = config.public.strapiUrl
  
  try {
    // Fetch both shareables and pulse moments in parallel
    const [shareablesRes, pulseMoments] = await Promise.all([
      fetch(`${strapiUrl}/api/pulse/shareables?bandId=${props.bandId}`, {
        headers: token.value ? { Authorization: `Bearer ${token.value}` } : {},
      }).then(r => r.json()),
      fetchPulseMoments(),
    ])
    
    let allCards = []
    
    if (shareablesRes.ok) {
      allCards = (shareablesRes.cards || []).map(normalizeCard)
      recommended.value = (shareablesRes.recommended || []).map(normalizeCard)
      generatedAt.value = shareablesRes.generatedAt || new Date().toISOString()
    }
    
    // Merge pulse moments into cards (at the front for visibility)
    if (pulseMoments.length > 0) {
      const normalizedMoments = pulseMoments.map(normalizeCard)
      allCards = [...normalizedMoments, ...allCards]
      // Also add to recommended if there are live moments
      recommended.value = [...normalizedMoments, ...recommended.value]
    }
    
    cards.value = allCards
    
    if (isDev) {
      console.log('[ShareablesSection] Loaded live data:', {
        cards: cards.value.length,
        moments: pulseMoments.length,
        recommended: recommended.value.length,
      })
    }
  } catch (err) {
    console.error('[ShareablesSection] Failed to fetch cards:', err)
    cards.value = []
    recommended.value = []
  }
}

/**
 * Main data loader - switches between mock and live
 */
async function fetchData() {
  if (useMockData.value) {
    loadMockData()
  } else {
    await fetchLiveData()
  }
}

async function refresh() {
  refreshing.value = true
  await fetchData()
  refreshing.value = false
  showToast('Refreshed!')
}

// ============================================================
// DRAWER / SHARE ACTIONS
// ============================================================

/**
 * Open customize drawer for a card
 * QA-7, QA-8: Both card click and share button open drawer
 */
function openCustomize(card) {
  activeItem.value = {
    id: card.id,
    kind: card.type,
    source: card.category,
    accent: card.accent,
    windowLabel: card.windowLabel,
    title: card.headline,
    primaryStat: card.hero,
    secondaryStat: card.proof,
    share: {
      shareUrl: card.share?.shareUrl || getBandUrl(),
      ogUrl: card.share?.ogUrl || getShareOgUrl(),
      facebookUrl: buildShareableFacebookUrl(card),
      captions: card.microCaption,
      defaultCaptionStyle: card.selectedCaptionStyle || 'hype',
    },
    band: card.band,
  }
  drawerOpen.value = true
}

function handleQuickShare() {
  // Open drawer with generic band share (no specific card)
  activeItem.value = {
    id: null,
    kind: 'BAND_SHARE',
    source: 'manual',
    accent: 'violet',
    windowLabel: '',
    title: props.bandName,
    primaryStat: '',
    secondaryStat: '',
    share: {
      shareUrl: getBandUrl(),
      ogUrl: getShareOgUrl(),
      facebookUrl: `${typeof window !== 'undefined' ? window.location.origin : 'https://musicbizqr.com'}/share/band/${props.bandSlug}`,
      captions: {},
      defaultCaptionStyle: 'hype',
    },
    band: {
      id: props.bandId,
      slug: props.bandSlug,
      name: props.bandName,
      imageUrl: props.bandImageUrl,
      isBandNameInLogo: props.isBandNameInLogo,
    },
  }
  drawerOpen.value = true
}

async function handleCopyLink() {
  await copyToClipboard(getBandUrl())
  showToast('Band link copied!')
}

// ============================================================
// DEBUG PANEL ACTIONS (DEV ONLY)
// ============================================================

function debugLoadMock() {
  loadMockData()
  showToast('Loaded mock fixtures')
}

function debugLoadEdge() {
  const mockResponse = buildMockApiResponse(mockEdgeCases, props.bandId)
  cards.value = mockResponse.cards.map(normalizeCard)
  recommended.value = mockResponse.recommended.map(normalizeCard)
  generatedAt.value = mockResponse.generatedAt
  showToast('Loaded edge case fixtures')
}

async function debugLoadLive() {
  await fetchLiveData()
  showToast('Loaded live API data')
}

// ============================================================
// LIFECYCLE
// ============================================================

// Watch for query param changes (allows switching without reload)
watch(() => route.query?.shareables, async () => {
  loading.value = true
  await fetchData()
  loading.value = false
}, { immediate: false })

onMounted(async () => {
  if (isDev) {
    console.log('[ShareablesSection] Mode:', dataMode.value)
  }
  loading.value = true
  await fetchData()
  loading.value = false
})
</script>

<style scoped>
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, 10px);
}
</style>
