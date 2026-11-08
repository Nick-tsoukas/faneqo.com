'use strict';

/**
 * qr controller
 */

const { createCoreController } = require('@strapi/strapi').factories;
const {
  resolveQrListScope,
  resolveListPagination,
  respondScopeDenied,
} = require('../../../utils/qrScope');

module.exports = createCoreController('api::qr.qr', ({ strapi }) => ({
  // RETIRED — the route file (src/api/qr/routes/fix-band.js) has been deleted.
  // Was a public debug dump of any QR's band relation. These two handlers are
  // kept as refusals so that re-adding a route cannot reopen the hole; band
  // reassignment belongs on the authenticated update path guarded by
  // `api::qr.owns-qr`. Do not restore either body.
  async debugBand(ctx) {
    strapi.log.warn('[qr.debugBand] retired endpoint called');
    return ctx.notFound('Not found.');
  },

  async fixBand(ctx) {
    strapi.log.warn('[qr.fixBand] retired endpoint called');
    return ctx.notFound('Not found.');
  },

  // Lookup endpoint that bypasses entityService permission sanitization
  // Uses db.query directly to get the band relation
  async lookup(ctx) {
    const { url, id } = ctx.query;
    
    try {
      let qr = null;
      
      // Try by URL first
      if (url) {
        qr = await strapi.db.query('api::qr.qr').findOne({
          where: { url },
          populate: ['band', 'event'],
        });
      }
      
      // Try by slugId field directly (most reliable for UUID-based lookups)
      if (!qr && id) {
        qr = await strapi.db.query('api::qr.qr').findOne({
          where: { slugId: id },
          populate: ['band', 'event'],
        });
      }
      
      // Try by numeric Strapi ID
      if (!qr && id && /^\d+$/.test(id)) {
        qr = await strapi.db.query('api::qr.qr').findOne({
          where: { id: parseInt(id, 10) },
          populate: ['band', 'event'],
        });
      }
      
      // Last resort: search options.data for the id
      if (!qr && id) {
        const all = await strapi.db.query('api::qr.qr').findMany({
          populate: ['band', 'event'],
        });
        qr = all.find(q => q.options?.data?.includes(id));
      }
      
      if (!qr) {
        return ctx.notFound('QR not found');
      }
      
      // Return minimal data needed for redirect
      return {
        data: {
          id: qr.id,
          q_type: qr.q_type,
          link: qr.link,
          arEnabled: qr.arEnabled,
          template: qr.template,
          band: qr.band ? {
            id: qr.band.id,
            slug: qr.band.slug,
            name: qr.band.name,
          } : null,
          event: qr.event ? {
            id: qr.event.id,
            slug: qr.event.slug,
          } : null,
        },
      };
    } catch (error) {
      strapi.log.error('QR lookup error:', error);
      return ctx.badRequest(error.message);
    }
  },

  /**
   * GET /qrs — the caller's own QR codes, or one band's QR codes when they
   * hold owner/manager on that band.
   *
   * The scope is derived from `ctx.state.user`. A `users_permissions_user`
   * filter in the query string is deliberately ignored: it used to be the
   * authorization input, which meant incrementing an id listed another
   * artist's QR codes. There is also no unscoped fallback any more — the old
   * `super.find(ctx)` branch returned every QR in the system when no filter
   * was supplied.
   */
  async find(ctx) {
    const scope = await resolveQrListScope(ctx, strapi);
    if (!scope.ok) return respondScopeDenied(ctx, scope);

    const { fields, populate, sort, pagination } = ctx.query;
    const { start, limit, pageSize } = resolveListPagination(pagination);

    const results = await strapi.entityService.findMany('api::qr.qr', {
      filters: scope.filters,
      fields: fields || undefined,
      populate: populate || undefined,
      sort: sort || undefined,
      start,
      limit,
    });

    const total = await strapi.entityService.count('api::qr.qr', {
      filters: scope.filters,
    });

    // entityService skips the sanitization a core controller would apply, so a
    // populated relation could otherwise return private fields (a band owner's
    // password hash, reset tokens). Restore the framework default.
    const data = await this.sanitizeOutput(results, ctx);

    return {
      data,
      meta: {
        pagination: {
          page: 1,
          pageSize,
          pageCount: Math.ceil(total / pageSize),
          total,
        },
      },
    };
  },
}));
