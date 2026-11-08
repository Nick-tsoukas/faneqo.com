/**
 * GET /api/corvana/seo/export/cannibalization
 * 
 * Finds queries that appear across multiple pages (cannibalization).
 * Returns analysis for ChatGPT to recommend consolidation strategies.
 * 
 * Query params:
 * - days: 28 (default) or 90
 * - minPages: 2 (default) - minimum competing pages to include
 */

import { defineEventHandler, getQuery, setResponseStatus } from 'h3'
import { SearchConsoleClient } from '../../../../utils/searchConsoleClient'
import { getStoredRefreshToken, checkEnvVars } from '../../../../utils/corvanaGoogleOAuth'
import { google } from 'googleapis'
import {
  calculateDateRange,
  isHighIntentQuery,
  isHomepage,
  aggregateMetrics,
  groupByQuery,
  generateChatGptPrompt
} from '../../../../utils/seoExportUtils'

interface CannibalizationItem {
  query: string
  isHighIntent: boolean
  totalImpressions: number
  totalClicks: number
  avgPosition: number
  competingPages: {
    count: number
    pages: Array<{
      page: string
      position: number
      clicks: number
      impressions: number
      ctr: number
      isHomepage: boolean
      isArticle: boolean
      articleCategory: string | null
    }>
  }
  bestCurrentPage: {
    page: string
    position: number
    reasoning: string
  }
  conflictAnalysis: {
    type: 'HOMEPAGE_VS_ARTICLES' | 'MULTIPLE_ARTICLES' | 'MIXED'
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
    description: string
  }
  recommendation: {
    primaryAction: string
    reasoning: string
    steps: string[]
    warning: string
  }
}

export default defineEventHandler(async (event) => {
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
  const minPages = Math.max(parseInt(query.minPages as string) || 2, 2)
  
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
    
    // Fetch query-level data first to get all queries
    const queryData = await client.querySearchAnalytics({
      siteUrl,
      startDate,
      endDate,
      dimensions: ['query'],
      rowLimit: 100
    })
    
    // Fetch page+query combined data
    const pageQueryData = await client.querySearchAnalytics({
      siteUrl,
      startDate,
      endDate,
      dimensions: ['page', 'query'],
      rowLimit: 250
    })
    
    // Group by query
    const byQuery = groupByQuery(pageQueryData)
    
    // Find cannibalization candidates
    const candidates: CannibalizationItem[] = []
    
    for (const [queryText, rows] of byQuery.entries()) {
      // Skip if only 1 page or less than minPages
      if (rows.length < minPages) continue
      
      // Get query-level metrics
      const queryRow = queryData.find(q => q.query === queryText)
      const queryMetrics = queryRow ? {
        totalImpressions: queryRow.impressions,
        totalClicks: queryRow.clicks,
        avgPosition: queryRow.position
      } : aggregateMetrics(rows)
      
      // Build competing pages array
      const competingPages = rows.map(row => {
        const articleCategory = row.page.match(/\/article\/([^/]+)/)?.[1] || null
        
        return {
          page: row.page,
          position: parseFloat(row.position.toFixed(1)),
          clicks: row.clicks,
          impressions: row.impressions,
          ctr: parseFloat((row.ctr * 100).toFixed(2)),
          isHomepage: isHomepage(row.page),
          isArticle: row.page.includes('/article/'),
          articleCategory
        }
      }).sort((a, b) => a.position - b.position) // Best position first
      
      // Determine conflict type
      const hasHomepage = competingPages.some(p => p.isHomepage)
      const hasArticles = competingPages.some(p => p.isArticle)
      
      let conflictType: CannibalizationItem['conflictAnalysis']['type']
      if (hasHomepage && hasArticles) {
        conflictType = 'HOMEPAGE_VS_ARTICLES'
      } else if (hasArticles && !hasHomepage) {
        conflictType = 'MULTIPLE_ARTICLES'
      } else {
        conflictType = 'MIXED'
      }
      
      // Determine severity
      let severity: CannibalizationItem['conflictAnalysis']['severity']
      const isHighIntent = isHighIntentQuery(queryText)
      const hasStrongPosition = competingPages.some(p => p.position <= 15)
      
      if (isHighIntent && hasStrongPosition && competingPages.length >= 3) {
        severity = 'CRITICAL'
      } else if (isHighIntent || (competingPages.length >= 3)) {
        severity = 'HIGH'
      } else if (competingPages.length === 2 && hasStrongPosition) {
        severity = 'MEDIUM'
      } else {
        severity = 'LOW'
      }
      
      // Determine best current page
      const bestPage = competingPages[0]
      let bestReasoning: string
      
      if (bestPage.isHomepage) {
        bestReasoning = 'Homepage has best position but may not match query intent'
      } else if (bestPage.position <= 10) {
        bestReasoning = 'Article ranking well - strong candidate to own this query'
      } else if (bestPage.position <= 25) {
        bestReasoning = 'Article on page 2 - can be pushed to page 1 with optimization'
      } else {
        bestReasoning = 'Best position still poor - consider retargeting or merging'
      }
      
      // Build recommendation
      let primaryAction: string
      let reasoning: string
      let steps: string[]
      let warning: string
      
      switch (conflictType) {
        case 'HOMEPAGE_VS_ARTICLES':
          if (isHighIntent) {
            primaryAction = 'CHOOSE_OWNER: Decide if homepage or article should rank'
            reasoning = 'High-intent query competing between homepage and articles dilutes authority'
            steps = [
              'Review search intent: Is this a navigational query (keep on homepage) or informational (move to article)?',
              'If article should own: Add internal links from homepage to article with this query as anchor',
              'If homepage should own: Reduce article optimization for this query, focus on related terms',
              'Update internal linking structure to consolidate signals'
            ]
            warning = 'Do not redirect unless pages are truly duplicate'
          } else {
            primaryAction = 'MONITOR: Low-priority cannibalization'
            reasoning = 'Lower-intent query - monitor but focus on higher-value conflicts first'
            steps = [
              'Track positions over time',
              'If positions drop, reconsider ownership',
              'Focus on high-intent cannibalization first'
            ]
            warning = 'May resolve itself as content matures'
          }
          break
          
        case 'MULTIPLE_ARTICLES':
          primaryAction = 'CONSOLIDATE: Choose primary article for this query'
          reasoning = 'Multiple articles targeting same query splits ranking potential'
          steps = [
            'Audit competing articles for content overlap',
            'Choose the strongest/most comprehensive article as primary owner',
            'Update secondary articles to target related but different queries',
            'Add internal links from secondary to primary article',
            'If content is truly redundant, consider merging unique elements and redirecting'
          ]
          warning = 'Only redirect if articles cover identical topics - otherwise retarget'
          break
          
        case 'MIXED':
          primaryAction = 'ANALYZE: Review intent match across page types'
          reasoning = 'Mixed page types competing - unclear which best serves search intent'
          steps = [
            'Analyze top 3 ranking pages for this query on Google',
            'Match your content format to what ranks',
            'Strengthen the best-matching page',
            'Reduce competing signals from other pages'
          ]
          warning = 'Intent mismatch is the root cause'
          break
      }
      
      candidates.push({
        query: queryText,
        isHighIntent,
        totalImpressions: queryMetrics.totalImpressions,
        totalClicks: queryMetrics.totalClicks,
        avgPosition: parseFloat(queryMetrics.avgPosition.toFixed(1)),
        competingPages: {
          count: competingPages.length,
          pages: competingPages
        },
        bestCurrentPage: {
          page: bestPage.page,
          position: bestPage.position,
          reasoning: bestReasoning
        },
        conflictAnalysis: {
          type: conflictType,
          severity,
          description: `${competingPages.length} pages competing for "${queryText}" (${conflictType}, ${severity} priority)`
        },
        recommendation: {
          primaryAction,
          reasoning,
          steps,
          warning
        }
      })
    }
    
    // Sort by severity then by impressions
    const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
    candidates.sort((a, b) => {
      const severityDiff = severityOrder[a.conflictAnalysis.severity] - severityOrder[b.conflictAnalysis.severity]
      if (severityDiff !== 0) return severityDiff
      return b.totalImpressions - a.totalImpressions
    })
    
    // Take top 25
    const topCandidates = candidates.slice(0, 25)
    
    // Group by severity
    const bySeverity: Record<string, CannibalizationItem[]> = {
      CRITICAL: [],
      HIGH: [],
      MEDIUM: [],
      LOW: []
    }
    for (const c of topCandidates) {
      bySeverity[c.conflictAnalysis.severity].push(c)
    }
    
    // Group by conflict type
    const byType: Record<string, CannibalizationItem[]> = {}
    for (const c of topCandidates) {
      const type = c.conflictAnalysis.type
      if (!byType[type]) byType[type] = []
      byType[type].push(c)
    }
    
    return {
      site: siteUrl,
      generatedAt: new Date().toISOString(),
      dateRange: { startDate, endDate, days },
      
      summary: {
        totalCandidates: candidates.length,
        returnedCandidates: topCandidates.length,
        criticalCount: bySeverity.CRITICAL.length,
        highCount: bySeverity.HIGH.length,
        mediumCount: bySeverity.MEDIUM.length,
        lowCount: bySeverity.LOW.length,
        homepageVsArticlesCount: byType['HOMEPAGE_VS_ARTICLES']?.length || 0,
        multipleArticlesCount: byType['MULTIPLE_ARTICLES']?.length || 0
      },
      
      cannibalizationCandidates: topCandidates,
      bySeverity,
      byConflictType: byType,
      
      criticalPriority: bySeverity.CRITICAL.slice(0, 10),
      
      chatGptPrompt: generateChatGptPrompt('cannibalization', null),
      
      strategicNotes: [
        'HOMEPAGE_VS_ARTICLES: Usually homepage wins due to authority, but articles better serve informational intent',
        'MULTIPLE_ARTICLES: Split authority - consolidate into single comprehensive resource',
        'High-intent queries should have clear ownership - confusion costs conversions',
        'Monitor after fixes - Google may take 2-4 weeks to reprocess',
        'Never redirect unless truly duplicate; prefer retargeting and internal linking fixes'
      ],
      
      exportMeta: {
        version: '1.0',
        tool: 'Corvana SEO',
        disclaimer: 'Manual review required - do not auto-redirect based on this data alone'
      }
    }
    
  } catch (error: any) {
    console.error('[Corvana] Cannibalization export failed:', error.message)
    
    setResponseStatus(event, 500)
    return {
      error: 'Failed to generate cannibalization analysis',
      message: error.message
    }
  }
})
