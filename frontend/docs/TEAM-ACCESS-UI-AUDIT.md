# Team Access — How It Works + UI Improvement Audit (for ChatGPT)

**Date:** August 3, 2026  
**Purpose:** Paste into ChatGPT before a UI improvement pass.  
**Status:** Phase 2 is live functionally. Manager/viewer edit tools are **not** enabled (Phase 3).  
**Product name:** Team Access

---

## Repos

| Layer | Path | Live |
| --- | --- | --- |
| Frontend (Nuxt 3) | `C:\code\musicbizqr` | `https://faneqo.com` |
| Backend (Strapi v4) | `C:\code\qrserver` | Railway / `STRAPI_URL` |

This audit is for **UI improvement**. Do not redesign the whole dashboard. Do not start Phase 3 permissions.

---

## 1. What Team Access is

Team Access lets a band **owner** invite managers, bandmates, or staff to a **specific artist page** without sharing their login.

It is:
- page access for one artist/band
- owner-controlled invites
- roles: Owner / Manager / Viewer

It is **not**:
- company equity
- ownership of Faneqo
- a workspace / CRM / organization system
- full manager editing yet (Phase 3)

Honest staging line used in UI:
> Some team permissions are being rolled out in stages.

---

## 2. Roles (product meaning vs current reality)

| Role | Promised meaning | Phase 2 reality |
| --- | --- | --- |
| **Owner** | Full access, billing, payouts, team control | True — owns band, manages team |
| **Manager** | Help manage page, shows, recaps, fan follow-up when enabled | Can accept invite + get member row; **cannot broadly edit yet** |
| **Viewer** | Analytics + recaps only | Can accept invite + get member row; **no analytics tools yet** |

UI must stay honest. Prefer “when enabled” / staging note. Never say managers can fully run the page yet.

---

## 3. End-to-end flows

### A) Owner invites someone
1. Owner opens Dashboard → **Team Access** card → **Invite Team Member** / **Manage Team**
2. Goes to `/dashboard/team/:bandId`
3. Enters email + role (`manager` or `viewer`)
4. Backend creates pending invite, stores **token hash only**, emails Lane 1 invite link
5. Pending invite appears on team page (expires in 14 days)
6. Owner can revoke pending invites
7. Owner can remove non-owner members (never owner)

### B) Invitee accepts
1. Opens `https://faneqo.com/invite/accept?token=<rawToken>`
2. If logged out → prompt login/signup; token stored in `localStorage` (`faneqo_pending_invite_token`)
3. After auth, frontend POSTs `/api/invites/accept`
4. Backend requires:
   - logged in
   - valid 64-hex token → hash match
   - status pending
   - not expired
   - logged-in email matches invite email (case-insensitive)
5. Creates/revives active `band-member`
6. Marks invite accepted
7. Success UI: connected to artist page + staging note → **Open Faneqo** (not “you can manage everything”)

### C) Account overview
1. Account page → **My Bands & Access**
2. Owned bands: Owner chip + Open Dashboard + Manage Team
3. Team access rows: role chip only + safe **Open Faneqo**
4. No unsafe “Edit Artist Page” / “Open Dashboard” for managers/viewers yet

---

## 4. Frontend surfaces to improve (UI targets)

### 1) Dashboard card
**File:** `components/dashboard/TeamAccessCard.vue`  
**Mounted in:** `pages/dashboard.vue` (after Show Mode, for owned band)

**Current copy**
- Title: Team Access
- Body: Invite managers, bandmates, or staff to help manage this artist page without sharing your login.
- Staging note: Some team permissions are being rolled out in stages.
- Empty: No team members yet. → Invite Team Member
- Has team/pending: Owner / manager count / pending → Manage Team

**UI job**
Feel elite, obvious, premium for bigger bands. Dark card, subtle border, restrained violet accent, clean role chips. Not buried. Not generic SaaS.

### 2) Team management page
**File:** `pages/dashboard/team/[bandId].vue`  
**Route:** `/dashboard/team/:bandId` (auth; owner-only API)

**Sections**
- Header + staging/page-access note
- Role guide (Owner / Manager / Viewer blurbs)
- Invite form (email + role)
- Current members list
- Pending invites list (expires after 14 days)

**UI job**
Calm, premium, clear hierarchy. Easy invite. Clear pending vs members. No permission matrix. No cartoon icons. Mobile clean, no horizontal overflow.

### 3) Invite accept page
**File:** `pages/invite/accept.vue`  
**Route:** `/invite/accept?token=...`

**States**
- loading
- missing token
- need auth (login/signup)
- wrong email
- expired / revoked / invalid
- generic error
- success

**UI job**
Trustworthy, simple, music-first. Do not overpromise tools after accept.

### 4) Account — My Bands & Access
**File:** `pages/account.vue`

**UI job**
Answer: “What bands do I own or help with?”  
Owned vs Team Access clearly separated. Member rows must stay safe (no edit tools).

---

## 5. Preferred copy (keep / refine, don’t invent Phase 3)

**Dashboard card title:** Team Access  

**Dashboard card body:**  
Invite managers, bandmates, or staff to help manage this artist page without sharing your login.

**Empty CTA:** Invite Team Member  
**Active CTA:** Manage Team  

**Team page title:** Team Access  
**Team page subtitle:** Invite people to help manage this artist page.

**Invite helper:**  
Send an invite to someone who helps with this artist page. They’ll need to accept using the same email address.

**Pending helper:** Invites expire after 14 days.

**Role blurbs**
- Owner: Full access, billing, payouts, and team control.
- Manager: Can help manage the artist page, shows, recaps, and fan follow-up when enabled.
- Viewer: Can view analytics and recaps only.

**Wrong email:**  
This invite was sent to another email address. Please log in with the invited email.

**Accept intro:** You’ve been invited to join a Faneqo artist page.  
**Accept success:** You’re now connected to this artist page. Some team permissions are being rolled out in stages.

**Account title:** My Bands & Access  
**Account helper:** See the artist pages you own or have been invited to help with.

Avoid: workspace, CRM, organization, admin console, co-owner, full access for managers, fan list access for viewers.

---

## 6. Backend contract (UI must respect)

| Method | Path | Who |
| --- | --- | --- |
| GET | `/api/bands/:id/team` | Owner |
| POST | `/api/bands/:id/invites` `{ email, role }` | Owner |
| POST | `/api/bands/:id/invites/:inviteId/revoke` | Owner |
| POST | `/api/bands/:id/members/:memberId/remove` | Owner |
| POST | `/api/invites/accept` `{ token }` | Authenticated invitee |
| GET | `/api/me/band-access` | Authenticated |

Composable: `composables/useBandTeam.js`

Team mgmt routes use `isAuthenticated` + `owns-band`.  
Service also asserts owner.  
Invite email is Lane 1 (Strapi email plugin / mail.faneqo.com), not shows/resendMailer.

Strapi Authenticated permissions needed (may auto-enable on boot):
- getTeam, createInvite, revokeInvite, removeMember, acceptInvite, getMyAccess

---

## 7. UI improvement constraints

### Allowed
- Visual polish of Team Access card / team page / accept page / account section
- Spacing, typography, role chips, hierarchy, mobile layout
- Clearer empty/loading/error/success states
- Subtle staging note placement
- Microcopy polish that stays honest

### Not allowed in this UI pass
- Phase 3 manager/viewer edit access
- Unsafe dashboard links for members
- Viewer fan list / fan email access
- Payments, billing, Stripe, QR, Show Mode, fan messaging, public artist page changes
- Whole dashboard redesign
- New dependencies
- Backend permission model changes (unless a tiny bugfix is required for UI)

### Visual direction
- Dark Faneqo surfaces (`#0f0f12` style)
- Subtle borders
- White headings, muted gray helpers
- Restrained purple/magenta accents
- Small role chips
- Premium, calm, music-first
- No cartoon icons, no giant permission tables, no heavy SaaS gradients

---

## 8. Suggested UI improvement goals

1. Make Team Access feel like a serious feature for bigger bands on the dashboard.
2. Make the team page feel elite and simple: invite → pending → members.
3. Make accept flow feel trustworthy and non-technical.
4. Make Account “My Bands & Access” scannable in 3 seconds.
5. Keep honesty: permissions are rolling out in stages.
6. Mobile: no overflow, CTAs easy to tap, lists readable.

---

## 9. Files most relevant for UI work

```
components/dashboard/TeamAccessCard.vue
pages/dashboard.vue                    (mount location only; avoid broad redesign)
pages/dashboard/team/[bandId].vue
pages/invite/accept.vue
pages/account.vue
composables/useBandTeam.js             (only if user-facing errors need polish)
```

Backend is out of scope for a pure UI pass unless something is broken.

---

## 10. Definition of done for UI pass

- Team Access still obvious on dashboard for owners
- Team page invites/members/pending still work
- Accept page states still clear
- Account member rows still have no unsafe edit links
- Copy never claims full manager/viewer tools are live
- Mobile looks clean
- No payments/QR/Show Mode/public page regressions
- No Phase 3 permission expansion

---

## 11. One-sentence brief for the UI agent

Improve the Team Access Phase 2 UI so it feels elite, obvious, and honest for bigger bands — polish the dashboard card, team page, invite accept page, and account access section — without enabling manager/viewer edit permissions or redesigning the whole dashboard.
