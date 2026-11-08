# Faneqo

Monorepo root for local Nuxt (`frontend/`) + Strapi (`backend/`) with Postgres via Docker. Orchestration is [stackrun](https://github.com/unjs/stackrun) (`stack.config.ts`). Agent/migration notes: [`AGENTS.md`](AGENTS.md).

## Prerequisites

- Node.js (npm)
- Docker + Docker Compose
- Copy env: `cp example.env .env` and fill secrets as needed

## Setup

```bash
npm install
```

Installs root tooling (`stackrun`, `jiti`). Frontend/backend deps install when you run the stack (dev) or when you `npm install` inside those folders.

## Local development

```bash
npm run dev
```

Sets `NODE_ENV=development`, runs `docker compose up -d` (Postgres 16 on `5432`, DB `faneqo_dev`), then starts backend + frontend with hot reload. Default ports: Strapi `1337`, Nuxt `3000`. On exit, stackrun stops Compose.

## Local staging

```bash
npm run staging
```

Same stack shape with `NODE_ENV=staging`. Uses `$staging` in `stack.config.ts` and `STAGING_*` overlays from `.env` (e.g. `STAGING_DATABASE_URL` → `faneqo_staging`). Ports fall back to `STAGING_STRAPI_PORT` / `STAGING_NUXT_PORT`, then the unprefixed defaults.

Compose only runs Postgres. Apps run on the host via stackrun. `mbq-cron` stays off locally.

## Remote staging deploy

TBD — push to the `staging` branch will deploy staging. Steps not documented yet.
