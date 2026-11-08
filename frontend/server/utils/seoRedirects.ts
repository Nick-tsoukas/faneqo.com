/**
 * SEO Redirect Map for Canonical URL Consolidation
 * 
 * Purpose:
 * - Eliminate cannibalization from duplicate/similar article URLs
 * - Consolidate SEO value to preferred "winner" pages
 * - All redirects are 301 (permanent) for SEO value transfer
 * 
 * Rules:
 * - Loser URLs (keys) redirect to Winner URLs (values)
 * - Loser URLs should be excluded from sitemap
 * - Winner URLs remain in sitemap and return 200
 * - No redirect chains (direct 301 from loser to winner)
 * 
 * Categories:
 * 1. Exact duplicates (same content, different slug)
 * 2. Typo slugs (double hyphens, formatting errors)
 * 3. Near-duplicates (same topic, merge to strongest version)
 */

export const seoRedirects = {
  // ============================================
  // GROUP 1: Smart Links - New Release Promotion
  // Winner: /article/smart-links/smart-links-promote-new-releases
  // Loser: duplicate with longer, less focused slug
  // Reason: Same content, winner has cleaner URL and stronger engagement
  // ============================================
  '/article/smart-links/how-to-use-smart-links-to-promote-new-releases-like-a-pro': '/article/smart-links/smart-links-promote-new-releases',

  // ============================================
  // GROUP 2: Touring/Events - Typo/Format Issue
  // Winner: /article/touring-events/qr-codes-for-music-tour-promotion
  // Loser: has double hyphen typo in slug
  // Reason: Technical slug error causing duplicate indexing
  // ============================================
  '/article/touring-events/qr-codes--music-tour-promotion': '/article/touring-events/qr-codes-for-music-tour-promotion',

  // ============================================
  // GROUP 3: Merch QR Codes - Cannibalization Cluster
  // Winner: /article/qr-code-strategy/how-indie-bands-can-sell-more-merch-at-shows-using-qr-codes
  // Most comprehensive title, covers the core use case
  // ============================================
  
  // Near-duplicate: Similar angle but less comprehensive
  '/article/qr-code-strategy/qr-codes-to-sell-band-merch': '/article/qr-code-strategy/how-indie-bands-can-sell-more-merch-at-shows-using-qr-codes',
  
  // Near-duplicate: Overlaps with winner, shorter but less descriptive
  '/article/qr-code-strategy/sell-merch-with-qr-codes': '/article/qr-code-strategy/how-indie-bands-can-sell-more-merch-at-shows-using-qr-codes',
  
  // Near-duplicate: Live shows focus, but winner covers shows + merch more comprehensively
  '/article/qr-code-strategy/qr-codes-at-live-shows-to-boost-merch': '/article/qr-code-strategy/how-indie-bands-can-sell-more-merch-at-shows-using-qr-codes',
  
  // Different category but same topic - consolidate to strategy pillar
  '/article/merch-growth/sell-more-band-merch-with-qr-codes': '/article/qr-code-strategy/how-indie-bands-can-sell-more-merch-at-shows-using-qr-codes',
  '/article/merch-growth/sell-more-band-merch-with-smart-qr-codes': '/article/qr-code-strategy/how-indie-bands-can-sell-more-merch-at-shows-using-qr-codes',
}

/**
 * Get all loser URLs (sources) that should be excluded from sitemap
 * These are the keys in the redirect map
 */
export function getRedirectedUrls() {
  return Object.keys(seoRedirects)
}

/**
 * Get all winner URLs (destinations) that should remain in sitemap
 * These are the values in the redirect map
 */
export function getWinnerUrls() {
  return [...new Set(Object.values(seoRedirects))]
}

/**
 * Check if a URL should be redirected
 * Returns the destination URL or null if no redirect needed
 */
export function getRedirectTarget(url) {
  // Normalize for lookup (remove query string, lowercase)
  const cleanUrl = url.split('?')[0].toLowerCase()
  
  // Direct match
  if (seoRedirects[cleanUrl]) {
    return seoRedirects[cleanUrl]
  }
  
  // Try without trailing slash
  const withoutSlash = cleanUrl.endsWith('/') ? cleanUrl.slice(0, -1) : cleanUrl
  if (seoRedirects[withoutSlash]) {
    return seoRedirects[withoutSlash]
  }
  
  return null
}

/**
 * Verify redirect doesn't create a chain (winner shouldn't also be a loser)
 */
export function validateRedirectMap() {
  const errors = []
  const winners = getWinnerUrls()
  const losers = getRedirectedUrls()
  
  // Check for redirect chains
  for (const winner of winners) {
    if (losers.includes(winner)) {
      errors.push(`Redirect chain detected: ${winner} is both a winner and loser`)
    }
  }
  
  // Check for duplicates
  const uniqueLosers = new Set(losers)
  if (uniqueLosers.size !== losers.length) {
    errors.push('Duplicate loser URLs in redirect map')
  }
  
  return {
    valid: errors.length === 0,
    errors,
    totalRedirects: losers.length,
    uniqueWinners: [...new Set(winners)].length
  }
}

// Validate on load (server-side only)
if (process.server) {
  const validation = validateRedirectMap()
  if (!validation.valid) {
    console.error('[SEO Redirects] Validation errors:', validation.errors)
  } else {
    console.log(`[SEO Redirects] Loaded ${validation.totalRedirects} redirects to ${validation.uniqueWinners} unique winners`)
  }
}
