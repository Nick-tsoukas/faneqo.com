import { normalizeFaneqoMediaList } from '~/utils/media/faneqoMedia'

export function useArtistUpdates() {
  const config = useRuntimeConfig()
  const token = useStrapiToken()
  const baseUrl = config.public.strapiUrl || 'http://localhost:1337'

  function headers() {
    return token.value ? { Authorization: `Bearer ${token.value}` } : {}
  }

  function requireAuth() {
    if (token.value) return
    const err = new Error('Authentication required')
    err.status = 401
    throw err
  }

  function normalizeUpdate(row) {
    if (!row) return row
    return { ...row, media: normalizeFaneqoMediaList(row.media) }
  }

  function listForBand({ bandId, bandSlug }) {
    return $fetch(`${baseUrl}/api/artist-updates`, {
      headers: headers(),
      query: {
        ...(bandId ? { bandId } : {}),
        ...(bandSlug ? { bandSlug } : {}),
      },
    }).then((result) => {
      if (!result?.data?.updates) return result
      return {
        ...result,
        data: {
          ...result.data,
          updates: result.data.updates.map(normalizeUpdate),
        },
      }
    })
  }

  function listMine({ bandId }) {
    requireAuth()
    return $fetch(`${baseUrl}/api/artist-updates/manage`, {
      headers: headers(),
      query: { bandId },
    }).then((result) => {
      if (!Array.isArray(result?.data)) return result
      return { ...result, data: result.data.map(normalizeUpdate) }
    })
  }

  function getBySlug({ bandSlug, slug }) {
    return $fetch(`${baseUrl}/api/artist-updates/by-slug`, {
      headers: headers(),
      query: { bandSlug, slug },
    }).then((result) => {
      if (!result?.data) return result
      return { ...result, data: normalizeUpdate(result.data) }
    })
  }

  function getById(id) {
    return $fetch(`${baseUrl}/api/artist-updates/${id}`, {
      headers: headers(),
    }).then((result) => {
      if (!result?.data) return result
      return { ...result, data: normalizeUpdate(result.data) }
    })
  }

  function publish({ bandId, title, bodyText, visibility, mediaIds, eventId, showRecapId, campaignId, publishIdempotencyKey }) {
    return $fetch(`${baseUrl}/api/artist-updates`, {
      method: 'POST',
      headers: { ...headers(), 'Content-Type': 'application/json' },
      body: { bandId, title, bodyText, visibility, mediaIds, eventId, showRecapId, campaignId, publishIdempotencyKey },
    }).then((result) => {
      if (!result?.data) return result
      return { ...result, data: normalizeUpdate(result.data) }
    })
  }

  function manageAction(id, action) {
    requireAuth()
    return $fetch(`${baseUrl}/api/artist-updates/${id}/${action}`, {
      method: 'PATCH',
      headers: { ...headers(), 'Content-Type': 'application/json' },
    }).then((result) => {
      if (!result?.data) return result
      return { ...result, data: normalizeUpdate(result.data) }
    })
  }

  function hide(id) {
    return manageAction(id, 'hide')
  }

  function restore(id) {
    return manageAction(id, 'restore')
  }

  function detachFromRecap(id) {
    return manageAction(id, 'detach-recap')
  }

  function getDeliveryStatus({ signal } = {}) {
    return $fetch(`${baseUrl}/api/artist-updates/delivery`, {
      headers: headers(),
      signal,
    })
  }

  async function uploadProtectedMedia(file, { bandId, signal, deliveryReady } = {}) {
    requireAuth()
    if (deliveryReady !== true) {
      const delivery = await getDeliveryStatus({ signal })
      if (delivery?.data?.ready !== true) {
        const err = new Error('Protected delivery is not available.')
        err.status = 503
        err.code = 'gated_delivery_unavailable'
        throw err
      }
    }
    const body = new FormData()
    body.append('files', file)
    if (bandId != null && bandId !== '') body.append('bandId', String(bandId))
    const result = await $fetch(`${baseUrl}/api/artist-updates/media`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token.value}` },
      body,
      signal,
    })
    const media = result?.data || result
    if (!media?.id) {
      const err = new Error('Upload did not return a file')
      err.status = 500
      throw err
    }
    return {
      mediaId: media.id,
      id: media.id,
      width: media.width || null,
      height: media.height || null,
      alt: 'Image',
      mime: media.mime || 'image/webp',
      protected: true,
    }
  }

  return {
    listForBand,
    listMine,
    getBySlug,
    getById,
    publish,
    hide,
    restore,
    detachFromRecap,
    getDeliveryStatus,
    uploadProtectedMedia,
  }
}
