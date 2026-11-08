'use strict';

/**
 * Pure gallery-draft helpers — no Strapi, AWS, or Sharp I/O.
 *
 * A draft is a staging area, never a source of truth. The published
 * artist-update remains canonical; everything here exists so an artist can
 * close the tab mid-upload and come back to the same set of photos.
 */

const crypto = require('crypto');
const updatePure = require('../artistUpdates/artistUpdatePure');
const mediaPure = require('../artistUpdates/protectedMediaPure');

const DRAFT_KINDS = new Set(['show', 'general']);
const DRAFT_MODES = new Set(['create', 'edit']);
const DRAFT_STATUS_ACTIVE = 'active';
const DRAFT_STATUS_PUBLISHED = 'published';
const DRAFT_STATUS_DISCARDED = 'discarded';

const CLASSIFICATION_PUBLIC = 'public';
const CLASSIFICATION_PROTECTED = 'protected';

/** An abandoned draft stops being a resume candidate after a week. */
const STALE_DRAFT_MS = 7 * 24 * 60 * 60 * 1000;

/** Only these keys survive a round trip. A return path is never a credential. */
const RETURN_CONTEXT_KEYS = ['from', 'draftKey', 'returnGallery'];
const RETURN_CONTEXT_MAX = 120;

function newSessionId() {
  return `gd_${crypto.randomUUID()}`;
}

function normalizeKind(value) {
  const kind = String(value || '').trim();
  return DRAFT_KINDS.has(kind) ? kind : 'general';
}

function normalizeMode(value) {
  const mode = String(value || '').trim();
  return DRAFT_MODES.has(mode) ? mode : 'create';
}

/**
 * Storage class is derived from the audience, never from the client. A gated
 * audience means protected bytes; public means ordinary Upload files.
 */
function classificationForVisibility(visibility) {
  return mediaPure.isGatedVisibility(updatePure.defaultVisibility(visibility))
    ? CLASSIFICATION_PROTECTED
    : CLASSIFICATION_PUBLIC;
}

function sanitizeReturnContext(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const out = {};
  for (const key of RETURN_CONTEXT_KEYS) {
    const value = raw[key];
    if (value == null) continue;
    const text = String(value).trim().slice(0, RETURN_CONTEXT_MAX);
    if (text) out[key] = text;
  }
  return Object.keys(out).length ? out : null;
}

function draftOwned(draft, { userId, bandId } = {}) {
  if (!draft) return false;
  const owner = draft.createdByUser;
  const ownerId = owner && typeof owner === 'object' ? owner.id : owner;
  const band = draft.band;
  const draftBandId = band && typeof band === 'object' ? band.id : band;
  if (Number(ownerId) !== Number(userId)) return false;
  if (bandId != null && Number(draftBandId) !== Number(bandId)) return false;
  return true;
}

function mediaOrderOf(draft) {
  return updatePure.uniquePositiveIds(draft?.mediaOrder);
}

function captionsOf(draft) {
  const raw = draft?.mediaCaptions;
  return raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
}

/**
 * Validates one PATCH payload against the media the server knows is staged for
 * this session. `stagedIds` is server-derived; the client cannot widen it.
 */
function validateDraftPatch(patch = {}, { stagedIds = [], current = {} } = {}) {
  const out = {};
  const staged = new Set(updatePure.uniquePositiveIds(stagedIds));

  if (patch.title !== undefined) {
    const title = String(patch.title == null ? '' : patch.title).trim();
    if (title.length > updatePure.MAX_TITLE) {
      return { error: 'title_too_long', status: 400, message: `Keep the title under ${updatePure.MAX_TITLE} characters.` };
    }
    out.title = title || null;
  }

  if (patch.caption !== undefined) {
    const caption = String(patch.caption == null ? '' : patch.caption).trim();
    if (caption.length > updatePure.MAX_CAPTION) {
      return { error: 'caption_too_long', status: 400, message: `Keep the caption under ${updatePure.MAX_CAPTION} characters.` };
    }
    out.caption = caption;
  }

  let order = updatePure.uniquePositiveIds(current.mediaOrder);
  if (patch.mediaOrder !== undefined) {
    if (!Array.isArray(patch.mediaOrder)) {
      return { error: 'invalid_media_order', status: 400, message: 'Photo order could not be saved.' };
    }
    order = updatePure.uniquePositiveIds(patch.mediaOrder);
    if (order.length > updatePure.MAX_IMAGES) {
      return { error: 'too_many_images', status: 400, message: `You can add up to ${updatePure.MAX_IMAGES} photos.` };
    }
    const foreign = order.find((id) => !staged.has(id));
    if (foreign) {
      return { error: 'foreign_media', status: 403, message: 'That photo is not part of this gallery.' };
    }
    out.mediaOrder = order;
  }

  if (patch.mediaCaptions !== undefined) {
    const allowed = updatePure.uniquePositiveIds([...order, ...staged]);
    const captions = updatePure.normalizeMediaCaptions(patch.mediaCaptions, allowed, { dropUnknown: true });
    if (captions.error) return captions;
    out.mediaCaptions = captions.captions;
  }

  if (patch.coverMediaId !== undefined) {
    const cover = updatePure.parsePositiveInt(patch.coverMediaId);
    if (cover && !order.includes(cover)) {
      return { error: 'invalid_cover', status: 400, message: 'Choose a cover photo from this gallery.' };
    }
    out.coverMediaId = cover;
  }

  if (patch.returnContext !== undefined) {
    out.returnContext = sanitizeReturnContext(patch.returnContext);
  }

  return { patch: out };
}

/**
 * Changing the audience mid-upload can change where bytes must live. When the
 * storage class flips, the staged photos cannot be reused — the artist is asked
 * to confirm once, and only then are they cleared.
 */
function evaluateAudienceChange({
  from,
  to,
  stagedCount = 0,
  confirmClear = false,
  hasNight = false,
  protectedReady = false,
} = {}) {
  const next = updatePure.defaultVisibility(to);
  const current = updatePure.defaultVisibility(from);
  if (!['public', 'fan_list', 'show_attendees'].includes(next)) {
    return { error: 'invalid_visibility', status: 400, message: 'Choose who can see these photos.' };
  }
  if (mediaPure.isGatedVisibility(next) && !protectedReady) {
    return {
      error: 'gated_delivery_unavailable',
      status: 400,
      message: 'Fan List and show-only photos need protected delivery before they can be published.',
    };
  }
  if (next === 'show_attendees' && !hasNight) {
    return { error: 'show_required', status: 400, message: 'Choose the show these photos belong to.' };
  }
  const sameClass = classificationForVisibility(current) === classificationForVisibility(next);
  if (!Number(stagedCount) || sameClass) {
    return { to: next, clear: false, unchanged: next === current };
  }
  if (!confirmClear) {
    return {
      error: 'confirm_clear_required',
      status: 409,
      requiresConfirm: true,
      photoCount: Number(stagedCount),
      message: 'Changing who can see this gallery means these photos have to be uploaded again.',
    };
  }
  return { to: next, clear: true, unchanged: false };
}

/**
 * Tags written into `provider_metadata` so cleanup can positively identify a
 * staged gallery file instead of guessing at unreferenced uploads.
 */
function stagedMediaTags({ sessionId, bandId, uploaderUserId, classification, stagedAt } = {}) {
  return {
    faneqoGalleryStaged: true,
    gallerySessionId: String(sessionId || ''),
    bandId: bandId == null ? null : Number(bandId),
    uploaderUserId: uploaderUserId == null ? null : Number(uploaderUserId),
    domain: mediaPure.PROTECTED_DOMAIN_ARTIST_UPDATE,
    classification: classification === CLASSIFICATION_PROTECTED
      ? CLASSIFICATION_PROTECTED
      : CLASSIFICATION_PUBLIC,
    stagedAt: stagedAt || new Date().toISOString(),
  };
}

function fileMeta(file) {
  return file?.provider_metadata || file?.providerMetadata || {};
}

function isStagedGalleryFile(file) {
  return fileMeta(file).faneqoGalleryStaged === true;
}

function stagedFileSessionId(file) {
  const id = fileMeta(file).gallerySessionId;
  return id ? String(id) : null;
}

/**
 * Ownership for a staged file is session AND uploader. A file that is merely
 * unreferenced is never enough to act on.
 */
function stagedFileOwnedBy(file, { sessionId, userId } = {}) {
  if (!isStagedGalleryFile(file)) return false;
  if (stagedFileSessionId(file) !== String(sessionId || '')) return false;
  const meta = fileMeta(file);
  if (meta.uploaderUserId == null || Number(meta.uploaderUserId) !== Number(userId)) return false;
  return true;
}

function stagedFileClassification(file) {
  return fileMeta(file).classification === CLASSIFICATION_PROTECTED
    ? CLASSIFICATION_PROTECTED
    : CLASSIFICATION_PUBLIC;
}

function isStaleDraft(draft, { now = Date.now(), staleMs = STALE_DRAFT_MS } = {}) {
  if (!draft || draft.status !== DRAFT_STATUS_ACTIVE) return false;
  const stamp = new Date(draft.lastActivityAt || draft.updatedAt || draft.createdAt).getTime();
  if (!Number.isFinite(stamp)) return false;
  return now - stamp >= staleMs;
}

function stagedFilePastGrace(file, { now = Date.now(), graceMs = mediaPure.ORPHAN_GRACE_MS } = {}) {
  if (!isStagedGalleryFile(file)) return false;
  const created = new Date(file.createdAt).getTime();
  if (!Number.isFinite(created)) return false;
  return now - created >= graceMs;
}

/**
 * Upload append. Re-read `currentOrder` before each write — two photos
 * finishing at once must not last-write-wins one of them out of the draft.
 */
function appendMediaId(currentOrder, mediaId) {
  const order = updatePure.uniquePositiveIds(currentOrder);
  const id = updatePure.parsePositiveInt(mediaId);
  if (!id || order.includes(id)) return order;
  return [...order, id];
}

function removeMediaFromDraft({ mediaOrder, mediaCaptions, coverMediaId }, mediaId) {
  const id = updatePure.parsePositiveInt(mediaId);
  const order = updatePure.uniquePositiveIds(mediaOrder).filter((item) => item !== id);
  const captions = {};
  for (const [key, value] of Object.entries(mediaCaptions && typeof mediaCaptions === 'object' ? mediaCaptions : {})) {
    if (Number(key) === id) continue;
    captions[key] = value;
  }
  return {
    mediaOrder: order,
    mediaCaptions: captions,
    coverMediaId: updatePure.resolveCoverMediaId(coverMediaId, order),
  };
}

function canAcceptAnotherPhoto(stagedCount) {
  return Number(stagedCount || 0) < updatePure.MAX_IMAGES;
}

/**
 * Owner-authenticated read path for staged protected bytes. A staged file has
 * no gallery yet, so it cannot use the published `/artist-updates/:id/media`
 * proxy — the session stands in as the authorization scope.
 */
function draftMediaPath(sessionId, mediaId, size) {
  const session = String(sessionId || '').trim();
  const id = parseInt(mediaId, 10);
  if (!session || !Number.isFinite(id) || id <= 0) return null;
  const variant = mediaPure.normalizeSize(size || 'thumb');
  return `/api/gallery-drafts/${encodeURIComponent(session)}/media/${id}?size=${variant}`;
}

module.exports = {
  draftMediaPath,
  DRAFT_KINDS,
  DRAFT_MODES,
  DRAFT_STATUS_ACTIVE,
  DRAFT_STATUS_PUBLISHED,
  DRAFT_STATUS_DISCARDED,
  CLASSIFICATION_PUBLIC,
  CLASSIFICATION_PROTECTED,
  STALE_DRAFT_MS,
  RETURN_CONTEXT_KEYS,
  newSessionId,
  normalizeKind,
  normalizeMode,
  classificationForVisibility,
  sanitizeReturnContext,
  draftOwned,
  mediaOrderOf,
  captionsOf,
  appendMediaId,
  validateDraftPatch,
  evaluateAudienceChange,
  stagedMediaTags,
  isStagedGalleryFile,
  stagedFileSessionId,
  stagedFileOwnedBy,
  stagedFileClassification,
  isStaleDraft,
  stagedFilePastGrace,
  removeMediaFromDraft,
  canAcceptAnotherPhoto,
};
