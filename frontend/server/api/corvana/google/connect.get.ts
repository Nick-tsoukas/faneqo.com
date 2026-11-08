/**
 * GET /api/corvana/google/connect
 * 
 * Initiates Google OAuth flow for Search Console API access.
 * Redirects user to Google's consent screen.
 */

import { defineEventHandler, sendRedirect, setResponseStatus } from 'h3'
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
    
    // Generate authorization URL
    const authUrl = generateAuthUrl(oauth2Client)
    
    console.log('[Corvana] Redirecting to Google OAuth consent screen')
    
    // Redirect user to Google's OAuth consent page
    return sendRedirect(event, authUrl, 302)
    
  } catch (error: any) {
    console.error('[Corvana] Failed to generate auth URL:', error.message)
    setResponseStatus(event, 500)
    return {
      error: 'Failed to initiate OAuth flow',
      message: error.message
    }
  }
})
