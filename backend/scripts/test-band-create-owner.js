/**
 * Band ownership comes from the signed-in account, never the request body.
 *
 * Runs the real band controller's create and update against a fake Strapi
 * (no network, no database) and checks what would be written.
 *
 * Run: node scripts/test-band-create-owner.js
 */
'use strict';

const assert = require('assert');
const Module = require('module');

// Load the controller without booting Strapi: the core-controller factory
// just hands back our config function.
const realLoad = Module._load;
Module._load = function load(request, ...rest) {
  if (request === '@strapi/strapi') {
    return { factories: { createCoreController: (_uid, config) => config } };
  }
  return realLoad.call(this, request, ...rest);
};
const controllerFactory = require('../src/api/band/controllers/band');
Module._load = realLoad;

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

const SIGNED_IN = { id: 11, email: 'artist@example.test' };
const VICTIM_ID = 99;

function fakeStrapi({ role = 'owner' } = {}) {
  const writes = [];
  const strapi = {
    log: { info() {}, warn() {}, error() {} },
    entityService: {
      async findOne(uid, id) {
        if (uid === 'plugin::users-permissions.user') {
          return { id, email: SIGNED_IN.email, editorialShowcaseAccess: false };
        }
        if (uid === 'api::band.band') return { id: Number(id), name: 'Existing' };
        return null;
      },
      async findMany(uid) {
        if (uid === 'api::band-member.band-member') {
          return role ? [{ id: 1, role, status: 'active' }] : [];
        }
        return [];
      },
      async create(uid, args) {
        writes.push({ op: 'create', uid, data: args.data });
        return { id: 501, ...args.data };
      },
      async update(uid, id, args) {
        writes.push({ op: 'update', uid, id, data: args.data });
        return { id: Number(id), ...args.data };
      },
    },
    db: {
      query() {
        return {
          async findOne() { return { id: 1, users_permissions_user: { id: SIGNED_IN.id } }; },
          async findMany() { return []; },
        };
      },
    },
  };
  return { strapi, writes };
}

function makeCtx({ user = SIGNED_IN, body = {}, params = {}, multipart = false, files } = {}) {
  const calls = [];
  const reply = (kind) => (msg) => { calls.push([kind, msg]); return { kind, msg }; };
  return {
    calls,
    params,
    query: {},
    is: (type) => (multipart && type === 'multipart' ? 'multipart' : false),
    request: { body, headers: {}, files },
    state: user ? { user } : {},
    unauthorized: reply('unauthorized'),
    badRequest: reply('badRequest'),
    forbidden: reply('forbidden'),
    notFound: reply('notFound'),
    throw(status, msg) { const e = new Error(msg); e.status = status; throw e; },
  };
}

const bandBody = (extra = {}) => ({ name: 'Moon Dough', bio: 'Indie pop from Nashville.', genre: 'Pop', ...extra });

(async () => {
  console.log('\nBand create: owner');

  await test('normal creation: the signed-in artist owns the band', async () => {
    const { strapi, writes } = fakeStrapi();
    const controller = controllerFactory({ strapi });
    const ctx = makeCtx({ body: { data: bandBody({ users_permissions_user: SIGNED_IN.id }) } });
    const res = await controller.create(ctx);
    assert.deepStrictEqual(ctx.calls, []);
    assert.strictEqual(writes.length, 1);
    assert.strictEqual(writes[0].data.users_permissions_user, SIGNED_IN.id);
    assert.strictEqual(writes[0].data.name, 'Moon Dough', 'artist fields still save');
    assert.strictEqual(res.data.id, 501);
  });

  await test('creation without an owner in the body still belongs to the signed-in artist', async () => {
    const { strapi, writes } = fakeStrapi();
    const ctx = makeCtx({ body: { data: bandBody() } });
    await controllerFactory({ strapi }).create(ctx);
    assert.strictEqual(writes[0].data.users_permissions_user, SIGNED_IN.id);
  });

  await test('spoofed owner id in the body is ignored', async () => {
    const { strapi, writes } = fakeStrapi();
    const ctx = makeCtx({ body: { data: bandBody({ users_permissions_user: VICTIM_ID }) } });
    await controllerFactory({ strapi }).create(ctx);
    assert.strictEqual(writes[0].data.users_permissions_user, SIGNED_IN.id);
  });

  for (const shape of [
    { connect: [{ id: VICTIM_ID }] },
    { set: [VICTIM_ID] },
    { id: VICTIM_ID },
    String(VICTIM_ID),
  ]) {
    await test(`spoofed owner relation shape ${JSON.stringify(shape)} is ignored`, async () => {
      const { strapi, writes } = fakeStrapi();
      const ctx = makeCtx({ body: { data: bandBody({ users_permissions_user: shape }) } });
      await controllerFactory({ strapi }).create(ctx);
      assert.strictEqual(writes[0].data.users_permissions_user, SIGNED_IN.id);
    });
  }

  await test('spoofed owner inside a multipart create is ignored', async () => {
    const { strapi, writes } = fakeStrapi();
    const ctx = makeCtx({
      multipart: true,
      body: { data: JSON.stringify(bandBody({ users_permissions_user: VICTIM_ID })) },
      files: {},
    });
    await controllerFactory({ strapi }).create(ctx);
    assert.deepStrictEqual(ctx.calls, []);
    assert.strictEqual(writes[0].data.users_permissions_user, SIGNED_IN.id);
  });

  await test('Stripe Connect fields in a create body are still dropped', async () => {
    const { strapi, writes } = fakeStrapi();
    const ctx = makeCtx({ body: { data: bandBody({ paymentsEnabled: true, stripeAccountId: 'acct_x' }) } });
    await controllerFactory({ strapi }).create(ctx);
    assert.strictEqual('paymentsEnabled' in writes[0].data, false);
    assert.strictEqual('stripeAccountId' in writes[0].data, false);
  });

  await test('no signed-in user: nothing is created', async () => {
    const { strapi, writes } = fakeStrapi();
    const ctx = makeCtx({ user: null, body: { data: bandBody({ users_permissions_user: VICTIM_ID }) } });
    await controllerFactory({ strapi }).create(ctx);
    assert.strictEqual(writes.length, 0);
    assert.strictEqual(ctx.calls[0][0], 'unauthorized');
  });

  await test('missing required fields still return a clear error', async () => {
    const { strapi, writes } = fakeStrapi();
    const ctx = makeCtx({ body: { data: { name: 'No bio' } } });
    await controllerFactory({ strapi }).create(ctx);
    assert.strictEqual(writes.length, 0);
    assert.strictEqual(ctx.calls[0][0], 'badRequest');
  });

  console.log('\nBand update: owner');

  for (const role of ['owner', 'manager']) {
    await test(`${role} saving the band cannot move it to another account`, async () => {
      const { strapi, writes } = fakeStrapi({ role });
      const ctx = makeCtx({ params: { id: '7' }, body: { data: bandBody({ users_permissions_user: VICTIM_ID }) } });
      await controllerFactory({ strapi }).update(ctx);
      assert.strictEqual(writes.length, 1);
      assert.strictEqual('users_permissions_user' in writes[0].data, false, 'owner is never written on update');
      assert.strictEqual(writes[0].data.bio, 'Indie pop from Nashville.', 'page content still saves');
    });
  }

  await test('the edit page payload (owner = self) still saves normally', async () => {
    const { strapi, writes } = fakeStrapi({ role: 'owner' });
    const ctx = makeCtx({ params: { id: '7' }, body: { data: bandBody({ users_permissions_user: SIGNED_IN.id }) } });
    await controllerFactory({ strapi }).update(ctx);
    assert.deepStrictEqual(ctx.calls, []);
    assert.strictEqual(writes[0].data.name, 'Moon Dough');
  });

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed) process.exit(1);
})();
