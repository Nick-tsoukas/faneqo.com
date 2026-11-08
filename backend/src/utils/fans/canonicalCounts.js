'use strict';

/**
 * Locked count contracts.
 *
 * Fan list (analytics `getMyFansAnalytics`):
 *   status = 'subscribed'
 *
 * Distinct from:
 *   unsubscribed  — opted out, still a row
 *   removed       — artist removed from list (rejoin can restore)
 *   suppressed    — suppressionReason set (bounce/complaint/manual); often still subscribed
 *
 * Canonical show count (the only product truth):
 *   COUNT(fan_show_attendances WHERE fan = ? AND suppressedDuplicate IS NOT TRUE)
 *   One attendance row = one show even if the row has both campaign and event.
 *
 * firstShowAt  = min(checkedInAt) of those rows
 * latestShowAt = max(checkedInAt)
 * returning    = showCount >= 2
 *
 * fans.checkedInShowCount is a write-side cache. Artist-facing displays overlay
 * the canonical summary. Do not treat the column as independent truth.
 *
 * Use getCanonicalFanShowSummary / getCanonicalFanShowSummaries.
 */

const FAN_STATUS = {
  subscribed: 'subscribed',
  unsubscribed: 'unsubscribed',
  removed: 'removed',
};

function isSubscribedFan(fan) {
  return fan?.status === FAN_STATUS.subscribed;
}

function fanCountBucket(fan) {
  if (!fan) return 'unknown';
  if (fan.status === FAN_STATUS.removed) return 'removed';
  if (fan.status === FAN_STATUS.unsubscribed) return 'unsubscribed';
  if (fan.suppressionReason) return 'suppressed';
  if (fan.status === FAN_STATUS.subscribed) return 'subscribed';
  return 'unknown';
}

module.exports = {
  FAN_STATUS,
  isSubscribedFan,
  fanCountBucket,
};
