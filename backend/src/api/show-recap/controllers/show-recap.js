'use strict';

/**
 * show-recap controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

const showMessageService = require('../services/show-message');
const { requireBandPermission } = require('../../../utils/bandRoles');
const { resolveAuthorizedWorkspaceBand } = require('../../../utils/bands/resolveAuthorizedWorkspaceBand');
const { isCampaignTestModeEnabled } = require('../../../utils/messaging/campaignTestMode');
const {
  createPublicShareService,
  resolveOptionalUserId,
  cacheHeaders,
} = require('../../../utils/showMode/publicShareService');

module.exports = createCoreController('api::show-recap.show-recap', ({ strapi }) => ({

  /**
   * Resolve the caller's band and the recap they're acting on.
   * Messaging requires sendFanMessages (owner-only in Team Access V1).
   */
  async resolveOwnedRecap(ctx, recapId) {
    const user = ctx.state.user;
    if (!user) return { error: ctx.unauthorized('Authentication required') };

    const recap = await strapi.entityService.findOne('api::show-recap.show-recap', recapId, {
      populate: { band: { fields: ['id', 'name'] } },
    });

    if (!recap) return { error: ctx.notFound('Recap not found') };

    const bandId = recap.band?.id || recap.band;
    if (!bandId) return { error: ctx.forbidden('Recap has no band') };

    const access = await requireBandPermission(strapi, user.id, bandId, 'sendFanMessages');
    if (!access) {
      return { error: ctx.forbidden('Only the band owner can send fan messages') };
    }

    const band = {
      id: bandId,
      name: recap.band?.name || '',
    };

    // Ensure we have the band name if relation was id-only
    if (!band.name) {
      const fullBand = await strapi.entityService.findOne('api::band.band', bandId, {
        fields: ['id', 'name'],
      });
      band.name = fullBand?.name || '';
    }

    return { band, recap, user };
  },

  /**
   * GET /api/show-recaps/:id/message
   * Who would receive a message, and whether one can be sent right now.
   */
  async messagePreview(ctx) {
    try {
      const { error, band, recap, user } = await this.resolveOwnedRecap(ctx, parseInt(ctx.params.id));
      if (error) return error;

      const channel = String(ctx.query?.channel || 'email').trim();
      if (!['email', 'in_app'].includes(channel)) {
        return ctx.badRequest('Unsupported delivery channel');
      }

      const attendees = await showMessageService.getRecipients({
        bandId: band.id,
        campaignId: recap.campaignId,
        channel,
        excludeAccountUserId: user.id,
      });

      const { sendable, cooling } = showMessageService.partitionRecipients(attendees, {
        bandId: band.id,
        channel,
      });

      return ctx.send({
        data: {
          recipientCount: sendable.length,
          channel,
          cooldownCount: cooling.length,
          attendeeCount: attendees.length,
          cooldownHours: channel === 'in_app' ? 0 : showMessageService.FAN_COOLDOWN_HOURS,
          maxShowAgeDays: showMessageService.MAX_SHOW_AGE_DAYS,
          bandName: band.name || '',
          defaultSubject: channel === 'in_app'
            ? `Inbox message from ${band.name || 'your band'}`
            : showMessageService.defaultSubject({ recap, bandName: band.name || '' }),
          maxSubjectLength: showMessageService.MAX_SUBJECT_LENGTH,
          maxNoteLength: showMessageService.MAX_NOTE_LENGTH,
          ...showMessageService.getSendEligibility({
            recap,
            sendableCount: sendable.length,
            coolingCount: cooling.length,
            channel,
          }),
          ...(isCampaignTestModeEnabled() ? { cooldownBypassedForTesting: true } : {}),
          messagesSentCount: recap.messagesSentCount || 0,
          lastMessageSentAt: recap.lastMessageSentAt || null,
          lastMessageRecipientCount: recap.lastMessageRecipientCount || 0,
        },
      });
    } catch (err) {
      strapi.log.error('Error building message preview:', err);
      return ctx.internalServerError('Failed to load message details');
    }
  },

  /**
   * POST /api/show-recaps/:id/message  { note }
   * Email everyone who checked in to this show.
   */
  async sendMessage(ctx) {
    try {
      const { error, band, recap, user } = await this.resolveOwnedRecap(ctx, parseInt(ctx.params.id));
      if (error) return error;

      const { subject, note, channel = 'email', artistUpdateId = null } = ctx.request.body || {};

      const result = await showMessageService.sendShowMessage({
        recap,
        band,
        subject,
        note,
        // Replies belong to the band, not to a noreply inbox.
        replyTo: user.email || null,
        createdByUserId: user.id,
        channel,
        artistUpdateId,
      });

      if (result.error) {
        return ctx.badRequest(result.message || 'Could not send this message', { reason: result.error });
      }

      // Queued for background delivery — composer polls /message-campaigns/:id/status
      return ctx.send({ data: result });
    } catch (err) {
      strapi.log.error('Error sending show message:', err);
      return ctx.internalServerError('Failed to send message');
    }
  },

  sendRecapAuthError(ctx, result) {
    if (!result?.error) return null;
    if (result.status === 401) return ctx.unauthorized(result.message);
    if (result.status === 403) return ctx.forbidden(result.message);
    if (result.status === 404) return ctx.notFound(result.message);
    return ctx.badRequest(result.message);
  },

  /**
   * GET /api/show-recaps/my-recaps
   * Paginated Nights for the authorized workspace band (owner or team).
   */
  async myRecaps(ctx) {
    try {
      const user = ctx.state.user;
      if (!user) {
        return ctx.unauthorized('Authentication required');
      }

      const { page = 1, pageSize = 10, bandId, search } = ctx.query;

      const result = await strapi.service('api::show-recap.show-recap').listMyRecaps({
        userId: user.id,
        bandId,
        page: parseInt(page),
        pageSize: Math.min(parseInt(pageSize), 50),
        search,
      });

      const authError = this.sendRecapAuthError(ctx, result);
      if (authError) return authError;

      return ctx.send(result);
    } catch (error) {
      strapi.log.error(`[ShowRecap] myRecaps failed: ${error.message}`, { stack: error.stack });
      return ctx.internalServerError('Failed to fetch show recaps');
    }
  },

  /**
   * GET /api/show-recaps/latest/me
   * Latest Night for the authorized workspace band (owner or team).
   */
  async latestRecap(ctx) {
    try {
      const user = ctx.state.user;
      if (!user) {
        return ctx.unauthorized('Authentication required');
      }

      const result = await strapi.service('api::show-recap.show-recap').getLatestForMe({
        userId: user.id,
        bandId: ctx.query?.bandId,
      });

      const authError = this.sendRecapAuthError(ctx, result);
      if (authError) return authError;

      return ctx.send({ data: result.data });
    } catch (error) {
      strapi.log.error(`[ShowRecap] latestRecap failed: ${error.message}`, { stack: error.stack });
      return ctx.internalServerError('Failed to fetch latest recap');
    }
  },

  /**
   * GET /api/show-recaps/:id
   * Recap detail authorized against the recap's band (owner or team).
   */
  async recapDetail(ctx) {
    try {
      const user = ctx.state.user;
      if (!user) {
        return ctx.unauthorized('Authentication required');
      }

      const result = await strapi.service('api::show-recap.show-recap').getAuthorizedRecapDetail({
        userId: user.id,
        recapId: parseInt(ctx.params.id, 10),
      });

      const authError = this.sendRecapAuthError(ctx, result);
      if (authError) return authError;

      return ctx.send({ data: result.data });
    } catch (error) {
      strapi.log.error('Error fetching recap detail:', error);
      return ctx.internalServerError('Failed to fetch recap detail');
    }
  },

  /**
   * POST /api/show-recaps/generate
   * Manually trigger recap generation (admin/debug)
   */
  async generateRecap(ctx) {
    try {
      const user = ctx.state.user;
      if (!user) {
        return ctx.unauthorized('Authentication required');
      }

      const { campaignId, bandId } = ctx.request.body;

      if (!campaignId) {
        return ctx.badRequest('campaignId is required');
      }

      // bandId is an optional hint, authorized by requireBandPermission like
      // every other Night endpoint. Without it a caller who owns more than one
      // band falls back to their first, which would attach an empty recap for
      // this campaign to the wrong artist.
      const scope = await resolveAuthorizedWorkspaceBand(
        strapi,
        user.id,
        'operateShowMode',
        bandId
      );
      if (scope.error === 'forbidden' || scope.error === 'band_id_invalid') {
        return ctx.forbidden('You do not have access to that band');
      }
      if (!scope.bandId) {
        return ctx.forbidden('No band found');
      }

      const recap = await strapi.service('api::show-recap.show-recap').generateShowRecap({
        bandId: scope.bandId,
        campaignId,
      });

      if (!recap) {
        return ctx.badRequest('Failed to generate recap');
      }

      return ctx.send({ data: recap, message: 'Recap generated successfully' });
    } catch (error) {
      strapi.log.error('Error generating recap:', error);
      return ctx.internalServerError('Failed to generate recap');
    }
  },

  /**
   * GET /api/show-recaps/:id/night
   * Artist/team Night detail. Private note only for owner/manager.
   */
  async getNight(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('Authentication required');

    try {
      const result = await strapi.service('api::show-recap.show-recap').getArtistNight({
        recapId: parseInt(ctx.params.id, 10),
        userId: user.id,
      });
      if (result?.error) {
        ctx.status = result.status || 400;
        return { error: { name: result.error, message: result.message } };
      }
      return ctx.send({ data: result.data });
    } catch (error) {
      strapi.log.error('Error fetching Night detail:', error);
      return ctx.internalServerError('Failed to fetch Night');
    }
  },

  /**
   * PATCH /api/show-recaps/:id/night
   * Post-show artist enrichment. Owner/manager only.
   */
  async updateNight(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('Authentication required');

    try {
      const body = ctx.request.body || {};
      const result = await strapi.service('api::show-recap.show-recap').enrichNight({
        recapId: parseInt(ctx.params.id, 10),
        userId: user.id,
        patch: {
          ...(Object.prototype.hasOwnProperty.call(body, 'publicStory') ? { publicStory: body.publicStory } : {}),
          ...(Object.prototype.hasOwnProperty.call(body, 'privateArtistNote') ? { privateArtistNote: body.privateArtistNote } : {}),
          ...(Object.prototype.hasOwnProperty.call(body, 'lineup') ? { lineup: body.lineup } : {}),
          ...(Object.prototype.hasOwnProperty.call(body, 'coverMediaId') ? { coverMediaId: body.coverMediaId } : {}),
          ...(Object.prototype.hasOwnProperty.call(body, 'heroMediaId') ? { heroMediaId: body.heroMediaId } : {}),
          ...(Object.prototype.hasOwnProperty.call(body, 'heroFocalX') ? { heroFocalX: body.heroFocalX } : {}),
          ...(Object.prototype.hasOwnProperty.call(body, 'heroFocalY') ? { heroFocalY: body.heroFocalY } : {}),
        },
      });
      if (result?.error) {
        ctx.status = result.status || 400;
        return { error: { name: result.error, message: result.message } };
      }
      return ctx.send({ data: result.data });
    } catch (error) {
      strapi.log.error('Error enriching Night:', error);
      return ctx.internalServerError('Failed to update Night');
    }
  },

  /**
   * GET /api/public/bands/:bandSlug/nights/:nightSlug
   * Anonymous public Night. Optional JWT enriches viewer relationship.
   */
  async publicNight(ctx) {
    const userId = await resolveOptionalUserId(strapi, ctx);
    const headers = cacheHeaders(userId);
    Object.entries(headers).forEach(([key, value]) => ctx.set(key, value));
    try {
      const service = createPublicShareService(strapi);
      const result = await service.getPublicNight({
        bandSlug: ctx.params.bandSlug,
        nightSlug: ctx.params.nightSlug,
        userId,
      });
      if (result?.error) {
        ctx.status = result.status || 404;
        return { error: { name: result.error, message: result.message } };
      }
      return ctx.send({ data: result.data });
    } catch (error) {
      strapi.log.error('Error fetching public Night:', error);
      return ctx.internalServerError('Failed to load Night');
    }
  },
}));
