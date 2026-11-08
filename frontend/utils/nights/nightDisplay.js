/**
 * Public Night / Gallery display helpers. Presentation only.
 * Never invent attendance, slugs, or gated media.
 */

function text(value) {
  return String(value || '').trim()
}

function sameish(a, b) {
  return text(a).toLowerCase() === text(b).toLowerCase()
}

export function artistNameFromSlug(slug) {
  const raw = text(slug).replace(/[-_]+/g, ' ')
  if (!raw) return ''
  return raw.replace(/\b\w/g, (char) => char.toUpperCase())
}

export function displayPlaceName(value) {
  const raw = text(value)
  if (!raw) return ''
  return raw.replace(/\S+/g, (word) => {
    if (/^[A-Z0-9]{2,}$/.test(word)) return word
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  })
}

export function isGenericShowTitle(title) {
  return /^(live show|show|night|untitled)$/i.test(text(title))
}

export function nightHeadline({ title, venue } = {}) {
  const venueName = text(venue)
  const showTitle = text(title)
  if (venueName && showTitle && !sameish(showTitle, venueName) && !isGenericShowTitle(showTitle)) {
    return { primary: showTitle, secondary: venueName }
  }
  return {
    primary: venueName || showTitle || '',
    secondary: '',
  }
}

export function nightPlaceLine({ city, region, country } = {}) {
  const town = text(city)
  const state = text(region)
  const nation = text(country)
  if (town && state) return `${town}, ${state}`
  return [town, state, nation].filter(Boolean).join(', ')
}

export function nightVenueCityLine({ venue, city } = {}) {
  const venueName = displayPlaceName(venue)
  const cityName = displayPlaceName(city)
  if (venueName && cityName) return `${venueName} · ${cityName}`
  return venueName || cityName || ''
}

function localYmd(value) {
  if (typeof value !== 'string') return null
  const day = value.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!day) return null
  return new Date(Number(day[1]), Number(day[2]) - 1, Number(day[3]))
}

function parseWhen(value) {
  if (!value) return null
  const day = localYmd(value)
  if (day) return { date: day, hasClock: false }
  const parsed = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  const clock = typeof value === 'string' && /T\d{2}:\d{2}/.test(value)
  return { date: parsed, hasClock: clock }
}

export function formatNightDateLong(value, timeZone) {
  const parsed = parseWhen(value)
  if (!parsed) return ''
  const fmt = { month: 'long', day: 'numeric', year: 'numeric' }
  if (timeZone && parsed.hasClock) fmt.timeZone = timeZone
  return new Intl.DateTimeFormat('en-US', fmt).format(parsed.date)
}

function formatClock(date, timeZone) {
  const fmt = { hour: 'numeric', minute: '2-digit' }
  if (timeZone) fmt.timeZone = timeZone
  return new Intl.DateTimeFormat('en-US', fmt).format(date)
}

export function formatNightTimeWindow(startsAt, endsAt, timeZone) {
  const start = parseWhen(startsAt)
  const end = parseWhen(endsAt)
  if (!start?.hasClock) return ''
  const startClock = formatClock(start.date, timeZone)
  if (!end?.hasClock) return startClock
  return `${startClock}–${formatClock(end.date, timeZone)}`
}

function usablePublicImageUrl(node) {
  if (!node || typeof node !== 'object') return ''
  if (node.protected === true || node.unavailable === true) return ''
  const mime = String(node.mime || '').toLowerCase()
  if (mime && !mime.startsWith('image/')) return ''
  const raw = text(node.url || node.largeUrl || node.thumbnailUrl || node.thumbUrl)
  if (!raw || raw.startsWith('faneqo-protected://')) return ''
  if (/X-Amz-Signature|X-Amz-Credential|X-Amz-Security-Token/i.test(raw)) return ''
  return raw
}

function firstUsableFallback(fallbacks) {
  const list = Array.isArray(fallbacks) ? fallbacks : [fallbacks]
  for (const item of list) {
    if (!item) continue
    const url = typeof item === 'string'
      ? (usablePublicImageUrl({ url: item }) || text(item))
      : usablePublicImageUrl(item)
    if (url) return url
  }
  return ''
}

export function publicGalleryPreviewUrl(gallery, fallbackUrl) {
  const fallback = firstUsableFallback(fallbackUrl)
  if (!gallery) return fallback || null
  if (gallery.locked) return fallback || null
  const media = Array.isArray(gallery.media) ? gallery.media : []
  for (const item of media) {
    const url = usablePublicImageUrl(item)
    if (url) return url
  }
  return fallback || null
}

export function nightSafeTeaserFallbacks({ coverUrl, eventUrl, artistUrl } = {}) {
  return [coverUrl, eventUrl, artistUrl].filter((url) => text(url))
}

export function galleryChapterPreviewUrl(gallery, fallbacks) {
  const fallback = firstUsableFallback(fallbacks)
  if (!gallery || gallery.locked) return fallback || null
  const media = Array.isArray(gallery.media) ? gallery.media : []
  for (const item of media) {
    const url = usablePublicImageUrl(item)
    if (url) return url
    const thumb = usablePublicImageUrl({
      protected: item?.protected,
      unavailable: item?.unavailable,
      mime: item?.mime,
      url: item?.thumbnailUrl || item?.thumbUrl || '',
    })
    if (thumb) return thumb
  }
  return fallback || null
}

export function samePublicImageUrl(a, b) {
  const left = text(typeof a === 'string' ? a : a?.url)
  const right = text(typeof b === 'string' ? b : b?.url)
  if (!left || !right) return false
  return left.split('?')[0] === right.split('?')[0]
}

export function galleryLockActionLabel(lockReason, visibility) {
  const reason = text(lockReason || visibility)
  if (reason === 'fan_list') return 'Sign in'
  return 'Sign in to verify'
}

export function galleryChapterLockLine({ lockReason, visibility } = {}) {
  const reason = text(lockReason || visibility)
  if (reason === 'fan_list') return 'For the people on the fan list.'
  return 'For the people who were there.'
}

export function uniqueNightGalleries(rows) {
  const list = Array.isArray(rows) ? rows : []
  const seen = new Set()
  return list.filter((row) => {
    const key = text(row?.slug || row?.canonicalPath || row?.title)
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function attendanceLine(count) {
  const n = Number(count) || 0
  if (n <= 0) return ''
  if (n === 1) return '1 person was there'
  return `${n} people were there`
}
