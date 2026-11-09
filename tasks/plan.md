# Implementation Plan: Single-repo `Nick-tsoukas/faneqo.com` + cheap staging

## Overview

Stand up cheap staging (DO droplet + compose) from the workspace root **before** any history rewrite. Optional local-only temp path: drop nested `frontend/.git` / `backend/.git` so the workspace is one deployable tree for staging — never push that surgery to `musicbizqr` / `qrserver`. After staging works, restore pristine product checkouts, then merge commit history into empty `Nick-tsoukas/faneqo.com`. Only after that (and approval): product-tree monorepo edits, Railway prod cutover, and audit remediation per `tasks/audit-issues-plan.md`.

**Product remotes stay the source of truth.** `musicbizqr` and `qrserver` keep receiving normal development on GitHub. This plan does **not** pause FE/BE work. It only delays monorepo history merge, nested-`.git` surgery that affects remotes, and Railway prod retarget until staging is live.

This file + `tasks/todo.md` are the **canonical** migration docs. Root `AGENTS.md` is the always-loaded entrypoint. Older Cursor drafts under `.cursor/plans/` are historical only.

This plan is **read-only for product code in the monorepo sense**. No monorepo-driven edits under `frontend/` or `backend/` until the final approved step. Day-to-day product commits continue on the existing remotes as usual. Root workspace files (`docker-compose.yml`, `stack.config.ts`, `example.env`, root `package.json`) already exist and may be used for staging without changing app code.

## Where we are (2026-11-09)

**Staging is done.** Checkpoint B passed. DO droplet runs FE+BE+Postgres; Actions SSH deploy + selective rebuild work; root `npm test` already runs locally (Task 3.7). Product remotes stay source of truth. History merge held until human go.

**Real remaining migration work is two steps:**

1. **History merge** (Tasks 7–10) — re-clone pristine FE/BE, filter-repo/subtree into `faneqo.com`, land root files on `main`.
2. **Prod cutover** (Task 16) — point Railway at the monorepo. Separate explicit approval.

**Everything between those two is small post-merge chores, not more “phases of migration”:**

| Tasks | What it actually is | What it is *not* |
|-------|---------------------|------------------|
| 11–12 | Port existing FE/BE `ci.yml` + wire root `npm test` as GitHub Actions on the monorepo (path filters so FE≠BE≠docs). | Inventing a new test system. Local root tests already work; product CI already works on each remote. |
| 13 | Point daily `/home/me/dev/faneqo` at `faneqo.com`. | A product feature. |
| 14–15 | Optional monorepo product diffs **only if** cutover needs them (explicit go). | Required by default. |
| 6b | Staging hostname + HTTPS (`staging.faneqo.com`) — Architecture C.1; ready after forks. | History merge or prod cutover. |
| 17 | Separate audit track. | Part of history/prod migration. |

Plain English: **history, then prod.** CI/workspace chores ride along after history because GitHub only runs workflows from repo-root `.github/workflows/` — nested `frontend/.github` / `backend/.github` stop mattering once trees live in one repo.

## Current state (verified)

| Fact | Evidence |
|------|----------|
| Content-only `faneqo.com` `staging` live; Checkpoint B done | Droplet `159.203.131.189`; Actions deploy + selective rebuild; Strapi admin created |
| `frontend/` / `backend/` trees | Content from product remotes; nested `.git` removed locally (tips recorded); product remotes still SoT |
| Target `Nick-tsoukas/faneqo.com` | Has content-only `staging` (throwaway history). Real history merge still TODO (Tasks 7–10). `main` still empty |
| Local stack | Dev = host + SQLite (no Docker). Staging = same `docker-compose.yml` `up -d` (local attached or droplet) |
| Root `npm test` | Works locally (Task 3.7) + Actions `.github/workflows/root-ci.yml` (Task 12 done early 2026-11-09). Not full FE/BE builds |
| Product CI today | Still on `musicbizqr` / `qrserver` remotes (`frontend/.github/workflows/ci.yml`, `backend/.github/workflows/ci.yml`). **Task 11** = port those to monorepo root workflows with path filters after history |
| Staging deploy CI | Already on `faneqo.com`: `.github/workflows/deploy-staging.yml` |
| Prod Railway | Still two projects on product remotes until Task 16 |
| Audit track | Not started (`tasks/audit-issues-*.md`) |

No root `SPEC.md` / `STACK.md` / `PLAN.md` (on purpose: `AGENTS.md` + `tasks/` + short `README.md` are enough). Product loops stay in `frontend/AGENTS.md` and `backend/AGENTS.md` — do not deep-scan those trees unless a task needs product code.

## Hard constraints

1. **Do not do monorepo/git surgery on product remotes** until staging works and history-merge phase starts. Normal product development on `musicbizqr` / `qrserver` continues.
2. **Do not edit `frontend/` or `backend/` for monorepo/staging product fixes** until the last approved code step (day-to-day product work on those remotes is separate and allowed).
3. **Do not retarget production Railway** services to the monorepo until staging is validated and cutover is approved.
4. **Temp nested-`.git` removal (if used) is local-only.** Never force-push rewritten or stripped history to `musicbizqr` / `qrserver`. Re-clone pristine checkouts before the real history merge.
5. Staging must not use live Stripe / live Resend / production domains / `chalk-volume`.
6. One git merge does **not** merge the two Railway projects; cutover is a separate ops step.

## Preferred sequence

```
DONE  1–3  Root orchestration + temp single tree + unified compose + DO staging
NEXT  4    Re-clone pristine FE/BE → history merge into faneqo.com (Tasks 7–10)
THEN  5    Tiny post-merge chores: port CI workflows + point daily workspace (11–13)
THEN  6    Prod cutover (16); optional product edits (14–15) only if needed
LATER      Optional 6b (staging domain); audit (17) = separate track
```

## Dependency graph (remaining)

```
[DONE] Staging dogfood (Checkpoint B) — prod still on musicbizqr / qrserver
        │
        ├── History merge (7–10)  ← HOLD until human go
        │       │
        │               └── Post-merge chores (small):
        │             • Port FE/BE CI Actions (11) — root npm test Actions already done (12)
        │             • Daily workspace → faneqo.com (13)
        │
        ├── [CHECKPOINT: monorepo has real history; prod still on old remotes]
        │
        ├── Optional product edits (14–15) — only if cutover needs them
        │
        ├── Prod cutover (16) — separate approval
        │
        └── Audit (17) — separate track, not migration blocker
```

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

**Locked:** **DO droplet 2GB** — Postgres + backend + frontend via unified compose; cron off. **Staging never on Railway** (Checkpoint B 2026-11-09). Production stays on current two-repo Railway until **prod cutover** (Phase 8). Do not discuss Railway again until that cutover.

**DO sizing:** 1GB thrash under Nuxt SSR + Strapi + Postgres. Locked start **2GB/$12**; bump if OOM.

**Staging public URLs (locked Phase 2):** use the **droplet public IP** first — `http://DROPLET_IP` or `http://DROPLET_IP:port` as needed for FE/BE. Set `STAGING_API_PUBLIC` / `STAGING_WEB_PUBLIC` (and related `STAGING_*` URL overlays in `example.env`) to those HTTP IP URLs. That is enough for public reachability on cheapest DO staging.

Caveats (accept for v1):
- **HTTP only** until a real staging domain + TLS terminator exist.
- **Google OAuth / provider login** often require HTTPS + registered redirect URIs — expect Google login (and similar) to wait until domain + HTTPS + `STAGING_GOOGLE_REDIRECT_URI` (and console redirect URLs) are wired. Do **not** block Phase 2 dogfood on OAuth.
- **Cookies / `Secure` flags** may misbehave or force lax settings over plain HTTP; document whatever staging needs for email/password dogfood.
- IP may change if the droplet is rebuilt without a reserved IP — update env when that happens.

**Later → now (Task 6b, planned 2026-11-09):** attach `staging.faneqo.com` (+ API hostname), terminate TLS via Cloudflare + origin reverse proxy, re-set public URL env vars, then Google OAuth redirects. Detail: Architecture **C.1** below and Tasks 6b.1–6b.5 in `tasks/todo.md`.

### C.1 Staging hostname + HTTPS (Task 6b) — plan 2026-11-09

**Goal:** Browser reaches staging over HTTPS hostnames, not `http://DROPLET_IP:port`. Cloudflare owns DNS + edge TLS. Droplet still runs the same compose FE/BE; a reverse proxy speaks 80/443.

**Why a proxy:** Cloudflare orange-cloud proxy only forwards **80/443** to origin. Publishing `:3000` / `:1337` alone cannot get a normal HTTPS hostname.

#### Recommended design (needs human OK on forks below)

| Piece | Choice |
|-------|--------|
| FE hostname | `https://staging.faneqo.com` |
| API hostname | `https://staging-api.faneqo.com` (not `api.staging` — Universal SSL is one label deep) |
| DNS | Cloudflare A → droplet `159.203.131.189`, **proxied** (orange cloud) |
| Edge TLS | Cloudflare Universal SSL; start **Flexible**, later **Full (strict)** + Origin CA |
| Origin proxy | **Host nginx on droplet** (files in gitignored `.do/`) — not compose, not committed. `:80` → `127.0.0.1:3000` / `:1337` by `Host` |
| Droplet firewall | Open **22, 80, 443**; after cutover prefer closing public **3000/1337** (or lock to admin IPs) |
| App env (droplet `.env` only) | Web overlays → `https://staging.faneqo.com`; API overlays → `https://staging-api.faneqo.com`; recreate FE/BE after edit |
| Google OAuth | After HTTPS works: set `STAGING_GOOGLE_REDIRECT_URI` + Google Cloud console redirect URIs (Task 6b.5) |

**Product-tree exception (explicit go required):** `backend/config/middlewares.js` CORS `origin` list is hardcoded and does **not** include staging hostnames. Browser FE → API will fail CORS until that allowlist adds `https://staging.faneqo.com` (and any other staging web origin). Same for Strapi `url` / proxy settings if admin absolute links break. Scope = minimal staging-host allowlist only — not a general Task 15 dump.

#### Alternatives (reject unless human prefers)

| Alt | Pros | Cons |
|-----|------|------|
| Cloudflare Tunnel (`cloudflared`) | No open 80/443; CF still terminates HTTPS | Extra daemon/token; different ops than compose ports |
| Grey-cloud + Let’s Encrypt on Caddy | “Real” origin LE certs | Droplet IP exposed; LE HTTP-01 needs 80 open; no CF WAF |
| CF Flexible (HTTPS to CF, HTTP to origin) | Fastest | Not Full strict; weaker origin story — avoid |
| Single hostname path-proxy (`/api` → Strapi) | One DNS name | Messy Strapi admin/absolute URLs; avoid |

#### Human forks (approve before build)

1. **API hostname:** `api.staging.faneqo.com` (recommended) vs something else?
2. **Proxy:** Caddy-in-compose (recommended) vs host nginx/Caddy vs Cloudflare Tunnel?
3. **CF SSL mode:** Full (strict) + Origin CA (recommended) vs Full / Flexible?
4. **CORS edit:** approve minimal `backend/config/middlewares.js` staging origin now?
5. **Google OAuth in same pass** (6b.5) or HTTPS-only first?

#### Out of scope for 6b

- Prod `faneqo.com` DNS/TLS changes
- History merge / Railway prod cutover
- Live Stripe / live Resend / `chalk-volume`
- Reserved droplet IP (nice-to-have if IP changes later)

### G. Unified docker-compose — staging-only compose (amended 2026-11-08)

**Ponytail:** one root `docker-compose.yml` for **staging** (local + droplet). No Compose profiles / duplicate stacks. Root orchestration only — no monorepo-driven FE/BE product source edits.

**Dev DB (amended 2026-11-08):** Product `backend/config/database.js` uses **SQLite** when `NODE_ENV=development` and Postgres otherwise. Therefore `$development` must **not** start compose. Host develop → Postgres is deferred (maybe later / Task 15-era). Compose Postgres uses a single DB `faneqo_staging` via `POSTGRES_DB` (no `docker/postgres-init.sql`).

**Implemented (Task 3.6 — 2026-11-08; wrapper removed Task 3.8; profiles removed 2026-11-08; dev compose dropped 2026-11-08; droplet build path Task 4):**
- `docker-compose.yml` = `postgres` + `frontend` + `backend` (all eligible; no `profiles` key). Stock Node + volume mounts for FE/BE. `restart: unless-stopped` on all services (droplet reboots; local attached Ctrl+C still stops). Used by staging only.
- Nested image tags (Compose ≥ 2.18): `node:${FRONTEND_NODE_VERSION:-${NODE_VERSION:-22.11.0}}` (same for `BACKEND_*`). No `scripts/docker-compose.sh`.
- `$development`: host hot reload only (no Docker; Strapi SQLite). `$staging` (local): host mise install/build, then attached `docker compose up <service> --no-log-prefix` (not host `develop`/`dev`).
- **Droplet:** no stackrun, no mise. `scripts/staging-build.sh` = one-off `docker run --rm` with the same Node tags → `npm install && npm run build` on bind mounts; then `docker compose up -d` (`scripts/staging-up.sh`).

**Behavior:**

| Mode | How invoked | Compose | Apps / DB |
|------|-------------|---------|-----------|
| **Dev** | `npm run dev` / stackrun `$development` | **None** | FE + BE on host (hot reload); Strapi **SQLite** |
| **Local staging** | `npm run staging` / stackrun `$staging` | attached `up <service> --no-log-prefix` | **Built** on host (mise); volumes; Postgres `faneqo_staging` |
| **Droplet staging** | `scripts/staging-up.sh` | `docker compose up -d` | **Built** via one-off Node containers; same volumes + DB; cron off |

**Chosen approach — staging compose + local stackrun / droplet scripts:**

1. **All services** eligible in one file (no Compose `profiles`). Compose is **not** used by `npm run dev`.
2. **Local staging** attaches per-service `docker compose up` (stackrun panes). **Droplet** uses detached `docker compose up -d`.
3. **Runtime images** — **stock Node image(s)** tagged from the **same env vars** as local tooling (Architecture H). Chain: `FRONTEND_NODE_VERSION` / `BACKEND_NODE_VERSION` → `NODE_VERSION` → literal `22.11.0` via Compose nested defaults (Task 3.8; Compose ≥ 2.18). Dual versions allowed. Same image name OK twice when versions match. No custom `docker/Dockerfile.*` unless stock Node later proves insufficient. Per service: different `command`, ports, and **volume mounts** for built app output. **Build:** local = host mise; droplet = one-off stock Node `docker run --rm` (`scripts/staging-build.sh`) — not a compose service, not mise. Rebuild → remount/restart without baking a new app image every time.
4. **`stack.config.ts` (local only):**
   - `$development`: host `mise exec` + `develop`/`dev` only — **no** compose `before`/`after`.
   - `$staging` `before`: host `npm install` (FE+BE) + `npm run build`.
   - `$staging` `commands`: attached `docker compose up <service> --no-log-prefix` for postgres/backend/frontend.
5. **Droplet:** clone/pull tree + `.env` → `bash scripts/staging-up.sh`. No second compose file. No stackrun. No mise.

**Acceptance criteria (Architecture G — verified in Tasks 3.5–3.6 / 4; dev-DB amend 2026-11-08):**

- [x] One `docker-compose.yml` at root; no parallel staging-only compose file as the source of truth
- [x] `npm run dev` does **not** start Docker / compose (SQLite on host)
- [x] `docker compose up -d` starts Postgres + FE + BE (staging path)
- [x] Staging FE/BE image tags come from `FRONTEND_NODE_VERSION` / `BACKEND_NODE_VERSION` → `NODE_VERSION` → `22.11.0` (dual versions allowed; nested Compose defaults)
- [x] Staging FE/BE containers mount **built** app dirs as volumes
- [x] `npm run dev` host-runs FE/BE with mise (no compose prerequisite)
- [x] Local `npm run staging` uses compose containers (not host develop as the server)
- [x] Droplet deploy uses the same file + IP public URLs; **no mise** / no stackrun on droplet (`scripts/staging-up.sh`) — live 2026-11-09 (`faneqo-staging` / `159.203.131.189`)
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

**Skipped (on purpose):** live `stackrun` with real FE/BE processes; full app builds inside the suite. Root Actions wiring = Task 12 (done). Staging Compose asserts landed with Task 3.6.

### D. CI after history merge (small chore — not new tests)

**Already done today:**
- Local root suite: `npm test` (Task 3.7) — run before push as usual.
- Product CI: still on `musicbizqr` / `qrserver` via each repo’s `ci.yml`.
- Staging deploy Actions: `.github/workflows/deploy-staging.yml` + selective droplet rebuild (Task 5.1).

**Root Actions (Task 12 — done early):** `.github/workflows/root-ci.yml` runs `npm test` on stack/compose/`tests/**` (etc.) path changes. No FE/BE builds.

**Still needed after history merge (Task 11):** GitHub only runs workflows from the **repo-root** `.github/workflows/`. Once FE/BE histories live under `faneqo.com`, copy/adapt those existing product `ci.yml` files to root with `paths:` filters. This does **not** invent new test suites.

**Railway (cutover Task 16):** service roots `frontend`, `backend`, `frontend/jobs/mbq-cron` + watch paths.

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
| Staging host | **DO only** — never Railway staging (Checkpoint B) |
| Droplet size | **2GB** |
| Branch model | Keep `main` empty for now; all work on `staging`; `staging` deploys to droplet |
| Content-only `faneqo.com` during staging | **YES** — push full `staging` branch content without product commit history (throwaway history OK). Staging runs without history; history merge later |
| Staging public URLs | **Droplet IP** for `STAGING_API_PUBLIC` / `STAGING_WEB_PUBLIC` (HTTP) until a staging domain exists; domain + TLS + Google redirect wiring later (Task 6b) |
| Unified compose | **YES** — one `docker-compose.yml`; profiles (`staging` for FE/BE containers); dev = DB only + host apps; local + droplet staging = DB + volume-mounted built apps (Architecture G). Implement before droplet (Tasks 3.5–3.6). |
| Staging runtime images | **Stock Node** — tags from `NODE_VERSION` / `FRONTEND_NODE_VERSION` / `BACKEND_NODE_VERSION`; dual FE/BE versions allowed; no custom `docker/Dockerfile.*` unless stock Node proves insufficient (Task 3.5 locked) |
| Local Node tooling | **mise** on host only (`mise.toml` + `NODE_VERSION`); not required on droplet / staging containers (Architecture H / Task 3.4) |
| Audit track | **`tasks/audit-issues-*.md`** — plan / todo / specs; remediation waits on Task 17 / explicit go (Decision 11) |

Still open: old-repo archival after cutover?

### Phase 1 — Root workspace + optional temp single tree (no remote surgery)

Confirm root orchestration; optionally init root git and remove nested `.git` **locally only** for one deployable tree. Product remotes unchanged and still developed normally.

### Checkpoint A — Temp layout (if used) safe

- [ ] Product remotes still point at `musicbizqr` / `qrserver` and were not force-pushed
- [ ] Tip SHAs recorded before any local `.git` removal
- [ ] Human OK to proceed to staging (or confirmed skip of temp path)

### Phase 2 prep — mise pins + unified compose + root tests (local first)

Architecture H (mise + env Node pins) landed in Task 3.4. Architecture G **implemented** locally in Task 3.6; wrapper removed in Task 3.8; **dev compose dropped 2026-11-08** (SQLite host develop; compose = staging only). Prove: `npm run dev` needs no Docker; staging `docker compose up -d` mounts built FE/BE for `npm run staging`. **Do not** invent a second compose file. **Do not** install mise on the droplet.

**Task 3.9 (additive — host dual Node):** Compose tags already respect `BACKEND_NODE_VERSION`; host `$development` / staging host builds do not. Close Architecture H.1 before relying on local Strapi develop (and before droplet dogfood if host builds feed volume mounts). See Amendment H.1 above.

**Root test coverage (Task 3.7, Architecture I)** landed; Task 3.6 extended suite with staging-profile asserts. Extend suite in Task 3.9 for host `mise exec` / `BACKEND_NODE_VERSION`. Checkpoint before droplet.

### Checkpoint Compose — Design OK / local staging works

- [x] Human OK on stock-Node approach (no custom Dockerfiles unless needed) — 2026-11-08
- [x] Task 3.9: host dual Node (`mise exec` + `BACKEND_NODE_VERSION`) — no Strapi `EBADENGINE` on `npm run dev`
- [x] Local: `npm run dev` = host + SQLite, no Docker (Architecture G amend 2026-11-08)
- [x] Local: `docker compose up -d` = Postgres + FE + BE with volume-mounted builds (staging path)
- [x] `npm run dev` still hot-reloads on host (FE on 22 OK; BE on ≤20 when pinned)
- [x] No product-source monorepo edits for this slice (root orchestration only)

### Phase 2 — Cheap staging on DO (EARLY)

Provision droplet; deploy with **same** root `docker-compose.yml` + `docker compose up -d`; staging env (test Stripe, non-sending mail); data strategy; deploy path. **Public URLs = droplet IP over HTTP** (`STAGING_API_PUBLIC` / `STAGING_WEB_PUBLIC`). Defer staging domain, TLS terminator, and Google OAuth redirect wiring (Task 6b). **No history merge required.**

**Task 5.1 (selective rebuild):** Actions stays a thin SSH trigger. Wall clock is droplet `npm install` + Nuxt/Strapi build. Diff previous HEAD → deploy SHA: rebuild only FE and/or BE when those trees change; shared stack files (`scripts/staging-*.sh`, `docker-compose.yml`, deploy workflow) rebuild both; docs/`tasks/`-only syncs git and skips builds. Always pull; conditionally build.

### Checkpoint B — Staging dogfood

- [x] Staging reachable via droplet IP: FE + staging BE + staging Postgres (same compose file as local)
- [x] `STAGING_API_PUBLIC` / `STAGING_WEB_PUBLIC` set to those HTTP IP URLs (or ports as needed)
- [x] No prod domains / live mail / live Stripe / `chalk-volume`
- [x] Human dogfoods — Strapi admin created (2026-11-09); OAuth may wait for Task 6b
- [x] Railway staging = **never**; history merge **held** until human go; final order = history merge → prod switch to monorepo

### Phase 3–4 — History merge (NEXT real work; HOLD until human go)

**Task 7:** re-clone pristine `musicbizqr` / `qrserver` (temp nested-`.git` was removed). **Tasks 8–10:** freeze SHAs, filter-repo/subtree in scratch, merge into `faneqo.com`, land root files, push `main`. Do not force-push product remotes.

Checkpoint C = pristine trees ready. Checkpoint D = monorepo has real history; prod still on old remotes.

### Phase 5–6 — Post-merge chores (small; after history)

**Not a second migration.** Task 12 (root `npm test` Actions) already landed early. Task 11 ports FE/BE product CI to monorepo root Actions with path filters; Task 13 points daily workspace at `faneqo.com`.

### Phase 7 — Optional monorepo product edits

Tasks 14–15 only if cutover needs product-tree diffs. Explicit go required. Skip if nothing needed.

### Phase 8 — Production cutover (separate approval)

Task 16: retarget Railway prod to monorepo subdirs + watch paths; leave `chalk-volume`; rollback = old remotes.

### Phase 9 — Audit (separate track)

Task 17 / `tasks/audit-issues-plan.md`. Not a history/prod blocker.

## Risks and mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Accidental prod Railway retarget | High | Never change prod source until Phase 8 approval |
| Temp `.git` removal treated as final merge | High | Re-clone before filter-repo; content-only ≠ history merge |
| Force-push / rewrite product remotes | High | Local-only temp path; scratch clones for filter-repo; never push rewritten SHAs to old remotes |
| Staging trees lag active product `main` | Med | Remotes stay source of truth; re-pull/re-clone before merge; redeploy staging when needed |
| FE change redeploys BE on monorepo | Med | Post-merge CI path filters (11–12) + Railway watch paths at cutover (16) |
| DO staging ≠ Railway runtime | Med | Align `NODE_VERSION` / FE/BE pins with prod builders at **prod cutover** only (no Railway staging) |
| Host mise pin vs dual FE/BE engines | Med | **Task 3.9:** host `mise exec node@${BACKEND_NODE_VERSION:-…}` (and optional FE); containers keep separate image tags; no redundant stackrun `env:` wrappers |
| Live Resend/Stripe on staging | High | Non-sending / test keys; cron off |
| HTTP IP staging breaks Google OAuth / Secure cookies | Med | Accept for Phase 2; Task 6b when domain + HTTPS exist |
| Droplet IP changes on rebuild | Low | Reserved IP optional; else update `STAGING_*_PUBLIC` after recreate |
| Duplicate compose files / drift local vs droplet | Med | One file, no profiles (Architecture G); droplet uses `docker compose up -d` |
| Staging volume mounts miss runtime deps (node_modules, Nuxt `.output`) | Med | Document exact mount paths in Task 3.6; verify local staging before droplet |
| Accidental compose in `npm run dev` | Med | `$development` has no compose hooks; staging uses bare `up -d`; tests forbid compose in development dry-run |
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
13. ~~**Railway staging smoke before cutover?**~~ → **NEVER** (Checkpoint B 2026-11-09). Staging stays on DO. Railway talk only at prod cutover.

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
