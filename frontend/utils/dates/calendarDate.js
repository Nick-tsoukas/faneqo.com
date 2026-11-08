/**
 * The one safe reading of a Strapi `date` field.
 *
 * Strapi types Event `date` as `date`, so the API sends `"2026-09-25"` — a
 * calendar day, not an instant. `new Date("2026-09-25")` reads that as UTC
 * midnight, which is 7 PM on Sep 24 in America/Chicago, so every surface that
 * did it printed the show one day early. Explicit Y/M/D gives local midnight
 * and the same calendar day in every browser zone.
 *
 * Values that do carry a clock (`showModeStartedAt`, `createdAt`) are real
 * instants and are parsed normally — those must move with the reader's zone.
 */

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/

/**
 * `YYYY-MM-DD` → local midnight on that day. Anything else → normal parsing.
 * Returns null when the value is empty or unparseable, so callers can render
 * nothing rather than "Invalid Date".
 */
export function parseCalendarDate(value) {
  if (value == null || value === '') return null
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value

  const text = String(value).trim()
  const day = text.match(DATE_ONLY)
  if (day) return new Date(Number(day[1]), Number(day[2]) - 1, Number(day[3]))

  const parsed = new Date(text)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

/** True when the value names a calendar day rather than an instant. */
export function isCalendarDateOnly(value) {
  return typeof value === 'string' && DATE_ONLY.test(value.trim())
}

/**
 * Format a Strapi `date` for display.
 *
 * A `timeZone` is honoured only for values that carry a clock. Applying one to
 * a calendar day would re-introduce the very shift this module exists to stop.
 */
export function formatCalendarDate(value, { timeZone = null, ...options } = {}) {
  const date = parseCalendarDate(value)
  if (!date) return ''

  const format = { month: 'short', day: 'numeric', year: 'numeric', ...options }
  if (timeZone && !isCalendarDateOnly(value)) format.timeZone = timeZone

  try {
    return new Intl.DateTimeFormat('en-US', format).format(date)
  } catch {
    delete format.timeZone
    return new Intl.DateTimeFormat('en-US', format).format(date)
  }
}

/** Local midnight today, for past/upcoming comparisons against a calendar day. */
export function startOfLocalToday(now = new Date()) {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

/**
 * Sort key for a calendar day: milliseconds at local midnight.
 * Ordering is stable because every value is read in the same zone.
 */
export function calendarDateMs(value) {
  const date = parseCalendarDate(value)
  return date ? date.getTime() : Number.NaN
}

/** True when both values land on the same local calendar day. */
export function isSameLocalCalendarDay(value, now = new Date()) {
  const date = parseCalendarDate(value)
  const other = parseCalendarDate(now)
  if (!date || !other) return false
  return (
    date.getFullYear() === other.getFullYear()
    && date.getMonth() === other.getMonth()
    && date.getDate() === other.getDate()
  )
}
