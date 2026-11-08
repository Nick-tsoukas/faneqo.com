# Railpack research (2026-11-07)

Primary sources: [railpack.com](https://railpack.com/), [Node provider](https://railpack.com/languages/node), [config file](https://railpack.com/config/file), [FAQ](https://railpack.com/faq/), [Railway Railpack](https://docs.railway.com/builds/railpack), [Railway build config](https://docs.railway.com/builds/build-configuration), [Dockerfiles / Compose](https://docs.railway.com/builds/dockerfiles), [Services](https://docs.railway.com/guides/services).

## What Railpack is

Zero-config app builder. Scans the app directory, picks a language provider, installs runtime + deps, runs build if present, packs a container image via BuildKit LLB. Railway created it; it is Railway’s **default** builder for new services (`builder: RAILPACK`). Nixpacks is deprecated.

Does **not** emit a Dockerfile. Do not mix Dockerfile + Railpack on the same service: if Railway finds a `Dockerfile`, it uses the Dockerfile builder instead.

## Your mental model (mostly right)

For Node it:

1. Detects Node if `package.json` exists at the build root
2. Picks package manager (`packageManager` field → lockfile → engines → npm)
3. Resolves Node version (`RAILPACK_NODE_VERSION` → `devEngines` → `engines.node` → `.nvmrc` / `.node-version` / mise → LTS)
4. Installs deps (npm/yarn/pnpm/bun)
5. Runs `build` script **if defined** in `package.json`
6. Start command order: `scripts.start` → `main` → `index.js` / `index.ts`

Frameworks get extras (Nuxt start defaults to `node .output/server/index.mjs` + cache dirs; Next/Vite/Astro SPA/static heuristics). Strapi is not a special-cased framework name in the Node docs — it still works via normal `build` / `start` scripts (`strapi build` / `strapi start`).

## Config knobs (when zero-config is not enough)

- Env vars: `RAILPACK_NODE_VERSION`, `RAILPACK_INSTALL_CMD`, `RAILPACK_NODE_NPM_INSTALL`, `RAILPACK_PRUNE_DEPS`, `RAILPACK_NO_SPA`, etc.
- File: `railpack.json` (override install/build/start, apt packages, layers). Use `"..."` to extend auto commands.
- Railway service settings / `railway.toml|json`: `build.builder = "RAILPACK"`, `buildCommand`, `startCommand`, root directory, watch patterns.

## Compose locally + Railpack in prod

**Compatible plan.** They solve different layers:

| Layer | Tool |
|-------|------|
| Local multi-process (Postgres + apps) | `docker compose` |
| Prod image build per service | Railpack on Railway |
| Prod DB | Railway Postgres service (already) |

Compose is **not** the prod orchestrator. Railway can import a Compose file into canvas services (partial), and `railway dev` uses Compose locally with Railway vars — optional.

Current workspace `docker-compose.yml` only runs Postgres. That is enough for local DB; apps can keep running via `npm run develop` / `npm run dev` on the host, or you expand Compose later for app containers. Expanding Compose does **not** require Railpack locally.

Optional local check: install Railpack CLI + BuildKit, `railpack build ./backend` to preview the image plan before flipping the Railway builder.

## Faneqo fit

- **qrserver (backend):** `package.json` + `engines.node` `>=18 <=20`, scripts `build`/`start` → Railpack Node path matches current Nixpacks plan (`npm ci`/`install` → `npm run build` → `npm run start`). Flip builder Nixpacks → Railpack in service settings (or `railway.toml` `builder: RAILPACK`). Watch Node 20 vs LTS default if `engines` is ambiguous.
- **musicbizqr (frontend):** has `build`/`start`/`dev`, Nuxt → expect Nuxt-aware start (`.output/server/index.mjs`) unless overridden. Same builder flip.
- **mbq-cron:** already noted as Railpack in workspace AGENTS; keep root/subdir settings explicit.

## Do not do

- Add a root `Dockerfile` “for Railpack” — that switches the service off Railpack onto Dockerfile builds.
- Expect Compose → Railway 1:1 runtime parity; map each Compose service to a Railway service + variables instead.
- Assume registry push is required; Railway builds from Git with Railpack.

## Flip checklist (when ready)

1. Service Settings → Build → Builder → Railpack (or config-as-code `RAILPACK`)
2. Deploy; read build plan in logs (provider, install, build, start)
3. Confirm start command and Node version match intent
4. Keep Compose for local Postgres (and optional app services) unchanged
