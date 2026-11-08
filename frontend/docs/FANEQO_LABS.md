# Faneqo Labs (frontend)

Canonical enrollment, resolution, and seed docs live in the Strapi repo:

`qrserver/docs/FANEQO_LABS.md`

Platform roadmap and live phase: [`FANEQO_RELATIONSHIP_PLATFORM.md`](FANEQO_RELATIONSHIP_PLATFORM.md), [`FANEQO_CURRENT_PHASE.md`](FANEQO_CURRENT_PHASE.md).

This Nuxt app only renders Labs. **Frontend visibility is not authorization.**

## Routes

Internal inspector only. Not in production nav.

**Open first:** `/labs` — Experience studio hub. Click into every Phase 07 proving surface.

Active visual experiences:

- `/labs/gallery` — elite gallery
- `/labs/night-story` — Night Story (attendee / locked)
- `/labs/share-photos-lab` — Share Photos fixture board (opens immediately)
- `/labs/share-photos?recapId=` — real composer; closed without a recap id
- `/labs/dm-media` — DM attachments
- `/labs/relationship` — Artist × fan journal (fixtures on the page; live needs `?bandId=` + fan picker)

Inspectors / pointers:

- `/labs/moments` — pointer to `/labs/relationship`
- `/labs/relationships` — RelationshipEvent ledger
- `/labs/data` — uniqueness inspector

Placeholders (do not treat as product):

- `/labs/passport` — production Passport components + fixture states (`?state=three`)
- `/labs/signals` — Phase 08
- `/labs/share-studio`
- `/labs/external`

Local visual fixtures (`import.meta.dev` only): `/__dev/gallery`, `/__dev/night-story`, `/__dev/share-photos`, `/__dev/dm-media`, `/__dev/relationship`.

Logged out → existing `auth` middleware (home).  
Logged in without `internal_labs` → Nuxt 404.  
API failure → never expose Labs.

Guards: `middleware/auth.ts` then `middleware/labs.ts` (`useLabsFeatures()` → `GET /api/labs/status`).

`/labs/relationships` is a ledger inspector (not artist UI). `/labs/relationship` is the Phase 06/07 artist × fan proving surface. Band context reuses `GET /api/me/band-access`.

Band context reuses `GET /api/me/band-access` (`useBandTeam().getMyBandAccess()`), same as the dashboard. Pass `?bandId=`.
