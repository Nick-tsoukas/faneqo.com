/**
 * Calendar-safe night date for recap / composer / Night Story.
 * Date-only `YYYY-MM-DD` is local Y/M/D, never UTC midnight → previous day.
 */
import { isCalendarDateOnly, parseCalendarDate } from '../dates/calendarDate.js'

function localYmd(value) {
  if (typeof value !== 'string') return null
  const day = value.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!day) return null
  return new Date(Number(day[1]), Number(day[2]) - 1, Number(day[3]))
}

export function formatShowNightDate(value, options = {}) {
  if (!value) return ''
  // A date-only field has no instant, so a venue zone must not be applied.
  if (isCalendarDateOnly(value)) {
    const date = parseCalendarDate(value)
    return date
      ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date)
      : ''
  }
  const fromYmd = !options.timeZone ? localYmd(value) : null
  if (fromYmd) {
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(fromYmd)
  }
  const parsed = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(parsed.getTime())) return ''
  const fmt = { month: 'short', day: 'numeric' }
  if (options.timeZone) fmt.timeZone = options.timeZone
  return new Intl.DateTimeFormat('en-US', fmt).format(parsed)
}

/**
 * "Sat, Oct 18, 2024 · CDT" in the show's own timezone.
 *
 * A gallery is filed against the night the room happened, not against the
 * browser's clock, so picking a show has to name the date the artist would
 * name. The zone abbreviation is the honest part: it says whose clock this is.
 */
export function formatShowNightDateLong(value, { timeZone } = {}) {
  if (!value) return ''
  if (isCalendarDateOnly(value)) {
    const date = parseCalendarDate(value)
    if (!date) return ''
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date)
  }
  const fromYmd = !timeZone ? localYmd(value) : null
  const parsed = fromYmd || (value instanceof Date ? value : new Date(value))
  if (Number.isNaN(parsed.getTime())) return ''
  const fmt = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }
  if (timeZone) fmt.timeZone = timeZone
  let base = ''
  try {
    base = new Intl.DateTimeFormat('en-US', fmt).format(parsed)
  } catch {
    delete fmt.timeZone
    base = new Intl.DateTimeFormat('en-US', fmt).format(parsed)
    return base
  }
  if (!timeZone) return base
  try {
    const zone = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'short' })
      .formatToParts(parsed)
      .find((part) => part.type === 'timeZoneName')?.value
    return zone ? `${base} · ${zone}` : base
  } catch {
    return base
  }
}

/** Calendar-safe "June 2025". Date-only / ISO date prefix is local Y/M, never UTC midnight → previous month. */
export function formatJoinedMonthYear(value) {
  if (!value) return ''
  const fromYmd = localYmd(value)
  if (fromYmd) {
    return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(fromYmd)
  }
  const parsed = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(parsed.getTime())) return ''
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(parsed)
}

export function deriveShowPhotosTitle({ city, venue, date, showTitle, timeZone } = {}) {
  const place = String(city || '').trim() || String(venue || '').trim()
  const when = formatShowNightDate(date, { timeZone })
  if (place && when) return `${place} — ${when}`.slice(0, 120)
  const heading = String(showTitle || place || when || '').trim()
  return heading ? heading.slice(0, 120) : null
}
