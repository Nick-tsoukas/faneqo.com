/**
 * Corvana admin authentication (fail-closed; see corvanaAuthDecision.js).
 *
 * Every /api/corvana/** route is guarded by server/middleware/corvana-auth.ts,
 * so no endpoint can skip the check. These helpers remain for the handlers that
 * already call them (a second, identical check).
 *
 * Production: requires CORVANA_ADMIN_TOKEN to be set, and the same value sent
 * in the `x-corvana-admin-token` header. Missing configuration denies access.
 */

import { defineEventHandler, getHeader, setResponseStatus, H3Event } from 'h3'
import { CORVANA_TOKEN_HEADER, corvanaAuthDecision, corvanaRefusalBody } from './corvanaAuthDecision.js'

/** The decision for this request (status 401/403 when refused). */
export function corvanaAuthFor(event: H3Event) {
  return corvanaAuthDecision({
    nodeEnv: process.env.NODE_ENV,
    configuredToken: process.env.CORVANA_ADMIN_TOKEN,
    providedToken: getHeader(event, CORVANA_TOKEN_HEADER),
  })
}

export function isCorvanaAuthorized(event: H3Event): boolean {
  return corvanaAuthFor(event).ok
}

/** Wrapper for handlers: answers 401/403 itself when refused. */
export function requireCorvanaAuth(handler: (event: H3Event) => Promise<any>) {
  return defineEventHandler(async (event: H3Event) => {
    const decision = corvanaAuthFor(event)
    if (!decision.ok) {
      setResponseStatus(event, decision.status)
      return corvanaRefusalBody(decision)
    }
    return handler(event)
  })
}

/**
 * In-handler check, kept for the existing handlers (they set 401 on refusal;
 * the middleware has already answered 401/403 before they run).
 */
export function checkCorvanaAuth(event: H3Event): { authorized: boolean; status?: number; error?: any } {
  const decision = corvanaAuthFor(event)
  if (!decision.ok) return { authorized: false, status: decision.status, error: corvanaRefusalBody(decision) }
  return { authorized: true }
}
