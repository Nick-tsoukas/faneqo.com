'use strict';

const assert = require('assert');
const {
  normalizeEmail,
  hashEmailKey,
  isUniqueViolation,
  findFanByBandEmail,
  createFanIdempotent,
} = require('../src/utils/fans/fanEmail');
const {
  isCanonicalAttendance,
  showStatsFromAttendances,
} = require('../src/utils/fans/canonicalAttendance');
const { fanCountBucket, isSubscribedFan } = require('../src/utils/fans/canonicalCounts');

assert.strictEqual(normalizeEmail('  Foo@Email.com '), 'foo@email.com');
assert.strictEqual(normalizeEmail(''), null);
assert.strictEqual(normalizeEmail(null), null);
assert.ok(hashEmailKey('foo@email.com'));
assert.ok(!String(hashEmailKey('foo@email.com')).includes('@'));

assert.strictEqual(isUniqueViolation({ code: '23505' }), true);
assert.strictEqual(isUniqueViolation({ code: 'SQLITE_CONSTRAINT', message: 'UNIQUE constraint failed' }), true);
assert.strictEqual(isUniqueViolation({ message: 'something else' }), false);

assert.strictEqual(isCanonicalAttendance({ suppressedDuplicate: false }), true);
assert.strictEqual(isCanonicalAttendance({ suppressedDuplicate: null }), true);
assert.strictEqual(isCanonicalAttendance({ suppressedDuplicate: true }), false);

const stats = showStatsFromAttendances([
  { id: 2, checkedInAt: '2026-08-02', suppressedDuplicate: false },
  { id: 1, checkedInAt: '2026-08-01', suppressedDuplicate: true },
  { id: 3, checkedInAt: '2026-08-03', suppressedDuplicate: false },
]);
assert.strictEqual(stats.showCount, 2);
assert.strictEqual(stats.firstShow.id, 2);
assert.strictEqual(stats.latestShow.id, 3);
assert.strictEqual(stats.returningFan, true);

const suppressedOnly = showStatsFromAttendances([
  { id: 9, checkedInAt: '2026-08-01', suppressedDuplicate: true },
]);
assert.strictEqual(suppressedOnly.showCount, 0);
assert.strictEqual(suppressedOnly.returningFan, false);

assert.strictEqual(isSubscribedFan({ status: 'subscribed' }), true);
assert.strictEqual(fanCountBucket({ status: 'subscribed' }), 'subscribed');
assert.strictEqual(fanCountBucket({ status: 'unsubscribed' }), 'unsubscribed');
assert.strictEqual(fanCountBucket({ status: 'removed' }), 'removed');
assert.strictEqual(fanCountBucket({ status: 'subscribed', suppressionReason: 'bounced' }), 'suppressed');

async function runAsync() {
  const fans = [
    { id: 2, email: 'Foo@x.com', band: 1 },
    { id: 1, email: 'foo@x.com', band: 1 },
  ];
  const strapi = {
    entityService: {
      async findMany(uid, params) {
        assert.strictEqual(uid, 'api::fan.fan');
        if (params.filters?.canonicalIdentityKey) return [];
        assert.strictEqual(params.filters.email.$eqi, 'foo@x.com');
        return fans;
      },
      async create() {
        throw Object.assign(new Error('duplicate'), { code: '23505' });
      },
    },
  };
  const found = await findFanByBandEmail(strapi, 1, 'FOO@x.com');
  assert.strictEqual(found.id, 1, 'oldest row wins');

  const raced = await createFanIdempotent(strapi, { bandId: 1, data: { email: 'FOO@x.com', band: 1 } });
  assert.strictEqual(raced.created, false);
  assert.strictEqual(raced.fan.id, 1);

  const otherBand = {
    entityService: {
      async findMany() {
        return [];
      },
    },
  };
  const missing = await findFanByBandEmail(otherBand, 99, 'foo@x.com');
  assert.strictEqual(missing, null);

  const boom = {
    entityService: {
      async create() {
        throw Object.assign(new Error('deadlock detected'), { code: '40P01' });
      },
    },
  };
  await assert.rejects(
    () => createFanIdempotent(boom, { bandId: 1, data: { email: 'a@b.com', band: 1 } }),
    (err) => err.code === '40P01'
  );
}

runAsync()
  .then(() => console.log('test-fan-email-normalization: ok'))
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
