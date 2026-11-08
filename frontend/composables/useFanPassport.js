import { normalizeFaneqoMediaList } from '~/utils/media/faneqoMedia'

export function useFanPassport() {
  const config = useRuntimeConfig()
  const token = useStrapiToken()
  const baseUrl = config.public.strapiUrl || 'http://localhost:1337'

  function authHeaders() {
    if (!token.value) {
      const error = new Error('Authentication required')
      error.status = 401
      throw error
    }
    return { Authorization: `Bearer ${token.value}` }
  }

  function normalizeGallery(gallery) {
    if (!gallery) return gallery
    return { ...gallery, media: normalizeFaneqoMediaList(gallery.media) }
  }

  function normalizeSave(row) {
    if (!row) return row
    return { ...row, gallery: normalizeGallery(row.gallery) }
  }

  async function listMemories() {
    const result = await $fetch(`${baseUrl}/api/fan-passport/memories`, {
      headers: authHeaders(),
    })
    return {
      memories: result?.data?.memories || [],
      count: Number(result?.data?.count || 0),
      artistCount: Number(result?.data?.artistCount || 0),
    }
  }

  async function getMemory(attendanceId) {
    const result = await $fetch(`${baseUrl}/api/fan-passport/memories/${attendanceId}`, {
      headers: authHeaders(),
    })
    return result?.data?.memory || null
  }

  async function listGallerySaves() {
    const result = await $fetch(`${baseUrl}/api/fan-passport/galleries`, {
      headers: authHeaders(),
    })
    return {
      galleries: (result?.data?.galleries || []).map(normalizeSave),
      count: Number(result?.data?.count || 0),
    }
  }

  async function saveGallery(artistUpdateId) {
    const result = await $fetch(`${baseUrl}/api/fan-passport/galleries/${artistUpdateId}/save`, {
      method: 'POST',
      headers: authHeaders(),
    })
    return normalizeSave(result?.data)
  }

  async function removeGallery(artistUpdateId) {
    const result = await $fetch(`${baseUrl}/api/fan-passport/galleries/${artistUpdateId}/save`, {
      method: 'DELETE',
      headers: authHeaders(),
    })
    return result?.data || { saved: false, artistUpdateId }
  }

  return { listMemories, getMemory, listGallerySaves, saveGallery, removeGallery }
}
