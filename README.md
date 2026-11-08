# Faneqo

Monorepo root for local Nuxt (`frontend/`) + Strapi (`backend/`) with Postgres via Docker. Orchestration is [stackrun](https://github.com/unjs/stackrun) (`stack.config.ts`). Agent/migration notes: [`AGENTS.md`](AGENTS.md).

## Prerequisites

| Tool | Required for | Notes |
|------|----------------|-------|
| [mise](https://mise.jdx.dev/) | **Local development only** | Pins Node from `.env` via root `mise.toml`. Not needed on the staging droplet or inside staging containers. |
| Node.js + npm | Local host builds / `npm run dev` | Version from `NODE_VERSION` in `.env` (default in `example.env`). After `cp example.env .env`, run `mise install` (or `mise trust` once) so PATH matches the pin. |
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

**Node pins:** `NODE_VERSION` is the shared default. Leave `FRONTEND_NODE_VERSION` / `BACKEND_NODE_VERSION` empty to use it. Set either override when FE and BE must differ (staging compose image tags will follow the same vars in Task 3.6).

## Local development

```bash
npm run dev
```

Sets `NODE_ENV=development`, runs `docker compose up -d` (Postgres 16 on `5432`, DB `faneqo_dev`), then starts backend + frontend with hot reload on the **host** Node from mise. Default ports: Strapi `1337`, Nuxt `3000`. On exit, stackrun stops Compose.

## Local staging

```bash
npm run staging
```

**Today:** same host-app shape with `NODE_ENV=staging`. Uses `$staging` in `stack.config.ts` and `STAGING_*` overlays from `.env` (e.g. `STAGING_DATABASE_URL` → `faneqo_staging`). Ports fall back to `STAGING_STRAPI_PORT` / `STAGING_NUXT_PORT`, then the unprefixed defaults. Compose only runs Postgres; apps run on the host via stackrun.

**Planned (Architecture G — Tasks 3.5–3.6):** one root `docker-compose.yml` with Compose profiles. Dev stays Postgres-only + host hot reload (mise Node). Staging (local and DO droplet) uses `--profile staging`: Postgres + FE/BE on **stock Node** images tagged from `FRONTEND_NODE_VERSION` / `BACKEND_NODE_VERSION` (fallback `NODE_VERSION`) with **built** apps mounted as volumes — no custom Dockerfiles unless needed. Droplet/containers do **not** install mise. `$staging` will build then bring up that profile instead of host `develop`/`dev`. See `tasks/plan.md`.

`mbq-cron` stays off locally.

## Remote staging deploy

TBD — push to the `staging` branch will deploy staging with the **same** compose file + `--profile staging`. Steps not documented yet (Task 5).

**Public URLs (Phase 2):** use the DigitalOcean droplet IP (`http://IP` or `http://IP:port`) for `STAGING_API_PUBLIC` / `STAGING_WEB_PUBLIC`. Staging domain + HTTPS + Google OAuth redirects come later (see `tasks/todo.md` Task 6b).
