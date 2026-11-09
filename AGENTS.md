# Faneqo workspace

Side-by-side product trees under one root git (content-only `staging` on [`Nick-tsoukas/faneqo.com`](https://github.com/Nick-tsoukas/faneqo.com)). Nested `frontend/.git` / `backend/.git` removed locally for staging; re-clone product remotes before history merge. Real product history merge stays **late** (after staging works).

**Product remotes stay the source of truth.** [`musicbizqr`](https://github.com/Nick-tsoukas/musicbizqr) and [`qrserver`](https://github.com/Nick-tsoukas/qrserver) keep receiving normal development. Migration does **not** pause FE/BE work; it only delays monorepo history merge, remote-affecting `.git` surgery, and Railway prod retarget until staging is live.

**Migration (canonical):** read [`tasks/plan.md`](tasks/plan.md); track [`tasks/todo.md`](tasks/todo.md). Do not invent a second plan. **Status 2026-11-09:** staging done (Checkpoint B). Browser HTTPS + droplet env HTTPS done (**6b.1–6b.3**). **6b.4 CORS** → audit `sec-006`–`sec-009` (Nitro BFF / hide Strapi; CORS from public-URL env + extras — no hardcoded hosts). OAuth (**6b.5**) held. **Next real work:** history merge (Tasks 7–10) when human says go. After that: FE/BE CI port + workspace (11, 13; **12** done), then prod cutover (16). Optional product edits (14–15) only if needed.

**Audit issues (parallel track, not started):** plan [`tasks/audit-issues-plan.md`](tasks/audit-issues-plan.md), progress [`tasks/audit-issues-todo.md`](tasks/audit-issues-todo.md), specs [`tasks/audit-issues.md`](tasks/audit-issues.md). Does not replace the staging plan.

## Layout

| Path | Role |
|------|------|
| `frontend/` | Nuxt — checkout `Nick-tsoukas/musicbizqr`. Product operating loop: `frontend/AGENTS.md`. |
| `backend/` | Strapi v4, canonical data — checkout `Nick-tsoukas/qrserver`. Defers to frontend loop: `backend/AGENTS.md`. |
| `docker-compose.yml` | Staging only. One compose file, no profiles. `POSTGRES_DB=faneqo_staging`. `restart: unless-stopped` on all services. Local = host mise build + attached `docker compose up … --no-log-prefix`. Droplet = `scripts/staging-build.sh` + `docker compose up -d` (no stackrun). Tags FE/BE → `NODE_VERSION` → `22.11.0`. See `tasks/plan.md` Architecture G. |
| `scripts/staging-build.sh`, `scripts/staging-up.sh`, `scripts/staging-droplet-deploy.sh` | Droplet FE/BE install+build via one-off stock Node `docker run --rm`; first-up / SHA redeploy helpers. No mise. |
| `scripts/install-skills.sh`, `scripts/cursor-install-skills.sh`, `scripts/claude-install-skills.sh` | Project-only install/update of [agent-skills](https://github.com/addyosmani/agent-skills), [caveman](https://github.com/JuliusBrussee/caveman), [ponytail](https://github.com/DietrichGebert/ponytail), [cloudflare](https://github.com/cloudflare/skills) (`cloudflare` skill only), plus Cursor-only vendored `ag-build` (`scripts/vendor-skills/ag-build`). Cursor: `.agents/skills/` + `.cursor/skills/` symlinks + `.cursor/rules/`. Claude: `.claude/skills/` + project plugins (`agent-skills`, `caveman`, `ponytail`, `cloudflare`) in `.claude/settings.json`. Rerun refreshes. Ignore FE/BE agent dirs until after history merge. Plan: `tasks/skills-install-plan.md`. |
| `stack.config.ts`, `example.env`, `mise.toml`, root `package.json` | stackrun orchestration + local mise. **Node pin SoT = root `.env`**. `$development` = host hot reload + SQLite (no Docker, no install). `$staging` = before install/build, then attached compose up per service. |
| `docs/docker-install.md` | Docker Engine + Compose install (Linux / macOS / Windows / WSL); linked from README. Staging prerequisite. |
| `docs/staging-droplet.md` | Droplet bootstrap: no mise/stackrun; IP public URLs; staging-build + compose up -d. |
| `docs/staging-data.md` | Staging DB strategy: empty migrate, refresh/wipe, never `chalk-volume`. |
| `tasks/audit-issues-plan.md` | Central plan to resolve audit issues (one approved step at a time). |
| `tasks/audit-issues-todo.md` | Progress checklist — check off as issues resolve. |
| `tasks/audit-issues.md` | Issue specs + acceptance criteria. |
| `docs/mise-install.md` | Host-only mise install (Linux / macOS / Windows / WSL); linked from README. |
| `graphify-out/` | Local knowledge graph (gitignored). |

Do **not** deep-scan `frontend/` or `backend/` unless the task needs product code. Prefer root docs + Railway ids here.

## Monorepo surgery hold (not a product-dev pause)

Do **not** make monorepo-driven edits under `frontend/` or `backend/` until Task 15 in `tasks/todo.md` has explicit human approval. Do **not** rewrite product remotes, force-push them, or retarget production Railway until the matching todo approvals. Day-to-day product commits on `musicbizqr` / `qrserver` remain allowed.

Root orchestration, docs, and staging files at workspace root are the allowed early surface. Optional **local-only** nested-`.git` removal for a temp single deployable tree is planned in `tasks/` — never push that surgery to product remotes; re-clone before history merge.

## Local stack

Human-facing how-to: [`README.md`](README.md).

1. `cp example.env .env` and fill secrets as needed (`NODE_VERSION` / optional `FRONTEND_NODE_VERSION` / `BACKEND_NODE_VERSION` are non-secret pins).
2. `mise install` (local host only — pins Node from `NODE_VERSION` via `mise.toml`). Staging droplet/containers do **not** need mise.
3. `npm install` at workspace root (stackrun + jiti).
4. `npm run dev` — host hot-reload FE + BE via stackrun `$development` (mise Node; install deps in FE/BE folders first). Strapi **SQLite**; **no Docker**.
5. `npm run staging` — before: host install/build; commands: attached `docker compose up` per service with `--no-log-prefix`. Droplet uses `scripts/staging-up.sh` instead (no stackrun/mise).
6. Root `npm test` runs `test:stack` + `test:root` — suite from Task 3.7 (Architecture I; no FE/BE builds). GitHub Actions: `.github/workflows/root-ci.yml` (Task 12; path-filtered). FE/BE product CI still on product remotes until Task 11 after history.

Dev = host hot-reload + mise + SQLite (no Docker). Local staging = same compose file, per-service attached `up`. Droplet = `staging-build.sh` + `up -d`. `mbq-cron` stays off.

## Staging (done)

DO droplet live (`159.203.131.189`); compose `up -d`; Actions SSH deploy + selective FE/BE rebuild. Cron off; no mise/stackrun on droplet. Browser HTTPS: `https://staging.faneqo.com` + `https://staging-api.faneqo.com` (CF Page Rules Flexible + host nginx `.do/`). Droplet `.env` public URLs = those HTTPS hostnames (**6b.3**). Browser→API CORS is **not** widened here — audit `sec-006`–`sec-009`. Google OAuth (**6b.5**) held. Detail: [`docs/staging-droplet.md`](docs/staging-droplet.md), [`docs/staging-data.md`](docs/staging-data.md). No live Stripe, live Resend, production domains, or Railway `chalk-volume`.

## Re-clone tips (Phase 1 temp `.git` removal)

Recorded **before** local nested-`.git` removal. Product remotes stay source of truth — re-clone these before history merge:

| Tree | Remote | Tip SHA (at removal) |
|------|--------|----------------------|
| `frontend/` | `https://github.com/Nick-tsoukas/musicbizqr` (`main`) | `625decc619e9743c89600e6dda6b9564db53e937` |
| `backend/` | `https://github.com/Nick-tsoukas/qrserver` (`main`) | `bef413d7cb2b9903a0f6b53a6698ed26a2e5f3a1` |

## Decisions (Phase 0 locked 2026-11-08)

Canonical detail: [`tasks/todo.md`](tasks/todo.md) Decisions log + [`tasks/plan.md`](tasks/plan.md) Phase 0.

- **Temp nested `.git`:** YES (local only; re-clone before history merge).
- **History tool:** defer until history phase.
- **Staging:** DO only (**never** Railway staging); **2GB** droplet; Checkpoint B done. Leftover migration: **history merge → prod cutover**. Tasks 11–13 = small post-merge chores only.
- **Staging public URLs:** browser HTTPS hostnames + droplet app env HTTPS (**6b.1–6b.3**). CORS/BFF = audit `sec-006`–`sec-009`. Google OAuth (**6b.5**) optional.
- **Unified compose:** YES — one `docker-compose.yml` (no profiles); volume-mounted built apps for **staging only** (Architecture G). Dev = host + SQLite, no compose. Staging ups all services. Staging FE/BE: **stock Node** nested tags FE/BE → `NODE_VERSION` → `22.11.0` (dual versions allowed; Compose ≥ 2.18; no wrapper script); no custom Dockerfiles unless needed.
- **Local Node tooling:** mise on host only (`mise.toml`); not required on droplet / staging containers (Architecture H).
- **Branches:** `main` empty for now; all work on `staging`; `staging` deploys to droplet.
- **`faneqo.com` during staging:** push full `staging` content without product commit history (throwaway OK); history merge later.
- **Audit track:** plan/todo/specs under `tasks/audit-issues-*.md` (not `docs/`); remediation waits on Task 17 / explicit go.

## Railway (production)

Two production projects. Deploys follow `main` on the **current product remotes** until cutover approval. A project-member login's `list-projects` returns nothing; open these ids.

- Frontend project `25421871-db90-42df-9010-edeabe284bd2`, environment `0c7fb3cf-16f0-4ab8-aa23-0b8940305bb9` (`robust-consideration`).
  - `musicbizqr` `18ff005b-4f69-493f-be23-06d08109f898` — repo root, Nixpacks, `npm run build`, `us-west2`.
  - `mbq-cron` `d3d74311-54ad-400d-b965-4f9dafa71506` — root `/jobs/mbq-cron`, cron `*/10 * * * *`, region `us-east4-eqdc4a`. Service builder is Railpack; `frontend/jobs/mbq-cron/railway.json` still says Nixpacks and `node run.js`.
- Backend project `2c5f5be0-7453-4540-82f0-266f99e1d32e`, environment `39535b3d-7e38-40e4-8e4b-7822c22b2bf6` (`lovely-benevolence`).
  - `qrserver` `93cbe664-1825-4cdd-8abf-7e795af95557` — repo root, Nixpacks, `https://qrserver-production.up.railway.app`.
  - Postgres `009d7455-4527-46df-b54e-e37cdbbe1f26` — Postgres 16, private host `postgres`. Volume `chalk-volume` (`00a74a34-bc51-4e4d-a15e-25841218b88b`) is the database: 50 GB at `/var/lib/postgresql/data`. A public TCP proxy forwards to port 5432.

One git repo merge does not merge these Railway projects. Read live config with Railway `describe-environment` on the ids above before changing a deploy. Do not retarget prod services to `faneqo.com` until cutover approval (Phase 8 / Task 16 in `tasks/todo.md`).
