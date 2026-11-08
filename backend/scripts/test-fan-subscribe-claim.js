/**
 * Signed-in Join Fan List reuses canonical claim after subscribe.
 * Run: node scripts/test-fan-subscribe-claim.js
 */
const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');

const controller = fs.readFileSync(
  path.join(__dirname, '../src/api/fan/controllers/fan.js'),
  'utf8'
);
const artists = fs.readFileSync(
  path.join(__dirname, '../src/api/fan-account/controllers/fan-account.js'),
  'utf8'
);
const service = fs.readFileSync(
  path.join(__dirname, '../src/api/fan/services/fan.js'),
  'utf8'
);

assert.match(controller, /async function claimSignedInFanIfPresent/);
assert.match(controller, /claimFanRelationshipsForUser\(user\)/);
assert.match(controller, /await claimSignedInFanIfPresent\(ctx\)/);
assert.equal(
  (controller.match(/await claimSignedInFanIfPresent\(ctx\)/g) || []).length,
  2,
  'claim after both new and duplicate subscribe success'
);
assert.match(artists, /claimFanRelationshipsForUser\(user\)/);
assert.match(artists, /listClaimedArtists\(userId\)/);

assert.match(
  service,
  /existing\.status === 'removed' \|\| existing\.status === 'unsubscribed'/
);
assert.match(service, /return \{ success: true, fan: restored, fanId: restored\.id, restored: true \}/);

console.log('test-fan-subscribe-claim: ok');
