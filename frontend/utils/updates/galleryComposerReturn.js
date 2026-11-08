/**
 * Post-publish "Use in original message" is only for an explicit
 * campaign-composer return. `from` alone is a navigation path, not intent.
 */

const COMPOSER_PATH = '/messages/compose'
const SAFE_DRAFT_KEY = /^[A-Za-z0-9_-]{8,64}$/

export function isSafeInternalPath(value) {
  const raw = String(value || '')
  return raw.startsWith('/') && !raw.startsWith('//') && !raw.includes('://')
}

export function isSafeDraftKey(value) {
  return SAFE_DRAFT_KEY.test(String(value || ''))
}

export function isGalleryComposerReturn({ from, returnGallery } = {}) {
  if (String(returnGallery || '') !== '1') return false
  if (!isSafeInternalPath(from)) return false
  try {
    const url = new URL(String(from), 'https://faneqo.local')
    return url.pathname === COMPOSER_PATH
  } catch {
    return false
  }
}

export function composerReturnBase(from) {
  if (!isSafeInternalPath(from)) return COMPOSER_PATH
  try {
    const url = new URL(String(from), 'https://faneqo.local')
    if (url.pathname !== COMPOSER_PATH) return `${url.pathname}${url.search}`
    url.searchParams.delete('galleryId')
    url.searchParams.delete('draftKey')
    return `${url.pathname}${url.search}`
  } catch {
    return COMPOSER_PATH
  }
}

export function buildGalleryComposerResume({ from, returnGallery, galleryId, draftKey } = {}) {
  if (!isGalleryComposerReturn({ from, returnGallery })) return null
  try {
    const url = new URL(String(from), 'https://faneqo.local')
    const id = String(galleryId || '').trim()
    if (id) url.searchParams.set('galleryId', id)
    else url.searchParams.delete('galleryId')
    if (isSafeDraftKey(draftKey)) url.searchParams.set('draftKey', String(draftKey))
    return `${url.pathname}${url.search}`
  } catch {
    return null
  }
}

export function buildGalleryComposerReturn({ from, returnGallery, galleryId, draftKey } = {}) {
  const id = String(galleryId || '').trim()
  if (!id) return null
  return buildGalleryComposerResume({ from, returnGallery, galleryId: id, draftKey })
}

export function buildComposerGalleryCreateQuery({
  bandId,
  from,
  audienceType,
  recapId,
  draftKey,
} = {}) {
  const returnFrom = composerReturnBase(from)
  const query = {
    bandId: String(bandId || ''),
    from: returnFrom,
  }
  if (isGalleryComposerReturn({ from: returnFrom, returnGallery: '1' })) {
    query.returnGallery = '1'
  }
  if (isSafeDraftKey(draftKey)) query.draftKey = String(draftKey)
  if (audienceType === 'show_attendees' && recapId) {
    query.recapId = String(recapId)
    query.context = 'show'
  } else if (audienceType === 'all_fans') {
    query.context = 'general'
  }
  return query
}

export function isComposerGalleryCreatePath(path) {
  const raw = String(path || '')
  return raw === '/galleries/new' || raw.startsWith('/galleries/new?')
}

export function isCompatibleBroadcastGallery(row, { audienceType, recapId } = {}) {
  if (!row?.id) return false
  if (row.locked || row.unavailable) return false
  const status = String(row.status || 'published')
  if (status !== 'published') return false
  if (audienceType === 'all_fans') return row.visibility === 'public'
  if (audienceType === 'show_attendees') {
    return row.visibility === 'show_attendees'
      && String(row.showRecapId || row.show?.showRecapId || '') === String(recapId || '')
  }
  return Boolean(row.show) || row.visibility === 'public'
}
