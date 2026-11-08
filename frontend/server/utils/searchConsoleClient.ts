/**
 * Google Search Console API Client
 * 
 * Handles Search Console data queries using authenticated OAuth2 client.
 * Provides methods for SEO analysis reports.
 */

import { google, webmasters_v3 } from 'googleapis'

// Search Console API response row type
export interface SearchAnalyticsRow {
  keys: string[]      // [page, query] or other dimensions
  clicks: number
  impressions: number
  ctr: number
  position: number
}

// Formatted row with named fields
export interface FormattedSearchRow {
  page: string
  query: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

// Query parameters for Search Console
export interface SearchConsoleQueryParams {
  siteUrl: string
  startDate: string    // YYYY-MM-DD
  endDate: string      // YYYY-MM-DD
  dimensions?: string[] // ['page', 'query'] or single dimension
  rowLimit?: number
  startRow?: number
}

/**
 * Search Console API Client wrapper
 */
export class SearchConsoleClient {
  private searchconsole: webmasters_v3.Webmasters
  
  constructor(auth: any) {
    this.searchconsole = google.webmasters({
      version: 'v3',
      auth
    })
  }
  
  /**
   * Query Search Analytics data
   */
  async querySearchAnalytics(params: SearchConsoleQueryParams): Promise<FormattedSearchRow[]> {
    const requestBody = {
      startDate: params.startDate,
      endDate: params.endDate,
      dimensions: params.dimensions || ['page', 'query'],
      rowLimit: params.rowLimit || 100,
      startRow: params.startRow || 0,
      aggregationType: 'auto' as const
    }
    
    try {
      const response = await this.searchconsole.searchanalytics.query({
        siteUrl: params.siteUrl,
        requestBody
      })
      
      const rows = response.data.rows || []
      
      return rows.map((row: any) => ({
        page: row.keys?.[0] || '',
        query: row.keys?.[1] || '',
        clicks: row.clicks || 0,
        impressions: row.impressions || 0,
        ctr: row.ctr || 0,
        position: row.position || 0
      }))
    } catch (error: any) {
      if (error.code === 403) {
        throw new Error(
          `Permission denied for Search Console property ${params.siteUrl}. ` +
          `Ensure the authenticated Google account has access to this property in Google Search Console.`
        )
      }
      if (error.code === 400 && error.message?.includes('not found')) {
        throw new Error(
          `Search Console property ${params.siteUrl} not found. ` +
          `Verify the site URL in CORVANA_GSC_SITE_URL env variable.`
        )
      }
      throw error
    }
  }
  
  /**
   * Get last 28 days of data (ending 3 days ago to avoid data delays)
   */
  async getLast28Days(
    siteUrl: string,
    dimensions: string[] = ['page', 'query'],
    rowLimit: number = 100
  ): Promise<FormattedSearchRow[]> {
    const endDate = new Date()
    endDate.setDate(endDate.getDate() - 3) // 3 days ago
    
    const startDate = new Date(endDate)
    startDate.setDate(startDate.getDate() - 28) // 28 days before end date
    
    return this.querySearchAnalytics({
      siteUrl,
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
      dimensions,
      rowLimit
    })
  }
  
  /**
   * Get data for a specific date range
   */
  async getDateRange(
    siteUrl: string,
    startDate: string,
    endDate: string,
    dimensions: string[] = ['page', 'query'],
    rowLimit: number = 100
  ): Promise<FormattedSearchRow[]> {
    return this.querySearchAnalytics({
      siteUrl,
      startDate,
      endDate,
      dimensions,
      rowLimit
    })
  }
  
  /**
   * Get top pages by clicks
   */
  async getTopPages(
    siteUrl: string,
    days: number = 28,
    limit: number = 50
  ): Promise<Array<{ page: string; clicks: number; impressions: number; avgPosition: number }>> {
    const endDate = new Date()
    endDate.setDate(endDate.getDate() - 3)
    
    const startDate = new Date(endDate)
    startDate.setDate(startDate.getDate() - days)
    
    const rows = await this.querySearchAnalytics({
      siteUrl,
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
      dimensions: ['page'],
      rowLimit: limit
    })
    
    return rows.map(row => ({
      page: row.page,
      clicks: row.clicks,
      impressions: row.impressions,
      avgPosition: parseFloat(row.position.toFixed(1))
    }))
  }
  
  /**
   * Get top queries by clicks
   */
  async getTopQueries(
    siteUrl: string,
    days: number = 28,
    limit: number = 50
  ): Promise<Array<{ query: string; clicks: number; impressions: number; avgPosition: number }>> {
    const endDate = new Date()
    endDate.setDate(endDate.getDate() - 3)
    
    const startDate = new Date(endDate)
    startDate.setDate(startDate.getDate() - days)
    
    const rows = await this.querySearchAnalytics({
      siteUrl,
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
      dimensions: ['query'],
      rowLimit: limit
    })
    
    return rows.map(row => ({
      query: row.query,
      clicks: row.clicks,
      impressions: row.impressions,
      avgPosition: parseFloat(row.position.toFixed(1))
    }))
  }
  
  /**
   * Get data for a specific page (useful for cannibalization analysis)
   */
  async getPageData(
    siteUrl: string,
    pageUrl: string,
    days: number = 28
  ): Promise<FormattedSearchRow[]> {
    const endDate = new Date()
    endDate.setDate(endDate.getDate() - 3)
    
    const startDate = new Date(endDate)
    startDate.setDate(startDate.getDate() - days)
    
    const requestBody = {
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
      dimensions: ['query'],
      dimensionFilterGroups: [{
        filters: [{
          dimension: 'page',
          operator: 'equals',
          expression: pageUrl
        }]
      }],
      rowLimit: 100
    }
    
    try {
      const response = await this.searchconsole.searchanalytics.query({
        siteUrl,
        requestBody
      })
      
      const rows = response.data.rows || []
      
      return rows.map((row: any) => ({
        page: pageUrl,
        query: row.keys?.[0] || '',
        clicks: row.clicks || 0,
        impressions: row.impressions || 0,
        ctr: row.ctr || 0,
        position: row.position || 0
      }))
    } catch (error: any) {
      throw new Error(`Failed to get page data: ${error.message}`)
    }
  }
}

/**
 * Format date as YYYY-MM-DD
 */
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

/**
 * Create Search Console client with authenticated OAuth2 client
 */
export async function createSearchConsoleClient(
  clientId: string,
  clientSecret: string,
  redirectUri: string,
  getRefreshToken: () => Promise<string | null>
): Promise<SearchConsoleClient> {
  const { google } = await import('googleapis')
  
  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri)
  
  const refreshToken = await getRefreshToken()
  
  if (!refreshToken) {
    throw new Error('No refresh token available. Authenticate at /api/corvana/google/connect')
  }
  
  oauth2Client.setCredentials({ refresh_token: refreshToken })
  
  return new SearchConsoleClient(oauth2Client)
}
