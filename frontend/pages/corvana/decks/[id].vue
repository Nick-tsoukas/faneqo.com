<template>
  <div 
    ref="viewerEl"
    class="corvana-deck-viewer" 
    @mousemove="handlePointerActivity"
    @touchstart.passive="handleTouchStart"
    @touchend="handleTouchEnd"
    @touchcancel="handleTouchCancel"
    :class="{ 'reduce-motion': settings.reduceMotion }"
  >
    <!-- Slide Content with Transitions -->
    <Transition :name="settings.reduceMotion ? '' : 'slide-fade'" mode="out-in">
      <div
        :key="`${currentSlideIndex}-${replayCount}`"
        class="slide-container"
        :class="{ 'is-full-bleed': currentSlide?.content?.fullBleed }"
      >
        
        <!-- Chapter Label (shown on all slides) -->
        <div v-if="currentSlide?.chapter" class="chapter-label">
          {{ currentSlide.chapter }}
        </div>

        <!-- Narrative Slide -->
        <div v-if="currentSlide?.type === 'narrative'" class="narrative-slide">
          <h1 class="narrative-headline">{{ currentSlide.content.headline }}</h1>
          <h2 v-if="currentSlide.content.subhead" class="narrative-subhead">{{ currentSlide.content.subhead }}</h2>
          <p class="narrative-body">{{ currentSlide.content.body }}</p>
          <p v-if="currentSlide.content.cta" class="narrative-cta">{{ currentSlide.content.cta }}</p>
        </div>

        <!-- Mobile View Slide -->
        <div v-else-if="currentSlide?.type === 'mobile_view'" class="mobile-view-slide">
          
          <!-- Template Switcher (only for SmartLinkSurface) -->
          <div v-if="currentSlide?.content?.componentKey === 'SmartLinkSurface'" class="template-switcher">
            <button
              v-for="opt in templateOptions"
              :key="opt.key"
              @click="selectedTemplate = opt.key"
              :class="['template-btn', { active: selectedTemplate === opt.key }]"
            >
              {{ opt.label }}
            </button>
          </div>

          <MobileViewport>
            <component 
              v-if="currentSlide?.content?.componentKey === 'SmartLinkSurface'"
              :is="templateComponent"
              @share="handleNativeShare"
              @follow="handleFollow"
              @quick-tip="handleQuickTip"
              @link-click="handleLinkClick"
            />
            <component 
              v-else
              :is="resolvedComponent"
              v-bind="componentProps"
              @share="handleNativeShare"
              @follow="handleFollow"
              @quick-tip="handleQuickTip"
              @link-click="handleLinkClick"
            />
          </MobileViewport>
        </div>

        <!-- Dashboard View Slide -->
        <div v-else-if="currentSlide?.type === 'dashboard_view'" class="dashboard-view-slide">
          <div
            class="dashboard-container"
            :class="{ 'is-full-bleed': currentSlide?.content?.fullBleed }"
          >
            <component 
              v-if="resolvedComponent"
              :is="resolvedComponent"
              v-bind="componentProps"
            />
            <div v-else class="text-white/50 text-center py-8">
              Component not found: {{ currentSlide?.content?.componentKey }}
            </div>
          </div>
        </div>

        <!-- Fallback -->
        <div v-else class="fallback-slide">
          No slide data or unknown type
        </div>
      </div>
    </Transition>

    <!-- Navigation Controls -->
    <Transition name="fade">
      <div
        v-show="!isPresentMode || showChrome"
        class="deck-controls"
        role="navigation"
        aria-label="Deck navigation"
        @mouseenter="holdChrome"
        @mouseleave="releaseChrome"
        @focusin="holdChrome"
        @focusout="releaseChrome"
      >
        <button
          type="button"
          @click="previousSlide"
          :disabled="isFirstSlide"
          class="nav-button prev"
          aria-label="Previous slide"
        >
          <svg class="nav-button__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <span class="progress-text" aria-live="polite">
          {{ String(currentSlideIndex + 1).padStart(2, '0') }}
          <span class="progress-text__sep">/</span>
          {{ String(totalSlides).padStart(2, '0') }}
        </span>

        <button
          type="button"
          @click="nextSlide"
          :disabled="isLastSlide"
          class="nav-button next"
          aria-label="Next slide"
        >
          <svg class="nav-button__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </Transition>

    <!-- Top Controls -->
    <Transition name="fade">
      <div
        v-show="!isPresentMode || showChrome"
        class="top-controls"
        @mouseenter="holdChrome"
        @mouseleave="releaseChrome"
        @focusin="holdChrome"
        @focusout="releaseChrome"
      >
        <button
          type="button"
          @click="replayScene"
          class="present-button"
          aria-label="Replay this slide (R)"
          title="Replay this slide (R)"
        >
          <svg class="top-controls__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 12a8 8 0 1 0 2.3-5.6M4 4v4h4" />
          </svg>
          <span class="top-controls__label">Replay</span>
        </button>

        <button
          type="button"
          @click="togglePresentMode"
          class="present-button"
          :aria-pressed="isPresentMode"
          :aria-label="isPresentMode ? 'Exit presentation mode' : 'Enter presentation mode'"
        >
          <svg v-if="!isPresentMode" class="top-controls__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 8V6a2 2 0 012-2h2M16 4h2a2 2 0 012 2v2M4 16v2a2 2 0 002 2h2M20 16v2a2 2 0 01-2 2h-2" />
          </svg>
          <svg v-else class="top-controls__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 14v2a2 2 0 002 2h2M16 20h2a2 2 0 002-2v-2M4 10V6a2 2 0 012-2h2M16 4h2a2 2 0 012 2v4" />
          </svg>
          <span class="top-controls__label">{{ isPresentMode ? 'Exit' : 'Present' }}</span>
        </button>

        <button
          type="button"
          @click="exitDeck"
          class="exit-button"
          aria-label="Exit deck"
        >
          <svg class="top-controls__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 7l-10 10M7 7l10 10" />
          </svg>
        </button>
      </div>
    </Transition>

    <!-- Share Preview Overlay -->
    <SharePreviewOverlay
      :open="shareOverlayOpen"
      :item="selectedShareable"
      :caption-suggestions="shareCaptionSuggestions"
      @close="closeShareOverlay"
      @share="handleShare"
    />

    <!-- Share Drawer -->
    <ShareDrawer
      :is-open="shareDrawerOpen"
      :band-id="1"
      band-slug="neon-avenue"
      band-name="Neon Avenue"
      :band-image-url="bandImageDataUrl || 'https://picsum.photos/seed/neonavenue/1080/1080.jpg'"
      @close="shareDrawerOpen = false"
    />

    <!-- Fullscreen Present Mode - just adds class, content is already visible -->
    <div v-if="isPresentMode" class="present-mode-active" />
  </div>
</template>

<script setup>
definePageMeta({
  layout: false
})

import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { getDeckBySlug, FLAGSHIP_DECK_SLUG, FLAGSHIP_DECK_PATH } from '~/corvana/decks/deckIndex.js'
import { resolveComponent as getRegistryComponent } from '~/corvana/decks/componentRegistry.js'
import MobileViewport from '~/corvana/decks/MobileViewport.vue'
import SharePreviewOverlay from '~/corvana/decks/SharePreviewOverlay.vue'
import ShareDrawer from '~/components/band/ShareDrawer.vue'
import BandPageStyleDefault from '~/components/band/BandPageStyleDefault.vue'
import BandPageStyleCompact from '~/components/band/BandPageStyleCompact.vue'
import BandPageStyleBold from '~/components/band/BandPageStyleBold.vue'

// /presentation renders this viewer with the flagship slug instead of a route param
const props = defineProps({
  deckSlug: { type: String, default: '' },
})

const route = useRoute()
const router = useRouter()

// State
const currentSlideIndex = ref(0)
const isPresentMode = ref(false)
const shareOverlayOpen = ref(false)
const selectedShareable = ref(null)
const shareCaptionSuggestions = ref([])
const shareDrawerOpen = ref(false)
const bandImageDataUrl = ref(null)
const selectedTemplate = ref('compact') // 'default', 'compact', 'bold'

// Template options
const templateOptions = [
  { key: 'default', label: 'Default' },
  { key: 'compact', label: 'Compact' },
  { key: 'bold', label: 'Bold' }
]

// Get the selected template component
const templateComponent = computed(() => {
  switch (selectedTemplate.value) {
    case 'default': return BandPageStyleDefault
    case 'bold': return BandPageStyleBold
    case 'compact':
    default: return BandPageStyleCompact
  }
})

// Settings from localStorage
const settings = ref({
  reduceMotion: false,
  useProgressDots: true
})

// Load settings
onMounted(() => {
  try {
    const saved = JSON.parse(localStorage.getItem('corvana_settings') || '{}')
    settings.value = { ...settings.value, ...saved }
  } catch (e) {
    // Use defaults
  }
  currentSlideIndex.value = slideIndexFromQuery()
  syncSlideQuery(currentSlideIndex.value)
})

// Presenter UI state
const showChrome = ref(false)
const chromeTimeout = ref(null)
const viewerEl = ref(null)

const SWIPE_THRESHOLD_PX = 56
const SWIPE_DOMINANCE = 1.25
const CHROME_IDLE_MS = 2600

const touchGesture = {
  active: false,
  startX: 0,
  startY: 0,
  locked: null, // 'x' | 'y' | null
}

function revealChrome() {
  showChrome.value = true
  clearTimeout(chromeTimeout.value)
  chromeTimeout.value = setTimeout(() => {
    showChrome.value = false
  }, CHROME_IDLE_MS)
}

function handlePointerActivity() {
  revealChrome()
}

function holdChrome() {
  showChrome.value = true
  clearTimeout(chromeTimeout.value)
}

function releaseChrome() {
  clearTimeout(chromeTimeout.value)
  chromeTimeout.value = setTimeout(() => {
    showChrome.value = false
  }, CHROME_IDLE_MS)
}

function isInteractiveTouchTarget(target) {
  if (!(target instanceof Element)) return false
  return Boolean(
    target.closest(
      'button, a, input, textarea, select, [role="button"], [role="tab"], [contenteditable="true"], .deck-controls, .top-controls, .share-preview-overlay, .share-drawer'
    )
  )
}

function resetTouchGesture() {
  touchGesture.active = false
  touchGesture.locked = null
}

function handleTouchStart(event) {
  revealChrome()
  if (shareOverlayOpen.value || shareDrawerOpen.value) {
    resetTouchGesture()
    return
  }
  if (event.touches.length !== 1 || isInteractiveTouchTarget(event.target)) {
    resetTouchGesture()
    return
  }

  const touch = event.touches[0]
  touchGesture.active = true
  touchGesture.startX = touch.clientX
  touchGesture.startY = touch.clientY
  touchGesture.locked = null
}

function handleTouchMove(event) {
  if (!touchGesture.active || event.touches.length !== 1) return

  const touch = event.touches[0]
  const dx = touch.clientX - touchGesture.startX
  const dy = touch.clientY - touchGesture.startY

  if (!touchGesture.locked) {
    if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return

    if (Math.abs(dx) > Math.abs(dy) * SWIPE_DOMINANCE) {
      touchGesture.locked = 'x'
    } else if (Math.abs(dy) > Math.abs(dx) * SWIPE_DOMINANCE) {
      touchGesture.locked = 'y'
    } else {
      return
    }
  }

  // Own horizontal swipes so the browser doesn't steal them for back-nav.
  // Vertical stays free so industry slides can still scroll.
  if (touchGesture.locked === 'x' && event.cancelable) {
    event.preventDefault()
  }
}

function handleTouchEnd(event) {
  if (!touchGesture.active) return

  const touch = event.changedTouches?.[0]
  const wasHorizontal = touchGesture.locked === 'x'
  const startX = touchGesture.startX
  resetTouchGesture()

  if (!touch || !wasHorizontal) return

  const dx = touch.clientX - startX
  if (Math.abs(dx) < SWIPE_THRESHOLD_PX) return

  if (dx < 0) nextSlide()
  else previousSlide()
}

function handleTouchCancel() {
  resetTouchGesture()
}

function slideIndexFromQuery() {
  const raw = Number(route.query.slide)
  if (!Number.isInteger(raw) || raw < 1) return 0
  return Math.min(raw - 1, Math.max(deck.value.slides.length - 1, 0))
}

function syncSlideQuery(index) {
  const slide = String(index + 1)
  if (String(route.query.slide) === slide) return
  router.replace({ query: { ...route.query, slide } })
}

// Keep the URL on the live slide
watch(currentSlideIndex, (index) => {
  syncSlideQuery(index)
})

// Get deck data using deckIndex
const deck = computed(() => {
  const deckId = props.deckSlug || route.params.id
  return getDeckBySlug(deckId)
})

// Start on the linked slide during server render too, so a ?slide= link
// never flashes slide 1 before switching (mount still re-syncs below)
currentSlideIndex.value = slideIndexFromQuery()

// Current slide
const currentSlide = computed(() => {
  return deck.value.slides[currentSlideIndex.value]
})

// Resolve component for mobile_view and dashboard_view slides
const resolvedComponent = computed(() => {
  if (currentSlide.value?.type === 'mobile_view' || currentSlide.value?.type === 'dashboard_view') {
    const componentKey = currentSlide.value.content.componentKey
    console.log('[DeckViewer] Resolving component:', componentKey)
    try {
      const registry = getRegistryComponent(componentKey)
      console.log('[DeckViewer] Registry found:', !!registry, !!registry?.component)
      return registry.component
    } catch (e) {
      console.error('[DeckViewer] Error resolving component:', componentKey, e)
      return null
    }
  }
  return null
})

// Fetch the neighbouring scenes' code while this one plays, so a slide change
// never waits on a network request at the transition boundary
function prefetchNeighbours(index) {
  if (typeof window === 'undefined') return
  for (const i of [index + 1, index - 1]) {
    const key = deck.value.slides[i]?.content?.componentKey
    if (!key) continue
    try {
      getRegistryComponent(key)?.component?.__asyncLoader?.().catch(() => {})
    } catch {}
  }
}
onMounted(() => prefetchNeighbours(currentSlideIndex.value))
watch(currentSlideIndex, prefetchNeighbours)

// Build props for component
const componentProps = computed(() => {
  if (currentSlide.value?.type === 'mobile_view' || currentSlide.value?.type === 'dashboard_view') {
    try {
      const registry = getRegistryComponent(currentSlide.value.content.componentKey)
      const demoDataKey = currentSlide.value.content.demoDataKey
      return demoDataKey ? registry.buildProps(demoDataKey) : registry.buildProps()
    } catch (e) {
      console.error('Error building props:', e)
      return {}
    }
  }
  return {}
})

const currentSlideContent = computed(() => currentSlide.value?.content)

// Navigation
const totalSlides = computed(() => deck.value.slides.length)
const isFirstSlide = computed(() => currentSlideIndex.value === 0)
const isLastSlide = computed(() => currentSlideIndex.value === totalSlides.value - 1)

function nextSlide() {
  if (!isLastSlide.value) {
    currentSlideIndex.value++
  }
}

function previousSlide() {
  if (!isFirstSlide.value) {
    currentSlideIndex.value--
  }
}

function goToSlide(index) {
  currentSlideIndex.value = index
}

// Controls
function togglePresentMode() {
  isPresentMode.value = !isPresentMode.value
  if (isPresentMode.value) {
    enterFullscreen()
  } else {
    exitFullscreen()
  }
}

function exitDeck() {
  router.push('/')
}

// Fullscreen
function enterFullscreen() {
  const elem = document.documentElement
  if (elem.requestFullscreen) {
    elem.requestFullscreen()
  } else if (elem.webkitRequestFullscreen) {
    elem.webkitRequestFullscreen()
  } else if (elem.msRequestFullscreen) {
    elem.msRequestFullscreen()
  }
}

function exitFullscreen() {
  if (document.exitFullscreen) {
    document.exitFullscreen()
  } else if (document.webkitExitFullscreen) {
    document.webkitExitFullscreen()
  } else if (document.msExitFullscreen) {
    document.msExitFullscreen()
  }
}

// Shareable handling
function handleShareableSelect(item) {
  selectedShareable.value = item
  // Get caption suggestions from demo data
  shareCaptionSuggestions.value = ['🔥 Chicago is feeling the heat!', '🎵 Indie pop scene is alive', '💜 Supporting independent music matters', '📍 Chicago loves Neon Avenue']
  shareOverlayOpen.value = true
}

function closeShareOverlay() {
  shareOverlayOpen.value = false
  selectedShareable.value = null
  shareCaptionSuggestions.value = []
}

function handleShare(item) {
  console.log('Share item:', item)
  // Implement share functionality
  closeShareOverlay()
}

// Helper to convert image URL to data URL
async function convertImageToDataUrl(url) {
  try {
    const response = await fetch(url)
    if (!response.ok) return null
    const blob = await response.blob()
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch (err) {
    console.warn('[convertImageToDataUrl] Failed:', err.message)
    return null
  }
}

// Helper to convert relative image URLs to full URLs
function getFullImageUrl(url) {
  if (!url) return null
  if (url.startsWith('http')) return url
  return `https://musicbizqr.com${url}`
}

// Preload band image as data URL
onMounted(async () => {
  const imageUrl = getFullImageUrl('/neonposter.png')
  if (imageUrl) {
    const dataUrl = await convertImageToDataUrl(imageUrl)
    if (dataUrl) {
      bandImageDataUrl.value = dataUrl
    }
  }
})

// Native share handler for band page share button
function handleNativeShare() {
  shareDrawerOpen.value = true
}

// Follow handler
function handleFollow() {
  console.log('Follow clicked')
  alert('Following Neon Avenue!')
}

// Quick tip handler
function handleQuickTip(amount) {
  console.log('Quick tip:', amount)
  alert(`Thank you for your $${amount} tip!`)
}

// Link click handler
function handleLinkClick(link) {
  console.log('Link clicked:', link)
  if (link.url) {
    window.open(link.url, '_blank')
  }
}

// Keyboard navigation
function handleKeydown(event) {
  if (event.target instanceof HTMLElement) {
    const tag = event.target.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA' || event.target.isContentEditable) return
  }

  switch (event.key) {
    case 'ArrowLeft':
    case 'PageUp':
    case 'p':
    case 'P':
      event.preventDefault()
      previousSlide()
      revealChrome()
      break
    case 'ArrowRight':
    case ' ':
    case 'PageDown':
    case 'n':
    case 'N':
      event.preventDefault()
      nextSlide()
      revealChrome()
      break
    case 'r':
    case 'R':
      if (event.metaKey || event.ctrlKey) return
      replayScene()
      break
    case 'Escape':
      if (isPresentMode.value) {
        togglePresentMode()
      }
      break
  }
}

// Replay: remounting the current slide restarts its entrance from a clean state
const replayCount = ref(0)
function replayScene() {
  replayCount.value += 1
}

// Lifecycle
onMounted(() => {
  window.addEventListener('keydown', handleKeydown)

  // Non-passive touchmove so horizontal swipes can call preventDefault on iOS.
  viewerEl.value?.addEventListener('touchmove', handleTouchMove, { passive: false })
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  viewerEl.value?.removeEventListener('touchmove', handleTouchMove)
  clearTimeout(chromeTimeout.value)
})

useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
  ],
  // The flagship's public, shareable address is /presentation
  link: computed(() => (
    (props.deckSlug || route.params.id) === FLAGSHIP_DECK_SLUG
      ? [{ rel: 'canonical', href: `https://faneqo.com${FLAGSHIP_DECK_PATH}` }]
      : []
  )),
  // Lets the unscoped rule below hide dev-only overlays while a deck is open
  bodyAttrs: { class: 'corvana-deck-open' },
})
</script>

<style>
/* Nuxt DevTools floats over the bottom of every slide in dev; it never ships to production */
body.corvana-deck-open #nuxt-devtools-container { display: none; }
</style>

<style scoped>
.corvana-deck-viewer {
  position: relative;
  width: 100%;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  background: linear-gradient(135deg, #000 0%, #1a1a2e 50%, #0f0f1e 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  touch-action: pan-y;
  overscroll-behavior: contain;
}

/* Slide Container */
.slide-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-bottom: 7rem; /* Space for bottom controls */
}

/* Chapter Label */
.chapter-label {
  position: absolute;
  top: 2rem;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: rgba(139, 92, 246, 0.8);
  background: rgba(139, 92, 246, 0.1);
  border: 1px solid rgba(139, 92, 246, 0.2);
  padding: 0.5rem 1rem;
  border-radius: 2rem;
  z-index: 10;
}

/* Narrative Slide */
.narrative-slide {
  width: 100%;
  max-width: 900px;
  padding: 2rem;
  text-align: center;
}

.narrative-headline {
  font-size: clamp(2.5rem, 6vw, 4.5rem);
  font-weight: 700;
  margin-bottom: 1.5rem;
  background: linear-gradient(135deg, #ec4899, #8b5cf6, #10b981);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1.1;
}

.narrative-subhead {
  font-size: clamp(1.2rem, 3vw, 1.8rem);
  font-weight: 500;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 2rem;
}

.narrative-body {
  font-size: clamp(1.1rem, 2.5vw, 1.4rem);
  color: rgba(255, 255, 255, 0.5);
  line-height: 1.6;
  max-width: 700px;
  margin: 0 auto;
}

.narrative-cta {
  margin-top: 3rem;
  font-size: 1.1rem;
  font-weight: 600;
  color: #10b981;
  padding: 1rem 2rem;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: 0.75rem;
  display: inline-block;
}

/* Mobile View Slide */
.mobile-view-slide {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 100vh;
  padding: 2rem;
  padding-top: 5rem;
  padding-bottom: 8rem; /* Space for bottom controls */
  gap: 1.5rem;
}

/* Template Switcher */
.template-switcher {
  position: fixed;
  top: 1rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 0.5rem;
  background: rgba(0, 0, 0, 0.9);
  padding: 0.75rem;
  border-radius: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  z-index: 10000;
  backdrop-filter: blur(10px);
}

.template-btn {
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  border: none;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
}

.template-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.template-btn.active {
  background: linear-gradient(to right, #8b5cf6, #10b981);
  color: #fff;
}

/* Dashboard View Slide */
.dashboard-view-slide {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 100vh;
  padding: 2rem;
  padding-top: 5rem;
  padding-bottom: 8rem; /* Space for bottom controls */
}

.dashboard-container {
  width: 100%;
  max-width: 1200px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1.5rem;
  padding: 2rem;
  backdrop-filter: blur(10px);
  max-height: calc(100vh - 10rem);
  overflow-y: auto;
}

/* The current flagship deck is a real product presentation, not a dashboard
   dropped inside a glass card. Other Corvana decks keep the legacy frame. */
.slide-container.is-full-bleed {
  padding-bottom: 0;
  word-spacing: normal;
}

.slide-container.is-full-bleed .chapter-label {
  display: none;
}

.slide-container.is-full-bleed .dashboard-view-slide {
  height: 100%;
  min-height: 100%;
  padding: 0;
}

.dashboard-container.is-full-bleed {
  width: 100%;
  height: 100%;
  max-width: none;
  max-height: none;
  overflow: hidden;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: #050506;
  backdrop-filter: none;
}

/* Fallback */
.fallback-slide {
  color: white;
  padding: 50px;
  font-size: 24px;
}

.deck-controls {
  position: fixed;
  bottom: calc(1.25rem + env(safe-area-inset-bottom, 0px));
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.35rem 0.5rem;
  border-radius: 2rem;
  background: rgba(5, 5, 6, 0.42);
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  z-index: 200;
}

.nav-button {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.1rem;
  height: 2.1rem;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 50%;
  padding: 0;
  color: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease, opacity 0.2s ease;
}

.nav-button__icon {
  width: 0.9rem;
  height: 0.9rem;
}

.nav-button__label {
  display: none;
}

.nav-button:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.32);
  color: #fff;
}

.nav-button:disabled {
  opacity: 0.25;
  cursor: not-allowed;
}

.progress-text {
  min-width: 3.2rem;
  color: rgba(255, 255, 255, 0.85);
  font-size: 0.75rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.04em;
  text-align: center;
}

.progress-text__sep {
  opacity: 0.4;
  margin: 0 0.15rem;
}

.top-controls {
  position: fixed;
  top: calc(0.9rem + env(safe-area-inset-top, 0px));
  right: calc(0.9rem + env(safe-area-inset-right, 0px));
  display: flex;
  gap: 0.35rem;
  z-index: 9998;
}

.present-button,
.exit-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  height: 1.9rem;
  padding: 0 0.65rem;
  background: rgba(5, 5, 6, 0.42);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.45rem;
  color: rgba(255, 255, 255, 0.82);
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.top-controls__icon {
  width: 0.8rem;
  height: 0.8rem;
  flex: 0 0 auto;
}

.present-button:hover,
.exit-button:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.18);
  color: #fff;
}

.present-mode-active {
  display: none;
}

/* With a mouse, the controls step back until they're wanted */
@media (hover: hover) {
  .deck-controls,
  .top-controls {
    opacity: 0.5;
    transition: opacity 0.25s ease;
  }

  .deck-controls:hover,
  .deck-controls:focus-within,
  .top-controls:hover,
  .top-controls:focus-within {
    opacity: 1;
  }
}

/* Slide Transitions */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.slide-fade-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.slide-fade-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

/* Full-bleed scenes choreograph their own entrance; the player only cross-fades them */
.slide-fade-enter-from.is-full-bleed,
.slide-fade-leave-to.is-full-bleed {
  transform: none;
}

/* Fade Transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Reduce Motion */
.reduce-motion .slide-fade-enter-active,
.reduce-motion .slide-fade-leave-active,
.reduce-motion .fade-enter-active,
.reduce-motion .fade-leave-active {
  transition: none;
}

.reduce-motion .slide-fade-enter-from,
.reduce-motion .slide-fade-leave-to {
  transform: none;
}

/* Responsive */
@media (max-width: 768px) {
  .deck-controls {
    left: max(0.65rem, env(safe-area-inset-left, 0px));
    right: max(0.65rem, env(safe-area-inset-right, 0px));
    bottom: max(0.65rem, env(safe-area-inset-bottom, 0px));
    transform: none;
    width: auto;
    max-width: none;
    gap: 0.6rem;
    padding: 0.35rem 0.55rem;
    border-radius: 2rem;
    justify-content: space-between;
  }

  .progress-text {
    font-size: 0.72rem;
  }

  .nav-button {
    width: 2rem;
    height: 2rem;
  }

  .top-controls {
    top: max(0.55rem, env(safe-area-inset-top, 0px));
    right: max(0.55rem, env(safe-area-inset-right, 0px));
    gap: 0.3rem;
  }

  .present-button,
  .exit-button {
    height: 1.75rem;
    padding: 0 0.55rem;
    border-radius: 0.4rem;
    font-size: 0.7rem;
  }

  .top-controls__label {
    display: none;
  }
}

@media (max-width: 360px) {
  .deck-controls {
    gap: 0.45rem;
    padding: 0.3rem 0.45rem;
  }

  .progress-text {
    min-width: 2.8rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .nav-button,
  .present-button,
  .exit-button {
    transition: none;
  }
}
</style>
