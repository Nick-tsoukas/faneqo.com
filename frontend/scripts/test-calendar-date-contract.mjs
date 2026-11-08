/**
 * Date-only Strapi fields stay on their calendar day in every zone.
 *
 * The historical failure: `new Date('2026-09-25')` is UTC midnight, which is
 * Sep 24 evening in America/Chicago. These tests lock the helper and the
 * call sites that used to do that.
 *
 * Run: node scripts/test-calendar-date-contract.mjs
 */
import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  calendarDateMs,
  formatCalendarDate,
  isCalendarDateOnly,
  isSameLocalCalendarDay,
  parseCalendarDate,
  startOfLocalToday,
} from '../utils/dates/calendarDate.js'
import {
  deriveShowPhotosTitle,
  formatShowNightDate,
  formatShowNightDateLong,
} from '../utils/shows/formatShowNightDate.js'

const here = dirname(fileURLToPath(import.meta.url))
const read = (rel) => readFileSync(resolve(here, '..', rel), 'utf8')

let passed = 0
function test(name, fn) {
  fn()
  passed += 1
  console.log(`  ok  ${name}`)
}

function formatInZone(value, timeZone, options = {}) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    timeZone,
    ...options,
  }).format(value)
}

test('the historical UTC parse is the bug: Chicago sees September 24', () => {
  const shifted = new Date('2026-09-25')
  assert.equal(formatInZone(shifted, 'America/Chicago'), 'September 24')
  assert.equal(formatInZone(shifted, 'America/Los_Angeles'), 'September 24')
})

test('2026-09-25 stays September 25 in US zones and a positive-offset zone', () => {
  const date = parseCalendarDate('2026-09-25')
  assert.equal(date.getFullYear(), 2026)
  assert.equal(date.getMonth(), 8)
  assert.equal(date.getDate(), 25)
  assert.equal(
    formatCalendarDate('2026-09-25', { timeZone: 'America/Chicago', month: 'long' }),
    'September 25, 2026',
  )
  assert.equal(
    formatCalendarDate('2026-09-25', { timeZone: 'America/Los_Angeles', month: 'long' }),
    'September 25, 2026',
  )
  assert.equal(
    formatCalendarDate('2026-09-25', { timeZone: 'Europe/Helsinki', month: 'long' }),
    'September 25, 2026',
  )
})

test('month, year, and leap-day boundaries stay put', () => {
  assert.equal(formatCalendarDate('2026-10-01', { month: 'long' }), 'October 1, 2026')
  assert.equal(formatCalendarDate('2026-09-30', { month: 'long' }), 'September 30, 2026')
  assert.equal(formatCalendarDate('2026-01-01', { month: 'long' }), 'January 1, 2026')
  assert.equal(formatCalendarDate('2025-12-31', { month: 'long' }), 'December 31, 2025')
  assert.equal(formatCalendarDate('2024-02-29', { month: 'long' }), 'February 29, 2024')
  for (const zone of ['America/Chicago', 'America/Los_Angeles', 'Pacific/Honolulu']) {
    assert.equal(formatCalendarDate('2026-01-01', { timeZone: zone, month: 'short' }), 'Jan 1, 2026')
  }
})

test('empty and invalid values fail closed', () => {
  assert.equal(parseCalendarDate(''), null)
  assert.equal(parseCalendarDate(null), null)
  assert.equal(formatCalendarDate('not-a-date'), '')
  assert.equal(isCalendarDateOnly('2026-09-25T00:00:00.000Z'), false)
  assert.equal(isCalendarDateOnly('2026-09-25'), true)
})

test('same local calendar day compares date-only values to today', () => {
  const today = startOfLocalToday()
  const ymd = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  assert.equal(isSameLocalCalendarDay(ymd), true)
  assert.equal(isSameLocalCalendarDay('1999-01-01'), false)
  assert.ok(Number.isFinite(calendarDateMs('2026-09-25')))
})

test('gallery titles do not apply a venue zone to a date-only field', () => {
  assert.equal(formatShowNightDate('2026-09-25', { timeZone: 'America/Chicago' }), 'Sep 25')
  assert.equal(formatShowNightDate('2026-09-25', { timeZone: 'America/Los_Angeles' }), 'Sep 25')
  assert.doesNotMatch(
    formatShowNightDateLong('2026-09-25', { timeZone: 'America/Chicago' }),
    /Sep 24|CDT|CST/,
  )
  assert.match(formatShowNightDateLong('2026-09-25', { timeZone: 'America/Chicago' }), /Sep 25, 2026/)
  assert.equal(
    deriveShowPhotosTitle({ city: 'Chicago', date: '2026-09-25', timeZone: 'America/Chicago' }),
    'Chicago — Sep 25',
  )
})

const cybered = read('components/band/BandPageCybered.vue')
const checkIn = read('components/band/ShowCheckInModal.vue')
const recap = read('components/dashboard/fans/ShowRecapCard.vue')
const showDay = read('components/smartlink/ShowDayHeader.vue')
const publicEvent = read('pages/[bandSlug]/event/[eventSlug].vue')
const legacyEvent = read('pages/event/[id].vue')
const dashboard = read('pages/dashboard/index.vue')

test('vulnerable call sites now use the calendar helper', () => {
  assert.match(cybered, /isSameLocalCalendarDay\(nextEvent\.value\.date\)/)
  assert.doesNotMatch(cybered, /const eventDate = new Date\(nextEvent\.value\.date\)/)
  assert.match(cybered, /new Date\(dateStr \+ "T00:00:00"\)/)
  assert.match(checkIn, /parseCalendarDate\(props\.showDate\)/)
  assert.match(recap, /formatCalendarDate\(dateStr\)/)
  assert.match(showDay, /parseCalendarDate\(props\.event\.date\)/)
  assert.doesNotMatch(showDay, /eventDate\.setHours/)
  assert.match(publicEvent, /formatCalendarDate\(dateStr/)
  assert.doesNotMatch(publicEvent, /parseISO\(dateStr\)/)
  assert.match(legacyEvent, /formatCalendarDate\(dateStr/)
  assert.doesNotMatch(legacyEvent, /parseISO\(dateStr\)/)
})

test('Show Mode waiting pill is still drawn on the dashboard', () => {
  assert.match(dashboard, /ev\.showModeControl\.kind === 'waiting'/)
  assert.match(dashboard, /action-btn-show-mode-waiting/)
})

test('already-safe dashboard event context is left as local Y\/M\/D', () => {
  assert.match(dashboard, /new Date\(Number\(day\[1\]\), Number\(day\[2\]\) - 1, Number\(day\[3\]\)\)/)
  assert.doesNotMatch(dashboard, /formatCalendarDate\(dateValue\)/)
})

console.log(`test-calendar-date-contract: ${passed} passed`)
