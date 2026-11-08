'use strict';

const assert = require('assert');
const {
  EVENT_TYPES,
  assertEventType,
  assertSourceType,
  idempotencyKey,
} = require('../src/utils/relationshipEvents/relationshipEventKeys');
const {
  recordRelationshipEvent,
  sanitizeMetadata,
  parseCursor,
  encodeCursor,
  broadcastAllowed,
  toDto,
} = require('../src/utils/relationshipEvents/relationshipEventService');
const {
  produceFanJoined,
  produceShowAttendance,
  produceMessageEvent,
  producePassportClaimed,
  produceArtistUpdatePublished,
} = require('../src/utils/relationshipEvents/relationshipEventProducers');

function mockStrapi({ rows = [], attendanceCount = 1, uniqueOnce = false } = {}) {
  const store = [...rows];
  let createCalls = 0;
  return {
    log: { info() {}, warn() {} },
    store,
    entityService: {
      async findMany(uid, params) {
        if (uid === 'api::relationship-event.relationship-event') {
          const key = params?.filters?.idempotencyKey;
          if (key) return store.filter((r) => r.idempotencyKey === key);
          const band = params?.filters?.band;
          const fan = params?.filters?.fan;
          return store.filter((r) => {
            if (band != null && String(r.band) !== String(band)) return false;
            if (fan && fan.$null) return r.fan == null;
            if (fan != null && String(r.fan) !== String(fan)) return false;
            return true;
          });
        }
        return [];
      },
      async findOne() {
        return null;
      },
      async create(uid, { data }) {
        if (uid && uid !== 'api::relationship-event.relationship-event') {
          return { id: 900 + createCalls, ...data };
        }
        createCalls += 1;
        if (uniqueOnce && createCalls === 2) {
          const err = new Error('duplicate key value violates unique constraint');
          err.code = '23505';
          throw err;
        }
        if (store.some((r) => r.idempotencyKey === data.idempotencyKey)) {
          const err = new Error('duplicate key value violates unique constraint');
          err.code = '23505';
          throw err;
        }
        const row = { id: store.length + 1, ...data, band: data.band, fan: data.fan };
        store.push(row);
        return row;
      },
      async update() {
        return null;
      },
      async count() {
        return attendanceCount;
      },
    },
    createCalls: () => createCalls,
  };
}

assert.strictEqual(EVENT_TYPES.includes('fan_joined'), true);
assert.throws(() => assertEventType('not_a_type'), /Unknown relationship event type/);
assert.throws(() => assertSourceType('page_view'), /Unknown relationship source type/);
assert.strictEqual(idempotencyKey('fan_joined', 9), 'fan_joined:9');
assert.strictEqual(idempotencyKey('show_checked_in', 44), 'show_checked_in:44');
assert.strictEqual(idempotencyKey('passport_claimed', 1, 99), 'passport_claimed:1:99');

const cleaned = sanitizeMetadata({
  campaignId: 'c1',
  body: 'I love your band',
  bodyText: 'nope',
  email: 'a@b.com',
  html: '<p>x</p>',
  city: 'Austin',
});
assert.deepStrictEqual(cleaned, { campaignId: 'c1', city: 'Austin' });
assert.ok(!JSON.stringify(cleaned).includes('love'));

const cursor = parseCursor('2026-08-19T12:00:00.000Z|12');
assert.strictEqual(cursor.id, 12);
assert.strictEqual(encodeCursor({ occurredAt: '2026-08-19T12:00:00.000Z', id: 12 }), '2026-08-19T12:00:00.000Z|12');

assert.strictEqual(
  broadcastAllowed({
    event: { visibility: 'derived_from_source', metadata: { visibility: 'public' } },
    fan: { status: 'subscribed' },
    attended: false,
    viewer: 'artist',
  }),
  true
);
assert.strictEqual(
  broadcastAllowed({
    event: { visibility: 'derived_from_source', metadata: { visibility: 'fan_list' } },
    fan: { status: 'unsubscribed' },
    attended: false,
    viewer: 'artist',
  }),
  false
);
assert.strictEqual(
  broadcastAllowed({
    event: { visibility: 'derived_from_source', metadata: { visibility: 'show_attendees' } },
    fan: { status: 'subscribed' },
    attended: true,
    viewer: 'artist',
  }),
  true
);
assert.strictEqual(
  broadcastAllowed({
    event: { visibility: 'fan_only' },
    fan: {},
    attended: false,
    viewer: 'artist',
    includeFanOnly: false,
  }),
  false
);

async function main() {
  const s = mockStrapi();
  const first = await recordRelationshipEvent(s, {
    type: 'fan_joined',
    bandId: 2,
    fanId: 9,
    sourceType: 'fan',
    sourceId: '9',
    idempotencyKey: 'fan_joined:9',
    occurredAt: '2026-08-01T00:00:00.000Z',
  });
  assert.strictEqual(first._duplicate, false);
  const again = await recordRelationshipEvent(s, {
    type: 'fan_joined',
    bandId: 2,
    fanId: 9,
    sourceType: 'fan',
    sourceId: '9',
    idempotencyKey: 'fan_joined:9',
  });
  assert.strictEqual(again._duplicate, true);
  assert.strictEqual(s.store.length, 1);

  await produceFanJoined(s, {
    id: 9,
    band: 2,
    source: 'band_page',
    captureSurface: 'follow_modal',
    subscribedAt: '2026-08-01T00:00:00.000Z',
  });
  assert.strictEqual(s.store.filter((r) => r.type === 'fan_joined').length, 1);

  const check = mockStrapi({ attendanceCount: 1 });
  await produceShowAttendance(check, {
    id: 50,
    fan: 9,
    band: 2,
    checkedInAt: '2026-08-02T00:00:00.000Z',
    campaignId: 'camp-1',
    city: 'Austin',
    venue: 'Stubb\'s',
  });
  assert.strictEqual(check.store.some((r) => r.type === 'show_checked_in'), true);
  assert.strictEqual(check.store.some((r) => r.type === 'show_returned'), false);

  const ret = mockStrapi({ attendanceCount: 2 });
  await produceShowAttendance(ret, {
    id: 51,
    fan: 9,
    band: 2,
    checkedInAt: '2026-08-03T00:00:00.000Z',
  });
  assert.strictEqual(ret.store.some((r) => r.type === 'show_returned'), true);
  assert.strictEqual(ret.store.find((r) => r.type === 'show_returned').metadata.showCount, 2);

  await produceShowAttendance(ret, {
    id: 51,
    fan: 9,
    band: 2,
    checkedInAt: '2026-08-03T00:00:00.000Z',
  });
  assert.strictEqual(ret.store.filter((r) => r.type === 'show_returned').length, 1);

  const msg = mockStrapi();
  await produceMessageEvent(msg, {
    senderSide: 'band',
    messageId: 88,
    conversationId: 3,
    bandId: 2,
    fanId: 9,
  });
  const payload = JSON.stringify(msg.store);
  assert.ok(!payload.includes('I love'));
  assert.ok(!payload.includes('body'));
  assert.strictEqual(msg.store[0].type, 'artist_message_sent');
  assert.strictEqual(msg.store[0].metadata.conversationId, 3);

  await produceMessageEvent(msg, {
    senderSide: 'fan',
    messageId: 89,
    conversationId: 3,
    bandId: 2,
    fanId: 9,
  });
  assert.strictEqual(msg.store[1].type, 'fan_replied');
  assert.ok(!JSON.stringify(msg.store[1]).includes('html'));

  const claim = mockStrapi();
  await producePassportClaimed(claim, { fanId: 9, bandId: 2, accountUserId: 77 });
  await producePassportClaimed(claim, { fanId: 9, bandId: 2, accountUserId: 77 });
  assert.strictEqual(claim.store.length, 1);
  assert.strictEqual(claim.store[0].visibility, 'fan_only');

  const upd = mockStrapi();
  await produceArtistUpdatePublished(upd, {
    id: 5,
    band: 2,
    visibility: 'show_attendees',
    contentKind: 'gallery',
    publishedAt: '2026-08-04T00:00:00.000Z',
    event: 12,
  });
  assert.strictEqual(upd.store.filter((r) => r.type === 'artist_update_published').length, 1);
  assert.strictEqual(upd.store.filter((r) => r.type === 'show_gallery_added').length, 1);
  assert.ok(upd.store.every((r) => r.fan == null));

  const updOne = mockStrapi();
  await produceArtistUpdatePublished(updOne, {
    id: 6,
    band: 2,
    visibility: 'show_attendees',
    contentKind: 'image',
    publishedAt: '2026-08-04T00:00:00.000Z',
    showRecap: { campaignId: 'sm_manual' },
  });
  assert.strictEqual(updOne.store.filter((r) => r.type === 'show_gallery_added').length, 1);
  assert.strictEqual(updOne.store.find((r) => r.type === 'show_gallery_added').metadata.campaignId, 'sm_manual');

  const updPublic = mockStrapi();
  await produceArtistUpdatePublished(updPublic, {
    id: 7,
    band: 2,
    visibility: 'public',
    contentKind: 'gallery',
    publishedAt: '2026-08-04T00:00:00.000Z',
    showRecap: { id: 41, campaignId: 'sm_public' },
    showRecapId: 41,
  });
  assert.strictEqual(updPublic.store.filter((r) => r.type === 'show_gallery_added').length, 1);
  assert.strictEqual(updPublic.store.find((r) => r.type === 'show_gallery_added').metadata.visibility, 'public');
  await produceArtistUpdatePublished(updPublic, {
    id: 7,
    band: 2,
    visibility: 'fan_list',
    contentKind: 'gallery',
    publishedAt: '2026-08-04T00:00:00.000Z',
    showRecap: { id: 41, campaignId: 'sm_public' },
    showRecapId: 41,
  });
  assert.strictEqual(updPublic.store.filter((r) => r.type === 'show_gallery_added').length, 1);

  const updGeneral = mockStrapi();
  await produceArtistUpdatePublished(updGeneral, {
    id: 8,
    band: 2,
    visibility: 'public',
    contentKind: 'image',
    publishedAt: '2026-08-04T00:00:00.000Z',
  });
  assert.strictEqual(updGeneral.store.filter((r) => r.type === 'show_gallery_added').length, 0);

  const iso = mockStrapi();
  iso.store.push({
    id: 1,
    type: 'fan_joined',
    band: 2,
    fan: 9,
    occurredAt: '2026-08-10T00:00:00.000Z',
    sourceType: 'fan',
    sourceId: '9',
    visibility: 'artist_fan',
  });
  iso.store.push({
    id: 2,
    type: 'fan_joined',
    band: 99,
    fan: 9,
    occurredAt: '2026-08-11T00:00:00.000Z',
    sourceType: 'fan',
    sourceId: '9',
    visibility: 'artist_fan',
  });
  const band2 = await iso.entityService.findMany('api::relationship-event.relationship-event', {
    filters: { band: 2, fan: 9 },
  });
  assert.strictEqual(band2.length, 1);

  const dto = toDto({
    id: 1,
    type: 'artist_message_sent',
    occurredAt: 'x',
    sourceType: 'conversation_message',
    sourceId: '88',
    metadata: { conversationId: 3 },
    visibility: 'artist_fan',
    schemaVersion: 1,
    fan: 9,
    band: 2,
    bodyText: 'should not be copied',
  });
  assert.ok(!Object.prototype.hasOwnProperty.call(dto, 'bodyText'));

  console.log('test-relationship-events: ok');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
