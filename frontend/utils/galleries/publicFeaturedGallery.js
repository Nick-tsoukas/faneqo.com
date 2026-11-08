/**
 * The public artist page renders one gallery: band.featuredGallery,
 * already shaped by the band API. Empty and incomplete payloads render nothing.
 */
export function resolvePublicFeaturedGallery(raw) {
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.photos) || !raw.photos.length) return null
  const photos = raw.photos.filter((photo) => photo && (photo.url || photo.src))
  if (!photos.length) return null
  return {
    id: raw.id,
    title: raw.title || '',
    slug: raw.slug || '',
    photoCount: photos.length,
    canonicalPath: raw.canonicalPath || '',
    photos,
  }
}

/** Up to three small crops for the Fan List. No path, no photos, no teaser. */
export function featuredGalleryTeaser(raw, limit = 3) {
  const gallery = resolvePublicFeaturedGallery(raw)
  if (!gallery?.canonicalPath) return null
  const cap = Math.max(1, Math.min(3, Number(limit) || 3))
  const photos = gallery.photos
    .map((photo) => ({
      id: photo.id,
      src: photo.thumbnailUrl || photo.thumbUrl || photo.url || photo.src,
      alt: photo.alt || '',
      width: photo.width || null,
      height: photo.height || null,
    }))
    .filter((photo) => photo.src)
    .slice(0, cap)
  if (!photos.length) return null
  return { path: gallery.canonicalPath, photos }
}
