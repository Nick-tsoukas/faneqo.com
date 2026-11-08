'use strict';

const assert = require('assert');
const pure = require('../src/utils/galleries/featuredGalleryPure');
const { createFeaturedGalleryService } = require('../src/utils/galleries/featuredGalleryService');
const { toPublicBand, publicBandHasForbidden } = require('../src/utils/band/publicBandPure');

let passed = 0;

function test(name, fn) {
  return Promise.resolve()
    .then(fn)
    .then(() => {
      passed += 1;
      console.log(`  ok  ${name}`);
    });
}

function photo(id, width, height) {
  return {
    id,
    url: `https://cdn.example/photo-${id}.jpg`,
    mime: 'image/jpeg',
    width,
    height,
    alternativeText: `Photo ${id}`,
  };
}

function gallery(overrides = {}) {
  return {
    id: 7,
    title: 'Night',
    slug: 'night',
    status: 'published',
    visibility: 'public',
    contentKind: 'gallery',
    media: [photo(1, 1200, 800), photo(2, 800, 1200)],
    band: { id: 4, slug: 'ada' },
    bodyText: 'private caption',
    createdByUser: { id: 9, email: 'owner@example.com' },
    ...overrides,
  };
}

function memoryStrapi(seed = {}) {
  const state = {
    galleries: { ...(seed.galleries || {}) },
    bands: { ...(seed.bands || {}) },
    updates: [],
  };
  return {
    state,
    log: { warn() {} },
    entityService: {
      async findOne(uid, id) {
        if (uid.includes('artist-update')) return state.galleries[id] || null;
        const band = state.bands[id];
        if (!band) return null;
        const featured = band.featuredGallery;
        const featuredRow = featured && typeof featured === 'object'
          ? featured
          : (featured ? state.galleries[featured] : null);
        return { ...band, featuredGallery: featuredRow };
      },
      async findMany(uid, query) {
        if (!uid.includes('band')) return [];
        const wanted = query?.filters?.featuredGallery;
        return Object.values(state.bands).filter((band) => {
          const id = band.featuredGallery && typeof band.featuredGallery === 'object'
            ? band.featuredGallery.id
            : band.featuredGallery;
          return id === wanted;
        });
      },
      async update(uid, id, { data }) {
        state.updates.push({ uid, id, data });
        if (uid.includes('band')) {
          state.bands[id] = { ...state.bands[id], ...data };
          return state.bands[id];
        }
        return null;
      },
    },
  };
}

(async () => {
  console.log('\n=== Featured gallery contract ===\n');

  await test('public payload keeps only the strip fields', () => {
    const row = pure.toPublicFeaturedGallery(gallery(), { bandSlug: 'ada' });
    assert.strictEqual(row.photoCount, 2);
    assert.strictEqual(row.canonicalPath, '/ada/gallery/night');
    assert.deepStrictEqual(Object.keys(row.photos[0]).sort(), [...pure.PUBLIC_PHOTO_KEYS].sort());
    assert.strictEqual(row.photos[1].width, 800);
    assert.strictEqual(row.photos[1].height, 1200);
    assert.strictEqual(row.bodyText, undefined);
    assert.strictEqual(row.createdByUser, undefined);
  });

  await test('private, hidden, unpublished, and empty galleries are not public', () => {
    assert.strictEqual(pure.toPublicFeaturedGallery(gallery({ visibility: 'fan_list' })), null);
    assert.strictEqual(pure.toPublicFeaturedGallery(gallery({ visibility: 'show_attendees' })), null);
    assert.strictEqual(pure.toPublicFeaturedGallery(gallery({ status: 'hidden' })), null);
    assert.strictEqual(pure.toPublicFeaturedGallery(gallery({ status: 'draft' })), null);
    assert.strictEqual(pure.toPublicFeaturedGallery(gallery({ media: [] })), null);
  });

  await test('ineligible feature reasons match the real gallery rules', () => {
    assert.strictEqual(pure.featureBlockReason(gallery({ status: 'draft' })).message, 'Publish this gallery before featuring it.');
    assert.strictEqual(
      pure.featureBlockReason(gallery({ visibility: 'fan_list' })).message,
      'Make this gallery public before featuring it on your artist profile.',
    );
  });

  await test('owner featuring B replaces A and is idempotent', async () => {
    const strapi = memoryStrapi({
      galleries: {
        1: gallery({ id: 1, slug: 'a' }),
        2: gallery({ id: 2, slug: 'b' }),
      },
      bands: { 4: { id: 4, slug: 'ada', featuredGallery: 1 } },
    });
    const service = createFeaturedGalleryService(strapi, { authorize: async () => ({ ok: true }) });
    const first = await service.featureOnProfile({ userId: 3, updateId: 2 });
    const again = await service.featureOnProfile({ userId: 3, updateId: 2 });
    assert.strictEqual(first.data.featuredOnProfile, true);
    assert.strictEqual(again.data.featuredOnProfile, true);
    assert.strictEqual(strapi.state.bands[4].featuredGallery, 2);
    assert.strictEqual(strapi.state.updates.length, 1);
  });

  await test('unauthorized user and another band cannot feature the gallery', async () => {
    const strapi = memoryStrapi({
      galleries: { 2: gallery({ id: 2, band: { id: 8, slug: 'other' } }) },
      bands: { 8: { id: 8, slug: 'other', featuredGallery: null } },
    });
    const service = createFeaturedGalleryService(strapi, {
      authorize: async (_userId, bandId) => (bandId === 4 ? { ok: true } : null),
    });
    const denied = await service.featureOnProfile({ userId: 3, updateId: 2 });
    assert.strictEqual(denied.status, 403);
    assert.strictEqual(strapi.state.bands[8].featuredGallery, null);
    const anon = await service.featureOnProfile({ userId: null, updateId: 2 });
    assert.strictEqual(anon.status, 401);
  });

  await test('ineligible gallery is rejected and unfeature clears only that relation', async () => {
    const strapi = memoryStrapi({
      galleries: {
        1: gallery({ id: 1, visibility: 'fan_list' }),
        2: gallery({ id: 2 }),
      },
      bands: { 4: { id: 4, slug: 'ada', featuredGallery: 2 } },
    });
    const service = createFeaturedGalleryService(strapi, { authorize: async () => ({ ok: true }) });
    const rejected = await service.featureOnProfile({ userId: 3, updateId: 1 });
    assert.strictEqual(rejected.error, 'ineligible');
    assert.strictEqual(strapi.state.bands[4].featuredGallery, 2);
    const cleared = await service.unfeatureOnProfile({ userId: 3, updateId: 2 });
    const again = await service.unfeatureOnProfile({ userId: 3, updateId: 2 });
    assert.strictEqual(cleared.data.featuredOnProfile, false);
    assert.strictEqual(again.data.featuredOnProfile, false);
    assert.strictEqual(strapi.state.bands[4].featuredGallery, null);
  });

  await test('public band exposes an eligible gallery and hides an ineligible one', async () => {
    const eligible = memoryStrapi({
      galleries: { 2: gallery({ id: 2 }) },
      bands: { 4: { id: 4, slug: 'ada', featuredGallery: 2 } },
    });
    const hidden = memoryStrapi({
      galleries: { 2: gallery({ id: 2, status: 'hidden' }) },
      bands: { 4: { id: 4, slug: 'ada', featuredGallery: 2 } },
    });
    const shown = await createFeaturedGalleryService(eligible).publicForBand({ id: 4, slug: 'ada' });
    const omitted = await createFeaturedGalleryService(hidden).publicForBand({ id: 4, slug: 'ada' });
    assert.strictEqual(shown.slug, 'night');
    assert.strictEqual(shown.photoCount, 2);
    assert.strictEqual(omitted, null);
    const band = toPublicBand({ id: 4, slug: 'ada', name: 'Ada', featuredGallery: shown, stripeAccountId: 'secret' });
    assert.strictEqual(band.featuredGallery.photoCount, 2);
    assert.strictEqual(band.stripeAccountId, undefined);
    assert.deepStrictEqual(publicBandHasForbidden(band), []);
  });

  await test('deleting the featured gallery clears the band pointer', async () => {
    const strapi = memoryStrapi({
      galleries: { 2: gallery({ id: 2 }) },
      bands: { 4: { id: 4, slug: 'ada', featuredGallery: 2 } },
    });
    delete strapi.state.galleries[2];
    const result = await createFeaturedGalleryService(strapi).clearFeaturedPointer(2);
    assert.strictEqual(result.cleared, 1);
    assert.strictEqual(strapi.state.bands[4].featuredGallery, null);
    const shown = await createFeaturedGalleryService(strapi).publicForBand({ id: 4, slug: 'ada' });
    assert.strictEqual(shown, null);
  });

  await test('a gallery list marks only the band’s featured gallery', () => {
    const rows = pure.stampFeaturedOnProfile([
      { id: 2, title: 'Backstage' },
      { id: 9, title: 'Lobby' },
    ], 9);
    assert.strictEqual(rows[0].featuredOnProfile, false);
    assert.strictEqual(rows[1].featuredOnProfile, true);
    const cleared = pure.stampFeaturedOnProfile(rows, null);
    assert.strictEqual(cleared.every((row) => row.featuredOnProfile === false), true);
  });

  await test('a public gallery index keeps only eligible covers', () => {
    const card = pure.toPublicGalleryIndexCard(gallery({ id: 3, title: 'Backstage', slug: 'backstage' }), { bandSlug: 'ada' });
    assert.strictEqual(card.canonicalPath, '/ada/gallery/backstage');
    assert.strictEqual(card.photoCount, 2);
    assert.strictEqual(card.cover.url.includes('photo-1'), true);
    assert.strictEqual(card.photos, undefined);
    assert.strictEqual(card.visibility, undefined);
    assert.strictEqual(pure.toPublicGalleryIndexCard(gallery({ visibility: 'fan_list' }), { bandSlug: 'ada' }), null);
    assert.strictEqual(pure.toPublicGalleryIndexCard(gallery({ visibility: 'show_attendees' }), { bandSlug: 'ada' }), null);
    assert.strictEqual(pure.toPublicGalleryIndexCard(gallery({ status: 'hidden' }), { bandSlug: 'ada' }), null);
    assert.strictEqual(pure.toPublicGalleryIndexCard(gallery({ status: 'draft' }), { bandSlug: 'ada' }), null);
    assert.strictEqual(pure.toPublicGalleryIndexCard(gallery({ media: [] }), { bandSlug: 'ada' }), null);
  });

  await test('the public gallery list returns newest eligible galleries only', async () => {
    const strapi = {
      log: { warn() {} },
      entityService: {
        async findMany(uid, query) {
          if (uid.includes('band')) return [{ id: 4, name: 'Ada', slug: 'ada' }];
          assert.strictEqual(query.filters.status, 'published');
          assert.strictEqual(query.filters.visibility, 'public');
          assert.deepStrictEqual(query.sort, { publishedAt: 'desc' });
          return [
            gallery({ id: 2, title: 'Older', slug: 'older', visibility: 'fan_list' }),
            gallery({ id: 3, title: 'Backstage', slug: 'backstage' }),
            gallery({ id: 4, title: 'Empty', slug: 'empty', media: [] }),
          ];
        },
      },
    };
    const result = await createFeaturedGalleryService(strapi).listPublicForBand('ada');
    assert.strictEqual(result.data.artist.name, 'Ada');
    assert.strictEqual(result.data.galleries.length, 1);
    assert.strictEqual(result.data.galleries[0].slug, 'backstage');
    assert.strictEqual(result.data.galleries[0].media, undefined);
  });

  console.log(`\n${passed} featured gallery contract checks passed`);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
