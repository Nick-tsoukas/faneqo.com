# FANEQO V1 COMPLETION AUDIT

**Date:** 2026-09-07  
**Mode:** Audit only. No product repairs. `FANEQO_CURRENT_PHASE.md` and `FANEQO_NEXT_AGENT_HANDOFF.md` were not modified.  
**Nav note:** Artist/fan header work was in progress during this audit. `Header.vue` / `appShell.js` were not treated as final product truth. Core destinations were read from `utils/ui/appShell.js` and dashboard cards, not from in-progress chrome.

Servers reused (not started, not killed):

- Frontend `http://localhost:3000` → 200
- Backend `http://localhost:1337/api/health` → 200

---

## Git snapshot

### Frontend `C:\code\musicbizqr`

- **Branch:** `main`
- **Start of audit:** dirty. Notable: `components/Header.vue`, `utils/ui/appShell.js`, artist-page follow/nav files, phase/handoff docs. Diffstat ~16 files, +369 / −170.
- **End of audit:** `git status --short` empty on `main` (nav / follow frontend work appears to have been committed or otherwise cleared during the session).

### Backend `C:\code\qrserver`

- **Branch:** `main`
- **Status:** dirty throughout. Follow / fan-account work in progress:

```
 M scripts/test-fan-return-to.js
 M scripts/test-labs-boot-requires.js
 M src/api/fan-account/controllers/fan-account.js
 M src/api/fan-account/routes/01-fan-account.js
 M src/api/fan/content-types/fan/schema.json
 M src/api/fan/controllers/fan.js
 M src/api/fan/services/fan.js
 M src/utils/fanAccount.js
?? scripts/backfill-explicit-join-follow.js
?? scripts/test-fan-follow.js
?? src/utils/fans/fanFollow.js
?? src/utils/fans/fanFollowBackfill.js
?? src/utils/fans/fanFollowWrite.js
```

Do not assume a clean production deploy from this working tree.

---

## 1. EXECUTIVE VERDICT

**B. FANEQO V1 IS NEAR COMPLETE**

The core product already exists as one connected system: signup → artist page → Show Mode → check-in → Night / Recap → Story / Recordings / Gallery → Messages → Public Night → Passport. Locked surfaces (Messaging, Public Night, Recordings, Check-In, Show Recap architecture, Passport home, Gallery Stack / Archive) are structurally present and covered by focused tests.

What prevents calling V1 finished today is a **finite P1 list**, not a missing architecture:

1. Billing display / fail-open signup can lie about price or grant Pro without Stripe truth.
2. Artist analytics can be read without auth.
3. The labeled **Create Event** path can fail in ordinary ways (required poster, globally unique titles, silent edit failure).
4. Unauthenticated artist bookmarks land on the marketing homepage instead of login.

No P0 (data loss, payment processor broken, fan PII cross-account, core route down) was confirmed.

No major new feature is required. Gallery Create/Edit premium pass, iOS-native pass, Passport 100-artist UI, Share Kit 2.0, Night Object, and Artist Page V3 are **POST-V1**.

---

## 2. PRODUCT LOOP SCORE

### Artist loop

| Step | Score | Notes |
| --- | --- | --- |
| Signup | P1 | Trial-without-card exists. Email path does not show price. Google fail-open + default `trialing`. |
| Artist page | NOT PROVEN | Public `/badflower` 200. Edit/publish of featured song/video is code-present, not auth-walked. |
| Show / Event | P1 | Create Event requires a poster; titles are globally unique; edit fails silently. Manual Show Mode does not need an Event. |
| Show Mode | PASS (code + tests) | Activate / already-live / end / recap queue proven in unit tests. Not live-operated in this audit. |
| Fan capture | PASS (code + tests) | Check-in attendance is canonical; badge off critical path. Offline queue shows success by design. |
| End show | PASS (code) | Deactivate does **not** send messages. Recap generated async + cron fallback. |
| Recap | PASS (code + tests) | Enrichment survives regen. Manager `my-recaps` / `latest/me` **fixed** (13/13). |
| Story | PASS (code + tests) | Recap enrichment PATCH. |
| Recording | PASS (code + tests) | YouTube / Spotify / audio / MP4. Gated upload cannot publish. 24/24 backend. |
| Gallery | PASS for public create | `/galleries/new` Night-vs-General exists. **No in-app edit.** Not a V1 blocker if create works. |
| Message | PASS (regression tests) | Locked. 59/59 direct-messaging. UI contracts pass. Not live-sent. |
| Public Night | PASS (code + UI tests) | Order in **code** is Story → From the Stage → From the Night → On Stage. Anonymous night 404 for unknown slug is correct. No real published Night smoked. |
| Analytics | P1 | Page + most rollup APIs are public. |

### Fan loop

| Step | Score | Notes |
| --- | --- | --- |
| Check-in | PASS (code + tests) | 18/18 experience tests. Returning language not faked on check-in. |
| Relationship | PASS (code + tests) | Native Follow separate from email. Check-in does not set Follow. |
| Message | PASS (tests) | Fan inbox/thread contracts pass. Not live-received. |
| Public Night | PASS (code + UI tests) | YOU WERE THERE / ordinal server-derived. |
| Audio/video | PASS (code + tests) | Audio first, video second, click-to-play, no autoplay. |
| Gallery | PASS (code + tests) | Stack + public gallery experience tests. |
| Passport | PASS (code + tests) | Index → Public Night. Artist photo never used as Night media. |
| Artist continuation | PASS (code) | Public Night stay-with-artist. |

Authenticated fan return-to (Passport / Night → login → back) is **code + unit proven**, not browser-proven.

### Business / billing loop

| Step | Score |
| --- | --- |
| Homepage CTA → `/signup` | PASS |
| Trial, no card | PASS (code) |
| Displayed price | P1 (`$12` homepage vs `$7` account) |
| Stripe customer + subscription | PASS on happy path; P1 on Stripe failure / metadata write failure |
| Success → workspace | P2 asymmetry (email → `/signupSuccess` → login; Google → dashboard) |
| Portal / cancel | CODE-INSPECTED ONLY |
| Webhooks + daily cron | CODE-INSPECTED ONLY |
| Post-trial lock | Band/QR writes gated. Messaging / Show Mode / galleries are **not** `subscription-active`. |

---

## 3. P0 — RELEASE BLOCKERS

**None confirmed.**

Checked and not found:

- Fan PII / attendance / inbox cross-band leakage in messaging and recap tests
- `my-recaps` / `latest/me` owner-only regression (fixed)
- Payment charged from a hardcoded Price ID (IDs are env-only)
- Production SW precache of `test-*.html` (guarded; test passes)
- End-show accidentally sending messages
- Public Night / recordings exposing S3 internals (serializer tests pass)

---

## 4. P1 — MUST FIX TO CALL V1 COMPLETE

### P1-1. Account page tells paying users they renew at $7; homepage/SEO say $12

- **Status:** **FIXED** in code (2026-09-07 Pass 1). Account now formats `GET /api/stripe/billing` → `subscription.price`. Homepage `$12` remains marketing copy, not Account truth.
- **Production env:** **STILL NEEDS PRODUCTION ENV VERIFICATION** of `STRIPE_DEFAULT_PRICE_ID` on Railway (qrserver) and Nuxt deploy (musicbizqr). Local/available env may differ.

### P1-2. Google signup grants a session if Stripe fails; default status is `trialing`

- **Status:** **FIXED** in code (2026-09-07 Pass 1). New Google signup is fail-closed (no JWT, unpaid row). Schema default is `unpaid`. Existing billed Google users still authenticate during temporary Stripe trouble without fabricating Pro.

### P1-3. Email register can succeed without saving Stripe IDs

- **Status:** **FIXED** in code (2026-09-07 Pass 1). Register writes Stripe metadata in the canonical user create. Success requires persisted customerId / subscriptionId / status / trialEndsAt when applicable. User-create failure cleans up only Stripe objects created in that request.

### P1-4. Artist analytics are readable without authentication

- **Defect:** `GET /api/analytics/rollups|geo|transitions|follows|pulse|event-*|qr-*` are `auth: false` and keyed only by `bandId`. `pages/analytics/[id].vue` has no `middleware: 'auth'`. Live probe: `GET http://localhost:1337/api/analytics/rollups?bandId=1&range=7d` → **200** with totals. `/analytics/1` → **200** anonymous.
- **User impact:** Any party who can guess a band id can scrape views, clicks, plays, QR scans, cities, devices, sources. Not fan emails, but private artist business data.
- **Where:** `qrserver/src/api/analytics/routes/analytics.js`; `controllers/analytics.js` `rollups`; contrast `dashboardGlance` which correctly uses `requireBandPermission(..., "viewAnalytics")`. `pages/analytics/[id].vue`.
- **Evidence:** Route file + live 200 on local Strapi.
- **Smallest repair:** Require auth + `viewAnalytics` on every analytics read. Add `middleware: 'auth'` on the page. Keep write/track endpoints as they are if they must stay public.
- **Scope:** M · both
- **Tests:** Unauthed rollups → 401/403. Other-band JWT → 403. Owner/manager → 200.

### P1-5. Event titles are globally unique

- **Defect:** `events.title` has `unique: true` at the collection level, not per band. Two artists cannot both have “Friday Night”.
- **User impact:** Ordinary show names fail create with a confusing uniqueness error / possible 500.
- **Where:** `qrserver/src/api/event/content-types/event/schema.json` L15–18. Slug is also unique (L115–118) — expected. Title uniqueness is the defect.
- **Evidence:** Schema read.
- **Smallest repair:** Drop title uniqueness (keep slug unique). Frontend duplicate check must be per-band, not global.
- **Scope:** M · backend + small frontend
- **Tests:** Two bands can create the same title; same band + same slug still conflicts.

### P1-6. Create Event requires a poster; backend image is optional

- **Defect:** `newevent.vue` passes `required` into `EventPosterField`, which HTML-requires a file when there is no preview. Event schema `image.required: false`. Manual Show Mode does not need an Event, but the dashboard’s primary **Create Event** CTA does.
- **User impact:** An artist ready to list a show without a flyer cannot submit the main create form.
- **Where:** `pages/newevent.vue` (~L222–227); `components/events/EventPosterField.vue`; `event/schema.json`.
- **Evidence:** Source read.
- **Smallest repair:** Remove `required` (match backend + Show Mode). Keep poster as recommended, not blocking.
- **Scope:** S · frontend
- **Tests:** Composer/create script: submit without image succeeds; with image still works.

### P1-7. Edit Event failures are silent

- **Defect:** `submitEditEvent` catch only `console.error`s. Overlay “Saving changes…” drops; user stays on the form with no error.
- **User impact:** Artist believes save worked or the app ate the click. Edits lost without explanation.
- **Where:** `pages/editevent/[id].vue` (~L652–655).
- **Evidence:** Source read.
- **Smallest repair:** Surface the existing error pattern used on `newevent` (alert or inline role=alert). Stop the overlay on failure (already sets `loading = false`).
- **Scope:** S · frontend
- **Tests:** Mock PUT 400/500 → visible error, no dashboard navigation.

### P1-8. Unauthenticated artist `auth` middleware sends users to `/`

- **Defect:** `middleware/auth.ts` `navigateTo('/')`. Fan auth correctly returns to `/fan/login?redirect=…`.
- **User impact:** Bookmarked `/dashboard`, `/messages`, `/nights` dump onto marketing. Looks like a logout/dead end.
- **Where:** `middleware/auth.ts` L10–13.
- **Evidence:** Source read. PowerShell cannot follow the Nuxt redirect cleanly; behavior is in the middleware.
- **Smallest repair:** Redirect to `/login` with sanitized `redirect` (reuse `sanitizeAuthReturnTo`). Do not send fans to artist login.
- **Scope:** S · frontend
- **Tests:** Extend `test-auth-shell.mjs`: unauthenticated `/dashboard` → `/login?redirect=/dashboard`.

---

## 5. P2 — POST-V1

Keep tight. Do **not** repair these in the V1 finish pass.

- Gallery **edit** after publish (create/publish of a public Night gallery works).
- Gallery Create/Edit “premium pass” / redesign.
- Full iOS-native pass, Share Kit 2.0, Night Object, Music Memory, Artist Page V3, Rive additions, Atropos.
- Passport 100-artist density UI; featured track/video on Passport chapters.
- Night recording play analytics.
- Email vs Google post-signup path asymmetry (email → signupSuccess → login; Google → dashboard).
- `subscription-active` only on band/QR writes; post-trial messaging/Show Mode still open (product decision, then lock consistently).
- Auth middleware missing on `/createband`, `/newevent`, `/editband` (mutations already 401/403; shells still render).
- Offline check-in success-before-ack (intentional venue queue; not fake returning language).
- `/fans` vs `/fan` naming; Event vs Show vs Night vocabulary on dashboard.
- Sitemap includes articles + legal, not every Artist Page / Night (SSR/share meta exist).
- Legacy `$7` / “keep your page forever” on **non-production** homes (`improved-home.vue`, `home-classic.vue`).
- Docs: `FANEQO_CURRENT_PHASE.md` Public Night order is stale vs code (see below).
- `test-show-mode-integrity.js` 2 failures: stale fixture dates (2026-09-05) vs 24h start window on 2026-09-07 — **test debt**, not a live Show Mode break. `test-night-enrichment.js` 24/24 and `test-show-mode-nights-pass.mjs` pass.
- Multi-band workspace switcher.
- Marketer `MBQ_MONTHLY_PRICE` default 7.
- `RESEND_WEBHOOK_SECRET` missing in an environment would stop bounce suppression — **ops verify**, not a code hole.

---

## 6. VERIFIED / NO ACTION

| System | Proof |
| --- | --- |
| Show Recap manager / team auth (`my-recaps`, `latest/me`) | `test-show-recap-band-auth.js` **13/13**. Uses `resolveAuthorizedWorkspaceBand`. |
| Night enrichment persistence | `test-night-enrichment.js` **24/24**. Regen keeps story/lineup/hero/note. |
| Night Recordings | Backend **24/24**; UI **15/15**. Gated upload cannot publish. Audio before video. No autoplay. |
| Public Night composition | `test-public-night-world-ui.mjs` **24/24**. YOU WERE THERE / ordinal server-derived. |
| Messaging (locked) | Home/composer/sent/thread/broadcast UI tests pass. `test-direct-messaging.js` **59/59**. |
| Check-in | `test-show-checkin-experience.mjs` **18/18**. Badge off success path. |
| Passport | UI + presentation + backend passport tests pass. Night visual never falls back to artist portrait. |
| Fan returnTo | Frontend + backend sanitizer tests pass. Legacy `/fan/passport/nights/:id` → `/fan/passport`. |
| Protected media | `test-protected-media.js` **24/24**. No S3 in public serializers. |
| Public band serializer | **6/6**. Show Mode internals not in public payload. |
| Native Follow | `test-fan-follow.js` **12/12**. Not email, not attendance. |
| PWA precache safety | `test-pwa-precache-safety.mjs` ok. `globIgnores` `test-*.html`; `navigateFallback: ''`. |
| Gallery public create path | Composer tests + `/galleries/new` Night vs General IA. |
| Share / QR (artist) | `test-artist-share-drawer.mjs` 7/7. New QRs use `qr.faneqo.com`. |
| Auth shell | `test-auth-shell.mjs` **13/13**. |
| Labs not in production nav | `/labs` links only inside Labs. Middleware 404s unenrolled users. |
| End show ≠ message send | `deactivateShowMode` only clears live fields + queues recap. |

---

## 7. SIGNUP / STRIPE VERDICT

**Not safe enough to call finished for paying users** until P1-1, P1-2, and P1-3 are fixed.

Actual contract in code (not old docs):

- No free plan is provisioned on signup.
- Every register / Google signup tries to create a Stripe customer + subscription with a **30-day trial, no card**.
- Homepage: “Free account. Pro included for 30 days. No card required.” + FAQ **$12/mo after trial**. That matches the happy path.
- Access gate: `subscription-active` on **band and QR mutations only**.
- Price IDs are env-only (`STRIPE_DEFAULT_PRICE_ID`). No hardcoded Price IDs found.
- Production homepage does **not** promise a forever-free artist page. Legacy homes do — ignore for production truth.

Unknown without Stripe Dashboard / env: whether the live Price is $12 or $7.

---

## 8. AUTH / PERMISSIONS VERDICT

**Backend authorization for the Night / messaging / recordings / fan-intelligence core is in good shape.** Manager Recap history is fixed. Cross-band conversation tests pass. Follow routes require JWT.

Gaps that remain V1-relevant:

- Analytics reads are public (P1-4).
- Artist `auth` middleware → `/` (P1-8).
- One JWT for artist and fan; route IA separates them. Fan-only JWTs can **open** some artist shells; APIs reject mutations. P2 unless a shell leaks private fields (editband uses public band GET).

`show-live.vue` **does** use `getMyBandAccess` / `resolveWorkspaceBand` (older “owner-only show-live” note is stale).

---

## 9. ARTIST ONBOARDING VERDICT

**Not a V1 blocker.** First dashboard empty states exist: create artist page, create event, create QR. Show Mode sits on the dashboard. After a show, `ShowModeCard` links the Recap and “View all Nights”. Messages is a primary workspace link in `appShell.js`.

A new artist can reach first value without a new onboarding product. Dashboard still reads like a SaaS inventory (Events / QR / pages). That is P2 taste, not a completion defect.

**In flux:** header/nav was being edited during this audit. Do not lock chrome from this session.

---

## 10. SHOW / SHOW MODE / CHECK-IN VERDICT

**Show Mode + check-in are complete enough for V1** once Event create/edit P1s are fixed (or artists use manual Show Mode only).

- Manual vs event-backed, 6 AM ceiling, already-live conflict, extend, end, recap queue: implemented.
- End show does not message fans.
- Check-in: canonical attendance, duplicate = already checked in, no fake “returning” on the modal, badge optional.
- Show Mode integrity script: 16 pass / 2 fail — **stale dates vs 24h window**, not a live activation bug. Do not treat as a product P1.

---

## 11. NIGHT / RECAP VERDICT

**Complete for V1.** Creation after end, enrichment persistence, Story / Lineup / Poster / Hero / galleries / recordings / private note, preview = real Public Night, manager access — verified in tests.

Artist Recap section order (Story → Recordings → From the Night → Lineup) differs from Public Night (Stage before Night). That is intentional operator vs fan hierarchy, not a defect.

---

## 12. GALLERY CREATE/EDIT VERDICT

**A new premium Create/Edit pass is NOT required before V1.**

A normal artist **can** create and publish a useful **public** Night or General gallery from `/galleries/new` (Night vs “Something else” → upload → visibility → publish). Composer tests cover 12-photo show cap, reorder, retry, return-to-composer.

They **cannot** edit a published gallery in-app. That is P2. Gated “Fans / People who were there” depends on protected delivery readiness and correctly falls back to public — not a V1 blocker for the public path.

---

## 13. NIGHT RECORDINGS VERDICT

**Locked and complete for V1.** Artist add/edit/delete/reorder/visibility, gated-upload publish block, public audio-first / video-second, no autoplay, empty omission, Recap uses the same `NightRecordingItem`. Analytics correctly deferred. Do not reopen the player.

---

## 14. MESSAGING VERDICT

**Locked. No P0/P1 regression found.** Inbox / Sent / compose / gallery attach / fan thread / cooldown / suppression / unsubscribe / UI honesty (no fake reads) all look intact. Do not redesign.

---

## 15. PUBLIC NIGHT VERDICT

**Complete in code.** Canonical fan Night. Permissions add controls; they do not fork presentation.

### Doc vs code conflict

| Source | Order |
| --- | --- |
| This audit’s product brief / **CODE** (`PublicNightExperience.vue`) | Hero → Story → **From the Stage** → **From the Night** → On Stage → artist |
| `FANEQO_CURRENT_PHASE.md` / handoff | Hero → Story → **From the Night** → **From the Stage** → On Stage |

**Code is product truth.** Phase/handoff text is stale. Do not “fix” the UI to match the doc.

---

## 16. PASSPORT VERDICT

**Complete enough for V1.** Relationship/history index → Public Night. Artist grouping, ordinal, distinct Night identities, no artist portrait as Night media, login remap of legacy night URLs. 100-artist scale UI is P2.

---

## 17. ANALYTICS VERDICT

**Core metrics exist** (views, clicks, song/video plays, QR, sources, devices, cities). **Not V1-complete** until P1-4 (auth). Night recording analytics remain deferred — not incomplete.

`dashboard-glance` is the correct auth pattern. Copy it.

---

## 18. MOBILE VERDICT

**No new V1 mobile blocker found in code/tests.** Check-in, Public Night, gallery, messaging, recordings, and auth-shell tests include 390 / safe-area / 16px input / 44px target contracts.

A full iOS-native pass is **not** required to finish V1. Header/dock was in flux — re-smoke 390 after nav lands, as a **verify** step, not a redesign.

---

## 19. PWA / SERVICE WORKER VERDICT

**Historical precache failure is addressed.** `globIgnores: ['**/test-*.html']`, empty `navigateFallback`, denylist for account/dashboard/messages/fan/analytics/receipts. `test-pwa-precache-safety.mjs` passed.

`public/test-*.html` files may still ship; they are not precached. P2 hygiene.

---

## 20. SEO / HOMEPAGE TRUTH VERDICT

Production `/` is `HomeV2Page`. Canonical `https://faneqo.com`. Trial / no-card copy matches register. Messaging and Show Mode claims match the product. FAQ $12 matches intended Pro, **not** the account page (P1-1).

Homepage still visually leans on a check-in **badge** story (`HomeShowModeMessagingSection`). Badge is off the critical path. P2 copy drift, not a signup lie.

Sitemap is static + articles, not every artist/Night. Artist/Night/Gallery have SSR/share heads. P2.

`/__dev/*` is noindex and not in production nav. `/labs` is gated.

---

## 21. PERFORMANCE / ACCESSIBILITY VERDICT

No P1 performance or a11y defect proven. Recordings are click-to-play (no eager YouTube/Spotify). Gallery Stack caps DOM. PWA image cache excludes gated artist-update URLs.

V1 a11y bar (focus, labels, Escape, contrast, reduced-motion) is asserted in several UI tests; **not** fully keyboard-walked in a browser this session. Treat remaining a11y as P2 unless a core control is unusable.

---

## 22. TESTS RUN + EXACT RESULTS

| Command | Result | Meaning |
| --- | --- | --- |
| `musicbizqr` `node scripts/test-pwa-precache-safety.mjs` | pass | SW install guards present |
| `test-public-night-world-ui.mjs` | 24 ok | Public Night contract |
| `test-night-recordings-ui.mjs` | 15 ok | Recordings UI + hierarchy |
| `test-artist-recap-night-ui.mjs` | 14 ok | Recap Night content |
| `test-gallery-composer.mjs` | 9 ok | Create path |
| `test-gallery-composer-return.mjs` | ok | Return path |
| `test-fan-passport-ui.mjs` | ok | Passport UI |
| `test-passport-presentation.mjs` | ok | Presentation helpers |
| `test-show-checkin-experience.mjs` | 18 passed | Check-in locked path |
| `test-fan-auth-boundary.mjs` | 15 passed | Fan auth / returnTo |
| `test-messages-home-ia.mjs` | pass | Inbox IA |
| `test-composer-presentation.mjs` | ok | Composer locked |
| `test-sent-presentation.mjs` | ok | Sent locked |
| `test-fan-messaging.mjs` | 12 passed | Fan identity/thread |
| `test-thread-presentation.mjs` | ok | Thread |
| `test-in-app-broadcast-ui.mjs` | pass | Broadcast UI |
| `test-show-mode-ui-state.mjs` | ok | Show Mode UI |
| `test-show-mode-nights-pass.mjs` | ok | Nights pass |
| `test-public-gallery-experience-ui.mjs` | 18 ok | Public gallery |
| `test-artist-share-drawer.mjs` | 7 passed | QR/share |
| `test-auth-shell.mjs` | 13 passed | Auth presentation |
| `qrserver` `node scripts/test-show-recap-band-auth.js` | 13/13 | Manager Nights **fixed** |
| `test-night-recordings.js` | 24/24 | Recordings backend |
| `test-night-enrichment.js` | 24/24 | Regen / auth |
| `test-protected-media.js` | 24/24 | Media security |
| `test-fan-passport.js` | pass | Passport backend |
| `test-fan-return-to.js` | 5 passed | returnTo |
| `test-in-app-campaign-audience.js` | pass | Audience |
| `test-direct-messaging.js` | 59/59 | DM / isolation |
| `test-fan-follow.js` | 12 passed | Follow vs email |
| `test-public-band-serializer.js` | 6 passed | Public band |
| `test-show-mode-integrity.js` | **16 passed, 2 failed** | **Stale test** (fixed 2026-09-05 times vs 24h window on 2026-09-07). Not a product P1. |

No tests were modified.

---

## 23. REAL ROUTE PROOF MATRIX

| Route | Proof |
| --- | --- |
| `/` homepage | REAL ANONYMOUS (200) |
| `/login` `/signup` `/signupSuccess` `/fan/login` | REAL ANONYMOUS (200) |
| `/discover` `/contact` `/privacypolicy` `/termsofservice` | REAL ANONYMOUS (200) |
| `/badflower` artist page | REAL ANONYMOUS (200) |
| `/badflower/night/does-not-exist` | REAL ANONYMOUS (404 — correct) |
| `/analytics/1` | REAL ANONYMOUS (200 — **defect**, P1-4) |
| `/newevent` `/createband` | REAL ANONYMOUS (200 — shell without auth, P2) |
| `/dashboard` `/messages` `/fan/passport` `/galleries` `/nights` `/account` | CODE-INSPECTED (auth middleware → `/`) |
| `/labs` | CODE-INSPECTED (middleware 404 / auth) |
| `/__dev/messages` | LAB/FIXTURE ONLY (200, noindex) |
| Artist Show Mode operate | CODE-INSPECTED + tests |
| Artist Recap / recordings / gallery publish | CODE-INSPECTED + tests |
| Fan check-in / Passport / messages live | CODE-INSPECTED + tests |
| Stripe portal / webhooks live | CODE-INSPECTED ONLY |
| Authenticated core loop in browser | **NOT VERIFIED** (no artist/fan session used) |

Never treat Labs / `__dev` as production proof.

---

## 24. CONSOLE / NETWORK FINDINGS

Anonymous HTTP only (no browser lock — nav work in progress).

- `GET /api/analytics/rollups?bandId=1` → **200** unauthenticated (P1-4).
- `GET /api/health` → 200.
- `GET /api/bands?...` public list returns artist fields (expected for public pages).
- `GET /api/show-recaps?...` → 404 unauthenticated (good).
- No production SW install was exercised in a browser this session.

---

## 25. FILES CREATED

- `docs/FANEQO_V1_COMPLETION_AUDIT.md` (this file)

No other files written. No commits. No pushes. No deploys.

---

## 26. EXACT V1 REPAIR PLAN

P0/P1 only. No P2. No Gallery redesign. No nav redesign.

**Repair 1 — Billing truth (P1-1, P1-2, P1-3)**  
Confirm live Stripe Price. One display constant. Fail closed on Stripe/metadata failure (no unbounded `trialing`).  
→ Tests: register/social failure cases; account/homepage price same source.

**Repair 2 — Analytics auth (P1-4)**  
`requireBandPermission(..., 'viewAnalytics')` on reads; `middleware: 'auth'` on `pages/analytics/[id].vue`.  
→ Tests: unauth 401/403; cross-band 403; owner 200.

**Repair 3 — Event create/edit (P1-5, P1-6, P1-7)**  
Drop global title unique; poster optional; visible edit errors.  
→ Tests: two bands same title; create without image; edit 500 shows error.

**Repair 4 — Login redirect (P1-8)**  
`auth.ts` → `/login?redirect=…`.  
→ Tests: auth-shell unauthenticated artist path.

**Final smoke (after repairs, with real auth)**  
Signup → dashboard → create page → manual Show Mode → check-in → end → Recap Story + Recording + public Gallery → message (test mode) → Public Night → Passport → analytics (must 401 when logged out).  
390 + 1280. Do not send production broadcasts or create paid charges.

---

## 27. ESTIMATED DISTANCE TO FINISHED

- **0 P0**
- **8 P1**
- **4 bounded repair passes** + one authenticated smoke

No calendar estimate.

---

## 28. FINAL ANSWERS

**CAN A BAND COMPLETE THE CORE FANEQO LOOP WITHOUT ASSISTANCE?**  
**NOT FULLY PROVEN** — architecture and tests say the Night loop works; Event create P1s and the lack of an authenticated walkthrough prevent YES.

**CAN A FAN COMPLETE THE CORE FAN LOOP WITHOUT CONFUSION?**  
**NOT FULLY PROVEN** — code/tests say yes; not browser-walked with a real fan session.

**ARE SIGNUP, AUTH AND BILLING SAFE ENOUGH FOR PAYING USERS?**  
**CODE FIXED — PRODUCTION ENV CHECK REMAINS** — P1-1 / P1-2 / P1-3 repaired in Pass 1. Live `STRIPE_DEFAULT_PRICE_ID` amount is not production-verified.

**ARE THERE ANY KNOWN P0 DEFECTS?**  
**NO**

**ARE THERE ANY KNOWN P1 DEFECTS?**  
**YES**

**IS GALLERY CREATE/EDIT ACTUALLY BLOCKING V1?**  
**NO**

**IS A FULL IOS-NATIVE PASS ACTUALLY BLOCKING V1?**  
**NO**

**IS ANY MAJOR NEW FEATURE REQUIRED TO COMPLETE V1?**  
**NO**

**VERDICT:**

**FANEQO V1 IS NEAR COMPLETE**

---

## Challenge of old roadmap items

| Item | V1 required? |
| --- | --- |
| Gallery Create/Edit premium pass | **NO** — public create works |
| Full iOS-native pass | **NO** |
| Passport 100-artist scale UI | **NO** |
| Featured Track/Video in Passport | **NO** |
| Share Kit 2.0 | **NO** |
| Night recording analytics | **NO** |
| Deeper Music Memory | **NO** |
| Artist Page redesign | **NO** |
| Advanced Night Object | **NO** |
| Show Mode manager auth | **Already done** — do not reopen |

---

## Doc conflicts recorded (code wins)

1. Public Night section order: **code** = Stage then Night. Phase/handoff docs are reversed.
2. Master roadmap still lists manager Night auth as ACTIVE. **Code + tests: fixed.** Phase file already says Show Mode + Nights LOCKED.
3. Phase ACTIVE = Gallery Create/Edit. **This audit: not required to finish V1.**

---

STOP. No repairs. No commit. No push. No deploy.
