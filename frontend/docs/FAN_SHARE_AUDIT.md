# MBQ Fan Share Audit & Upgrade Plan

## Date: January 13, 2026

---

## PART 1: CURRENT FAN SHARE SYSTEM AUDIT

### Where is Fan Share Triggered?

1. **ShareBandStrip Component** (`components/ShareBandStrip.vue`)
   - Location: Band profile page footer (line 674-684 in `[bandSlug]/index.vue`)
   - Trigger: User taps "Share {BandName}" button
   - Placement: `FOOTER`
   - Props: `bandId`, `bandSlug`, `bandName`, `bandImageUrl`, `isBandNameInLogo`

2. **FanMomentSection Component** (`components/FanMomentSection.vue`)
   - Location: Band profile page, below footer buttons
   - Trigger: Automatically when moment is earned (QR scan, link click, follow, payment)
   - Shows only when `moment` exists
   - Has caption style toggle (hype/grateful/tease)

### What Copy is Shown Today?

**ShareBandStrip (Generic Band Share):**
```javascript
// Default caption (no moment)
"Been listening to {bandName}. Put someone on 🎧"

// Share text with URL
"Check out {bandName} on MusicBizQR: {url}"
```

**FanMomentSection (Moment-Based):**
```javascript
// Hype style
"I was there for {bandName} 🔥 Live show energy!" // qr_scan
"Just discovered {bandName} 🔥 You need to check them out!" // link_click
"Just followed {bandName} 🔥 Join the fanbase!" // follow
"I backed {bandName} 🔥 Real fans support real music!" // payment
"I was part of the moment for {bandName} 🔥" // default

// Grateful style
"Thanks for the show {bandName} 🙏 Incredible night." // qr_scan
"Proud to support {bandName} 🙏 Every bit helps." // payment
"Grateful to be part of {bandName}'s journey 🙏" // default

// Tease style
"{bandName}… that was just the beginning 👀" // qr_scan
"Something's happening with {bandName}… stay close 👀" // default
```

**Legacy Moment Types in useShareKit:**
```javascript
'I_WAS_THERE' → "I was there. {bandName} was a vibe 🔥"
'FUELED_MOMENTUM' → "I just supported {bandName}. Help them keep it moving 💜"
'PULSE_SURGE' → "{bandName} is heating up right now 🔥"
'AFTER_SHOW_RECAP' → "Last night was wild — {bandName} brought the heat."
```

### What Images Are Generated?

**ShareBandStrip uses `generateShareImage()`:**
- 1080x1080 canvas
- Dark gradient background (#1a0a2e → #0f0f0f → #0a1a1a)
- Decorative purple/emerald circles
- Circular band image (if available)
- Band name (if not in logo)
- Optional moment title
- "Scan • Listen • Follow" tagline
- "via MusicBizQR" branding

**FanMomentSection uses same `generateShareImage()`:**
- Same layout as above
- Adds `momentTitle` as headline
- Adds `locationText` as subtitle

### What Context is Available but UNUSED?

| Context | Source | Currently Used? |
|---------|--------|-----------------|
| Fan's city | Geolocation/IP | ❌ No |
| Fan's visit count | `visitorId` history | ❌ No |
| Time of day | Client time | ❌ No |
| Event proximity | Event dates vs now | ❌ No |
| Session duration | `sessionId` timing | ❌ No |
| Links clicked | `link-click` events | ❌ No |
| Band momentum | `pulseData` | ⚠️ Partially (velocity only) |
| Fan position | `fanPosition` | ✅ Yes |
| QR scan entry | URL params | ✅ Yes |

### What Feels Boring or Generic?

1. **Default share copy is flat:**
   - "Been listening to {bandName}. Put someone on 🎧" — sounds like marketing, not fan voice
   - "Check out {bandName} on MusicBizQR" — mentions platform, not feeling

2. **No city pride:**
   - Fan's city is not used in copy
   - No "Chicago shows up for this band" type messaging

3. **No discovery feeling:**
   - First-time visitors get same copy as returning fans
   - No "I just found something special" moment

4. **No show pride:**
   - After-show energy is not captured
   - No "I was there" unless QR scan triggers it

5. **Image is generic:**
   - Same layout for all share types
   - No emotional headline on image
   - Looks like a band card, not a fan statement

6. **No reward feeling:**
   - Fan doesn't feel special for sharing
   - No "You're fan #47 today" type messaging in share

---

## PART 2: FAN SHARE MENTAL MODEL

### Clear Distinction

| Aspect | Band Shareables | Fan Shares |
|--------|-----------------|------------|
| **Audience** | Artist (dashboard) | Fan (public page) |
| **Driver** | Analytics data | Emotion/identity |
| **Purpose** | Show band success | Express fan pride |
| **Tone** | "Look at these stats" | "Look at who I support" |
| **Visual** | Data cards, hero stats | Poster energy, feeling |
| **Complexity** | Advanced (customize drawer) | Simple (fast share) |

### Fan Share Core Emotions

1. **Pride** — "I support this band"
2. **Discovery** — "I found something special"
3. **Belonging** — "I'm part of this"
4. **Moment-in-time** — "I was here"

### Fan Share Should Communicate

> "This post says something about *me* for supporting this band."

---

## PART 3: FAN SHARE MOMENT TYPES (V1)

### 1. FIRST_DISCOVERY
- **Trigger:** First scan / first visit (no prior `visitorId` history)
- **Feeling:** Discovery, excitement
- **Copy vibe:** "Just found something special"
- **Visual:** Fresh, bright, discovery energy

### 2. AFTER_SHOW_FAN
- **Trigger:** Scan near event time/location (within 4 hours of event)
- **Feeling:** "I was there"
- **Copy vibe:** "This band owned the night"
- **Visual:** Night energy, show pride

### 3. CITY_SUPPORT
- **Trigger:** Fan city matches band momentum city (from pulse data)
- **Feeling:** City pride, local support
- **Copy vibe:** "Chicago shows up for this band"
- **Visual:** City name prominent

### 4. RETURNING_FAN
- **Trigger:** Fan returns after previous visit (>24h gap)
- **Feeling:** Loyalty, devotion
- **Copy vibe:** "I'm officially a fan now"
- **Visual:** Warm, loyal energy

### 5. SUPER_FAN_ACTION
- **Trigger:** Fan clicks multiple links / stays long (>90s session)
- **Feeling:** Devotion, deep engagement
- **Copy vibe:** "This band deserves attention"
- **Visual:** Deep engagement energy

---

## PART 4: FAN SHARE COPY UPGRADE

### Rules
- 1–2 lines max
- Written in first person (fan voice)
- Never sounds like marketing
- Optional emoji allowed
- Must feel natural on Instagram / Stories

### Proposed Copy Sets

#### FIRST_DISCOVERY
```
Hype:    "Just found something special 🔥"
Grateful: "New favorite artist. You're welcome 🙏"
Tease:   "You're about to hear a lot more about this band 👀"
```

#### AFTER_SHOW_FAN
```
Hype:    "This band owned the night 🎤"
Grateful: "What a show. Still processing 🙏"
Tease:   "If you weren't there… you missed out 👀"
```

#### CITY_SUPPORT
```
Hype:    "{City} shows up for this band 🔥"
Grateful: "Proud to rep {City} for {bandName} 🙏"
Tease:   "{City} knows something you don't 👀"
```

#### RETURNING_FAN
```
Hype:    "I'm officially a fan now 🔥"
Grateful: "Back again. This band just hits different 🙏"
Tease:   "Yeah, I'm hooked 👀"
```

#### SUPER_FAN_ACTION
```
Hype:    "This band deserves your attention 🔥"
Grateful: "Spent way too long on this page. Worth it 🙏"
Tease:   "Trust me on this one 👀"
```

#### DEFAULT (No specific moment)
```
Hype:    "Put someone on 🔥"
Grateful: "Supporting real music 🙏"
Tease:   "You'll thank me later 👀"
```

---

## PART 5: FAN SHARE IMAGE UPGRADE

### Design Direction

**Fan share image = poster energy, not report card**

### Layout (1080x1080)

```
┌────────────────────────────────────────┐
│                                        │
│         [Subtle accent glow]           │
│                                        │
│           ┌──────────┐                 │
│           │  BAND    │                 │
│           │  IMAGE   │                 │
│           │ (circle) │                 │
│           └──────────┘                 │
│                                        │
│     ─────────────────────────          │
│                                        │
│        "JUST FOUND SOMETHING           │
│              SPECIAL 🔥"               │
│                                        │
│           ─ {bandName} ─               │
│                                        │
│     ─────────────────────────          │
│                                        │
│        Scan • Listen • Follow          │
│                                        │
│          via MusicBizQR                │
│                                        │
└────────────────────────────────────────┘
```

### Visual Rules

| Element | Fan Share | Band Shareable |
|---------|-----------|----------------|
| Hero stat | ❌ No | ✅ Yes |
| Emotional headline | ✅ Yes (bold, centered) | ❌ No |
| Band image | ✅ Centered, large | ✅ Smaller |
| Data/proof | ❌ No | ✅ Yes |
| Accent glow | ✅ Subtle | ✅ Behind hero |
| Vibe | Poster | Report card |

### What to Include
- Band logo or image (centered, prominent)
- Bold emotional headline (from fan moment)
- Band name (subtle, below headline)
- "Scan • Listen • Follow"
- "via MusicBizQR" branding

### What NOT to Include
- Analytics stats ("47 fans")
- Window labels ("Last 24h")
- Proof lines
- Dashboard-style cards

---

## PART 6: FAN SHARE FLOW UX

### Current Flow (Too Complex)
1. Fan taps Share
2. Web Share API fires immediately
3. If fails, copy link + download image
4. No preview, no context

### Proposed Flow (Simple + Rewarding)

```
┌─────────────────────────────────────┐
│                                     │
│  Fan taps "Share {bandName}"        │
│              ↓                      │
│  ┌─────────────────────────────┐    │
│  │   QUICK PREVIEW CARD        │    │
│  │                             │    │
│  │   "Just found something     │    │
│  │        special 🔥"          │    │
│  │                             │    │
│  │      [{bandName}]           │    │
│  │                             │    │
│  │   [Share Now]  [Cancel]     │    │
│  └─────────────────────────────┘    │
│              ↓                      │
│  Share happens immediately          │
│                                     │
└─────────────────────────────────────┘
```

### Key Differences from Band Shareables

| Aspect | Fan Share | Band Shareable |
|--------|-----------|----------------|
| Preview | Quick card (1 tap) | Full drawer |
| Caption toggle | ❌ No (auto-selected) | ✅ Yes |
| Customize | ❌ No | ✅ Yes |
| Speed | Fast (2 taps max) | Deliberate |
| Feeling | Impulse | Crafted |

---

## PART 7: FUTURE FAN REWARDS (HOOKS ONLY)

### Data Structure Hooks

The current `fan-moment` content type can support:

```javascript
{
  // Existing
  visitorId: string,
  bandId: number,
  momentType: string,
  actionType: string,
  context: {
    bandName: string,
    city: string,
    eventName: string,
    // ...
  },
  
  // Future hooks (no build yet)
  badges: [], // Array of earned badge IDs
  shareStreak: 0, // Consecutive shares
  totalShares: 0, // Lifetime shares for this band
  firstVisitAt: Date, // For "OG fan" badge
  supporterTier: null, // For payment-based tiers
}
```

### Future Features (Document Only)

1. **Fan Badges**
   - "First 100 Fans"
   - "Show Survivor"
   - "City Rep"
   - "Super Supporter"

2. **"You Were There" Receipts**
   - Permanent proof of attendance
   - Shareable after event

3. **Supporter Walls**
   - Public list of top supporters
   - Opt-in only

4. **Share Streaks**
   - "3-day streak" badge
   - Gamification of sharing

---

## IDENTIFIED WEAKNESSES

1. **Copy is generic** — same for all fans, all contexts
2. **No city awareness** — fan's city is ignored
3. **No discovery moment** — first-timers get same treatment
4. **No show pride** — after-show energy is lost
5. **Image is flat** — no emotional headline, looks like a card
6. **Flow is abrupt** — no preview, no reward feeling
7. **No distinction** — fan shares look like band shareables

---

## SEPARATION: FAN SHARES vs BAND SHAREABLES

| Aspect | Fan Shares | Band Shareables |
|--------|------------|-----------------|
| Location | Band profile page | Dashboard |
| Audience | Fans | Artists |
| Trigger | User action | Analytics |
| Copy | First-person, emotional | Third-person, data |
| Image | Poster energy | Report card |
| Flow | Fast, simple | Deliberate, customizable |
| Purpose | Fan expression | Artist promotion |

---

## NEXT STEPS

1. ✅ Audit complete
2. ⏳ Implement fan moment type detection
3. ⏳ Upgrade copy per moment type
4. ⏳ Create fan share image generator (poster style)
5. ⏳ Simplify fan share flow (quick preview)
6. ⏳ Add city awareness
7. ⏳ Test and verify

---

## END OF AUDIT
