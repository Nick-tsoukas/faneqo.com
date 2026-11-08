# Faneqo FanPassport — Gallery Save MVP

**Status:** implementation slice  
**Prepared:** 2026-08-27

## Product outcome

A signed-in fan who is authorized to view a show gallery can save that gallery
to FanPassport, return to it later, and share its Faneqo link. The link never
makes protected media public: every viewer is re-authorized against the
original Artist Update and canonical attendance.

## Truth boundaries

- Artist Update remains the gallery owner.
- Strapi Upload file remains media identity.
- Fan Show Attendance remains attendance truth.
- Passport Gallery Save stores only fan intent and references.
- No media bytes, URLs, captions, attendance, or show facts are copied.
- Removing a save never deletes the gallery or any media.
- Losing access removes the gallery from Passport reads automatically.

## API

- GET /api/fan-passport/galleries
- POST /api/fan-passport/galleries/:artistUpdateId/save
- DELETE /api/fan-passport/galleries/:artistUpdateId/save

All routes require a valid account JWT in-controller. Save is idempotent through
the private unique key passport-gallery:v1:{userId}:{artistUpdateId}.

## Share contract

The canonical share path is /fan/passport/gallery/{artistUpdateId}.

It is a link to a Faneqo memory, not a public image URL. Protected media remains
behind the existing short-lived signed proxy and original viewer authorization.

## Rollout

1. Merge only after tests and Strapi build pass.
2. Confirm the new empty table and unique save key exist after backend deploy.
3. Test subject attendee save/list/remove.
4. Test another signed-in user and anonymous viewer receive no protected media.
5. Do not backfill saves.
