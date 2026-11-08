/**
 * Modular chrome placement + truthful info fields.
 * Placement tokens can change without rewriting control behavior.
 * Context is presentation-only — see livingGalleryContext.js.
 */

import {
  livingGalleryEditorialLines,
  livingGalleryInfoGroups,
  livingGalleryInfoRows,
  livingGalleryVisibleContext,
  normalizeLivingGalleryContext,
} from './livingGalleryContext.js'

/** Brief discoverability, then the photograph. Calmer than Pass 01's 1.75s. */
export const CHROME_IDLE_MS = 2400

/** Fade duration for chrome / dock (CSS mirrored). */
export const CHROME_FADE_MS = 220

export const PURE_VIEW_A = 'A'
export const PURE_VIEW_B = 'B'

export const CHROME_DIRECT = 'direct'
export const CHROME_HIERARCHICAL = 'hierarchical'
/** @deprecated Doorway / MORE. Product chrome is Photos + Info + Share. */
export const CHROME_CONTEXTUAL = 'contextual'

export const CHROME_REGION = Object.freeze({
  CLOSE: 'top-left',
  INDEX: 'top-right',
  IDENTITY: 'bottom-left',
  SECONDARY: 'bottom-right',
})

export const LIVING_GALLERY_CONTROL = Object.freeze({
  CLOSE: 'close',
  INDEX: 'index',
  MORE: 'more',
  PHOTOS: 'photos',
  THUMBNAILS: 'thumbnails',
  INFO: 'info',
  SHARE: 'share',
})

export function formatLivingGalleryIndex(index, total) {
  const n = Math.max(0, Number(total) || 0)
  const i = n ? Math.min(n, Math.max(1, (Number(index) || 0) + 1)) : 0
  return `${String(i).padStart(2, '0')} / ${String(n).padStart(2, '0')}`
}

export function livingGalleryInfoFields(night = {}, memory = null, options = {}) {
  const ctx = normalizeLivingGalleryContext(night, { memory })
  const groups = livingGalleryInfoGroups(night, memory, options)
  return {
    artist: ctx.artistName,
    venue: ctx.venueName,
    city: ctx.city,
    date: ctx.date,
    photographer: ctx.photographer,
    galleryTitle: ctx.galleryTitle,
    caption: String(memory?.caption || ctx.galleryCaption || '').trim(),
    groups,
    lines: livingGalleryEditorialLines(night, memory, options),
    rows: livingGalleryInfoRows(night, memory, options),
  }
}

export function livingGalleryIdentityLines(night = {}, options = {}) {
  return livingGalleryVisibleContext(normalizeLivingGalleryContext(night), options)
}
