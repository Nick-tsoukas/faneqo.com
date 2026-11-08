'use strict';

/**
 * Production campaign test-mode safety checks.
 * Run: node scripts/check-prod-campaign-test-mode.js
 */

const assert = require('assert');
const showMessage = require('../src/api/show-recap/services/show-message');
const {
  parseBandIds,
  parseProdCampaignTestEmails,
  getProdCampaignTestMisconfigReason,
  isProductionTestModeForBand,
  clampFansToProdTestEmails,
  shouldBypassFanCampaignCooldown,
  isCampaignTestModeEnabled,
  prefixProdTestSubject,
} = require('../src/utils/messaging/campaignTestMode');

global.strapi = global.strapi || {
  log: { info() {}, warn() {}, error() {}, debug() {} },
  entityService: { findMany: async () => [], findOne: async () => null, create: async () => ({}), update: async () => ({}) },
};

const campaignService = require('../src/utils/messaging/campaignService');

let failed = 0;

function test(label, fn) {
  try {
    fn();
    console.log(`ok    ${label}`);
  } catch (err) {
    failed += 1;
    console.error(`FAIL  ${label}`);
    console.error(`      ${err.message}`);
  }
}

const prodEnv = {
  nodeEnv: 'production',
  flag: 'true',
  bandIds: '17, 18',
  emails: 'me@example.com, test2@example.com',
};

test('A. production flag off keeps cooldown (FANEQO_CAMPAIGN_TEST_MODE ignored)', () => {
  assert.strictEqual(
    isCampaignTestModeEnabled({ nodeEnv: 'production', flag: 'true' }),
    false
  );
  assert.strictEqual(
    shouldBypassFanCampaignCooldown({
      email: 'me@example.com',
      bandId: 17,
      nodeEnv: 'production',
      flag: 'true',
      prodFlag: 'false',
      prodBandIds: '17',
      prodEmails: 'me@example.com',
    }),
    false
  );
});

test('B. prod test flag true with no band IDs is misconfigured', () => {
  assert.strictEqual(
    getProdCampaignTestMisconfigReason({
      nodeEnv: 'production',
      flag: 'true',
      bandIds: '',
      emails: 'me@example.com',
    }),
    'missing_band_allowlist'
  );
});

test('C. band IDs without emails fails closed', () => {
  assert.strictEqual(
    getProdCampaignTestMisconfigReason({
      nodeEnv: 'production',
      flag: 'true',
      bandIds: '17',
      emails: '',
    }),
    'missing_recipient_allowlist'
  );
});

test('D. wrong band does not activate production test mode', () => {
  assert.strictEqual(isProductionTestModeForBand(18, { ...prodEnv, bandIds: '17' }), false);
  assert.strictEqual(isProductionTestModeForBand(17, prodEnv), true);
});

test('parseBandIds and emails trim / lowercase / dedupe', () => {
  assert.deepStrictEqual(parseBandIds(' 17, 17, abc, 18 '), [17, 18]);
  assert.deepStrictEqual(parseProdCampaignTestEmails('Me@Example.com, me@example.com,  test2@example.com'), [
    'me@example.com',
    'test2@example.com',
  ]);
});

const allowlisted = {
  id: 1,
  email: 'me@example.com',
  lastMessagedAt: new Date().toISOString(),
};
const realFan = {
  id: 2,
  email: 'real-fan@example.com',
  lastMessagedAt: null,
};
const unsubscribed = {
  id: 3,
  email: 'me@example.com',
  status: 'unsubscribed',
  lastMessagedAt: null,
};

test('E. allowlisted fan with lastMessagedAt=now is sendable for approved band', () => {
  assert.strictEqual(
    shouldBypassFanCampaignCooldown({
      email: allowlisted.email,
      bandId: 17,
      nodeEnv: 'production',
      prodFlag: 'true',
      prodBandIds: '17',
      prodEmails: 'me@example.com',
    }),
    true
  );
});

const prior = {
  NODE_ENV: process.env.NODE_ENV,
  FANEQO_PROD_CAMPAIGN_TEST_MODE: process.env.FANEQO_PROD_CAMPAIGN_TEST_MODE,
  FANEQO_PROD_CAMPAIGN_TEST_BAND_IDS: process.env.FANEQO_PROD_CAMPAIGN_TEST_BAND_IDS,
  FANEQO_PROD_CAMPAIGN_TEST_EMAILS: process.env.FANEQO_PROD_CAMPAIGN_TEST_EMAILS,
  FANEQO_CAMPAIGN_TEST_MODE: process.env.FANEQO_CAMPAIGN_TEST_MODE,
};

function setProd(on, bandIds, emails) {
  process.env.NODE_ENV = 'production';
  process.env.FANEQO_PROD_CAMPAIGN_TEST_MODE = on ? 'true' : 'false';
  process.env.FANEQO_PROD_CAMPAIGN_TEST_BAND_IDS = bandIds;
  process.env.FANEQO_PROD_CAMPAIGN_TEST_EMAILS = emails;
  delete process.env.FANEQO_CAMPAIGN_TEST_MODE;
}

function restoreEnv() {
  for (const [key, value] of Object.entries(prior)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

setProd(true, '17', 'me@example.com,test2@example.com');

test('E. lastMessagedAt=now sendable after partition for approved band', () => {
  const split = showMessage.partitionRecipients([allowlisted], { bandId: 17 });
  assert.strictEqual(split.sendable.length, 1);
  assert.strictEqual(
    campaignService.getAllFansEligibility({
      sendableCount: split.sendable.length,
      coolingCount: split.cooling.length,
    }).canSend,
    true
  );
});

test('F. CRITICAL non-allowlisted same-band fan is excluded from clamped audience', () => {
  const room = [allowlisted, realFan];
  const clamped = clampFansToProdTestEmails(room);
  assert.strictEqual(clamped.length, 1);
  assert.strictEqual(clamped[0].id, 1);
  assert.ok(!clamped.some((f) => f.id === 2));

  const gated = campaignService.applyProductionTestAudience({
    bandId: 17,
    audienceType: 'all_fans',
    audience: {
      fans: room,
      sendable: room,
      cooling: [],
    },
    requestId: 'req_test',
  });
  assert.strictEqual(gated.error, null);
  assert.strictEqual(gated.productionTestMode, true);
  assert.strictEqual(gated.audience.fans.length, 1);
  assert.strictEqual(gated.audience.sendable.length, 1);
  assert.ok(!gated.audience.fans.some((f) => f.email === 'real-fan@example.com'));
  assert.ok(!gated.audience.sendable.some((f) => f.email === 'real-fan@example.com'));
});

test('G. unsubscribed allowlisted email is not resurrected by clamp if already filtered out', () => {
  const clamped = clampFansToProdTestEmails([realFan]);
  assert.strictEqual(clamped.length, 0);
  // Resolver excludes unsubscribed before clamp; clamp of empty stays empty.
  const gated = campaignService.applyProductionTestAudience({
    bandId: 17,
    audienceType: 'all_fans',
    audience: { fans: [], sendable: [], cooling: [] },
    requestId: 'req_unsub',
  });
  assert.strictEqual(gated.audience.sendable.length, 0);
  void unsubscribed;
});

test('H. bounced/complaint fans never enter clamp if resolver already dropped them', () => {
  const bounced = { id: 9, email: 'me@example.com', suppressionReason: 'bounced' };
  const gated = campaignService.applyProductionTestAudience({
    bandId: 17,
    audienceType: 'all_fans',
    audience: { fans: [], sendable: [], cooling: [] },
    requestId: 'req_bounce',
  });
  assert.strictEqual(gated.audience.fans.length, 0);
  void bounced;
});

test('I. test mode off restores full audience and cooldown', () => {
  setProd(false, '17', 'me@example.com');
  const room = [allowlisted, realFan];
  const gated = campaignService.applyProductionTestAudience({
    bandId: 17,
    audienceType: 'all_fans',
    audience: { fans: room, sendable: [realFan], cooling: [allowlisted] },
    requestId: 'req_off',
  });
  assert.strictEqual(gated.productionTestMode, false);
  assert.strictEqual(gated.audience.fans.length, 2);
  const split = showMessage.partitionRecipients([allowlisted], { bandId: 17 });
  assert.strictEqual(split.cooling.length, 1);
});

setProd(true, '17', 'me@example.com,test2@example.com');

test('J. preview/create share clamp — same recipient count', () => {
  const room = [allowlisted, realFan, { id: 4, email: 'test2@example.com', lastMessagedAt: new Date().toISOString() }];
  const a = campaignService.applyProductionTestAudience({
    bandId: 17,
    audienceType: 'all_fans',
    audience: { fans: room, sendable: room, cooling: [] },
    requestId: 'req_preview',
  });
  const b = campaignService.applyProductionTestAudience({
    bandId: 17,
    audienceType: 'all_fans',
    audience: { fans: room, sendable: room, cooling: [] },
    requestId: 'req_create',
  });
  assert.strictEqual(a.audience.sendable.length, b.audience.sendable.length);
  assert.strictEqual(a.audience.fans.length, 2);
  assert.strictEqual(a.audience.sendable.length, 2);
});

test('misconfigured flag blocks applyProductionTestAudience', () => {
  setProd(true, '', 'me@example.com');
  const gated = campaignService.applyProductionTestAudience({
    bandId: 17,
    audienceType: 'all_fans',
    audience: { fans: [allowlisted], sendable: [allowlisted], cooling: [] },
    requestId: 'req_bad',
  });
  assert.strictEqual(gated.error, 'production_test_mode_misconfigured');
});

test('Message the Room audience type is not clamped', () => {
  setProd(true, '17', 'me@example.com');
  const room = [allowlisted, realFan];
  const gated = campaignService.applyProductionTestAudience({
    bandId: 17,
    audienceType: 'show_attendees',
    audience: { fans: room, sendable: room, cooling: [] },
    requestId: 'req_room',
  });
  assert.strictEqual(gated.productionTestMode, false);
  assert.strictEqual(gated.audience.fans.length, 2);
});

test('[TEST] subject prefix is applied once and truncated', () => {
  assert.strictEqual(prefixProdTestSubject('Hello', 140), '[TEST] Hello');
  assert.strictEqual(prefixProdTestSubject('[TEST] Hello', 140), '[TEST] Hello');
  assert.ok(prefixProdTestSubject('x'.repeat(200), 20).length <= 20);
});

restoreEnv();

if (failed) {
  console.error(`\n${failed} production test-mode check(s) failed.`);
  process.exit(1);
}

console.log('\nAll production campaign test-mode checks passed.');
