// Keep application, administrative, preview, and test surfaces out of search results.
import { defineEventHandler, getRequestURL, setHeader } from 'h3'

const NOINDEX_EXACT_PATHS = new Set([
  '/account',
  '/bands/all',
  '/createband',
  '/createqr',
  '/debug-qr',
  '/demo',
  '/directqrold',
  '/discover',
  '/error',
  '/forgot-password',
  '/home-classic',
  '/home-v2',
  '/improved-home',
  '/install',
  '/login',
  '/marketer-dashboard',
  '/marketing-component-preview',
  '/offline',
  '/saved',
  '/seo',
  '/show-live',
  '/signup',
  '/signupsuccess',
  '/test',
  '/testing',
  '/testsite',
])

const NOINDEX_PREFIXES = [
  '/__dev',
  '/admin',
  '/ads',
  '/agency',
  '/analytics',
  '/analyticsqr',
  '/corvana',
  '/dashboard',
  '/edit',
  '/editband',
  '/editqr',
  '/fan',
  '/fans',
  '/internal',
  '/labs',
  '/messages',
  '/oauth',
  '/oldpages',
  '/reset-password',
]

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`)
}

export default defineEventHandler((event) => {
  const pathname = getRequestURL(event).pathname.toLowerCase()
  const shouldNoindex =
    NOINDEX_EXACT_PATHS.has(pathname) ||
    NOINDEX_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix))

  if (shouldNoindex) {
    setHeader(event, 'X-Robots-Tag', 'noindex, nofollow')
  }
})
