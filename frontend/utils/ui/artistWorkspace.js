/**
 * Artist workspace identity from GET /api/me/band-access.
 *
 * Route context stays in appShell. This answers two different questions, and
 * conflating them is what let a two-band artist read Band A inside Band B:
 *
 * - CAPABILITY: does this user have any confirmed artist access at all?
 *   `resolveWorkspaceBand` — first owned, then first team. Chrome only.
 * - SCOPE: which band is this screen actually operating on?
 *   `resolveActiveWorkspaceBand` — a validated choice, or no band at all.
 *
 * Never use the capability answer to load or write band data. A `bandId` from
 * a URL, query, or localStorage is a hint; only a row present in the
 * band-access payload is authorization.
 */

export const WORKSPACE_MODE = Object.freeze({
  /** No authorized band. */
  NONE: 'none',
  /** Exactly one authorized band — hints are irrelevant. */
  SINGLE: 'single',
  /** Several authorized bands and no usable choice yet. */
  PICKER: 'picker',
  /** Several authorized bands, one validated choice. */
  SCOPED: 'scoped',
})

function usable(row) {
  return !!(row && (row.slug || row.bandId))
}

function normalize(row, { isOwner }) {
  const rawSlug = typeof row.slug === 'string' ? row.slug.trim() : ''
  return {
    bandId: row.bandId ?? null,
    slug: rawSlug || null,
    name: row.name || null,
    role: row.role || (isOwner ? 'owner' : null),
    isOwner,
    permissions: row.permissions || null,
  }
}

/**
 * Capability only: is this user an artist, and which band should generic
 * chrome fall back to? Do not scope data with this.
 */
export function resolveWorkspaceBand(access) {
  const owned = Array.isArray(access?.owned) ? access.owned : []
  const team = Array.isArray(access?.teamAccess) ? access.teamAccess : []

  const row = owned.find(usable) || team.find(usable) || null
  if (!row) return null

  const rawSlug = typeof row.slug === 'string' ? row.slug.trim() : ''
  return {
    bandId: row.bandId ?? null,
    slug: rawSlug || null,
    name: row.name || null,
    role: row.role || null,
  }
}

/**
 * Every band this user may act on, owned first then accepted team access.
 * `permission` filters to rows whose permission matrix allows that key;
 * owners without an explicit matrix are trusted, matching resolveComposerBand.
 */
export function authorizedWorkspaceBands(access, permission = null) {
  const owned = Array.isArray(access?.owned) ? access.owned : []
  const team = Array.isArray(access?.teamAccess) ? access.teamAccess : []

  const rows = [
    ...owned.filter(usable).map((row) => normalize(row, { isOwner: true })),
    ...team.filter(usable).map((row) => normalize(row, { isOwner: false })),
  ]

  if (!permission) return rows
  return rows.filter((row) => {
    if (row.permissions) return row.permissions[permission] !== false && !!row.permissions[permission]
    // Legacy payload with no matrix: owners keep every capability.
    return row.isOwner
  })
}

/** Positive integer or null. Tolerates arrays and junk from route queries. */
export function parseWorkspaceBandHint(raw) {
  const value = Array.isArray(raw) ? raw[0] : raw
  if (value == null) return null
  const text = String(value).trim()
  if (text === '' || !/^\d+$/.test(text)) return null
  const id = Number.parseInt(text, 10)
  return Number.isInteger(id) && id > 0 ? id : null
}

/**
 * The band this screen may operate on.
 *
 * One band means there is nothing to disambiguate, so a hint is ignored
 * rather than honoured and single-band users behave exactly as before.
 * Several bands with a hint that matches nothing authorized resolves to
 * PICKER — never to whichever band happens to sort first.
 */
export function resolveActiveWorkspaceBand(access, hint, permission = null) {
  const bands = authorizedWorkspaceBands(access, permission)

  if (!bands.length) return { mode: WORKSPACE_MODE.NONE, band: null, bands }
  if (bands.length === 1) return { mode: WORKSPACE_MODE.SINGLE, band: bands[0], bands }

  const wanted = parseWorkspaceBandHint(hint)
  if (wanted === null) return { mode: WORKSPACE_MODE.PICKER, band: null, bands }

  const match = bands.find((row) => String(row.bandId) === String(wanted)) || null
  if (!match) return { mode: WORKSPACE_MODE.PICKER, band: null, bands }

  return { mode: WORKSPACE_MODE.SCOPED, band: match, bands }
}

/**
 * Carry the active band across a workspace link.
 *
 * Only SCOPED adds the query: a single-band user's URLs must stay byte-for-byte
 * what they are today. Existing query strings are preserved.
 */
export function withActiveBand(path, resolved) {
  if (!path || typeof path !== 'string') return path
  if (resolved?.mode !== WORKSPACE_MODE.SCOPED) return path
  const bandId = resolved.band?.bandId
  if (bandId == null) return path
  if (/[?&]bandId=/.test(path)) return path
  if (/^(https?:)?\/\//i.test(path)) return path
  return `${path}${path.includes('?') ? '&' : '?'}bandId=${bandId}`
}
