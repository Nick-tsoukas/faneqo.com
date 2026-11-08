'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const controllerPath = path.join(
  __dirname,
  '../src/api/artist-fan-relationship/controllers/artist-fan-relationship.js'
);
const routePath = path.join(
  __dirname,
  '../src/api/artist-fan-relationship/routes/artist-fan-relationship.js'
);
const indexPath = path.join(__dirname, '../src/index.js');

const controller = require(controllerPath);
const routes = require(routePath);

assert.strictEqual(controller.parsePositiveInt('42'), 42);
assert.strictEqual(controller.parsePositiveInt('0'), null);
assert.strictEqual(controller.parsePositiveInt('-1'), null);
assert.strictEqual(controller.parsePositiveInt('nope'), null);

const route = routes.routes?.[0];
assert.strictEqual(route?.method, 'GET');
assert.strictEqual(route?.path, '/artist-fan-relationships/:fanId');
assert.strictEqual(route?.handler, 'artist-fan-relationship.findOne');
assert.notStrictEqual(route?.config?.auth, false);

const controllerSource = fs.readFileSync(controllerPath, 'utf8');
assert.match(controllerSource, /requireBandPermission\([\s\S]*'viewFanIntelligence'/);
assert.match(controllerSource, /if \(!access\) return relationshipNotFound\(ctx\)/);
assert.match(controllerSource, /getArtistFanProgression/);
assert.doesNotMatch(controllerSource, /maskEmail/);

const indexSource = fs.readFileSync(indexPath, 'utf8');
assert.match(
  indexSource,
  /api::artist-fan-relationship\.artist-fan-relationship\.findOne/
);
assert.match(indexSource, /await ensureArtistFanRelationshipPermissions\(strapi\)/);

const hidden = { status: 200, body: null };
controller.relationshipNotFound(hidden);
assert.strictEqual(hidden.status, 404);
assert.strictEqual(hidden.body?.error?.status, 404);

console.log('test-artist-fan-relationship-route: ok');
