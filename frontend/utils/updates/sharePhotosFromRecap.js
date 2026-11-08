/**
 * Recap → Share Photos entry. Canonical night id is showRecapId.
 * Query city/venue/from are display/return only. Never put Show Mode sm_… here.
 */

export function recapIdFrom(recap) {
  const raw = recap?.id ?? recap?.recapId
  const id = parseInt(raw, 10)
  return Number.isFinite(id) && id > 0 ? String(id) : null
}

function numericEventId(value) {
  if (value == null || value === '') return null
  const str = String(value).trim()
  if (!str || str.startsWith('sm_')) return null
  const id = parseInt(str, 10)
  return Number.isFinite(id) && id > 0 ? String(id) : null
}

export function safeSharePhotosReturnPath(from, recapId) {
  const raw = String(from || '')
  if (raw.startsWith('/fans') || raw.startsWith('/dashboard') || raw.startsWith('/nights')) return raw
  return recapId ? `/fans/recaps/${recapId}` : '/fans/recaps'
}

export function buildSharePhotosPath(recap, { from } = {}) {
  const recapId = recapIdFrom(recap)
  if (!recapId) return null
  const query = new URLSearchParams({ recapId })
  const eventId = numericEventId(recap?.eventId)
  if (eventId) query.set('eventId', eventId)
  const returnPath = from ? safeSharePhotosReturnPath(from, recapId) : null
  if (returnPath) query.set('from', returnPath)
  const city = String(recap?.city || '').trim()
  const venue = String(recap?.venue || '').trim()
  if (city) query.set('city', city)
  if (venue) query.set('venue', venue)
  return `/galleries/new?${query.toString()}`
}
