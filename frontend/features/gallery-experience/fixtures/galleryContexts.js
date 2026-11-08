/**
 * Lab presentation wrappers. Not backend Gallery schema.
 * Same photographs; different optional context.
 */

import { HIRES_DESKTOP_MEMORIES, livingGalleryMemories } from './compositionMatrix.js'
import { normalizeMemory } from '../core/experienceManifest.js'

export const GALLERY_KIND_SHOW = 'show'
export const GALLERY_KIND_GENERAL = 'general'
export const GALLERY_KIND_MINIMAL = 'minimal'

export const GALLERY_SIZE_SET = 'set'
export const GALLERY_SIZE_ONE = 'one'
export const GALLERY_SIZE_TWO = 'two'
export const GALLERY_SIZE_LARGE = 'large'
/** Desktop composition cannot be judged on ~1024px sources. Lab only. */
export const GALLERY_SIZE_HIRES = 'hires'

export function livingGalleryPresentationNight(kind, night = {}) {
  const artist = String(night?.artist || '').trim()
  if (kind === GALLERY_KIND_GENERAL) {
    return {
      artist,
      venue: '',
      city: '',
      state: '',
      date: '',
      displayDate: '',
      galleryTitle: 'SUMMER TOUR PORTRAITS',
      galleryCaption: 'Portraits from the road. No single night attached.',
      showLinked: false,
      galleryId: 'lab:summer-tour-portraits',
    }
  }
  if (kind === GALLERY_KIND_MINIMAL) {
    return {
      artist,
      venue: '',
      city: '',
      state: '',
      date: '',
      displayDate: '',
      galleryTitle: 'SUMMER TOUR PORTRAITS',
      galleryCaption: '',
      showLinked: false,
      galleryId: 'lab:minimal-gallery',
    }
  }
  return {
    artist,
    venue: String(night?.venue || '').trim(),
    city: String(night?.city || '').trim(),
    state: String(night?.state || '').trim(),
    date: String(night?.date || '').trim(),
    displayDate: String(night?.displayDate || night?.date || '').trim(),
    galleryTitle: String(night?.galleryTitle || '').trim(),
    galleryCaption: String(night?.galleryCaption || '').trim(),
    showLinked: night?.showLinked === false ? false : true,
    galleryId: String(night?.galleryId || 'lab:basement-east').trim(),
  }
}

export function livingGalleryMemorySet(source, size = GALLERY_SIZE_SET) {
  const base = livingGalleryMemories(source)
  if (size === GALLERY_SIZE_ONE) return base.slice(0, 1)
  if (size === GALLERY_SIZE_TWO) return base.slice(0, 2)
  if (size === GALLERY_SIZE_HIRES) {
    // Real high-resolution concert frames first, then the 2:3 hero so portrait
    // still has geometry to test even though no hi-res portrait exists.
    const hires = HIRES_DESKTOP_MEMORIES.map((memory, index) => normalizeMemory(memory, 200 + index))
    const portrait = base.filter((memory) => memory.id === 'matrix-23')
    return [...hires, ...portrait]
  }
  if (size === GALLERY_SIZE_LARGE) {
    const copies = []
    for (let round = 0; round < 3; round += 1) {
      for (const memory of base) {
        copies.push(round === 0 ? memory : {
          ...memory,
          id: `${memory.id}__r${round + 1}`,
        })
      }
    }
    return copies
  }
  return base
}
