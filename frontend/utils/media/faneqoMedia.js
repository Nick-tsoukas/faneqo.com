/**
 * Shared Faneqo media primitives — DM attachments and Artist Updates.
 * Layer 2 only: normalize, validate, queue. Never log URLs, captions, or paths.
 */

/* HEIC/HEIF are accepted here and converted to a web format server-side, so an
   iPhone photo can be picked straight from the camera roll. */
export const FANEQO_IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
export const FANEQO_IMAGE_MAX_BYTES = 8 * 1024 * 1024
export const FANEQO_DM_MAX_IMAGES = 4
export const FANEQO_UPDATE_MAX_IMAGES = 60
export const FANEQO_SHOW_MAX_IMAGES = 60
export const FANEQO_UPLOAD_CONCURRENCY = 3
export const FANEQO_SHOW_UPLOAD_CONCURRENCY = 2
export const FANEQO_PHOTO_CAPTION_MAX = 300
export const FANEQO_SHOW_TOO_MANY_COPY = 'Galleries can include up to 60 photos.'
export const FANEQO_IMAGE_HEIC_COPY = 'That iPhone photo could not be read. Try exporting it as JPEG.'
export const FANEQO_IMAGE_UNSUPPORTED_COPY = 'This photo format isn’t supported yet. Choose a JPEG, PNG, HEIC, or WebP.'
export const FANEQO_IMAGE_TOO_LARGE_COPY = 'Photos can be up to 8 MB.'

function isHeicLike(file) {
  const mime = String(file?.type || file?.mime || '').toLowerCase()
  const name = String(file?.name || '').toLowerCase()
  return mime === 'image/heic' || mime === 'image/heif' || /\.hei[cf]$/.test(name)
}

export function validateFaneqoImageFile(file, { maxBytes = FANEQO_IMAGE_MAX_BYTES } = {}) {
  if (!file) return { error: 'missing', message: 'Choose an image' }
  /* Some browsers hand over an empty type for a camera-roll HEIC, so the
     filename is the only signal. Accept it and let the server decode. */
  const declared = String(file.type || '').toLowerCase()
  const mime = declared || (isHeicLike(file) ? 'image/heic' : '')
  if (!FANEQO_IMAGE_MIMES.includes(mime)) {
    return { error: 'invalid_type', message: FANEQO_IMAGE_UNSUPPORTED_COPY }
  }
  if (file.size > maxBytes) {
    return { error: 'too_large', message: FANEQO_IMAGE_TOO_LARGE_COPY }
  }
  return { error: null, mime, sizeBytes: file.size }
}

export function humanizeFaneqoUploadError(err) {
  const status = Number(err?.status || err?.statusCode || err?.data?.error?.status || 0)
  const name = String(err?.data?.error?.name || err?.code || err?.name || '')
  const raw = String(err?.data?.error?.message || err?.message || '')
  if (status === 413 || name === 'too_large' || /too large|entity too large|413/i.test(raw)) {
    return FANEQO_IMAGE_TOO_LARGE_COPY
  }
  if (name === 'invalid_type' || /heic|heif|mime|unsupported media type/i.test(raw)) {
    if (/heic|heif/i.test(raw)) return FANEQO_IMAGE_HEIC_COPY
    return FANEQO_IMAGE_UNSUPPORTED_COPY
  }
  if (name === 'upload_timeout' || status === 408) {
    return 'Upload took too long. Tap Retry.'
  }
  if (name === 'gated_delivery_unavailable' || status === 503) {
    return 'Photo attachments aren’t available right now.'
  }
  return raw || 'Upload failed'
}

export function aspectRatioFromDimensions(width, height) {
  const w = Number(width)
  const h = Number(height)
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return null
  return w / h
}

export function faneqoMediaIdentity(item) {
  if (!item || typeof item !== 'object') return null
  if (item.mediaId != null && item.mediaId !== '') return String(item.mediaId)
  if (item.id != null && item.id !== '') return String(item.id)
  return null
}

export function faneqoMediaKey(item, index = 0) {
  const id = faneqoMediaIdentity(item)
  if (id) return `media:${id}`
  if (item?.localId) return `local:${item.localId}`
  return `idx:${index}`
}

function isInternalProtectedPlaceholder(url) {
  return String(url || '').startsWith('faneqo-protected://')
}

function displayableUrl(url) {
  const raw = url ? String(url) : ''
  if (!raw || isInternalProtectedPlaceholder(raw)) return null
  return raw
}

/**
 * Protected delivery paths are relative `/api/...` capability URLs.
 * Prefix the Strapi origin so <img> does not hit the Nuxt host.
 * Never treat the signed URL as identity.
 */
export function resolveFaneqoMediaSrc(url, origin) {
  const raw = String(url || '')
  if (!raw) return raw
  if (raw.startsWith('blob:') || raw.startsWith('data:')) return raw
  if (/^https?:\/\//i.test(raw)) return raw
  if (raw.startsWith('/api/') && origin) {
    return `${String(origin).replace(/\/+$/, '')}${raw}`
  }
  return raw
}

function sanitizePublicFormats(formats) {
  if (!formats || typeof formats !== 'object' || Array.isArray(formats)) return null
  const out = {}
  for (const [key, value] of Object.entries(formats)) {
    const url = displayableUrl(value?.url)
    if (!url) continue
    out[key] = {
      url,
      width: value.width || null,
      height: value.height || null,
    }
  }
  return Object.keys(out).length ? out : null
}

function pickPublicDerivatives(raw, fileUrl) {
  const formats = raw.formats && typeof raw.formats === 'object' ? raw.formats : {}
  const thumbnail = displayableUrl(
    raw.thumbnailUrl || raw.thumbUrl || formats.thumbnail?.url || formats.thumb?.url || formats.small?.url
  )
  const display = displayableUrl(formats.medium?.url || formats.small?.url || fileUrl)
  const large = displayableUrl(raw.largeUrl || formats.large?.url || formats.medium?.url || fileUrl)
  const derivativeUrls = new Set(
    [thumbnail, display, large, formats.thumbnail?.url, formats.small?.url, formats.medium?.url, formats.large?.url]
      .filter(Boolean)
      .map((value) => String(value))
  )
  const namedOriginal = displayableUrl(raw.originalUrl)
  const recovered = fileUrl && !derivativeUrls.has(fileUrl) ? fileUrl : null
  return {
    url: display || fileUrl,
    thumbnailUrl: thumbnail || display || fileUrl,
    largeUrl: large || display || fileUrl,
    originalUrl: namedOriginal || recovered || null,
    formats: sanitizePublicFormats(formats),
  }
}

/**
 * Read-layer MediaItem. Not a database entity.
 * Identity is Upload.file id (mediaId) — never a rotating signed URL.
 */
export function normalizeFaneqoMedia(raw, { order = null } = {}) {
  if (!raw || typeof raw !== 'object') return null
  const previewUrl = raw.previewUrl && String(raw.previewUrl).startsWith('blob:')
    ? String(raw.previewUrl)
    : null
  const fileUrl = displayableUrl(raw.url)
  const protectedFlag = raw.protected === true
  let url = fileUrl
  let thumbnailUrl = displayableUrl(raw.thumbnailUrl || raw.thumbUrl)
  let largeUrl = displayableUrl(raw.largeUrl)
  let originalUrl = displayableUrl(raw.originalUrl)
  let formats = null

  if (protectedFlag) {
    url = fileUrl
    thumbnailUrl = thumbnailUrl || url
    largeUrl = largeUrl || url
    originalUrl = null
  } else {
    const picked = pickPublicDerivatives(raw, fileUrl)
    url = picked.url
    thumbnailUrl = picked.thumbnailUrl
    largeUrl = picked.largeUrl
    originalUrl = picked.originalUrl
    formats = picked.formats
  }

  if (!url) url = previewUrl
  if (!url && !(protectedFlag && (raw.unavailable === true || raw.mediaId || raw.id))) return null
  if (!thumbnailUrl) thumbnailUrl = previewUrl || url
  if (!largeUrl) largeUrl = url

  const mediaId = raw.mediaId != null && raw.mediaId !== '' ? raw.mediaId : (raw.id != null ? raw.id : null)
  const width = raw.width || null
  const height = raw.height || null
  const item = {
    type: 'image',
    id: mediaId,
    mediaId,
    url,
    thumbnailUrl,
    thumbUrl: thumbnailUrl,
    largeUrl,
    originalUrl: protectedFlag ? null : originalUrl,
    mime: raw.mime || null,
    width,
    height,
    aspectRatio: raw.aspectRatio != null && Number.isFinite(Number(raw.aspectRatio))
      ? Number(raw.aspectRatio)
      : aspectRatioFromDimensions(width, height),
    order: order != null ? order : (raw.order != null ? raw.order : null),
    alt: raw.alt || raw.alternativeText || 'Image',
    protected: protectedFlag,
    unavailable: protectedFlag && (!url || raw.unavailable === true),
  }
  if (previewUrl) item.previewUrl = previewUrl
  if (raw.caption) item.caption = raw.caption
  if (formats) item.formats = formats
  return item
}

export function normalizeFaneqoMediaList(raw) {
  const list = Array.isArray(raw) ? raw : raw ? [raw] : []
  return list
    .map((item, index) => normalizeFaneqoMedia(item, { order: item?.order != null ? item.order : index }))
    .filter(Boolean)
}

export function collectMessageAttachments(row) {
  if (!row) return []
  if (Array.isArray(row.attachments) && row.attachments.length) {
    return normalizeFaneqoMediaList(row.attachments)
  }
  if (row.attachment) return normalizeFaneqoMediaList([row.attachment])
  return []
}

export function mediaPreviewLabel(count) {
  const n = Number(count) || 0
  if (n <= 0) return ''
  if (n === 1) return 'Photo'
  return `${n} photos`
}

export function isMediaPreviewLabel(text) {
  const t = String(text || '').trim()
  return t === 'Photo' || /^\d+ photos$/.test(t)
}

export function isAbortError(err) {
  if (!err) return false
  if (err.name === 'AbortError' || err.code === 'ABORT_ERR') return true
  return /aborted|AbortError/i.test(String(err.message || ''))
}

/**
 * Presentation-agnostic upload queue. Domain owners inject uploadFn.
 * Default public /api/upload lives in useMediaUploadQueue, not here.
 */
export function createFaneqoMediaUploadQueue({
  maxItems = FANEQO_DM_MAX_IMAGES,
  maxBytes = FANEQO_IMAGE_MAX_BYTES,
  concurrency = FANEQO_UPLOAD_CONCURRENCY,
  uploadFn,
  createPreviewUrl = () => null,
  revokePreviewUrl = () => {},
  stateFactory = (value) => value,
} = {}) {
  // The queue mutates this object from async upload callbacks. Nuxt passes
  // Vue's reactive() here so those transitions invalidate composer computed
  // state (busy -> ready/failed). Pure tests can keep the identity default.
  const state = stateFactory({
    items: [],
    maxItems,
  })
  let seq = 0
  let active = 0
  const waiters = []
  const controllers = new Map()
  const generation = new Map()

  function currentGen(localId) {
    return generation.get(localId) || 0
  }

  function bumpGeneration(localId) {
    const next = currentGen(localId) + 1
    generation.set(localId, next)
    return next
  }

  function find(localId) {
    return state.items.find((item) => item.localId === localId)
  }

  function revoke(row) {
    if (row?.previewUrl) revokePreviewUrl(row.previewUrl)
  }

  async function withSlot(fn) {
    if (active >= concurrency) {
      await new Promise((resolve) => waiters.push(resolve))
    }
    active += 1
    try {
      return await fn()
    } finally {
      active -= 1
      const next = waiters.shift()
      if (next) next()
    }
  }

  async function runUpload(localId, file) {
    if (!find(localId)) return
    const gen = currentGen(localId)
    const controller = new AbortController()
    controllers.set(localId, controller)
    const live = find(localId)
    if (!live) {
      controllers.delete(localId)
      return
    }
    live.state = 'uploading'
    live.error = null
    try {
      if (typeof uploadFn !== 'function') {
        throw new Error('Upload is not configured')
      }
      const media = await uploadFn(file, { signal: controller.signal })
      if (currentGen(localId) !== gen || !find(localId)) return
      const mediaId = media?.mediaId || media?.id
      if (!mediaId) {
        throw new Error('Upload did not return a file')
      }
      const current = find(localId)
      if (!current || currentGen(localId) !== gen) return
      current.state = 'ready'
      current.mediaId = mediaId
      current.width = media.width || null
      current.height = media.height || null
      current.alt = media.alt || 'Image'
      current.mime = media.mime || file?.type || null
      current.protected = !!media.protected
      current.error = null
      current.thumbUrl = media.thumbUrl || media.thumbnailUrl || null
      // Once a real derivative exists, drop the local blob. Holding 60 decoded
      // originals in memory is what makes a phone stall in the review grid.
      if (current.thumbUrl && current.previewUrl) {
        revokePreviewUrl(current.previewUrl)
        current.previewUrl = null
      }
    } catch (err) {
      if (currentGen(localId) !== gen || !find(localId)) return
      if (controller.signal.aborted || isAbortError(err)) return
      const current = find(localId)
      if (!current) return
      current.state = 'failed'
      current.error = humanizeFaneqoUploadError(err)
    } finally {
      if (controllers.get(localId) === controller) controllers.delete(localId)
    }
  }

  function addFiles(fileList) {
    const incoming = Array.from(fileList || [])
    const accepted = []
    for (const file of incoming) {
      if (state.items.length + accepted.length >= maxItems) break
      const check = validateFaneqoImageFile(file, { maxBytes })
      seq += 1
      const localId = `media_${seq}`
      generation.set(localId, 1)
      accepted.push({
        localId,
        file,
        previewUrl: createPreviewUrl(file),
        state: check.error ? 'failed' : 'preparing',
        error: check.error ? check.message : null,
        mediaId: null,
        thumbUrl: null,
        width: null,
        height: null,
        alt: 'Image',
        mime: file?.type || null,
        protected: false,
      })
    }
    state.items = [...state.items, ...accepted]
    accepted
      .filter((row) => row.state === 'preparing')
      .forEach((row) => {
        withSlot(() => runUpload(row.localId, row.file))
      })
    return accepted
  }

  /**
   * Take on media that is already staged server-side (a resumed draft, or the
   * existing photos of a gallery being edited). Adopted rows have no local
   * file, so they can never be re-uploaded and never lose their `mediaId`.
   */
  function adopt(list) {
    const incoming = Array.from(list || [])
    const accepted = []
    for (const media of incoming) {
      if (state.items.length + accepted.length >= maxItems) break
      const mediaId = media?.mediaId != null && media.mediaId !== '' ? media.mediaId : media?.id
      if (mediaId == null || mediaId === '') continue
      seq += 1
      const localId = `media_${seq}`
      generation.set(localId, 1)
      accepted.push({
        localId,
        file: null,
        previewUrl: null,
        state: 'ready',
        error: null,
        mediaId,
        thumbUrl: media.thumbUrl || media.thumbnailUrl || media.url || null,
        width: media.width || null,
        height: media.height || null,
        alt: media.alt || 'Image',
        mime: media.mime || null,
        protected: media.protected === true,
      })
    }
    state.items = [...state.items, ...accepted]
    return accepted
  }

  function remove(localId) {
    const row = find(localId)
    if (!row) return
    bumpGeneration(localId)
    const controller = controllers.get(localId)
    if (controller) controller.abort()
    revoke(row)
    state.items = state.items.filter((item) => item.localId !== localId)
  }

  function retry(localId) {
    const row = find(localId)
    if (!row?.file) return
    const controller = controllers.get(localId)
    if (controller) controller.abort()
    bumpGeneration(localId)
    row.state = 'preparing'
    row.error = null
    row.mediaId = null
    withSlot(() => runUpload(row.localId, row.file))
  }

  function retryFailed() {
    const failed = state.items.filter((row) => row.state === 'failed' && row.file)
    failed.forEach((row) => retry(row.localId))
    return failed.length
  }

  /**
   * Stop what has not landed yet and keep what has. Cancelling is a normal
   * decision on a bad connection, not an error state.
   */
  function cancelPending() {
    const pending = state.items.filter((row) => row.state === 'preparing' || row.state === 'uploading')
    if (!pending.length) return 0
    const dropped = new Set()
    for (const row of pending) {
      bumpGeneration(row.localId)
      const controller = controllers.get(row.localId)
      if (controller) controller.abort()
      revoke(row)
      dropped.add(row.localId)
    }
    state.items = state.items.filter((row) => !dropped.has(row.localId))
    return pending.length
  }

  function move(localId, delta) {
    const index = state.items.findIndex((item) => item.localId === localId)
    if (index < 0) return false
    const next = index + Number(delta || 0)
    if (next < 0 || next >= state.items.length) return false
    const copy = state.items.slice()
    const [row] = copy.splice(index, 1)
    copy.splice(next, 0, row)
    state.items = copy
    return true
  }

  function clear({ revokePreviews = true } = {}) {
    for (const row of state.items) {
      bumpGeneration(row.localId)
      const controller = controllers.get(row.localId)
      if (controller) controller.abort()
      if (revokePreviews) revoke(row)
    }
    state.items = []
  }

  function readyAttachments() {
    return state.items
      .filter((row) => row.state === 'ready' && row.mediaId)
      .map((row, order) => ({
        type: 'image',
        id: row.mediaId,
        mediaId: row.mediaId,
        url: row.thumbUrl || row.previewUrl,
        thumbUrl: row.thumbUrl || row.previewUrl,
        previewUrl: row.previewUrl,
        width: row.width,
        height: row.height,
        aspectRatio: aspectRatioFromDimensions(row.width, row.height),
        alt: row.alt || 'Image',
        order,
        mime: row.mime || null,
        protected: !!row.protected,
      }))
  }

  Object.defineProperties(state, {
    ready: {
      enumerable: true,
      get() {
        return this.items.length > 0 && this.items.every((row) => row.state === 'ready')
      },
    },
    busy: {
      enumerable: true,
      get() {
        return this.items.some((row) => row.state === 'preparing' || row.state === 'uploading')
      },
    },
    canAdd: {
      enumerable: true,
      get() {
        return this.items.length < this.maxItems
      },
    },
    remaining: {
      enumerable: true,
      get() {
        return Math.max(0, this.maxItems - this.items.length)
      },
    },
    readyCount: {
      enumerable: true,
      get() {
        return this.items.filter((row) => row.state === 'ready').length
      },
    },
    uploadingCount: {
      enumerable: true,
      get() {
        return this.items.filter((row) => row.state === 'preparing' || row.state === 'uploading').length
      },
    },
    failedCount: {
      enumerable: true,
      get() {
        return this.items.filter((row) => row.state === 'failed').length
      },
    },
  })

  state.addFiles = addFiles
  state.adopt = adopt
  state.remove = remove
  state.retry = retry
  state.retryFailed = retryFailed
  state.cancelPending = cancelPending
  state.move = move
  state.clear = clear
  state.readyAttachments = readyAttachments
  return state
}
