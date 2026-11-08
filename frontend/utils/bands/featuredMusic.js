/**
 * Artist-facing Featured Music copy and light URL helpers.
 * Persistence still uses singlesong isEmbed / platform / embedHtml / Spotify oEmbed.
 */

export const FEATURED_MUSIC_PLATFORMS = [
  {
    id: 'spotify',
    label: 'Spotify',
    trackLabel: 'Spotify track link',
    placeholder: 'https://open.spotify.com/track/...',
    helper: 'Paste the link to the song you want featured.',
    acceptsShareUrl: true,
  },
  {
    id: 'appleMusic',
    label: 'Apple Music',
    trackLabel: 'Apple Music player',
    placeholder: 'Paste the Apple Music player here',
    helper: 'Paste the official Apple Music player for this song.',
    acceptsShareUrl: false,
  },
  {
    id: 'youtube',
    label: 'YouTube',
    trackLabel: 'YouTube link',
    placeholder: 'https://youtube.com/watch?v=...',
    helper: 'Paste a YouTube link to the song or video.',
    acceptsShareUrl: true,
  },
  {
    id: 'soundcloud',
    label: 'SoundCloud',
    trackLabel: 'SoundCloud player',
    placeholder: 'Paste the SoundCloud player here',
    helper: 'Paste the official SoundCloud player for this track.',
    acceptsShareUrl: false,
  },
  {
    id: 'bandcamp',
    label: 'Bandcamp',
    trackLabel: 'Bandcamp player',
    placeholder: 'Paste the Bandcamp player here',
    helper: 'Paste the official Bandcamp player for this track.',
    acceptsShareUrl: false,
  },
  {
    id: 'deezer',
    label: 'Deezer',
    trackLabel: 'Deezer player',
    placeholder: 'Paste the Deezer player here',
    helper: 'Paste the official Deezer player for this track.',
    acceptsShareUrl: false,
  },
  {
    id: 'mixcloud',
    label: 'Mixcloud',
    trackLabel: 'Mixcloud player',
    placeholder: 'Paste the Mixcloud player here',
    helper: 'Paste the official Mixcloud player for this track.',
    acceptsShareUrl: false,
  },
  {
    id: 'audiomack',
    label: 'Audiomack',
    trackLabel: 'Audiomack player',
    placeholder: 'Paste the Audiomack player here',
    helper: 'Paste the official Audiomack player for this track.',
    acceptsShareUrl: false,
  },
]

const PLATFORM_BY_ID = Object.fromEntries(
  FEATURED_MUSIC_PLATFORMS.map((platform) => [platform.id, platform])
)

export function getFeaturedMusicPlatform(id) {
  return PLATFORM_BY_ID[id] || null
}

export function isValidSpotifyShareUrl(url) {
  if (!url) return false
  const value = String(url).trim()
  return (
    value.startsWith('https://open.spotify.com/') &&
    (value.includes('/track/') ||
      value.includes('/album/') ||
      value.includes('/playlist/') ||
      value.includes('/artist/'))
  )
}

export function detectFeaturedMusicPlatform(value) {
  const raw = String(value || '').trim().toLowerCase()
  if (!raw) return null
  if (raw.includes('open.spotify.com') || raw.includes('spotify.com/track')) return 'spotify'
  if (raw.includes('music.apple.com')) return 'appleMusic'
  if (raw.includes('youtube.com') || raw.includes('youtu.be')) return 'youtube'
  if (raw.includes('soundcloud.com')) return 'soundcloud'
  if (raw.includes('bandcamp.com')) return 'bandcamp'
  if (raw.includes('deezer.com')) return 'deezer'
  if (raw.includes('mixcloud.com')) return 'mixcloud'
  if (raw.includes('audiomack.com')) return 'audiomack'
  return null
}

export function extractYoutubeVideoId(value) {
  const raw = String(value || '').trim()
  if (!raw) return ''
  const match = raw.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/
  )
  return match?.[1] || ''
}

/** Convert a YouTube watch URL into the iframe the player already stores. */
export function normalizeFeaturedPlayerInput(platform, value) {
  const raw = String(value || '').trim()
  if (!raw) return raw
  if (/<iframe[\s\S]*<\/iframe>/i.test(raw)) return raw
  if (platform === 'youtube') {
    const id = extractYoutubeVideoId(raw)
    if (id) {
      return `<iframe src="https://www.youtube.com/embed/${id}" width="100%" height="152" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`
    }
  }
  return raw
}

export function featuredPlayerLooksReady(platform, value) {
  const raw = String(value || '').trim()
  if (!raw) return false
  if (platform === 'youtube' && extractYoutubeVideoId(raw)) return true
  return /<iframe[\s\S]*<\/iframe>/i.test(raw)
}

export function featuredMusicIsReady({
  mode,
  platform,
  hasFile = false,
  spotifyPreview = null,
  embedHtml = '',
} = {}) {
  if (mode === 'upload') return Boolean(hasFile)
  if (platform === 'spotify') return Boolean(spotifyPreview)
  return featuredPlayerLooksReady(platform, embedHtml)
}

/** Switch platform only for a pasted share URL, never for stored iframe HTML. */
export function maybeDetectFeaturedPlatform(value, currentPlatform) {
  const raw = String(value || '').trim()
  if (!raw || /<iframe/i.test(raw)) return null
  const detected = detectFeaturedMusicPlatform(raw)
  if (!detected || detected === currentPlatform) return null
  return detected
}
