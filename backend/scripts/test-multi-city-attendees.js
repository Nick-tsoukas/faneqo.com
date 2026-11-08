'use strict';

/**
 * multiCityAttendeeCount is derived from canonical attendance cities.
 * Run: node scripts/test-multi-city-attendees.js
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const {
  countMultiCityAttendees,
  countBandMultiCityAttendees,
  canonicalAttendanceFilters,
} = require('../src/utils/fans/canonicalAttendance');

function row({ fan, city, suppressedDuplicate = false, id = 1 }) {
  return { id, fan, city, suppressedDuplicate };
}

// Fan A: same city twice → not multi-city
const fanA = [
  row({ id: 1, fan: { id: 10 }, city: 'Nashville' }),
  row({ id: 2, fan: { id: 10 }, city: 'Nashville' }),
];
assert.strictEqual(countMultiCityAttendees(fanA), 0);

// Fan B: two cities → multi-city
const fanB = [
  row({ id: 3, fan: { id: 20 }, city: 'Nashville' }),
  row({ id: 4, fan: { id: 20 }, city: 'Atlanta' }),
];
assert.strictEqual(countMultiCityAttendees(fanB), 1);

// Fan C: second city suppressed → not multi-city
const fanC = [
  row({ id: 5, fan: { id: 30 }, city: 'Nashville' }),
  row({ id: 6, fan: { id: 30 }, city: 'Atlanta', suppressedDuplicate: true }),
];
assert.strictEqual(countMultiCityAttendees(fanC), 0);

// Fan D: three legitimate cities → multi-city
const fanD = [
  row({ id: 7, fan: { id: 40 }, city: 'Nashville' }),
  row({ id: 8, fan: { id: 40 }, city: 'Atlanta' }),
  row({ id: 9, fan: { id: 40 }, city: 'Chicago' }),
];
assert.strictEqual(countMultiCityAttendees(fanD), 1);

assert.strictEqual(
  countMultiCityAttendees([...fanA, ...fanB, ...fanC, ...fanD]),
  2,
  'B + D only'
);

assert.strictEqual(countMultiCityAttendees([]), 0);
assert.strictEqual(countMultiCityAttendees(null), 0);
assert.strictEqual(
  countMultiCityAttendees([row({ fan: { id: 50 }, city: '  ' }), row({ fan: { id: 50 }, city: 'Nashville' })]),
  0,
  'whitespace city is empty'
);

async function runQueryContract() {
  const calls = [];
  const strapi = {
    entityService: {
      async findMany(uid, params) {
        calls.push({ uid, params });
        return [...fanA, ...fanB, ...fanC, ...fanD];
      },
    },
  };

  const empty = await countBandMultiCityAttendees(strapi, { bandId: 0 });
  assert.strictEqual(empty, 0);
  assert.strictEqual(calls.length, 0, 'invalid bandId must not query');

  const n = await countBandMultiCityAttendees(strapi, { bandId: 2 });
  assert.strictEqual(n, 2);
  assert.strictEqual(calls.length, 1);
  assert.strictEqual(calls[0].uid, 'api::fan-show-attendance.fan-show-attendance');
  assert.deepStrictEqual(calls[0].params.filters, canonicalAttendanceFilters({ band: 2 }));
  assert.deepStrictEqual(calls[0].params.fields, ['id', 'city', 'suppressedDuplicate']);
  assert.deepStrictEqual(calls[0].params.populate, { fan: { fields: ['id'] } });
  assert.ok(!calls[0].params.fields.includes('fan'), 'fan is a relation, not a scalar field');
  assert.ok(!calls[0].params.fields.includes('band'), 'band is a relation, not a scalar field');
}

function runSourceContract() {
  const serviceSrc = fs.readFileSync(path.join(__dirname, '../src/api/fan/services/fan.js'), 'utf8');
  const start = serviceSrc.indexOf('async getMyFansAnalytics(');
  const next = serviceSrc.indexOf('\n  async ', start + 10);
  const analytics = serviceSrc.slice(start, next === -1 ? serviceSrc.length : next);
  assert.match(analytics, /countBandMultiCityAttendees/);
  assert.doesNotMatch(analytics, /COUNT\(DISTINCT fan\)/);
  assert.doesNotMatch(analytics, /WHERE band = \?/);
  assert.doesNotMatch(analytics, /\.catch\(\(\) => \(\{ rows: \[\] \}\)\)/);
}

async function main() {
  await runQueryContract();
  runSourceContract();
  console.log('test-multi-city-attendees: ok');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
