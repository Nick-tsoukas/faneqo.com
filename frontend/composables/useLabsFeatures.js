/**
 * Server-resolved Labs / feature map. Frontend hiding is UX only.
 */
export function useLabsFeatures() {
  const config = useRuntimeConfig()
  const token = useStrapiToken()
  const baseUrl = config.public.strapiUrl || 'http://localhost:1337'

  async function labsGet(path, query = {}) {
    if (!token.value) {
      const err = new Error('Not found')
      err.statusCode = 404
      throw err
    }
    try {
      const res = await $fetch(`${baseUrl}${path}`, {
        headers: { Authorization: `Bearer ${token.value}` },
        query,
      })
      return res?.data || null
    } catch (err) {
      const denied = new Error('Not found')
      denied.statusCode = 404
      throw denied
    }
  }

  async function fetchLabsStatus(bandId = null) {
    const query = {}
    if (bandId) query.bandId = String(bandId)
    return labsGet('/api/labs/status', query)
  }

  async function fetchRelationshipFans(bandId, q = '') {
    return labsGet('/api/labs/relationship-fans', {
      bandId: String(bandId),
      q,
    })
  }

  async function fetchRelationshipTimeline({ bandId, fanId, cursor } = {}) {
    const query = { bandId: String(bandId), fanId: String(fanId) }
    if (cursor) query.cursor = cursor
    return labsGet('/api/labs/relationships', query)
  }

  async function fetchArtistFanProgression({ bandId, fanId } = {}) {
    return labsGet('/api/labs/relationship', {
      bandId: String(bandId),
      fanId: String(fanId),
    })
  }

  async function fetchIntegrity() {
    return labsGet('/api/labs/integrity')
  }

  async function hasLabs() {
    try {
      const data = await fetchLabsStatus()
      return Boolean(data?.features?.internal_labs)
    } catch {
      return false
    }
  }

  return {
    fetchLabsStatus,
    fetchRelationshipFans,
    fetchRelationshipTimeline,
    fetchArtistFanProgression,
    fetchIntegrity,
    hasLabs,
  }
}
