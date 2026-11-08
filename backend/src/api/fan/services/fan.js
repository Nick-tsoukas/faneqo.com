'use strict';

const crypto = require('crypto');

const { createCoreService } = require('@strapi/strapi').factories;
const { normalizeEmail, findFanByBandEmail, createFanIdempotent } = require('../../../utils/fans/fanEmail');
const { getCanonicalFanShowSummary, getCanonicalFanShowSummaries, overlayFanShowSummary, countCanonicalReturningFans } = require('../../../utils/fans/canonicalShowSummary');
const { countBandMultiCityAttendees } = require('../../../utils/fans/canonicalAttendance');

module.exports = createCoreService('api::fan.fan', ({ strapi }) => ({
  // Canonical identity: trim + lowercase (see utils/fans/fanEmail.js)
  normalizeEmail,

  /**
   * Unsubscribe tokens are minted on demand rather than at capture, so existing
   * fans get one the first time they are actually mailed.
   */
  async ensureUnsubscribeToken(fan) {
    if (fan?.unsubscribeToken) return fan.unsubscribeToken;
    if (!fan?.id) return null;

    const token = crypto.randomBytes(24).toString('hex');
    await strapi.entityService.update('api::fan.fan', fan.id, {
      data: { unsubscribeToken: token },
    });

    return token;
  },

  /**
   * Flip a fan to unsubscribed from a mailed link. Public and unauthenticated —
   * the token is the only credential, so it must be unguessable.
   */
  async unsubscribeByToken(token) {
    if (!token || typeof token !== 'string' || token.length < 24) return null;

    const matches = await strapi.entityService.findMany('api::fan.fan', {
      filters: { unsubscribeToken: token },
      populate: { band: { fields: ['name', 'slug'] } },
      limit: 1,
    });

    const fan = matches[0];
    if (!fan) return null;

    if (fan.status !== 'unsubscribed') {
      const unsubscribedAt = new Date().toISOString();
      await strapi.entityService.update('api::fan.fan', fan.id, {
        data: { status: 'unsubscribed', unsubscribedAt },
      });
      try {
        const { produceFanUnsubscribed } = require('../../../utils/relationshipEvents/relationshipEventProducers');
        await produceFanUnsubscribed(strapi, fan, { occurredAt: unsubscribedAt });
      } catch (err) {
        strapi.log.warn(`[RelationshipEvent] fan_unsubscribed skipped: ${err.message}`);
      }
    }

    return {
      email: fan.email,
      bandName: fan.band?.name || null,
      alreadyUnsubscribed: fan.status === 'unsubscribed',
    };
  },

  /**
   * Stop mailing an address because the mail provider told us to.
   *
   * Applies across every band, deliberately. A hard bounce means the mailbox
   * does not exist for anyone, and a spam complaint means this person does not
   * want mail that carries our sending domain — continuing to send either one
   * damages deliverability for every band on the platform.
   */
  async suppressByEmail({ email, reason }) {
    const normalizedEmail = this.normalizeEmail(email);
    if (!normalizedEmail) return { suppressed: 0 };

    const fans = await strapi.entityService.findMany('api::fan.fan', {
      filters: { email: normalizedEmail },
      fields: ['id', 'status'],
      populate: { band: { fields: ['id'] } },
      limit: 500,
    });

    const now = new Date().toISOString();
    let suppressed = 0;

    for (const fan of fans) {
      if (fan.status === 'unsubscribed') continue;

      await strapi.entityService.update('api::fan.fan', fan.id, {
        data: {
          status: 'unsubscribed',
          unsubscribedAt: now,
          suppressionReason: reason,
        },
      });
      try {
        const { produceFanUnsubscribed } = require('../../../utils/relationshipEvents/relationshipEventProducers');
        await produceFanUnsubscribed(strapi, fan, { occurredAt: now, reason });
      } catch (err) {
        strapi.log.warn(`[RelationshipEvent] fan_unsubscribed skipped: ${err.message}`);
      }

      suppressed++;
    }

    return { suppressed, matched: fans.length };
  },

  /** Undo an unsubscribe, for the "that was a mistake" link on the same page. */
  async resubscribeByToken(token) {
    if (!token || typeof token !== 'string' || token.length < 24) return null;

    const matches = await strapi.entityService.findMany('api::fan.fan', {
      filters: { unsubscribeToken: token },
      populate: { band: { fields: ['name'] } },
      limit: 1,
    });

    const fan = matches[0];
    if (!fan) return null;

    await strapi.entityService.update('api::fan.fan', fan.id, {
      data: { status: 'subscribed', unsubscribedAt: null, suppressionReason: null },
    });

    return { email: fan.email, bandName: fan.band?.name || null };
  },

  // Validate email format
  isValidEmail(email) {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Check if fan already exists for this band
  async findExistingFan(email, bandId) {
    return findFanByBandEmail(strapi, bandId, email);
  },

  // Create a new fan with deduplication and rich capture context
  async createFan({ 
    email, 
    firstName,
    source, 
    bandId, 
    notes, 
    metadata,
    captureContext,
    capturedDuringShowMode,
    capturedAtEventId,
    captureCampaignId,
    captureSurface,
    sourceDetail,
    city,
    region,
    country,
    timezone,
    firstSeenAt,
    lastSeenAt,
  }) {
    const normalizedEmail = this.normalizeEmail(email);
    
    if (!normalizedEmail || !this.isValidEmail(normalizedEmail)) {
      return { success: false, reason: 'invalid_email' };
    }

    // Check for existing fan
    const existing = await this.findExistingFan(normalizedEmail, bandId);
    if (existing) {
      // Soft-removed or unsubscribed list entry can rejoin without a new row.
      if (existing.status === 'removed' || existing.status === 'unsubscribed') {
        const restored = await strapi.entityService.update('api::fan.fan', existing.id, {
          data: {
            status: 'subscribed',
            subscribedAt: new Date().toISOString(),
            firstName: firstName || existing.firstName || null,
            source: source || existing.source || 'other',
          },
        });
        return { success: true, fan: restored, fanId: restored.id, restored: true };
      }
      return { success: false, reason: 'duplicate', existing, fanId: existing.id };
    }

    // Identity (email + band) is not mutated after create. Restore/remove/claim
    // change status or accountUser only. Integrity keys are set on insert.
    const now = new Date();
    const data = {
      email: normalizedEmail,
      firstName: firstName || null,
      source: source || 'other',
      status: 'subscribed',
      subscribedAt: now.toISOString(),
      band: bandId,
      notes: notes || null,
      metadata: metadata || null,
      captureContext: captureContext || 'normal',
      capturedDuringShowMode: capturedDuringShowMode || false,
      capturedAtEventId: capturedAtEventId || null,
      captureCampaignId: captureCampaignId || null,
      captureSurface: captureSurface || 'unknown',
      sourceDetail: sourceDetail || null,
      city: city || null,
      region: region || null,
      country: country || null,
      timezone: timezone || null,
      firstSeenAt: firstSeenAt ? firstSeenAt.toISOString() : now.toISOString(),
      lastSeenAt: lastSeenAt ? lastSeenAt.toISOString() : now.toISOString(),
    };

    const result = await createFanIdempotent(strapi, { bandId, data });
    if (!result.created) {
      return { success: false, reason: 'duplicate', existing: result.fan, fanId: result.fan.id };
    }
    const fan = result.fan;

    try {
      const { produceFanJoined } = require('../../../utils/relationshipEvents/relationshipEventProducers');
      await produceFanJoined(strapi, { ...fan, band: fan.band || bandId });
    } catch (err) {
      strapi.log.warn(`[RelationshipEvent] fan_joined skipped: ${err.message}`);
    }

    return { success: true, fan, fanId: fan.id };
  },

  // Import multiple fans
  async importFans({ fans, bandId, importBatchId }) {
    const results = {
      totalRows: fans.length,
      imported: 0,
      duplicates: 0,
      invalid: 0,
      details: [],
    };

    const batchId = importBatchId || `import_${Date.now()}`;

    for (const fanData of fans) {
      const email = this.normalizeEmail(fanData.email);

      if (!email || !this.isValidEmail(email)) {
        results.invalid++;
        results.details.push({ email: fanData.email, status: 'invalid' });
        continue;
      }

      const existing = await this.findExistingFan(email, bandId);
      if (existing) {
        // Re-import can restore a soft-removed Fan List entry for this band.
        if (existing.status === 'removed') {
          await strapi.entityService.update('api::fan.fan', existing.id, {
            data: {
              status: 'subscribed',
              source: 'import',
              subscribedAt: new Date().toISOString(),
              importBatchId: batchId,
              notes: fanData.notes || existing.notes || null,
            },
          });
          results.imported++;
          results.details.push({ email, status: 'restored' });
          continue;
        }
        results.duplicates++;
        results.details.push({ email, status: 'duplicate' });
        continue;
      }

      const result = await createFanIdempotent(strapi, {
        bandId,
        data: {
          email,
          source: 'import',
          status: 'subscribed',
          subscribedAt: new Date().toISOString(),
          band: bandId,
          importBatchId: batchId,
          notes: fanData.notes || null,
          metadata: fanData.metadata || null,
        },
      });
      if (!result.created) {
        results.duplicates++;
        results.details.push({ email, status: 'duplicate' });
        continue;
      }
      const created = result.fan;
      try {
        const { produceFanJoined } = require('../../../utils/relationshipEvents/relationshipEventProducers');
        await produceFanJoined(strapi, { ...created, band: created.band || bandId });
      } catch (err) {
        strapi.log.warn(`[RelationshipEvent] fan_joined skipped: ${err.message}`);
      }

      results.imported++;
      results.details.push({ email, status: 'imported' });
    }

    return results;
  },

  // Get fans for a band with pagination, sorting, filtering (V3 enhanced)
  async getMyFans({ 
    bandId, 
    page = 1, 
    pageSize = 25, 
    sortField = 'subscribedAt', 
    sortOrder = 'desc', 
    search,
    // V3 filters
    source,
    status,
    captureContext,
    captureSurface,
    city,
    region,
    country,
    capturedDuringShowMode,
    capturedAtEventId,
    captureCampaignId,
    engagementTier,
    dateJoinedFrom,
    dateJoinedTo,
    // Viewer, so a fan who is also this artist is not offered as a DM target.
    viewerUserId = null,
  }) {
    const filters = { band: bandId };

    // Basic filters
    if (source) filters.source = source;
    // Default active list: never show band-removed fans.
    // Explicit status=removed is allowed later for an archive view.
    if (status) {
      filters.status = status;
    } else {
      filters.status = { $ne: 'removed' };
    }
    if (search) {
      filters.$or = [
        { email: { $containsi: search } },
        { firstName: { $containsi: search } },
      ];
    }

    // V3 filters
    if (captureContext) filters.captureContext = captureContext;
    if (captureSurface) filters.captureSurface = captureSurface;
    if (city) filters.city = { $containsi: city };
    if (region) filters.region = { $containsi: region };
    if (country) filters.country = country;
    if (capturedDuringShowMode !== undefined) filters.capturedDuringShowMode = capturedDuringShowMode;
    if (capturedAtEventId) filters.capturedAtEventId = capturedAtEventId;
    if (captureCampaignId) filters.captureCampaignId = captureCampaignId;

    // Date range filters
    if (dateJoinedFrom || dateJoinedTo) {
      filters.subscribedAt = {};
      if (dateJoinedFrom) filters.subscribedAt.$gte = dateJoinedFrom;
      if (dateJoinedTo) filters.subscribedAt.$lte = dateJoinedTo;
    }

    // Build sort - handle special cases
    const sort = {};
    const validSortFields = ['subscribedAt', 'email', 'source', 'city', 'lastSeenAt', 'firstName'];
    if (validSortFields.includes(sortField)) {
      sort[sortField] = sortOrder;
    } else {
      sort.subscribedAt = 'desc';
    }

    const [fans, count] = await Promise.all([
      strapi.entityService.findMany('api::fan.fan', {
        filters,
        sort,
        start: (page - 1) * pageSize,
        limit: pageSize,
        populate: { accountUser: { fields: ['id'] } },
      }),
      strapi.entityService.count('api::fan.fan', { filters }),
    ]);

    // Get engagement scores for these fans
    const fanIds = fans.map(f => f.id);
    let engagementScores = {};
    if (fanIds.length > 0) {
      engagementScores = await strapi.service('api::fan-interaction.fan-interaction').calculateBatchEngagementScores(fanIds);
    }

    const { fanMessagingEligibility } = require('../../../utils/inbox/inboxPure');
    const summaries = await getCanonicalFanShowSummaries(strapi, { fanIds });

    // Enrich fans with engagement data — strip accountUser, expose safe flags only
    const enrichedFans = fans.map((fan) => {
      const { accountUser, ...rest } = fan;
      const flags = fanMessagingEligibility({ ...fan, accountUser });
      const withShows = overlayFanShowSummary(rest, summaries[fan.id] || summaries[String(fan.id)]);
      // conversations/start rejects a self-DM, so offering the action here
      // would be a button that can only ever fail. Matches dm-candidates.
      const isSelf =
        viewerUserId != null &&
        accountUser != null &&
        Number(accountUser?.id ?? accountUser) === Number(viewerUserId);
      return {
        ...withShows,
        engagementScore: engagementScores[fan.id]?.score || 0,
        engagementTier: engagementScores[fan.id]?.tier || 'new',
        interactionCount: engagementScores[fan.id]?.interactionCount || 0,
        isFaneqoMember: flags.isFaneqoMember,
        canDirectMessage: flags.canDirectMessage && !isSelf,
      };
    });

    // Filter by engagement tier if specified (post-query filter)
    let filteredFans = enrichedFans;
    if (engagementTier) {
      filteredFans = enrichedFans.filter(f => f.engagementTier === engagementTier);
    }

    // Sort by engagement score if requested (post-query sort)
    if (sortField === 'engagementScore') {
      filteredFans.sort((a, b) => {
        return sortOrder === 'desc' 
          ? b.engagementScore - a.engagementScore 
          : a.engagementScore - b.engagementScore;
      });
    }

    return {
      data: filteredFans,
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

  // Get detailed fan profile with interaction history (V3)
  async getFanDetail({ bandId, fanId, viewerUserId = null }) {
    // Get fan with all fields
    const fan = await strapi.entityService.findOne('api::fan.fan', fanId, {
      populate: {
        band: { fields: ['id', 'name', 'slug'] },
        accountUser: { fields: ['id'] },
      },
    });

    if (!fan || fan.band?.id !== bandId) {
      return null;
    }

    // Get engagement score
    const engagement = await strapi.service('api::fan-interaction.fan-interaction').calculateFanEngagementScore(fanId);

    // Get interaction history
    const interactionHistory = await strapi.service('api::fan-interaction.fan-interaction').getFanInteractionHistory({
      fanId,
      limit: 50,
    });

    // Calculate top actions
    const actionCounts = {};
    interactionHistory.forEach(i => {
      actionCounts[i.interactionType] = (actionCounts[i.interactionType] || 0) + 1;
    });
    const topActions = Object.entries(actionCounts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Get unique events from interactions
    const eventIds = [...new Set(interactionHistory.filter(i => i.eventId).map(i => i.eventId))];

    // Get attendance stats (V2)
    let attendanceStats = null;
    try {
      attendanceStats = await strapi.service('api::fan-show-attendance.fan-show-attendance').getFanAttendanceStats(fanId);
    } catch (e) {
      strapi.log.warn('Failed to get attendance stats:', e.message);
    }

    const { fanMessagingEligibility } = require('../../../utils/inbox/inboxPure');
    const memberFlags = fanMessagingEligibility({
      accountUser: fan.accountUser?.id || fan.accountUser,
      status: fan.status,
    });
    const showSummary = await getCanonicalFanShowSummary(strapi, { bandId, fanId });

    return {
      // Core fan data
      id: fan.id,
      email: fan.email,
      firstName: fan.firstName,
      status: fan.status,
      source: fan.source,
      subscribedAt: fan.subscribedAt,
      isFaneqoMember: memberFlags.isFaneqoMember,
      // Same self-DM exclusion as the list, so the detail panel agrees with it.
      canDirectMessage:
        memberFlags.canDirectMessage &&
        !(
          viewerUserId != null &&
          fan.accountUser?.id != null &&
          Number(fan.accountUser.id) === Number(viewerUserId)
        ),
      
      // Location
      city: fan.city,
      region: fan.region,
      country: fan.country,
      timezone: fan.timezone,
      
      // Capture context
      captureContext: fan.captureContext,
      captureSurface: fan.captureSurface,
      capturedDuringShowMode: fan.capturedDuringShowMode,
      capturedAtEventId: fan.capturedAtEventId,
      captureCampaignId: fan.captureCampaignId,
      sourceDetail: fan.sourceDetail,
      
      // Timestamps
      firstSeenAt: fan.firstSeenAt,
      lastSeenAt: fan.lastSeenAt,
      lastCheckedInAt: fan.lastCheckedInAt,
      
      // Engagement
      engagementScore: engagement.score,
      engagementTier: engagement.tier,
      interactionCount: engagement.interactionCount,
      
      // Attendance Intelligence — showCount is canonical unsuppressed attendance
      checkedInShowCount: showSummary.showCount,
      showCount: showSummary.showCount,
      firstShowAt: showSummary.firstShowAt,
      latestShowAt: showSummary.latestShowAt,
      returning: showSummary.returning,
      attendedCities: attendanceStats?.cities || [],
      isMultiCityFan: attendanceStats?.isMultiCityFan || false,
      isRepeatAttendee: showSummary.returning,
      verifiedAttendances: attendanceStats?.verifiedAttendances || 0,
      
      // History
      interactionHistory,
      topActions,
      eventIds,
      
      // Metadata
      notes: fan.notes,
      metadata: fan.metadata,
    };
  },

  // Get fan analytics for a band
  async getMyFansAnalytics({ bandId }) {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Total fans
    const totalFans = await strapi.entityService.count('api::fan.fan', {
      filters: { band: bandId, status: 'subscribed' },
    });

    // New fans in last 7 days
    const newFans7d = await strapi.entityService.count('api::fan.fan', {
      filters: {
        band: bandId,
        status: 'subscribed',
        subscribedAt: { $gte: sevenDaysAgo.toISOString() },
      },
    });

    // New fans in last 30 days
    const newFans30d = await strapi.entityService.count('api::fan.fan', {
      filters: {
        band: bandId,
        status: 'subscribed',
        subscribedAt: { $gte: thirtyDaysAgo.toISOString() },
      },
    });

    // Source breakdown
    const allFans = await strapi.entityService.findMany('api::fan.fan', {
      filters: { band: bandId, status: 'subscribed' },
      fields: ['source', 'subscribedAt'],
    });

    const sourceBreakdown = {};
    const sources = ['band_page', 'follow_modal', 'import', 'manual', 'show_mode', 'other'];
    sources.forEach(s => { sourceBreakdown[s] = 0; });

    allFans.forEach(fan => {
      if (sourceBreakdown[fan.source] !== undefined) {
        sourceBreakdown[fan.source]++;
      }
    });

    // Find top source
    let topSource = 'none';
    let topSourceCount = 0;
    for (const [source, count] of Object.entries(sourceBreakdown)) {
      if (count > topSourceCount) {
        topSource = source;
        topSourceCount = count;
      }
    }

    // Growth series (last 30 days, grouped by day)
    const growthSeries = [];
    for (let i = 29; i >= 0; i--) {
      const dayStart = new Date(now);
      dayStart.setDate(dayStart.getDate() - i);
      dayStart.setHours(0, 0, 0, 0);
      
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      const count = allFans.filter(fan => {
        const subDate = new Date(fan.subscribedAt);
        return subDate >= dayStart && subDate <= dayEnd;
      }).length;

      growthSeries.push({
        date: dayStart.toISOString().split('T')[0],
        count,
      });
    }

    // Show mode specific metrics
    const fansCapturedDuringShows = await strapi.entityService.count('api::fan.fan', {
      filters: { band: bandId, status: 'subscribed', source: 'show_mode' },
    });

    const fansCapturedDuringShowsLast30Days = await strapi.entityService.count('api::fan.fan', {
      filters: {
        band: bandId,
        status: 'subscribed',
        source: 'show_mode',
        subscribedAt: { $gte: thirtyDaysAgo.toISOString() },
      },
    });

    // V2 Analytics: Capture surface breakdown
    const allFansWithContext = await strapi.entityService.findMany('api::fan.fan', {
      filters: { band: bandId, status: 'subscribed' },
      fields: ['captureSurface', 'capturedDuringShowMode', 'city', 'captureCampaignId', 'capturedAtEventId'],
    });

    const captureSurfaceBreakdown = {};
    const surfaces = ['band_page', 'follow_modal', 'qr_poster', 'qr_merch_table', 'qr_stage_screen', 'qr_flyer', 'event_page', 'direct_link', 'unknown'];
    surfaces.forEach(s => { captureSurfaceBreakdown[s] = 0; });

    allFansWithContext.forEach(fan => {
      const surface = fan.captureSurface || 'unknown';
      if (captureSurfaceBreakdown[surface] !== undefined) {
        captureSurfaceBreakdown[surface]++;
      }
    });

    // Show mode source breakdown (for fans captured during shows)
    const showModeFans = allFansWithContext.filter(f => f.capturedDuringShowMode);
    const showModeSourceBreakdown = {};
    surfaces.forEach(s => { showModeSourceBreakdown[s] = 0; });
    showModeFans.forEach(fan => {
      const surface = fan.captureSurface || 'unknown';
      if (showModeSourceBreakdown[surface] !== undefined) {
        showModeSourceBreakdown[surface]++;
      }
    });

    // Top show capture city
    const cityCount = {};
    showModeFans.forEach(fan => {
      if (fan.city) {
        cityCount[fan.city] = (cityCount[fan.city] || 0) + 1;
      }
    });
    let topShowCaptureCity = null;
    let topCityCount = 0;
    for (const [city, count] of Object.entries(cityCount)) {
      if (count > topCityCount) {
        topShowCaptureCity = city;
        topCityCount = count;
      }
    }

    // Fans with/without location
    const fansWithLocationCount = allFansWithContext.filter(f => f.city).length;
    const fansMissingLocationCount = allFansWithContext.length - fansWithLocationCount;

    // Show capture series (last 30 days, show mode fans only)
    const showModeFansAll = await strapi.entityService.findMany('api::fan.fan', {
      filters: { band: bandId, status: 'subscribed', capturedDuringShowMode: true },
      fields: ['subscribedAt'],
    });

    const showCaptureSeries = [];
    for (let i = 29; i >= 0; i--) {
      const dayStart = new Date(now);
      dayStart.setDate(dayStart.getDate() - i);
      dayStart.setHours(0, 0, 0, 0);
      
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      const count = showModeFansAll.filter(fan => {
        const subDate = new Date(fan.subscribedAt);
        return subDate >= dayStart && subDate <= dayEnd;
      }).length;

      showCaptureSeries.push({
        date: dayStart.toISOString().split('T')[0],
        count,
      });
    }

    // Top events by fan capture
    const eventCaptures = {};
    allFansWithContext.forEach(fan => {
      if (fan.capturedAtEventId) {
        eventCaptures[fan.capturedAtEventId] = (eventCaptures[fan.capturedAtEventId] || 0) + 1;
      }
    });
    const topEventsByFanCapture = Object.entries(eventCaptures)
      .map(([eventId, count]) => ({ eventId: parseInt(eventId), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // V3 Analytics: Engagement tier breakdown
    const allFansForEngagement = await strapi.entityService.findMany('api::fan.fan', {
      filters: { band: bandId, status: 'subscribed' },
      fields: ['id', 'firstSeenAt', 'lastSeenAt'],
    });

    const fanIds = allFansForEngagement.map(f => f.id);
    let engagementScores = {};
    if (fanIds.length > 0) {
      engagementScores = await strapi.service('api::fan-interaction.fan-interaction').calculateBatchEngagementScores(fanIds);
    }

    const engagementTierBreakdown = { new: 0, warm: 0, engaged: 0, superfan_signal: 0 };
    let totalEngagementScore = 0;
    const fansWithScores = [];

    allFansForEngagement.forEach(fan => {
      const score = engagementScores[fan.id]?.score || 0;
      const tier = engagementScores[fan.id]?.tier || 'new';
      engagementTierBreakdown[tier]++;
      totalEngagementScore += score;
      fansWithScores.push({ id: fan.id, score, tier });
    });

    const averageEngagementScore = totalFans > 0 ? Math.round(totalEngagementScore / totalFans) : 0;

    // Most engaged fans (top 10)
    const mostEngagedFanIds = fansWithScores
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(f => f.id);

    let mostEngagedFans = [];
    if (mostEngagedFanIds.length > 0) {
      const topFansData = await strapi.entityService.findMany('api::fan.fan', {
        filters: { id: { $in: mostEngagedFanIds } },
        fields: ['id', 'email', 'firstName', 'city', 'subscribedAt', 'lastSeenAt'],
      });
      mostEngagedFans = topFansData.map(fan => ({
        ...fan,
        engagementScore: engagementScores[fan.id]?.score || 0,
        engagementTier: engagementScores[fan.id]?.tier || 'new',
      })).sort((a, b) => b.engagementScore - a.engagementScore);
    }

    // Repeat fans (fans with multiple interactions or separated first/last seen)
    let repeatFanCount = 0;
    allFansForEngagement.forEach(fan => {
      const interactionCount = engagementScores[fan.id]?.interactionCount || 0;
      if (interactionCount > 1) {
        repeatFanCount++;
      } else if (fan.firstSeenAt && fan.lastSeenAt) {
        const first = new Date(fan.firstSeenAt);
        const last = new Date(fan.lastSeenAt);
        const daysDiff = (last - first) / (1000 * 60 * 60 * 24);
        if (daysDiff > 1) repeatFanCount++;
      }
    });

    // Top cities by fan count
    const allCityCounts = {};
    allFansWithContext.forEach(fan => {
      if (fan.city) {
        allCityCounts[fan.city] = (allCityCounts[fan.city] || 0) + 1;
      }
    });
    const topCitiesByFanCount = Object.entries(allCityCounts)
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Top cities by engaged fans (warm+ tier)
    const engagedFanIds = fansWithScores.filter(f => f.tier !== 'new').map(f => f.id);
    const engagedFansWithCity = allFansWithContext.filter(f => engagedFanIds.includes(f.id) && f.city);
    const engagedCityCounts = {};
    engagedFansWithCity.forEach(fan => {
      engagedCityCounts[fan.city] = (engagedCityCounts[fan.city] || 0) + 1;
    });
    const topCitiesByEngagedFans = Object.entries(engagedCityCounts)
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Top capture campaigns
    const campaignCounts = {};
    allFansWithContext.forEach(fan => {
      if (fan.captureCampaignId) {
        campaignCounts[fan.captureCampaignId] = (campaignCounts[fan.captureCampaignId] || 0) + 1;
      }
    });
    const topCaptureCampaigns = Object.entries(campaignCounts)
      .map(([campaignId, count]) => ({ campaignId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Current session info (if show mode active)
    const band = await strapi.entityService.findOne('api::band.band', bandId, {
      fields: ['showModeEnabled', 'showModeCampaignId', 'showModeEventId', 'showModeTitle', 'showModeVenue', 'showModeCity', 'showModeStartedAt'],
    });

    let currentSession = null;
    if (band?.showModeEnabled && band?.showModeCampaignId) {
      const sessionFans = await strapi.entityService.count('api::fan.fan', {
        filters: { band: bandId, captureCampaignId: band.showModeCampaignId },
      });

      const sessionStats = await strapi.service('api::fan-interaction.fan-interaction').getSessionStats({
        bandId,
        campaignId: band.showModeCampaignId,
      });

      currentSession = {
        isLive: true,
        campaignId: band.showModeCampaignId,
        eventId: band.showModeEventId,
        title: band.showModeTitle,
        venue: band.showModeVenue,
        city: band.showModeCity,
        startedAt: band.showModeStartedAt,
        autoOffAt: null,
        fansCaptured: sessionFans,
        topSurface: sessionStats?.topSurface || null,
        topCity: sessionStats?.topCity || null,
      };
    }

    // Recent show recap (from ShowRecap content type)
    let recentShowRecap = null;
    try {
      const recap = await strapi.service('api::show-recap.show-recap').getRecentShowRecap({ bandId });
      if (recap) {
        recentShowRecap = {
          recapId: recap.id,
          campaignId: recap.campaignId,
          showTitle: recap.showTitle,
          venue: recap.venue,
          city: recap.city,
          recapGeneratedAt: recap.recapGeneratedAt,
          fansCaptured: recap.fansCaptured,
          topCaptureSurface: recap.topCaptureSurface,
          topCity: recap.topCity,
          spotifyClicks: recap.spotifyClicks,
          merchClicks: recap.merchClicks,
          shareClicks: recap.shareClicks,
          averageEngagementScore: recap.averageEngagementScore,
          superfanSignalCount: recap.superfanSignalCount,
          interactionCount: recap.interactionCount,
        };
      }
    } catch (e) {
      strapi.log.warn('Failed to fetch recent show recap:', e.message);
    }

    // Interaction type breakdown
    const interactionTypeBreakdown = await strapi.service('api::fan-interaction.fan-interaction').getInteractionTypeBreakdown({ bandId });

    // Recent interaction feed
    const recentInteractionFeed = await strapi.service('api::fan-interaction.fan-interaction').getRecentInteractions({ bandId, limit: 20 });

    // Check-in metrics (V2 - using attendance records)
    const attendanceService = strapi.service('api::fan-show-attendance.fan-show-attendance');
    const attendanceAnalytics = await attendanceService.getBandAttendanceAnalytics(bandId);

    // Legacy fan-based check-in counts (for backward compatibility)
    const allFansWithCheckIns = await strapi.entityService.findMany('api::fan.fan', {
      filters: { 
        band: bandId, 
        status: 'subscribed',
        checkedInShowCount: { $gt: 0 },
      },
      fields: ['id', 'city', 'checkedInShowCount', 'lastCheckedInAt', 'capturedAtEventId'],
    });

    const checkedInFanCount = attendanceAnalytics.uniqueAttendees || allFansWithCheckIns.length;

    // Check-ins in last 30 days
    const attendanceLast30Days = await attendanceService.getBandAttendanceAnalytics(bandId, {
      startDate: thirtyDaysAgo.toISOString(),
    });
    const checkedInFanCountLast30Days = attendanceLast30Days.uniqueAttendees || 0;

    // Top checked-in cities (from attendance records)
    const topCheckedInCities = attendanceAnalytics.topCities || [];

    // Top venues by check-ins
    const topVenuesByCheckIns = attendanceAnalytics.topVenues || [];

    // Top events by check-ins (legacy)
    const checkInEventCounts = {};
    allFansWithCheckIns.forEach(fan => {
      if (fan.capturedAtEventId) {
        checkInEventCounts[fan.capturedAtEventId] = (checkInEventCounts[fan.capturedAtEventId] || 0) + 1;
      }
    });
    const topEventsByCheckIns = Object.entries(checkInEventCounts)
      .map(([eventId, count]) => ({ eventId: parseInt(eventId), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Repeat show attendees = subscribed fans with canonical showCount >= 2
    const repeatShowAttendees = await countCanonicalReturningFans(strapi, {
      bandId,
      subscribedOnly: true,
    });

    // Multi-city attendees: distinct non-empty cities on canonical attendance.
    const multiCityAttendeeCount = await countBandMultiCityAttendees(strapi, { bandId });

    // Check-in rate (% of show mode fans who checked in)
    const checkInRate = fansCapturedDuringShows > 0 
      ? Math.round((checkedInFanCount / fansCapturedDuringShows) * 100) 
      : 0;

    // New vs known fan check-in split
    const newFanCheckIns = attendanceAnalytics.newFanAttendees || 0;
    const knownFanCheckIns = attendanceAnalytics.knownFanAttendees || 0;

    // Average confidence score
    const averageCheckInConfidence = attendanceAnalytics.averageConfidenceScore || 0;

    // Check-ins by source
    const checkInsBySurface = attendanceAnalytics.checkInsBySurface || [];

    // Check-ins by verification level
    const checkInsByVerification = attendanceAnalytics.checkInsByVerification || [];

    return {
      totalFans,
      newFans7d,
      newFans30d,
      topSource: topSourceCount > 0 ? topSource : null,
      sourceBreakdown,
      growthSeries,
      fansCapturedDuringShows,
      fansCapturedDuringShowsLast30Days,
      // V2 metrics
      captureSurfaceBreakdown,
      showModeSourceBreakdown,
      topShowCaptureCity,
      showCaptureSeries,
      topEventsByFanCapture,
      fansWithLocationCount,
      fansMissingLocationCount,
      // V3 metrics
      engagementTierBreakdown,
      averageEngagementScore,
      mostEngagedFans,
      repeatFanCount,
      topCitiesByFanCount,
      topCitiesByEngagedFans,
      topCaptureCampaigns,
      currentSession,
      recentShowRecap,
      interactionTypeBreakdown,
      recentInteractionFeed,
      // Check-in metrics (V2)
      checkedInFanCount,
      checkedInFanCountLast30Days,
      topCheckedInCities,
      topVenuesByCheckIns,
      topEventsByCheckIns,
      repeatShowAttendees,
      multiCityAttendeeCount,
      checkInRate,
      newFanCheckIns,
      knownFanCheckIns,
      averageCheckInConfidence,
      checkInsBySurface,
      checkInsByVerification,
      totalCheckIns: attendanceAnalytics.totalCheckIns || 0,
    };
  },

  // Export fans for a band
  async exportFans({ bandId }) {
    const fans = await strapi.entityService.findMany('api::fan.fan', {
      filters: { band: bandId, status: { $ne: 'removed' } },
      sort: { subscribedAt: 'desc' },
    });

    return fans.map(fan => ({
      email: fan.email,
      source: fan.source,
      status: fan.status,
      subscribedAt: fan.subscribedAt,
    }));
  },

  /**
   * Soft-remove a fan from THIS band's active Fan List.
   * Does not hard-delete, globally suppress, or affect other bands.
   * Historical attendance / campaign recipient rows remain intact.
   */
  async removeFromFanList({ bandId, fanId }) {
    const fan = await strapi.entityService.findOne('api::fan.fan', fanId, {
      populate: { band: { fields: ['id'] } },
    });

    if (!fan) return { error: 'not_found', message: 'Fan not found.' };

    const fanBandId = fan.band?.id || fan.band;
    if (String(fanBandId) !== String(bandId)) {
      return { error: 'forbidden', message: 'This fan belongs to another band.' };
    }

    if (fan.status === 'removed') {
      return { ok: true, alreadyRemoved: true, fanId: fan.id };
    }

    await strapi.entityService.update('api::fan.fan', fan.id, {
      data: { status: 'removed' },
    });

    return { ok: true, alreadyRemoved: false, fanId: fan.id };
  },
}));
