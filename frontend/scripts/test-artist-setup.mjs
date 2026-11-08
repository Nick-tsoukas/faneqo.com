/**
 * Artist setup IA + Featured Music helpers.
 * Run: node scripts/test-artist-setup.mjs
 */
import assert from 'node:assert/strict'
import {
  artistSetupSectionStatus,
  hasAnyFilled,
  visibleArtistSetupSections,
} from '../utils/bands/artistSetupSections.js'
import {
  detectFeaturedMusicPlatform,
  extractYoutubeVideoId,
  featuredMusicIsReady,
  featuredPlayerLooksReady,
  isValidSpotifyShareUrl,
  maybeDetectFeaturedPlatform,
  normalizeFeaturedPlayerInput,
} from '../utils/bands/featuredMusic.js'
import {
  FEATURED_TRACK_ADD_ERROR,
  FEATURED_VIDEO_ADD_ERROR,
  extractYoutubeId,
  featuredVideoPreview,
} from '../utils/bands/featuredVideo.js'
import { faneqoBrand } from '../utils/ui/faneqoBrand.js'

let passed = 0
function test(name, fn) {
  fn()
  passed += 1
  console.log(`  ✅ ${name}`)
}

test('create hides editorial and keeps eight guided sections', () => {
  const sections = visibleArtistSetupSections({ isEdit: false, hasEditorial: true })
  assert.equal(sections.some((section) => section.key === 'editorial'), false)
  assert.equal(sections.length, 8)
  assert.deepEqual(
    sections.map((section) => section.key),
    ['details', 'profile', 'music', 'video', 'links', 'streaming', 'social', 'support']
  )
  assert.equal(sections[0].number, '01')
  assert.equal(sections[7].number, '08')
})

test('edit shows editorial only when entitled', () => {
  const hidden = visibleArtistSetupSections({ isEdit: true, hasEditorial: false })
  const shown = visibleArtistSetupSections({ isEdit: true, hasEditorial: true })
  assert.equal(hidden.some((section) => section.key === 'editorial'), false)
  assert.equal(shown.some((section) => section.key === 'editorial'), true)
  assert.equal(shown.find((section) => section.key === 'editorial').number, '03')
})

test('optional empty sections stay available, never incomplete', () => {
  assert.equal(artistSetupSectionStatus('profile', { hasImage: false }), 'available')
  assert.equal(artistSetupSectionStatus('music', { hasFeaturedMusic: false }), 'available')
  assert.equal(artistSetupSectionStatus('video', { hasVideo: false }), 'available')
  assert.equal(artistSetupSectionStatus('profile', { hasImage: true }), 'complete')
})

test('details completion is honest about required fields', () => {
  assert.equal(artistSetupSectionStatus('details', { name: 'Ghost', bio: '' }), 'available')
  assert.equal(artistSetupSectionStatus('details', { name: 'Ghost', bio: 'A band.' }), 'complete')
  assert.equal(
    artistSetupSectionStatus('details', {
      name: 'Ghost',
      bio: 'A band.',
      genreRequired: true,
      genre: '',
    }),
    'available'
  )
  assert.equal(
    artistSetupSectionStatus('details', {
      name: 'Ghost',
      bio: 'A band.',
      genreRequired: true,
      genre: 'Rock',
    }),
    'complete'
  )
})

test('hasAnyFilled ignores empty objects and custom-button shells', () => {
  assert.equal(hasAnyFilled({ facebook: '', instagram: '' }), false)
  assert.equal(hasAnyFilled({ facebook: 'https://facebook.com/x' }), true)
  assert.equal(hasAnyFilled([{ title: '', url: '' }]), false)
  assert.equal(hasAnyFilled([{ title: 'Merch', url: '' }]), true)
})

test('Spotify share URLs are accepted and random text is not', () => {
  assert.equal(isValidSpotifyShareUrl('https://open.spotify.com/track/abc123'), true)
  assert.equal(isValidSpotifyShareUrl('https://open.spotify.com/album/abc123'), true)
  assert.equal(isValidSpotifyShareUrl('https://music.apple.com/us/album/x'), false)
  assert.equal(isValidSpotifyShareUrl('<iframe src="https://open.spotify.com/embed/track/x"></iframe>'), false)
})

test('provider detection is host-based and iframe-safe', () => {
  assert.equal(detectFeaturedMusicPlatform('https://open.spotify.com/track/abc'), 'spotify')
  assert.equal(detectFeaturedMusicPlatform('https://music.apple.com/us/album/x'), 'appleMusic')
  assert.equal(detectFeaturedMusicPlatform('https://youtu.be/dQw4w9WgXcQ'), 'youtube')
  assert.equal(
    maybeDetectFeaturedPlatform(
      '<iframe src="https://open.spotify.com/embed/track/x"></iframe>',
      'appleMusic'
    ),
    null
  )
  assert.equal(
    maybeDetectFeaturedPlatform('https://music.apple.com/us/album/x', 'spotify'),
    'appleMusic'
  )
  assert.equal(maybeDetectFeaturedPlatform('https://open.spotify.com/track/abc', 'spotify'), null)
})

test('YouTube watch URLs normalize to the stored iframe', () => {
  const html = normalizeFeaturedPlayerInput('youtube', 'https://youtube.com/watch?v=dQw4w9WgXcQ')
  assert.match(html, /<iframe[\s\S]*youtube\.com\/embed\/dQw4w9WgXcQ/)
  assert.equal(extractYoutubeVideoId('https://youtu.be/dQw4w9WgXcQ'), 'dQw4w9WgXcQ')
  assert.equal(featuredPlayerLooksReady('youtube', 'https://youtube.com/watch?v=dQw4w9WgXcQ'), true)
  assert.equal(featuredPlayerLooksReady('soundcloud', 'https://soundcloud.com/x/y'), false)
})

test('featured music ready-state matches upload, Spotify, and player modes', () => {
  assert.equal(featuredMusicIsReady({ mode: 'upload', hasFile: true }), true)
  assert.equal(featuredMusicIsReady({ mode: 'upload', hasFile: false }), false)
  assert.equal(
    featuredMusicIsReady({
      mode: 'embed',
      platform: 'spotify',
      spotifyPreview: { spotifyUrl: 'https://open.spotify.com/track/abc' },
    }),
    true
  )
  assert.equal(featuredMusicIsReady({ mode: 'embed', platform: 'spotify', spotifyPreview: null }), false)
  assert.equal(
    featuredMusicIsReady({
      mode: 'embed',
      platform: 'youtube',
      embedHtml: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
    }),
    true
  )
})

test('featured video add uses the same YouTube id the form persists', () => {
  assert.equal(extractYoutubeId('https://youtube.com/watch?v=dQw4w9WgXcQ'), 'dQw4w9WgXcQ')
  assert.equal(extractYoutubeId('dQw4w9WgXcQ'), 'dQw4w9WgXcQ')
  assert.equal(extractYoutubeId('not-a-link'), '')
  const preview = featuredVideoPreview('https://youtu.be/dQw4w9WgXcQ', 'Never Gonna Give You Up')
  assert.equal(preview.id, 'dQw4w9WgXcQ')
  assert.equal(preview.title, 'Never Gonna Give You Up')
  assert.match(preview.thumbnailUrl, /dQw4w9WgXcQ/)
  assert.equal(featuredVideoPreview('nope'), null)
  assert.match(FEATURED_VIDEO_ADD_ERROR, /couldn't add that video/i)
  assert.match(FEATURED_TRACK_ADD_ERROR, /couldn't add that track/i)
})

test('form CTAs use sea-green to teal, not neon lime', () => {
  assert.equal(faneqoBrand.formCtaFrom, '#45D6A7')
  assert.equal(faneqoBrand.formCtaTo, '#23C7C3')
  assert.match(faneqoBrand.gradientFormCta, /#45D6A7/)
  assert.match(faneqoBrand.gradientFormCta, /#23C7C3/)
  assert.equal(faneqoBrand.green, '#39FF14')
})

console.log(`\n${passed} passed`)
