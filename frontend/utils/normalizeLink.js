/**
 * Normalize and validate outbound http(s) URLs for band profile fields.
 */

export function normalizeLink(link) {
  if (!link) return ''
  const trimmed = String(link).trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  if (/^www\./i.test(trimmed)) return `https://${trimmed}`
  return `https://www.${trimmed}`
}

/** Empty string is valid (optional fields). */
export function isValidHttpUrl(link) {
  const trimmed = link == null ? '' : String(link).trim()
  if (!trimmed) return true
  const normalized = normalizeLink(trimmed)
  try {
    const u = new URL(normalized)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

export function normalizeLinkOrNull(link) {
  const trimmed = link == null ? '' : String(link).trim()
  if (!trimmed) return null
  return normalizeLink(trimmed) || null
}
