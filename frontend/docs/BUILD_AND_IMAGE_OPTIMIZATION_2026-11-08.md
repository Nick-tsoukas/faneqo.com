# Build and image optimization audit (2026-11-08)

Scope: Railway/Nixpacks build of the Nuxt frontend (`musicbizqr`). Measured from Railway build logs, GitHub deployment and Actions APIs, and local file measurements. Nothing was deployed or merged.

## 1. Production versus main

| | Commit | Evidence |
|---|---|---|
| GitHub `main` | `a0c5a60` (PR #45, revert of #44) | `git fetch` |
| Railway `musicbizqr` production | `a0c5a60`, deployment `358e858f`, **SUCCESS** | `railway deployment list`; container logged `Listening on http://[::]:8080` at 18:55:10Z |
| Railway `mbq-cron` | `a0c5a60`, deployment `422627cd`, SUCCESS | same service list, root dir `/jobs/mbq-cron` |

Production and main are on the same commit. Railway records no canceled deployment for the revert; it records SUCCESS (created 18:42:49Z, listening 18:55:10Z, 12m 21s). If a manual cancel happened, it was not the final state.

Failed PR #44 deployments (`cb7ef554`, `761de49c`): GitHub shows failure **78 s** and **40 s** after start. A build here takes about 6.5 minutes before the image is even exported, so these were not compile, OOM or timeout failures. Their build logs have expired, so the cause is **unknown** and likely Railway-side or early pipeline. PR #44's code change is small (14 files, +136/-2190, no dependencies).

## 2. Measured timeline

Successful revert deploy `a0c5a60` (Railway) versus the previous successful deploy `f60f11d`.

| Stage | `a0c5a60` | `f60f11d` |
|---|---|---|
| Deploy created → source snapshot uploaded (597 MB, 10.7 s) | 48 s | n/a |
| Build context transfer (361.6 MB, 13.1 s) | 13 s | 8 s |
| `npm ci` (1,911 packages) | **71 s** | **124 s** |
| `COPY . /app/.` (second copy, before build) | 14 s | n/a |
| Nuxt client build (Vite) | 65 s | 93 s |
| Nuxt server build (Vite SSR) | 66 s | 89 s |
| Prerender stage in total (of which ~37 s is prerenderer start-up and only ~9 s is rendering the 91 routes) | 48 s | 51 s |
| Nitro server build | 85 s | 131 s |
| `npm run build` total | **288 s** | **398 s** |
| `COPY . /app` (final) | 15 s | 18 s |
| Image export | 57 s | 68 s |
| Push + registry + start (container listening) | ~231 s | not captured |
| **Total, deploy created → listening** | **~12m 21s** | **~12m 31s** (GitHub success time) |

What this says:

- The Nuxt compile (client + server + Nitro) is about 3m 36s of a 12m 21s deploy.
- Image export, push and rollout is roughly **4m 48s (39%)** and scales with image size. This is the largest lever and it is size-driven.
- Run-to-run variance is large (`npm ci` 71 vs 124 s; Nitro 85 vs 131 s). Small compile-time tweaks cannot be proven on a single Railway run.
- The build is single-stage Nixpacks: the final image is the build container, so it carries `node_modules` (including dev dependencies), `.nuxt`, source, `.output` and everything tracked.
- `COPY . /app` runs three times (steps 5, 7, 10), each copying the whole tracked tree.

Unknown (not in retrievable logs): the exact push duration, the final image size from the registry (reported as ~1,005 MB; the push-progress rows corroborate it, reaching 921 MB at 18:51:51Z), and the per-layer composition. There is no Docker on the audit machine, so the image could not be rebuilt locally.

## 3. What is in the image (largest first)

Measured on `origin/main`, tracked files only (565.6 MB raw before this PR):

| Item | Raw | Notes |
|---|---|---|
| `.tmp-hq-shots/` | 224.7 MB, 2,771 files | Three Chrome profiles, caches, extensions, a 35 MB tflite model, captured shots. Already matched `.gitignore` (`.tmp-*`) but tracked. ~130 MB gzipped. |
| `public/*.mp4` (2 files) | 150.3 MB | `howtocreateqr.mp4`, `howtocreateartistpage.mp4`. **No references in code.** Copied again into `.output/public`, so present twice per image. |
| `assets/` unreferenced files | 63.5 MB (44 files ≥ 100 KB) | Never imported, so never bundled. Includes `ZoomInstaller.exe` (27.7 MB), screenshots, a PDF, unused album art. |
| `.tmp-experience-review/` | 10.4 MB, 31 files | Review dumps; also tracked while ignored. |
| Everything else tracked | ~92 MB | Code is 7 MB gzipped. |

Not tracked but in the image (local Windows measurements; Linux sizes will differ):

- `node_modules/` about 1.1 GB raw (dev dependencies included).
- `.nuxt/` 49 MB.
- `.output/` 357 MB raw: `public` 249 MB (150 MB is the MP4s) and `server` 108 MB, of which `server/node_modules` is 96 MB (`sharp` 41, `googleapis` 28, `@google-analytics/data` 4.6).

Server sourcemaps are only 2.6 MB of the Nitro output, so they are **not** a lever (checked and dropped).

## 4. Changes in this PR

1. **Untracked generated artifacts** (`git rm --cached`, no history rewrite): `.tmp-hq-shots/`, `.tmp-experience-review/`, `.tmp-msg-visual/`. 2,805 files, 235 MB. Files stay on disk for anyone who has them, and `.gitignore` already covers them. The browser-profile contents were not opened or printed.
2. **Removed 44 unreferenced files from `assets/`** (63.5 MB, each ≥ 100 KB). Basename search across every tracked file outside `docs/` found no reference, and there are no `import.meta.glob`, `require.context` or template-string asset paths anywhere. Anything the build cannot reach cannot be missing from the output; a stray import would fail the Vite build in CI. Recoverable from git history.
3. **Regression guard** `scripts/test-repo-hygiene.mjs`, wired into `npm test` as `test:hygiene`: fails if any tracked file matches `.gitignore`, or any tracked file exceeds 10 MB outside a two-entry allowlist (the MP4s).

Result: tracked tree **565.6 MB → 266.9 MB (-53%)**, 4,563 → 1,714 tracked files. No application code, dependency, config, payment, auth or runtime path changed.

## 5. Verification

- Local: `npm test` passes in a clean worktree from `origin/main` plus this change (43 suites, 288 checks, exit 0), using the lockfile-identical `node_modules` of another worktree.
- Not run locally: `nuxt build`. This laptop runs out of memory on it (standing rule in the handoff). The build is proven by Frontend CI on this PR, which runs `npm test` and `npm run build`.
- Baseline CI on `main` (`a0c5a60`): checkout 11 s, `npm ci` 35 s, tests 18 s, build 192 s, job 272 s. The PR run is the like-for-like comparison.
- Image size and Railway deploy time cannot be reproduced locally. They will be measurable on the first Railway deploy after merge (see section 8).

## 6. Expected effect (estimates, not measurements)

- Source snapshot 597 MB → roughly 300 MB; context transfer and the three `COPY` steps (33 s combined on the measured deploy) shrink with it: about 20-30 s saved.
- Image: the removed files were about 200 MB gzipped per copy. Whether they were stored once or up to three times in layers cannot be determined without registry access, so the saving is **200-600 MB of the ~1,005 MB**, and export/push/rollout (4m 48s) should shrink in proportion.
- Compile time (about 3m 36s) is unchanged by this PR.

## 7. Ranked recommendations

| # | Item | Impact | Risk | Status |
|---|---|---|---|---|
| 1 | Untrack `.tmp-*`, drop unreferenced `assets/` | High (size/push) | Very low | **DO NOW (this PR)** |
| 2 | Railway watch patterns: `mbq-cron` (root `/jobs/mbq-cron`) rebuilds on every push to main with no watch pattern, and docs-only merges (including handoff updates) trigger full ~12-min frontend builds | High (skips whole deploys) | Low; Railway-side setting, easy to revert | NEXT PHASE (needs a dashboard change) |
| 3 | Move or remove the two 150 MB MP4s (no code references; external links unverified) | High (~150 MB twice per image) | Medium: public URLs may be linked from emails or CMS content | NEXT PHASE: confirm in Railway HTTP logs/analytics first. Request-log filtering was inconclusive in this audit |
| 4 | Slim the runtime image: prune dev dependencies after build | High (~1 GB raw `node_modules`) | Medium: `geoip-lite` is loaded via `createRequire` at runtime, and `server/utils/studioMp4Jobs.js` spawns `scripts/export-studio-mp4.mjs` from `process.cwd()` (feature off). The service sets an explicit build command (`npm run build`), which may override `nixpacks.toml`, so the change must be made and piloted on a throwaway Railway service or PR environment | NEXT PHASE |
| 5 | Set `NPM_CONFIG_AUDIT=false` and `NPM_CONFIG_FUND=false` on the service | Low (seconds) | None | NEXT PHASE (Railway variable) |
| 6 | `linkChecker: { runOnBuild: false }` (module option verified in `nuxt-link-checker` 4.3.1; build summary only, `failOnError` is already false) | Low (~10 s, unmeasured) | Very low | LATER |
| 7 | Client bundle: a 1.5 MB chunk contains both ECharts/zrender and Chart.js strings and is loaded by global plugins (`plugins/chart.js`, `plugins/vue-echarts.client.ts`); `Turns Me On.mp3` (8.5 MB) and two 1.8-1.9 MB posters are bundled into `_nuxt`; Font Awesome ships as global CSS plus an SVG plugin | Medium (runtime, not deploy) | Medium | LATER: run a bundle analyzer; do not remove dependencies from static search alone |
| 8 | `googleapis` (28 MB) is imported by about 10 admin SEO routes under `server/api/corvana/` | Medium (output size, nft tracing time) | Medium | LATER; deferred until the Corvana SEO token issue is resolved |
| 9 | Reintroduce article retirement (PR #44) | Small for build time: route rendering is only ~9-12 s; the ~37 s prerenderer start-up remains because other routes still prerender. Its value is SEO/content, not speed | Low code risk | Separate PR, after a clean baseline deploy of this one |
| 10 | Custom Dockerfile / multi-stage build | Highest ceiling | High | REJECT for now; revisit only after #2-#4 with a migration plan |

## 8. After merge: how to measure

Pull the first post-merge deploy's build progress rows and compare with section 2:

```
railway logs --build <deployment-id> --json -n 5000   # rows with source "railway.progress" give snapshot, context and push sizes
railway deployment list --json                         # createdAt vs status
```

## 9. Remaining unknowns

- Why PR #44's two deployments failed in 40-78 s (logs expired). Capture build logs immediately next time.
- Final image size per layer and push duration (no registry access; log tail ends at 921 MB mid-push).
- Whether Railway honors a `.dockerignore` for the Nixpacks build. Not tested; no deploys were triggered.
- Whether the two MP4s are requested from the outside.
- The stalled upload described in the brief does not appear in Railway's final record (SUCCESS).

## 10. Recommendation

**GO** to review and merge this PR once CI is green: it is delete-only plus a test, changes no runtime path, and is reversible with a revert. Do **not** expect it alone to hit the 5-minute target; items 2-4 are needed for that.
