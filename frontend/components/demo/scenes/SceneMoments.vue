<template>
  <div class="w-full">
    <!-- Subtle Demo Overlay -->
    <div class="flex items-center justify-between mb-4 px-2">
      <span class="text-white/40 text-xs font-medium uppercase tracking-wide">Demo: Shareables</span>
      <div class="flex items-center gap-2">
        <button
          type="button"
          class="px-3 py-1.5 text-xs text-white/60 hover:text-white border border-white/10 rounded-lg hover:bg-white/5 transition flex items-center gap-1.5"
          @click="spawnCard"
        >
          <span class="text-[10px]">+1</span>
          Spawn card
        </button>
        <button
          type="button"
          class="px-3 py-1.5 text-xs bg-purple-600/20 text-purple-300 border border-purple-400/30 rounded-lg hover:bg-purple-600/30 transition flex items-center gap-1.5"
          @click="nextScene"
        >
          Next
          <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Shareables Gallery -->
    <div class="max-w-5xl mx-auto">
      <!-- Section Header -->
      <div class="text-center mb-12">
        <h2 class="text-2xl md:text-3xl font-bold text-white mb-2">Shareable Moments</h2>
        <p class="text-white/60">Real-time analytics become share-ready content</p>
      </div>

      <!-- Cards Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-10">
        <div
          v-for="card in visibleCards"
          :key="card._instanceId || card.id"
          class="transform transition-all duration-300 hover:scale-[1.02] h-[420px] md:h-[440px] lg:h-[460px]"
        >
          <ShareableCard
            :item="card"
            size="compact"
            class="h-full"
            @select="openShareDrawer(card)"
            @share="openShareDrawer(card)"
          />
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="visibleCards.length === 0" class="text-center py-16 text-white/40">
        <div class="text-5xl mb-4">✨</div>
        <div class="text-lg">Click "Spawn card" to generate shareable moments</div>
      </div>

      <!-- Stats Row -->
      <div class="mt-8 grid grid-cols-4 gap-3">
        <div class="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
          <div class="text-2xl font-bold text-white tabular-nums">{{ visibleCards.length }}</div>
          <div class="text-white/50 text-xs">Cards Ready</div>
        </div>
        <div class="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
          <div class="text-2xl font-bold text-white tabular-nums">{{ displayStats.shares }}</div>
          <div class="text-white/50 text-xs">Shares</div>
        </div>
        <div class="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
          <div class="text-2xl font-bold text-purple-400 tabular-nums">{{ displayStats.visits }}</div>
          <div class="text-white/50 text-xs">Visits</div>
        </div>
        <div class="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
          <div class="text-2xl font-bold text-emerald-400 tabular-nums">1-tap</div>
          <div class="text-white/50 text-xs">Share Ready</div>
        </div>
      </div>

      <!-- Recent Shares Strip -->
      <div v-if="recentShares.length > 0" class="mt-6">
        <div class="text-white/40 text-xs uppercase tracking-wider mb-3">Recent Shares</div>
        <div class="flex gap-3 overflow-x-auto pb-2">
          <div
            v-for="(share, idx) in recentShares.slice(0, 3)"
            :key="idx"
            class="flex-shrink-0 bg-white/5 border border-white/10 rounded-xl px-4 py-3 flex items-center gap-3"
          >
            <span class="text-lg">{{ share.platformIcon }}</span>
            <div class="min-w-0">
              <div class="text-white text-sm font-medium truncate max-w-[180px]">{{ share.caption }}</div>
              <div class="text-white/50 text-xs">{{ share.timeAgo }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Share Drawer (real component) -->
    <ShareCustomizeDrawer
      v-model="isShareDrawerOpen"
      :item="selectedShareable"
    />

    <!-- Demo Toast -->
    <Teleport to="body">
      <Transition name="toast">
        <div
          v-if="toastMessage"
          class="fixed bottom-24 left-1/2 -translate-x-1/2 z-[10000] px-4 py-2.5 rounded-xl bg-emerald-600/90 border border-emerald-400/30 text-white text-sm font-medium shadow-xl backdrop-blur-sm flex items-center gap-2"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          {{ toastMessage }}
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useDemoShow } from '@/composables/useDemoShow'
import { useDemoState } from '@/composables/useDemoState'
import ShareableCard from '@/components/shareables/ShareableCard.vue'
import ShareCustomizeDrawer from '@/components/shareables/ShareCustomizeDrawer.vue'

const { goToScene } = useDemoShow()
const {
  demoStats,
  recentShares,
  recentShareables,
  recordShare,
  getNextCard,
} = useDemoState()

// Visible cards (max 6 for grid)
const visibleCards = ref([])

// Share drawer state
const isShareDrawerOpen = ref(false)
const selectedShareable = ref(null)

// Toast
const toastMessage = ref('')

// Computed stats for display
const displayStats = computed(() => ({
  shares: demoStats.value.shares,
  visits: demoStats.value.profileVisits,
}))

// Spawn a new card
function spawnCard() {
  const card = getNextCard()
  visibleCards.value.unshift(card)
  // Keep max 6 visible
  if (visibleCards.value.length > 6) {
    visibleCards.value.pop()
  }
}

// Open share drawer
function openShareDrawer(card) {
  selectedShareable.value = card
  isShareDrawerOpen.value = true
}

// Show toast
function showToast(message, duration = 2500) {
  toastMessage.value = message
  setTimeout(() => { toastMessage.value = '' }, duration)
}

// Simulate post (called when drawer closes after share action)
function simulatePost(platform = 'Instagram') {
  const caption = selectedShareable.value?.share?.captions?.hype || 'Shared a moment'
  
  // Use shared state to record the share
  recordShare({
    platform,
    caption,
    shareable: selectedShareable.value,
  })

  // Show toast
  showToast('Posted ✅')

  // Optionally spawn a SHARE_CHAIN card to show momentum
  if (Math.random() > 0.5) {
    setTimeout(() => {
      const card = getNextCard()
      visibleCards.value.unshift(card)
      if (visibleCards.value.length > 6) {
        visibleCards.value.pop()
      }
    }, 1000)
  }
}

// Watch drawer close to simulate post
let wasOpen = false
watch(isShareDrawerOpen, (isOpen) => {
  if (wasOpen && !isOpen && selectedShareable.value) {
    // Drawer just closed - simulate a post
    simulatePost()
  }
  wasOpen = isOpen
})

// Go to next scene
function nextScene() {
  goToScene(2)
}

// Initialize with 3 cards
onMounted(() => {
  for (let i = 0; i < 3; i++) {
    spawnCard()
  }
})
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, 10px);
}
</style>
