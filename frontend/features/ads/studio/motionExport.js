import { motionSettings, productMotionFilm } from './motion.js'

/** First local video export. Story 9:16, 30fps, no audio. */
export const MOTION_FPS = 30
export const MOTION_EXPORT_WIDTH = 720
export const MOTION_EXPORT_HEIGHT = 1280
export const MOTION_EXPORT_MAX_BYTES = 512 * 1024

/**
 * Frame count for a duration. 11s at 30fps is 330 frames.
 * Frame N is at N / fps seconds, so the file duration is frameCount / fps.
 */
export function motionFrameCount(durationMs, fps = MOTION_FPS) {
  const duration = Number(durationMs)
  const rate = Number(fps)
  if (!Number.isFinite(duration) || duration <= 0) throw new Error('Duration must be a positive number of milliseconds.')
  if (!Number.isFinite(rate) || rate <= 0 || rate > 60) throw new Error('Frame rate must be between 1 and 60.')
  return Math.max(1, Math.round((duration / 1000) * rate))
}

/** Absolute timestamp for frame N. Rounded to a whole millisecond. */
export function motionFrameTimeMs(index, fps = MOTION_FPS) {
  const frame = Number(index)
  const rate = Number(fps)
  if (!Number.isInteger(frame) || frame < 0) throw new Error('Frame index must be a non-negative integer.')
  if (!Number.isFinite(rate) || rate <= 0) throw new Error('Frame rate must be positive.')
  return Math.round((frame / rate) * 1000)
}

export function motionFrameTimes(durationMs, fps = MOTION_FPS) {
  const count = motionFrameCount(durationMs, fps)
  return Array.from({ length: count }, (_, index) => motionFrameTimeMs(index, fps))
}

/**
 * A creative can be filmed only when motion is on and the template knows how.
 * Product Showcase is the first. The payload stays small and local.
 */
export function assertExportableMotion(creative) {
  if (!creative || typeof creative !== 'object') throw new Error('Creative is missing.')
  if (creative.templateId !== 'product-showcase') throw new Error('This template cannot export video yet.')
  const motion = motionSettings(creative.content)
  if (!motion) throw new Error('Turn motion on before exporting video.')
  if (!productMotionFilm(creative.content)) {
    const style = creative.content?.style
    if (style && style !== 'page') throw new Error('This style stays a still.')
    throw new Error('Video export plays the artist-page phone. Other excerpts stay stills.')
  }
  const bytes = JSON.stringify({
    templateId: creative.templateId,
    content: creative.content,
    snapshot: creative.snapshot || null,
    artistName: creative.artistName || '',
  }).length
  if (bytes > MOTION_EXPORT_MAX_BYTES) throw new Error(`This creative is too large to export (${bytes} bytes).`)
  return motion
}

/** Download label only. Never used as a shell argument. */
export function motionDownloadName(creative) {
  const artist = String(creative?.artistName || 'faneqo')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'faneqo'
  const family = String(creative?.templateId || 'creative').replace(/[^a-z0-9-]/g, '').slice(0, 40) || 'creative'
  return `${artist}-${family}-story.mp4`
}

export function pngSize(buffer) {
  if (!buffer || buffer.length < 24) return null
  const sig = buffer.subarray(0, 8).toString('hex')
  if (sig !== '89504e470d0a1a0a') return null
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) }
}
