<template>
  <div class="shareables-feed">
    <!-- Header -->
    <div class="flex items-start justify-between mb-4">
      <div>
        <h3 class="text-lg font-semibold text-white flex items-center gap-2">
          <span class="text-xl">✨</span>
          Shareables
        </h3>
        <p class="text-white/50 text-xs mt-0.5">
          Ready-to-post moments based on your momentum
        </p>
      </div>
      <button
        v-if="!loading && items.length > 0"
        @click="handleRefresh"
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
    <div v-if="loading" class="flex items-center justify-center py-16">
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

      <!-- Empty state -->
      <div v-if="currentItems.length === 0" class="text-center py-12">
        <div class="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
          <span class="text-3xl">✨</span>
        </div>
        <h4 class="text-white font-semibold mb-2">No moments yet</h4>
        <p class="text-white/50 text-sm mb-5 max-w-xs mx-auto">
          Share your band link to spark momentum — we'll generate shareable moments automatically.
        </p>
        <div class="flex items-center justify-center gap-3">
          <button
            @click="handleQuickShare"
            class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-semibold hover:from-purple-500 hover:to-blue-500 transition-all shadow-lg shadow-purple-500/20"
          >
            Share Band
          </button>
          <button
            @click="handleCopyBandLink"
            class="px-5 py-2.5 rounded-xl border border-white/20 text-white/70 text-sm font-medium hover:bg-white/5 transition-colors"
          >
            Copy Link
          </button>
        </div>
      </div>

      <!-- Horizontal scroll row -->
      <div v-else class="relative">
        <!-- Left arrow (desktop) -->
        <button
          v-if="showLeftArrow && !isMobile"
          @click="scrollLeft"
          class="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 w-10 h-10 rounded-full bg-black/80 border border-white/20 text-white/80 hover:bg-black hover:text-white transition-all flex items-center justify-center shadow-lg"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <!-- Cards row -->
        <div 
          ref="scrollContainer"
          class="flex gap-4 overflow-x-auto pb-3 -mx-1 px-1 snap-x snap-mandatory scrollbar-hide"
          @scroll="updateArrows"
        >
          <ShareableCard
            v-for="item in currentItems"
            :key="item.id"
            :item="item"
            @select="openDrawer"
            @share="openDrawer"
          />
        </div>

        <!-- Right arrow (desktop) -->
        <button
          v-if="showRightArrow && !isMobile"
          @click="scrollRight"
          class="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 w-10 h-10 rounded-full bg-black/80 border border-white/20 text-white/80 hover:bg-black hover:text-white transition-all flex items-center justify-center shadow-lg"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Customize Drawer -->
    <ShareCustomizeDrawer
      v-model="drawerOpen"
      :item="activeItem"
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
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useShareablesFeed } from '~/composables/useShareablesFeed'
import { useShareKit } from '~/composables/useShareKit'
import ShareableCard from './ShareableCard.vue'
import ShareCustomizeDrawer from './ShareCustomizeDrawer.vue'

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

const emit = defineEmits(['select', 'share'])

// Create band data object for composable
const bandData = computed(() => ({
  id: props.bandId,
  slug: props.bandSlug,
  name: props.bandName,
  imageUrl: props.bandImageUrl,
  isBandNameInLogo: props.isBandNameInLogo,
}))

const {
  loading,
  refreshing,
  items,
  recaps,
  spikes,
  prompts,
  recommended,
  init,
  refresh,
} = useShareablesFeed(bandData)

const { copyToClipboard, webShare } = useShareKit()

// State
const activeTab = ref('recommended')
const drawerOpen = ref(false)
const activeItem = ref(null)
const toastMessage = ref('')
const scrollContainer = ref(null)
const showLeftArrow = ref(false)
const showRightArrow = ref(false)
const isMobile = ref(false)

// Tabs config
const tabs = computed(() => [
  { key: 'recommended', label: 'Recommended', count: recommended.value.length },
  { key: 'recaps', label: 'Recaps', count: recaps.value.length },
  { key: 'spikes', label: 'Spikes', count: spikes.value.length },
  { key: 'prompts', label: 'Prompts', count: prompts.value.length },
])

// Current items based on active tab
const currentItems = computed(() => {
  switch (activeTab.value) {
    case 'recaps':
      return recaps.value
    case 'spikes':
      return spikes.value
    case 'prompts':
      return prompts.value
    case 'recommended':
    default:
      return recommended.value
  }
})

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

// Open drawer with item
function openDrawer(item) {
  activeItem.value = item
  drawerOpen.value = true
  // Emit events for Corvana integration
  emit('select', item)
  emit('share', item)
}

// Quick share band
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

async function handleRefresh() {
  await refresh()
  showToast('Refreshed!')
}

// Scroll arrows
function updateArrows() {
  if (!scrollContainer.value) return
  const el = scrollContainer.value
  showLeftArrow.value = el.scrollLeft > 20
  showRightArrow.value = el.scrollLeft < el.scrollWidth - el.clientWidth - 20
}

function scrollLeft() {
  if (!scrollContainer.value) return
  scrollContainer.value.scrollBy({ left: -320, behavior: 'smooth' })
}

function scrollRight() {
  if (!scrollContainer.value) return
  scrollContainer.value.scrollBy({ left: 320, behavior: 'smooth' })
}

function checkMobile() {
  isMobile.value = window.innerWidth < 768
}

// Update arrows when items change
watch(currentItems, () => {
  nextTick(() => updateArrows())
})

onMounted(async () => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
  await init()
  nextTick(() => updateArrows())
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
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
