/**
 * Shared sanitizer for fan post-auth destinations.
 *
 * Internal paths only. Never trust a client-supplied URL as a redirect.
 * Backend `qrserver/src/utils/fanReturnTo.js` must keep the same rules.
 */

export const FAN_RETURN_FALLBACK = '/fan'
export const FAN_VERIFY_FALLBACK = '/fan?welcome=1'
export const FAN_LOGIN_PATH = '/fan/login'

const MAX_LEN = 512
const CONTROL_OR_SLASH = /[\u0000-\u001f\u007f\\\u2028\u2029]/
const ENCODED_CONTROL = /%0[0-9a-d]|%7f/i
const SCHEME = /^[a-z][a-z0-9+.-]*:/i
const FAN_AUTH_PREFIXES = ['/fan/login', '/fan/verify']
const GALLERY_PATH = /^\/[A-Za-z0-9._-]+\/(?:gallery|updates|night)\/[A-Za-z0-9._-]+$/

function firstString(value) {
  if (Array.isArray(value)) return firstString(value[0])
  if (value == null) return ''
  return String(value)
}

function decodeLayer(value) {
  try {
    return decodeURIComponent(value)
  } catch {
    return null
  }
}

function fullyDecode(value) {
  let current = value
  for (let i = 0; i < 2; i += 1) {
    const next = decodeLayer(current)
    if (next == null) return null
    if (next === current) break
    current = next
  }
  return current
}

function pathnameOf(path) {
  const cut = String(path || '').split(/[?#]/)[0]
  return cut || ''
}

function isFanAuthDestination(pathname) {
  return FAN_AUTH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}

function looksUnsafe(raw) {
  if (!raw || raw.length > MAX_LEN) return true
  if (CONTROL_OR_SLASH.test(raw) || ENCODED_CONTROL.test(raw)) return true
  if (SCHEME.test(raw)) return true
  if (!raw.startsWith('/')) return true
  if (raw.startsWith('//')) return true
  if (raw.includes('..')) return true
  return false
}

/**
 * @param {unknown} value
 * @param {{ fallback?: string | null }} [options]
 * @returns {string | null}
 */
export function sanitizeFanReturnTo(value, { fallback = FAN_RETURN_FALLBACK } = {}) {
  const raw = firstString(value).trim()
  if (!raw) return fallback
  if (looksUnsafe(raw)) return fallback

  const decoded = fullyDecode(raw)
  if (decoded == null || looksUnsafe(decoded)) return fallback

  const hashless = raw.split('#')[0]
  const pathname = pathnameOf(hashless)
  if (!pathname || isFanAuthDestination(pathname)) return fallback

  return hashless
}

/** Deprecated Passport Night detail is an index entry, not a login destination. */
export function isLegacyPassportNightPath(value) {
  return /^\/fan\/passport\/nights\/\d+$/.test(pathnameOf(value))
}

/**
 * Login / verify destination. Canonical Public Night paths stay intact.
 * Legacy `/fan/passport/nights/:id` returns to Passport home.
 */
export function resolveFanLoginReturnTo(value, { fallback = FAN_RETURN_FALLBACK } = {}) {
  const dest = sanitizeFanReturnTo(value, { fallback })
  if (!dest) return dest
  if (isLegacyPassportNightPath(dest)) return '/fan/passport'
  return dest
}

export function isSafeFanReturnTo(value) {
  return sanitizeFanReturnTo(value, { fallback: null }) != null
}

/** /fan app paths and durable show galleries — used to keep Fan mode selected. */
export function isFanOrientedReturnTo(value) {
  const path = sanitizeFanReturnTo(value, { fallback: null })
  if (!path) return false
  const pathname = pathnameOf(path)
  if (pathname === '/fan' || pathname.startsWith('/fan/')) return true
  return GALLERY_PATH.test(pathname)
}

export function fanLoginLocation(returnTo) {
  const redirect = resolveFanLoginReturnTo(returnTo)
  return {
    path: FAN_LOGIN_PATH,
    query: { redirect },
  }
}

export function fanLoginPathFor(returnTo) {
  const { path, query } = fanLoginLocation(returnTo)
  const params = new URLSearchParams()
  params.set('redirect', query.redirect)
  return `${path}?${params.toString()}`
}
