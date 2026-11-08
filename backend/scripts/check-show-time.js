'use strict';

/* Sanity checks for src/utils/showTime.js (run with: node scripts/check-show-time.js) */

process.env.TZ = 'UTC'; // match production (Railway runs UTC)

const showTime = require('../src/utils/showTime');

let failures = 0;

function check(label, actual, expected) {
  const ok = actual === expected;
  if (!ok) failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}\n      actual:   ${actual}\n      expected: ${expected}`);
}

// 8pm show in New York (EDT, UTC-4) => 00:00 UTC next day
check(
  'resolveEventStart 8pm America/New_York (summer)',
  showTime.resolveEventStart({ date: '2026-07-10', time: '20:00:00.000' }, 'America/New_York').toISOString(),
  '2026-07-11T00:00:00.000Z'
);

// 8pm show in Los Angeles (PDT, UTC-7) => 03:00 UTC next day
check(
  'resolveEventStart 8pm America/Los_Angeles (summer)',
  showTime.resolveEventStart({ date: '2026-07-10', time: '20:00:00.000' }, 'America/Los_Angeles').toISOString(),
  '2026-07-11T03:00:00.000Z'
);

// Winter, standard time (EST, UTC-5) => 01:00 UTC next day
check(
  'resolveEventStart 8pm America/New_York (winter)',
  showTime.resolveEventStart({ date: '2026-01-10', time: '20:00:00.000' }, 'America/New_York').toISOString(),
  '2026-01-11T01:00:00.000Z'
);

// Missing time defaults to 8pm local
check(
  'resolveEventStart defaults to 8pm local',
  showTime.resolveEventStart({ date: '2026-07-10' }, 'America/New_York').toISOString(),
  '2026-07-11T00:00:00.000Z'
);

// Unknown timezone falls back to the server clock (UTC here)
check(
  'resolveEventStart falls back to server clock',
  showTime.resolveEventStart({ date: '2026-07-10', time: '20:00:00.000' }, null).toISOString(),
  '2026-07-10T20:00:00.000Z'
);

check('resolveEventStart with no date', showTime.resolveEventStart({ time: '20:00' }, 'America/New_York'), null);

// Show mode started 9pm ET => ends 6am ET the next morning (10:00 UTC)
check(
  'getNextMorning6AM from 9pm ET',
  showTime.getNextMorning6AM('America/New_York', new Date('2026-07-11T01:00:00.000Z')).toISOString(),
  '2026-07-11T10:00:00.000Z'
);

// Late-night activation (1am ET) still ends the *following* 6am ET
check(
  'getNextMorning6AM from 1am ET',
  showTime.getNextMorning6AM('America/New_York', new Date('2026-07-11T05:00:00.000Z')).toISOString(),
  '2026-07-12T10:00:00.000Z'
);

// Pacific: 9pm PT => 6am PT next morning (13:00 UTC)
check(
  'getNextMorning6AM from 9pm PT',
  showTime.getNextMorning6AM('America/Los_Angeles', new Date('2026-07-11T04:00:00.000Z')).toISOString(),
  '2026-07-11T13:00:00.000Z'
);

// Month rollover
check(
  'getNextMorning6AM across month boundary',
  showTime.getNextMorning6AM('America/New_York', new Date('2026-08-01T02:00:00.000Z')).toISOString(),
  '2026-08-01T10:00:00.000Z'
);

// Invalid timezone falls back instead of throwing
check(
  'getNextMorning6AM with invalid timezone',
  showTime.getNextMorning6AM('Not/AZone', new Date('2026-07-10T20:00:00.000Z')).toISOString(),
  '2026-07-11T06:00:00.000Z'
);

check(
  'toDateString in zone',
  showTime.toDateString(new Date('2026-07-11T02:00:00.000Z'), 'America/New_York'),
  '2026-07-10'
);

check('timeZoneFromRegion abbreviation', showTime.timeZoneFromRegion('TX'), 'America/Chicago');
check('timeZoneFromRegion full name', showTime.timeZoneFromRegion('California'), 'America/Los_Angeles');
check('timeZoneFromRegion lowercase and spaced', showTime.timeZoneFromRegion(' new york '), 'America/New_York');
check('timeZoneFromRegion punctuated', showTime.timeZoneFromRegion('D.C.'), 'America/New_York');
check('timeZoneFromRegion unknown', showTime.timeZoneFromRegion('Ontario'), null);
check('timeZoneFromRegion empty', showTime.timeZoneFromRegion(''), null);

// Venue location wins over the band's stored (home) timezone
check(
  'resolveShowTimeZone prefers the venue state',
  showTime.resolveShowTimeZone({
    event: { state: 'CO' },
    band: { showModeTimezone: 'America/New_York' },
  }),
  'America/Denver'
);

check(
  'resolveShowTimeZone falls back to the band timezone',
  showTime.resolveShowTimeZone({
    event: { state: null },
    band: { showModeTimezone: 'America/New_York' },
  }),
  'America/New_York'
);

check(
  'resolveShowTimeZone ignores an invalid band timezone',
  showTime.resolveShowTimeZone({ event: {}, band: { showModeTimezone: 'Not/AZone' } }),
  null
);

check('resolveShowTimeZone with nothing known', showTime.resolveShowTimeZone(), null);

check(
  'parseTimestamp ISO instant',
  showTime.parseTimestamp('2026-07-11T02:00:00.000Z').value.toISOString(),
  '2026-07-11T02:00:00.000Z'
);

check(
  'parseTimestamp naive wall time uses venue zone, not UTC',
  showTime.parseTimestamp('2026-07-10T22:00:00', 'America/New_York').value.toISOString(),
  '2026-07-11T02:00:00.000Z'
);

check(
  'parseTimestamp date-only is rejected',
  showTime.parseTimestamp('2026-07-10').error,
  'invalid_timestamp'
);

check(
  'parseTimestamp malformed is rejected',
  showTime.parseTimestamp('not-a-date').error,
  'invalid_timestamp'
);

check('parseTimestamp empty is null', showTime.parseTimestamp('').value, null);

check(
  'invalid timezone does not crash parseTimestamp',
  showTime.parseTimestamp('2026-07-10T22:00:00', 'Not/AZone').value.toISOString(),
  '2026-07-10T22:00:00.000Z'
);

check(
  'resolveUsableTimeZone skips invalid and uses fallback',
  showTime.resolveUsableTimeZone('Not/AZone', 'America/Chicago'),
  'America/Chicago'
);

check('resolveUsableTimeZone all invalid', showTime.resolveUsableTimeZone('Nope', null), null);

const overnight = showTime.resolveShowPerformanceTiming({
  now: new Date('2026-07-11T02:00:00.000Z'),
  timezone: 'America/New_York',
  performanceStartsAt: '2026-07-10T22:00:00',
  performanceEndsAt: '2026-07-11T02:00:00',
});
check('overnight show succeeds', overnight.ok, true);
check(
  'overnight performance start',
  overnight.performanceStartsAt.toISOString(),
  '2026-07-11T02:00:00.000Z'
);
check(
  'overnight performance end',
  overnight.performanceEndsAt.toISOString(),
  '2026-07-11T06:00:00.000Z'
);

const equal = showTime.resolveShowPerformanceTiming({
  now: new Date('2026-07-11T02:00:00.000Z'),
  timezone: 'America/New_York',
  performanceStartsAt: '2026-07-10T22:00:00.000Z',
  performanceEndsAt: '2026-07-10T22:00:00.000Z',
});
check('equal start/end rejected', equal.error, 'invalid_range');

const reversed = showTime.resolveShowPerformanceTiming({
  now: new Date('2026-07-11T02:00:00.000Z'),
  timezone: 'America/New_York',
  performanceStartsAt: '2026-07-11T04:00:00.000Z',
  performanceEndsAt: '2026-07-11T02:00:00.000Z',
});
check('end before start rejected', reversed.error, 'invalid_range');

const legacy = showTime.resolveShowPerformanceTiming({
  now: new Date('2026-07-11T01:00:00.000Z'),
  timezone: 'America/New_York',
  source: 'manual',
});
check('legacy default end is next local 6AM', legacy.usedLegacyDefault, true);
check(
  'legacy default performance end',
  legacy.performanceEndsAt.toISOString(),
  '2026-07-11T10:00:00.000Z'
);
check(
  'legacy effective session end matches 6AM',
  legacy.effectiveEndsAt.toISOString(),
  '2026-07-11T10:00:00.000Z'
);

const explicit = showTime.resolveShowPerformanceTiming({
  now: new Date('2026-07-11T00:00:00.000Z'),
  timezone: 'America/New_York',
  performanceStartsAt: '2026-07-11T00:00:00.000Z',
  performanceEndsAt: '2026-07-11T02:30:00.000Z',
});
check(
  'explicit performance end drives session expiry',
  explicit.effectiveEndsAt.toISOString(),
  '2026-07-11T02:30:00.000Z'
);

const capped = showTime.resolveShowPerformanceTiming({
  now: new Date('2026-07-11T01:00:00.000Z'),
  timezone: 'America/New_York',
  performanceStartsAt: '2026-07-11T01:00:00.000Z',
  performanceEndsAt: '2026-07-11T14:00:00.000Z',
});
check(
  '6AM safety ceiling caps session expiry',
  capped.effectiveEndsAt.toISOString(),
  '2026-07-11T10:00:00.000Z'
);
check(
  'intended performance end is still stored past the ceiling',
  capped.performanceEndsAt.toISOString(),
  '2026-07-11T14:00:00.000Z'
);

const eventDefault = showTime.deriveDefaultPerformanceEnd({
  start: new Date('2026-07-11T00:00:00.000Z'),
  timeZone: 'America/New_York',
  mode: 'event',
});
check(
  'event default end is 4 hours when under the 6AM ceiling',
  eventDefault.toISOString(),
  '2026-07-11T04:00:00.000Z'
);

check(
  'expiry reason is performance_end when that is the binding end',
  showTime.resolveExpiryReason({
    performanceEndsAt: new Date('2026-07-11T02:30:00.000Z'),
    safetyCeiling: new Date('2026-07-11T10:00:00.000Z'),
    now: new Date('2026-07-11T02:31:00.000Z'),
  }),
  'performance_end'
);

check(
  'expiry reason is safety_expiry when 6AM is the binding end',
  showTime.resolveExpiryReason({
    performanceEndsAt: new Date('2026-07-11T14:00:00.000Z'),
    safetyCeiling: new Date('2026-07-11T10:00:00.000Z'),
    now: new Date('2026-07-11T10:01:00.000Z'),
  }),
  'safety_expiry'
);

const dstSpringStart = showTime.zonedTimeToUtc(
  { year: 2026, month: 3, day: 8, hour: 1, minute: 30 },
  'America/New_York'
);
const dstSpringAfter = showTime.zonedTimeToUtc(
  { year: 2026, month: 3, day: 8, hour: 3, minute: 30 },
  'America/New_York'
);
check(
  'DST spring-forward 1:30 EST',
  dstSpringStart.toISOString(),
  '2026-03-08T06:30:00.000Z'
);
check(
  'DST spring-forward 3:30 EDT is one real hour later',
  dstSpringAfter.toISOString(),
  '2026-03-08T07:30:00.000Z'
);

const dstFall = showTime.zonedTimeToUtc(
  { year: 2026, month: 11, day: 1, hour: 1, minute: 30 },
  'America/New_York'
);
check('DST fall-back 1:30 resolves without throwing', Number.isNaN(dstFall.getTime()), false);

const invalidTzTiming = showTime.resolveShowPerformanceTiming({
  now: new Date('2026-07-10T20:00:00.000Z'),
  timezone: 'Not/AZone',
});
check('invalid timezone does not crash timing resolve', invalidTzTiming.ok, true);
check(
  'invalid timezone falls back to server-clock 6AM',
  invalidTzTiming.effectiveEndsAt.toISOString(),
  '2026-07-11T06:00:00.000Z'
);

const recapTiming = showTime.resolveRecapPerformanceTiming({
  snapshot: { performanceStartsAt: null, showStartedAt: '2026-07-11T00:00:00.000Z' },
  stored: { performanceStartsAt: '2026-07-10T22:00:00.000Z', performanceEndsAt: '2026-07-11T02:00:00.000Z' },
});
check(
  'recap regeneration keeps stored performance start',
  recapTiming.performanceStartsAt,
  '2026-07-10T22:00:00.000Z'
);

const readLegacy = showTime.withReadTimePerformanceTiming({
  showStartedAt: '2026-07-11T00:00:00.000Z',
  showEndedAt: '2026-07-11T04:00:00.000Z',
});
check(
  'legacy recap read fallback uses showStartedAt',
  readLegacy.performanceStartsAt,
  '2026-07-11T00:00:00.000Z'
);
check(
  'legacy recap read fallback uses showEndedAt',
  readLegacy.performanceEndsAt,
  '2026-07-11T04:00:00.000Z'
);

// End to end: a Denver show for a New York band starts at 8pm Mountain
check(
  'event start uses the venue zone, not the band zone',
  showTime
    .resolveEventStart(
      { date: '2026-07-10', time: '20:00:00.000' },
      showTime.resolveShowTimeZone({
        event: { state: 'Colorado' },
        band: { showModeTimezone: 'America/New_York' },
      })
    )
    .toISOString(),
  '2026-07-11T02:00:00.000Z'
);

console.log(failures === 0 ? '\nAll checks passed' : `\n${failures} check(s) failed`);
process.exit(failures === 0 ? 0 : 1);
