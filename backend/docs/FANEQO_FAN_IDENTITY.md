# Faneqo global fan identity

Backend reference for the fan's own presentation identity.
Architecture invariants: `docs/FANEQO_RELATIONSHIP_PLATFORM.md`.
Auth and magic-link flows: `musicbizqr/docs/AUTH-FLOWS.md`.

---

## The five concepts stay separate

| Concept | Meaning |
| --- | --- |
| `users-permissions.user` | authentication identity (email, JWT) |
| `fan-profile` | global fan presentation identity (chosen name, avatar) |
| `fan` | one artist × fan relationship |
| `fan-visitor` | anonymous/device identity before an account claim |
| `fan-show-attendance` | attendance truth |

`fan-profile` is a capability and presentation layer on a user, **not** a second
user type. An artist or team member who uses `/fan` gets a `fan-profile` on that
same user id; no second account is created.

---

## FanProfile fields

```
user                 oneToOne → plugin::users-permissions.user
claimedArtistCount   integer, default 0        (claim bookkeeping)
lastClaimedAt        datetime                  (claim bookkeeping)
displayName          string, max 40, nullable  (fan's explicit choice)
firstName            string, max 50, nullable
lastName             string, max 50, nullable
avatar               media, single image, nullable
profileCompletedAt   datetime, nullable
```

All identity fields are nullable with no defaults. Profiles written before this
model existed remain valid and read back as an empty identity.

There is no `email` column. Email lives on the auth user and is read from there.
Avatar is a normal Strapi `Upload` relation — V1 adds no `MediaAsset` table.

### displayName is never inferred

`displayName` is only ever a value the fan typed and saved. It is never derived
from an email, username, `fan` row, check-in, artist relationship, or import.
A null `displayName` means the fan has not chosen one — that is information, not
a gap to fill.

`profileCompletedAt` is evidence of an intentional save. Creating an account or
ensuring a profile row does **not** set it; only a successful `PATCH` does.

### Fan row names are kept

`fan.firstName` / `fan.lastName` are not migrated or rewritten. They still carry
anonymous fan identity, historical relationship data, email greetings, Fan
Intelligence, and messaging fallbacks. Global identity is an overlay on top of
them, not a destructive migration.

Artist Messages consume this overlay dynamically. A FanProfile name or avatar
change appears on the next Inbox fetch. Fan rows, Conversation rows,
ConversationMessage rows, and campaign / `message-recipient` snapshots are not
rewritten. Artist authorization still controls who can discover the identity:
there is no public FanProfile lookup.

---

## Display identity resolver

One function owns the precedence: `resolveFanDisplayIdentity({ fan, profile })`
in `src/utils/fanProfile/fanProfilePure.js`. Controllers must not re-implement it.

| # | Source | Result | `source` |
| --- | --- | --- | --- |
| 1 | `profile.displayName` | verbatim | `profile_display_name` |
| 2 | `profile.firstName` | first + last initial | `profile_name` |
| 3 | `fan.firstName` | first + last initial | `fan_name` |
| 4 | `fan.city` | `"{city} fan"` | `city` |
| 5 | — | `"Unnamed fan"` | `fallback` |

Levels 2–5 delegate to the existing `safeFanDisplayName` in
`src/utils/inbox/inboxPure.js`, so the artist-facing formatting rules stay in one
place.

A chosen `displayName` is returned verbatim: `"Nik Beats"` stays `"Nik Beats"`.
The last-initial reduction applies only to *structured* names, where
`firstName: "Nik", lastName: "Beats"` yields `"Nik B."`. Reducing a name a fan
deliberately typed would be wrong.

Returns `{ displayName, avatarUrl, source }`. `source` is diagnostic only and
exposes no private data. Email is never a fallback at any level.

Artist-facing Inbox DTOs use `presentResolvedIdentity` / `identityInitials`
from the same module: initials come from the resolved display name
(`Nik Beats` → `NB`), never from email or a raw Fan firstName.

A stray `fan.displayName` is deliberately ignored so precedence is deterministic.

---

## Endpoints

Profile and avatar endpoints are self-scoped. Ownership comes from the JWT; no
`userId`, `profileId`, or media id is ever read from a request body.
Unauthenticated and unknown-user requests get `401`.

### `GET /api/fan-account/profile`

Ensures a profile row exists, then returns:

```json
{ "data": {
  "displayName": null,
  "firstName": null,
  "lastName": null,
  "avatarUrl": null,
  "profileCompletedAt": null,
  "email": "fan@example.com"
} }
```

`email` comes from `users-permissions.user`. Ensuring the row does not set
`profileCompletedAt`.

### `PATCH /api/fan-account/profile`

The global profile editor. Allow-lists exactly `displayName`, `firstName`,
`lastName`; every other key is dropped. Partial updates: omitted fields are left
alone. Explicit `null` or an empty string clears a field, so a fan can remove
their own name. On success, sets `profileCompletedAt = now` and returns the same
shape as `GET`.

Avatar is **not** writable here. `avatar`, `avatarId`, `avatarFileId`, `file`,
`fileId`, and `files` are rejected with `400 avatar_not_writable` rather than
ignored, so no client can believe an avatar write succeeded. Use
`POST` / `DELETE /fan-account/avatar`. Arbitrary client-supplied `Upload.file`
ids are never accepted.

Errors: `400 displayName_invalid`, `400 displayName_too_long` (and the
`firstName`/`lastName` equivalents), `400 no_editable_fields`,
`400 avatar_not_writable`, `401 unauthorized`.

### `POST /api/fan-account/profile` — legacy, frozen

**This is not the global profile.** It calls `updateFanMessagingProfile` and
synchronizes `firstName`/`lastName` across the fan's claimed band-scoped `fan`
rows so messaging has a name. Its request/response contract is unchanged and
must stay that way; Messaging depends on it.

```
POST  = legacy band-scoped Fan name sync (messaging)
PATCH = global FanProfile identity
```

Converging the two is a possible future cleanup, not a current one.

`fan-profile` itself exposes no CRUD: `src/api/fan-profile/routes/fan-profile.js`
intentionally exports an empty route table, so the new fields gain no public
endpoint.

### `POST /api/fan-account/avatar`

Multipart only. The server validates content (magic bytes, not the filename),
normalizes to a 512×512 WebP with EXIF/GPS stripped, uploads through the public
Strapi Upload plugin, then associates the generated file with the caller's
canonical FanProfile (lowest id). `profileCompletedAt` is not changed.

Replacement order: new upload succeeds → associate → only then delete the prior
file, and only if it was this profile's previous avatar and has no other
relations. Cleanup goes through `upload.remove()` (plugin + provider). A cleanup
failure is logged; the new avatar stays. An association failure rolls back the
new file and keeps the old avatar.

Errors: `400 avatar_missing`, `400 avatar_invalid_type`, `400 avatar_too_large`,
`400 avatar_not_writable`, `400 avatar_process_failed`, `401 unauthorized`,
`500 avatar_upload_failed`, `500 avatar_associate_failed`.

### `DELETE /api/fan-account/avatar`

Clears the caller's avatar relation, then deletes the prior Upload.file when
it is safely owned. No avatar is a 200 with `avatarUrl: null`. Does not change
`profileCompletedAt`.

Both avatar endpoints return the same `{ data }` shape as GET profile.

---

## Avatar visibility

Fan avatar is **presentation media**, not secret media. It lives on the public
Upload/S3/CDN path. Do not use the protected DM/gallery provider.

It may be shown to artists who have a legitimate relationship with the fan, and
on authenticated fan surfaces. The asset URL being public does not authorize
discovery: do not expose avatars through unrelated public APIs. Authorization
still governs who can find the profile.

GPS/location EXIF is stripped on upload. Venue selfies must not leak coordinates.

Production uniqueness is still **UNKNOWN** until `npm run audit:fan-profile`
runs against production Postgres. Avatar writes use `ensureForUser` and
lowest-id, so they stay safe before the unique index exists.

---

## Validation

Applies to all three name fields.

- Whitespace is normalized first: tabs, newlines, line separators, and non-breaking
  spaces collapse to single spaces and are trimmed. A pasted name is not rejected
  for its whitespace.
- Length is counted in **visible characters** (code points), so an astral
  character counts once. Over-length values are rejected, never truncated.
  `displayName` 1–40, `firstName` 1–50, `lastName` 0–50.
- Rejected: C0/C1 control characters, zero-width characters, and bidi overrides.
  The invisible ones matter because these names render to artists — they enable
  lookalike and direction-spoofed identities.
- Rejected: `<` or `>`, so a name can never carry markup.
- Rejected: email-shaped values. A display name that is an email would leak the
  fan's address into the artist inbox.
- Punctuation is otherwise unrestricted. `Nik`, `nikbeats`, `Sarah J.`,
  `drumkid92`, `O'Brien`, `José`, `DJ K-9` are all valid.
- Non-string values are rejected, not coerced.

---

## Bulk profile loader

`loadProfilesByAccountUser(ids)` in `src/utils/fanProfile/fanProfileService.js`.

```
fan rows → unique accountUser ids → one query per 200 ids → Map(accountUserId → profile)
```

Never one query per fan row. `resolveIdentitiesForFans(fans)` combines the loader
with the resolver and returns `Map(fanId → identity)` using a single bounded
query for the batch.

Each query is bounded by an explicit `limit` equal to the chunk size, so a large
inbox page cannot build an unbounded `$in`. If a user somehow has two profile
rows, the lowest id wins.

Artist Inbox wires this after authorization:

- conversation list
- conversation detail
- DM candidate selector
- artist message-request list / accept result

`createInboxServiceFromStrapi` injects `resolveIdentitiesForFans`. Memory-store
tests keep a Fan-row fallback so they do not need a running database.

Fan-side conversation list/detail still show artist name and artist image.
Campaign recipient snapshots stay delivery-time copies and are not updated.

---

## Uniqueness

One `users-permissions` user owns at most one `FanProfile`.

Strapi stores the `oneToOne` as a link table (`fan_profiles_user_links`) and
only uniqueness-protects the *pair* `(fan_profile_id, user_id)`. That does not
stop two profiles from pointing at the same user. Schema `unique: true` is
intentionally not used — this repo's safe path for uniqueness is the same
audit-then-activate boot index used by attendance integrity
(`docs/FANEQO_DATA_INTEGRITY.md`). Strapi schema-sync `unique` can become a
constraint that `forceMigration` later drops.

`ensureForUser` in `src/utils/fanProfile/fanProfileService.js` is the only
find-or-create. `fanAccount.ensureFanProfile` delegates to it. Creating a row
still never sets `profileCompletedAt`. A uniqueness race is a refetch, not a
500: the loser returns the winner's row. Until any pre-constraint duplicates
are cleaned up, every read (ensure, GET, PATCH, bulk loader, `/me`, claim
bookkeeping) uses **lowest id wins**.

Boot (`ensureFanProfileIndexes`) audits first and only applies

```
CREATE UNIQUE INDEX IF NOT EXISTS fan_profiles_user_id_unique
  ON fan_profiles_user_links (user_id)
  WHERE user_id IS NOT NULL
```

when that database is `CLEAN`. Duplicates leave the index unapplied and boot
continues. The audit never deletes, merges, or rewrites identity rows.

Read-only audit: `npm run audit:fan-profile` →
`scripts/audit-fan-profile-uniqueness.js`. It prints aggregate counts only —
never emails, names, or user ids. A local `CLEAN` result does not prove
production is clean.

---

## Open items

- Production uniqueness is **UNKNOWN until a production audit is run**. Local
  SQLite cleanliness is not evidence about production Postgres.
- If a production audit returns `DUPLICATES`, stop. Classify SAFE /
  CONFLICTING / UNKNOWN. Do not auto-merge identity rows.
- `GET /api/fan-account/artists` still writes on read — see the technical debt
  note in `musicbizqr/docs/AUTH-FLOWS.md`.
- New Conversation server search still matches band-scoped Fan `firstName` /
  `lastName` / `city`, not `FanProfile.displayName`. Post-V1 polish. Do not
  turn this into a cross-table search rewrite.

---

## Tests

`npm run test:inbox` includes `scripts/test-inbox-fan-identity.js` — artist
Inbox list/detail/candidates/requests use FanProfile identity dynamically,
without rewriting Fan or Conversation rows, and without N+1 profile queries.

`npm run test:fan` includes:

- `scripts/test-fan-profile-identity.js` — schema, validation, resolver,
  GET/PATCH, bulk loader, legacy POST
- `scripts/test-fan-profile-uniqueness.js` — pair-index gap, SAFE/CONFLICTING
  classification, boot refuses dirty data, boot applies on CLEAN, race refetch,
  lowest-id canonical row, artist-as-fan, claim delegation
- `scripts/test-fan-profile-avatar.js` — MIME/size, EXIF strip, self-scoped
  upload/delete, injection, replace, failure isolation, PATCH still blocked

`npm run test:boot` also requires `fanProfileIndexes` and asserts bootstrap
wires `ensureFanProfileIndexes`.
