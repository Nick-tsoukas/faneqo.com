<template>
  <VerticalDeckFrame :recording-mode="recordingMode">
    <!-- Debug - which slide is active -->
    <div class="fixed top-4 right-4 z-[99999] text-red-500 text-xs bg-black p-2 border border-red-500">
      Active: {{ currentSlide.id }} / {{ currentSlide.component?.name || 'component' }}
    </div>
    
    <!-- Active Slide -->
    <template #slide>
      <!-- Full-bleed slides render directly without DeckSlide wrapper -->
      <component
        v-if="currentSlide.fullBleed && currentSlide.component"
        :is="currentSlide.component"
        :active="true"
        class="full-bleed-slide"
      />
      
      <!-- Normal slides use DeckSlide wrapper -->
      <DeckSlide
        v-else
        :active="true"
        :headline="currentSlide.headline"
        :subtitle="currentSlide.subtitle"
        :eyebrow="currentSlide.eyebrow"
        :intensity="currentSlide.intensity || 'medium'"
      >
        <template #visual v-if="currentSlide.component">
          <component :is="currentSlide.component" :active="true" />
        </template>
      </DeckSlide>
    </template>
    
    <!-- Progress -->
    <template #progress>
      <DeckProgress
        :current-slide-index="currentSlideIndex"
        :total-slides="slides.length"
        :slide-progress="slideProgress"
      />
    </template>
    
    <!-- Controls (hidden in recording mode) -->
    <template #controls>
      <DeckController
        :is-playing="isPlaying"
        :current-slide="currentSlideIndex + 1"
        :total-slides="slides.length"
        :recording-mode="recordingMode"
        @play="play"
        @pause="pause"
        @prev="prevSlide"
        @next="nextSlide"
        @restart="restart"
        @toggle-recording="toggleRecordingMode"
      />
    </template>
  </VerticalDeckFrame>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

// Core deck components
import VerticalDeckFrame from '~/components/decks/core/VerticalDeckFrame.vue'
import DeckSlide from '~/components/decks/core/DeckSlide.vue'
import DeckProgress from '~/components/decks/core/DeckProgress.vue'
import DeckController from '~/components/decks/core/DeckController.vue'

// New purpose-built 9:16 deck-native components
import SpotifyFirstOpeningScene from '~/components/decks/mbq/spotify-first/SpotifyFirstOpeningScene.vue'
import SpotifyFirstHookVisual from '~/components/decks/mbq/spotify-first/SpotifyFirstHookVisual.vue'
import SpotifyClarifyVisual from '~/components/decks/mbq/spotify-first/SpotifyClarifyVisual.vue'
import StreamIsNotFanVisual from '~/components/decks/mbq/spotify-first/StreamIsNotFanVisual.vue'
import ArtistHubMiniVisual from '~/components/decks/mbq/spotify-first/ArtistHubMiniVisual.vue'
import PlatformJourneyMiniVisual from '~/components/decks/mbq/spotify-first/PlatformJourneyMiniVisual.vue'
import FanCaptureMiniVisual from '~/components/decks/mbq/spotify-first/FanCaptureMiniVisual.vue'
import QRScanFanCaptureVisual from '~/components/decks/mbq/spotify-first/QRScanFanCaptureVisual.vue'
import FanListIntelligenceMiniVisual from '~/components/decks/mbq/spotify-first/FanListIntelligenceMiniVisual.vue'
import ShowGrowthMiniVisual from '~/components/decks/mbq/spotify-first/ShowGrowthMiniVisual.vue'
import AnalyticsMiniVisual from '~/components/decks/mbq/spotify-first/AnalyticsMiniVisual.vue'
import StreamFanOwnershipVisual from '~/components/decks/mbq/spotify-first/StreamFanOwnershipVisual.vue'
import FinalCTAVisual from '~/components/decks/mbq/spotify-first/FinalCTAVisual.vue'

// Deck configuration
const slides = [
  {
    id: 1,
    headline: '',
    subtitle: '',
    eyebrow: '',
    component: SpotifyFirstOpeningScene,
    duration: 12000,
    intensity: 'high',
    fullBleed: true  // Render directly without DeckSlide wrapper
  },
  {
    id: 2,
    headline: 'SPOTIFY IS GREAT FOR LISTENING.',
    subtitle: 'But it is not your fan list.',
    eyebrow: 'Clarification',
    component: SpotifyClarifyVisual,
    duration: 4000,
    intensity: 'medium'
  },
  {
    id: 3,
    headline: 'A STREAM IS NOT A RELATIONSHIP.',
    subtitle: 'Most fans click, listen, and disappear.',
    eyebrow: 'The Reality',
    component: StreamIsNotFanVisual,
    duration: 4500,
    intensity: 'medium'
  },
  {
    id: 4,
    headline: 'SEND THEM TO YOUR ARTIST HUB FIRST.',
    subtitle: 'Then guide them anywhere.',
    eyebrow: 'The Solution',
    component: ArtistHubMiniVisual,
    duration: 5000,
    intensity: 'medium'
  },
  {
    id: 5,
    headline: 'SPOTIFY, YOUTUBE, TICKETS, MERCH.',
    subtitle: 'One hub. Every destination. Your fan relationship first.',
    eyebrow: 'Platforms',
    component: PlatformJourneyMiniVisual,
    duration: 4500,
    intensity: 'low'
  },
  {
    id: 6,
    headline: 'EVERY VISIT CAN BECOME A FAN CAPTURE MOMENT.',
    subtitle: 'Emails. Follows. Check-ins. Real intent.',
    eyebrow: 'Fan Capture',
    component: FanCaptureMiniVisual,
    duration: 4500,
    intensity: 'medium'
  },
  {
    id: 7,
    headline: 'EVERY QR SCAN CAN BUILD YOUR AUDIENCE.',
    subtitle: 'Posters. Shows. Merch tables. Flyers.',
    eyebrow: 'QR Growth',
    component: QRScanFanCaptureVisual,
    duration: 4500,
    intensity: 'medium'
  },
  {
    id: 8,
    headline: 'NOW YOUR FAN LIST COMES ALIVE.',
    subtitle: 'Warm fans. Engaged fans. Superfan signals.',
    eyebrow: 'Intelligence',
    component: FanListIntelligenceMiniVisual,
    duration: 5000,
    intensity: 'medium'
  },
  {
    id: 9,
    headline: 'YOUR NEXT SHOW SHOULD GROW YOUR LIST.',
    subtitle: 'Not just your streams.',
    eyebrow: 'Show Growth',
    component: ShowGrowthMiniVisual,
    duration: 4500,
    intensity: 'medium'
  },
  {
    id: 10,
    headline: 'KNOW WHAT ACTUALLY CREATES FANS.',
    subtitle: 'Cities. Links. Songs. Videos. Shows.',
    eyebrow: 'Analytics',
    component: AnalyticsMiniVisual,
    duration: 5000,
    intensity: 'medium'
  },
  {
    id: 11,
    headline: 'SPOTIFY GETS THE STREAM.',
    subtitle: 'The artist should get the fan.',
    eyebrow: 'The Truth',
    component: StreamFanOwnershipVisual,
    duration: 4500,
    intensity: 'high'
  },
  {
    id: 12,
    headline: 'BUILD YOUR ARTIST PAGE FREE.',
    subtitle: 'Pro included for 30 days.',
    eyebrow: 'Get Started',
    component: FinalCTAVisual,
    duration: 5000,
    intensity: 'high'
  }
]

// State
const currentSlideIndex = ref(0)
const isPlaying = ref(false)
const recordingMode = ref(false)
const slideProgress = ref(0)
const slideTimer = ref(null)
const progressInterval = ref(null)

// Computed
const currentSlide = computed(() => slides[currentSlideIndex.value])

// Methods
function play() {
  if (isPlaying.value) return
  isPlaying.value = true
  startSlideTimer()
}

function pause() {
  isPlaying.value = false
  clearTimers()
}

function nextSlide() {
  if (currentSlideIndex.value < slides.length - 1) {
    currentSlideIndex.value++
    slideProgress.value = 0
    if (isPlaying.value) {
      clearTimers()
      startSlideTimer()
    }
  } else {
    // End of deck
    pause()
  }
}

function prevSlide() {
  if (currentSlideIndex.value > 0) {
    currentSlideIndex.value--
    slideProgress.value = 0
    if (isPlaying.value) {
      clearTimers()
      startSlideTimer()
    }
  }
}

function restart() {
  currentSlideIndex.value = 0
  slideProgress.value = 0
  play()
}

function toggleRecordingMode() {
  recordingMode.value = !recordingMode.value
}

function startSlideTimer() {
  clearTimers()
  
  const duration = currentSlide.value.duration
  const updateInterval = 50 // Update every 50ms
  
  // Progress interval
  progressInterval.value = setInterval(() => {
    slideProgress.value += (updateInterval / duration) * 100
  }, updateInterval)
  
  // Slide timer
  slideTimer.value = setTimeout(() => {
    nextSlide()
  }, duration)
}

function clearTimers() {
  if (slideTimer.value) {
    clearTimeout(slideTimer.value)
    slideTimer.value = null
  }
  if (progressInterval.value) {
    clearInterval(progressInterval.value)
    progressInterval.value = null
  }
}

// Keyboard controls
function handleKeydown(e) {
  switch (e.key) {
    case ' ':
      e.preventDefault()
      isPlaying.value ? pause() : play()
      break
    case 'ArrowRight':
      e.preventDefault()
      nextSlide()
      break
    case 'ArrowLeft':
      e.preventDefault()
      prevSlide()
      break
    case 'r':
    case 'R':
      restart()
      break
    case 'f':
    case 'F':
      toggleRecordingMode()
      break
  }
}

// Lifecycle
onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
  // Auto-play on mount
  setTimeout(() => play(), 500)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  clearTimers()
})

// Watch for slide changes
watch(currentSlideIndex, () => {
  slideProgress.value = 0
})
</script>

<style>
/* Page-level styles - prevent any scrolling */
html, body {
  margin: 0;
  padding: 0;
  overflow: hidden;
  height: 100%;
  width: 100%;
}

/* Prevent scroll on mobile */
body {
  position: fixed;
  overflow: hidden;
  touch-action: none;
}

/* Full-bleed slide - renders directly without DeckSlide wrapper */
.full-bleed-slide {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 10;
}
</style>
