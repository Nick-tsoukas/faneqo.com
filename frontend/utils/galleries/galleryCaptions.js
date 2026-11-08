/**
 * Per-photo captions are a map of Upload file id → text. Reordering never
 * rewrites them; a leftover key from a removed or retried photo must never
 * be sent, because the server treats that as a foreign photo.
 */

export function numericMediaOrder(list) {
  const rows = Array.isArray(list) ? list : []
  return rows
    .map((value) => (typeof value === 'object' ? value?.mediaId : value))
    .filter((value) => value != null && value !== '')
    .map((value) => (Number.isFinite(Number(value)) ? Number(value) : value))
}

export function captionMap(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const out = {}
  for (const [key, value] of Object.entries(raw)) {
    if (value == null) continue
    out[String(key)] = String(value)
  }
  return out
}

export function ownedCaptionMap(raw, mediaIds) {
  const allowed = new Set(numericMediaOrder(mediaIds).map(String))
  const captions = captionMap(raw)
  const out = {}
  for (const [key, value] of Object.entries(captions)) {
    if (allowed.has(String(key))) out[key] = value
  }
  return out
}
