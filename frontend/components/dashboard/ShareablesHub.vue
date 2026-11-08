<template>
  <div class="shareables-hub">
    <!-- Header -->
    <div class="flex items-start justify-between mb-4">
      <div>
        <h3 class="text-lg font-semibold text-white flex items-center gap-2">
          <span class="text-xl">✨</span>
          Shareables
        </h3>
        <p class="text-white/50 text-xs mt-0.5">
          Ready-to-post ideas based on your last 24h momentum
          <span class="inline-block ml-1 text-white/30" title="Nothing posts without you">ℹ️</span>
        </p>
      </div>
      <button
        v-if="!loading && allShareables.length > 0"
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
          v-for="tab in tabs"
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

      <!-- Recommended Tab Content -->
      <div v-if="activeTab === 'recommended'">
        <!-- Empty state for recommended -->
        <div v-if="recommended.length === 0" class="text-center py-8">
          <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-500/10 flex items-center justify-center">
            <span class="text-2xl">✨</span>
          </div>
          <h4 class="text-white font-medium mb-2">No shareables yet</h4>
          <p class="text-white/50 text-sm mb-4 max-w-xs mx-auto">
            Share your band link to spark activity — we'll generate recaps and post ideas automatically.
          </p>
          <div class="flex items-center justify-center gap-2 flex-wrap">
            <button
              @click="handleQuickShare"
              class="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-colors"
            >
              Share Band
            </button>
            <button
              @click="handleCopyBandLink"
              class="px-4 py-2 rounded-lg border border-white/20 text-white/70 text-sm hover:bg-white/5 transition-colors"
            >
              Copy Link
            </button>
          </div>
        </div>

        <!-- Hero card + rail -->
        <div v-else>
          <!-- Hero Card -->
          <ShareableHeroCard
            v-if="heroShareable"
            :shareable="heroShareable"
            @select="openDetail"
            @share="quickShare"
            class="mb-4"
          />

          <!-- More shareables rail -->
          <div v-if="moreShareables.length > 0">
            <h4 class="text-white/60 text-xs uppercase tracking-wider mb-2">More to share</h4>
            <div class="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory scrollbar-hide">
              <ShareableCardCompact
                v-for="item in moreShareables"
                :key="item.id"
                :shareable="item"
                @select="openDetail"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Recaps Tab -->
      <div v-else-if="activeTab === 'recaps'">
        <div v-if="recaps.length === 0" class="text-center py-8">
          <div class="text-white/50 text-sm">No recaps available right now.</div>
          <p class="text-white/30 text-xs mt-1">Recaps are generated after activity spikes.</p>
        </div>
        <div v-else class="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory scrollbar-hide">
          <ShareableCardCompact
            v-for="item in recaps"
            :key="item.id"
            :shareable="item"
            @select="openDetail"
          />
        </div>
      </div>

      <!-- Spikes Tab -->
      <div v-else-if="activeTab === 'spikes'">
        <div v-if="spikes.length === 0" class="text-center py-8">
          <div class="text-white/50 text-sm">No energy spikes detected.</div>
          <p class="text-white/30 text-xs mt-1">Spikes appear when fan activity surges.</p>
        </div>
        <div v-else class="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory scrollbar-hide">
          <ShareableCardCompact
            v-for="item in spikes"
            :key="item.id"
            :shareable="item"
            @select="openDetail"
          />
        </div>
      </div>

      <!-- Prompts Tab -->
      <div v-else-if="activeTab === 'prompts'">
        <div v-if="prompts.length === 0" class="text-center py-8">
          <div class="text-white/50 text-sm">No momentum prompts yet.</div>
          <p class="text-white/30 text-xs mt-1">Share your band link to spark activity.</p>
        </div>
        <div v-else class="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory scrollbar-hide">
          <ShareableCardCompact
            v-for="item in prompts"
            :key="item.id"
            :shareable="item"
            @select="openDetail"
          />
        </div>
      </div>
    </div>

    <!-- Detail Panel -->
    <ShareableDetailPanel
      v-model="detailOpen"
      :shareable="selectedShareable"
      :band-name="bandName"
      :band-slug="bandSlug"
      :band-image-url="bandImageUrl"
      :is-band-name-in-logo="isBandNameInLogo"
    />

    <!-- Toast -->
    <Transition name="fade">
      <div
        v-if="toastMessage"
        class="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg bg-black/90 border border-white/20 text-white text-sm shadow-lg"
      >
        {{ toastMessage }}
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRuntimeConfig, useStrapiToken } from '#imports'
import { useShareKit } from '@/composables/useShareKit'
import ShareableHeroCard from '~/components/dashboard/shareables/ShareableHeroCard.vue'
import ShareableCardCompact from '~/components/dashboard/shareables/ShareableCardCompact.vue'
import ShareableDetailPanel from '~/components/dashboard/shareables/ShareableDetailPanel.vue'

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
// /api/pulse/whats-hot is band-private and authenticated server-side.
const token = useStrapiToken()
const authHeaders = () => (token.value ? { Authorization: `Bearer ${token.value}` } : {})
const { copyToClipboard, webShare } = useShareKit()

// State
const loading = ref(true)
const refreshing = ref(false)
const activeTab = ref('recommended')
const allShareables = ref([])
const detailOpen = ref(false)
const selectedShareable = ref(null)
const toastMessage = ref('')

// Tabs config
const tabs = computed(() => [
  { key: 'recommended', label: 'Recommended', count: recommended.value.length },
  { key: 'recaps', label: 'Recaps', count: recaps.value.length },
  { key: 'spikes', label: 'Spikes', count: spikes.value.length },
  { key: 'prompts', label: 'Prompts', count: prompts.value.length },
])

// Filtered lists
const recaps = computed(() => allShareables.value.filter(s => s.category === 'recap'))
const spikes = computed(() => allShareables.value.filter(s => s.category === 'spike'))
const prompts = computed(() => allShareables.value.filter(s => s.category === 'prompt'))

// Recommended: sorted by priority, category weight
const recommended = computed(() => {
  const categoryWeight = { recap: 3, spike: 2, prompt: 1 }
  return [...allShareables.value].sort((a, b) => {
    const weightDiff = (categoryWeight[b.category] || 0) - (categoryWeight[a.category] || 0)
    if (weightDiff !== 0) return weightDiff
    return (b.priority || 0) - (a.priority || 0)
  })
})

const heroShareable = computed(() => recommended.value[0] || null)
const moreShareables = computed(() => recommended.value.slice(1, 7))

// Toast helper
function showToast(message, duration = 2500) {
  toastMessage.value = message
  setTimeout(() => { toastMessage.value = '' }, duration)
}

// Get band URL
function getBandUrl() {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://musicbizqr.com'
  return `${origin}/${props.bandSlug}`
}

// Open detail panel
function openDetail(shareable) {
  selectedShareable.value = shareable
  detailOpen.value = true
}

// Quick share (uses Web Share API directly)
async function quickShare(shareable) {
  const shareUrl = shareable.share?.url || getBandUrl()
  const caption = shareable.captions?.hype || `Check out ${props.bandName}!`
  
  const result = await webShare({
    title: shareable.title,
    text: `${caption} ${shareUrl}`,
    url: shareUrl,
  })

  if (result.ok) {
    showToast('Shared!')
  } else {
    // Fallback: open detail panel
    openDetail(shareable)
  }
}

// Share band link
async function handleQuickShare() {
  const result = await webShare({
    title: props.bandName,
    url: getBandUrl(),
  })
  if (!result.ok) {
    handleCopyBandLink()
  }
}

async function handleCopyBandLink() {
  await copyToClipboard(getBandUrl())
  showToast('Band link copied!')
}

// Normalize recap data into Shareable format
function normalizeRecap(recap, kind) {
  const isReal = kind === 'real'
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://musicbizqr.com'
  const bandUrl = `${origin}/${props.bandSlug}`
  
  // Build captions based on kind - CRITICAL: mini recaps must NOT use "show" or "last night" language
  let captions
  if (isReal) {
    const venue = recap.context?.venueName || ''
    captions = {
      hype: venue 
        ? `${venue} was on fire last night 🔥 ${props.bandName} brought the energy!`
        : `Last night was incredible 🔥 ${props.bandName} brought the energy!`,
      grateful: venue
        ? `Thank you ${venue} for an amazing night 🙏 We felt every moment.`
        : `Thank you for showing up 🙏 We felt every moment with you.`,
      tease: venue
        ? `${venue}… that was just the beginning 👀`
        : `That was just the beginning… stay close 👀`,
    }
  } else {
    // Mini recap - NO "show" or "last night" language
    captions = {
      hype: `${props.bandName} is building momentum 🔥 Check out what's happening!`,
      grateful: `Thank you for the love today 🙏 Every listen matters.`,
      tease: `Something's brewing… stay tuned 👀`,
    }
  }

  // Build stat/why from context
  let stat = ''
  let why = ''
  if (recap.context) {
    if (recap.context.totalInteractions) {
      stat = `${recap.context.totalInteractions} interactions`
    }
    if (recap.context.topCity?.name) {
      why = `Top city: ${recap.context.topCity.name}`
    } else if (recap.context.topMedia?.title) {
      why = `Top play: ${recap.context.topMedia.title}`
    }
  }

  return {
    id: `recap:${recap.id}`,
    category: 'recap',
    priority: isReal ? 10 : 5,
    windowLabel: isReal ? 'After show' : 'Last 24h',
    title: isReal ? (recap.shareTitle || 'After-Show Recap') : '24-Hour Recap',
    why: why || recap.shareText || 'Your recent activity summary',
    stat: stat || recap.context?.energyLabel || 'Activity recap',
    captions,
    share: {
      url: bandUrl,
      facebookUrl: recap.id ? `${origin}/share/moment/${recap.id}` : `${origin}/share/band/${props.bandSlug}`,
      filenameBase: `${props.bandSlug}-recap`,
    },
    image: {
      kind: 'recap',
      momentTitle: isReal ? 'After-Show Recap' : '24-Hour Recap',
      subtitle: recap.context?.venueName || null,
    },
    context: recap.context || {},
  }
}

// Normalize prompt card into Shareable format
function normalizePrompt(card, index) {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://musicbizqr.com'
  const bandUrl = `${origin}/${props.bandSlug}`
  
  // Determine share URL
  let shareUrl = bandUrl
  if (card.type === 'HOT_LINK' && card.payload?.url) {
    shareUrl = card.payload.url
  }

  return {
    id: `prompt:${card.type}:${index}`,
    category: 'prompt',
    priority: card.priority || 1,
    windowLabel: 'Last 24h',
    title: card.title,
    why: card.why,
    stat: card.stat,
    captions: card.captions || {
      hype: `${props.bandName} is heating up 🔥`,
      grateful: `Thank you for being part of this 🙏`,
      tease: `Something's happening… 👀`,
    },
    share: {
      url: shareUrl,
      facebookUrl: `${origin}/share/band/${props.bandSlug}`,
      filenameBase: `${props.bandSlug}-${card.type.toLowerCase()}`,
    },
    image: {
      kind: 'prompt',
      momentTitle: card.title,
      subtitle: null,
    },
    context: card.payload || {},
  }
}

// Normalize spike/pulse moment into Shareable format
function normalizeSpike(moment) {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://musicbizqr.com'
  const bandUrl = `${origin}/${props.bandSlug}`

  const cityName = moment.context?.cityName || ''
  const velocity = moment.context?.velocity || ''

  const captions = {
    hype: cityName 
      ? `${cityName} is going off right now 🔥 ${props.bandName} is heating up!`
      : velocity 
        ? `${velocity}x the normal energy 🔥 ${props.bandName} is surging!`
        : `Something's happening with ${props.bandName} 🔥`,
    grateful: cityName
      ? `${cityName}, we see you 🙏 Thank you for the love.`
      : `Thank you for being part of this moment 🙏`,
    tease: cityName
      ? `${cityName}… we might need to come see you 👀`
      : `Something's building… stay close 👀`,
  }

  return {
    id: `spike:${moment.id}`,
    category: 'spike',
    priority: 8,
    windowLabel: 'Live',
    title: moment.shareTitle || 'Fan energy is surging',
    why: moment.shareText || 'Activity spike detected',
    stat: velocity ? `${velocity}x baseline` : 'Energy spike',
    captions,
    share: {
      url: bandUrl,
      facebookUrl: moment.id ? `${origin}/share/moment/${moment.id}` : `${origin}/share/band/${props.bandSlug}`,
      filenameBase: `${props.bandSlug}-pulse`,
    },
    image: {
      kind: 'spike',
      momentTitle: moment.shareTitle || 'Fan energy is surging',
      subtitle: cityName || null,
    },
    context: moment.context || {},
  }
}

// Fetch all data
async function fetchData() {
  const strapiUrl = config.public.strapiUrl
  const shareables = []

  try {
    // Fetch in parallel
    const [recapRes, promptsRes, spikesRes] = await Promise.all([
      // Recap endpoint
      fetch(`${strapiUrl}/api/fan-moments/recap-active?bandId=${props.bandId}&allowMini=true`)
        .then(r => r.json())
        .catch(() => ({ ok: false })),
      
      // Prompts endpoint — band-private, authenticated server-side
      fetch(`${strapiUrl}/api/pulse/whats-hot?bandId=${props.bandId}`, { headers: authHeaders() })
        .then(r => r.json())
        .catch(() => ({ ok: false })),
      
      // Spikes endpoint (pulse moments)
      fetch(`${strapiUrl}/api/fan-moments/auto-active?bandId=${props.bandId}`)
        .then(r => r.json())
        .catch(() => ({ ok: false })),
    ])

    // Process recap
    if (recapRes.ok && recapRes.recap) {
      shareables.push(normalizeRecap(recapRes.recap, recapRes.kind || 'real'))
    }

    // Process prompts
    if (promptsRes.ok && promptsRes.hot?.cards?.length > 0) {
      promptsRes.hot.cards.forEach((card, index) => {
        shareables.push(normalizePrompt(card, index))
      })
    }

    // Process spikes
    if (spikesRes.ok && spikesRes.moment) {
      shareables.push(normalizeSpike(spikesRes.moment))
    }

    allShareables.value = shareables
  } catch (err) {
    console.error('[ShareablesHub] Failed to fetch data:', err)
    allShareables.value = []
  }
}

async function refresh() {
  refreshing.value = true
  await fetchData()
  refreshing.value = false
  showToast('Refreshed!')
}

onMounted(async () => {
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

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
