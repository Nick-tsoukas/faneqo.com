/**
 * Map the existing public Gallery payload onto Gallery Page / Living Gallery
 * presentation. Not schema. Never invents venue, date, or media.
 */

import { selectGalleryMediaSource, gallerySrcset } from '../../../utils/media/faneqoGalleryLayout.js'
import { formatNightDateLong } from '../../../utils/nights/nightDisplay.js'
import { normalizeMemory } from './experienceManifest.js'

function text(value) {
  return String(value || '').trim()
}

function srcsetCandidates(item) {
  const raw = gallerySrcset(item, { role: 'lightbox' })
  if (!raw) return []
  return raw.split(',').map((part) => {
    const token = part.trim()
    const space = token.lastIndexOf(' ')
    if (space < 0) return null
    const src = token.slice(0, space).trim()
    const width = Number(String(token.slice(space + 1)).replace(/w$/i, ''))
    if (!src || !Number.isFinite(width) || width <= 0) return null
    return { src, width }
  }).filter(Boolean)
}

export function mediaItemToMemory(item, index = 0) {
  if (!item || item.unavailable === true) return null
  const lightbox = selectGalleryMediaSource(item, {
    role: 'lightbox',
    targetCssPx: 1400,
    dpr: 2,
  })
  const thumb = selectGalleryMediaSource(item, { role: 'thumb' })
  const src = text(lightbox?.url || item.largeUrl || item.url)
  if (!src) return null
  return normalizeMemory({
    id: text(item.mediaId || item.id) || `photo-${index}`,
    src,
    thumbSrc: text(thumb?.url || item.thumbnailUrl || item.thumbUrl) || src,
    mediumSrc: text(item.url) || src,
    fullSrc: text(item.largeUrl || item.originalUrl) || src,
    srcset: gallerySrcset(item, { role: 'lightbox' }) || undefined,
    srcsetCandidates: srcsetCandidates(item),
    width: item.width || lightbox?.width,
    height: item.height || lightbox?.height,
    alt: item.alt || item.alternativeText,
    caption: item.caption,
    photographer: item.photographer,
  }, index)
}

export function publicPayloadToNight(payload = {}) {
  const gallery = payload.gallery || {}
  const night = payload.night && typeof payload.night === 'object' ? payload.night : null
  const artist = payload.artist || {}
  const venue = text(night?.venue)
  const city = text(night?.city)
  const state = text(night?.region || night?.state)
  const rawDate = night?.date || night?.performanceStartsAt
  const date = formatNightDateLong(rawDate, night?.timezone)
  const showLinked = Boolean(night && (venue || city || state || date))
  return {
    artistName: text(artist.name),
    artist: text(artist.name),
    galleryTitle: text(gallery.title),
    galleryCaption: text(gallery.caption),
    galleryId: text(gallery.slug || gallery.id),
    venueName: showLinked ? venue : '',
    venue: showLinked ? venue : '',
    city: showLinked ? city : '',
    state: showLinked ? state : '',
    date: showLinked ? date : '',
    displayDate: showLinked ? date : '',
    showLinked,
  }
}

export function publicPayloadToExperience(payload = {}) {
  const gallery = payload.gallery || {}
  const locked = !!gallery.locked
  const media = locked || !Array.isArray(gallery.media) ? [] : gallery.media
  const memories = media
    .map((item, index) => mediaItemToMemory(item, index))
    .filter(Boolean)
  return {
    locked,
    memories,
    night: publicPayloadToNight(payload),
  }
}
