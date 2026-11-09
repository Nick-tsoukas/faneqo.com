# Faneqo

Monorepo root for Nuxt (`frontend/`) + Strapi (`backend/`) with Postgres via Docker. Orchestration is [stackrun](https://github.com/unjs/stackrun) (`stack.config.ts`). Agent/migration notes: [`AGENTS.md`](AGENTS.md).

## Prerequisites

- **Docker** with Compose V2 (`docker compose`) — local Postgres and staging containers (see [`docs/docker-install.md`](docs/docker-install.md))
- **[mise](https://mise.jdx.dev/)** — on the host that builds/runs stack scripts; installs/pins Node from `.env` via `mise.toml` (see [`docs/mise-install.md`](docs/mise-install.md))

`npm run staging` builds on the host with mise, then starts containers. The FE/BE **containers** themselves only run stock Node images — they do not need mise inside.

## Setup

```bash
cp example.env .env
```

Fill secrets as needed. Node pins in `.env` are non-secret (`NODE_VERSION`, optional `FRONTEND_NODE_VERSION` / `BACKEND_NODE_VERSION`; template `example.env`).

```bash
mise install          # install Node pins from .env
npm install           # root stackrun + jiti
```

Host FE/BE use `mise exec` with FE/BE → `NODE_VERSION` fallbacks. Compose staging images use the same vars (then `22.11.0`). Default `BACKEND_NODE_VERSION=20.20.2` for Strapi’s `<=20.x` engines. Needs Docker Compose ≥ 2.18.

Frontend/backend `node_modules` install when you run the stack (or `npm install` inside those folders).

## Local development

```bash
npm run dev
```

`NODE_ENV=development` → `docker compose up -d postgres` (host `5433→5432`, DB `faneqo_dev`) → host Strapi + Nuxt hot reload via mise. Ports: Strapi `1337`, Nuxt `3000`. Exit stops Compose postgres.

## Local staging

```bash
npm run staging
```

Host builds the apps (install + build via mise inside stackrun), then Compose runs Postgres + FE + BE containers (same `docker-compose.yml`, no profiles, no custom Dockerfiles).

1. `NODE_ENV=staging`
2. Host `npm install` + `npm run build` for backend and frontend (mise Node pins)
3. `docker compose up -d` — Postgres + stock Node FE/BE (image tags: FE/BE → `NODE_VERSION` → `22.11.0`)
4. Follows container logs until you exit, then `docker compose down`

Containers use internal `postgres:5432` / DB `faneqo_staging`. Built output is volume-mounted (`backend/`, `frontend/.output`). Host-published ports: `STAGING_STRAPI_PORT` / `STAGING_NUXT_PORT` (else `1337` / `3000`).

`mbq-cron` stays off locally.

## Tests

```bash
npm test                 # test:stack + test:root
npm run test:stack       # stackrun / compose wiring
npm run test:root        # root env + compose assertions
```

Needs Docker available (compose config checks). No app servers required.

## Remote staging deploy

TBD — `staging` branch deploys with the same compose file (`docker compose up -d`). Steps not documented yet (Task 5).

**Public URLs (Phase 2):** droplet IP over HTTP for `STAGING_API_PUBLIC` / `STAGING_WEB_PUBLIC`. Domain + TLS + Google OAuth redirects later (`tasks/todo.md` Task 6b).
