/**
 * GET /api/corvana/seo/upgrades/report
 * 
 * Shows before/after status for all upgrades.
 * Compares beforeMetrics to current Search Console data.
 * 
 * Query params:
 * - days: 28 (default) - days since upgrade to compare
 */

import { defineEventHandler, getQuery, setResponseStatus } from 'h3'
import { SearchConsoleClient } from '../../../../utils/searchConsoleClient'
import { getStoredRefreshToken, checkEnvVars } from '../../../../utils/corvanaGoogleOAuth'
import { checkCorvanaAuth } from '../../../../utils/corvanaAuth'
import { google } from 'googleapis'
import { getAllUpgrades, updateUpgradeWithResults } from '../../../../utils/upgradeTracker'
import { calculateDateRange } from '../../../../utils/seoExportUtils'

interface UpgradeReport {
  id: string
  page: string
  upgradeType: string
  upgradeDate: string
  notes: string
  changedFields: string[]
  beforeMetrics: {
    clicks: number
    impressions: number
    ctr: number
    position: number
    dateRange: {
      startDate: string
      endDate: string
    }
  }
  currentMetrics: {
    clicks: number
    impressions: number
    ctr: number
    position: number
    dateRange: {
      startDate: string
      endDate: string
    }
  }
  delta: {
    clicksChange: number
    impressionsChange: number
    positionChange: number
    ctrChange: number
    percentChange: number
  }
  daysSinceUpgrade: number
  assessment: string
  status: 'SUCCESS' | 'MODERATE_SUCCESS' | 'NEUTRAL' | 'NEEDS_REVIEW' | 'TOO_EARLY' | 'PENDING'
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
  
  const days = Math.min(parseInt(query.days as string) || 28, 90)
  
  try {
    // Create authenticated client
    const oauth2Client = new google.auth.OAuth2(
      runtimeConfig.corvanaGoogleClientId,
      runtimeConfig.corvanaGoogleClientSecret,
      runtimeConfig.corvanaGoogleRedirectUri
    )
    oauth2Client.setCredentials({ refresh_token: refreshToken })
    
    const client = new SearchConsoleClient(oauth2Client)
    
    // Get current date range
    const { startDate, endDate } = calculateDateRange(days)
    const siteUrl = runtimeConfig.corvanaGscSiteUrl!
    
    // Get all upgrades
    const upgrades = await getAllUpgrades()
    
    if (upgrades.length === 0) {
      return {
        message: 'No upgrades recorded yet',
        nextStep: 'Mark an upgrade using POST /api/corvana/seo/upgrades/mark',
        example: {
          page: 'https://musicbizqr.com/article/qr-code-strategy/example',
          upgradeType: 'TITLE_META_REWRITE',
          notes: 'Rewrote title and meta description',
          changedFields: ['title', 'metaDescription']
        }
      }
    }
    
    // Build report for each upgrade
    const reports: UpgradeReport[] = []
    
    for (const upgrade of upgrades) {
      // Calculate days since upgrade
      const upgradeDate = new Date(upgrade.upgradeDate)
      const now = new Date()
      const daysSinceUpgrade = Math.floor((now.getTime() - upgradeDate.getTime()) / (1000 * 60 * 60 * 24))
      
      // Get current metrics for this page
      let currentMetrics = upgrade.afterMetrics
      
      // If no after metrics stored yet, or if we want fresh data
      if (!currentMetrics || daysSinceUpgrade >= 14) {
        try {
          const pageData = await client.getPageData(siteUrl, upgrade.page, days)
          currentMetrics = {
            clicks: pageData.reduce((s, r) => s + r.clicks, 0),
            impressions: pageData.reduce((s, r) => s + r.impressions, 0),
            ctr: pageData.length > 0 ? pageData.reduce((s, r) => s + r.ctr, 0) / pageData.length : 0,
            position: pageData.length > 0 ? pageData.reduce((s, r) => s + r.position, 0) / pageData.length : 0,
            days,
            dateRange: { startDate, endDate }
          }
          
          // Update stored record
          await updateUpgradeWithResults(upgrade.id, currentMetrics)
        } catch (err) {
          console.warn(`[Corvana] Could not fetch current metrics for ${upgrade.page}:`, err)
        }
      }
      
      // Calculate delta
      const before = upgrade.beforeMetrics
      const after = currentMetrics || before // Fallback if no current data
      
      const delta = {
        clicksChange: after.clicks - before.clicks,
        impressionsChange: after.impressions - before.impressions,
        positionChange: parseFloat((before.position - after.position).toFixed(1)), // Lower is better
        ctrChange: parseFloat(((after.ctr - before.ctr) * 100).toFixed(2)),
        percentChange: before.clicks > 0 
          ? parseFloat((((after.clicks - before.clicks) / before.clicks) * 100).toFixed(1))
          : (after.clicks > 0 ? 100 : 0)
      }
      
      // Determine status and assessment
      let status: UpgradeReport['status']
      let assessment: string
      
      if (daysSinceUpgrade < 14) {
        status = 'TOO_EARLY'
        assessment = 'TOO_EARLY: Wait at least 14 days for Google to process changes'
      } else if (daysSinceUpgrade < 28) {
        if (delta.percentChange >= 20) {
          status = 'SUCCESS'
          assessment = 'EARLY_POSITIVE: Strong early signs, continue monitoring for 28+ days'
        } else if (delta.positionChange > 2) {
          status = 'SUCCESS'
          assessment = 'EARLY_IMPROVING: Position improving significantly, clicks should follow'
        } else if (delta.percentChange === 0 && delta.positionChange === 0) {
          status = 'NEUTRAL'
          assessment = 'EARLY_NEUTRAL: No change yet, give it more time'
        } else {
          status = 'NEEDS_REVIEW'
          assessment = 'EARLY_NEGATIVE: Negative trend, consider reviewing implementation'
        }
      } else {
        if (delta.percentChange >= 50) {
          status = 'SUCCESS'
          assessment = 'SUCCESS: Significant improvement, document learnings and replicate'
        } else if (delta.percentChange > 0) {
          status = 'MODERATE_SUCCESS'
          assessment = 'MODERATE_SUCCESS: Improvement observed, consider further optimization'
        } else if (delta.percentChange === 0) {
          status = 'NEUTRAL'
          assessment = 'NEUTRAL: No change after 28 days, review if changes were sufficient'
        } else {
          status = 'NEEDS_REVIEW'
          assessment = 'NEEDS_REVIEW: Negative trend after 28 days, consider different approach'
        }
      }
      
      reports.push({
        id: upgrade.id,
        page: upgrade.page,
        upgradeType: upgrade.upgradeType,
        upgradeDate: upgrade.upgradeDate,
        notes: upgrade.notes,
        changedFields: upgrade.changedFields,
        beforeMetrics: {
          clicks: before.clicks,
          impressions: before.impressions,
          ctr: parseFloat((before.ctr * 100).toFixed(2)),
          position: parseFloat(before.position.toFixed(1)),
          dateRange: before.dateRange
        },
        currentMetrics: {
          clicks: after.clicks,
          impressions: after.impressions,
          ctr: parseFloat((after.ctr * 100).toFixed(2)),
          position: parseFloat(after.position.toFixed(1)),
          dateRange: { startDate, endDate }
        },
        delta,
        daysSinceUpgrade,
        assessment,
        status
      })
    }
    
    // Sort by status priority
    const statusOrder = { SUCCESS: 0, MODERATE_SUCCESS: 1, TOO_EARLY: 2, NEUTRAL: 3, NEEDS_REVIEW: 4, PENDING: 5 }
    reports.sort((a, b) => statusOrder[a.status] - statusOrder[b.status])
    
    // Calculate summary
    const summary = {
      totalUpgrades: reports.length,
      success: reports.filter(r => r.status === 'SUCCESS').length,
      moderateSuccess: reports.filter(r => r.status === 'MODERATE_SUCCESS').length,
      neutral: reports.filter(r => r.status === 'NEUTRAL').length,
      needsReview: reports.filter(r => r.status === 'NEEDS_REVIEW').length,
      tooEarly: reports.filter(r => r.status === 'TOO_EARLY').length,
      avgPercentChange: reports.length > 0 
        ? parseFloat((reports.reduce((s, r) => s + r.delta.percentChange, 0) / reports.length).toFixed(1))
        : 0
    }
    
    return {
      summary,
      reports,
      generatedAt: new Date().toISOString(),
      
      insights: {
        topPerformers: reports.filter(r => r.status === 'SUCCESS').slice(0, 5),
        needAttention: reports.filter(r => r.status === 'NEEDS_REVIEW').slice(0, 5),
        waitingForData: reports.filter(r => r.status === 'TOO_EARLY').slice(0, 5)
      },
      
      recommendations: [
        'SUCCESS upgrades: Document what worked and replicate on similar pages',
        'MODERATE_SUCCESS: Small tweaks may push these into full success',
        'NEUTRAL: Consider stronger changes or different keyword targeting',
        'NEEDS_REVIEW: Revert or try different approach',
        'TOO_EARLY: Be patient, check again in 2-4 weeks'
      ]
    }
    
  } catch (error: any) {
    console.error('[Corvana] Upgrade report failed:', error.message)
    
    setResponseStatus(event, 500)
    return {
      error: 'Failed to generate upgrade report',
      message: error.message
    }
  }
})
