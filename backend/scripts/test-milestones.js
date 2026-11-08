'use strict';

const assert = require('assert');
const {
  FIRST_SHOW,
  SECOND_SHOW,
  FIRST_REPLY,
  milestoneIdempotencyKey,
  assertType,
} = require('../src/utils/milestones/milestoneKeys');
const {
  evaluateFirstShow,
  evaluateSecondShow,
  evaluateFirstReply,
  orderedCanonicalAttendances,
  sanitizeEvidence,
  draftFromEvaluation,
  needsUpdate,
} = require('../src/utils/milestones/milestonePure');
const { persistMilestone } = require('../src/utils/milestones/milestoneService');
const {
  reconcileFanArtistMilestones,
  reconcileFanArtistMilestonesSafe,
} = require('../src/utils/milestones/milestoneReconcile');
const { classifyDesired, emptyReport } = require('../src/utils/milestones/milestoneBackfill');
const { produceShowAttendance, produceMessageEvent } = require('../src/utils/relationshipEvents/relationshipEventProducers');

assert.strictEqual(
  milestoneIdempotencyKey({ bandId: 2, subjectFanId: 9, type: FIRST_SHOW }),
  'fan:2:9:fan_artist.first_show'
);
assert.strictEqual(
  milestoneIdempotencyKey({ bandId: 2, type: 'artist.fans.100' }),
  'band:2:artist.fans.100'
);
assert.throws(() => milestoneIdempotencyKey({ bandId: 2, type: FIRST_SHOW }));
assert.ok(assertType(FIRST_SHOW));

const nashville = {
  id: 10,
  fan: 9,
  band: 2,
  event: 11,
  campaignId: null,
  checkedInAt: '2025-10-18T02:00:00.000Z',
  city: 'Nashville',
  suppressedDuplicate: false,
};
const knoxville = {
  id: 11,
  fan: 9,
  band: 2,
  event: null,
  campaignId: 'sm_knoxville',
  checkedInAt: '2025-12-05T03:00:00.000Z',
  city: 'Knoxville',
  suppressedDuplicate: false,
};
const laterShow = {
  id: 12,
  fan: 9,
  band: 2,
  event: 13,
  checkedInAt: '2026-03-01T03:00:00.000Z',
  suppressedDuplicate: false,
};

assert.strictEqual(evaluateFirstShow([]), null);
assert.strictEqual(evaluateSecondShow([nashville]), null);

const first = evaluateFirstShow([nashville]);
assert.strictEqual(first.type, FIRST_SHOW);
assert.strictEqual(first.value, 1);
assert.strictEqual(first.occurredAt, nashville.checkedInAt);
assert.deepStrictEqual(first.evidence, { attendanceId: '10' });
assert.ok(!JSON.stringify(first).includes('IT STARTED HERE'));

const firstManual = evaluateFirstShow([knoxville]);
assert.strictEqual(firstManual.evidence.attendanceId, '11');
assert.strictEqual(firstManual.occurredAt, knoxville.checkedInAt);

const second = evaluateSecondShow([knoxville, nashville]);
assert.strictEqual(second.type, SECOND_SHOW);
assert.strictEqual(second.value, 2);
assert.strictEqual(second.occurredAt, knoxville.checkedInAt);
assert.strictEqual(second.evidence.attendanceId, '11');
assert.strictEqual(second.evidence.priorAttendanceId, '10');
assert.strictEqual(second.evidence.ordinal, 2);

const five = evaluateSecondShow([nashville, knoxville, laterShow, { ...laterShow, id: 14, checkedInAt: '2026-04-01T00:00:00.000Z' }, { ...laterShow, id: 15, checkedInAt: '2026-05-01T00:00:00.000Z' }]);
assert.strictEqual(five.evidence.attendanceId, '11');
assert.strictEqual(evaluateSecondShow([nashville, knoxville, laterShow, nashville, knoxville]).type, SECOND_SHOW);

const insertedLate = evaluateSecondShow([
  { ...knoxville, id: 1 },
  { ...nashville, id: 99 },
]);
assert.strictEqual(insertedLate.occurredAt, knoxville.checkedInAt);
assert.deepStrictEqual(
  orderedCanonicalAttendances([{ ...knoxville, id: 1 }, { ...nashville, id: 99 }]).map((r) => r.id),
  [99, 1]
);

assert.strictEqual(evaluateFirstReply(null), null);
assert.strictEqual(evaluateFirstReply({ id: 4, type: 'artist_message_sent', occurredAt: '2025-11-01T00:00:00.000Z' }), null);
const reply = evaluateFirstReply({ id: 44, type: 'fan_replied', occurredAt: '2025-11-20T00:00:00.000Z' });
assert.strictEqual(reply.type, FIRST_REPLY);
assert.strictEqual(reply.value, 1);
assert.deepStrictEqual(reply.evidence, { relationshipEventId: '44' });
assert.ok(!JSON.stringify(reply).includes('@'));
assert.ok(!Object.prototype.hasOwnProperty.call(reply.evidence, 'body'));

assert.throws(() => sanitizeEvidence(FIRST_SHOW, { attendanceId: 10, email: 'sarah@example.com' }));
assert.throws(() => sanitizeEvidence(FIRST_REPLY, { relationshipEventId: 44, body: 'hey' }));

const draft = draftFromEvaluation({
  bandId: 2,
  subjectFanId: 9,
  evaluation: first,
});
assert.strictEqual(draft.idempotencyKey, 'fan:2:9:fan_artist.first_show');
assert.ok(!draft.title);

function mockStrapi({
  attendances = [],
  events = [],
  milestones = [],
  uniqueOnce = false,
} = {}) {
  const attendanceStore = [...attendances];
  const eventStore = [...events];
  const milestoneStore = [...milestones];
  let createCalls = 0;
  return {
    log: { info() {}, warn() {} },
    attendanceStore,
    eventStore,
    milestoneStore,
    entityService: {
      async findMany(uid, params) {
        if (uid === 'api::fan-show-attendance.fan-show-attendance') {
          let rows = attendanceStore;
          if (params?.filters?.$or) {
            rows = rows.filter((row) => row.suppressedDuplicate !== true);
          }
          const fanFilter = params?.filters?.fan;
          if (fanFilter) {
            rows = rows.filter((row) => Number(row.fan?.id || row.fan) === Number(fanFilter));
          }
          const bandFilter = params?.filters?.band;
          if (bandFilter) {
            rows = rows.filter((row) => Number(row.band?.id || row.band) === Number(bandFilter));
          }
          return rows;
        }
        if (uid === 'api::relationship-event.relationship-event') {
          const key = params?.filters?.idempotencyKey;
          if (key) return eventStore.filter((r) => r.idempotencyKey === key);
          let rows = eventStore;
          if (params?.filters?.type) {
            const type = params.filters.type;
            if (typeof type === 'string') rows = rows.filter((r) => r.type === type);
          }
          if (params?.filters?.fan) {
            rows = rows.filter((r) => Number(r.fan) === Number(params.filters.fan));
          }
          if (params?.filters?.band) {
            rows = rows.filter((r) => Number(r.band) === Number(params.filters.band));
          }
          rows = [...rows].sort((a, b) => {
            const ta = new Date(a.occurredAt || 0).getTime();
            const tb = new Date(b.occurredAt || 0).getTime();
            if (ta !== tb) return ta - tb;
            return Number(a.id) - Number(b.id);
          });
          const limit = params?.limit;
          if (limit) return rows.slice(0, limit);
          return rows;
        }
        if (uid === 'api::milestone.milestone') {
          const key = params?.filters?.idempotencyKey;
          if (key) return milestoneStore.filter((r) => r.idempotencyKey === key);
          let rows = milestoneStore;
          if (params?.filters?.band) {
            rows = rows.filter((r) => Number(r.band) === Number(params.filters.band));
          }
          if (params?.filters?.subjectFan) {
            rows = rows.filter((r) => Number(r.subjectFan) === Number(params.filters.subjectFan));
          }
          if (params?.filters?.status?.$ne) {
            rows = rows.filter((r) => r.status !== params.filters.status.$ne);
          }
          return rows;
        }
        if (uid === 'api::moment.moment') return [];
        return [];
      },
      async findOne(uid, id) {
        if (uid === 'api::fan-show-attendance.fan-show-attendance') {
          return attendanceStore.find((r) => Number(r.id) === Number(id)) || null;
        }
        return null;
      },
      async create(uid, { data }) {
        createCalls += 1;
        if (uid === 'api::milestone.milestone') {
          if (uniqueOnce && createCalls === 1) {
            const err = new Error('duplicate key value violates unique constraint');
            err.code = '23505';
            throw err;
          }
          if (milestoneStore.some((r) => r.idempotencyKey === data.idempotencyKey)) {
            const err = new Error('duplicate key value violates unique constraint');
            err.code = '23505';
            throw err;
          }
          const row = { id: milestoneStore.length + 200, ...data };
          milestoneStore.push(row);
          return row;
        }
        if (uid === 'api::relationship-event.relationship-event') {
          if (eventStore.some((r) => r.idempotencyKey === data.idempotencyKey)) {
            const err = new Error('duplicate key value violates unique constraint');
            err.code = '23505';
            throw err;
          }
          const row = { id: eventStore.length + 1, ...data };
          eventStore.push(row);
          return row;
        }
        if (uid === 'api::moment.moment') {
          return { id: 1, ...data };
        }
        return { id: createCalls, ...data };
      },
      async update(uid, id, { data }) {
        const row = milestoneStore.find((r) => Number(r.id) === Number(id));
        if (!row) return null;
        Object.assign(row, data);
        return row;
      },
      async count() {
        return attendanceStore.filter((r) => r.suppressedDuplicate !== true).length;
      },
    },
  };
}

async function main() {
  const zero = mockStrapi({ attendances: [] });
  const none = await reconcileFanArtistMilestones(zero, { bandId: 2, fanId: 9 });
  assert.strictEqual(zero.milestoneStore.length, 0);
  assert.strictEqual(none.created, 0);

  const one = mockStrapi({ attendances: [nashville] });
  await reconcileFanArtistMilestones(one, { bandId: 2, fanId: 9 });
  assert.strictEqual(one.milestoneStore.filter((r) => r.status === 'active').length, 1);
  assert.strictEqual(one.milestoneStore[0].type, FIRST_SHOW);
  assert.strictEqual(one.milestoneStore[0].occurredAt, nashville.checkedInAt);

  await reconcileFanArtistMilestones(one, { bandId: 2, fanId: 9 });
  assert.strictEqual(one.milestoneStore.length, 1);

  const two = mockStrapi({ attendances: [nashville, knoxville] });
  await reconcileFanArtistMilestones(two, { bandId: 2, fanId: 9 });
  const types = two.milestoneStore.map((r) => r.type).sort();
  assert.deepStrictEqual(types, [FIRST_SHOW, SECOND_SHOW].sort());
  const secondRow = two.milestoneStore.find((r) => r.type === SECOND_SHOW);
  assert.strictEqual(secondRow.evidence.attendanceId, '11');
  assert.strictEqual(secondRow.occurredAt, knoxville.checkedInAt);

  const mixed = mockStrapi({ attendances: [knoxville, nashville] });
  await reconcileFanArtistMilestones(mixed, { bandId: 2, fanId: 9 });
  const mixedSecond = mixed.milestoneStore.find((r) => r.type === SECOND_SHOW);
  assert.strictEqual(mixedSecond.occurredAt, knoxville.checkedInAt);

  const fiveShows = mockStrapi({
    attendances: [
      nashville,
      knoxville,
      laterShow,
      { ...laterShow, id: 14, checkedInAt: '2026-04-01T00:00:00.000Z' },
      { ...laterShow, id: 15, checkedInAt: '2026-05-01T00:00:00.000Z' },
    ],
  });
  await reconcileFanArtistMilestones(fiveShows, { bandId: 2, fanId: 9 });
  assert.strictEqual(fiveShows.milestoneStore.filter((r) => r.type === SECOND_SHOW).length, 1);

  const correction = mockStrapi({ attendances: [nashville, knoxville] });
  await reconcileFanArtistMilestones(correction, { bandId: 2, fanId: 9 });
  let secondShow = correction.milestoneStore.find((r) => r.type === SECOND_SHOW);
  assert.strictEqual(secondShow.evidence.attendanceId, '11');
  nashville.suppressedDuplicate = true;
  correction.attendanceStore[0].suppressedDuplicate = true;
  await reconcileFanArtistMilestones(correction, { bandId: 2, fanId: 9 });
  secondShow = correction.milestoneStore.find((r) => r.type === SECOND_SHOW);
  assert.strictEqual(secondShow.status, 'archived');
  const firstAfter = correction.milestoneStore.find((r) => r.type === FIRST_SHOW);
  assert.strictEqual(firstAfter.evidence.attendanceId, '11');
  assert.strictEqual(firstAfter.status, 'active');

  nashville.suppressedDuplicate = false;
  const withC = mockStrapi({
    attendances: [
      { ...nashville, suppressedDuplicate: true },
      knoxville,
      laterShow,
    ],
  });
  withC.milestoneStore.push({
    id: 1,
    type: FIRST_SHOW,
    status: 'active',
    band: 2,
    subjectFan: 9,
    occurredAt: nashville.checkedInAt,
    value: 1,
    version: 1,
    evidence: { attendanceId: '10' },
    idempotencyKey: milestoneIdempotencyKey({ bandId: 2, subjectFanId: 9, type: FIRST_SHOW }),
  });
  withC.milestoneStore.push({
    id: 2,
    type: SECOND_SHOW,
    status: 'active',
    band: 2,
    subjectFan: 9,
    occurredAt: knoxville.checkedInAt,
    value: 2,
    version: 1,
    evidence: { attendanceId: '11', priorAttendanceId: '10', ordinal: 2 },
    idempotencyKey: milestoneIdempotencyKey({ bandId: 2, subjectFanId: 9, type: SECOND_SHOW }),
  });
  await reconcileFanArtistMilestones(withC, { bandId: 2, fanId: 9 });
  const firstBC = withC.milestoneStore.find((r) => r.type === FIRST_SHOW);
  const secondBC = withC.milestoneStore.find((r) => r.type === SECOND_SHOW);
  assert.strictEqual(firstBC.evidence.attendanceId, '11');
  assert.strictEqual(secondBC.evidence.attendanceId, '12');
  assert.strictEqual(secondBC.occurredAt, laterShow.checkedInAt);
  assert.strictEqual(secondBC.status, 'active');

  const replies = mockStrapi({
    attendances: [nashville],
    events: [
      { id: 70, type: 'artist_message_sent', occurredAt: '2025-11-01T00:00:00.000Z', band: 2, fan: 9 },
      { id: 71, type: 'fan_replied', occurredAt: '2025-11-20T00:00:00.000Z', band: 2, fan: 9 },
      { id: 72, type: 'fan_replied', occurredAt: '2025-12-01T00:00:00.000Z', band: 2, fan: 9 },
      { id: 80, type: 'fan_replied', occurredAt: '2025-10-01T00:00:00.000Z', band: 5, fan: 9 },
    ],
  });
  await reconcileFanArtistMilestones(replies, { bandId: 2, fanId: 9 });
  const replyRows = replies.milestoneStore.filter((r) => r.type === FIRST_REPLY);
  assert.strictEqual(replyRows.length, 1);
  assert.strictEqual(replyRows[0].evidence.relationshipEventId, '71');
  assert.strictEqual(replyRows[0].occurredAt, '2025-11-20T00:00:00.000Z');
  assert.ok(!JSON.stringify(replyRows[0]).includes('hey'));

  const otherBand = mockStrapi({
    events: [{ id: 80, type: 'fan_replied', occurredAt: '2025-10-01T00:00:00.000Z', band: 5, fan: 9 }],
  });
  await reconcileFanArtistMilestones(otherBand, { bandId: 2, fanId: 9 });
  assert.strictEqual(otherBand.milestoneStore.filter((r) => r.type === FIRST_REPLY).length, 0);

  const concurrent = {
    log: { info() {}, warn() {} },
    entityService: {
      finds: 0,
      async findMany(uid, params) {
        if (uid !== 'api::milestone.milestone') return [];
        this.finds += 1;
        if (this.finds === 1) return [];
        return [
          {
            id: 7,
            idempotencyKey: 'fan:2:9:fan_artist.first_show',
            type: FIRST_SHOW,
            status: 'active',
          },
        ];
      },
      async create() {
        const err = new Error('duplicate key value violates unique constraint');
        err.code = '23505';
        throw err;
      },
    },
  };
  const raced = await persistMilestone(concurrent, draft);
  assert.strictEqual(raced._duplicate, true);
  assert.strictEqual(raced.id, 7);

  const existingRow = {
    type: FIRST_SHOW,
    value: 1,
    occurredAt: nashville.checkedInAt,
    version: 1,
    evidence: { attendanceId: '10' },
    status: 'active',
  };
  assert.strictEqual(needsUpdate(existingRow, draft), false);
  assert.strictEqual(
    needsUpdate(existingRow, draftFromEvaluation({
      bandId: 2,
      subjectFanId: 9,
      evaluation: evaluateFirstShow([knoxville]),
    })),
    true
  );

  const rel = mockStrapi({ attendances: [nashville] });
  await produceShowAttendance(rel, nashville);
  assert.ok(rel.milestoneStore.some((r) => r.type === FIRST_SHOW));

  const msg = mockStrapi({
    events: [],
  });
  await produceMessageEvent(msg, {
    senderSide: 'fan',
    messageId: 501,
    conversationId: 8,
    bandId: 2,
    fanId: 9,
    occurredAt: '2025-11-20T00:00:00.000Z',
  });
  assert.ok(msg.eventStore.some((r) => r.type === 'fan_replied'));
  assert.ok(msg.milestoneStore.some((r) => r.type === FIRST_REPLY));
  assert.ok(!JSON.stringify(msg.milestoneStore).includes('body'));

  const artistOnly = mockStrapi();
  await produceMessageEvent(artistOnly, {
    senderSide: 'artist',
    messageId: 502,
    conversationId: 8,
    bandId: 2,
    fanId: 9,
    occurredAt: '2025-11-19T00:00:00.000Z',
  });
  assert.strictEqual(artistOnly.milestoneStore.filter((r) => r.type === FIRST_REPLY).length, 0);

  const broken = mockStrapi({ attendances: [nashville] });
  broken.entityService.create = async (uid, payload) => {
    if (uid === 'api::milestone.milestone') throw new Error('db down');
    return { id: 9, ...payload.data };
  };
  const failed = await reconcileFanArtistMilestonesSafe(broken, { bandId: 2, fanId: 9 });
  assert.ok(failed == null || failed.errors >= 0);

  assert.strictEqual(
    classifyDesired(null, first),
    'create'
  );
  assert.strictEqual(
    classifyDesired({ status: 'active', occurred_at: nashville.checkedInAt, evidence: { attendanceId: '10' } }, first),
    'existing'
  );
  assert.strictEqual(
    classifyDesired({ status: 'active', occurred_at: nashville.checkedInAt, evidence: { attendanceId: '10' } }, null),
    'archive'
  );
  assert.ok(emptyReport());

  console.log('test-milestones: ok');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
