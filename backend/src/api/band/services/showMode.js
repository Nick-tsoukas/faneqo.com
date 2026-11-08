'use strict';

const { v4: uuidv4 } = require('uuid');
const showTime = require('../../../utils/showTime');
const showCover = require('../../../utils/showMode/showCoverPure');
const eventActivation = require('../../../utils/showMode/eventActivationPure');
const integrity = require('../../../utils/showMode/showModeIntegrityPure');
const nightCover = require('../../../utils/showMode/nightCover');
const nightEnrichment = require('../../../utils/showMode/nightEnrichmentPure');

const LIVE_SESSION_FIELDS = [
  'id', 'name', 'showModeStatus', 'showModeEnabled', 'showModeCampaignId',
  'showModeType', 'showModeStartedAt', 'showModeEndsAt', 'showModeActivatedAt',
  'showModeEventId', 'showModeTitle', 'showModeVenue', 'showModeCity',
  'showModeRegion', 'showModeCountry', 'showModeTimezone',
  'showModePerformanceStartsAt', 'showModePerformanceEndsAt',
  'showModeSourceDetail', 'showModeAutoManaged',
  'showModeScheduledStartAt', 'showModeScheduledEndAt', 'showModeMetadata',
  'showModeLastDeactivationReason',
];

/**
 * Show Mode Service V2
 * Manages show mode activation/deactivation for bands with rich context capture
 */

module.exports = {
  /**
   * Generate a unique campaign ID for show mode sessions
   */
  generateCampaignId() {
    return `sm_${Date.now()}_${uuidv4().slice(0, 8)}`;
  },

  refuseIfLive(band) {
    if (!integrity.showModeAlreadyLive(band)) return null;
    return integrity.alreadyLiveConflict(this.getShowModeStatus(band));
  },

  async persistLiveSession(bandId, data) {
    const query = strapi.db && typeof strapi.db.query === 'function'
      ? strapi.db.query('api::band.band')
      : null;

    if (query && typeof query.update === 'function') {
      try {
        const claimed = await query.update({
          where: integrity.liveClaimWhere(bandId),
          data,
        });
        if (!claimed) {
          const current = await strapi.entityService.findOne('api::band.band', bandId, {
            fields: LIVE_SESSION_FIELDS,
          });
          return this.refuseIfLive(current) || integrity.alreadyLiveConflict(
            current ? this.getShowModeStatus(current) : null
          );
        }
        return { ok: true, method: 'conditional_update' };
      } catch (err) {
        strapi.log.warn('[ShowMode] Conditional live claim failed; using entityService', {
          bandId,
          error: err.message,
        });
      }
    }

    const latest = await strapi.entityService.findOne('api::band.band', bandId, {
      fields: LIVE_SESSION_FIELDS,
    });
    const refuse = this.refuseIfLive(latest);
    if (refuse) return refuse;

    await strapi.entityService.update('api::band.band', bandId, { data });
    return { ok: true, method: 'entity_service' };
  },

  /**
   * Get tomorrow at 6:00 AM in the given timezone.
   * Without a timezone this falls back to the server clock (UTC in production).
   */
  getNextMorning6AM(timezone = null, from = new Date()) {
    return showTime.getNextMorning6AM(timezone, from);
  },

  /**
   * Resolve an event's start instant from its `date` + `time` fields.
   * The Event model has no start/end datetime or timezone of its own, so the
   * band's show-mode timezone is used when available.
   */
  resolveEventStart(event, timezone = null) {
    return showTime.resolveEventStart(event, timezone);
  },

  /**
   * Activate manual show mode for a band
   * @param {number} bandId - The band ID
   * @param {object} payload - Show mode configuration
   */
  async createDurableShowEvent({ band, payload = {}, campaignId, coverMediaId, userId = null }) {
    const date = showCover.todayDateString();
    const title = showCover.durableShowEventTitle({
      bandName: band?.name,
      venue: payload.venue,
      city: payload.city,
      date,
      campaignId,
    });
    const data = {
      title,
      date,
      venue: payload.venue || null,
      city: payload.city || null,
      state: payload.region || null,
      band: band.id,
      isApproved: true,
    };
    if (coverMediaId) data.image = coverMediaId;
    if (userId) data.users_permissions_user = userId;

    let created;
    try {
      created = await strapi.entityService.create('api::event.event', { data });
    } catch (err) {
      const message = String(err?.message || '').toLowerCase();
      const unique = String(err?.code || '') === '23505' || message.includes('unique');
      if (!unique) throw err;
      data.title = `${title} · ${Date.now().toString(36)}`.slice(0, 180);
      created = await strapi.entityService.create('api::event.event', { data });
    }
    if (!created?.id) return created;
    return strapi.entityService.findOne('api::event.event', created.id, {
      populate: { image: true },
    }) || created;
  },

  async activateManualShowMode(bandId, payload = {}) {
    const band = await strapi.entityService.findOne('api::band.band', bandId, {
      fields: LIVE_SESSION_FIELDS,
    });
    if (!band) {
      return { error: 'not_found', status: 404, message: 'Band not found' };
    }
    const live = this.refuseIfLive(band);
    if (live) return live;

    const now = new Date();
    const timing = showTime.resolveShowPerformanceTiming({
      now,
      timezone: payload.timezone,
      performanceStartsAt: payload.performanceStartsAt,
      performanceEndsAt: payload.performanceEndsAt,
      source: 'manual',
    });
    if (timing.error) {
      return { error: timing.error, status: 400, message: timing.message };
    }

    const campaignId = this.generateCampaignId();
    const coverMediaId = showCover.positiveId(payload.coverMediaId);

    const data = {
      showModeStatus: 'live',
      showModeEnabled: true,
      showModeType: 'manual',
      showModeStartedAt: now.toISOString(),
      showModeEndsAt: timing.effectiveEndsAt.toISOString(),
      showModeActivatedAt: now.toISOString(),
      showModeEventId: null,
      showModeTitle: payload.title || null,
      showModeVenue: payload.venue || null,
      showModeCity: payload.city || null,
      showModeRegion: payload.region || null,
      showModeCountry: payload.country || null,
      showModeTimezone: timing.timeZone || payload.timezone || null,
      showModePerformanceStartsAt: timing.performanceStartsAt.toISOString(),
      showModePerformanceEndsAt: timing.performanceEndsAt.toISOString(),
      showModeSourceDetail: payload.sourceDetail || 'manual_dashboard',
      showModeCampaignId: campaignId,
      showModeMetadata: nightCover.withCoverMediaId(payload.metadata, coverMediaId),
      showModeAutoManaged: false,
      showModeScheduledStartAt: null,
      showModeScheduledEndAt: null,
      showModeLastManualOverrideAt: now.toISOString(),
      showModeLastDeactivationReason: null,
    };

    const claimed = await this.persistLiveSession(bandId, data);
    if (claimed.error) return claimed;

    strapi.log.info('[ShowMode] Manual show mode activated', { 
      bandId, 
      campaignId,
      endsAt: timing.effectiveEndsAt.toISOString(),
      performanceStartsAt: data.showModePerformanceStartsAt,
      performanceEndsAt: data.showModePerformanceEndsAt,
      title: payload.title,
      venue: payload.venue,
      city: payload.city,
    });

    return {
      status: 'live',
      enabled: true,
      type: 'manual',
      campaignId,
      eventId: null,
      coverMediaId,
      coverUrl: nightEnrichment.publicCoverUrl(payload.coverFile) || null,
      startedAt: now,
      endsAt: timing.effectiveEndsAt,
      effectiveEndsAt: timing.effectiveEndsAt,
      performanceStartsAt: timing.performanceStartsAt,
      performanceEndsAt: timing.performanceEndsAt,
      timezone: data.showModeTimezone,
      title: payload.title,
      venue: payload.venue,
      city: payload.city,
      sourceDetail: data.showModeSourceDetail,
    };
  },

  /**
   * Schedule event-based show mode for a band (sets to scheduled state)
   * @param {number} bandId - The band ID
   * @param {object} event - The event object
   */
  async scheduleEventShowMode(bandId, event, timezone = null) {
    const band = await strapi.entityService.findOne('api::band.band', bandId, {
      fields: LIVE_SESSION_FIELDS,
    });
    const live = this.refuseIfLive(band);
    if (live) return live;

    const eventStart = this.resolveEventStart(event, timezone);

    if (!eventStart) {
      strapi.log.warn('[ShowMode] Cannot schedule event show mode without a usable event date', {
        bandId,
        eventId: event?.id,
      });
      return null;
    }

    const scheduledStart = new Date(eventStart.getTime() - 3 * 60 * 60 * 1000);
    const scheduledEnd = this.getNextMorning6AM(timezone, eventStart);

    const campaignId = this.generateCampaignId();

    const data = {
      showModeStatus: 'scheduled',
      showModeEnabled: false,
      showModeType: 'event',
      showModeEventId: event.id,
      showModeTitle: event.title || null,
      showModeVenue: event.venue || null,
      showModeCity: event.city || null,
      showModeRegion: event.state || null,
      showModeCountry: null,
      showModeTimezone: timezone || null,
      showModeSourceDetail: 'event_auto',
      showModeCampaignId: campaignId,
      showModeAutoManaged: true,
      showModeScheduledStartAt: scheduledStart.toISOString(),
      showModeScheduledEndAt: scheduledEnd.toISOString(),
    };

    await strapi.entityService.update('api::band.band', bandId, { data });

    strapi.log.info('[ShowMode] Event show mode scheduled', { 
      bandId, 
      eventId: event.id,
      campaignId,
      scheduledStart: scheduledStart.toISOString(),
      scheduledEnd: scheduledEnd.toISOString(),
    });

    return {
      status: 'scheduled',
      eventId: event.id,
      campaignId,
      scheduledStartAt: scheduledStart,
      scheduledEndAt: scheduledEnd,
    };
  },

  /**
   * Activate a scheduled show mode (transition from scheduled to live)
   * @param {number} bandId - The band ID
   */
  async activateScheduledShowMode(bandId) {
    const now = new Date();
    const band = await strapi.entityService.findOne('api::band.band', bandId, {
      fields: [...LIVE_SESSION_FIELDS, 'showModeScheduledEndAt'],
    });

    const live = this.refuseIfLive(band);
    if (live) return live;

    if (!band || band.showModeStatus !== 'scheduled') {
      return null;
    }

    const data = {
      showModeStatus: 'live',
      showModeEnabled: true,
      showModeActivatedAt: now.toISOString(),
      showModeStartedAt: now.toISOString(),
      showModeEndsAt: band.showModeScheduledEndAt,
      showModePerformanceStartsAt: now.toISOString(),
      showModePerformanceEndsAt: band.showModeScheduledEndAt || null,
    };

    const claimed = await this.persistLiveSession(bandId, data);
    if (claimed.error) return claimed;

    strapi.log.info('[ShowMode] Scheduled show mode activated', { bandId, campaignId: band.showModeCampaignId });

    return { status: 'live', activatedAt: now };
  },

  /**
   * Artist-started Show Mode from an existing Event.
   * Loads/copies canonical Event fields. Does not require a usable Event date.
   * Does not replace an already-live session.
   */
  async activateFromEvent(bandId, event, payload = {}) {
    const band = await strapi.entityService.findOne('api::band.band', bandId, {
      fields: LIVE_SESSION_FIELDS,
    });
    if (!band) {
      return { error: 'not_found', status: 404, message: 'Band not found' };
    }
    if (!event || !eventActivation.positiveId(event.id)) {
      return { error: 'not_found', status: 404, message: 'Event not found' };
    }
    if (!eventActivation.eventBelongsToBand(event, bandId)) {
      return { error: 'forbidden', status: 403, message: 'Event does not belong to this artist' };
    }
    const live = this.refuseIfLive(band);
    if (live) return live;

    const details = eventActivation.eventShowDetails(event);
    // The venue's clock decides the window, not the artist's laptop. The
    // browser zone is a last resort inside resolveActivationTimeZone.
    const timezone = eventActivation.resolveActivationTimeZone({
      event,
      band,
      clientTimezone: payload.timezone,
    });
    const now = new Date();

    // Event-backed activation is an immediate live action. A historical Event
    // must not mint a new campaign, and a far-future Event must not go live.
    const window = eventActivation.resolveEventActivationWindow({ event, timeZone: timezone, now });
    const refusal = eventActivation.activationRefusal(window);
    if (refusal) {
      strapi.log.info('[ShowMode] Event show mode activation refused', {
        bandId,
        eventId: details.eventId,
        state: window.state,
      });
      return refusal;
    }

    const eventStart = window.eventStart;
    const timing = showTime.resolveShowPerformanceTiming({
      now,
      timezone,
      performanceStartsAt: payload.performanceStartsAt,
      performanceEndsAt: payload.performanceEndsAt,
      eventStart,
      source: 'event',
    });
    if (timing.error) {
      return { error: timing.error, status: 400, message: timing.message };
    }
    const campaignId = this.generateCampaignId();

    const data = {
      showModeStatus: 'live',
      showModeEnabled: true,
      showModeType: 'event',
      showModeStartedAt: now.toISOString(),
      showModeEndsAt: timing.effectiveEndsAt.toISOString(),
      showModeActivatedAt: now.toISOString(),
      showModeEventId: details.eventId,
      showModeTitle: details.title,
      showModeVenue: details.venue,
      showModeCity: details.city,
      showModeRegion: details.region,
      showModeCountry: details.country,
      showModeTimezone: timing.timeZone || timezone,
      showModePerformanceStartsAt: timing.performanceStartsAt.toISOString(),
      showModePerformanceEndsAt: timing.performanceEndsAt.toISOString(),
      showModeSourceDetail: eventActivation.EVENT_DASHBOARD_SOURCE,
      showModeCampaignId: campaignId,
      showModeMetadata: null,
      showModeAutoManaged: false,
      showModeScheduledStartAt: null,
      showModeScheduledEndAt: null,
      showModeLastManualOverrideAt: now.toISOString(),
      showModeLastDeactivationReason: null,
    };

    const claimed = await this.persistLiveSession(bandId, data);
    if (claimed.error) return claimed;

    strapi.log.info('[ShowMode] Event show mode activated from dashboard', {
      bandId,
      eventId: details.eventId,
      campaignId,
      sourceDetail: data.showModeSourceDetail,
    });

    return {
      status: 'live',
      enabled: true,
      type: 'event',
      eventId: details.eventId,
      campaignId,
      coverUrl: showCover.publicMediaUrl(event?.image) || null,
      startedAt: now,
      endsAt: timing.effectiveEndsAt,
      effectiveEndsAt: timing.effectiveEndsAt,
      performanceStartsAt: timing.performanceStartsAt,
      performanceEndsAt: timing.performanceEndsAt,
      timezone: data.showModeTimezone,
      title: details.title,
      venue: details.venue,
      city: details.city,
      region: details.region,
      country: details.country,
      sourceDetail: data.showModeSourceDetail,
    };
  },

  /**
   * Legacy auto-activation helper. Cron no longer calls this.
   * Prefer activateFromEvent for artist-started Event Show Mode.
   */
  async activateEventShowMode(bandId, event, timezone = null) {
    const existing = await strapi.entityService.findOne('api::band.band', bandId, {
      fields: LIVE_SESSION_FIELDS,
    });
    const live = this.refuseIfLive(existing);
    if (live) return live;

    const now = new Date();
    const window = eventActivation.resolveEventActivationWindow({ event, timeZone: timezone, now });

    if (window.state !== eventActivation.ACTIVATION_STATE.OPEN) {
      strapi.log.warn('[ShowMode] Cannot activate event show mode outside its activation window', {
        bandId,
        eventId: event?.id,
        state: window.state,
      });
      return null;
    }

    const eventStart = window.eventStart;

    const timing = showTime.resolveShowPerformanceTiming({
      now,
      timezone,
      eventStart,
      source: 'event',
    });
    if (timing.error) {
      strapi.log.warn('[ShowMode] Cannot activate event show mode with invalid timing', {
        bandId,
        eventId: event?.id,
        error: timing.error,
      });
      return null;
    }

    const campaignId = this.generateCampaignId();

    const data = {
      showModeStatus: 'live',
      showModeEnabled: true,
      showModeType: 'event',
      showModeStartedAt: now.toISOString(),
      showModeEndsAt: timing.effectiveEndsAt.toISOString(),
      showModeActivatedAt: now.toISOString(),
      showModeEventId: event.id,
      showModeTitle: event.title || null,
      showModeVenue: event.venue || null,
      showModeCity: event.city || null,
      showModeRegion: event.state || null,
      showModeCountry: null,
      showModeTimezone: timing.timeZone || timezone || null,
      showModePerformanceStartsAt: timing.performanceStartsAt.toISOString(),
      showModePerformanceEndsAt: timing.performanceEndsAt.toISOString(),
      showModeSourceDetail: 'event_auto',
      showModeCampaignId: campaignId,
      showModeAutoManaged: true,
      showModeScheduledStartAt: null,
      showModeScheduledEndAt: null,
    };

    const claimed = await this.persistLiveSession(bandId, data);
    if (claimed.error) return claimed;

    strapi.log.info('[ShowMode] Event show mode activated', { 
      bandId, 
      eventId: event.id,
      campaignId,
      endsAt: timing.effectiveEndsAt.toISOString(),
    });

    return {
      status: 'live',
      enabled: true,
      type: 'event',
      eventId: event.id,
      campaignId,
      startedAt: now,
      endsAt: timing.effectiveEndsAt,
      performanceStartsAt: timing.performanceStartsAt,
      performanceEndsAt: timing.performanceEndsAt,
    };
  },

  /**
   * Deactivate show mode for a band
   * @param {number} bandId - The band ID
   * @param {string} reason - manual | performance_end | safety_expiry | auto
   */
  async deactivateShowMode(bandId, reason = showTime.DEACTIVATION_REASON.MANUAL) {
    const now = new Date();
    
    // Get current show mode info before clearing it (for recap generation)
    const band = await strapi.entityService.findOne('api::band.band', bandId, {
      fields: [
        'id', 'name', 'showModeCampaignId', 'showModeLastCampaignId',
        'showModeStatus', 'showModeEnabled', 'showModeType', 'showModeStartedAt',
        'showModeEventId', 'showModeTitle', 'showModeVenue', 'showModeCity',
        'showModeRegion', 'showModeCountry', 'showModeTimezone',
        'showModePerformanceStartsAt', 'showModePerformanceEndsAt',
        'showModeEndedAt', 'showModeLastDeactivationReason',
        'showModeMetadata',
      ],
    });

    const campaignId = band?.showModeCampaignId;
    const alreadyOff = band
      && band.showModeStatus === 'off'
      && band.showModeEnabled !== true
      && !campaignId;

    if (alreadyOff) {
      return {
        status: 'off',
        enabled: false,
        campaignId: band.showModeLastCampaignId || null,
        endedAt: band.showModeEndedAt || now.toISOString(),
        recapQueued: false,
        skipped: true,
        reason: band.showModeLastDeactivationReason || reason,
      };
    }

    // Snapshot before live fields are cleared. Also archived on the band as
    // showModeLastContext so cron recovery can reconstruct the same night.
    const showContext = integrity.snapshotShowContext(band, {
      endedAt: now.toISOString(),
      campaignId,
    });

    const normalizedReason = Object.values(showTime.DEACTIVATION_REASON).includes(reason)
      ? reason
      : showTime.DEACTIVATION_REASON.AUTO;
    
    const data = {
      showModeStatus: 'off',
      showModeEnabled: false,
      showModeType: null,
      showModeStartedAt: null,
      showModeEndsAt: null,
      showModeActivatedAt: null,
      showModeEventId: null,
      showModeTitle: null,
      showModeVenue: null,
      showModeCity: null,
      showModeRegion: null,
      showModeCountry: null,
      showModeTimezone: null,
      showModePerformanceStartsAt: null,
      showModePerformanceEndsAt: null,
      showModeSourceDetail: null,
      showModeCampaignId: null,
      showModeMetadata: null,
      showModeAutoManaged: false,
      showModeScheduledStartAt: null,
      showModeScheduledEndAt: null,
      // Archive the ended show info for recap reference. showModeCampaignId is
      // cleared so live-capture fallbacks stop tagging fans into the finished
      // campaign, so the id is kept here for the recap cron to find.
      showModeEndedAt: now.toISOString(),
      showModeLastCampaignId: campaignId || band?.showModeLastCampaignId || null,
      showModeLastDeactivationReason: normalizedReason,
      showModeLastContext: showContext,
    };

    if (normalizedReason === showTime.DEACTIVATION_REASON.MANUAL) {
      data.showModeLastManualOverrideAt = now.toISOString();
    } else {
      data.showModeLastAutoDeactivatedAt = now.toISOString();
    }

    await strapi.entityService.update('api::band.band', bandId, { data });

    strapi.log.info('[ShowMode] Show mode deactivated', { bandId, reason: normalizedReason, campaignId });

    // Generate show recap asynchronously (don't block deactivation)
    if (campaignId) {
      const recapService = strapi.service('api::show-recap.show-recap');
      const log = strapi.log;
      setImmediate(async () => {
        try {
          const recap = await recapService.generateShowRecap({
            bandId,
            campaignId,
            showContext,
          });

          if (recap) {
            log.info('[ShowMode] Show recap generated', { bandId, campaignId, recapId: recap.id });
          } else {
            // Returned null rather than throwing — the cron will retry.
            log.warn('[ShowMode] Show recap generation returned nothing', { bandId, campaignId });
          }
        } catch (error) {
          // The cron fallback retries via showModeLastCampaignId.
          log.error('[ShowMode] Failed to generate show recap', {
            bandId,
            campaignId,
            error: error.message,
            stack: error.stack,
          });
        }
      });
    }

    // The dashboard needs the campaign id to find the recap this show produced.
    return {
      status: 'off',
      enabled: false,
      campaignId: campaignId || null,
      endedAt: now.toISOString(),
      recapQueued: Boolean(campaignId),
      reason: normalizedReason,
    };
  },

  /**
   * Check if show mode is currently active for a band
   * @param {object} band - The band object with show mode fields
   * @returns {boolean}
   */
  isShowModeActive(band) {
    if (!band || !band.showModeEnabled) return false;
    if (band.showModeStatus !== 'live') return false;

    const now = new Date();
    const endsAt = band.showModeEndsAt ? new Date(band.showModeEndsAt) : null;

    if (!endsAt) return true;
    return now < endsAt;
  },

  /**
   * Get rich show mode status for a band
   * @param {object} band - The band object
   * @returns {object} Status object
   */
  getShowModeStatus(band) {
    const isActive = this.isShowModeActive(band);
    const now = new Date();

    let timeUntilStart = null;
    let timeUntilEnd = null;

    if (band.showModeScheduledStartAt) {
      const startAt = new Date(band.showModeScheduledStartAt);
      timeUntilStart = Math.max(0, startAt.getTime() - now.getTime());
    }

    if (band.showModeEndsAt) {
      const endsAt = new Date(band.showModeEndsAt);
      timeUntilEnd = Math.max(0, endsAt.getTime() - now.getTime());
    }

    return {
      status: band.showModeStatus || 'off',
      enabled: band.showModeEnabled || false,
      active: isActive,
      type: band.showModeType || null,
      title: band.showModeTitle || null,
      venue: band.showModeVenue || null,
      city: band.showModeCity || null,
      region: band.showModeRegion || null,
      country: band.showModeCountry || null,
      timezone: band.showModeTimezone || null,
      eventId: band.showModeEventId || null,
      campaignId: band.showModeCampaignId || null,
      sourceDetail: band.showModeSourceDetail || null,
      autoManaged: band.showModeAutoManaged || false,
      startedAt: band.showModeStartedAt || null,
      endsAt: band.showModeEndsAt || null,
      effectiveEndsAt: band.showModeEndsAt || null,
      performanceStartsAt: band.showModePerformanceStartsAt || null,
      performanceEndsAt: band.showModePerformanceEndsAt || null,
      lastDeactivationReason: band.showModeLastDeactivationReason || null,
      coverMediaId: integrity.coverMediaIdFromBand(band),
      activatedAt: band.showModeActivatedAt || null,
      scheduledStartAt: band.showModeScheduledStartAt || null,
      scheduledEndAt: band.showModeScheduledEndAt || null,
      timeUntilStart,
      timeUntilEnd,
      metadata: band.showModeMetadata || null,
    };
  },

  /**
   * Authoritative Event activation timing for a batch of this band's Events.
   *
   * The dashboard needs to know which Events may start Show Mode *now*, and it
   * cannot work that out on its own: Event `date`/`time` carry no zone, so a
   * browser in the wrong zone either offers a doomed Start button or hides an
   * eligible one. One grouped query answers every displayed Event at once —
   * never one request per Event.
   *
   * Read model only. `activateFromEvent` re-derives the window at click time.
   */
  async describeEventActivation(band, eventIds = [], { clientTimezone = null, now = new Date() } = {}) {
    const bandId = eventActivation.positiveId(band?.id);
    if (!bandId) return [];

    const ids = [...new Set(
      (Array.isArray(eventIds) ? eventIds : [])
        .map((value) => eventActivation.positiveId(value))
        .filter(Boolean)
    )];
    if (!ids.length) return [];

    // Band-scoped filter is the authorization boundary: an Event belonging to
    // another artist simply is not in the result.
    const events = await strapi.entityService.findMany('api::event.event', {
      filters: { id: { $in: ids }, band: { id: { $eq: bandId } } },
      fields: ['id', 'date', 'time', 'state'],
      populate: { band: { fields: ['id'] } },
      limit: ids.length,
    });

    return (Array.isArray(events) ? events : []).map((event) => (
      eventActivation.describeEventActivation({ event, band, clientTimezone, now })
    ));
  },

  /**
   * Change performance timing on the current live session.
   * Does not create a campaign, Event, or recap.
   */
  async updateShowModeTiming(bandId, payload = {}) {
    const band = await strapi.entityService.findOne('api::band.band', bandId, {
      fields: [
        'id', 'name', 'showModeStatus', 'showModeEnabled', 'showModeCampaignId',
        'showModeStartedAt', 'showModeEndsAt', 'showModeTimezone',
        'showModePerformanceStartsAt', 'showModePerformanceEndsAt',
        'showModeType', 'showModeTitle', 'showModeVenue', 'showModeCity',
        'showModeEventId',
      ],
    });
    if (!band) {
      return { error: 'not_found', status: 404, message: 'Band not found' };
    }
    if (!eventActivation.showModeAlreadyLive(band)) {
      return { error: 'not_live', status: 409, message: 'Show Mode is not active' };
    }

    const now = new Date();
    const sessionFrom = band.showModeStartedAt ? new Date(band.showModeStartedAt) : now;
    const existingStart = payload.performanceStartsAt
      ? payload.performanceStartsAt
      : band.showModePerformanceStartsAt || band.showModeStartedAt;
    const existingEnd = payload.performanceEndsAt !== undefined
      ? payload.performanceEndsAt
      : band.showModePerformanceEndsAt;

    if (payload.performanceEndsAt !== undefined && (payload.performanceEndsAt == null || payload.performanceEndsAt === '')) {
      return { error: 'invalid_timestamp', status: 400, message: 'Performance end is required' };
    }

    const timing = showTime.resolveShowPerformanceTiming({
      now,
      timezone: payload.timezone,
      fallbackTimezone: band.showModeTimezone,
      performanceStartsAt: existingStart,
      performanceEndsAt: existingEnd,
      sessionFrom,
      source: band.showModeType === 'event' ? 'event' : 'manual',
    });
    if (timing.error) {
      return { error: timing.error, status: 400, message: timing.message };
    }

    const data = {
      showModePerformanceStartsAt: timing.performanceStartsAt.toISOString(),
      showModePerformanceEndsAt: timing.performanceEndsAt.toISOString(),
      showModeEndsAt: timing.effectiveEndsAt.toISOString(),
      showModeTimezone: timing.timeZone || band.showModeTimezone || null,
    };

    await strapi.entityService.update('api::band.band', bandId, { data });

    strapi.log.info('[ShowMode] Live session timing updated', {
      bandId,
      campaignId: band.showModeCampaignId,
      performanceEndsAt: data.showModePerformanceEndsAt,
      endsAt: data.showModeEndsAt,
    });

    return this.getShowModeStatus({
      ...band,
      ...data,
    });
  },

  /**
   * Process expired show modes (called by cron)
   * Deactivates any show modes that have passed their end time
   */
  async processExpiredShowModes() {
    const now = new Date();

    const expiredBands = await strapi.entityService.findMany('api::band.band', {
      filters: {
        showModeEnabled: true,
        showModeStatus: 'live',
        showModeEndsAt: { $lt: now.toISOString() },
      },
      fields: [
        'id', 'name', 'showModeEndsAt', 'showModeCampaignId',
        'showModeStartedAt', 'showModeTimezone', 'showModePerformanceEndsAt',
      ],
      limit: showTime.EXPIRED_SHOW_MODE_LIMIT,
    });

    for (const band of expiredBands) {
      const sessionFrom = band.showModeStartedAt ? new Date(band.showModeStartedAt) : now;
      const safetyCeiling = showTime.resolveSafetyCeiling(band.showModeTimezone, sessionFrom);
      const performanceEndsAt = band.showModePerformanceEndsAt
        ? new Date(band.showModePerformanceEndsAt)
        : (band.showModeEndsAt ? new Date(band.showModeEndsAt) : null);
      const reason = showTime.resolveExpiryReason({
        performanceEndsAt,
        safetyCeiling,
        now,
      });

      await this.deactivateShowMode(band.id, reason);
      strapi.log.info('[ShowMode] Auto-deactivated expired show mode', { 
        bandId: band.id, 
        bandName: band.name,
        campaignId: band.showModeCampaignId,
        reason,
      });
    }

    return { deactivatedCount: expiredBands.length };
  },

  /**
   * Leftover scheduled → live helper. Cron no longer calls this.
   * scheduleEventShowMode has no production caller. Kept to avoid a broad delete.
   */
  async processScheduledShowModes() {
    const now = new Date();

    const scheduledBands = await strapi.entityService.findMany('api::band.band', {
      filters: {
        showModeStatus: 'scheduled',
        showModeScheduledStartAt: { $lte: now.toISOString() },
      },
      fields: ['id', 'name', 'showModeScheduledStartAt', 'showModeCampaignId'],
    });

    let activatedCount = 0;

    for (const band of scheduledBands) {
      await this.activateScheduledShowMode(band.id);
      activatedCount++;
      strapi.log.info('[ShowMode] Activated scheduled show mode', { 
        bandId: band.id, 
        bandName: band.name,
        campaignId: band.showModeCampaignId,
      });
    }

    return { activatedCount };
  },

  /**
   * Upcoming Event auto-activation is retired.
   * Creating or approaching an Event must never make Show Mode live.
   */
  async processUpcomingEvents() {
    strapi.log.info('[ShowMode] Upcoming event auto-activation is disabled');
    return { activatedCount: 0, disabled: true };
  },

  /**
   * Get fans captured during a specific campaign
   * @param {string} campaignId - The campaign ID
   */
  async getFansCapturedDuringCampaign(campaignId) {
    if (!campaignId) return 0;

    const count = await strapi.entityService.count('api::fan.fan', {
      filters: { captureCampaignId: campaignId },
    });

    return count;
  },
};
