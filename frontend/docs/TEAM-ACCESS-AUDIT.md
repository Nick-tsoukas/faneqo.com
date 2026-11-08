# Team Access — Phase 2 Audit (for ChatGPT)

**Date:** August 3, 2026  
**Status:** Phase 2 built, copy-polished, route/permission harden pass done. **Not Phase 3.**  
**Product UI name:** Team Access  
**Audience:** Paste this entire file into ChatGPT as engineering context. Readable without repo access.

---

## Repos

| Layer | Path | Production |
| --- | --- | --- |
| Frontend (Nuxt 3) | `C:\code\musicbizqr` → `https://faneqo.com` |
| Backend (Strapi v4.24.4) | `C:\code\qrserver` → `STRAPI_URL` (Railway) |

**Companions**
- Short reference: `musicbizqr/docs/TEAM-ACCESS.md`
- Backend deploy: `qrserver/docs/TEAM-ACCESS.md`
- Email lanes: `musicbizqr/docs/EMAIL-LANE2-PHASE1.md` — invites use **Lane 1 only**

---

## 1. One-sentence summary

Faneqo Team Access Phase 2 lets band **owners** invite managers/viewers via hashed, email-matched, Lane-1 transactional invites and manage them from dashboard/account/team UI, while **not** granting managers/viewers real edit tools, billing, payments, QR, or fan PII until Phase 3.

---

## 2. Product intent

Larger bands need managers, bandmates, label people, or staff to help with an **artist page** without sharing the owner login.

This is **page/team access only**:
- NOT company equity
- NOT ownership of Faneqo
- NOT workspace / CRM / organization / enterprise-admin language

### Roles (copy)

| Role | Blurb |
| --- | --- |
| Owner | Full access, billing, payouts, and team control. |
| Manager | Can help manage the artist page, shows, recaps, and fan follow-up when enabled. |
| Viewer | Can view analytics and recaps only. |

Staging note (required while Phase 3 incomplete):
> Some team permissions are being rolled out in stages.

---

## 3. Phase map

| Phase | Status | What |
| --- | --- | --- |
| **1** | Done | `band-member` + `band-invite` schemas; `bandRoles.js`; `has-band-role` policy (exists; not used on Phase 2 team routes) |
| **2** | Done | Owner-only APIs; invite email; accept flow; dashboard card; account section; team page; permission bootstrap |
| **3** | **Not started** | Wire manager/viewer into real edit/read routes |

### Hard do-nots (still true)
- No manager/viewer edit expansion
- No viewer fan PII / fan lists
- No payments, billing, Stripe Connect, QR, public artist page, band delete, Show Mode, fan messaging, subscription changes
- No `shows.faneqo.com` / `resendMailer.js` for invites
- No public CRUD for member/invite
- No team data on public artist pages
- Member bands do not count toward one-band create limit

---

## 4. Data model

### `band-member` (`api::band-member.band-member`)
- `band`, `user`, `role` (`owner|manager|viewer`), `status` (`active|removed`), `invitedBy`, `acceptedAt`
- **Routes:** `routes: []` — no generic CRUD

### `band-invite` (`api::band-invite.band-invite`)
- `band`, `email` (lowercase), `role` (`manager|viewer` only)
- `tokenHash` (**private**, SHA-256 only; never returned)
- `status` (`pending|accepted|revoked|expired`), `expiresAt` (14-day TTL)
- `invitedBy`, `acceptedBy`, `acceptedAt`
- **Routes:** `routes: []` — no generic CRUD

### Role resolution — `src/utils/bandRoles.js`
1. Active `band-member` row → role  
2. Else legacy `band.users_permissions_user` → owner  
3. Lazy owner member backfill on legacy match  

`only-one-band` counts via `users_permissions_user` only.

---

## 5. Backend API

**Files**
- `qrserver/src/api/band/services/band-team.js`
- `qrserver/src/api/band/controllers/band-team.js`
- `qrserver/src/api/band/routes/band-team.js`
- `qrserver/src/utils/bandRoles.js`
- `qrserver/src/api/band/policies/has-band-role.js` (Phase 3-ready; **not** on Phase 2 team routes)
- `qrserver/src/index.js` — bootstrap auto-enables Authenticated Team Access permissions

| Method | Path | Gate | Purpose |
| --- | --- | --- | --- |
| GET | `/api/bands/:id/team` | Auth + **`owns-band`** | Members + pending + summary |
| POST | `/api/bands/:id/invites` | Auth + **`owns-band`** | `{ email, role }` + email |
| POST | `/api/bands/:id/invites/:inviteId/revoke` | Auth + **`owns-band`** | Revoke pending |
| POST | `/api/bands/:id/members/:memberId/remove` | Auth + **`owns-band`** | Remove non-owner |
| POST | `/api/invites/accept` | Auth | `{ token }` accept |
| GET | `/api/me/band-access` | Auth | Owned + team access list |

**Verified registered locally** via `strapi routes:list`:
- `/api/me/band-access`
- `/api/invites/accept`
- `/api/bands/:id/team`
- `/api/bands/:id/invites`
- `/api/bands/:id/invites/:inviteId/revoke`
- (also `/api/bands/:id/members/:memberId/remove`)

### Why `owns-band` (not `has-band-role`) in Phase 2
Earlier Phase 2 used `has-band-role` with `{ roles: ['owner'] }` — unique in this codebase and made Users & Permissions / admin discovery flaky.  
Team routes now match **payments/show-mode** shape: string policies only (`isAuthenticated` + `owns-band`).  
Service still runs `assertOwner` / `getBandRole` as defense in depth.

### Invite / accept rules
- Role lowercase; manager|viewer only
- Reject legacy owner email + already-active members
- Collapse prior pending invites for same email+band
- Raw token = 32 bytes hex (64 chars); store SHA-256 only
- Accept requires `/^[a-f0-9]{64}$/i`, pending, expiresAt present+valid, strict email match
- Idempotent for same user after accepted; other users cannot reuse
- Never return `tokenHash` or raw token in API JSON

### Email (Lane 1)
```
strapi.plugin('email').service('email').send(...)
```
- From: `EMAIL_DEFAULT_FROM` / mail.faneqo.com intent
- Link: `{PUBLIC_SITE_URL|https://faneqo.com}/invite/accept?token=<raw>`
- **Not** `resendMailer.js` / shows domain
- Send failure → invite stays pending; `email_failed` (no raw token)

---

## 6. Strapi permissions (critical deploy)

### Auto-enable on boot (`src/index.js`)
Creates Authenticated permissions if missing:
- `api::band.band-team.getTeam`
- `api::band.band-team.createInvite`
- `api::band.band-team.revokeInvite`
- `api::band.band-team.removeMember`
- `api::band.band-team.acceptInvite`
- `api::band.band-team.getMyAccess`

Bootstrap **never blocks** Strapi boot / admin login if sync fails (warn only).

### Manual check (optional)
Admin → Settings → Users & Permissions → Roles → **Authenticated** → **Band**  
Look for **Band-team** actions (not Band-member / Band-invite).

### Do not enable
- Public for any Team Access actions
- Generic Band-member / Band-invite find/create/update/delete

---

## 7. Frontend

| File | Role |
| --- | --- |
| `composables/useBandTeam.js` | API + `faneqo_pending_invite_token` |
| `components/dashboard/TeamAccessCard.vue` | Dashboard card after Show Mode |
| `pages/dashboard/team/[bandId].vue` | Owner manage page |
| `pages/invite/accept.vue` | Accept states |
| `pages/account.vue` | My Bands & Access |
| `pages/login.vue` + `useFirebase.ts` | Post-auth invite redirect |

### Routes
- `/dashboard/team/:bandId` — auth; owner API
- `/invite/accept?token=` — public accept UX

### Copy (honest Phase 2)
- Card: invite without sharing login + staging note
- Team page: page access not Faneqo ownership; invites expire 14 days
- Accept: “You’ve been invited to join a Faneqo artist page.”
- Success: “You’re now connected…” + staging note → **Open Faneqo** (not full dashboard tools)
- Account team rows: role chip + Open Faneqo only (no unsafe edit links)

---

## 8. Incident / harden notes (Aug 3)

| Problem | Fix |
| --- | --- |
| Team actions not obvious / flaky in Strapi Roles UI | Switch team route policies to `owns-band` (payments pattern) |
| Fear of boot/login break from permission wiring | Bootstrap sync is try/catch; never blocks boot |
| Empty `{}` documentation stubs for new CTs | Removed (do not commit empty doc stubs) |
| Huge local `full_documentation.json` (~14MB) | **Do not commit**; can stress hosts/doc plugin |
| Routes “missing” | Confirmed present via `strapi routes:list` |

---

## 9. Security checklist

| Rule | Result |
| --- | --- |
| Team mgmt owner-only | Pass (`owns-band` + service assertOwner) |
| Cannot invite owner role | Pass |
| Cannot remove owner | Pass |
| tokenHash private + never serialized | Pass |
| Strict email match on accept | Pass |
| Expired/revoked/invalid safe | Pass |
| No public member/invite CRUD | Pass |
| Lane 1 invite email only | Pass |
| Manager/viewer cannot edit yet | Pass (Phase 3 not started) |
| Rate limit invite/accept | **Not built** (noted) |

---

## 10. Deploy checklist

1. Deploy **backend** + restart Strapi  
2. Confirm log: `[band-team] Authenticated permissions ready...`  
3. Confirm admin login works  
4. Optional: verify Band-team actions under Authenticated  
5. Deploy **frontend**  
6. Real invite email smoke (mail.faneqo.com / EMAIL_DEFAULT_FROM)  
7. Password-reset smoke (Lane 1 still works)  
8. Do not commit documentation full dump  

### Smoke
Owner fetch team / invite manager+viewer / cannot invite owner / non-owner 403 / revoke / accept match+wrong email / no tokenHash in JSON / account lists access / managers still cannot edit unsafe routes

---

## 11. Phase 3 backlog (do not do now)

1. Wire `has-band-role` on selected edit routes for managers  
2. Viewer-safe analytics/recaps without fan emails  
3. Safe member dashboard tools only  
4. Optional resend + role change (never owner)  
5. Rate limits on invite/accept  
6. Keep owner-only forever: billing, Connect, delete, team management  

---

## 12. Safe to deploy?

**Yes for Phase 2** after backend restart + permission bootstrap log + invite/password-reset smoke.

**Not safe to claim:** managers/viewers can already run the artist page. That is Phase 3.
