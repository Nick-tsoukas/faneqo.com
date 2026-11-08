'use strict';

/**
 * Band Team Access controller (V1).
 * Owner-only team management + authenticated invite accept + my-access.
 */

const bandTeam = require('../services/band-team');

function statusForError(error) {
  switch (error) {
    case 'unauthorized':
      return 401;
    case 'forbidden':
      return 403;
    case 'not_found':
      return 404;
    case 'invalid_email':
    case 'invalid_role':
    case 'already_owner':
    case 'already_member':
    case 'self_invite':
    case 'not_pending':
    case 'not_active':
    case 'cannot_remove_owner':
    case 'cannot_change_owner':
    case 'wrong_email':
    case 'expired':
    case 'revoked':
    case 'invalid_token':
    case 'email_failed':
    case 'rate_limited':
      return 400;
    default:
      return 400;
  }
}

function sendResult(ctx, result) {
  // Explicitly set status + body. Returning a plain object alone can leave
  // some Strapi/Koa paths as 200, which would make $fetch treat failures as success.
  if (!result?.ok) {
    ctx.status = statusForError(result?.error);
    ctx.body = {
      error: result?.error || 'error',
      message: result?.message || 'Request failed.',
      ...(result?.data ? { data: result.data } : {}),
    };
    return;
  }
  ctx.status = 200;
  ctx.body = { data: result.data };
}

module.exports = {
  /**
   * GET /api/bands/:id/team
   */
  async getTeam(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('You must be logged in.');

    try {
      const result = await bandTeam.getTeam({
        strapi,
        bandId: ctx.params.id,
        userId: user.id,
      });
      return sendResult(ctx, result);
    } catch (err) {
      strapi.log.error(`[band-team] getTeam failed: ${err.message}`);
      return ctx.internalServerError('Unable to load team.');
    }
  },

  /**
   * POST /api/bands/:id/invites
   * Body: { email, role }
   */
  async createInvite(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('You must be logged in.');

    const { email, role } = ctx.request.body || {};

    try {
      const result = await bandTeam.createInvite({
        strapi,
        bandId: ctx.params.id,
        userId: user.id,
        email,
        role,
        inviterEmail: user.email,
      });
      return sendResult(ctx, result);
    } catch (err) {
      strapi.log.error(`[band-team] createInvite failed: ${err.message}`);
      return ctx.internalServerError('Unable to create invite.');
    }
  },

  /**
   * POST /api/bands/:id/invites/:inviteId/resend
   */
  async resendInvite(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('You must be logged in.');

    try {
      const result = await bandTeam.resendInvite({
        strapi,
        bandId: ctx.params.id,
        userId: user.id,
        inviteId: ctx.params.inviteId,
        inviterEmail: user.email,
      });
      return sendResult(ctx, result);
    } catch (err) {
      strapi.log.error(`[band-team] resendInvite failed: ${err.message}`);
      return ctx.internalServerError('Unable to resend invite.');
    }
  },

  /**
   * POST /api/bands/:id/invites/:inviteId/revoke
   */
  async revokeInvite(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('You must be logged in.');

    try {
      const result = await bandTeam.revokeInvite({
        strapi,
        bandId: ctx.params.id,
        userId: user.id,
        inviteId: ctx.params.inviteId,
      });
      return sendResult(ctx, result);
    } catch (err) {
      strapi.log.error(`[band-team] revokeInvite failed: ${err.message}`);
      return ctx.internalServerError('Unable to revoke invite.');
    }
  },

  /**
   * POST /api/bands/:id/members/:memberId/role
   * Body: { role: 'manager' | 'viewer' }
   */
  async updateMemberRole(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('You must be logged in.');

    const { role } = ctx.request.body || {};

    try {
      const result = await bandTeam.updateMemberRole({
        strapi,
        bandId: ctx.params.id,
        userId: user.id,
        memberId: ctx.params.memberId,
        role,
      });
      return sendResult(ctx, result);
    } catch (err) {
      strapi.log.error(`[band-team] updateMemberRole failed: ${err.message}`);
      return ctx.internalServerError('Unable to update member role.');
    }
  },

  /**
   * POST /api/bands/:id/members/:memberId/remove
   */
  async removeMember(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('You must be logged in.');

    try {
      const result = await bandTeam.removeMember({
        strapi,
        bandId: ctx.params.id,
        userId: user.id,
        memberId: ctx.params.memberId,
      });
      return sendResult(ctx, result);
    } catch (err) {
      strapi.log.error(`[band-team] removeMember failed: ${err.message}`);
      return ctx.internalServerError('Unable to remove team member.');
    }
  },

  /**
   * POST /api/invites/accept
   * Body: { token }
   */
  async acceptInvite(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('You must be logged in.');

    const token = ctx.request.body?.token;

    try {
      const result = await bandTeam.acceptInvite({
        strapi,
        user,
        rawToken: token,
      });
      return sendResult(ctx, result);
    } catch (err) {
      strapi.log.error(`[band-team] acceptInvite failed: ${err.message}`);
      return ctx.internalServerError('Unable to accept invite.');
    }
  },

  /**
   * GET /api/me/band-access
   * Owned bands + accepted team memberships (safe list only).
   */
  async getMyAccess(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('You must be logged in.');

    try {
      const result = await bandTeam.getMyAccess({
        strapi,
        userId: user.id,
      });
      return sendResult(ctx, result);
    } catch (err) {
      strapi.log.error(`[band-team] getMyAccess failed: ${err.message}`);
      return ctx.internalServerError('Unable to load band access.');
    }
  },
};
