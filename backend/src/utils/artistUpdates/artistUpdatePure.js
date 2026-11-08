'use strict';

/**
 * Pure Artist Update helpers — no Strapi I/O.
 * Gated media bytes are NOT treated as private unless GATED_MEDIA_DELIVERY_READY.
 */

const mediaPure = require('./protectedMediaPure');
const showContext = require('./showContextPure');

const MAX_CAPTION = 1200;
const MAX_TITLE = 120;
const MAX_IMAGES = 60;
/**
 * Show galleries used to stop at 12. One ceiling now: a night is not a smaller
 * story than a general post. Export name kept so existing callers keep working.
 */
const MAX_SHOW_IMAGES = 60;
const MAX_MEDIA_CAPTION = 300;
const ALLOWED_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const VISIBILITIES = new Set(['public', 'fan_list', 'show_attendees']);
const STATUS_DRAFT = 'draft';
const STATUS_PUBLISHED = 'published';
const STATUS_HIDDEN = 'hidden';
const CONTENT_KINDS = new Set(['image', 'gallery']);
const PUBLISH_IDEMPOTENCY_MIN = 8;
const PUBLISH_IDEMPOTENCY_MAX = 80;

/**
 * Static default is fail-closed. Live publish passes protectedReady from
 * isProtectedMediaConfigured() — never flip this constant to enable gating.
 */
const GATED_MEDIA_DELIVERY_READY = false;

function slugify(input, fallback) {
  const base = String(input || fallback || 'update')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return base || 'update';
}

function contentKindFromCount(count) {
  return Number(count) > 1 ? 'gallery' : 'image';
}

function parsePositiveInt(value) {
  const id = parseInt(value, 10);
  return Number.isFinite(id) && id > 0 ? id : null;
}

function isShowGalleryPublish({ visibility, showRecapId } = {}) {
  return visibility === 'show_attendees' || !!parsePositiveInt(showRecapId);
}

function maxImagesForPublish(input = {}) {
  return isShowGalleryPublish(input) ? MAX_SHOW_IMAGES : MAX_IMAGES;
}

function defaultVisibility(value) {
  if (value == null || value === '') return 'public';
  return value;
}

function validatePublishInput({
  title,
  bodyText,
  visibility,
  mediaIds,
  eventId,
  showRecapId,
  campaignId,
  protectedReady = GATED_MEDIA_DELIVERY_READY,
}) {
  const caption = String(bodyText || '').trim();
  if (caption.length > MAX_CAPTION) {
    return { error: 'caption_too_long', message: `Keep the caption under ${MAX_CAPTION} characters.` };
  }
  const heading = String(title || '').trim();
  if (heading.length > MAX_TITLE) {
    return { error: 'title_too_long', message: `Keep the title under ${MAX_TITLE} characters.` };
  }
  visibility = defaultVisibility(visibility);
  if (!VISIBILITIES.has(visibility)) {
    return { error: 'invalid_visibility', message: 'Choose who can see this update.' };
  }
  const ids = uniquePositiveIds(mediaIds);
  if (!ids.length) return { error: 'media_required', message: 'Add at least one photo.' };
  const recap = parsePositiveInt(showRecapId);
  const maxImages = maxImagesForPublish({ visibility, showRecapId: recap });
  if (ids.length > maxImages) {
    return {
      error: 'too_many_images',
      message: `You can add up to ${maxImages} photos.`,
    };
  }
  const event = parsePositiveInt(eventId);
  const campaign = showContext.idString(campaignId);
  if (visibility === 'show_attendees' && !showContext.hasShowScope({ eventId: event, showRecapId: recap, campaignId: campaign })) {
    return { error: 'show_required', message: 'Choose the show these photos belong to.' };
  }
  if ((visibility === 'fan_list' || visibility === 'show_attendees') && !protectedReady) {
    return {
      error: 'gated_delivery_unavailable',
      message: 'Fan List and show-only photos need protected delivery before they can be published.',
    };
  }
  return {
    title: heading || null,
    bodyText: caption,
    visibility,
    mediaIds: ids,
    eventId: event,
    showRecapId: recap,
    campaignId: campaign,
    contentKind: contentKindFromCount(ids.length),
  };
}

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatShowNightDate(value) {
  if (!value) return '';
  const str = String(value);
  const day = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!day) return '';
  const month = Number(day[2]);
  const date = Number(day[3]);
  if (month < 1 || month > 12 || date < 1 || date > 31) return '';
  return `${MONTHS_SHORT[month - 1]} ${date}`;
}

function deriveShowPhotosTitle({ title, recap, event } = {}) {
  const heading = String(title || '').trim();
  if (heading) return heading.slice(0, MAX_TITLE);
  const city = String(event?.city || recap?.city || '').trim();
  const venue = String(event?.venue || recap?.venue || '').trim();
  const date = formatShowNightDate(event?.date || recap?.showStartedAt || recap?.recapGeneratedAt);
  const place = city || venue;
  if (place && date) return `${place} — ${date}`.slice(0, MAX_TITLE);
  const fallback = String(recap?.showTitle || event?.title || place || date || '').trim();
  return fallback ? fallback.slice(0, MAX_TITLE) : null;
}

/**
 * A general gallery has no night to borrow a name from, so it gets the day it
 * was published rather than an empty header.
 */
function fallbackGalleryTitle(dateIso) {
  const parts = String(dateIso || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!parts) return 'Photos';
  const month = Number(parts[2]);
  const day = Number(parts[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return 'Photos';
  return `Photos — ${MONTHS_SHORT[month - 1]} ${day}, ${parts[1]}`;
}

/**
 * Per-photo captions are a map so reordering never rewrites them.
 * Keys are Upload file ids; unknown ids are refused, not silently dropped.
 */
function normalizeMediaCaptions(raw, allowedIds, { dropUnknown = false } = {}) {
  if (raw == null || raw === '') return { captions: {} };
  if (typeof raw !== 'object' || Array.isArray(raw)) {
    return { error: 'invalid_media_captions', status: 400, message: 'Photo captions could not be saved.' };
  }
  const allowed = allowedIds ? new Set(uniquePositiveIds(allowedIds)) : null;
  const captions = {};
  for (const [key, value] of Object.entries(raw)) {
    const id = parsePositiveInt(key);
    if (!id) continue;
    if (allowed && !allowed.has(id)) {
      if (dropUnknown) continue;
      return { error: 'foreign_media', status: 400, message: 'A caption pointed at a photo that is not in this gallery.' };
    }
    const text = String(value == null ? '' : value).trim();
    if (!text) continue;
    if (text.length > MAX_MEDIA_CAPTION) {
      return {
        error: 'media_caption_too_long',
        status: 400,
        message: `Keep each photo caption under ${MAX_MEDIA_CAPTION} characters.`,
      };
    }
    captions[String(id)] = text;
  }
  return { captions };
}

function mediaCaptionFor(captions, mediaId) {
  if (!captions || typeof captions !== 'object') return null;
  const text = captions[String(mediaId)];
  if (text == null) return null;
  const trimmed = String(text).trim();
  return trimmed ? trimmed.slice(0, MAX_MEDIA_CAPTION) : null;
}

/**
 * One gallery, one storage class. A half-public/half-protected set would make
 * every later visibility answer a lie, so it is refused at publish time.
 */
function evaluateMediaStorageMix(files) {
  const list = Array.isArray(files) ? files : [];
  if (!list.length) return { protected: false };
  const protectedCount = list.filter((file) => mediaPure.isProtectedFile(file)).length;
  if (protectedCount && protectedCount !== list.length) {
    return {
      error: 'mixed_media_storage',
      status: 400,
      message: 'These photos were uploaded two different ways. Start the gallery again so they all match.',
    };
  }
  return { protected: protectedCount === list.length };
}

function resolveCoverMediaId(coverMediaId, mediaOrder) {
  const ids = uniquePositiveIds(mediaOrder);
  const cover = parsePositiveInt(coverMediaId);
  if (cover && ids.includes(cover)) return cover;
  return ids[0] || null;
}

function isAllowedImageMime(mime) {
  return ALLOWED_MIMES.has(String(mime || '').toLowerCase());
}

function fileExceedsImageLimit(file) {
  const storedKb = Number(file?.size);
  if (!Number.isFinite(storedKb) || storedKb < 0) return false;
  return storedKb > (mediaPure.MAX_IMAGE_BYTES / 1000);
}

function fileProviderMeta(file) {
  return file?.provider_metadata || file?.providerMetadata || {};
}

/**
 * Gallery publish authorization for one Upload.file.
 * Protected files must be ArtistUpdate-domain, not Inbox conversation media.
 */
function authorizeArtistUpdateFile(file, { userId, bandId } = {}) {
  if (!file || !file.id) {
    return { error: 'invalid_attachment', reason: 'missing_file', message: 'Image is not available' };
  }
  if (!isAllowedImageMime(file.mime)) {
    return {
      error: 'invalid_attachment_type',
      reason: 'invalid_type',
      message: mediaPure.unsupportedImageMessage(file.mime, file.name || file.alternativeText),
    };
  }
  if (fileExceedsImageLimit(file)) {
    return { error: 'attachment_too_large', reason: 'too_large', message: mediaPure.IMAGE_TOO_LARGE_COPY };
  }
  if (!mediaPure.isProtectedFile(file)) {
    return { error: null, reason: null, protected: false };
  }
  if (mediaPure.protectedFileDomain(file) !== mediaPure.PROTECTED_DOMAIN_ARTIST_UPDATE) {
    return { error: 'invalid_attachment', reason: 'wrong_domain', message: 'Image is not available' };
  }
  const meta = fileProviderMeta(file);
  if (meta.uploaderUserId == null || Number(meta.uploaderUserId) !== Number(userId)) {
    return { error: 'invalid_attachment', reason: 'wrong_uploader', message: 'Image is not available' };
  }
  if (meta.bandId != null && Number(meta.bandId) !== Number(bandId)) {
    return { error: 'invalid_attachment', reason: 'wrong_band', message: 'Image is not available' };
  }
  return { error: null, reason: null, protected: true };
}

function uniquePositiveIds(raw) {
  const seen = new Set();
  const ids = [];
  for (const value of Array.isArray(raw) ? raw : []) {
    const id = parseInt(value, 10);
    if (!Number.isFinite(id) || id <= 0 || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }
  return ids;
}

function normalizePublishIdempotencyKey(raw) {
  if (raw == null || raw === '') return null;
  const key = String(raw).trim();
  if (!key) return null;
  if (key.length < PUBLISH_IDEMPOTENCY_MIN || key.length > PUBLISH_IDEMPOTENCY_MAX) {
    return { error: 'invalid_idempotency_key', message: 'Could not publish.' };
  }
  if (!/^[A-Za-z0-9._:-]+$/.test(key)) {
    return { error: 'invalid_idempotency_key', message: 'Could not publish.' };
  }
  return key;
}

function scopedPublishIdempotencyKey(userId, bandId, clientKey) {
  return `au-publish:v1:${Number(userId)}:${Number(bandId)}:${clientKey}`;
}

function publishReplayOwned({ existing, userId, bandId } = {}) {
  if (!existing) return false;
  const owner = existing.createdByUser;
  const ownerId = owner && typeof owner === 'object' ? owner.id : owner;
  const band = existing.band;
  const existingBand = band && typeof band === 'object' ? band.id : band;
  return Number(ownerId) === Number(userId) && Number(existingBand) === Number(bandId);
}

function aspectRatioFromDimensions(width, height) {
  const w = Number(width);
  const h = Number(height);
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return null;
  return w / h;
}

function displayableUrl(url) {
  const raw = url ? String(url) : '';
  if (!raw || raw.startsWith('faneqo-protected://')) return null;
  return raw;
}

function publicFormats(formats) {
  if (!formats || typeof formats !== 'object' || Array.isArray(formats)) return null;
  const out = {};
  for (const [key, value] of Object.entries(formats)) {
    const url = displayableUrl(value?.url);
    if (!url) continue;
    out[key] = {
      url,
      width: value.width || null,
      height: value.height || null,
    };
  }
  return Object.keys(out).length ? out : null;
}

function serializeMedia(file, { order = 0, caption = null } = {}) {
  if (!file) return null;
  if (file.mime && !isAllowedImageMime(file.mime)) return null;
  const originalUrl = displayableUrl(file.url);
  if (!originalUrl) return null;
  const formats = file.formats && typeof file.formats === 'object' ? file.formats : {};
  const thumbnailUrl = displayableUrl(
    formats.thumbnail?.url || formats.small?.url
  ) || originalUrl;
  const url = displayableUrl(formats.medium?.url || formats.small?.url) || originalUrl;
  const largeUrl = displayableUrl(formats.large?.url || formats.medium?.url) || originalUrl;
  const mediaId = file.id || null;
  const width = file.width || null;
  const height = file.height || null;
  const row = {
    type: 'image',
    id: mediaId,
    mediaId,
    url,
    thumbnailUrl,
    thumbUrl: thumbnailUrl,
    largeUrl,
    originalUrl,
    mime: file.mime || null,
    width,
    height,
    aspectRatio: aspectRatioFromDimensions(width, height),
    order,
    alt: file.alternativeText || 'Image',
    caption: caption ? String(caption).slice(0, MAX_MEDIA_CAPTION) : null,
    protected: false,
  };
  const formatsOut = publicFormats(formats);
  if (formatsOut) row.formats = formatsOut;
  return row;
}

/**
 * Read-model MediaItem list. Order is the populated parent media array —
 * the same array written as `media: mediaIds` on create (Strapi morph `order`).
 */
function serializeUpdateMediaList(files, { updateId, visibility, extraHosts, publicOrigin, captions, env } = {}) {
  const gated = mediaPure.isGatedVisibility(visibility);
  return (Array.isArray(files) ? files : []).map((file, index) => {
    const caption = mediaCaptionFor(captions, file?.id);
    if (gated || mediaPure.isProtectedFile(file)) {
      return mediaPure.serializeProtectedMedia(file, {
        updateId,
        alt: file?.alternativeText || null,
        caption,
        extraHosts,
        publicOrigin,
        order: index,
      }, env);
    }
    return serializeMedia(file, { order: index, caption });
  }).filter(Boolean);
}

/**
 * Access decision. `_vid` / visitor tokens must never grant access.
 */
function decideArtistUpdateAccess({
  update,
  viewer = {},
  visitorClaim = null,
} = {}) {
  if (visitorClaim) {
    // Explicitly ignored. Browser / _vid is not authorization.
  }
  if (!update) return { allowed: false, reason: 'not_found', teaser: false };
  const isArtist = !!viewer.isArtist;
  if (update.status !== 'published' && !isArtist) {
    return { allowed: false, reason: 'draft', teaser: false };
  }
  if (isArtist) {
    return { allowed: true, reason: 'artist', media: 'full', youWereThere: false };
  }

  const resolved = showContext.resolveArtistUpdateShowContext(update);
  const context = resolved.ok ? resolved.context : showContext.emptyContext();
  const attended = resolved.ok && showContext.attendanceMatchesShow(context, viewer);
  const fanOk = !!(viewer.fan && viewer.fan.status && viewer.fan.status !== 'removed');

  if (update.visibility === 'public') {
    return { allowed: true, reason: 'public', media: 'full', youWereThere: attended };
  }

  if (!viewer.userId) {
    if (update.visibility === 'fan_list') {
      return { allowed: false, reason: 'fan_list', teaser: true, youWereThere: false };
    }
    if (update.visibility === 'show_attendees') {
      return { allowed: false, reason: 'show_attendees', teaser: true, youWereThere: false };
    }
    return { allowed: false, reason: 'account_required', teaser: true, youWereThere: false };
  }

  if (update.visibility === 'fan_list') {
    if (!fanOk) return { allowed: false, reason: 'fan_list', teaser: true, youWereThere: false };
    return { allowed: true, reason: 'fan_list', media: 'full', youWereThere: attended };
  }

  if (update.visibility === 'show_attendees') {
    if (!resolved.ok || !showContext.showContextHasNight(context)) {
      return { allowed: false, reason: 'show_attendees', teaser: true, youWereThere: false };
    }
    if (!fanOk) return { allowed: false, reason: 'account_required', teaser: true, youWereThere: false };
    if (!attended) return { allowed: false, reason: 'show_attendees', teaser: true, youWereThere: false };
    return { allowed: true, reason: 'show_attendees', media: 'full', youWereThere: true };
  }

  return { allowed: false, reason: 'forbidden', teaser: false };
}

function publicCoverFromValue(value) {
  if (!value || typeof value !== 'object') return null;
  if (mediaPure.isProtectedFile(value)) return null;
  const formats = value.formats && typeof value.formats === 'object' ? value.formats : {};
  const raw = formats.medium?.url || formats.small?.url || formats.thumbnail?.url || value.url || null;
  const url = displayableUrl(raw);
  if (!url) return null;
  return { id: value.id || null, url };
}

function publicNightCover({ recap, event, artist } = {}) {
  return publicCoverFromValue(recap?.coverImage)
    || publicCoverFromValue(event?.image)
    || publicCoverFromValue(artist?.bandImg || artist?.image)
    || null;
}

function publicShowShell({ show, recap, event, context, artist } = {}) {
  const base = show && typeof show === 'object' ? show : {};
  const cover = publicNightCover({ recap, event, artist });
  if (!base.eventId && !base.showRecapId && !context?.eventId && !context?.showRecapId && !cover) {
    return show || null;
  }
  return {
    eventId: base.eventId || context?.eventId || recap?.eventId || event?.id || null,
    showRecapId: base.showRecapId || context?.showRecapId || recap?.id || null,
    showModeType: base.showModeType || context?.showModeType || recap?.showModeType || null,
    title: base.title || recap?.showTitle || event?.title || null,
    venue: base.venue || recap?.venue || event?.venue || null,
    city: base.city || recap?.city || event?.city || null,
    date: base.date || event?.date || recap?.performanceStartsAt || recap?.showStartedAt || recap?.recapGeneratedAt || null,
    nightSlug: recap?.nightSlug || null,
    publicStory: recap?.publicStory || null,
    cover,
  };
}

function publicTeaser(update, access) {
  const show = publicShowShell({
    show: update.show,
    recap: update.showRecap,
    event: update.event,
    context: {
      eventId: update.eventId,
      showRecapId: update.showRecapId,
      showModeType: update.showModeType,
    },
    artist: update.artist,
  });
  return {
    id: update.id,
    slug: update.slug,
    title: update.title || null,
    bodyText: access.allowed ? update.bodyText || '' : '',
    contentKind: update.contentKind,
    visibility: update.visibility,
    status: update.status,
    publishedAt: update.publishedAt,
    photoCount: update.photoCount || 0,
    locked: !access.allowed,
    lockReason: access.allowed ? null : access.reason,
    youWereThere: !!access.youWereThere,
    artist: update.artist
      ? { id: update.artist.id, name: update.artist.name || null, slug: update.artist.slug || null }
      : null,
    show,
    sourceType: 'artist_update',
    sourceId: update.id,
    relationship: access.allowed && access.relationship ? access.relationship : null,
    media: access.allowed && access.media === 'full' ? (update.media || []) : [],
  };
}

function mediaFilesAreProtected(files) {
  const list = Array.isArray(files) ? files : [];
  if (!list.length) return false;
  return list.every((file) => mediaPure.isProtectedFile(file));
}

function evaluateVisibilityChange({
  from,
  to,
  mediaFiles = [],
  hasNight = false,
  protectedReady = GATED_MEDIA_DELIVERY_READY,
} = {}) {
  const next = defaultVisibility(to);
  const current = defaultVisibility(from);
  if (!VISIBILITIES.has(next)) {
    return { error: 'invalid_visibility', status: 400, message: 'Choose who can see this update.' };
  }
  if (next === current) return { from: current, to: next, unchanged: true };
  const gatedTo = mediaPure.isGatedVisibility(next);
  if (gatedTo && !protectedReady) {
    return {
      error: 'gated_delivery_unavailable',
      status: 400,
      message: 'Fan List and show-only photos need protected delivery before they can be published.',
    };
  }
  /**
   * Storage class, not the label, is what actually protects bytes. A published
   * gallery may move between audiences that share a storage class, but it can
   * never cross public<->protected by metadata alone — the media has to be
   * re-uploaded into the other store. Every surface enforces this identically.
   */
  const hasMedia = Array.isArray(mediaFiles) && mediaFiles.length > 0;
  if (hasMedia) {
    const mediaIsProtected = mediaFilesAreProtected(mediaFiles);
    if (gatedTo && !mediaIsProtected) {
      return {
        error: 'unsafe_visibility_transition',
        status: 400,
        message: 'These photos were uploaded as public files and cannot become exclusive without a new protected upload.',
      };
    }
    if (!gatedTo && mediaIsProtected) {
      return {
        error: 'unsafe_visibility_transition',
        status: 400,
        message: 'These photos were uploaded as protected files and cannot become public without a new public upload.',
      };
    }
  }
  if (next === 'show_attendees' && !hasNight) {
    return { error: 'show_required', status: 400, message: 'Choose the show these photos belong to.' };
  }
  return { from: current, to: next, unchanged: false };
}

function isHiddenStatus(status) {
  return String(status || '') === STATUS_HIDDEN;
}

function isAvailableStatus(status) {
  return String(status || '') === STATUS_PUBLISHED;
}

/**
 * Deliberate "the artist took this down" answer. Distinct from not_found so a
 * fan or share-link visitor gets a designed state instead of a bare 404.
 */
function galleryUnavailableResult() {
  return {
    error: 'gallery_unavailable',
    status: 410,
    message: 'This gallery is no longer available.',
  };
}

function evaluateHide({ status } = {}) {
  const current = String(status || '');
  if (current === STATUS_HIDDEN) return { to: STATUS_HIDDEN, unchanged: true };
  if (current !== STATUS_PUBLISHED) {
    return { error: 'not_published', status: 400, message: 'This gallery is not published.' };
  }
  return { to: STATUS_HIDDEN, unchanged: false };
}

function evaluateRestore({ status } = {}) {
  const current = String(status || '');
  if (current === STATUS_PUBLISHED) return { to: STATUS_PUBLISHED, unchanged: true };
  if (current !== STATUS_HIDDEN) {
    return { error: 'not_hidden', status: 400, message: 'This gallery is not hidden.' };
  }
  return { to: STATUS_PUBLISHED, unchanged: false };
}

/**
 * Recap detach only clears the recap link; the event link is kept, so the
 * gallery can still surface in that night's archive. A show_attendees gallery
 * IS its night — detaching would leave the access engine no night to check and
 * lock the gallery for everyone, so it is refused instead.
 */
function evaluateRecapDetach({ visibility, showRecapId } = {}) {
  if (!parsePositiveInt(showRecapId)) {
    return { error: 'not_attached', status: 400, message: 'This gallery is not part of a night.' };
  }
  if (defaultVisibility(visibility) === 'show_attendees') {
    return {
      error: 'detach_blocked_show_only',
      status: 400,
      message: 'These photos are only for the people who were at this show, so they cannot be taken off this night. Hide the gallery instead to take it down.',
    };
  }
  return { showRecapId: null };
}

module.exports = {
  MAX_CAPTION,
  MAX_TITLE,
  MAX_IMAGES,
  MAX_SHOW_IMAGES,
  MAX_MEDIA_CAPTION,
  STATUS_DRAFT,
  STATUS_PUBLISHED,
  STATUS_HIDDEN,
  isShowGalleryPublish,
  maxImagesForPublish,
  GATED_MEDIA_DELIVERY_READY,
  slugify,
  contentKindFromCount,
  uniquePositiveIds,
  normalizePublishIdempotencyKey,
  scopedPublishIdempotencyKey,
  publishReplayOwned,
  aspectRatioFromDimensions,
  defaultVisibility,
  validatePublishInput,
  evaluateVisibilityChange,
  isHiddenStatus,
  isAvailableStatus,
  galleryUnavailableResult,
  evaluateHide,
  evaluateRestore,
  evaluateRecapDetach,
  mediaFilesAreProtected,
  publicCoverFromValue,
  publicNightCover,
  publicShowShell,
  authorizeArtistUpdateFile,
  deriveShowPhotosTitle,
  fallbackGalleryTitle,
  formatShowNightDate,
  normalizeMediaCaptions,
  mediaCaptionFor,
  evaluateMediaStorageMix,
  resolveCoverMediaId,
  isAllowedImageMime,
  serializeMedia,
  serializeUpdateMediaList,
  parsePositiveInt,
  decideArtistUpdateAccess,
  publicTeaser,
};
