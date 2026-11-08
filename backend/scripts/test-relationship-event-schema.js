'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

const schema = JSON.parse(
  read('src/api/relationship-event/content-types/relationship-event/schema.json')
);
assert.strictEqual(schema.collectionName, 'relationship_events');
assert.strictEqual(schema.options.draftAndPublish, false);
assert.ok(schema.attributes.idempotencyKey.unique);
assert.deepStrictEqual(schema.attributes.visibility.enum, [
  'artist_fan',
  'fan_only',
  'artist_only',
  'derived_from_source',
]);
assert.strictEqual(schema.attributes.fan.required, undefined);

const routes = read('src/api/relationship-event/routes/relationship-event.js');
assert.match(routes, /routes: \[\]/);

const indexes = read('src/utils/relationshipEvents/relationshipEventIndexes.js');
assert.match(indexes, /relationship_events_idempotency_key_unique/);
assert.match(indexes, /band_id, fan_id, occurred_at DESC/);
assert.match(indexes, /WHERE fan_id IS NULL/);

const labsRoutes = read('src/api/labs/routes/01-labs.js');
assert.match(labsRoutes, /\/labs\/relationships/);
assert.match(labsRoutes, /path: '\/labs\/relationship'/);
assert.match(labsRoutes, /\/labs\/integrity/);
assert.match(labsRoutes, /auth: false/);

const labs = read('src/api/labs/controllers/labs.js');
assert.match(labs, /ctx\.notFound|labsNotFound/);
assert.doesNotMatch(labs, /bodyText/);

const producers = read('src/utils/relationshipEvents/relationshipEventProducers.js');
assert.doesNotMatch(producers, /bodyText/);
assert.doesNotMatch(producers, /message body/);
assert.match(producers, /produceFanJoined/);
assert.match(producers, /produceShowAttendance/);
assert.match(producers, /produceMessageEvent/);

console.log('test-relationship-event-schema: ok');
