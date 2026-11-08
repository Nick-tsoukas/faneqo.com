'use strict';

/**
 * Generic Faneqo message campaign API.
 *
 * Message the Room still uses /show-recaps/:id/message as the product entry.
 * These routes power Fan List messaging, preview, and status polling.
 */

const { createCoreController } = require('@strapi/strapi').factories;
const { requireBandPermission } = require('../../../utils/bandRoles');
const campaignService = require('../../../utils/messaging/campaignService');

module.exports = createCoreController('api::message-campaign.message-campaign', ({ strapi }) => ({
  /**
   * POST /api/message-campaigns/preview
   * Body: { bandId, audienceType, audienceReference? }
   * Aggregate counts only — never returns fan emails.
   */
  async preview(ctx) {
    try {
      const user = ctx.state.user;
      if (!user) return ctx.unauthorized('Authentication required');

      const body = ctx.request.body || {};
      const bandId = parseInt(body.bandId, 10);
      if (!bandId) return ctx.badRequest('bandId is required');

      const access = await requireBandPermission(strapi, user.id, bandId, 'sendFanMessages');
      if (!access) return ctx.forbidden('Only the band owner can send fan messages');

      const result = await campaignService.previewCampaignAudience({
        bandId,
        audienceType: body.audienceType,
        audienceReference: body.audienceReference || null,
        audienceConfig: body.audienceConfig || null,
        channel: body.channel || 'email',
        createdByUserId: user.id,
        artistUpdateId: body.artistUpdateId || null,
      });

      if (result.error) {
        return ctx.badRequest(result.message || 'Could not preview audience', { reason: result.error });
      }

      return ctx.send({ data: result });
    } catch (err) {
      strapi.log.error('[MessageCampaign] preview failed:', err);
      return ctx.internalServerError('Failed to preview audience');
    }
  },

  /**
   * POST /api/message-campaigns
   * Body: { bandId, audienceType, audienceReference?, subject, note|bodyText, name? }
   */
  async create(ctx) {
    try {
      const user = ctx.state.user;
      if (!user) return ctx.unauthorized('Authentication required');

      const body = ctx.request.body || {};
      const bandId = parseInt(body.bandId, 10);
      if (!bandId) return ctx.badRequest('bandId is required');

      const access = await requireBandPermission(strapi, user.id, bandId, 'sendFanMessages');
      if (!access) return ctx.forbidden('Only the band owner can send fan messages');

      const result = await campaignService.createAndQueueCampaign({
        bandId,
        createdByUserId: user.id,
        audienceType: body.audienceType,
        audienceReference: body.audienceReference || null,
        audienceConfig: body.audienceConfig || null,
        subject: body.subject,
        bodyText: body.note || body.bodyText,
        name: body.name || null,
        replyTo: user.email || null,
        channel: body.channel || 'email',
        artistUpdateId: body.artistUpdateId || null,
      });

      if (result.error) {
        return ctx.badRequest(result.message || 'Could not create campaign', { reason: result.error });
      }

      return ctx.send({ data: result });
    } catch (err) {
      strapi.log.error('[MessageCampaign] create failed:', err);
      return ctx.internalServerError('Failed to create campaign');
    }
  },

  /**
   * GET /api/message-campaigns/history?bandId=&page=&pageSize=
   * Owner-only campaign history. Aggregates only — no recipient PII.
   */
  async history(ctx) {
    try {
      const user = ctx.state.user;
      if (!user) return ctx.unauthorized('Authentication required');

      const bandId = parseInt(ctx.query.bandId, 10);
      if (!bandId) return ctx.badRequest('bandId is required');

      const access = await requireBandPermission(strapi, user.id, bandId, 'sendFanMessages');
      if (!access) return ctx.forbidden('Only the band owner can view message history');

      const result = await campaignService.listCampaignHistory({
        bandId,
        page: ctx.query.page,
        pageSize: ctx.query.pageSize,
      });

      return ctx.send(result);
    } catch (err) {
      strapi.log.error('[MessageCampaign] history failed:', err);
      return ctx.internalServerError('Failed to load campaign history');
    }
  },

  /**
   * GET /api/message-campaigns/:id
   * Campaign detail including original bodyText. No recipient emails.
   */
  async detail(ctx) {
    try {
      const user = ctx.state.user;
      if (!user) return ctx.unauthorized('Authentication required');

      const campaignId = parseInt(ctx.params.id, 10);
      if (!campaignId) return ctx.badRequest('Invalid campaign id');

      const campaign = await strapi.entityService.findOne(
        'api::message-campaign.message-campaign',
        campaignId,
        { populate: { band: { fields: ['id'] } }, fields: ['id'] }
      );
      if (!campaign) return ctx.notFound('Campaign not found');

      const bandId = campaign.band?.id || campaign.band;
      const access = await requireBandPermission(strapi, user.id, bandId, 'sendFanMessages');
      if (!access) return ctx.forbidden('Not allowed');

      const result = await campaignService.getCampaignDetail({ bandId, campaignId });
      if (result.error === 'not_found') return ctx.notFound(result.message);
      if (result.error === 'forbidden') return ctx.forbidden(result.message);

      return ctx.send({ data: result.data });
    } catch (err) {
      strapi.log.error('[MessageCampaign] detail failed:', err);
      return ctx.internalServerError('Failed to load campaign');
    }
  },

  /**
   * GET /api/message-campaigns/:id/status
   * Safe progress payload — never returns recipient emails.
   */
  async status(ctx) {
    try {
      const user = ctx.state.user;
      if (!user) return ctx.unauthorized('Authentication required');

      const campaignId = parseInt(ctx.params.id, 10);
      if (!campaignId) return ctx.badRequest('Invalid campaign id');

      const campaign = await strapi.entityService.findOne(
        'api::message-campaign.message-campaign',
        campaignId,
        {
          fields: [
            'id',
            'status',
            'audienceType',
            'channel',
            'subject',
            'recipientCount',
            'sentCount',
            'deliveredCount',
            'failedCount',
            'suppressedCount',
            'bouncedCount',
            'skippedCount',
            'queuedAt',
            'startedAt',
            'completedAt',
          ],
          populate: { band: { fields: ['id'] } },
        }
      );

      if (!campaign) return ctx.notFound('Campaign not found');

      const bandId = campaign.band?.id || campaign.band;
      const access = await requireBandPermission(strapi, user.id, bandId, 'sendFanMessages');
      if (!access) return ctx.forbidden('Not allowed');

      return ctx.send({
        data: {
          id: campaign.id,
          status: campaign.status,
          audienceType: campaign.audienceType,
          channel: campaign.channel || 'email',
          subject: campaign.subject || null,
          recipientCount: campaign.recipientCount || 0,
          sentCount: campaign.sentCount || 0,
          deliveredCount: campaign.deliveredCount || 0,
          failedCount: campaign.failedCount || 0,
          suppressedCount: campaign.suppressedCount || 0,
          bouncedCount: campaign.bouncedCount || 0,
          skippedCount: campaign.skippedCount || 0,
          queuedAt: campaign.queuedAt || null,
          startedAt: campaign.startedAt || null,
          completedAt: campaign.completedAt || null,
        },
      });
    } catch (err) {
      strapi.log.error('[MessageCampaign] status failed:', err);
      return ctx.internalServerError('Failed to load campaign status');
    }
  },
}));
