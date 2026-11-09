# Faneqo

Monorepo root for local Nuxt (`frontend/`) + Strapi (`backend/`) with Postgres via Docker. Orchestration is [stackrun](https://github.com/unjs/stackrun) (`stack.config.ts`). Agent/migration notes: [`AGENTS.md`](AGENTS.md).

## Prerequisites

| Tool | Required for | Notes |
|------|----------------|-------|
| [mise](https://mise.jdx.dev/) | **Local development only** | Pins Node from `.env` via root `mise.toml`. Install: [`docs/mise-install.md`](docs/mise-install.md) (Linux / macOS / Windows / WSL). Not needed on the staging droplet or inside staging containers. |
| Node.js + npm | Local host builds / `npm run dev` | **Source of truth: root `.env`** (`NODE_VERSION` / optional `FRONTEND_NODE_VERSION` / `BACKEND_NODE_VERSION`; template `example.env`). After `cp example.env .env`, run `mise install` so the default host pin matches `NODE_VERSION`. FE/BE commands use `mise exec` with FE/BE → `NODE_VERSION` fallbacks. |
| Docker | Local DB + staging containers | Daemon running |
| Docker Compose | Same | Compose V2 plugin (`docker compose`) |
| Git | Clone / deploy packaging | — |

Optional later: `ssh` / `rsync` for droplet deploy (Task 5). Staging host needs Docker + Compose + env file — **not** mise.

## Setup

```bash
cp example.env .env
# fill secrets as needed; NODE_VERSION / FRONTEND_NODE_VERSION / BACKEND_NODE_VERSION are fine in example.env
mise install
npm install
```

Installs root tooling (`stackrun`, `jiti`). Frontend/backend deps install when you run the stack (dev) or when you `npm install` inside those folders.

**Node pins (SoT = root `.env`):** Host FE/BE commands use `mise exec node@${FRONTEND_or_BACKEND_NODE_VERSION:-${NODE_VERSION}}` (stackrun + `npm run build:*`). Staging images use the **same** env vars via Compose nested defaults: FE/BE pin → `NODE_VERSION` → `22.11.0`. Leave `FRONTEND_NODE_VERSION` empty to use `NODE_VERSION`. Default `BACKEND_NODE_VERSION=20.20.2` for Strapi’s `<=20.x` engines. Do not hardcode versions in `mise.toml`. Needs Docker Compose ≥ 2.18. Droplet/containers still do **not** need mise.

## Local development

```bash
npm run dev
```

Sets `NODE_ENV=development`, runs `docker compose up -d postgres` (DB only; host maps `5433→5432`, `faneqo_dev`), then starts backend + frontend with hot reload via per-app `mise exec` pins (`BACKEND_NODE_VERSION` / `FRONTEND_NODE_VERSION` → `NODE_VERSION`). Default ports: Strapi `1337`, Nuxt `3000`. On exit, stackrun stops Compose.

## Local staging

```bash
npm run staging
```

Sets `NODE_ENV=staging`. Stackrun `$staging` installs + builds FE/BE on the host, then runs `docker compose --profile staging up -d` (same root `docker-compose.yml`). That profile starts Postgres + **stock Node** FE/BE containers (tags: FE/BE → `NODE_VERSION` → `22.11.0`). Built artifacts are volume-mounted (`frontend/.output`, whole `backend/` including Strapi build output) — no custom Dockerfiles. Containers talk to Postgres on the compose network (`faneqo_staging`). Stackrun then follows container logs (not host `develop`/`dev`). Ports: `STAGING_STRAPI_PORT` / `STAGING_NUXT_PORT`, else unprefixed defaults. Droplet/containers do **not** need mise.

`mbq-cron` stays off locally.

## Build / start (host)

Production-style builds and servers (after `npm install` in `frontend/` / `backend/` as needed). `npm run staging` builds on the host then serves via compose profile containers; `npm run start:*` remains available for host-only starts.

```bash
npm run build            # backend then frontend
npm run build:backend
npm run build:frontend
npm run start:backend
npm run start:frontend
```

## Remote staging deploy

TBD — push to the `staging` branch will deploy staging with the **same** compose file + `--profile staging`. Steps not documented yet (Task 5).

**Public URLs (Phase 2):** use the DigitalOcean droplet IP (`http://IP` or `http://IP:port`) for `STAGING_API_PUBLIC` / `STAGING_WEB_PUBLIC`. Staging domain + HTTPS + Google OAuth redirects come later (see `tasks/todo.md` Task 6b).
