/**
 * V1.2 Mock Data Validator - Dev-only validation for Agency Portal data
 * Run on dashboard mount to catch data issues early
 */

/**
 * Validate mock data integrity and log warnings for issues
 * @param {Object} store - Agency portal store instance
 */
export function validateMockData(store) {
  if (process.env.NODE_ENV === 'production') return
  
  const issues = []
  
  // Validate bandDailyMetrics exists
  if (!store.bandDailyMetrics || typeof store.bandDailyMetrics !== 'object') {
    issues.push('[validateMockData] bandDailyMetrics is missing or invalid')
  } else {
    // Validate each band's metrics
    Object.entries(store.bandDailyMetrics).forEach(([bandId, metrics]) => {
      if (!Array.isArray(metrics)) {
        issues.push(`[validateMockData] bandDailyMetrics[${bandId}] is not an array`)
        return
      }
      
      metrics.forEach((metric, idx) => {
        if (!metric.date) {
          issues.push(`[validateMockData] bandDailyMetrics[${bandId}][${idx}] missing date`)
        }
        
        // Check numeric fields
        const numericFields = ['sessions', 'linkClicks', 'engaged', 'shares', 'momentumIndex']
        numericFields.forEach(field => {
          if (metric[field] !== undefined && !Number.isFinite(metric[field])) {
            issues.push(`[validateMockData] bandDailyMetrics[${bandId}][${idx}].${field} is not finite: ${metric[field]}`)
          }
        })
        
        // Check topCity presence (optional but important for city widgets)
        if (metric.topCity === undefined) {
          // This is a warning, not an error
          // issues.push(`[validateMockData] bandDailyMetrics[${bandId}][${idx}] missing topCity`)
        }
      })
    })
  }
  
  // Validate rosterBands
  if (!store.rosterBands || !Array.isArray(store.rosterBands)) {
    issues.push('[validateMockData] rosterBands is missing or not an array')
  } else {
    store.rosterBands.forEach((band, idx) => {
      if (!band.bandId) {
        issues.push(`[validateMockData] rosterBands[${idx}] missing bandId`)
      }
      if (!band.name) {
        issues.push(`[validateMockData] rosterBands[${idx}] missing name`)
      }
    })
  }
  
  // Validate signals
  const allSignals = Object.values(store.signalsByBandId || {}).flat()
  allSignals.forEach((signal, idx) => {
    if (!signal.id) {
      issues.push(`[validateMockData] signal[${idx}] missing id`)
    }
    if (!signal.bandId) {
      issues.push(`[validateMockData] signal[${idx}] missing bandId`)
    }
    if (signal.score !== undefined && !Number.isFinite(signal.score)) {
      issues.push(`[validateMockData] signal[${signal.id}].score is not finite: ${signal.score}`)
    }
  })
  
  // Log all issues
  if (issues.length > 0) {
    console.warn('=== Agency Portal Mock Data Validation Issues ===')
    issues.forEach(issue => console.warn(issue))
    console.warn(`=== ${issues.length} issue(s) found ===`)
  } else {
    console.log('[validateMockData] All mock data validated successfully')
  }
  
  return issues
}

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
 * @param {*} value - Value to format (0-100 or 0-1 scale)
 * @param {string} fallback - Fallback string if invalid
 * @param {boolean} isDecimal - If true, multiply by 100
 * @returns {string}
 */
export function safePercent(value, fallback = '—', isDecimal = false) {
  if (value === null || value === undefined) return fallback
  let num = Number(value)
  if (!Number.isFinite(num)) return fallback
  if (isDecimal) num *= 100
  const sign = num >= 0 ? '+' : ''
  return `${sign}${Math.round(num)}%`
}

/**
 * Safe velocity formatting with sign
 * @param {*} value - Velocity value
 * @param {string} fallback - Fallback string if invalid
 * @returns {string}
 */
export function safeVelocity(value, fallback = '—') {
  if (value === null || value === undefined) return fallback
  const num = Number(value)
  if (!Number.isFinite(num)) return fallback
  const sign = num >= 0 ? '+' : ''
  return `${sign}${Math.round(num)}`
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
