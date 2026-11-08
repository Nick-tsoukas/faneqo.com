'use strict';

/**
 * Editorial showcase entitlement on band create/update.
 * Run: node scripts/test-editorial-entitlement.js
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { sanitizeEditorialPayload } = require('../src/api/band/services/editorialShowcase');

const entitled = { id: 1, email: 'editor@publication.test', editorialShowcaseAccess: true };
const manager = { id: 2, email: 'manager@publication.test', editorialShowcaseAccess: false };
const stranger = { id: 3, email: 'someone@else.test' };

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log(`  ✅ ${name}`); }

test('entitled owner can turn the showcase on and set fields', () => {
  const data = sanitizeEditorialPayload({ name: 'X', editorialShowcaseEnabled: true, editorialSectionTitle: '<b>Latest</b>' }, entitled, { mode: 'update' });
  assert.strictEqual(data.editorialShowcaseEnabled, true);
  assert.strictEqual(data.editorialSectionTitle, 'Latest');
});

test('entitled owner can turn it off explicitly', () => {
  const data = sanitizeEditorialPayload({ editorialShowcaseEnabled: false }, entitled, { mode: 'update' });
  assert.strictEqual(data.editorialShowcaseEnabled, false);
});

test('a non-entitled manager saving an unrelated field leaves the showcase alone', () => {
  const data = sanitizeEditorialPayload({ name: 'Rock Mag', bio: 'New bio' }, manager, { mode: 'update' });
  assert.strictEqual('editorialShowcaseEnabled' in data, false, 'no editorial key reaches the update, so the stored value stays');
  assert.strictEqual(data.bio, 'New bio');
});

test('a non-entitled manager cannot change editorial settings', () => {
  const data = sanitizeEditorialPayload({
    name: 'Rock Mag',
    editorialShowcaseEnabled: false,
    editorialSectionTitle: 'Hijacked',
    editorialItems: [{ title: 'x', url: 'https://x.test' }],
    publicationHeaderImageMode: 'cinematic_cover',
  }, manager, { mode: 'update' });
  for (const key of ['editorialShowcaseEnabled', 'editorialSectionTitle', 'editorialItems', 'publicationHeaderImageMode']) {
    assert.strictEqual(key in data, false, `${key} dropped`);
  }
  assert.strictEqual(data.name, 'Rock Mag', 'unrelated fields still save');
});

test('a non-entitled account cannot create a profile with the showcase on', () => {
  const data = sanitizeEditorialPayload({ name: 'New', editorialShowcaseEnabled: true, editorialItems: [] }, stranger);
  assert.strictEqual(data.editorialShowcaseEnabled, false);
  assert.strictEqual('editorialItems' in data, false);
});

test('no user at all is treated as non-entitled', () => {
  const data = sanitizeEditorialPayload({ name: 'X', editorialShowcaseEnabled: true }, null, { mode: 'update' });
  assert.strictEqual('editorialShowcaseEnabled' in data, false);
});

test('band update passes update mode', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'src/api/band/controllers/band.js'), 'utf8');
  assert.match(src, /sanitizeEditorialPayload\(data, user, \{ mode: 'update' \}\)/);
});

console.log(`\n=== editorial entitlement: ${passed} passed ===`);
