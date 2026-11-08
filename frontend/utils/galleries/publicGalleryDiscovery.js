/**
 * Public gallery discovery. Presentation only.
 * Eligibility stays on the server. These helpers only arrange what it returned.
 */
import { isSafePathSegment } from '../nights/publicNightPaths.js'

function clean(value) {
  return String(value || '').trim().replace(/^\/+|\/+$/g, '')
}

export function publicGalleryArchivePath(bandSlug) {
  if (!isSafePathSegment(bandSlug)) return ''
  return `/${clean(bandSlug)}/galleries`
}

export function publicGalleryCountLabel(count) {
  const n = Number(count) || 0
  if (n === 1) return '1 photo'
  return `${n} photos`
}

/** Other public galleries, newest first, never the one on screen. */
export function morePublicGalleries(galleries, currentSlug, limit = 3) {
  const current = String(currentSlug || '').trim()
  const cap = Number(limit) > 0 ? Number(limit) : 3
  return (Array.isArray(galleries) ? galleries : [])
    .filter((row) => row && row.slug && row.slug !== current && row.canonicalPath && row.cover?.url)
    .slice(0, cap)
}
