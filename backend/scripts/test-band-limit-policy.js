/**
 * Band creation limit (api::band.only-one-band), run through Strapi's real
 * route policy middleware so a refusal is proven to stop the controller.
 *
 *   regular artist: one owned band
 *   agency accounts (manual allowlist): up to ten owned bands
 *   Team Access: memberships never count toward the owned-band limit
 *
 * Run: node scripts/test-band-limit-policy.js
 */
'use strict';

const assert = require('assert');
const path = require('path');
// Strapi's own route policy middleware (not exported by the package map, so load it by path).
const { resolvePolicies } = require(path.join(
  path.dirname(require.resolve('@strapi/strapi/package.json')),
  'dist/services/server/policy.js'
));
const policy = require('../src/api/band/policies/only-one-band');

let passed = 0;
let failed = 0;
async function test(name, fn) {
  try {
    await fn();
    passed += 1;
    console.log(`  PASS  ${name}`);
  } catch (err) {
    failed += 1;
    console.log(`  FAIL  ${name}\n        ${err.stack || err.message}`);
  }
}

const REGULAR = { id: 11, email: 'artist@example.test' };
const AGENCY = { id: 44, email: 'partner@musicbizqr.com' };

/**
 * bands: [{ id, owner }]; members: [{ user, band, role }] (Team Access rows).
 * Records every query so tests can see what the policy counted.
 */
function fakeStrapi({ bands = [], members = [] } = {}) {
  const queries = [];
  return {
    queries,
    // The pre-fix policy counted through entityService; kept so the test can run against it.
    entityService: {
      async findMany(uid, { filters } = {}) {
        queries.push({ uid, where: filters });
        return bands.filter((b) => b.owner === filters?.users_permissions_user?.id);
      },
    },
    db: {
      query(uid) {
        return {
          async count({ where }) {
            queries.push({ uid, where });
            if (uid === 'api::band.band') {
              const ownerId = where?.users_permissions_user?.id;
              return bands.filter((b) => b.owner === ownerId).length;
            }
            if (uid === 'api::band-member.band-member') {
              return members.filter((m) => m.user === where?.user).length;
            }
            return 0;
          },
        };
      },
    },
  };
}

/** Run the policy exactly as POST /api/bands does, then report what happened. */
async function runCreate(user, world) {
  global.strapi = world;
  const [middleware] = resolvePolicies({ config: { policies: [policy] }, info: {} });
  let controllerRan = false;
  let error = null;
  // Like Strapi's koa context: the response helpers set a status and body and return undefined.
  const ctx = { state: user ? { user } : {}, request: {} };
  const helper = (status) => (message) => { ctx.status = status; ctx.body = { error: { status, message } }; };
  ctx.response = { forbidden: helper(403), unauthorized: helper(401) };
  ctx.forbidden = ctx.response.forbidden;
  ctx.unauthorized = ctx.response.unauthorized;
  try {
    await middleware(ctx, async () => {
      controllerRan = true;
    });
  } catch (err) {
    error = err;
  }
  return { controllerRan, error };
}

const owned = (owner, n, start = 1) => Array.from({ length: n }, (_, i) => ({ id: start + i, owner }));

(async () => {
  console.log('\nRegular artist');

  await test('first band: allowed, controller runs', async () => {
    const r = await runCreate(REGULAR, fakeStrapi());
    assert.strictEqual(r.error, null);
    assert.strictEqual(r.controllerRan, true);
  });

  await test('second band: refused with 403 and the controller never runs', async () => {
    const r = await runCreate(REGULAR, fakeStrapi({ bands: owned(REGULAR.id, 1) }));
    assert.strictEqual(r.controllerRan, false, 'nothing may be written');
    assert.ok(r.error, 'a refusal must throw');
    assert.strictEqual(r.error.name, 'PolicyError');
    assert.match(r.error.message, /only create up to 1 band/);
  });

  await test('an account already over the limit stays refused', async () => {
    const r = await runCreate(REGULAR, fakeStrapi({ bands: owned(REGULAR.id, 2) }));
    assert.strictEqual(r.controllerRan, false);
  });

  await test('other accounts\' bands do not count', async () => {
    const r = await runCreate(REGULAR, fakeStrapi({ bands: owned(999, 5) }));
    assert.strictEqual(r.controllerRan, true);
  });

  await test('no signed-in user: refused, controller never runs', async () => {
    const r = await runCreate(null, fakeStrapi());
    assert.strictEqual(r.controllerRan, false);
    assert.strictEqual(r.error?.name, 'UnauthorizedError');
  });

  console.log('\nAgency exception (manual allowlist)');

  await test('agency account with 9 bands: allowed', async () => {
    const r = await runCreate(AGENCY, fakeStrapi({ bands: owned(AGENCY.id, 9) }));
    assert.strictEqual(r.controllerRan, true);
  });

  await test('agency account with 10 bands: refused at its limit', async () => {
    const r = await runCreate(AGENCY, fakeStrapi({ bands: owned(AGENCY.id, 10) }));
    assert.strictEqual(r.controllerRan, false);
    assert.match(r.error.message, /only create up to 10 band/);
  });

  await test('both allowlisted emails get 10; matching ignores case and spaces', () => {
    assert.strictEqual(policy.bandLimitFor({ email: 'mjc773@gmail.com' }), 10);
    assert.strictEqual(policy.bandLimitFor({ email: 'partner@musicbizqr.com' }), 10);
    assert.strictEqual(policy.bandLimitFor({ email: '  Partner@MusicBizQR.com ' }), 10);
    assert.strictEqual(policy.bandLimitFor({ email: 'artist@example.test' }), 1);
    assert.strictEqual(policy.bandLimitFor({}), 1);
  });

  console.log('\nTeam Access');

  const teamWorld = (ownedCount) => fakeStrapi({
    bands: [...owned(500, 3, 100), ...owned(REGULAR.id, ownedCount, 200)],
    members: [100, 101, 102].map((band) => ({ user: REGULAR.id, band, role: 'manager' })),
  });

  await test('managing 3 assigned artists does not use up the account\'s own band', async () => {
    const world = teamWorld(0);
    const r = await runCreate(REGULAR, world);
    assert.strictEqual(r.controllerRan, true);
    assert.deepStrictEqual(
      world.queries.map((q) => q.uid),
      ['api::band.band'],
      'only owned bands are counted; memberships are never read'
    );
    assert.deepStrictEqual(world.queries[0].where, { users_permissions_user: { id: REGULAR.id } });
  });

  await test('a team member who already owns a band is still limited to one owned band', async () => {
    const r = await runCreate(REGULAR, teamWorld(1));
    assert.strictEqual(r.controllerRan, false);
  });

  console.log('\nRoute wiring');

  await test('POST /bands runs the limit after authentication', () => {
    const { routes } = require('../src/api/band/routes/band');
    const create = routes.find((r) => r.method === 'POST' && r.path === '/bands');
    const policies = create.config.policies.map((p) => (typeof p === 'string' ? p : p.name));
    assert.ok(policies.includes('api::band.only-one-band'));
    assert.ok(policies.indexOf('plugin::users-permissions.isAuthenticated') < policies.indexOf('api::band.only-one-band'));
  });

  await test('the policy never answers through response helpers (they do not stop Strapi)', () => {
    const src = require('fs').readFileSync(path.join(__dirname, '../src/api/band/policies/only-one-band.js'), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    assert.doesNotMatch(src, /response\.(forbidden|unauthorized)|policyContext\.(forbidden|unauthorized)/);
  });

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed) process.exit(1);
})();
