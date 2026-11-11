/**
 * Guards EVERY /api/corvana/** route (fail-closed admin token; see
 * server/utils/corvanaAuthDecision.js), so no Corvana endpoint can be reached
 * without it, including ones that never called the helper themselves.
 *
 * The only exception is /api/corvana/google/callback: Google redirects the
 * browser there without our header, so it is protected by the OAuth `state`
 * that only an authorized /api/corvana/google/connect request can issue.
 */
import { defineEventHandler, getHeader, getRequestURL, setResponseHeader, setResponseStatus } from 'h3'
import { CORVANA_TOKEN_HEADER, corvanaAuthDecision, corvanaRefusalBody, isGuardedCorvanaPath } from '../utils/corvanaAuthDecision.js'

export default defineEventHandler((event) => {
  if (!isGuardedCorvanaPath(getRequestURL(event).pathname)) return
  const decision = corvanaAuthDecision({
    nodeEnv: process.env.NODE_ENV,
    configuredToken: process.env.CORVANA_ADMIN_TOKEN,
    providedToken: getHeader(event, CORVANA_TOKEN_HEADER),
  })
  if (decision.ok) return
  setResponseStatus(event, decision.status)
  setResponseHeader(event, 'Cache-Control', 'no-store')
  return corvanaRefusalBody(decision)
})
