# Staging data strategy

How staging Postgres is filled and refreshed. **Never** attach Railway prod volume `chalk-volume`.

## Current dogfood model (Phase 2)

| Item | Choice |
|------|--------|
| Database | Compose volume `faneqo_pg` → DB `faneqo_staging` on the droplet |
| Seed | **Empty migrate** — Strapi creates schema on first `strapi start` |
| Admin | Create first admin at `http://DROPLET_IP:1337/admin` (one-time) |
| Prod data | **Not** copied. No scrubbed dump required for Checkpoint B |
| Cron | `mbq-cron` **off** (no mailing from staging) |
| Mail / Stripe | Test / non-sending keys only — see Safety in [`staging-droplet.md`](staging-droplet.md) |

This is enough for dogfood: admin panel, API health, FE over HTTP IP. Google OAuth may fail until Task 6b (HTTPS + redirects).

## Refresh procedures

### A. Soft reset (wipe staging DB, keep droplet + code)

On the droplet:

```bash
cd /opt/faneqo
docker compose stop backend frontend
docker compose rm -f backend
docker volume rm faneqo_faneqo_pg    # name from `docker volume ls` if different
docker compose up -d
```

Then open `/admin` and create a new first administrator. FE rebuild not required.

### B. Full stack recreate (code + containers; optional volume wipe)

```bash
cd /opt/faneqo
bash scripts/staging-droplet-deploy.sh <sha>   # or FORCE_FULL_BUILD=1 …
# To also wipe DB, run Soft reset (A) before or after
```

### C. Scrubbed prod dump (optional later — not Phase 2 now)

Only if dogfood needs realistic rows:

1. Dump from a **non-prod** or explicitly approved scrubbed snapshot — **not** live `chalk-volume` bind.
2. Restore into droplet Postgres (`faneqo_staging`) via `psql` / `pg_restore` over SSH.
3. Document the dump command + scrub steps in this file when first used.
4. Rotate any secrets that appeared in the dump.

Until that exists, prefer empty migrate + manual fixture bands/users in staging admin.

### D. Brand/host SQL migrate (audit `data-001`)

When a DB still contains `musicbizqr.com` / `MusicBizQR` in content (e.g. after a scrubbed dump):

```bash
# From workspace root; adjust URL for droplet/local compose.
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f scripts/sql/migrate-musicbizqr-hosts-to-faneqo.sql
```

On a copy, change the file’s final `COMMIT` to `ROLLBACK` first to validate. Protects `qr.musicbizqr.com` / `api.musicbizqr.com`. Spec: `tasks/audit-issues.md` → `data-001`.

## Hard rules

1. **Do not** mount, clone, or proxy Railway `chalk-volume` into staging.
2. **Do not** point staging `DATABASE_URL` at production Postgres.
3. **Do not** enable `mbq-cron` until mail is safely non-sending.
4. Staging public URLs: prefer HTTPS hostnames (`docs/staging-droplet.md`); IP HTTP may remain open.

## Verification checklist

- [ ] `docker compose ps` on droplet: postgres healthy, backend/frontend Up
- [ ] `http://DROPLET_IP:1337/admin` loads (create admin if first boot)
- [ ] `http://DROPLET_IP:3000/` returns HTTP 200
- [ ] Railway prod Postgres / `chalk-volume` unchanged (no staging ops against those ids)
- [ ] No live Resend send / no live Stripe charge from staging env
