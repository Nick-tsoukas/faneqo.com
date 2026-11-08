# Demo Components Audit - MusicBizQR Landing Page

**Date:** May 25, 2026  
**Components Location:** `components/marketing/`  
**Purpose:** Marketing showcase components for the new landing page

---

## 1. DemoFanIntelligenceShowcase.vue
**File:** `components/marketing/DemoFanIntelligenceShowcase.vue`  
**Lines:** 557  
**Purpose:** Shows fan intelligence dashboard with fan list, stats, and tier categorization

### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `compact` | Boolean | `false` | Reduces padding for compact mode |
| `animated` | Boolean | `true` | Controls outer glow effect (hidden on mobile via CSS) |

### Data Structure
```js
// fanStats - 4 stat cards
{ label, value, detail, tone: 'pink'|'cyan'|'purple'|'emerald' }

// fanTabs - Tier filtering tabs (visual only)
[ 'All', 'Superfans', 'Engaged', 'Warm', 'New' ]

// demoFans - 6 fan records
{ name, email, location, source, status, activity, joined }
```

### Key UI Elements
- Gradient header (pink→purple) with icon
- 4 stat cards in 2×2 grid (mobile) or row (desktop)
- Horizontal scrolling tier tabs
- Fan list with status dots, email truncation, activity text
- Insight strip at bottom

### Mobile Optimizations Applied
- ✅ Outer glow hidden on mobile (`hidden lg:block`)
- ✅ Stat cards use `grid-cols-2` on mobile
- ✅ Status column stacks below fan info on small screens via `.fan-status-col` CSS
- ✅ Text truncation with `truncate` class
- ✅ Responsive padding (`p-4 sm:p-6`)

### Known Issues/Notes
- Tab switching is visual only (no actual filtering)
- All buttons have `@click.prevent` (demo-only)
- Uses `animate-pulse` on Superfan status dot

---

## 2. DemoArtistProfileShowcase.vue
**File:** `components/marketing/DemoArtistProfileShowcase.vue`  
**Lines:** 518  
**Purpose:** Phone-like mockup of an artist profile page (Shannon Tehya)

### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `compact` | Boolean | `false` | Reduces padding |
| `animated` | Boolean | `true` | Controls outer glow (hidden on mobile) |

### Data Structure
```js
demoArtist: {
  name: 'Shannon Tehya',
  handle: '@shannontehya',
  genre: 'Indie Artist',
  genreTags: ['Indie', 'Singer-Songwriter', 'Alternative'],
  bio: 'A cinematic indie artist...',
  heroImage: '/images/shannonImage.jpg',
  profileImage: '/images/shannonImage.jpg',
  featuredTrack: { title: 'Change', subtitle: 'Shannon Tehya', image },
  links: {
    website: [{ label, subtitle, icon, url }],
    streaming: [Spotify, Apple Music, YouTube],
    social: [Instagram, TikTok]
  },
  support: { enabled, title, description, amounts: [5,10,20], popularAmount: 20 },
  fanList: { enabled, title, description }
}
```

### Key UI Elements
- Hero image with gradient overlays
- Genre pill (top-left)
- Artist name overlay
- Bio section (centered)
- Featured track card with play button
- Website links section
- Streaming links grid (3 icons)
- Social links grid (2 icons)
- Fan list signup form (email input)
- Support module with amount buttons
- Follow/Save/Share action buttons
- MBQ logo footer

### Mobile Optimizations Applied
- ✅ Outer glow hidden on mobile (`hidden lg:block`)
- ✅ Hero height responsive (`h-52 sm:h-72`)
- ✅ Action buttons responsive (`p-3 sm:p-4`, `gap-1 sm:gap-2`)
- ✅ All grids use responsive spacing (`gap-2 sm:gap-4`)

### Known Issues/Notes
- Uses same image for hero, profile, and track (TODO comment notes this)
- Support payment is demo-only (no actual processing)
- Fan signup is demo-only

---

## 3. DemoShowGrowthFlow.vue
**File:** `components/marketing/DemoShowGrowthFlow.vue`  
**Lines:** 342  
**Purpose:** Full section showcasing live show growth with timeline and analytics

### Props
None - standalone section component

### Data Structure
```js
// showStats - 5 top stats
{ label, value, detail }

// liveEvents - 5 timeline events
{ time, title, description, tone: 'cyan'|'purple'|'pink'|'emerald'|'yellow' }

// qrAnalytics - 4 metrics
{ label, value }

// fanAnalytics - 4 metrics  
{ label, value }
```

### Key UI Elements
- Section header with gradient text
- 5 stat cards (responsive grid)
- Two-column layout (timeline left, dashboard right on desktop)
- Live fan activity timeline with connector lines
- Mini artist page card with tags
- QR Analytics panel with mini QR visual
- Fan Analytics panel
- Insight strip
- CTA row at bottom

### Mobile Optimizations Applied
- ✅ Stat cards use `grid-cols-2` → `sm:grid-cols-5`
- ✅ Two-column becomes single column on mobile
- ✅ Tags use `flex-wrap`
- ✅ Text sizes responsive (`text-xl sm:text-2xl`)

### Known Issues/Notes
- Background has heavy blur effects (`blur-[140px]`) - may impact performance
- Uses `animate-pulse` on live indicator dot
- Timeline has hover effects that may not work on touch devices

---

## 4. DemoAnalyticsSnapshot.vue
**File:** `components/marketing/DemoAnalyticsSnapshot.vue`  
**Lines:** 304  
**Purpose:** Full analytics section with KPIs, charts, and fan signals

### Props
None - standalone section component

### Data Structure
```js
// kpis - 5 KPI cards
{ value, label, detail, tone: 'pink'|'cyan'|'purple'|'emerald'|'blue' }

// fanGrowth - 7 day bar chart data
{ day: 'Mon'|'Tue'|..., value: 0-100 }

// sources - Top 5 traffic sources
{ label, value } // value is percentage-like (0-72)

// fanActions - 5 action types
{ label, value }

// fanSignals - 3 recent fan activities
{ name, activity, status, tone }
```

### Key UI Elements
- Section header with live indicator
- 5 KPI cards (responsive grid)
- 3-column analytics grid:
  - Fan Growth bar chart
  - Top Sources progress bars
  - Fan Actions list
- Fan Signal Feed with avatars
- Insight card
- CTA row with SEO copy

### Mobile Optimizations Applied
- ✅ KPI values use `break-words` to prevent overflow
- ✅ Fan signal rows use `min-w-0` and `truncate`
- ✅ 3-column grid becomes 1 column on mobile
- ✅ Responsive font sizes (`text-xl sm:text-2xl lg:text-3xl`)

### Known Issues/Notes
- Background has heavy blur effects (`blur-[130px]`)
- Uses `animate-pulse` on live indicator
- KPI cards have hover transforms that may cause layout shifts

---

## 5. CinematicArtistWorld.vue
**File:** `components/marketing/CinematicArtistWorld.vue`  
**Lines:** 1881  
**Purpose:** Animated background component for the hero section

### Props
None

### Structure
Complex multi-layer animated background:
1. **Deep Layer:** 5 blurred album/poster images
2. **Glow Layer:** 5 animated colored orbs (magenta, purple, cyan, emerald, violet)
3. **Noise/Scanlines:** Texture overlays
4. **Spotlights:** Animated sweeping beams
5. **Atmosphere:** SVG waveform ribbons, crowd silhouette, floating elements
6. **Isometric Grid:** Animated tile grid with signal networks
7. **Data Ticker:** Scrolling stats at bottom

### Performance Optimizations Applied
- ✅ Hidden on mobile/tablet via `hidden lg:block` in parent (`pages/index.vue`)
- ✅ CSS media queries to disable heavy elements:
  - `@media (max-width: 768px)` - hides isometric, atmosphere, ticker, scanlines, noise
  - `@media (max-height: 600px)` - landscape phones
  - `@media (hover: none) and (pointer: coarse)` - touch devices
  - `@media (prefers-reduced-motion: reduce)` - respects user preferences
- ✅ All images use `loading="lazy" decoding="async"`

### Known Issues/Notes
- **HEAVY component** - ~1881 lines of CSS animations
- Uses many CSS filters (blur, brightness, contrast)
- Multiple concurrent animations (parallax, orbs, ribbons, particles)
- Can cause performance issues even on desktop
- Consider further optimization or removal if performance issues persist

---

## Summary of Common Patterns

### Props Convention
All showcase components accept:
- `compact: Boolean` - for reduced padding
- `animated: Boolean` - for glow/blur effects (usually hidden on mobile anyway)

### Data Conventions
- Static demo data in `<script setup>`
- Tone-based coloring: `'pink'|'cyan'|'purple'|'emerald'|'blue'|'yellow'`
- Helper functions for class mapping by tone

### Performance Concerns
1. **Heavy blur effects** in multiple components
2. **`animate-pulse`** usage (4 instances found)
3. **CinematicArtistWorld** is very resource-intensive
4. Background gradients with large blur radii

### Mobile Responsiveness Status
| Component | Status | Notes |
|-----------|--------|-------|
| DemoFanIntelligenceShowcase | ✅ Good | Recently fixed status column stacking |
| DemoArtistProfileShowcase | ✅ Good | Responsive hero, buttons, grids |
| DemoShowGrowthFlow | ✅ Good | Flex-wrap on tags, responsive grids |
| DemoAnalyticsSnapshot | ✅ Good | Truncation, break-words applied |
| CinematicArtistWorld | ✅ Fixed | Hidden on <lg screens |

### Recommended Future Improvements
1. **Remove or reduce `animate-pulse`** - Replace with static indicators or CSS opacity transitions
2. **Further reduce background blur effects** - Consider simpler gradient backgrounds
3. **Lazy load demo components** - Use `v-if` or intersection observer
4. **Add `loading="lazy"`** to all images in demo components
5. **Consider skeleton states** for perceived performance
6. **Test on actual mobile devices** - iOS Safari and Android Chrome
