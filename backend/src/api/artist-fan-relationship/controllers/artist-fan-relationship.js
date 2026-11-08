'use strict';

const { requireBandPermission } = require('../../../utils/bandRoles');
const { getArtistFanProgression } = require('../../../utils/moments/artistFanProgression');

function parsePositiveInt(value) {
  const parsed = Number.parseInt(String(value || ''), 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function relationshipNotFound(ctx) {
  if (typeof ctx.notFound === 'function') return ctx.notFound();
  ctx.status = 404;
  ctx.body = {
    data: null,
    error: {
      status: 404,
      name: 'NotFoundError',
      message: 'Not Found',
      details: {},
    },
  };
  return ctx.body;
}

module.exports = {
  async findOne(ctx) {
    const userId = ctx.state?.user?.id;
    const bandId = parsePositiveInt(ctx.query?.bandId);
    const fanId = parsePositiveInt(ctx.params?.fanId);
    if (!userId || !bandId || !fanId) return relationshipNotFound(ctx);

    // Production fan intelligence remains owner-only. Return the same 404 for
    // every denial so callers cannot probe whether a fan belongs to another band.
    const access = await requireBandPermission(
      strapi,
      userId,
      bandId,
      'viewFanIntelligence'
    );
    if (!access) return relationshipNotFound(ctx);

    const result = await getArtistFanProgression(strapi, {
      userId,
      bandId,
      fanId,
    });
    if (result.error) return relationshipNotFound(ctx);

    return ctx.send({ data: result.data });
  },
};

module.exports.parsePositiveInt = parsePositiveInt;
module.exports.relationshipNotFound = relationshipNotFound;
