/**
 * Gallery Doorway presentation. Reuses LG-D019 flexible context.
 * Not Galleries Home. One collection. Never invents show identity.
 */

import {
  joinContextParts,
  normalizeLivingGalleryContext,
} from '../living-gallery/livingGalleryContext.js'

function text(value) {
  return String(value || '').trim()
}

export function doorwayPhotoCount(memories = []) {
  return Array.isArray(memories) ? memories.filter((row) => row?.src).length : 0
}

export function doorwayCountLabel(count) {
  const n = Math.max(0, Number(count) || 0)
  if (n === 1) return '1 photograph'
  return `${n} photographs`
}

export function normalizeDoorwayContext(night = {}, memories = []) {
  const ctx = normalizeLivingGalleryContext(night)
  const count = doorwayPhotoCount(memories)
  const place = joinContextParts([
    joinContextParts([ctx.city, ctx.state], ' '),
    ctx.date,
  ])
  const collection = ctx.showLinked
    ? (ctx.galleryTitle && ctx.galleryTitle !== ctx.venueName ? ctx.galleryTitle : ctx.venueName)
    : ctx.galleryTitle
  const caption = ctx.galleryCaption
  return {
    artist: ctx.artistName,
    collection,
    venue: ctx.venueName,
    place,
    date: ctx.date,
    caption,
    captionShort: caption.length > 88 ? `${caption.slice(0, 86).trim()}…` : caption,
    captionLong: caption.length > 88,
    count,
    countLabel: doorwayCountLabel(count),
    showLinked: ctx.showLinked,
    galleryId: ctx.galleryId,
    galleryTitle: ctx.galleryTitle,
  }
}
