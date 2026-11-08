'use strict';

const assert = require('assert');
const {
  resolveShowInboxRecipient,
} = require('../src/utils/messaging/showInboxIdentity');

{
  const attendanceFan = {
    id: 1,
    status: 'subscribed',
    accountUser: null,
    visitor: { id: 3, accountUser: { id: 3 } },
  };
  const claimedTwin = {
    id: 2,
    status: 'subscribed',
    accountUser: { id: 3 },
    visitor: { id: 3, accountUser: { id: 3 } },
  };
  const otherFan = {
    id: 9,
    status: 'subscribed',
    accountUser: { id: 9 },
    visitor: { id: 99 },
  };
  const removedTwin = {
    id: 10,
    status: 'removed',
    accountUser: { id: 10 },
    visitor: { id: 3 },
  };

  const reached = resolveShowInboxRecipient(attendanceFan, {
    claimedByVisitor: [claimedTwin, otherFan, removedTwin],
    excludeAccountUserId: 2,
  });
  assert.strictEqual(reached.id, 2);
  assert.strictEqual(reached.accountUser, 3);

  assert.strictEqual(
    resolveShowInboxRecipient(attendanceFan, { claimedByVisitor: [otherFan] }),
    null,
    'a non-attendee with a different visitor must not become the show audience'
  );
  assert.strictEqual(
    resolveShowInboxRecipient({ ...attendanceFan, visitor: null }, { claimedByVisitor: [claimedTwin] }),
    null,
    'no visitor means no identity bridge'
  );
  assert.strictEqual(
    resolveShowInboxRecipient(
      { id: 1, status: 'subscribed', accountUser: { id: 3 }, visitor: { id: 3 } },
      { claimedByVisitor: [claimedTwin], excludeAccountUserId: 3 }
    ),
    null,
    'artist/self account must stay excluded'
  );
  assert.strictEqual(
    resolveShowInboxRecipient(
      { id: 1, status: 'removed', accountUser: null, visitor: { id: 3 } },
      { claimedByVisitor: [claimedTwin] }
    ),
    null,
    'removed attendance fan must stay excluded'
  );
  assert.strictEqual(
    resolveShowInboxRecipient(
      { id: 11, status: 'subscribed', accountUser: { id: 11 }, visitor: { id: 3 } },
      { claimedByVisitor: [claimedTwin] }
    ).accountUser,
    11,
    'direct accountUser on the attendance fan still wins'
  );
  assert.strictEqual(
    resolveShowInboxRecipient(
      { ...attendanceFan, visitor: { id: 3 } },
      { claimedByVisitor: [claimedTwin] }
    ),
    null,
    'unclaimed visitor must not bridge to a sibling Fan'
  );
  assert.strictEqual(
    resolveShowInboxRecipient(attendanceFan, {
      claimedByVisitor: [
        { id: 12, status: 'subscribed', accountUser: { id: 12 }, visitor: { id: 3 } },
      ],
    }),
    null,
    'visitor bound to a different account than the sibling Fan must fail closed'
  );
  assert.strictEqual(
    resolveShowInboxRecipient(attendanceFan, {
      claimedByVisitor: [
        claimedTwin,
        { id: 12, status: 'subscribed', accountUser: { id: 12 }, visitor: { id: 3 } },
      ],
    }).accountUser,
    3,
    'claimed visitor binding selects the matching sibling account'
  );
}


const allFans = [
  {
    id: 1,
    email: 'one@example.com',
    firstName: 'One',
    status: 'subscribed',
    accountUser: { id: 101 },
    lastMessagedAt: new Date().toISOString(),
  },
  { id: 2, email: 'off@example.com', firstName: 'Off', status: 'unsubscribed', accountUser: { id: 102 } },
  { id: 3, email: 'removed@example.com', status: 'removed', accountUser: { id: 103 } },
  { id: 4, email: 'anon@example.com', status: 'subscribed', accountUser: null },
  { id: 5, email: 'duplicate@example.com', status: 'subscribed', accountUser: { id: 101 } },
  { id: 6, email: 'self@example.com', status: 'subscribed', accountUser: { id: 999 } },
  {
    id: 7,
    email: 'cooling@example.com',
    status: 'subscribed',
    accountUser: { id: 107 },
    lastInboxBroadcastAt: new Date().toISOString(),
  },
];

const attendances = [
  { id: 11, suppressedDuplicate: false, fan: allFans[0] },
  { id: 12, suppressedDuplicate: false, fan: allFans[1] },
  { id: 13, suppressedDuplicate: true, fan: { id: 8, status: 'subscribed', accountUser: { id: 108 } } },
  { id: 14, suppressedDuplicate: false, fan: allFans[4] },
  { id: 15, suppressedDuplicate: false, fan: allFans[3] },
  { id: 16, suppressedDuplicate: false, fan: allFans[5] },
];

global.strapi = {
  entityService: {
    async findMany(uid) {
      if (uid === 'api::fan.fan') return allFans;
      if (uid === 'api::fan-show-attendance.fan-show-attendance') return attendances;
      return [];
    },
  },
};

const {
  resolveCampaignAudience,
  AUDIENCE_TYPES,
  CAMPAIGN_CHANNELS,
} = require('../src/utils/messaging/audienceResolver');

(async () => {
  const everyone = await resolveCampaignAudience({
    bandId: 10,
    audienceType: AUDIENCE_TYPES.ALL_FANS,
    channel: CAMPAIGN_CHANNELS.IN_APP,
    excludeAccountUserId: 999,
  });
  assert.strictEqual(everyone.error, null);
  assert.deepStrictEqual(everyone.fans.map((fan) => fan.id), [1, 2, 7]);
  assert.deepStrictEqual(everyone.sendable.map((fan) => fan.id), [1, 2, 7]);
  assert.deepStrictEqual(everyone.cooling, []);

  const room = await resolveCampaignAudience({
    bandId: 10,
    audienceType: AUDIENCE_TYPES.SHOW_ATTENDEES,
    audienceReference: 'show-123',
    channel: CAMPAIGN_CHANNELS.IN_APP,
    excludeAccountUserId: 999,
  });
  assert.strictEqual(room.error, null);
  assert.deepStrictEqual(room.sendable.map((fan) => fan.id), [1, 2]);
  assert.deepStrictEqual(room.cooling, []);

  const email = await resolveCampaignAudience({
    bandId: 10,
    audienceType: AUDIENCE_TYPES.ALL_FANS,
    channel: CAMPAIGN_CHANNELS.EMAIL,
  });
  assert.strictEqual(email.error, null);
  assert.ok(email.fans.some((fan) => fan.id === 1));
  assert.ok(email.cooling.some((fan) => fan.id === 1), 'email cooldown must remain unchanged');
  assert.ok(!email.fans.some((fan) => fan.id === 2), 'email opt-out must remain excluded from email');

  const observedAttendanceFan = {
    id: 1,
    email: 'checkin@example.com',
    firstName: 'Checkin',
    status: 'subscribed',
    accountUser: null,
    visitor: { id: 3, accountUser: { id: 3 } },
  };
  const observedClaimedFan = {
    id: 2,
    email: 'account@example.com',
    firstName: 'Account',
    status: 'subscribed',
    accountUser: { id: 3 },
    visitor: { id: 3, accountUser: { id: 3 } },
  };
  const stranger = {
    id: 9,
    email: 'stranger@example.com',
    status: 'subscribed',
    accountUser: { id: 9 },
    visitor: { id: 99 },
  };
  const observedAttendances = [
    { id: 1, suppressedDuplicate: false, fan: observedAttendanceFan },
    { id: 2, suppressedDuplicate: true, fan: { id: 8, status: 'subscribed', accountUser: { id: 108 }, visitor: { id: 3 } } },
  ];

  global.strapi.entityService.findMany = async (uid) => {
    if (uid === 'api::fan.fan') return [observedClaimedFan, stranger];
    if (uid === 'api::fan-show-attendance.fan-show-attendance') return observedAttendances;
    return [];
  };

  const observed = await resolveCampaignAudience({
    bandId: 2,
    audienceType: AUDIENCE_TYPES.SHOW_ATTENDEES,
    audienceReference: 'sm_local_show',
    channel: CAMPAIGN_CHANNELS.IN_APP,
    excludeAccountUserId: 2,
  });
  assert.strictEqual(observed.error, null);
  assert.deepStrictEqual(observed.sendable.map((fan) => fan.id), [2]);
  assert.strictEqual(observed.sendable[0].accountUser, 3);
  assert.ok(!observed.sendable.some((fan) => fan.id === 9));

  const observedEmail = await resolveCampaignAudience({
    bandId: 2,
    audienceType: AUDIENCE_TYPES.SHOW_ATTENDEES,
    audienceReference: 'sm_local_show',
    channel: CAMPAIGN_CHANNELS.EMAIL,
  });
  assert.strictEqual(observedEmail.error, null);
  assert.deepStrictEqual(observedEmail.fans.map((fan) => fan.id), [1]);
  assert.ok(!observedEmail.fans.some((fan) => fan.id === 2), 'email path must stay on the attendance fan');

  console.log('In-app campaign audience checks passed.');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
