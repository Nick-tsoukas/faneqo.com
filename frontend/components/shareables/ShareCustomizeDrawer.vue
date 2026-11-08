<template>
  <!-- Backdrop -->
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="modelValue"
        class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
        @click="close"
      ></div>
    </Transition>

    <!-- Panel - Bottom sheet on mobile, right drawer on desktop -->
    <Transition :name="isMobile ? 'slide-up' : 'slide-right'">
      <div
        v-if="modelValue && item"
        :class="[
          'fixed z-[9999] bg-gradient-to-br from-gray-900 via-black to-gray-900 border-white/10 overflow-y-auto',
          isMobile
            ? 'inset-x-0 bottom-0 rounded-t-2xl border-t max-h-[85vh]'
            : 'top-0 right-0 bottom-0 w-full max-w-[420px] border-l'
        ]"
        @keydown.esc="close"
      >
        <!-- Handle bar (mobile only) -->
        <div v-if="isMobile" class="flex justify-center pt-3 pb-2 sticky top-0 bg-gradient-to-b from-gray-900 to-transparent z-10">
          <div class="w-10 h-1 rounded-full bg-white/20"></div>
        </div>

        <!-- Header -->
        <div class="flex items-start justify-between p-5 border-b border-white/10">
          <div class="flex-1 pr-4">
            <div class="flex items-center gap-2 mb-2">
              <span 
                class="px-2 py-0.5 rounded-full text-xs font-medium"
                :class="badgeClass"
              >
                {{ item.windowLabel }}
              </span>
              <span class="text-white/40 text-xs">{{ item.kind }}</span>
            </div>
            <h3 class="text-xl font-bold text-white">{{ item.title }}</h3>
          </div>
          <button
            @click="close"
            class="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-white"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Content -->
        <div class="p-5 space-y-5">
          <!-- Share Image Preview -->
          <div class="card-preview-container relative rounded-xl overflow-hidden bg-black/40 border border-white/10">
            <div class="aspect-square w-full max-w-[320px] mx-auto flex items-center justify-center">
              <!-- Loading state -->
              <div v-if="generatingPreview" class="flex flex-col items-center gap-2 py-8">
                <div class="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full"></div>
                <span class="text-white/50 text-xs">Generating share image...</span>
              </div>
              <!-- Generated preview image -->
              <img 
                v-else-if="previewImageUrl"
                :src="previewImageUrl" 
                :alt="item.title"
                class="w-full h-full object-contain"
              />
              <!-- Fallback to styled card preview -->
              <div v-else class="w-full h-full p-4">
                <div 
                  class="w-full h-full rounded-xl overflow-hidden relative"
                  :style="previewCardStyle"
                >
                  <div class="absolute inset-0" :class="previewGradientClass"></div>
                  <div 
                    class="absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-40"
                    :style="{ backgroundColor: accentColor }"
                  ></div>
                  <div 
                    class="absolute -bottom-6 -left-6 w-16 h-16 rounded-full blur-2xl opacity-20"
                    style="background-color: #10B981;"
                  ></div>
                  <div class="relative z-10 h-full flex flex-col p-4 text-center">
                    <!-- Window label badge (only if has card data) -->
                    <div v-if="item.windowLabel" class="mb-2">
                      <span 
                        class="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider"
                        :style="previewBadgeStyle"
                      >
                        {{ item.windowLabel }}
                      </span>
                    </div>
                    
                    <!-- Band Image - Always show (larger for band-only share) -->
                    <div class="flex justify-center" :class="isBandShareOnly ? 'mb-4 mt-4' : 'mb-3'">
                      <div class="relative">
                        <div 
                          class="absolute inset-0 rounded-full blur-lg opacity-50"
                          :style="{ backgroundColor: accentColor }"
                        ></div>
                        <div 
                          v-if="previewBandImageUrl"
                          class="relative rounded-full overflow-hidden border-2 border-white/20"
                          :class="isBandShareOnly ? 'w-20 h-20' : 'w-14 h-14'"
                        >
                          <img 
                            :src="previewBandImageUrl" 
                            :alt="item.band?.name"
                            class="w-full h-full object-cover"
                          />
                        </div>
                        <div 
                          v-else
                          class="relative rounded-full flex items-center justify-center border-2 border-white/20"
                          :class="isBandShareOnly ? 'w-20 h-20' : 'w-14 h-14'"
                          :style="{ background: `linear-gradient(135deg, ${accentColor}40, ${accentColor}20)` }"
                        >
                          <span class="text-white/70 font-bold" :class="isBandShareOnly ? 'text-xl' : 'text-base'">{{ previewBandInitials }}</span>
                        </div>
                      </div>
                    </div>
                    
                    <!-- Band Share Only Layout -->
                    <template v-if="isBandShareOnly">
                      <h4 v-if="!item.band?.isBandNameInLogo" class="text-white text-sm font-bold mb-2">{{ item.band?.name }}</h4>
                      <div class="flex-1"></div>
                      <p class="text-white/60 text-[9px] uppercase tracking-wide mb-1">Scan • Listen • Follow</p>
                      <p class="text-white/40 text-[8px]">via Faneqo</p>
                    </template>
                    
                    <!-- Full Card Layout -->
                    <template v-else>
                      <h4 class="text-white text-xs font-bold mb-2 line-clamp-2">{{ item.title }}</h4>
                      <div class="flex-1 flex items-center justify-center">
                        <span class="text-2xl font-black" :style="previewHeroStyle">{{ item.primaryStat }}</span>
                      </div>
                      <p class="text-white/60 text-[9px] uppercase tracking-wide mb-2">{{ item.secondaryStat }}</p>
                      <p v-if="!item.band?.isBandNameInLogo" class="text-white/80 text-[10px] font-medium">— {{ item.band?.name }} —</p>
                    </template>
                  </div>
                </div>
              </div>
            </div>
            <div class="absolute top-2 right-2 px-2 py-1 bg-purple-500/80 backdrop-blur rounded-full text-[10px] text-white font-medium">
              {{ previewImageUrl ? 'Share Image' : 'Generating...' }}
            </div>
          </div>

          <!-- Primary Share Button -->
          <button
            @click="handleShare"
            :disabled="sharing"
            class="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold text-base hover:from-purple-500 hover:to-blue-500 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20"
          >
            <svg v-if="!sharing" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            <div v-else class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            {{ sharing ? 'Sharing...' : 'Share Now' }}
          </button>

          <!-- Share Kit Actions - 2x2 grid -->
          <div class="grid grid-cols-2 gap-3">
            <button
              @click="handleCopyLink"
              class="py-3 px-4 rounded-xl border border-white/15 text-white/70 text-sm font-medium hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              Copy Link
            </button>

            <button
              @click="handleDownloadImage"
              :disabled="downloadingImage"
              class="py-3 px-4 rounded-xl border border-white/15 text-white/70 text-sm font-medium hover:bg-white/5 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <svg v-if="!downloadingImage" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <div v-else class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Download Image
            </button>

            <button
              @click="handleInstagramKit"
              :disabled="preparingIG"
              class="py-3 px-4 rounded-xl border border-pink-500/30 text-pink-400/80 text-sm font-medium hover:bg-pink-500/10 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <svg v-if="!preparingIG" class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              <div v-else class="w-4 h-4 border-2 border-pink-400/30 border-t-pink-400 rounded-full animate-spin"></div>
              Instagram Kit
            </button>
          </div>

          <!-- Facebook Share -->
          <button
            @click="handleFacebookShare"
            class="w-full py-3 px-4 rounded-xl border border-blue-500/30 text-blue-400/80 text-sm font-medium hover:bg-blue-500/10 transition-colors flex items-center justify-center gap-2"
          >
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            Share on Facebook
          </button>
        </div>

        <!-- Hidden canvas for image generation -->
        <canvas ref="canvasRef" class="hidden" width="1080" height="1080"></canvas>
      </div>
    </Transition>
  </Teleport>

  <!-- Toast notification -->
  <Teleport to="body">
    <Transition name="toast">
      <div
        v-if="toastMessage"
        class="fixed bottom-24 left-1/2 -translate-x-1/2 z-[102] px-4 py-2.5 rounded-xl bg-black/90 border border-white/20 text-white text-sm shadow-xl backdrop-blur-sm"
      >
        {{ toastMessage }}
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRuntimeConfig } from '#imports'
import { useShareKit } from '~/composables/useShareKit'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  item: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['update:modelValue'])

const {
  generateShareImage,
  generateShareCardImage,
  webShare,
  webShareWithTracking,
  copyToClipboard,
  copyLinkWithTracking,
  downloadBlob,
  downloadImageWithTracking,
  openFacebookSharer,
  openFacebookSharerWithTracking,
  buildShareUrlWithAttribution,
  trackShareAction,
  ACCENT_COLORS,
} = useShareKit()

// State
const isMobile = ref(false)
const captionStyle = ref('hype')
const sharing = ref(false)
const downloadingImage = ref(false)
const preparingIG = ref(false)
const toastMessage = ref('')
const canvasRef = ref(null)
const cachedImageBlob = ref(null)
const previewImageUrl = ref(null)
const generatingPreview = ref(false)

// Caption variants
const captionVariants = [
  { key: 'hype', label: '🔥 Hype' },
  { key: 'grateful', label: '🙏 Grateful' },
  { key: 'tease', label: '👀 Tease' },
]

// Accent color helpers
const accentColor = computed(() => {
  const accent = props.item?.accent || 'violet'
  return ACCENT_COLORS?.[accent]?.primary || '#8B5CF6'
})

// Check if this is a band-share-only (no card data like hero/proof stats)
const isBandShareOnly = computed(() => {
  return !props.item?.primaryStat && !props.item?.secondaryStat
})

// Band image URL for preview - normalize relative URLs
const previewBandImageUrl = computed(() => {
  const url = props.item?.band?.imageUrl
  if (!url) return null
  if (url.startsWith('http')) return url
  // Prepend Strapi URL for relative paths
  const strapiUrl = useRuntimeConfig().public?.strapiUrl || ''
  return `${strapiUrl}${url}`
})

// Band initials for placeholder
const previewBandInitials = computed(() => {
  const name = props.item?.band?.name || ''
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
})

const previewGradientClass = computed(() => {
  const accent = props.item?.accent || 'violet'
  const gradientMap = {
    violet: 'bg-gradient-to-br from-violet-900/80 via-gray-900 to-gray-900',
    blue: 'bg-gradient-to-br from-blue-900/80 via-gray-900 to-gray-900',
    emerald: 'bg-gradient-to-br from-emerald-900/80 via-gray-900 to-gray-900',
    amber: 'bg-gradient-to-br from-amber-900/80 via-gray-900 to-gray-900',
    rose: 'bg-gradient-to-br from-rose-900/80 via-gray-900 to-gray-900',
  }
  return gradientMap[accent] || gradientMap.violet
})

const previewCardStyle = computed(() => ({
  border: `1px solid ${accentColor.value}33`,
}))

const previewBadgeStyle = computed(() => ({
  backgroundColor: `${accentColor.value}20`,
  color: accentColor.value,
  borderColor: `${accentColor.value}40`,
}))

const previewHeroStyle = computed(() => ({
  background: `linear-gradient(135deg, #F472B6, ${accentColor.value}, #60A5FA, #34D399)`,
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
}))

// Computed
const badgeClass = computed(() => {
  if (!props.item) return ''
  switch (props.item.source) {
    case 'recap':
      return 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
    case 'spike':
      return 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
    case 'prompt':
      return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
    default:
      return 'bg-white/10 text-white/60 border border-white/20'
  }
})

const selectedCaption = computed(() => {
  if (!props.item?.share?.captions) return ''
  return props.item.share.captions[captionStyle.value] || props.item.share.captions.hype || ''
})

// Generate preview image when drawer opens
watch(() => props.modelValue, async (isOpen) => {
  if (isOpen && !previewImageUrl.value && props.item) {
    generatingPreview.value = true
    try {
      const blob = await getOrGenerateImage()
      if (blob) {
        previewImageUrl.value = URL.createObjectURL(blob)
      }
    } catch (e) {
      console.error('[ShareCustomizeDrawer] Failed to generate preview:', e)
    } finally {
      generatingPreview.value = false
    }
  }
}, { immediate: true })

// Clear preview when item changes
watch(() => props.item?.id, () => {
  previewImageUrl.value = null
  cachedImageBlob.value = null
})

// Methods
function close() {
  emit('update:modelValue', false)
}

function showToast(message, duration = 2500) {
  toastMessage.value = message
  setTimeout(() => { toastMessage.value = '' }, duration)
}

function getShareUrl() {
  // Use attribution URL for shareables
  if (props.item?.id && props.item?.band?.slug) {
    return buildShareUrlWithAttribution({
      bandSlug: props.item.band.slug,
      shareableId: props.item.id,
    })
  }
  return props.item?.share?.shareUrl || ''
}

function getOgUrl() {
  // Always build shareable-specific URL for cards with band data
  // This ensures the OG image includes card-specific hero/headline/proof
  if (props.item?.id && props.item?.band?.id) {
    const params = new URLSearchParams({
      bandId: String(props.item.band.id),
      bandSlug: props.item.band.slug || '',
      type: props.item.kind || props.item.type || 'MILESTONE_DROP',
      hero: props.item.primaryStat || props.item.hero || '',
      headline: props.item.title || props.item.headline || '',
      proof: props.item.secondaryStat || props.item.proof || '',
      accent: props.item.accent || 'violet',
    })
    return `https://musicbizqr.com/share/shareable/${props.item.id}?${params.toString()}`
  }
  // Fallback to explicit ogUrl (e.g., demo cards without band data)
  if (props.item?.share?.ogUrl) {
    return props.item.share.ogUrl
  }
  return ''
}

/**
 * Build tracking payload for share actions
 */
function getTrackingPayload() {
  if (!props.item) return null
  return {
    bandId: props.item.band?.id,
    shareableId: props.item.id,
    cardType: props.item.type || props.item.kind,
    window: props.item.window,
    accent: props.item.accent,
    captionStyle: captionStyle.value,
    placement: 'drawer',
  }
}

function getFilename() {
  const slug = props.item?.band?.slug || 'share'
  return `${slug}-${props.item?.source || 'moment'}.png`
}

async function getOrGenerateImage() {
  if (cachedImageBlob.value) return cachedImageBlob.value

  const band = props.item?.band
  if (!band) return null

  // Build card object for new generator
  const card = {
    headline: props.item?.title,
    hero: props.item?.primaryStat,
    proof: props.item?.secondaryStat,
    accent: props.item?.accent || 'violet',
    microCaption: props.item?.share?.captions || null,
  }

  // Use new generateShareCardImage for V1 cards
  const blob = await generateShareCardImage({
    canvasEl: canvasRef.value,
    card,
    bandName: band.name,
    bandImageUrl: band.imageUrl,
    isBandNameInLogo: band.isBandNameInLogo,
    captionStyle: captionStyle.value,
  })

  if (blob) {
    cachedImageBlob.value = blob
    // Cache for 30 seconds
    setTimeout(() => { cachedImageBlob.value = null }, 30000)
  }

  return blob
}

// Track drawer open
function trackDrawerOpen() {
  if (!props.item) return
  console.log('[ShareCustomizeDrawer] SHARE_DRAWER_OPENED', {
    bandId: props.item.band?.id,
    itemId: props.item.id,
    source: props.item.source,
    kind: props.item.kind,
  })
}

// Share handlers with tracking
async function handleShare() {
  if (!props.item) return
  sharing.value = true

  try {
    const shareUrl = getShareUrl()
    const shareText = `${selectedCaption.value} ${shareUrl}`
    const imageBlob = await getOrGenerateImage()
    const trackingPayload = getTrackingPayload()

    const result = await webShareWithTracking({
      title: props.item.title,
      text: shareText,
      url: shareUrl,
      imageBlob,
      filename: getFilename(),
      trackingPayload,
    })

    if (result.ok) {
      showToast('Shared!')
      return
    }

    // Fallback: copy link with tracking
    const copied = await copyLinkWithTracking(shareUrl, trackingPayload)
    if (copied) {
      showToast('Link copied!')
    }
    if (imageBlob) {
      downloadBlob(imageBlob, getFilename())
    }
  } catch (err) {
    if (err.name !== 'AbortError') {
      console.error('[ShareCustomizeDrawer] Share failed:', err)
    }
  } finally {
    sharing.value = false
  }
}

async function handleCopyLink() {
  const trackingPayload = getTrackingPayload()
  const success = await copyLinkWithTracking(getShareUrl(), trackingPayload)
  if (success) showToast('Link copied!')
}

async function handleCopyCaption() {
  const success = await copyToClipboard(selectedCaption.value)
  if (success) {
    showToast('Caption copied!')
    // Track caption copy as well
    const trackingPayload = getTrackingPayload()
    if (trackingPayload) {
      trackShareAction({ ...trackingPayload, action: 'copyCaption' })
    }
  }
}

async function handleDownloadImage() {
  downloadingImage.value = true
  try {
    const imageBlob = await getOrGenerateImage()
    if (imageBlob) {
      const trackingPayload = getTrackingPayload()
      downloadImageWithTracking(imageBlob, getFilename(), trackingPayload)
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
    const trackingPayload = getTrackingPayload()
    
    if (imageBlob) {
      downloadBlob(imageBlob, getFilename())
    }
    await copyToClipboard(selectedCaption.value)
    
    // Track Instagram kit action
    if (trackingPayload) {
      trackShareAction({ ...trackingPayload, action: 'instagram' })
    }
    
    showToast('Ready for Instagram: image downloaded + caption copied', 3000)
  } finally {
    preparingIG.value = false
  }
}

async function handleFacebookShare() {
  const ogUrl = getOgUrl()
  console.log('[ShareDrawer] Facebook share URL:', ogUrl)
  const trackingPayload = getTrackingPayload()
  openFacebookSharerWithTracking(ogUrl, trackingPayload)
  await copyToClipboard(selectedCaption.value)
  showToast('Facebook opened + caption copied', 2500)
}

// Check mobile
function checkMobile() {
  isMobile.value = window.innerWidth < 768
}

// Handle escape key
function handleEscape(e) {
  if (e.key === 'Escape' && props.modelValue) {
    close()
  }
}

// Clear cache when item changes
watch(() => props.item, () => {
  cachedImageBlob.value = null
  captionStyle.value = props.item?.share?.defaultCaptionStyle || 'hype'
})

// Clear cache when caption style changes (so image regenerates with new caption)
watch(captionStyle, () => {
  cachedImageBlob.value = null
})

// Track when drawer opens
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    document.body.style.overflow = 'hidden'
    trackDrawerOpen()
  } else {
    document.body.style.overflow = ''
  }
})

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
  window.addEventListener('keydown', handleEscape)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
  window.removeEventListener('keydown', handleEscape)
  document.body.style.overflow = ''
})
</script>

<style scoped>
/* Fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Slide up transition (mobile bottom sheet) */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}

/* Slide right transition (desktop drawer) */
.slide-right-enter-active,
.slide-right-leave-active {
  transition: transform 0.3s ease;
}
.slide-right-enter-from,
.slide-right-leave-to {
  transform: translateX(100%);
}

/* Toast transition */
.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, 10px);
}

/* Line clamp utilities */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
