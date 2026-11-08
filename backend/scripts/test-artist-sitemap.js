'use strict';

/**
 * Artist sitemap (B14): every public artist, radio and editorial profile is
 * listed, with no content minimum and no payment requirement. Only bands whose
 * owner account is blocked are left out.
 * Run: node scripts/test-artist-sitemap.js
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { sitemapEntries } = require('../src/utils/band/artistSitemap');

const read = (rel) => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log(`  PASS  ${name}`);
}

test('lists every band with a slug, whatever its content or payment state', () => {
  const entries = sitemapEntries([
    { slug: 'emerge', updatedAt: '2026-07-31T00:00:00Z', paymentsEnabled: false, users_permissions_user: { blocked: false } },
    { slug: 'brand-new-band', updatedAt: '2026-11-05T00:00:00Z', users_permissions_user: null },
    { slug: '939waby', updatedAt: null, users_permissions_user: { blocked: false } },
  ]);
  assert.deepStrictEqual(entries.map((e) => e.slug), ['emerge', 'brand-new-band', '939waby']);
  assert.strictEqual(entries[0].updatedAt, '2026-07-31T00:00:00Z');
});

test('leaves out only bands whose owner is blocked', () => {
  const entries = sitemapEntries([
    { slug: 'blocked-owner', users_permissions_user: { blocked: true } },
    { slug: 'fine', users_permissions_user: { blocked: false } },
  ]);
  assert.deepStrictEqual(entries.map((e) => e.slug), ['fine']);
});

test('skips empty and duplicate slugs; returns only slug and date', () => {
  const entries = sitemapEntries([{ slug: '' }, { slug: '  ' }, { slug: null }, { slug: 'a', email: 'x@y.z' }, { slug: 'a' }]);
  assert.deepStrictEqual(entries, [{ slug: 'a', updatedAt: null }]);
});

test('route is public, before /bands/:id, and reads only slug, date and the owner blocked flag', () => {
  const routes = read('src/api/band/routes/band.js');
  const sitemap = routes.indexOf("path: '/bands/sitemap'");
  assert.ok(sitemap > 0 && sitemap < routes.indexOf("path: '/bands/:id'"), 'declared before /bands/:id');
  assert.match(routes.slice(sitemap, sitemap + 120), /handler: 'band\.sitemap',\s*config: \{ auth: false \}/);
  const controller = read('src/api/band/controllers/band.js');
  const fn = controller.slice(controller.indexOf('async sitemap(ctx)'), controller.indexOf('async findBySlug(ctx)'));
  assert.match(fn, /fields: \["slug", "updatedAt"\]/);
  assert.match(fn, /users_permissions_user: \{ fields: \["blocked"\] \}/);
  assert.match(fn, /sitemapEntries\(bands\)/);
  assert.doesNotMatch(fn, /paymentsEnabled|stripe|singlesong|singlevideo/i, 'eligibility never depends on payments or content');
});

console.log(`\n${passed} passed`);
