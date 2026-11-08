<template>
  <div>
    <!-- Toast notification -->
    <Transition name="fade">
      <div
        v-if="toastMessage"
        class="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg bg-black/90 border border-white/20 text-white text-sm shadow-lg"
      >
        {{ toastMessage }}
      </div>
    </Transition>

    <!-- Full-width button style (matches Follow/Save buttons) -->
    <div v-if="fullWidth" class="space-y-3">
      <button
        type="button"
        @click="handleShare"
        :disabled="sharing"
        class="w-full flex items-center justify-center gap-3 rounded-2xl border border-white/20 bg-gradient-to-r from-slate-800/60 to-slate-700/60 px-4 py-4 text-white text-lg md:text-xl font-semibold shadow-lg transition hover:from-slate-800/80 hover:to-slate-700/80 hover:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg class="h-6 w-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
        <span>{{ sharing ? 'Sharing...' : `Share ${bandName}` }}</span>
      </button>
      
      <!-- Social Share Kit row -->
      <div v-if="showSocialKit" class="flex items-center justify-center gap-2 flex-wrap">
        <!-- Copy Link -->
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
        
        <!-- Copy Caption -->
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
        
        <!-- Download Image -->
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
        
        <!-- Instagram helper -->
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
        
        <!-- Facebook helper -->
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

    <!-- Compact strip style -->
    <div v-else class="space-y-2">
      <div class="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-white/10 bg-black/30">
        <div class="text-white/70 text-sm">
          Share this band
        </div>
        
        <div class="flex items-center gap-2">
          <button
            @click="handleShare"
            :disabled="sharing"
            class="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-purple-500 text-white text-sm font-medium hover:from-purple-500 hover:to-purple-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            <svg v-if="!sharing" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            <span>{{ sharing ? '...' : 'Share' }}</span>
          </button>
        </div>
      </div>
      
      <!-- Compact Social Kit row -->
      <div v-if="showSocialKit" class="flex items-center justify-center gap-1.5 flex-wrap px-2">
        <button @click="handleCopyLink" class="p-1.5 rounded border border-white/10 text-white/50 text-xs hover:bg-white/5" title="Copy link">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
        </button>
        <button @click="handleCopyCaption" class="p-1.5 rounded border border-white/10 text-white/50 text-xs hover:bg-white/5" title="Copy caption">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
        </button>
        <button @click="handleDownloadImage" :disabled="downloadingImage" class="p-1.5 rounded border border-white/10 text-white/50 text-xs hover:bg-white/5 disabled:opacity-50" title="Download image">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
        </button>
        <button @click="handleInstagramKit" :disabled="preparingIG" class="p-1.5 rounded border border-pink-500/20 text-pink-400/60 text-xs hover:bg-pink-500/10 disabled:opacity-50" title="Instagram kit">
          <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
        </button>
        <button @click="handleFacebookShare" class="p-1.5 rounded border border-blue-500/20 text-blue-400/60 text-xs hover:bg-blue-500/10" title="Facebook">
          <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
        </button>
      </div>
    </div>
    
    <!-- Hidden canvas for image generation -->
    <canvas ref="canvasRef" class="hidden" width="1080" height="1080"></canvas>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRuntimeConfig } from '#imports'
import { useVisitorSession } from '@/composables/useVisitorSession'
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
  placement: {
    type: String,
    required: true,
    validator: (v) => ['FOOTER', 'FAN_MOMENT_SECTION'].includes(v),
  },
  fullWidth: {
    type: Boolean,
    default: false,
  },
  showSocialKit: {
    type: Boolean,
    default: true,
  },
  // Fan context for moment detection
  fanCity: {
    type: String,
    default: null,
  },
  isFirstVisit: {
    type: Boolean,
    default: false,
  },
  isNearEvent: {
    type: Boolean,
    default: false,
  },
  momentumCity: {
    type: String,
    default: null,
  },
})

const config = useRuntimeConfig()
const { getOrCreateVisitorId, getOrCreateSessionId } = useVisitorSession()
const {
  buildShareUrl,
  buildCaption,
  buildShareText,
  generateShareImage,
  webShare,
  copyToClipboard,
  downloadBlob,
  openFacebookSharer,
  getShareFilename,
  // Fan share system (V2)
  FAN_MOMENT_TYPES,
  getFanCaption,
  getFanHeadline,
  detectFanMomentType,
  buildFanShareText,
  generateFanShareImage,
} = useShareKit()

// State
const sharing = ref(false)
const downloadingImage = ref(false)
const preparingIG = ref(false)
const canvasRef = ref(null)
const toastMessage = ref('')
const cachedImageBlob = ref(null)
const cacheKey = ref('')
const detectedMomentType = ref(FAN_MOMENT_TYPES.DEFAULT)

// Detect fan moment type on mount
onMounted(() => {
  detectedMomentType.value = detectFanMomentType({
    isFirstVisit: props.isFirstVisit,
    isNearEvent: props.isNearEvent,
    cityMatchesMomentum: props.fanCity && props.momentumCity && 
      props.fanCity.toLowerCase() === props.momentumCity.toLowerCase(),
    isReturningFan: !props.isFirstVisit,
    isSuperFan: false, // Would need session duration tracking
  })
})

// Computed values
function getShareUrl() {
  return buildShareUrl({ bandSlug: props.bandSlug })
}

function getCaption() {
  // Use new fan share copy system
  return getFanCaption(detectedMomentType.value, 'hype', {
    bandName: props.bandName,
    city: props.fanCity || props.momentumCity,
  })
}

function getShareTextWithUrl() {
  const caption = getCaption()
  return buildFanShareText(caption, getShareUrl())
}

function getFilename() {
  return getShareFilename(props.bandSlug, 'share')
}

function getHeadline() {
  return getFanHeadline(detectedMomentType.value, {
    bandName: props.bandName,
    city: props.fanCity || props.momentumCity,
  })
}

// Toast helper
function showToast(message, duration = 2000) {
  toastMessage.value = message
  setTimeout(() => { toastMessage.value = '' }, duration)
}

// Image loader helper (for fan share image generator)
// Uses backend proxy to bypass CORS restrictions for S3 images
async function loadImageDirect(url, timeoutMs = 15000) {
  // Skip if no URL
  if (!url) {
    throw new Error('No URL provided')
  }

  console.log('[loadImageDirect] Loading image via proxy:', url)

  try {
    // Use backend proxy for S3/CORS-restricted images
    const proxyUrl = `${config.public.strapiUrl}/api/image-proxy?url=${encodeURIComponent(url)}`
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
    
    const response = await fetch(proxyUrl, {
      signal: controller.signal,
    })
    
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    
    const blob = await response.blob()
    const objectUrl = URL.createObjectURL(blob)
    
    // Load image from object URL (no CORS issues)
    return new Promise((resolve, reject) => {
      const img = new Image()
      
      img.onload = () => {
        console.log('[loadImageDirect] Image loaded via proxy:', img.width, 'x', img.height)
        resolve(img)
      }
      img.onerror = (err) => {
        URL.revokeObjectURL(objectUrl)
        console.warn('[loadImageDirect] Failed to load from blob URL')
        reject(err || new Error('Image load error'))
      }
      
      img.src = objectUrl
    })
  } catch (err) {
    console.warn('[loadImageDirect] Proxy fetch failed:', err.message)
    throw err
  }
}

// Image generation with caching - uses new poster-style fan share image
async function getOrGenerateImage() {
  const key = `${props.bandSlug}-${props.bandName}-${detectedMomentType.value}`
  if (cachedImageBlob.value && cacheKey.value === key) {
    return cachedImageBlob.value
  }
  
  // Use new fan share image generator (poster style)
  const blob = await generateFanShareImage({
    canvasEl: canvasRef.value,
    headline: getHeadline(),
    bandName: props.bandName,
    bandImageUrl: props.bandImageUrl,
    isBandNameInLogo: props.isBandNameInLogo,
    momentType: detectedMomentType.value,
    loadImage: loadImageDirect,
  })
  
  if (blob) {
    cachedImageBlob.value = blob
    cacheKey.value = key
    // Clear cache after 30 seconds
    setTimeout(() => {
      if (cacheKey.value === key) {
        cachedImageBlob.value = null
        cacheKey.value = ''
      }
    }, 30000)
  }
  
  return blob
}

// Clear cache when props change
watch(() => [props.bandSlug, props.bandName], () => {
  cachedImageBlob.value = null
  cacheKey.value = ''
})

// Record share event to Strapi
async function recordShare(channel) {
  try {
    const visitorId = getOrCreateVisitorId()
    const sessionId = getOrCreateSessionId()
    
    if (!visitorId || !sessionId) return
    
    await fetch(`${config.public.strapiUrl}/api/band-shares/record`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bandId: props.bandId,
        visitorId,
        sessionId,
        shareChannel: channel,
        placement: props.placement,
        context: {
          bandSlug: props.bandSlug,
          hasMoment: false,
        },
      }),
    })
  } catch (err) {
    // Silent fail
  }
}

// Main share handler (Web Share API)
async function handleShare() {
  sharing.value = true
  
  try {
    const shareUrl = getShareUrl()
    const shareText = getShareTextWithUrl()
    const imageBlob = await getOrGenerateImage()
    
    const result = await webShare({
      title: props.bandName,
      text: shareText,
      url: shareUrl,
      imageBlob,
      filename: getFilename(),
    })
    
    if (result.ok) {
      recordShare('WEB_SHARE')
      return
    }
    
    // Fallback: copy link + download image
    await copyToClipboard(shareUrl)
    showToast('Link copied!')
    
    if (imageBlob) {
      downloadBlob(imageBlob, getFilename())
    }
    recordShare('COPY_LINK')
  } catch (err) {
    if (err.name !== 'AbortError') {
      console.error('[ShareBandStrip] Share failed:', err)
    }
  } finally {
    sharing.value = false
  }
}

// Copy Link only
async function handleCopyLink() {
  const shareUrl = getShareUrl()
  const success = await copyToClipboard(shareUrl)
  if (success) {
    showToast('Link copied!')
    recordShare('COPY_LINK')
  }
}

// Copy Caption only
async function handleCopyCaption() {
  const caption = getCaption()
  const success = await copyToClipboard(caption)
  if (success) {
    showToast('Caption copied!')
    recordShare('COPY_CAPTION')
  }
}

// Download Image only
async function handleDownloadImage() {
  downloadingImage.value = true
  try {
    const imageBlob = await getOrGenerateImage()
    if (imageBlob) {
      downloadBlob(imageBlob, getFilename())
      showToast('Image downloaded!')
      recordShare('DOWNLOAD_IMAGE')
    }
  } finally {
    downloadingImage.value = false
  }
}

// Instagram helper: download image + copy caption
async function handleInstagramKit() {
  preparingIG.value = true
  try {
    const imageBlob = await getOrGenerateImage()
    const caption = getCaption()
    
    if (imageBlob) {
      downloadBlob(imageBlob, getFilename())
    }
    await copyToClipboard(caption)
    
    showToast('Ready for Instagram: image downloaded + caption copied', 3000)
    recordShare('INSTAGRAM_KIT')
  } finally {
    preparingIG.value = false
  }
}

// Facebook helper: open sharer with OG-enabled share URL + copy caption
async function handleFacebookShare() {
  // Use share landing page URL for proper OG tags
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://musicbizqr.com'
  const fbShareUrl = `${origin}/share/band/${props.bandSlug}`
  const caption = getCaption()
  
  openFacebookSharer(fbShareUrl)
  await copyToClipboard(caption)
  
  showToast('Facebook opened + caption copied', 2500)
  recordShare('FACEBOOK_SHARE')
}
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
