'use strict';

const assert = require('assert');
const share = require('../src/utils/showMode/publicNightSharePure');
const { createPublicShareService } = require('../src/utils/showMode/publicShareService');
const mediaPure = require('../src/utils/artistUpdates/protectedMediaPure');

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
  },
};

const PUBLIC_FILE = {
  id: 9,
  mime: 'image/jpeg',
  url: 'https://cdn.example/public-gallery.jpg',
  width: 1200,
  height: 800,
  alternativeText: 'Crowd',
};

const COVER = {
  id: 77,
  url: 'https://cdn.example/night-cover.jpg',
  width: 1600,
  height: 900,
  alternativeText: 'Night',
};

const EVENT_IMAGE = {
  id: 88,
  url: 'https://cdn.example/event.jpg',
  width: 1400,
  height: 800,
};

const BAND_IMG = {
  id: 1,
  url: 'https://cdn.example/band.jpg',
  width: 400,
  height: 400,
};

const HERO = {
  id: 55,
  url: 'https://cdn.example/night-hero.jpg',
  width: 2000,
  height: 1400,
  alternativeText: 'Night hero',
};

function recapRow(overrides = {}) {
  return {
    id: 41,
    nightSlug: 'the-basement-east-nashville-sep-5-2026-ab12cd34',
    showTitle: 'Nashville',
    venue: 'The Basement East',
    city: 'Nashville',
    region: 'TN',
    country: 'US',
    timezone: 'America/Chicago',
    publicStory: 'Nashville was unreal tonight.',
    privateArtistNote: 'Do not leak this note',
    lineup: [{ name: 'Dead Poet Society', role: 'support', order: 1, bandId: 22 }],
    coverImage: COVER,
    heroImage: null,
    heroFocalX: null,
    heroFocalY: null,
    campaignId: 'sm_manual',
    eventId: 12,
    showModeType: 'manual',
    performanceStartsAt: '2026-09-05T23:00:00.000Z',
    performanceEndsAt: '2026-09-06T01:00:00.000Z',
    showStartedAt: '2026-09-05T23:00:00.000Z',
    recapGeneratedAt: '2026-09-06T08:00:00.000Z',
    checkedInShowCount: 147,
    showModeLastContext: { campaignId: 'sm_old' },
    metadata: { generatedBy: 'secret' },
    ...overrides,
  };
}

function bandRow() {
  return { id: 7, name: 'Badflower', slug: 'badflower', bandImg: BAND_IMG };
}

function publicUpdate(overrides = {}) {
  return {
    id: 5,
    slug: 'nashville-sep-5',
    title: 'From the pit',
    bodyText: 'Thanks Nashville',
    contentKind: 'gallery',
    visibility: 'public',
    status: 'published',
    publishedAt: '2026-09-05T04:10:00.000Z',
    media: [PUBLIC_FILE],
    band: bandRow(),
    event: {
      id: 12,
      title: 'Nashville',
      venue: 'The Basement East',
      city: 'Nashville',
      date: '2026-09-05',
      image: EVENT_IMAGE,
    },
    showRecap: recapRow(),
    createdByUser: { id: 2 },
    ...overrides,
  };
}

function gatedUpdate(overrides = {}) {
  return publicUpdate({
    id: 6,
    slug: 'attendee-only',
    visibility: 'show_attendees',
    bodyText: 'secret caption',
    media: [PROTECTED_FILE],
    ...overrides,
  });
}

function fanListUpdate(overrides = {}) {
  return publicUpdate({
    id: 8,
    slug: 'fan-list-set',
    visibility: 'fan_list',
    media: [PROTECTED_FILE],
    ...overrides,
  });
}

function makeStrapi({
  bands = [bandRow()],
  recaps = [recapRow()],
  updates = [publicUpdate(), gatedUpdate()],
  members = [],
  attendances = [],
  fans = [],
  events = {
    12: {
      id: 12,
      title: 'Nashville',
      venue: 'The Basement East',
      city: 'Nashville',
      state: 'TN',
      country: 'US',
      date: '2026-09-05',
      image: EVENT_IMAGE,
    },
  },
  attendanceCount = 147,
} = {}) {
  return {
    log: { info() {}, warn() {}, error() {} },
    service() {
      return {
        async getCheckInStats() {
          return { attendanceCount, newFanCheckIns: 9, knownFanCheckIns: 138 };
        },
      };
    },
    entityService: {
      async findMany(uid, query = {}) {
        const filters = query.filters || {};
        if (uid === 'api::band.band') {
          return bands.filter((row) => !filters.slug || row.slug === filters.slug).slice(0, query.limit || 50);
        }
        if (uid === 'api::show-recap.show-recap') {
          return recaps.filter((row) => {
            if (filters.band && Number(row.band?.id || 7) !== Number(filters.band)) return false;
            if (filters.nightSlug && row.nightSlug !== filters.nightSlug) return false;
            return true;
          }).slice(0, query.limit || 50);
        }
        if (uid === 'api::artist-update.artist-update') {
          return updates.filter((row) => {
            if (filters.band && Number(row.band?.id || 7) !== Number(filters.band)) return false;
            if (filters.slug && row.slug !== filters.slug) return false;
            if (filters.status && row.status !== filters.status) return false;
            if (filters.showRecap && Number(row.showRecap?.id || row.showRecap) !== Number(filters.showRecap)) return false;
            return true;
          }).slice(0, query.limit || 50);
        }
        if (uid === 'api::band-member.band-member') {
          return members.filter((row) => {
            if (filters.band && Number(row.band) !== Number(filters.band)) return false;
            if (filters.user && Number(row.user) !== Number(filters.user)) return false;
            if (filters.status && row.status !== filters.status) return false;
            return true;
          });
        }
        if (uid === 'api::fan.fan') {
          return fans.filter((row) => {
            if (filters.band && Number(row.band) !== Number(filters.band)) return false;
            if (filters.accountUser && Number(row.accountUser) !== Number(filters.accountUser)) return false;
            return true;
          });
        }
        if (uid === 'api::fan-show-attendance.fan-show-attendance') {
          return attendances.filter((row) => {
            if (filters.fan && Number(row.fan) !== Number(filters.fan)) return false;
            if (filters.campaignId?.$in && !filters.campaignId.$in.includes(row.campaignId)) return false;
            if (typeof filters.campaignId === 'string' && row.campaignId !== filters.campaignId) return false;
            if (filters.event?.id?.$in && !filters.event.id.$in.map(Number).includes(Number(row.event?.id || row.event))) {
              return false;
            }
            return row.suppressedDuplicate !== true;
          });
        }
        return [];
      },
      async findOne(uid, id) {
        if (uid === 'api::band.band') {
          return bands.find((row) => Number(row.id) === Number(id)) || null;
        }
        if (uid === 'api::show-recap.show-recap') {
          return recaps.find((row) => Number(row.id) === Number(id)) || null;
        }
        if (uid === 'api::event.event') return events[Number(id)] || events[id] || null;
        return null;
      },
    },
  };
}

function leak(payload) {
  return share.publicPayloadForbiddenKeys(payload);
}

(async () => {
  console.log('\n=== Public Night + Gallery share contract ===\n');

  await test('27-29. Night share title/description never use the private note', () => {
    const title = share.nightShareTitle({
      artistName: 'Badflower',
      venue: 'The Basement East',
      city: 'Nashville',
    });
    assert.strictEqual(title, 'Badflower at The Basement East · Nashville');
    const description = share.nightShareDescription({
      publicStory: 'Nashville was unreal tonight.',
      privateArtistNote: 'Do not leak this note',
      artistName: 'Badflower',
      venue: 'The Basement East',
      city: 'Nashville',
    });
    assert.strictEqual(description, 'Nashville was unreal tonight.');
    assert.ok(!description.includes('Do not leak'));
    assert.strictEqual(share.nightShareTitle({ artistName: 'Badflower' }), 'Badflower');
  });

  await test('30-34. share image fallbacks stay public-safe', () => {
    const publicImage = share.galleryShareImage({
      visibility: 'public',
      mediaFiles: [PUBLIC_FILE],
      recap: recapRow(),
    });
    assert.strictEqual(publicImage.url, 'https://cdn.example/public-gallery.jpg');
    const gated = share.galleryShareImage({
      visibility: 'show_attendees',
      mediaFiles: [PROTECTED_FILE, PUBLIC_FILE],
      recap: recapRow(),
      event: { image: EVENT_IMAGE },
      artist: { bandImg: BAND_IMG },
    });
    assert.strictEqual(gated.url, 'https://cdn.example/night-cover.jpg');
    assert.strictEqual(share.toPublicSafeImage(PROTECTED_FILE), null);
    const publicS3 = share.toPublicSafeImage({
      url: 'https://qrcode101.s3.us-east-1.amazonaws.com/band.jpg',
      width: 400,
      height: 600,
    });
    assert.strictEqual(publicS3.url, 'https://qrcode101.s3.us-east-1.amazonaws.com/band.jpg');
    assert.strictEqual(share.toPublicSafeImage({
      url: 'https://bucket.s3.us-east-1.amazonaws.com/secret.jpg?X-Amz-Signature=abc',
    }), null);
    assert.strictEqual(share.nightCoverImage({ recap: recapRow({ coverImage: PROTECTED_FILE }), event: { image: EVENT_IMAGE } }), null);
    assert.strictEqual(share.nightCoverImage({
      recap: recapRow({ coverImage: null }),
      event: { image: EVENT_IMAGE },
      artist: { bandImg: BAND_IMG },
    }), null);
    assert.strictEqual(share.nightShareImage({ recap: recapRow({ coverImage: PROTECTED_FILE }), event: { image: EVENT_IMAGE } }).url, 'https://cdn.example/event.jpg');
    assert.strictEqual(share.nightShareImage({
      recap: recapRow({ coverImage: PROTECTED_FILE }),
      event: { image: PROTECTED_FILE },
      artist: { bandImg: BAND_IMG },
    }).url, 'https://cdn.example/band.jpg');
    assert.strictEqual(share.nightShareImage({
      recap: recapRow({ coverImage: PROTECTED_FILE }),
      event: { image: PROTECTED_FILE },
      artist: { bandImg: PROTECTED_FILE },
    }), null);
    assert.strictEqual(share.nightHeroImage({ recap: recapRow({ heroImage: PROTECTED_FILE }) }), null);
  });

  await test('35-36. canonical paths are slug-based and stable', () => {
    assert.strictEqual(
      share.nightCanonicalPath('Badflower', 'the-basement-east-nashville-sep-5-2026-ab12cd34'),
      '/badflower/night/the-basement-east-nashville-sep-5-2026-ab12cd34'
    );
    assert.strictEqual(
      share.galleryCanonicalPath('badflower', 'nashville-sep-5'),
      '/badflower/gallery/nashville-sep-5'
    );
    assert.strictEqual(share.nightCanonicalPath('', 'x'), null);
  });

  await test('1-10. public Night lookup and allowlist', async () => {
    const service = createPublicShareService(makeStrapi());
    const result = await service.getPublicNight({
      bandSlug: 'badflower',
      nightSlug: 'the-basement-east-nashville-sep-5-2026-ab12cd34',
    });
    assert.ok(!result.error, result.message);
    assert.strictEqual(result.data.artist.slug, 'badflower');
    assert.strictEqual(result.data.artist.name, 'Badflower');
    assert.strictEqual(result.data.artist.image.url, 'https://cdn.example/band.jpg');
    assert.ok(result.data.night.eventImage === null || result.data.night.eventImage.url === 'https://cdn.example/event.jpg');
    assert.strictEqual(result.data.night.publicStory, 'Nashville was unreal tonight.');
    assert.strictEqual(result.data.night.lineup[0].name, 'Dead Poet Society');
    assert.strictEqual(result.data.night.cover.url, 'https://cdn.example/night-cover.jpg');
    assert.strictEqual(result.data.night.hero, null);
    assert.strictEqual(result.data.night.heroFocalX, 50);
    assert.strictEqual(result.data.night.heroFocalY, 50);
    assert.strictEqual(result.data.night.attendanceCount, 147);
    assert.deepStrictEqual(leak(result.data), []);
    assert.ok(!share.payloadContainsText(result.data, 'Do not leak this note'));
    assert.ok(!share.payloadContainsText(result.data, 'sm_manual'));
    assert.ok(!Object.prototype.hasOwnProperty.call(result.data.night, 'privateArtistNote'));
    assert.ok(!Object.prototype.hasOwnProperty.call(result.data.night, 'campaignId'));
    assert.strictEqual(result.data.share.canonicalPath, '/badflower/night/the-basement-east-nashville-sep-5-2026-ab12cd34');
    assert.deepStrictEqual(result.data.recordings, []);
  });

  await test('night.cover is coverImage only; share keeps independent fallback', async () => {
    const noCover = createPublicShareService(makeStrapi({
      recaps: [recapRow({ coverImage: null })],
    }));
    const empty = await noCover.getPublicNight({
      bandSlug: 'badflower',
      nightSlug: 'the-basement-east-nashville-sep-5-2026-ab12cd34',
    });
    assert.strictEqual(empty.data.night.cover, null);
    assert.strictEqual(empty.data.night.eventImage.url, 'https://cdn.example/event.jpg');
    assert.strictEqual(empty.data.artist.image.url, 'https://cdn.example/band.jpg');
    assert.strictEqual(empty.data.share.image.url, 'https://cdn.example/event.jpg');

    const artistOnly = share.publicNightFields({
      recap: recapRow({ coverImage: null, eventId: null }),
      event: null,
      artist: bandRow(),
    });
    assert.strictEqual(artistOnly.cover, null);
    assert.strictEqual(artistOnly.eventImage, null);
    assert.strictEqual(share.nightShare({
      artist: share.publicArtist(bandRow()),
      night: artistOnly,
      recap: recapRow({ coverImage: null }),
      event: null,
    }).image.url, 'https://cdn.example/band.jpg');
  });

  await test('public Night exposes public-safe hero only', async () => {
    const service = createPublicShareService(makeStrapi({
      recaps: [recapRow({
        heroImage: HERO,
        heroFocalX: 18,
        heroFocalY: 72,
      })],
    }));
    const result = await service.getPublicNight({
      bandSlug: 'badflower',
      nightSlug: 'the-basement-east-nashville-sep-5-2026-ab12cd34',
    });
    assert.deepStrictEqual(result.data.night.hero, {
      url: 'https://cdn.example/night-hero.jpg',
      width: 2000,
      height: 1400,
      alternativeText: 'Night hero',
    });
    assert.strictEqual(result.data.night.heroFocalX, 18);
    assert.strictEqual(result.data.night.heroFocalY, 72);
    assert.ok(!Object.prototype.hasOwnProperty.call(result.data.night.hero, 'id'));
    assert.ok(!Object.prototype.hasOwnProperty.call(result.data.night.hero, 'provider'));
    assert.ok(!JSON.stringify(result.data).includes('faneqo-protected://'));
  });

  await test('protected Gallery URLs never appear in hero, cover, or share', () => {
    const night = share.publicNightFields({
      recap: recapRow({
        coverImage: PROTECTED_FILE,
        heroImage: PROTECTED_FILE,
      }),
      event: { image: PROTECTED_FILE },
      artist: { bandImg: PROTECTED_FILE },
    });
    assert.strictEqual(night.cover, null);
    assert.strictEqual(night.hero, null);
    assert.strictEqual(night.eventImage, null);
    const shareCard = share.nightShare({
      artist: share.publicArtist({ bandImg: PROTECTED_FILE, name: 'Badflower', slug: 'badflower' }),
      night,
      recap: recapRow({ coverImage: PROTECTED_FILE, heroImage: PROTECTED_FILE }),
      event: { image: PROTECTED_FILE },
    });
    assert.strictEqual(shareCard.image, null);
    assert.ok(!JSON.stringify({ night, shareCard }).includes('faneqo-protected://'));
  });

  await test('2. unknown or null night slug is 404', async () => {
    const service = createPublicShareService(makeStrapi({
      recaps: [recapRow({ nightSlug: null })],
    }));
    const missing = await service.getPublicNight({ bandSlug: 'badflower', nightSlug: 'nope' });
    assert.strictEqual(missing.status, 404);
    const legacy = await service.getPublicNight({ bandSlug: 'badflower', nightSlug: 'the-basement-east-nashville-sep-5-2026-ab12cd34' });
    assert.strictEqual(legacy.status, 404);
    const empty = await service.getPublicNight({ bandSlug: 'badflower', nightSlug: '' });
    assert.strictEqual(empty.status, 404);
  });

  await test('11-15. viewer relationship on public Night', async () => {
    const attendeeStrapi = makeStrapi({
      fans: [{ id: 3, band: 7, accountUser: 9, status: 'subscribed' }],
      attendances: [
        { id: 1, fan: 3, campaignId: 'sm_older', checkedInAt: '2026-08-01T00:00:00.000Z', event: { id: 10 } },
        { id: 2, fan: 3, campaignId: 'sm_manual', checkedInAt: '2026-09-05T23:10:00.000Z', event: { id: 12 } },
      ],
    });
    const service = createPublicShareService(attendeeStrapi);
    const anon = await service.getPublicNight({
      bandSlug: 'badflower',
      nightSlug: 'the-basement-east-nashville-sep-5-2026-ab12cd34',
    });
    assert.deepStrictEqual(anon.data.viewer, { authenticated: false, youWereThere: false });
    const attendee = await service.getPublicNight({
      bandSlug: 'badflower',
      nightSlug: 'the-basement-east-nashville-sep-5-2026-ab12cd34',
      userId: 9,
    });
    assert.strictEqual(attendee.data.viewer.authenticated, true);
    assert.strictEqual(attendee.data.viewer.youWereThere, true);
    assert.strictEqual(attendee.data.viewer.showOrdinal, 2);
    const other = await service.getPublicNight({
      bandSlug: 'badflower',
      nightSlug: 'the-basement-east-nashville-sep-5-2026-ab12cd34',
      userId: 44,
    });
    assert.strictEqual(other.data.viewer.youWereThere, false);
    assert.ok(!other.data.viewer.showOrdinal);
    const artist = await service.getPublicNight({
      bandSlug: 'badflower',
      nightSlug: 'the-basement-east-nashville-sep-5-2026-ab12cd34',
      userId: 2,
    });
    const artistStrapi = makeStrapi({
      members: [{ band: 7, user: 2, status: 'active', role: 'owner' }],
    });
    const artistResult = await createPublicShareService(artistStrapi).getPublicNight({
      bandSlug: 'badflower',
      nightSlug: 'the-basement-east-nashville-sep-5-2026-ab12cd34',
      userId: 2,
    });
    assert.strictEqual(artistResult.data.viewer.isArtist, true);
    assert.ok(!share.payloadContainsText(artistResult.data, 'Do not leak this note'));
    assert.ok(artist);
  });

  await test('16-21. Night galleries reuse visibility access', async () => {
    const service = createPublicShareService(makeStrapi({
      updates: [publicUpdate(), gatedUpdate(), fanListUpdate()],
      fans: [{ id: 3, band: 7, accountUser: 9, status: 'subscribed' }],
      attendances: [
        { id: 2, fan: 3, campaignId: 'sm_manual', checkedInAt: '2026-09-05T23:10:00.000Z', event: { id: 12 } },
      ],
    }));
    const anon = await service.getPublicNight({
      bandSlug: 'badflower',
      nightSlug: 'the-basement-east-nashville-sep-5-2026-ab12cd34',
    });
    assert.strictEqual(anon.data.galleries.length, 3);
    const open = anon.data.galleries.find((row) => row.slug === 'nashville-sep-5');
    const locked = anon.data.galleries.find((row) => row.slug === 'attendee-only');
    const fanList = anon.data.galleries.find((row) => row.slug === 'fan-list-set');
    assert.strictEqual(open.locked, false);
    assert.ok(open.media.length);
    assert.strictEqual(locked.locked, true);
    assert.deepStrictEqual(locked.media, []);
    assert.strictEqual(locked.lockReason, 'show_attendees');
    assert.strictEqual(fanList.locked, true);
    assert.strictEqual(fanList.lockReason, 'fan_list');
    const attendee = await service.getPublicNight({
      bandSlug: 'badflower',
      nightSlug: 'the-basement-east-nashville-sep-5-2026-ab12cd34',
      userId: 9,
    });
    const attendeeGallery = attendee.data.galleries.find((row) => row.slug === 'attendee-only');
    assert.strictEqual(attendeeGallery.locked, false);
    assert.ok(attendeeGallery.youWereThere);
    const fanGallery = attendee.data.galleries.find((row) => row.slug === 'fan-list-set');
    assert.strictEqual(fanGallery.locked, false);
  });

  await test('11+21. draft galleries are excluded and ShowContext stays independent', async () => {
    const service = createPublicShareService(makeStrapi({
      updates: [
        publicUpdate(),
        publicUpdate({ id: 99, slug: 'draft-set', status: 'draft' }),
      ],
    }));
    const result = await service.getPublicNight({
      bandSlug: 'badflower',
      nightSlug: 'the-basement-east-nashville-sep-5-2026-ab12cd34',
    });
    assert.strictEqual(result.data.galleries.length, 1);
    assert.strictEqual(result.data.galleries[0].slug, 'nashville-sep-5');
    assert.strictEqual(result.data.night.venue, 'The Basement East');
  });

  await test('22-26. public Gallery lookup, shell, and 404s', async () => {
    const service = createPublicShareService(makeStrapi({
      updates: [publicUpdate(), gatedUpdate(), publicUpdate({ id: 99, slug: 'draft-set', status: 'draft' })],
    }));
    const pub = await service.getPublicGallery({
      bandSlug: 'badflower',
      gallerySlug: 'nashville-sep-5',
    });
    assert.ok(!pub.error, pub.message);
    assert.strictEqual(pub.data.gallery.canonicalPath, '/badflower/gallery/nashville-sep-5');
    assert.strictEqual(pub.data.gallery.locked, false);
    assert.ok(pub.data.gallery.media.length);
    assert.strictEqual(pub.data.gallery.media[0].originalUrl, 'https://cdn.example/public-gallery.jpg');
    assert.ok(!JSON.stringify(pub.data.share).includes('originalUrl'));
    const gated = await service.getPublicGallery({
      bandSlug: 'badflower',
      gallerySlug: 'attendee-only',
    });
    assert.strictEqual(gated.data.gallery.locked, true);
    assert.deepStrictEqual(gated.data.gallery.media, []);
    assert.ok(!JSON.stringify(gated.data).includes('originalUrl'));
    assert.ok(!JSON.stringify(gated.data).includes('srcset'));
    assert.ok(!JSON.stringify(gated.data).includes('faneqo-protected://'));
    assert.ok(!JSON.stringify(gated.data.share).includes('faneqo-protected://'));
    assert.strictEqual(gated.data.share.image.url, 'https://cdn.example/night-cover.jpg');
    const draft = await service.getPublicGallery({
      bandSlug: 'badflower',
      gallerySlug: 'draft-set',
    });
    assert.strictEqual(draft.status, 404);
    const wrongBand = await service.getPublicGallery({
      bandSlug: 'other-artist',
      gallerySlug: 'nashville-sep-5',
    });
    assert.strictEqual(wrongBand.status, 404);
    const missing = await service.getPublicGallery({
      bandSlug: 'badflower',
      gallerySlug: 'nope',
    });
    assert.strictEqual(missing.status, 404);
  });

  await test('hidden gallery returns a deliberate unavailable page, not a 404', async () => {
    const service = createPublicShareService(makeStrapi({
      updates: [publicUpdate({ status: 'hidden', hiddenAt: '2026-09-10T00:00:00.000Z' })],
      members: [{ band: 7, user: 2, status: 'active', role: 'owner' }],
    }));
    const taken = await service.getPublicGallery({
      bandSlug: 'badflower',
      gallerySlug: 'nashville-sep-5',
    });
    assert.ok(!taken.error, 'hidden gallery must not surface as an error');
    assert.strictEqual(taken.data.unavailable, true);
    assert.strictEqual(taken.data.gallery, null);
    assert.strictEqual(taken.data.night, null);
    assert.strictEqual(taken.data.share.canonicalPath, '/badflower/gallery/nashville-sep-5');
    assert.strictEqual(taken.data.share.image, null);
    assert.strictEqual(taken.data.artist.slug, 'badflower');
    const text = JSON.stringify(taken.data);
    assert.ok(!text.includes('Thanks Nashville'), 'caption must not leak');
    assert.ok(!text.includes('public-gallery.jpg'), 'photos must not leak');
    assert.ok(!text.includes('faneqo-protected://'));
  });

  await test('hidden gallery stays visible to its own artist so it can be restored', async () => {
    const service = createPublicShareService(makeStrapi({
      updates: [publicUpdate({ status: 'hidden' })],
      members: [{ band: 7, user: 2, status: 'active', role: 'owner' }],
    }));
    const artist = await service.getPublicGallery({
      bandSlug: 'badflower',
      gallerySlug: 'nashville-sep-5',
      userId: 2,
    });
    assert.ok(!artist.error, artist.message);
    assert.ok(!artist.data.unavailable);
    assert.strictEqual(artist.data.gallery.slug, 'nashville-sep-5');
  });

  await test('7+19. attendee gets gated media; share image stays public', async () => {
    const service = createPublicShareService(makeStrapi({
      updates: [gatedUpdate()],
      fans: [{ id: 3, band: 7, accountUser: 9, status: 'subscribed' }],
      attendances: [
        { id: 2, fan: 3, campaignId: 'sm_manual', checkedInAt: '2026-09-05T23:10:00.000Z', event: { id: 12 } },
      ],
    }));
    const attendee = await service.getPublicGallery({
      bandSlug: 'badflower',
      gallerySlug: 'attendee-only',
      userId: 9,
    });
    assert.strictEqual(attendee.data.gallery.locked, false);
    assert.strictEqual(attendee.data.viewer.youWereThere, true);
    assert.strictEqual(attendee.data.share.image.url, 'https://cdn.example/night-cover.jpg');
    assert.ok(!attendee.data.share.image.url.includes('faneqo-protected'));
  });

  await test('13. wrong artist cannot fetch another Night', async () => {
    const service = createPublicShareService(makeStrapi({
      bands: [bandRow(), { id: 8, name: 'Other', slug: 'other', bandImg: BAND_IMG }],
    }));
    const result = await service.getPublicNight({
      bandSlug: 'other',
      nightSlug: 'the-basement-east-nashville-sep-5-2026-ab12cd34',
    });
    assert.strictEqual(result.status, 404);
  });

  await test('37. ambiguous nightSlug within a band is 404', async () => {
    const service = createPublicShareService(makeStrapi({
      recaps: [recapRow(), recapRow({ id: 42 })],
    }));
    const result = await service.getPublicNight({
      bandSlug: 'badflower',
      nightSlug: 'the-basement-east-nashville-sep-5-2026-ab12cd34',
    });
    assert.strictEqual(result.status, 404);
  });

  await test('38-39. slugs stay stable across visibility and identity text', () => {
    assert.strictEqual(
      share.galleryCanonicalPath('badflower', 'nashville-sep-5'),
      '/badflower/gallery/nashville-sep-5'
    );
    const afterVisibility = share.publicGalleryCard({
      slug: 'nashville-sep-5',
      title: 'From the pit',
      visibility: 'fan_list',
      photoCount: 4,
      publishedAt: '2026-09-05T04:10:00.000Z',
      locked: true,
      lockReason: 'fan_list',
      media: [],
    }, { bandSlug: 'badflower' });
    assert.strictEqual(afterVisibility.canonicalPath, '/badflower/gallery/nashville-sep-5');
    assert.strictEqual(afterVisibility.slug, 'nashville-sep-5');
  });

  await test('gallery id is public only for an open gallery (Passport save)', () => {
    const open = share.publicGalleryCard({ id: 77, slug: 'open', locked: false, media: [] }, { bandSlug: 'badflower' });
    assert.strictEqual(open.id, 77);
    const locked = share.publicGalleryCard({ id: 78, slug: 'locked', locked: true, lockReason: 'fan_list', media: [] }, { bandSlug: 'badflower' });
    assert.strictEqual(locked.id, null);
    assert.ok(share.PUBLIC_GALLERY_KEYS.includes('id'));
  });

  await test('8. unauthorized stream still denies protected bytes', () => {
    const denied = mediaPure.decideStreamAccess({
      access: { allowed: false, reason: 'show_attendees' },
      tokenOk: false,
      userId: null,
    });
    assert.strictEqual(denied.allowed, false);
  });

  if (failed) {
    console.log(`\n${failed} failed, ${passed} passed`);
    process.exit(1);
  }
  console.log(`\n${passed} passed`);
})();
