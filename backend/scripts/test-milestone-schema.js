'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

const schema = JSON.parse(read('src/api/milestone/content-types/milestone/schema.json'));
assert.strictEqual(schema.collectionName, 'milestones');
assert.strictEqual(schema.options.draftAndPublish, false);
assert.ok(schema.attributes.idempotencyKey.unique);
assert.ok(schema.attributes.idempotencyKey.column.unique);
assert.ok(schema.attributes.idempotencyKey.required);
assert.ok(schema.attributes.type.required);
assert.ok(schema.attributes.evidence.required);
assert.ok(schema.attributes.occurredAt.required);
assert.ok(schema.attributes.version.required);
assert.deepStrictEqual(schema.attributes.status.enum, ['active', 'archived']);
assert.strictEqual(schema.attributes.subjectFan.required, undefined);
assert.ok(!schema.attributes.title);
assert.ok(!schema.attributes.headline);
assert.ok(!schema.attributes.body);
assert.ok(!schema.attributes.displayCopy);
assert.ok(!schema.attributes.shareText);
assert.ok(!schema.attributes.caption);
assert.ok(!schema.attributes.emoji);
assert.ok(!schema.attributes.layout);
assert.ok(!schema.attributes.rive);
assert.ok(!schema.attributes.visibility);
assert.ok(!schema.attributes.email);
assert.ok(!schema.attributes.media);
assert.ok(!schema.attributes.score);
assert.ok(!schema.attributes.level);

const routes = read('src/api/milestone/routes/milestone.js');
assert.match(routes, /routes: \[\]/);

const indexes = read('src/utils/milestones/milestoneIndexes.js');
assert.match(indexes, /milestones_idempotency_key_unique/);
assert.match(indexes, /CREATE UNIQUE INDEX IF NOT EXISTS/);
assert.match(indexes, /band_id, subject_fan_id, type/);

const keys = read('src/utils/milestones/milestoneKeys.js');
assert.match(keys, /fan_artist\.first_show/);
assert.match(keys, /fan_artist\.second_show/);
assert.match(keys, /fan_artist\.first_reply/);
assert.doesNotMatch(keys, /YOU CAME BACK/);
assert.doesNotMatch(keys, /IT STARTED HERE/);

const labsRoutes = read('src/api/labs/routes/01-labs.js');
assert.match(labsRoutes, /\/labs\/relationship/);
assert.doesNotMatch(labsRoutes, /\/milestones'/);

const labs = read('src/api/labs/controllers/labs.js');
assert.doesNotMatch(labs, /engagementScore|fanScore|loyaltyPoints/);

const producers = read('src/utils/relationshipEvents/relationshipEventProducers.js');
assert.match(producers, /reconcileFanArtistMilestonesSafe/);

const boot = read('src/index.js');
assert.match(boot, /ensureMilestoneIndexes/);
assert.match(boot, /api::milestone.milestone/);

const relIndexes = read('src/utils/relationshipEvents/relationshipEventIndexes.js');
assert.match(relIndexes, /relationship_events_band_fan_type_occurred/);

const moment = JSON.parse(read('src/api/moment/content-types/moment/schema.json'));
assert.notStrictEqual(moment.collectionName, schema.collectionName);

console.log('test-milestone-schema: ok');
