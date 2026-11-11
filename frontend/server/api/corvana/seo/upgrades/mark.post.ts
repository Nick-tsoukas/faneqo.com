/**
 * POST /api/corvana/seo/upgrades/mark
 * 
 * Mark a page as upgraded and record before metrics.
 * 
 * Request body:
 * {
 *   "page": "https://musicbizqr.com/...",
 *   "upgradeType": "TITLE_META_REWRITE | ARTICLE_REFRESH | INTERNAL_LINKING | PILLAR_STRENGTHENING | REDIRECT_MERGE | HOMEPAGE_SEO_UPGRADE",
 *   "notes": "What was changed",
 *   "changedFields": ["title", "metaDescription"],
 *   "date": "optional ISO date"
 * }
 */

import { defineEventHandler, readBody, setResponseStatus } from 'h3'
import { SearchConsoleClient } from '../../../../utils/searchConsoleClient'
import { getStoredRefreshToken, checkEnvVars } from '../../../../utils/corvanaGoogleOAuth'
import { checkCorvanaAuth } from '../../../../utils/corvanaAuth'
import { google } from 'googleapis'
import { addUpgrade } from '../../../../utils/upgradeTracker'
import { calculateDateRange } from '../../../../utils/seoExportUtils'

export default defineEventHandler(async (event) => {
  // Check auth
  const auth = checkCorvanaAuth(event)
  if (!auth.authorized) {
    setResponseStatus(event, auth.status || 401)
    return auth.error
  }
  
  const runtimeConfig = useRuntimeConfig()
  
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
  
  // Parse body
  const body = await readBody(event)
  const { page, upgradeType, notes, changedFields, date } = body
  
  // Validate required fields
  if (!page || !upgradeType) {
    setResponseStatus(event, 400)
    return {
      error: 'Missing required fields',
      required: ['page', 'upgradeType'],
      optional: ['notes', 'changedFields', 'date'],
      upgradeTypes: ['TITLE_META_REWRITE', 'ARTICLE_REFRESH', 'INTERNAL_LINKING', 'PILLAR_STRENGTHENING', 'REDIRECT_MERGE', 'HOMEPAGE_SEO_UPGRADE']
    }
  }
  
  const validTypes = ['TITLE_META_REWRITE', 'ARTICLE_REFRESH', 'INTERNAL_LINKING', 'PILLAR_STRENGTHENING', 'REDIRECT_MERGE', 'HOMEPAGE_SEO_UPGRADE']
  if (!validTypes.includes(upgradeType)) {
    setResponseStatus(event, 400)
    return {
      error: 'Invalid upgradeType',
      validTypes
    }
  }
  
  try {
    // Create authenticated client
    const oauth2Client = new google.auth.OAuth2(
      runtimeConfig.corvanaGoogleClientId,
      runtimeConfig.corvanaGoogleClientSecret,
      runtimeConfig.corvanaGoogleRedirectUri
    )
    oauth2Client.setCredentials({ refresh_token: refreshToken })
    
    const client = new SearchConsoleClient(oauth2Client)
    
    // Get before metrics (last 28 days)
    const { startDate, endDate } = calculateDateRange(28)
    const siteUrl = runtimeConfig.corvanaGscSiteUrl!
    
    // Fetch page-specific data
    const pageData = await client.getPageData(siteUrl, page, 28)
    const metrics = {
      clicks: pageData.reduce((s, r) => s + r.clicks, 0),
      impressions: pageData.reduce((s, r) => s + r.impressions, 0),
      ctr: pageData.length > 0 ? pageData.reduce((s, r) => s + r.ctr, 0) / pageData.length : 0,
      position: pageData.length > 0 ? pageData.reduce((s, r) => s + r.position, 0) / pageData.length : 0,
      days: 28,
      dateRange: { startDate, endDate }
    }
    
    // Record the upgrade
    const upgradeDate = date || new Date().toISOString()
    const record = await addUpgrade(
      page,
      upgradeType,
      notes || '',
      changedFields || [],
      metrics
    )
    
    // Override date if provided
    if (date) {
      record.upgradeDate = upgradeDate
    }
    
    return {
      success: true,
      message: 'Upgrade recorded successfully',
      record,
      reminder: `Re-check this page after 28 days using GET /api/corvana/seo/upgrades/report to see results`,
      nextSteps: [
        'Monitor rankings weekly',
        'After 28 days, run the upgrades report to see before/after comparison',
        'Document learnings for future upgrades'
      ]
    }
    
  } catch (error: any) {
    console.error('[Corvana] Mark upgrade failed:', error.message)
    
    setResponseStatus(event, 500)
    return {
      error: 'Failed to mark upgrade',
      message: error.message
    }
  }
})
