/**
 * Short-lived session hop so leaving the broadcast composer to create a
 * Gallery can return with the same message. Not a Drafts product.
 */

import { isSafeDraftKey } from '../updates/galleryComposerReturn.js'

export const COMPOSER_GALLERY_HOP_PREFIX = 'faneqo.composer-gallery-hop.'
export const COMPOSER_GALLERY_HOP_MAX_AGE_MS = 6 * 60 * 60 * 1000

export function composerGalleryHopScope({ bandId, audienceType, recapId } = {}) {
  return [String(bandId || ''), String(audienceType || ''), String(recapId || '')].join(':')
}

export function createComposerGalleryDraftKey() {
  const raw = (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
  return String(raw).replace(/[^A-Za-z0-9_-]/g, '').slice(0, 36)
}

function latestKey(scope) {
  return `${COMPOSER_GALLERY_HOP_PREFIX}latest:${scope}`
}

function hopKey(draftKey) {
  return `${COMPOSER_GALLERY_HOP_PREFIX}${draftKey}`
}

export function saveComposerGalleryHop(storage, payload = {}) {
  if (!storage?.setItem) return null
  const draftKey = isSafeDraftKey(payload.draftKey)
    ? String(payload.draftKey)
    : createComposerGalleryDraftKey()
  const row = {
    draftKey,
    bandId: String(payload.bandId || ''),
    audienceType: String(payload.audienceType || ''),
    recapId: payload.recapId == null || payload.recapId === '' ? '' : String(payload.recapId),
    channel: payload.channel === 'email' ? 'email' : 'in_app',
    subject: String(payload.subject || ''),
    note: String(payload.note || ''),
    savedAt: Date.now(),
  }
  storage.setItem(hopKey(draftKey), JSON.stringify(row))
  storage.setItem(latestKey(composerGalleryHopScope(row)), draftKey)
  return draftKey
}

export function loadComposerGalleryHop(storage, {
  draftKey,
  bandId,
  audienceType,
  recapId,
} = {}) {
  if (!storage?.getItem) return null
  const scope = composerGalleryHopScope({ bandId, audienceType, recapId })
  const key = isSafeDraftKey(draftKey) ? String(draftKey) : storage.getItem(latestKey(scope))
  if (!isSafeDraftKey(key)) return null
  try {
    const row = JSON.parse(storage.getItem(hopKey(key)) || '')
    if (!row || typeof row !== 'object') return null
    if (Date.now() - Number(row.savedAt || 0) > COMPOSER_GALLERY_HOP_MAX_AGE_MS) return null
    if (String(row.bandId || '') !== String(bandId || '')) return null
    if (String(row.audienceType || '') !== String(audienceType || '')) return null
    if (String(row.recapId || '') !== String(recapId || '')) return null
    return row
  } catch {
    return null
  }
}

export function clearComposerGalleryHop(storage, {
  draftKey,
  bandId,
  audienceType,
  recapId,
} = {}) {
  if (!storage?.removeItem) return
  const scope = composerGalleryHopScope({ bandId, audienceType, recapId })
  if (isSafeDraftKey(draftKey)) storage.removeItem(hopKey(draftKey))
  const latest = storage.getItem(latestKey(scope))
  if (!draftKey || latest === draftKey) storage.removeItem(latestKey(scope))
}
