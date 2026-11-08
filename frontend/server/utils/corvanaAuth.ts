/**
 * Corvana Admin Authentication
 * 
 * Production safety: Protects Corvana SEO endpoints in production.
 * 
 * Behavior:
 * - Development: Always allow
 * - Production: Require CORVANA_ADMIN_TOKEN
 * 
 * Pass token via:
 * - Header: x-corvana-admin-token
 * - Query param: token
 */

import { defineEventHandler, getHeader, getQuery, setResponseStatus, H3Event } from 'h3'

/**
 * Check if request is authorized for Corvana admin access
 */
export function isCorvanaAuthorized(event: H3Event): boolean {
  // Always allow in development
  if (process.env.NODE_ENV !== 'production') {
    return true
  }
  
  const runtimeConfig = useRuntimeConfig()
  const adminToken = runtimeConfig.corvanaAdminToken || process.env.CORVANA_ADMIN_TOKEN
  
  // If no admin token configured, allow (for initial setup)
  if (!adminToken) {
    console.warn('[Corvana] No CORVANA_ADMIN_TOKEN set in production - allowing access')
    return true
  }
  
  // Get token from header or query
  const headerToken = getHeader(event, 'x-corvana-admin-token')
  const queryToken = getQuery(event).token as string | undefined
  const providedToken = headerToken || queryToken
  
  if (!providedToken) {
    return false
  }
  
  return providedToken === adminToken
}

/**
 * Middleware/event handler wrapper for Corvana auth
 */
export function requireCorvanaAuth(handler: (event: H3Event) => Promise<any>) {
  return defineEventHandler(async (event: H3Event) => {
    if (!isCorvanaAuthorized(event)) {
      setResponseStatus(event, 401)
      return {
        error: 'Unauthorized',
        message: 'Valid admin token required',
        help: 'Provide token via x-corvana-admin-token header or ?token= query param',
        note: 'Set CORVANA_ADMIN_TOKEN in environment variables'
      }
    }
    
    return handler(event)
  })
}

/**
 * Simple auth check for use within handlers
 * Returns 401 response object if not authorized
 */
export function checkCorvanaAuth(event: H3Event): { authorized: boolean; error?: any } {
  if (!isCorvanaAuthorized(event)) {
    return {
      authorized: false,
      error: {
        error: 'Unauthorized',
        message: 'Valid admin token required',
        help: 'Provide token via x-corvana-admin-token header or ?token= query param'
      }
    }
  }
  
  return { authorized: true }
}
