/**
 * GET /api/corvana/search-console/test
 * 
 * Tests the Google Search Console API connection by pulling
 * the last 28 days of search analytics data.
 */

import { defineEventHandler, setResponseStatus } from 'h3'
import { SearchConsoleClient } from '../../../utils/searchConsoleClient'
import { 
  getStoredRefreshToken, 
  checkEnvVars,
  createOAuth2Client 
} from '../../../utils/corvanaGoogleOAuth'
import { google } from 'googleapis'

export default defineEventHandler(async (event) => {
  const runtimeConfig = useRuntimeConfig()
  
  // Check environment variables
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
      missing: envCheck.missing,
      help: 'Set these in your .env file: ' + envCheck.missing.join(', ')
    }
  }
  
  // Check for stored refresh token
  const refreshToken = await getStoredRefreshToken()
  
  if (!refreshToken) {
    setResponseStatus(event, 401)
    return {
      error: 'Not authenticated',
      message: 'No refresh token found. Please visit /api/corvana/google/connect to authenticate.',
      connectUrl: '/api/corvana/google/connect'
    }
  }
  
  try {
    // Create OAuth2 client with refresh token
    const oauth2Client = new google.auth.OAuth2(
      runtimeConfig.corvanaGoogleClientId,
      runtimeConfig.corvanaGoogleClientSecret,
      runtimeConfig.corvanaGoogleRedirectUri
    )
    
    oauth2Client.setCredentials({ refresh_token: refreshToken })
    
    // Create Search Console client
    const searchConsoleClient = new SearchConsoleClient(oauth2Client)
    
    // Calculate date range: last 28 days, ending 3 days ago
    const endDate = new Date()
    endDate.setDate(endDate.getDate() - 3) // 3 days ago to avoid data delays
    
    const startDate = new Date(endDate)
    startDate.setDate(startDate.getDate() - 28) // 28 days before end date
    
    const startDateStr = formatDate(startDate)
    const endDateStr = formatDate(endDate)
    
    // Query Search Console data
    const data = await searchConsoleClient.getLast28Days(
      runtimeConfig.corvanaGscSiteUrl!,
      ['page', 'query'],
      100
    )
    
    // Calculate summary stats
    const totalClicks = data.reduce((sum, row) => sum + row.clicks, 0)
    const totalImpressions = data.reduce((sum, row) => sum + row.impressions, 0)
    const avgCtr = data.length > 0 
      ? (totalClicks / totalImpressions * 100).toFixed(2)
      : '0.00'
    const avgPosition = data.length > 0
      ? (data.reduce((sum, row) => sum + row.position, 0) / data.length).toFixed(1)
      : '0.0'
    
    return {
      status: 'success',
      message: 'Google Search Console API connection successful',
      config: {
        siteUrl: runtimeConfig.corvanaGscSiteUrl,
        dateRange: {
          startDate: startDateStr,
          endDate: endDateStr,
          days: 28
        }
      },
      summary: {
        totalRows: data.length,
        totalClicks,
        totalImpressions,
        avgCtr: `${avgCtr}%`,
        avgPosition: parseFloat(avgPosition)
      },
      // Return top 20 rows for preview
      data: data.slice(0, 20).map(row => ({
        page: row.page,
        query: row.query,
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: parseFloat((row.ctr * 100).toFixed(2)),
        position: parseFloat(row.position.toFixed(1))
      })),
      fullDataAvailable: data.length,
      endpoints: {
        topPages: '/api/corvana/search-console/pages',
        topQueries: '/api/corvana/search-console/queries',
        pageDetails: '/api/corvana/search-console/page?url=<page-url>'
      }
    }
    
  } catch (error: any) {
    console.error('[Corvana] Search Console test failed:', error.message)
    
    // Handle specific error types
    if (error.message?.includes('No refresh token')) {
      setResponseStatus(event, 401)
      return {
        error: 'Authentication required',
        message: error.message,
        connectUrl: '/api/corvana/google/connect'
      }
    }
    
    if (error.message?.includes('invalid_grant') || error.message?.includes('token')) {
      setResponseStatus(event, 401)
      return {
        error: 'Token expired or invalid',
        message: 'Your authentication has expired. Please reconnect.',
        connectUrl: '/api/corvana/google/connect',
        details: error.message
      }
    }
    
    if (error.message?.includes('Permission denied') || error.code === 403) {
      setResponseStatus(event, 403)
      return {
        error: 'Permission denied',
        message: error.message,
        help: 'Ensure your Google account has access to this Search Console property. Go to Google Search Console and add your email as a user.'
      }
    }
    
    if (error.message?.includes('not found') || error.code === 400) {
      setResponseStatus(event, 400)
      return {
        error: 'Site not found',
        message: error.message,
        help: `Verify CORVANA_GSC_SITE_URL is correct. Current value: ${runtimeConfig.corvanaGscSiteUrl}. Use format: sc-domain:example.com or https://example.com/`
      }
    }
    
    // Generic error
    setResponseStatus(event, 500)
    return {
      error: 'Search Console API error',
      message: error.message,
      help: 'Check server logs for details'
    }
  }
})

/**
 * Format date as YYYY-MM-DD
 */
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}
