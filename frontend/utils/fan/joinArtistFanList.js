/**
 * Shared Artist Page fan-list join.
 * Follow sheet and FanCaptureSection both use this so Follow and Fan List
 * stay one write, not two competing subscribe paths.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Must match qrserver fan.source / fan.captureSurface enums. Unknown values 500. */
const FAN_SOURCES = new Set(['band_page', 'follow_modal', 'import', 'manual', 'show_mode', 'other'])
const FAN_SURFACES = new Set([
  'band_page',
  'follow_modal',
  'qr_poster',
  'qr_merch_table',
  'qr_stage_screen',
  'qr_flyer',
  'event_page',
  'direct_link',
  'unknown',
])

function safeFanSource(source) {
  return FAN_SOURCES.has(source) ? source : 'other'
}

function safeFanSurface(surface) {
  return FAN_SURFACES.has(surface) ? surface : 'unknown'
}

export function normalizeFanEmail(email) {
  return String(email || '').trim().toLowerCase()
}

export function isValidFanEmail(email) {
  return EMAIL_RE.test(normalizeFanEmail(email))
}

function subscribeEndpoints(strapiUrl, subscribeUrl) {
  const endpoints = []
  if (subscribeUrl) endpoints.push(subscribeUrl)
  const base = String(strapiUrl || '').replace(/\/$/, '')
  if (base) endpoints.push(`${base}/api/fans/subscribe`)
  if (typeof window !== 'undefined') endpoints.push('/api/fans/subscribe')
  return [...new Set(endpoints)]
}

function isTransportFailure(response, result) {
  if (!response) return true
  if (response.status === 502 || response.status === 503) return true
  if (response.status === 404 && !result?.error?.message) return true
  return false
}

function resolveBandId(bandId) {
  const n = Number.parseInt(bandId, 10)
  return Number.isFinite(n) && n > 0 ? n : null
}

function readSubscribeError(result) {
  const raw =
    result?.error?.message
    || result?.data?.error?.message
    || result?.statusMessage
    || (typeof result?.message === 'string' && result.message.length < 160 ? result.message : '')
  if (typeof raw === 'string' && raw.trim() && raw.length < 160) return raw.trim()
  return ''
}

export async function joinArtistFanList({
  strapiUrl,
  email,
  bandId,
  source = 'band_page',
  captureSurface = 'band_page',
  visitorToken,
  authToken,
  eventId,
  subscribeUrl,
  marketingConsent,
} = {}) {
  const normalizedEmail = normalizeFanEmail(email)
  if (!isValidFanEmail(normalizedEmail)) {
    return { ok: false, reason: 'invalid_email', message: 'Please enter a valid email address' }
  }
  const resolvedBandId = resolveBandId(bandId)
  const endpoints = subscribeEndpoints(strapiUrl, subscribeUrl)
  if (!resolvedBandId || !endpoints.length) {
    return { ok: false, reason: 'missing_band', message: 'Could not follow this artist. Try again.' }
  }

  const payload = {
    email: normalizedEmail,
    bandId: resolvedBandId,
    source: safeFanSource(source),
    captureSurface: safeFanSurface(captureSurface),
  }
  if (visitorToken) payload.visitorToken = visitorToken
  if (eventId) payload.eventId = eventId
  if (marketingConsent === false) payload.marketingConsent = false

  const headers = { 'Content-Type': 'application/json' }
  if (authToken) headers.Authorization = `Bearer ${authToken}`

  let result = {}
  let response
  let sawNetwork = false
  for (const endpoint of endpoints) {
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      })
      result = await response.json().catch(() => ({}))
      if (response.ok || !isTransportFailure(response, result)) break
    } catch {
      sawNetwork = true
      response = null
      result = {}
    }
  }

  if (!response) {
    return {
      ok: false,
      reason: 'network',
      message: sawNetwork
        ? 'Could not reach the server. Check that the local API is running.'
        : 'Could not follow this artist. Try again.',
    }
  }

  if (!response.ok) {
    return {
      ok: false,
      reason: 'api',
      message: readSubscribeError(result) || 'Could not follow this artist. Try again.',
    }
  }

  const message = String(result?.data?.message || '')
  const subscribed = typeof result?.data?.subscribed === 'boolean'
    ? result.data.subscribed
    : true
  return {
    ok: true,
    email: normalizedEmail,
    already: /already/i.test(message),
    subscribed,
  }
}
