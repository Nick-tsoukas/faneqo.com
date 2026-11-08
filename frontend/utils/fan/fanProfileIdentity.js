/**
 * Global fan profile identity — pure helpers shared by the profile page, the
 * fan home identity strip, and the profile composable.
 *
 * Two rules this module exists to protect:
 *
 * 1. A chosen `displayName` and a structured first/last name are different
 *    things. The read view may fall back to the structured name, but the
 *    editor must leave the display-name field empty until the fan chooses one.
 * 2. Email is never an identity source. Deriving a name from the local part
 *    would leak the fan's address into artist-facing surfaces the first time
 *    one of these helpers is reused there.
 */

/** Only these may be written through PATCH /api/fan-account/profile. */
export const FAN_PROFILE_WRITABLE_FIELDS = ['displayName', 'firstName', 'lastName']

/** Mirrors the backend maxima so the editor stops before the server has to. */
export const FAN_PROFILE_LIMITS = {
  displayName: 40,
  firstName: 50,
  lastName: 50,
}

function cleanName(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim()
}

function firstVisibleChar(value) {
  const ch = Array.from(cleanName(value))[0]
  return ch ? ch.toUpperCase() : ''
}

/** The fan's own chosen social identity, or null when they have not set one. */
export function fanProfileChosenName(profile) {
  return cleanName(profile?.displayName) || null
}

/** Full first + last. Used by the editor, never as a silent displayName seed. */
export function fanProfileStructuredName(profile) {
  const parts = [cleanName(profile?.firstName), cleanName(profile?.lastName)].filter(Boolean)
  return parts.join(' ') || null
}

/**
 * Self-view fallback when the fan has not chosen a display name.
 * First name plus a last initial — "Nik T." — so the legal last name is not
 * treated as a social identity they never picked.
 */
export function fanProfileFallbackName(profile) {
  const first = cleanName(profile?.firstName)
  const last = cleanName(profile?.lastName)
  if (first && last) {
    const initial = firstVisibleChar(last)
    return initial ? `${first} ${initial}.` : first
  }
  return first || last || null
}

/** What the read view shows, or null when there is nothing to show yet. */
export function fanProfileDisplayName(profile) {
  return fanProfileChosenName(profile) || fanProfileFallbackName(profile)
}

/** Up to two initials for the avatar placeholder, or '' when unnamed. */
export function fanProfileInitials(profile) {
  const chosen = fanProfileChosenName(profile)
  if (chosen) {
    const parts = chosen.split(' ').filter(Boolean)
    return parts
      .slice(0, 2)
      .map((part) => firstVisibleChar(part))
      .join('')
  }
  const first = firstVisibleChar(profile?.firstName)
  const last = firstVisibleChar(profile?.lastName)
  return `${first}${last}`
}

/**
 * Whether to gently encourage completion. Enrichment only — nothing in the fan
 * app is gated on this.
 */
export function fanProfileNeedsCompletion(profile) {
  if (!profile) return true
  if (!fanProfileDisplayName(profile)) return true
  return !profile.profileCompletedAt
}

/**
 * Editor values. `displayName` is intentionally not seeded from the structured
 * fallback: an empty field means "I have not chosen a display name".
 */
export function fanProfileFormValues(profile) {
  return {
    displayName: cleanName(profile?.displayName),
    firstName: cleanName(profile?.firstName),
    lastName: cleanName(profile?.lastName),
  }
}

/**
 * PATCH body. Every editable field is sent every time so that emptying one is
 * an explicit clear, not an omission the backend would leave untouched.
 */
export function fanProfilePatchBody(form = {}) {
  const body = {}
  for (const field of FAN_PROFILE_WRITABLE_FIELDS) {
    body[field] = cleanName(form?.[field])
  }
  return body
}

/** True when the editor would send nothing different from what is stored. */
export function fanProfileFormIsUnchanged(form, profile) {
  const next = fanProfilePatchBody(form)
  const current = fanProfilePatchBody(fanProfileFormValues(profile))
  return FAN_PROFILE_WRITABLE_FIELDS.every((field) => next[field] === current[field])
}

const FIELD_LABELS = {
  displayName: 'Display name',
  firstName: 'First name',
  lastName: 'Last name',
}

/**
 * Maps a backend validation error onto the field that caused it.
 * Backend remains authoritative; these strings are only the fan-facing layer.
 */
export function fanProfileFieldError(apiError) {
  const name = String(apiError?.name || '')
  const match = /^(displayName|firstName|lastName)_(invalid|too_long)$/.exec(name)
  if (!match) return null
  const field = match[1]
  const kind = match[2]
  if (kind === 'too_long') {
    return {
      field,
      message: `${FIELD_LABELS[field]} must be ${FAN_PROFILE_LIMITS[field]} characters or fewer.`,
    }
  }
  return {
    field,
    message: `Enter a valid ${FIELD_LABELS[field].toLowerCase()}.`,
  }
}

/** Recommended multipart field. Backend also accepts `file` / `files`. */
export const FAN_AVATAR_FIELD = 'avatar'

export const FAN_AVATAR_ACCEPT = 'image/jpeg,image/png,image/webp'

export const FAN_AVATAR_ACCEPT_TYPES = ['image/jpeg', 'image/png', 'image/webp']

/** Client warning only. Backend 4 MB limit remains authoritative. */
export const FAN_AVATAR_MAX_BYTES = 4 * 1024 * 1024

const AVATAR_ERROR_COPY = {
  avatar_invalid_type: 'Choose a JPEG, PNG, or WebP image.',
  avatar_too_large: 'Choose an image smaller than 4 MB.',
  avatar_process_failed: "We couldn't process that photo. Try another image.",
  avatar_upload_failed: 'Photo upload failed. Try again.',
  avatar_associate_failed: "Couldn't save that photo. Try again.",
  avatar_missing: 'Choose a photo to continue.',
  avatar_not_writable: "Couldn't update that photo. Try again.",
}

/** Fan-facing avatar error. Never used as a second validation engine. */
export function fanAvatarErrorMessage(apiError) {
  const name = String(apiError?.name || apiError?.code || '').trim()
  if (AVATAR_ERROR_COPY[name]) return AVATAR_ERROR_COPY[name]
  const message = String(apiError?.message || '').trim()
  if (AVATAR_ERROR_COPY[message]) return AVATAR_ERROR_COPY[message]
  return null
}

/**
 * Local UX gate before we open preview / hit the network.
 * Backend still decides what is actually accepted.
 */
export function fanAvatarClientCheck(file) {
  if (!file) {
    return { ok: false, code: 'avatar_missing', message: AVATAR_ERROR_COPY.avatar_missing }
  }
  const type = String(file.type || '').toLowerCase()
  if (type && !FAN_AVATAR_ACCEPT_TYPES.includes(type)) {
    return { ok: false, code: 'avatar_invalid_type', message: AVATAR_ERROR_COPY.avatar_invalid_type }
  }
  if (Number(file.size) > FAN_AVATAR_MAX_BYTES) {
    return { ok: false, code: 'avatar_too_large', message: AVATAR_ERROR_COPY.avatar_too_large }
  }
  return { ok: true }
}

/** Display URL. Relative Upload paths need the Strapi origin; blob/data stay as-is. */
export function resolveFanAvatarUrl(url, baseUrl = '') {
  const raw = String(url || '').trim()
  if (!raw || raw.startsWith('faneqo-protected:')) return null
  if (/^(https?:|blob:|data:)/i.test(raw)) return raw
  const base = String(baseUrl || '').replace(/\/$/, '')
  if (raw.startsWith('/')) return base ? `${base}${raw}` : raw
  return raw
}
