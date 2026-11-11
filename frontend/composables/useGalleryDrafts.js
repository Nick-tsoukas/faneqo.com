/**
 * Gallery drafts + gallery management.
 *
 * A gallery draft is a server-side durable draft with a staged upload session.
 * The client never classifies media: the draft's audience decides whether an
 * uploaded file lands public or protected, and the server derives that. This
 * composable is a thin typed wrapper — no normalization rules of its own
 * beyond reusing `normalizeFaneqoMediaList` for staged/managed media so every
 * surface downstream sees the one Faneqo MediaItem shape.
 */
import { captionMap, numericMediaOrder, ownedCaptionMap } from '~/utils/galleries/galleryCaptions'
import { normalizeFaneqoMediaList } from '~/utils/media/faneqoMedia'

export { ownedCaptionMap } from '~/utils/galleries/galleryCaptions'

export function normalizeGalleryDraft(row) {
  if (!row || typeof row !== 'object') return null
  return {
    sessionId: String(row.sessionId || ''),
    bandId: row.bandId ?? null,
    kind: String(row.kind || 'general'),
    mode: String(row.mode || 'create'),
    visibility: String(row.visibility || 'public'),
    audienceLocked: row.audienceLocked === true,
    title: String(row.title || ''),
    caption: String(row.caption || ''),
    mediaOrder: numericMediaOrder(row.mediaOrder),
    mediaCaptions: captionMap(row.mediaCaptions),
    coverMediaId: row.coverMediaId ?? null,
    status: String(row.status || 'active'),
    showRecapId: row.showRecapId ?? null,
    eventId: row.eventId ?? null,
    editingUpdateId: row.editingUpdateId ?? null,
    returnContext: row.returnContext ?? null,
    media: normalizeFaneqoMediaList(row.media),
  }
}

export function normalizeManageGallery(row) {
  if (!row || typeof row !== 'object') return null
  const media = normalizeFaneqoMediaList(row.media)
  return {
    id: row.id ?? null,
    slug: String(row.slug || ''),
    title: String(row.title || ''),
    caption: String(row.caption || ''),
    visibility: String(row.visibility || 'public'),
    status: String(row.status || 'published'),
    kind: String(row.kind || 'general'),
    showRecapId: row.showRecapId ?? null,
    eventId: row.eventId ?? null,
    coverMediaId: row.coverMediaId ?? null,
    version: row.version ?? null,
    bandId: row.bandId ?? null,
    bandSlug: row.bandSlug ? String(row.bandSlug) : '',
    featuredOnProfile: row.featuredOnProfile === true,
    rocksnaps: normalizeRocksnaps(row.rocksnaps),
    media,
  }
}

function normalizeRocksnaps(value) {
  if (!value || typeof value !== 'object') return null
  return {
    eligible: value.eligible === true,
    enabled: value.enabled === true,
    publishedAt: value.publishedAt || null,
    canEnable: value.canEnable === true,
    reason: value.reason ? String(value.reason) : '',
  }
}

export function isVersionConflict(err) {
  const status = Number(err?.status || err?.statusCode || err?.data?.error?.status || 0)
  const name = String(err?.data?.error?.name || err?.code || '')
  return status === 409 || name === 'version_conflict'
}

export function galleryDraftErrorCode(err) {
  return String(err?.data?.error?.name || err?.data?.error?.code || err?.code || '') || null
}

export function useGalleryDrafts() {
  const config = useRuntimeConfig()
  const token = useStrapiToken()
  const baseUrl = config.public.strapiUrl || 'http://localhost:1337'

  function headers() {
    return token.value ? { Authorization: `Bearer ${token.value}` } : {}
  }

  function jsonHeaders() {
    return { ...headers(), 'Content-Type': 'application/json' }
  }

  function requireAuth() {
    if (token.value) return
    const err = new Error('Authentication required')
    err.status = 401
    throw err
  }

  function requireSession(sessionId) {
    const id = String(sessionId || '').trim()
    if (id) return id
    const err = new Error('No gallery draft session')
    err.status = 400
    err.code = 'missing_session'
    throw err
  }

  function draftResult(result) {
    if (!result?.data) return { ...result, data: null }
    return { ...result, data: normalizeGalleryDraft(result.data) }
  }

  function createDraft({ bandId, kind = 'general', showRecapId, eventId, updateId, returnContext } = {}) {
    requireAuth()
    return $fetch(`${baseUrl}/api/gallery-drafts`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: {
        bandId,
        kind,
        ...(showRecapId != null && showRecapId !== '' ? { showRecapId } : {}),
        ...(eventId != null && eventId !== '' ? { eventId } : {}),
        ...(updateId != null && updateId !== '' ? { updateId } : {}),
        ...(returnContext ? { returnContext } : {}),
      },
    }).then(draftResult)
  }

  function getActiveDraft({ bandId, kind, showRecapId, updateId } = {}) {
    requireAuth()
    return $fetch(`${baseUrl}/api/gallery-drafts/active`, {
      headers: headers(),
      query: {
        ...(bandId != null ? { bandId } : {}),
        ...(kind ? { kind } : {}),
        ...(showRecapId != null && showRecapId !== '' ? { showRecapId } : {}),
        ...(updateId != null && updateId !== '' ? { updateId } : {}),
      },
    }).then(draftResult)
  }

  function getDraft(sessionId) {
    requireAuth()
    return $fetch(`${baseUrl}/api/gallery-drafts/${requireSession(sessionId)}`, {
      headers: headers(),
    }).then(draftResult)
  }

  function patchDraft(sessionId, patch = {}) {
    requireAuth()
    const body = {}
    if (patch.title !== undefined) body.title = patch.title
    if (patch.caption !== undefined) body.caption = patch.caption
    if (patch.mediaOrder !== undefined) body.mediaOrder = numericMediaOrder(patch.mediaOrder)
    if (patch.mediaCaptions !== undefined) {
      body.mediaCaptions = patch.mediaOrder !== undefined
        ? ownedCaptionMap(patch.mediaCaptions, patch.mediaOrder)
        : captionMap(patch.mediaCaptions)
    }
    if (patch.coverMediaId !== undefined) body.coverMediaId = patch.coverMediaId
    if (patch.showRecapId !== undefined) body.showRecapId = patch.showRecapId
    if (patch.eventId !== undefined) body.eventId = patch.eventId
    if (patch.returnContext !== undefined) body.returnContext = patch.returnContext
    return $fetch(`${baseUrl}/api/gallery-drafts/${requireSession(sessionId)}`, {
      method: 'PATCH',
      headers: jsonHeaders(),
      body,
    }).then(draftResult)
  }

  /**
   * Audience is a decision, not a filter. Changing it after files are staged
   * requires `confirmClear` because the staged files were classified under the
   * old audience and have to be re-uploaded.
   */
  function setAudience(sessionId, { visibility, confirmClear = false } = {}) {
    requireAuth()
    return $fetch(`${baseUrl}/api/gallery-drafts/${requireSession(sessionId)}/audience`, {
      method: 'PUT',
      headers: jsonHeaders(),
      body: { visibility, ...(confirmClear ? { confirmClear: true } : {}) },
    }).then(draftResult)
  }

  async function uploadDraftMedia(sessionId, file, { signal } = {}) {
    requireAuth()
    const id = requireSession(sessionId)
    const body = new FormData()
    body.append('files', file)
    const result = await $fetch(`${baseUrl}/api/gallery-drafts/${id}/media`, {
      method: 'POST',
      headers: headers(),
      body,
      signal,
    })
    const media = result?.data || result
    const mediaId = media?.mediaId ?? media?.id
    if (mediaId == null || mediaId === '') {
      const err = new Error('Upload did not return a file')
      err.status = 500
      throw err
    }
    return {
      mediaId,
      id: mediaId,
      url: media.url || null,
      thumbUrl: media.thumbUrl || media.thumbnailUrl || media.url || null,
      width: media.width || null,
      height: media.height || null,
      alt: 'Image',
      mime: media.mime || file?.type || null,
      size: media.size || file?.size || null,
      protected: media.protected === true,
    }
  }

  function removeDraftMedia(sessionId, mediaId) {
    requireAuth()
    return $fetch(`${baseUrl}/api/gallery-drafts/${requireSession(sessionId)}/media/${mediaId}`, {
      method: 'DELETE',
      headers: headers(),
    })
  }

  /**
   * Idempotent publish. The same key returns the same published row, so a
   * double-click or a network retry can never mint a second gallery.
   */
  function publishDraft(sessionId, { publishIdempotencyKey, showOnArtistPage } = {}) {
    requireAuth()
    const body = { publishIdempotencyKey }
    if (showOnArtistPage === true || showOnArtistPage === false) body.showOnArtistPage = showOnArtistPage
    return $fetch(`${baseUrl}/api/gallery-drafts/${requireSession(sessionId)}/publish`, {
      method: 'POST',
      headers: jsonHeaders(),
      body,
    }).then((result) => {
      if (!result?.data) return result
      return { ...result, data: { ...result.data, media: normalizeFaneqoMediaList(result.data.media) } }
    })
  }

  function discardDraft(sessionId) {
    requireAuth()
    return $fetch(`${baseUrl}/api/gallery-drafts/${requireSession(sessionId)}`, {
      method: 'DELETE',
      headers: headers(),
    })
  }

  /** Management read. Never the public payload — editing needs owner truth. */
  function getManageGallery(id) {
    requireAuth()
    return $fetch(`${baseUrl}/api/artist-updates/${id}/manage`, {
      headers: headers(),
    }).then((result) => {
      if (!result?.data) return result
      return { ...result, data: normalizeManageGallery(result.data) }
    })
  }

  function saveManageGallery(id, {
    version,
    title,
    caption,
    mediaOrder,
    mediaCaptions,
    coverMediaId,
    visibility,
    sessionId,
  } = {}) {
    requireAuth()
    return $fetch(`${baseUrl}/api/artist-updates/${id}/manage`, {
      method: 'PATCH',
      headers: jsonHeaders(),
      body: {
        version,
        title,
        caption,
        mediaOrder: numericMediaOrder(mediaOrder),
        mediaCaptions: mediaOrder !== undefined
          ? ownedCaptionMap(mediaCaptions, mediaOrder)
          : captionMap(mediaCaptions),
        coverMediaId: coverMediaId ?? null,
        visibility,
        ...(sessionId ? { sessionId } : {}),
      },
    }).then((result) => {
      if (!result?.data) return result
      return { ...result, data: normalizeManageGallery(result.data) }
    })
  }

  function featureGalleryOnProfile(id) {
    requireAuth()
    return $fetch(`${baseUrl}/api/artist-updates/${id}/feature-on-profile`, {
      method: 'POST',
      headers: jsonHeaders(),
    })
  }

  function unfeatureGalleryOnProfile(id) {
    requireAuth()
    return $fetch(`${baseUrl}/api/artist-updates/${id}/unfeature-on-profile`, {
      method: 'POST',
      headers: jsonHeaders(),
    })
  }

  function setRocksnapsPublication(id, showOnRockSnaps) {
    requireAuth()
    return $fetch(`${baseUrl}/api/artist-updates/${id}/rocksnaps`, {
      method: 'PATCH',
      headers: jsonHeaders(),
      body: { showOnRockSnaps: showOnRockSnaps === true },
    })
  }

  function getArtistPagePlacement(bandId) {
    requireAuth()
    return $fetch(`${baseUrl}/api/artist-updates/artist-page-placement`, {
      headers: headers(),
      query: { bandId },
    })
  }

  function getRocksnapsCapability(bandId) {
    requireAuth()
    return $fetch(`${baseUrl}/api/artist-updates/rocksnaps-capability`, {
      headers: headers(),
      query: { bandId },
    })
  }

  return {
    createDraft,
    getActiveDraft,
    getDraft,
    patchDraft,
    setAudience,
    uploadDraftMedia,
    removeDraftMedia,
    publishDraft,
    discardDraft,
    getManageGallery,
    saveManageGallery,
    featureGalleryOnProfile,
    unfeatureGalleryOnProfile,
    setRocksnapsPublication,
    getArtistPagePlacement,
    getRocksnapsCapability,
  }
}
