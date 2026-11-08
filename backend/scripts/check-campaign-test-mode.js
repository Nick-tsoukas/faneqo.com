'use strict';

/**
 * Config-level checks for email campaign cooldown test mode.
 * Run: node scripts/check-campaign-test-mode.js
 */

const assert = require('assert');
const {
  isCampaignTestModeEnabled,
  shouldBypassFanCampaignCooldown,
  parseCampaignTestEmails,
} = require('../src/utils/messaging/campaignTestMode');

function test(label, fn) {
  try {
    fn();
    console.log(`ok    ${label}`);
  } catch (err) {
    console.error(`FAIL  ${label}`);
    console.error(`      ${err.message}`);
    process.exitCode = 1;
  }
}

test('parseCampaignTestEmails splits and lowercases', () => {
  assert.deepStrictEqual(parseCampaignTestEmails('A@Example.com, b@test.com'), [
    'a@example.com',
    'b@test.com',
  ]);
});

test('production NODE_ENV never enables test mode even if flag is true', () => {
  assert.strictEqual(
    isCampaignTestModeEnabled({ nodeEnv: 'production', flag: 'true' }),
    false
  );
  assert.strictEqual(
    shouldBypassFanCampaignCooldown({
      email: 'test@example.com',
      nodeEnv: 'production',
      flag: 'true',
      allowlist: 'test@example.com',
    }),
    false
  );
});

test('flag off does not bypass in development', () => {
  assert.strictEqual(
    shouldBypassFanCampaignCooldown({
      email: 'test@example.com',
      nodeEnv: 'development',
      flag: 'false',
      allowlist: '',
    }),
    false
  );
});

test('development + flag + empty allowlist bypasses any email', () => {
  assert.strictEqual(
    shouldBypassFanCampaignCooldown({
      email: 'anyone@example.com',
      nodeEnv: 'development',
      flag: 'true',
      allowlist: '',
    }),
    true
  );
});

test('development + flag + allowlist only bypasses listed emails', () => {
  assert.strictEqual(
    shouldBypassFanCampaignCooldown({
      email: 'test@example.com',
      nodeEnv: 'development',
      flag: 'true',
      allowlist: 'test@example.com',
    }),
    true
  );
  assert.strictEqual(
    shouldBypassFanCampaignCooldown({
      email: 'other@example.com',
      nodeEnv: 'development',
      flag: 'true',
      allowlist: 'test@example.com',
    }),
    false
  );
});

test('string true/TRUE/1/yes all enable the flag', () => {
  assert.strictEqual(isCampaignTestModeEnabled({ nodeEnv: 'development', flag: 'true' }), true);
  assert.strictEqual(isCampaignTestModeEnabled({ nodeEnv: 'development', flag: 'TRUE' }), true);
  assert.strictEqual(isCampaignTestModeEnabled({ nodeEnv: 'development', flag: '1' }), true);
  assert.strictEqual(isCampaignTestModeEnabled({ nodeEnv: 'development', flag: 'yes' }), true);
});

test('NODE_ENV=test still allows the bypass when the flag is on', () => {
  assert.strictEqual(
    isCampaignTestModeEnabled({ nodeEnv: 'test', flag: 'true' }),
    true
  );
});

if (process.exitCode) {
  console.error('\nCampaign test-mode checks failed.');
  process.exit(1);
}

console.log('\nAll campaign test-mode checks passed.');
