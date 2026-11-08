'use strict';

/**
 * Prepared MomentView. Not persisted.
 * References media owners. Never copies URLs, S3 keys, or gallery JSON
 * onto Moment. ArtistUpdate authorization still runs for media.
 */

const showContext = require('../artistUpdates/showContextPure');
const artistUpdatePure = require('../artistUpdates/artistUpdatePure');
const { canonicalAttendanceFilters } = require('../fans/canonicalAttendance');
const { SHOW_SOURCE_TYPE } = require('./momentKeys');
const { toId, relId, isActiveMoment, canViewMoment, sortMomentsChronologically } = require('./momentPure');

const EVENT_FIELDS = ['id', 'title', 'venue', 'city', 'date'];
const SHOW_RECAP_FIELDS = [
  'id',
  'campaignId',
  'eventId',
  'showModeType',
  'showTitle',
  'venue',
  'city',
  'showStartedAt',
  'recapGeneratedAt',
];

function uniqueIds(values) {
  return [...new Set((values || []).map((id) => Number(id)).filter((n) => Number.isInteger(n) && n > 0))];
}

function uniqueStrings(values) {
  return [...new Set((values || []).map((v) => String(v || '').trim()).filter(Boolean))];
}

function thinUpdateRef(record, access) {
  if (!record) return null;
  const allowed = Boolean(access?.allowed && access.media === 'full');
  return {
    id: record.id,
    visibility: record.visibility,
    publishedAt: record.publishedAt || null,
    contentKind: record.contentKind || null,
    photoCount: allowed ? Number(record.photoCount) || 0 : 0,
    hasMedia: allowed ? (Number(record.photoCount) || 0) > 0 : false,
    media: allowed ? record.media || [] : [],
    locked: !allowed,
    lockReason: allowed ? null : access?.reason || 'forbidden',
  };
}

function showContextFromAttendance(attendance, event, recap) {
  const eventId = toId(attendance?.event) || event?.id || recap?.eventId || null;
  const campaignId = attendance?.campaignId || recap?.campaignId || null;
  return {
    eventId: eventId ? String(eventId) : null,
    campaignId: campaignId ? String(campaignId) : null,
    showRecapId: recap?.id ? String(recap.id) : null,
    showMode: Boolean(campaignId && !eventId) || Boolean(campaignId),
    title: event?.title || recap?.showTitle || attendance?.showTitle || null,
    venue: event?.venue || recap?.venue || attendance?.venue || null,
    city: event?.city || recap?.city || attendance?.city || null,
    date: event?.date || recap?.showStartedAt || attendance?.showDate || attendance?.checkedInAt || null,
  };
}

function toRecordFromUpdateRow(row) {
  const files = Array.isArray(row.media) ? row.media : [];
  const recap = row.showRecap && typeof row.showRecap === 'object' ? row.showRecap : null;
  const resolved = showContext.resolveArtistUpdateShowContext({
    bandId: relId(row, 'band'),
    eventId: relId(row, 'event'),
    showRecapId: relId(row, 'showRecap'),
    showRecap: recap,
    event: row.event && typeof row.event === 'object' ? row.event : null,
  });
  const context = resolved.ok ? resolved.context : showContext.emptyContext();
  return {
    id: row.id,
    slug: row.slug,
    title: row.title || null,
    contentKind: row.contentKind || artistUpdatePure.contentKindFromCount(files.length),
    visibility: row.visibility,
    status: row.status,
    publishedAt: row.publishedAt || null,
    photoCount: files.length,
    mediaFiles: files,
    media: [],
    bandId: relId(row, 'band'),
    eventId: context.eventId,
    showRecapId: context.showRecapId,
    showCampaignId: context.campaignId,
    campaignId: context.campaignId,
    showRecap: recap,
  };
}

async function loadAttendancesByIds(strapi, ids) {
  const list = uniqueIds(ids);
  if (!list.length) return new Map();
  const rows = await strapi.entityService.findMany('api::fan-show-attendance.fan-show-attendance', {
    filters: { id: { $in: list } },
    fields: ['id', 'checkedInAt', 'campaignId', 'city', 'venue', 'showTitle', 'showDate', 'suppressedDuplicate'],
    populate: {
      event: { fields: EVENT_FIELDS },
      fan: { fields: ['id'] },
      band: { fields: ['id'] },
    },
    limit: Math.min(Math.max(list.length, 8), 200),
  });
  const map = new Map();
  for (const row of rows || []) map.set(Number(row.id), row);
  return map;
}

async function loadRecaps(strapi, { bandId, eventIds, campaignIds }) {
  const events = uniqueIds(eventIds);
  const camps = uniqueStrings(campaignIds);
  if (!events.length && !camps.length) return [];
  const or = [];
  if (events.length) or.push({ eventId: { $in: events } });
  if (camps.length) or.push({ campaignId: { $in: camps } });
  return (
    (await strapi.entityService.findMany('api::show-recap.show-recap', {
      filters: { band: bandId, $or: or },
      fields: SHOW_RECAP_FIELDS,
      limit: 80,
    })) || []
  );
}

async function loadArtistUpdatesForNights(strapi, { bandId, eventIds, recapIds, campaignIds }) {
  const events = uniqueIds(eventIds);
  const recaps = uniqueIds(recapIds);
  const camps = uniqueStrings(campaignIds);
  if (!events.length && !recaps.length && !camps.length) return [];

  const or = [];
  if (events.length) or.push({ event: { id: { $in: events } } });
  if (recaps.length) or.push({ showRecap: { id: { $in: recaps } } });

  let rows = [];
  if (or.length) {
    rows = await strapi.entityService.findMany('api::artist-update.artist-update', {
      filters: { band: bandId, status: 'published', $or: or },
      fields: ['id', 'slug', 'title', 'contentKind', 'visibility', 'status', 'publishedAt'],
      populate: {
        media: true,
        event: { fields: EVENT_FIELDS },
        showRecap: { fields: SHOW_RECAP_FIELDS },
        band: { fields: ['id'] },
      },
      limit: 80,
    });
  }

  const records = (rows || []).map(toRecordFromUpdateRow);
  if (camps.length) {
    const extra = records.filter((record) => record.showCampaignId && camps.includes(String(record.showCampaignId)));
    const seen = new Set(records.map((r) => r.id));
    for (const record of extra) {
      if (!seen.has(record.id)) {
        seen.add(record.id);
        records.push(record);
      }
    }
  }
  return records;
}

function updatesForNight(records, context, viewer) {
  const matched = [];
  for (const record of records || []) {
    const night = {
      eventId: record.eventId,
      campaignId: record.showCampaignId,
    };
    const hitsNight =
      (context.eventId && night.eventId && showContext.sameId(context.eventId, night.eventId)) ||
      (context.campaignId && night.campaignId && showContext.sameId(context.campaignId, night.campaignId));
    if (!hitsNight) continue;
    const access = artistUpdatePure.decideArtistUpdateAccess({
      update: record,
      viewer: {
        ...viewer,
        attendedEventId: context.eventId,
        attendedCampaignId: context.campaignId,
      },
    });
    const serialized = { ...record };
    if (access.allowed && access.media === 'full') {
      serialized.media = artistUpdatePure.serializeUpdateMediaList(record.mediaFiles, {
        updateId: record.id,
        visibility: record.visibility,
      });
    } else {
      serialized.media = [];
    }
    matched.push(thinUpdateRef(serialized, access));
  }
  return matched;
}

function toMomentView(moment, extras = {}) {
  return {
    id: moment.id,
    kind: moment.kind,
    status: moment.status,
    visibility: moment.visibility,
    occurredAt: moment.occurredAt,
    sourceType: moment.sourceType,
    sourceId: moment.sourceId,
    shareable: moment.shareable === true,
    subjectFanId: toId(moment.subjectFan),
    bandId: toId(moment.band),
    showContext: extras.showContext || null,
    artistUpdates: extras.artistUpdates || [],
    hasNightStory: Boolean(extras.hasNightStory),
  };
}

/**
 * Batch-resolve fan-scoped Moments for one artist×fan pair.
 *
 * Query shape (bounded, not per-Moment):
 *   1 moments list
 *   1 milestones list
 *   1 attendances by source ids (moments + milestone evidence)
 *   1 show recaps by event/campaign
 *   1 artist updates by event/recap
 */
async function resolveMomentViews(strapi, { moments, viewer, bandId, attendanceMap: providedMap, extraAttendanceIds }) {
  const visible = sortMomentsChronologically(moments || []).filter((row) => {
    if (!isActiveMoment(row)) return false;
    return canViewMoment({ moment: row, viewer });
  });

  const attendanceIds = visible
    .filter((row) => row.sourceType === SHOW_SOURCE_TYPE)
    .map((row) => Number(row.sourceId));
  const extra = Array.isArray(extraAttendanceIds) ? extraAttendanceIds : [];
  const attendanceMap = providedMap || (await loadAttendancesByIds(strapi, [...attendanceIds, ...extra]));

  const eventIds = [];
  const campaignIds = [];
  for (const row of attendanceMap.values()) {
    if (row.suppressedDuplicate === true) continue;
    const eventId = toId(row.event);
    if (eventId) eventIds.push(eventId);
    if (row.campaignId) campaignIds.push(row.campaignId);
  }

  const recaps = await loadRecaps(strapi, { bandId, eventIds, campaignIds });
  const recapByEvent = new Map();
  const recapByCampaign = new Map();
  for (const recap of recaps) {
    if (recap.eventId) recapByEvent.set(String(recap.eventId), recap);
    if (recap.campaignId) recapByCampaign.set(String(recap.campaignId), recap);
  }
  const recapIds = recaps.map((row) => row.id);

  const updateRecords = await loadArtistUpdatesForNights(strapi, {
    bandId,
    eventIds,
    recapIds,
    campaignIds,
  });

  const views = [];
  for (const moment of visible) {
    if (moment.sourceType !== SHOW_SOURCE_TYPE) {
      views.push(toMomentView(moment));
      continue;
    }
    const attendance = attendanceMap.get(Number(moment.sourceId));
    if (!attendance || attendance.suppressedDuplicate === true) continue;
    const event = attendance.event && typeof attendance.event === 'object' ? attendance.event : null;
    const eventId = toId(event) || toId(attendance.event);
    const recap =
      (eventId && recapByEvent.get(String(eventId))) ||
      (attendance.campaignId && recapByCampaign.get(String(attendance.campaignId))) ||
      null;
    const context = showContextFromAttendance(attendance, event, recap);
    const artistUpdates = updatesForNight(updateRecords, context, viewer);
    views.push(
      toMomentView(moment, {
        showContext: context,
        artistUpdates,
        hasNightStory: artistUpdates.some((item) => !item.locked && item.hasMedia),
      })
    );
  }
  return views;
}

module.exports = {
  resolveMomentViews,
  showContextFromAttendance,
  thinUpdateRef,
  loadAttendancesByIds,
};
