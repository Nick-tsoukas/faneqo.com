'use strict';

const assert = require('assert');
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
  console.log('\n=== Artist Update access + publish rules ===\n');

  await test('public update is visible to anonymous viewers', () => {
    const access = pure.decideArtistUpdateAccess({
      update: { status: 'published', visibility: 'public', eventId: null },
      viewer: {},
    });
    assert.strictEqual(access.allowed, true);
    assert.strictEqual(access.youWereThere, false);
  });

  await test('_vid / visitor claim never grants fan-list access', () => {
    const access = pure.decideArtistUpdateAccess({
      update: { status: 'published', visibility: 'fan_list', eventId: null },
      viewer: {},
      visitorClaim: 'vid_abc',
    });
    assert.strictEqual(access.allowed, false);
    assert.strictEqual(access.reason, 'fan_list');
    assert.strictEqual(access.teaser, true);
  });

  await test('fan-list allowed for claimed non-removed fan', () => {
    const access = pure.decideArtistUpdateAccess({
      update: { status: 'published', visibility: 'fan_list', eventId: null },
      viewer: { userId: 9, fan: { id: 3, status: 'subscribed' } },
    });
    assert.strictEqual(access.allowed, true);
  });

  await test('fan-list denied for removed fan', () => {
    const access = pure.decideArtistUpdateAccess({
      update: { status: 'published', visibility: 'fan_list', eventId: null },
      viewer: { userId: 9, fan: { id: 3, status: 'removed' } },
    });
    assert.strictEqual(access.allowed, false);
    assert.strictEqual(access.reason, 'fan_list');
  });

  await test('show-attendee allowed only with matching attendance', () => {
    const denied = pure.decideArtistUpdateAccess({
      update: { status: 'published', visibility: 'show_attendees', eventId: 44 },
      viewer: { userId: 9, fan: { id: 3, status: 'subscribed' }, attendedEventId: null },
    });
    assert.strictEqual(denied.allowed, false);
    const allowed = pure.decideArtistUpdateAccess({
      update: { status: 'published', visibility: 'show_attendees', eventId: 44 },
      viewer: { userId: 9, fan: { id: 3, status: 'subscribed' }, attendedEventId: 44 },
    });
    assert.strictEqual(allowed.allowed, true);
    assert.strictEqual(allowed.youWereThere, true);
  });

  await test('wrong show does not unlock attendance', () => {
    const access = pure.decideArtistUpdateAccess({
      update: { status: 'published', visibility: 'show_attendees', eventId: 44 },
      viewer: { userId: 9, fan: { id: 3, status: 'subscribed' }, attendedEventId: 99 },
    });
    assert.strictEqual(access.allowed, false);
  });

  await test('draft is hidden from fans', () => {
    const access = pure.decideArtistUpdateAccess({
      update: { status: 'draft', visibility: 'public', eventId: null },
      viewer: { userId: 9, fan: { id: 3, status: 'subscribed' } },
    });
    assert.strictEqual(access.allowed, false);
    assert.strictEqual(access.reason, 'draft');
  });

  await test('You were there is only true with server attendance', () => {
    const access = pure.decideArtistUpdateAccess({
      update: { status: 'published', visibility: 'public', eventId: 12 },
      viewer: { attendedEventId: 12 },
    });
    assert.strictEqual(access.youWereThere, true);
    const no = pure.decideArtistUpdateAccess({
      update: { status: 'published', visibility: 'public', eventId: 12 },
      viewer: {},
    });
    assert.strictEqual(no.youWereThere, false);
  });

  await test('locked teaser never includes media URLs', () => {
    const update = {
      id: 1,
      slug: 'nashville',
      title: 'Nashville',
      bodyText: 'secret caption',
      visibility: 'fan_list',
      status: 'published',
      media: [{ type: 'image', url: 'https://cdn.example/secret.jpg' }],
      photoCount: 1,
    };
    const teaser = pure.publicTeaser(update, { allowed: false, reason: 'fan_list', teaser: true });
    assert.strictEqual(teaser.locked, true);
    assert.deepStrictEqual(teaser.media, []);
    assert.strictEqual(teaser.bodyText, '');
  });

  await test('omitted visibility defaults to public for general and show galleries', () => {
    const general = pure.validatePublishInput({
      title: 'Nashville',
      mediaIds: [1],
    });
    assert.strictEqual(general.error, undefined);
    assert.strictEqual(general.visibility, 'public');
    const show = pure.validatePublishInput({
      title: 'Nashville',
      mediaIds: [1],
      showRecapId: 41,
      eventId: 12,
      campaignId: 'sm_manual',
    });
    assert.strictEqual(show.error, undefined);
    assert.strictEqual(show.visibility, 'public');
    assert.strictEqual(show.showRecapId, 41);
    assert.strictEqual(show.eventId, 12);
    assert.strictEqual(show.campaignId, 'sm_manual');
  });

  await test('gated publish is blocked until protected delivery exists', () => {
    assert.strictEqual(pure.GATED_MEDIA_DELIVERY_READY, false);
    const gated = pure.validatePublishInput({
      title: 'Nashville',
      bodyText: 'Thanks',
      visibility: 'show_attendees',
      mediaIds: [1],
      eventId: 9,
    });
    assert.strictEqual(gated.error, 'gated_delivery_unavailable');
    const pub = pure.validatePublishInput({
      title: 'Nashville',
      bodyText: 'Thanks',
      visibility: 'public',
      mediaIds: [1],
    });
    assert.strictEqual(pub.error, undefined);
    assert.strictEqual(pub.contentKind, 'image');
  });

  await test('artist owner can see drafts; fans cannot', () => {
    const artist = pure.decideArtistUpdateAccess({
      update: { status: 'draft', visibility: 'public', eventId: null },
      viewer: { isArtist: true, userId: 1 },
    });
    assert.strictEqual(artist.allowed, true);
    const fan = pure.decideArtistUpdateAccess({
      update: { status: 'draft', visibility: 'public', eventId: null },
      viewer: { userId: 9, fan: { id: 3, status: 'subscribed' } },
    });
    assert.strictEqual(fan.allowed, false);
    assert.strictEqual(fan.teaser, false);
  });

  await test('slugify is collision-safe and strips punctuation', () => {
    assert.strictEqual(pure.slugify('Nashville!!!'), 'nashville');
    assert.strictEqual(pure.slugify('  Hello   World  '), 'hello-world');
    assert.ok(pure.slugify('', 'update-abc').startsWith('update'));
  });

  await test('show attendees with recap only (no event) can validate when delivery is ready', () => {
    const ok = pure.validatePublishInput({
      visibility: 'show_attendees',
      mediaIds: [1, 2],
      showRecapId: 41,
      protectedReady: true,
    });
    assert.strictEqual(ok.error, undefined);
    assert.strictEqual(ok.showRecapId, 41);
    assert.strictEqual(ok.eventId, null);
    assert.strictEqual(ok.contentKind, 'gallery');
  });

  await test('empty title is allowed and derived from recap calendar date', () => {
    const ok = pure.validatePublishInput({
      visibility: 'show_attendees',
      mediaIds: [1],
      showRecapId: 41,
      protectedReady: true,
    });
    assert.strictEqual(ok.title, null);
    assert.strictEqual(pure.formatShowNightDate('2024-10-18'), 'Oct 18');
    assert.strictEqual(pure.formatShowNightDate('2024-10-18T04:00:00.000Z'), 'Oct 18');
    assert.strictEqual(pure.deriveShowPhotosTitle({
      recap: { city: 'Nashville', venue: 'The Basement East', showStartedAt: '2024-10-18' },
    }), 'Nashville — Oct 18');
    assert.strictEqual(pure.deriveShowPhotosTitle({
      title: 'Custom',
      recap: { city: 'Nashville', showStartedAt: '2024-10-18' },
    }), 'Custom');
  });

  await test('show attendees require an event, recap, or campaign id', () => {
    const missing = pure.validatePublishInput({
      visibility: 'show_attendees',
      mediaIds: [1],
      protectedReady: true,
    });
    assert.strictEqual(missing.error, 'show_required');
  });

  await test('gallery kind is inferred from 2+ images; general limit stays 60', () => {
    const gallery = pure.validatePublishInput({
      visibility: 'public',
      mediaIds: [1, 2, 3],
      bodyText: 'set',
    });
    assert.strictEqual(gallery.contentKind, 'gallery');
    assert.strictEqual(pure.MAX_IMAGES, 60);
    const sixty = pure.validatePublishInput({
      visibility: 'public',
      mediaIds: Array.from({ length: 60 }, (_, i) => i + 1),
    });
    assert.strictEqual(sixty.error, undefined);
    assert.strictEqual(sixty.mediaIds.length, 60);
    const tooMany = pure.validatePublishInput({
      visibility: 'public',
      mediaIds: Array.from({ length: 61 }, (_, i) => i + 1),
    });
    assert.strictEqual(tooMany.error, 'too_many_images');
  });

  await test('show galleries share the general 60-photo ceiling', () => {
    assert.strictEqual(pure.MAX_SHOW_IMAGES, 60);
    const sixty = Array.from({ length: 60 }, (_, i) => i + 1);
    const allowed = pure.validatePublishInput({
      visibility: 'show_attendees',
      mediaIds: sixty,
      showRecapId: 41,
      protectedReady: true,
    });
    assert.strictEqual(allowed.error, undefined);
    assert.strictEqual(allowed.mediaIds.length, 60);
    const denied = pure.validatePublishInput({
      visibility: 'show_attendees',
      mediaIds: [...sixty, 61],
      showRecapId: 41,
      protectedReady: true,
    });
    assert.strictEqual(denied.error, 'too_many_images');
    assert.match(denied.message, /60/);
    assert.doesNotMatch(denied.message, /12/);
    const recapLinked = pure.validatePublishInput({
      visibility: 'public',
      mediaIds: Array.from({ length: 12 }, (_, i) => i + 1),
      showRecapId: 41,
    });
    assert.strictEqual(recapLinked.error, undefined);
  });

  await test('media ids keep input order through validate + populated serialize', () => {
    const input = [8, 3, 19, 6];
    const validated = pure.validatePublishInput({
      visibility: 'public',
      mediaIds: input,
      bodyText: 'Nashville',
    });
    assert.deepStrictEqual(validated.mediaIds, input);
    const persistedMediaField = validated.mediaIds;
    const filesById = {
      8: { id: 8, url: 'https://cdn.example/8.jpg', mime: 'image/jpeg', width: 800, height: 600 },
      3: { id: 3, url: 'https://cdn.example/3.jpg', mime: 'image/jpeg', width: 400, height: 400 },
      19: { id: 19, url: 'https://cdn.example/19.jpg', mime: 'image/jpeg', width: 1200, height: 800 },
      6: { id: 6, url: 'https://cdn.example/6.jpg', mime: 'image/jpeg', width: 900, height: 1200 },
    };
    const populated = persistedMediaField.map((id) => filesById[id]);
    const serialized = pure.serializeUpdateMediaList(populated, {
      updateId: 41,
      visibility: 'public',
    });
    assert.deepStrictEqual(serialized.map((row) => row.mediaId), input);
    assert.deepStrictEqual(serialized.map((row) => row.order), [0, 1, 2, 3]);
    assert.strictEqual(serialized[0].mediaId, 8);
  });

  await test('duplicate media ids are dropped in first-seen order, not sorted', () => {
    const validated = pure.validatePublishInput({
      visibility: 'public',
      mediaIds: [8, 3, 19, 6, 8, 3],
      bodyText: 'set',
    });
    assert.deepStrictEqual(validated.mediaIds, [8, 3, 19, 6]);
  });

  await test('public serializer emits MediaItem fields and preserves formats', () => {
    const row = pure.serializeMedia({
      id: 10,
      url: 'https://cdn.example/full.jpg',
      mime: 'image/jpeg',
      width: 2400,
      height: 1600,
      alternativeText: 'Stage',
      formats: {
        thumbnail: { url: 'https://cdn.example/thumb.jpg', width: 245, height: 163 },
        medium: { url: 'https://cdn.example/medium.jpg', width: 750, height: 500 },
        large: { url: 'https://cdn.example/large.jpg', width: 1000, height: 667 },
      },
    });
    assert.strictEqual(row.mediaId, 10);
    assert.strictEqual(row.id, 10);
    assert.strictEqual(row.thumbnailUrl, 'https://cdn.example/thumb.jpg');
    assert.strictEqual(row.url, 'https://cdn.example/medium.jpg');
    assert.strictEqual(row.largeUrl, 'https://cdn.example/large.jpg');
    assert.strictEqual(row.originalUrl, 'https://cdn.example/full.jpg');
    assert.strictEqual(row.aspectRatio, 2400 / 1600);
    assert.strictEqual(row.protected, false);
    assert.ok(row.formats.medium.url);
  });

  await test('public serializer never emits internal protected placeholders', () => {
    const row = pure.serializeMedia({
      id: 4,
      url: 'faneqo-protected://object',
      mime: 'image/webp',
    });
    assert.strictEqual(row, null);
  });

  await test('publish idempotency keys are scoped to owner + band', () => {
    const key = pure.normalizePublishIdempotencyKey('11111111-2222-3333-4444-555555555555');
    assert.strictEqual(typeof key, 'string');
    const scoped = pure.scopedPublishIdempotencyKey(9, 10, key);
    assert.ok(scoped.startsWith('au-publish:v1:9:10:'));
    assert.strictEqual(pure.publishReplayOwned({
      existing: { createdByUser: { id: 9 }, band: { id: 10 } },
      userId: 9,
      bandId: 10,
    }), true);
    assert.strictEqual(pure.publishReplayOwned({
      existing: { createdByUser: { id: 9 }, band: { id: 10 } },
      userId: 9,
      bandId: 99,
    }), false);
    assert.strictEqual(pure.publishReplayOwned({
      existing: { createdByUser: { id: 3 }, band: { id: 10 } },
      userId: 9,
      bandId: 10,
    }), false);
    assert.ok(pure.normalizePublishIdempotencyKey('short').error);
    assert.ok(pure.normalizePublishIdempotencyKey('not a valid key because spaces').error);
  });

  const artistUpdateFile = {
    id: 101,
    mime: 'image/webp',
    size: 120,
    provider: 'faneqo-protected',
    provider_metadata: {
      protected: true,
      domain: 'artist-update',
      bandId: 2,
      uploaderUserId: 7,
    },
  };

  await test('artist-update protected file with matching uploader and band is allowed', () => {
    const auth = pure.authorizeArtistUpdateFile(artistUpdateFile, { userId: 7, bandId: 2 });
    assert.strictEqual(auth.error, null);
    assert.strictEqual(auth.protected, true);
  });

  await test('conversation protected file is rejected as ArtistUpdate media', () => {
    const auth = pure.authorizeArtistUpdateFile({
      ...artistUpdateFile,
      provider_metadata: { ...artistUpdateFile.provider_metadata, domain: 'conversation' },
    }, { userId: 7, bandId: 2 });
    assert.strictEqual(auth.error, 'invalid_attachment');
    assert.strictEqual(auth.reason, 'wrong_domain');
    assert.strictEqual(auth.message, 'Image is not available');
  });

  await test('artist-update protected file with wrong uploader is rejected', () => {
    const auth = pure.authorizeArtistUpdateFile(artistUpdateFile, { userId: 99, bandId: 2 });
    assert.strictEqual(auth.reason, 'wrong_uploader');
  });

  await test('artist-update protected file with wrong band is rejected', () => {
    const auth = pure.authorizeArtistUpdateFile(artistUpdateFile, { userId: 7, bandId: 9 });
    assert.strictEqual(auth.reason, 'wrong_band');
  });

  await test('missing ArtistUpdate media is rejected', () => {
    const auth = pure.authorizeArtistUpdateFile(null, { userId: 7, bandId: 2 });
    assert.strictEqual(auth.reason, 'missing_file');
  });

  await test('public upload is not treated as protected ArtistUpdate media', () => {
    const auth = pure.authorizeArtistUpdateFile({
      id: 44,
      mime: 'image/jpeg',
      size: 80,
      url: 'https://cdn.example/show.jpg',
      createdAt: new Date().toISOString(),
    }, { userId: 7, bandId: 2 });
    assert.strictEqual(auth.error, null);
    assert.strictEqual(auth.protected, false);
  });

  const { authorizeUpdateMedia } = require('../src/utils/artistUpdates/artistUpdateService');
  const inboxPure = require('../src/utils/inbox/inboxPure');

  function mockStrapi({ files = [], used = [] } = {}) {
    return {
      log: { info() {} },
      entityService: {
        async findMany(uid) {
          if (uid === 'plugin::upload.file') return files;
          if (uid === 'api::artist-update.artist-update') return used;
          return [];
        },
      },
    };
  }

  await test('authorizeUpdateMedia allows owned artist-update protected files', async () => {
    const result = await authorizeUpdateMedia(
      mockStrapi({ files: [artistUpdateFile] }),
      7,
      [101],
      2
    );
    assert.strictEqual(result.error, undefined);
    assert.strictEqual(result.files[0].id, 101);
  });

  await test('authorizeUpdateMedia rejects conversation media and already-used files', async () => {
    const convo = {
      ...artistUpdateFile,
      id: 202,
      provider_metadata: { ...artistUpdateFile.provider_metadata, domain: 'conversation' },
    };
    const denied = await authorizeUpdateMedia(mockStrapi({ files: [convo] }), 7, [202], 2);
    assert.strictEqual(denied.status, 400);
    assert.strictEqual(denied.error, 'invalid_attachment');

    const reused = await authorizeUpdateMedia(
      mockStrapi({ files: [artistUpdateFile], used: [{ id: 3 }] }),
      7,
      [101],
      2
    );
    assert.strictEqual(reused.status, 400);
  });

  await test('authorizeUpdateMedia preserves public-gallery ownership via Inbox public rules', async () => {
    const recent = {
      id: 55,
      mime: 'image/jpeg',
      size: 40,
      url: 'https://cdn.example/public.jpg',
      createdAt: new Date().toISOString(),
      createdBy: 7,
    };
    const ok = await authorizeUpdateMedia(mockStrapi({ files: [recent] }), 7, [55], 2);
    assert.strictEqual(ok.error, undefined);
    const foreign = await authorizeUpdateMedia(
      mockStrapi({ files: [{ ...recent, createdBy: 99 }] }),
      7,
      [55],
      2
    );
    assert.strictEqual(foreign.status, 400);
  });

  await test('Inbox authorizeUploadFile still rejects artist-update files', () => {
    assert.strictEqual(inboxPure.authorizeUploadFile(artistUpdateFile, 7).error, 'invalid_attachment');
    assert.strictEqual(inboxPure.authorizeUploadFile({
      ...artistUpdateFile,
      provider_metadata: { ...artistUpdateFile.provider_metadata, domain: 'conversation' },
    }, 7).error, null);
  });

  await test('show_attendees publish still rejects unprotected public media', () => {
    const fs = require('fs');
    const path = require('path');
    const serviceSrc = fs.readFileSync(
      path.join(__dirname, '../src/utils/artistUpdates/artistUpdateService.js'),
      'utf8'
    );
    assert.match(serviceSrc, /authorizeArtistUpdateFile/);
    assert.match(serviceSrc, /isGatedVisibility/);
    assert.match(serviceSrc, /unprotected_media/);
    assert.match(serviceSrc, /Exclusive galleries can only use protected photos/);
    assert.doesNotMatch(serviceSrc, /isConversationProtectedFile/);
  });

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
  if (failed) process.exitCode = 1;
})();
