# Smart Link Live Surface

> **Version:** 2.0  
> **Created:** January 2026  
> **Status:** Active / In Production

## Overview

Smart Link Live Surface is a dynamic, context-aware enhancement layer for band pages. It transforms static link-in-bio pages into living, breathing experiences that respond to real-time events, fan activity, and band context.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FEATURE FLAGS                             │
│  config/smartLinkFeatureFlags.js + composables/useDemoFlags │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    PAGE MODES                                │
│         QUIET | SHOW_DAY | POST_SHOW | ON_TOUR              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    COMPONENTS                                │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │ ShowDayHeader│ │  NowBanner   │ │ MomentBadges │        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │   LiveFeed   │ │ ContinueChip │ │  FanToast    │        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │SupportModule │ │MomentShareCard│ │ DevIndicator │        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

---

## Feature Flags

### Configuration Files

| File | Purpose |
|------|---------|
| `config/smartLinkFeatureFlags.js` | Default flag values (code-level) |
| `composables/useDemoFlags.js` | Runtime overrides via localStorage |

### Flag Hierarchy

```
SMARTLINK_LIVE_SURFACE_ENABLED (Master Switch)
├── V1 Modules
│   ├── SMARTLINK_SHOW_NOW_BANNER
│   ├── SMARTLINK_SHOW_LIVE_FEED
│   ├── SMARTLINK_SHOW_PAGE_MODES
│   ├── SMARTLINK_SHOW_CONTINUE_CHIP
│   ├── SMARTLINK_SHOW_FAN_TOASTS
│   └── SMARTLINK_SHOW_SUPPORT_MODULE_REFACTOR
│
├── V2 Modules (requires SMARTLINK_V2_ENABLED)
│   ├── SMARTLINK_SHOW_MOMENT_BADGES
│   ├── SMARTLINK_SHOW_SHOW_DAY_HEADER
│   └── SMARTLINK_SHOW_MOMENT_SHARE_CARD
│
└── Demo Overrides
    ├── DEMO_FEED_ENABLED
    ├── DEMO_FORCE_MODE
    └── DEMO_FORCE_NOW_BANNER
```

### Demo User Access

Only whitelisted users can modify flags at runtime:
- `nick.tsoukas101@gmail.com`
- `test101@gmail.com`

---

## Page Modes

The page adapts its layout and emphasis based on context:

| Mode | Trigger | Behavior |
|------|---------|----------|
| `QUIET` | No events, default state | Standard link page |
| `SHOW_DAY` | Event today | Emphasizes tickets/entry, shows ShowDayHeader |
| `POST_SHOW` | Event ended <24h ago | Thanks messaging, share prompts |
| `ON_TOUR` | Multiple upcoming events | Tour emphasis |

---

## Components Reference

### V1 Components

#### 1. NowBanner
**Path:** `components/smartlink/NowBanner.vue`

Contextual status banner that adapts to page state.

**States:**
- `SHOW_TONIGHT` - Orange accent, "Live Tonight" messaging
- `ON_TOUR` - Purple accent, tour dates emphasis
- `NEW_RELEASE` - Green accent, new music promotion
- `POST_SHOW_THANKS` - Blue accent, gratitude messaging
- `QUIET_DEFAULT` - Neutral, general discovery

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `state` | String | Banner state (required) |
| `content` | Object | `{ icon, headline, subtext, cta, ctaLink, ctaAction, accent }` |

**Events:** `cta-click`, `scroll-to`, `share`

---

#### 2. LiveFeed
**Path:** `components/smartlink/LiveFeed.vue`

Micro-signals showing recent fan activity.

**Display Modes:**
- `single` - Shows primary feed item only
- `multi` - Shows up to 3 items stacked
- `compact` - Inline horizontal display

**Icon Types:**
| Emoji | Icon | Color |
|-------|------|-------|
| 📍 | Location | Blue |
| 🔥 | Fire | Orange |
| 📈 | Trending | Emerald |
| 🎵 | Music | Purple |
| 💜 | Heart | Pink |

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `feedItems` | Array | List of feed items |
| `primaryFeedItem` | Object | Featured item for single mode |
| `hasFeedItems` | Boolean | Show/hide control |
| `displayMode` | String | `single`, `multi`, `compact` |
| `maxItems` | Number | Max items in multi mode (default: 3) |

---

#### 3. ContinueChip
**Path:** `components/smartlink/ContinueChip.vue`

"Pick up where you left off" for returning visitors.

**Features:**
- Tracks last platform clicked (Spotify, YouTube, etc.)
- Persists to localStorage (7-day expiry)
- Dismissable (24-hour cooldown)

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `bandSlug` | String | Band identifier (required) |

**Exposed Methods:**
- `recordAction(type, url)` - Call when user clicks a link

---

#### 4. FanToast
**Path:** `components/smartlink/FanToast.vue`

Recognition toasts after key fan actions.

**Action Types:**
| Type | Icon | Example Messages |
|------|------|------------------|
| `follow` | 💜 | "Following! Stay in the loop." |
| `save` | ⭐ | "Saved. Welcome back anytime." |
| `share` | 🙌 | "Shared — thanks for spreading the word." |
| `payment` | 💜 | "You're supporting independent music." |
| `link_click` | 🎵 | "Enjoy the music!" |

**Features:**
- Rate limiting (5s minimum between toasts)
- Queue system for multiple actions
- Auto-dismiss after 3s

**Exposed Methods:**
- `showToast(actionType, options)` - Trigger a toast

---

#### 5. SupportModule
**Path:** `components/smartlink/SupportModule.vue`

Consolidated payment section with quick tips.

**Features:**
- Quick tip buttons ($5, $10, $20)
- Expandable payment options
- Multiple pricing modes: `min`, `presets`, `fixed`
- Auto-expands on SHOW_DAY mode

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `bandName` | String | Display name |
| `paymentButtons` | Array | Payment button configs |
| `pageMode` | String | Current page mode |
| `showQuickTips` | Boolean | Show quick tip section |
| `quickTipAmounts` | Array | Tip amounts (default: [5, 10, 20]) |

---

### V2 Components

#### 6. ShowDayHeader
**Path:** `components/smartlink/ShowDayHeader.vue`

Compact strip shown on show days with event info and CTA.

**Features:**
- Animated live indicator (pulsing dot)
- Event city/venue display
- Dynamic CTA: "Tickets" → "View Event"

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `event` | Object | Event data with `city`, `venue`, `ticketLink`, `doorsTime` |
| `hasPayEntry` | Boolean | Show payment CTA |

**Events:** `tickets`, `pay-entry`

---

#### 7. MomentBadges
**Path:** `components/smartlink/MomentBadges.vue`

Animated badge chips indicating special moments.

**Badge Types:**
| Badge | Icon | Trigger |
|-------|------|---------|
| New Tonight | 🎤 | `hasShowTonight` |
| Tour Week | 🚐 | `isOnTour` |
| Fresh Release | 🔥 | `hasNewRelease` |
| Fresh Video | 🎬 | `hasNewVideo` |
| Merch Drop | 👕 | `hasMerchDrop` |

**Features:**
- Neon glow animation
- Max 3 badges displayed
- Custom badges via `customBadges` prop

---

#### 8. MomentShareCard
**Path:** `components/smartlink/MomentShareCard.vue`

Shareable preview card for fan moments.

**Moment Types:**
| Type | Icon | Headline |
|------|------|----------|
| `default` | 🎵 | "I found something good" |
| `you_were_here` | 🎤 | "I was there" |
| `support_received` | 💜 | "I backed the band" |
| `heating_up` | 🔥 | "Something's happening" |
| `post_show` | 🙏 | "What a night" |

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `momentType` | String | Type of moment |
| `bandName` | String | Band display name |
| `customHeadline` | String | Override headline |
| `customSubtext` | String | Override subtext |

---

#### 9. DevIndicator
**Path:** `components/smartlink/DevIndicator.vue`

Development-only indicator showing Live Surface is active.

**Features:**
- Only shows in development mode
- Fixed position bottom-left
- Shows "🔴 Live Surface: ON"

---

## Integration

### Band Page Usage

```vue
<!-- In pages/[bandSlug]/index.vue -->

<!-- V2: Show Day Header -->
<div v-if="shouldShowShowDayHeader && upcomingEvents.length > 0" 
     class="w-full px-6 mt-4 md:max-w-[80vw] md:mx-auto">
  <ShowDayHeader
    :event="upcomingEvents[0]"
    :has-pay-entry="enabledPaymentButtons.length > 0"
    @tickets="handleTickets"
    @pay-entry="scrollToSupport"
  />
</div>

<!-- NOW Banner -->
<div v-if="showNowBanner && nowBannerContent" 
     class="w-full px-6 mt-6 md:max-w-[80vw] md:mx-auto">
  <NowBanner
    :state="nowBannerState"
    :content="nowBannerContent"
    @cta-click="handleNowBannerCta"
  />
</div>

<!-- Live Feed -->
<div v-if="showLiveFeed && hasLiveFeedItems" 
     class="w-full px-6 mt-4 md:max-w-[80vw] md:mx-auto">
  <LiveFeed
    :feed-items="liveFeedItems"
    :primary-feed-item="primaryFeedItem"
    :has-feed-items="hasLiveFeedItems"
    display-mode="single"
  />
</div>
```

### Checking Flags

```javascript
import { getDemoFlag } from '@/composables/useDemoFlags'

// Check if feature is enabled
const showLiveFeed = computed(() => 
  getDemoFlag('SMARTLINK_LIVE_SURFACE_ENABLED') && 
  getDemoFlag('SMARTLINK_SHOW_LIVE_FEED')
)

// V2 features require both master and V2 flag
const showMomentBadges = computed(() => 
  getDemoFlag('SMARTLINK_LIVE_SURFACE_ENABLED') && 
  getDemoFlag('SMARTLINK_V2_ENABLED') && 
  getDemoFlag('SMARTLINK_SHOW_MOMENT_BADGES')
)
```

---

## Styling Guidelines

### Container Widths

All Live Surface components should use consistent container styling:

```css
/* Standard container */
.w-full.px-6.mt-4.md:max-w-[80vw].md:mx-auto

/* Component internal padding */
.px-4.py-3  /* Standard item padding */
.gap-3      /* Standard gap between elements */
```

### Icon Boxes

```css
/* Standard icon container */
.w-8.h-8.rounded-lg.flex.items-center.justify-center.shrink-0

/* Icon colors by type */
.bg-purple-500/20.text-purple-400  /* Music/default */
.bg-blue-500/20.text-blue-400      /* Location */
.bg-orange-500/20.text-orange-400  /* Fire/hot */
.bg-emerald-500/20.text-emerald-400 /* Trending */
```

---

## Future Improvements

### Planned Features
- [ ] Real-time WebSocket updates for LiveFeed
- [ ] Geo-targeted content (city-specific messaging)
- [ ] A/B testing framework for CTA copy
- [ ] Analytics dashboard for Live Surface metrics
- [ ] Push notification integration
- [ ] Personalized recommendations based on listening history

### Technical Debt
- [ ] Consolidate page mode detection logic
- [ ] Add unit tests for all components
- [ ] Performance audit for animation-heavy components
- [ ] Accessibility audit (ARIA labels, keyboard nav)

---

## Changelog

### v2.0 (January 2026)
- Added ShowDayHeader component
- Added MomentBadges component
- Added MomentShareCard component
- Changed "Pay Entry" → "View Event" button text
- Aligned ShowDayHeader width with LiveFeed components

### v1.0 (Initial Release)
- NowBanner with 5 states
- LiveFeed with 3 display modes
- ContinueChip for returning visitors
- FanToast recognition system
- SupportModule with quick tips
- Feature flag system with demo user overrides
