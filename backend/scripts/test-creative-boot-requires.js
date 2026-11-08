'use strict';

/**
 * Creative Studio API — boot-critical requires, route ↔ handler agreement,
 * schema shape, and the allowlist gate (behavioural, against a fake strapi).
 * Run: node scripts/test-creative-boot-requires.js
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const api = path.join(root, 'src/api/creative');

const schema = require(path.join(api, 'content-types/creative/schema.json'));
const routes = require(path.join(api, 'routes/01-creative.js')).routes;
const controller = require(path.join(api, 'controllers/creative.js'));
const { createCreativeService, UID } = require(path.join(api, 'services/creative.js'));
const auth = require(path.join(api, 'utils/creativeAuth.js'));
const pure = require(path.join(api, 'utils/creativePure.js'));
const controllerSrc = fs.readFileSync(path.join(api, 'controllers/creative.js'), 'utf8');

// Schema
assert.strictEqual(schema.info.singularName, 'creative');
assert.strictEqual(schema.info.pluralName, 'creatives');
assert.strictEqual(schema.collectionName, 'creatives');
assert.strictEqual(schema.options.draftAndPublish, false);
for (const field of ['title', 'templateId', 'kind', 'status', 'formats', 'primaryFormat', 'variant', 'content', 'snapshot', 'rightsStatus', 'sceneCount', 'bandId', 'bandSlug', 'artistName', 'ownerEmail', 'owner']) {
  assert.ok(schema.attributes[field], `creative schema missing ${field}`);
}
assert.strictEqual(schema.attributes.ownerEmail.private, true, 'ownerEmail must be private');
assert.strictEqual(UID, 'api::creative.creative');

// Routes ↔ controller
assert.ok(routes.length >= 7);
for (const route of routes) {
  assert.strictEqual(route.config.auth, false, `${route.path} must be auth:false (controller gates)`);
  const method = String(route.handler).split('.')[1];
  assert.strictEqual(typeof controller[method], 'function', `missing handler ${method}`);
  assert.match(controllerSrc, new RegExp(`async ${method}\\(ctx\\)`));
}
const key = (r) => `${r.method} ${r.path}`;
const keys = new Set(routes.map(key));
for (const want of ['GET /creatives', 'GET /creatives/artists', 'GET /creatives/:id', 'POST /creatives', 'PUT /creatives/:id', 'POST /creatives/:id/duplicate', 'DELETE /creatives/:id']) {
  assert.ok(keys.has(want), `missing route ${want}`);
}
// /creatives/artists must be registered before /creatives/:id
assert.ok(routes.findIndex((r) => r.path === '/creatives/artists') < routes.findIndex((r) => r.path === '/creatives/:id'));

// Every handler gates before touching the service.
for (const name of Object.keys(controller)) {
  const start = controllerSrc.indexOf(`async ${name}(ctx)`);
  const head = controllerSrc.slice(start, start + 260);
  assert.match(head, /requireStudioUser\(ctx\)/, `${name} must gate first`);
  assert.ok(head.indexOf('requireStudioUser') < head.indexOf('createCreativeService') || head.indexOf('createCreativeService') === -1, `${name} must gate before service`);
}

// Allowlist
assert.strictEqual(auth.isStudioEmail('nick.tsoukas101@gmail.com', { NODE_ENV: 'production' }), true);
assert.strictEqual(auth.isStudioEmail('  Nick.Tsoukas101@Gmail.com ', { NODE_ENV: 'production' }), true);
assert.strictEqual(auth.isStudioEmail('test@gmail.com', { NODE_ENV: 'production' }), false);
assert.strictEqual(auth.isStudioEmail('test@gmail.com', { NODE_ENV: 'development' }), true);
assert.strictEqual(auth.isStudioEmail('someone@example.com', { NODE_ENV: 'development' }), false);
assert.strictEqual(auth.isStudioEmail('extra@example.com', { NODE_ENV: 'production', CREATIVE_STUDIO_EMAILS: 'Extra@example.com, other@x.io' }), true);
assert.strictEqual(auth.isStudioEmail('', { NODE_ENV: 'development' }), false);

// Behavioural gate against a fake strapi
function fakeStrapi({ users = [], jwt = {} } = {}) {
  return {
    plugins: { 'users-permissions': { services: { jwt: { async verify(token) { if (!(token in jwt)) throw new Error('bad'); return jwt[token]; } } } } },
    db: { query() { return { async findOne(opts) { return users.find((u) => String(u.id) === String(opts.where.id)) || null; } }; } },
  };
}
const ctxWith = (token) => ({ status: 200, body: null, state: {}, request: { headers: token ? { authorization: `Bearer ${token}` } : {} } });
const prod = { NODE_ENV: 'production' };

(async () => {
  const strapiFake = fakeStrapi({
    users: [{ id: 1, email: 'nick.tsoukas101@gmail.com' }, { id: 2, email: 'stranger@example.com' }, { id: 3, email: 'nick.tsoukas101@gmail.com', blocked: true }],
    jwt: { nick: { id: 1 }, stranger: { id: 2 }, blocked: { id: 3 } },
  });

  let ctx = ctxWith(null);
  let res = await auth.requireStudioUser(ctx, strapiFake, prod);
  assert.ok(res.error); assert.strictEqual(ctx.status, 404);

  ctx = ctxWith('forged');
  res = await auth.requireStudioUser(ctx, strapiFake, prod);
  assert.ok(res.error); assert.strictEqual(ctx.status, 404);

  ctx = ctxWith('stranger');
  res = await auth.requireStudioUser(ctx, strapiFake, prod);
  assert.ok(res.error); assert.strictEqual(ctx.status, 404, 'non-allowlisted account must see a stealth 404');

  ctx = ctxWith('blocked');
  res = await auth.requireStudioUser(ctx, strapiFake, prod);
  assert.ok(res.error);

  ctx = ctxWith('nick');
  res = await auth.requireStudioUser(ctx, strapiFake, prod);
  assert.ok(res.user); assert.strictEqual(res.user.email, 'nick.tsoukas101@gmail.com');

  // Service scopes every query by ownerEmail
  const calls = [];
  const svc = createCreativeService({
    entityService: {
      async findMany(uid, opts) { calls.push({ op: 'findMany', uid, opts }); return [{ id: 7, title: 'T', ownerEmail: 'a@x.io', content: {}, formats: ['post'] }]; },
      async count(uid, opts) { calls.push({ op: 'count', uid, opts }); return 1; },
      async create(uid, opts) { calls.push({ op: 'create', uid, opts }); return { id: 8, ...opts.data }; },
      async update(uid, id, opts) { calls.push({ op: 'update', uid, id, opts }); return { id, ...opts.data }; },
      async delete(uid, id) { calls.push({ op: 'delete', uid, id }); return { id }; },
    },
  });
  await svc.list('a@x.io');
  assert.deepStrictEqual(calls[0].opts.filters, { ownerEmail: 'a@x.io' });
  await svc.findOwned('a@x.io', 7);
  assert.deepStrictEqual(calls.at(-1).opts.filters, { id: 7, ownerEmail: 'a@x.io' });
  const created = await svc.create({ id: 1, email: 'a@x.io' }, { title: 'New' });
  assert.strictEqual(created.ownerEmail, 'a@x.io');
  assert.strictEqual(created.owner, 1);
  const dup = await svc.duplicate({ id: 1, email: 'a@x.io' }, 7);
  assert.strictEqual(dup.title, 'T (variation)');
  assert.strictEqual(dup.status, 'draft');
  assert.ok(!('id' in calls.at(-1).opts.data), 'duplicate must not copy the id');

  // Sanitizer
  const good = pure.sanitizeCreativeInput({ title: 'X', templateId: 'artist-spotlight', kind: 'post', formats: ['post', 'feed'], primaryFormat: 'post', content: { a: 1 }, ownerEmail: 'evil@x.io', owner: 99 });
  assert.ok(good.ok);
  assert.ok(!('ownerEmail' in good.data) && !('owner' in good.data), 'caller cannot set ownership');
  assert.strictEqual(good.data.status, 'draft');
  const bad = pure.sanitizeCreativeInput({ title: 'X', templateId: 'nope', kind: 'post', formats: ['huge'], primaryFormat: 'post', content: [] });
  assert.strictEqual(bad.ok, false);
  assert.ok(bad.errors.length >= 3);
  const big = pure.sanitizeCreativeInput({ title: 'X', templateId: 'education', kind: 'post', formats: ['square'], primaryFormat: 'square', content: { blob: 'x'.repeat(pure.MAX_CONTENT_BYTES + 1) } });
  assert.strictEqual(big.ok, false);
  const partial = pure.sanitizeCreativeInput({ status: 'ready' }, { partial: true });
  assert.ok(partial.ok); assert.deepStrictEqual(partial.data, { status: 'ready' });
  const presented = pure.presentCreative({ id: 1, title: 'T', templateId: 'education', kind: 'post', status: 'draft', formats: ['square'], primaryFormat: 'square', content: {}, snapshot: null, ownerEmail: 'a@x.io', owner: { id: 1 } });
  assert.ok(!('ownerEmail' in presented) && !('owner' in presented), 'response must not leak ownership');
  assert.deepStrictEqual(pure.clampPage({ limit: 99999 }), { start: 0, limit: 200 });
  assert.strictEqual(pure.parseId('12'), 12);
  assert.strictEqual(pure.parseId('abc'), null);

  console.log('test-creative-boot-requires: ok');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
