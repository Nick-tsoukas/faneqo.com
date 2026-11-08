'use strict';

/**
 * Night Recording management + public-safe resolution.
 * Band permission is authoritative. ShowRecap is Night identity.
 */

const { requireBandPermission } = require('../bandRoles');
const showContext = require('../artistUpdates/showContextPure');
const { loadViewerContext } = require('../artistUpdates/artistUpdateService');
const pure = require('./nightRecordingPure');

const UID = 'api::night-recording.night-recording';
const POPULATE = {
  uploadedMedia: true,
  posterImage: true,
  band: { fields: ['id'] },
  showRecap: { fields: ['id', 'eventId', 'campaignId'] },
  createdByUser: { fields: ['id'] },
};

function log(strapi, event, fields = {}) {
  const parts = Object.entries(fields)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([k, v]) => `${k}=${v}`);
  strapi.log.info(`[Faneqo Night Recordings] ${event}${parts.length ? ` ${parts.join(' ')}` : ''}`);
}

function unauthorized() {
  return { error: 'unauthorized', status: 401, message: 'Authentication required' };
}

function forbidden() {
  return { error: 'forbidden', status: 403, message: 'Not authorized for this band' };
}

function notFound(message = 'Recording not found') {
  return { error: 'not_found', status: 404, message };
}

function recapBandId(recap) {
  return pure.relId(recap, 'band') || recap?.bandId || null;
}

async function requireNightEdit(strapi, userId, bandId) {
  if (!userId) return unauthorized();
  const access = await requireBandPermission(strapi, userId, bandId, 'editBand');
  if (!access) return forbidden();
  return { access };
}

async function loadRecap(strapi, recapId) {
  const id = pure.parsePositiveInt(recapId);
  if (!id) return null;
  return strapi.entityService.findOne('api::show-recap.show-recap', id, {
    fields: ['id', 'eventId', 'campaignId', 'showTitle', 'nightSlug'],
    populate: { band: { fields: ['id'] } },
  });
}

async function loadRecording(strapi, id) {
  const recordingId = pure.parsePositiveInt(id);
  if (!recordingId) return null;
  return strapi.entityService.findOne(UID, recordingId, { populate: POPULATE });
}

async function loadUploadFile(strapi, mediaId) {
  const id = pure.parsePositiveInt(mediaId);
  if (!id) return null;
  return strapi.entityService.findOne('plugin::upload.file', id);
}

async function listRowsForRecap(strapi, recapId, { publishedOnly = false } = {}) {
  const filters = { showRecap: recapId };
  if (publishedOnly) filters.status = 'published';
  const rows = await strapi.entityService.findMany(UID, {
    filters,
    populate: POPULATE,
    limit: 50,
  });
  return pure.sortRecordings(rows || []);
}

async function authorizeMedia(strapi, { userId, kind, uploadedMediaId, posterImageId }) {
  let uploaded = null;
  if (uploadedMediaId) {
    uploaded = await loadUploadFile(strapi, uploadedMediaId);
    if (!uploaded) {
      return { error: 'invalid_attachment', status: 400, message: 'Media is not available.' };
    }
    const auth = pure.authorizeUploadedRecordingFile(uploaded, { userId, kind });
    if (auth.error) return { ...auth, status: 400 };
  }
  let poster = null;
  if (posterImageId) {
    poster = await loadUploadFile(strapi, posterImageId);
    if (!poster) {
      return { error: 'invalid_poster', status: 400, message: 'Poster image is not available.' };
    }
    const auth = pure.authorizePosterFile(poster, { userId });
    if (auth.error) return { ...auth, status: 400 };
  }
  return { uploaded, poster };
}

function persistData(validated, { bandId, recapId, userId, existing = null } = {}) {
  const source = validated.source ?? existing?.source;
  const status = validated.status ?? existing?.status ?? 'draft';
  const publishedAt = status === 'published'
    ? (existing?.publishedAt || new Date().toISOString())
    : null;
  const provider = validated.provider === undefined
    ? null
    : validated.provider;
  const data = {
    band: bandId,
    showRecap: recapId,
    createdByUser: existing ? pure.relId(existing, 'createdByUser') || userId : userId,
    title: validated.title === undefined ? existing?.title : validated.title,
    caption: validated.caption === undefined ? existing?.caption : validated.caption,
    kind: validated.kind ?? existing?.kind,
    source,
    visibility: validated.visibility ?? existing?.visibility ?? 'public',
    status,
    publishedAt,
    durationSeconds: validated.durationSeconds === undefined ? existing?.durationSeconds : validated.durationSeconds,
    sortOrder: validated.sortOrder === undefined ? existing?.sortOrder : validated.sortOrder,
  };
  if (source === 'upload') {
    data.providerUrl = null;
    data.providerType = null;
    data.providerResourceType = null;
    data.providerResourceId = null;
    if (validated.uploadedMediaId !== undefined) {
      data.uploadedMedia = validated.uploadedMediaId;
    }
  } else if (provider && provider.providerUrl) {
    data.providerUrl = provider.providerUrl;
    data.providerType = provider.providerType;
    data.providerResourceType = provider.providerResourceType;
    data.providerResourceId = provider.providerResourceId;
    data.uploadedMedia = null;
  }
  if (validated.posterImageId !== undefined) {
    data.posterImage = validated.posterImageId;
  }
  if (validated.createIdempotencyKey) {
    data.createIdempotencyKey = validated.createIdempotencyKey;
  }
  return data;
}

function viewerFromContext(ctx, recap) {
  const context = showContext.fromRecap(recap);
  const attended = showContext.attendanceMatchesShow(context, ctx);
  return {
    userId: ctx.userId || null,
    isArtist: !!ctx.isArtist,
    fan: ctx.fan || null,
    attended,
  };
}

async function resolveNightRecordingsForViewer(strapi, {
  recap,
  bandId,
  userId,
  publishedOnly = true,
} = {}) {
  const recapId = recap?.id || null;
  if (!recapId || !bandId) return [];
  const rows = await listRowsForRecap(strapi, recapId, { publishedOnly });
  if (!rows.length) return [];
  const ctx = await loadViewerContext(strapi, {
    userId,
    bandId,
    eventId: recap.eventId || null,
    campaignId: recap.campaignId || null,
  });
  const viewer = viewerFromContext(ctx, recap);
  const cards = [];
  for (const row of rows) {
    const recording = pure.toRecord(row);
    if (Number(recording.bandId) !== Number(bandId)) continue;
    const access = pure.decideNightRecordingAccess({ recording, viewer });
    const card = pure.publicRecordingCard(recording, access);
    if (card) cards.push(card);
  }
  return cards;
}

function createNightRecordingService(strapi) {
  async function listForNight({ userId, recapId }) {
    const recap = await loadRecap(strapi, recapId);
    if (!recap) return notFound('Night not found');
    const bandId = recapBandId(recap);
    const auth = await requireNightEdit(strapi, userId, bandId);
    if (auth.error) return auth;
    const rows = await listRowsForRecap(strapi, recap.id);
    return {
      data: rows
        .map((row) => pure.toRecord(row))
        .filter((row) => Number(row.bandId) === Number(bandId))
        .map((row) => pure.managementRecording(row)),
    };
  }

  async function createForNight({ userId, recapId, body = {} }) {
    const recap = await loadRecap(strapi, recapId);
    if (!recap) return notFound('Night not found');
    const bandId = recapBandId(recap);
    const auth = await requireNightEdit(strapi, userId, bandId);
    if (auth.error) return auth;
    if (body.bandId != null && Number(body.bandId) !== Number(bandId)) {
      return { error: 'band_mismatch', status: 403, message: 'Not authorized for this band' };
    }

    const validated = pure.validateRecordingInput(body);
    if (validated.error) return { ...validated, status: 400 };
    if (!pure.canPublishGatedUpload(validated)) {
      return pure.gatedUploadPublishError();
    }

    const media = await authorizeMedia(strapi, {
      userId,
      kind: validated.kind,
      uploadedMediaId: validated.uploadedMediaId,
      posterImageId: validated.posterImageId,
    });
    if (media.error) return media;

    const existing = await listRowsForRecap(strapi, recap.id);
    if (existing.length >= pure.MAX_RECORDINGS_PER_NIGHT) {
      return {
        error: 'too_many_recordings',
        status: 400,
        message: `A Night can include up to ${pure.MAX_RECORDINGS_PER_NIGHT} recordings.`,
      };
    }

    const sortOrder = body.sortOrder == null || body.sortOrder === ''
      ? pure.nextSortOrder(existing)
      : validated.sortOrder;

    let scopedKey = null;
    if (validated.createIdempotencyKey) {
      scopedKey = pure.scopedCreateIdempotencyKey(userId, recap.id, validated.createIdempotencyKey);
      const prior = await strapi.entityService.findMany(UID, {
        filters: { createIdempotencyKey: scopedKey },
        populate: POPULATE,
        limit: 1,
      });
      if (prior?.[0]) {
        if (!pure.createReplayOwned({ existing: prior[0], userId, recapId: recap.id })) {
          return { error: 'invalid_idempotency_key', status: 409, message: 'Could not save this recording.' };
        }
        log(strapi, 'create:replay', { recapId: recap.id, recordingId: prior[0].id });
        return { data: pure.managementRecording(pure.toRecord(prior[0])), replayed: true };
      }
    }

    const data = persistData(
      { ...validated, sortOrder, createIdempotencyKey: scopedKey },
      { bandId, recapId: recap.id, userId }
    );

    let row;
    try {
      row = await strapi.entityService.create(UID, { data, populate: POPULATE });
    } catch (err) {
      if (scopedKey && /unique/i.test(String(err?.message || ''))) {
        const raced = await strapi.entityService.findMany(UID, {
          filters: { createIdempotencyKey: scopedKey },
          populate: POPULATE,
          limit: 1,
        });
        if (raced?.[0] && pure.createReplayOwned({ existing: raced[0], userId, recapId: recap.id })) {
          return { data: pure.managementRecording(pure.toRecord(raced[0])), replayed: true };
        }
      }
      throw err;
    }
    log(strapi, 'create', { recapId: recap.id, recordingId: row.id, source: row.source, kind: row.kind });
    return { data: pure.managementRecording(pure.toRecord(row)) };
  }

  async function detail({ userId, recordingId }) {
    const row = await loadRecording(strapi, recordingId);
    if (!row) return notFound();
    const record = pure.toRecord(row);
    const auth = await requireNightEdit(strapi, userId, record.bandId);
    if (auth.error) return auth;
    return { data: pure.managementRecording(record) };
  }

  async function update({ userId, recordingId, body = {} }) {
    const row = await loadRecording(strapi, recordingId);
    if (!row) return notFound();
    const existing = pure.toRecord(row);
    const auth = await requireNightEdit(strapi, userId, existing.bandId);
    if (auth.error) return auth;
    if (body.bandId != null && Number(body.bandId) !== Number(existing.bandId)) {
      return { error: 'immutable_band', status: 400, message: 'A recording cannot move to another band.' };
    }
    if (body.showRecapId != null && Number(body.showRecapId) !== Number(existing.showRecapId)) {
      return { error: 'immutable_night', status: 400, message: 'A recording cannot move to another Night.' };
    }

    const merged = {
      title: body.title !== undefined ? body.title : existing.title,
      caption: body.caption !== undefined ? body.caption : existing.caption,
      kind: body.kind !== undefined ? body.kind : existing.kind,
      source: body.source !== undefined ? body.source : existing.source,
      providerUrl: body.providerUrl !== undefined ? body.providerUrl : existing.providerUrl,
      uploadedMediaId: body.uploadedMediaId !== undefined
        ? body.uploadedMediaId
        : (existing.source === 'upload' ? existing.uploadedMedia?.id : null),
      posterImageId: body.posterImageId !== undefined
        ? body.posterImageId
        : existing.posterImage?.id,
      visibility: body.visibility !== undefined ? body.visibility : existing.visibility,
      status: body.status !== undefined ? body.status : existing.status,
      durationSeconds: body.durationSeconds !== undefined ? body.durationSeconds : existing.durationSeconds,
      sortOrder: body.sortOrder !== undefined ? body.sortOrder : existing.sortOrder,
    };
    const validated = pure.validateRecordingInput(merged);
    if (validated.error) return { ...validated, status: 400 };
    if (!pure.canPublishGatedUpload(validated)) {
      return pure.gatedUploadPublishError();
    }

    const media = await authorizeMedia(strapi, {
      userId,
      kind: validated.kind,
      uploadedMediaId: body.uploadedMediaId !== undefined ? validated.uploadedMediaId : null,
      posterImageId: body.posterImageId !== undefined ? validated.posterImageId : null,
    });
    if (media.error) return media;

    if (body.uploadedMediaId === undefined) {
      validated.uploadedMediaId = undefined;
    }
    if (body.posterImageId === undefined) {
      validated.posterImageId = undefined;
    }
    if (body.providerUrl === undefined && body.source === undefined) {
      validated.provider = undefined;
    }

    const data = persistData(validated, {
      bandId: existing.bandId,
      recapId: existing.showRecapId,
      userId,
      existing,
    });
    delete data.band;
    delete data.showRecap;
    delete data.createdByUser;

    const updated = await strapi.entityService.update(UID, existing.id, {
      data,
      populate: POPULATE,
    });
    log(strapi, 'update', { recordingId: existing.id, recapId: existing.showRecapId });
    return { data: pure.managementRecording(pure.toRecord(updated)) };
  }

  async function remove({ userId, recordingId }) {
    const row = await loadRecording(strapi, recordingId);
    if (!row) return notFound();
    const record = pure.toRecord(row);
    const auth = await requireNightEdit(strapi, userId, record.bandId);
    if (auth.error) return auth;
    await strapi.entityService.delete(UID, record.id);
    log(strapi, 'delete', { recordingId: record.id, recapId: record.showRecapId });
    return { data: { id: record.id, deleted: true } };
  }

  async function resolveForViewer(input) {
    return resolveNightRecordingsForViewer(strapi, input);
  }

  return {
    listForNight,
    createForNight,
    detail,
    update,
    remove,
    resolveForViewer,
  };
}

module.exports = {
  createNightRecordingService,
  resolveNightRecordingsForViewer,
  UID,
};
