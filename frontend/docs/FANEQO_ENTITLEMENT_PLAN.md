# Faneqo Free vs Pro entitlement — implementation plan

**Status: PROPOSAL. Not approved. No code written.**

Scope: a centralized, backend-first entitlement system so a Free artist gets login, one
artist page, and one featured track, while Pro gets full artist capabilities — and so
white-glove operators keep full access without Stripe through an explicit durable grant.

Audit basis: 483 backend routes (`qrserver`), 166 frontend pages and 39 Nuxt server
routes (`musicbizqr`), read on 2026-09-12.

---

## 0. The three findings that shape everything

**1. `plan === 'free'` already means "billing-exempt lifetime full Pro".**
`qrserver/src/utils/billing/artistEntitlement.js` grants ambassador Pro when
`user.plan === 'free'` OR `user.subscriptionStatus === 'free'`, and its own header warns:
*"Do not reuse plan=free later for a limited free artist product."* The new Free tier must
therefore be **the absence of a Pro entitlement**, never a value written into `plan`.

**2. A durable, explicit grant system already exists and is well built.**
`api::feature-enrollment` + `src/utils/features/` gives us rows of
`featureKey · subjectType(platform|user|band|cohort) · subjectId · status(enabled|disabled) ·
startsAt · endsAt · grantedBy · cohort · metadata`, with pure resolution in
`resolveFeatures.js` that is time-windowed, deny-wins, and fails closed when the query
truncates. This is exactly the "explicit durable entitlement/admin-grant mechanism"
required. **We extend it. We do not build a second one.**

**3. Almost nothing is enforced today.**
`global::subscription-active` is attached to **6 routes only**: create/update/delete on
`/bands` and `/qrs`. Show mode, events, messaging, campaigns, analytics, galleries, fan
list, fan export, recaps, payments onboarding, and all media content types have **no
billing gate at all**. 168 backend routes are `auth: false` and authorize by hand inside
controllers, so a route-policy-only design cannot work.

---

## 1. Current authorization and billing fields

### 1.1 Billing fields on the user (`users-permissions.user` schema)

| Field | Type | Default | Meaning today |
|---|---|---|---|
| `subscriptionStatus` | enum | `unpaid` | `active`, `trialing`, `pastDue`, `canceled`, `unpaid`, `past_due`, `free` |
| `plan` | string | — | **`'free'` = ambassador lifetime Pro** |
| `customerId` | string | — | Stripe customer |
| `subscriptionId` | string | — | Stripe subscription |
| `trialEndsAt` | date | — | Trial expiry |
| `gracePeriodStart` | date | — | Start of 3-day past-due grace |
| `cancelAt` | date | — | Scheduled cancellation |
| `editorialShowcaseAccess` | boolean | `false` | Unrelated editorial flag |

### 1.2 How access is decided today

`src/policies/subscription-active.js` allows: `active`, `trialing`,
`pastDue` within 3 days of `gracePeriodStart`, `canceling` before `cancelAt`, or
billing-exempt. Everything else → 403.

Band access is separate and correct: `src/utils/bandRoles.js` resolves a role from an
active `band-member` row, falling back to legacy `band.users_permissions_user` ownership.

| Permission | owner | manager | viewer |
|---|---|---|---|
| `editBand`, `manageEvents`, `manageQrs`, `viewAnalytics`, `operateShowMode` | yes | yes | read |
| `manageTeam`, `manageBilling`, `managePayments`, `deleteBand` | yes | no | no |
| `viewFanPII`, `sendFanMessages`, `manageFanList`, `viewFanIntelligence` | yes | no | no |

### 1.3 Frontend state today

No plan gating exists at route level. `middleware/auth.ts` is applied to only ~14 pages;
`/createband`, `/editband/:id`, `/createqr`, `/editqr/:id`, `/newevent`, `/editevent/:id`,
`/analytics/:id`, `/analyticsqr/:id`, `/event-analytics/:eventId` have **no auth middleware
at all** and rely on API calls failing. Limits are hardcoded in
`pages/dashboard/index.vue` (1 artist page, 10 QR codes) with an email whitelist bypass.
There is no pricing or checkout page; the only upgrade path is the Stripe billing portal,
and `components/TrialReminder.vue` links to `/account/billing`, which does not exist.

### 1.4 Inconsistencies to fix before tier resolution can be trusted

These are small but they sit directly under the new gate:

- `subscriptionStatus` enum contains **both** `pastDue` and `past_due`; the policy only
  tests `pastDue`, so a row written as `past_due` is silently denied.
- The policy tests `canceling`, which is **not in the enum** — a dead branch.
- Two different status mappers exist: `qrserver` `normalizeSubscriptionStatusForUserRow`
  (`past_due` → `pastDue`) and `musicbizqr` `mapStripeStatusForUserRow` (unknown → `unpaid`).
- `api::qr.only-one-qr` allows one QR per user; the dashboard advertises ten.

---

## 2. Smallest safe data model

**No new table. No new user columns. Two new feature keys.**

Add to `qrserver/src/utils/features/featureKeys.js`:

| Key | Subject scope | Meaning |
|---|---|---|
| `artist_pro` | **band** | This band has full Pro capabilities, regardless of Stripe |
| `white_glove_operator` | **user** | This human is staff/ambassador: exempt from band-count limits and never gated by their own billing state |

Two keys, not twelve, because capability breadth is a *product* decision that belongs in
pure code, not in database rows. Rows answer "who is granted"; code answers "what Pro means".

### 2.1 Tier resolution (new, pure + one query)

`resolveBandTier({ bandGrantRows, ownerBilling, now })` → `'pro' | 'free'`, precedence:

1. `artist_pro` **band** row, status `disabled`, active window → `free` (admin demotion wins)
2. `artist_pro` **band** row, status `enabled`, active window → `pro` (white-glove; no Stripe)
3. Owner billing passes `subscription-active` evaluation → `pro`
4. Otherwise → `free`

Tier is a property of the **band**, not of the acting user. This is the load-bearing
decision: Kevin managing someone else's band must not gate on *his* billing, and an
artist's own lapsed card must not be rescued by a manager who happens to be paying.

Deliberately **not** reused: the resolver's existing "user enable OR band enable grants"
path for band-scoped keys. Granting `artist_pro` to a user would silently upgrade every
band that user can see. White-glove access is therefore granted per assigned band.

### 2.2 Capability map (new, pure, frozen)

`capabilitiesForTier(tier)` → a frozen object. Free baseline, exactly as specified:

| Capability | Free | Pro |
|---|---|---|
| `auth.login` | yes | yes |
| `profile.pages` (limit) | 1 | per grant / allowlist |
| `media.featured_track` (limit) | 1 | unlimited |
| `media.featured_video` | no | yes |
| `media.albums`, `media.videos`, `media.streams` | no | yes |
| `qr.manage` | no | yes |
| `events.manage` | no | yes |
| `analytics.view` | no | yes |
| `fans.list`, `fans.intelligence` | no | yes |
| `messaging.campaigns`, `messaging.inbox` | no | yes |
| `galleries.manage` | no | yes |
| `show_mode.operate` | no | yes |
| `recaps.manage` | no | yes |
| `payments.fan_support` | no | yes |
| `external_intelligence` | no | yes |

### 2.3 Audit trail

Every grant carries `grantedBy` and `metadata`. Migration-created rows get
`grantedBy: 'migration:plan_free'` plus the legacy source value, so a white-glove grant is
always explainable months later. Time-boxed comps use `endsAt` — already supported.

---

## 3. Backend-first enforcement map

Three enforcement shapes are required, because one is not enough:

- **(A) Route policy** — `global::entitled` with config `{ capability, band: 'param'|'body'|'query' }`,
  for routes where Strapi resolves `ctx.state.user`.
- **(B) Controller assertion** — `entitlementService.assertCapability(capability, { bandId, userId })`
  for the 168 `auth: false` routes that verify JWTs by hand.
- **(C) Field/response filtering** — for endpoints Free users legitimately reach but whose
  *payload* must be trimmed. Unavoidable: a Free artist must be able to `PUT /bands/:id` to
  edit their one page and one track, so the gate lives on the `singlevideo` field, not the route.

### 3.1 Write enforcement

| Capability | Endpoints | Shape |
|---|---|---|
| `qr.manage` | `POST/PUT/DELETE /qrs` (replace `subscription-active`) | A |
| `qr.manage` | `PUT /qrs/:id/fix-band/:bandId` — **currently a public write** | B + close |
| `events.manage` | `POST/PUT/DELETE /events`; `/api/tours` CRUD | A |
| `show_mode.operate` | `POST /bands/:id/show-mode/{manual,from-event,deactivate,activate-now}`, `PATCH .../timing` | A |
| `galleries.manage` | `POST /artist-updates`, `POST /artist-updates/media`, `PATCH .../{hide,restore,visibility,detach-recap}` | B |
| `galleries.manage` | `/api/moments`, `/fan-moments/*` writes | A/B |
| `messaging.campaigns` | `POST /message-campaigns`, `/preview`, `POST /show-recaps/:id/message` | A |
| `messaging.inbox` | `POST /conversations/*` (artist side only) | B |
| `fans.list` | `POST /fans/add`, `/fans/import`, `/fans/:fanId/remove-from-list` | A |
| `recaps.manage` | `POST /show-recaps`, `POST /show-recaps/generate`, `PATCH /show-recaps/*` | A |
| `payments.fan_support` | `POST /bands/:id/payments/onboard` | A |
| `payments.fan_support` | `POST /bands/:id/payments/checkout`, merch-concierge checkout — **public fan-facing** | B, gated on band tier |
| `media.*` | `/api/albums`, `/api/videos`, `/api/streams`, `/api/socialpages` CRUD | A |
| `media.featured_video` | `PUT /bands/:id` → reject `singlevideo` for Free | **C** |
| `profile.pages` | `POST /bands` — replace `only-one-band` email allowlist with `white_glove_operator` + limit | A |
| `external_intelligence` | `band-external-account`, `band-external-metric` — **currently public writes** | B + close |

### 3.2 Read enforcement

| Capability | Endpoints | Shape |
|---|---|---|
| `analytics.view` | `GET /analytics/dashboard-glance` | A |
| `analytics.view` | ~17 **public** analytics GETs (`/analytics/rollups`, `/geo`, `/geo-states`, `/pulse`, `/transitions`, `/follows`, `/qr-*`, `/event-*`) — today unauthenticated **and** ungated | B + band scoping |
| `fans.list` | `GET /fans/my-fans`, `/my-fans-analytics`, `/fans/:fanId/detail`, `/fans/export` | A |
| `fans.intelligence` | `GET /artist-fan-relationships/:fanId`, `/fan-interactions/{breakdown,recent,session}/:bandId` | A/B |
| `recaps.manage` | `GET /show-recaps/*` (artist views) | A |
| `show_mode.operate` | `GET /bands/:id/show-mode` | A |
| `media.featured_video` | `GET /bands/slug/:slug`, `GET /bands/:id`, `GET /bands` → strip `singlevideo` when band tier is Free | **C** |
| — | `GET /me/entitlements` (**new**) → `{ tier, capabilities, limits, grant }` | new |

### 3.3 Fan-facing reads stay open

Public pages already published must keep serving after a downgrade:
`GET /:bandSlug`, `GET /public/bands/:bandSlug/nights/:nightSlug`,
`GET /public/bands/:bandSlug/galleries/:gallerySlug`, `GET /qrs/lookup`, and the
`directqr` gateway. A fan scanning a sticker on a merch table must never hit a dead end
because the artist's card expired. Downgrade blocks **creation and editing**, never
resolution of links a fan already holds.

### 3.4 Background jobs

- Nightly Stripe reconciliation (`config/cron-tasks.js`) already skips billing-exempt
  users; it must also skip bands holding an `artist_pro` grant so it can never write a
  status that contradicts an explicit grant.
- Campaign worker must re-check `messaging.campaigns` at send time, not only at enqueue
  time, or a lapsed artist keeps sending from a queued campaign.
- Analytics daily rollup may keep computing for all bands (cheap, and it preserves the
  data that makes upgrading attractive). Only *serving* is gated.

### 3.5 Failure semantics

`assertCapability` denies with **403 + `{ error: 'entitlement_required', capability }`** so
the frontend can route to a specific upgrade prompt. Note this differs from the existing
`featureService.assertFeature`, which throws 404 to hide unreleased Labs features — correct
for secret features, wrong for a paywall the user must be able to act on. Enrollment query
failure or truncation → deny (inherited fail-closed behavior).

---

## 4. Frontend UX states and upgrade prompts

### 4.1 One server-derived source of truth

New `composables/useEntitlements.ts`, modeled on the existing `useLabsFeatures`, reads
`GET /me/entitlements?bandId=` and exposes `tier`, `can(capability)`, and `limits`. The
browser must never derive tier from `plan` or `subscriptionStatus` — those fields stay for
billing *display* only (`pages/account.vue`, trial banners).

### 4.2 Prerequisite: close the route-guard gap

Nine artist tool routes currently have no `auth` middleware. Add `auth` first, then layer
`middleware/entitled.ts` used as
`definePageMeta({ middleware: ['auth', 'entitled'], entitlement: 'analytics' })`.
Entitlement middleware without auth middleware is meaningless.

### 4.3 Locked-state pattern

Hiding Pro features makes Free feel broken and kills upgrades. Show the feature's real
shape, locked:

| Surface | Free state |
|---|---|
| Nav (`utils/ui/appShell.js`, `MobileBottomNav.vue`, `Header.vue`) | Item visible with lock affordance; tapping opens upgrade sheet, not a 404 |
| `/analytics/:id` | Real chart chrome, blurred series, one-line value statement, upgrade CTA |
| `/fans` | **"You have 143 fans waiting."** Count only, zero PII, upgrade CTA |
| `/messages` | Composer disabled with inline reason; existing threads readable |
| `/galleries`, `/show-live`, `/fans/recaps` | Empty-state explaining the outcome, not the restriction |
| `/createqr`, `/newevent` | Blocked at entry with upgrade sheet |
| `/editband/:id` | Featured video slot visible and locked; featured track fully editable |
| `/dashboard` | Limits come from `limits`, replacing hardcoded 1-band/10-QR and the email whitelist |
| Any `/fan/*` or public page | **Never** shows tier, locks, or upgrade prompts |

The fan-count pattern is the strongest upgrade lever available: it proves value the artist
already earned without leaking a single fan identity.

### 4.4 Upgrade surface

Build the missing `/upgrade` page, deep-linkable as `/upgrade?capability=analytics` so the
copy can name what the artist was reaching for. Delete or repoint
`components/TrialReminder.vue` (dead link to `/account/billing`, never mounted). Trial-end
messaging changes from "your access has ended" to "you're on Free — here's what's paused",
which is the whole point of this change.

---

## 5. Migration behavior

Rule for the entire migration: **additive only. No user data is deleted, unpublished, or
detached, and no fan-facing URL stops resolving.**

| Cohort | Detection | Behavior |
|---|---|---|
| **Paid / active** | `subscriptionStatus` in `active`, `pastDue`+grace, `canceling`+`cancelAt` | Pro via billing. No rows written. No visible change. |
| **Trialing** | `trialing` + `trialEndsAt` future | Pro during trial. **On expiry, lands on Free instead of being hard-blocked** — the product change being made here. |
| **Ambassador / white-glove** | `plan === 'free'` OR `subscriptionStatus === 'free'` | Backfill `white_glove_operator` (user) + `artist_pro` (per owned/managed band), `grantedBy: 'migration:plan_free'`. **Dual-read** during transition: tier resolution honors both the legacy field and the new grant. `plan` is not cleared in the same deploy. |
| **Email-allowlisted multi-band** | `only-one-band.js` hardcoded list | Convert to explicit `white_glove_operator` grants, then delete the hardcoded array. |
| **Legacy no-Stripe, no grant** | `unpaid`/empty, no `customerId` | Becomes Free. |
| **Over-limit on downgrade** | Free user with >1 band or >0 QRs | Nothing is deleted. Existing bands and QRs stay published and keep resolving; **writes are blocked**; the dashboard marks one band as the active Free page and offers a chooser. |
| **Fan accounts** | Fan session, not artist user | Out of scope. Fan surfaces have no tier. |

### 5.1 Ordering

1. Fix the status-enum inconsistencies in §1.4 (tier resolution depends on them).
2. Ship feature keys + pure resolver + capability map + tests. No enforcement yet.
3. Run the ambassador/allowlist backfill in **audit/dry-run mode**, review the row list by
   hand, then apply. Backfill must be idempotent.
4. Ship `GET /me/entitlements` and the frontend `useEntitlements` in **observe-only** mode:
   log what *would* be denied, deny nothing.
5. Review the observed denial log for false positives — this is the step that protects real
   artists from a bad capability map.
6. Enable backend enforcement, capability by capability, starting with the lowest-traffic
   surfaces.
7. Enable frontend locked states.
8. Only after a full billing cycle with no anomalies: stop reading `plan === 'free'`.

Backend enforcement must precede frontend locking, never the reverse. Frontend visibility
is not authorization.

---

## 6. Focused tests needed

**Pure (`qrserver/src/utils/features/`, `musicbizqr/utils/`)**
- Capability map: Free grants exactly login + 1 page + 1 track; every other capability false.
- Tier precedence: band `disabled` beats band `enabled` beats owner billing.
- Window handling: future `startsAt` and past `endsAt` do not grant.
- A `white_glove_operator` user grant alone does **not** upgrade an arbitrary band.
- Owner billing statuses map correctly, including both `pastDue` and `past_due`.

**Backend behavior**
- Every route in the §3 map: 403 `entitlement_required` for Free, 200 for Pro.
- Band-scoped isolation: one operator, band A granted and band B not, in a single request session.
- White-glove operator with `unpaid` billing and no Stripe customer retains full access to
  assigned bands.
- `PUT /bands/:id` from a Free band rejects `singlevideo` and still accepts `singlesong`.
- `GET /bands/slug/:slug` strips `singlevideo` for a Free band and keeps it for Pro.
- Downgraded band: public page, public night page, public gallery, and QR resolution all
  still return 200.
- Enrollment query truncation or error denies rather than grants.
- Campaign worker re-checks entitlement at send time.
- Reconciliation cron never overwrites an explicit `artist_pro` grant.
- Backfill is idempotent and writes `grantedBy`.

**Frontend**
- `entitled` middleware redirects to `/upgrade?capability=…` and never renders gated content.
- Every one of the nine currently unguarded artist routes requires auth.
- Locked `/fans` renders a count and zero PII.
- Dashboard limits come from the server; no hardcoded `1`/`10`; no email whitelist.
- No `/fan/*` or public page renders tier, lock, or upgrade UI.

**Regression already in place**
- `scripts/test-confirm-social-security.mjs` asserts unpaid, past-due, canceled, and
  expired-trial users can still authenticate. Login must never become a Pro capability.

---

## 7. Decisions needed before implementation

1. **Fan capture on Free.** The public smart link collects fans. Free has no fan list.
   Recommend: **keep collecting**, store normally, hide behind the lock, and surface the
   count as the upgrade lever. Alternative is to stop collecting, which destroys the
   artist's own audience data and removes the reason to upgrade.
2. **Featured video on downgrade.** Recommend: preserve the stored value, strip it from
   public reads while Free, restore automatically on upgrade. No data loss, honest gate.
3. **Over-limit bands.** Recommend read-only preservation plus an artist-chosen active page.
   Confirm this over "artist must delete down to one".
4. **Basic analytics on Free.** The spec says no analytics. Confirm that includes even a
   lifetime page-view count, or whether a single vanity number stays visible.
5. **Messaging history on Free.** Recommend existing threads stay readable, new sends
   blocked. Confirm.

---

## 8. Explicitly out of scope

Fan-side entitlements; Stripe Connect payout logic; pricing changes; the `feature-enrollment`
admin UI; any refactor of `bandRoles.js`; and the unauthenticated-endpoint hardening noted
during the audit (`POST /api/admin/reset-user-password`, `PUT /qrs/:id/fix-band/:bandId`,
public `band-external-*` writes, public analytics reads). Those are security work, tracked
separately, and several of them are more urgent than this plan.
