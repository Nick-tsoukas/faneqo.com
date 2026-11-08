'use strict';

const { createFeaturedGalleryService } = require('../../../../utils/galleries/featuredGalleryService');
const rocksnaps = require('../../../../utils/galleries/rocksnapsPure');

const GALLERY_UID = 'api::artist-update.artist-update';
const BAND_UID = 'api::band.band';

function idsFromWhere(where) {
  if (!where || where.id == null) return [];
  if (Array.isArray(where.id?.$in)) return where.id.$in.map((id) => parseInt(id, 10)).filter(Boolean);
  const id = parseInt(where.id, 10);
  return id ? [id] : [];
}

async function clear(where) {
  const service = createFeaturedGalleryService(strapi);
  for (const id of idsFromWhere(where)) {
    await service.clearFeaturedPointer(id);
  }
}

function hasRocksnapsKeys(data) {
  if (!data || typeof data !== 'object') return false;
  return Object.prototype.hasOwnProperty.call(data, 'showOnRockSnaps')
    || Object.prototype.hasOwnProperty.call(data, 'rocksnapsPublishedAt');
}

function wantsRocksnapsWrite(data) {
  if (data.showOnRockSnaps === true) return true;
  return data.rocksnapsPublishedAt != null && data.rocksnapsPublishedAt !== '';
}

async function loadExisting(where) {
  const id = parseInt(where?.id, 10);
  if (!id) return null;
  return strapi.entityService.findOne(GALLERY_UID, id, {
    fields: ['id', 'status', 'visibility', 'showOnRockSnaps'],
    populate: { band: { fields: ['id', 'slug'] } },
  });
}

async function loadBand(id) {
  if (!id) return null;
  return strapi.entityService.findOne(BAND_UID, id, { fields: ['id', 'slug'] });
}

async function guardRocksnaps(event, { creating = false } = {}) {
  const data = event.params?.data;
  if (!hasRocksnapsKeys(data)) return;
  if (!wantsRocksnapsWrite(data)) {
    rocksnaps.sanitizeRocksnapsWrite(data, {});
    return;
  }
  try {
    const existing = creating ? null : await loadExisting(event.params?.where);
    const bandId = rocksnaps.relationId(data.band) || rocksnaps.relationId(existing?.band);
    const band = await loadBand(bandId);
    const config = rocksnaps.readConfig();
    rocksnaps.sanitizeRocksnapsWrite(data, {
      allowed: rocksnaps.bandMatches(band, config),
      status: data.status || existing?.status || 'draft',
      visibility: data.visibility || existing?.visibility || 'public',
      currentlyEnabled: existing?.showOnRockSnaps === true,
      now: new Date().toISOString(),
    });
  } catch (err) {
    strapi.log?.warn?.(`[rocksnaps] write guard failed: ${err.message}`);
    data.showOnRockSnaps = false;
    data.rocksnapsPublishedAt = null;
  }
}

module.exports = {
  async beforeCreate(event) {
    await guardRocksnaps(event, { creating: true });
  },
  async beforeUpdate(event) {
    await guardRocksnaps(event, { creating: false });
  },
  async beforeDelete(event) {
    await clear(event.params?.where);
  },
  async beforeDeleteMany(event) {
    await clear(event.params?.where);
  },
};
