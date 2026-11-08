// Permanent marketing-domain migration. QR and PWA infrastructure are intentionally exempt.
import { defineEventHandler, getRequestURL, sendRedirect } from 'h3'

const CANONICAL_ORIGIN = 'https://faneqo.com'
const LEGACY_MARKETING_HOSTS = new Set([
  'musicbizqr.com',
  'www.musicbizqr.com',
])
const CANONICAL_ALIAS_HOSTS = new Set([
  'www.faneqo.com',
])

function normalizeHost(value: string | string[] | undefined): string {
  const first = Array.isArray(value) ? value[0] : value
  return String(first || '')
    .split(',')[0]
    .trim()
    .toLowerCase()
    .replace(/:\d+$/, '')
}

function isInfrastructureRequest(pathname: string): boolean {
  if (
    pathname === '/directqr' ||
    pathname.startsWith('/directqr/') ||
    pathname === '/manifest.webmanifest' ||
    pathname === '/sw.js' ||
    pathname === '/registerSW.js' ||
    pathname.startsWith('/_nuxt/') ||
    pathname.startsWith('/api/')
  ) {
    return true
  }

  if (/^\/workbox-[^/]+\.js$/i.test(pathname)) return true

  return /\.(?:js|css|png|jpe?g|gif|svg|webp|avif|ico|woff2?|ttf|eot|json|xml|txt|map|webmanifest)$/i.test(pathname)
}

export default defineEventHandler((event) => {
  const forwardedHost = event.node.req.headers['x-forwarded-host']
  const host = normalizeHost(forwardedHost || event.node.req.headers.host)

  if (!LEGACY_MARKETING_HOSTS.has(host) && !CANONICAL_ALIAS_HOSTS.has(host)) {
    return
  }

  const requestUrl = getRequestURL(event)
  if (isInfrastructureRequest(requestUrl.pathname)) {
    return
  }

  // getRequestURL preserves the encoded path. req.url preserves the original query string.
  const pathAndQuery = event.node.req.url || `${requestUrl.pathname}${requestUrl.search}`
  return sendRedirect(event, `${CANONICAL_ORIGIN}${pathAndQuery}`, 301)
})
