'use strict';

const assert = require('assert');
const {
  joinedAtFromFan,
  displayNameFromFan,
  communicationFactsFromEvents,
  emptyCommunicationFacts,
  canViewMoment,
} = require('../src/utils/moments/momentPure');
const { getArtistFanProgression } = require('../src/utils/moments/artistFanProgression');
const { summaryFromStats } = require('../src/utils/fans/canonicalShowSummary');
const { showStatsFromAttendances } = require('../src/utils/fans/canonicalAttendance');

assert.strictEqual(
  joinedAtFromFan({ subscribedAt: '2026-01-10T00:00:00.000Z', createdAt: '2026-01-11T00:00:00.000Z' }),
  '2026-01-10T00:00:00.000Z'
);
assert.strictEqual(joinedAtFromFan({ createdAt: '2026-01-11T00:00:00.000Z' }), '2026-01-11T00:00:00.000Z');
assert.strictEqual(joinedAtFromFan({}), null);
assert.strictEqual(displayNameFromFan({ firstName: 'Sarah', lastName: 'Lane' }), 'Sarah Lane');
assert.strictEqual(displayNameFromFan({ email: 'sarah@example.com' }), null);

const comm = communicationFactsFromEvents([
  { type: 'artist_message_sent', occurredAt: '2026-02-01T00:00:00.000Z' },
  { type: 'fan_replied', occurredAt: '2026-02-02T00:00:00.000Z' },
  { type: 'artist_message_sent', occurredAt: '2026-02-03T00:00:00.000Z' },
]);
assert.strictEqual(comm.artistMessagesSent, 2);
assert.strictEqual(comm.fanReplies, 1);
assert.strictEqual(comm.lastReplyAt, '2026-02-02T00:00:00.000Z');
assert.strictEqual(comm.lastArtistMessageAt, '2026-02-03T00:00:00.000Z');
assert.deepStrictEqual(emptyCommunicationFacts().fanReplies, 0);

const nashville = {
  id: 1,
  fan: { id: 9 },
  band: { id: 2 },
  checkedInAt: '2025-11-02T02:00:00.000Z',
  campaignId: null,
  event: { id: 11, title: 'Nashville', city: 'Nashville', venue: 'The Basement', date: '2025-11-01' },
  city: 'Nashville',
  venue: 'The Basement',
  suppressedDuplicate: false,
};
const knoxville = {
  id: 2,
  fan: { id: 9 },
  band: { id: 2 },
  checkedInAt: '2026-01-15T03:00:00.000Z',
  campaignId: 'sm_knox',
  event: null,
  city: 'Knoxville',
  suppressedDuplicate: false,
};

function showsFrom(rows) {
  return summaryFromStats(showStatsFromAttendances(rows));
}

assert.strictEqual(showsFrom([]).showCount, 0);
assert.strictEqual(showsFrom([]).returning, false);
assert.strictEqual(showsFrom([nashville]).showCount, 1);
assert.strictEqual(showsFrom([nashville]).returning, false);
assert.strictEqual(showsFrom([nashville, knoxville]).showCount, 2);
assert.strictEqual(showsFrom([nashville, knoxville]).returning, true);
assert.strictEqual(showsFrom([nashville, knoxville, nashville, knoxville, nashville]).showCount, 5);

function mockStrapi({
  role = 'owner',
  fanBandId = 2,
  attendances = [],
  moments = [],
  milestones = [],
  events = [],
  otherFan = null,
} = {}) {
  const fan = {
    id: 9,
    email: 'sarah@example.com',
    firstName: 'Sarah',
    lastName: null,
    status: 'subscribed',
    subscribedAt: '2025-06-01T00:00:00.000Z',
    createdAt: '2025-06-01T00:00:00.000Z',
    band: { id: fanBandId, name: 'Badflower', slug: 'badflower' },
    accountUser: { id: 44 },
  };
  return {
    log: { info() {}, warn() {} },
    entityService: {
      async findMany(uid, params) {
        if (uid === 'api::band-member.band-member') {
          if (!role) return [];
          const band = params?.filters?.band;
          const user = params?.filters?.user;
          if (Number(band) !== 2 || Number(user) !== 7) return [];
          return [{ id: 1, role, status: 'active' }];
        }
        if (uid === 'api::fan-show-attendance.fan-show-attendance') {
          let rows = attendances;
          const ids = params?.filters?.id?.$in;
          if (ids) rows = rows.filter((row) => ids.includes(row.id));
          const fanFilter = params?.filters?.fan;
          if (fanFilter) {
            const fanId = fanFilter?.id?.$in?.[0] || fanFilter;
            rows = rows.filter((row) => Number(row.fan?.id || row.fan) === Number(fanId));
          }
          if (params?.filters?.$or) {
            rows = rows.filter((row) => row.suppressedDuplicate !== true);
          }
          return rows;
        }
        if (uid === 'api::moment.moment') {
          return moments.filter((row) => {
            if (params?.filters?.status?.$ne && row.status === params.filters.status.$ne) return false;
            if (params?.filters?.band && Number(row.band) !== Number(params.filters.band)) return false;
            if (params?.filters?.subjectFan && Number(row.subjectFan) !== Number(params.filters.subjectFan)) {
              return false;
            }
            return true;
          });
        }
        if (uid === 'api::relationship-event.relationship-event') {
          return events.filter((row) => Number(row.fan) === 9 && Number(row.band) === 2);
        }
        if (uid === 'api::milestone.milestone') {
          return (milestones || []).filter((row) => {
            if (params?.filters?.status?.$ne && row.status === params.filters.status.$ne) return false;
            if (params?.filters?.band && Number(row.band) !== Number(params.filters.band)) return false;
            if (params?.filters?.subjectFan && Number(row.subjectFan) !== Number(params.filters.subjectFan)) {
              return false;
            }
            return true;
          });
        }
        if (uid === 'api::show-recap.show-recap') return [];
        if (uid === 'api::artist-update.artist-update') return [];
        return [];
      },
      async findOne(uid, id) {
        if (uid === 'api::fan.fan') {
          if (Number(id) === 9) return fan;
          if (otherFan && Number(id) === otherFan.id) return otherFan;
          return null;
        }
        if (uid === 'api::band.band') {
          return { id: 2, name: 'Badflower', users_permissions_user: { id: 999 } };
        }
        return null;
      },
    },
  };
}

async function main() {
  const zero = mockStrapi({ attendances: [] });
  const none = await getArtistFanProgression(zero, {
    userId: 7,
    bandId: 2,
    fanId: 9,
    maskEmail: (email) => `${String(email)[0]}***`,
  });
  assert.ok(none.data);
  assert.strictEqual(none.data.shows.count, 0);
  assert.strictEqual(none.data.shows.returning, false);
  assert.strictEqual(none.data.joinedAt, '2025-06-01T00:00:00.000Z');
  assert.ok(!Object.prototype.hasOwnProperty.call(none.data, 'engagementScore'));
  assert.ok(!Object.prototype.hasOwnProperty.call(none.data, 'fanScore'));
  assert.ok(Array.isArray(none.data.milestones));
  assert.strictEqual(none.data.milestones.length, 0);
  assert.strictEqual(none.data.fan.displayName, 'Sarah');
  assert.ok(none.data.fan.emailMasked);
  assert.doesNotMatch(JSON.stringify(none.data), /sarah@example.com/);

  const one = mockStrapi({
    attendances: [nashville],
    moments: [
      {
        id: 21,
        kind: 'show',
        status: 'candidate',
        visibility: 'artist_fan',
        band: 2,
        subjectFan: 9,
        occurredAt: nashville.checkedInAt,
        sourceType: 'fan_show_attendance',
        sourceId: '1',
        shareable: false,
      },
    ],
  });
  const afterOne = await getArtistFanProgression(one, { userId: 7, bandId: 2, fanId: 9, maskEmail: () => 's***' });
  assert.strictEqual(afterOne.data.shows.count, 1);
  assert.strictEqual(afterOne.data.shows.returning, false);
  assert.strictEqual(afterOne.data.moments.length, 1);
  assert.strictEqual(afterOne.data.moments[0].showContext.city, 'Nashville');
  assert.strictEqual(afterOne.data.moments[0].hasNightStory, false);

  const two = mockStrapi({
    attendances: [nashville, knoxville],
    events: [
      { type: 'artist_message_sent', occurredAt: '2025-12-01T00:00:00.000Z', band: 2, fan: 9 },
      { type: 'fan_replied', occurredAt: '2025-12-02T00:00:00.000Z', band: 2, fan: 9 },
    ],
    moments: [
      {
        id: 21,
        kind: 'show',
        status: 'candidate',
        visibility: 'artist_fan',
        band: 2,
        subjectFan: 9,
        occurredAt: nashville.checkedInAt,
        sourceType: 'fan_show_attendance',
        sourceId: '1',
        shareable: false,
      },
      {
        id: 22,
        kind: 'show',
        status: 'candidate',
        visibility: 'artist_fan',
        band: 2,
        subjectFan: 9,
        occurredAt: knoxville.checkedInAt,
        sourceType: 'fan_show_attendance',
        sourceId: '2',
        shareable: false,
      },
    ],
    milestones: [
      {
        id: 31,
        type: 'fan_artist.first_show',
        status: 'active',
        band: 2,
        subjectFan: 9,
        occurredAt: nashville.checkedInAt,
        value: 1,
        version: 1,
        evidence: { attendanceId: '1' },
      },
      {
        id: 32,
        type: 'fan_artist.second_show',
        status: 'active',
        band: 2,
        subjectFan: 9,
        occurredAt: knoxville.checkedInAt,
        value: 2,
        version: 1,
        evidence: { attendanceId: '2', priorAttendanceId: '1', ordinal: 2 },
      },
      {
        id: 33,
        type: 'fan_artist.first_reply',
        status: 'active',
        band: 2,
        subjectFan: 9,
        occurredAt: '2025-12-02T00:00:00.000Z',
        value: 1,
        version: 1,
        evidence: { relationshipEventId: '8' },
      },
    ],
  });
  const afterTwo = await getArtistFanProgression(two, { userId: 7, bandId: 2, fanId: 9, maskEmail: () => 's***' });
  assert.strictEqual(afterTwo.data.shows.count, 2);
  assert.strictEqual(afterTwo.data.shows.returning, true);
  assert.strictEqual(afterTwo.data.communication.fanReplies, 1);
  assert.strictEqual(afterTwo.data.communication.artistMessagesSent, 1);
  assert.strictEqual(afterTwo.data.moments.length, 2);
  assert.strictEqual(afterTwo.data.moments[0].showContext.city, 'Nashville');
  assert.strictEqual(afterTwo.data.moments[1].showContext.city, 'Knoxville');
  assert.ok(new Date(afterTwo.data.moments[0].occurredAt) < new Date(afterTwo.data.moments[1].occurredAt));
  assert.ok(!JSON.stringify(afterTwo.data).includes('YOU CAME BACK'));
  assert.ok(Array.isArray(afterTwo.data.milestones));
  assert.strictEqual(afterTwo.data.milestones.length, 3);
  assert.ok(afterTwo.data.milestones.some((row) => row.type === 'fan_artist.second_show'));
  assert.ok(!Object.prototype.hasOwnProperty.call(afterTwo.data, 'engagementScore'));
  assert.ok(!Object.prototype.hasOwnProperty.call(afterTwo.data, 'level'));
  assert.ok(!Object.prototype.hasOwnProperty.call(afterTwo.data, 'rank'));

  const mixed = mockStrapi({ attendances: [nashville, knoxville] });
  const mixedResult = await getArtistFanProgression(mixed, { userId: 7, bandId: 2, fanId: 9, maskEmail: () => 's***' });
  assert.strictEqual(mixedResult.data.shows.count, 2);

  const manager = mockStrapi({ role: 'manager', attendances: [nashville] });
  const managerView = await getArtistFanProgression(manager, {
    userId: 7,
    bandId: 2,
    fanId: 9,
    maskEmail: () => 's***',
  });
  assert.ok(managerView.data);

  const deniedRole = mockStrapi({ role: null });
  const otherArtist = await getArtistFanProgression(deniedRole, {
    userId: 7,
    bandId: 2,
    fanId: 9,
    maskEmail: () => 's***',
  });
  assert.strictEqual(otherArtist.error, 'not_found');

  const wrongPair = mockStrapi({
    fanBandId: 2,
    otherFan: {
      id: 90,
      band: { id: 5, name: 'Other' },
      subscribedAt: '2026-01-01T00:00:00.000Z',
    },
  });
  const leaked = await getArtistFanProgression(wrongPair, {
    userId: 7,
    bandId: 2,
    fanId: 90,
    maskEmail: () => 's***',
  });
  assert.strictEqual(leaked.error, 'not_found');

  const anon = await getArtistFanProgression(mockStrapi(), {
    userId: null,
    bandId: 2,
    fanId: 9,
  });
  assert.strictEqual(anon.error, 'not_found');

  const crossMoment = canViewMoment({
    moment: { id: 99, status: 'candidate', visibility: 'artist_fan', band: 5, subjectFan: 90 },
    viewer: { bandId: 2, bandRole: 'owner', subjectFanId: 9 },
  });
  assert.strictEqual(crossMoment, false);

  const suppressedMoment = mockStrapi({
    attendances: [{ ...nashville, suppressedDuplicate: true }],
    moments: [
      {
        id: 21,
        kind: 'show',
        status: 'candidate',
        visibility: 'artist_fan',
        band: 2,
        subjectFan: 9,
        occurredAt: nashville.checkedInAt,
        sourceType: 'fan_show_attendance',
        sourceId: '1',
        shareable: false,
      },
    ],
  });
  const hidden = await getArtistFanProgression(suppressedMoment, {
    userId: 7,
    bandId: 2,
    fanId: 9,
    maskEmail: () => 's***',
  });
  assert.strictEqual(hidden.data.moments.length, 0);
  assert.strictEqual(hidden.data.shows.count, 0);

  const payload = JSON.stringify(afterTwo.data);
  assert.doesNotMatch(payload, /engagementScore|relationshipStrength|loyaltyPoints/);

  console.log('test-artist-fan-progression: ok');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
