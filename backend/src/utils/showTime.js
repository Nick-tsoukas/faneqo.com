'use strict';

/**
 * Timezone-aware helpers for Show Mode and check-in windows.
 *
 * Strapi stores event `date` as YYYY-MM-DD and `time` as HH:mm:ss.SSS, with no
 * timezone attached. Combining them with `new Date(date)` + `setHours(...)`
 * resolves against the server clock (UTC on Railway), which places an 8pm show
 * at 8pm UTC — 4pm Eastern. These helpers resolve the wall-clock values against
 * the venue/band timezone when we know it.
 *
 * Intl is used deliberately: no date library is available in this project.
 */

const DEFAULT_SHOW_TIME = { hour: 20, minute: 0 };

function isValidTimeZone(timeZone) {
  if (!timeZone || typeof timeZone !== 'string') return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone });
    return true;
  } catch (err) {
    return false;
  }
}

/** Wall-clock parts of an instant, as seen in `timeZone`. */
function getZonedParts(date, timeZone) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const parts = {};
  for (const { type, value } of formatter.formatToParts(date)) {
    if (type !== 'literal') parts[type] = Number(value);
  }

  // en-US with hour12:false reports midnight as hour 24.
  if (parts.hour === 24) parts.hour = 0;

  return parts;
}

/** Offset of `timeZone` from UTC at `date`, in milliseconds (east is positive). */
function getTimeZoneOffsetMs(date, timeZone) {
  const parts = getZonedParts(date, timeZone);
  const asIfUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  return asIfUtc - date.getTime();
}

/**
 * Instant at which the given wall-clock time occurs in `timeZone`.
 * Resolved twice so DST transitions settle on the correct offset.
 */
function zonedTimeToUtc({ year, month, day, hour = 0, minute = 0 }, timeZone) {
  const naiveUtc = Date.UTC(year, month - 1, day, hour, minute, 0);
  let timestamp = naiveUtc;

  for (let i = 0; i < 2; i++) {
    timestamp = naiveUtc - getTimeZoneOffsetMs(new Date(timestamp), timeZone);
  }

  return new Date(timestamp);
}

/** Parse a Strapi `time` value (HH:mm or HH:mm:ss.SSS) into hour/minute. */
function parseTimeParts(time) {
  if (!time || typeof time !== 'string') return { ...DEFAULT_SHOW_TIME };

  const [rawHour, rawMinute] = time.split(':');
  const hour = Number.parseInt(rawHour, 10);
  const minute = Number.parseInt(rawMinute, 10);

  if (!Number.isFinite(hour) || hour < 0 || hour > 23) return { ...DEFAULT_SHOW_TIME };

  return { hour, minute: Number.isFinite(minute) ? minute : 0 };
}

/** Parse a Strapi `date` value (YYYY-MM-DD, or a datetime we truncate). */
function parseDateParts(date) {
  if (!date) return null;

  const dateStr = date instanceof Date ? date.toISOString().slice(0, 10) : String(date).slice(0, 10);
  const [year, month, day] = dateStr.split('-').map((part) => Number.parseInt(part, 10));

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;

  return { year, month, day };
}

/**
 * Resolve an event's start instant from its `date` + `time` fields.
 * Falls back to the server clock when no usable timezone is known.
 * Returns null when the event has no parseable date.
 */
function resolveEventStart(event, timeZone) {
  const dateParts = parseDateParts(event?.date);
  if (!dateParts) return null;

  const { hour, minute } = parseTimeParts(event?.time);

  if (isValidTimeZone(timeZone)) {
    return zonedTimeToUtc({ ...dateParts, hour, minute }, timeZone);
  }

  const local = new Date(dateParts.year, dateParts.month - 1, dateParts.day, hour, minute, 0, 0);
  return Number.isNaN(local.getTime()) ? null : local;
}

/**
 * 06:00 on the calendar day after `from`, in `timeZone`.
 * Falls back to the server clock when no usable timezone is known.
 */
function getNextMorning6AM(timeZone, from = new Date()) {
  const base = from instanceof Date && !Number.isNaN(from.getTime()) ? from : new Date();

  if (isValidTimeZone(timeZone)) {
    const parts = getZonedParts(base, timeZone);
    // Advance the calendar day via UTC math so month/year roll over correctly.
    const nextDay = new Date(Date.UTC(parts.year, parts.month - 1, parts.day) + 24 * 60 * 60 * 1000);

    return zonedTimeToUtc(
      {
        year: nextDay.getUTCFullYear(),
        month: nextDay.getUTCMonth() + 1,
        day: nextDay.getUTCDate(),
        hour: 6,
        minute: 0,
      },
      timeZone
    );
  }

  const fallback = new Date(base);
  fallback.setDate(fallback.getDate() + 1);
  fallback.setHours(6, 0, 0, 0);
  return fallback;
}

/**
 * The next occurrence of 06:00 strictly after `from`, in `timeZone`.
 *
 * Distinct from getNextMorning6AM, which always advances a calendar day
 * because it bounds a session that opened the evening before. A 3 AM start
 * closes at 6 AM the same morning, not 27 hours later.
 */
function nextLocalSixAm(from = new Date(), timeZone = null) {
  const base = from instanceof Date && !Number.isNaN(from.getTime()) ? from : new Date();

  if (isValidTimeZone(timeZone)) {
    const parts = getZonedParts(base, timeZone);
    const sameDay = zonedTimeToUtc(
      { year: parts.year, month: parts.month, day: parts.day, hour: 6, minute: 0 },
      timeZone
    );
    if (sameDay.getTime() > base.getTime()) return sameDay;

    const nextDay = new Date(Date.UTC(parts.year, parts.month - 1, parts.day) + 24 * 60 * 60 * 1000);
    return zonedTimeToUtc(
      {
        year: nextDay.getUTCFullYear(),
        month: nextDay.getUTCMonth() + 1,
        day: nextDay.getUTCDate(),
        hour: 6,
        minute: 0,
      },
      timeZone
    );
  }

  const fallback = new Date(base);
  fallback.setHours(6, 0, 0, 0);
  if (fallback.getTime() <= base.getTime()) fallback.setDate(fallback.getDate() + 1);
  return fallback;
}

/**
 * US state/territory to IANA zone.
 *
 * Nine states straddle two zones. Each is mapped to its dominant zone rather
 * than left out, because the alternative fallback is the server clock: being an
 * hour off in El Paso or the Florida panhandle is far better than being six
 * hours off everywhere. Zones that share US rules are collapsed (Indianapolis,
 * Louisville and Detroit all follow America/New_York; Boise follows Denver).
 */
const US_ZONE_BY_STATE = {
  AL: 'America/Chicago',
  AK: 'America/Anchorage',
  AZ: 'America/Phoenix',
  AR: 'America/Chicago',
  CA: 'America/Los_Angeles',
  CO: 'America/Denver',
  CT: 'America/New_York',
  DE: 'America/New_York',
  DC: 'America/New_York',
  FL: 'America/New_York',
  GA: 'America/New_York',
  HI: 'Pacific/Honolulu',
  ID: 'America/Denver',
  IL: 'America/Chicago',
  IN: 'America/New_York',
  IA: 'America/Chicago',
  KS: 'America/Chicago',
  KY: 'America/New_York',
  LA: 'America/Chicago',
  ME: 'America/New_York',
  MD: 'America/New_York',
  MA: 'America/New_York',
  MI: 'America/New_York',
  MN: 'America/Chicago',
  MS: 'America/Chicago',
  MO: 'America/Chicago',
  MT: 'America/Denver',
  NE: 'America/Chicago',
  NV: 'America/Los_Angeles',
  NH: 'America/New_York',
  NJ: 'America/New_York',
  NM: 'America/Denver',
  NY: 'America/New_York',
  NC: 'America/New_York',
  ND: 'America/Chicago',
  OH: 'America/New_York',
  OK: 'America/Chicago',
  OR: 'America/Los_Angeles',
  PA: 'America/New_York',
  RI: 'America/New_York',
  SC: 'America/New_York',
  SD: 'America/Chicago',
  TN: 'America/Chicago',
  TX: 'America/Chicago',
  UT: 'America/Denver',
  VT: 'America/New_York',
  VA: 'America/New_York',
  WA: 'America/Los_Angeles',
  WV: 'America/New_York',
  WI: 'America/Chicago',
  WY: 'America/Denver',
  PR: 'America/Puerto_Rico',
};

const US_STATE_ABBREVIATION = {
  ALABAMA: 'AL',
  ALASKA: 'AK',
  ARIZONA: 'AZ',
  ARKANSAS: 'AR',
  CALIFORNIA: 'CA',
  COLORADO: 'CO',
  CONNECTICUT: 'CT',
  DELAWARE: 'DE',
  'DISTRICT OF COLUMBIA': 'DC',
  FLORIDA: 'FL',
  GEORGIA: 'GA',
  HAWAII: 'HI',
  IDAHO: 'ID',
  ILLINOIS: 'IL',
  INDIANA: 'IN',
  IOWA: 'IA',
  KANSAS: 'KS',
  KENTUCKY: 'KY',
  LOUISIANA: 'LA',
  MAINE: 'ME',
  MARYLAND: 'MD',
  MASSACHUSETTS: 'MA',
  MICHIGAN: 'MI',
  MINNESOTA: 'MN',
  MISSISSIPPI: 'MS',
  MISSOURI: 'MO',
  MONTANA: 'MT',
  NEBRASKA: 'NE',
  NEVADA: 'NV',
  'NEW HAMPSHIRE': 'NH',
  'NEW JERSEY': 'NJ',
  'NEW MEXICO': 'NM',
  'NEW YORK': 'NY',
  'NORTH CAROLINA': 'NC',
  'NORTH DAKOTA': 'ND',
  OHIO: 'OH',
  OKLAHOMA: 'OK',
  OREGON: 'OR',
  PENNSYLVANIA: 'PA',
  'RHODE ISLAND': 'RI',
  'SOUTH CAROLINA': 'SC',
  'SOUTH DAKOTA': 'SD',
  TENNESSEE: 'TN',
  TEXAS: 'TX',
  UTAH: 'UT',
  VERMONT: 'VT',
  VIRGINIA: 'VA',
  WASHINGTON: 'WA',
  'WEST VIRGINIA': 'WV',
  WISCONSIN: 'WI',
  WYOMING: 'WY',
  'PUERTO RICO': 'PR',
};

/** IANA zone for a US state name or abbreviation. Null when unrecognised. */
function timeZoneFromRegion(region) {
  if (!region || typeof region !== 'string') return null;

  const normalized = region.trim().toUpperCase().replace(/\./g, '').replace(/\s+/g, ' ');
  if (!normalized) return null;

  const code = US_ZONE_BY_STATE[normalized]
    ? normalized
    : US_STATE_ABBREVIATION[normalized] || null;

  return code ? US_ZONE_BY_STATE[code] || null : null;
}

/**
 * Best known timezone for a show, most venue-specific signal first.
 *
 * 1. The event's state — where the show physically is, even on tour.
 * 2. The band's stored showModeTimezone — captured from the browser the last
 *    time they ran show mode, so usually their home zone.
 *
 * Returns null when nothing is known, which leaves callers on the server clock.
 */
function resolveShowTimeZone({ event, band } = {}) {
  const fromVenue = timeZoneFromRegion(event?.state);
  if (fromVenue) return fromVenue;

  if (isValidTimeZone(band?.showModeTimezone)) return band.showModeTimezone;

  return null;
}

/** YYYY-MM-DD for a given instant, in `timeZone` when known (UTC otherwise). */
function toDateString(date, timeZone) {
  if (isValidTimeZone(timeZone)) {
    const parts = getZonedParts(date, timeZone);
    return `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
  }

  return date.toISOString().slice(0, 10);
}

/**
 * Performance vs session timing.
 *
 * PERFORMANCE: when the musical set is intended to start/end.
 * SESSION: when Show Mode capture is actually live (`showModeStartedAt` /
 * `showModeEndsAt`). next-local-6-AM is the absolute session ceiling.
 */
const DEFAULT_PERFORMANCE_DURATION_MS = 4 * 60 * 60 * 1000;
const MAX_PERFORMANCE_DURATION_MS = 24 * 60 * 60 * 1000;
const MAX_PERFORMANCE_START_PAST_MS = 24 * 60 * 60 * 1000;
const MAX_PERFORMANCE_START_FUTURE_MS = 24 * 60 * 60 * 1000;
const EXPIRED_SHOW_MODE_LIMIT = 100;

const DEACTIVATION_REASON = {
  MANUAL: 'manual',
  PERFORMANCE_END: 'performance_end',
  SAFETY_EXPIRY: 'safety_expiry',
  AUTO: 'auto',
};

const NAIVE_DATE_TIME = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?$/;
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const HAS_EXPLICIT_OFFSET = /(?:Z|[+-]\d{2}:?\d{2})$/i;

function resolveUsableTimeZone(...candidates) {
  for (const candidate of candidates) {
    if (isValidTimeZone(candidate)) return candidate;
  }
  return null;
}

function toIso(date) {
  if (!date) return null;
  const value = date instanceof Date ? date : new Date(date);
  return Number.isNaN(value.getTime()) ? null : value.toISOString();
}

function firstInstant(...values) {
  for (const value of values) {
    if (value == null || value === '') continue;
    const iso = toIso(value);
    if (iso) return iso;
  }
  return null;
}

/**
 * Parse a performance timestamp.
 * Instants with Z/offset are used as-is. Naive wall times are interpreted in
 * `timeZone` when valid, otherwise as UTC — never as the server's local zone.
 */
function parseTimestamp(value, timeZone = null) {
  if (value == null || value === '') return { value: null };

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return { error: 'invalid_timestamp', message: 'Performance time is not a valid timestamp' };
    }
    return { value };
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      return { error: 'invalid_timestamp', message: 'Performance time is not a valid timestamp' };
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return { error: 'invalid_timestamp', message: 'Performance time is not a valid timestamp' };
    }
    return { value: date };
  }

  if (typeof value !== 'string') {
    return { error: 'invalid_timestamp', message: 'Performance time is not a valid timestamp' };
  }

  const trimmed = value.trim();
  if (!trimmed) return { value: null };

  if (DATE_ONLY.test(trimmed)) {
    return {
      error: 'invalid_timestamp',
      message: 'Performance time must include a time, not only a date',
    };
  }

  const naive = trimmed.match(NAIVE_DATE_TIME);
  if (naive) {
    const year = Number(naive[1]);
    const month = Number(naive[2]);
    const day = Number(naive[3]);
    const hour = Number(naive[4]);
    const minute = Number(naive[5]);
    const second = Number(naive[6] || 0);

    if (
      !Number.isFinite(year) ||
      !Number.isFinite(month) ||
      !Number.isFinite(day) ||
      hour > 23 ||
      minute > 59 ||
      second > 59
    ) {
      return { error: 'invalid_timestamp', message: 'Performance time is not a valid timestamp' };
    }

    if (isValidTimeZone(timeZone)) {
      const instant = zonedTimeToUtc({ year, month, day, hour, minute }, timeZone);
      return { value: new Date(instant.getTime() + second * 1000) };
    }

    return { value: new Date(Date.UTC(year, month - 1, day, hour, minute, second)) };
  }

  if (!HAS_EXPLICIT_OFFSET.test(trimmed)) {
    return { error: 'invalid_timestamp', message: 'Performance time is not a valid timestamp' };
  }

  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) {
    return { error: 'invalid_timestamp', message: 'Performance time is not a valid timestamp' };
  }
  return { value: date };
}

function resolveSafetyCeiling(timeZone, from = new Date()) {
  return getNextMorning6AM(timeZone, from);
}

function deriveDefaultPerformanceEnd({ start, timeZone, mode = 'legacy_manual' } = {}) {
  const from = start instanceof Date && !Number.isNaN(start.getTime()) ? start : new Date();
  const ceiling = resolveSafetyCeiling(timeZone, from);

  if (mode === 'event') {
    const byDuration = new Date(from.getTime() + DEFAULT_PERFORMANCE_DURATION_MS);
    return byDuration.getTime() <= ceiling.getTime() ? byDuration : ceiling;
  }

  return ceiling;
}

function resolveEffectiveSessionEnd({ performanceEndsAt, safetyCeiling } = {}) {
  if (!safetyCeiling) return performanceEndsAt || null;
  if (!performanceEndsAt) return safetyCeiling;
  return performanceEndsAt.getTime() <= safetyCeiling.getTime() ? performanceEndsAt : safetyCeiling;
}

function resolveExpiryReason({ performanceEndsAt, safetyCeiling, now = new Date() } = {}) {
  const safety = safetyCeiling instanceof Date && !Number.isNaN(safetyCeiling.getTime())
    ? safetyCeiling
    : null;
  const performance = performanceEndsAt instanceof Date && !Number.isNaN(performanceEndsAt.getTime())
    ? performanceEndsAt
    : null;

  if (safety && now.getTime() >= safety.getTime()) {
    if (!performance || performance.getTime() >= safety.getTime()) {
      return DEACTIVATION_REASON.SAFETY_EXPIRY;
    }
  }

  if (performance && now.getTime() >= performance.getTime()) {
    return DEACTIVATION_REASON.PERFORMANCE_END;
  }

  return DEACTIVATION_REASON.AUTO;
}

function validatePerformanceWindow({ start, end, now = new Date() } = {}) {
  if (!(start instanceof Date) || Number.isNaN(start.getTime())) {
    return { error: 'invalid_timestamp', message: 'Performance start is not a valid timestamp' };
  }
  if (!(end instanceof Date) || Number.isNaN(end.getTime())) {
    return { error: 'invalid_timestamp', message: 'Performance end is not a valid timestamp' };
  }
  if (end.getTime() <= start.getTime()) {
    return { error: 'invalid_range', message: 'Performance end must be after start' };
  }

  const duration = end.getTime() - start.getTime();
  if (duration > MAX_PERFORMANCE_DURATION_MS) {
    return { error: 'range_too_long', message: 'Performance cannot last more than 24 hours' };
  }

  const pastSkew = now.getTime() - start.getTime();
  if (pastSkew > MAX_PERFORMANCE_START_PAST_MS) {
    return { error: 'start_too_far_past', message: 'Performance start cannot be more than 24 hours in the past' };
  }

  const futureSkew = start.getTime() - now.getTime();
  if (futureSkew > MAX_PERFORMANCE_START_FUTURE_MS) {
    return {
      error: 'scheduling_not_supported',
      message: 'Future Show Mode scheduling is not available yet. Start now, or choose a performance start within 24 hours.',
    };
  }

  return { ok: true };
}

/**
 * Resolve intended performance times and the effective session expiry.
 * `source: 'event'` uses a 4-hour default end when the Event has no end.
 * Legacy manual callers (no explicit end) keep next-local-6-AM.
 */
function resolveShowPerformanceTiming({
  now = new Date(),
  timezone,
  fallbackTimezone,
  performanceStartsAt,
  performanceEndsAt,
  eventStart = null,
  sessionFrom = null,
  source = 'manual',
} = {}) {
  const timeZone = resolveUsableTimeZone(timezone, fallbackTimezone);
  const parsedStart = parseTimestamp(performanceStartsAt, timeZone);
  if (parsedStart.error) return parsedStart;
  const parsedEnd = parseTimestamp(performanceEndsAt, timeZone);
  if (parsedEnd.error) return parsedEnd;

  const start = parsedStart.value || eventStart || now;
  const explicitStart = Boolean(parsedStart.value);
  const explicitEnd = Boolean(parsedEnd.value);
  const safetyFrom = sessionFrom || now;
  const safetyCeiling = resolveSafetyCeiling(timeZone, safetyFrom);

  let performanceEnd = parsedEnd.value
    || deriveDefaultPerformanceEnd({
      start: eventStart || start,
      timeZone,
      mode: source === 'event' && (eventStart || parsedStart.value) ? 'event' : 'legacy_manual',
    });

  // Derived Event ends that are already past must not instantly expire a
  // newly started capture session. Keep the Event start when usable.
  if (!explicitEnd && performanceEnd.getTime() <= now.getTime()) {
    performanceEnd = safetyCeiling;
  }

  if (explicitStart || explicitEnd) {
    const validation = validatePerformanceWindow({ start, end: performanceEnd, now });
    if (validation.error) return validation;
  } else if (performanceEnd.getTime() <= start.getTime()) {
    return { error: 'invalid_range', message: 'Performance end must be after start' };
  }

  const effectiveEndsAt = resolveEffectiveSessionEnd({
    performanceEndsAt: performanceEnd,
    safetyCeiling,
  });

  return {
    ok: true,
    timeZone,
    performanceStartsAt: start,
    performanceEndsAt: performanceEnd,
    effectiveEndsAt,
    safetyCeiling,
    usedExplicitEnd: explicitEnd,
    usedLegacyDefault: !explicitEnd && source !== 'event',
  };
}

/**
 * Recap timing resolution: fresh snapshot → stored recap → Event → legacy.
 * Never prefers null over a good value.
 */
function resolveRecapPerformanceTiming({ snapshot = {}, stored = {}, eventStart = null } = {}) {
  return {
    performanceStartsAt: firstInstant(
      snapshot.performanceStartsAt,
      stored.performanceStartsAt,
      eventStart,
      snapshot.showStartedAt,
      stored.showStartedAt
    ),
    performanceEndsAt: firstInstant(
      snapshot.performanceEndsAt,
      stored.performanceEndsAt,
      snapshot.showEndedAt,
      stored.showEndedAt
    ),
  };
}

function withReadTimePerformanceTiming(recap) {
  if (!recap || typeof recap !== 'object') return recap;
  return {
    ...recap,
    performanceStartsAt: recap.performanceStartsAt || recap.showStartedAt || null,
    performanceEndsAt: recap.performanceEndsAt || recap.showEndedAt || null,
  };
}

module.exports = {
  DEFAULT_SHOW_TIME,
  DEFAULT_PERFORMANCE_DURATION_MS,
  MAX_PERFORMANCE_DURATION_MS,
  MAX_PERFORMANCE_START_PAST_MS,
  MAX_PERFORMANCE_START_FUTURE_MS,
  EXPIRED_SHOW_MODE_LIMIT,
  DEACTIVATION_REASON,
  isValidTimeZone,
  resolveUsableTimeZone,
  getZonedParts,
  getTimeZoneOffsetMs,
  zonedTimeToUtc,
  parseTimeParts,
  parseDateParts,
  parseTimestamp,
  resolveEventStart,
  getNextMorning6AM,
  nextLocalSixAm,
  resolveSafetyCeiling,
  deriveDefaultPerformanceEnd,
  resolveEffectiveSessionEnd,
  resolveExpiryReason,
  validatePerformanceWindow,
  resolveShowPerformanceTiming,
  resolveRecapPerformanceTiming,
  withReadTimePerformanceTiming,
  firstInstant,
  toIso,
  timeZoneFromRegion,
  resolveShowTimeZone,
  toDateString,
};
