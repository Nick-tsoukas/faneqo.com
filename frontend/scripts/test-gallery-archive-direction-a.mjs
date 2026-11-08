/**
 * DIRECTION A — NIGHT JOURNAL lab contracts.
 * Run: node scripts/test-gallery-archive-direction-a.mjs
 */
import assert from 'node:assert/strict'
import {
  archiveSummary,
  chapterContext,
  chapterIdentity,
  journalChapterKind,
  journalDateline,
  journalPlateRoles,
  photographCount,
  plateScale,
  SHELF_GRIDS,
  shelfPlan,
  summaryLine,
} from '../features/gallery-archive/direction-a/nightJournal.js'
import { DIRECTION_A_STATES, directionAFixtures } from '../features/gallery-archive/direction-a/fixtures.js'

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

test('chapter weight follows how much of the Night was photographed', () => {
  assert.equal(journalChapterKind(0), 'solo')
  assert.equal(journalChapterKind(1), 'solo')
  assert.equal(journalChapterKind(2), 'pair')
  assert.equal(journalChapterKind(3), 'spread')
  assert.equal(journalChapterKind(4), 'shelf')
  assert.equal(journalChapterKind(9), 'shelf')
})

test('every gallery in a chapter gets exactly one role', () => {
  assert.deepEqual(journalPlateRoles(0), [])
  assert.deepEqual(journalPlateRoles(1), ['solo'])
  assert.deepEqual(journalPlateRoles(2), ['pair-a', 'pair-b'])
  assert.deepEqual(journalPlateRoles(3), ['lead', 'support', 'support'])
  assert.equal(journalPlateRoles(6).length, 6)
  assert.equal(journalPlateRoles(6)[0], 'lead')
})

test('cover hierarchy: one gallery outranks a support print', () => {
  assert.equal(plateScale('solo'), 'xl')
  assert.equal(plateScale('lead'), 'lg')
  assert.equal(plateScale('pair-a'), 'lg')
  assert.equal(plateScale('support'), 'sm')
})

test('a shelf always closes its rows and never orphans the last print', () => {
  for (const grid of SHELF_GRIDS) {
    for (let count = 4; count <= 26; count += 1) {
      const { spans } = shelfPlan(count, grid.tracks, grid.unit)
      assert.equal(spans.length, count, `${count}/${grid.key} keeps every gallery`)
      assert.ok(
        spans.every((span) => span >= 1 && span <= grid.tracks),
        `${count}/${grid.key} spans stay in range`,
      )

      const rows = []
      let used = 0
      for (const span of spans) {
        if (used + span > grid.tracks) {
          rows.push(used)
          used = 0
        }
        used += span
      }
      rows.push(used)
      assert.ok(
        rows.every((row) => row === grid.tracks),
        `${count}/${grid.key} fills every row: ${rows.join(',')}`,
      )
    }
  }
})

test('a support never takes the lead print’s measure', () => {
  for (const grid of SHELF_GRIDS) {
    for (let count = 4; count <= 26; count += 1) {
      const { spans, caps } = shelfPlan(count, grid.tracks, grid.unit)
      assert.equal(spans[0], grid.tracks, `${count}/${grid.key} the lead owns its row`)
      assert.ok(!caps[0], `${count}/${grid.key} the lead print is never the capped one`)
      spans.slice(1).forEach((span, i) => {
        assert.ok(
          span < spans[0] || caps[i + 1],
          `${count}/${grid.key} support ${i + 1} is either narrower than the lead or printed small`,
        )
      })
    }
  }
})

test('a short row shares itself out evenly instead of pairing wide with narrow', () => {
  /* Six galleries: full-width lead, a sheet of three, then two even closers. */
  assert.deepEqual(shelfPlan(6, 6, 2).spans, [6, 2, 2, 2, 3, 3])
  /* Five: rather than orphan the fourth support, both short rows hold two. */
  assert.deepEqual(shelfPlan(5, 6, 2).spans, [6, 3, 3, 3, 3])
  /* Four: three supports already close a row at contact-sheet size. */
  assert.deepEqual(shelfPlan(4, 6, 2).spans, [6, 2, 2, 2])
  /* Seven: two full contact-sheet rows, nothing to resolve. */
  assert.deepEqual(shelfPlan(7, 6, 2).spans, [6, 2, 2, 2, 2, 2, 2])
  /* Widest grid: a row of three, then two closers, never one lone print. */
  assert.deepEqual(shelfPlan(6, 12, 3).spans, [12, 4, 4, 4, 6, 6])
  assert.deepEqual(shelfPlan(4, 12, 3).spans, [12, 4, 4, 4])
  /* Narrowest grid can only close on one print, so that print stays small. */
  assert.deepEqual(shelfPlan(6, 2, 1).spans, [2, 1, 1, 1, 1, 2])
  assert.deepEqual(shelfPlan(6, 2, 1).caps, [false, false, false, false, false, true])
  assert.deepEqual(shelfPlan(0, 6, 2), { spans: [], caps: [] })
})

test('photograph count prefers the server count and falls back to media', () => {
  assert.equal(photographCount({ photoCount: 12, media: [1, 2] }), 12)
  assert.equal(photographCount({ media: [1, 2, 3] }), 3)
  assert.equal(photographCount({ media: [] }), 0)
  assert.equal(photographCount(null), 0)
})

test('archive summary counts Nights, Galleries, and photographs truthfully', () => {
  const summary = archiveSummary([
    { kind: 'night', galleries: [{ photoCount: 4 }, { photoCount: 2 }] },
    { kind: 'night', galleries: [{ media: [1, 2, 3] }] },
    { kind: 'general', galleries: [{ photoCount: 1 }] },
  ])
  assert.deepEqual(summary, { nights: 2, galleries: 4, photographs: 10 })
})

test('summary line drops zero terms instead of printing 0', () => {
  assert.equal(summaryLine({ nights: 1, galleries: 1, photographs: 1 }), '1 Night · 1 Gallery · 1 photograph')
  assert.equal(summaryLine({ nights: 0, galleries: 2, photographs: 7 }), '2 Galleries · 7 photographs')
  assert.equal(summaryLine({ nights: 0, galleries: 0, photographs: 0 }), '')
})

test('chapter context hides a gallery count that is always 1', () => {
  assert.equal(chapterContext({ galleries: [{ photoCount: 9 }] }), '9 photographs')
  assert.equal(chapterContext({ galleries: [{ photoCount: 9 }, { photoCount: 1 }] }), '2 galleries · 10 photographs')
  assert.equal(chapterContext({ galleries: [{ media: [] }] }), '')
})

test('dateline stays on the calendar day, never UTC-shifted back', () => {
  assert.equal(journalDateline('2026-01-01'), 'January 1, 2026')
  assert.equal(journalDateline('2026-09-03'), 'September 3, 2026')
  assert.equal(journalDateline(''), '')
  assert.equal(journalDateline('not-a-date'), '')
})

test('chapter identity never prints the same place twice', () => {
  assert.deepEqual(
    chapterIdentity({ venue: 'The Rock', show: { city: 'Chicago', date: '2026-09-03' } }),
    { dateline: 'September 3, 2026', headline: 'The Rock', place: 'Chicago' },
  )
  assert.deepEqual(
    chapterIdentity({ venue: 'Portland', show: { city: 'Portland', date: '2025-10-04' } }),
    { dateline: 'October 4, 2025', headline: 'Portland', place: '' },
  )
  assert.deepEqual(
    chapterIdentity({ venue: '', show: { city: 'Austin', date: '2026-07-02' } }),
    { dateline: 'July 2, 2026', headline: 'Austin', place: '' },
  )
  assert.equal(chapterIdentity({ venue: '', show: null }).headline, 'A Night')
})

test('every advertised lab state resolves without throwing', () => {
  for (const option of DIRECTION_A_STATES) {
    const items = directionAFixtures(option.key)
    assert.ok(Array.isArray(items), `${option.key} returned a list`)
  }
  assert.equal(directionAFixtures('empty').length, 0)
  assert.equal(directionAFixtures('one').length, 1)
  assert.equal(directionAFixtures('two').length, 2)
  assert.equal(directionAFixtures('three').length, 3)
  assert.ok(directionAFixtures('many').length >= 4)
})

test('the fixture matrix covers the states this direction has to survive', () => {
  const full = directionAFixtures('full')
  assert.ok(full.some((row) => !row.show), 'a General gallery')
  assert.ok(full.some((row) => row.show), 'a Night gallery')
  assert.ok(full.some((row) => row.photoCount === 1), 'a one-photo gallery')
  assert.ok(full.some((row) => row.photoCount === 0), 'a gallery with no cover')
  assert.ok(full.some((row) => row.photoCount >= 20), 'a large gallery')
  assert.ok(full.some((row) => row.title.length > 60), 'a long title')
  assert.ok(full.some((row) => (row.show?.venue || '').length > 30), 'a long venue')
  assert.ok(full.some((row) => row.show && !row.show.venue), 'a Night with no venue')
  assert.ok(full.some((row) => row.status === 'draft'), 'a draft gallery')

  const covers = new Set(
    full
      .filter((row) => row.media.length)
      .map((row) => {
        const cover = row.media[0]
        const ratio = cover.width / cover.height
        if (ratio > 1.02) return 'landscape'
        if (ratio < 0.98) return 'portrait'
        return 'square'
      }),
  )
  assert.deepEqual([...covers].sort(), ['landscape', 'portrait', 'square'])
})

test('fixtures never leak into production data shapes', () => {
  for (const row of directionAFixtures('full')) {
    assert.ok(String(row.slug).startsWith('dir-a-'), 'slug is lab-scoped')
    for (const media of row.media) {
      assert.ok(String(media.url).startsWith('/labs/'), 'media stays in the local lab folder')
    }
  }
})

if (failures) {
  console.error(`test-gallery-archive-direction-a: ${failures} failing`)
  process.exit(1)
}
console.log('test-gallery-archive-direction-a: ok')
