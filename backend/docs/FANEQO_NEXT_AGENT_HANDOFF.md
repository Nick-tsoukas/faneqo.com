# FANEQO NEXT AGENT HANDOFF (backend)

Updated 2026-09-06.

> **Backend continuation only.** The active company handoff is `musicbizqr/docs/FANEQO_NEXT_AGENT_HANDOFF.md`, which is newer. A handoff is the next step, not a constitution (precedence: `musicbizqr/AGENTS.md`).

## Slice delivered

Night Hero backend foundation — Slice 0 (contract hygiene) + Slice 1 (schema + durability).

Frontend Gallery/media work was in flight in parallel. This pass is backend-only.

## What landed

- `ShowRecap.coverImage` is Night Photo only. New/regen writes no longer copy `Event.image` into `coverImage`.
- Legacy Event-seeded `coverImage` rows are left untouched. No backfill.
- Public `night.cover` = public-safe `ShowRecap.coverImage` or null. Event and artist imagery stay on `night.eventImage` and `payload.artist.image`.
- `share.image` remains an independent OG contract (cover → Event → artist).
- New optional Night Hero fields: `heroImage`, `heroFocalX`, `heroFocalY`.
- `PATCH /api/show-recaps/:id/night` accepts `heroMediaId`, `heroFocalX`, `heroFocalY` (omit = unchanged; `heroMediaId: null` clears to Artist Image fallback).
- Hero uses the same `authorizePublicNightCover` standard as Night cover.
- Regeneration/recovery never overwrites artist-set hero or focals. Hero is never auto-seeded.

## Intentionally not done

- No frontend Hero UI (Recap / Edit Night / Public Night)
- No `eventArtwork` snapshot field (recommended follow-up)
- No share/OG priority change to include Night Hero
- No commit, push, or deploy

## NEXT

Frontend Slice 2: Recap + Edit Night hero = `heroImage ?? artist image`.
Then Public Night Slice 3. Then optional Event artwork snapshot.

## Verification

```
node scripts/test-night-enrichment.js
node scripts/test-public-night-share.js
node scripts/test-show-mode-cover.js
node scripts/test-show-mode-integrity.js
node scripts/test-labs-boot-requires.js
```
