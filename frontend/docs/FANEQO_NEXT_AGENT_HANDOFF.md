# FANEQO NEXT AGENT HANDOFF

Updated 2026-11-08 (performance work; see LATEST).

Read first:

1. `docs/FANEQO_DESIGN_NORTH_STAR.md`
2. `docs/FANEQO_MASTER_PRODUCT_ROADMAP.md`
3. `docs/FANEQO_CURRENT_PHASE.md`
4. This file

Older docs may contain history. They must not override these four.

This is a continuation brief, not a changelog.

---

## LATEST: PERFORMANCE WORK, STATE AS OF 2026-11-08

Read before touching the build, Railway or dependencies. Reports on `main`:
- `docs/BUILD_AND_IMAGE_OPTIMIZATION_2026-11-08.md`: Railway build/image audit (PR #46)
- `docs/CODEBASE_OPTIMIZATION_AUDIT_2026-11-08.md`: dependency, plugin, dead-code and runtime audit, with the ranked roadmap (sections F and G)

### Shipped

| PR | Merge | What | Measured result |
|---|---|---|---|
| #46 | `fcc7822` | Untracked 235 MB of `.tmp-*` browser profiles and captures; removed 44 unreferenced `assets/` files; added `npm run test:hygiene` | Deploy 12m 21s -> 10m 39s; source snapshot 597 -> 281 MB; image push ~1,005 -> 835 MB |
| #47 | `6b367b0` | Removed global ECharts, Quill and Font Awesome SVG plugins, `components/EChart.vue`, the `nuxt-aos`, `nuxt-particles` and `nuxt-tiptap-editor` modules, and 15 packages | Entry JS **513 -> 237 kB gz (-54%)** on every page; inline global CSS 390 -> 344 kB; 1,834 -> 1,776 packages |

**#47 post-deploy check:** Railway `0ea63c51` SUCCESS on `6b367b0`; `/`, artist pages, `/login`, `/signup`, `/article`, `/event/1`, `/sitemap.xml` and backend `/api/health` all return 200. The live entry file transfers **239.6 kB, down from 517.7 kB (-54%)**, matching CI.

Kept on purpose in #47: the Font Awesome CSS (`pages/event/[id].vue` uses `fa-*` classes), Chart.js and its global plugin, Firebase, Tiptap, `tsparticles`.

### Next, in roadmap order (approve each separately)
1. **Stage 2, unused packages:** `@nuxt/ui-pro`, `luxon`, `dayjs`, `chartjs-adapter-luxon` (also drop it from `vite.optimizeDeps.include` and `build.transpile`), `chartjs-adapter-date-fns`, `vue-chartjs`, `yup`, `resend`, `vue-advanced-chat`, `qr-border-plugin`, `nuxt-headlessui`, and the Nuxt 2 dev packages `@nuxt/types` (also in `tsconfig.json`), `@nuxt/typescript-build` and `@nuxtjs/date-fns`. Evidence and confidence are in audit section B1.
2. **Dead code:** 48 components and 5 composables with no references (audit section D). Check against the uncommitted homepage-v3 work in `C:\code\musicbizqr` first; it edits some `home-v2` components.
3. **Article retirement (PR #44)**, as its own PR: it removes the **whole** prerender stage (48-68 s per build) and the build-time Strapi call. The branch `seo/retire-legacy-articles`, the private archive of 98 articles and the Strapi records are untouched.
4. ~~Railway watch patterns~~ **done 2026-11-08**; see "Railway watch paths" below.
5. **Medium:** move the Font Awesome CSS into `pages/event/[id].vue` (-65 kB inline CSS on every other page); drop the global `plugins/chart.js` after checking each of the 5 consumers registers its own chart parts (-55 kB gz); remove animate.css after a visual check of the 22 `animation: pulse` usages, because its `@keyframes pulse` collides with Tailwind's.
6. **Founder decisions:** the public test pages returning 200 (`/test`, `/testing`, `/test-qr`, `/debug-qr`, `/testsite`, `/home-classic`, `/marketing-component-preview`, `/internal/rive-sandbox`); Firebase lazy-init (touches Google sign-in); stale worktrees.
7. **Advanced:** artist page SSR (today the band is fetched twice per view, server for head then browser); a slim runtime image, which first needs the `geoip-lite` fix, since it is loaded via `createRequire` from root `node_modules`.

### Railway watch paths (applied 2026-11-08, verified)

Set through the Railway API on both production services; no other setting changed. Railway treats them as gitignore-style rules from the **repo root** (even for a service with a root directory). Matched = deploy.

| Service | Watch paths |
|---|---|
| `musicbizqr` (frontend) | `**`, `!/docs/`, `!/docs/**`, `!/.cursor/`, `!/.cursor/**`, `!/.github/`, `!/.github/**`, `!/.vscode/`, `!/.vscode/**`, `!/jobs/`, `!/jobs/**`, `!/*.md` |
| `mbq-cron` (root `/jobs/mbq-cron`) | `/jobs/mbq-cron/**`, `!/jobs/mbq-cron/*.md` |

- **Frontend still deploys** on app code, `nuxt.config.ts`, `package.json`/lockfile, `tsconfig.json`, `public/`, `server/`, `scripts/`, `assets/`, `workers/`, and any new top-level folder. It **skips** `docs/`, root `*.md`, `.cursor/`, `.github/`, `.vscode/` and `jobs/`. Markdown inside code folders still deploys (strict gitignore cannot re-include a file under an excluded parent).
- **Cron deploys** only on changes in `jobs/mbq-cron/` (not its `.md`); it has no dependencies outside that folder.
- **Verified:** 25 path cases simulated with a gitignore matcher before applying; applying created no deployment; docs-only merge `65ecc9c` (PR #48) shows **SKIPPED** on both services (`1609c44e`, `2778d147`); production stayed on `0ea63c51` / `31c64574`.
- **Gotcha:** `!/docs/**` alone does NOT work after `**`. The directory itself must be un-excluded first (`!/docs/`).
- **To change:** Railway dashboard → service → Settings → Build → Watch Paths, or the `serviceInstanceUpdate` API (`watchPatterns`). Clearing the list restores deploy-on-every-push. A manual redeploy is unaffected.

### Facts that change decisions
- Pruning dev dependencies inside the single-stage Nixpacks image does **not** shrink it (layers are additive), and dev-only packages are just 62 MB. The image lever is shipping `.output` only (advanced item 7).
- Measure bundle changes from the CI build log (Vite chunk list and the Nitro `entry-styles` line) and compare against main's CI run. Do not run `nuxt build` on the founder's laptop (out of memory).
- Dev verification without touching production: run `nuxi dev` with `STRAPI_URL=http://127.0.0.1:9` and the CI dummy Stripe keys. Pointing it at production Strapi would write analytics on artist-page views.
- After every merge, do the post-deploy check (Railway SUCCESS, smoke 200s, `/api/health`).

### Worktrees from this work
`C:\code\mb-optimize` (#46, merged), `C:\code\mb-perf1` (#47, merged), `C:\code\mb-audit` (audit drafts; now on `main`), `C:\code\mb-handoff` (this update). All can be removed once this is merged.

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

