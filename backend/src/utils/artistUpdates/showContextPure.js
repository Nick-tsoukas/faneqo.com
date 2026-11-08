'use strict';

/**
 * Derived show-night context for Artist Updates.
 * Not a DB entity. campaignId is Show Mode (`sm_…`), never message-campaign.
 */

function idString(value) {
  if (value == null || value === '') return null;
  if (typeof value === 'object') {
    return idString(value.id ?? value.data?.id ?? null);
  }
  const str = String(value).trim();
  return str || null;
}

function sameId(a, b) {
  const left = idString(a);
  const right = idString(b);
  if (!left || !right) return false;
  return left === right;
}

function emptyContext() {
  return {
    bandId: null,
    eventId: null,
    campaignId: null,
    showRecapId: null,
    showModeType: null,
  };
}

function fromRecap(recap) {
  if (!recap || typeof recap !== 'object') return emptyContext();
  return {
    bandId: idString(recap.bandId ?? recap.band),
    eventId: idString(recap.eventId ?? recap.event),
    campaignId: idString(recap.campaignId),
    showRecapId: idString(recap.id),
    showModeType: recap.showModeType || null,
  };
}

function mismatch(field) {
  return {
    error: 'show_context_mismatch',
    field,
    message: 'Show context identifiers contradict each other.',
  };
}

function mergeField(claimed, recapValue, field) {
  if (claimed && recapValue && claimed !== recapValue) return mismatch(field);
  return { value: claimed || recapValue || null };
}

/**
 * Merge claimed identifiers with an optional loaded ShowRecap / Event.
 * Fail closed on contradiction. Do not pick a winner.
 */
function resolveShowContext(input = {}) {
  const claimed = {
    bandId: idString(input.bandId),
    eventId: idString(input.eventId),
    campaignId: idString(input.campaignId),
    showRecapId: idString(input.showRecapId),
    showModeType: input.showModeType || null,
  };
  const recapCtx = fromRecap(input.recap || input.showRecap || null);

  const band = mergeField(claimed.bandId, recapCtx.bandId, 'bandId');
  if (band.error) return band;
  const event = mergeField(claimed.eventId, recapCtx.eventId, 'eventId');
  if (event.error) return event;
  const campaign = mergeField(claimed.campaignId, recapCtx.campaignId, 'campaignId');
  if (campaign.error) return campaign;
  const recapId = mergeField(claimed.showRecapId, recapCtx.showRecapId, 'showRecapId');
  if (recapId.error) return recapId;

  if (claimed.showModeType && recapCtx.showModeType && claimed.showModeType !== recapCtx.showModeType) {
    return mismatch('showModeType');
  }

  const context = {
    bandId: band.value,
    eventId: event.value,
    campaignId: campaign.value,
    showRecapId: recapId.value,
    showModeType: claimed.showModeType || recapCtx.showModeType || null,
  };

  const eventRow = input.event && typeof input.event === 'object' ? input.event : null;
  if (eventRow) {
    const eventId = idString(eventRow.id);
    const eventBand = idString(eventRow.bandId ?? eventRow.band);
    if (eventId && context.eventId && eventId !== context.eventId) return mismatch('eventId');
    if (eventBand && context.bandId && eventBand !== context.bandId) {
      return {
        error: 'show_context_mismatch',
        field: 'bandId',
        message: 'Show belongs to a different artist.',
      };
    }
    if (eventId && !context.eventId) context.eventId = eventId;
    if (eventBand && !context.bandId) context.bandId = eventBand;
  }

  return { ok: true, context };
}

function showModeCampaignIdFromUpdate(update, recap) {
  const fromRecap = recap ? idString(recap.campaignId) : null;
  const claimed = idString(update.showCampaignId) || idString(update.campaignId);
  // ArtistUpdate.campaign is message-campaign (numeric). Ignore it as show identity.
  if (claimed && /^\d+$/.test(claimed) && !fromRecap) return fromRecap;
  return claimed || fromRecap;
}

function resolveArtistUpdateShowContext(update = {}) {
  const recap = update.showRecap && typeof update.showRecap === 'object' ? update.showRecap : null;
  return resolveShowContext({
    bandId: update.bandId ?? update.band,
    eventId: update.eventId ?? update.event,
    campaignId: showModeCampaignIdFromUpdate(update, recap),
    showRecapId: update.showRecapId ?? update.showRecap,
    showModeType: update.showModeType,
    recap,
    event: update.event && typeof update.event === 'object' ? update.event : null,
  });
}

function showContextHasNight(context) {
  return !!(context && (context.eventId || context.campaignId));
}

function attendanceMatchesShow(context, viewer = {}) {
  if (!showContextHasNight(context)) return false;
  if (context.eventId && viewer.attendedEventId && sameId(context.eventId, viewer.attendedEventId)) {
    return true;
  }
  if (context.campaignId && viewer.attendedCampaignId && sameId(context.campaignId, viewer.attendedCampaignId)) {
    return true;
  }
  return false;
}

function attendanceHitsFromRows(rows) {
  const eventIds = new Set();
  const campaignIds = new Set();
  for (const row of rows || []) {
    if (!row || row.suppressedDuplicate === true) continue;
    const eventId = idString(row.eventId ?? row.event);
    if (eventId) eventIds.add(eventId);
    const campaignId = idString(row.campaignId);
    if (campaignId) campaignIds.add(campaignId);
  }
  return { eventIds, campaignIds };
}

function rowMatchesShow(row, context) {
  if (!row || row.suppressedDuplicate === true || !context) return false;
  const eventId = idString(row.eventId ?? row.event);
  const campaignId = idString(row.campaignId);
  if (context.eventId && eventId && sameId(context.eventId, eventId)) return true;
  if (context.campaignId && campaignId && sameId(context.campaignId, campaignId)) return true;
  return false;
}

function ordinalForShow(rows, context) {
  if (!showContextHasNight(context)) return null;
  const canonical = (rows || [])
    .filter((row) => row && row.suppressedDuplicate !== true)
    .slice()
    .sort((a, b) => {
      const ta = new Date(a.checkedInAt || 0).getTime();
      const tb = new Date(b.checkedInAt || 0).getTime();
      if (ta !== tb) return ta - tb;
      return Number(a.id) - Number(b.id);
    });
  const index = canonical.findIndex((row) => rowMatchesShow(row, context));
  return index >= 0 ? index + 1 : null;
}

function hasShowScope({ eventId, showRecapId, campaignId } = {}) {
  return !!(idString(eventId) || idString(showRecapId) || idString(campaignId));
}

module.exports = {
  idString,
  sameId,
  emptyContext,
  fromRecap,
  resolveShowContext,
  resolveArtistUpdateShowContext,
  showContextHasNight,
  attendanceMatchesShow,
  attendanceHitsFromRows,
  rowMatchesShow,
  ordinalForShow,
  hasShowScope,
};
