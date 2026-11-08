# Team Access

Owner-controlled invites so managers, bandmates, and staff can help run a Faneqo artist page without sharing a login.

**UI name:** Team Access  
**Full audit (ChatGPT-ready):** [`TEAM-ACCESS-AUDIT.md`](./TEAM-ACCESS-AUDIT.md)  
**Backend deploy:** `qrserver/docs/TEAM-ACCESS.md`

---

## Status

| Phase | What | Status |
| --- | --- | --- |
| 1 | Schemas + `bandRoles` + `has-band-role` foundation | Done |
| 2 | Invite lifecycle + dashboard/account/team UI | Done |
| 3 | Manager/viewer product access + permission matrix | Done (V1) |

V1 is production-oriented: invite → accept → dashboard access → role-gated API + UI. Fan messaging / fan PII remain **owner-only**.

---

## Roles

| Role | Can do | Cannot do |
| --- | --- | --- |
| Owner | Full: page, events, Show Mode, analytics, team, billing/Connect, fan PII/messaging, delete | — |
| Manager | Edit artist page, events, linked QRs, Show Mode operate, analytics | Team, billing/Connect, delete band, fan emails / Message the Room |
| Viewer | View dashboard/analytics/Show Mode status | Mutations, team, billing, fan PII |

Authoritative matrix: `qrserver/src/utils/bandRoles.js` → `permissionsForRole` / `resolveBandAccess`.

---

## Frontend map

| Surface | Path / component |
| --- | --- |
| Dashboard card | `components/dashboard/TeamAccessCard.vue` on `pages/dashboard/index.vue` (owner primary band) |
| Manage team | `/dashboard/team/:bandId` → `pages/dashboard/team/[bandId].vue` |
| Accept invite | `/invite/accept?token=` → `pages/invite/accept.vue` |
| Account overview | `pages/account.vue` → My Bands & Access |
| API composable | `composables/useBandTeam.js` |

Invite token survives signup/login via `localStorage` (`faneqo_pending_invite_*`) **and** `?redirect=` back to `/invite/accept?token=`.

Dashboard loads bands from `GET /api/me/band-access` (owned + team), not owner-filter alone.

---

## Backend map (Strapi)

| Piece | Path |
| --- | --- |
| Permission model | `src/utils/bandRoles.js` |
| Service | `src/api/band/services/band-team.js` |
| Controller | `src/api/band/controllers/band-team.js` |
| Routes | `src/api/band/routes/band-team.js` |
| Role policy | `src/api/band/policies/has-band-role.js` |
| Content types | `src/api/band-member`, `src/api/band-invite` (no generic CRUD) |

### API

```
GET  /api/me/band-access
POST /api/invites/accept                    { token }
GET  /api/bands/:id/team
POST /api/bands/:id/invites                 { email, role }
POST /api/bands/:id/invites/:inviteId/resend
POST /api/bands/:id/invites/:inviteId/revoke
POST /api/bands/:id/members/:memberId/role  { role }
POST /api/bands/:id/members/:memberId/remove
```

Management routes: authenticated + **owner** only (`owns-band` + service assert).

Product routes using role gates:

- `PUT /bands/:id` → owner + manager (`has-band-role`; owner-only fields stripped)
- Show Mode → owner/manager mutate; viewer read
- Events mutate → `manageEvents`
- QR mutate (`owns-qr`) → QR owner **or** band owner/manager

Still owner-only: payments/Connect, band delete, team mgmt, fan list / Message the Room / Fan Intelligence.

---

## Email

Team invites are **Lane 1 transactional**:
- Strapi email plugin
- `EMAIL_DEFAULT_FROM` / `mail.faneqo.com`
- Link: `{PUBLIC_SITE_URL}/invite/accept?token={rawToken}`
- TTL: **14 days**
- Raw token never stored; SHA-256 `tokenHash` only
- Resend rotates token (60s cooldown)

---

## Definition of done (manual)

1. Owner invites manager@…  
2. Invite email arrives with Faneqo link  
3. New account signup returns to accept  
4. Accept → band on dashboard  
5. Manager can edit page / Show Mode; cannot team/billing/fan emails  
6. Owner flips Manager ↔ Viewer → edit UI/API follow  
7. Remove member → immediate 403 on protected routes  
8. Resend / cancel pending invites; canceled/expired tokens fail  

Both **Nuxt** and **qrserver** must be deployed for V1.
