'use strict';

/**
 * Controlled Moment registry. Add keys here — not in controllers.
 * Phase 06 persists show Moments only. Other kinds are reserved.
 */

const KINDS = Object.freeze([
  'show',
  'artist_update',
  'milestone',
  'release',
  'artist_growth',
  'city_growth',
  'fan_relationship',
  'support',
  'tour',
  'period_recap',
  'manual',
  'fan_memory',
]);

const KIND_SET = new Set(KINDS);

const STATUSES = Object.freeze(['candidate', 'published', 'archived']);
const STATUS_SET = new Set(STATUSES);

/**
 * Server authorization vocabulary — not frontend decoration.
 *
 * artist_fan: owning-band authorized viewers + the subject fan (when that
 *   fan's accountUser is authenticated). Not other fans, not anonymous,
 *   not other bands.
 * artist_only: owning-band authorized viewers only.
 * fan_only: subject fan only.
 * show_attendees / fan_list / public: reserved for future non-fan-scoped
 *   Moments. Phase 06 show Moments do not emit these.
 */
const VISIBILITIES = Object.freeze([
  'artist_fan',
  'artist_only',
  'fan_only',
  'show_attendees',
  'fan_list',
  'public',
]);

const VISIBILITY_SET = new Set(VISIBILITIES);

const CREATED_BY_TYPES = Object.freeze(['system', 'artist_user', 'fan_user']);
const CREATED_BY_TYPE_SET = new Set(CREATED_BY_TYPES);

const SOURCE_TYPES = Object.freeze([
  'fan_show_attendance',
  'artist_update',
  'conversation_message',
  'milestone',
  'fan',
]);

const SOURCE_TYPE_SET = new Set(SOURCE_TYPES);

const SHOW_SOURCE_TYPE = 'fan_show_attendance';
const SCHEMA_VERSION = 1;

function assertKind(kind) {
  const key = String(kind || '');
  if (!KIND_SET.has(key)) {
    const err = new Error(`Unknown moment kind: ${key || '(empty)'}`);
    err.code = 'unknown_moment_kind';
    throw err;
  }
  return key;
}

function assertStatus(status) {
  const key = String(status || '');
  if (!STATUS_SET.has(key)) {
    const err = new Error(`Unknown moment status: ${key || '(empty)'}`);
    err.code = 'unknown_moment_status';
    throw err;
  }
  return key;
}

function assertVisibility(visibility) {
  const key = String(visibility || '');
  if (!VISIBILITY_SET.has(key)) {
    const err = new Error(`Unknown moment visibility: ${key || '(empty)'}`);
    err.code = 'unknown_moment_visibility';
    throw err;
  }
  return key;
}

function assertCreatedByType(createdByType) {
  const key = String(createdByType || '');
  if (!CREATED_BY_TYPE_SET.has(key)) {
    const err = new Error(`Unknown moment createdByType: ${key || '(empty)'}`);
    err.code = 'unknown_moment_created_by';
    throw err;
  }
  return key;
}

function assertSourceType(sourceType) {
  const key = String(sourceType || '');
  if (!SOURCE_TYPE_SET.has(key)) {
    const err = new Error(`Unknown moment source type: ${key || '(empty)'}`);
    err.code = 'unknown_moment_source_type';
    throw err;
  }
  return key;
}

function showMomentIdempotencyKey(attendanceId) {
  const id = String(attendanceId || '').trim();
  if (!id) {
    const err = new Error('attendanceId is required for show moment identity');
    err.code = 'show_moment_identity_required';
    throw err;
  }
  return `show:${SHOW_SOURCE_TYPE}:${id}`;
}

module.exports = {
  KINDS,
  KIND_SET,
  STATUSES,
  STATUS_SET,
  VISIBILITIES,
  VISIBILITY_SET,
  CREATED_BY_TYPES,
  CREATED_BY_TYPE_SET,
  SOURCE_TYPES,
  SOURCE_TYPE_SET,
  SHOW_SOURCE_TYPE,
  SCHEMA_VERSION,
  assertKind,
  assertStatus,
  assertVisibility,
  assertCreatedByType,
  assertSourceType,
  showMomentIdempotencyKey,
};
