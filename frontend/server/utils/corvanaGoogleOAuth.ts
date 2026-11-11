/**
 * Corvana Google OAuth2 Helper
 * 
 * Handles OAuth2 authentication with Google for Search Console API access.
 * Uses refresh token pattern for long-lived access.
 * 
 * Security:
 * - All credentials are server-side only
 * - Refresh token stored securely (database or encrypted storage)
 * - Never expose secrets to client
 */

import { google } from 'googleapis'

// Storage interface for refresh token
// TODO: Replace with database storage when ready
interface TokenStorage {
  getRefreshToken(): Promise<string | null>
  setRefreshToken(token: string): Promise<void>
  clearRefreshToken(): Promise<void>
}

// Simple file-based storage for development
// REPLACE THIS with database storage in production
class FileTokenStorage implements TokenStorage {
  private tokenPath = './.corvana-gsc-token'
  
  async getRefreshToken(): Promise<string | null> {
    try {
      // In production, fetch from database
      // For now, we'll use a different approach - see getStoredRefreshToken below
      return null
    } catch {
      return null
    }
  }
  
  async setRefreshToken(token: string): Promise<void> {
    // In production, save to database
    console.log('[Corvana] Refresh token received (store securely in production)')
  }
  
  async clearRefreshToken(): Promise<void> {
    // In production, clear from database
  }
}

// Use a module-level variable for the refresh token in development
// In production, this should be stored in a database with encryption
let storedRefreshToken: string | null = null

/**
 * Create OAuth2 client with credentials from runtime config
 */
export function createOAuth2Client(
  clientId: string,
  clientSecret: string,
  redirectUri: string
) {
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('Missing required Google OAuth credentials')
  }
  
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri)
}

/**
 * Generate OAuth2 consent URL for Search Console access
 */
/** `state` binds the consent to the admin request that started it (checked in the callback). */
export function generateAuthUrl(oauth2Client: ReturnType<typeof createOAuth2Client>, state: string) {
  const scopes = [
    'https://www.googleapis.com/auth/webmasters.readonly'
  ]
  
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',  // Required to get refresh token
    prompt: 'consent',       // Force consent screen to ensure refresh token is returned
    scope: scopes,
    include_granted_scopes: true,
    state
  })
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(
  oauth2Client: ReturnType<typeof createOAuth2Client>,
  code: string
) {
  const { tokens } = await oauth2Client.getToken(code)
  return tokens
}

/**
 * Store refresh token securely
 * TODO: Replace with database storage
 */
export async function storeRefreshToken(token: string): Promise<void> {
  // SECURITY: In production, encrypt and store in database
  // For now, store in module-level variable (will reset on server restart)
  storedRefreshToken = token
  
  // TODO: Implement database storage
  // Example with Strapi:
  // await strapi.entityService.create('api::corvana-token.corvana-token', {
  //   data: { encryptedToken: encrypt(token) }
  // })
  
  console.log('[Corvana] Refresh token stored (memory only - implement DB storage)')
}

/**
 * Get stored refresh token
 * TODO: Replace with database retrieval
 */
export async function getStoredRefreshToken(): Promise<string | null> {
  // SECURITY: In production, retrieve from database and decrypt
  // For now, return module-level variable
  return storedRefreshToken
}

/**
 * Clear stored refresh token
 */
export async function clearRefreshToken(): Promise<void> {
  storedRefreshToken = null
  console.log('[Corvana] Refresh token cleared')
}

/**
 * Create OAuth2 client with stored refresh token
 */
export async function createAuthenticatedClient(
  clientId: string,
  clientSecret: string,
  redirectUri: string
) {
  const oauth2Client = createOAuth2Client(clientId, clientSecret, redirectUri)
  
  const refreshToken = await getStoredRefreshToken()
  
  if (!refreshToken) {
    throw new Error('No refresh token found. Visit /api/corvana/google/connect to authenticate.')
  }
  
  oauth2Client.setCredentials({
    refresh_token: refreshToken
  })
  
  // Auto-refresh access token when expired
  oauth2Client.on('tokens', (tokens) => {
    if (tokens.refresh_token) {
      // Store new refresh token if rotated
      storeRefreshToken(tokens.refresh_token)
    }
  })
  
  return oauth2Client
}

/**
 * Check if all required environment variables are set
 */
export function checkEnvVars(runtimeConfig: {
  corvanaGoogleClientId?: string
  corvanaGoogleClientSecret?: string
  corvanaGoogleRedirectUri?: string
  corvanaGscSiteUrl?: string
}) {
  const missing = []
  
  if (!runtimeConfig.corvanaGoogleClientId) missing.push('CORVANA_GOOGLE_CLIENT_ID')
  if (!runtimeConfig.corvanaGoogleClientSecret) missing.push('CORVANA_GOOGLE_CLIENT_SECRET')
  if (!runtimeConfig.corvanaGoogleRedirectUri) missing.push('CORVANA_GOOGLE_REDIRECT_URI')
  if (!runtimeConfig.corvanaGscSiteUrl) missing.push('CORVANA_GSC_SITE_URL')
  
  return {
    valid: missing.length === 0,
    missing
  }
}
