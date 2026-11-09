'use strict';

/**
 * October 2026 API lockdown — regression tests.
 *
 * Pins the fixes from the 2026-10-29 security audit:
 *   - users may only read/edit their own account, and only email/username/password
 *   - payment records (support-moment) have no core routes
 *   - raw analytics rows (page views, scans, media plays) need a signed-in caller
 *     and are scoped to bands where they hold viewAnalytics; IPs are private
 *   - share/pulse/insight telemetry is not listable; fan moments are findOne only
 *   - YouTube, insight and muse handlers require band access; debug routes are gone
 *   - legacy content (album, video, tour, stream, socialpage) is creator-only to edit
 *   - Stripe Connect fields on a band are server-managed (never client-writable)
 *
 * Behavioural where it matters (fake strapi + fake ctx), route-table checks for
 * what is exposed. Run: node scripts/test-api-lockdown-2026-10.js
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.join(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(repoRoot, rel), 'utf8');
const exists = (rel) => fs.existsSync(path.join(repoRoot, rel));
const codeOnly = (src) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

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

function fakeCtx({ user = null, params = {}, query = {}, body = {} } = {}) {
  const ctx = {
    state: user ? { user } : {},
    params,
    query,
    request: { body, headers: {} },
    status: 200,
    body: undefined,
  };
  for (const [name, status] of [['unauthorized', 401], ['forbidden', 403], ['notFound', 404], ['badRequest', 400]]) {
    ctx[name] = (message) => {
      ctx.status = status;
      ctx.body = { error: { status, message } };
    };
  }
  return ctx;
}

/** strapi double: bands (with owner id), band members, and rows per uid. */
function fakeStrapi({ bands = [], members = [], rows = {} } = {}) {
  const calls = [];
  return {
    calls,
    log: { warn() {}, error() {}, info() {}, debug() {} },
    entityService: {
      async findMany(uid, opts = {}) {
        calls.push({ op: 'findMany', uid, opts });
        if (uid === 'api::band.band') {
          const owner = opts.filters?.users_permissions_user?.id;
          return bands.filter((b) => String(b.owner) === String(owner)).map((b) => ({ id: b.id }));
        }
        if (uid === 'api::band-member.band-member') {
          return members
            .filter((m) => String(m.user) === String(opts.filters?.user) && m.status === 'active')
            .map((m) => ({ role: m.role, band: { id: m.band } }));
        }
        return [];
      },
      async findOne(uid, id) {
        calls.push({ op: 'findOne', uid, id });
        return (rows[uid] || []).find((r) => String(r.id) === String(id)) || null;
      },
    },
    service(uid) {
      return {
        async find(query) {
          calls.push({ op: 'service.find', uid, query });
          return { results: [], pagination: { page: 1, pageSize: 25, pageCount: 0, total: 0 } };
        },
      };
    },
  };
}

/** Bind a spread-style override onto a fake core controller, as Strapi does. */
function withCoreProto(overrides, calls) {
  const core = {
    async validateQuery() {},
    async sanitizeQuery(ctx) {
      return { ...ctx.query };
    },
    async sanitizeOutput(x) {
      return x;
    },
    transformResponse(data, meta) {
      return { data, meta };
    },
    async find() {
      calls.push({ op: 'core.find' });
      return { data: 'core-find' };
    },
    async findOne(ctx) {
      calls.push({ op: 'core.findOne', id: ctx.params.id });
      return { data: 'core-findOne' };
    },
    async create(ctx) {
      calls.push({ op: 'core.create', body: ctx.request.body });
      return { data: 'core-create' };
    },
    async update(ctx) {
      calls.push({ op: 'core.update', body: ctx.request.body });
      return { data: 'core-update' };
    },
    async delete(ctx) {
      calls.push({ op: 'core.delete', id: ctx.params.id });
      return { data: 'core-delete' };
    },
  };
  const ctrl = { ...overrides };
  Object.setPrototypeOf(ctrl, core);
  return ctrl;
}

(async () => {
  console.log('\nUsers: self-only');
  const { guardUserControllers, USER_SELF_EDITABLE_FIELDS } = require('../src/utils/userSelfGuard');

  function guardedUserController(calls) {
    return guardUserControllers({
      async update(ctx) {
        calls.push({ op: 'update', id: ctx.params.id, body: ctx.request.body });
        ctx.body = { ok: true };
      },
      async find(ctx) {
        calls.push({ op: 'find' });
        ctx.body = [];
      },
      async findOne(ctx) {
        calls.push({ op: 'findOne', id: ctx.params.id });
        ctx.body = { id: ctx.params.id };
      },
    });
  }

  await test('updating another user is refused and never reaches the stock controller', async () => {
    const calls = [];
    const c = guardedUserController(calls);
    const ctx = fakeCtx({ user: { id: 7 }, params: { id: '8' }, body: { password: 'x12345678' } });
    await c.update(ctx);
    assert.strictEqual(ctx.status, 403);
    assert.strictEqual(calls.length, 0);
  });

  await test('anonymous update is refused', async () => {
    const calls = [];
    const ctx = fakeCtx({ params: { id: '8' }, body: { email: 'a@b.c' } });
    await guardedUserController(calls).update(ctx);
    assert.strictEqual(ctx.status, 401);
    assert.strictEqual(calls.length, 0);
  });

  await test('self update passes only email, username and password', async () => {
    const calls = [];
    const ctx = fakeCtx({
      user: { id: 7 },
      params: { id: '7' },
      body: { email: 'me@x.com', username: 'me@x.com', password: 'newpass123', subscriptionStatus: 'active', role: 1, blocked: false, editorialShowcaseAccess: true, confirmed: true },
    });
    await guardedUserController(calls).update(ctx);
    assert.deepStrictEqual(USER_SELF_EDITABLE_FIELDS, ['email', 'username', 'password']);
    assert.strictEqual(calls.length, 1);
    assert.deepStrictEqual(calls[0].body, { email: 'me@x.com', username: 'me@x.com', password: 'newpass123' });
  });

  await test('listing users is refused; findOne only returns yourself', async () => {
    const calls = [];
    const c = guardedUserController(calls);
    const list = fakeCtx({ user: { id: 7 } });
    await c.find(list);
    assert.strictEqual(list.status, 403);
    const other = fakeCtx({ user: { id: 7 }, params: { id: '9' } });
    await c.findOne(other);
    assert.strictEqual(other.status, 404);
    const self = fakeCtx({ user: { id: 7 }, params: { id: '7' } });
    await c.findOne(self);
    assert.deepStrictEqual(calls, [{ op: 'findOne', id: '7' }]);
  });

  await test('deleting a user over the API is refused', async () => {
    const ctx = fakeCtx({ user: { id: 7 }, params: { id: '7' } });
    await guardedUserController([]).destroy(ctx);
    assert.strictEqual(ctx.status, 403);
  });

  await test('bootstrap removes the stale Public grants', () => {
    const src = codeOnly(read('src/index.js'));
    assert.ok(src.includes('disablePublicPermissions(strapi, PUBLIC_LOCKDOWN_2026_10_ACTIONS'), 'not wired into bootstrap');
    for (const action of ['api::support-moment.support-moment.find', 'api::band-page-view.band-page-view.find', 'api::scan.scan.find', 'api::media-play.media-play.find']) {
      assert.ok(src.includes(`'${action}'`), `missing ${action}`);
    }
    assert.ok(!src.includes("'api::fan-moment.fan-moment.findOne'"), 'the share page needs public fan-moment findOne');
  });

  await test('users-permissions extension installs the guard', () => {
    const src = codeOnly(read('src/extensions/users-permissions/strapi-server.js'));
    assert.ok(/guardUserControllers\(plugin\.controllers\.user\)/.test(src));
  });

  console.log('\nPayment records');
  await test('support-moment has no core router; receipt routes remain', () => {
    assert.ok(!exists('src/api/support-moment/routes/support-moment.js'));
    const paths = require('../src/api/support-moment/routes/summary.js').routes.map((r) => r.path);
    assert.deepStrictEqual(paths.sort(), ['/payment-receipts/:token', '/support-moments/:id/summary']);
  });

  console.log('\nRaw analytics rows');
  const { scopedAnalyticsReads, directBand, bandOrParent, scopeQuery } = require('../src/utils/scopedAnalyticsReads');
  const { listBandIdsWithPermission } = require('../src/utils/bandRoles');

  await test('listBandIdsWithPermission: owned bands plus memberships whose role grants the permission', async () => {
    const strapi = fakeStrapi({
      bands: [{ id: 1, owner: 7 }, { id: 2, owner: 8 }],
      members: [
        { user: 7, band: 3, role: 'manager', status: 'active' },
        { user: 7, band: 4, role: 'manager', status: 'removed' },
      ],
    });
    const ids = await listBandIdsWithPermission(strapi, 7, 'viewAnalytics');
    assert.deepStrictEqual(ids.sort(), [1, 3]);
    assert.deepStrictEqual(await listBandIdsWithPermission(strapi, null, 'viewAnalytics'), []);
  });

  await test('anonymous find is refused without querying', async () => {
    const strapi = fakeStrapi();
    const ctrl = withCoreProto(scopedAnalyticsReads(strapi, 'api::band-page-view.band-page-view', directBand), strapi.calls);
    const ctx = fakeCtx({ query: {} });
    await ctrl.find(ctx);
    assert.strictEqual(ctx.status, 401);
    assert.ok(!strapi.calls.some((c) => c.op === 'service.find'));
  });

  await test('find wraps the caller filters with the band scope after sanitizing', async () => {
    const strapi = fakeStrapi({ bands: [{ id: 5, owner: 7 }] });
    const ctrl = withCoreProto(scopedAnalyticsReads(strapi, 'api::band-page-view.band-page-view', directBand), strapi.calls);
    const ctx = fakeCtx({ user: { id: 7 }, query: { filters: { band: { id: 99 } } } });
    await ctrl.find(ctx);
    const call = strapi.calls.find((c) => c.op === 'service.find');
    assert.deepStrictEqual(call.query.filters, { $and: [{ band: { id: 99 } }, { band: { id: { $in: [5] } } }] });
  });

  await test('a caller with no analytics bands gets an empty page', async () => {
    const strapi = fakeStrapi();
    const ctrl = withCoreProto(scopedAnalyticsReads(strapi, 'api::scan.scan', bandOrParent('qr')), strapi.calls);
    const ctx = fakeCtx({ user: { id: 7 } });
    await ctrl.find(ctx);
    assert.strictEqual(ctx.body.meta.pagination.total, 0);
    assert.ok(!strapi.calls.some((c) => c.op === 'service.find'));
  });

  await test('scan scope covers rows linked by band or through the QR code', () => {
    assert.deepStrictEqual(bandOrParent('qr').scopeFilter([2]), {
      $or: [{ band: { id: { $in: [2] } } }, { qr: { band: { id: { $in: [2] } } } }],
    });
    assert.deepStrictEqual(bandOrParent('qr').bandIdsOfRow({ band: null, qr: { band: { id: 2 } } }), [2]);
    assert.deepStrictEqual(scopeQuery({ sort: 'x' }, { a: 1 }), { sort: 'x', filters: { a: 1 } });
  });

  await test("findOne of another band's row is a 404", async () => {
    const strapi = fakeStrapi({
      bands: [{ id: 5, owner: 7 }],
      rows: { 'api::media-play.media-play': [{ id: 11, band: { id: 6 } }, { id: 12, band: { id: 5 } }] },
    });
    const ctrl = withCoreProto(scopedAnalyticsReads(strapi, 'api::media-play.media-play', directBand), strapi.calls);
    const other = fakeCtx({ user: { id: 7 }, params: { id: '11' } });
    await ctrl.findOne(other);
    assert.strictEqual(other.status, 404);
    const own = fakeCtx({ user: { id: 7 }, params: { id: '12' } });
    assert.deepStrictEqual(await ctrl.findOne(own), { data: 'core-findOne' });
  });

  await test('page-view, scan, event-view and media-play controllers use the scoped reads', () => {
    for (const a of ['band-page-view', 'scan', 'event-page-view', 'media-play']) {
      const src = codeOnly(read(`src/api/${a}/controllers/${a}.js`));
      assert.ok(src.includes('...scopedAnalyticsReads('), `${a} not scoped`);
      assert.ok(!/async find\(ctx\)/.test(src), `${a} still defines its own find`);
    }
  });

  await test('visitor IP and fan-moment visitor id are private fields', () => {
    assert.strictEqual(require('../src/api/band-page-view/content-types/band-page-view/schema.json').attributes.ipAddress.private, true);
    assert.strictEqual(require('../src/api/fan-moment/content-types/fan-moment/schema.json').attributes.visitorId.private, true);
  });

  console.log('\nCore routers');
  const coreOnly = (a) => {
    const m = codeOnly(read(`src/api/${a}/routes/${a}.js`)).match(/only:\s*\[([^\]]*)\]/);
    assert.ok(m, `${a}: core router must declare "only"`);
    return m[1].split(',').map((s) => s.trim().replace(/['"]/g, '')).filter(Boolean).sort();
  };
  await test('telemetry core routers expose only what the app uses', () => {
    assert.deepStrictEqual(coreOnly('band-page-view'), ['create', 'find', 'findOne']);
    assert.deepStrictEqual(coreOnly('scan'), ['create', 'find', 'findOne']);
    assert.deepStrictEqual(coreOnly('event-page-view'), ['create', 'find', 'findOne']);
    assert.deepStrictEqual(coreOnly('fan-moment'), ['findOne']);
    assert.deepStrictEqual(coreOnly('band-share'), []);
    assert.deepStrictEqual(coreOnly('pulse-snapshot'), []);
    assert.deepStrictEqual(coreOnly('band-insight-daily'), []);
  });

  console.log('\nPublic custom routes');
  await test('no YouTube debug routes; the rest verify band access in the handler', () => {
    const routes = require('../src/api/youtube/routes/youtube.js').routes;
    assert.ok(!routes.some((r) => /debug/.test(r.path) || /debug/i.test(r.handler)));
    const src = read('src/api/youtube/controllers/youtube.js');
    for (const m of ['oauthInit', 'oauthCallback', 'selectChannel', 'sync', 'disconnect', 'purge']) {
      const start = src.search(new RegExp(`\\n\\s*async ${m}\\(ctx\\)`));
      assert.ok(start >= 0, `missing ${m}`);
      const body = src.slice(start, start + 1600);
      const gate = body.indexOf('requireBandAnalytics(ctx, strapi, bandId, "editBand")');
      const service = body.indexOf('strapi.service(');
      assert.ok(gate > 0, `${m}: no band gate`);
      assert.ok(service === -1 || gate < service, `${m}: gate must run before the service`);
    }
  });

  await test('insight and muse handlers require band analytics access', () => {
    const insights = read('src/api/band-insight-daily/controllers/band-insight-daily.js');
    for (const m of ['compute', 'muse', 'backfill', 'insightsV2']) {
      const start = insights.search(new RegExp(`\\n\\s*async ${m}\\(ctx\\)`));
      const body = insights.slice(start, start + 700);
      assert.ok(body.includes('requireBandAnalytics(ctx, strapi, bandId)'), `${m}: no gate`);
    }
    assert.ok(/Math\.min\(90,/.test(insights), 'backfill days must be capped');
    const routes = require('../src/api/band-insight-daily/routes/band-insight-daily-custom.js').routes.map((r) => r.path);
    assert.ok(!routes.includes('/band-insights-daily/debug'));
    const muse = read('src/api/muse/controllers/muse.js');
    const start = muse.search(/\n\s*async aggregate\(ctx\)/);
    assert.ok(muse.slice(start, start + 500).includes('requireBandAnalytics(ctx, strapi, bandId)'));
  });

  await test('public test-email and scan backfill routes are gone', () => {
    assert.ok(!exists('src/api/test-email/routes/test-email.js'));
    const scanRoutes = require('../src/api/scan/routes/custom-routes.js').routes.map((r) => r.path);
    assert.deepStrictEqual(scanRoutes, ['/scans/track']);
  });

  console.log('\nLegacy content writes');
  const { creatorOwnedWrites, adminOnlyWrites } = require('../src/utils/creatorOwnedWrites');

  await test("non-creators cannot update or delete; creators cannot reassign the record", async () => {
    const strapi = fakeStrapi({ rows: { 'api::album.album': [{ id: 3, users_permissions_user: { id: 7 } }] } });
    const ctrl = withCoreProto(creatorOwnedWrites(strapi, 'api::album.album'), strapi.calls);

    const stranger = fakeCtx({ user: { id: 8 }, params: { id: '3' }, body: { data: { title: 'x' } } });
    await ctrl.update(stranger);
    assert.strictEqual(stranger.status, 403);
    const del = fakeCtx({ user: { id: 8 }, params: { id: '3' } });
    await ctrl.delete(del);
    assert.strictEqual(del.status, 403);
    assert.ok(!strapi.calls.some((c) => c.op === 'core.update' || c.op === 'core.delete'));

    const owner = fakeCtx({ user: { id: 7 }, params: { id: '3' }, body: { data: { title: 'y', users_permissions_user: 8 } } });
    await ctrl.update(owner);
    const call = strapi.calls.find((c) => c.op === 'core.update');
    assert.deepStrictEqual(call.body.data, { title: 'y' });
  });

  await test('create stamps the caller as the creator (JSON and multipart bodies)', async () => {
    const strapi = fakeStrapi();
    const ctrl = withCoreProto(creatorOwnedWrites(strapi, 'api::video.video', 'users_permissions_users'), strapi.calls);
    await ctrl.create(fakeCtx({ user: { id: 7 }, body: { data: { title: 'v', users_permissions_users: 99 } } }));
    await ctrl.create(fakeCtx({ user: { id: 7 }, body: { data: JSON.stringify({ title: 'w' }) } }));
    const creates = strapi.calls.filter((c) => c.op === 'core.create');
    assert.deepStrictEqual(creates[0].body.data, { title: 'v', users_permissions_users: 7 });
    assert.deepStrictEqual(JSON.parse(creates[1].body.data), { title: 'w', users_permissions_users: 7 });
    const anon = fakeCtx({ body: { data: {} } });
    await ctrl.create(anon);
    assert.strictEqual(anon.status, 401);
  });

  await test('legacy content controllers are wired; how-to videos and funtest are admin-only', async () => {
    for (const a of ['album', 'video', 'tour', 'stream', 'socialpage']) {
      assert.ok(codeOnly(read(`src/api/${a}/controllers/${a}.js`)).includes('...creatorOwnedWrites('), `${a} unguarded`);
    }
    for (const a of ['howtovideo', 'funtest']) {
      assert.ok(codeOnly(read(`src/api/${a}/controllers/${a}.js`)).includes('...adminOnlyWrites'), `${a} unguarded`);
    }
    const ctx = fakeCtx({ user: { id: 7 } });
    await adminOnlyWrites.delete(ctx);
    assert.strictEqual(ctx.status, 403);
  });

  console.log('\nBand payment fields');
  const { stripServerManagedBandFields, SERVER_MANAGED_BAND_FIELDS } = require('../src/utils/bandRoles');

  await test('Stripe Connect fields and the owner are stripped from every client band write', () => {
    const out = stripServerManagedBandFields({
      name: 'A',
      paymentsEnabled: true,
      stripeOnboardingComplete: true,
      stripeAccountId: 'acct_x',
      stripeChargesEnabled: true,
      users_permissions_user: 7,
    });
    assert.deepStrictEqual(out, { name: 'A' });
    assert.ok(SERVER_MANAGED_BAND_FIELDS.includes('paymentsEnabled'));
    assert.ok(SERVER_MANAGED_BAND_FIELDS.includes('users_permissions_user'));
    const src = codeOnly(read('src/api/band/controllers/band.js'));
    assert.strictEqual((src.match(/stripServerManagedBandFields\(data\)/g) || []).length, 2, 'create and update must both strip');
  });

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed) process.exit(1);
})();
