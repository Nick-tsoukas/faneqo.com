/**
 * Server-side gate for the private Creative Studio routes (/api/ads/*).
 *
 * Same decision as middleware/ads.ts, enforced again on the server so the page
 * UI is never the only barrier. The caller's own Strapi JWT (cookie or bearer)
 * is resolved to an email through /api/users/me and checked against the
 * allowlist. Anyone else gets a stealth 404. Privileged tokens are never used.
 *
 * Local only: when the Nuxt dev server runs (`import.meta.dev`), the gate is
 * open without a session so the studio can be developed offline. This mirrors
 * the dev bypass in middleware/ads.ts and is compiled out of production.
 */
import { createError, getCookie, getHeader, type H3Event } from 'h3'
import { canAccessAdsStudio } from '~/utils/ads/access'

type Verdict = { ok: true; email: string; jwt: string | null; dev: boolean } | { ok: false }

const verdictCache = new Map<string, { email: string; expires: number }>()
const CACHE_MS = 60_000

export function studioNotFound() {
  return createError({ statusCode: 404, statusMessage: 'Page not found' })
}

export function strapiBase(): string {
  const cfg = useRuntimeConfig()
  return String(cfg.public?.strapiUrl || process.env.STRAPI_URL || '').replace(/\/+$/, '')
}

export function callerJwt(event: H3Event): string | null {
  const header = (getHeader(event, 'authorization') || '').replace(/^Bearer\s+/i, '').trim()
  if (header) return header
  const cookie = getCookie(event, 'strapi_jwt')
  return cookie ? String(cookie) : null
}

async function emailForJwt(jwt: string): Promise<string> {
  const now = Date.now()
  const cached = verdictCache.get(jwt)
  if (cached && cached.expires > now) return cached.email
  const base = strapiBase()
  if (!base) return ''
  try {
    const me: any = await $fetch(`${base}/api/users/me`, {
      headers: { Authorization: `Bearer ${jwt}` },
      timeout: 8000,
    })
    const email = String(me?.email || '')
    verdictCache.set(jwt, { email, expires: now + CACHE_MS })
    if (verdictCache.size > 200) {
      const first = verdictCache.keys().next().value
      if (first) verdictCache.delete(first)
    }
    return email
  } catch {
    return ''
  }
}

export async function studioVerdict(event: H3Event): Promise<Verdict> {
  const jwt = callerJwt(event)
  const dev = import.meta.dev === true
  if (jwt) {
    const email = await emailForJwt(jwt)
    if (canAccessAdsStudio(email, dev)) return { ok: true, email, jwt, dev }
    if (!dev) return { ok: false }
  }
  if (dev) return { ok: true, email: '', jwt: null, dev: true }
  return { ok: false }
}

/** Throws a 404 for everyone outside the allowlist. */
export async function requireStudio(event: H3Event) {
  const verdict = await studioVerdict(event)
  if (!verdict.ok) throw studioNotFound()
  return verdict
}
