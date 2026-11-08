'use strict';

const { createCoreController } = require('@strapi/strapi').factories;
const { requireBandPermission } = require('../../../utils/bandRoles');
const { resolveScopedBand } = require('../../../utils/fans/resolveScopedBand');
const fanIdentity = require('../../../utils/fanIdentity');
const fanAccount = require('../../../utils/fanAccount');
const { establishFollowOnFan, followArtistByEmail } = require('../../../utils/fans/fanFollowWrite');

function rethrowClientHttp(error) {
  const status = Number(error?.status || error?.statusCode);
  if (status >= 400 && status < 500) throw error;
}

/** Optional JWT on public subscribe — reuse canonical email claim, never trust client Fan ids. */
async function claimSignedInFanIfPresent(ctx) {
  try {
    let user = ctx.state.user || null;
    if (!user?.id) {
      const raw = ctx.request.headers.authorization || ctx.request.headers.Authorization || '';
      const token = typeof raw === 'string' && raw.startsWith('Bearer ') ? raw.slice(7).trim() : '';
      if (!token) return;
      const payload = await strapi.plugins['users-permissions'].services.jwt.verify(token);
      if (!payload?.id) return;
      user = await strapi.entityService.findOne('plugin::users-permissions.user', payload.id, {
        fields: ['id', 'email'],
      });
    }
    if (!user?.id || !user.email) return;
    await fanAccount.claimFanRelationshipsForUser(user);
  } catch (err) {
    strapi.log.warn('[Fan] signed-in claim after subscribe skipped', { message: err?.message });
  }
}

module.exports = createCoreController('api::fan.fan', ({ strapi }) => ({
  /**
   * POST /api/fans/:fanId/remove-from-list
   * Soft-remove from this band's active Fan List (status=removed).
   * Owner-only via manageFanList. Does not hard-delete or globally suppress.
   */
  async removeFromList(ctx) {
    try {
      const user = ctx.state.user;
      if (!user) return ctx.unauthorized('Authentication required');

      const fanId = parseInt(ctx.params.fanId, 10);
      if (!fanId) return ctx.badRequest('fanId is required');

      const fan = await strapi.entityService.findOne('api::fan.fan', fanId, {
        populate: { band: { fields: ['id'] } },
      });
      if (!fan) return ctx.notFound('Fan not found');

      const bandId = fan.band?.id || fan.band;
      if (!bandId) return ctx.badRequest('Fan is missing a band relationship');

      const access = await requireBandPermission(strapi, user.id, bandId, 'manageFanList');
      if (!access) {
        return ctx.forbidden('You do not have permission to manage this Fan List');
      }

      const result = await strapi.service('api::fan.fan').removeFromFanList({
        bandId,
        fanId,
      });

      if (result.error === 'not_found') return ctx.notFound(result.message);
      if (result.error === 'forbidden') return ctx.forbidden(result.message);

      return {
        data: {
          ok: true,
          fanId: result.fanId,
          alreadyRemoved: !!result.alreadyRemoved,
          status: 'removed',
        },
      };
    } catch (error) {
      console.error('Error removing fan from list:', error);
      return ctx.internalServerError('Failed to remove fan from Fan List');
    }
  },

  // GET /api/fans/my-fans?bandId=... (V3 enhanced with filters)
  async myFans(ctx) {
    try {
      const scope = await resolveScopedBand(strapi, ctx, ctx.query.bandId, 'viewFanIntelligence');
      if (scope.error === 'unauthorized') return ctx.unauthorized('Authentication required');
      if (scope.error === 'band_id_required') return ctx.badRequest('bandId is required');
      if (scope.error === 'forbidden') {
        return ctx.forbidden("You do not have access to this band's Fan List");
      }
      const bandId = scope.bandId;

      const { 
        page, pageSize, sortField, sortOrder, search, 
        source, status,
        // V3 filters
        captureContext, captureSurface, city, region, country,
        capturedDuringShowMode, capturedAtEventId, captureCampaignId,
        engagementTier, dateJoinedFrom, dateJoinedTo,
      } = ctx.query;

      try {
        const user = ctx.state.user;
        if (user) await fanAccount.claimFanRelationshipsForUser(user);
        await fanAccount.claimUnlinkedFansByExistingUsers({ bandId });
      } catch (err) {
        strapi.log.warn('[FanAccount] claim before fan list skipped', { message: err?.message });
      }

      const result = await strapi.service('api::fan.fan').getMyFans({
        bandId,
        viewerUserId: ctx.state.user?.id ?? null,
        page: parseInt(page) || 1,
        pageSize: parseInt(pageSize) || 25,
        sortField: sortField || 'subscribedAt',
        sortOrder: sortOrder || 'desc',
        search: search || null,
        source: source || null,
        status: status || null,
        // V3 filters
        captureContext: captureContext || null,
        captureSurface: captureSurface || null,
        city: city || null,
        region: region || null,
        country: country || null,
        capturedDuringShowMode: capturedDuringShowMode === 'true' ? true : (capturedDuringShowMode === 'false' ? false : undefined),
        capturedAtEventId: capturedAtEventId ? parseInt(capturedAtEventId) : null,
        captureCampaignId: captureCampaignId || null,
        engagementTier: engagementTier || null,
        dateJoinedFrom: dateJoinedFrom || null,
        dateJoinedTo: dateJoinedTo || null,
      });

      return result;
    } catch (error) {
      rethrowClientHttp(error);
      console.error('Error fetching fans:', error);
      return ctx.internalServerError('Failed to fetch fans');
    }
  },

  // GET /api/fans/my-fans-analytics?bandId=...
  // Same band, same permission as the list — the two must never disagree.
  async myFansAnalytics(ctx) {
    try {
      const scope = await resolveScopedBand(strapi, ctx, ctx.query.bandId, 'viewFanIntelligence');
      if (scope.error === 'unauthorized') return ctx.unauthorized('Authentication required');
      if (scope.error === 'band_id_required') return ctx.badRequest('bandId is required');
      if (scope.error === 'forbidden') {
        return ctx.forbidden("You do not have access to this band's fan analytics");
      }

      const analytics = await strapi.service('api::fan.fan').getMyFansAnalytics({
        bandId: scope.bandId,
      });

      return { data: analytics };
    } catch (error) {
      rethrowClientHttp(error);
      console.error('Error fetching fan analytics:', error);
      return ctx.internalServerError('Failed to fetch fan analytics');
    }
  },

  /**
   * GET /api/fans/:fanId/detail - detailed fan profile (V3)
   *
   * Self-verifying: the fan row already carries its band, so authorization is
   * proved against *that* band rather than a band guessed from the caller.
   * A caller that also names a band must name the same one.
   */
  async fanDetail(ctx) {
    try {
      const user = ctx.state.user;
      if (!user) return ctx.unauthorized('Authentication required');

      const fanId = Number.parseInt(ctx.params.fanId, 10);
      if (!Number.isInteger(fanId) || fanId <= 0) {
        return ctx.badRequest('fanId is required');
      }

      const fan = await strapi.entityService.findOne('api::fan.fan', fanId, {
        populate: { band: { fields: ['id'] } },
      });
      if (!fan) return ctx.notFound('Fan not found');

      const fanBandId = Number(fan.band?.id || fan.band);
      if (!fanBandId) return ctx.badRequest('Fan is missing a band relationship');

      // Mismatched scope is treated as absence — never confirm another band's fan.
      if (ctx.query.bandId != null && Number.parseInt(ctx.query.bandId, 10) !== fanBandId) {
        return ctx.notFound('Fan not found');
      }

      const access = await requireBandPermission(strapi, user.id, fanBandId, 'viewFanIntelligence');
      if (!access) {
        return ctx.forbidden('You do not have access to this fan');
      }

      const fanDetail = await strapi.service('api::fan.fan').getFanDetail({
        bandId: fanBandId,
        fanId,
        viewerUserId: ctx.state.user?.id ?? null,
      });

      if (!fanDetail) {
        return ctx.notFound('Fan not found');
      }

      return { data: fanDetail };
    } catch (error) {
      console.error('Error fetching fan detail:', error);
      return ctx.internalServerError('Failed to fetch fan detail');
    }
  },

  // POST /api/fans/import  { bandId, fans }
  async import(ctx) {
    try {
      const body = ctx.request.body || {};
      const scope = await resolveScopedBand(strapi, ctx, body.bandId, 'manageFanList');
      if (scope.error === 'unauthorized') return ctx.unauthorized('Authentication required');
      if (scope.error === 'band_id_required') return ctx.badRequest('bandId is required');
      if (scope.error === 'forbidden') {
        return ctx.forbidden("You do not have permission to manage this band's Fan List");
      }

      const { fans } = body;

      if (!fans || !Array.isArray(fans)) {
        return ctx.badRequest('fans array is required');
      }

      const result = await strapi.service('api::fan.fan').importFans({
        fans,
        bandId: scope.bandId,
      });

      return { data: result };
    } catch (error) {
      console.error('Error importing fans:', error);
      return ctx.internalServerError('Failed to import fans');
    }
  },

  // GET /api/fans/export?bandId=...
  async export(ctx) {
    try {
      const scope = await resolveScopedBand(strapi, ctx, ctx.query.bandId, 'viewFanPII');
      if (scope.error === 'unauthorized') return ctx.unauthorized('Authentication required');
      if (scope.error === 'band_id_required') return ctx.badRequest('bandId is required');
      if (scope.error === 'forbidden') {
        return ctx.forbidden("You do not have access to this band's fan data");
      }

      const fans = await strapi.service('api::fan.fan').exportFans({
        bandId: scope.bandId,
      });

      return { data: fans };
    } catch (error) {
      console.error('Error exporting fans:', error);
      return ctx.internalServerError('Failed to export fans');
    }
  },

  // POST /api/fans/subscribe (public route for future use)
  /**
   * POST /api/fans/unsubscribe
   *
   * Public and unauthenticated: fans have no accounts, so the mailed token is
   * the only credential. Deliberately POST-only — mail scanners prefetch GET
   * links, which would unsubscribe people who never clicked anything.
   *
   * Token may arrive as:
   *   - JSON body `{ token }` (browser unsubscribe page)
   *   - query `?token=` (Gmail one-click POST via List-Unsubscribe URL)
   *
   * Already-unsubscribed is idempotent success. Invalid tokens return 200 with
   * success:false so one-click clients (and our Nuxt proxy) do not retry forever.
   */
  async unsubscribe(ctx) {
    try {
      const body = ctx.request.body || {};
      const token = body.token || ctx.query?.token;

      if (!token) {
        return ctx.send({ success: false, error: 'token_required' });
      }

      const result = await strapi.service('api::fan.fan').unsubscribeByToken(token);

      if (!result) {
        return ctx.send({ success: false, error: 'invalid_token' });
      }

      return ctx.send({ success: true, ...result });
    } catch (error) {
      strapi.log.error('Error processing unsubscribe:', error);
      return ctx.internalServerError('Failed to process unsubscribe');
    }
  },

  /** POST /api/fans/resubscribe  { token } — undo, from the same page. */
  async resubscribe(ctx) {
    try {
      const { token } = ctx.request.body || {};

      if (!token) {
        return ctx.badRequest('token is required');
      }

      const result = await strapi.service('api::fan.fan').resubscribeByToken(token);

      if (!result) {
        return ctx.notFound('This link is no longer valid.');
      }

      return ctx.send({ success: true, ...result });
    } catch (error) {
      strapi.log.error('Error processing resubscribe:', error);
      return ctx.internalServerError('Failed to process resubscribe');
    }
  },

  async subscribe(ctx) {
    try {
      const { 
        email, 
        firstName,
        bandId, 
        source,
        captureSurface,
        sourceDetail,
        pageContext,
        eventId: requestEventId,
        visitorToken,
        marketingConsent,
      } = ctx.request.body;

      if (!email || !bandId) {
        return ctx.badRequest('email and bandId are required');
      }

      // Verify band exists and has fan capture enabled - fetch all show mode fields
      const band = await strapi.entityService.findOne('api::band.band', bandId, {
        fields: [
          'id', 
          'fanCaptureEnabled', 
          'showModeEnabled', 
          'showModeStatus',
          'showModeEventId',
          'showModeType',
          'showModeCampaignId',
          'showModeVenue',
          'showModeCity',
          'showModeRegion',
          'showModeCountry',
          'showModeTimezone',
          'showModeSourceDetail',
          'showModeTitle',
        ],
      });

      if (!band) {
        return ctx.notFound('Band not found');
      }

      if (band.fanCaptureEnabled === false) {
        return ctx.forbidden('Fan capture is disabled for this band');
      }

      const now = new Date();
      const isShowModeActive = band.showModeEnabled && band.showModeStatus === 'live';

      // Build rich capture context
      let finalSource = source || 'band_page';
      let captureContext = 'normal';
      let capturedDuringShowMode = false;
      let capturedAtEventId = requestEventId || null;
      let captureCampaignId = null;
      let finalCaptureSurface = captureSurface || 'unknown';
      let finalSourceDetail = sourceDetail || null;

      // Rich metadata for storage
      let metadata = {};

      if (isShowModeActive) {
        finalSource = 'show_mode';
        captureContext = 'show_mode';
        capturedDuringShowMode = true;
        capturedAtEventId = band.showModeEventId || requestEventId || null;
        captureCampaignId = band.showModeCampaignId || null;
        finalSourceDetail = sourceDetail || band.showModeSourceDetail || null;

        metadata = {
          captureContext: 'show_mode',
          showModeType: band.showModeType,
          eventId: capturedAtEventId,
          campaignId: captureCampaignId,
          venue: band.showModeVenue,
          city: band.showModeCity,
          region: band.showModeRegion,
          country: band.showModeCountry,
          sourceDetail: finalSourceDetail,
          showModeTitle: band.showModeTitle,
        };
      }

      // Follow without mailing-list consent. Must run before createFan, which
      // restores unsubscribed and removed rows onto the list.
      const followOnly = marketingConsent === false || marketingConsent === 'false';
      if (followOnly) {
        const followed = await followArtistByEmail(strapi, {
          email,
          firstName,
          bandId,
          source: finalSource,
          captureSurface: finalCaptureSurface,
          visitorToken,
        });
        if (!followed.ok) {
          if (followed.error === 'invalid_email') return ctx.badRequest('Invalid email address');
          if (followed.error === 'band_not_found') return ctx.notFound('Band not found');
          if (followed.error === 'removed') {
            return ctx.badRequest('This email can’t follow this artist right now.');
          }
          return ctx.badRequest('Could not follow this artist');
        }
        await claimSignedInFanIfPresent(ctx);
        return {
          data: {
            success: true,
            message: followed.already ? 'Already following' : 'Following',
            subscribed: followed.subscribed === true,
          },
        };
      }

      // Create fan with rich context
      const result = await strapi.service('api::fan.fan').createFan({
        email,
        firstName,
        source: finalSource,
        bandId,
        metadata,
        captureContext,
        capturedDuringShowMode,
        capturedAtEventId,
        captureCampaignId,
        captureSurface: finalCaptureSurface,
        sourceDetail: finalSourceDetail,
        city: band.showModeCity || null,
        region: band.showModeRegion || null,
        country: band.showModeCountry || null,
        timezone: band.showModeTimezone || null,
        firstSeenAt: now,
        lastSeenAt: now,
      });

      if (result.fanId) {
        try {
          await establishFollowOnFan(strapi, result.fanId, { now });
        } catch (followErr) {
          strapi.log.warn('[Fan] explicit Join Follow write skipped', followErr);
        }
      }

      // Create FanInteraction record for analytics
      try {
        await strapi.entityService.create('api::fan-interaction.fan-interaction', {
          data: {
            fan: result.fanId || null,
            band: bandId,
            eventId: capturedAtEventId,
            interactionType: 'joined_fan_list',
            interactionContext: captureContext,
            surface: finalCaptureSurface,
            timestamp: now.toISOString(),
            city: band.showModeCity || null,
            region: band.showModeRegion || null,
            country: band.showModeCountry || null,
            timezone: band.showModeTimezone || null,
            campaignId: captureCampaignId,
            metadata: { source: finalSource, sourceDetail: finalSourceDetail },
          },
        });
      } catch (interactionError) {
        strapi.log.warn('[Fan] Failed to create interaction record', interactionError);
      }

      if (!result.success) {
        if (result.reason === 'duplicate') {
          // Update lastSeenAt for existing fan
          if (result.fanId) {
            await strapi.entityService.update('api::fan.fan', result.fanId, {
              data: { lastSeenAt: now.toISOString() },
            });
            try {
              await fanIdentity.attachVisitorToFan({
                visitorToken,
                fanId: result.fanId,
              });
            } catch (linkErr) {
              strapi.log.warn('[Fan] visitor link failed on duplicate subscribe', linkErr);
            }
          }
          await claimSignedInFanIfPresent(ctx);
          return { data: { success: true, message: 'Already subscribed' } };
        }
        if (result.reason === 'invalid_email') {
          return ctx.badRequest('Invalid email address');
        }
      }

      if (result.fanId) {
        try {
          await fanIdentity.attachVisitorToFan({
            visitorToken,
            fanId: result.fanId,
          });
        } catch (linkErr) {
          strapi.log.warn('[Fan] visitor link failed on subscribe', linkErr);
        }
      }

      await claimSignedInFanIfPresent(ctx);
      return { data: { success: true, message: 'Subscribed successfully' } };
    } catch (error) {
      console.error('Error subscribing fan:', error);
      return ctx.internalServerError('Failed to subscribe');
    }
  },

  // POST /api/fans/add (authenticated - manual add)  { bandId, email, notes }
  async add(ctx) {
    try {
      const body = ctx.request.body || {};
      const scope = await resolveScopedBand(strapi, ctx, body.bandId, 'manageFanList');
      if (scope.error === 'unauthorized') return ctx.unauthorized('Authentication required');
      if (scope.error === 'band_id_required') return ctx.badRequest('bandId is required');
      if (scope.error === 'forbidden') {
        return ctx.forbidden("You do not have permission to manage this band's Fan List");
      }

      const { email, notes } = body;

      if (!email) {
        return ctx.badRequest('email is required');
      }

      const result = await strapi.service('api::fan.fan').createFan({
        email,
        source: 'manual',
        bandId: scope.bandId,
        notes,
      });

      if (!result.success) {
        if (result.reason === 'duplicate') {
          return ctx.badRequest('Fan already exists');
        }
        if (result.reason === 'invalid_email') {
          return ctx.badRequest('Invalid email address');
        }
      }

      return { data: result.fan };
    } catch (error) {
      console.error('Error adding fan:', error);
      return ctx.internalServerError('Failed to add fan');
    }
  },
}));
