'use strict';

/**
 * Scalar integrity keys for canonical fan + attendance uniqueness.
 *
 * These are NOT product IDs, analytics dimensions, Passport fields,
 * RelationshipEvent metadata, or public API values. They exist so Postgres
 * (and SQLite) can enforce uniqueness without depending on Strapi join-table
 * layout for band/fan/event relations.
 *
 * Hashes are built in Node (SHA-256 hex) so SQLite, Postgres, and tests match.
 * Do not use pgcrypto / database hashing extensions.
 *
 * Mutability (Phase 05A.1 inspect):
 * - Fan email and band are not legitimately changed after create.
 *   Updates touch status, lastSeenAt, accountUser, visitor, names, source,
 *   checkedInShowCount — not identity. Claim links accountUser only.
 * - Attendance fan, campaignId, and event are create-only (no entityService.update).
 * If those identity dimensions ever change, recompute the matching key in the
 * same write. Do not leave a stale key.
 */

const crypto = require('crypto');

function normalizeFanEmail(email) {
  const { normalizeEmail } = require('../fans/fanEmail');
  return normalizeEmail(email);
}

const FAN_KEY_VERSION = 'v1';
const CAMPAIGN_ATTENDANCE_KEY_VERSION = 'v1';
const EVENT_ATTENDANCE_KEY_VERSION = 'v1';

function sha256Hex(input) {
  return crypto.createHash('sha256').update(String(input), 'utf8').digest('hex');
}

function stableId(value) {
  if (value == null || value === '') return null;
  if (typeof value === 'object') {
    const nested = value.id;
    if (nested == null || nested === '') return null;
    return String(nested);
  }
  const text = String(value).trim();
  return text || null;
}

function fanIdentityInput({ bandId, email }) {
  const band = stableId(bandId);
  const normalized = normalizeFanEmail(email);
  if (!band || !normalized) return null;
  return `fan:${FAN_KEY_VERSION}:${band}:${normalized}`;
}

function campaignAttendanceIdentityInput({ fanId, campaignId }) {
  const fan = stableId(fanId);
  const campaign = stableId(campaignId);
  if (!fan || !campaign) return null;
  return `attendance:campaign:${CAMPAIGN_ATTENDANCE_KEY_VERSION}:${fan}:${campaign}`;
}

function eventAttendanceIdentityInput({ fanId, eventId }) {
  const fan = stableId(fanId);
  const event = stableId(eventId);
  if (!fan || !event) return null;
  return `attendance:event:${EVENT_ATTENDANCE_KEY_VERSION}:${fan}:${event}`;
}

function buildFanCanonicalIdentityKey({ bandId, email } = {}) {
  const input = fanIdentityInput({ bandId, email });
  return input ? sha256Hex(input) : null;
}

function buildCampaignAttendanceIdentityKey({ fanId, campaignId } = {}) {
  const input = campaignAttendanceIdentityInput({ fanId, campaignId });
  return input ? sha256Hex(input) : null;
}

function buildEventAttendanceIdentityKey({ fanId, eventId } = {}) {
  const input = eventAttendanceIdentityInput({ fanId, eventId });
  return input ? sha256Hex(input) : null;
}

function attendanceIdentityKeys({ fanId, campaignId, eventId, suppressedDuplicate } = {}) {
  if (suppressedDuplicate === true) {
    return { campaignIdentityKey: null, eventIdentityKey: null };
  }
  return {
    campaignIdentityKey: buildCampaignAttendanceIdentityKey({ fanId, campaignId }),
    eventIdentityKey: buildEventAttendanceIdentityKey({ fanId, eventId }),
  };
}

module.exports = {
  FAN_KEY_VERSION,
  CAMPAIGN_ATTENDANCE_KEY_VERSION,
  EVENT_ATTENDANCE_KEY_VERSION,
  sha256Hex,
  normalizeFanEmail,
  fanIdentityInput,
  campaignAttendanceIdentityInput,
  eventAttendanceIdentityInput,
  buildFanCanonicalIdentityKey,
  buildCampaignAttendanceIdentityKey,
  buildEventAttendanceIdentityKey,
  attendanceIdentityKeys,
};
