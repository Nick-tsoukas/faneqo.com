<template>
  <div class="rounded-2xl border border-white/10 bg-black/20 p-4 sm:p-5 mb-4">
    <!-- Toast notification -->
    <Transition name="fade">
      <div
        v-if="toastMessage"
        class="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg bg-black/90 border border-white/20 text-white text-sm shadow-lg"
      >
        {{ toastMessage }}
      </div>
    </Transition>

    <div class="flex items-center justify-between mb-4">
      <div>
        <h3 class="text-white font-semibold flex items-center gap-2">
          <span class="text-lg">⚡</span>
          Pulse Moments
        </h3>
        <p class="text-white/50 text-xs mt-0.5">Auto-generated shareable moments from fan energy spikes</p>
      </div>
      
      <!-- Dev-only: Run Evaluator button -->
      <button
        v-if="isDev"
        @click="runEvaluator"
        :disabled="evaluating"
        class="px-3 py-1.5 rounded-lg border border-purple-500/30 text-purple-400 text-xs hover:bg-purple-500/10 transition-colors disabled:opacity-50"
      >
        {{ evaluating ? 'Evaluating...' : 'Run Evaluator' }}
      </button>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="text-gray-400 text-sm py-4">
      Loading pulse moments...
    </div>

    <!-- No moment state -->
    <div v-else-if="!moment" class="text-gray-400 text-sm py-4 text-center">
      <div class="text-2xl mb-2">🌙</div>
      <p>No surge moments right now.</p>
      <p class="text-xs mt-1">Moments are created when fan energy spikes.</p>
    </div>

    <!-- Active moment card -->
    <div v-else class="relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-purple-900/20 via-black/40 to-emerald-900/10 p-4">
      <!-- Moment type badge -->
      <div class="flex items-center gap-2 mb-3">
        <span 
          class="px-2 py-0.5 rounded-full text-xs font-medium"
          :class="momentBadgeClass"
        >
          {{ momentBadgeText }}
        </span>
        <span class="text-gray-500 text-xs">
          Expires {{ formatExpiry(moment.expiresAt) }}
        </span>
      </div>

      <!-- Share content -->
      <div class="mb-4">
        <h4 class="text-xl font-bold text-white mb-1">{{ moment.shareTitle }}</h4>
        <p class="text-gray-300 text-sm">{{ moment.shareText }}</p>
      </div>

      <!-- Caption Style Toggle -->
      <div class="mb-4">
        <div class="text-white/40 text-xs uppercase tracking-wider mb-2">Caption Style</div>
        <div class="flex gap-2">
          <button
            v-for="variant in captionVariants"
            :key="variant.key"
            @click="captionStyle = variant.key"
            :class="[
              'px-3 py-1.5 rounded-full text-xs font-medium transition-all',
              captionStyle === variant.key
                ? 'bg-purple-600 text-white'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            ]"
          >
            {{ variant.label }}
          </button>
        </div>
        <div class="mt-2 p-2 bg-black/30 rounded-lg text-white/80 text-sm italic">
          "{{ selectedCaption }}"
        </div>
      </div>

      <!-- Context info -->
      <div v-if="moment.context" class="text-xs text-gray-500 mb-4 space-y-0.5">
        <p v-if="moment.context.velocity">Velocity: {{ moment.context.velocity }}x baseline</p>
        <p v-if="moment.context.cityName">City: {{ moment.context.cityName }} ({{ Math.round(moment.context.cityShare * 100) }}% of traffic)</p>
        <p v-if="moment.context.recentInteractions">Recent interactions: {{ moment.context.recentInteractions }}</p>
      </div>

      <!-- Share actions -->
      <div class="space-y-3">
        <!-- Main share button -->
        <button
          @click="handleShare"
          :disabled="sharing"
          class="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-purple-600 to-emerald-600 text-white font-semibold text-sm hover:from-purple-500 hover:to-emerald-500 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <svg v-if="!sharing" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          {{ sharing ? 'Sharing...' : 'Share this Moment' }}
        </button>

        <!-- Social Share Kit row -->
        <div class="flex items-center justify-center gap-2 flex-wrap">
          <button
            @click="handleCopyLink"
            class="px-3 py-1.5 rounded-lg border border-white/15 text-white/70 text-xs hover:bg-white/5 transition-colors flex items-center gap-1.5"
            title="Copy link"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <span>Link</span>
          </button>
          
          <button
            @click="handleCopyCaption"
            class="px-3 py-1.5 rounded-lg border border-white/15 text-white/70 text-xs hover:bg-white/5 transition-colors flex items-center gap-1.5"
            title="Copy caption"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span>Caption</span>
          </button>
          
          <button
            @click="handleDownloadImage"
            :disabled="downloadingImage"
            class="px-3 py-1.5 rounded-lg border border-white/15 text-white/70 text-xs hover:bg-white/5 transition-colors flex items-center gap-1.5 disabled:opacity-50"
            title="Download image"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Image</span>
          </button>
          
          <button
            @click="handleInstagramKit"
            :disabled="preparingIG"
            class="px-3 py-1.5 rounded-lg border border-pink-500/30 text-pink-400/80 text-xs hover:bg-pink-500/10 transition-colors flex items-center gap-1.5 disabled:opacity-50"
            title="Prepare for Instagram"
          >
            <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
            <span>{{ preparingIG ? '...' : 'IG' }}</span>
          </button>
          
          <button
            @click="handleFacebookShare"
            class="px-3 py-1.5 rounded-lg border border-blue-500/30 text-blue-400/80 text-xs hover:bg-blue-500/10 transition-colors flex items-center gap-1.5"
            title="Share on Facebook"
          >
            <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            <span>FB</span>
          </button>
        </div>
      </div>

      <!-- Decorative elements -->
      <div class="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
    </div>

    <!-- Hidden canvas for image generation -->
    <canvas ref="canvasRef" class="hidden" width="1080" height="1080"></canvas>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRuntimeConfig } from '#imports'
import { useShareKit } from '@/composables/useShareKit'

const props = defineProps({
  bandId: {
    type: Number,
    required: true,
  },
  bandSlug: {
    type: String,
    required: true,
  },
  bandName: {
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
const {
  buildShareUrl,
  generateShareImage,
  webShare,
  copyToClipboard,
  downloadBlob,
  openFacebookSharer,
  getShareFilename,
} = useShareKit()

// State
const loading = ref(true)
const moment = ref(null)
const sharing = ref(false)
const downloadingImage = ref(false)
const preparingIG = ref(false)
const evaluating = ref(false)
const toastMessage = ref('')
const canvasRef = ref(null)
const cachedImageBlob = ref(null)
const captionStyle = ref('hype')

// Caption variants
const captionVariants = [
  { key: 'hype', label: '🔥 Hype' },
  { key: 'grateful', label: '🙏 Grateful' },
  { key: 'tease', label: '👀 Tease' },
]

// Generate caption based on style
const selectedCaption = computed(() => {
  if (!moment.value) return ''
  const bandName = props.bandName || 'the band'
  const velocity = moment.value.context?.velocity || ''
  const cityName = moment.value.context?.cityName || ''
  const baseText = moment.value.shareText || ''
  
  switch (captionStyle.value) {
    case 'hype':
      if (cityName) return `${cityName} is going off right now 🔥 ${bandName} is heating up!`
      if (velocity) return `${velocity}x the normal energy 🔥 ${bandName} is surging!`
      return `Something's happening with ${bandName} 🔥`
    case 'grateful':
      if (cityName) return `${cityName}, we see you 🙏 Thank you for the love.`
      return `Thank you for being part of this moment 🙏`
    case 'tease':
      if (cityName) return `${cityName}… we might need to come see you 👀`
      return `Something's building… stay close 👀`
    default:
      return baseText
  }
})

// Check if dev mode
const isDev = computed(() => {
  return process.dev || process.env.NODE_ENV === 'development'
})

// Moment badge styling
const momentBadgeClass = computed(() => {
  if (!moment.value) return ''
  switch (moment.value.momentType) {
    case 'PULSE_SURGE':
      return 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
    case 'CITY_HEAT':
      return 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
    case 'MOMENT_MATTERED':
      return 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
    default:
      return 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
  }
})

const momentBadgeText = computed(() => {
  if (!moment.value) return ''
  switch (moment.value.momentType) {
    case 'PULSE_SURGE':
      return '🔥 Pulse Surge'
    case 'CITY_HEAT':
      return '📍 City Heat'
    case 'MOMENT_MATTERED':
      return '⚡ Moment Mattered'
    default:
      return moment.value.momentType
  }
})

// Toast helper
function showToast(message, duration = 2000) {
  toastMessage.value = message
  setTimeout(() => { toastMessage.value = '' }, duration)
}

// Format expiry time
function formatExpiry(expiresAt) {
  if (!expiresAt) return ''
  const expiry = new Date(expiresAt)
  const now = new Date()
  const diffMs = expiry - now
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
  
  if (diffHours > 0) {
    return `in ${diffHours}h ${diffMins}m`
  }
  return `in ${diffMins}m`
}

// Fetch active auto-moment
async function fetchAutoMoment() {
  loading.value = true
  try {
    const res = await fetch(`${config.public.strapiUrl}/api/fan-moments/auto-active?bandId=${props.bandId}`)
    const data = await res.json()
    if (data.ok && data.moment) {
      moment.value = data.moment
    } else {
      moment.value = null
    }
  } catch (err) {
    console.error('[PulseMomentsPanel] Failed to fetch auto-moment:', err)
    moment.value = null
  } finally {
    loading.value = false
  }
}

// Run evaluator (dev only)
async function runEvaluator() {
  evaluating.value = true
  try {
    const res = await fetch(`${config.public.strapiUrl}/api/fan-moments/evaluate-auto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bandId: props.bandId, dryRun: false }),
    })
    const data = await res.json()
    
    if (data.ok) {
      showToast(`Evaluated: ${data.created} moment(s) created`, 3000)
      // Refresh moment
      await fetchAutoMoment()
    } else {
      showToast('Evaluation failed', 2000)
    }
  } catch (err) {
    console.error('[PulseMomentsPanel] Evaluator failed:', err)
    showToast('Evaluation error', 2000)
  } finally {
    evaluating.value = false
  }
}

// Share helpers
function getShareUrl() {
  return buildShareUrl({ bandSlug: props.bandSlug })
}

function getCaption() {
  return selectedCaption.value || moment.value?.shareText || `Check out ${props.bandName}!`
}

function getFilename() {
  return getShareFilename(props.bandSlug, 'pulse-moment')
}

async function getOrGenerateImage() {
  if (cachedImageBlob.value) return cachedImageBlob.value
  
  const blob = await generateShareImage({
    canvasEl: canvasRef.value,
    bandName: props.bandName,
    bandImageUrl: props.bandImageUrl,
    momentTitle: moment.value?.shareTitle || 'Fan energy is surging',
    isBandNameInLogo: props.isBandNameInLogo,
  })
  
  if (blob) {
    cachedImageBlob.value = blob
    setTimeout(() => { cachedImageBlob.value = null }, 30000)
  }
  
  return blob
}

// Share handlers
async function handleShare() {
  if (!moment.value) return
  sharing.value = true
  
  try {
    const shareUrl = getShareUrl()
    const shareText = `${moment.value.shareText} ${shareUrl}`
    const imageBlob = await getOrGenerateImage()
    
    const result = await webShare({
      title: moment.value.shareTitle,
      text: shareText,
      url: shareUrl,
      imageBlob,
      filename: getFilename(),
    })
    
    if (result.ok) {
      showToast('Shared!')
      return
    }
    
    // Fallback
    await copyToClipboard(shareUrl)
    showToast('Link copied!')
    if (imageBlob) {
      downloadBlob(imageBlob, getFilename())
    }
  } catch (err) {
    if (err.name !== 'AbortError') {
      console.error('[PulseMomentsPanel] Share failed:', err)
    }
  } finally {
    sharing.value = false
  }
}

async function handleCopyLink() {
  const success = await copyToClipboard(getShareUrl())
  if (success) showToast('Link copied!')
}

async function handleCopyCaption() {
  const success = await copyToClipboard(getCaption())
  if (success) showToast('Caption copied!')
}

async function handleDownloadImage() {
  downloadingImage.value = true
  try {
    const imageBlob = await getOrGenerateImage()
    if (imageBlob) {
      downloadBlob(imageBlob, getFilename())
      showToast('Image downloaded!')
    }
  } finally {
    downloadingImage.value = false
  }
}

async function handleInstagramKit() {
  preparingIG.value = true
  try {
    const imageBlob = await getOrGenerateImage()
    if (imageBlob) {
      downloadBlob(imageBlob, getFilename())
    }
    await copyToClipboard(getCaption())
    showToast('Ready for Instagram: image downloaded + caption copied', 3000)
  } finally {
    preparingIG.value = false
  }
}

async function handleFacebookShare() {
  // Use share landing page URL for proper OG tags
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://musicbizqr.com'
  const momentId = moment.value?.id
  const fbShareUrl = momentId 
    ? `${origin}/share/moment/${momentId}`
    : `${origin}/share/band/${props.bandSlug}`
  
  openFacebookSharer(fbShareUrl)
  await copyToClipboard(getCaption())
  showToast('Facebook opened + caption copied', 2500)
}

// Fetch on mount
onMounted(() => {
  fetchAutoMoment()
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
