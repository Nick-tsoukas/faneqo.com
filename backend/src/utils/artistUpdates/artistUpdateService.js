'use strict';

const crypto = require('crypto');
const { requireBandPermission, userHasBandRole, ROLE_OWNER } = require('../bandRoles');
const { authorizeUploadFile } = require('../inbox/inboxPure');
const { canonicalAttendanceFilters } = require('../fans/canonicalAttendance');
const pure = require('./artistUpdatePure');
const rocksnapsPure = require('../galleries/rocksnapsPure');
const mediaPure = require('./protectedMediaPure');
const showContext = require('./showContextPure');
const passportPure = require('../passport/passportPure');
const { createProtectedMediaService } = require('./protectedMedia');

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
  'performanceStartsAt',
  'recapGeneratedAt',
  'nightSlug',
  'publicStory',
];
const UPDATE_SHOW_POPULATE = {
  media: true,
  event: { fields: EVENT_FIELDS, populate: { image: true } },
  showRecap: { fields: SHOW_RECAP_FIELDS, populate: { coverImage: true } },
  band: { fields: ['id', 'name', 'slug'], populate: { bandImg: true } },
  createdByUser: { fields: ['id'] },
};

function relId(row, key) {
  const value = row?.[key];
  if (value == null) return null;
  if (typeof value === 'object') return value.id || value.data?.id || null;
  return value;
}

function log(strapi, event, fields = {}) {
  const parts = Object.entries(fields)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([k, v]) => `${k}=${v}`);
  strapi.log.info(`[Faneqo Artist Updates] ${event}${parts.length ? ` ${parts.join(' ')}` : ''}`);
}

async function loadBandViewer(strapi, { userId, bandId }) {
  if (!userId) return { userId: null, isArtist: false, fan: null };
  const access = bandId
    ? await requireBandPermission(strapi, userId, bandId, 'editBand')
    : null;
  const fans = await strapi.entityService.findMany('api::fan.fan', {
    filters: { band: bandId, accountUser: userId },
    fields: ['id', 'status'],
    limit: 1,
  });
  const fan = fans?.[0] || null;
  return {
    userId,
    isArtist: !!access,
    fan: fan ? { id: fan.id, status: fan.status } : null,
  };
}

async function loadAttendanceHits(strapi, { fanId, eventIds, campaignIds }) {
  const hits = { eventIds: new Set(), campaignIds: new Set() };
  if (!fanId) return hits;
  const ev = [...new Set((eventIds || []).map((id) => Number(id)).filter((n) => Number.isInteger(n) && n > 0))];
  const camps = [...new Set((campaignIds || []).map((id) => String(id || '').trim()).filter(Boolean))];
  const jobs = [];
  if (ev.length) {
    jobs.push(
      strapi.entityService.findMany('api::fan-show-attendance.fan-show-attendance', {
        filters: canonicalAttendanceFilters({ fan: fanId, event: { id: { $in: ev } } }),
        fields: ['id', 'campaignId'],
        populate: { event: { fields: ['id'] } },
        limit: Math.min(Math.max(ev.length, 8), 200),
      })
    );
  }
  if (camps.length) {
    jobs.push(
      strapi.entityService.findMany('api::fan-show-attendance.fan-show-attendance', {
        filters: canonicalAttendanceFilters({ fan: fanId, campaignId: { $in: camps } }),
        fields: ['id', 'campaignId'],
        populate: { event: { fields: ['id'] } },
        limit: Math.min(Math.max(camps.length, 8), 200),
      })
    );
  }
  const batches = await Promise.all(jobs);
  for (const rows of batches) {
    const found = showContext.attendanceHitsFromRows(rows);
    found.eventIds.forEach((id) => hits.eventIds.add(id));
    found.campaignIds.forEach((id) => hits.campaignIds.add(id));
  }
  return hits;
}

function viewerWithHits(base, context, hits) {
  const eventId = context?.eventId || null;
  const campaignId = context?.campaignId || null;
  return {
    ...base,
    attendedEventId: eventId && hits.eventIds.has(String(eventId)) ? eventId : null,
    attendedCampaignId: campaignId && hits.campaignIds.has(String(campaignId)) ? campaignId : null,
  };
}

async function loadViewerContext(strapi, { userId, bandId, eventId, campaignId }) {
  const base = await loadBandViewer(strapi, { userId, bandId });
  const hits = await loadAttendanceHits(strapi, {
    fanId: base.fan?.id,
    eventIds: eventId ? [eventId] : [],
    campaignIds: campaignId ? [campaignId] : [],
  });
  return viewerWithHits(base, { eventId, campaignId }, hits);
}

function mapShow(event, recap, context, artist = null) {
  if (!event && !recap && !context?.eventId && !context?.campaignId && !context?.showRecapId) {
    return null;
  }
  return pure.publicShowShell({
    event,
    recap,
    context,
    artist,
    show: {
      eventId: context?.eventId || event?.id || recap?.eventId || null,
      showRecapId: context?.showRecapId || recap?.id || null,
      showModeType: context?.showModeType || recap?.showModeType || null,
      title: event?.title || recap?.showTitle || null,
      venue: event?.venue || recap?.venue || null,
      city: event?.city || recap?.city || null,
      date: event?.date || recap?.performanceStartsAt || recap?.showStartedAt || recap?.recapGeneratedAt || null,
    },
  });
}

function toRecord(row) {
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
    bodyText: row.bodyText || '',
    contentKind: row.contentKind || pure.contentKindFromCount(files.length),
    visibility: row.visibility,
    status: row.status,
    publishedAt: row.publishedAt || null,
    photoCount: files.length,
    mediaFiles: files,
    mediaIds: files.map((file) => file.id).filter(Boolean),
    mediaCaptions: row.mediaCaptions && typeof row.mediaCaptions === 'object' && !Array.isArray(row.mediaCaptions)
      ? row.mediaCaptions
      : {},
    coverMediaId: row.coverMediaId || null,
    galleryVersion: Number(row.galleryVersion) || 0,
    media: [],
    bandId: relId(row, 'band'),
    eventId: context.eventId,
    showRecapId: context.showRecapId,
    showCampaignId: context.campaignId,
    campaignId: context.campaignId,
    showModeType: context.showModeType,
    showRecap: recap,
    event: row.event && typeof row.event === 'object' ? row.event : null,
    artist: row.band && typeof row.band === 'object'
      ? {
        id: row.band.id,
        name: row.band.name || null,
        slug: row.band.slug || null,
        bandImg: row.band.bandImg || null,
      }
      : null,
    showContextError: resolved.ok ? null : resolved.error,
    show: mapShow(row.event, recap, context, row.band),
  };
}

function serializeViewerMedia(record, access, extraHosts) {
  if (!access.allowed || access.media !== 'full') return [];
  return pure.serializeUpdateMediaList(record.mediaFiles, {
    updateId: record.id,
    visibility: record.visibility,
    captions: record.mediaCaptions,
    extraHosts,
  });
}

async function findBand(strapi, bandId) {
  if (!bandId) return null;
  return strapi.entityService.findOne('api::band.band', bandId, {
    fields: ['id', 'name', 'slug'],
  });
}

/**
 * `allowUpdateId` / `alreadyAttachedIds` exist for editing. A photo the gallery
 * already owns passed authorization when it was published; re-running the
 * uploader-grace rule on it would lock the artist out of their own older
 * galleries. It still takes part in the storage-mix check.
 */
async function authorizeUpdateMedia(strapi, userId, mediaIds, bandId, {
  allowUpdateId = null,
  alreadyAttachedIds = [],
} = {}) {
  const attached = new Set(pure.uniquePositiveIds(alreadyAttachedIds));
  const ids = pure.uniquePositiveIds(mediaIds);
  const rows = await strapi.entityService.findMany('plugin::upload.file', {
    filters: { id: { $in: ids } },
    limit: Math.min(Math.max(ids.length, 1), pure.MAX_IMAGES),
  });
  const byId = new Map((rows || []).map((file) => [Number(file.id), file]));
  const files = ids.map((id) => byId.get(Number(id))).filter(Boolean);
  if (files.length !== ids.length) {
    log(strapi, 'media:authorize:reject', { reason: 'missing_file' });
    return { error: 'invalid_attachment', status: 400, message: 'Image is not available' };
  }

  for (const file of files) {
    if (attached.has(Number(file.id))) continue;
    if (mediaPure.isProtectedFile(file)) {
      const auth = pure.authorizeArtistUpdateFile(file, { userId, bandId });
      if (auth.error) {
        log(strapi, 'media:authorize:reject', {
          reason: auth.reason || auth.error,
          mediaId: file.id,
        });
        return { error: auth.error, status: 400, message: auth.message || 'Image is not available' };
      }
      continue;
    }

    const auth = authorizeUploadFile(file, userId);
    if (auth.error) {
      log(strapi, 'media:authorize:reject', { reason: auth.error, mediaId: file.id });
      return { error: auth.error, status: 400, message: auth.message || 'Image is not available' };
    }
  }

  const mix = pure.evaluateMediaStorageMix(files);
  if (mix.error) {
    log(strapi, 'media:authorize:reject', { reason: mix.error });
    return mix;
  }

  const used = await strapi.entityService.findMany('api::artist-update.artist-update', {
    filters: { media: { id: { $in: ids } } },
    fields: ['id'],
    limit: 4,
  });
  const foreignUse = (used || []).find((row) => (
    !allowUpdateId || Number(row.id) !== Number(allowUpdateId)
  ));
  if (foreignUse) {
    log(strapi, 'media:authorize:reject', { reason: 'media_already_attached' });
    return { error: 'media_already_attached', status: 400, message: 'One of these photos is already in another gallery.' };
  }
  return { files, protected: !!mix.protected };
}

async function uniqueSlug(strapi, bandId, title) {
  const base = pure.slugify(title, `update-${Date.now().toString(36)}`);
  let slug = base;
  for (let i = 0; i < 8; i += 1) {
    const existing = await strapi.entityService.findMany('api::artist-update.artist-update', {
      filters: { band: bandId, slug },
      fields: ['id'],
      limit: 1,
    });
    if (!existing?.length) return slug;
    slug = `${base}-${i + 2}`;
  }
  return `${base}-${Date.now().toString(36)}`;
}

function isUniqueViolation(err) {
  if (!err) return false;
  const code = String(err.code || '');
  if (code === '23505' || code === 'UNIQUE_VIOLATION') return true;
  const msg = String(err.message || '').toLowerCase();
  return msg.includes('unique') && (
    msg.includes('constraint') || msg.includes('duplicate') || msg.includes('idempotency')
  );
}

async function findByPublishKey(strapi, key) {
  if (!key) return null;
  const rows = await strapi.entityService.findMany('api::artist-update.artist-update', {
    filters: { publishIdempotencyKey: key },
    limit: 1,
    populate: UPDATE_SHOW_POPULATE,
  });
  return rows?.[0] || null;
}

function createArtistUpdateService(strapi) {
  const protectedMedia = createProtectedMediaService(strapi);

  function presentOwned(row) {
    const record = toRecord(row);
    record.media = serializeViewerMedia(record, { allowed: true, media: 'full' }, protectedMedia.cdnHosts());
    return {
      data: {
        ...record,
        band: row.band
          ? { id: row.band.id, name: row.band.name, slug: row.band.slug }
          : null,
      },
    };
  }

  async function loadOwnedRecap({ bandId, showRecapId, campaignId }) {
    if (showRecapId) {
      const recap = await strapi.entityService.findOne('api::show-recap.show-recap', showRecapId, {
        fields: SHOW_RECAP_FIELDS,
        populate: { band: { fields: ['id'] } },
      });
      return recap || null;
    }
    if (!campaignId) return null;
    const rows = await strapi.entityService.findMany('api::show-recap.show-recap', {
      filters: { campaignId, band: bandId },
      fields: SHOW_RECAP_FIELDS,
      populate: { band: { fields: ['id'] } },
      limit: 1,
    });
    return rows?.[0] || null;
  }

  async function relationshipForNight({ fanId, context, youWereThere }) {
    if (!youWereThere || !fanId || !showContext.showContextHasNight(context)) return null;
    const rows = await strapi.entityService.findMany('api::fan-show-attendance.fan-show-attendance', {
      filters: canonicalAttendanceFilters({ fan: fanId }),
      fields: ['id', 'checkedInAt', 'campaignId', 'suppressedDuplicate'],
      populate: { event: { fields: ['id'] } },
      sort: { checkedInAt: 'asc' },
      limit: 200,
    });
    const ordinal = showContext.ordinalForShow(rows, context);
    if (ordinal !== 1) return null;
    return { firstShow: true };
  }

  async function createAndPublish({
    userId,
    bandId,
    title,
    bodyText,
    visibility,
    mediaIds,
    eventId,
    showRecapId,
    campaignId,
    publishIdempotencyKey,
    coverMediaId,
    mediaCaptions,
  }) {
    if (!userId) return { error: 'unauthorized', status: 401, message: 'Authentication required' };
    const access = await requireBandPermission(strapi, userId, bandId, 'editBand');
    if (!access) return { error: 'forbidden', status: 403, message: 'Not authorized for this band' };

    const clientKey = pure.normalizePublishIdempotencyKey(publishIdempotencyKey);
    if (clientKey && clientKey.error) {
      return { error: clientKey.error, status: 400, message: clientKey.message };
    }
    const scopedKey = clientKey ? pure.scopedPublishIdempotencyKey(userId, bandId, clientKey) : null;
    if (scopedKey) {
      const existing = await findByPublishKey(strapi, scopedKey);
      if (existing) {
        if (!pure.publishReplayOwned({ existing, userId, bandId })) {
          return { error: 'forbidden', status: 403, message: 'Not authorized for this band' };
        }
        return presentOwned(existing);
      }
    }

    const delivery = protectedMedia.configured();
    const validated = pure.validatePublishInput({
      title,
      bodyText,
      visibility,
      mediaIds,
      eventId,
      showRecapId,
      campaignId,
      protectedReady: delivery.ready,
    });
    if (validated.error) return { error: validated.error, status: 400, message: validated.message };

    const recap = await loadOwnedRecap({
      bandId,
      showRecapId: validated.showRecapId,
      campaignId: validated.campaignId,
    });
    if ((validated.showRecapId || validated.campaignId) && !recap) {
      return { error: 'invalid_show', status: 400, message: 'Choose a show for this band.' };
    }
    if (recap) {
      const recapBand = recap.band?.id || recap.band;
      if (Number(recapBand) !== Number(bandId)) {
        return { error: 'show_not_owned', status: 403, message: 'Choose a show for this band.' };
      }
    }

    let eventRow = null;
    const claimedEventId = validated.eventId || recap?.eventId || null;
    if (claimedEventId) {
      eventRow = await strapi.entityService.findOne('api::event.event', claimedEventId, {
        fields: EVENT_FIELDS,
        populate: { band: { fields: ['id'] } },
      });
      const eventBand = eventRow?.band?.id || eventRow?.band || null;
      if (!eventRow) {
        return { error: 'invalid_event', status: 400, message: 'Choose a show for this band.' };
      }
      if (Number(eventBand) !== Number(bandId)) {
        return { error: 'show_not_owned', status: 403, message: 'Choose a show for this band.' };
      }
    }

    const resolved = showContext.resolveShowContext({
      bandId,
      eventId: validated.eventId,
      campaignId: validated.campaignId,
      showRecapId: validated.showRecapId,
      recap,
      event: eventRow,
    });
    if (resolved.error) {
      return { error: resolved.error, status: 400, message: resolved.message };
    }
    if (validated.visibility === 'show_attendees' && !showContext.showContextHasNight(resolved.context)) {
      return { error: 'show_required', status: 400, message: 'Choose the show these photos belong to.' };
    }

    const media = await authorizeUpdateMedia(strapi, userId, validated.mediaIds, bandId);
    if (media.error) return media;
    if (mediaPure.isGatedVisibility(validated.visibility)) {
      const leak = (media.files || []).find((file) => !mediaPure.isProtectedFile(file));
      if (leak) {
        return {
          error: 'unprotected_media',
          status: 400,
          message: 'Exclusive galleries can only use protected photos.',
        };
      }
    }

    const captions = pure.normalizeMediaCaptions(mediaCaptions, validated.mediaIds);
    if (captions.error) return { error: captions.error, status: captions.status || 400, message: captions.message };
    const persistCover = pure.resolveCoverMediaId(coverMediaId, validated.mediaIds);

    const persistTitle = pure.deriveShowPhotosTitle({
      title: validated.title,
      recap,
      event: eventRow,
    }) || pure.fallbackGalleryTitle(new Date().toISOString());
    const slug = await uniqueSlug(strapi, bandId, persistTitle || validated.bodyText);
    const persistEventId = resolved.context.eventId ? Number(resolved.context.eventId) : null;
    const persistRecapId = resolved.context.showRecapId ? Number(resolved.context.showRecapId) : null;
    let row;
    try {
      row = await strapi.entityService.create('api::artist-update.artist-update', {
        data: {
          band: bandId,
          createdByUser: userId,
          title: persistTitle,
          bodyText: validated.bodyText,
          slug,
          contentKind: validated.contentKind,
          media: validated.mediaIds,
          visibility: validated.visibility,
          event: persistEventId,
          showRecap: persistRecapId,
          coverMediaId: persistCover,
          mediaCaptions: captions.captions,
          galleryVersion: 0,
          status: 'published',
          publishedAt: new Date().toISOString(),
          ...(scopedKey ? { publishIdempotencyKey: scopedKey } : {}),
        },
        populate: UPDATE_SHOW_POPULATE,
      });
    } catch (err) {
      if (scopedKey && isUniqueViolation(err)) {
        const existing = await findByPublishKey(strapi, scopedKey);
        if (existing && pure.publishReplayOwned({ existing, userId, bandId })) {
          return presentOwned(existing);
        }
      }
      throw err;
    }
    log(strapi, 'update:publish', {
      updateId: row.id,
      bandId,
      visibility: validated.visibility,
      photoCount: validated.mediaIds.length,
      eventId: persistEventId,
      showRecapId: persistRecapId,
    });
    try {
      const { produceArtistUpdatePublished } = require('../relationshipEvents/relationshipEventProducers');
      await produceArtistUpdatePublished(strapi, row);
    } catch (err) {
      strapi.log?.warn?.(`[RelationshipEvent] artist_update events skipped: ${err.message}`);
    }
    return presentOwned(row);
  }

  async function updateVisibility({ userId, updateId, visibility }) {
    if (!userId) return { error: 'unauthorized', status: 401, message: 'Authentication required' };
    const rows = await strapi.entityService.findMany('api::artist-update.artist-update', {
      filters: { id: updateId },
      limit: 1,
      populate: UPDATE_SHOW_POPULATE,
    });
    const row = rows?.[0];
    if (!row) return { error: 'not_found', status: 404, message: 'Update not found' };
    const bandId = relId(row, 'band');
    const access = await requireBandPermission(strapi, userId, bandId, 'editBand');
    if (!access) return { error: 'forbidden', status: 403, message: 'Not authorized for this band' };

    const record = toRecord(row);
    const resolved = showContext.resolveArtistUpdateShowContext(record);
    const hasNight = resolved.ok && (
      showContext.showContextHasNight(resolved.context) || showContext.hasShowScope(resolved.context)
    );
    const delivery = protectedMedia.configured();
    const change = pure.evaluateVisibilityChange({
      from: record.visibility,
      to: visibility,
      mediaFiles: record.mediaFiles,
      hasNight,
      protectedReady: delivery.ready,
    });
    if (change.error) return change;
    if (!change.unchanged) {
      await strapi.entityService.update('api::artist-update.artist-update', row.id, {
        data: { visibility: change.to },
      });
    }
    const nextRows = await strapi.entityService.findMany('api::artist-update.artist-update', {
      filters: { id: row.id },
      limit: 1,
      populate: UPDATE_SHOW_POPULATE,
    });
    return presentOwned(nextRows?.[0] || { ...row, visibility: change.to });
  }

  async function reloadOwned(updateId) {
    const rows = await strapi.entityService.findMany('api::artist-update.artist-update', {
      filters: { id: updateId },
      limit: 1,
      populate: UPDATE_SHOW_POPULATE,
    });
    return rows?.[0] || null;
  }

  /**
   * Taking a gallery away from an audience is owner-only, like billing and
   * team. Managers keep ordinary page editing; they just cannot pull published
   * photos back from fans.
   */
  async function loadManageable({ userId, updateId }) {
    if (!userId) {
      return { error: { error: 'unauthorized', status: 401, message: 'Authentication required' } };
    }
    const row = await reloadOwned(updateId);
    if (!row) return { error: { error: 'not_found', status: 404, message: 'Gallery not found' } };
    const bandId = relId(row, 'band');
    const isOwner = await userHasBandRole(strapi, bandId, userId, [ROLE_OWNER]);
    if (!isOwner) {
      return { error: { error: 'forbidden', status: 403, message: 'Only the band owner can do this' } };
    }
    return { row, bandId };
  }

  async function hideGallery({ userId, updateId }) {
    const loaded = await loadManageable({ userId, updateId });
    if (loaded.error) return loaded.error;
    const { row, bandId } = loaded;
    const change = pure.evaluateHide({ status: row.status });
    if (change.error) return change;
    if (!change.unchanged) {
      await strapi.entityService.update('api::artist-update.artist-update', row.id, {
        data: { status: change.to, hiddenAt: new Date().toISOString() },
      });
      log(strapi, 'update:hide', { updateId: row.id, bandId });
    }
    return presentOwned(await reloadOwned(row.id) || row);
  }

  async function restoreGallery({ userId, updateId }) {
    const loaded = await loadManageable({ userId, updateId });
    if (loaded.error) return loaded.error;
    const { row, bandId } = loaded;
    const change = pure.evaluateRestore({ status: row.status });
    if (change.error) return change;
    if (!change.unchanged) {
      await strapi.entityService.update('api::artist-update.artist-update', row.id, {
        data: { status: change.to, hiddenAt: null },
      });
      log(strapi, 'update:restore', { updateId: row.id, bandId });
    }
    return presentOwned(await reloadOwned(row.id) || row);
  }

  async function detachFromRecap({ userId, updateId }) {
    const loaded = await loadManageable({ userId, updateId });
    if (loaded.error) return loaded.error;
    const { row, bandId } = loaded;
    const detach = pure.evaluateRecapDetach({
      visibility: row.visibility,
      showRecapId: relId(row, 'showRecap'),
    });
    if (detach.error) return detach;
    await strapi.entityService.update('api::artist-update.artist-update', row.id, {
      data: { showRecap: null },
    });
    log(strapi, 'update:detach_recap', { updateId: row.id, bandId });
    return presentOwned(await reloadOwned(row.id) || row);
  }

  /**
   * Editing authority. `editBand` — not the owner-only take-down permission,
   * and never the public payload, which is a read model for fans.
   */
  async function loadEditable({ userId, updateId }) {
    if (!userId) {
      return { error: { error: 'unauthorized', status: 401, message: 'Authentication required' } };
    }
    const row = await reloadOwned(updateId);
    if (!row) return { error: { error: 'not_found', status: 404, message: 'Gallery not found' } };
    const bandId = relId(row, 'band');
    const access = await requireBandPermission(strapi, userId, bandId, 'editBand');
    if (!access) {
      return { error: { error: 'forbidden', status: 403, message: 'Not authorized for this band' } };
    }
    return { row, bandId };
  }

  function manageView(row) {
    const record = toRecord(row);
    const serialized = pure.serializeUpdateMediaList(record.mediaFiles, {
      updateId: record.id,
      visibility: record.visibility,
      captions: record.mediaCaptions,
      extraHosts: protectedMedia.cdnHosts(),
    });
    const media = serialized.map((item, index) => ({
      mediaId: item.mediaId,
      order: index,
      caption: item.caption || null,
      protected: !!item.protected,
      thumbUrl: item.thumbUrl || null,
      url: item.url || null,
      width: item.width || null,
      height: item.height || null,
    }));
    return {
      data: {
        id: record.id,
        slug: record.slug,
        bandId: relId(row, 'band'),
        bandSlug: row.band?.slug || null,
        title: record.title,
        caption: record.bodyText || '',
        visibility: record.visibility,
        status: record.status,
        kind: record.showRecapId ? 'show' : 'general',
        showRecapId: record.showRecapId ? Number(record.showRecapId) : null,
        eventId: record.eventId ? Number(record.eventId) : null,
        coverMediaId: pure.resolveCoverMediaId(record.coverMediaId, record.mediaIds),
        version: record.galleryVersion,
        showOnRockSnaps: row.showOnRockSnaps === true,
        rocksnapsPublishedAt: row.rocksnapsPublishedAt || null,
        media,
      },
    };
  }

  async function presentOwnedById({ userId, updateId }) {
    const loaded = await loadEditable({ userId, updateId });
    if (loaded.error) return loaded.error;
    return presentOwned(loaded.row);
  }

  async function getManage({ userId, updateId }) {
    const loaded = await loadEditable({ userId, updateId });
    if (loaded.error) return loaded.error;
    return manageView(loaded.row);
  }

  /**
   * Media the editor may newly attach: staged files from the caller's own
   * draft session, with a storage class that matches the target audience.
   */
  async function authorizeAddedMedia({ userId, bandId, addedIds, sessionId, visibility }) {
    if (!addedIds.length) return { ok: true };
    const draftPure = require('../galleries/galleryDraftPure');
    const key = String(sessionId || '').trim();
    if (!key) {
      return { error: 'foreign_media', status: 403, message: 'Those photos are not part of this gallery.' };
    }
    const drafts = await strapi.entityService.findMany('api::gallery-draft.gallery-draft', {
      filters: { sessionId: key, createdByUser: userId, band: bandId },
      limit: 1,
      fields: ['id', 'sessionId', 'status'],
    });
    if (!drafts?.length) {
      return { error: 'foreign_media', status: 403, message: 'Those photos are not part of this gallery.' };
    }
    const rows = await strapi.entityService.findMany('plugin::upload.file', {
      filters: { id: { $in: addedIds } },
      limit: Math.min(Math.max(addedIds.length, 1), pure.MAX_IMAGES),
    });
    const byId = new Map((rows || []).map((file) => [Number(file.id), file]));
    const wanted = mediaPure.isGatedVisibility(visibility)
      ? draftPure.CLASSIFICATION_PROTECTED
      : draftPure.CLASSIFICATION_PUBLIC;
    for (const id of addedIds) {
      const file = byId.get(Number(id));
      if (!draftPure.stagedFileOwnedBy(file, { sessionId: key, userId })) {
        log(strapi, 'edit:reject', { reason: 'foreign_media', mediaId: id });
        return { error: 'foreign_media', status: 403, message: 'Those photos are not part of this gallery.' };
      }
      if (draftPure.stagedFileClassification(file) !== wanted) {
        log(strapi, 'edit:reject', { reason: 'wrong_classification', mediaId: id });
        return {
          error: 'unsafe_visibility_transition',
          status: 400,
          message: 'These photos were uploaded for a different audience. Upload them again for this one.',
        };
      }
    }
    return { ok: true, files: addedIds.map((id) => byId.get(Number(id))).filter(Boolean) };
  }

  async function releaseDroppedMedia(droppedIds) {
    const ids = pure.uniquePositiveIds(droppedIds);
    if (!ids.length) return { deleted: 0, skipped: 0 };
    // eslint-disable-next-line global-require
    const { loadReferencedProtectedMediaIds } = require('./protectedMedia');
    const referenced = await loadReferencedProtectedMediaIds(strapi, ids);
    const rows = await strapi.entityService.findMany('plugin::upload.file', {
      filters: { id: { $in: ids } },
      limit: Math.min(Math.max(ids.length, 1), pure.MAX_IMAGES),
    });
    let deleted = 0;
    let skipped = 0;
    for (const file of rows || []) {
      if (referenced.has(Number(file.id))) {
        skipped += 1;
        continue;
      }
      try {
        await protectedMedia.deleteMediaFile(file);
        deleted += 1;
      } catch (err) {
        skipped += 1;
        log(strapi, 'edit:media_delete_failed', { mediaId: file.id });
      }
    }
    return { deleted, skipped };
  }

  async function saveManage({
    userId,
    updateId,
    version,
    title,
    caption,
    mediaOrder,
    mediaCaptions,
    coverMediaId,
    visibility,
    sessionId,
  }) {
    const loaded = await loadEditable({ userId, updateId });
    if (loaded.error) return loaded.error;
    const { row, bandId } = loaded;
    const record = toRecord(row);

    if (Number(version) !== Number(record.galleryVersion)) {
      log(strapi, 'edit:reject', { updateId: record.id, reason: 'version_conflict' });
      return {
        error: 'version_conflict',
        status: 409,
        message: 'This gallery changed somewhere else. Reload to pick up the latest version.',
        version: record.galleryVersion,
      };
    }

    const currentIds = pure.uniquePositiveIds(record.mediaIds);
    const nextIds = mediaOrder === undefined ? currentIds : pure.uniquePositiveIds(mediaOrder);
    if (!nextIds.length) {
      return { error: 'media_required', status: 400, message: 'A gallery needs at least one photo.' };
    }
    if (nextIds.length > pure.MAX_IMAGES) {
      return { error: 'too_many_images', status: 400, message: `You can add up to ${pure.MAX_IMAGES} photos.` };
    }

    const nextVisibility = visibility === undefined
      ? record.visibility
      : pure.defaultVisibility(visibility);
    const added = nextIds.filter((id) => !currentIds.includes(id));
    const dropped = currentIds.filter((id) => !nextIds.includes(id));

    const addedAuth = await authorizeAddedMedia({
      userId,
      bandId,
      addedIds: added,
      sessionId,
      visibility: nextVisibility,
    });
    if (addedAuth.error) return addedAuth;

    const media = await authorizeUpdateMedia(strapi, userId, nextIds, bandId, {
      allowUpdateId: record.id,
      alreadyAttachedIds: currentIds,
    });
    if (media.error) return media;

    if (nextVisibility !== record.visibility) {
      const delivery = protectedMedia.configured();
      const resolvedShow = showContext.resolveArtistUpdateShowContext(record);
      const change = pure.evaluateVisibilityChange({
        from: record.visibility,
        to: nextVisibility,
        mediaFiles: media.files,
        hasNight: resolvedShow.ok && showContext.showContextHasNight(resolvedShow.context),
        protectedReady: delivery.ready,
      });
      if (change.error) {
        log(strapi, 'visibility_migration_refused', { updateId: record.id, reason: change.error });
        return change;
      }
      /**
       * Opening a protected gallery to the world is not a text edit. The editor
       * refuses it here and leaves it to the dedicated audience control, so an
       * accidental save can never republish protected bytes as public files.
       */
      if (mediaPure.isGatedVisibility(record.visibility) && !mediaPure.isGatedVisibility(nextVisibility) && media.protected) {
        log(strapi, 'visibility_migration_refused', { updateId: record.id, reason: 'unsafe_visibility_transition' });
        return {
          error: 'unsafe_visibility_transition',
          status: 400,
          message: 'These photos were stored privately. Upload them again to make this gallery public.',
        };
      }
    }

    const captions = pure.normalizeMediaCaptions(
      mediaCaptions === undefined ? record.mediaCaptions : mediaCaptions,
      nextIds,
      { dropUnknown: true }
    );
    if (captions.error) return { error: captions.error, status: captions.status || 400, message: captions.message };

    const nextCover = pure.resolveCoverMediaId(
      coverMediaId === undefined ? record.coverMediaId : coverMediaId,
      nextIds
    );
    const nextTitle = title === undefined
      ? record.title
      : (String(title || '').trim().slice(0, pure.MAX_TITLE) || null);
    if (title !== undefined && String(title || '').trim().length > pure.MAX_TITLE) {
      return { error: 'title_too_long', status: 400, message: `Keep the title under ${pure.MAX_TITLE} characters.` };
    }
    const nextCaption = caption === undefined ? (record.bodyText || '') : String(caption || '').trim();
    if (nextCaption.length > pure.MAX_CAPTION) {
      return { error: 'caption_too_long', status: 400, message: `Keep the caption under ${pure.MAX_CAPTION} characters.` };
    }

    const changed = nextTitle !== record.title
      || nextCaption !== (record.bodyText || '')
      || nextVisibility !== record.visibility
      || Number(nextCover || 0) !== Number(record.coverMediaId || 0)
      || JSON.stringify(nextIds) !== JSON.stringify(currentIds)
      || JSON.stringify(captions.captions) !== JSON.stringify(record.mediaCaptions || {});

    if (!changed) return manageView(row);

    await strapi.entityService.update('api::artist-update.artist-update', record.id, {
      data: {
        title: nextTitle,
        bodyText: nextCaption,
        visibility: nextVisibility,
        media: nextIds,
        mediaCaptions: captions.captions,
        coverMediaId: nextCover,
        contentKind: pure.contentKindFromCount(nextIds.length),
        galleryVersion: Number(record.galleryVersion) + 1,
      },
    });

    let released = { deleted: 0, skipped: 0 };
    if (dropped.length) released = await releaseDroppedMedia(dropped);

    log(strapi, 'edit_saved', {
      updateId: record.id,
      bandId,
      version: Number(record.galleryVersion) + 1,
      photoCount: nextIds.length,
      added: added.length,
      dropped: dropped.length,
      bytesDeleted: released.deleted,
    });
    return manageView(await reloadOwned(record.id) || row);
  }

  async function present(row, viewer, { includeRelationship = false } = {}) {
    const record = toRecord(row);
    const access = pure.decideArtistUpdateAccess({
      update: record,
      viewer,
      visitorClaim: null,
    });
    if (!access.allowed && !access.teaser) return { error: 'not_found', status: 404, message: 'Update not found' };
    if (!access.allowed) {
      log(strapi, 'update:access_denied', { updateId: record.id, reason: access.reason });
    } else {
      log(strapi, 'update:view', { updateId: record.id, visibility: record.visibility });
    }
    if (includeRelationship && access.youWereThere) {
      access.relationship = await relationshipForNight({
        fanId: viewer.fan?.id,
        context: {
          eventId: record.eventId,
          campaignId: record.showCampaignId,
        },
        youWereThere: true,
      });
    }
    record.media = serializeViewerMedia(record, access, protectedMedia.cdnHosts());
    const teaser = pure.publicTeaser(record, access);
    return { data: teaser };
  }

  async function listForBand({ bandId, bandSlug, userId }) {
    let band = bandId ? await findBand(strapi, bandId) : null;
    if (!band && bandSlug) {
      const rows = await strapi.entityService.findMany('api::band.band', {
        filters: { slug: bandSlug },
        fields: ['id', 'name', 'slug'],
        limit: 1,
      });
      band = rows?.[0] || null;
    }
    if (!band) return { error: 'not_found', status: 404, message: 'Band not found' };
    const rows = await strapi.entityService.findMany('api::artist-update.artist-update', {
      filters: { band: band.id, status: 'published' },
      sort: { publishedAt: 'desc' },
      limit: 12,
      populate: UPDATE_SHOW_POPULATE,
    });
    const records = (rows || []).map((row) => toRecord(row));
    const base = await loadBandViewer(strapi, { userId, bandId: band.id });
    const hits = await loadAttendanceHits(strapi, {
      fanId: base.fan?.id,
      eventIds: records.map((record) => record.eventId).filter(Boolean),
      campaignIds: records.map((record) => record.showCampaignId).filter(Boolean),
    });
    const items = [];
    for (const record of records) {
      const viewer = viewerWithHits(base, {
        eventId: record.eventId,
        campaignId: record.showCampaignId,
      }, hits);
      const access = pure.decideArtistUpdateAccess({ update: record, viewer });
      if (!access.allowed && !access.teaser && access.reason === 'draft') continue;
      record.media = serializeViewerMedia(record, access, protectedMedia.cdnHosts());
      items.push(pure.publicTeaser(record, access));
    }
    return { data: { band: { id: band.id, name: band.name, slug: band.slug }, updates: items } };
  }

  async function listAccessibleByIds({ userId, updateIds }) {
    if (!userId) return { error: 'unauthorized', status: 401, message: 'Authentication required' };
    const ids = pure.uniquePositiveIds(updateIds).slice(0, pure.MAX_IMAGES);
    if (!ids.length) return { data: [] };
    const rows = await strapi.entityService.findMany('api::artist-update.artist-update', {
      filters: { id: { $in: ids }, status: 'published' },
      limit: ids.length,
      populate: UPDATE_SHOW_POPULATE,
    });
    const grouped = new Map();
    for (const row of rows || []) {
      const record = toRecord(row);
      if (!record.bandId) continue;
      const key = String(record.bandId);
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push({ row, record });
    }

    const visible = new Map();
    for (const entries of grouped.values()) {
      const bandId = entries[0].record.bandId;
      const base = await loadBandViewer(strapi, { userId, bandId });
      const hits = await loadAttendanceHits(strapi, {
        fanId: base.fan?.id,
        eventIds: entries.map(({ record }) => record.eventId).filter(Boolean),
        campaignIds: entries.map(({ record }) => record.showCampaignId).filter(Boolean),
      });
      for (const { row, record } of entries) {
        const viewer = viewerWithHits(base, {
          eventId: record.eventId,
          campaignId: record.showCampaignId,
        }, hits);
        const access = pure.decideArtistUpdateAccess({ update: record, viewer });
        if (!access.allowed || access.media !== 'full') continue;
        record.media = serializeViewerMedia(record, access, protectedMedia.cdnHosts());
        visible.set(Number(record.id), {
          ...pure.publicTeaser(record, access),
          band: row.band
            ? {
              id: row.band.id,
              name: row.band.name,
              slug: row.band.slug,
              // Public artist image, so Passport can show who a saved gallery is from.
              imageUrl: passportPure.publicArtworkUrl(row.band.bandImg),
            }
            : null,
        });
      }
    }
    return { data: ids.map((id) => visible.get(Number(id))).filter(Boolean) };
  }

  async function getBySlug({ bandSlug, slug, userId }) {
    const bands = await strapi.entityService.findMany('api::band.band', {
      filters: { slug: bandSlug },
      fields: ['id', 'name', 'slug'],
      limit: 1,
    });
    const band = bands?.[0];
    if (!band) return { error: 'not_found', status: 404, message: 'Update not found' };
    const rows = await strapi.entityService.findMany('api::artist-update.artist-update', {
      filters: { band: band.id, slug },
      limit: 1,
      populate: UPDATE_SHOW_POPULATE,
    });
    const row = rows?.[0];
    if (!row) return { error: 'not_found', status: 404, message: 'Update not found' };
    const record = toRecord(row);
    const viewer = await loadViewerContext(strapi, {
      userId,
      bandId: band.id,
      eventId: record.eventId,
      campaignId: record.showCampaignId,
    });
    if (pure.isHiddenStatus(record.status) && !viewer.isArtist) {
      return pure.galleryUnavailableResult();
    }
    const presented = await present(row, viewer, { includeRelationship: true });
    if (presented.error) return presented;
    return { data: { ...presented.data, band: { id: band.id, name: band.name, slug: band.slug } } };
  }

  async function getPublishedBySlug({ bandSlug, slug, userId }) {
    const bands = await strapi.entityService.findMany('api::band.band', {
      filters: { slug: bandSlug },
      fields: ['id', 'name', 'slug'],
      limit: 1,
    });
    const band = bands?.[0];
    if (!band) return { error: 'not_found', status: 404, message: 'Update not found' };
    const rows = await strapi.entityService.findMany('api::artist-update.artist-update', {
      filters: { band: band.id, slug },
      limit: 1,
      populate: UPDATE_SHOW_POPULATE,
    });
    const row = rows?.[0];
    if (!row || !(pure.isAvailableStatus(row.status) || pure.isHiddenStatus(row.status))) {
      return { error: 'not_found', status: 404, message: 'Update not found' };
    }
    const record = toRecord(row);
    const viewer = await loadViewerContext(strapi, {
      userId,
      bandId: band.id,
      eventId: record.eventId,
      campaignId: record.showCampaignId,
    });
    if (pure.isHiddenStatus(record.status) && !viewer.isArtist) {
      return pure.galleryUnavailableResult();
    }
    const presented = await present(row, viewer, { includeRelationship: true });
    if (presented.error) return presented;
    return {
      data: { ...presented.data, band: { id: band.id, name: band.name, slug: band.slug } },
      record,
      row,
      viewer,
    };
  }

  async function listPublishedForRecap({ recapId, bandId, userId }) {
    if (!recapId || !bandId) return [];
    const rows = await strapi.entityService.findMany('api::artist-update.artist-update', {
      filters: { band: bandId, showRecap: recapId, status: 'published' },
      sort: { publishedAt: 'asc' },
      limit: 40,
      populate: UPDATE_SHOW_POPULATE,
    });
    const records = (rows || []).map((row) => ({ row, record: toRecord(row) }));
    const base = await loadBandViewer(strapi, { userId, bandId });
    const hits = await loadAttendanceHits(strapi, {
      fanId: base.fan?.id,
      eventIds: records.map(({ record }) => record.eventId).filter(Boolean),
      campaignIds: records.map(({ record }) => record.showCampaignId).filter(Boolean),
    });
    const items = [];
    for (const { row, record } of records) {
      const viewer = viewerWithHits(base, {
        eventId: record.eventId,
        campaignId: record.showCampaignId,
      }, hits);
      const access = pure.decideArtistUpdateAccess({ update: record, viewer });
      if (!access.allowed && !access.teaser) continue;
      record.media = serializeViewerMedia(record, access, protectedMedia.cdnHosts());
      items.push({ teaser: pure.publicTeaser(record, access), record });
    }
    return items;
  }

  async function rocksnapsListEligible(bandId) {
    const config = rocksnapsPure.readConfig(process.env);
    const id = parseInt(bandId, 10);
    if (!config.ok || id !== config.bandId) return false;
    const band = await findBand(strapi, id);
    return rocksnapsPure.bandMatches(band, config);
  }

  async function listMine({ userId, bandId }) {
    if (!userId) return { error: 'unauthorized', status: 401, message: 'Authentication required' };
    const access = await requireBandPermission(strapi, userId, bandId, 'editBand');
    if (!access) return { error: 'forbidden', status: 403, message: 'Not authorized for this band' };
    const eligible = await rocksnapsListEligible(bandId);
    const rows = await strapi.entityService.findMany('api::artist-update.artist-update', {
      filters: { band: bandId },
      sort: { publishedAt: 'desc' },
      limit: 40,
      populate: { media: true, event: { fields: EVENT_FIELDS }, showRecap: { fields: SHOW_RECAP_FIELDS } },
    });
    return {
      data: (rows || []).map((row) => {
        const record = toRecord(row);
        record.showOnRockSnaps = row.showOnRockSnaps === true;
        record.media = serializeViewerMedia(record, { allowed: true, media: 'full' }, protectedMedia.cdnHosts());
        return rocksnapsPure.stampManageList(record, eligible);
      }),
    };
  }

  async function deliveryStatus() {
    return { data: protectedMedia.configured() };
  }

  async function listShows({ userId, bandId }) {
    if (!userId) return { error: 'unauthorized', status: 401, message: 'Authentication required' };
    const access = await requireBandPermission(strapi, userId, bandId, 'editBand');
    if (!access) return { error: 'forbidden', status: 403, message: 'Not authorized for this band' };
    const rows = await strapi.entityService.findMany('api::event.event', {
      filters: { band: bandId },
      fields: ['id', 'title', 'venue', 'city', 'date'],
      sort: { date: 'desc' },
      limit: 40,
    });
    return {
      data: (rows || []).map((row) => ({
        id: row.id,
        title: row.title || null,
        venue: row.venue || null,
        city: row.city || null,
        date: row.date || null,
        label: [row.city || row.venue || row.title, row.date].filter(Boolean).join(' · '),
      })),
    };
  }

  async function uploadMedia({ userId, bandId, file }) {
    if (!userId) return { error: 'unauthorized', status: 401, message: 'Authentication required' };
    const access = await requireBandPermission(strapi, userId, bandId, 'editBand');
    if (!access) return { error: 'forbidden', status: 403, message: 'Not authorized for this band' };
    return protectedMedia.uploadProtectedImage({ userId, bandId, file });
  }

  async function streamMedia({ userId, updateId, mediaId, size, exp, sig }) {
    const requestId = `pm_${crypto.randomBytes(4).toString('hex')}`;
    log(strapi, 'access:start', { requestId, updateId, mediaId });
    const rows = await strapi.entityService.findMany('api::artist-update.artist-update', {
      filters: { id: updateId },
      limit: 1,
      populate: UPDATE_SHOW_POPULATE,
    });
    const row = rows?.[0];
    if (!row) {
      log(strapi, 'access:deny', { requestId, reason: 'not_found' });
      return { error: 'not_found', status: 404, message: 'Image is not available' };
    }
    const record = toRecord(row);
    if (!mediaPure.mediaBelongsToUpdate(record, mediaId)) {
      log(strapi, 'access:deny', { requestId, reason: 'foreign_media' });
      return { error: 'not_found', status: 404, message: 'Image is not available' };
    }
    const file = (record.mediaFiles || []).find((item) => Number(item.id) === Number(mediaId));
    if (!mediaPure.isProtectedFile(file)) {
      log(strapi, 'access:deny', { requestId, reason: 'not_protected' });
      return { error: 'not_found', status: 404, message: 'Image is not available' };
    }
    const viewer = await loadViewerContext(strapi, {
      userId,
      bandId: record.bandId,
      eventId: record.eventId,
      campaignId: record.showCampaignId,
    });
    const access = pure.decideArtistUpdateAccess({ update: record, viewer });
    const token = mediaPure.verifyMediaToken({
      updateId,
      mediaId,
      size,
      exp,
      sig,
    });
    const stream = mediaPure.decideStreamAccess({
      access,
      tokenOk: token.ok,
      userId,
      isDraft: record.status !== 'published',
      isArtist: !!viewer.isArtist,
    });
    if (!stream.allowed) {
      log(strapi, 'access:deny', { requestId, reason: stream.reason });
      return { error: 'forbidden', status: 403, message: 'Image is not available' };
    }
    const safeSize = token.ok ? token.size : mediaPure.normalizeSize(size);
    return protectedMedia.streamProtectedMedia({
      update: record,
      file,
      size: safeSize,
      requestId,
    });
  }

  return {
    createAndPublish,
    updateVisibility,
    getManage,
    saveManage,
    presentOwnedById,
    hideGallery,
    restoreGallery,
    detachFromRecap,
    listForBand,
    getPublishedBySlug,
    listPublishedForRecap,
    listAccessibleByIds,
    getBySlug,
    listMine,
    loadViewerContext,
    deliveryStatus,
    listShows,
    uploadMedia,
    streamMedia,
  };
}

module.exports = {
  createArtistUpdateService,
  loadViewerContext,
  authorizeUpdateMedia,
};
