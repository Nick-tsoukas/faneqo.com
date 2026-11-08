'use strict';

/**
 * First production Moment source: canonical unsuppressed attendance.
 *
 * One unsuppressed fan-show-attendance row → one fan-scoped show Moment.
 * Event-backed and manual Show Mode nights are the same product concept.
 * Moment failure never rolls back attendance.
 */

const { isCanonicalAttendance } = require('../fans/canonicalAttendance');
const { showMomentIdempotencyKey, SHOW_SOURCE_TYPE } = require('./momentKeys');
const { persistMoment, findByIdempotencyKey, archiveMoment, logWrite } = require('./momentService');
const {
  attendanceEligibleForShowMoment,
  showMomentDraftFromAttendance,
  toId,
} = require('./momentPure');

async function loadAttendanceForMoment(strapi, attendance) {
  if (!attendance?.id) return attendance || null;
  if (attendance.fan && attendance.band && attendance.checkedInAt) return attendance;
  return strapi.entityService.findOne('api::fan-show-attendance.fan-show-attendance', attendance.id, {
    fields: ['id', 'checkedInAt', 'campaignId', 'city', 'venue', 'showTitle', 'showDate', 'suppressedDuplicate'],
    populate: {
      fan: { fields: ['id'] },
      band: { fields: ['id'] },
      event: { fields: ['id'] },
    },
  });
}

async function archiveShowMomentForAttendance(strapi, attendance) {
  const attendanceId = toId(attendance?.id) || attendance?.id;
  if (!attendanceId) return null;
  const key = showMomentIdempotencyKey(attendanceId);
  const existing = await findByIdempotencyKey(strapi, key);
  if (!existing) return null;
  return archiveMoment(strapi, existing, { reason: 'attendance_suppressed' });
}

async function ensureShowMomentForAttendance(strapi, rawAttendance) {
  const attendance = await loadAttendanceForMoment(strapi, rawAttendance);
  if (!attendance?.id) return null;

  if (!isCanonicalAttendance(attendance)) {
    return archiveShowMomentForAttendance(strapi, attendance);
  }

  const draft = showMomentDraftFromAttendance(attendance);
  if (!draft || !draft.occurredAt) return null;

  return persistMoment(strapi, draft);
}

async function ensureShowMomentForAttendanceSafe(strapi, attendance) {
  const started = Date.now();
  const attendanceId = toId(attendance?.id) || attendance?.id || '';
  try {
    const row = await ensureShowMomentForAttendance(strapi, attendance);
    logWrite(strapi, {
      status: row?._duplicate ? 'duplicate' : row ? 'ok' : 'skipped',
      kind: 'show',
      sourceType: SHOW_SOURCE_TYPE,
      sourceId: attendanceId,
      momentId: row?.id || '',
      durationMs: Date.now() - started,
    });
    return row;
  } catch (err) {
    logWrite(strapi, {
      status: 'error',
      kind: 'show',
      sourceType: SHOW_SOURCE_TYPE,
      sourceId: attendanceId,
      durationMs: Date.now() - started,
      errorCode: err.code || 'write_failed',
    });
    strapi?.log?.warn?.(
      `[Moment] repairable show moment failure attendanceId=${attendanceId} error=${err.message}`
    );
    return null;
  }
}

module.exports = {
  ensureShowMomentForAttendance,
  ensureShowMomentForAttendanceSafe,
  archiveShowMomentForAttendance,
  attendanceEligibleForShowMoment,
};
