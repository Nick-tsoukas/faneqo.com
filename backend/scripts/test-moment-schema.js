'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

const schema = JSON.parse(read('src/api/moment/content-types/moment/schema.json'));
assert.strictEqual(schema.collectionName, 'moments');
assert.strictEqual(schema.options.draftAndPublish, false);
assert.ok(schema.attributes.idempotencyKey.unique);
assert.ok(schema.attributes.idempotencyKey.column.unique);
assert.ok(schema.attributes.idempotencyKey.required);
assert.strictEqual(schema.attributes.kind.enum.includes('show'), true);
assert.deepStrictEqual(schema.attributes.status.enum, ['candidate', 'published', 'archived']);
assert.ok(schema.attributes.visibility.enum.includes('artist_fan'));
assert.ok(!schema.attributes.title);
assert.ok(!schema.attributes.headline);
assert.ok(!schema.attributes.body);
assert.ok(!schema.attributes.displayCopy);
assert.ok(!schema.attributes.shareText);
assert.ok(!schema.attributes.media);
assert.ok(!schema.attributes.email);
assert.ok(!schema.attributes.caption);
assert.ok(!schema.attributes.layout);
assert.strictEqual(schema.attributes.shareable.default, false);
assert.strictEqual(schema.attributes.status.default, 'candidate');

const routes = read('src/api/moment/routes/moment.js');
assert.match(routes, /routes: \[\]/);

const indexes = read('src/utils/moments/momentIndexes.js');
assert.match(indexes, /moments_idempotency_key_unique/);
assert.match(indexes, /CREATE UNIQUE INDEX IF NOT EXISTS/);
assert.match(indexes, /band_id, subject_fan_id, occurred_at/);

const labsRoutes = read('src/api/labs/routes/01-labs.js');
assert.match(labsRoutes, /\/labs\/relationship/);
assert.doesNotMatch(labsRoutes, /\/moments'/);
assert.match(labsRoutes, /auth: false/);

const labs = read('src/api/labs/controllers/labs.js');
assert.match(labs, /artistFanProgression/);
assert.match(labs, /getArtistFanProgression/);
assert.doesNotMatch(labs, /engagementScore|fanScore|loyaltyPoints/);

const producers = read('src/utils/relationshipEvents/relationshipEventProducers.js');
assert.match(producers, /ensureShowMomentForAttendanceSafe/);

const boot = read('src/index.js');
assert.match(boot, /ensureMomentIndexes/);
assert.match(boot, /api::moment.moment/);

const legacy = JSON.parse(read('src/api/fan-moment/content-types/fan-moment/schema.json'));
assert.strictEqual(legacy.collectionName, 'fan_moments');
assert.notStrictEqual(legacy.collectionName, schema.collectionName);

console.log('test-moment-schema: ok');
