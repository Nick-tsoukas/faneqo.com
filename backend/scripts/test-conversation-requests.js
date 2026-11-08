/**
 * Fan → band message requests.
 * Run: node scripts/test-conversation-requests.js
 *
 * In-memory store only. Does not rewrite DM send/read/poll.
 */

const assert = require('assert');
const path = require('path');

const pure = require(path.join(__dirname, '../src/utils/inbox/inboxPure'));
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

function setupWorld() {
  resetInboxRateLimitForTests();
  const store = createMemoryInboxStore();
  store.seedUser({ id: 1, email: 'owner-a@example.com' });
  store.seedUser({ id: 2, email: 'sarah@example.com' });
  store.seedUser({ id: 3, email: 'owner-b@example.com' });
  store.seedUser({ id: 4, email: 'manager-a@example.com' });
  store.seedUser({ id: 5, email: 'other-fan@example.com' });
  store.seedUser({ id: 6, email: 'nick-dual@example.com' });
  store.seedUser({ id: 8, email: 'unnamed@example.com' });
  store.seedUser({ id: 9, email: 'removed@example.com' });

  store.seedBand({ id: 10, name: 'BurningThunder', slug: 'burningthunder', avatarUrl: '/bt.png' });
  store.seedBand({ id: 20, name: 'Badflower', slug: 'badflower', avatarUrl: '/bf.png' });

  store.seedMember(10, 1, 'owner');
  store.seedMember(10, 4, 'manager');
  store.seedMember(20, 3, 'owner');
  store.seedMember(10, 6, 'owner');

  store.seedFan({
    id: 100,
    band: 10,
    accountUser: 2,
    firstName: 'Elizabeth',
    lastName: 'Rodriguez',
    email: 'sarah@example.com',
    city: 'Nashville',
    checkedInShowCount: 2,
    status: 'subscribed',
  });
  store.seedFan({
    id: 104,
    band: 10,
    accountUser: 5,
    firstName: 'Unsub',
    email: 'unsub@example.com',
    status: 'unsubscribed',
  });
  store.seedFan({
    id: 103,
    band: 10,
    accountUser: 9,
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
    firstName: '',
    email: 'unnamed@example.com',
    status: 'subscribed',
  });

  const inbox = createInboxService(store, { logger: { warn() {}, error() {}, info() {} } });
  return { store, inbox };
}

(async () => {
  console.log('\n=== Conversation requests ===\n');

  await test('unauth fan cannot request', async () => {
    const { inbox } = setupWorld();
    const r = await inbox.createFanMessageRequest({
      userId: null,
      bandId: 10,
      bodyText: 'Hello',
    });
    assert.strictEqual(r.ok, false);
    assert.strictEqual(r.error, 'unauthorized');
  });

  await test('verified fan can request', async () => {
    const { inbox } = setupWorld();
    const r = await inbox.createFanMessageRequest({
      userId: 2,
      bandId: 10,
      bodyText: 'Are you coming back this fall?',
    });
    assert.strictEqual(r.ok, true, r.message);
    assert.strictEqual(r.request.status, 'pending');
    assert.strictEqual(r.request.fan.displayName, 'Elizabeth R.');
    assert.strictEqual(r.request.fan.initials, 'ER');
    assert.ok(!containsKey(r.request, 'sarah@example.com'));
    assert.ok(!containsKey(r.request, 'accountUser'));
  });

  await test('same pending pair cannot duplicate', async () => {
    const { inbox } = setupWorld();
    const first = await inbox.createFanMessageRequest({
      userId: 2,
      bandId: 10,
      bodyText: 'First',
    });
    const second = await inbox.createFanMessageRequest({
      userId: 2,
      bandId: 10,
      bodyText: 'Second',
    });
    assert.strictEqual(first.ok, true);
    assert.strictEqual(second.ok, true);
    assert.strictEqual(second.duplicate, true);
    assert.strictEqual(second.request.id, first.request.id);
    assert.strictEqual(second.request.initialMessagePreview.includes('First'), true);
  });

  await test('existing conversation bypasses request', async () => {
    const { inbox } = setupWorld();
    const started = await inbox.getOrCreateConversationForFan({ userId: 1, bandId: 10, fanId: 100 });
    assert.strictEqual(started.ok, true);
    const r = await inbox.createFanMessageRequest({
      userId: 2,
      bandId: 10,
      bodyText: 'Should open existing',
    });
    assert.strictEqual(r.ok, true, r.message);
    assert.strictEqual(r.existingConversation, true);
    assert.strictEqual(r.conversationId, started.conversationId);
  });

  await test('blocked fan denied', async () => {
    const { inbox } = setupWorld();
    const started = await inbox.getOrCreateConversationForFan({ userId: 1, bandId: 10, fanId: 100 });
    await inbox.sendMessage({
      userId: 1,
      conversationId: started.conversationId,
      bodyText: 'Hey',
    });
    const blocked = await inbox.setBlocked({
      userId: 2,
      conversationId: started.conversationId,
      blocked: true,
    });
    assert.strictEqual(blocked.ok, true);
    const r = await inbox.createFanMessageRequest({
      userId: 2,
      bandId: 10,
      bodyText: 'After block',
    });
    assert.strictEqual(r.ok, false);
    assert.strictEqual(r.error, 'unavailable');
  });

  await test('removed fan cannot request', async () => {
    const { inbox } = setupWorld();
    const r = await inbox.createFanMessageRequest({
      userId: 9,
      bandId: 10,
      bodyText: 'Removed should fail',
    });
    assert.strictEqual(r.ok, false);
    assert.strictEqual(r.error, 'unavailable');
  });

  await test('email unsub does not block request', async () => {
    const { store, inbox } = setupWorld();
    store.seedFan({
      id: 110,
      band: 20,
      accountUser: 5,
      firstName: 'Unsub',
      email: 'unsub@example.com',
      status: 'unsubscribed',
    });
    const r = await inbox.createFanMessageRequest({
      userId: 5,
      bandId: 20,
      bodyText: 'Still allowed',
    });
    assert.strictEqual(r.ok, true, r.message);
    assert.strictEqual(r.request.status, 'pending');
  });

  await test('accept creates conversation and inserts first message once', async () => {
    const { inbox, store } = setupWorld();
    const created = await inbox.createFanMessageRequest({
      userId: 2,
      bandId: 10,
      bodyText: 'Are you coming back to Nashville this fall?',
    });
    const accepted = await inbox.acceptMessageRequest({
      userId: 1,
      requestId: created.request.id,
    });
    assert.strictEqual(accepted.ok, true, accepted.message);
    assert.ok(accepted.conversationId);
    const msgs = await store.listMessages(accepted.conversationId);
    assert.strictEqual(msgs.length, 1);
    assert.strictEqual(msgs[0].senderSide, 'fan');
    assert.strictEqual(msgs[0].bodyText, 'Are you coming back to Nashville this fall?');
    assert.strictEqual(accepted.conversation.fan.displayName, 'Elizabeth R.');
  });

  await test('double accept is idempotent', async () => {
    const { inbox, store } = setupWorld();
    const created = await inbox.createFanMessageRequest({
      userId: 2,
      bandId: 10,
      bodyText: 'Once only',
    });
    const a = await inbox.acceptMessageRequest({ userId: 1, requestId: created.request.id });
    const b = await inbox.acceptMessageRequest({ userId: 1, requestId: created.request.id });
    assert.strictEqual(a.ok, true);
    assert.strictEqual(b.ok, true);
    assert.strictEqual(a.conversationId, b.conversationId);
    const msgs = await store.listMessages(a.conversationId);
    assert.strictEqual(msgs.length, 1);
  });

  await test('decline does not create conversation', async () => {
    const { inbox, store } = setupWorld();
    const created = await inbox.createFanMessageRequest({
      userId: 2,
      bandId: 10,
      bodyText: 'Please',
    });
    const declined = await inbox.declineMessageRequest({
      userId: 1,
      requestId: created.request.id,
    });
    assert.strictEqual(declined.ok, true);
    assert.strictEqual(declined.request.status, 'declined');
    assert.strictEqual(store.conversations.size, 0);
  });

  await test('fan cannot instantly re-request after decline', async () => {
    const { inbox } = setupWorld();
    const created = await inbox.createFanMessageRequest({
      userId: 2,
      bandId: 10,
      bodyText: 'Please',
    });
    await inbox.declineMessageRequest({ userId: 1, requestId: created.request.id });
    const again = await inbox.createFanMessageRequest({
      userId: 2,
      bandId: 10,
      bodyText: 'Again',
    });
    assert.strictEqual(again.ok, false);
    assert.strictEqual(again.error, 'unavailable');
  });

  await test('manager cannot accept or decline', async () => {
    const { inbox } = setupWorld();
    const created = await inbox.createFanMessageRequest({
      userId: 2,
      bandId: 10,
      bodyText: 'Owner only',
    });
    const accept = await inbox.acceptMessageRequest({
      userId: 4,
      requestId: created.request.id,
    });
    const decline = await inbox.declineMessageRequest({
      userId: 4,
      requestId: created.request.id,
    });
    assert.strictEqual(accept.ok, false);
    assert.strictEqual(accept.error, 'forbidden');
    assert.strictEqual(decline.ok, false);
    assert.strictEqual(decline.error, 'forbidden');
  });

  await test('safe DTO does not expose email or accountUser', async () => {
    const { inbox } = setupWorld();
    const created = await inbox.createFanMessageRequest({
      userId: 2,
      bandId: 10,
      bodyText: 'Hi',
    });
    const listed = await inbox.listArtistMessageRequests({ userId: 1, bandId: 10 });
    assert.strictEqual(listed.ok, true);
    assert.ok(!containsKey(listed, '@example.com'));
    assert.ok(!containsKey(listed, 'accountUser'));
    assert.ok(!containsKey(created.request, 'jwt'));
    assert.strictEqual(listed.requests[0].fan.displayName, 'Elizabeth R.');
  });

  await test('dual-role user can request another band', async () => {
    const { inbox } = setupWorld();
    const own = await inbox.createFanMessageRequest({
      userId: 6,
      bandId: 10,
      bodyText: 'Should not message own band',
    });
    assert.strictEqual(own.ok, false);
    const other = await inbox.createFanMessageRequest({
      userId: 6,
      bandId: 20,
      bodyText: 'Love the new record',
    });
    assert.strictEqual(other.ok, true, other.message);
    assert.strictEqual(other.request.fan.displayName, 'Nick');
  });

  await test('profile first name skips the name sheet', async () => {
    const { inbox, store } = setupWorld();
    store.seedUser({ id: 11, email: 'nik@example.com' });
    store.seedFan({
      id: 111,
      band: 20,
      accountUser: 11,
      firstName: '',
      email: 'nik@example.com',
      status: 'subscribed',
    });
    store.seedFanProfile({
      user: 11,
      firstName: 'Nikolaos',
      lastName: 'Tsoukas',
    });
    const status = await inbox.getFanMessageStatus({ userId: 11, bandId: 20 });
    assert.strictEqual(status.ok, true);
    assert.strictEqual(status.state, 'can_request');
    assert.strictEqual(status.firstName, 'Nikolaos');
    const created = await inbox.createFanMessageRequest({
      userId: 11,
      bandId: 20,
      bodyText: 'Hello from the profile name',
    });
    assert.strictEqual(created.ok, true, created.message);
    assert.strictEqual(created.request.fan.displayName, 'Nikolaos T.');
  });

  await test('missing first name is collected, not a new signup', async () => {
    const { inbox } = setupWorld();
    const status = await inbox.getFanMessageStatus({ userId: 8, bandId: 10 });
    assert.strictEqual(status.ok, true);
    assert.strictEqual(status.state, 'needs_name');
    const denied = await inbox.createFanMessageRequest({
      userId: 8,
      bandId: 10,
      bodyText: 'Hello',
    });
    assert.strictEqual(denied.ok, false);
    assert.strictEqual(denied.error, 'needs_first_name');
    const named = await inbox.createFanMessageRequest({
      userId: 8,
      bandId: 10,
      bodyText: 'Hello',
      firstName: 'Alex',
      lastName: 'Kim',
    });
    assert.strictEqual(named.ok, true, named.message);
    assert.strictEqual(named.request.fan.displayName, 'Alex K.');
  });

  await test('first request does not create a conversation', async () => {
    const { inbox, store } = setupWorld();
    const created = await inbox.createFanMessageRequest({
      userId: 2,
      bandId: 10,
      bodyText: 'Hey, loved the show',
    });
    assert.strictEqual(created.ok, true, created.message);
    assert.strictEqual(created.request.status, 'pending');
    assert.ok(!created.conversationId);
    assert.strictEqual(store.conversations.size, 0);
    const listed = await inbox.listFanConversations({ userId: 2 });
    assert.strictEqual(listed.ok, true);
    assert.strictEqual(listed.conversations.length, 0);
  });

  await test('accept sets fan participant accountUser and request conversation', async () => {
    const { inbox, store } = setupWorld();
    const created = await inbox.createFanMessageRequest({
      userId: 2,
      bandId: 10,
      bodyText: 'Hey, loved the show',
    });
    const accepted = await inbox.acceptMessageRequest({
      userId: 1,
      requestId: created.request.id,
    });
    assert.strictEqual(accepted.ok, true, accepted.message);
    const parts = await store.listParticipants(accepted.conversationId);
    const fanPart = parts.find((p) => p.side === 'fan');
    const bandPart = parts.find((p) => p.side === 'band');
    assert.ok(bandPart);
    assert.strictEqual(Number(fanPart.accountUser), 2);
    const conv = store.conversations.get(accepted.conversationId);
    assert.strictEqual(Number(conv.band), 10);
    assert.strictEqual(Number(conv.fanAccountUser), 2);
    const request = store.requests.get(created.request.id);
    assert.strictEqual(request.status, 'accepted');
    assert.strictEqual(Number(request.conversation), Number(accepted.conversationId));
  });

  await test('accepted fan can list and get; other fan cannot; artist can', async () => {
    const { inbox } = setupWorld();
    const created = await inbox.createFanMessageRequest({
      userId: 2,
      bandId: 10,
      bodyText: 'Hey, loved the show',
    });
    const accepted = await inbox.acceptMessageRequest({
      userId: 1,
      requestId: created.request.id,
    });
    const listed = await inbox.listFanConversations({ userId: 2 });
    assert.strictEqual(listed.ok, true);
    assert.strictEqual(listed.conversations.length, 1);
    assert.strictEqual(listed.conversations[0].id, accepted.conversationId);
    assert.strictEqual(listed.conversations[0].artist.name, 'BurningThunder');
    assert.strictEqual(listed.conversations[0].artist.avatarUrl, '/bt.png');

    const detail = await inbox.getConversation({
      userId: 2,
      conversationId: accepted.conversationId,
    });
    assert.strictEqual(detail.ok, true, detail.message);
    assert.strictEqual(detail.conversation.artist.name, 'BurningThunder');
    assert.strictEqual(detail.conversation.artist.avatarUrl, '/bt.png');
    assert.strictEqual(detail.conversation.messages.length, 1);
    assert.strictEqual(detail.conversation.messages[0].bodyText, 'Hey, loved the show');

    const other = await inbox.getConversation({
      userId: 5,
      conversationId: accepted.conversationId,
    });
    assert.strictEqual(other.ok, false);
    assert.strictEqual(other.status, 403);

    const artist = await inbox.getConversation({
      userId: 1,
      conversationId: accepted.conversationId,
    });
    assert.strictEqual(artist.ok, true, artist.message);
    assert.strictEqual(artist.conversation.messages[0].bodyText, 'Hey, loved the show');
  });

  await test('null fan participant accountUser is healed from fanAccountUser', async () => {
    const { inbox, store } = setupWorld();
    const created = await inbox.createFanMessageRequest({
      userId: 2,
      bandId: 10,
      bodyText: 'Heal me',
    });
    const accepted = await inbox.acceptMessageRequest({
      userId: 1,
      requestId: created.request.id,
    });
    const parts = await store.listParticipants(accepted.conversationId);
    const fanPart = parts.find((p) => p.side === 'fan');
    await store.updateParticipant(fanPart.id, { accountUser: null });
    const listed = await inbox.listFanConversations({ userId: 2 });
    assert.strictEqual(listed.conversations.some((c) => c.id === accepted.conversationId), true);
    const detail = await inbox.getConversation({
      userId: 2,
      conversationId: accepted.conversationId,
    });
    assert.strictEqual(detail.ok, true, detail.message);
    const healed = (await store.listParticipants(accepted.conversationId)).find((p) => p.side === 'fan');
    assert.strictEqual(Number(healed.accountUser), 2);
  });

  await test('missing fan participant is created from fanAccountUser', async () => {
    const { inbox, store } = setupWorld();
    const created = await inbox.createFanMessageRequest({
      userId: 2,
      bandId: 10,
      bodyText: 'Create me',
    });
    const accepted = await inbox.acceptMessageRequest({
      userId: 1,
      requestId: created.request.id,
    });
    const parts = await store.listParticipants(accepted.conversationId);
    for (const part of parts.filter((p) => p.side === 'fan')) {
      store.participants.delete(part.id);
    }
    const detail = await inbox.getConversation({
      userId: 2,
      conversationId: accepted.conversationId,
    });
    assert.strictEqual(detail.ok, true, detail.message);
    const createdPart = (await store.listParticipants(accepted.conversationId)).find((p) => p.side === 'fan');
    assert.strictEqual(Number(createdPart.accountUser), 2);
  });

  await test('conflicting fan participant fails closed for both fans; artist still allowed', async () => {
    const { inbox, store } = setupWorld();
    const created = await inbox.createFanMessageRequest({
      userId: 2,
      bandId: 10,
      bodyText: 'Conflict',
    });
    const accepted = await inbox.acceptMessageRequest({
      userId: 1,
      requestId: created.request.id,
    });
    const parts = await store.listParticipants(accepted.conversationId);
    const fanPart = parts.find((p) => p.side === 'fan');
    await store.updateParticipant(fanPart.id, { accountUser: 5 });

    const owner = await inbox.getConversation({
      userId: 2,
      conversationId: accepted.conversationId,
    });
    assert.strictEqual(owner.ok, false);
    assert.strictEqual(owner.status, 403);

    const other = await inbox.getConversation({
      userId: 5,
      conversationId: accepted.conversationId,
    });
    assert.strictEqual(other.ok, false);
    assert.strictEqual(other.status, 403);
    const still = (await store.listParticipants(accepted.conversationId)).find((p) => p.side === 'fan');
    assert.strictEqual(Number(still.accountUser), 5);

    const listedOwner = await inbox.listFanConversations({ userId: 2 });
    assert.strictEqual(listedOwner.conversations.some((c) => c.id === accepted.conversationId), false);
    const listedOther = await inbox.listFanConversations({ userId: 5 });
    assert.strictEqual(listedOther.conversations.some((c) => c.id === accepted.conversationId), false);

    const artist = await inbox.getConversation({
      userId: 1,
      conversationId: accepted.conversationId,
    });
    assert.strictEqual(artist.ok, true, artist.message);
    assert.ok(!containsKey(artist, 'sarah@example.com'));
  });

  await test('status returns conversation after accept; new request opens existing', async () => {
    const { inbox } = setupWorld();
    const created = await inbox.createFanMessageRequest({
      userId: 2,
      bandId: 10,
      bodyText: 'Hey, loved the show',
    });
    const accepted = await inbox.acceptMessageRequest({
      userId: 1,
      requestId: created.request.id,
    });
    const status = await inbox.getFanMessageStatus({ userId: 2, bandId: 10 });
    assert.strictEqual(status.ok, true);
    assert.strictEqual(status.state, 'conversation');
    assert.strictEqual(status.conversationId, accepted.conversationId);
    const again = await inbox.createFanMessageRequest({
      userId: 2,
      bandId: 10,
      bodyText: 'Should not create another request',
    });
    assert.strictEqual(again.ok, true, again.message);
    assert.strictEqual(again.existingConversation, true);
    assert.strictEqual(again.conversationId, accepted.conversationId);
  });

  await test('accept reuses canonical pair if artist already started', async () => {
    const { inbox, store } = setupWorld();
    const started = await inbox.getOrCreateConversationForFan({ userId: 1, bandId: 10, fanId: 100 });
    store.conversations.get(started.conversationId); // keep pair
    // Force a pending request against the same pair by clearing the conversation lookup path:
    // If conversation exists, create returns existing. This asserts accept reuse after a request
    // that was created first, then a raced conversation.
    const { inbox: inbox2, store: store2 } = setupWorld();
    const req = await inbox2.createFanMessageRequest({
      userId: 2,
      bandId: 10,
      bodyText: 'Reuse me',
    });
    const started2 = await inbox2.getOrCreateConversationForFan({ userId: 1, bandId: 10, fanId: 100 });
    const accepted = await inbox2.acceptMessageRequest({ userId: 1, requestId: req.request.id });
    assert.strictEqual(accepted.ok, true, accepted.message);
    assert.strictEqual(accepted.conversationId, started2.conversationId);
    const msgs = await store2.listMessages(accepted.conversationId);
    assert.strictEqual(msgs.filter((m) => m.bodyText === 'Reuse me').length, 1);
  });

  console.log(`\n=== conversation requests: ${passed} passed, ${failed} failed ===\n`);
  if (failed) process.exit(1);
})();
