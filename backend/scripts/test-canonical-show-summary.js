'use strict';

const assert = require('assert');
const {
  emptyShowSummary,
  summaryFromStats,
  overlayFanShowSummary,
  getCanonicalFanShowSummaries,
  getCanonicalFanShowSummary,
} = require('../src/utils/fans/canonicalShowSummary');
const { showStatsFromAttendances } = require('../src/utils/fans/canonicalAttendance');

const nashville = {
  id: 1,
  fan: 9,
  checkedInAt: '2026-08-01T02:00:00.000Z',
  campaignId: 'nashville',
  event: 11,
  suppressedDuplicate: false,
};
const knoxville = {
  id: 2,
  fan: 9,
  checkedInAt: '2026-08-10T02:00:00.000Z',
  campaignId: 'knoxville',
  event: 12,
  suppressedDuplicate: false,
};

const afterNashville = summaryFromStats(showStatsFromAttendances([nashville]));
assert.strictEqual(afterNashville.showCount, 1);
assert.strictEqual(afterNashville.returning, false);
assert.strictEqual(afterNashville.firstShowAt, nashville.checkedInAt);
assert.strictEqual(afterNashville.latestShowAt, nashville.checkedInAt);

const afterKnoxville = summaryFromStats(showStatsFromAttendances([nashville, knoxville]));
assert.strictEqual(afterKnoxville.showCount, 2);
assert.strictEqual(afterKnoxville.returning, true);
assert.strictEqual(afterKnoxville.firstShowAt, nashville.checkedInAt);
assert.strictEqual(afterKnoxville.latestShowAt, knoxville.checkedInAt);

const bothKeysOneRow = summaryFromStats(
  showStatsFromAttendances([{ ...nashville, campaignId: 'c', event: 3 }])
);
assert.strictEqual(bothKeysOneRow.showCount, 1, 'campaign+event on one row is still one show');

const suppressedIgnored = summaryFromStats(
  showStatsFromAttendances([nashville, { ...knoxville, suppressedDuplicate: true }])
);
assert.strictEqual(suppressedIgnored.showCount, 1);
assert.strictEqual(suppressedIgnored.returning, false);

const overlay = overlayFanShowSummary({ id: 9, checkedInShowCount: 99 }, afterKnoxville);
assert.strictEqual(overlay.showCount, 2);
assert.strictEqual(overlay.checkedInShowCount, 2, 'cache overlay must match canonical');
assert.strictEqual(overlay.returning, true);

assert.deepStrictEqual(emptyShowSummary(), {
  showCount: 0,
  firstShowAt: null,
  latestShowAt: null,
  returning: false,
});

async function runAsync() {
  const rows = [nashville, knoxville];
  const strapi = {
    entityService: {
      async findOne() {
        return { id: 9, band: { id: 2 } };
      },
      async findMany() {
        return rows.map((row) => ({ ...row, fan: { id: row.fan } }));
      },
    },
  };

  const bulk = await getCanonicalFanShowSummaries(strapi, { fanIds: [9, 8] });
  assert.strictEqual(bulk[9].showCount, 2);
  assert.strictEqual(bulk[9].returning, true);
  assert.strictEqual(bulk[8].showCount, 0);
  assert.strictEqual(bulk[8].returning, false);

  const one = await getCanonicalFanShowSummary(strapi, { bandId: 2, fanId: 9 });
  assert.strictEqual(one.showCount, 2);

  const wrongBand = {
    entityService: {
      async findOne() {
        return { id: 9, band: { id: 99 } };
      },
    },
  };
  const denied = await getCanonicalFanShowSummary(wrongBand, { bandId: 2, fanId: 9 });
  assert.strictEqual(denied.showCount, 0);

  const { countCanonicalReturningFans } = require('../src/utils/fans/canonicalShowSummary');
  const returningStrapi = {
    entityService: {
      async findMany() {
        return [
          { ...nashville, fan: { id: 9, status: 'subscribed' } },
          { ...knoxville, fan: { id: 9, status: 'subscribed' } },
          {
            id: 3,
            fan: { id: 10, status: 'subscribed' },
            checkedInAt: '2026-08-01T02:00:00.000Z',
            suppressedDuplicate: false,
          },
          {
            id: 4,
            fan: { id: 11, status: 'removed' },
            checkedInAt: '2026-08-01T02:00:00.000Z',
            suppressedDuplicate: false,
          },
          {
            id: 5,
            fan: { id: 11, status: 'removed' },
            checkedInAt: '2026-08-10T02:00:00.000Z',
            suppressedDuplicate: false,
          },
        ];
      },
    },
  };
  const returning = await countCanonicalReturningFans(returningStrapi, { bandId: 2, subscribedOnly: true });
  assert.strictEqual(returning, 1, 'only subscribed fans with 2+ canonical shows');
}

runAsync()
  .then(() => {
    console.log('canonical show summary tests passed');
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
