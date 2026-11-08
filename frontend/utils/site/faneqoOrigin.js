/**
 * Canonical Faneqo frontend origin for OG, canonical links, and share URLs.
 * Never treat Strapi, Railway, or localhost as the public site origin.
 */

export const FANEQO_SITE_ORIGIN = 'https://faneqo.com'

function normalizeOrigin(value) {
  const raw = String(value || '').trim()
  if (!raw) return ''
  try {
    const url = raw.includes('://') ? new URL(raw) : new URL(`https://${raw}`)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return ''
    return url.origin
  } catch {
    return ''
  }
}

function hostOf(origin) {
  try {
    return new URL(origin).hostname.toLowerCase()
  } catch {
    return ''
  }
}

export function isLocalFrontendHost(host) {
  const name = String(host || '').toLowerCase()
  return name === 'localhost' || name === '127.0.0.1' || name === '[::1]' || name === '::1'
}

export function isUnsafeCanonicalOrigin(origin) {
  const host = hostOf(origin)
  if (!host) return true
  if (isLocalFrontendHost(host)) return true
  if (host.includes('railway.app') || host.includes('up.railway.app')) return true
  if (host.includes('strapi')) return true
  if (/:1337\b/.test(String(origin))) return true
  return false
}

export function resolveFrontendOrigin({ configuredOrigin, requestOrigin } = {}) {
  const configured = normalizeOrigin(configuredOrigin)
  if (configured && !isUnsafeCanonicalOrigin(configured)) return configured
  const request = normalizeOrigin(requestOrigin)
  if (request && !isUnsafeCanonicalOrigin(request)) return request
  return FANEQO_SITE_ORIGIN
}

export function toAbsoluteFrontendUrl(pathOrUrl, origin) {
  const raw = String(pathOrUrl || '').trim()
  if (!raw) return null
  if (/^https?:\/\//i.test(raw)) return raw
  if (!raw.startsWith('/')) return null
  const base = resolveFrontendOrigin({ configuredOrigin: origin })
  return `${base}${raw}`
}

/** OG/share image: backend share.image only. Never invent from gallery.media. */
export function shareImageUrl(image) {
  if (!image) return null
  const raw = String(typeof image === 'string' ? image : image.url || '').trim()
  if (!raw || !/^https?:\/\//i.test(raw)) return null
  if (/X-Amz-Signature|faneqo-protected:\/\//i.test(raw)) return null
  return raw
}
