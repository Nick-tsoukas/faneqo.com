# Faneqo Fan Messaging — Audit & Deliverability Plan

**Date:** July 31, 2026
**Scope:** Post-show fan messaging (band → the people who checked in at a show), consent and unsubscribe, and email sending reputation.
**Audience:** engineers and advisors. Written to be readable without repo access.

Companion docs: `docs/SHOW-MODE.md` (the system that captures these fans), `docs/FANS.md`.

---

## 1. Context in one paragraph

Faneqo is a music-first smart-link and fan-relationship platform for bands. Its core promise is *"Bands don't need more links. They need fans they can reach again."* Show Mode is the capture half: during a live show the band's public artist page turns into a check-in surface, and every fan who checks in is recorded with the show's identity. Fan messaging is the **reach-again half** — from the post-show recap, the band emails everyone who was in the room. Fans have no accounts and never will; the email address typed at check-in is the entire relationship.

Stack: Nuxt 3 frontend (`faneqo.com`), external Strapi v4 backend on Railway (Postgres, server clock UTC), Resend as the email provider.

---

## 2. What is built today

### 2.1 Flow

1. Fan checks in at a show → `fan` row created or updated, tied to that band, carrying `status`, `consentVersion`, `consentTextSnapshot`, `captureCampaignId`. A `fan-show-attendance` row records that they were verifiably at *that* show.
2. Show ends → a `show-recap` row is generated for the campaign.
3. Band opens the recap in the dashboard and sees "Message the room."
4. Band writes a subject line and a body, confirms, and the backend emails everyone eligible.
5. Every email carries a one-click unsubscribe link tied to a per-fan token.

### 2.2 Endpoints

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/api/show-recaps/:id/message` | Band session | Recipient count, cooldown split, send eligibility, default subject |
| POST | `/api/show-recaps/:id/message` | Band session | Send. Body `{ subject, note }` |
| POST | `/api/fans/unsubscribe` | Token in body | Public opt-out |
| POST | `/api/fans/resubscribe` | Token in body | Undo |
| POST | `/api/email-events/resend` | Svix signature | Bounce and complaint webhook |

### 2.3 Key files

**Backend (`qrserver`)**
- `src/api/show-recap/services/show-message.js` — recipients, limits, template, send loop
- `src/api/show-recap/controllers/show-recap.js` — `messagePreview`, `sendMessage`, ownership check
- `src/api/fan/services/fan.js` — `ensureUnsubscribeToken`, `unsubscribeByToken`, `resubscribeByToken`, `suppressByEmail`
- `src/api/email-event/` — Resend webhook receiver
- `src/utils/svixSignature.js` — webhook signature verification
- `scripts/check-show-message.js`, `scripts/check-svix-signature.js` — 34 assertions over the pure logic

**Frontend (`musicbizqr`)**
- `components/dashboard/fans/ShowMessageComposer.vue` — composer, mounted inline on `/fans/recaps/:id`
- `pages/unsubscribe.vue` — public opt-out page
- `composables/useShowRecaps.js` — `getMessagePreview`, `sendRecapMessage`

### 2.4 Data model additions

On `fan`: `unsubscribeToken` (private), `unsubscribedAt`, `lastMessagedAt`, `suppressionReason` (`manual` | `bounced` | `complained`).
On `show-recap`: `messagesSentCount`, `lastMessageSentAt`, `lastMessageRecipientCount`.

> **Deployment note:** these are new Strapi schema fields and require a backend restart to sync.

---

## 3. Controls currently in place

**Consent is captured and stored.** Each fan row keeps `consentVersion` and a `consentTextSnapshot` — the literal wording they agreed to. This is the evidence base if consent is ever challenged.

**Recipients are provably present.** The send list comes from `fan-show-attendance` rows for that campaign, not from the band's whole list. Duplicate-suppressed rows are excluded, and unsubscribed fans are dropped.

**Per-fan cooldown, not per-show quota.** A fan is skipped if they were emailed in the last 24 hours (`lastMessagedAt`), regardless of which show is sending. An earlier design capped messages per show; that limited the wrong axis, since a band with eight recaps could mail the same overlapping people repeatedly while a band with one show was throttled.

**Recency guard.** Shows older than 60 days are closed to messaging. Mailing a crowd that no longer remembers the band is the fastest route to spam complaints.

**Double-submit guard.** Two-minute lockout after a send.

**Working unsubscribe.** A per-fan token, minted lazily on first send. The mailed link points at a frontend page that POSTs on mount — deliberately *not* a GET endpoint, because inbox providers and security scanners prefetch links in email and would silently unsubscribe people who never clicked. Scanners do not execute page JavaScript.

**Bounce and complaint suppression.** Resend webhooks are verified against the Svix signature scheme (implemented on `crypto`, no new dependency, using the raw body via the same mechanism as the existing Stripe webhook). Hard bounces and spam complaints suppress the address across **all** bands, because a dead mailbox is dead for everyone and a complaint is against the shared sending domain. Soft bounces are ignored.

**Recognisable sender.** Mail goes out as `"The Powerlines via Faneqo" <address>` rather than a bare Faneqo name. Sender recognition is the strongest single predictor of not being marked as spam.

**Escaping.** Subject and body are HTML-escaped before templating.

---

## 4. Current DNS and sending posture (verified July 31, 2026)

Live DNS lookups against the production domain:

| Record | Value | Status |
| --- | --- | --- |
| `resend._domainkey.mail.faneqo.com` TXT | RSA public key | Present — DKIM configured |
| `send.mail.faneqo.com` TXT | `v=spf1 include:amazonses.com ~all` | Present — SPF configured |
| `send.mail.faneqo.com` MX | `feedback-smtp.us-east-1.amazonses.com` | Present — bounce return-path configured |
| `_dmarc.faneqo.com` TXT | — | **MISSING** |
| `_dmarc.mail.faneqo.com` TXT | — | **MISSING** |
| `shows.faneqo.com` | — | Does not exist yet |

**Reading:** `mail.faneqo.com` is a correctly provisioned Resend sending subdomain (this is exactly the record set Resend issues). The root domain has no TXT records of its own. **There is no DMARC record anywhere on the domain.**

Everything currently sends from one identity, `EMAIL_DEFAULT_FROM` on `mail.faneqo.com`: account confirmation emails (`subscription.js`), Stripe and billing notices (`stripe.js`), and now band-to-fan messages.

---

## 5. Findings

Ordered by severity.

### F1 — No DMARC record (critical, blocks safe launch)

There is no `_dmarc` record on `faneqo.com` or `mail.faneqo.com`. Since February 2024, Gmail and Yahoo require a DMARC policy for bulk senders, and its absence weakens placement for everyone else. It also means Faneqo has zero visibility into spoofing of its domain and no aggregate reports on authentication failures.

DKIM and SPF alone are not enough. DMARC is what tells receivers the two are meaningfully aligned and what to do when they aren't.

**This should be fixed before the first bulk send, not after.**

### F2 — Bulk and transactional mail share one sending identity (critical)

Band messages leave from the same domain as password resets, account confirmations, and Stripe receipts. Spam complaints attach to the sending domain, not to the band. One band writing a bad message to a cold list can therefore push a *different* band's password reset into spam — and Faneqo's own billing mail with it.

This is the failure mode that is invisible until it is severe, because reputation degrades gradually and silently.

**Decision already taken: a dedicated subdomain will be added.** See §6.

### F3 — `reply_to` was silently dropped (fixed July 31, 2026)

The installed Resend SDK is **0.11.1**, which is several major versions old. Its `sendEmail` whitelists exactly these fields:

```js
{ from, to, bcc, cc, reply_to, subject, text, html, attachments }
```

The Strapi provider (`strapi-provider-email-resend`) passes `replyTo` (camelCase). That key is not in the whitelist, so it was discarded — meaning **the "replies go to the band" behaviour did not work**, and neither does `EMAIL_DEFAULT_REPLY_TO` for any other email in the system.

Fixed by sending both `replyTo` and `reply_to`. The provider spreads unrecognised options into the payload, so `reply_to` now reaches the SDK. No dependency change required.

**Still worth verifying by sending a real message and hitting reply.**

### F4 — One-click unsubscribe headers are impossible on the current SDK (high)

Gmail's bulk sender requirements include RFC 8058 one-click unsubscribe: a `List-Unsubscribe` header plus `List-Unsubscribe-Post: List-Unsubscribe=One-Click`. This puts an "Unsubscribe" control in Gmail's own UI, which is *the* mechanism that keeps people from using the spam button instead.

Resend SDK 0.11.1 cannot send it. The field whitelist above drops `headers` entirely. There are two ways out:

- **Upgrade `resend`** to a current version (4.x+). Modern versions support `headers` and use `resend.emails.send()`. This also means updating or replacing `strapi-provider-email-resend`, which still calls the legacy `sendEmail` against the legacy `/email` endpoint. This is a dependency change and needs explicit sign-off.
- **Bypass the provider for these sends** and POST directly to `https://api.resend.com/emails` for band messages only, leaving transactional mail on the existing path. Smaller blast radius, slightly more code.

An in-body unsubscribe link exists today and is honoured, so this is a deliverability optimisation rather than a compliance hole at low volume — but it becomes mandatory at scale.

### F5 — Sends run inline in the HTTP request (medium)

The send loop batches five at a time inside the request. A club show is fine. A few hundred recipients will be slow, and a thousand-plus risks a gateway timeout with a partial send already committed. There is no job queue in the backend today.

### F6 — No per-band volume ceiling (medium)

The cooldown limits how often *one fan* is reached. Nothing limits how much total mail *one band* generates across many shows. A band with 30 recaps in the window could send a lot of mail in a day. Worth a simple daily cap once there is real usage data.

### F7 — No send log (low)

`messagesSentCount` and `lastMessageSentAt` record that something was sent, not what. There is no way to answer "what did this band actually say?" during a complaint investigation.

### F8 — Suppression is global by design; document it (low)

`suppressByEmail` unsubscribes an address across every band. This is correct for bounces and defensible for complaints, but it means Band B loses a fan because of Band A's message. Worth stating in the product's own docs so it is never mistaken for a bug.

---

## 6. The subdomain plan (decided — must be done)

**Goal:** isolate bulk band-to-fan mail from transactional account and billing mail, so that reputation damage in one cannot affect the other.

**Proposed layout**

| Purpose | Subdomain | Sender |
| --- | --- | --- |
| Account, billing, password (existing) | `mail.faneqo.com` | `Faneqo <noreply@mail.faneqo.com>` |
| Band → fan messages (new) | `shows.faneqo.com` | `"<Band> via Faneqo" <shows@shows.faneqo.com>` |

The code already supports this. `buildFromHeader()` reads `SHOW_MAIL_FROM` and falls back to `EMAIL_DEFAULT_FROM`, so nothing changes until the variable is set.

### Step 1 — Add the sending domain in Resend

Add `shows.faneqo.com` as a new domain in the Resend dashboard, in the same region as the existing one (`us-east-1`, per the current return-path record). Resend will issue three records, matching the pattern already live for `mail.faneqo.com`:

- a DKIM TXT at `resend._domainkey.shows.faneqo.com`
- an SPF TXT at `send.shows.faneqo.com` — `v=spf1 include:amazonses.com ~all`
- an MX at `send.shows.faneqo.com` → `feedback-smtp.us-east-1.amazonses.com`

### Step 2 — Add those records in Cloudflare

Enter them exactly as issued. Two details that commonly break this:

- **DNS only.** The proxy (orange cloud) must be off for mail records.
- **Do not let Cloudflare append the zone twice.** If the UI shows the full name for a record you entered as `resend._domainkey.shows`, you may end up with `...shows.faneqo.com.faneqo.com`. Verify after saving.

Wait for Resend to show the domain as verified before sending anything.

### Step 3 — Add DMARC (this is F1, and it is the important one)

A DMARC record on the organisational domain covers all subdomains, so **one record fixes both `mail.` and `shows.`**.

Start in monitoring mode so nothing is rejected while you confirm alignment:

```
Name:  _dmarc.faneqo.com
Type:  TXT
Value: v=DMARC1; p=none; rua=mailto:dmarc@faneqo.com; fo=1; adkim=r; aspf=r
```

Collect reports for two to four weeks, confirm all legitimate mail passes, then tighten:

```
v=DMARC1; p=quarantine; pct=100; rua=mailto:dmarc@faneqo.com; adkim=r; aspf=r
```

and eventually `p=reject` once you are confident. Use a monitoring service for the aggregate reports if raw XML is unappealing.

### Step 4 — Set the environment variable

In Railway:

```
SHOW_MAIL_FROM=shows@shows.faneqo.com
```

The band name is added at send time, producing `"The Powerlines via Faneqo" <shows@shows.faneqo.com>`. Setting a bare address is correct here; do not include a display name in the variable.

### Step 5 — Point the webhook at the bounce handler

In Resend, add a webhook endpoint for `email.bounced` and `email.complained`:

```
https://<strapi-host>/api/email-events/resend
```

Copy the signing secret into Railway as `RESEND_WEBHOOK_SECRET`. **Until this is set the endpoint rejects every delivery**, which is intentional — an unauthenticated caller must never be able to unsubscribe fans.

### Step 6 — Warm the new subdomain

A brand-new sending subdomain has no reputation. Going from zero to a few thousand emails looks exactly like a compromised account.

Send low volumes first — a handful of real shows — before anything large. Faneqo's natural usage pattern is gentle here, since a club show yields tens of recipients, so this will likely take care of itself. Avoid launching the feature with a mass backfill to every past attendee. The 60-day recency guard already prevents the worst version of that.

### Step 7 — Verify

- Send a real message to yourself from a recap; confirm the From reads `"<Band> via Faneqo"`.
- In Gmail, "Show original" and confirm **SPF: PASS, DKIM: PASS, DMARC: PASS**.
- Hit reply and confirm it addresses the band's account email, not `noreply` (this validates the F3 fix).
- Click the unsubscribe link, confirm the fan's status flips, and confirm the undo works.
- Trigger a bounce by sending to a known-invalid address on a real domain and confirm the fan is suppressed with `suppressionReason: 'bounced'`.

---

## 7. Recommended work after the subdomain

Ranked by value per effort.

1. **One-click unsubscribe headers (F4).** Decide between upgrading `resend` and posting directly to the API for band messages. This is the highest-value remaining deliverability item.
2. **Monitor the complaint rate.** Gmail's danger threshold is roughly 0.3%. Resend exposes this; it should be watched from the first real send, because it is the number that decides everything else.
3. **Move sending to a background job (F5)** before any band has a list in the hundreds.
4. **Per-band daily volume cap (F6).**
5. **Send log (F7)** — a `show-message` content type storing subject, body, recipient count, and timestamp.

---

## 8. Open questions

- Should a fan who unsubscribes from one band be unsubscribed from all of them? Today: only for provider-driven suppression (bounce, complaint); a manual unsubscribe is per band. Is that the right split?
- Should bands be able to message attendees of *multiple* shows at once (for example, everyone from a tour)? Currently strictly one campaign at a time.
- Is 60 days the right recency cut-off? It is a single constant, `MAX_SHOW_AGE_DAYS`.
- Is 24 hours the right per-fan cooldown? Also a single constant, `FAN_COOLDOWN_HOURS`.
- Should there be a plain-text preview or a test-send-to-self before a real send?

---

## 9. Environment variables

| Variable | Status | Purpose |
| --- | --- | --- |
| `RESEND_API_KEY` | Set | Resend authentication |
| `EMAIL_DEFAULT_FROM` | Set | Shared sender; still used for transactional mail |
| `EMAIL_DEFAULT_REPLY_TO` | Set, but ineffective | Dropped by the SDK field whitelist — see F3 |
| `RESEND_WEBHOOK_SECRET` | **Not set** | Required for bounce/complaint handling |
| `SHOW_MAIL_FROM` | **Not set** | Dedicated bulk sender; the subdomain work above |
| `PUBLIC_SITE_URL` / `PUBLIC_HOSTNAME` | Optional | Base URL for unsubscribe links; defaults to `https://faneqo.com` |

---

## 10. How to re-run the checks

```bash
cd qrserver
node scripts/check-show-message.js     # limits, template, sender identity
node scripts/check-svix-signature.js   # webhook signature verification
```

Both are dependency-free and exit non-zero on failure. Neither touches the database or sends mail.
