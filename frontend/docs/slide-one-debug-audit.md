# Slide 1 Debug Audit

## Problem
Slide 1 (`SpotifyFirstOpeningScene.vue`) does not render any content in the browser. The deck loads but shows a blank/black screen on the first slide.

## Browser Console Errors
- Workbox service worker warnings about `/offline` (not critical)
- No Vue compile errors
- No obvious JavaScript errors directly related to the slide

## File Locations

### 1. Slide Component (The Problem)
**File:** `components/decks/mbq/spotify-first/SpotifyFirstOpeningScene.vue`

```vue
<template>
  <div class="opening-scene" :class="{ 'phase-phone': phase >= 3 }">
    <!-- Debug - always visible -->
    <div style="position: absolute; top: 10px; left: 10px; color: red; z-index: 9999; font-size: 12px;">
      SLIDE 1 MOUNTED - Phase: {{ phase }}
    </div>
    
    <!-- Cinematic Background -->
    <div class="bg-cinematic">
      <div class="bg-glow top" />
      <div class="bg-glow bottom" />
      <div class="bg-grid" />
    </div>

    <!-- Phase 1: Text Hook (0-5s) -->
    <div class="hook-phase">
      <div class="eyebrow">
        <span class="eyebrow-line" />
        THE PROBLEM
        <span class="eyebrow-line" />
      </div>
      
      <div class="headline">
        <div class="line line-1">MUSICIANS,</div>
        <div class="line line-2">
          STOP SENDING
          <span class="highlight-fans">FANS</span>
        </div>
        <div class="line line-3 accent">
          TO <span class="highlight-spotify">SPOTIFY</span> FIRST.
        </div>
      </div>
      
      <div class="subtitle-wrap">
        <p class="subtitle">
          Capture the relationship before the stream.
        </p>
        <div class="punchline">
          <span class="punch-spotify">Spotify gets the stream.</span>
          <span class="punch-divider" />
          <span class="punch-artist">The artist should get the fan.</span>
        </div>
      </div>
    </div>

    <!-- Phase 2: Product Reveal (5s+) -->
    <div class="reveal-phase" :class="{ 'visible': phase >= 3 }">
      <!-- ... phone mockup content ... -->
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps({
  active: {
    type: Boolean,
    default: false
  }
})

const phase = ref(0)  // Changed from -1 to 0
let timeouts = []

function clearAllTimeouts() {
  timeouts.forEach(t => clearTimeout(t))
  timeouts = []
}

function startSequence() {
  clearAllTimeouts()
  // Animation timeline
  const timeline = [
    { phase: 0, delay: 600 },
    { phase: 1, delay: 1200 },
    { phase: 2, delay: 3200 },
    { phase: 3, delay: 4800 },
    { phase: 4, delay: 5800 },
    { phase: 5, delay: 10500 },
  ]
  
  timeline.forEach(({ phase: p, delay }) => {
    timeouts.push(setTimeout(() => { phase.value = p }, delay))
  })
}

onMounted(() => {
  startSequence()
})

watch(() => props.active, (isActive) => {
  if (isActive) {
    startSequence()
  } else {
    clearAllTimeouts()
    phase.value = -1
  }
})

onUnmounted(() => {
  clearAllTimeouts()
})

defineExpose({
  restart: startSequence
})
</script>

<style scoped>
.opening-scene {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bg-cinematic {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, #0a0a0f 0%, #12121a 50%, #0a0a0f 100%);
  z-index: 0;
}

.hook-phase {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  z-index: 10;
}

.eyebrow {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.625rem;
  font-weight: 700;
  letter-spacing: 0.35em;
  color: #a855f7;
  text-transform: uppercase;
  margin-bottom: 1.5rem;
  opacity: 1;  /* Always visible */
}

.headline {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  text-align: center;
  opacity: 1;  /* Always visible */
}

/* ... more styles ... */

.reveal-phase {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transform: scale(0.9) translateY(30px);
  transition: all 1s cubic-bezier(0.16, 1, 0.3, 1);
  z-index: 20;
}

.reveal-phase.visible {
  opacity: 1;
  transform: scale(1) translateY(0);
}
</style>
```

**Key Issue:** The debug text at the top should ALWAYS be visible in red, but it's not showing. This suggests the component is not mounting at all.

---

### 2. Deck Page (Where Slide is Used)
**File:** `pages/corvana/decks/mbq/spotify-first.vue`

```vue
<template>
  <VerticalDeckFrame :recording-mode="recordingMode">
    <!-- Active Slide -->
    <template #slide>
      <DeckSlide
        :active="true"
        :headline="currentSlide.headline"
        :subtitle="currentSlide.subtitle"
        :eyebrow="currentSlide.eyebrow"
        :intensity="currentSlide.intensity || 'medium'"
      >
        <template #visual>
          <component :is="currentSlide.component" :active="true" />
        </template>
      </DeckSlide>
    </template>
    
    <!-- Progress -->
    <template #progress>
      <DeckProgress ... />
    </template>
    
    <!-- Controls -->
    <template #controls>
      <DeckController ... />
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

// Slide components
import SpotifyFirstOpeningScene from '~/components/decks/mbq/spotify-first/SpotifyFirstOpeningScene.vue'
import SpotifyFirstHookVisual from '~/components/decks/mbq/spotify-first/SpotifyFirstHookVisual.vue'
// ... more imports

const slides = [
  {
    id: 1,
    headline: '',
    subtitle: '',
    eyebrow: '',
    component: SpotifyFirstOpeningScene,
    duration: 12000,
    intensity: 'high'
  },
  // ... more slides
]

const currentSlideIndex = ref(0)
const isPlaying = ref(false)

const currentSlide = computed(() => slides[currentSlideIndex.value])

// State and methods for deck control...
</script>
```

---

### 3. DeckSlide Wrapper Component
**File:** `components/decks/core/DeckSlide.vue`

```vue
<template>
  <Transition
    enter-active-class="slide-enter-active"
    enter-from-class="slide-enter-from"
    enter-to-class="slide-enter-to"
    leave-active-class="slide-leave-active"
    leave-from-class="slide-leave-from"
    leave-to-class="slide-leave-to"
  >
    <div 
      v-if="active"
      class="deck-slide"
      :class="[`intensity-${intensity}`]"
    >
      <!-- Content Container -->
      <div class="slide-content">
        <!-- Eyebrow -->
        <div v-if="eyebrow" class="slide-eyebrow">
          {{ eyebrow }}
        </div>
        
        <!-- Headline -->
        <h1 v-if="headline" class="slide-headline">
          {{ headline }}
        </h1>
        
        <!-- Subtitle -->
        <p v-if="subtitle" class="slide-subtitle">
          {{ subtitle }}
        </p>
        
        <!-- Visual Slot -->
        <div class="slide-visual">
          <slot name="visual" />
        </div>
        
        <!-- Default Slot -->
        <slot />
      </div>
      
      <!-- Safe Area -->
      <div class="caption-safe-area" />
    </div>
  </Transition>
</template>

<script setup>
defineProps({
  active: { type: Boolean, default: false },
  headline: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  eyebrow: { type: String, default: '' },
  intensity: { type: String, default: 'medium' }
})
</script>

<style scoped>
.deck-slide {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  padding: 2rem 1.5rem;
  padding-bottom: 6rem;
  overflow: hidden;
}

.slide-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  gap: 1rem;
}

.slide-visual {
  width: 100%;
  margin-top: 1.5rem;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
```

**Note:** The `v-if="$slots.visual"` was removed from the visual slot wrapper.

---

### 4. VerticalDeckFrame Container
**File:** `components/decks/core/VerticalDeckFrame.vue`

```vue
<template>
  <div class="vertical-deck-frame" :class="{ 'recording-mode': recordingMode }">
    <MBQDeckBackground />
    
    <div class="deck-canvas">
      <div class="slide-container">
        <slot name="slide" />
      </div>
      
      <div class="progress-area">
        <slot name="progress" />
      </div>
    </div>
    
    <div v-if="!recordingMode" class="controls-area">
      <slot name="controls" />
    </div>
  </div>
</template>

<style scoped>
.vertical-deck-frame {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
  overflow: hidden;
}

.deck-canvas {
  position: relative;
  width: 100%;
  max-width: 450px;
  aspect-ratio: 9 / 16;
  max-height: 100vh;
  background: linear-gradient(180deg, #0a0a0f 0%, #111118 100%);
  overflow: hidden;
}

.slide-container {
  position: relative;
  width: 100%;
  height: 100%;
  z-index: 10;
}
</style>
```

---

## What Works vs What Doesn't

### ✓ Working:
- Deck page loads (can see controls)
- MBQDeckBackground renders (cinematic background visible)
- Navigation between slides works (controls responsive)
- Other slides render content (Slides 2-12)

### ✗ Not Working:
- Slide 1 component does not render ANY content
- Debug text (which should always be visible) doesn't appear
- No "THE PROBLEM" eyebrow text
- No headline "MUSICIANS, STOP SENDING FANS TO SPOTIFY FIRST."

---

## Things Already Tried

1. Changed `phase` initial value from `-1` to `0`
2. Made all text elements have `opacity: 1` (removed transitions)
3. Removed `v-if="$slots.visual"` check from DeckSlide.vue
4. Added explicit debug text with inline styles (should be impossible to hide)
5. Component starts animation immediately on `onMounted`

---

## Suspected Causes

1. **Dynamic component not resolving** - `:is="currentSlide.component"` might not be finding the import
2. **Vue render error** - Component might be erroring during render (but no console error shown)
3. **Z-index/visibility issue** - Content might be behind background or invisible
4. **CSS scope issue** - `scoped` styles might not be applying correctly
5. **Import path issue** - Component might not be found at `~/components/decks/mbq/spotify-first/SpotifyFirstOpeningScene.vue`

---

## What to Check

1. Does the component file actually exist at that path?
2. Are there any Vue template compile errors in terminal?
3. What does `currentSlide.component` resolve to in the deck page?
4. Is the component properly registered in Vue?
5. Are there any CSS rules hiding the entire `.opening-scene` container?

---

## Route
`/corvana/decks/mbq/spotify-first`

## Expected Behavior
Should see red debug text "SLIDE 1 MOUNTED - Phase: 0" in top-left of slide 1.
