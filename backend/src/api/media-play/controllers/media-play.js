'use strict';

const { createCoreController } = require('@strapi/strapi').factories;
const { scopedAnalyticsReads, directBand } = require('../../../utils/scopedAnalyticsReads');

module.exports = createCoreController(
  'api::media-play.media-play',
  ({ strapi }) => ({
    // GET /api/media-plays and /api/media-plays/:id: signed-in, own bands only.
    // (These used to return every row with populate: '*' and no sanitizing.)
    ...scopedAnalyticsReads(strapi, 'api::media-play.media-play', directBand),

    // CUSTOM POST /api/media-plays/track
    async track(ctx) {
      const { bandId, mediaType, title } = ctx.request.body;

      if (!bandId || !mediaType || !title) {
        return ctx.badRequest('bandId, mediaType and title are required');
      }

      // make sure the band exists
      const band = await strapi.entityService.findOne('api::band.band', bandId);
      if (!band) {
        return ctx.notFound('Band not found');
      }

      // create the play record
      const created = await strapi.entityService.create(
        'api::media-play.media-play',
        {
          data: {
            band: bandId,
            mediaType,
            title,
            timestamp: new Date(),
          },
        }
      );

      return ctx.created({ data: created });
    },
  })
);
