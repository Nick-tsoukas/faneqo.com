'use strict';

/**
 * Fan account conversion endpoints (public + authenticated).
 * No CRUD surface — magic-link + eligibility + claim only.
 */

const crypto = require('crypto');
const fanAccount = require('../../../utils/fanAccount');
const { followArtistForUser, unfollowArtistForUser, endArtistRelationshipForVisitor } = require('../../../utils/fans/fanFollowWrite');
const { createInboxServiceFromStrapi } = require('../../../utils/inbox/directMessaging');
const { createFanProfileService } = require('../../../utils/fanProfile/fanProfileService');
const { inboxLog, newInboxRequestId, jwtFailureReason, attachInboxRequest } = require('../../../utils/inbox/inboxLog');

function sendInboxResult(ctx, result) {
  const requestId = ctx.state?.inboxRequestId;
  if (requestId) attachInboxRequest(ctx, requestId);
  if (result.ok) {
    const { ok, ...data } = result;
    return ctx.send({ data }, 200);
  }
  const status = result.status || 400;
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

function clientFingerprint(ctx) {
  const ip = ctx.request.ip || ctx.ip || '';
  const ua = ctx.request.headers['user-agent'] || '';
  return crypto.createHash('sha256').update(`${ip}|${ua}`).digest('hex').slice(0, 32);
}

/** Optional JWT on public routes (auth: false still often sets ctx.state.user). */
async function resolveUserId(ctx) {
  const requestId = attachInboxRequest(ctx, newInboxRequestId());
  if (ctx.state.user?.id) return ctx.state.user.id;
  const header = ctx.request.headers.authorization || ctx.request.headers.Authorization || '';
  const raw = typeof header === 'string' ? header : '';
  const token = raw.startsWith('Bearer ') ? raw.slice(7).trim() : '';
  if (!token) {
    inboxLog(strapi.log, 'auth:failed', { requestId, reason: 'missing_token', surface: 'fan-account' });
    return null;
  }
  try {
    const payload = await strapi.plugins['users-permissions'].services.jwt.verify(token);
    const actorUserId = payload?.id || null;
    if (!actorUserId) {
      inboxLog(strapi.log, 'auth:failed', { requestId, reason: 'user_not_found', surface: 'fan-account' });
      return null;
    }
    return actorUserId;
  } catch (err) {
    inboxLog(strapi.log, 'auth:failed', { requestId, reason: jwtFailureReason(err), surface: 'fan-account' });
    return null;
  }
}

module.exports = {
  /**
   * POST /api/fan-account/eligibility
   * Body: { visitorToken?, context?: { trigger?, saveAttempt?, messageClick?, bandName? } }
   */
  async eligibility(ctx) {
    try {
      const body = ctx.request.body || {};
      const userId = await resolveUserId(ctx);
      const result = await fanAccount.getFanAccountPromptEligibility({
        visitorToken: body.visitorToken || body.token || null,
        currentContext: body.context || {},
        userId,
      });
      return ctx.send({ data: result });
    } catch (err) {
      strapi.log.error('[FanAccount] eligibility failed:', err);
      return ctx.internalServerError('Failed to evaluate eligibility');
    }
  },

  /**
   * POST /api/fan-account/dismiss
   * Body: { visitorToken, trigger }
   */
  async dismiss(ctx) {
    try {
      const body = ctx.request.body || {};
      const result = await fanAccount.recordPromptEvent({
        visitorToken: body.visitorToken || body.token || null,
        trigger: body.trigger || null,
        dismissed: true,
      });
      if (!result.ok) {
        return ctx.badRequest(result.error || 'dismiss_failed');
      }
      return ctx.send({ data: { dismissed: true } });
    } catch (err) {
      strapi.log.error('[FanAccount] dismiss failed:', err);
      return ctx.internalServerError('Failed to record dismissal');
    }
  },

  /**
   * POST /api/fan-account/prompt-shown
   * Body: { visitorToken, trigger } — starts hard frequency window without counting as dismiss
   */
  async promptShown(ctx) {
    try {
      const body = ctx.request.body || {};
      const result = await fanAccount.recordPromptEvent({
        visitorToken: body.visitorToken || body.token || null,
        trigger: body.trigger || null,
        dismissed: false,
      });
      if (!result.ok) {
        return ctx.badRequest(result.error || 'record_failed');
      }
      return ctx.send({ data: { recorded: true } });
    } catch (err) {
      strapi.log.error('[FanAccount] prompt-shown failed:', err);
      return ctx.internalServerError('Failed to record prompt');
    }
  },

  /**
   * POST /api/fan-account/request-link
   * Body: { visitorToken?, email?, trigger?, returnTo? }
   */
  async requestLink(ctx) {
    try {
      const body = ctx.request.body || {};
      const result = await fanAccount.requestMagicLink({
        visitorToken: body.visitorToken || body.token || null,
        email: body.email || null,
        trigger: body.trigger || null,
        fingerprint: clientFingerprint(ctx),
        returnTo: body.returnTo || null,
      });

      if (!result.ok) {
        // Only email_required is a hard client error — never reveal fan-list membership
        const status = result.error === 'email_required' ? 400 : 400;
        ctx.status = status;
        return ctx.send({
          error: {
            status,
            name: result.error,
            message: result.message || 'Enter the email you use with artists on Faneqo.',
          },
        });
      }

      return ctx.send({
        data: {
          sent: true,
          message: result.message || 'If that email can be used, we have sent a link.',
          emailMasked: result.emailMasked || null,
          expiresInSeconds: result.expiresInSeconds || null,
        },
      });
    } catch (err) {
      strapi.log.error('[FanAccount] request-link failed:', err);
      return ctx.internalServerError('Failed to request sign-in link');
    }
  },

  /**
   * POST /api/fan-account/verify
   * Body: { token }
   * Prefer POST so tokens are not left in referrer logs as much as GET.
   */
  async verify(ctx) {
    try {
      const body = ctx.request.body || {};
      const query = ctx.query || {};
      const rawToken = body.token || query.token || null;

      const result = await fanAccount.verifyMagicLink({ rawToken });
      if (!result.ok) {
        ctx.status = 400;
        return ctx.send({
          error: {
            status: 400,
            name: result.error,
            message:
              result.error === 'token_expired'
                ? 'This sign-in link has expired. Request a new one.'
                : result.error === 'token_used'
                  ? 'This sign-in link was already used.'
                  : 'This sign-in link is invalid.',
          },
        });
      }

      return ctx.send({
        data: {
          jwt: result.jwt,
          user: result.user,
          created: result.created,
          claim: {
            claimed: result.claim?.claimed || 0,
            alreadyLinked: result.claim?.alreadyLinked || 0,
            artistCount: result.claim?.artistCount || 0,
          },
          redirectTo: result.redirectTo,
        },
      });
    } catch (err) {
      strapi.log.error('[FanAccount] verify failed:', err);
      return ctx.internalServerError('Failed to verify sign-in link');
    }
  },

  /**
   * GET /api/fan-account/me
   * Auth optional. Returns accountState without unnecessary PII.
   */
  async me(ctx) {
    try {
      const userId = await resolveUserId(ctx);
      const visitorToken =
        ctx.query?.visitorToken || ctx.request.body?.visitorToken || null;
      const data = await fanAccount.getMeStatus({ userId, visitorToken });
      return ctx.send({ data });
    } catch (err) {
      strapi.log.error('[FanAccount] me failed:', err);
      return ctx.internalServerError('Failed to load account status');
    }
  },

  /**
   * GET /api/fan-account/artists — authenticated fan home
   */
  async artists(ctx) {
    try {
      const userId = await resolveUserId(ctx);
      if (!userId) return ctx.unauthorized('Authentication required');

      // Ensure fan profile exists for artist users browsing /fan
      await fanAccount.ensureFanProfile(userId);
      // Re-claim on visit (idempotent) using account email
      const user = await strapi.entityService.findOne(
        'plugin::users-permissions.user',
        userId,
        { fields: ['id', 'email'] }
      );
      if (user) {
        await fanAccount.claimFanRelationshipsForUser(user);
      }

      const artists = await fanAccount.listClaimedArtists(userId);
      return ctx.send({ data: { artists } });
    } catch (err) {
      strapi.log.error('[FanAccount] artists failed:', err);
      return ctx.internalServerError('Failed to load artists');
    }
  },

  /**
   * POST /api/fan-account/artists/:bandId/follow
   * Self-scoped. Uses authenticated account email. Does not change email status.
   */
  async follow(ctx) {
    try {
      const userId = await resolveUserId(ctx);
      if (!userId) return ctx.unauthorized('Authentication required');
      const result = await followArtistForUser(strapi, {
        userId,
        bandId: ctx.params.bandId,
      });
      if (!result.ok) {
        const status = result.status || 400;
        return ctx.send({ error: { status, name: result.error, message: 'Follow failed' } }, status);
      }
      return ctx.send({ data: result });
    } catch (err) {
      strapi.log.error('[FanAccount] follow failed:', err);
      return ctx.internalServerError('Failed to follow');
    }
  },

  /**
   * POST /api/fan-account/artists/:bandId/unfollow
   * Ends the relationship: Follow off and Fan List leave.
   * JWT uses account email. Anonymous uses the visitor already linked to this band.
   * Never accepts a client Fan id or email.
   */
  async unfollow(ctx) {
    try {
      const header = ctx.request.headers.authorization || ctx.request.headers.Authorization || '';
      const hasBearer = typeof header === 'string' && header.startsWith('Bearer ');
      if (hasBearer) {
        const userId = await resolveUserId(ctx);
        if (!userId) return ctx.unauthorized('Authentication required');
        const result = await unfollowArtistForUser(strapi, {
          userId,
          bandId: ctx.params.bandId,
        });
        if (!result.ok) {
          const status = result.status || 400;
          return ctx.send({ error: { status, name: result.error, message: 'Unfollow failed' } }, status);
        }
        return ctx.send({ data: result });
      }

      const result = await endArtistRelationshipForVisitor(strapi, {
        visitorToken: ctx.request.body?.visitorToken || null,
        bandId: ctx.params.bandId,
      });
      if (!result.ok) {
        const status = result.status || 400;
        return ctx.send({ error: { status, name: result.error, message: 'Unfollow failed' } }, status);
      }
      return ctx.send({ data: result });
    } catch (err) {
      strapi.log.error('[FanAccount] unfollow failed:', err);
      return ctx.internalServerError('Failed to unfollow');
    }
  },

  /**
   * GET /api/fan-account/conversations
   * Self-scoped Inbox list for the authenticated fan account.
   */
  async listConversations(ctx) {
    try {
      const userId = await resolveUserId(ctx);
      if (!userId) return ctx.unauthorized('Authentication required');
      const result = await createInboxServiceFromStrapi(strapi).listFanConversations({
        userId,
        page: ctx.query?.page,
        pageSize: ctx.query?.pageSize,
      });
      return sendInboxResult(ctx, result);
    } catch (err) {
      strapi.log.error('[FanAccount] conversations failed:', err);
      return ctx.internalServerError('Failed to load conversations');
    }
  },

  /**
   * GET /api/fan-account/conversations/unread-count
   */
  async conversationsUnreadCount(ctx) {
    try {
      const userId = await resolveUserId(ctx);
      if (!userId) return ctx.unauthorized('Authentication required');
      const result = await createInboxServiceFromStrapi(strapi).unreadCountFan({ userId });
      return sendInboxResult(ctx, result);
    } catch (err) {
      strapi.log.error('[FanAccount] conversations unread-count failed:', err);
      return ctx.internalServerError('Failed to load unread count');
    }
  },

  /**
   * GET /fan-account/message-status?bandId=
   */
  async messageStatus(ctx) {
    try {
      const userId = await resolveUserId(ctx);
      const result = await createInboxServiceFromStrapi(strapi).getFanMessageStatus({
        userId,
        bandId: ctx.query?.bandId,
      });
      return sendInboxResult(ctx, result);
    } catch (err) {
      strapi.log.error('[Fan Account] message-status failed:', err);
      return ctx.internalServerError('Failed to load message status');
    }
  },

  /**
   * GET /fan-account/profile — the authenticated fan's global profile.
   * Ownership comes from the JWT; no id is ever read from the request.
   */
  async getProfile(ctx) {
    try {
      const userId = await resolveUserId(ctx);
      if (!userId) return ctx.unauthorized('Authentication required');
      const result = await createFanProfileService(strapi).getSelfProfile({ userId });
      return sendInboxResult(ctx, result);
    } catch (err) {
      strapi.log.error('[Fan Account] get profile failed:', err);
      return ctx.internalServerError('Failed to load profile');
    }
  },

  /**
   * PATCH /fan-account/profile — edit the global fan profile.
   * Distinct from POST below, which syncs band-scoped Fan names for messaging.
   */
  async patchProfile(ctx) {
    try {
      const userId = await resolveUserId(ctx);
      if (!userId) return ctx.unauthorized('Authentication required');
      const result = await createFanProfileService(strapi).updateSelfProfile({
        userId,
        body: ctx.request.body || {},
      });
      return sendInboxResult(ctx, result);
    } catch (err) {
      strapi.log.error('[Fan Account] patch profile failed:', err);
      return ctx.internalServerError('Failed to update profile');
    }
  },

  /**
   * POST /fan-account/avatar — multipart profile photo.
   * Ownership is the JWT. File ids in the body are rejected, not attached.
   */
  async uploadAvatar(ctx) {
    try {
      const userId = await resolveUserId(ctx);
      if (!userId) return ctx.unauthorized('Authentication required');
      const result = await createFanProfileService(strapi).uploadSelfAvatar({
        userId,
        incoming: ctx.request.files || ctx.request.body?.files || ctx.request.body,
        body: ctx.request.body || {},
      });
      return sendInboxResult(ctx, result);
    } catch (err) {
      strapi.log.error('[Fan Account] avatar upload failed:', err);
      return ctx.internalServerError('Failed to update photo');
    }
  },

  /**
   * DELETE /fan-account/avatar — remove the caller's profile photo.
   * Idempotent when no avatar exists. Does not change profileCompletedAt.
   */
  async deleteAvatar(ctx) {
    try {
      const userId = await resolveUserId(ctx);
      if (!userId) return ctx.unauthorized('Authentication required');
      const result = await createFanProfileService(strapi).deleteSelfAvatar({
        userId,
        body: ctx.request.body || {},
      });
      return sendInboxResult(ctx, result);
    } catch (err) {
      strapi.log.error('[Fan Account] avatar delete failed:', err);
      return ctx.internalServerError('Failed to remove photo');
    }
  },

  /**
   * POST /fan-account/profile
   * Legacy: synchronizes first/last name across claimed band-scoped Fan rows
   * for messaging. Contract is frozen — global profile edits go through PATCH.
   */
  async updateProfile(ctx) {
    try {
      const userId = await resolveUserId(ctx);
      if (!userId) return ctx.unauthorized('Authentication required');
      const body = ctx.request.body || {};
      const result = await createInboxServiceFromStrapi(strapi).updateFanMessagingProfile({
        userId,
        bandId: body.bandId,
        firstName: body.firstName,
        lastName: body.lastName,
      });
      return sendInboxResult(ctx, result);
    } catch (err) {
      strapi.log.error('[Fan Account] profile failed:', err);
      return ctx.internalServerError('Failed to update profile');
    }
  },

  /**
   * GET /fan-account/message-requests
   */
  async listMessageRequests(ctx) {
    try {
      const userId = await resolveUserId(ctx);
      if (!userId) return ctx.unauthorized('Authentication required');
      const result = await createInboxServiceFromStrapi(strapi).listFanMessageRequests({ userId });
      return sendInboxResult(ctx, result);
    } catch (err) {
      strapi.log.error('[Fan Account] message-requests failed:', err);
      return ctx.internalServerError('Failed to load requests');
    }
  },

  /**
   * POST /fan-account/message-requests
   */
  async createMessageRequest(ctx) {
    try {
      const userId = await resolveUserId(ctx);
      if (!userId) return ctx.unauthorized('Authentication required');
      const body = ctx.request.body || {};
      const result = await createInboxServiceFromStrapi(strapi).createFanMessageRequest({
        userId,
        bandId: body.bandId,
        bodyText: body.bodyText,
        firstName: body.firstName,
        lastName: body.lastName,
      });
      return sendInboxResult(ctx, result);
    } catch (err) {
      strapi.log.error('[Fan Account] create message-request failed:', err);
      return ctx.internalServerError('Failed to send request');
    }
  },
};
