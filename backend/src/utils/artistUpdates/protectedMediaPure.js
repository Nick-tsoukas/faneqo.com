'use strict';

/**
 * Pure protected-media helpers. No AWS / Sharp / Strapi I/O.
 * Never log signed tokens, S3 keys, or full object URLs.
 */

const crypto = require('crypto');

const PROTECTED_PREFIX = 'faneqo-protected';
const PROVIDER_NAME = 'faneqo-protected';
const PROTECTED_DOMAIN_CONVERSATION = 'conversation';
const PROTECTED_DOMAIN_ARTIST_UPDATE = 'artist-update';
const MEDIA_SIZES = ['thumb', 'gallery', 'large'];
const DEFAULT_SIZE = 'gallery';
/**
 * Signed image URLs are an <img> capability for this window, not identity.
 * mediaId remains identity. 15 minutes covers a typical Night Story / lightbox
 * session on mobile without stretching the replay window to hours.
 */
const TOKEN_TTL_SECONDS = 15 * 60;
const DERIVATIVE_WIDTHS = {
  thumb: 480,
  gallery: 960,
  large: 1600,
};
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const ORPHAN_GRACE_MS = 24 * 60 * 60 * 1000;
const ORPHAN_CLEANUP_BATCH = 40;
const IMAGE_HEIC_COPY = 'That iPhone photo could not be read. Try exporting it as JPEG.';
const IMAGE_UNSUPPORTED_COPY = 'This photo format isn’t supported yet. Choose a JPEG, PNG, HEIC, or WebP.';
const IMAGE_TOO_LARGE_COPY = 'Photos can be up to 8 MB.';
/**
 * Two lists on purpose.
 *
 * ALLOWED_IMAGE_MIMES is what may be *stored* and later authorized. It stays
 * strict, because a HEIC that reached storage would be undisplayable.
 *
 * ALLOWED_UPLOAD_MIMES is what an artist may *submit*. HEIC is accepted there
 * and converted server-side, so the strict list above remains true afterwards.
 */
const ALLOWED_IMAGE_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_UPLOAD_MIMES = new Set([
  ...ALLOWED_IMAGE_MIMES,
  'image/heic',
  'image/heif',
]);

function truthyEnv(value) {
  const v = String(value || '').trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes' || v === 'on';
}

function isProtectedMediaConfigured(env = process.env) {
  if (!truthyEnv(env.FANEQO_PROTECTED_MEDIA_ENABLED)) {
    return { ready: false, reason: 'flag_off' };
  }
  if (!String(env.AWS_BUCKET || '').trim() || !String(env.AWS_REGION || '').trim()) {
    return { ready: false, reason: 'aws_bucket_missing' };
  }
  if (!String(env.AWS_ACCESS_KEY_ID || '').trim() || !String(env.AWS_ACCESS_SECRET || '').trim()) {
    return { ready: false, reason: 'aws_credentials_missing' };
  }
  if (!String(env.FANEQO_PROTECTED_MEDIA_SECRET || env.JWT_SECRET || '').trim()) {
    return { ready: false, reason: 'signing_secret_missing' };
  }
  return { ready: true, reason: 'configured' };
}

function isProductionNodeEnv(nodeEnv = process.env.NODE_ENV) {
  return String(nodeEnv || '').trim().toLowerCase() === 'production';
}

/**
 * Public fallback for NEW DM attachments is explicit local/test compatibility only.
 * Production never silently stores private message photos in public Upload.file.
 */
function allowsPublicDmMediaFallback(env = process.env) {
  if (isProductionNodeEnv(env.NODE_ENV)) return false;
  return truthyEnv(env.FANEQO_DM_PUBLIC_MEDIA_FALLBACK);
}

function dmAttachmentDeliveryPolicy(env = process.env) {
  const configured = isProtectedMediaConfigured(env);
  const publicFallbackAllowed = allowsPublicDmMediaFallback(env);
  return {
    ready: configured.ready,
    reason: configured.reason,
    publicFallbackAllowed,
    attachmentsEnabled: configured.ready || publicFallbackAllowed,
  };
}

function isHeicLike(mime, filename) {
  const type = String(mime || '').toLowerCase();
  const name = String(filename || '').toLowerCase();
  return type === 'image/heic' || type === 'image/heif' || /\.hei[cf]$/.test(name);
}

function isAllowedImageMime(mime) {
  return ALLOWED_IMAGE_MIMES.has(String(mime || '').toLowerCase());
}

/* Submission-time gate. HEIC passes here and is converted before storage. */
function isAllowedUploadMime(mime) {
  return ALLOWED_UPLOAD_MIMES.has(String(mime || '').toLowerCase());
}

function unsupportedImageMessage(mime, filename) {
  if (isHeicLike(mime, filename)) return IMAGE_HEIC_COPY;
  return IMAGE_UNSUPPORTED_COPY;
}

function isGatedVisibility(visibility) {
  return visibility === 'fan_list' || visibility === 'show_attendees';
}

function isProtectedFile(file) {
  if (!file) return false;
  if (file.provider === PROVIDER_NAME) return true;
  const meta = file.provider_metadata || file.providerMetadata || {};
  return meta.protected === true;
}

function protectedFileDomain(file) {
  if (!isProtectedFile(file)) return null;
  const meta = file.provider_metadata || file.providerMetadata || {};
  return meta.domain || PROTECTED_DOMAIN_ARTIST_UPDATE;
}

function isConversationProtectedFile(file) {
  return isProtectedFile(file) && protectedFileDomain(file) === PROTECTED_DOMAIN_CONVERSATION;
}

function normalizeSize(raw) {
  const size = String(raw || DEFAULT_SIZE).toLowerCase();
  return MEDIA_SIZES.includes(size) ? size : DEFAULT_SIZE;
}

function protectedObjectKey(objectId, size) {
  return `${PROTECTED_PREFIX}/${objectId}/${normalizeSize(size)}.webp`;
}

function joinUrl(base, path) {
  const root = String(base || '').replace(/\/+$/, '');
  const rel = String(path || '').replace(/^\/+/, '');
  if (!root) return `/${rel}`;
  return `${root}/${rel}`;
}

function buildPublicCandidateUrls(key, { cdnUrl, cdnRootPath, bucket, region } = {}) {
  const cleanKey = String(key || '').replace(/^\/+/, '');
  if (!cleanKey) return [];
  const urls = [];
  const root = String(cdnRootPath || '').replace(/^\/+|\/+$/g, '');
  if (cdnUrl) {
    urls.push(root ? joinUrl(cdnUrl, `${root}/${cleanKey}`) : joinUrl(cdnUrl, cleanKey));
  }
  if (bucket && region) {
    urls.push(`https://${bucket}.s3.${region}.amazonaws.com/${cleanKey}`);
    urls.push(`https://s3.${region}.amazonaws.com/${bucket}/${cleanKey}`);
  }
  return [...new Set(urls)];
}

function looksLikeStorageUrl(url, extraHosts = []) {
  const raw = String(url || '');
  if (!raw) return false;
  let host = '';
  try {
    host = new URL(raw).hostname.toLowerCase();
  } catch {
    return /amazonaws\.com|cloudfront\.net/i.test(raw);
  }
  if (host.includes('amazonaws.com') || host.includes('cloudfront.net')) return true;
  return extraHosts.some((item) => item && host === String(item).toLowerCase());
}

function hmacSecret(env = process.env) {
  return String(env.FANEQO_PROTECTED_MEDIA_SECRET || env.JWT_SECRET || '');
}

function signMediaToken({ updateId, mediaId, size, exp }, env = process.env) {
  const secret = hmacSecret(env);
  if (!secret) return { error: 'signing_secret_missing' };
  const safeSize = normalizeSize(size);
  const payload = `${Number(updateId)}.${Number(mediaId)}.${safeSize}.${Number(exp)}`;
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  return { exp: Number(exp), size: safeSize, sig };
}

function verifyMediaToken({ updateId, mediaId, size, exp, sig, now = Date.now() }, env = process.env) {
  const secret = hmacSecret(env);
  if (!secret) return { ok: false, reason: 'signing_secret_missing' };
  const expires = Number(exp);
  if (!Number.isFinite(expires) || expires * 1000 < now) {
    return { ok: false, reason: 'expired' };
  }
  const expected = signMediaToken({ updateId, mediaId, size, exp: expires }, env);
  if (expected.error) return { ok: false, reason: expected.error };
  const a = Buffer.from(String(sig || ''));
  const b = Buffer.from(String(expected.sig || ''));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return { ok: false, reason: 'invalid_sig' };
  }
  if (normalizeSize(size) !== expected.size) {
    return { ok: false, reason: 'invalid_size' };
  }
  return { ok: true, size: expected.size };
}

function issueMediaUrls({ updateId, mediaId, publicOrigin, now = Date.now() }, env = process.env) {
  const exp = Math.floor(now / 1000) + TOKEN_TTL_SECONDS;
  const urls = {};
  for (const size of MEDIA_SIZES) {
    const token = signMediaToken({ updateId, mediaId, size, exp }, env);
    if (token.error) return { error: token.error };
    const path = `/api/artist-updates/${updateId}/media/${mediaId}?size=${size}&exp=${exp}&sig=${token.sig}`;
    urls[size] = publicOrigin ? joinUrl(publicOrigin, path.replace(/^\//, '')) : path;
  }
  return { exp, ...urls };
}

function signConversationMediaToken({ conversationId, messageId, mediaId, size, exp }, env = process.env) {
  const secret = hmacSecret(env);
  if (!secret) return { error: 'signing_secret_missing' };
  const safeSize = normalizeSize(size);
  const payload = `c.${Number(conversationId)}.m.${Number(messageId)}.f.${Number(mediaId)}.${safeSize}.${Number(exp)}`;
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  return { exp: Number(exp), size: safeSize, sig };
}

function verifyConversationMediaToken({
  conversationId,
  messageId,
  mediaId,
  size,
  exp,
  sig,
  now = Date.now(),
}, env = process.env) {
  const secret = hmacSecret(env);
  if (!secret) return { ok: false, reason: 'signing_secret_missing' };
  const expires = Number(exp);
  if (!Number.isFinite(expires) || expires * 1000 < now) {
    return { ok: false, reason: 'expired' };
  }
  const expected = signConversationMediaToken({
    conversationId,
    messageId,
    mediaId,
    size,
    exp: expires,
  }, env);
  if (expected.error) return { ok: false, reason: expected.error };
  const a = Buffer.from(String(sig || ''));
  const b = Buffer.from(String(expected.sig || ''));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return { ok: false, reason: 'invalid_sig' };
  }
  if (normalizeSize(size) !== expected.size) {
    return { ok: false, reason: 'invalid_size' };
  }
  return { ok: true, size: expected.size };
}

function issueConversationMediaUrls({
  conversationId,
  messageId,
  mediaId,
  publicOrigin,
  now = Date.now(),
}, env = process.env) {
  const exp = Math.floor(now / 1000) + TOKEN_TTL_SECONDS;
  const urls = {};
  for (const size of MEDIA_SIZES) {
    const token = signConversationMediaToken({
      conversationId,
      messageId,
      mediaId,
      size,
      exp,
    }, env);
    if (token.error) return { error: token.error };
    const path = `/api/conversations/${conversationId}/messages/${messageId}/media/${mediaId}?size=${size}&exp=${exp}&sig=${token.sig}`;
    urls[size] = publicOrigin ? joinUrl(publicOrigin, path.replace(/^\//, '')) : path;
  }
  return { exp, ...urls };
}

function aspectRatioFromDimensions(width, height) {
  const w = Number(width);
  const h = Number(height);
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return null;
  return w / h;
}

function unavailableProtectedMediaItem(file, { alt, caption = null, order = 0 } = {}) {
  const width = file.width || null;
  const height = file.height || null;
  return {
    type: 'image',
    id: file.id,
    mediaId: file.id,
    url: null,
    thumbnailUrl: null,
    thumbUrl: null,
    largeUrl: null,
    mime: file.mime || 'image/webp',
    width,
    height,
    aspectRatio: aspectRatioFromDimensions(width, height),
    order,
    alt: alt || file.alternativeText || 'Image',
    caption: caption || null,
    protected: true,
    unavailable: true,
  };
}

function serializeProtectedMedia(file, { updateId, publicOrigin, alt, caption, extraHosts, order = 0 } = {}, env = process.env) {
  if (!file?.id) return null;
  const issued = issueMediaUrls({ updateId, mediaId: file.id, publicOrigin }, env);
  if (issued.error) return unavailableProtectedMediaItem(file, { alt, caption, order });
  return toProtectedMediaItem(file, issued, { alt, caption, extraHosts, order });
}

function serializeConversationProtectedMedia(file, {
  conversationId,
  messageId,
  publicOrigin,
  alt,
  extraHosts,
  order = 0,
} = {}, env = process.env) {
  if (!file?.id || !conversationId || !messageId) return null;
  if (!isConversationProtectedFile(file)) return null;
  const issued = issueConversationMediaUrls({
    conversationId,
    messageId,
    mediaId: file.id,
    publicOrigin,
  }, env);
  if (issued.error) return unavailableProtectedMediaItem(file, { alt, order });
  return toProtectedMediaItem(file, issued, { alt, extraHosts, order });
}

function toProtectedMediaItem(file, issued, { alt, caption = null, extraHosts, order = 0 } = {}) {
  const width = file.width || null;
  const height = file.height || null;
  const row = {
    type: 'image',
    id: file.id,
    mediaId: file.id,
    url: issued.gallery,
    thumbnailUrl: issued.thumb,
    thumbUrl: issued.thumb,
    largeUrl: issued.large,
    mime: file.mime || 'image/webp',
    width,
    height,
    aspectRatio: aspectRatioFromDimensions(width, height),
    order,
    alt: alt || file.alternativeText || 'Image',
    caption: caption || null,
    protected: true,
  };
  if (
    looksLikeStorageUrl(row.url, extraHosts) ||
    looksLikeStorageUrl(row.thumbUrl, extraHosts) ||
    looksLikeStorageUrl(row.largeUrl, extraHosts)
  ) {
    return null;
  }
  return row;
}

function decideStreamAccess({ access = {}, tokenOk = false, userId = null, isDraft = false, isArtist = false } = {}) {
  if (isDraft && !isArtist) return { allowed: false, reason: 'draft' };
  if (userId) return { allowed: !!access.allowed, reason: access.reason || 'forbidden' };
  return { allowed: !!tokenOk, reason: tokenOk ? 'token' : 'token_required' };
}

function isProtectedOrphanCandidate(file, { now = Date.now(), graceMs = ORPHAN_GRACE_MS } = {}) {
  if (!isProtectedFile(file) || !file?.id) return false;
  const created = new Date(file.createdAt).getTime();
  if (!Number.isFinite(created)) return false;
  return now - created >= graceMs;
}

function unreferencedProtectedFiles(files, referencedIds) {
  const referenced = new Set([...(referencedIds || [])].map((id) => Number(id)));
  return (files || []).filter((file) => (
    isProtectedFile(file)
    && file?.id
    && !referenced.has(Number(file.id))
  ));
}

function mediaBelongsToUpdate(update, mediaId) {
  const ids = Array.isArray(update?.mediaIds)
    ? update.mediaIds
    : Array.isArray(update?.media)
      ? update.media.map((item) => item.id || item)
      : [];
  return ids.some((id) => Number(id) === Number(mediaId));
}

module.exports = {
  PROTECTED_PREFIX,
  PROVIDER_NAME,
  PROTECTED_DOMAIN_CONVERSATION,
  PROTECTED_DOMAIN_ARTIST_UPDATE,
  MEDIA_SIZES,
  DEFAULT_SIZE,
  TOKEN_TTL_SECONDS,
  DERIVATIVE_WIDTHS,
  MAX_IMAGE_BYTES,
  ORPHAN_GRACE_MS,
  ORPHAN_CLEANUP_BATCH,
  IMAGE_HEIC_COPY,
  IMAGE_UNSUPPORTED_COPY,
  IMAGE_TOO_LARGE_COPY,
  ALLOWED_IMAGE_MIMES,
  ALLOWED_UPLOAD_MIMES,
  truthyEnv,
  isProtectedMediaConfigured,
  isProductionNodeEnv,
  allowsPublicDmMediaFallback,
  dmAttachmentDeliveryPolicy,
  isHeicLike,
  isAllowedImageMime,
  isAllowedUploadMime,
  unsupportedImageMessage,
  isGatedVisibility,
  isProtectedFile,
  protectedFileDomain,
  isConversationProtectedFile,
  normalizeSize,
  protectedObjectKey,
  buildPublicCandidateUrls,
  looksLikeStorageUrl,
  signMediaToken,
  verifyMediaToken,
  issueMediaUrls,
  signConversationMediaToken,
  verifyConversationMediaToken,
  issueConversationMediaUrls,
  serializeProtectedMedia,
  serializeConversationProtectedMedia,
  unavailableProtectedMediaItem,
  isProtectedOrphanCandidate,
  unreferencedProtectedFiles,
  mediaBelongsToUpdate,
  decideStreamAccess,
};
