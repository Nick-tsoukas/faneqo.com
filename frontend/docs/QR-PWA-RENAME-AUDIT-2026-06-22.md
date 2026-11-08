# QR + PWA Rename Audit — MusicBizQR → Faneqo

> **Created:** 2026-06-22
> **Author:** Engineering
> **Purpose:** Code-accurate audit of how QR codes and the PWA work *today*, and a safe, phased plan to rename the **frontend** from `musicbizqr.com` to `faneqo.com` ("fan echo") **without breaking any printed QR codes, band pages, or payments.**
>
> **Scope note:** The **backend (Strapi / `qrserver`) stays exactly where it is** — it uses a Railway-generated domain (`qrserver-production.up.railway.app`), *not* a custom domain, so the API origin does **not** change. Only the frontend brand/domain changes.

---

## 0. TL;DR — The One Rule That Must Not Be Broken

**Printed QR codes are immutable.** Every QR already in the wild encodes one of:

- `https://qr.musicbizqr.com/directqr?id={id}` (current/new QRs — gateway subdomain)
- `https://musicbizqr.com/directqr?id={id}` (legacy QRs)

We cannot re-print stickers, posters, merch, or flyers already out there. Therefore:

> **`musicbizqr.com` and `qr.musicbizqr.com` MUST keep resolving and redirecting indefinitely.** They keep pointing at the same Nuxt app; the app simply redirects scans onward to the new `faneqo.com` destinations.

If those two hostnames ever stop serving `/directqr`, **every existing QR dies.** This is the single highest risk of the rename.

---

## 1. Corrections to the Older Docs (they are outdated)

The previous docs (`QR-SYSTEM.md`, `QR-QUICK-REFERENCE.md`, `QR-TROUBLESHOOTING.md`, `QR-AUDIT-2026-02.md`, `PWA-SCOPE-RESTRICTION.md`, `PWA-QR-DEEP-DIVE.md`) describe an earlier architecture. What's actually true in the code today:

| Old doc says | Reality in code (2026-06-22) | Source |
|---|---|---|
| QRs encode `https://musicbizqr.com/directqr?id=` | New QRs encode the **gateway subdomain** `https://qr.musicbizqr.com/directqr?id=` | `@c:\code\musicbizqr\utils\qr.ts:11-24` |
| PWA fix = restrict `scope` to `/dashboard` | **Reverted.** Manifest `scope` and `start_url` are back to `/`. The QR-on-subdomain approach replaced scope restriction. | `@c:\code\musicbizqr\public\manifest.webmanifest:5-6` |
| `navigateFallback: '/offline'` | Navigation fallback is **disabled** (`navigateFallback: ''`) to stop the `non-precached-url` error | `@c:\code\musicbizqr\nuxt.config.ts:127` |
| `directqr` uses standard Strapi `/api/qrs` | Uses the custom `/api/qrs/lookup` endpoint (bypasses permission sanitization, populates band) | `@c:\code\musicbizqr\server\routes\directqr.ts:48` |

**Why the gateway subdomain exists:** Android deep-links any URL inside an installed PWA's scope into the PWA, which broke stock-camera QR scans ("No apps installed to scan QR code"). By encoding QRs on a **different origin** (`qr.musicbizqr.com`) that is outside the PWA's scope, scans always open in the browser, while the PWA keeps full `scope: "/"`. See `PWA-QR-DEEP-DIVE.md` for the original investigation.

---

## 2. How QRs Work Today (verified against code)

### 2.1 Lifecycle

```
CREATE (dashboard)                SCAN (phone)                       RESOLVE
─────────────────                 ───────────                        ───────
QrCode.client.vue                 Camera opens encoded URL:          server/routes/directqr.ts
  → uuidv4()                        https://qr.musicbizqr.com/         1. lookup /api/qrs/lookup
  → getEncodedQrUrl(uuid)           directqr?id={slugId}             2. log scan + geo/UTM
  → POST /api/qrs                          │                          3. set mbq_qr_src cookie
  → PUT /api/qrs/{id}                       ▼                          4. 302 → destination:
    (url, options.data, q_image)   qr-gateway middleware                 - bandProfile → /{slug}
                                   passes /directqr through              - events     → /event/{slug}
                                                                         - externalURL → link
                                                                         - arEnabled   → /ar/{id}
```

### 2.2 The encoded URL is built in ONE place

```ts
// @c:\code\musicbizqr\utils\qr.ts:11-24
const QR_GATEWAY_ORIGIN = 'https://qr.musicbizqr.com'
const LEGACY_ORIGIN = 'https://musicbizqr.com'

export function getEncodedQrUrl(qrId: string | number): string {
  return `${QR_GATEWAY_ORIGIN}/directqr?id=${qrId}`
}
```

Used by both create and edit flows:
- `@c:\code\musicbizqr\components\QrCode.client.vue:404,423,750`
- `@c:\code\musicbizqr\components\EditQrCode.client.vue:402,422`

This is the **most important file for the rename** — changing `QR_GATEWAY_ORIGIN` controls what all *future* QRs encode.

### 2.3 The gateway subdomain behavior

```ts
// @c:\code\musicbizqr\server\middleware\qr-gateway.ts:10-21
if (host.startsWith('qr.musicbizqr.com')) {
  if (url.startsWith('/directqr')) return        // let scans through
  return sendRedirect(event, `https://musicbizqr.com${url}`, 302)  // everything else → main
}
```

```ts
// @c:\code\musicbizqr\server\routes\directqr.ts:26-29
const isQrGateway = host.startsWith('qr.musicbizqr.com')
const targetOrigin = isQrGateway ? 'https://musicbizqr.com' : `${reqUrl.protocol}//${reqUrl.host}`
```

Both files **hardcode** `qr.musicbizqr.com` and `https://musicbizqr.com`. These must become multi-domain aware (see §5).

### 2.4 Data model (unchanged by rename)

QR record key fields: `slugId` (UUID in the URL), `url` (full encoded URL), `options.data` (URL baked into the PNG), `q_type` (`bandProfile|externalURL|events`), `link`, `band`, `event`, `arEnabled`, `q_image`. The rename does **not** touch the schema. Note: `url` and `options.data` on **existing** records still contain `qr.musicbizqr.com` / `musicbizqr.com` — that's fine, because those hosts keep redirecting.

---

## 3. How the PWA Works Today

| Property | Value | Source |
|---|---|---|
| Manifest name / short_name | `MusicBizQR` / `MBQ` | `@c:\code\musicbizqr\public\manifest.webmanifest:2-3` |
| `scope` / `start_url` | `/` / `/` | `@c:\code\musicbizqr\public\manifest.webmanifest:5-6` |
| theme / background | `#FF00FF` / `#000000` | manifest + `@c:\code\musicbizqr\nuxt.config.ts:56` |
| Apple web-app title | `MBQ` | `@c:\code\musicbizqr\nuxt.config.ts:59` |
| Service worker | `@vite-pwa/nuxt`, `registerType: autoUpdate`, `skipWaiting`, `clientsClaim`, `navigateFallback: ''` | `@c:\code\musicbizqr\nuxt.config.ts:106-127` |
| Page runtime cache regex | hardcodes `musicbizqr.com` | `@c:\code\musicbizqr\nuxt.config.ts:146` |
| Android WebAPK verification | `.well-known/assetlinks.json` (origin-bound fingerprint) | `@c:\code\musicbizqr\public\.well-known\assetlinks.json` |

### ⚠️ PWA origin migration is unavoidable
A PWA is **scoped to its origin**. Moving to `faneqo.com` means:
- Existing installs on `musicbizqr.com` will **not** migrate — service worker, caches, `localStorage`, and the install all stay on the old origin.
- Users must **reinstall** the PWA from `faneqo.com`.
- `assetlinks.json` must be regenerated for the new origin (Chrome mints a new WebAPK package for `faneqo.com`).
- This is expected and low-harm (the app is largely server-backed), but should be communicated.

---

## 4. Complete Inventory of Name/Domain References

### 4.1 Frontend — FUNCTIONAL (must change for correctness)

| File | Line(s) | Current | Change to |
|---|---|---|---|
| `utils/qr.ts` | 11 | `QR_GATEWAY_ORIGIN = 'https://qr.musicbizqr.com'` | `https://qr.faneqo.com` |
| `utils/qr.ts` | 12 | `LEGACY_ORIGIN = 'https://musicbizqr.com'` | keep (legacy reference) |
| `server/middleware/qr-gateway.ts` | 10, 19 | hardcoded `qr.musicbizqr.com` → `musicbizqr.com` | multi-domain (see §5) |
| `server/routes/directqr.ts` | 26, 29, 37, 249 | hardcoded gateway + `https://musicbizqr.com` | multi-domain (see §5) |
| `nuxt.config.ts` | 38 | `baseUrl` default `https://musicbizqr.com` | `https://faneqo.com` (and set `BASE_URL` env) |
| `nuxt.config.ts` | 146 | runtimeCaching regex `musicbizqr\.com` | include `faneqo\.com` (or make scheme/host-agnostic) |
| `nuxt.config.ts` | 227-229 | `site.url`/`site.name`/desc | `https://faneqo.com` / `Faneqo` |
| `nuxt.config.ts` | 241 | sitemap `site` default | `https://faneqo.com` |
| `server/api/admin/repair-all-qrs.post.ts` | 54 | builds `directqr` URL from `baseUrl` | follows `baseUrl` once updated — verify it uses the gateway origin, not base |

### 4.2 Frontend — BRANDING (PWA identity + SEO + copy)

| File | What | Notes |
|---|---|---|
| `public/manifest.webmanifest` | `name`, `short_name`, `description` | New install identity |
| `nuxt.config.ts:59` | `apple-mobile-web-app-title` = `MBQ` | iOS home-screen label |
| `public/.well-known/assetlinks.json` | WebAPK package/fingerprint | Regenerate for `faneqo.com` |
| `pages/index.vue`, `pages/improved-home.vue`, articles, decks, etc. | ~697 brand-copy matches across 171 files | Cosmetic; do in a dedicated copy pass, not part of the functional cutover |

### 4.3 Backend (`qrserver`) — stays on Railway, but has hardcoded frontend URLs

The API origin does **not** change, but several backend strings point at the old **frontend** domain and must be updated (or made env-driven) so redirects/emails/CORS land on `faneqo.com`:

| File | Line | Current | Action |
|---|---|---|---|
| `config/middlewares.js` | 97-98 | CORS `musicbizqr.com`, `www.musicbizqr.com` | **ADD** `faneqo.com`, `www.faneqo.com` (keep old) — **critical or the new frontend's API calls fail** |
| `config/env/production/middlewares.js` | 39-40 | CORS origins | same as above |
| `src/api/stripe/controllers/stripe.js` | 217-218 | `success_url`/`cancel_url` hardcoded `musicbizqr.com` | use `faneqo.com` (prefer env `PUBLIC_APP_URL`) |
| `src/api/auth/controllers/email-confirmation.js` | 40 | redirect `https://musicbizqr.com/dashboard` | `https://faneqo.com/dashboard` |
| `src/api/.../band-page-view/lifecycles.js` | 86 | `PUBLIC_HOSTNAME \|\| 'musicbizqr.com'` | set `PUBLIC_HOSTNAME=faneqo.com` env |
| `src/api/.../event-page-view/lifecycles.js` | 165 | same default | same env |
| `src/api/band/controllers/checkout.js` | 103-104 | uses `PUBLIC_APP_URL` env ✅ | just update Railway env `PUBLIC_APP_URL=https://faneqo.com` |
| `src/api/merch-concierge/controllers/merch-concierge.js` | 133-134 | uses `PUBLIC_APP_URL` ✅ | same env |
| `src/api/stripe/controllers/connect-webhook.js` | 141 | uses `PUBLIC_APP_URL` ✅ | same env |
| `src/api/test-email/...`, email `from` | 13-14, 346 | `noreply@musicbizqr.com` (Resend sender) | needs DNS-verified `faneqo.com` sender in Resend, or keep old sender short-term |
| `src/api/*/policies/only-one-*.js` | — | `partner@musicbizqr.com` allowlist email | low priority; update if that mailbox moves |

**Backend env vars to set on Railway:** `PUBLIC_APP_URL=https://faneqo.com`, `PUBLIC_HOSTNAME=faneqo.com` (+ CORS code change above).

---

## 5. Recommended Code Change: make gateway logic multi-domain

Rather than swap one hardcoded host for another (which would instantly kill old QRs), generalize so **both** old and new gateways work during and after migration.

**`utils/qr.ts`** — new QRs use the new gateway:
```ts
const QR_GATEWAY_ORIGIN = 'https://qr.faneqo.com'   // new QRs
const LEGACY_ORIGINS = ['https://qr.musicbizqr.com', 'https://musicbizqr.com'] // still resolve
```

**`server/middleware/qr-gateway.ts`** — treat any `qr.` host as a gateway, redirect non-scan traffic to the *current* main domain:
```ts
const MAIN_ORIGIN = 'https://faneqo.com'
if (host.startsWith('qr.')) {              // qr.faneqo.com OR qr.musicbizqr.com
  if (url.startsWith('/directqr')) return
  return sendRedirect(event, `${MAIN_ORIGIN}${url}`, 302)
}
```

**`server/routes/directqr.ts`** — gateway detection by prefix, destinations always go to the new main origin:
```ts
const isQrGateway = host.startsWith('qr.')   // works for both old + new
const targetOrigin = isQrGateway ? 'https://faneqo.com' : `${reqUrl.protocol}//${reqUrl.host}`
// also update the two hardcoded fallback redirects (lines ~37, ~249) to faneqo.com
```

**Net effect:** an old sticker → `qr.musicbizqr.com/directqr?id=42` → (DNS still points at the app) → resolves and **302s to `faneqo.com/{slug}`**. A new sticker → `qr.faneqo.com/directqr?id=99` → same handler → `faneqo.com/{slug}`. Nothing breaks.

---

## 6. DNS / Hosting Prerequisites (outside the codebase)

These are the make-or-break infra steps; do them **before** flipping code defaults:

1. **Register & attach `faneqo.com`** and **`qr.faneqo.com`** to the Nuxt deployment (same host that serves musicbizqr today).
2. **Keep `musicbizqr.com` and `qr.musicbizqr.com` attached to the same deployment** (do NOT release them). They must keep serving `/directqr` forever for legacy QRs.
3. Valid TLS certs for all four hostnames.
4. Cloudflare (the geo headers `cf-ipcountry` etc. in `directqr.ts` depend on it) must front all four hostnames so scan analytics keep working.
5. Update backend Railway envs: `PUBLIC_APP_URL`, `PUBLIC_HOSTNAME`, and add `faneqo.com` to CORS.
6. Resend: verify `faneqo.com` sending domain if you want `@faneqo.com` emails (otherwise keep `@musicbizqr.com` sender temporarily).
7. OAuth/redirect URIs (Google `CORVANA_GOOGLE_REDIRECT_URI`, Stripe) — add `faneqo.com` callback URLs where applicable.

---

## 7. Phased Rollout Plan (safe order)

**Phase A — Infra (no code):** attach all 4 domains, certs, Cloudflare, keep old domains live. Verify `https://qr.faneqo.com/directqr?id={knownId}&debug=1` returns JSON once code is deployed.

**Phase B — Backend env + CORS:** add `faneqo.com` to CORS, set `PUBLIC_APP_URL`/`PUBLIC_HOSTNAME`, update the two hardcoded backend URLs (`stripe.js`, `email-confirmation.js`). Deploy. *(Old frontend still works.)*

**Phase C — Frontend functional cutover:** make `qr-gateway.ts` / `directqr.ts` multi-domain, update `utils/qr.ts` gateway origin, `nuxt.config.ts` `baseUrl` + `site` + runtimeCaching regex. Deploy to `faneqo.com`. *(Old QRs redirect to faneqo; new QRs encode `qr.faneqo.com`.)*

**Phase D — PWA identity:** update `manifest.webmanifest` name/short_name/description, `apple-mobile-web-app-title`, regenerate `assetlinks.json`. Announce reinstall.

**Phase E — Branding copy pass:** the ~697 cosmetic references across pages/articles/decks. Non-urgent.

**Phase F — Redirect old → new (optional, after stable):** consider 301-redirecting `musicbizqr.com/*` (non-`/directqr`) to `faneqo.com/*` for SEO consolidation. **Never** 301 `/directqr` away from a working handler.

---

## 8. Test Matrix (must pass before/after each phase)

| Test | Command / Action | Expected |
|---|---|---|
| Legacy main QR | `curl -I https://musicbizqr.com/directqr?id={id}` | `302` → `https://faneqo.com/{slug}` |
| Legacy subdomain QR | `curl -I https://qr.musicbizqr.com/directqr?id={id}` | `302` → `https://faneqo.com/{slug}` |
| New subdomain QR | `curl -I https://qr.faneqo.com/directqr?id={id}` | `302` → `https://faneqo.com/{slug}` |
| Debug resolve | open `…/directqr?id={id}&debug=1` | JSON with correct `destination` |
| Band page | open `https://faneqo.com/{slug}` | renders, no SW errors |
| Scan analytics | scan a real QR | new `scans` record with geo/UTM |
| New QR create | create QR in dashboard | `options.data` = `https://qr.faneqo.com/directqr?id=…` |
| API/CORS | load dashboard on `faneqo.com` | Strapi calls succeed (no CORS error) |
| Payments | run a support checkout | `success_url` lands on `faneqo.com/{slug}/support/receipt` |
| PWA install | install on `faneqo.com` | installs; scanning a QR still opens browser, not PWA |
| `sw.js` | open `https://faneqo.com/sw.js` | no `/offline`, no nav route error |

---

## 9. Risk Register

| Risk | Severity | Mitigation |
|---|---|---|
| Old domains released/expire → all legacy QRs die | **Critical** | Keep `musicbizqr.com` + `qr.musicbizqr.com` attached & renewed indefinitely |
| CORS not updated → new frontend can't call API | High | Phase B before Phase C |
| Hardcoded gateway host left as single value | High | Multi-domain logic (§5) |
| Stripe success/cancel still point at old domain | Medium | Update `stripe.js` + `PUBLIC_APP_URL` |
| Existing PWA installs don't migrate | Medium | Expected; prompt users to reinstall |
| Cloudflare not fronting new hosts → geo lost | Medium | Front all 4 hosts via Cloudflare |
| Email deliverability on new sender domain | Medium | Verify Resend domain or keep old sender |
| `assetlinks.json` stale for new origin | Low | Regenerate after install |

---

## 10. Quick Reference — Files To Touch (functional only)

```
Frontend (musicbizqr → faneqo):
  utils/qr.ts                         # gateway origin (new QRs)
  server/middleware/qr-gateway.ts     # multi-domain gateway redirect
  server/routes/directqr.ts           # multi-domain detection + targetOrigin + fallbacks
  nuxt.config.ts                      # baseUrl, site.url/name, sitemap, runtimeCaching regex, apple title
  public/manifest.webmanifest         # name/short_name/description
  public/.well-known/assetlinks.json  # regenerate for faneqo origin

Backend (qrserver — Railway domain unchanged):
  config/middlewares.js               # CORS + faneqo.com
  config/env/production/middlewares.js# CORS + faneqo.com
  src/api/stripe/controllers/stripe.js# success_url/cancel_url
  src/api/auth/controllers/email-confirmation.js # dashboard redirect
  src/api/*/content-types/*/lifecycles.js        # PUBLIC_HOSTNAME default
  Railway env: PUBLIC_APP_URL, PUBLIC_HOSTNAME, (Resend sender)
```

---

*End of audit — 2026-06-22.*
