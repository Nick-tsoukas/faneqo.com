'use strict';

/**
 * Pure Moment helpers — no Strapi I/O.
 * Moment is a sparse derived index. Canonical attendance remains show truth.
 */

const { isCanonicalAttendance } = require('../fans/canonicalAttendance');
const {
  SHOW_SOURCE_TYPE,
  SCHEMA_VERSION,
  showMomentIdempotencyKey,
} = require('./momentKeys');

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

function isActiveMoment(row) {
  if (!row) return false;
  return row.status !== 'archived';
}

function relId(row, key) {
  const value = row?.[key];
  return toId(value);
}

/**
 * Fan-scoped show Moment: owning-band authorized viewers + subject fan.
 * Cross-band is always denied. Anonymous is always denied.
 */
function canViewMoment({ moment, viewer } = {}) {
  if (!moment || !isActiveMoment(moment)) return false;
  const momentBand = String(relId(moment, 'band') ?? moment.bandId ?? '');
  const viewerBand = String(viewer?.bandId ?? '');
  if (!momentBand || !viewerBand || momentBand !== viewerBand) return false;

  const vis = String(moment.visibility || '');
  const artistOk = Boolean(viewer?.bandRole);
  const subjectId = String(relId(moment, 'subjectFan') ?? moment.subjectFanId ?? '');
  const viewerFanId = String(viewer?.subjectFanId ?? '');
  const fanOk = Boolean(viewer?.isSubjectFan || (subjectId && viewerFanId && subjectId === viewerFanId));

  if (vis === 'artist_fan') return artistOk || fanOk;
  if (vis === 'artist_only') return artistOk;
  if (vis === 'fan_only') return fanOk;
  if (vis === 'public') return artistOk || fanOk;
  if (vis === 'fan_list' || vis === 'show_attendees') return artistOk;
  return false;
}

function attendanceEligibleForShowMoment(attendance) {
  if (!attendance || !attendance.id) return false;
  if (!isCanonicalAttendance(attendance)) return false;
  const fanId = toId(attendance.fan);
  const bandId = toId(attendance.band);
  return Boolean(fanId && bandId);
}

function showMomentDraftFromAttendance(attendance) {
  if (!attendanceEligibleForShowMoment(attendance)) return null;
  const attendanceId = toId(attendance.id) || attendance.id;
  return {
    kind: 'show',
    status: 'candidate',
    visibility: 'artist_fan',
    band: toId(attendance.band),
    subjectFan: toId(attendance.fan),
    occurredAt: attendance.checkedInAt || null,
    createdByType: 'system',
    createdByUserId: null,
    sourceType: SHOW_SOURCE_TYPE,
    sourceId: String(attendanceId),
    idempotencyKey: showMomentIdempotencyKey(attendanceId),
    shareable: false,
    publishedAt: null,
    archivedAt: null,
    schemaVersion: SCHEMA_VERSION,
  };
}

function joinedAtFromFan(fan) {
  if (!fan) return null;
  const times = [fan.subscribedAt, fan.createdAt]
    .map((value) => {
      if (!value) return null;
      const ms = new Date(value).getTime();
      return Number.isFinite(ms) ? ms : null;
    })
    .filter((ms) => ms != null);
  if (!times.length) return null;
  return new Date(Math.min(...times)).toISOString();
}

function displayNameFromFan(fan) {
  if (!fan) return null;
  const first = String(fan.firstName || '').trim();
  const last = String(fan.lastName || '').trim();
  const combined = [first, last].filter(Boolean).join(' ').trim();
  return combined || first || null;
}

function emptyCommunicationFacts() {
  return {
    artistMessagesSent: 0,
    fanReplies: 0,
    lastArtistMessageAt: null,
    lastReplyAt: null,
  };
}

function communicationFactsFromEvents(rows) {
  const out = emptyCommunicationFacts();
  for (const row of rows || []) {
    const type = row?.type;
    const when = row?.occurredAt || null;
    if (type === 'artist_message_sent') {
      out.artistMessagesSent += 1;
      if (when && (!out.lastArtistMessageAt || new Date(when) > new Date(out.lastArtistMessageAt))) {
        out.lastArtistMessageAt = when;
      }
    }
    if (type === 'fan_replied') {
      out.fanReplies += 1;
      if (when && (!out.lastReplyAt || new Date(when) > new Date(out.lastReplyAt))) {
        out.lastReplyAt = when;
      }
    }
  }
  return out;
}

function maxTimestamp(values) {
  let best = null;
  for (const value of values || []) {
    if (!value) continue;
    const ms = new Date(value).getTime();
    if (!Number.isFinite(ms)) continue;
    if (!best || ms > new Date(best).getTime()) best = value instanceof Date ? value.toISOString() : String(value);
  }
  return best;
}

function sortMomentsChronologically(rows) {
  return [...(rows || [])].sort((a, b) => {
    const ta = new Date(a.occurredAt || 0).getTime();
    const tb = new Date(b.occurredAt || 0).getTime();
    if (ta !== tb) return ta - tb;
    return Number(a.id) - Number(b.id);
  });
}

function momentMatchesSuppressedAttendance(moment, attendance) {
  if (!moment || !attendance) return false;
  if (moment.sourceType !== SHOW_SOURCE_TYPE) return false;
  if (String(moment.sourceId) !== String(attendance.id)) return false;
  return attendance.suppressedDuplicate === true;
}

module.exports = {
  toId,
  relId,
  isUniqueViolation,
  isActiveMoment,
  canViewMoment,
  attendanceEligibleForShowMoment,
  showMomentDraftFromAttendance,
  joinedAtFromFan,
  displayNameFromFan,
  emptyCommunicationFacts,
  communicationFactsFromEvents,
  maxTimestamp,
  sortMomentsChronologically,
  momentMatchesSuppressedAttendance,
};
