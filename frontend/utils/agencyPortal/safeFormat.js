/**
 * V1.3 Safe Formatters - Prevent NaN from ever rendering
 * All functions return fallback if value is not a finite number
 */

/**
 * Safe number formatting - returns fallback if value is not finite
 * @param {*} value - Value to format
 * @param {string} fallback - Fallback string if invalid
 * @returns {string|number}
 */
export function safeNumber(value, fallback = '—') {
  if (value === null || value === undefined) return fallback
  const num = Number(value)
  if (!Number.isFinite(num)) return fallback
  return num
}

/**
 * Safe integer formatting - returns fallback if value is not finite
 * @param {*} value - Value to format
 * @param {string} fallback - Fallback string if invalid
 * @returns {string|number}
 */
export function safeInt(value, fallback = '—') {
  if (value === null || value === undefined) return fallback
  const num = Number(value)
  if (!Number.isFinite(num)) return fallback
  return Math.round(num)
}

/**
 * Safe percent formatting - returns fallback if value is not finite
 * @param {*} value - Value to format (0-100 scale)
 * @param {string} fallback - Fallback string if invalid
 * @returns {string}
 */
export function safePercent(value, fallback = '—') {
  if (value === null || value === undefined) return fallback
  const num = Number(value)
  if (!Number.isFinite(num)) return fallback
  return `${Math.round(num)}%`
}

/**
 * Safe delta formatting with +/- prefix
 * @param {*} value - Delta value
 * @param {string} fallback - Fallback string if invalid
 * @returns {string}
 */
export function safeDelta(value, fallback = '—') {
  if (value === null || value === undefined) return fallback
  const num = Number(value)
  if (!Number.isFinite(num)) return fallback
  const sign = num >= 0 ? '+' : ''
  return `${sign}${Math.round(num)}`
}

/**
 * Safe velocity formatting with sign (alias for safeDelta)
 * @param {*} value - Velocity value
 * @param {string} fallback - Fallback string if invalid
 * @returns {string}
 */
export function safeVelocity(value, fallback = '—') {
  return safeDelta(value, fallback)
}

/**
 * Check if a value is a valid finite number
 * @param {*} value 
 * @returns {boolean}
 */
export function isValidNumber(value) {
  if (value === null || value === undefined) return false
  return Number.isFinite(Number(value))
}

/**
 * Safe bar width for progress bars (clamps to 0-100)
 * @param {*} value 
 * @returns {number}
 */
export function safeBarWidth(value) {
  if (!isValidNumber(value)) return 0
  return Math.min(Math.max(Number(value), 0), 100)
}
