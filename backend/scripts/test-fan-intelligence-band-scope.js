'use strict';

/**
 * Fan Intelligence is explicitly band-scoped.
 *
 * Check-in is a primary acquisition path: a subscribed Fan created by
 * processShowCheckIn() must appear in the same band's Fan Intelligence list.
 *
 * Run: node scripts/test-fan-intelligence-band-scope.js
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const { resolveScopedBand } = require('../src/utils/fans/resolveScopedBand');
require.resolve(path.join(__dirname, '../src/utils/fans/resolveScopedBand.js'));

const controllerPath = path.join(__dirname, '../src/api/fan/controllers/fan.js');
const servicePath = path.join(__dirname, '../src/api/fan/services/fan.js');
const checkInPath = path.join(
  __dirname,
  '../src/api/fan-interaction/services/fan-interaction.js'
);

const controllerSrc = fs.readFileSync(controllerPath, 'utf8');
const serviceSrc = fs.readFileSync(servicePath, 'utf8');
const checkInSrc = fs.readFileSync(checkInPath, 'utf8');
const indexSrc = fs.readFileSync(path.join(__dirname, '../src/index.js'), 'utf8');
const routesSrc = fs.readFileSync(path.join(__dirname, '../src/api/fan/routes/fan.js'), 'utf8');

function sliceMethod(src, name) {
  const start = src.indexOf(`async ${name}(`);
  assert.notStrictEqual(start, -1, `missing ${name}()`);
  const next = src.indexOf('\n  async ', start + 10);
  return src.slice(start, next === -1 ? src.length : next);
}

// ---------------------------------------------------------------- source contracts

assert.doesNotMatch(controllerSrc, /getUserBand/);
assert.match(controllerSrc, /resolveScopedBand/);
assert.doesNotMatch(controllerSrc, /filters: \{ users_permissions_user: user\.id \}/);

const myFans = sliceMethod(controllerSrc, 'myFans');
assert.match(myFans, /ctx\.query\.bandId/);
assert.match(myFans, /viewFanIntelligence/);
assert.match(myFans, /bandId is required/);
assert.match(myFans, /getMyFans\(\{\s*bandId,/);
assert.match(myFans, /rethrowClientHttp/);
assert.doesNotMatch(myFans, /getUserBand/);

// Users-permissions must allow these actions or verify() throws before
// the controller (local SQLite: InternalServerError, not 403).
assert.match(indexSrc, /api::fan\.fan\.myFans/);
assert.match(indexSrc, /api::fan\.fan\.myFansAnalytics/);
assert.match(indexSrc, /ensureFanListPermissions\(strapi\)/);
assert.match(routesSrc, /path: '\/fans\/my-fans'/);
assert.match(routesSrc, /path: '\/fans\/my-fans-analytics'/);
assert.match(
  routesSrc.slice(routesSrc.indexOf('/fans/my-fans'), routesSrc.indexOf('/fans/my-fans-analytics') + 80),
  /plugin::users-permissions\.isAuthenticated/
);

const analytics = sliceMethod(controllerSrc, 'myFansAnalytics');
assert.match(analytics, /ctx\.query\.bandId/);
assert.match(analytics, /viewFanIntelligence/);
assert.match(analytics, /getMyFansAnalytics\(\{\s*bandId: scope\.bandId/);

const detail = sliceMethod(controllerSrc, 'fanDetail');
assert.doesNotMatch(detail, /resolveScopedBand/);
assert.match(detail, /fan\.band/);
assert.match(detail, /viewFanIntelligence/);
assert.match(detail, /Fan not found/);

const add = sliceMethod(controllerSrc, 'add');
assert.match(add, /body\.bandId/);
assert.match(add, /manageFanList/);

const importFn = sliceMethod(controllerSrc, 'import');
assert.match(importFn, /body\.bandId/);
assert.match(importFn, /manageFanList/);

const exportFn = sliceMethod(controllerSrc, 'export');
assert.match(exportFn, /ctx\.query\.bandId/);
assert.match(exportFn, /viewFanPII/);

const removeFn = sliceMethod(controllerSrc, 'removeFromList');
assert.match(removeFn, /fan\.band/);
assert.match(removeFn, /manageFanList/);

// List default: active Fan List, never removed, always the requested band.
const getMyFans = sliceMethod(serviceSrc, 'getMyFans');
assert.match(getMyFans, /const filters = \{ band: bandId \}/);
assert.match(getMyFans, /filters\.status = \{ \$ne: 'removed' \}/);

const getMyFansAnalytics = sliceMethod(serviceSrc, 'getMyFansAnalytics');
assert.match(getMyFansAnalytics, /band: bandId/);
assert.doesNotMatch(getMyFansAnalytics, /getUserBand/);
assert.match(getMyFansAnalytics, /countBandMultiCityAttendees/);
assert.doesNotMatch(getMyFansAnalytics, /COUNT\(DISTINCT fan\)/);
assert.match(sliceMethod(controllerSrc, 'myFansAnalytics'), /rethrowClientHttp/);

// Check-in creates a canonical subscribed Fan on the named band.
const processShowCheckIn = sliceMethod(checkInSrc, 'processShowCheckIn');
assert.match(processShowCheckIn, /status: 'subscribed'/);
assert.match(processShowCheckIn, /source: 'show_mode'/);
assert.match(processShowCheckIn, /band: bandId/);
assert.match(processShowCheckIn, /createFanIdempotent/);

// ---------------------------------------------------------------- resolveScopedBand

async function runResolveTests() {
  const calls = [];
  const strapi = {};
  const requireBandPermission = require('../src/utils/bandRoles').requireBandPermission;

  // Patch requireBandPermission via the helper's own module is not needed —
  // resolveScopedBand calls it with our fake strapi. We intercept by wrapping
  // the bandRoles export for this process... actually it already required
  // bandRoles. Drive it through a fake that we inject by stubbing the module
  // is heavier than inlining the contract: missing user / bad id never hit
  // the permission helper.

  const none = await resolveScopedBand(strapi, { state: {} }, 12, 'viewFanIntelligence');
  assert.deepStrictEqual(none, { error: 'unauthorized' });

  const missing = await resolveScopedBand(
    strapi,
    { state: { user: { id: 2 } } },
    undefined,
    'viewFanIntelligence'
  );
  assert.deepStrictEqual(missing, { error: 'band_id_required' });

  const zero = await resolveScopedBand(
    strapi,
    { state: { user: { id: 2 } } },
    '0',
    'viewFanIntelligence'
  );
  assert.deepStrictEqual(zero, { error: 'band_id_required' });

  const original = require.cache[require.resolve('../src/utils/bandRoles')];
  const bandRoles = require('../src/utils/bandRoles');
  const real = bandRoles.requireBandPermission;
  bandRoles.requireBandPermission = async (_strapi, userId, bandId, key) => {
    calls.push({ userId, bandId, key });
    if (Number(userId) === 2 && Number(bandId) === 12 && key === 'viewFanIntelligence') {
      return { role: 'owner', isOwner: true };
    }
    return null;
  };

  // Re-require so resolveScopedBand sees the stub.
  delete require.cache[require.resolve('../src/utils/fans/resolveScopedBand')];
  const { resolveScopedBand: scoped } = require('../src/utils/fans/resolveScopedBand');

  const forbidden = await scoped(
    strapi,
    { state: { user: { id: 2 } } },
    '99',
    'viewFanIntelligence'
  );
  assert.deepStrictEqual(forbidden, { error: 'forbidden' });

  const ok = await scoped(
    strapi,
    { state: { user: { id: 2 } } },
    '12',
    'viewFanIntelligence'
  );
  assert.strictEqual(ok.bandId, 12);
  assert.strictEqual(ok.access.role, 'owner');
  assert.deepStrictEqual(calls[calls.length - 1], {
    userId: 2,
    bandId: 12,
    key: 'viewFanIntelligence',
  });

  const otherBand = await scoped(
    strapi,
    { state: { user: { id: 2 } } },
    7,
    'viewFanIntelligence'
  );
  assert.deepStrictEqual(otherBand, { error: 'forbidden' });

  bandRoles.requireBandPermission = real;
  if (original) require.cache[require.resolve('../src/utils/bandRoles')] = original;
  delete require.cache[require.resolve('../src/utils/fans/resolveScopedBand')];
}

// ---------------------------------------------------------------- getMyFans + check-in contract

function matchesFilters(row, filters) {
  if (filters.band != null && Number(row.band) !== Number(filters.band)) return false;
  if (filters.status && filters.status.$ne) {
    if (row.status === filters.status.$ne) return false;
  } else if (filters.status && row.status !== filters.status) {
    return false;
  }
  return true;
}

async function runGetMyFansTests() {
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

  const serviceFile = require.resolve('../src/api/fan/services/fan.js');
  delete require.cache[serviceFile];
  const createService = require('../src/api/fan/services/fan.js');
  Module._load = originalLoad;

  const checkInFan = {
    id: 501,
    band: 12,
    status: 'subscribed',
    source: 'show_mode',
    subscribedAt: '2026-09-03T22:00:00.000Z',
    captureContext: 'show_mode',
    capturedDuringShowMode: true,
    checkedInShowCount: 1,
    email: 'checkin@example.test',
  };
  const existingFan = {
    id: 502,
    band: 12,
    status: 'subscribed',
    source: 'band_page',
    subscribedAt: '2026-08-01T12:00:00.000Z',
    email: 'existing@example.test',
  };
  const removedFan = {
    id: 503,
    band: 12,
    status: 'removed',
    source: 'show_mode',
    subscribedAt: '2026-09-03T21:00:00.000Z',
    email: 'removed@example.test',
  };
  const otherBandFan = {
    id: 504,
    band: 99,
    status: 'subscribed',
    source: 'show_mode',
    subscribedAt: '2026-09-03T22:00:00.000Z',
    email: 'otherband@example.test',
  };
  const store = [checkInFan, existingFan, removedFan, otherBandFan];

  const fakeStrapi = {
    entityService: {
      async findMany(uid, opts) {
        if (uid === 'api::fan-show-attendance.fan-show-attendance') return [];
        assert.strictEqual(uid, 'api::fan.fan');
        const rows = store.filter((row) => matchesFilters(row, opts.filters || {}));
        const start = opts.start || 0;
        const limit = opts.limit || rows.length;
        return rows.slice(start, start + limit).map((row) => ({ ...row }));
      },
      async count(uid, opts) {
        assert.strictEqual(uid, 'api::fan.fan');
        return store.filter((row) => matchesFilters(row, opts.filters || {})).length;
      },
    },
    service() {
      return {
        async calculateBatchEngagementScores() {
          return {};
        },
      };
    },
    log: { warn() {}, info() {} },
  };

  const svc = createService({ strapi: fakeStrapi });
  const listed = await svc.getMyFans({ bandId: 12, page: 1, pageSize: 25 });
  const ids = listed.data.map((f) => f.id).sort((a, b) => a - b);

  assert.deepStrictEqual(ids, [501, 502], 'check-in + existing subscribed appear; removed and other band do not');
  assert.strictEqual(listed.meta.pagination.total, 2);

  const checkInRow = listed.data.find((f) => f.id === 501);
  assert.strictEqual(checkInRow.source, 'show_mode');
  assert.strictEqual(checkInRow.status, 'subscribed');

  const bandB = await svc.getMyFans({ bandId: 99, page: 1, pageSize: 25 });
  assert.deepStrictEqual(bandB.data.map((f) => f.id), [504]);
  assert.ok(!bandB.data.some((f) => f.band === 12), 'Band B cannot read Band A fans');

  delete require.cache[serviceFile];
}

function runPermissionSyncContract() {
  const Database = require('better-sqlite3');
  const db = new Database(':memory:');
  db.exec(`
    CREATE TABLE up_roles (id INTEGER PRIMARY KEY, type TEXT);
    CREATE TABLE up_permissions (id INTEGER PRIMARY KEY, action TEXT);
    CREATE TABLE up_permissions_role_links (
      id INTEGER PRIMARY KEY,
      permission_id INTEGER,
      role_id INTEGER
    );
    INSERT INTO up_roles (id, type) VALUES (1, 'authenticated'), (2, 'public');
    INSERT INTO up_permissions (id, action) VALUES (18, 'api::fan.fan.removeFromList');
    INSERT INTO up_permissions_role_links (permission_id, role_id) VALUES (18, 1);
  `);

  const linked = (action) =>
    db
      .prepare(
        `SELECT r.type AS role_type
         FROM up_permissions p
         JOIN up_permissions_role_links l ON l.permission_id = p.id
         JOIN up_roles r ON r.id = l.role_id
         WHERE p.action = ?`
      )
      .all(action)
      .map((r) => r.role_type);

  assert.deepStrictEqual(linked('api::fan.fan.myFans'), [], 'pre-sync: myFans missing (this 500d)');
  assert.deepStrictEqual(linked('api::fan.fan.myFansAnalytics'), [], 'pre-sync: analytics missing');
  assert.deepStrictEqual(linked('api::fan.fan.removeFromList'), ['authenticated']);

  const actions = [
    'api::fan.fan.removeFromList',
    'api::fan.fan.myFans',
    'api::fan.fan.myFansAnalytics',
    'api::fan.fan.fanDetail',
  ];
  const authRole = db.prepare(`SELECT id FROM up_roles WHERE type = 'authenticated'`).get();
  for (const action of actions) {
    const existing = db
      .prepare(
        `SELECT p.id FROM up_permissions p
         JOIN up_permissions_role_links l ON l.permission_id = p.id
         WHERE p.action = ? AND l.role_id = ?`
      )
      .get(action, authRole.id);
    if (existing) continue;
    const info = db.prepare(`INSERT INTO up_permissions (action) VALUES (?)`).run(action);
    db.prepare(`INSERT INTO up_permissions_role_links (permission_id, role_id) VALUES (?, ?)`).run(
      info.lastInsertRowid,
      authRole.id
    );
  }

  assert.deepStrictEqual(linked('api::fan.fan.myFans'), ['authenticated']);
  assert.deepStrictEqual(linked('api::fan.fan.myFansAnalytics'), ['authenticated']);
  assert.deepStrictEqual(linked('api::fan.fan.fanDetail'), ['authenticated']);
  assert.deepStrictEqual(linked('api::fan.fan.removeFromList'), ['authenticated']);
  assert.deepStrictEqual(linked('api::fan.fan.myFans').includes('public'), false);
  db.close();
}

async function main() {
  await runResolveTests();
  await runGetMyFansTests();
  runPermissionSyncContract();
  console.log('test-fan-intelligence-band-scope: ok');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
