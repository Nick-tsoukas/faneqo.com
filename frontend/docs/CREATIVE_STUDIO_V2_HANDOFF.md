# Faneqo Creative Studio V2 — Engineering Handoff

Written 2026-10-10 by the audit agent. For visual work, read `docs/CREATIVE_STUDIO_VISUAL_HANDOFF.md`
first. This file is the engineering history. Sections that say "uncommitted" are stale: Spotlight
styles, the Product Showcase phone, Insights, and the Product Showcase fidelity pass shipped in
`ba0f2d6` and `01189a8`. Read `docs/CREATIVE_STUDIO_V2_SPEC.md` for the original architecture.
Everything under **Verified** was read from the repos on this date. Everything under
**Recommendation** is a proposal the implementing agent should confirm before relying on it.

Workspace: `C:\code\musicbizqr` (Nuxt 3 frontend) and `C:\code\qrserver` (Strapi v4 backend).
Shell is PowerShell: no `&&`, no heredocs; pipe `@'...'@ | node --input-type=module` works.
Do not commit, push, deploy, reset, or stash unless Nick says so.

---

## 0. State of the working tree (verified)

### 0.-1 Design benchmark + standard + Artist Spotlight flagship pass — 2026-10-11 (uncommitted, verified in Chrome)

New docs: `docs/CREATIVE_STUDIO_DESIGN_BENCHMARK.md` (15 referenced music-industry creatives, principles, Faneqo identity) and `docs/CREATIVE_STUDIO_DESIGN_STANDARD.md` (principles, fixed / variant / adjustable tiers, 100-point scorecard, review procedure). Score every template refinement against the standard from now on.

| File | Change |
| --- | --- |
| `features/ads/studio/templates/ArtistSpotlight.vue` | Pass 1 + 2. Two-line masthead → single editorial label in the top row; artist name is the hero (84 / 80 / 92 / 60px; portrait 104 / 100 / 112 / 78). Explicit per-format vertical budgets (`LAYOUTS`) stack label → band → lower → close with no overlap and ≥ ~45px above the close. "Faneqo presents" kicker removed (brand ≤ 2 mentions above the close). Photographic ramps (open top, long bottom), square-portrait ramp denser. Story photo / page-excerpt variants fill the frame with a blurred, dimmed copy of the photograph (`.room`) instead of black. `data-treatment` presets natural / balanced / deep via scoped `:deep` overrides; absent = balanced. Action tier readable at phone scale (CTA 60px / 22px, destination 18px, badge 18px). "Meet / {artist}" no longer repeats the name. Square page excerpt hides bio + fan-list so the hero holds a face. |
| `features/ads/studio/families.js` | `PHOTO_TREATMENTS` + `treatment` in the artist-spotlight `fields` list. No change to `defaults()` (older creatives keep rendering identically). |
| `features/ads/studio/editor/ContentControls.vue` | "Treatment" section (three chips) when the family has `treatment` and a photo is chosen. |
| `features/ads/studio/fixtures.js` | Demo photo natural sizes / focals corrected (fixture metadata only). |
| `pages/__dev/studio-render.vue` | QA knobs: `desc=`, `badge=`, `song=` (empty clears), `top=`, `accent=`, `focal=x,y`, `treatment=`. |

Verified: 96-case render matrix (10 cases × 3 variants × formats) with 0 overlap / overflow / safe-zone issues; 42 genre renders (country, americana, indie, electronic, metal — CC / PD photographs swapped in by test-time request interception, nothing uploaded); real editor downloads for all 12 variant × format at exact dimensions with preview parity; Treatment chips verified in `/ads/c/3` with zero non-GET requests; `test-creative-studio.mjs` and `test-ads-studio.mjs` pass. Visual critic: FAIL → PASS WITH NOTES → PASS WITH NOTES (86 weakest before the final spacing / ramp tweak; see the sprint report). Evidence lives outside the repo in `%TEMP%\as-pass1\`.

Known limits: face protection is focal-driven only; `ProductExcerpt` still renders nested cards and an inert email input (shared primitive, next pass); creative `/ads/c/3` carries a user-set 50 / 50 focal on a 4096 × 6144 portrait, which crops heads in post / feed — content, not template.

### 0.0 Shared manual artwork — 2026-10-11 (uncommitted, verified in Chrome with a mocked upload)

Builds on 0.1 (pushed in `b5a4a5d`). No backend change, no new Strapi field, no S3 write during testing.

| File | Change |
| --- | --- |
| `features/ads/studio/studioUploads.js` (new, pure) | `studio_upload` media-ref helpers: `validateStudioImage` (JPEG / PNG / WebP, 8 MB), `uploadRefFromStrapi` (absolute URL, orientation, focal default), `collectStudioUploads` (unique uploads across library rows, newest first), `isStudioUpload`, `MEDIA_CONTENT_KEYS` |
| `features/ads/studio/useStudioUploads.js` (new) | `POST {strapiUrl}/api/upload` with the user JWT (same path the dashboard uses), `fileInfo.caption = 'faneqo-studio'`, no band relation → the public artist page never changes |
| `features/ads/studio/artistSnapshot.js` | `MEDIA_SOURCES` + `studio_upload` |
| `features/ads/studio/editor/PhotoPicker.vue` | Upload tile + hidden file input (`uploadable`, `uploading`, `uploadError`, `uploadTitle`, emits `upload`), "Uploaded" badge, Remove link when `allowNone`, `studio_upload` source label |
| `features/ads/studio/editor/ContentControls.vue` | `uploads` prop (library uploads for reuse by reference) + session uploads; upload wired to Photograph, Artwork (song-spotlight `art`), Featured song row (`songArt`), new Excerpt artwork section (product-showcase `songArt`); `photoRequired` now includes product-showcase |
| `features/ads/studio/families.js` | product-showcase `fields` + `photo`, `excerptArt` |
| `features/ads/studio/creativeModel.js` | `applyArtistSnapshot` keeps `studio_upload` refs (and their focal / song title) across an artist swap |
| `features/ads/studio/templates/ArtistSpotlight.vue` | `songArt === null` is an explicit "no artwork"; only a missing key falls back to the page's song art |
| `features/ads/studio/templates/SongSpotlight.vue` | Non-square artwork keeps its own ratio inside the `--art` box (`--box` var, inline `aspect-ratio`); square covers unchanged |
| `pages/ads/c/[id].vue` | Passes `libraryUploads` (library rows minus the current creative) to the controls; loads the library after the creative, non-blocking |
| `scripts/test-creative-studio.mjs` | + upload helpers, swap preservation, reuse scan, family field coverage |

Verified in Chrome (Playwright, `POST /api/upload` fulfilled by a mock pointing at `/images/ads/badflower/*`): upload → preview tile → 1080×1440 PNG → save → reload; Remove; reuse in Song Spotlight and Product Showcase without a second upload request; portrait artwork box ratio == image ratio; creatives stay independent; `/therockers` 200; zero non-GET `/api/bands` requests. A real upload to the shared S3 bucket has **not** been exercised.

### 0.1 Creative Studio V2 build — 2026-10-10 (uncommitted, verified in Chrome)

Stages A–G of section 8 are implemented. Nothing has been committed, pushed, or deployed.

**musicbizqr — new**

| File | Purpose |
| --- | --- |
| `features/ads/studio/artistSnapshot.js` | Pure band → frozen snapshot mapper; media refs with `source` / `use` / `focal`; `rightsStatusFor`, `rightsWarnings`, `snapshotMediaOptions`, `defaultFocalY` (portrait 26 / landscape 38 when the page focal is unset or the editor default 50/50) |
| `features/ads/studio/families.js`, `templates/index.js` | Six template families (pure definitions + component binding), variants, presets, `fields` driving the editor |
| `features/ads/studio/education.js` | Curated Musician Education topics (no statistics, no promises, no "AI") |
| `features/ads/studio/creativeModel.js`, `publishing.js`, `board.js`, `mediaUrl.js`, `fixtures.js` | Creative record shape / finalize / duplicate / categories / file names; IG + FB captions, hashtags, alt text, credits, rights warnings; per-format CSS vars; studio media proxy URL rewrite; self-contained Badflower demo snapshot |
| `features/ads/studio/templates/ArtistSpotlight.vue`, `SongSpotlight.vue`, `ProductShowcase.vue`, `TypeStatement.vue`, `EducationCarousel.vue`, `ShowPromo.vue` | The six families; inert; per-format `LAYOUTS` for post / feed / story / square |
| `features/ads/studio/primitives/CreativeClose.vue`, `PhotoField.vue`, `ProductExcerpt.vue` | Shared close row; focal-aware photo field (pixel `object-position` computed from natural size + ResizeObserver so preview and export crop identically); inert page / song / fan list / shows / gallery excerpts with an artist strip |
| `features/ads/studio/useCreativeStore.js`, `useCreativeExport.js`, `studioApi.js` | Strapi `/api/creatives` with the user bearer, flagged localStorage fallback (`storage: 'local'`, never presented as durable); PNG export with IHDR size check and multi-scene downloads; artist search / snapshot loading |
| `features/ads/studio/ArtistPicker.vue`, `editor/ContentControls.vue`, `editor/PhotoPicker.vue`, `editor/PublishingPanel.vue` | Searchable paged artist picker (+ demo row); family-aware controls; photo grid with focal control and rights tags (shown only when informative or in Paid Ad mode); publishing package with copy buttons |
| `pages/ads/create.vue`, `pages/ads/c/[id].vue` | Create flow (family → artist or none); editor (format chips, Artwork / Post / Grid / Story previews, Guides, Clean, scenes, Download PNG / All N, Save / Duplicate / Delete, Ctrl/Cmd+S, leave guard, mobile layout) |
| `pages/__dev/studio-render.vue` | Dev-only 1:1 renderer for captures (404 in production) |
| `server/utils/adsStudioAuth.ts`, `server/api/ads/artists.get.ts`, `server/api/ads/artists/[slug].get.ts`, `server/api/ads/media.get.ts` | Nitro studio routes: forward the **user's** JWT, re-check the allowlist, stealth 404; same-origin image proxy (S3 has no CORS) host-allowlisted to the upload CDN |
| `scripts/test-creative-studio.mjs`, `scripts/capture-studio.mjs` | Pure + source-contract tests (`creative studio: ok`); capture every family × variant × format to `%TEMP%\faneqo-studio-captures` |

**musicbizqr — modified for V2**: `features/ads/formats.js` (+ `square`), `features/ads/exportPng.js`
(same-origin credentials for the media proxy), `pages/ads/index.vue` (categories, templates view,
saved creatives with letterboxed 4:5 cards and chip row, legacy five under "Legacy compositions"),
`pages/ads/[slug].vue` (accepts `square`), `scripts/test-ads-studio.mjs`.

**qrserver — new**: `src/api/creative/**` (schema `creatives`, 7 routes all `auth:false` with
controller-side `requireStudioUser` gate → stealth 404, owner-scoped service, sanitizer with 64 KB
content cap, `GET /creatives/artists` light band browse), `scripts/test-creative-boot-requires.js`
(wired into `npm run test:boot`; 70 checks). `types/generated/contentTypes.d.ts` was regenerated by
Strapi on boot (new content type). `package.json` only gains the boot-test chain entry.

**Verified in a real browser (local Nuxt :3000 + local Strapi :1337, allowlisted dev account)**:
library categories and template cards; create → search → The Rockers → editor saved to Faneqo
(`/ads/c/3`); photo + focal controls; Download PNG = `the-rockers-artist-spotlight-story.png`
1080×1920 and `…-instagram-post.png` 1080×1440 (IHDR checked); preview crop == exported crop
(same pixel `object-position`); publishing package with Spotify rights warning; Education
carousel "All 7" → 7 files 1080×1080; 390 px mobile editor has no horizontal overflow and the
whole frame is visible; zero console / page errors. Anonymous, forged, and non-allowlisted JWTs
get 404 from `/api/creatives*`. Local sqlite only; production backend is **not** deployed.

**Visual critic cycle (one pass, done)**: FAIL → fixed all three MUST FIX (mobile editor overflow;
preview/export crop parity via the PhotoField rewrite; fan-list bleed void) and the SHOULD FIX
items (ticket-variant photo band under story chrome, carousel chrome drift + true slide count,
cards variant centred, Artist Spotlight reading order name → song, library thumbnails/chips,
muted storage pill, truthful player row, no doubled `faneqo.com`). Re-captured and re-verified once.

### 0.2 Earlier Ads Studio V1.5 work — uncommitted, pre-existing (keep together)

| File | What changed |
| --- | --- |
| `features/ads/formats.js` | Rewritten: `post` 1080×1440, `feed` 1080×1350, `story` 1080×1920; `AD_FORMAT_ORDER`; `AD_POST_SAFE`; `gridCrop()` / `gridSafeZone()` (3:4 grid model); `isAdFormat`; `adFileName()` |
| `features/ads/exportPng.js` | **New.** Browser PNG renderer (`renderNodeToPng`, `savePngBlob`, `pngDimensions`) |
| `features/ads/AdStage.vue` | Mask supports left/right bands; optional `frame` (safe-area outline) |
| `features/ads/catalog.js` | `artist-spotlight` formats `['post','feed','story']`, `subject: 'badflower'`; `your-entire-music-world` `subject: 'badflower'` |
| `features/ads/templates/ArtistSpotlight.vue` | Restraint pass + song row (OK I'm Sick cover, Ghost, white Play) + Spotify-style fade + per-format `LAYOUTS` (post/feed/story) via CSS variables |
| `features/ads/posts/artistSpotlightBadflower.js` | `songArt: '/images/ads/badflower/ok-im-sick.jpg'`, Follow CTA removed |
| `features/ads/ArtistSpotlightBadflower.vue` | default format `post` |
| `pages/ads/[slug].vue` | Three format buttons from `AD_FORMAT_ORDER`; **Download PNG** button + off-screen `.ad-export` host; Post/Grid/Story previews on the new grid model; status line |
| `pages/ads/index.vue` | Cards use `resolveAdFormat('', formats)` and inline `aspectRatio` |
| `pages/__dev/ads-export.vue` | Dev-only capture page; grid crop from `gridCrop()`, `?guides=1` frame |
| `middleware/auth.ts` | **Local only:** skip login redirect for `/ads` and `/ads/*` when `import.meta.dev` |
| `middleware/ads.ts` | **Local only:** `if (import.meta.dev) return` before the allowlist check |
| `scripts/capture-ads.mjs` | Spotlight captures post/feed/story |
| `scripts/test-ads-download.mjs` | **New.** Real Chrome: clicks Download PNG per ad/format, saves to `.visual-review/ads-downloads/`, verifies IHDR |
| `scripts/test-ads-studio.mjs` | Updated for all of the above |
| `public/images/ads/badflower/ok-im-sick.jpg` | **New.** 220×220 JPEG (file extension was corrected from .png) |

Unrelated dirty work that must stay untouched and unstaged: `features/spatial-memory/`,
`pages/__dev/spatial-memory.vue`, `pages/labs/spatial-memory.vue`, `public/labs/spatial-memory/`,
`scripts/test-spatial-memory-lab.mjs`, `docs/FANEQO_FOLLOW_SHEET_HANDOFF.md`,
`share-2-abandoned-backup.patch`, `.visual-review/**` (local review PNGs, never committed).

Last commit on `origin/main`: `fc65dc3` (the busier neon Artist Spotlight). Production
therefore still serves the old spotlight and has **no Download button** until the above is
pushed. Pushing is Nick's call; when he asks, stage only the ads files listed above.

### qrserver — uncommitted

Only regenerated `documentation/1.0.0/*.json` files (Strapi docs plugin output). Not ours.
Last commit `85f1d18`. No Creative Studio backend work exists yet.

### Verified test state

- `node scripts/test-ads-studio.mjs` → `ads studio: ok`
- `node scripts/test-ads-download.mjs` → 10/10 files exact (post 1080×1440, feed 1080×1350,
  story 1080×1920); pixel diff vs Playwright screenshot < 1% each; all opaque.
- `node scripts/test-meta-pixel.mjs` → ok.
- Dev server used: Nick's `nuxi dev` on `http://localhost:3000` (use `localhost`, not
  `127.0.0.1`; do not kill it; do not start a second Nuxt in the same project).

---

## 1. Verified repository findings

### 1.1 Ads Studio (frontend)

- Access: `utils/ads/access.js` → `canAccessAdsStudio(email, isDev)`: nick.tsoukas101@gmail.com
  always; test@gmail.com only in dev; empty email false.
- Route guards: `middleware/auth.ts` then `middleware/ads.ts` (`['auth','ads']`, `layout:false`,
  noindex). `ads.ts` resolves email via `useStrapiUser()` / `useStrapiToken()` / cookie
  `strapi_jwt` → `GET {strapiUrl}/api/users/me`, then fatal 404 for non-allowlisted accounts.
  `server/middleware/seo-noindex.ts` and `nuxt.config.ts` exclude `/ads` and `/ads/**`.
- Header link: `components/Header.vue` shows "Ads" only when `canAccessAdsStudio`.
- Library `pages/ads/index.vue`; player `pages/ads/[slug].vue`; stage `features/ads/AdStage.vue`
  (uniform `stageScale`, `transform: scale`, guides/mask/frame as siblings of the slot so the
  `article.board` element screenshot excludes them).
- Registry `features/ads/registry.js` maps slug → component. Catalog `features/ads/catalog.js`
  (5 entries). Formats `features/ads/formats.js`.
- Creatives: `features/ads/YourBandDeservesMore.vue` (3-scene motion, story only, `still` prop),
  `StopRentingYourAudience.vue`, `YourEntireMusicWorld.vue` (page-shaped Badflower ad; the best
  reference for inert product excerpts: song row, link rows, fan-list card, action row),
  `StillUsingABasicLinkInBio.vue`, `templates/ArtistSpotlight.vue` + `posts/artistSpotlightBadflower.js`
  + `ArtistSpotlightBadflower.vue`.
- Older static ads: root `article.board` 1080×1920 with `.board.is-feed { height: 1350px }`.
  They do **not** have `post` or `square` compositions.
- Fixture data: `composables/useHomepageDemoArtist.js` exports `FALLBACK_SNAPSHOT` (Badflower)
  and `fetchBandBySlug` (creatives may import the former, never call the latter).
- Fonts: Poppins from Google Fonts in `nuxt.config.ts` `app.head.link`. Brand assets:
  `public/faneqo-wordmark.svg` (preferred), `public/faneqo-logo.png` (has tagline).
  Platform icons imported from `assets/` (spotify.svg, apple.svg, youtube-icon.svg,
  instagramfree.png, facebookfree.png, tiktok.png).
- Photos: `public/images/homepage/artists/badflower-hero.webp`, `public/images/ads/badflower/*`
  (Wikimedia CC BY-SA, credits in `CREDITS.txt`), `public/images/ads/badflower/ok-im-sick.jpg`.
- Tests: `scripts/test-ads-studio.mjs` (source-string + pure-function asserts; forbids `<a`,
  `<audio>`, `fetchBandBySlug`, `BandPageCybered`, deck imports in creatives; requires catalog
  slug count 5), `scripts/test-ads-download.mjs`, `scripts/capture-ads.mjs`.
- Playwright: `playwright-core` is installed (channel `chrome`). No html-to-image / html2canvas /
  dom-to-image. `satori` + `@resvg/resvg-js` exist but are used only by `server/api/og/*` OG
  images (not suitable for Vue SFC rendering). `canvas@3` is available in Node for pixel checks.

### 1.2 Frontend ↔ Strapi auth pattern

- `@nuxtjs/strapi` module; `runtimeConfig.public.strapiUrl`; JWT cookie `strapi_jwt` (30 days).
- Private server config: `runtimeConfig.strapiApiToken` (`STRAPI_API_TOKEN`) and
  `userAdminSecret` exist for server-only use. Never move them to `public`.
- Server-route pattern that forwards the user's JWT: `server/api/me/dashboard.get.js`
  (reads `strapi_jwt` cookie or `Authorization` header, calls Strapi with
  `Authorization: Bearer <jwt>`). Reuse this shape for any studio proxy route.

### 1.3 Backend data (qrserver, Strapi v4)

Band `src/api/band/content-types/band/schema.json` (relevant fields):
`name` (unique), `slug` (unique), `genre`, `bio` (≤347), `biotagline`, `bandImg` (single image),
`singlesong` (component), `singlevideo` (component), `albums` (oneToMany `album`), `events`
(oneToMany `event`), `featuredGallery` (oneToOne `artist-update`), streaming/social URL strings
(`spotify`, `appleMusic`, `youtube`, `instagram`, `facebook`, `tiktok`, …), `websitelink`,
`officialMerchUrl`, `fanCapture*` copy, `cyberedImagePositionX/Y`, `cyberedImageZoom`,
`cyberedDesktopPositionX/Y`, `cyberedDesktopFit`, `cyberedMobileFit` (artist-set focal/framing),
`pageStyle`, `layoutConfig`.

Featured song component `src/components/singlesong/singlesong.json`:
`title`, `song` (audio media), `isEmbed`, `platform`, `url`, `embedUrl`, `embedHtml`, `trackId`,
`spotifyUrl`, `spotifyOembedTitle`, `spotifyOembedThumbnailUrl`, `spotifyOembedType`,
`spotifyOembedHtml`. **There is no `cover` field.** The frontend populate query in
`useHomepageDemoArtist.js` asks for `singlesong.cover` and the band controller populates
`singlesong: ["song","cover"]`; both are no-ops today. Featured-song artwork therefore exists only
as `spotifyOembedThumbnailUrl` (Spotify CDN, third-party rights).

Album `src/api/album/content-types/album/schema.json`: `title`, `releaseDate`, `cover`
(uploaded image — **the only artist-uploaded artwork in the data model**), `songs`,
`streamingService`, `albumUrl`, `type`, `gallery`, `isApproved`, draftAndPublish true.

Event `src/api/event/content-types/event/schema.json`: `title`, `slug`, `image`, `date`, `time`,
`doorsTime`, `venue`, `city`, `state`, `address`, `link`, `ticketLabel`, `priceLine`,
`ageRestriction`, `isApproved`, `description` (json), `band`.

Artist Update (galleries) `src/api/artist-update/content-types/artist-update/schema.json`:
`band`, `slug`, `contentKind` image|gallery, `media` (multiple images), `visibility`
public|fan_list|show_attendees, `status` draft|published|hidden, `coverMediaId`,
`mediaCaptions`. Only `visibility: public` + `status: published` media may be used.

Public band serializer `src/utils/band/publicBandPure.js`: `PUBLIC_BAND_RELATION_KEYS` =
bandImg, events, tours, albums, singlesong, singlevideo, videos, customButtons, editorialItems,
members, featuredGallery. `toPublicBand` strips show-mode internals.

Public band endpoints `src/api/band/routes/band.js` (all `auth: false`):
- `GET /api/bands` — `find`: **returns every band, no pagination** (filters only). Heavy as the
  catalog grows.
- `GET /api/bands/search?q=&limit=` — name `$containsi`, `q` ≥ 2 chars, limit ≤ 50, returns
  `{ id, name, slug, genre, bio(120), imageUrl }`.
- `GET /api/bands/slug/:slug` — full public band with `publicPopulateOptions` (events with
  image, albums with cover + songs, singlesong, videos, members, editorialItems) plus
  `featuredGallery` resolved by the featured-gallery service.
- `GET /api/bands/:id` — `findById`.
- `GET /api/public/bands/:bandSlug/galleries` and `/galleries/:gallerySlug`
  (`src/api/artist-update/routes/02-public-gallery.js`) — public gallery listing / detail.

Media storage: `config/plugins.js` → upload provider `aws-s3`, `baseUrl: env('CDN_URL')`,
`rootPath: env('CDN_ROOT_PATH')`. Upload URLs are absolute and **cross-origin** to faneqo.com.
CORS headers on that CDN were not verified.

Private-route pattern to copy: `src/api/labs/routes/01-labs.js` declares routes with
`config: { auth: false }` so users-permissions cannot 403; `src/api/labs/utils/labsAuth.js`
resolves the bearer JWT manually (`users-permissions.services.jwt.verify`), loads the user,
gates with the feature service, and returns a stealth 404 body otherwise. Boot test pattern:
`scripts/test-labs-boot-requires.js` (require every new module and assert routes ↔ controller
handlers). Policies available: `src/policies/require-labs.js`, `ratelimit-read.js`,
`subscription-active.js`; band policies `owns-band`, `has-band-role`.

Database: `config/database.js` — sqlite `.tmp/data.db` when `NODE_ENV=development`, Postgres
(`DATABASE_URL`) otherwise; `forceMigration: false`. A new content type auto-migrates on boot.

Existing backend test runner: `npm test` runs campaigns / inbox / media / relationship /
analytics / fan / boot suites (`package.json` scripts). `npm run test:boot` is the boot gate.

---

## 2. Architecture (recommendation)

Keep everything under `features/ads/` and `pages/ads/`. One rendering pipeline, one export
path, one data mapper.

```
features/ads/
  formats.js              (+ square)
  exportPng.js            (unchanged; + optional media proxy URL rewrite)
  AdStage.vue
  catalog.js              legacy creatives (keep)
  registry.js             legacy slug → component (keep)
  studio/
    templates/index.js    TEMPLATE_FAMILIES: id, name, formats, component, defaults(snapshot),
                          variants, captions(), carousel flag
    templates/ArtistSpotlight.vue   (move/alias existing template; same props)
    templates/SongSpotlight.vue
    templates/ProductShowcase.vue
    templates/TypeStatement.vue
    templates/EducationCarousel.vue
    templates/ShowPromo.vue
    primitives/CreativeClose.vue, PhotoField.vue, ProductExcerpt.vue, TypeScale.js
    artistSnapshot.js     Strapi band → snapshot + media rights tags (pure, tested)
    creativeModel.js      creative record shape, duplicate(), validate(), defaults
    publishing.js         caption / hashtag / alt text generators (pure, tested)
    useCreativeStore.js   list/get/save/duplicate via API; localStorage fallback flagged
    useCreativeExport.js  wraps exportPng for a mounted creative + scenes
pages/ads/
  index.vue               + categories, + saved creatives, + "Create"
  [slug].vue              legacy player (keep; extract shared stage bits if cheap)
  create.vue              template chooser → artist picker → redirects to editor
  c/[id].vue              editor + preview + download + publishing package
server/api/ads/
  artists.get.ts          studio-authenticated search/list proxy → /api/bands/search + /api/bands
  artists/[slug].get.ts   studio-authenticated detail proxy → /api/bands/slug/:slug + galleries
  media.get.ts            (only if CDN lacks CORS) same-origin image proxy, host-allowlisted
qrserver/src/api/creative/
  content-types/creative/schema.json, controllers/creative.js, routes/01-creative.js,
  services/creative.js, utils/creativeAuth.js
```

Reuse: `AdStage`, `exportPng`, `formats`, the player's preview logic, `YourEntireMusicWorld`
styling for `ProductExcerpt`, `ArtistSpotlight` as family 1, `dashboard.get.js` auth
forwarding, `labsAuth.js` gating, `test-labs-boot-requires.js` pattern.

Create: everything under `studio/`, the three pages, the server routes, the Strapi collection.

Not needed: Redis, queues, new npm packages, server-side browsers, a MediaAsset table.

---

## 3. Artist data mapping (recommendation, fields verified)

`artistSnapshot.js` input: public band JSON from `/api/bands/slug/:slug` (+ public galleries).
Output:

```js
{
  bandId, slug, name, genre /* text before first comma */, bio, biotagline,
  pageUrl: `https://faneqo.com/${slug}`,
  photos: [ { url, width, height, source: 'band_upload', use: 'organic', label: 'Artist photo',
              focal: { x: cyberedImagePositionX ?? 50, y: cyberedImagePositionY ?? 50 } },
            ...event.image, ...album.cover, ...publicGallery.media (published + public only) ],
  song: { title: singlesong.spotifyOembedTitle || singlesong.title, spotifyUrl,
          art: album.cover matching? -> { url, source:'band_upload', use:'organic' }
               else spotifyOembedThumbnailUrl -> { url, source:'spotify_oembed', use:'preview' } },
  releases: albums.map(cover/title/releaseDate/type),
  shows: events.filter(date >= today && isApproved).map(title/date/time/doorsTime/venue/city/state/link/priceLine/ticketLabel/image),
  links: { spotify, appleMusic, youtube, instagram, facebook, tiktok, website },
  snapshotAt
}
```

Rules: never invent; leave missing fields `null` and let templates hide blocks. Spotify
thumbnails are `use: 'preview'` → creative gets `rightsStatus: 'needs_permission'` until
replaced. Album `cover` is the only artist-uploaded artwork; prefer it when its title matches the
featured song or the user picks it.

Pagination: `/api/bands` has none. Options: (a) studio proxy pages the full list in Nitro
(acceptable while bands are in the low hundreds), or (b) add `start`/`limit` to the band `find`
controller — small backend change, needs a test. Search uses `/api/bands/search`.

---

## 4. Media rights and CORS (verified facts, recommended handling)

- Verified: uploads are served from `CDN_URL` (S3). Not verified: CORS headers. Test first:
  `fetch(cdnImageUrl, { mode: 'cors' })` from `http://localhost:3000` in Chrome.
- If CORS fails, add `server/api/ads/media.get.ts`: studio-authenticated (same email allowlist
  via `/api/users/me`), host allowlist = `CDN_URL` host only, streams the image with
  `Cache-Control`. `exportPng.fetchAsDataUrl` then rewrites CDN URLs to the proxy. Do **not**
  reuse the public `/image-proxy` (analytics-hardened, different purpose).
- Rights tags per section 7 of the spec. The publishing package must print credits
  (`public/images/ads/badflower/CREDITS.txt` for Wikimedia photos) and warnings.

---

## 5. Export strategy (verified working; extend)

Keep `features/ads/exportPng.js`. Add `square` to `AD_FORMATS` (`1080×1080`, chip
`Square · 1:1`, file suffix `square`). Carousel: iterate scenes, re-render the off-screen host per
slide, `savePngBlob` each (`-scene-N`); browsers may prompt for multiple downloads — show a
status line. Keep `pngDimensions` verification. Keep `scripts/test-ads-download.mjs` as the
regression gate and extend its job list to the new templates (route them through the editor
URL for saved creatives or a dev fixture route).

Known constraints: Chrome/Edge only (Safari foreignObject unreliable); all images must be
same-origin or CORS-readable; fonts come from Google (CORS `*`, verified by the working export);
rendering time ~1–3 s per image.

---

## 6. Persistence (recommendation)

Strapi collection `api::creative.creative` (`collectionName: creatives`, draftAndPublish false):

| attr | type | notes |
| --- | --- | --- |
| `title` | string | "Badflower — Artist Spotlight — Instagram Post" |
| `templateId` | string | one of the six ids |
| `status` | enum draft \| ready | |
| `formats` | json | supported ids |
| `primaryFormat` | string | |
| `variant` | string | curated variation key |
| `content` | json | editable fields (headline, lines, cta, accent, focal, slides…) |
| `snapshot` | json | artist snapshot incl. media rights tags |
| `rightsStatus` | enum clear \| needs_permission | derived on save |
| `band` | relation manyToOne api::band.band | optional, for library filters |
| `ownerEmail` | string | allowlisted email |
| `owner` | relation manyToOne users-permissions.user | |
| `sceneCount` | integer | carousel slides |

Routes (`routes/01-creative.js`, all `config: { auth: false }` like labs):
`GET /creatives`, `GET /creatives/:id`, `POST /creatives`, `PUT /creatives/:id`,
`POST /creatives/:id/duplicate`, `DELETE /creatives/:id`. Controller resolves JWT with a
`creativeAuth.js` modeled on `labsAuth.js`, then checks email against
`env('CREATIVE_STUDIO_EMAILS', 'nick.tsoukas101@gmail.com')` (comma list); otherwise stealth 404.
Scope reads/writes to `ownerEmail`. Validate `templateId`, `formats`, JSON size (<64 KB).

Boot test: add `scripts/test-creative-boot-requires.js` (require schema, routes, controller,
service, auth util; assert every route handler exists) and wire into `npm run test:boot`.
After deploy: `GET /api/health` → 200, Railway logs clean.

Frontend `useCreativeStore.js`: call Strapi directly with the user bearer (`useStrapiToken()`),
same as other dashboard calls. If the backend returns 404 for `/api/creatives` (not deployed
yet), fall back to `localStorage` and label every card "Saved on this device only". Never present
localStorage as durable.

---

## 7. Hazards and regression risks

- `middleware/auth.ts` / `middleware/ads.ts` dev bypass must stay `import.meta.dev` only.
  Production still requires the allowlist. Do not widen it to other routes.
- Creatives must stay inert (tests forbid `<a`, `<audio>`, `fetchBandBySlug`,
  `BandPageCybered`, deck imports). Do not mount live artist-page components: they write shared
  hero state, IntersectionObservers, localStorage experiments, and can start audio.
- Nuxt SSR: the editor and picker are client-heavy; guard `window`/`document` and use
  `.client.vue` or `onMounted` where needed. `AdStage` already handles SSR (scale 0 until mounted).
- Never expose `strapiApiToken` / `userAdminSecret`; studio proxies forward the **user's** JWT
  and re-check the allowlist server-side on every request.
- `GET /api/bands` returns everything; don't call it on every keystroke.
- Export fails closed if any image is cross-origin without CORS; surface the error.
- `scripts/test-ads-studio.mjs` asserts catalog slug count `5` — legacy catalog must not absorb
  saved creatives; saved creatives are a separate list.
- Vision-model readings of tall PNGs have been wrong before (described filled lower halves as
  empty). Trust `getBoundingClientRect`, PNG headers, and pixel diffs.
- PowerShell mangles `·` in piped scripts; select buttons by `title` attribute.

---

## 8. Execution plan (dependency-ordered)

**A. Foundation and data access**
- A1 `formats.js` + `square`; AdStage/player/export page accept it. Tests: extend
  `test-ads-studio.mjs`. Done when the legacy player shows four chips (disabled where
  unsupported) and `test-ads-download.mjs` still passes.
- A2 `server/api/ads/artists.get.ts`, `artists/[slug].get.ts` with allowlist check. Done when an
  allowlisted JWT gets results and any other JWT / no JWT gets 404.
- A3 `studio/artistSnapshot.js` + `scripts/test-creative-studio.mjs` (pure tests with a Badflower
  fixture and a sparse-band fixture). Done when missing fields map to `null` and rights tags are
  correct.
- A4 CORS probe of CDN images; add `media.get.ts` only if needed.

**B. Templates**
- B1 primitives (`CreativeClose`, `PhotoField`, `ProductExcerpt` from `YourEntireMusicWorld` styles,
  `TypeScale`).
- B2 move `ArtistSpotlight` under `studio/templates` (keep the legacy wrapper + Badflower post
  rendering identically; `test-ads-studio.mjs` must stay green) and drive it from a snapshot +
  content object; add `square`.
- B3–B7 Song Spotlight, Product Showcase, Type Statement, Education Carousel, Show Promo. Each:
  per-format `LAYOUTS`, variants, hide-when-missing, dev fixture route for capture. Done when
  `capture-ads.mjs`-style captures exist for every format and a visual-critic pass has no
  MUST FIX left.

**C. Editing, variants, preview**
- C1 `creativeModel.js` (defaults per template, `duplicate`, `validate`).
- C2 `pages/ads/create.vue` (choose family → artist picker → editor).
- C3 `pages/ads/c/[id].vue` editor: controls panel + stage with the player's preview modes, Guides,
  Clean, format chips, Download. Done when every control changes the artwork live.

**D. Persistence**
- D1 qrserver `creative` API + `creativeAuth.js` + boot test; `npm run test:boot` green.
- D2 `useCreativeStore.js` (API + flagged local fallback); library shows saved creatives with
  categories and status. Done when save → reload → reopen matches exactly and duplicate creates an
  independent record.

**E. Exports**
- E1 `useCreativeExport.js`; carousel multi-slide downloads; extend `test-ads-download.mjs` to the
  six families. Done when every family/format pair downloads at exact size.

**F. Publishing packages**
- F1 `publishing.js` (IG/FB captions, hashtags, alt text, URL, credits, warnings) + copy buttons +
  pure tests.

**G. Integration, regression, visual review**
- G1 Run: `node scripts/test-ads-studio.mjs`, `node scripts/test-creative-studio.mjs`,
  `node scripts/test-ads-download.mjs`, `node scripts/test-meta-pixel.mjs`,
  `node scripts/test-artist-share-drawer.mjs` (nearby surface), and in qrserver `npm run test:boot`.
- G2 Browser pass on `/ads`, `/ads/create`, a saved creative, each legacy slug, and `/badflower`
  (unchanged). Capture full-res PNGs; inspect at ~390px width; one `faneqo-visual-critic` pass;
  fix MUST FIX; re-verify once; stop.
- G3 Update this handoff with results and remaining gaps.

---

## 9. Acceptance tests (run in a real browser)

1. `/ads` as nick: categories visible, legacy five cards intact, Create visible.
2. Create → Artist Spotlight → search "bad" → Badflower → pick hero photo → artwork populates.
3. Change headline, drag/nudge focal point → artwork updates.
4. Chips Post/Ad/Story/Square; Post/Grid/Story previews; Guides on/off; Clean hides all chrome.
5. Save → status "Saved" (API) → reload → `/ads` lists it → reopen identical.
6. Download PNG for each format → files 1080×1440 / 1350 / 1920 / 1080; open them; no chrome.
7. Copy Instagram caption; copy Facebook caption; credits/warnings shown when applicable.
8. Song Spotlight from an album cover; Type Statement with no artist; Education carousel (≥3
   slides) downloads all slides; Show Promo from a real upcoming event (or shows "no upcoming
   show" state without invented data); Duplicate → edit → original unchanged.
9. Non-allowlisted account: `/ads/*` → 404; `/api/ads/artists` → 404; `/api/creatives` → 404.

---

## 10. Known blockers and unresolved decisions (updated 2026-10-10 after the V2 build)

Resolved during the build:
- Local Strapi target: the local frontend talks to the local Strapi (sqlite `.tmp/data.db`) on
  `:1337`; the `creative` API was exercised end to end there.
- CDN CORS: S3 uploads are **not** CORS-readable → `server/api/ads/media.get.ts` proxy is in use
  (studio-authenticated, host-allowlisted); `exportPng` sends same-origin credentials for it.
- `/api/bands` pagination: option (b)-lite — `GET /api/creatives/artists?start&limit` (private,
  gated) serves the picker; the Nitro route falls back to the public list when the backend
  route is not deployed yet.

Still open:
- **Backend deploy is required** for durable saves; only Nick deploys. Until then production
  runs the flagged local fallback ("This device only"). Deploy checklist: `npm run test:boot`
  green except the pre-existing `test-show-mode-timing.js` failures noted below; set
  `CREATIVE_STUDIO_EMAILS` (comma list; nick.tsoukas101@gmail.com is always allowed); after
  deploy `GET /api/health` → 200 and Railway logs clean; the new table auto-migrates on boot.
- **Pre-existing unrelated test failures in qrserver**: `scripts/test-show-mode-timing.js` fails 2
  of 22 ("Event-backed activation refuses outside the Event activation window" expects
  `event_activation_not_open`, gets `event_time_missing`; the batched variant expects
  `too_early`, gets `no_time`). Not touched by this work (no show-mode files changed); likely
  date-sensitive fixtures. Everything else in `test:boot` passes (labs 22, creative 70).
- **Featured-song artwork** is Spotify oEmbed only (rights: preview → "needs permission").
  Album `cover` is preferred automatically when its title matches. Adding an optional `cover`
  to the `singlesong` component remains a later-phase backend change.
- **Instagram upload still unconfirmed by a human**; the studio never claims publish success.
- **Pushing the uncommitted work** (sections 0.1 and 0.2) needs Nick's go-ahead; stage only the
  listed files, keep the unrelated dirty work unstaged.
- Default focal for photos without a page crop is a heuristic (portrait 26 %, landscape 38 %);
  the editor's focal control is the override. Face detection was deliberately not added.
- Square compositions for the three older static ads are out of scope unless asked.

---

## 11. Resume instructions

1. Read `docs/CREATIVE_STUDIO_V2_SPEC.md`, then this file, then
   `musicbizqr/AGENTS.md` and `.cursor/rules/00-faneqo-core.mdc`.
2. `cd C:\code\musicbizqr; git status --short` — confirm section 0 matches. Do not touch the
   unrelated dirty files.
3. Confirm the dev server is on `http://localhost:3000`; run `node scripts/test-ads-studio.mjs`
   and `node scripts/test-ads-download.mjs artist-spotlight` to re-verify the baseline.
4. Ask Nick (one message, then proceed on stated assumptions): local Strapi target, CDN CORS
   expectations, whether to push the baseline first.
5. Start at A1. Keep `test-ads-studio.mjs` green after every stage. Keep inert-creative rules.
6. End each stage by updating section 0 and section 10 of this file.
