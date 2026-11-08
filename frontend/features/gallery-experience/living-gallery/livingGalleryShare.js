/**
 * Share abstraction. No social SDKs.
 * Lab has no canonical Gallery URLs — callers must pass url, or we use the
 * current page without hash (not a production Night/Gallery address).
 */

export function canUseNativeShare(nav = typeof navigator !== 'undefined' ? navigator : null) {
  return typeof nav?.share === 'function'
}

export function stripHash(url) {
  const raw = String(url || '')
  const i = raw.indexOf('#')
  return i >= 0 ? raw.slice(0, i) : raw
}

export function defaultGalleryShareUrl(loc = typeof location !== 'undefined' ? location : null) {
  if (!loc) return ''
  return `${loc.origin || ''}${loc.pathname || ''}${loc.search || ''}`
}

/**
 * @returns {Promise<{ ok: boolean, method: 'native' | 'clipboard' | 'none', aborted?: boolean }>}
 */
export async function shareWithFallback(payload, {
  nav = typeof navigator !== 'undefined' ? navigator : null,
  clipboard = typeof navigator !== 'undefined' ? navigator.clipboard : null,
} = {}) {
  const title = String(payload?.title || '').trim()
  const text = String(payload?.text || '').trim()
  const url = String(payload?.url || '').trim()
  const data = {}
  if (title) data.title = title
  if (text) data.text = text
  if (url) data.url = url
  if (!data.title && !data.text && !data.url) {
    return { ok: false, method: 'none' }
  }

  if (canUseNativeShare(nav)) {
    try {
      if (typeof nav.canShare === 'function' && !nav.canShare(data)) {
        // fall through to clipboard
      } else {
        await nav.share(data)
        return { ok: true, method: 'native' }
      }
    } catch (error) {
      if (error?.name === 'AbortError') return { ok: false, method: 'native', aborted: true }
    }
  }

  if (url && typeof clipboard?.writeText === 'function') {
    try {
      await clipboard.writeText(url)
      return { ok: true, method: 'clipboard' }
    } catch {
      return { ok: false, method: 'clipboard' }
    }
  }

  return { ok: false, method: 'none' }
}

export function buildGallerySharePayload({ night, url } = {}) {
  const artist = String(night?.artistName || night?.artist || '').trim()
  const title = String(night?.galleryTitle || '').trim()
  const venue = String(night?.venueName || night?.venue || '').trim()
  const line = [artist, title, venue].filter((part, index, all) => part && all.indexOf(part) === index)
  return {
    title: artist || title || 'Faneqo Gallery',
    text: line.join(' · '),
    url: url || '',
  }
}

export function buildPhotoSharePayload({ night, memory, url } = {}) {
  const gallery = buildGallerySharePayload({ night, url })
  const alt = String(memory?.alt || memory?.caption || '').trim()
  return {
    title: gallery.title,
    text: [gallery.text, alt].filter(Boolean).join(' — '),
    url: url || gallery.url,
  }
}
