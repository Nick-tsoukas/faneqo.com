'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const night = require('../src/utils/showMode/nightEnrichmentPure');
const recapWrite = require('../src/utils/showMode/recapWritePure');
const integrity = require('../src/utils/showMode/showModeIntegrityPure');

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

function makeStrapi({
  bands = {},
  recaps = [],
  members = [],
  files = {},
  events = {},
} = {}) {
  const updatedRecaps = [];
  const createdRecaps = [];
  const createdEvents = [];
  const updatedBands = [];

  const strapi = {
    log: { info() {}, warn() {}, error() {} },
    entityService: {
      async findOne(uid, id) {
        if (uid === 'api::band.band') {
          const row = bands[Number(id)] || bands[id] || null;
          return row;
        }
        if (uid === 'api::show-recap.show-recap') {
          return recaps.find((row) => Number(row.id) === Number(id)) || null;
        }
        if (uid === 'plugin::upload.file') return files[Number(id)] || files[id] || null;
        if (uid === 'api::event.event') return events[Number(id)] || events[id] || null;
        return null;
      },
      async findMany(uid, query = {}) {
        if (uid === 'api::band-member.band-member') {
          const filters = query.filters || {};
          return members.filter((row) => {
            if (filters.band && Number(row.band) !== Number(filters.band)) return false;
            if (filters.user && Number(row.user) !== Number(filters.user)) return false;
            if (filters.status && row.status !== filters.status) return false;
            return true;
          }).slice(0, query.limit || 100);
        }
        if (uid === 'api::show-recap.show-recap') {
          const filters = query.filters || {};
          return recaps.filter((row) => {
            if (filters.campaignId && row.campaignId !== filters.campaignId) return false;
            if (filters.nightSlug && row.nightSlug !== filters.nightSlug) return false;
            if (filters.band && Number(row.band?.id || row.band) !== Number(filters.band)) return false;
            return true;
          });
        }
        if (uid === 'api::fan.fan' || uid === 'api::fan-interaction.fan-interaction') return [];
        if (uid === 'api::fan-show-attendance.fan-show-attendance') return [];
        return [];
      },
      async update(uid, id, { data }) {
        if (uid === 'api::show-recap.show-recap') {
          const current = recaps.find((row) => Number(row.id) === Number(id));
          Object.assign(current, data);
          if (data.coverImage === null) current.coverImage = null;
          if (data.coverImage && typeof data.coverImage === 'number') {
            current.coverImage = files[data.coverImage] || { id: data.coverImage };
          }
          if (data.heroImage === null) current.heroImage = null;
          if (data.heroImage && typeof data.heroImage === 'number') {
            current.heroImage = files[data.heroImage] || { id: data.heroImage };
          }
          updatedRecaps.push({ id, data });
          return current;
        }
        if (uid === 'api::band.band') {
          const current = bands[Number(id)] || { id };
          const next = { ...current, ...data };
          bands[Number(id)] = next;
          updatedBands.push({ id, data });
          return next;
        }
        return { id, ...data };
      },
      async create(uid, { data }) {
        if (uid === 'api::show-recap.show-recap') {
          const row = { id: recaps.length + 1, ...data };
          if (data.coverImage && typeof data.coverImage === 'number') {
            row.coverImage = files[data.coverImage] || { id: data.coverImage };
          }
          if (data.heroImage && typeof data.heroImage === 'number') {
            row.heroImage = files[data.heroImage] || { id: data.heroImage };
          }
          recaps.push(row);
          createdRecaps.push(row);
          return row;
        }
        if (uid === 'api::event.event') {
          const row = { id: createdEvents.length + 90, ...data };
          createdEvents.push(row);
          return row;
        }
        if (uid === 'api::band-member.band-member') {
          members.push({ id: members.length + 1, ...data });
          return members[members.length - 1];
        }
        return { id: 1, ...data };
      },
      async count() {
        return recaps.length;
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
    __updatedRecaps: updatedRecaps,
    __createdRecaps: createdRecaps,
    __createdEvents: createdEvents,
    __updatedBands: updatedBands,
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

function loadRecapService(strapi) {
  const Module = require('module');
  const originalLoad = Module._load;
  Module._load = function interceptStrapi(request, parent, isMain) {
    if (request === '@strapi/strapi') {
      return { factories: { createCoreService: (_uid, fn) => fn } };
    }
    return originalLoad.apply(this, arguments);
  };
  const recapPath = require.resolve('../src/api/show-recap/services/show-recap');
  delete require.cache[recapPath];
  global.strapi = strapi;
  try {
    return require(recapPath)({ strapi });
  } finally {
    Module._load = originalLoad;
  }
}

function seedRecap(extra = {}) {
  return {
    id: 3,
    band: { id: 4, name: 'Burning Thunder', slug: 'burning-thunder' },
    campaignId: 'sm_night_1',
    eventId: null,
    showTitle: 'Album Night',
    venue: 'The Basement East',
    city: 'Nashville',
    region: 'TN',
    country: 'US',
    timezone: 'America/Chicago',
    showModeType: 'manual',
    showStartedAt: '2026-09-05T02:15:00.000Z',
    showEndedAt: '2026-09-05T03:30:00.000Z',
    performanceStartsAt: '2026-09-05T02:15:00.000Z',
    performanceEndsAt: '2026-09-05T03:30:00.000Z',
    recapGeneratedAt: '2026-09-05T03:31:00.000Z',
    fansCaptured: 12,
    checkedInShowCount: 8,
    publicStory: null,
    privateArtistNote: null,
    lineup: null,
    nightSlug: null,
    coverImage: null,
    heroImage: null,
    heroFocalX: null,
    heroFocalY: null,
    metadata: { generatedBy: 'show-recap-engine-v1' },
    ...extra,
  };
}

function ownerBand() {
  return {
    4: {
      id: 4,
      name: 'Burning Thunder',
      users_permissions_user: { id: 1 },
    },
  };
}

(async () => {
  console.log('\n=== Night enrichment slice 2 ===\n');
  const previousGlobal = global.strapi;

  await test('1. publicStory normalization', () => {
    assert.strictEqual(night.normalizePublicStory('  Nashville was unreal.  ').value, 'Nashville was unreal.');
    assert.strictEqual(night.normalizePublicStory('<b>hi</b>').value, 'hi');
    assert.strictEqual(night.normalizePublicStory('   ').value, null);
    assert.strictEqual(night.normalizePublicStory(null).value, null);
    assert.ok(night.normalizePublicStory('x'.repeat(5001)).error);
    assert.ok(night.normalizePublicStory(12).error);
  });

  await test('2. privateArtistNote normalization', () => {
    assert.strictEqual(night.normalizePrivateArtistNote('Promoter wants March.\n\nHard on Ghost.').value.includes('March'), true);
    assert.ok(night.normalizePrivateArtistNote('x'.repeat(10001)).error);
    assert.strictEqual(night.normalizePrivateArtistNote('').value, null);
  });

  await test('3-7. lineup normalization and rejects', () => {
    const ok = night.normalizeLineup([
      { name: 'Badflower', bandId: 4, role: 'Headliner' },
      { name: 'Dead Poet Society', role: 'direct support' },
      { name: 'Local Opener', role: 'opener' },
    ]);
    assert.strictEqual(ok.error, undefined);
    assert.deepStrictEqual(ok.value, [
      { name: 'Badflower', bandId: 4, role: 'headliner', order: 0 },
      { name: 'Dead Poet Society', bandId: null, role: 'direct_support', order: 1 },
      { name: 'Local Opener', bandId: null, role: 'opener', order: 2 },
    ]);
    assert.strictEqual(night.normalizeLineup([]).value.length, 0);
    assert.strictEqual(night.normalizeLineup([{ name: '   ' }]).error, 'invalid_lineup_name');
    assert.strictEqual(night.normalizeLineup(new Array(51).fill({ name: 'Act' })).error, 'lineup_too_long');
    assert.strictEqual(night.normalizeLineup([
      { name: 'A', bandId: 4 },
      { name: 'B', bandId: 4 },
    ]).error, 'duplicate_lineup_band');
    assert.strictEqual(night.normalizeLineup([
      { name: 'Same', role: 'opener' },
      { name: 'same', role: 'guest' },
    ]).error, 'duplicate_lineup_name');
    assert.strictEqual(night.normalizeLineup([{ name: 'Act', role: 'x'.repeat(41) }]).error, 'invalid_lineup_role');
    assert.strictEqual(night.normalizeLineup([{ name: 'Act', role: 'mystery guest' }]).value[0].role, 'other');
  });

  await test('8. nightSlug generated from venue/city/date/campaign', () => {
    const slug = night.buildNightSlug({
      venue: 'The Basement East',
      city: 'Nashville',
      performanceStartsAt: '2026-09-05T02:15:00.000Z',
      timezone: 'America/Chicago',
      campaignId: 'sm_12345678abcd',
    });
    assert.match(slug, /basement-east/);
    assert.match(slug, /nashville/);
    assert.match(slug, /sep-4-2026|sep-5-2026/);
    assert.ok(slug.endsWith('345678abcd') || slug.includes('abcd'));
    assert.doesNotMatch(slug, /promoter|private/i);
  });

  await test('9. nightSlug stays stable when identity text changes', () => {
    const first = night.buildNightSlug({
      venue: 'The Basement East',
      city: 'Nashville',
      performanceStartsAt: '2026-09-05T02:15:00.000Z',
      timezone: 'America/Chicago',
      campaignId: 'sm_night_1',
    });
    const afterTitleChange = night.buildNightSlug({
      venue: 'The Basement East',
      city: 'Nashville',
      showTitle: 'Totally New Title',
      performanceStartsAt: '2026-09-05T02:15:00.000Z',
      timezone: 'America/Chicago',
      campaignId: 'sm_night_1',
    });
    assert.strictEqual(first, afterTitleChange);
  });

  await test('10-11. owner and manager can enrich', async () => {
    const recap = seedRecap();
    const strapi = makeStrapi({
      bands: ownerBand(),
      recaps: [recap],
      members: [
        { band: 4, user: 1, role: 'owner', status: 'active' },
        { band: 4, user: 2, role: 'manager', status: 'active' },
      ],
    });
    const service = loadRecapService(strapi);
    const owner = await service.enrichNight({
      recapId: 3,
      userId: 1,
      patch: { publicStory: 'Nashville was unreal tonight.' },
    });
    assert.strictEqual(owner.error, undefined);
    assert.strictEqual(owner.data.publicStory, 'Nashville was unreal tonight.');
    assert.ok(owner.data.nightSlug);

    const manager = await service.enrichNight({
      recapId: 3,
      userId: 2,
      patch: { privateArtistNote: 'Promoter wants March.' },
    });
    assert.strictEqual(manager.error, undefined);
    assert.strictEqual(manager.data.privateArtistNote, 'Promoter wants March.');
  });

  await test('12-13. fan and wrong-band artist cannot enrich', async () => {
    const recap = seedRecap();
    const strapi = makeStrapi({
      bands: {
        4: { id: 4, name: 'Burning Thunder', users_permissions_user: { id: 1 } },
        9: { id: 9, name: 'Other', users_permissions_user: { id: 9 } },
      },
      recaps: [recap],
      members: [{ band: 9, user: 9, role: 'owner', status: 'active' }],
    });
    const service = loadRecapService(strapi);
    const fan = await service.enrichNight({
      recapId: 3,
      userId: 77,
      patch: { publicStory: 'hack' },
    });
    assert.strictEqual(fan.error, 'forbidden');
    assert.strictEqual(fan.status, 403);

    const other = await service.enrichNight({
      recapId: 3,
      userId: 9,
      patch: { publicStory: 'nope' },
    });
    assert.strictEqual(other.error, 'forbidden');
    assert.strictEqual(recap.publicStory, null);
  });

  await test('14-17. PATCH omit/null/empty lineup and legacy slug', async () => {
    const recap = seedRecap({
      publicStory: 'Keep me',
      privateArtistNote: 'Secret',
      lineup: [{ name: 'Badflower', bandId: 4, role: 'headliner', order: 0 }],
    });
    const strapi = makeStrapi({
      bands: ownerBand(),
      recaps: [recap],
      members: [{ band: 4, user: 1, role: 'owner', status: 'active' }],
    });
    const service = loadRecapService(strapi);
    const partial = await service.enrichNight({
      recapId: 3,
      userId: 1,
      patch: { publicStory: 'Updated story' },
    });
    assert.strictEqual(partial.data.publicStory, 'Updated story');
    assert.strictEqual(partial.data.privateArtistNote, 'Secret');
    assert.strictEqual(partial.data.lineup[0].name, 'Badflower');
    assert.ok(partial.data.nightSlug);

    const cleared = await service.enrichNight({
      recapId: 3,
      userId: 1,
      patch: { publicStory: null, privateArtistNote: null, lineup: [], coverMediaId: null },
    });
    assert.strictEqual(cleared.data.publicStory, null);
    assert.strictEqual(cleared.data.privateArtistNote, null);
    assert.deepStrictEqual(cleared.data.lineup, []);
    assert.strictEqual(cleared.data.cover, null);
    assert.ok(cleared.data.nightSlug);
  });

  await test('18-23. regeneration preserves artist fields and refreshes metrics', async () => {
    const previous = seedRecap({
      publicStory: 'Nashville was unreal tonight.',
      privateArtistNote: 'Promoter wants March.',
      lineup: [{ name: 'Badflower', bandId: 4, role: 'headliner', order: 0 }],
      nightSlug: 'the-basement-east-nashville-sep-5-2026-night1',
      coverImage: { id: 88, url: 'https://cdn.example/cover.jpg' },
      heroImage: { id: 91, url: 'https://cdn.example/hero.jpg', width: 1600, height: 900 },
      heroFocalX: 32,
      heroFocalY: 68,
      fansCaptured: 2,
      metadata: { artistDraft: 'keep', generatedBy: 'old' },
    });
    const strapi = makeStrapi({
      bands: { 4: { id: 4, name: 'Burning Thunder' } },
      recaps: [previous],
      files: { 88: { id: 88, url: 'https://cdn.example/cover.jpg' } },
    });
    const service = loadRecapService(strapi);
    const updated = await service.generateShowRecap({
      bandId: 4,
      campaignId: 'sm_night_1',
      showContext: { showEndedAt: '2026-09-05T04:00:00.000Z' },
    });
    assert.strictEqual(updated.publicStory, 'Nashville was unreal tonight.');
    assert.strictEqual(updated.privateArtistNote, 'Promoter wants March.');
    assert.strictEqual(updated.lineup[0].name, 'Badflower');
    assert.strictEqual(updated.coverImage.id, 88);
    assert.strictEqual(updated.heroImage.id, 91);
    assert.strictEqual(updated.heroFocalX, 32);
    assert.strictEqual(updated.heroFocalY, 68);
    assert.strictEqual(updated.nightSlug, 'the-basement-east-nashville-sep-5-2026-night1');
    assert.strictEqual(updated.fansCaptured, 0);
    assert.strictEqual(updated.metadata.artistDraft, 'keep');
    assert.ok(!recapWrite.artistAuthoredKeysPresent(recapWrite.buildRecapUpdateData({
      recapData: {
        publicStory: 'wipe',
        privateArtistNote: 'wipe',
        lineup: [],
        coverImage: 1,
        heroImage: 2,
        heroFocalX: 0,
        heroFocalY: 0,
        nightSlug: 'changed',
        fansCaptured: 9,
      },
      previous,
    })).length);
  });

  await test('24-27. manual cover does not create Event and reaches recap + recovery', async () => {
    const bands = {
      4: { id: 4, name: 'Burning Thunder', showModeStatus: 'off', showModeEnabled: false },
    };
    const strapi = makeStrapi({ bands });
    const showMode = loadShowMode(strapi);
    const live = await showMode.activateManualShowMode(4, {
      title: 'Album Night',
      venue: 'The Basement East',
      city: 'Nashville',
      timezone: 'America/Chicago',
      coverMediaId: 88,
      coverFile: { id: 88, url: 'https://cdn.example/cover.jpg' },
    });
    assert.strictEqual(live.eventId, null);
    assert.strictEqual(live.coverMediaId, 88);
    assert.strictEqual(strapi.__createdEvents.length, 0);
    assert.strictEqual(bands[4].showModeEventId, null);
    assert.strictEqual(bands[4].showModeMetadata.coverMediaId, 88);

    await showMode.deactivateShowMode(4, 'manual');
    await new Promise((resolve) => setImmediate(resolve));
    const queued = strapi.__recapsQueued[0];
    assert.strictEqual(queued.showContext.coverMediaId, 88);
    assert.strictEqual(queued.showContext.eventId, null);
    assert.strictEqual(bands[4].showModeLastContext.coverMediaId, 88);

    const recovered = integrity.recoveryShowContext(bands[4], queued.campaignId);
    assert.strictEqual(recovered.coverMediaId, 88);

    const recapStrapi = makeStrapi({
      bands: {
        4: {
          id: 4,
          name: 'Burning Thunder',
          showModeLastCampaignId: queued.campaignId,
          showModeLastContext: queued.showContext,
        },
      },
      files: { 88: { id: 88, url: 'https://cdn.example/cover.jpg' } },
    });
    const recapService = loadRecapService(recapStrapi);
    const recap = await recapService.generateShowRecap({
      bandId: 4,
      campaignId: queued.campaignId,
      showContext: recovered,
    });
    assert.strictEqual(recap.coverImage.id, 88);
    assert.strictEqual(recap.eventId, null);
    assert.ok(recap.nightSlug);
  });

  await test('27. manual without cover still creates no Event', async () => {
    const bands = { 4: { id: 4, name: 'Burning Thunder', showModeStatus: 'off', showModeEnabled: false } };
    const strapi = makeStrapi({ bands });
    const showMode = loadShowMode(strapi);
    const live = await showMode.activateManualShowMode(4, { timezone: 'America/Chicago' });
    assert.strictEqual(live.eventId, null);
    assert.strictEqual(strapi.__createdEvents.length, 0);
  });

  await test('28-30. Event image no longer seeds Night Photo; artist cover survives', async () => {
    const event = {
      id: 11,
      title: 'The Happy Room',
      venue: 'The Happy Room',
      city: 'Chicago',
      image: { id: 77, url: 'https://cdn.example/event.jpg' },
    };
    const empty = seedRecap({
      id: 8,
      campaignId: 'sm_event_cover',
      eventId: 11,
      coverImage: null,
      heroImage: null,
      nightSlug: 'happy-room-chicago-sep-5-2026-event1',
    });
    const firstStrapi = makeStrapi({
      bands: { 4: { id: 4, name: 'Burning Thunder' } },
      recaps: [empty],
      events: { 11: event },
    });
    const first = await loadRecapService(firstStrapi).generateShowRecap({
      bandId: 4,
      campaignId: 'sm_event_cover',
      showContext: { eventId: 11, title: 'The Happy Room' },
    });
    assert.strictEqual(first.eventId, 11);
    assert.strictEqual(first.coverImage, null);
    assert.strictEqual(first.heroImage, null);

    const owned = seedRecap({
      id: 9,
      campaignId: 'sm_event_owned',
      eventId: 11,
      coverImage: { id: 88, url: 'https://cdn.example/night.jpg' },
      nightSlug: 'owned-cover',
    });
    const ownedStrapi = makeStrapi({
      bands: { 4: { id: 4, name: 'Burning Thunder' } },
      recaps: [owned],
      events: { 11: event },
      files: { 88: { id: 88, url: 'https://cdn.example/night.jpg' } },
    });
    const kept = await loadRecapService(ownedStrapi).generateShowRecap({
      bandId: 4,
      campaignId: 'sm_event_owned',
      showContext: { eventId: 11, coverMediaId: 77 },
    });
    assert.strictEqual(kept.coverImage.id, 88);
  });

  await test('legacy Event-seeded cover rows are not migrated', async () => {
    const event = {
      id: 11,
      image: { id: 77, url: 'https://cdn.example/event.jpg' },
    };
    const legacy = seedRecap({
      id: 10,
      campaignId: 'sm_legacy_event_cover',
      eventId: 11,
      coverImage: { id: 77, url: 'https://cdn.example/event.jpg' },
      nightSlug: 'legacy-event-cover',
    });
    const strapi = makeStrapi({
      bands: { 4: { id: 4, name: 'Burning Thunder' } },
      recaps: [legacy],
      events: { 11: event },
    });
    const kept = await loadRecapService(strapi).generateShowRecap({
      bandId: 4,
      campaignId: 'sm_legacy_event_cover',
      showContext: { eventId: 11 },
    });
    assert.strictEqual(kept.coverImage.id, 77);
  });

  await test('31-33. cover media security', async () => {
    const recap = seedRecap({ nightSlug: 'already-there' });
    const files = {
      10: {
        id: 10,
        mime: 'image/jpeg',
        createdBy: 9,
        createdAt: new Date().toISOString(),
        url: 'https://cdn.example/foreign.jpg',
      },
      11: {
        id: 11,
        mime: 'image/jpeg',
        createdBy: 1,
        createdAt: new Date().toISOString(),
        url: 'faneqo-protected://abc',
        provider_metadata: { protected: true, domain: 'artist-update', uploaderUserId: 1 },
      },
      12: {
        id: 12,
        mime: 'image/jpeg',
        createdBy: 1,
        createdAt: new Date().toISOString(),
        url: 'https://cdn.example/ok.jpg',
      },
    };
    const strapi = makeStrapi({
      bands: ownerBand(),
      recaps: [recap],
      members: [{ band: 4, user: 1, role: 'owner', status: 'active' }],
      files,
    });
    const service = loadRecapService(strapi);
    const foreign = await service.enrichNight({ recapId: 3, userId: 1, patch: { coverMediaId: 10 } });
    assert.ok(foreign.error);

    const gated = await service.enrichNight({ recapId: 3, userId: 1, patch: { coverMediaId: 11 } });
    assert.strictEqual(gated.error, 'protected_cover');

    const ok = await service.enrichNight({ recapId: 3, userId: 1, patch: { coverMediaId: 12 } });
    assert.strictEqual(ok.error, undefined);
    assert.strictEqual(ok.data.cover.id, 12);
    assert.strictEqual(ok.data.cover.url, 'https://cdn.example/ok.jpg');
  });

  await test('hero schema exists with focal fields', () => {
    const recap = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/api/show-recap/content-types/show-recap/schema.json'), 'utf8'));
    assert.strictEqual(recap.attributes.heroImage.type, 'media');
    assert.strictEqual(recap.attributes.heroImage.multiple, false);
    assert.deepStrictEqual(recap.attributes.heroImage.allowedTypes, ['images']);
    assert.strictEqual(recap.attributes.heroFocalX.type, 'decimal');
    assert.strictEqual(recap.attributes.heroFocalY.type, 'decimal');
    assert.ok(!recap.attributes.heroImage.required);
    assert.ok(!('imageFit' in recap.attributes));
    assert.ok(!('heroZoom' in recap.attributes));
  });

  await test('owner/manager can set, omit, and clear Night Hero', async () => {
    const recap = seedRecap({ nightSlug: 'hero-night' });
    const files = {
      21: {
        id: 21,
        mime: 'image/jpeg',
        createdBy: 1,
        createdAt: new Date().toISOString(),
        url: 'https://cdn.example/hero.jpg',
        width: 1800,
        height: 1200,
        alternativeText: 'Hero',
      },
    };
    const strapi = makeStrapi({
      bands: ownerBand(),
      recaps: [recap],
      members: [
        { band: 4, user: 1, role: 'owner', status: 'active' },
        { band: 4, user: 2, role: 'manager', status: 'active' },
      ],
      files,
    });
    const service = loadRecapService(strapi);
    const owner = await service.enrichNight({
      recapId: 3,
      userId: 1,
      patch: { heroMediaId: 21, heroFocalX: 20, heroFocalY: 80 },
    });
    assert.strictEqual(owner.error, undefined);
    assert.strictEqual(owner.data.hero.id, 21);
    assert.strictEqual(owner.data.hero.url, 'https://cdn.example/hero.jpg');
    assert.strictEqual(owner.data.hero.width, 1800);
    assert.strictEqual(owner.data.heroFocalX, 20);
    assert.strictEqual(owner.data.heroFocalY, 80);

    const omitted = await service.enrichNight({
      recapId: 3,
      userId: 2,
      patch: { publicStory: 'Keep the hero' },
    });
    assert.strictEqual(omitted.data.hero.id, 21);
    assert.strictEqual(omitted.data.heroFocalX, 20);
    assert.strictEqual(omitted.data.heroFocalY, 80);

    const cleared = await service.enrichNight({
      recapId: 3,
      userId: 1,
      patch: { heroMediaId: null },
    });
    assert.strictEqual(cleared.data.hero, null);
    assert.strictEqual(cleared.data.heroFocalX, 20);
    assert.strictEqual(cleared.data.heroFocalY, 80);
  });

  await test('Night Hero rejects foreign, protected, and non-image media', async () => {
    const recap = seedRecap({
      nightSlug: 'hero-secure',
      heroImage: { id: 21, url: 'https://cdn.example/hero.jpg' },
    });
    const files = {
      10: {
        id: 10,
        mime: 'image/jpeg',
        createdBy: 9,
        createdAt: new Date().toISOString(),
        url: 'https://cdn.example/foreign.jpg',
      },
      11: {
        id: 11,
        mime: 'image/jpeg',
        createdBy: 1,
        createdAt: new Date().toISOString(),
        url: 'faneqo-protected://abc',
        provider_metadata: { protected: true, domain: 'artist-update', uploaderUserId: 1 },
      },
      13: {
        id: 13,
        mime: 'video/mp4',
        createdBy: 1,
        createdAt: new Date().toISOString(),
        url: 'https://cdn.example/clip.mp4',
      },
    };
    const strapi = makeStrapi({
      bands: ownerBand(),
      recaps: [recap],
      members: [{ band: 4, user: 1, role: 'owner', status: 'active' }],
      files,
    });
    const service = loadRecapService(strapi);
    const foreign = await service.enrichNight({ recapId: 3, userId: 1, patch: { heroMediaId: 10 } });
    assert.ok(foreign.error);
    assert.strictEqual(recap.heroImage.id, 21);

    const gated = await service.enrichNight({ recapId: 3, userId: 1, patch: { heroMediaId: 11 } });
    assert.strictEqual(gated.error, 'protected_cover');
    assert.strictEqual(recap.heroImage.id, 21);

    const video = await service.enrichNight({ recapId: 3, userId: 1, patch: { heroMediaId: 13 } });
    assert.ok(video.error);
    assert.strictEqual(recap.heroImage.id, 21);

    const badFocal = await service.enrichNight({ recapId: 3, userId: 1, patch: { heroFocalX: 140 } });
    assert.strictEqual(badFocal.error, 'invalid_hero_focal');
  });

  await test('Night Hero is never auto-seeded on new or Event recaps', async () => {
    const event = {
      id: 11,
      image: { id: 77, url: 'https://cdn.example/event.jpg' },
    };
    const strapi = makeStrapi({
      bands: {
        4: {
          id: 4,
          name: 'Burning Thunder',
          showModeLastCampaignId: 'sm_new_event',
          showModeLastContext: { eventId: 11, campaignId: 'sm_new_event' },
        },
      },
      events: { 11: event },
    });
    const recap = await loadRecapService(strapi).generateShowRecap({
      bandId: 4,
      campaignId: 'sm_new_event',
      showContext: { eventId: 11, title: 'The Happy Room' },
    });
    assert.strictEqual(recap.coverImage, undefined);
    assert.strictEqual(recap.heroImage, undefined);
    assert.ok(!Object.prototype.hasOwnProperty.call(recap, 'heroFocalX'));
  });

  await test('linked lineup bandId must exist; snapshot name is kept', async () => {
    const recap = seedRecap({ nightSlug: 'lineup-check' });
    const strapi = makeStrapi({
      bands: { ...ownerBand(), 22: { id: 22, name: 'Dead Poet Society' } },
      recaps: [recap],
      members: [{ band: 4, user: 1, role: 'owner', status: 'active' }],
    });
    const service = loadRecapService(strapi);
    const missing = await service.enrichNight({
      recapId: 3,
      userId: 1,
      patch: { lineup: [{ name: 'Ghost Band', bandId: 999 }] },
    });
    assert.strictEqual(missing.error, 'invalid_lineup_band');

    const linked = await service.enrichNight({
      recapId: 3,
      userId: 1,
      patch: { lineup: [{ name: 'DPS Snapshot', bandId: 22, role: 'support' }] },
    });
    assert.strictEqual(linked.data.lineup[0].name, 'DPS Snapshot');
    assert.strictEqual(linked.data.lineup[0].bandId, 22);
  });

  await test('34. legacy recap without enrichment fields still reads', () => {
    const publicNight = night.toPublicNight({
      id: 1,
      campaignId: 'sm_old',
      showTitle: 'Old Night',
      venue: 'Room',
      city: 'Chicago',
      showStartedAt: '2026-01-01T01:00:00.000Z',
      showEndedAt: '2026-01-01T03:00:00.000Z',
    });
    assert.strictEqual(publicNight.publicStory, null);
    assert.strictEqual(publicNight.lineup, null);
    assert.strictEqual(publicNight.nightSlug, null);
    assert.ok(!night.publicNightLeaksPrivateNote(publicNight));
    const artist = night.toArtistNight({ ...publicNight, privateArtistNote: 'secret' }, { includePrivateNote: false });
    assert.ok(!Object.prototype.hasOwnProperty.call(artist, 'privateArtistNote'));
  });

  await test('35. current Show Mode activation body still works', async () => {
    const strapi = makeStrapi({
      bands: { 4: { id: 4, name: 'Burning Thunder', showModeStatus: 'off', showModeEnabled: false } },
    });
    const showMode = loadShowMode(strapi);
    const result = await showMode.activateManualShowMode(4, { timezone: 'America/Chicago' });
    assert.strictEqual(result.status, 'live');
    assert.ok(result.campaignId);
  });

  await test('38. boot/module sanity; artist Night routes stay authenticated', () => {
    require('../src/utils/showMode/nightEnrichmentPure');
    require('../src/utils/showMode/nightCover');
    require('../src/utils/showMode/recapWritePure');
    const routes = require('../src/api/show-recap/routes/show-recap').routes;
    assert.ok(routes.some((route) => route.method === 'PATCH' && route.path === '/show-recaps/:id/night'));
    assert.ok(routes.some((route) => route.method === 'GET' && route.path === '/show-recaps/:id/night'));
    assert.ok(!routes.some((route) => route.config && route.config.auth === false && String(route.path).includes('night')));
    const src = fs.readFileSync(path.join(__dirname, '../src/api/show-recap/controllers/show-recap.js'), 'utf8');
    assert.match(src, /async getNight\(ctx\)/);
    assert.match(src, /async updateNight\(ctx\)/);
    const recap = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/api/show-recap/content-types/show-recap/schema.json'), 'utf8'));
    assert.ok(!recap.attributes.nightSlug.unique);
    assert.strictEqual(recap.attributes.heroImage.type, 'media');
    assert.strictEqual(recap.attributes.heroFocalX.type, 'decimal');
    assert.strictEqual(recap.attributes.heroFocalY.type, 'decimal');
    assert.match(src, /heroMediaId/);
    assert.match(src, /heroFocalX/);
    assert.match(src, /heroFocalY/);
  });

  await test('viewer can read Night without private note', async () => {
    const recap = seedRecap({
      privateArtistNote: 'Secret',
      publicStory: 'Public',
      nightSlug: 'viewer-night',
    });
    const strapi = makeStrapi({
      bands: ownerBand(),
      recaps: [recap],
      members: [{ band: 4, user: 5, role: 'viewer', status: 'active' }],
    });
    const service = loadRecapService(strapi);
    const read = await service.getArtistNight({ recapId: 3, userId: 5 });
    assert.strictEqual(read.error, undefined);
    assert.strictEqual(read.data.publicStory, 'Public');
    assert.ok(!Object.prototype.hasOwnProperty.call(read.data, 'privateArtistNote'));
  });

  await test('anonymous cannot enrich', async () => {
    const service = loadRecapService(makeStrapi({ recaps: [seedRecap()] }));
    const result = await service.enrichNight({ recapId: 3, userId: null, patch: { publicStory: 'x' } });
    assert.strictEqual(result.error, 'unauthorized');
  });

  global.strapi = previousGlobal;
  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
  if (failed) process.exitCode = 1;
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
