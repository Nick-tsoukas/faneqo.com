/**
 * Which artist workspace the dashboard is showing.
 *
 * One user may own more than one band (`Band.users_permissions_user` is
 * many-to-one). The dashboard used to render `bandItems[0]`, which silently
 * picked whichever band sorted first by `updatedAt` — the same undefined
 * ordering `src/utils/fans/resolveScopedBand.js` refuses to infer on the API
 * side. A multi-band owner could read one band's numbers beside another
 * band's list.
 *
 * `?bandId=` is a navigation hint only. `bandItems` is built from
 * GET /api/me/band-access (owned + accepted team access), so a hint can only
 * resolve to a band the server already authorized this user for. An id that
 * matches nothing goes to the picker; it never falls back to another band.
 */

export const DASHBOARD_WORKSPACE = Object.freeze({
  /** Zero or one authorized band — today's dashboard, no picker step. */
  SINGLE: 'single',
  /** Several authorized bands and none chosen yet. */
  PICKER: 'picker',
  /** Several authorized bands, one validated choice. */
  SCOPED: 'scoped',
})

/** Positive integer or null. Never throws on array/garbage query values. */
export function parseBandIdHint(raw) {
  const value = Array.isArray(raw) ? raw[0] : raw
  if (value == null) return null
  const text = String(value).trim()
  if (text === '' || !/^\d+$/.test(text)) return null
  const id = Number.parseInt(text, 10)
  return Number.isInteger(id) && id > 0 ? id : null
}

export function resolveDashboardWorkspace(bandItems, rawBandId) {
  const bands = Array.isArray(bandItems)
    ? bandItems.filter((band) => band && band.id != null)
    : []

  // One band cannot be ambiguous, so a hint has nothing to disambiguate and is
  // ignored rather than honoured — a single-band user can never address another
  // band through the URL.
  if (bands.length <= 1) {
    return { mode: DASHBOARD_WORKSPACE.SINGLE, band: bands[0] || null, redirect: null }
  }

  const hint = parseBandIdHint(rawBandId)
  if (hint === null) {
    return { mode: DASHBOARD_WORKSPACE.PICKER, band: null, redirect: null }
  }

  const match = bands.find((band) => String(band.id) === String(hint)) || null
  if (!match) {
    // Unauthorized, deleted, or malformed: strip the hint instead of opening
    // whatever happens to be first.
    return { mode: DASHBOARD_WORKSPACE.PICKER, band: null, redirect: '/dashboard' }
  }

  return { mode: DASHBOARD_WORKSPACE.SCOPED, band: match, redirect: null }
}

/** `/dashboard?bandId=` for a band, or bare `/dashboard` when there is none. */
export function dashboardPathForBand(bandId) {
  const id = parseBandIdHint(bandId)
  return id === null ? '/dashboard' : `/dashboard?bandId=${id}`
}

/** `/newevent?bandId=` for the open artist, or bare `/newevent` when there is none. */
export function newEventPathForBand(bandId) {
  const id = parseBandIdHint(bandId)
  return id === null ? '/newevent' : `/newevent?bandId=${id}`
}

/**
 * Events in a scoped workspace. `Event.band` is optional, so events created
 * before the relation existed carry no band and would otherwise vanish from
 * every workspace; they stay visible rather than becoming unreachable.
 */
export function scopeEventsToBand(eventItems, activeBandId) {
  const rows = Array.isArray(eventItems) ? eventItems : []
  if (activeBandId == null) return rows
  return rows.filter(
    (ev) => ev?.bandId == null || String(ev.bandId) === String(activeBandId)
  )
}
