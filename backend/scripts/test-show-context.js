'use strict';

const assert = require('assert');
const show = require('../src/utils/artistUpdates/showContextPure');
const pure = require('../src/utils/artistUpdates/artistUpdatePure');

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

(async () => {
  console.log('\n=== Show context + campaign attendance ===\n');

  require('../src/utils/artistUpdates/showContextPure');
  require('../src/utils/artistUpdates/artistUpdatePure');
  require('../src/utils/artistUpdates/artistUpdateService');

  await test('recap supplies canonical campaign and optional event', () => {
    const resolved = show.resolveShowContext({
      bandId: 2,
      recap: {
        id: 9,
        band: 2,
        campaignId: 'sm_1_abc',
        eventId: 44,
        showModeType: 'event',
      },
    });
    assert.strictEqual(resolved.ok, true);
    assert.strictEqual(resolved.context.campaignId, 'sm_1_abc');
    assert.strictEqual(resolved.context.eventId, '44');
    assert.strictEqual(resolved.context.showRecapId, '9');
  });

  await test('manual recap without event is still a night', () => {
    const resolved = show.resolveShowContext({
      bandId: 2,
      recap: { id: 3, band: 2, campaignId: 'sm_manual', showModeType: 'manual' },
    });
    assert.strictEqual(resolved.ok, true);
    assert.strictEqual(show.showContextHasNight(resolved.context), true);
    assert.strictEqual(resolved.context.eventId, null);
  });

  await test('conflicting event vs recap fails closed', () => {
    const resolved = show.resolveShowContext({
      bandId: 2,
      eventId: 10,
      recap: { id: 3, band: 2, campaignId: 'sm_1', eventId: 99 },
    });
    assert.strictEqual(resolved.error, 'show_context_mismatch');
    assert.strictEqual(resolved.field, 'eventId');
  });

  await test('conflicting campaign vs recap fails closed', () => {
    const resolved = show.resolveShowContext({
      bandId: 2,
      campaignId: 'sm_a',
      recap: { id: 3, band: 2, campaignId: 'sm_b' },
    });
    assert.strictEqual(resolved.error, 'show_context_mismatch');
  });

  await test('cross-band event object fails closed', () => {
    const resolved = show.resolveShowContext({
      bandId: 2,
      eventId: 44,
      event: { id: 44, band: 7 },
    });
    assert.strictEqual(resolved.error, 'show_context_mismatch');
    assert.strictEqual(resolved.field, 'bandId');
  });

  await test('cross-band recap fails closed', () => {
    const resolved = show.resolveShowContext({
      bandId: 2,
      recap: { id: 3, band: 9, campaignId: 'sm_1' },
    });
    assert.strictEqual(resolved.error, 'show_context_mismatch');
    assert.strictEqual(resolved.field, 'bandId');
  });

  await test('event attendance still authorizes show_attendees', () => {
    const access = pure.decideArtistUpdateAccess({
      update: { status: 'published', visibility: 'show_attendees', eventId: 44, campaignId: null },
      viewer: { userId: 9, fan: { id: 3, status: 'subscribed' }, attendedEventId: 44 },
    });
    assert.strictEqual(access.allowed, true);
    assert.strictEqual(access.youWereThere, true);
  });

  await test('campaign attendance authorizes manual show_attendees', () => {
    const access = pure.decideArtistUpdateAccess({
      update: {
        status: 'published',
        visibility: 'show_attendees',
        eventId: null,
        campaignId: 'sm_manual',
      },
      viewer: {
        userId: 9,
        fan: { id: 3, status: 'subscribed' },
        attendedCampaignId: 'sm_manual',
      },
    });
    assert.strictEqual(access.allowed, true);
    assert.strictEqual(access.youWereThere, true);
  });

  await test('either identifier of the same night is enough', () => {
    const update = {
      status: 'published',
      visibility: 'show_attendees',
      eventId: 44,
      campaignId: 'sm_1',
    };
    const byEvent = pure.decideArtistUpdateAccess({
      update,
      viewer: { userId: 9, fan: { id: 3, status: 'subscribed' }, attendedEventId: 44 },
    });
    const byCampaign = pure.decideArtistUpdateAccess({
      update,
      viewer: { userId: 9, fan: { id: 3, status: 'subscribed' }, attendedCampaignId: 'sm_1' },
    });
    assert.strictEqual(byEvent.allowed, true);
    assert.strictEqual(byCampaign.allowed, true);
  });

  await test('non-attendee fan gets a teaser without claiming presence', () => {
    const access = pure.decideArtistUpdateAccess({
      update: { status: 'published', visibility: 'show_attendees', eventId: 44, campaignId: 'sm_1' },
      viewer: { userId: 9, fan: { id: 3, status: 'subscribed' } },
    });
    assert.strictEqual(access.allowed, false);
    assert.strictEqual(access.teaser, true);
    assert.strictEqual(access.youWereThere, false);
  });

  await test('wrong campaign does not unlock the night', () => {
    const access = pure.decideArtistUpdateAccess({
      update: { status: 'published', visibility: 'show_attendees', campaignId: 'sm_1' },
      viewer: {
        userId: 9,
        fan: { id: 3, status: 'subscribed' },
        attendedCampaignId: 'sm_other',
      },
    });
    assert.strictEqual(access.allowed, false);
  });

  await test('suppressed attendance rows are not hits', () => {
    const hits = show.attendanceHitsFromRows([
      { id: 1, eventId: 44, campaignId: 'sm_1', suppressedDuplicate: true },
      { id: 2, eventId: 44, campaignId: 'sm_1', suppressedDuplicate: false },
    ]);
    assert.strictEqual(hits.eventIds.has('44'), true);
    const onlySuppressed = show.attendanceHitsFromRows([
      { id: 1, eventId: 44, campaignId: 'sm_1', suppressedDuplicate: true },
    ]);
    assert.strictEqual(onlySuppressed.eventIds.has('44'), false);
    assert.strictEqual(onlySuppressed.campaignIds.has('sm_1'), false);
  });

  await test('fan of another band is not a valid relationship', () => {
    const access = pure.decideArtistUpdateAccess({
      update: { status: 'published', visibility: 'show_attendees', eventId: 44 },
      viewer: { userId: 9, fan: null, attendedEventId: 44 },
    });
    assert.strictEqual(access.allowed, false);
    assert.strictEqual(access.youWereThere, false);
  });

  await test('_vid still cannot authorize show_attendees', () => {
    const access = pure.decideArtistUpdateAccess({
      update: { status: 'published', visibility: 'show_attendees', campaignId: 'sm_1' },
      viewer: {},
      visitorClaim: 'vid_abc',
    });
    assert.strictEqual(access.allowed, false);
    assert.strictEqual(access.reason, 'show_attendees');
  });

  await test('show_attendees without event or recap or campaign is rejected at publish', () => {
    const missing = pure.validatePublishInput({
      visibility: 'show_attendees',
      mediaIds: [1],
      protectedReady: true,
    });
    assert.strictEqual(missing.error, 'show_required');
    const recapOk = pure.validatePublishInput({
      visibility: 'show_attendees',
      mediaIds: [1],
      showRecapId: 9,
      protectedReady: true,
    });
    assert.strictEqual(recapOk.error, undefined);
    const campaignOk = pure.validatePublishInput({
      visibility: 'show_attendees',
      mediaIds: [1],
      campaignId: 'sm_manual',
      protectedReady: true,
    });
    assert.strictEqual(campaignOk.error, undefined);
  });

  await test('ordinal 1 is first show; later nights keep later ordinals', () => {
    const rows = [
      { id: 1, campaignId: 'sm_first', checkedInAt: '2024-01-01T00:00:00.000Z', suppressedDuplicate: false },
      { id: 2, eventId: 44, campaignId: 'sm_nash', checkedInAt: '2024-10-18T00:00:00.000Z', suppressedDuplicate: false },
      { id: 3, campaignId: 'sm_third', checkedInAt: '2025-02-01T00:00:00.000Z', suppressedDuplicate: false },
    ];
    assert.strictEqual(show.ordinalForShow(rows, { campaignId: 'sm_first' }), 1);
    assert.strictEqual(show.ordinalForShow(rows, { eventId: '44', campaignId: 'sm_nash' }), 2);
    assert.strictEqual(show.ordinalForShow(rows, { campaignId: 'sm_third' }), 3);
  });

  await test('denied teaser still strips media when campaign-gated', () => {
    const teaser = pure.publicTeaser({
      id: 8,
      slug: 'nashville',
      title: 'Nashville',
      bodyText: 'secret',
      visibility: 'show_attendees',
      status: 'published',
      media: [{ url: 'https://cdn.example/secret.jpg' }],
      photoCount: 4,
      show: { city: 'Nashville', venue: 'The Basement East' },
      campaignId: 'sm_1',
    }, { allowed: false, reason: 'show_attendees', teaser: true, youWereThere: false });
    assert.deepStrictEqual(teaser.media, []);
    assert.strictEqual(teaser.bodyText, '');
    assert.strictEqual(teaser.youWereThere, false);
    assert.strictEqual(teaser.locked, true);
    assert.strictEqual(teaser.sourceType, 'artist_update');
    assert.strictEqual(teaser.sourceId, 8);
  });

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
  if (failed) process.exitCode = 1;
})();
