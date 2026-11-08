import { normalizeFaneqoMediaList } from '~/utils/media/faneqoMedia'

function publicHeaders(token, authenticated) {
  if (!authenticated) return {}
  const jwt = String(token || '').trim()
  return jwt ? { Authorization: `Bearer ${jwt}` } : {}
}

function normalizeGalleryCard(row) {
  if (!row) return row
  return {
    ...row,
    media: row.locked ? [] : normalizeFaneqoMediaList(row.media),
  }
}

function normalizeNightPayload(data) {
  if (!data) return null
  return {
    ...data,
    galleries: Array.isArray(data.galleries)
      ? data.galleries.map(normalizeGalleryCard)
      : data.galleries,
  }
}

function normalizeGalleryPayload(data) {
  if (!data) return null
  return {
    ...data,
    gallery: data.gallery ? normalizeGalleryCard(data.gallery) : data.gallery,
  }
}

export function usePublicNight() {
  const config = useRuntimeConfig()
  const token = useStrapiToken()
  const baseUrl = config.public.strapiUrl || 'http://localhost:1337'

  async function getNight({ bandSlug, nightSlug, authenticated = false } = {}) {
    const result = await $fetch(
      `${baseUrl}/api/public/bands/${encodeURIComponent(bandSlug)}/nights/${encodeURIComponent(nightSlug)}`,
      { headers: publicHeaders(token.value, authenticated) },
    )
    return normalizeNightPayload(result?.data || null)
  }

  async function listGalleries({ bandSlug } = {}) {
    const result = await $fetch(
      `${baseUrl}/api/public/bands/${encodeURIComponent(bandSlug)}/galleries`,
    )
    const data = result?.data || null
    return {
      artist: data?.artist || null,
      galleries: Array.isArray(data?.galleries) ? data.galleries : [],
    }
  }

  async function getGallery({ bandSlug, gallerySlug, authenticated = false } = {}) {
    const result = await $fetch(
      `${baseUrl}/api/public/bands/${encodeURIComponent(bandSlug)}/galleries/${encodeURIComponent(gallerySlug)}`,
      { headers: publicHeaders(token.value, authenticated) },
    )
    return normalizeGalleryPayload(result?.data || null)
  }

  return { getNight, getGallery, listGalleries }
}
