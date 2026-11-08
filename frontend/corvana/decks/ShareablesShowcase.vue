<template>
  <div class="shareables-showcase" style="min-height: 400px; background: rgba(0,0,0,0.3); border-radius: 1.5rem; padding: 1.5rem;">
    <!-- Toast Notification -->
    <Transition name="toast">
      <div 
        v-if="toastMessage"
        class="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-black/90 border border-white/20 rounded-lg text-white text-sm shadow-lg"
      >
        {{ toastMessage }}
      </div>
    </Transition>
    
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-pink-400/30 flex items-center justify-center">
          <span class="text-2xl">✨</span>
        </div>
        <div>
          <h2 class="text-xl font-bold text-white">Fan Shareables</h2>
          <p class="text-white/50 text-sm">Moments that spread themselves</p>
        </div>
      </div>
      <div class="px-3 py-1.5 bg-pink-500/10 border border-pink-400/30 rounded-full">
        <span class="text-pink-400 text-xs font-semibold">Auto-Generated</span>
      </div>
    </div>

    <!-- Main Content Grid -->
    <div class="grid grid-cols-2 gap-4">
      <!-- LEFT: Shareable Cards Preview -->
      <div class="space-y-3">
        <div class="text-white/60 text-xs uppercase tracking-wider mb-2">Ready to Share</div>
        
        <!-- Shareable Card 1: City Moment -->
        <div 
          class="shareable-card group cursor-pointer"
          :class="{ 'ring-2 ring-pink-500': selectedCard === 1 }"
          @click="selectCard(1)"
        >
          <div class="relative aspect-square rounded-xl overflow-hidden mb-3">
            <img :src="neonPoster" alt="Share preview" class="w-full h-full object-cover" />
            <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div class="absolute bottom-3 left-3 right-3">
              <div class="text-white font-bold text-sm">Chicago is feeling it 🔥</div>
              <div class="text-white/70 text-xs mt-0.5">Neon Avenue • Live now</div>
            </div>
            <div class="absolute top-2 right-2 px-2 py-1 bg-black/60 backdrop-blur rounded-full text-[10px] text-white/80">
              📍 City Moment
            </div>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-white/50 text-xs">Tap to preview</span>
            <div class="flex gap-1">
              <div class="w-6 h-6 rounded-full bg-pink-500/20 flex items-center justify-center">
                <span class="text-xs">📸</span>
              </div>
              <div class="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                <span class="text-xs">📋</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Shareable Card 2: Support Moment -->
        <div 
          class="shareable-card group cursor-pointer"
          :class="{ 'ring-2 ring-pink-500': selectedCard === 2 }"
          @click="selectCard(2)"
        >
          <div class="relative aspect-square rounded-xl overflow-hidden mb-3">
            <img :src="neonPoster" alt="Share preview" class="w-full h-full object-cover" />
            <div class="absolute inset-0 bg-gradient-to-t from-purple-900/90 via-purple-900/40 to-transparent" />
            <div class="absolute bottom-3 left-3 right-3">
              <div class="text-white font-bold text-sm">Just supported the tour 💜</div>
              <div class="text-white/70 text-xs mt-0.5">Neon Avenue • $20 tip</div>
            </div>
            <div class="absolute top-2 right-2 px-2 py-1 bg-black/60 backdrop-blur rounded-full text-[10px] text-white/80">
              💜 Support Receipt
            </div>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-white/50 text-xs">Tap to preview</span>
            <div class="flex gap-1">
              <div class="w-6 h-6 rounded-full bg-pink-500/20 flex items-center justify-center">
                <span class="text-xs">📸</span>
              </div>
              <div class="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                <span class="text-xs">📋</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- RIGHT: Share Drawer Preview -->
      <div class="space-y-4">
        <div class="text-white/60 text-xs uppercase tracking-wider mb-2">Share Options</div>
        
        <!-- Mock Share Drawer -->
        <div class="share-drawer-preview">
          <div class="flex justify-center pt-2 pb-3">
            <div class="w-10 h-1 rounded-full bg-white/20" />
          </div>
          
          <div class="px-4 pb-3 border-b border-white/10">
            <h3 class="text-lg font-bold text-white">Share Neon Avenue</h3>
            <p class="text-white/50 text-xs">Spread the word</p>
          </div>

          <div class="p-4 space-y-3">
            <!-- Quick Share Button -->
            <button 
              @click="handleShare"
              class="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 text-white font-semibold text-sm hover:from-purple-500 hover:to-violet-500 transition-all"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share Now
            </button>

            <!-- Share Options Grid -->
            <div class="grid grid-cols-2 gap-2">
              <button @click="handleCopyLink" class="share-option cursor-pointer">
                <div class="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center mb-1">
                  <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <div class="text-white text-xs font-medium">Copy Link</div>
              </button>
              <button @click="handleCopyCaption" class="share-option cursor-pointer">
                <div class="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center mb-1">
                  <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <div class="text-white text-xs font-medium">Copy Caption</div>
              </button>
              <button @click="handleDownload" class="share-option cursor-pointer">
                <div class="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center mb-1">
                  <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </div>
                <div class="text-white text-xs font-medium">Download</div>
              </button>
              <button @click="handleInstagram" class="share-option instagram cursor-pointer">
                <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center mb-1">
                  <svg class="w-4 h-4 text-pink-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </div>
                <div class="text-pink-300 text-xs font-medium">Instagram</div>
              </button>
            </div>

            <!-- Facebook -->
            <button @click="handleFacebook" class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#1877F2]/10 border border-[#1877F2]/30 hover:bg-[#1877F2]/20 transition cursor-pointer">
              <div class="w-8 h-8 rounded-lg bg-[#1877F2]/20 flex items-center justify-center">
                <svg class="w-4 h-4 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </div>
              <div class="text-[#1877F2] text-xs font-medium">Share on Facebook</div>
            </button>
          </div>
        </div>

        <!-- Caption Preview -->
        <div class="bg-white/5 border border-white/10 rounded-xl p-3">
          <div class="text-white/40 text-[10px] uppercase tracking-wider mb-2">Auto-Generated Caption</div>
          <p class="text-white/80 text-sm leading-relaxed">
            "{{ currentCaption }}"
          </p>
          <div class="flex items-center gap-2 mt-2">
            <button class="text-purple-400 text-xs font-medium hover:text-purple-300">Copy</button>
            <span class="text-white/20">•</span>
            <button class="text-white/50 text-xs hover:text-white/70">Regenerate</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Stats -->
    <div class="mt-6 pt-4 border-t border-white/10">
      <div class="grid grid-cols-4 gap-3">
        <div class="text-center">
          <div class="text-2xl font-bold text-white">{{ stats.shares }}</div>
          <div class="text-white/40 text-[10px] uppercase tracking-wider">Shares Today</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-emerald-400">{{ stats.reach }}</div>
          <div class="text-white/40 text-[10px] uppercase tracking-wider">Est. Reach</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-pink-400">{{ stats.topPlatform }}</div>
          <div class="text-white/40 text-[10px] uppercase tracking-wider">Top Platform</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-purple-400">{{ stats.conversionRate }}%</div>
          <div class="text-white/40 text-[10px] uppercase tracking-wider">Share → Visit</div>
        </div>
      </div>
    </div>
  </div>

  <!-- MomentShareDrawer for fan moments -->
  <MomentShareDrawer
    :is-open="isMomentDrawerOpen"
    :band-id="1"
    band-slug="neon-avenue"
    band-name="Neon Avenue"
    band-image-url="/neonposter.png"
    :is-band-name-in-logo="false"
    :headline="currentMoment.headline"
    :subtext="currentMoment.subtext"
    :fan-position="currentMoment.fanPosition"
    :captions="currentMoment.captions"
    :moment-type="currentMoment.type"
    @close="isMomentDrawerOpen = false"
    @shared="handleShared"
  />
</template>

<script setup>
import { ref, computed } from 'vue'
import MomentShareDrawer from '~/components/band/MomentShareDrawer.vue'

// Use public path instead of import to avoid potential build issues
const neonPoster = '/neonposter.png'
const isMomentDrawerOpen = ref(false)

const selectedCard = ref(1)
const toastMessage = ref('')
const shareUrl = 'https://mbq.link/neon-avenue'

// Moment configurations for each card type
const moments = {
  1: {
    type: 'heating_up',
    headline: 'Chicago is feeling it',
    subtext: 'The city is tuning in right now',
    fanPosition: null,
    captions: {
      hype: "Chicago is on fire tonight 🔥 Neon Avenue is LIVE and the city is tuning in. Join the moment →",
      chill: "Something's happening in Chicago... Neon Avenue vibes are spreading 🌃",
      flex: "Caught the wave early 🌊 Chicago knows what's up with @NeonAvenue"
    }
  },
  2: {
    type: 'support_received',
    headline: 'I backed the band',
    subtext: 'Supporting independent music',
    fanPosition: 'Early Supporter #47',
    captions: {
      hype: "Just showed some love to @NeonAvenue 💜 Supporting independent artists hits different!",
      chill: "Dropped a tip for @NeonAvenue 🎵 Good music deserves support",
      flex: "Early supporter status unlocked 💜 Been on @NeonAvenue before the wave"
    }
  }
}

const currentMoment = computed(() => moments[selectedCard.value])
const currentCaption = computed(() => currentMoment.value.captions.hype)

const stats = ref({
  shares: 47,
  reach: '2.3K',
  topPlatform: 'IG',
  conversionRate: 34
})

function selectCard(id) {
  selectedCard.value = id
  isMomentDrawerOpen.value = true
}

function handleShared(data) {
  showToast(`Shared via ${data.channel}!`)
}

function showToast(message) {
  toastMessage.value = message
  setTimeout(() => { toastMessage.value = '' }, 2500)
}

function handleShare() {
  isMomentDrawerOpen.value = true
}

async function handleCopyLink() {
  try {
    await navigator.clipboard.writeText(shareUrl)
    showToast('Link copied!')
  } catch (e) {
    showToast('Could not copy link')
  }
}

async function handleCopyCaption() {
  try {
    await navigator.clipboard.writeText(currentCaption.value)
    showToast('Caption copied!')
  } catch (e) {
    showToast('Could not copy caption')
  }
}

function handleDownload() {
  isMomentDrawerOpen.value = true
}

function handleInstagram() {
  isMomentDrawerOpen.value = true
}

function handleFacebook() {
  isMomentDrawerOpen.value = true
}
</script>

<style scoped>
.shareables-showcase {
  background: linear-gradient(135deg, rgba(0,0,0,0.3) 0%, rgba(30,10,50,0.2) 100%);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 1.5rem;
  padding: 1.5rem;
}

.shareable-card {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 1rem;
  padding: 0.75rem;
  transition: all 0.3s ease;
}

.shareable-card:hover {
  background: rgba(255,255,255,0.06);
  border-color: rgba(255,255,255,0.15);
  transform: translateY(-2px);
}

.share-drawer-preview {
  background: linear-gradient(180deg, rgba(20,20,30,0.95) 0%, rgba(10,10,20,0.98) 100%);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 1.5rem;
  overflow: hidden;
}

.share-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.75rem;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 0.75rem;
  transition: all 0.2s;
}

.share-option:hover {
  background: rgba(255,255,255,0.08);
}

.share-option.instagram {
  background: linear-gradient(135deg, rgba(236,72,153,0.1) 0%, rgba(139,92,246,0.1) 100%);
  border-color: rgba(236,72,153,0.2);
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, 20px);
}
</style>
