/**
 * Firebase ID token claim rules — pure, no network, no crypto.
 * Signature verification lives in server/utils/firebaseIdTokenVerify.ts.
 *
 * Every rejection returns a stable machine reason. Nothing here echoes token
 * contents, so callers can log the reason safely.
 */

export const FIREBASE_ISSUER_PREFIX = 'https://securetoken.google.com/'
export const DEFAULT_CLOCK_SKEW_SECONDS = 30

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_DISPLAY_NAME = 120

function reject(reason) {
  return { ok: false, reason }
}

export function parseBearerToken(headerValue) {
  const raw = typeof headerValue === 'string' ? headerValue : ''
  if (!raw.startsWith('Bearer ')) return null
  const token = raw.slice(7).trim()
  return token || null
}

function decodeSegment(segment) {
  try {
    const json = Buffer.from(segment, 'base64url').toString('utf8')
    const parsed = JSON.parse(json)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

/**
 * Split a compact JWS without trusting any of it. Returns null for anything
 * that is not three non-empty base64url segments with JSON header/payload.
 */
export function decodeJwtSegments(token) {
  if (typeof token !== 'string') return null
  const parts = token.split('.')
  if (parts.length !== 3) return null
  if (parts.some((part) => !part)) return null

  const header = decodeSegment(parts[0])
  const payload = decodeSegment(parts[1])
  if (!header || !payload) return null

  return {
    header,
    payload,
    signingInput: `${parts[0]}.${parts[1]}`,
    signatureB64Url: parts[2],
  }
}

export function deriveVerifiedIdentity(payload) {
  const rawName = typeof payload?.name === 'string' ? payload.name.trim() : ''
  return {
    uid: String(payload?.sub || '').trim(),
    email: String(payload?.email || '').trim().toLowerCase(),
    displayName: rawName ? rawName.slice(0, MAX_DISPLAY_NAME) : '',
    emailVerified: payload?.email_verified === true,
    signInProvider: payload?.firebase?.sign_in_provider || null,
  }
}

/**
 * Validate every Firebase ID token claim that does not need the signing key.
 * Callers must still verify the RS256 signature before trusting the identity.
 */
export function validateFirebaseIdTokenClaims({
  header,
  payload,
  projectId,
  nowSeconds,
  clockSkewSeconds = DEFAULT_CLOCK_SKEW_SECONDS,
}) {
  if (!projectId || typeof projectId !== 'string') return reject('verifier_unavailable')
  if (!header || !payload) return reject('malformed_token')
  if (header.alg !== 'RS256') return reject('unsupported_algorithm')
  if (typeof header.kid !== 'string' || !header.kid.trim()) return reject('missing_key_id')

  if (payload.aud !== projectId) return reject('wrong_audience')
  if (payload.iss !== `${FIREBASE_ISSUER_PREFIX}${projectId}`) return reject('wrong_issuer')

  const now = Number.isFinite(nowSeconds) ? nowSeconds : Math.floor(Date.now() / 1000)
  const skew = Number.isFinite(clockSkewSeconds) ? Math.max(0, clockSkewSeconds) : 0

  if (!Number.isFinite(payload.exp) || payload.exp + skew <= now) return reject('expired_token')
  if (!Number.isFinite(payload.iat) || payload.iat - skew > now) return reject('future_token')
  if (payload.auth_time != null) {
    if (!Number.isFinite(payload.auth_time) || payload.auth_time - skew > now) {
      return reject('invalid_auth_time')
    }
  }

  if (typeof payload.sub !== 'string' || !payload.sub.trim()) return reject('missing_subject')
  if (typeof payload.email !== 'string' || !EMAIL_SHAPE.test(payload.email.trim())) {
    return reject('missing_email')
  }
  if (payload.email_verified !== true) return reject('email_not_verified')

  return { ok: true, identity: deriveVerifiedIdentity(payload) }
}
