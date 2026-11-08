'use strict';

/**
 * fan-interaction controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

async function resolveOptionalUserId(strapi, ctx) {
  if (ctx.state.user?.id) return ctx.state.user.id;
  const header = ctx.request.headers.authorization || ctx.request.headers.Authorization || '';
  const token = typeof header === 'string' && header.startsWith('Bearer ')
    ? header.slice(7).trim()
    : '';
  if (!token) return null;

  try {
    const payload = await strapi.plugins['users-permissions'].services.jwt.verify(token);
    return payload?.id || null;
  } catch {
    return null;
  }
}

module.exports = createCoreController('api::fan-interaction.fan-interaction', ({ strapi }) => ({

  // POST /api/fan-interactions/track - Public endpoint for tracking interactions
  async track(ctx) {
    try {
      const {
        bandId,
        eventId,
        interactionType,
        interactionContext,
        surface,
        campaignId,
        fanEmail,
        metadata,
      } = ctx.request.body;

      // Get location from headers if available (set by Cloudflare or similar)
      const city = ctx.request.body.city || ctx.request.headers['cf-ipcity'] || null;
      const region = ctx.request.body.region || ctx.request.headers['cf-region'] || null;
      const country = ctx.request.body.country || ctx.request.headers['cf-ipcountry'] || null;
      const timezone = ctx.request.body.timezone || ctx.request.headers['cf-timezone'] || null;

      const result = await strapi.service('api::fan-interaction.fan-interaction').trackInteraction({
        bandId,
        eventId,
        interactionType,
        interactionContext,
        surface,
        campaignId,
        fanEmail,
        city,
        region,
        country,
        timezone,
        metadata,
      });

      if (!result.success) {
        return ctx.badRequest(result.error);
      }

      return ctx.send({ success: true, interactionId: result.interactionId });
    } catch (error) {
      strapi.log.error('Error tracking interaction:', error);
      return ctx.internalServerError('Failed to track interaction');
    }
  },

  // GET /api/fan-interactions/recent/:bandId - Get recent interactions (authenticated)
  async recent(ctx) {
    try {
      const { bandId } = ctx.params;
      const { limit = 20 } = ctx.query;

      // Verify user owns this band
      const user = ctx.state.user;
      if (!user) {
        return ctx.unauthorized('Authentication required');
      }

      // The owner relation on band is users_permissions_user, not user.
      const band = await strapi.entityService.findOne('api::band.band', bandId, {
        populate: { users_permissions_user: true },
      });

      if (!band || band.users_permissions_user?.id !== user.id) {
        return ctx.forbidden('You do not have access to this band');
      }

      const interactions = await strapi.service('api::fan-interaction.fan-interaction').getRecentInteractions({
        bandId: parseInt(bandId),
        limit: Math.min(parseInt(limit), 100),
      });

      return ctx.send({ data: interactions });
    } catch (error) {
      strapi.log.error('Error fetching recent interactions:', error);
      return ctx.internalServerError('Failed to fetch interactions');
    }
  },

  // GET /api/fan-interactions/breakdown/:bandId - Get interaction type breakdown (authenticated)
  async breakdown(ctx) {
    try {
      const { bandId } = ctx.params;
      const { campaignId, eventId } = ctx.query;

      // Verify user owns this band
      const user = ctx.state.user;
      if (!user) {
        return ctx.unauthorized('Authentication required');
      }

      // The owner relation on band is users_permissions_user, not user.
      const band = await strapi.entityService.findOne('api::band.band', bandId, {
        populate: { users_permissions_user: true },
      });

      if (!band || band.users_permissions_user?.id !== user.id) {
        return ctx.forbidden('You do not have access to this band');
      }

      const breakdown = await strapi.service('api::fan-interaction.fan-interaction').getInteractionTypeBreakdown({
        bandId: parseInt(bandId),
        campaignId: campaignId || null,
        eventId: eventId ? parseInt(eventId) : null,
      });

      return ctx.send({ data: breakdown });
    } catch (error) {
      strapi.log.error('Error fetching interaction breakdown:', error);
      return ctx.internalServerError('Failed to fetch breakdown');
    }
  },

  // POST /api/fan-interactions/check-in - Public endpoint for show check-ins
  async checkIn(ctx) {
    try {
      const {
        bandId,
        fanEmail,
        eventId,
        campaignId,
        surface,
        metadata,
        visitorToken,
      } = ctx.request.body;

      if (!bandId || !fanEmail) {
        return ctx.badRequest('bandId and fanEmail are required');
      }

      // Get location from headers if available
      const city = ctx.request.body.city || ctx.request.headers['cf-ipcity'] || null;
      const region = ctx.request.body.region || ctx.request.headers['cf-region'] || null;
      const country = ctx.request.body.country || ctx.request.headers['cf-ipcountry'] || null;
      const timezone = ctx.request.body.timezone || ctx.request.headers['cf-timezone'] || null;

      const result = await strapi.service('api::fan-interaction.fan-interaction').processShowCheckIn({
        bandId,
        fanEmail,
        eventId,
        campaignId,
        surface: surface || 'band_page',
        city,
        region,
        country,
        timezone,
        metadata: metadata || {},
        visitorToken: visitorToken || null,
      });

      if (!result.success) {
        return ctx.badRequest(result.error);
      }

      return ctx.send(result);
    } catch (error) {
      strapi.log.error('Error processing check-in:', error);
      return ctx.internalServerError('Failed to process check-in');
    }
  },

  // GET /api/fan-interactions/check-in-status - self-scoped canonical attendance status
  async checkInStatus(ctx) {
    try {
      const result = await strapi.service('api::fan-interaction.fan-interaction').getShowCheckInStatus({
        bandId: ctx.query?.bandId,
        campaignId: ctx.query?.campaignId || null,
        eventId: ctx.query?.eventId || null,
        visitorToken: ctx.query?.visitorToken || null,
        userId: await resolveOptionalUserId(strapi, ctx),
      });
      return ctx.send({ data: result });
    } catch (error) {
      strapi.log.error('Error resolving check-in status:', error);
      return ctx.internalServerError('Failed to resolve check-in status');
    }
  },

  // GET /api/fan-interactions/session/:bandId - Get session stats (authenticated)
  async session(ctx) {
    try {
      const { bandId } = ctx.params;
      const { campaignId } = ctx.query;

      // Verify user owns this band
      const user = ctx.state.user;
      if (!user) {
        return ctx.unauthorized('Authentication required');
      }

      // The owner relation on band is users_permissions_user, not user.
      const band = await strapi.entityService.findOne('api::band.band', bandId, {
        populate: { users_permissions_user: true },
      });

      if (!band || band.users_permissions_user?.id !== user.id) {
        return ctx.forbidden('You do not have access to this band');
      }

      // Use provided campaignId or get from current show mode
      const activeCampaignId = campaignId || band.showModeCampaignId;

      if (!activeCampaignId) {
        return ctx.send({ data: null, message: 'No active session' });
      }

      const stats = await strapi.service('api::fan-interaction.fan-interaction').getSessionStats({
        bandId: parseInt(bandId),
        campaignId: activeCampaignId,
      });

      return ctx.send({ data: stats });
    } catch (error) {
      strapi.log.error('Error fetching session stats:', error);
      return ctx.internalServerError('Failed to fetch session stats');
    }
  },
}));
