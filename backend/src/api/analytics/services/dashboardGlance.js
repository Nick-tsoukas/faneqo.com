"use strict";

/**
 * Dashboard glance: three counts for the current window and the one before it.
 *
 * Deliberately count-only. The rollups/pulse services hydrate up to 100k rows
 * per collection, which is far too heavy for a strip that renders above the
 * fold on every dashboard load.
 */

const { DateTime } = require("luxon");

const UID_PAGE_VIEW = "api::band-page-view.band-page-view";
const UID_SCAN = "api::scan.scan";
const UID_FAN = "api::fan.fan";

const DEFAULT_DAYS = 7;
const MIN_DAYS = 1;
const MAX_DAYS = 90;

/**
 * Current window is the last `days` calendar days in UTC, inclusive of today.
 * Previous window is the equally sized block immediately before it, so the two
 * never overlap and never leave a gap.
 */
function resolveWindows(days, now = DateTime.utc()) {
  const requested = Number(days);
  const span = Number.isFinite(requested)
    ? Math.min(Math.max(Math.trunc(requested), MIN_DAYS), MAX_DAYS)
    : DEFAULT_DAYS;

  const currentFrom = now.minus({ days: span - 1 }).startOf("day");
  const currentTo = now.endOf("day");
  const previousFrom = currentFrom.minus({ days: span });
  const previousTo = currentFrom.minus({ milliseconds: 1 });

  return {
    days: span,
    current: { from: currentFrom.toISO(), to: currentTo.toISO() },
    previous: { from: previousFrom.toISO(), to: previousTo.toISO() },
  };
}

/**
 * Whole-percent change, or null when no honest comparison exists.
 *
 * Growth from zero is infinite, not "+100%", so it returns null and the strip
 * shows the bare number instead of an invented trend.
 */
function percentChange(current, previous) {
  const a = Number(current);
  const b = Number(previous);

  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  if (b <= 0) return null;

  return Math.round(((a - b) / b) * 100);
}

function buildMetric(current, previous) {
  const safeCurrent = Number.isFinite(Number(current)) ? Number(current) : 0;
  const safePrevious = Number.isFinite(Number(previous)) ? Number(previous) : 0;

  return {
    current: safeCurrent,
    previous: safePrevious,
    changePct: percentChange(safeCurrent, safePrevious),
  };
}

function pageViewFilters(bandId, window) {
  return {
    band: { id: bandId },
    timestamp: { $gte: window.from, $lte: window.to },
  };
}

/**
 * Scans reach a band two ways: a direct `band` relation, or only through their
 * QR. Both legs are many-to-one, so a single $or count cannot double count.
 */
function scanFilters(bandId, window) {
  return {
    date: { $gte: window.from, $lte: window.to },
    $or: [{ band: { id: bandId } }, { qr: { band: { id: bandId } } }],
  };
}

/**
 * Matches `fan.getMyFansAnalytics().newFans7d` so the strip and the Fan
 * Intelligence card never disagree about how many fans arrived.
 */
function newFanFilters(bandId, window) {
  return {
    band: { id: bandId },
    status: "subscribed",
    subscribedAt: { $gte: window.from, $lte: window.to },
  };
}

async function fetchDashboardGlance({ strapi, bandId, days, now } = {}) {
  const windows = resolveWindows(days, now);
  const id = Number(bandId);

  const count = (uid, filters) => strapi.entityService.count(uid, { filters });

  const [
    viewsCurrent,
    viewsPrevious,
    scansCurrent,
    scansPrevious,
    fansCurrent,
    fansPrevious,
  ] = await Promise.all([
    count(UID_PAGE_VIEW, pageViewFilters(id, windows.current)),
    count(UID_PAGE_VIEW, pageViewFilters(id, windows.previous)),
    count(UID_SCAN, scanFilters(id, windows.current)),
    count(UID_SCAN, scanFilters(id, windows.previous)),
    count(UID_FAN, newFanFilters(id, windows.current)),
    count(UID_FAN, newFanFilters(id, windows.previous)),
  ]);

  return {
    days: windows.days,
    window: windows.current,
    previousWindow: windows.previous,
    metrics: {
      views: buildMetric(viewsCurrent, viewsPrevious),
      qrScans: buildMetric(scansCurrent, scansPrevious),
      newFans: buildMetric(fansCurrent, fansPrevious),
    },
  };
}

module.exports = {
  DEFAULT_DAYS,
  MIN_DAYS,
  MAX_DAYS,
  resolveWindows,
  percentChange,
  buildMetric,
  pageViewFilters,
  scanFilters,
  newFanFilters,
  fetchDashboardGlance,
};
