# QR Code Quick Reference

> One-page reference for developers working on the QR system.

---

## The Golden Rule

**All QRs encode a redirect URL, never the destination directly.**

```
QR Data: https://musicbizqr.com/directqr?id={slugId}
         ↓
Server looks up QR → Redirects to destination
```

---

## URL Format

```
https://musicbizqr.com/directqr?id=abc123-def456-...
                         │           │
                         │           └─ slugId (UUID)
                         └─ redirect route
```

---

## Data Flow

### Create QR:
```
1. Generate UUID
2. qrValue = https://musicbizqr.com/directqr?id={uuid}
3. POST /api/qrs with qrValue
4. Get back created.id
5. Update qrValue to use created.id (or keep slugId)
6. Generate q_image PNG
7. PUT /api/qrs/{id} with q_image
```

### Scan QR:
```
1. Phone scans → opens URL
2. GET /directqr?id=abc123
3. Server queries Strapi for QR
4. Creates scan record
5. 302 redirect to destination
```

### Download QR:
```
1. Click download button
2. Open DownloadQr modal
3. Fetch QR options from Strapi
4. Render with qr-code-styling
5. Export as PNG/JPG/SVG
```

---

## Key Fields in QR Record

| Field | Purpose | Example |
|-------|---------|---------|
| `slugId` | UUID for lookup | `abc123-def456-...` |
| `url` | Full redirect URL | `https://musicbizqr.com/directqr?id=abc123` |
| `options.data` | URL encoded in QR | Same as `url` |
| `q_type` | Destination type | `bandProfile`, `externalURL`, `events` |
| `link` | External destination | `https://spotify.com/...` |
| `band` | Band relation | `{ id: 5 }` |
| `event` | Event relation | `{ id: 12 }` |
| `q_image` | Saved PNG | S3 URL |

---

## Validation Rules

```javascript
// URL must:
- Start with https://
- Contain directqr?id=
- Have a valid ID after id=

// Examples:
✅ https://musicbizqr.com/directqr?id=abc123
✅ https://musicbizqr.com/directqr?id=46
❌ https://musicbizqr.com (no path)
❌ https://spotify.com/... (external URL)
❌ abc123 (not a URL)
❌ (empty string)
```

---

## Fallback Chain (when building QR data)

```javascript
encoded = 
  options.data       // First: saved in options
  || url             // Second: url field
  || buildFromSlugId // Third: build from slugId
  || buildFromId     // Last: build from record id
```

---

## Components

| Component | File | Purpose |
|-----------|------|---------|
| QrCode | `QrCode.client.vue` | Create new QR |
| EditQrCode | `EditQrCode.client.vue` | Edit existing QR |
| DownloadQr | `DownloadQr.client.vue` | Download modal |
| ShareQrDrawer | `ShareQrDrawer.vue` | Share band QR |

---

## Server Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/directqr` | GET | QR redirect handler |
| `/api/qrs` | CRUD | Strapi QR endpoints |
| `/api/scans/track` | POST | Create scan record |

---

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `NUXT_PUBLIC_BASE_URL` | Base URL for QR links |
| `NUXT_PUBLIC_STRAPI_URL` | Strapi API URL |
| `STRAPI_API_TOKEN` | API authentication |

---

## Debug Commands

```bash
# Test directqr route
curl -I https://musicbizqr.com/directqr?id=46

# Check QR data in Strapi
curl https://your-strapi.com/api/qrs/46?populate=*

# Decode QR image
# Upload to webqr.com
```

---

## Common Fixes

| Problem | Fix |
|---------|-----|
| QR won't scan | Re-save to regenerate q_image |
| Wrong destination | Check q_type and band/event relation |
| Download fails | Check console for errors, refresh |
| 404 on scan | Check directqr.ts and Strapi connection |

---

*Last updated: February 2026*
