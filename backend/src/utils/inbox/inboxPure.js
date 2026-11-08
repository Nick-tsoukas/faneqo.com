'use strict';

/**
 * Pure Inbox helpers — no Strapi, no I/O.
 * Used by directMessaging.js and scripts/test-direct-messaging.js
 */

const MAX_BODY_LENGTH = 4000;
const PREVIEW_MAX = 140;
const MAX_ATTACHMENT_BYTES = 8 * 1024 * 1024;
const MAX_DM_ATTACHMENTS = 4;
const ATTACHMENT_OWNER_GRACE_MS = 15 * 60 * 1000;
const ALLOWED_IMAGE_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const mediaPure = require('../artistUpdates/protectedMediaPure');
/**
 * Strapi v4 persists plugin::upload.file.size in kilobytes via bytesToKbytes
 * (bytes / 1000, 2 decimal places). This repo's protected uploader writes the
 * same unit. Browser File.size and MAX_ATTACHMENT_BYTES are bytes.
 */
const STRAPI_UPLOAD_SIZE_UNIT = 'kilobytes';
const STRAPI_UPLOAD_KB_FACTOR = 1000;
const PAGE_DEFAULT = 20;
const PAGE_MAX = 50;
const MESSAGE_LIMIT_DEFAULT = 40;
const MESSAGE_LIMIT_MAX = 100;

const TIER_LABELS = {
  superfan_signal: 'Superfan',
  engaged: 'Engaged',
  warm: 'Warm',
  new: 'New fan',
};

const ARTIST_FACING_TIERS = new Set(['Superfan']);
const REQUEST_BODY_MAX = 2000;
const REQUEST_DECLINE_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

function pairKey(bandId, fanAccountUserId) {
  return `${bandId}:${fanAccountUserId}`;
}

function conversationSideKey(conversationId, side) {
  return `${conversationId}:${side}`;
}

function idempotencyKey(conversationId, senderUserId, clientMessageId) {
  if (!clientMessageId) return null;
  return `${conversationId}:${senderUserId}:${clientMessageId}`;
}

function isUniqueViolation(err) {
  if (!err) return false;
  const code = String(err.code || '');
  if (code === '23505' || code === 'UNIQUE_VIOLATION') return true;
  const msg = String(err.message || '').toLowerCase();
  return msg.includes('unique') && (msg.includes('constraint') || msg.includes('duplicate') || msg.includes('pairkey') || msg.includes('idempotency'));
}

function looksLikeEmail(value) {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function normalizePersonName(value) {
  const raw = String(value || '').trim();
  if (!raw || looksLikeEmail(raw)) return '';
  return raw.replace(/\s+/g, ' ');
}

function isBareFanLabel(value) {
  return String(value || '').trim().toLowerCase() === 'fan';
}

function isUnnamedFanLabel(value) {
  return String(value || '').trim().toLowerCase() === 'unnamed fan';
}

function isCityFanLabel(value) {
  const lower = String(value || '').trim().toLowerCase();
  return lower.endsWith(' fan') && lower !== 'fan' && lower !== 'unnamed fan';
}

function isFallbackFanDisplay(value) {
  const raw = String(value || '').trim();
  if (!raw) return true;
  return isBareFanLabel(raw) || isUnnamedFanLabel(raw) || isCityFanLabel(raw);
}

function cityFanTitle(city) {
  const cityName = String(city || '').trim();
  return cityName ? `${cityName} fan` : '';
}

function formatPersonDisplayName(display) {
  const parts = normalizePersonName(display).split(' ').filter(Boolean);
  if (parts.length >= 2) return `${parts[0]} ${parts[1][0].toUpperCase()}.`;
  return parts[0] || '';
}

/** Never fall back to email. First name + last initial, else city fan / Unnamed fan. */
function safeFanDisplayName(fan) {
  const first = normalizePersonName(fan?.firstName);
  const last = normalizePersonName(fan?.lastName);
  if (first && last) return `${first} ${last[0].toUpperCase()}.`;
  if (first) return first;

  const display = normalizePersonName(fan?.displayName);
  if (isCityFanLabel(display) || isUnnamedFanLabel(display)) return display;
  if (display && !isBareFanLabel(display)) return formatPersonDisplayName(display);

  const fromCity = cityFanTitle(fan?.city);
  if (fromCity) return fromCity;
  return 'Unnamed fan';
}

function fanInitials(fanOrName) {
  if (typeof fanOrName === 'string') {
    if (isFallbackFanDisplay(fanOrName) || !normalizePersonName(fanOrName)) return 'F';
    const parts = normalizePersonName(fanOrName).split(' ').filter(Boolean);
    if (!parts.length) return 'F';
    return ((parts[0][0] || '') + (parts[1] ? parts[1][0] : '')).toUpperCase() || 'F';
  }
  const display = safeFanDisplayName(fanOrName);
  if (isFallbackFanDisplay(display)) return 'F';
  return fanInitials(display);
}

function hasRequiredFanFirstName(fan) {
  return Boolean(normalizePersonName(fan?.firstName));
}

function tierLabel(tier) {
  if (!tier) return null;
  return TIER_LABELS[tier] || null;
}

function buildFanContextLine({ city, showCount, checkedInShowCount, tier, displayName } = {}) {
  const parts = [];
  const cityName = String(city || '').trim();
  const title = String(displayName || '').trim();
  const hideCity = !!cityName && title.toLowerCase() === `${cityName.toLowerCase()} fan`;
  if (cityName && !hideCity) parts.push(cityName);

  const label = tierLabel(tier);
  if (label && ARTIST_FACING_TIERS.has(label)) parts.push(label);

  const shows = Number(showCount ?? checkedInShowCount) || 0;
  if (shows === 1) parts.push('1 show');
  if (shows >= 2) parts.push(`${shows} shows`);

  if (!parts.length) return 'Fan List';
  return parts.join(' · ');
}

function requestPairKey(bandId, fanAccountUserId) {
  return pairKey(bandId, fanAccountUserId);
}

function validateRequestMessage(raw) {
  if (raw == null || typeof raw !== 'string') {
    return { error: 'empty_message', message: 'Write a short message to the band.' };
  }
  const bodyText = raw.replace(/^\s+|\s+$/g, '');
  if (!bodyText) {
    return { error: 'empty_message', message: 'Write a short message to the band.' };
  }
  if (bodyText.length > REQUEST_BODY_MAX) {
    return {
      error: 'message_too_long',
      message: `Keep it under ${REQUEST_BODY_MAX} characters.`,
    };
  }
  return { bodyText, error: null };
}

function requestOpeningClientMessageId(requestId) {
  return `req:${requestId}:initial`;
}

function declineStillCooling(request, now = Date.now()) {
  if (!request || request.status !== 'declined') return false;
  const at = request.declinedAt || request.respondedAt;
  if (!at) return true;
  return now - new Date(at).getTime() < REQUEST_DECLINE_COOLDOWN_MS;
}

function serializeSafeRequest(request, { includeMessage = false, fan = null, band = null, identity = null } = {}) {
  const safeFan = fan || request.requesterFanRow || {};
  const displayName = identity?.displayName || safeFanDisplayName(safeFan);
  const initials = identity
    ? fanInitials(identity.displayName || '')
    : fanInitials(safeFan);
  const avatarUrl = identity && Object.prototype.hasOwnProperty.call(identity, 'avatarUrl')
    ? identity.avatarUrl || null
    : null;
  return {
    id: request.id,
    status: request.status,
    createdAt: request.createdAt,
    respondedAt: request.respondedAt || null,
    requesterType: request.requesterType || 'fan',
    conversationId: relationId(request.conversation) || request.conversation || null,
    initialMessage: includeMessage ? String(request.initialMessage || '') : undefined,
    initialMessagePreview: truncatePreview(request.initialMessage),
    fan: {
      fanId: safeFan.id || request.requesterFan || null,
      displayName,
      initials,
      avatarUrl,
      context: buildFanContextLine({
        city: safeFan.city,
        showCount: safeFan.showCount ?? safeFan.checkedInShowCount,
        displayName,
      }),
      city: safeFan.city || null,
      showCount: Number(safeFan.showCount ?? safeFan.checkedInShowCount) || 0,
    },
    artist: band
      ? {
          id: band.id,
          name: band.name || 'Artist',
          slug: band.slug || null,
          avatarUrl: band.avatarUrl || null,
        }
      : undefined,
  };
}

function truncatePreview(bodyText) {
  const collapsed = String(bodyText || '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!collapsed) return '';
  if (collapsed.length <= PREVIEW_MAX) return collapsed;
  return `${collapsed.slice(0, PREVIEW_MAX - 1).trimEnd()}…`;
}

function validateBodyText(raw) {
  return validateMessageContent(raw, { hasAttachment: false });
}

function validateMessageContent(raw, { hasAttachment = false } = {}) {
  if (raw == null || raw === '') {
    if (hasAttachment) return { bodyText: '', error: null };
    return { error: 'empty_message', message: 'Message cannot be empty' };
  }
  if (typeof raw !== 'string') {
    return { error: 'empty_message', message: 'Message cannot be empty' };
  }
  const bodyText = raw.replace(/^\s+|\s+$/g, '');
  if (!bodyText && !hasAttachment) {
    return { error: 'empty_message', message: 'Message cannot be empty' };
  }
  if (bodyText.length > MAX_BODY_LENGTH) {
    return {
      error: 'message_too_long',
      message: `Keep it under ${MAX_BODY_LENGTH} characters.`,
    };
  }
  return { bodyText, error: null };
}

function isAllowedImageMime(mime) {
  return ALLOWED_IMAGE_MIMES.has(String(mime || '').toLowerCase());
}

function parseAttachmentMediaId(raw) {
  if (raw == null || raw === '') return null;
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) return { error: 'invalid_attachment' };
  return n;
}

function parseAttachmentMediaIds(rawIds, rawSingle) {
  const list = [];
  if (Array.isArray(rawIds)) list.push(...rawIds);
  else if (rawIds != null && rawIds !== '') list.push(rawIds);
  if (!list.length && rawSingle != null && rawSingle !== '') list.push(rawSingle);
  if (!list.length) return [];
  if (list.length > MAX_DM_ATTACHMENTS) return { error: 'too_many_attachments' };
  const ids = [];
  const seen = new Set();
  for (const raw of list) {
    const parsed = parseAttachmentMediaId(raw);
    if (parsed == null) continue;
    if (parsed.error) return parsed;
    if (seen.has(parsed)) continue;
    seen.add(parsed);
    ids.push(parsed);
  }
  return ids;
}

function bytesToStoredUploadKb(bytes) {
  return Math.round((Number(bytes) / STRAPI_UPLOAD_KB_FACTOR) * 100) / 100;
}

function uploadFileExceedsByteLimit(file, maxBytes = MAX_ATTACHMENT_BYTES) {
  const storedKb = Number(file?.size);
  if (!Number.isFinite(storedKb) || storedKb < 0) return false;
  return storedKb > bytesToStoredUploadKb(maxBytes);
}

function authorizeUploadFile(file, userId, { now = Date.now(), allowPublicAttachment = true } = {}) {
  if (!file || !file.id) {
    return { error: 'invalid_attachment', message: 'Image is not available' };
  }
  if (!isAllowedImageMime(file.mime)) {
    return {
      error: 'invalid_attachment_type',
      message: mediaPure.unsupportedImageMessage(file.mime, file.name || file.alternativeText),
    };
  }
  if (uploadFileExceedsByteLimit(file)) {
    return { error: 'attachment_too_large', message: mediaPure.IMAGE_TOO_LARGE_COPY };
  }
  if (mediaPure.isProtectedFile(file)) {
    if (!mediaPure.isConversationProtectedFile(file)) {
      return { error: 'invalid_attachment', message: 'Image is not available' };
    }
    const uploaderId = file.provider_metadata?.uploaderUserId
      ?? file.providerMetadata?.uploaderUserId
      ?? null;
    if (uploaderId == null || Number(uploaderId) !== Number(userId)) {
      return { error: 'invalid_attachment', message: 'Image is not available' };
    }
    return { error: null };
  }
  if (!allowPublicAttachment) {
    return { error: 'invalid_attachment', message: 'Photo attachments aren’t available right now.' };
  }
  // plugin::upload.file.createdBy is admin::user in Strapi, so REST uploads
  // from users-permissions often have createdBy=null. Treat an explicit
  // users-permissions owner match as sufficient; otherwise require a recent
  // unused file (grace) so just-uploaded DM images are sendable.
  const ownerId = file.createdBy && typeof file.createdBy === 'object'
    ? file.createdBy.id
    : file.createdBy;
  if (ownerId != null && Number(ownerId) === Number(userId)) {
    return { error: null };
  }
  if (ownerId != null && Number(ownerId) !== Number(userId)) {
    return { error: 'invalid_attachment', message: 'Image is not available' };
  }
  const uploaderId = file.provider_metadata?.uploaderUserId
    ?? file.providerMetadata?.uploaderUserId
    ?? null;
  if (uploaderId != null && Number(uploaderId) !== Number(userId)) {
    return { error: 'invalid_attachment', message: 'Image is not available' };
  }
  if (!file.createdAt) {
    return { error: 'invalid_attachment', message: 'Image is not available' };
  }
  const created = new Date(file.createdAt).getTime();
  if (!Number.isFinite(created) || now - created > ATTACHMENT_OWNER_GRACE_MS) {
    return { error: 'invalid_attachment', message: 'Image is not available' };
  }
  return { error: null };
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

function serializeAttachment(media, {
  order = 0,
  conversationId = null,
  messageId = null,
  publicOrigin,
  extraHosts,
  env,
} = {}) {
  if (!media || typeof media !== 'object') return null;
  if (media.mime && !isAllowedImageMime(media.mime)) return null;
  if (mediaPure.isProtectedFile(media)) {
    return mediaPure.serializeConversationProtectedMedia(media, {
      conversationId,
      messageId,
      publicOrigin,
      extraHosts,
      order,
      alt: media.alternativeText || 'Image',
    }, env);
  }
  const originalUrl = displayableUrl(media.url);
  if (!originalUrl) return null;
  const formats = media.formats && typeof media.formats === 'object' ? media.formats : {};
  const thumbnailUrl = displayableUrl(formats.thumbnail?.url || formats.small?.url) || originalUrl;
  const url = displayableUrl(formats.medium?.url || formats.small?.url) || originalUrl;
  const largeUrl = displayableUrl(formats.large?.url || formats.medium?.url) || originalUrl;
  const mediaId = media.id || null;
  const width = media.width || null;
  const height = media.height || null;
  const row = {
    type: 'image',
    id: mediaId,
    mediaId,
    url,
    thumbnailUrl,
    thumbUrl: thumbnailUrl,
    largeUrl,
    mime: media.mime || null,
    width,
    height,
    aspectRatio: aspectRatioFromDimensions(width, height),
    order,
    alt: media.alternativeText || 'Image',
    protected: false,
  };
  const formatsOut = publicFormats(formats);
  if (formatsOut) row.formats = formatsOut;
  return row;
}

function lastMessagePreviewText(bodyText, hasAttachment, attachmentCount = 0) {
  const text = truncatePreview(bodyText);
  if (text) return text;
  const n = Number(attachmentCount) || (hasAttachment ? 1 : 0);
  if (n <= 0) return '';
  return n === 1 ? 'Photo' : `${n} photos`;
}

function collectMessageMedia(message) {
  if (!message) return [];
  const gallery = Array.isArray(message.attachmentGallery)
    ? message.attachmentGallery
    : message.attachmentGallery
      ? [message.attachmentGallery]
      : [];
  if (gallery.length) return gallery;
  if (message.attachmentMedia) {
    return Array.isArray(message.attachmentMedia)
      ? message.attachmentMedia
      : [message.attachmentMedia];
  }
  return [];
}

function serializeAttachments(message, {
  conversationId,
  publicOrigin,
  extraHosts,
  env,
} = {}) {
  const cid = conversationId
    || message?.conversation?.id
    || message?.conversation
    || null;
  const mid = message?.id || null;
  return collectMessageMedia(message)
    .map((item, index) => serializeAttachment(item, {
      order: index,
      conversationId: cid,
      messageId: mid,
      publicOrigin,
      extraHosts,
      env,
    }))
    .filter(Boolean);
}

function mediaBelongsToMessage(message, mediaId) {
  return collectMessageMedia(message).some((item) => Number(item?.id || item) === Number(mediaId));
}

function decideConversationMediaStreamAccess({ participantOk = false, tokenOk = false, userId = null } = {}) {
  if (tokenOk) return { allowed: true, reason: 'token' };
  if (userId && participantOk) return { allowed: true, reason: 'participant' };
  if (!userId) return { allowed: false, reason: 'token_required' };
  return { allowed: false, reason: 'forbidden' };
}

function normalizeClientMessageId(raw) {
  if (raw == null || raw === '') return null;
  const id = String(raw).trim();
  if (!id) return null;
  if (id.length > 80) return { error: 'invalid_client_message_id' };
  return id;
}

function clampPageSize(raw, fallback = PAGE_DEFAULT, max = PAGE_MAX) {
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(n, max);
}

function clampMessageLimit(raw) {
  return clampPageSize(raw, MESSAGE_LIMIT_DEFAULT, MESSAGE_LIMIT_MAX);
}

function parsePositiveInt(raw) {
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) return null;
  return n;
}

function compareMessageOrder(a, b) {
  const at = new Date(a.createdAt).getTime();
  const bt = new Date(b.createdAt).getTime();
  if (at !== bt) return at - bt;
  return Number(a.id) - Number(b.id);
}

function isMessageAfterRead(message, lastReadMessageId) {
  if (lastReadMessageId == null || lastReadMessageId === 0) return true;
  return Number(message.id) > Number(lastReadMessageId);
}

function countUnreadForParticipant(messages, participant) {
  if (!participant) return 0;
  const mySide = participant.side;
  const lastRead = participant.lastReadMessageId;
  let n = 0;
  for (const m of messages || []) {
    if (m.senderSide === mySide) continue;
    if (isMessageAfterRead(m, lastRead)) n += 1;
  }
  return n;
}

function seenByRecipient(message, recipientParticipant) {
  if (!message || !recipientParticipant) return false;
  const lastRead = recipientParticipant.lastReadMessageId;
  if (lastRead == null || lastRead === 0) return false;
  return Number(lastRead) >= Number(message.id);
}

function messagingFlags({ conversation, originFan, fanParticipant } = {}) {
  const blocked = !!(fanParticipant && fanParticipant.blockedAt);
  const removed = originFan && originFan.status === 'removed';
  const closed = conversation && conversation.status && conversation.status !== 'active';
  const messagingAvailable = !blocked && !removed && !closed;
  return { blocked, removed: !!removed, messagingAvailable };
}

function sendBlockReason({ conversation, originFan, fanParticipant } = {}) {
  if (!conversation || conversation.status !== 'active') return 'conversation_not_available';
  if (originFan && originFan.status === 'removed') return 'relationship_removed';
  if (fanParticipant && fanParticipant.blockedAt) return 'blocked';
  return null;
}

/** Safe product flags — never include accountUser id or email. */
function fanMessagingEligibility(fan) {
  const isFaneqoMember = Boolean(fan?.accountUser);
  const canDirectMessage = isFaneqoMember && fan?.status !== 'removed';
  return { isFaneqoMember, canDirectMessage };
}

function nextReadPosition(participant, throughMessage) {
  const currentId = participant?.lastReadMessageId != null ? Number(participant.lastReadMessageId) : 0;
  const throughId = Number(throughMessage.id);
  if (throughId <= currentId) {
    return {
      lastReadMessageId: participant.lastReadMessageId,
      lastReadAt: participant.lastReadAt,
      moved: false,
    };
  }
  const currentAt = participant?.lastReadAt ? new Date(participant.lastReadAt).getTime() : 0;
  const msgAt = new Date(throughMessage.createdAt).getTime();
  return {
    lastReadMessageId: throughId,
    lastReadAt: msgAt >= currentAt ? throughMessage.createdAt : participant.lastReadAt,
    moved: true,
  };
}

function paginateNewestFirst(items, { page = 1, pageSize = PAGE_DEFAULT } = {}) {
  const p = Math.max(1, parseInt(page, 10) || 1);
  const size = clampPageSize(pageSize);
  const start = (p - 1) * size;
  return {
    items: items.slice(start, start + size),
    page: p,
    pageSize: size,
    total: items.length,
    pageCount: Math.max(1, Math.ceil(items.length / size)),
  };
}

function filterMessagesWindow(messages, { beforeId = null, afterId = null, limit = MESSAGE_LIMIT_DEFAULT } = {}) {
  const sorted = [...(messages || [])].sort(compareMessageOrder);
  let window = sorted;

  if (afterId) {
    window = sorted.filter((m) => Number(m.id) > Number(afterId));
    return window.slice(0, limit);
  }

  if (beforeId) {
    window = sorted.filter((m) => Number(m.id) < Number(beforeId));
    return window.slice(Math.max(0, window.length - limit));
  }

  return sorted.slice(Math.max(0, sorted.length - limit));
}

function stripHtmlToPlain(text) {
  // V1 is plain text storage; callers persist bodyText as given after trim.
  // Serializer never treats content as HTML.
  return String(text || '');
}

function relationId(value) {
  if (value == null) return null;
  if (typeof value === 'object') return value.id != null ? value.id : null;
  return value;
}

module.exports = {
  MAX_BODY_LENGTH,
  PREVIEW_MAX,
  PAGE_DEFAULT,
  PAGE_MAX,
  MESSAGE_LIMIT_DEFAULT,
  MESSAGE_LIMIT_MAX,
  TIER_LABELS,
  ARTIST_FACING_TIERS,
  REQUEST_BODY_MAX,
  REQUEST_DECLINE_COOLDOWN_MS,
  pairKey,
  requestPairKey,
  normalizePersonName,
  hasRequiredFanFirstName,
  fanInitials,
  validateRequestMessage,
  requestOpeningClientMessageId,
  declineStillCooling,
  serializeSafeRequest,
  conversationSideKey,
  idempotencyKey,
  isUniqueViolation,
  looksLikeEmail,
  safeFanDisplayName,
  tierLabel,
  buildFanContextLine,
  truncatePreview,
  validateBodyText,
  validateMessageContent,
  isAllowedImageMime,
  parseAttachmentMediaId,
  parseAttachmentMediaIds,
  authorizeUploadFile,
  serializeAttachment,
  serializeAttachments,
  collectMessageMedia,
  mediaBelongsToMessage,
  decideConversationMediaStreamAccess,
  lastMessagePreviewText,
  MAX_ATTACHMENT_BYTES,
  MAX_DM_ATTACHMENTS,
  STRAPI_UPLOAD_SIZE_UNIT,
  STRAPI_UPLOAD_KB_FACTOR,
  bytesToStoredUploadKb,
  uploadFileExceedsByteLimit,
  ALLOWED_IMAGE_MIMES,
  normalizeClientMessageId,
  clampPageSize,
  clampMessageLimit,
  parsePositiveInt,
  compareMessageOrder,
  isMessageAfterRead,
  countUnreadForParticipant,
  seenByRecipient,
  messagingFlags,
  sendBlockReason,
  fanMessagingEligibility,
  nextReadPosition,
  paginateNewestFirst,
  filterMessagesWindow,
  stripHtmlToPlain,
  relationId,
};
