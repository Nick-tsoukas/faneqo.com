'use strict';

/**
 * show-recap service
 * 
 * Generates and manages post-show recaps for fan growth metrics
 */

const { createCoreService } = require('@strapi/strapi').factories;
const showCover = require('../../../utils/showMode/showCoverPure');
const showTime = require('../../../utils/showTime');
const recapWrite = require('../../../utils/showMode/recapWritePure');
const integrity = require('../../../utils/showMode/showModeIntegrityPure');
const nightEnrichment = require('../../../utils/showMode/nightEnrichmentPure');
const nightCover = require('../../../utils/showMode/nightCover');
const { requireBandPermission } = require('../../../utils/bandRoles');
const {
  VIEW_NIGHT_HISTORY_PERMISSION,
  resolveAuthorizedWorkspaceBand,
} = require('../../../utils/bands/resolveAuthorizedWorkspaceBand');

/** Fill in the fields the recap must always have, after any preserved values. */
function applyRecapDefaults(recapData, defaultShowTitle) {
  if (!recapData.showTitle) recapData.showTitle = defaultShowTitle;
  if (!recapData.showModeType) recapData.showModeType = 'manual';
  if (!recapData.showEndedAt) recapData.showEndedAt = new Date().toISOString();
  return recapData;
}

module.exports = createCoreService('api::show-recap.show-recap', ({ strapi }) => ({

  /**
   * Generate a show recap for a completed show mode campaign
   *
   * `showContext` is a snapshot of the band's show mode fields taken before
   * deactivation clears them. Without it the recap loses venue/start/event
   * identity, because the band row is already wiped by the time this runs.
   */
  async generateShowRecap({ bandId, campaignId, showContext = null }) {
    if (!bandId || !campaignId) {
      strapi.log.warn('generateShowRecap: missing bandId or campaignId');
      return null;
    }

    strapi.log.info(`Generating show recap for band ${bandId}, campaign ${campaignId}`);

    try {
      // Check if recap already exists for this campaign
      const existingRecap = await strapi.entityService.findMany('api::show-recap.show-recap', {
        filters: { campaignId },
        populate: { coverImage: true, heroImage: true },
        limit: 1,
      });

      // Get band info for context
      const band = await strapi.entityService.findOne('api::band.band', bandId, {
        fields: [
          'id', 'name', 'showModeType', 'showModeStartedAt', 'showModeEndedAt',
          'showModeEventId', 'showModePerformanceStartsAt', 'showModePerformanceEndsAt',
          'showModeTimezone', 'showModeLastContext', 'showModeLastCampaignId',
          'showModeCampaignId',
        ],
      });

      if (!band) {
        strapi.log.warn(`generateShowRecap: band ${bandId} not found`);
        return null;
      }

      // Get all fans captured with this campaign
      const capturedFans = await strapi.entityService.findMany('api::fan.fan', {
        filters: { 
          band: bandId,
          captureCampaignId: campaignId,
        },
        limit: 10000,
      });

      // Get all interactions for this campaign
      const interactions = await strapi.entityService.findMany('api::fan-interaction.fan-interaction', {
        filters: {
          band: bandId,
          campaignId,
        },
        limit: 50000,
      });

      // Calculate metrics
      const fansCaptured = capturedFans.length;
      const fansCapturedDuringShowMode = capturedFans.filter(f => f.capturedDuringShowMode === true).length;

      // Calculate capture surface breakdown
      const captureSurfaceBreakdown = {};
      capturedFans.forEach(fan => {
        const surface = fan.captureSurface || 'unknown';
        captureSurfaceBreakdown[surface] = (captureSurfaceBreakdown[surface] || 0) + 1;
      });

      // Find top capture surface
      let topCaptureSurface = null;
      let topCaptureSurfaceCount = 0;
      Object.entries(captureSurfaceBreakdown).forEach(([surface, count]) => {
        if (count > topCaptureSurfaceCount) {
          topCaptureSurface = surface;
          topCaptureSurfaceCount = count;
        }
      });

      // Calculate city breakdown
      const cityBreakdown = {};
      capturedFans.forEach(fan => {
        const city = fan.city || 'Unknown';
        cityBreakdown[city] = (cityBreakdown[city] || 0) + 1;
      });

      // Find top city
      let topCity = null;
      let topCityCount = 0;
      Object.entries(cityBreakdown).forEach(([city, count]) => {
        if (count > topCityCount) {
          topCity = city;
          topCityCount = count;
        }
      });

      // Calculate interaction breakdown
      const interactionBreakdown = {};
      interactions.forEach(interaction => {
        const type = interaction.interactionType || 'unknown';
        interactionBreakdown[type] = (interactionBreakdown[type] || 0) + 1;
      });

      // Extract specific interaction counts
      const spotifyClicks = interactionBreakdown['clicked_spotify'] || 0;
      const appleMusicClicks = interactionBreakdown['clicked_apple_music'] || 0;
      const youtubeClicks = interactionBreakdown['clicked_youtube'] || 0;
      const ticketClicks = interactionBreakdown['clicked_ticket_link'] || 0;
      const merchClicks = interactionBreakdown['clicked_merch'] || 0;
      const shareClicks = interactionBreakdown['clicked_share'] || 0;
      const followClicks = interactionBreakdown['clicked_follow'] || 0;
      const saveClicks = interactionBreakdown['clicked_save'] || 0;
      const featuredSongPlays = interactionBreakdown['played_featured_song'] || 0;
      const videoClicks = interactionBreakdown['clicked_video'] || 0;
      const checkedInShowCount = interactionBreakdown['checked_in_show'] || 0;

      // Calculate engagement scores for captured fans
      const fanIds = capturedFans.map(f => f.id);
      let engagementScores = {};
      if (fanIds.length > 0) {
        engagementScores = await strapi.service('api::fan-interaction.fan-interaction').calculateBatchEngagementScores(fanIds);
      }

      // Calculate tier counts and average engagement
      let totalEngagement = 0;
      let superfanSignalCount = 0;
      let engagedFanCount = 0;
      let warmFanCount = 0;
      let newFanCount = 0;

      fanIds.forEach(fanId => {
        const engagement = engagementScores[fanId] || { score: 0, tier: 'new' };
        totalEngagement += engagement.score;
        
        switch (engagement.tier) {
          case 'superfan_signal':
            superfanSignalCount++;
            break;
          case 'engaged':
            engagedFanCount++;
            break;
          case 'warm':
            warmFanCount++;
            break;
          default:
            newFanCount++;
        }
      });

      const averageEngagementScore = fansCaptured > 0 
        ? Math.round((totalEngagement / fansCaptured) * 100) / 100 
        : 0;

      // Infer show info — prefer the pre-deactivation snapshot, fall back to
      // whatever is still on the band (regeneration while show mode is live).
      const context = {
        ...integrity.recoveryShowContext(band, campaignId),
        ...(showContext || {}),
      };
      const defaultShowTitle = band.name ? `${band.name} Live` : 'Live Show';
      let showTitle = context.title || null;
      let venue = context.venue || null;
      let city = context.city || topCity;
      let region = context.region || null;
      let country = context.country || null;
      let timezone = context.timezone || null;
      let eventId = context.eventId || band.showModeEventId || null;

      let eventStart = null;
      let eventRecord = null;

      // Try to get event info if eventId exists
      if (eventId) {
        try {
          const event = await strapi.entityService.findOne('api::event.event', eventId, {
            fields: ['id', 'title', 'venue', 'city', 'state', 'country', 'date', 'time'],
            populate: { image: true },
          });
          if (event) {
            eventRecord = event;
            venue = event.venue || venue;
            city = event.city || city;
            region = event.state || region;
            country = event.country || country;
            showTitle = event.venue ? `${band.name} @ ${event.venue}` : showTitle;
            eventStart = showTime.resolveEventStart(
              event,
              timezone || context.timezone || band.showModeTimezone || null
            );
          }
        } catch (e) {
          strapi.log.warn(`Could not fetch event ${eventId}:`, e.message);
        }
      }

      // Attendance records carry their own copy of the show context, so a recap
      // generated late (cron fallback, manual regeneration) can still recover it.
      if (!venue || !city || !timezone) {
        try {
          const attendances = await strapi.entityService.findMany('api::fan-show-attendance.fan-show-attendance', {
            filters: { band: bandId, campaignId },
            fields: ['id', 'venue', 'city', 'region', 'country', 'timezone', 'showTitle'],
            populate: { event: { fields: ['id'] } },
            sort: { checkedInAt: 'asc' },
            limit: 1,
          });

          const attendance = attendances[0];
          if (attendance) {
            venue = venue || attendance.venue || null;
            city = city || attendance.city || null;
            region = region || attendance.region || null;
            country = country || attendance.country || null;
            timezone = timezone || attendance.timezone || null;
            if (attendance.showTitle && !context.title) showTitle = attendance.showTitle;
            const attendanceEventId = attendance.event?.id || attendance.event;
            if (!eventId && attendanceEventId) eventId = attendanceEventId;
          }
        } catch (e) {
          strapi.log.warn(`Could not read attendance context for campaign ${campaignId}: ${e.message}`);
        }
      }

      // If no event, try to infer from first captured fan
      if (!venue && capturedFans.length > 0) {
        const firstFan = capturedFans[0];
        city = city || firstFan.city;
        region = region || firstFan.region;
        country = country || firstFan.country;
        timezone = firstFan.timezone;
      }

      const previous = existingRecap && existingRecap.length > 0 ? existingRecap[0] : null;
      const performanceTiming = showTime.resolveRecapPerformanceTiming({
        snapshot: {
          performanceStartsAt: context.performanceStartsAt,
          performanceEndsAt: context.performanceEndsAt,
          showStartedAt: context.showStartedAt || band.showModeStartedAt,
          showEndedAt: context.showEndedAt || band.showModeEndedAt,
        },
        stored: previous || {},
        eventStart,
      });

      const recapData = {
        band: bandId,
        eventId,
        campaignId,
        showTitle,
        venue,
        city,
        region,
        country,
        timezone,
        showModeType: context.showModeType || band.showModeType || null,
        showStartedAt: context.showStartedAt || band.showModeStartedAt || null,
        showEndedAt: context.showEndedAt || band.showModeEndedAt || null,
        performanceStartsAt: performanceTiming.performanceStartsAt,
        performanceEndsAt: performanceTiming.performanceEndsAt,
        recapGeneratedAt: new Date().toISOString(),
        fansCaptured,
        fansCapturedDuringShowMode,
        topCaptureSurface,
        topCaptureSurfaceCount,
        topCity,
        topCityCount,
        spotifyClicks,
        appleMusicClicks,
        youtubeClicks,
        ticketClicks,
        merchClicks,
        shareClicks,
        followClicks,
        saveClicks,
        featuredSongPlays,
        videoClicks,
        checkedInShowCount,
        averageEngagementScore,
        superfanSignalCount,
        engagedFanCount,
        warmFanCount,
        newFanCount,
        interactionCount: interactions.length,
        captureSurfaceBreakdown,
        cityBreakdown,
        interactionBreakdown,
        metadata: {
          generatedBy: 'show-recap-engine-v1',
          bandName: band.name,
        },
      };

      let recap;
      if (previous) {
        // Regeneration recomputes metrics, but must not blank out show identity
        // that an earlier run captured (the band fields are cleared on end).
        const preservedFields = [
          'eventId', 'showTitle', 'venue', 'city', 'region', 'country', 'timezone',
          'showModeType', 'showStartedAt', 'showEndedAt',
          'performanceStartsAt', 'performanceEndsAt',
        ];

        for (const field of preservedFields) {
          if (recapData[field] === null || recapData[field] === undefined) {
            recapData[field] = previous[field] ?? null;
          }
        }

        applyRecapDefaults(recapData, defaultShowTitle);

        recap = await strapi.entityService.update('api::show-recap.show-recap', previous.id, {
          data: recapWrite.buildRecapUpdateData({
            recapData,
            previous,
            seeds: await this.nightSystemSeeds({ recapData, previous, context, event: eventRecord }),
          }),
        });
        strapi.log.info(`Updated show recap ${recap.id} for campaign ${campaignId}`);
      } else {
        applyRecapDefaults(recapData, defaultShowTitle);
        const seeds = await this.nightSystemSeeds({ recapData, previous: null, context, event: eventRecord });
        recap = await strapi.entityService.create('api::show-recap.show-recap', {
          data: {
            ...recapWrite.stripArtistAuthoredFields(recapData),
            ...(seeds.nightSlug ? { nightSlug: seeds.nightSlug } : {}),
            ...(seeds.coverImage ? { coverImage: seeds.coverImage } : {}),
          },
        });
        strapi.log.info(`Created show recap ${recap.id} for campaign ${campaignId}`);
      }

      return recap;
    } catch (error) {
      strapi.log.error('Error generating show recap:', error);
      throw error;
    }
  },

  /**
   * Check-in breakdown for a campaign, derived from fan-show-attendance.
   * Computed on read so recaps written before this existed stay accurate.
   */
  async getCheckInStats({ bandId, campaignId }) {
    const empty = {
      newFanCheckIns: 0,
      knownFanCheckIns: 0,
      averageCheckInConfidence: 0,
      attendanceCount: 0,
    };

    if (!bandId || !campaignId) return empty;

    try {
      const rows = await strapi.entityService.findMany('api::fan-show-attendance.fan-show-attendance', {
        filters: { band: bandId, campaignId },
        fields: ['id', 'isNewFanAtCheckIn', 'confidenceScore', 'suppressedDuplicate'],
        limit: 10000,
      });

      // Filtered here rather than in the query: a SQL `!= true` also drops rows
      // where the column is null.
      const attendances = rows.filter(a => a.suppressedDuplicate !== true);

      if (!attendances.length) return empty;

      const newFanCheckIns = attendances.filter(a => a.isNewFanAtCheckIn === true).length;
      const totalConfidence = attendances.reduce((sum, a) => sum + (Number(a.confidenceScore) || 0), 0);

      return {
        newFanCheckIns,
        knownFanCheckIns: attendances.length - newFanCheckIns,
        averageCheckInConfidence: Math.round(totalConfidence / attendances.length),
        attendanceCount: attendances.length,
      };
    } catch (error) {
      strapi.log.warn(`getCheckInStats failed for campaign ${campaignId}: ${error.message}`);
      return empty;
    }
  },

  /**
   * Merge derived check-in stats onto a stored recap record
   */
  async withShowCover(recap) {
    if (!recap) return recap;
    const ownedUrl = nightEnrichment.publicCoverUrl(recap.coverImage);
    const eventId = showCover.positiveId(recap.eventId);
    let eventImageUrl = recap.eventImageUrl || null;
    if (eventId) {
      try {
        const event = await strapi.entityService.findOne('api::event.event', eventId, {
          fields: ['id'],
          populate: { image: true },
        });
        eventImageUrl = showCover.showCoverFromEvent(event)?.url || eventImageUrl;
      } catch (error) {
        strapi.log.warn(`withShowCover failed for event ${eventId}: ${error.message}`);
      }
    }
    return {
      ...recap,
      eventImageUrl,
      showCoverUrl: ownedUrl || eventImageUrl || recap.showCoverUrl || null,
    };
  },

  async withCheckInStats(recap, bandId = null) {
    if (!recap) return recap;

    const resolvedBandId = bandId || recap.band?.id || recap.band || null;
    const stats = await this.getCheckInStats({ bandId: resolvedBandId, campaignId: recap.campaignId });

    return this.withShowCover(showTime.withReadTimePerformanceTiming({
      ...recap,
      newFanCheckIns: stats.newFanCheckIns,
      knownFanCheckIns: stats.knownFanCheckIns,
      averageCheckInConfidence: stats.averageCheckInConfidence,
      // Attendance records are the reliable count; interaction rows can be lost
      // when a check-in is retried or de-duplicated.
      checkedInShowCount: Math.max(recap.checkedInShowCount || 0, stats.attendanceCount),
    }));
  },

  /**
   * Paginated Night history for the caller's V1 workspace band.
   * Empty list (not 403) when the user has no authorized band — same as owners
   * with zero recaps, and the established my-recaps no-band contract.
   */
  async listMyRecaps({ userId, page = 1, pageSize = 10, bandId: rawBandId, search = '' } = {}) {
    const scope = await resolveAuthorizedWorkspaceBand(
      strapi,
      userId,
      VIEW_NIGHT_HISTORY_PERMISSION,
      rawBandId
    );
    if (scope.error === 'unauthorized') {
      return { error: 'unauthorized', status: 401, message: 'Authentication required' };
    }
    if (scope.error === 'band_id_invalid') {
      return { error: 'band_id_invalid', status: 400, message: 'bandId is invalid' };
    }
    if (scope.error === 'forbidden') {
      return { error: 'forbidden', status: 403, message: 'You do not have access to this Night history' };
    }
    if (!scope.bandId) {
      return {
        data: [],
        meta: { pagination: { page: 1, pageSize: 10, pageCount: 0, total: 0 } },
      };
    }
    return this.getShowRecaps({
      bandId: scope.bandId,
      page,
      pageSize,
      search,
    });
  },

  /**
   * Latest Night for the caller's V1 workspace band.
   * `{ data: null }` at the HTTP layer when there is no authorized band.
   */
  async getLatestForMe({ userId, bandId: rawBandId } = {}) {
    const scope = await resolveAuthorizedWorkspaceBand(
      strapi,
      userId,
      VIEW_NIGHT_HISTORY_PERMISSION,
      rawBandId
    );
    if (scope.error === 'unauthorized') {
      return { error: 'unauthorized', status: 401, message: 'Authentication required' };
    }
    if (scope.error === 'band_id_invalid') {
      return { error: 'band_id_invalid', status: 400, message: 'bandId is invalid' };
    }
    if (scope.error === 'forbidden') {
      return { error: 'forbidden', status: 403, message: 'You do not have access to this Night' };
    }
    if (!scope.bandId) return { data: null };
    const recap = await this.getRecentShowRecap({ bandId: scope.bandId });
    return { data: recap };
  },

  /**
   * Recap detail authorized against the recap's own band — not the workspace
   * pick. Same permission as GET /show-recaps/:id/night.
   */
  async getAuthorizedRecapDetail({ userId, recapId }) {
    if (!userId) {
      return { error: 'unauthorized', status: 401, message: 'Authentication required' };
    }
    const recap = await strapi.entityService.findOne('api::show-recap.show-recap', recapId, {
      populate: { band: { fields: ['id'] } },
    });
    if (!recap) return { error: 'not_found', status: 404, message: 'Recap not found' };

    const bandId = recap.band?.id || recap.band;
    if (!bandId) return { error: 'forbidden', status: 403, message: 'Recap has no band' };

    const access = await requireBandPermission(strapi, userId, bandId, VIEW_NIGHT_HISTORY_PERMISSION);
    if (!access) {
      return { error: 'forbidden', status: 403, message: 'You do not have access to this Night' };
    }

    const detail = await this.getShowRecapDetail({ bandId, recapId });
    if (!detail) return { error: 'not_found', status: 404, message: 'Recap not found' };
    return { data: detail };
  },

  /**
   * Get the most recent show recap for a band
   */
  async getRecentShowRecap({ bandId }) {
    const recaps = await strapi.entityService.findMany('api::show-recap.show-recap', {
      filters: { band: bandId },
      populate: { coverImage: true, heroImage: true },
      sort: { recapGeneratedAt: 'desc' },
      limit: 1,
    });

    return recaps.length > 0 ? this.withCheckInStats(recaps[0], bandId) : null;
  },

  /**
   * Get paginated list of show recaps for a band
   */
  async getShowRecaps({ bandId, page = 1, pageSize = 10, search = '' }) {
    const start = (page - 1) * pageSize;

    // Picker search: the three things an artist actually remembers about a night.
    const term = String(search || '').trim().slice(0, 80);
    const filters = term
      ? {
        band: bandId,
        $or: [
          { city: { $containsi: term } },
          { venue: { $containsi: term } },
          { showTitle: { $containsi: term } },
        ],
      }
      : { band: bandId };

    const [recaps, count] = await Promise.all([
      strapi.entityService.findMany('api::show-recap.show-recap', {
        filters,
        populate: { coverImage: true, heroImage: true },
        sort: { recapGeneratedAt: 'desc' },
        start,
        limit: pageSize,
      }),
      strapi.entityService.count('api::show-recap.show-recap', { filters }),
    ]);

    const enrichedRecaps = await Promise.all(recaps.map(recap => this.withCheckInStats(recap, bandId)));

    return {
      data: enrichedRecaps,
      meta: {
        pagination: {
          page,
          pageSize,
          pageCount: Math.ceil(count / pageSize),
          total: count,
        },
      },
    };
  },

  /**
   * Get detailed show recap with top fans
   */
  async getShowRecapDetail({ bandId, recapId }) {
    const recap = await strapi.entityService.findOne('api::show-recap.show-recap', recapId, {
      populate: {
        band: { fields: ['id', 'name', 'slug'] },
        coverImage: true,
        heroImage: true,
      },
    });

    if (!recap || recap.band?.id !== bandId) {
      return null;
    }

    // Get top fans captured during this campaign
    let topFans = [];
    if (recap.campaignId) {
      const fans = await strapi.entityService.findMany('api::fan.fan', {
        filters: {
          band: bandId,
          captureCampaignId: recap.campaignId,
        },
        limit: 100,
      });

      // Get engagement scores
      const fanIds = fans.map(f => f.id);
      let engagementScores = {};
      if (fanIds.length > 0) {
        engagementScores = await strapi.service('api::fan-interaction.fan-interaction').calculateBatchEngagementScores(fanIds);
      }

      // Enrich and sort by engagement
      topFans = fans
        .map(fan => ({
          id: fan.id,
          email: fan.email,
          firstName: fan.firstName,
          city: fan.city,
          captureSurface: fan.captureSurface,
          subscribedAt: fan.subscribedAt,
          engagementScore: engagementScores[fan.id]?.score || 0,
          engagementTier: engagementScores[fan.id]?.tier || 'new',
        }))
        .sort((a, b) => b.engagementScore - a.engagementScore)
        .slice(0, 20);
    }

    const enrichedRecap = await this.withCheckInStats(recap, bandId);

    return {
      ...enrichedRecap,
      topFans,
    };
  },

  /**
   * Find campaigns that need recap generation (for cron fallback)
   */
  async findCampaignsNeedingRecap() {
    // Deactivation clears showModeCampaignId and archives it in
    // showModeLastCampaignId, so the archived id is the one to look at.
    // showModeCampaignId is still checked for shows that ended before this
    // field existed.
    const recentlyEndedBands = await strapi.entityService.findMany('api::band.band', {
      filters: {
        showModeEnabled: false,
        showModeEndedAt: {
          $gte: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Last 24 hours
        },
        $or: [
          { showModeLastCampaignId: { $notNull: true } },
          { showModeCampaignId: { $notNull: true } },
        ],
      },
      fields: [
        'id', 'showModeStatus', 'showModeCampaignId', 'showModeLastCampaignId',
        'showModeEndedAt', 'showModeLastContext',
      ],
      limit: 100,
    });

    const campaignsNeedingRecap = [];

    for (const band of recentlyEndedBands) {
      const campaignId = band.showModeLastCampaignId || band.showModeCampaignId;
      if (!campaignId) continue;

      // A campaign that is scheduled but hasn't run yet has nothing to recap.
      if (band.showModeStatus === 'scheduled' && campaignId === band.showModeCampaignId) continue;

      // Check if recap exists
      const existingRecap = await strapi.entityService.findMany('api::show-recap.show-recap', {
        filters: { campaignId },
        limit: 1,
      });

      if (existingRecap.length === 0) {
        campaignsNeedingRecap.push({
          bandId: band.id,
          campaignId,
          showContext: integrity.recoveryShowContext(band, campaignId),
        });
      }
    }

    return campaignsNeedingRecap;
  },

  async uniqueNightSlug(desired, bandId = null) {
    const slug = String(desired || '').slice(0, 120) || `night-${Date.now().toString(36)}`;
    const filters = { nightSlug: slug };
    if (bandId) filters.band = bandId;
    const existing = await strapi.entityService.findMany('api::show-recap.show-recap', {
      filters,
      fields: ['id'],
      limit: 2,
    });
    if (!existing.length) return slug;
    return `${slug.slice(0, 110)}-${Date.now().toString(36).slice(-6)}`;
  },

  async nightSystemSeeds({ recapData, previous = null, context = {}, event = null } = {}) {
    const seeds = {};
    if (!previous?.nightSlug) {
      seeds.nightSlug = await this.uniqueNightSlug(nightEnrichment.buildNightSlug({
        venue: recapData?.venue || context.venue,
        city: recapData?.city || context.city,
        showTitle: recapData?.showTitle || context.title,
        performanceStartsAt: recapData?.performanceStartsAt || context.performanceStartsAt,
        showStartedAt: recapData?.showStartedAt || context.showStartedAt,
        timezone: recapData?.timezone || context.timezone,
        campaignId: recapData?.campaignId || context.campaignId,
      }), recapData?.band || previous?.band?.id || previous?.band || context.bandId || null);
    }
    if (!nightEnrichment.hasArtistCover(previous)) {
      // Explicit Show Mode Night photo only. Event artwork must not become Night Photo.
      seeds.coverImage = nightEnrichment.positiveId(context.coverMediaId) || null;
    }
    return seeds;
  },

  async loadNightRecap(recapId) {
    return strapi.entityService.findOne('api::show-recap.show-recap', recapId, {
      populate: {
        band: { fields: ['id', 'name', 'slug'] },
        coverImage: true,
        heroImage: true,
      },
    });
  },

  async getArtistNight({ recapId, userId }) {
    if (!userId) {
      return { error: 'unauthorized', status: 401, message: 'Authentication required' };
    }
    const recap = await this.loadNightRecap(recapId);
    if (!recap) return { error: 'not_found', status: 404, message: 'Recap not found' };
    const bandId = recap.band?.id || recap.band;
    if (!bandId) return { error: 'forbidden', status: 403, message: 'Recap has no band' };

    const access = await requireBandPermission(strapi, userId, bandId, 'viewShowMode');
    if (!access) {
      return { error: 'forbidden', status: 403, message: 'You do not have access to this Night' };
    }

    const includePrivateNote = !!(access.permissions.editBand || access.permissions.operateShowMode);
    const enriched = await this.withCheckInStats(recap, bandId);
    return {
      data: nightEnrichment.toArtistNight(enriched, { includePrivateNote }),
      access,
    };
  },

  async validateLineupBands(lineup) {
    if (!Array.isArray(lineup)) return null;
    for (const item of lineup) {
      if (!item.bandId) continue;
      const band = await strapi.entityService.findOne('api::band.band', item.bandId, {
        fields: ['id'],
      });
      if (!band) {
        return {
          error: 'invalid_lineup_band',
          status: 400,
          message: 'Linked lineup band was not found.',
        };
      }
    }
    return null;
  },

  async enrichNight({ recapId, userId, patch = {} }) {
    if (!userId) {
      return { error: 'unauthorized', status: 401, message: 'Authentication required' };
    }
    const recap = await this.loadNightRecap(recapId);
    if (!recap) return { error: 'not_found', status: 404, message: 'Recap not found' };
    const bandId = recap.band?.id || recap.band;
    if (!bandId) return { error: 'forbidden', status: 403, message: 'Recap has no band' };

    const access = await requireBandPermission(strapi, userId, bandId, 'editBand');
    if (!access) {
      return { error: 'forbidden', status: 403, message: 'You cannot edit this Night' };
    }

    const data = {};
    if (Object.prototype.hasOwnProperty.call(patch, 'publicStory')) {
      const story = nightEnrichment.normalizePublicStory(patch.publicStory);
      if (story.error) return story;
      data.publicStory = story.value;
    }
    if (Object.prototype.hasOwnProperty.call(patch, 'privateArtistNote')) {
      const note = nightEnrichment.normalizePrivateArtistNote(patch.privateArtistNote);
      if (note.error) return note;
      data.privateArtistNote = note.value;
    }
    if (Object.prototype.hasOwnProperty.call(patch, 'lineup')) {
      const lineup = nightEnrichment.normalizeLineup(patch.lineup);
      if (lineup.error) return lineup;
      const invalidBand = await this.validateLineupBands(lineup.value);
      if (invalidBand) return invalidBand;
      data.lineup = lineup.value;
    }
    if (Object.prototype.hasOwnProperty.call(patch, 'coverMediaId')) {
      if (patch.coverMediaId === null || patch.coverMediaId === '') {
        data.coverImage = null;
      } else {
        const authorized = await nightCover.authorizePublicNightCover(strapi, userId, patch.coverMediaId);
        if (authorized.error) return authorized;
        data.coverImage = authorized.file.id;
      }
    }
    if (Object.prototype.hasOwnProperty.call(patch, 'heroMediaId')) {
      if (patch.heroMediaId === null || patch.heroMediaId === '') {
        data.heroImage = null;
      } else {
        const authorized = await nightCover.authorizePublicNightCover(strapi, userId, patch.heroMediaId);
        if (authorized.error) return authorized;
        data.heroImage = authorized.file.id;
      }
    }
    if (Object.prototype.hasOwnProperty.call(patch, 'heroFocalX')) {
      const focalX = nightEnrichment.normalizeHeroFocal(patch.heroFocalX, 'heroFocalX');
      if (focalX.error) return focalX;
      data.heroFocalX = focalX.value;
    }
    if (Object.prototype.hasOwnProperty.call(patch, 'heroFocalY')) {
      const focalY = nightEnrichment.normalizeHeroFocal(patch.heroFocalY, 'heroFocalY');
      if (focalY.error) return focalY;
      data.heroFocalY = focalY.value;
    }

    if (!recap.nightSlug) {
      data.nightSlug = await this.uniqueNightSlug(nightEnrichment.buildNightSlug({
        venue: recap.venue,
        city: recap.city,
        showTitle: recap.showTitle,
        performanceStartsAt: recap.performanceStartsAt,
        showStartedAt: recap.showStartedAt,
        timezone: recap.timezone,
        campaignId: recap.campaignId,
      }), bandId);
    }

    if (Object.keys(data).length) {
      await strapi.entityService.update('api::show-recap.show-recap', recap.id, { data });
    }

    const next = await this.loadNightRecap(recap.id);
    const enriched = await this.withCheckInStats(next, bandId);
    return {
      data: nightEnrichment.toArtistNight(enriched, { includePrivateNote: true }),
    };
  },
}));
