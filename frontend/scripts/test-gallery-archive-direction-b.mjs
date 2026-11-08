/**
 * DIRECTION B — TOUR CONTACT SHEET lab contracts.
 * Run: node scripts/test-gallery-archive-direction-b.mjs
 */
import assert from 'node:assert/strict'
import {
  bandAnchor,
  BLANK_RATIO,
  FRAME_CAP,
  frameCount,
  frameLabel,
  frameNumber,
  frameRatio,
  nightStamp,
  nightTally,
  SHEET_SCALE,
  sheetLedger,
  sheetTotals,
  stampDate,
  stripBreak,
  tourIndex,
} from '../features/gallery-archive/direction-b/contactSheet.js'
import { DIRECTION_B_STATES, directionBFixtures } from '../features/gallery-archive/direction-b/fixtures.js'
import { groupArchiveShelves } from '../utils/galleries/archiveShelves.js'

let failures = 0

function test(name, fn) {
  try {
    fn()
    console.log(`  ok  ${name}`)
  } catch (err) {
    failures += 1
    console.error(`  FAIL  ${name}`)
    console.error(`        ${err.message}`)
  }
}

test('a frame keeps the shape the Stack will actually print', () => {
  const wide = { media: [{ width: 1024, height: 575 }] }
  const tall = { media: [{ width: 910, height: 1024 }] }
  assert.ok(frameRatio(wide) > frameRatio(tall), 'landscape prints wider than portrait')
  assert.ok(frameRatio(wide) !== frameRatio(tall), 'covers are never squared off to one box')
  assert.equal(frameRatio({ media: [] }), BLANK_RATIO)
  assert.equal(frameRatio(null), BLANK_RATIO)
})

test('every sheet tier opens on few frames and runs on many', () => {
  assert.ok(SHEET_SCALE.length >= 3, 'mobile, desktop and wide desktop each get a tier')
  for (const tier of SHEET_SCALE) {
    assert.ok(tier.open >= 1 && tier.open <= 4, `${tier.key} opens on a readable number of frames`)
    assert.ok(/rem$/.test(tier.strip), `${tier.key} strip height is a length`)
    assert.ok(/rem$/.test(tier.gutter), `${tier.key} gutter is a length`)
  }
  const heights = SHEET_SCALE.map((tier) => parseFloat(tier.strip))
  assert.deepEqual(heights, [...heights].sort((a, b) => a - b), 'strips never shrink as the screen grows')
  const opens = SHEET_SCALE.map((tier) => tier.open)
  assert.deepEqual(opens, [1, 3, 4], 'mobile opens on one frame; the break markers in CSS match this')
  assert.ok(/rem$/.test(FRAME_CAP), 'no frame can print taller than the cap')
})

test('the opening strip ends where the tier says, and never orphans a frame', () => {
  for (const tier of SHEET_SCALE) {
    /* Six frames: exactly one break, right after the opening strip. */
    const breaks = Array.from({ length: 6 }, (_, i) => stripBreak(i, 6, tier))
    assert.equal(breaks.filter(Boolean).length, 1, `${tier.key} breaks once`)
    assert.equal(breaks.indexOf(true), tier.open - 1, `${tier.key} breaks after its opening count`)
    /* A Night that fits inside the opening strip is never broken at all. */
    assert.deepEqual(
      Array.from({ length: tier.open }, (_, i) => stripBreak(i, tier.open, tier)).filter(Boolean),
      [],
      `${tier.key} leaves a short Night alone`,
    )
    assert.equal(stripBreak(0, 1, tier), false, 'a single gallery never gets a break')
  }
})

test('the sheet counts in frames and never invents one', () => {
  assert.equal(frameCount({ photoCount: 24, media: [1, 2] }), 24)
  assert.equal(frameCount({ media: [1, 2, 3] }), 3)
  assert.equal(frameCount({ media: [] }), 0)
  assert.equal(frameLabel(24), '24 frames')
  assert.equal(frameLabel(1), '1 frame')
  assert.equal(frameLabel(0), 'No frames yet')
})

test('frame numbers stay a column', () => {
  assert.equal(frameNumber(0), '01')
  assert.equal(frameNumber(8), '09')
  assert.equal(frameNumber(9), '10')
  assert.equal(frameNumber(23), '24')
})

test('a date stamp stays on its own calendar day', () => {
  assert.deepEqual(stampDate('2026-01-01'), { day: 'JAN 01', year: '2026', full: 'JAN 01 2026' })
  assert.deepEqual(stampDate('2026-09-07'), { day: 'SEP 07', year: '2026', full: 'SEP 07 2026' })
  assert.equal(stampDate('').full, '')
  assert.equal(stampDate('not-a-date').full, '')
})

test('a stamp never prints the same place twice and never invents a Night', () => {
  const chicago = nightStamp({ venue: 'The Rock', show: { city: 'Chicago', date: '2026-09-03' } })
  assert.equal(chicago.headline, 'The Rock')
  assert.equal(chicago.place, 'Chicago')
  assert.equal(chicago.day, 'SEP 03')
  const portland = nightStamp({ venue: '', show: { city: 'Portland', date: '2025-10-04' } })
  assert.equal(portland.headline, 'Portland')
  assert.equal(portland.place, '')
  const twice = nightStamp({ venue: 'Portland', show: { city: 'Portland', date: '2025-10-04' } })
  assert.equal(twice.place, '')
  assert.equal(nightStamp({ venue: '', show: null }).headline, 'A Night')
})

test('the tally says what the Night holds, in the sheet’s own voice', () => {
  assert.equal(nightTally({ galleries: [{ photoCount: 24 }, { photoCount: 4 }] }), '2 galleries / 28 frames')
  assert.equal(nightTally({ galleries: [{ photoCount: 9 }] }), '1 gallery / 9 frames')
  assert.equal(nightTally({ galleries: [{ media: [] }] }), '1 gallery')
})

test('totals and ledger are derived from the sheet, never invented', () => {
  const shelves = groupArchiveShelves(directionBFixtures('tour'))
  const totals = sheetTotals(shelves)
  const frames = directionBFixtures('tour').reduce((sum, row) => sum + row.media.length, 0)
  assert.equal(totals.galleries, directionBFixtures('tour').length)
  assert.equal(totals.frames, frames)
  assert.equal(totals.nights, shelves.filter((shelf) => shelf.kind === 'night').length)
  assert.equal(totals.span, '2025—2026')
  assert.ok(sheetLedger(totals).startsWith(`${totals.nights} Nights`))
  assert.equal(sheetLedger({ nights: 0, galleries: 0, frames: 0, span: '' }), '')
  assert.equal(sheetLedger({ nights: 1, galleries: 1, frames: 1, span: '2026' }), '1 Night  ·  1 Gallery  ·  1 frame  ·  2026')
})

test('the index is chronological, anchored, and prints a year only when it turns', () => {
  const shelves = groupArchiveShelves(directionBFixtures('tour'))
  const nights = shelves.filter((shelf) => shelf.kind === 'night')
  const general = shelves.find((shelf) => shelf.kind === 'general')
  const index = tourIndex([...nights, general])

  assert.equal(index.length, nights.length + 1)
  assert.deepEqual(index.map((entry) => entry.id), [...nights, general].map(bandAnchor))
  assert.ok(index.every((entry) => /^sheet-[a-z0-9-]+$/.test(entry.id)), 'anchors are usable ids')
  assert.equal(new Set(index.map((entry) => entry.id)).size, index.length, 'anchors are unique')

  const years = index.filter((entry) => entry.year).map((entry) => entry.year)
  assert.deepEqual(years, ['2026', '2025'], 'a year prints once, where it turns')

  const last = index[index.length - 1]
  assert.equal(last.kind, 'general')
  assert.equal(last.day, 'NO DATE')
  assert.equal(last.place, 'Loose prints')
})

test('every advertised lab state resolves without throwing', () => {
  for (const option of DIRECTION_B_STATES) {
    assert.ok(Array.isArray(directionBFixtures(option.key)), `${option.key} returned a list`)
  }
  assert.equal(directionBFixtures('empty').length, 0)
  assert.equal(directionBFixtures('one').length, 1)
  assert.equal(directionBFixtures('two').length, 2)
  assert.ok(directionBFixtures('night').length >= 6)
  assert.ok(directionBFixtures('general').every((row) => !row.show))
})

test('the fixture matrix is a tour, not one Night', () => {
  const tour = directionBFixtures('tour')
  const shelves = groupArchiveShelves(tour)
  assert.ok(shelves.filter((shelf) => shelf.kind === 'night').length >= 6, 'enough Nights to need an index')
  assert.ok(new Set(tour.map((row) => row.show?.date).filter(Boolean)).size >= 6, 'real chronology')
  assert.ok(tour.some((row) => !row.show), 'a loose print set')
  assert.ok(tour.some((row) => row.photoCount === 1), 'a one-frame gallery')
  assert.ok(tour.some((row) => row.photoCount === 0), 'a gallery with no cover')
  assert.ok(tour.some((row) => row.photoCount >= 20), 'a large gallery')
  assert.ok(tour.some((row) => row.title.length > 60), 'a long title')
  assert.ok(tour.some((row) => (row.show?.venue || '').length > 30), 'a long venue')
  assert.ok(tour.some((row) => row.show && !row.show.venue), 'a Night with no venue')
  assert.ok(tour.some((row) => row.status === 'draft'), 'a draft gallery')

  const shapes = new Set(
    tour.filter((row) => row.media.length).map((row) => {
      const ratio = row.media[0].width / row.media[0].height
      if (ratio > 1.02) return 'landscape'
      if (ratio < 0.98) return 'portrait'
      return 'square'
    }),
  )
  assert.deepEqual([...shapes].sort(), ['landscape', 'portrait', 'square'])
})

test('fixtures never leak into production data shapes', () => {
  for (const row of directionBFixtures('tour')) {
    assert.ok(String(row.slug).startsWith('dir-b-'), 'slug is lab-scoped')
    for (const media of row.media) {
      assert.ok(String(media.url).startsWith('/labs/'), 'media stays in the local lab folder')
    }
  }
})

test('Direction A is not imported by Direction B', async () => {
  const { readFileSync, readdirSync } = await import('node:fs')
  for (const file of readdirSync(new URL('../features/gallery-archive/direction-b/', import.meta.url))) {
    const source = readFileSync(new URL(`../features/gallery-archive/direction-b/${file}`, import.meta.url), 'utf8')
    assert.ok(!source.includes('direction-a'), `${file} stands on its own`)
  }
})

if (failures) {
  console.error(`test-gallery-archive-direction-b: ${failures} failing`)
  process.exit(1)
}
console.log('test-gallery-archive-direction-b: ok')
