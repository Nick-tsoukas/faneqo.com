# MBQ TikTok Deck System Audit

## Overview

A self-playing vertical 9:16 product trailer deck system for MusicBizQR, built for screen-recording and pairing with AI voiceover or founder narration.

**Route:** `/corvana/decks/mbq/spotify-first`  
**Total Duration:** ~55 seconds (12 slides)  
**Tech Stack:** Nuxt 3, Vue 3 Composition API, TailwindCSS

---

## Architecture

### Core Philosophy
- **Reuse over rebuild:** Existing MBQ demo components wrapped, not duplicated
- **Cinematic:** Dark, premium music-tech aesthetic with smooth transitions
- **Screen-recording optimized:** 9:16 canvas, performance-friendly, clean recording mode
- **Autoplay:** Self-advancing with per-slide timing and keyboard controls

---

## Core Deck System Components

### 1. VerticalDeckFrame.vue
**Path:** `components/decks/core/VerticalDeckFrame.vue`

**Purpose:** Main container providing 9:16 vertical canvas, background, and layout structure.

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `recordingMode` | Boolean | false | Hides controls, shows REC indicator |

**Slots:**
- `slide` - Active slide content
- `progress` - Progress indicator area
- `controls` - Control buttons (hidden when recording)

**Key Features:**
- 9/16 aspect ratio centered in browser
- Max-width 450px, max-height 100vh
- Responsive: border-radius on desktop, full-bleed on mobile
- Recording mode adds subtle purple border

---

### 2. DeckSlide.vue
**Path:** `components/decks/core/DeckSlide.vue`

**Purpose:** Individual slide wrapper with text layout and entrance animations.

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `active` | Boolean | false | Show/hide slide |
| `headline` | String | '' | Main headline text |
| `subtitle` | String | '' | Subtitle text |
| `eyebrow` | String | '' | Small uppercase label above headline |
| `intensity` | String | 'medium' | Animation intensity: 'low', 'medium', 'high' |

**Slots:**
- `default` - Custom content (overrides text)
- `visual` - Visual element below text

**Animations:**
- Enter: fade up + slight blur (0.6s cubic-bezier)
- Leave: fade out + slide up (0.4s)
- High intensity: slower, more dramatic entrance
- Safe area at bottom for TikTok captions (80px)

---

### 3. DeckController.vue
**Path:** `components/decks/core/DeckController.vue`

**Purpose:** Playback controls and keyboard control hints.

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isPlaying` | Boolean | false | Play/pause state |
| `currentSlide` | Number | 1 | Current slide number |
| `totalSlides` | Number | 1 | Total slide count |
| `recordingMode` | Boolean | false | Recording mode active |

**Events:**
- `play`, `pause`, `prev`, `next`, `restart`, `toggle-recording`

**Visual:**
- Fixed bottom bar with play/pause, prev/next, restart, recording toggle
- Slide counter on right
- Semi-transparent dark background with blur

---

### 4. DeckProgress.vue
**Path:** `components/decks/core/DeckProgress.vue`

**Purpose:** Segmented progress bar showing deck progress and current slide timing.

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `currentSlideIndex` | Number | 0 | 0-based current slide |
| `totalSlides` | Number | 1 | Total slides |
| `slideProgress` | Number | 0 | 0-100 progress within current slide |

**Visual:**
- Horizontal segments (one per slide)
- Completed: purple
- Active: shows fill animation
- Pending: dimmed
- Subtle slide counter (e.g., "3 / 12")

---

## MBQ Background

### MBQDeckBackground.vue
**Path:** `components/decks/mbq/MBQDeckBackground.vue`

**Purpose:** Lightweight cinematic background inspired by CinematicArtistWorld but performance-optimized.

**Design:**
- Dark navy/black base gradient
- Subtle CSS grid pattern (50px, low opacity)
- Three floating glow orbs (purple, cyan, pink) - CSS-only, no blur filters
- 12 floating particles with CSS animations
- Faint QR-pattern overlay
- Vignette edges

**Performance:**
- No `backdrop-filter` or heavy blur
- Uses opacity/transform instead of filters
- CSS `@keyframes` instead of JS animations
- 60s pattern shift animation (very subtle)

---

## Wrapper Components (Reusing Existing MBQ Components)

### Strategy
All wrappers import existing marketing components and:
1. Set `:compact="true"` and `:animated="false"`
2. Scale down with CSS transforms
3. Hide outer glow effects
4. Remove non-essential UI (buttons, CTAs, headers)
5. Add context labels/chips

### 1. DeckArtistProfileMoment.vue
**Wraps:** `DemoArtistProfileShowcase.vue`

**Modifications:**
- Scaled to 85%
- Phone frame border added
- Outer glow hidden (`:deep(.absolute.-inset-4)`)
- Context label: "One page. Every link. Fan-first."

---

### 2. DeckFanIntelligenceMoment.vue
**Wraps:** `DemoFanIntelligenceShowcase.vue`

**Modifications:**
- Scaled to 90%
- Outer glow hidden
- Demo header buttons hidden
- Reduced padding on stat cards
- Tier chips added below: Warm Fans, Engaged, Superfans

---

### 3. DeckShowGrowthMoment.vue
**Wraps:** `DemoShowGrowthFlow.vue`

**Modifications:**
- Scaled to 85%
- Section header hidden
- CTA section hidden
- Timeline panel padding reduced
- Live indicator badge added below

---

### 4. DeckAnalyticsMoment.vue
**Wraps:** `DemoAnalyticsSnapshot.vue`

**Modifications:**
- Scaled to 90%
- Header, CTA, insight card hidden
- KPI card padding reduced
- "Know what creates fans" insight pill added below

---

## Cinematic Bridge Slide Components

These are new, self-contained visual slides that don't wrap existing components.

### 1. HookSpotifyFirst.vue
**Purpose:** Opening hook - contrasting streaming vs fan relationship.

**Visual:**
- Left: Spotify icon (fading animation)
- Right: Fan card with avatar (pulse glow)
- VS indicator between
- Punchline: "Spotify gets the stream. The artist should get the fan."

---

### 2. SpotifyClarifySlide.vue
**Purpose:** Clarify we love Spotify, but it's not a fan list.

**Visual:**
- Large Spotify icon with checkmark
- Two cards: "Great for listening" vs "Not your fan list"

---

### 3. StreamIsNotRelationship.vue
**Purpose:** Show anonymous listeners disappearing.

**Visual:**
- 5 listener cards in grid (fading out with blur)
- Stats: "1,247 Streams today → 0 Fan relationships"

---

### 4. QRScanBridge.vue
**Purpose:** QR scan → fan capture moment.

**Visual:**
- Animated QR code with scan line
- Pulse rings
- "New fan captured" badge
- Source chips: Show Poster, Nashville, Joined list

---

### 5. PlatformJourneySlide.vue
**Purpose:** Show MBQ hub connecting to all platforms.

**Visual:**
- Center: MBQ hub icon with glow
- SVG dashed lines connecting to 4 corners
- Platform icons: Spotify, YouTube, Tickets, Merch

---

### 6. FeatureChipsSlide.vue
**Purpose:** Show features + key phrase.

**Visual:**
- Key phrase: "Spotify gets the stream. The artist should get the fan."
- 4 feature chips: Smart Links, QR Codes, Fan Capture, Analytics
- "Start Free" badge with Pro note

---

### 7. FinalSpotifyFirstCTA.vue
**Purpose:** Final call-to-action.

**Visual:**
- MBQ logo icon
- "Build Your Artist Page Free"
- Punchline box: "Stop losing fans after the click"
- URL: musicbizqr.com
- "Start Free" CTA button
- Trust note

---

## Main Deck Page

### spotify-first.vue
**Path:** `pages/corvana/decks/mbq/spotify-first.vue`

**Slide Configuration (12 slides):**

| # | Headline | Duration | Component | Intensity |
|---|----------|----------|-----------|-----------|
| 1 | MUSICIANS, STOP SENDING FANS TO SPOTIFY FIRST. | 5000ms | HookSpotifyFirst | high |
| 2 | SPOTIFY IS GREAT FOR LISTENING. | 4000ms | SpotifyClarifySlide | medium |
| 3 | A STREAM IS NOT A RELATIONSHIP. | 4500ms | StreamIsNotRelationship | medium |
| 4 | SEND THEM TO YOUR ARTIST HUB FIRST. | 5000ms | DeckArtistProfileMoment | medium |
| 5 | SPOTIFY, YOUTUBE, TICKETS, MERCH. | 4500ms | PlatformJourneySlide | low |
| 6 | EVERY VISIT CAN BECOME A FAN CAPTURE MOMENT. | 5000ms | DeckFanIntelligenceMoment | medium |
| 7 | EVERY QR SCAN CAN BUILD YOUR AUDIENCE. | 4500ms | QRScanBridge | medium |
| 8 | NOW YOUR FAN LIST COMES ALIVE. | 5000ms | DeckFanIntelligenceMoment | medium |
| 9 | YOUR NEXT SHOW SHOULD GROW YOUR LIST. | 4500ms | DeckShowGrowthMoment | medium |
| 10 | KNOW WHAT ACTUALLY CREATES FANS. | 5000ms | DeckAnalyticsMoment | medium |
| 11 | SPOTIFY GETS THE STREAM. | 4500ms | FeatureChipsSlide | high |
| 12 | BUILD YOUR ARTIST PAGE FREE. | 5000ms | FinalSpotifyFirstCTA | high |

**State Management:**
- `currentSlideIndex` - 0-based active slide
- `isPlaying` - Playback state
- `recordingMode` - Hide controls
- `slideProgress` - 0-100 within current slide
- Timer intervals for autoplay

**Keyboard Event Handlers:**
```javascript
'Space' → play/pause
'ArrowRight' → next
'ArrowLeft' → prev
'R' → restart
'F' → toggle recording mode
```

**Lifecycle:**
- Mount: Add keydown listener
- Delay 500ms, then autoplay
- Unmount: Cleanup listeners and timers

---

## Key Technical Decisions

### 1. Wrapper Pattern
Instead of modifying existing demo components, we:
- Import them with `compact=true, animated=false`
- Use `:deep()` CSS selectors to override styles
- Scale with CSS transforms
- Hide non-essential elements

**Benefits:**
- Existing homepage unaffected
- Single source of truth for demo data
- Easy to update wrapped components

### 2. No TypeScript
- Project uses JavaScript
- All components use `.vue` SFC with `<script setup>`

### 3. Performance Optimizations
- No `backdrop-filter` in background
- CSS transforms instead of position changes
- `defineAsyncComponent` not needed (components are lightweight)
- 50ms progress updates (not every frame)

### 4. Recording Mode
- Toggles via `F` key
- Hides controller bar
- Shows "REC" indicator in top-right
- Adds subtle border to canvas
- Designed for clean screen recordings

### 5. Animation Strategy
- Enter/leave transitions use Vue `<Transition>`
- CSS `@keyframes` for continuous animations
- No libraries (GSAP, Lottie) needed
- Transform and opacity only (GPU-accelerated)

---

## File Structure

```
components/
  decks/
    core/
      VerticalDeckFrame.vue
      DeckSlide.vue
      DeckController.vue
      DeckProgress.vue
    mbq/
      MBQDeckBackground.vue
      DeckArtistProfileMoment.vue
      DeckFanIntelligenceMoment.vue
      DeckShowGrowthMoment.vue
      DeckAnalyticsMoment.vue
      HookSpotifyFirst.vue
      SpotifyClarifySlide.vue
      StreamIsNotRelationship.vue
      QRScanBridge.vue
      PlatformJourneySlide.vue
      FeatureChipsSlide.vue
      FinalSpotifyFirstCTA.vue

pages/
  corvana/
    decks/
      mbq/
        spotify-first.vue
```

---

## Dependencies

**No new dependencies required.** Uses existing project stack:
- Vue 3 (Composition API, `<script setup>`)
- Nuxt 3 (auto-imports, file-based routing)
- TailwindCSS (utility classes)

**Imported from existing:**
- `DemoArtistProfileShowcase.vue`
- `DemoFanIntelligenceShowcase.vue`
- `DemoShowGrowthFlow.vue`
- `DemoAnalyticsSnapshot.vue`

---

## Usage Instructions

### View the Deck
1. Navigate to: `http://localhost:3000/corvana/decks/mbq/spotify-first`
2. Deck autoplays after 500ms
3. Use keyboard controls to navigate

### Screen Recording
1. Press `F` to enter recording mode
2. Press `R` to restart from beginning
3. Press `Space` to start playback
4. Record with OBS/Screen Studio/etc.
5. Recording mode hides all UI except REC indicator

### Voiceover Sync
- Total deck: ~55 seconds
- Each slide has custom duration (4000-5000ms)
- Slides don't wait for voiceover
- Design principle: visuals should tell story without audio
- Voiceover adds depth, not required for comprehension

### Modifying Slides

**Change timing:**
```javascript
// In spotify-first.vue
{
  id: 5,
  duration: 6000, // Change this value
  // ...
}
```

**Change content:**
Edit headline/subtitle in slide configuration object.

**Add new slide:**
1. Create new component in `components/decks/mbq/`
2. Import in spotify-first.vue
3. Add to slides array
4. Update total slide count automatically

**Change visual component:**
Replace `component: X` with different imported component.

---

## Known Limitations / Future Enhancements

### Current Limitations
1. **No audio sync** - Slides advance on timer, not audio cues
2. **No export feature** - Must use external screen recording
3. **No captions/subtitles** - Voiceover only (for now)
4. **Single deck** - Only "Spotify First" deck exists
5. **No slide reordering UI** - Must edit code

### Future Enhancements (not built)
- Audio upload + waveform sync
- Caption/subtitle editor
- Slide reordering drag-and-drop
- Multiple deck templates
- Direct video export (WebCodecs API)
- Pause on specific slides for manual advance

---

## Testing Checklist

- [ ] Route loads without console errors
- [ ] Deck autoplays from slide 1
- [ ] Keyboard controls work (Space, arrows, R, F)
- [ ] Progress bar fills during each slide
- [ ] Transitions smooth between slides
- [ ] Recording mode hides controls
- [ ] Existing homepage components unaffected
- [ ] All 12 slides display correctly
- [ ] Mobile 9:16 ratio maintained
- [ ] Desktop centered with border
- [ ] No layout shifts during playback
- [ ] Performance: 60fps during animations

---

## Summary for Chat GPT

**This is a reusable vertical deck system for TikTok/Reels product trailers.**

**Core pattern:**
1. `VerticalDeckFrame` provides 9:16 canvas + background
2. `DeckSlide` wraps content with transitions
3. `DeckController` + `DeckProgress` provide playback UI
4. Slides can be existing MBQ components (wrapped) or new custom components
5. Main page orchestrates slides with timing + keyboard controls

**To create a new deck:**
1. Copy `spotify-first.vue` to new route
2. Modify `slides` array with new content/components
3. Create new slide components as needed
4. Keep existing core components (Frame, Slide, Controller, Progress)

**Key insight:** The wrapper pattern lets us reuse production components without forking them, keeping the marketing site and deck content in sync.
