/**
 * Debug endpoint to verify env vars are loading
 */
export default defineEventHandler(async (event) => {
  const runtimeConfig = useRuntimeConfig()
  
  return {
    corvanaGoogleClientId: runtimeConfig.corvanaGoogleClientId ? '✓ Set' : '✗ Missing',
    corvanaGoogleClientSecret: runtimeConfig.corvanaGoogleClientSecret ? '✓ Set' : '✗ Missing',
    corvanaGoogleRedirectUri: runtimeConfig.corvanaGoogleRedirectUri ? '✓ Set' : '✗ Missing',
    corvanaGscSiteUrl: runtimeConfig.corvanaGscSiteUrl ? '✓ Set' : '✗ Missing',
    // Don't expose actual values, just show if they exist
    idPrefix: runtimeConfig.corvanaGoogleClientId?.substring(0, 10) + '...',
    siteUrl: runtimeConfig.corvanaGscSiteUrl
  }
})
