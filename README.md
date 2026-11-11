# Faneqo

Monorepo root for Nuxt (`frontend/`) + Strapi (`backend/`) with Postgres via Docker for **staging**. Orchestration is [stackrun](https://github.com/unjs/stackrun) (`stack.config.ts`). Agent/migration notes: [`AGENTS.md`](AGENTS.md).

## Prerequisites

**Local development** (`npm run dev`):

- **[mise](https://mise.jdx.dev/)** — installs/pins Node from `.env` via `mise.toml` (see [`docs/mise-install.md`](docs/mise-install.md))

**Local staging** (`npm run staging`):

- **Docker** with Compose V2 (`docker compose`) — Postgres + FE + BE containers (see [`docs/docker-install.md`](docs/docker-install.md))
- **mise** on the host that builds (stackrun `before` install/build). FE/BE **containers** only run stock Node images — no mise inside.

**Droplet staging** (no stackrun, no mise):

- **Docker** + Compose V2 only — see [`docs/staging-droplet.md`](docs/staging-droplet.md)
- Build via `scripts/staging-build.sh` (one-off stock Node containers), then `docker compose up -d`

## Setup

```bash
cp example.env .env
```

Fill secrets as needed. Node pins in `.env` are non-secret (`NODE_VERSION`, optional `FRONTEND_NODE_VERSION` / `BACKEND_NODE_VERSION`; template `example.env`).

```bash
mise install          # install Node pins from .env
npm install           # root stackrun + jiti
npm run install:apps  # FE + BE node_modules via mise Node pins
```

Host FE/BE use `mise exec` with FE/BE → `NODE_VERSION` fallbacks. Compose staging images use the same vars (then `22.11.0`). Default `BACKEND_NODE_VERSION=20.20.2` for Strapi’s `<=20.x` engines. Staging needs Docker Compose ≥ 2.18.

`npm run install:apps` runs `install:backend` then `install:frontend` (mise-pinned `npm install --prefix …`). One side only: `npm run install:frontend` / `npm run install:backend`. Dev stackrun does **not** install — missing `node_modules` → `nuxt: not found` / similar. Staging `$staging` `before` still install+builds itself.

## Local development

```bash
npm run install:apps  # once (or after wiping node_modules)
npm run dev
```

No Docker. `NODE_ENV=development` → host Strapi + Nuxt hot reload via mise (`npm run develop` / `npm run dev`). Strapi uses **SQLite** (`DATABASE_FILENAME`, default `backend/.tmp/data.db`) — product `database.js` ignores `DATABASE_URL` in development. Ports: Strapi `1337`, Nuxt `3000`.

Postgres for host develop is deferred (maybe later); compose Postgres is for staging only.

## Local staging

```bash
npm run staging
```

Requires Docker. Stackrun `$staging`:

1. **before** — host `npm install` + `npm run build` for backend then frontend (mise Node pins)
2. **commands** — attached `docker compose up <service> --no-log-prefix` for `postgres`, `backend`, and `frontend` (one stackrun pane each; compose service logs without `*-1 |` prefix)

Same `docker-compose.yml`, no profiles, no custom Dockerfiles. Image tags: FE/BE → `NODE_VERSION` → `22.11.0`. Containers use internal `postgres:5432` / DB `faneqo_staging`. Built output is volume-mounted (`backend/`, `frontend/.output`). Host-published ports: `STAGING_STRAPI_PORT` / `STAGING_NUXT_PORT` (else `1337` / `3000`).

Services use `restart: unless-stopped` (droplet reboots). Local Ctrl+C on attached `compose up` still stops those services.

`mbq-cron` stays off locally. Stop stackrun with Ctrl+C; run `docker compose down` if you want containers removed.

## Tests

```bash
npm test                 # test:stack + test:root
npm run test:stack       # stackrun / compose wiring
npm run test:root        # root env + compose assertions
```

Staging compose config checks need Docker. No app servers required.

## Droplet staging

See [`docs/staging-droplet.md`](docs/staging-droplet.md). Short path on the droplet (Docker only — no mise, no stackrun):

```bash
bash scripts/staging-up.sh    # staging-build.sh then docker compose up -d
```

`scripts/staging-build.sh` runs install+build in one-off `docker run --rm` containers using the same Node image tags as compose, then drops those containers. Host `node_modules/` + `.cache/npm` persist across deploys; install skips when the lockfile hash is unchanged. Detached compose keeps Postgres/FE/BE up with `restart: unless-stopped`.

**CI deploy:** push to `staging` runs [`.github/workflows/deploy-staging.yml`](.github/workflows/deploy-staging.yml) → Root CI gate → SSH → `scripts/staging-droplet-deploy.sh`. Failed root tests skip deploy. Secrets + rollback: [`docs/staging-droplet.md`](docs/staging-droplet.md).

**Staging data:** empty migrate + local volume only — never Railway `chalk-volume`. Refresh steps: [`docs/staging-data.md`](docs/staging-data.md).

**Public URLs (Phase 2):** droplet IP over HTTP for `STAGING_API_PUBLIC` / `STAGING_WEB_PUBLIC`. Domain + TLS + Google OAuth redirects later (`tasks/todo.md` Task 6b).
