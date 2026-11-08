<template>
  <div class="shareable-tile bg-gray-900/50 rounded-xl border border-white/10 overflow-hidden">
    <!-- Header -->
    <div class="p-3 border-b border-white/10 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <span 
          class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
          :style="badgeStyle"
        >
          {{ item.type || item.momentType }}
        </span>
        <span class="text-white/40 text-xs">{{ item.windowLabel || item.label }}</span>
      </div>
      <span 
        class="px-2 py-0.5 rounded text-[10px] font-medium"
        :class="isBandCard ? 'bg-purple-500/20 text-purple-300' : 'bg-emerald-500/20 text-emerald-300'"
      >
        {{ isBandCard ? 'Band' : 'Fan' }}
      </span>
    </div>

    <!-- Preview Area -->
    <div class="p-5 space-y-5">
      <!-- Image Preview -->
      <div class="aspect-square bg-black/40 rounded-lg overflow-hidden relative">
        <img 
          v-if="imageUrl" 
          :src="imageUrl" 
          alt="Preview"
          class="w-full h-full object-cover"
        />
        <div v-else class="w-full h-full flex items-center justify-center">
          <div v-if="generating" class="text-center">
            <div class="animate-spin w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-2"></div>
            <p class="text-white/40 text-xs">Generating...</p>
          </div>
          <p v-else class="text-white/30 text-xs">Click regenerate</p>
        </div>
      </div>

      <!-- Headline -->
      <div class="text-center py-2">
        <p class="text-white font-bold text-base mb-1">{{ item.headline }}</p>
        <p v-if="item.hero" class="text-xl font-black bg-gradient-to-r from-pink-500 via-violet-500 to-emerald-400 bg-clip-text text-transparent">
          {{ item.hero }}
        </p>
      </div>

      <!-- Caption -->
      <div class="bg-black/30 rounded-lg p-4">
        <p class="text-white/60 text-sm italic text-center leading-relaxed">
          {{ selectedCaption }}
        </p>
      </div>

      <!-- Actions -->
      <div class="grid grid-cols-2 gap-3">
        <button
          @click="handleCopyCaption"
          class="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 text-xs font-medium transition-colors flex items-center justify-center gap-1"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Caption
        </button>
        <button
          v-if="isBandCard"
          @click="handleCopyLink"
          class="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 text-xs font-medium transition-colors flex items-center justify-center gap-1"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          Link
        </button>
        <button
          @click="handleDownload"
          :disabled="!imageUrl"
          class="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 text-xs font-medium transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download
        </button>
        <button
          @click="handleRegenerate"
          :disabled="generating"
          class="px-3 py-2 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 text-xs font-medium transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
        >
          <svg class="w-3.5 h-3.5" :class="{ 'animate-spin': generating }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Regenerate
        </button>
      </div>

      <!-- Copy JSON (band cards only) -->
      <button
        v-if="isBandCard"
        @click="handleCopyJson"
        class="w-full px-3 py-2 rounded-lg border border-white/10 hover:bg-white/5 text-white/40 text-xs transition-colors"
      >
        Copy JSON
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import { useShareKit } from '~/composables/useShareKit'

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
  tone: {
    type: String,
    default: 'hype',
  },
  showBandImage: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['toast'])

const { copyToClipboard, downloadBlob } = useShareKit()

// State
const generating = ref(false)
const imageBlob = ref(null)
const imageUrl = ref(null)

// Computed
const isBandCard = computed(() => !!props.item.type)

const accentColor = computed(() => {
  const accents = {
    violet: '#8B5CF6',
    blue: '#3B82F6',
    rose: '#F43F5E',
    emerald: '#10B981',
    amber: '#F59E0B',
  }
  return accents[props.item.accent] || accents.violet
})

const badgeStyle = computed(() => ({
  backgroundColor: `${accentColor.value}20`,
  color: accentColor.value,
  border: `1px solid ${accentColor.value}40`,
}))

const selectedCaption = computed(() => {
  const captions = props.item.microCaption || props.item.captions || {}
  return captions[props.tone] || captions.hype || ''
})

// Cleanup URL on unmount
onUnmounted(() => {
  if (imageUrl.value) {
    URL.revokeObjectURL(imageUrl.value)
  }
})

// Watch for tone changes to regenerate
watch(() => props.tone, () => {
  // Clear cached image when tone changes
  if (imageUrl.value) {
    URL.revokeObjectURL(imageUrl.value)
    imageUrl.value = null
    imageBlob.value = null
  }
})

// Actions
async function handleCopyCaption() {
  const success = await copyToClipboard(selectedCaption.value)
  emit('toast', success ? 'Caption copied!' : 'Failed to copy')
}

async function handleCopyLink() {
  const url = props.item.share?.shareUrl || `https://musicbizqr.com/${props.item.band?.slug}`
  const success = await copyToClipboard(url)
  emit('toast', success ? 'Link copied!' : 'Failed to copy')
}

async function handleCopyJson() {
  const json = JSON.stringify(props.item, null, 2)
  const success = await copyToClipboard(json)
  emit('toast', success ? 'JSON copied!' : 'Failed to copy')
}

async function handleDownload() {
  if (!imageBlob.value) return
  const filename = `${props.item.band?.slug || 'share'}-${props.item.type || props.item.momentType}.png`
  downloadBlob(imageBlob.value, filename)
  emit('toast', 'Image downloaded!')
}

async function handleRegenerate() {
  generating.value = true
  emit('regenerate', props.item)
  
  // The parent will handle actual generation and call setImage
  // For now, simulate a delay
  setTimeout(() => {
    generating.value = false
  }, 2000)
}

// Expose method for parent to set generated image
function setImage(blob) {
  if (imageUrl.value) {
    URL.revokeObjectURL(imageUrl.value)
  }
  imageBlob.value = blob
  imageUrl.value = blob ? URL.createObjectURL(blob) : null
  generating.value = false
}

defineExpose({ setImage, handleRegenerate })
</script>
