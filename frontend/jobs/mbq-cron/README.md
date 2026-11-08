# MBQ Cron Job Runner

Minimal Node.js job runner that triggers MBQ auto-moment and recap evaluators on a schedule.

## Purpose

This service runs as a Railway Cron Job and calls:
- `POST /api/fan-moments/evaluate-auto` - Creates auto-moments when fan energy spikes
- `POST /api/fan-moments/evaluate-recap` - Creates after-show recap moments

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `QRDB_URL` | Yes | Base URL of the Strapi backend (e.g., `https://qrdb-production.up.railway.app`) |
| `MBQ_CRON_KEY` | Yes | Secret key for authenticating with evaluator endpoints |
| `TIMEOUT_MS` | No | Request timeout in milliseconds (default: `15000`) |

## Local Testing

```bash
# Set environment variables
export QRDB_URL=http://localhost:1337
export MBQ_CRON_KEY=dev_key_123

# Also set MBQ_CRON_KEY in your local Strapi .env

# Run the job
node run.js
```

## Railway Setup

### 1. Add New Service

1. Go to your Railway project
2. Click "New Service" → "GitHub Repo"
3. Select the `qr` repo (same as Nuxt frontend)
4. Set the **Root Directory** to: `jobs/mbq-cron`
5. Set the **Start Command** to: `npm start`

### 2. Configure Environment Variables

On the `mbq-cron` service:
```
QRDB_URL=https://<your-qrdb-railway-domain>
MBQ_CRON_KEY=<strong-random-secret>
```

On the `qrdb` service (Strapi):
```
MBQ_CRON_KEY=<same-secret-as-above>
```

### 3. Configure Cron Schedule

1. Go to the `mbq-cron` service settings
2. Under "Cron", set the schedule:
   - Recommended: `*/10 * * * *` (every 10 minutes)
   - Alternative: `*/15 * * * *` (every 15 minutes)

### 4. Verify

Check Railway logs for the `mbq-cron` service to confirm:
- Both endpoints return `ok: true`
- No 401 errors (key mismatch)
- Created counts are reasonable

## Security

- Endpoints require `x-mbq-cron-key` header matching `MBQ_CRON_KEY` env var
- In production, missing key returns 401
- In dev mode (no key set), endpoints are accessible without auth

## Troubleshooting

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | Check `MBQ_CRON_KEY` matches on both services |
| Timeout errors | Increase `TIMEOUT_MS` or check Strapi health |
| HTTP 502 Application failed to respond | qrserver was restarting (deploy). The runner retries 502/503/504 a few times. Confirm qrserver is up, then re-run the cron. |
| No moments created | Normal if no activity meets thresholds |
