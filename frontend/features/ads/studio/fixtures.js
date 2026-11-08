import { mediaRef } from './artistSnapshot.js'

/**
 * Studio demo artist: Badflower assembled from files already in /public.
 * Lets the studio produce finished creatives without a live Strapi and gives
 * the tests deterministic inputs. Rights are tagged per file; the Wikimedia
 * photographs carry their CC BY-SA credits into the publishing package.
 *
 * Values mirror the homepage FALLBACK_SNAPSHOT (composables/useHomepageDemoArtist.js)
 * but are inlined so this module stays loadable in Node without Nuxt aliases.
 */
const FALLBACK_SNAPSHOT = {
  slug: 'badflower',
  name: 'BADFLOWER',
  genre: 'Alternative Rock, Hard Rock',
  bio: 'Badflower is a Los Angeles-born rock band delivering raw, emotionally charged songs that confront mental health, identity, and modern life.',
  heroImage: '/images/homepage/artists/badflower-hero.webp',
  website: { url: 'https://www.badflowermusic.com/', label: 'Official Website' },
  streaming: [
    { name: 'spotify', url: 'https://open.spotify.com/artist/3T55D3LMiygE9eSKFpiAye' },
    { name: 'appleMusic', url: 'https://music.apple.com/us/artist/badflower/610204704' },
    { name: 'youtube', url: 'https://www.youtube.com/user/wearebadflower' },
  ],
  social: [
    { name: 'instagram', url: 'https://www.instagram.com/badflowermusic' },
    { name: 'facebook', url: 'https://www.facebook.com/wearebadflower' },
    { name: 'tiktok', url: 'https://www.tiktok.com/@badflowermusic' },
  ],
  featuredSong: { title: 'Ghost', spotifyUrl: 'https://open.spotify.com/track/4n3gE7szkumn7MxCEnnSTu' },
  featuredVideo: null,
  fanList: { enabled: true, headline: 'Join the fan list', message: null, buttonLabel: 'Join' },
}
const WIKI_LIVE = 'Photo: Crisco 1492 (Chris Woodrich), Wikimedia Commons, CC BY-SA 4.0'
const WIKI_JOSH = 'Photo: Melanie Mae Williamson, Wikimedia Commons, CC BY-SA 4.0'

export const DEMO_SLUG = 'demo-badflower'

export function demoBadflowerSnapshot() {
  const hero = mediaRef({ url: FALLBACK_SNAPSHOT.heroImage, width: 1600, height: 1000 }, {
    source: 'studio_asset', use: 'organic', label: 'Hero (homepage)', focal: { x: 50, y: 10 },
  })
  const photos = [
    hero,
    // Dimensions are the real file sizes (public/images/ads/badflower); focal points sit on the faces.
    mediaRef({ url: '/images/ads/badflower/josh.jpg', width: 1920, height: 1468 }, { source: 'studio_asset', use: 'organic', label: 'Josh Katz, live', focal: { x: 50, y: 34 }, credit: WIKI_JOSH }),
    mediaRef({ url: '/images/ads/badflower/live-01.jpg', width: 1920, height: 1382 }, { source: 'studio_asset', use: 'organic', label: 'Caesars Windsor 2023', focal: { x: 50, y: 40 }, credit: WIKI_LIVE }),
    mediaRef({ url: '/images/ads/badflower/live-02.jpg', width: 1280, height: 2274 }, { source: 'studio_asset', use: 'organic', label: 'Caesars Windsor 2023 (2)', focal: { x: 54, y: 14 }, credit: WIKI_LIVE }),
    mediaRef({ url: '/images/ads/badflower/live-03.jpg', width: 1600, height: 1032 }, { source: 'studio_asset', use: 'organic', label: 'Caesars Windsor 2023 (3)', focal: { x: 50, y: 40 }, credit: WIKI_LIVE }),
    mediaRef({ url: '/images/ads/badflower/live-07.jpg', width: 1920, height: 945 }, { source: 'studio_asset', use: 'organic', label: 'Caesars Windsor 2023 (4)', focal: { x: 50, y: 46 }, credit: WIKI_LIVE }),
  ].filter(Boolean)
  const songArt = mediaRef({ url: '/images/ads/badflower/ok-im-sick.jpg', width: 220, height: 220 }, {
    source: 'studio_asset', use: 'preview', label: 'OK, I\'m Sick — cover',
  })
  return {
    bandId: null,
    slug: 'badflower',
    name: FALLBACK_SNAPSHOT.name,
    genre: 'Alternative Rock',
    genres: FALLBACK_SNAPSHOT.genre,
    bio: FALLBACK_SNAPSHOT.bio,
    tagline: 'Los Angeles rock. Raw songs about mental health, identity, and modern life.',
    pageUrl: 'https://faneqo.com/badflower',
    hero,
    photos,
    song: {
      title: FALLBACK_SNAPSHOT.featuredSong?.title || 'Ghost',
      platform: 'spotify',
      spotifyUrl: FALLBACK_SNAPSHOT.featuredSong?.spotifyUrl || null,
      type: 'track',
      art: songArt,
      artFrom: 'studio_asset',
      previewArt: null,
    },
    video: FALLBACK_SNAPSHOT.featuredVideo ? { youtubeId: FALLBACK_SNAPSHOT.featuredVideo.youtubeId, title: FALLBACK_SNAPSHOT.featuredVideo.title } : null,
    releases: [
      { id: null, title: 'OK, I\'m Sick', type: 'album', releaseDate: '2019-02-22', url: null, streamingService: null, art: songArt },
    ],
    shows: [],
    upcomingShows: [],
    galleries: [
      { id: null, title: 'Live', slug: null, photoCount: 4, photos: photos.slice(2) },
    ],
    links: Object.fromEntries([
      ...FALLBACK_SNAPSHOT.streaming.map((s) => [s.name, s.url]),
      ...FALLBACK_SNAPSHOT.social.map((s) => [s.name, s.url]),
      ['website', FALLBACK_SNAPSHOT.website?.url],
    ].filter(([, url]) => url)),
    fanList: {
      enabled: true,
      headline: FALLBACK_SNAPSHOT.fanList?.headline || 'Join the fan list',
      message: FALLBACK_SNAPSHOT.fanList?.message || null,
      buttonLabel: FALLBACK_SNAPSHOT.fanList?.buttonLabel || 'Join',
    },
    snapshotAt: '2026-10-10T00:00:00.000Z',
    demo: true,
  }
}

/**
 * The homepage demo artist is stored in Strapi as a stub ("This is the bio",
 * "Some Song", no streaming URLs). Fill only the empty fields from the fixture
 * the Create gallery already shows. A real biography, song, photo, or link is kept.
 * Any other artist is returned unchanged — missing links stay missing.
 */
export function withDemoFallback(snapshot) {
  if (!snapshot || String(snapshot.slug || '').toLowerCase() !== 'badflower') return snapshot
  const demo = demoBadflowerSnapshot()
  const next = { ...snapshot }
  let filled = false
  if (!next.bio) { next.bio = demo.bio; filled = true }
  if (!next.tagline) { next.tagline = demo.tagline; filled = true }
  if (!next.song) { next.song = demo.song; filled = true }
  if (!next.hero) {
    next.hero = demo.hero
    if (!next.photos?.length) next.photos = demo.photos
    filled = true
  }
  if (!next.links || !Object.keys(next.links).length) {
    next.links = { ...demo.links }
    filled = true
  }
  if (filled) next.demoFilled = true
  return next
}
