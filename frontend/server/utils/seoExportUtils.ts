/**
 * SEO Export Utilities
 * 
 * Shared helpers for AI-ready SEO analysis exports.
 * High-intent keyword detection, scoring algorithms, and data formatting.
 */

import { FormattedSearchRow } from './searchConsoleClient'

// High-intent keywords for music marketing/QR code space
const HIGH_INTENT_KEYWORDS = [
  'qr', 'qr code', 'qr codes',
  'smart link', 'smart links', 'music link', 'music links',
  'linktree', 'link in bio', 'linkinbio',
  'musician', 'musicians', 'music artist', 'music artists',
  'band', 'bands',
  'artist', 'artists',
  'concert', 'concerts', 'festival', 'festivals',
  'fan', 'fans',
  'tool', 'tools',
  'direct to fan', 'direct-to-fan',
  'spotify link', 'spotify qr',
  'merch qr', 'merchandise qr',
  'tour qr', 'concert qr',
  'music promotion', 'promote music',
  'fan growth', 'grow fans',
  'bio link', 'bio links'
]

/**
 * Check if a query is high-intent
 */
export function isHighIntentQuery(query: string): boolean {
  const lowerQuery = query.toLowerCase()
  return HIGH_INTENT_KEYWORDS.some(keyword => lowerQuery.includes(keyword.toLowerCase()))
}

/**
 * Calculate upgrade score for a page/query
 */
export interface UpgradeScoreParams {
  position: number
  impressions: number
  clicks: number
  ctr: number
  isHomepage: boolean
  isHighIntent: boolean
}

export function calculateUpgradeScore(params: UpgradeScoreParams): number {
  let score = 0
  
  // Position scoring
  if (params.position >= 5 && params.position <= 15) score += 30
  else if (params.position >= 16 && params.position <= 25) score += 20
  else if (params.position > 60) score -= 10
  
  // High intent bonus
  if (params.isHighIntent) score += 20
  
  // Homepage bonus
  if (params.isHomepage) score += 15
  
  // Impressions volume
  if (params.impressions >= 5) score += 15
  
  // CTR issues
  if (params.clicks === 0 || params.ctr < 0.01) score += 10
  
  return Math.max(0, score)
}

/**
 * Determine recommendation type
 */
export type RecommendationType = 
  | 'HOMEPAGE_SEO_UPGRADE'
  | 'ARTICLE_REFRESH'
  | 'TITLE_META_REWRITE'
  | 'INTERNAL_LINKING'
  | 'PILLAR_STRENGTHENING'
  | 'CONTENT_RETARGET'
  | 'REVIEW_FOR_MERGE'
  | 'CANNIBALIZATION_REVIEW'

export function getRecommendation(params: UpgradeScoreParams): RecommendationType {
  const { position, clicks, impressions, isHomepage, isHighIntent } = params
  
  // Homepage ranking for high-intent terms
  if (isHomepage && isHighIntent && position <= 25) {
    return 'HOMEPAGE_SEO_UPGRADE'
  }
  
  // Impressions but zero clicks, position under 25
  if (impressions > 0 && clicks === 0 && position < 25) {
    return 'TITLE_META_REWRITE'
  }
  
  // Good position range but needs work
  if (position >= 5 && position <= 25) {
    return 'ARTICLE_REFRESH'
  }
  
  // Position over 50 - needs major work
  if (position > 50) {
    return 'CONTENT_RETARGET'
  }
  
  return 'ARTICLE_REFRESH'
}

/**
 * Calculate date range for Search Console queries
 */
export function calculateDateRange(days: number = 28): { startDate: string; endDate: string } {
  const endDate = new Date()
  endDate.setDate(endDate.getDate() - 3) // 3 days ago to avoid data delays
  
  const startDate = new Date(endDate)
  startDate.setDate(startDate.getDate() - days)
  
  return {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate)
  }
}

/**
 * Format date as YYYY-MM-DD
 */
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

/**
 * Group page+query data by page
 */
export function groupByPage(rows: FormattedSearchRow[]): Map<string, FormattedSearchRow[]> {
  const map = new Map<string, FormattedSearchRow[]>()
  
  for (const row of rows) {
    const existing = map.get(row.page) || []
    existing.push(row)
    map.set(row.page, existing)
  }
  
  return map
}

/**
 * Group page+query data by query
 */
export function groupByQuery(rows: FormattedSearchRow[]): Map<string, FormattedSearchRow[]> {
  const map = new Map<string, FormattedSearchRow[]>()
  
  for (const row of rows) {
    const existing = map.get(row.query) || []
    existing.push(row)
    map.set(row.query, existing)
  }
  
  return map
}

/**
 * Aggregate metrics for a group of rows
 */
export function aggregateMetrics(rows: FormattedSearchRow[]) {
  const totalClicks = rows.reduce((sum, r) => sum + r.clicks, 0)
  const totalImpressions = rows.reduce((sum, r) => sum + r.impressions, 0)
  const avgPosition = rows.length > 0 
    ? rows.reduce((sum, r) => sum + r.position, 0) / rows.length 
    : 0
  const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) : 0
  
  return {
    totalClicks,
    totalImpressions,
    avgPosition: parseFloat(avgPosition.toFixed(1)),
    avgCtr: parseFloat((avgCtr * 100).toFixed(2))
  }
}

/**
 * Check if URL is homepage
 */
export function isHomepage(url: string): boolean {
  return url === 'https://musicbizqr.com/' || url === 'https://musicbizqr.com'
}

/**
 * Check if URL is an article
 */
export function isArticle(url: string): boolean {
  return url.includes('/article/')
}

/**
 * Extract article category from URL
 */
export function getArticleCategory(url: string): string | null {
  const match = url.match(/\/article\/([^/]+)/)
  return match ? match[1] : null
}

/**
 * Format number for display
 */
export function formatNumber(num: number): string {
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k'
  return num.toString()
}

/**
 * Generate ChatGPT prompt text for a specific analysis
 */
export function generateChatGptPrompt(type: 'snapshot' | 'cannibalization' | 'upgrade' | 'page', data: any): string {
  const prompts = {
    snapshot: `Analyze this MusicBizQR SEO snapshot and provide 3 actionable recommendations:
- Site: musicbizqr.com (music marketing SaaS for musicians/bands)
- Current ranking issues: 0 clicks despite impressions
- Target: musicians, bands, artists using QR codes and smart links

Data:`,
    
    cannibalization: `Review these cannibalization candidates for MusicBizQR. 
Recommend which page should "own" each query and how to consolidate:

Data:`,
    
    upgrade: `Prioritize these upgrade recommendations for MusicBizQR.
Focus on highest-impact, lowest-effort wins first:

Data:`,
    
    page: `Analyze this specific page's SEO performance and suggest specific improvements:

Data:`
  }
  
  return prompts[type] || 'Analyze this SEO data:'
}
