# Faneqo

Monorepo root for Nuxt (`frontend/`) + Strapi (`backend/`) with Postgres via Docker for **staging**. Orchestration is [stackrun](https://github.com/unjs/stackrun) (`stack.config.ts`). Agent/migration notes: [`AGENTS.md`](AGENTS.md).

Root TypeScript for `stack.config.ts` lives in `tsconfig.stack.json` (not `tsconfig.json`) so host Strapi build does not walk up into a parent TypeScript project.

## Prerequisites

**Local development** (`npm run dev`):

- **[mise](https://mise.jdx.dev/)** — installs/pins Node from `.env` via `mise.toml` (see [`docs/mise-install.md`](docs/mise-install.md))

**Local / remote staging** (`npm run staging` / droplet):

- **Docker** with Compose V2 (`docker compose`) — Postgres + FE + BE containers (see [`docs/docker-install.md`](docs/docker-install.md))
- **mise** on the host that builds (stackrun install/build steps). FE/BE **containers** only run stock Node images — no mise inside.

## Setup

```bash
cp example.env .env
```

Fill secrets as needed. Node pins in `.env` are non-secret (`NODE_VERSION`, optional `FRONTEND_NODE_VERSION` / `BACKEND_NODE_VERSION`; template `example.env`).

```bash
mise install          # install Node pins from .env
npm install           # root stackrun + jiti
```

Host FE/BE use `mise exec` with FE/BE → `NODE_VERSION` fallbacks. Compose staging images use the same vars (then `22.11.0`). Default `BACKEND_NODE_VERSION=20.20.2` for Strapi’s `<=20.x` engines. Staging needs Docker Compose ≥ 2.18.

Frontend/backend `node_modules` install when you run the stack (or `npm install` inside those folders).

## Local development

```bash
npm run dev
```

No Docker. `NODE_ENV=development` → host Strapi + Nuxt hot reload via mise. Strapi uses **SQLite** (`DATABASE_FILENAME`, default `backend/.tmp/data.db`) — product `database.js` ignores `DATABASE_URL` in development. Ports: Strapi `1337`, Nuxt `3000`.

Postgres for host develop is deferred (maybe later); compose Postgres is for staging only.

## Local staging

```bash
npm run staging
```

Requires Docker. Host builds the apps (install + build via mise inside stackrun), then Compose runs Postgres + FE + BE containers (same `docker-compose.yml`, no profiles, no custom Dockerfiles).

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

Staging compose config checks need Docker. No app servers required.

## Remote staging deploy

TBD — `staging` branch deploys with the same compose file (`docker compose up -d`). Steps not documented yet (Task 5).

**Public URLs (Phase 2):** droplet IP over HTTP for `STAGING_API_PUBLIC` / `STAGING_WEB_PUBLIC`. Domain + TLS + Google OAuth redirects later (`tasks/todo.md` Task 6b).
