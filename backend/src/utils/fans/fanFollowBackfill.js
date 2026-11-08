'use strict';

/**
 * Conservative historical Follow backfill planner.
 *
 * Provenance accepted:
 *   fan-interaction.interactionType === 'joined_fan_list'
 *   (created only by POST /api/fans/subscribe — explicit Join / old follow-modal email)
 *
 * Provenance rejected:
 *   relationship-event fan_joined (also emitted by check-in / message / import)
 *   Fan.status === subscribed alone
 *   attendance / check-in / import / messaging
 *
 * Default is plan-only. Apply is idempotent: skip rows that already have followedAt.
 */

const { isFollowing } = require('./fanFollow');

function toTime(value) {
  if (!value) return null;
  const t = new Date(value).getTime();
  return Number.isFinite(t) ? t : null;
}

function planExplicitJoinFollowBackfill({ fans = [], joinEvents = [] } = {}) {
  const earliestByFan = new Map();
  for (const event of joinEvents) {
    if (event?.interactionType && event.interactionType !== 'joined_fan_list') continue;
    const fanId = event.fanId || event.fan;
    const ts = toTime(event.timestamp || event.occurredAt);
    if (!fanId || ts == null) continue;
    const prev = earliestByFan.get(String(fanId));
    if (prev == null || ts < prev) earliestByFan.set(String(fanId), ts);
  }

  const updates = [];
  const skipped = {
    alreadyFollowing: 0,
    alreadyHasFollowedAt: 0,
    noProvenJoin: 0,
  };

  for (const fan of fans) {
    if (!fan?.id) continue;
    if (fan.followedAt) {
      skipped.alreadyHasFollowedAt += 1;
      if (isFollowing(fan)) skipped.alreadyFollowing += 1;
      continue;
    }
    const earliest = earliestByFan.get(String(fan.id));
    if (earliest == null) {
      skipped.noProvenJoin += 1;
      continue;
    }
    updates.push({
      fanId: fan.id,
      followedAt: new Date(earliest).toISOString(),
      provenance: 'joined_fan_list',
    });
  }

  return {
    updates,
    skipped,
    scanned: fans.length,
    joinEvents: joinEvents.length,
  };
}

module.exports = {
  planExplicitJoinFollowBackfill,
};
