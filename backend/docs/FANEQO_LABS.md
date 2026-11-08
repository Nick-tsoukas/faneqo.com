# Faneqo Labs

Private development environment for Moments, Passport, Signals, Share Studio, Wrapped, and External Intelligence.

Platform roadmap and live phase: [`FANEQO_RELATIONSHIP_PLATFORM.md`](FANEQO_RELATIONSHIP_PLATFORM.md), [`FANEQO_CURRENT_PHASE.md`](FANEQO_CURRENT_PHASE.md).

**Frontend visibility is not authorization.**  
**Feature resolution does not load product data, analytics, or provider APIs.**

Default deny. Access exists only as a `FeatureEnrollment` row that is currently active.

## Feature keys (V1)

Defined in `src/utils/features/featureKeys.js`. Add a future key there only.

| Key | Subject |
| --- | --- |
| `internal_labs` | user — may enter `/labs` |
| `moments` | band |
| `show_moments` | band |
| `fan_passport` | user (fan account later) |
| `share_studio` | band |
| `wrapped` | band |
| `external_intelligence` | band |

Unknown keys: runtime `hasFeature` / `assertFeature` deny. Seed/upsert throws.

## Resolution order

Active window: `startsAt` in the future is inactive; `endsAt` ≤ now is inactive. Inactive rows are ignored.

1. Explicit **disabled** on a relevant subject (user and/or band)
2. Explicit **enabled** on a relevant subject
3. Cohort enabled (cohort **disabled** also denies before platform)
4. Platform (`subjectType=platform`, `subjectId=*`) enabled
5. **DENY**

Relevant subjects:

- User-scoped (`internal_labs`, `fan_passport`): user, then cohort, then platform. No user ⇒ deny. Band rows are ignored.
- Band-scoped (the rest): require `bandId`. **User disable or band disable wins.** Then user enable or band enable can grant. No band ⇒ deny.

Query errors ⇒ deny.

### User + band conflicts

For a band-scoped key with both user and band in context:

- Either subject `disabled` (active window) ⇒ deny, even if the other subject is enabled.
- Else either subject `enabled` ⇒ allow.
- Else cohort / platform / deny.

Enabling Moments for band A does not enable it for band B.

## Founder seed

Set **one** of these on the Strapi host, then restart:

```
FANEQO_LABS_FOUNDER_USER_ID=<numeric users-permissions id>
FANEQO_LABS_FOUNDER_EMAIL=<that account's email>
```

Bootstrap (`src/utils/features/seedFounderLabs.js`) finds the user and upserts:

`internal_labs` + `subjectType=user` + `subjectId=<id>` + `status=enabled` + `grantedBy=bootstrap:env`

Email match is case-insensitive (`$eqi`). Do not put a production user id in git.

After the row exists, **request authorization never reads these env vars**. Removing or disabling the enrollment row removes Labs access with no code change.

## Enroll a user

Strapi Admin → Feature Enrollment, or `upsertEnrollment`:

- `featureKey`: `internal_labs` (or another key)
- `subjectType`: `user`
- `subjectId`: user id as string
- `status`: `enabled`

## Enroll a band

Same, `subjectType: band`, `subjectId`: band id.

Example: enable Moments for one band only.

## Disable access

Set `status=disabled` on that subject (overrides lower-level enables), set `endsAt` in the past, or delete the row.

## Dates

- `startsAt` null = immediate
- `endsAt` null = no expiry
- `startsAt > now` ⇒ inactive
- `endsAt <= now` ⇒ inactive

## Backend usage

```js
const { createFeatureService } = require('../utils/features/featureService');
const features = createFeatureService(strapi);

await features.assertFeature('moments', { user, band });
const ok = await features.hasFeature('internal_labs', { user });
const { features: map, user: userMap, band: bandMap } = await features.getMyFeatures({ user, band });
```

`assertFeature` throws 404 (`feature_denied`).  
Complement existing `owns-band` / `has-band-role` / `subscription-active`. Feature enrollment does not replace band ownership.

Future product controllers should keep those policies **and** call `assertFeature`. Policy `global::require-labs` is available for authenticated routes. Labs HTTP does **not** use it: those routes use `auth: false` plus controller JWT so missing/unenrolled callers get **404** instead of a users-permissions **403** that would advertise `/api/labs`.

Labs HTTP:

- `GET /api/labs/status?bandId=`
- `GET /api/labs/features?bandId=`

Unauthenticated or unenrolled ⇒ **404**. Response is boolean maps only — no raw enrollment rows, metadata, or `grantedBy`.

`getMyFeatures` / Labs payload:

- `features` — resolved map (user + selected band)
- `user` / `userFeatures` — user-only resolution (band-scoped keys false)
- `band` / `bandFeatures` — band-only resolution, or `null` if no band (`userId` ignored so user grants do not appear here)

Unauthorized `bandId` query values are ignored (no leak).

## Frontend

Nuxt: `middleware/labs.ts` + `composables/useLabsFeatures.js`.  
`/labs` is the Experience studio hub (not production nav). Unenrolled logged-in users get Nuxt 404. Logged-out users follow existing `auth` middleware (home). API failure never exposes Labs.

Selected band: `?bandId=` using `GET /api/me/band-access` — same access list as the dashboard.

Relationship inspector: `/labs/relationships` via `GET /api/labs/relationship-fans` and `GET /api/labs/relationships`. Requires `internal_labs` + band access. See `docs/FANEQO_RELATIONSHIP_EVENTS.md`.

Artist × fan proving surface: `/labs/relationship` via `GET /api/labs/relationship`. Requires `internal_labs` + band access. See `docs/FANEQO_MOMENTS.md`. Not Passport. Local visual fixtures: frontend `/__dev/relationship`.

Gallery Design Lab: frontend `/labs/gallery` (auth + `internal_labs` only). Original SVG fixtures, no product unhide. See `musicbizqr/docs/design/FANEQO_GALLERY_LAB.md`.

Data-integrity inspector: `/labs/data` via `GET /api/labs/integrity`. Requires `internal_labs`. Read-only duplicate groups, key coverage %, and identity-key index `ACTIVE / PENDING / BLOCKED / UNKNOWN`. No merge or “Fix”. See `docs/FANEQO_DATA_INTEGRITY.md`.

## Unique constraint

Postgres/SQLite: `UNIQUE (feature_key, subject_type, subject_id)`  
Index name: `feature_enrollments_feature_subject_unique`  
Do not rely on Strapi per-field `unique`.

REST for `FeatureEnrollment` is empty (`routes: []`). Public and authenticated users-permissions CRUD is stripped on bootstrap. Admins use Content Manager.

## Performance

One `findMany` with `$or` (user, band, cohort, platform `*`), fields limited, `limit: 500`, then resolve keys in memory. If the query returns 500 rows it is treated as truncated and **denies** (a dropped `disabled` row must not grant). Does not touch analytics, attendance, messages, media, or providers.

## Tests

```
node scripts/test-feature-resolution.js
node scripts/test-feature-enrollment-schema.js
node scripts/test-feature-service.js
```

## Manual verification (after Strapi restart)

1. Unauthenticated `GET /api/labs/status` → 404
2. Ordinary logged-in user `GET /api/labs/features` → 404
3. Ordinary user visits `/labs` → Nuxt 404
4. Set founder env, restart, confirm Feature Enrollment row, `/labs` loads
5. Disable or delete that row, restart not required for request path → `/labs` and API 404
6. Enable `moments` for band A only → band B still disabled
7. Set overlapping disable on user or band → deny
8. Expired `endsAt` / future `startsAt` → deny
