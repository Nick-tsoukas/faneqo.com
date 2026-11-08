# MBQ Dashboard Shareables Audit

## Date: February 5, 2026

---

## OVERVIEW

The **Shareables** feature on the dashboard allows artists to share pre-generated "shareable cards" based on their fan activity data. These cards are designed to be posted on social media to promote the artist.

**Location:** Dashboard → Shareables Section

---

## ARCHITECTURE

### Key Files

| File | Purpose |
|------|---------|
| `components/dashboard/ShareablesSection.vue` | Main container, fetches data, renders tabs and cards |
| `components/dashboard/shareables/ShareableCard.vue` | Individual card rendering |
| `components/shareables/ShareCustomizeDrawer.vue` | Drawer for customizing and sharing a card |
| `utils/shareables/mappings.js` | Card type definitions, tab mappings, accent colors |
| `utils/shareables/fixtures.js` | Mock data for testing (10 card types + edge cases) |
| `composables/useShareableTypes.js` | Legacy composable (partially duplicated) |
| `composables/useShareKit.js` | Share utilities, image generation, tracking |

### Data Flow

```
Dashboard
    └── ShareablesSection (props: bandId, bandSlug, bandName, bandImageUrl, isBandNameInLogo)
            │
            ├── Fetches from: ${strapiUrl}/api/pulse/shareables?bandId=${bandId}
            ├── Fetches from: ${strapiUrl}/api/fan-moments/auto-active?bandId=${bandId}
            │
            ├── Normalizes cards with band context
            │
            └── Renders ShareableCard for each card
                    │
                    └── On click → Opens ShareCustomizeDrawer
                            │
                            ├── Generates share image (canvas)
                            ├── Caption style toggle (hype/grateful/tease)
                            └── Share actions (Web Share, Copy, Download, Instagram, Facebook)
```

---

## THE 10 V1 CARD TYPES

| Type | Tab | Accent | Description |
|------|-----|--------|-------------|
| `CITY_CLAIM` | spikes | violet | "Chicago is heating up" - top city by traffic |
| `MOMENTUM_SURGE` | spikes | blue | "+127% activity" - growth spike |
| `AFTER_SHOW_ENERGY` | recaps | rose | Post-show interaction recap |
| `NEW_CITY_UNLOCKED` | prompts | emerald | First fans from a new city |
| `RETURNING_FANS` | prompts | amber | Loyalty metric (% returning) |
| `SHARE_CHAIN` | prompts | blue | Links being shared organically |
| `ENGAGED_SESSIONS` | prompts | violet | Time on page / attention metric |
| `PLATFORM_PULL` | prompts | emerald | Top platform clicks (Spotify, Apple, etc.) |
| `PEAK_HOUR` | spikes | amber | Best time of day for engagement |
| `MILESTONE_DROP` | prompts | rose | Achievement unlocked (500 interactions, etc.) |

### Additional Pulse Moment Types (Real-time)

| Type | Tab | Accent | Description |
|------|-----|--------|-------------|
| `PULSE_SURGE` | moments | amber | Real-time activity spike |
| `CITY_HEAT` | moments | blue | City-specific surge |
| `MOMENT_MATTERED` | moments | violet | Significant fan moment |

---

## CARD DATA STRUCTURE

```javascript
{
  id: 'CITY_CLAIM:24h:Chicago',
  type: 'CITY_CLAIM',
  window: '24h',
  windowLabel: 'Last 24h',
  headline: '📍 CHICAGO IS HEATING UP',
  hero: '47 FANS',
  proof: '62% OF TRAFFIC • LAST 24H',
  microCaption: {
    hype: 'Chicago is showing love 🔥',
    grateful: 'Chicago, thank you 🙏',
    tease: 'Chicago… we see you 👀',
  },
  accent: 'violet',
  context: { city: 'Chicago', count: 47, sharePct: 62, window: '24h' },
  score: 83,
}
```

### After Normalization (UI)

```javascript
{
  ...card,
  category: 'spikes', // derived from type
  selectedCaptionStyle: 'hype',
  band: {
    id: 123,
    slug: 'my-band',
    name: 'My Band',
    imageUrl: '/uploads/band.jpg',
    isBandNameInLogo: false,
  },
  share: {
    shareUrl: 'https://musicbizqr.com/my-band',
    ogUrl: 'https://musicbizqr.com/share/band/my-band',
  },
}
```

---

## CURRENT STATUS & ISSUES

### ✅ Working (Verified)

1. **Card rendering** - All 10 card types render correctly
2. **Tab filtering** - Recommended, Recaps, Spikes, Prompts tabs work
3. **Mock data mode** - `?shareables=mock` loads fixture data
4. **Edge case mode** - `?shareables=edge` loads edge case fixtures
5. **Share drawer** - Opens on card click, shows preview
6. **Caption toggle** - Hype/Grateful/Tease styles work
7. **Copy link** - Works
8. **Copy caption** - Works
9. **Download image** - Works
10. **Instagram kit** - Downloads image + copies caption
11. **Facebook share** - Opens sharer with OG URL

### ✅ Backend API (Verified in Strapi)

1. **GET `/api/pulse/shareables`** - ✅ EXISTS
   - Route: `src/api/analytics/routes/analytics.js` line 122-127
   - Controller: `src/api/analytics/controllers/shareables.js`
   - Service: `src/api/analytics/services/shareables.js` (1300+ lines, full implementation)
   - Evaluates all 10 card types with thresholds, scoring, and cooldowns

2. **POST `/api/pulse/shareables/track`** - ✅ EXISTS
   - Route: `src/api/analytics/routes/analytics.js` line 128-134
   - Tracks share actions with bandId, cardType, action, etc.

3. **GET `/api/image-proxy`** - ✅ EXISTS
   - Route: `src/api/analytics/routes/analytics.js` line 135-141
   - Proxies external images (S3, Cloudinary) for CORS

### ⚠️ Potential Issues

1. **Pulse moments API** - `${strapiUrl}/api/fan-moments/auto-active?bandId=${bandId}`
   - **Status:** Unknown if this endpoint exists
   - **Impact:** "⚡ Moments" tab may always be empty
   - **Note:** This is separate from shareables - it's for real-time surges

2. **Empty cards for new bands** - If a band has no analytics data (page views, link clicks), no cards will be generated
   - **Thresholds are strict:** e.g., CITY_CLAIM requires 15+ fans from top city AND 40%+ share
   - **This is by design:** "If a card appears, the band should instantly understand WHY"

### ❌ Known Issues

1. **ENGAGED_SESSIONS card** - Always skipped because `avgTimeOnPageSec` is not tracked
   - Service returns `avgTimeOnPageSec: null` (line 408 in shareables.js)
   - Would need session duration tracking to enable this card

2. **NEW_CITY_UNLOCKED** - Uses simplified "new city" detection
   - Currently marks cities with 3-10 fans as "new" (heuristic)
   - Would need historical city data for accurate detection

---

## API ENDPOINTS (All Verified in Strapi)

### 1. GET `/api/pulse/shareables` ✅

**Query params:** `bandId`, `windows` (optional), `dev` (optional)

**Response:**
```json
{
  "ok": true,
  "bandId": 123,
  "generatedAt": "2026-02-05T12:00:00Z",
  "recommended": [...top 4 cards by score],
  "cards": [...all cards]
}
```

### 2. GET `/api/fan-moments/auto-active`

**Query params:** `bandId`

**Response:**
```json
{
  "ok": true,
  "moment": {
    "id": 1,
    "momentType": "CITY_HEAT",
    "shareTitle": "Chicago is surging",
    "expiresAt": "2026-02-05T13:00:00Z",
    "context": {
      "cityName": "Chicago",
      "velocity": "3.2"
    }
  }
}
```

### 3. POST `/api/pulse/shareables/track`

**Body:**
```json
{
  "bandId": 123,
  "shareableId": "CITY_CLAIM:24h:Chicago",
  "cardType": "CITY_CLAIM",
  "window": "24h",
  "accent": "violet",
  "captionStyle": "hype",
  "placement": "drawer",
  "action": "webShare"
}
```

### 4. GET `/api/image-proxy`

**Query params:** `url` (encoded external image URL)

**Response:** Proxied image with CORS headers

---

## TESTING

### Mock Mode

Add `?shareables=mock` to dashboard URL to load fixture data.

### Edge Case Mode

Add `?shareables=edge` to dashboard URL to test:
- Long headlines
- Long hero text
- Missing microCaption (null)
- Missing band image
- Unknown accent color
- Score = 0
- Score = 100

### Debug Panel

In dev mode, a debug panel appears at the bottom of the Shareables section:
- Shows current mode (live/mock/edge)
- Shows card count and scores
- Buttons to switch between modes

---

## QA CHECKLIST

From `ShareablesSection.vue`:

- [ ] QA-1: All 10 card types render without overflow
- [ ] QA-2: Headlines wrap to max 2 lines (never clip)
- [ ] QA-3: Hero text never clips (shrinks if needed)
- [ ] QA-4: Missing microCaption falls back safely (empty string)
- [ ] QA-5: Missing band image uses placeholder circle
- [ ] QA-6: Unknown accent uses safe default (violet)
- [ ] QA-7: Clicking ANY card opens Customize drawer
- [ ] QA-8: Clicking Share button opens Customize drawer
- [ ] QA-9: Mock and Live modes behave identically
- [ ] QA-10: Edge cases render without errors

---

## SHARE IMAGE GENERATION

The `generateShareCardImage()` function in `useShareKit.js` creates a 1080x1080 PNG:

### Layout (Full Card)

```
┌────────────────────────────────────────┐
│     [Accent orb glow - top right]      │
│                                        │
│           ┌──────────┐                 │
│           │  BAND    │                 │
│           │  IMAGE   │                 │
│           │ (circle) │                 │
│           └──────────┘                 │
│                                        │
│     📍 CHICAGO IS HEATING UP           │  ← Headline (2 lines max)
│                                        │
│           47 FANS                      │  ← Hero (gradient text)
│        ─────────────                   │
│     62% OF TRAFFIC • LAST 24H          │  ← Proof
│                                        │
│   "Chicago is showing love 🔥"         │  ← Caption (optional)
│                                        │
│           — My Band —                  │  ← Band name
│                                        │
│        Scan • Listen • Follow          │
│          via MusicBizQR                │
│                                        │
│     [Accent orb glow - bottom left]    │
└────────────────────────────────────────┘
```

### Layout (Band Share Only - no card data)

```
┌────────────────────────────────────────┐
│                                        │
│           ┌──────────┐                 │
│           │  BAND    │                 │
│           │  IMAGE   │  (larger)       │
│           │ (circle) │                 │
│           └──────────┘                 │
│                                        │
│           My Band                      │
│           ─────────                    │
│                                        │
│        Scan • Listen • Follow          │
│          via MusicBizQR                │
│                                        │
└────────────────────────────────────────┘
```

---

## RELATED FEATURES

### Fan Shares (Different System)

See `docs/FAN_SHARE_AUDIT.md` for the **fan-side** share system (on band profile pages).

| Aspect | Dashboard Shareables | Fan Shares |
|--------|---------------------|------------|
| Location | Dashboard | Band profile page |
| Audience | Artists | Fans |
| Trigger | Analytics data | User action |
| Tone | "Look at these stats" | "Look at who I support" |
| Visual | Data cards, hero stats | Poster energy |
| Complexity | Advanced (customize drawer) | Simple (fast share) |

### ShareQrDrawer

`components/ShareQrDrawer.vue` - Full-screen QR code share modal (different from Shareables).

---

## NEXT STEPS

1. **Verify Strapi endpoints exist** - Check if `/api/pulse/shareables` etc. are implemented
2. **If missing, implement endpoints** - Or use mock data permanently
3. **Test with real band data** - Ensure cards generate correctly
4. **Add share tracking** - If endpoint exists, verify tracking works
5. **Consider caching** - Cards could be cached to reduce API calls

---

## CHANGELOG

- **2026-02-05:** Initial audit created

