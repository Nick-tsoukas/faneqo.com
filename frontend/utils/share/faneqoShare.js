/**
 * Canonical public share helper for Night and Gallery destinations.
 * No analytics. Prefer the OS share sheet, then clipboard.
 */

import { toAbsoluteFrontendUrl } from '../site/faneqoOrigin.js'
import { stripNavFrom } from '../nights/artistWorldReturn.js'

function legacyCopy(text, documentObject) {
  if (!documentObject?.body || typeof documentObject.execCommand !== 'function') return false
  const input = documentObject.createElement('textarea')
  input.value = text
  input.setAttribute('readonly', '')
  input.style.position = 'fixed'
  input.style.opacity = '0'
  documentObject.body.appendChild(input)
  input.select()
  const copied = documentObject.execCommand('copy')
  input.remove()
  return copied
}

/**
 * A deliberate fragment, e.g. the open photograph inside a gallery.
 * `stripNavFrom` removes any hash that arrived on the path, so this is the
 * only way a fragment reaches a share URL — and it can only ever be a simple
 * token, never a second query string or another path.
 */
function normalizeShareHash(hash) {
  const raw = String(hash || '').trim().replace(/^#+/, '')
  const safe = raw.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64)
  return safe ? `#${safe}` : ''
}

export function faneqoShareUrl({ canonicalPath, origin, hash } = {}) {
  const url = toAbsoluteFrontendUrl(stripNavFrom(canonicalPath), origin)
  if (!url) return null
  return `${url}${normalizeShareHash(hash)}`
}

export async function shareFaneqoUrl({
  title,
  text,
  canonicalPath,
  origin,
  hash,
} = {}, environment = {}) {
  const navigatorObject = environment.navigator || (typeof navigator !== 'undefined' ? navigator : null)
  const windowObject = environment.window || (typeof window !== 'undefined' ? window : null)
  const documentObject = environment.document || (typeof document !== 'undefined' ? document : null)
  const url = faneqoShareUrl({
    canonicalPath,
    origin: origin || windowObject?.location?.origin,
    hash,
  })
  if (!url) {
    const err = new Error('Link is unavailable')
    err.code = 'share_unavailable'
    throw err
  }

  const payload = {
    title: String(title || '').trim() || 'Faneqo',
    text: String(text || '').trim(),
    url,
  }

  if (typeof navigatorObject?.share === 'function') {
    await navigatorObject.share(payload)
    return { method: 'share', url }
  }
  if (typeof navigatorObject?.clipboard?.writeText === 'function') {
    await navigatorObject.clipboard.writeText(url)
    return { method: 'copy', url }
  }
  if (legacyCopy(url, documentObject)) {
    return { method: 'copy', url }
  }
  const err = new Error('Could not copy this link')
  err.code = 'share_unavailable'
  throw err
}
