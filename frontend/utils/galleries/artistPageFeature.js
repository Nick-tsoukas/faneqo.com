/**
 * Artist-page feature state for the Galleries index.
 * Presentation of band.featuredGallery. It does not store a second flag.
 *
 * Eligibility matches the backend feature rules: published, public, and at
 * least one photo. The server remains the authority on the write.
 */
import { galleryPhotoCount, galleryTitle } from './archiveShelves.js'
import { platePhotoLabel } from './archivePlates.js'

export function featureProfileBlock(item) {
  const status = String(item?.status || '').toLowerCase()
  if (status === 'hidden') {
    return { eligible: false, reason: 'Restore first', detail: 'This gallery is hidden.' }
  }
  if (status !== 'published') {
    return { eligible: false, reason: 'Publish first', detail: 'Publish this gallery before featuring it.' }
  }
  if (String(item?.visibility || '') !== 'public') {
    return { eligible: false, reason: 'Make public first', detail: 'Make this gallery public before featuring it on your artist profile.' }
  }
  if (galleryPhotoCount(item) < 1) {
    return { eligible: false, reason: 'Add photos first', detail: 'Add a photo before featuring this gallery.' }
  }
  return { eligible: true, reason: '', detail: '' }
}

export function artistPageFeatureView(items) {
  const rows = Array.isArray(items) ? items : []
  const gallery = rows.find((item) => item && item.featuredOnProfile === true) || null
  if (!gallery) return { kind: 'none', gallery: null, block: null }
  const block = featureProfileBlock(gallery)
  return {
    kind: block.eligible ? 'featured' : 'attention',
    gallery,
    block,
  }
}

/** Featuring replaces the previous selection. Removing clears it. */
export function applyArtistPageFeature(items, id, featuredOnProfile) {
  const target = Number(id)
  const on = featuredOnProfile === true && Number.isFinite(target)
  return (Array.isArray(items) ? items : []).map((item) => ({
    ...item,
    featuredOnProfile: on && Number(item?.id) === target,
  }))
}

export function galleryCoverUrl(item) {
  const media = Array.isArray(item?.media) ? item.media : []
  for (const file of media) {
    const url = file?.formats?.thumbnail?.url || file?.previewUrl || file?.url || file?.src
    if (url) return url
  }
  return ''
}

export function artistPageFeatureCopy(gallery) {
  return {
    title: galleryTitle(gallery),
    count: platePhotoLabel(gallery),
  }
}
