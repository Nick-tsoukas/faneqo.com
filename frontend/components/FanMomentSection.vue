<template>
  <!-- Toast notification -->
  <Transition name="fade">
    <div
      v-if="toastMessage"
      class="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg bg-black/90 border border-white/20 text-white text-sm shadow-lg"
    >
      {{ toastMessage }}
    </div>
  </Transition>

  <!-- Show full moment UI when moment exists -->
  <section
    v-if="moment"
    class="w-full px-6 mt-10 pb-10 md:max-w-[80vw] md:mx-auto"
  >
    <div>
      <div class="text-center text-white/50 text-xs uppercase tracking-wider mb-3">
        Your Moment
      </div>
      
      <div class="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-purple-900/30 via-black/40 to-emerald-900/20 p-5">
        <!-- Headline -->
        <div class="text-center">
          <div class="text-2xl font-bold text-white mb-1">
            {{ momentHeadline }}
          </div>
          <div class="text-white/70 text-sm">
            {{ momentSubtext }}
          </div>
        </div>
        
        <!-- Context -->
        <div class="mt-4 text-center">
          <div class="text-lg font-semibold text-purple-300">
            {{ moment.context.bandName }}
          </div>
          <div v-if="fanPositionText" class="text-emerald-400/80 text-sm mt-1 font-medium">
            {{ fanPositionText }}
          </div>
          <div v-if="locationText" class="text-white/60 text-sm mt-1">
            {{ locationText }}
          </div>
          <div v-if="moment.context.eventName" class="text-white/50 text-xs mt-1">
            {{ moment.context.eventName }}
          </div>
          <div v-if="moment.context.velocity" class="text-orange-400/70 text-xs mt-1">
            {{ moment.context.velocity }}x activity right now
          </div>
        </div>
        
        <!-- Caption Style Toggle -->
        <div class="mt-4 mb-4">
          <div class="text-white/40 text-xs uppercase tracking-wider mb-2">Caption Style</div>
          <div class="flex gap-2 justify-center">
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
          <div class="mt-2 p-2 bg-black/30 rounded-lg text-white/80 text-sm italic text-center">
            "{{ selectedCaption }}"
          </div>
        </div>
        
        <!-- Share Button -->
        <div class="mt-4">
          <button
            @click="shareDrawerOpen = true"
            class="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-emerald-600 text-white font-semibold text-sm hover:from-purple-500 hover:to-emerald-500 transition-all flex items-center justify-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            <span>Share this moment</span>
          </button>
        </div>

        <!-- Moment Share Drawer -->
        <MomentShareDrawer
          :is-open="shareDrawerOpen"
          :band-id="bandId"
          :band-slug="bandSlug"
          :band-name="bandName"
          :band-image-url="bandImageUrl"
          :is-band-name-in-logo="isBandNameInLogo"
          :headline="momentHeadline"
          :subtext="momentSubtext"
          :fan-position="fanPositionText"
          :captions="momentCaptions"
          :moment-type="moment?.actionType || 'DEFAULT'"
          :moment-id="moment?.id || null"
          @close="shareDrawerOpen = false"
          @shared="onMomentShared"
        />
        
        <!-- Decorative elements -->
        <div class="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div class="absolute bottom-0 left-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
      </div>
    </div>
    
    <!-- Hidden canvas for image generation -->
    <canvas ref="canvasRef" class="hidden" width="1080" height="1080"></canvas>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRuntimeConfig } from '#imports'
import { useVisitorSession } from '@/composables/useVisitorSession'
import { useShareKit } from '@/composables/useShareKit'
import MomentShareDrawer from '@/components/band/MomentShareDrawer.vue'

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
  pulseData: {
    type: Object,
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
} = useShareKit()

const moment = ref(null)
const sharing = ref(false)
const downloadingImage = ref(false)
const preparingIG = ref(false)
const canvasRef = ref(null)
const hasEarnedThisSession = ref(false)
const toastMessage = ref('')
const cachedImageBlob = ref(null)
const captionStyle = ref('hype')
const shareDrawerOpen = ref(false)

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
  const baseText = moment.value.share?.text || moment.value.shareText || ''
  const actionType = moment.value.actionType || ''
  
  switch (captionStyle.value) {
    case 'hype':
      if (actionType === 'qr_scan') return `I was there for ${bandName} 🔥 Live show energy!`
      if (actionType === 'link_click') return `Just discovered ${bandName} 🔥 You need to check them out!`
      if (actionType === 'follow') return `Just followed ${bandName} 🔥 Join the fanbase!`
      if (actionType === 'payment') return `I backed ${bandName} 🔥 Real fans support real music!`
      return `I was part of the moment for ${bandName} 🔥`
    case 'grateful':
      if (actionType === 'qr_scan') return `Thanks for the show ${bandName} 🙏 Incredible night.`
      if (actionType === 'payment') return `Proud to support ${bandName} 🙏 Every bit helps.`
      return `Grateful to be part of ${bandName}'s journey 🙏`
    case 'tease':
      if (actionType === 'qr_scan') return `${bandName}… that was just the beginning 👀`
      return `Something's happening with ${bandName}… stay close 👀`
    default:
      return baseText
  }
})

// Computed - use rich share content from API
const momentHeadline = computed(() => {
  if (!moment.value) return ''
  // Use the rich share title from API, fallback to legacy logic
  if (moment.value.share?.title) {
    return moment.value.share.title
  }
  return moment.value.momentType === 'FUELED_MOMENTUM'
    ? 'You fueled the moment'
    : 'You were part of this moment'
})

const momentSubtext = computed(() => {
  if (!moment.value) return ''
  // Use the rich share subtitle from API, fallback to legacy logic
  if (moment.value.share?.subtitle) {
    return moment.value.share.subtitle
  }
  // Use triggerReason as fallback
  if (moment.value.triggerReason) {
    return moment.value.triggerReason
  }
  return moment.value.momentType === 'FUELED_MOMENTUM'
    ? 'Your action helped tonight\'s momentum.'
    : 'Thanks for showing up.'
})

const momentEmoji = computed(() => {
  if (!moment.value) return '✨'
  return moment.value.share?.emoji || '✨'
})

const momentCallToAction = computed(() => {
  if (!moment.value) return 'Check them out'
  return moment.value.share?.callToAction || 'Check them out'
})

const fanPositionText = computed(() => {
  if (!moment.value?.fanPosition) return ''
  const pos = moment.value.fanPosition
  if (pos <= 10) return `Fan #${pos} today`
  if (pos <= 50) return `One of the first ${pos} fans today`
  if (pos <= 100) return `Top 100 fans today`
  return ''
})

const locationText = computed(() => {
  if (!moment.value?.context) return ''
  const { city, state, cityName } = moment.value.context
  // cityName is used for CITY_HEAT moments
  if (cityName) return cityName
  if (city && state) return `${city}, ${state}`
})

// Captions object for the drawer
const momentCaptions = computed(() => {
  const bandName = props.bandName || 'the band'
  const actionType = moment.value?.actionType || ''
  
  return {
    hype: actionType === 'qr_scan' ? `I was there for ${bandName} 🔥 Live show energy!`
        : actionType === 'link_click' ? `Just discovered ${bandName} 🔥 You need to check them out!`
        : actionType === 'follow' ? `Just followed ${bandName} 🔥 Join the fanbase!`
        : actionType === 'payment' ? `I backed ${bandName} 🔥 Real fans support real music!`
        : `I was part of the moment for ${bandName} 🔥`,
    chill: actionType === 'qr_scan' ? `Thanks for the show ${bandName} 🙏 Incredible night.`
        : actionType === 'payment' ? `Proud to support ${bandName} 🙏 Every bit helps.`
        : `Grateful to be part of ${bandName}'s journey 🙏`,
    flex: actionType === 'qr_scan' ? `${bandName}… that was just the beginning 👀`
        : `Something's happening with ${bandName}… stay close 👀`,
  }
})

// Handler for when moment is shared via drawer
function onMomentShared({ channel, captionStyle }) {
  showToast('Moment shared!')
}

// Check local cooldown (24h per band)
function checkLocalCooldown() {
  if (typeof window === 'undefined') return false
  const key = `fan_moment_${props.bandId}`
  const lastAt = localStorage.getItem(key)
  if (!lastAt) return false
  const lastTime = new Date(lastAt).getTime()
  const now = Date.now()
  return (now - lastTime) < 24 * 60 * 60 * 1000
}

function setLocalCooldown() {
  if (typeof window === 'undefined') return
  const key = `fan_moment_${props.bandId}`
  localStorage.setItem(key, new Date().toISOString())
}

// Check for existing active moment
async function checkActiveMoment() {
  const visitorId = getOrCreateVisitorId()
  if (!visitorId || !props.bandId) return

  try {
    const res = await fetch(
      `${config.public.strapiUrl}/api/fan-moments/active?bandId=${props.bandId}&visitorId=${visitorId}`
    )
    const data = await res.json()
    if (data.ok && data.moment) {
      moment.value = data.moment
    }
  } catch (err) {
    console.error('[FanMomentSection] Failed to check active moment:', err)
  }
}

// Earn a new moment
async function earnMoment(actionType, context = {}) {
  // Prevent multiple earns per session
  if (hasEarnedThisSession.value) return
  if (moment.value) return
  
  // Check local cooldown
  if (checkLocalCooldown()) return

  const visitorId = getOrCreateVisitorId()
  const sessionId = getOrCreateSessionId()
  if (!visitorId || !props.bandId) return

  hasEarnedThisSession.value = true

  try {
    const res = await fetch(`${config.public.strapiUrl}/api/fan-moments/earn`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bandId: props.bandId,
        actionType,
        visitorId,
        sessionId,
        context: {
          bandName: props.bandName,
          ...context,
        },
        pulse: props.pulseData || null,
      }),
    })

    const data = await res.json()
    if (data.ok && data.moment) {
      moment.value = data.moment
      setLocalCooldown()
      
      // Track moment earned
      trackEvent('fan_moment_earned', {
        bandId: props.bandId,
        momentType: data.moment.momentType,
        actionType,
      })
    }
  } catch (err) {
    console.error('[FanMomentSection] Failed to earn moment:', err)
    hasEarnedThisSession.value = false
  }
}

// Track event (privacy-safe)
function trackEvent(eventName, payload) {
  try {
    const apiUrl = `${config.public.strapiUrl}/api/band-ui-events/track`
    const data = {
      bandId: payload.bandId,
      bandSlug: null,
      eventName,
      payload,
    }
    
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' })
      navigator.sendBeacon(apiUrl, blob)
    } else {
      fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        keepalive: true,
      }).catch(() => {})
    }
  } catch (err) {
    // Silent fail
  }
}

// Toast helper
function showToast(message, duration = 2000) {
  toastMessage.value = message
  setTimeout(() => { toastMessage.value = '' }, duration)
}

// Get share URL
function getShareUrl() {
  return buildShareUrl({ bandSlug: props.bandSlug })
}

// Get moment-specific caption (uses selected caption style)
function getMomentCaption() {
  if (!moment.value) return ''
  // Use the selected caption from caption style toggle
  return selectedCaption.value || buildCaption({
    bandName: moment.value.context.bandName || props.bandName,
    momentType: moment.value.momentType,
  })
}

// Get share text with URL
function getShareTextWithUrl() {
  if (!moment.value) return ''
  return buildShareText({
    bandName: moment.value.context.bandName || props.bandName,
    shareUrl: getShareUrl(),
    momentType: moment.value.momentType,
  })
}

// Get filename for download
function getFilename() {
  return getShareFilename(props.bandSlug, 'moment')
}

// Generate or get cached image
async function getOrGenerateImage() {
  if (!moment.value) return null
  if (cachedImageBlob.value) return cachedImageBlob.value
  
  const blob = await generateShareImage({
    canvasEl: canvasRef.value,
    bandName: moment.value.context.bandName || props.bandName,
    bandImageUrl: props.bandImageUrl,
    momentTitle: momentHeadline.value,
    subtitle: locationText.value,
    isBandNameInLogo: props.isBandNameInLogo,
  })
  
  if (blob) {
    cachedImageBlob.value = blob
    // Clear cache after 30 seconds
    setTimeout(() => { cachedImageBlob.value = null }, 30000)
  }
  
  return blob
}

// Main share handler (Web Share API)
async function handleShare() {
  if (!moment.value) return
  sharing.value = true
  
  try {
    const shareUrl = getShareUrl()
    const shareText = getShareTextWithUrl()
    const imageBlob = await getOrGenerateImage()
    
    const result = await webShare({
      title: moment.value.share?.title || props.bandName,
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
      console.error('[FanMomentSection] Share failed:', err)
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
  const caption = getMomentCaption()
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
    const caption = getMomentCaption()
    
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

// Facebook helper: open sharer with OG-enabled moment URL + copy caption
async function handleFacebookShare() {
  // Use share landing page URL for proper OG tags with moment-specific image
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://musicbizqr.com'
  const momentId = moment.value?.id
  const fbShareUrl = momentId 
    ? `${origin}/share/moment/${momentId}`
    : `${origin}/share/band/${props.bandSlug}`
  const caption = getMomentCaption()
  
  openFacebookSharer(fbShareUrl)
  await copyToClipboard(caption)
  
  showToast('Facebook opened + caption copied', 2500)
  recordShare('FACEBOOK_SHARE')
}

// Record share event
async function recordShare(channel) {
  if (!moment.value) return
  
  try {
    await fetch(`${config.public.strapiUrl}/api/fan-moments/shared`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        momentId: moment.value.id,
        bandId: props.bandId,
        visitorId: getOrCreateVisitorId(),
        sessionId: getOrCreateSessionId(),
        channel,
      }),
    })
    
    trackEvent('fan_moment_shared', {
      bandId: props.bandId,
      momentType: moment.value.momentType,
      channel,
    })
  } catch (err) {
    // Silent fail
  }
}

// Expose earnMoment for parent to call
defineExpose({
  earnMoment,
  checkActiveMoment,
})

// On mount, check for existing moment and QR entry
onMounted(async () => {
  await checkActiveMoment()
  
  // Check for QR entry
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search)
    const isQrEntry = urlParams.has('qr') || urlParams.has('scan') || sessionStorage.getItem('qr_entry') === 'true'
    
    if (isQrEntry && !moment.value) {
      // Mark QR entry for future reference
      sessionStorage.setItem('qr_entry', 'true')
      // Earn moment for QR scan
      await earnMoment('qr_scan', {
        landingPath: window.location.pathname,
        sourceCategory: 'qr',
      })
    }
  }
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
