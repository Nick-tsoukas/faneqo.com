'use strict';

/**
 * Controlled V1 feature registry. Add keys here — not in controllers.
 */

const FEATURE_KEYS = Object.freeze([
  'internal_labs',
  'moments',
  'show_moments',
  'fan_passport',
  'share_studio',
  'wrapped',
  'external_intelligence',
]);

const FEATURE_KEY_SET = new Set(FEATURE_KEYS);

/** User-subject features. Band rows are ignored. */
const USER_SCOPED_KEYS = Object.freeze(['internal_labs', 'fan_passport']);

/** Band-subject features. Require a band in context to enable. */
const BAND_SCOPED_KEYS = Object.freeze([
  'moments',
  'show_moments',
  'share_studio',
  'wrapped',
  'external_intelligence',
]);

const SUBJECT_TYPES = Object.freeze(['user', 'band', 'cohort', 'platform']);
const STATUSES = Object.freeze(['enabled', 'disabled']);

function isFeatureKey(key) {
  return FEATURE_KEY_SET.has(String(key || ''));
}

function assertFeatureKey(key) {
  const normalized = String(key || '');
  if (!FEATURE_KEY_SET.has(normalized)) {
    const err = new Error(`Unknown feature key: ${normalized || '(empty)'}`);
    err.code = 'unknown_feature_key';
    throw err;
  }
  return normalized;
}

function isUserScopedKey(key) {
  return USER_SCOPED_KEYS.includes(String(key || ''));
}

function isBandScopedKey(key) {
  return BAND_SCOPED_KEYS.includes(String(key || ''));
}

function emptyFeatureMap(value = false) {
  const map = {};
  for (const key of FEATURE_KEYS) map[key] = Boolean(value);
  return map;
}

module.exports = {
  FEATURE_KEYS,
  FEATURE_KEY_SET,
  USER_SCOPED_KEYS,
  BAND_SCOPED_KEYS,
  SUBJECT_TYPES,
  STATUSES,
  isFeatureKey,
  assertFeatureKey,
  isUserScopedKey,
  isBandScopedKey,
  emptyFeatureMap,
};
