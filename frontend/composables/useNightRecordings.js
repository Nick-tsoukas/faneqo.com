/**
 * Artist Night Recording management API.
 * Public Night reads recordings[] from the public Night payload.
 */
import { humanizeRecordingError } from '~/utils/nights/nightRecordings'

export function useNightRecordings() {
  const config = useRuntimeConfig()
  const token = useStrapiToken()
  const jwtCookie = useCookie('strapi_jwt')
  const baseUrl = config.public.strapiUrl || 'http://localhost:1337'

  function readJwt() {
    return String(token.value || jwtCookie.value || '').trim()
  }

  function authRequiredError() {
    const error = new Error('Authentication required')
    error.status = 401
    error.statusCode = 401
    return error
  }

  async function recapHeaders() {
    const jwt = readJwt()
    if (!jwt) throw authRequiredError()
    return { Authorization: `Bearer ${jwt}` }
  }

  function wrap(error) {
    const next = new Error(humanizeRecordingError(error))
    next.status = Number(error?.status || error?.statusCode || error?.data?.error?.status || 0)
    next.code = error?.data?.error?.name || error?.error || ''
    next.cause = error
    return next
  }

  async function listForNight(recapId) {
    try {
      const response = await $fetch(`${baseUrl}/api/show-recaps/${recapId}/recordings`, {
        headers: await recapHeaders(),
      })
      return Array.isArray(response?.data) ? response.data : []
    } catch (error) {
      throw wrap(error)
    }
  }

  async function createForNight(recapId, body = {}) {
    try {
      const response = await $fetch(`${baseUrl}/api/show-recaps/${recapId}/recordings`, {
        method: 'POST',
        headers: await recapHeaders(),
        body,
      })
      return response?.data || null
    } catch (error) {
      throw wrap(error)
    }
  }

  async function updateRecording(recordingId, body = {}) {
    try {
      const response = await $fetch(`${baseUrl}/api/night-recordings/${recordingId}`, {
        method: 'PATCH',
        headers: await recapHeaders(),
        body,
      })
      return response?.data || null
    } catch (error) {
      throw wrap(error)
    }
  }

  async function removeRecording(recordingId) {
    try {
      const response = await $fetch(`${baseUrl}/api/night-recordings/${recordingId}`, {
        method: 'DELETE',
        headers: await recapHeaders(),
      })
      return response?.data || { id: recordingId, deleted: true }
    } catch (error) {
      throw wrap(error)
    }
  }

  async function uploadRecordingFile(file, { signal, onProgress } = {}) {
    const jwt = readJwt()
    if (!jwt) throw authRequiredError()
    const body = new FormData()
    body.append('files', file)

    if (typeof XMLHttpRequest !== 'undefined' && typeof onProgress === 'function') {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('POST', `${baseUrl}/api/upload`)
        xhr.setRequestHeader('Authorization', `Bearer ${jwt}`)
        xhr.upload.onprogress = (event) => {
          if (!event.lengthComputable) return
          onProgress(Math.round((event.loaded / event.total) * 100))
        }
        xhr.onload = () => {
          try {
            const uploaded = JSON.parse(xhr.responseText)
            const media = Array.isArray(uploaded) ? uploaded[0] : uploaded?.[0] || uploaded
            if (!media?.id) {
              reject(wrap(new Error('Upload did not return a file')))
              return
            }
            resolve(media)
          } catch (error) {
            reject(wrap(error))
          }
        }
        xhr.onerror = () => reject(wrap(new Error('Upload failed')))
        xhr.onabort = () => reject(wrap(new Error('Upload canceled')))
        if (signal) {
          signal.addEventListener('abort', () => xhr.abort(), { once: true })
        }
        xhr.send(body)
      })
    }

    try {
      const uploaded = await $fetch(`${baseUrl}/api/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${jwt}` },
        body,
        signal,
      })
      const media = Array.isArray(uploaded) ? uploaded[0] : uploaded?.[0] || uploaded
      if (!media?.id) throw new Error('Upload did not return a file')
      return media
    } catch (error) {
      throw wrap(error)
    }
  }

  return {
    listForNight,
    createForNight,
    updateRecording,
    removeRecording,
    uploadRecordingFile,
  }
}
