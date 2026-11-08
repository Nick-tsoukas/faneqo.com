<template>
  <div class="momentum-prompts-panel">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-white flex items-center gap-2">
        <span class="text-xl">🔥</span>
        Momentum Prompts
        <span class="text-white/40 text-sm font-normal">(Last 24h)</span>
      </h3>
      <button
        v-if="!loading && cards.length > 0"
        @click="refresh"
        class="text-white/50 hover:text-white/80 transition-colors"
        title="Refresh"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="flex items-center justify-center py-8">
      <div class="animate-spin w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full"></div>
    </div>

    <!-- Empty state -->
    <div v-else-if="cards.length === 0" class="text-center py-8">
      <div class="text-white/50 mb-3">No momentum yet — share your band link to spark it.</div>
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

    <!-- Cards -->
    <div v-else class="space-y-4">
      <div
        v-for="(card, index) in cards"
        :key="index"
        class="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-xl p-4"
      >
        <!-- Card header -->
        <div class="mb-3">
          <div class="text-lg font-semibold text-white">{{ card.title }}</div>
          <div class="text-white/60 text-sm mt-1">{{ card.why }}</div>
          <div class="text-purple-400 text-sm font-medium mt-1">{{ card.stat }}</div>
        </div>

        <!-- Caption variant toggle -->
        <div class="mb-3">
          <div class="text-white/40 text-xs uppercase tracking-wider mb-2">Caption Style</div>
          <div class="flex gap-2">
            <button
              v-for="variant in captionVariants"
              :key="variant.key"
              @click="setCardCaptionVariant(index, variant.key)"
              :class="[
                'px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                cardCaptionVariants[index] === variant.key
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              ]"
            >
              {{ variant.label }}
            </button>
          </div>
          <div class="mt-2 p-2 bg-black/30 rounded-lg text-white/80 text-sm italic">
            "{{ getCardCaption(card, index) }}"
          </div>
        </div>

        <!-- Action buttons -->
        <div class="flex items-center gap-2 flex-wrap">
          <!-- Copy Caption -->
          <button
            @click="handleCopyCaption(card, index)"
            class="px-3 py-1.5 rounded-lg border border-white/15 text-white/70 text-xs hover:bg-white/5 transition-colors flex items-center gap-1.5"
            title="Copy caption"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span>Caption</span>
          </button>

          <!-- Copy Link -->
          <button
            @click="handleCopyLink(card)"
            class="px-3 py-1.5 rounded-lg border border-white/15 text-white/70 text-xs hover:bg-white/5 transition-colors flex items-center gap-1.5"
            title="Copy link"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <span>Link</span>
          </button>

          <!-- Download Image -->
          <button
            @click="handleDownloadImage(card, index)"
            :disabled="generatingImage[index]"
            class="px-3 py-1.5 rounded-lg border border-white/15 text-white/70 text-xs hover:bg-white/5 transition-colors flex items-center gap-1.5 disabled:opacity-50"
            title="Download image"
          >
            <svg v-if="!generatingImage[index]" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <div v-else class="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            <span>Image</span>
          </button>

          <!-- Instagram helper -->
          <button
            @click="handleInstagramShare(card, index)"
            :disabled="preparingIG[index]"
            class="px-3 py-1.5 rounded-lg border border-pink-500/30 text-pink-400/80 text-xs hover:bg-pink-500/10 transition-colors flex items-center gap-1.5 disabled:opacity-50"
            title="Prepare for Instagram"
          >
            <svg v-if="!preparingIG[index]" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
            <div v-else class="w-3.5 h-3.5 border-2 border-pink-400/30 border-t-pink-400 rounded-full animate-spin"></div>
            <span>IG</span>
          </button>

          <!-- Facebook helper -->
          <button
            @click="handleFacebookShare(card)"
            class="px-3 py-1.5 rounded-lg border border-blue-500/30 text-blue-400/80 text-xs hover:bg-blue-500/10 transition-colors flex items-center gap-1.5"
            title="Share on Facebook"
          >
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            <span>FB</span>
          </button>
        </div>
      </div>
    </div>

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

const { downloadBlob, copyToClipboard, openFacebookSharer } = useShareKit()

const props = defineProps({
  bandId: { type: [Number, String], required: true },
  bandName: { type: String, default: '' },
  bandSlug: { type: String, default: '' },
  bandImageUrl: { type: String, default: null },
  isBandNameInLogo: { type: Boolean, default: false },
})

const config = useRuntimeConfig()
// /api/pulse/whats-hot is band-private and authenticated server-side.
const token = useStrapiToken()

// State
const loading = ref(true)
const cards = ref([])
const hotData = ref(null)
const toastMessage = ref('')
const cardCaptionVariants = ref({})
const generatingImage = ref({})
const preparingIG = ref({})

// Caption variants
const captionVariants = [
  { key: 'hype', label: '🔥 Hype' },
  { key: 'grateful', label: '🙏 Grateful' },
  { key: 'tease', label: '👀 Tease' },
]

// Initialize caption variants for each card
function initCaptionVariants() {
  cards.value.forEach((_, index) => {
    if (!cardCaptionVariants.value[index]) {
      cardCaptionVariants.value[index] = 'hype'
    }
  })
}

function setCardCaptionVariant(index, variant) {
  cardCaptionVariants.value[index] = variant
}

function getCardCaption(card, index) {
  const variant = cardCaptionVariants.value[index] || 'hype'
  return card.captions?.[variant] || card.captions?.hype || ''
}

// Fetch data
async function fetchWhatsHot() {
  loading.value = true
  try {
    const res = await fetch(
      `${config.public.strapiUrl}/api/pulse/whats-hot?bandId=${props.bandId}`,
      { headers: token.value ? { Authorization: `Bearer ${token.value}` } : {} }
    )
    const data = await res.json()
    
    if (data.ok) {
      hotData.value = data.hot
      cards.value = data.hot?.cards || []
      initCaptionVariants()
    }
  } catch (err) {
    console.error('[MomentumPromptsPanel] Failed to fetch:', err)
  } finally {
    loading.value = false
  }
}

function refresh() {
  fetchWhatsHot()
}

// Toast helper
function showToast(message, duration = 2500) {
  toastMessage.value = message
  setTimeout(() => {
    toastMessage.value = ''
  }, duration)
}

// Get band URL
function getBandUrl() {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://musicbizqr.com'
  return `${origin}/${props.bandSlug || ''}`
}

// Share actions
async function handleCopyCaption(card, index) {
  const caption = getCardCaption(card, index)
  await copyToClipboard(caption)
  showToast('Caption copied!')
  trackShare(card, 'COPY_CAPTION', index)
}

async function handleCopyLink(card) {
  const url = card.type === 'HOT_LINK' && card.payload?.url 
    ? card.payload.url 
    : getBandUrl()
  await copyToClipboard(url)
  showToast('Link copied!')
  trackShare(card, 'COPY_LINK')
}

async function handleDownloadImage(card, index) {
  generatingImage.value[index] = true
  try {
    const caption = getCardCaption(card, index)
    const imageBlob = await generateMomentumImage(card, caption)
    if (imageBlob) {
      const filename = `${props.bandSlug || 'momentum'}-${card.type.toLowerCase()}.png`
      downloadBlob(imageBlob, filename)
      showToast('Image downloaded!')
      trackShare(card, 'DOWNLOAD_IMAGE', index)
    }
  } catch (err) {
    console.error('[MomentumPromptsPanel] Image generation failed:', err)
    showToast('Failed to generate image')
  } finally {
    generatingImage.value[index] = false
  }
}

async function handleInstagramShare(card, index) {
  preparingIG.value[index] = true
  try {
    const caption = getCardCaption(card, index)
    const imageBlob = await generateMomentumImage(card, caption)
    if (imageBlob) {
      const filename = `${props.bandSlug || 'momentum'}-${card.type.toLowerCase()}.png`
      downloadBlob(imageBlob, filename)
      await copyToClipboard(caption)
      showToast('Ready for Instagram: image downloaded + caption copied', 3000)
      trackShare(card, 'INSTAGRAM_KIT', index)
    }
  } catch (err) {
    console.error('[MomentumPromptsPanel] IG prep failed:', err)
    showToast('Failed to prepare for Instagram')
  } finally {
    preparingIG.value[index] = false
  }
}

function handleFacebookShare(card) {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://musicbizqr.com'
  const fbShareUrl = `${origin}/share/band/${props.bandSlug}`
  openFacebookSharer(fbShareUrl)
  showToast('Facebook opened')
  trackShare(card, 'FACEBOOK_SHARE')
}

function handleQuickShare() {
  if (navigator.share) {
    navigator.share({
      title: props.bandName,
      url: getBandUrl(),
    })
  } else {
    handleCopyBandLink()
  }
}

async function handleCopyBandLink() {
  await copyToClipboard(getBandUrl())
  showToast('Band link copied!')
}

// Generate momentum card image using canvas
async function generateMomentumImage(card, caption) {
  const canvas = document.createElement('canvas')
  canvas.width = 1080
  canvas.height = 1080
  const ctx = canvas.getContext('2d')

  // Background gradient (cleaner, no circles)
  const gradient = ctx.createLinearGradient(0, 0, 1080, 1080)
  gradient.addColorStop(0, '#1a0a2e')
  gradient.addColorStop(0.5, '#0f0f0f')
  gradient.addColorStop(1, '#0a1a1a')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 1080, 1080)

  // Track vertical position
  let yPos = 120

  // Band profile image at top (if available)
  if (props.bandImageUrl) {
    try {
      const img = await loadImage(props.bandImageUrl)
      const imgSize = 180
      const imgX = (1080 - imgSize) / 2
      
      // Draw circular clipped image
      ctx.save()
      ctx.beginPath()
      ctx.arc(imgX + imgSize / 2, yPos + imgSize / 2, imgSize / 2, 0, Math.PI * 2)
      ctx.closePath()
      ctx.clip()
      ctx.drawImage(img, imgX, yPos, imgSize, imgSize)
      ctx.restore()
      
      // Border around image
      ctx.beginPath()
      ctx.arc(imgX + imgSize / 2, yPos + imgSize / 2, imgSize / 2, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
      ctx.lineWidth = 3
      ctx.stroke()
      
      yPos += imgSize + 40
    } catch (err) {
      // If image fails to load, continue without it
      yPos += 40
    }
  } else {
    yPos += 80
  }

  // Fire emoji + title (strip existing emoji from title, use fire)
  const titleWithoutEmoji = card.title.replace(/^[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]\s*/u, '').trim()
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 56px Inter, system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(`🔥 ${titleWithoutEmoji}`, 540, yPos)
  yPos += 60

  // Why line
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
  ctx.font = '32px Inter, system-ui, sans-serif'
  const whyLines = wrapTextAndReturn(ctx, card.why, 900, 40)
  whyLines.forEach(line => {
    ctx.fillText(line, 540, yPos)
    yPos += 40
  })
  yPos += 30

  // Stat
  ctx.fillStyle = '#a78bfa'
  ctx.font = 'bold 44px Inter, system-ui, sans-serif'
  ctx.fillText(card.stat, 540, yPos)
  yPos += 70

  // Caption
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
  ctx.font = 'italic 30px Inter, system-ui, sans-serif'
  const captionLines = wrapTextAndReturn(ctx, `"${caption}"`, 900, 38)
  captionLines.forEach(line => {
    ctx.fillText(line, 540, yPos)
    yPos += 38
  })
  yPos += 50

  // Band name (only if NOT in logo)
  if (!props.isBandNameInLogo && props.bandName) {
    ctx.fillStyle = '#c4b5fd'
    ctx.font = 'bold 38px Inter, system-ui, sans-serif'
    ctx.fillText(props.bandName, 540, yPos)
  }

  // Watermark
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
  ctx.font = '22px Inter, system-ui, sans-serif'
  ctx.textAlign = 'right'
  ctx.fillText('via Faneqo', 1040, 1040)

  return new Promise((resolve) => {
    canvas.toBlob(resolve, 'image/png')
  })
}

// Load image helper
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

// Wrap text and return lines array
function wrapTextAndReturn(ctx, text, maxWidth, lineHeight) {
  const words = text.split(' ')
  const lines = []
  let line = ''

  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + ' '
    const metrics = ctx.measureText(testLine)
    if (metrics.width > maxWidth && i > 0) {
      lines.push(line.trim())
      line = words[i] + ' '
    } else {
      line = testLine
    }
  }
  lines.push(line.trim())
  return lines
}

// Text wrapping helper
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ')
  let line = ''
  let currentY = y

  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + ' '
    const metrics = ctx.measureText(testLine)
    if (metrics.width > maxWidth && i > 0) {
      ctx.fillText(line.trim(), x, currentY)
      line = words[i] + ' '
      currentY += lineHeight
    } else {
      line = testLine
    }
  }
  ctx.fillText(line.trim(), x, currentY)
}

// Track share event
async function trackShare(card, channel, index = null) {
  try {
    await fetch(`${config.public.strapiUrl}/api/band-shares/record`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bandId: props.bandId,
        shareChannel: channel,
        placement: 'DASHBOARD_MOMENTUM_PROMPTS',
        context: {
          kind: 'whats_hot',
          cardType: card.type,
          payload: card.payload,
          windowHours: 24,
          captionVariant: index !== null ? cardCaptionVariants.value[index] : null,
        },
      }),
    })
  } catch (err) {
    // Non-blocking
  }
}

onMounted(() => {
  fetchWhatsHot()
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
