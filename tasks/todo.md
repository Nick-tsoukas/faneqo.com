# Todo: Single-repo + cheap staging

Canonical checklist for `[tasks/plan.md](plan.md)`. Track progress here only — do not fork a second task list.

**Product remotes (**`musicbizqr` **/** `qrserver`**) stay the source of truth** and keep receiving normal development. This checklist delays monorepo history merge, remote-affecting `.git` surgery, and Railway prod retarget — it does **not** pause FE/BE work.

Do not make monorepo-driven edits under `frontend/` / `backend/` until Task 15 is explicitly approved. Day-to-day commits on the product remotes are allowed throughout.

---

## Phase 0: Decisions



### Task 1: Approve plan forks

**Description:** Human confirms temp-`.git` path, history method, staging host, branch model, and audit/repo archival choices so later tasks do not guess.

**Acceptance criteria:**

- [x] Temp path chosen: **YES** — local nested-`.git` removal for one deployable tree (re-clone before history merge)
- [x] History approach: **LATER** — defer filter-repo vs subtree until history phase
- [x] Staging host: **DO only** for now (no Railway staging yet)
- [x] Branch model confirmed: keep `main` empty for now; all work on `staging`; `staging` deploys to droplet
- [x] Content-only `faneqo.com` during staging: **YES** — push full `staging` branch content without product commit history (throwaway history OK); history merge later
- [x] Staging public URLs: **droplet IP** (HTTP) for `STAGING_API_PUBLIC` / `STAGING_WEB_PUBLIC` until a staging domain exists; domain + TLS + Google redirects deferred (Task 6b)
- [x] Unified compose: **YES** — one `docker-compose.yml`; Compose profiles; dev = DB only + host FE/BE; local + droplet staging = DB + FE/BE containers with built apps volume-mounted (Architecture G in `tasks/plan.md`)
- [x] Staging runtime images: **stock Node** (same image OK twice when versions match); tags from `NODE_VERSION` / `FRONTEND_NODE_VERSION` / `BACKEND_NODE_VERSION`; dual FE/BE versions allowed; **no custom Dockerfiles unless needed** (Task 3.5)
- [x] Local Node tooling: **mise** on development host only; droplet/containers do **not** need mise (Architecture H / Task 3.4)
- [ ] Still open: audit-in-repo?; old-repo archival after cutover? (not blocking Phase 1–2)

**Verification:**

- [x] Manual check: decisions written under “Decisions log” at bottom of this file and in `tasks/plan.md` Phase 0 / Open questions

**Dependencies:** None

**Files likely touched:** none (or short note in `tasks/plan.md` Open Questions)

**Estimated scope:** XS

---



## Checkpoint: Decisions

- [x] Human approved `tasks/plan.md` (staging-early / history-late order)
- [x] Task 1 answers present (blocking forks locked; audit/archival deferred)
- [x] No history rewrite or Railway prod retarget started

---



## Phase 1: Root workspace + optional temp single tree



### Task 2: Confirm root orchestration; prepare staging substrate

**Description:** Verify root compose / stackrun / `example.env` are enough to drive staging overlays. Optionally init a **local** root git for deploy packaging. Do **not** rewrite product remotes; do **not** run filter-repo yet.

**Acceptance criteria:**

- [x] Root files present: `docker-compose.yml`, `stack.config.ts`, `example.env`, root `package.json`, `AGENTS.md`
- [x] Product remotes still `musicbizqr` / `qrserver` and still usable for normal development (tips recorded in `AGENTS.md`; no push to those remotes from root)
- [x] Root git created on branch `staging`; remote only `Nick-tsoukas/faneqo.com` (no product remotes)

**Verification:**

- [x] Manual check: before nested-`.git` removal, remotes were `musicbizqr` / `qrserver` at tips below; after removal nested remotes gone locally by design
- [x] Manual check: no force-push to product remotes (root never had those remotes)

**Dependencies:** Task 1

**Files likely touched:** root only (optional local `.git`); **not** product remotes

**Estimated scope:** S

**Done notes (2026-11-08):** Content-only snapshot pushed to `faneqo.com` `staging` @ `7be36cb58b56a6482b81d49089690617cc7cd7e5` — [https://github.com/Nick-tsoukas/faneqo.com/tree/staging](https://github.com/Nick-tsoukas/faneqo.com/tree/staging). FE tip `625decc619e9743c89600e6dda6b9564db53e937`; BE tip `bef413d7cb2b9903a0f6b53a6698ed26a2e5f3a1`. Restored dirty local FE `package-lock.json` to tip before removal; ignored `env.prod`, `/.cursor/`, `**/graphify-out/`. **Deferred from pack (still on disk):** `frontend/public/howtocreateartistpage.mp4`, `frontend/public/howtocreateqr.mp4`, `frontend/assets/ZoomInstaller.exe` (>50MB; upload stall) — listed in root `.gitignore`; re-add when bandwidth OK. `main` not pushed (empty on remote).

---



### Task 3: Optional — local nested `.git` removal for one deployable tree

**Description:** Only if Task 1 chose the temp path. Record tip SHAs; ensure product work is committed/pushed on remotes as needed; remove `frontend/.git` and `backend/.git` **locally only** so the workspace is one tree for staging deploy. Never push this layout to `musicbizqr` / `qrserver`.

**Acceptance criteria:**

- [x] FE and BE tip SHAs recorded before removal (`AGENTS.md` Re-clone tips + this file)
- [x] Nested `.git` dirs removed locally (path chosen = YES)
- [x] Product GitHub remotes untouched (no force-push, no remote URL rewrite)
- [ ] ~~If path skipped: task marked N/A with note~~ — N/A (path used)

**Verification:**

- [x] Manual check: no agent push/force-push to `musicbizqr` / `qrserver`; tips recorded for re-clone (GitHub MCP commit lookup 404 — treat as ACL/private; remotes not rewritten by this work)
- [x] Manual check: local trees still contain app sources (`frontend/package.json`, `backend/package.json` present)

**Dependencies:** Task 2; Task 1 temp-path = yes (else N/A)

**Files likely touched:** local git metadata only under `frontend/` / `backend/`

**Estimated scope:** S

---



## Checkpoint A: Temp layout safe (or skipped)

- [x] Tasks 2–3 done
- [x] Product remotes still source of truth for development (re-clone from recorded tips / current `main` before history merge)
- [ ] Human OK to stand up staging without history merge — **say go Phase 2** (compose Tasks 3.5–3.6 first, then droplet Task 4)

---



## Phase 2 prep: mise pins + unified compose (local first — before droplet)



### Task 3.4: Root mise pin + README deps (local host only)

**Description:** Document local prerequisites (mise, Node/npm, Docker, Compose). Add root `mise.toml` reading `NODE_VERSION` from `.env`, and put `NODE_VERSION` plus optional `FRONTEND_NODE_VERSION` / `BACKEND_NODE_VERSION` defaults in `example.env`. Mise is **development host only** — staging droplet and staging containers must not require mise. Dual FE/BE Node versions are for compose image tags (Task 3.6); host mise pins the shared `NODE_VERSION`.

**Acceptance criteria:**

- [x] `README.md` lists deps: mise (local dev), Node/npm, Docker, Docker Compose; droplet notes say no mise
- [x] Root `mise.toml` uses `[env] _.file = ".env"` and `node = "{{ env.NODE_VERSION }}"`
- [x] `example.env` has `NODE_VERSION=22.11.0` and empty optional `FRONTEND_NODE_VERSION` / `BACKEND_NODE_VERSION` (fallback documented)
- [x] Plan Architecture H + Decisions log record: mise = host only; compose tags share the same env vars; dual versions allowed
- [x] No FE/BE product edits; `.env` not committed

**Verification:**

- [x] Manual check: `mise.toml` + `example.env` Node block present; README Prerequisites table mentions mise vs droplet
- [x] Manual check: plan says droplet/containers do not need mise

**Dependencies:** Checkpoint A (or parallel with docs); Task 1 forks locked

**Files likely touched:** `README.md`, `example.env`, `mise.toml`, `tasks/plan.md`, `tasks/todo.md`, `AGENTS.md`

**Estimated scope:** S

---



### Task 3.5: Lock unified compose design (docs / human fork)

**Description:** Confirm Architecture G details before any compose implementation: one root `docker-compose.yml`; Compose profiles; postgres always; FE/BE under `staging` profile with **built apps mounted as volumes**; stackrun `$development` stays db-only + host hot reload; `$staging` drives staging profile (not host `develop` as server). Runtime = **stock Node image** (no custom Dockerfiles unless needed). **Docs / decision only — do not implement compose yet in this task.**

**Acceptance criteria:**

- [x] Architecture G in `tasks/plan.md` accepted (or edited) by human — stock-Node / no-custom-Dockerfile lock 2026-11-08
- [x] Runtime image approach chosen: **stock Node** (same image OK for FE + BE); different `command` / ports / volume mounts; **no** custom `docker/Dockerfile.*` unless stock Node proves insufficient later
- [x] Explicit: no second staging-only compose file as source of truth
- [x] Explicit: staging containers mount built app output as volumes (local + droplet)

**Verification:**

- [x] Manual check: Decisions log row for unified compose + staging runtime images (stock Node) filled
- [x] Manual check: no `docker-compose.yml` / custom Dockerfile implementation started under this task alone

**Dependencies:** Checkpoint A (human go); Task 1 unified-compose = YES

**Files likely touched:** `tasks/plan.md`, `tasks/todo.md` Decisions log only

**Estimated scope:** XS

---



### Task 3.6: Implement unified compose profiles + stackrun hooks (local)

**Description:** Extend root `docker-compose.yml` with `frontend` / `backend` services under `profiles: ["staging"]` using **stock Node image(s)** tagged from `FRONTEND_NODE_VERSION` / `BACKEND_NODE_VERSION` with fallback to `NODE_VERSION` (dual versions allowed; same image OK twice when equal) with different `command` / ports / volume mounts for built Nuxt/Strapi artifacts — **no** custom `docker/Dockerfile.*` unless Task 3.5 escape hatch is needed later. Update `stack.config.ts` so `$development` keeps db-only compose + host apps (mise Node), and `$staging` builds then `docker compose --profile staging up -d` (containers serve). Prove locally before droplet. No mise requirement for container runtime. No monorepo-driven product source edits.

**Acceptance criteria:**

- [ ] One root `docker-compose.yml` (no duplicate staging compose as SoT)
- [ ] Staging FE/BE services use stock Node image tags from env (`FRONTEND_NODE_VERSION` / `BACKEND_NODE_VERSION` → `NODE_VERSION`); dual versions work when set differently
- [ ] No custom Dockerfiles added unless stock Node fails
- [ ] `docker compose up -d` starts **only** Postgres
- [ ] `docker compose --profile staging up -d` starts Postgres + FE + BE
- [ ] Staging FE/BE containers mount **built** app dirs as volumes
- [ ] `npm run dev` still hot-reloads FE/BE on host after db-only compose (mise pin)
- [ ] `npm run staging` uses staging-profile containers (not host `develop` as the server)
- [ ] Docs state droplet/containers do **not** need mise
- [ ] `AGENTS.md` / `README.md` describe the two modes
- [ ] No intentional product-source diffs under `frontend/` / `backend/` for this task

**Verification:**

- [ ] Manual check: `docker compose ps` after plain `up -d` shows postgres only
- [ ] Manual check: after host builds + `--profile staging up -d`, FE and BE respond on staging ports; `docker compose … config` (or `ps` image column) shows expected Node tags from env
- [ ] Manual check: setting different `FRONTEND_NODE_VERSION` vs `BACKEND_NODE_VERSION` yields different image tags (smoke via `compose config`)
- [ ] Manual check: `npm run dev` still starts host Nuxt/Strapi with hot reload
- [ ] Manual check: `git status` — no product-source monorepo edits unless pre-approved; no unexpected `docker/Dockerfile.*`

**Dependencies:** Task 3.5 (stock-Node / no-custom-Dockerfile approach locked); Task 3.4 (env pin names exist)

**Files likely touched:** `docker-compose.yml`, `stack.config.ts`, root `package.json` (optional helper scripts), `example.env` (if compose needs more keys), `AGENTS.md`, `README.md` — **not** `docker/Dockerfile.*` unless escape hatch needed

**Estimated scope:** M

---



### Task 3.7: Root test coverage (fast shell; no app builds)

**Description:** Expand root `npm test` beyond stackrun overlays to cover tooling we own at workspace root: `package.json` scripts, `mise.toml` pin shape, `example.env` Node keys, stack overlay structure, postgres-only compose (current truth), cheap docs presence. Keep stackrun import-root approach. Do **not** run full FE/BE builds. Do **not** assert staging Compose profile services until Task 3.6 lands. Hard lock: no product edits under `frontend/` / `backend/` / `.audit/`.

**Acceptance criteria:**

- [x] `tests/root/check.sh` covers: required root scripts + expected command prefixes; mise `.env` + `node = "{{ env.NODE_VERSION }}"`; `example.env` `NODE_VERSION` / optional FE+BE keys; stack `$development`/`$staging` present and no top-level `commands`; compose has `postgres`; `README.md` / `AGENTS.md` / `example.env` exist
- [x] `tests/stackrun/` overlay env checks still pass (import root config)
- [x] Root `package.json`: `test:root` runs root suite; `test:stack` unchanged; `npm test` runs both
- [x] Assumptions / skips recorded in `tasks/plan.md` Architecture I
- [x] No staging-profile compose asserts; no `npm run build` of apps in suite

**Verification:**

- [x] Tests pass: `npm test` (and focused `npm run test:root` / `npm run test:stack`) — 2026-11-08
- [x] Manual check: RED before wiring — `test:root` missing failed `check.sh`; GREEN after `package.json` update
- [x] Manual check: `git status` — only root / `tests/` / `tasks/` files

**Dependencies:** Task 3.4 (mise + env pins exist); stackrun suite already present

**Files likely touched:** `tests/root/check.sh`, root `package.json`, `tasks/plan.md`, `tasks/todo.md` — **not** `frontend/` / `backend/` / `.audit/`

**Estimated scope:** S

---



## Checkpoint Compose: Local unified stack OK

- [x] Human OK on stock-Node approach (no custom Dockerfiles unless needed) — 2026-11-08 / Task 3.5
- [x] Task 3.4 mise + README deps done (host only; env pins for compose tags)
- [x] Task 3.7 root test suite green (`npm test`) — 2026-11-08
- [ ] Tasks 3.5–3.6 done (3.5 design lock done; 3.6 implement still open)
- [ ] Human OK on local staging profile behavior (incl. image tags from env / dual Node when set)
- [ ] Ready for DO droplet using the **same** compose file + `--profile staging` (**no mise** on droplet)
- [ ] Still no history merge / Railway prod retarget

---



## Phase 2: DO staging (EARLY — before history merge)



### Task 4: Provision DO droplet; run same compose staging profile

**Description:** Create droplet (2GB+), firewall, and host env. Deploy with the **same** root `docker-compose.yml` + `--profile staging` (from Task 3.6) — Postgres + FE + BE containers with volume-mounted builds. Do **not** add a second compose file. **Public reachability = droplet IP over HTTP** — set `STAGING_API_PUBLIC` / `STAGING_WEB_PUBLIC` (and related `STAGING_*` URL overlays) to `http://DROPLET_IP` or `http://DROPLET_IP:port` as needed. No staging domain, TLS terminator, or Google OAuth redirect wiring in this task (see Task 6b).

**Acceptance criteria:**

- [ ] Staging reachable on droplet public IP (not prod `faneqo.com`; no staging hostname required yet)
- [ ] Droplet uses root `docker-compose.yml` + `--profile staging` (same as local)
- [ ] `STAGING_API_PUBLIC` / `STAGING_WEB_PUBLIC` point at those HTTP IP URLs
- [ ] Postgres on droplet volume (not Railway `chalk-volume`)
- [ ] FE/BE use staging env (test Stripe, non-sending mail)
- [ ] `mbq-cron` off or safely non-mailing

**Verification:**

- [ ] Manual check: staging FE opens via droplet IP; API reaches staging BE
- [ ] Manual check: host `docker compose --profile staging ps` (or equivalent) shows db + apps
- [ ] Manual check: no live Resend send / no live Stripe secret
- [ ] Manual check: Google OAuth not required for Phase 2 dogfood (may fail until Task 6b)

**Dependencies:** Checkpoint Compose; Task 1 staging = DO

**Files likely touched:** deploy script at root, staging `.env` on host, docs — **not** a second compose file; **not** product source for monorepo fixes

**Estimated scope:** M (vertical “staging site up” on droplet; compose already done in 3.6)

---



### Task 5: Staging deploy path

**Description:** Wire deploy from workspace / GitHub `staging` (or agreed content deploy) to the droplet. Deploy must rebuild apps, then `docker compose --profile staging up -d` (or restart) using the **same** root compose file. Document rebuild policy (whole stack v1 OK). History merge not required.

**Acceptance criteria:**

- [ ] Deploy updates the droplet from agreed source
- [ ] Deploy invokes unified compose staging profile (not a divergent compose stack)
- [ ] Prod Railway deploys still come from product remotes
- [ ] Rollback to previous compose image/commit documented

**Verification:**

- [ ] Manual check: deploy runs; running commit/tree id visible on host
- [ ] Manual check: prod service sources unchanged

**Dependencies:** Task 4

**Files likely touched:** `.github/workflows/deploy-staging.yml` or root `deploy/`, docs

**Estimated scope:** M

---



### Task 6: Staging data strategy

**Description:** Document seed/refresh (empty migrate vs scrubbed dump). Never attach prod volume. Cron off until mail safe.

**Acceptance criteria:**

- [ ] Written refresh procedure
- [ ] Staging DB dogfood-ready
- [ ] Prod `chalk-volume` untouched

**Verification:**

- [ ] Manual check: login/critical read path on staging
- [ ] Manual check: Railway prod Postgres untouched by staging work

**Dependencies:** Task 4

**Files likely touched:** root docs (e.g. `docs/staging.md`)

**Estimated scope:** S

---



### Task 6b: Staging domain + Google OAuth redirects (DEFERRED — not Phase 2 now)

**Description:** When a real staging hostname exists (not prod `faneqo.com`), point DNS at the droplet, terminate TLS, switch `STAGING_API_PUBLIC` / `STAGING_WEB_PUBLIC` (and related URL overlays) from IP HTTP to HTTPS domain URLs, and register Google (and other provider) redirect URIs including `STAGING_GOOGLE_REDIRECT_URI`. Do **not** start this during initial droplet stand-up.

**Acceptance criteria:**

- [ ] Staging hostname resolves to droplet; HTTPS works
- [ ] Public URL env vars use the HTTPS domain (not bare IP)
- [ ] Google OAuth redirect URIs registered and smoke-tested on staging
- [ ] Still no prod domain / live Stripe / live Resend / `chalk-volume`

**Verification:**

- [ ] Manual check: FE + API over HTTPS hostname
- [ ] Manual check: Google login completes on staging

**Dependencies:** Checkpoint B (or later); human has staging domain ready

**Files likely touched:** DNS/TLS on droplet, staging host env, provider consoles — prefer root/docs only; no monorepo-driven FE/BE edits unless approved later

**Estimated scope:** M (ops + env; deferred)

---



## Checkpoint B: Staging dogfood

- [ ] Checkpoint Compose + Tasks 4–6 done (Task 6b still deferred OK)
- [ ] Staging reachable via droplet IP HTTP URLs on unified compose staging profile
- [ ] Human uses staging without touching prod (OAuth may wait for Task 6b)
- [ ] Decision: need Railway staging smoke before cutover? (yes/no)
- [ ] History merge still not started
- [ ] Product remotes still receiving normal development as needed

---



## Phase 3: Restore pristine FE/BE checkouts



### Task 7: Tear down temp layout; re-clone product repos

**Description:** If Task 3 removed nested `.git`, restore full checkouts: re-clone current `musicbizqr` → `frontend/` and `qrserver` → `backend/` (or equivalent fetch of full history). Clear any content-only confusion before filter-repo. If Task 3 was N/A, confirm nested remotes are healthy and skip destructive steps.

**Acceptance criteria:**

- [ ] `frontend/.git` and `backend/.git` are complete clones of product remotes
- [ ] Tips track current remote `main` (or recorded merge tips)
- [ ] Temp root-git layout not mistaken for final monorepo
- [ ] Product remotes still unmodified by force-push

**Verification:**

- [ ] Manual check: `git -C frontend log --oneline | head` and same for backend show real history
- [ ] Manual check: `git -C frontend remote -v` → `musicbizqr`; backend → `qrserver`

**Dependencies:** Checkpoint B

**Files likely touched:** local `frontend/` / `backend/` checkouts only (re-clone)

**Estimated scope:** S

---



## Checkpoint C: Pristine trees for history merge

- [ ] Task 7 done (or confirmed N/A path still has full nested repos)
- [ ] Human approves starting history merge into `faneqo.com`
- [ ] Merge will use **fresh scratch clones**, not in-place mutation of daily trees if avoidable

---



## Phase 4: History merge into `faneqo.com` (LATE)



### Task 8: Freeze merge SHAs and tool the merge

**Description:** Record FE/BE `main` SHAs to merge (current tips after normal development); install/verify `git-filter-repo` (or document subtree); work in scratch clones only.

**Acceptance criteria:**

- [ ] FE and BE tip SHAs written down
- [ ] Merge tool available
- [ ] Scratch directory separate from careless live edits

**Verification:**

- [ ] Manual check: recorded SHAs match intended remote tips

**Dependencies:** Checkpoint C; Task 1

**Files likely touched:** none (scratch only)

**Estimated scope:** S

---



### Task 9: Rewrite histories into prefixes and merge into `faneqo.com`

**Description:** filter-repo (or subtree) on fresh clones; merge unrelated histories into `Nick-tsoukas/faneqo.com`; push `main`. Do **not** force-push `musicbizqr` / `qrserver`. If a content-only staging tip exists on `faneqo.com`, tag/backup then replace with history merge per plan.

**Acceptance criteria:**

- [ ] `faneqo.com` contains `frontend/` and `backend/` from the recorded merge SHAs
- [ ] Both lineages reachable (not a single squash as final history)
- [ ] Product remotes unchanged by force-push

**Verification:**

- [ ] Manual check: `git log --oneline -- frontend/ | head` and `-- backend/ | head`
- [ ] Manual check: GitHub product repos still normal history

**Dependencies:** Task 8

**Files likely touched:** remote `faneqo.com` via scratch clones

**Estimated scope:** M

---



### Task 10: Commit root workspace into `faneqo.com`

**Description:** Add root orchestration files to the monorepo without monorepo-driven app source edits. Stub `tests/stackrun` only if needed for a green tree (full smoke in Phase 5).

**Acceptance criteria:**

- [ ] Root includes `AGENTS.md`, compose, `docker/`, `stack.config.ts`, `example.env`, root `package.json`, `.gitignore`, `docs/` as appropriate
- [ ] No intentional monorepo product-code diffs under `frontend/**` / `backend/**`
- [ ] Secrets stay out of git

**Verification:**

- [ ] Manual check: `git check-ignore -v .env env.prod`
- [ ] Manual check: merge tip + root commit only as intended

**Dependencies:** Task 9

**Files likely touched:** root files on `faneqo.com`

**Estimated scope:** M

---



## Checkpoint D: Monorepo exists, prod still on product remotes

- [ ] Tasks 8–10 done
- [ ] Production Railway still sourced from `musicbizqr` / `qrserver`
- [ ] Human reviews GitHub monorepo layout
- [ ] Product remotes remain valid for any remaining pre-cutover work per policy

---



## Phase 5: Path-aware CI on monorepo



### Task 11: Port FE and BE CI with path filters

**Description:** Add monorepo workflows mirroring package CI with `paths:` filters and correct working directories / npm cache paths.

**Acceptance criteria:**

- [ ] FE workflow on `frontend/**` (+ workflow file)
- [ ] BE workflow on `backend/**` (+ workflow file)
- [ ] Steps equivalent to current package `ci.yml`
- [ ] Both jobs not required on every PR

**Verification:**

- [ ] Manual check: root/docs-only PR skips package CI appropriately
- [ ] Manual check: FE-only → FE workflow; BE-only → BE

**Dependencies:** Task 10

**Files likely touched:** `.github/workflows/`* on monorepo

**Estimated scope:** M

---



### Task 12: Root stack CI workflow

**Description:** Suite itself lands in Task 3.7 (`tests/stackrun/` + `tests/root/`, `npm test`). This task wires a monorepo GitHub Actions workflow gated on stack/compose/docker/tests paths that runs `npm test`.

**Acceptance criteria:**

- [ ] Root workflow on stack/compose/docker/`tests/**` paths runs `npm test`
- [ ] Document what the check covers (point at Architecture I / Task 3.7)

**Verification:**

- [ ] Tests pass: `npm test` (local) / workflow green on a stack-path PR
- [ ] Manual check: workflow path filters correct

**Dependencies:** Task 10; Task 3.7

**Files likely touched:** `.github/workflows/*`, maybe short README/`AGENTS.md` note

**Estimated scope:** S

---



## Checkpoint E: CI isolation

- [ ] Tasks 11–12 done
- [ ] Path-filter behavior verified
- [ ] Human OK with CI minutes / required checks

---



## Phase 6: Local workspace tracks monorepo



### Task 13: Point daily workspace at `faneqo.com`

**Description:** Make `/home/me/dev/faneqo` a single checkout of `faneqo.com`. Nested product `.git` dirs are gone because trees live in the monorepo. Update root `AGENTS.md`. Product GitHub repos remain until cutover archival policy applies — they are not “stopped,” but daily work shifts to the monorepo when human chooses.

**Acceptance criteria:**

- [ ] Root `.git` remote is `Nick-tsoukas/faneqo.com`
- [ ] No nested `.git` under `frontend/` or `backend/`
- [ ] `npm run dev` / compose still work from root
- [ ] `AGENTS.md` reflects single-repo daily workspace; Railway still two projects until cutover

**Verification:**

- [ ] Manual check: `git rev-parse --show-toplevel` is workspace root
- [ ] Manual check: `test ! -d frontend/.git && test ! -d backend/.git`
- [ ] Tests pass: `npm run test:stack` (if Task 12 done)

**Dependencies:** Checkpoint D; preferably Checkpoint E

**Files likely touched:** root `AGENTS.md`; local git metadata

**Estimated scope:** S

---



## Checkpoint F: Single working tree

- [ ] Task 13 done
- [ ] Human develops daily against `faneqo.com` (when ready)
- [ ] Cutover archival policy for old remotes still deferred to Phase 8 / Task 1 answers

---



## Phase 7: Approved monorepo product edits (LAST code step)



### Task 14: Request explicit approval for FE/BE monorepo edits

**Description:** List minimal product changes needed on the monorepo (at least: backend Postgres when `DATABASE_URL` set, per prior plan). Do not implement until approved.

**Acceptance criteria:**

- [ ] Change list written (files + why)
- [ ] Human approves or edits the list

**Verification:**

- [ ] Manual check: approval in Decisions log

**Dependencies:** Checkpoint B (staging) and preferably F

**Files likely touched:** none until approved

**Estimated scope:** XS

---



### Task 15: Implement approved monorepo product edits only

**Description:** Apply approved minimal diffs under `frontend/` and/or `backend/` on `faneqo.com`. Prefer one vertical PR per concern.

**Acceptance criteria:**

- [ ] Only approved files changed
- [ ] Staging still works with Postgres URL
- [ ] No drive-by refactors

**Verification:**

- [ ] Tests pass: package-focused tests for touched area
- [ ] Build succeeds: package `npm run build`
- [ ] Manual check: local/staging behavior if in scope

**Dependencies:** Task 14 approval

**Files likely touched:** e.g. `backend/config/database.js` (only if approved)

**Estimated scope:** S–M

---



## Checkpoint G: Product edits done

- [ ] Task 15 merged
- [ ] Staging re-verified
- [ ] Human ready to discuss prod cutover (separate approval)

---



## Phase 8: Production cutover (separate approval)



### Task 16: Retarget Railway prod to monorepo with watch paths

**Description:** After explicit cutover approval, point prod services at `faneqo.com` subdirectories and `main`; configure watch paths; leave Postgres volume in place. Document rollback to product remotes.

**Acceptance criteria:**

- [ ] `musicbizqr`, `mbq-cron`, `qrserver` build from monorepo paths
- [ ] Watch paths limit cross-service rebuilds
- [ ] `chalk-volume` / prod data unchanged in place
- [ ] Rollback steps written

**Verification:**

- [ ] Manual check: Railway settings show monorepo + correct roots
- [ ] Manual check: prod smoke
- [ ] Manual check: FE-only commit does not rebuild BE

**Dependencies:** Checkpoint G; **explicit cutover approval**

**Files likely touched:** Railway service config; maybe root railway snippets

**Estimated scope:** M

---



## Checkpoint H: Prod on monorepo

- [ ] Task 16 done
- [ ] Old repos archived or clearly read-only per Task 1
- [ ] Human signs off

---



## Phase 9: Audit



### Task 17: Begin audit work from `.audit/`

**Description:** With single-dir/repo daily workflow in place, start audit remediation / issue filing per `.audit/` docs. Netlify flow unless Decision log says vend into git.

**Acceptance criteria:**

- [ ] First audit action item identified and tracked
- [ ] Deploy path known (`DEPLOY.md`)

**Verification:**

- [ ] Manual check: audit site or tracker reflects started work

**Dependencies:** Checkpoint F; preferably H if audit needs prod context

**Files likely touched:** `.audit/`** (and optionally un-ignore if approved)

**Estimated scope:** M+ (ongoing)

---



## Decisions log


| Date       | Decision                                  | Choice                                                                                                                                                                                                                                                                |
| ---------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-11-08 | Temp nested-`.git` removal?               | **YES** — remove `frontend/.git` + `backend/.git` locally for single-tree staging; re-clone / restore `.git` before history migrate. Never push surgery to product remotes.                                                                                           |
| 2026-11-08 | History method                            | **LATER** — defer filter-repo vs subtree until history phase                                                                                                                                                                                                          |
| 2026-11-08 | Staging host                              | **DO only** for now                                                                                                                                                                                                                                                   |
| 2026-11-08 | Railway staging before cutover?           | **Not now** — revisit at Checkpoint B                                                                                                                                                                                                                                 |
| 2026-11-08 | Droplet size                              | **2GB**                                                                                                                                                                                                                                                               |
| 2026-11-08 | Branch model                              | Keep `main` empty for now; all work on `staging`; `staging` deploys to droplet                                                                                                                                                                                        |
| 2026-11-08 | Content-only `faneqo.com` during staging? | **YES** — push full `staging` branch content without product commit history (throwaway history OK). Get staging running without history; history merge later (history does not affect whether staging runs).                                                          |
| 2026-11-08 | Phase 1 temp tips                         | FE `musicbizqr` `625decc619e9743c89600e6dda6b9564db53e937`; BE `qrserver` `bef413d7cb2b9903a0f6b53a6698ed26a2e5f3a1`. Nested `.git` removed locally; content-only `staging` @ `7be36cb` on `faneqo.com`. Three >50MB FE media files deferred from pack (local only).  |
| 2026-11-08 | Staging public URLs                       | **Droplet IP** — `http://DROPLET_IP` / `:port` for `STAGING_API_PUBLIC` / `STAGING_WEB_PUBLIC` until a staging domain exists. HTTP-only caveats: Google OAuth often needs HTTPS + registered redirects (Task 6b later); Secure cookies may need lax staging settings. |
| 2026-11-08 | Unified docker-compose                    | **YES** — one root `docker-compose.yml`; Compose profiles (`staging` for FE/BE). Dev: DB only + host hot reload. Local staging + DO droplet: same file + `--profile staging`; built apps **volume-mounted** into runtime containers. Implement Tasks 3.5–3.6 before droplet Task 4. No duplicate staging compose file. |
| 2026-11-08 | Staging runtime images                    | **Stock Node** — tags from `NODE_VERSION` / optional `FRONTEND_NODE_VERSION` / `BACKEND_NODE_VERSION` (empty → `NODE_VERSION`); dual FE/BE versions allowed; same image OK when equal; different `command` / ports / volume mounts. **No custom Dockerfiles unless needed**. Task 3.5 locked. |
| 2026-11-08 | Local Node tooling (mise)                 | **mise** on development host only (`mise.toml` + `NODE_VERSION` in `example.env`). Staging droplet / staging containers do **not** require mise — they use Docker stock Node tags from the same env vars. Task 3.4. |
| 2026-11-08 | Root test coverage                        | Fast shell suite only (Architecture I / Task 3.7): stackrun overlays + package/mise/example.env/compose/docs shape. Skip full FE/BE builds and staging-profile asserts until Task 3.6. Actions wiring = Task 12. |
|            | Audit in git?                             |                                                                                                                                                                                                                                                                       |
|            | Archive old repos when?                   |                                                                                                                                                                                                                                                                       |
|            | Cutover approved?                         |                                                                                                                                                                                                                                                                       |
|            | Monorepo product edit list approved?      |                                                                                                                                                                                                                                                                       |


