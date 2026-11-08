/**
 * Fan Account V1 — lifecycle stitch (Slice F).
 * Run: node scripts/test-fan-account-lifecycle.js
 *
 * Proves the approved path is still wired: check-in before account, magic-link
 * reuse, canonical FanProfile ensure, claim, profile/avatar completion, and
 * artist-facing Messages identity without rewriting Fan rows.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');

const fanAccountSrc = read('src/utils/fanAccount.js');
const checkInSrc = read('src/api/fan-interaction/services/fan-interaction.js');
const profileServiceSrc = read('src/utils/fanProfile/fanProfileService.js');
const inboxSrc = read('src/utils/inbox/directMessaging.js');
const identitySrc = read('src/utils/fanProfile/fanProfilePure.js');

const fanAccount = require(path.join(root, 'src/utils/fanAccount'));
const fanProfilePure = require(path.join(root, 'src/utils/fanProfile/fanProfilePure'));

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log(`  ✅ ${name}`);
}

console.log('\n=== Fan Account V1 lifecycle ===\n');

test('check-in records attendance without creating an auth user', () => {
  assert.match(checkInSrc, /async processShowCheckIn/);
  assert.match(checkInSrc, /createFanIdempotent/);
  assert.match(checkInSrc, /createAttendanceIdempotent/);
  assert.doesNotMatch(checkInSrc, /findOrCreateUserByEmail/);
  assert.doesNotMatch(checkInSrc, /verifyMagicLink/);
  assert.doesNotMatch(checkInSrc, /users-permissions.*user\.add/);
  assert.doesNotMatch(checkInSrc, /requestMagicLink/);
});

test('magic-link request stays passwordless and non-enumerating', () => {
  assert.match(fanAccountSrc, /async function requestMagicLink/);
  assert.match(fanAccountSrc, /assertRateLimit/);
  assert.match(fanAccountSrc, /\/fan\/verify\?token=/);
  assert.match(fanAccountSrc, /If that email can be used, we have sent a link/);
  assert.doesNotMatch(fanAccountSrc, /forgot-password|resetPassword|sendResetPassword/);
});

test('verify reuses an existing user, then ensures one FanProfile and claims', () => {
  const verify = fanAccountSrc.slice(
    fanAccountSrc.indexOf('async function verifyMagicLink'),
    fanAccountSrc.indexOf('async function getMeStatus')
  );
  assert.match(verify, /invalid_token/);
  assert.match(verify, /token_used/);
  assert.match(verify, /token_expired/);
  assert.match(verify, /findOrCreateUserByEmail\(link\.email\)/);
  assert.match(verify, /await ensureFanProfile\(user\.id\)/);
  assert.match(verify, /claimFanRelationships\(user\.id, link\.email\)/);
  assert.match(verify, /linkVisitorToAccount/);
  assert.match(verify, /resolveMagicLinkRedirect\(link\.returnTo\)/);

  const reuse = fanAccountSrc.slice(
    fanAccountSrc.indexOf('async function findOrCreateUserByEmail'),
    fanAccountSrc.indexOf('function planFanClaimLinks')
  );
  assert.match(reuse, /if \(existing\)/);
  assert.match(reuse, /created: false/);
  assert.match(reuse, /mintRandomPassword/);
});

test('every profile write path uses ensureForUser, not a second create', () => {
  assert.match(fanAccountSrc, /ensureForUser\(userId\)/);
  assert.match(profileServiceSrc, /async function ensureForUser/);
  assert.match(profileServiceSrc, /async function getSelfProfile/);
  assert.match(profileServiceSrc, /async function updateSelfProfile/);
  assert.match(profileServiceSrc, /async function uploadSelfAvatar/);
  assert.match(profileServiceSrc, /async function deleteSelfAvatar/);
  assert.match(inboxSrc, /resolveIdentitiesForFans/);
  assert.doesNotMatch(identitySrc, /entityService\.create\('api::fan-profile/);
});

test('GET and avatar do not mark the profile complete; PATCH does', () => {
  const get = profileServiceSrc.slice(
    profileServiceSrc.indexOf('async function getSelfProfile'),
    profileServiceSrc.indexOf('async function updateSelfProfile')
  );
  const patch = profileServiceSrc.slice(
    profileServiceSrc.indexOf('async function updateSelfProfile'),
    profileServiceSrc.indexOf('async function serializeAfterMutation')
  );
  const upload = profileServiceSrc.slice(
    profileServiceSrc.indexOf('async function uploadSelfAvatar'),
    profileServiceSrc.indexOf('async function deleteSelfAvatar')
  );
  assert.doesNotMatch(get, /profileCompletedAt/);
  assert.match(patch, /profileCompletedAt: new Date\(\)\.toISOString\(\)/);
  assert.doesNotMatch(upload, /profileCompletedAt:/);
  assert.match(upload, /data: \{ avatar: uploaded\.id \}/);
});

test('check-in fan later claims to the verified user without renaming the Fan row', () => {
  const plan = fanAccount.planFanClaimLinks(
    [
      { id: 100, accountUser: null, firstName: 'Nik', lastName: 'T.' },
      { id: 101, accountUser: 9, firstName: 'Other' },
    ],
    2
  );
  assert.deepStrictEqual(plan.toLink, [100]);
  assert.deepStrictEqual(plan.skippedOwnedByOther, [101]);

  const identity = fanProfilePure.resolveFanDisplayIdentity({
    fan: { id: 100, firstName: 'Nik', lastName: 'T.', city: 'Nashville' },
    profile: { displayName: 'Nik Beats', avatar: { url: '/uploads/nik.webp' } },
  });
  const presented = fanProfilePure.presentResolvedIdentity(identity);
  assert.strictEqual(presented.displayName, 'Nik Beats');
  assert.strictEqual(presented.avatarUrl, '/uploads/nik.webp');
  assert.strictEqual(presented.initials, 'NB');
});

test('email is never a display-name fallback and identity DTO stays presentation-only', () => {
  const out = fanProfilePure.resolveFanDisplayIdentity({
    fan: { firstName: 'fan@example.com', email: 'fan@example.com' },
    profile: { displayName: 'fan@example.com' },
  });
  assert.strictEqual(out.displayName, 'Unnamed fan');
  assert.deepStrictEqual(
    Object.keys(fanProfilePure.presentResolvedIdentity(out)).sort(),
    ['avatarUrl', 'displayName', 'initials']
  );
});

test('artist Inbox identity is live overlay, not a Fan/Conversation rewrite', () => {
  assert.match(inboxSrc, /resolveFanIdentities/);
  assert.match(inboxSrc, /presentResolvedIdentity/);
  assert.doesNotMatch(inboxSrc, /updateFan\(.*displayName/);
  assert.doesNotMatch(inboxSrc, /FanProfile change/);
});

console.log(`\n=== fan account lifecycle: ${passed} passed ===`);
