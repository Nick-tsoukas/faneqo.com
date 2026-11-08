'use strict';

const { createArtistUpdateService } = require('../artistUpdates/artistUpdateService');
const { canonicalAttendanceFilters, isCanonicalAttendance } = require('../fans/canonicalAttendance');
const showContext = require('../artistUpdates/showContextPure');
const pure = require('./passportPure');

const UID_SAVE = 'api::passport-gallery-save.passport-gallery-save';
const UID_FAN = 'api::fan.fan';
const UID_ATTENDANCE = 'api::fan-show-attendance.fan-show-attendance';
const UID_BAND = 'api::band.band';
const UID_EVENT = 'api::event.event';
const UID_RECAP = 'api::show-recap.show-recap';
const UID_UPDATE = 'api::artist-update.artist-update';

function isUniqueViolation(err) {
  const code = String(err?.code || '');
  const message = String(err?.message || '').toLowerCase();
  return code === '23505' || code === 'UNIQUE_VIOLATION'
    || (message.includes('unique') && message.includes('duplicate'));
}

function createFanPassportService(strapi, deps = {}) {
  const updates = deps.updates || createArtistUpdateService(strapi);

  async function findByKey(saveKey) {
    const rows = await strapi.entityService.findMany(UID_SAVE, {
      filters: { saveKey },
      fields: ['id', 'savedAt'],
      populate: { artistUpdate: { fields: ['id'] } },
      limit: 1,
    });
    return rows?.[0] || null;
  }

  async function listGallerySaves({ userId }) {
    if (!pure.positiveId(userId)) {
      return { error: 'unauthorized', status: 401, message: 'Authentication required' };
    }
    const rows = await strapi.entityService.findMany(UID_SAVE, {
      filters: { accountUser: userId },
      fields: ['id', 'savedAt'],
      populate: { artistUpdate: { fields: ['id'] } },
      sort: { savedAt: 'desc' },
      limit: pure.MAX_SAVED_GALLERIES,
    });
    const updateIds = (rows || [])
      .map((row) => pure.positiveId(row.artistUpdate?.id || row.artistUpdate))
      .filter(Boolean);
    const visible = await updates.listAccessibleByIds({ userId, updateIds });
    if (visible.error) return visible;
    const byId = new Map((visible.data || []).map((item) => [Number(item.id), item]));
    const galleries = (rows || []).flatMap((row) => {
      const updateId = pure.positiveId(row.artistUpdate?.id || row.artistUpdate);
      const gallery = byId.get(Number(updateId));
      if (!gallery) return [];
      return [{
        saveId: row.id,
        savedAt: row.savedAt,
        sharePath: pure.gallerySharePath(updateId),
        gallery,
      }];
    });
    return { data: { galleries, count: galleries.length } };
  }

  async function saveGallery({ userId, artistUpdateId }) {
    const uid = pure.positiveId(userId);
    const updateId = pure.positiveId(artistUpdateId);
    if (!uid) return { error: 'unauthorized', status: 401, message: 'Authentication required' };
    if (!updateId) return { error: 'not_found', status: 404, message: 'Gallery not found' };

    const visible = await updates.listAccessibleByIds({ userId: uid, updateIds: [updateId] });
    const gallery = visible.data?.[0] || null;
    if (!gallery || gallery.locked || !gallery.show || Number(gallery.photoCount || 0) < 1) {
      return { error: 'not_found', status: 404, message: 'Gallery not found' };
    }
    const saveKey = pure.gallerySaveKey(uid, updateId);
    const existing = await findByKey(saveKey);
    if (existing) {
      return {
        data: {
          saveId: existing.id,
          savedAt: existing.savedAt,
          sharePath: pure.gallerySharePath(updateId),
          gallery,
        },
      };
    }

    let row;
    try {
      row = await strapi.entityService.create(UID_SAVE, {
        data: {
          accountUser: uid,
          artistUpdate: updateId,
          band: gallery.band.id,
          event: pure.positiveId(gallery.show?.eventId),
          showRecap: pure.positiveId(gallery.show?.showRecapId),
          savedAt: new Date().toISOString(),
          saveKey,
        },
      });
    } catch (err) {
      if (!isUniqueViolation(err)) throw err;
      row = await findByKey(saveKey);
    }
    return {
      data: {
        saveId: row.id,
        savedAt: row.savedAt,
        sharePath: pure.gallerySharePath(updateId),
        gallery,
      },
    };
  }

  async function removeGallery({ userId, artistUpdateId }) {
    const uid = pure.positiveId(userId);
    const updateId = pure.positiveId(artistUpdateId);
    if (!uid) return { error: 'unauthorized', status: 401, message: 'Authentication required' };
    if (!updateId) return { error: 'not_found', status: 404, message: 'Gallery not found' };
    const row = await findByKey(pure.gallerySaveKey(uid, updateId));
    if (row) await strapi.entityService.delete(UID_SAVE, row.id);
    return { data: { saved: false, artistUpdateId: updateId } };
  }

  async function loadClaimedFans(userId) {
    const rows = await strapi.entityService.findMany(UID_FAN, {
      filters: { accountUser: userId, status: { $ne: 'removed' } },
      fields: ['id', 'status'],
      populate: { band: { fields: ['id'] } },
      limit: 200,
    });
    return (rows || []).filter((fan) => pure.positiveId(fan.id));
  }

  async function loadCanonicalAttendances(fanIds) {
    const ids = [...new Set((fanIds || []).map((id) => pure.positiveId(id)).filter(Boolean))];
    if (!ids.length) return [];
    const limit = Math.min(ids.length * pure.PER_FAN_ATTENDANCE_CAP, 500);
    const rows = await strapi.entityService.findMany(UID_ATTENDANCE, {
      filters: canonicalAttendanceFilters({ fan: { id: { $in: ids } } }),
      fields: [
        'id', 'checkedInAt', 'campaignId', 'venue', 'city', 'region', 'country',
        'showTitle', 'showDate', 'suppressedDuplicate',
      ],
      populate: {
        fan: { fields: ['id'] },
        band: { fields: ['id'] },
        event: { fields: ['id'] },
      },
      sort: { checkedInAt: 'desc' },
      limit,
    });
    return {
      rows: (rows || []).filter(isCanonicalAttendance),
      truncated: (rows || []).length >= limit,
    };
  }

  async function loadBandsByIds(bandIds) {
    const ids = [...new Set((bandIds || []).map((id) => pure.positiveId(id)).filter(Boolean))];
    if (!ids.length) return new Map();
    const rows = await strapi.entityService.findMany(UID_BAND, {
      filters: { id: { $in: ids } },
      fields: ['id', 'name', 'slug'],
      populate: { bandImg: true },
      limit: ids.length,
    });
    return new Map((rows || []).map((band) => [Number(band.id), {
      id: band.id,
      name: band.name,
      slug: band.slug,
      bandImg: band.bandImg || null,
      imageUrl: pure.publicArtworkUrl(band.bandImg),
    }]));
  }

  async function loadEventsByIds(eventIds) {
    const ids = [...new Set((eventIds || []).map((id) => pure.positiveId(id)).filter(Boolean))];
    if (!ids.length) return new Map();
    const rows = await strapi.entityService.findMany(UID_EVENT, {
      filters: { id: { $in: ids } },
      fields: ['id', 'title', 'venue', 'city', 'state', 'date'],
      populate: { image: true },
      limit: ids.length,
    });
    return new Map((rows || []).map((event) => [Number(event.id), event]));
  }

  async function loadRecapsForAttendances(attendances) {
    const campaignIds = [...new Set(attendances.map((row) => pure.trimText(row.campaignId)).filter(Boolean))];
    const eventIds = [...new Set(attendances.map((row) => pure.relId(row.eventId ?? row.event)).filter(Boolean))];
    if (!campaignIds.length && !eventIds.length) return [];
    const filters = campaignIds.length && eventIds.length
      ? { $or: [{ campaignId: { $in: campaignIds } }, { eventId: { $in: eventIds } }] }
      : campaignIds.length
        ? { campaignId: { $in: campaignIds } }
        : { eventId: { $in: eventIds } };
    const rows = await strapi.entityService.findMany(UID_RECAP, {
      filters,
      fields: [
        'id', 'campaignId', 'eventId', 'showTitle', 'venue', 'city', 'region',
        'showStartedAt', 'showModeType', 'nightSlug', 'publicStory', 'lineup',
        'heroFocalX', 'heroFocalY',
      ],
      populate: { coverImage: true, heroImage: true },
      limit: 200,
    });
    return rows || [];
  }

  function recapForAttendance(recaps, attendance) {
    const campaignId = pure.trimText(attendance.campaignId);
    const eventId = pure.relId(attendance.eventId ?? attendance.event);
    return (recaps || []).find((recap) => {
      if (campaignId && pure.trimText(recap.campaignId) === campaignId) return true;
      if (eventId && Number(recap.eventId) === Number(eventId)) return true;
      return false;
    }) || null;
  }

  async function loadCandidateGalleries({ userId, attendances, recaps }) {
    const eventIds = [...new Set(attendances.map((row) => pure.relId(row.eventId ?? row.event)).filter(Boolean))];
    const recapIds = [...new Set(recaps.map((row) => pure.positiveId(row.id)).filter(Boolean))];
    const campaignIds = [...new Set(attendances.map((row) => pure.trimText(row.campaignId)).filter(Boolean))];
    if (!eventIds.length && !recapIds.length && !campaignIds.length) return [];

    const or = [];
    if (eventIds.length) or.push({ event: { id: { $in: eventIds } } });
    if (recapIds.length) or.push({ showRecap: { id: { $in: recapIds } } });
    const rows = await strapi.entityService.findMany(UID_UPDATE, {
      filters: or.length ? { status: 'published', $or: or } : { status: 'published', id: { $in: [] } },
      fields: ['id', 'publishedAt', 'status'],
      populate: {
        event: { fields: ['id'] },
        showRecap: { fields: ['id', 'campaignId', 'eventId'] },
      },
      limit: 80,
    });
    const updateIds = (rows || []).map((row) => row.id).filter(Boolean);
    if (!updateIds.length) return [];
    const visible = await updates.listAccessibleByIds({ userId, updateIds });
    if (visible.error) return [];
    return (visible.data || []).filter((gallery) => !gallery.locked && Number(gallery.photoCount || 0) > 0);
  }

  function relationshipForAttendance(facts, attendance, { includeOrdinals = true } = {}) {
    const bandId = Number(pure.relId(attendance.band?.id ?? attendance.band));
    const group = facts.get(bandId);
    if (!group) return null;
    const ordinal = includeOrdinals ? group.ordinalById.get(Number(attendance.id)) : null;
    return {
      nightCount: group.nightCount,
      cities: group.cities,
      firstNightDate: group.firstNightDate,
      latestNightDate: group.latestNightDate,
      showOrdinal: Number.isInteger(ordinal) && ordinal > 0 ? ordinal : null,
    };
  }

  function buildMemories({ attendances, bands, events, recaps, galleries, includeOrdinals = true }) {
    const uniqueAll = pure.dedupeAttendancesToMemories(attendances);
    const facts = pure.relationshipFactsByArtist(uniqueAll, { includeOrdinals });
    return uniqueAll.slice(0, pure.MAX_PASSPORT_MEMORIES).map((attendance) => {
      const bandId = pure.relId(attendance.band?.id ?? attendance.band);
      const eventId = pure.relId(attendance.eventId ?? attendance.event);
      const recap = recapForAttendance(recaps, attendance);
      const matched = (galleries || []).filter((gallery) => {
        const context = {
          eventId: gallery.eventId || gallery.show?.eventId || null,
          campaignId: gallery.showCampaignId || gallery.campaignId || gallery.show?.campaignId || null,
        };
        return showContext.rowMatchesShow(attendance, context) || pure.galleryMatchesAttendance(gallery, attendance);
      });
      return pure.serializePassportMemory({
        attendance,
        artist: bands.get(Number(bandId)) || null,
        event: events.get(Number(eventId)) || null,
        recap,
        galleries: matched,
        relationship: relationshipForAttendance(facts, attendance, { includeOrdinals }),
      });
    }).filter(Boolean);
  }

  async function listMemories({ userId }) {
    const uid = pure.positiveId(userId);
    if (!uid) return { error: 'unauthorized', status: 401, message: 'Authentication required' };

    const fans = await loadClaimedFans(uid);
    const loaded = await loadCanonicalAttendances(fans.map((fan) => fan.id));
    const attendances = loaded.rows;
    const unique = pure.dedupeAttendancesToMemories(attendances);
    const bandIds = unique.map((row) => pure.relId(row.band?.id ?? row.band));
    const eventIds = unique.map((row) => pure.relId(row.eventId ?? row.event));
    const [bands, events, recaps] = await Promise.all([
      loadBandsByIds(bandIds),
      loadEventsByIds(eventIds),
      loadRecapsForAttendances(unique),
    ]);
    const galleries = await loadCandidateGalleries({ userId: uid, attendances: unique, recaps });
    const memories = buildMemories({
      attendances: unique,
      bands,
      events,
      recaps,
      galleries,
      includeOrdinals: !loaded.truncated,
    });
    const artistIds = new Set(memories.map((row) => row.artist?.id).filter(Boolean));
    return {
      data: {
        memories,
        count: memories.length,
        artistCount: artistIds.size,
      },
    };
  }

  async function getMemory({ userId, attendanceId }) {
    const uid = pure.positiveId(userId);
    const id = pure.positiveId(attendanceId);
    if (!uid) return { error: 'unauthorized', status: 401, message: 'Authentication required' };
    if (!id) return { error: 'not_found', status: 404, message: 'Memory not found' };

    const fans = await loadClaimedFans(uid);
    const fanIds = new Set(fans.map((fan) => Number(fan.id)));
    const row = await strapi.entityService.findOne(UID_ATTENDANCE, id, {
      fields: [
        'id', 'checkedInAt', 'campaignId', 'venue', 'city', 'region', 'country',
        'showTitle', 'showDate', 'suppressedDuplicate',
      ],
      populate: {
        fan: { fields: ['id'] },
        band: { fields: ['id'] },
        event: { fields: ['id'] },
      },
    });
    if (!row || !isCanonicalAttendance(row)) {
      return { error: 'not_found', status: 404, message: 'Memory not found' };
    }
    const fanId = pure.relId(row.fan?.id ?? row.fan);
    if (!fanId || !fanIds.has(Number(fanId))) {
      return { error: 'not_found', status: 404, message: 'Memory not found' };
    }

    const siblings = await loadCanonicalAttendances([fanId]);
    const [bands, events, recaps] = await Promise.all([
      loadBandsByIds([pure.relId(row.band?.id ?? row.band)]),
      loadEventsByIds([pure.relId(row.eventId ?? row.event)]),
      loadRecapsForAttendances([row]),
    ]);
    const candidates = await loadCandidateGalleries({ userId: uid, attendances: [row], recaps });
    const galleries = (candidates || []).filter((gallery) => {
      const context = {
        eventId: gallery.eventId || gallery.show?.eventId || null,
        campaignId: gallery.showCampaignId || gallery.campaignId || gallery.show?.campaignId || null,
      };
      return showContext.rowMatchesShow(row, context) || pure.galleryMatchesAttendance(gallery, row);
    });
    const siblingRows = siblings.rows.slice()
    if (!siblingRows.some((item) => Number(item.id) === Number(id))) siblingRows.push(row)
    const uniqueSiblings = pure.dedupeAttendancesToMemories(siblingRows)
    const includeOrdinals = !siblings.truncated && siblings.rows.length > 0
    const facts = pure.relationshipFactsByArtist(uniqueSiblings, { includeOrdinals })
    const memory = pure.serializePassportMemory({
      attendance: row,
      artist: bands.get(Number(pure.relId(row.band?.id ?? row.band))) || null,
      event: events.get(Number(pure.relId(row.eventId ?? row.event))) || null,
      recap: recapForAttendance(recaps, row),
      galleries,
      relationship: relationshipForAttendance(facts, row, { includeOrdinals }),
    })
    if (!memory) return { error: 'not_found', status: 404, message: 'Memory not found' };
    return { data: { memory } };
  }

  return { listGallerySaves, saveGallery, removeGallery, listMemories, getMemory };
}

module.exports = { createFanPassportService, UID_SAVE };
