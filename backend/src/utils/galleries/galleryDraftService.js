'use strict';

/**
 * Gallery draft sessions — Strapi I/O around `galleryDraftPure`.
 *
 * Every entry point checks, in order: authenticated user → band permission →
 * draft ownership → file ownership → storage classification → show ownership.
 * Nothing here logs urls, storage keys, filenames, titles, or captions.
 */

const { requireBandPermission } = require('../bandRoles');
const updatePure = require('../artistUpdates/artistUpdatePure');
const mediaPure = require('../artistUpdates/protectedMediaPure');
const {
  createProtectedMediaService,
  loadReferencedProtectedMediaIds,
} = require('../artistUpdates/protectedMedia');
const { createArtistUpdateService } = require('../artistUpdates/artistUpdateService');
const pure = require('./galleryDraftPure');

const DRAFT_UID = 'api::gallery-draft.gallery-draft';
const UPLOAD_UID = 'plugin::upload.file';

const DRAFT_POPULATE = {
  band: { fields: ['id'] },
  createdByUser: { fields: ['id'] },
  event: { fields: ['id'] },
  showRecap: { fields: ['id'] },
  editingUpdate: { fields: ['id', 'slug'], populate: { media: { fields: ['id'] } } },
  publishedUpdate: { fields: ['id', 'slug'] },
};

function log(strapi, event, fields = {}) {
  const parts = Object.entries(fields)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${key}=${value}`);
  strapi?.log?.info(`[Faneqo Gallery Draft] ${event}${parts.length ? ` ${parts.join(' ')}` : ''}`);
}

function relId(row, key) {
  const value = row?.[key];
  if (value == null) return null;
  if (typeof value === 'object') return value.id || value.data?.id || null;
  return value;
}

function unauthorized() {
  return { error: 'unauthorized', status: 401, message: 'Authentication required' };
}

function forbidden() {
  return { error: 'forbidden', status: 403, message: 'Not authorized for this band' };
}

/**
 * A foreign session is answered as missing. Telling a stranger that a session
 * id exists is already a leak.
 */
function notFound() {
  return { error: 'not_found', status: 404, message: 'Draft not found' };
}

/**
 * `deps` exists so unit tests can drive the lifecycle without S3 or Sharp.
 * Production always uses the real services.
 */
function createGalleryDraftService(strapi, env = process.env, deps = {}) {
  const protectedMedia = deps.protectedMedia || createProtectedMediaService(strapi, env);
  const artistUpdates = deps.artistUpdates || createArtistUpdateService(strapi);

  async function filesByIds(ids) {
    const list = updatePure.uniquePositiveIds(ids);
    if (!list.length) return [];
    const rows = await strapi.entityService.findMany(UPLOAD_UID, {
      filters: { id: { $in: list } },
      limit: Math.min(Math.max(list.length, 1), updatePure.MAX_IMAGES),
    });
    const byId = new Map((rows || []).map((row) => [Number(row.id), row]));
    return list.map((id) => byId.get(Number(id))).filter(Boolean);
  }

  async function loadDraftRow(sessionId) {
    const key = String(sessionId || '').trim();
    if (!key) return null;
    const rows = await strapi.entityService.findMany(DRAFT_UID, {
      filters: { sessionId: key },
      limit: 1,
      populate: DRAFT_POPULATE,
    });
    return rows?.[0] || null;
  }

  async function requireOwnedDraft({ userId, sessionId }) {
    if (!userId) return { error: unauthorized() };
    const draft = await loadDraftRow(sessionId);
    if (!draft) return { error: notFound() };
    if (!pure.draftOwned(draft, { userId })) return { error: notFound() };
    const bandId = relId(draft, 'band');
    const access = await requireBandPermission(strapi, userId, bandId, 'editBand');
    if (!access) return { error: notFound() };
    return { draft, bandId };
  }

  /**
   * The media a draft is allowed to reference: what this session staged, plus
   * — in edit mode — the photos the gallery already owns.
   */
  function sessionMediaIds(draft) {
    const order = pure.mediaOrderOf(draft);
    const existing = draft.mode === 'edit'
      ? (draft.editingUpdate?.media || []).map((file) => file?.id).filter(Boolean)
      : [];
    return [...new Set([...order, ...existing])];
  }

  function hasNight(draft) {
    return !!(relId(draft, 'showRecap') || relId(draft, 'event'));
  }

  function presentSync(draft, media) {
    const order = pure.mediaOrderOf(draft);
    return {
      data: {
        media,
        sessionId: draft.sessionId,
        bandId: relId(draft, 'band'),
        kind: draft.kind || 'general',
        mode: draft.mode || 'create',
        status: draft.status || pure.DRAFT_STATUS_ACTIVE,
        title: draft.title || null,
        caption: draft.caption || '',
        visibility: updatePure.defaultVisibility(draft.visibility),
        audienceLocked: !!draft.audienceLocked,
        classification: pure.classificationForVisibility(draft.visibility),
        mediaOrder: order,
        mediaCaptions: pure.captionsOf(draft),
        coverMediaId: updatePure.resolveCoverMediaId(draft.coverMediaId, order),
        photoCount: order.length,
        maxPhotos: updatePure.MAX_IMAGES,
        showRecapId: relId(draft, 'showRecap'),
        eventId: relId(draft, 'event'),
        editingUpdateId: relId(draft, 'editingUpdate'),
        publishedUpdateId: relId(draft, 'publishedUpdate'),
        publishedUpdateSlug: draft.publishedUpdate?.slug || null,
        returnContext: pure.sanitizeReturnContext(draft.returnContext),
        lastActivityAt: draft.lastActivityAt || null,
      },
    };
  }

  /**
   * Staged files are hydrated so a resumed draft can paint its grid straight
   * away. Protected bytes never carry a public URL, so the grid reads those
   * back through the owner-authenticated draft proxy instead.
   */
  async function present(draft) {
    const order = pure.mediaOrderOf(draft);
    if (!order.length) return presentSync(draft, []);
    const files = await filesByIds(order);
    const byId = new Map((files || []).map((file) => [Number(file.id), file]));
    const media = [];
    for (const id of order) {
      const file = byId.get(Number(id));
      if (!file) continue;
      const classification = pure.stagedFileClassification(file)
        || pure.classificationForVisibility(draft.visibility);
      const row = stagedMediaPayload(file, classification);
      if (row.protected) row.thumbUrl = pure.draftMediaPath(draft.sessionId, id, 'thumb');
      media.push(row);
    }
    return presentSync(draft, media);
  }

  async function touch(draftId, data = {}) {
    return strapi.entityService.update(DRAFT_UID, draftId, {
      data: { ...data, lastActivityAt: new Date().toISOString() },
      populate: DRAFT_POPULATE,
    });
  }

  /**
   * Re-read + merge + verify. Two uploads that both saw an empty order must
   * not overwrite each other; the loser retries against the latest order.
   */
  async function appendStagedMedia(draftId, mediaId) {
    const id = updatePure.parsePositiveInt(mediaId);
    if (!id) return [];
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const latest = await strapi.entityService.findOne(DRAFT_UID, draftId, {
        fields: ['id', 'mediaOrder', 'coverMediaId'],
      });
      const nextOrder = pure.appendMediaId(latest?.mediaOrder, id);
      if (pure.mediaOrderOf(latest).includes(id)) return nextOrder;
      await touch(draftId, {
        mediaOrder: nextOrder,
        audienceLocked: true,
        coverMediaId: updatePure.resolveCoverMediaId(latest?.coverMediaId, nextOrder),
      });
      const check = await strapi.entityService.findOne(DRAFT_UID, draftId, {
        fields: ['id', 'mediaOrder'],
      });
      const checked = pure.mediaOrderOf(check);
      if (checked.includes(id)) return checked;
    }
    return [];
  }

  async function loadOwnedRecap({ bandId, showRecapId }) {
    const id = updatePure.parsePositiveInt(showRecapId);
    if (!id) return { recap: null };
    const recap = await strapi.entityService.findOne('api::show-recap.show-recap', id, {
      fields: ['id', 'eventId'],
      populate: { band: { fields: ['id'] } },
    });
    if (!recap) return { error: { error: 'invalid_show', status: 400, message: 'Choose a show for this band.' } };
    if (Number(recap.band?.id || recap.band) !== Number(bandId)) {
      return { error: { error: 'show_not_owned', status: 403, message: 'Choose a show for this band.' } };
    }
    return { recap };
  }

  async function loadOwnedEvent({ bandId, eventId }) {
    const id = updatePure.parsePositiveInt(eventId);
    if (!id) return { event: null };
    const row = await strapi.entityService.findOne('api::event.event', id, {
      fields: ['id'],
      populate: { band: { fields: ['id'] } },
    });
    if (!row) return { error: { error: 'invalid_event', status: 400, message: 'Choose a show for this band.' } };
    if (Number(row.band?.id || row.band) !== Number(bandId)) {
      return { error: { error: 'show_not_owned', status: 403, message: 'Choose a show for this band.' } };
    }
    return { event: row };
  }

  async function createDraft({ userId, bandId, kind, showRecapId, eventId, updateId, returnContext }) {
    if (!userId) return unauthorized();
    const band = updatePure.parsePositiveInt(bandId);
    if (!band) return { error: 'invalid_band', status: 400, message: 'Choose a band.' };
    const access = await requireBandPermission(strapi, userId, band, 'editBand');
    if (!access) return forbidden();

    const context = pure.sanitizeReturnContext(returnContext);
    const editingId = updatePure.parsePositiveInt(updateId);

    if (editingId) {
      const rows = await strapi.entityService.findMany('api::artist-update.artist-update', {
        filters: { id: editingId },
        limit: 1,
        populate: {
          band: { fields: ['id'] },
          media: { fields: ['id'] },
          event: { fields: ['id'] },
          showRecap: { fields: ['id'] },
        },
      });
      const update = rows?.[0];
      if (!update) return { error: 'not_found', status: 404, message: 'Gallery not found' };
      if (Number(relId(update, 'band')) !== Number(band)) return forbidden();

      const existing = await strapi.entityService.findMany(DRAFT_UID, {
        filters: {
          createdByUser: userId,
          band,
          editingUpdate: editingId,
          status: pure.DRAFT_STATUS_ACTIVE,
        },
        limit: 1,
        populate: DRAFT_POPULATE,
      });
      if (existing?.[0]) {
        log(strapi, 'draft_resumed', { sessionId: existing[0].sessionId, bandId: band, mode: 'edit' });
        return present(existing[0]);
      }

      const order = (update.media || []).map((file) => file?.id).filter(Boolean);
      const created = await strapi.entityService.create(DRAFT_UID, {
        data: {
          sessionId: pure.newSessionId(),
          band,
          createdByUser: userId,
          kind: relId(update, 'showRecap') ? 'show' : 'general',
          mode: 'edit',
          editingUpdate: editingId,
          event: relId(update, 'event'),
          showRecap: relId(update, 'showRecap'),
          visibility: updatePure.defaultVisibility(update.visibility),
          audienceLocked: order.length > 0,
          title: update.title || null,
          caption: update.bodyText || '',
          mediaOrder: order,
          mediaCaptions: update.mediaCaptions && typeof update.mediaCaptions === 'object' ? update.mediaCaptions : {},
          coverMediaId: updatePure.resolveCoverMediaId(update.coverMediaId, order),
          status: pure.DRAFT_STATUS_ACTIVE,
          returnContext: context,
          lastActivityAt: new Date().toISOString(),
        },
        populate: DRAFT_POPULATE,
      });
      log(strapi, 'draft_started', { sessionId: created.sessionId, bandId: band, mode: 'edit', photoCount: order.length });
      return present(created);
    }

    const draftKind = pure.normalizeKind(kind);
    const recap = await loadOwnedRecap({ bandId: band, showRecapId });
    if (recap.error) return recap.error;
    const event = await loadOwnedEvent({ bandId: band, eventId });
    if (event.error) return event.error;

    const resumable = await strapi.entityService.findMany(DRAFT_UID, {
      filters: {
        createdByUser: userId,
        band,
        kind: draftKind,
        mode: 'create',
        status: pure.DRAFT_STATUS_ACTIVE,
        ...(recap.recap ? { showRecap: recap.recap.id } : { showRecap: { id: { $null: true } } }),
      },
      sort: { lastActivityAt: 'desc' },
      limit: 1,
      populate: DRAFT_POPULATE,
    });
    if (resumable?.[0]) {
      log(strapi, 'draft_resumed', { sessionId: resumable[0].sessionId, bandId: band, kind: draftKind });
      const refreshed = context ? await touch(resumable[0].id, { returnContext: context }) : resumable[0];
      return present(refreshed);
    }

    const created = await strapi.entityService.create(DRAFT_UID, {
      data: {
        sessionId: pure.newSessionId(),
        band,
        createdByUser: userId,
        kind: draftKind,
        mode: 'create',
        event: event.event?.id || recap.recap?.eventId || null,
        showRecap: recap.recap?.id || null,
        visibility: 'public',
        audienceLocked: false,
        mediaOrder: [],
        mediaCaptions: {},
        status: pure.DRAFT_STATUS_ACTIVE,
        returnContext: context,
        lastActivityAt: new Date().toISOString(),
      },
      populate: DRAFT_POPULATE,
    });
    log(strapi, 'draft_started', { sessionId: created.sessionId, bandId: band, kind: draftKind });
    return present(created);
  }

  async function getActiveDraft({ userId, bandId, kind, showRecapId, updateId }) {
    if (!userId) return unauthorized();
    const band = updatePure.parsePositiveInt(bandId);
    if (!band) return { error: 'invalid_band', status: 400, message: 'Choose a band.' };
    const access = await requireBandPermission(strapi, userId, band, 'editBand');
    if (!access) return forbidden();

    const editingId = updatePure.parsePositiveInt(updateId);
    const recapId = updatePure.parsePositiveInt(showRecapId);
    const filters = {
      createdByUser: userId,
      band,
      status: pure.DRAFT_STATUS_ACTIVE,
    };
    if (editingId) {
      filters.editingUpdate = editingId;
    } else {
      filters.mode = 'create';
      filters.kind = pure.normalizeKind(kind);
      filters.showRecap = recapId ? recapId : { id: { $null: true } };
    }
    const rows = await strapi.entityService.findMany(DRAFT_UID, {
      filters,
      sort: { lastActivityAt: 'desc' },
      limit: 1,
      populate: DRAFT_POPULATE,
    });
    const draft = rows?.[0];
    if (!draft) return { data: null };
    return present(draft);
  }

  async function getDraft({ userId, sessionId }) {
    const loaded = await requireOwnedDraft({ userId, sessionId });
    if (loaded.error) return loaded.error;
    return present(loaded.draft);
  }

  async function patchDraft({ userId, sessionId, ...patch }) {
    const loaded = await requireOwnedDraft({ userId, sessionId });
    if (loaded.error) return loaded.error;
    const { draft, bandId } = loaded;
    if (draft.status !== pure.DRAFT_STATUS_ACTIVE) {
      return { error: 'draft_not_active', status: 409, message: 'This draft has already been finished.' };
    }

    const data = {};
    if (patch.showRecapId !== undefined) {
      const recap = await loadOwnedRecap({ bandId, showRecapId: patch.showRecapId });
      if (recap.error) return recap.error;
      data.showRecap = recap.recap?.id || null;
      if (recap.recap?.eventId) data.event = recap.recap.eventId;
    }
    if (patch.eventId !== undefined) {
      const event = await loadOwnedEvent({ bandId, eventId: patch.eventId });
      if (event.error) return event.error;
      data.event = event.event?.id || null;
    }

    const validated = pure.validateDraftPatch(patch, {
      stagedIds: sessionMediaIds(draft),
      current: { mediaOrder: pure.mediaOrderOf(draft) },
    });
    if (validated.error) return validated;
    Object.assign(data, validated.patch);

    if (data.mediaOrder || data.coverMediaId !== undefined) {
      const order = data.mediaOrder || pure.mediaOrderOf(draft);
      data.coverMediaId = updatePure.resolveCoverMediaId(
        data.coverMediaId !== undefined ? data.coverMediaId : draft.coverMediaId,
        order
      );
    }

    const next = await touch(draft.id, data);
    return present(next);
  }

  async function setAudience({ userId, sessionId, visibility, confirmClear }) {
    const loaded = await requireOwnedDraft({ userId, sessionId });
    if (loaded.error) return loaded.error;
    const { draft } = loaded;
    if (draft.status !== pure.DRAFT_STATUS_ACTIVE) {
      return { error: 'draft_not_active', status: 409, message: 'This draft has already been finished.' };
    }

    const order = pure.mediaOrderOf(draft);
    const delivery = protectedMedia.configured();
    const change = pure.evaluateAudienceChange({
      from: draft.visibility,
      to: visibility,
      stagedCount: order.length,
      confirmClear: confirmClear === true,
      hasNight: hasNight(draft),
      protectedReady: delivery.ready,
    });
    if (change.error) {
      log(strapi, 'audience_selected:refused', {
        sessionId: draft.sessionId,
        reason: change.error,
        photoCount: order.length,
      });
      return change;
    }

    if (!change.clear) {
      const next = await touch(draft.id, { visibility: change.to });
      log(strapi, 'audience_selected', { sessionId: draft.sessionId, visibility: change.to, cleared: 0 });
      return present(next);
    }

    const cleared = await deleteSessionMedia({ draft, userId, mediaIds: order });
    const next = await touch(draft.id, {
      visibility: change.to,
      mediaOrder: [],
      mediaCaptions: {},
      coverMediaId: null,
      audienceLocked: false,
    });
    log(strapi, 'visibility_migration_cleared', {
      sessionId: draft.sessionId,
      visibility: change.to,
      cleared: cleared.deleted,
      skipped: cleared.skipped,
    });
    return present(next);
  }

  /**
   * Deletes only files this session positively owns. A file referenced by a
   * published gallery is left alone even if the tag says staged.
   */
  async function deleteSessionMedia({ draft, userId, mediaIds }) {
    const ids = updatePure.uniquePositiveIds(mediaIds);
    if (!ids.length) return { deleted: 0, skipped: 0 };
    const files = await filesByIds(ids);
    const owned = files.filter((file) => pure.stagedFileOwnedBy(file, {
      sessionId: draft.sessionId,
      userId: userId || relId(draft, 'createdByUser'),
    }));
    if (!owned.length) return { deleted: 0, skipped: files.length };
    const referenced = await loadReferencedProtectedMediaIds(strapi, owned.map((file) => file.id));
    let deleted = 0;
    let skipped = files.length - owned.length;
    for (const file of owned) {
      if (referenced.has(Number(file.id))) {
        skipped += 1;
        continue;
      }
      try {
        await protectedMedia.deleteMediaFile(file);
        deleted += 1;
      } catch (err) {
        skipped += 1;
        log(strapi, 'cleanup_skipped', { sessionId: draft.sessionId, mediaId: file.id, reason: 'delete_failed' });
      }
    }
    return { deleted, skipped };
  }

  async function uploadDraftMedia({ userId, sessionId, file }) {
    const loaded = await requireOwnedDraft({ userId, sessionId });
    if (loaded.error) return loaded.error;
    const { draft, bandId } = loaded;
    if (draft.status !== pure.DRAFT_STATUS_ACTIVE) {
      return { error: 'draft_not_active', status: 409, message: 'This draft has already been finished.' };
    }
    const order = pure.mediaOrderOf(draft);
    if (!pure.canAcceptAnotherPhoto(order.length)) {
      return { error: 'too_many_images', status: 400, message: `You can add up to ${updatePure.MAX_IMAGES} photos.` };
    }
    if (!file) return { error: 'media_required', status: 400, message: 'Add a photo.' };

    const classification = pure.classificationForVisibility(draft.visibility);
    log(strapi, 'upload_started', { sessionId: draft.sessionId, classification, photoCount: order.length });

    const stagedAt = new Date().toISOString();
    const tags = pure.stagedMediaTags({
      sessionId: draft.sessionId,
      bandId,
      uploaderUserId: userId,
      classification,
      stagedAt,
    });

    let row;
    if (classification === pure.CLASSIFICATION_PROTECTED) {
      const uploaded = await protectedMedia.uploadProtectedImage({
        userId,
        bandId,
        file,
        domain: mediaPure.PROTECTED_DOMAIN_ARTIST_UPDATE,
      });
      if (uploaded.error) {
        log(strapi, 'upload_failed', { sessionId: draft.sessionId, reason: uploaded.error });
        return uploaded;
      }
      const existing = await strapi.entityService.findOne(UPLOAD_UID, uploaded.data.id, {});
      row = await strapi.entityService.update(UPLOAD_UID, uploaded.data.id, {
        data: { provider_metadata: { ...(existing?.provider_metadata || {}), ...tags } },
      });
    } else {
      const guard = validatePublicUpload(file);
      if (guard.error) {
        log(strapi, 'upload_failed', { sessionId: draft.sessionId, reason: guard.error });
        return guard;
      }
      let uploaded;
      let publicFile;
      try {
        /* A HEIC has to become a web format before it is stored publicly —
           nothing downstream (browser, CDN, canonical viewer) can read HEVC. */
        publicFile = await normalizePublicUploadFile(file);
      } catch (err) {
        log(strapi, 'upload_failed', { sessionId: draft.sessionId, reason: err.code || 'decode_failed' });
        return {
          error: 'invalid_type',
          status: 400,
          message: mediaPure.unsupportedImageMessage('image/heic', file.originalFilename || file.name || ''),
        };
      }
      try {
        uploaded = await strapi.plugins.upload.services.upload.upload({ data: {}, files: publicFile });
      } catch (err) {
        log(strapi, 'upload_failed', { sessionId: draft.sessionId, reason: 'upload_failed' });
        return { error: 'upload_failed', status: 500, message: 'Could not store that photo.' };
      }
      const created = Array.isArray(uploaded) ? uploaded[0] : uploaded;
      if (!created?.id) {
        log(strapi, 'upload_failed', { sessionId: draft.sessionId, reason: 'upload_empty' });
        return { error: 'upload_failed', status: 500, message: 'Could not store that photo.' };
      }
      row = await strapi.entityService.update(UPLOAD_UID, created.id, {
        data: { provider_metadata: { ...(created.provider_metadata || {}), ...tags } },
      });
    }

    const nextOrder = await appendStagedMedia(draft.id, row.id);
    if (!nextOrder.includes(Number(row.id))) {
      log(strapi, 'upload_failed', { sessionId: draft.sessionId, reason: 'order_append_failed', mediaId: row.id });
      return { error: 'upload_failed', status: 500, message: 'Could not store that photo.' };
    }
    log(strapi, 'upload_succeeded', {
      sessionId: draft.sessionId,
      mediaId: row.id,
      classification,
      photoCount: nextOrder.length,
    });
    return { data: stagedMediaPayload(row, classification) };
  }

  async function deleteDraftMedia({ userId, sessionId, mediaId }) {
    const loaded = await requireOwnedDraft({ userId, sessionId });
    if (loaded.error) return loaded.error;
    const { draft } = loaded;
    const id = updatePure.parsePositiveInt(mediaId);
    if (!id) return { error: 'foreign_media', status: 403, message: 'That photo is not part of this gallery.' };
    const [file] = await filesByIds([id]);
    if (!pure.stagedFileOwnedBy(file, { sessionId: draft.sessionId, userId })) {
      log(strapi, 'cleanup_skipped', { sessionId: draft.sessionId, mediaId: id, reason: 'foreign_media' });
      return { error: 'foreign_media', status: 403, message: 'That photo is not part of this gallery.' };
    }
    const result = await deleteSessionMedia({ draft, userId, mediaIds: [id] });
    const next = pure.removeMediaFromDraft({
      mediaOrder: draft.mediaOrder,
      mediaCaptions: draft.mediaCaptions,
      coverMediaId: draft.coverMediaId,
    }, id);
    const saved = await touch(draft.id, next);
    log(strapi, 'cleanup_deleted', { sessionId: draft.sessionId, mediaId: id, deleted: result.deleted });
    return present(saved);
  }

  async function publishDraft({ userId, sessionId, publishIdempotencyKey }) {
    const loaded = await requireOwnedDraft({ userId, sessionId });
    if (loaded.error) return loaded.error;
    const { draft, bandId } = loaded;

    if (draft.mode === 'edit') {
      return {
        error: 'edit_requires_manage_save',
        status: 400,
        message: 'Save this gallery from the gallery editor instead of publishing it again.',
      };
    }
    if (draft.status === pure.DRAFT_STATUS_PUBLISHED && relId(draft, 'publishedUpdate')) {
      log(strapi, 'publish_succeeded', { sessionId: draft.sessionId, replay: 1 });
      const replay = await artistUpdates.presentOwnedById({
        userId,
        updateId: relId(draft, 'publishedUpdate'),
      });
      return replay.error ? present(draft) : replay;
    }
    if (draft.status !== pure.DRAFT_STATUS_ACTIVE) {
      return { error: 'draft_not_active', status: 409, message: 'This draft has already been finished.' };
    }

    const order = pure.mediaOrderOf(draft);
    const captions = updatePure.normalizeMediaCaptions(pure.captionsOf(draft), order, { dropUnknown: true });
    if (captions.error) return captions;
    log(strapi, 'publish_started', { sessionId: draft.sessionId, bandId, photoCount: order.length });
    const result = await artistUpdates.createAndPublish({
      userId,
      bandId,
      title: draft.title,
      bodyText: draft.caption,
      visibility: draft.visibility,
      mediaIds: order,
      eventId: relId(draft, 'event'),
      showRecapId: relId(draft, 'showRecap'),
      publishIdempotencyKey,
      coverMediaId: draft.coverMediaId,
      mediaCaptions: captions.captions,
    });
    if (result.error) {
      log(strapi, 'publish_failed', { sessionId: draft.sessionId, reason: result.error });
      return result;
    }

    await clearStagedFlag(order);
    await touch(draft.id, {
      status: pure.DRAFT_STATUS_PUBLISHED,
      publishedUpdate: result.data?.id || null,
    });
    log(strapi, 'publish_succeeded', {
      sessionId: draft.sessionId,
      updateId: result.data?.id,
      photoCount: order.length,
    });
    return result;
  }

  /**
   * Attached bytes stop being staged the moment they belong to a gallery, so
   * cleanup can never reach them.
   */
  async function clearStagedFlag(mediaIds) {
    const files = await filesByIds(mediaIds);
    for (const file of files) {
      if (!pure.isStagedGalleryFile(file)) continue;
      try {
        await strapi.entityService.update(UPLOAD_UID, file.id, {
          data: {
            provider_metadata: {
              ...(file.provider_metadata || {}),
              faneqoGalleryStaged: false,
            },
          },
        });
      } catch (err) {
        log(strapi, 'cleanup_skipped', { mediaId: file.id, reason: 'flag_clear_failed' });
      }
    }
  }

  async function discardDraft({ userId, sessionId }) {
    const loaded = await requireOwnedDraft({ userId, sessionId });
    if (loaded.error) return loaded.error;
    const { draft } = loaded;
    const order = pure.mediaOrderOf(draft);
    const result = await deleteSessionMedia({ draft, userId, mediaIds: order });
    await touch(draft.id, {
      status: pure.DRAFT_STATUS_DISCARDED,
      mediaOrder: [],
      mediaCaptions: {},
      coverMediaId: null,
    });
    log(strapi, 'draft_discarded', {
      sessionId: draft.sessionId,
      deleted: result.deleted,
      skipped: result.skipped,
    });
    return { data: { sessionId: draft.sessionId, status: pure.DRAFT_STATUS_DISCARDED, ...result } };
  }

  /**
   * Daily sweep. Positively-tagged staged files only; generic unreferenced
   * Strapi uploads are never touched.
   */
  async function cleanupStagedGalleryMedia({
    now = Date.now(),
    graceMs = mediaPure.ORPHAN_GRACE_MS,
    limit = mediaPure.ORPHAN_CLEANUP_BATCH,
  } = {}) {
    const batch = Math.min(Math.max(Number(limit) || 40, 1), 80);
    let draftsDiscarded = 0;

    const staleCutoff = new Date(now - pure.STALE_DRAFT_MS).toISOString();
    const stale = await strapi.entityService.findMany(DRAFT_UID, {
      filters: { status: pure.DRAFT_STATUS_ACTIVE, lastActivityAt: { $lt: staleCutoff } },
      sort: { lastActivityAt: 'asc' },
      limit: batch,
      populate: DRAFT_POPULATE,
    });
    const sweepable = [];
    for (const draft of stale || []) {
      if (!pure.isStaleDraft(draft, { now })) continue;
      try {
        await strapi.entityService.update(DRAFT_UID, draft.id, {
          data: { status: pure.DRAFT_STATUS_DISCARDED },
        });
        draftsDiscarded += 1;
        sweepable.push(draft);
      } catch (err) {
        log(strapi, 'cleanup_skipped', { sessionId: draft.sessionId, reason: 'stale_discard_failed' });
      }
    }

    const leftovers = await strapi.entityService.findMany(DRAFT_UID, {
      filters: { status: pure.DRAFT_STATUS_DISCARDED },
      sort: { updatedAt: 'asc' },
      limit: batch,
      populate: DRAFT_POPULATE,
    });
    for (const draft of leftovers || []) {
      if (!pure.mediaOrderOf(draft).length) continue;
      if (sweepable.some((row) => Number(row.id) === Number(draft.id))) continue;
      sweepable.push(draft);
    }

    let examined = 0;
    let deleted = 0;
    let skippedReferenced = 0;
    for (const draft of sweepable.slice(0, batch)) {
      const ids = pure.mediaOrderOf(draft);
      if (!ids.length) continue;
      const files = await filesByIds(ids);
      const candidates = files.filter((file) => (
        pure.stagedFileOwnedBy(file, {
          sessionId: draft.sessionId,
          userId: relId(draft, 'createdByUser'),
        })
        && pure.stagedFilePastGrace(file, { now, graceMs })
      ));
      examined += candidates.length;
      log(strapi, 'cleanup_examined', { sessionId: draft.sessionId, count: candidates.length });
      if (!candidates.length) continue;
      const referenced = await loadReferencedProtectedMediaIds(strapi, candidates.map((file) => file.id));
      const removed = [];
      for (const file of candidates) {
        if (referenced.has(Number(file.id))) {
          skippedReferenced += 1;
          log(strapi, 'cleanup_skipped', { mediaId: file.id, reason: 'referenced' });
          continue;
        }
        try {
          await protectedMedia.deleteMediaFile(file);
          removed.push(Number(file.id));
          deleted += 1;
          log(strapi, 'cleanup_deleted', { mediaId: file.id });
        } catch (err) {
          log(strapi, 'cleanup_skipped', { mediaId: file.id, reason: 'delete_failed' });
        }
      }
      if (removed.length) {
        const remaining = ids.filter((id) => !removed.includes(Number(id)));
        try {
          await strapi.entityService.update(DRAFT_UID, draft.id, {
            data: {
              mediaOrder: remaining,
              coverMediaId: updatePure.resolveCoverMediaId(draft.coverMediaId, remaining),
            },
          });
        } catch (err) {
          log(strapi, 'cleanup_skipped', { sessionId: draft.sessionId, reason: 'order_update_failed' });
        }
      }
    }

    return { examined, deleted, skippedReferenced, draftsDiscarded };
  }

  /**
   * Staged protected bytes have no gallery to authorize against yet, so the
   * only reader is the session owner. No signed-token path exists here on
   * purpose: a staged photo is never shared before it is published.
   */
  async function streamDraftMedia({ userId, sessionId, mediaId, size }) {
    const loaded = await requireOwnedDraft({ userId, sessionId });
    if (loaded.error) return loaded.error;
    const { draft } = loaded;
    const id = updatePure.parsePositiveInt(mediaId);
    if (!id || !pure.mediaOrderOf(draft).includes(id)) {
      return { error: 'not_found', status: 404, message: 'Image is not available' };
    }
    const file = (await filesByIds([id]))?.[0];
    if (!pure.stagedFileOwnedBy(file, { sessionId: draft.sessionId, userId })) {
      log(strapi, 'access_denied', { sessionId: draft.sessionId, mediaId: id, reason: 'foreign_media' });
      return { error: 'not_found', status: 404, message: 'Image is not available' };
    }
    if (!mediaPure.isProtectedFile(file)) {
      return { error: 'not_found', status: 404, message: 'Image is not available' };
    }
    return protectedMedia.streamProtectedMedia({
      file,
      size: mediaPure.normalizeSize(size),
      requestId: `gd_${draft.sessionId.slice(-8)}`,
    });
  }

  return {
    createDraft,
    getActiveDraft,
    getDraft,
    patchDraft,
    setAudience,
    uploadDraftMedia,
    deleteDraftMedia,
    streamDraftMedia,
    publishDraft,
    discardDraft,
    cleanupStagedGalleryMedia,
  };
}

/**
 * Returns the file untouched unless it is HEIC, in which case it is decoded
 * and re-encoded as JPEG on disk so the upload provider stores something every
 * browser can render. Orientation is normalized during the re-encode.
 */
async function normalizePublicUploadFile(file) {
  const fs = require('fs');
  const os = require('os');
  const nodePath = require('path');
  const heic = require('../artistUpdates/heicDecode');

  const mime = String(file.mimetype || file.type || file.mime || '').toLowerCase();
  const filename = file.originalFilename || file.name || file.filename || '';
  const sourcePath = file.filepath || file.path;
  if (!sourcePath) return file;

  const head = fs.readFileSync(sourcePath, { encoding: null }).subarray(0, 64);
  if (!heic.looksLikeHeic(head, mime, filename)) return file;

  const buffer = fs.readFileSync(sourcePath);
  const sharp = require('sharp');
  const decoded = await heic.decodeHeicToPng(buffer);
  const jpeg = await sharp(decoded).rotate().jpeg({ quality: 88 }).toBuffer();
  const outPath = nodePath.join(os.tmpdir(), `faneqo-heic-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`);
  fs.writeFileSync(outPath, jpeg);

  return Object.assign(Object.create(Object.getPrototypeOf(file) || Object.prototype), file, {
    filepath: outPath,
    path: outPath,
    mimetype: 'image/jpeg',
    type: 'image/jpeg',
    size: jpeg.length,
    originalFilename: String(filename).replace(/\.hei[cf]$/i, '') + '.jpg',
    name: String(file.name || filename).replace(/\.hei[cf]$/i, '') + '.jpg',
  });
}

function validatePublicUpload(file) {
  const mime = String(file.mimetype || file.type || file.mime || '').toLowerCase();
  const filename = file.originalFilename || file.name || file.filename || '';
  if (!mediaPure.isAllowedUploadMime(mime)) {
    return { error: 'invalid_type', status: 400, message: mediaPure.unsupportedImageMessage(mime, filename) };
  }
  const bytes = Number(file.size);
  if (Number.isFinite(bytes) && bytes > mediaPure.MAX_IMAGE_BYTES) {
    return { error: 'too_large', status: 400, message: mediaPure.IMAGE_TOO_LARGE_COPY };
  }
  return { ok: true };
}

function stagedMediaPayload(row, classification) {
  const isProtected = classification === pure.CLASSIFICATION_PROTECTED;
  const formats = row.formats && typeof row.formats === 'object' ? row.formats : {};
  const item = isProtected ? null : updatePure.serializeMedia(row, { order: 0 });
  return {
    mediaId: row.id,
    url: isProtected ? null : (item?.url || null),
    thumbUrl: isProtected ? null : (item?.thumbUrl || null),
    width: row.width || formats.large?.width || null,
    height: row.height || formats.large?.height || null,
    mime: row.mime || null,
    size: row.size || null,
    protected: isProtected,
  };
}

module.exports = {
  createGalleryDraftService,
  validatePublicUpload,
  stagedMediaPayload,
};
