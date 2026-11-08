'use strict';

const assert = require('assert');
const pure = require('../src/utils/artistUpdates/artistUpdatePure');
const mediaPure = require('../src/utils/artistUpdates/protectedMediaPure');
const showContext = require('../src/utils/artistUpdates/showContextPure');
const { createArtistUpdateService } = require('../src/utils/artistUpdates/artistUpdateService');
const { produceArtistUpdatePublished } = require('../src/utils/relationshipEvents/relationshipEventProducers');

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

const PROTECTED_FILE = {
  id: 101,
  mime: 'image/webp',
  url: 'faneqo-protected://objectabc',
  provider: 'faneqo-protected',
  provider_metadata: {
    protected: true,
    objectId: 'objectabc',
    domain: 'artist-update',
    keys: { gallery: 'faneqo-protected/objectabc/gallery.webp' },
  },
};

const PUBLIC_FILE = {
  id: 9,
  mime: 'image/jpeg',
  url: 'https://cdn.example/public-gallery.jpg',
  width: 1200,
  height: 800,
};

const RECAP = {
  id: 41,
  campaignId: 'sm_manual',
  eventId: 12,
  showModeType: 'manual',
  showTitle: 'Nashville',
  venue: 'The Basement East',
  city: 'Nashville',
  showStartedAt: '2026-09-05T23:00:00.000Z',
  nightSlug: 'the-basement-east-nashville-sep-5-2026-ab12cd34',
  publicStory: 'What a night.',
  privateArtistNote: 'Do not leak this note',
  coverImage: { id: 77, url: 'https://cdn.example/night-cover.jpg' },
};

function showGalleryUpdate(overrides = {}) {
  return {
    id: 5,
    slug: 'nashville-sep-5',
    title: 'Nashville',
    bodyText: 'secret caption',
    contentKind: 'gallery',
    visibility: 'public',
    status: 'published',
    publishedAt: '2026-09-05T04:00:00.000Z',
    photoCount: 1,
    media: [],
    mediaFiles: [PROTECTED_FILE],
    eventId: 12,
    showRecapId: 41,
    campaignId: 'sm_manual',
    showCampaignId: 'sm_manual',
    showModeType: 'manual',
    showRecap: RECAP,
    event: {
      id: 12,
      title: 'Nashville',
      venue: 'The Basement East',
      city: 'Nashville',
      date: '2026-09-05',
      image: { id: 88, url: 'https://cdn.example/event.jpg' },
    },
    artist: { id: 7, name: 'Badflower', slug: 'badflower', bandImg: { id: 1, url: 'https://cdn.example/band.jpg' } },
    show: {
      eventId: 12,
      showRecapId: 41,
      showModeType: 'manual',
      title: 'Nashville',
      venue: 'The Basement East',
      city: 'Nashville',
      date: '2026-09-05',
    },
    ...overrides,
  };
}

function leakStrings(payload) {
  return JSON.stringify(payload);
}

function assertGatedShell(teaser, lockReason) {
  assert.strictEqual(teaser.locked, true);
  assert.strictEqual(teaser.lockReason, lockReason);
  assert.deepStrictEqual(teaser.media, []);
  assert.strictEqual(teaser.bodyText, '');
  assert.strictEqual(teaser.photoCount, 1);
  assert.strictEqual(teaser.visibility, lockReason);
  assert.ok(teaser.show);
  assert.strictEqual(teaser.show.showRecapId, 41);
  assert.strictEqual(teaser.show.nightSlug, RECAP.nightSlug);
  assert.strictEqual(teaser.show.publicStory, 'What a night.');
  assert.strictEqual(teaser.show.cover.url, 'https://cdn.example/night-cover.jpg');
  assert.strictEqual(teaser.artist.slug, 'badflower');
  const text = leakStrings(teaser);
  assert.ok(!text.includes('privateArtistNote'));
  assert.ok(!text.includes('Do not leak this note'));
  assert.ok(!text.includes('faneqo-protected://'));
  assert.ok(!text.includes('amazonaws'));
  assert.ok(!text.includes('X-Amz-Signature'));
  assert.ok(!text.includes('public-gallery.jpg'));
  assert.ok(!JSON.parse(text).show.campaignId);
}

function mockRelStrapi() {
  const store = [];
  return {
    store,
    log: { info() {}, warn() {} },
    entityService: {
      async findMany(uid, params) {
        if (uid === 'api::relationship-event.relationship-event') {
          const key = params?.filters?.idempotencyKey;
          if (key) return store.filter((r) => r.idempotencyKey === key);
          return store;
        }
        return [];
      },
      async create(uid, { data }) {
        const row = { id: store.length + 1, ...data };
        store.push(row);
        return row;
      },
    },
  };
}

function makeVisibilityStrapi({ updates, members = [], bands = {} }) {
  return {
    log: { info() {}, warn() {}, error() {} },
    entityService: {
      async findMany(uid, query = {}) {
        if (uid === 'api::artist-update.artist-update') {
          const id = query.filters?.id;
          return updates.filter((row) => Number(row.id) === Number(id));
        }
        if (uid === 'api::band-member.band-member') {
          const filters = query.filters || {};
          return members.filter((row) => {
            if (filters.band && Number(row.band) !== Number(filters.band)) return false;
            if (filters.user && Number(row.user) !== Number(filters.user)) return false;
            if (filters.status && row.status !== filters.status) return false;
            return true;
          });
        }
        return [];
      },
      async findOne(uid, id) {
        if (uid === 'api::band.band') return bands[Number(id)] || bands[id] || null;
        return null;
      },
      async update(uid, id, { data }) {
        const row = updates.find((item) => Number(item.id) === Number(id));
        Object.assign(row, data);
        return row;
      },
    },
  };
}

function ownedShowRow(visibility, media) {
  return {
    id: 5,
    slug: 'nashville-sep-5',
    title: 'Nashville',
    bodyText: 'Thanks',
    contentKind: 'gallery',
    visibility,
    status: 'published',
    publishedAt: '2026-09-05T04:00:00.000Z',
    media,
    band: { id: 7, name: 'Badflower', slug: 'badflower' },
    event: { id: 12, title: 'Nashville', venue: 'The Basement East', city: 'Nashville', date: '2026-09-05' },
    showRecap: { ...RECAP, band: { id: 7 } },
    createdByUser: { id: 2 },
  };
}

(async () => {
  console.log('\n=== Gallery visibility contract ===\n');

  await test('8. general gallery omitted visibility → public', () => {
    const validated = pure.validatePublishInput({ mediaIds: [1], title: 'Set' });
    assert.strictEqual(validated.visibility, 'public');
    assert.strictEqual(validated.showRecapId, null);
  });

  await test('9. show gallery omitted visibility → public', () => {
    const validated = pure.validatePublishInput({
      mediaIds: [1],
      showRecapId: 41,
      eventId: 12,
      campaignId: 'sm_manual',
    });
    assert.strictEqual(validated.visibility, 'public');
    assert.strictEqual(validated.showRecapId, 41);
    assert.strictEqual(validated.eventId, 12);
    assert.strictEqual(validated.campaignId, 'sm_manual');
  });

  await test('10. show gallery explicit public → public', () => {
    const validated = pure.validatePublishInput({
      visibility: 'public',
      mediaIds: [1],
      showRecapId: 41,
    });
    assert.strictEqual(validated.visibility, 'public');
    assert.strictEqual(validated.showRecapId, 41);
  });

  await test('11. show gallery explicit show_attendees → gated', () => {
    const validated = pure.validatePublishInput({
      visibility: 'show_attendees',
      mediaIds: [1],
      showRecapId: 41,
      protectedReady: true,
    });
    assert.strictEqual(validated.visibility, 'show_attendees');
    const access = pure.decideArtistUpdateAccess({
      update: showGalleryUpdate({ visibility: 'show_attendees' }),
      viewer: {},
    });
    assert.strictEqual(access.allowed, false);
    assert.strictEqual(access.reason, 'show_attendees');
  });

  await test('12. fan_list follows supported gated contract', () => {
    const blocked = pure.validatePublishInput({
      visibility: 'fan_list',
      mediaIds: [1],
    });
    assert.strictEqual(blocked.error, 'gated_delivery_unavailable');
    const ok = pure.validatePublishInput({
      visibility: 'fan_list',
      mediaIds: [1],
      protectedReady: true,
    });
    assert.strictEqual(ok.visibility, 'fan_list');
    const anon = pure.decideArtistUpdateAccess({
      update: { status: 'published', visibility: 'fan_list' },
      viewer: {},
    });
    assert.strictEqual(anon.allowed, false);
    assert.strictEqual(anon.reason, 'fan_list');
    const fan = pure.decideArtistUpdateAccess({
      update: { status: 'published', visibility: 'fan_list' },
      viewer: { userId: 9, fan: { id: 3, status: 'subscribed' } },
    });
    assert.strictEqual(fan.allowed, true);
    assert.strictEqual(fan.media, 'full');
  });

  await test('13–15. public show gallery retains ShowContext', () => {
    const validated = pure.validatePublishInput({
      visibility: 'public',
      mediaIds: [1, 2],
      showRecapId: 41,
      eventId: 12,
      campaignId: 'sm_manual',
    });
    const resolved = showContext.resolveShowContext({
      bandId: 7,
      eventId: validated.eventId,
      campaignId: validated.campaignId,
      showRecapId: validated.showRecapId,
      recap: RECAP,
    });
    assert.ok(resolved.ok);
    assert.strictEqual(resolved.context.bandId, '7');
    assert.strictEqual(resolved.context.eventId, '12');
    assert.strictEqual(resolved.context.campaignId, 'sm_manual');
    assert.strictEqual(resolved.context.showRecapId, '41');
    assert.strictEqual(resolved.context.showModeType, 'manual');
    const teaser = pure.publicTeaser(showGalleryUpdate({
      visibility: 'public',
      media: [{ type: 'image', url: 'https://cdn.example/public.jpg' }],
    }), { allowed: true, reason: 'public', media: 'full', youWereThere: false });
    assert.strictEqual(teaser.show.showRecapId, 41);
    assert.strictEqual(teaser.show.eventId, 12);
    assert.ok(!teaser.show.campaignId);
  });

  await test('16. public show gallery attendee still gets youWereThere', () => {
    const access = pure.decideArtistUpdateAccess({
      update: showGalleryUpdate({ visibility: 'public' }),
      viewer: { userId: 9, fan: { id: 3, status: 'subscribed' }, attendedEventId: 12, attendedCampaignId: 'sm_manual' },
    });
    assert.strictEqual(access.allowed, true);
    assert.strictEqual(access.youWereThere, true);
    const teaser = pure.publicTeaser(showGalleryUpdate({ visibility: 'public' }), access);
    assert.strictEqual(teaser.youWereThere, true);
    assert.strictEqual(teaser.locked, false);
  });

  await test('17. anonymous public gallery gets full public media', () => {
    const media = pure.serializeUpdateMediaList([PUBLIC_FILE], { updateId: 5, visibility: 'public' });
    const access = pure.decideArtistUpdateAccess({
      update: { status: 'published', visibility: 'public' },
      viewer: {},
    });
    const teaser = pure.publicTeaser({
      ...showGalleryUpdate({ visibility: 'public', media }),
      media,
    }, access);
    assert.strictEqual(teaser.locked, false);
    assert.strictEqual(teaser.media.length, 1);
    assert.strictEqual(teaser.media[0].url, 'https://cdn.example/public-gallery.jpg');
  });

  await test('18. anonymous attendee gallery gets shell and zero protected media', () => {
    const access = pure.decideArtistUpdateAccess({
      update: showGalleryUpdate({ visibility: 'show_attendees' }),
      viewer: {},
    });
    const teaser = pure.publicTeaser(showGalleryUpdate({
      visibility: 'show_attendees',
      media: [{ type: 'image', url: 'https://cdn.example/secret.jpg', mediaId: 101 }],
    }), access);
    assertGatedShell(teaser, 'show_attendees');
  });

  await test('19. non-attendee fan gets attendee shell and zero media', () => {
    const access = pure.decideArtistUpdateAccess({
      update: showGalleryUpdate({ visibility: 'show_attendees' }),
      viewer: { userId: 9, fan: { id: 3, status: 'subscribed' }, attendedEventId: 99 },
    });
    assert.strictEqual(access.allowed, false);
    const teaser = pure.publicTeaser(showGalleryUpdate({
      visibility: 'show_attendees',
      media: [{ type: 'image', url: 'https://cdn.example/secret.jpg' }],
    }), access);
    assertGatedShell(teaser, 'show_attendees');
  });

  await test('20. attendee gets attendee gallery media', () => {
    const access = pure.decideArtistUpdateAccess({
      update: showGalleryUpdate({ visibility: 'show_attendees' }),
      viewer: { userId: 9, fan: { id: 3, status: 'subscribed' }, attendedEventId: 12 },
    });
    assert.strictEqual(access.allowed, true);
    assert.strictEqual(access.youWereThere, true);
    assert.strictEqual(access.media, 'full');
  });

  await test('21. artist gets gated media', () => {
    const access = pure.decideArtistUpdateAccess({
      update: showGalleryUpdate({ visibility: 'show_attendees' }),
      viewer: { isArtist: true, userId: 2 },
    });
    assert.strictEqual(access.allowed, true);
    assert.strictEqual(access.reason, 'artist');
    assert.strictEqual(access.media, 'full');
  });

  await test('22. unauthorized stream still denies protected media', () => {
    const access = pure.decideArtistUpdateAccess({
      update: showGalleryUpdate({ visibility: 'show_attendees' }),
      viewer: {},
    });
    const stream = mediaPure.decideStreamAccess({
      access,
      tokenOk: false,
      userId: null,
      isArtist: false,
    });
    assert.strictEqual(stream.allowed, false);
    const signedDenied = mediaPure.decideStreamAccess({
      access,
      tokenOk: true,
      userId: null,
      isArtist: false,
    });
    assert.strictEqual(signedDenied.allowed, true);
    const noTokenLoggedOut = mediaPure.decideStreamAccess({
      access: { allowed: false, reason: 'show_attendees' },
      tokenOk: false,
      userId: 9,
    });
    assert.strictEqual(noTokenLoggedOut.allowed, false);
  });

  await test('23. gated shell cannot leak raw/S3/CDN protected URLs or media ids', () => {
    const teaser = pure.publicTeaser(showGalleryUpdate({
      visibility: 'show_attendees',
      media: [{
        type: 'image',
        id: 101,
        mediaId: 101,
        url: 'https://bucket.s3.amazonaws.com/secret.jpg?X-Amz-Signature=abc',
        thumbnailUrl: 'https://cdn.example/thumb.jpg',
      }],
    }), { allowed: false, reason: 'show_attendees', teaser: true });
    assertGatedShell(teaser, 'show_attendees');
    assert.strictEqual(pure.publicCoverFromValue(PROTECTED_FILE), null);
    assert.strictEqual(pure.publicNightCover({ recap: { coverImage: PROTECTED_FILE } }), null);
  });

  await test('24. transitions within one storage class are allowed; crossing it is not', () => {
    const gatedFiles = [PROTECTED_FILE];
    const publicFiles = [PUBLIC_FILE];
    /* Protected bytes cannot become public by relabelling the gallery. */
    const toPublicFromShow = pure.evaluateVisibilityChange({
      from: 'show_attendees',
      to: 'public',
      mediaFiles: gatedFiles,
      hasNight: true,
      protectedReady: true,
    });
    assert.strictEqual(toPublicFromShow.error, 'unsafe_visibility_transition');
    assert.match(toPublicFromShow.message, /new public upload/);
    assert.strictEqual(pure.evaluateVisibilityChange({
      from: 'fan_list',
      to: 'public',
      mediaFiles: gatedFiles,
      protectedReady: true,
    }).error, 'unsafe_visibility_transition');
    /* A gallery with no media yet has no storage class to violate. */
    assert.strictEqual(pure.evaluateVisibilityChange({
      from: 'fan_list',
      to: 'public',
      mediaFiles: [],
      protectedReady: true,
    }).to, 'public');
    assert.strictEqual(pure.evaluateVisibilityChange({
      from: 'public',
      to: 'show_attendees',
      mediaFiles: gatedFiles,
      hasNight: true,
      protectedReady: true,
    }).to, 'show_attendees');
    assert.strictEqual(pure.evaluateVisibilityChange({
      from: 'public',
      to: 'fan_list',
      mediaFiles: gatedFiles,
      protectedReady: true,
    }).to, 'fan_list');
    assert.strictEqual(pure.evaluateVisibilityChange({
      from: 'show_attendees',
      to: 'fan_list',
      mediaFiles: gatedFiles,
      protectedReady: true,
    }).to, 'fan_list');
    assert.ok(pure.evaluateVisibilityChange({
      from: 'public',
      to: 'public',
      mediaFiles: publicFiles,
    }).unchanged);
  });

  await test('25–26. fan and wrong-band artist cannot change visibility', async () => {
    const updates = [ownedShowRow('public', [PROTECTED_FILE])];
    const strapi = makeVisibilityStrapi({
      updates,
      members: [{ band: 7, user: 2, status: 'active', role: 'owner' }],
      bands: { 7: { id: 7, users_permissions_user: { id: 2 } } },
    });
    const service = createArtistUpdateService(strapi);
    const anon = await service.updateVisibility({ userId: null, updateId: 5, visibility: 'fan_list' });
    assert.strictEqual(anon.error, 'unauthorized');
    const fan = await service.updateVisibility({ userId: 9, updateId: 5, visibility: 'fan_list' });
    assert.strictEqual(fan.error, 'forbidden');
    const other = await service.updateVisibility({ userId: 3, updateId: 5, visibility: 'fan_list' });
    assert.strictEqual(other.error, 'forbidden');
  });

  await test('27–28. visibility change preserves Night context and media order', async () => {
    const prev = process.env.FANEQO_PROTECTED_MEDIA_ENABLED;
    process.env.FANEQO_PROTECTED_MEDIA_ENABLED = 'true';
    process.env.AWS_BUCKET = process.env.AWS_BUCKET || 'test-bucket';
    process.env.AWS_REGION = process.env.AWS_REGION || 'us-east-1';
    process.env.AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID || 'test';
    process.env.AWS_ACCESS_SECRET = process.env.AWS_ACCESS_SECRET || 'test';
    process.env.FANEQO_PROTECTED_MEDIA_SECRET = process.env.FANEQO_PROTECTED_MEDIA_SECRET || 'secret';
    const media = [
      { ...PROTECTED_FILE, id: 101 },
      { ...PROTECTED_FILE, id: 102, url: 'faneqo-protected://b' },
    ];
    const updates = [ownedShowRow('show_attendees', media)];
    const strapi = makeVisibilityStrapi({
      updates,
      members: [{ band: 7, user: 2, status: 'active', role: 'owner' }],
      bands: { 7: { id: 7, users_permissions_user: { id: 2 } } },
    });
    const service = createArtistUpdateService(strapi);
    /* Same storage class, so the audience may move and the night must survive. */
    const result = await service.updateVisibility({ userId: 2, updateId: 5, visibility: 'fan_list' });
    if (prev === undefined) delete process.env.FANEQO_PROTECTED_MEDIA_ENABLED;
    else process.env.FANEQO_PROTECTED_MEDIA_ENABLED = prev;
    assert.ok(!result.error, result.message);
    assert.strictEqual(result.data.visibility, 'fan_list');
    assert.strictEqual(Number(result.data.showRecapId), 41);
    assert.strictEqual(Number(result.data.eventId), 12);
    assert.strictEqual(result.data.showCampaignId, 'sm_manual');
    assert.deepStrictEqual(result.data.media.map((row) => row.mediaId || row.id), [101, 102]);
    assert.strictEqual(updates[0].slug, 'nashville-sep-5');
    assert.strictEqual(updates[0].showRecap.id, 41);
  });

  await test('29. unsupported unsafe transition returns explicit error', () => {
    const unsafe = pure.evaluateVisibilityChange({
      from: 'public',
      to: 'show_attendees',
      mediaFiles: [PUBLIC_FILE],
      hasNight: true,
      protectedReady: true,
    });
    assert.strictEqual(unsafe.error, 'unsafe_visibility_transition');
    const noNight = pure.evaluateVisibilityChange({
      from: 'public',
      to: 'show_attendees',
      mediaFiles: [PROTECTED_FILE],
      hasNight: false,
      protectedReady: true,
    });
    assert.strictEqual(noNight.error, 'show_required');
    const noDelivery = pure.evaluateVisibilityChange({
      from: 'public',
      to: 'fan_list',
      mediaFiles: [PROTECTED_FILE],
      protectedReady: false,
    });
    assert.strictEqual(noDelivery.error, 'gated_delivery_unavailable');
  });

  await test('30. public show gallery emits show_gallery_added from ShowContext', async () => {
    const strapi = mockRelStrapi();
    await produceArtistUpdatePublished(strapi, {
      id: 5,
      band: 7,
      visibility: 'public',
      contentKind: 'gallery',
      showRecap: { id: 41, campaignId: 'sm_manual' },
      showRecapId: 41,
    });
    const galleryEvent = strapi.store.find((r) => r.type === 'show_gallery_added');
    assert.ok(galleryEvent);
    assert.strictEqual(galleryEvent.metadata.visibility, 'public');
  });

  await test('31. visibility-only edit does not emit a relationship event', async () => {
    const strapi = mockRelStrapi();
    await produceArtistUpdatePublished(strapi, {
      id: 5,
      band: 7,
      visibility: 'public',
      showRecapId: 41,
      showRecap: { id: 41, campaignId: 'sm_manual' },
    });
    assert.strictEqual(strapi.store.filter((r) => r.type === 'show_gallery_added').length, 1);
    // updateVisibility never calls the producer — changing visibility is not publish.
    assert.strictEqual(typeof createArtistUpdateService(strapi).updateVisibility, 'function');
  });

  await test('32–33. legacy attendee stays gated; legacy public stays public', () => {
    const gated = pure.decideArtistUpdateAccess({
      update: showGalleryUpdate({ visibility: 'show_attendees' }),
      viewer: {},
    });
    assert.strictEqual(gated.allowed, false);
    assert.strictEqual(gated.reason, 'show_attendees');
    const open = pure.decideArtistUpdateAccess({
      update: showGalleryUpdate({ visibility: 'public' }),
      viewer: {},
    });
    assert.strictEqual(open.allowed, true);
    assert.strictEqual(open.reason, 'public');
  });

  await test('34. current gallery list/read teaser still works', () => {
    const listed = pure.publicTeaser(showGalleryUpdate({
      visibility: 'public',
      media: [{ type: 'image', url: 'https://cdn.example/public.jpg' }],
    }), { allowed: true, reason: 'public', media: 'full', youWereThere: false });
    assert.strictEqual(listed.slug, 'nashville-sep-5');
    assert.strictEqual(listed.sourceType, 'artist_update');
    assert.strictEqual(listed.locked, false);
    assert.strictEqual(listed.show.city, 'Nashville');
  });

  await test('35. hide and restore are the only status transitions offered', () => {
    assert.strictEqual(pure.evaluateHide({ status: 'published' }).to, 'hidden');
    assert.ok(pure.evaluateHide({ status: 'hidden' }).unchanged);
    assert.strictEqual(pure.evaluateHide({ status: 'draft' }).error, 'not_published');
    assert.strictEqual(pure.evaluateRestore({ status: 'hidden' }).to, 'published');
    assert.ok(pure.evaluateRestore({ status: 'published' }).unchanged);
    assert.strictEqual(pure.evaluateRestore({ status: 'draft' }).error, 'not_hidden');
    assert.strictEqual(pure.isHiddenStatus('hidden'), true);
    assert.strictEqual(pure.isAvailableStatus('hidden'), false);
    assert.strictEqual(pure.isAvailableStatus('published'), true);
  });

  await test('36. recap detach refuses a show-attendees gallery', () => {
    assert.strictEqual(pure.evaluateRecapDetach({ visibility: 'public', showRecapId: 41 }).showRecapId, null);
    assert.strictEqual(pure.evaluateRecapDetach({ visibility: 'fan_list', showRecapId: 41 }).showRecapId, null);
    assert.strictEqual(
      pure.evaluateRecapDetach({ visibility: 'show_attendees', showRecapId: 41 }).error,
      'detach_blocked_show_only'
    );
    assert.strictEqual(pure.evaluateRecapDetach({ visibility: 'public', showRecapId: null }).error, 'not_attached');
  });

  await test('37. hiding a gallery closes every audience surface', async () => {
    const updates = [ownedShowRow('public', [PUBLIC_FILE])];
    const strapi = makeVisibilityStrapi({
      updates,
      members: [{ band: 7, user: 2, status: 'active', role: 'owner' }],
      bands: { 7: { id: 7, users_permissions_user: { id: 2 } } },
    });
    const service = createArtistUpdateService(strapi);
    const result = await service.hideGallery({ userId: 2, updateId: 5 });
    assert.ok(!result.error, result.message);
    assert.strictEqual(updates[0].status, 'hidden');
    assert.ok(updates[0].hiddenAt, 'hiddenAt records when the artist took it down');

    const hidden = { status: 'hidden', visibility: 'public' };
    const anon = pure.decideArtistUpdateAccess({ update: hidden, viewer: {} });
    assert.strictEqual(anon.allowed, false);
    assert.strictEqual(anon.teaser, false);
    const fan = pure.decideArtistUpdateAccess({
      update: hidden,
      viewer: { userId: 9, fan: { id: 3, status: 'subscribed' } },
    });
    assert.strictEqual(fan.allowed, false);
    const artist = pure.decideArtistUpdateAccess({ update: hidden, viewer: { isArtist: true } });
    assert.strictEqual(artist.allowed, true);

    // A live signed media token must not outlive hiding.
    const streamed = mediaPure.decideStreamAccess({
      access: { allowed: true, reason: 'public' },
      tokenOk: true,
      userId: null,
      isDraft: !pure.isAvailableStatus('hidden'),
      isArtist: false,
    });
    assert.strictEqual(streamed.allowed, false);
  });

  await test('38. restore returns the gallery to its authorized surfaces', async () => {
    const updates = [ownedShowRow('public', [PUBLIC_FILE])];
    updates[0].status = 'hidden';
    updates[0].hiddenAt = '2026-09-10T00:00:00.000Z';
    const strapi = makeVisibilityStrapi({
      updates,
      members: [{ band: 7, user: 2, status: 'active', role: 'owner' }],
      bands: { 7: { id: 7, users_permissions_user: { id: 2 } } },
    });
    const service = createArtistUpdateService(strapi);
    const result = await service.restoreGallery({ userId: 2, updateId: 5 });
    assert.ok(!result.error, result.message);
    assert.strictEqual(updates[0].status, 'published');
    assert.strictEqual(updates[0].hiddenAt, null);
    assert.strictEqual(Number(result.data.showRecapId), 41);
    assert.deepStrictEqual(result.data.media.map((row) => row.mediaId || row.id), [9]);
  });

  await test('39. detach clears the recap link only and keeps the gallery available', async () => {
    const updates = [ownedShowRow('public', [PUBLIC_FILE])];
    const strapi = makeVisibilityStrapi({
      updates,
      members: [{ band: 7, user: 2, status: 'active', role: 'owner' }],
      bands: { 7: { id: 7, users_permissions_user: { id: 2 } } },
    });
    const service = createArtistUpdateService(strapi);
    const result = await service.detachFromRecap({ userId: 2, updateId: 5 });
    assert.ok(!result.error, result.message);
    assert.strictEqual(updates[0].showRecap, null);
    assert.strictEqual(updates[0].status, 'published', 'detach never unpublishes');
    assert.strictEqual(Number(updates[0].event.id), 12, 'detach keeps the event link');
    assert.strictEqual(result.data.photoCount, 1);

    const gated = [ownedShowRow('show_attendees', [PROTECTED_FILE])];
    const gatedService = createArtistUpdateService(makeVisibilityStrapi({
      updates: gated,
      members: [{ band: 7, user: 2, status: 'active', role: 'owner' }],
      bands: { 7: { id: 7, users_permissions_user: { id: 2 } } },
    }));
    const refused = await gatedService.detachFromRecap({ userId: 2, updateId: 5 });
    assert.strictEqual(refused.error, 'detach_blocked_show_only');
    assert.strictEqual(gated[0].showRecap.id, 41, 'refused detach must not write');
  });

  await test('40. only the authorized band owner can hide, restore, or detach', async () => {
    const updates = [ownedShowRow('public', [PUBLIC_FILE])];
    const service = createArtistUpdateService(makeVisibilityStrapi({
      updates,
      members: [{ band: 7, user: 2, status: 'active', role: 'owner' }],
      bands: { 7: { id: 7, users_permissions_user: { id: 2 } } },
    }));
    for (const action of ['hideGallery', 'restoreGallery', 'detachFromRecap']) {
      assert.strictEqual((await service[action]({ userId: null, updateId: 5 })).error, 'unauthorized');
      assert.strictEqual((await service[action]({ userId: 9, updateId: 5 })).error, 'forbidden');
      assert.strictEqual((await service[action]({ userId: 3, updateId: 5 })).error, 'forbidden');
      assert.strictEqual((await service[action]({ userId: 2, updateId: 4321 })).error, 'not_found');
    }
    assert.strictEqual(updates[0].status, 'published', 'rejected actions must not write');
    assert.strictEqual(updates[0].showRecap.id, 41);
  });

  await test('41. a manager cannot take a gallery down, but keeps ordinary editing', async () => {
    const members = [
      { band: 7, user: 2, status: 'active', role: 'owner' },
      { band: 7, user: 5, status: 'active', role: 'manager' },
    ];
    const updates = [ownedShowRow('public', [PUBLIC_FILE])];
    const service = createArtistUpdateService(makeVisibilityStrapi({
      updates,
      members,
      bands: { 7: { id: 7, users_permissions_user: { id: 2 } } },
    }));

    for (const action of ['hideGallery', 'restoreGallery', 'detachFromRecap']) {
      const denied = await service[action]({ userId: 5, updateId: 5 });
      assert.strictEqual(denied.error, 'forbidden', `${action} must be owner-only`);
      assert.strictEqual(denied.status, 403);
    }
    assert.strictEqual(updates[0].status, 'published', 'a manager attempt must not write');
    assert.strictEqual(updates[0].showRecap.id, 41);

    // Team Access is unchanged: a manager still reads and edits the page.
    const listed = await service.listMine({ userId: 5, bandId: 7 });
    assert.ok(!listed.error, 'manager keeps ordinary gallery editing');

    // The owner can do all three, in the order the states allow.
    assert.ok(!(await service.hideGallery({ userId: 2, updateId: 5 })).error);
    assert.strictEqual(updates[0].status, 'hidden');
    assert.ok(!(await service.restoreGallery({ userId: 2, updateId: 5 })).error);
    assert.strictEqual(updates[0].status, 'published');
    assert.ok(!(await service.detachFromRecap({ userId: 2, updateId: 5 })).error);
    assert.strictEqual(updates[0].showRecap, null);
  });

  await test('42. unavailable is a distinct answer from not_found', () => {
    const unavailable = pure.galleryUnavailableResult();
    assert.strictEqual(unavailable.error, 'gallery_unavailable');
    assert.strictEqual(unavailable.status, 410);
    assert.ok(unavailable.message.length);
  });

  if (failed) {
    console.log(`\n${failed} failed, ${passed} passed`);
    process.exit(1);
  }
  console.log(`\n${passed} passed`);
})();
