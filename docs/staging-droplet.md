# Staging droplet (DigitalOcean)

Cheap remote staging on a **2GB** droplet. Same root `docker-compose.yml` as local staging. **No mise. No stackrun.**

## Prerequisites on the droplet

- Docker Engine + Compose V2 (≥ 2.18) — see [`docker-install.md`](docker-install.md)
- Git (clone/pull `Nick-tsoukas/faneqo.com` branch `staging`)
- Root `.env` copied from `example.env` with staging secrets + public URLs
- **2GB RAM:** add ~2G swap before first FE build (Nuxt vite is heavy). Example:

```bash
fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

`scripts/staging-build.sh` sets `NODE_OPTIONS=--max-old-space-size=1536` for the frontend one-off container (override with `FRONTEND_NODE_OPTIONS`).

Do **not** install mise on the droplet. Builds use stock Node containers (same image tags as compose).

## Public URLs

Live staging uses HTTPS hostnames (Task 6b). On the droplet `.env`:

```bash
STAGING_API_PUBLIC=https://staging-api.faneqo.com
STAGING_WEB_PUBLIC=https://staging.faneqo.com
STAGING_STRAPI_URL=https://staging-api.faneqo.com
STAGING_BASE_URL=https://staging.faneqo.com
STAGING_PUBLIC_APP_URL=https://staging.faneqo.com
STAGING_FRONTEND_URL=https://staging.faneqo.com
# Apps also read these (compose env_file); keep in sync:
STRAPI_URL=https://staging-api.faneqo.com
PUBLIC_APP_URL=https://staging.faneqo.com
FRONTEND_URL=https://staging.faneqo.com
BASE_URL=https://staging.faneqo.com
# Nuxt runtimeConfig.public overrides without FE rebuild:
NUXT_PUBLIC_STRAPI_URL=https://staging-api.faneqo.com
NUXT_PUBLIC_BASE_URL=https://staging.faneqo.com
```

Then: `docker compose up -d --force-recreate --no-deps backend frontend`.

Edge TLS: Cloudflare Page Rules SSL=Flexible for `staging.faneqo.com/*` and `staging-api.faneqo.com/*` only. Origin = host nginx on `:80` (gitignored `.do/nginx/`) → `127.0.0.1:3000` / `:1337`. Zone SSL left alone for Railway prod.

IP:port HTTP still works if those ports stay open; prefer hostnames for dogfood.

**CORS / browser → Strapi:** Do **not** hardcode FE hosts in `middlewares.js`. Target (audit `sec-009`): CORS origins from the same public-URL env already set on the droplet (`PUBLIC_APP_URL` / `FRONTEND_URL` / `WEB_PUBLIC` + staging overlays) plus optional comma-separated extras. BFF path (`sec-006`–`sec-008`): Nitro same-origin proxy; Strapi URL private to Nuxt. Migration Task 6b.4 deferred into that audit band. Until `sec-009` ships, browser XHR FE→`staging-api` may fail CORS (hardcoded list has no staging FE); SSR/admin paths that skip browser CORS still work.

## Build + start

From the repo root on the droplet:

```bash
cp example.env .env   # once; fill secrets + STAGING_* public URLs
bash scripts/staging-up.sh
```

What that does:

1. **`scripts/staging-build.sh`** — `docker run --rm --env-file .env` with the same nested Node tags as compose (`FRONTEND_` / `BACKEND_` → `NODE_VERSION` → `22.11.0`). Runs `npm install && npm run build` in one-off containers; bind-mounts write artifacts onto the host tree; containers exit and are removed (`--rm`). **Not** a compose service. `--env-file` is required so Strapi build sees secrets (e.g. `STRIPE_SECRET_KEY` loaded by `cron-tasks.js`).
2. **`docker compose up -d`** — Postgres + backend + frontend. Services use `restart: unless-stopped` so they survive droplet reboots.

Redeploy after a new commit (CI or manual) — sync SHA, **selectively** rebuild, recreate only what changed:

```bash
bash scripts/staging-droplet-deploy.sh <git-sha>
# or: GITHUB_SHA=<sha> bash scripts/staging-droplet-deploy.sh
# force both: FORCE_FULL_BUILD=1 bash scripts/staging-droplet-deploy.sh <sha>
```

1. `git fetch` + `reset --hard` to the deploy SHA (always)
2. Diff **previous HEAD → new SHA**; classify paths:
   - `backend/**` → build + recreate **backend** only
   - `frontend/**` → build + recreate **frontend** only
   - shared stack (`scripts/staging-*.sh`, `docker-compose.yml`, `.github/workflows/deploy-staging.yml`) → **both**
   - docs / `tasks/` / other → git sync only (skip build + recreate)
3. `scripts/staging-build.sh` honors `BUILD_BACKEND` / `BUILD_FRONTEND` (also `--backend-only` / `--frontend-only` / `--all`)
4. `docker compose up -d --force-recreate --no-deps` for the services that built (postgres untouched)

Wall clock is droplet install/build, not the Actions runner. Path-aware skips are how docs-only pushes avoid another ~20m Nuxt build.

*(Task 5.1 verify: this line is a docs-only deploy probe — should skip FE/BE build.)*

### GitHub Actions (Task 5)

Workflow: [`.github/workflows/deploy-staging.yml`](../.github/workflows/deploy-staging.yml).

On push to `staging` (or `workflow_dispatch`), Actions SSHs to the droplet, resets to `$GITHUB_SHA`, then runs `scripts/staging-droplet-deploy.sh`. Build stays on the droplet — runner is a thin SSH client.

Repo secrets (Settings → Secrets and variables → Actions):

| Secret | Example |
|--------|---------|
| `STAGING_HOST` | droplet public IP |
| `STAGING_USER` | `root` |
| `STAGING_SSH_PRIVATE_KEY` | private key whose public half is in droplet `~/.ssh/authorized_keys` |

Dedicated deploy key recommended (not your laptop login key). Timeout ≥ 45 min (Nuxt on 2GB is slow).

### Rollback

```bash
cd /opt/faneqo
bash scripts/staging-droplet-deploy.sh <previous_good_sha>
```

Same as forward deploy: hard reset + rebuild + recreate FE/BE. Postgres volume untouched. Confirm with `git rev-parse HEAD` and `docker compose ps`.

Stop / remove:

```bash
docker compose down
```

## Local vs droplet

| | Local (`npm run staging`) | Droplet |
|--|---------------------------|---------|
| Orchestration | stackrun | none |
| Build | host `mise exec` in stackrun `before` | `scripts/staging-build.sh` (one-off Node containers) |
| Compose | attached `docker compose up <service> --no-log-prefix` | `docker compose up -d` |
| Restart policy | same file (`unless-stopped`); Ctrl+C still stops attached up | keeps services up across reboot |

`restart: unless-stopped` is fine with local stackrun: Ctrl+C on attached `compose up` issues an explicit stop, so Docker does not revive those containers.

## Safety

- Test Stripe / non-sending mail only — no live Stripe secret, no live Resend send
- Postgres volume is local to the droplet — never Railway `chalk-volume`
- `mbq-cron` stays off
- Firewall: allow `22`, `3000`, `1337` (and optionally restrict by source IP)

Data seed / wipe / refresh: [`staging-data.md`](staging-data.md).

## Provision checklist (Task 4)

1. Create 2GB Ubuntu droplet (+ backups optional)
2. Install Docker + Compose V2
3. Clone `faneqo.com` `staging` to e.g. `/opt/faneqo`
4. Copy/fill `.env` with IP public URLs
5. `bash scripts/staging-up.sh`
6. Open `http://DROPLET_IP:3000` and hit API on `:1337`

