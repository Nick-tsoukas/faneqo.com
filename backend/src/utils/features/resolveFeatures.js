'use strict';

/**
 * Pure feature resolution. No Strapi, no product tables, no providers.
 *
 * Precedence (explicit deny wins):
 * 1. relevant subject disabled (active window)
 * 2. relevant subject enabled (active window)
 * 3. cohort enabled
 * 4. platform enabled
 * 5. DENY
 *
 * User-scoped keys (internal_labs, fan_passport): user + cohort + platform.
 * Band-scoped keys: require bandId. User/band disable both deny.
 * User enable OR band enable can grant. Missing band ⇒ deny band-scoped keys.
 *
 * Inactive windows (startsAt in the future, endsAt <= now) are ignored.
 */

const {
  FEATURE_KEYS,
  isFeatureKey,
  isUserScopedKey,
  emptyFeatureMap,
} = require('./featureKeys');

function toId(value) {
  if (value == null || value === '') return null;
  return String(value);
}

function isActiveRow(row, now) {
  if (!row) return false;
  const t = now instanceof Date ? now : new Date(now);
  if (row.startsAt) {
    const start = new Date(row.startsAt);
    if (!Number.isNaN(start.getTime()) && start.getTime() > t.getTime()) return false;
  }
  if (row.endsAt) {
    const end = new Date(row.endsAt);
    if (!Number.isNaN(end.getTime()) && end.getTime() <= t.getTime()) return false;
  }
  return true;
}

function matchesSubject(row, type, id) {
  return row.subjectType === type && String(row.subjectId) === String(id);
}

function hasStatus(rows, status) {
  return rows.some((row) => row.status === status);
}

/**
 * @param {string} featureKey
 * @param {{ userId?: string|number|null, bandId?: string|number|null, cohortKeys?: string[] }} context
 * @param {Array<object>} rows
 * @param {Date} [now]
 */
function resolveFeature(featureKey, context, rows, now = new Date()) {
  if (!isFeatureKey(featureKey)) return false;

  const userId = toId(context?.userId);
  const bandId = toId(context?.bandId);
  const cohortKeys = Array.isArray(context?.cohortKeys)
    ? context.cohortKeys.map(String).filter(Boolean)
    : [];

  const applicable = (Array.isArray(rows) ? rows : []).filter(
    (row) => row && row.featureKey === featureKey && isActiveRow(row, now)
  );

  const userRows = userId
    ? applicable.filter((row) => matchesSubject(row, 'user', userId))
    : [];
  const bandRows = bandId
    ? applicable.filter((row) => matchesSubject(row, 'band', bandId))
    : [];
  const cohortRows = cohortKeys.length
    ? applicable.filter(
        (row) => row.subjectType === 'cohort' && cohortKeys.includes(String(row.subjectId))
      )
    : [];
  const platformRows = applicable.filter(
    (row) => row.subjectType === 'platform' && String(row.subjectId) === '*'
  );

  if (isUserScopedKey(featureKey)) {
    if (!userId) return false;
    if (hasStatus(userRows, 'disabled')) return false;
    if (hasStatus(userRows, 'enabled')) return true;
  } else {
    if (!bandId) return false;
    if (hasStatus(userRows, 'disabled')) return false;
    if (hasStatus(bandRows, 'disabled')) return false;
    if (hasStatus(userRows, 'enabled')) return true;
    if (hasStatus(bandRows, 'enabled')) return true;
  }

  if (hasStatus(cohortRows, 'disabled')) return false;
  if (hasStatus(cohortRows, 'enabled')) return true;
  if (hasStatus(platformRows, 'disabled')) return false;
  if (hasStatus(platformRows, 'enabled')) return true;
  return false;
}

function resolveFeatureMap(context, rows, now = new Date()) {
  const map = emptyFeatureMap(false);
  for (const key of FEATURE_KEYS) {
    map[key] = resolveFeature(key, context, rows, now);
  }
  return map;
}

module.exports = {
  isActiveRow,
  resolveFeature,
  resolveFeatureMap,
};
