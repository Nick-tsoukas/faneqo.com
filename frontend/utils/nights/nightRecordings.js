/**
 * Night Recording presentation. Backend remains source of truth.
 * Photos remember what the Night looked like. Recordings remember what it felt like.
 */

export const NIGHT_RECORDING_SOURCES = [
  { id: 'youtube', label: 'YouTube', kind: 'video', source: 'youtube' },
  { id: 'spotify', label: 'Spotify', kind: 'audio', source: 'spotify' },
  { id: 'upload-audio', label: 'Upload audio', kind: 'audio', source: 'upload' },
  { id: 'upload-video', label: 'Upload video', kind: 'video', source: 'upload' },
]

export const NIGHT_RECORDING_VISIBILITIES = [
  { id: 'public', label: 'Everyone', hint: 'Anyone can play this.' },
  { id: 'fan_list', label: 'Fans', hint: 'People on your fan list.' },
  { id: 'show_attendees', label: 'People who were there', hint: 'Verified attendees of this Night.' },
]

export const NIGHT_RECORDING_MAX = 12
export const NIGHT_RECORDING_SUGGESTED = 4
export const NIGHT_RECORDING_AUDIO_MAX_BYTES = 50 * 1024 * 1024
export const NIGHT_RECORDING_VIDEO_MAX_BYTES = 50 * 1024 * 1024
export const NIGHT_RECORDING_TITLE_MAX = 120
export const NIGHT_RECORDING_CAPTION_MAX = 1200

export const NIGHT_RECORDING_AUDIO_ACCEPT = 'audio/mpeg,audio/mp3,audio/mp4,audio/x-m4a,audio/m4a,audio/aac,audio/wav,audio/x-wav,audio/wave,audio/ogg,audio/webm,.mp3,.m4a,.aac,.wav,.ogg,.webm'
export const NIGHT_RECORDING_VIDEO_ACCEPT = 'video/mp4,.mp4'

const AUDIO_MIMES = new Set([
  'audio/mpeg',
  'audio/mp3',
  'audio/mp4',
  'audio/x-m4a',
  'audio/m4a',
  'audio/aac',
  'audio/wav',
  'audio/x-wav',
  'audio/wave',
  'audio/ogg',
  'audio/webm',
])

const YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtu.be',
  'www.youtu.be',
])

const SPOTIFY_HOSTS = new Set([
  'open.spotify.com',
  'play.spotify.com',
])

const YOUTUBE_ID_RE = /^[A-Za-z0-9_-]{11}$/
const SPOTIFY_ID_RE = /^[A-Za-z0-9]{22}$/
const SPOTIFY_TYPES = new Set(['track', 'album', 'playlist'])

function text(value) {
  return String(value || '').trim()
}

export function recordingSourceChoice(kind, source) {
  if (source === 'youtube') return 'youtube'
  if (source === 'spotify') return 'spotify'
  if (source === 'upload' && kind === 'video') return 'upload-video'
  if (source === 'upload') return 'upload-audio'
  return ''
}

export function sourceChoiceMeta(choice) {
  return NIGHT_RECORDING_SOURCES.find((row) => row.id === choice) || null
}

export function visibilityLabel(visibility) {
  if (visibility === 'show_attendees') return 'People who were there'
  if (visibility === 'fan_list') return 'Fans'
  return 'Everyone'
}

export function recordingStatusLabel(status) {
  return status === 'published' ? 'On the Night' : 'Draft'
}

export function formatRecordingDuration(seconds) {
  if (seconds == null || seconds === '') return ''
  const n = Number(seconds)
  if (!Number.isInteger(n) || n < 0) return ''
  const hours = Math.floor(n / 3600)
  const minutes = Math.floor((n % 3600) / 60)
  const rest = n % 60
  if (hours > 0) return `${hours}:${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`
  return `${minutes}:${String(rest).padStart(2, '0')}`
}

export function recordingLockLine({ lockReason, artistName } = {}) {
  if (lockReason === 'fan_list') {
    const artist = text(artistName)
    return artist
      ? `This is for fans of ${artist}.`
      : 'This is for fans of this artist.'
  }
  if (lockReason === 'show_attendees') return 'This is for the people who were there.'
  if (lockReason === 'account_required') return 'Sign in to hear this Night.'
  return 'This recording is not available yet.'
}

export function sortNightRecordings(rows) {
  return [...(Array.isArray(rows) ? rows : [])].sort((a, b) => {
    const orderA = Number.isInteger(a?.sortOrder) ? a.sortOrder : 0
    const orderB = Number.isInteger(b?.sortOrder) ? b.sortOrder : 0
    if (orderA !== orderB) return orderA - orderB
    return (Number(a?.id) || 0) - (Number(b?.id) || 0)
  })
}

export function presentNightRecordings(rows) {
  const list = sortNightRecordings(rows)
  const audio = list.filter((row) => row?.kind === 'audio')
  const video = list.filter((row) => row?.kind === 'video')
  const rest = list.filter((row) => row?.kind !== 'audio' && row?.kind !== 'video')
  return [...audio, ...video, ...rest]
}

export function publicNightRecordings(rows) {
  return presentNightRecordings(rows).filter((row) => row && (row.locked || row.kind === 'audio' || row.kind === 'video'))
}

export function recordingsByKind(rows) {
  const list = publicNightRecordings(rows)
  return {
    audio: list.filter((row) => row.kind === 'audio'),
    video: list.filter((row) => row.kind === 'video'),
  }
}

export function recordingSectionPlan(rows) {
  const list = publicNightRecordings(rows)
  const { audio, video } = recordingsByKind(list)
  const rest = list.filter((row) => row.kind !== 'audio' && row.kind !== 'video')
  return {
    recordings: [...audio, ...video, ...rest],
    audio,
    video,
    empty: list.length === 0,
    mixed: audio.length > 0 && video.length > 0,
    showHearHeading: audio.length > 0 && video.length > 0,
    showWatchHeading: audio.length > 0 && video.length > 0,
  }
}

function hostnameOf(raw) {
  try {
    return String(new URL(String(raw || '').trim()).hostname || '').toLowerCase()
  } catch {
    return ''
  }
}

function stripWww(host) {
  return String(host || '').replace(/^www\./, '')
}

export function youtubeVideoIdFromUrl(raw) {
  let parsed
  try {
    parsed = new URL(String(raw || '').trim())
  } catch {
    return ''
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return ''
  const host = parsed.hostname.toLowerCase()
  if (!YOUTUBE_HOSTS.has(host)) return ''
  if (stripWww(host) === 'youtu.be') {
    const id = parsed.pathname.split('/').filter(Boolean)[0] || ''
    return YOUTUBE_ID_RE.test(id) ? id : ''
  }
  const parts = parsed.pathname.split('/').filter(Boolean)
  if (parts[0] === 'embed' || parts[0] === 'live' || parts[0] === 'shorts' || parts[0] === 'v') {
    const id = parts[1] || ''
    return YOUTUBE_ID_RE.test(id) ? id : ''
  }
  const v = parsed.searchParams.get('v') || ''
  return YOUTUBE_ID_RE.test(v) ? v : ''
}

export function parseYoutubeInput(raw) {
  const id = youtubeVideoIdFromUrl(raw)
  if (!id) return { error: 'invalid_youtube_url', message: 'Use a valid YouTube video link.' }
  return {
    providerType: 'youtube',
    providerResourceType: 'video',
    providerResourceId: id,
    providerUrl: `https://www.youtube.com/watch?v=${id}`,
  }
}

function spotifyPathResource(parsed) {
  const parts = parsed.pathname.split('/').filter(Boolean)
  if (parts[0] && parts[0].startsWith('intl-') && parts[1] && parts[2]) {
    return { type: parts[1], id: parts[2].split('?')[0] }
  }
  if (parts[0] && parts[1]) {
    return { type: parts[0], id: parts[1].split('?')[0] }
  }
  return null
}

export function parseSpotifyInput(raw) {
  const trimmed = String(raw || '').trim()
  const uri = trimmed.match(/^spotify:(track|album|playlist):([A-Za-z0-9]{22})$/i)
  if (uri) {
    const type = uri[1].toLowerCase()
    const id = uri[2]
    return {
      providerType: 'spotify',
      providerResourceType: type,
      providerResourceId: id,
      providerUrl: `https://open.spotify.com/${type}/${id}`,
    }
  }
  let parsed
  try {
    parsed = new URL(trimmed)
  } catch {
    return { error: 'invalid_spotify_url', message: 'Use a valid Spotify track, album, or playlist link.' }
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return { error: 'invalid_spotify_url', message: 'Use a valid Spotify track, album, or playlist link.' }
  }
  if (!SPOTIFY_HOSTS.has(parsed.hostname.toLowerCase())) {
    return { error: 'invalid_spotify_url', message: 'Use a valid Spotify track, album, or playlist link.' }
  }
  const resource = spotifyPathResource(parsed)
  if (!resource || !SPOTIFY_TYPES.has(resource.type) || !SPOTIFY_ID_RE.test(resource.id)) {
    return { error: 'invalid_spotify_url', message: 'Use a Spotify track, album, or playlist — not an artist or episode.' }
  }
  return {
    providerType: 'spotify',
    providerResourceType: resource.type,
    providerResourceId: resource.id,
    providerUrl: `https://open.spotify.com/${resource.type}/${resource.id}`,
  }
}

export function youtubeEmbedUrl(id, { autoplay = false } = {}) {
  const videoId = text(id)
  if (!YOUTUBE_ID_RE.test(videoId)) return ''
  const params = new URLSearchParams({
    rel: '0',
    modestbranding: '1',
    playsinline: '1',
    autoplay: autoplay ? '1' : '0',
  })
  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`
}

export function spotifyEmbedUrl(resourceType, resourceId) {
  const type = text(resourceType)
  const id = text(resourceId)
  if (!SPOTIFY_TYPES.has(type) || !SPOTIFY_ID_RE.test(id)) return ''
  return `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0`
}

export function recordingProvider(recording) {
  const provider = recording?.provider && typeof recording.provider === 'object'
    ? recording.provider
    : {}
  return {
    type: provider.type || recording?.source || '',
    resourceType: provider.resourceType || '',
    resourceId: provider.resourceId || '',
    url: provider.url || '',
  }
}

export function youtubeIdFromRecording(recording) {
  const provider = recordingProvider(recording)
  if (provider.resourceId && YOUTUBE_ID_RE.test(provider.resourceId)) return provider.resourceId
  return youtubeVideoIdFromUrl(provider.url)
}

export function canPublishGatedUpload({ source, visibility, status } = {}) {
  if (status !== 'published') return true
  if (visibility !== 'fan_list' && visibility !== 'show_attendees') return true
  if (source !== 'upload') return true
  return false
}

export function gatedUploadPublishCopy() {
  return 'Fan-only and show-only uploads need a protected player we do not have yet. Publish for everyone, save a draft, or use a YouTube or Spotify link.'
}

export function isAllowedRecordingAudioFile(file) {
  const mime = String(file?.type || file?.mime || '').toLowerCase()
  const name = String(file?.name || '').toLowerCase()
  if (AUDIO_MIMES.has(mime)) return true
  return /\.(mp3|m4a|aac|wav|ogg|webm)$/.test(name)
}

export function isAllowedRecordingVideoFile(file) {
  const mime = String(file?.type || file?.mime || '').toLowerCase()
  const name = String(file?.name || '').toLowerCase()
  return mime === 'video/mp4' || name.endsWith('.mp4')
}

export function validateRecordingFile(file, kind) {
  if (!file) return { error: 'missing', message: kind === 'video' ? 'Choose an MP4 video.' : 'Choose an audio file.' }
  if (kind === 'video') {
    if (!isAllowedRecordingVideoFile(file)) {
      return { error: 'invalid_type', message: 'Uploaded video is MP4 only for now. Use a YouTube link for other video.' }
    }
    if (file.size > NIGHT_RECORDING_VIDEO_MAX_BYTES) {
      return { error: 'too_large', message: 'Video files can be up to 50 MB.' }
    }
    return { error: null }
  }
  if (!isAllowedRecordingAudioFile(file)) {
    return { error: 'invalid_type', message: 'Upload an MP3, M4A, WAV, AAC, or OGG audio file.' }
  }
  if (file.size > NIGHT_RECORDING_AUDIO_MAX_BYTES) {
    return { error: 'too_large', message: 'Audio files can be up to 50 MB.' }
  }
  return { error: null }
}

export function humanizeRecordingError(err) {
  const name = String(err?.data?.error?.name || err?.error || err?.code || err?.name || '')
  const raw = String(err?.data?.error?.message || err?.message || '').trim()
  const friendly = {
    invalid_youtube_url: 'Use a valid YouTube video link.',
    invalid_spotify_url: 'Use a Spotify track, album, or playlist — not an artist or episode.',
    invalid_kind_source: 'That source does not match this recording type.',
    media_required: 'Attach an audio or video file.',
    gated_delivery_unavailable: gatedUploadPublishCopy(),
    too_many_recordings: `A Night can include up to ${NIGHT_RECORDING_MAX} recordings.`,
    attachment_too_large: raw || 'That file is too large.',
    invalid_attachment_type: raw || 'That file type is not supported.',
    unauthorized: 'Sign in to add a recording.',
    forbidden: 'You cannot edit this Night.',
    not_found: 'This recording is gone.',
  }
  if (friendly[name]) return friendly[name]
  if (/youtube/i.test(raw)) return friendly.invalid_youtube_url
  if (/spotify/i.test(raw)) return friendly.invalid_spotify_url
  if (/50 mb|too large|413/i.test(raw)) return raw.includes('Video') ? 'Video files can be up to 50 MB.' : 'Audio files can be up to 50 MB.'
  if (raw && !/ECONN|fetch|network|internal|strapi|stack|at /i.test(raw) && raw.length < 180) return raw
  if (Number(err?.status || err?.statusCode) === 401) return friendly.unauthorized
  if (Number(err?.status || err?.statusCode) === 403) return friendly.forbidden
  return 'Could not save this recording.'
}

export function recordingDisplayTitle(recording) {
  return text(recording?.title) || fallbackRecordingTitle(recording)
}

export function fallbackRecordingTitle(recording) {
  if (recording?.kind === 'video') return 'From the stage'
  if (recording?.source === 'spotify') return 'From the Night'
  return 'From the stage'
}

export function recordingContextLine(recording) {
  const duration = formatRecordingDuration(recording?.duration ?? recording?.durationSeconds)
  if (recording?.source === 'spotify') {
    const type = recordingProvider(recording).resourceType
    const kind = type === 'album' ? 'Album' : type === 'playlist' ? 'Playlist' : 'Track'
    return duration ? `${kind} on Spotify · ${duration}` : `${kind} on Spotify`
  }
  if (recording?.source === 'youtube') return duration ? `Video · ${duration}` : 'Video'
  if (recording?.kind === 'video') return duration ? `Video · ${duration}` : 'Video'
  return duration ? `Recording · ${duration}` : 'Recording'
}

export function recordingSourceLabel(recording) {
  if (recording?.source === 'youtube') return 'YouTube'
  if (recording?.source === 'spotify') return 'Spotify'
  if (recording?.source === 'upload' && recording?.kind === 'video') return 'Uploaded video'
  if (recording?.source === 'upload') return 'Uploaded audio'
  return 'Recording'
}

export function createRecordingIdempotencyKey() {
  const rand = Math.random().toString(36).slice(2, 10)
  return `nr-${Date.now().toString(36)}-${rand}`
}

export function looksLikeYoutubeHost(url) {
  return YOUTUBE_HOSTS.has(hostnameOf(url))
}

export function looksLikeSpotifyHost(url) {
  if (SPOTIFY_HOSTS.has(hostnameOf(url))) return true
  return /^spotify:(track|album|playlist):/i.test(String(url || '').trim())
}
