'use strict';

const assert = require('assert');
const {
  PUBLIC_BAND_SCALAR_KEYS,
  PUBLIC_BAND_RELATION_KEYS,
  OWNER_BAND_SCALAR_KEYS,
  FORBIDDEN_PUBLIC_BAND_KEYS,
  toPublicBand,
  toOwnerBand,
  publicBandHasForbidden,
} = require('../src/utils/band/publicBandPure');

let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    passed += 1;
    console.log(`  ✅ ${name}`);
  } catch (err) {
    failed += 1;
    console.log(`  ❌ ${name}`);
    console.log(`     ${err.message}`);
  }
}

const REQUIRED_PUBLIC_SHOW_MODE = [
  'showModeEnabled',
  'showModeStatus',
  'showModeEndsAt',
  'showModeStartedAt',
  'showModeTitle',
  'showModeVenue',
  'showModeCity',
  'showModeEventId',
  'showModeCampaignId',
];

const REQUIRED_PUBLIC_ARTIST_PAGE = [
  'id',
  'name',
  'slug',
  'genre',
  'bio',
  'bandImg',
  'events',
  'fanCaptureEnabled',
  'fanCaptureHeadline',
  'layoutConfig',
  ...REQUIRED_PUBLIC_SHOW_MODE,
];

function fullLeakingBand() {
  return {
    id: 7,
    name: 'Badflower',
    slug: 'badflower',
    genre: 'rock',
    bio: 'Nashville',
    biotagline: 'Live',
    bandImg: { id: 1, url: 'https://cdn.example/band.jpg' },
    events: [{ id: 12, title: 'The Basement East', city: 'Nashville' }],
    albums: [],
    tours: [],
    singlesong: null,
    singlevideo: null,
    videos: [],
    customButtons: [],
    editorialItems: [],
    members: [],
    fanCaptureEnabled: true,
    fanCaptureHeadline: 'Join',
    fanCaptureMessage: 'Get first access',
    fanCaptureButtonLabel: 'Join Fan List',
    fanCaptureSuccessMessage: "You're on the list.",
    layoutConfig: { sections: [] },
    layoutVersion: 1,
    pageStyle: 'smartlink',
    buttonStyle: 'classic',
    paymentsEnabled: true,
    paymentButtons: [],
    showModeEnabled: true,
    showModeStatus: 'live',
    showModeEndsAt: '2026-09-06T04:00:00.000Z',
    showModeStartedAt: '2026-09-05T23:00:00.000Z',
    showModeTitle: 'Nashville',
    showModeVenue: 'The Basement East',
    showModeCity: 'Nashville',
    showModeEventId: 12,
    showModeCampaignId: 'sm_live_1',
    showModeLastCampaignId: 'sm_old',
    showModeLastContext: { campaignId: 'sm_old', coverMediaId: 99 },
    showModeLastDeactivationReason: 'expired',
    showModePerformanceStartsAt: '2026-09-05T23:30:00.000Z',
    showModePerformanceEndsAt: '2026-09-06T01:30:00.000Z',
    showModeActivatedAt: '2026-09-05T22:00:00.000Z',
    showModeEndedAt: null,
    showModeMetadata: { coverMediaId: 3 },
    showModeAutoManaged: false,
    showModeScheduledStartAt: null,
    showModeScheduledEndAt: null,
    showModeLastAutoDeactivatedAt: null,
    showModeLastManualOverrideAt: null,
    showModeSourceDetail: 'manual',
    showModeType: 'manual',
    showModeRegion: 'TN',
    showModeCountry: 'US',
    showModeTimezone: 'America/Chicago',
    stripeAccountId: 'acct_secret',
    stripeOnboardingComplete: true,
    users_permissions_user: { id: 2, email: 'owner@example.com' },
    link_clicks: [{ id: 1 }],
    fans: [{ id: 9, email: 'fan@example.com' }],
    qrs: [{ id: 4 }],
    externalAccounts: [],
    externalMetrics: [],
    merchConcierge: { token: 'nope' },
    media_plays: [],
    band_page_views: [],
    inventedInternalFlag: true,
    recoverySecret: 'do-not-leak',
  };
}

(async () => {
  console.log('\n=== Public Band serializer contract ===\n');

  await test('1. public slug payload keeps required artist-page fields', () => {
    const payload = toPublicBand(fullLeakingBand());
    for (const key of REQUIRED_PUBLIC_ARTIST_PAGE) {
      assert.ok(Object.prototype.hasOwnProperty.call(payload, key), `missing ${key}`);
    }
    assert.strictEqual(payload.slug, 'badflower');
    assert.strictEqual(payload.showModeCampaignId, 'sm_live_1');
    assert.strictEqual(payload.fanCaptureEnabled, true);
  });

  await test('2–5. internal Show Mode and private metadata are absent', () => {
    const payload = toPublicBand(fullLeakingBand());
    for (const key of FORBIDDEN_PUBLIC_BAND_KEYS) {
      assert.ok(!Object.prototype.hasOwnProperty.call(payload, key), `leaked ${key}`);
    }
    assert.strictEqual(payload.showModeLastCampaignId, undefined);
    assert.strictEqual(payload.showModeLastContext, undefined);
    assert.strictEqual(payload.showModeLastDeactivationReason, undefined);
    assert.strictEqual(payload.stripeAccountId, undefined);
    assert.strictEqual(payload.users_permissions_user, undefined);
    assert.deepStrictEqual(publicBandHasForbidden(payload), []);
  });

  await test('6. arbitrary new Band fields do not serialize publicly', () => {
    const payload = toPublicBand({
      id: 1,
      name: 'X',
      slug: 'x',
      inventedInternalFlag: true,
      recoverySecret: 'nope',
      futureOpsField: { ok: false },
    });
    assert.strictEqual(payload.inventedInternalFlag, undefined);
    assert.strictEqual(payload.recoverySecret, undefined);
    assert.strictEqual(payload.futureOpsField, undefined);
    assert.deepStrictEqual(publicBandHasForbidden({ ...payload, extraLeak: 1 }), ['extraLeak']);
  });

  await test('7. live Show Mode / check-in contract fields stay public', () => {
    const payload = toPublicBand(fullLeakingBand());
    for (const key of REQUIRED_PUBLIC_SHOW_MODE) {
      assert.ok(payload[key] !== undefined, `missing live field ${key}`);
    }
    assert.ok(PUBLIC_BAND_SCALAR_KEYS.includes('showModeCampaignId'));
    assert.ok(!PUBLIC_BAND_SCALAR_KEYS.includes('showModeLastCampaignId'));
  });

  await test('owner list extras include Stripe but still omit internals', () => {
    const owner = toOwnerBand(fullLeakingBand());
    assert.strictEqual(owner.stripeAccountId, 'acct_secret');
    assert.strictEqual(owner.stripeOnboardingComplete, true);
    assert.strictEqual(owner.showModeLastContext, undefined);
    assert.strictEqual(owner.users_permissions_user, undefined);
    assert.deepStrictEqual(publicBandHasForbidden(owner, { owner: true }), []);
    assert.ok(OWNER_BAND_SCALAR_KEYS.includes('stripeAccountId'));
    assert.ok(PUBLIC_BAND_RELATION_KEYS.includes('events'));
  });

  await test('findBySlug-style public payload never includes owner extras', () => {
    const payload = toPublicBand(fullLeakingBand());
    assert.strictEqual(payload.stripeAccountId, undefined);
    assert.strictEqual(payload.stripeOnboardingComplete, undefined);
  });

  if (failed) {
    console.log(`\n${failed} failed, ${passed} passed`);
    process.exit(1);
  }
  console.log(`\n${passed} passed`);
})();
