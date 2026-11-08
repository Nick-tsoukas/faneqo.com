/**
 * QR Code Utilities
 * Sanitization and validation for QR code data
 */

/**
 * QR Gateway Configuration
 * All new QR codes should encode URLs pointing to the gateway subdomain.
 * This allows the PWA to have full scope while QR scans go through the gateway.
 *
 * QR_GATEWAY_ORIGIN controls only NEW QR creation.
 * Existing QR records keep their stored URLs indefinitely — do not derive
 * their encoded URL from this constant at edit or repair time.
 */
const QR_GATEWAY_ORIGIN = 'https://qr.faneqo.com'
/** @deprecated Legacy gateway — kept for reference only. Existing records encoding this URL continue to work. */
const LEGACY_GATEWAY_ORIGIN = 'https://qr.musicbizqr.com'
const LEGACY_ORIGIN = 'https://musicbizqr.com'

/**
 * Get the encoded QR URL for a given QR ID.
 * This URL is what gets embedded into the QR code image.
 * Uses the gateway subdomain (qr.musicbizqr.com) for new QR codes.
 * 
 * @param qrId - The QR record ID or slug ID
 * @returns The full URL to encode in the QR image
 */
export function getEncodedQrUrl(qrId: string | number): string {
  return `${QR_GATEWAY_ORIGIN}/directqr?id=${qrId}`
}

/**
 * Get the gateway QR URL for a band-profile share (in-app Share drawer).
 * Resolves through the gateway /directqr route (PWA-scope safe + analytics)
 * without requiring a persisted QR record. Uses the current gateway origin.
 *
 * @param slug - The band slug
 * @returns The gateway share URL (e.g. https://qr.faneqo.com/directqr?band=my-band)
 */
export function getBandShareQrUrl(slug: string): string {
  return `${QR_GATEWAY_ORIGIN}/directqr?band=${encodeURIComponent(slug)}`
}

/**
 * Get the legacy encoded QR URL (main domain).
 * Only use this for backwards compatibility if explicitly needed.
 * 
 * @param qrId - The QR record ID or slug ID
 * @returns The legacy URL (musicbizqr.com)
 */
export function getLegacyEncodedQrUrl(qrId: string | number): string {
  return `${LEGACY_ORIGIN}/directqr?id=${qrId}`
}

/**
 * Get the legacy gateway encoded QR URL (qr.musicbizqr.com).
 * Only for reference — existing QRs encoding this URL continue to work.
 *
 * @param qrId - The QR record ID or slug ID
 * @returns The legacy gateway URL (qr.musicbizqr.com)
 */
export function getLegacyGatewayEncodedQrUrl(qrId: string | number): string {
  return `${LEGACY_GATEWAY_ORIGIN}/directqr?id=${qrId}`
}

/**
 * Remove invisible characters that can corrupt QR scanning
 * - BOM (Byte Order Mark)
 * - Zero-width characters
 * - Other invisible Unicode
 */
export function sanitizeQrValue(value: unknown): string {
  // Convert to string
  let str = String(value ?? '')
  
  // Remove BOM and zero-width characters
  str = str.replace(/[\u200B-\u200D\uFEFF\u00A0]/g, '')
  
  // Remove other common invisible characters
  str = str.replace(/[\u2060\u180E]/g, '')
  
  // Trim whitespace
  str = str.trim()
  
  console.log('[QR Sanitize] Input:', JSON.stringify(String(value)))
  console.log('[QR Sanitize] Output:', JSON.stringify(str))
  console.log('[QR Sanitize] Char codes:', [...str.slice(0, 30)].map(c => c.charCodeAt(0)))
  
  return str
}

/**
 * Validate that a value is a valid HTTPS URL
 */
export function assertHttpsUrl(value: string): boolean {
  const sanitized = sanitizeQrValue(value)
  
  if (!sanitized) {
    console.error('[QR Validate] Empty value')
    return false
  }
  
  if (!sanitized.startsWith('https://')) {
    console.error('[QR Validate] Not HTTPS:', sanitized)
    return false
  }
  
  try {
    new URL(sanitized)
    return true
  } catch {
    console.error('[QR Validate] Invalid URL:', sanitized)
    return false
  }
}

/**
 * Safe Mode QR configuration - proven to scan on all devices
 * Use this for downloads to ensure maximum compatibility
 */
export const SAFE_QR_CONFIG = {
  width: 420,
  height: 420,
  margin: 20, // Quiet zone - critical for scanning
  qrOptions: {
    errorCorrectionLevel: 'M' as const, // Medium error correction
  },
  dotsOptions: {
    type: 'square' as const,
    color: '#000000',
  },
  cornersSquareOptions: {
    type: 'square' as const,
    color: '#000000',
  },
  cornersDotOptions: {
    type: 'square' as const,
    color: '#000000',
  },
  backgroundOptions: {
    color: '#FFFFFF', // Solid white - NO transparency
  },
  // No image/logo in safe mode - maximizes scan reliability
  image: undefined,
  imageOptions: undefined,
}

/**
 * Merge user config with safe mode overrides
 */
export function applySafeMode(config: Record<string, any>): Record<string, any> {
  return {
    ...config,
    ...SAFE_QR_CONFIG,
    // Preserve data from original config
    data: sanitizeQrValue(config.data),
  }
}

/**
 * Debug helper - get QR config summary for troubleshooting
 */
export function getQrDebugInfo(config: Record<string, any>, rawValue: string): Record<string, any> {
  const sanitized = sanitizeQrValue(rawValue)
  return {
    rawValue: JSON.stringify(rawValue),
    sanitizedValue: JSON.stringify(sanitized),
    charCodes: [...sanitized.slice(0, 24)].map(c => c.charCodeAt(0)),
    stringLength: sanitized.length,
    config: {
      width: config.width,
      height: config.height,
      margin: config.margin,
      errorCorrectionLevel: config.qrOptions?.errorCorrectionLevel,
      dotsType: config.dotsOptions?.type,
      dotsColor: config.dotsOptions?.color,
      bgColor: config.backgroundOptions?.color,
      hasLogo: !!config.image,
    }
  }
}
