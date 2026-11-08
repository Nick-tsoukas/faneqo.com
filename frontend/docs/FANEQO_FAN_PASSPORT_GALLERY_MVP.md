# FanPassport Gallery MVP

Status: first usable fan-facing FanPassport slice.

## What exists

- A signed-in fan can save an accessible show gallery to FanPassport.
- FanPassport lists saved nights in reverse save order and reuses the production `ShowNightStory`, gallery grid, and lightbox.
- A fan can remove a save without deleting the source gallery or any media.
- A fan can share the stable Faneqo gallery page through the device share sheet, with clipboard fallback.
- A shared page rechecks the viewer’s current Artist Update access before it displays any protected media.
- The real experience is available at `/fan/passport`; Labs reuses the same component at `/labs/passport`.

## Data and access contract

FanPassport stores references only: account user, Artist Update, band, event/show recap, and save time. It never copies media, signed delivery URLs, attendance, or relationship facts.

The source Artist Update remains authoritative. Every list/detail read uses the current account JWT and the existing attendee authorization. If attendance is suppressed/revoked or the gallery is no longer accessible, the gallery disappears from the Passport response. A shared link grants no access by itself.

## Product boundary

This is not the complete FanPassport product. It is the show-gallery memory foundation. It does not add stamps, badges, fabricated history, uploads by fans, comments, public galleries, Moments, or Milestones.

## Reuse classification

- REUSE: `MediaItem`, protected media delivery, `FaneqoMediaGrid`, `FaneqoMediaLightbox`, `ShowNightStory`, Artist Update access.
- EXTEND: fan navigation, Artist Update detail composable, Labs catalog, safe fan post-login return.
- NEW: reference-only FanPassport composable and gallery list/detail surfaces.
- DO NOT USE: localStorage gallery persistence, a second gallery implementation, copied media records, public protected-image URLs.

## Next safe slice

1. Add a gallery discovery entry point from attendee notifications/messages.
2. Add real relationship chronology around saved nights, sourced from existing Moments/Milestones reads.
3. Add measured share events after the current analytics event vocabulary is audited.
4. Add fan-controlled captions only after ownership, moderation, and deletion semantics are designed.
