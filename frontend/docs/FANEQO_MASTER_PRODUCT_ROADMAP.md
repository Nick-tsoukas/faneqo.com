# Faneqo Master Product Roadmap

Durable product direction for Faneqo.

This file is **not** the live status board. Live status lives in `docs/FANEQO_CURRENT_PHASE.md`. Exact next-session work lives in `docs/FANEQO_NEXT_AGENT_HANDOFF.md`. Design doctrine lives in `docs/FANEQO_DESIGN_NORTH_STAR.md`.

Older plans, audits, and visual notes may contain history. They must not override the four canonical docs.

---

## Document hierarchy

1. `docs/FANEQO_DESIGN_NORTH_STAR.md` — durable design / product principles
2. `docs/FANEQO_MASTER_PRODUCT_ROADMAP.md` — this file
3. `docs/FANEQO_CURRENT_PHASE.md` — what is happening now
4. `docs/FANEQO_NEXT_AGENT_HANDOFF.md` — exact continuation instructions

---

# Product North Star

Faneqo is the digital world around:

**ARTISTS → NIGHTS → FANS → PHOTOS / STORY / MESSAGES → RELATIONSHIP → MEMORY**

Faneqo turns the real relationship between an artist, a Night, and the people in the room into something they can communicate, revisit, and keep.

- Artist: “We made this Night.”
- Fan: “I experienced this Night.”

Core test: would an artist open Faneqo the morning after a show because they **want** to see their Night?

There is one Artist World with different rooms. The Artist Page is one window into that world, not the entire product.

Temporal model: **BEFORE = Manage · DURING = Live · AFTER = Remember.**

Core loop:

```
ARTIST → SHOW MODE → NIGHT → FAN CHECK-IN
  → STORY / LINEUP / POSTER → GALLERIES → MESSAGES
  → FAN EXPERIENCE → PASSPORT → RELATIONSHIP CONTINUES
```

---

# Design Principles

390px is the canonical mobile canvas.

Feel: minimal, expensive, precise, native-feeling, dark, calm, cinematic, personal, music-native, editorial, relationship-centered.

**Expensive** means precision, restraint, spacing, typography, photography, hierarchy, interaction states, continuity, performance, and accessibility. It does **not** mean more effects, blur, shadows, gradients, animation, or 3D.

Faneqo color is earned, not wallpaper. White is earned too. Gray is hierarchy, not decoration. Action-leading text must never look disabled.

Motion communicates state, causality, continuity, and relationship. CSS and Motion for Vue first. GSAP only when choreography truly earns it. Rive only for signature meaning. Atropos is a future experiment only.

Photography and artist identity beat chrome.

---

# Locked Foundations

Do not structurally reopen these unless there is a real defect, usability issue, accessibility issue, responsive regression, or hierarchy regression.

| Surface | Status | Constraint |
| --- | --- | --- |
| Fan Check-In | LOCKED | Attendance success is the truth. Old badge is off the critical path. Immediate value before account creation. |
| Artist Show Recap | STRUCTURALLY LOCKED | Artist completes / remembers the Night. Night Poster is not Gallery media. Completion actions stay near-white. |
| Public Night | COMPOSITION LOCKED | Fan-side version of the same Night. Preview Fan View uses the real Public Night. |
| Gallery Archive | DONE | `/galleries` is a photographic archive, not a CMS file manager. |
| Gallery Stack V3 | PASS / LOCK | Signature primitive. Stop isolated stack effects. Context lives in wrappers. |
| Public Gallery / media | LOCKED FOUNDATION | Authorized media only. Selected-photo continuity. Canonical URLs. |
| Night Hero / image roles | LOCKED | Hero, Poster, Event artwork, Artist image, Gallery media, Share image stay separate. |
| Auth | LOCKED | Foundational. Do not reopen without a defect. |
| QR Share | LOCKED | Foundational share / QR surfaces. Share Kit 2.0 is later. |
| Mobile artist dock | LOCKED | Foundational artist workspace chrome. |
| Show Mode + Nights | NEARLY LOCKED | UX complete. Manager / team Night-history authorization is the remaining surgical fix. After that: LOCKED. |

Gallery Stack lock rule: future innovation belongs in Night context, relationship, Passport, Messages, Music Memory, Share Kit, and Night Object — not inside `FaneqoGalleryStack.vue`.

---

# Current Work

**CURRENT:** Checkpoint the completed Night + Gallery + Check-In era. This documentation pass makes the repository the durable source of truth.

**ACTIVE / NEXT:** Show Mode / Nights manager and team authorization surgical fix.

`GET /api/show-recaps/my-recaps` and `GET /api/show-recaps/latest/me` currently resolve the band through `users_permissions_user` only. A team manager can get an empty Night history / latest recap. Use the same band-permission model already used by Night PATCH. Do **not** redesign Show Mode or Nights around this.

After that fix: **Show Mode + Nights = LOCKED.**

---

# Near-Term Roadmap

Exact order. Do not skip ahead from taste.

1. Show Mode / Nights manager authorization surgical fix
2. Messaging Home / Inbox
3. Message Composer
4. Sent
5. Received Message Experience
6. Gallery Create / Edit
7. Full Night → Gallery → Message → Fan → Passport loop audit
8. Fan Passport / Night Object work
9. Share Kit 2.0 / Music Memory / advanced mobile
10. Artist Page later

---

# Messaging

This is the next major product sprint after the manager-auth fix.

Artist-facing language is **Inbox / Sent**. Not Conversations. Not Campaigns.

Backend may keep `MessageCampaign` and conversation rows. Artists must not have to learn those names.

## Messaging Home / Inbox

North star: **PERSON + MESSAGE + RELATIONSHIP FIRST.**

Audit and improve:

- conversation hierarchy
- fan identity
- artist identity
- avatars
- latest message
- unread
- timestamps
- Night / show context
- Gallery / media previews
- loading / error / empty
- mobile thread transitions
- desktop composition
- auto-scroll to newest
- reply state
- blocked / suppressed state
- keyboard behavior

Primary artist actions remain:

- Message all fans
- Message a show
- Private message

## Message Composer

Core language: **“Say something to your people.”** Not “Create campaign.”

Flows: message all fans · message a show · private message.

Stay future-ready for text, images, Gallery attachments, Night context, audience preview, email vs in-app behavior, review / send, failure / retry, mobile keyboard, and post-send routing.

Do not create a second audience model. Multiple entry points must converge on the existing messaging architecture.

## Sent

Sent should answer: **WHAT DID THE ARTIST SAY?**

Then show audience, Night, media, date, delivery, and engagement.

Do not lead with campaign mechanics.

## Received Message Experience

Audit private DM, all-fans broadcast, show-attendee broadcast, image, Gallery, reply, email representation, Faneqo Inbox representation, mobile, and desktop.

Beautiful composer + ugly received message = failure.

Existing contract detail: `docs/FANEQO_MESSAGES_UX_CONTRACT.md`. If that file conflicts with this roadmap or the North Star, these canonical docs win.

---

# Gallery Creation

Gallery browsing is mature. Gallery creation still needs premium work.

Start with: **“Where do these photos belong?”**

- A Night
- General

Then: Night selection → upload → preview → progress → reorder → title → caption → visibility → preview → publish → return to the correct Night shelf.

Visibility language:

- Public
- Fans
- People who were there

Avoid technical internal terminology.

Future editing: title, caption, photos, reorder, visibility, draft / publish, Night association where safe. Delete / archive only if product architecture supports it.

`ArtistUpdate` remains the canonical gallery owner. Do not invent a second gallery store.

---

# Core Relationship Loop

Future quality gate. The whole product must complete this loop with no dead ends:

```
SHOW MODE
  → NIGHT
  → CHECK-IN
  → FAN
  → STORY / LINEUP / POSTER
  → GALLERY
  → MESSAGE ATTENDEES
  → FAN RECEIVES MESSAGE
  → PUBLIC NIGHT
  → GALLERY
  → PASSPORT
  → RELATIONSHIP CONTINUES
```

No duplicate concepts. No fragmented workflows.

---

# Fan Passport

Locked direction: **Artist Relationship Universe + Music Memory Journal.**

Do not make Passport a concert tracker, loyalty dashboard, badge wall, or points system.

It should feel cinematic, personal, collectible, editorial, and relationship-centered.

Example future memory:

```
BADFLOWER
THE BASEMENT EAST · NASHVILLE
SEP 5, 2026
YOUR 3RD BADFLOWER SHOW

[ Gallery Stack ]

YOU WERE THERE
```

Relationship progression uses real events only: first show, came back, 2nd / 3rd Night, first message, photo memory, years following, multiple cities, repeat venue.

No XP. No fake streaks. No invented counters.

---

# Night Object

Long-term concept. A Night becomes a living digital memory object containing:

artist · Night title · venue · city · date · Hero · Poster · Story · Lineup · Galleries · messages · music · YOU WERE THERE · show ordinal · Passport relationship · share artifacts

The Gallery Stack is one physical primitive inside this Night Object.

Faneqo is not merely storing event records. It is creating living digital objects from real nights between artists and fans.

Do not implement a full Night Object abstraction until the core loop is proven.

---

# Music Memory

**Photos remember what the Night looked like. Music remembers what the Night felt like.**

Potential: artist-selected track, artist-approved playlist, Night soundtrack, Passport music memory, Share Kit soundtrack.

Rules:

- No autoplay by default
- Do not build another Spotify clone
- Music supports memory

Hold implementation until later.

---

# Gallery / Memory Objects

`FaneqoGalleryStack` remains dumb: media, active index, gestures, interaction.

The **wrapper** knows artist, Night, date, venue, city, Night title, Gallery title, photo count, YOU WERE THERE, show ordinal, Passport state, and music context.

Same primitive. Different meaning.

| Surface | Wrapper meaning |
| --- | --- |
| Night | `SEP 5 · NASHVILLE` / The Moon Show / Backstage · 8 photos |
| Passport | YOUR 3RD BADFLOWER SHOW / YOU WERE THERE |
| Messages | FROM THE BASEMENT EAST · SEP 5 / 8 photos from tonight |

## Gallery chapters

A Night may eventually contain photographic chapters such as Soundcheck, On Stage, Crowd, Backstage, Aftershow, Tour Bus, Meet & Greet.

Do **not** hardcode these into taxonomy now. Artist-authored Gallery titles are enough until the product proves a stronger data model.

## Stack weight

Future experiment: a 2-photo Gallery may feel thinner than a 12-photo Gallery. Never render 12 DOM cards. Do not implement until real product value is demonstrated.

## Content-aware geometry

Future experiment: portrait-heavy, landscape-heavy, or mixed photography may influence subtle stack layering. No random chaos. No unstable layout. No large orientation jumps.

## Chronological Night memory

If trustworthy ordering / timestamps exist, photos may tell arrival → soundcheck → stage → crowd → backstage → aftershow.

Do not fabricate chronology without data truth.

---

# Share Kit 2.0

Major future product. Not merely a share drawer.

Current Night share and generic Gallery share stay as they are until this phase. Do not retrofit Share Kit onto Gallery from an unrelated pass.

## Customization

Bounded Faneqo customization. Not Canva.

Potential controls: choose photograph, crop, focal point, light / dark treatment, restrained artist accent, typography scale, content density, show / hide venue, date, lineup, Gallery count, YOU WERE THERE, artist identity prominence, CTA choice.

Faneqo controls templates enough to preserve quality.

## Output formats

Plan for Instagram Story 9:16, TikTok / Reels 9:16, Instagram feed 4:5, square 1:1, landscape / Open Graph.

Potential outputs: static image, animated card, short video, story artifact.

## Animated Night Object

Potential 5–8 second share: artist identity → venue / date → Gallery Stack settles → selected photograph → Night title / YOU WERE THERE → canonical Faneqo destination.

Motion should be restrained and premium.

## I Was There share

This replaces the old badge direction.

Not part of Check-In success. Post-show. Optional. Truth-based. Fan-specific. Beautiful.

Language: **“Share that you were there.”**

## Artist Share Kit

Future artist outputs: Tonight, Show recap, Gallery, Fan thank-you, Next show, Photo drop, Message the room, Tour memory.

Potential CTA: **See the Night on Faneqo.**

## Deep links / QR

Share artifacts may target Night, Gallery, Artist Page, Check-In, or a future deep app route. QR may be included. Artwork should never display ugly tracking URLs.

## Share / media engine

Longer-term infrastructure: deterministic templates, social images, programmatic video, Night snapshots, Gallery snapshots, artist-safe typography / layout, multiple aspect ratios, caching, share metadata.

Connect later to existing ShareSnapshot / Story Engine direction in `docs/FANEQO_RELATIONSHIP_PLATFORM.md` where appropriate. That architecture file does not authorize building Share Kit now.

---

# iOS / Mobile

This is a major roadmap item. Not “responsive cleanup.”

A dedicated iOS / native-feel pass.

## iOS Safari

Audit: dynamic Safari toolbar, `100dvh` / `svh`, safe-area, Dynamic Island / notch, home indicator, landscape, keyboard resize, browser Back gesture, overscroll, scroll restoration, sticky / fixed UI.

## Touch

All signature interactions: 44–48px targets, one-handed operation, press states, horizontal / vertical gesture arbitration, no hover dependency, no accidental navigation, respect iOS / browser edge-back gesture.

Gallery Stack is the interaction precedent.

## iOS messaging keyboard

Critical future testing: textarea growth, keyboard open / dismiss, emoji keyboard, attachment tray, photo picker return, send button visibility, thread resize, scroll newest message, safe-area bottom.

## iOS media

Audit / support: HEIC / HEIF, EXIF orientation, large iPhone photographs, compression, memory usage, derivative generation, Safari decoding, photo picker behavior.

Avoid huge originals in mobile UI.

## iOS sharing

Prefer native Web Share / iOS Share Sheet where supported. Graceful fallback.

## PWA

Continue improving standalone mode, installability, safe-area, service worker reliability, update behavior, offline boundaries, deep links, icons / splash, future notifications.

PWA infrastructure must never break normal navigation.

---

# Native-feel Motion

Even before a native app:

- shared-element continuity
- native-like sheets and drawers
- touch physics
- Gallery → lightbox → return
- collapsing Artist World chrome
- stateful Back navigation
- one-handed controls
- safe-area-aware UI

CSS + Motion first. GSAP only when continuity truly earns it. Rive only for signature meaning: Check-In, YOU WERE THERE, Show Mode LIVE, Passport relationship milestone.

Not buttons. Not Gallery physics. Not background decoration.

---

# Artist Page

Keep Artist Page intentionally later.

It should inherit mature Nights, Gallery Stack, Messages, fan relationships, Passport, Share Kit, mobile interaction language, and Artist World identity.

The Artist Page eventually becomes a window into the Artist World — not the entire product.

Do not start a full Artist Page redesign from an unrelated pass.

---

# Long-Term Artist World

Future conceptual grouping. These should feel connected, not like ten disconnected SaaS modules.

| Group | Rooms |
| --- | --- |
| **NOW** | Show Mode, Messages |
| **MEMORY** | Nights, Galleries |
| **RELATIONSHIP** | Fans, Passport |
| **IDENTITY** | Artist Page, Music, social links |
| **GROWTH** | Analytics, Share Kit |

---

# Quality Gates

Before aggressive distribution, evaluate the whole product through:

| Lens | Question |
| --- | --- |
| **ARTIST** | Can I operate this at a show? |
| **FAN** | Does this feel worth remembering? |
| **MOBILE** | Can I understand / use it quickly and one-handed? |
| **RELATIONSHIP** | Does Faneqo remember something meaningful? |
| **PERFORMANCE** | Does it remain fast? |
| **VISUAL** | Does photography / content dominate? |
| **BUSINESS** | Does this make a band want to keep paying? |

The core relationship loop above is a required quality gate before Passport / Share Kit / Artist Page expansion.

---

# Deferred / Hold

These ideas are preserved, not forgotten. They must not distract from the immediate roadmap.

Hold:

- reverse Gallery visual transition
- Atropos integration
- Night soundtrack implementation
- Gallery stack weight
- content-aware stack geometry
- hard-coded Gallery chapter taxonomy
- full Night Object abstraction
- Passport Gallery integration
- Messages Gallery Stack integration
- Share Kit 2.0 implementation
- programmatic video renderer
- full Artist Page redesign
- Embla-style main media + thumbnail strip as a replacement for 1 / 2 / 3 editorial layouts
- Band Passport
- Artist Banner schema field

Do not implement HOLD items because a surface feels unfinished. Implement them when the current work order reaches them, or when an explicit product request activates them.

---

# Stale ideas — do not resurrect

| Do not bring back | Why |
| --- | --- |
| Neon green identity | Superseded by earned precision color + near-white actions |
| Gradient CTA soup | Superseded by restraint |
| Badge-required Check-In | Attendance success is the product truth |
| Gallery as CMS / file manager | `/galleries` is a photographic archive |
| Public Night as a poster page | Public Night is the fan-side Night |
| Parallel Preview implementation | Preview uses the real Public Night |
| Conversations / Campaigns as artist IA | Inbox / Sent |
| Artist Page as the whole product | One window into the Artist World |
| Fake XP / streaks / badge walls | Relationship truth only |

Historical docs may still mention these. They are not current direction.
