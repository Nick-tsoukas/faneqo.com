'use strict';

/**
 * Shared Band artist-image framing updates.
 *
 * Phone crop stays on cyberedImagePositionX/Y/Zoom.
 * Desktop crop/fit are independent nullable fields. Missing desktop crop
 * inherits the live Phone crop for appearance only.
 *
 * A Phone-only save on an inherited Desktop record materializes the
 * ORIGINAL effective Desktop crop in the same update so later Phone
 * edits cannot move Desktop. This is a one-time compatibility write,
 * not ongoing sync.
 */

const CYBERED_HERO_FITS = new Set(['fill', 'full']);

const PHONE_CROP_KEYS = [
  'cyberedImagePositionX',
  'cyberedImagePositionY',
  'cyberedImageZoom',
];
const PHONE_KEYS = [...PHONE_CROP_KEYS, 'cyberedMobileFit'];

const DESKTOP_CROP_KEYS = [
  'cyberedDesktopPositionX',
  'cyberedDesktopPositionY',
  'cyberedDesktopZoom',
];
const DESKTOP_KEYS = [...DESKTOP_CROP_KEYS, 'cyberedDesktopFit'];

const ALL_FRAMING_KEYS = [...PHONE_KEYS, ...DESKTOP_KEYS];

const DEFAULT_POSITION = 50;
const DEFAULT_ZOOM = 1;
const MIN_POSITION = 0;
const MAX_POSITION = 100;
const MIN_ZOOM = 1;
const MAX_ZOOM = 2;

function hasOwn(object, key) {
  return Boolean(object) && Object.prototype.hasOwnProperty.call(object, key);
}

function isDesktopCropInherited(existing = {}) {
  return (
    existing.cyberedDesktopPositionX == null &&
    existing.cyberedDesktopPositionY == null &&
    existing.cyberedDesktopZoom == null
  );
}

function fallbackNumber(value, fallback) {
  if (value == null || value === '') return fallback;
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function readEffectiveCrop(existing = {}, surface) {
  const phone = {
    x: fallbackNumber(existing.cyberedImagePositionX, DEFAULT_POSITION),
    y: fallbackNumber(existing.cyberedImagePositionY, DEFAULT_POSITION),
    z: fallbackNumber(existing.cyberedImageZoom, DEFAULT_ZOOM),
  };
  if (surface === 'phone') return phone;
  if (isDesktopCropInherited(existing)) return { ...phone };
  return {
    x: fallbackNumber(existing.cyberedDesktopPositionX, phone.x),
    y: fallbackNumber(existing.cyberedDesktopPositionY, phone.y),
    z: fallbackNumber(existing.cyberedDesktopZoom, phone.z),
  };
}

function storedPosition(value) {
  if (value == null || value === '') return value;
  const number = Number(value);
  if (!Number.isFinite(number)) return value;
  return Math.round(number);
}

function validatePosition(value, field) {
  if (value === null) return { ok: true, value: null };
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return { ok: false, error: `${field} must be a number between ${MIN_POSITION} and ${MAX_POSITION}` };
  }
  if (number < MIN_POSITION || number > MAX_POSITION) {
    return { ok: false, error: `${field} must be between ${MIN_POSITION} and ${MAX_POSITION}` };
  }
  // Band stores these as integers. Dragging the crop produces fractions.
  return { ok: true, value: storedPosition(number) };
}

function validateZoom(value, field) {
  if (value === null) return { ok: true, value: null };
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return { ok: false, error: `${field} must be a number between ${MIN_ZOOM} and ${MAX_ZOOM}` };
  }
  if (number < MIN_ZOOM || number > MAX_ZOOM) {
    return { ok: false, error: `${field} must be between ${MIN_ZOOM} and ${MAX_ZOOM}` };
  }
  return { ok: true, value: number };
}

function validateFit(value, field) {
  if (value === null) return { ok: true, value: null };
  const mode = String(value).trim().toLowerCase();
  if (!CYBERED_HERO_FITS.has(mode)) {
    return { ok: false, error: `${field} must be fill or full` };
  }
  return { ok: true, value: mode };
}

const VALIDATORS = {
  cyberedImagePositionX: validatePosition,
  cyberedImagePositionY: validatePosition,
  cyberedDesktopPositionX: validatePosition,
  cyberedDesktopPositionY: validatePosition,
  cyberedImageZoom: validateZoom,
  cyberedDesktopZoom: validateZoom,
  cyberedMobileFit: validateFit,
  cyberedDesktopFit: validateFit,
};

function incomingTouches(data, keys) {
  return keys.some((key) => hasOwn(data, key));
}

function completeDesktopCrop(data, originalDesktop) {
  const writingCrop = DESKTOP_CROP_KEYS.some((key) => hasOwn(data, key));
  if (!writingCrop) return;
  if (!hasOwn(data, 'cyberedDesktopPositionX')) data.cyberedDesktopPositionX = storedPosition(originalDesktop.x);
  if (!hasOwn(data, 'cyberedDesktopPositionY')) data.cyberedDesktopPositionY = storedPosition(originalDesktop.y);
  if (!hasOwn(data, 'cyberedDesktopZoom')) data.cyberedDesktopZoom = originalDesktop.z;
}

/**
 * @param {object} existing Band row before this update (empty for create)
 * @param {object} incoming Request data object
 * @returns {{ data: object, error: string|null, materializedDesktop: boolean }}
 */
function applyArtistImageFramingUpdate(existing = {}, incoming = {}) {
  if (!incoming || typeof incoming !== 'object') {
    return { data: incoming, error: null, materializedDesktop: false };
  }

  const touchesFraming = incomingTouches(incoming, ALL_FRAMING_KEYS);
  if (!touchesFraming) {
    return { data: incoming, error: null, materializedDesktop: false };
  }

  const data = { ...incoming };
  const originalDesktop = readEffectiveCrop(existing, 'desktop');
  const desktopWasInherited = isDesktopCropInherited(existing);

  for (const [key, validate] of Object.entries(VALIDATORS)) {
    if (!hasOwn(data, key)) continue;
    const result = validate(data[key], key);
    if (!result.ok) {
      return { data: incoming, error: result.error, materializedDesktop: false };
    }
    data[key] = result.value;
  }

  const phoneChanged = incomingTouches(data, PHONE_KEYS);
  const desktopCropIncoming = incomingTouches(data, DESKTOP_CROP_KEYS);

  let materializedDesktop = false;
  if (phoneChanged && desktopWasInherited && !desktopCropIncoming) {
    data.cyberedDesktopPositionX = storedPosition(originalDesktop.x);
    data.cyberedDesktopPositionY = storedPosition(originalDesktop.y);
    data.cyberedDesktopZoom = originalDesktop.z;
    materializedDesktop = true;
  }

  completeDesktopCrop(data, originalDesktop);

  return { data, error: null, materializedDesktop };
}

module.exports = {
  CYBERED_HERO_FITS: Array.from(CYBERED_HERO_FITS),
  PHONE_KEYS,
  DESKTOP_KEYS,
  ALL_FRAMING_KEYS,
  applyArtistImageFramingUpdate,
  isDesktopCropInherited,
  readEffectiveCrop,
};
