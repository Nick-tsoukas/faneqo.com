# Codebase optimization audit (2026-11-08)

Audit only. Nothing deleted, merged or deployed. Repo state audited: `main` = `fcc7822` (PR #46 merged).

**Status update:** section G shipped in **PR #47** (merged as `6b367b0`), narrowed to ECharts, Quill, the Font Awesome SVG plugin, AOS, `nuxt-particles` and `nuxt-tiptap-editor` (15 packages). Measured in CI: entry JS 513.0 -> 237.1 kB gz. The other B1 packages (`@nuxt/ui-pro`, `luxon`, `dayjs`, the chart.js adapters, `vue-chartjs`, `yup`, `resend`, `vue-advanced-chat`, `qr-border-plugin`, the Nuxt 2 dev packages) and `nuxt-headlessui` remain for stage 2.

Evidence tags:
- **[M]** measured: production HTTP, Railway logs, lockfile graph, an esbuild bundle of the exact imports, or a production build manifest.
- **[S]** static analysis (code search, with Nuxt auto-import and registration rules accounted for).
- **[E]** estimate.

## 0. Ground truth before conclusions

| Item | Value |
|---|---|
| PR #46 | Merged as `fcc7822`. Railway deploy `6135b57a` SUCCESS, listening 20:07:33Z. `mbq-cron` also redeployed (`e2f7672f`) on the same push. |
| Smoke test after deploy | `/`, `/bob`, `/carsonlowe`, `/login`, `/signup`, `/article`, `/sitemap.xml`, `/robots.txt` → 200; backend `/api/health` → 200. |
| Deploy time, created → listening | **12m 21s → 10m 39s (−14%)** [M] |
| Source snapshot / build context | 597 → **281 MB**; 362 → **154 MB** [M] |
| Final image push | ≥921 MB (still in progress at the end of the old log; ~1,005 MB reported) → **835 MB**, pushed in 19.8 s [M] |
| Push complete → container listening | ~3m 50s → **64 s** [M] |
| Compile stages | Unchanged within noise (client 69 s, server 62 s, Nitro 111 s on this run) [M] |

**Corrections to the 2026-11-08 build report:**
1. All 91 prerendered routes are article routes, so PR #44 removes the **whole** prerender stage: 48-68 s on Railway, plus the build-time network call to Strapi. It is not ~10 s. Verified: the PR #44 CI build has no prerender step.
2. "Prune dev dependencies after build" **cannot shrink a single-stage Nixpacks image**. Layers are additive, so deleting `node_modules` in a later step only adds a whiteout. Dev-only packages are also small: 129 packages, 62 MB, mostly `canvas` [M].

## A. Executive summary

1. **Every page downloads a 1,604 kB (518 kB gzipped) entry chunk** [M, production]. It contains ECharts, Quill, Font Awesome SVG, AOS, Chart.js, Firebase and qrcode.vue, all loaded by global plugins or modules. **About 270 kB gzipped of it is code nothing uses** (ECharts 175, Quill 67, Font Awesome SVG 23, AOS 5) [M, esbuild of the exact imports]. That's roughly half of the entry transfer, on every first visit to every page, including public artist pages.
2. **Every HTML response inlines 389-538 kB of CSS** [M]. Homepage: 702 kB HTML, 538 kB of it `<style>`; even the 404 page is 404 kB. Inline CSS is not cacheable between pages. About **110 kB raw per page is dead global CSS**: Font Awesome 65 kB (used by one page), AOS 25 kB (no `data-aos` anywhere), Quill 20 kB (no editor instance). animate.css adds another 70 kB (no `animate__` classes, but see the `pulse` caveat in C). Tailwind accounts for 194 kB.
3. **39 direct dependencies are removable with high confidence; 28 of them are near-zero-risk.** The 28 would take 280 of 1,912 installed packages (148 MB) out of `node_modules`; all 39 would take 337 packages (173 MB) [M, lockfile graph]. Four of them are entire Nuxt modules that initialize on every build: `nuxt-aos`, `nuxt-particles`, `nuxt-tiptap-editor`, and the global Quill and ECharts plugins.
4. **The public artist page fetches the band twice per view** [S]: server-side for head/SEO fields, then again in the browser with `no-store` behind a loading state. This is intentional and documented in the code. Changing it is the single biggest runtime improvement, but it is the riskiest.
5. **Eight test or debug pages are public and return 200 in production** [M]: `/test`, `/testing`, `/test-qr`, `/debug-qr`, `/testsite`, `/home-classic`, `/marketing-component-preview`, `/internal/rive-sandbox`. They are built on every deploy and are the only users of several packages.
6. **The runtime image is not self-contained.** `geoip-lite` is loaded with `createRequire` from root `node_modules` (`server/api/track/band-view.post.ts`, `server/api/debug/geo.get.ts`), so an `.output`-only image would silently lose geo fallback. This must be fixed before any slim-image work.
7. **Local development:** about 3,800 untracked files under `.tmp-*` and `.visual-review` sit inside the watched project root, with no Nuxt, VS Code/Cursor or Vite exclusions. There are 28 git worktrees; most `node_modules` there are links (0 MB measured), but real 1.3 GB copies exist in at least `musicbizqr` and `mb-build`, and several worktrees keep a stale 370 MB `.output` [M].

## B. Dependency report

Method: every `package.json` entry searched as an import, require, CSS import or config string across tracked code (excluding `docs/`, `public/`). Each zero or low hit was then checked against the indirect paths: Nuxt modules, auto-imported components and composables, global component registration, templates, `isCustomElement`, `transpile`/`optimizeDeps`. No `import.meta.glob` or `require.context` exists in the repo.

### B1. Unused: high confidence (28 packages, the recommended first removal)

| Package(s) | Evidence | Note |
|---|---|---|
| `echarts`, `vue-echarts` | Only consumer of `VChart` is `components/EChart.vue`, which has no users | Global client plugin `plugins/vue-echarts.client.ts`; **175 kB gz in the entry**; 50.7 MB on disk |
| `@vueup/vue-quill`, `quill` | `QuillEditor` registered globally in `plugins/vue-quill.client.ts`; no template uses it | Also global CSS (20 kB inline per HTML); 67 kB gz in the entry |
| `@fortawesome/fontawesome-svg-core`, `@fortawesome/vue-fontawesome`, `@fortawesome/free-{solid,regular,brands}-svg-icons` | `plugins/fontawesome.js` registers `FontAwesomeIcon`; zero `<font-awesome-icon>` / `<FontAwesomeIcon>` uses | 23 kB gz in the entry. Keep `@fortawesome/fontawesome-free` (CSS; used by `pages/event/[id].vue`) |
| `nuxt-aos`, `aos` | Zero `data-aos` attributes anywhere (the only hit is a comment in `nuxt.config.ts`) | Module with JS init + 25 kB inline CSS per HTML |
| `nuxt-particles`, `vue3-particles` | No `<NuxtParticles>` usage; no imports | Module in config only |
| `nuxt-tiptap-editor` | No `Tiptap*` auto-imported components or composables; pages use `@tiptap/vue-3` directly | Module in config only |
| `@nuxt/ui-pro` | Not in `modules`, never imported | Install weight only (brings `@nuxt/icon`, `@iconify-json/*`) |
| `luxon`, `chartjs-adapter-luxon`, `chartjs-adapter-date-fns` | Never imported; the luxon adapter appears only in `vite.optimizeDeps.include` and `build.transpile` | Remove from both lists |
| `dayjs`, `vue-chartjs`, `yup`, `qr-border-plugin`, `vue-advanced-chat` | Zero imports. `vue-advanced-chat` appears only in a comment and `isCustomElement` | — |
| `resend` | Only "hit" is a `resend()` click handler in `pages/fan/login.vue`; emails send from Strapi | — |
| Dev: `@nuxt/types`, `@nuxt/typescript-build`, `@nuxtjs/date-fns`, `@types/aos` | Nuxt 2-era packages; `@nuxt/types` pulls in webpack 5 + terser | `@nuxt/types` also referenced from `tsconfig.json`; remove there too |

Measured effect of removing these 28: **280 installed packages and 148 MB** leave `node_modules` [M]. Entry JS drops by about 270 kB gz [M: esbuild of the same imports; E: exact chunking].

### B2. Unused, but tied to dead code (remove together with that code, later PR)

| Package | Only users |
|---|---|
| `tsparticles` | `components/ParticlesBackground.vue` (no users), `pages/oldpages/` (not routed) |
| `vue3-youtube` | `pages/test.vue` (public debug page) |
| `@heroicons/vue` | `pages/oldpages/index-old.vue` (not routed) |
| `@tiptap/extension-{blockquote,bullet-list,heading,list-item,ordered-list}` | Never imported; the first five are already inside `@tiptap/starter-kit` |
| `@tiptap/extension-link`, `@tiptap/extension-text-align` | Never imported; confirm no editor regressed to needing them |
| `@types/swiper` | Deprecated stub; `swiper` ships its own types |

### B3. Duplicated or overlapping libraries

| Job | Libraries present | Recommendation |
|---|---|---|
| Charts | Chart.js (5 analytics files) **and** ECharts (unused) | Keep Chart.js; drop ECharts (B1) |
| Rich text | Tiptap (event editors) **and** Quill (unused) | Keep Tiptap; drop Quill (B1) |
| Icons | Font Awesome CSS (1 page), FA SVG (unused), Lucide (11 files), Iconify (3 components, **fetches icons from api.iconify.design at runtime**), Heroicons (dead) | Standardize on Lucide. Move FA CSS to the one page that uses it; later replace those icons and bundle Iconify's few icons offline |
| Dates | `date-fns` (9 files), `dayjs` (0), `luxon` (0) | Keep `date-fns` |
| Animation | `motion-v` (26 files), `gsap` (15), animate.css (global CSS), AOS (unused), Rive (lazy) | Drop AOS; take animate.css out of global CSS after the `pulse` check; keep motion-v and gsap (both used; consolidating is not worth the risk) |
| QR | `qr-code-styling` (QR editor/download), `qrcode.vue` (display in 5 components + 2 debug pages), `qr-border-plugin` (0) | Drop the plugin; keep both QR libraries (different jobs) |
| Particles | `nuxt-particles`, `tsparticles`, `vue3-particles` | All dead |
| Sitemap | `@nuxtjs/sitemap` directly **and** via `@nuxtjs/seo` | Harmless; keep the direct pin unless versions drift |
| IDs | `uuid` (2 QR components) | `crypto.randomUUID()` covers it (LATER) |

### B4. Heavy packages that are used

| Package | Weight | Where | Opportunity |
|---|---|---|---|
| `firebase` (app + auth) | 36 kB gz client [M]; traced into the server too | `plugins/firebase..ts` runs on **every** SSR request and page; only `pages/login.vue` and `pages/signup.vue` use it | Lazy-init inside `useFirebase()` (it already lazy-imports `signInWithPopup`). **Touches Google sign-in → needs explicit approval** |
| `chart.js` | 55 kB gz in the entry [M] | Global `plugins/chart.js` (`$chart` has zero users) while the 5 consumers import `chart.js` themselves | Drop the global plugin after checking each consumer registers its own controllers/scales |
| `googleapis` | 28 MB in the server output [M, Nov 8] | ~10 Corvana admin SEO routes | Scoped `@googleapis/searchconsole` (LATER; Corvana token work is deferred) |
| `sharp` | 41 MB in the server output [M, Windows] | `@nuxt/image` default IPX provider resizes S3 images inside the Railway container on request (13 `NuxtImg` uses) | Consider the S3/Strapi `formats` URLs or a CDN provider; measure `/_ipx` traffic first |
| `three` | Lazy (gallery experiments, passport lab) | Not in the entry | None now |
| `nuxt-og-image` (via `@nuxtjs/seo`) | 1.1 MB Inter fonts in the server output [M] | Never used (`defineOgImage` = 0); the app has its own satori/resvg OG endpoints | `ogImage: { enabled: false }`, after confirming no meta change |

### B5. Production vs. dev placement

`canvas` (35.6 MB) is correctly a dev dependency (scripts only). No production package was found that should be dev-only, apart from the Nuxt 2 leftovers in B1. Total dev-only weight is just 62 MB [M]; moving packages between sections is **not worth doing for image size** (see correction 2).

## C. Nuxt architecture findings

### C1. Modules (14 registered)

| Module | Status |
|---|---|
| `nuxt-aos` | **Unused**: no `data-aos`. Injects global JS + 25 kB CSS |
| `nuxt-particles` | **Unused** |
| `nuxt-tiptap-editor` | **Unused** (direct `@tiptap/vue-3` imports instead) |
| `nuxt-headlessui` | **Unused**: zero `<Headless*>` components anywhere (module default prefix) [S]. High confidence; add to the next dependency PR |
| `@nuxtjs/seo` | Used (robots, sitemap, site). Sub-modules unused: `nuxt-og-image` (fonts in the server bundle), schema.org (0 uses), link checker (build-time scan, ~10 s) |
| `@unlok-co/nuxt-stripe` | Zero `useClientStripe`/`useServerStripe` uses [S]. **Payments area: out of scope; do not touch without a payments-owner review** |
| `@vite-pwa/nuxt` | Used. Out of scope (no PWA caching changes) |
| `@nuxtjs/strapi`, `@pinia/nuxt`, `@vee-validate/nuxt`, `@nuxt/image`, `@nuxtjs/tailwindcss`, `motion-v/nuxt` | Used. `@vee-validate/nuxt` serves a single page (`pages/login.vue` uses `useForm`); low value, leave |

Modules active with zero use: **4 certain** (`nuxt-aos`, `nuxt-particles`, `nuxt-tiptap-editor`, `nuxt-headlessui`), plus 2 sub-modules (`nuxt-og-image`, schema.org) and 1 out of scope (`nuxt-stripe`).

### C2. Plugins (12)

| Plugin | Scope | Finding |
|---|---|---|
| `vue-echarts.client.ts` | global | **Dead**: 175 kB gz on every page |
| `vue-quill.client.ts` | global | **Dead**: 67 kB gz + 20 kB CSS on every page |
| `fontawesome.js` | global, SSR + client | **Dead**: 23 kB gz |
| `chart.js` | global, SSR + client | Redundant: `$chart` unused, consumers import it themselves. 55 kB gz |
| `firebase..ts` | global, SSR + client | Used by 2 pages; initializes Firebase on every server request. Auth-sensitive. The `..` in the filename is a typo-like oddity worth fixing when touched |
| `qrcode-vue.ts` | global component | 6 kB gz; used in 5 components (share drawer, homepage story, 3 deck slides). Make it route-local (LATER) |
| `router-history.client.ts` | global | Used by `pages/dashboard/index.vue` (and `pages/test.vue`); fine |
| `ga.client.ts`, `meta-pixel.client.js`, `marketing-attribution.client.js`, `fan-identity.client.js`, `pwa.client.js` | global | Used and intended. Out of scope (tracking/auth/PWA) |

`chart.js`, `fontawesome.js` and `vue-echarts.client.ts` are listed in `nuxt.config.ts` `plugins` **and** auto-discovered from `plugins/`. Nuxt de-duplicates by path, so they don't run twice, but the config entries go stale once the files are removed.

### C3. Global CSS (`nuxt.config.ts` `css`)

`tailwind.css` (194 kB inline), `animate.css` (70 kB), `@fortawesome/fontawesome-free/css/all.css` (65 kB). Plus plugin CSS from Quill (20 kB) and the AOS module (25 kB). All of it is inlined in every SSR HTML response [M].

- **animate.css caveat:** 22 places use `animation: … pulse` and 1 uses `fadeIn`. animate.css defines a global `@keyframes pulse` (scale) that collides with Tailwind's `pulse` (opacity), and whichever loads last wins. Removing animate.css can therefore change those 22 animations. **Needs a side-by-side visual check; not a blind delete.**
- **Tailwind content globs** scan `pages/**` including `pages/oldpages/**`, demo pages and test pages. Removing dead pages and excluding `oldpages` will trim the 194 kB [E: modest].
- **`features.inlineStyles`** (Nuxt default: inline) is why the CSS is re-sent with every HTML response. Switching to linked stylesheets makes it cacheable across navigations and visits, at the cost of one render-blocking request on the first visit. Measure LCP before and after (MEDIUM).

### C4. Vite / Nitro

- `vite.optimizeDeps.include` and `build.transpile` list `chartjs-adapter-luxon` (unused) and `chart.js`/Tiptap. `chart.js` v4 ships ESM, so transpiling it is unnecessary. A small Nitro/Vite SSR cost [E: seconds].
- `nitro.externals.inline: ['geoip-lite']` has no effect, because the code bypasses the bundler with `createRequire`. See A6.
- Prerender: 91 routes, all articles (handled by PR #44).
- Shared chunk: the entry is one 1.6 MB chunk because global plugins import the libraries statically. Removing the dead plugins is the main fix; `manualChunks` would not help until then.

## D. Dead-code findings (on `main`; your uncommitted homepage-v3 work may use some of these)

Method: Nuxt auto-registration names (path-prefixed, de-duplicated, `Lazy*`, kebab-case), explicit import paths, string component names, and exported-identifier auto-imports for composables. Any match counted as "used", so the result is conservative.

| Class | Items |
|---|---|
| **Proven unused** (no reference of any kind) | 48 components (e.g. `EChart`, `ScansChart`, `TipTapEditor`, `ParticlesBackground`, `MomentumPromptsPanel`, `AfterShowRecapPanel`, `dashboard/ShareablesHub`, `PulseMomentsPanel`, `band/FollowBandModal`, 11 files in `components/decks/mbq/`, 6 in `components/demo/scenes/`, `home-v2/HomeV2Close`, `HomeV2ArtistProof`, `HomeV2ProductCanvas`); composables `useSmartLinkLiveSurface`, `usePublicationProfile`, `useOpenExternal`, `useGeo`, `home-v2/useHomeV2LayoutRefresh` |
| **Probably unused; verify** | 15 components referenced only by tests, `__dev` or `oldpages` (e.g. `demo/MomentumEngineSection`, `passport/FanPassportNightDetail`, `home-v2/HomeV2Hero`, `HomeV2Headquarters`, `messages/FaneqoComposerLab`); `composables/useShowCheckIn.js` (no references, but Show Mode is active, so check whether `useShowCheckInQueue` replaced it); `home-v2/useHomeV2ProductStage`; `utils/ui/faneqoBrand.js`; 5 `features/` lab files used only by `__dev` pages |
| **Public test/debug routes** (live, 200) | `pages/test.vue`, `testing.vue`, `test-qr.vue`, `debug-qr.vue`, `testsite.vue`, `home-classic.vue`, `marketing-component-preview.vue`, `internal/rive-sandbox.vue`; also `directqrold.vue`, `demo.vue`, `home-v2.vue` (noindex). **Public URLs: remove only with founder sign-off**; at minimum noindex them |
| **Still required** | `pages/__dev/**` (404 in production via route rules; kept for review tooling), `labs/**` (middleware-gated), `pages/oldpages/**` (not routed; only cost is the Tailwind scan) |
| **Logging noise** | 213 `console.log` lines in shipped code, including 10 in `server/routes/directqr.ts` (QR scan path) and `[BAND PAYLOAD]` on every artist view. Runtime volume is currently low (13 lines/hour); hygiene, not performance |
| Total source in proven-unused components | ~334 kB [M] (no runtime cost unless imported; maintenance and Tailwind-scan cost) |

## E. Build and runtime findings (ranked by impact)

| # | Finding | Impact | Evidence |
|---|---|---|---|
| E1 | Dead global plugins/modules in the entry chunk | **~270 kB gz less JS on every page's first load** | [M] |
| E2 | Dead global CSS inlined in every HTML response | ~110 kB raw per HTML (FA 65 + AOS 25 + Quill 20); +70 kB if animate.css goes | [M] |
| E3 | Article retirement (PR #44) | −48-68 s per build and no Strapi call at build time | [M] |
| E4 | Railway watch patterns: `mbq-cron` rebuilt on PR #46 (frontend-only); docs-only merges build both services | A whole ~10.5 min deploy saved per docs-only merge | [M] (cron deploy `e2f7672f`) |
| E5 | Artist page double band fetch + client-rendered body | One fewer Strapi request per view; content in SSR HTML; no loading flash | [S] |
| E6 | 280-337 fewer installed packages | `npm ci` time [E: ~10-20 s of 71-124 s], −148-173 MB on disk/image raw | [M] |
| E7 | Slim runtime image (multi-stage or Railpack pilot) | 835 MB → ~250-350 MB [E: `.output` ~162 MB gz + Node base], faster push/pull | Requires first: E8, and moving the studio MP4 script into `.output` or a worker |
| E8 | `geoip-lite` loaded outside the bundle | Prerequisite for E7; today silently relies on root `node_modules` | [S] |
| E9 | `features.inlineStyles: false` | Cacheable CSS; smaller HTML; repeat-view speed | [E]; measure LCP |
| E10 | Firebase lazy-init | −36 kB gz client and no Firebase on SSR | [M]; auth approval needed |
| E11 | IPX image resizing on the app container | CPU per uncached image request | [S]; measure `/_ipx` traffic |
| E12 | Strapi `populate: '*'` | 13 sites in 8 files, all editor/admin/article pages (not public hot paths) | [S]; low priority |
| E13 | Listener/timer leaks | Only 2 candidates: `composables/useSmartLinkPageMode.js` (`setInterval`, no `clearInterval`), `composables/usePwa.js` (`window.addEventListener`, no removal; likely an intentional app-lifetime listener) | [S]; verify |

## F. Optimization roadmap

### Quick wins (low risk, high confidence)
1. Remove the dead global plugins and modules plus their 28 packages (B1). **First PR; see G.**
2. Move Font Awesome CSS from global `css` into `pages/event/[id].vue`.
3. Railway watch patterns: `mbq-cron` → `/jobs/mbq-cron/**`; frontend → ignore `docs/**` and `**/*.md` (Railway dashboard; founder action).
4. Add `.tmp-*`, `.visual-review`, `docs`, `scripts` to the editor `files.watcherExclude` and a `.cursorignore`, and `ignore` them for Nuxt dev; make `devtools` opt-in via an env var (local only).
5. Delete stale worktrees and their build output (several stale 370 MB `.output` folders, two real 1.3 GB `node_modules`) [M]; list in section H.

### Medium (measured benefit, moderate work)
6. Merge PR #44 article retirement on its own (−48-68 s build).
7. Remove the global `chart.js` plugin after verifying each of the 5 consumers registers its own chart parts (−55 kB gz entry).
8. animate.css removal after a visual check of the 22 `pulse` usages (−70 kB inline CSS per page).
9. Dead-code PR: proven-unused components/composables plus B2 packages, and noindex or removal of the public test routes (founder decision on the URLs).
10. `@nuxtjs/seo`: disable `ogImage` and schema.org if meta output is unchanged; `linkChecker.runOnBuild: false`.
11. `features.inlineStyles: false`, measured with Lighthouse/LCP before and after on `/` and one artist page.

### Advanced (high impact, careful engineering)
12. Artist page: SSR the full band once (single `useAsyncData` with the existing populate list) and hydrate; remove the client re-fetch and loading state. Needs hydration testing across all 4 page templates.
13. Firebase lazy-init inside `useFirebase()` (auth approval required).
14. Slim runtime image: fix `geoip-lite` resolution, move or confine the studio MP4 script, then pilot Railpack or a multi-stage build on a throwaway Railway service. Quantified target: 835 MB → ~250-350 MB [E]. Risks: start command, `process.cwd()` file reads, cron service unaffected (separate root). No custom Dockerfile until the pilot proves it.
15. `googleapis` → scoped Search Console client (after the Corvana token work); IPX → CDN/S3 formats.

### Not worth the risk now
- Consolidating `gsap` and `motion-v` (both widely used; large visual-regression surface).
- `manualChunks` tuning before the dead plugins are gone.
- Moving `qrcode.vue` to route-local (6 kB gz).
- Replacing `uuid` (tiny).
- Any change to `@unlok-co/nuxt-stripe`, PWA caching or auth flows inside a performance PR.

## G. Recommended first implementation (one PR, zero intended visual change)

> Done in PR #47 (scope narrowed as noted at the top of this report).

**"Remove dead global plugins, modules and packages"**

1. Delete `plugins/vue-echarts.client.ts`, `plugins/vue-quill.client.ts`, `plugins/fontawesome.js`, and `components/EChart.vue` (its only consumer of ECharts; no users).
2. Remove `'~/plugins/fontawesome.js'` and `'~/plugins/vue-echarts.client.ts'` from `nuxt.config.ts` `plugins`; keep `'~/plugins/chart.js'` for now.
3. Remove `nuxt-aos`, `nuxt-particles`, `nuxt-tiptap-editor` from `modules` and the `aos` config block; remove `chartjs-adapter-luxon` from `optimizeDeps.include` and `build.transpile`.
4. Uninstall the 28 B1 packages and regenerate the lockfile (removes `@nuxt/types` from `tsconfig.json` types).
5. Keep `@fortawesome/fontawesome-free` global for this PR (moving it is quick win #2, done separately so a visual diff is isolated).

**Expected [M/E]:** entry chunk about −270 kB gz (518 → ~250 kB); −45 kB inline CSS per HTML (AOS 25 + Quill 20); −280 installed packages / −148 MB `node_modules`; slightly faster `npm ci` and Vite builds.

**Tests:** `npm test` (includes `test:hygiene` and `test-ui-component-imports`), Frontend CI production build, then compare the entry size and inline-CSS bytes on a production-mode preview. Visual spot-checks: `/`, an artist page, `/login`, `/signup`, `/dashboard`, `/analytics/:id`, `/editevent/:id` (Tiptap), `/event/:id` (Font Awesome icons). After deploy, re-measure the live entry transfer (518 kB baseline) and homepage HTML (702 kB raw baseline).

**Independent:** yes. No payments, auth, PWA, data or URL changes.

## H. Local development notes

- Watched but irrelevant inside `C:\code\musicbizqr`: 26 `.tmp-*` items (2,857+ files, including Chrome profiles), `.visual-review/` (920 files). Neither `.vscode/settings.json` `files.watcherExclude` nor Nuxt's `ignore` covers them, and there is no `.cursorignore`.
- `devtools: { enabled: true }` always loads Nuxt DevTools in dev (memory); make it `process.env.NUXT_DEVTOOLS === '1'`.
- 28 worktrees exist (`git worktree list`). Measured: most `node_modules` are links (0 MB); real 1.3 GB copies in `musicbizqr` and `mb-build`; stale 370 MB `.output` in `mb-articles`, `mb-motion`, `mb-pres`, `mb-rel`. Merged or abandoned branches (`mb-articles` excepted, which preserves PR #44) are candidates for `git worktree remove` **by the founder**.
- Dependency removals in G shrink every worktree's `npm ci` by about 148 MB.

## I. Answers to the specific questions

| Question | Answer |
|---|---|
| Dependencies safely removable | **28 now** (B1), **11 more** with the dead-code PR (B2) = 39 of 92 direct dependencies (78 prod + 14 dev) |
| Unnecessary modules/plugins active | **4 modules** (`nuxt-aos`, `nuxt-particles`, `nuxt-tiptap-editor`, `nuxt-headlessui`) + **3 dead global plugins** (ECharts, Quill, Font Awesome) + 1 redundant global plugin (Chart.js) + 2 unused SEO sub-modules |
| Most unnecessary weight | ECharts (175 kB gz client, 50.7 MB disk), Quill (67 kB gz + 20 kB CSS), animate.css (70 kB CSS/page), Font Awesome CSS (65 kB/page for 1 page) |
| Biggest measurable difference | G (entry −52% transfer), then PR #44 (−48-68 s build), then watch patterns (whole deploys skipped), then artist-page SSR (advanced) |
| Easy wins | G, Font Awesome CSS move, watch patterns, editor/watcher excludes |
| Not worth the risk | gsap/motion-v consolidation, chunk tuning now, payments/PWA/auth changes inside a perf PR, custom Dockerfile before the pilot |
