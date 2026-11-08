'use strict';

/**
 * Emergency security repair — regression tests.
 *
 * Locks in the September 2026 lockdown of routes that shipped `auth: false`:
 *   - PUT /qrs/:id/fix-band/:bandId and GET /qrs/:id/debug-band (unregistered)
 *   - band-external-account / band-external-metric HTTP surface (unregistered)
 *   - private analytics reads (now authenticated + band-scoped)
 *
 * The analytics gate is exercised behaviorally against a fake strapi, so these
 * are real authorization assertions and not just grep over source text.
 *
 * Run: node scripts/test-public-route-lockdown.js
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.join(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(repoRoot, rel), 'utf8');

let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    passed += 1;
    console.log(`  PASS  ${name}`);
  } catch (err) {
    failed += 1;
    console.error(`  FAIL  ${name}`);
    console.error(`        ${err.message}`);
  }
}

/**
 * Strip comments so an assertion about executable code cannot be satisfied
 * (or broken) by prose in a doc block.
 */
function codeOnly(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
}

/** Minimal strapi double covering what bandRoles + analyticsAccess touch. */
function fakeStrapi({ bands = [], members = [], events = [], qrs = [], users = [], jwt = {} } = {}) {
  const calls = [];
  return {
    calls,
    log: { warn() {}, error() {}, info() {}, debug() {} },
    plugins: {
      'users-permissions': {
        services: {
          jwt: {
            async verify(token) {
              calls.push({ op: 'jwt.verify', token });
              if (!Object.prototype.hasOwnProperty.call(jwt, token)) {
                throw new Error('Invalid token');
              }
              return jwt[token];
            },
          },
        },
      },
    },
    db: {
      query(uid) {
        return {
          async findOne(opts) {
            calls.push({ op: 'db.findOne', uid, opts });
            if (uid !== 'plugin::users-permissions.user') return null;
            return users.find((u) => String(u.id) === String(opts?.where?.id)) || null;
          },
        };
      },
    },
    entityService: {
      async findMany(uid, opts = {}) {
        calls.push({ op: 'findMany', uid, opts });
        if (uid === 'api::band-member.band-member') {
          const { band, user, status } = opts.filters || {};
          return members.filter(
            (m) =>
              String(m.band) === String(band) &&
              String(m.user) === String(user) &&
              (status === undefined || m.status === status)
          );
        }
        if (uid === 'api::band.band') {
          const slug = opts.filters?.slug;
          return bands.filter((b) => b.slug === slug);
        }
        return [];
      },
      async findOne(uid, id, opts = {}) {
        calls.push({ op: 'findOne', uid, id, opts });
        if (uid === 'api::band.band') {
          return bands.find((b) => String(b.id) === String(id)) || null;
        }
        if (uid === 'api::event.event') {
          return events.find((e) => String(e.id) === String(id)) || null;
        }
        if (uid === 'api::qr.qr') {
          return qrs.find((q) => String(q.id) === String(id)) || null;
        }
        return null;
      },
      async create(uid, opts) {
        calls.push({ op: 'create', uid, opts });
        return { id: 999 };
      },
    },
  };
}

const anonCtx = () => ({ state: {} });
const userCtx = (id) => ({ state: { user: { id } } });

async function main() {
  const access = require('../src/api/analytics/services/analyticsAccess');

  console.log('\n[1] QR repair/debug routes are removed from registration');

  await test('the fix-band route file no longer exists', () => {
    const routeFile = path.join(repoRoot, 'src/api/qr/routes/fix-band.js');
    assert.ok(!fs.existsSync(routeFile), 'src/api/qr/routes/fix-band.js must be deleted');
  });

  await test('no route file re-exposes fix-band or debug-band', () => {
    const routesDir = path.join(repoRoot, 'src/api/qr/routes');
    for (const file of fs.readdirSync(routesDir)) {
      const src = codeOnly(fs.readFileSync(path.join(routesDir, file), 'utf8'));
      assert.ok(!/fix-band/.test(src), `${file} still registers a fix-band path`);
      assert.ok(!/debug-band/.test(src), `${file} still registers a debug-band path`);
    }
  });

  await test('qr.fixBand no longer writes the band relation', () => {
    const src = codeOnly(read('src/api/qr/controllers/qr.js'));
    const body = src.slice(src.indexOf('async fixBand('), src.indexOf('async lookup('));
    assert.ok(/notFound/.test(body), 'fixBand must refuse with notFound');
    assert.ok(!/entityService\.update/.test(body), 'fixBand must not update any entity');
    assert.ok(!/data:\s*\{/.test(body), 'fixBand must not build a write payload');
  });

  await test('qr.debugBand no longer reads QR internals', () => {
    const src = codeOnly(read('src/api/qr/controllers/qr.js'));
    const body = src.slice(src.indexOf('async debugBand('), src.indexOf('async fixBand('));
    assert.ok(/notFound/.test(body), 'debugBand must refuse with notFound');
    assert.ok(!/entityService\.findOne/.test(body), 'debugBand must not read entities');
    assert.ok(!/db\.query/.test(body), 'debugBand must not run raw queries');
  });

  console.log('\n[1b] GET /qrs is authenticated and server-scoped');

  const qrScope = require('../src/utils/qrScope');
  const qrRoutes = require('../src/api/qr/routes/qr').routes;
  const qrByKey = new Map(qrRoutes.map((r) => [`${r.method} ${r.path}`, r]));

  await test('GET /qrs requires authentication', () => {
    const route = qrByKey.get('GET /qrs');
    assert.ok(route, 'GET /qrs is missing');
    assert.notStrictEqual(route.config?.auth, false, 'GET /qrs must not declare auth: false');
    assert.ok(
      (route.config?.policies || []).includes('plugin::users-permissions.isAuthenticated'),
      'GET /qrs must carry the isAuthenticated policy'
    );
  });

  await test('the public QR lookup endpoint is preserved', () => {
    // Intentionally public: the directqr redirect resolves a scanned code
    // before any session exists. Minimal redirect payload only.
    const lookup = require('../src/api/qr/routes/qr-lookup').routes;
    assert.strictEqual(lookup.length, 1, 'qr-lookup should register exactly one route');
    assert.strictEqual(lookup[0].path, '/qrs/lookup');
    assert.strictEqual(lookup[0].config.auth, false, 'lookup must stay public');
  });

  await test('the public lookup payload stays minimal', () => {
    const src = codeOnly(read('src/api/qr/controllers/qr.js'));
    const body = src.slice(src.indexOf('async lookup('), src.indexOf('async find('));
    // Inspect only what is returned to the anonymous caller, not the internal
    // matching logic above it.
    const payload = body.slice(body.indexOf('return {'), body.indexOf('} catch'));
    assert.ok(payload.length > 0, 'could not locate the lookup return payload');
    for (const leak of ['users_permissions_user', 'options', 'scans', 'email']) {
      assert.ok(!new RegExp(leak).test(payload), `lookup must not return ${leak}`);
    }
    assert.ok(/q_type/.test(payload), 'lookup should still return the redirect fields');
  });

  await test('the unscoped fallback listing is gone', () => {
    const src = codeOnly(read('src/api/qr/controllers/qr.js'));
    const body = src.slice(src.indexOf('async find('));
    assert.ok(
      !/super\.find/.test(body),
      'super.find(ctx) returned every QR in the system when no filter was supplied'
    );
    assert.ok(/resolveQrListScope/.test(body), 'find must derive its scope server-side');
    assert.ok(/sanitizeOutput/.test(body), 'entityService results must be sanitized');
  });

  await test('caller-supplied filters are never merged into the query', () => {
    // This is the exact mechanism of the original hole: the handler read
    // filters[users_permissions_user][id][$eq] from the caller. Scope must come
    // only from resolveQrListScope, so the query filter has nowhere to land.
    const src = codeOnly(read('src/api/qr/controllers/qr.js'));
    const body = src.slice(src.indexOf('async find('));
    const destructured = body.slice(0, body.indexOf('entityService'));
    assert.ok(
      !/\bfilters\b[^\n]*=[^\n]*ctx\.query|ctx\.query[^\n]*\bfilters\b/.test(destructured),
      'find must not read filters off ctx.query'
    );
    assert.ok(
      /filters:\s*scope\.filters/.test(body),
      'the entityService call must use the server-derived filters verbatim'
    );
    assert.ok(
      !/\.\.\.\s*(filters|ctx\.query)/.test(body),
      'nothing may spread caller query state into the filters'
    );
  });

  await test('the count query is scoped the same way as the list', () => {
    // A mismatched count would leak the size of another band's QR set.
    const src = codeOnly(read('src/api/qr/controllers/qr.js'));
    const body = src.slice(src.indexOf('async find('));
    const countCall = body.slice(body.indexOf('entityService.count'));
    assert.ok(
      /filters:\s*scope\.filters/.test(countCall.slice(0, 200)),
      'count must reuse scope.filters'
    );
  });

  await test('anonymous QR list request is rejected 401', async () => {
    const strapi = fakeStrapi({});
    const res = await qrScope.resolveQrListScope(anonCtx(), strapi);
    assert.strictEqual(res.ok, false);
    assert.strictEqual(res.status, 401);
  });

  await test('scope is the session user, not the query parameter', async () => {
    const strapi = fakeStrapi({});
    const ctx = {
      state: { user: { id: 5 } },
      // The forged filter that used to be the authorization input.
      query: { filters: { users_permissions_user: { id: { $eq: 99 } } } },
    };
    const res = await qrScope.resolveQrListScope(ctx, strapi);
    assert.strictEqual(res.ok, true);
    assert.deepStrictEqual(
      res.filters,
      { users_permissions_user: { id: 5 } },
      'a caller must not list another user by changing filters[users_permissions_user]'
    );
  });

  await test('omitting the filter no longer widens the scope', async () => {
    const strapi = fakeStrapi({});
    const res = await qrScope.resolveQrListScope({ state: { user: { id: 5 } }, query: {} }, strapi);
    assert.strictEqual(res.ok, true);
    assert.deepStrictEqual(res.filters, { users_permissions_user: { id: 5 } });
  });

  await test('a band manager may list that band QRs', async () => {
    const strapi = fakeStrapi({
      bands: [{ id: 7, users_permissions_user: { id: 1 } }],
      members: [{ band: 7, user: 55, role: 'manager', status: 'active' }],
    });
    const ctx = { state: { user: { id: 55 } }, query: { bandId: '7' } };
    const res = await qrScope.resolveQrListScope(ctx, strapi);
    assert.strictEqual(res.ok, true);
    assert.deepStrictEqual(res.filters, { band: { id: 7 } });
  });

  await test('a stranger cannot list a band QRs by passing bandId', async () => {
    const strapi = fakeStrapi({ bands: [{ id: 7, users_permissions_user: { id: 1 } }] });
    const ctx = { state: { user: { id: 42 } }, query: { bandId: '7' } };
    const res = await qrScope.resolveQrListScope(ctx, strapi);
    assert.strictEqual(res.ok, false);
    assert.strictEqual(res.status, 403);
  });

  await test('a band viewer cannot list QRs (matches owns-qr owner/manager rule)', async () => {
    const strapi = fakeStrapi({
      bands: [{ id: 7, users_permissions_user: { id: 1 } }],
      members: [{ band: 7, user: 55, role: 'viewer', status: 'active' }],
    });
    const ctx = { state: { user: { id: 55 } }, query: { bandId: '7' } };
    const res = await qrScope.resolveQrListScope(ctx, strapi);
    assert.strictEqual(res.ok, false);
    assert.strictEqual(res.status, 403);
  });

  await test('band id is also read from the Strapi filter shape', async () => {
    const strapi = fakeStrapi({ bands: [{ id: 7, users_permissions_user: { id: 1 } }] });
    const ctx = {
      state: { user: { id: 1 } },
      query: { filters: { band: { id: { $eq: '7' } } } },
    };
    const res = await qrScope.resolveQrListScope(ctx, strapi);
    assert.strictEqual(res.ok, true);
    assert.deepStrictEqual(res.filters, { band: { id: 7 } });
  });

  await test('a junk band id falls back to the caller own QRs, never wider', async () => {
    const strapi = fakeStrapi({});
    for (const bandId of ['abc', '-1', '0', '', null, '7.5']) {
      const res = await qrScope.resolveQrListScope(
        { state: { user: { id: 5 } }, query: { bandId } },
        strapi
      );
      assert.strictEqual(res.ok, true, `bandId=${bandId} should fall back, not error`);
      assert.deepStrictEqual(
        res.filters,
        { users_permissions_user: { id: 5 } },
        `bandId=${bandId} must not widen the scope`
      );
    }
  });

  await test('page size is clamped so one request cannot dump the table', () => {
    assert.strictEqual(qrScope.resolveListPagination({ pageSize: 100000 }).limit, qrScope.MAX_PAGE_SIZE);
    assert.strictEqual(qrScope.resolveListPagination({}).limit, qrScope.DEFAULT_PAGE_SIZE);
    assert.strictEqual(qrScope.resolveListPagination({ pageSize: 10 }).limit, 10);
    assert.strictEqual(qrScope.resolveListPagination({ start: -5 }).start, 0);
  });

  console.log('\n[2] band-external-* HTTP surface is unregistered');

  await test('band-external-account registers no routes', () => {
    const mod = require('../src/api/band-external-account/routes/band-external-account');
    assert.deepStrictEqual(mod.routes, []);
  });

  await test('band-external-metric registers no routes', () => {
    const mod = require('../src/api/band-external-metric/routes/band-external-metric');
    assert.deepStrictEqual(mod.routes, []);
  });

  await test('no band-external route file contains auth: false', () => {
    for (const api of ['band-external-account', 'band-external-metric']) {
      const src = codeOnly(read(`src/api/${api}/routes/${api}.js`));
      assert.ok(!/auth:\s*false/.test(src), `${api} still declares auth: false`);
    }
  });

  await test('band-external-metric upsert requires band edit access', () => {
    const src = codeOnly(read('src/api/band-external-metric/controllers/band-external-metric.js'));
    const body = src.slice(src.indexOf('async upsert('), src.indexOf('async latest('));
    assert.ok(/ctx\.state\.user/.test(body), 'upsert must require an authenticated caller');
    assert.ok(/requireBandPermission/.test(body), 'upsert must check band permission');
    assert.ok(/'editBand'/.test(body), 'upsert is a write: it must require editBand');
    // The gate has to precede the write, not trail it.
    assert.ok(
      body.indexOf('requireBandPermission') < body.indexOf('entityService.update'),
      'upsert must authorize before writing'
    );
    assert.ok(
      body.indexOf('requireBandPermission') < body.indexOf('entityService.create'),
      'upsert must authorize before creating'
    );
  });

  await test('band-external-metric latest requires band analytics access', () => {
    const src = codeOnly(read('src/api/band-external-metric/controllers/band-external-metric.js'));
    const body = src.slice(src.indexOf('async latest('));
    assert.ok(/ctx\.state\.user/.test(body), 'latest must require an authenticated caller');
    assert.ok(/'viewAnalytics'/.test(body), 'latest must require viewAnalytics');
    assert.ok(
      body.indexOf('requireBandPermission') < body.indexOf('entityService.findMany'),
      'latest must authorize before reading'
    );
  });

  console.log('\n[3] Analytics route configuration');

  const PRIVATE_PATHS = [
    '/analytics/dashboard-glance',
    '/analytics/rollups',
    '/analytics/geo',
    '/analytics/transitions',
    '/analytics/follows',
    '/analytics/event-rollups',
    '/analytics/event-geo',
    '/analytics/event-sources',
    '/analytics/event-devices',
    '/analytics/qr-rollups',
    '/analytics/qr-geo',
    '/analytics/qr-sources',
    '/analytics/qr-devices',
    '/analytics/pulse',
    '/analytics/geo-states',
    '/analytics/push/dry-run',
    '/pulse/whats-hot',
    '/pulse/shareables',
  ];

  // Reviewed and deliberately anonymous: tracking ingestion plus one asset
  // helper. Adding to this list is a security decision, so the test pins the
  // exact set. Rationale for each entry is documented in the routes file.
  const INTENTIONALLY_PUBLIC_PATHS = ['/pulse/shareables/track', '/image-proxy'];

  const analyticsRoutes = require('../src/api/analytics/routes/analytics').routes;
  const byPath = new Map(analyticsRoutes.map((r) => [r.path, r]));

  await test('every private analytics route requires authentication', () => {
    for (const p of PRIVATE_PATHS) {
      const route = byPath.get(p);
      assert.ok(route, `${p} is missing from the analytics routes`);
      assert.notStrictEqual(
        route.config?.auth,
        false,
        `${p} must not declare auth: false — that skips auth entirely`
      );
      assert.ok(
        (route.config?.policies || []).includes('plugin::users-permissions.isAuthenticated'),
        `${p} must carry the isAuthenticated policy`
      );
    }
  });

  await test('the public analytics surface is exactly the reviewed allowlist', () => {
    const publicPaths = analyticsRoutes
      .filter((r) => r.config?.auth === false)
      .map((r) => r.path)
      .sort();
    assert.deepStrictEqual(
      publicPaths,
      [...INTENTIONALLY_PUBLIC_PATHS].sort(),
      'an unreviewed route became public — add it to the allowlist deliberately or authenticate it'
    );
  });

  await test('every public analytics route is ingestion or a non-sensitive helper', () => {
    // A public GET that reads band-scoped data is the bug class we just fixed,
    // so the only public GET allowed here is the image proxy.
    for (const route of analyticsRoutes.filter((r) => r.config?.auth === false)) {
      if (route.method === 'GET') {
        assert.strictEqual(
          route.path,
          '/image-proxy',
          `public GET ${route.path} must be authenticated or justified in the routes header`
        );
      } else {
        assert.strictEqual(route.method, 'POST', `unexpected public method on ${route.path}`);
      }
    }
  });

  await test('the public surface is documented route by route', () => {
    const header = read('src/api/analytics/routes/analytics.js').slice(0, 2600);
    for (const p of INTENTIONALLY_PUBLIC_PATHS) {
      assert.ok(header.includes(p), `${p} is public but not documented in the routes header`);
    }
  });

  await test('no analytics route is both private and public', () => {
    for (const p of PRIVATE_PATHS) {
      assert.ok(
        !INTENTIONALLY_PUBLIC_PATHS.includes(p),
        `${p} appears in both the private and public lists`
      );
    }
  });

  await test('every private analytics handler gates before doing work', () => {
    const src = codeOnly(read('src/api/analytics/controllers/analytics.js'));
    const handlers = [
      'rollups',
      'geo',
      'transitions',
      'follows',
      'eventRollups',
      'eventGeo',
      'eventSources',
      'eventDevices',
      'qrRollups',
      'qrGeo',
      'qrSources',
      'qrDevices',
      'pulse',
      'geoStates',
      'pushDryRun',
    ];
    for (const name of handlers) {
      const start = src.indexOf(`async ${name}(ctx)`);
      assert.ok(start !== -1, `handler ${name} not found`);
      const head = src.slice(start, start + 400);
      assert.ok(
        /require(Band|Event|Qr|Entity)Analytics\(/.test(head),
        `${name} must call an analytics access gate`
      );
      assert.ok(
        /respondDenied/.test(head),
        `${name} must return the denial instead of continuing`
      );
      // The gate must run before the handler's try block starts reading data.
      assert.ok(
        head.indexOf('Analytics(') < head.indexOf('try {'),
        `${name} must gate before its try block`
      );
    }
  });

  console.log('\n[3b] Analytics GET handlers are read-only');

  // Handler source, comments stripped, from `async name(` to the next handler.
  const analyticsSrc = codeOnly(read('src/api/analytics/controllers/analytics.js'));
  const handlerBody = (src, name) => {
    const start = src.indexOf(`async ${name}(ctx)`);
    if (start === -1) return null;
    const rest = src.slice(start + 10);
    const nextIdx = rest.search(/\n\s{2}async \w+\(ctx\)/);
    return nextIdx === -1 ? rest : rest.slice(0, nextIdx);
  };

  const GET_HANDLERS = [
    'dashboardGlance',
    'rollups',
    'geo',
    'transitions',
    'follows',
    'eventRollups',
    'eventGeo',
    'eventSources',
    'eventDevices',
    'qrRollups',
    'qrGeo',
    'qrSources',
    'qrDevices',
    'pulse',
    'pushDryRun',
    'geoStates',
    'whatsHot',
    'pushOptInStatus',
    'imageProxy',
  ];

  await test('no analytics GET handler writes to the database', () => {
    const offenders = [];
    for (const name of GET_HANDLERS) {
      const body = handlerBody(analyticsSrc, name);
      assert.ok(body !== null, `handler ${name} not found`);
      if (/entityService\.(create|update|delete)/.test(body)) offenders.push(`${name}: entityService write`);
      if (/db\.query\([^)]*\)\.(create|update|delete)/.test(body)) offenders.push(`${name}: db write`);
    }
    assert.deepStrictEqual(offenders, [], `GET handlers mutating state: ${offenders.join(', ')}`);
  });

  await test('no analytics GET handler creates notifications', () => {
    const offenders = [];
    for (const name of GET_HANDLERS) {
      const body = handlerBody(analyticsSrc, name);
      if (/createSurgeNotifications|api::notification/.test(body)) offenders.push(name);
    }
    assert.deepStrictEqual(offenders, [], `GET handlers creating notifications: ${offenders.join(', ')}`);
  });

  await test('GET /analytics/pulse no longer writes a pulse snapshot', () => {
    const body = handlerBody(analyticsSrc, 'pulse');
    assert.ok(
      !/updateSnapshotAfterPush|evaluateSurgePush/.test(body),
      'pulse must not run the surge write path'
    );
    assert.ok(/readLatestSnapshot/.test(body), 'pulse should still read snapshot context');
    assert.ok(
      !/api::pulse-snapshot/.test(body),
      'pulse must go through the read helper, not address the snapshot collection directly'
    );
  });

  await test('the controller no longer imports the snapshot writers', () => {
    const imports = analyticsSrc.slice(0, analyticsSrc.indexOf('const uidPV'));
    assert.ok(!/createSurgeNotifications/.test(imports), 'writer must not be reachable from a GET controller');
    assert.ok(!/updateSnapshotAfterPush/.test(imports), 'writer must not be reachable from a GET controller');
  });

  await test('the snapshot write path moved to a scheduled job', () => {
    const svc = require('../src/api/analytics/services/pulseSnapshot');
    assert.strictEqual(typeof svc.refreshBandPulseSnapshot, 'function');
    assert.strictEqual(typeof svc.persistPulseSnapshot, 'function');
    assert.strictEqual(typeof svc.readLatestSnapshot, 'function');

    const cron = read('config/cron-tasks.js');
    assert.ok(
      /refreshBandPulseSnapshot/.test(cron),
      'the scheduled job must drive the snapshot refresh now that the GET does not'
    );
  });

  await test('pushDryRun stays a preview and writes nothing', () => {
    const body = handlerBody(analyticsSrc, 'pushDryRun');
    assert.ok(/evaluateSurgePush/.test(body), 'dry-run should still evaluate');
    assert.ok(!/createSurgeNotifications/.test(body), 'a dry run must not create notifications');
    assert.ok(!/entityService\.(create|update)/.test(body), 'a dry run must not persist anything');
  });

  await test('whats-hot and shareables are authenticated and band-scoped', () => {
    const body = handlerBody(analyticsSrc, 'whatsHot');
    assert.ok(/requireBandAnalytics/.test(body), 'whatsHot must gate on band access');
    assert.ok(
      body.indexOf('requireBandAnalytics') < body.indexOf('try {'),
      'whatsHot must gate before doing work'
    );

    const shareables = codeOnly(read('src/api/analytics/controllers/shareables.js'));
    const getBody = shareables.slice(shareables.indexOf('async getShareables('), shareables.indexOf('async trackShare('));
    assert.ok(/requireBandAnalytics/.test(getBody), 'getShareables must gate on band access');
    assert.ok(/respondDenied/.test(getBody), 'getShareables must return the denial');
    assert.ok(
      getBody.indexOf('requireBandAnalytics') < getBody.indexOf('evaluateShareables'),
      'getShareables must authorize before evaluating'
    );
  });

  await test('the public share tracker remains a write-only ingestion endpoint', () => {
    const shareables = codeOnly(read('src/api/analytics/controllers/shareables.js'));
    const body = shareables.slice(shareables.indexOf('async trackShare('));
    assert.ok(!/requireBandAnalytics/.test(body), 'anonymous fan shares must still be accepted');
    // It must not hand back artist data in exchange for a bandId.
    assert.ok(!/evaluateShareables|fetchWhatsHot|signals/.test(body), 'the tracker must not return artist data');
  });

  console.log('\n[4] Analytics access gate behavior');

  await test('anonymous band analytics request is rejected 401', async () => {
    const strapi = fakeStrapi({ bands: [{ id: 7, users_permissions_user: { id: 1 } }] });
    const res = await access.requireBandAnalytics(anonCtx(), strapi, 7);
    assert.strictEqual(res.ok, false);
    assert.strictEqual(res.status, 401);
  });

  await test('anonymous request does not touch the database', async () => {
    const strapi = fakeStrapi({ bands: [{ id: 7, users_permissions_user: { id: 1 } }] });
    await access.requireBandAnalytics(anonCtx(), strapi, 7);
    assert.strictEqual(strapi.calls.length, 0, 'auth must be checked before any query');
  });

  await test('authenticated stranger cannot read another band analytics', async () => {
    const strapi = fakeStrapi({ bands: [{ id: 7, users_permissions_user: { id: 1 } }] });
    const res = await access.requireBandAnalytics(userCtx(42), strapi, 7);
    assert.strictEqual(res.ok, false);
    assert.strictEqual(res.status, 403);
  });

  await test('band owner via legacy relation is allowed', async () => {
    const strapi = fakeStrapi({ bands: [{ id: 7, users_permissions_user: { id: 1 } }] });
    const res = await access.requireBandAnalytics(userCtx(1), strapi, 7);
    assert.strictEqual(res.ok, true);
    assert.strictEqual(res.bandId, 7);
  });

  await test('band member with viewer role is allowed to view analytics', async () => {
    const strapi = fakeStrapi({
      bands: [{ id: 7, users_permissions_user: { id: 1 } }],
      members: [{ band: 7, user: 55, role: 'viewer', status: 'active' }],
    });
    const res = await access.requireBandAnalytics(userCtx(55), strapi, 7);
    assert.strictEqual(res.ok, true);
  });

  await test('inactive band member is rejected', async () => {
    const strapi = fakeStrapi({
      bands: [{ id: 7, users_permissions_user: { id: 1 } }],
      members: [{ band: 7, user: 55, role: 'manager', status: 'revoked' }],
    });
    const res = await access.requireBandAnalytics(userCtx(55), strapi, 7);
    assert.strictEqual(res.ok, false);
    assert.strictEqual(res.status, 403);
  });

  await test('a guessed band id is not access', async () => {
    const strapi = fakeStrapi({
      bands: [
        { id: 7, users_permissions_user: { id: 1 } },
        { id: 8, users_permissions_user: { id: 2 } },
      ],
    });
    const mine = await access.requireBandAnalytics(userCtx(1), strapi, 7);
    const theirs = await access.requireBandAnalytics(userCtx(1), strapi, 8);
    assert.strictEqual(mine.ok, true);
    assert.strictEqual(theirs.ok, false, 'incrementing the id must not grant access');
  });

  await test('non-numeric band id is rejected without a query', async () => {
    const strapi = fakeStrapi({});
    const res = await access.requireBandAnalytics(userCtx(1), strapi, 'abc');
    assert.strictEqual(res.ok, false);
    assert.strictEqual(res.status, 400);
  });

  await test('event analytics authorizes against the owning band, not the event id', async () => {
    const strapi = fakeStrapi({
      bands: [{ id: 7, users_permissions_user: { id: 1 } }],
      events: [{ id: 30, band: { id: 7 } }],
    });
    const owner = await access.requireEventAnalytics(userCtx(1), strapi, 30);
    const stranger = await access.requireEventAnalytics(userCtx(42), strapi, 30);
    assert.strictEqual(owner.ok, true);
    assert.strictEqual(stranger.ok, false);
    assert.strictEqual(stranger.status, 403);
  });

  await test('anonymous event analytics request never loads the event', async () => {
    const strapi = fakeStrapi({ events: [{ id: 30, band: { id: 7 } }] });
    const res = await access.requireEventAnalytics(anonCtx(), strapi, 30);
    assert.strictEqual(res.status, 401);
    assert.strictEqual(strapi.calls.length, 0);
  });

  await test('event with no band is rejected rather than defaulting open', async () => {
    const strapi = fakeStrapi({ events: [{ id: 31, band: null }] });
    const res = await access.requireEventAnalytics(userCtx(1), strapi, 31);
    assert.strictEqual(res.ok, false);
    assert.strictEqual(res.status, 403);
  });

  await test('qr analytics authorizes via the owning band', async () => {
    const strapi = fakeStrapi({
      bands: [{ id: 7, users_permissions_user: { id: 1 } }],
      qrs: [{ id: 46, band: { id: 7 }, users_permissions_user: null }],
    });
    const owner = await access.requireQrAnalytics(userCtx(1), strapi, 46);
    const stranger = await access.requireQrAnalytics(userCtx(42), strapi, 46);
    assert.strictEqual(owner.ok, true);
    assert.strictEqual(stranger.ok, false);
  });

  await test('legacy per-user QR owner keeps access to their own scans', async () => {
    const strapi = fakeStrapi({
      qrs: [{ id: 12, band: null, users_permissions_user: { id: 9 } }],
    });
    const res = await access.requireQrAnalytics(userCtx(9), strapi, 12);
    assert.strictEqual(res.ok, true, 'pre-band QR owners must not be locked out');
  });

  await test('bandless QR is not readable by a stranger', async () => {
    const strapi = fakeStrapi({
      qrs: [{ id: 12, band: null, users_permissions_user: { id: 9 } }],
    });
    const res = await access.requireQrAnalytics(userCtx(42), strapi, 12);
    assert.strictEqual(res.ok, false);
    assert.strictEqual(res.status, 403);
  });

  await test('entity gate rejects an unknown entityType', async () => {
    const strapi = fakeStrapi({});
    const res = await access.requireEntityAnalytics(userCtx(1), strapi, 'fan', 1);
    assert.strictEqual(res.ok, false);
    assert.strictEqual(res.status, 400);
  });

  await test('entity gate routes band/event/qr to the right owner check', async () => {
    const strapi = fakeStrapi({
      bands: [{ id: 7, users_permissions_user: { id: 1 } }],
      events: [{ id: 30, band: { id: 7 } }],
      qrs: [{ id: 46, band: { id: 7 }, users_permissions_user: null }],
    });
    for (const [type, id] of [['band', 7], ['event', 30], ['qr', 46]]) {
      const owner = await access.requireEntityAnalytics(userCtx(1), strapi, type, id);
      assert.strictEqual(owner.ok, true, `${type} owner should be allowed`);
      const stranger = await access.requireEntityAnalytics(userCtx(42), strapi, type, id);
      assert.strictEqual(stranger.ok, false, `${type} stranger should be denied`);
    }
  });

  await test('an anonymous analytics request performs no write of any kind', async () => {
    // Any write attempt throws, so a mutation would surface as a failure here
    // rather than as a silently created row.
    const strapi = fakeStrapi({
      bands: [{ id: 7, users_permissions_user: { id: 1 } }],
      events: [{ id: 30, band: { id: 7 } }],
      qrs: [{ id: 46, band: { id: 7 }, users_permissions_user: null }],
    });
    strapi.entityService.create = async () => {
      throw new Error('anonymous request attempted a create');
    };
    strapi.entityService.update = async () => {
      throw new Error('anonymous request attempted an update');
    };
    strapi.entityService.delete = async () => {
      throw new Error('anonymous request attempted a delete');
    };

    for (const call of [
      () => access.requireBandAnalytics(anonCtx(), strapi, 7),
      () => access.requireEventAnalytics(anonCtx(), strapi, 30),
      () => access.requireQrAnalytics(anonCtx(), strapi, 46),
      () => access.requireEntityAnalytics(anonCtx(), strapi, 'band', 7),
    ]) {
      const res = await call();
      assert.strictEqual(res.ok, false, 'anonymous must be denied');
      assert.strictEqual(res.status, 401);
    }
  });

  await test('Band A owner cannot read or mutate Band B analytics', async () => {
    const strapi = fakeStrapi({
      bands: [
        { id: 101, slug: 'band-a', users_permissions_user: { id: 11 } },
        { id: 202, slug: 'band-b', users_permissions_user: { id: 22 } },
      ],
      events: [{ id: 303, band: { id: 202 } }],
      qrs: [{ id: 404, band: { id: 202 }, users_permissions_user: null }],
    });

    const ownerA = userCtx(11);

    const own = await access.requireBandAnalytics(ownerA, strapi, 101);
    assert.strictEqual(own.ok, true, 'Band A owner must still reach Band A');

    for (const [label, call] of [
      ['band', () => access.requireBandAnalytics(ownerA, strapi, 202)],
      ['event', () => access.requireEventAnalytics(ownerA, strapi, 303)],
      ['qr', () => access.requireQrAnalytics(ownerA, strapi, 404)],
      ['entity/band', () => access.requireEntityAnalytics(ownerA, strapi, 'band', 202)],
      ['entity/event', () => access.requireEntityAnalytics(ownerA, strapi, 'event', 303)],
      ['entity/qr', () => access.requireEntityAnalytics(ownerA, strapi, 'qr', 404)],
    ]) {
      const res = await call();
      assert.strictEqual(res.ok, false, `Band A owner reached Band B via ${label}`);
      assert.strictEqual(res.status, 403, `${label} should be forbidden, not ${res.status}`);
    }
  });

  await test('Band A manager cannot reach Band B either', async () => {
    const strapi = fakeStrapi({
      bands: [
        { id: 101, users_permissions_user: { id: 11 } },
        { id: 202, users_permissions_user: { id: 22 } },
      ],
      members: [{ band: 101, user: 33, role: 'manager', status: 'active' }],
    });
    const managerA = userCtx(33);
    assert.strictEqual((await access.requireBandAnalytics(managerA, strapi, 101)).ok, true);
    assert.strictEqual((await access.requireBandAnalytics(managerA, strapi, 202)).ok, false);
  });

  await test('Band A owner cannot list or mutate Band B QR codes', async () => {
    const strapi = fakeStrapi({
      bands: [
        { id: 101, users_permissions_user: { id: 11 } },
        { id: 202, users_permissions_user: { id: 22 } },
      ],
    });
    const qrScopeMod = require('../src/utils/qrScope');

    const own = await qrScopeMod.resolveQrListScope(
      { state: { user: { id: 11 } }, query: { bandId: 101 } },
      strapi
    );
    assert.strictEqual(own.ok, true);

    const other = await qrScopeMod.resolveQrListScope(
      { state: { user: { id: 11 } }, query: { bandId: 202 } },
      strapi
    );
    assert.strictEqual(other.ok, false);
    assert.strictEqual(other.status, 403);

    // And the filter shape cannot be used to smuggle Band B in either.
    const smuggled = await qrScopeMod.resolveQrListScope(
      {
        state: { user: { id: 11 } },
        query: { filters: { users_permissions_user: { id: { $eq: 22 } } } },
      },
      strapi
    );
    assert.strictEqual(smuggled.ok, true, 'falls back to own scope');
    assert.deepStrictEqual(
      smuggled.filters,
      { users_permissions_user: { id: 11 } },
      'scope must stay pinned to the session user'
    );
  });

  console.log('\n[4b] Caller identification survives route-config drift');

  // `auth: false` leaves ctx.state.user unset, which is how these routes became
  // readable in the first place. The gate must identify the caller itself.
  const bearerCtx = (token) => ({ state: {}, request: { headers: { authorization: `Bearer ${token}` } } });

  await test('a valid Bearer token is accepted when ctx.state.user is unset', async () => {
    const strapi = fakeStrapi({
      bands: [{ id: 7, users_permissions_user: { id: 1 } }],
      users: [{ id: 1, email: 'owner@example.com' }],
      jwt: { 'good-token': { id: 1 } },
    });
    const res = await access.requireBandAnalytics(bearerCtx('good-token'), strapi, 7);
    assert.strictEqual(res.ok, true, 'the band owner must still reach their analytics');
  });

  await test('a forged Bearer token is rejected', async () => {
    const strapi = fakeStrapi({
      bands: [{ id: 7, users_permissions_user: { id: 1 } }],
      users: [{ id: 1, email: 'owner@example.com' }],
      jwt: { 'good-token': { id: 1 } },
    });
    const res = await access.requireBandAnalytics(bearerCtx('forged-token'), strapi, 7);
    assert.strictEqual(res.ok, false);
    assert.strictEqual(res.status, 401);
  });

  await test('a valid token for another user grants no access', async () => {
    const strapi = fakeStrapi({
      bands: [{ id: 7, users_permissions_user: { id: 1 } }],
      users: [{ id: 42, email: 'stranger@example.com' }],
      jwt: { 'stranger-token': { id: 42 } },
    });
    const res = await access.requireBandAnalytics(bearerCtx('stranger-token'), strapi, 7);
    assert.strictEqual(res.ok, false);
    assert.strictEqual(res.status, 403);
  });

  await test('a token whose user no longer exists is rejected', async () => {
    const strapi = fakeStrapi({
      bands: [{ id: 7, users_permissions_user: { id: 1 } }],
      users: [],
      jwt: { 'deleted-user': { id: 1 } },
    });
    const res = await access.requireBandAnalytics(bearerCtx('deleted-user'), strapi, 7);
    assert.strictEqual(res.ok, false);
    assert.strictEqual(res.status, 401);
  });

  await test('a malformed Authorization header is rejected without a lookup', async () => {
    const strapi = fakeStrapi({ bands: [{ id: 7, users_permissions_user: { id: 1 } }] });
    const ctx = { state: {}, request: { headers: { authorization: 'good-token' } } };
    const res = await access.requireBandAnalytics(ctx, strapi, 7);
    assert.strictEqual(res.status, 401);
    assert.strictEqual(strapi.calls.length, 0, 'a non-Bearer header must not trigger any query');
  });

  await test('event and qr gates identify the caller the same way', async () => {
    const strapi = fakeStrapi({
      bands: [{ id: 7, users_permissions_user: { id: 1 } }],
      events: [{ id: 30, band: { id: 7 } }],
      qrs: [{ id: 46, band: { id: 7 }, users_permissions_user: null }],
      users: [{ id: 1, email: 'owner@example.com' }],
      jwt: { 'good-token': { id: 1 } },
    });
    const ev = await access.requireEventAnalytics(bearerCtx('good-token'), strapi, 30);
    const qr = await access.requireQrAnalytics(bearerCtx('good-token'), strapi, 46);
    assert.strictEqual(ev.ok, true);
    assert.strictEqual(qr.ok, true);
  });

  await test('event gate verifies the token once, not once per lookup', async () => {
    const strapi = fakeStrapi({
      bands: [{ id: 7, users_permissions_user: { id: 1 } }],
      events: [{ id: 30, band: { id: 7 } }],
      users: [{ id: 1, email: 'owner@example.com' }],
      jwt: { 'good-token': { id: 1 } },
    });
    await access.requireEventAnalytics(bearerCtx('good-token'), strapi, 30);
    const verifies = strapi.calls.filter((c) => c.op === 'jwt.verify').length;
    assert.strictEqual(verifies, 1, 'the event gate must reuse the resolved caller');
  });

  await test('follows slug lookup resolves to a band that is still authorized', async () => {
    const strapi = fakeStrapi({ bands: [{ id: 7, slug: 'the-band', users_permissions_user: { id: 1 } }] });
    const bandId = await access.resolveBandIdFromSlug(strapi, 'the-band');
    assert.strictEqual(bandId, 7);
    const stranger = await access.requireBandAnalytics(userCtx(42), strapi, bandId);
    assert.strictEqual(stranger.ok, false, 'knowing a public slug must not grant analytics');
  });

  console.log('\n[5] Production permission sync');

  await test('private analytics actions are granted to Authenticated at boot', () => {
    const src = read('src/index.js');
    assert.ok(/PRIVATE_ANALYTICS_ACTIONS/.test(src), 'missing PRIVATE_ANALYTICS_ACTIONS list');
    for (const action of [
      'rollups',
      'geo',
      'transitions',
      'follows',
      'eventRollups',
      'eventGeo',
      'eventSources',
      'eventDevices',
      'qrRollups',
      'qrGeo',
      'qrSources',
      'qrDevices',
      'pulse',
      'geoStates',
      'pushDryRun',
    ]) {
      assert.ok(
        src.includes(`api::analytics.analytics.${action}`),
        `${action} is authenticated but never granted to the Authenticated role`
      );
    }
    assert.ok(
      /ensureAuthenticatedPermissions\(strapi, PRIVATE_ANALYTICS_ACTIONS/.test(src),
      'bootstrap must grant the private analytics actions'
    );
    assert.ok(
      /disablePublicPermissions\(strapi, PRIVATE_ANALYTICS_ACTIONS/.test(src),
      'bootstrap must strip these actions from the Public role'
    );
  });

  await test('qr.find is granted to Authenticated and removed from Public at boot', () => {
    const src = read('src/index.js');
    assert.ok(/api::qr\.qr\.find/.test(src), 'GET /qrs now needs the find action granted');
    assert.ok(
      /ensureAuthenticatedPermissions\(strapi, AUTHENTICATED_QR_ACTIONS/.test(src),
      'bootstrap must grant the QR list action'
    );
    assert.ok(
      /disablePublicPermissions\(strapi, AUTHENTICATED_QR_ACTIONS/.test(src),
      'bootstrap must strip the QR list action from Public'
    );
  });

  console.log('\n[6] Boot / import safety');

  await test('every module touched by the repair still requires cleanly', () => {
    // analyticsAccess is new and is pulled in by the analytics controller, so a
    // bad path here would take Strapi down at boot rather than fail a request.
    for (const rel of [
      '../src/api/analytics/services/analyticsAccess',
      '../src/api/analytics/controllers/analytics',
      '../src/api/analytics/routes/analytics',
      '../src/api/qr/controllers/qr',
      '../src/api/qr/routes/qr',
      '../src/api/qr/routes/qr-lookup',
      '../src/utils/qrScope',
      '../src/api/band-external-account/routes/band-external-account',
      '../src/api/band-external-metric/routes/band-external-metric',
      '../src/index',
    ]) {
      assert.doesNotThrow(() => require(rel), `${rel} failed to load`);
    }
  });

  await test('analyticsAccess exports the gates the controller imports', () => {
    for (const name of [
      'requireBandAnalytics',
      'requireEventAnalytics',
      'requireQrAnalytics',
      'requireEntityAnalytics',
      'resolveBandIdFromSlug',
      'respondDenied',
    ]) {
      assert.strictEqual(typeof access[name], 'function', `${name} must be exported`);
    }
  });

  console.log(`\n${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
