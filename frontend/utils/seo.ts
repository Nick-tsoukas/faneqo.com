/**
 * SEO Utilities for URL normalization and validation
 * Used across the app to ensure consistent, canonical URLs
 */

/**
 * Normalizes a slug for SEO-safe URLs:
 * - Lowercases
 * - Trims whitespace
 * - Replaces whitespace with hyphens
 * - Collapses multiple hyphens to single
 * - Strips trailing punctuation (.,!?:;/"' etc)
 * - Removes leading/trailing hyphens
 */
export function normalizeSlug(str: string | null | undefined): string {
  if (!str) return ''
  
  return String(str)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // whitespace -> hyphen
    .replace(/-+/g, '-')            // collapse multiple hyphens
    .replace(/[.,!?:;/"']+$/g, '')  // strip trailing punctuation
    .replace(/^-+|-+$/g, '')        // remove leading/trailing hyphens
}

/**
 * Validates that a slug is valid (non-empty, not "null", not "undefined")
 */
export function isValidSlug(str: string | null | undefined): boolean {
  if (!str) return false
  const normalized = normalizeSlug(str)
  if (!normalized) return false
  if (normalized === 'null' || normalized === 'undefined') return false
  return true
}

/**
 * Builds a canonical article URL with proper validation and normalization.
 * Returns null if category or slug is invalid (prevents /article/null/... links)
 */
export function buildArticleUrl(
  category: string | null | undefined,
  slug: string | null | undefined,
  baseUrl: string = 'https://faneqo.com'
): string | null {
  if (!isValidSlug(category) || !isValidSlug(slug)) {
    console.warn(`[SEO] Invalid article URL params: category="${category}", slug="${slug}"`)
    return null
  }
  
  const normalizedCategory = normalizeSlug(category)
  const normalizedSlug = normalizeSlug(slug)
  
  return `${baseUrl}/article/${normalizedCategory}/${normalizedSlug}`
}

/**
 * Builds a canonical category pillar URL with validation.
 * Returns null if category is invalid.
 */
export function buildCategoryUrl(
  category: string | null | undefined,
  baseUrl: string = 'https://faneqo.com'
): string | null {
  if (!isValidSlug(category)) {
    console.warn(`[SEO] Invalid category URL param: category="${category}"`)
    return null
  }
  
  return `${baseUrl}/article/${normalizeSlug(category)}`
}

/**
 * Normalizes a full URL path for canonical/redirect purposes:
 * - Lowercases the path
 * - Removes trailing punctuation from path segments
 * - Collapses double slashes (except after protocol)
 * - Collapses double hyphens
 * - Removes trailing slash (except for root)
 * - Strips query params for canonical
 */
export function normalizeUrlPath(path: string): string {
  if (!path) return '/'
  
  // Remove query string and hash for canonical
  let normalized = path.split('?')[0].split('#')[0]
  
  // Lowercase
  normalized = normalized.toLowerCase()
  
  // Collapse double slashes (but preserve protocol if present)
  normalized = normalized.replace(/([^:])\/\/+/g, '$1/')
  
  // Process each path segment
  const segments = normalized.split('/').map(segment => {
    if (!segment) return segment
    // Collapse multiple hyphens
    let s = segment.replace(/-+/g, '-')
    // Strip trailing punctuation from segment
    s = s.replace(/[.,!?:;/"']+$/g, '')
    // Remove leading/trailing hyphens from segment
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
 * Checks if a path needs normalization (would redirect)
 */
export function pathNeedsNormalization(path: string): boolean {
  const normalized = normalizeUrlPath(path)
  // Compare without query string
  const cleanPath = path.split('?')[0].split('#')[0]
  return cleanPath !== normalized
}

/**
 * Checks if a path contains the /article/null/ pattern
 */
export function hasNullCategory(path: string): boolean {
  return /\/article\/null\//i.test(path) || /\/article\/null$/i.test(path)
}
