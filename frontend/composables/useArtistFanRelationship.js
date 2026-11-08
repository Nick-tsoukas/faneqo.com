/**
 * Production Artist × Fan relationship read.
 * Authorization is enforced by Strapi; frontend hiding is UX only.
 */
export function useArtistFanRelationship() {
  const config = useRuntimeConfig()
  const token = useStrapiToken()
  const baseUrl = config.public.strapiUrl || 'http://localhost:1337'

  async function fetchArtistFanRelationship({ bandId, fanId } = {}) {
    const bid = Number(bandId)
    const fid = Number(fanId)
    if (!token.value || !Number.isInteger(bid) || bid <= 0 || !Number.isInteger(fid) || fid <= 0) {
      const error = new Error('Fan relationship unavailable')
      error.statusCode = 404
      throw error
    }

    try {
      const response = await $fetch(`${baseUrl}/api/artist-fan-relationships/${fid}`, {
        headers: { Authorization: `Bearer ${token.value}` },
        query: { bandId: String(bid) },
      })
      return response?.data || null
    } catch (cause) {
      const statusCode = Number(cause?.statusCode || cause?.response?.status) || 500
      const error = new Error(
        statusCode === 404
          ? 'Fan relationship unavailable'
          : 'Could not load this fan relationship'
      )
      error.statusCode = statusCode
      throw error
    }
  }

  return { fetchArtistFanRelationship }
}
