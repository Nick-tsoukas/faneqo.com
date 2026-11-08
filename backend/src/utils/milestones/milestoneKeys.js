'use strict';

/**
 * Controlled Milestone registry. Add types here — not in controllers.
 * Phase 07 persists three fan-scoped types only. Others are reserved.
 *
 * Type is semantic identity. Presentation copy does not live here.
 */

const TYPES = Object.freeze([
  'fan_artist.first_show',
  'fan_artist.second_show',
  'fan_artist.first_reply',
  'fan_artist.fifth_show',
  'artist.fans.100',
  'artist.fans.500',
  'artist.returning_fans.100',
  'tour.completed',
]);

const TYPE_SET = new Set(TYPES);

const PHASE_07_TYPES = Object.freeze([
  'fan_artist.first_show',
  'fan_artist.second_show',
  'fan_artist.first_reply',
]);

const PHASE_07_TYPE_SET = new Set(PHASE_07_TYPES);

const STATUSES = Object.freeze(['active', 'archived']);
const STATUS_SET = new Set(STATUSES);

const FIRST_SHOW = 'fan_artist.first_show';
const SECOND_SHOW = 'fan_artist.second_show';
const FIRST_REPLY = 'fan_artist.first_reply';

const EVALUATOR_VERSION = 1;

function assertType(type) {
  const key = String(type || '');
  if (!TYPE_SET.has(key)) {
    const err = new Error(`Unknown milestone type: ${key || '(empty)'}`);
    err.code = 'unknown_milestone_type';
    throw err;
  }
  return key;
}

function assertStatus(status) {
  const key = String(status || '');
  if (!STATUS_SET.has(key)) {
    const err = new Error(`Unknown milestone status: ${key || '(empty)'}`);
    err.code = 'unknown_milestone_status';
    throw err;
  }
  return key;
}

function isPhase07Type(type) {
  return PHASE_07_TYPE_SET.has(String(type || ''));
}

function isFanScopedType(type) {
  return String(type || '').startsWith('fan_artist.');
}

/**
 * One semantic milestone per artist × subject × type.
 * Version is stored on the row, not in the key — a version change
 * reconciles in place instead of creating a duplicate achievement.
 *
 * Fan-scoped:  fan:{bandId}:{fanId}:{type}
 * Artist-scoped later: band:{bandId}:{type}
 */
function milestoneIdempotencyKey({ bandId, subjectFanId, type }) {
  const t = assertType(type);
  const bid = String(bandId || '').trim();
  if (!bid) {
    const err = new Error('bandId is required for milestone identity');
    err.code = 'milestone_identity_required';
    throw err;
  }
  const fanId = subjectFanId == null || subjectFanId === '' ? '' : String(subjectFanId).trim();
  if (isFanScopedType(t) && !fanId) {
    const err = new Error('subjectFanId is required for fan-scoped milestone identity');
    err.code = 'milestone_identity_required';
    throw err;
  }
  if (fanId) return `fan:${bid}:${fanId}:${t}`;
  return `band:${bid}:${t}`;
}

module.exports = {
  TYPES,
  TYPE_SET,
  PHASE_07_TYPES,
  PHASE_07_TYPE_SET,
  STATUSES,
  STATUS_SET,
  FIRST_SHOW,
  SECOND_SHOW,
  FIRST_REPLY,
  EVALUATOR_VERSION,
  assertType,
  assertStatus,
  isPhase07Type,
  isFanScopedType,
  milestoneIdempotencyKey,
};
