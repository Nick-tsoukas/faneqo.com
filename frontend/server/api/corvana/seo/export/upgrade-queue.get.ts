/**
 * GET /api/corvana/seo/export/upgrade-queue
 * 
 * Returns prioritized pages/articles for upgrade recommendations.
 * Scored based on position, intent, impressions, CTR, and page type.
 * 
 * Query params:
 * - days: 28 (default) or 90
 * - limit: 50 (default)
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
  calculateUpgradeScore,
  getRecommendation,
  type RecommendationType,
  generateChatGptPrompt
} from '../../../../utils/seoExportUtils'

interface UpgradeItem {
  page: string
  score: number
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  recommendation: RecommendationType
  recommendationReason: string
  currentMetrics: {
    clicks: number
    impressions: number
    position: number
    ctr: number
  }
  opportunitySignals: {
    isHomepage: boolean
    isArticle: boolean
    hasHighIntentQueries: boolean
    topQueries: string[]
    uniqueQueries: number
  }
  estimatedImpact: string
  effortLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  actionSteps: string[]
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
  const limit = Math.min(parseInt(query.limit as string) || 50, 100)
  
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
    
    // Fetch page-level and page+query data
    const [pageData, pageQueryData] = await Promise.all([
      client.querySearchAnalytics({
        siteUrl,
        startDate,
        endDate,
        dimensions: ['page'],
        rowLimit: 50
      }),
      client.querySearchAnalytics({
        siteUrl,
        startDate,
        endDate,
        dimensions: ['page', 'query'],
        rowLimit: 250
      })
    ])
    
    // Group by page
    const byPage = groupByPage(pageQueryData)
    
    // Build upgrade queue
    const upgradeItems: UpgradeItem[] = []
    
    for (const pageRow of pageData.slice(0, 50)) {
      const pageQueries = byPage.get(pageRow.page) || []
      const pageAgg = aggregateMetrics(pageQueries)
      
      const queries = pageQueries.map(r => r.query)
      const hasHighIntent = queries.some(isHighIntentQuery)
      const topQueries = queries.filter(isHighIntentQuery).slice(0, 5)
      
      // Calculate score based on page-level metrics
      const score = calculateUpgradeScore({
        position: pageRow.position,
        impressions: pageRow.impressions,
        clicks: pageRow.clicks,
        ctr: pageRow.ctr,
        isHomepage: isHomepage(pageRow.page),
        isHighIntent: hasHighIntent
      })
      
      // Determine priority
      let priority: UpgradeItem['priority']
      if (score >= 70) priority = 'CRITICAL'
      else if (score >= 50) priority = 'HIGH'
      else if (score >= 30) priority = 'MEDIUM'
      else priority = 'LOW'
      
      // Get recommendation type
      const recommendation = getRecommendation({
        position: pageRow.position,
        impressions: pageRow.impressions,
        clicks: pageRow.clicks,
        ctr: pageRow.ctr,
        isHomepage: isHomepage(pageRow.page),
        isHighIntent: hasHighIntent
      })
      
      // Build recommendation reason
      const reasons: string[] = []
      if (isHomepage(pageRow.page) && hasHighIntent) {
        reasons.push('Homepage ranking for high-intent queries')
      }
      if (pageRow.position >= 5 && pageRow.position <= 15) {
        reasons.push(`Strong position (${pageRow.position.toFixed(1)}) needs optimization to break into top 3`)
      }
      if (pageRow.position >= 16 && pageRow.position <= 25) {
        reasons.push(`Good position (${pageRow.position.toFixed(1)}) on page 2 - push to page 1`)
      }
      if (pageRow.clicks === 0 && pageRow.impressions > 0) {
        reasons.push('Zero clicks despite impressions - title/meta issue')
      }
      if (pageRow.position > 50 && pageRow.impressions > 5) {
        reasons.push('High impressions but poor position - content refresh needed')
      }
      
      // Determine effort level
      let effortLevel: UpgradeItem['effortLevel']
      switch (recommendation) {
        case 'TITLE_META_REWRITE':
          effortLevel = 'LOW'
          break
        case 'INTERNAL_LINKING':
          effortLevel = 'LOW'
          break
        case 'ARTICLE_REFRESH':
          effortLevel = 'MEDIUM'
          break
        case 'HOMEPAGE_SEO_UPGRADE':
          effortLevel = 'MEDIUM'
          break
        case 'PILLAR_STRENGTHENING':
          effortLevel = 'HIGH'
          break
        case 'CONTENT_RETARGET':
          effortLevel = 'HIGH'
          break
        default:
          effortLevel = 'MEDIUM'
      }
      
      // Build action steps
      const actionSteps: string[] = []
      switch (recommendation) {
        case 'HOMEPAGE_SEO_UPGRADE':
          actionSteps.push('Optimize homepage title for top 2-3 high-intent queries')
          actionSteps.push('Rewrite meta description to improve CTR')
          actionSteps.push('Add internal links from articles to homepage with high-intent anchor text')
          break
        case 'TITLE_META_REWRITE':
          actionSteps.push('A/B test new title tags for higher CTR')
          actionSteps.push('Write compelling meta descriptions with clear value proposition')
          actionSteps.push('Add schema markup for rich snippets')
          break
        case 'ARTICLE_REFRESH':
          actionSteps.push('Update content with fresh examples and data')
          actionSteps.push('Expand word count to match/exceed top-ranking pages')
          actionSteps.push('Add internal links to and from related articles')
          break
        case 'INTERNAL_LINKING':
          actionSteps.push('Create topic clusters linking related articles')
          actionSteps.push('Add contextual links from high-authority pages')
          actionSteps.push('Optimize anchor text with target keywords')
          break
        case 'PILLAR_STRENGTHENING':
          actionSteps.push('Expand pillar page to cover subtopics comprehensively')
          actionSteps.push('Create/update cluster content linking to pillar')
          actionSteps.push('Add FAQ section targeting long-tail queries')
          break
        case 'CONTENT_RETARGET':
          actionSteps.push('Research less competitive long-tail keywords')
          actionSteps.push('Retarget content to match search intent better')
          actionSteps.push('Consider merging with stronger page if too similar')
          break
        case 'REVIEW_FOR_MERGE':
          actionSteps.push('Analyze competing pages for content overlap')
          actionSteps.push('Choose strongest page as canonical')
          actionSteps.push('Merge unique content, redirect weaker pages')
          break
      }
      
      // Estimate impact
      let estimatedImpact: string
      if (priority === 'CRITICAL') {
        estimatedImpact = 'High - Likely to significantly increase traffic within 2-4 weeks'
      } else if (priority === 'HIGH') {
        estimatedImpact = 'Medium-High - Should improve rankings and CTR within 1-2 months'
      } else if (priority === 'MEDIUM') {
        estimatedImpact = 'Medium - Gradual improvement over 2-3 months'
      } else {
        estimatedImpact = 'Low - Marginal gains, consider only if resources allow'
      }
      
      upgradeItems.push({
        page: pageRow.page,
        score,
        priority,
        recommendation,
        recommendationReason: reasons.join('; ') || 'General optimization opportunity',
        currentMetrics: {
          clicks: pageRow.clicks,
          impressions: pageRow.impressions,
          position: parseFloat(pageRow.position.toFixed(1)),
          ctr: parseFloat((pageRow.ctr * 100).toFixed(2))
        },
        opportunitySignals: {
          isHomepage: isHomepage(pageRow.page),
          isArticle: pageRow.page.includes('/article/'),
          hasHighIntentQueries: hasHighIntent,
          topQueries,
          uniqueQueries: queries.length
        },
        estimatedImpact,
        effortLevel,
        actionSteps
      })
    }
    
    // Sort by score descending, then by priority
    upgradeItems.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })
    
    // Take top N
    const topItems = upgradeItems.slice(0, limit)
    
    // Group by recommendation type
    const byType: Record<string, UpgradeItem[]> = {}
    for (const item of topItems) {
      if (!byType[item.recommendation]) {
        byType[item.recommendation] = []
      }
      byType[item.recommendation].push(item)
    }
    
    return {
      site: siteUrl,
      generatedAt: new Date().toISOString(),
      dateRange: { startDate, endDate, days },
      
      summary: {
        totalItems: upgradeItems.length,
        returnedItems: topItems.length,
        criticalCount: upgradeItems.filter(i => i.priority === 'CRITICAL').length,
        highCount: upgradeItems.filter(i => i.priority === 'HIGH').length,
        mediumCount: upgradeItems.filter(i => i.priority === 'MEDIUM').length,
        lowCount: upgradeItems.filter(i => i.priority === 'LOW').length
      },
      
      prioritizedQueue: topItems,
      byRecommendationType: byType,
      
      quickWins: topItems.filter(i => 
        i.effortLevel === 'LOW' && (i.priority === 'CRITICAL' || i.priority === 'HIGH')
      ).slice(0, 10),
      
      chatGptPrompt: generateChatGptPrompt('upgrade', null),
      
      exportMeta: {
        version: '1.0',
        tool: 'Corvana SEO',
        notes: [
          'Prioritize CRITICAL and HIGH items first',
          'Focus on LOW effort items for quick wins',
          'Review homepage opportunities carefully - high impact potential',
          'Use page detail export for deep-dive on specific pages'
        ]
      }
    }
    
  } catch (error: any) {
    console.error('[Corvana] Upgrade queue export failed:', error.message)
    
    setResponseStatus(event, 500)
    return {
      error: 'Failed to generate upgrade queue',
      message: error.message
    }
  }
})
