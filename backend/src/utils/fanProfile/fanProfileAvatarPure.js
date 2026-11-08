'use strict';

/**
 * Fan avatar — pure validation and ownership rules. No Strapi, no Sharp, no I/O.
 *
 * Avatar is presentation media on FanProfile. It is uploaded only by an
 * authenticated server handler. Client-supplied Upload.file ids are never
 * accepted as an attachment.
 */

const AVATAR_MAX_BYTES = 4 * 1024 * 1024;
const AVATAR_SIZE = 512;
const AVATAR_OUTPUT_MIME = 'image/webp';
const AVATAR_OUTPUT_EXT = '.webp';
const AVATAR_OUTPUT_QUALITY = 82;

const ALLOWED_INPUT_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const AVATAR_INJECTION_KEYS = [
  'userId',
  'profileId',
  'avatarId',
  'avatarFileId',
  'fileId',
  'files',
  'id',
  'user',
  'avatar',
];

const FAN_PROFILE_UID = 'api::fan-profile.fan-profile';
const PROTECTED_PROVIDER = 'faneqo-protected';

function asBuffer(value) {
  if (Buffer.isBuffer(value)) return value;
  if (value instanceof Uint8Array) return Buffer.from(value);
  return null;
}

function sniffImageKind(buffer) {
  const buf = asBuffer(buffer);
  if (!buf || buf.length < 3) return 'unknown';

  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpeg';
  if (buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'png';
  if (
    buf.length >= 6 &&
    buf[0] === 0x47 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x38 &&
    (buf[4] === 0x37 || buf[4] === 0x39) &&
    buf[5] === 0x61
  ) {
    return 'gif';
  }
  if (
    buf.length >= 12 &&
    buf.slice(0, 4).toString('ascii') === 'RIFF' &&
    buf.slice(8, 12).toString('ascii') === 'WEBP'
  ) {
    return 'webp';
  }
  if (buf.length >= 4 && buf.slice(0, 4).toString('ascii') === '%PDF') return 'pdf';

  if (buf.length >= 12 && buf.slice(4, 8).toString('ascii') === 'ftyp') {
    const brand = buf.slice(8, 12).toString('ascii').toLowerCase();
    if (/hei[cf]|mif1|msf1|avif/.test(brand)) return 'heic';
  }

  const head = buf.slice(0, Math.min(buf.length, 256)).toString('utf8').toLowerCase();
  if (head.includes('<svg') || head.includes('<?xml')) return 'svg';

  return 'unknown';
}

function kindToMime(kind) {
  if (kind === 'jpeg') return 'image/jpeg';
  if (kind === 'png') return 'image/png';
  if (kind === 'webp') return 'image/webp';
  return null;
}

function isAllowedInputKind(kind) {
  return kind === 'jpeg' || kind === 'png' || kind === 'webp';
}

function isHeicLike(mime, filename) {
  const type = String(mime || '').toLowerCase();
  const name = String(filename || '').toLowerCase();
  return type === 'image/heic' || type === 'image/heif' || /\.hei[cf]$/.test(name);
}

function unsupportedAvatarMessage(kind, mime, filename) {
  if (kind === 'heic' || isHeicLike(mime, filename)) {
    return 'This photo format isn’t supported yet. Export or choose a JPEG, PNG, or WebP.';
  }
  if (kind === 'gif') return 'Animated GIFs can’t be used as a profile photo. Choose a JPEG, PNG, or WebP.';
  if (kind === 'svg' || kind === 'pdf' || String(mime || '').startsWith('video/')) {
    return 'Choose a JPEG, PNG, or WebP photo.';
  }
  return 'Choose a JPEG, PNG, or WebP photo.';
}

/**
 * Validate an incoming avatar before Sharp or Upload see it.
 * Content (magic bytes) wins over filename and declared MIME.
 */
function validateIncomingAvatar({ buffer, mime, filename, size } = {}) {
  const buf = asBuffer(buffer);
  if (!buf || !buf.length) {
    return { error: 'avatar_missing', status: 400, message: 'Choose a profile photo to upload.' };
  }
  const declaredSize = Number(size);
  if (Number.isFinite(declaredSize) && declaredSize > AVATAR_MAX_BYTES) {
    return { error: 'avatar_too_large', status: 400, message: 'Profile photos can be up to 4 MB.' };
  }
  if (buf.length > AVATAR_MAX_BYTES) {
    return { error: 'avatar_too_large', status: 400, message: 'Profile photos can be up to 4 MB.' };
  }

  const kind = sniffImageKind(buf);
  if (!isAllowedInputKind(kind)) {
    return {
      error: 'avatar_invalid_type',
      status: 400,
      message: unsupportedAvatarMessage(kind, mime, filename),
    };
  }

  return { buffer: buf, kind, mime: kindToMime(kind) };
}

function isInjectionValue(value) {
  if (value == null) return false;
  if (typeof value === 'number') return true;
  if (typeof value === 'string' && value.trim() !== '') return true;
  if (Array.isArray(value)) return value.length > 0;
  return false;
}

/**
 * Reject client-supplied identity / media ids. A valid multipart file may still
 * be present; injection is fail-closed so no caller can believe an id write worked.
 */
function rejectAvatarInjection(body) {
  const input = body && typeof body === 'object' && !Array.isArray(body) ? body : {};
  for (const key of AVATAR_INJECTION_KEYS) {
    if (!Object.prototype.hasOwnProperty.call(input, key)) continue;
    if (isInjectionValue(input[key])) {
      return {
        error: 'avatar_not_writable',
        status: 400,
        message: 'Profile photo has its own upload step.',
      };
    }
  }
  return null;
}

function avatarMediaFromProfile(profile) {
  const avatar = profile?.avatar;
  if (!avatar || typeof avatar !== 'object') return null;
  return Array.isArray(avatar) ? avatar[0] || null : avatar;
}

function avatarFileId(profile) {
  const media = avatarMediaFromProfile(profile);
  const n = Number(media?.id ?? media);
  return Number.isFinite(n) && n > 0 ? Math.trunc(n) : null;
}

function isPublicAvatarUrl(url) {
  if (typeof url !== 'string' || !url) return false;
  if (url.startsWith('faneqo-protected:')) return false;
  return true;
}

/**
 * Canonical avatar URL. Prefer the Upload file url (our 512px asset). Fall back
 * to a stable Strapi format only when the canonical url is missing.
 * Never returns the raw Upload object or a protected-media URL.
 */
function avatarUrlFromMedia(media) {
  if (!media || typeof media !== 'object') return null;
  if (isPublicAvatarUrl(media.url)) return media.url;
  const formats = media.formats && typeof media.formats === 'object' ? media.formats : {};
  for (const key of ['medium', 'small', 'thumbnail']) {
    if (isPublicAvatarUrl(formats[key]?.url)) return formats[key].url;
  }
  return null;
}

function isProtectedUpload(file) {
  if (!file) return false;
  if (file.provider === PROTECTED_PROVIDER) return true;
  const meta = file.provider_metadata || file.providerMetadata || {};
  return meta.protected === true;
}

/**
 * May we delete this prior Upload.file?
 *
 * Only when:
 * - it is the file we captured from THIS profile before the mutation
 * - it is not protected DM / gallery media
 * - remaining morph relations are empty, or only leftover avatar links to this profile
 *
 * Unknown relation state → do not delete (unlink already happened).
 */
function canSafelyDeletePriorAvatar({ priorFileId, capturedFileId, newFileId, relations, file } = {}) {
  const prior = Number(priorFileId);
  const captured = Number(capturedFileId);
  if (!Number.isFinite(prior) || prior < 1) return false;
  if (!Number.isFinite(captured) || captured < 1) return false;
  if (prior !== captured) return false;
  if (Number(newFileId) === prior) return false;
  if (isProtectedUpload(file)) return false;
  if (relations == null) return false;
  if (!Array.isArray(relations)) return false;

  return relations.every((row) => {
    const relatedType = String(row?.related_type || '');
    const field = String(row?.field || '');
    return relatedType === FAN_PROFILE_UID && (field === 'avatar' || field === '');
  });
}

function pickIncomingFile(files) {
  if (!files || typeof files !== 'object') return null;
  if (Buffer.isBuffer(files.buffer) || files.path || files.filepath) return files;
  const candidates = ['avatar', 'file', 'files', 'photo', 'image'];
  for (const key of candidates) {
    const value = files[key];
    if (!value) continue;
    return Array.isArray(value) ? value[0] : value;
  }
  const values = Object.values(files);
  if (values.length === 1) {
    const only = Array.isArray(values[0]) ? values[0][0] : values[0];
    if (only && (only.path || only.filepath || only.buffer || only.size)) return only;
  }
  return null;
}

module.exports = {
  AVATAR_MAX_BYTES,
  AVATAR_SIZE,
  AVATAR_OUTPUT_MIME,
  AVATAR_OUTPUT_EXT,
  AVATAR_OUTPUT_QUALITY,
  ALLOWED_INPUT_MIMES,
  AVATAR_INJECTION_KEYS,
  FAN_PROFILE_UID,
  sniffImageKind,
  kindToMime,
  isAllowedInputKind,
  isHeicLike,
  validateIncomingAvatar,
  rejectAvatarInjection,
  avatarMediaFromProfile,
  avatarFileId,
  avatarUrlFromMedia,
  isPublicAvatarUrl,
  isProtectedUpload,
  canSafelyDeletePriorAvatar,
  pickIncomingFile,
};
