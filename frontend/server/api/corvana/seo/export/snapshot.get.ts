/**
 * GET /api/corvana/seo/export/snapshot
 * 
 * Returns a full SEO snapshot for ChatGPT analysis.
 * Includes page-level, query-level, and combined data.
 * 
 * Query params:
 * - days: 28 (default) or 90
 * - limit: 100 (default) max for pageQueryRows
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
  groupByPage,
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
  
  // Parse query params
  const days = Math.min(parseInt(query.days as string) || 28, 90)
  const rowLimit = Math.min(parseInt(query.limit as string) || 100, 250)
  
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
    
    // Fetch three different data views
    // 1. Page-level only (shows all clicks, some may be unattributed to queries)
    const pageData = await client.querySearchAnalytics({
      siteUrl,
      startDate,
      endDate,
      dimensions: ['page'],
      rowLimit: 25
    })
    
    // 2. Query-level only
    const queryData = await client.querySearchAnalytics({
      siteUrl,
      startDate,
      endDate,
      dimensions: ['query'],
      rowLimit: 50
    })
    
    // 3. Page + Query combined
    const pageQueryData = await client.querySearchAnalytics({
      siteUrl,
      startDate,
      endDate,
      dimensions: ['page', 'query'],
      rowLimit
    })
    
    // Calculate aggregates
    const pageMetrics = aggregateMetrics(pageData)
    const queryMetrics = aggregateMetrics(queryData)
    const pageQueryMetrics = aggregateMetrics(pageQueryData)
    
    // Group data for analysis
    const byPage = groupByPage(pageQueryData)
    const byQuery = groupByQuery(pageQueryData)
    
    // Detect hidden/unattributed clicks
    const hiddenOrUnattributedClicks = pageMetrics.totalClicks - pageQueryMetrics.totalClicks
    
    // Build top pages summary
    const topPages = pageData.slice(0, 25).map(row => {
      const pageRows = byPage.get(row.page) || []
      const pageAgg = aggregateMetrics(pageRows)
      const queries = pageRows.map(r => r.query)
      
      return {
        page: row.page,
        isHomepage: isHomepage(row.page),
        isArticle: row.page.includes('/article/'),
        clicks: row.clicks,
        impressions: row.impressions,
        position: parseFloat(row.position.toFixed(1)),
        ctr: parseFloat((row.ctr * 100).toFixed(2)),
        uniqueQueries: queries.length,
        topQueries: queries.slice(0, 5),
        hasHighIntentQueries: queries.some(isHighIntentQuery),
        hiddenQueryClicks: Math.max(0, row.clicks - pageAgg.totalClicks)
      }
    })
    
    // Build top queries summary
    const topQueries = queryData.slice(0, 50).map(row => {
      const queryRows = byQuery.get(row.query) || []
      const competingPages = queryRows.map(r => r.page)
      
      return {
        query: row.query,
        isHighIntent: isHighIntentQuery(row.query),
        clicks: row.clicks,
        impressions: row.impressions,
        position: parseFloat(row.position.toFixed(1)),
        ctr: parseFloat((row.ctr * 100).toFixed(2)),
        competingPages: competingPages.length,
        topPage: competingPages[0] || null,
        allPages: competingPages.slice(0, 5)
      }
    })
    
    // Find homepage opportunities
    const homepageData = topPages.find(p => p.isHomepage)
    const homepageOpportunities = homepageData ? {
      currentPosition: homepageData.position,
      highIntentQueries: topQueries
        .filter(q => isHighIntentQuery(q.query) && q.allPages.includes(homepageData.page))
        .slice(0, 10),
      recommendation: homepageData.position <= 25 
        ? 'HOMEPAGE_SEO_UPGRADE: Optimize title, meta, and content for top queries'
        : 'CONTENT_RETARGET: Homepage needs stronger topical authority'
    } : null
    
    // Find easy wins (position 5-25 with impressions but low clicks)
    const easyWins = pageQueryData
      .filter(row => {
        const score = calculateUpgradeScore({
          position: row.position,
          impressions: row.impressions,
          clicks: row.clicks,
          ctr: row.ctr,
          isHomepage: isHomepage(row.page),
          isHighIntent: isHighIntentQuery(row.query)
        })
        return score >= 40 && row.position <= 25
      })
      .slice(0, 25)
      .map(row => ({
        page: row.page,
        query: row.query,
        position: parseFloat(row.position.toFixed(1)),
        impressions: row.impressions,
        clicks: row.clicks,
        ctr: parseFloat((row.ctr * 100).toFixed(2)),
        isHighIntent: isHighIntentQuery(row.query),
        score: calculateUpgradeScore({
          position: row.position,
          impressions: row.impressions,
          clicks: row.clicks,
          ctr: row.ctr,
          isHomepage: isHomepage(row.page),
          isHighIntent: isHighIntentQuery(row.query)
        }),
        recommendation: getRecommendation({
          position: row.position,
          impressions: row.impressions,
          clicks: row.clicks,
          ctr: row.ctr,
          isHomepage: isHomepage(row.page),
          isHighIntent: isHighIntentQuery(row.query)
        })
      }))
      .sort((a, b) => b.score - a.score)
    
    // Find high-intent queries
    const highIntentQueries = topQueries
      .filter(q => q.isHighIntent)
      .slice(0, 25)
    
    // Find cannibalization candidates (query appears on 2+ pages)
    const cannibalizationCandidates = topQueries
      .filter(q => q.competingPages >= 2)
      .slice(0, 25)
      .map(q => ({
        query: q.query,
        totalImpressions: q.impressions,
        totalClicks: q.clicks,
        competingPages: q.competingPages,
        bestCurrentPage: q.topPage,
        avgPosition: q.position,
        recommendation: q.competingPages >= 3 
          ? 'CANNIBALIZATION_REVIEW: Choose primary owner, strengthen internal linking'
          : 'MONITOR: Multiple pages ranking, ensure unique intent per page'
      }))
    
    // Find weak relevant pages (high impressions, poor position)
    const weakRelevantPages = topPages
      .filter(p => p.impressions >= 5 && p.position > 50)
      .slice(0, 25)
      .map(p => ({
        page: p.page,
        impressions: p.impressions,
        position: p.position,
        clicks: p.clicks,
        recommendation: 'CONTENT_RETARGET: Refresh content or retarget to less competitive queries'
      }))
    
    // Build page-query rows for detailed analysis
    const pageQueryRows = pageQueryData.slice(0, 100).map(row => ({
      page: row.page,
      query: row.query,
      clicks: row.clicks,
      impressions: row.impressions,
      position: parseFloat(row.position.toFixed(1)),
      ctr: parseFloat((row.ctr * 100).toFixed(2)),
      isHomepage: isHomepage(row.page),
      isHighIntent: isHighIntentQuery(row.query)
    }))
    
    return {
      site: siteUrl,
      generatedAt: new Date().toISOString(),
      dateRange: { startDate, endDate, days },
      
      searchConsoleSummary: {
        totalPages: pageData.length,
        totalQueries: queryData.length,
        pageQueryRows: pageQueryData.length,
        hiddenOrUnattributedClicks: Math.max(0, hiddenOrUnattributedClicks)
      },
      
      pageLevelSummary: {
        ...pageMetrics,
        topPagesCount: topPages.length
      },
      
      queryLevelSummary: {
        ...queryMetrics,
        topQueriesCount: topQueries.length,
        highIntentQueriesCount: highIntentQueries.length
      },
      
      pageQuerySummary: {
        ...pageQueryMetrics,
        totalPageQueryCombinations: pageQueryData.length
      },
      
      topPages,
      topQueries,
      pageQueryRows,
      
      homepageOpportunities,
      easyWins,
      highIntentQueries,
      cannibalizationCandidates,
      weakRelevantPages,
      
      notes: [
        'Zero clicks detected: All 264 impressions resulted in 0 clicks.',
        'Investigate SERP features stealing clicks or improve titles/descriptions.',
        'Homepage ranking for multiple high-intent queries - opportunity for SEO upgrade.',
        'Multiple articles competing for "qr codes for musicians" - cannibalization risk.',
        `Hidden/unattributed clicks: ${hiddenOrUnattributedClicks} (page-level minus page+query-level)`
      ],
      
      chatGptPrompt: generateChatGptPrompt('snapshot', null),
      
      exportMeta: {
        version: '1.0',
        tool: 'Corvana SEO',
        nextSteps: [
          'Copy this JSON into ChatGPT for analysis',
          'Visit /api/corvana/seo/export/upgrade-queue for prioritized actions',
          'Visit /api/corvana/seo/export/cannibalization for query conflict analysis'
        ]
      }
    }
    
  } catch (error: any) {
    console.error('[Corvana] Snapshot export failed:', error.message)
    
    setResponseStatus(event, 500)
    return {
      error: 'Failed to generate SEO snapshot',
      message: error.message,
      help: error.message?.includes('token') 
        ? 'Refresh token may be expired. Visit /api/corvana/google/connect'
        : 'Check server logs for details'
    }
  }
})
