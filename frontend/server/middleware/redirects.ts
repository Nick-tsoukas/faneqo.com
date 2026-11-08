/**
 * Server middleware for SEO redirects (301)
 * Runs on every request before rendering to normalize URLs
 * 
 * Priority Order:
 * 1. SEO Consolidation Redirects - Cannibalization cleanup (loser -> winner URLs)
 * 2. /article/null/<slug> -> lookup correct category or fallback
 * 3. URL Normalization - lowercase, collapse hyphens, strip punctuation
 * 
 * SEO Redirects:
 * - Duplicate articles redirect to canonical winner URLs
 * - Typo slugs (double hyphens) redirect to correct slugs
 * - Near-duplicates consolidate to strongest content
 * See: server/utils/seoRedirects.ts for the redirect map
 */
import { defineEventHandler, getRequestURL, sendRedirect } from 'h3'
import { getRedirectTarget } from '../utils/seoRedirects'

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

  // IMPORTANT: Only apply SEO normalization to /article/ paths
  // Do NOT touch band pages, QR redirects, or other dynamic routes
  const isArticlePath = originalPath.startsWith('/article/') || originalPath === '/article'
  if (!isArticlePath) {
    return
  }

  // ===== PRIORITY 1: SEO Consolidation Redirects =====
  // Check if this URL should redirect due to cannibalization cleanup
  // These are 301 redirects from loser URLs to winner URLs
  const seoRedirectTarget = getRedirectTarget(originalPath)
  if (seoRedirectTarget) {
    const redirectUrl = url.search ? seoRedirectTarget + url.search : seoRedirectTarget
    console.log(`[SEO Redirect] ${originalPath} → ${seoRedirectTarget}`)
    return sendRedirect(event, redirectUrl, 301)
  }

  let normalizedPath = originalPath
  let needsRedirect = false

  // 2. Handle /article/null/<slug> pattern
  const nullCategoryMatch = originalPath.match(/^\/article\/null\/(.+)$/i)
  if (nullCategoryMatch) {
    const slug = nullCategoryMatch[1]
    // Try to lookup the correct category from Strapi
    const correctCategory = await lookupCategoryForSlug(slug, event)
    
    if (correctCategory) {
      normalizedPath = `/article/${correctCategory}/${normalizePathSegment(slug)}`
    } else {
      // Fallback: redirect to article index if we can't determine category
      normalizedPath = '/article'
    }
    needsRedirect = true
  }

  // 2. Normalize the path (lowercase, collapse hyphens, strip punctuation, etc.)
  if (!needsRedirect) {
    normalizedPath = normalizePath(originalPath)
    needsRedirect = normalizedPath !== originalPath
  } else {
    // Also normalize the redirected path
    normalizedPath = normalizePath(normalizedPath)
  }

  // 3. Issue 301 redirect if needed
  if (needsRedirect) {
    // Preserve query string if present
    const redirectUrl = url.search ? normalizedPath + url.search : normalizedPath
    return sendRedirect(event, redirectUrl, 301)
  }
})

/**
 * Normalize a URL path:
 * - Lowercase
 * - Collapse double slashes
 * - Collapse double hyphens
 * - Strip trailing punctuation from segments
 * - Remove trailing slash (except root)
 */
function normalizePath(path: string): string {
  if (!path || path === '/') return '/'
  
  let normalized = path
  
  // Lowercase the path
  normalized = normalized.toLowerCase()
  
  // Collapse double slashes
  normalized = normalized.replace(/\/\/+/g, '/')
  
  // Process each segment
  const segments = normalized.split('/').map(segment => {
    if (!segment) return segment
    
    // Collapse multiple hyphens
    let s = segment.replace(/-+/g, '-')
    
    // Strip trailing punctuation (.,!?:;/"')
    s = s.replace(/[.,!?:;/"']+$/g, '')
    
    // Remove leading/trailing hyphens
    s = s.replace(/^-+|-+$/g, '')
    
    return s
  })
  
  normalized = segments.join('/')
  
  // Remove trailing slash (except for root)
  if (normalized.length > 1 && normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1)
  }
  
  // Ensure starts with /
  if (!normalized.startsWith('/')) {
    normalized = '/' + normalized
  }
  
  return normalized
}

/**
 * Normalize a single path segment
 */
function normalizePathSegment(segment: string): string {
  if (!segment) return ''
  
  return segment
    .toLowerCase()
    .trim()
    .replace(/-+/g, '-')
    .replace(/[.,!?:;/"']+$/g, '')
    .replace(/^-+|-+$/g, '')
}

/**
 * Lookup the correct category for a slug from Strapi
 * Returns null if not found or on error
 */
async function lookupCategoryForSlug(slug: string, event: any): Promise<string | null> {
  try {
    const config = useRuntimeConfig(event)
    const strapiUrl = config.public?.strapiUrl || process.env.STRAPI_URL || 'http://localhost:1337'
    
    const normalizedSlug = normalizePathSegment(slug)
    
    const response = await $fetch<{ data: Array<{ attributes: { category: string } }> }>(
      `${strapiUrl}/api/seo-pages`,
      {
        params: {
          'filters[slug][$eq]': normalizedSlug,
          'fields[0]': 'category',
          'pagination[pageSize]': 1
        },
        timeout: 3000
      }
    )
    
    const category = response?.data?.[0]?.attributes?.category
    if (category && category !== 'null' && category !== 'undefined' && category.trim()) {
      return normalizePathSegment(category)
    }
    
    return null
  } catch (error) {
    console.error('[redirects] Failed to lookup category for slug:', slug, error)
    return null
  }
}
