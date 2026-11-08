import { X509Certificate, createVerify } from 'node:crypto'
import {
  decodeJwtSegments,
  validateFirebaseIdTokenClaims,
} from '~/utils/auth/firebaseIdToken'

/**
 * Server-side Firebase ID token verification.
 *
 * Google publishes the public certificates that sign Firebase ID tokens, so
 * verification needs only the (public) project id — no service-account secret.
 * Nothing in here logs or returns token contents; failures surface as a stable
 * machine reason and the caller fails closed.
 */

const CERT_URL =
  'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com'

const MIN_CACHE_SECONDS = 300
const MAX_CACHE_SECONDS = 24 * 60 * 60
/** Keys rotate roughly daily; a stale key can only ever verify what it signed. */
const STALE_FALLBACK_SECONDS = 24 * 60 * 60

type CertMap = Record<string, string>

export type FirebaseIdentity = {
  uid: string
  email: string
  displayName: string
  emailVerified: boolean
  signInProvider: string | null
}

type VerificationResult =
  | { ok: true; identity: FirebaseIdentity }
  | { ok: false; reason: string }

let cache: { certs: CertMap; freshUntil: number; usableUntil: number } | null = null
let inFlight: Promise<CertMap> | null = null

function maxAgeFromHeader(header: string | null): number {
  const match = /max-age=(\d+)/i.exec(header || '')
  const parsed = match ? Number(match[1]) : NaN
  if (!Number.isFinite(parsed)) return MIN_CACHE_SECONDS
  return Math.min(MAX_CACHE_SECONDS, Math.max(MIN_CACHE_SECONDS, parsed))
}

async function fetchCerts(): Promise<CertMap> {
  const res = await fetch(CERT_URL)
  if (!res.ok) throw new Error(`cert_fetch_status_${res.status}`)

  const body = (await res.json()) as CertMap
  if (!body || typeof body !== 'object' || !Object.keys(body).length) {
    throw new Error('cert_fetch_empty')
  }

  const now = Date.now()
  const ttlMs = maxAgeFromHeader(res.headers.get('cache-control')) * 1000
  cache = {
    certs: body,
    freshUntil: now + ttlMs,
    usableUntil: now + STALE_FALLBACK_SECONDS * 1000,
  }
  return body
}

async function loadCerts(): Promise<CertMap> {
  const now = Date.now()
  if (cache && now < cache.freshUntil) return cache.certs

  if (!inFlight) {
    inFlight = fetchCerts().finally(() => {
      inFlight = null
    })
  }

  try {
    return await inFlight
  } catch (err) {
    if (cache && now < cache.usableUntil) return cache.certs
    throw err
  }
}

function verifySignature(
  certPem: string,
  signingInput: string,
  signatureB64Url: string
): boolean {
  try {
    const publicKey = new X509Certificate(certPem).publicKey
    return createVerify('RSA-SHA256')
      .update(signingInput)
      .verify(publicKey, Buffer.from(signatureB64Url, 'base64url'))
  } catch {
    return false
  }
}

export async function verifyFirebaseIdToken(
  token: string,
  projectId: string
): Promise<VerificationResult> {
  const decoded = decodeJwtSegments(token)
  if (!decoded) return { ok: false, reason: 'malformed_token' }

  const claims = validateFirebaseIdTokenClaims({
    header: decoded.header,
    payload: decoded.payload,
    projectId,
    nowSeconds: Math.floor(Date.now() / 1000),
  })
  if (!claims.ok) return claims as VerificationResult

  let certs: CertMap
  try {
    certs = await loadCerts()
  } catch {
    return { ok: false, reason: 'verifier_unavailable' }
  }

  const certPem = certs[decoded.header.kid]
  if (!certPem) return { ok: false, reason: 'unknown_key' }

  if (!verifySignature(certPem, decoded.signingInput, decoded.signatureB64Url)) {
    return { ok: false, reason: 'invalid_signature' }
  }

  return claims as VerificationResult
}

/** Test seam only — lets focused tests exercise cache behaviour deterministically. */
export function __resetFirebaseCertCache() {
  cache = null
  inFlight = null
}
