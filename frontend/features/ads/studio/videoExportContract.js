import { assertExportableMotion } from './motionExport.js'

/** What an MP4 from this studio actually is. Do not advertise 1080p or audio. */
export const VIDEO_OUTPUT = {
  container: 'mp4',
  codec: 'H.264',
  width: 720,
  height: 1280,
  fps: 30,
  audio: false,
  ratio: '9:16',
}

/** The three working films are 11s. Production refuses anything longer. */
export const VIDEO_MAX_DURATION_MS = 12_000

/** One render at a time until a durable queue is approved. */
export const VIDEO_MAX_CONCURRENT = 1

const FORBIDDEN_FIELDS = ['url', 'path', 'command', 'cmd', 'cwd', 'shell', 'file', 'output', 'ffmpeg']

export function isSavedCreativeId(id) {
  return /^\d+$/.test(String(id || '').trim())
}

export function unsafeVideoFields(body) {
  if (!body || typeof body !== 'object') return ['body']
  return FORBIDDEN_FIELDS.filter((key) => Object.prototype.hasOwnProperty.call(body, key))
}

/**
 * Production accepts a saved id only. The browser does not send the creative,
 * a URL, or a path. The server loads the row with the caller's own session.
 */
export function productionJobRequest(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, statusCode: 400, message: 'Missing creative.' }
  }
  if (unsafeVideoFields(body).length) {
    return { ok: false, statusCode: 400, message: 'This export does not accept a render URL or a file path.' }
  }
  const extras = ['content', 'snapshot', 'templateId', 'artistName'].filter((key) => Object.prototype.hasOwnProperty.call(body, key))
  if (extras.length) {
    return { ok: false, statusCode: 400, message: 'Send the saved creative id. The server loads the creative.' }
  }
  if (!isSavedCreativeId(body.id)) {
    return { ok: false, statusCode: 409, message: 'Save this creative to Faneqo before exporting video.' }
  }
  return { ok: true, id: String(body.id) }
}

export function videoJobBody(creative) {
  return {
    id: String(creative.id),
    templateId: creative.templateId,
    artistName: creative.artistName || '',
    content: creative.content,
    snapshot: creative.snapshot || null,
  }
}

/**
 * Pure gate used by the production route and by tests.
 * `allowed` is the studio verdict. A missing worker never falls through to a local render.
 */
export function gateVideoRequest({
  allowed = false,
  workerConfigured = false,
  creative = null,
  running = 0,
  limit = VIDEO_MAX_CONCURRENT,
} = {}) {
  if (!allowed) return { ok: false, statusCode: 404, message: 'Page not found' }
  if (!workerConfigured) {
    return { ok: false, statusCode: 503, message: 'Video export is not configured on this server.' }
  }
  if (!isSavedCreativeId(creative?.id)) {
    return { ok: false, statusCode: 409, message: 'Save this creative to Faneqo before exporting video.' }
  }
  let motion
  try {
    motion = assertExportableMotion(creative)
  } catch (err) {
    return { ok: false, statusCode: 400, message: err.message || 'This creative cannot export video.' }
  }
  if (motion.durationMs > VIDEO_MAX_DURATION_MS) {
    return { ok: false, statusCode: 400, message: 'This film is longer than the export limit.' }
  }
  if (running >= limit) {
    return { ok: false, statusCode: 429, message: 'A video export is already running.' }
  }
  return { ok: true, mode: 'worker' }
}

export function settleCancelledJob(job) {
  if (!job || job.status === 'done') return job
  return { ...job, status: 'cancelled', error: '', file: null }
}
