/**
 * Artist-page QR / link share drawer — sizing and scan policy only.
 * Not Share Kit 2.0. Encoded URL stays getBandShareQrUrl (gateway).
 */

export const ARTIST_SHARE_QR_LEVEL = 'H'
export const ARTIST_SHARE_QR_MARGIN = 2
export const ARTIST_SHARE_QR_LOGO_RATIO = 0.16

export function artistSharePath(slug) {
  const clean = String(slug || '').trim().replace(/^\/+|\/+$/g, '')
  if (!clean || /[/?#]/.test(clean)) return ''
  return `/${clean}`
}

export function artistShareQrSize({ width = 390, height = 844 } = {}) {
  const w = Number(width) || 390
  const h = Number(height) || 844
  const short = h < 680
  if (w <= 320) return short ? 148 : 164
  if (w <= 360) return short ? 160 : 180
  if (w <= 390) return short ? 176 : 200
  if (w <= 430) return short ? 184 : 212
  return short ? 188 : 220
}

export function artistShareQrLogoSize(qrSize) {
  const size = Number(qrSize) || 0
  if (size <= 0) return 0
  return Math.round(size * ARTIST_SHARE_QR_LOGO_RATIO)
}
