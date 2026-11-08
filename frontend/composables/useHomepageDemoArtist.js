/**
 * Load + normalize the homepage phone demo artist from the live Faneqo band API.
 *
 * Swap artists via config/homepageDemo.js → artistSlug.
 */
import { homepageDemoConfig, DEMO_SUPPORT_BUTTONS, SHOWCASE_FALLBACK_ARTISTS, SHOWCASE_FEATURED_VIDEOS } from '~/config/homepageDemo'
import { FAN_CAPTURE_DEFAULT_BUTTON, FAN_CAPTURE_DEFAULT_MESSAGE } from '@/utils/fanCaptureCopy'
import { resolvePublicFeaturedGallery } from '@/utils/galleries/publicFeaturedGallery'

const STREAMING_KEYS = [
  { name: 'spotify', label: 'Spotify' },
  { name: 'appleMusic', label: 'Apple Music' },
  { name: 'youtube', label: 'YouTube' },
  { name: 'youtubeMusic', label: 'YouTube Music' },
  { name: 'amazonMusic', label: 'Amazon Music' },
  { name: 'tidal', label: 'TIDAL' },
  { name: 'soundcloud', label: 'SoundCloud' },
  { name: 'bandcamp', label: 'Bandcamp' },
  { name: 'deezer', label: 'Deezer' },
]

const SOCIAL_KEYS = [
  { name: 'instagram', label: 'Instagram' },
  { name: 'facebook', label: 'Facebook' },
  { name: 'tiktok', label: 'TikTok' },
  { name: 'twitter', label: 'Twitter / X' },
  { name: 'threads', label: 'Threads' },
  { name: 'discord', label: 'Discord' },
]

/** Last-resort snapshot so the homepage never blanks if Strapi is down. */
const FALLBACK_SNAPSHOT = {
  slug: 'badflower',
  name: 'BADFLOWER',
  genre: 'Alternative Rock, Hard Rock',
  bio: 'Badflower is a Los Angeles-born rock band delivering raw, emotionally charged songs that confront mental health, identity, and modern life.',
  heroImage: '/images/homepage/artists/badflower-hero.webp',
  heroImageMobile: '/images/homepage/artists/badflower-hero-mobile.webp',
  heroObjectPosition: 'center 10%',
  website: { url: 'https://www.badflowermusic.com/', label: 'Official Website' },
  streaming: [
    { name: 'spotify', label: 'Spotify', url: 'https://open.spotify.com/artist/3T55D3LMiygE9eSKFpiAye' },
    { name: 'appleMusic', label: 'Apple Music', url: 'https://music.apple.com/us/artist/badflower/610204704' },
    { name: 'youtube', label: 'YouTube', url: 'https://www.youtube.com/user/wearebadflower' },
  ],
  social: [
    { name: 'instagram', label: 'Instagram', url: 'https://www.instagram.com/badflowermusic' },
    { name: 'facebook', label: 'Facebook', url: 'https://www.facebook.com/wearebadflower' },
    { name: 'tiktok', label: 'TikTok', url: 'https://www.tiktok.com/@badflowermusic' },
  ],
  featuredSong: {
    kind: 'spotify',
    title: 'Ghost',
    artistName: 'BADFLOWER',
    spotifyUrl: 'https://open.spotify.com/track/4n3gE7szkumn7MxCEnnSTu',
    thumbnailUrl: 'https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e021f879311e1aa1316242ee4c6',
    type: 'track',
    iframeHtml: null,
  },
  featuredVideo: SHOWCASE_FEATURED_VIDEOS.badflower,
  events: [],
  merchUrl: 'https://badflower-store.myshopify.com/',
  paymentButtons: DEMO_SUPPORT_BUTTONS,
  fanList: {
    enabled: true,
    headline: 'Join the fan list',
    message: FAN_CAPTURE_DEFAULT_MESSAGE,
    buttonLabel: FAN_CAPTURE_DEFAULT_BUTTON,
  },
  source: 'fallback-snapshot',
  slugResolved: false,
}

function extractYouTubeId(raw) {
  if (!raw || typeof raw !== 'string') return ''
  const s = raw.trim()
  if (/^[\w-]{11}$/.test(s)) return s
  try {
    const u = new URL(s.startsWith('http') ? s : `https://${s}`)
    if (u.hostname.includes('youtu.be')) return u.pathname.replace('/', '').slice(0, 11)
    const v = u.searchParams.get('v')
    if (v) return v.slice(0, 11)
    const m = u.pathname.match(/\/embed\/([\w-]{11})/)
    if (m) return m[1]
  } catch {
    // ignore
  }
  return ''
}

function looksLikeUrl(value) {
  return typeof value === 'string' && /^https?:\/\//i.test(value.trim())
}

function pickWebsite(band) {
  if (looksLikeUrl(band.websitelink)) {
    return {
      url: band.websitelink.trim(),
      label: (typeof band.websitelinktext === 'string' && band.websitelinktext.trim() && !looksLikeUrl(band.websitelinktext))
        ? band.websitelinktext.trim()
        : 'Official Website',
    }
  }
  // Some records store the URL in websitelinktext by mistake
  if (looksLikeUrl(band.websitelinktext)) {
    return { url: band.websitelinktext.trim(), label: 'Official Website' }
  }
  return null
}

function buildBandPopulateQuery() {
  return (
    `?populate[bandImg][fields][0]=url` +
    `&populate[singlevideo][fields][0]=youtubeid&populate[singlevideo][fields][1]=title` +
    `&populate[singlesong][fields][0]=title&populate[singlesong][fields][1]=isEmbed` +
    `&populate[singlesong][fields][2]=embedHtml&populate[singlesong][fields][3]=platform` +
    `&populate[singlesong][fields][4]=spotifyUrl&populate[singlesong][fields][5]=spotifyOembedTitle` +
    `&populate[singlesong][fields][6]=spotifyOembedThumbnailUrl&populate[singlesong][fields][7]=spotifyOembedType` +
    `&populate[singlesong][fields][8]=spotifyOembedHtml` +
    `&populate[singlesong][populate][song][fields][0]=url&populate[singlesong][populate][cover][fields][0]=url` +
    `&populate[events][fields][0]=date&populate[events][fields][1]=slug&populate[events][fields][2]=city` +
    `&populate[events][fields][3]=state&populate[events][fields][4]=venue&populate[events][fields][5]=link`
  )
}

function normalizeEvents(raw) {
  let list = []
  if (Array.isArray(raw)) list = raw
  else if (Array.isArray(raw?.data)) {
    list = raw.data.map((e) => ({ id: e.id, ...(e.attributes || {}) }))
  }
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return list
    .map((e) => ({
      id: e.id,
      date: e.date || e.eventDate || e.startDate || null,
      city: e.city ?? null,
      state: e.state ?? null,
      venue: e.venue ?? null,
      slug: e.slug ?? null,
      ticketLink: e.link || e.ticketLink || e.ticketUrl || null,
    }))
    .filter((e) => e.date)
    .filter((e) => new Date(`${e.date}T00:00:00`) >= today)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 3)
}

function normalizeFeaturedSong(band) {
  const s = band.singlesong
  if (!s) return null
  const artistName = band.name || ''

  if (s.isEmbed && s.platform === 'spotify' && s.spotifyUrl) {
    return {
      kind: 'spotify',
      title: s.spotifyOembedTitle || s.title || 'Featured Song',
      artistName,
      spotifyUrl: s.spotifyUrl,
      thumbnailUrl: s.spotifyOembedThumbnailUrl || s.cover?.url || null,
      type: s.spotifyOembedType || 'track',
      iframeHtml: s.spotifyOembedHtml || null,
    }
  }

  if (s.song?.url || s.cover?.url || s.title) {
    return {
      kind: 'audio',
      title: s.title || 'Featured Song',
      artistName,
      audioUrl: s.song?.url || null,
      thumbnailUrl: s.cover?.url || null,
    }
  }
  return null
}

function normalizeFeaturedVideo(band, overrideYoutubeId) {
  const id = extractYouTubeId(overrideYoutubeId || band.singlevideo?.youtubeid || '')
  if (!id) return null
  return {
    youtubeId: id,
    title: band.singlevideo?.title || `${band.name || 'Artist'} — Featured Video`,
    thumbnailUrl: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
    embedUrl: `https://www.youtube.com/embed/${id}`,
  }
}

function enabledPaymentButtons(band, overrides) {
  const btns = Array.isArray(band.paymentButtons)
    ? band.paymentButtons.filter((b) => b && b.enabled === true)
    : []
  if (btns.length) return btns
  if (overrides?.showDemoSupportWhenEmpty !== false) return DEMO_SUPPORT_BUTTONS
  if (Array.isArray(overrides?.paymentButtons)) return overrides.paymentButtons
  return []
}

function isHidden(band, key) {
  const hidden = band.hiddenLinks
  if (!hidden) return false
  if (Array.isArray(hidden)) return hidden.includes(key)
  if (typeof hidden === 'object') return !!hidden[key]
  return false
}

/**
 * Normalize a live band payload (+ optional overrides) into the phone view-model.
 */
export function normalizeHomepageDemoArtist(band, overrides = {}, meta = {}) {
  if (!band) return null

  const hide = new Set(overrides.hideModules || [])
  const website = overrides.website || pickWebsite(band)
  const featuredSong = overrides.featuredSong || normalizeFeaturedSong(band)
  const mappedVideo = SHOWCASE_FEATURED_VIDEOS[band.slug]
  const featuredVideo = hide.has('video')
    ? null
    : mappedVideo || normalizeFeaturedVideo(band, overrides.featuredVideoId)

  const streaming = STREAMING_KEYS
    .filter((p) => band[p.name] && !isHidden(band, p.name))
    .map((p) => ({ name: p.name, label: p.label, url: band[p.name] }))

  const social = SOCIAL_KEYS
    .filter((p) => band[p.name] && !isHidden(band, p.name))
    .map((p) => ({ name: p.name, label: p.label, url: band[p.name] }))

  const merchRaw = overrides.merchUrl || band.officialMerchUrl
  const merchUrl = looksLikeUrl(merchRaw) ? merchRaw.trim() : null

  return {
    id: band.id || null,
    slug: band.slug || meta.requestedSlug || '',
    name: overrides.name || band.name || 'Artist',
    genre: overrides.genre || band.genre || '',
    bio: overrides.bio || band.bio || '',
    heroImage: overrides.heroImage || band.bandImg?.url || null,
    heroImageMobile: overrides.heroImageMobile || null,
    heroObjectPosition: overrides.heroObjectPosition || 'center 10%',
    imageFocalX: Number.isFinite(Number(band.cyberedImagePositionX)) ? Number(band.cyberedImagePositionX) : null,
    imageFocalY: Number.isFinite(Number(band.cyberedImagePositionY)) ? Number(band.cyberedImagePositionY) : null,
    featuredGallery: resolvePublicFeaturedGallery(band.featuredGallery),
    website: hide.has('website') ? null : website,
    streaming: hide.has('streaming') ? [] : streaming,
    social: hide.has('social') ? [] : social,
    featuredSong: hide.has('song') ? null : featuredSong,
    featuredVideo,
    events: hide.has('events') ? [] : (overrides.events || normalizeEvents(band.events)),
    merchUrl: hide.has('merch') ? null : merchUrl,
    paymentButtons: hide.has('support') ? [] : enabledPaymentButtons(band, overrides),
    fanList: hide.has('fanList')
      ? { enabled: false }
      : {
          enabled: band.fanCaptureEnabled !== false,
          headline: overrides.fanHeadline || band.fanCaptureHeadline || 'Join the fan list',
          message:
            overrides.fanMessage ||
            band.fanCaptureMessage ||
            FAN_CAPTURE_DEFAULT_MESSAGE,
          buttonLabel: overrides.fanButtonLabel || band.fanCaptureButtonLabel || FAN_CAPTURE_DEFAULT_BUTTON,
        },
    source: meta.source || 'live',
    slugResolved: meta.slugResolved !== false,
    requestedSlug: meta.requestedSlug || band.slug || '',
  }
}

export { fetchBandBySlug }

async function fetchBandBySlug(strapiUrl, slug) {
  const url = `${strapiUrl}/api/bands/slug/${encodeURIComponent(slug)}${buildBandPopulateQuery()}`
  try {
    const res = await $fetch(url)
    return res?.data || res || null
  } catch (err) {
    const status = err?.statusCode || err?.status || err?.response?.status
    if (status === 404) return null
    throw err
  }
}

/**
 * Nuxt-friendly loader used on the homepage.
 */
export function useHomepageDemoArtist(config = homepageDemoConfig) {
  const runtimeConfig = useRuntimeConfig()
  const strapiUrl = runtimeConfig.public.strapiUrl || 'http://localhost:1337'
  const requestedSlug = String(config.artistSlug || '').trim().toLowerCase()
  const overrides = config.overrides || {}

  const key = `homepage-demo-artist:${requestedSlug || 'none'}`

  const asyncData = useAsyncData(key, async () => {
    if (!requestedSlug) {
      return {
        artist: { ...FALLBACK_SNAPSHOT, source: 'fallback-snapshot', slugResolved: false, requestedSlug: '' },
        meta: { slugResolved: false, requestedSlug: '', reason: 'missing_slug' },
      }
    }

    try {
      const band = await fetchBandBySlug(strapiUrl, requestedSlug)
      if (!band) {
        console.warn(
          `[homepage-demo] Artist slug "${requestedSlug}" not found. Using fallback snapshot. Correct artistSlug in config/homepageDemo.js if needed.`
        )
        return {
          artist: {
            ...FALLBACK_SNAPSHOT,
            requestedSlug,
            slugResolved: false,
            source: 'fallback-snapshot',
          },
          meta: { slugResolved: false, requestedSlug, reason: 'not_found' },
        }
      }

      const artist = normalizeHomepageDemoArtist(band, overrides, {
        source: 'live',
        slugResolved: true,
        requestedSlug,
      })

      return {
        artist,
        meta: {
          slugResolved: true,
          requestedSlug,
          liveSlug: band.slug,
          reason: null,
        },
      }
    } catch (err) {
      console.warn(`[homepage-demo] Failed to load "${requestedSlug}":`, err?.message || err)
      return {
        artist: {
          ...FALLBACK_SNAPSHOT,
          requestedSlug,
          slugResolved: false,
          source: 'fallback-snapshot',
        },
        meta: { slugResolved: false, requestedSlug, reason: 'fetch_error' },
      }
    }
  })

  const demoArtist = computed(() => asyncData.data.value?.artist || FALLBACK_SNAPSHOT)
  const demoMeta = computed(() => asyncData.data.value?.meta || { slugResolved: false })

  return {
    ...asyncData,
    demoArtist,
    demoMeta,
    homepageDemoConfig: config,
  }
}

/**
 * Load multiple real artists for the late-page showcase carousel.
 * Failed / missing slugs are skipped so the homepage stays stable.
 */
export function useHomepageShowcaseArtists(
  slugs = homepageDemoConfig.showcaseArtistSlugs,
  options = {}
) {
  const runtimeConfig = useRuntimeConfig()
  const strapiUrl = runtimeConfig.public.strapiUrl || 'http://localhost:1337'
  const list = (Array.isArray(slugs) ? slugs : [])
    .map((s) => String(s || '').trim().toLowerCase())
    .filter(Boolean)
  const overrides = options.overrides || {
    // Showcase phones are visual proof — don't invent demo support buttons
    showDemoSupportWhenEmpty: false,
  }

  const key = `homepage-showcase-artists:${list.join(',') || 'none'}`

  // Below-fold social proof: do not block SSR / inflate the homepage HTML payload.
  const asyncData = useAsyncData(key, async () => {
    if (!list.length) {
      return { artists: [], skipped: [], reason: 'empty_slugs' }
    }

    // One settled batch — never push into a reactive array mid-render.
    const settled = await Promise.allSettled(
      list.map(async (slug) => {
        const band = await fetchBandBySlug(strapiUrl, slug)
        if (!band) {
          const err = new Error(`not_found:${slug}`)
          err.code = 'not_found'
          throw err
        }
        const artist = normalizeHomepageDemoArtist(band, overrides, {
          source: 'live',
          slugResolved: true,
          requestedSlug: slug,
        })
        if (!artist?.slug) {
          const err = new Error(`invalid_artist:${slug}`)
          err.code = 'invalid_artist'
          throw err
        }
        return { slug, artist }
      })
    )

    const artists = []
    const skipped = []
    const seen = new Set()

    for (let i = 0; i < settled.length; i++) {
      const slug = list[i]
      const result = settled[i]
      if (result.status === 'fulfilled' && result.value?.artist?.slug) {
        const artist = result.value.artist
        if (seen.has(artist.slug)) {
          skipped.push({ slug, reason: 'duplicate_slug' })
          continue
        }
        seen.add(artist.slug)
        artists.push(artist)
      } else {
        const reason =
          result.reason?.code ||
          (String(result.reason?.message || '').startsWith('not_found')
            ? 'not_found'
            : 'fetch_error')
        console.warn(
          `[homepage-showcase] Failed to load "${slug}":`,
          result.reason?.message || result.reason || reason
        )
        skipped.push({ slug, reason })
      }
    }

    if (import.meta.dev && skipped.length) {
      console.warn('[homepage-showcase] Skipped artists:', skipped)
    }

    return { artists, skipped, reason: null }
  }, {
    server: false,
    lazy: true,
  })

  const showcaseArtists = computed(() => {
    const live = asyncData.data.value?.artists || []
    if (live.length) return live
    const wanted = new Set(list)
    const matched = SHOWCASE_FALLBACK_ARTISTS.filter((artist) => wanted.has(artist.slug))
    return matched.length ? matched : SHOWCASE_FALLBACK_ARTISTS
  })
  const showcaseSkipped = computed(() => asyncData.data.value?.skipped || [])

  return {
    ...asyncData,
    showcaseArtists,
    showcaseSkipped,
  }
}

export { homepageDemoConfig, FALLBACK_SNAPSHOT, SHOWCASE_FALLBACK_ARTISTS }
