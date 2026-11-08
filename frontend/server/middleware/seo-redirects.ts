/**
 * SEO Redirects Middleware
 * 
 * Purpose:
 * - Server-side 301 redirects for SEO consolidation
 * - Prevents duplicate content indexing
 * - Transfers SEO value from losers to winners
 * 
 * Technical:
 * - Runs on Nitro server before page rendering
 * - Returns 301 status with Location header
 * - Preserves useful query parameters (utm, tracking)
 * - No client-side JavaScript required
 * 
 * Order of operations:
 * 1. Check if URL matches a redirect in the map
 * 2. If match: return 301 to destination
 * 3. If no match: continue to normal rendering
 */

import { defineEventHandler, getRequestURL, sendRedirect } from 'h3'
import { getRedirectTarget, getRedirectedUrls } from '../utils/seoRedirects.ts'

// Cache for performance
const redirectCache = new Map()
const REDIRECT_CACHE_SIZE = 100

/**
 * Check if query parameter should be preserved
 * Useful for tracking/analytics params
 */
function shouldPreserveQueryParam(param) {
  const preservedParams = [
    // Analytics/tracking
    'utm_source',
    'utm_medium', 
    'utm_campaign',
    'utm_content',
    'utm_term',
    'ref',
    'referrer',
    'source',
    // Internal tracking
    'fbclid',
    'gclid',
    'ttclid',
    'irclickid',
    'wickedid',
    // Misc
    'nocache',
  ]
  
  return preservedParams.includes(param.toLowerCase())
}

/**
 * Build destination URL with preserved query params
 */
function buildRedirectUrl(destination, originalQuery) {
  if (!originalQuery || originalQuery === '') {
    return destination
  }
  
  const params = new URLSearchParams(originalQuery)
  const preservedParams = new URLSearchParams()
  
  for (const [key, value] of params) {
    if (shouldPreserveQueryParam(key)) {
      preservedParams.append(key, value)
    }
  }
  
  const preservedString = preservedParams.toString()
  if (preservedString) {
    return `${destination}?${preservedString}`
  }
  
  return destination
}

/**
 * Normalize URL for consistent lookup
 * - Lowercase path
 * - Remove trailing slash (except root)
 * - Strip query string for lookup only
 */
function normalizeForLookup(url) {
  if (!url || url === '/') return '/'
  
  // Remove query string and hash for lookup
  let normalized = url.split('?')[0].split('#')[0]
  
  // Lowercase
  normalized = normalized.toLowerCase()
  
  // Remove trailing slash
  if (normalized.length > 1 && normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1)
  }
  
  return normalized
}

export default defineEventHandler(async (event) => {
  const url = getRequestURL(event)
  const originalPath = url.pathname
  
  // Skip non-page requests (assets, API, etc.)
  if (
    originalPath.startsWith('/_nuxt') ||
    originalPath.startsWith('/api/') ||
    originalPath.startsWith('/__') ||
    originalPath.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|json|xml|txt|map)$/i)
  ) {
    return
  }
  
  // Only process article paths
  if (!originalPath.startsWith('/article/')) {
    return
  }
  
  // Check cache first
  const lookupKey = normalizeForLookup(originalPath)
  let redirectTarget = redirectCache.get(lookupKey)
  
  if (redirectTarget === undefined) {
    // Check if this URL needs redirect
    redirectTarget = getRedirectTarget(lookupKey)
    
    // Cache the result (null means no redirect needed)
    if (redirectCache.size >= REDIRECT_CACHE_SIZE) {
      // Simple LRU: clear half the cache when full
      const entries = [...redirectCache.entries()]
      redirectCache.clear()
      entries.slice(entries.length / 2).forEach(([k, v]) => redirectCache.set(k, v))
    }
    redirectCache.set(lookupKey, redirectTarget)
  }
  
  // No redirect needed
  if (!redirectTarget) {
    return
  }
  
  // Build final redirect URL with preserved query params
  const finalUrl = buildRedirectUrl(redirectTarget, url.search)
  
  // Log for monitoring (development only)
  if (process.dev) {
    console.log(`[SEO Redirect] ${originalPath}${url.search} → ${finalUrl}`)
  }
  
  // Return 301 permanent redirect
  return sendRedirect(event, finalUrl, 301)
})
