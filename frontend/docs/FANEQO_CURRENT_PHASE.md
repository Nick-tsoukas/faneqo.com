# FANEQO CURRENT PHASE

Updated 2026-09-09. Keep this file small.

This is the **now** board. Durable principles live in `docs/FANEQO_DESIGN_NORTH_STAR.md`. Durable product direction lives in `docs/FANEQO_MASTER_PRODUCT_ROADMAP.md`. Exact next-session work lives in `docs/FANEQO_NEXT_AGENT_HANDOFF.md`.

This `musicbizqr` copy is the product-phase source of truth. A `qrserver` copy may lag and must not override the four canonical frontend docs.

Older audits and plans may contain history. They must not override these four files.

---

## CURRENT

**MESSAGING — LOCKED.**

Inbox / Thread, Composer, and Sent stay locked. Do not reopen them.

**PUBLIC NIGHT HIERARCHY — LOCKED.**

Hero → Story → From the Night → From the Stage → On Stage → Stay with artist.

Story still introduces the Night. Gallery Stack is unchanged. Compact On Stage is contextual, not a scroll barrier. Desktop may place Poster + lineup in a right rail.

**NIGHT RECORDINGS — LOCKED.**

Show Recap Night-content: Story → From the Night → Recordings → compact Lineup.
Public Night: Story → From the Night → From the Stage → compact On Stage.
One `NightRecordingItem` presentation for artist + fan. Artist Page media language without Artist Page analytics. Passport benefits via Public Night. Analytics deferred.

**FAN PASSPORT HOME — PRESERVE / NEAR-LOCK.**

Artist relationship chapters, one artist image per chapter, server-derived ordinal, Gallery → Hero → Poster → type visual policy, multi-artist / many-Night behavior. Do not redesign home.

---

## ACTIVE

Gallery Page + Living Gallery are wired on the existing Gallery route (not APPROVED V1). Public gallery detail desktop hang is now a two-column editorial sequence (pass-5, not APPROVED V1). Gallery Create / Edit is next. Night Recordings stay locked.

---

## NEXT

1. Gallery Create / Edit
2. Full Night → Gallery → Message → Fan → Passport loop audit / hardening
3. Small Passport artist-relationship enrichment later (featured track / video / socials belong to the artist chapter, not a Night)
4. Share Kit 2.0 / Music Memory / advanced mobile
5. Artist Page later

---

## LATER

Preserved in the master roadmap HOLD section. Do not start from this file.

- Night Object abstraction
- Music Memory / Night soundtrack player UI
- Share Kit 2.0 / I Was There Passport shares
- iOS / native-feel dedicated pass
- Artist Page redesign
- Stack weight / content-aware geometry / reverse View Transition / Atropos

---

## LOCKED

Do not structurally reopen:

| Surface | Status |
| --- | --- |
| Fan Check-In | LOCKED |
| Artist Show Recap | STRUCTURALLY LOCKED |
| Public Night | COMPOSITION LOCKED |
| Public Night hierarchy | LOCKED |
| Night Recordings | LOCKED |
| Gallery Archive | DONE |
| Gallery Stack V3 | PASS / LOCK |
| Public Gallery / media foundation | LOCKED |
| Night Hero / image roles | LOCKED |
| Auth | LOCKED |
| QR Share | LOCKED |
| Mobile artist dock | LOCKED |
| Show Mode + Nights | LOCKED |
| Messaging Inbox / Thread | LOCKED |
| Messaging Composer | LOCKED |
| Messaging Sent | LOCKED |
| Fan Passport Home | PRESERVE / NEAR-LOCK |

Preview Fan View uses the real Public Night. Gallery Stack context belongs in wrappers, not in `FaneqoGalleryStack.vue`.

---

## ALSO TRUE

These remain in place. Do not revert them:

- Artist Page fan-capture visual lock plus relationship wiring: signed-in already-joined hides Join; anonymous success may offer optional `FanAccountPrompt`; global account prompts stay off

- **NATIVE FANEQO FOLLOW:** same canonical Fan row. `followedAt` / `unfollowedAt` are Following truth. Follow is not email status and not attendance. Artist Page Join Fan List also sets Follow. Check-In does not. Follow-only create stays email-ineligible (`status: unsubscribed` in V1) and can still be an in-app Faneqo relationship. No Follow model.

- M1 request lifecycle and messaging color polish
- Public Night / Gallery destinations and share endpoints
- Artist World nav / safe `from` (never on canonical / OG URLs). `from=/fan/passport` is valid.
- Night Hero = `heroImage ?? artist image` on Recap and Public Night
- Public Gallery photography pipeline (`originalUrl`, `srcset`, authorized media only)
- Show Recap manager / team authorization uses workspace band, not owner-only lookup
- Passport Night artwork never falls back to the artist portrait
- YOU WERE THERE and show ordinal on Public Night are server-derived viewer facts
- Legacy `/fan/passport/nights/:id` login remaps to `/fan/passport`. Canonical Night login still returns to that Night.
- Night Recording gated uploads cannot publish until protected audio/video delivery exists

Architecture invariants still live in `docs/FANEQO_RELATIONSHIP_PLATFORM.md`. That file is architecture, not the live product roadmap.

**HANDOFF:** `docs/FANEQO_NEXT_AGENT_HANDOFF.md`
