/**
 * Night Story display copy. Presentation only.
 * youWereThere / lockReason stay server-derived.
 */

import { resolveGalleryReturn } from '../nights/artistWorldReturn.js'

export function nightStoryHasShowContext({
  hasShowContext,
  city,
  venue,
  eventId,
  visibility,
} = {}) {
  if (hasShowContext === true) return true
  if (hasShowContext === false) return false
  return !!(
    String(city || '').trim()
    || String(venue || '').trim()
    || eventId
    || visibility === 'show_attendees'
  )
}

export function nightStoryPlaceLine({ title, city, venue, hasShowContext } = {}) {
  const heading = String(title || '').trim()
  if (heading) return heading
  if (nightStoryHasShowContext({ hasShowContext, city, venue })) {
    return String(venue || '').trim() || String(city || '').trim()
  }
  return String(venue || '').trim()
}

export function nightStoryWhereParts({ title, city, venue } = {}) {
  const heading = String(title || '').trim()
  const cityLine = String(city || '').trim()
  const venueLine = String(venue || '').trim()
  const parts = []
  if (cityLine && cityLine !== heading) parts.push(cityLine)
  if (venueLine && venueLine !== heading && venueLine !== cityLine) parts.push(venueLine)
  return parts
}

export function nightStoryCountLine(count) {
  const n = Number(count) || 0
  if (n <= 0) return ''
  if (n === 1) return '1 photo'
  return `${n} photos`
}

export function nightStoryLockedCopy({ lockReason, visibility, artistName } = {}) {
  if (visibility === 'fan_list' || lockReason === 'fan_list') {
    const artist = String(artistName || '').trim()
    return artist
      ? `These photos are for fans of ${artist}.`
      : 'These photos are for fans of this artist.'
  }
  return 'These photos are for the people who were there.'
}

export function safeGalleryViewerReturn(from, bandSlug) {
  const slug = String(bandSlug || '').replace(/^\/+|\/+$/g, '')
  return resolveGalleryReturn({
    from,
    artistPath: slug ? `/${slug}` : '/',
  }).to
}
