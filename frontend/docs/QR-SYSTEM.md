# MusicBizQR — QR Code System Documentation

> Complete technical reference for the QR code creation, scanning, tracking, and download system.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Data Model](#data-model)
3. [QR Creation Flow](#qr-creation-flow)
4. [QR Scanning Flow](#qr-scanning-flow)
5. [QR Download Flow](#qr-download-flow)
6. [Key Components](#key-components)
7. [API Endpoints](#api-endpoints)
8. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           QR CODE LIFECYCLE                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. CREATE                    2. SCAN                    3. DOWNLOAD        │
│  ────────                     ──────                     ──────────         │
│  User creates QR     →       Fan scans QR      →       User downloads       │
│  in dashboard                with phone                 for printing        │
│                                                                              │
│  ┌─────────────┐             ┌─────────────┐            ┌─────────────┐     │
│  │ QrCode.vue  │             │ /directqr   │            │ DownloadQr  │     │
│  │ EditQrCode  │             │  (server)   │            │  .client    │     │
│  └──────┬──────┘             └──────┬──────┘            └──────┬──────┘     │
│         │                           │                          │            │
│         ▼                           ▼                          ▼            │
│  ┌─────────────┐             ┌─────────────┐            ┌─────────────┐     │
│  │   Strapi    │             │   Strapi    │            │ qr-code-    │     │
│  │  /api/qrs   │             │ /api/scans  │            │  styling    │     │
│  └─────────────┘             └─────────────┘            └─────────────┘     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### The Golden Rule

**All QR codes encode a redirect URL, never the final destination directly.**

```
QR encodes → https://musicbizqr.com/directqr?id={slugId}
                            │
                            ▼
              Server looks up QR record in Strapi
                            │
                            ▼
              Redirects to final destination:
              - Band profile page (/{bandSlug})
              - External URL (user's link)
              - Event page (/event/{eventSlug})
```

This allows:
- **Tracking**: Every scan is logged with geo, device, UTM data
- **Flexibility**: Destination can be changed without reprinting QR
- **Analytics**: Full funnel visibility from scan → page view → action

---

## Data Model

### QR Record (`qrs` collection in Strapi)

| Field | Type | Description |
|-------|------|-------------|
| `id` | number | Auto-increment Strapi ID |
| `slugId` | string | UUID used in `/directqr?id=` URL (preferred) |
| `url` | string | Full redirect URL: `https://musicbizqr.com/directqr?id={slugId}` |
| `name` | string | User-friendly name for the QR |
| `q_type` | enum | `bandProfile` \| `externalURL` \| `events` |
| `link` | string | Destination URL (for `externalURL` type) |
| `band` | relation | Band relation (for `bandProfile` type) |
| `event` | relation | Event relation (for `events` type) |
| `options` | JSON | QR styling options (see below) |
| `q_image` | media | PNG preview image of the QR |
| `arEnabled` | boolean | Enable AR mode redirect |
| `template` | string | AR template name |
| `users_permissions_user` | relation | Owner of the QR |

### QR Options JSON Schema

```javascript
{
  data: "https://musicbizqr.com/directqr?id=abc123",  // ← CRITICAL: URL encoded in QR
  size: 300,
  backgroundOptions: { color: "#FFFFFF" },
  dotsOptions: {
    type: "square" | "dots" | "rounded" | "classy" | "classy-rounded" | "extra-rounded",
    color: "#000000",
    gradient: {
      type: "linear" | "radial",
      rotation: 0,
      colorStops: [
        { offset: 0, color: "#e6289d" },
        { offset: 1, color: "#40353c" }
      ]
    }
  },
  cornersSquareOptions: {
    type: "square" | "dot" | "extra-rounded",
    color: "#000000"
  },
  cornersDotOptions: {
    type: "square" | "dot",
    color: "#000000"
  },
  image: "data:image/png;base64,...",  // Logo in center
  imageOptions: {
    src: "...",
    imageSize: 0.4,
    margin: 0,
    crossOrigin: "anonymous"
  },
  qrOptions: {
    typeNumber: 0,  // 0 = auto, 1-40 = fixed
    errorCorrectionLevel: "H",  // L, M, Q, H
    margin: 4
  }
}
```

### Scan Record (`scans` collection in Strapi)

| Field | Type | Description |
|-------|------|-------------|
| `date` | datetime | When scan occurred |
| `qr` | relation | Which QR was scanned |
| `band` | relation | Associated band |
| `event` | relation | Associated event |
| `entryType` | string | Always `"qr"` for QR scans |
| `referrer` | string | HTTP referrer header |
| `userAgent` | string | Browser/device info |
| `country` | string | From Cloudflare `cf-ipcountry` |
| `city` | string | From Cloudflare `cf-ipcity` |
| `region` | string | From Cloudflare `cf-region` |
| `latitude` | number | From Cloudflare |
| `longitude` | number | From Cloudflare |
| `utmSource` | string | UTM tracking params |
| `utmMedium` | string | |
| `utmCampaign` | string | |
| `utmTerm` | string | |
| `utmContent` | string | |
| `gclid` | string | Google click ID |
| `fbclid` | string | Facebook click ID |
| `ttclid` | string | TikTok click ID |
| `twclid` | string | Twitter click ID |

---

## QR Creation Flow

### 1. New QR (`/createqr` → `QrCode.client.vue`)

```
User clicks "Create QR" in dashboard
        │
        ▼
┌─────────────────────────────────────┐
│  QrCode.client.vue                  │
│  - Generates UUID: uuidv4()         │
│  - Creates preview URL:             │
│    directqr?id={uuid}               │
│  - Renders live QR preview          │
└─────────────────────────────────────┘
        │
        ▼
User customizes:
  - Name
  - Type (bandProfile / externalURL)
  - Band selection or external link
  - Colors, gradient, logo, dot styles
        │
        ▼
Click "Save QR Code"
        │
        ▼
┌─────────────────────────────────────┐
│  saveQrCode() function:             │
│  1. POST /api/qrs with temp UUID    │
│  2. Get back created.id             │
│  3. Update qrValue to use real ID   │
│  4. PUT /api/qrs/{id} with:         │
│     - Final URL                     │
│     - QR image (PNG blob)           │
│     - options.data = finalURL       │
└─────────────────────────────────────┘
        │
        ▼
Redirect to /dashboard or /createband
```

### 2. Edit QR (`/editqr/{id}` → `EditQrCode.client.vue`)

```
User clicks "Edit" on existing QR
        │
        ▼
┌─────────────────────────────────────┐
│  EditQrCode.client.vue              │
│  - Fetches QR from Strapi           │
│  - Extracts/repairs slugId          │
│  - Rebuilds directUrl computed      │
└─────────────────────────────────────┘
        │
        ▼
initializeVariables():
  - slugId = existing slugId OR extract from URL OR generate new
  - If missing/mismatched, auto-repair record
  - Load all styling options
        │
        ▼
User edits and saves
        │
        ▼
updateQrCodeSubmit():
  - Saves with options.data = directUrl
  - Uploads new QR image
  - Persists slugId
```

### Key Code Locations

| File | Purpose |
|------|---------|
| `components/QrCode.client.vue` | Create new QR |
| `components/EditQrCode.client.vue` | Edit existing QR |
| `components/EditLinkQr.vue` | Simple link editor (legacy) |
| `pages/createqr.vue` | Create page wrapper |
| `pages/editqr/[id].vue` | Edit page wrapper |

---

## QR Scanning Flow

When a fan scans a QR code with their phone:

```
Phone camera → QR → https://musicbizqr.com/directqr?id=abc123
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────┐
│  server/routes/directqr.ts                                  │
│                                                             │
│  1. Extract `id` from query params                          │
│  2. Lookup QR via /api/qrs/lookup                           │
│  3. Create scan record with analytics:                      │
│     - Cloudflare geo headers (country, city, lat/lng)       │
│     - UTM params from URL                                   │
│     - User agent, referrer                                  │
│  4. Set cookie `mbq_qr_src` for page attribution            │
│  5. Determine redirect destination:                         │
│     - bandProfile → /{band.slug}                            │
│     - events → /event/{event.slug}                          │
│     - externalURL → user's link                             │
│     - arEnabled → /ar/{qrId}?template={template}            │
│  6. Preserve UTM params in redirect                         │
│  7. 302 redirect to destination                             │
└─────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                          Fan lands on destination
                          (band page, external site, etc.)
```

### Redirect Logic (Priority Order)

```javascript
// server/routes/directqr.ts

// 1. AR mode takes precedence
if (attrs.arEnabled) {
  redirect → /ar/{qrId}?template={template}
}

// 2. Band profile
if (q_type === 'bandProfile' && band?.slug) {
  redirect → /{band.slug}
}

// 3. Event page
if (q_type === 'events' && event?.slug) {
  redirect → /event/{event.slug}
}

// 4. External URL
if (q_type === 'externalURL' && link) {
  redirect → link (normalized to https://)
}

// 5. Fallback
redirect → site root
```

### QR Source Cookie

A cookie is set on scan to attribute the visit:

```javascript
{
  qrId: 123,
  bandId: 5,
  scanId: 456,
  at: 1706820000000  // timestamp
}
// Cookie name: mbq_qr_src
// Max age: 10 minutes
// Used by page-view tracking to tie visits to QR scans
```

---

## QR Download Flow

When user downloads a QR from dashboard:

```
Dashboard → Click "Download" on QR
        │
        ▼
┌─────────────────────────────────────┐
│  openDownloadForQr(id)              │
│  - Shows modal with loading         │
│  - Fetches QR details from Strapi   │
│  - Calls buildQrOptionsFromStrapi() │
└─────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────┐
│  buildQrOptionsFromStrapi(raw)      │
│                                     │
│  URL Resolution (priority order):   │
│  1. saved.data (options.data)       │
│  2. a.url (record's url field)      │
│  3. a.slugId → build directqr URL   │
│  4. node.id → build directqr URL    │
│                                     │
│  Also extracts:                     │
│  - Logo image                       │
│  - Dot/corner colors                │
│  - Background color                 │
│  - Style options                    │
└─────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────┐
│  DownloadQr.client.vue              │
│  - Creates qr-code-styling instance │
│  - Renders preview at 512px         │
│  - User selects:                    │
│    - Export size (512/1024/2048)    │
│    - Format (PNG/JPEG/SVG)          │
│    - Background (color/transparent) │
│  - Downloads file                   │
└─────────────────────────────────────┘
```

### URL Resolution Fallback Chain

This is critical for ensuring downloaded QRs work:

```javascript
// pages/dashboard.vue - buildQrOptionsFromStrapi()

let encoded =
  // 1. Best: Explicit URL in options.data (new QRs have this)
  (saved.data && String(saved.data).trim()) ||
  
  // 2. Good: URL field on record
  (a.url && String(a.url).trim()) ||
  
  // 3. Legacy fallbacks
  (a.qrValue && String(a.qrValue).trim()) ||
  (a.link && String(a.link).trim()) ||
  (a.data && String(a.data).trim()) ||
  ''

// If still empty or just origin, build from slugId or record ID
if (!encoded || isOriginOnly(encoded)) {
  if (a.slugId) {
    encoded = buildDirect(a.slugId)  // /directqr?id={slugId}
  } else if (node?.id) {
    encoded = buildDirect(node.id)   // /directqr?id={recordId}
  }
}
```

---

## Key Components

### QR Generation Library

Uses `qr-code-styling` npm package for high-quality customizable QRs.

```javascript
import QRCodeStyling from 'qr-code-styling'

const qr = new QRCodeStyling({
  width: 300,
  height: 300,
  data: "https://musicbizqr.com/directqr?id=abc123",
  dotsOptions: { type: "rounded", color: "#000" },
  // ... more options
})

qr.append(containerElement)  // Render to DOM
qr.download({ name: "my-qr", extension: "png" })  // Download
const blob = await qr.getRawData("png")  // Get as blob
```

### Component Reference

| Component | Location | Purpose |
|-----------|----------|---------|
| `QrCode.client.vue` | `/components/` | Create new QR with full customization |
| `EditQrCode.client.vue` | `/components/` | Edit existing QR |
| `EditLinkQr.vue` | `/components/` | Simple link-only editor |
| `EditBandQr.vue` | `/components/` | Band QR editor |
| `DownloadQr.client.vue` | `/components/` | Download modal with export options |
| `ShareQrDrawer.vue` | `/components/` | Share QR via social/copy |

---

## API Endpoints

### Strapi Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/qrs` | List QRs (with filters) |
| `GET` | `/api/qrs/:id` | Get single QR |
| `POST` | `/api/qrs` | Create QR |
| `PUT` | `/api/qrs/:id` | Update QR |
| `DELETE` | `/api/qrs/:id` | Delete QR |
| `GET` | `/api/qrs/lookup` | Lookup by URL or slugId (for redirect) |
| `POST` | `/api/scans/track` | Create scan record |

### Server Routes

| Route | File | Description |
|-------|------|-------------|
| `/directqr` | `server/routes/directqr.ts` | QR redirect handler |

---

## Bugs Fixed (February 2026)

| Bug | File | Issue | Fix |
|-----|------|-------|-----|
| **#1** | `QrCode.client.vue` | Hardcoded `https://musicbizqr.com` | Now uses `config.public.baseUrl` |
| **#2** | `QrCode.client.vue` | Missing `slugId` on create | Now saves `slugId: uuid` |
| **#3** | `EditQrCode.client.vue` | Missing `options.data` | Now saves `data: directUrl` |
| **#4** | `dashboard.vue` | Weak URL fallback | Now always builds from ID |
| **#5** | `DownloadQr.client.vue` | `example.com` as fallback | Now uses `musicbizqr.com` |
| **#6** | `dashboard.vue` | `a.link` in URL chain | Removed - it's destination, not directqr URL |
| **#7** | `directqr.ts` | Used non-existent `/api/qrs/lookup` endpoint | Reverted to standard Strapi `/api/qrs` with filters |
| **#8** | `QrCode.client.vue` | No URL validation | Added `ensureValidQrUrl()` function |
| **#9** | `EditQrCode.client.vue` | No URL validation | Added `ensureValidQrUrl()` function |
| **#10** | `dashboard.vue` | Direct image fetch had CORS issues | Reverted to modal-based download |

---

## Critical Validation Rules

All QR-related code MUST follow these rules:

1. **URL Format**: All QR data MUST be `https://musicbizqr.com/directqr?id={id}`
2. **Validation**: URLs MUST start with `https://` and contain `directqr?id=`
3. **Fallback**: If no valid URL, build from `slugId` → `node.id` → `'unknown'`
4. **Never encode**: External URLs, empty strings, or non-URL data directly

---

## Troubleshooting

### QR Won't Scan / "No App Found"

**Cause**: QR is encoding invalid data (not a URL)

**Debug**:
1. Open browser console
2. Click Download on the QR
3. Look for `[QR Download Debug]` logs
4. Check `Final encoded URL` - should be `https://musicbizqr.com/directqr?id=...`

**Fix**:
- If `options.data` is missing: Re-save the QR in edit mode (new code saves it)
- If `url` field is empty: Old record needs repair, edit and save again

### QR Scans But Goes to Wrong Place

**Check**:
1. `q_type` field matches intent (bandProfile vs externalURL)
2. For `bandProfile`: band relation exists and has valid slug
3. For `externalURL`: `link` field has valid URL

**Debug in server logs**:
```
[directqr] QR ID: 46 q_type: bandProfile
[directqr] band relation: {"id":5,"slug":"jenna-kay",...}
[directqr] Final destination: https://musicbizqr.com/jenna-kay
```

### QR Styling Lost on Download

**Cause**: `styleOpts` not being preserved during export

**Check**:
- `DownloadQr.client.vue` should call `qr.update()` with full options before download
- Options should include: `dotsOptions`, `cornersSquareOptions`, `cornersDotOptions`, `backgroundOptions`, `image`

### Old QRs Missing slugId

Some old records may not have `slugId` field. The system auto-repairs:

1. `EditQrCode.client.vue` checks on load
2. If missing, generates new UUID
3. Auto-saves repair to record

For bulk repair, could run migration script in Strapi.

---

## Environment Variables

| Variable | Used In | Purpose |
|----------|---------|---------|
| `NUXT_PUBLIC_BASE_URL` | QR creation | Base URL for directqr links |
| `NUXT_PUBLIC_STRAPI_URL` | All | Strapi API base |

---

## Security Considerations

1. **No direct external encoding**: QRs never encode external URLs directly, always go through `/directqr`
2. **User ownership**: QRs filtered by `users_permissions_user` relation
3. **Link normalization**: External links are normalized to HTTPS
4. **Cookie scope**: `mbq_qr_src` cookie is short-lived (10 min) and not HttpOnly (needs frontend access)

---

## Future Improvements

- [ ] QR code versioning (track changes over time)
- [ ] Bulk QR creation
- [ ] QR code templates (save/reuse styling)
- [ ] Dynamic QR content (A/B testing destinations)
- [ ] QR expiration dates
- [ ] Password-protected QRs

---

*Last updated: February 2026*
