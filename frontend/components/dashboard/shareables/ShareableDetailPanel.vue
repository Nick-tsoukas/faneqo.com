<template>
  <!-- Backdrop -->
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="modelValue"
        class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
        @click="close"
      ></div>
    </Transition>

    <!-- Panel - Bottom sheet on mobile, right drawer on desktop -->
    <Transition :name="isMobile ? 'slide-up' : 'slide-right'">
      <div
        v-if="modelValue && shareable"
        :class="[
          'fixed z-[101] bg-gradient-to-br from-gray-900 via-black to-gray-900 border-white/10 overflow-y-auto',
          isMobile
            ? 'inset-x-0 bottom-0 rounded-t-2xl border-t max-h-[85vh]'
            : 'top-0 right-0 bottom-0 w-full max-w-md border-l'
        ]"
      >
        <!-- Handle bar (mobile only) -->
        <div v-if="isMobile" class="flex justify-center pt-3 pb-2">
          <div class="w-10 h-1 rounded-full bg-white/20"></div>
        </div>

        <!-- Header -->
        <div class="flex items-start justify-between p-4 border-b border-white/10">
          <div class="flex-1 pr-4">
            <div class="flex items-center gap-2 mb-2">
              <span 
                class="px-2 py-0.5 rounded-full text-xs font-medium"
                :class="badgeClass"
              >
                {{ categoryIcon }} {{ shareable.windowLabel }}
              </span>
            </div>
            <h3 class="text-lg font-bold text-white">{{ shareable.title }}</h3>
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
        <div class="p-4 space-y-5">
          <!-- Stat & Why -->
          <div>
            <p class="text-purple-400 text-sm font-semibold mb-1">{{ shareable.stat }}</p>
            <p class="text-white/60 text-sm">{{ shareable.why }}</p>
          </div>

          <!-- Context details (if available) -->
          <div v-if="shareable.context && Object.keys(shareable.context).length > 0" class="space-y-1">
            <p v-if="shareable.context.venueName" class="text-xs text-white/50 flex items-center gap-1.5">
              <span>📍</span> {{ shareable.context.venueName }}
            </p>
            <p v-if="shareable.context.topCity" class="text-xs text-white/50 flex items-center gap-1.5">
              <span>🏙️</span> Top city: {{ shareable.context.topCity.name || shareable.context.topCity }}
            </p>
            <p v-if="shareable.context.totalInteractions" class="text-xs text-white/50 flex items-center gap-1.5">
              <span>📊</span> {{ shareable.context.totalInteractions }} interactions
            </p>
          </div>

          <!-- Caption Style Toggle -->
          <div>
            <div class="text-white/40 text-xs uppercase tracking-wider mb-2">Caption Style</div>
            <div class="flex gap-2 flex-wrap">
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
            <div class="mt-3 p-3 bg-black/40 rounded-lg border border-white/5">
              <p class="text-white/80 text-sm italic">"{{ selectedCaption }}"</p>
            </div>
          </div>

          <!-- Primary Share Button -->
          <button
            @click="handleShare"
            :disabled="sharing"
            class="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-emerald-600 text-white font-semibold text-sm hover:from-purple-500 hover:to-emerald-500 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <svg v-if="!sharing" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            <div v-else class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            {{ sharing ? 'Sharing...' : 'Share Now' }}
          </button>

          <!-- Share Kit Actions -->
          <div class="grid grid-cols-2 gap-2">
            <button
              @click="handleCopyLink"
              class="py-2.5 px-3 rounded-lg border border-white/15 text-white/70 text-sm hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              Copy Link
            </button>

            <button
              @click="handleCopyCaption"
              class="py-2.5 px-3 rounded-lg border border-white/15 text-white/70 text-sm hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy Caption
            </button>

            <button
              @click="handleDownloadImage"
              :disabled="downloadingImage"
              class="py-2.5 px-3 rounded-lg border border-white/15 text-white/70 text-sm hover:bg-white/5 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
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
              class="py-2.5 px-3 rounded-lg border border-pink-500/30 text-pink-400/80 text-sm hover:bg-pink-500/10 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
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
            class="w-full py-2.5 px-3 rounded-lg border border-blue-500/30 text-blue-400/80 text-sm hover:bg-blue-500/10 transition-colors flex items-center justify-center gap-2"
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
    <Transition name="fade">
      <div
        v-if="toastMessage"
        class="fixed bottom-24 left-1/2 -translate-x-1/2 z-[102] px-4 py-2 rounded-lg bg-black/90 border border-white/20 text-white text-sm shadow-lg"
      >
        {{ toastMessage }}
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useShareKit } from '@/composables/useShareKit'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  shareable: {
    type: Object,
    default: null,
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

const emit = defineEmits(['update:modelValue'])

const {
  generateShareImage,
  webShare,
  copyToClipboard,
  downloadBlob,
  openFacebookSharer,
  getShareFilename,
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

// Caption variants
const captionVariants = [
  { key: 'hype', label: '🔥 Hype' },
  { key: 'grateful', label: '🙏 Grateful' },
  { key: 'tease', label: '👀 Tease' },
]

// Computed
const badgeClass = computed(() => {
  if (!props.shareable) return ''
  switch (props.shareable.category) {
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

const categoryIcon = computed(() => {
  if (!props.shareable) return '✨'
  switch (props.shareable.category) {
    case 'recap':
      return '📊'
    case 'spike':
      return '⚡'
    case 'prompt':
      return '🔥'
    default:
      return '✨'
  }
})

const selectedCaption = computed(() => {
  if (!props.shareable?.captions) return ''
  return props.shareable.captions[captionStyle.value] || props.shareable.captions.hype || ''
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
  return props.shareable?.share?.url || `${window.location.origin}/${props.bandSlug}`
}

function getFacebookUrl() {
  return props.shareable?.share?.facebookUrl || `${window.location.origin}/share/band/${props.bandSlug}`
}

function getFilename() {
  const base = props.shareable?.share?.filenameBase || props.bandSlug
  return `${base}.png`
}

async function getOrGenerateImage() {
  if (cachedImageBlob.value) return cachedImageBlob.value

  const blob = await generateShareImage({
    canvasEl: canvasRef.value,
    bandName: props.bandName,
    bandImageUrl: props.bandImageUrl,
    momentTitle: props.shareable?.image?.momentTitle || props.shareable?.title,
    subtitle: props.shareable?.image?.subtitle || null,
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
  if (!props.shareable) return
  sharing.value = true

  try {
    const shareUrl = getShareUrl()
    const shareText = `${selectedCaption.value} ${shareUrl}`
    const imageBlob = await getOrGenerateImage()

    const result = await webShare({
      title: props.shareable.title,
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
      console.error('[ShareableDetailPanel] Share failed:', err)
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
  const success = await copyToClipboard(selectedCaption.value)
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
    await copyToClipboard(selectedCaption.value)
    showToast('Ready for Instagram: image downloaded + caption copied', 3000)
  } finally {
    preparingIG.value = false
  }
}

async function handleFacebookShare() {
  openFacebookSharer(getFacebookUrl())
  await copyToClipboard(selectedCaption.value)
  showToast('Facebook opened + caption copied', 2500)
}

// Check mobile
function checkMobile() {
  isMobile.value = window.innerWidth < 768
}

// Clear cache when shareable changes
watch(() => props.shareable, () => {
  cachedImageBlob.value = null
  captionStyle.value = 'hype'
})

// Prevent body scroll when open
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
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
</style>
