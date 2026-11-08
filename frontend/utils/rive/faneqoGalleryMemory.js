/**
 * Gallery Memory is presentation only. ArtistUpdate remains the gallery owner
 * and FanPassport saves only the authorized ArtistUpdate reference.
 */

export const FANEQO_GALLERY_MEMORY_SRC = '/rive/faneqo-gallery-memory.riv'
export const FANEQO_GALLERY_MEMORY_ARTBOARD = 'GalleryMemory'
export const FANEQO_GALLERY_MEMORY_STATE_MACHINE = 'GalleryMemory'
export const FANEQO_GALLERY_MEMORY_VIEW_MODEL = 'GalleryMemory'

export const FANEQO_GALLERY_MEMORY_PROPS = {
  artistName: 'artistName',
  photoCount: 'photoCount',
  saving: 'saving',
  saved: 'saved',
  save: 'save',
  remove: 'remove',
}

let assetProbe = null

export function probeFaneqoGalleryMemoryAsset() {
  if (typeof window === 'undefined') return Promise.resolve(false)
  if (assetProbe) return assetProbe
  assetProbe = fetch(FANEQO_GALLERY_MEMORY_SRC, { method: 'HEAD', cache: 'force-cache' })
    .then((response) => {
      if (response.ok) return true
      if (response.status === 405 || response.status === 501) {
        return fetch(FANEQO_GALLERY_MEMORY_SRC, { method: 'GET', cache: 'force-cache' })
          .then((fallbackResponse) => fallbackResponse.ok)
      }
      return false
    })
    .catch(() => false)
  return assetProbe
}
