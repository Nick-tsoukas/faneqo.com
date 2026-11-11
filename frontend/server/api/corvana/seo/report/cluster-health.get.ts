/**
 * GET /api/corvana/seo/report/cluster-health?days=28
 * 
 * Shows how each SEO cluster (category) is performing.
 * Combines Search Console page-level data with article inventory.
 * 
 * Query params:
 * - days: 28 (default) or 90
 */

import { defineEventHandler, getQuery, setResponseStatus } from 'h3'
import { SearchConsoleClient } from '../../../../utils/searchConsoleClient'
import { getStoredRefreshToken, checkEnvVars } from '../../../../utils/corvanaGoogleOAuth'
import { checkCorvanaAuth } from '../../../../utils/corvanaAuth'
import { google } from 'googleapis'
import {
  calculateDateRange,
  aggregateMetrics,
  isHighIntentQuery
} from '../../../../utils/seoExportUtils'

interface ClusterData {
  cluster: string
  category: string
  articleCount: number
  articles: Array<{
    id: number
    title: string
    url: string
    ageDays: number
    isPillar: boolean
    wordCount: number
  }>
  clicks: number
  impressions: number
  avgCtr: number
  avgPosition: number
  articlesWithImpressions: number
  articlesWithClicks: number
  oldArticlesOver90Days: number
  easyWinCount: number
  weakPageCount: number
  cannibalizationRiskCount: number
  topPages: Array<{
    page: string
    clicks: number
    impressions: number
    position: number
  }>
  topQueries: Array<{
    query: string
    clicks: number
    impressions: number
    position: number
    isHighIntent: boolean
  }>
  recommendedFocus: string
  healthScore: number
}

// Cluster display names
const CLUSTER_NAMES: Record<string, string> = {
  'smart-links': 'Smart Links',
  'qr-code-strategy': 'QR Code Strategy',
  'music-marketing': 'Music Marketing',
  'touring-events': 'Touring & Events',
  'merch-growth': 'Merch Growth',
  'fan-capture': 'Fan Capture',
  'uncategorized': 'Uncategorized',
  'unknown': 'Unknown'
}

// Map clusters to URL patterns
const CLUSTER_URL_PATTERNS: Record<string, string[]> = {
  'smart-links': ['/article/smart-links/'],
  'qr-code-strategy': ['/article/qr-code-strategy/', '/article/qr-'],
  'music-marketing': ['/article/music-marketing/'],
  'touring-events': ['/article/touring-events/', '/article/touring/'],
  'merch-growth': ['/article/merch-growth/', '/article/merch/'],
  'fan-capture': ['/article/fan-capture/'],
  'uncategorized': ['/article/uncategorized/'],
  'unknown': []
}

export default defineEventHandler(async (event) => {
  // Check auth
  const auth = checkCorvanaAuth(event)
  if (!auth.authorized) {
    setResponseStatus(event, auth.status || 401)
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
    
    // Fetch Search Console data in parallel
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
    
    // Group articles by cluster
    const articlesByCluster: Record<string, any[]> = {}
    for (const article of articles) {
      const category = (article.attributes?.category || 'uncategorized').toLowerCase().trim()
      const cluster = category // Simplified - use category as cluster
      
      if (!articlesByCluster[cluster]) {
        articlesByCluster[cluster] = []
      }
      articlesByCluster[cluster].push(article)
    }
    
    // Group Search Console data by cluster based on URL patterns
    const scDataByCluster: Record<string, typeof pageData> = {}
    
    for (const row of pageData) {
      const page = row.page
      let assignedCluster = 'homepage'
      
      // Check URL patterns
      for (const [cluster, patterns] of Object.entries(CLUSTER_URL_PATTERNS)) {
        if (patterns.some(p => page.includes(p))) {
          assignedCluster = cluster
          break
        }
      }
      
      // If no pattern matched and it's not homepage, mark as unknown
      if (assignedCluster === 'homepage' && page !== 'https://musicbizqr.com/' && page !== 'https://musicbizqr.com') {
        assignedCluster = 'unknown'
      }
      
      if (!scDataByCluster[assignedCluster]) {
        scDataByCluster[assignedCluster] = []
      }
      scDataByCluster[assignedCluster].push(row)
    }
    
    // Build cluster health data
    const allClusters = new Set([
      ...Object.keys(articlesByCluster),
      ...Object.keys(scDataByCluster),
      'homepage'
    ])
    
    const clusterData: ClusterData[] = []
    
    for (const cluster of allClusters) {
      const clusterArticles = articlesByCluster[cluster] || []
      const clusterScData = scDataByCluster[cluster] || []
      const clusterMetrics = aggregateMetrics(clusterScData)
      
      // Count articles with impressions/clicks
      const articlesWithImpressions = clusterArticles.filter(a => {
        const url = `https://musicbizqr.com/article/${a.attributes?.category || 'uncategorized'}/${a.attributes?.slug}`
        return clusterScData.some(r => r.page === url && r.impressions > 0)
      }).length
      
      const articlesWithClicks = clusterArticles.filter(a => {
        const url = `https://musicbizqr.com/article/${a.attributes?.category || 'uncategorized'}/${a.attributes?.slug}`
        return clusterScData.some(r => r.page === url && r.clicks > 0)
      }).length
      
      // Count old articles
      const oldArticles = clusterArticles.filter(a => {
        const publishedAt = a.attributes?.publishedAt || a.attributes?.createdAt
        if (!publishedAt) return false
        const ageDays = Math.floor((Date.now() - new Date(publishedAt).getTime()) / (1000 * 60 * 60 * 24))
        return ageDays > 90
      }).length
      
      // Count easy wins (position 5-25 with impressions)
      const easyWins = clusterScData.filter(r => 
        r.position >= 5 && r.position <= 25 && r.impressions > 0
      ).length
      
      // Count weak pages (position > 50 with impressions)
      const weakPages = clusterScData.filter(r => 
        r.position > 50 && r.impressions > 5
      ).length
      
      // Estimate cannibalization risk (simplified)
      const pageQueryForCluster = pageQueryData.filter(r => {
        for (const [c, patterns] of Object.entries(CLUSTER_URL_PATTERNS)) {
          if (c === cluster && patterns.some(p => r.page.includes(p))) {
            return true
          }
        }
        return cluster === 'homepage' && (r.page === 'https://musicbizqr.com/' || r.page === 'https://musicbizqr.com')
      })
      
      const queryGroups: Record<string, number> = {}
      for (const row of pageQueryForCluster) {
        queryGroups[row.query] = (queryGroups[row.query] || 0) + 1
      }
      const cannibalizationRisk = Object.values(queryGroups).filter(c => c > 1).length
      
      // Determine recommended focus
      let recommendedFocus = ''
      if (clusterMetrics.totalImpressions > 0 && clusterMetrics.avgPosition > 30) {
        recommendedFocus = 'UPGRADE_CLUSTER: High impressions but weak average position - prioritize article refreshes and internal linking'
      } else if (oldArticles > clusterArticles.length * 0.5) {
        recommendedFocus = 'REFRESH_OLD_CONTENT: Many articles over 90 days old - needs content refresh and internal linking'
      } else if (clusterMetrics.totalImpressions === 0 && clusterArticles.length > 0) {
        recommendedFocus = 'REVIEW_KEYWORD_TARGETING: Low/no impressions - verify keyword targeting and content quality'
      } else if (easyWins > 0) {
        recommendedFocus = 'CAPTURE_EASY_WINS: Articles on page 2 need push to page 1 with title/meta optimization'
      } else {
        recommendedFocus = 'MONITOR_AND_MAINTAIN: Cluster performing steadily - continue monitoring'
      }
      
      // Calculate health score (0-100)
      let healthScore = 50
      if (clusterMetrics.avgPosition < 20) healthScore += 20
      if (clusterMetrics.avgPosition < 10) healthScore += 15
      if (clusterMetrics.totalClicks > 0) healthScore += 10
      if (easyWins > 0) healthScore += 5
      if (oldArticles > clusterArticles.length * 0.7) healthScore -= 20
      if (clusterMetrics.avgPosition > 50) healthScore -= 15
      healthScore = Math.max(0, Math.min(100, healthScore))
      
      // Get top pages
      const topPages = clusterScData
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 5)
        .map(r => ({
          page: r.page,
          clicks: r.clicks,
          impressions: r.impressions,
          position: parseFloat(r.position.toFixed(1))
        }))
      
      // Get top queries for cluster
      const clusterQueries = pageQueryForCluster
      const queryMetrics: Record<string, { clicks: number; impressions: number; position: number }> = {}
      
      for (const row of clusterQueries) {
        if (!queryMetrics[row.query]) {
          queryMetrics[row.query] = { clicks: 0, impressions: 0, position: 0 }
        }
        queryMetrics[row.query].clicks += row.clicks
        queryMetrics[row.query].impressions += row.impressions
        // Average position
        const current = queryMetrics[row.query]
        current.position = (current.position + row.position) / 2
      }
      
      const topQueries = Object.entries(queryMetrics)
        .map(([query, metrics]) => ({
          query,
          clicks: metrics.clicks,
          impressions: metrics.impressions,
          position: parseFloat(metrics.position.toFixed(1)),
          isHighIntent: isHighIntentQuery(query)
        }))
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 10)
      
      clusterData.push({
        cluster,
        category: cluster,
        articleCount: clusterArticles.length,
        articles: clusterArticles.slice(0, 10).map(a => ({
          id: a.id,
          title: a.attributes?.title || '',
          url: `https://musicbizqr.com/article/${a.attributes?.category || 'uncategorized'}/${a.attributes?.slug}`,
          ageDays: Math.floor((Date.now() - new Date(a.attributes?.publishedAt || a.attributes?.createdAt || Date.now()).getTime()) / (1000 * 60 * 60 * 24)),
          isPillar: a.attributes?.isPillar || false,
          wordCount: 0 // TODO: calculate if content field available
        })),
        clicks: clusterMetrics.totalClicks,
        impressions: clusterMetrics.totalImpressions,
        avgCtr: parseFloat(clusterMetrics.avgCtr.toFixed(2)),
        avgPosition: parseFloat(clusterMetrics.avgPosition.toFixed(1)),
        articlesWithImpressions,
        articlesWithClicks,
        oldArticlesOver90Days: oldArticles,
        easyWinCount: easyWins,
        weakPageCount: weakPages,
        cannibalizationRiskCount: cannibalizationRisk,
        topPages,
        topQueries,
        recommendedFocus,
        healthScore
      })
    }
    
    // Sort by health score
    clusterData.sort((a, b) => b.healthScore - a.healthScore)
    
    // Calculate overall totals
    const totalClicks = clusterData.reduce((s, c) => s + c.clicks, 0)
    const totalImpressions = clusterData.reduce((s, c) => s + c.impressions, 0)
    const totalArticles = clusterData.reduce((s, c) => s + c.articleCount, 0)
    
    const bestCluster = clusterData.length > 0 ? clusterData[0].cluster : ''
    const weakestCluster = clusterData.length > 0 ? clusterData[clusterData.length - 1].cluster : ''
    
    return {
      site: siteUrl,
      generatedAt: new Date().toISOString(),
      dateRange: { startDate, endDate, days },
      
      summary: {
        days,
        totalArticles,
        totalClicks,
        totalImpressions,
        bestCluster,
        weakestCluster,
        totalClusters: clusterData.length
      },
      
      clusters: clusterData,
      
      priorityActions: clusterData
        .filter(c => c.easyWinCount > 0 || c.weakPageCount > 0)
        .slice(0, 3)
        .map(c => ({
          cluster: c.cluster,
          action: c.easyWinCount > 0 
            ? `Capture ${c.easyWinCount} easy wins in ${c.cluster}`
            : `Fix ${c.weakPageCount} weak pages in ${c.cluster}`,
          reason: c.recommendedFocus
        })),
      
      exportMeta: {
        version: '1.0',
        tool: 'Corvana SEO',
        note: 'Health scores are estimates based on position, clicks, and content age'
      }
    }
    
  } catch (error: any) {
    console.error('[Corvana] Cluster health report failed:', error.message)
    
    setResponseStatus(event, 500)
    return {
      error: 'Failed to generate cluster health report',
      message: error.message
    }
  }
})
