'use strict';

/**
 * Social login JWT issuance guard.
 * Run: node scripts/test-social-login-jwt-guard.js
 *
 * Proves the backend only mints a JWT for a trusted server caller, and that
 * the retired unauthenticated /stripe/confirm-social route stays retired.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

// The controller snapshots the admin secret at require time.
const SECRET = 'test-admin-secret-0123456789abcdef0123';
process.env.USER_ADMIN_SECRET = SECRET;

const root = path.join(__dirname, '..');

// Boot/require safety for every module the social login path touches.
const controller = require(path.join(root, 'src/api/user-admin/controllers/user-admin.js'));
const routes = require(path.join(root, 'src/api/user-admin/routes/user-admin.js'));
const stripeRoutes = require(path.join(root, 'src/api/stripe/routes/stripe.js'));

const controllerSrc = fs.readFileSync(
  path.join(root, 'src/api/user-admin/controllers/user-admin.js'),
  'utf8'
);
const stripeControllerSrc = fs.readFileSync(
  path.join(root, 'src/api/stripe/controllers/stripe.js'),
  'utf8'
);

const issueJwtSrc = controllerSrc.slice(
  controllerSrc.indexOf('async issueJwt'),
  controllerSrc.indexOf('async register')
);

let passed = 0;
async function test(name, fn) {
  await fn();
  passed += 1;
  console.log(`  ok ${name}`);
}

function makeCtx({ token, body = {} } = {}) {
  const calls = [];
  const reply = (kind) => (msg) => {
    calls.push([kind, msg]);
    return { error: kind };
  };
  return {
    calls,
    request: {
      headers: token ? { authorization: `Bearer ${token}` } : {},
      body,
    },
    unauthorized: reply('unauthorized'),
    badRequest: reply('badRequest'),
    forbidden: reply('forbidden'),
    notFound: reply('notFound'),
  };
}

async function withStrapi(user, fn) {
  const issued = [];
  global.strapi = {
    log: { info() {}, warn() {}, error() {} },
    db: { query: () => ({ findOne: async () => user }) },
    plugins: {
      'users-permissions': {
        services: {
          jwt: {
            issue: (payload) => {
              issued.push(payload);
              return 'issued.jwt';
            },
          },
        },
      },
    },
  };
  try {
    return await fn(issued);
  } finally {
    delete global.strapi;
  }
}

async function main() {
  console.log('\n=== social login JWT guard ===\n');

  await test('issue-jwt route is registered and guarded by the admin secret', () => {
    const route = routes.routes.find((r) => r.path === '/user-admin/issue-jwt');
    assert.ok(route, 'issue-jwt route missing');
    assert.equal(route.method, 'POST');
    assert.equal(route.handler, 'user-admin.issueJwt');
    assert.equal(typeof controller.issueJwt, 'function');
    assert.match(issueJwtSrc, /validateSecret\(ctx\)/);
  });

  await test('no admin secret means no JWT, even for a real confirmed user', async () => {
    const user = { id: 7, email: 'victim@example.com', confirmed: true };

    const noHeader = makeCtx({ body: { email: user.email } });
    await withStrapi(user, async (issued) => {
      await controller.issueJwt(noHeader);
      assert.deepEqual(issued, []);
      assert.equal(noHeader.calls[0][0], 'unauthorized');
    });

    const wrongSecret = makeCtx({ token: 'guessed-secret', body: { email: user.email } });
    await withStrapi(user, async (issued) => {
      await controller.issueJwt(wrongSecret);
      assert.deepEqual(issued, []);
      assert.equal(wrongSecret.calls[0][0], 'unauthorized');
    });
  });

  await test('trusted caller gets a JWT bound to the looked-up user id', async () => {
    const ctx = makeCtx({ token: SECRET, body: { email: 'Artist@Example.com ' } });
    await withStrapi({ id: 42, email: 'artist@example.com', confirmed: true }, async (issued) => {
      const res = await controller.issueJwt(ctx);
      assert.deepEqual(issued, [{ id: 42 }]);
      assert.equal(res.jwt, 'issued.jwt');
      assert.equal(res.user.id, 42);
    });
  });

  await test('blocked, unconfirmed, mismatched and missing users get no JWT', async () => {
    const cases = [
      [{ id: 1, email: 'a@b.co', confirmed: true, blocked: true }, {}, 'forbidden'],
      [{ id: 1, email: 'a@b.co', confirmed: false }, {}, 'forbidden'],
      [{ id: 1, email: 'a@b.co', confirmed: true }, { userId: 999 }, 'badRequest'],
      [null, {}, 'notFound'],
    ];
    for (const [user, extra, expected] of cases) {
      const ctx = makeCtx({ token: SECRET, body: { email: 'a@b.co', ...extra } });
      await withStrapi(user, async (issued) => {
        await controller.issueJwt(ctx);
        assert.deepEqual(issued, [], `expected no JWT for ${expected}`);
        assert.equal(ctx.calls[0][0], expected);
      });
    }
  });

  await test('issue-jwt never writes to the user record', () => {
    assert.doesNotMatch(issueJwtSrc, /entityService\.update/);
    assert.doesNotMatch(issueJwtSrc, /password/i);
  });

  await test('retired unauthenticated /stripe/confirm-social route is not registered', () => {
    const social = stripeRoutes.routes.find((r) => String(r.path).includes('confirm-social'));
    assert.equal(social, undefined, 'confirm-social route must stay retired');
  });

  await test('retired confirmSocial handler cannot reach JWT issuance', () => {
    const body = stripeControllerSrc.slice(
      stripeControllerSrc.indexOf('async confirmSocial'),
      stripeControllerSrc.indexOf('async testRoute')
    );
    const guardIndex = body.indexOf('retired endpoint called');
    const firstIssue = body.indexOf('jwt.issue');
    assert.ok(guardIndex > -1, 'retired guard missing');
    assert.ok(firstIssue === -1 || guardIndex < firstIssue, 'guard must precede any jwt.issue');
    assert.doesNotMatch(body, /raw body/);
  });

  console.log(`\n=== social login JWT guard: ${passed} passed ===\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
