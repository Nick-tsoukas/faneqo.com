'use strict';

/**
 * Inbox / DM HTTP surface. Auth is enforced in-controller (JWT).
 * Generic CRUD is not routed.
 */

const { createCoreController } = require('@strapi/strapi').factories;
const { createInboxServiceFromStrapi } = require('../../../utils/inbox/directMessaging');
const fanAccount = require('../../../utils/fanAccount');
const { inboxLog, newInboxRequestId, jwtFailureReason, attachInboxRequest } = require('../../../utils/inbox/inboxLog');

function inbox(strapi) {
  return createInboxServiceFromStrapi(strapi);
}

function createResolveUserId(strapi) {
  return async function resolveUserId(ctx) {
    const requestId = attachInboxRequest(ctx, newInboxRequestId());
    if (ctx.state.user?.id) {
      return ctx.state.user.id;
    }
    const header = ctx.request.headers.authorization || ctx.request.headers.Authorization || '';
    const raw = typeof header === 'string' ? header : '';
    const token = raw.startsWith('Bearer ') ? raw.slice(7).trim() : '';
    if (!token) {
      inboxLog(strapi.log, 'auth:failed', { requestId, reason: 'missing_token' });
      return null;
    }
    try {
      const payload = await strapi.plugins['users-permissions'].services.jwt.verify(token);
      const actorUserId = payload?.id || null;
      if (!actorUserId) {
        inboxLog(strapi.log, 'auth:failed', { requestId, reason: 'user_not_found' });
        return null;
      }
      const method = String(ctx.request?.method || '').toUpperCase();
      if (method !== 'GET') {
        inboxLog(strapi.log, 'auth:success', { requestId, actorUserId, source: 'jwt' });
      }
      return actorUserId;
    } catch (err) {
      inboxLog(strapi.log, 'auth:failed', { requestId, reason: jwtFailureReason(err) });
      return null;
    }
  };
}

/**
 * Strapi ctx.send(body) defaults status to 200 and overwrites ctx.status.
 * Always pass the status as the second argument.
 */
function sendResult(ctx, result) {
  const requestId = ctx.state?.inboxRequestId;
  if (requestId) attachInboxRequest(ctx, requestId);
  if (result.ok) {
    const { ok, ...data } = result;
    return ctx.send({ data }, 200);
  }
  const status = result.status || 400;
  if (result.retryAfter) ctx.set('Retry-After', String(result.retryAfter));
  return ctx.send(
    {
      error: {
        status,
        name: result.error,
        message: result.message || 'Request failed',
        requestId: requestId || undefined,
      },
    },
    status
  );
}

async function claimInboxFanAccounts(strapi, userId, bandId) {
  if (!userId) return;
  try {
    const user = await strapi.entityService.findOne(
      'plugin::users-permissions.user',
      userId,
      { fields: ['id'] }
    );
    if (user) await fanAccount.claimFanRelationshipsForUser(user);
  } catch (err) {
    strapi.log.warn('[Inbox] claim current user skipped', { message: err?.message });
  }
  try {
    await fanAccount.claimUnlinkedFansByExistingUsers({ bandId });
  } catch (err) {
    strapi.log.warn('[Inbox] claim existing users skipped', { message: err?.message });
  }
}

module.exports = createCoreController('api::conversation.conversation', ({ strapi }) => {
  const resolveUserId = createResolveUserId(strapi);

  return {
    async start(ctx) {
      try {
        const userId = await resolveUserId(ctx);
        const body = ctx.request.body || {};
        const result = await inbox(strapi).getOrCreateConversationForFan({
          userId,
          bandId: body.bandId,
          fanId: body.fanId,
        });
        return sendResult(ctx, result);
      } catch (err) {
        strapi.log.error('[Inbox] start failed:', err);
        return ctx.internalServerError('Failed to start conversation');
      }
    },

    async list(ctx) {
      try {
        const userId = await resolveUserId(ctx);
        const result = await inbox(strapi).listArtistConversations({
          userId,
          bandId: ctx.query?.bandId,
          page: ctx.query?.page,
          pageSize: ctx.query?.pageSize,
        });
        return sendResult(ctx, result);
      } catch (err) {
        strapi.log.error('[Inbox] list failed:', err);
        return ctx.internalServerError('Failed to load conversations');
      }
    },

    async unreadCount(ctx) {
      try {
        const userId = await resolveUserId(ctx);
        const result = await inbox(strapi).unreadCountArtist({
          userId,
          bandId: ctx.query?.bandId,
        });
        return sendResult(ctx, result);
      } catch (err) {
        strapi.log.error('[Inbox] unread-count failed:', err);
        return ctx.internalServerError('Failed to load unread count');
      }
    },

    async dmCandidates(ctx) {
      try {
        const userId = await resolveUserId(ctx);
        await claimInboxFanAccounts(strapi, userId, ctx.query?.bandId);
        const result = await inbox(strapi).listDmCandidates({
          userId,
          bandId: ctx.query?.bandId,
          search: ctx.query?.search,
          limit: ctx.query?.limit,
        });
        return sendResult(ctx, result);
      } catch (err) {
        strapi.log.error('[Inbox] dm-candidates failed:', err);
        return ctx.internalServerError('Failed to load fans');
      }
    },

    async detail(ctx) {
      try {
        const userId = await resolveUserId(ctx);
        const result = await inbox(strapi).getConversation({
          userId,
          conversationId: ctx.params.id,
        });
        return sendResult(ctx, result);
      } catch (err) {
        strapi.log.error('[Inbox] detail failed:', err);
        return ctx.internalServerError('Failed to load conversation');
      }
    },

    async messages(ctx) {
      try {
        const userId = await resolveUserId(ctx);
        const q = ctx.query || {};
        const result = await inbox(strapi).listMessages({
          userId,
          conversationId: ctx.params.id,
          beforeId: q.beforeId,
          afterId: q.afterId,
          limit: q.limit,
        });
        return sendResult(ctx, result);
      } catch (err) {
        strapi.log.error('[Inbox] messages failed:', err);
        return ctx.internalServerError('Failed to load messages');
      }
    },

    async send(ctx) {
      try {
        const userId = await resolveUserId(ctx);
        const body = ctx.request.body || {};
        const result = await inbox(strapi).sendMessage({
          userId,
          conversationId: ctx.params.id,
          bodyText: body.bodyText,
          clientMessageId: body.clientMessageId,
          attachmentMediaId: body.attachmentMediaId,
          attachmentMediaIds: body.attachmentMediaIds,
          artistUpdateId: body.artistUpdateId,
        });
        return sendResult(ctx, result);
      } catch (err) {
        strapi.log.error('[Inbox] send failed:', err);
        return ctx.internalServerError('Failed to send message');
      }
    },

    async mediaDelivery(ctx) {
      try {
        const result = await inbox(strapi).mediaDeliveryStatus();
        return sendResult(ctx, result);
      } catch (err) {
        strapi.log.error('[Inbox] media delivery failed:', err);
        return ctx.internalServerError('Failed to check media delivery');
      }
    },

    async uploadMedia(ctx) {
      try {
        const userId = await resolveUserId(ctx);
        const incoming = ctx.request.files?.files || ctx.request.files?.file;
        const file = Array.isArray(incoming) ? incoming[0] : incoming;
        const result = await inbox(strapi).uploadConversationMedia({
          userId,
          conversationId: ctx.params.id,
          file,
        });
        return sendResult(ctx, result);
      } catch (err) {
        strapi.log.error('[Inbox] media upload failed:', err);
        return ctx.internalServerError('Failed to upload photo');
      }
    },

    async streamMedia(ctx) {
      try {
        const userId = await resolveUserId(ctx);
        const result = await inbox(strapi).streamConversationMedia({
          userId,
          conversationId: ctx.params.id,
          messageId: ctx.params.messageId,
          mediaId: ctx.params.mediaId,
          size: ctx.query.size,
          exp: ctx.query.exp,
          sig: ctx.query.sig,
        });
        if (result?.error || result?.ok === false) return sendResult(ctx, result.ok === false ? result : {
          ok: false,
          error: result.error,
          message: result.message,
          status: result.status || 404,
        });
        ctx.set('Content-Type', result.mime || 'image/webp');
        ctx.set('Cache-Control', 'private, no-store');
        if (result.length) ctx.set('Content-Length', String(result.length));
        ctx.body = result.stream;
        return;
      } catch (err) {
        strapi.log.error('[Inbox] media stream failed:', err);
        return ctx.internalServerError('Failed to load photo');
      }
    },

    async markRead(ctx) {
      try {
        const userId = await resolveUserId(ctx);
        const body = ctx.request.body || {};
        const result = await inbox(strapi).markRead({
          userId,
          conversationId: ctx.params.id,
          throughMessageId: body.throughMessageId,
        });
        return sendResult(ctx, result);
      } catch (err) {
        strapi.log.error('[Inbox] mark-read failed:', err);
        return ctx.internalServerError('Failed to mark read');
      }
    },

    async block(ctx) {
      try {
        const userId = await resolveUserId(ctx);
        const result = await inbox(strapi).setBlocked({
          userId,
          conversationId: ctx.params.id,
          blocked: true,
        });
        return sendResult(ctx, result);
      } catch (err) {
        strapi.log.error('[Inbox] block failed:', err);
        return ctx.internalServerError('Failed to block conversation');
      }
    },

    async unblock(ctx) {
      try {
        const userId = await resolveUserId(ctx);
        const result = await inbox(strapi).setBlocked({
          userId,
          conversationId: ctx.params.id,
          blocked: false,
        });
        return sendResult(ctx, result);
      } catch (err) {
        strapi.log.error('[Inbox] unblock failed:', err);
        return ctx.internalServerError('Failed to unblock conversation');
      }
    },

    async listRequests(ctx) {
      try {
        const userId = await resolveUserId(ctx);
        const result = await inbox(strapi).listArtistMessageRequests({
          userId,
          bandId: ctx.query?.bandId,
        });
        return sendResult(ctx, result);
      } catch (err) {
        strapi.log.error('[Inbox] list requests failed:', err);
        return ctx.internalServerError('Failed to load requests');
      }
    },

    async requestDetail(ctx) {
      try {
        const userId = await resolveUserId(ctx);
        const result = await inbox(strapi).getArtistMessageRequest({
          userId,
          requestId: ctx.params.id,
        });
        return sendResult(ctx, result);
      } catch (err) {
        strapi.log.error('[Inbox] request detail failed:', err);
        return ctx.internalServerError('Failed to load request');
      }
    },

    async acceptRequest(ctx) {
      try {
        const userId = await resolveUserId(ctx);
        const result = await inbox(strapi).acceptMessageRequest({
          userId,
          requestId: ctx.params.id,
        });
        return sendResult(ctx, result);
      } catch (err) {
        strapi.log.error('[Inbox] accept request failed:', err);
        return ctx.internalServerError('Failed to accept request');
      }
    },

    async declineRequest(ctx) {
      try {
        const userId = await resolveUserId(ctx);
        const result = await inbox(strapi).declineMessageRequest({
          userId,
          requestId: ctx.params.id,
        });
        return sendResult(ctx, result);
      } catch (err) {
        strapi.log.error('[Inbox] decline request failed:', err);
        return ctx.internalServerError('Failed to decline request');
      }
    },
  };
});
