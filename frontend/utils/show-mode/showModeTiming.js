/**
 * Artist-facing Show Mode timing helpers.
 * Backend already accepts performanceStartsAt / performanceEndsAt.
 * 6 AM local remains a server safety ceiling, not the intended set end.
 *
 * Default window: start now, end +3 hours. Within the 24h performance cap
 * and shorter than the leftover Event +4h default.
 */

export const DEFAULT_SET_HOURS = 3

export function getBrowserTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || null
  } catch {
    return null
  }
}

export function pad2(value) {
  return String(value).padStart(2, '0')
}

export function toDatetimeLocalValue(date) {
  const next = date instanceof Date ? date : new Date(date)
  if (Number.isNaN(next.getTime())) return ''
  return `${next.getFullYear()}-${pad2(next.getMonth() + 1)}-${pad2(next.getDate())}T${pad2(next.getHours())}:${pad2(next.getMinutes())}`
}

export function fromDatetimeLocalValue(value) {
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/)
  if (!match) return null
  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
    Number(match[4]),
    Number(match[5]),
    0,
    0,
  )
  return Number.isNaN(date.getTime()) ? null : date
}

export function defaultSetupTimes(now = new Date()) {
  const start = new Date(now)
  start.setSeconds(0, 0)
  const end = new Date(start.getTime() + DEFAULT_SET_HOURS * 60 * 60 * 1000)
  return {
    startsLocal: toDatetimeLocalValue(start),
    endsLocal: toDatetimeLocalValue(end),
    startsAt: start,
    endsAt: end,
  }
}

export function timingPayloadFromLocal(startsLocal, endsLocal) {
  const startsAt = fromDatetimeLocalValue(startsLocal)
  const endsAt = fromDatetimeLocalValue(endsLocal)
  if (!startsAt || !endsAt) {
    return { error: 'Choose a start and end time.' }
  }
  if (endsAt.getTime() <= startsAt.getTime()) {
    return { error: 'End must be after start.' }
  }
  return {
    performanceStartsAt: startsAt.toISOString(),
    performanceEndsAt: endsAt.toISOString(),
  }
}

export function formatEndsTime(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function sameLocalDay(a, b) {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate()
}

export function formatSetupClockLabel(localValue, now = new Date()) {
  const date = fromDatetimeLocalValue(localValue)
  if (!date) return ''
  const time = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
  if (sameLocalDay(date, now)) return `Tonight · ${time}`
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  if (sameLocalDay(date, tomorrow)) return `Tomorrow · ${time}`
  const day = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${day} · ${time}`
}

export function formatShowDate(raw) {
  if (!raw) return ''
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function livePlaceLine(status) {
  const title = String(status?.title || '').trim()
  const venue = String(status?.venue || '').trim()
  const city = String(status?.city || '').trim()
  return {
    headline: title || venue || 'Live show',
    place: title && venue ? [venue, city].filter(Boolean).join(' · ') : city,
  }
}

export function recentShowLine(recap) {
  if (!recap) return { title: '', meta: '' }
  const title = String(recap.showTitle || recap.venue || 'Live Show').trim()
  const parts = [recap.venue, recap.city]
    .map((part) => String(part || '').trim())
    .filter(Boolean)
  if (title && parts[0] === title) parts.shift()
  const date = formatShowDate(recap.showStartedAt || recap.showEndedAt || recap.recapGeneratedAt)
  if (date) parts.push(date)
  return { title, meta: parts.join(' · ') }
}
