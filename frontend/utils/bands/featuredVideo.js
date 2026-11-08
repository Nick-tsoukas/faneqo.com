/**
 * Featured Video helpers. Persistence still uses singlevideo youtubeid + title.
 */
import { extractYoutubeVideoId } from './featuredMusic.js'

export const FEATURED_VIDEO_ADD_ERROR =
  "We couldn't add that video. Check the link and try again."

export const FEATURED_TRACK_ADD_ERROR =
  "We couldn't add that track. Check the link and try again."

export function extractYoutubeId(url) {
  const fromShare = extractYoutubeVideoId(url)
  if (fromShare) return fromShare
  const raw = String(url || '').trim()
  if (/^[a-zA-Z0-9_-]{11}$/.test(raw)) return raw
  return ''
}

export function youtubePreviewThumb(id) {
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : ''
}

export function featuredVideoPreview(url, title) {
  const id = extractYoutubeId(url)
  if (!id) return null
  return {
    id,
    title: String(title || '').trim() || 'YouTube video',
    thumbnailUrl: youtubePreviewThumb(id),
  }
}
