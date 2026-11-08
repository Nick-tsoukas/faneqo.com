/**
 * Pure Show Mode dashboard state + timing helpers.
 * Run: node scripts/test-show-mode-ui-state.mjs
 */
import assert from 'node:assert/strict'
import {
  alreadyLiveFromResponse,
  isFirstTimeIdle,
  isShowModeLiveStatus,
  resolveShowModeUiState,
  showModeTakesDashboardLead,
} from '../utils/show-mode/showModeUiState.js'
import {
  DEFAULT_SET_HOURS,
  defaultSetupTimes,
  formatEndsTime,
  formatSetupClockLabel,
  fromDatetimeLocalValue,
  livePlaceLine,
  recentShowLine,
  timingPayloadFromLocal,
  toDatetimeLocalValue,
} from '../utils/show-mode/showModeTiming.js'

assert.equal(isShowModeLiveStatus({ status: 'live', enabled: true }), true)
assert.equal(isShowModeLiveStatus({ status: 'live', enabled: false }), false)
assert.equal(isShowModeLiveStatus({ status: 'scheduled', enabled: false }), false)
assert.equal(isShowModeLiveStatus({ status: 'off', enabled: false }), false)

assert.equal(resolveShowModeUiState({
  status: { status: 'live', enabled: true },
  recapState: 'generating',
  recapAlertVisible: true,
}), 'live')

assert.equal(resolveShowModeUiState({
  status: { status: 'off', enabled: false },
  recapState: 'generating',
  recapAlertVisible: true,
}), 'recap_generating')

assert.equal(resolveShowModeUiState({
  status: { status: 'off', enabled: false },
  recapState: 'ready',
  recapAlertVisible: true,
}), 'recap_ready')

assert.equal(resolveShowModeUiState({
  status: { status: 'off', enabled: false },
  recapState: 'timeout',
  recapAlertVisible: true,
}), 'recap_timeout')

assert.equal(resolveShowModeUiState({
  status: { status: 'scheduled', enabled: false },
  recapState: null,
}), 'idle')

assert.equal(resolveShowModeUiState({
  status: { status: 'off', enabled: false },
  recapState: 'ready',
  recapAlertVisible: false,
}), 'idle')

assert.equal(isFirstTimeIdle(null), true)
assert.equal(isFirstTimeIdle({ id: 9 }), false)

assert.equal(showModeTakesDashboardLead({ isLive: true }), true)
assert.equal(showModeTakesDashboardLead({ isLive: false, isScheduled: true }), false)

assert.equal(alreadyLiveFromResponse({ status: 409 }, { error: { name: 'already_live' } }), true)
assert.equal(alreadyLiveFromResponse({ status: 400 }, { error: { name: 'bad' } }), false)

assert.equal(DEFAULT_SET_HOURS, 3)
const now = new Date(2026, 8, 5, 21, 15, 0, 0)
const defaults = defaultSetupTimes(now)
assert.equal(defaults.startsLocal, '2026-09-05T21:15')
assert.equal(defaults.endsLocal, '2026-09-06T00:15')

const payload = timingPayloadFromLocal(defaults.startsLocal, defaults.endsLocal)
assert.ok(payload.performanceStartsAt)
assert.ok(payload.performanceEndsAt)
assert.match(payload.performanceStartsAt, /Z$/)
assert.equal(fromDatetimeLocalValue(defaults.startsLocal)?.getHours(), 21)

const bad = timingPayloadFromLocal('2026-09-05T22:00', '2026-09-05T21:00')
assert.equal(bad.error, 'End must be after start.')

assert.equal(formatEndsTime('2026-09-05T22:30:00.000Z').length > 0, true)
assert.equal(toDatetimeLocalValue(now), '2026-09-05T21:15')
const clock = (value) => formatSetupClockLabel(value, now).replace(/\s/g, ' ')
assert.equal(clock('2026-09-05T21:15'), 'Tonight · 9:15 PM')
assert.equal(clock('2026-09-06T00:15'), 'Tomorrow · 12:15 AM')
assert.equal(clock('2026-09-08T21:00'), 'Sep 8 · 9:00 PM')

assert.deepEqual(livePlaceLine({ title: 'Fun Show', venue: 'The Rock', city: 'Chicago' }), {
  headline: 'Fun Show',
  place: 'The Rock · Chicago',
})
assert.deepEqual(recentShowLine({
  showTitle: 'hello new show 3',
  venue: 'The Rock',
  city: 'Chicago',
  showStartedAt: '2026-09-03T21:00:00',
}), {
  title: 'hello new show 3',
  meta: 'The Rock · Chicago · Sep 3',
})

console.log('test-show-mode-ui-state: ok')
