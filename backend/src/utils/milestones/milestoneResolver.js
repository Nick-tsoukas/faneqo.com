'use strict';

/**
 * Prepared MilestoneView. Not persisted.
 * No presentation copy. Evidence stays as stable canonical ids.
 */

const { toId, isActiveMilestone, sanitizeEvidence } = require('./milestonePure');
const { isPhase07Type } = require('./milestoneKeys');

function relatedShowFromAttendance(attendance) {
  if (!attendance) return null;
  const event = attendance.event && typeof attendance.event === 'object' ? attendance.event : null;
  return {
    attendanceId: String(attendance.id),
    city: event?.city || attendance.city || null,
    venue: event?.venue || attendance.venue || null,
    date: event?.date || attendance.showDate || attendance.checkedInAt || null,
    title: event?.title || attendance.showTitle || null,
  };
}

function toMilestoneView(row, extras = {}) {
  let evidence = null;
  try {
    evidence = sanitizeEvidence(row.type, row.evidence);
  } catch {
    evidence = row.evidence && typeof row.evidence === 'object' ? row.evidence : null;
  }
  return {
    id: row.id,
    type: row.type,
    value: row.value == null ? null : Number(row.value),
    occurredAt: row.occurredAt,
    version: Number(row.version) || 1,
    status: row.status,
    evidence,
    subjectFanId: toId(row.subjectFan),
    bandId: toId(row.band),
    relatedShow: extras.relatedShow || null,
  };
}

function attendanceIdFromEvidence(evidence) {
  const id = evidence?.attendanceId;
  if (id == null || id === '') return null;
  const n = Number(id);
  return Number.isInteger(n) && n > 0 ? n : null;
}

/**
 * Map already-authorized milestone rows. Caller must have passed band+fan auth.
 * relatedShow is filled from a batched attendance map — no query per milestone.
 */
function resolveMilestoneViews(rows, { attendanceMap } = {}) {
  const views = [];
  for (const row of rows || []) {
    if (!row || !isActiveMilestone(row)) continue;
    if (!isPhase07Type(row.type)) continue;
    const evidence = row.evidence && typeof row.evidence === 'object' ? row.evidence : {};
    const attendanceId = attendanceIdFromEvidence(evidence);
    const attendance = attendanceId && attendanceMap ? attendanceMap.get(attendanceId) : null;
    views.push(
      toMilestoneView(row, {
        relatedShow: relatedShowFromAttendance(attendance),
      })
    );
  }
  return views;
}

module.exports = {
  toMilestoneView,
  resolveMilestoneViews,
  relatedShowFromAttendance,
  attendanceIdFromEvidence,
};
