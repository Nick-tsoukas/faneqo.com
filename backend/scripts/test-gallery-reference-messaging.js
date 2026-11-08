'use strict';

const assert = require('assert');
const path = require('path');

const galleryRef = require(path.join(__dirname, '../src/utils/inbox/galleryReference'));
const {
  createMemoryInboxStore,
  createInboxService,
} = require(path.join(__dirname, '../src/utils/inbox/directMessaging'));
const { resetInboxRateLimitForTests } = require(path.join(
  __dirname,
  '../src/utils/inbox/inboxRateLimit'
));

function gallery(id, bandId, title = 'Nashville — Aug 29') {
  return {
    id,
    title,
    bodyText: '',
    status: 'published',
    contentKind: 'gallery',
    visibility: 'show_attendees',
    photoCount: 12,
    locked: false,
    show: { city: 'Nashville', venue: 'The Basement East', date: '2026-08-29' },
    band: { id: bandId, name: bandId === 10 ? 'BurningThunder' : 'Other Artist' },
    media: [{ id: 900 + id, mediaId: 900 + id, type: 'image', url: `/gallery/${id}.jpg` }],
  };
}

async function main() {
  assert.strictEqual(
    galleryRef.encodeGalleryReference(501, 'Photos from tonight'),
    '[[faneqo-gallery:v1:501]]\nPhotos from tonight'
  );
  assert.deepStrictEqual(
    galleryRef.parseGalleryReference('[[faneqo-gallery:v1:501]]\nPhotos from tonight'),
    { artistUpdateId: 501, bodyText: 'Photos from tonight' }
  );
  assert.strictEqual(galleryRef.containsReservedMarker('hello'), false);
  assert.strictEqual(galleryRef.containsReservedMarker('[[faneqo-gallery:v1:501]]'), true);

  resetInboxRateLimitForTests();
  const store = createMemoryInboxStore();
  store.seedUser({ id: 1, email: 'owner@example.com' });
  store.seedUser({ id: 2, email: 'fan@example.com' });
  store.seedBand({ id: 10, name: 'BurningThunder', slug: 'burningthunder' });
  store.seedBand({ id: 20, name: 'Other Artist', slug: 'other' });
  store.seedMember(10, 1, 'owner');
  store.seedFan({
    id: 100,
    band: 10,
    accountUser: 2,
    firstName: 'Sarah',
    status: 'subscribed',
  });

  let fanCanSee = true;
  const catalog = new Map([
    [501, gallery(501, 10)],
    [502, gallery(502, 10, 'Attendees only')],
    [503, gallery(503, 20, 'Wrong band')],
  ]);
  const inbox = createInboxService(store, {
    logger: { info() {}, warn() {}, error() {} },
    env: { NODE_ENV: 'test', FANEQO_DM_PUBLIC_MEDIA_FALLBACK: '1' },
    resolveGalleryReferences: async ({ userId, updateIds }) => {
      return updateIds.flatMap((id) => {
        const row = catalog.get(Number(id));
        if (!row) return [];
        if (Number(userId) === 1) return [row];
        if (Number(userId) === 2 && fanCanSee && Number(id) === 501) return [row];
        return [];
      });
    },
  });

  const opened = await inbox.getOrCreateConversationForFan({
    userId: 1,
    bandId: 10,
    fanId: 100,
  });
  assert.strictEqual(opened.ok, true);
  const conversationId = opened.conversationId;

  const sent = await inbox.sendMessage({
    userId: 1,
    conversationId,
    bodyText: 'Photos from tonight',
    clientMessageId: 'gallery-test-0001',
    artistUpdateId: 501,
  });
  assert.strictEqual(sent.ok, true, sent.message);
  assert.strictEqual(sent.message.bodyText, 'Photos from tonight');
  assert.strictEqual(sent.message.galleryReference.id, 501);
  assert.strictEqual(sent.message.galleryReference.media.length, 1);
  assert.strictEqual(sent.conversation.lastMessagePreview, 'Shared a show gallery');

  const fanThread = await inbox.listMessages({ userId: 2, conversationId });
  assert.strictEqual(fanThread.ok, true);
  assert.strictEqual(fanThread.messages[0].galleryReference.id, 501);
  assert.strictEqual(fanThread.messages[0].bodyText, 'Photos from tonight');

  const replay = await inbox.sendMessage({
    userId: 1,
    conversationId,
    bodyText: 'Photos from tonight',
    clientMessageId: 'gallery-test-0001',
    artistUpdateId: 501,
  });
  assert.strictEqual(replay.ok, true);
  assert.strictEqual(replay.duplicate, true);
  assert.strictEqual(replay.message.galleryReference.id, 501);

  const fanForgery = await inbox.sendMessage({
    userId: 2,
    conversationId,
    artistUpdateId: 501,
  });
  assert.strictEqual(fanForgery.ok, false);
  assert.strictEqual(fanForgery.error, 'gallery_not_available');

  const reservedForgery = await inbox.sendMessage({
    userId: 1,
    conversationId,
    bodyText: '[[faneqo-gallery:v1:501]]',
  });
  assert.strictEqual(reservedForgery.ok, false);
  assert.strictEqual(reservedForgery.error, 'invalid_message');

  const recipientDenied = await inbox.sendMessage({
    userId: 1,
    conversationId,
    clientMessageId: 'gallery-test-0002',
    artistUpdateId: 502,
  });
  assert.strictEqual(recipientDenied.ok, false);
  assert.strictEqual(recipientDenied.error, 'gallery_not_available');

  const crossBand = await inbox.sendMessage({
    userId: 1,
    conversationId,
    clientMessageId: 'gallery-test-0003',
    artistUpdateId: 503,
  });
  assert.strictEqual(crossBand.ok, false);
  assert.strictEqual(crossBand.error, 'gallery_not_available');

  fanCanSee = false;
  const revoked = await inbox.listMessages({ userId: 2, conversationId });
  assert.strictEqual(revoked.ok, true);
  assert.strictEqual(revoked.messages[0].galleryReference.id, 501);
  assert.strictEqual(revoked.messages[0].galleryReference.locked, true);
  assert.deepStrictEqual(revoked.messages[0].galleryReference.media, []);

  const persisted = [...store.messages.values()][0];
  assert.match(persisted.bodyText, /^\[\[faneqo-gallery:v1:501\]\]/);

  console.log('test-gallery-reference-messaging: ok');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
