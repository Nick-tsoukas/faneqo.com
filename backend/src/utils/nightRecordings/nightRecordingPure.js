'use strict';

/**
 * Pure Night Recording helpers — no Strapi I/O.
 * Provider URLs are stored, never fetched. Upload bytes stay in Upload/S3.
 */

const mediaPure = require('../artistUpdates/protectedMediaPure');

const MAX_TITLE = 120;
const MAX_CAPTION = 1200;
const MAX_PROVIDER_URL = 2048;
const MAX_RECORDINGS_PER_NIGHT = 12;
const SUGGESTED_PRODUCT_LIMIT = 4;
const OWNER_GRACE_MS = 15 * 60 * 1000;
const STRAPI_UPLOAD_KB_FACTOR = 1000;
const MAX_AUDIO_BYTES = 50 * 1024 * 1024;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
const MAX_POSTER_BYTES = mediaPure.MAX_IMAGE_BYTES;
const IDEMPOTENCY_MIN = 8;
const IDEMPOTENCY_MAX = 80;

const KINDS = new Set(['audio', 'video']);
const SOURCES = new Set(['upload', 'youtube', 'spotify', 'external']);
const VISIBILITIES = new Set(['public', 'fan_list', 'show_attendees']);
const STATUSES = new Set(['draft', 'published']);
const SPOTIFY_RESOURCE_TYPES = new Set(['track', 'album', 'playlist']);

const ALLOWED_AUDIO_MIMES = new Set([
  'audio/mpeg',
  'audio/mp3',
  'audio/mp4',
  'audio/x-m4a',
  'audio/m4a',
  'audio/aac',
  'audio/wav',
  'audio/x-wav',
  'audio/wave',
  'audio/ogg',
  'audio/webm',
]);

const ALLOWED_VIDEO_MIMES = new Set(['video/mp4']);

const YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtu.be',
  'www.youtu.be',
]);

const SPOTIFY_HOSTS = new Set([
  'open.spotify.com',
  'play.spotify.com',
]);

const YOUTUBE_ID_RE = /^[A-Za-z0-9_-]{11}$/;
const SPOTIFY_ID_RE = /^[A-Za-z0-9]{22}$/;

function parsePositiveInt(value) {
  const id = parseInt(value, 10);
  return Number.isFinite(id) && id > 0 ? id : null;
}

function defaultVisibility(value) {
  if (value == null || value === '') return 'public';
  return value;
}

function defaultStatus(value) {
  if (value == null || value === '') return 'draft';
  return value;
}

function relId(row, key) {
  const value = row?.[key];
  if (value == null) return null;
  if (typeof value === 'object') return value.id || value.data?.id || null;
  return value;
}

function bytesToStoredUploadKb(bytes) {
  return Math.round((Number(bytes) / STRAPI_UPLOAD_KB_FACTOR) * 100) / 100;
}

function uploadFileExceedsByteLimit(file, maxBytes) {
  const storedKb = Number(file?.size);
  if (!Number.isFinite(storedKb) || storedKb < 0) return false;
  return storedKb > bytesToStoredUploadKb(maxBytes);
}

function mimeOf(file) {
  return String(file?.mime || '').toLowerCase();
}

function isAllowedAudioMime(mime) {
  return ALLOWED_AUDIO_MIMES.has(String(mime || '').toLowerCase());
}

function isAllowedVideoMime(mime) {
  return ALLOWED_VIDEO_MIMES.has(String(mime || '').toLowerCase());
}

function displayableUrl(url) {
  const raw = url ? String(url) : '';
  if (!raw || raw.startsWith('faneqo-protected://')) return null;
  if (/X-Amz-Signature|X-Amz-Credential|X-Amz-Security-Token/i.test(raw)) return null;
  return raw;
}

function hostnameOf(url) {
  try {
    return String(new URL(url).hostname || '').toLowerCase();
  } catch {
    return '';
  }
}

function stripWww(host) {
  return String(host || '').replace(/^www\./, '');
}

function youtubeVideoIdFromUrl(raw) {
  let parsed;
  try {
    parsed = new URL(String(raw || '').trim());
  } catch {
    return null;
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null;
  const host = parsed.hostname.toLowerCase();
  if (!YOUTUBE_HOSTS.has(host)) return null;

  if (stripWww(host) === 'youtu.be') {
    const id = parsed.pathname.split('/').filter(Boolean)[0] || '';
    return YOUTUBE_ID_RE.test(id) ? id : null;
  }

  const parts = parsed.pathname.split('/').filter(Boolean);
  if (parts[0] === 'embed' || parts[0] === 'live' || parts[0] === 'shorts' || parts[0] === 'v') {
    const id = parts[1] || '';
    return YOUTUBE_ID_RE.test(id) ? id : null;
  }
  const v = parsed.searchParams.get('v') || '';
  return YOUTUBE_ID_RE.test(v) ? v : null;
}

function parseYoutubeProvider(raw) {
  const id = youtubeVideoIdFromUrl(raw);
  if (!id) {
    return { error: 'invalid_youtube_url', message: 'Use a valid YouTube video link.' };
  }
  return {
    providerType: 'youtube',
    providerResourceType: 'video',
    providerResourceId: id,
    providerUrl: `https://www.youtube.com/watch?v=${id}`,
  };
}

function spotifyPathResource(parsed) {
  const parts = parsed.pathname.split('/').filter(Boolean);
  if (parts[0] && parts[0].startsWith('intl-') && parts[1] && parts[2]) {
    return { type: parts[1], id: parts[2].split('?')[0] };
  }
  if (parts[0] && parts[1]) {
    return { type: parts[0], id: parts[1].split('?')[0] };
  }
  return null;
}

function parseSpotifyProvider(raw) {
  const trimmed = String(raw || '').trim();
  const uri = trimmed.match(/^spotify:(track|album|playlist):([A-Za-z0-9]{22})$/i);
  if (uri) {
    const type = uri[1].toLowerCase();
    const id = uri[2];
    return {
      providerType: 'spotify',
      providerResourceType: type,
      providerResourceId: id,
      providerUrl: `https://open.spotify.com/${type}/${id}`,
    };
  }

  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { error: 'invalid_spotify_url', message: 'Use a valid Spotify track, album, or playlist link.' };
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return { error: 'invalid_spotify_url', message: 'Use a valid Spotify track, album, or playlist link.' };
  }
  if (!SPOTIFY_HOSTS.has(parsed.hostname.toLowerCase())) {
    return { error: 'invalid_spotify_url', message: 'Use a valid Spotify track, album, or playlist link.' };
  }
  const resource = spotifyPathResource(parsed);
  if (!resource || !SPOTIFY_RESOURCE_TYPES.has(resource.type) || !SPOTIFY_ID_RE.test(resource.id)) {
    return { error: 'invalid_spotify_url', message: 'Use a Spotify track, album, or playlist — not an artist or episode.' };
  }
  return {
    providerType: 'spotify',
    providerResourceType: resource.type,
    providerResourceId: resource.id,
    providerUrl: `https://open.spotify.com/${resource.type}/${resource.id}`,
  };
}

function looksLikeYoutubeHost(url) {
  const host = hostnameOf(url);
  return YOUTUBE_HOSTS.has(host);
}

function looksLikeSpotifyHost(url) {
  const host = hostnameOf(url);
  if (SPOTIFY_HOSTS.has(host)) return true;
  return /^spotify:(track|album|playlist):/i.test(String(url || '').trim());
}

function parseExternalProvider(raw) {
  const trimmed = String(raw || '').trim();
  if (!trimmed) {
    return { error: 'invalid_external_url', message: 'Add a valid https link.' };
  }
  if (/<\s*(iframe|script|object|embed)\b/i.test(trimmed)) {
    return { error: 'invalid_external_url', message: 'Paste a link, not embed code.' };
  }
  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { error: 'invalid_external_url', message: 'Add a valid https link.' };
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return { error: 'invalid_external_url', message: 'Links must start with https://' };
  }
  if (parsed.protocol !== 'https:') {
    return { error: 'invalid_external_url', message: 'Links must start with https://' };
  }
  if (!parsed.hostname) {
    return { error: 'invalid_external_url', message: 'Add a valid https link.' };
  }
  if (parsed.toString().length > MAX_PROVIDER_URL) {
    return { error: 'invalid_external_url', message: 'That link is too long.' };
  }
  if (looksLikeYoutubeHost(trimmed)) {
    return { error: 'use_youtube_source', message: 'Use YouTube as the source for YouTube links.' };
  }
  if (looksLikeSpotifyHost(trimmed)) {
    return { error: 'use_spotify_source', message: 'Use Spotify as the source for Spotify links.' };
  }
  return {
    providerType: 'external',
    providerResourceType: null,
    providerResourceId: null,
    providerUrl: parsed.toString(),
  };
}

function parseProvider(source, rawUrl) {
  if (source === 'youtube') return parseYoutubeProvider(rawUrl);
  if (source === 'spotify') return parseSpotifyProvider(rawUrl);
  if (source === 'external') return parseExternalProvider(rawUrl);
  return { error: 'invalid_source', message: 'Choose a valid recording source.' };
}

function kindSourceError(kind, source) {
  if (source === 'youtube' && kind !== 'video') {
    return { error: 'invalid_kind_source', message: 'YouTube recordings are video.' };
  }
  if (source === 'spotify' && kind !== 'audio') {
    return { error: 'invalid_kind_source', message: 'Spotify recordings are audio.' };
  }
  return null;
}

function normalizeIdempotencyKey(raw) {
  if (raw == null || raw === '') return null;
  const key = String(raw).trim();
  if (!key) return null;
  if (key.length < IDEMPOTENCY_MIN || key.length > IDEMPOTENCY_MAX) {
    return { error: 'invalid_idempotency_key', message: 'Could not save this recording.' };
  }
  if (!/^[A-Za-z0-9._:-]+$/.test(key)) {
    return { error: 'invalid_idempotency_key', message: 'Could not save this recording.' };
  }
  return key;
}

function scopedCreateIdempotencyKey(userId, recapId, clientKey) {
  return `nr-create:v1:${Number(userId)}:${Number(recapId)}:${clientKey}`;
}

function createReplayOwned({ existing, userId, recapId } = {}) {
  if (!existing) return false;
  const owner = existing.createdByUser;
  const ownerId = owner && typeof owner === 'object' ? owner.id : owner;
  const recap = existing.showRecap;
  const existingRecap = recap && typeof recap === 'object' ? recap.id : recap;
  return Number(ownerId) === Number(userId) && Number(existingRecap) === Number(recapId);
}

function parseDurationSeconds(value) {
  if (value == null || value === '') return null;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0 || n > 24 * 60 * 60) {
    return { error: 'invalid_duration', message: 'Duration must be a whole number of seconds.' };
  }
  return n;
}

function parseSortOrder(value, fallback = 0) {
  if (value == null || value === '') return fallback;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0 || n > 100000) {
    return { error: 'invalid_sort_order', message: 'Choose a valid order.' };
  }
  return n;
}

function validateRecordingInput(input = {}, { partial = false } = {}) {
  const title = input.title == null ? (partial ? undefined : '') : String(input.title);
  const caption = input.caption == null ? (partial ? undefined : '') : String(input.caption);
  if (title !== undefined && String(title).trim().length > MAX_TITLE) {
    return { error: 'title_too_long', message: `Keep the title under ${MAX_TITLE} characters.` };
  }
  if (caption !== undefined && String(caption).trim().length > MAX_CAPTION) {
    return { error: 'caption_too_long', message: `Keep the caption under ${MAX_CAPTION} characters.` };
  }

  let kind = input.kind;
  let source = input.source;
  if (!partial || kind !== undefined) {
    if (!KINDS.has(kind)) {
      return { error: 'invalid_kind', message: 'Choose audio or video.' };
    }
  }
  if (!partial || source !== undefined) {
    if (!SOURCES.has(source)) {
      return { error: 'invalid_source', message: 'Choose a valid recording source.' };
    }
  }
  if (kind && source) {
    const combo = kindSourceError(kind, source);
    if (combo) return combo;
  }

  const visibility = input.visibility === undefined
    ? (partial ? undefined : defaultVisibility(input.visibility))
    : defaultVisibility(input.visibility);
  if (visibility !== undefined && !VISIBILITIES.has(visibility)) {
    return { error: 'invalid_visibility', message: 'Choose who can see this recording.' };
  }

  const status = input.status === undefined
    ? (partial ? undefined : defaultStatus(input.status))
    : defaultStatus(input.status);
  if (status !== undefined && !STATUSES.has(status)) {
    return { error: 'invalid_status', message: 'Choose draft or published.' };
  }

  const duration = input.durationSeconds === undefined
    ? (partial ? undefined : parseDurationSeconds(null))
    : parseDurationSeconds(input.durationSeconds);
  if (duration && typeof duration === 'object' && duration.error) return duration;

  const sortOrder = input.sortOrder === undefined
    ? (partial ? undefined : parseSortOrder(input.sortOrder, 0))
    : parseSortOrder(input.sortOrder, 0);
  if (sortOrder && typeof sortOrder === 'object' && sortOrder.error) return sortOrder;

  const uploadedMediaId = input.uploadedMediaId === undefined
    ? (partial ? undefined : null)
    : parsePositiveInt(input.uploadedMediaId);
  const posterImageId = input.posterImageId === undefined
    ? (partial ? undefined : null)
    : (input.posterImageId == null || input.posterImageId === ''
      ? null
      : parsePositiveInt(input.posterImageId));
  if (input.posterImageId !== undefined && input.posterImageId != null && input.posterImageId !== '' && !posterImageId) {
    return { error: 'invalid_poster', message: 'Poster image is not available.' };
  }

  let provider = undefined;
  if (!partial || input.providerUrl !== undefined || (source && source !== 'upload')) {
    if (source === 'upload') {
      if (input.providerUrl) {
        return { error: 'provider_not_allowed', message: 'Uploaded recordings cannot include a provider link.' };
      }
      provider = {
        providerType: null,
        providerResourceType: null,
        providerResourceId: null,
        providerUrl: null,
      };
      if (uploadedMediaId === null || uploadedMediaId === undefined) {
        if (!partial || input.uploadedMediaId !== undefined) {
          return { error: 'media_required', message: 'Attach an uploaded audio or video file.' };
        }
      }
    } else if (source) {
      if (uploadedMediaId) {
        return { error: 'upload_not_allowed', message: 'Provider recordings cannot attach uploaded media.' };
      }
      const parsed = parseProvider(source, input.providerUrl);
      if (parsed.error) return parsed;
      provider = parsed;
    }
  }

  const idempotency = input.createIdempotencyKey === undefined
    ? undefined
    : normalizeIdempotencyKey(input.createIdempotencyKey);
  if (idempotency && idempotency.error) return idempotency;

  return {
    title: title === undefined ? undefined : (String(title).trim() || null),
    caption: caption === undefined ? undefined : String(caption).trim(),
    kind,
    source,
    visibility,
    status,
    durationSeconds: duration === undefined ? undefined : duration,
    sortOrder,
    uploadedMediaId,
    posterImageId,
    provider,
    createIdempotencyKey: idempotency,
  };
}

function canPublishGatedUpload({ source, visibility, status } = {}) {
  if (status !== 'published') return true;
  if (!mediaPure.isGatedVisibility(visibility)) return true;
  if (source !== 'upload') return true;
  return false;
}

function gatedUploadPublishError() {
  return {
    error: 'gated_delivery_unavailable',
    status: 400,
    message: 'Fan List and show-only uploads need protected audio/video delivery before they can be published. Save as a draft, or use a YouTube/Spotify/external link.',
  };
}

function fileProviderMeta(file) {
  return file?.provider_metadata || file?.providerMetadata || {};
}

function authorizeOwnedMediaFile(file, { userId, now = Date.now() } = {}) {
  if (!file || !file.id) {
    return { error: 'invalid_attachment', reason: 'missing_file', message: 'Media is not available.' };
  }
  if (mediaPure.isProtectedFile(file)) {
    return { error: 'invalid_attachment', reason: 'protected', message: 'Night recordings cannot use protected Gallery or message files.' };
  }
  const ownerId = file.createdBy && typeof file.createdBy === 'object'
    ? file.createdBy.id
    : file.createdBy;
  if (ownerId != null && Number(ownerId) === Number(userId)) {
    return { error: null };
  }
  if (ownerId != null && Number(ownerId) !== Number(userId)) {
    return { error: 'invalid_attachment', reason: 'wrong_uploader', message: 'Media is not available.' };
  }
  const uploaderId = fileProviderMeta(file).uploaderUserId;
  if (uploaderId != null && Number(uploaderId) === Number(userId)) {
    return { error: null };
  }
  if (uploaderId != null && Number(uploaderId) !== Number(userId)) {
    return { error: 'invalid_attachment', reason: 'wrong_uploader', message: 'Media is not available.' };
  }
  if (!file.createdAt) {
    return { error: 'invalid_attachment', reason: 'missing_created', message: 'Media is not available.' };
  }
  const created = new Date(file.createdAt).getTime();
  if (!Number.isFinite(created) || now - created > OWNER_GRACE_MS) {
    return { error: 'invalid_attachment', reason: 'unowned', message: 'Media is not available.' };
  }
  return { error: null };
}

function authorizeUploadedRecordingFile(file, { userId, kind, now } = {}) {
  const owned = authorizeOwnedMediaFile(file, { userId, now });
  if (owned.error) return owned;
  const mime = mimeOf(file);
  if (kind === 'audio') {
    if (!isAllowedAudioMime(mime)) {
      return {
        error: 'invalid_attachment_type',
        reason: 'invalid_type',
        message: 'Upload an MP3, M4A, WAV, AAC, or OGG audio file.',
      };
    }
    if (uploadFileExceedsByteLimit(file, MAX_AUDIO_BYTES)) {
      return { error: 'attachment_too_large', message: 'Audio files can be up to 50 MB.' };
    }
    return { error: null };
  }
  if (kind === 'video') {
    if (!isAllowedVideoMime(mime)) {
      return {
        error: 'invalid_attachment_type',
        reason: 'invalid_type',
        message: 'Uploaded video is MP4 only for now. Use a YouTube link for other video.',
      };
    }
    if (uploadFileExceedsByteLimit(file, MAX_VIDEO_BYTES)) {
      return { error: 'attachment_too_large', message: 'Video files can be up to 50 MB.' };
    }
    return { error: null };
  }
  return { error: 'invalid_kind', message: 'Choose audio or video.' };
}

function authorizePosterFile(file, { userId, now } = {}) {
  const owned = authorizeOwnedMediaFile(file, { userId, now });
  if (owned.error) {
    return { ...owned, message: owned.message === 'Media is not available.' ? 'Poster image is not available.' : owned.message };
  }
  if (!mediaPure.isAllowedImageMime(file.mime)) {
    return {
      error: 'invalid_poster_type',
      message: mediaPure.unsupportedImageMessage(file.mime, file.name || file.alternativeText),
    };
  }
  if (uploadFileExceedsByteLimit(file, MAX_POSTER_BYTES)) {
    return { error: 'poster_too_large', message: mediaPure.IMAGE_TOO_LARGE_COPY };
  }
  return { error: null };
}

function compareRecordings(a, b) {
  const orderA = Number.isInteger(a?.sortOrder) ? a.sortOrder : 0;
  const orderB = Number.isInteger(b?.sortOrder) ? b.sortOrder : 0;
  if (orderA !== orderB) return orderA - orderB;
  return (Number(a?.id) || 0) - (Number(b?.id) || 0);
}

function sortRecordings(rows) {
  return [...(rows || [])].sort(compareRecordings);
}

function nextSortOrder(existingRows) {
  let max = -1;
  for (const row of existingRows || []) {
    const n = Number(row.sortOrder);
    if (Number.isInteger(n) && n > max) max = n;
  }
  return max + 1;
}

/**
 * Access decision. localStorage / _vid / query claims are ignored.
 */
function decideNightRecordingAccess({
  recording,
  viewer = {},
  visitorClaim = null,
} = {}) {
  if (visitorClaim) {
    // Explicitly ignored. Browser / _vid is not authorization.
  }
  if (!recording) return { allowed: false, reason: 'not_found', teaser: false };
  const isArtist = !!viewer.isArtist;
  if (recording.status !== 'published' && !isArtist) {
    return { allowed: false, reason: 'draft', teaser: false };
  }
  if (isArtist) {
    return { allowed: true, reason: 'artist', media: 'full', youWereThere: !!viewer.attended };
  }

  const fanOk = !!(viewer.fan && viewer.fan.status && viewer.fan.status !== 'removed');
  const attended = !!viewer.attended;

  if (recording.visibility === 'public') {
    return { allowed: true, reason: 'public', media: 'full', youWereThere: attended };
  }

  if (!viewer.userId) {
    if (recording.visibility === 'fan_list') {
      return { allowed: false, reason: 'fan_list', teaser: true, youWereThere: false };
    }
    if (recording.visibility === 'show_attendees') {
      return { allowed: false, reason: 'show_attendees', teaser: true, youWereThere: false };
    }
    return { allowed: false, reason: 'account_required', teaser: true, youWereThere: false };
  }

  if (recording.visibility === 'fan_list') {
    if (!fanOk) return { allowed: false, reason: 'fan_list', teaser: true, youWereThere: false };
    return { allowed: true, reason: 'fan_list', media: 'full', youWereThere: attended };
  }

  if (recording.visibility === 'show_attendees') {
    if (!fanOk) return { allowed: false, reason: 'account_required', teaser: true, youWereThere: false };
    if (!attended) return { allowed: false, reason: 'show_attendees', teaser: true, youWereThere: false };
    return { allowed: true, reason: 'show_attendees', media: 'full', youWereThere: true };
  }

  return { allowed: false, reason: 'forbidden', teaser: false };
}

function serializePublicMedia(file) {
  if (!file || mediaPure.isProtectedFile(file)) return null;
  const url = displayableUrl(file.url);
  if (!url) return null;
  return {
    id: file.id || null,
    url,
    mime: file.mime || null,
    type: String(file.mime || '').startsWith('video/') ? 'video' : 'audio',
  };
}

function serializePublicPoster(file) {
  if (!file || mediaPure.isProtectedFile(file)) return null;
  const formats = file.formats && typeof file.formats === 'object' ? file.formats : {};
  const raw = formats.medium?.url || formats.small?.url || formats.thumbnail?.url || file.url || null;
  const url = displayableUrl(raw);
  if (!url) return null;
  return {
    url,
    width: file.width || formats.medium?.width || null,
    height: file.height || formats.medium?.height || null,
    alternativeText: file.alternativeText || file.alt || null,
  };
}

function serializeProvider(recording) {
  if (!recording?.providerUrl && !recording?.providerType) return null;
  return {
    type: recording.providerType || recording.source || null,
    resourceType: recording.providerResourceType || null,
    resourceId: recording.providerResourceId || null,
    url: recording.providerUrl || null,
  };
}

function publicRecordingCard(recording, access) {
  if (!recording) return null;
  if (!access.allowed && !access.teaser) return null;
  const allowed = !!access.allowed;
  return {
    id: recording.id,
    title: recording.title || null,
    caption: allowed ? (recording.caption || '') : '',
    kind: recording.kind,
    source: recording.source,
    visibility: recording.visibility,
    duration: Number.isInteger(recording.durationSeconds) ? recording.durationSeconds : null,
    locked: !allowed,
    lockReason: allowed ? null : access.reason,
    youWereThere: !!access.youWereThere,
    provider: allowed ? serializeProvider(recording) : null,
    media: allowed ? serializePublicMedia(recording.uploadedMedia) : null,
    poster: allowed ? serializePublicPoster(recording.posterImage) : null,
  };
}

function managementRecording(recording) {
  if (!recording) return null;
  return {
    id: recording.id,
    bandId: recording.bandId || relId(recording, 'band'),
    showRecapId: recording.showRecapId || relId(recording, 'showRecap'),
    title: recording.title || null,
    caption: recording.caption || '',
    kind: recording.kind,
    source: recording.source,
    visibility: recording.visibility,
    status: recording.status,
    sortOrder: Number.isInteger(recording.sortOrder) ? recording.sortOrder : 0,
    durationSeconds: Number.isInteger(recording.durationSeconds) ? recording.durationSeconds : null,
    publishedAt: recording.publishedAt || null,
    provider: serializeProvider(recording),
    media: serializePublicMedia(recording.uploadedMedia),
    poster: serializePublicPoster(recording.posterImage),
  };
}

function toRecord(row) {
  if (!row) return null;
  const uploaded = row.uploadedMedia;
  const poster = row.posterImage;
  return {
    id: row.id,
    bandId: relId(row, 'band'),
    showRecapId: relId(row, 'showRecap'),
    createdByUser: row.createdByUser,
    title: row.title || null,
    caption: row.caption || '',
    kind: row.kind,
    source: row.source,
    providerUrl: row.providerUrl || null,
    providerType: row.providerType || null,
    providerResourceType: row.providerResourceType || null,
    providerResourceId: row.providerResourceId || null,
    uploadedMedia: uploaded && typeof uploaded === 'object' && !Array.isArray(uploaded)
      ? uploaded
      : (Array.isArray(uploaded) ? uploaded[0] : null),
    posterImage: poster && typeof poster === 'object' && !Array.isArray(poster)
      ? poster
      : (Array.isArray(poster) ? poster[0] : null),
    durationSeconds: Number.isInteger(row.durationSeconds) ? row.durationSeconds : null,
    sortOrder: Number.isInteger(row.sortOrder) ? row.sortOrder : 0,
    visibility: row.visibility,
    status: row.status,
    publishedAt: row.publishedAt || null,
    createIdempotencyKey: row.createIdempotencyKey || null,
  };
}

function leakKeysIn(value, forbidden) {
  const found = [];
  const json = JSON.stringify(value);
  for (const key of forbidden) {
    if (json.includes(`"${key}"`)) found.push(key);
  }
  return found;
}

const PUBLIC_LEAK_KEYS = [
  'provider_metadata',
  'providerMetadata',
  'hash',
  'previewUrl',
  'createIdempotencyKey',
  'privateArtistNote',
  'campaignId',
  'stripeAccountId',
];

module.exports = {
  MAX_TITLE,
  MAX_CAPTION,
  MAX_PROVIDER_URL,
  MAX_RECORDINGS_PER_NIGHT,
  SUGGESTED_PRODUCT_LIMIT,
  MAX_AUDIO_BYTES,
  MAX_VIDEO_BYTES,
  ALLOWED_AUDIO_MIMES,
  ALLOWED_VIDEO_MIMES,
  KINDS,
  SOURCES,
  VISIBILITIES,
  STATUSES,
  parsePositiveInt,
  defaultVisibility,
  defaultStatus,
  relId,
  isAllowedAudioMime,
  isAllowedVideoMime,
  displayableUrl,
  parseYoutubeProvider,
  parseSpotifyProvider,
  parseExternalProvider,
  parseProvider,
  youtubeVideoIdFromUrl,
  kindSourceError,
  normalizeIdempotencyKey,
  scopedCreateIdempotencyKey,
  createReplayOwned,
  validateRecordingInput,
  canPublishGatedUpload,
  gatedUploadPublishError,
  authorizeOwnedMediaFile,
  authorizeUploadedRecordingFile,
  authorizePosterFile,
  compareRecordings,
  sortRecordings,
  nextSortOrder,
  decideNightRecordingAccess,
  serializePublicMedia,
  serializePublicPoster,
  serializeProvider,
  publicRecordingCard,
  managementRecording,
  toRecord,
  leakKeysIn,
  PUBLIC_LEAK_KEYS,
};
