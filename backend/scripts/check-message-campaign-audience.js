'use strict';

/**
 * Unit-level checks for the generic audience resolver + all_fans path.
 * Does not require a running Strapi / DB — mocks entityService.
 *
 * Run: node scripts/check-message-campaign-audience.js
 */

const path = require('path');

let failures = 0;

function check(label, actual, expected) {
  const ok = actual === expected;
  if (!ok) failures += 1;
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${label}\n        got: ${actual}\n        want: ${expected}`);
}

// --- Mock Strapi before requiring modules that touch strapi ---
const bandA = 10;
const bandB = 20;

const fans = [
  {
    id: 1,
    email: 'alice@example.com',
    firstName: 'Alice',
    status: 'subscribed',
    band: bandA,
    lastMessagedAt: null,
    demo: false,
  },
  {
    id: 2,
    email: 'bob@example.com',
    firstName: 'Bob',
    status: 'unsubscribed',
    band: bandA,
    lastMessagedAt: null,
    demo: false,
  },
  {
    id: 3,
    email: 'carol@example.com',
    firstName: 'Carol',
    status: 'subscribed',
    band: bandA,
    lastMessagedAt: null,
    demo: true,
  },
  {
    id: 4,
    email: 'not-an-email',
    firstName: 'Bad',
    status: 'subscribed',
    band: bandA,
    lastMessagedAt: null,
    demo: false,
  },
  {
    id: 5,
    email: 'otherband@example.com',
    firstName: 'Other',
    status: 'subscribed',
    band: bandB,
    lastMessagedAt: null,
    demo: false,
  },
  {
    id: 6,
    email: 'dave@example.com',
    firstName: 'Dave',
    status: 'subscribed',
    band: bandA,
    suppressionReason: 'bounced',
    lastMessagedAt: null,
    demo: false,
  },
];

global.strapi = {
  entityService: {
    async findMany(uid, opts = {}) {
      if (uid === 'api::fan.fan') {
        const filters = opts.filters || {};
        return fans.filter((f) => {
          if (filters.band != null && f.band !== filters.band) return false;
          if (filters.status != null && f.status !== filters.status) return false;
          return true;
        });
      }

      if (uid === 'api::fan-show-attendance.fan-show-attendance') {
        const filters = opts.filters || {};
        // Band A show campaign "show-1": alice only
        if (filters.band === bandA && filters.campaignId === 'show-1') {
          return [
            {
              id: 100,
              suppressedDuplicate: false,
              fan: fans[0],
            },
            {
              id: 101,
              suppressedDuplicate: false,
              fan: fans[1], // unsubscribed — filtered by getRecipients
            },
          ];
        }
        // Cross-band leakage check: band B query must not return band A fans
        if (filters.band === bandB && filters.campaignId === 'show-1') {
          return [];
        }
        return [];
      }

      return [];
    },
  },
  log: { info() {}, warn() {}, error() {}, debug() {} },
};

const audienceResolver = require(path.join(__dirname, '../src/utils/messaging/audienceResolver'));
const campaignService = require(path.join(__dirname, '../src/utils/messaging/campaignService'));

(async () => {
  // all_fans for band A
  const allA = await audienceResolver.resolveCampaignAudience({
    bandId: bandA,
    audienceType: 'all_fans',
  });

  check('all_fans includes subscribed non-demo Alice', allA.sendable.some((f) => f.id === 1), true);
  check('all_fans excludes unsubscribed Bob', allA.fans.some((f) => f.id === 2), false);
  check('all_fans excludes demo Carol', allA.fans.some((f) => f.id === 3), false);
  check('all_fans excludes invalid email', allA.fans.some((f) => f.id === 4), false);
  check('all_fans excludes other band', allA.fans.some((f) => f.id === 5), false);
  check('all_fans excludes bounced Dave', allA.fans.some((f) => f.id === 6), false);
  check('all_fans sendable count is 1 (Alice only)', allA.sendable.length, 1);

  // Band isolation for all_fans
  const allB = await audienceResolver.resolveCampaignAudience({
    bandId: bandB,
    audienceType: 'all_fans',
  });
  check('all_fans band B only sees its own fan', allB.sendable.length, 1);
  check('all_fans band B fan is Other', allB.sendable[0]?.id, 5);

  // show_attendees
  const showA = await audienceResolver.resolveCampaignAudience({
    bandId: bandA,
    audienceType: 'show_attendees',
    audienceReference: 'show-1',
  });
  check('show_attendees includes Alice', showA.sendable.some((f) => f.id === 1), true);
  check('show_attendees excludes unsubscribed Bob', showA.fans.some((f) => f.id === 2), false);

  const showBLeak = await audienceResolver.resolveCampaignAudience({
    bandId: bandB,
    audienceType: 'show_attendees',
    audienceReference: 'show-1',
  });
  check('show_attendees does not leak band A fans to band B', showBLeak.fans.length, 0);

  // Eligibility helper for all_fans
  check(
    'all_fans eligibility allows sendable room',
    campaignService.getAllFansEligibility({ sendableCount: 3, coolingCount: 1 }).canSend,
    true
  );
  check(
    'all_fans eligibility blocks empty',
    campaignService.getAllFansEligibility({ sendableCount: 0, coolingCount: 0 }).reason,
    'no_recipients'
  );
  check(
    'all_fans eligibility blocks when everyone is cooling',
    campaignService.getAllFansEligibility({ sendableCount: 0, coolingCount: 4 }).reason,
    'all_cooling'
  );

  // Content validation
  check(
    'empty subject is rejected',
    campaignService.validateContent({ subject: '', bodyText: 'hello' }).error,
    'empty_subject'
  );
  check(
    'empty body is rejected',
    campaignService.validateContent({ subject: 'Hi', bodyText: '' }).error,
    'empty_note'
  );
  check(
    'valid content passes',
    campaignService.validateContent({ subject: 'Hi', bodyText: 'hello' }).error,
    null
  );

  // Unsupported type
  const bad = await audienceResolver.resolveCampaignAudience({
    bandId: bandA,
    audienceType: 'segment_xyz',
  });
  check('unsupported audience returns error', bad.error, 'unsupported_audience');

  if (failures) {
    console.error(`\n${failures} failure(s)`);
    process.exit(1);
  }
  console.log('\nAll audience resolver checks passed.');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
