/**
 * Auth-shell return destinations.
 *
 * Reuses sanitizeFanReturnTo — do not fork a second sanitizer.
 * Extra rule: never return into another auth screen (login loop).
 */
import { sanitizeFanReturnTo } from '../fan/safeFanReturnTo.js'

export const AUTH_PRESENTATION_PATHS = [
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/fan/login',
  '/fan/verify',
  '/signupsuccess',
  '/signupcancelled',
]

function firstString(value) {
  if (Array.isArray(value)) return firstString(value[0])
  if (value == null) return ''
  return String(value)
}

function pathnameOf(path) {
  return String(path || '').split(/[?#]/)[0].toLowerCase()
}

export function isAuthPresentationPath(path) {
  const raw = pathnameOf(path)
  return AUTH_PRESENTATION_PATHS.some(
    (prefix) => raw === prefix || raw.startsWith(`${prefix}/`)
  )
}

/**
 * @param {unknown} value
 * @param {{ fallback?: string | null }} [options]
 * @returns {string | null}
 */
export function sanitizeAuthReturnTo(value, { fallback = null } = {}) {
  const path = sanitizeFanReturnTo(value, { fallback: null })
  if (!path) return fallback
  if (isAuthPresentationPath(path)) return fallback
  return path
}

/** Prefer existing `redirect`, then `returnTo`. Same sanitizer either way. */
export function firstReturnQuery(query = {}) {
  return firstString(query.redirect) || firstString(query.returnTo)
}

export function readSafeAuthReturnTo(query = {}, { fallback = null } = {}) {
  return sanitizeAuthReturnTo(firstReturnQuery(query), { fallback })
}

/**
 * Guest Login / Signup links that carry a safe return.
 * Homepage stays a bare path so post-login still defaults to dashboard.
 */
export function withAuthReturnTo(authPath, fromPath) {
  if (authPath !== '/login' && authPath !== '/signup' && authPath !== '/fan/login') {
    return authPath
  }
  const dest = sanitizeAuthReturnTo(fromPath, { fallback: null })
  if (!dest || dest === '/') return authPath
  return { path: authPath, query: { redirect: dest } }
}

export function authAccountSwitchTo(path, query = {}) {
  const next = {}
  const redirect = firstString(query.redirect)
  const returnTo = firstString(query.returnTo)
  const as = firstString(query.as)
  if (redirect) next.redirect = redirect
  if (returnTo) next.returnTo = returnTo
  if (as) next.as = as
  return Object.keys(next).length ? { path, query: next } : path
}
