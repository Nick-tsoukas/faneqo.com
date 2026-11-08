'use strict';

const UID = 'api::creative.creative';
const BAND_UID = 'api::band.band';

/**
 * Owner-scoped persistence. Every read and write carries ownerEmail in the
 * filter so a guessed id never returns another owner's record.
 */
function createCreativeService(strapiInstance = strapi) {
  async function list(ownerEmail, { start = 0, limit = 100 } = {}) {
    const [rows, total] = await Promise.all([
      strapiInstance.entityService.findMany(UID, {
        filters: { ownerEmail },
        sort: { updatedAt: 'desc' },
        start,
        limit,
      }),
      strapiInstance.entityService.count(UID, { filters: { ownerEmail } }),
    ]);
    return { rows: rows || [], total: Number(total) || 0 };
  }

  async function findOwned(ownerEmail, id) {
    const rows = await strapiInstance.entityService.findMany(UID, {
      filters: { id, ownerEmail },
      limit: 1,
    });
    return rows?.[0] || null;
  }

  async function create(owner, data) {
    return strapiInstance.entityService.create(UID, {
      data: { ...data, ownerEmail: owner.email, owner: owner.id },
    });
  }

  async function update(ownerEmail, id, data) {
    const existing = await findOwned(ownerEmail, id);
    if (!existing) return null;
    return strapiInstance.entityService.update(UID, existing.id, { data });
  }

  async function duplicate(owner, id) {
    const existing = await findOwned(owner.email, id);
    if (!existing) return null;
    const { id: _id, createdAt, updatedAt, ownerEmail, owner: _owner, ...rest } = existing;
    const title = /\(variation( \d+)?\)$/.test(existing.title || '')
      ? existing.title.replace(/\(variation( \d+)?\)$/, (m, n) => `(variation ${(Number(n) || 1) + 1})`)
      : `${existing.title} (variation)`;
    return create(owner, { ...rest, title: title.slice(0, 160), status: 'draft' });
  }

  async function remove(ownerEmail, id) {
    const existing = await findOwned(ownerEmail, id);
    if (!existing) return null;
    return strapiInstance.entityService.delete(UID, existing.id);
  }

  /** Light paged artist rows for the studio picker; no public endpoint pages. */
  async function artists({ start = 0, limit = 24 } = {}) {
    const [rows, total] = await Promise.all([
      strapiInstance.entityService.findMany(BAND_UID, {
        fields: ['id', 'name', 'slug', 'genre', 'bio', 'updatedAt'],
        populate: { bandImg: { fields: ['url', 'formats'] } },
        sort: { updatedAt: 'desc' },
        start,
        limit,
      }),
      strapiInstance.entityService.count(BAND_UID),
    ]);
    const out = (rows || []).map((band) => ({
      id: band.id,
      name: band.name,
      slug: band.slug,
      genre: band.genre || null,
      bio: band.bio ? String(band.bio).slice(0, 140) : null,
      imageUrl: band.bandImg?.formats?.small?.url || band.bandImg?.formats?.thumbnail?.url || band.bandImg?.url || null,
      updatedAt: band.updatedAt || null,
    }));
    return { rows: out, total: Number(total) || 0 };
  }

  return { list, findOwned, create, update, duplicate, remove, artists };
}

module.exports = { createCreativeService, UID };
