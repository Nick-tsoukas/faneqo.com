'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const eventActivation = require('../src/utils/showMode/eventActivationPure');

assert.strictEqual(eventActivation.EVENT_DASHBOARD_SOURCE, 'event_page');
assert.strictEqual(eventActivation.eventBelongsToBand({ id: 11, band: { id: 4 } }, 4), true);
assert.strictEqual(eventActivation.eventBelongsToBand({ id: 11, band: 4 }, 4), true);
assert.strictEqual(eventActivation.eventBelongsToBand({ id: 11, band: { id: 9 } }, 4), false);
assert.strictEqual(eventActivation.showModeAlreadyLive({
  showModeStatus: 'live',
  showModeEnabled: true,
}), true);
assert.strictEqual(eventActivation.showModeAlreadyLive({
  showModeStatus: 'off',
  showModeEnabled: false,
}), false);

assert.deepStrictEqual(eventActivation.eventShowDetails({
  id: 11,
  title: 'The Happy Room',
  venue: 'The Happy Room',
  city: 'Chicago',
  state: 'IL',
  date: '2026-09-03',
  image: { url: 'https://cdn.example/cover.jpg' },
}), {
  eventId: 11,
  title: 'The Happy Room',
  venue: 'The Happy Room',
  city: 'Chicago',
  region: 'IL',
  country: null,
  date: '2026-09-03',
  sourceDetail: 'event_page',
});

// --- Activation window policy -----------------------------------------------
// Event-backed Show Mode is an immediate live action, never a scheduling one.
const showTime = require('../src/utils/showTime');
const { ACTIVATION_STATE } = eventActivation;

assert.deepStrictEqual(eventActivation.parseEventTimeParts('20:00:00.000'), { hour: 20, minute: 0 });
assert.deepStrictEqual(eventActivation.parseEventTimeParts('9:30'), { hour: 9, minute: 30 });
assert.strictEqual(eventActivation.parseEventTimeParts('24:00'), null);
assert.strictEqual(eventActivation.parseEventTimeParts('20:75'), null);
assert.strictEqual(eventActivation.parseEventTimeParts('evening'), null);
assert.strictEqual(eventActivation.parseEventTimeParts(''), null);
assert.strictEqual(eventActivation.parseEventTimeParts(null), null);

// No 8 PM default: a timeless Event must not become activatable.
assert.strictEqual(eventActivation.eventStartInstant({ date: '2026-09-03' }, 'America/Chicago'), null);
assert.strictEqual(eventActivation.eventStartInstant({ time: '20:00:00.000' }, 'America/Chicago'), null);
assert.strictEqual(
  eventActivation.eventStartInstant({ date: '2026-09-03', time: '20:00:00.000' }, 'America/Chicago').toISOString(),
  '2026-09-04T01:00:00.000Z'
);

// Next 6 AM is the true next occurrence, not always the following calendar day.
assert.strictEqual(
  showTime.nextLocalSixAm(new Date('2026-09-04T01:00:00.000Z'), 'America/Chicago').toISOString(),
  '2026-09-04T11:00:00.000Z'
);
assert.strictEqual(
  showTime.nextLocalSixAm(new Date('2026-09-04T08:00:00.000Z'), 'America/Chicago').toISOString(),
  '2026-09-04T11:00:00.000Z'
);
assert.strictEqual(
  showTime.nextLocalSixAm(new Date('2026-09-04T11:00:00.000Z'), 'America/Chicago').toISOString(),
  '2026-09-05T11:00:00.000Z'
);

const chicagoEvent = { id: 11, date: '2026-09-03', time: '20:00:00.000' };
const chicago = 'America/Chicago';
// 8 PM Chicago on Sep 3 == 2026-09-04T01:00Z.
const window = eventActivation.resolveEventActivationWindow({
  event: chicagoEvent,
  timeZone: chicago,
  now: new Date('2026-09-04T00:00:00.000Z'),
});
assert.strictEqual(window.state, ACTIVATION_STATE.OPEN);
assert.strictEqual(window.eventStart.toISOString(), '2026-09-04T01:00:00.000Z');
assert.strictEqual(window.opensAt.toISOString(), '2026-09-03T01:00:00.000Z');
// +4h (05:00Z) lands before next local 6 AM (11:00Z), so duration binds.
assert.strictEqual(window.closesAt.toISOString(), '2026-09-04T05:00:00.000Z');

const windowStates = (now) => eventActivation.resolveEventActivationWindow({
  event: chicagoEvent,
  timeZone: chicago,
  now: new Date(now),
}).state;

assert.strictEqual(windowStates('2026-09-01T12:00:00.000Z'), ACTIVATION_STATE.TOO_EARLY);
assert.strictEqual(windowStates('2026-09-03T00:59:59.000Z'), ACTIVATION_STATE.TOO_EARLY);
assert.strictEqual(windowStates('2026-09-03T01:00:00.000Z'), ACTIVATION_STATE.OPEN, 'opens boundary is inclusive');
assert.strictEqual(windowStates('2026-09-04T04:59:59.000Z'), ACTIVATION_STATE.OPEN);
assert.strictEqual(windowStates('2026-09-04T05:00:00.000Z'), ACTIVATION_STATE.CLOSED, 'closes boundary is exclusive');
assert.strictEqual(windowStates('2027-01-01T00:00:00.000Z'), ACTIVATION_STATE.CLOSED);

// 6 AM binds for a small-hours start: 4 AM + 4h would be 8 AM.
const afterHours = eventActivation.resolveEventActivationWindow({
  event: { id: 12, date: '2026-09-04', time: '04:00' },
  timeZone: chicago,
  now: new Date('2026-09-04T09:30:00.000Z'),
});
assert.strictEqual(afterHours.eventStart.toISOString(), '2026-09-04T09:00:00.000Z');
assert.strictEqual(afterHours.closesAt.toISOString(), '2026-09-04T11:00:00.000Z');
assert.strictEqual(afterHours.state, ACTIVATION_STATE.OPEN);

const noTime = eventActivation.resolveEventActivationWindow({
  event: { id: 13, date: '2026-09-04' },
  timeZone: chicago,
  now: new Date('2026-09-04T09:30:00.000Z'),
});
assert.strictEqual(noTime.state, ACTIVATION_STATE.NO_TIME);
assert.strictEqual(noTime.eventStart, null);
assert.strictEqual(noTime.opensAt, null);

assert.strictEqual(eventActivation.activationRefusal(window), null, 'an open window is not a refusal');

const tooEarlyRefusal = eventActivation.activationRefusal({
  state: ACTIVATION_STATE.TOO_EARLY,
  eventStart: new Date('2026-09-04T01:00:00.000Z'),
  opensAt: new Date('2026-09-03T01:00:00.000Z'),
  closesAt: new Date('2026-09-04T05:00:00.000Z'),
});
assert.strictEqual(tooEarlyRefusal.error, 'event_activation_not_open');
assert.strictEqual(tooEarlyRefusal.status, 400);
assert.strictEqual(tooEarlyRefusal.activation.state, ACTIVATION_STATE.TOO_EARLY);
assert.strictEqual(tooEarlyRefusal.activation.opensAt, '2026-09-03T01:00:00.000Z');
assert.strictEqual(tooEarlyRefusal.activation.closesAt, '2026-09-04T05:00:00.000Z');

assert.strictEqual(
  eventActivation.activationRefusal({ state: ACTIVATION_STATE.CLOSED }).error,
  'event_activation_closed'
);
assert.strictEqual(
  eventActivation.activationRefusal({ state: ACTIVATION_STATE.NO_TIME }).error,
  'event_time_missing'
);
// 409 stays reserved for already_live so the dashboard's manage branch is exact.
assert.notStrictEqual(eventActivation.activationRefusal({ state: ACTIVATION_STATE.CLOSED }).status, 409);

// --- Timezone authority ------------------------------------------------------
// The venue's clock decides the window, not the artist's laptop. A touring
// artist in Tokyo must not shift a Chicago show by fifteen hours.
assert.strictEqual(
  eventActivation.resolveActivationTimeZone({
    event: { state: 'IL' },
    band: { showModeTimezone: 'America/New_York' },
    clientTimezone: 'Asia/Tokyo',
  }),
  chicago,
  'the event location outranks both the band default and the browser'
);

// No event location: the band's own stored zone still beats the browser.
assert.strictEqual(
  eventActivation.resolveActivationTimeZone({
    event: {},
    band: { showModeTimezone: 'America/New_York' },
    clientTimezone: 'Asia/Tokyo',
  }),
  'America/New_York'
);

// Browser zone is the final fallback, never the first choice.
assert.strictEqual(
  eventActivation.resolveActivationTimeZone({
    event: {},
    band: {},
    clientTimezone: 'Asia/Tokyo',
  }),
  'Asia/Tokyo'
);

// An unrecognised (non-US) state falls through rather than guessing a zone.
assert.strictEqual(
  eventActivation.resolveActivationTimeZone({
    event: { state: 'Ontario' },
    band: {},
    clientTimezone: 'Asia/Tokyo',
  }),
  'Asia/Tokyo'
);

// Nothing usable leaves callers on the existing server fallback.
assert.strictEqual(
  eventActivation.resolveActivationTimeZone({
    event: {},
    band: {},
    clientTimezone: 'Not/AZone',
  }),
  null
);
assert.strictEqual(eventActivation.resolveActivationTimeZone(), null);

// --- Authoritative read model ------------------------------------------------
// Absolute instants so the dashboard never rebuilds the Event's start in the
// browser zone. This is the false-negative that hid the Start button on tour.
const touring = eventActivation.describeEventActivation({
  event: { id: 41, date: '2026-09-03', time: '20:00:00.000', state: 'IL' },
  band: { id: 4, showModeTimezone: 'America/Los_Angeles' },
  clientTimezone: 'Asia/Tokyo',
  now: new Date('2026-09-04T00:00:00.000Z'),
});
assert.strictEqual(touring.eventId, 41);
assert.strictEqual(touring.timezone, chicago, 'the venue zone wins over band default and browser');
assert.strictEqual(touring.state, ACTIVATION_STATE.OPEN);
assert.strictEqual(touring.eligible, true);
assert.strictEqual(touring.eventStartsAt, '2026-09-04T01:00:00.000Z');
assert.strictEqual(touring.opensAt, '2026-09-03T01:00:00.000Z');
assert.strictEqual(touring.closesAt, '2026-09-04T05:00:00.000Z');
assert.strictEqual(touring.reason, null);

// Had the browser won, Tokyo would have placed the same show at 11:00Z on
// Sep 2 and reported it long closed.
const ifBrowserWon = eventActivation.resolveEventActivationWindow({
  event: { id: 41, date: '2026-09-03', time: '20:00:00.000' },
  timeZone: 'Asia/Tokyo',
  now: new Date('2026-09-04T00:00:00.000Z'),
});
assert.strictEqual(ifBrowserWon.state, ACTIVATION_STATE.CLOSED);
assert.notStrictEqual(ifBrowserWon.eventStart.toISOString(), touring.eventStartsAt);

const upcoming = eventActivation.describeEventActivation({
  event: { id: 42, date: '2026-09-03', time: '20:00:00.000', state: 'IL' },
  now: new Date('2026-09-01T00:00:00.000Z'),
});
assert.strictEqual(upcoming.state, ACTIVATION_STATE.TOO_EARLY);
assert.strictEqual(upcoming.eligible, false);
assert.strictEqual(upcoming.reason, 'event_activation_not_open');
assert.strictEqual(upcoming.opensAt, '2026-09-03T01:00:00.000Z');

const historicalRow = eventActivation.describeEventActivation({
  event: { id: 43, date: '2026-09-03', time: '20:00:00.000', state: 'IL' },
  now: new Date('2026-09-20T00:00:00.000Z'),
});
assert.strictEqual(historicalRow.state, ACTIVATION_STATE.CLOSED);
assert.strictEqual(historicalRow.eligible, false);
assert.strictEqual(historicalRow.reason, 'event_activation_closed');

const undated = eventActivation.describeEventActivation({
  event: { id: 44, date: '2026-09-03', state: 'IL' },
  now: new Date('2026-09-03T18:00:00.000Z'),
});
assert.strictEqual(undated.state, ACTIVATION_STATE.NO_TIME);
assert.strictEqual(undated.eligible, false);
assert.strictEqual(undated.reason, 'event_time_missing');
assert.strictEqual(undated.eventStartsAt, null);
assert.strictEqual(undated.opensAt, null);
assert.strictEqual(undated.closesAt, null);
assert.strictEqual(undated.timezone, chicago, 'a timeless Event still reports its zone');

// --- DST boundaries ----------------------------------------------------------
// US DST starts 2026-03-08 and ends 2026-11-01. The 6 AM ceiling is a local
// wall-clock time, so a 23- or 25-hour day must not move it by an hour.
const springForward = eventActivation.describeEventActivation({
  event: { id: 51, date: '2026-03-08', time: '04:00', state: 'IL' },
  now: new Date('2026-03-08T09:30:00.000Z'),
});
// 04:00 on Mar 8 is already CDT (UTC-5).
assert.strictEqual(springForward.eventStartsAt, '2026-03-08T09:00:00.000Z');
// +4h would be 13:00Z; 6 AM CDT the same morning is 11:00Z and binds.
assert.strictEqual(springForward.closesAt, '2026-03-08T11:00:00.000Z');
assert.strictEqual(springForward.opensAt, '2026-03-07T09:00:00.000Z');
assert.strictEqual(springForward.state, ACTIVATION_STATE.OPEN);

// A show starting the evening before the transition still closes at the real
// next 6 AM, which is only 10 hours later because the night loses an hour.
const acrossSpringForward = eventActivation.describeEventActivation({
  event: { id: 52, date: '2026-03-07', time: '20:00', state: 'IL' },
  now: new Date('2026-03-08T02:30:00.000Z'),
});
assert.strictEqual(acrossSpringForward.eventStartsAt, '2026-03-08T02:00:00.000Z');
assert.strictEqual(acrossSpringForward.closesAt, '2026-03-08T06:00:00.000Z', '+4h binds before 6 AM');
assert.strictEqual(acrossSpringForward.state, ACTIVATION_STATE.OPEN);

const fallBack = eventActivation.describeEventActivation({
  event: { id: 53, date: '2026-11-01', time: '03:00', state: 'IL' },
  now: new Date('2026-11-01T09:30:00.000Z'),
});
// 03:00 on Nov 1 is CST (UTC-6); the transition happened at 02:00.
assert.strictEqual(fallBack.eventStartsAt, '2026-11-01T09:00:00.000Z');
// +4h would be 13:00Z; 6 AM CST the same morning is 12:00Z and binds.
assert.strictEqual(fallBack.closesAt, '2026-11-01T12:00:00.000Z');
assert.strictEqual(fallBack.state, ACTIVATION_STATE.OPEN);

// The evening before fall-back: +4h still binds, across the repeated hour.
const acrossFallBack = eventActivation.describeEventActivation({
  event: { id: 54, date: '2026-10-31', time: '22:00', state: 'IL' },
  now: new Date('2026-11-01T04:00:00.000Z'),
});
assert.strictEqual(acrossFallBack.eventStartsAt, '2026-11-01T03:00:00.000Z');
assert.strictEqual(acrossFallBack.closesAt, '2026-11-01T07:00:00.000Z');
assert.strictEqual(acrossFallBack.state, ACTIVATION_STATE.OPEN);

const cronSrc = fs.readFileSync(path.join(__dirname, '../config/cron-tasks.js'), 'utf8');
assert.match(cronSrc, /processExpiredShowModes/);
assert.match(cronSrc, /findCampaignsNeedingRecap/);
assert.doesNotMatch(cronSrc, /processUpcomingEvents/);
assert.doesNotMatch(cronSrc, /processScheduledShowModes/);
assert.doesNotMatch(cronSrc, /Activated event show modes/);

const showModeSrc = fs.readFileSync(path.join(__dirname, '../src/api/band/services/showMode.js'), 'utf8');
assert.match(showModeSrc, /activateFromEvent/);
assert.match(showModeSrc, /EVENT_DASHBOARD_SOURCE/);
// Time eligibility is a backend invariant, not a frontend rendering choice.
assert.match(showModeSrc, /resolveEventActivationWindow/);
assert.match(showModeSrc, /activationRefusal/);
// The browser's zone must not be the first choice for the window.
assert.match(showModeSrc, /resolveActivationTimeZone\(/);
assert.doesNotMatch(showModeSrc, /resolveUsableTimeZone\(\s*payload\.timezone/);
assert.match(showModeSrc, /Upcoming event auto-activation is disabled/);
assert.match(showModeSrc, /activatedCount: 0, disabled: true/);
assert.doesNotMatch(showModeSrc, /Auto-activated event show mode/);

const controllerSrc = fs.readFileSync(path.join(__dirname, '../src/api/band/controllers/show-mode.js'), 'utf8');
assert.match(controllerSrc, /async activateFromEvent\(ctx\)/);
assert.match(controllerSrc, /assertShowModeAccess\(user\.id, id, \{ mutate: true \}\)/);
assert.match(controllerSrc, /entityService\.findOne\('api::event.event'/);
assert.match(controllerSrc, /result\?\.error/);
assert.match(controllerSrc, /name: result\.error/);
// The refusal reaches the client with its window, so the dashboard can explain
// why rather than guessing.
assert.match(controllerSrc, /activation: result\.activation \|\| null/);
// Batched activation timing rides the existing band-scoped status read: one
// request for every displayed Event, never one request per Event.
assert.match(controllerSrc, /describeEventActivation\(band, eventIds/);
assert.match(controllerSrc, /EVENT_ACTIVATION_BATCH_LIMIT/);

const routes = require('../src/api/band/routes/show-mode').routes;
assert.ok(routes.some((route) => (
  route.method === 'POST' && route.path === '/bands/:id/show-mode/from-event'
)));

const updated = [];
const strapi = {
  log: { info() {}, warn() {}, error() {} },
  entityService: {
    async findOne(uid, id) {
      if (uid === 'api::band.band') {
        if (Number(id) === 4) {
          return {
            id: 4,
            name: 'Burning Thunder',
            showModeStatus: 'off',
            showModeEnabled: false,
            showModeEventId: null,
          };
        }
        if (Number(id) === 7) {
          return {
            id: 7,
            name: 'Live Band',
            showModeStatus: 'live',
            showModeEnabled: true,
            showModeEventId: 99,
            showModeTitle: 'Already live',
          };
        }
        return null;
      }
      return null;
    },
    async update(uid, id, { data }) {
      updated.push({ uid, id, data });
      return { id, ...data };
    },
  },
};

const pad2 = (value) => String(value).padStart(2, '0');

/**
 * Event `date` + `time` for a given instant, as wall-clock in `timeZone`.
 * The service reads the real clock, so fixtures are built relative to now
 * rather than pinned to a date that quietly ages into the past.
 */
function eventFieldsAt(instant, timeZone) {
  const parts = showTime.getZonedParts(instant, timeZone);
  return {
    date: `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}`,
    time: `${pad2(parts.hour)}:${pad2(parts.minute)}:00.000`,
  };
}

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

async function run() {
  const previous = global.strapi;
  global.strapi = strapi;
  try {
    delete require.cache[require.resolve('../src/api/band/services/showMode')];
    const showMode = require('../src/api/band/services/showMode');

    const skipped = await showMode.processUpcomingEvents();
    assert.strictEqual(skipped.activatedCount, 0);
    assert.strictEqual(skipped.disabled, true);
    assert.strictEqual(updated.length, 0, 'cron no-op must not write');

    const now = Date.now();
    // Five minutes out keeps the window open however close the real clock is
    // to the local 6 AM ceiling.
    const startingSoon = eventFieldsAt(new Date(now + 5 * MINUTE), chicago);
    const farFuture = eventFieldsAt(new Date(now + 30 * HOUR), chicago);
    const historical = eventFieldsAt(new Date(now - 10 * 24 * HOUR), chicago);

    const event = {
      id: 11,
      title: 'The Happy Room',
      venue: 'The Happy Room',
      city: 'Chicago',
      state: 'IL',
      ...startingSoon,
      band: { id: 4 },
      image: { url: 'https://cdn.example/cover.jpg' },
    };

    const wrongBand = await showMode.activateFromEvent(4, { ...event, band: { id: 9 } });
    assert.strictEqual(wrongBand.error, 'forbidden');
    assert.strictEqual(updated.length, 0);

    const conflict = await showMode.activateFromEvent(7, { ...event, band: { id: 7 } });
    assert.strictEqual(conflict.error, 'already_live');
    assert.strictEqual(conflict.status, 409);
    assert.strictEqual(updated.length, 0);

    // A historical Event must not create a new live campaign, attendance
    // window, or recap. This is the bug this slice closes.
    const past = await showMode.activateFromEvent(4, {
      ...event,
      id: 21,
      ...historical,
    }, { timezone: chicago });
    assert.strictEqual(past.error, 'event_activation_closed');
    assert.strictEqual(past.status, 400);
    assert.strictEqual(past.activation.state, ACTIVATION_STATE.CLOSED);
    assert.strictEqual(updated.length, 0, 'a closed window must not write');

    // A far-future Event is upcoming, not live now, and not scheduled either.
    const early = await showMode.activateFromEvent(4, {
      ...event,
      id: 22,
      ...farFuture,
    }, { timezone: chicago });
    assert.strictEqual(early.error, 'event_activation_not_open');
    assert.strictEqual(early.status, 400);
    assert.strictEqual(early.activation.state, ACTIVATION_STATE.TOO_EARLY);
    assert.ok(early.activation.opensAt);
    assert.strictEqual(updated.length, 0, 'an unopened window must not write');

    // No usable date/time: Event-backed activation is unavailable. Manual
    // Show Mode still is.
    const timeless = await showMode.activateFromEvent(4, {
      ...event,
      id: 23,
      date: startingSoon.date,
      time: null,
    }, { timezone: chicago });
    assert.strictEqual(timeless.error, 'event_time_missing');
    assert.strictEqual(timeless.status, 400);
    assert.strictEqual(updated.length, 0, 'a timeless Event must not write');

    const noImage = await showMode.activateFromEvent(4, {
      id: 12,
      title: 'No Cover Night',
      venue: 'Empty Room',
      city: 'Chicago',
      state: 'IL',
      ...startingSoon,
      band: { id: 4 },
    }, { timezone: chicago });
    assert.strictEqual(noImage.status, 'live');
    assert.strictEqual(noImage.eventId, 12);
    assert.strictEqual(noImage.coverUrl, null);
    assert.strictEqual(noImage.sourceDetail, 'event_page');
    assert.strictEqual(updated[0].data.showModeEventId, 12);
    assert.strictEqual(updated[0].data.showModeAutoManaged, false);
    assert.strictEqual(updated[0].data.showModeSourceDetail, 'event_page');
    assert.notStrictEqual(updated[0].data.showModeSourceDetail, 'event_auto');

    const withCover = await showMode.activateFromEvent(4, event, { timezone: chicago });
    assert.strictEqual(withCover.status, 'live');
    assert.strictEqual(withCover.eventId, 11);
    assert.strictEqual(withCover.title, 'The Happy Room');
    assert.strictEqual(withCover.venue, 'The Happy Room');
    assert.strictEqual(withCover.city, 'Chicago');
    assert.strictEqual(withCover.region, 'IL');
    assert.strictEqual(withCover.coverUrl, 'https://cdn.example/cover.jpg');
    assert.strictEqual(withCover.sourceDetail, 'event_page');
    assert.strictEqual(updated[1].data.showModeEventId, 11);
    assert.strictEqual(updated[1].data.showModeTitle, 'The Happy Room');
    assert.strictEqual(updated[1].data.showModeCity, 'Chicago');
    assert.strictEqual(updated[1].data.showModeRegion, 'IL');
    assert.ok(updated[1].data.showModePerformanceStartsAt);
    assert.ok(updated[1].data.showModePerformanceEndsAt);
    assert.ok(updated[1].data.showModeEndsAt);
    // The session must not open already expired.
    assert.ok(
      new Date(updated[1].data.showModeEndsAt).getTime() > now,
      'a new session must not be born expired'
    );

    // Legacy auto-activation helper obeys the same window.
    const legacyPast = await showMode.activateEventShowMode(4, {
      ...event,
      id: 24,
      ...historical,
    }, chicago);
    assert.strictEqual(legacyPast, null);
    assert.strictEqual(updated.length, 2, 'legacy helper must not write outside the window');
  } finally {
    global.strapi = previous;
  }
}

run().then(() => {
  console.log('show mode event activation tests passed');
}).catch((err) => {
  console.error(err);
  process.exit(1);
});
