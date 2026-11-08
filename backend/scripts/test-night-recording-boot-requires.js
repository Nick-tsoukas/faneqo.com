'use strict';

/**
 * Boot-critical Night Recording requires. A wrong relative path crashes Strapi start.
 * Run: node scripts/test-night-recording-boot-requires.js
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

require(path.join(__dirname, '../src/utils/nightRecordings/nightRecordingPure'));
require(path.join(__dirname, '../src/utils/nightRecordings/nightRecordingIndexes'));
require(path.join(__dirname, '../src/utils/nightRecordings/nightRecordingService'));

const routes = require(path.join(__dirname, '../src/api/night-recording/routes/01-night-recording')).routes;
const coreRoutes = require(path.join(__dirname, '../src/api/night-recording/routes/night-recording')).routes;
const controllerSrc = fs.readFileSync(
  path.join(__dirname, '../src/api/night-recording/controllers/night-recording.js'),
  'utf8'
);
const schema = require(path.join(
  __dirname,
  '../src/api/night-recording/content-types/night-recording/schema.json'
));

assert.deepStrictEqual(coreRoutes, []);
assert.ok(routes.some((r) => r.method === 'GET' && r.path === '/show-recaps/:id/recordings'));
assert.ok(routes.some((r) => r.method === 'POST' && r.path === '/show-recaps/:id/recordings'));
assert.ok(routes.some((r) => r.method === 'GET' && r.path === '/night-recordings/:id'));
assert.ok(routes.some((r) => r.method === 'PATCH' && r.path === '/night-recordings/:id'));
assert.ok(routes.some((r) => r.method === 'DELETE' && r.path === '/night-recordings/:id'));

for (const route of routes) {
  const method = String(route.handler).split('.')[1];
  assert.match(controllerSrc, new RegExp(`async ${method}\\(ctx\\)`), `missing handler ${method}`);
}

assert.strictEqual(schema.options.draftAndPublish, false);
assert.deepStrictEqual(schema.attributes.visibility.enum, ['public', 'fan_list', 'show_attendees']);
assert.deepStrictEqual(schema.attributes.status.enum, ['draft', 'published']);
assert.deepStrictEqual(schema.attributes.kind.enum, ['audio', 'video']);
assert.deepStrictEqual(schema.attributes.source.enum, ['upload', 'youtube', 'spotify', 'external']);
assert.strictEqual(schema.attributes.showRecap.target, 'api::show-recap.show-recap');
assert.strictEqual(schema.attributes.band.target, 'api::band.band');
assert.ok(!schema.attributes.spotifyUrl);
assert.ok(!schema.attributes.youtubeUrl);
assert.ok(!schema.attributes.audioFile);

const recapSchema = require(path.join(
  __dirname,
  '../src/api/show-recap/content-types/show-recap/schema.json'
));
assert.ok(!recapSchema.attributes.recordings);
assert.ok(!recapSchema.attributes.spotifyUrl);
assert.ok(!recapSchema.attributes.youtubeUrl);
assert.ok(!recapSchema.attributes.audioFile);
assert.ok(!recapSchema.attributes.videoFile);

const recapWrite = fs.readFileSync(
  path.join(__dirname, '../src/utils/showMode/recapWritePure.js'),
  'utf8'
);
assert.doesNotMatch(recapWrite, /night-recording|nightRecording|NightRecording/);

const indexSrc = fs.readFileSync(path.join(__dirname, '../src/index.js'), 'utf8');
assert.match(indexSrc, /utils\/nightRecordings\/nightRecordingIndexes/);
assert.match(indexSrc, /ensureNightRecordingIndexes/);
assert.match(indexSrc, /api::night-recording\.night-recording/);

console.log('  ✅ Night Recording boot requires');
