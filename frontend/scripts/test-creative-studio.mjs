/**
 * Creative Studio V2 — pure logic and source contracts.
 * Run: node scripts/test-creative-studio.mjs
 *
 * Covers: formats (square), artist snapshot mapping with a rich band, a
 * sparse band and the demo fixture, rights tags, the creative model
 * (families, defaults, duplicate, artist swap, validation, records),
 * publishing packages, library categories, file names, and the studio's
 * server routes / pages / middleware source contracts.
 */
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { AD_FORMATS, AD_FORMAT_ORDER, AD_SAFE_ZONES, formatSummary, isAdFormat, resolveAdFormat, gridCrop } from '../features/ads/formats.js'
import {
  MEDIA_SOURCES,
  buildArtistSnapshot,
  mediaRef,
  rightsStatusFor,
  rightsWarnings,
  snapshotMediaOptions,
} from '../features/ads/studio/artistSnapshot.js'
import { ACCENTS, SPOTLIGHT_DEFAULT_STYLE, SPOTLIGHT_STYLES, TEMPLATE_FAMILIES, TEMPLATE_IDS, fillToken, spotlightStyle, templateFamily } from '../features/ads/studio/families.js'
import { EDUCATION_TOPICS, educationTopic } from '../features/ads/studio/education.js'
import { demoBadflowerSnapshot, withDemoFallback } from '../features/ads/studio/fixtures.js'
import {
  LIBRARY_CATEGORIES,
  applyArtistSnapshot,
  compareCreatives,
  creativeDisplayTitle,
  creativeFileName,
  creativeMatchesCategory,
  creativeMatchesMedia,
  creativeMatchesQuery,
  creativeTitle,
  isGeneratedTitle,
  nextCreativePageStart,
  deriveRights,
  duplicateCreative,
  finalizeCreative,
  fromRecord,
  newCreative,
  sceneCountFor,
  toRecord,
  trimSnapshot,
  validateCreative,
} from '../features/ads/studio/creativeModel.js'
import { buildPublishingPackage, destinationFor, hashtagsFor } from '../features/ads/studio/publishing.js'
import { boardVars, headlineScale, nameScale } from '../features/ads/studio/board.js'
import {
  PRODUCT_MOTION_CLOSE,
  PRODUCT_MOTION_MS,
  closeLines,
  defaultProductMotion,
  formatMotionClock,
  motionSettings,
  pageTravel,
  fanListPose,
  nightPose,
  productMotionFilm,
  productShowcasePose,
} from '../features/ads/studio/motion.js'
import { productStyle } from '../features/ads/studio/campaigns.js'
import { applyVideoCreation, creationLane, laneKeepsFamily, videoFilms } from '../features/ads/studio/creationLanes.js'
import { galleryPhotos } from '../features/ads/studio/campaigns.js'
import { pieceReadiness, subjectForCreative, subjectsForLane } from '../features/ads/studio/creativeCatalog.js'
import { gateVideoRequest, productionJobRequest, settleCancelledJob, unsafeVideoFields } from '../features/ads/studio/videoExportContract.js'
import {
  MOTION_EXPORT_HEIGHT,
  MOTION_EXPORT_WIDTH,
  MOTION_FPS,
  assertExportableMotion,
  motionDownloadName,
  motionFrameCount,
  motionFrameTimeMs,
  motionFrameTimes,
} from '../features/ads/studio/motionExport.js'
import { focalToObjectPosition, studioImageUrl } from '../features/ads/studio/mediaUrl.js'
import {
  STUDIO_UPLOAD_ACCEPT,
  STUDIO_UPLOAD_MAX_BYTES,
  STUDIO_UPLOAD_SOURCE,
  collectStudioUploads,
  isStudioUpload,
  uploadRefFromStrapi,
  validateStudioImage,
} from '../features/ads/studio/studioUploads.js'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const read = (rel) => readFileSync(resolve(root, rel), 'utf8')

// ---------------------------------------------------------------- formats
assert.deepEqual(AD_FORMAT_ORDER, ['post', 'feed', 'story', 'square'])
assert.equal(AD_FORMATS.square.width, 1080)
assert.equal(AD_FORMATS.square.height, 1080)
assert.equal(AD_FORMATS.square.chip, 'Square · 1:1')
assert.equal(AD_FORMATS.square.file, 'square')
assert.equal(isAdFormat('square'), true)
assert.equal(resolveAdFormat('square', ['square', 'post']), 'square')
assert.equal(resolveAdFormat('square', ['post']), 'post')
assert.equal(formatSummary(['post', 'feed', 'story', 'square']), '3:4 · 4:5 · 9:16 · 1:1')
// A 1:1 file in the 3:4 profile grid loses 135px on each side.
assert.deepEqual(gridCrop('square'), { top: 0, bottom: 0, left: 135, right: 135 })
assert.equal(AD_SAFE_ZONES.square, AD_SAFE_ZONES.post)

// ---------------------------------------------------------------- snapshot mapping
const NOW = new Date('2026-10-10T12:00:00Z')
const upload = (id, url, w, h, alt = null) => ({ id, url, width: w, height: h, alternativeText: alt, formats: { small: { url: url.replace('.jpg', '_small.jpg') } } })

const richBand = {
  id: 2,
  name: 'The Rockers ',
  slug: 'therockers',
  genre: 'Rock, Indie',
  bio: 'The best band in the world. Second sentence here.',
  bandImg: upload(10, 'https://qrcode101.s3.us-east-1.amazonaws.com/hero.jpg', 1600, 1000),
  cyberedImagePositionX: 50,
  cyberedImagePositionY: 30,
  singlesong: { title: 'Fallback', spotifyOembedTitle: 'starring me (as myself)', spotifyUrl: 'https://open.spotify.com/track/abc', spotifyOembedThumbnailUrl: 'https://i.scdn.co/image/abc', cover: null },
  albums: [{ id: 5, title: 'First Album', releaseDate: '2024-05-01', cover: upload(12, 'https://qrcode101.s3.us-east-1.amazonaws.com/album.jpg', 1400, 1400) }],
  events: [
    { id: 1, title: 'Past night', date: '2026-09-20', venue: 'The Room', city: 'Austin', state: 'TX', link: 'https://tickets.example/1' },
    { id: 2, title: 'Future night', date: '2026-11-02', venue: 'The Hall', city: 'Denver', state: 'CO', link: 'https://tickets.example/2', image: upload(13, 'https://qrcode101.s3.us-east-1.amazonaws.com/show.jpg', 1200, 1600) },
  ],
  spotify: 'https://open.spotify.com/artist/x',
  instagram: 'https://instagram.com/therockers',
  fanListEnabled: true,
}

const richGalleries = [
  { id: 1, title: 'Live', slug: 'live', photoCount: 2, photos: [
    upload(11, 'https://qrcode101.s3.us-east-1.amazonaws.com/live1.jpg', 4096, 6144, 'Live'),
    { data: { id: 14, attributes: upload(14, 'https://qrcode101.s3.us-east-1.amazonaws.com/live2.jpg', 2048, 1365) } },
  ] },
  { id: 2, title: 'Empty', photos: [] },
]
const rich = buildArtistSnapshot(richBand, { now: NOW, baseUrl: 'https://faneqo.com', galleries: richGalleries })
assert.deepEqual(rich.hero.focal, { x: 50, y: 30 }, 'hero focal comes from the page crop position')
assert.equal(rich.galleries.length, 1, 'galleries without photos are dropped')
assert.equal(rich.photos.length, 4, 'hero + 2 gallery photos + 1 show image, deduped')
assert.equal(rich.name, 'The Rockers')
assert.equal(rich.slug, 'therockers')
assert.equal(rich.genre, 'Rock')
assert.equal(rich.pageUrl, 'https://faneqo.com/therockers')
assert.ok(rich.hero?.url.includes('hero.jpg'))
assert.equal(rich.hero.source, 'band_upload')
assert.equal(rich.hero.use, 'organic')
assert.ok(rich.photos.length >= 2, 'photos include hero and gallery uploads')
assert.equal(rich.photos.find((p) => p.url.includes('live1'))?.orientation, 'portrait')
assert.equal(rich.song.title, 'starring me (as myself)')
assert.equal(rich.song.spotifyUrl, 'https://open.spotify.com/track/abc')
// No uploaded single cover and the album does not match the song → Spotify thumb, preview only.
assert.equal(rich.song.art?.source, 'spotify_oembed')
assert.equal(rich.song.art?.use, 'preview')
assert.equal(rich.releases.length, 1)
assert.equal(rich.releases[0].art?.source, 'band_upload')
assert.equal(rich.shows.length, 2)
assert.equal(rich.shows.find((s) => s.city === 'Austin').upcoming, false)
assert.equal(rich.shows.find((s) => s.city === 'Denver').upcoming, true)
assert.equal(rich.upcomingShows.length, 1)
assert.equal(rich.upcomingShows[0].image?.url.includes('show.jpg'), true)
assert.equal(rich.links.spotify, 'https://open.spotify.com/artist/x')
assert.equal(rich.fanList.enabled, true)
assert.equal(typeof rich.snapshotAt, 'string')

const sparseBand = { id: 7, name: 'Sparse', slug: 'sparse', genre: null, bio: null, bandImg: null, bandImgs: [], singlesong: null, albums: [], events: [] }
const sparse = buildArtistSnapshot(sparseBand, { now: NOW })
assert.equal(sparse.hero, null)
assert.deepEqual(sparse.photos, [])
assert.equal(sparse.song, null)

const stub = buildArtistSnapshot({
  id: 9,
  name: 'BADFLOWER',
  slug: 'badflower',
  bio: 'This is the bio',
  bandImg: upload(20, 'https://qrcode101.s3.us-east-1.amazonaws.com/badflower.png', 1200, 1500),
  singlesong: { title: 'Some Song' },
  facebook: 'google.com',
  spotify: 'open.spotify.com/artist/real',
  websitelink: 'www.badflowermusic.com',
}, { now: NOW })
assert.equal(stub.bio, null, 'placeholder biography is omitted')
assert.equal(buildArtistSnapshot({ id: 11, name: 'Smoke', slug: 'smoke', bio: 'some bio' }, { now: NOW }).bio, null)
assert.equal(stub.song, null, 'placeholder song title is omitted')
assert.equal(stub.links.facebook, undefined, 'a facebook field that is not facebook is dropped')
assert.equal(stub.links.spotify, 'https://open.spotify.com/artist/real')
assert.equal(stub.links.website, 'https://www.badflowermusic.com')
assert.ok(stub.hero?.url.includes('badflower.png'))

const filled = withDemoFallback({ ...stub, links: {} })
assert.equal(filled.bio.includes('Los Angeles'), true, 'empty demo biography uses the fixture')
assert.equal(filled.song.title, 'Ghost')
assert.equal(filled.links.spotify.includes('spotify.com'), true)
assert.ok(filled.hero.url.includes('badflower.png'), 'a real hero is not replaced by the fixture')
assert.equal(filled.demoFilled, true)
const kept = withDemoFallback({ ...stub, bio: 'A real biography.', song: { title: 'Ghost', art: null }, links: { youtube: 'https://www.youtube.com/user/wearebadflower' } })
assert.equal(kept.bio, 'A real biography.')
assert.equal(kept.song.title, 'Ghost')
assert.equal(kept.links.spotify, undefined, 'a real artist link set is not padded with fixture links')
assert.equal(withDemoFallback(sparse).links?.spotify, undefined, 'other artists do not receive Badflower links')
assert.deepEqual(sparse.shows, [])
assert.deepEqual(sparse.upcomingShows, [])
assert.deepEqual(snapshotMediaOptions(sparse), [])

const options = snapshotMediaOptions(rich)
assert.ok(options.some((o) => o.group === 'Photos'))
assert.ok(options.some((o) => o.group === 'Artwork'))
assert.ok(options.some((o) => o.group === 'Preview only' && o.source === 'spotify_oembed'))
assert.equal(new Set(options.map((o) => o.url)).size, options.length, 'media options are deduped by url')

// ---------------------------------------------------------------- rights
const organic = mediaRef('https://x/a.jpg', { source: 'band_upload', use: 'organic' })
const preview = mediaRef('https://x/b.jpg', { source: 'spotify_oembed', use: 'preview' })
const paidOk = mediaRef('https://x/c.jpg', { source: 'studio_asset', use: 'paid', credit: 'Photo: Someone, CC BY-SA 4.0' })
assert.equal(rightsStatusFor([]), 'clear')
assert.equal(rightsStatusFor([organic]), 'clear')
assert.equal(rightsStatusFor([organic], { paid: true }), 'needs_permission')
assert.equal(rightsStatusFor([preview]), 'needs_permission')
assert.equal(rightsStatusFor([paidOk], { paid: true }), 'clear')
assert.equal(rightsStatusFor([null, organic, undefined]), 'clear')
assert.match(rightsWarnings([preview])[0], /Spotify thumbnail is preview-only/)
assert.match(rightsWarnings([organic], { paid: true })[0], /paid promotion/)
assert.match(rightsWarnings([paidOk])[0], /Credit required: Photo: Someone/)
assert.equal(mediaRef(null), null)
assert.equal(mediaRef({ url: '' }), null)
assert.equal(mediaRef('x', { source: 'nonsense', use: 'nonsense' }).source, 'band_upload')
assert.equal(mediaRef('x', { source: 'nonsense', use: 'nonsense' }).use, 'preview')

// ---------------------------------------------------------------- families
assert.deepEqual(TEMPLATE_IDS, ['artist-spotlight', 'song-spotlight', 'product-showcase', 'type-statement', 'education', 'insights', 'show-promo'])
for (const family of TEMPLATE_FAMILIES) {
  assert.ok(family.name && family.tagline, `${family.id} has name + tagline`)
  assert.ok(family.formats.every(isAdFormat), `${family.id} formats valid`)
  assert.ok(family.formats.includes(family.defaultFormat), `${family.id} default format supported`)
  const defaults = family.defaults(rich)
  if (family.styles?.length >= 2 && !family.variants?.length) {
    assert.ok(family.fields.includes('style'), `${family.id} selects a design style`)
    assert.ok(family.styles.some((s) => s.id === defaults.style), `${family.id} default style is one of its styles`)
  } else {
    assert.ok(family.variants.length >= 2, `${family.id} has at least two curated variants`)
    assert.ok(family.fields.includes('variant'))
    assert.ok(family.fields.includes('cta'))
    assert.equal(defaults.variant, family.variants[0].id, `${family.id} default variant is the first`)
  }
  assert.ok(Array.isArray(family.media(defaults)))
  assert.ok(family.scenes(defaults) >= 1)
  assert.equal(typeof family.summary(defaults), 'string')
  // Node-loadable: no Vue component bound in the pure module.
  assert.equal(family.component, undefined)
}
assert.equal(templateFamily('nope'), null)
assert.ok(ACCENTS.length >= 5 && ACCENTS.every((a) => /^#[0-9a-f]{6}$/.test(a.hex)))
assert.equal(fillToken('Live in {city}', { city: 'Denver' }), 'Live in Denver')
assert.equal(fillToken('Live in {city}', {}), 'Live in')
assert.equal(fillToken('Meet {artist}', { artist: 'The Rockers' }), 'Meet The Rockers')

// Education copy: curated, no statistics or promises.
assert.ok(EDUCATION_TOPICS.length >= 4)
for (const topic of EDUCATION_TOPICS) {
  assert.ok(topic.slides.length >= 3 && topic.slides.length <= 6, `${topic.id} slide count`)
  const text = [topic.cover.headline, topic.cover.sub, ...topic.slides.flatMap((s) => [s.title, s.body]), topic.closing.headline, topic.closing.line].join(' ')
  assert.doesNotMatch(text, /\d+\s?%|\d+x\b|guarantee|double your|triple/i, `${topic.id} must not contain statistics or promises`)
  assert.doesNotMatch(text, /\bAI\b|AI-generated|generated by/i, `${topic.id} must not claim generation`)
}
assert.equal(educationTopic('missing').id, EDUCATION_TOPICS[0].id, 'unknown topic falls back to the first')
assert.equal(educationTopic('promote-next-show').id, 'promote-next-show')

// ---------------------------------------------------------------- creative model
const spotlight = newCreative('artist-spotlight', { snapshot: rich, now: NOW })
assert.equal(spotlight.id, null)
assert.equal(spotlight.title, 'The Rockers — Artist Spotlight — Instagram Post')
assert.equal(spotlight.kind, 'post')
assert.equal(spotlight.status, 'draft')
assert.equal(spotlight.primaryFormat, 'post')
assert.deepEqual(spotlight.formats, ['post', 'feed', 'story', 'square'])
assert.equal(spotlight.variant, 'photo')
assert.equal(spotlight.content.artistName, 'The Rockers')
assert.equal(spotlight.content.description, 'The best band in the world.')
assert.equal(spotlight.content.photo.url, rich.hero.url)
assert.equal(spotlight.content.songTitle, 'starring me (as myself)')
assert.equal(spotlight.rightsStatus, 'needs_permission', 'Spotify art in the song row needs permission')
assert.equal(spotlight.sceneCount, 1)
assert.equal(spotlight.bandSlug, 'therockers')
assert.deepEqual(validateCreative(spotlight), [])

// Spotlight design styles: new creatives get Editorial Icon; records saved before styles existed stay Original.
assert.deepEqual(SPOTLIGHT_STYLES.map((s) => s.id), ['editorial', 'cinematic', 'culture', 'legacy'])
assert.equal(SPOTLIGHT_DEFAULT_STYLE, 'editorial')
assert.equal(spotlight.content.style, 'editorial', 'new spotlight defaults to Editorial Icon')
assert.equal(spotlightStyle(spotlight.content), 'editorial')
assert.equal(spotlightStyle({}), 'legacy', 'no style key = the original rendering')
assert.equal(spotlightStyle({ style: 'bogus' }), 'legacy', 'unknown style falls back to the original rendering')
assert.equal(spotlightStyle(null), 'legacy')
assert.ok(templateFamily('artist-spotlight').fields.includes('style'))
assert.equal(templateFamily('artist-spotlight').showVariants({ style: 'legacy' }), true, 'Original keeps its layout variants')
assert.equal(templateFamily('artist-spotlight').showVariants({}), true)
assert.equal(templateFamily('artist-spotlight').showVariants({ style: 'editorial' }), false, 'new styles have one composition per format')
const legacyRow = { id: 41, attributes: { templateId: 'artist-spotlight', content: { variant: 'portrait', artistName: 'Old Band', cta: 'Discover more artists' }, snapshot: null, formats: ['post'], primaryFormat: 'post' } }
const legacyLoaded = fromRecord(legacyRow)
assert.equal('style' in legacyLoaded.content, false, 'loading an old record does not add a style')
assert.equal(spotlightStyle(legacyLoaded.content), 'legacy')
assert.equal('style' in toRecord(legacyLoaded).content, false, 'saving an old record does not migrate it')
assert.equal(legacyLoaded.variant, 'portrait')
const restyled = finalizeCreative({ ...legacyLoaded, content: { ...legacyLoaded.content, style: 'cinematic' } })
assert.equal(toRecord(restyled).content.style, 'cinematic', 'an explicit choice persists')
assert.equal(toRecord(restyled).content.variant, 'portrait', 'choosing a style keeps the rest of the content')
const legacySwapped = applyArtistSnapshot(legacyLoaded, sparse)
assert.equal('style' in legacySwapped.content, false, 'changing the artist on an old record does not change its style')

const asAd = finalizeCreative({ ...spotlight, kind: 'ad', content: { ...spotlight.content, songTitle: '' } })
assert.equal(asAd.rightsStatus, 'needs_permission', 'artist uploads need consent for paid use')
assert.equal(asAd.title, spotlight.title, 'finalize keeps an existing title')
assert.equal(creativeTitle({ ...asAd, title: '' }), 'The Rockers — Artist Spotlight — Feed Ad')
assert.equal(creativeTitle({ ...asAd, title: '', primaryFormat: 'story' }), 'The Rockers — Artist Spotlight — Story Ad')
assert.equal(creativeTitle({ ...spotlight, title: '', primaryFormat: 'square' }), 'The Rockers — Artist Spotlight — Square Post')

const noSong = finalizeCreative({ ...spotlight, content: { ...spotlight.content, songTitle: '' } })
assert.equal(noSong.rightsStatus, 'clear', 'without the Spotify tile an organic upload is clear')

const song = newCreative('song-spotlight', { snapshot: rich, now: NOW })
assert.equal(song.content.title, 'starring me (as myself)')
assert.equal(song.content.art.source, 'spotify_oembed')
assert.equal(song.rightsStatus, 'needs_permission')
assert.equal(song.content.site, 'faneqo.com/therockers')

const product = newCreative('product-showcase', { snapshot: null, now: NOW })
assert.equal(product.artistName, null)
assert.equal(product.title, 'Your entire music world. — Product Showcase — Feed Post')
assert.equal(product.primaryFormat, 'feed')
assert.equal(product.rightsStatus, 'clear')

const statement = newCreative('type-statement', { now: NOW })
assert.equal(statement.title, 'Bands need fans. — Typography Statement — Instagram Post')
assert.equal(statement.content.photo, null)

const education = newCreative('education', { now: NOW })
assert.equal(education.primaryFormat, 'square')
assert.deepEqual(education.formats, ['square', 'post', 'story'])
assert.equal(education.sceneCount, 7, 'cover + 5 slides + closing')
assert.equal(sceneCountFor({ ...education, content: { ...education.content, slides: education.content.slides.slice(0, 2) } }), 4)
assert.equal(sceneCountFor({ ...education, content: { ...education.content, slides: [], closing: null } }), 1)

const promo = newCreative('show-promo', { snapshot: rich, now: NOW })
assert.equal(promo.content.show.city, 'Denver', 'defaults to the next upcoming show, never a past one')
assert.equal(promo.content.headline, 'Live in Denver')
const promoSparse = newCreative('show-promo', { snapshot: sparse, now: NOW })
assert.equal(promoSparse.content.show, null, 'no events → no show, nothing invented')
assert.equal(promoSparse.content.photo, null)
assert.equal(promoSparse.rightsStatus, 'clear')
assert.equal(promoSparse.title, 'Sparse — Show Promotion — Instagram Post')

// Duplicate is independent.
const dup = duplicateCreative({ ...spotlight, id: '44', status: 'ready' }, { now: NOW })
assert.equal(dup.id, null)
assert.equal(dup.status, 'draft')
assert.equal(dup.title, `${spotlight.title} (variation)`)
assert.equal(duplicateCreative(dup, { now: NOW }).title, `${spotlight.title} (variation 2)`)
dup.content.headlineTop = 'Changed'
assert.equal(spotlight.content.headlineTop, 'Artist', 'duplicate does not share content')

// Artist swap keeps user copy, replaces artist-bound fields.
const edited = finalizeCreative({ ...spotlight, content: { ...spotlight.content, cta: 'My custom CTA', headlineTop: 'Hello' } })
const swapped = applyArtistSnapshot(edited, sparse)
assert.equal(swapped.artistName, 'Sparse')
assert.equal(swapped.content.artistName, 'Sparse')
assert.equal(swapped.content.photo, null)
assert.equal(swapped.content.cta, 'My custom CTA', 'edited CTA survives the swap')
assert.equal(swapped.content.headlineTop, 'Hello', 'a custom spotlight headline survives the swap')
const promoSwapped = applyArtistSnapshot(finalizeCreative({ ...promo, content: { ...promo.content, cta: 'Doors 8pm' } }), sparse)
assert.equal(promoSwapped.content.headline, 'Live', 'show headline is artist-bound (city) and resets')
assert.equal(promoSwapped.content.show, null)
assert.equal(promoSwapped.content.cta, 'Doors 8pm')
assert.equal(swapped.title, 'Sparse — Artist Spotlight — Instagram Post')

// Manual artwork: studio uploads are media refs that belong to the creative, not the artist.
assert.ok(MEDIA_SOURCES.includes(STUDIO_UPLOAD_SOURCE))
assert.deepEqual(validateStudioImage(null), { ok: false, error: 'Choose an image file.' })
assert.equal(validateStudioImage({ type: 'image/gif', size: 10 }).ok, false)
assert.equal(validateStudioImage({ type: 'image/heic', size: 10 }).ok, false, 'studio takes web formats only')
assert.equal(validateStudioImage({ type: 'image/png', size: STUDIO_UPLOAD_MAX_BYTES + 1 }).ok, false)
assert.equal(validateStudioImage({ type: 'image/jpeg', size: 1024 }).ok, true)
assert.equal(STUDIO_UPLOAD_ACCEPT, 'image/jpeg,image/png,image/webp')
const strapiRow = { id: 9001, name: 'cover.jpg', url: '/uploads/cover_abc.jpg', width: 1200, height: 1200, mime: 'image/jpeg', createdAt: '2026-10-11T00:00:00.000Z' }
const upRef = uploadRefFromStrapi(strapiRow, { strapiUrl: 'http://localhost:1337/', label: 'cover' })
assert.equal(upRef.url, 'http://localhost:1337/uploads/cover_abc.jpg', 'relative upload URLs are made absolute')
assert.equal(upRef.source, 'studio_upload')
assert.equal(upRef.use, 'organic')
assert.equal(upRef.orientation, 'square')
assert.deepEqual(upRef.focal, { x: 50, y: 38 })
assert.equal(upRef.label, 'cover')
assert.equal(upRef.id, 9001)
assert.equal(uploadRefFromStrapi({ ...strapiRow, url: 'https://qrcode101.s3.us-east-1.amazonaws.com/x.jpg' }).url, 'https://qrcode101.s3.us-east-1.amazonaws.com/x.jpg', 'absolute URLs untouched')
assert.equal(uploadRefFromStrapi({ ...strapiRow, width: 800, height: 1200 }).focal.y, 26, 'portrait uploads use the portrait focal default')
assert.equal(uploadRefFromStrapi({ ...strapiRow, width: 1200, height: 800 }).orientation, 'landscape')
assert.equal(uploadRefFromStrapi(null), null)
assert.equal(uploadRefFromStrapi({ id: 1 }), null, 'no url → no ref')
assert.ok(isStudioUpload(upRef))
assert.equal(isStudioUpload(rich.hero), false)
assert.equal(isStudioUpload(null), false)
assert.equal(mediaRef(strapiRow, { source: 'studio_upload' }).source, 'studio_upload', 'the snapshot mapper accepts the new source')
// The upload sits in content like any other ref, round-trips through a record, and survives an artist swap.
const withUpload = finalizeCreative({ ...spotlight, content: { ...spotlight.content, songTitle: 'New single', songArt: upRef } })
assert.equal(withUpload.rightsStatus, 'clear', 'an organic upload never blocks a post')
const uploadOnlyAd = finalizeCreative({ ...newCreative('song-spotlight', { snapshot: sparse, now: NOW }), kind: 'ad', content: { ...newCreative('song-spotlight', { snapshot: sparse, now: NOW }).content, art: upRef } })
assert.equal(uploadOnlyAd.rightsStatus, 'needs_permission', 'uploads are organic: a paid ad still asks for the artist’s permission, same as their own photos')
assert.deepEqual(fromRecord(toRecord(withUpload), { storage: 'api' }).content.songArt, upRef, 'the ref persists byte-for-byte')
const swappedUpload = applyArtistSnapshot(withUpload, sparse)
assert.deepEqual(swappedUpload.content.songArt, upRef, 'manual artwork survives an artist swap')
assert.equal(swappedUpload.content.songTitle, 'New single', 'and so does its title when the artwork is kept')
const photoUpload = applyArtistSnapshot(finalizeCreative({ ...spotlight, content: { ...spotlight.content, photo: upRef, focal: { x: 20, y: 70 } } }), sparse)
assert.deepEqual(photoUpload.content.photo, upRef, 'an uploaded photograph survives too')
assert.deepEqual(photoUpload.content.focal, { x: 20, y: 70 }, 'with its focal point')
// Reuse across creatives is by reference: the library scan lists each upload once, newest first.
const libA = { id: 1, updatedAt: '2026-10-01T00:00:00Z', content: { photo: rich.hero, songArt: upRef } }
const libB = { id: 2, updatedAt: '2026-10-09T00:00:00Z', content: { art: { ...upRef, url: 'https://cdn.example/other.jpg', label: 'other' } } }
const libC = { id: 3, updatedAt: '2026-10-05T00:00:00Z', content: { art: upRef, photo: { ...rich.hero, source: 'band_upload' } } }
const reuse = collectStudioUploads([libA, libB, libC])
assert.deepEqual(reuse.map((u) => u.label), ['other', 'cover'])
assert.ok(reuse.every((u) => u.group === 'Uploaded'))
assert.deepEqual(collectStudioUploads([libA], { exclude: [upRef.url] }), [])
assert.deepEqual(collectStudioUploads([]), [])
assert.deepEqual(collectStudioUploads([{ content: null }, null]), [])
// Only families where album artwork is relevant expose an artwork control.
assert.ok(templateFamily('song-spotlight').fields.includes('art'))
assert.ok(templateFamily('artist-spotlight').fields.includes('songArt'))
assert.ok(templateFamily('product-showcase').fields.includes('excerptArt'))
assert.ok(templateFamily('product-showcase').fields.includes('photo'))
const ARTWORK_FIELDS = ['art', 'songArt', 'excerptArt']
for (const id of ['education', 'type-statement', 'show-promo']) {
  assert.equal(templateFamily(id).fields.some((f) => ARTWORK_FIELDS.includes(f)), false, `${id} has no artwork control`)
}
// Product showcase: artwork is distinct from the hero and both can be set.
const showcase = newCreative('product-showcase', { snapshot: rich, now: NOW })
assert.deepEqual(showcase.content.photo, rich.hero)
assert.notDeepEqual(showcase.content.songArt, rich.hero)
const showcaseArt = finalizeCreative({ ...showcase, content: { ...showcase.content, songArt: upRef } })
assert.deepEqual(templateFamily('product-showcase').media(showcaseArt.content).map((m) => m?.url), [rich.hero.url, upRef.url])

// Validation.
assert.deepEqual(validateCreative(null), ['Creative is missing.'])
assert.ok(validateCreative({ ...spotlight, templateId: 'nope' }).includes('Unknown template.'))
assert.ok(validateCreative({ ...spotlight, kind: 'x' }).includes('Kind must be post or ad.'))
assert.ok(validateCreative({ ...spotlight, status: 'live' }).includes('Status must be draft or ready.'))
assert.ok(validateCreative({ ...spotlight, primaryFormat: 'huge' }).includes('Primary format is invalid.'))
assert.ok(validateCreative({ ...spotlight, content: { blob: 'x'.repeat(70 * 1024) } }).some((e) => /too large/.test(e)))
assert.ok(validateCreative({ ...spotlight, title: 'x'.repeat(161) }).includes('Title is too long.'))

// Records round-trip; snapshot trimmed; storage flagged.
const trimmed = trimSnapshot({ ...rich, photos: Array.from({ length: 80 }, (_, i) => mediaRef(`https://x/${i}.jpg`)) })
assert.equal(trimmed.photos.length, 40)
const record = toRecord(spotlight)
assert.deepEqual(Object.keys(record).sort(), ['artistName', 'bandId', 'bandSlug', 'content', 'formats', 'kind', 'primaryFormat', 'rightsStatus', 'sceneCount', 'snapshot', 'status', 'templateId', 'title', 'variant'].sort())
assert.ok(!('id' in record) && !('storage' in record) && !('ownerEmail' in record))
const back = fromRecord({ id: 9, ...record, createdAt: '2026-10-10T00:00:00.000Z' })
assert.equal(back.id, '9')
assert.equal(back.storage, 'api')
assert.equal(back.title, spotlight.title)
assert.equal(fromRecord({ id: 'local-abc', ...record }, { storage: 'local' }).storage, 'local')
assert.equal(fromRecord({ id: 3, attributes: record }).templateId, 'artist-spotlight')
assert.equal(fromRecord(null), null)

// Library categories and names.
assert.deepEqual(LIBRARY_CATEGORIES.map((c) => c.label), ['All', 'Social posts', 'Paid ads', 'Drafts', 'Ready'])
assert.equal(creativeMatchesCategory(spotlight, 'all'), true)
assert.equal(creativeMatchesCategory(spotlight, 'post'), true)
assert.equal(creativeMatchesCategory(spotlight, 'ad'), false)
assert.equal(creativeMatchesCategory(asAd, 'ad'), true)
assert.equal(creativeMatchesCategory(spotlight, 'status'), true)
assert.equal(creativeMatchesCategory(spotlight, 'templates'), false)
assert.equal(creativeMatchesCategory(spotlight, 'draft'), true)
assert.equal(creativeMatchesCategory({ ...spotlight, status: 'ready' }, 'ready'), true)
assert.equal(creativeMatchesCategory({ ...spotlight, status: 'ready' }, 'draft'), false)
assert.equal(creativeMatchesQuery(spotlight, 'rockers'), true)
assert.equal(creativeMatchesQuery(spotlight, 'no-such-artist'), false)
assert.equal(creativeMatchesQuery(spotlight, '  '), true)
const culture = newCreative('artist-spotlight', { snapshot: rich, style: 'culture', now: NOW })
assert.equal(culture.content.style, 'culture')
assert.equal(newCreative('artist-spotlight', { snapshot: rich, style: 'nope', now: NOW }).content.style, 'editorial')
assert.equal(newCreative('insights', { style: 'playbook', now: NOW }).content.style, 'playbook')
assert.equal(newCreative('product-showcase', { variant: 'bleed', now: NOW }).content.variant, 'bleed')
assert.equal(newCreative('product-showcase', { variant: 'nope', now: NOW }).content.variant, 'stack')
assert.equal(isGeneratedTitle(spotlight), true)
assert.equal(creativeDisplayTitle(spotlight), 'The Rockers')
assert.equal(creativeDisplayTitle({ ...spotlight, title: 'My poster' }), 'My poster')
assert.match(creativeDisplayTitle(newCreative('insights', { now: NOW })), /fan list/i)
assert.equal(creativeMatchesMedia(spotlight, 'image'), true)
assert.equal(creativeMatchesMedia(education, 'carousel'), true)
assert.equal(creativeMatchesMedia(spotlight, 'video'), false)
assert.equal(creativeMatchesMedia(spotlight, 'all'), true)
const older = { ...spotlight, id: 'a', updatedAt: '2026-01-01T00:00:00.000Z', title: 'Alpha' }
const newer = { ...spotlight, id: 'b', updatedAt: '2026-06-01T00:00:00.000Z', title: 'Zulu' }
assert.ok(compareCreatives(older, newer, 'updated-desc') > 0)
assert.ok(compareCreatives(older, newer, 'updated-asc') < 0)
assert.ok(compareCreatives(older, newer, 'name') < 0)
assert.equal(nextCreativePageStart({ loaded: 0, batchLength: 200, total: 250, limit: 200 }), 200)
assert.equal(nextCreativePageStart({ loaded: 200, batchLength: 50, total: 250, limit: 200 }), null)
assert.equal(nextCreativePageStart({ loaded: 0, batchLength: 200, total: 200, limit: 200 }), null)
assert.equal(nextCreativePageStart({ loaded: 0, batchLength: 0, total: 0, limit: 200 }), null)
assert.equal(creativeFileName(spotlight, 'post'), 'the-rockers-artist-spotlight-instagram-post.png')
assert.equal(creativeFileName(spotlight, 'story'), 'the-rockers-artist-spotlight-story.png')
assert.equal(creativeFileName(spotlight, 'square'), 'the-rockers-artist-spotlight-square.png')
assert.equal(creativeFileName(education, 'square', 3), 'education-scene-3-square.png')
assert.equal(creativeFileName({ ...spotlight, artistName: 'Ünïcode & Co.!' }, 'feed'), 'unicode-co-artist-spotlight-feed-ad.png')

// ---------------------------------------------------------------- publishing
const pkg = buildPublishingPackage(spotlight)
assert.match(pkg.instagram, /^Artist Spotlight: The Rockers\. The best band in the world\. Featured song: “starring me \(as myself\)”\./)
assert.match(pkg.instagram, /Link in bio/)
assert.match(pkg.instagram, /#therockers/)
assert.match(pkg.facebook, /https:\/\/faneqo\.com\/therockers/)
assert.doesNotMatch(pkg.facebook, /#/)
assert.match(pkg.altText, /The Rockers artist spotlight/)
assert.equal(pkg.url, 'https://faneqo.com/therockers')
assert.equal(pkg.rightsStatus, 'needs_permission')
assert.ok(pkg.warnings.some((w) => /Spotify/.test(w)))
assert.ok(pkg.hashtags.length <= 14 && pkg.hashtags.every((t) => /^#[a-z0-9]+$/.test(t)))
assert.ok(pkg.hashtags.includes('#rock'))
assert.doesNotMatch(pkg.note, /AI|generated by/i)
assert.match(pkg.note, /not posted automatically/)
assert.equal(buildPublishingPackage({ templateId: 'nope' }), null)

const promoPkg = buildPublishingPackage(promo)
assert.match(promoPkg.instagram, /The Rockers live in Denver\./)
assert.match(promoPkg.instagram, /November 2 · The Hall, Denver, CO/)
assert.equal(promoPkg.url, 'https://tickets.example/2', 'show promo points at the ticket link')
assert.ok(promoPkg.hashtags.includes('#denver') && promoPkg.hashtags.includes('#denvermusic'))
assert.equal(destinationFor(product), 'https://faneqo.com')
assert.equal(destinationFor({ templateId: 'show-promo', content: { show: { link: 'javascript:alert(1)' } }, bandSlug: 'x' }), 'https://faneqo.com/x', 'non-http ticket links are ignored')
assert.ok(hashtagsFor(education).includes('#bandtips'))

const eduPkg = buildPublishingPackage(education)
assert.match(eduPkg.instagram, /1\. Reach is rented/)
assert.match(eduPkg.altText, /7 slides|5 slides/)

const demoPkg = buildPublishingPackage(newCreative('artist-spotlight', { snapshot: (await import('../features/ads/studio/fixtures.js')).demoBadflowerSnapshot(), now: NOW }))
assert.ok(demoPkg.credits.length === 0 || demoPkg.credits.every((c) => /CC BY-SA/.test(c)), 'studio asset credits carry through')

// ---------------------------------------------------------------- board helpers / media urls
assert.equal(boardVars('post', { post: { h1: 84 }, story: { h1: 92 } })['--board-w'], '1080px')
assert.equal(boardVars('post', { post: { h1: 84 } })['--h1'], '84px')
assert.ok(nameScale('Ab') === 1 && nameScale('A very long band name indeed') < 1)
assert.ok(headlineScale(['Short']) === 1 && headlineScale(['An extremely long headline line']) < 1)
assert.equal(focalToObjectPosition({ x: 20, y: 120 }), '20% 100%')
assert.equal(focalToObjectPosition(null), '50% 50%')
assert.equal(studioImageUrl('/images/ads/badflower/josh.jpg'), '/images/ads/badflower/josh.jpg')
assert.equal(studioImageUrl('https://qrcode101.s3.us-east-1.amazonaws.com/a.jpg'), '/api/ads/media?u=https%3A%2F%2Fqrcode101.s3.us-east-1.amazonaws.com%2Fa.jpg')
assert.equal(studioImageUrl(''), '')

// ---------------------------------------------------------------- source contracts
const studioAuth = read('server/utils/adsStudioAuth.ts')
const artistsRoute = read('server/api/ads/artists.get.ts')
const artistRoute = read('server/api/ads/artists/[slug].get.ts')
const mediaRoute = read('server/api/ads/media.get.ts')
for (const source of [artistsRoute, artistRoute, mediaRoute]) {
  assert.match(source, /requireStudio\(event\)/, 'every studio route gates on the studio session')
}
assert.match(studioAuth, /import\.meta\.dev === true/, 'dev bypass is compiled out of production')
assert.match(studioAuth, /statusCode: 404/, 'stealth 404')
assert.doesNotMatch(studioAuth + artistsRoute + artistRoute + mediaRoute, /strapiApiToken|userAdminSecret/, 'no privileged token on studio routes')
assert.match(mediaRoute, /qrcode101\.s3\.us-east-1\.amazonaws\.com/)
assert.match(mediaRoute, /image\//)
assert.match(mediaRoute, /private, max-age/)
assert.match(artistRoute, /\^\[a-z0-9\]\[a-z0-9-_\]\{0,80\}\$/)

const store = read('features/ads/studio/useCreativeStore.js')
assert.match(store, /useStrapiToken/)
assert.match(store, /Authorization: `Bearer \$\{token\.value\}`/)
assert.doesNotMatch(store, /strapiApiToken|STRAPI_API_TOKEN/)
assert.match(store, /storage: 'local'/)
assert.match(store, /an API record must not silently fork to local/)
assert.match(store, /start=\$\{start\}/)
assert.match(store, /meta\?\.total/)
assert.match(store, /warning/)

const createPage = read('pages/ads/create.vue')
const editorPage = read('pages/ads/c/[id].vue')
const libraryPage = read('pages/ads/index.vue')
const legacyPlayer = read('pages/ads/[slug].vue')
for (const source of [createPage, editorPage, libraryPage, legacyPlayer]) {
  assert.match(source, /middleware:\s*\[[^\]]*'auth'[^\]]*'ads'/)
  assert.match(source, /layout:\s*false/)
  assert.match(source, /noindex, nofollow/)
}
assert.match(libraryPage, /LIBRARY_CATEGORIES/)
assert.match(libraryPage, /adsCatalog/, 'legacy five remain in the library')
assert.match(libraryPage, /\/ads\/create/)
assert.match(libraryPage, /this device only/)
assert.match(libraryPage, /=== 'templates'/)
assert.match(libraryPage, /archive/)
assert.match(libraryPage, /creativeMatchesQuery/)
assert.match(libraryPage, /creativeDisplayTitle/)
assert.match(libraryPage, /LIBRARY_SORTS/)
assert.match(libraryPage, /Show more/)
assert.match(libraryPage, /import\.meta\.dev/)
assert.doesNotMatch(libraryPage, /savedAll\.value\.length \+ adsCatalog/)
assert.match(createPage, /All subjects/)
assert.match(createPage, /Continue/)
assert.doesNotMatch(createPage, /family__styles/)
assert.match(editorPage, /Save to Faneqo/)
assert.match(editorPage, /ed__mobile-manage/)
assert.match(editorPage, /renderNodeToPng|useCreativeExport/)
assert.match(editorPage, /Simulated/i, 'previews say they are simulations')
assert.match(editorPage, /Download PNG/)
assert.match(editorPage, /PublishingPanel/)
assert.match(editorPage, /window\.confirm/, 'delete asks first')
assert.match(editorPage, /This device only/)
assert.match(editorPage, /ArrowLeft/)
assert.match(editorPage, /requestFullscreen/)
assert.match(editorPage, /ed__export/)
assert.match(createPage, /ArtistPicker/)
assert.match(createPage, /Continue without an artist/)
assert.match(legacyPlayer, /AD_FORMAT_ORDER/, 'legacy player lists the square chip (disabled when unsupported)')

const exporter = read('features/ads/exportPng.js')
assert.match(exporter, /isSameOrigin/)
assert.match(exporter, /credentials: isSameOrigin\(url\) \? 'same-origin' : 'omit'/)

const exportComposable = read('features/ads/studio/useCreativeExport.js')
assert.match(exportComposable, /dims\.width !== size\.width/)
assert.match(exportComposable, /exportAllScenes/)

const publishing = read('features/ads/studio/publishing.js')
assert.doesNotMatch(publishing, /AI-generated|generated by AI/i)

// Templates are inert: no live product components, media, or links.
// ArtistSpotlight.vue dispatches to one board per design style; the boards themselves live in templates/spotlight/.
const templateFiles = ['SongSpotlight', 'ProductShowcase', 'TypeStatement', 'EducationCarousel', 'ShowPromo', 'MusicInsights', 'spotlight/SpotlightEditorial', 'spotlight/SpotlightCinematic', 'spotlight/SpotlightCulture', 'spotlight/SpotlightLegacy']
for (const name of templateFiles) {
  const path = `features/ads/studio/templates/${name}.vue`
  assert.ok(existsSync(resolve(root, path)), `${path} exists`)
  const source = read(path)
  assert.match(source, /class="board"/)
  assert.match(source, /boardVars/)
  for (const key of ['post', 'feed', 'story', 'square']) assert.match(source, new RegExp(`${key}: \\{`), `${name} has a ${key} layout`)
  assert.doesNotMatch(source, /BandPageCybered|FollowArtistSheet|ArtistPageActions|fetchBandBySlug|trackPageView|useStrapi/)
  assert.doesNotMatch(source, /<audio|<video|<iframe|<a[\s>]|<NuxtLink/)
}
const dispatcher = read('features/ads/studio/templates/ArtistSpotlight.vue')
assert.match(dispatcher, /spotlightStyleComponent/, 'ArtistSpotlight dispatches by design style')
for (const id of ['editorial', 'cinematic', 'culture', 'legacy']) assert.match(read('features/ads/studio/templates/spotlight/index.js'), new RegExp(`${id}:`), `style ${id} is bound to a component`)
const excerpt = read('features/ads/studio/primitives/ProductExcerpt.vue')
assert.match(excerpt, /inert/)
assert.doesNotMatch(excerpt, /<audio|<iframe|<a[\s>]|BandPageCybered/)

// Legacy templates untouched by V2.
assert.doesNotMatch(read('features/ads/templates/ArtistSpotlight.vue'), /studio\//)
assert.equal((read('features/ads/catalog.js').match(/slug:/g) || []).length, 5)

// Backend creative API contracts (qrserver sibling when present).
const qrserver = resolve(root, '..', 'qrserver')
if (existsSync(resolve(qrserver, 'src/api/creative/routes/01-creative.js'))) {
  const routes = readFileSync(resolve(qrserver, 'src/api/creative/routes/01-creative.js'), 'utf8')
  const controller = readFileSync(resolve(qrserver, 'src/api/creative/controllers/creative.js'), 'utf8')
  const schema = JSON.parse(readFileSync(resolve(qrserver, 'src/api/creative/content-types/creative/schema.json'), 'utf8'))
  assert.equal((routes.match(/auth: false/g) || []).length, 7, 'all seven routes gate in the controller')
  assert.equal((controller.match(/requireStudioUser\(ctx\)/g) || []).length, 7)
  assert.equal(schema.attributes.ownerEmail.private, true)
  assert.match(readFileSync(resolve(qrserver, 'package.json'), 'utf8'), /test-creative-boot-requires/)
}

// ---------------------------------------------------------------- motion
assert.equal(newCreative('product-showcase', { now: NOW }).content.motion, undefined, 'new creatives stay still')
assert.equal(newCreative('artist-spotlight', { now: NOW }).content.motion, undefined)
assert.equal(newCreative('insights', { now: NOW }).content.motion, undefined)
assert.equal(motionSettings({}), null)
assert.equal(motionSettings({ motion: { enabled: false, durationMs: PRODUCT_MOTION_MS } }), null)
assert.equal(motionSettings({ motion: defaultProductMotion() }).durationMs, PRODUCT_MOTION_MS)
assert.equal(motionSettings({ motion: defaultProductMotion() }).close, PRODUCT_MOTION_CLOSE)
assert.deepEqual(closeLines(PRODUCT_MOTION_CLOSE), ['Your music.', 'Your fans.', 'Your world.'])
assert.equal(formatMotionClock(0), '0.0s')
assert.equal(formatMotionClock(11000), '11.0s')
assert.equal(pageTravel(null), 0)
assert.equal(pageTravel({ name: 'Night School' }), 0, 'missing song and links stay missing')
assert.ok(pageTravel(demoBadflowerSnapshot()) > 40, 'a real page can travel')
assert.ok(pageTravel(demoBadflowerSnapshot()) <= 200, 'sheet travel stays short enough that the pinned portrait keeps its faces')

const at = (ms) => productShowcasePose(ms)
const opening = at(0)
// Frame 0 is the Reel cover: the headline is already there, the phone is the entrance.
assert.equal(opening.line1, 1, 'frame 0 is never a black frame')
assert.equal(opening.line2, 1)
assert.equal(opening.phoneOpacity, 1, 'the phone is in the cover, low')
assert.ok(opening.phoneY > 300, `phone starts low (${opening.phoneY})`)
assert.equal(opening.scroll, 0)
assert.equal(opening.close, 0)
const rising = at(2000)
assert.ok(rising.phoneY > 0 && rising.phoneY < opening.phoneY, `phone rising at 2s (${rising.phoneY})`)
assert.equal(rising.line1, 1)
const arrived = at(4000)
assert.ok(Math.abs(arrived.phoneY) < 1, 'phone is up at 4s')
assert.ok(arrived.scroll < 0.05)
const walk = at(6500)
assert.ok(walk.scroll > 0.45 && walk.scroll < 0.9, `page travel at 6.5s (${walk.scroll})`)
assert.equal(walk.close, 0)
assert.ok(walk.phoneOpacity > 0.85)
// One hand-off: the headline is gone before the close is half in.
const handoff = at(8700)
assert.ok(handoff.line1 < 0.02, `headline gone at 8.7s (${handoff.line1})`)
assert.equal(handoff.close, 0, 'close waits for the headline and the phone')
assert.ok(handoff.phoneScale < 0.86, `phone has stepped back by 8.7s (${handoff.phoneScale})`)
assert.equal(handoff.dock, 0, 'the still close has left before the film close arrives')
const end = at(PRODUCT_MOTION_MS)
assert.equal(end.close, 1, 'close is the final frame')
assert.equal(end.line1, 0, 'hook has left by the close')
assert.ok(end.phoneOpacity > 0.7, 'the page remains visible behind the close')
assert.ok(end.scroll < walk.scroll, 'the portrait settles back for the close')
// The ending holds still for the last 1.4 seconds.
assert.deepEqual(at(9700), end)
assert.deepEqual(at(10300), end)
assert.deepEqual(productShowcasePose(-40), opening)
assert.deepEqual(productShowcasePose(999999), end)
// Nonsequential seeks must not depend on the previous call.
assert.deepEqual(productShowcasePose(6500), walk)
assert.deepEqual(productShowcasePose(2000), rising)
assert.deepEqual(productShowcasePose(4000), arrived)
assert.deepEqual(productShowcasePose(6500), walk)

const film = newCreative('product-showcase', { snapshot: null, now: NOW })
film.content.motion = defaultProductMotion()
const stored = fromRecord({ id: 'motion-1', ...toRecord(film) })
assert.equal(stored.content.motion.enabled, true)
assert.equal(stored.content.motion.durationMs, PRODUCT_MOTION_MS)
assert.equal(stored.content.motion.close, PRODUCT_MOTION_CLOSE)
assert.equal(validateCreative(stored).length, 0)
assert.deepEqual(stored.content.motion.scenes, [{ index: 0, durationMs: PRODUCT_MOTION_MS }])

const showcaseSource = read('features/ads/studio/templates/ProductShowcase.vue')
assert.match(showcaseSource, /motionLive/)
assert.match(showcaseSource, /props\.t == null|props\.t != null/)
assert.doesNotMatch(read('features/ads/studio/templates/MusicInsights.vue'), /productShowcasePose/)
assert.doesNotMatch(read('features/ads/studio/templates/SongSpotlight.vue'), /productShowcasePose/)
const editorSource = read('pages/ads/c/[id].vue')
assert.match(editorSource, /ed__motion/)
assert.match(editorSource, /prefers-reduced-motion/)
assert.doesNotMatch(editorSource, /Download MP4/)
const exportAt = editorSource.indexOf('class="ed__export"')
assert.ok(exportAt > 0)
assert.doesNotMatch(editorSource.slice(exportAt, exportAt + 450), /:t=/, 'PNG mount does not receive a playback time')
assert.match(editorSource.slice(0, exportAt), /:t="motionClock"/)

assert.equal(MOTION_FPS, 30)
assert.equal(MOTION_EXPORT_WIDTH, 720)
assert.equal(MOTION_EXPORT_HEIGHT, 1280)
assert.equal(motionFrameCount(PRODUCT_MOTION_MS), 330)
assert.equal(motionFrameTimeMs(0), 0)
assert.equal(motionFrameTimeMs(30), 1000)
assert.equal(motionFrameTimeMs(329), Math.round(329 / 30 * 1000))
const times = motionFrameTimes(PRODUCT_MOTION_MS)
assert.equal(times.length, 330)
assert.equal(new Set(times).size, 330, 'every frame has its own timestamp')
assert.ok(times.at(-1) < PRODUCT_MOTION_MS)
assert.deepEqual(productShowcasePose(times[30]), productShowcasePose(1000))
const filmExport = newCreative('product-showcase', { now: NOW })
assert.throws(() => assertExportableMotion(filmExport), /Turn motion on/)
filmExport.content.motion = defaultProductMotion()
assert.equal(assertExportableMotion(filmExport).durationMs, PRODUCT_MOTION_MS)
assert.throws(() => assertExportableMotion({ ...filmExport, templateId: 'artist-spotlight' }), /cannot export video/)
filmExport.content.excerpt = 'song'
assert.throws(() => assertExportableMotion(filmExport), /artist-page/)
assert.equal(productStyle({}), 'page')
assert.equal(productStyle({ style: 'nope' }), 'page')
assert.equal(productStyle({ style: 'fan-list' }), 'fan-list')
assert.equal(productMotionFilm({ excerpt: 'song' }), null)
assert.equal(productMotionFilm({ style: 'show', excerpt: 'shows' }), null)
assert.equal(productMotionFilm({ style: 'fan-list' }), 'fan-list')
assert.equal(productMotionFilm({ style: 'night' }), 'night')
const fanCreative = newCreative('product-showcase', { style: 'fan-list', snapshot: demoBadflowerSnapshot(), now: NOW })
assert.equal(fanCreative.content.headlineTop, 'Your followers')
assert.equal(fanCreative.content.excerpt, 'fanlist')
assert.notEqual(fanCreative.content.photo?.url, undefined)
fanCreative.content.motion = defaultProductMotion('fan-list')
assert.equal(assertExportableMotion(fanCreative).close, "Your followers aren't your fan list.")
const nightCreative = newCreative('product-showcase', { style: 'night', snapshot: demoBadflowerSnapshot(), now: NOW })
assert.equal(nightCreative.content.headlineAccent, 'lives on.')
nightCreative.content.motion = defaultProductMotion('night')
assert.equal(assertExportableMotion(nightCreative).durationMs, PRODUCT_MOTION_MS)
assert.ok(fanListPose(0).card < 0.05)
assert.ok(fanListPose(5000).card > 0.8)
assert.deepEqual(fanListPose(1000), fanListPose(1000))
assert.ok(nightPose(0, PRODUCT_MOTION_MS, 3).a > 0.9)
assert.ok(nightPose(8000, PRODUCT_MOTION_MS, 3).c > 0.5)
assert.equal(nightPose(8000, PRODUCT_MOTION_MS, 1).b, 0, 'a gallery of one photograph does not invent a second')
const showCreative = newCreative('product-showcase', { style: 'show', snapshot: demoBadflowerSnapshot(), now: NOW })
showCreative.content.motion = defaultProductMotion('show')
assert.throws(() => assertExportableMotion(showCreative), /stays a still/)
assert.equal(motionDownloadName({ artistName: 'The Rockers', templateId: 'product-showcase' }), 'the-rockers-product-showcase-story.mp4')
assert.doesNotMatch(motionDownloadName({ artistName: 'A & B / C', templateId: 'product-showcase' }), /[\\/&]/)
const exporterSource = read('scripts/export-studio-mp4.mjs')
assert.match(exporterSource, /shell: false/)
assert.match(exporterSource, /movflags/)
assert.match(exporterSource, /yuv420p/)
assert.doesNotMatch(exporterSource, /exec\(|execSync\(/)
assert.match(read('pages/__dev/studio-render.vue'), /__faneqoSeek/)
assert.match(read('pages/__dev/studio-render.vue'), /__faneqoApplyCreative/)
assert.match(editorSource, /Export MP4/)
assert.match(editorSource, /videoExportReady/)
assert.doesNotMatch(editorSource, /Download MP4/)
const mp4Route = read('server/api/__dev/studio-mp4.post.ts')
assert.match(mp4Route, /import\.meta\.dev/)
assert.match(read('server/utils/studioMp4Jobs.js'), /shell: false/)

assert.equal(creationLane(''), 'posts')
assert.equal(creationLane('nope'), 'posts')
assert.equal(creationLane('video'), 'video')
const films = videoFilms()
assert.deepEqual(films.map((film) => film.id), ['page', 'fan-list', 'night'])
assert.equal(films.some((film) => film.style === 'show'), false)
for (const film of films) {
  assert.equal(film.templateId, 'product-showcase')
  assert.equal(film.format, 'story')
  assert.equal(film.durationMs, PRODUCT_MOTION_MS)
  assert.equal(film.width, 720)
  assert.equal(film.height, 1280)
  assert.equal(film.fps, 30)
  assert.equal(film.audio, false)
}
assert.equal(laneKeepsFamily({ carousel: true }, 'posts'), false)
assert.equal(laneKeepsFamily({ carousel: false }, 'posts'), true)
assert.equal(laneKeepsFamily({ carousel: true }, 'carousels'), true)
assert.equal(laneKeepsFamily({ carousel: false }, 'video'), false)
const made = newCreative('product-showcase', { style: 'fan-list', snapshot: demoBadflowerSnapshot(), now: NOW })
assert.equal(applyVideoCreation(made, 'fan-list').primaryFormat, 'story')
assert.equal(made.content.style, 'fan-list')
assert.equal(made.content.motion.enabled, true)
assert.equal(made.content.motion.durationMs, PRODUCT_MOTION_MS)
assert.equal(applyVideoCreation(made, 'show'), null)
const still = newCreative('artist-spotlight', { now: NOW })
assert.equal(still.primaryFormat, templateFamily('artist-spotlight').defaultFormat)
assert.equal(still.content.motion, undefined)

const owned = { ...fanCreative, id: '42' }
assert.equal(gateVideoRequest({ allowed: false, workerConfigured: true, creative: owned }).statusCode, 404)
assert.equal(gateVideoRequest({ allowed: true, workerConfigured: false, creative: owned }).statusCode, 503)
assert.match(gateVideoRequest({ allowed: true, workerConfigured: false, creative: owned }).message, /not configured/)
assert.equal(gateVideoRequest({ allowed: true, workerConfigured: true, creative: { ...owned, id: 'local-1' } }).statusCode, 409)
assert.equal(gateVideoRequest({ allowed: true, workerConfigured: true, creative: { ...owned, templateId: 'song-spotlight' } }).statusCode, 400)
assert.equal(gateVideoRequest({ allowed: true, workerConfigured: true, creative: { ...showCreative, id: '7' } }).statusCode, 400)
const longFilm = { ...owned, content: { ...owned.content, motion: { ...owned.content.motion, durationMs: 20000 } } }
assert.equal(gateVideoRequest({ allowed: true, workerConfigured: true, creative: longFilm }).statusCode, 400)
assert.equal(gateVideoRequest({ allowed: true, workerConfigured: true, creative: owned, running: 1 }).statusCode, 429)
assert.equal(gateVideoRequest({ allowed: true, workerConfigured: true, creative: owned }).mode, 'worker')
assert.equal(productionJobRequest({ id: '42' }).ok, true)
assert.equal(productionJobRequest({ id: '42', url: 'http://evil' }).statusCode, 400)
assert.equal(productionJobRequest({ id: '42', content: {} }).statusCode, 400)
assert.equal(productionJobRequest({ id: 'local-1' }).statusCode, 409)
assert.deepEqual(unsafeVideoFields({ command: 'rm' }), ['command'])
assert.equal(settleCancelledJob({ status: 'running', file: 'x' }).status, 'cancelled')
assert.equal(settleCancelledJob({ status: 'running' }).file, null)
assert.equal(settleCancelledJob({ status: 'done', file: 'x' }).status, 'done')

assert.match(createPage, /CREATION_LANES/)
assert.match(createPage, /openSubject/)
assert.match(read('features/ads/studio/creationLanes.js'), /Video & Reels/)
assert.match(createPage, /videoFilms/)
assert.match(createPage, /applyVideoCreation/)
assert.match(libraryPage, /Video &amp; Reels/)
assert.match(editorSource, /MP4 export is not connected/)
assert.match(editorSource, /PNG is the still/)
assert.doesNotMatch(editorSource, /1080/)
assert.match(read('server/api/studio/video.post.ts'), /requireStudio/)
assert.match(read('server/api/studio/video.get.ts'), /requireStudio/)
assert.match(read('server/api/studio/video.delete.ts'), /requireStudio/)
assert.match(read('server/api/studio/video/file.get.ts'), /requireStudio/)
assert.doesNotMatch(read('server/api/studio/video.post.ts'), /spawn|studioMp4/)
assert.doesNotMatch(read('server/utils/studioVideoWorker.js'), /spawn\(|child_process/)
const worker = read('workers/studio-video/server.mjs')
assert.match(worker, /shell: false/)
assert.match(worker, /timingSafeEqual/)
assert.match(worker, /127\.0\.0\.1/)
assert.match(worker, /child\?\.kill/)
assert.doesNotMatch(worker, /exec\(|execSync\(/)
assert.match(read('pages/__dev/studio-render.vue'), /import\.meta\.dev/)
assert.match(read('pages/__dev/studio-render.vue'), /studioRenderInternal/)

const videoSubjects = subjectsForLane('video')
assert.deepEqual(videoSubjects.map((subject) => subject.pieces[0].style), ['page', 'fan-list', 'night'])
assert.equal(videoSubjects.some((subject) => subject.pieces.some((piece) => piece.style === 'show')), false)
assert.deepEqual(subjectsForLane('carousels').map((subject) => subject.id), ['education'])
assert.ok(subjectsForLane('posts').some((subject) => subject.id === 'artist'))
assert.equal(subjectsForLane('posts').find((subject) => subject.id === 'shows').pieces[0].templateId, 'show-promo')
assert.equal(subjectForCreative({ templateId: 'product-showcase', content: { style: 'fan-list' } }).id, 'fans')
assert.equal(subjectForCreative({ templateId: 'artist-spotlight', content: { style: 'culture' } }).id, 'artist')
assert.equal(subjectForCreative(fanCreative).id, 'fans')
const showGap = pieceReadiness({ templateId: 'product-showcase', style: 'show' }, demoBadflowerSnapshot())
assert.equal(showGap.ready, false)
assert.match(showGap.message, /date/)
assert.equal(pieceReadiness({ style: 'night' }, { galleries: [], hero: { url: '/hero.jpg' } }).ready, false)
assert.equal(galleryPhotos({ galleries: [], hero: { url: '/hero.jpg' } }).length, 0)
assert.ok(galleryPhotos(demoBadflowerSnapshot()).length > 0)
assert.equal(pieceReadiness({ style: 'fan-list' }, { fanList: { enabled: false } }).ready, false)
assert.equal(pieceReadiness({ style: 'fan-list' }, demoBadflowerSnapshot()).ready, true)
assert.match(editorSource, /v-if="!clean && motionFilm && formatId === 'story'"/)
assert.equal(subjectForCreative({ templateId: 'product-showcase', content: {} }).id, 'page')

// Show Promotion: the date lives with the venue under the name, off the photograph,
// and the board never prints editor instructions into an exported PNG.
{
  const showPromo = read('features/ads/studio/templates/ShowPromo.vue')
  const template = showPromo.split('<script')[0]
  assert.ok(template.indexOf('class="when"') > template.indexOf('<h1'), 'date and venue sit under the artist name')
  const top = template.match(/<header class="top">([\s\S]*?)<\/header>/)?.[1] || ''
  assert.doesNotMatch(top, /class="date"/, 'the date is not floated over the photograph')
  assert.doesNotMatch(template, /Add a show/, 'no editor hint on the board')
  for (const id of ['post', 'feed', 'story', 'square']) {
    assert.match(showPromo, new RegExp(`${id}: \\{[^}]*date: \\d+`), `${id} has its own date size`)
  }
}

console.log('creative studio: ok')
