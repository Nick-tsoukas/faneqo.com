/**
 * Thread presentation helpers — grouping, Night chapters, gallery previews.
 * Uses only fields already on inbox/gallery payloads. Does not invent relationship truth.
 */

import { formatShowNightDate } from '../shows/formatShowNightDate.js'

export const MESSAGE_GROUP_WINDOW_MS = 8 * 60 * 1000

const GENERIC_GALLERY_TITLES = new Set([
  'view photos',
  'show photos',
  'artist gallery',
  'gallery',
  'night gallery',
])

function senderLane(msg) {
  const role = String(msg?.senderRole || '').trim().toLowerCase()
  const id = String(msg?.senderId || '').trim().toLowerCase()
  if (role === 'artist' || id === 'band') return 'artist'
  if (role === 'fan' || id === 'fan') return 'fan'
  if (id) return `id:${id}`
  if (role) return `role:${role}`
  return ''
}

export function sameMessageSender(a, b) {
  if (!a || !b) return false
  const left = senderLane(a)
  const right = senderLane(b)
  return Boolean(left) && left === right
}

export function isGenericGalleryTitle(title) {
  return GENERIC_GALLERY_TITLES.has(String(title || '').trim().toLowerCase())
}

export function galleryMessageTitle(gallery) {
  const raw = String(gallery?.title || '').trim()
  if (raw) return raw
  const isShow = Boolean(gallery?.show && typeof gallery.show === 'object')
    || gallery?.visibility === 'show_attendees'
  return isShow ? 'Show photos' : 'Artist gallery'
}

export function messageNightChapter(msg) {
  const show = msg?.galleryReference?.show
  if (!show || typeof show !== 'object') return null
  const date = String(show.date || '').trim()
  const city = String(show.city || '').trim()
  const venue = String(show.venue || '').trim()
  const title = String(show.title || '').trim()
  if (!date && !city && !venue && !title) return null
  const place = venue || city
  return {
    key: [date, place, title].filter(Boolean).join('|'),
    date,
    city,
    venue,
    title,
    place,
  }
}

export function isGroupedWithPrevious(messages, index, _windowMs = MESSAGE_GROUP_WINDOW_MS) {
  if (index <= 0) return false
  const list = Array.isArray(messages) ? messages : []
  return sameMessageSender(list[index], list[index - 1])
}

export function isGroupStart(messages, index) {
  return !isGroupedWithPrevious(messages, index)
}

export function isGroupEnd(messages, index) {
  const list = Array.isArray(messages) ? messages : []
  if (!list[index]) return true
  return !isGroupedWithPrevious(list, index + 1)
}

export function isLastGalleryInSenderRun(messages, index) {
  const list = Array.isArray(messages) ? messages : []
  const msg = list[index]
  if (!msg?.galleryReference) return false
  const next = list[index + 1]
  return !(next?.galleryReference && sameMessageSender(msg, next))
}

export function shouldShowNightSeparator(messages, index) {
  const list = Array.isArray(messages) ? messages : []
  const cur = messageNightChapter(list[index])
  if (!cur) return false
  for (let i = index - 1; i >= 0; i -= 1) {
    const prev = messageNightChapter(list[i])
    if (prev) return prev.key !== cur.key
  }
  return true
}

export function formatNightSeparator(chapter) {
  if (!chapter) return null
  const date = formatShowNightDate(chapter.date)
  const place = String(chapter.place || '').trim()
  const kicker = [date, place].filter(Boolean).join(' · ')
  const rawTitle = String(chapter.title || '').trim()
  const title = rawTitle && rawTitle.toLowerCase() !== place.toLowerCase() ? rawTitle : ''
  if (!kicker && !title) return null
  return { kicker, title }
}

export function formatShowCountLabel(count) {
  const n = Number(count) || 0
  if (n === 1) return '1 show'
  if (n >= 2) return `${n} shows`
  return ''
}

export function formatNightsTogetherLabel(count) {
  const n = Number(count) || 0
  if (n === 1) return '1 Night together'
  if (n >= 2) return `${n} Nights together`
  return ''
}

export function gallerySharePreview(gallery) {
  const show = gallery?.show || {}
  const place = String(show.venue || show.title || show.city || '').trim()
  if (place) return `Shared photos from ${place}`
  const title = String(gallery?.title || '').trim()
  if (title) return `Shared ${title}`
  return 'Shared photos'
}
