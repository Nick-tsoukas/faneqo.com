'use strict';

const assert = require('assert');
const {
  SHOW_SOURCE_TYPE,
  showMomentIdempotencyKey,
  assertKind,
  assertVisibility,
} = require('../src/utils/moments/momentKeys');
const {
  attendanceEligibleForShowMoment,
  showMomentDraftFromAttendance,
  canViewMoment,
  sortMomentsChronologically,
  momentMatchesSuppressedAttendance,
} = require('../src/utils/moments/momentPure');
const { persistMoment } = require('../src/utils/moments/momentService');
const {
  ensureShowMomentForAttendance,
  ensureShowMomentForAttendanceSafe,
  archiveShowMomentForAttendance,
} = require('../src/utils/moments/showMomentProducer');
const { classifyRow, emptyReport } = require('../src/utils/moments/showMomentBackfill');
const { produceShowAttendance } = require('../src/utils/relationshipEvents/relationshipEventProducers');

assert.strictEqual(showMomentIdempotencyKey(44), 'show:fan_show_attendance:44');
assert.strictEqual(SHOW_SOURCE_TYPE, 'fan_show_attendance');
assert.throws(() => assertKind('not_a_kind'));
assert.ok(assertVisibility('artist_fan'));

const eventShow = {
  id: 10,
  fan: 9,
  band: 2,
  event: 11,
  campaignId: null,
  checkedInAt: '2025-11-02T02:00:00.000Z',
  city: 'Nashville',
  suppressedDuplicate: false,
};
const manualShow = {
  id: 11,
  fan: 9,
  band: 2,
  event: null,
  campaignId: 'sm_knoxville',
  checkedInAt: '2026-01-15T03:00:00.000Z',
  city: 'Knoxville',
  suppressedDuplicate: false,
};
const suppressed = {
  ...eventShow,
  id: 12,
  suppressedDuplicate: true,
};

assert.strictEqual(attendanceEligibleForShowMoment(eventShow), true);
assert.strictEqual(attendanceEligibleForShowMoment(manualShow), true);
assert.strictEqual(attendanceEligibleForShowMoment(suppressed), false);
assert.strictEqual(attendanceEligibleForShowMoment({ id: 1, fan: 9, suppressedDuplicate: false }), false);

const eventDraft = showMomentDraftFromAttendance(eventShow);
assert.strictEqual(eventDraft.kind, 'show');
assert.strictEqual(eventDraft.status, 'candidate');
assert.strictEqual(eventDraft.visibility, 'artist_fan');
assert.strictEqual(eventDraft.shareable, false);
assert.strictEqual(eventDraft.sourceType, 'fan_show_attendance');
assert.strictEqual(eventDraft.sourceId, '10');
assert.strictEqual(eventDraft.idempotencyKey, 'show:fan_show_attendance:10');
assert.strictEqual(eventDraft.occurredAt, eventShow.checkedInAt);
assert.ok(!eventDraft.title);
assert.ok(!eventDraft.media);

const manualDraft = showMomentDraftFromAttendance(manualShow);
assert.strictEqual(manualDraft.kind, 'show');
assert.strictEqual(manualDraft.sourceId, '11');
assert.notStrictEqual(manualDraft.idempotencyKey, eventDraft.idempotencyKey);

assert.strictEqual(
  canViewMoment({
    moment: { ...eventDraft, id: 1, status: 'candidate', band: 2, subjectFan: 9 },
    viewer: { bandId: 2, bandRole: 'owner', isSubjectFan: false },
  }),
  true
);
assert.strictEqual(
  canViewMoment({
    moment: { ...eventDraft, id: 1, status: 'candidate', band: 2, subjectFan: 9 },
    viewer: { bandId: 3, bandRole: 'owner', isSubjectFan: false },
  }),
  false
);
assert.strictEqual(
  canViewMoment({
    moment: { ...eventDraft, id: 1, status: 'candidate', band: 2, subjectFan: 9 },
    viewer: { bandId: 2, bandRole: null, isSubjectFan: false, subjectFanId: 9 },
  }),
  true
);
assert.strictEqual(
  canViewMoment({
    moment: { ...eventDraft, id: 1, status: 'candidate', band: 2, subjectFan: 9 },
    viewer: { bandId: 2, bandRole: null, isSubjectFan: false, subjectFanId: 99 },
  }),
  false
);
assert.strictEqual(
  canViewMoment({
    moment: { ...eventDraft, id: 1, status: 'archived', band: 2, subjectFan: 9 },
    viewer: { bandId: 2, bandRole: 'owner' },
  }),
  false
);
assert.strictEqual(
  canViewMoment({
    moment: { ...eventDraft, id: 1, status: 'candidate', band: 2, subjectFan: 9 },
    viewer: { bandId: 2 },
  }),
  false
);

const sorted = sortMomentsChronologically([
  { id: 2, occurredAt: '2026-01-15T03:00:00.000Z' },
  { id: 1, occurredAt: '2025-11-02T02:00:00.000Z' },
  { id: 3, occurredAt: '2025-11-02T02:00:00.000Z' },
]);
assert.deepStrictEqual(sorted.map((r) => r.id), [1, 3, 2]);

assert.strictEqual(momentMatchesSuppressedAttendance(eventDraft, suppressed), false);
assert.strictEqual(
  momentMatchesSuppressedAttendance({ sourceType: SHOW_SOURCE_TYPE, sourceId: '12' }, suppressed),
  true
);

function mockStrapi({ uniqueOnce = false, moments = [], attendances = [] } = {}) {
  const momentStore = [...moments];
  const attendanceStore = [...attendances];
  const eventStore = [];
  let createCalls = 0;
  return {
    log: { info() {}, warn() {} },
    momentStore,
    eventStore,
    entityService: {
      async findMany(uid, params) {
        if (uid === 'api::moment.moment') {
          const key = params?.filters?.idempotencyKey;
          if (key) return momentStore.filter((r) => r.idempotencyKey === key);
          const sourceType = params?.filters?.sourceType;
          const sourceId = params?.filters?.sourceId;
          if (sourceType) {
            return momentStore.filter(
              (r) => r.sourceType === sourceType && String(r.sourceId) === String(sourceId)
            );
          }
          return momentStore;
        }
        if (uid === 'api::relationship-event.relationship-event') {
          const key = params?.filters?.idempotencyKey;
          if (key) return eventStore.filter((r) => r.idempotencyKey === key);
          return eventStore;
        }
        if (uid === 'api::fan-show-attendance.fan-show-attendance') {
          const ids = params?.filters?.id?.$in;
          if (ids) return attendanceStore.filter((r) => ids.includes(r.id));
          return attendanceStore;
        }
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
        if (uid === 'api::moment.moment') {
          if (uniqueOnce && createCalls === 1) {
            const err = new Error('duplicate key value violates unique constraint');
            err.code = '23505';
            throw err;
          }
          if (momentStore.some((r) => r.idempotencyKey === data.idempotencyKey)) {
            const err = new Error('duplicate key value violates unique constraint');
            err.code = '23505';
            throw err;
          }
          const row = { id: momentStore.length + 100, ...data };
          momentStore.push(row);
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
        const row = { id: createCalls, ...data };
        return row;
      },
      async update(uid, id, { data }) {
        if (uid === 'api::milestone.milestone') {
          return { id, ...data };
        }
        const row = momentStore.find((r) => Number(r.id) === Number(id));
        if (!row) return null;
        Object.assign(row, data);
        return row;
      },
      async count() {
        return attendanceStore.filter((r) => r.suppressedDuplicate !== true).length;
      },
    },
    createCalls: () => createCalls,
  };
}

async function main() {
  const s = mockStrapi();
  const first = await ensureShowMomentForAttendance(s, eventShow);
  assert.strictEqual(first._duplicate, false);
  assert.strictEqual(first.kind, 'show');
  assert.strictEqual(first.status, 'candidate');
  assert.strictEqual(first.occurredAt, '2025-11-02T02:00:00.000Z');
  assert.strictEqual(first.subjectFan, 9);

  const again = await ensureShowMomentForAttendance(s, eventShow);
  assert.strictEqual(again._duplicate, true);
  assert.strictEqual(s.momentStore.length, 1);

  const concurrent = {
    log: { info() {}, warn() {} },
    entityService: {
      finds: 0,
      async findMany(uid, params) {
        if (uid !== 'api::moment.moment') return [];
        this.finds += 1;
        if (this.finds === 1) return [];
        return [{ id: 7, idempotencyKey: 'show:fan_show_attendance:10', kind: 'show', status: 'candidate' }];
      },
      async create() {
        const err = new Error('duplicate key value violates unique constraint');
        err.code = '23505';
        throw err;
      },
    },
  };
  const raced = await persistMoment(concurrent, showMomentDraftFromAttendance(eventShow));
  assert.strictEqual(raced._duplicate, true);
  assert.strictEqual(raced.id, 7);

  const two = mockStrapi();
  await ensureShowMomentForAttendance(two, eventShow);
  await ensureShowMomentForAttendance(two, manualShow);
  assert.strictEqual(two.momentStore.length, 2);
  assert.strictEqual(two.momentStore[0].sourceId, '10');
  assert.strictEqual(two.momentStore[1].sourceId, '11');

  const sameNight = mockStrapi();
  await ensureShowMomentForAttendance(sameNight, { ...eventShow, campaignId: 'sm_nash' });
  await ensureShowMomentForAttendance(sameNight, { ...eventShow, campaignId: 'sm_nash' });
  assert.strictEqual(sameNight.momentStore.length, 1, 'same canonical attendance is one Moment');

  const skip = mockStrapi();
  const none = await ensureShowMomentForAttendance(skip, suppressed);
  assert.strictEqual(none, null);
  assert.strictEqual(skip.momentStore.length, 0);

  const repair = mockStrapi({
    moments: [
      {
        id: 8,
        idempotencyKey: 'show:fan_show_attendance:12',
        status: 'candidate',
        sourceType: SHOW_SOURCE_TYPE,
        sourceId: '12',
      },
    ],
  });
  const archived = await archiveShowMomentForAttendance(repair, suppressed);
  assert.strictEqual(archived.status, 'archived');
  assert.ok(archived.archivedAt);

  const safe = mockStrapi();
  safe.entityService.create = async () => {
    throw new Error('db down');
  };
  const failed = await ensureShowMomentForAttendanceSafe(safe, eventShow);
  assert.strictEqual(failed, null);

  const rel = mockStrapi();
  await produceShowAttendance(rel, eventShow);
  assert.ok(rel.eventStore.some((r) => r.type === 'show_checked_in'));
  assert.ok(rel.momentStore.some((r) => r.kind === 'show'));

  const existing = new Set(['show:fan_show_attendance:10']);
  assert.strictEqual(classifyRow({ id: 10, fan_id: 9, band_id: 2, checked_in_at: 'x' }, existing).action, 'existing');
  assert.strictEqual(
    classifyRow({ id: 11, fan_id: 9, band_id: 2, checked_in_at: 'x', suppressed_duplicate: true }, existing).action,
    'suppressed'
  );
  assert.strictEqual(
    classifyRow({ id: 13, fan_id: 9, band_id: 2, checked_in_at: 'x' }, existing).action,
    'create'
  );
  assert.ok(emptyReport());

  console.log('test-show-moments: ok');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
