/**
 * Manual artwork for the Creative Studio (pure helpers, Node-testable).
 *
 * An upload is just another media ref in a creative's content, with
 * `source: 'studio_upload'`. Files go through Strapi's normal upload plugin
 * with the signed-in user's JWT; nothing is attached to a band, so the public
 * artist page never changes. Reuse across creatives is by reference (same
 * URL / upload id), never by re-uploading the file.
 */

import { defaultFocalY } from './artistSnapshot.js'

export const STUDIO_UPLOAD_SOURCE = 'studio_upload'
export const STUDIO_UPLOAD_CAPTION = 'faneqo-studio'
/** Same ceiling as the rest of Faneqo's image uploads (utils/media/faneqoMedia.js). */
export const STUDIO_UPLOAD_MAX_BYTES = 8 * 1024 * 1024
export const STUDIO_UPLOAD_MIMES = ['image/jpeg', 'image/png', 'image/webp']
export const STUDIO_UPLOAD_ACCEPT = STUDIO_UPLOAD_MIMES.join(',')

/** Content keys that can hold a media ref. Kept in one place for reuse scans and artist swaps. */
export const MEDIA_CONTENT_KEYS = ['photo', 'songArt', 'art']

export function isStudioUpload(ref) {
  return Boolean(ref && typeof ref === 'object' && ref.source === STUDIO_UPLOAD_SOURCE && ref.url)
}

export function validateStudioImage(file) {
  if (!file) return { ok: false, error: 'Choose an image file.' }
  const type = String(file.type || '').toLowerCase()
  if (!STUDIO_UPLOAD_MIMES.includes(type)) return { ok: false, error: 'Use a JPEG, PNG, or WebP image.' }
  if (Number(file.size) > STUDIO_UPLOAD_MAX_BYTES) return { ok: false, error: 'Keep images under 8 MB.' }
  return { ok: true, error: null }
}

function absoluteUrl(url, strapiUrl) {
  const raw = String(url || '').trim()
  if (!raw) return ''
  if (/^(https?:)?\/\//i.test(raw) || raw.startsWith('data:') || raw.startsWith('blob:')) return raw
  const base = String(strapiUrl || '').replace(/\/+$/, '')
  return base ? `${base}${raw.startsWith('/') ? '' : '/'}${raw}` : raw
}

/** Map a Strapi upload response row (v4 flat shape) to a studio media ref. */
export function uploadRefFromStrapi(media, { strapiUrl = '', label = null } = {}) {
  if (!media) return null
  const url = absoluteUrl(media.url, strapiUrl)
  if (!url) return null
  const width = Number(media.width) || null
  const height = Number(media.height) || null
  return {
    id: media.id ?? null,
    url,
    width,
    height,
    orientation: width && height ? (width > height ? 'landscape' : width < height ? 'portrait' : 'square') : null,
    label: label || media.alternativeText || media.name || 'Uploaded artwork',
    source: STUDIO_UPLOAD_SOURCE,
    use: 'organic',
    focal: { x: 50, y: defaultFocalY(width, height) },
    credit: null,
    uploadedAt: media.createdAt || null,
  }
}

/**
 * Every studio upload referenced by a list of creatives (library rows carry
 * `content`), newest first, unique by URL. Used for "previously uploaded".
 */
export function collectStudioUploads(creatives, { exclude = [] } = {}) {
  const skip = new Set((exclude || []).map((u) => String(u)))
  const seen = new Set()
  const out = []
  const sorted = [...(creatives || [])].sort((a, b) => String(b?.updatedAt || '').localeCompare(String(a?.updatedAt || '')))
  for (const creative of sorted) {
    const content = creative?.content || {}
    for (const key of MEDIA_CONTENT_KEYS) {
      const ref = content[key]
      if (!isStudioUpload(ref) || seen.has(ref.url) || skip.has(ref.url)) continue
      seen.add(ref.url)
      out.push({ ...ref, group: 'Uploaded' })
    }
  }
  return out
}
