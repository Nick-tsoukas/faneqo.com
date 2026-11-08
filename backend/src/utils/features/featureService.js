'use strict';

/**
 * Feature enrollment Strapi access + resolution.
 * Callers never query FeatureEnrollment themselves.
 *
 * Fail-safe: query errors ⇒ deny.
 */

const { FEATURE_KEYS, assertFeatureKey, emptyFeatureMap, SUBJECT_TYPES } = require('./featureKeys');
const { resolveFeature, resolveFeatureMap } = require('./resolveFeatures');

const UID = 'api::feature-enrollment.feature-enrollment';
const ENROLLMENT_QUERY_LIMIT = 500;

function userIdFrom(user) {
  if (!user) return null;
  if (typeof user === 'object') return user.id || user.userId || null;
  return user;
}

function bandIdFrom(band) {
  if (band == null || band === '') return null;
  if (typeof band === 'object') return band.id || band.bandId || null;
  return band;
}

function normalizeContext(context = {}) {
  return {
    userId: userIdFrom(context.user) || userIdFrom(context.userId) || null,
    bandId: bandIdFrom(context.band) || bandIdFrom(context.bandId) || null,
    cohortKeys: Array.isArray(context.cohorts)
      ? context.cohorts
      : Array.isArray(context.cohortKeys)
        ? context.cohortKeys
        : [],
  };
}

function mapRow(row) {
  if (!row) return null;
  return {
    featureKey: row.featureKey,
    subjectType: row.subjectType,
    subjectId: String(row.subjectId),
    status: row.status,
    startsAt: row.startsAt || null,
    endsAt: row.endsAt || null,
  };
}

async function loadEnrollmentRows(strapi, { userId, bandId, cohortKeys }) {
  const filters = [{ subjectType: 'platform', subjectId: '*' }];
  if (userId != null) filters.push({ subjectType: 'user', subjectId: String(userId) });
  if (bandId != null) filters.push({ subjectType: 'band', subjectId: String(bandId) });
  if (cohortKeys.length) {
    filters.push({ subjectType: 'cohort', subjectId: { $in: cohortKeys.map(String) } });
  }

  const rows = await strapi.entityService.findMany(UID, {
    filters: { $or: filters },
    fields: ['featureKey', 'subjectType', 'subjectId', 'status', 'startsAt', 'endsAt'],
    limit: ENROLLMENT_QUERY_LIMIT,
  });
  const list = Array.isArray(rows) ? rows : [];
  // Truncation could drop a disabled row and incorrectly GRANT. Fail closed.
  if (list.length >= ENROLLMENT_QUERY_LIMIT) {
    const err = new Error('enrollment_query_truncated');
    err.code = 'enrollment_query_truncated';
    throw err;
  }
  return list.map(mapRow).filter(Boolean);
}

function createFeatureService(strapi) {
  async function loadOrEmpty(context) {
    const ctx = normalizeContext(context);
    try {
      const rows = await loadEnrollmentRows(strapi, ctx);
      return { ctx, rows, error: null };
    } catch (err) {
      strapi.log?.warn?.(`[Labs] feature load failed: ${err.message}`);
      return { ctx, rows: [], error: err };
    }
  }

  async function hasFeature(featureKey, context) {
    if (!isFeatureKeySafe(featureKey)) return false;
    const { ctx, rows } = await loadOrEmpty(context);
    try {
      return resolveFeature(featureKey, ctx, rows);
    } catch {
      return false;
    }
  }

  async function assertFeature(featureKey, context) {
    const ok = await hasFeature(featureKey, context);
    if (!ok) {
      const err = new Error('Not found');
      err.status = 404;
      err.statusCode = 404;
      err.code = 'feature_denied';
      throw err;
    }
    return true;
  }

  async function resolveFeatures(context) {
    const { ctx, rows, error } = await loadOrEmpty(context);
    if (error) return emptyFeatureMap(false);
    return resolveFeatureMap(ctx, rows);
  }

  async function getMyFeatures({ user, band } = {}) {
    const { ctx, rows, error } = await loadOrEmpty({ user, band });
    if (error) {
      const empty = emptyFeatureMap(false);
      return { features: empty, user: empty, band: ctx.bandId ? empty : null };
    }
    const userFeatures = resolveFeatureMap({ ...ctx, bandId: null }, rows);
    if (!ctx.bandId) {
      return { features: userFeatures, user: userFeatures, band: null };
    }
    const bandOnly = resolveFeatureMap({ ...ctx, userId: null }, rows);
    const resolved = resolveFeatureMap(ctx, rows);
    return { features: resolved, user: userFeatures, band: bandOnly };
  }

  return {
    hasFeature,
    assertFeature,
    resolveFeatures,
    getMyFeatures,
  };
}

function isFeatureKeySafe(key) {
  return FEATURE_KEYS.includes(String(key || ''));
}

async function upsertEnrollment(strapi, data) {
  const featureKey = assertFeatureKey(data.featureKey);
  const subjectType = data.subjectType;
  if (!SUBJECT_TYPES.includes(subjectType)) {
    const err = new Error(`Unknown subjectType: ${subjectType || '(empty)'}`);
    err.code = 'unknown_subject_type';
    throw err;
  }
  const subjectId = String(data.subjectId);
  const existing = await strapi.entityService.findMany(UID, {
    filters: { featureKey, subjectType, subjectId },
    fields: ['id', 'status'],
    limit: 1,
  });
  const payload = {
    featureKey,
    subjectType,
    subjectId,
    status: data.status || 'enabled',
    startsAt: data.startsAt || null,
    endsAt: data.endsAt || null,
    grantedBy: data.grantedBy || null,
    cohort: data.cohort || null,
    metadata: data.metadata || null,
  };
  if (existing?.[0]?.id) {
    return strapi.entityService.update(UID, existing[0].id, { data: payload });
  }
  return strapi.entityService.create(UID, { data: payload });
}

module.exports = {
  UID,
  ENROLLMENT_QUERY_LIMIT,
  createFeatureService,
  upsertEnrollment,
  normalizeContext,
};
