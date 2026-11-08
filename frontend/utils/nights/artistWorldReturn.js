/**
 * Artist-world Back destination.
 *
 * Priority: safe explicit `from` → semantic parent → artist page.
 * `from` is local navigation context only. Never share it.
 *
 * Reuses sanitizeAuthReturnTo (which wraps sanitizeFanReturnTo).
 * Do not fork a second path sanitizer.
 */

import { sanitizeAuthReturnTo } from '../auth/safeAuthReturnTo.js'

function pathnameOf(path) {
  return String(path || '').split(/[?#]/)[0]
}

function isNightPath(path) {
  return /^\/[^/]+\/night\/[^/]+$/.test(pathnameOf(path))
}

export function isShowRecapPath(path) {
  const raw = Array.isArray(path) ? path[0] : path
  return /^\/fans\/recaps\/[^/]+$/.test(pathnameOf(raw))
}

export function sanitizeArtistWorldFrom(value) {
  return sanitizeAuthReturnTo(value, { fallback: null })
}

export function readSafeFromQuery(query = {}) {
  return sanitizeArtistWorldFrom(query?.from)
}

export function stripNavFrom(pathOrUrl) {
  const raw = String(pathOrUrl || '').trim()
  if (!raw) return raw
  try {
    if (/^https?:\/\//i.test(raw)) {
      const url = new URL(raw)
      url.searchParams.delete('from')
      url.searchParams.delete('photo')
      return `${url.origin}${url.pathname}${url.search}`
    }
  } catch {
    // Fall through to path handling.
  }
  const hashless = raw.split('#')[0]
  const cut = hashless.indexOf('?')
  if (cut === -1) return hashless
  const pathname = hashless.slice(0, cut)
  const params = new URLSearchParams(hashless.slice(cut + 1))
  params.delete('from')
  params.delete('photo')
  const qs = params.toString()
  return qs ? `${pathname}?${qs}` : pathname
}

export function withSafeFrom(path, from) {
  const dest = stripNavFrom(path)
  const safe = sanitizeArtistWorldFrom(from)
  if (!dest) return dest || null
  if (!safe) return dest
  if (pathnameOf(safe) === pathnameOf(dest)) return dest
  const sep = dest.includes('?') ? '&' : '?'
  return `${dest}${sep}from=${encodeURIComponent(safe)}`
}

export function preserveSafeFromQuery(query = {}) {
  const next = {}
  for (const [key, value] of Object.entries(query || {})) {
    if (key === 'from') {
      const safe = sanitizeArtistWorldFrom(value)
      if (safe) next.from = safe
      continue
    }
    next[key] = value
  }
  return next
}

export function artistWorldReturnLabel({
  from,
  nightHref,
  nightLabel,
  artistPath,
  artistName,
} = {}) {
  const path = pathnameOf(from)
  if (!path) return ''
  if (path === '/galleries' || path.startsWith('/galleries/') || path.startsWith('/__dev/galleries')) return 'Galleries'
  if (isShowRecapPath(path)) return 'Show Recap'
  if (path === '/fans/recaps' || path === '/nights') return 'Nights'
  if (path === '/fans') return 'Fans'
  if (path === '/dashboard') return 'Dashboard'
  if (path === '/fan/passport' || path.startsWith('/fan/passport/')) return 'Passport'
  if (isNightPath(path)) {
    if (nightHref && path === pathnameOf(nightHref) && nightLabel) return nightLabel
    return nightLabel || 'Night'
  }
  if (artistPath && path === pathnameOf(artistPath)) return artistName || ''
  return ''
}

export function resolveGalleryReturn({
  from,
  nightHref,
  nightLabel,
  artistPath,
  artistName,
} = {}) {
  const fallbackLabel = nightHref
    ? (nightLabel || 'Night')
    : (artistName || 'Artist')
  const safeFrom = sanitizeArtistWorldFrom(from)
  if (safeFrom) {
    return {
      to: safeFrom,
      label: artistWorldReturnLabel({
        from: safeFrom,
        nightHref,
        nightLabel,
        artistPath,
        artistName,
      }) || fallbackLabel,
    }
  }
  if (nightHref) {
    return { to: nightHref, label: nightLabel || 'Night' }
  }
  return { to: artistPath || '/', label: artistName || 'Artist' }
}

export function resolveNightReturn({
  from,
  artistPath,
  artistName,
} = {}) {
  const safeFrom = sanitizeArtistWorldFrom(from)
  if (safeFrom) {
    return {
      to: safeFrom,
      label: artistWorldReturnLabel({ from: safeFrom, artistPath, artistName }) || artistName || 'Back',
    }
  }
  return { to: artistPath || '/', label: artistName || 'Artist' }
}
