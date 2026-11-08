'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const showTime = require('../src/utils/showTime');

process.env.TZ = 'UTC';

let passed = 0;
let failed = 0;

/**
 * Wall-clock helpers for timezone fixtures.
 *
 * Show Mode only accepts a performance start within 24 hours of now, so an
 * overnight fixture has to be anchored to the current date at runtime rather
 * than written down. Assertions round-trip the returned instant back into the
 * band's zone instead of hard-coding UTC, which keeps them correct across DST
 * without re-implementing the conversion under test.
 */
function localWallClock(instant, timeZone) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(instant).reduce((acc, part) => {
    acc[part.type] = part.value;
    return acc;
  }, {});
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}`;
}

function localDate(instant, timeZone) {
  return localWallClock(instant, timeZone).slice(0, 10);
}

/**
 * Event `date` + `time` for an instant, as Strapi stores them.
 *
 * Event-backed activation is only allowed inside the Event's own window
 * (`eventStart - 24h` … `min(eventStart + 4h, next local 6 AM)`), so these
 * fixtures must track the clock rather than pin a date that ages into the past.
 */
function eventFieldsAt(instant, timeZone) {
  const wall = localWallClock(instant, timeZone);
  return { date: wall.slice(0, 10), time: `${wall.slice(11, 16)}:00.000` };
}

async function test(name, fn) {
  try {
    await fn();
    passed += 1;
    console.log(`  ✅ ${name}`);
  } catch (err) {
    failed += 1;
    console.log(`  ❌ ${name}`);
    console.log(`     ${err.message}`);
  }
}

function makeStrapi({ bands = {}, events = {} } = {}) {
  const updated = [];
  const createdRecaps = [];
  const updatedRecaps = [];
  const recaps = [];

  const strapi = {
    log: { info() {}, warn() {}, error() {} },
    entityService: {
      async findOne(uid, id) {
        if (uid === 'api::band.band') return bands[Number(id)] || bands[id] || null;
        if (uid === 'api::event.event') return events[Number(id)] || events[id] || null;
        if (uid === 'api::show-recap.show-recap') {
          return recaps.find((row) => Number(row.id) === Number(id)) || null;
        }
        return null;
      },
      async findMany(uid, query = {}) {
        if (uid === 'api::band.band') {
          const list = Object.values(bands);
          const filters = query.filters || {};
          return list.filter((band) => {
            if (filters.showModeEnabled === true && band.showModeEnabled !== true) return false;
            if (filters.showModeStatus === 'live' && band.showModeStatus !== 'live') return false;
            if (filters.showModeEndsAt?.$lt) {
              if (!band.showModeEndsAt || new Date(band.showModeEndsAt) >= new Date(filters.showModeEndsAt.$lt)) {
                return false;
              }
            }
            return true;
          }).slice(0, query.limit || 100);
        }
        if (uid === 'api::show-recap.show-recap') {
          const campaignId = query.filters?.campaignId;
          return recaps.filter((row) => !campaignId || row.campaignId === campaignId);
        }
        if (uid === 'api::event.event') {
          const ids = (query.filters?.id?.$in || []).map(Number);
          const bandId = query.filters?.band?.id?.$eq;
          return Object.values(events).filter((event) => {
            if (ids.length && !ids.includes(Number(event.id))) return false;
            // The band-scoped filter is the authorization boundary.
            if (bandId != null && Number(event.band?.id ?? event.band) !== Number(bandId)) return false;
            return true;
          });
        }
        if (uid === 'api::fan.fan' || uid === 'api::fan-interaction.fan-interaction') return [];
        if (uid === 'api::fan-show-attendance.fan-show-attendance') return [];
        return [];
      },
      async update(uid, id, { data }) {
        if (uid === 'api::band.band') {
          const current = bands[Number(id)] || bands[id] || { id };
          const next = { ...current, ...data };
          bands[Number(id)] = next;
          updated.push({ uid, id, data });
          return next;
        }
        if (uid === 'api::show-recap.show-recap') {
          const current = recaps.find((row) => Number(row.id) === Number(id));
          Object.assign(current, data);
          updatedRecaps.push({ id, data });
          return current;
        }
        updated.push({ uid, id, data });
        return { id, ...data };
      },
      async create(uid, { data }) {
        if (uid === 'api::show-recap.show-recap') {
          const row = { id: createdRecaps.length + 1, ...data };
          recaps.push(row);
          createdRecaps.push(row);
          return row;
        }
        return { id: 1, ...data };
      },
      async count() {
        return 0;
      },
    },
    service() {
      return {
        async generateShowRecap(args) {
          strapi.__recapsQueued.push(args);
          return { id: 99, campaignId: args.campaignId };
        },
        async calculateBatchEngagementScores() {
          return {};
        },
      };
    },
    __recapsQueued: [],
    __updated: updated,
    __createdRecaps: createdRecaps,
    __updatedRecaps: updatedRecaps,
    __recaps: recaps,
    __bands: bands,
  };

  return strapi;
}

function loadShowMode(strapi) {
  delete require.cache[require.resolve('../src/api/band/services/showMode')];
  global.strapi = strapi;
  return require('../src/api/band/services/showMode');
}

async function flushAsync() {
  await new Promise((resolve) => setImmediate(resolve));
  await new Promise((resolve) => setImmediate(resolve));
}

(async () => {
  console.log('\n=== Show Mode timing slice ===\n');

  const previousGlobal = global.strapi;

  await test('routes expose timing PATCH without dropping legacy paths', () => {
    const routes = require('../src/api/band/routes/show-mode').routes;
    assert.ok(routes.some((route) => route.method === 'GET' && route.path === '/bands/:id/show-mode'));
    assert.ok(routes.some((route) => route.method === 'POST' && route.path === '/bands/:id/show-mode/manual'));
    assert.ok(routes.some((route) => route.method === 'POST' && route.path === '/bands/:id/show-mode/from-event'));
    assert.ok(routes.some((route) => route.method === 'POST' && route.path === '/bands/:id/show-mode/deactivate'));
    assert.ok(routes.some((route) => route.method === 'PATCH' && route.path === '/bands/:id/show-mode/timing'));
  });

  await test('controller still reads legacy status fields and adds performance fields', () => {
    const src = fs.readFileSync(path.join(__dirname, '../src/api/band/controllers/show-mode.js'), 'utf8');
    assert.match(src, /showModeStartedAt/);
    assert.match(src, /showModeEndsAt/);
    assert.match(src, /showModePerformanceStartsAt/);
    assert.match(src, /showModePerformanceEndsAt/);
    assert.match(src, /async updateTiming\(ctx\)/);
    assert.match(src, /performanceStartsAt/);
    assert.match(src, /performanceEndsAt/);
  });

  await test('cron expires live sessions every minute and keeps recap recovery at 15', () => {
    const cronSrc = fs.readFileSync(path.join(__dirname, '../config/cron-tasks.js'), 'utf8');
    assert.match(cronSrc, /'\* \* \* \* \*'/);
    assert.match(cronSrc, /processExpiredShowModes/);
    assert.match(cronSrc, /'\*\/15 \* \* \* \*'/);
    assert.match(cronSrc, /findCampaignsNeedingRecap/);
    const minuteBlock = cronSrc.slice(cronSrc.indexOf("'* * * * *'"));
    const fifteenBlock = cronSrc.slice(cronSrc.indexOf("'*/15 * * * *'"), cronSrc.indexOf("'* * * * *'"));
    assert.match(minuteBlock, /processExpiredShowModes/);
    assert.doesNotMatch(fifteenBlock, /processExpiredShowModes/);
    assert.match(fifteenBlock, /findCampaignsNeedingRecap/);
  });

  await test('legacy manual activation still works without new fields', async () => {
    const strapi = makeStrapi({ bands: { 4: { id: 4, name: 'Burning Thunder' } } });
    const showMode = loadShowMode(strapi);
    const result = await showMode.activateManualShowMode(4, { timezone: 'America/Chicago' });
    assert.strictEqual(result.status, 'live');
    assert.ok(result.campaignId.startsWith('sm_'));
    assert.ok(result.startedAt);
    assert.ok(result.endsAt);
    assert.ok(result.performanceStartsAt);
    assert.ok(result.performanceEndsAt);
    const written = strapi.__updated[0].data;
    assert.strictEqual(written.showModeStatus, 'live');
    assert.ok(written.showModeStartedAt);
    assert.ok(written.showModeEndsAt);
    assert.ok(written.showModePerformanceStartsAt);
    assert.ok(written.showModePerformanceEndsAt);
    assert.strictEqual(written.showModeEndsAt, written.showModePerformanceEndsAt);
  });

  await test('manual activation with performance start/end', async () => {
    const start = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const end = new Date(Date.now() + 90 * 60 * 1000).toISOString();
    const strapi = makeStrapi({ bands: { 4: { id: 4, name: 'Burning Thunder' } } });
    const showMode = loadShowMode(strapi);
    const result = await showMode.activateManualShowMode(4, {
      timezone: 'America/New_York',
      performanceStartsAt: start,
      performanceEndsAt: end,
    });
    assert.strictEqual(result.error, undefined);
    assert.strictEqual(new Date(result.performanceEndsAt).toISOString(), end);
    assert.strictEqual(new Date(result.effectiveEndsAt).toISOString(), end);
    assert.strictEqual(strapi.__updated[0].data.showModeCampaignId, result.campaignId);
  });

  await test('performance end after start succeeds and equal/before are rejected', async () => {
    const start = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const end = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const strapi = makeStrapi({
      bands: {
        4: { id: 4, name: 'Burning Thunder' },
        5: { id: 5, name: 'Range Check' },
        6: { id: 6, name: 'Before Check' },
      },
    });
    const showMode = loadShowMode(strapi);
    const ok = await showMode.activateManualShowMode(4, {
      timezone: 'America/New_York',
      performanceStartsAt: start,
      performanceEndsAt: end,
    });
    assert.strictEqual(ok.status, 'live');

    const equal = await showMode.activateManualShowMode(5, {
      timezone: 'America/New_York',
      performanceStartsAt: start,
      performanceEndsAt: start,
    });
    assert.strictEqual(equal.error, 'invalid_range');
    assert.strictEqual(equal.status, 400);

    const before = await showMode.activateManualShowMode(6, {
      timezone: 'America/New_York',
      performanceStartsAt: end,
      performanceEndsAt: start,
    });
    assert.strictEqual(before.error, 'invalid_range');
  });

  await test('overnight show and normal timezone behavior', async () => {
    const zone = 'America/New_York';
    const now = new Date();
    // Tonight into tomorrow morning, in the band's own zone. 23:00 and 04:00
    // both exist and are unambiguous on every DST transition day.
    const tonight = localDate(now, zone);
    const tomorrow = localDate(new Date(now.getTime() + 24 * 60 * 60 * 1000), zone);

    const strapi = makeStrapi({ bands: { 4: { id: 4, name: 'Burning Thunder' } } });
    const showMode = loadShowMode(strapi);
    const result = await showMode.activateManualShowMode(4, {
      timezone: zone,
      performanceStartsAt: `${tonight}T23:00:00`,
      performanceEndsAt: `${tomorrow}T04:00:00`,
    });
    assert.strictEqual(result.status, 'live');

    const start = new Date(result.performanceStartsAt);
    const end = new Date(result.performanceEndsAt);
    // A naive local string is read in the band's zone, not the server's UTC.
    assert.strictEqual(localWallClock(start, zone), `${tonight} 23:00`);
    assert.strictEqual(localWallClock(end, zone), `${tomorrow} 04:00`);
    // The end crosses midnight forward instead of collapsing to the same day.
    assert.ok(end.getTime() > start.getTime(), 'overnight end must be after start');
    assert.notStrictEqual(localDate(end, zone), localDate(start, zone));
  });

  await test('malformed timestamps are rejected and invalid timezone does not crash', async () => {
    const strapi = makeStrapi({ bands: { 4: { id: 4, name: 'Burning Thunder' } } });
    const showMode = loadShowMode(strapi);
    const bad = await showMode.activateManualShowMode(4, {
      timezone: 'America/New_York',
      performanceEndsAt: 'Thursday night',
    });
    assert.strictEqual(bad.error, 'invalid_timestamp');

    const invalidTz = await showMode.activateManualShowMode(4, { timezone: 'Not/AZone' });
    assert.strictEqual(invalidTz.status, 'live');
    assert.ok(invalidTz.endsAt);
  });

  await test('Event-backed activation copies start and derives an end', async () => {
    const strapi = makeStrapi({
      bands: {
        4: {
          id: 4,
          name: 'Burning Thunder',
          showModeStatus: 'off',
          showModeEnabled: false,
        },
      },
    });
    const showMode = loadShowMode(strapi);
    const event = {
      id: 11,
      title: 'The Happy Room',
      venue: 'The Happy Room',
      city: 'Chicago',
      state: 'IL',
      ...eventFieldsAt(new Date(Date.now() + 5 * 60 * 1000), 'America/Chicago'),
      band: { id: 4 },
    };
    const result = await showMode.activateFromEvent(4, event, { timezone: 'America/Chicago' });
    assert.strictEqual(result.status, 'live');
    assert.strictEqual(result.eventId, 11);
    assert.ok(result.performanceStartsAt);
    assert.ok(result.performanceEndsAt);
    assert.strictEqual(strapi.__updated[0].data.showModeEventId, 11);
    assert.ok(strapi.__updated[0].data.showModeCampaignId);
  });

  await test('Event-backed activation with no explicit end still succeeds', async () => {
    const strapi = makeStrapi({
      bands: { 4: { id: 4, name: 'Burning Thunder', showModeStatus: 'off', showModeEnabled: false } },
    });
    const showMode = loadShowMode(strapi);
    const result = await showMode.activateFromEvent(4, {
      id: 12,
      title: 'No End Night',
      venue: 'Empty Room',
      city: 'Chicago',
      state: 'IL',
      ...eventFieldsAt(new Date(Date.now() + 5 * 60 * 1000), 'America/Chicago'),
      band: { id: 4 },
    }, { timezone: 'America/Chicago' });
    assert.strictEqual(result.status, 'live');
    assert.ok(result.performanceEndsAt);
    assert.ok(new Date(result.effectiveEndsAt).getTime() > Date.now() - 1000);
  });

  await test('Event-backed activation refuses outside the Event activation window', async () => {
    const chicago = 'America/Chicago';
    const base = {
      title: 'The Happy Room',
      venue: 'The Happy Room',
      city: 'Chicago',
      state: 'IL',
      band: { id: 4 },
    };
    const freshBand = () => makeStrapi({
      bands: { 4: { id: 4, name: 'Burning Thunder', showModeStatus: 'off', showModeEnabled: false } },
    });

    // A historical Event must not create a new live campaign or recap.
    const pastStrapi = freshBand();
    const past = await loadShowMode(pastStrapi).activateFromEvent(4, {
      ...base,
      id: 31,
      ...eventFieldsAt(new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), chicago),
    }, { timezone: chicago });
    assert.strictEqual(past.error, 'event_activation_closed');
    assert.strictEqual(past.status, 400);
    assert.strictEqual(pastStrapi.__updated.length, 0);

    // A far-future Event is upcoming, not live now.
    const earlyStrapi = freshBand();
    const early = await loadShowMode(earlyStrapi).activateFromEvent(4, {
      ...base,
      id: 32,
      ...eventFieldsAt(new Date(Date.now() + 30 * 60 * 60 * 1000), chicago),
    }, { timezone: chicago });
    assert.strictEqual(early.error, 'event_activation_not_open');
    assert.strictEqual(early.status, 400);
    assert.strictEqual(earlyStrapi.__updated.length, 0);

    // No usable time: there is no 8 PM default for activation eligibility.
    const timelessStrapi = freshBand();
    const timeless = await loadShowMode(timelessStrapi).activateFromEvent(4, {
      ...base,
      id: 33,
      date: localDate(new Date(), chicago),
    }, { timezone: chicago });
    assert.strictEqual(timeless.error, 'event_time_missing');
    assert.strictEqual(timeless.status, 400);
    assert.strictEqual(timelessStrapi.__updated.length, 0);
  });

  await test('batched Event activation is band-scoped, one query for every Event', async () => {
    const chicago = 'America/Chicago';
    const soon = eventFieldsAt(new Date(Date.now() + 5 * 60 * 1000), chicago);
    const later = eventFieldsAt(new Date(Date.now() + 30 * 60 * 60 * 1000), chicago);
    const past = eventFieldsAt(new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), chicago);

    const strapi = makeStrapi({
      bands: {
        4: {
          id: 4,
          name: 'Burning Thunder',
          showModeStatus: 'off',
          showModeEnabled: false,
          // A stale home zone must not override the venue's state.
          showModeTimezone: 'America/Los_Angeles',
        },
      },
      events: {
        61: { id: 61, state: 'IL', band: { id: 4 }, ...soon },
        62: { id: 62, state: 'IL', band: { id: 4 }, ...later },
        63: { id: 63, state: 'IL', band: { id: 4 }, ...past },
        64: { id: 64, state: 'IL', band: { id: 4 }, date: soon.date },
        // Belongs to somebody else. Must never appear in this band's read.
        65: { id: 65, state: 'IL', band: { id: 9 }, ...soon },
      },
    });

    let eventQueries = 0;
    const findMany = strapi.entityService.findMany.bind(strapi.entityService);
    strapi.entityService.findMany = async (uid, query) => {
      if (uid === 'api::event.event') eventQueries += 1;
      return findMany(uid, query);
    };

    const showMode = loadShowMode(strapi);
    const rows = await showMode.describeEventActivation(
      { id: 4, showModeTimezone: 'America/Los_Angeles' },
      [61, 62, 63, 64, 65, 61],
      { clientTimezone: 'Asia/Tokyo' }
    );

    assert.strictEqual(eventQueries, 1, 'five Events must cost one query, not five');
    assert.deepStrictEqual(rows.map((row) => row.eventId), [61, 62, 63, 64]);

    const byId = Object.fromEntries(rows.map((row) => [row.eventId, row]));
    assert.strictEqual(byId[61].timezone, chicago, 'venue zone outranks band default and browser');
    assert.strictEqual(byId[61].state, 'open');
    assert.strictEqual(byId[61].eligible, true);
    assert.ok(byId[61].opensAt && byId[61].closesAt, 'absolute instants reach the client');
    assert.strictEqual(byId[62].state, 'too_early');
    assert.strictEqual(byId[62].reason, 'event_activation_not_open');
    assert.strictEqual(byId[63].state, 'closed');
    assert.strictEqual(byId[64].state, 'no_time');
    assert.strictEqual(byId[64].eventStartsAt, null);

    assert.strictEqual(strapi.__updated.length, 0, 'a read model must never write');
    assert.strictEqual(
      (await showMode.describeEventActivation({ id: 4 }, [])).length,
      0
    );
  });

  await test('double submission cannot create two Event campaigns', async () => {
    const chicago = 'America/Chicago';
    const strapi = makeStrapi({
      bands: { 4: { id: 4, name: 'Burning Thunder', showModeStatus: 'off', showModeEnabled: false } },
    });
    const showMode = loadShowMode(strapi);
    const event = {
      id: 71,
      title: 'The Happy Room',
      venue: 'The Happy Room',
      city: 'Chicago',
      state: 'IL',
      band: { id: 4 },
      ...eventFieldsAt(new Date(Date.now() + 5 * 60 * 1000), chicago),
    };

    const first = await showMode.activateFromEvent(4, event, { timezone: chicago });
    assert.strictEqual(first.status, 'live');
    assert.ok(first.campaignId);

    const second = await showMode.activateFromEvent(4, event, { timezone: chicago });
    assert.strictEqual(second.error, 'already_live');
    assert.strictEqual(second.status, 409);
    assert.strictEqual(
      second.current.campaignId,
      first.campaignId,
      'the live session keeps its own campaign id'
    );
    assert.strictEqual(strapi.__bands[4].showModeCampaignId, first.campaignId);
    assert.strictEqual(strapi.__updated.length, 1, 'the second tap must not write');
  });

  await test('a live session conflict outranks an Event window refusal', async () => {
    const chicago = 'America/Chicago';
    const strapi = makeStrapi({
      bands: {
        4: {
          id: 4,
          name: 'Burning Thunder',
          showModeStatus: 'live',
          showModeEnabled: true,
          showModeCampaignId: 'show_existing',
          showModeEndsAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        },
      },
    });
    const showMode = loadShowMode(strapi);

    // The Event is historical, so the window would refuse it too. The 409 has
    // to win so the dashboard can offer "Manage Show Mode" instead.
    const result = await showMode.activateFromEvent(4, {
      id: 72,
      title: 'Last Month',
      state: 'IL',
      band: { id: 4 },
      ...eventFieldsAt(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), chicago),
    }, { timezone: chicago });

    assert.strictEqual(result.error, 'already_live');
    assert.strictEqual(result.status, 409);
    assert.strictEqual(result.current.campaignId, 'show_existing');
    assert.strictEqual(strapi.__bands[4].showModeCampaignId, 'show_existing');
    assert.strictEqual(strapi.__updated.length, 0);
  });

  await test('automatic expiry selects a due session and uses canonical deactivateShowMode', async () => {
    const due = {
      id: 8,
      name: 'Due Band',
      showModeStatus: 'live',
      showModeEnabled: true,
      showModeCampaignId: 'sm_due_1',
      showModeStartedAt: '2026-07-11T00:00:00.000Z',
      showModeEndsAt: '2026-07-11T02:30:00.000Z',
      showModePerformanceStartsAt: '2026-07-11T00:00:00.000Z',
      showModePerformanceEndsAt: '2026-07-11T02:30:00.000Z',
      showModeTimezone: 'America/New_York',
      showModeType: 'manual',
    };
    const strapi = makeStrapi({ bands: { 8: due } });
    const showMode = loadShowMode(strapi);
    const reasons = [];
    const original = showMode.deactivateShowMode.bind(showMode);
    showMode.deactivateShowMode = async (bandId, reason) => {
      reasons.push({ bandId, reason });
      return original(bandId, reason);
    };

    const result = await showMode.processExpiredShowModes();
    assert.strictEqual(result.deactivatedCount, 1);
    assert.strictEqual(reasons.length, 1);
    assert.strictEqual(reasons[0].bandId, 8);
    assert.ok(['performance_end', 'safety_expiry', 'auto'].includes(reasons[0].reason));
    assert.strictEqual(strapi.__bands[8].showModeStatus, 'off');
    assert.strictEqual(strapi.__bands[8].showModeLastCampaignId, 'sm_due_1');
    assert.strictEqual(strapi.__bands[8].showModeCampaignId, null);
    await flushAsync();
  });

  await test('automatic end archives campaign ID and queues recap', async () => {
    const due = {
      id: 9,
      name: 'Recap Band',
      showModeStatus: 'live',
      showModeEnabled: true,
      showModeCampaignId: 'sm_recap_1',
      showModeStartedAt: '2026-07-11T00:00:00.000Z',
      showModeEndsAt: '2000-01-01T00:00:00.000Z',
      showModePerformanceStartsAt: '2026-07-11T00:00:00.000Z',
      showModePerformanceEndsAt: '2026-07-11T02:30:00.000Z',
      showModeTimezone: 'America/New_York',
      showModeType: 'manual',
      showModeTitle: 'Late Night',
      showModeVenue: 'The Room',
    };
    const strapi = makeStrapi({ bands: { 9: due } });
    const showMode = loadShowMode(strapi);
    strapi.__recapsQueued.length = 0;
    await showMode.processExpiredShowModes();
    assert.strictEqual(strapi.__bands[9].showModeLastCampaignId, 'sm_recap_1');
    assert.strictEqual(strapi.__bands[9].showModeEnabled, false);
    await flushAsync();
    const queued = strapi.__recapsQueued.filter((row) => row.campaignId === 'sm_recap_1');
    assert.strictEqual(queued.length, 1);
    assert.strictEqual(queued[0].campaignId, 'sm_recap_1');
    assert.strictEqual(queued[0].showContext.performanceStartsAt, '2026-07-11T00:00:00.000Z');
    assert.strictEqual(queued[0].showContext.performanceEndsAt, '2026-07-11T02:30:00.000Z');
    await flushAsync();
  });

  await test('change/extend end succeeds and preserves campaign identity', async () => {
    const startedAt = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const currentEnd = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const nextEnd = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    const live = {
      id: 4,
      name: 'Burning Thunder',
      showModeStatus: 'live',
      showModeEnabled: true,
      showModeType: 'manual',
      showModeCampaignId: 'sm_live_keep',
      showModeStartedAt: startedAt,
      showModeEndsAt: currentEnd,
      showModePerformanceStartsAt: startedAt,
      showModePerformanceEndsAt: currentEnd,
      showModeTimezone: 'America/New_York',
      showModeEventId: null,
    };
    const strapi = makeStrapi({ bands: { 4: live } });
    const showMode = loadShowMode(strapi);
    const result = await showMode.updateShowModeTiming(4, {
      performanceEndsAt: nextEnd,
    });
    assert.strictEqual(result.error, undefined);
    assert.strictEqual(result.campaignId, 'sm_live_keep');
    assert.strictEqual(new Date(result.performanceEndsAt).toISOString(), nextEnd);
    assert.strictEqual(strapi.__bands[4].showModeCampaignId, 'sm_live_keep');
    assert.strictEqual(strapi.__bands[4].showModeStatus, 'live');
    assert.strictEqual(strapi.__createdRecaps.length, 0);
    assert.ok(!strapi.__updated.some((row) => row.uid === 'api::event.event'));
  });

  await test('invalid extension is rejected and Turn Off still works', async () => {
    const startedAt = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const currentEnd = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const live = {
      id: 4,
      name: 'Burning Thunder',
      showModeStatus: 'live',
      showModeEnabled: true,
      showModeType: 'manual',
      showModeCampaignId: 'sm_live_off',
      showModeStartedAt: startedAt,
      showModeEndsAt: currentEnd,
      showModePerformanceStartsAt: startedAt,
      showModePerformanceEndsAt: currentEnd,
      showModeTimezone: 'America/New_York',
    };
    const strapi = makeStrapi({ bands: { 4: live } });
    const showMode = loadShowMode(strapi);
    const invalid = await showMode.updateShowModeTiming(4, {
      performanceEndsAt: '2026-07-10T20:00:00.000Z',
    });
    assert.strictEqual(invalid.error, 'invalid_range');
    assert.strictEqual(strapi.__bands[4].showModeCampaignId, 'sm_live_off');

    const off = await showMode.deactivateShowMode(4, 'manual');
    assert.strictEqual(off.status, 'off');
    assert.strictEqual(off.campaignId, 'sm_live_off');
    assert.strictEqual(off.reason, 'manual');
    assert.strictEqual(strapi.__bands[4].showModeLastDeactivationReason, 'manual');
    assert.strictEqual(strapi.__bands[4].showModeLastCampaignId, 'sm_live_off');
    await flushAsync();
  });

  await test('status API contains new fields without dropping legacy fields', () => {
    const strapi = makeStrapi();
    const showMode = loadShowMode(strapi);
    const status = showMode.getShowModeStatus({
      showModeStatus: 'live',
      showModeEnabled: true,
      showModeType: 'manual',
      showModeTitle: 'Album Night',
      showModeVenue: 'The Basement East',
      showModeCity: 'Nashville',
      showModeTimezone: 'America/Chicago',
      showModeCampaignId: 'sm_status',
      showModeStartedAt: '2026-07-11T00:00:00.000Z',
      showModeEndsAt: '2026-07-11T02:30:00.000Z',
      showModeActivatedAt: '2026-07-11T00:00:00.000Z',
      showModePerformanceStartsAt: '2026-07-11T00:00:00.000Z',
      showModePerformanceEndsAt: '2026-07-11T02:30:00.000Z',
      showModeLastDeactivationReason: null,
    });
    assert.strictEqual(status.status, 'live');
    assert.strictEqual(status.enabled, true);
    assert.strictEqual(status.active, false);
    assert.strictEqual(status.startedAt, '2026-07-11T00:00:00.000Z');
    assert.strictEqual(status.endsAt, '2026-07-11T02:30:00.000Z');
    assert.strictEqual(status.effectiveEndsAt, '2026-07-11T02:30:00.000Z');
    assert.strictEqual(status.performanceStartsAt, '2026-07-11T00:00:00.000Z');
    assert.strictEqual(status.performanceEndsAt, '2026-07-11T02:30:00.000Z');
    assert.strictEqual(status.timezone, 'America/Chicago');
    assert.strictEqual(status.campaignId, 'sm_status');
    assert.strictEqual(status.title, 'Album Night');
  });

  await test('recap snapshot and regeneration preserve performance timing', () => {
    const recapSrc = fs.readFileSync(path.join(__dirname, '../src/api/show-recap/services/show-recap.js'), 'utf8');
    assert.match(recapSrc, /performanceStartsAt/);
    assert.match(recapSrc, /performanceEndsAt/);
    assert.match(recapSrc, /resolveRecapPerformanceTiming/);
    assert.match(recapSrc, /withReadTimePerformanceTiming/);

    const first = showTime.resolveRecapPerformanceTiming({
      snapshot: {
        performanceStartsAt: '2026-07-11T00:00:00.000Z',
        performanceEndsAt: '2026-07-11T02:30:00.000Z',
        showStartedAt: '2026-07-11T00:05:00.000Z',
        showEndedAt: '2026-07-11T02:40:00.000Z',
      },
    });
    assert.strictEqual(first.performanceStartsAt, '2026-07-11T00:00:00.000Z');
    assert.strictEqual(first.performanceEndsAt, '2026-07-11T02:30:00.000Z');

    const regen = showTime.resolveRecapPerformanceTiming({
      snapshot: { performanceStartsAt: null, performanceEndsAt: null, showEndedAt: '2026-07-11T03:00:00.000Z' },
      stored: first,
    });
    assert.strictEqual(regen.performanceStartsAt, '2026-07-11T00:00:00.000Z');
    assert.strictEqual(regen.performanceEndsAt, '2026-07-11T02:30:00.000Z');

    const legacy = showTime.withReadTimePerformanceTiming({
      id: 3,
      campaignId: 'sm_old',
      showStartedAt: '2026-01-01T01:00:00.000Z',
      showEndedAt: '2026-01-01T06:00:00.000Z',
    });
    assert.strictEqual(legacy.performanceStartsAt, '2026-01-01T01:00:00.000Z');
    assert.strictEqual(legacy.showStartedAt, '2026-01-01T01:00:00.000Z');
  });

  await test('schemas add nullable timing fields without renaming old ones', () => {
    const band = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/api/band/content-types/band/schema.json'), 'utf8'));
    const recap = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/api/show-recap/content-types/show-recap/schema.json'), 'utf8'));
    assert.strictEqual(band.attributes.showModeStartedAt.type, 'datetime');
    assert.strictEqual(band.attributes.showModeEndsAt.type, 'datetime');
    assert.strictEqual(band.attributes.showModePerformanceStartsAt.type, 'datetime');
    assert.strictEqual(band.attributes.showModePerformanceEndsAt.type, 'datetime');
    assert.ok(!band.attributes.showModePerformanceStartsAt.required);
    assert.strictEqual(recap.attributes.showStartedAt.type, 'datetime');
    assert.strictEqual(recap.attributes.showEndedAt.type, 'datetime');
    assert.strictEqual(recap.attributes.performanceStartsAt.type, 'datetime');
    assert.strictEqual(recap.attributes.performanceEndsAt.type, 'datetime');
    assert.ok(!recap.attributes.performanceStartsAt.required);
  });

  await test('timing helpers remain require-safe', () => {
    require('../src/utils/showTime');
    require('../src/api/band/routes/show-mode');
    require('../src/api/band/controllers/show-mode');
    assert.strictEqual(typeof showTime.resolveShowPerformanceTiming, 'function');
    assert.strictEqual(typeof showTime.resolveExpiryReason, 'function');
  });

  await flushAsync();
  global.strapi = previousGlobal;

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
  if (failed) process.exitCode = 1;
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
