/**
 * Corvana admin authorization: the single decision used by the
 * /api/corvana/** middleware and the in-handler checks. Pure (no Nuxt imports)
 * so it is unit-tested directly.
 *
 * FAILS CLOSED in production:
 *   - CORVANA_ADMIN_TOKEN missing or blank → 403 not_configured (nobody gets in)
 *   - credential missing or blank          → 401 missing_credentials
 *   - credential wrong                     → 401 invalid_credentials
 * The credential is read from the `x-corvana-admin-token` header only. A query
 * parameter would put the token in URLs, browser history and access logs.
 * Comparison is constant-time.
 *
 * Outside production (local `nuxi dev`) access stays open, as before, so the
 * dashboard can be developed without a token.
 */
import { createHash, timingSafeEqual } from 'node:crypto'

export const CORVANA_TOKEN_HEADER = 'x-corvana-admin-token'

/** Paths the middleware guards: every Corvana API route except Google's OAuth callback, which is guarded by `state`. */
export function isGuardedCorvanaPath(pathname) {
  const path = String(pathname || '').toLowerCase().replace(/\/{2,}/g, '/').replace(/\/+$/, '')
  if (!(path === '/api/corvana' || path.startsWith('/api/corvana/'))) return false
  return path !== '/api/corvana/google/callback'
}

function digest(value) {
  return createHash('sha256').update(String(value), 'utf8').digest()
}

/** Constant-time string equality (hash both sides so lengths always match). */
export function safeEqual(a, b) {
  return timingSafeEqual(digest(a), digest(b))
}

/**
 * @param {{ nodeEnv?: string, configuredToken?: string|null, providedToken?: string|string[]|null }} input
 * @returns {{ ok: true } | { ok: false, status: 401|403, code: string }}
 */
export function corvanaAuthDecision({ nodeEnv, configuredToken, providedToken }) {
  if (nodeEnv !== 'production') return { ok: true }
  const configured = String(configuredToken ?? '').trim()
  if (!configured) return { ok: false, status: 403, code: 'not_configured' }
  const raw = Array.isArray(providedToken) ? providedToken[0] : providedToken
  const provided = String(raw ?? '').trim()
  if (!provided) return { ok: false, status: 401, code: 'missing_credentials' }
  if (!safeEqual(provided, configured)) return { ok: false, status: 401, code: 'invalid_credentials' }
  return { ok: true }
}

/** The JSON body for a refusal. Never echoes or hints at the configured token. */
export function corvanaRefusalBody(decision) {
  return decision.code === 'not_configured'
    ? { error: 'Forbidden', message: 'Corvana admin access is not configured.' }
    : { error: 'Unauthorized', message: 'Valid admin token required.' }
}
