# Todo: Single-repo + cheap staging

Canonical checklist for [`tasks/plan.md`](plan.md). Track progress here only — do not fork a second task list.

**Product remotes (`musicbizqr` / `qrserver`) stay the source of truth** and keep receiving normal development. This checklist delays monorepo history merge, remote-affecting `.git` surgery, and Railway prod retarget — it does **not** pause FE/BE work.

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
- [ ] Still open: audit-in-repo?, old-repo archival after cutover? (not blocking Phase 1–2)

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

**Done notes (2026-11-08):** Content-only snapshot pushed to `faneqo.com` `staging`. FE tip `625decc619e9743c89600e6dda6b9564db53e937`; BE tip `bef413d7cb2b9903a0f6b53a6698ed26a2e5f3a1`. Restored dirty local FE `package-lock.json` to tip before removal; ignored `env.prod`, `/.cursor/`, `**/graphify-out/`.

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
- [ ] Human OK to stand up staging without history merge — **say go Phase 2**

---

## Phase 2: DO staging (EARLY — before history merge)

### Task 4: Provision DO droplet and staging compose

**Description:** Create droplet (2GB+), firewall, TLS terminator, and root-level compose overlay that runs Postgres + built frontend + built backend for staging. Prefer root Dockerfiles/overrides that COPY from `frontend/` / `backend/` without monorepo-driven product source edits.

**Acceptance criteria:**
- [ ] Staging host on dedicated hostname (not prod `faneqo.com`)
- [ ] Postgres on droplet volume (not Railway `chalk-volume`)
- [ ] FE/BE use staging env (test Stripe, non-sending mail)
- [ ] `mbq-cron` off or safely non-mailing

**Verification:**
- [ ] Manual check: staging FE URL; API reaches staging BE
- [ ] Manual check: no live Resend send / no live Stripe secret

**Dependencies:** Checkpoint A; Task 1 staging = DO (or DO+later)

**Files likely touched:** root `docker-compose*.yml`, optional `docker/staging/*`, deploy script at root — **not** product source for monorepo fixes

**Estimated scope:** L (one vertical “staging site up” slice)

---

### Task 5: Staging deploy path

**Description:** Wire deploy from workspace / GitHub `staging` (or agreed content deploy) to the droplet. Document rebuild policy (whole stack v1 OK). History merge not required.

**Acceptance criteria:**
- [ ] Deploy updates the droplet from agreed source
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

## Checkpoint B: Staging dogfood

- [ ] Tasks 4–6 done
- [ ] Human uses staging without touching prod
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

**Files likely touched:** `.github/workflows/*` on monorepo

**Estimated scope:** M

---

### Task 12: Root stack smoke test + workflow

**Description:** Restore `tests/stackrun/check.sh` (referenced by root `package.json` but missing) and root CI gated on stack/compose paths.

**Acceptance criteria:**
- [ ] `npm run test:stack` exits 0 on sane checkout
- [ ] Root workflow on stack/compose/docker/tests paths
- [ ] Document what the check covers

**Verification:**
- [ ] Tests pass: `npm run test:stack`
- [ ] Manual check: workflow path filters correct

**Dependencies:** Task 10

**Files likely touched:** `tests/stackrun/**`, `.github/workflows/*`, maybe root `package.json`

**Estimated scope:** M

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

**Files likely touched:** `.audit/**` (and optionally un-ignore if approved)

**Estimated scope:** M+ (ongoing)

---

## Decisions log

| Date | Decision | Choice |
|------|----------|--------|
| 2026-11-08 | Temp nested-`.git` removal? | **YES** — remove `frontend/.git` + `backend/.git` locally for single-tree staging; re-clone / restore `.git` before history migrate. Never push surgery to product remotes. |
| 2026-11-08 | History method | **LATER** — defer filter-repo vs subtree until history phase |
| 2026-11-08 | Staging host | **DO only** for now |
| 2026-11-08 | Railway staging before cutover? | **Not now** — revisit at Checkpoint B |
| 2026-11-08 | Droplet size | **2GB** |
| 2026-11-08 | Branch model | Keep `main` empty for now; all work on `staging`; `staging` deploys to droplet |
| 2026-11-08 | Content-only `faneqo.com` during staging? | **YES** — push full `staging` branch content without product commit history (throwaway history OK). Get staging running without history; history merge later (history does not affect whether staging runs). |
| 2026-11-08 | Phase 1 temp tips | FE `musicbizqr` `625decc619e9743c89600e6dda6b9564db53e937`; BE `qrserver` `bef413d7cb2b9903a0f6b53a6698ed26a2e5f3a1`. Nested `.git` removed locally; content-only `staging` push to `faneqo.com`. |
| | Audit in git? | |
| | Archive old repos when? | |
| | Cutover approved? | |
| | Monorepo product edit list approved? | |
