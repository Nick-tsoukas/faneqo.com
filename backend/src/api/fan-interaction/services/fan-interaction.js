'use strict';

/**
 * fan-interaction service
 */

const { createCoreService } = require('@strapi/strapi').factories;
const { findFanByBandEmail, createFanIdempotent, hashEmailKey, normalizeEmail } = require('../../../utils/fans/fanEmail');
const {
  canonicalAttendanceFilters,
  createAttendanceIdempotent,
  shouldIncrementCheckedInShowCount,
} = require('../../../utils/fans/canonicalAttendance');
const fanIdentity = require('../../../utils/fanIdentity');

// Engagement scoring weights
const INTERACTION_WEIGHTS = {
  joined_fan_list: 10,
  viewed_band_page: 1,
  viewed_show_mode_page: 2,
  opened_follow_modal: 2,
  clicked_spotify: 3,
  clicked_apple_music: 3,
  clicked_youtube: 3,
  clicked_ticket_link: 8,
  clicked_merch: 8,
  clicked_share: 12,
  clicked_follow: 4,
  clicked_save: 4,
  played_featured_song: 5,
  clicked_video: 5,
  checked_in_show: 15,
};

// Engagement tier thresholds
const ENGAGEMENT_TIERS = {
  new: { min: 0, max: 9 },
  warm: { min: 10, max: 19 },
  engaged: { min: 20, max: 39 },
  superfan_signal: { min: 40, max: Infinity },
};

// Valid enums for validation
const VALID_INTERACTION_TYPES = Object.keys(INTERACTION_WEIGHTS);
const VALID_SURFACES = ['band_page', 'follow_modal', 'qr_poster', 'qr_merch_table', 'qr_stage_screen', 'qr_flyer', 'event_page', 'direct_link', 'unknown'];
const VALID_CONTEXTS = ['normal', 'show_mode', 'release_mode', 'merch_mode'];

module.exports = createCoreService('api::fan-interaction.fan-interaction', ({ strapi }) => ({

  /**
   * Resolve whether the current recognized fan attended one specific show.
   * This is a read model only: canonical unsuppressed attendance rows remain truth.
   * The response intentionally exposes no fan identity or attendance details.
   */
  async getShowCheckInStatus({ bandId, campaignId = null, eventId = null, visitorToken = null, userId = null }) {
    const parsedBandId = Number.parseInt(bandId, 10);
    const parsedEventId = eventId ? Number.parseInt(eventId, 10) : null;
    if (!parsedBandId || (!campaignId && !parsedEventId)) {
      return { resolved: false, checkedIn: false };
    }

    let visitorId = null;
    if (fanIdentity.isValidVisitorToken(visitorToken)) {
      const visitor = await fanIdentity.findVisitorByToken(visitorToken);
      visitorId = visitor?.id || null;
    }

    const identityFilters = [];
    if (visitorId) identityFilters.push({ visitor: visitorId });
    if (userId) identityFilters.push({ accountUser: userId });
    if (!identityFilters.length) {
      return { resolved: true, checkedIn: false };
    }

    const fanFilters = { band: parsedBandId };
    if (identityFilters.length === 1) {
      Object.assign(fanFilters, identityFilters[0]);
    } else {
      fanFilters.$or = identityFilters;
    }

    const fans = await strapi.entityService.findMany('api::fan.fan', {
      filters: fanFilters,
      fields: ['id'],
      limit: 10,
    });
    const fanIds = (fans || []).map((fan) => fan.id).filter(Boolean);
    if (!fanIds.length) {
      return { resolved: true, checkedIn: false };
    }

    const baseFilters = {
      band: parsedBandId,
      fan: { id: { $in: fanIds } },
    };

    if (campaignId) {
      const byCampaign = await strapi.entityService.findMany('api::fan-show-attendance.fan-show-attendance', {
        filters: canonicalAttendanceFilters({ ...baseFilters, campaignId }),
        fields: ['id'],
        limit: 1,
      });
      if (byCampaign?.length) return { resolved: true, checkedIn: true };
    }

    if (parsedEventId) {
      const byEvent = await strapi.entityService.findMany('api::fan-show-attendance.fan-show-attendance', {
        filters: canonicalAttendanceFilters({ ...baseFilters, event: parsedEventId }),
        fields: ['id'],
        limit: 1,
      });
      if (byEvent?.length) return { resolved: true, checkedIn: true };
    }

    return { resolved: true, checkedIn: false };
  },

  // Get engagement score weight for an interaction type
  getInteractionWeight(interactionType) {
    return INTERACTION_WEIGHTS[interactionType] || 0;
  },

  // Calculate engagement tier from score
  getEngagementTier(score) {
    if (score >= ENGAGEMENT_TIERS.superfan_signal.min) return 'superfan_signal';
    if (score >= ENGAGEMENT_TIERS.engaged.min) return 'engaged';
    if (score >= ENGAGEMENT_TIERS.warm.min) return 'warm';
    return 'new';
  },

  // Calculate engagement score for a fan
  async calculateFanEngagementScore(fanId) {
    const interactions = await strapi.entityService.findMany('api::fan-interaction.fan-interaction', {
      filters: { fan: fanId },
      fields: ['interactionType'],
    });

    let score = 0;
    interactions.forEach(interaction => {
      score += this.getInteractionWeight(interaction.interactionType);
    });

    return {
      score,
      tier: this.getEngagementTier(score),
      interactionCount: interactions.length,
    };
  },

  // Calculate engagement scores for multiple fans (batch)
  async calculateBatchEngagementScores(fanIds) {
    if (!fanIds || fanIds.length === 0) return {};

    const interactions = await strapi.entityService.findMany('api::fan-interaction.fan-interaction', {
      filters: { fan: { id: { $in: fanIds } } },
      fields: ['interactionType'],
      populate: { fan: { fields: ['id'] } },
    });

    const scoreMap = {};
    fanIds.forEach(id => {
      scoreMap[id] = { score: 0, interactionCount: 0 };
    });

    interactions.forEach(interaction => {
      const fanId = interaction.fan?.id;
      if (fanId && scoreMap[fanId]) {
        scoreMap[fanId].score += this.getInteractionWeight(interaction.interactionType);
        scoreMap[fanId].interactionCount++;
      }
    });

    // Add tier to each
    Object.keys(scoreMap).forEach(id => {
      scoreMap[id].tier = this.getEngagementTier(scoreMap[id].score);
    });

    return scoreMap;
  },

  // Track a fan interaction (public endpoint)
  async trackInteraction({
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
  }) {
    // Validate required fields
    if (!bandId) {
      return { success: false, error: 'bandId is required' };
    }
    if (!interactionType || !VALID_INTERACTION_TYPES.includes(interactionType)) {
      return { success: false, error: `Invalid interactionType. Valid types: ${VALID_INTERACTION_TYPES.join(', ')}` };
    }

    // Validate optional enums
    const validSurface = surface && VALID_SURFACES.includes(surface) ? surface : 'unknown';
    const validContext = interactionContext && VALID_CONTEXTS.includes(interactionContext) ? interactionContext : 'normal';

    // Check if band exists
    const band = await strapi.entityService.findOne('api::band.band', bandId);
    if (!band) {
      return { success: false, error: 'Band not found' };
    }

    // Try to find fan if email provided
    let fanId = null;
    if (fanEmail) {
      const normalizedEmail = fanEmail.trim().toLowerCase();
      const existingFans = await strapi.entityService.findMany('api::fan.fan', {
        filters: {
          email: { $eqi: normalizedEmail },
          band: bandId,
        },
        limit: 1,
      });
      if (existingFans.length > 0) {
        fanId = existingFans[0].id;

        // Update lastSeenAt on the fan
        await strapi.entityService.update('api::fan.fan', fanId, {
          data: { lastSeenAt: new Date().toISOString() },
        });
      }
    }

    // Create the interaction record
    const interaction = await strapi.entityService.create('api::fan-interaction.fan-interaction', {
      data: {
        band: bandId,
        fan: fanId,
        eventId: eventId || null,
        interactionType,
        interactionContext: validContext,
        surface: validSurface,
        campaignId: campaignId || null,
        timestamp: new Date().toISOString(),
        city: city || null,
        region: region || null,
        country: country || null,
        timezone: timezone || null,
        metadata: metadata || null,
      },
    });

    return { success: true, interactionId: interaction.id };
  },

  // Get recent interactions for a band
  async getRecentInteractions({ bandId, limit = 20 }) {
    const interactions = await strapi.entityService.findMany('api::fan-interaction.fan-interaction', {
      filters: { band: bandId },
      sort: { timestamp: 'desc' },
      limit,
      populate: {
        fan: { fields: ['id', 'email', 'firstName'] },
      },
    });

    return interactions.map(i => ({
      id: i.id,
      interactionType: i.interactionType,
      interactionContext: i.interactionContext,
      surface: i.surface,
      timestamp: i.timestamp,
      city: i.city,
      campaignId: i.campaignId,
      eventId: i.eventId,
      fanEmail: i.fan?.email || null,
      fanName: i.fan?.firstName || null,
      isAnonymous: !i.fan,
    }));
  },

  // Get interaction type breakdown for a band
  async getInteractionTypeBreakdown({ bandId, campaignId, eventId }) {
    const filters = { band: bandId };
    if (campaignId) filters.campaignId = campaignId;
    if (eventId) filters.eventId = eventId;

    const interactions = await strapi.entityService.findMany('api::fan-interaction.fan-interaction', {
      filters,
      fields: ['interactionType'],
    });

    const breakdown = {};
    VALID_INTERACTION_TYPES.forEach(type => { breakdown[type] = 0; });

    interactions.forEach(i => {
      if (breakdown[i.interactionType] !== undefined) {
        breakdown[i.interactionType]++;
      }
    });

    return breakdown;
  },

  // Get fan interaction history
  async getFanInteractionHistory({ fanId, limit = 50 }) {
    const interactions = await strapi.entityService.findMany('api::fan-interaction.fan-interaction', {
      filters: { fan: fanId },
      sort: { timestamp: 'desc' },
      limit,
    });

    return interactions.map(i => ({
      id: i.id,
      interactionType: i.interactionType,
      interactionContext: i.interactionContext,
      surface: i.surface,
      timestamp: i.timestamp,
      city: i.city,
      campaignId: i.campaignId,
      eventId: i.eventId,
    }));
  },

  /**
   * Process a show check-in (V2 - upgraded with verification, attendance records, improved dedupe)
   * 
   * Creates both a fan-interaction record AND a fan-show-attendance record.
   * The attendance record is the foundation for badges and fan passport.
   */
  async processShowCheckIn({
    bandId,
    fanEmail,
    eventId,
    campaignId,
    surface = 'band_page',
    checkInSource = 'direct_checkin_button',
    verificationLevel = 'self_reported',
    city,
    region,
    country,
    timezone,
    showModeSessionId,
    metadata = {},
    visitorToken = null,
  }) {
    if (!bandId || !fanEmail) {
      return { success: false, error: 'bandId and fanEmail are required' };
    }

    const normalizedEmail = normalizeEmail(fanEmail);
    if (!normalizedEmail) {
      return { success: false, error: 'bandId and fanEmail are required' };
    }
    const now = new Date();
    const nowISO = now.toISOString();

    // Get band with show mode info
    const band = await strapi.entityService.findOne('api::band.band', bandId, {
      fields: ['id', 'name', 'showModeEnabled', 'showModeCampaignId', 'showModeEventId', 'showModeTitle', 'showModeVenue', 'showModeCity', 'showModeTimezone'],
    });

    if (!band) {
      return { success: false, error: 'Band not found' };
    }

    // Resolve effective IDs from show mode if not provided
    const effectiveCampaignId = campaignId || band.showModeCampaignId || null;
    const effectiveEventId = eventId || band.showModeEventId || null;
    const effectiveSessionId = showModeSessionId || null;
    const effectiveVenue = metadata.venue || band.showModeVenue || null;
    const effectiveCity = city || band.showModeCity || null;
    const effectiveShowTitle = metadata.showTitle || band.showModeTitle || null;

    // Get event data if available (for time window awareness)
    let event = null;
    let showDate = null;
    if (effectiveEventId) {
      event = await strapi.entityService.findOne('api::event.event', effectiveEventId, {
        fields: ['id', 'title', 'date', 'time', 'venue', 'city'],
      });
      if (event?.date) {
        showDate = event.date;
      }
    }

    // Determine verification level based on context
    let effectiveVerificationLevel = verificationLevel;
    if (band.showModeEnabled && effectiveVerificationLevel === 'self_reported') {
      effectiveVerificationLevel = 'show_mode_live';
    }

    // Determine event status (before/during/after show)
    const attendanceService = strapi.service('api::fan-show-attendance.fan-show-attendance');
    const eventStatus = attendanceService.determineEventStatus(
      event,
      band.showModeEnabled,
      now,
      band.showModeTimezone || timezone || null
    );

    // Find or create fan (case-insensitive; unique-conflict refetches the canonical row)
    let fan = await findFanByBandEmail(strapi, bandId, normalizedEmail);
    let isNewFan = false;
    if (!fan) {
      const created = await createFanIdempotent(strapi, {
        bandId,
        data: {
          email: normalizedEmail,
          band: bandId,
          status: 'subscribed',
          source: 'show_mode',
          subscribedAt: nowISO,
          firstSeenAt: nowISO,
          lastSeenAt: nowISO,
          capturedDuringShowMode: band.showModeEnabled || false,
          capturedAtEventId: effectiveEventId,
          captureContext: 'show_mode',
          captureSurface: surface,
          captureCampaignId: effectiveCampaignId,
          city: effectiveCity,
          region: region || null,
          country: country || null,
          timezone: timezone || null,
          checkedInShowCount: 1,
          lastCheckedInAt: nowISO,
        },
      });
      fan = created.fan;
      isNewFan = created.created;
      if (isNewFan) {
        strapi.log.info('[CheckIn V2] Created new fan via check-in', {
          fanId: fan.id,
          emailHash: hashEmailKey(normalizedEmail),
          bandId,
        });
        try {
          const { produceFanJoined } = require('../../../utils/relationshipEvents/relationshipEventProducers');
          await produceFanJoined(strapi, fan);
        } catch (err) {
          strapi.log.warn(`[RelationshipEvent] fan_joined skipped: ${err.message}`);
        }
      }
    }

    // Anonymous visitor recognition (opaque token → hashed fan-visitor). Never auth.
    if (visitorToken && fan?.id) {
      try {
        const fanIdentity = require('../../../utils/fanIdentity');
        await fanIdentity.attachVisitorToFan({ visitorToken, fanId: fan.id });
      } catch (linkErr) {
        strapi.log.warn('[CheckIn V2] visitor link failed', linkErr);
      }
    }

    // Check for duplicate attendance using improved logic
    const duplicateCheck = await attendanceService.checkForDuplicate({
      fanId: fan.id,
      bandId,
      campaignId: effectiveCampaignId,
      eventId: effectiveEventId,
    });

    if (duplicateCheck.exists) {
      const existingAttendance = duplicateCheck.attendance;
      strapi.log.info('[CheckIn V2] Duplicate check-in detected', { 
        fanId: fan.id, 
        reason: duplicateCheck.reason,
        existingAttendanceId: existingAttendance.id,
      });

      return {
        success: true,
        alreadyCheckedIn: true,
        fanId: fan.id,
        attendanceId: existingAttendance.id,
        message: "You're already checked in for tonight!",
        duplicateReason: duplicateCheck.reason,
        showTitle: effectiveShowTitle,
        venue: effectiveVenue,
        city: effectiveCity,
        checkedInAt: existingAttendance.checkedInAt,
      };
    }

    // Calculate confidence score
    const confidenceScore = attendanceService.calculateConfidenceScore({
      showModeEnabled: band.showModeEnabled,
      eventStatus,
      hasEvent: !!effectiveEventId,
      hasCampaign: !!effectiveCampaignId,
      hasVenue: !!effectiveVenue,
      hasCity: !!effectiveCity,
      isNewFan,
      verificationLevel: effectiveVerificationLevel,
    });

    // Generate timeline label
    const timelineLabel = attendanceService.generateTimelineLabel({
      venue: effectiveVenue,
      city: effectiveCity,
      showTitle: effectiveShowTitle,
      showDate,
    });

    // Create the check-in interaction
    const interaction = await strapi.entityService.create('api::fan-interaction.fan-interaction', {
      data: {
        band: bandId,
        fan: fan.id,
        eventId: effectiveEventId,
        interactionType: 'checked_in_show',
        interactionContext: band.showModeEnabled ? 'show_mode' : 'normal',
        surface,
        campaignId: effectiveCampaignId,
        timestamp: nowISO,
        city: effectiveCity,
        region: region || null,
        country: country || null,
        timezone: timezone || null,
        metadata: {
          ...metadata,
          showTitle: effectiveShowTitle,
          venue: effectiveVenue,
          checkInSource,
          verificationLevel: effectiveVerificationLevel,
          eventStatus,
          confidenceScore,
          isNewFan,
          showModeSessionId: effectiveSessionId,
          timelineLabel,
        },
      },
    });

    // Create the attendance record. Unique conflict (double-tap / retry) refetches.
    const attendanceResult = await createAttendanceIdempotent(strapi, {
      fan: fan.id,
      band: bandId,
      event: effectiveEventId || null,
      campaignId: effectiveCampaignId,
      checkedInAt: nowISO,
      venue: effectiveVenue,
      city: effectiveCity,
      region: region || null,
      country: country || null,
      timezone: timezone || null,
      showTitle: effectiveShowTitle,
      showDate: showDate || null,
      verificationLevel: effectiveVerificationLevel,
      checkInSource,
      eventStatus,
      showModeSessionId: effectiveSessionId,
      confidenceScore,
      isNewFanAtCheckIn: isNewFan,
      fanInteraction: interaction.id,
      suppressedDuplicate: false,
      badgeEligible: confidenceScore >= 50,
      timelineLabel,
      metadata: {
        bandName: band.name,
        checkInMethod: metadata.checkInMethod || 'band_page_button',
        userAgent: metadata.userAgent || null,
      },
    });
    const attendance = attendanceResult.attendance;

    if (!attendanceResult.created) {
      strapi.log.info('[CheckIn V2] Duplicate check-in detected', {
        fanId: fan.id,
        reason: 'unique_conflict',
        existingAttendanceId: attendance.id,
      });
      try {
        const { produceShowAttendance } = require('../../../utils/relationshipEvents/relationshipEventProducers');
        await produceShowAttendance(strapi, attendance);
      } catch (err) {
        strapi.log.warn(`[RelationshipEvent] show attendance events skipped: ${err.message}`);
      }
      return {
        success: true,
        alreadyCheckedIn: true,
        fanId: fan.id,
        attendanceId: attendance.id,
        message: "You're already checked in for tonight!",
        duplicateReason: 'unique_conflict',
        showTitle: effectiveShowTitle,
        venue: effectiveVenue,
        city: effectiveCity,
        checkedInAt: attendance.checkedInAt,
      };
    }

    if (shouldIncrementCheckedInShowCount(attendanceResult.created, isNewFan)) {
      await strapi.entityService.update('api::fan.fan', fan.id, {
        data: {
          lastSeenAt: nowISO,
          lastCheckedInAt: nowISO,
          checkedInShowCount: (fan.checkedInShowCount || 0) + 1,
        },
      });
    }

    strapi.log.info('[CheckIn V2] Show check-in recorded', {
      fanId: fan.id,
      interactionId: interaction.id,
      attendanceId: attendance.id,
      campaignId: effectiveCampaignId,
      verificationLevel: effectiveVerificationLevel,
      eventStatus,
      confidenceScore,
      isNewFan,
    });

    try {
      const { produceShowAttendance } = require('../../../utils/relationshipEvents/relationshipEventProducers');
      await produceShowAttendance(strapi, attendance);
    } catch (err) {
      strapi.log.warn(`[RelationshipEvent] show attendance events skipped: ${err.message}`);
    }

    return {
      success: true,
      fanId: fan.id,
      interactionId: interaction.id,
      attendanceId: attendance.id,
      isNewFan,
      alreadyCheckedIn: false,
      showTitle: effectiveShowTitle,
      venue: effectiveVenue,
      city: effectiveCity,
      verificationLevel: effectiveVerificationLevel,
      eventStatus,
      confidenceScore,
      badgeEligible: confidenceScore >= 50,
      timelineLabel,
      message: isNewFan 
        ? "You're checked in! Welcome to the fan list." 
        : "You're checked in! You're part of tonight's show.",
    };
  },

  // Get session stats (for current or specific campaign)
  async getSessionStats({ bandId, campaignId }) {
    if (!campaignId) return null;

    const interactions = await strapi.entityService.findMany('api::fan-interaction.fan-interaction', {
      filters: { band: bandId, campaignId },
      fields: ['interactionType', 'surface', 'city'],
      populate: { fan: { fields: ['id'] } },
    });

    // Count unique fans
    const uniqueFanIds = new Set();
    const surfaceCounts = {};
    const cityCounts = {};
    const typeCounts = {};

    interactions.forEach(i => {
      if (i.fan?.id) uniqueFanIds.add(i.fan.id);
      
      surfaceCounts[i.surface] = (surfaceCounts[i.surface] || 0) + 1;
      if (i.city) cityCounts[i.city] = (cityCounts[i.city] || 0) + 1;
      typeCounts[i.interactionType] = (typeCounts[i.interactionType] || 0) + 1;
    });

    // Find top surface and city
    let topSurface = null;
    let topSurfaceCount = 0;
    Object.entries(surfaceCounts).forEach(([surface, count]) => {
      if (count > topSurfaceCount) {
        topSurface = surface;
        topSurfaceCount = count;
      }
    });

    let topCity = null;
    let topCityCount = 0;
    Object.entries(cityCounts).forEach(([city, count]) => {
      if (count > topCityCount) {
        topCity = city;
        topCityCount = count;
      }
    });

    return {
      campaignId,
      totalInteractions: interactions.length,
      uniqueFansEngaged: uniqueFanIds.size,
      topSurface,
      topCity,
      surfaceBreakdown: surfaceCounts,
      cityBreakdown: cityCounts,
      interactionTypeBreakdown: typeCounts,
    };
  },
}));
