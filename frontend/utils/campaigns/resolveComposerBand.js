/**
 * Pick an authorized band for the campaign composer.
 * Query bandId is a hint only — never used as authorization.
 */
export function resolveComposerBand(access, hintedBandId) {
  const owned = Array.isArray(access?.owned) ? access.owned : []
  const team = Array.isArray(access?.teamAccess) ? access.teamAccess : []

  function ownerCanSend(row) {
    if (!row?.bandId) return false
    if (row.permissions) return row.permissions.sendFanMessages !== false
    return true
  }

  function teamCanSend(row) {
    if (!row?.bandId) return false
    return !!row.permissions?.sendFanMessages
  }

  const candidates = [...owned.filter(ownerCanSend), ...team.filter(teamCanSend)]
  if (!candidates.length) return null

  const hint = hintedBandId != null && String(hintedBandId).trim() !== '' ? String(hintedBandId) : ''
  if (hint) {
    const match = candidates.find((row) => String(row.bandId) === hint)
    if (match) return match
  }

  // More than one artist and no usable hint: the caller must ask which one.
  // Returning candidates[0] here is how a two-band artist ended up composing
  // to Band A's fans from inside Band B.
  if (candidates.length > 1) return null

  return candidates[0] || null
}

export function composerBackTarget(from) {
  if (from === 'fan-intelligence') {
    return { path: '/dashboard', label: 'Fan Intelligence' }
  }
  return { path: '/messages?tab=sent&refresh=1', label: 'Messages' }
}
