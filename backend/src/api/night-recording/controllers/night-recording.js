'use strict';

const { createCoreController } = require('@strapi/strapi').factories;
const { createNightRecordingService } = require('../../../utils/nightRecordings/nightRecordingService');
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
    strapi.log.info(`[Faneqo Night Recordings] auth:failed reason=${jwtFailureReason(err)}`);
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

module.exports = createCoreController('api::night-recording.night-recording', ({ strapi }) => {
  const service = createNightRecordingService(strapi);
  return {
    async listForNight(ctx) {
      return send(ctx, await service.listForNight({
        userId: await resolveUserId(strapi, ctx),
        recapId: ctx.params.id,
      }));
    },

    async createForNight(ctx) {
      return send(ctx, await service.createForNight({
        userId: await resolveUserId(strapi, ctx),
        recapId: ctx.params.id,
        body: ctx.request.body || {},
      }));
    },

    async detail(ctx) {
      return send(ctx, await service.detail({
        userId: await resolveUserId(strapi, ctx),
        recordingId: ctx.params.id,
      }));
    },

    async update(ctx) {
      return send(ctx, await service.update({
        userId: await resolveUserId(strapi, ctx),
        recordingId: ctx.params.id,
        body: ctx.request.body || {},
      }));
    },

    async remove(ctx) {
      return send(ctx, await service.remove({
        userId: await resolveUserId(strapi, ctx),
        recordingId: ctx.params.id,
      }));
    },
  };
});
