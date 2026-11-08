# MusicBizQR — Show Mode + Check-In + Share System
## Full Context for Building Shareable "I Was There" Badges

---

## 1. Platform Overview

- **Frontend**: Nuxt 3 + Vue 3 Composition API, TailwindCSS
- **Backend**: Strapi v4 + PostgreSQL, deployed on Railway
- **Image Generation**: Two systems exist:
  - **Server-side OG images**: Satori (JSX-to-SVG) → Resvg (SVG-to-PNG) at `server/api/og/band/[...slug].ts`
  - **Client-side share images**: HTML Canvas API at `utils/fanShare/imageGenerator.js`
- **Share Infrastructure**: `composables/useShareKit.js` — full Web Share API, clipboard, download, Facebook share, image proxy, tracking

---

## 2. Show Mode System

### Band Schema Fields (Strapi `api::band.band`)
```
showModeEnabled: boolean (default false)
showModeStatus: enum [off, scheduled, live] (default off)
showModeType: enum [manual, event] (default null)
showModeStartedAt: datetime
showModeEndsAt: datetime
showModeActivatedAt: datetime
showModeEventId: integer
showModeTitle: string (e.g. "Summer Vibes Tour")
showModeVenue: string (e.g. "The Roxy")
showModeCity: string (e.g. "Los Angeles")
showModeRegion: string (e.g. "CA")
showModeCountry: string (e.g. "US")
showModeTimezone: string (e.g. "America/Los_Angeles")
showModeSourceDetail: enum [manual_dashboard, event_auto, qr_poster, etc.]
showModeCampaignId: string (unique per show session)
showModeMetadata: json
showModeAutoManaged: boolean
showModeScheduledStartAt: datetime
showModeScheduledEndAt: datetime
showModeLastAutoDeactivatedAt: datetime
showModeLastManualOverrideAt: datetime
```

### How Show Mode Works
- Band owners toggle show mode from the dashboard (manual) or it auto-activates from scheduled events.
- When `showModeEnabled: true` and `showModeStatus: 'live'`, the band page transforms:
  - Fan capture sections get show-mode context
  - A floating "Check In" CTA button appears at page bottom
  - All captured fans get tagged with show mode metadata (captureContext, campaignId, etc.)
- Show mode is rendered at the page level in `pages/[bandSlug]/index.vue` which orchestrates all band templates (Compact, Cybered, Bold, Default).

---

## 3. Show Check-In Flow

### Frontend Components

**`ShowCheckInModal.vue`** — Premium modal with state machine:
- **States**: `idle` → `identity_needed` → `submitting` → `success` | `already_checked_in` | `error`
- **Props**: `isOpen`, `bandId`, `bandName`, `showTitle`, `venue`, `city`, `eventId`, `campaignId`, `fanEmail`
- **Emits**: `close`, `success`, `already-checked-in`, `error`
- **Success state** currently renders `<ShowCheckInRewardSlot />` — a placeholder for the badge system
- Collects email + optional first name, submits to backend

**`ShowCheckInRewardSlot.vue`** — Placeholder component:
- Currently shows "Fan Badges Coming Soon" with a trophy icon
- Props: `badgeData`, `showShareOptions`, `attendanceData`
- Has commented-out share buttons ready for implementation
- **This is where the shareable badge will be integrated**

**`ShowCheckInButton.vue`** — Simple trigger button that emits `open-check-in-modal`

**`FanCaptureSection.vue`** — After fan subscribes during show mode, shows a "Check In Now" button that emits `open-check-in-modal`

### Page-Level Wiring (`pages/[bandSlug]/index.vue`)
```vue
<ShowCheckInModal
  :is-open="checkInModalOpen"
  :band-id="band?.data?.id"
  :band-name="band?.data?.name"
  :show-title="band?.data?.showModeTitle || ''"
  :venue="band?.data?.showModeVenue || ''"
  :city="band?.data?.showModeCity || ''"
  :event-id="band?.data?.showModeEventId || null"
  :campaign-id="band?.data?.showModeCampaignId || ''"
  :fan-email="checkInFanEmail"
  @close="checkInModalOpen = false"
  @success="onCheckInSuccess"
  @already-checked-in="onCheckInSuccess"
  @error="onCheckInError"
/>
```
Plus a floating CTA button visible during show mode (fixed bottom center, premium gradient styling).

### Backend Check-In API

**Route**: `POST /api/fan-interactions/check-in` (public, no auth required)

**Controller** (`fan-interaction/controllers/fan-interaction.js`):
- Validates required fields (bandId, fanEmail)
- Extracts location from headers
- Calls `processShowCheckIn` service

**Service** (`fan-interaction/services/fan-interaction.js` → `processShowCheckIn`):
1. Looks up band with show mode fields
2. Resolves effective IDs (campaignId, eventId, venue, city, showTitle) from request or band's show mode
3. Looks up event data if eventId exists (for time window awareness)
4. Determines verification level (self_reported → show_mode_live if show mode active)
5. Determines event status (before_show, during_show, after_show, unknown)
6. Finds or creates fan record
7. Checks for duplicate attendance (by campaignId → eventId → 24hr time window)
8. If not duplicate: updates fan stats, calculates confidence score, generates timeline label
9. Creates `fan-interaction` record (type: checked_in_show)
10. Creates `fan-show-attendance` record (the core attendance record)
11. Returns success response with attendance data

**Response on success**:
```json
{
  "success": true,
  "alreadyCheckedIn": false,
  "fanId": 123,
  "attendanceId": 456,
  "showTitle": "Summer Vibes Tour",
  "venue": "The Roxy",
  "city": "Los Angeles",
  "checkedInAt": "2025-03-13T20:30:00.000Z",
  "confidenceScore": 85,
  "isNewFan": false,
  "timelineLabel": "Checked in at The Roxy — Los Angeles"
}
```

**Response on duplicate**:
```json
{
  "success": true,
  "alreadyCheckedIn": true,
  "fanId": 123,
  "attendanceId": 456,
  "message": "You're already checked in for tonight!",
  "duplicateReason": "campaign"
}
```

---

## 4. Fan Show Attendance Schema (`api::fan-show-attendance.fan-show-attendance`)

This is the core record that the badge/share should be generated from:

```
fan: relation → api::fan.fan (manyToOne)
band: relation → api::band.band (manyToOne)
event: relation → api::event.event (manyToOne)
campaignId: string
checkedInAt: datetime (required)
venue: string
city: string
region: string
country: string
timezone: string
showTitle: string
showDate: date
verificationLevel: enum [self_reported, show_mode_live, event_qr_scan, geo_supported, staff_verified]
checkInSource: enum [show_banner, fan_capture_followup, direct_checkin_button, qr_scan, recap_link, event_page]
eventStatus: enum [before_show, during_show, after_show, unknown]
showModeSessionId: string
confidenceScore: integer (0-100, default 50)
isNewFanAtCheckIn: boolean (default false)
fanInteraction: relation → api::fan-interaction.fan-interaction (oneToOne)
suppressedDuplicate: boolean (default false)
badgeEligible: boolean (default true)
badgeIssuedAt: datetime
timelineLabel: string (e.g. "Checked in at The Roxy — Los Angeles")
metadata: json
```

### Confidence Score Calculation
Base score: 50, plus:
- Show mode was active: +30
- During show window: +25
- Has event link: +15
- Has campaign ID: +10
- Has venue info: +10
- Has city info: +5
- Is new fan: +5
- Verification bonuses: event_qr_scan +15, geo_supported +10, staff_verified +25

### Duplicate Detection Priority
1. By `campaignId` (same fan + band + campaign)
2. By `eventId` (same fan + band + event)
3. By time window (same fan + band within 24 hours)

---

## 5. Fan Schema (`api::fan.fan`)

Key fields relevant to check-in:
```
email: string (required)
firstName: string
status: enum [subscribed, unsubscribed]
source: enum [band_page, follow_modal, import, manual, show_mode, other]
subscribedAt: datetime (required)
band: relation → api::band.band
city, region, country, timezone: strings
firstSeenAt, lastSeenAt: datetime
capturedDuringShowMode: boolean
capturedAtEventId: integer
captureContext: enum [normal, show_mode, release_mode, merch_mode]
captureSurface: enum [band_page, follow_modal, qr_poster, qr_merch_table, etc.]
captureCampaignId: string
checkedInShowCount: integer (default 0)
lastCheckedInAt: datetime
demo: boolean (default false) — for test data cleanup
```

---

## 6. Existing Share/Image Generation System

### A. Server-Side OG Images (`server/api/og/band/[...slug].ts`)
- Uses **Satori** (converts JSX-like objects to SVG) + **Resvg** (converts SVG to PNG)
- Generates 1200×630 OG images for social media previews
- Fetches band data from Strapi, renders band image + name + branding
- Dark cinematic gradient background with purple/blue/emerald orb effects
- Served at `/api/og/band/[bandSlug].png`
- Cached with `Cache-Control: public, max-age=3600`
- Uses Google Fonts Inter via CDN

### B. Client-Side Canvas Image Generator (`utils/fanShare/imageGenerator.js`)
- Uses HTML **Canvas 2D API** to generate 1080×1080 share images
- "Poster energy" — emotion-driven, not data-driven
- Features:
  - Band image (circular clipped) with accent glow
  - Bold emotional headline with gradient fill (pink → violet → emerald)
  - Band name display
  - "Scan • Listen • Follow" tagline
  - "via MusicBizQR" branding
  - Text wrapping and auto-fit font sizing utilities
- Accent color system mapped to moment types:
  ```
  FIRST_DISCOVERY → violet (#8B5CF6)
  AFTER_SHOW_FAN → rose (#F43F5E)
  CITY_SUPPORT → blue (#3B82F6)
  RETURNING_FAN → emerald (#10B981)
  SUPER_FAN_ACTION → amber (#F59E0B)
  DEFAULT → violet
  ```

### C. Share Kit Composable (`composables/useShareKit.js`)
Full sharing infrastructure with:
- **Image generation**: `generateShareImage()`, `generateFanShareImage()`, `generateShareCardImage()`
- **Image loading**: Multi-strategy (proxy for CORS, direct, blob fetch, fallback)
- **Share methods**: `webShare()`, `copyToClipboard()`, `downloadBlob()`, `openFacebookSharer()`
- **With tracking**: `webShareWithTracking()`, `copyLinkWithTracking()`, `downloadImageWithTracking()`
- **Share URL building**: `buildShareUrl()`, `buildShareUrlWithAttribution()`
- **Fan copy system**: `getFanCaption()`, `getFanHeadline()`, `getAllCaptions()`, `detectFanMomentType()`
- All integrated with backend pulse tracking via `POST /api/pulse/shareables/track`

### D. Fan Moment Copy System (`utils/fanShare/copy.js`)
Identity-driven copy for fan shares:
- **Moment types**: FIRST_DISCOVERY, AFTER_SHOW_FAN, CITY_SUPPORT, RETURNING_FAN, SUPER_FAN_ACTION, DEFAULT
- **Caption styles per type**: hype, grateful, tease
- **Headlines for images**: "JUST FOUND SOMETHING SPECIAL", "I WAS THERE", "{CITY} SHOWS UP", etc.
- Template variable replacement for `{bandName}`, `{city}`, `{CITY}`
- Auto-detection of moment type based on fan context (isFirstVisit, isNearEvent, etc.)

### E. Share Drawer Components
- **`ShareDrawer.vue`**: General band share drawer with image preview, Web Share, clipboard, download, Facebook
- **`MomentShareDrawer.vue`**: Moment-specific share drawer with caption style selector
- Both use canvas refs for client-side image generation with caching (30s TTL)

---

## 7. What Needs to Be Built: Shareable "I Was There" Badge

### Integration Points
1. **`ShowCheckInRewardSlot.vue`** — Currently a placeholder. This is where the badge renders after successful check-in.
2. **`ShowCheckInModal.vue`** success state — Already renders `<ShowCheckInRewardSlot />` at line 187.
3. **`fan-show-attendance` schema** — Already has `badgeEligible`, `badgeIssuedAt`, `timelineLabel` fields ready.
4. **Existing image generator** — Can be extended or a new badge-specific generator can be created.
5. **Existing share kit** — Full sharing infrastructure ready to use.

### Data Available for Badge
From the check-in response and attendance record:
- `bandName`, `bandId`
- `showTitle` (e.g. "Summer Vibes Tour")
- `venue` (e.g. "The Roxy")
- `city` (e.g. "Los Angeles")
- `checkedInAt` (datetime)
- `showDate` (date)
- `confidenceScore` (0-100)
- `verificationLevel` (self_reported, show_mode_live, etc.)
- `timelineLabel` (e.g. "Checked in at The Roxy — Los Angeles")
- `isNewFanAtCheckIn` (boolean)
- Band image URL (from band data)
- `eventStatus` (before_show, during_show, after_show)

### Suggested Badge Features
1. **Visual badge card** — Canvas-generated 1080×1080 image with band photo, "I WAS THERE" headline, show details (venue, city, date), fan name (optional), MusicBizQR branding
2. **Share drawer** — Reuse `MomentShareDrawer.vue` pattern with badge-specific copy
3. **Multiple share channels** — Instagram stories, SMS, clipboard, download (all already built in useShareKit)
4. **Badge copy variants** — Use the existing moment type system, extend with CHECK_IN specific copy
5. **Attendance proof** — Show confidence score as a visual element (e.g. "Verified Attendee" badge if score > 70)

### File Structure Suggestion
```
components/band/ShowCheckInBadge.vue          — Badge display component
components/band/ShowCheckInBadgeShare.vue      — Badge share drawer
utils/fanShare/badgeImageGenerator.js          — Badge-specific canvas image generator
```

Or extend existing files:
- Upgrade `ShowCheckInRewardSlot.vue` to render the actual badge
- Add badge image generation to `utils/fanShare/imageGenerator.js`
- Add badge copy to `utils/fanShare/copy.js`
- Add badge share to `composables/useShareKit.js`

---

## 8. Design Language Reference

### Color Palette (consistent across all share images)
- Background: `#1a0a2e` → `#0f0f0f` → `#0a1a1a` (deep cinematic gradient)
- Purple accent: `#8B5CF6` / `rgba(139, 92, 246, 0.3)`
- Blue accent: `#3B82F6` / `rgba(59, 130, 246, 0.3)`
- Emerald accent: `#10B981` / `rgba(16, 185, 129, 0.3)`
- Rose accent: `#F43F5E` / `rgba(244, 63, 94, 0.3)`
- Amber accent: `#F59E0B` / `rgba(245, 158, 11, 0.3)`
- Pink: `#ec4899`
- Text: white with various opacity levels (0.35 to 1.0)

### Typography
- System font stack: `system-ui, -apple-system, sans-serif`
- Server-side: Inter via Google Fonts CDN
- Hero text: weight 900, gradient fills
- Headlines: weight 900, 40-64px
- Body: weight 600, 28-36px
- Branding: weight 400-600, 22-28px

### Visual Elements
- Circular band images with accent glow borders
- Radial gradient orbs for ambient effects
- Decorative thin lines as separators
- "Scan • Listen • Follow" tagline
- "via MusicBizQR" branding
- Canvas size: 1080×1080 (client), 1200×630 (server OG)
