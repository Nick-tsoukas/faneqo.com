/**
 * Gallery editor save-state.
 *
 * Two rules the Save button depends on, kept pure so they can be tested
 * without a component:
 *
 * 1. A gallery version is a non-negative integer. Every gallery is created at
 *    version 0 and only climbs when the editor saves, so `0` is the normal
 *    state of a gallery that has never been edited — not a missing version.
 *    Treating it as missing is what disabled Save on every untouched gallery.
 *
 * 2. "Changed" is decided the way the server decides it: trimmed title and
 *    caption, the resolved cover (an absent or removed cover falls back to the
 *    first photo), the ordered photo ids, and only the captions that belong to
 *    photos still in the gallery. A snapshot taken on load and compared with
 *    the live form is what keeps Save quiet until something meaningful moved.
 */
import { numericMediaOrder, ownedCaptionMap } from './galleryCaptions.js'

export function hasGalleryVersion(version) {
  if (version === null || version === undefined || version === '') return false
  const number = Number(version)
  return Number.isInteger(number) && number >= 0
}

/** Mirrors the server: a cover that is not in the gallery resolves to the first photo. */
export function resolveGalleryCover(coverMediaId, mediaOrder) {
  const ids = numericMediaOrder(mediaOrder)
  if (!ids.length) return null
  if (coverMediaId != null && coverMediaId !== '') {
    const wanted = String(coverMediaId)
    const hit = ids.find((id) => String(id) === wanted)
    if (hit !== undefined) return hit
  }
  return ids[0]
}

export function galleryEditSnapshot({
  title,
  caption,
  visibility,
  coverMediaId,
  mediaOrder,
  mediaCaptions,
} = {}) {
  const ids = numericMediaOrder(mediaOrder)
  const captions = {}
  const owned = ownedCaptionMap(mediaCaptions, ids)
  for (const id of ids) {
    const text = String(owned[String(id)] ?? '').trim()
    if (text) captions[String(id)] = text
  }
  return {
    title: String(title ?? '').trim(),
    caption: String(caption ?? '').trim(),
    visibility: String(visibility || 'public'),
    coverMediaId: resolveGalleryCover(coverMediaId, ids),
    mediaOrder: ids.map(String),
    captions,
  }
}

export function galleryEditDirty(baseline, current) {
  if (!baseline || !current) return false
  return JSON.stringify(baseline) !== JSON.stringify(current)
}

/**
 * Why Save is unavailable, in words a person can act on. Empty when Save is
 * allowed, or when the only reason is that nothing has changed yet.
 */
export function galleryEditSaveBlock({
  saving,
  uploadingCount,
  failedCount,
  photoCount,
  hasVersion,
} = {}) {
  if (saving) return ''
  if (!hasVersion) return 'This gallery could not be loaded for editing. Reload and try again.'
  if (uploadingCount > 0) {
    return uploadingCount === 1
      ? 'Wait for the photo to finish uploading.'
      : `Wait for ${uploadingCount} photos to finish uploading.`
  }
  if (failedCount > 0) {
    return failedCount === 1
      ? 'Retry or remove the failed photo before saving.'
      : `Retry or remove the ${failedCount} failed photos before saving.`
  }
  if (!(photoCount > 0)) return 'A gallery needs at least one photo.'
  return ''
}
