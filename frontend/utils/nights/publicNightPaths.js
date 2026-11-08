/**
 * Canonical public Night / Gallery paths.
 * Presentation only. Slugs come from the backend — never invent them.
 */

function cleanSegment(value) {
  return String(value || '')
    .trim()
    .replace(/^\/+|\/+$/g, '')
}

export function isSafePathSegment(value) {
  const segment = cleanSegment(value)
  return !!segment && !segment.includes('/') && !segment.includes('..')
}

export function nightPath(bandSlug, nightSlug) {
  if (!isSafePathSegment(bandSlug) || !isSafePathSegment(nightSlug)) return null
  return `/${cleanSegment(bandSlug)}/night/${cleanSegment(nightSlug)}`
}

export function galleryPath(bandSlug, gallerySlug) {
  if (!isSafePathSegment(bandSlug) || !isSafePathSegment(gallerySlug)) return null
  return `/${cleanSegment(bandSlug)}/gallery/${cleanSegment(gallerySlug)}`
}

export function nightPathFromRecap(recap, bandSlug) {
  const slug = recap?.nightSlug
  const band = recap?.band?.slug || bandSlug
  return nightPath(band, slug)
}

export function isLegacyGalleryViewerPath(path) {
  return /^\/[^/]+\/updates\/[^/]+$/.test(String(path || '').split(/[?#]/)[0])
}
