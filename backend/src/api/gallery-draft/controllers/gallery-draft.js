'use strict';

const { createCoreController } = require('@strapi/strapi').factories;
const { createGalleryDraftService } = require('../../../utils/galleries/galleryDraftService');
const { jwtFailureReason } = require('../../../utils/inbox/inboxLog');

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
    strapi.log.info(`[Faneqo Gallery Draft] auth:failed reason=${jwtFailureReason(err)}`);
    return null;
  }
}

function send(ctx, result) {
  if (result?.error) {
    ctx.status = result.status || 400;
    ctx.body = { error: { name: result.error, message: result.message } };
    if (result.requiresConfirm) ctx.body.error.requiresConfirm = true;
    if (result.photoCount != null) ctx.body.error.photoCount = result.photoCount;
    if (result.version != null) ctx.body.error.version = result.version;
    return;
  }
  ctx.status = 200;
  ctx.body = result;
}

module.exports = createCoreController('api::gallery-draft.gallery-draft', ({ strapi }) => {
  const service = createGalleryDraftService(strapi);
  return {
    async start(ctx) {
      const userId = await resolveUserId(strapi, ctx);
      const body = ctx.request.body || {};
      const result = await service.createDraft({
        userId,
        bandId: body.bandId,
        kind: body.kind,
        showRecapId: body.showRecapId,
        eventId: body.eventId,
        updateId: body.updateId,
        returnContext: body.returnContext,
      });
      return send(ctx, result);
    },

    async active(ctx) {
      const userId = await resolveUserId(strapi, ctx);
      const result = await service.getActiveDraft({
        userId,
        bandId: ctx.query.bandId,
        kind: ctx.query.kind,
        showRecapId: ctx.query.showRecapId,
        updateId: ctx.query.updateId,
      });
      return send(ctx, result);
    },

    async detail(ctx) {
      const userId = await resolveUserId(strapi, ctx);
      const result = await service.getDraft({ userId, sessionId: ctx.params.sessionId });
      return send(ctx, result);
    },

    async patch(ctx) {
      const userId = await resolveUserId(strapi, ctx);
      const body = ctx.request.body || {};
      const patch = { userId, sessionId: ctx.params.sessionId };
      for (const key of ['title', 'caption', 'mediaOrder', 'mediaCaptions', 'coverMediaId', 'showRecapId', 'eventId', 'returnContext']) {
        if (body[key] !== undefined) patch[key] = body[key];
      }
      const result = await service.patchDraft(patch);
      return send(ctx, result);
    },

    async audience(ctx) {
      const userId = await resolveUserId(strapi, ctx);
      const body = ctx.request.body || {};
      const result = await service.setAudience({
        userId,
        sessionId: ctx.params.sessionId,
        visibility: body.visibility,
        confirmClear: body.confirmClear === true,
      });
      return send(ctx, result);
    },

    async uploadMedia(ctx) {
      const userId = await resolveUserId(strapi, ctx);
      const incoming = ctx.request.files?.files || ctx.request.files?.file;
      const file = Array.isArray(incoming) ? incoming[0] : incoming;
      const result = await service.uploadDraftMedia({
        userId,
        sessionId: ctx.params.sessionId,
        file,
      });
      return send(ctx, result);
    },

    async removeMedia(ctx) {
      const userId = await resolveUserId(strapi, ctx);
      const result = await service.deleteDraftMedia({
        userId,
        sessionId: ctx.params.sessionId,
        mediaId: ctx.params.mediaId,
      });
      return send(ctx, result);
    },

    async streamMedia(ctx) {
      const userId = await resolveUserId(strapi, ctx);
      const result = await service.streamDraftMedia({
        userId,
        sessionId: ctx.params.sessionId,
        mediaId: ctx.params.mediaId,
        size: ctx.query.size,
      });
      if (result?.error) return send(ctx, result);
      ctx.set('Content-Type', result.mime || 'image/webp');
      ctx.set('Cache-Control', 'private, no-store');
      if (result.length) ctx.set('Content-Length', String(result.length));
      ctx.body = result.stream;
    },

    async publish(ctx) {
      const userId = await resolveUserId(strapi, ctx);
      const body = ctx.request.body || {};
      const result = await service.publishDraft({
        userId,
        sessionId: ctx.params.sessionId,
        publishIdempotencyKey: body.publishIdempotencyKey,
        showOnArtistPage: body.showOnArtistPage,
      });
      return send(ctx, result);
    },

    async discard(ctx) {
      const userId = await resolveUserId(strapi, ctx);
      const result = await service.discardDraft({ userId, sessionId: ctx.params.sessionId });
      return send(ctx, result);
    },
  };
});
