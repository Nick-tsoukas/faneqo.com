/**
 * GET /api/corvana/google/callback
 * 
 * Handles Google OAuth callback after user grants permission.
 * Exchanges authorization code for tokens and stores refresh token.
 */

import { defineEventHandler, deleteCookie, getCookie, getQuery, setResponseStatus } from 'h3'
import { CORVANA_OAUTH_STATE_COOKIE, escapeHtml, stateMatches } from '../../../utils/corvanaOAuthState.js'
import { 
  createOAuth2Client, 
  exchangeCodeForTokens, 
  storeRefreshToken,
  checkEnvVars 
} from '../../../utils/corvanaGoogleOAuth'

export default defineEventHandler(async (event) => {
  const runtimeConfig = useRuntimeConfig()
  const query = getQuery(event)
  
  // Check for OAuth error
  if (query.error) {
    console.error('[Corvana] OAuth error:', query.error)
    setResponseStatus(event, 400)
    return successHtml(
      'Connection Failed',
      `OAuth error: ${String(query.error)}`,
      'error',
      query.error_description ? escapeHtml(String(query.error_description)) : undefined
    )
  }
  
  // Check for authorization code
  const code = query.code as string | undefined
  
  if (!code) {
    setResponseStatus(event, 400)
    return successHtml(
      'Connection Failed',
      'No authorization code received from Google.',
      'error'
    )
  }
  
  // Only a callback for a connect started by an authorized admin request (OAuth state) may store a token.
  const expectedState = getCookie(event, CORVANA_OAUTH_STATE_COOKIE)
  deleteCookie(event, CORVANA_OAUTH_STATE_COOKIE, { path: '/api/corvana/google' })
  if (!stateMatches(query.state, expectedState)) {
    setResponseStatus(event, 403)
    return successHtml(
      'Connection Failed',
      'This sign-in link is invalid or has expired. Start again from the Corvana dashboard.',
      'error'
    )
  }
  
  // Check environment variables
  const envCheck = checkEnvVars({
    corvanaGoogleClientId: runtimeConfig.corvanaGoogleClientId,
    corvanaGoogleClientSecret: runtimeConfig.corvanaGoogleClientSecret,
    corvanaGoogleRedirectUri: runtimeConfig.corvanaGoogleRedirectUri,
    corvanaGscSiteUrl: runtimeConfig.corvanaGscSiteUrl
  })
  
  if (!envCheck.valid) {
    setResponseStatus(event, 500)
    return successHtml(
      'Configuration Error',
      `Missing environment variables: ${envCheck.missing.join(', ')}`,
      'error'
    )
  }
  
  try {
    // Create OAuth2 client
    const oauth2Client = createOAuth2Client(
      runtimeConfig.corvanaGoogleClientId!,
      runtimeConfig.corvanaGoogleClientSecret!,
      runtimeConfig.corvanaGoogleRedirectUri!
    )
    
    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(oauth2Client, code)
    
    // Store refresh token securely
    if (tokens.refresh_token) {
      await storeRefreshToken(tokens.refresh_token)
      console.log('[Corvana] Refresh token stored successfully')
    } else {
      console.warn('[Corvana] No refresh token received - user may have already authorized')
    }
    
    // Return success HTML page
    return successHtml(
      'Corvana Search Console Connected',
      'Your Google Search Console is now connected. You can close this window and run SEO reports.',
      'success'
    )
    
  } catch (error: any) {
    console.error('[Corvana] Failed to exchange code for tokens:', error.message)
    
    // Check for specific error types
    let errorMessage = error.message
    let helpText = ''
    
    if (error.message?.includes('redirect_uri_mismatch')) {
      errorMessage = 'Redirect URI mismatch'
      helpText = `
        The redirect URI must exactly match what's configured in Google Cloud Console.
        <br><br>
        Configured: ${runtimeConfig.corvanaGoogleRedirectUri}<br>
        <br>
        Go to <a href="https://console.cloud.google.com/apis/credentials" target="_blank">Google Cloud Console</a> 
        and add this exact URI to "Authorized redirect URIs".
      `
    } else if (error.message?.includes('invalid_grant')) {
      errorMessage = 'Authorization code expired or invalid'
      helpText = 'Please try connecting again by visiting /api/corvana/google/connect'
    }
    
    setResponseStatus(event, 500)
    return successHtml(
      'Connection Failed',
      errorMessage,
      'error',
      helpText
    )
  }
})

/**
 * Generate HTML success/error page
 */
function successHtml(
  title: string, 
  message: string, 
  status: 'success' | 'error',
  help?: string
): string {
  const isSuccess = status === 'success'
  const bgColor = isSuccess ? '#10b981' : '#ef4444'
  const icon = isSuccess ? '✓' : '✗'
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f5f5f5;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      max-width: 500px;
      width: 100%;
      padding: 40px;
      text-align: center;
    }
    .icon {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: ${bgColor};
      color: white;
      font-size: 32px;
      line-height: 64px;
      margin: 0 auto 24px;
    }
    h1 {
      font-size: 24px;
      color: #1f2937;
      margin-bottom: 16px;
    }
    p {
      color: #6b7280;
      line-height: 1.6;
      margin-bottom: 16px;
    }
    .help {
      background: #f3f4f6;
      border-radius: 8px;
      padding: 16px;
      margin-top: 20px;
      font-size: 14px;
      color: #4b5563;
      text-align: left;
    }
    .help a {
      color: ${bgColor};
      text-decoration: none;
    }
    .help a:hover {
      text-decoration: underline;
    }
    .test-link {
      display: inline-block;
      margin-top: 24px;
      padding: 12px 24px;
      background: ${bgColor};
      color: white;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 500;
    }
    .test-link:hover {
      opacity: 0.9;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">${icon}</div>
    <h1>${escapeHtml(title)}</h1>
    <p>${escapeHtml(message)}</p>
    ${help ? `<div class="help">${help}</div>` : ''}
    ${isSuccess ? '<a href="/api/corvana/search-console/test" class="test-link">Test Connection</a>' : ''}
  </div>
</body>
</html>
`
}
