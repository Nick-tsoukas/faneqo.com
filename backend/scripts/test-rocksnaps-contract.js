'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const pure = require('../src/utils/galleries/rocksnapsPure');
const { createRocksnapsService } = require('../src/utils/galleries/rocksnapsService');
const featured = require('../src/utils/galleries/featuredGalleryPure');
const share = require('../src/utils/showMode/publicNightSharePure');

let passed = 0;

function test(name, fn) {
  return Promise.resolve()
    .then(fn)
    .then(() => {
      passed += 1;
      console.log(`  ok  ${name}`);
    });
}

function photo(id, extra = {}) {
  return {
    id,
    url: `https://cdn.example/p${id}.jpg`,
    mime: 'image/jpeg',
    width: 1200,
    height: 800,
    alternativeText: `Photo ${id}`,
    provider_metadata: { key: `private/p${id}.jpg` },
    ...extra,
  };
}

function gallery(overrides = {}) {
  return {
    id: 3,
    slug: 'local-room',
    title: 'Local Room',
    bodyText: 'A local room',
    status: 'published',
    visibility: 'public',
    showOnRockSnaps: true,
    rocksnapsPublishedAt: '2026-10-11T15:00:00.000Z',
    publishedAt: '2026-10-01T12:00:00.000Z',
    coverMediaId: 12,
    media: [photo(11), photo(12)],
    mediaCaptions: { 11: 'Door' },
    createdByUser: { id: 4, email: 'secret@example.com' },
    publishIdempotencyKey: 'secret-key',
    ...overrides,
  };
}

const BAND = { id: 9, name: 'RockSnaps Photography', slug: 'rocksnapsphotography', email: 'secret@example.com' };
const CONFIG = { ok: true, bandId: 9, expectedSlug: 'rocksnapsphotography' };

function keysOf(value, out = new Set()) {
  if (!value || typeof value !== 'object') return out;
  if (Array.isArray(value)) {
    value.forEach((item) => keysOf(item, out));
    return out;
  }
  Object.entries(value).forEach(([key, child]) => {
    out.add(key);
    keysOf(child, out);
  });
  return out;
}

function memory(seed) {
  const state = {
    band: { ...BAND, ...(seed.band || {}) },
    galleries: (seed.galleries || [gallery({ showOnRockSnaps: false, rocksnapsPublishedAt: null })]).map((row) => ({
      ...row,
      band: row.band || { id: BAND.id, name: BAND.name, slug: BAND.slug },
    })),
    writes: [],
  };
  return {
    state,
    log: { warn() {}, info() {} },
    entityService: {
      async findOne(uid, id) {
        if (String(uid).includes('band')) {
          return Number(id) === Number(state.band.id) ? state.band : null;
        }
        return state.galleries.find((row) => Number(row.id) === Number(id)) || null;
      },
      async findMany(uid, query = {}) {
        if (!String(uid).includes('artist-update')) return [];
        const filters = query.filters || {};
        return state.galleries.filter((row) => {
          if (filters.band != null && Number(state.band.id) !== Number(filters.band)) return false;
          if (filters.status && row.status !== filters.status) return false;
          if (filters.visibility && row.visibility !== filters.visibility) return false;
          if (filters.showOnRockSnaps === true && row.showOnRockSnaps !== true) return false;
          if (filters.slug && row.slug !== filters.slug) return false;
          return true;
        });
      },
      async update(uid, id, { data }) {
        const row = state.galleries.find((item) => Number(item.id) === Number(id));
        state.writes.push({ id, data: { ...data } });
        Object.assign(row, data);
        return row;
      },
    },
  };
}

function serviceFor(strapi, extra = {}) {
  return createRocksnapsService(strapi, {
    config: CONFIG,
    authorize(userId, bandId) {
      if (Number(userId) === 1 && Number(bandId) === 9) return { hasAccess: true, role: 'owner' };
      if (Number(userId) === 2 && Number(bandId) === 8) return { hasAccess: true, role: 'owner' };
      return null;
    },
    now: extra.now || (() => '2026-10-11T15:00:00.000Z'),
  });
}

async function main() {
  await test('configuration fails closed unless the band id is a positive integer', () => {
    assert.strictEqual(pure.readConfig({}).ok, false);
    assert.strictEqual(pure.readConfig({ ROCKSNAPS_BAND_ID: '' }).ok, false);
    assert.strictEqual(pure.readConfig({ ROCKSNAPS_BAND_ID: '0' }).ok, false);
    assert.strictEqual(pure.readConfig({ ROCKSNAPS_BAND_ID: '9abc' }).ok, false);
    assert.strictEqual(pure.readConfig({ ROCKSNAPS_BAND_ID: '9' }).bandId, 9);
    assert.strictEqual(pure.readConfig({ ROCKSNAPS_BAND_ID: '9' }).expectedSlug, 'rocksnapsphotography');
  });

  await test('the slug is a tripwire, not the authority', () => {
    assert.strictEqual(pure.bandMatches({ id: 9, slug: 'rocksnapsphotography' }, CONFIG), true);
    assert.strictEqual(pure.bandMatches({ id: 9, slug: 'someone-else' }, CONFIG), false);
    assert.strictEqual(pure.bandMatches({ id: 4, slug: 'rocksnapsphotography' }, CONFIG), false);
    assert.strictEqual(pure.bandMatches({ id: 9, slug: 'rocksnapsphotography' }, { ok: false }), false);
  });

  await test('only a strict boolean is accepted', () => {
    assert.strictEqual(pure.parseFlag(true).value, true);
    assert.strictEqual(pure.parseFlag(false).value, false);
    assert.strictEqual(pure.parseFlag('true').error, 'invalid_flag');
    assert.strictEqual(pure.parseFlag(1).error, 'invalid_flag');
  });

  await test('an unauthorized band cannot enable RockSnaps, including by writing a timestamp', () => {
    const data = { showOnRockSnaps: true, rocksnapsPublishedAt: '2020-01-01T00:00:00.000Z' };
    const result = pure.sanitizeRocksnapsWrite(data, {
      allowed: false,
      status: 'published',
      visibility: 'public',
      currentlyEnabled: false,
      now: '2026-10-11T15:00:00.000Z',
    });
    assert.strictEqual(result.action, 'forced-off');
    assert.strictEqual(data.showOnRockSnaps, false);
    assert.strictEqual(data.rocksnapsPublishedAt, null);
  });

  await test('a draft or non-public gallery cannot be enabled', () => {
    const draft = { showOnRockSnaps: true };
    pure.sanitizeRocksnapsWrite(draft, {
      allowed: true,
      status: 'draft',
      visibility: 'public',
      now: '2026-10-11T15:00:00.000Z',
    });
    assert.strictEqual(draft.showOnRockSnaps, false);

    const fans = { showOnRockSnaps: true };
    pure.sanitizeRocksnapsWrite(fans, {
      allowed: true,
      status: 'published',
      visibility: 'fan_list',
      now: '2026-10-11T15:00:00.000Z',
    });
    assert.strictEqual(fans.showOnRockSnaps, false);
  });

  await test('the first enable stamps the date, a repeat enable does not, and disable keeps it', () => {
    const first = { showOnRockSnaps: true };
    pure.sanitizeRocksnapsWrite(first, {
      allowed: true,
      status: 'published',
      visibility: 'public',
      currentlyEnabled: false,
      now: '2026-10-11T15:00:00.000Z',
    });
    assert.strictEqual(first.rocksnapsPublishedAt, '2026-10-11T15:00:00.000Z');

    const again = { showOnRockSnaps: true, rocksnapsPublishedAt: '1999-01-01T00:00:00.000Z' };
    pure.sanitizeRocksnapsWrite(again, {
      allowed: true,
      status: 'published',
      visibility: 'public',
      currentlyEnabled: true,
      now: '2026-10-11T16:00:00.000Z',
    });
    assert.strictEqual(Object.prototype.hasOwnProperty.call(again, 'rocksnapsPublishedAt'), false);

    const off = { showOnRockSnaps: false, rocksnapsPublishedAt: '1999-01-01T00:00:00.000Z' };
    const disabled = pure.sanitizeRocksnapsWrite(off, {
      allowed: true,
      status: 'published',
      visibility: 'public',
      currentlyEnabled: true,
    });
    assert.strictEqual(disabled.action, 'disabled');
    assert.strictEqual(off.showOnRockSnaps, false);
    assert.strictEqual(Object.prototype.hasOwnProperty.call(off, 'rocksnapsPublishedAt'), false);
  });

  await test('ordinary writes that omit the fields are left alone', () => {
    const data = { title: 'Hello' };
    assert.strictEqual(pure.sanitizeRocksnapsWrite(data, { allowed: false }).action, 'ignore');
    assert.strictEqual(Object.prototype.hasOwnProperty.call(data, 'showOnRockSnaps'), false);
  });

  await test('the public card uses the chosen cover and omits private fields', () => {
    const card = pure.toListCard(gallery(), BAND);
    assert.deepStrictEqual(Object.keys(card).sort(), [...pure.PUBLIC_LIST_KEYS].sort());
    assert.strictEqual(card.cover.url, 'https://cdn.example/p12.jpg');
    assert.strictEqual(card.photoCount, 2);
    assert.strictEqual(card.description, 'A local room');
    assert.deepStrictEqual(card.artist, { name: 'RockSnaps Photography', slug: 'rocksnapsphotography' });
    const detail = pure.toDetail(gallery(), BAND);
    assert.deepStrictEqual(detail.photos.map((item) => item.url), [
      'https://cdn.example/p11.jpg',
      'https://cdn.example/p12.jpg',
    ]);
    assert.strictEqual(detail.photos[0].caption, 'Door');
    assert.strictEqual(detail.photos[0].order, 0);
    const leaked = keysOf(detail);
    for (const key of ['email', 'createdByUser', 'provider_metadata', 'publishIdempotencyKey', 'mediaId', 'password']) {
      assert.strictEqual(leaked.has(key), false, key);
    }
    assert.strictEqual(JSON.stringify(detail).includes('secret@example.com'), false);
    assert.strictEqual(JSON.stringify(detail).includes('private/p'), false);
  });

  await test('hidden, draft, private, unsigned, and empty galleries are not public cards', () => {
    assert.strictEqual(pure.toListCard(gallery({ status: 'hidden' }), BAND), null);
    assert.strictEqual(pure.toListCard(gallery({ status: 'draft' }), BAND), null);
    assert.strictEqual(pure.toListCard(gallery({ visibility: 'fan_list' }), BAND), null);
    assert.strictEqual(pure.toListCard(gallery({ showOnRockSnaps: false }), BAND), null);
    assert.strictEqual(pure.toListCard(gallery({ media: [] }), BAND), null);
    assert.strictEqual(pure.toListCard(gallery({
      media: [photo(11, { url: 'faneqo-protected://hidden' })],
      coverMediaId: 11,
    }), BAND), null);
    assert.strictEqual(pure.toListCard(gallery({
      media: [photo(11, { url: 'https://cdn.example/p11.jpg?X-Amz-Signature=abc' })],
      coverMediaId: 11,
    }), BAND), null);
  });

  await test('newest RockSnaps publication sorts first, ahead of a newer gallery id', () => {
    const older = { slug: 'older', rocksnapsPublishedAt: '2026-10-11T15:00:00.000Z', publishedAt: '2026-10-10T00:00:00.000Z' };
    const newer = { slug: 'newer', rocksnapsPublishedAt: '2026-10-11T18:00:00.000Z', publishedAt: '2026-10-01T00:00:00.000Z' };
    const undated = { slug: 'undated', rocksnapsPublishedAt: null, publishedAt: '2026-10-12T00:00:00.000Z' };
    const sorted = [older, undated, newer].sort(pure.comparePublication);
    assert.deepStrictEqual(sorted.map((row) => row.slug), ['newer', 'older', 'undated']);
  });

  await test('pagination defaults to 24, caps at 48, and does not invent a page', () => {
    assert.deepStrictEqual(pure.parsePage({}), { page: 1, pageSize: 24 });
    assert.strictEqual(pure.parsePage({ pageSize: 48 }).pageSize, 48);
    assert.strictEqual(pure.parsePage({ pageSize: 49 }).error, 'invalid_page');
    assert.strictEqual(pure.parsePage({ page: 0 }).error, 'invalid_page');
    const page = pure.paginate([{ slug: 'a' }, { slug: 'b' }, { slug: 'c' }], { page: 2, pageSize: 2 });
    assert.deepStrictEqual(page.data.map((row) => row.slug), ['c']);
    assert.strictEqual(page.meta.total, 3);
    assert.strictEqual(page.meta.pageCount, 2);
  });

  await test('manage capability is eligible only for the configured band', () => {
    const ours = {
      bandId: 9,
      bandSlug: 'rocksnapsphotography',
      status: 'published',
      visibility: 'public',
      showOnRockSnaps: true,
      rocksnapsPublishedAt: '2026-10-11T15:00:00.000Z',
    };
    pure.decorateManage(ours, { ROCKSNAPS_BAND_ID: '9' });
    assert.strictEqual(ours.rocksnaps.eligible, true);
    assert.strictEqual(ours.rocksnaps.enabled, true);
    assert.strictEqual(Object.prototype.hasOwnProperty.call(ours, 'showOnRockSnaps'), false);

    const other = {
      bandId: 4,
      bandSlug: 'ada',
      status: 'published',
      visibility: 'public',
      showOnRockSnaps: true,
      rocksnapsPublishedAt: '2026-10-11T15:00:00.000Z',
    };
    pure.decorateManage(other, { ROCKSNAPS_BAND_ID: '9' });
    assert.strictEqual(other.rocksnaps.eligible, false);
    assert.strictEqual(other.rocksnaps.enabled, false);
    assert.strictEqual(other.rocksnaps.publishedAt, null);

    const hidden = {
      bandId: 9,
      bandSlug: 'rocksnapsphotography',
      status: 'hidden',
      visibility: 'public',
      showOnRockSnaps: false,
    };
    pure.decorateManage(hidden, { ROCKSNAPS_BAND_ID: '9' });
    assert.strictEqual(hidden.rocksnaps.canEnable, false);
    assert.strictEqual(hidden.rocksnaps.reason, 'This gallery is hidden.');
  });

  await test('the management list reports RockSnaps only for an eligible public gallery', () => {
    const live = pure.stampManageList({
      slug: 'room',
      status: 'published',
      visibility: 'public',
      showOnRockSnaps: true,
      rocksnapsPublishedAt: '2026-10-11T15:00:00.000Z',
    }, true);
    assert.deepStrictEqual(live.rocksnaps, { onRockSnaps: true });
    assert.strictEqual(Object.prototype.hasOwnProperty.call(live, 'showOnRockSnaps'), false);
    assert.strictEqual(Object.prototype.hasOwnProperty.call(live, 'rocksnapsPublishedAt'), false);

    const off = pure.stampManageList({
      status: 'published',
      visibility: 'public',
      showOnRockSnaps: false,
    }, true);
    assert.deepStrictEqual(off.rocksnaps, { onRockSnaps: false });

    for (const row of [
      { status: 'hidden', visibility: 'public', showOnRockSnaps: true },
      { status: 'published', visibility: 'fan_list', showOnRockSnaps: true },
      { status: 'draft', visibility: 'public', showOnRockSnaps: true },
    ]) {
      assert.strictEqual(pure.stampManageList(row, true).rocksnaps.onRockSnaps, false);
    }

    const other = pure.stampManageList({
      status: 'published',
      visibility: 'public',
      showOnRockSnaps: true,
    }, false);
    assert.strictEqual(Object.prototype.hasOwnProperty.call(other, 'rocksnaps'), false);
    assert.strictEqual(Object.prototype.hasOwnProperty.call(other, 'showOnRockSnaps'), false);

    const service = fs.readFileSync(
      path.join(__dirname, '../src/utils/artistUpdates/artistUpdateService.js'),
      'utf8'
    );
    const listStart = service.indexOf('async function listMine');
    const listBody = service.slice(listStart, service.indexOf('async function deliveryStatus'));
    assert.ok(listBody.includes('stampManageList'));
    assert.ok(listBody.includes('rocksnapsListEligible'));
  });

  await test('existing Faneqo public gallery contracts do not gain RockSnaps fields', () => {
    const card = featured.toPublicGalleryIndexCard(gallery(), { bandSlug: 'rocksnapsphotography' });
    assert.deepStrictEqual(Object.keys(card).sort(), ['canonicalPath', 'cover', 'id', 'photoCount', 'slug', 'title']);
    assert.strictEqual(share.PUBLIC_GALLERY_KEYS.includes('showOnRockSnaps'), false);
    assert.strictEqual(share.PUBLIC_GALLERY_KEYS.includes('rocksnapsPublishedAt'), false);
  });

  await test('gallery save cannot mass-assign RockSnaps fields', () => {
    const controller = fs.readFileSync(
      path.join(__dirname, '../src/api/artist-update/controllers/artist-update.js'),
      'utf8'
    );
    const start = controller.indexOf('async saveManage');
    const end = controller.indexOf('async setRocksnaps');
    const body = controller.slice(start, end);
    assert.ok(body.includes("'title', 'caption', 'mediaOrder', 'mediaCaptions', 'coverMediaId', 'visibility', 'sessionId'"));
    assert.strictEqual(body.includes('showOnRockSnaps'), false);
    assert.strictEqual(body.includes('rocksnapsPublishedAt'), false);
    const createStart = controller.indexOf('async create(');
    const createBody = controller.slice(createStart, controller.indexOf('async bySlug'));
    assert.strictEqual(createBody.includes('showOnRockSnaps'), false);
    assert.strictEqual(createBody.includes('rocksnapsPublishedAt'), false);
  });

  await test('creation capability is eligible only for the configured band the caller can edit', async () => {
    const schema = JSON.parse(fs.readFileSync(
      path.join(__dirname, '../src/api/artist-update/content-types/artist-update/schema.json'),
      'utf8'
    ));
    assert.strictEqual(schema.attributes.showOnRockSnaps.default, false);

    const strapi = memory({});
    const service = serviceFor(strapi);
    const ours = await service.capability({ userId: 1, bandId: 9 });
    assert.deepStrictEqual(ours.data, { eligible: true });
    assert.strictEqual(JSON.stringify(ours).includes('9'), false);

    const stranger = await service.capability({ userId: 2, bandId: 9 });
    assert.strictEqual(stranger.error, 'forbidden');
    const otherBand = await service.capability({ userId: 2, bandId: 8 });
    assert.deepStrictEqual(otherBand.data, { eligible: false });
    assert.strictEqual((await service.capability({ userId: null, bandId: 9 })).error, 'unauthorized');
    assert.strictEqual((await service.capability({ userId: 1, bandId: 'nope' })).error, 'invalid_band');

    const closed = createRocksnapsService(strapi, {
      config: { ok: false, bandId: null, expectedSlug: 'rocksnapsphotography' },
      authorize() { return { hasAccess: true }; },
    });
    assert.deepStrictEqual((await closed.capability({ userId: 1, bandId: 9 })).data, { eligible: false });

    strapi.state.band = { ...strapi.state.band, slug: 'someone-else' };
    const mismatched = await service.capability({ userId: 1, bandId: 9 });
    assert.deepStrictEqual(mismatched.data, { eligible: false });
  });

  await test('routes are dedicated and the lifecycle guard is loaded', () => {
    const manage = require('../src/api/artist-update/routes/01-artist-update').routes;
    const pub = require('../src/api/artist-update/routes/03-public-rocksnaps').routes;
    const faneqo = require('../src/api/artist-update/routes/02-public-gallery').routes;
    const capabilityAt = manage.findIndex((route) => route.path === '/artist-updates/rocksnaps-capability');
    const detailAt = manage.findIndex((route) => route.method === 'GET' && route.path === '/artist-updates/:id');
    assert.ok(capabilityAt >= 0 && capabilityAt < detailAt);
    assert.ok(manage.some((route) => route.method === 'PATCH' && route.path === '/artist-updates/:id/rocksnaps'));
    assert.deepStrictEqual(pub.map((route) => `${route.method} ${route.path}`), [
      'GET /public/rocksnaps/galleries',
      'GET /public/rocksnaps/galleries/:slug',
    ]);
    assert.ok(faneqo.every((route) => route.path.startsWith('/public/bands/')));
    const hooks = require('../src/api/artist-update/content-types/artist-update/lifecycles');
    assert.strictEqual(typeof hooks.beforeCreate, 'function');
    assert.strictEqual(typeof hooks.beforeUpdate, 'function');
    assert.strictEqual(typeof hooks.beforeDelete, 'function');
  });

  await test('the owner can enable, disable, and re-enable only their configured gallery', async () => {
    const strapi = memory({});
    let tick = 0;
    const stamps = ['2026-10-11T15:00:00.000Z', '2026-10-11T18:00:00.000Z'];
    const service = serviceFor(strapi, { now: () => stamps[Math.min(tick++, stamps.length - 1)] });
    assert.strictEqual((await service.setPublication({ userId: null, updateId: 3, showOnRockSnaps: true })).error, 'unauthorized');
    assert.strictEqual((await service.setPublication({ userId: 2, updateId: 3, showOnRockSnaps: true })).error, 'forbidden');

    const enabled = await service.setPublication({ userId: 1, updateId: 3, showOnRockSnaps: true });
    assert.strictEqual(enabled.data.showOnRockSnaps, true);
    assert.strictEqual(enabled.data.rocksnapsPublishedAt, stamps[0]);

    const again = await service.setPublication({ userId: 1, updateId: 3, showOnRockSnaps: true });
    assert.strictEqual(again.data.rocksnapsPublishedAt, stamps[0]);
    assert.strictEqual(Object.prototype.hasOwnProperty.call(strapi.state.writes.at(-1).data, 'rocksnapsPublishedAt'), false);

    const off = await service.setPublication({ userId: 1, updateId: 3, showOnRockSnaps: false });
    assert.strictEqual(off.data.showOnRockSnaps, false);
    assert.strictEqual(strapi.state.galleries[0].rocksnapsPublishedAt, stamps[0]);

    const back = await service.setPublication({ userId: 1, updateId: 3, showOnRockSnaps: true });
    assert.strictEqual(back.data.rocksnapsPublishedAt, stamps[1]);
  });

  await test('another band owner cannot opt in, and a stranger cannot edit the RockSnaps gallery', async () => {
    const other = gallery({
      id: 8,
      slug: 'other-show',
      showOnRockSnaps: false,
      band: { id: 8, name: 'Other', slug: 'otherband' },
    });
    const strapi = memory({ galleries: [gallery({ showOnRockSnaps: false }), other] });
    strapi.entityService.findOne = async (uid, id) => {
      if (String(uid).includes('band')) {
        if (Number(id) === 9) return strapi.state.band;
        if (Number(id) === 8) return { id: 8, name: 'Other', slug: 'otherband' };
        return null;
      }
      return strapi.state.galleries.find((row) => Number(row.id) === Number(id)) || null;
    };
    const service = serviceFor(strapi);
    const ownAttempt = await service.setPublication({ userId: 2, updateId: 8, showOnRockSnaps: true });
    assert.strictEqual(ownAttempt.error, 'not_found');
    assert.strictEqual(strapi.state.writes.length, 0);
    const cross = await service.setPublication({ userId: 2, updateId: 3, showOnRockSnaps: true });
    assert.strictEqual(cross.error, 'forbidden');
  });

  await test('hidden and non-public galleries are refused, and the public API hides them', async () => {
    const hidden = gallery({ id: 3, status: 'hidden', showOnRockSnaps: true });
    const fans = gallery({ id: 5, slug: 'fans', visibility: 'fan_list', showOnRockSnaps: false });
    const live = gallery({ id: 4, slug: 'stage', rocksnapsPublishedAt: '2026-10-11T12:00:00.000Z' });
    const strapi = memory({ galleries: [hidden, fans, live] });
    const service = serviceFor(strapi);
    assert.strictEqual((await service.setPublication({ userId: 1, updateId: 3, showOnRockSnaps: true })).error, 'ineligible');
    assert.strictEqual((await service.setPublication({ userId: 1, updateId: 5, showOnRockSnaps: true })).error, 'ineligible');
    const list = await service.listPublic({});
    assert.deepStrictEqual(list.data.map((row) => row.slug), ['stage']);
    assert.strictEqual((await service.getPublic({ slug: 'local-room' })).error, 'not_found');
    assert.strictEqual((await service.getPublic({ slug: 'fans' })).error, 'not_found');
    const detail = await service.getPublic({ slug: 'stage' });
    assert.strictEqual(detail.data.slug, 'stage');
    assert.strictEqual(detail.data.cover.url, 'https://cdn.example/p12.jpg');
  });

  await test('an unconfigured integration and a slug mismatch fail closed', async () => {
    const strapi = memory({});
    const unconfigured = createRocksnapsService(strapi, {
      config: { ok: false, bandId: null, expectedSlug: 'rocksnapsphotography' },
      authorize: () => ({ hasAccess: true }),
    });
    assert.strictEqual((await unconfigured.listPublic({})).error, 'not_found');
    assert.strictEqual((await unconfigured.getPublic({ slug: 'local-room' })).error, 'not_found');
    assert.strictEqual((await unconfigured.setPublication({ userId: 1, updateId: 3, showOnRockSnaps: true })).error, 'not_found');

    const mismatched = createRocksnapsService(strapi, {
      config: CONFIG,
      authorize: () => ({ hasAccess: true }),
    });
    strapi.state.band.slug = 'renamed';
    strapi.state.galleries[0].band = { ...strapi.state.band };
    assert.strictEqual((await mismatched.listPublic({})).error, 'not_found');
    assert.strictEqual((await mismatched.getPublic({ slug: 'local-room' })).error, 'not_found');
  });

  await test('the list is newest-first and paginated', async () => {
    const older = gallery({ id: 99, slug: 'older', rocksnapsPublishedAt: '2026-10-11T12:00:00.000Z' });
    const newer = gallery({ id: 2, slug: 'newer', rocksnapsPublishedAt: '2026-10-11T18:00:00.000Z' });
    const off = gallery({ id: 7, slug: 'off', showOnRockSnaps: false });
    const strapi = memory({ galleries: [older, off, newer] });
    const service = serviceFor(strapi);
    const list = await service.listPublic({ page: 1, pageSize: 1 });
    assert.deepStrictEqual(list.data.map((row) => row.slug), ['newer']);
    assert.strictEqual(list.meta.total, 2);
    assert.strictEqual(list.meta.pageCount, 2);
    const second = await service.listPublic({ page: 2, pageSize: 1 });
    assert.deepStrictEqual(second.data.map((row) => row.slug), ['older']);
  });

  console.log(`\n${passed} passed`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
