# Show Recap Discovery & Archive — Audit

**Date:** July 31, 2026  
**Scope:** how a band finds, revisits, and acts on Show Recaps after a show ends — dashboard persistence, archive/history, Message the Room entry points, dismiss behavior, and back navigation.  
**Audience:** written to be understood without repo access. Suitable to paste into ChatGPT as product/engineering context.

Related:

- `docs/SHOW-MODE.md` — full Show Mode system
- `docs/SHOW-RECAP-FLOW-AUDIT.md` — end-of-show → generate → message flow
- `docs/FAN-MESSAGING-AUDIT.md` — email / deliverability (unchanged by this work)

**Out of scope for this change (intentionally untouched):**

- Email deliverability / Resend mailer
- Show Mode check-in logic
- Badge generation / share logic
- Homepage

---

## 1. Product framing in one paragraph

A **Show Recap** is not a temporary notification. It is a permanent show record: what happened at that live session (check-ins, fans captured, interactions), tied to a `campaignId`, with an optional path to **Message the Room** (email everyone who checked in). After Show Mode ends, the dashboard used to surface a "Show recap ready" panel — but **Dismiss hid the recap forever** from the dashboard. The only recovery path was Fan Analytics (`/fans`), which only made the *latest* recap obvious. That was wrong for the product. Recaps must be easy to find forever.

---

## 2. The problem this work fixed

| Before | After |
| --- | --- |
| Dismiss on the post-show panel wiped recap access from the dashboard | Dismiss collapses only the loud alert; compact "Latest Show Recap" remains |
| No dedicated history of past shows | Archive at `/fans/recaps` with load-more |
| Fan Analytics was the hidden doorway into recaps | Explicit **Show Recaps** entry on Fan Intelligence + Show Mode card |
| Back from recap detail always went to Fan Analytics | Context-aware back: dashboard, Fan Analytics, or archive |
| `getRecaps` existed in the client but had no UI | Archive page uses it; failures are no longer flattened into "empty" |

---

## 3. System map (what exists now)

### Routes

| Route | Purpose |
| --- | --- |
| `/dashboard` | Show Mode card + persistent Latest Show Recap panel |
| `/fans` | Fan Analytics; still shows a "Last Show Recap" card as a secondary doorway |
| `/fans/recaps` | **Archive** — paginated list of all show recaps (newest first) |
| `/fans/recaps/:id` | Recap detail + Message the Room composer |
| `/fans/recaps/:id?message=1` | Same page, composer auto-opens and scrolls into view |
| `/fans?recap=:id` | Legacy deep link; redirects to `/fans/recaps/:id` |

### Frontend files

| File | Role |
| --- | --- |
| `components/dashboard/ShowModeCard.vue` | Post-show alert (generating / ready / timeout) + hosts persistent latest panel + dismiss logic |
| `components/dashboard/show-mode/LatestShowRecapPanel.vue` | Compact permanent latest-recap UI on the dashboard |
| `pages/fans/recaps/index.vue` | Archive / history page |
| `pages/fans/recaps/[id].vue` | Detail page; context-aware back link |
| `components/dashboard/fans/ShowRecapCard.vue` | Latest-recap card on `/fans` |
| `components/dashboard/fans/ShowRecapDetailContent.vue` | Detail body + mounts composer |
| `components/dashboard/fans/ShowMessageComposer.vue` | Compose / send (eligibility from API) |
| `components/dashboard/fans/FansDashboardCard.vue` | Fan Intelligence card; now has **Show Recaps** → `/fans/recaps` |
| `composables/useShowRecaps.js` | Client API: `getLatestRecap`, `getRecaps`, `getRecapDetail`, `generateRecap`, `getMessagePreview`, `sendRecapMessage` |

### Backend (no schema/API changes in this pass)

Already existed and was reused:

| Endpoint | Purpose |
| --- | --- |
| `GET /api/show-recaps/latest/me` | Most recent recap for the caller's band (enriched with check-in stats) |
| `GET /api/show-recaps/my-recaps?page=&pageSize=` | Paginated list, newest first, max pageSize 50 |
| `GET /api/show-recaps/:id` | Detail (+ top fans, check-in stats) |
| `GET /api/show-recaps/:id/message` | Message preview / eligibility |
| `POST /api/show-recaps/:id/message` | Send Message the Room |
| `POST /api/show-recaps/generate` | Manual regenerate (used by retry on the post-show alert) |

List/latest enrichment (`withCheckInStats`) adds / corrects:

- `checkedInShowCount`, `newFanCheckIns`, `knownFanCheckIns`, `averageCheckInConfidence`

Stored recap fields commonly used in UI:

- Identity: `id`, `campaignId`, `showTitle`, `venue`, `city`, `showStartedAt` / `showEndedAt`, `recapGeneratedAt`, `showModeType`
- Metrics: `fansCaptured`, `interactionCount`, `checkedInShowCount`, Spotify/merch/share clicks, engagement fields
- Messaging history: `messagesSentCount`, `lastMessageSentAt`, `lastMessageRecipientCount`

**Not on the recap model today:** support amount / tip / revenue. Archive does not invent those numbers.

**Eligible recipient count** (after cooldown + suppression) is only computed on the per-recap message preview endpoint. Archive/dashboard list UIs gate "Message the Room" on `checkedInShowCount > 0` as the honest "is there anyone at all?" signal; the detail page still runs the real eligibility check before send.

---

## 4. Dashboard behavior (Show Mode card)

### Three visual layers

1. **Live / scheduled / activation form** — normal Show Mode controls. Persistent latest panel is hidden here (noise mid-show).
2. **Post-show alert** (temporary, dismissable) — states: `generating` → `ready` → or `timeout` with retry.
3. **Latest Show Recap panel** (permanent when idle) — compact card with title, venue · city · date, check-ins / fans captured / interactions, and actions.

### When the persistent panel shows

Shown when:

- `latestRecap` is loaded
- post-show alert is not visible
- not loading, not live, not scheduled, activation form closed

### Actions on the panel / alert

| Action | Destination |
| --- | --- |
| View Recap | `/fans/recaps/:id?from=dashboard` |
| Message the Room | `/fans/recaps/:id?message=1&from=dashboard` (only if `checkedInShowCount > 0`) |
| Show History | `/fans/recaps` |

Zero check-ins → Message button hidden; copy: *"No one checked in at this show, so there's nobody to message yet."*

### Fetching

On mount, `ShowModeCard`:

1. Loads Show Mode status
2. Reads dismissed campaign id from localStorage
3. Resumes any pending post-show watch (if not dismissed / not stale)
4. Fetches latest recap via `getLatestRecap()` for the persistent panel

When a matching recap appears during the watch, it updates both `endedRecap` (alert) and `latestRecap` (persistent store).

---

## 5. Dismiss behavior (the core UX fix)

### Bad old behavior

Dismiss set recap state to null, cleared the ended recap, cleared pending localStorage → dashboard looked like "Ready for live events" with **no path back to that recap**.

### New behavior

Dismiss **only collapses the prominent alert**.

| Concern | Implementation |
| --- | --- |
| What is stored on dismiss? | `campaignId` of the show that just ended |
| localStorage key | `mbq_recap_alert_dismissed:<bandId>` |
| Pending watch key (also band-scoped) | `mbq_pending_recap:<bandId>` |
| Does dismiss delete the recap row? | **No.** Client-only UI state |
| Mid-generation dismiss | Alert stays collapsed (`alertPanel` false because dismissed campaign matches); watch may keep running so the finished recap still lands in `latestRecap` |
| Reload after dismiss | Alert stays dismissed for that campaign; compact Latest Show Recap still appears |
| New show later | New `campaignId` ≠ dismissed id → prominent "Show recap ready" fires again |

Alert visibility is keyed on **campaign id**, not recap id, so dismissing while still generating does not resurrect the alert the moment the row appears.

Pending watch ages out after 6 hours so an abandoned generating state does not nag forever.

---

## 6. Archive page (`/fans/recaps`)

### Copy

- **Title:** Show Recaps  
- **Subtitle:** Look back at every show, see what happened, and follow up with the fans who checked in.

### Empty state

- "No show recaps yet."
- "Activate Show Mode at your next event to capture fans and see what happened afterward."
- CTA back to dashboard

### Each row

- Show title, venue/city, date
- Check-ins, fans captured, interactions
- Message status line when `messagesSentCount > 0`
- **View Recap** → `/fans/recaps/:id`
- **Message the Room** → `/fans/recaps/:id?message=1` if check-ins > 0; else the "nobody to message" note
- Does **not** send mail from the list — always opens the composer on the detail page

### Pagination

- Page size **10**
- Newest first (`recapGeneratedAt` desc on backend)
- **Load more** appends; de-dupes by `id` because a new recap between page loads can shift the offset window and otherwise repeat a row
- Distinguishes empty vs load failure (`getRecaps` rethrows; archive catches and shows retry / load-more error)

Back link on the archive goes to `/dashboard`.

---

## 7. Message the Room access rules

Accessible from:

1. Dashboard post-show alert  
2. Dashboard persistent Latest Show Recap panel  
3. Archive row  
4. Fan Analytics latest-recap card  
5. Recap detail page (composer always lives there)

Rules:

- If `checkedInShowCount === 0` → hide/disable Message the Room; show helpful empty copy
- Never send from a list/row — always route to `/fans/recaps/:id?message=1`
- Server still enforces cooldown, suppressions, show age, ownership on preview/send

---

## 8. Back navigation (why Fan Analytics felt wrong)

Previously, recap detail always linked "Back to Fans" → Fan Analytics. That was disorienting when the band opened the recap from the dashboard.

### Current rule (`pages/fans/recaps/[id].vue`)

| Query | Back label / destination |
| --- | --- |
| `?from=dashboard` | Back to Dashboard → `/dashboard` |
| `?from=fans` | Back to Fan Analytics → `/fans` |
| (default / archive / direct) | Back to Show Recaps → `/fans/recaps` |

Dashboard and Fan Analytics entry links set `from=` accordingly. Archive rows omit `from`, so back lands on the archive — the natural parent of a recap.

---

## 9. Fan Intelligence entry point

On the dashboard Fan Intelligence card (`FansDashboardCard.vue`):

- **Analytics** still goes to `/fans`
- **Show Recaps** (new) goes to `/fans/recaps`

Recaps are no longer only reachable by digging through Fan Analytics.

The `/fans` page's `ShowRecapCard` still shows the latest recap, plus links to the full archive and Message the Room when applicable.

---

## 10. Client composable contract (`useShowRecaps.js`)

| Method | Endpoint | Notes |
| --- | --- | --- |
| `getLatestRecap()` | `GET .../latest/me` | Returns `data` or null; swallows errors (panel is optional) |
| `getRecaps({ page, pageSize })` | `GET .../my-recaps` | **Rethrows** on failure so archive can distinguish empty vs error |
| `getRecapDetail(id)` | `GET .../:id` | Ownership enforced server-side |
| `generateRecap(campaignId)` | `POST .../generate` | Used by post-show retry |
| `getMessagePreview(id)` | `GET .../:id/message` | Eligibility + recipient counts |
| `sendRecapMessage(id, { subject, note })` | `POST .../:id/message` | Throws on failure for the composer to surface |

---

## 11. State machine sketch (dashboard)

```
Show Mode OFF, no recaps
  → compact "Ready for live events"

Show Mode LIVE / SCHEDULED / form open
  → live controls; latest panel hidden

Show ends (deactivate returns campaignId)
  → alert: generating
       → poll latest/me every 2.5s, match campaignId, up to 45s
       → ready: loud "Show recap ready" + View / Message / History
       → timeout: retry generate

User dismisses alert
  → store dismissed campaignId (band-scoped)
  → alert hidden
  → Latest Show Recap panel remains (or loads when recap arrives)

User opens archive / detail / messages
  → permanent records; dismiss state irrelevant
```

---

## 12. Test matrix (intended QA)

| Scenario | Expected |
| --- | --- |
| A. No recaps | Ready state on Show Mode card; archive empty copy |
| B. One recap | Persistent Latest Show Recap; View / Message / History work |
| C. Fresh recap | Loud ready alert; Dismiss → compact panel remains |
| D. Multiple | `/fans/recaps` newest first; load more; each View/Message correct |
| E. Zero check-ins | Message hidden/disabled + empty copy |
| F. Reload after dismiss | Alert stays dismissed for that campaign; compact panel still there |
| G. New show later | New campaign gets a new prominent ready alert |

---

## 13. What did / did not change on the backend

**Did not change** for this discovery work:

- Recap generation, cron, campaign archival
- Message send / cooldown / Resend / webhooks
- Check-in or badge pipelines
- Schema fields

**Frontend-only fix:** discovery, persistence, archive UI, dismiss semantics, navigation.

---

## 14. Remaining follow-ups (recommendations)

1. **Eligible recipient count on list rows** — would need a batched/cheap field on `my-recaps` to avoid N+1 fan queries; until then check-in count is the proxy.
2. **Archive filters** — by date, venue, "has check-ins", "already messaged" once a band has a season of shows.
3. **Regenerate older recaps from UI** — `generateRecap` is still only exposed via the post-show timeout retry.
4. **Support / revenue on recap** — not in the model; add only if product wants tip/support rolled into the show record.
5. **Dead second recap system** — `/api/fan-moments/recap-active` + unmounted shareable panels still coexist conceptually; decide mount vs delete (noted in `SHOW-MODE.md`).
6. **Strapi permissions** — Authenticated role must allow `latest/me`, `my-recaps`, `findOne`/detail, and message routes; a missing permission previously surfaced as 500 via middleware.

---

## 15. One-sentence summary for ChatGPT

Show Recaps are permanent show records: the dashboard keeps a persistent Latest Show Recap after the dismissable post-show alert collapses, `/fans/recaps` is a paginated archive, Message the Room always opens the detail composer (`?message=1`) and is hidden when nobody checked in, and back navigation returns to dashboard, Fan Analytics, or the archive based on how the band arrived — with no backend mailer or check-in changes in this pass.
