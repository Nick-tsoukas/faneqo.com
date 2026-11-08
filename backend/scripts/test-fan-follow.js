/**
 * Native Faneqo Follow — same Fan row, timestamps, email/attendance isolation.
 * Run: node scripts/test-fan-follow.js
 */
'use strict';

const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');

const {
  isFollowing,
  followPatch,
  unfollowPatch,
  endRelationshipPatch,
  followReadModel,
} = require(path.join(root, 'src/utils/fans/fanFollow'));
const { planExplicitJoinFollowBackfill } = require(path.join(root, 'src/utils/fans/fanFollowBackfill'));
const { fanMessagingEligibility } = require(path.join(root, 'src/utils/inbox/inboxPure'));

const schema = read('src/api/fan/content-types/fan/schema.json');
const subscribe = read('src/api/fan/controllers/fan.js');
const fanService = read('src/api/fan/services/fan.js');
const checkIn = read('src/api/fan-interaction/services/fan-interaction.js');
const followWrite = read('src/utils/fans/fanFollowWrite.js');
const routes = read('src/api/fan-account/routes/01-fan-account.js');
const controller = read('src/api/fan-account/controllers/fan-account.js');
const artists = read('src/utils/fanAccount.js');
const audience = read('src/utils/messaging/audienceResolver.js');
const passport = read('src/utils/passport/passportPure.js');
const backfill = read('src/utils/fans/fanFollowBackfill.js');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log(`  ok  ${name}`);
}

console.log('\n=== Native Faneqo Follow ===\n');

test('schema adds nullable follow timestamps, not a Follow model or boolean', () => {
  assert.match(schema, /"followedAt"/);
  assert.match(schema, /"unfollowedAt"/);
  assert.doesNotMatch(schema, /"isFollowing"/);
  assert.doesNotMatch(schema, /"follow"/);
  assert.ok(!fs.existsSync(path.join(root, 'src/api/follow')));
});

test('Following truth is timestamp comparison only', () => {
  assert.equal(isFollowing({ followedAt: '2026-01-01T00:00:00.000Z' }), true);
  assert.equal(isFollowing({ followedAt: '2026-02-01T00:00:00.000Z', unfollowedAt: '2026-01-01T00:00:00.000Z' }), true);
  assert.equal(isFollowing({ followedAt: '2026-01-01T00:00:00.000Z', unfollowedAt: '2026-02-01T00:00:00.000Z' }), false);
  assert.equal(isFollowing({ followedAt: null }), false);
  assert.equal(isFollowing({ status: 'subscribed' }), false);
  assert.equal(isFollowing({}), false);
  const readModel = followReadModel({ followedAt: '2026-01-01T00:00:00.000Z', unfollowedAt: null });
  assert.equal(readModel.isFollowing, true);
  assert.equal(readModel.followedAt, '2026-01-01T00:00:00.000Z');
});

test('follow/unfollow patches never touch email status', () => {
  const follow = followPatch(new Date('2026-03-01T00:00:00.000Z'));
  assert.equal(follow.followedAt, '2026-03-01T00:00:00.000Z');
  assert.equal(follow.unfollowedAt, null);
  assert.equal(Object.prototype.hasOwnProperty.call(follow, 'status'), false);
  const unfollow = unfollowPatch(new Date('2026-03-02T00:00:00.000Z'));
  assert.equal(unfollow.unfollowedAt, '2026-03-02T00:00:00.000Z');
  assert.equal(Object.prototype.hasOwnProperty.call(unfollow, 'status'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(unfollow, 'accountUser'), false);
});

test('end-relationship Unfollow also leaves the Fan List without deleting the Fan', () => {
  const ended = endRelationshipPatch(new Date('2026-03-03T00:00:00.000Z'));
  assert.equal(ended.unfollowedAt, '2026-03-03T00:00:00.000Z');
  assert.equal(ended.status, 'unsubscribed');
  assert.equal(ended.unsubscribedAt, '2026-03-03T00:00:00.000Z');
  assert.equal(Object.prototype.hasOwnProperty.call(ended, 'email'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(ended, 'accountUser'), false);
  assert.match(followWrite, /endArtistRelationshipOnFan/);
  assert.match(followWrite, /endArtistRelationshipForVisitor/);
  assert.match(followWrite, /status === 'subscribed'/);
  assert.doesNotMatch(followWrite, /entityService\.delete/);
  assert.doesNotMatch(followWrite, /body\.fanId/);
  assert.doesNotMatch(followWrite, /body\?\.email/);
});

test('explicit Join subscribe dual-writes Follow; resubscribe does not', () => {
  assert.match(subscribe, /establishFollowOnFan\(strapi, result\.fanId/);
  assert.match(subscribe, /async subscribe/);
  assert.doesNotMatch(fanService, /establishFollowOnFan/);
  assert.doesNotMatch(fanService, /followedAt/);
  assert.match(fanService, /async resubscribeByToken/);
  assert.doesNotMatch(fanService, /resubscribeByToken[\s\S]*followedAt/);
});

test('check-in creates a Fan without Follow timestamps', () => {
  assert.match(checkIn, /createFanIdempotent/);
  assert.match(checkIn, /status: 'subscribed'/);
  assert.doesNotMatch(checkIn, /followedAt/);
  assert.doesNotMatch(checkIn, /establishFollowOnFan/);
});

test('self-scoped follow/unfollow routes exist and require JWT in controller', () => {
  assert.match(routes, /\/fan-account\/artists\/:bandId\/follow/);
  assert.match(routes, /\/fan-account\/artists\/:bandId\/unfollow/);
  assert.match(controller, /async follow\(ctx\)/);
  assert.match(controller, /async unfollow\(ctx\)/);
  assert.match(controller, /if \(!userId\) return ctx\.unauthorized\('Authentication required'\)/);
  assert.match(followWrite, /findFanByBandEmail/);
  assert.match(followWrite, /createFanIdempotent/);
  assert.match(followWrite, /claimFanRelationshipsForUser/);
  assert.doesNotMatch(followWrite, /ctx\.request\.body.*email/);
  assert.doesNotMatch(followWrite, /body\.fanId/);
});

test('Follow-only create is email-ineligible and claimed', () => {
  assert.match(followWrite, /status: 'unsubscribed'/);
  assert.match(followWrite, /accountUser: userId/);
  assert.match(followWrite, /email-ineligible/);
  assert.doesNotMatch(followWrite, /status: 'subscribed'/);
  assert.doesNotMatch(followWrite, /unsubscribedAt:/);
});

test('anonymous Follow-by-email does not grant mailing-list consent', () => {
  assert.match(followWrite, /async function followArtistByEmail/);
  assert.match(followWrite, /status === 'removed'/);
  assert.match(followWrite, /status: 'unsubscribed'/);
  assert.match(subscribe, /followArtistByEmail/);
  assert.match(subscribe, /marketingConsent === false/);
  assert.match(subscribe, /subscribed: followed\.subscribed === true/);
  assert.doesNotMatch(followWrite, /status: 'subscribed'/);
});

test('Follow never assigns subscribed; Unfollow write ends the relationship', () => {
  assert.doesNotMatch(followWrite, /status: 'subscribed'/);
  assert.match(followWrite, /data: \{\s*\.\.\.followPatch/);
  assert.match(followWrite, /endArtistRelationshipOnFan\(strapi, fan,/);
  assert.match(controller, /endArtistRelationshipForVisitor/);
  assert.match(controller, /visitorToken: ctx\.request\.body\?\.visitorToken/);
  assert.doesNotMatch(controller, /ctx\.request\.body\?\.fanId/);
  assert.doesNotMatch(controller, /ctx\.request\.body\?\.email/);
});

test('artists read exposes isFollowing from timestamps, not status alone', () => {
  assert.match(artists, /followReadModel\(fan\)/);
  assert.match(artists, /isFollowing: follow\.isFollowing/);
  assert.match(artists, /followedAt: follow\.followedAt/);
  assert.match(artists, /'followedAt', 'unfollowedAt'/);
});

test('email audience stays subscribed-only; Follow-only can still DM', () => {
  assert.match(audience, /status: 'subscribed'/);
  assert.match(audience, /if \(!fan\.email \|\| fan\.status === 'unsubscribed'\) continue/);
  const followOnly = fanMessagingEligibility({ accountUser: 9, status: 'unsubscribed' });
  assert.equal(followOnly.isFaneqoMember, true);
  assert.equal(followOnly.canDirectMessage, true);
  const emailRemoved = fanMessagingEligibility({ accountUser: 9, status: 'removed' });
  assert.equal(emailRemoved.canDirectMessage, false);
});

test('Passport helpers stay attendance-derived', () => {
  assert.match(passport, /attendance|showCount|ordinal/i);
  assert.doesNotMatch(passport, /followedAt/);
  assert.doesNotMatch(passport, /isFollowing/);
});

test('historical backfill only converts proven joined_fan_list rows', () => {
  assert.match(backfill, /joined_fan_list/);
  assert.match(backfill, /fan_joined/);
  const plan = planExplicitJoinFollowBackfill({
    fans: [
      { id: 1, followedAt: null },
      { id: 2, followedAt: null, status: 'subscribed' },
      { id: 3, followedAt: '2026-01-01T00:00:00.000Z' },
    ],
    joinEvents: [
      { fanId: 1, interactionType: 'joined_fan_list', timestamp: '2025-06-01T00:00:00.000Z' },
      { fanId: 1, interactionType: 'joined_fan_list', timestamp: '2025-01-01T00:00:00.000Z' },
      { fanId: 2, interactionType: 'checked_in_show', timestamp: '2025-01-01T00:00:00.000Z' },
    ],
  });
  assert.equal(plan.updates.length, 1);
  assert.equal(plan.updates[0].fanId, 1);
  assert.equal(plan.updates[0].followedAt, '2025-01-01T00:00:00.000Z');
  assert.equal(plan.skipped.noProvenJoin, 1);
  assert.equal(plan.skipped.alreadyHasFollowedAt, 1);
});

console.log(`\ntest-fan-follow: ${passed} passed`);
