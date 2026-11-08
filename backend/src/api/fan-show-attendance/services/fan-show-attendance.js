'use strict';

/**
 * fan-show-attendance service
 * 
 * Handles verified fan attendance records for live shows.
 * Foundation for "I Was There" badges and Fan Passport.
 */

const { createCoreService } = require('@strapi/strapi').factories;
const showTime = require('../../../utils/showTime');
const { canonicalAttendanceFilters } = require('../../../utils/fans/canonicalAttendance');

// Check-in time window configuration (in hours)
const CHECK_IN_WINDOW = {
  beforeShowHours: 6,      // Can check in up to 6 hours before show
  afterShowHours: 4,       // Can check in up to 4 hours after show ends
  defaultShowDurationHours: 3, // Assume 3 hour show if no end time
  duplicateWindowHours: 24, // Dedupe window, used ONLY when there is no campaign/event
};

// Confidence score weights
const CONFIDENCE_WEIGHTS = {
  showModeLive: 30,        // Show mode was active
  duringShow: 25,          // Checked in during show window
  hasEvent: 15,            // Linked to actual event
  hasCampaign: 10,         // Has campaign ID
  hasVenue: 10,            // Has venue info
  hasCity: 5,              // Has city info
  isNewFan: 5,             // New fan (less likely to game)
};

module.exports = createCoreService('api::fan-show-attendance.fan-show-attendance', ({ strapi }) => ({

  /**
   * Determine event status based on show timing
   *
   * `timezone` is the band's show mode timezone. Without it the event's
   * wall-clock time is resolved against the server clock (UTC in production),
   * which shifts the window by the venue's offset.
   */
  determineEventStatus(event, showModeEnabled, now = new Date(), timezone = null) {
    if (!event?.date) {
      // No event data - use show mode status
      return showModeEnabled ? 'during_show' : 'unknown';
    }

    const eventStart = showTime.resolveEventStart(event, timezone);
    if (!eventStart) {
      return showModeEnabled ? 'during_show' : 'unknown';
    }

    const showStart = eventStart.getTime();
    const showEnd = showStart + (CHECK_IN_WINDOW.defaultShowDurationHours * 60 * 60 * 1000);
    const beforeWindow = showStart - (CHECK_IN_WINDOW.beforeShowHours * 60 * 60 * 1000);
    const afterWindow = showEnd + (CHECK_IN_WINDOW.afterShowHours * 60 * 60 * 1000);
    const nowTime = now.getTime();

    if (nowTime < beforeWindow) {
      return 'before_show'; // Too early
    } else if (nowTime < showStart) {
      return 'before_show'; // In pre-show window
    } else if (nowTime <= showEnd) {
      return 'during_show';
    } else if (nowTime <= afterWindow) {
      return 'after_show';
    } else {
      return 'after_show'; // Past grace window
    }
  },

  /**
   * Calculate confidence score for attendance verification
   */
  calculateConfidenceScore({ showModeEnabled, eventStatus, hasEvent, hasCampaign, hasVenue, hasCity, isNewFan, verificationLevel }) {
    let score = 50; // Base score

    if (showModeEnabled) score += CONFIDENCE_WEIGHTS.showModeLive;
    if (eventStatus === 'during_show') score += CONFIDENCE_WEIGHTS.duringShow;
    if (hasEvent) score += CONFIDENCE_WEIGHTS.hasEvent;
    if (hasCampaign) score += CONFIDENCE_WEIGHTS.hasCampaign;
    if (hasVenue) score += CONFIDENCE_WEIGHTS.hasVenue;
    if (hasCity) score += CONFIDENCE_WEIGHTS.hasCity;
    if (isNewFan) score += CONFIDENCE_WEIGHTS.isNewFan;

    // Verification level bonuses
    if (verificationLevel === 'event_qr_scan') score += 15;
    if (verificationLevel === 'geo_supported') score += 10;
    if (verificationLevel === 'staff_verified') score += 25;

    return Math.min(100, Math.max(0, score));
  },

  /**
   * Generate human-readable timeline label
   */
  generateTimelineLabel({ venue, city, showTitle, showDate }) {
    const parts = [];
    
    if (venue) {
      parts.push(`Checked in at ${venue}`);
      if (city) parts[0] += ` — ${city}`;
    } else if (showTitle) {
      parts.push(`Checked in for ${showTitle}`);
    } else if (city) {
      parts.push(`Checked in at show in ${city}`);
    } else {
      parts.push('Checked in at live show');
    }

    return parts.join('');
  },

  /**
   * Check for duplicate attendance records
   * Returns existing attendance if found, null otherwise
   */
  async checkForDuplicate({ fanId, bandId, campaignId, eventId }) {
    // Priority 1: Check by campaignId
    if (campaignId) {
      const byCampaign = await strapi.entityService.findMany('api::fan-show-attendance.fan-show-attendance', {
        filters: canonicalAttendanceFilters({
          fan: fanId,
          band: bandId,
          campaignId,
        }),
        limit: 1,
      });
      if (byCampaign.length > 0) {
        return { exists: true, attendance: byCampaign[0], reason: 'campaign' };
      }
    }

    // Priority 2: Check by eventId
    if (eventId) {
      const byEvent = await strapi.entityService.findMany('api::fan-show-attendance.fan-show-attendance', {
        filters: canonicalAttendanceFilters({
          fan: fanId,
          band: bandId,
          event: eventId,
        }),
        limit: 1,
      });
      if (byEvent.length > 0) {
        return { exists: true, attendance: byEvent[0], reason: 'event' };
      }
    }

    // Priority 3: time window, only when nothing identifies the show.
    //
    // A campaign or event id has already answered the question precisely: this
    // fan has not checked in to *this* show. Falling through to a blanket
    // 24-hour, band-wide window after that wrongly rejects the second show of
    // the same day — a matinee plus an evening set, or a band that ends Show
    // Mode and starts it again.
    if (campaignId || eventId) {
      return { exists: false, attendance: null, reason: null };
    }

    const windowStart = new Date(Date.now() - CHECK_IN_WINDOW.duplicateWindowHours * 60 * 60 * 1000);
    const byTimeWindow = await strapi.entityService.findMany('api::fan-show-attendance.fan-show-attendance', {
      filters: canonicalAttendanceFilters({
        fan: fanId,
        band: bandId,
        checkedInAt: { $gte: windowStart.toISOString() },
      }),
      limit: 1,
    });
    if (byTimeWindow.length > 0) {
      return { exists: true, attendance: byTimeWindow[0], reason: 'time_window' };
    }

    return { exists: false, attendance: null, reason: null };
  },

  /**
   * Get fan attendance stats
   */
  async getFanAttendanceStats(fanId) {
    const attendances = await strapi.entityService.findMany('api::fan-show-attendance.fan-show-attendance', {
      filters: canonicalAttendanceFilters({
        fan: fanId,
      }),
      populate: ['band', 'event'],
    });

    const cities = new Set();
    const venues = new Set();
    const bands = new Set();
    let verifiedCount = 0;

    attendances.forEach(a => {
      if (a.city) cities.add(a.city);
      if (a.venue) venues.add(a.venue);
      if (a.band?.id) bands.add(a.band.id);
      if (a.confidenceScore >= 70) verifiedCount++;
    });

    return {
      totalAttendances: attendances.length,
      verifiedAttendances: verifiedCount,
      uniqueCities: cities.size,
      uniqueVenues: venues.size,
      uniqueBands: bands.size,
      cities: Array.from(cities),
      isMultiCityFan: cities.size > 1,
      isRepeatAttendee: attendances.length > 1,
    };
  },

  /**
   * Get band attendance analytics
   */
  async getBandAttendanceAnalytics(bandId, options = {}) {
    const { startDate, endDate } = options;
    
    const filters = canonicalAttendanceFilters({
      band: bandId,
    });

    if (startDate || endDate) {
      filters.checkedInAt = {};
      if (startDate) filters.checkedInAt.$gte = startDate;
      if (endDate) filters.checkedInAt.$lte = endDate;
    }

    const attendances = await strapi.entityService.findMany('api::fan-show-attendance.fan-show-attendance', {
      filters,
      populate: ['fan', 'event'],
    });

    // Calculate metrics
    const fanIds = new Set();
    const newFanIds = new Set();
    const cities = {};
    const venues = {};
    const sources = {};
    const verificationLevels = {};
    let totalConfidence = 0;

    attendances.forEach(a => {
      if (a.fan?.id) {
        fanIds.add(a.fan.id);
        if (a.isNewFanAtCheckIn) newFanIds.add(a.fan.id);
      }
      
      if (a.city) {
        cities[a.city] = (cities[a.city] || 0) + 1;
      }
      if (a.venue) {
        venues[a.venue] = (venues[a.venue] || 0) + 1;
      }
      if (a.checkInSource) {
        sources[a.checkInSource] = (sources[a.checkInSource] || 0) + 1;
      }
      if (a.verificationLevel) {
        verificationLevels[a.verificationLevel] = (verificationLevels[a.verificationLevel] || 0) + 1;
      }
      totalConfidence += a.confidenceScore || 50;
    });

    // Sort and get top items
    const sortByCount = obj => Object.entries(obj)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));

    return {
      totalCheckIns: attendances.length,
      uniqueAttendees: fanIds.size,
      newFanAttendees: newFanIds.size,
      knownFanAttendees: fanIds.size - newFanIds.size,
      averageConfidenceScore: attendances.length > 0 ? Math.round(totalConfidence / attendances.length) : 0,
      topCities: sortByCount(cities).slice(0, 5),
      topVenues: sortByCount(venues).slice(0, 5),
      checkInsBySurface: sortByCount(sources),
      checkInsByVerification: sortByCount(verificationLevels),
    };
  },

}));
