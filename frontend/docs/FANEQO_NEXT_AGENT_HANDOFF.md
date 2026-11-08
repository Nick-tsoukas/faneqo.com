# FANEQO NEXT AGENT HANDOFF

Updated 2026-09-09.

Read first:

1. `docs/FANEQO_DESIGN_NORTH_STAR.md`
2. `docs/FANEQO_MASTER_PRODUCT_ROADMAP.md`
3. `docs/FANEQO_CURRENT_PHASE.md`
4. This file

Older docs may contain history. They must not override these four.

This is a continuation brief, not a changelog.

---

## CURRENT ASSIGNMENT (2026-10-11)

The founder assigned the next agent to connect the RockSnaps website to the Faneqo RockSnaps API that already shipped. The brief is `docs/ROCKSNAPS_SITE_HANDOFF.md`. Read that before the September 9 gallery notes below. Those notes are history for this session. Do not start Gallery Create / Edit from this file.

The site rules in that brief are authoritative. Do not replace them with an API-only catalog:

- Do not modify the RockSnaps homepage, `pages/index.vue`, `BandShowcase`, or the homepage's static project data.
- All Works stays hybrid forever: Faneqo galleries first, then every static gallery in its original order. A successful API response never removes the static galleries.
- Dynamic galleries appear under the All filter only. Do not invent a category or assign Concert.
- A static slug always wins over a dynamic slug with the same name.
- An API failure or 404 leaves the static site intact. A `200` with an empty list is a real empty dynamic catalog, and the static galleries still render.
- The website only reads the public RockSnaps routes. Do not rebuild Faneqo publishing. Production band id is 59. Local test band id is 4. The website does not use either id.

---

## WHAT JUST LANDED

**PUBLIC GALLERIES INDEX — IMPLEMENTED / NOT APPROVED V1 (2026-10-11).**

`/{bandSlug}/galleries` is now an exhibition index: wall-label header, 2-column 3:2 stills on desktop, stacked on mobile, portrait covers bias toward faces. Management `/galleries` archive and Gallery Stack were not touched. Visual critic: PASS — LOCK. Evidence: `.visual-review/galleries-index/pass-1/`. Founder APPROVED V1 still required.

**PUBLIC GALLERY DETAIL — DESKTOP MASONRY CORRECTIVE (2026-10-11). IMPLEMENTED / NOT APPROVED V1.**

Desktop (`≥1024`) now hangs prints in two equal columns on a 1280 stage. Spreads dissolve so every photograph — including later portraits — takes a full column at its natural ratio. The old height-capped pair was shrinking mixed galleries into tiny centered thumbs. Phone / tablet flex-spread hang is unchanged. Compact header stays. Repeated title colophon is gone. More From is count-aware (1 / 2 / 3). Visual critic: PASS WITH NOTES (no MUST FIX). SHOULD FIX on the RockSnaps `test` 1-up More From cover rejected — that tile is the same 48rem 3:2 as the healthy `fasdfasdf` close; the black field is stored screenshot media. Evidence: `.visual-review/gallery-redesign/pass-5/`. Founder APPROVED V1 still required on a real device.

**PUBLIC GALLERY EXHIBITION — IMPLEMENTED / NOT APPROVED V1 (2026-10-11).**

The public gallery detail page is an exhibition: wall-label identity, hung sequence, photographic More From, existing PhotoSwipe viewer. Routes, authorization, and media contracts unchanged. Pass-4 evidence: `.visual-review/gallery-redesign/pass-4/`. Superseded for desktop hang by the masonry pass above.

**GALLERY PAGE — PRISTINE PHOTO + THREE TRANSITIONS (FOUNDER CHOOSES).**

Stack removed. One uncropped photograph. Experiments: **Print** (zoom home) · **Hold** (photo stays) · **Afterimage** (zoom + Memory Residue MR-B). Lab keys 1/2/3 or `?gx=print|hold|afterimage`.

**GALLERY PAGE + LIVING GALLERY — WIRED, NOT APPROVED V1.**

```
GALLERIES HOME → GALLERY PAGE → LIVING GALLERY → same GALLERY PAGE
```

Existing `/galleries` cards still navigate to `/{bandSlug}/gallery/{slug}`. That page is now the rebuilt Gallery Page (real public payload) + Living Gallery. `?photo=` selects the front image; it does not auto-open the viewer. Close keeps the index. Back honors `from=/galleries`. Residue off. Old lightbox stays on Night / Recap / Passport / messages.

**Memory Deck** is only the Gallery Page photo-stack component.

**MESSAGING remains LOCKED.**

**PUBLIC NIGHT HIERARCHY**

```
Hero → Story → From the Night → From the Stage → On Stage → Stay with artist
```

Compact On Stage. Desktop right rail: Poster + lineup. Gallery Stack unchanged.

**ARTIST PAGE FAN RELATIONSHIP — NATIVE FOLLOW WIRED (VISUAL LOCK UNCHANGED)**

Same canonical Fan row. `followedAt` / `unfollowedAt` are Following truth. Email `status` stays the subscription lane. Artist Page Join Fan List also sets Follow. Check-In, claim, messaging, import, and generic resubscribe do not. Follow-only Fans stay email-ineligible and may still participate in in-app messaging. Anonymous Follow reuses `FanAccountPrompt` (`follow_intent`) and `?feq_intent=follow`. No Follow model. Historical backfill is conservative (`joined_fan_list` only) and dry-run by default.

**NIGHT RECORDINGS — LOCKED**

Show Recap Night-content:

```
Story → From the Night → Recordings → compact Lineup
```

Public Night:

```
Story → From the Night → From the Stage → compact On Stage
```

One `NightRecordingItem` for artist + fan. Artist Page song/video language. No Artist Page analytics. Spotify artwork via existing `/api/spotify/oembed` (presentation only). Analytics deferred. Passport untouched.

---

## WHAT IS LOCKED

Do not structurally reopen:

- Fan Check-In
- Artist Show Recap composition
- Public Night composition / hierarchy
- Gallery Archive
- Gallery Stack V3
- Public Gallery / media foundation
- Night Hero / image roles
- Auth / QR Share / mobile artist dock
- Show Mode + Nights
- **Messaging Inbox / Thread**
- **Messaging Composer**
- **Messaging Sent**
- **Fan Passport Home** (preserve / near-lock)
- **Night Recordings**

Do not add isolated Gallery Stack effects.

Do not start: reverse View Transition, Atropos, Passport-in-stack, Night-aware fields inside `FaneqoGalleryStack.vue`, Share Kit 2.0, Music Memory player UI, Gallery chapter taxonomy, Artist Page redesign, a second fan Night surface, a Passport recording system.

---

## EXACT NEXT TASK

**STOP on Gallery viewing.** Founder reviews the in-app Gallery first.

Then:

1. **Gallery Create / Edit** — premium pass. “Where do these photos belong?” Night vs General.

2. Then: full Night → Gallery → Message → Fan → Passport loop audit / hardening.

Do **not** redesign Messaging, Public Night, Show Recap, Gallery Stack, Galleries Home, or Passport home.

---

## RELEVANT FILES

### Gallery Page (just wired)

- `components/nights/PublicGalleryExperience.vue`
- `features/gallery-experience/core/publicGalleryToExperience.js`
- `features/gallery-experience/memory-system/GalleryDoorway.vue`
- `features/gallery-experience/living-gallery/LivingGalleryViewer.client.vue`
- `pages/[bandSlug]/gallery/[gallerySlug].vue`
- `pages/galleries/index.vue` (unchanged Home)
- Handoff: `docs/gallery/memory-system/FANEQO_MEMORY_SYSTEM_HANDOFF.md`

### Public Night

- `components/nights/PublicNightExperience.vue`
- `components/nights/PublicNightRecordings.vue`
- `components/nights/PublicNightLineup.vue`
- `components/nights/NightRecordingItem.vue`
- `utils/nights/nightRecordings.js`

### Show Recap recordings

- `components/nights/NightRecordingManager.vue`
- `components/nights/NightRecordingComposer.vue`
- `components/nights/NightRecordingList.vue`
- `composables/useNightRecordings.js`

### Backend (do not reimplement)

- `qrserver/docs/FANEQO_NIGHT_RECORDINGS.md`
- `qrserver/src/utils/nightRecordings/nightRecordingPure.js`

---

## WHAT MUST NOT BE REOPENED

- Inbox / Thread / Composer / Sent
- Show Recap section order, Night Poster vs Gallery, Story / Lineup action hierarchy
- Public Night composition or a second Preview implementation
- Gallery Stack internals
- Check-In success path
- Auth, QR Share, mobile artist dock
- Artist Page
- Share Kit 2.0
- Music Memory player
- Passport home relationship journal
- A second fan-facing Night
- A Passport-specific Recording UI

---

## WHAT COMES AFTER THAT

1. Gallery Create / Edit — “Where do these photos belong?” Night vs General
2. Full Night → Gallery → Message → Fan → Passport loop audit
3. Optional Passport artist-chapter enrichment (featured track / video / socials)
4. Night Object / Share Kit 2.0 / Music Memory / iOS
5. Artist Page later

---

## DEV SERVER POLICY

The user normally runs **one frontend server** and **one backend server**.

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:1337`

Reuse these. Do not start duplicates. Do not blanket-kill Node.

---

## CONFIRMATIONS

NO Inbox / Thread / Composer / Sent redesign  
NO Recap / Public Night / Gallery Stack reopen  
NO second fan Night  
NO Passport recording system  
NO Share Kit 2.0  
NO Music Memory implementation  
NO Artist Page redesign  
NO commit / push / deploy unless explicitly asked


---

## 2026-09-18 — Corvana flagship deck

The flagship deck at `/corvana/decks/mbq-flagship-elite` now has nine Faneqo industry slides for Lost Lands. It reuses homepage scenes, Fan Passport with fixtures, and the artist workspace picker. Full-bleed rendering is opt-in for this deck; the other decks retain their existing frame.

Validation: the focused source assertions and JavaScript syntax checks passed. No full Nuxt build or rendered Vue visual review was possible in the preparation environment. Desktop/mobile visual verification remains required. Demo fan counts, attendance, and roster entries are illustrative, not customer results.

Changed source: `corvana/decks/FaneqoIndustryDeckSlide.vue`, `flagshipDeck_elite.js`, `componentRegistry.js`, `deckIndex.js`, and `pages/corvana/decks/[id].vue`. Test: `node scripts/test-corvana-industry-deck.mjs`.

The earlier product work order above remains unchanged. This update does not authorize redesigning locked product surfaces.

