'use strict';

const { createCoreController } = require('@strapi/strapi').factories;
const { createArtistUpdateService } = require('../../../utils/artistUpdates/artistUpdateService');
const { jwtFailureReason } = require('../../../utils/inbox/inboxLog');
const {
  createPublicShareService,
  cacheHeaders,
} = require('../../../utils/showMode/publicShareService');
const { createFeaturedGalleryService } = require('../../../utils/galleries/featuredGalleryService');
const { stampFeaturedOnProfile } = require('../../../utils/galleries/featuredGalleryPure');
const { createRocksnapsService } = require('../../../utils/galleries/rocksnapsService');
const { decorateManage } = require('../../../utils/galleries/rocksnapsPure');

async function resolveUserId(strapi, ctx) {
  if (ctx.state.user?.id) return ctx.state.user.id;
  const header = ctx.request.headers.authorization || ctx.request.headers.Authorization || '';
  const raw = typeof header === 'string' ? header : '';
  const token = raw.startsWith('Bearer ') ? raw.slice(7).trim() : '';
  if (!token) return null;
  try {
    const payload = await strapi.plugins['users-permissions'].services.jwt.verify(token);
    return payload?.id || null;
  } catch (err) {
    strapi.log.info(`[Faneqo Artist Updates] auth:failed reason=${jwtFailureReason(err)}`);
    return null;
  }
}

function send(ctx, result) {
  if (result?.error) {
    ctx.status = result.status || 400;
    ctx.body = { error: { name: result.error, message: result.message } };
    if (result.version != null) ctx.body.error.version = result.version;
    return;
  }
  ctx.status = 200;
  ctx.body = result;
}

module.exports = createCoreController('api::artist-update.artist-update', ({ strapi }) => {
  const service = createArtistUpdateService(strapi);
  const featured = createFeaturedGalleryService(strapi);
  const rocksnaps = createRocksnapsService(strapi);

  function presentManage(result) {
    if (result?.data) decorateManage(result.data);
    return result;
  }

  function cacheRocksnaps(ctx, result) {
    ctx.set('Cache-Control', result?.error ? 'no-store' : 'public, max-age=30, must-revalidate');
    return send(ctx, result);
  }

  return {
    async listPublic(ctx) {
      const userId = await resolveUserId(strapi, ctx);
      const result = await service.listForBand({
        bandId: ctx.query.bandId,
        bandSlug: ctx.query.bandSlug,
        userId,
      });
      return send(ctx, result);
    },

    async listMine(ctx) {
      const userId = await resolveUserId(strapi, ctx);
      const bandId = parseInt(ctx.query.bandId, 10);
      const result = await service.listMine({
        userId,
        bandId,
      });
      if (Array.isArray(result?.data)) {
        const featuredId = await featured.featuredIdForBand(bandId);
        result.data = stampFeaturedOnProfile(result.data, featuredId);
      }
      return send(ctx, result);
    },

    async create(ctx) {
      const userId = await resolveUserId(strapi, ctx);
      const body = ctx.request.body || {};
      const result = await service.createAndPublish({
        userId,
        bandId: parseInt(body.bandId, 10),
        title: body.title,
        bodyText: body.bodyText || body.caption,
        visibility: body.visibility,
        mediaIds: body.mediaIds,
        eventId: body.eventId,
        showRecapId: body.showRecapId,
        campaignId: body.campaignId,
        publishIdempotencyKey: body.publishIdempotencyKey,
      });
      return send(ctx, result);
    },

    async bySlug(ctx) {
      const userId = await resolveUserId(strapi, ctx);
      const result = await service.getBySlug({
        bandSlug: ctx.query.bandSlug,
        slug: ctx.query.slug,
        userId,
      });
      return send(ctx, result);
    },

    async delivery(ctx) {
      const result = await service.deliveryStatus();
      return send(ctx, result);
    },

    async shows(ctx) {
      const userId = await resolveUserId(strapi, ctx);
      const result = await service.listShows({
        userId,
        bandId: parseInt(ctx.query.bandId, 10),
      });
      return send(ctx, result);
    },

    async uploadMedia(ctx) {
      const userId = await resolveUserId(strapi, ctx);
      const incoming = ctx.request.files?.files || ctx.request.files?.file;
      const file = Array.isArray(incoming) ? incoming[0] : incoming;
      const result = await service.uploadMedia({
        userId,
        bandId: parseInt(ctx.request.body?.bandId || ctx.query.bandId, 10),
        file,
      });
      return send(ctx, result);
    },

    async streamMedia(ctx) {
      const userId = await resolveUserId(strapi, ctx);
      const result = await service.streamMedia({
        userId,
        updateId: parseInt(ctx.params.id, 10),
        mediaId: parseInt(ctx.params.mediaId, 10),
        size: ctx.query.size,
        exp: ctx.query.exp,
        sig: ctx.query.sig,
      });
      if (result?.error) return send(ctx, result);
      ctx.set('Content-Type', result.mime || 'image/webp');
      ctx.set('Cache-Control', 'private, no-store');
      if (result.length) ctx.set('Content-Length', String(result.length));
      ctx.body = result.stream;
    },

    async getManage(ctx) {
      const userId = await resolveUserId(strapi, ctx);
      const result = await service.getManage({
        userId,
        updateId: parseInt(ctx.params.id, 10),
      });
      if (result?.data?.bandId) {
        result.data.featuredOnProfile = await featured.isFeatured({
          bandId: result.data.bandId,
          updateId: result.data.id,
        });
      }
      return send(ctx, presentManage(result));
    },

    async featureOnProfile(ctx) {
      const userId = await resolveUserId(strapi, ctx);
      const result = await featured.featureOnProfile({
        userId,
        updateId: parseInt(ctx.params.id, 10),
      });
      return send(ctx, result);
    },

    async unfeatureOnProfile(ctx) {
      const userId = await resolveUserId(strapi, ctx);
      const result = await featured.unfeatureOnProfile({
        userId,
        updateId: parseInt(ctx.params.id, 10),
      });
      return send(ctx, result);
    },

    async saveManage(ctx) {
      const userId = await resolveUserId(strapi, ctx);
      const body = ctx.request.body || {};
      const patch = { userId, updateId: parseInt(ctx.params.id, 10), version: body.version };
      for (const key of ['title', 'caption', 'mediaOrder', 'mediaCaptions', 'coverMediaId', 'visibility', 'sessionId']) {
        if (body[key] !== undefined) patch[key] = body[key];
      }
      const result = await service.saveManage(patch);
      return send(ctx, presentManage(result));
    },

    async artistPagePlacement(ctx) {
      const userId = await resolveUserId(strapi, ctx);
      const result = await featured.placementForBand({
        userId,
        bandId: ctx.query.bandId,
      });
      return send(ctx, result);
    },

    async rocksnapsCapability(ctx) {
      const userId = await resolveUserId(strapi, ctx);
      const result = await rocksnaps.capability({
        userId,
        bandId: ctx.query.bandId,
      });
      return send(ctx, result);
    },

    async setRocksnaps(ctx) {
      const userId = await resolveUserId(strapi, ctx);
      const body = ctx.request.body || {};
      const result = await rocksnaps.setPublication({
        userId,
        updateId: parseInt(ctx.params.id, 10),
        showOnRockSnaps: body.showOnRockSnaps,
      });
      return send(ctx, result);
    },

    async publicRocksnapsList(ctx) {
      const result = await rocksnaps.listPublic({
        page: ctx.query.page,
        pageSize: ctx.query.pageSize,
      });
      return cacheRocksnaps(ctx, result);
    },

    async publicRocksnapsDetail(ctx) {
      const result = await rocksnaps.getPublic({ slug: ctx.params.slug });
      return cacheRocksnaps(ctx, result);
    },

    async updateVisibility(ctx) {
      const userId = await resolveUserId(strapi, ctx);
      const body = ctx.request.body || {};
      const result = await service.updateVisibility({
        userId,
        updateId: parseInt(ctx.params.id, 10),
        visibility: body.visibility,
      });
      return send(ctx, result);
    },

    async hide(ctx) {
      const userId = await resolveUserId(strapi, ctx);
      const result = await service.hideGallery({
        userId,
        updateId: parseInt(ctx.params.id, 10),
      });
      return send(ctx, result);
    },

    async restore(ctx) {
      const userId = await resolveUserId(strapi, ctx);
      const result = await service.restoreGallery({
        userId,
        updateId: parseInt(ctx.params.id, 10),
      });
      return send(ctx, result);
    },

    async detachRecap(ctx) {
      const userId = await resolveUserId(strapi, ctx);
      const result = await service.detachFromRecap({
        userId,
        updateId: parseInt(ctx.params.id, 10),
      });
      return send(ctx, result);
    },

    async publicGalleries(ctx) {
      const result = await featured.listPublicForBand(ctx.params.bandSlug);
      return send(ctx, result);
    },

    async publicGallery(ctx) {
      const userId = await resolveUserId(strapi, ctx);
      Object.entries(cacheHeaders(userId)).forEach(([key, value]) => ctx.set(key, value));
      const publicShare = createPublicShareService(strapi);
      const result = await publicShare.getPublicGallery({
        bandSlug: ctx.params.bandSlug,
        gallerySlug: ctx.params.gallerySlug,
        userId,
      });
      return send(ctx, result);
    },

    async detail(ctx) {
      const userId = await resolveUserId(strapi, ctx);
      const id = parseInt(ctx.params.id, 10);
      const rows = await strapi.entityService.findMany('api::artist-update.artist-update', {
        filters: { id },
        limit: 1,
        populate: { band: { fields: ['slug'] } },
      });
      const row = rows?.[0];
      if (!row?.band?.slug) {
        return send(ctx, { error: 'not_found', status: 404, message: 'Update not found' });
      }
      const result = await service.getBySlug({
        bandSlug: row.band.slug,
        slug: row.slug,
        userId,
      });
      return send(ctx, result);
    },
  };
});
