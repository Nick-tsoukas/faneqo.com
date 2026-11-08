/**
 * Transient selected-photo handoff from Gallery Stack → Gallery.
 * Preview UI only. Never cover identity, never share/canonical.
 */
import { clampStackIndex, stackActivatePayload } from '../media/faneqoGalleryStack.js'
import { galleryPath } from '../nights/publicNightPaths.js'
import { selectGalleryMediaSource } from '../media/faneqoGalleryLayout.js'
import { resolveFaneqoMediaSrc } from '../media/faneqoMedia.js'

export const STACK_OPEN_INDEX_KEY = 'fqGalleryPhoto'
export const STACK_OPEN_PRINT_KEY = 'fqGalleryPrint'
export const STACK_PHOTO_QUERY = 'photo'

function text(value) {
  return String(value || '').trim()
}

function safeToken(value) {
  return text(value).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 48)
}

export function stackPrintTransitionName(galleryId, media) {
  const gallery = safeToken(galleryId) || 'g'
  const mediaId = safeToken(media?.mediaId || media?.id)
  if (!mediaId) return ''
  return `fq-gprint-${gallery}-${mediaId}`
}

export function authorizedStackIndex(index, media) {
  const list = Array.isArray(media) ? media.filter((item) => item && item.unavailable !== true) : []
  if (!list.length) return null
  return clampStackIndex(index, list.length)
}

/**
 * Public Night overlay handoff. Resolves only against already-authorized
 * Gallery media. Never looks up a hidden item by media id.
 */
export function resolveNightGalleryOpen({
  gallery,
  payload,
  rememberedIndex,
} = {}) {
  if (!gallery || gallery.locked) {
    return { index: null, autoOpen: false }
  }
  const media = Array.isArray(gallery.media) ? gallery.media : []
  if (authorizedStackIndex(0, media) == null) {
    return { index: null, autoOpen: false }
  }

  const fromPayload = payload && payload.index != null && payload.index !== ''
    ? Number(payload.index)
    : NaN
  const fromMemory = Number(rememberedIndex)
  const raw = Number.isFinite(fromPayload)
    ? fromPayload
    : (Number.isFinite(fromMemory) ? fromMemory : 0)
  const index = authorizedStackIndex(raw, media)
  if (index == null) return { index: null, autoOpen: false }
  return {
    index,
    autoOpen: Number.isFinite(fromPayload),
  }
}

export function readGalleryOpenIntent({
  state,
  query,
  media,
} = {}) {
  const list = Array.isArray(media) ? media.filter((item) => item && item.unavailable !== true) : []
  if (!list.length) return { index: null, printName: '' }

  const fromState = Number(state?.[STACK_OPEN_INDEX_KEY])
  const rawQuery = query?.[STACK_PHOTO_QUERY]
  const fromQuery = rawQuery == null || rawQuery === ''
    ? NaN
    : Number(Array.isArray(rawQuery) ? rawQuery[0] : rawQuery) - 1

  let index = null
  if (Number.isFinite(fromState) && fromState >= 0) index = fromState
  else if (Number.isFinite(fromQuery) && fromQuery >= 0) index = fromQuery

  if (index == null) return { index: null, printName: '' }
  const clamped = authorizedStackIndex(index, list)
  if (clamped == null) return { index: null, printName: '' }
  const printName = text(state?.[STACK_OPEN_PRINT_KEY])
  return { index: clamped, printName }
}

export function manageGalleryLocation(item, bandSlug, {
  index = 0,
  from = '/galleries',
  base = '',
} = {}) {
  const slug = text(item?.slug)
  const path = text(base)
    ? `${text(base).replace(/\/+$/, '')}/${slug}`
    : galleryPath(bandSlug, slug)
  if (!path || !slug) {
    return { path: from || '/galleries', query: {} }
  }
  const payload = stackActivatePayload(item?.media, index)
  const query = {}
  if (from) query.from = from
  query[STACK_PHOTO_QUERY] = String(payload.index + 1)
  return {
    path,
    query,
    state: {
      [STACK_OPEN_INDEX_KEY]: payload.index,
      [STACK_OPEN_PRINT_KEY]: stackPrintTransitionName(item?.id, payload.media),
    },
  }
}

export function stackDestinationSrc(item, origin) {
  if (!item) return ''
  const pick = selectGalleryMediaSource(item, {
    role: 'lightbox',
    targetCssPx: 1400,
    dpr: 2,
  })
  return resolveFaneqoMediaSrc(pick?.url || item.largeUrl || item.url, origin)
}

export async function navigateGalleryOpen(router, location, {
  reduced = false,
} = {}) {
  if (!router?.push || !location?.path) return null
  const go = () => router.push(location)
  if (reduced || typeof document === 'undefined' || typeof document.startViewTransition !== 'function') {
    return go()
  }
  try {
    document.startViewTransition(() => {
      go()
    })
    return null
  } catch {
    return go()
  }
}
