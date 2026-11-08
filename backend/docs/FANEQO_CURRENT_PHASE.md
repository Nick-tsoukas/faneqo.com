# FANEQO CURRENT PHASE (backend log)

Updated 2026-09-06. Canonical architecture lives in `docs/FANEQO_RELATIONSHIP_PLATFORM.md`.

> **This is the backend slice log, not the company phase.** The live product phase is `musicbizqr/docs/FANEQO_CURRENT_PHASE.md`, which is newer. When they disagree, the frontend copy wins (precedence: `musicbizqr/AGENTS.md`).

---

**ALSO LANDED (Night Hero backend Slice 0 + Slice 1):** `ShowRecap.heroImage` + `heroFocalX` / `heroFocalY`. `night.cover` is Night Photo (`coverImage`) only. New recaps no longer seed Event artwork into `coverImage`. `share.image` keeps its independent fallback. No frontend Hero UI in this pass.

**ALSO LANDED (Show Mode Night Slice 1 + 1.1 + 2 + 3A + 3B + frontend 4A):** Timing, integrity, Night enrichment, public Band allowlist, gallery visibility contract, public Night/Gallery share endpoints, and frontend destinations at `/:bandSlug/night/:nightSlug` and `/:bandSlug/gallery/:gallerySlug` (anonymous SSR + optional client JWT refresh). Contract: `docs/FANEQO_NIGHT_SYSTEM.md`.

---

**ALSO LANDED (frontend-led F.2):** `fan-account-link.returnTo` (nullable, private). `requestMagicLink` sanitizes before storage. `verifyMagicLink` returns the stored path or `/fan?welcome=1`. Shared rules live in `src/utils/fanReturnTo.js`. Direct `/dashboard` capability handling remains deferred — do not infer artist vs fan from `userSlug` or FanProfile.

**ALSO LANDED (M1 request lifecycle):** Fan list is grounded in canonical `conversation.fanAccountUser`. `ensureParticipants` creates a missing fan participant or heals a null `accountUser` from that pair. A conflicting non-null participant is an integrity anomaly: do not overwrite; deny fan access for every fan; artist band access may remain. `resolveAccess` requires `fanAccountUser === authenticated user` and a valid/healed participant.

---

**CURRENT PHASE:** REPEATABLE PRIVATE INBOX CAMPAIGNS — DEPLOY VERIFICATION

**IMPLEMENTED:**

- Faneqo Inbox campaigns no longer use email's 24-hour per-fan cooldown.
- repeated Inbox campaigns still reuse one canonical private conversation per artist × fan.
- Email keeps the 24-hour deliverability cooldown.
- account, removed/self, authorization, active-campaign, recipient idempotency, and worker suppression rules remain enforced.

- `MessageCampaign.artistUpdate` is a nullable relation to the canonical gallery owner.
- preview/create accept `artistUpdateId`; an Inbox campaign may be gallery-only.
- Email rejects galleries.
- All Fans requires a public, published, same-band gallery with media.
- Show Attendees requires a published attendee gallery tied to the exact owned Show Recap.
- the worker passes the gallery into the existing direct-message service, creating separate private conversations.
- per-recipient authorization is rechecked; revoked/ineligible references are suppressed.
- campaign history/detail returns safe gallery metadata only.
- public general galleries are valid for All Fans DMs; attendee galleries retain canonical attendance checks.

**MIGRATION / ROLLBACK:**

- migration adds one nullable many-to-one relation; existing campaign rows remain valid.
- deploy backend before the frontend uses campaign galleries.
- require Strapi boot plus `GET /api/health` 200.
- if boot fails, revert the backend merge.
- do not remove the relation while a gallery campaign is queued/sending; drain or cancel first.
- already delivered conversation messages retain their server-generated reference envelope.

**LOCKS:**

- `ArtistUpdate` remains the only gallery owner.
- FanPassport stores references and never copies media.
- campaign and direct-conversation lanes remain separate.
- no group chat, public DM fallback, second gallery store, or client-authored reference envelope.
- `fan_list` gallery delivery remains gated.

**NEXT:** full CI/build gate, production health check, then two consecutive Inbox campaign smokes plus authenticated owner/fan gallery smoke.

**HANDOFF:** `docs/FANEQO_NEXT_AGENT_HANDOFF.md`
