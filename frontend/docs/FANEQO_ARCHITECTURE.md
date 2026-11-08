# Faneqo Architecture

> Repository map for the Nuxt frontend (`musicbizqr`).  
> Brand: **Faneqo** (Fan Echo) — premium, music-first smart links, QR, fan relationships, and analytics for artists and bands.
>
> This file is the **frontend repo map** (routes, QR, auth, PWA, payments). Product design, roadmap, live phase, and handoff live in [`FANEQO_DESIGN_NORTH_STAR.md`](FANEQO_DESIGN_NORTH_STAR.md), [`FANEQO_MASTER_PRODUCT_ROADMAP.md`](FANEQO_MASTER_PRODUCT_ROADMAP.md), [`FANEQO_CURRENT_PHASE.md`](FANEQO_CURRENT_PHASE.md), and [`FANEQO_NEXT_AGENT_HANDOFF.md`](FANEQO_NEXT_AGENT_HANDOFF.md). Those four override conflicting historical guidance in this file. Architecture invariants stay in [`FANEQO_RELATIONSHIP_PLATFORM.md`](FANEQO_RELATIONSHIP_PLATFORM.md).

---

## 1. Overview

### Product role
Faneqo helps artists:
- Create polished artist profile and smart-link pages
- Connect fans to music, videos, websites, socials, and events
- Create and manage dynamic QR codes
- Track page views, QR scans, clicks, song plays, and video plays
- Receive fan payments and support
- Manage events and understand fan engagement

**Positioning:** Bands don't need more links. They need fans.

### This repository
This workspace is the **Nuxt 3 SSR frontend** and **Nitro BFF layer**. Business data, webhooks, and most API logic live in a separate **Strapi v4 backend** (often at `C:\code\qrserver` — not verified from this repo alone).

```
Browser / QR scan
    → faneqo.com | musicbizqr.com | qr.faneqo.com | qr.musicbizqr.com
    → Nuxt SSR + Nitro server routes
    → Strapi v4 API
    → Stripe (subscriptions + Connect) | Firebase (Google auth) | Resend (contact)
```

---

## 2. Domain map

| Domain | Role |
|--------|------|
| `https://faneqo.com` | Canonical frontend (`BASE_URL` default) |
| `https://musicbizqr.com` | Legacy frontend — must keep working |
| `https://qr.faneqo.com` | New QR gateway |
| `https://qr.musicbizqr.com` | Legacy QR gateway — printed QRs depend on it |

**Golden rule for QRs:** Existing printed URLs must never be bulk-rewritten. Edit preserves stored gateway URL; only new QRs use `qr.faneqo.com` by default (`utils/qr.ts`).

---

## 3. Repository layout

| Path | Purpose |
|------|---------|
| `pages/` | File-based routes (marketing, dashboard, artist pages, admin) |
| `components/` | Vue components (band templates, QR, dashboard, marketing) |
| `composables/` | Shared logic (auth helpers, analytics, PWA, fans, share) |
| `server/` | Nitro API routes, middleware, utilities |
| `stores/` | Pinia (`agencyPortal.js` — minimal usage) |
| `plugins/` | Chart.js, Firebase, FontAwesome, PWA, meta pixel, etc. |
| `middleware/` | `auth.ts`, marketer, agency noindex |
| `utils/` | QR helpers, SEO, shareables |
| `layouts/` | `default`, `agency`, `corvana` |
| `assets/css/` | Global Tailwind + legacy utility classes |
| `public/` | Manifest, icons, splash screens, static assets |
| `docs/` | Feature and incident documentation |

---

## 4. Runtime configuration

Configured in `nuxt.config.ts` → `runtimeConfig`. **Never commit secrets.**

### Server-only (examples)
| Key | Purpose |
|-----|---------|
| `stripeSecretKey` | Stripe API (subscriptions) |
| `stripeDefaultPriceId` | Default subscription price |
| `strapiApiToken` | Server-side Strapi admin calls |
| `resendKey` | Contact form email |
| `gaPropertyId` / `gaServiceAccountJson` | Google Analytics Data API |
| `corvanaGoogle*` | Corvana SEO / Search Console OAuth |

### Public
| Key | Purpose |
|-----|---------|
| `public.strapiUrl` | Strapi base URL |
| `public.baseUrl` | Site URL (default `https://faneqo.com`) |
| `public.stripe.key` | Stripe publishable key |

### Typical env vars (names only)
```bash
STRAPI_URL=
STRAPI_API_TOKEN=
BASE_URL=
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_DEFAULT_PRICE_ID=
RESEND_API_KEY=
CONTACT_TO=
CONTACT_FROM=
```

No `.env.example` is checked into this repo as of onboarding audit.

---

## 5. Routing map

### Marketing & content
| Route | File | Notes |
|-------|------|-------|
| `/` | `pages/index.vue` | Faneqo homepage, `layout: false` |
| `/signup`, `/login` | `pages/signup.vue`, `pages/login.vue` | Auth + trial |
| `/article/**` | `pages/article/**` | SEO hub from Strapi |
| `/contact` | `pages/contact.vue` | → Resend via Nitro |

### Authenticated artist tools (`middleware: 'auth'`)
| Route | Purpose |
|-------|---------|
| `/dashboard` | Bands, QRs, billing, show mode |
| `/createband`, `/editband/[id]` | Profile editor + Stripe Connect |
| `/createqr`, `/editqr/[id]` | QR CRUD |
| `/analytics/[id]`, `/analyticsqr/[id]` | Analytics |
| `/fans` | Fan list |
| `/account` | Account + subscription |

### Public fan-facing
| Route | Purpose |
|-------|---------|
| `/:bandSlug` | Artist smart-link page (multiple templates) |
| `/:bandSlug/event/:eventSlug` | Event page |
| `/:bandSlug/support/receipt` | Payment receipt |
| `/share/**` | Share surfaces |

### QR resolution
| Path | Handler |
|------|---------|
| `/directqr` | `server/routes/directqr.ts` |
| Gateway middleware | `server/middleware/qr-gateway.ts` |

### Internal / legacy
| Area | Routes |
|------|--------|
| Agency portal | `/agency/**` |
| Corvana SEO | `/corvana/**` |
| Admin | `/admin`, `/admin/repair-qrs` |
| Legacy | `/oldpages/**`, test pages |

---

## 6. Data fetching patterns

1. **Strapi module** — `useStrapi()`, `useStrapiAuth()`, `useStrapiUser()` for authenticated CRUD.
2. **Direct `$fetch`** — composables and pages call `{strapiUrl}/api/...`.
3. **Nitro BFF** — sensitive or cross-service logic in `server/api/` (e.g. social signup, band-view tracking, contact).
4. **Custom Strapi endpoints** — e.g. `/api/qrs/lookup`, `/api/scans/track`, `/api/fan-interactions/track`, `/api/user-admin/*`.

Canonical source of truth for persisted data is **Strapi**, not local state.

---

## 7. Authentication

| Flow | Path |
|------|------|
| Email/password login | Strapi `useStrapiAuth().login()` → `/dashboard` |
| Email/password signup | `useSignup()` → Strapi `/api/stripe/register` |
| Google OAuth | Firebase popup → `/api/stripe/confirm-social` → Strapi JWT |
| Route guard | `middleware/auth.ts` — redirects unauthenticated users to `/` |
| Token cookie | Strapi JWT via `@nuxtjs/strapi` (`strapi_jwt`) |

Firebase config: `plugins/firebase..ts` (project id still references legacy `musicbizqr-f3261`).

---

## 8. Payments

### Subscriptions (platform billing)
- **Not** the same as artist payouts.
- Trial: 30 days via `server/utils/stripe-trial.ts`.
- Strapi endpoints: `/api/stripe/register`, `/stripe/billing`, `/stripe/subscription-status`, `/stripe/create-billing-portal-session`.
- UI: `pages/account.vue`, `pages/dashboard.vue`, `PastDueBanner`, `TrialBanner`.
- Webhooks: documented as handled by **Strapi backend**, not this repo.

### Stripe Connect (artist payouts)
- Strapi: `POST /api/bands/:id/payments/onboard` → Stripe onboarding URL.
- UI: `pages/editband/[id].vue`, `pages/dashboard.vue`.
- Band page gates payments on `stripeOnboardingComplete` / `paymentsEnabled`.

**Do not combine subscription logic with Connect payout logic.**

---

## 9. QR system

### Creation
- Dashboard → `createqr` / `editqr`
- Encoded URL for new QRs: `getEncodedQrUrl()` → `https://qr.faneqo.com/directqr?id={id}`
- Components: `QrCode.client.vue`, `EditQrCode.client.vue`, `downloadQr.client.vue`

### Resolution (`server/routes/directqr.ts`)
1. Detect gateway host (`qr.faneqo.com` | `qr.musicbizqr.com`)
2. Lookup QR via Strapi `/api/qrs/lookup`
3. Log scan via `/api/scans/track`
4. Set cookie `mbq_qr_src` (10 min) for page-view attribution
5. Redirect by `q_type`: `bandProfile`, `externalURL`, `events`, or AR

### Gateway middleware
Non-`/directqr` requests on gateway hosts → redirect to `https://faneqo.com`.

### Documentation
See also: `docs/QR-SYSTEM.md`, `docs/QR-QUICK-REFERENCE.md`, `docs/PWA-QR-INCIDENT-AUDIT.md`.

---

## 10. Analytics pipeline

| Event | Path |
|-------|------|
| QR scan | Strapi `/api/scans/track` (from `directqr`) |
| Band page view | Client → Nitro `/api/track/band-view` → Strapi `band-page-views` |
| Fan interactions | `useFanInteractionTracker` → `/api/fan-interactions/track` |
| Dashboard charts | `/analytics/[id]` — Chart.js / ECharts + Strapi data |
| Client helper | `useAnalytics.js` (console logging wrapper) |

QR attribution: `mbq_qr_src` cookie read in `band-view.post.ts`, then cleared.

---

## 11. PWA

- Module: `@vite-pwa/nuxt`
- Manifest: `public/manifest.webmanifest` (`manifest: false` in module config)
- `registerType: 'autoUpdate'`, `navigateFallback: ''` (offline SPA fallback disabled intentionally)
- Runtime cache: pages on `faneqo.com` and `musicbizqr.com`; denylist for payments, dashboard, `/directqr`, receipts
- Composables/components: `usePwa.js`, `PwaUpdateToast`, `PwaDownloadIndicator`, `pages/install.vue`

**Do not** re-enable broken offline fallback or force-clear caches without a migration plan.

---

## 12. SEO and content

- `@nuxtjs/seo`, `@nuxtjs/sitemap`
- Sitemap built from Strapi `seo-pages`
- Production prerender hook for article routes
- Nitro `routeRules` and `server/middleware/seo-redirects.ts` for 301 consolidation
- Corvana: internal SEO tooling under `/corvana` and `server/api/corvana/**`

---

## 13. Internal subsystems

| Subsystem | Description |
|-----------|-------------|
| **Agency portal** | `/agency/**` — roster/demo tooling for labels (`stores/agencyPortal.js`) |
| **Corvana** | SEO analysis, Search Console exports |
| **Marketer attribution** | `useMarketingAttribution`, ref codes on signup |
| **Show mode** | Live show tools on dashboard and band pages |
| **Shareables** | Fan share moments and kits (partially hidden in dashboard) |

---

## 14. Design system (summary)

Full rules: `.cursor/rules/10-faneqo-design.mdc`

- Dark/near-black backgrounds, high-contrast white type
- Poppins typography; pink→fuchsia→purple and cyan→emerald gradients used selectively
- Reference: `pages/index.vue`, `components/Header.vue`, `components/band/*`

Known legacy UI: `.btn` neon styles, `.mdc-*` forms, `layouts/default.vue` title still says `musicbizqr`.

---

## 15. Rebrand inventory

| Status | Examples |
|--------|----------|
| **Faneqo-complete** | Homepage, header wordmark, manifest, favicons, `nuxt.config.ts` site name |
| **Visible MBQ leftovers** | `layouts/default.vue` title, `pages/login.vue` copy, article SEO URLs, receipt page |
| **Intentional legacy** | QR gateway hosts, `mbq_qr_src` cookie, Firebase project name, PWA dual-domain cache |
| **Uncertain** | Corvana/deck `mbq` naming, README title |

Classify before replacing. Never blind global rename.

---

## 16. High-risk files

| File | Why |
|------|-----|
| `server/routes/directqr.ts` | All QR scans |
| `server/middleware/qr-gateway.ts` | Gateway routing |
| `utils/qr.ts` | New QR URL generation |
| `components/EditQrCode.client.vue` | Must preserve stored URLs |
| `server/api/admin/repair-all-qrs.post.ts` | Bulk QR repair |
| `nuxt.config.ts` (PWA) | Service worker behavior |
| `server/api/stripe/confirm-social.ts` | Signup + Stripe |
| `server/utils/stripe-trial.ts` | Trial creation |
| `pages/[bandSlug]/index.vue` | Public artist + payments |
| `plugins/firebase..ts` | Auth provider |

---

## 17. Build and validation

| Command | Purpose |
|---------|---------|
| `npm run dev` | Development |
| `npm run build` | Production build |
| `npm run start` | Run production server |
| `npm run preview` | Preview build |
| `npm run generate` | Static generation |

- Node: `>=18.20.6` (`package.json`)
- No dedicated `lint` or `typecheck` scripts in `package.json` as of audit
- TypeScript partial; many `.js` composables remain

---

## 18. Related documentation

| Doc | Topic |
|-----|-------|
| `AGENTS.md` | Source precedence, operating loop, safety |
| `docs/FANEQO_CURSOR_OPERATING_SYSTEM.md` | Work modes, signature design loop, rendered evidence, tool doctrine, handoff standard |
| `docs/FANEQO_DESIGN_NORTH_STAR.md` | Design and product doctrine (canonical) |
| `docs/FANEQO_RELATIONSHIP_PLATFORM.md` | Relationship + intelligence platform architecture (canonical) |
| `docs/FANEQO_CURRENT_PHASE.md` | Live phase and production uniqueness status |
| `docs/QR-SYSTEM.md` | QR lifecycle |
| `docs/AUTH-FLOWS.md` | Authentication |
| `docs/PWA.md` | PWA setup |
| `docs/FANS.md` | Fan capture (older MBQ notes; identity truth is the platform doc) |
| `docs/rive.md` | Rive runtime, wrapper, GSAP split, `faneqo-echo.riv` contract |
| `README.md` | Broad project notes (still MBQ-titled in places) |

---

## 19. Open questions (founder confirmation)

1. Canonical Strapi URL and repo location (`qrserver`)?
2. Migrate article SEO canonical URLs to `faneqo.com` or keep `musicbizqr.com`?
3. Is `layouts/default.vue` `musicbizqr` title intentional for SEO?
4. Firebase project rename vs keep legacy id?
5. Corvana and Agency portal — production or internal only?
6. Stripe webhooks — Strapi only?

---

*Last updated: onboarding audit, June 2026.*
