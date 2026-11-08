'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController(
  'api::link-click.link-click',
  ({ strapi }) => ({
    /**
     * POST /link-clicks/track
     * Track a click for a specific band and platform.
     */
    async trackClick(ctx) {
      try {
        const { bandId, platform, linkUrl, linkLabel } = ctx.request.body;
        if (!bandId || !platform) {
          return ctx.badRequest('Missing bandId or platform');
        }

        // Verify that the band exists
        const band = await strapi.entityService.findOne(
          'api::band.band',
          bandId
        );
        if (!band) {
          return ctx.notFound('Band not found.');
        }

        const clickData = {
          band: bandId,
          platform,
          clickCount: 1,
          timestamp: new Date(),
          publishedAt: new Date(),
        };

        if (linkUrl && typeof linkUrl === 'string') {
          clickData.linkUrl = linkUrl.trim().slice(0, 2048);
        }
        if (linkLabel && typeof linkLabel === 'string') {
          clickData.linkLabel = linkLabel.trim().slice(0, 255);
        }

        // Create a new click event
        await strapi.entityService.create('api::link-click.link-click', {
          data: clickData,
        });

        return ctx.send({ message: 'Click tracked successfully.' });
      } catch (error) {
        strapi.log.error('Error tracking click:', error);
        return ctx.throw(500, 'Internal server error');
      }
    },

    /**
     * GET /link-clicks/band/:bandId
     * Get all link clicks for a specific band.
     */
    async getBandClicks(ctx) {
      try {
        const { bandId } = ctx.params;
        // verify band exists
        const band = await strapi.entityService.findOne(
          'api::band.band',
          bandId
        );
        if (!band) {
          return ctx.notFound('Band not found.');
        }

        // fetch clicks
        const clicks = await strapi.entityService.findMany(
          'api::link-click.link-click',
          {
            filters: { band: bandId },
            sort: [{ timestamp: 'desc' }],
          }
        );

        // wrap in { data: [...] } so front-end can still do json.data
        return ctx.send({ data: clicks });
      } catch (error) {
        strapi.log.error('Error fetching band analytics:', error);
        return ctx.throw(500, 'Internal server error');
      }
    },
  })
);
