/**
 * Artist-facing fan identity. Never use email or accountUser ids.
 * Relationship lines use real show counts only — no Superfan / VIP heuristics.
 */

export const FANEQO_FAN_FALLBACK = 'Faneqo fan'

export function looksLikeEmail(value) {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

export function normalizePersonName(value) {
  const raw = String(value || '').trim()
  if (!raw || looksLikeEmail(raw)) return ''
  return raw.replace(/\s+/g, ' ')
}

function isBareFanLabel(value) {
  return String(value || '').trim().toLowerCase() === 'fan'
}

function isUnnamedFanLabel(value) {
  const lower = String(value || '').trim().toLowerCase()
  return lower === 'unnamed fan' || lower === 'faneqo fan'
}

function isCityFanLabel(value) {
  const lower = String(value || '').trim().toLowerCase()
  return lower.endsWith(' fan') && !isBareFanLabel(lower) && !isUnnamedFanLabel(lower)
}

export function isFallbackFanDisplay(value) {
  const raw = String(value || '').trim()
  if (!raw) return true
  return isBareFanLabel(raw) || isUnnamedFanLabel(raw) || isCityFanLabel(raw)
}

function cityFanTitle(city) {
  const cityName = String(city || '').trim()
  return cityName ? `${cityName} fan` : ''
}

function formatPersonDisplayName(display) {
  const parts = normalizePersonName(display).split(' ').filter(Boolean)
  if (parts.length >= 2) return `${parts[0]} ${parts[1][0].toUpperCase()}.`
  return parts[0] || ''
}

/**
 * Prefer the backend's already-resolved displayName.
 * Do not re-reduce a chosen name like "Nik Beats" to "Nik B.".
 */
export function artistFacingDisplayName(fan) {
  const resolved = normalizePersonName(fan?.displayName)
  if (resolved && !isUnnamedFanLabel(resolved) && !isBareFanLabel(resolved)) return resolved
  return safeFanDisplayName(fan)
}

export function safeFanDisplayName(fan) {
  const first = normalizePersonName(fan?.firstName)
  const last = normalizePersonName(fan?.lastName)
  if (first && last) return `${first} ${last[0].toUpperCase()}.`
  if (first) return first

  const display = normalizePersonName(fan?.displayName)
  if (isCityFanLabel(display)) return display
  if (display && !isUnnamedFanLabel(display) && !isBareFanLabel(display)) {
    return formatPersonDisplayName(display)
  }

  const fromCity = cityFanTitle(fan?.city)
  if (fromCity) return fromCity
  return FANEQO_FAN_FALLBACK
}

export function fanInitials(fanOrName) {
  if (typeof fanOrName === 'string') {
    if (isFallbackFanDisplay(fanOrName) || !normalizePersonName(fanOrName)) return 'F'
    const parts = normalizePersonName(fanOrName).split(' ').filter(Boolean)
    if (!parts.length) return 'F'
    return ((parts[0][0] || '') + (parts[1] ? parts[1][0] : '')).toUpperCase() || 'F'
  }
  const display = safeFanDisplayName(fanOrName)
  if (isFallbackFanDisplay(display)) return 'F'
  return fanInitials(display)
}

function salvageShowCount(context) {
  const match = String(context || '').match(/(\d+)\s+shows?\b/i)
  if (!match) return 0
  return Number(match[1]) || 0
}

export function formatArtistFanContext(fan = {}) {
  const displayName = fan.displayName && !isBareFanLabel(fan.displayName)
    ? String(fan.displayName).trim()
    : safeFanDisplayName(fan)
  const cityName = String(fan.city || '').trim() || (
    isCityFanLabel(displayName) ? displayName.slice(0, -4).trim() : ''
  )
  const hideCity = !!cityName && displayName.toLowerCase() === `${cityName.toLowerCase()} fan`

  const shows = Number(fan.showCount ?? fan.checkedInShowCount) || salvageShowCount(fan.context)
  const parts = []
  if (cityName && !hideCity) parts.push(cityName)
  if (shows === 1) parts.push('1 show')
  if (shows >= 2) parts.push(`${shows} shows`)
  return parts.join(' · ')
}

export function isRequestRowId(id) {
  return String(id || '').startsWith('request:')
}

export function requestIdFromRow(id) {
  const raw = String(id || '')
  if (!raw.startsWith('request:')) return null
  const n = Number(raw.slice('request:'.length))
  return Number.isFinite(n) && n > 0 ? n : null
}
