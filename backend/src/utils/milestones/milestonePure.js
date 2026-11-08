'use strict';

/**
 * Pure Milestone helpers — no Strapi I/O.
 * Milestone is semantic derived truth. Canonical attendance / RelationshipEvent remain facts.
 * Do not store presentation copy.
 */

const { isCanonicalAttendance } = require('../fans/canonicalAttendance');
const {
  FIRST_SHOW,
  SECOND_SHOW,
  FIRST_REPLY,
  EVALUATOR_VERSION,
  assertType,
  milestoneIdempotencyKey,
} = require('./milestoneKeys');

function toId(value) {
  if (value == null || value === '') return null;
  if (typeof value === 'object') {
    return value.id || value.fanId || value.bandId || value.subjectFan || null;
  }
  return value;
}

function isUniqueViolation(err) {
  if (!err) return false;
  const code = String(err.code || '');
  if (code === '23505' || code === 'UNIQUE_VIOLATION' || code === 'SQLITE_CONSTRAINT') return true;
  const msg = String(err.message || '').toLowerCase();
  return msg.includes('unique') && (msg.includes('constraint') || msg.includes('duplicate') || msg.includes('idempotency'));
}

function isActiveMilestone(row) {
  if (!row) return false;
  return row.status !== 'archived';
}

function relId(row, key) {
  const value = row?.[key];
  return toId(value);
}

function asIso(value) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? new Date(ms).toISOString() : null;
}

function orderedCanonicalAttendances(rows) {
  return (rows || []).filter(isCanonicalAttendance).sort((a, b) => {
    const ta = new Date(a.checkedInAt || 0).getTime();
    const tb = new Date(b.checkedInAt || 0).getTime();
    if (ta !== tb) return ta - tb;
    return Number(a.id) - Number(b.id);
  });
}

const FORBIDDEN_EVIDENCE_KEYS = new Set([
  'email',
  'body',
  'bodyText',
  'html',
  'message',
  'messageBody',
  'displayText',
  'title',
  'headline',
  'copy',
  'mediaUrl',
  'url',
  'caption',
]);

function idString(value) {
  const id = toId(value);
  if (id == null) return null;
  const text = String(id).trim();
  return text || null;
}

function sanitizeEvidence(type, evidence) {
  const t = assertType(type);
  const raw = evidence && typeof evidence === 'object' && !Array.isArray(evidence) ? evidence : {};
  for (const key of Object.keys(raw)) {
    if (FORBIDDEN_EVIDENCE_KEYS.has(key)) {
      const err = new Error(`Forbidden milestone evidence key: ${key}`);
      err.code = 'forbidden_milestone_evidence';
      throw err;
    }
  }
  if (t === FIRST_SHOW) {
    const attendanceId = idString(raw.attendanceId);
    if (!attendanceId) {
      const err = new Error('first_show evidence requires attendanceId');
      err.code = 'milestone_evidence_required';
      throw err;
    }
    return { attendanceId };
  }
  if (t === SECOND_SHOW) {
    const attendanceId = idString(raw.attendanceId);
    if (!attendanceId) {
      const err = new Error('second_show evidence requires attendanceId');
      err.code = 'milestone_evidence_required';
      throw err;
    }
    const out = { attendanceId, ordinal: 2 };
    const priorAttendanceId = idString(raw.priorAttendanceId);
    if (priorAttendanceId) out.priorAttendanceId = priorAttendanceId;
    return out;
  }
  if (t === FIRST_REPLY) {
    const relationshipEventId = idString(raw.relationshipEventId);
    if (!relationshipEventId) {
      const err = new Error('first_reply evidence requires relationshipEventId');
      err.code = 'milestone_evidence_required';
      throw err;
    }
    return { relationshipEventId };
  }
  const err = new Error(`No evidence shape for milestone type: ${t}`);
  err.code = 'milestone_evidence_unsupported';
  throw err;
}

function draftFromEvaluation({ bandId, subjectFanId, evaluation }) {
  if (!evaluation) return null;
  const type = assertType(evaluation.type);
  const evidence = sanitizeEvidence(type, evaluation.evidence);
  const occurredAt = asIso(evaluation.occurredAt);
  if (!occurredAt) {
    const err = new Error('occurredAt is required');
    err.code = 'occurred_required';
    throw err;
  }
  return {
    type,
    value: evaluation.value == null ? null : Number(evaluation.value),
    evidence,
    occurredAt,
    version: Number(evaluation.version) || EVALUATOR_VERSION,
    status: 'active',
    band: toId(bandId),
    subjectFan: toId(subjectFanId) || null,
    idempotencyKey: milestoneIdempotencyKey({
      bandId,
      subjectFanId,
      type,
    }),
    archivedAt: null,
  };
}

/**
 * Earliest unsuppressed canonical attendance for this artist × fan.
 * Not Moment count, not checkedInShowCount, not QR scans.
 */
function evaluateFirstShow(attendances) {
  const ordered = orderedCanonicalAttendances(attendances);
  const first = ordered[0];
  if (!first?.id || !first.checkedInAt) return null;
  return {
    type: FIRST_SHOW,
    value: 1,
    occurredAt: asIso(first.checkedInAt),
    evidence: { attendanceId: String(first.id) },
    version: EVALUATOR_VERSION,
  };
}

/**
 * Second chronological unsuppressed canonical attendance.
 * returning === true is a sanity check, not the occurrence itself.
 */
function evaluateSecondShow(attendances) {
  const ordered = orderedCanonicalAttendances(attendances);
  const first = ordered[0];
  const second = ordered[1];
  if (!second?.id || !second.checkedInAt || !first?.id) return null;
  return {
    type: SECOND_SHOW,
    value: 2,
    occurredAt: asIso(second.checkedInAt),
    evidence: {
      attendanceId: String(second.id),
      priorAttendanceId: String(first.id),
      ordinal: 2,
    },
    version: EVALUATOR_VERSION,
  };
}

/**
 * Earliest valid fan_replied RelationshipEvent for this artist × fan.
 * Artist messages do not count. Message body is never evidence.
 */
function evaluateFirstReply(event) {
  if (!event?.id) return null;
  if (String(event.type) !== 'fan_replied') return null;
  const occurredAt = asIso(event.occurredAt);
  if (!occurredAt) return null;
  return {
    type: FIRST_REPLY,
    value: 1,
    occurredAt,
    evidence: { relationshipEventId: String(event.id) },
    version: EVALUATOR_VERSION,
  };
}

function evidenceEqual(type, a, b) {
  try {
    const left = sanitizeEvidence(type, a);
    const right = sanitizeEvidence(type, b);
    return JSON.stringify(left) === JSON.stringify(right);
  } catch {
    return false;
  }
}

function sameOccurredAt(a, b) {
  const left = asIso(a);
  const right = asIso(b);
  return Boolean(left && right && left === right);
}

function needsUpdate(existing, desired) {
  if (!existing || !desired) return false;
  if (!isActiveMilestone(existing)) return true;
  if (Number(existing.value) !== Number(desired.value)) return true;
  if (Number(existing.version) !== Number(desired.version)) return true;
  if (!sameOccurredAt(existing.occurredAt, desired.occurredAt)) return true;
  if (!evidenceEqual(desired.type, existing.evidence, desired.evidence)) return true;
  return false;
}

module.exports = {
  toId,
  relId,
  isUniqueViolation,
  isActiveMilestone,
  asIso,
  orderedCanonicalAttendances,
  sanitizeEvidence,
  draftFromEvaluation,
  evaluateFirstShow,
  evaluateSecondShow,
  evaluateFirstReply,
  evidenceEqual,
  sameOccurredAt,
  needsUpdate,
};
