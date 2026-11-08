'use strict';

const { requireBandPermission } = require('../bandRoles');
const pure = require('./rocksnapsPure');

const GALLERY_UID = 'api::artist-update.artist-update';
const BAND_UID = 'api::band.band';

function createRocksnapsService(strapi, deps = {}) {
  const authorize = deps.authorize || ((userId, bandId) => requireBandPermission(strapi, userId, bandId, 'editBand'));
  const now = deps.now || (() => new Date().toISOString());

  function config() {
    return deps.config || pure.readConfig(deps.env || process.env);
  }

  async function loadConfiguredBand() {
    const current = config();
    if (!current.ok) return null;
    const band = await strapi.entityService.findOne(BAND_UID, current.bandId, {
      fields: ['id', 'name', 'slug'],
    });
    if (!pure.bandMatches(band, current)) {
      if (band) strapi.log?.warn?.('[rocksnaps] configured band failed the slug check');
      return null;
    }
    return band;
  }

  async function loadGallery(updateId) {
    const id = parseInt(updateId, 10);
    if (!id) return null;
    return strapi.entityService.findOne(GALLERY_UID, id, {
      populate: {
        media: true,
        band: { fields: ['id', 'name', 'slug'] },
      },
    });
  }

  async function capability({ userId, bandId }) {
    if (!userId) return { error: 'unauthorized', status: 401, message: 'Authentication required' };
    const id = parseInt(bandId, 10);
    if (!id) return { error: 'invalid_band', status: 400, message: 'A band is required.' };
    const access = await authorize(userId, id);
    if (!access) return { error: 'forbidden', status: 403, message: 'Not authorized for this band' };
    const current = config();
    if (!current.ok || id !== current.bandId) return { data: { eligible: false } };
    const band = await strapi.entityService.findOne(BAND_UID, id, {
      fields: ['id', 'name', 'slug'],
    });
    return { data: { eligible: pure.bandMatches(band, current) } };
  }

  async function setPublication({ userId, updateId, showOnRockSnaps }) {
    if (!userId) return { error: 'unauthorized', status: 401, message: 'Authentication required' };
    const flag = pure.parseFlag(showOnRockSnaps);
    if (flag.error) return flag;

    const row = await loadGallery(updateId);
    if (!row) return pure.notFound();
    const band = row.band && typeof row.band === 'object' ? row.band : null;
    const bandId = pure.relationId(band || row.band);
    if (!bandId) return pure.notFound();

    const access = await authorize(userId, bandId);
    if (!access) return { error: 'forbidden', status: 403, message: 'Not authorized for this band' };

    const current = config();
    if (!pure.bandMatches(band, current)) return pure.notFound();

    if (flag.value === true) {
      if (row.status !== 'published') {
        return { error: 'ineligible', status: 400, message: 'Publish this gallery before showing it on RockSnaps.' };
      }
      if (row.visibility !== 'public') {
        return { error: 'ineligible', status: 400, message: 'Make this gallery public before showing it on RockSnaps.' };
      }
      if (!pure.publicPhotos({ ...row, showOnRockSnaps: true }).length) {
        return { error: 'ineligible', status: 400, message: 'Add a public photo before showing this gallery on RockSnaps.' };
      }
    }

    const data = { showOnRockSnaps: flag.value };
    if (flag.value === true && row.showOnRockSnaps !== true) {
      data.rocksnapsPublishedAt = now();
    }
    await strapi.entityService.update(GALLERY_UID, row.id, { data });
    const saved = await loadGallery(row.id);
    if (flag.value === true && saved?.showOnRockSnaps !== true) {
      return { error: 'ineligible', status: 400, message: 'This gallery cannot be shown on RockSnaps.' };
    }
    return {
      data: {
        showOnRockSnaps: saved?.showOnRockSnaps === true,
        rocksnapsPublishedAt: saved?.rocksnapsPublishedAt || null,
      },
    };
  }

  async function listMatching(band) {
    const rows = await strapi.entityService.findMany(GALLERY_UID, {
      filters: {
        band: band.id,
        status: 'published',
        visibility: 'public',
        showOnRockSnaps: true,
      },
      sort: { rocksnapsPublishedAt: 'desc' },
      limit: pure.LIST_SCAN_LIMIT,
      populate: { media: true },
    });
    return (rows || [])
      .map((row) => pure.toListCard(row, band))
      .filter(Boolean)
      .sort(pure.comparePublication);
  }

  async function listPublic(query = {}) {
    const paging = pure.parsePage(query);
    if (paging.error) return paging;
    const band = await loadConfiguredBand();
    if (!band) return pure.notFound();
    let cards = [];
    try {
      cards = await listMatching(band);
    } catch (err) {
      strapi.log?.warn?.(`[rocksnaps] list failed: ${err.message}`);
      return pure.notFound();
    }
    return pure.paginate(cards, paging);
  }

  async function getPublic({ slug } = {}) {
    const band = await loadConfiguredBand();
    if (!band) return pure.notFound();
    const clean = String(slug || '').trim();
    if (!clean || clean.length > 80) return pure.notFound();
    let rows = [];
    try {
      rows = await strapi.entityService.findMany(GALLERY_UID, {
        filters: {
          band: band.id,
          slug: clean,
          status: 'published',
          visibility: 'public',
          showOnRockSnaps: true,
        },
        limit: 1,
        populate: { media: true },
      });
    } catch (err) {
      strapi.log?.warn?.(`[rocksnaps] detail failed: ${err.message}`);
      return pure.notFound();
    }
    const detail = rows?.[0] ? pure.toDetail(rows[0], band) : null;
    if (!detail) return pure.notFound();
    return { data: detail };
  }

  return {
    capability,
    setPublication,
    listPublic,
    getPublic,
  };
}

module.exports = {
  createRocksnapsService,
};
