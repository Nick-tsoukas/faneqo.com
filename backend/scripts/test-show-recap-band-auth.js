'use strict';

/**
 * Show Recap history authorization: owner + manager, band-scoped, no leakage.
 *
 * Run: node scripts/test-show-recap-band-auth.js
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const {
  resolveAuthorizedWorkspaceBand,
  VIEW_NIGHT_HISTORY_PERMISSION,
} = require('../src/utils/bands/resolveAuthorizedWorkspaceBand');

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

function sliceMethod(src, name) {
  const start = src.indexOf(`async ${name}(`);
  assert.notStrictEqual(start, -1, `missing ${name}()`);
  const next = src.indexOf('\n  async ', start + 10);
  return src.slice(start, next === -1 ? src.length : next);
}

function bandRow(id, ownerId, extra = {}) {
  return {
    id,
    name: extra.name || `Band ${id}`,
    slug: extra.slug || `band-${id}`,
    users_permissions_user: ownerId ? { id: ownerId } : null,
    ...extra,
  };
}

function recapRow({ id, bandId, generatedAt, campaignId }) {
  return {
    id,
    band: { id: bandId, name: `Band ${bandId}`, slug: `band-${bandId}` },
    campaignId: campaignId || `sm_${id}`,
    showTitle: `Night ${id}`,
    venue: `Venue ${id}`,
    recapGeneratedAt: generatedAt,
    checkedInShowCount: 0,
    coverImage: null,
    heroImage: null,
  };
}

function makeStrapi({
  bands = {},
  recaps = [],
  members = [],
} = {}) {
  const strapi = {
    log: { info() {}, warn() {}, error() {} },
    entityService: {
      async findOne(uid, id) {
        if (uid === 'api::band.band') {
          return bands[Number(id)] || bands[id] || null;
        }
        if (uid === 'api::show-recap.show-recap') {
          return recaps.find((row) => Number(row.id) === Number(id)) || null;
        }
        if (uid === 'api::event.event') return null;
        return null;
      },
      async findMany(uid, query = {}) {
        const filters = query.filters || {};
        if (uid === 'api::band.band') {
          let rows = Object.values(bands);
          if (filters.users_permissions_user != null) {
            rows = rows.filter((row) => (
              Number(row.users_permissions_user?.id) === Number(filters.users_permissions_user)
            ));
          }
          return rows.slice(0, query.limit || 50);
        }
        if (uid === 'api::band-member.band-member') {
          return members.filter((row) => {
            const rowBandId = row.band?.id || row.band;
            const rowUserId = row.user?.id || row.user;
            if (filters.band != null && Number(rowBandId) !== Number(filters.band)) return false;
            if (filters.user != null && Number(rowUserId) !== Number(filters.user)) return false;
            if (filters.status && row.status !== filters.status) return false;
            return true;
          }).slice(0, query.limit || 100);
        }
        if (uid === 'api::show-recap.show-recap') {
          let rows = recaps.filter((row) => {
            if (filters.band != null && Number(row.band?.id || row.band) !== Number(filters.band)) {
              return false;
            }
            if (filters.campaignId && row.campaignId !== filters.campaignId) return false;
            return true;
          });
          if (query.sort?.recapGeneratedAt === 'desc') {
            rows = rows.slice().sort((a, b) => (
              String(b.recapGeneratedAt).localeCompare(String(a.recapGeneratedAt))
            ));
          }
          const start = query.start || 0;
          const limit = query.limit == null ? rows.length : query.limit;
          return rows.slice(start, start + limit);
        }
        if (
          uid === 'api::fan.fan'
          || uid === 'api::fan-interaction.fan-interaction'
          || uid === 'api::fan-show-attendance.fan-show-attendance'
        ) {
          return [];
        }
        return [];
      },
      async count(uid, query = {}) {
        const rows = await strapi.entityService.findMany(uid, {
          ...(query || {}),
          start: 0,
          limit: 10000,
        });
        return rows.length;
      },
      async create(uid, { data }) {
        if (uid === 'api::band-member.band-member') {
          const row = { id: members.length + 1, ...data };
          members.push(row);
          return row;
        }
        return { id: 1, ...data };
      },
    },
    service() {
      return {
        async calculateBatchEngagementScores() {
          return {};
        },
      };
    },
  };
  return strapi;
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

function seedTwoBands() {
  const bands = {
    10: bandRow(10, 1, { name: 'Band A', slug: 'band-a' }),
    20: bandRow(20, 9, { name: 'Band B', slug: 'band-b' }),
  };
  const recaps = [
    recapRow({ id: 101, bandId: 10, generatedAt: '2026-09-01T00:00:00.000Z' }),
    recapRow({ id: 102, bandId: 10, generatedAt: '2026-09-03T00:00:00.000Z' }),
    recapRow({ id: 201, bandId: 20, generatedAt: '2026-09-02T00:00:00.000Z' }),
    recapRow({ id: 202, bandId: 20, generatedAt: '2026-09-04T00:00:00.000Z' }),
    recapRow({ id: 203, bandId: 20, generatedAt: '2026-09-05T00:00:00.000Z' }),
  ];
  return { bands, recaps };
}

(async () => {
  console.log('\n=== Show Recap band authorization ===\n');
  const previousGlobal = global.strapi;

  const controllerSrc = fs.readFileSync(
    path.join(__dirname, '../src/api/show-recap/controllers/show-recap.js'),
    'utf8'
  );
  const serviceSrc = fs.readFileSync(
    path.join(__dirname, '../src/api/show-recap/services/show-recap.js'),
    'utf8'
  );

  await test('source: history handlers no longer use owner-only band lookup', () => {
    assert.strictEqual(VIEW_NIGHT_HISTORY_PERMISSION, 'viewShowMode');
    for (const name of ['myRecaps', 'latestRecap', 'recapDetail', 'generateRecap']) {
      const body = sliceMethod(controllerSrc, name);
      assert.doesNotMatch(body, /users_permissions_user/);
    }
    assert.match(sliceMethod(controllerSrc, 'myRecaps'), /listMyRecaps/);
    assert.match(sliceMethod(controllerSrc, 'latestRecap'), /getLatestForMe/);
    assert.match(sliceMethod(controllerSrc, 'recapDetail'), /getAuthorizedRecapDetail/);
    assert.match(sliceMethod(controllerSrc, 'generateRecap'), /operateShowMode/);
    assert.match(sliceMethod(controllerSrc, 'generateRecap'), /resolveAuthorizedWorkspaceBand/);
    assert.match(serviceSrc, /requireBandPermission/);
    assert.match(serviceSrc, /resolveAuthorizedWorkspaceBand/);
  });

  await test('source: Night GET/PATCH still use canonical band permission', () => {
    assert.match(serviceSrc, /requireBandPermission\(strapi, userId, bandId, 'viewShowMode'\)/);
    assert.match(serviceSrc, /requireBandPermission\(strapi, userId, bandId, 'editBand'\)/);
  });

  await test('owner workspace band resolves from users_permissions_user without a team row', async () => {
    const { bands } = seedTwoBands();
    const strapi = makeStrapi({ bands, members: [] });
    const scope = await resolveAuthorizedWorkspaceBand(strapi, 1, 'viewShowMode');
    assert.strictEqual(scope.bandId, 10);
    assert.strictEqual(scope.access.role, 'owner');
  });

  await test('manager workspace band resolves from active membership, not ownership', async () => {
    const { bands } = seedTwoBands();
    const strapi = makeStrapi({
      bands,
      members: [{
        band: { id: 10, name: 'Band A', slug: 'band-a' },
        user: 2,
        role: 'manager',
        status: 'active',
      }],
    });
    const none = await resolveAuthorizedWorkspaceBand(strapi, 2, 'viewShowMode');
    assert.strictEqual(none.bandId, 10);
    assert.strictEqual(none.access.role, 'manager');
    const owned = await resolveAuthorizedWorkspaceBand(strapi, 2, 'viewShowMode');
    assert.notStrictEqual(owned.error, 'none');
  });

  await test('multi-band: owned wins over team; hinted team band is verified', async () => {
    const { bands } = seedTwoBands();
    const strapi = makeStrapi({
      bands,
      members: [{
        band: { id: 20, name: 'Band B', slug: 'band-b' },
        user: 1,
        role: 'manager',
        status: 'active',
      }],
    });
    const workspace = await resolveAuthorizedWorkspaceBand(strapi, 1, 'viewShowMode');
    assert.strictEqual(workspace.bandId, 10);
    const hinted = await resolveAuthorizedWorkspaceBand(strapi, 1, 'viewShowMode', 20);
    assert.strictEqual(hinted.bandId, 20);
    const denied = await resolveAuthorizedWorkspaceBand(strapi, 1, 'viewShowMode', 999);
    assert.strictEqual(denied.error, 'forbidden');
  });

  await test('OWNER: my-recaps + latest/me succeed for owned band only', async () => {
    const { bands, recaps } = seedTwoBands();
    const strapi = makeStrapi({ bands, recaps, members: [] });
    const service = loadRecapService(strapi);
    const list = await service.listMyRecaps({ userId: 1, page: 1, pageSize: 10 });
    assert.strictEqual(list.error, undefined);
    assert.strictEqual(list.data.length, 2);
    assert.deepStrictEqual(list.data.map((row) => row.id), [102, 101]);
    assert.strictEqual(list.meta.pagination.total, 2);
    const latest = await service.getLatestForMe({ userId: 1 });
    assert.strictEqual(latest.data.id, 102);
  });

  await test('AUTHORIZED MANAGER: my-recaps + latest/me return Band A only', async () => {
    const { bands, recaps } = seedTwoBands();
    const strapi = makeStrapi({
      bands,
      recaps,
      members: [{
        band: { id: 10, name: 'Band A', slug: 'band-a' },
        user: 2,
        role: 'manager',
        status: 'active',
      }],
    });
    const service = loadRecapService(strapi);
    const list = await service.listMyRecaps({ userId: 2, page: 1, pageSize: 10 });
    assert.strictEqual(list.data.length, 2);
    assert.ok(list.data.every((row) => Number(row.band.id) === 10));
    assert.deepStrictEqual(list.data.map((row) => row.id), [102, 101]);
    const latest = await service.getLatestForMe({ userId: 2 });
    assert.strictEqual(latest.data.id, 102);
    assert.strictEqual(Number(latest.data.band.id), 10);
  });

  await test('UNAUTHORIZED: authenticated user cannot read Band A Nights', async () => {
    const { bands, recaps } = seedTwoBands();
    const strapi = makeStrapi({ bands, recaps, members: [] });
    const service = loadRecapService(strapi);
    const list = await service.listMyRecaps({ userId: 77, page: 1, pageSize: 10 });
    assert.deepStrictEqual(list.data, []);
    assert.strictEqual(list.meta.pagination.total, 0);
    const latest = await service.getLatestForMe({ userId: 77 });
    assert.strictEqual(latest.data, null);
    const detail = await service.getAuthorizedRecapDetail({ userId: 77, recapId: 102 });
    assert.strictEqual(detail.error, 'forbidden');
    assert.strictEqual(detail.status, 403);
  });

  await test('CROSS-BAND: manager A does not see Band B Nights', async () => {
    const { bands, recaps } = seedTwoBands();
    const strapi = makeStrapi({
      bands,
      recaps,
      members: [{
        band: { id: 10, name: 'Band A', slug: 'band-a' },
        user: 2,
        role: 'manager',
        status: 'active',
      }],
    });
    const service = loadRecapService(strapi);
    const list = await service.listMyRecaps({ userId: 2, page: 1, pageSize: 10 });
    assert.strictEqual(list.data.length, 2);
    assert.ok(!list.data.some((row) => Number(row.band.id) === 20));
    const latest = await service.getLatestForMe({ userId: 2 });
    assert.notStrictEqual(latest.data.id, 203);
    const leak = await service.getAuthorizedRecapDetail({ userId: 2, recapId: 203 });
    assert.strictEqual(leak.error, 'forbidden');
    const hinted = await service.listMyRecaps({ userId: 2, page: 1, pageSize: 10, bandId: 20 });
    assert.strictEqual(hinted.error, 'forbidden');
  });

  await test('PAGINATION + newest-first preserved', async () => {
    const { bands, recaps } = seedTwoBands();
    const strapi = makeStrapi({
      bands,
      recaps,
      members: [{
        band: { id: 20, name: 'Band B', slug: 'band-b' },
        user: 3,
        role: 'manager',
        status: 'active',
      }],
    });
    const service = loadRecapService(strapi);
    const page1 = await service.listMyRecaps({ userId: 3, page: 1, pageSize: 2 });
    assert.strictEqual(page1.data.length, 2);
    assert.deepStrictEqual(page1.data.map((row) => row.id), [203, 202]);
    assert.strictEqual(page1.meta.pagination.page, 1);
    assert.strictEqual(page1.meta.pagination.pageSize, 2);
    assert.strictEqual(page1.meta.pagination.pageCount, 2);
    assert.strictEqual(page1.meta.pagination.total, 3);
    const page2 = await service.listMyRecaps({ userId: 3, page: 2, pageSize: 2 });
    assert.deepStrictEqual(page2.data.map((row) => row.id), [201]);
    assert.strictEqual(page2.meta.pagination.page, 2);
    assert.strictEqual(page2.meta.pagination.pageCount, 2);
    assert.strictEqual(page2.meta.pagination.total, 3);
  });

  await test('EMPTY: authorized band with zero Nights keeps empty page', async () => {
    const bands = { 10: bandRow(10, 1, { name: 'Band A', slug: 'band-a' }) };
    const strapi = makeStrapi({
      bands,
      recaps: [],
      members: [{
        band: { id: 10, name: 'Band A', slug: 'band-a' },
        user: 2,
        role: 'manager',
        status: 'active',
      }],
    });
    const service = loadRecapService(strapi);
    const list = await service.listMyRecaps({ userId: 2, page: 1, pageSize: 10 });
    assert.deepStrictEqual(list.data, []);
    assert.strictEqual(list.meta.pagination.page, 1);
    assert.strictEqual(list.meta.pagination.pageSize, 10);
    assert.strictEqual(list.meta.pagination.pageCount, 0);
    assert.strictEqual(list.meta.pagination.total, 0);
    const latest = await service.getLatestForMe({ userId: 2 });
    assert.strictEqual(latest.data, null);
  });

  await test('generateRecap auth: manager can operate workspace band; viewer/stranger cannot', async () => {
    const { bands } = seedTwoBands();
    const strapi = makeStrapi({
      bands,
      members: [
        {
          band: { id: 10, name: 'Band A', slug: 'band-a' },
          user: 2,
          role: 'manager',
          status: 'active',
        },
        {
          band: { id: 10, name: 'Band A', slug: 'band-a' },
          user: 4,
          role: 'viewer',
          status: 'active',
        },
      ],
    });
    const manager = await resolveAuthorizedWorkspaceBand(strapi, 2, 'operateShowMode');
    assert.strictEqual(manager.bandId, 10);
    const viewer = await resolveAuthorizedWorkspaceBand(strapi, 4, 'operateShowMode');
    assert.strictEqual(viewer.error, 'none');
    const stranger = await resolveAuthorizedWorkspaceBand(strapi, 77, 'operateShowMode');
    assert.strictEqual(stranger.error, 'none');
  });

  await test('recapDetail: manager can open Band A Night; owner still can', async () => {
    const { bands, recaps } = seedTwoBands();
    const strapi = makeStrapi({
      bands,
      recaps,
      members: [{
        band: { id: 10, name: 'Band A', slug: 'band-a' },
        user: 2,
        role: 'manager',
        status: 'active',
      }],
    });
    const service = loadRecapService(strapi);
    const manager = await service.getAuthorizedRecapDetail({ userId: 2, recapId: 102 });
    assert.strictEqual(manager.error, undefined);
    assert.strictEqual(manager.data.id, 102);
    const owner = await service.getAuthorizedRecapDetail({ userId: 1, recapId: 101 });
    assert.strictEqual(owner.data.id, 101);
  });

  global.strapi = previousGlobal;

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed) process.exit(1);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
