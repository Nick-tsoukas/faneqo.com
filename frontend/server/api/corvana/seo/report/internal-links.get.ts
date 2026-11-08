/**
 * GET /api/corvana/seo/report/internal-links?days=28
 * 
 * Recommends internal links to add to articles/pages based on:
 * - Query ownership map
 * - Cluster structure
 * - Known pillar targets
 * 
 * Query params:
 * - days: 28 (default) or 90
 * - cluster: filter by cluster (optional)
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
  isArticle,
  getArticleCategory
} from '../../../../utils/seoExportUtils'

// Known pillar targets
const PILLAR_TARGETS = {
  SMART_LINKS: 'https://musicbizqr.com/article/smart-links',
  QR_CODE_STRATEGY: 'https://musicbizqr.com/article/qr-code-strategy',
  TOURING_EVENTS: 'https://musicbizqr.com/article/touring-events',
  MUSIC_MARKETING: 'https://musicbizqr.com/article/music-marketing',
  HOMEPAGE: 'https://musicbizqr.com/',
  FAN_CAPTURE: 'https://musicbizqr.com/article/fan-capture-for-musicians'
}

interface LinkRecommendation {
  targetPage: string
  anchorText: string
  reason: string
  priority: 'high' | 'medium' | 'low'
  context: string
}

interface PageRecommendation {
  sourcePage: string
  sourceTitle: string
  cluster: string
  currentMetrics: {
    clicks: number
    impressions: number
    position: number
  }
  addLinks: LinkRecommendation[]
  notes: string[]
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
  const clusterFilter = query.cluster as string | undefined
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
    
    // Fetch Search Console data
    const [pageData, pageQueryData] = await Promise.all([
      client.querySearchAnalytics({
        siteUrl,
        startDate,
        endDate,
        dimensions: ['page'],
        rowLimit: 100
      }),
      client.querySearchAnalytics({
        siteUrl,
        startDate,
        endDate,
        dimensions: ['page', 'query'],
        rowLimit: 250
      })
    ])
    
    // Fetch article inventory from Strapi
    const strapiUrl = runtimeConfig.public?.strapiUrl || process.env.STRAPI_URL
    let articles: any[] = []
    
    if (strapiUrl) {
      try {
        const params = new URLSearchParams()
        params.set('pagination[pageSize]', '500')
        params.set('populate', '*')
        params.set('sort', 'publishedAt:desc')
        
        const apiUrl = `${strapiUrl}/api/seo-pages?${params.toString()}`
        const response = await fetch(apiUrl)
        
        if (response.ok) {
          const data = await response.json()
          articles = data.data || []
        }
      } catch (err) {
        console.warn('[Corvana] Could not fetch Strapi articles:', err)
      }
    }
    
    // Group page+query data
    const byPage: Record<string, typeof pageQueryData> = {}
    for (const row of pageQueryData) {
      if (!byPage[row.page]) {
        byPage[row.page] = []
      }
      byPage[row.page].push(row)
    }
    
    // Build recommendations
    const recommendations: PageRecommendation[] = []
    
    for (const pageRow of pageData) {
      const page = pageRow.page
      const cluster = getArticleCategory(page) || 'homepage'
      
      // Skip if cluster filter applied and doesn't match
      if (clusterFilter && cluster !== clusterFilter) continue
      
      // Skip non-article pages for detailed recommendations
      if (!isArticle(page) && !isHomepage(page)) continue
      
      // Get page queries
      const pageQueries = byPage[page] || []
      const highIntentQueries = pageQueries.filter(q => isHighIntentQuery(q.query))
      
      // Get article title from Strapi
      const article = articles.find(a => {
        const url = `https://musicbizqr.com/article/${a.attributes?.category || 'uncategorized'}/${a.attributes?.slug}`
        return url === page
      })
      const title = article?.attributes?.title || page.split('/').pop() || 'Unknown'
      
      const addLinks: LinkRecommendation[] = []
      const notes: string[] = []
      
      // Determine cluster and recommend appropriate pillar links
      const clusterLower = cluster.toLowerCase()
      
      // QR articles
      if (clusterLower.includes('qr')) {
        // Link to QR pillar
        if (page !== PILLAR_TARGETS.QR_CODE_STRATEGY) {
          const qrQuery = highIntentQueries.find(q => q.query.toLowerCase().includes('qr'))
          addLinks.push({
            targetPage: PILLAR_TARGETS.QR_CODE_STRATEGY,
            anchorText: qrQuery?.query || 'QR code strategy',
            reason: 'QR articles should link to QR strategy pillar for topical authority',
            priority: 'high',
            context: 'Add in intro or first paragraph as "Learn more about [anchor]"'
          })
        }
        
        // Link to homepage for brand queries
        if (!isHomepage(page)) {
          addLinks.push({
            targetPage: PILLAR_TARGETS.HOMEPAGE,
            anchorText: 'MusicBizQR',
            reason: 'Strengthen homepage authority for brand/product queries',
            priority: 'medium',
            context: 'Add in CTA section or author bio'
          })
        }
        
        // Link to fan capture if fan context
        const hasFanContext = pageQueries.some(q => 
          q.query.toLowerCase().includes('fan') || 
          q.query.toLowerCase().includes('capture')
        )
        if (hasFanContext && page !== PILLAR_TARGETS.FAN_CAPTURE) {
          addLinks.push({
            targetPage: PILLAR_TARGETS.FAN_CAPTURE,
            anchorText: 'fan capture strategies',
            reason: 'QR codes often lead to fan capture - cross-link for conversion',
            priority: 'medium',
            context: 'Add in "Next steps" or conversion section'
          })
        }
        
        // Link to smart links for Linktree alternative context
        const hasLinkInBio = pageQueries.some(q => 
          q.query.toLowerCase().includes('link in bio') ||
          q.query.toLowerCase().includes('linktree')
        )
        if (hasLinkInBio && page !== PILLAR_TARGETS.SMART_LINKS) {
          addLinks.push({
            targetPage: PILLAR_TARGETS.SMART_LINKS,
            anchorText: 'smart links for musicians',
            reason: 'Smart links complement QR codes - natural cross-sell',
            priority: 'medium',
            context: 'Add when discussing where QR codes should lead'
          })
        }
      }
      
      // Smart links articles
      else if (clusterLower.includes('smart')) {
        // Link to Smart Links pillar
        if (page !== PILLAR_TARGETS.SMART_LINKS) {
          const smartQuery = highIntentQueries.find(q => 
            q.query.toLowerCase().includes('smart link') ||
            q.query.toLowerCase().includes('link in bio')
          )
          addLinks.push({
            targetPage: PILLAR_TARGETS.SMART_LINKS,
            anchorText: smartQuery?.query || 'smart links',
            reason: 'Smart links articles should link to pillar for authority',
            priority: 'high',
            context: 'Add early in article as reference'
          })
        }
        
        // Link to homepage
        if (!isHomepage(page)) {
          addLinks.push({
            targetPage: PILLAR_TARGETS.HOMEPAGE,
            anchorText: 'MusicBizQR',
            reason: 'Brand mention in smart links context',
            priority: 'medium',
            context: 'Add in CTA or signup section'
          })
        }
        
        // Link to Linktree alternative if relevant
        const hasLinktree = pageQueries.some(q => q.query.toLowerCase().includes('linktree'))
        if (hasLinktree) {
          // Find Linktree alternative article if exists
          const linktreeAltArticle = articles.find(a => 
            a.attributes?.title?.toLowerCase().includes('linktree')
          )
          if (linktreeAltArticle) {
            const url = `https://musicbizqr.com/article/${linktreeAltArticle.attributes?.category}/${linktreeAltArticle.attributes?.slug}`
            addLinks.push({
              targetPage: url,
              anchorText: 'Linktree alternative for musicians',
              reason: 'Direct comparison content drives conversion',
              priority: 'high',
              context: 'Add when mentioning Linktree limitations'
            })
          }
        }
        
        // Link to fan capture
        if (page !== PILLAR_TARGETS.FAN_CAPTURE) {
          addLinks.push({
            targetPage: PILLAR_TARGETS.FAN_CAPTURE,
            anchorText: 'grow your fanbase',
            reason: 'Smart links enable fan capture - cross-link for strategy',
            priority: 'medium',
            context: 'Add in "What to do next" section'
          })
        }
      }
      
      // Touring/events articles
      else if (clusterLower.includes('tour') || clusterLower.includes('event')) {
        // Link to Touring pillar
        if (page !== PILLAR_TARGETS.TOURING_EVENTS) {
          addLinks.push({
            targetPage: PILLAR_TARGETS.TOURING_EVENTS,
            anchorText: 'touring and events strategy',
            reason: 'Touring articles should link to pillar for comprehensive guide',
            priority: 'high',
            context: 'Add as reference to full touring guide'
          })
        }
        
        // Link to QR pillar (QR codes at shows)
        const hasQrContext = pageQueries.some(q => q.query.toLowerCase().includes('qr'))
        if (hasQrContext && page !== PILLAR_TARGETS.QR_CODE_STRATEGY) {
          addLinks.push({
            targetPage: PILLAR_TARGETS.QR_CODE_STRATEGY,
            anchorText: 'QR codes for live shows',
            reason: 'QR codes are essential for touring - cross-link',
            priority: 'high',
            context: 'Add when discussing QR usage at shows'
          })
        }
        
        // Link to fan capture
        if (page !== PILLAR_TARGETS.FAN_CAPTURE) {
          addLinks.push({
            targetPage: PILLAR_TARGETS.FAN_CAPTURE,
            anchorText: 'capture fans at shows',
            reason: 'Touring is prime fan capture opportunity',
            priority: 'high',
            context: 'Add in post-show engagement section'
          })
        }
        
        // Link to homepage
        if (!isHomepage(page)) {
          addLinks.push({
            targetPage: PILLAR_TARGETS.HOMEPAGE,
            anchorText: 'MusicBizQR',
            reason: 'Brand presence in touring content',
            priority: 'medium',
            context: 'Add in band story or about section'
          })
        }
      }
      
      // Music marketing articles
      else if (clusterLower.includes('marketing')) {
        // Link to all major pillars
        const pillars = [
          { target: PILLAR_TARGETS.SMART_LINKS, anchor: 'smart links', reason: 'Core marketing tool' },
          { target: PILLAR_TARGETS.QR_CODE_STRATEGY, anchor: 'QR codes', reason: 'Physical marketing essential' },
          { target: PILLAR_TARGETS.FAN_CAPTURE, anchor: 'fan capture', reason: 'Marketing goal is fan growth' },
          { target: PILLAR_TARGETS.HOMEPAGE, anchor: 'MusicBizQR', reason: 'Brand mention' }
        ]
        
        for (const pillar of pillars) {
          if (page !== pillar.target) {
            addLinks.push({
              targetPage: pillar.target,
              anchorText: pillar.anchor,
              reason: pillar.reason,
              priority: 'medium',
              context: 'Add in tools/resources section'
            })
          }
        }
      }
      
      // Homepage specific recommendations
      if (isHomepage(page)) {
        // Homepage should link OUT to pillars based on high-intent queries
        const highQr = highIntentQueries.some(q => q.query.toLowerCase().includes('qr'))
        const highSmart = highIntentQueries.some(q => q.query.toLowerCase().includes('smart'))
        const highTour = highIntentQueries.some(q => q.query.toLowerCase().includes('tour') || q.query.toLowerCase().includes('concert'))
        
        if (highQr) {
          addLinks.push({
            targetPage: PILLAR_TARGETS.QR_CODE_STRATEGY,
            anchorText: 'QR codes for musicians',
            reason: 'Homepage ranks for QR queries - link to detailed guide',
            priority: 'high',
            context: 'Add in hero section or features list'
          })
        }
        
        if (highSmart) {
          addLinks.push({
            targetPage: PILLAR_TARGETS.SMART_LINKS,
            anchorText: 'smart links',
            reason: 'Homepage ranks for smart link queries - link to pillar',
            priority: 'high',
            context: 'Add in features or how-it-works section'
          })
        }
        
        if (highTour) {
          addLinks.push({
            targetPage: PILLAR_TARGETS.TOURING_EVENTS,
            anchorText: 'touring tools',
            reason: 'Homepage ranks for touring queries - link to guide',
            priority: 'medium',
            context: 'Add in use cases section'
          })
        }
        
        notes.push('Homepage has high domain authority - internal links from homepage significantly boost target pages')
      }
      
      // Limit to 5 links per page
      const limitedLinks = addLinks.slice(0, 5)
      
      // Only include pages with recommendations
      if (limitedLinks.length > 0 || notes.length > 0) {
        recommendations.push({
          sourcePage: page,
          sourceTitle: title,
          cluster,
          currentMetrics: {
            clicks: pageRow.clicks,
            impressions: pageRow.impressions,
            position: parseFloat(pageRow.position.toFixed(1))
          },
          addLinks: limitedLinks,
          notes: notes.length > 0 ? notes : ['Add these internal links to strengthen topical authority and improve rankings']
        })
      }
    }
    
    // Sort by priority (pages with impressions first)
    recommendations.sort((a, b) => b.currentMetrics.impressions - a.currentMetrics.impressions)
    
    // Group by cluster
    const byCluster: Record<string, PageRecommendation[]> = {}
    for (const rec of recommendations) {
      if (!byCluster[rec.cluster]) {
        byCluster[rec.cluster] = []
      }
      byCluster[rec.cluster].push(rec)
    }
    
    // High priority recommendations (pages with impressions)
    const highPriority = recommendations
      .filter(r => r.currentMetrics.impressions > 0)
      .slice(0, 20)
    
    return {
      site: siteUrl,
      generatedAt: new Date().toISOString(),
      dateRange: { startDate, endDate, days },
      
      summary: {
        totalRecommendations: recommendations.length,
        pagesNeedingLinks: recommendations.length,
        totalSuggestedLinks: recommendations.reduce((s, r) => s + r.addLinks.length, 0),
        highPriorityPages: highPriority.length,
        clustersCovered: Object.keys(byCluster).length
      },
      
      strategicNotes: [
        'QR articles should link to QR pillar, homepage, and fan capture',
        'Smart links articles should link to smart links pillar, homepage, and fan capture',
        'Touring articles should link to touring pillar, QR pillar, fan capture, and homepage',
        'Music marketing articles should link to all major pillars',
        'Homepage should link to pillars based on high-intent queries it ranks for',
        'Limit 5 internal links per page to avoid dilution',
        'Prioritize pages with existing impressions for quick wins'
      ],
      
      pillarTargets: PILLAR_TARGETS,
      
      highPriorityRecommendations: highPriority,
      allRecommendations: recommendations.slice(0, 50),
      byCluster,
      
      exportMeta: {
        version: '1.0',
        tool: 'Corvana SEO',
        note: 'Internal linking is a quick-win SEO tactic - implement high priority links first'
      }
    }
    
  } catch (error: any) {
    console.error('[Corvana] Internal links report failed:', error.message)
    
    setResponseStatus(event, 500)
    return {
      error: 'Failed to generate internal link recommendations',
      message: error.message
    }
  }
})
