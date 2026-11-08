'use strict';

/**
 * Native Faneqo Follow — presentation of timestamps on the canonical Fan row.
 *
 * FOLLOW  = in-app artist relationship intent (these timestamps)
 * EMAIL   = Fan.status (subscribed | unsubscribed | removed)
 * ATTENDANCE = fan-show-attendance (separate)
 *
 * Following iff:
 *   followedAt != null AND (unfollowedAt == null OR unfollowedAt < followedAt)
 *
 * Follow-only creation uses status `unsubscribed` as V1 email-ineligible.
 * That is not an unsubscribe action and must not surface "you unsubscribed".
 * Follow never toggles status.
 * Unsubscribe-only never clears Follow.
 * End-relationship Unfollow also unsubscribes (separate patch).
 */

function toTime(value) {
  if (!value) return null;
  const t = new Date(value).getTime();
  return Number.isFinite(t) ? t : null;
}

function isFollowing(fan) {
  if (!fan) return false;
  const followedAt = toTime(fan.followedAt);
  if (followedAt == null) return false;
  const unfollowedAt = toTime(fan.unfollowedAt);
  return unfollowedAt == null || unfollowedAt < followedAt;
}

function followPatch(now = new Date()) {
  const followedAt = now instanceof Date ? now.toISOString() : String(now);
  return {
    followedAt,
    unfollowedAt: null,
  };
}

function unfollowPatch(now = new Date()) {
  const unfollowedAt = now instanceof Date ? now.toISOString() : String(now);
  return { unfollowedAt };
}

/** Follow timestamps + Fan List leave. Does not delete the Fan row. */
function endRelationshipPatch(now = new Date()) {
  const when = now instanceof Date ? now.toISOString() : String(now);
  return {
    ...unfollowPatch(when),
    status: 'unsubscribed',
    unsubscribedAt: when,
  };
}

function followReadModel(fan) {
  const followedAt = fan?.followedAt || null;
  return {
    isFollowing: isFollowing(fan),
    followedAt,
  };
}

module.exports = {
  isFollowing,
  followPatch,
  unfollowPatch,
  endRelationshipPatch,
  followReadModel,
};
