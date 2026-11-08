/**
 * Faneqo Inbox / Direct Messages — Phase 2 service tests.
 * Run: node scripts/test-direct-messaging.js
 *
 * Uses an in-memory store (no running Strapi). HTTP/E2E smoke is reported separately.
 */

const assert = require('assert');
const path = require('path');

const pure = require(path.join(__dirname, '../src/utils/inbox/inboxPure'));
const { jwtFailureReason } = require(path.join(__dirname, '../src/utils/inbox/inboxLog'));
const { resetInboxRateLimitForTests } = require(path.join(__dirname, '../src/utils/inbox/inboxRateLimit'));
const {
  createMemoryInboxStore,
  createInboxService,
  createStrapiInboxStore,
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
  const blob = JSON.stringify(obj);
  return blob.toLowerCase().includes(String(needle).toLowerCase());
}

function setupWorld(opts = {}) {
  resetInboxRateLimitForTests();
  const store = createMemoryInboxStore();
  store.seedUser({ id: 1, email: 'owner-a@example.com' });
  store.seedUser({ id: 2, email: 'sarah@example.com' });
  store.seedUser({ id: 3, email: 'owner-b@example.com' });
  store.seedUser({ id: 4, email: 'manager-a@example.com' });
  store.seedUser({ id: 5, email: 'other-fan@example.com' });
  store.seedUser({ id: 6, email: 'nick-dual@example.com' });

  store.seedBand({ id: 10, name: 'BurningThunder', slug: 'burningthunder', avatarUrl: '/bt.png' });
  store.seedBand({ id: 20, name: 'Badflower', slug: 'badflower', avatarUrl: '/bf.png' });

  store.seedMember(10, 1, 'owner');
  store.seedMember(10, 4, 'manager');
  store.seedMember(20, 3, 'owner');
  store.seedMember(10, 6, 'owner'); // Nick owns BurningThunder
  store.seedMember(20, 6, null);

  store.seedFan({
    id: 100,
    band: 10,
    accountUser: 2,
    firstName: 'Sarah',
    email: 'sarah@example.com',
    city: 'Nashville',
    checkedInShowCount: 99,
    status: 'subscribed',
    suppressionReason: null,
  });
  store.seedAttendance({
    fan: 100,
    checkedInAt: '2026-08-01T02:00:00.000Z',
    campaignId: 'nashville',
  });
  store.seedAttendance({
    fan: 100,
    checkedInAt: '2026-08-10T02:00:00.000Z',
    campaignId: 'knoxville',
  });
  store.seedFan({
    id: 101,
    band: 20,
    accountUser: 2,
    firstName: 'Sarah',
    email: 'sarah@example.com',
    city: 'Los Angeles',
    checkedInShowCount: 1,
    status: 'subscribed',
  });
  store.seedAttendance({
    fan: 101,
    checkedInAt: '2026-07-01T02:00:00.000Z',
    campaignId: 'la',
  });
  store.seedFan({
    id: 102,
    band: 10,
    accountUser: null,
    firstName: 'Anon',
    email: 'anon@example.com',
    status: 'subscribed',
  });
  store.seedFan({
    id: 103,
    band: 10,
    accountUser: 5,
    firstName: 'Removed',
    email: 'removed@example.com',
    status: 'removed',
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
    id: 105,
    band: 10,
    accountUser: 5,
    firstName: 'Bounce',
    email: 'bounce@example.com',
    status: 'subscribed',
    suppressionReason: 'bounced',
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
    id: 107,
    band: 10,
    accountUser: 1,
    firstName: 'OwnerSelf',
    email: 'owner-a@example.com',
    status: 'subscribed',
  });

  const inbox = createInboxService(store, {
    logger: { warn() {}, error() {}, info() {} },
    env: opts.env || {
      NODE_ENV: 'test',
      FANEQO_DM_PUBLIC_MEDIA_FALLBACK: '1',
    },
  });
  return { store, inbox };
}

async function startOk(inbox, userId, bandId, fanId) {
  const r = await inbox.getOrCreateConversationForFan({ userId, bandId, fanId });
  assert.strictEqual(r.ok, true, r.message);
  return r;
}

(async () => {
  console.log('\n=== Inbox pure helpers ===\n');

  await test('pairKey is band + account', () => {
    assert.strictEqual(pure.pairKey(10, 2), '10:2');
  });

  await test('display name never uses email', () => {
    assert.strictEqual(pure.safeFanDisplayName({ firstName: 'Sarah', email: 'sarah@x.com' }), 'Sarah');
    assert.strictEqual(pure.safeFanDisplayName({ firstName: 'sarah@x.com' }), 'Unnamed fan');
    assert.strictEqual(pure.safeFanDisplayName({}), 'Unnamed fan');
    assert.strictEqual(pure.safeFanDisplayName({ city: 'Nashville' }), 'Nashville fan');
    assert.strictEqual(pure.safeFanDisplayName({ city: 'Chicago' }), 'Chicago fan');
    assert.strictEqual(pure.safeFanDisplayName({ displayName: 'Fan', city: 'Nashville' }), 'Nashville fan');
    assert.strictEqual(
      pure.safeFanDisplayName({ firstName: 'Elizabeth', lastName: 'Rodriguez' }),
      'Elizabeth R.'
    );
    assert.strictEqual(pure.fanInitials({ firstName: 'Elizabeth', lastName: 'Rodriguez' }), 'ER');
    assert.strictEqual(pure.fanInitials({ firstName: 'Sarah' }), 'S');
    assert.strictEqual(pure.fanInitials({ city: 'Nashville' }), 'F');
    assert.strictEqual(pure.fanInitials('Unnamed fan'), 'F');
    assert.strictEqual(pure.hasRequiredFanFirstName({ firstName: 'Elizabeth' }), true);
    assert.strictEqual(pure.hasRequiredFanFirstName({ firstName: '  ' }), false);
  });

  await test('context line is band-scoped and concise', () => {
    assert.strictEqual(
      pure.buildFanContextLine({ city: 'Nashville', checkedInShowCount: 2, tier: 'superfan_signal' }),
      'Nashville · Superfan · 2 shows'
    );
    assert.strictEqual(pure.buildFanContextLine({ city: 'Chicago', tier: 'engaged' }), 'Chicago');
    assert.strictEqual(
      pure.buildFanContextLine({ city: 'Chicago', displayName: 'Chicago fan' }),
      'Fan List'
    );
    assert.strictEqual(pure.buildFanContextLine({}), 'Fan List');
  });

  await test('DM eligibility is a safe boolean, not accountUser id', () => {
    assert.deepStrictEqual(pure.fanMessagingEligibility({ accountUser: 9, status: 'subscribed' }), {
      isFaneqoMember: true,
      canDirectMessage: true,
    });
    assert.deepStrictEqual(pure.fanMessagingEligibility({ accountUser: 9, status: 'unsubscribed' }), {
      isFaneqoMember: true,
      canDirectMessage: true,
    });
    assert.deepStrictEqual(pure.fanMessagingEligibility({ accountUser: 9, status: 'removed' }), {
      isFaneqoMember: true,
      canDirectMessage: false,
    });
    assert.deepStrictEqual(pure.fanMessagingEligibility({ status: 'subscribed' }), {
      isFaneqoMember: false,
      canDirectMessage: false,
    });
  });

  await test('validateBodyText rejects empty / whitespace / too long', () => {
    assert.strictEqual(pure.validateBodyText('').error, 'empty_message');
    assert.strictEqual(pure.validateBodyText('   ').error, 'empty_message');
    assert.strictEqual(pure.validateBodyText(' hi ').bodyText, 'hi');
    assert.strictEqual(pure.validateBodyText('x'.repeat(4001)).error, 'message_too_long');
  });

  await test('preview truncates without storing full body', () => {
    const p = pure.truncatePreview('a'.repeat(400));
    assert.ok(p.length <= 140);
  });

  await test('unread counts only opposite-side messages after read cursor', () => {
    const messages = [
      { id: 1, senderSide: 'band' },
      { id: 2, senderSide: 'fan' },
      { id: 3, senderSide: 'fan' },
    ];
    assert.strictEqual(pure.countUnreadForParticipant(messages, { side: 'band', lastReadMessageId: null }), 2);
    assert.strictEqual(pure.countUnreadForParticipant(messages, { side: 'band', lastReadMessageId: 3 }), 0);
    assert.strictEqual(pure.countUnreadForParticipant(messages, { side: 'fan', lastReadMessageId: null }), 1);
  });

  await test('mark-read never moves backwards', () => {
    const next = pure.nextReadPosition(
      { lastReadMessageId: 9, lastReadAt: '2026-01-02T00:00:00.000Z' },
      { id: 4, createdAt: '2026-01-03T00:00:00.000Z' }
    );
    assert.strictEqual(next.moved, false);
    assert.strictEqual(next.lastReadMessageId, 9);
  });

  await test('filterMessagesWindow afterId only returns newer', () => {
    const messages = [
      { id: 1, createdAt: '2026-01-01T00:00:00.000Z' },
      { id: 2, createdAt: '2026-01-01T00:01:00.000Z' },
      { id: 3, createdAt: '2026-01-01T00:02:00.000Z' },
    ];
    const newer = pure.filterMessagesWindow(messages, { afterId: 1, limit: 40 });
    assert.deepStrictEqual(newer.map((m) => m.id), [2, 3]);
    const older = pure.filterMessagesWindow(messages, { beforeId: 3, limit: 1 });
    assert.deepStrictEqual(older.map((m) => m.id), [2]);
  });

  await test('unsubscribed does not block; removed does', () => {
    assert.strictEqual(
      pure.sendBlockReason({
        conversation: { status: 'active' },
        originFan: { status: 'unsubscribed' },
        fanParticipant: {},
      }),
      null
    );
    assert.strictEqual(
      pure.sendBlockReason({
        conversation: { status: 'active' },
        originFan: { status: 'removed' },
        fanParticipant: {},
      }),
      'relationship_removed'
    );
  });

  console.log('\n=== Conversation creation ===\n');

  await test('owner starts conversation with eligible claimed fan', async () => {
    const { inbox, store } = setupWorld();
    const r = await startOk(inbox, 1, 10, 100);
    assert.strictEqual(r.created, true);
    assert.ok(r.conversationId);
    const parts = await store.listParticipants(r.conversationId);
    assert.strictEqual(parts.length, 2);
    assert.ok(parts.find((p) => p.side === 'band'));
    assert.ok(parts.find((p) => p.side === 'fan' && Number(p.accountUser) === 2));
  });

  await test('second start returns the same conversation', async () => {
    const { inbox } = setupWorld();
    const a = await startOk(inbox, 1, 10, 100);
    const b = await startOk(inbox, 1, 10, 100);
    assert.strictEqual(a.conversationId, b.conversationId);
    assert.strictEqual(b.created, false);
    assert.strictEqual(a.conversation.fan.showCount, 2);
    assert.ok(String(a.conversation.fan.context).includes('2 shows'));
  });

  await test('near-simultaneous starts do not duplicate', async () => {
    const { inbox, store } = setupWorld();
    const [a, b] = await Promise.all([
      inbox.getOrCreateConversationForFan({ userId: 1, bandId: 10, fanId: 100 }),
      inbox.getOrCreateConversationForFan({ userId: 1, bandId: 10, fanId: 100 }),
    ]);
    assert.strictEqual(a.ok, true);
    assert.strictEqual(b.ok, true);
    assert.strictEqual(a.conversationId, b.conversationId);
    assert.strictEqual(store.conversations.size, 1);
  });

  await test('another band\'s fan is rejected', async () => {
    const { inbox } = setupWorld();
    const r = await inbox.getOrCreateConversationForFan({ userId: 1, bandId: 10, fanId: 101 });
    assert.strictEqual(r.ok, false);
    assert.strictEqual(r.status, 409);
  });

  await test('fan without accountUser is rejected', async () => {
    const { inbox } = setupWorld();
    const r = await inbox.getOrCreateConversationForFan({ userId: 1, bandId: 10, fanId: 102 });
    assert.strictEqual(r.ok, false);
    assert.strictEqual(r.status, 409);
  });

  await test('dm-candidates omit email and accountUser; members are selectable', async () => {
    const { inbox } = setupWorld();
    const r = await inbox.listDmCandidates({ userId: 1, bandId: 10, search: '' });
    assert.strictEqual(r.ok, true, r.message);
    const blob = JSON.stringify(r);
    assert.ok(!blob.includes('@example.com'), 'must not leak emails');
    assert.ok(!blob.toLowerCase().includes('accountuser'));
    const sarah = (r.fans || []).find((f) => f.displayName === 'Sarah');
    const anon = (r.fans || []).find((f) => f.displayName === 'Anon');
    assert.ok(sarah);
    assert.strictEqual(sarah.showCount, 2, 'Inbox must use canonical attendance, not checkedInShowCount cache');
    assert.ok(String(sarah.context).includes('2 shows'));
    assert.strictEqual(sarah.canDirectMessage, true);
    assert.strictEqual(sarah.isFaneqoMember, true);
    assert.ok(anon);
    assert.strictEqual(anon.canDirectMessage, false);
    assert.strictEqual(anon.isFaneqoMember, false);
  });

  await test('artist cannot DM their own fan profile', async () => {
    const { inbox } = setupWorld();
    const r = await inbox.listDmCandidates({ userId: 1, bandId: 10, search: '' });
    const self = (r.fans || []).find((f) => f.displayName === 'OwnerSelf');
    assert.ok(self);
    assert.strictEqual(self.isFaneqoMember, true);
    assert.strictEqual(self.canDirectMessage, false);
    const start = await inbox.getOrCreateConversationForFan({ userId: 1, bandId: 10, fanId: 107 });
    assert.strictEqual(start.ok, false);
    assert.strictEqual(start.status, 409);
  });

  await test('removed fan cannot start', async () => {
    const { inbox } = setupWorld();
    const r = await inbox.getOrCreateConversationForFan({ userId: 1, bandId: 10, fanId: 103 });
    assert.strictEqual(r.ok, false);
  });

  await test('unsubscribed fan can start (email ≠ inbox)', async () => {
    const { inbox } = setupWorld();
    const r = await startOk(inbox, 1, 10, 104);
    assert.strictEqual(r.ok, true);
  });

  await test('bounced-email fan can start (email channel only)', async () => {
    const { inbox } = setupWorld();
    const r = await startOk(inbox, 1, 10, 105);
    assert.strictEqual(r.ok, true);
  });

  await test('manager/viewer cannot start under V1 owner policy', async () => {
    const { inbox } = setupWorld();
    const r = await inbox.getOrCreateConversationForFan({ userId: 4, bandId: 10, fanId: 100 });
    assert.strictEqual(r.ok, false);
    assert.strictEqual(r.status, 403);
  });

  console.log('\n=== Authorization ===\n');

  await test('correct owner can open; other owner cannot; guessing id grants nothing', async () => {
    const { inbox } = setupWorld();
    const started = await startOk(inbox, 1, 10, 100);
    const owner = await inbox.getConversation({ userId: 1, conversationId: started.conversationId });
    assert.strictEqual(owner.ok, true);
    const otherOwner = await inbox.getConversation({ userId: 3, conversationId: started.conversationId });
    assert.strictEqual(otherOwner.ok, false);
    assert.strictEqual(otherOwner.status, 403);
    const fan = await inbox.getConversation({ userId: 2, conversationId: started.conversationId });
    assert.strictEqual(fan.ok, true);
    assert.strictEqual(fan.conversation.showCount, 2);
    const otherFan = await inbox.getConversation({ userId: 5, conversationId: started.conversationId });
    assert.strictEqual(otherFan.ok, false);
    const random = await inbox.getConversation({ userId: 99, conversationId: started.conversationId });
    assert.strictEqual(random.ok, false);
    const anon = await inbox.getConversation({ userId: null, conversationId: started.conversationId });
    assert.strictEqual(anon.status, 401);
    const guess = await inbox.getConversation({ userId: 1, conversationId: 9999 });
    assert.strictEqual(guess.ok, false);
    assert.strictEqual(guess.status, 403);
  });

  await test('dual-role user: artist of A, fan of B', async () => {
    const { inbox } = setupWorld();
    const asArtist = await startOk(inbox, 6, 10, 100);
    const asFanStart = await startOk(inbox, 3, 20, 106);
    const artistView = await inbox.getConversation({ userId: 6, conversationId: asArtist.conversationId });
    assert.strictEqual(artistView.ok, true);
    assert.strictEqual(artistView.conversation.viewer, 'artist');
    const fanView = await inbox.getConversation({ userId: 6, conversationId: asFanStart.conversationId });
    assert.strictEqual(fanView.ok, true);
    assert.strictEqual(fanView.conversation.viewer, 'fan');
    assert.strictEqual(fanView.conversation.artist.slug, 'badflower');
  });

  await test('cross-band isolation: BurningThunder cannot see Sarah ↔ Badflower', async () => {
    const { inbox } = setupWorld();
    const bt = await startOk(inbox, 1, 10, 100);
    const bf = await startOk(inbox, 3, 20, 101);
    assert.notStrictEqual(bt.conversationId, bf.conversationId);
    const leak = await inbox.getConversation({ userId: 1, conversationId: bf.conversationId });
    assert.strictEqual(leak.ok, false);
    const list = await inbox.listArtistConversations({ userId: 1, bandId: 10 });
    assert.strictEqual(list.conversations.length, 1);
    assert.strictEqual(list.conversations[0].id, bt.conversationId);
    assert.ok(!containsKey(list, 'Los Angeles'));
  });

  console.log('\n=== Messages ===\n');

  await test('band sends, fan replies, empty/long rejected, spoofed sender ignored', async () => {
    const { inbox } = setupWorld();
    const started = await startOk(inbox, 1, 10, 100);
    const id = started.conversationId;
    const sent = await inbox.sendMessage({
      userId: 1,
      conversationId: id,
      bodyText: 'Thanks for coming to the show!',
      senderSide: 'fan',
      senderUser: 2,
      bandId: 20,
    });
    assert.strictEqual(sent.ok, true);
    assert.strictEqual(sent.message.senderSide, 'band');
    assert.strictEqual(sent.message.isMine, true);
    assert.strictEqual(sent.message.bodyText, 'Thanks for coming to the show!');

    const reply = await inbox.sendMessage({
      userId: 2,
      conversationId: id,
      bodyText: "Can't wait for the next one.",
    });
    assert.strictEqual(reply.ok, true);
    assert.strictEqual(reply.message.senderSide, 'fan');

    const empty = await inbox.sendMessage({ userId: 1, conversationId: id, bodyText: '   ' });
    assert.strictEqual(empty.error, 'empty_message');
    const long = await inbox.sendMessage({ userId: 1, conversationId: id, bodyText: 'x'.repeat(4001) });
    assert.strictEqual(long.error, 'message_too_long');
  });

  await test('unauthorized artist and other fan cannot send', async () => {
    const { inbox } = setupWorld();
    const started = await startOk(inbox, 1, 10, 100);
    const otherOwner = await inbox.sendMessage({
      userId: 3,
      conversationId: started.conversationId,
      bodyText: 'nope',
    });
    assert.strictEqual(otherOwner.ok, false);
    const otherFan = await inbox.sendMessage({
      userId: 5,
      conversationId: started.conversationId,
      bodyText: 'nope',
    });
    assert.strictEqual(otherFan.ok, false);
  });

  await test('removed relationship blocks both sides but history remains', async () => {
    const { inbox, store } = setupWorld();
    const started = await startOk(inbox, 1, 10, 100);
    await inbox.sendMessage({ userId: 1, conversationId: started.conversationId, bodyText: 'hello' });
    store.fans.get(100).status = 'removed';
    const bandSend = await inbox.sendMessage({ userId: 1, conversationId: started.conversationId, bodyText: 'again' });
    const fanSend = await inbox.sendMessage({ userId: 2, conversationId: started.conversationId, bodyText: 'again' });
    assert.strictEqual(bandSend.ok, false);
    assert.strictEqual(fanSend.ok, false);
    const history = await inbox.listMessages({ userId: 1, conversationId: started.conversationId });
    assert.strictEqual(history.ok, true);
    assert.strictEqual(history.messages.length, 1);
  });

  console.log('\n=== Idempotency ===\n');

  await test('same clientMessageId returns the same stored message', async () => {
    const { inbox, store } = setupWorld();
    const started = await startOk(inbox, 1, 10, 100);
    const a = await inbox.sendMessage({
      userId: 1,
      conversationId: started.conversationId,
      bodyText: 'one',
      clientMessageId: 'cid-1',
    });
    const b = await inbox.sendMessage({
      userId: 1,
      conversationId: started.conversationId,
      bodyText: 'one',
      clientMessageId: 'cid-1',
    });
    assert.strictEqual(a.message.id, b.message.id);
    assert.strictEqual(b.duplicate, true);
    const c = await inbox.sendMessage({
      userId: 1,
      conversationId: started.conversationId,
      bodyText: 'two',
      clientMessageId: 'cid-2',
    });
    assert.notStrictEqual(c.message.id, a.message.id);
    const all = await store.listMessages(started.conversationId);
    assert.strictEqual(all.length, 2);
  });

  console.log('\n=== Read / unread / seen ===\n');

  await test('read cursors are per-participant and persist unread math', async () => {
    const { inbox } = setupWorld();
    const started = await startOk(inbox, 1, 10, 100);
    const id = started.conversationId;
    const bandMsg = await inbox.sendMessage({ userId: 1, conversationId: id, bodyText: 'from band' });
    const fanUnread1 = await inbox.unreadCountFan({ userId: 2 });
    assert.strictEqual(fanUnread1.unreadCount, 1);
    const beforeRead = await inbox.listMessages({ userId: 1, conversationId: id });
    assert.strictEqual(beforeRead.messages[0].seenByRecipient, false);

    await inbox.markRead({ userId: 2, conversationId: id, throughMessageId: bandMsg.message.id });
    const fanUnread0 = await inbox.unreadCountFan({ userId: 2 });
    assert.strictEqual(fanUnread0.unreadCount, 0);
    const afterRead = await inbox.listMessages({ userId: 1, conversationId: id });
    assert.strictEqual(afterRead.messages[0].seenByRecipient, true);

    await inbox.sendMessage({ userId: 2, conversationId: id, bodyText: 'fan 1' });
    await inbox.sendMessage({ userId: 2, conversationId: id, bodyText: 'fan 2' });
    const artistUnread = await inbox.unreadCountArtist({ userId: 1, bandId: 10 });
    assert.strictEqual(artistUnread.unreadCount, 2);

    const msgs = await inbox.listMessages({ userId: 1, conversationId: id });
    const lastFan = msgs.messages.filter((m) => m.senderSide === 'fan').pop();
    await inbox.markRead({ userId: 1, conversationId: id, throughMessageId: lastFan.id });
    const artistUnread0 = await inbox.unreadCountArtist({ userId: 1, bandId: 10 });
    assert.strictEqual(artistUnread0.unreadCount, 0);

    const fanPartBefore = (await inbox.getConversation({ userId: 2, conversationId: id })).ok;
    assert.ok(fanPartBefore);
    // Fan cannot advance the band's cursor by marking an old band message after already read
    const sneak = await inbox.markRead({ userId: 2, conversationId: id, throughMessageId: lastFan.id });
    assert.strictEqual(sneak.ok, true);
    const still = await inbox.unreadCountArtist({ userId: 1, bandId: 10 });
    assert.strictEqual(still.unreadCount, 0);
  });

  console.log('\n=== Block ===\n');

  await test('fan block freezes sending; history remains; unblock restores unless removed', async () => {
    const { inbox, store } = setupWorld();
    const started = await startOk(inbox, 1, 10, 100);
    const id = started.conversationId;
    await inbox.sendMessage({ userId: 1, conversationId: id, bodyText: 'hello' });
    const blocked = await inbox.setBlocked({ userId: 2, conversationId: id, blocked: true });
    assert.strictEqual(blocked.blocked, true);
    assert.strictEqual(blocked.messagingAvailable, false);
    const artistBlock = await inbox.setBlocked({ userId: 1, conversationId: id, blocked: true });
    assert.strictEqual(artistBlock.status, 403);
    const bandSend = await inbox.sendMessage({ userId: 1, conversationId: id, bodyText: 'no' });
    const fanSend = await inbox.sendMessage({ userId: 2, conversationId: id, bodyText: 'no' });
    assert.strictEqual(bandSend.ok, false);
    assert.strictEqual(fanSend.ok, false);
    const hist = await inbox.listMessages({ userId: 2, conversationId: id });
    assert.strictEqual(hist.messages.length, 1);

    const unblocked = await inbox.setBlocked({ userId: 2, conversationId: id, blocked: false });
    assert.strictEqual(unblocked.blocked, false);
    const again = await inbox.sendMessage({ userId: 1, conversationId: id, bodyText: 'back' });
    assert.strictEqual(again.ok, true);

    store.fans.get(100).status = 'removed';
    await inbox.setBlocked({ userId: 2, conversationId: id, blocked: false });
    const afterRemove = await inbox.sendMessage({ userId: 1, conversationId: id, bodyText: 'still no' });
    assert.strictEqual(afterRemove.ok, false);
  });

  console.log('\n=== Privacy + pagination ===\n');

  await test('serializers do not expose PII or raw relations', async () => {
    const { inbox } = setupWorld();
    const started = await startOk(inbox, 1, 10, 100);
    await inbox.sendMessage({ userId: 1, conversationId: started.conversationId, bodyText: 'hi' });
    const list = await inbox.listArtistConversations({ userId: 1, bandId: 10 });
    const fanList = await inbox.listFanConversations({ userId: 2 });
    const detail = await inbox.getConversation({ userId: 1, conversationId: started.conversationId });
    const msgs = await inbox.listMessages({ userId: 2, conversationId: started.conversationId });
    for (const payload of [list, fanList, detail, msgs, started]) {
      assert.ok(!containsKey(payload, 'sarah@example.com'), 'leaked fan email');
      assert.ok(!containsKey(payload, 'owner-a@example.com'), 'leaked owner email');
      assert.ok(!containsKey(payload, 'accountUser'), 'leaked accountUser');
      assert.ok(!containsKey(payload, 'pairKey'), 'leaked pairKey');
      assert.ok(!containsKey(payload, 'senderParticipant'), 'leaked participant');
      assert.ok(!containsKey(payload, 'password'), 'leaked password');
    }
    assert.ok(!containsKey(fanList, 'engagement'));
    assert.ok(!containsKey(list.conversations[0], 'Los Angeles'));
    assert.strictEqual(list.conversations[0].fan.displayName, 'Sarah');
    assert.strictEqual(fanList.conversations[0].artist.name, 'BurningThunder');
  });

  await test('conversation list is newest-activity first; messages page without duplicates', async () => {
    const { inbox } = setupWorld();
    const a = await startOk(inbox, 1, 10, 100);
    const b = await startOk(inbox, 1, 10, 104);
    await inbox.sendMessage({ userId: 1, conversationId: a.conversationId, bodyText: 'older thread' });
    await inbox.sendMessage({ userId: 1, conversationId: b.conversationId, bodyText: 'newer thread' });
    const list = await inbox.listArtistConversations({ userId: 1, bandId: 10, page: 1, pageSize: 20 });
    assert.strictEqual(list.conversations[0].id, b.conversationId);
    const page1 = await inbox.listArtistConversations({ userId: 1, bandId: 10, page: 1, pageSize: 1 });
    const page2 = await inbox.listArtistConversations({ userId: 1, bandId: 10, page: 2, pageSize: 1 });
    assert.notStrictEqual(page1.conversations[0].id, page2.conversations[0].id);

    const cid = a.conversationId;
    for (let i = 0; i < 5; i += 1) {
      await inbox.sendMessage({ userId: 1, conversationId: cid, bodyText: `m${i}` });
    }
    const latest = await inbox.listMessages({ userId: 1, conversationId: cid, limit: 2 });
    assert.strictEqual(latest.messages.length, 2);
    const older = await inbox.listMessages({
      userId: 1,
      conversationId: cid,
      beforeId: latest.messages[0].id,
      limit: 2,
    });
    const ids = new Set([...latest.messages, ...older.messages].map((m) => m.id));
    assert.strictEqual(ids.size, latest.messages.length + older.messages.length);
    const polled = await inbox.listMessages({
      userId: 1,
      conversationId: cid,
      afterId: older.messages[older.messages.length - 1].id,
    });
    assert.ok(polled.messages.every((m) => m.id > older.messages[older.messages.length - 1].id));
  });

  await test('fan list shows artist identity not owner account', async () => {
    const { inbox } = setupWorld();
    await startOk(inbox, 1, 10, 100);
    const list = await inbox.listFanConversations({ userId: 2 });
    assert.strictEqual(list.conversations[0].artist.slug, 'burningthunder');
    assert.strictEqual(list.conversations[0].artist.avatarUrl, '/bt.png');
  });

  await test('send rate limit trips on conversation burst', async () => {
    const { inbox } = setupWorld();
    const started = await startOk(inbox, 1, 10, 100);
    let limited = false;
    for (let i = 0; i < 12; i += 1) {
      const r = await inbox.sendMessage({
        userId: 1,
        conversationId: started.conversationId,
        bodyText: `burst ${i}`,
      });
      if (r.error === 'rate_limited') {
        limited = true;
        assert.strictEqual(r.status, 429);
        break;
      }
    }
    assert.ok(limited, 'expected conversation burst limit');
  });

  await test('conversation burst does not block a different conversation under the global cap', async () => {
    const { inbox } = setupWorld();
    const a = await startOk(inbox, 1, 10, 100);
    const b = await startOk(inbox, 1, 10, 104);
    for (let i = 0; i < 10; i += 1) {
      const r = await inbox.sendMessage({
        userId: 1,
        conversationId: a.conversationId,
        bodyText: `a ${i}`,
      });
      assert.strictEqual(r.ok, true, r.message);
    }
    const other = await inbox.sendMessage({
      userId: 1,
      conversationId: b.conversationId,
      bodyText: 'other thread',
    });
    assert.strictEqual(other.ok, true, other.message);
  });

  await test('durable campaign sends reuse one private conversation and remain idempotent', async () => {
    const { inbox, store } = setupWorld();
    let firstMessageId = null;

    for (let campaignId = 1; campaignId <= 35; campaignId += 1) {
      const sent = await inbox.sendCampaignMessage({
        authorizedArtistUserId: 1,
        bandId: 10,
        fanId: 100,
        campaignId,
        bodyText: `campaign ${campaignId}`,
      });
      assert.strictEqual(sent.ok, true, sent.message);
      if (campaignId === 1) firstMessageId = sent.message.id;
    }

    const duplicate = await inbox.sendCampaignMessage({
      authorizedArtistUserId: 1,
      bandId: 10,
      fanId: 100,
      campaignId: 1,
      bodyText: 'campaign 1',
    });
    assert.strictEqual(duplicate.ok, true, duplicate.message);
    assert.strictEqual(duplicate.duplicate, true);
    assert.strictEqual(duplicate.message.id, firstMessageId);

    const conversation = await inbox.getOrCreateConversationForFan({
      userId: 1,
      bandId: 10,
      fanId: 100,
    });
    const rows = await store.listMessages(conversation.conversationId);
    assert.strictEqual(rows.length, 35);
    assert.ok(rows.every((row) => Number(row.conversation) === Number(conversation.conversationId)));
    const participants = await store.listParticipants(conversation.conversationId);
    assert.strictEqual(participants.length, 2, 'campaign delivery must never create a group chat');
    assert.deepStrictEqual(participants.map((row) => row.side).sort(), ['band', 'fan']);

    const interactive = await inbox.sendMessage({
      userId: 1,
      conversationId: conversation.conversationId,
      bodyText: 'interactive still has its own budget',
    });
    assert.strictEqual(interactive.ok, true, interactive.message);
  });

  await test('unsubscribed and bounced fans can still send DMs', async () => {
    const { inbox } = setupWorld();
    const unsub = await startOk(inbox, 1, 10, 104);
    const bounce = await startOk(inbox, 1, 10, 105);
    const a = await inbox.sendMessage({
      userId: 1,
      conversationId: unsub.conversationId,
      bodyText: 'still dm',
    });
    const b = await inbox.sendMessage({
      userId: 1,
      conversationId: bounce.conversationId,
      bodyText: 'still dm bounce',
    });
    assert.strictEqual(a.ok, true, a.message);
    assert.strictEqual(b.ok, true, b.message);
  });

  await test('concurrent identical clientMessageId does not duplicate', async () => {
    const { inbox, store } = setupWorld();
    const started = await startOk(inbox, 1, 10, 100);
    const [a, b] = await Promise.all([
      inbox.sendMessage({
        userId: 1,
        conversationId: started.conversationId,
        bodyText: 'same',
        clientMessageId: 'race-1',
      }),
      inbox.sendMessage({
        userId: 1,
        conversationId: started.conversationId,
        bodyText: 'same',
        clientMessageId: 'race-1',
      }),
    ]);
    assert.strictEqual(a.ok, true);
    assert.strictEqual(b.ok, true);
    assert.strictEqual(a.message.id, b.message.id);
    const all = await store.listMessages(started.conversationId);
    assert.strictEqual(all.length, 1);
  });

  await test('validateMessageContent allows empty body with attachment', () => {
    assert.strictEqual(pure.validateMessageContent('', { hasAttachment: true }).error, null);
    assert.strictEqual(pure.validateMessageContent('   ', { hasAttachment: true }).bodyText, '');
    assert.strictEqual(pure.validateMessageContent('', { hasAttachment: false }).error, 'empty_message');
  });

  await test('authorizeUploadFile rejects foreign and oversized images', () => {
    const ok = pure.authorizeUploadFile({
      id: 9,
      mime: 'image/jpeg',
      size: 1200,
      createdBy: { id: 1 },
    }, 1);
    assert.strictEqual(ok.error, null);
    const foreign = pure.authorizeUploadFile({
      id: 9,
      mime: 'image/jpeg',
      size: 1200,
      createdBy: { id: 2 },
    }, 1);
    assert.strictEqual(foreign.error, 'invalid_attachment');
    const huge = pure.authorizeUploadFile({
      id: 9,
      mime: 'image/png',
      size: pure.MAX_ATTACHMENT_BYTES + 1,
      createdBy: { id: 1 },
    }, 1);
    assert.strictEqual(huge.error, 'attachment_too_large');
    const gif = pure.authorizeUploadFile({
      id: 9,
      mime: 'image/gif',
      size: 100,
      createdBy: { id: 1 },
    }, 1);
    assert.strictEqual(gif.error, 'invalid_attachment_type');
    assert.match(gif.message, /JPEG, PNG, HEIC, or WebP/);
    const recentOrphan = pure.authorizeUploadFile({
      id: 11,
      mime: 'image/jpeg',
      size: 800,
      createdAt: new Date().toISOString(),
    }, 1);
    assert.strictEqual(recentOrphan.error, null);
    const staleOrphan = pure.authorizeUploadFile({
      id: 12,
      mime: 'image/jpeg',
      size: 800,
      createdAt: new Date(Date.now() - 16 * 60 * 1000).toISOString(),
    }, 1);
    assert.strictEqual(staleOrphan.error, 'invalid_attachment');
    const missingCreatedAt = pure.authorizeUploadFile({
      id: 13,
      mime: 'image/jpeg',
      size: 800,
    }, 1);
    assert.strictEqual(missingCreatedAt.error, 'invalid_attachment');
    const foreignUploader = pure.authorizeUploadFile({
      id: 14,
      mime: 'image/jpeg',
      size: 800,
      createdAt: new Date().toISOString(),
      provider_metadata: { uploaderUserId: 99 },
    }, 1);
    assert.strictEqual(foreignUploader.error, 'invalid_attachment');
    assert.strictEqual(pure.STRAPI_UPLOAD_SIZE_UNIT, 'kilobytes');
    const eightMbKb = pure.bytesToStoredUploadKb(pure.MAX_ATTACHMENT_BYTES);
    const atLimit = pure.authorizeUploadFile({
      id: 15,
      mime: 'image/jpeg',
      size: eightMbKb,
      createdBy: { id: 1 },
    }, 1);
    assert.strictEqual(atLimit.error, null);
    const nineMbAsKb = pure.authorizeUploadFile({
      id: 16,
      mime: 'image/jpeg',
      size: 9000,
      createdBy: { id: 1 },
    }, 1);
    assert.strictEqual(nineMbAsKb.error, 'attachment_too_large');
    assert.strictEqual(nineMbAsKb.message, 'Photos can be up to 8 MB.');
    assert.strictEqual(pure.uploadFileExceedsByteLimit({ size: 9000 }), true);
    assert.strictEqual(pure.uploadFileExceedsByteLimit({ size: 1200 }), false);
    const heic = pure.authorizeUploadFile({
      id: 17,
      mime: 'image/heic',
      size: 800,
      name: 'IMG_1234.HEIC',
      createdBy: { id: 1 },
    }, 1);
    assert.strictEqual(heic.error, 'invalid_attachment_type');
    assert.match(heic.message, /could not be read/);
  });

  await test('image-only send persists attachment and Photo preview', async () => {
    const { inbox, store } = setupWorld();
    store.seedFile({
      id: 501,
      url: 'https://example.com/show.jpg',
      mime: 'image/jpeg',
      size: 2048,
      width: 800,
      height: 600,
      createdBy: { id: 1 },
      createdAt: new Date().toISOString(),
    });
    const started = await startOk(inbox, 1, 10, 100);
    const sent = await inbox.sendMessage({
      userId: 1,
      conversationId: started.conversationId,
      bodyText: '',
      clientMessageId: 'img-1',
      attachmentMediaId: 501,
    });
    assert.strictEqual(sent.ok, true);
    assert.strictEqual(sent.message.bodyText, '');
    assert.strictEqual(sent.message.attachment.type, 'image');
    assert.strictEqual(sent.conversation.lastMessagePreview, 'Photo');
    const again = await inbox.sendMessage({
      userId: 1,
      conversationId: started.conversationId,
      bodyText: '',
      clientMessageId: 'img-1',
      attachmentMediaId: 501,
    });
    assert.strictEqual(again.ok, true);
    assert.strictEqual(again.duplicate, true);
    assert.strictEqual(again.message.id, sent.message.id);
  });

  await test('blocked relationship cannot send an image', async () => {
    const { inbox, store } = setupWorld();
    store.seedFile({
      id: 502,
      url: 'https://example.com/no.jpg',
      mime: 'image/png',
      size: 100,
      createdBy: { id: 1 },
      createdAt: new Date().toISOString(),
    });
    const started = await startOk(inbox, 1, 10, 100);
    await inbox.setBlocked({ userId: 2, conversationId: started.conversationId, blocked: true });
    const sent = await inbox.sendMessage({
      userId: 1,
      conversationId: started.conversationId,
      bodyText: 'photo',
      attachmentMediaId: 502,
    });
    assert.strictEqual(sent.ok, false);
    assert.strictEqual(sent.error, 'conversation_not_available');
  });

  await test('DM accepts 2–4 images and rejects more than 4', async () => {
    const { inbox, store } = setupWorld();
    for (const id of [601, 602, 603, 604, 605, 606, 607, 608]) {
      store.seedFile({
        id,
        url: `https://example.com/${id}.jpg`,
        mime: 'image/jpeg',
        size: 100,
        createdBy: { id: 1 },
        createdAt: new Date().toISOString(),
      });
    }
    const started = await startOk(inbox, 1, 10, 100);
    const two = await inbox.sendMessage({
      userId: 1,
      conversationId: started.conversationId,
      bodyText: '',
      clientMessageId: 'img-2',
      attachmentMediaIds: [601, 602],
    });
    assert.strictEqual(two.ok, true);
    assert.strictEqual(two.message.attachments.length, 2);
    assert.strictEqual(two.conversation.lastMessagePreview, '2 photos');
    const four = await inbox.sendMessage({
      userId: 1,
      conversationId: started.conversationId,
      bodyText: 'set',
      clientMessageId: 'img-4',
      attachmentMediaIds: [603, 604, 605, 606],
    });
    assert.strictEqual(four.ok, true);
    assert.strictEqual(four.message.attachments.length, 4);
    const tooMany = pure.parseAttachmentMediaIds([1, 2, 3, 4, 5]);
    assert.strictEqual(tooMany.error, 'too_many_attachments');
  });

  await test('DM attachment order follows the requested media id list', async () => {
    const { inbox, store } = setupWorld();
    for (const id of [8, 3, 19, 6]) {
      store.seedFile({
        id,
        url: `https://example.com/${id}.jpg`,
        mime: 'image/jpeg',
        size: 800,
        width: 800,
        height: 600,
        createdBy: { id: 1 },
        createdAt: new Date().toISOString(),
        formats: {
          thumbnail: { url: `https://example.com/${id}-thumb.jpg`, width: 245, height: 184 },
          medium: { url: `https://example.com/${id}-medium.jpg`, width: 750, height: 562 },
          large: { url: `https://example.com/${id}-large.jpg`, width: 1000, height: 750 },
        },
      });
    }
    const started = await startOk(inbox, 1, 10, 100);
    const sent = await inbox.sendMessage({
      userId: 1,
      conversationId: started.conversationId,
      bodyText: '',
      clientMessageId: 'order-1',
      attachmentMediaIds: [8, 3, 19, 6],
    });
    assert.strictEqual(sent.ok, true);
    assert.deepStrictEqual(sent.message.attachments.map((row) => row.mediaId), [8, 3, 19, 6]);
    assert.deepStrictEqual(sent.message.attachments.map((row) => row.order), [0, 1, 2, 3]);
    assert.strictEqual(sent.message.attachments[0].thumbnailUrl, 'https://example.com/8-thumb.jpg');
    assert.strictEqual(sent.message.attachments[0].url, 'https://example.com/8-medium.jpg');
    assert.strictEqual(sent.message.attachments[0].largeUrl, 'https://example.com/8-large.jpg');
    assert.strictEqual(sent.message.attachments[0].aspectRatio, 800 / 600);
    assert.deepStrictEqual(pure.parseAttachmentMediaIds([8, 3, 19, 8]), [8, 3, 19]);
  });

  await test('foreign media id cannot be attached', async () => {
    const { inbox, store } = setupWorld();
    store.seedFile({
      id: 503,
      url: 'https://example.com/steal.jpg',
      mime: 'image/webp',
      size: 100,
      createdBy: { id: 3 },
      createdAt: new Date().toISOString(),
    });
    const started = await startOk(inbox, 1, 10, 100);
    const sent = await inbox.sendMessage({
      userId: 1,
      conversationId: started.conversationId,
      bodyText: 'photo',
      attachmentMediaId: 503,
    });
    assert.strictEqual(sent.ok, false);
    assert.strictEqual(sent.error, 'invalid_attachment');
  });

  await test('protected conversation files serialize as MediaItems with proxy URLs', () => {
    const env = { JWT_SECRET: 'unit-test-secret' };
    const row = pure.serializeAttachment({
      id: 88,
      mime: 'image/webp',
      width: 800,
      height: 600,
      provider: 'faneqo-protected',
      url: 'faneqo-protected://abc',
      provider_metadata: { protected: true, domain: 'conversation', uploaderUserId: 1 },
    }, { order: 0, conversationId: 4, messageId: 9, env });
    assert.ok(row);
    assert.strictEqual(row.protected, true);
    assert.strictEqual(row.mediaId, 88);
    assert.ok(row.url.includes('/api/conversations/4/messages/9/media/88'));
    assert.ok(row.thumbnailUrl.includes('size=thumb'));
    assert.ok(row.largeUrl.includes('size=large'));
    assert.strictEqual(JSON.stringify(row).includes('faneqo-protected://'), false);
    assert.doesNotMatch(String(row.mediaId), /sig=/);
  });

  await test('authorizeUploadFile rejects ArtistUpdate protected files on DM attach', () => {
    const updateFile = {
      id: 77,
      mime: 'image/webp',
      size: 120,
      provider: 'faneqo-protected',
      provider_metadata: { protected: true, domain: 'artist-update', uploaderUserId: 1 },
      createdAt: new Date().toISOString(),
    };
    assert.strictEqual(pure.authorizeUploadFile(updateFile, 1).error, 'invalid_attachment');
    const conversationFile = {
      ...updateFile,
      provider_metadata: { protected: true, domain: 'conversation', uploaderUserId: 1 },
    };
    assert.strictEqual(pure.authorizeUploadFile(conversationFile, 1).error, null);
    assert.strictEqual(pure.authorizeUploadFile(conversationFile, 2).error, 'invalid_attachment');
  });

  await test('legacy public attachments still serialize after protected support', () => {
    const row = pure.serializeAttachment({
      id: 12,
      mime: 'image/jpeg',
      url: 'https://cdn.example/show.jpg',
      width: 800,
      height: 600,
    });
    assert.strictEqual(row.protected, false);
    assert.strictEqual(row.url, 'https://cdn.example/show.jpg');
  });

  await test('protected DM send stays on conversation ownership and denies cross-conversation', async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'unit-test-secret';
    const { inbox, store } = setupWorld();
    store.seedFile({
      id: 701,
      url: 'faneqo-protected://obj701',
      mime: 'image/webp',
      size: 40,
      width: 800,
      height: 600,
      provider: 'faneqo-protected',
      provider_metadata: { protected: true, domain: 'conversation', uploaderUserId: 1, objectId: 'obj701' },
      createdAt: new Date().toISOString(),
    });
    store.seedFile({
      id: 702,
      url: 'https://cdn.example/legacy.jpg',
      mime: 'image/jpeg',
      size: 80,
      createdBy: { id: 1 },
      createdAt: new Date().toISOString(),
    });
    const started = await startOk(inbox, 1, 10, 100);
    const sent = await inbox.sendMessage({
      userId: 1,
      conversationId: started.conversationId,
      bodyText: '',
      clientMessageId: 'prot-1',
      attachmentMediaIds: [701],
    });
    assert.strictEqual(sent.ok, true);
    assert.strictEqual(sent.message.attachments.length, 1);
    assert.strictEqual(sent.message.attachments[0].protected, true);
    assert.strictEqual(sent.message.attachments[0].mediaId, 701);
    assert.ok(sent.message.attachments[0].url.includes(`/api/conversations/${started.conversationId}/messages/${sent.message.id}/media/701`));
    const legacy = await inbox.sendMessage({
      userId: 1,
      conversationId: started.conversationId,
      bodyText: 'legacy',
      clientMessageId: 'legacy-1',
      attachmentMediaIds: [702],
    });
    assert.strictEqual(legacy.ok, true);
    assert.strictEqual(legacy.message.attachments[0].protected, false);
    assert.strictEqual(legacy.message.attachments[0].url, 'https://cdn.example/legacy.jpg');

    const other = await startOk(inbox, 3, 20, 101);
    const senderOk = await inbox.authorizeConversationMediaAccess({
      userId: 1,
      conversationId: started.conversationId,
      messageId: sent.message.id,
      mediaId: 701,
    });
    assert.ok(!senderOk.error);
    const fanOk = await inbox.authorizeConversationMediaAccess({
      userId: 2,
      conversationId: started.conversationId,
      messageId: sent.message.id,
      mediaId: 701,
    });
    assert.ok(!fanOk.error);
    const stranger = await inbox.authorizeConversationMediaAccess({
      userId: 3,
      conversationId: started.conversationId,
      messageId: sent.message.id,
      mediaId: 701,
    });
    assert.ok(stranger.error);
    assert.strictEqual(stranger.error.status, 403);
    const anon = await inbox.authorizeConversationMediaAccess({
      userId: null,
      conversationId: started.conversationId,
      messageId: sent.message.id,
      mediaId: 701,
    });
    assert.ok(anon.error);
    assert.strictEqual(anon.error.status, 401);
    const guessed = await inbox.authorizeConversationMediaAccess({
      userId: 1,
      conversationId: started.conversationId,
      messageId: sent.message.id,
      mediaId: 999999,
    });
    assert.ok(guessed.error);
    const cross = await inbox.authorizeConversationMediaAccess({
      userId: 1,
      conversationId: other.conversationId,
      messageId: sent.message.id,
      mediaId: 701,
    });
    assert.ok(cross.error);
    const mediaPure = require('../src/utils/artistUpdates/protectedMediaPure');
    const issued = mediaPure.issueConversationMediaUrls({
      conversationId: started.conversationId,
      messageId: sent.message.id,
      mediaId: 701,
    }, { JWT_SECRET: process.env.JWT_SECRET });
    const tokenOk = await inbox.authorizeConversationMediaAccess({
      userId: null,
      conversationId: started.conversationId,
      messageId: sent.message.id,
      mediaId: 701,
      size: 'thumb',
      exp: issued.exp,
      sig: new URL(issued.thumb, 'https://api.example').searchParams.get('sig') || issued.thumb.split('sig=')[1],
    });
    assert.ok(!tokenOk.error);
    assert.strictEqual(tokenOk.size, 'thumb');
    const wrongConvToken = mediaPure.issueConversationMediaUrls({
      conversationId: other.conversationId,
      messageId: sent.message.id,
      mediaId: 701,
    }, { JWT_SECRET: process.env.JWT_SECRET });
    const swapped = await inbox.authorizeConversationMediaAccess({
      userId: null,
      conversationId: other.conversationId,
      messageId: sent.message.id,
      mediaId: 701,
      size: 'large',
      exp: wrongConvToken.exp,
      sig: wrongConvToken.large.split('sig=')[1],
    });
    assert.ok(swapped.error);
  });

  await test('Strapi message loads keep the owning conversation id', async () => {
    const RELATIONS = [
      'conversation',
      'senderParticipant',
      'senderUser',
      'attachmentMedia',
      'attachmentGallery',
    ];
    const stored = {
      id: 34,
      senderSide: 'band',
      bodyText: '',
      conversation: { id: 7 },
      senderParticipant: { id: 3 },
      senderUser: { id: 1 },
      attachmentMedia: { id: 478 },
      attachmentGallery: [{
        id: 478,
        mime: 'image/webp',
        width: 960,
        height: 640,
        provider: 'faneqo-protected',
        url: 'faneqo-protected://obj478',
        provider_metadata: {
          protected: true,
          domain: 'conversation',
          objectId: 'obj478',
          keys: {},
          uploaderUserId: 1,
        },
      }],
    };
    // entityService returns only the relations named in populate.
    const project = (row, populate) => {
      const requested = new Set(Object.keys(populate || {}));
      const out = {};
      for (const [key, value] of Object.entries(row)) {
        if (RELATIONS.includes(key) && !requested.has(key)) continue;
        out[key] = value;
      }
      return out;
    };
    const strapiStub = {
      log: { info() {}, warn() {}, error() {} },
      entityService: {
        async findOne(uid, id, params) {
          return project(stored, params?.populate);
        },
        async findMany(uid, params) {
          return [project(stored, params?.populate)];
        },
        async create(uid, params) {
          return project(stored, params?.populate);
        },
      },
    };
    const store = createStrapiInboxStore(strapiStub);
    const loaded = [
      await store.findMessageById(34),
      await store.findMessageByIdempotencyKey('idem-key'),
      (await store.listMessages(7))[0],
      await store.createMessage({}),
    ];
    for (const row of loaded) {
      assert.strictEqual(Number(row.conversation), 7);
    }
    const serialized = pure.serializeAttachments(loaded[0], {
      env: { JWT_SECRET: 'unit-test-secret' },
    });
    assert.strictEqual(serialized.length, 1);
    assert.strictEqual(serialized[0].protected, true);
    assert.strictEqual(serialized[0].unavailable, undefined);
    assert.ok(serialized[0].url.includes('/api/conversations/7/messages/34/media/478'));
  });

  await test('production never attaches new public DM media', async () => {
    const { inbox, store } = setupWorld({ env: { NODE_ENV: 'production' } });
    store.seedFile({
      id: 801,
      url: 'https://example.com/public.jpg',
      mime: 'image/jpeg',
      size: 800,
      createdBy: { id: 1 },
      createdAt: new Date().toISOString(),
    });
    const started = await startOk(inbox, 1, 10, 100);
    const sent = await inbox.sendMessage({
      userId: 1,
      conversationId: started.conversationId,
      bodyText: 'photo',
      attachmentMediaId: 801,
    });
    assert.strictEqual(sent.ok, false);
    assert.strictEqual(sent.error, 'invalid_attachment');
    const delivery = inbox.mediaDeliveryStatus();
    assert.strictEqual(delivery.ok, true);
    assert.strictEqual(delivery.ready, false);
    assert.strictEqual(delivery.publicFallbackAllowed, false);
    assert.strictEqual(delivery.attachmentsEnabled, false);
  });

  await test('production ignores the public DM fallback flag', async () => {
    const { inbox, store } = setupWorld({
      env: { NODE_ENV: 'production', FANEQO_DM_PUBLIC_MEDIA_FALLBACK: '1' },
    });
    store.seedFile({
      id: 802,
      url: 'https://example.com/public.jpg',
      mime: 'image/jpeg',
      size: 800,
      createdBy: { id: 1 },
      createdAt: new Date().toISOString(),
    });
    const started = await startOk(inbox, 1, 10, 100);
    const sent = await inbox.sendMessage({
      userId: 1,
      conversationId: started.conversationId,
      bodyText: 'photo',
      attachmentMediaId: 802,
    });
    assert.strictEqual(sent.ok, false);
    assert.strictEqual(sent.error, 'invalid_attachment');
  });

  await test('legacy public DM media still serializes when attach is fail-closed', () => {
    const row = pure.serializeAttachment({
      id: 803,
      url: 'https://cdn.example/legacy.jpg',
      mime: 'image/jpeg',
      width: 800,
      height: 600,
    });
    assert.ok(row);
    assert.strictEqual(row.protected, false);
    assert.ok(row.url.includes('cdn.example/legacy.jpg'));
    const denied = pure.authorizeUploadFile({
      id: 803,
      url: 'https://cdn.example/legacy.jpg',
      mime: 'image/jpeg',
      size: 800,
      createdBy: { id: 1 },
    }, 1, { allowPublicAttachment: false });
    assert.strictEqual(denied.error, 'invalid_attachment');
  });

  await test('jwt failure reason distinguishes expired vs invalid', () => {
    assert.strictEqual(jwtFailureReason({ name: 'TokenExpiredError', message: 'jwt expired' }), 'expired_token');
    assert.strictEqual(jwtFailureReason({ name: 'JsonWebTokenError', message: 'invalid signature' }), 'invalid_token');
  });

  console.log('\n=== Artist-initiated fan inbox (M1.2) ===\n');

  await test('artist-initiated conversation: fan list, open, reply, list again', async () => {
    const { inbox, store } = setupWorld();
    const started = await inbox.getOrCreateConversationForFan({
      userId: 1,
      bandId: 10,
      fanId: 100,
    });
    assert.strictEqual(started.ok, true, started.message);
    const conversation = await store.findConversationById(started.conversationId);
    assert.strictEqual(conversation.originType, 'artist_direct');
    assert.strictEqual(Number(conversation.fanAccountUser), 2);
    assert.strictEqual(Number(conversation.band), 10);

    const artistSend = await inbox.sendMessage({
      userId: 1,
      conversationId: started.conversationId,
      bodyText: 'Hey from the band',
    });
    assert.strictEqual(artistSend.ok, true, artistSend.message);

    const firstList = await inbox.listFanConversations({ userId: 2, page: 1, pageSize: 50 });
    assert.strictEqual(firstList.ok, true);
    assert.strictEqual(firstList.conversations.length, 1);
    assert.strictEqual(firstList.conversations[0].id, started.conversationId);
    assert.strictEqual(firstList.conversations[0].artist.name, 'BurningThunder');
    assert.strictEqual(firstList.conversations[0].artist.slug, 'burningthunder');
    assert.strictEqual(firstList.conversations[0].lastMessage.preview, 'Hey from the band');
    assert.strictEqual(firstList.conversations[0].lastMessage.senderSide, 'band');

    const opened = await inbox.getConversation({
      userId: 2,
      conversationId: started.conversationId,
    });
    assert.strictEqual(opened.ok, true, opened.message);
    assert.ok(opened.conversation.messages.some((m) => m.bodyText === 'Hey from the band'));

    const reply = await inbox.sendMessage({
      userId: 2,
      conversationId: started.conversationId,
      bodyText: 'Thanks',
    });
    assert.strictEqual(reply.ok, true, reply.message);

    const secondList = await inbox.listFanConversations({ userId: 2, page: 1, pageSize: 50 });
    assert.strictEqual(secondList.ok, true);
    assert.strictEqual(secondList.conversations.length, 1);
    assert.strictEqual(secondList.conversations[0].id, started.conversationId);
    assert.strictEqual(secondList.conversations[0].lastMessage.preview, 'Thanks');
    assert.strictEqual(secondList.conversations[0].lastMessage.senderSide, 'fan');

    const reopened = await inbox.getConversation({
      userId: 2,
      conversationId: started.conversationId,
    });
    assert.strictEqual(reopened.ok, true, reopened.message);
    const bodies = reopened.conversation.messages.map((m) => m.bodyText);
    assert.ok(bodies.includes('Hey from the band'));
    assert.ok(bodies.includes('Thanks'));
  });

  await test('campaign-created conversation is listable by the fan', async () => {
    const { inbox } = setupWorld();
    const sent = await inbox.sendCampaignMessage({
      authorizedArtistUserId: 1,
      bandId: 10,
      fanId: 100,
      campaignId: 77,
      bodyText: 'Tour dates this week',
    });
    assert.strictEqual(sent.ok, true, sent.message);

    const list = await inbox.listFanConversations({ userId: 2, page: 1, pageSize: 50 });
    assert.strictEqual(list.ok, true);
    assert.strictEqual(list.conversations.length, 1);
    assert.strictEqual(list.conversations[0].artist.name, 'BurningThunder');
    assert.strictEqual(list.conversations[0].lastMessage.preview, 'Tour dates this week');

    const opened = await inbox.getConversation({
      userId: 2,
      conversationId: list.conversations[0].id,
    });
    assert.strictEqual(opened.ok, true, opened.message);
  });

  await test('fan list omits integrity-conflict rows and still returns 200', async () => {
    const { inbox, store } = setupWorld();
    const good = await startOk(inbox, 1, 10, 100);
    await inbox.sendMessage({
      userId: 1,
      conversationId: good.conversationId,
      bodyText: 'keep me',
    });
    const conflicted = await startOk(inbox, 3, 20, 101);
    await inbox.sendMessage({
      userId: 3,
      conversationId: conflicted.conversationId,
      bodyText: 'hidden',
    });
    const fanPart = [...store.participants.values()].find(
      (p) => Number(p.conversation) === Number(conflicted.conversationId) && p.side === 'fan'
    );
    assert.ok(fanPart);
    await store.updateParticipant(fanPart.id, { accountUser: 5 });

    const list = await inbox.listFanConversations({ userId: 2, page: 1, pageSize: 50 });
    assert.strictEqual(list.ok, true);
    assert.strictEqual(list.conversations.length, 1);
    assert.strictEqual(list.conversations[0].id, good.conversationId);
    assert.ok(!list.conversations.some((row) => row.id === conflicted.conversationId));
  });

  await test('fan list heals a missing fan participant from canonical fanAccountUser', async () => {
    const { inbox, store } = setupWorld();
    const started = await startOk(inbox, 1, 10, 100);
    await inbox.sendMessage({
      userId: 1,
      conversationId: started.conversationId,
      bodyText: 'still yours',
    });
    const fanPart = [...store.participants.values()].find(
      (p) => Number(p.conversation) === Number(started.conversationId) && p.side === 'fan'
    );
    store.participants.delete(fanPart.id);

    const list = await inbox.listFanConversations({ userId: 2, page: 1, pageSize: 50 });
    assert.strictEqual(list.ok, true);
    assert.strictEqual(list.conversations.length, 1);
    assert.strictEqual(list.conversations[0].id, started.conversationId);
    const healed = [...store.participants.values()].find(
      (p) => Number(p.conversation) === Number(started.conversationId) && p.side === 'fan'
    );
    assert.ok(healed);
    assert.strictEqual(Number(healed.accountUser), 2);
  });

  await test('Strapi fan list query filters by fanAccountUser and never selects relation columns', async () => {
    const RELATIONS = ['fanAccountUser', 'band', 'originFan'];
    const calls = [];
    const strapiStub = {
      log: { info() {}, warn() {}, error() {} },
      entityService: {
        async findMany(_uid, params) {
          const fields = params?.fields || [];
          for (const rel of RELATIONS) {
            if (fields.includes(rel)) {
              const err = new Error(
                `select distinct \`t0\`.\`id\`, \`t0\`.\`${rel}\` from \`conversations\` as \`t0\` - no such column: t0.${rel}`
              );
              err.name = 'SqliteError';
              err.code = 'SQLITE_ERROR';
              throw err;
            }
          }
          calls.push(params);
          return [];
        },
      },
    };
    const store = createStrapiInboxStore(strapiStub);
    const rows = await store.listConversationsForFanUser(3);
    assert.deepStrictEqual(rows, []);
    assert.ok(calls.length >= 1, 'expected entityService.findMany');
    for (const params of calls) {
      const filterUser = params.filters?.fanAccountUser;
      const filterUserId = filterUser && typeof filterUser === 'object' && 'id' in filterUser
        ? filterUser.id
        : filterUser;
      assert.strictEqual(Number(filterUserId), 3);
      assert.ok(!params.filters?.participants, 'must not discover via participant.accountUser');
      const fields = params.fields || [];
      for (const rel of RELATIONS) {
        assert.ok(!fields.includes(rel), `${rel} must not be in fields`);
      }
    }
  });

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
  if (failed) process.exitCode = 1;
})();
