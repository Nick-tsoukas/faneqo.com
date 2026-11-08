/**
 * Living Gallery icon vocabulary — Lucide only.
 * Aligns with Faneqo product icons (`utils/messages/faneqoIcons.js`).
 * Do not mix Heroicons / Iconify / Unicode glyphs here.
 */
import { GalleryThumbnails, Info, Share2, X } from '@lucide/vue'

/** Match FANEQO_ICON_STROKE in utils/messages/faneqoIcons.js */
export const LIVING_GALLERY_ICON_STROKE = 1.75
/** Visual glyph size — 18–20px optical. Hit target is CSS 44px+. */
export const LIVING_GALLERY_ICON_SIZE = 18

export const LIVING_GALLERY_ICON_FAMILY = 'lucide'

/*
 * `Images` carries an inner mountain glyph that turns to mush at 18px and reads
 * heavier than Info / Share. `GalleryThumbnails` is a print above a strip of
 * frames — literally what Photos opens — and matches their sparse ink.
 */
export const livingGalleryIcons = Object.freeze({
  close: X,
  photos: GalleryThumbnails,
  thumbnails: GalleryThumbnails,
  info: Info,
  share: Share2,
})

export function livingGalleryIcon(name) {
  return livingGalleryIcons[name] || null
}
