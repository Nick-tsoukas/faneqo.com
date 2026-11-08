# Email Lane 2 — Phase 1 Audit (Resend REST + List-Unsubscribe)

**Date:** July 31, 2026  
**Scope:** Dedicated band-to-fan Resend REST mailer; migrate Show Mode “Message the Room” onto it; add List-Unsubscribe headers; one-click POST unsubscribe.  
**Audience:** paste into ChatGPT as engineering context. Readable without repo access.

Companion: `docs/FAN-MESSAGING-AUDIT.md` (full deliverability plan), `docs/SHOW-MODE.md`.

---

## 1. Goal

Show Mode emails already send, but the Strapi Resend provider / installed SDK cannot forward custom headers. Without `List-Unsubscribe` and `List-Unsubscribe-Post`, band-to-fan mail cannot scale safely.

Phase 1 creates **Lane 2** (direct Resend REST) for Show Mode only, and leaves **Lane 1** (transactional) untouched.

---

## 2. Two-lane architecture (confirmed)

| Lane | Domain | Transport | Used for |
| --- | --- | --- | --- |
| **1 — Transactional** | `mail.faneqo.com` | Strapi email plugin + existing Resend provider | Password reset, confirmations, billing / subscription |
| **2 — Band-to-fan** | `shows.faneqo.com` | `src/utils/resendMailer.js` → `POST https://api.resend.com/emails` | Show Mode “Message the Room” now; fan-list campaigns later |

Confirmed env (do not change in this phase):

- `SHOW_MAIL_FROM=shows@shows.faneqo.com`
- `EMAIL_DEFAULT_FROM=Faneqo <hello@mail.faneqo.com>`
- `EMAIL_DEFAULT_REPLY_TO=support@faneqo.com`
- `PUBLIC_SITE_URL=https://faneqo.com`
- `RESEND_API_KEY`, `RESEND_WEBHOOK_SECRET` set
- Cloudflare Email Routing: `support@`, `dmarc@`, `unsubscribe@` forward correctly

---

## 3. What changed

### Backend (`qrserver`)

| File | Change |
| --- | --- |
| `src/utils/resendMailer.js` | **New.** `sendOne({ from, to, replyTo, subject, html, text, headers, tags, idempotencyKey })` via global `fetch`. No new deps. No SDK upgrade. |
| `src/api/show-recap/services/show-message.js` | Send loop uses `resendMailer.sendOne` instead of `strapi.plugin('email')`. Adds List-Unsubscribe headers. Fixes `showLabel()` trim / separator. |
| `src/api/fan/controllers/fan.js` | `POST /api/fans/unsubscribe` accepts token from body **or** query; invalid/missing tokens return `200 { success: false }` (idempotent-safe for one-click clients). |

### Frontend (`musicbizqr`)

| File | Change |
| --- | --- |
| `server/routes/unsubscribe.post.ts` | **New.** RFC 8058 one-click handler for `POST /unsubscribe?token=…` (Gmail → site URL). Proxies to Strapi. Always 200. |
| `pages/unsubscribe.vue` | Checks `response.success` (API no longer 404s invalid tokens). Human GET page flow unchanged. |

### Explicitly untouched

- Strapi email plugin / provider config
- Resend SDK version
- Password reset, confirmation, billing, subscription send paths (`stripe`, `subscription`, `test-email`, Connect webhook)
- Sending domains / DNS
- Consent model
- General fan-list campaign UI

---

## 4. `resendMailer.sendOne` contract

```js
const result = await sendOne({
  from,              // required
  to,                // string | string[]
  replyTo,           // → body.reply_to
  subject,           // required
  html, text,        // at least one required
  headers,           // plain object → Resend headers
  tags,              // [{ name, value }]
  idempotencyKey,    // → Idempotency-Key request header
});

// success
{ ok: true, id, raw }

// failure (never throws for HTTP/network — caller checks ok)
{ ok: false, status, error, raw }
```

Does not log email bodies. Does not use the Strapi email plugin.

---

## 5. How Show Mode messaging sends now

1. Eligibility unchanged: attendance for `campaignId`, subscribed only, 24h per-fan cooldown, 60-day show age, 2-minute double-submit guard, bounce/complaint suppression via existing webhook.
2. Per recipient: mint/ensure unsubscribe token → build HTML/text → `resendMailer.sendOne`.
3. From: `"Band Name via Faneqo" <shows@shows.faneqo.com>` via `SHOW_MAIL_FROM`.
4. Reply-To: band user email when available.
5. Headers on every message:
   - `List-Unsubscribe: <https://faneqo.com/unsubscribe?token=…>, <mailto:unsubscribe@faneqo.com>`
   - `List-Unsubscribe-Post: List-Unsubscribe=One-Click`
6. Idempotency key: `show-message:{recapId}:{fanId}:{messagesSentCount}` so a retry of the same send wave does not double-accept at Resend.
7. Tags: `lane=band_to_fan`, `kind=show_message`.
8. On `ok`, bump `lastMessagedAt` and recap send counters (same as before).

---

## 6. Unsubscribe paths

| Path | Who uses it | Behavior |
| --- | --- | --- |
| GET `/unsubscribe?token=` → Vue page → POST Strapi `{ token }` | Human clicks footer link | Shows confirmation UI; optional resubscribe |
| POST `/unsubscribe?token=` (Nitro) → POST Strapi | Gmail / Apple one-click | No confirmation; 200; no auth |
| POST `/api/fans/unsubscribe` | Both of the above | Token = credential; already-unsubscribed = success |

Mail scanners prefetching GET still do **not** unsubscribe (page JS must run). One-click is POST-only by design (RFC 8058).

---

## 7. `showLabel` formatting fix

Before: `filter(Boolean).join(', ')` could render `"the happy place , millington"` when venue/city had padding.  
After: trim each part, join with ` · `, fallback to trimmed `showTitle` or `"the show"`. Display-only; no schema change.

---

## 8. Manual test checklist (production / staging)

After deploy of **both** frontend and backend:

**Show Mode message (Lane 2)**

- [ ] Send Message the Room to a test address
- [ ] Gmail original: From uses `shows@shows.faneqo.com`
- [ ] Reply-To is the band email
- [ ] SPF / DKIM / DMARC pass
- [ ] `List-Unsubscribe` present
- [ ] `List-Unsubscribe-Post: List-Unsubscribe=One-Click` present
- [ ] Native Gmail unsubscribe control appears (when Gmail chooses to show it)
- [ ] One-click POST unsubscribes (or footer page still works)
- [ ] Venue/city line uses ` · ` without stray spaces

**Transactional (Lane 1 — must still work)**

- [ ] Password reset still sends
- [ ] From still uses `mail.faneqo.com` / `EMAIL_DEFAULT_FROM`
- [ ] No regression in billing/subscription mail

---

## 9. Remaining risks before general fan-list messaging

1. **Volume / warm-up** — `shows.faneqo.com` reputation is still young; ramp carefully.
2. **No List-Unsubscribe on older sends** — only messages after this deploy carry headers.
3. **Per-band circuit breaker** — not built yet; one bad band can still hurt the shared shows domain.
4. **Campaign job runner** — general fan-list needs queued sends, idempotency, audience definitions; do not bolt onto the Show Mode loop.
5. **Consent split** — still a single subscribe/unsubscribe for show follow-ups; revisit before marketing blasts.
6. **CAN-SPAM physical address** — still missing from footer for broader campaigns.
7. **SDK / provider** — intentionally left old; do not “fix” transactional by upgrading Resend until Lane 1 is planned separately.

---

## 10. One-sentence summary

Show Mode “Message the Room” now sends through a dedicated Resend REST helper from `shows.faneqo.com` with RFC 8058 unsubscribe headers and a POST `/unsubscribe` one-click handler, while password reset and all other Strapi email-plugin traffic stay on `mail.faneqo.com` untouched.
