/**
 * Artist Nights history presentation.
 * ShowRecap stays the durable record. No second Night model.
 * List teasers use only public-safe Night Hero / Night Photo already on the recap.
 */

function text(value) {
  return String(value || '').trim()
}

function mediaTeaserUrl(node) {
  if (!node || typeof node !== 'object') return ''
  if (node.protected === true || node.unavailable === true) return ''
  const mime = String(node.mime || '').toLowerCase()
  if (mime && !mime.startsWith('image/')) return ''
  const raw = text(
    node.formats?.medium?.url
    || node.formats?.small?.url
    || node.formats?.thumbnail?.url
    || node.url
    || node.thumbnailUrl
    || node.thumbUrl,
  )
  if (!raw || raw.startsWith('faneqo-protected://')) return ''
  if (/X-Amz-Signature|X-Amz-Credential|X-Amz-Security-Token/i.test(raw)) return ''
  return raw
}

export function nightHistoryWhen(recap) {
  return recap?.showStartedAt || recap?.performanceStartsAt || recap?.showEndedAt || recap?.recapGeneratedAt || null
}

export function nightHistoryYear(recap) {
  const raw = nightHistoryWhen(recap)
  if (!raw) return 0
  const date = new Date(raw)
  return Number.isNaN(date.getTime()) ? 0 : date.getFullYear()
}

export function formatNightHistoryDate(recap) {
  const raw = nightHistoryWhen(recap)
  if (!raw) return ''
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()
}

export function nightHistoryEyebrow(recap) {
  const date = formatNightHistoryDate(recap)
  const city = text(recap?.city).toUpperCase()
  return [date, city].filter(Boolean).join(' · ')
}

export function nightHistoryTitle(recap) {
  return text(recap?.showTitle || recap?.venue) || 'Night'
}

export function nightHistoryVenue(recap) {
  const title = nightHistoryTitle(recap)
  const venue = text(recap?.venue)
  if (!venue || venue === title) return ''
  return venue
}

export function nightHistoryStatsLine(recap) {
  const there = Number(recap?.checkedInShowCount) || 0
  const next = Number(recap?.newFanCheckIns ?? recap?.fansCaptured) || 0
  const parts = []
  if (there > 0) parts.push(there === 1 ? '1 was there' : `${there} were there`)
  if (next > 0) parts.push(next === 1 ? '1 new fan' : `${next} new fans`)
  const messages = Number(recap?.messagesSentCount) || 0
  if (messages > 0) parts.push(messages === 1 ? 'Messaged once' : `Messaged ${messages} times`)
  return parts.join(' · ')
}

/**
 * Authenticated history teaser. Reuses Night Hero → Night Photo only.
 * List payload does not include Event artwork or Artist Image — do not invent them.
 */
export function nightHistoryTeaserUrl(recap) {
  return mediaTeaserUrl(recap?.heroImage || recap?.hero)
    || mediaTeaserUrl(recap?.coverImage || recap?.cover)
}

export function groupNightsByYear(recaps) {
  const list = Array.isArray(recaps) ? recaps : []
  const years = new Set(list.map(nightHistoryYear).filter((year) => year > 0))
  if (years.size < 2) return [{ year: null, items: list }]

  const map = new Map()
  for (const recap of list) {
    const year = nightHistoryYear(recap) || 'Unknown'
    if (!map.has(year)) map.set(year, [])
    map.get(year).push(recap)
  }
  return [...map.entries()].map(([year, items]) => ({ year, items }))
}

export const NIGHTS_LIST_PATH = '/fans/recaps'
export const NIGHTS_ALIAS_PATH = '/nights'
