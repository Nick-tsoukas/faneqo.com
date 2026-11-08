<template>
  <button
    @click="$emit('click', item)"
    class="shareable-card flex-shrink-0 snap-start text-left transition-all group"
    :class="cardSizeClass"
  >
    <div 
      class="relative h-full rounded-xl overflow-hidden border border-white/10 hover:border-white/20 transition-all"
      :style="cardBorderStyle"
    >
      <!-- Background gradient matching export -->
      <div class="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900"></div>
      
      <!-- Accent orb top-right -->
      <div 
        class="absolute -top-10 -right-10 w-28 h-28 rounded-full blur-2xl opacity-30"
        :style="{ backgroundColor: accentColor }"
      ></div>
      
      <!-- Accent orb bottom-left (subtle) -->
      <div 
        class="absolute -bottom-8 -left-8 w-20 h-20 rounded-full blur-2xl opacity-15"
        style="background-color: #10B981;"
      ></div>

      <!-- Content -->
      <div class="relative z-10 h-full flex flex-col p-4">
        <!-- Window label badge -->
        <div class="mb-2">
          <span 
            class="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
            :style="badgeStyle"
          >
            {{ item.windowLabel }}
          </span>
        </div>

        <!-- Band Image - Always show prominently -->
        <div class="flex justify-center mb-3">
          <div class="relative">
            <!-- Glow behind image -->
            <div 
              class="absolute inset-0 rounded-full blur-xl opacity-40"
              :style="{ backgroundColor: accentColor }"
            ></div>
            <!-- Image or placeholder -->
            <div 
              v-if="item.band?.imageUrl"
              class="relative w-16 h-16 rounded-full overflow-hidden border-2 border-white/20"
            >
              <img 
                :src="normalizedImageUrl" 
                :alt="item.band?.name"
                class="w-full h-full object-cover"
                @error="handleImageError"
              />
            </div>
            <!-- Placeholder with initials -->
            <div 
              v-else
              class="relative w-16 h-16 rounded-full flex items-center justify-center border-2 border-white/20"
              :style="placeholderStyle"
            >
              <span class="text-white/70 text-lg font-bold">{{ bandInitials }}</span>
            </div>
          </div>
        </div>

        <!-- Headline -->
        <h4 class="text-white text-xs font-bold mb-2 line-clamp-2 leading-tight text-center">
          {{ item.headline }}
        </h4>

        <!-- Hero stat -->
        <div class="flex-1 flex items-center justify-center py-1">
          <span 
            class="text-2xl font-black text-center"
            :style="heroStyle"
          >
            {{ item.hero }}
          </span>
        </div>

        <!-- Proof line -->
        <p class="text-white/55 text-[9px] uppercase tracking-wide text-center mb-2">
          {{ item.proof }}
        </p>

        <!-- Band name (if not in logo) -->
        <p 
          v-if="!item.band?.isBandNameInLogo" 
          class="text-white/80 text-[10px] font-medium text-center truncate mb-1"
        >
          — {{ item.band?.name }} —
        </p>

        <!-- Share CTA -->
        <button
          @click.stop="$emit('share', item)"
          class="mt-auto w-full py-2 px-3 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-semibold hover:from-purple-500 hover:to-blue-500 transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-purple-500/20"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          Share Now
        </button>
      </div>
    </div>
  </button>
</template>

<script setup>
/**
 * ShareableCard — Unified card component for V1 Shareables
 * 
 * QA GATES handled by this component:
 * - QA-2: Headlines wrap to max 2 lines (line-clamp-2)
 * - QA-3: Hero text uses flex centering (never clips)
 * - QA-4: Missing microCaption falls back to empty string
 * - QA-6: Unknown accent uses safe default (violet)
 */

import { computed, ref } from 'vue'
import { useRuntimeConfig } from '#imports'
import { ACCENT_COLORS, TYPE_TO_ACCENT, getAccentConfig } from '~/utils/shareables/mappings'

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
  size: {
    type: String,
    default: 'normal', // 'normal' | 'compact'
  },
})

defineEmits(['click', 'share'])

const config = useRuntimeConfig()
const imageError = ref(false)

// QA-6: Get accent color with safe fallback
const accent = computed(() => {
  return getAccentConfig(props.item.accent, props.item.type)
})

const accentColor = computed(() => accent.value.primary)

// Band image URL - normalize relative URLs
const normalizedImageUrl = computed(() => {
  const url = props.item.band?.imageUrl
  if (!url) return null
  if (url.startsWith('http')) return url
  // Prepend Strapi URL for relative paths
  const strapiUrl = config.public?.strapiUrl || ''
  return `${strapiUrl}${url}`
})

// Handle image load errors
function handleImageError() {
  imageError.value = true
}

// Placeholder style with accent gradient
const placeholderStyle = computed(() => ({
  background: `linear-gradient(135deg, ${accentColor.value}40, ${accentColor.value}20)`,
}))

// Band initials for placeholder
const bandInitials = computed(() => {
  const name = props.item.band?.name || ''
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
})

// Card size classes
const cardSizeClass = computed(() => {
  return props.size === 'compact' 
    ? 'w-[200px] min-h-[280px]' 
    : 'w-[280px] min-h-[340px] md:w-[320px] md:min-h-[380px]'
})

// Dynamic styles
const cardBorderStyle = computed(() => ({
  borderColor: `${accentColor.value}22`,
}))

const badgeStyle = computed(() => ({
  backgroundColor: `${accentColor.value}20`,
  color: accentColor.value,
  border: `1px solid ${accentColor.value}40`,
}))

const heroStyle = computed(() => ({
  background: `linear-gradient(135deg, #F472B6, ${accentColor.value}, #60A5FA, #34D399)`,
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
}))

// QA-4: Display caption with safe fallback for missing microCaption
const displayCaption = computed(() => {
  const style = props.item.selectedCaptionStyle || 'hype'
  // Handle null/undefined microCaption gracefully
  if (!props.item.microCaption) return ''
  return props.item.microCaption[style] || props.item.microCaption.hype || ''
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
