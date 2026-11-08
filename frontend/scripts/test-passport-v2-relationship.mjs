/**
 * Passport V2: saved galleries in artist chapters + verified relationship moments.
 * Saving is never attendance; moments come only from server ordinals.
 * Run: node scripts/test-passport-v2-relationship.mjs
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  groupPassportRelationships,
  passportSummaryLine,
  relationshipMoments,
  relationshipSinceLine,
  savedGalleryEntry,
  withSavedGalleries,
} from '../utils/passport/passportPresentation.js'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8')

const ROCKERS = { id: 4, name: 'The Rockers', slug: 'the-rockers' }
const night = (id, ordinal, city, date, extra = {}) => ({
  id,
  artist: ROCKERS,
  show: { city, date },
  showOrdinal: ordinal,
  relationship: { nightCount: 3, firstNightDate: extra.first || date },
  galleries: extra.galleries || [],
})
const save = (id, band, slug, gallery = {}) => ({
  savedAt: '2026-10-01',
  sharePath: `/fan/passport/gallery/${id}`,
  gallery: { id, slug, title: `G${id}`, band, media: [{ url: 'https://cdn/x.jpg' }], photoCount: 4, ...gallery },
})

// Moments
const three = [night(1, 3, 'Nashville', '2026-09-07'), night(2, 2, 'Chicago', '2025-01-01'), night(3, 1, 'Nashville', '2024-09-01')]
const moments = relationshipMoments(three, 3)
assert.equal(moments.get('3'), 'Where it started')
assert.equal(moments.get('2'), 'First Night in Chicago')
assert.equal(moments.has('1'), false, 'a return to a known city is not a new-city moment')
assert.equal(relationshipMoments([three[0]], 1).size, 0, 'one Night has no relationship moments')
assert.equal(relationshipMoments(three.map((m) => ({ ...m, showOrdinal: null, relationship: {} })), 3).size, 0, 'no ordinals, no moments')
assert.equal(relationshipMoments(three.slice(0, 2), 3).size, 0, 'truncated history says nothing')

// Since line uses the earliest server date in the chapter
assert.equal(relationshipSinceLine({ nightCount: 1, firstNightDate: '2024-09-01' }), '')
assert.equal(relationshipSinceLine({ nightCount: 2, firstNightDate: '2024-09-01' }), 'Since September 2024')
const mixed = groupPassportRelationships([night(5, 2, 'Portland', '2025-11-02'), night(6, 1, 'Seattle', '2024-06-20')])
assert.equal(mixed[0].sinceLine, 'Since June 2024')

// Saved galleries
assert.equal(savedGalleryEntry(save(9, ROCKERS, 'x', { locked: true })), null, 'locked galleries never render')
assert.equal(savedGalleryEntry(save(9, ROCKERS, 'x', { media: [] })), null, 'no media, no entry')
assert.equal(savedGalleryEntry(save(9, { ...ROCKERS, slug: '../evil' }, 'x')).href.startsWith('/fan/passport/gallery/9'), true)
assert.equal(savedGalleryEntry(save(9, ROCKERS, 'soundcheck')).href, '/the-rockers/gallery/soundcheck?from=%2Ffan%2Fpassport')
assert.equal(savedGalleryEntry(save(9, ROCKERS, 'x')).youWereThere, false, 'youWereThere only when the server says so')

const chapters = withSavedGalleries(
  groupPassportRelationships([night(1, 1, 'Nashville', '2026-09-07', { galleries: [{ id: 41 }] })]),
  [save(41, ROCKERS, 'on-night'), save(50, ROCKERS, 'extra'), save(60, { id: 9, name: 'Willows', slug: 'willows' }, 'c')],
)
assert.equal(chapters.length, 2)
assert.deepEqual(chapters[0].savedGalleries.map((g) => g.id), [50], 'a gallery already on a Night is not repeated')
assert.equal(chapters[1].savedOnly, true)
assert.equal(chapters[1].memories.length, 0)
assert.equal(chapters[1].togetherLine, '', 'saving is never attendance')
assert.equal(chapters[1].nightCount, 0)

assert.equal(passportSummaryLine({ nightCount: 3, artistCount: 1 }), '3 Nights · 1 Artist')
assert.equal(passportSummaryLine({ nightCount: 0, artistCount: 0, savedCount: 2 }), '2 saved galleries')
assert.equal(passportSummaryLine({ nightCount: 1, artistCount: 1, savedCount: 1 }), '1 Night · 1 Artist · 1 saved gallery')

// Wiring
const home = read('components/passport/FanPassportHome.vue')
assert.match(home, /listGallerySaves\(\)\.catch\(/, 'saves are optional: a failure still opens the Nights')
assert.match(home, /!shownMemories\.length && !shownSaved\.length/)
assert.match(read('components/passport/FanPassportMemoryList.vue'), /withSavedGalleries\(/)
const nightMemory = read('components/passport/FanPassportNightMemory.vue')
assert.doesNotMatch(nightMemory, /artist\?\.imageUrl/, 'Night visuals never use the artist portrait')

console.log('test-passport-v2-relationship: ok')
