/**
 * V1.2 Formatters - Helper functions for brief generation
 */

/**
 * Format date/time in short format
 * @param {Date|string} date 
 * @returns {string} e.g., "Jan 13, 2026"
 */
export function formatDateTimeShort(date) {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

/**
 * Format date range for weekly briefs
 * @param {Date} startDate 
 * @param {Date} endDate 
 * @returns {string} e.g., "Jan 6–13, 2026"
 */
export function formatDateRange(startDate, endDate) {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  return `${startStr}–${endStr}`
}

/**
 * Format window label
 * @param {string} window - "7d" or "30d"
 * @returns {string} e.g., "Last 7 days"
 */
export function formatWindowLabel(window) {
  if (window === '7d') return 'Last 7 days'
  if (window === '30d') return 'Last 30 days'
  return window
}

/**
 * Format delta with sign and percentage
 * @param {number} current 
 * @param {number} previous 
 * @returns {string} e.g., "+23%" or "-15%"
 */
export function formatDelta(current, previous) {
  if (!previous || previous === 0) return 'N/A'
  const delta = ((current - previous) / previous) * 100
  const sign = delta >= 0 ? '+' : ''
  return `${sign}${Math.round(delta)}%`
}

/**
 * Format absolute delta with sign
 * @param {number} delta 
 * @returns {string} e.g., "+12" or "-5"
 */
export function formatAbsoluteDelta(delta) {
  const sign = delta >= 0 ? '+' : ''
  return `${sign}${delta}`
}

/**
 * Truncate text to max length
 * @param {string} text 
 * @param {number} maxLength 
 * @returns {string}
 */
export function truncate(text, maxLength = 50) {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + '...'
}

/**
 * Generate city key for storage/lookup
 * @param {string} cityName 
 * @returns {string}
 */
export function cityKey(cityName) {
  if (!cityName) return ''
  return cityName.toLowerCase().replace(/[^a-z0-9]/g, '-')
}

/**
 * Get owner name by ID from members array
 * @param {string} ownerId 
 * @param {Array} members 
 * @returns {string}
 */
export function ownerNameById(ownerId, members) {
  if (!ownerId) return 'Unassigned'
  const member = members?.find(m => m.id === ownerId)
  return member?.name || 'Unassigned'
}

/**
 * Format momentum pill text
 * @param {string} state - 'surging', 'warming', 'steady', 'cooling'
 * @returns {string}
 */
export function formatMomentumPill(state) {
  const pills = {
    surging: '🔥 Surging',
    warming: '📈 Warming',
    steady: '➡️ Steady',
    cooling: '📉 Cooling'
  }
  return pills[state] || '➡️ Steady'
}

/**
 * Format score as fraction
 * @param {number} score 
 * @returns {string} e.g., "85/100"
 */
export function formatScore(score) {
  return `${Math.round(score || 0)}/100`
}

/**
 * Format velocity with sign
 * @param {number} velocity 
 * @returns {string} e.g., "+12" or "-5"
 */
export function formatVelocity(velocity) {
  const v = Math.round(velocity || 0)
  return v >= 0 ? `+${v}` : `${v}`
}

/**
 * Generate deep link URL
 * @param {string} path - relative path like /agency/artists/123
 * @param {string} baseUrl - optional base URL
 * @returns {string}
 */
export function deepLink(path, baseUrl = '') {
  if (baseUrl) return `${baseUrl}${path}`
  return path
}

/**
 * Format list as bullet points
 * @param {Array<string>} items 
 * @param {string} bullet - bullet character
 * @returns {string}
 */
export function formatBulletList(items, bullet = '•') {
  return items.map(item => `${bullet} ${item}`).join('\n')
}

/**
 * Format numbered list
 * @param {Array<string>} items 
 * @returns {string}
 */
export function formatNumberedList(items) {
  return items.map((item, i) => `${i + 1}) ${item}`).join('\n')
}
