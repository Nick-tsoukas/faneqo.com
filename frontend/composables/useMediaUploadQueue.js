/**
 * Bounded concurrent image uploads.
 * Default strategy: public Strapi /api/upload.
 * Domain owners inject uploadFn for protected (or other) backends.
 */
import { onScopeDispose, reactive } from 'vue'
import {
  FANEQO_DM_MAX_IMAGES,
  FANEQO_IMAGE_MAX_BYTES,
  FANEQO_UPLOAD_CONCURRENCY,
  createFaneqoMediaUploadQueue,
} from '~/utils/media/faneqoMedia'
import { mediaUiLog } from '~/utils/media/mediaUiLog'

export function useMediaUploadQueue({
  maxItems = FANEQO_DM_MAX_IMAGES,
  maxBytes = FANEQO_IMAGE_MAX_BYTES,
  concurrency = FANEQO_UPLOAD_CONCURRENCY,
  uploadFn = null,
} = {}) {
  const config = useRuntimeConfig()
  const token = useStrapiToken()
  const baseUrl = config.public.strapiUrl || 'http://localhost:1337'

  async function defaultUpload(file, { signal } = {}) {
    const jwt = token.value
    if (!jwt) {
      const err = new Error('Authentication required')
      err.status = 401
      throw err
    }
    mediaUiLog('upload:start', { type: 'image', sizeBytes: file.size })
    const started = Date.now()
    const body = new FormData()
    body.append('files', file)
    const uploaded = await $fetch(`${baseUrl}/api/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${jwt}` },
      body,
      signal,
    })
    const media = Array.isArray(uploaded) ? uploaded[0] : uploaded?.[0] || uploaded
    if (!media?.id) {
      const err = new Error('Upload did not return a file')
      err.status = 500
      throw err
    }
    mediaUiLog('upload:success', { mediaId: media.id, latencyMs: Date.now() - started })
    return {
      mediaId: media.id,
      url: media.url || null,
      width: media.width || null,
      height: media.height || null,
      alt: media.alternativeText || 'Image',
      mime: media.mime || file.type,
      protected: false,
    }
  }

  async function runUpload(file, ctx = {}) {
    const options = { signal: ctx.signal }
    if (typeof uploadFn === 'function') {
      return uploadFn(file, { ...options, defaultUpload })
    }
    return defaultUpload(file, options)
  }

  const queue = createFaneqoMediaUploadQueue({
    maxItems,
    maxBytes,
    concurrency,
    uploadFn: runUpload,
    stateFactory: reactive,
    createPreviewUrl: (file) => URL.createObjectURL(file),
    revokePreviewUrl: (url) => {
      if (url && String(url).startsWith('blob:')) URL.revokeObjectURL(url)
    },
  })

  onScopeDispose(() => {
    queue.clear()
  })

  return queue
}
