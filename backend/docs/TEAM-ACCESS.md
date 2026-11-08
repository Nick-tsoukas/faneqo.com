# Team Access — Backend

Strapi-side invite lifecycle + permission model for Faneqo Team Access V1.

**Frontend docs:** `musicbizqr/docs/TEAM-ACCESS.md`

---

## Files

| File | Purpose |
| --- | --- |
| `src/api/band-member/.../schema.json` | Membership rows |
| `src/api/band-invite/.../schema.json` | Pending invites + `tokenHash` |
| `src/utils/bandRoles.js` | `getBandRole`, `resolveBandAccess`, permission matrix |
| `src/api/band/policies/has-band-role.js` | Role gate for band routes |
| `src/api/band/services/band-team.js` | Invite / role / remove business logic |
| `src/api/band/controllers/band-team.js` | HTTP handlers |
| `src/api/band/routes/band-team.js` | Content-API routes |

---

## Routes

| Method | Path | Policies |
| --- | --- | --- |
| GET | `/me/band-access` | authenticated |
| POST | `/invites/accept` | authenticated |
| GET | `/bands/:id/team` | authenticated + owns-band |
| POST | `/bands/:id/invites` | authenticated + owns-band |
| POST | `/bands/:id/invites/:inviteId/resend` | authenticated + owns-band |
| POST | `/bands/:id/invites/:inviteId/revoke` | authenticated + owns-band |
| POST | `/bands/:id/members/:memberId/role` | authenticated + owns-band |
| POST | `/bands/:id/members/:memberId/remove` | authenticated + owns-band |

Product gates (not team routes):

- `PUT /bands/:id` → `has-band-role` `['owner','manager']` + strips Connect/billing fields for non-owners
- Show Mode controller → owner/manager mutate; viewer read
- Event create/update/delete → `manageEvents`
- `owns-qr` → QR owner or band owner/manager

Still owner-only: payments, band delete, team mgmt, fan PII / messaging.

---

## Deploy

1. Ship code and **restart Strapi**.
2. Boot sync enables Authenticated permissions for all `band-team.*` actions including `resendInvite` and `updateMemberRole`.
3. Confirm `PUBLIC_SITE_URL=https://faneqo.com` and Lane 1 email env.
4. Do **not** enable Public or generic band-member / band-invite CRUD.

---

## Tokens

- 32-byte crypto random → 64 hex chars
- Stored as SHA-256 `tokenHash` only
- TTL 14 days; single-use after accept; revoked after cancel
- Resend rotates hash (60s cooldown via `updatedAt`)

---

## Logging (no raw tokens)

`invite created`, `invite email requested`, `invite accepted`, `invite canceled`, `membership revoked`, `membership role changed`
