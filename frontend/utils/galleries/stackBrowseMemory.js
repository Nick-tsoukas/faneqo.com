/**
 * Session-local Gallery Stack browse position.
 * Preview UI only — never a cover, never backend truth.
 */
const memory = new Map()

export function rememberStackIndex(galleryId, index) {
  const id = String(galleryId || '').trim()
  if (!id) return
  memory.set(id, clampRemembered(index))
}

export function recalledStackIndex(galleryId, fallback = 0) {
  const id = String(galleryId || '').trim()
  if (!id || !memory.has(id)) return clampRemembered(fallback)
  return memory.get(id)
}

function clampRemembered(index) {
  const n = Math.floor(Number(index))
  return Number.isFinite(n) && n > 0 ? n : 0
}

const scrollMemory = new Map()

export function rememberArchiveScroll(path, y) {
  const key = String(path || '').split('?')[0]
  const n = Math.floor(Number(y))
  if (!key || !Number.isFinite(n) || n < 0) return
  scrollMemory.set(key, n)
}

export function recalledArchiveScroll(path, fallback = 0) {
  const key = String(path || '').split('?')[0]
  if (!key || !scrollMemory.has(key)) return Math.max(0, Math.floor(Number(fallback)) || 0)
  return scrollMemory.get(key)
}

export const ARCHIVE_SCROLL_TOLERANCE = 48

export function isGalleryArchivePath(path) {
  const key = String(path || '').split('?')[0]
  return key === '/galleries' || key === '/__dev/galleries-archive'
}

/**
 * Router savedPosition is primary on Back.
 * Session memory is fallback only when the window is still at the top.
 * Never apply a second visible correction if router already landed nearby.
 */
export function archiveScrollRestorePlan({
  currentY,
  rememberedY,
} = {}) {
  const current = Math.max(0, Math.floor(Number(currentY)) || 0)
  const remembered = Math.max(0, Math.floor(Number(rememberedY)) || 0)
  if (remembered < 24) return { apply: false, y: remembered, owner: 'none' }
  if (Math.abs(current - remembered) <= ARCHIVE_SCROLL_TOLERANCE) {
    return { apply: false, y: current, owner: current > 24 ? 'router' : 'already' }
  }
  if (current <= 24) {
    return { apply: true, y: remembered, owner: 'session' }
  }
  return { apply: false, y: current, owner: 'router' }
}

const HINT_KEY = 'fq-stack-hint-v3'

export function consumeStackHint() {
  if (typeof sessionStorage === 'undefined') return false
  try {
    if (sessionStorage.getItem(HINT_KEY)) return false
    sessionStorage.setItem(HINT_KEY, '1')
    return true
  } catch {
    return false
  }
}
