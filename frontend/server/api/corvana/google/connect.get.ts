/**
 * GET /api/corvana/google/connect
 * 
 * Initiates Google OAuth flow for Search Console API access (admin only: the
 * /api/corvana/** middleware requires the admin token header).
 * Returns { url } for the dashboard to open, because a browser navigation can't
 * carry the header, and sets a short-lived OAuth `state` cookie that the
 * callback must match.
 */

import { randomBytes } from 'node:crypto'
import { defineEventHandler, setCookie, setResponseStatus } from 'h3'
import { CORVANA_OAUTH_STATE_COOKIE } from '../../../utils/corvanaOAuthState.js'
import { 
  createOAuth2Client, 
  generateAuthUrl, 
  checkEnvVars 
} from '../../../utils/corvanaGoogleOAuth'

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
      help: 'Set these in your .env file: CORVANA_GOOGLE_CLIENT_ID, CORVANA_GOOGLE_CLIENT_SECRET, CORVANA_GOOGLE_REDIRECT_URI, CORVANA_GSC_SITE_URL'
    }
  }
  
  try {
    // Create OAuth2 client
    const oauth2Client = createOAuth2Client(
      runtimeConfig.corvanaGoogleClientId!,
      runtimeConfig.corvanaGoogleClientSecret!,
      runtimeConfig.corvanaGoogleRedirectUri!
    )
    
    // One-time state, kept in an httpOnly cookie scoped to the Google routes for 10 minutes.
    const state = randomBytes(24).toString('base64url')
    setCookie(event, CORVANA_OAUTH_STATE_COOKIE, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api/corvana/google',
      maxAge: 600,
    })
    return { url: generateAuthUrl(oauth2Client, state) }
    
  } catch (error: any) {
    console.error('[Corvana] Failed to generate auth URL:', error.message)
    setResponseStatus(event, 500)
    return {
      error: 'Failed to initiate OAuth flow',
      message: error.message
    }
  }
})
