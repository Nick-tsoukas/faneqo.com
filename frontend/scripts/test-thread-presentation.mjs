/**
 * Messaging thread grouping + Night chapter helpers.
 * Run: node scripts/test-thread-presentation.mjs
 */
import assert from 'node:assert/strict'
import {
  formatNightSeparator,
  formatNightsTogetherLabel,
  formatShowCountLabel,
  galleryMessageTitle,
  gallerySharePreview,
  isGenericGalleryTitle,
  isGroupEnd,
  isGroupStart,
  isGroupedWithPrevious,
  isLastGalleryInSenderRun,
  messageNightChapter,
  shouldShowNightSeparator,
} from '../utils/messages/threadPresentation.js'

const night = {
  galleryReference: {
    show: { title: 'The Moon Show', venue: 'The Rock', city: 'Chicago', date: '2026-09-07' },
  },
}

const a1 = { id: '1', senderId: 'band', senderRole: 'artist', createdAt: '2026-09-07T18:40:00.000Z' }
const a2 = { id: '2', senderId: 'band', senderRole: 'artist', createdAt: '2026-09-07T18:41:00.000Z' }
const a3 = { id: '3', senderId: 'band', senderRole: 'artist', createdAt: '2026-09-07T19:20:00.000Z' }
const f1 = { id: '4', senderId: 'fan', senderRole: 'fan', createdAt: '2026-09-07T18:42:00.000Z' }
const g1 = { ...a1, galleryReference: night.galleryReference }
const g2 = {
  ...a2,
  galleryReference: { show: { title: 'After', venue: 'The Rock', city: 'Chicago', date: '2026-09-08' } },
}

const group = [a1, a2, a3]
assert.equal(isGroupedWithPrevious(group, 0), false)
assert.equal(isGroupedWithPrevious(group, 1), true)
assert.equal(isGroupedWithPrevious(group, 2), true)
assert.equal(isGroupStart(group, 0), true)
assert.equal(isGroupEnd([a1, a2], 1), true)
assert.equal(isGroupedWithPrevious([a1, f1], 1), false)
assert.equal(isGroupedWithPrevious([g1, a2], 1), true)
assert.equal(isGroupedWithPrevious([g1, g2], 1), true)
assert.equal(isGenericGalleryTitle('View photos'), true)
assert.equal(isGenericGalleryTitle('Show photos'), true)
assert.equal(isGenericGalleryTitle('Backstage'), false)
assert.equal(galleryMessageTitle({ title: 'View photos' }), 'View photos')
assert.equal(galleryMessageTitle({ visibility: 'show_attendees' }), 'Show photos')

assert.equal(messageNightChapter(g1).place, 'The Rock')
assert.equal(shouldShowNightSeparator([g1, g2], 0), true)
assert.equal(shouldShowNightSeparator([g1, g2], 1), true)
assert.equal(shouldShowNightSeparator([g1, { ...a2, galleryReference: night.galleryReference }], 1), false)
assert.equal(shouldShowNightSeparator([g1, f1, { ...a2, galleryReference: night.galleryReference }], 2), false)
assert.equal(isLastGalleryInSenderRun([g1, g2], 0), false)
assert.equal(isLastGalleryInSenderRun([g1, g2], 1), true)
assert.equal(isLastGalleryInSenderRun([g1, a2], 0), true)

const sep = formatNightSeparator(messageNightChapter(g1))
assert.equal(sep.kicker.includes('The Rock'), true)
assert.equal(sep.title, 'The Moon Show')

assert.equal(formatShowCountLabel(3), '3 shows')
assert.equal(formatNightsTogetherLabel(3), '3 Nights together')
assert.equal(formatNightsTogetherLabel(0), '')
assert.equal(gallerySharePreview({ show: { venue: 'The Rock' } }), 'Shared photos from The Rock')

console.log('test-thread-presentation: ok')
