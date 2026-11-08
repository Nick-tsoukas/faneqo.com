/**
 * Where a creative loads an image from.
 *
 * Studio assets under /images and data URLs are used as-is. Remote artist media
 * (S3 uploads, Spotify thumbnails) go through the studio's authenticated
 * same-origin proxy so the browser renderer can read the pixels for export.
 */
export const STUDIO_MEDIA_PROXY = '/api/ads/media'

export function studioImageUrl(url) {
  const raw = String(url || '').trim()
  if (!raw) return ''
  if (raw.startsWith('data:') || raw.startsWith('blob:') || raw.startsWith('/')) return raw
  if (!/^https?:\/\//i.test(raw)) return raw
  if (typeof window !== 'undefined') {
    try {
      if (new URL(raw).origin === window.location.origin) return raw
    } catch {
      return raw
    }
  }
  return `${STUDIO_MEDIA_PROXY}?u=${encodeURIComponent(raw)}`
}

export function focalToObjectPosition(focal) {
  const x = Number(focal?.x)
  const y = Number(focal?.y)
  const fx = Number.isFinite(x) ? Math.min(100, Math.max(0, x)) : 50
  const fy = Number.isFinite(y) ? Math.min(100, Math.max(0, y)) : 50
  return `${fx}% ${fy}%`
}
