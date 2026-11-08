<template>
  <!-- Demo Controls Bar -->
  <div class="sticky top-0 z-50 bg-black/90 backdrop-blur border-b border-white/10">
    <div class="max-w-7xl mx-auto px-4 py-3">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <h1 class="text-lg font-bold text-white">Neon Avenue - Live Surface Demo</h1>
          <div class="flex items-center gap-2 text-xs text-white/60">
            <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Live Surface Active
          </div>
        </div>
        
        <div class="flex flex-wrap items-center gap-3">
          <!-- Feature Toggles -->
          <div class="flex items-center gap-2">
            <label class="text-xs text-white/70">NOW Banner:</label>
            <input
              v-model="showNowBanner"
              type="checkbox"
              class="w-3 h-3 rounded"
            >
          </div>
          
          <div class="flex items-center gap-2">
            <label class="text-xs text-white/70">Live Feed:</label>
            <input
              v-model="showLiveFeed"
              type="checkbox"
              class="w-3 h-3 rounded"
            >
          </div>
          
          <div class="flex items-center gap-2">
            <label class="text-xs text-white/70">Fan Toasts:</label>
            <input
              v-model="showFanToasts"
              type="checkbox"
              class="w-3 h-3 rounded"
            >
          </div>

          <div class="flex items-center gap-2">
            <label class="text-xs text-white/70">Demo Feed:</label>
            <input
              v-model="demoFeedEnabled"
              type="checkbox"
              class="w-3 h-3 rounded"
            >
          </div>

          <!-- Tour State Toggle -->
          <div class="flex items-center gap-2">
            <label class="text-xs text-white/70">Tour Mode:</label>
            <input
              v-model="forceTourMode"
              type="checkbox"
              class="w-3 h-3 rounded"
            >
          </div>

          <!-- V2 Features Toggle -->
          <div class="flex items-center gap-2">
            <label class="text-xs text-white/70">V2 Features:</label>
            <input
              v-model="showV2Features"
              type="checkbox"
              class="w-3 h-3 rounded"
            >
          </div>

          <!-- Simulate Activity -->
          <button
            @click="simulateActivity"
            class="px-3 py-1 bg-purple-500 hover:bg-purple-600 text-white text-xs rounded-lg font-medium transition-all"
          >
            Simulate Activity
          </button>

          <!-- Auto-run -->
          <div class="flex items-center gap-2">
            <input
              v-model="autoRun"
              type="checkbox"
              id="autoRun"
              class="w-3 h-3 rounded"
            >
            <label for="autoRun" class="text-xs text-white/70">Auto-run</label>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Simple Dev Indicator -->
  <div class="fixed bottom-2 left-2 z-[200] px-2 py-1 rounded bg-purple-600/90 text-white text-[10px] font-mono font-bold uppercase tracking-wider shadow-lg border border-purple-400/50">
    🔴 Live Surface: ON
  </div>

  <!-- Smart Link Demo Content (exact copy from SmartLinkDemo) -->
  <div class="bg-black min-h-screen text-white">
    <div class="w-full mx-auto">
      <!-- Hero Section with Overlay MomentBadges -->
      <div class="relative w-full overflow-hidden h-[35vh] md:h-[60vh]">
        <img
          :src="neonPoster"
          alt="Neon Avenue image"
          class="absolute inset-0 h-full w-full object-cover"
        />
        <div class="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
        
        <!-- MomentBadges Overlay - Positioned under MBQ header -->
        <div class="absolute top-8 left-6 z-30">
          <MomentBadges
            :is-on-tour="true"
            :has-new-release="true"
          />
        </div>
      </div>

      <!-- Band Name -->
      <div class="text-center text-white font-bold mt-4 text-4xl md:text-5xl">
        Neon Avenue
      </div>

      <!-- Bio -->
      <div class="flex justify-center mt-4">
        <div class="text-center text-white max-w-5xl">
          <p class="md:text-2xl leading-tight whitespace-pre-line">
            Indie pop for night drives and neon signs.
          </p>
          <p class="md:text-2xl leading-tight whitespace-pre-line mt-2">
            New single out now — tap play below.
          </p>
        </div>
      </div>

      <!-- ============================================ -->
      <!-- SMART LINK LIVE SURFACE COMPONENTS -->
      <!-- ============================================ -->

      <!-- V2: Show Day Header (only on SHOW_DAY mode) -->
      <div v-if="showV2Features && showShowDayHeader && nextEvent" class="w-full px-6 mt-4 md:max-w-[80vw] md:mx-auto">
        <ShowDayHeader
          :event="nextEvent"
          :has-pay-entry="true"
          @tickets="handleTicketClick"
          @pay-entry="scrollToSupport"
        />
      </div>

      <!-- NOW Banner -->
      <div v-if="showNowBanner && nowBannerContent" class="w-full px-6 mt-6 md:max-w-[80vw] md:mx-auto">
        <NowBanner
          :state="nowBannerState"
          :content="nowBannerContent"
          @cta-click="handleBannerCta"
          @scroll-to="handleScrollTo"
          @share="shareDrawerOpen = true"
        />
      </div>

      <!-- Continue Chip (for returning visitors) -->
      <div v-if="showContinueChip" class="w-full px-6 mt-4 md:max-w-[80vw] md:mx-auto">
        <ContinueChip
          :band-slug="'neon-avenue'"
          @continue="handleContinueAction"
        />
      </div>

      <!-- Live Feed Micro-signals -->
      <div v-if="showLiveFeed && hasLiveFeedItems" class="w-full px-6 mt-4 md:max-w-[80vw] md:mx-auto">
        <LiveFeed
          :feed-items="liveFeedItems"
          :primary-feed-item="primaryFeedItem"
          :has-feed-items="hasLiveFeedItems"
          display-mode="single"
        />
      </div>

      <!-- Main Content Wrapper -->
      <div class="w-full mt-4 px-6 md:max-w-[80vw] md:mx-auto">
        <!-- Featured Song -->
        <section class="mt-10">
          <h2 class="text-2xl md:text-3xl font-bold text-white mb-4">
            Featured Song
          </h2>

          <div class="w-full">
            <AudioPlayer
              :album="demoAlbum"
              :placeholder-image="neonPoster"
              @play="onAudioPlay"
              class="rounded-lg"
            />
          </div>
        </section>

        <!-- Featured Video -->
        <section class="mt-10">
          <h2 class="text-2xl md:text-3xl font-bold text-white mb-4">
            Featured Video
          </h2>

          <div
            v-if="!isVideoPlaying"
            class="rounded-lg bg-black overflow-hidden transition-transform duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0"
          >
            <button
              type="button"
              class="block w-full text-left"
              @click="playVideo"
            >
              <div class="relative aspect-video">
                <img
                  :src="singleVideoThumbnail"
                  alt="Neon Avenue video thumbnail"
                  class="absolute inset-0 h-full w-full object-cover"
                />
                <div class="absolute inset-0 bg-black/30"></div>
                <div class="absolute inset-0 flex items-center justify-center">
                  <div
                    class="h-12 w-12 rounded-full bg-white/10 backdrop-blur flex items-center justify-center border border-white/15"
                  >
                    <svg viewBox="0 0 24 24" class="h-6 w-6" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              </div>
            </button>
          </div>

          <div
            v-else
            class="embed-container rounded-lg overflow-hidden"
          >
            <iframe
              :src="singleVideoEmbedUrl + '?autoplay=1'"
              allow="autoplay; encrypted-media; fullscreen"
              allowfullscreen
            ></iframe>
          </div>
        </section>

        <!-- Website Link -->
        <section class="mt-10">
          <h2 class="text-2xl md:text-3xl font-bold text-white mb-2">
            Website Link
          </h2>
          <a
            href="#"
            class="text-purple-500 text-xl"
            @click.prevent
          >
            neonavenue.com
          </a>
        </section>

        <!-- Streaming Links -->
        <section class="mt-10">
          <h2 class="text-2xl md:text-3xl font-bold text-white mb-4">
            Streaming Links
          </h2>
          <template v-for="platform in streamingPlatforms" :key="platform.name">
            <a
              href="#"
              @click.prevent="handleLinkClick(platform)"
            >
              <button
                class="w-full mb-6 border border-white bg-transparent text-white flex items-center gap-3 font-semibold px-4 py-4 rounded-md min-w-0 text-lg md:text-xl hover:bg-white/5 active:bg-white/10 transition duration-200 ease-out hover:-translate-y-[1px] active:translate-y-0"
                type="button"
              >
                <img
                  :src="platform.img"
                  class="h-8 w-8 shrink-0"
                  :alt="platform.label"
                />
                <span class="min-w-0 truncate">{{ platform.label }}</span>
              </button>
            </a>
          </template>
        </section>

        <!-- Social Media -->
        <section class="mt-10">
          <h2 class="text-2xl md:text-3xl font-bold text-white mb-4">
            Social Media
          </h2>
          <template v-for="platform in socialPlatforms" :key="platform.name">
            <a
              href="#"
              @click.prevent="handleLinkClick(platform)"
            >
              <button
                class="w-full mb-6 border border-white bg-transparent text-white flex items-center gap-3 font-semibold px-4 py-4 rounded-md min-w-0 text-lg md:text-xl hover:bg-white/5 active:bg-white/10 transition duration-200 ease-out hover:-translate-y-[1px] active:translate-y-0"
                type="button"
              >
                <img
                  :src="platform.img"
                  class="h-8 w-8 shrink-0"
                  :alt="platform.label"
                />
                <span class="min-w-0 truncate">{{ platform.label }}</span>
              </button>
            </a>
          </template>
        </section>

        <!-- Upcoming Events -->
        <section class="mt-10">
          <h2 class="text-2xl md:text-3xl font-bold text-white mb-4">
            Upcoming Events
          </h2>

          <div
            v-if="nextEvent"
            class="border border-white/70 bg-black/10 rounded-2xl p-4 md:p-5 transition-transform duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0 hover:border-white"
          >
            <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div class="min-w-0">
                <div class="text-white/70 text-sm font-semibold">Next Show</div>
                <div class="text-2xl md:text-3xl font-bold text-white mt-1">
                  {{ nextEvent.city }}, {{ nextEvent.state }}
                </div>
                <div class="text-white/85 mt-1 font-semibold">
                  {{ nextEvent.venue }}
                </div>
                <div class="text-purple-300 mt-2 font-semibold">
                  {{ nextEvent.date }}
                </div>
              </div>

              <button
                type="button"
                class="rounded-xl border border-white bg-transparent font-semibold text-white hover:bg-white/5 active:bg-white/10 w-full md:w-auto px-4 py-3 transition duration-200 ease-out hover:-translate-y-[1px] active:translate-y-0"
              >
                Tickets
              </button>
            </div>

            <div class="mt-4 border-t border-white/15 pt-4">
              <div class="relative no-scrollbar overflow-x-auto">
                <table class="w-full table-fixed bg-transparent text-white rounded-md">
                  <thead>
                    <tr class="border-b border-purple-500 border-opacity-30">
                      <th class="px-2 py-2 text-left w-[7.5rem]">Date</th>
                      <th class="px-2 py-2 text-left">City</th>
                      <th class="px-2 py-2 text-left">Venue</th>
                      <th class="px-2 py-2 text-left w-[6rem]">Tickets</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="event in otherEvents"
                      :key="event.id"
                      class="border-b border-purple-500 border-opacity-20 hover:bg-purple-900 cursor-pointer"
                      @click.prevent
                    >
                      <td class="px-2 py-1 text-purple-400">
                        {{ event.date }}
                      </td>
                      <td class="px-2 py-1 text-purple-400 break-words">
                        {{ event.city }}, {{ event.state }}
                      </td>
                      <td class="px-2 py-1 text-purple-400 break-words">
                        {{ event.venue }}
                      </td>
                      <td class="px-2 py-1 text-purple-400">
                        <button type="button" class="text-purple-400">
                          View Event
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        <!-- Support Section -->
        <section ref="supportSection" class="mt-10 mb-20">
          <SupportModule 
            :band-name="'Neon Avenue'"
            :show-quick-tips="true"
            :quick-tip-amounts="[5, 10, 20]"
            :page-mode="'QUIET'"
            :payment-buttons="[]"
            @quick-tip="handleSupport"
          />
        </section>
      </div>
    </div>
  </div>

  <!-- Fan Toasts -->
  <div class="fixed bottom-4 right-4 z-50 space-y-2">
    <TransitionGroup name="toast">
      <div
        v-for="toast in activeToasts"
        :key="toast.id"
        class="bg-black/80 backdrop-blur text-white px-4 py-3 rounded-lg border border-white/20 shadow-lg"
      >
        <div class="flex items-center gap-3">
          <span class="text-lg">{{ toast.icon }}</span>
          <span class="text-sm font-medium">{{ toast.message }}</span>
        </div>
      </div>
    </TransitionGroup>
  </div>

  <!-- Share Drawer (Simple Modal) -->
  <div
    v-if="shareDrawerOpen"
    @click="shareDrawerOpen = false"
    class="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
  >
    <div
      @click.stop
      class="bg-gray-900 rounded-2xl border border-white/10 p-6 max-w-md w-full"
    >
      <h3 class="text-xl font-bold text-white mb-4">Share Neon Avenue</h3>
      <div class="space-y-3">
        <button
          @click="copyLink"
          class="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-all"
        >
          Copy Link
        </button>
        <button
          @click="shareDrawerOpen = false"
          class="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-all"
        >
          Close
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import AudioPlayer from '@/components/AudioPlayer.vue'
import NowBanner from '~/components/smartlink/NowBanner.vue'
import LiveFeed from '~/components/smartlink/LiveFeed.vue'
import ContinueChip from '~/components/smartlink/ContinueChip.vue'
import MomentBadges from '~/components/smartlink/MomentBadges.vue'
import ShowDayHeader from '~/components/smartlink/ShowDayHeader.vue'
import SupportModule from '~/components/smartlink/SupportModule.vue'
import FanToast from '~/components/smartlink/FanToast.vue'

// Import assets exactly like SmartLinkDemo
import neonPoster from '@/assets/neonposter.png'
import eventPoster from '@/assets/eventposter1.png'
import aisixPoster from '@/assets/aisix.webp'

import facebookIcon from '@/assets/facebookfree.png'
import instagramIcon from '@/assets/instagramfree.png'
import twitchIcon from '@/assets/twitchfree.png'
import appleMusicIcon from '@/assets/apple.svg'
import soundcloudIcon from '@/assets/soundcloudlast.png'
import deezerIcon from '@/assets/dezzer.svg'
import youtubeIcon from '@/assets/youtube-icon.svg'
import bandcampIcon from '@/assets/bandcamp.svg'
import spotifyIcon from '@/assets/spotify.svg'
import tiktokIcon from '@/assets/tiktok.png'
import twitterIcon from '@/assets/twitter.png'

import demoSongUrl from '@/assets/Turns Me On.mp3'

// Feature Toggles - Force everything ON for demo
const showNowBanner = ref(true)
const showLiveFeed = ref(true)
const showFanToasts = ref(true)
const showContinueChip = ref(true)
const showMomentBadges = ref(true)  // Enable to show tour week badge
const showShowDayHeader = ref(true)  // Enable show day header
const demoFeedEnabled = ref(true)
const autoRun = ref(false)
const forceTourMode = ref(true)  // Enable tour mode by default to show ON_TOUR banner

// V2 Features - Force ON
const showV2Features = ref(true)

// UI State
const shareDrawerOpen = ref(false)
const supportSection = ref(null)
const activeToasts = ref([])
const liveFeedItems = ref([])
let autoRunInterval = null

// Video and Audio State (from SmartLinkDemo)
const isVideoPlaying = ref(false)
const isAudioPlaying = ref(false)
let audioIdleTimeout = null
const demoVideoId = 'cUR4LFl_UME'

// Demo Data (exact copy from SmartLinkDemo)
const streamingPlatforms = [
  { name: 'spotify', img: spotifyIcon, label: 'Spotify' },
  { name: 'appleMusic', img: appleMusicIcon, label: 'Apple Music' },
  { name: 'youtube', img: youtubeIcon, label: 'YouTube' },
  { name: 'soundcloud', img: soundcloudIcon, label: 'SoundCloud' },
  { name: 'bandcamp', img: bandcampIcon, label: 'Bandcamp' },
  { name: 'deezer', img: deezerIcon, label: 'Deezer' },
]

const socialPlatforms = [
  { name: 'instagram', img: instagramIcon, label: 'Instagram' },
  { name: 'tiktok', img: tiktokIcon, label: 'TikTok' },
  { name: 'twitter', img: twitterIcon, label: 'Twitter' },
  { name: 'facebook', img: facebookIcon, label: 'Facebook' },
  { name: 'twitch', img: twitchIcon, label: 'Twitch' },
]

const events = [
  { id: 1, date: 'Fri · Feb 21', venue: 'The Echo', city: 'Los Angeles', state: 'CA' },
  { id: 2, date: 'Sat · Mar 08', venue: 'Brick & Mortar', city: 'San Francisco', state: 'CA' },
  { id: 3, date: 'Thu · Apr 10', venue: 'Mohawk', city: 'Austin', state: 'TX' },
]

// Computed (exact copy from SmartLinkDemo)
const nextEvent = computed(() => {
  return events.length ? events[0] : null
})

const otherEvents = computed(() => {
  return events.length > 1 ? events.slice(1) : []
})

const singleVideoEmbedUrl = computed(() => {
  return `https://www.youtube.com/embed/${demoVideoId}`
})

const singleVideoThumbnail = computed(() => {
  return aisixPoster
})

const demoAlbum = computed(() => {
  return {
    id: 1,
    attributes: {
      title: 'Turns Me On',
      artist: 'Neon Avenue',
      duration: 0,
      song: { data: { attributes: { url: demoSongUrl } } },
      cover: { data: { attributes: { url: neonPoster } } },
    },
  }
})

// Live Surface Computed
const nowBannerState = computed(() => {
  // Check for force tour mode
  if (forceTourMode.value) return 'ON_TOUR'
  // Check for show tonight (first event within 24h)
  if (nextEvent.value && nextEvent.value.date.includes('Feb 21')) return 'SHOW_TONIGHT'
  // Check for tour (2+ upcoming events)
  if (events.length >= 2) return 'ON_TOUR'
  return 'HEATING_UP'
})

const nowBannerContent = computed(() => {
  if (nowBannerState.value === 'SHOW_TONIGHT') {
    return {
      icon: '🎤',
      headline: 'Live Tonight in Los Angeles',
      subtext: 'The Echo • 8:00 PM',
      accent: 'purple',
      cta: 'Get Tickets',
      ctaLink: '#'
    }
  }
  
  if (nowBannerState.value === 'ON_TOUR') {
    return {
      icon: '',
      headline: 'On Tour',
      subtext: '3 upcoming shows across the west coast',
      accent: 'purple',
      cta: 'See Dates',
      ctaAction: 'scroll-to-events'
    }
  }
  
  return {
    icon: '🔥',
    headline: 'Heating Up',
    subtext: '3x activity spike this week',
    accent: 'orange'
  }
})

const hasLiveFeedItems = computed(() => liveFeedItems.value.length > 0)
const primaryFeedItem = computed(() => liveFeedItems.value[0] || null)

// Demo Feed Generation
function generateFeedItem() {
  const templates = [
    { icon: '👁️', copy: 'Page view burst', type: 'page_view' },
    { icon: '🎵', copy: 'Spotify link clicked', type: 'link_click' },
    { icon: '▶️', copy: 'Turns Me On played', type: 'song_play' },
    { icon: '👤', copy: 'New follower', type: 'new_follower' },
    { icon: '💜', copy: 'Support received', type: 'support' },
    { icon: '📍', copy: 'Los Angeles tuning in', type: 'city' }
  ]
  
  const template = templates[Math.floor(Math.random() * templates.length)]
  
  return {
    id: Date.now() + Math.random(),
    icon: template.icon,
    copy: template.copy,
    type: template.type,
    timestamp: Date.now()
  }
}

// Simulation
function simulateActivity() {
  if (!demoFeedEnabled.value) return
  
  const newItem = generateFeedItem()
  liveFeedItems.value.unshift(newItem)
  
  // Keep only last 5 items
  if (liveFeedItems.value.length > 5) {
    liveFeedItems.value = liveFeedItems.value.slice(0, 5)
  }
  
  // Show toast occasionally
  if (showFanToasts.value && Math.random() > 0.5) {
    showToast(getRandomToast())
  }
}

function getRandomToast() {
  const toasts = [
    { icon: '👤', message: 'Following! Stay in the loop.' },
    { icon: '💾', message: 'Saved. Welcome back anytime.' },
    { icon: '📤', message: 'Shared — thanks for spreading the word.' },
    { icon: '💜', message: 'You\'re supporting independent music.' }
  ]
  return toasts[Math.floor(Math.random() * toasts.length)]
}

function showToast(toast) {
  const toastWithId = { ...toast, id: Date.now() }
  activeToasts.value.push(toastWithId)
  
  setTimeout(() => {
    const index = activeToasts.value.findIndex(t => t.id === toastWithId.id)
    if (index > -1) {
      activeToasts.value.splice(index, 1)
    }
  }, 3000)
}

// Event Handlers (exact copy from SmartLinkDemo + Live Surface additions)
function playVideo() {
  isVideoPlaying.value = true
}

function onAudioPlay() {
  isAudioPlaying.value = true
  if (showFanToasts.value) {
    showToast({ icon: '🎵', message: 'Now playing: Turns Me On' })
  }
  if (audioIdleTimeout) window.clearTimeout(audioIdleTimeout)
  audioIdleTimeout = window.setTimeout(() => {
    isAudioPlaying.value = false
  }, 2000)
  simulateActivity()
}

function handleLinkClick(platform) {
  if (showFanToasts.value) {
    showToast({ icon: '🔗', message: `Opening ${platform.label}...` })
  }
  simulateActivity()
}

function handleSupport(amount) {
  if (showFanToasts.value) {
    showToast({ icon: '💜', message: `Thank you for supporting!` })
  }
  simulateActivity()
}

function handleCustomSupport() {
  if (showFanToasts.value) {
    showToast({ icon: '💜', message: 'Opening support page...' })
  }
}

function handleBannerCta(action) {
  console.log('Banner CTA:', action)
  if (action.type === 'link') {
    handleTicketClick()
  } else if (action.action === 'scroll-to-events') {
    document.querySelector('section:nth-of-type(6)')?.scrollIntoView({ behavior: 'smooth' })
  }
}

function handleScrollTo(section) {
  if (section === 'featured') {
    window.scrollTo({ top: 600, behavior: 'smooth' })
  } else if (section === 'events') {
    document.querySelector('section:nth-of-type(5)')?.scrollIntoView({ behavior: 'smooth' })
  }
}

function handleContinueAction(action) {
  console.log('Continue action:', action)
}

function handleTicketClick() {
  if (showFanToasts.value) {
    showToast({ icon: '🎫', message: 'Opening ticket page...' })
  }
}

function scrollToSupport() {
  supportSection.value?.scrollIntoView({ behavior: 'smooth' })
}

function copyLink() {
  navigator.clipboard.writeText(window.location.href)
  showToast({ icon: '📋', message: 'Link copied to clipboard!' })
  shareDrawerOpen.value = false
}

// Auto-run
watch(autoRun, (newValue) => {
  if (newValue) {
    autoRunInterval = setInterval(() => {
      simulateActivity()
    }, 3000)
  } else {
    if (autoRunInterval) {
      clearInterval(autoRunInterval)
      autoRunInterval = null
    }
  }
})

// Initialize
onMounted(() => {
  // Generate initial feed items
  if (demoFeedEnabled.value) {
    for (let i = 0; i < 3; i++) {
      liveFeedItems.value.push(generateFeedItem())
    }
  }
})

onUnmounted(() => {
  if (autoRunInterval) {
    clearInterval(autoRunInterval)
  }
  if (audioIdleTimeout) {
    window.clearTimeout(audioIdleTimeout)
  }
})
</script>

<style scoped>
.embed-container {
  position: relative;
  width: 100%;
  aspect-ratio: 16/9;
}

.embed-container iframe {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
}

.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.demo-cta {
  @apply rounded-xl border border-white/15 bg-white/5 px-3 py-3 font-semibold shadow-sm transition duration-200 ease-out hover:bg-white/10 active:scale-[0.98];
}

.demo-cta--accent {
  @apply border-violet-400/30 bg-gradient-to-r from-pink-500/80 to-violet-600/80 hover:from-pink-500 hover:to-violet-600;
}

.demo-link {
  @apply flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-3 shadow-sm transition duration-200 ease-out hover:bg-white/10 active:scale-[0.99];
}

.demo-chip {
  @apply rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm font-bold transition duration-200 ease-out hover:bg-white/10 active:scale-[0.98];
}

.toast-enter-active {
  transition: all 0.3s ease-out;
}

.toast-leave-active {
  transition: all 0.3s ease-in;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.toast-move {
  transition: transform 0.3s ease;
}
</style>
