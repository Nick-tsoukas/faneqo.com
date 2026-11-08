'use strict';

/**
 * Labs HTTP surface. JWT checked here so missing/unenrolled callers get 404,
 * not a users-permissions 403 that advertises the namespace.
 *
 * Phase 04 inspector: internal_labs + accessible band. Does not require a
 * product feature key yet (moments/passport still unused).
 */

const { createFeatureService } = require('../../../utils/features/featureService');
const { FEATURE_KEYS } = require('../../../utils/features/featureKeys');
const { getRelationshipTimeline } = require('../../../utils/relationshipEvents/relationshipEventService');
const { getArtistFanProgression } = require('../../../utils/moments/artistFanProgression');
const {
  labsNotFound,
  requireLabsUser,
  requireLabsBand,
  parsePositiveInt,
  maskEmail,
} = require('../utils/labsAuth');

async function labsPayload(ctx) {
  const gated = await requireLabsUser(ctx);
  if (gated.error) return gated.error;
  const { user } = gated;
  const { bandId } = await requireLabsBand(ctx, user);
  const features = createFeatureService(strapi);
  const map = await features.getMyFeatures({ user, band: bandId ? { id: bandId } : null });
  return ctx.send({
    data: {
      ok: true,
      keys: FEATURE_KEYS,
      userId: user.id,
      bandId,
      features: map.features,
      userFeatures: map.user,
      bandFeatures: map.band,
    },
  });
}

module.exports = {
  async status(ctx) {
    return labsPayload(ctx);
  },
  async features(ctx) {
    return labsPayload(ctx);
  },

  async relationshipFans(ctx) {
    const gated = await requireLabsUser(ctx);
    if (gated.error) return gated.error;
    const { user } = gated;
    const { bandId } = await requireLabsBand(ctx, user);
    if (!bandId) return labsNotFound(ctx);

    const q = String(ctx.query?.q || '').trim();
    const filters = { band: bandId };
    if (q) {
      filters.$or = [
        { email: { $containsi: q } },
        { firstName: { $containsi: q } },
        { lastName: { $containsi: q } },
      ];
    }

    const rows = await strapi.entityService.findMany('api::fan.fan', {
      filters,
      fields: ['id', 'email', 'status', 'subscribedAt', 'firstName'],
      sort: ['subscribedAt:desc'],
      limit: 20,
    });

    return ctx.send({
      data: {
        bandId,
        fans: (rows || []).map((row) => ({
          id: row.id,
          emailMasked: maskEmail(row.email),
          status: row.status,
          subscribedAt: row.subscribedAt,
          firstName: row.firstName || null,
        })),
      },
    });
  },

  async relationshipTimeline(ctx) {
    const gated = await requireLabsUser(ctx);
    if (gated.error) return gated.error;
    const { user } = gated;
    const { bandId } = await requireLabsBand(ctx, user);
    const fanId = parsePositiveInt(ctx.query?.fanId);
    if (!bandId || !fanId) return labsNotFound(ctx);

    const result = await getRelationshipTimeline(strapi, {
      bandId,
      fanId,
      viewer: 'artist',
      includeFanOnly: true,
      cursor: ctx.query?.cursor || null,
      limit: ctx.query?.limit,
    });

    if (!result.fan) return labsNotFound(ctx);

    return ctx.send({
      data: {
        bandId,
        fan: {
          id: result.fan.id,
          emailMasked: maskEmail(result.fan.email),
          status: result.fan.status,
          subscribedAt: result.fan.subscribedAt,
        },
        events: result.items,
        nextCursor: result.nextCursor,
        empty: result.items.length === 0,
      },
    });
  },

  async artistFanProgression(ctx) {
    const gated = await requireLabsUser(ctx);
    if (gated.error) return gated.error;
    const { user } = gated;
    const { bandId } = await requireLabsBand(ctx, user);
    const fanId = parsePositiveInt(ctx.query?.fanId);
    if (!bandId || !fanId) return labsNotFound(ctx);

    const result = await getArtistFanProgression(strapi, {
      userId: user.id,
      bandId,
      fanId,
      maskEmail,
    });
    if (result.error) return labsNotFound(ctx);

    return ctx.send({ data: result.data });
  },

  async integrity(ctx) {
    const gated = await requireLabsUser(ctx);
    if (gated.error) return gated.error;

    const knex = strapi.db?.connection;
    if (!knex) return labsNotFound(ctx);

    const { runIntegrityAudit } = require('../../../utils/integrity/fanAttendanceIntegrity');
    const audit = await runIntegrityAudit(knex);
    const { fans, attendance, constraints, indexes, physical, coverage, identityIndexes, environment } = audit;

    return ctx.send({
      data: {
        inspector: 'read_only',
        productionStatus: 'UNKNOWN',
        environment: environment || null,
        labels: audit.labels || null,
        constraints,
        indexes,
        physical,
        uniqueIndexApplicability: physical.uniqueIndexApplicability,
        identityIndexes: identityIndexes || null,
        coverage: coverage
          ? {
              fansEligible: coverage.fansEligible,
              fansMissingKey: coverage.fansMissingKey,
              fanKeyCoveragePct: coverage.fanKeyCoveragePct,
              campaignEligible: coverage.campaignEligible,
              campaignMissingKey: coverage.campaignMissingKey,
              campaignKeyCoveragePct: coverage.campaignKeyCoveragePct,
              eventEligible: coverage.eventEligible,
              eventMissingKey: coverage.eventMissingKey,
              eventKeyCoveragePct: coverage.eventKeyCoveragePct,
            }
          : null,
        fans: {
          groups: fans.groups || 0,
          excessRows: fans.excessRows || 0,
          largestGroup: fans.largestGroup || 0,
          classes: fans.classes || null,
          skipped: Boolean(fans.skipped),
          keyCoveragePct: coverage?.fanKeyCoveragePct ?? null,
          keysEligible: coverage?.fansEligible ?? null,
          keysMissing: coverage?.fansMissingKey ?? null,
          identityKeyIndex: identityIndexes?.fan || 'UNKNOWN',
          statusLine: audit.labels?.fanIdentity || null,
        },
        attendance: {
          campaignGroups: attendance.campaignGroups || 0,
          eventGroups: attendance.eventGroups || 0,
          campaignExcess: attendance.campaignExcess || 0,
          eventExcess: attendance.eventExcess || 0,
          bothCampaignAndEvent: attendance.bothCampaignAndEvent || 0,
          neverSuppressedTrue: attendance.neverSuppressedTrue,
          skipped: Boolean(attendance.skipped),
          campaignKeyCoveragePct: coverage?.campaignKeyCoveragePct ?? null,
          campaignKeysMissing: coverage?.campaignMissingKey ?? null,
          campaignIdentityKeyIndex: identityIndexes?.campaign || 'UNKNOWN',
          eventKeyCoveragePct: coverage?.eventKeyCoveragePct ?? null,
          eventKeysMissing: coverage?.eventMissingKey ?? null,
          eventIdentityKeyIndex: identityIndexes?.event || 'UNKNOWN',
          campaignStatusLine: audit.labels?.campaignAttendance || null,
          eventStatusLine: audit.labels?.eventAttendance || null,
        },
      },
    });
  },
};
