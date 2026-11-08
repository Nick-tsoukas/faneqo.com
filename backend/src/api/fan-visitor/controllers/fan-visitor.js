'use strict';

const { createCoreController } = require('@strapi/strapi').factories;
const fanIdentity = require('../../../utils/fanIdentity');

module.exports = createCoreController('api::fan-visitor.fan-visitor', ({ strapi }) => ({
  /**
   * POST /api/fan-identity/session
   * Body: { visitorToken?: string }
   */
  async session(ctx) {
    try {
      const body = ctx.request.body || {};
      const incoming = body.visitorToken || body.token || null;

      const established = await fanIdentity.establishVisitorSession({
        token: incoming,
        incrementVisit: true,
      });

      return ctx.send({
        data: fanIdentity.toSafeSessionPayload(established),
      });
    } catch (err) {
      strapi.log.error('[FanIdentity] session failed:', err);
      return ctx.internalServerError('Failed to establish visitor session');
    }
  },
}));
