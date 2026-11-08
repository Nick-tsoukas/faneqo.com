# Slide 1 Audit: Spotify First Opening Scene

## Overview

**Component:** `SpotifyFirstOpeningScene.vue`  
**Location:** `components/decks/mbq/spotify-first/SpotifyFirstOpeningScene.vue`  
**Used in:** `/corvana/decks/mbq/spotify-first` (Slide 1)  
**Duration:** 12 seconds  
**Aspect Ratio:** 9:16 (vertical/TikTok format)

---

## Purpose

The opening scene answers the viewer's immediate question: *"If I shouldn't send fans straight to Spotify first, where do I send them?"*

**Answer:** To your MBQ artist hub first.

The slide establishes the problem (losing fan relationships to streaming platforms) and immediately reveals the solution (a beautiful MBQ artist profile page that captures fans before sending them to platforms).

---

## Animation Sequence (12 Seconds)

### Phase 0: Background (0.0s - 0.5s)
- Dark MBQ cinematic background visible
- No content yet

### Phase 1: Eyebrow (0.5s - 1.5s)
- Text: "THE PROBLEM"
- Purple (#a855f7) color
- Uppercase, heavy tracking (0.25em)
- Fades in with slight Y translation

### Phase 2: Main Hook (1.5s - 3.5s)
- Three-line headline appears sequentially:
  - Line 1: "MUSICIANS,"
  - Line 2: "STOP SENDING FANS"
  - Line 3: "TO SPOTIFY FIRST." (gradient text)
- Gradient: purple (#a855f7) → pink (#ec4899) → purple (#8b5cf6)
- No blue rectangle highlight (fixed from previous version)
- Uses `-webkit-background-clip: text` for gradient text effect
- Text shadow glow for premium feel

### Phase 3: Subtitle (3.5s - 5.0s)
- "Capture the relationship before the stream."
- Punchline: "Spotify gets the stream. The artist should get the fan."
- White/70% opacity, smaller text

### Phase 4: Transition (5.0s - 6.0s)
- Hook text fades out and moves up
- Phone mockup fades in and scales up
- Transform: `translateY(-30px)` + opacity 0

### Phase 5: Phone Reveal (6.0s - 11.0s)
- Phone frame appears (280px × 520px)
- Black background, rounded corners (2.5rem)
- Border: 2px solid white/10%
- Shadow: large drop shadow for depth

**Auto-scroll animation inside phone:**
- CSS transform animation `auto-scroll-phone`
- Duration: 5 seconds
- Easing: `cubic-bezier(0.4, 0, 0.2, 1)`
- Translates profile content from Y:0 to Y:-320px
- Starts at hero, scrolls down to reveal fan capture module

### Phase 6: Callout (11.0s - 12.0s)
- Green pill appears below phone
- Text: "Capture the fan before the platform click."
- Pulsing green dot
- Background: rgba(16, 185, 129, 0.15)
- Border: 1px solid rgba(16, 185, 129, 0.3)

---

## Shannon Tehya Profile Content

The profile mockup includes:

1. **Hero Section**
   - Artist image (gradient overlay with Shannon's photo)
   - Genre pill: "Indie Artist"
   - Artist name: "Shannon Tehya"
   - Gradient: purple → pink → blue

2. **Bio**
   - "A cinematic indie artist creating songs for late nights, open roads, and the fans who find the music before everyone else."

3. **Featured Track**
   - Title: "Change"
   - Artist: "Shannon Tehya"
   - Play button with gradient

4. **Streaming Links**
   - Spotify (green styling)
   - YouTube (default styling)

5. **Fan Capture Module** (key visual)
   - Avatar with initials "ST"
   - "Follow Shannon Tehya"
   - "Get updates + exclusive drops"
   - Email field: "maya@email.com"
   - "Join Fan List" button (gradient)

6. **Action Buttons**
   - Follow (purple), Save, Share

7. **Footer**
   - musicbizqr.com

---

## Technical Architecture

### Component Structure
```vue
<template>
  <div class="opening-scene">
    <!-- Phase 1: Text Hook -->
    <div class="hook-phase" :class="{ 'fade-out': phase >= 2 }">
      <div class="eyebrow" :class="{ 'visible': phase >= 0 }">THE PROBLEM</div>
      <div class="headline" :class="{ 'visible': phase >= 1 }">...</div>
      <div class="subtitle" :class="{ 'visible': phase >= 2 }">...</div>
    </div>

    <!-- Phase 2: Phone Reveal -->
    <div class="phone-phase" :class="{ 'visible': phase >= 3 }">
      <div class="phone-frame">
        <div class="phone-screen" :class="{ 'auto-scroll': phase >= 4 }">
          <div class="profile-content">...</div>
        </div>
        <div class="callout" :class="{ 'visible': phase >= 5 }">...</div>
      </div>
    </div>
  </div>
</template>
```

### Animation State Machine
Uses a simple `phase` ref (0-5) controlled by setTimeout:

```javascript
const phase = ref(0)

const timeline = [
  { phase: 0, delay: 0 },      // Show eyebrow
  { phase: 1, delay: 500 },   // Show headline  
  { phase: 2, delay: 2000 },  // Show subtitle
  { phase: 3, delay: 3500 },  // Fade to phone
  { phase: 4, delay: 4500 },  // Start auto-scroll
  { phase: 5, delay: 9500 },  // Show callout
]
```

### CSS Animation Classes
- `.visible` - Opacity 0 → 1 with Y translation
- `.fade-out` - Hook phase exit animation
- `.auto-scroll` - Triggers phone content scroll

### Auto-Scroll Mechanism
```css
@keyframes auto-scroll-phone {
  0% { transform: translateY(0); }
  100% { transform: translateY(-320px); }
}

.phone-screen.auto-scroll .profile-content {
  animation: auto-scroll-phone 5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}
```

**Important:** Uses CSS transform animation, NOT JavaScript scroll or user scroll. This ensures:
- Smooth 60fps animation
- No scrollbars visible
- Predictable timing
- Works in screen recording

---

## Layout Specifications

### Phone Frame
- Width: 280px
- Height: 520px
- Border radius: 2.5rem
- Border: 2px solid rgba(255,255,255,0.1)
- Box shadow: 0 50px 100px -20px rgba(0,0,0,0.5)

### Profile Content
- Full width inside phone
- Flex column layout
- Auto-scrolls vertically within clipped phone-screen container
- No overflow visible outside phone

### Outer Scene
- Full 9:16 deck frame
- `overflow: hidden` on all containers
- No page scrolling allowed

---

## Design System Compliance

### Colors
- **Primary gradient:** #a855f7 (purple) → #ec4899 (pink) → #8b5cf6 (purple)
- **Spotify green:** #1DB954 / #1ed760
- **Success green:** #10b981
- **Background:** #0f0f1e → #1a1a2e (dark cinematic)
- **Text white:** rgba(255,255,255,0.7-1.0)

### Typography
- **Headline:** 1.75rem, font-weight 900
- **Subtitle:** 1rem, font-weight 500
- **Eyebrow:** 0.625rem, font-weight 800, uppercase, tracking 0.25em
- **Phone content:** 0.625rem - 0.875rem scale

### Effects
- Gradient text using `-webkit-background-clip: text`
- Text shadows for glow effects
- Backdrop blur on pills (10px)
- Smooth transitions (0.5s ease, 0.8s cubic-bezier)

---

## Integration with Deck System

### In Deck Configuration
```javascript
{
  id: 1,
  headline: '',        // Empty - component handles text
  subtitle: '',        // Empty - component handles text
  eyebrow: '',         // Empty - component handles text
  component: SpotifyFirstOpeningScene,
  duration: 12000,    // 12 seconds for full animation
  intensity: 'high'
}
```

### DeckSlide Wrapper
- Uses `DeckSlide.vue` with `overflow: hidden`
- Visual slot contains the component
- No headline/subtitle/eyebrow props passed (component internal)

### Overflow Protection
```css
/* DeckSlide.vue */
.deck-slide {
  overflow: hidden;  /* Changed from overflow-y: auto */
}

/* Page level */
html, body {
  overflow: hidden;
  position: fixed;
  touch-action: none;
}
```

---

## Key Improvements Over Previous Version

| Issue | Previous | Fixed |
|-------|----------|-------|
| Text layout | Stacked awkwardly | Clean centered layout |
| Highlight | Blue rectangle | Purple/pink gradient text |
| Bottom cut-off | Content cut at bottom | Properly contained |
| Scrolling | Page scrollbar visible | `overflow: hidden` everywhere |
| Visual proof | Generic comparison | Shannon Tehya artist profile |
| Branding | Generic | MBQ purple/pink gradient |
| Auto-scroll | None | CSS transform auto-scroll |

---

## Files Involved

1. **New component:**
   - `components/decks/mbq/spotify-first/SpotifyFirstOpeningScene.vue`

2. **Modified:**
   - `pages/corvana/decks/mbq/spotify-first.vue` - Uses new component for slide 1
   - `components/decks/core/DeckSlide.vue` - `overflow-y: auto` → `overflow: hidden`

3. **Asset used:**
   - `/images/shannonImage.jpg` (artist hero image)

---

## Testing Notes

- Test at `/corvana/decks/mbq/spotify-first`
- Slide 1 duration: 12 seconds (longer than other 5s slides)
- Animation is self-contained (no user interaction needed)
- Works in recording mode (no controls visible)
- 9:16 aspect ratio optimized for TikTok/Reels

---

## Future Enhancements (Optional)

1. Add subtle parallax to hero image during scroll
2. Animate the "Join Fan List" button with pulse effect
3. Add particle/sparkle effects during gradient text reveal
4. Make phone tilt slightly (3D transform) for depth
5. Add sound effect cues (if audio support added)

---

## Summary

Slide 1 is now a cinematic opening scene that:
- Establishes the problem with bold gradient typography
- Answers "where do I send fans?" with a real artist profile
- Auto-scrolls to highlight the fan capture module
- Uses MBQ brand colors and styling throughout
- Fits perfectly in 9:16 with no scrolling issues
- Provides a strong hook for the rest of the deck
