# Implementation Plan: Single-repo `Nick-tsoukas/faneqo.com` + cheap staging

## Overview

Stand up cheap staging (DO droplet + compose) from the workspace root **before** any history rewrite. Optional local-only temp path: drop nested `frontend/.git` / `backend/.git` so the workspace is one deployable tree for staging — never push that surgery to `musicbizqr` / `qrserver`. After staging works, restore pristine product checkouts, then merge commit history into empty `Nick-tsoukas/faneqo.com`. Only after that (and approval): product-tree monorepo edits, Railway prod cutover, and `.audit/` work.

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
| Compose only runs Postgres; apps still host-run via stackrun | `docker-compose.yml` services = `postgres` only |
| Init creates `faneqo_staging` DB | `docker/postgres-init.sql` |
| Root `npm test` / `test:stack` points at `tests/stackrun/check.sh` but **`tests/` is still missing** | Confirmed 2026-11-08; recreate after history merge / CI phase |
| Each app already has its own CI on its own remote | `frontend/.github/workflows/ci.yml`, `backend/.github/workflows/ci.yml` |
| Prod Railway: two projects (FE `musicbizqr`+`mbq-cron`, BE `qrserver`+Postgres) | Root `AGENTS.md` |
| `.audit/` = Netlify site `faneqo-audit`; ignored by root `.gitignore` | `.audit/DEPLOY.md`, `.gitignore` |
| Prior Cursor plan (superseded) | `.cursor/plans/monorepo_staging_stack_641598ee.plan.md` — local compose/stackrun largely done; staging = **DO+compose**; history-first order **replaced** by this revision |

No root `SPEC.md` / `STACK.md` / `PLAN.md` / `README.md` (on purpose: `AGENTS.md` + `tasks/` are enough). Product loops stay in `frontend/AGENTS.md` and `backend/AGENTS.md` — do not deep-scan those trees unless a task needs product code.

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
3. Staging live on DO droplet + compose (lean)
4. Tear down temp layout; re-clone current FE/BE from remotes (pristine history)
5. Proper commit-history merge into Nick-tsoukas/faneqo.com (filter-repo etc.)
6. Only then (+ approval): monorepo product edits / prod cutover / audit
```

## Dependency graph

```
Root orchestration (compose, stackrun, example.env) — already present
        │
        ├── Optional: local root git + temp nested-.git removal (local only)
        │
        ├── Staging host (DO droplet + compose)  ← EARLY
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
        └── Audit work (`.audit/`) — after single-dir/repo is daily reality
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

User lean: DO droplet + compose.

| Option | Ballpark monthly | Ops | Parity with prod | Verdict |
|--------|------------------|-----|------------------|---------|
| **DO droplet + compose** | ~$12–24 (2GB–4GB) + backups ~20% | You own SSL, updates, disk, DB dumps | Medium — Docker vs Railway builders | **Best cheap staging** |
| **Railway staging env** | Often ~$20–50+ | Low | **Highest** | Optional later before cutover |
| Fly / Render free/low | Low or sleep-prone | Medium | Medium | Weak for always-on Strapi+Postgres |

**Locked:** **DO droplet 2GB** — Postgres + backend + frontend; cron off. No Railway staging for now. Production stays on current two-repo Railway until cutover. Optional Railway staging later for Railpack/Nixpacks parity (revisit Checkpoint B).

**DO sizing:** 1GB thrash under Nuxt SSR + Strapi + Postgres. Locked start **2GB/$12**; bump if OOM.

### D. CI / deploy isolation (path filters — after monorepo exists)

Path filters stay relevant **after** history merge. Until then, product CI stays on `musicbizqr` / `qrserver` as today.

**GitHub Actions (monorepo, Phase 5):**

- Port FE/BE `ci.yml` with `paths:` filters and package working directories.
- Thin root workflow for compose / stackrun / `tests/stackrun/**`.

**Railway (cutover):** service roots `frontend`, `backend`, `frontend/jobs/mbq-cron` + watch paths.

**DO staging deploys:** branch `staging` (or content deploy from root); v1 whole-stack rebuild OK; path-aware later if rebuild time hurts.

### E. Monorepo-driven product edits wait until last step

Allowed early: root orchestration, docs, staging compose overlays at root, optional local temp git layout, DO host work. Product remotes keep normal development.

Forbidden until approval: monorepo PRs that change app sources under `frontend/` / `backend/` (e.g. Postgres-when-`DATABASE_URL`), and any force-push / remote rewrite of product repos. Day-to-day commits on `musicbizqr` / `qrserver` stay allowed.

### F. Audit after monorepo is daily workspace

`.audit/` stays gitignored + Netlify until single-repo daily workflow is real. Then remediate from `.audit/` docs. Vend-into-git is an open question.

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

Still open: audit in-repo?; old-repo archival after cutover?; Railway staging smoke before cutover (revisit at Checkpoint B).

### Phase 1 — Root workspace + optional temp single tree (no remote surgery)

Confirm root orchestration; optionally init root git and remove nested `.git` **locally only** for one deployable tree. Product remotes unchanged and still developed normally.

### Checkpoint A — Temp layout (if used) safe

- [ ] Product remotes still point at `musicbizqr` / `qrserver` and were not force-pushed
- [ ] Tip SHAs recorded before any local `.git` removal
- [ ] Human OK to proceed to staging (or confirmed skip of temp path)

### Phase 2 — Cheap staging on DO (EARLY)

Provision droplet; expand root compose for staging apps; TLS; staging env (test Stripe, non-sending mail); data strategy; deploy path. **No history merge required.**

### Checkpoint B — Staging dogfood

- [ ] Staging URL: FE + staging BE + staging Postgres
- [ ] No prod domains / live mail / live Stripe / `chalk-volume`
- [ ] Human dogfoods; prod Railway still on product remotes
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

Port FE/BE workflows with path filters; restore `tests/stackrun/`; root stack workflow.

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

Begin `.audit/` work once daily development is the single repo/dir.

## Risks and mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Accidental prod Railway retarget | High | Never change prod source until Phase 8 approval |
| Temp `.git` removal treated as final merge | High | Re-clone before filter-repo; content-only ≠ history merge |
| Force-push / rewrite product remotes | High | Local-only temp path; scratch clones for filter-repo; never push rewritten SHAs to old remotes |
| Staging trees lag active product `main` | Med | Remotes stay source of truth; re-pull/re-clone before merge; redeploy staging when needed |
| FE change redeploys BE on monorepo | Med | Path filters + Railway watch paths (Phase 5 / 8) |
| DO staging ≠ Railway runtime | Med | Same Node 20; optional Railway staging smoke before cutover |
| Live Resend/Stripe on staging | High | Non-sending / test keys; cron off |
| `tests/stackrun` missing | Low | Recreate in Phase 5 |

## Open questions (need human forks)

**Answered 2026-11-08** (see Phase 0 + `tasks/todo.md` Decisions log):

1. ~~**Temp path**~~ → **YES**, local nested-`.git` removal; re-clone before history merge.
2. ~~**History tool**~~ → **Deferred** until history phase (filter-repo vs subtree).
3. ~~**Staging**~~ → **DO only** for now (no Railway staging yet).
4. ~~**Droplet size**~~ → **2GB**.
5. ~~**Branch model**~~ → `main` stays empty for now; all work on `staging`; `staging` deploys to droplet.
6. ~~**Content-only `faneqo.com` during staging**~~ → **YES** — full `staging` branch content push without product commit history; history merge later (does not block staging).

**Still open:**

7. **Audit:** keep `.audit/` gitignored + Netlify, or vend into monorepo?
8. **Old repos after cutover:** archive on GitHub, or leave writable for emergency?
9. **Railway staging smoke before cutover?** Revisit at Checkpoint B.

## Out of scope (this plan)

- Pausing or “freezing” product development on `musicbizqr` / `qrserver`
- Railpack flip on prod (see `docs/railpack-research.md`) unless cutover needs it
- Expanding compose for local *app* containers (optional; stackrun host-run stays fine)
- Product features / audit remediation content (Phase 9+)
- Merging the two Railway *projects* into one (unnecessary)

## Task list index

See `tasks/todo.md` for checkable tasks, acceptance criteria, and verification. Order matches phases above.
