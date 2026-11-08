import { sanitizeFanReturnTo } from '../fan/safeFanReturnTo.js'

export function positivePassportId(value) {
  const id = Number.parseInt(value, 10)
  return Number.isInteger(id) && id > 0 ? id : null
}

export function passportGalleryPath(artistUpdateId) {
  const id = positivePassportId(artistUpdateId)
  return id ? `/fan/passport/gallery/${id}` : null
}

export function passportMemoryPath(attendanceId) {
  const id = positivePassportId(attendanceId)
  return id ? `/fan/passport/nights/${id}` : null
}

export function resolvePassportArtwork({
  eventImageUrl = null,
  artistImageUrl = null,
  heroUrl = null,
  posterUrl = null,
} = {}) {
  void artistImageUrl
  const hero = String(heroUrl || '').trim()
  if (hero) return { url: hero, source: 'night_hero' }
  const poster = String(posterUrl || '').trim()
  if (poster) return { url: poster, source: 'night_poster' }
  const eventUrl = String(eventImageUrl || '').trim()
  if (eventUrl) return { url: eventUrl, source: 'show_cover' }
  return { url: null, source: 'fallback' }
}

export function passportArtworkDisplayUrl(artwork, origin) {
  return absolutePublicMediaUrl(artwork?.url, origin)
}

export function canonicalGalleryPath(bandSlug, slug) {
  const band = String(bandSlug || '').replace(/^\/+|\/+$/g, '')
  const page = String(slug || '').replace(/^\/+|\/+$/g, '')
  if (!band || !page || band.includes('/') || page.includes('/') || band.includes('..') || page.includes('..')) {
    return null
  }
  return `/${band}/gallery/${page}`
}

function isCanonicalGalleryPath(value) {
  return /^\/[^/]+\/(?:gallery|updates)\/[^/]+$/.test(String(value || ''))
}

export function formatPassportNightDate(value) {
  if (!value) return ''
  const day = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (day) {
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(Number(day[1]), Number(day[2]) - 1, Number(day[3])))
  }
  const parsed = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(parsed.getTime())) return ''
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(parsed)
}

export function formatPassportPlace(city, region) {
  return [String(city || '').trim(), String(region || '').trim()].filter(Boolean).join(', ')
}

export function absolutePublicMediaUrl(url, origin) {
  const raw = String(url || '').trim()
  if (!raw) return null
  if (/^https?:\/\//i.test(raw) || raw.startsWith('data:') || raw.startsWith('blob:')) return raw
  if (raw.startsWith('/') && !raw.startsWith('/uploads')) return raw
  const base = String(origin || '').replace(/\/$/, '')
  if (!base) return raw
  return raw.startsWith('/') ? `${base}${raw}` : `${base}/${raw}`
}

export function passportSharePayload({ artistUpdateId, sharePath, artistName, city, origin, bandSlug, slug } = {}) {
  const publicPath = canonicalGalleryPath(bandSlug, slug)
  const candidatePath = String(sharePath || '')
  const path = publicPath
    || (isCanonicalGalleryPath(candidatePath) ? candidatePath : null)
    || passportGalleryPath(artistUpdateId)
    || (/^\/fan\/passport\/gallery\/\d+$/.test(candidatePath) ? candidatePath : null)
  if (!path) return null
  const base = String(origin || 'https://faneqo.com').replace(/\/$/, '')
  const artist = String(artistName || '').trim() || 'an artist you love'
  const place = String(city || '').trim()
  return {
    title: place ? `${artist} in ${place} · Faneqo` : `${artist} · Faneqo`,
    text: place ? `See this show memory from ${artist} in ${place}.` : `See this show memory from ${artist}.`,
    url: `${base}${path}`,
  }
}

function legacyCopy(text, documentObject) {
  if (!documentObject?.body || typeof documentObject.execCommand !== 'function') return false
  const input = documentObject.createElement('textarea')
  input.value = text
  input.setAttribute('readonly', '')
  input.style.position = 'fixed'
  input.style.opacity = '0'
  documentObject.body.appendChild(input)
  input.select()
  const copied = documentObject.execCommand('copy')
  input.remove()
  return copied
}

export async function sharePassportGallery(input = {}, environment = {}) {
  const navigatorObject = environment.navigator || (typeof navigator !== 'undefined' ? navigator : null)
  const windowObject = environment.window || (typeof window !== 'undefined' ? window : null)
  const documentObject = environment.document || (typeof document !== 'undefined' ? document : null)
  const payload = passportSharePayload({ ...input, origin: input.origin || windowObject?.location?.origin })
  if (!payload) throw new Error('Gallery link is unavailable')

  if (typeof navigatorObject?.share === 'function') {
    await navigatorObject.share(payload)
    return { method: 'share', url: payload.url }
  }
  if (typeof navigatorObject?.clipboard?.writeText === 'function') {
    await navigatorObject.clipboard.writeText(payload.url)
    return { method: 'clipboard', url: payload.url }
  }
  if (legacyCopy(payload.url, documentObject)) {
    return { method: 'clipboard', url: payload.url }
  }
  throw new Error('Copy this link from the address bar.')
}

/**
 * Fan-app destinations only. Broader internal returns (show galleries)
 * go through sanitizeFanReturnTo — do not expand this helper into that job.
 */
export function safeFanPostAuthRedirect(value) {
  const path = sanitizeFanReturnTo(value, { fallback: null })
  if (!path) return null
  const pathname = path.split(/[?#]/)[0]
  if (pathname !== '/fan' && !pathname.startsWith('/fan/')) return null
  return path
}
