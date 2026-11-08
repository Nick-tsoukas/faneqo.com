# Band Page Templates - Deep Dive Documentation

## Overview

MusicBizQR uses a template system to render band pages with different visual styles. The main entry point is `pages/[bandSlug]/index.vue` which conditionally renders different template components based on the band's `pageStyle` setting.

## Architecture

```
pages/[bandSlug]/index.vue          # Main router page - template switcher
├── components/band/BandPageCompact.vue    # Compact template
├── components/band/BandPageBold.vue       # Bold template  
├── components/band/BandPageCybered.vue    # Cybered (smartlink) template
└── (default)                              # Classic template (inline in index.vue)
```

## Template Detection

Templates are selected based on the `pageStyle` field stored in the band's database record:

```javascript
// pages/[bandSlug]/index.vue

const pageStyle = computed(() => {
  return band.value?.data?.pageStyle || 'default';
});

const isCompactStyle = computed(() => pageStyle.value === 'compact');
const isBoldStyle = computed(() => pageStyle.value === 'bold');
const isCyberedStyle = computed(() => pageStyle.value === 'smartlink');
```

### Template Rendering Order

The template is selected using `v-else-if` chain:

```vue
<!-- 1. Compact Style -->
<div v-else-if="isCompactStyle">
  <BandPageCompact ... />
</div>

<!-- 2. Cybered Style -->
<div v-else-if="isCyberedStyle">
  <BandPageCybered ... />
</div>

<!-- 3. Bold Style -->
<div v-else-if="isBoldStyle">
  <BandPageBold ... />
</div>

<!-- 4. Default/Classic Style (v-else) -->
<div v-else>
  <!-- Classic template rendered inline -->
</div>
```

## Page Style Values

| Display Name | Database Value | Component | Status |
|--------------|----------------|-----------|--------|
| Classic | `default` | Inline in index.vue | ✅ Active |
| Cybered | `smartlink` | `BandPageCybered.vue` | ✅ Active |
| Compact | `compact` | `BandPageCompact.vue` | 🔒 Legacy |
| Bold | `bold` | `BandPageBold.vue` | 🔒 Legacy |

**Note:** Only Classic and Cybered are shown to users in the template selector. Compact and Bold are legacy templates that still work but are not offered for new selections.

---

## Template Props

All template components receive the same core props from the parent page:

```javascript
// Standard props passed to all templates
{
  band: Object,                    // Full band data object
  upcomingEvents: Array,           // List of upcoming events
  hiddenLinks: Array,              // Links to hide from display
  enabledPaymentButtons: Array,    // Enabled payment/tip options
  followablePlatforms: Array,      // Platforms available for following
}
```

## Template Events

All templates emit the same events for the parent to handle:

| Event | Payload | Description |
|-------|---------|-------------|
| `play-song` | - | Audio playback started |
| `play-video` | - | Video playback started |
| `link-click` | `{ name, url }` | Streaming/social link clicked |
| `view-event` | `event` | Event card clicked |
| `quick-tip` | `amount` | Tip button clicked |
| `follow` | - | Follow button clicked |
| `save` | - | Save button clicked |
| `share` | - | Share button clicked |

---

## Template Details

### 1. Classic Template (Default)

**Database Value:** `default`  
**Location:** Inline in `pages/[bandSlug]/index.vue`

The original band page design with:
- Full-width hero image
- Bold typography
- White-bordered buttons (`streamingButtonClasses` with `border-white`)
- Separate sections for streaming, social, events
- Traditional vertical layout

**Button Style:**
```javascript
// Classic uses white-bordered buttons
'w-full mb-4 border border-white bg-transparent text-white flex items-center gap-3 font-semibold px-4 py-4 rounded-md hover:bg-white/5'
```

### 2. Cybered Template (Smartlink)

**Database Value:** `smartlink`  
**Location:** `components/band/BandPageCybered.vue`

Modern Smart Link-style design with:
- Rounded hero with gradient overlay
- Smart image positioning (`object-position: center 25%`)
- Live Surface components (ShowDayHeader, NowBanner, LiveFeed)
- Card-based content sections
- Inline audio/video players (no slots needed)
- Glass morphism effects
- Purple/cyan accent colors

**Key Features:**
- Self-contained audio/video handling (no slots)
- Supports both embedded players (Spotify, SoundCloud) and direct audio files
- Embedded players show without extra heading/title
- Video shows thumbnail first, then iframe on click

**Button Style:**
```javascript
// Cybered automatically uses modern buttons
'w-full flex items-center gap-3 px-4 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10'
```

### 3. Compact Template (Legacy)

**Database Value:** `compact`  
**Location:** `components/band/BandPageCompact.vue`

Condensed layout with:
- Smaller hero
- Tighter spacing
- Uses slots for audio/video players

### 4. Bold Template (Legacy)

**Database Value:** `bold`  
**Location:** `components/band/BandPageBold.vue`

Immersive design with:
- Parallax hero effect
- Gradient overlays
- Floating badges
- Uses slots for audio/video players

---

## Slot System (Compact & Bold)

Compact and Bold templates use Vue slots for audio/video players, allowing the parent page to inject the player components:

```vue
<!-- In BandPageCompact.vue or BandPageBold.vue -->
<template>
  <section v-if="hasFeaturedSong">
    <slot name="audio-player" />
  </section>
  
  <section v-if="hasVideo">
    <slot name="video-player" />
  </section>
</template>
```

```vue
<!-- In pages/[bandSlug]/index.vue -->
<BandPageCompact ...>
  <template #audio-player>
    <AudioPlayer ... />
  </template>
  
  <template #video-player>
    <iframe ... />
  </template>
</BandPageCompact>
```

**Note:** Cybered template does NOT use slots - it handles audio/video internally.

---

## Button Style System

The page supports two button styles for streaming/social links:

```javascript
const buttonStyle = computed(() => {
  if (isCyberedStyle.value) return 'modern';  // Cybered always uses modern
  return band.value?.data?.buttonStyle || 'classic';
});

const streamingButtonClasses = computed(() => {
  if (buttonStyle.value === 'modern') {
    return 'w-full flex items-center gap-3 px-4 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition';
  }
  return 'w-full mb-4 border border-white bg-transparent text-white flex items-center gap-3 font-semibold px-4 py-4 rounded-md hover:bg-white/5 active:bg-white/10 transition duration-200 ease-out hover:-translate-y-[1px] active:translate-y-0';
});
```

---

## Live Surface Features

Live Surface components are available in Cybered template and controlled by feature flags:

```javascript
// Feature flags from useDemoFlags
const showNowBanner = computed(() => 
  getDemoFlag('SMARTLINK_LIVE_SURFACE_ENABLED') && 
  getDemoFlag('SMARTLINK_SHOW_NOW_BANNER')
);
```

### Live Surface Components

| Component | Description |
|-----------|-------------|
| `ShowDayHeader` | Shows next upcoming event with ticket link |
| `NowBanner` | Dynamic banner (SHOW_TONIGHT, ON_TOUR, NEW_RELEASE, etc.) |
| `ContinueChip` | Engagement prompt for returning fans |
| `LiveFeed` | Real-time activity feed |
| `SupportModule` | Fan tipping/support |

### NowBanner States

```javascript
const nowBannerState = computed(() => {
  // Priority order:
  // 1. Demo force override
  // 2. Manual override from band data
  // 3. SHOW_TONIGHT (event within 24h)
  // 4. NEW_RELEASE (release within 30 days)
  // 5. ON_TOUR (2+ upcoming events)
  // 6. QUIET_DEFAULT
});
```

---

## Shared Components

All templates share these common components:

| Component | Purpose |
|-----------|---------|
| `FanMomentSection` | Fan engagement/sharing |
| `FollowBandModal` | Follow on streaming platforms |
| `ShareDrawer` | Share band page |
| `AudioPlayer` | Audio playback (used by Compact/Bold) |

---

## Adding a New Template

1. **Create component:** `components/band/BandPageNewStyle.vue`

2. **Add detection computed:**
```javascript
const isNewStyle = computed(() => pageStyle.value === 'newstyle');
```

3. **Add conditional render in index.vue:**
```vue
<div v-else-if="isNewStyle">
  <BandPageNewStyle
    :band="band.data"
    :upcoming-events="upcomingEvents"
    ...
    @play-song="onSongPlay"
    @link-click="..."
    ...
  />
</div>
```

4. **Update database schema:** Add `'newstyle'` to `pageStyle` enum in Strapi

5. **Add to template selector:** Update `createband.vue` and `editband/[id].vue`

---

## File Reference

| File | Purpose |
|------|---------|
| `pages/[bandSlug]/index.vue` | Main page, template switcher, shared logic |
| `components/band/BandPageCybered.vue` | Cybered template |
| `components/band/BandPageCompact.vue` | Compact template |
| `components/band/BandPageBold.vue` | Bold template |
| `pages/createband.vue` | Template selector for new bands |
| `pages/editband/[id].vue` | Template selector for existing bands |
| `components/band/BandPageStylePreview.vue` | Preview modal wrapper |
| `components/band/BandPageStyleClassic.vue` | Classic preview |
| `components/band/BandPageStyleDefault.vue` | Cybered preview |

---

## Database Schema

```json
// qrdb/src/api/band/content-types/band/schema.json
{
  "pageStyle": {
    "type": "enumeration",
    "enum": ["default", "compact", "bold", "smartlink"],
    "default": "default"
  },
  "buttonStyle": {
    "type": "enumeration", 
    "enum": ["classic", "modern"],
    "default": "classic"
  }
}
```
