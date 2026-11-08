'use strict';

/**
 * Live Show Mode identity must never be silently replaced.
 * Event-backed activation already used this rule; every writer must.
 */

const ALREADY_LIVE = 'already_live';
const ALREADY_LIVE_MESSAGE = 'Show Mode is already active.';

function showModeAlreadyLive(band) {
  return !!band && band.showModeEnabled === true && band.showModeStatus === 'live';
}

function alreadyLiveConflict(current = null) {
  return {
    error: ALREADY_LIVE,
    status: 409,
    message: ALREADY_LIVE_MESSAGE,
    current: current || null,
  };
}

/** WHERE a live-session claim may write. Live rows must not match. */
function liveClaimWhere(bandId) {
  return {
    id: bandId,
    $or: [
      { showModeStatus: { $ne: 'live' } },
      { showModeEnabled: { $ne: true } },
    ],
  };
}

function rowAllowsLiveClaim(band) {
  if (!band) return false;
  return !showModeAlreadyLive(band);
}

function coverMediaIdFromBand(band) {
  const meta = band?.showModeMetadata;
  if (!meta || typeof meta !== 'object') return null;
  const id = Number.parseInt(meta.coverMediaId, 10);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function snapshotShowContext(band, { endedAt, campaignId } = {}) {
  if (!band) return null;
  const id = campaignId || band.showModeCampaignId || null;
  if (!id) return null;
  return {
    campaignId: id,
    showModeType: band.showModeType || null,
    showStartedAt: band.showModeStartedAt || null,
    showEndedAt: endedAt || band.showModeEndedAt || null,
    eventId: band.showModeEventId || null,
    title: band.showModeTitle || null,
    venue: band.showModeVenue || null,
    city: band.showModeCity || null,
    region: band.showModeRegion || null,
    country: band.showModeCountry || null,
    timezone: band.showModeTimezone || null,
    performanceStartsAt: band.showModePerformanceStartsAt || null,
    performanceEndsAt: band.showModePerformanceEndsAt || null,
    coverMediaId: coverMediaIdFromBand(band),
  };
}

function recoveryShowContext(band, campaignId = null) {
  const stored = band?.showModeLastContext;
  const requested = campaignId || null;
  if (stored && typeof stored === 'object') {
    const storedId = stored.campaignId || band.showModeLastCampaignId || null;
    if (!requested || !storedId || storedId === requested) {
      return {
        ...stored,
        showEndedAt: stored.showEndedAt || band.showModeEndedAt || null,
        campaignId: storedId || requested || band.showModeCampaignId || null,
      };
    }
  }
  return {
    showEndedAt: band?.showModeEndedAt || null,
  };
}

module.exports = {
  ALREADY_LIVE,
  ALREADY_LIVE_MESSAGE,
  showModeAlreadyLive,
  alreadyLiveConflict,
  liveClaimWhere,
  rowAllowsLiveClaim,
  snapshotShowContext,
  recoveryShowContext,
  coverMediaIdFromBand,
};
