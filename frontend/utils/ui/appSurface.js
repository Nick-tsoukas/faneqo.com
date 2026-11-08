/**
 * Application workspace routes only.
 * Public artist pages, marketing, and auth must stay off this list.
 */
const APP_PREFIXES = [
  '/messages',
  '/dashboard',
  '/nights',
  '/fans',
  '/account',
  '/createband',
  '/editband',
  '/analytics',
  '/analyticsqr',
  '/fan',
  '/updates',
  '/show-live',
  '/event-analytics',
  '/saved',
]

/**
 * Fan auth surfaces sit under /fan but are reached before a session exists,
 * so they must not inherit authenticated fan chrome.
 */
const FAN_AUTH_PREFIXES = ['/fan/login', '/fan/verify']

function normalizePath(path) {
  return String(path || '').split('?')[0]
}

function matchesPrefix(path, prefix) {
  return path === prefix || path.startsWith(`${prefix}/`)
}

export function isFanAuthPath(path) {
  const raw = normalizePath(path)
  return FAN_AUTH_PREFIXES.some((prefix) => matchesPrefix(raw, prefix))
}

/** Authenticated Fan App routes — not /fan/login or /fan/verify. */
export function isFanAppAuthPath(path) {
  const raw = normalizePath(path)
  if (isFanAuthPath(raw)) return false
  return raw === '/fan' || raw === '/fan/' || raw.startsWith('/fan/')
}

/** Authenticated Show Recap detail — mobile hides marketing header, keeps bottom nav. */
export function isImmersiveShowRecapPath(path) {
  const raw = normalizePath(path)
  return raw === '/__dev/artist-recap' || /^\/fans\/recaps\/[^/]+$/.test(raw)
}

export function isFaneqoAppPath(path) {
  const raw = normalizePath(path)
  if (isFanAuthPath(raw)) return false
  return APP_PREFIXES.some((prefix) => matchesPrefix(raw, prefix))
}
