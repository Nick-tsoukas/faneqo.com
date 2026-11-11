/**
 * OAuth `state` for the Corvana Google connection, plus HTML escaping for the
 * callback page. Pure, so it is unit-tested directly.
 *
 * /api/corvana/google/connect (admin only) issues a random state in an
 * httpOnly cookie; /api/corvana/google/callback stores a Google token only
 * when the returned `state` matches it. Without this, anyone could send a
 * crafted callback and have their own Google account linked.
 */
import { safeEqual } from './corvanaAuthDecision.js'

export const CORVANA_OAUTH_STATE_COOKIE = 'corvana_oauth_state'

export function stateMatches(returned, expected) {
  const r = typeof returned === 'string' ? returned : ''
  const e = typeof expected === 'string' ? expected : ''
  if (r.length < 16 || e.length < 16) return false
  return safeEqual(r, e)
}

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
