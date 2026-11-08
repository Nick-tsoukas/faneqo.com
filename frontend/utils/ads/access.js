/**
 * Private Ads Studio allowlist.
 * nick.tsoukas101@gmail.com can open the studio locally and in production.
 * test@gmail.com is an additional local-only account.
 */
export const ADS_DEV_EMAIL = 'test@gmail.com'
export const ADS_PRODUCTION_EMAIL = 'nick.tsoukas101@gmail.com'

export function normalizeAdsEmail(email) {
  return String(email || '').trim().toLowerCase()
}

export function adsAllowedEmail(isDev) {
  return isDev ? ADS_DEV_EMAIL : ADS_PRODUCTION_EMAIL
}

export function canAccessAdsStudio(email, isDev) {
  const normalized = normalizeAdsEmail(email)
  if (!normalized) return false
  if (normalized === ADS_PRODUCTION_EMAIL) return true
  return Boolean(isDev) && normalized === ADS_DEV_EMAIL
}
