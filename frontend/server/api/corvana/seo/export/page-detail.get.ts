/**
 * GET /api/corvana/seo/export/page-detail?url=<encoded-url>
 * 
 * Returns detailed SEO analysis for a single page.
 * Includes page-level metrics, query breakdown, and competing pages.
 * 
 * Query params:
 * - url: Required. Full page URL to analyze (URL encoded)
 * - days: 28 (default) or 90
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
  calculateUpgradeScore,
  getRecommendation,
  generateChatGptPrompt
} from '../../../../utils/seoExportUtils'

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
  
  // Get and validate URL parameter
  const pageUrl = query.url as string
  if (!pageUrl) {
    setResponseStatus(event, 400)
    return {
      error: 'Missing required parameter: url',
      example: '/api/corvana/seo/export/page-detail?url=https%3A%2F%2Fmusicbizqr.com%2Farticle%2Fqr-code-strategy%2Fhow-bands-can-use-qr-codes-to-skyrocket-tour-engagement'
    }
  }
  
  // Parse query params
  const days = Math.min(parseInt(query.days as string) || 28, 90)
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
    
    // Fetch data for this specific page
    const pageQueries = await client.getPageData(siteUrl, pageUrl, days)
    
    // Also fetch all page+query data to find competing pages
    const allPageQueryData = await client.querySearchAnalytics({
      siteUrl,
      startDate,
      endDate,
      dimensions: ['page', 'query'],
      rowLimit: 250
    })
    
    // Find competing pages (pages that rank for same queries)
    const pageQueriesList = pageQueries.map(r => r.query)
    const competingPagesMap = new Map<string, { query: string; position: number }[]>()
    
    for (const row of allPageQueryData) {
      if (row.page === pageUrl) continue // Skip current page
      if (pageQueriesList.includes(row.query)) {
        const existing = competingPagesMap.get(row.page) || []
        existing.push({ query: row.query, position: row.position })
        competingPagesMap.set(row.page, existing)
      }
    }
    
    // Build competing pages array
    const competingPages = Array.from(competingPagesMap.entries())
      .map(([page, queries]) => ({
        page,
        sharedQueries: queries,
        sharedQueryCount: queries.length,
        avgPosition: parseFloat((queries.reduce((s, q) => s + q.position, 0) / queries.length).toFixed(1))
      }))
      .sort((a, b) => b.sharedQueryCount - a.sharedQueryCount)
      .slice(0, 10)
    
    // Aggregate metrics for this page
    const pageMetrics = aggregateMetrics(pageQueries)
    
    // Analyze queries
    const queryAnalysis = pageQueries.map(row => {
      const isHighIntent = isHighIntentQuery(row.query)
      const competingForQuery = allPageQueryData.filter(
        r => r.query === row.query && r.page !== pageUrl
      )
      
      return {
        query: row.query,
        isHighIntent,
        position: parseFloat(row.position.toFixed(1)),
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: parseFloat((row.ctr * 100).toFixed(2)),
        competingPages: competingForQuery.length,
        isWinning: competingForQuery.length === 0 || 
          row.position <= Math.min(...competingForQuery.map(r => r.position), 999)
      }
    }).sort((a, b) => {
      // Sort by high intent first, then by position
      if (a.isHighIntent !== b.isHighIntent) return b.isHighIntent ? 1 : -1
      return a.position - b.position
    })
    
    // Identify top opportunities
    const highIntentQueries = queryAnalysis.filter(q => q.isHighIntent)
    const winningQueries = queryAnalysis.filter(q => q.isWinning)
    const losingQueries = queryAnalysis.filter(q => !q.isWinning)
    const zeroClickQueries = queryAnalysis.filter(q => q.clicks === 0 && q.impressions > 0)
    
    // Calculate overall page score
    const hasHighIntent = highIntentQueries.length > 0
    const pageScore = calculateUpgradeScore({
      position: pageMetrics.avgPosition,
      impressions: pageMetrics.totalImpressions,
      clicks: pageMetrics.totalClicks,
      ctr: pageMetrics.avgCtr / 100,
      isHomepage: isHomepage(pageUrl),
      isHighIntent: hasHighIntent
    })
    
    // Get recommendation
    const recommendation = getRecommendation({
      position: pageMetrics.avgPosition,
      impressions: pageMetrics.totalImpressions,
      clicks: pageMetrics.totalClicks,
      ctr: pageMetrics.avgCtr / 100,
      isHomepage: isHomepage(pageUrl),
      isHighIntent: hasHighIntent
    })
    
    // Build recommended actions
    const recommendedActions: string[] = []
    
    if (isHomepage(pageUrl) && hasHighIntent) {
      recommendedActions.push('HOMEPAGE_SEO_UPGRADE: Optimize title and meta for top high-intent queries')
      recommendedActions.push('Add strategic internal links from articles pointing to homepage with query anchors')
    }
    
    if (zeroClickQueries.length > 0) {
      recommendedActions.push('TITLE_META_REWRITE: Zero clicks despite impressions - test new title/meta descriptions')
    }
    
    if (losingQueries.length > 0) {
      recommendedActions.push('CONTENT_REFRESH: Strengthen content to outrank competing pages')
      recommendedActions.push('INTERNAL_LINKING: Add internal links from winning pages to this page')
    }
    
    if (pageMetrics.avgPosition > 50 && pageMetrics.totalImpressions > 5) {
      recommendedActions.push('CONTENT_RETARGET: Consider retargeting to less competitive long-tail queries')
    }
    
    if (competingPages.length > 3) {
      recommendedActions.push('CANNIBALIZATION_REVIEW: High overlap with other pages - may need consolidation strategy')
    }
    
    // Generate ChatGPT prompt
    const chatGptPrompt = `${generateChatGptPrompt('page', null)}

Page: ${pageUrl}
Metrics: ${pageMetrics.totalClicks} clicks, ${pageMetrics.totalImpressions} impressions, avg position ${pageMetrics.avgPosition.toFixed(1)}
High-intent queries: ${highIntentQueries.length}
Competing pages: ${competingPages.length}

Analyze this page and recommend:
1. Top 3 immediate actions to improve rankings
2. Whether this page should "own" specific queries
3. Internal linking opportunities
4. Content gaps vs competing pages`
    
    return {
      site: siteUrl,
      generatedAt: new Date().toISOString(),
      dateRange: { startDate, endDate, days },
      
      page: {
        url: pageUrl,
        isHomepage: isHomepage(pageUrl),
        isArticle: pageUrl.includes('/article/'),
        articleCategory: pageUrl.match(/\/article\/([^/]+)/)?.[1] || null
      },
      
      pageLevelMetrics: {
        ...pageMetrics,
        avgCtr: `${pageMetrics.avgCtr.toFixed(2)}%`,
        totalQueries: pageQueries.length
      },
      
      performanceScore: {
        score: pageScore,
        rating: pageScore >= 70 ? 'STRONG' : pageScore >= 40 ? 'MODERATE' : 'NEEDS_WORK',
        recommendation
      },
      
      queryBreakdown: {
        allQueries: queryAnalysis,
        highIntentQueries,
        winningQueries,
        losingQueries,
        zeroClickQueries
      },
      
      opportunities: {
        topOpportunity: highIntentQueries[0] || null,
        quickWin: zeroClickQueries.find(q => q.position < 25) || null,
        cannibalizationRisk: losingQueries.filter(q => q.competingPages > 0).slice(0, 5)
      },
      
      competingPages: {
        count: competingPages.length,
        pages: competingPages,
        summary: competingPages.length > 0 
          ? `This page shares queries with ${competingPages.length} other pages`
          : 'No direct competing pages detected'
      },
      
      recommendedActions: recommendedActions.length > 0 
        ? recommendedActions 
        : ['No critical issues detected - continue monitoring and incremental improvements'],
      
      chatGptPrompt,
      
      copyToChatGPT: {
        summary: `Page: ${pageUrl}\nPosition: ${pageMetrics.avgPosition.toFixed(1)} | Clicks: ${pageMetrics.totalClicks} | Queries: ${pageQueries.length}`,
        topQueries: queryAnalysis.slice(0, 10).map(q => 
          `- "${q.query}" (pos ${q.position}, ${q.impressions} imp, ${q.clicks} clicks${q.isHighIntent ? ', HIGH INTENT' : ''})`
        ).join('\n'),
        competingPages: competingPages.length > 0
          ? competingPages.map(p => `- ${p.page} (${p.sharedQueryCount} shared queries)`).join('\n')
          : 'No competing pages',
        recommendedAction: recommendedActions[0] || 'Continue monitoring'
      },
      
      exportMeta: {
        version: '1.0',
        tool: 'Corvana SEO',
        relatedEndpoints: {
          snapshot: '/api/corvana/seo/export/snapshot',
          upgradeQueue: '/api/corvana/seo/export/upgrade-queue',
          cannibalization: '/api/corvana/seo/export/cannibalization'
        }
      }
    }
    
  } catch (error: any) {
    console.error('[Corvana] Page detail export failed:', error.message)
    
    setResponseStatus(event, 500)
    return {
      error: 'Failed to generate page detail',
      message: error.message,
      help: 'Ensure the page URL exists and has Search Console data'
    }
  }
})
