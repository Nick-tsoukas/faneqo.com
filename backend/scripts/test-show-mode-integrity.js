'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const integrity = require('../src/utils/showMode/showModeIntegrityPure');
const recapWrite = require('../src/utils/showMode/recapWritePure');
const showTime = require('../src/utils/showTime');

process.env.TZ = 'UTC';

let passed = 0;
let failed = 0;

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

function offBand(id, extra = {}) {
  return {
    id,
    name: extra.name || `Band ${id}`,
    showModeStatus: 'off',
    showModeEnabled: false,
    showModeCampaignId: null,
    ...extra,
  };
}

function makeStrapi({ bands = {}, events = {}, attendances = [] } = {}) {
  const updated = [];
  const createdEvents = [];
  const createdRecaps = [];
  const updatedRecaps = [];
  const recaps = [];
  let queryUpdateCalls = 0;

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
        if (uid === 'api::band.band') return Object.values(bands);
        if (uid === 'api::show-recap.show-recap') {
          const campaignId = query.filters?.campaignId;
          return recaps.filter((row) => !campaignId || row.campaignId === campaignId);
        }
        if (uid === 'api::fan.fan' || uid === 'api::fan-interaction.fan-interaction') return [];
        if (uid === 'api::fan-show-attendance.fan-show-attendance') {
          const campaignId = query.filters?.campaignId;
          return attendances.filter((row) => !campaignId || row.campaignId === campaignId);
        }
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
        if (uid === 'api::event.event') {
          const row = { id: createdEvents.length + 90, ...data };
          createdEvents.push(row);
          events[row.id] = row;
          return row;
        }
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
    db: {
      query() {
        return {
          async update({ where, data }) {
            queryUpdateCalls += 1;
            const id = where.id;
            const current = bands[Number(id)] || bands[id];
            if (!integrity.rowAllowsLiveClaim(current)) return null;
            const next = { ...current, ...data };
            bands[Number(id)] = next;
            updated.push({ uid: 'api::band.band', id, data, method: 'conditional' });
            return next;
          },
        };
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
    __createdEvents: createdEvents,
    __createdRecaps: createdRecaps,
    __updatedRecaps: updatedRecaps,
    __recaps: recaps,
    __bands: bands,
    __queryUpdateCalls: () => queryUpdateCalls,
  };

  return strapi;
}

function loadShowMode(strapi) {
  delete require.cache[require.resolve('../src/api/band/services/showMode')];
  global.strapi = strapi;
  return require('../src/api/band/services/showMode');
}

function loadRecapService(strapi) {
  const Module = require('module');
  const originalLoad = Module._load;
  Module._load = function interceptStrapi(request, parent, isMain) {
    if (request === '@strapi/strapi') {
      return {
        factories: {
          createCoreService: (_uid, fn) => fn,
        },
      };
    }
    return originalLoad.apply(this, arguments);
  };

  const recapPath = require.resolve('../src/api/show-recap/services/show-recap');
  delete require.cache[recapPath];
  global.strapi = strapi;
  try {
    const factory = require(recapPath);
    return factory({ strapi });
  } finally {
    Module._load = originalLoad;
  }
}

async function flushAsync() {
  await new Promise((resolve) => setImmediate(resolve));
  await new Promise((resolve) => setImmediate(resolve));
}

function assertAlreadyLive(result, originalCampaignId) {
  assert.strictEqual(result.error, 'already_live');
  assert.strictEqual(result.status, 409);
  assert.strictEqual(result.message, 'Show Mode is already active.');
  assert.ok(result.current);
  assert.strictEqual(result.current.status, 'live');
  assert.strictEqual(result.current.enabled, true);
  if (originalCampaignId) {
    assert.strictEqual(result.current.campaignId, originalCampaignId);
  }
}

(async () => {
  console.log('\n=== Show Mode integrity slice 1.1 ===\n');

  const previousGlobal = global.strapi;

  await test('1. manual activation while off succeeds', async () => {
    const strapi = makeStrapi({ bands: { 4: offBand(4, { name: 'Burning Thunder' }) } });
    const showMode = loadShowMode(strapi);
    const result = await showMode.activateManualShowMode(4, {
      title: 'Album Night',
      venue: 'The Basement East',
      city: 'Nashville',
      timezone: 'America/Chicago',
    });
    assert.strictEqual(result.status, 'live');
    assert.ok(result.campaignId.startsWith('sm_'));
    assert.strictEqual(strapi.__bands[4].showModeCampaignId, result.campaignId);
  });

  await test('2-6. second manual activation while live is already_live and preserves night', async () => {
    // Manual activation rejects a performance start more than 24 hours in the
    // past, so this fixture tracks the clock instead of pinning a date that
    // quietly ages out.
    const start = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const end = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const strapi = makeStrapi({ bands: { 4: offBand(4, { name: 'Burning Thunder' }) } });
    const showMode = loadShowMode(strapi);
    const first = await showMode.activateManualShowMode(4, {
      title: 'Album Night',
      venue: 'The Basement East',
      city: 'Nashville',
      timezone: 'America/Chicago',
      performanceStartsAt: start,
      performanceEndsAt: end,
    });
    assert.strictEqual(first.status, 'live');
    const campaignId = first.campaignId;
    const writesBefore = strapi.__updated.length;
    const eventsBefore = strapi.__createdEvents.length;
    const recapsBefore = strapi.__recapsQueued.length;

    const second = await showMode.activateManualShowMode(4, {
      title: 'Replacement Night',
      venue: 'Somewhere Else',
      city: 'Austin',
      timezone: 'America/Chicago',
      coverMediaId: 88,
    });
    assertAlreadyLive(second, campaignId);
    assert.strictEqual(strapi.__bands[4].showModeCampaignId, campaignId);
    assert.strictEqual(strapi.__bands[4].showModeTitle, 'Album Night');
    assert.strictEqual(new Date(strapi.__bands[4].showModePerformanceStartsAt).toISOString(), start);
    assert.strictEqual(new Date(strapi.__bands[4].showModePerformanceEndsAt).toISOString(), end);
    assert.strictEqual(strapi.__createdEvents.length, eventsBefore);
    assert.strictEqual(strapi.__recapsQueued.length, recapsBefore);
    assert.strictEqual(strapi.__updated.length, writesBefore);
  });

  await test('7. Event-backed activation while live uses the same conflict contract', async () => {
    const strapi = makeStrapi({ bands: { 4: offBand(4, { name: 'Burning Thunder' }) } });
    const showMode = loadShowMode(strapi);
    const first = await showMode.activateManualShowMode(4, { timezone: 'America/Chicago' });
    const conflict = await showMode.activateFromEvent(4, {
      id: 11,
      title: 'The Happy Room',
      venue: 'The Happy Room',
      city: 'Chicago',
      state: 'IL',
      date: '2026-09-05',
      time: '20:00:00.000',
      band: { id: 4 },
    }, { timezone: 'America/Chicago' });
    assertAlreadyLive(conflict, first.campaignId);
    assert.strictEqual(strapi.__bands[4].showModeCampaignId, first.campaignId);
    assert.strictEqual(strapi.__bands[4].showModeType, 'manual');
    assert.strictEqual(strapi.__bands[4].showModeEventId, null);
  });

  await test('8. leftover production-capable writers cannot replace a live campaign', async () => {
    const strapi = makeStrapi({ bands: { 4: offBand(4) } });
    const showMode = loadShowMode(strapi);
    const first = await showMode.activateManualShowMode(4, { timezone: 'America/Chicago' });

    const auto = await showMode.activateEventShowMode(4, {
      id: 22,
      title: 'Auto Night',
      venue: 'Club',
      city: 'Chicago',
      date: '2026-09-06',
      time: '21:00:00.000',
    }, 'America/Chicago');
    assertAlreadyLive(auto, first.campaignId);

    const scheduled = await showMode.scheduleEventShowMode(4, {
      id: 23,
      title: 'Scheduled Night',
      venue: 'Hall',
      city: 'Chicago',
      date: '2026-09-07',
      time: '21:00:00.000',
    }, 'America/Chicago');
    assertAlreadyLive(scheduled, first.campaignId);

    const promote = await showMode.activateScheduledShowMode(4);
    assertAlreadyLive(promote, first.campaignId);
    assert.strictEqual(strapi.__bands[4].showModeCampaignId, first.campaignId);
  });

  await test('9. manual activation after a proper deactivation creates a new campaign', async () => {
    const strapi = makeStrapi({ bands: { 4: offBand(4, { name: 'Burning Thunder' }) } });
    const showMode = loadShowMode(strapi);
    const first = await showMode.activateManualShowMode(4, {
      title: 'Night One',
      timezone: 'America/Chicago',
    });
    const off = await showMode.deactivateShowMode(4, 'manual');
    assert.strictEqual(off.status, 'off');
    await flushAsync();
    const second = await showMode.activateManualShowMode(4, {
      title: 'Night Two',
      timezone: 'America/Chicago',
    });
    assert.strictEqual(second.status, 'live');
    assert.ok(second.campaignId);
    assert.notStrictEqual(second.campaignId, first.campaignId);
    assert.strictEqual(strapi.__bands[4].showModeCampaignId, second.campaignId);
    assert.strictEqual(strapi.__bands[4].showModeLastCampaignId, first.campaignId);
  });

  await test('10. extend-end remains allowed while live and preserves campaignId', async () => {
    const start = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const currentEnd = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const nextEnd = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    const strapi = makeStrapi({
      bands: {
        4: {
          id: 4,
          name: 'Burning Thunder',
          showModeStatus: 'live',
          showModeEnabled: true,
          showModeType: 'manual',
          showModeCampaignId: 'sm_live_keep',
          showModeStartedAt: start,
          showModeEndsAt: currentEnd,
          showModePerformanceStartsAt: start,
          showModePerformanceEndsAt: currentEnd,
          showModeTimezone: 'America/Chicago',
        },
      },
    });
    const showMode = loadShowMode(strapi);
    const result = await showMode.updateShowModeTiming(4, { performanceEndsAt: nextEnd });
    assert.strictEqual(result.error, undefined);
    assert.strictEqual(result.campaignId, 'sm_live_keep');
    assert.strictEqual(strapi.__bands[4].showModeCampaignId, 'sm_live_keep');
  });

  await test('11. Turn Off remains allowed', async () => {
    const strapi = makeStrapi({ bands: { 4: offBand(4) } });
    const showMode = loadShowMode(strapi);
    await showMode.activateManualShowMode(4, { timezone: 'America/Chicago' });
    const off = await showMode.deactivateShowMode(4, 'manual');
    assert.strictEqual(off.status, 'off');
    assert.strictEqual(strapi.__bands[4].showModeEnabled, false);
    assert.strictEqual(strapi.__bands[4].showModeStatus, 'off');
    await flushAsync();
  });

  await test('12. ordinary repeated activation cannot orphan the previous campaign', async () => {
    const strapi = makeStrapi({ bands: { 4: offBand(4) } });
    const showMode = loadShowMode(strapi);
    const first = await showMode.activateManualShowMode(4, { timezone: 'America/Chicago' });
    await showMode.activateManualShowMode(4, { timezone: 'America/Chicago' });
    await showMode.activateManualShowMode(4, { timezone: 'America/Chicago' });
    assert.strictEqual(strapi.__bands[4].showModeCampaignId, first.campaignId);
    assert.strictEqual(strapi.__bands[4].showModeLastCampaignId, undefined);
    assert.ok(!strapi.__recapsQueued.some((row) => row.campaignId !== first.campaignId));
  });

  await test('13. sequential double-submit uses refuseIfLive; conditional claim rejects the loser', async () => {
    const strapi = makeStrapi({ bands: { 4: offBand(4) } });
    const showMode = loadShowMode(strapi);
    const first = await showMode.activateManualShowMode(4, { timezone: 'America/Chicago' });
    const second = await showMode.activateManualShowMode(4, { timezone: 'America/Chicago' });
    assertAlreadyLive(second, first.campaignId);
    assert.ok(strapi.__queryUpdateCalls() >= 1);

    const raceBand = offBand(8);
    const raceStrapi = makeStrapi({ bands: { 8: raceBand } });
    const raceMode = loadShowMode(raceStrapi);
    let claims = 0;
    raceStrapi.db.query = () => ({
      async update({ where, data }) {
        claims += 1;
        const current = raceStrapi.__bands[8];
        if (claims === 1 && integrity.rowAllowsLiveClaim(current)) {
          const next = { ...current, ...data };
          raceStrapi.__bands[8] = next;
          return next;
        }
        return null;
      },
    });
    const winner = await raceMode.activateManualShowMode(8, { timezone: 'America/Chicago' });
    assert.strictEqual(winner.status, 'live');
    const loser = await raceMode.persistLiveSession(8, {
      showModeStatus: 'live',
      showModeEnabled: true,
      showModeCampaignId: 'sm_should_not_win',
    });
    assert.strictEqual(loser.error, 'already_live');
    assert.strictEqual(raceStrapi.__bands[8].showModeCampaignId, winner.campaignId);
  });

  await test('14-16. immediate recap snapshot has full identity and timing', async () => {
    // See 2-6: a pinned performance start ages past the 24-hour cap.
    const performanceStartsAt = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const performanceEndsAt = new Date(Date.now() + 90 * 60 * 1000).toISOString();
    const strapi = makeStrapi({ bands: { 4: offBand(4, { name: 'Burning Thunder' }) } });
    const showMode = loadShowMode(strapi);
    await showMode.activateManualShowMode(4, {
      title: 'Album Night',
      venue: 'The Basement East',
      city: 'Nashville',
      region: 'TN',
      country: 'US',
      timezone: 'America/Chicago',
      performanceStartsAt,
      performanceEndsAt,
    });
    await showMode.deactivateShowMode(4, 'manual');
    await flushAsync();
    const queued = strapi.__recapsQueued[0];
    assert.ok(queued);
    assert.ok(queued.campaignId);
    assert.strictEqual(queued.showContext.title, 'Album Night');
    assert.strictEqual(queued.showContext.venue, 'The Basement East');
    assert.strictEqual(queued.showContext.city, 'Nashville');
    assert.strictEqual(queued.showContext.region, 'TN');
    assert.strictEqual(queued.showContext.country, 'US');
    assert.strictEqual(queued.showContext.timezone, 'America/Chicago');
    assert.strictEqual(queued.showContext.showModeType, 'manual');
    assert.strictEqual(queued.showContext.eventId, null);
    assert.strictEqual(queued.showContext.performanceStartsAt, performanceStartsAt);
    assert.strictEqual(queued.showContext.performanceEndsAt, performanceEndsAt);
    assert.ok(queued.showContext.showStartedAt);
    assert.ok(queued.showContext.showEndedAt);
    assert.strictEqual(queued.showContext.campaignId, queued.campaignId);
    assert.deepStrictEqual(
      strapi.__bands[4].showModeLastContext,
      queued.showContext
    );
  });

  await test('15-19. recovery reconstructs the same night identity as the immediate snapshot', async () => {
    const lastContext = {
      campaignId: 'sm_manual_1',
      showModeType: 'manual',
      showStartedAt: '2026-09-05T01:05:00.000Z',
      showEndedAt: '2026-09-05T03:40:00.000Z',
      eventId: null,
      title: 'Album Night',
      venue: 'The Basement East',
      city: 'Nashville',
      region: 'TN',
      country: 'US',
      timezone: 'America/Chicago',
      performanceStartsAt: '2026-09-05T01:00:00.000Z',
      performanceEndsAt: '2026-09-05T03:30:00.000Z',
    };
    const recovered = integrity.recoveryShowContext({
      showModeEndedAt: '2026-09-05T03:40:00.000Z',
      showModeLastCampaignId: 'sm_manual_1',
      showModeLastContext: lastContext,
    }, 'sm_manual_1');
    assert.strictEqual(recovered.title, 'Album Night');
    assert.strictEqual(recovered.venue, 'The Basement East');
    assert.strictEqual(recovered.timezone, 'America/Chicago');
    assert.strictEqual(recovered.performanceStartsAt, '2026-09-05T01:00:00.000Z');
    assert.strictEqual(recovered.performanceEndsAt, '2026-09-05T03:30:00.000Z');
    assert.strictEqual(recovered.eventId, null);
    assert.strictEqual(recovered.showModeType, 'manual');

    const eventContext = integrity.recoveryShowContext({
      showModeLastCampaignId: 'sm_event_1',
      showModeLastContext: {
        ...lastContext,
        campaignId: 'sm_event_1',
        showModeType: 'event',
        eventId: 11,
        title: 'The Happy Room',
        venue: 'The Happy Room',
        city: 'Chicago',
      },
    }, 'sm_event_1');
    assert.strictEqual(eventContext.eventId, 11);
    assert.strictEqual(eventContext.showModeType, 'event');
    assert.strictEqual(eventContext.title, 'The Happy Room');

    const otherNight = integrity.recoveryShowContext({
      showModeLastCampaignId: 'sm_event_1',
      showModeLastContext: { ...lastContext, campaignId: 'sm_event_1' },
    }, 'sm_old_other');
    assert.strictEqual(otherNight.title, undefined);
    assert.ok(!otherNight.eventId);
    assert.ok(!otherNight.performanceStartsAt);
  });

  await test('14+15 generateShowRecap immediate and recovery write equivalent identity', async () => {
    const snapshot = {
      campaignId: 'sm_parity_1',
      showModeType: 'manual',
      showStartedAt: '2026-09-05T01:05:00.000Z',
      showEndedAt: '2026-09-05T03:40:00.000Z',
      eventId: null,
      title: 'Album Night',
      venue: 'The Basement East',
      city: 'Nashville',
      region: 'TN',
      country: 'US',
      timezone: 'America/Chicago',
      performanceStartsAt: '2026-09-05T01:00:00.000Z',
      performanceEndsAt: '2026-09-05T03:30:00.000Z',
    };
    const immediateStrapi = makeStrapi({
      bands: { 4: { id: 4, name: 'Burning Thunder', showModeType: null } },
    });
    const immediate = loadRecapService(immediateStrapi);
    const immediateRecap = await immediate.generateShowRecap({
      bandId: 4,
      campaignId: 'sm_parity_1',
      showContext: snapshot,
    });

    const recoveryStrapi = makeStrapi({
      bands: {
        4: {
          id: 4,
          name: 'Burning Thunder',
          showModeStatus: 'off',
          showModeLastCampaignId: 'sm_parity_1',
          showModeEndedAt: snapshot.showEndedAt,
          showModeLastContext: snapshot,
        },
      },
    });
    const recovery = loadRecapService(recoveryStrapi);
    const recoveryRecap = await recovery.generateShowRecap({
      bandId: 4,
      campaignId: 'sm_parity_1',
      showContext: integrity.recoveryShowContext(recoveryStrapi.__bands[4], 'sm_parity_1'),
    });

    for (const field of [
      'campaignId', 'eventId', 'showModeType', 'showTitle', 'venue', 'city',
      'region', 'country', 'timezone', 'showStartedAt', 'showEndedAt',
      'performanceStartsAt', 'performanceEndsAt',
    ]) {
      assert.strictEqual(recoveryRecap[field], immediateRecap[field], field);
    }
  });

  await test('20. regeneration does not null good identity or timing', async () => {
    const previous = {
      id: 3,
      campaignId: 'sm_old',
      eventId: 11,
      showTitle: 'Kept Title',
      venue: 'Kept Venue',
      city: 'Chicago',
      region: 'IL',
      country: 'US',
      timezone: 'America/Chicago',
      showModeType: 'event',
      showStartedAt: '2026-09-05T01:00:00.000Z',
      showEndedAt: '2026-09-05T03:00:00.000Z',
      performanceStartsAt: '2026-09-05T01:00:00.000Z',
      performanceEndsAt: '2026-09-05T03:00:00.000Z',
      metadata: { artistDraft: 'do not erase', generatedBy: 'old' },
    };
    const strapi = makeStrapi({
      bands: { 4: { id: 4, name: 'Burning Thunder' } },
    });
    strapi.__recaps.push(previous);
    const service = loadRecapService(strapi);
    const updated = await service.generateShowRecap({
      bandId: 4,
      campaignId: 'sm_old',
      showContext: { showEndedAt: '2026-09-05T04:00:00.000Z' },
    });
    assert.strictEqual(updated.showTitle, 'Kept Title');
    assert.strictEqual(updated.venue, 'Kept Venue');
    assert.strictEqual(updated.timezone, 'America/Chicago');
    assert.strictEqual(updated.performanceStartsAt, '2026-09-05T01:00:00.000Z');
    assert.strictEqual(updated.eventId, 11);
  });

  await test('21. recap update/create strips future artist-authored fields and keeps unknown metadata', () => {
    const previous = {
      publicStory: 'artist story',
      privateArtistNote: 'private',
      lineup: [{ name: 'Guest' }],
      coverShareIdentity: { title: 'Share' },
      metadata: { artistDraft: 'keep me', generatedBy: 'old' },
    };
    const recapData = {
      showTitle: 'System title',
      publicStory: 'should not write',
      privateArtistNote: null,
      lineup: [],
      coverShareIdentity: {},
      metadata: { generatedBy: 'show-recap-engine-v1', bandName: 'Burning Thunder' },
    };
    const written = recapWrite.buildRecapUpdateData({ recapData, previous });
    assert.ok(!Object.prototype.hasOwnProperty.call(written, 'publicStory'));
    assert.ok(!Object.prototype.hasOwnProperty.call(written, 'privateArtistNote'));
    assert.ok(!Object.prototype.hasOwnProperty.call(written, 'lineup'));
    assert.ok(!Object.prototype.hasOwnProperty.call(written, 'coverShareIdentity'));
    assert.strictEqual(written.metadata.artistDraft, 'keep me');
    assert.strictEqual(written.metadata.generatedBy, 'show-recap-engine-v1');
    assert.strictEqual(recapWrite.artistAuthoredKeysPresent(written).length, 0);

    const created = recapWrite.stripArtistAuthoredFields({
      ...recapData,
      publicStory: 'nope',
    });
    assert.ok(!Object.prototype.hasOwnProperty.call(created, 'publicStory'));
  });

  await test('22. old ShowRecap remains readable via session-time fallback', () => {
    const legacy = showTime.withReadTimePerformanceTiming({
      id: 3,
      campaignId: 'sm_legacy',
      showStartedAt: '2026-01-01T01:00:00.000Z',
      showEndedAt: '2026-01-01T06:00:00.000Z',
    });
    assert.strictEqual(legacy.performanceStartsAt, '2026-01-01T01:00:00.000Z');
    assert.strictEqual(legacy.performanceEndsAt, '2026-01-01T06:00:00.000Z');
    assert.strictEqual(legacy.showStartedAt, '2026-01-01T01:00:00.000Z');
  });

  await test('23. current frontend activation body still works while Show Mode is off', async () => {
    const strapi = makeStrapi({ bands: { 4: offBand(4, { name: 'Burning Thunder' }) } });
    const showMode = loadShowMode(strapi);
    const result = await showMode.activateManualShowMode(4, {
      timezone: 'America/Chicago',
    });
    assert.strictEqual(result.status, 'live');
    assert.ok(result.campaignId);
    assert.ok(result.endsAt);
  });

  await test('24. backend boot/module sanity and conflict contract on controllers', () => {
    require('../src/utils/showMode/showModeIntegrityPure');
    require('../src/utils/showMode/recapWritePure');
    require('../src/utils/showMode/eventActivationPure');
    require('../src/api/band/routes/show-mode');
    require('../src/api/band/controllers/show-mode');
    require('../src/api/band/services/showMode');

    const controllerSrc = fs.readFileSync(path.join(__dirname, '../src/api/band/controllers/show-mode.js'), 'utf8');
    assert.match(controllerSrc, /name: result\.error/);
    assert.match(controllerSrc, /current: result\.current \|\| null/);
    assert.match(controllerSrc, /refuseIfLive/);

    const band = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/api/band/content-types/band/schema.json'), 'utf8'));
    assert.strictEqual(band.attributes.showModeLastContext.type, 'json');
    assert.ok(!band.attributes.showModeLastContext.required);

    const recap = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/api/show-recap/content-types/show-recap/schema.json'), 'utf8'));
    assert.strictEqual(recap.attributes.publicStory.type, 'text');
    assert.strictEqual(recap.attributes.privateArtistNote.type, 'text');
    assert.strictEqual(recap.attributes.lineup.type, 'json');
    assert.strictEqual(recap.attributes.nightSlug.type, 'string');
    assert.strictEqual(recap.attributes.coverImage.type, 'media');
    assert.strictEqual(recap.attributes.heroImage.type, 'media');
    assert.deepStrictEqual(recap.attributes.heroImage.allowedTypes, ['images']);
    assert.strictEqual(recap.attributes.heroFocalX.type, 'decimal');
    assert.strictEqual(recap.attributes.heroFocalY.type, 'decimal');
    assert.ok(!recap.attributes.publicStory.required);
    assert.ok(!recap.attributes.nightSlug.unique);

    assert.strictEqual(integrity.showModeAlreadyLive({
      showModeEnabled: true,
      showModeStatus: 'live',
    }), true);
    const conflict = integrity.alreadyLiveConflict({ status: 'live', campaignId: 'sm_x' });
    assert.strictEqual(conflict.error, 'already_live');
    assert.strictEqual(conflict.status, 409);
  });

  await test('findCampaignsNeedingRecap supplies lastContext, not only showEndedAt', async () => {
    const lastContext = {
      campaignId: 'sm_recover_me',
      title: 'Late Recap',
      venue: 'Room',
      city: 'Nashville',
      timezone: 'America/Chicago',
      performanceStartsAt: '2026-09-05T01:00:00.000Z',
      performanceEndsAt: '2026-09-05T03:00:00.000Z',
      showModeType: 'manual',
      eventId: null,
    };
    const strapi = makeStrapi({
      bands: {
        9: {
          id: 9,
          name: 'Late Band',
          showModeStatus: 'off',
          showModeEnabled: false,
          showModeCampaignId: null,
          showModeLastCampaignId: 'sm_recover_me',
          showModeEndedAt: '2026-09-05T03:10:00.000Z',
          showModeLastContext: lastContext,
        },
      },
    });
    const service = loadRecapService(strapi);
    const needing = await service.findCampaignsNeedingRecap();
    assert.strictEqual(needing.length, 1);
    assert.strictEqual(needing[0].campaignId, 'sm_recover_me');
    assert.strictEqual(needing[0].showContext.title, 'Late Recap');
    assert.strictEqual(needing[0].showContext.performanceStartsAt, '2026-09-05T01:00:00.000Z');
    assert.strictEqual(needing[0].showContext.timezone, 'America/Chicago');
  });

  await flushAsync();
  global.strapi = previousGlobal;

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
  if (failed) process.exitCode = 1;
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
