/**
 * Gallery loading discipline.
 *
 * Three rules, each of which exists because breaking it is visible:
 *
 *   · Decode before you commit. Completing an opening transition onto an
 *     undecoded image is how a viewer flashes black at the exact moment the
 *     fan is looking hardest. `decodePhoto` resolves when the bitmap is ready.
 *   · Only the immediate neighbours. A 100-photograph Night must never cost a
 *     fan 100 downloads; `warm` fetches exactly the previous and the next.
 *   · Cancel what nobody is waiting for. Flicking through ten photographs
 *     should leave one request alive, not ten, so every superseded fetch is
 *     detached and dropped.
 *
 * Nothing here holds a decoded bitmap. The browser's own image cache is the
 * cache; this module only decides what enters it and when.
 */

import { galleryPreloadWindow } from './galleryDismissal.js'

const CACHE_LIMIT = 24

function createImage() {
  if (typeof Image === 'undefined') return null
  return new Image()
}

/**
 * Resolve once this photograph can be painted without a flash.
 * Falls back to `load` wherever `HTMLImageElement.decode` is unavailable, and
 * resolves (never rejects) so a single bad file cannot stall a transition.
 */
export function decodePhoto(photo, { signal } = {}) {
  return new Promise((resolve) => {
    const src = photo?.src
    const image = src ? createImage() : null
    if (!image) {
      resolve(false)
      return
    }
    let settled = false
    const finish = (ok) => {
      if (settled) return
      settled = true
      image.onload = null
      image.onerror = null
      resolve(ok)
    }
    if (signal?.aborted) {
      finish(false)
      return
    }
    signal?.addEventListener?.('abort', () => {
      // Detach the request; the browser stops caring about a src-less image.
      image.src = ''
      finish(false)
    }, { once: true })

    if (photo.srcset) image.srcset = photo.srcset
    if (photo.sizes) image.sizes = photo.sizes
    image.decoding = 'async'
    image.onerror = () => finish(false)
    image.onload = () => {
      if (typeof image.decode !== 'function') {
        finish(true)
        return
      }
      image.decode().then(() => finish(true)).catch(() => finish(true))
    }
    image.src = src
  })
}

export function createGalleryPreloader() {
  /** src -> Image, kept only so a warm request can be cancelled. */
  const inFlight = new Map()
  const done = new Set()

  function remember(src) {
    done.add(src)
    if (done.size > CACHE_LIMIT) {
      const oldest = done.values().next().value
      done.delete(oldest)
    }
  }

  function drop(src) {
    const image = inFlight.get(src)
    if (!image) return
    image.onload = null
    image.onerror = null
    // Detaching the src is the only cross-browser way to abandon a fetch.
    image.src = ''
    inFlight.delete(src)
  }

  function fetchOne(photo) {
    const src = photo?.src
    if (!src || done.has(src) || inFlight.has(src)) return
    const image = createImage()
    if (!image) return
    image.decoding = 'async'
    if (photo.srcset) image.srcset = photo.srcset
    if (photo.sizes) image.sizes = photo.sizes
    image.onload = () => {
      inFlight.delete(src)
      remember(src)
    }
    image.onerror = () => inFlight.delete(src)
    inFlight.set(src, image)
    image.src = src
  }

  /**
   * Keep exactly the neighbours of `index` warm and cancel everything else.
   * Called on every index change, so rapid navigation self-cleans.
   */
  function warm(photos, index) {
    const list = Array.isArray(photos) ? photos : []
    if (!list.length) return []
    const wanted = galleryPreloadWindow(index, list.length)
      .map((n) => list[n])
      .filter((photo) => photo?.src)
    const keep = new Set(wanted.map((photo) => photo.src))
    const current = list[index]?.src
    if (current) keep.add(current)
    for (const src of [...inFlight.keys()]) {
      if (!keep.has(src)) drop(src)
    }
    wanted.forEach(fetchOne)
    return wanted.map((photo) => photo.src)
  }

  function cancel() {
    for (const src of [...inFlight.keys()]) drop(src)
  }

  return {
    warm,
    cancel,
    isWarm: (src) => done.has(String(src || '')),
    pending: () => inFlight.size,
    destroy() {
      cancel()
      done.clear()
    },
  }
}
