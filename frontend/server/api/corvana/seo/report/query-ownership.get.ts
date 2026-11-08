/**
 * GET /api/corvana/seo/report/query-ownership?days=28
 * 
 * Defines which page should own each important query.
 * Groups competing pages and recommends ownership.
 * 
 * Query params:
 * - days: 28 (default) or 90
 * - minImpressions: 1 (default) - filter low-volume queries
 */

import { defineEventHandler, getQuery, setResponseStatus } from 'h3'
import { SearchConsoleClient } from '../../../../utils/searchConsoleClient'
import { getStoredRefreshToken, checkEnvVars } from '../../../../utils/corvanaGoogleOAuth'
import { checkCorvanaAuth } from '../../../../utils/corvanaAuth'
import { google } from 'googleapis'
import {
  calculateDateRange,
  isHighIntentQuery,
  isHomepage,
  isArticle
} from '../../../../utils/seoExportUtils'

type QueryIntent = 'QR_CODE_STRATEGY' | 'SMART_LINKS' | 'FAN_CAPTURE' | 'TOURING_EVENTS' | 'MERCH' | 'MUSIC_MARKETING' | 'GENERAL'

interface CompetingPage {
  page: string
  clicks: number
  impressions: number
  ctr: number
  position: number
  cluster: string
  isHomepage: boolean
  isArticle: boolean
  score: number // Calculated ownership score
}

interface QueryOwnership {
  query: string
  intent: QueryIntent
  highIntent: boolean
  totalImpressions: number
  totalClicks: number
  competingPages: CompetingPage[]
  recommendedOwner: {
    page: string
    reasoning: string
    confidence: 'HIGH' | 'MEDIUM' | 'LOW'
  }
  supportingPages: string[]
  recommendation: string
  internalLinkInstruction: string
}

// Intent classification
const INTENT_PATTERNS: Record<QueryIntent, string[]> = {
  QR_CODE_STRATEGY: ['qr', 'qr code', 'qr codes', 'scan', 'scannable'],
  SMART_LINKS: ['smart link', 'music link', 'link in bio', 'linkinbio', 'linktree', 'bio link', 'one link'],
  FAN_CAPTURE: ['fan', 'fans', 'email', 'direct to fan', 'direct-to-fan', 'mailing list', 'newsletter'],
  TOURING_EVENTS: ['concert', 'festival', 'tour', 'show', 'gig', 'live', 'event', 'ticket'],
  MERCH: ['merch', 'merchandise', 't-shirt', 'tshirt', 'hoodie', 'vinyl', 'cd', 'physical'],
  MUSIC_MARKETING: ['marketing', 'promote', 'promotion', 'growth', 'strategy', 'tips'],
  GENERAL: []
}

function classifyIntent(query: string): QueryIntent {
  const lower = query.toLowerCase()
  
  for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
    if (patterns.some(p => lower.includes(p))) {
      return intent as QueryIntent
    }
  }
  
  return 'GENERAL'
}

// Known pillar targets
const PILLAR_TARGETS: Record<string, string> = {
  'smart-links': 'https://musicbizqr.com/article/smart-links',
  'qr-code-strategy': 'https://musicbizqr.com/article/qr-code-strategy',
  'touring-events': 'https://musicbizqr.com/article/touring-events',
  'music-marketing': 'https://musicbizqr.com/article/music-marketing',
  'fan-capture': 'https://musicbizqr.com/article/fan-capture-for-musicians',
  'homepage': 'https://musicbizqr.com/'
}

// Extract cluster from URL
function getClusterFromUrl(url: string): string {
  if (isHomepage(url)) return 'homepage'
  const match = url.match(/\/article\/([^/]+)/)
  return match ? match[1] : 'unknown'
}

export default defineEventHandler(async (event) => {
  // Check auth
  const auth = checkCorvanaAuth(event)
  if (!auth.authorized) {
    setResponseStatus(event, 401)
    return auth.error
  }
  
  const runtimeConfig = useRuntimeConfig()
  const query = getQuery(event)
  
  // Validate env vars
  const envCheck = checkEnvVars({
    corvanaGoogleClientId: runtimeConfig.corvanaGoogleClientId,
    corvanaGoogleClientSecret: runtimeConfig.corvanaGoogleClientSecret,
    corvanaGoogleRedirectUri: runtimeConfig.corvanaGoogleRedirectUri,
    corvanaGscSiteUrl: runtimeConfig.corvanaGscSiteUrl
  })
  
  if (!envCheck.valid) {
    setResponseStatus(event, 500)
    return {
      error: 'Missing required environment variables',
      missing: envCheck.missing
    }
  }
  
  // Check OAuth
  const refreshToken = await getStoredRefreshToken()
  if (!refreshToken) {
    setResponseStatus(event, 401)
    return {
      error: 'Corvana Google OAuth is not connected',
      nextStep: 'Visit /api/corvana/google/connect'
    }
  }
  
  // Parse query params
  const days = Math.min(parseInt(query.days as string) || 28, 90)
  const minImpressions = parseInt(query.minImpressions as string) || 1
  const { startDate, endDate } = calculateDateRange(days)
  const siteUrl = runtimeConfig.corvanaGscSiteUrl!
  
  try {
    // Create authenticated client
    const oauth2Client = new google.auth.OAuth2(
      runtimeConfig.corvanaGoogleClientId,
      runtimeConfig.corvanaGoogleClientSecret,
      runtimeConfig.corvanaGoogleRedirectUri
    )
    oauth2Client.setCredentials({ refresh_token: refreshToken })
    
    const client = new SearchConsoleClient(oauth2Client)
    
    // Fetch page+query data
    const pageQueryData = await client.querySearchAnalytics({
      siteUrl,
      startDate,
      endDate,
      dimensions: ['page', 'query'],
      rowLimit: 250
    })
    
    // Group by query
    const byQuery: Record<string, typeof pageQueryData> = {}
    for (const row of pageQueryData) {
      if (!byQuery[row.query]) {
        byQuery[row.query] = []
      }
      byQuery[row.query].push(row)
    }
    
    // Build query ownership map
    const ownershipMap: QueryOwnership[] = []
    
    for (const [queryText, rows] of Object.entries(byQuery)) {
      // Skip low-volume queries
      const totalImpressions = rows.reduce((s, r) => s + r.impressions, 0)
      if (totalImpressions < minImpressions) continue
      
      // Skip single-page queries (no competition)
      if (rows.length < 2) continue
      
      const intent = classifyIntent(queryText)
      const highIntent = isHighIntentQuery(queryText)
      
      // Build competing pages with scores
      const competingPages: CompetingPage[] = rows.map(row => {
        const cluster = getClusterFromUrl(row.page)
        const isHp = isHomepage(row.page)
        
        // Calculate ownership score
        // Higher is better candidate for ownership
        let score = 0
        
        // Position weight (lower position = higher score)
        if (row.position <= 3) score += 50
        else if (row.position <= 10) score += 40
        else if (row.position <= 20) score += 30
        else if (row.position <= 30) score += 20
        else score += 10
        
        // Clicks weight
        score += row.clicks * 5
        
        // Impressions weight (normalized)
        score += Math.min(row.impressions / 10, 20)
        
        // Intent match bonus
        const intentMatches = INTENT_PATTERNS[intent].some(p => 
          cluster.toLowerCase().includes(p) || 
          (intent === 'SMART_LINKS' && cluster === 'smart-links') ||
          (intent === 'QR_CODE_STRATEGY' && cluster.includes('qr'))
        )
        if (intentMatches) score += 15
        
        // Homepage handling
        if (isHp) {
          // Homepage gets bonus for broad product/tool queries
          const isBroadProductQuery = ['music qr', 'musicians qr', 'qr tool', 'smart link tool', 'link in bio'].some(p =>
            queryText.toLowerCase().includes(p)
          )
          if (isBroadProductQuery) score += 20
          else score -= 5 // Slight penalty for specific queries
        }
        
        return {
          page: row.page,
          clicks: row.clicks,
          impressions: row.impressions,
          ctr: parseFloat((row.ctr * 100).toFixed(2)),
          position: parseFloat(row.position.toFixed(1)),
          cluster,
          isHomepage: isHp,
          isArticle: isArticle(row.page),
          score
        }
      }).sort((a, b) => b.score - a.score)
      
      const bestPage = competingPages[0]
      const runnerUp = competingPages[1]
      
      // Determine owner
      let ownerPage = bestPage.page
      let ownerReasoning = ''
      let confidence: QueryOwnership['recommendedOwner']['confidence']
      
      // Special handling for homepage vs article decisions
      if (bestPage.isHomepage && runnerUp && !runnerUp.isHomepage) {
        const isBroadToolQuery = ['music qr', 'musicians qr', 'qr tool', 'smart link tool', 'musicbizqr'].some(p =>
          queryText.toLowerCase().includes(p)
        )
        const isLongTailEducational = queryText.split(' ').length >= 4 && 
          !['tool', 'app', 'software'].some(t => queryText.toLowerCase().includes(t))
        
        if (isBroadToolQuery) {
          ownerReasoning = `Homepage should own broad product/tool query "${queryText}" due to domain authority`
          confidence = 'HIGH'
        } else if (isLongTailEducational) {
          ownerPage = runnerUp.page
          ownerReasoning = `Article "${runnerUp.page}" better serves educational intent for long-tail query "${queryText}"`
          confidence = 'MEDIUM'
        } else {
          ownerReasoning = `Homepage currently winning but article could be strengthened for "${queryText}"`
          confidence = 'MEDIUM'
        }
      } else if (!bestPage.isHomepage) {
        if (bestPage.position <= 10) {
          ownerReasoning = `Article "${bestPage.page}" is ranking well (position ${bestPage.position}) and should own this query`
          confidence = 'HIGH'
        } else {
          ownerReasoning = `Article "${bestPage.page}" is best candidate but needs optimization to improve from position ${bestPage.position}`
          confidence = 'MEDIUM'
        }
      } else {
        ownerReasoning = `Homepage is the clear winner for "${queryText}"`
        confidence = 'HIGH'
      }
      
      // Supporting pages (others that should link to owner)
      const supportingPages = competingPages
        .filter(p => p.page !== ownerPage)
        .slice(0, 3)
        .map(p => p.page)
      
      // Build recommendation
      let recommendation = ''
      if (bestPage.isHomepage && runnerUp && !runnerUp.isHomepage) {
        const isLongTail = queryText.split(' ').length >= 4
        if (isLongTail) {
          recommendation = `RETARGET: Strengthen article "${runnerUp.page}" for this query. Add internal link from homepage to article with "${queryText}" anchor.`
        } else {
          recommendation = `HOMEPAGE_WINS: Keep homepage as primary. Ensure article links to homepage with "${queryText}" as anchor text.`
        }
      } else if (!bestPage.isHomepage) {
        recommendation = `ARTICLE_OWNER: "${bestPage.page}" should own this. Add internal links from other competing pages to this article.`
      } else {
        recommendation = `HOMEPAGE_OWNER: Homepage dominates. Ensure supporting articles link to homepage for this query.`
      }
      
      // Internal link instruction
      let internalLinkInstruction = ''
      if (supportingPages.length > 0) {
        internalLinkInstruction = `Add contextual links from ${supportingPages.join(', ')} to ${ownerPage} using anchor text variations of "${queryText}"`
      } else {
        internalLinkInstruction = `Create new supporting content that links to ${ownerPage} for "${queryText}"`
      }
      
      ownershipMap.push({
        query: queryText,
        intent,
        highIntent,
        totalImpressions,
        totalClicks: rows.reduce((s, r) => s + r.clicks, 0),
        competingPages: competingPages.slice(0, 5),
        recommendedOwner: {
          page: ownerPage,
          reasoning: ownerReasoning,
          confidence
        },
        supportingPages,
        recommendation,
        internalLinkInstruction
      })
    }
    
    // Sort by importance (high intent first, then by impressions)
    ownershipMap.sort((a, b) => {
      if (a.highIntent !== b.highIntent) return b.highIntent ? 1 : -1
      return b.totalImpressions - a.totalImpressions
    })
    
    // Group by intent
    const byIntent: Record<QueryIntent, QueryOwnership[]> = {
      QR_CODE_STRATEGY: [],
      SMART_LINKS: [],
      FAN_CAPTURE: [],
      TOURING_EVENTS: [],
      MERCH: [],
      MUSIC_MARKETING: [],
      GENERAL: []
    }
    
    for (const item of ownershipMap) {
      byIntent[item.intent].push(item)
    }
    
    return {
      site: siteUrl,
      generatedAt: new Date().toISOString(),
      dateRange: { startDate, endDate, days },
      
      summary: {
        totalQueriesWithCompetition: ownershipMap.length,
        highIntentQueries: ownershipMap.filter(q => q.highIntent).length,
        homepageVsArticleConflicts: ownershipMap.filter(q => 
          q.competingPages.some(p => p.isHomepage) && 
          q.competingPages.some(p => !p.isHomepage)
        ).length,
        clearArticleOwners: ownershipMap.filter(q => 
          !q.recommendedOwner.page.includes('musicbizqr.com/') || 
          q.recommendedOwner.page.includes('/article/')
        ).length
      },
      
      queryOwnership: ownershipMap.slice(0, 50), // Top 50
      byIntent,
      
      strategicRecommendations: [
        `Prioritize ${byIntent.QR_CODE_STRATEGY.length} QR code strategy queries for cluster consolidation`,
        `Review ${byIntent.SMART_LINKS.length} smart links queries for homepage vs article ownership`,
        `Ensure fan capture pillar is linked from all fan-related queries`,
        `Build internal linking from supporting articles to primary owners`
      ],
      
      exportMeta: {
        version: '1.0',
        tool: 'Corvana SEO',
        note: 'Owner recommendations require manual review - do not auto-redirect based on this data alone'
      }
    }
    
  } catch (error: any) {
    console.error('[Corvana] Query ownership map failed:', error.message)
    
    setResponseStatus(event, 500)
    return {
      error: 'Failed to generate query ownership map',
      message: error.message
    }
  }
})
