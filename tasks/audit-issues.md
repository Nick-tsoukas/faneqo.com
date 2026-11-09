# Audit issues

Specs for the **44** audit issues. **Plan (central):** [`tasks/audit-issues-plan.md`](audit-issues-plan.md). **Progress:** check ids in [`tasks/audit-issues-todo.md`](audit-issues-todo.md) as each issue resolves.

**Status: not started.** Acceptance criteria below are the done definition for each id. Progress boxes live on the todo; mark criteria here when that issue ships.

**Standing do-nots:** no Stripe amount / trial / Lifetime Pro (`free`) meaning changes; no fan charges or limited Free tier; leave `POST /stripe/confirm-social` unregistered; do not claim YouTube routes are reachable in production; do not publish toy band names; do not invent extra issues from marketing page-scan notes; no GitHub filing unless separately approved; **do not hardcode CORS hosts** in `middlewares.js` (including a one-off staging FE string) — origins come from public-URL env SoT + optional comma-separated extras (`sec-009`); BFF still means browsers should not call Strapi (`sec-006`–`sec-008`).

---

## Inventory

| Id | P | Sev | Effort | Repo | Parent | Title |
|----|---|-----|--------|------|--------|-------|
| `audit-parent` | 0 | High | XL | musicbizqr | — | Draft map: YouTube routes skip the caller, billing rules stay, and marketing is an implementation list |
| `sec-001` | 1 | High | S | qrserver | audit-parent | YouTube connect, sync, and debug routes do not check who is calling |
| `sec-002` | 1 | High | XS | qrserver | audit-parent | User-admin routes accept the general API token when the dedicated secret is missing |
| `sec-005` | 1 | High | S | qrserver | audit-parent | Four Stripe signup routes never say whether the caller must be logged in |
| `sec-006` | 1 | High | XL | musicbizqr | audit-parent | Map: browsers talk to Strapi directly; the API host must stay private behind Nuxt |
| `sec-007` | 1 | High | L | musicbizqr | sec-006 | `public.strapiUrl` and `@nuxtjs/strapi` ship the Strapi host to every browser |
| `sec-008` | 1 | High | XL | musicbizqr | sec-006 | Product traffic still hits Strapi from the browser; Nitro must same-origin proxy it |
| `sec-009` | 1 | High | M | qrserver | sec-006 | Strapi CORS origins are hardcoded; drive them from public-URL env + optional extras |
| `bill-001` | 1 | High | XS | musicbizqr | audit-parent | The value free on an artist account means Lifetime Pro, not a small free plan |
| `data-001` | 1 | High | L | both | audit-parent | Replace musicbizqr / musicbizqr.com with faneqo / faneqo.com in files and DB |
| `dead-004` | 1 | High | S | musicbizqr | audit-parent | Test and internal preview pages are still on the live site |
| `dead-005` | 1 | High | S | musicbizqr | audit-parent | Two local lab pages are missing the production 404 |
| `mkt-001` | 1 | High | XL | musicbizqr | audit-parent | Ongoing list of code changes that gain users and paid subscribers |
| `mkt-002` | 1 | High | S | musicbizqr | audit-parent | Article essays still send the button to musicbizqr.com |
| `mkt-003` | 1 | High | M | musicbizqr | audit-parent | There is no pricing page, and signup is missing from the sitemap |
| `mkt-004` | 1 | High | S | musicbizqr | audit-parent | The article close box still sells smart links |
| `mkt-005` | 1 | High | M | musicbizqr | audit-parent | The trial can end without a subscribe prompt on the dashboard |
| `mkt-006` | 1 | High | M | musicbizqr | audit-parent | Connect payment buttons stay off, and the artist is not told when a fee applies |
| `mkt-007` | 1 | High | S | musicbizqr | audit-parent | Agency screens exist and are not ready for a price |
| `mkt-008` | 1 | High | L | musicbizqr | audit-parent | Articles still claim free forever, a free tier, and the wrong merch URL |
| `mkt-009` | 1 | High | S | musicbizqr | audit-parent | Lifetime Pro comps must not be sent to checkout |
| `mkt-010` | 1 | High | M | musicbizqr | audit-parent | The public artist directory mixes finished pages with toy pages |
| `mkt-011` | 1 | High | M | musicbizqr | audit-parent | The band editor does not say what the public page is missing |
| `mkt-012` | 1 | High | M | musicbizqr | audit-parent | Send one profile-completion email to owners of thin band pages |
| `mkt-014` | 1 | High | M | musicbizqr | audit-parent | Public copy does not say the customer is a band |
| `vocab-001` | 1 | High | M | musicbizqr | audit-parent | Public words do not match the glossary |
| `vocab-002` | 1 | High | S | musicbizqr | audit-parent | Live pages still say MusicBizQR |
| `vocab-003` | 1 | High | M | musicbizqr | audit-parent | Visible copy says artist where the customer is a band |
| `vocab-004` | 1 | High | S | musicbizqr | audit-parent | Public copy uses free for a plan that is not the 30-day trial |
| `sec-003` | 2 | Low | XS | qrserver | audit-parent | A failed Stripe webhook returns the library's error text to the caller |
| `sec-004` | 2 | Medium | XS | qrserver | audit-parent | The browser allowlist includes fanecco.com, which this audit did not confirm we own |
| `sec-010` | 2 | Medium | S | musicbizqr | sec-006 | Shipped pages hardcode Railway and api.musicbizqr.com Strapi hosts |
| `sec-011` | 2 | Medium | S | qrserver | sec-006 | Production middlewares stub CSP and drop the upload-enumeration block |
| `sec-012` | 2 | Medium | S | qrserver | sec-006 | Strapi admin and :1337 stay reachable on the public API hostname |
| `bill-002` | 2 | Medium | S | qrserver | audit-parent | The Connect fee, payment buttons, 30-day trial, and subscription check are already decided |
| `dead-002` | 2 | High | M | musicbizqr | audit-parent | Unused pages and unused components are still in the app |
| `dead-003` | 2 | High | S | musicbizqr | audit-parent | Old homepages are still on the live site |
| `mkt-013` | 2 | Medium | S | musicbizqr | audit-parent | Do not email the toy band pages |
| `vocab-005` | 2 | Medium | S | musicbizqr | audit-parent | Team screens invent roles the product does not have |
| `arch-001-api` | 3 | Medium | XL | qrserver | audit-parent | Band permission, the inbox, and artist updates should be split only if one function does two jobs |
| `arch-001-app` | 3 | Medium | L | musicbizqr | audit-parent | The live-show gallery controller is one large function that may be doing two jobs |
| `dead-006` | 3 | Medium | M | musicbizqr | audit-parent | Thirty-seven components have no reference |
| `test-001-api` | 4 | Low | S | qrserver | audit-parent | The backend tests do not lock the YouTube caller check or the user-admin secret |
| `test-001-app` | 4 | Low | S | musicbizqr | audit-parent | The frontend tests do not lock the rule that free means Lifetime Pro |

---

## P0 — Map

### `audit-parent`: Draft map: YouTube routes skip the caller, billing rules stay, and marketing is an implementation list

**Role:** Map / parent (children carry the work)

**Description:** Problem. These are local drafts for a code and copy audit. They are not filed on GitHub yet. A new developer can use this issue as the map. Do not open with a slogan. Read what the product is, then the child list.

Faneqo is a website for bands. The band is the customer. A band owner creates a login, creates a band, and pays for Pro. The account starts free, Pro is included for 30 days with no credit card, then it costs $12 a month. Billing sits on that login. One login can own more than one band. What they pay for is the band page at faneqo.com/{band-slug}. On that page the band adds the links a Linktree-style page would hold, embeds a YouTube video, and features a song. The band also gets a QR code that opens the page, so the page can go on a poster, a screen, or a merch table. A fan who opens the page can join that band's fan list, and the band can message those fans later. Fans do not buy Pro. The public site often says artist for that same band page. The database record is a band. Older articles still say MusicBizQR and describe only smart links and QR codes.

Priority **0**, severity **High**, effort **XL**, repo **musicbizqr**, labels: audit, tech-debt.

**Acceptance criteria:**

- [ ] The body says these drafts are not filed on GitHub yet.
- [ ] Each child has one problem sentence and one fix sentence, in the order in the body.
- [ ] musicbizqr children are sub-issues. qrserver issues are linked from this parent and are not sub-issues.
- [ ] No child changes Stripe amounts, the meaning of plan=free, or fan charges.

**Verification:**

- [ ] Section `audit-parent` still matches this page’s inventory title and acceptance criteria
- [ ] Manual check: all child draft ids for this parent appear elsewhere on this page

**Dependencies:** None (map)

**Files likely touched:**

- (none listed in draft body — use description paths / product trees at remediation time)

**Estimated scope:** XL

---

## P1 — Security

### `sec-001`: YouTube connect, sync, and debug routes do not check who is calling

**Role:** Actionable

**Description:** Problem. Every custom YouTube route is registered as public to Strapi, and the function that handles the request does not look at who is calling. It only checks that a band id exists, then it connects YouTube, picks a channel, syncs, disconnects, deletes the stored connection, or returns data from Google. Debug routes are in that same list. This draft does not say the live site answers these routes. That check stays on the private review checklist.

Where. Routes are in qrserver/src/api/youtube/routes/youtube.js. Handlers are in qrserver/src/api/youtube/controllers/youtube.js. Each route sets auth: false. In Strapi that means the framework does not require a logged-in user. The handler still has to check the caller. These handlers call assertBandExists, which only checks that the band id is a real band.

Priority **1**, severity **High**, effort **S**, repo **qrserver**, findings `SEC-001`, labels: security, audit.

**Acceptance criteria:**

- [ ] Debug YouTube routes are not registered.
- [ ] The remaining YouTube routes reject a caller who does not have permission on that band.
- [ ] A permitted member can still connect and sync their own band.
- [ ] Responses do not include provider access tokens or refresh tokens.
- [ ] The issue and the fix do not claim the routes are reachable in production.
- [ ] Stripe amounts, plan=free, and fan charges are unchanged.

**Verification:**

- [ ] Section `sec-001` still matches this page’s inventory title and acceptance criteria
- [ ] Manual check: acceptance criteria pass against product code

**Dependencies:** audit-parent

**Files likely touched:**

- `qrserver/src/api/youtube/routes/youtube.js` (citation from draft; local trees may be `frontend/` / `backend/`)
- `qrserver/src/api/youtube/controllers/youtube.js` (citation from draft; local trees may be `frontend/` / `backend/`)
- `qrserver/src/utils/bandRoles.js` (citation from draft; local trees may be `frontend/` / `backend/`)

**Estimated scope:** S

---

### `sec-002`: User-admin routes accept the general API token when the dedicated secret is missing

**Role:** Actionable

**Description:** Problem. Four user-admin routes can update a user, look a user up by email, register a user, or mint a login token. They do not use a normal logged-in session. They compare a bearer token to a secret. If USER_ADMIN_SECRET is unset, the code uses STRAPI_API_TOKEN instead. That second value is the general content API token, not a separate admin password.

Where. qrserver/src/api/user-admin/routes/user-admin.js registers these routes with auth: false: PUT /user-admin/:id, GET /user-admin/by-email/:email, POST /user-admin/register, and POST /user-admin/issue-jwt. qrserver/src/api/user-admin/controllers/user-admin.js sets ADMIN_SECRET to USER_ADMIN_SECRET or, if that is empty, STRAPI_API_TOKEN. validateSecret compares the bearer to that value.

Priority **1**, severity **High**, effort **XS**, repo **qrserver**, findings `SEC-002`, labels: security, audit.

**Acceptance criteria:**

- [ ] validateSecret compares only USER_ADMIN_SECRET.
- [ ] A missing USER_ADMIN_SECRET rejects the request.
- [ ] STRAPI_API_TOKEN is not accepted as that bearer.
- [ ] Nuxt social login still reaches issue-jwt with the dedicated secret.
- [ ] The secret value is not written into the repo or the issue.

**Verification:**

- [ ] Section `sec-002` still matches this page’s inventory title and acceptance criteria
- [ ] Manual check: acceptance criteria pass against product code

**Dependencies:** audit-parent

**Files likely touched:**

- `qrserver/src/api/user-admin/routes/user-admin.js` (citation from draft; local trees may be `frontend/` / `backend/`)
- `qrserver/src/api/user-admin/controllers/user-admin.js` (citation from draft; local trees may be `frontend/` / `backend/`)
- `musicbizqr/utils/auth/adminSecrets.js` (citation from draft; local trees may be `frontend/` / `backend/`)
- `musicbizqr/server/api/stripe/confirm-social.ts` (citation from draft; local trees may be `frontend/` / `backend/`)

**Estimated scope:** XS

---

### `sec-005`: Four Stripe signup routes never say whether the caller must be logged in

**Role:** Actionable

**Description:** Problem. Four Stripe routes do not set config.auth at all, so the file never says who may call them. Their handlers do not read the logged-in user. This audit did not prove that Strapi treats a missing auth setting as public, so this draft does not say the live site allows anonymous calls.

Where. The routes are in qrserver/src/api/stripe/routes/stripe.js. The handlers are in qrserver/src/api/stripe/controllers/stripe.js.

Priority **1**, severity **High**, effort **S**, repo **qrserver**, findings `SEC-005`, labels: security, audit.

**Acceptance criteria:**

- [ ] Each of the four routes has an explicit auth policy, and the pull request records Strapi's default for a missing one.
- [ ] confirm-payment cannot create a user without the signup checks the product intends.
- [ ] POST /stripe/confirm-social stays unregistered.
- [ ] Trial length and the Stripe price id are unchanged.

**Verification:**

- [ ] Section `sec-005` still matches this page’s inventory title and acceptance criteria
- [ ] Manual check: acceptance criteria pass against product code

**Dependencies:** audit-parent

**Files likely touched:**

- `qrserver/src/api/stripe/routes/stripe.js` (citation from draft; local trees may be `frontend/` / `backend/`)
- `qrserver/src/api/stripe/controllers/stripe.js` (citation from draft; local trees may be `frontend/` / `backend/`)

**Estimated scope:** S

---

### `sec-006`: Map: browsers talk to Strapi directly; the API host must stay private behind Nuxt

**Role:** Map / parent (children carry the work)

**Description:** Problem. Today the browser learns the Strapi origin and calls it cross-origin. `runtimeConfig.public.strapiUrl` and `@nuxtjs/strapi` put `STRAPI_URL` in the client payload. About seventy client files `$fetch` absolute `${strapiUrl}/api/...`; the Strapi module hits the same host. Nitro has no Strapi reverse-proxy in `routeRules` — only a thin BFF (fan subscribe, band-view, merch, ads, a few admin routes). Staging even publishes `https://staging-api.faneqo.com` into that public channel. Visitors can see the API host in DevTools. CORS is currently the gate that allows that browser→Strapi pattern.

Target. Only the Nuxt server talks to Strapi. The browser talks same-origin to Nuxt (Nitro server routes / proxy). The Strapi URL and droplet IP never appear in HTML, JS, or Network as a third-party API host. Strapi CORS is **not** a hardcoded host list: it is built from the same public-URL env vars every environment already uses, plus an optional comma-separated extras env (`sec-009`). Do **not** patch staging by editing a string array in `middlewares.js`. Migration Task **6b.4** is deferred into this map.

Children (order): `sec-007` hide the URL from the client → `sec-008` Nitro same-origin proxy for product traffic → `sec-009` env-driven CORS SoT. Related P2: `sec-004` (fanecco disappears when hardcodes die and env omits it), `sec-010` hardcoded Railway hosts, `sec-011` production middleware drift, `sec-012` public admin / :1337.

Priority **1**, severity **High**, effort **XL**, repo **musicbizqr** (+ qrserver for CORS), findings `SEC-CORS-BFF`, labels: security, audit, architecture.

**Acceptance criteria:**

- [ ] Children `sec-007`, `sec-008`, `sec-009` each have one problem sentence and one fix sentence.
- [ ] Standing do-not: no PR that only hardcodes a staging FE origin into `middlewares.js` as the staging “fix”.
- [ ] Map closed only when those three children meet their acceptance criteria (P2 relatives may trail).

**Verification:**

- [ ] Section `sec-006` still matches this page’s inventory title and acceptance criteria
- [ ] Manual check: child ids appear on this page and in `tasks/audit-issues-todo.md`

**Dependencies:** audit-parent

**Files likely touched:**

- (map only — children list concrete paths)

**Estimated scope:** XL

---

### `sec-007`: `public.strapiUrl` and `@nuxtjs/strapi` ship the Strapi host to every browser

**Role:** Actionable

**Description:** Problem. Nuxt puts the API origin in `runtimeConfig.public.strapiUrl` from `STRAPI_URL` / `NUXT_PUBLIC_STRAPI_URL` (`frontend/nuxt.config.ts`). The `@nuxtjs/strapi` module `strapi.url` uses the same env. Every page’s client payload can reveal `https://staging-api.faneqo.com`, Railway, or a droplet IP. Composables and pages read `useRuntimeConfig().public.strapiUrl` (~88 non-server files).

Fix. Keep Strapi URL **private** (server-only runtimeConfig / `process.env.STRAPI_URL` on Nitro). Stop putting it under `public`. Stop configuring the client Strapi module to a cross-origin absolute host (same-origin relative base, or server-only client). After this, View Source / `__NUXT__` must not contain the Strapi hostname. Depends on `sec-008` for traffic that still needs an API.

Priority **1**, severity **High**, effort **L**, repo **musicbizqr**, findings `SEC-PUBLIC-STRAPI-URL`, labels: security, audit.

**Acceptance criteria:**

- [ ] `runtimeConfig.public` has no `strapiUrl` (or equivalent) that holds the Strapi origin.
- [ ] Built client payload / `__NUXT__` on a logged-out public page does not contain the Strapi hostname or droplet IP.
- [ ] `NUXT_PUBLIC_STRAPI_URL` is removed from staging docs as a required public overlay (server-only `STRAPI_URL` remains).
- [ ] Server routes that need Strapi still read a private config or `process.env.STRAPI_URL`.

**Verification:**

- [ ] Section `sec-007` still matches this page’s inventory title and acceptance criteria
- [ ] Manual check: curl a public FE HTML/JS bundle; no `staging-api` / Railway / `:1337` API origin in client payload

**Dependencies:** sec-006; practically pairs with sec-008 (do not ship hide-URL without a working same-origin path)

**Files likely touched:**

- `musicbizqr/nuxt.config.ts` (local: `frontend/nuxt.config.ts`)
- `musicbizqr` composables/pages/plugins that read `public.strapiUrl`
- `docs/staging-droplet.md`, `example.env` comments

**Estimated scope:** L

---

### `sec-008`: Product traffic still hits Strapi from the browser; Nitro must same-origin proxy it

**Role:** Actionable

**Description:** Problem. Dominant pattern is browser → Strapi absolute URL (`$fetch(\`${strapiUrl}/api/...\`)`, `useStrapi*`). Nitro BFF exists only for a few paths (`server/api/fans/subscribe.post.js` already says the artist page must not depend on browser→:1337; also band-view, merch, ads, some admin). There is no `routeRules` proxy to Strapi. Authed product (inbox, galleries, uploads, dashboard finds) and much of the public artist page still call Strapi from the browser.

Fix. Browser only calls same-origin Nuxt routes. Nitro (server routes and/or a controlled `/api/**` proxy) forwards to Strapi with server-side `STRAPI_URL`. JWT stays on the FE origin (existing `strapi_jwt` cookie) or is attached server-side — browser never needs the Strapi host. Prefer expanding the existing BFF pattern over a blind open proxy. Slice by product path if needed, but the issue is not done until browser Network on core band/dashboard flows shows only the FE host for API calls.

Priority **1**, severity **High**, effort **XL**, repo **musicbizqr**, findings `SEC-BFF-PROXY`, labels: security, audit, architecture.

**Acceptance criteria:**

- [ ] Core public band-page and logged-in dashboard API calls from the browser are same-origin to Nuxt (no cross-origin Strapi host in Network).
- [ ] No new open proxy that forwards arbitrary paths/methods without an allowlist or existing product route shape.
- [ ] Existing BFF routes (subscribe, band-view, merch, ads) keep working; subscribe no longer needs a browser→Strapi fallback.
- [ ] Upload / media flows either go through Nuxt or use CDN URLs that are not the Strapi API origin (document any intentional CDN exception).

**Verification:**

- [ ] Section `sec-008` still matches this page’s inventory title and acceptance criteria
- [ ] Manual check: DevTools Network on band page + one authed dashboard screen — API XHR/fetch hosts are FE only

**Dependencies:** sec-006; implement with or immediately after sec-007

**Files likely touched:**

- `musicbizqr/server/api/**`, `musicbizqr/nuxt.config.ts` routeRules
- `musicbizqr/composables/**`, `musicbizqr/pages/**`, `musicbizqr/utils/**` that call Strapi from the client
- `musicbizqr/utils/fan/joinArtistFanList.js` (drop Strapi-first fallback)

**Estimated scope:** XL

---

### `sec-009`: Strapi CORS origins are hardcoded; drive them from public-URL env + optional extras

**Role:** Actionable

**Description:** Problem. `backend/config/middlewares.js` and `backend/config/env/production/middlewares.js` hardcode CORS `origin` arrays (localhost, a private LAN IP, musicbizqr, faneqo, **fanecco** ±www). Staging FE is missing until someone edits the file. Every environment needs a different list, so the hardcode drifts and ships unowned hosts (`sec-004`).

Fix. One mechanism for all envs: build the CORS origin list from the **same public URL env vars** the app already uses as SoT for the frontend origin (normalize to origin only — scheme + host + optional port; strip paths). Primary sources (first non-empty wins, or union of non-empty — pick one rule and document it): `PUBLIC_APP_URL`, `FRONTEND_URL`, `WEB_PUBLIC`, and when `NODE_ENV=staging` the matching `STAGING_PUBLIC_APP_URL` / `STAGING_FRONTEND_URL` / `STAGING_WEB_PUBLIC` overlays already used by stack/droplet. Plus an optional env (name in PR, e.g. `CORS_ADDITIONAL_ORIGINS`) that accepts a **comma-separated** list of extra origins for rare tooling. No musicbizqr / faneqo / fanecco / LAN strings left in middleware source. Empty public-URL env ⇒ empty allowlist (fail closed), not a baked-in fallback host list.

Relation to BFF (`sec-007`/`sec-008`): Nuxt server → Strapi does not need browser CORS. After BFF, product browsers should not call Strapi; public-URL env may still be set for links/redirects, but CORS is only for whatever still must be browser→Strapi (ideally nothing) plus explicit extras. Until BFF lands, wiring droplet/prod `PUBLIC_APP_URL` (etc.) is how staging/prod FE origins enter CORS — **not** a one-line hardcode of `https://staging.faneqo.com` in git. Migration 6b.4 superseded by this issue.

Priority **1**, severity **High**, effort **M**, repo **qrserver**, findings `SEC-CORS-ENV`, labels: security, audit.

**Acceptance criteria:**

- [ ] `strapi::cors` `origin` is computed from public-URL env vars (documented which keys + normalize rule); no hardcoded product host list in middlewares source.
- [ ] Optional comma-separated extras env is supported; empty/unset adds nothing.
- [ ] Default and production middleware files share the same builder (no divergent hardcoded prod array).
- [ ] fanecco.com / private LAN are absent unless present in env (satisfies `sec-004` when env is clean).
- [ ] Local / staging / prod each get the right allowlist by setting the same public-URL env keys already used for that env (droplet staging uses HTTPS FE URL already set in 6b.3).
- [ ] `example.env` (+ droplet docs) document the public-URL keys and the extras env; migration 6b.4 points here.
- [ ] Nuxt server-side `$fetch` to Strapi still succeeds (server-to-server; not gated on browser CORS).

**Verification:**

- [ ] Section `sec-009` still matches this page’s inventory title and acceptance criteria
- [ ] Manual check: with only `PUBLIC_APP_URL=https://staging.faneqo.com`, preflight from that origin is allowed; with empty public-URL + empty extras, browser ACAO is denied; changing env does not require editing `middlewares.js`
- [ ] Manual check: ripgrep middlewares for `fanecco` / `musicbizqr.com` / `172.20` returns none

**Dependencies:** sec-006; can land before or with sec-007/sec-008 (env SoT is independent of BFF; BFF reduces who needs to be on the list)

**Files likely touched:**

- `qrserver/config/middlewares.js` (local: `backend/config/middlewares.js`)
- `qrserver/config/env/production/middlewares.js`
- small helper under `qrserver/config/` or `src/utils/` if needed to parse/normalize origins
- `example.env`, `docs/staging-droplet.md`, Task 6b.4 note

**Estimated scope:** M

---

## P1 — Billing guard

### `bill-001`: The value free on an artist account means Lifetime Pro, not a small free plan

**Role:** Guard (document / do not change product rules)

**Description:** Problem. If an artist's plan is free, or their subscriptionStatus is free, the app treats them as Lifetime Pro: full Pro, and Stripe is not charged. A written proposal describes a limited Free tier, a smaller artist plan. That proposal is not approved and has no code. Storing free to mean that smaller plan would grant full Pro instead.

Faneqo is a website for bands. The band is the customer. A band owner creates a login, creates a band, and pays for Pro. The account starts free, Pro is included for 30 days with no credit card, then it costs $12 a month. Billing sits on that login. One login can own more than one band. What they pay for is the band page at faneqo.com/{band-slug}. On that page the band adds the links a Linktree-style page would hold, embeds a YouTube video, and features a song. The band also gets a QR code that opens the page, so the page can go on a poster, a screen, or a merch table. A fan who opens the page can join that band's fan list, and the band can message those fans later. Fans do not buy Pro. The public site often says artist for that same band page. The database record is a band. Older articles still say MusicBizQR and describe only smart links and QR codes.

Priority **1**, severity **High**, effort **XS**, repo **musicbizqr**, findings `BILL-001`, labels: billing, audit.

**Acceptance criteria:**

- [ ] isBillingExemptLifetimePro is still true when plan or subscriptionStatus is free.
- [ ] No code path writes free to mean a limited artist tier.
- [ ] The entitlement proposal is still marked unapproved, or, if the doc is touched, it repeats this rule.

**Verification:**

- [ ] Section `bill-001` still matches this page’s inventory title and acceptance criteria
- [ ] Manual check: no product change shipped for this guard without explicit override

**Dependencies:** audit-parent

**Files likely touched:**

- `musicbizqr/utils/billing/artistEntitlement.js` (citation from draft; local trees may be `frontend/` / `backend/`)

**Estimated scope:** XS

---

## P1 — Data

### `data-001`: Replace musicbizqr / musicbizqr.com with faneqo / faneqo.com in files and DB

**Role:** Actionable

**Description:** Problem. The product is Faneqo on faneqo.com. Source trees and Postgres still carry the old brand and host: `musicbizqr`, `MusicBizQR`, `musicbizqr.com`, `www.musicbizqr.com`, fallbacks like `https://musicbizqr.com`, and stored Strapi content (especially `seo_pages` richtext/JSON). `mkt-002` only rewrites some essay links at render time; the DB and most files stay wrong. `vocab-002` covers a few visible MusicBizQR strings — this issue is the **full** replace pass.

**Replace rules (apply in this order):**

1. `https://www.musicbizqr.com` → `https://www.faneqo.com` (and `http://` twin)
2. `https://musicbizqr.com` → `https://faneqo.com` (and `http://` twin)
3. Remaining `www.musicbizqr.com` / `musicbizqr.com` → `www.faneqo.com` / `faneqo.com` (emails, bare hosts)
4. `MusicBizQR` → `Faneqo`
5. Standalone `musicbizqr` → `faneqo` (case-sensitive token; not inside already-replaced hosts)

**Carve-outs (do not rewrite):**

- Inbound legacy hosts that must stay recognizable: `domain-migration.ts` / QR gateway **allowlist entries** for `musicbizqr.com` / `www.musicbizqr.com` (they redirect *to* faneqo; the Set must still list the old names).
- Short / API legacy hosts until separately decided: `qr.musicbizqr.com`, `api.musicbizqr.com` (protect during bulk replace; `api.musicbizqr.com` remains `sec-010`).
- GitHub product remote name / path `Nick-tsoukas/musicbizqr` and workspace path citations that mean “the FE repo” until history merge — do not rename the remote.
- Legal pages (`termsofservice` / `privacypolicy`) only if company legal name is still MusicBizQR (same gate as `vocab-002`).
- `qr.url` column values that are opaque short codes (not marketing URLs).

**DB.** Ship and run SQL at `scripts/sql/migrate-musicbizqr-hosts-to-faneqo.sql` (root). Dry-run section counts matches; apply section updates text/`jsonb` (via text round-trip) with the protect/restore pattern for carve-out hosts. Prefer explicit `seo_pages` columns first, then a catalog scan of `text` / `varchar` / `jsonb` in `public`. Backup before apply. Idempotent second run = 0 rows changed. Optional JS bootstrap (`migrateLegacyHost.js` + `FANEQO_MIGRATE_LEGACY_HOST=1`) may wrap the same rules for app-side dry-run logging — SQL remains the SoT for Postgres.

**Files.** Ripgrep `frontend/` + `backend/` (and root docs that state the live product host) for the old tokens; replace per rules. Defaults like `PUBLIC_APP_URL || 'https://musicbizqr.com'` become `https://faneqo.com`. Agency allowlist email `partner@musicbizqr.com` → `partner@faneqo.com` only if that mailbox is confirmed; otherwise move to carve-out + note.

Priority **1**, severity **High**, effort **L**, repo **both** (`frontend/` + `backend/`), findings `DATA-001`, labels: marketing, audit, migration.

**Acceptance criteria:**

- [ ] `scripts/sql/migrate-musicbizqr-hosts-to-faneqo.sql` exists: dry-run counts + apply updates; documents carve-outs; no secrets.
- [ ] Dry-run on a DB copy reports match counts; apply then second dry-run shows zero remaining `musicbizqr.com` / `MusicBizQR` in scanned content columns (except protected hosts).
- [ ] `seo_pages` (and other hit tables) store `faneqo.com` / `Faneqo`, not marketing `musicbizqr.com` / `MusicBizQR`.
- [ ] Product source under `frontend/` + `backend/` (non-carve-out) has no remaining `musicbizqr.com` or user-facing `MusicBizQR` / stray `musicbizqr` brand token — verified by ripgrep with documented allowlist for carve-outs.
- [ ] `PUBLIC_APP_URL` / similar code fallbacks default to `https://faneqo.com`.
- [ ] `domain-migration.ts` and QR gateway still **list** legacy marketing hosts for redirect recognition.
- [ ] `qr.musicbizqr.com` / `api.musicbizqr.com` not blindly rewritten to `qr.faneqo.com` / `api.faneqo.com`.
- [ ] `mkt-002` / `vocab-002` either already satisfied by this pass or left only with their residual UI/render work.

**Verification:**

- [ ] Section `data-001` still matches this page’s inventory title and acceptance criteria
- [ ] Manual check: SQL dry-run + apply on staging copy; ripgrep FE/BE; spot-check one article row and one public page

**Dependencies:** audit-parent; coordinate with `mkt-002`, `vocab-002`, `sec-010`

**Files likely touched:**

- `scripts/sql/migrate-musicbizqr-hosts-to-faneqo.sql` (SoT for DB)
- `frontend/**`, `backend/**` product sources matching the tokens (fallbacks, copy, demos, policies)
- optional `backend/src/utils/content/migrateLegacyHost.js` + `backend/src/index.js` if JS dry-run wrapper kept
- `docs/staging-data.md` (how to run SQL on staging Postgres)
- carve-out files kept intentional: `frontend/server/middleware/domain-migration.ts`, QR gateway

**Estimated scope:** L

---

## P1 — Dead (live leak)

### `dead-004`: Test and internal preview pages are still on the live site

**Role:** Actionable

**Description:** Problem. These routes are not the product, and on 28 Oct 2026 each one returned 200 on https://faneqo.com. /testing is a hello-world editor. /testsite is the text HELLO WORLD. /test-qr and /debug-qr are QR experiments. /directqrold is an old QR landing page that looks up a code from the browser. The live QR route is server/routes/directqr.ts, and the dashboard builds /directqr?id=. /marketing-component-preview only mounts a demo block. /internal/demo/live-feed, /internal/demo/smart-link-live, /internal/rive-sandbox, and /internal/shareables are previews. The shareables file comment contains a shared password. Nothing in the product nav links to these paths. The noindex list hides some of them from search. It does not remove the route.

Priority **1**, severity **High**, effort **S**, repo **musicbizqr**, findings `DEAD-002`, labels: audit, tech-debt.

**Acceptance criteria:**

- [ ] The page paths listed in this draft are not routes on https://faneqo.com.
- [ ] https://faneqo.com/directqr still exists as the QR route.
- [ ] /install still opens from the header.
- [ ] The shareables password is not written in the pull request or the audit page.

**Verification:**

- [ ] Section `dead-004` still matches this page’s inventory title and acceptance criteria
- [ ] Manual check: acceptance criteria pass against product code

**Dependencies:** audit-parent

**Files likely touched:**

- `musicbizqr/pages/test.vue` (citation from draft; local trees may be `frontend/` / `backend/`)
- `musicbizqr/pages/testing.vue` (citation from draft; local trees may be `frontend/` / `backend/`)
- `musicbizqr/pages/testsite.vue` (citation from draft; local trees may be `frontend/` / `backend/`)
- `musicbizqr/pages/test-qr.vue` (citation from draft; local trees may be `frontend/` / `backend/`)
- `musicbizqr/pages/debug-qr.vue` (citation from draft; local trees may be `frontend/` / `backend/`)
- `musicbizqr/pages/directqrold.vue` (citation from draft; local trees may be `frontend/` / `backend/`)
- `musicbizqr/pages/marketing-component-preview.vue` (citation from draft; local trees may be `frontend/` / `backend/`)
- `musicbizqr/pages/internal/demo/live-feed.vue` (citation from draft; local trees may be `frontend/` / `backend/`)
- `musicbizqr/pages/internal/demo/smart-link-live.vue` (citation from draft; local trees may be `frontend/` / `backend/`)
- `musicbizqr/pages/internal/rive-sandbox.vue` (citation from draft; local trees may be `frontend/` / `backend/`)
- `musicbizqr/pages/internal/shareables.vue` (citation from draft; local trees may be `frontend/` / `backend/`)
- `musicbizqr/server/middleware/seo-noindex.ts` (citation from draft; local trees may be `frontend/` / `backend/`)

**Estimated scope:** S

---

### `dead-005`: Two local lab pages are missing the production 404

**Role:** Actionable

**Description:** Problem. Pages under musicbizqr/pages/__dev are local labs. Twenty-three of them throw a 404 when import.meta.dev is false. On 28 Oct 2026, https://faneqo.com/__dev/gallery and https://faneqo.com/__dev/studio-render returned 404. https://faneqo.com/__dev/passport-p1 and https://faneqo.com/__dev/artist-image-framing returned 200. Those two files do not have the production check. passport-p1.vue says it is fixture-only. artist-image-framing.vue says it does not write to Strapi.

Where. musicbizqr/pages/__dev/passport-p1.vue. musicbizqr/pages/__dev/artist-image-framing.vue. The working check is in musicbizqr/pages/__dev/gallery.vue: if import.meta.dev is false, throw a 404.

Priority **1**, severity **High**, effort **S**, repo **musicbizqr**, findings `DEAD-002`, labels: audit, tech-debt.

**Acceptance criteria:**

- [ ] https://faneqo.com/__dev/passport-p1 returns 404.
- [ ] https://faneqo.com/__dev/artist-image-framing returns 404.
- [ ] A local dev server can still open both pages.
- [ ] The other __dev pages still 404 in production.

**Verification:**

- [ ] Section `dead-005` still matches this page’s inventory title and acceptance criteria
- [ ] Manual check: acceptance criteria pass against product code

**Dependencies:** audit-parent

**Files likely touched:**

- `musicbizqr/pages/__dev` (citation from draft; local trees may be `frontend/` / `backend/`)
- `musicbizqr/pages/__dev/passport-p1.vue` (citation from draft; local trees may be `frontend/` / `backend/`)
- `musicbizqr/pages/__dev/artist-image-framing.vue` (citation from draft; local trees may be `frontend/` / `backend/`)
- `musicbizqr/pages/__dev/gallery.vue` (citation from draft; local trees may be `frontend/` / `backend/`)

**Estimated scope:** S

---

## P1 — Marketing

### `mkt-001`: Ongoing list of code changes that gain users and paid subscribers

**Role:** Map / parent (children carry the work)

**Description:** Problem. Public pages still describe smart links and QR codes, often under the name MusicBizQR, and several product paths never ask an artist to subscribe. This draft is the ongoing list. The work is the child drafts. Marketing page-scan notes are reading aids, not extra issues. Do not file a scan note as its own issue.

Faneqo is a website for bands. The band is the customer. The owner pays for Pro and gets a band page with links, a YouTube embed, a song, and a QR code that opens the page. Fans join that page. Fans do not pay. Do not charge fans. Do not build the limited Free tier. Do not add a fan plan or a separate artist account. Do not reuse plan=free for a smaller plan. Do not change the $12 price or the 30-day trial.

Priority **1**, severity **High**, effort **XL**, repo **musicbizqr**, findings `MKT-001`, labels: marketing, audit.

**Acceptance criteria:**

- [ ] The body names mkt-002, mkt-003, mkt-004, mkt-005, mkt-006, mkt-007, mkt-008, mkt-009, mkt-010, mkt-011, mkt-012, mkt-013, and mkt-014.
- [ ] Each child is a code change in this repo, except mkt-007 which says not to add checkout.
- [ ] No child changes the $12 price, the 30-day trial, or the meaning of plan=free.
- [ ] No child charges fans or builds a limited Free tier.
- [ ] Page cards stay evidence. Disagreeing scan notes are not new issues.

**Verification:**

- [ ] Section `mkt-001` still matches this page’s inventory title and acceptance criteria
- [ ] Manual check: all child draft ids for this parent appear elsewhere on this page

**Dependencies:** audit-parent

**Files likely touched:**

- `musicbizqr/pages/article/[category]/[slug].vue` (citation from draft; local trees may be `frontend/` / `backend/`)
- `musicbizqr/pages/signup.vue` (citation from draft; local trees may be `frontend/` / `backend/`)
- `musicbizqr/pages/login.vue` (citation from draft; local trees may be `frontend/` / `backend/`)
- `musicbizqr/pages/dashboard/index.vue` (citation from draft; local trees may be `frontend/` / `backend/`)
- `musicbizqr/components/TrialReminder.vue` (citation from draft; local trees may be `frontend/` / `backend/`)
- `musicbizqr/pages/account.vue` (citation from draft; local trees may be `frontend/` / `backend/`)
- `qrserver/config/paymentButtons.default.js` (citation from draft; local trees may be `frontend/` / `backend/`)
- `qrserver/src/utils/billing/platformFee.js` (citation from draft; local trees may be `frontend/` / `backend/`)
- `musicbizqr/pages/editband/[id].vue` (citation from draft; local trees may be `frontend/` / `backend/`)
- `musicbizqr/pages/agency/dashboard.vue` (citation from draft; local trees may be `frontend/` / `backend/`)
- `musicbizqr/utils/agencyPortal/mockData.js` (citation from draft; local trees may be `frontend/` / `backend/`)
- `musicbizqr/server/utils/seoRedirects.ts` (citation from draft; local trees may be `frontend/` / `backend/`)

**Estimated scope:** XL

---

### `mkt-002`: Article essays still send the button to musicbizqr.com

**Role:** Actionable

**Description:** Problem. A visitor reading an article often clicks a button that leaves for musicbizqr.com or musicbizqr.com/signup. Signup on faneqo.com never happens. The close box in the Vue file already uses /signup, but the essay HTML from Strapi still contains the old host.

Where. musicbizqr/pages/article/[category]/[slug].vue. renderMarkdown calls marked.parse on page.content and does not rewrite hosts. The musicbizqr.com rewrite in that file applies only to JSON-LD. Example (not every URL): https://faneqo.com/article/qr-code-strategy/free-qr-code-generator-for-bands sends "Get Started Free" to https://musicbizqr.com/signup.

**Overlap:** Stored HTML hosts are owned by **`data-001`** (SQL + file replace). This issue is the **render-time** safety net (rewrite in `renderMarkdown` / essay HTML) until/unless `data-001` has already cleaned every row. Prefer DB fix; keep a defensive rewrite if cheap.

Priority **1**, severity **High**, effort **S**, repo **musicbizqr**, findings `MKT-001`, labels: marketing, audit.

**Acceptance criteria:**

- [ ] Essay links that used musicbizqr.com open on faneqo.com (via `data-001` DB fix and/or render rewrite).
- [ ] A signup link from an essay opens https://faneqo.com/signup.
- [ ] The template close button is still /signup.
- [ ] Stripe amounts and plan=free are unchanged.

**Verification:**

- [ ] Section `mkt-002` still matches this page’s inventory title and acceptance criteria
- [ ] Manual check: acceptance criteria pass against product code

**Dependencies:** audit-parent

**Files likely touched:**

- `musicbizqr/pages/article/[category]/[slug].vue` (citation from draft; local trees may be `frontend/` / `backend/`)

**Estimated scope:** S

---

### `mkt-003`: There is no pricing page, and signup is missing from the sitemap

**Role:** Actionable

**Description:** Problem. The only public page that states the real $12 offer is the homepage FAQ. There is no /pricing route. The sitemap lists /, /article, /contact, /privacypolicy, and /termsofservice. Signup and login are marked sitemap false, so they are left out. The deck page only redirects and is not listed.

Where. musicbizqr/nuxt.config.ts sitemap urls(). musicbizqr/pages/signup.vue and musicbizqr/pages/login.vue set sitemap: false. musicbizqr/pages/deck.vue redirects to a Corvana deck and is not in the static URL list. The price sentence to reuse is in musicbizqr/utils/home/homepageContent.js.

Priority **1**, severity **High**, effort **M**, repo **musicbizqr**, findings `MKT-001`, labels: marketing, audit.

**Acceptance criteria:**

- [ ] /pricing exists and states the homepage $12 sentence and the 30-day trial.
- [ ] The pricing button goes to /signup.
- [ ] The sitemap lists /pricing, /signup, and /login.
- [ ] Stripe amounts and trial_period_days are unchanged.

**Verification:**

- [ ] Section `mkt-003` still matches this page’s inventory title and acceptance criteria
- [ ] Manual check: acceptance criteria pass against product code

**Dependencies:** audit-parent

**Files likely touched:**

- `musicbizqr/pages/signup.vue` (citation from draft; local trees may be `frontend/` / `backend/`)
- `musicbizqr/pages/login.vue` (citation from draft; local trees may be `frontend/` / `backend/`)
- `musicbizqr/pages/deck.vue` (citation from draft; local trees may be `frontend/` / `backend/`)
- `musicbizqr/utils/home/homepageContent.js` (citation from draft; local trees may be `frontend/` / `backend/`)
- `musicbizqr/pages/pricing.vue` (citation from draft; local trees may be `frontend/` / `backend/`)

**Estimated scope:** M

---

### `mkt-004`: The article close box still sells smart links

**Role:** Actionable

**Description:** Problem. The box at the bottom of every article says "Built for Musicians. Powered by Smart Links" and lists unlimited link clicks, Spotify streams, YouTube plays, and "Create your first Smart Link." The homepage is the page that describes the band page, the fan list, messaging, and $12. The article box does not.

Where. musicbizqr/pages/article/[category]/[slug].vue, the gradient section whose button is NuxtLink to="/signup".

Priority **1**, severity **High**, effort **S**, repo **musicbizqr**, findings `MKT-001`, labels: marketing, audit.

**Acceptance criteria:**

- [ ] The article close box names the band page, the fan list, and messaging.
- [ ] The button still goes to /signup.
- [ ] The box states the homepage $12 sentence.
- [ ] The smart-link bullet list is gone from that box.

**Verification:**

- [ ] Section `mkt-004` still matches this page’s inventory title and acceptance criteria
- [ ] Manual check: acceptance criteria pass against product code

**Dependencies:** audit-parent

**Files likely touched:**

- `musicbizqr/pages/article/[category]/[slug].vue` (citation from draft; local trees may be `frontend/` / `backend/`)
- `musicbizqr/utils/home/homepageContent.js` (citation from draft; local trees may be `frontend/` / `backend/`)

**Estimated scope:** S

---

### `mkt-005`: The trial can end without a subscribe prompt on the dashboard

**Role:** Actionable

**Description:** Problem. While days remain and the artist has no card, the dashboard shows TrialBanner and "Add Payment", which opens the Stripe billing portal. When the trial is over, daysLeft is cleared and that banner is not shown. TrialReminder.vue would say "Upgrade now" but no page mounts it, and its link is /account/billing, which is not a route. The account screen shows the trial end date and "Manage Billing Info". It does not add a step that asks the artist to subscribe when the trial hits zero. This is not a lock. Show mode, the inbox, and galleries are not on the subscription policy.

Where. musicbizqr/pages/dashboard/index.vue (TrialBanner, daysLeft > 0, goToBillingPortal). musicbizqr/components/TrialReminder.vue (unused, links to /account/billing). musicbizqr/pages/account.vue (Subscription Status and Manage Billing Info).

Priority **1**, severity **High**, effort **M**, repo **musicbizqr**, findings `MKT-001`, labels: marketing, audit.

**Acceptance criteria:**

- [ ] A non-comp artist whose trial has ended sees a subscribe prompt on the dashboard.
- [ ] The prompt opens the existing Stripe billing portal.
- [ ] Lifetime Pro accounts do not see the prompt.
- [ ] /account/billing is not the target.
- [ ] Show mode, the inbox, and galleries gain no new billing gate.
- [ ] Stripe price and trial length are unchanged.

**Verification:**

- [ ] Section `mkt-005` still matches this page’s inventory title and acceptance criteria
- [ ] Manual check: acceptance criteria pass against product code

**Dependencies:** audit-parent

**Files likely touched:**

- `musicbizqr/pages/dashboard/index.vue` (citation from draft; local trees may be `frontend/` / `backend/`)
- `musicbizqr/components/TrialReminder.vue` (citation from draft; local trees may be `frontend/` / `backend/`)
- `musicbizqr/pages/account.vue` (citation from draft; local trees may be `frontend/` / `backend/`)

**Estimated scope:** M

---

### `mkt-006`: Connect payment buttons stay off, and the artist is not told when a fee applies

**Role:** Actionable

**Description:** Problem. Six Connect buttons ship with enabled false. The public band page shows a pay control only after the artist turns a button on and Connect onboarding is complete. The platform fee is omitted unless FANEQO_PLATFORM_FEE_BPS is an integer from 1 to 1000. The edit screen lets the artist toggle buttons, and it does not tell the artist that a fee is taken from their proceeds only when that env value is set. Fans must not be shown a percent. 200 is an example in code, not a production rate to print.

Where. qrserver/config/paymentButtons.default.js (enabled false on all six). qrserver/src/utils/billing/platformFee.js. musicbizqr/pages/editband/[id].vue (payment button toggles). The public render is musicbizqr/pages/[bandSlug]/index.vue enabledPaymentButtons and musicbizqr/components/band/BandPageCybered.vue SupportModule.

Priority **1**, severity **High**, effort **M**, repo **musicbizqr**, findings `MKT-001`, labels: marketing, audit.

**Acceptance criteria:**

- [ ] Default payment buttons are still enabled false.
- [ ] The artist edit screen states that a fee applies only when the env integer is set.
- [ ] The note does not print a percent.
- [ ] The public page still hides pay buttons until the artist enables one and Connect is ready.
- [ ] The fan's price is unchanged.

**Verification:**

- [ ] Section `mkt-006` still matches this page’s inventory title and acceptance criteria
- [ ] Manual check: acceptance criteria pass against product code

**Dependencies:** audit-parent

**Files likely touched:**

- `qrserver/config/paymentButtons.default.js` (citation from draft; local trees may be `frontend/` / `backend/`)
- `qrserver/src/utils/billing/platformFee.js` (citation from draft; local trees may be `frontend/` / `backend/`)
- `musicbizqr/pages/editband/[id].vue` (citation from draft; local trees may be `frontend/` / `backend/`)
- `musicbizqr/pages/[bandSlug]/index.vue` (citation from draft; local trees may be `frontend/` / `backend/`)
- `musicbizqr/components/band/BandPageCybered.vue` (citation from draft; local trees may be `frontend/` / `backend/`)

**Estimated scope:** M

---

### `mkt-007`: Agency screens exist and are not ready for a price

**Role:** Actionable

**Description:** Problem. Agency pages are password-gated and have no public price. The screens use sample data, not the artist's live bands. A checkout would sell a demo.

Where. musicbizqr/pages/agency/dashboard.vue, musicbizqr/pages/agency/index.vue, and musicbizqr/pages/agency/artists/[bandId].vue use the agency layout. musicbizqr/stores/agencyPortal.js gates the portal. musicbizqr/utils/agencyPortal/mockData.js supplies the bands. Do not write the password into this issue.

Priority **1**, severity **High**, effort **S**, repo **musicbizqr**, findings `MKT-001`, labels: marketing, audit.

**Acceptance criteria:**

- [ ] No new Stripe price or checkout is added for agency.
- [ ] Agency pages still read sample data.
- [ ] The password is not written into the repo or the issue.

**Verification:**

- [ ] Section `mkt-007` still matches this page’s inventory title and acceptance criteria
- [ ] Manual check: acceptance criteria pass against product code

**Dependencies:** audit-parent

**Files likely touched:**

- `musicbizqr/pages/agency/dashboard.vue` (citation from draft; local trees may be `frontend/` / `backend/`)
- `musicbizqr/pages/agency/index.vue` (citation from draft; local trees may be `frontend/` / `backend/`)
- `musicbizqr/pages/agency/artists/[bandId].vue` (citation from draft; local trees may be `frontend/` / `backend/`)
- `musicbizqr/utils/agencyPortal/mockData.js` (citation from draft; local trees may be `frontend/` / `backend/`)

**Estimated scope:** S

---

### `mkt-008`: Articles still claim free forever, a free tier, and the wrong merch URL

**Role:** Actionable

**Description:** Problem. Article essays still say the product is free forever, that the first three QR codes are free, or that a free tier is available. Those are not plans in the billing code. A writing prompt is still in some essays. Two merch URLs redirect to one indie-bands article. The central-hub URL has been scanned serving the promote-new-releases essay.

Where. Essays render in musicbizqr/pages/article/[category]/[slug].vue via renderMarkdown. Redirects are in musicbizqr/server/utils/seoRedirects.ts. Example URLs: https://faneqo.com/article/qr-code-strategy/free-qr-code-generator-for-bands ("Free Forever Plan"), https://faneqo.com/article/qr-code-strategy/how-bands-can-use-qr-codes-to-explode-their-fanbase-in-2025 ("first three QR codes free"), https://faneqo.com/article/qr-code-strategy/musicbizqr-vs-linktree-for-musicians. Merch URLs: https://faneqo.com/article/merch-growth/sell-more-band-merch-with-qr-codes and https://faneqo.com/article/merch-growth/sell-more-band-merch-with-smart-qr-codes. Central hub: https://faneqo.com/article/smart-links/smart-links-for-musicians-why-every-artist-needs-a-central-hub. If two scan notes for the same URL disagreed historically, treat that as note noise, not two bugs.

Priority **1**, severity **High**, effort **L**, repo **musicbizqr**, findings `MKT-001`, labels: marketing, audit.

**Acceptance criteria:**

- [ ] Rendered articles do not show the writing prompt.
- [ ] Rendered articles do not claim free forever, a free tier, or the first three QR codes free.
- [ ] The two merch URLs do not both land on a mismatched title.
- [ ] The central-hub URL does not present a different article as itself.
- [ ] The replacement sentence is the homepage $12 offer.
- [ ] Stripe amounts are unchanged.

**Verification:**

- [ ] Section `mkt-008` still matches this page’s inventory title and acceptance criteria
- [ ] Manual check: acceptance criteria pass against product code

**Dependencies:** audit-parent

**Files likely touched:**

- `musicbizqr/pages/article/[category]/[slug].vue` (citation from draft; local trees may be `frontend/` / `backend/`)
- `musicbizqr/server/utils/seoRedirects.ts` (citation from draft; local trees may be `frontend/` / `backend/`)
- `musicbizqr/utils/home/homepageContent.js` (citation from draft; local trees may be `frontend/` / `backend/`)

**Estimated scope:** L

---

### `mkt-009`: Lifetime Pro comps must not be sent to checkout

**Role:** Actionable

**Description:** Problem. plan or subscriptionStatus free means Lifetime Pro, full Pro, no charge. A new subscribe prompt or pricing button that ignores that check would ask a comp account to pay. The limited Free tier in the entitlement doc is not a reason to reuse free.

Where. musicbizqr/utils/billing/artistEntitlement.js isBillingExemptLifetimePro. The dashboard already passes a billing-exempt flag into TrialBanner in musicbizqr/pages/dashboard/index.vue. musicbizqr/pages/account.vue hides Manage Billing Info when the account is the ambassador plan.

Priority **1**, severity **High**, effort **S**, repo **musicbizqr**, findings `MKT-001`, labels: marketing, audit.

**Acceptance criteria:**

- [ ] Lifetime Pro accounts are not shown the new subscribe prompt.
- [ ] plan or subscriptionStatus free still means Lifetime Pro.
- [ ] The limited Free tier is not built.

**Verification:**

- [ ] Section `mkt-009` still matches this page’s inventory title and acceptance criteria
- [ ] Manual check: acceptance criteria pass against product code

**Dependencies:** audit-parent

**Files likely touched:**

- `musicbizqr/utils/billing/artistEntitlement.js` (citation from draft; local trees may be `frontend/` / `backend/`)
- `musicbizqr/pages/dashboard/index.vue` (citation from draft; local trees may be `frontend/` / `backend/`)
- `musicbizqr/pages/account.vue` (citation from draft; local trees may be `frontend/` / `backend/`)

**Estimated scope:** S

---

### `mkt-010`: The public artist directory mixes finished pages with toy pages

**Role:** Actionable

**Description:** Problem. https://faneqo.com/bands/all is the public list of artist pages. On 28 Oct 2026 the public band API returned 109 pages. A local scan labeled 47 linked, 2 thin, 14 review, and 46 toy. Linked means the page already has a song, a video, a social link, or a website. Thin means it does not, and it did not match the toy rules. Review means a person still has to look: the bio is under 20 characters, the name contains a digit, the text mentions Roblox, or it reads as a tribute. Toy means the bio equals the name, the text matches resume-fragment or store-name phrases, or the name ends in a long number. The directory title still says MusicBizQR. The page file asks for 100 rows. The live API currently ignores that and returns all 109. Do not publish the name-by-name toy/thin sheet.

Priority **1**, severity **High**, effort **M**, repo **musicbizqr**, findings `MKT-001`, labels: marketing, audit.

**Acceptance criteria:**

- [ ] The directory title and subtitle say Faneqo, not MusicBizQR.
- [ ] The directory loads the full band list, not a silent cap of 100.
- [ ] Rows labeled toy are not shown.
- [ ] Toy accounts are not deleted.
- [ ] The name-by-name review file is not copied into the public page.

**Verification:**

- [ ] Section `mkt-010` still matches this page’s inventory title and acceptance criteria
- [ ] Manual check: acceptance criteria pass against product code

**Dependencies:** audit-parent

**Files likely touched:**

- `musicbizqr/pages/bands/all.vue` (citation from draft; local trees may be `frontend/` / `backend/`)

**Estimated scope:** M

---

### `mkt-011`: The band editor does not say what the public page is missing

**Role:** Actionable

**Description:** Problem. An artist can leave a public page with no photo, no song, and no link. The editor saves that page and does not say what a visitor will not see. The completion email needs a screen to open. An email with nowhere to land gets one click and a bounce.

Where. musicbizqr/pages/editband/[id].vue. The public blocks a visitor can see are in musicbizqr/components/band/BandPageCybered.vue: photo, bio, featured song, YouTube embed, streaming links, social links, website, upcoming shows, and fan join. Fan join is on unless fanCaptureEnabled is false.

Priority **1**, severity **High**, effort **M**, repo **musicbizqr**, findings `MKT-001`, labels: marketing, audit.

**Acceptance criteria:**

- [ ] The band editor lists each missing public block and links to the field.
- [ ] The editor links to the public band page.
- [ ] Save still works when blocks are empty.
- [ ] Fan join is not turned off by the checklist.
- [ ] The checklist does not mention a price, a fee percent, or a fan charge.

**Verification:**

- [ ] Section `mkt-011` still matches this page’s inventory title and acceptance criteria
- [ ] Manual check: acceptance criteria pass against product code

**Dependencies:** audit-parent

**Files likely touched:**

- `musicbizqr/pages/editband/[id].vue` (citation from draft; local trees may be `frontend/` / `backend/`)
- `musicbizqr/components/band/BandPageCybered.vue` (citation from draft; local trees may be `frontend/` / `backend/`)

**Estimated scope:** M

---

### `mkt-012`: Send one profile-completion email to owners of thin band pages

**Role:** Actionable

**Description:** Problem. Owners of thin pages are not coming back. The existing message campaigns email fans on a band's fan list. They do not email the band owner. The public directory does not include the owner address. That address is the band's users_permissions_user.

Where. Fan sends are qrserver message-campaign routes and qrserver/src/utils/messaging/campaignService.js. The owner relation is users_permissions_user on the band schema in qrserver/src/api/band/content-types/band/schema.json. Unsubscribe already posts to musicbizqr/server/routes/unsubscribe.post.ts. The screen the email opens is the checklist from mkt-011.

Priority **1**, severity **High**, effort **M**, repo **musicbizqr**, findings `MKT-001`, labels: marketing, audit.

**Acceptance criteria:**

- [ ] The email goes to the band owner, not to fans.
- [ ] Only bands labeled thin are included, and only after the review rows have been looked at.
- [ ] Toy and linked rows are not emailed.
- [ ] The message links to the editor checklist and includes unsubscribe.
- [ ] The message does not ask for payment, print a fee percent, or describe a free tier.
- [ ] Stripe price and trial length are unchanged.

**Verification:**

- [ ] Section `mkt-012` still matches this page’s inventory title and acceptance criteria
- [ ] Manual check: acceptance criteria pass against product code

**Dependencies:** audit-parent

**Files likely touched:**

- `qrserver/src/utils/messaging/campaignService.js` (citation from draft; local trees may be `frontend/` / `backend/`)
- `qrserver/src/api/band/content-types/band/schema.json` (citation from draft; local trees may be `frontend/` / `backend/`)
- `musicbizqr/server/routes/unsubscribe.post.ts` (citation from draft; local trees may be `frontend/` / `backend/`)

**Estimated scope:** M

---

### `mkt-014`: Public copy does not say the customer is a band

**Role:** Actionable

**Description:** Problem. The main service is a band page. The band owner pays for it. The page holds links the way a Linktree page does, embeds a YouTube video, features a song, and has a QR code that opens the page. Fans can join the list from that page. They do not buy Pro. The homepage meta text still leads with "Music smart link" and "for artists". The audit used to open on the fan list. A reader cannot tell who pays.

Where. musicbizqr/utils/home/homepageContent.js (description, keywords, twitter:description). The article close box in musicbizqr/pages/article/[category]/[slug].vue. Role names are in qrserver/src/utils/bandRoles.js: owner, manager, viewer. Billing is on the login, not on the band, in qrserver/src/extensions/users-permissions/content-types/user/schema.json.

Priority **1**, severity **High**, effort **M**, repo **musicbizqr**, findings `MKT-001`, labels: marketing, audit.

**Acceptance criteria:**

- [ ] The homepage description names the band as the customer and the band page, QR code, links, and video as the service.
- [ ] The article close box says the band owner pays, and it does not start from the fan.
- [ ] No fan subscription and no new account type are added.
- [ ] Stripe price and trial length are unchanged.

**Verification:**

- [ ] Section `mkt-014` still matches this page’s inventory title and acceptance criteria
- [ ] Manual check: acceptance criteria pass against product code

**Dependencies:** audit-parent

**Files likely touched:**

- `musicbizqr/utils/home/homepageContent.js` (citation from draft; local trees may be `frontend/` / `backend/`)
- `musicbizqr/pages/article/[category]/[slug].vue` (citation from draft; local trees may be `frontend/` / `backend/`)
- `qrserver/src/utils/bandRoles.js` (citation from draft; local trees may be `frontend/` / `backend/`)
- `qrserver/src/extensions/users-permissions/content-types/user/schema.json` (citation from draft; local trees may be `frontend/` / `backend/`)

**Estimated scope:** M

---

## P1 — Vocabulary

### `vocab-001`: Public words do not match the glossary

**Role:** Map / parent (children carry the work)

**Description:** Problem. A band is the customer. The public site and the app use a second set of words for the same things: artist, musician, user, smart link, MusicBizQR, free plan, bandmate, and team member. A reader cannot tell who pays, or what they pay for. One word per thing: band, band page, band owner, fan, fan list, Pro, Lifetime Pro, owner, manager, viewer.

The children, each with the problem and the files.

Priority **1**, severity **High**, effort **M**, repo **musicbizqr**, findings `VOCAB-001`, labels: copy, audit.

**Acceptance criteria:**

- [ ] The body names vocab-002, vocab-003, vocab-004, and vocab-005.
- [ ] No child renames a file, a function, a route, or a database field.
- [ ] No child edits the terms or privacy page.
- [ ] No child adds a fan plan, a new role, or a limited free tier.

**Verification:**

- [ ] Section `vocab-001` still matches this page’s inventory title and acceptance criteria
- [ ] Manual check: all child draft ids for this parent appear elsewhere on this page

**Dependencies:** audit-parent

**Files likely touched:**

- `musicbizqr/pages/bands/all.vue` (citation from draft; local trees may be `frontend/` / `backend/`)

**Estimated scope:** M

---

### `vocab-002`: Live pages still say MusicBizQR

**Role:** Actionable

**Description:** Problem. The product name is Faneqo. These pages still show the old name to a visitor. The directory is the public list of bands, and its title is "All Artists | MusicBizQR".

Where. musicbizqr/pages/bands/all.vue title, meta description, heading, and the line "artists using MusicBizQR". musicbizqr/pages/offline.vue title "Offline - MusicBizQR". musicbizqr/pages/nys.vue title. musicbizqr/pages/improved-home.vue title and the MusicBizQR sentences in the page. musicbizqr/server/api/corvana/seo/export/chatgpt-prompt.get.ts and musicbizqr/server/utils/seoExportUtils.ts, which tell a model the site is MusicBizQR for musicians.

**Overlap:** Broad `MusicBizQR` → `Faneqo` file replace is **`data-001`**. This issue verifies the listed live surfaces and keeps the legal-pages gate.

Priority **1**, severity **High**, effort **S**, repo **musicbizqr**, findings `VOCAB-001`, labels: copy, audit.

**Acceptance criteria:**

- [ ] https://faneqo.com/bands/all title and heading do not say MusicBizQR.
- [ ] The directory says bands, and the count line does not say artists using MusicBizQR.
- [ ] The SEO prompt text names Faneqo and a band, and it does not name MusicBizQR.
- [ ] Terms and privacy are unchanged (unless human confirms legal rename — same gate as `data-001`).

**Verification:**

- [ ] Section `vocab-002` still matches this page’s inventory title and acceptance criteria
- [ ] Manual check: acceptance criteria pass against product code

**Dependencies:** audit-parent

**Files likely touched:**

- `musicbizqr/pages/bands/all.vue` (citation from draft; local trees may be `frontend/` / `backend/`)
- `musicbizqr/pages/offline.vue` (citation from draft; local trees may be `frontend/` / `backend/`)
- `musicbizqr/pages/nys.vue` (citation from draft; local trees may be `frontend/` / `backend/`)
- `musicbizqr/pages/improved-home.vue` (citation from draft; local trees may be `frontend/` / `backend/`)
- `musicbizqr/server/api/corvana/seo/export/chatgpt-prompt.get.ts` (citation from draft; local trees may be `frontend/` / `backend/`)
- `musicbizqr/server/utils/seoExportUtils.ts` (citation from draft; local trees may be `frontend/` / `backend/`)
- `musicbizqr/pages/termsofservice.vue` (citation from draft; local trees may be `frontend/` / `backend/`)
- `musicbizqr/pages/privacypolicy.vue` (citation from draft; local trees may be `frontend/` / `backend/`)

**Estimated scope:** S

---

### `vocab-003`: Visible copy says artist where the customer is a band

**Role:** Actionable

**Description:** Problem. The customer is a band. The band owner pays. Visible strings still say artist page, artist, and musician for that same customer and that same page. The homepage schema says "platform for artists" and "built for musicians". The header button says "Artist Page". The fan nav says "Artists". Setup says "Artist details". The account screen says "Artist page".

Where. musicbizqr/utils/home/homepageContent.js (FAQ answer "one artist page", WebSite description "artist headquarters" and "for musicians", SoftwareApplication description "for artists", keywords "for musicians" and "artist smart link"). musicbizqr/utils/ui/appShell.js labels "Artist Page" and "Artists". musicbizqr/utils/bands/artistSetupSections.js label "Artist details". musicbizqr/pages/account.vue link "Artist page". musicbizqr/pages/bands/all.vue heading "All Artists". musicbizqr/pages/invite/accept.vue "artist page". musicbizqr/pages/show-live.vue "artist page". musicbizqr/pages/newevent.vue "your artist page". musicbizqr/pages/home-classic.vue and musicbizqr/pages/improved-home.vue "artist page". musicbizqr/components/marketing/DemoShowGrowthFlow.vue "free artist page". Visible fallbacks that print the word Artist when a name is missing, including musicbizqr/utils/messages/mapInboxModels.js and the share and og captions that use "Artist" as the empty name.

Priority **1**, severity **High**, effort **M**, repo **musicbizqr**, findings `VOCAB-001`, labels: copy, audit.

**Acceptance criteria:**

- [ ] The homepage FAQ and the schema descriptions say band page, and they do not say artist page, for artists, or for musicians.
- [ ] The header link says Band page. The fan nav says Bands.
- [ ] Setup says Band details. The account link says Band page.
- [ ] No file, function, route, or database field was renamed.

**Verification:**

- [ ] Section `vocab-003` still matches this page’s inventory title and acceptance criteria
- [ ] Manual check: acceptance criteria pass against product code

**Dependencies:** audit-parent

**Files likely touched:**

- `musicbizqr/utils/home/homepageContent.js` (citation from draft; local trees may be `frontend/` / `backend/`)
- `musicbizqr/utils/ui/appShell.js` (citation from draft; local trees may be `frontend/` / `backend/`)
- `musicbizqr/utils/bands/artistSetupSections.js` (citation from draft; local trees may be `frontend/` / `backend/`)
- `musicbizqr/pages/account.vue` (citation from draft; local trees may be `frontend/` / `backend/`)
- `musicbizqr/pages/bands/all.vue` (citation from draft; local trees may be `frontend/` / `backend/`)
- `musicbizqr/pages/invite/accept.vue` (citation from draft; local trees may be `frontend/` / `backend/`)
- `musicbizqr/pages/show-live.vue` (citation from draft; local trees may be `frontend/` / `backend/`)
- `musicbizqr/pages/newevent.vue` (citation from draft; local trees may be `frontend/` / `backend/`)
- `musicbizqr/pages/home-classic.vue` (citation from draft; local trees may be `frontend/` / `backend/`)
- `musicbizqr/pages/improved-home.vue` (citation from draft; local trees may be `frontend/` / `backend/`)
- `musicbizqr/components/marketing/DemoShowGrowthFlow.vue` (citation from draft; local trees may be `frontend/` / `backend/`)
- `musicbizqr/utils/messages/mapInboxModels.js` (citation from draft; local trees may be `frontend/` / `backend/`)

**Estimated scope:** M

---

### `vocab-004`: Public copy uses free for a plan that is not the 30-day trial

**Role:** Actionable

**Description:** Problem. Pro is 30 days included, no card, then $12 a month. The database value free means Lifetime Pro, which is full Pro with no charge, and the account screen already labels that Lifetime Pro. Public pages use free for something else. /home-classic asks "Is Faneqo free?" and says a free artist page can be launched. /improved-home says the free artist page stays live forever after the trial, and that Pro features lock unless you upgrade. That is the unshipped limited free tier. It is not the product.

Where. musicbizqr/pages/home-classic.vue FAQ and the intro that says "free artist page". musicbizqr/pages/improved-home.vue lines that say the page stays active or stays live forever after the trial. musicbizqr/components/marketing/DemoShowGrowthFlow.vue "Create your free artist page". The allowed trial phrase "Start free" in musicbizqr/utils/home-v2/afterTheShow.js can stay only if the same screen already says Pro is included for 30 days.

Priority **1**, severity **High**, effort **S**, repo **musicbizqr**, findings `VOCAB-001`, labels: copy, audit.

**Acceptance criteria:**

- [ ] /home-classic and /improved-home do not say a free page stays forever or stays active without Pro.
- [ ] Any remaining free on those pages is in the same sentence as the 30-day Pro trial.
- [ ] The account screen still says Lifetime Pro for a billing-exempt login.
- [ ] Stripe price and trial length are unchanged.

**Verification:**

- [ ] Section `vocab-004` still matches this page’s inventory title and acceptance criteria
- [ ] Manual check: acceptance criteria pass against product code

**Dependencies:** audit-parent

**Files likely touched:**

- `musicbizqr/pages/home-classic.vue` (citation from draft; local trees may be `frontend/` / `backend/`)
- `musicbizqr/pages/improved-home.vue` (citation from draft; local trees may be `frontend/` / `backend/`)
- `musicbizqr/components/marketing/DemoShowGrowthFlow.vue` (citation from draft; local trees may be `frontend/` / `backend/`)
- `musicbizqr/utils/home-v2/afterTheShow.js` (citation from draft; local trees may be `frontend/` / `backend/`)

**Estimated scope:** S

---

## P2

### `sec-003`: A failed Stripe webhook returns the library's error text to the caller

**Role:** Actionable

**Description:** Problem. Stripe webhook routes check the signature before they trust the event. When that check fails, the handler sends the library's exception text back to the caller. The subscription webhook also writes the request headers into the debug log.

Where. qrserver/src/api/subscription/routes/webhook.js registers POST /webhooks/stripe and POST /stripe/webhook with auth: false, because the caller is Stripe, not a logged-in user. The handler is in qrserver/src/api/subscription/controllers/subscription.js. On a bad signature it returns the text Webhook Error plus the exception message, and it logs ctx.request.headers. qrserver/src/api/stripe/routes/connect-webhook.js registers POST /stripe/connect/webhook with auth: false. The handler in qrserver/src/api/stripe/controllers/connect-webhook.js returns the same kind of Webhook Error plus the exception message. Both handlers call stripe.webhooks.constructEvent with the raw body and the signing secret.

Priority **2**, severity **Low**, effort **XS**, repo **qrserver**, findings `SEC-003`, labels: security, audit.

**Acceptance criteria:**

- [ ] A bad signature on the subscription webhook and the Connect webhook returns a fixed string.
- [ ] The response body does not include the library exception.
- [ ] Debug logs do not include the full webhook headers.
- [ ] Valid signed events still update the subscription.

**Verification:**

- [ ] Section `sec-003` still matches this page’s inventory title and acceptance criteria
- [ ] Manual check: acceptance criteria pass against product code

**Dependencies:** audit-parent

**Files likely touched:**

- `qrserver/src/api/subscription/routes/webhook.js` (citation from draft; local trees may be `frontend/` / `backend/`)
- `qrserver/src/api/subscription/controllers/subscription.js` (citation from draft; local trees may be `frontend/` / `backend/`)
- `qrserver/src/api/stripe/routes/connect-webhook.js` (citation from draft; local trees may be `frontend/` / `backend/`)
- `qrserver/src/api/stripe/controllers/connect-webhook.js` (citation from draft; local trees may be `frontend/` / `backend/`)
- `qrserver/src/api/email-event/routes/email-event.js` (citation from draft; local trees may be `frontend/` / `backend/`)
- `qrserver/src/utils/svixSignature.js` (citation from draft; local trees may be `frontend/` / `backend/`)

**Estimated scope:** XS

---

### `sec-004`: The browser allowlist includes fanecco.com, which this audit did not confirm we own

**Role:** Actionable (interim; prefer closing via `sec-009`)

**Description:** Problem. Hardcoded CORS lists include fanecco.com (±www) and a private LAN origin. This audit did not confirm fanecco ownership. Those hosts only appear because the allowlist is a string array in git.

Where. `backend/config/middlewares.js` and `backend/config/env/production/middlewares.js`.

Note. Durable fix is `sec-009`: origins from public-URL env + optional comma-separated extras — fanecco/LAN vanish unless someone puts them in env. Mark this done when `sec-009` ships and production/staging env do not include those hosts.

Priority **2**, severity **Medium**, effort **XS**, repo **qrserver**, findings `SEC-004`, labels: security, audit.

**Acceptance criteria:**

- [ ] fanecco.com is not in middleware source and not in production/staging CORS env unless ownership is recorded.
- [ ] Private-network origins are not in middleware source and not in production CORS env.
- [ ] `sec-009` done (env-driven SoT), or an interim PR removes fanecco/LAN from the hardcode without adding new hardcoded product hosts.

**Verification:**

- [ ] Section `sec-004` still matches this page’s inventory title and acceptance criteria
- [ ] Manual check: acceptance criteria pass against product code

**Dependencies:** audit-parent; superseded-by path `sec-009`

**Files likely touched:**

- `qrserver/config/middlewares.js` (citation from draft; local trees may be `frontend/` / `backend/`)
- `qrserver/config/env/production/middlewares.js` (citation from draft; local trees may be `frontend/` / `backend/`)

**Estimated scope:** XS

---

### `sec-010`: Shipped pages hardcode Railway and api.musicbizqr.com Strapi hosts

**Role:** Actionable

**Description:** Problem. Even when env is correct, some pages embed absolute Strapi hosts in client code: `pages/seo.vue` (Railway admin + API), `pages/directqrold.vue` (Railway), `pages/admin/repair-qrs.vue` (`https://api.musicbizqr.com`). Those strings leak into the bundle if the routes are reachable and bypass the private-URL goal of `sec-007`.

Fix. Remove hardcodes, point through same-origin Nitro / private env, or delete/gate the pages (auth + noindex) if they are internal-only tools. Prefer deletion when the page is dead (`directqrold`).

Priority **2**, severity **Medium**, effort **S**, repo **musicbizqr**, findings `SEC-HARDCODED-API-HOST`, labels: security, audit.

**Acceptance criteria:**

- [ ] No client-shipped page hardcodes `qrserver-production.up.railway.app` or `api.musicbizqr.com`.
- [ ] Remaining admin tools use private server config or same-origin routes only.
- [ ] Dead pages removed or production-404’d with evidence.

**Verification:**

- [ ] Section `sec-010` still matches this page’s inventory title and acceptance criteria
- [ ] Manual check: ripgrep client trees for those host strings returns none (or only docs/scripts)

**Dependencies:** sec-006

**Files likely touched:**

- `musicbizqr/pages/seo.vue`, `pages/directqrold.vue`, `pages/admin/repair-qrs.vue`
- related `server/api/admin/*` fallbacks

**Estimated scope:** S

---

### `sec-011`: Production middlewares stub CSP and drop the upload-enumeration block

**Role:** Actionable

**Description:** Problem. Default `backend/config/middlewares.js` has a detailed `strapi::security` CSP and registers `global::block-upload-file-enumeration`. Production override `backend/config/env/production/middlewares.js` replaces security with `contentSecurityPolicy: { /* your CSP config */ }` and does **not** list the upload-enumeration middleware. Production may run weaker headers than default/staging.

Fix. Align production middlewares with the hardened default (real CSP, keep enumeration block), or document an intentional prod-only difference. Do not leave the placeholder comment as the live CSP.

Priority **2**, severity **Medium**, effort **S**, repo **qrserver**, findings `SEC-PROD-MIDDLEWARE-DRIFT`, labels: security, audit.

**Acceptance criteria:**

- [ ] Production middlewares no longer ship an empty/placeholder CSP object.
- [ ] `global::block-upload-file-enumeration` runs in production (or PR records why not).
- [ ] CORS changes stay consistent with `sec-009` / `sec-004`.

**Verification:**

- [ ] Section `sec-011` still matches this page’s inventory title and acceptance criteria
- [ ] Manual check: production config file reviewed; boot still healthy

**Dependencies:** audit-parent; coordinate with sec-009 if both touch middlewares

**Files likely touched:**

- `qrserver/config/env/production/middlewares.js`
- `qrserver/config/middlewares.js` (reference)

**Estimated scope:** S

---

### `sec-012`: Strapi admin and :1337 stay reachable on the public API hostname

**Role:** Actionable

**Description:** Problem. Staging serves Strapi (including `/admin`) on `https://staging-api.faneqo.com` and historically on public droplet `:1337`. After BFF, product browsers should not need that host at all. Leaving admin and the raw Node port on the open internet widens the attack surface (admin login brute force, direct API probing).

Fix. Prefer: close public `3000`/`1337` on the droplet firewall (nginx → localhost only); restrict `/admin` (VPN, Cloudflare Access, IP allowlist, or separate admin hostname); keep Nuxt→Strapi on private network / localhost. Document the chosen control. Prod Railway admin exposure is a separate cutover concern — record, do not silently change Railway networking without approval.

Priority **2**, severity **Medium**, effort **S**, repo **qrserver**, findings `SEC-ADMIN-EXPOSURE`, labels: security, audit, ops.

**Acceptance criteria:**

- [ ] Staging droplet does not need public `:1337` / `:3000` for normal dogfood (nginx localhost only), or PR records residual need.
- [ ] Strapi `/admin` access path is documented (who can reach it; how).
- [ ] Product dogfood uses FE hostname only; API hostname not required in the browser for band/dashboard flows (after sec-008).

**Verification:**

- [ ] Section `sec-012` still matches this page’s inventory title and acceptance criteria
- [ ] Manual check: from the public internet, direct `:1337` closed or documented; admin policy written in droplet docs

**Dependencies:** sec-006; stronger after sec-008

**Files likely touched:**

- droplet firewall / nginx (ops); `docs/staging-droplet.md`
- optional Cloudflare Access notes

**Estimated scope:** S

---

### `bill-002`: The Connect fee, payment buttons, 30-day trial, and subscription check are already decided

**Role:** Guard (document / do not change product rules)

**Description:** Problem. Four billing behaviors look unfinished. They are the current rules. This issue exists so a later change does not "finish" them by charging people, shortening the trial, or inventing a free tier.

Faneqo is a website for bands. The band is the customer. A band owner creates a login, creates a band, and pays for Pro. The account starts free, Pro is included for 30 days with no credit card, then it costs $12 a month. Billing sits on that login. One login can own more than one band. What they pay for is the band page at faneqo.com/{band-slug}. On that page the band adds the links a Linktree-style page would hold, embeds a YouTube video, and features a song. The band also gets a QR code that opens the page, so the page can go on a poster, a screen, or a merch table. A fan who opens the page can join that band's fan list, and the band can message those fans later. Fans do not buy Pro. The public site often says artist for that same band page. The database record is a band. Older articles still say MusicBizQR and describe only smart links and QR codes. Fans are not charged for that. Stripe Connect is an optional way for a fan to pay the artist, and it ships turned off.

Priority **2**, severity **Medium**, effort **S**, repo **qrserver**, findings `BILL-002, BILL-003, BILL-004, BILL-005`, labels: billing, audit.

**Acceptance criteria:**

- [ ] Unset, 0, and values outside 1–1000 omit the application fee.
- [ ] Default payment buttons remain enabled false.
- [ ] The trial stays 30 days, and Stripe amounts stay the same.
- [ ] subscription-active is not newly attached to show mode, the inbox, or galleries.
- [ ] No fan charge is added.
- [ ] plan or subscriptionStatus free still means Lifetime Pro.

**Verification:**

- [ ] Section `bill-002` still matches this page’s inventory title and acceptance criteria
- [ ] Manual check: no product change shipped for this guard without explicit override

**Dependencies:** audit-parent

**Files likely touched:**

- `qrserver/src/utils/billing/platformFee.js` (citation from draft; local trees may be `frontend/` / `backend/`)
- `qrserver/config/paymentButtons.default.js` (citation from draft; local trees may be `frontend/` / `backend/`)
- `qrserver/src/api/stripe/controllers/stripe.js` (citation from draft; local trees may be `frontend/` / `backend/`)
- `qrserver/src/api/subscription/controllers/subscription.js` (citation from draft; local trees may be `frontend/` / `backend/`)
- `qrserver/src/policies/subscription-active.js` (citation from draft; local trees may be `frontend/` / `backend/`)
- `qrserver/src/api/band/routes/band.js` (citation from draft; local trees may be `frontend/` / `backend/`)
- `qrserver/src/api/qr/routes/qr.js` (citation from draft; local trees may be `frontend/` / `backend/`)

**Estimated scope:** S

---

### `dead-002`: Unused pages and unused components are still in the app

**Role:** Actionable

**Description:** Problem. The live homepage is musicbizqr/pages/index.vue, which renders HomeV2Page. A scan on 28 Oct 2026 found other page files that are not that homepage, and component files that nothing imports. Some of those pages still answer on https://faneqo.com. Some are only leftover files. Keeping them makes the next copy change land on a page a band never uses.

The children, each with the problem and the files.

Priority **2**, severity **High**, effort **M**, repo **musicbizqr**, findings `DEAD-002`, labels: audit, tech-debt.

**Acceptance criteria:**

- [ ] The body names dead-003, dead-004, dead-005, and dead-006.
- [ ] No child deletes pages/index.vue, the /home-v2 redirect, pages/install.vue, the labs gate, or server/routes/directqr.ts.
- [ ] No child prints a password from pages/internal/shareables.vue.

**Verification:**

- [ ] Section `dead-002` still matches this page’s inventory title and acceptance criteria
- [ ] Manual check: acceptance criteria pass against product code

**Dependencies:** audit-parent

**Files likely touched:**

- `musicbizqr/pages/index.vue` (citation from draft; local trees may be `frontend/` / `backend/`)

**Estimated scope:** M

---

### `dead-003`: Old homepages are still on the live site

**Role:** Actionable

**Description:** Problem. The live homepage is /. On 28 Oct 2026 these other addresses still returned 200 on https://faneqo.com: /home-classic titled "Classic homepage (reference)", /improved-home titled with MusicBizQR, /nys titled "MusicBizQR NYS", and /discover. Nothing in the product nav links to them. /home-classic is named only by a comment in pages/index.vue and a comment in components/home/HomeRealArtistShowcase.vue. /improved-home is named only by the noindex list and an old audit note. /nys is not linked from the current homepage. /discover builds article links as /article/{slug} and is not in the sitemap. The sitemap's public pages are /, /article, /contact, /privacypolicy, and /termsofservice.

pages/oldpages/ is 18 vue files. Nothing in the app links to those routes. On the same day, /oldpages/testpage and /oldpages/index-old returned the Nuxt 404 "Page not found", not the band-page 404. The files are still in the repo.

Priority **2**, severity **High**, effort **S**, repo **musicbizqr**, findings `DEAD-002`, labels: audit, tech-debt.

**Acceptance criteria:**

- [ ] https://faneqo.com/home-classic, /improved-home, /nys, and /discover redirect to /.
- [ ] The pages/oldpages directory is gone.
- [ ] https://faneqo.com/ still renders the current homepage.
- [ ] /home-v2 still redirects to /.

**Verification:**

- [ ] Section `dead-003` still matches this page’s inventory title and acceptance criteria
- [ ] Manual check: acceptance criteria pass against product code

**Dependencies:** audit-parent

**Files likely touched:**

- `musicbizqr/pages/home-classic.vue` (citation from draft; local trees may be `frontend/` / `backend/`)
- `musicbizqr/pages/improved-home.vue` (citation from draft; local trees may be `frontend/` / `backend/`)
- `musicbizqr/pages/nys.vue` (citation from draft; local trees may be `frontend/` / `backend/`)
- `musicbizqr/pages/discover.vue` (citation from draft; local trees may be `frontend/` / `backend/`)
- `musicbizqr/pages/oldpages/` (citation from draft; local trees may be `frontend/` / `backend/`)
- `musicbizqr/server/middleware/seo-noindex.ts` (citation from draft; local trees may be `frontend/` / `backend/`)

**Estimated scope:** S

---

### `mkt-013`: Do not email the toy band pages

**Role:** Guard (document / do not change product rules)

**Description:** Problem. Forty-six of the 109 public pages match toy rules: the bio equals the name, the text repeats a resume fragment or a store name, or the name ends in a long number. Emailing those addresses burns the Resend reputation and does not create a subscriber. Some of those pages already contain a song. That does not make them a mailing target.

Where. The toy/thin/review labels come from the same local band scan used for mkt-010. That sheet has no owner email. The send in mkt-012 must skip label toy. The public directory hide in mkt-010 uses the same label.

Priority **2**, severity **Medium**, effort **S**, repo **musicbizqr**, findings `MKT-001`, labels: marketing, audit.

**Acceptance criteria:**

- [ ] The completion email recipient query excludes label toy.
- [ ] Toy accounts are not deleted by this draft.
- [ ] A human can change one row from toy to review without editing the send code.
- [ ] The name list is not published on the audit site.

**Verification:**

- [ ] Section `mkt-013` still matches this page’s inventory title and acceptance criteria
- [ ] Manual check: no product change shipped for this guard without explicit override

**Dependencies:** audit-parent

**Files likely touched:**

- (none listed in draft body — use description paths / product trees at remediation time)

**Estimated scope:** S

---

### `vocab-005`: Team screens invent roles the product does not have

**Role:** Actionable

**Description:** Problem. A band has three roles. Owner pays and messages fans. Manager edits the band page. Viewer looks. The role chips and the invite select already say Owner, Manager, and Viewer. The sentence above the invite does not. It says "Invite managers, bandmates, or staff to help manage this artist page" and the button says "Invite Team Member". The team page says "Invite team member" and tells a manager they edit an "artist page". Bandmate, staff, and team member are not roles. There is no fourth role to add.

Where. musicbizqr/components/dashboard/TeamAccessCard.vue. musicbizqr/pages/dashboard/team/[bandId].vue, including the manager help line "Manager — artist page, events, Show Mode, analytics."

Priority **2**, severity **Medium**, effort **S**, repo **musicbizqr**, findings `VOCAB-001`, labels: copy, audit.

**Acceptance criteria:**

- [ ] The team card does not say bandmate, staff, or team member.
- [ ] The manager help line says band page.
- [ ] The invite select still offers only manager and viewer.
- [ ] No new role is added in bandRoles.js.

**Verification:**

- [ ] Section `vocab-005` still matches this page’s inventory title and acceptance criteria
- [ ] Manual check: acceptance criteria pass against product code

**Dependencies:** audit-parent

**Files likely touched:**

- `musicbizqr/components/dashboard/TeamAccessCard.vue` (citation from draft; local trees may be `frontend/` / `backend/`)
- `musicbizqr/pages/dashboard/team/[bandId].vue` (citation from draft; local trees may be `frontend/` / `backend/`)
- `qrserver/src/utils/bandRoles.js` (citation from draft; local trees may be `frontend/` / `backend/`)

**Estimated scope:** S

---

## P3 — Architecture / cleanup

### `arch-001-api`: Band permission, the inbox, and artist updates should be split only if one function does two jobs

**Role:** Actionable

**Description:** Problem. Three API functions are large. The knowledge graph counts 53 connections for requireBandPermission, 44 for createInboxService, and 40 for createArtistUpdateService. Same refactor as the live-show gallery draft. A high count is not itself a bug.

Where. requireBandPermission is in qrserver/src/utils/bandRoles.js. It is the check that the signed-in user may act on that band. createInboxService is in qrserver/src/utils/inbox/directMessaging.js. It is how the artist messages fans. createArtistUpdateService is in qrserver/src/utils/artistUpdates/artistUpdateService.js. It handles the artist's media posts.

Priority **3**, severity **Medium**, effort **XL**, repo **qrserver**, findings `ARCH-001`, labels: tech-debt, audit.

**Acceptance criteria:**

- [ ] The pull request names the mixed jobs with file paths.
- [ ] requireBandPermission still fails closed for a non-member.
- [ ] plan=free, Stripe amounts, and fan charges are unchanged.
- [ ] No reliability bug is claimed from an import cycle alone.

**Verification:**

- [ ] Section `arch-001-api` still matches this page’s inventory title and acceptance criteria
- [ ] Manual check: acceptance criteria pass against product code

**Dependencies:** audit-parent

**Files likely touched:**

- `qrserver/src/utils/bandRoles.js` (citation from draft; local trees may be `frontend/` / `backend/`)
- `qrserver/src/utils/inbox/directMessaging.js` (citation from draft; local trees may be `frontend/` / `backend/`)
- `qrserver/src/utils/artistUpdates/artistUpdateService.js` (citation from draft; local trees may be `frontend/` / `backend/`)

**Estimated scope:** XL

---

### `arch-001-app`: The live-show gallery controller is one large function that may be doing two jobs

**Role:** Actionable

**Description:** Problem. createLivingGalleryController is one large function. A knowledge graph counts 54 connections to it, and 34 of those are marked inferred, which means the graph guessed them. A guessed connection is not proof the function is wrong, and a long file is not a bug by itself. This is one half of a single refactor. The other half is the API draft for band permission, the inbox, and artist updates.

Where. The function is in musicbizqr/features/gallery-experience/living-gallery/livingGalleryController.js. The show screen that calls it is musicbizqr/features/gallery-experience/living-gallery/LivingGalleryViewer.client.vue. The living gallery is the on-screen gallery fans see during a show.

Priority **3**, severity **Medium**, effort **L**, repo **musicbizqr**, findings `ARCH-001`, labels: tech-debt, audit.

**Acceptance criteria:**

- [ ] The pull request names the two jobs that were mixed, with file paths.
- [ ] Behavior of the show-night gallery display is unchanged.
- [ ] Inferred graph edges are not treated as call sites unless a direct read confirms them.

**Verification:**

- [ ] Section `arch-001-app` still matches this page’s inventory title and acceptance criteria
- [ ] Manual check: acceptance criteria pass against product code

**Dependencies:** audit-parent

**Files likely touched:**

- (none listed in draft body — use description paths / product trees at remediation time)

**Estimated scope:** L

---

### `dead-006`: Thirty-seven components have no reference

**Role:** Actionable

**Description:** Problem. A search of vue, js, and ts files, excluding node_modules, found 37 components whose file name, kebab-case name, and path are not used by any other file. The live homepage imports components/home-v2/HomeV2Page.vue. It does not import HomeV2Close, HomeV2ArtistProof, or HomeV2ProductCanvas. The live deck page imports components/decks/mbq/spotify-first/. It does not import the older slides next to that folder, such as HookSpotifyFirst.vue.

Where. musicbizqr/components/AfterShowRecapPanel.vue, ColorSwatchPicker.vue, InfiniteScrollIcons.vue, MaterialCard.vue, MomentumPromptsPanel.vue, ParticlesBackground.vue, SystemStatusCard.vue, TipTapEditor.vue, TrialReminder.vue, band/BandPageStylePreview.vue, dashboard/ShareablesHub.vue, demo/DemoShell.vue, demo/scenes/SceneAgency.vue, demo/scenes/SceneCTA.vue, demo/scenes/SceneSmartLinks.vue, demo/showtime/ShareableCardPlaceholder.vue, home-v2/HomeV2ArtistProof.vue, home-v2/HomeV2Close.vue, home-v2/HomeV2ProductCanvas.vue, labs/LabsEliteGallery.vue, marketing/DemoArtistBackgroundCarousel.vue, messages/MessagesNewMenu.vue, publication/PublicationPrimaryLinks.vue, publication/PublicationSocialStrip.vue, shareables/ShareableMomentCard.vue, smartlink/DevIndicator.vue, and these older deck slides: decks/mbq/DeckAnalyticsMoment.vue, DeckArtistProfileMoment.vue, DeckFanIntelligenceMoment.vue, DeckShowGrowthMoment.vue, FeatureChipsSlide.vue, FinalSpotifyFirstCTA.vue, HookSpotifyFirst.vue, PlatformJourneySlide.vue, QRScanBridge.vue, SpotifyClarifySlide.vue, StreamIsNotRelationship.vue.

Priority **3**, severity **Medium**, effort **M**, repo **musicbizqr**, findings `DEAD-002`, labels: audit, tech-debt.

**Acceptance criteria:**

- [ ] Each deleted file had no remaining import.
- [ ] The live homepage still imports HomeV2Page.vue.
- [ ] The flagship deck still imports the spotify-first slides.
- [ ] No band page, dashboard, or fan page route was removed by this draft.

**Verification:**

- [ ] Section `dead-006` still matches this page’s inventory title and acceptance criteria
- [ ] Manual check: acceptance criteria pass against product code

**Dependencies:** audit-parent

**Files likely touched:**

- `musicbizqr/components/AfterShowRecapPanel.vue` (citation from draft; local trees may be `frontend/` / `backend/`)

**Estimated scope:** M

---

## P4 — Tests

### `test-001-api`: The backend tests do not lock the YouTube caller check or the user-admin secret

**Role:** Actionable

**Description:** Problem. Backend CI runs focused tests and a Strapi build. It does not fail if the YouTube debug routes are registered again, if a non-member can delete a band's YouTube connection, or if the user-admin route accepts the general API token. Missing coverage is not a list of known bugs.

Where. The workflow is qrserver/.github/workflows/ci.yml. Keep these scripts green: qrserver/scripts/test-platform-fee.js and qrserver/scripts/test-ambassador-lifetime-pro.js. The routes under test are the YouTube routes in qrserver/src/api/youtube/routes/youtube.js and validateSecret in qrserver/src/api/user-admin/controllers/user-admin.js.

Priority **4**, severity **Low**, effort **S**, repo **qrserver**, findings `TEST-001, SEC-001, SEC-002`, labels: tests, audit.

**Acceptance criteria:**

- [ ] The new tests fail on the behavior before the fix and pass after the fix.
- [ ] test-platform-fee and test-ambassador-lifetime-pro still pass.
- [ ] CI does not require production secrets.

**Verification:**

- [ ] Section `test-001-api` still matches this page’s inventory title and acceptance criteria
- [ ] Manual check: acceptance criteria pass against product code

**Dependencies:** audit-parent, matching sec/billing rules above

**Files likely touched:**

- `qrserver/src/api/youtube/routes/youtube.js` (citation from draft; local trees may be `frontend/` / `backend/`)
- `qrserver/src/api/user-admin/controllers/user-admin.js` (citation from draft; local trees may be `frontend/` / `backend/`)

**Estimated scope:** S

---

### `test-001-app`: The frontend tests do not lock the rule that free means Lifetime Pro

**Role:** Actionable

**Description:** Problem. Frontend CI runs a focused set of tests and a Nuxt build. Nothing in that suite fails if the value free stops meaning Lifetime Pro. A missing test is not proof the feature is broken.

Faneqo is a website for bands. The band owner pays for Pro: the account starts free, Pro is included for 30 days with no credit card, then it costs $12 a month. Separately, plan or subscriptionStatus free on that login means Lifetime Pro, which is full Pro with no Stripe charge. A limited Free tier is not built. The homepage words "starts free" are the 30-day period, not that database value.

Priority **4**, severity **Low**, effort **S**, repo **musicbizqr**, findings `TEST-001, BILL-001`, labels: tests, audit.

**Acceptance criteria:**

- [ ] A focused test fails if free stops meaning Lifetime Pro.
- [ ] CI still runs on pull requests without a new paid service.

**Verification:**

- [ ] Section `test-001-app` still matches this page’s inventory title and acceptance criteria
- [ ] Manual check: acceptance criteria pass against product code

**Dependencies:** audit-parent, matching sec/billing rules above

**Files likely touched:**

- `musicbizqr/utils/billing/artistEntitlement.js` (citation from draft; local trees may be `frontend/` / `backend/`)

**Estimated scope:** S

---

