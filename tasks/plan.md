# Implementation Plan: Single-repo `Nick-tsoukas/faneqo.com` + cheap staging

## Overview

Stand up cheap staging (DO droplet + compose) from the workspace root **before** any history rewrite. Optional local-only temp path: drop nested `frontend/.git` / `backend/.git` so the workspace is one deployable tree for staging — never push that surgery to `musicbizqr` / `qrserver`. After staging works, restore pristine product checkouts, then merge commit history into empty `Nick-tsoukas/faneqo.com`. Only after that (and approval): product-tree monorepo edits, Railway prod cutover, and audit remediation per `tasks/audit-issues-plan.md`.

**Product remotes stay the source of truth.** `musicbizqr` and `qrserver` keep receiving normal development on GitHub. This plan does **not** pause FE/BE work. It only delays monorepo history merge, nested-`.git` surgery that affects remotes, and Railway prod retarget until staging is live.

This file + `tasks/todo.md` are the **canonical** migration docs. Root `AGENTS.md` is the always-loaded entrypoint. Older Cursor drafts under `.cursor/plans/` are historical only.

This plan is **read-only for product code in the monorepo sense**. No monorepo-driven edits under `frontend/` or `backend/` until the final approved step. Day-to-day product commits continue on the existing remotes as usual. Root workspace files (`docker-compose.yml`, `stack.config.ts`, `example.env`, root `package.json`) already exist and may be used for staging without changing app code.

## Current state (verified)

| Fact | Evidence |
|------|----------|
| Workspace root becomes content-only git on `staging` (Phase 1) | Local `.git` + push to `faneqo.com` `staging`; not history merge |
| `frontend/` = `Nick-tsoukas/musicbizqr`, tip at nested-`.git` removal | `625decc619e9743c89600e6dda6b9564db53e937` (`main`) |
| `backend/` = `Nick-tsoukas/qrserver`, tip at nested-`.git` removal | `bef413d7cb2b9903a0f6b53a6698ed26a2e5f3a1` (`main`) |
| Target `Nick-tsoukas/faneqo.com` exists and is **empty** (will get content-only `staging` push before history merge) | GitHub API: empty default branch / 409 on ref; Phase 0 lock |
| Local stack: compose Postgres + stackrun `$development` / `$staging` | Root `docker-compose.yml`, `stack.config.ts`, `example.env` |
| Compose = unified file, no profiles (Architecture G) | Dev: `up -d postgres`; staging: `up -d` all services — stock-Node FE/BE (nested tags FE/BE → `NODE_VERSION` → `22.11.0`) volume-mounted |
| Init creates `faneqo_staging` DB | `docker/postgres-init.sql` |
| Local Node pin via mise (dev host only) | Root `mise.toml` + `NODE_VERSION` in `example.env` (Architecture H); staging droplet/containers do **not** need mise. **Gap (2026-11-08):** host `$development` / staging host builds still use shared `NODE_VERSION` only — `BACKEND_NODE_VERSION` is unused on the host path (Task 3.9). |
| No custom app Dockerfiles planned for staging | Staging FE/BE use stock Node image tags from env + volume mounts (Architecture G locked); unrelated `frontend/workers/studio-video/Dockerfile` out of scope |
| Root `npm test` runs stackrun + root shape checks | `tests/stackrun/` (import-root overlays) + `tests/root/` (scripts / mise / example.env / compose / docs); Task 3.7. Full FE/BE app builds **not** in root suite. GitHub Actions root workflow still Phase 5 / Task 12 |
| Each app already has its own CI on its own remote | `frontend/.github/workflows/ci.yml`, `backend/.github/workflows/ci.yml` |
| Prod Railway: two projects (FE `musicbizqr`+`mbq-cron`, BE `qrserver`+Postgres) | Root `AGENTS.md` |
| Audit remediation track (not started) | `tasks/audit-issues-plan.md` + `tasks/audit-issues-todo.md` + `tasks/audit-issues.md` |
| Prior Cursor plan (superseded) | `.cursor/plans/monorepo_staging_stack_641598ee.plan.md` — local compose/stackrun largely done; staging = **DO+compose**; history-first order **replaced** by this revision |

No root `SPEC.md` / `STACK.md` / `PLAN.md` (on purpose: `AGENTS.md` + `tasks/` + short `README.md` are enough). Product loops stay in `frontend/AGENTS.md` and `backend/AGENTS.md` — do not deep-scan those trees unless a task needs product code.

## Hard constraints

1. **Do not do monorepo/git surgery on product remotes** until staging works and history-merge phase starts. Normal product development on `musicbizqr` / `qrserver` continues.
2. **Do not edit `frontend/` or `backend/` for monorepo/staging product fixes** until the last approved code step (day-to-day product work on those remotes is separate and allowed).
3. **Do not retarget production Railway** services to the monorepo until staging is validated and cutover is approved.
4. **Temp nested-`.git` removal (if used) is local-only.** Never force-push rewritten or stripped history to `musicbizqr` / `qrserver`. Re-clone pristine checkouts before the real history merge.
5. Staging must not use live Stripe / live Resend / production domains / `chalk-volume`.
6. One git merge does **not** merge the two Railway projects; cutover is a separate ops step.

## Preferred sequence (user correction)

```
1. Work at workspace root — no FE/BE remote rewrite, no history merge yet
2. Optional temp: remove frontend/.git + backend/.git (local only)
   → one deployable tree / one root git for staging
   → never push that to musicbizqr / qrserver
3. Unified compose profiles locally (db-only vs staging apps), then staging live on DO droplet with same file (lean)
4. Tear down temp layout; re-clone current FE/BE from remotes (pristine history)
5. Proper commit-history merge into Nick-tsoukas/faneqo.com (filter-repo etc.)
6. Only then (+ approval): monorepo product edits / prod cutover / audit
```

## Dependency graph

```
Root orchestration (compose, stackrun, example.env, mise pin) — present / Task 3.4
        │
        ├── Optional: local root git + temp nested-.git removal (local only)
        │
        ├── Root test suite (stackrun overlays + shape checks) — Task 3.7
        │
        ├── Unified compose profiles (one file: db-only vs staging apps)  ← before droplet
        │       │  image tags from NODE_VERSION / FRONTEND_* / BACKEND_*
        │       └── [CHECKPOINT: local staging profile OK; human OK stock Node]
        │
        ├── Staging host (DO droplet + same compose `up -d`)  ← EARLY
        │       │
        │       └── [CHECKPOINT: staging dogfood OK; prod still on old remotes]
        │
        ├── Restore pristine FE/BE checkouts (re-clone from remotes)
        │
        ├── History merge into empty faneqo.com (filter-repo / subtree)
        │       │
        │       ├── Root files committed onto monorepo
        │       │
        │       └── Path-aware CI on monorepo
        │
        ├── [CHECKPOINT: monorepo green; product remotes still source of truth until cutover]
        │
        ├── Point daily workspace at faneqo.com
        │
        ├── Approved monorepo product edits — LAST code step in FE/BE trees here
        │
        ├── Production cutover (Railway → monorepo; watch paths)
        │
        └── Audit remediation (`tasks/audit-issues-plan.md`) — after single-dir/repo is daily reality
```

Vertical slices: each phase leaves a usable system. Staging is not blocked on history merge.

## Architecture decisions

### A. Staging before history merge (preferred)

Do **not** wait for filter-repo into `faneqo.com` to stand up staging. Deploy trees from the workspace (rsync/scp, root git content push, or similar) onto DO compose.

**Optional temp path** for “one deployable tree”:

1. Record current FE/BE tip SHAs and confirm remotes are still `musicbizqr` / `qrserver`.
2. Ensure no uncommitted work that must survive (stash/commit on product remotes first if needed).
3. Locally remove `frontend/.git` and `backend/.git` only.
4. `git init` at workspace root (or use a dedicated staging clone); add trees + root files; push content to `faneqo.com` or a staging deploy mechanism **without** claiming this is the history-preserving merge.
5. After staging works: delete temp root-git layout as needed; **re-clone** `musicbizqr` → `frontend/` and `qrserver` → `backend/` so full history returns.
6. Only then run filter-repo merge from **fresh clones** into `faneqo.com`.

**Risks of temp `.git` removal:**

| Risk | Mitigation |
|------|------------|
| Lose local uncommitted product work | Commit/push to product remotes first; or stash outside tree |
| Accidentally push stripped tree to product remotes | Never add/push those remotes from the temp root repo; no force-push to old remotes |
| Run filter-repo on stripped trees (no history) | Forbidden — always re-clone pristine remotes before merge |
| Product remotes diverge while staging uses old trees | Acceptable: remotes stay source of truth; re-clone picks up latest before merge; re-deploy staging from new tips if needed |
| Confuse content-only `faneqo.com` push with real merge | Label content-only deploys clearly; overwrite/replace with filter-repo merge later |

**Skip temp path** if staging can deploy with nested checkouts intact (e.g. compose `COPY` / rsync of dirs without a single root git). Then skip Phase 1 Task 3 and Phase 3 restore complexity.

### B. History migration → `git filter-repo` + unrelated merge (late; recommended)

**Do not** treat the temp stripped tree as the final monorepo. History merge runs **after** staging checkpoint, from **fresh clones**.

**Recommended procedure** (scratch clones only; do not force-push to product remotes):

1. Fresh clones of `musicbizqr` and `qrserver` at the `main` SHAs you want merged (current tips after normal development).
2. FE clone: `git filter-repo --to-subdirectory-filter frontend`.
3. BE clone: `git filter-repo --to-subdirectory-filter backend`.
4. Clone empty (or content-only) `Nick-tsoukas/faneqo.com`; add rewritten remotes; `git fetch`; merge `--allow-unrelated-histories` (FE then BE). If a content-only staging push already exists, replace or rebase carefully — prefer history merge as new `main` with documented backup tag of any content-only tip.
5. Commit current workspace root files on top — still without monorepo-driven app source edits.
6. Push `main` to `faneqo.com`. Leave `musicbizqr` / `qrserver` as active remotes until prod cutover; after cutover they become archives (policy in Task 1).
7. Point daily workspace at `faneqo.com`; nested `.git` dirs gone because trees live inside the monorepo.

**Alternatives:**

| Approach | Pros | Cons |
|----------|------|------|
| `git filter-repo` subdirectory rewrite | Clean paths; `git log -- frontend/` works | Rewrites SHAs; needs `git-filter-repo` |
| `git subtree add` without rewrite | Simpler; keeps original SHAs as subtree merges | Odd merge topology |
| Orphan squash / content-only forever | Fast | **Reject** as final state — destroys blame |

Subtree acceptable if filter-repo blocked; prefer filter-repo.

### C. Staging host → DigitalOcean droplet + docker-compose (recommended)

User lean: DO droplet + compose. Droplet runs the **same** root `docker-compose.yml` as local (Architecture G), with the `staging` profile — not a second compose file.

| Option | Ballpark monthly | Ops | Parity with prod | Verdict |
|--------|------------------|-----|------------------|---------|
| **DO droplet + compose** | ~$12–24 (2GB–4GB) + backups ~20% | You own SSL, updates, disk, DB dumps | Medium — Docker vs Railway builders | **Best cheap staging** |
| **Railway staging env** | Often ~$20–50+ | Low | **Highest** | Optional later before cutover |
| Fly / Render free/low | Low or sleep-prone | Medium | Medium | Weak for always-on Strapi+Postgres |

**Locked:** **DO droplet 2GB** — Postgres + backend + frontend via unified compose `staging` profile; cron off. No Railway staging for now. Production stays on current two-repo Railway until cutover. Optional Railway staging later for Railpack/Nixpacks parity (revisit Checkpoint B).

**DO sizing:** 1GB thrash under Nuxt SSR + Strapi + Postgres. Locked start **2GB/$12**; bump if OOM.

**Staging public URLs (locked Phase 2):** use the **droplet public IP** first — `http://DROPLET_IP` or `http://DROPLET_IP:port` as needed for FE/BE. Set `STAGING_API_PUBLIC` / `STAGING_WEB_PUBLIC` (and related `STAGING_*` URL overlays in `example.env`) to those HTTP IP URLs. That is enough for public reachability on cheapest DO staging.

Caveats (accept for v1):
- **HTTP only** until a real staging domain + TLS terminator exist.
- **Google OAuth / provider login** often require HTTPS + registered redirect URIs — expect Google login (and similar) to wait until domain + HTTPS + `STAGING_GOOGLE_REDIRECT_URI` (and console redirect URLs) are wired. Do **not** block Phase 2 dogfood on OAuth.
- **Cookies / `Secure` flags** may misbehave or force lax settings over plain HTTP; document whatever staging needs for email/password dogfood.
- IP may change if the droplet is rebuilt without a reserved IP — update env when that happens.

**Later (not Phase 2 now):** attach a staging hostname (not prod `faneqo.com`), terminate TLS, point DNS at the droplet, then re-set public URL env vars and wire Google (and other) redirect URIs. Tracked as deferred Task 6b in `tasks/todo.md`.

### G. Unified docker-compose — one file, service selection (locked intent 2026-11-08; profiles dropped 2026-11-08)

**Ponytail:** one root `docker-compose.yml`. Prefer service-name selection over Compose profiles / `docker-compose.staging.yml` / duplicate stacks. Root orchestration only — no monorepo-driven FE/BE product source edits.

**Implemented (Task 3.6 — 2026-11-08; wrapper removed Task 3.8; profiles removed 2026-11-08):**
- `docker-compose.yml` = `postgres` + `frontend` + `backend` (all eligible; no `profiles` key). Stock Node + volume mounts for FE/BE.
- Nested image tags (Compose ≥ 2.18): `node:${FRONTEND_NODE_VERSION:-${NODE_VERSION:-22.11.0}}` (same for `BACKEND_*`). No `scripts/docker-compose.sh`.
- `$development`: `docker compose up -d postgres` + host hot reload. `$staging`: host install/build then `docker compose up -d` (all services); follows container logs (not host `develop`/`dev`).

**Behavior:**

| Mode | How invoked | Compose | Apps |
|------|-------------|---------|------|
| **Dev** | `npm run dev` / stackrun `$development` | `docker compose up -d postgres` | FE + BE on host (hot reload) — unchanged |
| **Local staging** | `npm run staging` / stackrun `$staging` | `docker compose up -d` → Postgres + FE + BE containers | **Built** apps; containers mount build output as **volumes** (not image-bake-only) |
| **Droplet staging** | deploy / host `docker compose up -d` | **Same file** | Same volume-mounted built apps + DB; cron off |

**Chosen approach — service selection + stackrun hooks:**

1. **All services** eligible in one file (no Compose `profiles`).
2. **Dev** selects `postgres` by name: `docker compose up -d postgres`. Bare `docker compose up -d` starts all services (staging path).
3. **Runtime images** — **stock Node image(s)** tagged from the **same env vars** as local tooling (Architecture H). Chain: `FRONTEND_NODE_VERSION` / `BACKEND_NODE_VERSION` → `NODE_VERSION` → literal `22.11.0` via Compose nested defaults (Task 3.8; Compose ≥ 2.18). Dual versions allowed. Same image name OK twice when versions match. No custom `docker/Dockerfile.*` unless stock Node later proves insufficient. Per service: different `command`, ports, and **volume mounts** for built app output. **Build on host** (or deploy script): `frontend` / `backend` `npm run build`, then mount artifacts into containers, e.g. Nuxt `.output` (and any required node_modules/runtime bits) and Strapi build/dist as bind mounts. Honor “built apps mounted as volumes” for local + droplet parity: rebuild on host → remount/restart without baking a new app image every time.
4. **`stack.config.ts` (Task 3.6; wrapper drop Task 3.8):**
   - `$development` `before`/`after`: `docker compose up -d postgres` / `down postgres`.
   - `$staging` `before`: host `npm install` (FE+BE) + `npm run build`, then `docker compose up -d`.
   - `$staging` `commands`: compose `logs -f` only (no host `develop`/`dev`). Dev hot-reload stays `$development` only.
5. **Droplet:** rsync/git pull tree + env → same `docker compose up -d`. No second compose file.

**Acceptance criteria (Architecture G — verified in Tasks 3.5–3.6 / 4):**

- [x] One `docker-compose.yml` at root; no parallel staging-only compose file as the source of truth
- [x] `docker compose up -d postgres` starts **only** Postgres (dev path)
- [x] `docker compose up -d` starts Postgres + FE + BE (staging path)
- [x] Staging FE/BE image tags come from `FRONTEND_NODE_VERSION` / `BACKEND_NODE_VERSION` → `NODE_VERSION` → `22.11.0` (dual versions allowed; nested Compose defaults)
- [x] Staging FE/BE containers mount **built** app dirs as volumes
- [x] `npm run dev` still host-runs FE/BE after db-only compose
- [x] Local `npm run staging` uses compose containers (not host develop as the server)
- [ ] Droplet deploy uses the same file + IP public URLs; **no mise** on droplet
- [x] No monorepo-driven product source edits under `frontend/` / `backend/` for this slice

**Locked (2026-11-08 — Task 3.5 / Checkpoint Compose design):** **No custom Dockerfiles unless needed.** Staging FE/BE services use stock Node image(s) (same image OK twice when versions match), different `command` / ports / volume mounts for built output. Image tags driven by env (Architecture H). Do **not** add root `docker/Dockerfile.frontend` / `docker/Dockerfile.backend` (or product-tree Dockerfiles) unless stock Node proves insufficient later. Unrelated `frontend/workers/studio-video/Dockerfile` stays out of scope.

### H. mise for local host Node pin (locked 2026-11-08)

**Scope:** **development host only.** Droplet staging and FE/BE containers do **not** require mise installed — they use Docker stock Node tags from the same env vars.

**Pattern (root):**

1. `example.env` (and copied `.env`) holds non-secret pins:
   - `NODE_VERSION` — shared default (e.g. `22.11.0`)
   - `FRONTEND_NODE_VERSION` / `BACKEND_NODE_VERSION` — optional; empty = fall back to `NODE_VERSION`
2. Root `mise.toml`:
   ```toml
   [env]
   _.file = ".env"

   [tools]
   node = "{{ env.NODE_VERSION }}"
   ```
3. README documents: mise + Node/npm + Docker + Compose for local; droplet needs Docker/Compose/env only.
4. Host `npm run dev` uses mise-pinned Node from root `NODE_VERSION`. **Compose** already honors `FRONTEND_*` / `BACKEND_*` image tags (Task 3.8). **Host path gap (observed 2026-11-08):** stackrun `$development` backend runs `npm install && npm run develop` under the shell’s single mise pin (`v22.11.0`), so Strapi `engines.node: ">=18.0.0 <=20.x.x"` warns `EBADENGINE` even when `.env` has `BACKEND_NODE_VERSION=20.x`. `$staging` `before` host `cd backend && npm install` / `npm run build` has the same host-pin problem; container runtime tags are already correct.

**Amendment H.1 — Host dual Node via `.env` + `mise exec` (Task 3.9, pending human approve):** Close the host gap **without** inventing a second plan and **without** reintroducing redundant `env:` wrappers in `stack.config.ts`. Prefer:

- Keep root `mise.toml` on `NODE_VERSION` (default / FE-friendly, e.g. `22.11.0`).
- Wrap **backend** host commands (dev `run` + staging `before` install/build) with `mise exec node@${BACKEND_NODE_VERSION:-${NODE_VERSION}} -- …` so stackrun’s existing `.env` passthrough selects the tool; empty `BACKEND_NODE_VERSION` falls back to `NODE_VERSION`.
- Optionally wrap frontend the same way with `FRONTEND_NODE_VERSION` for symmetry (empty → `NODE_VERSION`).
- Droplet / containers unchanged: still stock Node image tags only; **no mise on droplet**.
- Root tests must assert the host command strings (or equivalent) actually reference `BACKEND_NODE_VERSION` / `mise exec`, not only compose image tags.
- Default pin recommendation: `BACKEND_NODE_VERSION=20.20.2` (already in local `.env` / `example.env`; installed via mise) unless human picks another `20.x` within Strapi’s ceiling.

**Do not** require mise in droplet bootstrap, CI droplet agents, or staging container images.

### I. Root test coverage (fast shell; no app builds)

Own the tooling we own at workspace root. Prefer small bash (+ `node` JSON parse) checks over CI that runs full Nuxt/Strapi builds.

**In suite (Task 3.7):**

- `tests/stackrun/` — import root `stack.config.ts`, strip docker/tunnels, echo overlay env (already green).
- `tests/root/` — `package.json` scripts exist and point at expected commands/prefixes; `mise.toml` loads `.env` and pins `node = "{{ env.NODE_VERSION }}"`; `example.env` has `NODE_VERSION` (+ optional `FRONTEND_NODE_VERSION` / `BACKEND_NODE_VERSION`); `stack.config.ts` has `$development` / `$staging` and no accidental top-level `commands` array; `docker-compose.yml` has `postgres` + staging-profile FE/BE (nested stock Node tags, volume mounts); bare `docker compose` service selection (no wrapper); cheap presence of `README.md` / `AGENTS.md` / `example.env`.
- Root `npm test` runs **all** root checks (`test:stack` + `test:root`).

**Assumptions:**

1. “Full root coverage” = behavior of root orchestration files, not FE/BE product builds in CI (deps + time). Skip `npm run build` of apps unless a later cheap smoke exists.
2. TDD for new checks: write assertion that would fail if the contract broke; green against current correct files.
3. Extend `npm test` to the whole root suite; keep stackrun import-root approach.

**Skipped (on purpose):** live `stackrun` with real FE/BE processes; full app builds inside the suite; droplet/CI workflow (Task 12). Staging Compose profile service asserts landed with Task 3.6.

### D. CI / deploy isolation (path filters — after monorepo exists)

Path filters stay relevant **after** history merge. Until then, product CI stays on `musicbizqr` / `qrserver` as today.

**GitHub Actions (monorepo, Phase 5):**

- Port FE/BE `ci.yml` with `paths:` filters and package working directories.
- Thin root workflow for compose / stackrun / `tests/stackrun/**` / `tests/root/**` (suite itself lands early in Task 3.7; Actions wiring stays Phase 5).

**Railway (cutover):** service roots `frontend`, `backend`, `frontend/jobs/mbq-cron` + watch paths.

**DO staging deploys:** branch `staging` (or content deploy from root); v1 whole-stack rebuild OK; path-aware later if rebuild time hurts.

### E. Monorepo-driven product edits wait until last step

Allowed early: root orchestration, docs, staging compose overlays at root, optional local temp git layout, DO host work. Product remotes keep normal development.

Forbidden until approval: monorepo PRs that change app sources under `frontend/` / `backend/` (e.g. Postgres-when-`DATABASE_URL`), and any force-push / remote rewrite of product repos. Day-to-day commits on `musicbizqr` / `qrserver` stay allowed.

### F. Audit after monorepo is daily workspace

Audit remediation plan: `tasks/audit-issues-plan.md`. Start product fixes only after Task 17 approval (or earlier explicit go).

## Phases

### Phase 0 — Decisions (human)

**Locked 2026-11-08** (full table in `tasks/todo.md` Decisions log):

| Fork | Choice |
|------|--------|
| Temp nested-`.git` removal | **YES** — local only; re-clone before history merge |
| History tool | **LATER** — defer filter-repo vs subtree until history phase |
| Staging host | **DO only** for now (no Railway staging yet) |
| Droplet size | **2GB** |
| Branch model | Keep `main` empty for now; all work on `staging`; `staging` deploys to droplet |
| Content-only `faneqo.com` during staging | **YES** — push full `staging` branch content without product commit history (throwaway history OK). Staging runs without history; history merge later |
| Staging public URLs | **Droplet IP** for `STAGING_API_PUBLIC` / `STAGING_WEB_PUBLIC` (HTTP) until a staging domain exists; domain + TLS + Google redirect wiring later (Task 6b) |
| Unified compose | **YES** — one `docker-compose.yml`; profiles (`staging` for FE/BE containers); dev = DB only + host apps; local + droplet staging = DB + volume-mounted built apps (Architecture G). Implement before droplet (Tasks 3.5–3.6). |
| Staging runtime images | **Stock Node** — tags from `NODE_VERSION` / `FRONTEND_NODE_VERSION` / `BACKEND_NODE_VERSION`; dual FE/BE versions allowed; no custom `docker/Dockerfile.*` unless stock Node proves insufficient (Task 3.5 locked) |
| Local Node tooling | **mise** on host only (`mise.toml` + `NODE_VERSION`); not required on droplet / staging containers (Architecture H / Task 3.4) |
| Audit track | **`tasks/audit-issues-*.md`** — plan / todo / specs; remediation waits on Task 17 / explicit go (Decision 11) |

Still open: old-repo archival after cutover?; Railway staging smoke before cutover (revisit at Checkpoint B).

### Phase 1 — Root workspace + optional temp single tree (no remote surgery)

Confirm root orchestration; optionally init root git and remove nested `.git` **locally only** for one deployable tree. Product remotes unchanged and still developed normally.

### Checkpoint A — Temp layout (if used) safe

- [ ] Product remotes still point at `musicbizqr` / `qrserver` and were not force-pushed
- [ ] Tip SHAs recorded before any local `.git` removal
- [ ] Human OK to proceed to staging (or confirmed skip of temp path)

### Phase 2 prep — mise pins + unified compose + root tests (local first)

Architecture H (mise + env Node pins) landed in Task 3.4. Architecture G **implemented** locally in Task 3.6; wrapper removed in Task 3.8 (nested Compose Node defaults, dual FE/BE versions allowed, no custom Dockerfiles). Prove: db-only for `npm run dev`; staging `docker compose up -d` mounts built FE/BE for `npm run staging`. **Do not** invent a second compose file. **Do not** install mise on the droplet.

**Task 3.9 (additive — host dual Node):** Compose tags already respect `BACKEND_NODE_VERSION`; host `$development` / staging host builds do not. Close Architecture H.1 before relying on local Strapi develop (and before droplet dogfood if host builds feed volume mounts). See Amendment H.1 above.

**Root test coverage (Task 3.7, Architecture I)** landed; Task 3.6 extended suite with staging-profile asserts. Extend suite in Task 3.9 for host `mise exec` / `BACKEND_NODE_VERSION`. Checkpoint before droplet.

### Checkpoint Compose — Design OK / local staging works

- [x] Human OK on stock-Node approach (no custom Dockerfiles unless needed) — 2026-11-08
- [x] Task 3.9: host dual Node (`mise exec` + `BACKEND_NODE_VERSION`) — no Strapi `EBADENGINE` on `npm run dev`
- [x] Local: `docker compose up -d postgres` = Postgres only (dev path; no Compose profiles)
- [x] Local: `docker compose up -d` = Postgres + FE + BE with volume-mounted builds (staging path)
- [x] `npm run dev` still hot-reloads on host (FE on 22 OK; BE on ≤20 when pinned)
- [x] No product-source monorepo edits for this slice (root orchestration only)

### Phase 2 — Cheap staging on DO (EARLY)

Provision droplet; deploy with **same** root `docker-compose.yml` + `docker compose up -d`; staging env (test Stripe, non-sending mail); data strategy; deploy path. **Public URLs = droplet IP over HTTP** (`STAGING_API_PUBLIC` / `STAGING_WEB_PUBLIC`). Defer staging domain, TLS terminator, and Google OAuth redirect wiring (Task 6b). **No history merge required.**

### Checkpoint B — Staging dogfood

- [ ] Staging reachable via droplet IP: FE + staging BE + staging Postgres (same compose file as local)
- [ ] `STAGING_API_PUBLIC` / `STAGING_WEB_PUBLIC` set to those HTTP IP URLs (or ports as needed)
- [ ] No prod domains / live mail / live Stripe / `chalk-volume`
- [ ] Human dogfoods (OAuth/Google login may still be off until Task 6b); prod Railway still on product remotes
- [ ] Still no monorepo history rewrite

### Phase 3 — Restore pristine FE/BE checkouts

If temp `.git` removal was used: remove temp root-git layout as needed; re-clone current `musicbizqr` / `qrserver` into `frontend/` / `backend/`. If temp path skipped: no-op aside from confirming nested remotes healthy.

### Checkpoint C — Pristine trees ready for merge

- [ ] `frontend/.git` and `backend/.git` are full clones of product remotes
- [ ] Tips match (or intentionally track) current remote `main`
- [ ] Ready for filter-repo from **fresh scratch clones** (do not mutate daily checkouts in place if avoidable)

### Phase 4 — History merge into `faneqo.com` (LATE)

Freeze merge SHAs (current product tips); filter-repo (or subtree) in scratch; merge into `faneqo.com`; add root workspace files; push. Do not force-push product remotes.

### Checkpoint D — Monorepo has real history

- [ ] `faneqo.com` has `frontend/`, `backend/`, root stack files
- [ ] `git log` / blame work under prefixes
- [ ] Prod still deploys from `musicbizqr` / `qrserver`
- [ ] Human reviews layout before CI/workspace cutover

### Phase 5 — Path-aware CI on the monorepo

Port FE/BE workflows with path filters; wire root GitHub Actions to existing `npm test` (`tests/stackrun/` + `tests/root/` from Task 3.7).

### Checkpoint E — CI isolation

- [ ] FE-only / BE-only / root path behavior verified
- [ ] Human OK with required checks

### Phase 6 — Local workspace tracks monorepo

Point `/home/me/dev/faneqo` at `faneqo.com`; nested product `.git` dirs gone as monorepo dirs. Update `AGENTS.md`. Product remotes remain valid GitHub archives/sources until cutover policy says otherwise.

### Phase 7 — Approved monorepo product edits (LAST code step in trees)

Explicit approval → minimal diffs (e.g. Postgres when `DATABASE_URL`). Prefer tiny PRs on `faneqo.com`.

### Phase 8 — Production cutover (separate approval)

Retarget Railway prod services to monorepo subdirs + watch paths; leave `chalk-volume`; rollback = old remotes.

### Phase 9 — Audit

Begin remediation per `tasks/audit-issues-plan.md` once daily development is the single repo/dir (Task 17).

## Risks and mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Accidental prod Railway retarget | High | Never change prod source until Phase 8 approval |
| Temp `.git` removal treated as final merge | High | Re-clone before filter-repo; content-only ≠ history merge |
| Force-push / rewrite product remotes | High | Local-only temp path; scratch clones for filter-repo; never push rewritten SHAs to old remotes |
| Staging trees lag active product `main` | Med | Remotes stay source of truth; re-pull/re-clone before merge; redeploy staging when needed |
| FE change redeploys BE on monorepo | Med | Path filters + Railway watch paths (Phase 5 / 8) |
| DO staging ≠ Railway runtime | Med | Align `NODE_VERSION` / FE/BE overrides with prod builders; optional Railway staging smoke before cutover |
| Host mise pin vs dual FE/BE engines | Med | **Task 3.9:** host `mise exec node@${BACKEND_NODE_VERSION:-…}` (and optional FE); containers keep separate image tags; no redundant stackrun `env:` wrappers |
| Live Resend/Stripe on staging | High | Non-sending / test keys; cron off |
| HTTP IP staging breaks Google OAuth / Secure cookies | Med | Accept for Phase 2; Task 6b when domain + HTTPS exist |
| Droplet IP changes on rebuild | Low | Reserved IP optional; else update `STAGING_*_PUBLIC` after recreate |
| Duplicate compose files / drift local vs droplet | Med | One file, no profiles (Architecture G); droplet uses `docker compose up -d` |
| Staging volume mounts miss runtime deps (node_modules, Nuxt `.output`) | Med | Document exact mount paths in Task 3.6; verify local staging before droplet |
| Accidental full compose in `npm run dev` | Med | `$development` before uses `up -d postgres` only; staging uses bare `up -d` |
| Root suite drifts from compose/stack reality | Low | Task 3.7 shape checks; extend after Task 3.6 for staging profile |

## Open questions (need human forks)

**Answered 2026-11-08** (see Phase 0 + `tasks/todo.md` Decisions log):

1. ~~**Temp path**~~ → **YES**, local nested-`.git` removal; re-clone before history merge.
2. ~~**History tool**~~ → **Deferred** until history phase (filter-repo vs subtree).
3. ~~**Staging**~~ → **DO only** for now (no Railway staging yet).
4. ~~**Droplet size**~~ → **2GB**.
5. ~~**Branch model**~~ → `main` stays empty for now; all work on `staging`; `staging` deploys to droplet.
6. ~~**Content-only `faneqo.com` during staging**~~ → **YES** — full `staging` branch content push without product commit history; history merge later (does not block staging).
7. ~~**Staging public URLs**~~ → **Droplet IP** (HTTP) for `STAGING_API_PUBLIC` / `STAGING_WEB_PUBLIC` until a staging domain exists; domain + TLS + Google redirects = Task 6b later.
8. ~~**Unified compose**~~ → **YES** — one `docker-compose.yml`, Compose profiles, built apps volume-mounted for staging (local + droplet); dev stays DB-only + host apps (Architecture G).
9. ~~**Staging runtime images**~~ → **Stock Node** (same image OK for FE + BE when versions match); tags from env; dual FE/BE versions allowed; **no custom Dockerfiles unless needed**.
10. ~~**Local Node pin**~~ → **mise** on development host only; `NODE_VERSION` (+ optional `FRONTEND_NODE_VERSION` / `BACKEND_NODE_VERSION`); droplet/containers use Docker tags from those vars — **no mise on droplet**.

**Still open:**

11. ~~**Audit track**~~ → Plan/todo/specs under `tasks/audit-issues-*.md` (2026-11-08). Remediation still waits on Task 17 / explicit go.
12. **Old repos after cutover:** archive on GitHub, or leave writable for emergency?
13. **Railway staging smoke before cutover?** Revisit at Checkpoint B.

## Out of scope (this plan)

- Pausing or “freezing” product development on `musicbizqr` / `qrserver`
- Railpack flip on prod unless cutover needs it
- Duplicate staging-only compose files / image-bake-only staging that skips volume mounts (Architecture G forbids)
- Custom staging Dockerfiles unless stock Node later proves insufficient
- Product features / audit remediation content (Phase 9+)
- Merging the two Railway *projects* into one (unnecessary)
- ~~Implementing Architecture G compose services~~ → done Task 3.6 (local); droplet still Task 4
- Requiring mise on the staging droplet or inside staging containers

## Task list index

See `tasks/todo.md` for checkable tasks, acceptance criteria, and verification. Order matches phases above.
