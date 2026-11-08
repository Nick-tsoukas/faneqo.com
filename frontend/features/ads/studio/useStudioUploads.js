import { ref } from 'vue'
import { STUDIO_UPLOAD_CAPTION, uploadRefFromStrapi, validateStudioImage } from './studioUploads.js'

/**
 * Upload one image through Strapi's upload plugin with the signed-in user's
 * JWT and return a studio media ref. Same path the dashboard uses for band
 * images; no band relation, so nothing public changes.
 */
export function useStudioUploads() {
  const config = useRuntimeConfig()
  const token = useStrapiToken()
  const uploading = ref(false)
  const error = ref('')

  async function upload(file) {
    error.value = ''
    const check = validateStudioImage(file)
    if (!check.ok) {
      error.value = check.error
      return null
    }
    const jwt = token.value
    if (!jwt) {
      error.value = 'Sign in to upload artwork.'
      return null
    }
    uploading.value = true
    try {
      const body = new FormData()
      body.append('files', file, file.name)
      body.append('fileInfo', JSON.stringify({ caption: STUDIO_UPLOAD_CAPTION, alternativeText: file.name }))
      const res = await fetch(`${config.public.strapiUrl}/api/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${jwt}` },
        body,
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) {
        error.value = json?.error?.message || `Upload failed (${res.status}).`
        return null
      }
      const media = Array.isArray(json) ? json[0] : json
      const mediaRef = uploadRefFromStrapi(media, { strapiUrl: config.public.strapiUrl, label: file.name.replace(/\.[a-z0-9]+$/i, '') })
      if (!mediaRef) {
        error.value = 'Upload did not return an image.'
        return null
      }
      return mediaRef
    } catch (err) {
      error.value = err?.message || 'Upload failed.'
      return null
    } finally {
      uploading.value = false
    }
  }

  return { upload, uploading, error }
}
