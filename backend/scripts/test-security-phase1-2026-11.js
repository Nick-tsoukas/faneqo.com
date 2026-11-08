/**
 * Security pass 2026-11 regression tests (no network, no database).
 *
 *   YouTube OAuth state: signed, expiring, user-bound, single-use; callback
 *     refuses unauthenticated, forged, expired, other-user and replayed state;
 *     select-channel only binds a channel Google returned for the band's token;
 *     no token bodies in logs or responses; debug handlers gone.
 *   user-admin: only USER_ADMIN_SECRET (>= 32 chars), no STRAPI_API_TOKEN
 *     fallback; update writes a billing whitelist only and never changes a
 *     Lifetime Pro (free) status; no password hashes in responses.
 *   Stripe routes: legacy card-first signup + test + confirm-social unrouted,
 *     remaining billing routes authenticated, Public grants revoked at boot.
 *   Signup: no password in logs, case-insensitive duplicate check, rate limit.
 *
 * Run: node scripts/test-security-phase1-2026-11.js
 */
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_dummy';
const root = path.join(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');

let passed = 0;
let failed = 0;
async function test(name, fn) {
  try {
    await fn();
    passed += 1;
    console.log(`  PASS  ${name}`);
  } catch (err) {
    failed += 1;
    console.log(`  FAIL  ${name}\n        ${err.message}`);
  }
}

function makeCtx({ token, body = {}, params = {}, query = {}, headers = {} } = {}) {
  const calls = [];
  const reply = (kind) => (msg) => { calls.push([kind, msg]); return undefined; };
  return {
    calls,
    params,
    query,
    request: { body, headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), ...headers } },
    state: {},
    status: 200,
    body: undefined,
    unauthorized: reply('unauthorized'),
    badRequest: reply('badRequest'),
    forbidden: reply('forbidden'),
    notFound: reply('notFound'),
    internalServerError: reply('internalServerError'),
  };
}

// ---------- OAuth state ----------
function fakeStrapi({ kvKeys = new Set(), logs = [] } = {}) {
  return {
    config: { get: (k) => (k === 'plugin.users-permissions.jwtSecret' ? 'unit-test-jwt-secret' : undefined) },
    log: { info: (m) => logs.push(m), warn: (m) => logs.push(m), error: (m) => logs.push(m), debug: (m) => logs.push(m) },
    entityService: {
      create: async (uid, { data }) => {
        if (uid !== 'api::system-kv.system-kv') throw new Error('unexpected uid');
        if (kvKeys.has(data.key)) throw new Error('unique');
        kvKeys.add(data.key);
        return { id: kvKeys.size };
      },
    },
  };
}

async function main() {
  const { createOAuthState, readOAuthState, verifyOAuthState, TTL_MS } = require('../src/utils/oauthState');

  console.log('\nYouTube OAuth state');
  await test('state is signed, keeps the readable band prefix, and verifies once for the same user', async () => {
    const s = fakeStrapi();
    const state = createOAuthState(s, { userId: 7, bandId: 12 });
    assert.match(state, /^mbqr\|band:12\|[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
    const ok = await verifyOAuthState(s, state, { userId: 7 });
    assert.equal(ok.ok, true);
    assert.equal(ok.bandId, 12);
    const again = await verifyOAuthState(s, state, { userId: 7 });
    assert.deepEqual([again.ok, again.reason], [false, 'state-replayed']);
  });

  await test('forged, tampered, other-user, expired and legacy states are refused', async () => {
    const s = fakeStrapi();
    const state = createOAuthState(s, { userId: 7, bandId: 12 });
    assert.equal(readOAuthState(s, state, { userId: 8 }).reason, 'state-user-mismatch');
    assert.equal(readOAuthState(s, state, { userId: 7, now: Date.now() + TTL_MS + 1000 }).reason, 'state-expired');
    assert.equal(readOAuthState(s, state.replace('band:12', 'band:13'), { userId: 7 }).reason, 'state-band-mismatch');
    const [head, sig] = state.split('.');
    assert.equal(readOAuthState(s, `${head}.${sig.slice(0, -2)}AA`, { userId: 7 }).reason, 'state-signature');
    assert.equal(readOAuthState(s, 'mbqr|band:12|nonce:abc123', { userId: 7 }).reason, 'state-malformed');
    const other = { ...s, config: { get: () => 'a-different-secret' } };
    assert.equal(readOAuthState(other, state, { userId: 7 }).reason, 'state-signature');
    assert.equal(readOAuthState(s, state, {}).reason, 'state-user-mismatch');
  });

  await test('callback: unauthenticated and invalid state never reach Google or the database', async () => {
    const controller = require('../src/api/youtube/controllers/youtube.js');
    const logs = [];
    let fetched = 0;
    const realFetch = global.fetch;
    global.fetch = async () => { fetched += 1; throw new Error('no network in tests'); };
    global.strapi = {
      ...fakeStrapi({ logs }),
      plugins: { 'users-permissions': { services: { jwt: { verify: async (t) => (t === 'good' ? { id: 7 } : Promise.reject(new Error('bad'))) } } } },
      db: { query: () => ({ findOne: async ({ where }) => ({ id: where.id, email: 'x@y.z' }) }) },
      service: () => { throw new Error('service must not be reached'); },
    };
    try {
      const anon = makeCtx({ body: { code: 'c', state: 'mbqr|band:1|x.y' } });
      await controller.oauthCallback(anon);
      assert.equal(anon.calls[0][0], 'unauthorized');

      const forged = makeCtx({ body: { code: 'c', state: 'mbqr|band:1|nonce:abc' }, headers: { authorization: 'Bearer good' } });
      await controller.oauthCallback(forged);
      assert.equal(forged.calls[0][0], 'badRequest');

      const otherUsersState = createOAuthState(global.strapi, { userId: 99, bandId: 1 });
      const other = makeCtx({ body: { code: 'c', state: otherUsersState }, headers: { authorization: 'Bearer good' } });
      await controller.oauthCallback(other);
      assert.equal(other.calls[0][0], 'badRequest');
      assert.equal(fetched, 0);
    } finally {
      global.fetch = realFetch;
      delete global.strapi;
    }
  });

  await test('controller has no debug handlers and never logs or returns token bodies', () => {
    const src = read('src/api/youtube/controllers/youtube.js');
    assert.doesNotMatch(src, /async debug\w*\(/);
    assert.doesNotMatch(src, /log\.\w+\([^)]*tokenData\b(?!\))/);
    assert.doesNotMatch(src, /details: tokenData|details: refreshed\b/);
    assert.doesNotMatch(src, /Math\.random/);
    assert.match(src, /verifyOAuthState\(strapi, state, \{ userId: user\.id \}\)/);
    assert.match(src, /createOAuthState\(strapi, \{ userId: user\.id, bandId \}\)/);
    const service = read('src/api/youtube/services/youtube.js');
    assert.doesNotMatch(service, /error response status=\$\{res\.status\} body=/);
  });

  await test('select-channel only binds a channel returned for the band token', () => {
    const src = read('src/api/youtube/controllers/youtube.js');
    assert.match(src, /offered\.includes\(channelId\)/);
  });

  // ---------- user-admin ----------
  console.log('\nuser-admin');
  const LONG = 'u'.repeat(40);
  const loadAdmin = () => {
    delete require.cache[require.resolve('../src/api/user-admin/controllers/user-admin.js')];
    return require('../src/api/user-admin/controllers/user-admin.js');
  };
  const withAdminStrapi = async (user, fn) => {
    const writes = [];
    global.strapi = {
      log: { info() {}, warn() {}, error() {} },
      db: { query: () => ({ findOne: async () => user }) },
      entityService: {
        update: async (_uid, id, { data }) => { writes.push({ id, data }); return { ...user, ...data, password: '$2a$hash', resetPasswordToken: 't' }; },
        findMany: async () => [{ ...user, password: '$2a$hash', resetPasswordToken: 'r', confirmationToken: 'c' }],
      },
      plugins: { 'users-permissions': { services: { jwt: { issue: () => 'jwt' } } } },
    };
    try { return await fn(writes); } finally { delete global.strapi; }
  };

  await test('STRAPI_API_TOKEN is never accepted; missing or short secret fails closed', async () => {
    const saved = { a: process.env.USER_ADMIN_SECRET, b: process.env.STRAPI_API_TOKEN };
    try {
      delete process.env.USER_ADMIN_SECRET;
      process.env.STRAPI_API_TOKEN = 'content-api-token-0123456789abcdef0123456789';
      const admin = loadAdmin();
      await withAdminStrapi({ id: 1, email: 'a@b.co', confirmed: true }, async () => {
        const ctx = makeCtx({ token: process.env.STRAPI_API_TOKEN, body: { email: 'a@b.co' } });
        await admin.issueJwt(ctx);
        assert.equal(ctx.calls[0][0], 'unauthorized');
      });
      process.env.USER_ADMIN_SECRET = 'short';
      await withAdminStrapi({ id: 1, email: 'a@b.co', confirmed: true }, async () => {
        const ctx = makeCtx({ token: 'short', body: { email: 'a@b.co' } });
        await admin.issueJwt(ctx);
        assert.equal(ctx.calls[0][0], 'unauthorized');
      });
      process.env.USER_ADMIN_SECRET = LONG;
      await withAdminStrapi({ id: 1, email: 'a@b.co', confirmed: true }, async () => {
        const wrong = makeCtx({ token: `${LONG}x`, body: { email: 'a@b.co' } });
        await admin.issueJwt(wrong);
        assert.equal(wrong.calls[0][0], 'unauthorized');
        const right = makeCtx({ token: LONG, body: { email: 'a@b.co' } });
        const res = await admin.issueJwt(right);
        assert.equal(res.jwt, 'jwt');
      });
      assert.doesNotMatch(read('src/api/user-admin/controllers/user-admin.js'), /STRAPI_API_TOKEN\s*[|)]/);
    } finally {
      process.env.USER_ADMIN_SECRET = saved.a;
      if (saved.b === undefined) delete process.env.STRAPI_API_TOKEN; else process.env.STRAPI_API_TOKEN = saved.b;
    }
  });

  await test('update writes billing fields only; role/password/plan and unknown fields are refused', async () => {
    process.env.USER_ADMIN_SECRET = LONG;
    const admin = loadAdmin();
    await withAdminStrapi({ id: 5, plan: null, subscriptionStatus: 'unpaid' }, async (writes) => {
      for (const body of [{ role: 1 }, { password: 'x' }, { plan: 'free' }, { subscriptionStatus: 'free', confirmed: true }, {}]) {
        const ctx = makeCtx({ token: LONG, params: { id: '5' }, body });
        await admin.update(ctx);
        assert.equal(ctx.calls[0]?.[0], 'badRequest', JSON.stringify(body));
      }
      assert.equal(writes.length, 0);
      const ok = makeCtx({ token: LONG, params: { id: '5' }, body: { customerId: 'cus_1', subscriptionId: 'sub_1', subscriptionStatus: 'trialing', trialEndsAt: '2026-12-01' } });
      const res = await admin.update(ok);
      assert.equal(writes.length, 1);
      assert.deepEqual(Object.keys(writes[0].data).sort(), ['customerId', 'subscriptionId', 'subscriptionStatus', 'trialEndsAt']);
      assert.equal(res.data.password, undefined);
      assert.equal(res.data.resetPasswordToken, undefined);
    });
  });

  await test('Lifetime Pro (free) is never downgraded through user-admin', async () => {
    process.env.USER_ADMIN_SECRET = LONG;
    const admin = loadAdmin();
    for (const lifetime of [{ id: 9, plan: 'free', subscriptionStatus: 'active' }, { id: 9, plan: null, subscriptionStatus: 'free' }]) {
      await withAdminStrapi(lifetime, async (writes) => {
        const ctx = makeCtx({ token: LONG, params: { id: '9' }, body: { subscriptionStatus: 'unpaid' } });
        await admin.update(ctx);
        assert.equal(writes.length, 0, 'no write for a status-only downgrade');
        const mixed = makeCtx({ token: LONG, params: { id: '9' }, body: { subscriptionStatus: 'unpaid', customerId: 'cus_9' } });
        await admin.update(mixed);
        assert.equal(writes.length, 1);
        assert.equal(writes[0].data.subscriptionStatus, undefined);
        assert.equal(writes[0].data.customerId, 'cus_9');
      });
    }
  });

  await test('findByEmail and register never return password or token fields', async () => {
    process.env.USER_ADMIN_SECRET = LONG;
    const admin = loadAdmin();
    await withAdminStrapi({ id: 3, email: 'a@b.co', subscriptionStatus: 'free', plan: 'free' }, async () => {
      const ctx = makeCtx({ token: LONG, params: { email: 'A@B.co' } });
      const rows = await admin.findByEmail(ctx);
      assert.equal(rows.length, 1);
      for (const k of ['password', 'resetPasswordToken', 'confirmationToken']) assert.equal(rows[0][k], undefined);
      assert.equal(rows[0].plan, 'free');
    });
    assert.match(read('src/api/user-admin/controllers/user-admin.js'), /return \{ data: publicUser\(newUser\) \}/);
  });

  // ---------- Stripe routes ----------
  console.log('\nStripe routes');
  await test('legacy signup, test and confirm-social are not routed; billing routes are authenticated', () => {
    delete require.cache[require.resolve('../src/api/stripe/routes/stripe.js')];
    const routes = require('../src/api/stripe/routes/stripe.js').routes;
    const paths = routes.map((r) => r.path);
    for (const gone of ['/stripe/create-customer', '/stripe/create-checkout-session', '/stripe/confirm-payment', '/stripe/test', '/stripe/confirm-social']) {
      assert.ok(!paths.includes(gone), `${gone} still routed`);
    }
    assert.deepEqual(paths.sort(), ['/stripe/billing', '/stripe/create-billing-portal-session', '/stripe/subscription-status']);
    for (const r of routes) assert.notStrictEqual(r.config?.auth, false, `${r.path} must not be auth:false`);
  });

  await test('Public role grants for every Stripe billing action are revoked at boot', () => {
    const src = read('src/index.js');
    const block = src.slice(src.indexOf('PUBLIC_LOCKDOWN_2026_10_ACTIONS = ['), src.indexOf('];', src.indexOf('PUBLIC_LOCKDOWN_2026_10_ACTIONS = [')));
    for (const a of ['createCustomer', 'createCheckoutSession', 'confirmPayment', 'confirmSocial', 'createBillingPortalSession', 'getBillingInfo', 'subscriptionStatus', 'testRoute']) {
      assert.ok(block.includes(`'api::stripe.stripe.${a}'`), `${a} not revoked`);
    }
    assert.match(src, /disablePublicPermissions\(strapi, PUBLIC_LOCKDOWN_2026_10_ACTIONS/);
  });

  await test('billing handlers do not log user rows or session objects', () => {
    const all = read('src/api/stripe/controllers/stripe.js');
    // The three routed handlers (the legacy ones below them are unrouted)
    const src = all.slice(all.indexOf('async subscriptionStatus(ctx)'), all.indexOf('async createCustomer(ctx)'));
    assert.ok(src.length > 1000);
    assert.doesNotMatch(src, /\{ dbUser \}\)|\{ jwtUser: ctx\.state\.user \}|\{ user: ctx\.state\.user \}|\{ user \}\);|\{ session \}\);/);
  });

  await test('discontinued Merch Concierge checkout is not routed', () => {
    delete require.cache[require.resolve('../src/api/merch-concierge/routes/merch-concierge.js')];
    assert.deepEqual(require('../src/api/merch-concierge/routes/merch-concierge.js').routes, []);
  });

  await test('live billing routes and the billing webhook never log user rows, bodies or headers', () => {
    const src = read('src/api/subscription/controllers/subscription.js');
    assert.doesNotMatch(src, /\{ jwtUser: ctx\.state\.user \}|\{ dbUser \}\)|headers: ctx\.request\.headers|\{ body: ctx\.request\.body \}/);
  });

  // ---------- signup ----------
  console.log('\nEmail signup');
  await test('register never logs the password and checks duplicates case-insensitively', () => {
    const src = read('src/api/subscription/controllers/subscription.js');
    const reg = src.slice(src.indexOf('async register(ctx)'));
    assert.doesNotMatch(reg.slice(0, 1500), /\{ name, email, password \}\)|\{ body: ctx\.request\.body \}/);
    assert.match(reg, /where: \{ email: \{ \$eqi: email \} \}/);
    assert.match(reg, /rawEmail\.trim\(\)\.toLowerCase\(\)/);
    assert.match(reg, /if \(!allowSignup\(ctx\)\)/);
  });

  await test('signup throttle: 5 per IP per hour, keyed on the proxy-appended address', () => {
    const guard = require('../src/utils/signupGuard');
    guard._hits.clear();
    const ctx = (xff) => ({ request: { headers: { 'x-forwarded-for': xff } }, ip: '10.0.0.1' });
    const now = Date.now();
    for (let i = 0; i < guard.MAX_PER_WINDOW; i++) assert.equal(guard.allowSignup(ctx('1.1.1.1, 9.9.9.9'), now + i), true);
    assert.equal(guard.allowSignup(ctx('2.2.2.2, 9.9.9.9'), now), false, 'spoofed left entry does not reset the limit');
    assert.equal(guard.allowSignup(ctx('8.8.8.8'), now), true);
    assert.equal(guard.allowSignup(ctx('1.1.1.1, 9.9.9.9'), now + guard.WINDOW_MS + 10), true, 'window expires');
  });

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed) process.exit(1);
}

main();
