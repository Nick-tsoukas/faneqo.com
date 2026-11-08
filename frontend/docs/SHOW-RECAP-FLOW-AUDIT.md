# Show Recap Flow — Audit (end of show → recap → message)

**Date:** July 31, 2026
**Scope:** what happens between a band ending Show Mode and being able to message the people who checked in.
**Audience:** written to be understood without repo access.

Related: `docs/SHOW-MODE.md` (full system), `docs/FAN-MESSAGING-AUDIT.md` (email and deliverability).

---

## 1. The system in one paragraph

Faneqo is a fan-relationship platform for bands. **Show Mode** is a temporary state on a band record that turns their public artist page into a live-show check-in surface. Everything captured during that window — fans, interactions, check-ins — is tagged with one **campaign ID**. When the show ends, the metrics for that campaign are frozen into a **show recap** row. From the recap, the band can email everyone who checked in. Fans have no accounts; the email they typed at check-in is the whole relationship.

Two repos: Nuxt 3 frontend (`faneqo.com`), Strapi v4 backend on Railway (Postgres, UTC server clock).

---

## 2. The flow, end to end

1. Band clicks **Turn Off Show Mode** in `ShowModeCard` on `/dashboard`.
2. `POST /api/bands/:id/show-mode/deactivate` (authenticated, ownership-checked).
3. Backend `deactivateShowMode()`:
   - reads the band **first** and captures `showModeCampaignId`
   - snapshots the show context (type, start time, event id, title, venue, city, region, country, timezone) — necessary because the next step erases those fields
   - clears all `showMode*` fields, sets `showModeEndedAt`, and archives the id to `showModeLastCampaignId`
   - fires `generateShowRecap({ bandId, campaignId, showContext })` inside `setImmediate` — fire-and-forget, so deactivation never blocks on it
   - returns `{ status: 'off', enabled: false, campaignId, endedAt, recapQueued }`
4. `generateShowRecap` counts fans, interactions, engagement tiers, and breakdowns for that campaign and writes one `show-recap` row. It is **idempotent by `campaignId`** — running it twice updates rather than duplicates.
5. Frontend keeps the returned `campaignId`, shows *"Generating your show recap…"*, and polls `GET /api/show-recaps/latest/me` every 2.5s for up to 45s, matching on `campaignId`.
6. On match: *"Show recap ready."* with check-in and fan counts, plus **View Recap** and **Message the Room**.
7. Both buttons deep-link to `/fans/recaps/<id>` (with `?message=1` for the second), a dedicated page rather than a modal. Legacy `/fans?recap=<id>` links are forwarded to it.
8. `ShowMessageComposer` lives inline on that page. With `message=1` it opens already expanded and scrolls into view.

**Safety net:** a cron every 15 minutes generates any recap that should exist and doesn't, finding it via `showModeLastCampaignId`.

---

## 3. The reported bug and its cause

**Report:** started Show Mode, checked in as a fan, manually ended the show. Check-in worked. No recap appeared and there was no way to message the room.

**Cause: discovery, not generation.** The backend path was already correct — campaign ID preserved, context snapshotted, recap fired, no early return for a show with zero fans. The recap was almost certainly written.

What was missing is that **the recap only surfaced on `/fans`**, in a card the band had no reason to open, while the dashboard they were standing on collapsed to a compact "Ready for live events" state and said nothing at all. `ShowMessageComposer` was mounted only inside the recap detail modal, which only opened from that one card. The deactivate endpoint also returned nothing but `{ status: 'off', enabled: false }`, so the frontend had no campaign ID to look anything up with.

The fix surfaces the recap where the band already is, and returns enough from deactivate to find it.

---

## 4. Investigation answers

| # | Question | Answer |
| --- | --- | --- |
| 1 | What does "End Show" call? | `POST /api/bands/:id/show-mode/deactivate`, then a status refresh |
| 2 | What does deactivate return? | Previously `{ status, enabled }`. Now also `campaignId`, `endedAt`, `recapQueued` |
| 3 | Is `campaignId` preserved before clearing? | Yes — read first, snapshotted, and archived to `showModeLastCampaignId` |
| 4 | Does `generateShowRecap` run after manual end? | Yes, via `setImmediate`, with the context snapshot |
| 5 | Where are failures logged? | `[ShowMode] Failed to generate show recap` (error + stack); a distinct warning if it returns null |
| 6 | Is a row created? | Yes. No early return for zero fans — an empty show yields a recap of zeros |
| 7 | Where was it displayed? | Originally only a modal on `pages/fans.vue`; now its own page at `/fans/recaps/:id` |
| 8 | Is messaging only on the recap detail? | Yes, and still is — now reachable directly from the dashboard |
| 9 | Did the dashboard fetch the recap? | No. It refreshed status and collapsed to the OFF state |
| 10 | Backend, frontend, or UX? | Missing UX and discovery. Backend generation was sound |

---

## 5. What changed

**Backend — `src/api/band/services/showMode.js`**
- `deactivateShowMode` returns `campaignId`, `endedAt`, `recapQueued`
- logs the recap id on success; warns distinctly when generation returns null rather than throwing
- error log now includes the stack

**Frontend**
- `components/dashboard/ShowModeCard.vue` — post-show panel with generating / ready / timeout states, campaign-matched polling, and a retry
- `pages/fans/recaps/[id].vue` — dedicated recap page; `?message=1` opens the composer
- `pages/fans/index.vue` — forwards legacy `?recap=<id>&message=1` links to that page
- `components/dashboard/fans/ShowRecapDetailContent.vue` — recap body, passes `autoOpenMessage` down
- `components/dashboard/fans/ShowMessageComposer.vue` — accepts `autoOpen`, expands and scrolls into view

No changes to recap generation, cron, email sending, or the homepage.

---

## 6. Behaviour in each case

| Case | Result |
| --- | --- |
| Show with check-ins | Panel shows counts, both buttons; Message the Room opens the composer |
| Show with zero check-ins | Recap still generates; panel shows 0 check-ins; Message the Room hidden; composer says nobody checked in |
| Generation fails outright | Poll times out at 45s → "Still generating. Check back in a minute." + "Try generating recap" (`POST /api/show-recaps/generate`). Cron also retries every 15 min |
| Dashboard reloaded after ending | Watch resumes from `localStorage` (`mbq_pending_recap`), expiring after 6 hours |
| Cancelling a *scheduled* show | No panel — that show never ran, so there is no recap |
| Ownership | All recap reads remain scoped to the caller's band. Nothing is public |

---

## 7. Known limits and open decisions

**Recap generation is still fire-and-forget.** Kept deliberately so ending a show returns instantly. The cost is that the frontend must poll. The alternative — generating synchronously and returning the recap id — would delete the polling entirely but make "End Show" slower. **This is an open product decision.**

**Polling uses "latest recap", not "recap by campaign".** There is no `GET /api/show-recaps/by-campaign/:campaignId` endpoint, so the card fetches the most recent recap and compares its `campaignId`. Correct in practice, since the recap just created is the newest. A dedicated lookup would be more direct.

**Recap metrics are frozen at generation.** Interactions arriving afterwards are not counted unless someone regenerates.

**The `scheduled` state is effectively unreachable.** Event auto-activation goes straight to live, so scheduled sessions rarely exist in practice.

**Two recap systems coexist.** `/api/show-recaps/*` powers the dashboard; `/api/fan-moments/recap-active` is a separate shareable-oriented path with no current frontend consumer.

---

## 8. Debugging if a recap is still missing

1. Check the band row for `showModeLastCampaignId` and `showModeEndedAt`. Both set means deactivation ran.
2. Search logs for `[ShowMode] Show recap generated` (success, includes recap id), `[ShowMode] Show recap generation returned nothing`, or `[ShowMode] Failed to generate show recap`.
3. Look for a `show-recap` row with that `campaignId`.
4. If missing, wait 15 minutes for the cron (`[cron] Generated missing show recap`) or force it with `POST /api/show-recaps/generate` and `{ campaignId }`.
5. If the row exists but the dashboard says "still generating", the issue is the poll match — confirm the recap's `campaignId` equals the one deactivate returned.

Useful log prefixes: `[ShowMode]`, `[cron]`, `[CheckIn V2]`, `[ShowMessage]`.
