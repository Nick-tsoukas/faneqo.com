'use strict';

const assert = require('assert');
const {
  normalizeFanEmail,
  sha256Hex,
  fanIdentityInput,
  buildFanCanonicalIdentityKey,
  buildCampaignAttendanceIdentityKey,
  buildEventAttendanceIdentityKey,
  attendanceIdentityKeys,
} = require('../src/utils/integrity/canonicalIdentityKeys');
const { isUniqueViolation, createFanIdempotent } = require('../src/utils/fans/fanEmail');
const {
  createAttendanceIdempotent,
  shouldIncrementCheckedInShowCount,
} = require('../src/utils/fans/canonicalAttendance');
const { identityIndexState } = require('../src/utils/integrity/fanAttendanceIntegrity');

const HEX64 = /^[a-f0-9]{64}$/;

assert.strictEqual(normalizeFanEmail('  Foo@Email.com '), 'foo@email.com');

const sameCaseA = buildFanCanonicalIdentityKey({ bandId: 123, email: 'User@Example.com' });
const sameCaseB = buildFanCanonicalIdentityKey({ bandId: 123, email: 'user@example.com' });
assert.strictEqual(sameCaseA, sameCaseB);
assert.match(sameCaseA, HEX64);

const sameSpaceA = buildFanCanonicalIdentityKey({ bandId: 123, email: '  user@example.com' });
const sameSpaceB = buildFanCanonicalIdentityKey({ bandId: 123, email: 'user@example.com  ' });
assert.strictEqual(sameSpaceA, sameSpaceB);

const otherBand = buildFanCanonicalIdentityKey({ bandId: 456, email: 'user@example.com' });
assert.notStrictEqual(sameCaseA, otherBand);

const expectedFan = sha256Hex('fan:v1:123:user@example.com');
assert.strictEqual(sameCaseA, expectedFan);
assert.ok(!sameCaseA.includes('user@example.com'));
assert.ok(!sameCaseA.includes('@'));
assert.strictEqual(fanIdentityInput({ bandId: 123, email: 'user@example.com' }).includes('user@example.com'), true);

const campaignSame = buildCampaignAttendanceIdentityKey({ fanId: 9, campaignId: 'night-1' });
const campaignSame2 = buildCampaignAttendanceIdentityKey({ fanId: 9, campaignId: 'night-1' });
assert.strictEqual(campaignSame, campaignSame2);
assert.match(campaignSame, HEX64);
assert.notStrictEqual(
  campaignSame,
  buildCampaignAttendanceIdentityKey({ fanId: 9, campaignId: 'night-2' })
);

const eventSame = buildEventAttendanceIdentityKey({ fanId: 9, eventId: 3 });
assert.strictEqual(eventSame, buildEventAttendanceIdentityKey({ fanId: 9, eventId: 3 }));
assert.notStrictEqual(eventSame, buildEventAttendanceIdentityKey({ fanId: 9, eventId: 4 }));

assert.strictEqual(buildCampaignAttendanceIdentityKey({ fanId: 9, campaignId: null }), null);
assert.strictEqual(buildEventAttendanceIdentityKey({ fanId: 9, eventId: null }), null);

const both = attendanceIdentityKeys({ fanId: 9, campaignId: 'night-1', eventId: 3 });
assert.strictEqual(both.campaignIdentityKey, campaignSame);
assert.strictEqual(both.eventIdentityKey, eventSame);

const neither = attendanceIdentityKeys({ fanId: 9, campaignId: null, eventId: null });
assert.strictEqual(neither.campaignIdentityKey, null);
assert.strictEqual(neither.eventIdentityKey, null);

const suppressed = attendanceIdentityKeys({
  fanId: 9,
  campaignId: 'night-1',
  eventId: 3,
  suppressedDuplicate: true,
});
assert.strictEqual(suppressed.campaignIdentityKey, null);
assert.strictEqual(suppressed.eventIdentityKey, null);

assert.strictEqual(shouldIncrementCheckedInShowCount(true, false), true);
assert.strictEqual(shouldIncrementCheckedInShowCount(false, false), false);
assert.strictEqual(shouldIncrementCheckedInShowCount(true, true), false);
assert.strictEqual(shouldIncrementCheckedInShowCount(false, true), false);

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
assert.strictEqual(
  identityIndexState({
    columnPresent: true,
    duplicateGroups: 2,
    missingKeys: 0,
    duplicateKeyGroups: 0,
    indexPresent: false,
  }),
  'BLOCKED'
);
assert.strictEqual(
  identityIndexState({
    columnPresent: true,
    duplicateGroups: 0,
    missingKeys: 4,
    duplicateKeyGroups: 0,
    indexPresent: false,
  }),
  'PENDING'
);
assert.strictEqual(identityIndexState({ columnPresent: false }), 'UNKNOWN');

assert.strictEqual(isUniqueViolation({ message: 'duplicate key fans_canonical_identity_key_unique' }), true);
assert.strictEqual(isUniqueViolation({ message: 'UNIQUE constraint failed: fans.canonical_identity_key' }), true);
assert.strictEqual(isUniqueViolation({ code: '57014', message: 'canceling statement due to statement timeout' }), false);

async function runAsync() {
  const fans = [{ id: 1, email: 'foo@x.com', band: 1, canonicalIdentityKey: sameCaseA }];
  let createdPayload = null;
  const strapi = {
    entityService: {
      async findMany(uid, params) {
        if (params.filters?.canonicalIdentityKey) {
          return fans.filter((f) => f.canonicalIdentityKey === params.filters.canonicalIdentityKey);
        }
        return fans;
      },
      async create(uid, { data }) {
        createdPayload = data;
        throw Object.assign(new Error('duplicate key value violates unique constraint'), { code: '23505' });
      },
    },
  };

  const raced = await createFanIdempotent(strapi, {
    bandId: 123,
    data: { email: 'User@Example.com', band: 123 },
  });
  assert.strictEqual(raced.created, false);
  assert.strictEqual(raced.fan.id, 1);
  assert.match(createdPayload.canonicalIdentityKey, HEX64);
  assert.ok(!createdPayload.canonicalIdentityKey.includes('User@Example.com'));
  assert.ok(!String(createdPayload.canonicalIdentityKey).includes('@'));

  const boom = {
    entityService: {
      async create() {
        throw Object.assign(new Error('canceling statement due to statement timeout'), { code: '57014' });
      },
    },
  };
  await assert.rejects(
    () => createFanIdempotent(boom, { bandId: 1, data: { email: 'a@b.com', band: 1 } }),
    (err) => err.code === '57014'
  );

  const attendanceStore = [];
  let createCalls = 0;
  const attStrapi = {
    entityService: {
      async create(uid, { data }) {
        createCalls += 1;
        assert.match(data.campaignIdentityKey, HEX64);
        assert.match(data.eventIdentityKey, HEX64);
        if (createCalls === 2) {
          throw Object.assign(new Error('duplicate key fan_show_attendances_campaign_identity_key_unique'), {
            code: '23505',
          });
        }
        const row = { id: 44, ...data };
        attendanceStore.push(row);
        return row;
      },
      async findMany(uid, params) {
        const key = params?.filters?.campaignIdentityKey || params?.filters?.eventIdentityKey;
        return attendanceStore.filter((r) => {
          if (r.suppressedDuplicate === true) return false;
          if (params?.filters?.campaignIdentityKey) return r.campaignIdentityKey === params.filters.campaignIdentityKey;
          if (params?.filters?.eventIdentityKey) return r.eventIdentityKey === params.filters.eventIdentityKey;
          return !key;
        });
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
  assert.strictEqual(attendanceStore.length, 1);
  assert.strictEqual(shouldIncrementCheckedInShowCount(second.created, false), false);

  const unknownAtt = {
    entityService: {
      async create() {
        throw Object.assign(new Error('deadlock detected'), { code: '40P01' });
      },
    },
  };
  await assert.rejects(
    () => createAttendanceIdempotent(unknownAtt, { fan: 9, campaignId: 'c1' }),
    (err) => err.code === '40P01'
  );

  const manual = await createAttendanceIdempotent(
    {
      entityService: {
        async create(uid, { data }) {
          assert.strictEqual(data.campaignIdentityKey, null);
          assert.strictEqual(data.eventIdentityKey, null);
          return { id: 1, ...data };
        },
      },
    },
    { fan: 9, campaignId: null, event: null, suppressedDuplicate: false }
  );
  assert.strictEqual(manual.created, true);
}

runAsync()
  .then(() => console.log('test-canonical-identity-keys: ok'))
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
