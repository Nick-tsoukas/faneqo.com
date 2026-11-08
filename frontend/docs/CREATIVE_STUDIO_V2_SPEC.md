# Faneqo Creative Studio V2 — Product & Technical Specification

Status: specification, not yet implemented. Written 2026-10-10 after an audit of both repos.
Companion execution document: `docs/CREATIVE_STUDIO_V2_HANDOFF.md`.

Creative Studio is the private evolution of Ads Studio (`/ads`). It is not part of the
September product phase (`FANEQO_CURRENT_PHASE.md`, `FANEQO_NEXT_AGENT_HANDOFF.md`) and must
not reopen locked product surfaces. It is an internal marketing tool for Nick.

## 1. Mission

Produce publishable Instagram / Facebook content — organic posts and paid ads — in minutes,
using real Faneqo artists, their photography, featured songs and artwork, and their shows.

The benchmark is a small professional music-industry creative studio, not a SaaS dashboard
and not Canva.

## 2. Visual doctrine (non-negotiable)

**Dark field → Exceptional photography → Bold typography → Authentic Faneqo product → Clean close.**

- Background `#050506`. Text `#f7f9fc`. Poppins 400 / 500 / 700 / 800 (650 is not loaded).
- Kicker cyan `#7ee7ff`. Accent gradient `#ff4ad8 → #c084fc → #67e8f9` used once per piece at most.
- Near-white primary control appears once per decision area (one white Play / Follow / Join).
- Photography and type carry emotion. No glows, neon arcs, fake tabs, decorative rails, or
  logos repeated across the artwork. One wordmark in the close.
- Product excerpts must be inert and faithful to the real artist page (cover, title, artist,
  play; link rows; fan-list card). Never mounted live components.
- The approved references are the current `Artist Spotlight` (Badflower) and the three
  older static ads. Match or exceed them.

## 3. Scope

### 3.1 Preserve

- `/ads` library look, card grid, dark editorial layout, private access.
- `/ads/[slug]` player: format buttons, Artwork / Post / Grid / Story previews, Guides,
  Clean mode, keyboard navigation, scenes for the motion deck, Download PNG.
- The five existing creatives and their slugs.
- `pages/__dev/ads-export.vue` and `scripts/capture-ads.mjs` for local reference captures.

### 3.2 Add

1. Artist picker backed by Strapi (search, paginate, pick photo, song art, show).
2. Six template families (section 6).
3. Structured creative configuration + curated variations.
4. Focused editor (artist, photo, focal point, headline, copy, variant, accent, format, CTA).
5. Saved creatives (draft / ready), reopen, duplicate.
6. Library categories: All · Social Posts · Paid Ads · Templates · Drafts / Ready.
7. Exact-size PNG download for every format (already working for existing ads).
8. Publishing package: captions (IG / FB), hashtags, alt text, destination URL, credits,
   rights warnings, copy buttons.

### 3.3 Never

- Public or unauthenticated creative renderer URLs.
- Privileged Strapi tokens in the browser.
- Direct posting, scheduling, or claiming "AI-generated" copy.
- A CMS, drag-and-drop canvas, plugin system, or large new dependencies.
- Changes to public artist pages, Stripe billing, registration, QR, messaging, Passport,
  PWA, Corvana deck files, or shared scroll locking.
- Mounting `BandPageCybered`, `ArtistFeaturedGallery`, `FollowArtistSheet`, `<audio>`,
  `<a>` inside creatives. No `fetchBandBySlug` or analytics calls from creatives.

## 4. Formats and platform behavior

| Id | Chip | Canvas | Use |
| --- | --- | --- | --- |
| `post` | Post · 3:4 | 1080×1440 | Instagram organic image post; fills the current ~3:4 profile grid |
| `feed` | Ad · 4:5 | 1080×1350 | Instagram / Facebook feed ad (Meta recommends 4:5); also usable organically |
| `story` | Story · 9:16 | 1080×1920 | Stories |
| `square` | Square · 1:1 | 1080×1080 | Carousel slides, some ad placements, Facebook feed |

Rules:
- Every supported format is an intentional composition (per-format layout variables), never a
  crop or stretch of another.
- Current Instagram grid thumbnail is a centered 3:4: a 4:5 loses ~34px per side, a 9:16
  posted to the feed loses 240px top and bottom, a 3:4 loses nothing. `gridCrop()` in
  `features/ads/formats.js` is the single source of this model. The old square-grid model
  (`AD_GRID_CROP`, 135px bands) is removed and must not return.
- Safe areas: post / feed / square 80px on all sides; story 250 top / 320 bottom / 48 sides.
- Carousels lock every slide to the first slide's ratio. Educational carousels export all
  slides in one ratio (`square` or `post`).
- Previews are simulations. Meta Ads Manager and the Instagram app remain authoritative. The
  UI must say so.
- Guides, masks, and shells never appear in exports.

## 5. Download / export

Client-side renderer `features/ads/exportPng.js` (verified 2026-10-10 on all 10 existing
creative/format pairs: exact IHDR size, fully opaque, <1% pixel difference from Playwright's
native screenshot). It mounts a 1:1 off-screen copy of the creative, inlines computed styles,
embeds images and Poppins as data URLs, rasterizes through SVG `<foreignObject>` to a canvas,
verifies the PNG header, and saves `${subject}-${slug}-${format}.png`.

Requirements carried into V2:
- Works on the deployed private studio in Chrome / Edge without server rendering.
- Remote artist media (S3 via `CDN_URL`) must be fetchable with CORS or proxied same-origin
  through a studio-authenticated route; otherwise export fails closed with a visible error.
- Multi-slide creatives download each slide (`-scene-N`) in the chosen ratio.

## 6. Template families

Shared primitives: `AdStage` (scale-to-fit), format layout variables, `CreativeClose`
(wordmark · rule · CTA · site), `ProductExcerpt` (inert song row / link rows / fan-list card),
`PhotoField` (object-fit cover + focal point + Spotify-style fade), typography scale presets.

| Family | Purpose | Required data | Optional | Formats |
| --- | --- | --- | --- | --- |
| Artist Spotlight | Introduce an artist; photo dominant, song secondary | name, hero photo, song title | song art, bio line, focal point, CTA | post feed story square |
| Song / Release Spotlight | Album art is the star; release campaign feel | song title, artist, artwork | release date, editorial line, accent (preset or sampled), player excerpt | post feed story square |
| Product Showcase | Show what Faneqo gives an artist | headline, excerpt kind (page / music / fan list / shows / gallery) | artist snapshot to populate the excerpt | post feed story square |
| Typography Statement | Brand statements without photography | 1–3 lines with emphasis flags, scale preset | supporting line, photo background + veil, CTA | post feed story square |
| Musician Education | Useful single posts and carousels | topic, cover headline, 2–6 content slides | closing slide, CTA | square post (carousel) · story (single) |
| Show / Event Promotion | Poster-like show announcement | artist photo, artist name, date, venue, city | time, ticket link, price line, event image | post feed story square |

Each family: distinct composition, curated variations (headline A/B/C, photo- vs product-
forward, type treatment, accent, CTA phrasing), explicit missing-data behavior (hide the block,
never invent), and representative test cases (long names, missing images, light photo, three
different artworks, mobile legibility).

Educational copy must be accurate; no invented statistics or capabilities.

## 7. Artist data and media rights

Source of truth is Strapi (`qrserver`). The studio reads it; it never copies the artist
database. A creative stores a **snapshot** (the exact strings and media URLs used, plus the
band id / slug and a `snapshotAt`), so later profile edits never alter a finished image.

Rights model stored on every media reference:
- `source`: `band_upload` (bandImg, album cover, artist-update media, event image) ·
  `spotify_oembed` (third-party CDN thumbnail) · `studio_asset` (files in `public/images/ads`).
- `use`: `preview` · `organic` · `paid`.
- Band uploads are artist-supplied and may be used for preview and organic promotion of that
  artist; paid use still requires confirmation. Spotify oEmbed thumbnails are preview-only;
  the creative is flagged "needs permission" until replaced or cleared.
- Wikimedia CC BY-SA files already in `public/images/ads/badflower/` need a caption credit if
  published.

## 8. Persistence

Minimal private Strapi collection `creative` (section 6 of the handoff). Stores template id,
title, status, formats, content JSON, snapshot JSON, optional band relation, owner. Access is
enforced in the controller by JWT + email allowlist (same model as `utils/ads/access.js`),
returning 404 to everyone else. No admin-UI permission flips required.

## 9. Editor

One route, one artwork, small controls: artist search → photo → focal point → headline / copy
→ variant → accent → format → CTA → Save → Download → Copy caption. No free dragging, no
layout editing, no widget marketplace.

## 10. Acceptance

1. Open `faneqo.com/ads` (allowlisted account).
2. Create → Artist Spotlight → search an existing artist → pick a photo.
3. Template populates from real data; adjust headline and focal point.
4. Preview Post · 3:4, Ad · 4:5, Story · 9:16 (and Square where supported).
5. Save; reload; reopen the creative with identical content.
6. Download PNG → exact 1080×1440 / 1350 / 1920 / 1080 files containing only the artwork.
7. Copy an Instagram caption and a Facebook caption.
8. Also: Song Spotlight from real artwork; Typography graphic without an artist; an
   educational carousel; a show promo from real event data; duplicate into a variation; see all
   saved creatives in the library.

Everything visible must work. No placeholder controls.
