import { formatShowNightDate } from '../shows/formatShowNightDate.js'

/**
 * Compact artist-facing show line for Messages compose/review.
 * Reuses existing Show Recap fields. Does not invent attendance.
 */
export function formatShowIdentity(recap = {}, options = {}) {
  const title = String(recap.showTitle || recap.venue || recap.city || '').trim()
  const when = formatShowNightDate(
    recap.showStartedAt || recap.recapGeneratedAt || recap.date || '',
    { timeZone: recap.timezone || recap.timeZone || options.timeZone }
  )
  if (title && when) return `${title} · ${when}`
  return title || when || ''
}
