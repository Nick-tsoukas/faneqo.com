/**
 * Passport relationship presentation.
 * Run: node scripts/test-passport-presentation.mjs
 */
import assert from 'node:assert/strict'
import {
  galleryChapterLine,
  groupPassportRelationships,
  nightsTogetherLine,
  passportMemoryHref,
  passportNightVisualKind,
  passportSummaryLine,
  primaryPassportGallery,
  publicNightPathFromMemory,
  yourNightOrdinalCopy,
} from '../utils/passport/passportPresentation.js'
import { resolvePassportArtwork } from '../utils/passport/fanPassport.js'

assert.equal(nightsTogetherLine(3), '3 Nights together')
assert.equal(nightsTogetherLine(1), '1 Night together')
assert.equal(passportSummaryLine({ nightCount: 3, artistCount: 1 }), '3 Nights · 1 Artist')
assert.equal(yourNightOrdinalCopy({ showOrdinal: 3, artistName: 'The Rockers' }), 'YOUR 3RD ROCKERS NIGHT')
assert.equal(yourNightOrdinalCopy({ showOrdinal: 1, artistName: 'The Rockers' }), 'YOUR FIRST ROCKERS NIGHT')
assert.equal(yourNightOrdinalCopy({}), '')
assert.equal(galleryChapterLine({ galleryCount: 3, photoCount: 18 }), '3 Galleries · 18 photos')

assert.deepEqual(resolvePassportArtwork({
  artistImageUrl: 'https://cdn.example/artist.jpg',
}), { url: null, source: 'fallback' })
assert.deepEqual(resolvePassportArtwork({
  eventImageUrl: 'https://cdn.example/event.jpg',
  artistImageUrl: 'https://cdn.example/artist.jpg',
}), { url: 'https://cdn.example/event.jpg', source: 'show_cover' })

const artistRepeat = {
  artist: { id: 4, name: 'The Rockers', imageUrl: 'https://cdn.example/artist.jpg' },
  artwork: { url: 'https://cdn.example/artist.jpg', source: 'artist' },
  galleries: [],
}
assert.equal(passportNightVisualKind(artistRepeat), 'type')
assert.equal(primaryPassportGallery(artistRepeat), null)

const galleryNight = {
  artist: { id: 4, name: 'The Rockers' },
  artwork: { url: null, source: 'fallback' },
  galleries: [{ id: 1, media: [{ url: 'https://cdn.example/p.jpg' }], locked: false }],
}
assert.equal(passportNightVisualKind(galleryNight), 'gallery')

const chapters = groupPassportRelationships([
  { id: 2, artist: { id: 4, name: 'The Rockers' }, show: { city: 'Chicago' }, relationship: { nightCount: 2, cities: ['Nashville', 'Chicago'] } },
  { id: 1, artist: { id: 4, name: 'The Rockers' }, show: { city: 'Nashville' }, relationship: { nightCount: 2, cities: ['Nashville', 'Chicago'] } },
  { id: 9, artist: { id: 8, name: 'The Willows' }, show: { city: 'Austin' }, relationship: { nightCount: 1, cities: ['Austin'] } },
])
assert.equal(chapters.length, 2)
assert.equal(chapters[0].nightCount, 2)
assert.equal(chapters[0].memories.length, 2)
assert.equal(chapters[1].artist.name, 'The Willows')
assert.equal(chapters[0].togetherLine, '2 Nights together')

const published = {
  id: 18,
  path: '/fan/passport/nights/18',
  artist: { slug: 'the-rockers' },
  show: { nightSlug: 'the-rad-spot' },
  night: { publicPath: '/the-rockers/night/the-rad-spot' },
}
assert.equal(publicNightPathFromMemory(published), '/the-rockers/night/the-rad-spot')
assert.equal(passportMemoryHref(published), '/the-rockers/night/the-rad-spot?from=%2Ffan%2Fpassport')

const unpublished = { id: 19, artist: { slug: 'the-rockers' }, show: {} }
assert.equal(publicNightPathFromMemory(unpublished), '')
assert.equal(passportMemoryHref(unpublished), '/fan/passport/nights/19')

console.log('test-passport-presentation: ok')
