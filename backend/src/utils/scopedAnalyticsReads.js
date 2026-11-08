'use strict';

/**
 * Core find/findOne for raw analytics rows (page views, scans, media plays).
 *
 * These collections hold visitor IPs, user agents and coarse location, and
 * were readable by anyone. Reads now require a signed-in caller and only return
 * rows belonging to bands where the caller holds `viewAnalytics`. Anonymous
 * ingestion keeps using the dedicated create / track endpoints.
 *
 * Spread the result into a createCoreController factory. Methods use the core
 * controller helpers through `this` (Strapi binds it to the controller), so
 * the usual query/output sanitizing still runs.
 */

const { listBandIdsWithPermission } = require('./bandRoles');

const EMPTY_PAGE = { data: [], meta: { pagination: { page: 1, pageSize: 0, pageCount: 0, total: 0 } } };

/** Combine the caller's filters with the band scope so the scope cannot be widened. */
function scopeQuery(query, scopeFilter) {
  const userFilters = query?.filters;
  const filters = userFilters && typeof userFilters === 'object' && Object.keys(userFilters).length
    ? { $and: [userFilters, scopeFilter] }
    : scopeFilter;
  return { ...(query || {}), filters };
}

/**
 * @param {object} strapi
 * @param {string} uid
 * @param {object} scope
 * @param {(bandIds: number[]) => object} scope.scopeFilter  filters matching rows of those bands
 * @param {object} scope.scopePopulate  populate needed to read a row's band(s) in findOne
 * @param {(row: object) => number[]} scope.bandIdsOfRow
 */
function scopedAnalyticsReads(strapi, uid, { scopeFilter, scopePopulate, bandIdsOfRow }) {
  async function allowedBandIds(ctx) {
    const userId = ctx.state?.user?.id;
    if (!userId) return null;
    return listBandIdsWithPermission(strapi, userId, 'viewAnalytics');
  }

  return {
    async find(ctx) {
      const bandIds = await allowedBandIds(ctx);
      if (!bandIds) return ctx.unauthorized();
      if (!bandIds.length) {
        ctx.body = EMPTY_PAGE;
        return ctx.body;
      }
      // Same steps as the core find, but the scope is added after sanitizing:
      // the sanitizer may drop relation filters the role cannot read, and the
      // scope must never be one of them.
      await this.validateQuery(ctx);
      const sanitizedQuery = await this.sanitizeQuery(ctx);
      const { results, pagination } = await strapi
        .service(uid)
        .find(scopeQuery(sanitizedQuery, scopeFilter(bandIds)));
      const sanitizedResults = await this.sanitizeOutput(results, ctx);
      return this.transformResponse(sanitizedResults, { pagination });
    },

    async findOne(ctx) {
      const bandIds = await allowedBandIds(ctx);
      if (!bandIds) return ctx.unauthorized();
      const row = await strapi.entityService.findOne(uid, ctx.params.id, { populate: scopePopulate });
      const owned = row && bandIdsOfRow(row).some((id) => bandIds.includes(id));
      if (!owned) return ctx.notFound();
      return Object.getPrototypeOf(this).findOne.call(this, ctx);
    },
  };
}

const idIn = (bandIds) => ({ id: { $in: bandIds } });

/** Rows linked straight to a band. */
const directBand = {
  scopeFilter: (bandIds) => ({ band: idIn(bandIds) }),
  scopePopulate: { band: { fields: ['id'] } },
  bandIdsOfRow: (row) => [row.band?.id].filter(Boolean),
};

/** Rows linked to a band directly or through a parent (scan → qr → band, view → event → band). */
function bandOrParent(parent) {
  return {
    scopeFilter: (bandIds) => ({ $or: [{ band: idIn(bandIds) }, { [parent]: { band: idIn(bandIds) } }] }),
    scopePopulate: { band: { fields: ['id'] }, [parent]: { populate: { band: { fields: ['id'] } } } },
    bandIdsOfRow: (row) => [row.band?.id, row[parent]?.band?.id].filter(Boolean),
  };
}

module.exports = { scopedAnalyticsReads, scopeQuery, directBand, bandOrParent, idIn, EMPTY_PAGE };
