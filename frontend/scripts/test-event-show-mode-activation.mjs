/**
 * Event → Show Mode activation on the dashboard Events list.
 *
 * The policy itself is a backend invariant
 * (qrserver/scripts/test-show-mode-event-activation.js). These tests cover the
 * frontend's half of the contract: it renders from the server's absolute
 * instants and its resolved timezone, and never rebuilds the Event's start in
 * the browser zone.
 *
 * Run: node scripts/test-event-show-mode-activation.mjs
 */
import assert from 'node:assert/strict'
import test from 'node:test'
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import {
  ACTIVATION_STATE,
  EVENT_SHOW_MODE_CONTROL,
  deriveActivationState,
  eventShowModeControl,
  formatActivationOpensAt,
  indexServerActivation,
  normalizeServerActivation,
  sortDashboardEvents,
} from '../utils/show-mode/eventShowModeActivation.js'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const dashboard = fs.readFileSync(path.join(root, 'pages/dashboard/index.vue'), 'utf8')

const HOUR = 60 * 60 * 1000

/**
 * The server's answer for an 8 PM show in Chicago on 2026-09-03.
 * 20:00 CDT is 2026-09-04T01:00Z, so the window is 2026-09-03T01:00Z …
 * 2026-09-04T05:00Z. Fixed instants: nothing here depends on today's date.
 */
const CHICAGO_SHOW = Object.freeze({
  eventId: 11,
  state: 'open',
  eligible: true,
  timezone: 'America/Chicago',
  eventStartsAt: '2026-09-04T01:00:00.000Z',
  opensAt: '2026-09-03T01:00:00.000Z',
  closesAt: '2026-09-04T05:00:00.000Z',
  reason: null,
})

const OPENS_AT = Date.parse(CHICAGO_SHOW.opensAt)
const CLOSES_AT = Date.parse(CHICAGO_SHOW.closesAt)

const activation = (overrides = {}) => normalizeServerActivation({ ...CHICAGO_SHOW, ...overrides })

test('a server activation row normalizes to absolute milliseconds', () => {
  const row = activation()
  assert.equal(row.eventId, 11)
  assert.equal(row.timezone, 'America/Chicago')
  assert.equal(row.eventStartMs, Date.parse('2026-09-04T01:00:00.000Z'))
  assert.equal(row.opensAtMs, OPENS_AT)
  assert.equal(row.closesAtMs, CLOSES_AT)
  assert.equal(row.eligible, true)

  // A timeless Event carries a zone but no window.
  const timeless = activation({
    eventId: 12,
    state: 'no_time',
    eligible: false,
    eventStartsAt: null,
    opensAt: null,
    closesAt: null,
    reason: 'event_time_missing',
  })
  assert.equal(timeless.opensAtMs, null)
  assert.equal(timeless.closesAtMs, null)
  assert.equal(timeless.timezone, 'America/Chicago')

  // Anything unusable is refused outright rather than half-trusted.
  assert.equal(normalizeServerActivation(null), null)
  assert.equal(normalizeServerActivation({ state: 'open' }), null)
  assert.equal(normalizeServerActivation({ eventId: 0, state: 'open' }), null)
  assert.equal(activation({ opensAt: 'not-a-date' }).opensAtMs, null)

  const index = indexServerActivation([CHICAGO_SHOW, null, { state: 'open' }])
  assert.deepEqual(Object.keys(index), ['11'])
  assert.deepEqual(Object.keys(indexServerActivation(undefined)), [])
})

test('state comes from the absolute window, with inclusive open and exclusive close', () => {
  const row = activation()
  assert.equal(deriveActivationState(row, OPENS_AT - 1), ACTIVATION_STATE.TOO_EARLY)
  assert.equal(deriveActivationState(row, OPENS_AT), ACTIVATION_STATE.OPEN, 'opening is inclusive')
  assert.equal(deriveActivationState(row, CLOSES_AT - 1), ACTIVATION_STATE.OPEN)
  assert.equal(deriveActivationState(row, CLOSES_AT), ACTIVATION_STATE.CLOSED, 'closing is exclusive')
  assert.equal(deriveActivationState(row, CLOSES_AT + 30 * 24 * HOUR), ACTIVATION_STATE.CLOSED)
  assert.equal(deriveActivationState(null, OPENS_AT), null)

  // Without a window the server's own verdict stands.
  assert.equal(
    deriveActivationState(activation({ state: 'no_time', opensAt: null, closesAt: null }), OPENS_AT),
    ACTIVATION_STATE.NO_TIME
  )
})

test('a window that opens while the dashboard is open flips to Start', () => {
  // The server said too_early when it answered; the one-minute tick must not
  // need a refetch to notice the window opening.
  const stale = activation({ state: 'too_early', eligible: false, reason: 'event_activation_not_open' })

  const before = eventShowModeControl({ activation: stale, nowMs: OPENS_AT - 1, canOperateShowMode: true })
  assert.equal(before.kind, EVENT_SHOW_MODE_CONTROL.WAITING)

  const after = eventShowModeControl({ activation: stale, nowMs: OPENS_AT, canOperateShowMode: true })
  assert.equal(after.kind, EVENT_SHOW_MODE_CONTROL.START)
  assert.equal(after.label, 'Start Show Mode')
})

test('a touring artist in any browser timezone sees the same eligibility', () => {
  // The whole point of absolute instants: identical verdicts in every zone.
  // Nothing in this module may read the machine timezone.
  const probe = `
    import {
      deriveActivationState,
      eventShowModeControl,
    } from './utils/show-mode/eventShowModeActivation.js'
    const row = {
      eventId: 11,
      state: 'open',
      eligible: true,
      timezone: 'America/Chicago',
      eventStartMs: Date.parse('2026-09-04T01:00:00.000Z'),
      opensAtMs: Date.parse('2026-09-03T01:00:00.000Z'),
      closesAtMs: Date.parse('2026-09-04T05:00:00.000Z'),
      reason: null,
    }
    const at = (iso) => ({
      state: deriveActivationState(row, Date.parse(iso)),
      kind: eventShowModeControl({
        activation: row,
        nowMs: Date.parse(iso),
        canOperateShowMode: true,
      }).kind,
    })
    process.stdout.write(JSON.stringify([
      at('2026-09-02T12:00:00.000Z'),
      at('2026-09-03T01:00:00.000Z'),
      at('2026-09-04T00:00:00.000Z'),
      at('2026-09-04T05:00:00.000Z'),
    ]))
  `

  const inZone = (TZ) => execFileSync(
    process.execPath,
    ['--input-type=module', '-e', probe],
    { cwd: root, env: { ...process.env, TZ }, encoding: 'utf8' }
  )

  const expected = JSON.stringify([
    { state: 'too_early', kind: 'waiting' },
    { state: 'open', kind: 'start' },
    { state: 'open', kind: 'start' },
    { state: 'closed', kind: 'past' },
  ])

  for (const TZ of ['America/Chicago', 'America/Los_Angeles', 'Asia/Tokyo', 'UTC', 'Pacific/Kiritimati']) {
    assert.equal(inZone(TZ), expected, `browser zone ${TZ} must not change eligibility`)
  }
})

test('the opening label reads in the venue timezone, not the browser one', () => {
  // 2026-09-03T01:00Z is Sep 2, 8:00 PM in Chicago.
  const chicago = formatActivationOpensAt(OPENS_AT, 'America/Chicago')
  assert.match(chicago, /^Show Mode available Sep 2 at 8:00 PM/)

  // Same instant, a zone the browser is not in: the abbreviation is added so
  // the hour cannot be misread. Under TZ=UTC that is any non-UTC zone.
  const tokyo = formatActivationOpensAt(OPENS_AT, 'Asia/Tokyo')
  assert.match(tokyo, /^Show Mode available Sep 3 at 10:00 AM/)

  assert.equal(formatActivationOpensAt(null, 'America/Chicago'), '')
  assert.equal(formatActivationOpensAt(Number.NaN, 'America/Chicago'), '')
  // An unusable zone must not throw on the dashboard's render path.
  assert.equal(formatActivationOpensAt(OPENS_AT, 'Not/AZone'), '')
})

test('the opening label appends the zone abbreviation only when zones differ', () => {
  const read = (TZ) => execFileSync(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      `import { formatActivationOpensAt } from './utils/show-mode/eventShowModeActivation.js'
       process.stdout.write(formatActivationOpensAt(${OPENS_AT}, 'America/Chicago'))`,
    ],
    { cwd: root, env: { ...process.env, TZ }, encoding: 'utf8' }
  )

  assert.equal(read('America/Chicago'), 'Show Mode available Sep 2 at 8:00 PM')
  assert.equal(read('Asia/Tokyo'), 'Show Mode available Sep 2 at 8:00 PM CDT')
})

test('an eligible event renders an active Start control', () => {
  const control = eventShowModeControl({
    activation: activation(),
    nowMs: CLOSES_AT - HOUR,
    canOperateShowMode: true,
  })
  assert.equal(control.kind, EVENT_SHOW_MODE_CONTROL.START)
  assert.equal(control.label, 'Start Show Mode')
  assert.equal(control.state, ACTIVATION_STATE.OPEN)
})

test('an upcoming event states when it opens and is never a Start control', () => {
  const control = eventShowModeControl({
    activation: activation({ state: 'too_early', eligible: false }),
    nowMs: OPENS_AT - 6 * HOUR,
    canOperateShowMode: true,
  })
  assert.equal(control.kind, EVENT_SHOW_MODE_CONTROL.WAITING)
  assert.equal(control.state, ACTIVATION_STATE.TOO_EARLY)
  assert.match(control.label, /^Show Mode available Sep 2 at 8:00 PM/)
  assert.match(control.hint, /24 hours before/)
})

test('a historical event is labelled, never started', () => {
  const control = eventShowModeControl({
    activation: activation({ state: 'closed', eligible: false, reason: 'event_activation_closed' }),
    nowMs: CLOSES_AT + 10 * 24 * HOUR,
    canOperateShowMode: true,
  })
  assert.equal(control.kind, EVENT_SHOW_MODE_CONTROL.PAST)
  assert.equal(control.state, ACTIVATION_STATE.CLOSED)
  assert.equal(control.label, 'Past event')
})

test('a missing event time is explained, not offered as a disabled button', () => {
  const control = eventShowModeControl({
    activation: activation({
      state: 'no_time',
      eligible: false,
      eventStartsAt: null,
      opensAt: null,
      closesAt: null,
      reason: 'event_time_missing',
    }),
    nowMs: OPENS_AT,
    canOperateShowMode: true,
  })
  assert.equal(control.kind, EVENT_SHOW_MODE_CONTROL.MISSING_TIME)
  assert.equal(control.label, 'Add an event time to use Show Mode.')
  assert.equal(control.state, ACTIVATION_STATE.NO_TIME)
})

test('a viewer never gets an activation control', () => {
  const control = eventShowModeControl({
    activation: activation(),
    nowMs: CLOSES_AT - HOUR,
    canOperateShowMode: false,
  })
  assert.equal(control.kind, EVENT_SHOW_MODE_CONTROL.NONE)
  assert.equal(control.label, '')
  assert.equal(control.state, null)
})

test('without a server answer the card offers nothing rather than guessing', () => {
  const control = eventShowModeControl({
    activation: null,
    nowMs: CLOSES_AT - HOUR,
    canOperateShowMode: true,
  })
  assert.equal(control.kind, EVENT_SHOW_MODE_CONTROL.NONE)
  assert.equal(control.label, '')
})

test('a live session for this event outranks the window, even past closesAt', () => {
  const control = eventShowModeControl({
    activation: activation({ state: 'closed', eligible: false }),
    nowMs: CLOSES_AT + HOUR,
    canOperateShowMode: true,
    isLiveForEvent: true,
  })
  assert.equal(control.kind, EVENT_SHOW_MODE_CONTROL.LIVE)
  assert.equal(control.label, 'Show Mode Live')
})

test('another live session offers management, never replacement', () => {
  const control = eventShowModeControl({
    activation: activation(),
    nowMs: CLOSES_AT - HOUR,
    canOperateShowMode: true,
    bandSessionLive: true,
  })
  assert.equal(control.kind, EVENT_SHOW_MODE_CONTROL.OTHER_LIVE)
  assert.equal(control.label, 'Another show is live')
  assert.notEqual(control.kind, EVENT_SHOW_MODE_CONTROL.START)
})

test('event ordering is deterministic: tonight, upcoming, past, undated', () => {
  const item = (id, state, eventStartMs, extra = {}) => ({
    id,
    showModeLiveForEvent: false,
    showModeControl: { state, eventStartMs },
    ...extra,
  })

  const sorted = sortDashboardEvents([
    item(1, ACTIVATION_STATE.NO_TIME, null),
    item(2, ACTIVATION_STATE.CLOSED, Date.parse('2026-01-01T00:00:00.000Z')),
    item(3, ACTIVATION_STATE.TOO_EARLY, Date.parse('2026-10-01T00:00:00.000Z')),
    item(4, ACTIVATION_STATE.OPEN, Date.parse('2026-09-04T01:00:00.000Z')),
    item(5, ACTIVATION_STATE.CLOSED, Date.parse('2026-06-01T00:00:00.000Z')),
    item(6, ACTIVATION_STATE.TOO_EARLY, Date.parse('2026-09-20T00:00:00.000Z')),
    item(7, ACTIVATION_STATE.CLOSED, Date.parse('2026-08-01T00:00:00.000Z'), {
      showModeLiveForEvent: true,
    }),
    item(8, ACTIVATION_STATE.NO_TIME, null),
  ])

  assert.deepEqual(
    sorted.map((row) => row.id),
    [
      7, // live
      4, // eligible now
      6, 3, // upcoming, nearest first
      5, 2, // historical, newest first
      1, 8, // undated, last, by id
    ]
  )

  // Pure and stable: the same input always gives the same order, and the
  // caller's array is never mutated.
  const input = [item(2, ACTIVATION_STATE.CLOSED, 2), item(1, ACTIVATION_STATE.OPEN, 1)]
  const snapshot = input.map((row) => row.id)
  assert.deepEqual(sortDashboardEvents(input).map((r) => r.id), [1, 2])
  assert.deepEqual(sortDashboardEvents(input).map((r) => r.id), [1, 2])
  assert.deepEqual(input.map((row) => row.id), snapshot)
  assert.deepEqual(sortDashboardEvents(null), [])
})

test('the dashboard reads eligibility from the server, never from the browser clock', () => {
  // One batched, band-scoped request on the existing status route.
  assert.match(dashboard, /async function fetchEventActivation\(/)
  assert.match(dashboard, /show-mode\?\$\{query\.toString\(\)\}/)
  assert.match(dashboard, /eventIds: ids\.join\(','\)/)
  assert.match(dashboard, /indexServerActivation\(/)
  assert.match(dashboard, /activation: eventActivationById\.value\[String\(ev\.id\)\] \|\| null/)

  // The old browser-side reconstruction is gone for good.
  assert.doesNotMatch(dashboard, /eventShowModeControl\(\{\s*\n\s*event:/)
  assert.doesNotMatch(dashboard, /resolveEventActivationWindow/)
})

test('the batched activation read costs one request per band, not per event', () => {
  const grouping = dashboard.slice(
    dashboard.indexOf('async function fetchEventActivation('),
    dashboard.indexOf('// Keep your existing scans fetch')
  )
  assert.ok(grouping.length > 0)
  assert.match(grouping, /idsByBand/)
  // One fetch, mapped over bands — an events-keyed map would be the N+1.
  assert.equal(grouping.match(/await fetch\(/g)?.length, 1)
  assert.match(grouping, /idsByBand\.entries\(\)\]\.map\(/)
})

test('the click handler refuses anything but an open window and cannot double submit', () => {
  assert.match(dashboard, /ev\.showModeControl\?\.kind !== EVENT_SHOW_MODE_CONTROL\.START/)
  assert.match(dashboard, /if \(startingShowModeEventId\.value != null\) return/)
  assert.match(dashboard, /startingShowModeEventId === ev\.id \? 'Starting…'/)
})

test('a backend refusal surfaces the message and never marks the band live', () => {
  const handler = dashboard.slice(
    dashboard.indexOf('async function onEventShowModeClick('),
    dashboard.indexOf('* Docked = Show Mode sits tight under Artist Pages')
  )
  assert.ok(handler.length > 0)

  // The only local live mutation sits after the ok/409 gates.
  const refusal = handler.indexOf("throw new Error(body?.error?.message")
  const mutation = handler.indexOf("attrs.showModeStatus = 'live'")
  assert.ok(refusal > 0 && mutation > refusal, 'live state may only be set after a successful response')
  assert.match(handler, /body\?\.error\?\.message \|\| 'Could not start Show Mode'/)
  assert.match(handler, /fetchEventActivation\(events\.value\)/)
})

test('the Events list keeps a clock so a window can open while the page is open', () => {
  assert.match(dashboard, /activationClockMs/)
  assert.match(dashboard, /clearInterval\(activationClockTimer\)/)
})

test('the dashboard presents the states the policy chose', () => {
  assert.match(dashboard, /v-if="ev\.showModeControl\.kind === 'start' \|\| ev\.showModeControl\.kind === 'live'"/)
  assert.match(dashboard, /v-else-if="ev\.showModeControl\.kind === 'waiting'"/)
  assert.match(dashboard, /v-else-if="ev\.showModeControl\.kind === 'other_live'"/)
  assert.match(dashboard, /v-else-if="ev\.showModeControl\.kind === 'past'"/)
  assert.match(dashboard, /v-if="ev\.showModeControl\.kind === 'missing_time'"/)
  // A missing time keeps Edit reachable and shows no disabled Start button.
  assert.match(dashboard, /router\.push\(`\/editevent\/\$\{ev\.id\}`\)/)
  // The old permission-only gate is what let a past event offer a live start.
  assert.doesNotMatch(dashboard, /v-if="ev\.canOperateShowMode"/)
  assert.match(dashboard, /sortDashboardEvents\(/)
})
