'use strict';

const { createCoreController } = require('@strapi/strapi').factories;
const { createFanPassportService } = require('../../../utils/passport/passportService');
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
    strapi.log.info(`[Faneqo Passport] auth:failed reason=${jwtFailureReason(err)}`);
    return null;
  }
}

function send(ctx, result) {
  if (result?.error) {
    ctx.status = result.status || 400;
    ctx.body = { error: { name: result.error, message: result.message } };
    return;
  }
  ctx.status = 200;
  ctx.body = result;
}

module.exports = createCoreController('api::passport-gallery-save.passport-gallery-save', ({ strapi }) => {
  const service = createFanPassportService(strapi);
  return {
    async listMemories(ctx) {
      return send(ctx, await service.listMemories({ userId: await resolveUserId(strapi, ctx) }));
    },
    async getMemory(ctx) {
      return send(ctx, await service.getMemory({
        userId: await resolveUserId(strapi, ctx),
        attendanceId: ctx.params.id,
      }));
    },
    async list(ctx) {
      return send(ctx, await service.listGallerySaves({ userId: await resolveUserId(strapi, ctx) }));
    },
    async save(ctx) {
      return send(ctx, await service.saveGallery({
        userId: await resolveUserId(strapi, ctx),
        artistUpdateId: ctx.params.id,
      }));
    },
    async remove(ctx) {
      return send(ctx, await service.removeGallery({
        userId: await resolveUserId(strapi, ctx),
        artistUpdateId: ctx.params.id,
      }));
    },
  };
});
