'use strict';

const assert = require('assert');
const {
  classifyFanDuplicateGroup,
  readiness,
  fanUniqueSql,
  campaignUniqueSql,
  eventUniqueSql,
  FAN_UNIQUE,
  ATT_CAMPAIGN_UNIQUE,
  ATT_EVENT_UNIQUE,
  FAN_IDENTITY_UNIQUE,
  FAN_MERGE_CHILD_REFS,
  fanIdentityUniqueSql,
  identityIndexState,
} = require('../src/utils/integrity/fanAttendanceIntegrity');
const { createAttendanceIdempotent, showStatsFromAttendances, shouldIncrementCheckedInShowCount } = require('../src/utils/fans/canonicalAttendance');
const { recordRelationshipEvent } = require('../src/utils/relationshipEvents/relationshipEventService');
const { produceShowAttendance } = require('../src/utils/relationshipEvents/relationshipEventProducers');

assert.strictEqual(
  classifyFanDuplicateGroup({ n: 2, distinctAccountUsers: 0, distinctStatuses: 1, distinctVisitors: 0 }),
  'SAFE'
);
assert.strictEqual(
  classifyFanDuplicateGroup({ n: 2, distinctAccountUsers: 2, distinctStatuses: 1, distinctVisitors: 0 }),
  'CONFLICTING'
);
assert.strictEqual(
  classifyFanDuplicateGroup({
    n: 2,
    distinctAccountUsers: 1,
    nullAccounts: 1,
    distinctStatuses: 1,
    distinctVisitors: 0,
  }),
  'UNKNOWN'
);
assert.strictEqual(
  classifyFanDuplicateGroup({ n: 2, distinctAccountUsers: 0, distinctStatuses: 2, distinctVisitors: 0 }),
  'UNKNOWN'
);
assert.strictEqual(
  classifyFanDuplicateGroup({
    n: 2,
    distinctAccountUsers: 0,
    distinctStatuses: 1,
    distinctVisitors: 0,
    attendanceSplit: true,
  }),
  'CONFLICTING'
);

assert.strictEqual(readiness({ skipped: true }, 'fan'), 'UNKNOWN');
assert.strictEqual(readiness({ skipped: false, groups: 0 }, 'fan'), 'CLEAN');
assert.strictEqual(readiness({ skipped: false, groups: 3 }, 'fan'), 'BLOCKED');
assert.strictEqual(readiness({ skipped: false, campaignGroups: 0 }, 'campaign'), 'CLEAN');
assert.strictEqual(readiness({ skipped: false, eventGroups: 2 }, 'event'), 'BLOCKED');

const pgFan = fanUniqueSql('postgres');
assert.match(pgFan, /lower\(btrim\(email\)\)/);
assert.match(pgFan, new RegExp(FAN_UNIQUE));
assert.match(campaignUniqueSql('postgres'), /IS NOT TRUE/);
assert.match(eventUniqueSql('postgres'), new RegExp(ATT_EVENT_UNIQUE));
assert.match(campaignUniqueSql('sqlite'), new RegExp(ATT_CAMPAIGN_UNIQUE));
assert.strictEqual(require('../src/utils/integrity/fanAttendanceIntegrity').canApplyFanUnique({ fanBand: 'links' }), false);
assert.strictEqual(require('../src/utils/integrity/fanAttendanceIntegrity').canApplyFanUnique({ fanBand: 'inline' }), true);
assert.match(fanIdentityUniqueSql(), new RegExp(FAN_IDENTITY_UNIQUE));
assert.match(fanIdentityUniqueSql(), /canonical_identity_key/);
assert.strictEqual(
  identityIndexState({
    columnPresent: true,
    duplicateGroups: 0,
    missingKeys: 0,
    duplicateKeyGroups: 0,
    indexPresent: true,
  }),
  'ACTIVE'
);
const { connectedIntegrityLabels } = require('../src/utils/integrity/fanAttendanceIntegrity');
assert.strictEqual(
  connectedIntegrityLabels({
    constraints: { fanUniqueness: 'CLEAN', campaignAttendance: 'CLEAN', eventAttendance: 'CLEAN' },
    coverage: { fanKeyCoveragePct: 100, campaignKeyCoveragePct: 100, eventKeyCoveragePct: 100 },
    identityIndexes: { fan: 'ACTIVE', campaign: 'ACTIVE', event: 'ACTIVE' },
  }).fanIdentity,
  'CLEAN / KEY COVERAGE 100% / UNIQUE INDEX ACTIVE'
);
assert.strictEqual(shouldIncrementCheckedInShowCount(false, false), false);

assert.ok(FAN_MERGE_CHILD_REFS.some((r) => r.table === 'fan_show_attendances'));
assert.ok(FAN_MERGE_CHILD_REFS.some((r) => r.table === 'relationship_events'));

async function runAsync() {
  const attendanceStore = [];
  let createCalls = 0;
  const attStrapi = {
    entityService: {
      async create(uid, { data }) {
        createCalls += 1;
        if (createCalls === 2) {
          throw Object.assign(new Error('duplicate key'), { code: '23505' });
        }
        const row = { id: 44, ...data };
        attendanceStore.push(row);
        return row;
      },
      async findMany() {
        return attendanceStore.filter((r) => r.suppressedDuplicate !== true);
      },
    },
  };

  const first = await createAttendanceIdempotent(attStrapi, {
    fan: 9,
    campaignId: 'c1',
    event: 3,
    suppressedDuplicate: false,
  });
  const second = await createAttendanceIdempotent(attStrapi, {
    fan: 9,
    campaignId: 'c1',
    event: 3,
    suppressedDuplicate: false,
  });
  assert.strictEqual(first.created, true);
  assert.strictEqual(second.created, false);
  assert.strictEqual(second.attendance.id, 44);
  assert.strictEqual(createCalls, 2);
  assert.ok(first.attendance.campaignIdentityKey);
  assert.ok(first.attendance.eventIdentityKey);
  assert.strictEqual(shouldIncrementCheckedInShowCount(second.created, false), false);

  const sameFanDifferentCampaign = showStatsFromAttendances([
    { id: 1, checkedInAt: '2026-01-01', campaignId: 'a', suppressedDuplicate: false },
    { id: 2, checkedInAt: '2026-02-01', campaignId: 'b', suppressedDuplicate: false },
  ]);
  assert.strictEqual(sameFanDifferentCampaign.showCount, 2);
  assert.strictEqual(sameFanDifferentCampaign.returningFan, true);

  const sarahNashville = showStatsFromAttendances([
    { id: 1, checkedInAt: '2026-08-01', campaignId: 'nashville', event: 11, suppressedDuplicate: false },
  ]);
  assert.strictEqual(sarahNashville.showCount, 1);
  assert.strictEqual(sarahNashville.returningFan, false);

  const sarahKnoxville = showStatsFromAttendances([
    { id: 1, checkedInAt: '2026-08-01', campaignId: 'nashville', event: 11, suppressedDuplicate: false },
    { id: 2, checkedInAt: '2026-08-10', campaignId: 'knoxville', event: 12, suppressedDuplicate: false },
  ]);
  assert.strictEqual(sarahKnoxville.showCount, 2);
  assert.strictEqual(sarahKnoxville.returningFan, true);

  const nullCampaign = showStatsFromAttendances([
    { id: 1, checkedInAt: '2026-01-01', campaignId: null, event: null, suppressedDuplicate: false },
  ]);
  assert.strictEqual(nullCampaign.showCount, 1);

  const ledger = [];
  const relStrapi = {
    log: { info() {}, warn() {} },
    entityService: {
      async findMany(uid, params) {
        if (uid === 'api::relationship-event.relationship-event') {
          const key = params?.filters?.idempotencyKey;
          if (key) return ledger.filter((r) => r.idempotencyKey === key);
        }
        return [];
      },
      async create(uid, { data }) {
        if (ledger.some((r) => r.idempotencyKey === data.idempotencyKey)) {
          throw Object.assign(new Error('duplicate key'), { code: '23505' });
        }
        const row = { id: ledger.length + 1, ...data };
        ledger.push(row);
        return row;
      },
      async count() {
        return 1;
      },
    },
  };

  const attendance = {
    id: 44,
    fan: 9,
    band: 2,
    campaignId: 'c1',
    event: 3,
    checkedInAt: '2026-08-01T00:00:00.000Z',
  };
  await produceShowAttendance(relStrapi, attendance);
  await produceShowAttendance(relStrapi, attendance);
  const checked = ledger.filter((r) => r.type === 'show_checked_in');
  assert.strictEqual(checked.length, 1, 'RelationshipEvent remains idempotent after duplicate canonical request');

  await recordRelationshipEvent(relStrapi, {
    type: 'show_checked_in',
    bandId: 2,
    fanId: 9,
    occurredAt: attendance.checkedInAt,
    sourceType: 'fan_show_attendance',
    sourceId: '44',
    idempotencyKey: 'show_checked_in:44',
  });
  assert.strictEqual(ledger.filter((r) => r.type === 'show_checked_in').length, 1);
}

runAsync()
  .then(() => console.log('test-fan-attendance-integrity: ok'))
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
