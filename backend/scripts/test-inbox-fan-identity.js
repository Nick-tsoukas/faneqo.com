/**
 * Slice E — artist-facing Inbox uses global FanProfile identity.
 * Run: node scripts/test-inbox-fan-identity.js
 *
 * Memory store only. Identity is injected via resolveFanIdentities.
 * Does not require a running Strapi database.
 */

const assert = require('assert');
const path = require('path');

const fanProfilePure = require(path.join(__dirname, '../src/utils/fanProfile/fanProfilePure'));
const { resetInboxRateLimitForTests } = require(path.join(__dirname, '../src/utils/inbox/inboxRateLimit'));
const {
  createMemoryInboxStore,
  createInboxService,
} = require(path.join(__dirname, '../src/utils/inbox/directMessaging'));

let passed = 0;
let failed = 0;

function test(name, fn) {
  return Promise.resolve()
    .then(() => fn())
    .then(() => {
      passed += 1;
      console.log(`  ✅ ${name}`);
    })
    .catch((err) => {
      failed += 1;
      console.error(`  ❌ ${name}`);
      console.error(`     ${err.message}`);
    });
}

function containsKey(obj, needle) {
  return JSON.stringify(obj).toLowerCase().includes(String(needle).toLowerCase());
}

function assertSafeArtistFan(fan, label = 'fan') {
  assert.ok(fan, `${label} missing`);
  const keys = Object.keys(fan).sort();
  for (const forbidden of ['email', 'user', 'accountUser', 'accountUserId', 'profileId', 'profile']) {
    assert.ok(!keys.includes(forbidden), `${label} exposed ${forbidden}`);
  }
  assert.ok(!containsKey(fan, '@example.com'), `${label} leaked email`);
  assert.ok(!containsKey(fan, 'mime'), `${label} leaked raw upload`);
  assert.ok(!Object.prototype.hasOwnProperty.call(fan, 'source'), `${label} leaked identity source`);
  assert.ok(Object.prototype.hasOwnProperty.call(fan, 'displayName'));
  assert.ok(Object.prototype.hasOwnProperty.call(fan, 'initials'));
  assert.ok(Object.prototype.hasOwnProperty.call(fan, 'avatarUrl'));
}

function identitiesFromProfileMap(profilesByUserId, { onCall } = {}) {
  return async function resolveFanIdentities(fans) {
    if (typeof onCall === 'function') onCall(fans);
    const byFanId = new Map();
    for (const fan of fans || []) {
      if (fan == null || fan.id == null) continue;
      const ownerId = Number(fan.accountUserId ?? fan.accountUser?.id ?? fan.accountUser);
      const profile = Number.isFinite(ownerId) ? profilesByUserId.get(ownerId) || null : null;
      byFanId.set(fan.id, fanProfilePure.resolveFanDisplayIdentity({ fan, profile }));
    }
    return byFanId;
  };
}

function setupWorld({ profilesByUserId = new Map(), onIdentityCall } = {}) {
  resetInboxRateLimitForTests();
  const store = createMemoryInboxStore();
  store.seedUser({ id: 1, email: 'owner-a@example.com' });
  store.seedUser({ id: 2, email: 'sarah@example.com' });
  store.seedUser({ id: 3, email: 'owner-b@example.com' });
  store.seedUser({ id: 5, email: 'other-fan@example.com' });
  store.seedUser({ id: 6, email: 'nick-dual@example.com' });
  store.seedUser({ id: 8, email: 'cityfan@example.com' });
  store.seedUser({ id: 9, email: 'unnamed@example.com' });

  store.seedBand({ id: 10, name: 'BurningThunder', slug: 'burningthunder', avatarUrl: '/bt.png' });
  store.seedBand({ id: 20, name: 'Badflower', slug: 'badflower', avatarUrl: '/bf.png' });

  store.seedMember(10, 1, 'owner');
  store.seedMember(20, 3, 'owner');
  store.seedMember(10, 6, 'owner');

  store.seedFan({
    id: 100,
    band: 10,
    accountUser: 2,
    firstName: 'Nik',
    lastName: 'T.',
    email: 'sarah@example.com',
    city: 'Nashville',
    checkedInShowCount: 2,
    status: 'subscribed',
  });
  store.seedAttendance({ fan: 100, campaignId: 'nashville' });
  store.seedAttendance({ fan: 100, campaignId: 'knoxville' });

  store.seedFan({
    id: 103,
    band: 10,
    accountUser: 5,
    firstName: 'Removed',
    email: 'removed@example.com',
    status: 'removed',
  });

  store.seedFan({
    id: 106,
    band: 20,
    accountUser: 6,
    firstName: 'Nick',
    email: 'nick-dual@example.com',
    city: 'Chicago',
    status: 'subscribed',
  });

  store.seedFan({
    id: 108,
    band: 10,
    accountUser: 8,
    email: 'cityfan@example.com',
    city: 'Austin',
    status: 'subscribed',
  });

  store.seedFan({
    id: 109,
    band: 10,
    accountUser: 9,
    email: 'unnamed@example.com',
    status: 'subscribed',
  });

  const inbox = createInboxService(store, {
    logger: { warn() {}, error() {}, info() {} },
    resolveFanIdentities: identitiesFromProfileMap(profilesByUserId, { onCall: onIdentityCall }),
  });
  return { store, inbox, profilesByUserId };
}

async function startOk(inbox, userId, bandId, fanId) {
  const r = await inbox.getOrCreateConversationForFan({ userId, bandId, fanId });
  assert.strictEqual(r.ok, true, r.message);
  return r;
}

(async () => {
  console.log('\n=== Inbox FanProfile identity ===\n');

  await test('A. profile.displayName wins over Fan relationship name', async () => {
    const profiles = new Map([
      [2, { displayName: 'Nik Beats', avatar: { url: '/uploads/nik.webp' } }],
    ]);
    const { inbox } = setupWorld({ profilesByUserId: profiles });
    const started = await startOk(inbox, 1, 10, 100);
    assert.strictEqual(started.conversation.fan.displayName, 'Nik Beats');
    assert.strictEqual(started.conversation.fan.initials, 'NB');
    assert.strictEqual(started.conversation.fan.avatarUrl, '/uploads/nik.webp');
  });

  await test('B. profile firstName + last initial when no chosen displayName', async () => {
    const profiles = new Map([
      [2, { firstName: 'Nik', lastName: 'Beats' }],
    ]);
    const { inbox } = setupWorld({ profilesByUserId: profiles });
    const started = await startOk(inbox, 1, 10, 100);
    assert.strictEqual(started.conversation.fan.displayName, 'Nik B.');
    assert.strictEqual(started.conversation.fan.initials, 'NB');
  });

  await test('C. Fan relationship fallback when profile is empty', async () => {
    const profiles = new Map([[2, { displayName: '', firstName: '', lastName: '' }]]);
    const { inbox } = setupWorld({ profilesByUserId: profiles });
    const started = await startOk(inbox, 1, 10, 100);
    assert.strictEqual(started.conversation.fan.displayName, 'Nik T.');
  });

  await test('D. city fan fallback', async () => {
    const { inbox } = setupWorld();
    const started = await startOk(inbox, 1, 10, 108);
    assert.strictEqual(started.conversation.fan.displayName, 'Austin fan');
    assert.strictEqual(started.conversation.fan.initials, 'F');
    assert.strictEqual(started.conversation.fan.avatarUrl, null);
  });

  await test('E. Unnamed fan fallback', async () => {
    const { inbox } = setupWorld();
    const started = await startOk(inbox, 1, 10, 109);
    assert.strictEqual(started.conversation.fan.displayName, 'Unnamed fan');
    assert.strictEqual(started.conversation.fan.initials, 'F');
  });

  await test('F. avatarUrl comes from FanProfile', async () => {
    const profiles = new Map([
      [2, { displayName: 'Nik Beats', avatar: { url: '/uploads/nik.webp' } }],
    ]);
    const { inbox } = setupWorld({ profilesByUserId: profiles });
    const started = await startOk(inbox, 1, 10, 100);
    assert.strictEqual(started.conversation.fan.avatarUrl, '/uploads/nik.webp');
  });

  await test('G. email is never a display-name fallback', async () => {
    const { inbox } = setupWorld();
    const started = await startOk(inbox, 1, 10, 109);
    assert.notStrictEqual(started.conversation.fan.displayName, 'unnamed@example.com');
    assert.ok(!containsKey(started.conversation, 'unnamed@example.com'));
  });

  await test('artist conversation list uses FanProfile identity', async () => {
    const profiles = new Map([
      [2, { displayName: 'Nik Beats', avatar: { url: '/uploads/nik.webp' } }],
    ]);
    const { inbox } = setupWorld({ profilesByUserId: profiles });
    await startOk(inbox, 1, 10, 100);
    const list = await inbox.listArtistConversations({ userId: 1, bandId: 10 });
    assert.strictEqual(list.ok, true);
    assert.strictEqual(list.conversations[0].fan.displayName, 'Nik Beats');
    assert.strictEqual(list.conversations[0].fan.avatarUrl, '/uploads/nik.webp');
    assert.strictEqual(list.conversations[0].fan.initials, 'NB');
    assertSafeArtistFan(list.conversations[0].fan, 'list fan');
  });

  await test('artist conversation detail matches the list', async () => {
    const profiles = new Map([
      [2, { displayName: 'Nik Beats', avatar: { url: '/uploads/nik.webp' } }],
    ]);
    const { inbox } = setupWorld({ profilesByUserId: profiles });
    const started = await startOk(inbox, 1, 10, 100);
    const list = await inbox.listArtistConversations({ userId: 1, bandId: 10 });
    const detail = await inbox.getConversation({ userId: 1, conversationId: started.conversationId });
    assert.strictEqual(detail.conversation.viewer, 'artist');
    assert.deepStrictEqual(detail.conversation.fan, list.conversations[0].fan);
  });

  await test('DM candidate list uses the same identity including avatar', async () => {
    const profiles = new Map([
      [2, { displayName: 'Nik Beats', avatar: { url: '/uploads/nik.webp' } }],
    ]);
    const { inbox } = setupWorld({ profilesByUserId: profiles });
    const r = await inbox.listDmCandidates({ userId: 1, bandId: 10, search: '' });
    const nik = (r.fans || []).find((f) => f.id === 100);
    assert.ok(nik);
    assert.strictEqual(nik.displayName, 'Nik Beats');
    assert.strictEqual(nik.initials, 'NB');
    assert.strictEqual(nik.avatarUrl, '/uploads/nik.webp');
    assertSafeArtistFan(nik, 'candidate');
  });

  await test('artist request list uses FanProfile identity', async () => {
    const profiles = new Map([
      [2, { displayName: 'Nik Beats', avatar: { url: '/uploads/nik.webp' } }],
    ]);
    const { inbox } = setupWorld({ profilesByUserId: profiles });
    const created = await inbox.createFanMessageRequest({
      userId: 2,
      bandId: 10,
      bodyText: 'Are you coming back this fall?',
    });
    assert.strictEqual(created.ok, true, created.message);
    const listed = await inbox.listArtistMessageRequests({ userId: 1, bandId: 10 });
    assert.strictEqual(listed.requests[0].fan.displayName, 'Nik Beats');
    assert.strictEqual(listed.requests[0].fan.avatarUrl, '/uploads/nik.webp');
    assertSafeArtistFan(listed.requests[0].fan, 'request');
  });

  await test('accepted request conversation uses the same identity', async () => {
    const profiles = new Map([
      [2, { displayName: 'Nik Beats', avatar: { url: '/uploads/nik.webp' } }],
    ]);
    const { inbox } = setupWorld({ profilesByUserId: profiles });
    const created = await inbox.createFanMessageRequest({
      userId: 2,
      bandId: 10,
      bodyText: 'Hello from the pit',
    });
    const accepted = await inbox.acceptMessageRequest({ userId: 1, requestId: created.request.id });
    assert.strictEqual(accepted.ok, true, accepted.message);
    assert.strictEqual(accepted.request.fan.displayName, 'Nik Beats');
    assert.strictEqual(accepted.conversation.fan.displayName, 'Nik Beats');
    assert.strictEqual(accepted.conversation.fan.avatarUrl, '/uploads/nik.webp');
    assert.strictEqual(accepted.conversation.fan.displayName, accepted.request.fan.displayName);
  });

  await test('fan-side artist identity is unchanged', async () => {
    const profiles = new Map([
      [2, { displayName: 'Nik Beats', avatar: { url: '/uploads/nik.webp' } }],
    ]);
    const { inbox } = setupWorld({ profilesByUserId: profiles });
    const started = await startOk(inbox, 1, 10, 100);
    const fanList = await inbox.listFanConversations({ userId: 2 });
    const fanDetail = await inbox.getConversation({ userId: 2, conversationId: started.conversationId });
    assert.strictEqual(fanList.conversations[0].artist.name, 'BurningThunder');
    assert.strictEqual(fanList.conversations[0].artist.avatarUrl, '/bt.png');
    assert.ok(!fanList.conversations[0].fan);
    assert.strictEqual(fanDetail.conversation.viewer, 'fan');
    assert.strictEqual(fanDetail.conversation.artist.name, 'BurningThunder');
    assert.ok(!fanDetail.conversation.fan);
  });

  await test('removed fan eligibility is unchanged', async () => {
    const profiles = new Map([
      [5, { displayName: 'Still Removed', avatar: { url: '/uploads/nope.webp' } }],
    ]);
    const { inbox } = setupWorld({ profilesByUserId: profiles });
    const r = await inbox.getOrCreateConversationForFan({ userId: 1, bandId: 10, fanId: 103 });
    assert.strictEqual(r.ok, false);
    assert.strictEqual(r.status, 409);
  });

  await test('blocked conversation stays blocked after a profile change', async () => {
    const profiles = new Map([
      [2, { displayName: 'Nik Beats' }],
    ]);
    const { inbox } = setupWorld({ profilesByUserId: profiles });
    const started = await startOk(inbox, 1, 10, 100);
    await inbox.sendMessage({ userId: 1, conversationId: started.conversationId, bodyText: 'Hey' });
    const blocked = await inbox.setBlocked({
      userId: 2,
      conversationId: started.conversationId,
      blocked: true,
    });
    assert.strictEqual(blocked.ok, true, blocked.message);
    const detail = await inbox.getConversation({ userId: 1, conversationId: started.conversationId });
    assert.strictEqual(detail.conversation.blocked, true);
    assert.strictEqual(detail.conversation.fan.displayName, 'Nik Beats');
    const send = await inbox.sendMessage({
      userId: 1,
      conversationId: started.conversationId,
      bodyText: 'still blocked',
    });
    assert.strictEqual(send.ok, false);
  });

  await test('profile change updates the next fetch without rewriting Fan or Conversation', async () => {
    const profiles = new Map();
    const { store, inbox } = setupWorld({ profilesByUserId: profiles });
    const started = await startOk(inbox, 1, 10, 100);
    await inbox.sendMessage({ userId: 1, conversationId: started.conversationId, bodyText: 'old name thread' });
    const before = await inbox.listArtistConversations({ userId: 1, bandId: 10 });
    assert.strictEqual(before.conversations[0].fan.displayName, 'Nik T.');
    assert.strictEqual(before.conversations[0].fan.avatarUrl, null);

    const fanBefore = JSON.parse(JSON.stringify(store.fans.get(100)));
    const convBefore = JSON.parse(JSON.stringify(store.conversations.get(started.conversationId)));
    const messagesBefore = JSON.stringify([...store.messages.values()]);

    profiles.set(2, { displayName: 'Nik Beats', avatar: { url: '/uploads/new.webp' } });

    const afterList = await inbox.listArtistConversations({ userId: 1, bandId: 10 });
    const afterDetail = await inbox.getConversation({ userId: 1, conversationId: started.conversationId });
    assert.strictEqual(afterList.conversations[0].fan.displayName, 'Nik Beats');
    assert.strictEqual(afterList.conversations[0].fan.avatarUrl, '/uploads/new.webp');
    assert.strictEqual(afterDetail.conversation.fan.displayName, 'Nik Beats');
    assert.strictEqual(afterDetail.conversation.fan.avatarUrl, '/uploads/new.webp');

    assert.deepStrictEqual(store.fans.get(100).firstName, fanBefore.firstName);
    assert.deepStrictEqual(store.fans.get(100).lastName, fanBefore.lastName);
    assert.deepStrictEqual(store.conversations.get(started.conversationId), convBefore);
    assert.strictEqual(JSON.stringify([...store.messages.values()]), messagesBefore);
  });

  await test('artist conversation list uses one bulk identity lookup', async () => {
    const profiles = new Map();
    const calls = [];
    const { store, inbox } = setupWorld({
      profilesByUserId: profiles,
      onIdentityCall: (fans) => calls.push(fans.length),
    });
    for (let i = 0; i < 20; i += 1) {
      const userId = 200 + i;
      const fanId = 300 + i;
      store.seedUser({ id: userId, email: `bulk${i}@example.com` });
      store.seedFan({
        id: fanId,
        band: 10,
        accountUser: userId,
        firstName: `Fan${i}`,
        email: `bulk${i}@example.com`,
        status: 'subscribed',
      });
      profiles.set(userId, { displayName: `Stage ${i}` });
      await startOk(inbox, 1, 10, fanId);
    }
    calls.length = 0;
    const list = await inbox.listArtistConversations({ userId: 1, bandId: 10, page: 1, pageSize: 20 });
    assert.strictEqual(list.conversations.length, 20);
    assert.strictEqual(calls.length, 1, `expected 1 identity lookup, got ${calls.length}`);
    assert.ok(calls[0] >= 20, `bulk lookup should see the page of fans, got ${calls[0]}`);
    assert.ok(list.conversations.every((row) => String(row.fan.displayName).startsWith('Stage ')));
  });

  await test('DM candidates use one bulk identity lookup', async () => {
    const calls = [];
    const { inbox } = setupWorld({
      profilesByUserId: new Map([[2, { displayName: 'Nik Beats' }]]),
      onIdentityCall: (fans) => calls.push(fans.length),
    });
    const r = await inbox.listDmCandidates({ userId: 1, bandId: 10, search: '' });
    assert.strictEqual(r.ok, true);
    assert.strictEqual(calls.length, 1);
    assert.ok(calls[0] >= 2);
  });

  await test('artist request list uses one bulk identity lookup', async () => {
    const profiles = new Map();
    const calls = [];
    const { store, inbox } = setupWorld({
      profilesByUserId: profiles,
      onIdentityCall: (fans) => calls.push(fans.length),
    });
    for (let i = 0; i < 5; i += 1) {
      const userId = 400 + i;
      const fanId = 500 + i;
      store.seedUser({ id: userId, email: `req${i}@example.com` });
      store.seedFan({
        id: fanId,
        band: 10,
        accountUser: userId,
        firstName: `Req${i}`,
        email: `req${i}@example.com`,
        status: 'subscribed',
      });
      profiles.set(userId, { displayName: `Requester ${i}` });
      const created = await inbox.createFanMessageRequest({
        userId,
        bandId: 10,
        bodyText: `hello ${i}`,
        firstName: `Req${i}`,
      });
      assert.strictEqual(created.ok, true, created.message);
    }
    calls.length = 0;
    const listed = await inbox.listArtistMessageRequests({ userId: 1, bandId: 10 });
    assert.strictEqual(listed.requests.length, 5);
    assert.strictEqual(calls.length, 1, `expected 1 identity lookup, got ${calls.length}`);
    assert.ok(listed.requests.every((row) => String(row.fan.displayName).startsWith('Requester ')));
  });

  await test('artist-as-fan resolves their FanProfile, not a band role', async () => {
    const profiles = new Map([
      [6, { displayName: 'Nick the Fan', avatar: { url: '/uploads/nick.webp' } }],
    ]);
    const { inbox } = setupWorld({ profilesByUserId: profiles });
    const started = await startOk(inbox, 3, 20, 106);
    const list = await inbox.listArtistConversations({ userId: 3, bandId: 20 });
    assert.strictEqual(started.conversation.fan.displayName, 'Nick the Fan');
    assert.strictEqual(list.conversations[0].fan.displayName, 'Nick the Fan');
    assert.ok(!containsKey(list.conversations[0].fan, 'owner'));
    assert.ok(!containsKey(list.conversations[0].fan, 'manager'));
    assert.ok(!containsKey(list.conversations[0], 'burningthunder'));
  });

  await test('artist-facing DTOs stay privacy-safe', async () => {
    const profiles = new Map([
      [2, { id: 77, displayName: 'Nik Beats', avatar: { url: '/uploads/nik.webp', mime: 'image/webp', id: 900 } }],
    ]);
    const { inbox } = setupWorld({ profilesByUserId: profiles });
    const started = await startOk(inbox, 1, 10, 100);
    await inbox.createFanMessageRequest({
      userId: 8,
      bandId: 10,
      bodyText: 'city request',
      firstName: 'Austin',
    });
    const list = await inbox.listArtistConversations({ userId: 1, bandId: 10 });
    const detail = await inbox.getConversation({ userId: 1, conversationId: started.conversationId });
    const candidates = await inbox.listDmCandidates({ userId: 1, bandId: 10, search: '' });
    const requests = await inbox.listArtistMessageRequests({ userId: 1, bandId: 10 });
    for (const payload of [started, list, detail, candidates, requests]) {
      assert.ok(!containsKey(payload, 'sarah@example.com'));
      assert.ok(!containsKey(payload, 'accountUser'));
      assert.ok(!containsKey(payload, 'profileId'));
      assert.ok(!containsKey(payload, '"source"'));
    }
    assertSafeArtistFan(list.conversations[0].fan);
    assertSafeArtistFan(detail.conversation.fan);
    assertSafeArtistFan(candidates.fans.find((f) => f.id === 100), 'candidate');
  });

  console.log(`\n=== inbox fan identity: ${passed} passed, ${failed} failed ===`);
  if (failed) process.exit(1);
})();
