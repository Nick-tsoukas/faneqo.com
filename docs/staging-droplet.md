# Staging droplet (DigitalOcean)

Cheap remote staging on a **2GB** droplet. Same root `docker-compose.yml` as local staging. **No mise. No stackrun.**

## Prerequisites on the droplet

- Docker Engine + Compose V2 (≥ 2.18) — see [`docker-install.md`](docker-install.md)
- Git (clone/pull `Nick-tsoukas/faneqo.com` branch `staging`)
- Root `.env` copied from `example.env` with staging secrets + public URLs

Do **not** install mise on the droplet. Builds use stock Node containers (same image tags as compose).

## Public URLs (Phase 2)

Use the droplet public IP over HTTP (no staging hostname yet):

```bash
STAGING_API_PUBLIC=http://DROPLET_IP:1337
STAGING_WEB_PUBLIC=http://DROPLET_IP:3000
```

Also set related app URL overlays (`STAGING_STRAPI_URL`, `STAGING_BASE_URL`, `STAGING_PUBLIC_APP_URL`, `STAGING_FRONTEND_URL`, …) to those HTTP IP URLs as needed. Domain + TLS + Google OAuth redirects = Task 6b later.

## Build + start

From the repo root on the droplet:

```bash
cp example.env .env   # once; fill secrets + STAGING_* public URLs
bash scripts/staging-up.sh
```

What that does:

1. **`scripts/staging-build.sh`** — `docker run --rm --env-file .env` with the same nested Node tags as compose (`FRONTEND_` / `BACKEND_` → `NODE_VERSION` → `22.11.0`). Runs `npm install && npm run build` in one-off containers; bind-mounts write artifacts onto the host tree; containers exit and are removed (`--rm`). **Not** a compose service. `--env-file` is required so Strapi build sees secrets (e.g. `STRIPE_SECRET_KEY` loaded by `cron-tasks.js`).
2. **`docker compose up -d`** — Postgres + backend + frontend. Services use `restart: unless-stopped` so they survive droplet reboots.

Rebuild after a pull:

```bash
bash scripts/staging-build.sh
docker compose up -d --force-recreate backend frontend
```

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

## Provision checklist (Task 4)

1. Create 2GB Ubuntu droplet (+ backups optional)
2. Install Docker + Compose V2
3. Clone `faneqo.com` `staging` to e.g. `/opt/faneqo`
4. Copy/fill `.env` with IP public URLs
5. `bash scripts/staging-up.sh`
6. Open `http://DROPLET_IP:3000` and hit API on `:1337`
)
