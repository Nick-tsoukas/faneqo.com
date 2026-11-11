# Implementation Plan: Single-repo `Nick-tsoukas/faneqo.com` + cheap staging

## Overview

Stand up cheap staging (DO droplet + compose) from the workspace root **before** any history rewrite. Optional local-only temp path: drop nested `frontend/.git` / `backend/.git` so the workspace is one deployable tree for staging — never push that surgery to `musicbizqr` / `qrserver`. After staging works, restore pristine product checkouts, then merge commit history into empty `Nick-tsoukas/faneqo.com`. Only after that (and approval): product-tree monorepo edits, Railway prod cutover, and audit remediation per `tasks/audit-issues-plan.md`.

**Product remotes stay the source of truth.** `musicbizqr` and `qrserver` keep receiving normal development on GitHub. This plan does **not** pause FE/BE work. It only delays monorepo history merge, nested-`.git` surgery that affects remotes, and Railway prod retarget until staging is live.

This file + `tasks/todo.md` are the **canonical** migration docs. Root `AGENTS.md` is the always-loaded entrypoint. Older Cursor drafts under `.cursor/plans/` are historical only.

This plan is **read-only for product code in the monorepo sense**. No monorepo-driven edits under `frontend/` or `backend/` until the final approved step. Day-to-day product commits continue on the existing remotes as usual. Root workspace files (`docker-compose.yml`, `stack.config.ts`, `example.env`, root `package.json`) already exist and may be used for staging without changing app code.

## Where we are (2026-11-09)

**Staging is done.** Checkpoint B passed. DO droplet runs FE+BE+Postgres; Actions SSH deploy + selective rebuild work; root `npm test` local + Actions (Task 12 done early). Product remotes stay source of truth.

**HTTPS hostnames work** (`https://staging.faneqo.com`, `https://staging-api.faneqo.com`) via Cloudflare Page Rules (Flexible) + host nginx on droplet `:80` (gitignored `.do/`). Droplet `.env` public URLs flipped to those hostnames (**6b.1–6b.3 done**). **6b.4 CORS deferred** to audit Phase 1b (`sec-006`–`sec-009`: Nitro BFF / hide Strapi — do not allowlist FE→API). Checkpoint 6b still open on optional OAuth (**6b.5**).

**What is left (plain English):**

| When | What | Task |
|------|------|------|
| **Optional ops** | Google OAuth only. CORS/BFF = audit `sec-006`–`sec-009` (not 6b.4 allowlist). | **6b.5** / audit |
| **Next real migration** | Run `scripts/merge-product-history.sh` (filter-repo init; re-runnable subtree updates) into `faneqo.com` → land root files on `main`. | **7–10** (HOLD until human says go; script exists, **do not execute** until go) |
| **After history (small)** | Port FE/BE `ci.yml` onto monorepo root Actions with path filters; point daily workspace at `faneqo.com`. | **11**, **13** (**12** already done) |
| **Only if cutover needs it** | Monorepo product diffs under `frontend/` / `backend/`. | **14–15** (explicit go; often skip) |
| **Last migration step** | Point Railway prod at the monorepo. | **16** (separate approval) |
| **Separate track** | Audit remediation. | **17** (not a migration blocker) |

**Not left:** inventing root tests (3.7 + 12 done); standing up DO staging (4–6 + Checkpoint B done); inventing a new CI system (11 only ports existing product `ci.yml`).

## Current state (verified)

| Fact | Evidence |
|------|----------|
| Content-only `faneqo.com` `staging` live; Checkpoint B done | Droplet `159.203.131.189`; Actions deploy + selective rebuild; Strapi admin created |
| `frontend/` / `backend/` trees | Content from product remotes; nested `.git` removed locally (tips recorded); product remotes still SoT |
| Target `Nick-tsoukas/faneqo.com` | Has content-only `staging` (throwaway history). Real history merge still TODO (Tasks 7–10). `main` still empty |
| Local stack | Dev = host + SQLite (no Docker). Staging = same `docker-compose.yml` `up -d` (local attached or droplet) |
| Root `npm test` | Works locally (Task 3.7) + Actions `.github/workflows/root-ci.yml` (Task 12 done early 2026-11-09). Not full FE/BE builds |
| Staging HTTPS | Browser HTTPS + droplet `.env` HTTPS (**6b.1–6b.3**). CORS → audit `sec-006`–`sec-009`. OAuth (**6b.5**) held |
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
DONE   1–6 + Checkpoint B   Staging on DO (IP HTTP) + root tests + deploy Actions
DONE   6b.1–6b.3            HTTPS hostnames + droplet env HTTPS
DEFER  6b.4                 → audit sec-006–sec-009 (Nitro BFF / CORS lock)
OPTIONAL 6b.5               Google OAuth
NEXT   7–10                 History merge into faneqo.com  ← HOLD until human go
THEN   11 + 13              Port FE/BE CI; point daily workspace (12 already done)
THEN   16                   Prod Railway → monorepo (separate approval)
OPTIONAL 14–15 / 17         Product monorepo diffs / audit track
```

## Dependency graph (remaining)

```
[DONE] Staging dogfood (Checkpoint B) — prod still on musicbizqr / qrserver
        │
        ├── [MOSTLY DONE] Staging HTTPS (6b)
        │       • DONE: DNS + host nginx + CF Flexible + droplet env HTTPS (6b.1–6b.3)
        │       • 6b.4 → audit sec-006–sec-009 (not allowlist staging FE)
        │       • LEFT here: OAuth (6b.5 opt / held)
        │
        ├── History merge (7–10)  ← HOLD until human go
        │       │
        │       └── Post-merge chores (small):
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

### B. History migration → `scripts/merge-product-history.sh` (late; locked tool)

**Do not** treat the temp stripped tree as the final monorepo. History merge runs **after** staging checkpoint, from **fresh scratch clones** via the script (never mutate product remotes).

**Script (SoT for the procedure):** [`scripts/merge-product-history.sh`](../scripts/merge-product-history.sh)

| Mode | When | What |
|------|------|------|
| default (no flags) | anytime | **Dry-run** — resolve FE/BE tips, print planned `init` / `update` / `noop`; no clones |
| `--execute` | human go | Scratch work under `$SCRATCH` (default `/tmp/faneqo-history-merge`) |
| `--execute --push` | after review | Push branch `history-merge` (+ backup tag) to `faneqo.com` only |
| re-run `--execute` | product remotes advanced | **Update** via `git subtree pull` per prefix; **noop** if tips match `tasks/history-merge-state.env` |

**First import (`init`):**

1. Clone `faneqo.com` @ `MONOREPO_REF` (default `staging`) → branch `history-merge`; tag `backup/content-only-before-history` once.
2. Fresh clones of `musicbizqr` / `qrserver` at current `main` tips.
3. `git filter-repo --to-subdirectory-filter frontend` / `backend` in those scratch clones.
4. Merge rewritten tips into the monorepo scratch with `--allow-unrelated-histories`.
5. Write `tasks/history-merge-state.env` (`FE_MERGED_SHA` / `BE_MERGED_SHA`).
6. Human reviews scratch; `--push` when ready. Then Task 10 lands any missing root files; open/FF `main` as approved.
7. Leave `musicbizqr` / `qrserver` as product remotes until prod cutover.

**Later imports (`update`):** do **not** re-filter whole history (rewritten SHAs would duplicate). Script uses `git subtree pull --prefix=frontend|backend` from the product remotes. Re-run after new product pushes.

**Tree identity gate:** before merge, workspace `frontend/` / `backend/` must match product remotes at **`main`** (`FRONTEND_REF` / `BACKEND_REF`), aside from ignored paths (`.github/` CI, `node_modules`, Nuxt/Strapi build caches, local `.env`). Monorepo branch may be **`staging`** (`MONOREPO_REF`); that does not change the product compare refs. `bash scripts/merge-product-history.sh --check-trees` runs the gate alone.

**Never:** force-push `musicbizqr` / `qrserver`; run filter-repo on the content-only stripped workspace trees; confuse dry-run with execute.

**Alternatives (rejected as default):**

| Approach | Pros | Cons |
|----------|------|------|
| `git filter-repo` subdirectory rewrite (**init**) | Clean paths; `git log -- frontend/` works | Rewrites SHAs; needs `git-filter-repo` |
| `git subtree pull` (**update**) | Re-runnable when product remotes move | Odd merge topology vs pure filter-repo |
| Orphan squash / content-only forever | Fast | **Reject** as final state — destroys blame |

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

**Task 6b status (2026-11-09):** browser HTTPS + droplet env HTTPS **done (6b.1–6b.3)**. **6b.4 deferred** to audit `sec-006`–`sec-009` (Nitro BFF / hide Strapi / CORS lock — do not add staging FE to Strapi CORS). Optional OAuth (**6b.5**) held. Detail: Architecture **C.1** + `tasks/todo.md`.

### C.1 Staging hostname + HTTPS (Task 6b) — as built 2026-11-09

**Goal:** Browser reaches staging over HTTPS hostnames, not `http://DROPLET_IP:port`. Cloudflare owns DNS + edge TLS. Droplet still runs the same compose FE/BE; host nginx speaks `:80`.

**Why a proxy:** Cloudflare orange-cloud proxy only forwards **80/443** to origin. Publishing `:3000` / `:1337` alone cannot get a normal HTTPS hostname.

#### Locked design (built)

| Piece | Choice |
|-------|--------|
| FE hostname | `https://staging.faneqo.com` |
| API hostname | `https://staging-api.faneqo.com` (not `api.staging` — Universal SSL is one label deep) |
| DNS | Cloudflare A → droplet `159.203.131.189`, **proxied** (orange cloud) |
| Edge TLS | Cloudflare Universal SSL + **Page Rules** SSL=**Flexible** on `staging.faneqo.com/*` and `staging-api.faneqo.com/*` only (zone SSL stays Full/strict for Railway prod) |
| Origin proxy | **Host nginx on droplet** (gitignored `.do/nginx/`) — not compose, not committed. `:80` → `127.0.0.1:3000` / `:1337` by `Host`. No origin TLS / no self-signed certs |
| Droplet firewall | Open **22, 80, 443**; prefer closing public **3000/1337** after smoke (or lock to admin IPs) |
| App env (droplet `.env` only) | **Done (6b.3):** web → `https://staging.faneqo.com`; API → `https://staging-api.faneqo.com` (+ `STRAPI_URL` / `NUXT_PUBLIC_*`); FE/BE recreated |
| Google OAuth | Optional (6b.5) after 6b.3 |

**CORS / browser→Strapi:** Hardcoded allowlist in `backend/config/middlewares.js` (localhost, LAN IP, musicbizqr/faneqo/**fanecco**). Staging FE is **not** on the list — browser XHR to `staging-api` fails CORS today. **Do not** hardcode staging FE in git. Target (audit **sec-009**): CORS origins from public-URL env SoT + optional comma-separated extras; with **sec-006**–**sec-008** Nitro BFF so browsers need not call Strapi. Migration Task **6b.4** deferred into that audit band.

#### Alternatives considered (not used)

| Alt | Why not |
|-----|---------|
| Caddy-in-compose + Origin CA | Human forbade compose proxy + self-signed / origin TLS for this pass |
| Cloudflare Tunnel | Extra daemon; not needed once nginx `:80` + Flexible Page Rules worked |
| Zone-wide SSL Flexible | Would weaken Railway prod on same zone — use Page Rules instead |
| `api.staging.faneqo.com` | Universal SSL one-label-deep limit — use `staging-api` |

#### Forks resolved

1. **API hostname:** `staging-api.faneqo.com` (locked)
2. **Proxy:** host nginx in `.do/` (locked; not compose)
3. **CF SSL:** Page Rules Flexible for staging hosts only; zone SSL unchanged for prod
4. **CORS:** deferred to audit `sec-006`–`sec-009` (not 6b.4 allowlist)
5. **OAuth:** optional (6b.5)

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

### D. CI after history merge (Task 11 — options + locked constraint)

**Hard platform fact (not optional):** GitHub Actions only loads workflows from the **repository root** `.github/workflows/`. After history merge, `frontend/.github/workflows/ci.yml` and `backend/.github/workflows/ci.yml` are ordinary files under subtrees — **they will not run** on `faneqo.com` PRs/pushes. Nested `.github` only works while those trees are separate git roots (`musicbizqr` / `qrserver`).

**Already done today:**
- Local root suite: `npm test` (Task 3.7).
- Product CI: still on `musicbizqr` / `qrserver` via each repo’s root `ci.yml` (unchanged until those remotes stop being daily SoT).
- Staging deploy: `deploy-staging.yml` (gated on Root CI).
- Root Actions (Task 12): `root-ci.yml` on stack/compose/`tests/**` paths — no FE/BE app builds.

**Options for monorepo FE/BE CI (Task 11):**

| Option | Shape | Pros | Cons | Verdict |
|--------|-------|------|------|---------|
| **A. Two root workflows + path filters** | `.github/workflows/frontend-ci.yml` + `backend-ci.yml`; `paths: frontend/**` / `backend/**`; `defaults.run.working-directory` or `working-directory:` on steps; Node pins from env / `FRONTEND_NODE_VERSION` / `BACKEND_NODE_VERSION` | Matches today’s two product workflows; clear skip when other side unchanged; easy to read in Actions UI | Two files to maintain | **Recommended default** |
| **B. One root workflow, two jobs** | Single `product-ci.yml` with `frontend` + `backend` jobs, each with path filters / `if:` | One file; shared checkout/setup possible | Noisy “skipped” jobs; harder concurrency labels | Acceptable if you prefer one file |
| **C. Reusable workflow_call** | Keep logic in `.github/workflows/reusable-*.yml`; thin callers with paths | DRY if FE/BE steps drift together | Extra indirection; overkill while steps stay “npm ci + npm test + npm run build” | Later if duplication hurts |
| **D. Leave CI only under `frontend/.github` / `backend/.github`** | Hope nested workflows run | — | **Does not work** on monorepo | **Reject** |
| **E. Keep product remotes as only CI forever** | Never port; develop only via old remotes | Zero monorepo CI work | Breaks the point of daily workspace on `faneqo.com`; PRs on monorepo untested | **Reject** after cutover; OK *until* Task 11 |

**Locked decisions (2026-11-11 discussion):**

1. **Subdirectory CI does not run on `faneqo.com`** — must port to root (A or B).
2. **Default implementation = Option A** (two root workflows, path filters, same steps as current product `ci.yml`: `npm ci` → `npm test` → `npm run build` with `working-directory: frontend|backend`). Switch to B only if human prefers one file.
3. **Until Task 11 + daily workspace on monorepo:** product remotes keep their own root CI; that is correct dual-running, not duplication debt.
4. **Nested copies after port:** keep `frontend/.github/workflows/ci.yml` and `backend/.github/workflows/ci.yml` in-tree **until product remotes are archived / cut over** (they remain the live CI for those remotes if history still pushes there). After cutover (Task 16+), either delete nested workflows or replace with a one-line README pointer to root workflows — decide at archival (open: delete vs stub).
5. **Do not invent new test suites in Task 11** — relocate + path-filter + Node pin alignment only.
6. **Tree-compare ignore:** `scripts/merge-product-history.sh` already ignores `.github/` so nested CI drift does not block history merge (by design).

**Open (human can flip without re-planning Phase 5):** A vs B file layout; post-cutover delete vs stub for nested `ci.yml`.

**Railway (cutover Task 16):** service roots `frontend`, `backend`, `frontend/jobs/mbq-cron` + watch paths — independent of Actions layout.

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
| History tool | **LOCKED 2026-11-11** — `scripts/merge-product-history.sh`: filter-repo **init**, subtree pull **update**; dry-run default |
| Monorepo FE/BE CI (Task 11) | **LOCKED constraint:** nested `.github` under `frontend/`/`backend/` does **not** run on `faneqo.com`. **Default Option A:** root `frontend-ci.yml` + `backend-ci.yml` + path filters. Product remotes keep CI until cutover. |
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

### Phase 2 — Cheap staging on DO (EARLY) — DONE

Provision droplet; deploy with **same** root `docker-compose.yml` + `docker compose up -d`; staging env (test Stripe, non-sending mail); data strategy; deploy path. Phase 2 public URLs = droplet IP over HTTP. **No history merge required.**

**Task 5.1 (selective rebuild):** Actions stays a thin SSH trigger. Wall clock is droplet `npm install` + Nuxt/Strapi build. Diff previous HEAD → deploy SHA: rebuild only FE and/or BE when those trees change; shared stack files (`scripts/staging-*.sh`, `docker-compose.yml`, deploy workflow) rebuild both; docs/`tasks/`-only syncs git and skips builds. Always pull; conditionally build.

### Checkpoint B — Staging dogfood — DONE

- [x] Staging reachable via droplet IP: FE + staging BE + staging Postgres (same compose file as local)
- [x] `STAGING_API_PUBLIC` / `STAGING_WEB_PUBLIC` set to those HTTP IP URLs (or ports as needed)
- [x] No prod domains / live mail / live Stripe / `chalk-volume`
- [x] Human dogfoods — Strapi admin created (2026-11-09); OAuth may wait for Task 6b
- [x] Railway staging = **never**; history merge **held** until human go; final order = history merge → prod switch to monorepo

### Task 6b — Staging HTTPS — mostly done

**6b.1–6b.3 done** (DNS + host nginx + CF Flexible + droplet env HTTPS). **6b.4** → audit Phase 1b. **Left here:** optional Google OAuth (**6b.5**). See Architecture C.1.

### Phase 3–4 — History merge (NEXT real migration; HOLD until human go)

**Tool locked:** [`scripts/merge-product-history.sh`](../scripts/merge-product-history.sh) (dry-run by default; **do not `--execute` until human go**).

**Task 7:** confirm `git-filter-repo` installed; dry-run script (tips resolve); optional nested re-clone only if daily trees need nested `.git` again (script itself uses scratch clones — nested restore not required to *run* the merge). **Task 8:** freeze tips / state file via dry-run output. **Task 9:** `--execute` then `--push` after review. **Task 10:** land any missing root files on monorepo. Do not force-push product remotes.

Checkpoint C = dry-run OK + human go. Checkpoint D = monorepo has real history; prod still on old remotes.

### Phase 5–6 — Post-merge chores (small; after history)

**Not a second migration.** Task 12 (root `npm test` Actions) already landed early. Task 11 ports FE/BE product CI to monorepo **root** Actions (subdirectory CI cannot run — Architecture D; Option A default); Task 13 points daily workspace at `faneqo.com`.

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
2. ~~**History tool**~~ → **Locked 2026-11-11** — `scripts/merge-product-history.sh` (filter-repo init, subtree update; dry-run default; no `--execute` until go).
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
