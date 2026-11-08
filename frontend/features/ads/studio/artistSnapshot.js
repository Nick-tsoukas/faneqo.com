/**
 * Strapi public band → frozen creative snapshot.
 *
 * Pure. No fetching, no Vue. The studio stores the result on the creative so a
 * later profile edit never changes a finished image. Every media reference
 * carries a rights tag:
 *
 *   source  band_upload | spotify_oembed | studio_asset
 *   use     preview | organic | paid
 *
 * Band uploads (bandImg, album cover, event image, public gallery media) are
 * artist-supplied: preview + organic. Paid use still needs confirmation.
 * Spotify oEmbed thumbnails are third-party: preview only.
 * Missing data stays null. Templates hide what is missing; nothing is invented.
 */

export const MEDIA_SOURCES = ['band_upload', 'spotify_oembed', 'studio_asset', 'studio_upload']
export const MEDIA_USES = ['preview', 'organic', 'paid']

const LINK_KEYS = [
  'spotify', 'appleMusic', 'youtube', 'youtubeMusic', 'amazonMusic', 'tidal', 'soundcloud',
  'bandcamp', 'deezer', 'instagram', 'facebook', 'tiktok', 'twitter', 'threads', 'discord',
]

/** The rows a product phone may show, most useful first. */
export const SHOWCASE_LINK_ORDER = [
  ['spotify', 'Spotify'],
  ['appleMusic', 'Apple Music'],
  ['youtube', 'YouTube'],
  ['website', 'Website'],
  ['instagram', 'Instagram'],
  ['facebook', 'Facebook'],
  ['tiktok', 'TikTok'],
]

const PLATFORM_HOSTS = {
  spotify: /(^|\.)spotify\.com$/i,
  appleMusic: /(^|\.)(apple\.com|itunes\.apple\.com)$/i,
  youtube: /(^|\.)(youtube\.com|youtu\.be)$/i,
  youtubeMusic: /(^|\.)youtube\.com$/i,
  instagram: /(^|\.)instagram\.com$/i,
  facebook: /(^|\.)(facebook\.com|fb\.com|fb\.me)$/i,
  tiktok: /(^|\.)tiktok\.com$/i,
  twitter: /(^|\.)(twitter\.com|x\.com)$/i,
  threads: /(^|\.)threads\.net$/i,
  soundcloud: /(^|\.)soundcloud\.com$/i,
  bandcamp: /(^|\.)bandcamp\.com$/i,
  deezer: /(^|\.)deezer\.com$/i,
  tidal: /(^|\.)tidal\.com$/i,
  discord: /(^|\.)(discord\.gg|discord\.com)$/i,
  amazonMusic: /(^|\.)amazon\.com$/i,
}

const PLACEHOLDER_TEXT = {
  bio: /^(this is the bio[.!]?|some bio[.!]?|your bio( here)?|bio( here)?|lorem ipsum[\s\S]*|test bio|add (a |your )?bio[.!]?)$/i,
  song: /^(some song|song title|untitled|test song|your song|song name|track title)$/i,
}

/** Studio seed copy that must never be printed on a finished creative. */
export function isPlaceholderText(value, kind) {
  const raw = text(value)
  if (!raw || !PLACEHOLDER_TEXT[kind]) return false
  return PLACEHOLDER_TEXT[kind].test(raw)
}

/**
 * Keep a link only when it is a real URL for that platform.
 * A bare host is allowed (`open.spotify.com/...`). `facebook: google.com` is not.
 */
export function canonicalLink(key, raw) {
  let value = text(raw)
  if (!value || /^javascript:/i.test(value)) return null
  if (!/^https?:\/\//i.test(value)) {
    if (/^[\w.-]+\.[a-z]{2,}([/?#].*)?$/i.test(value)) value = `https://${value}`
    else return null
  }
  let host = ''
  try { host = new URL(value).hostname.replace(/^www\./, '') } catch { return null }
  const rule = PLATFORM_HOSTS[key]
  if (rule && !rule.test(host)) return null
  if (key === 'website' && /^(google\.com|example\.com|test\.com)$/i.test(host)) return null
  return value
}

/** Keys that exist on the snapshot, in showcase order. An explicit selection is respected. */
export function showcaseLinkKeys(snapshot, selected, limit = 3) {
  const links = snapshot?.links || {}
  const available = SHOWCASE_LINK_ORDER.map(([key]) => key).filter((key) => links[key])
  const chosen = Array.isArray(selected) ? available.filter((key) => selected.includes(key)) : available
  const cap = Number(limit)
  return Number.isFinite(cap) && cap >= 0 ? chosen.slice(0, cap) : chosen
}

export function publicArtistUrl(slug, baseUrl = 'https://faneqo.com') {
  const clean = String(slug || '').trim()
  if (!clean) return null
  return `${String(baseUrl).replace(/\/+$/, '')}/${encodeURIComponent(clean)}`
}

function text(value) {
  if (value == null) return null
  const out = String(value).trim()
  return out ? out : null
}

/**
 * Unknown focal rows default to where faces usually sit in band photography:
 * high in a portrait press shot, nearer the middle in a landscape live shot.
 */
export function defaultFocalY(width, height) {
  if (width && height && height > width) return 26
  return 38
}

function clampPercent(value, fallback = 50) {
  if (value === null || value === undefined || value === '') return fallback
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.min(100, Math.max(0, Math.round(n)))
}

/** Strapi v4 media can arrive flat ({ url }) or wrapped ({ data: { attributes } }). */
export function unwrapMedia(raw) {
  if (!raw) return null
  if (Array.isArray(raw)) return raw.map(unwrapMedia).filter(Boolean)
  if (raw.data !== undefined) {
    if (raw.data == null) return null
    if (Array.isArray(raw.data)) return raw.data.map(unwrapMedia).filter(Boolean)
    return unwrapMedia({ id: raw.data.id, ...(raw.data.attributes || {}) })
  }
  if (raw.attributes) return unwrapMedia({ id: raw.id, ...raw.attributes })
  return raw.url ? raw : null
}

export function mediaRef(raw, { source = 'band_upload', use = 'organic', label = null, focal = null, credit = null } = {}) {
  const media = typeof raw === 'string' ? { url: raw } : unwrapMedia(raw)
  const url = text(media?.url)
  if (!url) return null
  const width = Number(media.width) || null
  const height = Number(media.height) || null
  return {
    id: media.id ?? null,
    url,
    width,
    height,
    orientation: width && height ? (width > height ? 'landscape' : width < height ? 'portrait' : 'square') : null,
    label: label || text(media.alternativeText) || text(media.caption) || null,
    source: MEDIA_SOURCES.includes(source) ? source : 'band_upload',
    use: MEDIA_USES.includes(use) ? use : 'preview',
    focal: focal || { x: 50, y: defaultFocalY(width, height) },
    credit: credit || null,
  }
}

function dedupeByUrl(list) {
  const seen = new Set()
  return list.filter((item) => {
    if (!item?.url || seen.has(item.url)) return false
    seen.add(item.url)
    return true
  })
}

function listOf(raw) {
  if (Array.isArray(raw)) return raw
  if (Array.isArray(raw?.data)) return raw.data.map((row) => ({ id: row.id, ...(row.attributes || {}) }))
  return []
}

export function primaryGenre(genre) {
  const first = String(genre || '').split(',')[0].trim()
  return first || null
}

function dateOnly(value) {
  const raw = text(value)
  if (!raw) return null
  const match = raw.match(/^(\d{4}-\d{2}-\d{2})/)
  return match ? match[1] : null
}

function isUpcoming(date, todayIso) {
  if (!date) return false
  return date >= todayIso
}

function mapRelease(album) {
  const art = mediaRef(album.cover, { source: 'band_upload', use: 'organic', label: text(album.title) })
  return {
    id: album.id ?? null,
    title: text(album.title),
    type: text(album.type),
    releaseDate: dateOnly(album.releaseDate),
    url: text(album.albumUrl),
    streamingService: text(album.streamingService),
    art,
  }
}

function mapShow(event, todayIso) {
  const date = dateOnly(event.date)
  return {
    id: event.id ?? null,
    title: text(event.title),
    slug: text(event.slug),
    date,
    time: text(event.time),
    doorsTime: text(event.doorsTime),
    venue: text(event.venue),
    city: text(event.city),
    state: text(event.state),
    address: text(event.address),
    link: text(event.link),
    ticketLabel: text(event.ticketLabel),
    priceLine: text(event.priceLine),
    ageRestriction: text(event.ageRestriction),
    image: mediaRef(event.image, { source: 'band_upload', use: 'organic', label: text(event.title) }),
    upcoming: isUpcoming(date, todayIso),
  }
}

function mapSong(band, releases) {
  const song = band.singlesong
  if (!song || typeof song !== 'object') return null
  const title = text(song.spotifyOembedTitle) || text(song.title)
  if (!title) return null
  const normalized = title.toLowerCase()
  const matchingRelease = releases.find((release) => release.art && release.title && (
    release.title.toLowerCase() === normalized || normalized.includes(release.title.toLowerCase())
  ))
  const spotifyThumb = text(song.spotifyOembedThumbnailUrl)
  const uploadedCover = mediaRef(song.cover, { source: 'band_upload', use: 'organic', label: title })
  let art = null
  let artFrom = null
  if (uploadedCover) {
    art = uploadedCover
    artFrom = 'song_cover'
  } else if (matchingRelease) {
    art = matchingRelease.art
    artFrom = 'album_cover'
  } else if (spotifyThumb) {
    art = mediaRef(spotifyThumb, { source: 'spotify_oembed', use: 'preview', label: title })
    artFrom = 'spotify_oembed'
  }
  return {
    title,
    platform: text(song.platform),
    spotifyUrl: text(song.spotifyUrl),
    type: text(song.spotifyOembedType),
    art,
    artFrom,
    /** Spotify's thumbnail even when real artwork exists, for the editor's picker. */
    previewArt: spotifyThumb ? mediaRef(spotifyThumb, { source: 'spotify_oembed', use: 'preview', label: title }) : null,
  }
}

function mapVideo(band) {
  const video = band.singlevideo
  if (!video || typeof video !== 'object') return null
  const id = text(video.youtubeid)
  const title = text(video.title)
  if (!id && !title) return null
  return { youtubeId: id, title }
}

function mapGalleries(galleries) {
  const rows = Array.isArray(galleries) ? galleries : listOf(galleries?.data?.galleries || galleries?.galleries)
  return rows
    .map((gallery) => {
      const photos = Array.isArray(gallery.photos) ? gallery.photos : gallery.cover ? [gallery.cover] : []
      return {
        id: gallery.id ?? null,
        title: text(gallery.title),
        slug: text(gallery.slug),
        photoCount: Number(gallery.photoCount) || photos.length,
        photos: photos
          .map((photo) => mediaRef(photo, { source: 'band_upload', use: 'organic', label: text(gallery.title) }))
          .filter(Boolean),
      }
    })
    .filter((gallery) => gallery.photos.length)
}

/**
 * @param {object} band  public band JSON (GET /api/bands/slug/:slug → data)
 * @param {object} [options]
 * @param {object|array} [options.galleries]  GET /api/public/bands/:slug/galleries → data
 * @param {Date|string} [options.now]
 * @param {string} [options.baseUrl]
 */
export function buildArtistSnapshot(band, options = {}) {
  if (!band || typeof band !== 'object') return null
  const source = band.attributes ? { id: band.id, ...band.attributes } : band
  const now = options.now ? new Date(options.now) : new Date()
  const todayIso = Number.isNaN(now.getTime()) ? new Date().toISOString().slice(0, 10) : now.toISOString().slice(0, 10)

  const name = text(source.name)
  const slug = text(source.slug)
  const heroMedia = unwrapMedia(source.bandImg)
  const heroDefaultY = defaultFocalY(Number(heroMedia?.width) || 0, Number(heroMedia?.height) || 0)
  const focal = {
    x: clampPercent(source.cyberedImagePositionX, 50),
    y: clampPercent(source.cyberedImagePositionY, heroDefaultY),
  }
  // The page editor stores 50/50 as its untouched default, so it is indistinguishable
  // from "never set"; prefer the photography default in that case.
  if (focal.x === 50 && focal.y === 50) focal.y = heroDefaultY

  const hero = mediaRef(source.bandImg, { source: 'band_upload', use: 'organic', label: 'Artist photo', focal })
  const releases = listOf(source.albums)
    .filter((album) => album && album.isApproved !== false)
    .map(mapRelease)
  const shows = listOf(source.events)
    .filter((event) => event && event.isApproved !== false)
    .map((event) => mapShow(event, todayIso))
    .filter((show) => show.date)
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
  const galleries = mapGalleries(options.galleries)
  const featuredGallery = source.featuredGallery && typeof source.featuredGallery === 'object'
    ? mapGalleries([source.featuredGallery])[0] || null
    : null

  const photos = dedupeByUrl([
    hero,
    ...(featuredGallery ? featuredGallery.photos : []),
    ...galleries.flatMap((gallery) => gallery.photos),
    ...shows.map((show) => show.image).filter(Boolean),
  ])

  const links = {}
  for (const key of LINK_KEYS) {
    const value = canonicalLink(key, source[key])
    if (value) links[key] = value
  }
  const website = canonicalLink('website', source.websitelink)
  if (website) links.website = website

  const song = mapSong(source, releases)
  const bio = text(source.bio)

  return {
    bandId: source.id ?? null,
    slug,
    name,
    genre: primaryGenre(source.genre),
    genres: text(source.genre),
    bio: isPlaceholderText(bio, 'bio') ? null : bio,
    tagline: text(source.biotagline),
    pageUrl: publicArtistUrl(slug, options.baseUrl),
    hero,
    photos,
    song: song && isPlaceholderText(song.title, 'song') ? null : song,
    video: mapVideo(source),
    releases,
    shows,
    upcomingShows: shows.filter((show) => show.upcoming),
    galleries,
    links,
    fanList: {
      enabled: source.fanCaptureEnabled !== false,
      headline: text(source.fanCaptureHeadline),
      message: text(source.fanCaptureMessage),
      buttonLabel: text(source.fanCaptureButtonLabel),
    },
    snapshotAt: now.toISOString(),
  }
}

/** Every media ref a creative could pick from, flattened for the editor. */
export function snapshotMediaOptions(snapshot) {
  if (!snapshot) return []
  const items = [
    ...(snapshot.photos || []).map((photo) => ({ ...photo, group: 'Photos' })),
    ...(snapshot.releases || []).filter((r) => r.art).map((r) => ({ ...r.art, label: r.title || r.art.label, group: 'Artwork' })),
  ]
  if (snapshot.song?.art && snapshot.song.art.source === 'spotify_oembed') {
    items.push({ ...snapshot.song.art, group: 'Preview only' })
  }
  return dedupeByUrl(items)
}

/** Rights status for a set of media refs used by one creative. */
export function rightsStatusFor(mediaRefs, { paid = false } = {}) {
  const refs = (mediaRefs || []).filter(Boolean)
  if (!refs.length) return 'clear'
  for (const ref of refs) {
    if (ref.source === 'spotify_oembed' || ref.use === 'preview') return 'needs_permission'
    if (paid && ref.use !== 'paid') return 'needs_permission'
  }
  return 'clear'
}

/** Short reason strings for the publishing package. */
export function rightsWarnings(mediaRefs, { paid = false } = {}) {
  const out = []
  for (const ref of (mediaRefs || []).filter(Boolean)) {
    if (ref.source === 'spotify_oembed') {
      out.push('Spotify thumbnail is preview-only. Replace it with the artist\'s uploaded artwork or get permission before publishing.')
    } else if (ref.source === 'band_upload' && paid) {
      out.push('Artist-uploaded photo. Confirm the artist agrees to paid promotion before running this as an ad.')
    } else if (ref.source === 'studio_asset' && ref.credit) {
      out.push(`Credit required: ${ref.credit}`)
    }
  }
  return [...new Set(out)]
}
