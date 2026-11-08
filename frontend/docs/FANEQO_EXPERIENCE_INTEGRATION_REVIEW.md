# Faneqo Experience Integration Review

Post-Phase-07 product / visual / interaction review. **Not Phase 08.**  
Reviewed 2026-08-20 against rendered Labs / `__dev` surfaces, not docs alone.

**Status:** EXPERIENCE INTEGRATION REVIEW ✅  
**Next:** PHASE 08 — SIGNALS + ARTIST INTELLIGENCE (not started)

---

## Current state

Phases 05B–07 are complete in local code and **not deployed**. 05A uniqueness is live. Artist Updates remain globally hidden. Homepage work is a separate dirty tree and was not touched.

The pieces now share a media foundation and a relationship journal. They are **closer to one product than a feature pile**, with one remaining split: Night Story is the night; the relationship story is the arc; DMs stay conversational; Share Recap’s lab wrapper still looks more operational than memorial.

**Hypothesis (confirmed):** fan/memory surfaces should feel like an **artist relationship journal**, not an artist CRM. Artist-side tools (Show Recap, inbox) may stay denser.

---

## Screens reviewed

Rendered at **390**, **430**, **1280** (actual viewport, not only lab stage width):

| Route | What it is |
| --- | --- |
| `/__dev/gallery` · `/labs/gallery` | Elite gallery compositions |
| `/__dev/night-story` · `/labs/night-story` | Attendee, locked, no-photo, account-required |
| `/__dev/share-photos` · `/labs/share-photos-lab` | Recap CTA, composer, Night Story success |
| `/labs/share-photos` | Real composer (recap query; not live-published here) |
| `/__dev/dm-media` · `/labs/dm-media` | Bubble 1–4, upload, retry, lightbox |
| `/__dev/relationship` · `/labs/relationship` | Artist × fan journal (fixtures + live picker) |
| `/labs/moments` | Pointer only |
| `/labs/relationships` | Ledger inspector (not product UI) |
| `/labs/passport` | Placeholder — not treated as product |

Fixture cases: 0-show, 1-show, 2-show return, 2-show no-photo, 2-show photo-rich, 5-show (no `fifth_show` milestone).

---

## Strongest / weakest

**Strongest:** no-photo **Badflower × Sarah** two-show journal.  
Nashville → YOU WROTE BACK. → **YOU CAME BACK.** Knoxville. Type, space, and one cyan line carry the story. Photography is not required for meaning.

Propagate: memory before metrics; one dominant beat; quiet first-show; dates as `Oct 18` not timestamps; no badge wall.

**Weakest:** photographed relationship journal at 390.  
The Nashville mosaic is so large that **YOU CAME BACK.** is a scroll away. That is **earned chronology**, not a bug to “fix” by putting the return above the first night. Above-the-fold already says `2 nights together`. Do not flatten the story into a dashboard so the hero fits the first screen.

---

## What changed in this review

Frontend-only, presentation only.

- Relationship chapters now read **place → photos → quiet meaning**. Return nights still **lead with YOU CAME BACK.**
- First-reply copy: **YOU WROTE BACK.** (canonical `fan_replied`; second-person to the fan, same voice as YOU CAME BACK). Date under the line (`Nov 12`).
- Joined date calendar-safe: `2025-06-01T00:00:00.000Z` → **June 2025**, not May.
- 0-show: **The first night is still ahead.**
- Return hero type larger on the phone.
- Share Photos: “Visible to people who were there.”
- Labs fixtures for 0/1/2/5 shows + `/__dev/relationship`.
- Night Story no-photo attendee fixture.

**Rejected during review:** putting YOU CAME BACK on the first screen when photos exist; gallery redesign; recap→Night Story merge; Passport; Rive; unhiding Artist Updates.

---

## Decisions

| Topic | Decision |
| --- | --- |
| Journal vs CRM | Journal for fan/memory. Recap/inbox may stay operational. |
| Night Story vs relationship | Same night, two readings: photos-first memory vs chapter-title arc. Not one component. |
| First reply copy | **YOU WROTE BACK.** Presentation only. Type unchanged. |
| Dates | `Oct 18` / `Nov 12` / `Dec 5`. Joined: `June 2025`. No year on night lines until a later span needs it. |
| 5 shows | Repeats city/date. Future grouping (year/tour). No `fifth_show` now. |
| 56rem cap | Keep. 1280 is an editorial column, not a dashboard. |
| Accent | Magenta/violet = artist world. Cyan = return/connection. Emerald = YOU WERE THERE. Neon green = app/DM signal. Promising; no token migration now. |

---

## Public profile (do not implement)

Do **not** show a product section called Updates.

**LATEST FROM {ARTIST}** — one strong public memory, 2–3 supporting frames if public, **View more**. Not an Instagram feed.

| Visibility | Profile |
| --- | --- |
| `public` | May appear |
| `fan_list` | Not on the public page until gated delivery + join/verify exist |
| `show_attendees` | Never on the public page. No teaser that implies the photos. Night Story stays the attendee surface |

---

## Artist Updates activation (do not implement)

Not ready to unhide globally.

Need: protected delivery on in the target env; public composer without disabled `fan_list` pretending to work; artist entry from Show Recap (**Share photos from tonight**) not a generic CMS “New Update”; public profile wrapper named as above.

Artist-facing “Update” is acceptable internally. Fan-facing should be human (tonight, latest, memories).

---

## Rive / motion (do not implement)

Rive: **YOU CAME BACK** HIGH; **YOU WERE THERE** HIGH; logo echo MAYBE; relationship connected-since MAYBE; share success MAYBE; Moment reveal MAYBE; check-in MAYBE; Passport stamp later HIGH; layout/chrome NOT WORTH IT.

Motion: opacity arrive already on Night Story. Next: lightbox, send, return-line reveal. Reject scroll prisons, every-card entrance, glow.

---

## Phase 08 readiness

**YES.** Inherit: journal not CRM; no engagement score; Signals are sparse observations not badges; artist tools may be denser than fan memory; do not put Signals on the relationship timeline as a badge wall.

---

## Improve / Improve (max 7)

1. **OPERATIONS / DEPLOYMENT** — Deploy 05B (with protected media flags) → 06 → 07 in that order.  
2. **PHASE 08 SIGNALS / INTELLIGENCE** — Sparse `city.growth`, `fan.returning`, … Small evaluators. No `IntelligenceEngine.js`.  
3. **PUBLIC PROFILE / ARTIST UPDATES** — Activate only with the wrapper and visibility rules above.  
4. **PHASE 09 PASSPORT** — Compose photographed arcs so origin + return can coexist without flattening chronology. Optional later grouping for 5+ nights.  
5. **RIVE / MOTION SYSTEM** — YOU CAME BACK / YOU WERE THERE first.  
6. **SHARE STUDIO** — After recap + Night Story feel like two views of one night.  
7. **REJECT** — Badge walls, CRM stats as the relationship hero, attendee-media teasers on the public page, collapsing YOU CAME BACK above the first night.

---

## Deployment gaps (unchanged)

05B/06/07 not in production. No `moments` / `milestones` tables live. Unique indexes not ACTIVE. Homepage work is dirty and unrelated.
