'use strict';

const { requireBandPermission } = require('../bandRoles');
const pure = require('./featuredGalleryPure');

const GALLERY_UID = 'api::artist-update.artist-update';
const BAND_UID = 'api::band.band';

function createFeaturedGalleryService(strapi, deps = {}) {
  const authorize = deps.authorize || ((userId, bandId) => requireBandPermission(strapi, userId, bandId, 'editBand'));

  async function loadGallery(updateId) {
    const id = parseInt(updateId, 10);
    if (!id) return null;
    return strapi.entityService.findOne(GALLERY_UID, id, {
      populate: {
        media: true,
        band: { fields: ['id', 'slug'] },
      },
    });
  }

  async function loadBandFeature(bandId) {
    return strapi.entityService.findOne(BAND_UID, bandId, {
      fields: ['id', 'slug'],
      populate: { featuredGallery: { fields: ['id'] } },
    });
  }

  function bandIdOf(row) {
    return pure.relationId(row?.band);
  }

  async function featureOnProfile({ userId, updateId }) {
    if (!userId) return { error: 'unauthorized', status: 401, message: 'Authentication required' };
    const row = await loadGallery(updateId);
    if (!row) return { error: 'not_found', status: 404, message: 'Gallery not found' };
    const bandId = bandIdOf(row);
    if (!bandId) return { error: 'not_found', status: 404, message: 'Gallery not found' };
    const access = await authorize(userId, bandId);
    if (!access) return { error: 'forbidden', status: 403, message: 'Not authorized for this band' };
    const block = pure.featureBlockReason(row);
    if (block) return block;
    const current = await loadBandFeature(bandId);
    const already = pure.relationId(current?.featuredGallery) === Number(row.id);
    if (!already) {
      await strapi.entityService.update(BAND_UID, bandId, {
        data: { featuredGallery: row.id },
      });
    }
    return {
      data: {
        id: row.id,
        bandId,
        featuredOnProfile: true,
      },
    };
  }

  async function unfeatureOnProfile({ userId, updateId }) {
    if (!userId) return { error: 'unauthorized', status: 401, message: 'Authentication required' };
    const row = await loadGallery(updateId);
    if (!row) return { error: 'not_found', status: 404, message: 'Gallery not found' };
    const bandId = bandIdOf(row);
    if (!bandId) return { error: 'not_found', status: 404, message: 'Gallery not found' };
    const access = await authorize(userId, bandId);
    if (!access) return { error: 'forbidden', status: 403, message: 'Not authorized for this band' };
    const current = await loadBandFeature(bandId);
    const featuredId = pure.relationId(current?.featuredGallery);
    if (featuredId === Number(row.id)) {
      await strapi.entityService.update(BAND_UID, bandId, {
        data: { featuredGallery: null },
      });
    }
    return {
      data: {
        id: row.id,
        bandId,
        featuredOnProfile: false,
      },
    };
  }

  async function featuredIdForBand(bandId) {
    if (!bandId) return null;
    try {
      const band = await loadBandFeature(bandId);
      return pure.relationId(band?.featuredGallery);
    } catch (err) {
      strapi.log?.warn?.(`[featured-gallery] manage lookup failed: ${err.message}`);
      return null;
    }
  }

  async function isFeatured({ bandId, updateId }) {
    if (!bandId || !updateId) return false;
    try {
      const featuredId = await featuredIdForBand(bandId);
      return featuredId != null && featuredId === Number(updateId);
    } catch (err) {
      strapi.log?.warn?.(`[featured-gallery] manage lookup failed: ${err.message}`);
      return false;
    }
  }

  async function publicForBand(band) {
    const bandId = pure.relationId(band) || band?.id;
    const bandSlug = band?.slug || null;
    if (!bandId) return null;
    try {
      const loaded = await strapi.entityService.findOne(BAND_UID, bandId, {
        fields: ['id', 'slug'],
        populate: {
          featuredGallery: { populate: { media: true } },
        },
      });
      const gallery = loaded?.featuredGallery;
      if (!gallery || typeof gallery !== 'object') return null;
      return pure.toPublicFeaturedGallery(gallery, { bandSlug: loaded.slug || bandSlug });
    } catch (err) {
      strapi.log?.warn?.(`[featured-gallery] public lookup failed: ${err.message}`);
      return null;
    }
  }

  async function listPublicForBand(bandSlug) {
    const slug = String(bandSlug || '').trim();
    if (!slug) return { error: 'not_found', status: 404, message: 'Artist not found' };
    const bands = await strapi.entityService.findMany(BAND_UID, {
      filters: { slug },
      fields: ['id', 'name', 'slug'],
      limit: 1,
    });
    const band = bands?.[0];
    if (!band) return { error: 'not_found', status: 404, message: 'Artist not found' };
    let rows = [];
    try {
      rows = await strapi.entityService.findMany(GALLERY_UID, {
        filters: { band: band.id, status: 'published', visibility: 'public' },
        sort: { publishedAt: 'desc' },
        limit: 60,
        populate: { media: true },
      });
    } catch (err) {
      strapi.log?.warn?.(`[featured-gallery] public list failed: ${err.message}`);
      rows = [];
    }
    const galleries = (rows || [])
      .map((row) => pure.toPublicGalleryIndexCard(row, { bandSlug: band.slug }))
      .filter(Boolean);
    return {
      data: {
        artist: { name: band.name || '', slug: band.slug },
        galleries,
      },
    };
  }

  async function galleryTitle(updateId) {
    const row = await loadGallery(updateId);
    return row?.title || '';
  }

  /**
   * Set the artist-page gallery only when the band does not already have one.
   * The relation lives in a Strapi link table (bands_featured_gallery_links),
   * so this reads, writes only when vacant, and re-reads to report what stuck.
   * Two publishes in the same instant could both see "vacant"; the re-read
   * then reports whichever gallery was kept.
   */
  async function claimIfVacant(bandId, galleryId) {
    const wanted = Number(galleryId);
    const current = await loadBandFeature(bandId);
    const id = pure.relationId(current?.featuredGallery);
    if (id && id !== wanted) {
      return { featured: false, keptTitle: await galleryTitle(id) };
    }
    if (id === wanted) return { featured: true, keptTitle: '' };
    await strapi.entityService.update(BAND_UID, bandId, {
      data: { featuredGallery: wanted },
    });
    const after = await loadBandFeature(bandId);
    const saved = pure.relationId(after?.featuredGallery);
    if (saved === wanted) return { featured: true, keptTitle: '' };
    return { featured: false, keptTitle: saved ? await galleryTitle(saved) : '' };
  }

  /**
   * Publish-time artist page placement.
   * `false` is an explicit skip. Omitted only fills an empty artist page.
   * `true` may replace the gallery already showing.
   * Failure here must not fail the publish; the caller keeps the gallery.
   */
  async function applyPublishChoice({ userId, updateId, showOnArtistPage }) {
    const choice = pure.parseShowOnArtistPage(showOnArtistPage);
    const empty = { featuredOnProfile: false, featureError: null, keptFeaturedTitle: null };
    if (choice === false) return empty;
    if (!userId) return { ...empty, featureError: 'Authentication required' };
    const row = await loadGallery(updateId);
    if (!row) return { ...empty, featureError: 'Gallery not found' };
    const bandId = bandIdOf(row);
    if (!bandId) return { ...empty, featureError: 'Gallery not found' };
    const access = await authorize(userId, bandId);
    if (!access) return { ...empty, featureError: 'Not authorized for this band' };
    const block = pure.featureBlockReason(row);
    if (block) {
      return { ...empty, featureError: choice === true ? block.message : null };
    }
    const band = await strapi.entityService.findOne(BAND_UID, bandId, {
      fields: ['id', 'pageStyle', 'slug'],
    });
    if (!pure.artistPageDisplaysGallery(band?.pageStyle)) {
      return {
        ...empty,
        featureError: choice === true ? 'This artist page layout can’t show a gallery.' : null,
      };
    }
    if (choice === true) {
      const result = await featureOnProfile({ userId, updateId });
      if (result?.error) return { ...empty, featureError: result.message };
      return { featuredOnProfile: true, featureError: null, keptFeaturedTitle: null };
    }
    const claimed = await claimIfVacant(bandId, row.id);
    return {
      featuredOnProfile: claimed.featured === true,
      featureError: null,
      keptFeaturedTitle: claimed.featured ? null : (claimed.keptTitle || null),
    };
  }

  async function placementForBand({ userId, bandId }) {
    if (!userId) return { error: 'unauthorized', status: 401, message: 'Authentication required' };
    const id = parseInt(bandId, 10);
    if (!id) return { error: 'invalid_band', status: 400, message: 'Choose a band.' };
    const access = await authorize(userId, id);
    if (!access) return { error: 'forbidden', status: 403, message: 'Not authorized for this band' };
    const band = await strapi.entityService.findOne(BAND_UID, id, {
      fields: ['id', 'pageStyle', 'slug'],
      populate: { featuredGallery: { fields: ['id', 'title'] } },
    });
    if (!band) return { error: 'not_found', status: 404, message: 'Artist not found' };
    const featured = band.featuredGallery && typeof band.featuredGallery === 'object'
      ? band.featuredGallery
      : null;
    const featuredId = pure.relationId(band.featuredGallery);
    return {
      data: {
        featuredGalleryId: featuredId,
        featuredTitle: featured?.title || '',
        pageStyle: band.pageStyle || 'smartlink',
        displaysOnArtistPage: pure.artistPageDisplaysGallery(band.pageStyle),
      },
    };
  }

  async function clearFeaturedPointer(updateId) {
    const id = parseInt(updateId, 10);
    if (!id) return { cleared: 0 };
    try {
      const bands = await strapi.entityService.findMany(BAND_UID, {
        filters: { featuredGallery: id },
        fields: ['id'],
        limit: 5,
      });
      for (const band of bands || []) {
        await strapi.entityService.update(BAND_UID, band.id, {
          data: { featuredGallery: null },
        });
      }
      return { cleared: (bands || []).length };
    } catch (err) {
      strapi.log?.warn?.(`[featured-gallery] delete cleanup failed: ${err.message}`);
      return { cleared: 0 };
    }
  }

  return {
    featureOnProfile,
    unfeatureOnProfile,
    featuredIdForBand,
    isFeatured,
    publicForBand,
    listPublicForBand,
    applyPublishChoice,
    placementForBand,
    clearFeaturedPointer,
  };
}

module.exports = {
  createFeaturedGalleryService,
};
