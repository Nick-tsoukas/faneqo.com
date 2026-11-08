/**
 * Deterministic gallery composition. Presentation only.
 * Does not mutate MediaItem[] or invent cover identity.
 *
 * media[0] is always cover. 5+ truncates embedded cells, not the source array.
 */
import { resolveFaneqoMediaSrc } from './faneqoMedia.js'

export function mediaAspectRatio(item) {
  const direct = Number(item?.aspectRatio)
  if (Number.isFinite(direct) && direct > 0) return direct
  const width = Number(item?.width)
  const height = Number(item?.height)
  if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) {
    return width / height
  }
  return null
}

export function mediaOrientation(item) {
  const ratio = mediaAspectRatio(item)
  if (ratio == null) return 'unknown'
  if (ratio < 0.62) return 'extreme-portrait'
  if (ratio < 0.95) return 'portrait'
  if (ratio <= 1.18) return 'square'
  if (ratio >= 2.05) return 'extreme-landscape'
  return 'landscape'
}

export function isWideOrientation(orientation) {
  return orientation === 'landscape' || orientation === 'extreme-landscape'
}

export function galleryEmbeddedLimit(total) {
  const count = Number(total) || 0
  if (count <= 4) return Math.max(0, count)
  return 4
}

export function galleryOverflowCount(total) {
  const count = Number(total) || 0
  return Math.max(0, count - 4)
}

export function galleryLayoutKind(items) {
  const list = Array.isArray(items) ? items : []
  const count = list.length
  if (count <= 0) return 'empty'
  if (count === 1) return 'editorial'
  if (count === 2) {
    if (isWideOrientation(mediaOrientation(list[0])) && isWideOrientation(mediaOrientation(list[1]))) {
      return 'pair-stack'
    }
    return 'pair-split'
  }
  if (count === 3) {
    return selectThreePhotoKind(list)
  }
  if (count === 4) {
    return isWideOrientation(mediaOrientation(list[0])) ? 'mosaic-top' : 'mosaic-side'
  }
  return 'opening'
}

export function galleryLayoutPlan(items) {
  const list = Array.isArray(items) ? items : []
  const total = list.length
  const kind = galleryLayoutKind(list)
  return {
    kind,
    total,
    visible: galleryEmbeddedLimit(total),
    overflow: galleryOverflowCount(total),
    coverOrientation: total ? mediaOrientation(list[0]) : 'unknown',
    coverAspect: total ? mediaAspectRatio(list[0]) : null,
  }
}

export function galleryCellRole(kind, index) {
  if (kind === 'editorial' || kind === 'pair-split' || kind === 'pair-stack') return 'hero'
  return index === 0 ? 'hero' : 'support'
}

const GALLERY_SRC_TARGETS = {
  hero: 1100,
  support: 720,
  thumb: 160,
  lightbox: 1400,
}

function finiteDim(value) {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? n : null
}

function pushCandidate(list, seen, { url, width, height, key }) {
  const href = url ? String(url) : ''
  if (!href || seen.has(href)) return
  seen.add(href)
  list.push({
    url: href,
    width: finiteDim(width),
    height: finiteDim(height),
    key,
  })
}

export function collectGallerySourceCandidates(item) {
  if (!item) return []
  const list = []
  const seen = new Set()
  const formats = item.formats && typeof item.formats === 'object' ? item.formats : {}
  for (const key of ['thumbnail', 'small', 'medium', 'large']) {
    const format = formats[key]
    if (format?.url) {
      pushCandidate(list, seen, {
        url: format.url,
        width: format.width,
        height: format.height,
        key,
      })
    }
  }
  pushCandidate(list, seen, {
    url: item.thumbnailUrl || item.thumbUrl,
    width: formats.thumbnail?.width,
    height: formats.thumbnail?.height,
    key: 'thumbnail',
  })
  pushCandidate(list, seen, {
    url: item.url,
    width: formats.medium?.width || item.width,
    height: formats.medium?.height || item.height,
    key: formats.medium?.url === item.url ? 'medium' : 'display',
  })
  pushCandidate(list, seen, {
    url: item.largeUrl,
    width: formats.large?.width || item.width,
    height: formats.large?.height || item.height,
    key: formats.large?.url === item.largeUrl ? 'large' : 'largeUrl',
  })
  pushCandidate(list, seen, {
    url: item.originalUrl,
    width: item.width,
    height: item.height,
    key: 'original',
  })
  pushCandidate(list, seen, {
    url: item.previewUrl,
    width: item.width,
    height: item.height,
    key: 'preview',
  })
  return list
}

export const LEAD_CROP_GUARD = 0.28

export function coverCropLoss(sourceRatio, wrapperRatio) {
  const source = finiteDim(sourceRatio)
  const wrapper = finiteDim(wrapperRatio)
  if (!source || !wrapper) return 0
  return source > wrapper ? 1 - wrapper / source : 1 - source / wrapper
}

function threePhotoScore(items, kind) {
  const leadRatio = mediaAspectRatio(items[0]) || 1.5
  const a = mediaAspectRatio(items[1]) || 1
  const b = mediaAspectRatio(items[2]) || 1
  if (kind === 'mosaic-top') {
    const leadWrap = galleryLeadAspect(items[0])
    return {
      kind,
      leadLoss: coverCropLoss(leadRatio, leadWrap),
      supportLoss: (coverCropLoss(a, 1) + coverCropLoss(b, 1)) / 2,
    }
  }
  const supportWrap = (0.34 * leadRatio) / 0.33
  return {
    kind,
    leadLoss: 0,
    supportLoss: (coverCropLoss(a, supportWrap) + coverCropLoss(b, supportWrap)) / 2,
  }
}

export function selectThreePhotoKind(items) {
  const list = Array.isArray(items) ? items : []
  if (list.length !== 3) return galleryLayoutKind(list)
  if (!isWideOrientation(mediaOrientation(list[0]))) return 'hero-support'
  const stack = threePhotoScore(list, 'mosaic-top')
  const beside = threePhotoScore(list, 'hero-support')
  if (stack.leadLoss > LEAD_CROP_GUARD) return 'hero-support'
  const stackTotal = stack.leadLoss * 2.2 + stack.supportLoss
  const besideTotal = beside.leadLoss * 2.2 + beside.supportLoss
  return besideTotal + 0.05 < stackTotal ? 'hero-support' : 'mosaic-top'
}

const SRCSET_KEYS = new Set(['small', 'medium', 'large', 'original', 'display', 'largeUrl'])

export function gallerySrcset(item, { role = 'hero' } = {}) {
  if (!item || item.protected) return ''
  const allowThumb = role === 'thumb'
  const rows = collectGallerySourceCandidates(item)
    .filter((row) => row.url && row.width)
    .filter((row) => (allowThumb ? row.width <= 400 : SRCSET_KEYS.has(row.key)))
    .sort((a, b) => a.width - b.width)
  const unique = []
  const seen = new Set()
  for (const row of rows) {
    if (seen.has(row.width)) continue
    seen.add(row.width)
    unique.push(row)
  }
  return unique.map((row) => `${row.url} ${row.width}w`).join(', ')
}

export function resolveGallerySrcset(srcset, origin) {
  const raw = String(srcset || '').trim()
  if (!raw) return ''
  return raw.split(',').map((part) => {
    const token = part.trim()
    const space = token.lastIndexOf(' ')
    if (space < 0) return resolveFaneqoMediaSrc(token, origin)
    return `${resolveFaneqoMediaSrc(token.slice(0, space), origin)} ${token.slice(space + 1)}`
  }).join(', ')
}

export function gallerySizes(role = 'hero', surface = 'page') {
  if (role === 'thumb') return '72px'
  if (role === 'lightbox') return '100vw'
  if (role === 'support') {
    return surface === 'viewer'
      ? '(min-width: 720px) 48vw, 48vw'
      : '(min-width: 720px) 32vw, 46vw'
  }
  return surface === 'viewer'
    ? '(min-width: 720px) min(92vw, 82.5rem), 94vw'
    : '(min-width: 720px) 42vw, 94vw'
}

export function gallerySourceFitsSlot(sourceWidth, targetCssPx) {
  const width = finiteDim(sourceWidth)
  const target = finiteDim(targetCssPx)
  if (!width || !target) return true
  return width >= target * 0.72
}

export function selectGalleryMediaSource(item, {
  role = 'hero',
  targetCssPx,
  dpr = 2,
} = {}) {
  if (!item) return null
  const allowThumbnail = role === 'thumb'
  const target = finiteDim(targetCssPx) || GALLERY_SRC_TARGETS[role] || GALLERY_SRC_TARGETS.hero
  const need = target * Math.min(Math.max(Number(dpr) || 1, 1), 2)
  let candidates = collectGallerySourceCandidates(item)
  if (!candidates.length) return null
  if (!allowThumbnail) {
    const withoutThumb = candidates.filter((row) => row.key !== 'thumbnail' && row.key !== 'preview')
    if (withoutThumb.length) candidates = withoutThumb
  } else {
    const thumb = candidates.find((row) => row.key === 'thumbnail')
      || candidates.find((row) => row.key === 'small')
      || candidates[0]
    return thumb
      ? { ...thumb, fit: 'cover' }
      : null
  }

  const ranked = [...candidates].sort((a, b) => (a.width || 0) - (b.width || 0))
  const enough = ranked.filter((row) => row.width && row.width >= need * 0.85)
  const picked = enough[0] || ranked[ranked.length - 1]
  if (!picked) return null
  const fit = role === 'lightbox' || gallerySourceFitsSlot(picked.width, target)
    ? (role === 'lightbox' ? 'contain' : 'cover')
    : 'contain'
  return {
    url: picked.url,
    width: picked.width,
    height: picked.height,
    key: picked.key,
    fit,
  }
}

export function galleryCellSrc(item, role = 'hero', options = {}) {
  return selectGalleryMediaSource(item, { role, ...options })?.url || null
}

export function galleryLeadAspect(item, kind = 'mosaic-top') {
  const ratio = mediaAspectRatio(item)
  if (!ratio) return kind === 'hero-support' ? 0.75 : 1.5
  if (kind === 'hero-support') return Math.max(0.68, Math.min(ratio, 1.85))
  return Math.max(1.28, Math.min(ratio, 1.72))
}

export function galleryCoverStyle(item, kind) {
  const ratio = mediaAspectRatio(item)
  if (kind === 'editorial') {
    const value = ratio || 1
    return { aspectRatio: String(Math.max(0.68, Math.min(value, 1.85))) }
  }
  if (kind === 'opening' || kind === 'mosaic-top') return undefined
  return ratio ? { aspectRatio: String(ratio) } : undefined
}

export function galleryPairStyle(item) {
  const ratio = mediaAspectRatio(item)
  if (!ratio) return undefined
  return { aspectRatio: String(ratio) }
}
