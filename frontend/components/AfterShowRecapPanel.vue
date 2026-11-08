<template>
  <div class="chart-card mb-6">
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
        <h3 class="text-white text-lg font-semibold flex items-center gap-2">
          <span class="text-xl">{{ recapKind === 'mini' ? '📊' : '🎤' }}</span>
          {{ recapKind === 'mini' ? 'Activity Snapshot' : 'After-Show Recap' }}
        </h3>
        <p class="text-gray-400 text-xs mt-0.5">{{ recapKind === 'mini' ? 'Your last 24 hours at a glance' : 'Share your show highlights with fans' }}</p>
      </div>
      
      <!-- Dev-only: Run Recap Evaluator button -->
      <button
        v-if="isDev"
        @click="runEvaluator"
        :disabled="evaluating"
        class="px-3 py-1.5 rounded-lg border border-purple-500/30 text-purple-400 text-xs hover:bg-purple-500/10 transition-colors disabled:opacity-50"
      >
        {{ evaluating ? 'Evaluating...' : 'Run Recap Evaluator' }}
      </button>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="text-gray-400 text-sm py-4">
      Loading recap...
    </div>

    <!-- No recap state -->
    <div v-else-if="!recap" class="text-gray-400 text-sm py-4 text-center">
      <div class="text-2xl mb-2">🌙</div>
      <p>No show recap available.</p>
      <p class="text-xs mt-1">Recaps are created after activity spikes from shows.</p>
    </div>

    <!-- Active recap card -->
    <div v-else class="relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-purple-900/20 via-black/40 to-violet-900/10 p-4">
      <!-- Recap type badge -->
      <div class="flex items-center gap-2 mb-3">
        <span class="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30">
          {{ energyBadge }}
        </span>
        <span class="text-gray-500 text-xs">
          Expires {{ formatExpiry(recap.expiresAt) }}
        </span>
      </div>

      <!-- Share content -->
      <div class="mb-4">
        <h4 class="text-xl font-bold text-white mb-1">{{ recap.shareTitle }}</h4>
        <p class="text-gray-300 text-sm">{{ recap.shareText }}</p>
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

      <!-- Recap details from context -->
      <div v-if="recap.context" class="text-xs text-gray-500 mb-4 space-y-1">
        <p v-if="recap.context.venueName" class="flex items-center gap-1">
          <span>📍</span> {{ recap.context.venueName }}
        </p>
        <p v-if="recap.context.eventTitle" class="flex items-center gap-1">
          <span>🎵</span> {{ recap.context.eventTitle }}
        </p>
        <p v-if="recap.context.totalInteractions" class="flex items-center gap-1">
          <span>📊</span> {{ recap.context.totalInteractions }} interactions during peak
        </p>
        <p v-if="recap.context.topCity" class="flex items-center gap-1">
          <span>🏙️</span> Top city: {{ recap.context.topCity.name }} ({{ recap.context.topCity.count }})
        </p>
        <p v-if="recap.context.topMedia" class="flex items-center gap-1">
          <span>🎧</span> Top play: {{ recap.context.topMedia.title }} ({{ recap.context.topMedia.count }}x)
        </p>
      </div>

      <!-- Share actions -->
      <div class="space-y-3">
        <!-- Main share button -->
        <button
          @click="handleShare"
          :disabled="sharing"
          class="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-purple-600 to-violet-600 text-white font-semibold text-sm hover:from-purple-500 hover:to-violet-500 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <svg v-if="!sharing" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          {{ sharing ? 'Sharing...' : 'Share Recap' }}
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
const recap = ref(null)
const recapKind = ref(null) // 'real' | 'mini' | null
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
  if (!recap.value) return ''
  const bandName = props.bandName || 'the band'
  const venue = recap.value.context?.venueName || ''
  const baseText = recap.value.shareText || ''
  
  switch (captionStyle.value) {
    case 'hype':
      if (venue) return `${venue} was on fire last night 🔥 ${bandName} brought the energy!`
      return `Last night was incredible 🔥 ${bandName} brought the energy!`
    case 'grateful':
      if (venue) return `Thank you ${venue} for an amazing night 🙏 We felt every moment.`
      return `Thank you for showing up 🙏 We felt every moment with you.`
    case 'tease':
      if (venue) return `${venue}… that was just the beginning 👀`
      return `That was just the beginning… stay close 👀`
    default:
      return baseText
  }
})

// Check if dev mode
const isDev = computed(() => {
  return process.dev || process.env.NODE_ENV === 'development'
})

// Energy badge from context
const energyBadge = computed(() => {
  if (!recap.value?.context?.energyLabel) return 'Show Recap'
  return recap.value.context.energyLabel
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
  const diffDays = Math.floor(diffHours / 24)
  
  if (diffDays > 0) {
    return `in ${diffDays}d ${diffHours % 24}h`
  }
  if (diffHours > 0) {
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    return `in ${diffHours}h ${diffMins}m`
  }
  const diffMins = Math.floor(diffMs / (1000 * 60))
  return `in ${diffMins}m`
}

// Fetch active recap (with mini fallback)
async function fetchRecap() {
  loading.value = true
  try {
    const res = await fetch(`${config.public.strapiUrl}/api/fan-moments/recap-active?bandId=${props.bandId}&allowMini=true`)
    const data = await res.json()
    if (data.ok && data.recap) {
      recap.value = data.recap
      recapKind.value = data.kind || 'real'
    } else {
      recap.value = null
      recapKind.value = null
    }
  } catch (err) {
    console.error('[AfterShowRecapPanel] Failed to fetch recap:', err)
    recap.value = null
    recapKind.value = null
  } finally {
    loading.value = false
  }
}

// Run evaluator (dev only)
async function runEvaluator() {
  evaluating.value = true
  try {
    const res = await fetch(`${config.public.strapiUrl}/api/fan-moments/evaluate-recap`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bandId: props.bandId, dryRun: false }),
    })
    const data = await res.json()
    
    if (data.ok) {
      showToast(`Evaluated: ${data.created} recap(s) created`, 3000)
      await fetchRecap()
    } else {
      showToast('Evaluation failed', 2000)
    }
  } catch (err) {
    console.error('[AfterShowRecapPanel] Evaluator failed:', err)
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
  return selectedCaption.value || recap.value?.shareText || `Check out ${props.bandName}!`
}

function getFilename() {
  return getShareFilename(props.bandSlug, 'recap')
}

async function getOrGenerateImage() {
  if (cachedImageBlob.value) return cachedImageBlob.value
  
  const subtitle = recap.value?.context?.venueName || 'Show Recap'
  
  const blob = await generateShareImage({
    canvasEl: canvasRef.value,
    bandName: props.bandName,
    bandImageUrl: props.bandImageUrl,
    momentTitle: recap.value?.shareTitle || 'Show Recap',
    subtitle,
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
  if (!recap.value) return
  sharing.value = true
  
  try {
    const shareUrl = getShareUrl()
    const shareText = `${recap.value.shareText} ${shareUrl}`
    const imageBlob = await getOrGenerateImage()
    
    const result = await webShare({
      title: recap.value.shareTitle,
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
      console.error('[AfterShowRecapPanel] Share failed:', err)
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
  const momentId = recap.value?.id
  const fbShareUrl = momentId 
    ? `${origin}/share/moment/${momentId}`
    : `${origin}/share/band/${props.bandSlug}`
  
  openFacebookSharer(fbShareUrl)
  await copyToClipboard(getCaption())
  showToast('Facebook opened + caption copied', 2500)
}

// Fetch on mount
onMounted(() => {
  fetchRecap()
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
