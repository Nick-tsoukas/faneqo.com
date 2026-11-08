'use strict';

/**
 * Canonical-workflow producers. Never throw into product requests.
 */

const { idempotencyKey } = require('./relationshipEventKeys');
const {
  recordRelationshipEventSafe,
  countUnsuppressedAttendance,
} = require('./relationshipEventService');

function bandIdOf(fanOrBand) {
  if (fanOrBand == null) return null;
  if (typeof fanOrBand === 'object') return fanOrBand.band?.id || fanOrBand.band || fanOrBand.id || null;
  return fanOrBand;
}

function fanIdOf(fan) {
  if (fan == null) return null;
  if (typeof fan === 'object') return fan.id || null;
  return fan;
}

async function produceFanJoined(strapi, fan) {
  const fanId = fanIdOf(fan);
  const bandId = fan?.band?.id || fan?.band || null;
  if (!fanId || !bandId) return null;
  return recordRelationshipEventSafe(strapi, {
    type: 'fan_joined',
    bandId,
    fanId,
    occurredAt: fan.subscribedAt || new Date().toISOString(),
    sourceType: 'fan',
    sourceId: String(fanId),
    idempotencyKey: idempotencyKey('fan_joined', fanId),
    metadata: {
      source: fan.source || undefined,
      captureSurface: fan.captureSurface || undefined,
    },
  });
}

async function produceFanUnsubscribed(strapi, fan, { occurredAt, reason } = {}) {
  const fanId = fanIdOf(fan);
  const bandId = fan?.band?.id || fan?.band || null;
  if (!fanId || !bandId) return null;
  const when = occurredAt || fan.unsubscribedAt || new Date().toISOString();
  return recordRelationshipEventSafe(strapi, {
    type: 'fan_unsubscribed',
    bandId,
    fanId,
    occurredAt: when,
    sourceType: 'fan',
    sourceId: String(fanId),
    idempotencyKey: idempotencyKey('fan_unsubscribed', fanId, when),
    metadata: reason ? { reason } : null,
  });
}

async function produceShowAttendance(strapi, attendance) {
  const attendanceId = attendance?.id;
  const fanId = attendance?.fan?.id || attendance?.fan;
  const bandId = attendance?.band?.id || attendance?.band;
  if (!attendanceId || !fanId || !bandId) return null;

  const checkedIn = await recordRelationshipEventSafe(strapi, {
    type: 'show_checked_in',
    bandId,
    fanId,
    occurredAt: attendance.checkedInAt || new Date().toISOString(),
    sourceType: 'fan_show_attendance',
    sourceId: String(attendanceId),
    idempotencyKey: idempotencyKey('show_checked_in', attendanceId),
    metadata: {
      campaignId: attendance.campaignId || undefined,
      eventId: attendance.event?.id || attendance.event || undefined,
      city: attendance.city || undefined,
      venue: attendance.venue || undefined,
    },
  });

  let showCount = null;
  try {
    showCount = await countUnsuppressedAttendance(strapi, { fanId, bandId });
  } catch (err) {
    strapi.log?.warn?.(`[RelationshipEvent] attendance count failed: ${err.message}`);
  }

  let returned = null;
  if (showCount != null && showCount >= 2) {
    returned = await recordRelationshipEventSafe(strapi, {
      type: 'show_returned',
      bandId,
      fanId,
      occurredAt: attendance.checkedInAt || new Date().toISOString(),
      sourceType: 'fan_show_attendance',
      sourceId: String(attendanceId),
      idempotencyKey: idempotencyKey('show_returned', attendanceId),
      metadata: { showCount },
    });
  }

  let showMoment = null;
  try {
    const { ensureShowMomentForAttendanceSafe } = require('../moments/showMomentProducer');
    showMoment = await ensureShowMomentForAttendanceSafe(strapi, attendance);
  } catch (err) {
    strapi.log?.warn?.(`[Moment] show moment after attendance skipped: ${err.message}`);
  }

  let milestones = null;
  try {
    const { reconcileFanArtistMilestonesSafe } = require('../milestones/milestoneReconcile');
    milestones = await reconcileFanArtistMilestonesSafe(strapi, { bandId, fanId });
  } catch (err) {
    strapi.log?.warn?.(`[Milestone] reconcile after attendance skipped: ${err.message}`);
  }

  return { checkedIn, returned, showCount, showMoment, milestones };
}

async function produceMessageEvent(strapi, { senderSide, messageId, conversationId, bandId, fanId, occurredAt }) {
  if (!messageId || !bandId || !fanId) return null;
  const type = senderSide === 'fan' ? 'fan_replied' : 'artist_message_sent';
  const event = await recordRelationshipEventSafe(strapi, {
    type,
    bandId,
    fanId,
    occurredAt: occurredAt || new Date().toISOString(),
    sourceType: 'conversation_message',
    sourceId: String(messageId),
    idempotencyKey: idempotencyKey(type, messageId),
    metadata: {
      conversationId,
    },
  });

  if (type === 'fan_replied') {
    try {
      const { reconcileFanArtistMilestonesSafe } = require('../milestones/milestoneReconcile');
      await reconcileFanArtistMilestonesSafe(strapi, { bandId, fanId });
    } catch (err) {
      strapi.log?.warn?.(`[Milestone] reconcile after reply skipped: ${err.message}`);
    }
  }

  return event;
}

async function producePassportClaimed(strapi, { fanId, bandId, accountUserId, occurredAt }) {
  if (!fanId || !bandId || !accountUserId) return null;
  return recordRelationshipEventSafe(strapi, {
    type: 'passport_claimed',
    bandId,
    fanId,
    occurredAt: occurredAt || new Date().toISOString(),
    sourceType: 'fan',
    sourceId: String(fanId),
    visibility: 'fan_only',
    idempotencyKey: idempotencyKey('passport_claimed', fanId, accountUserId),
    metadata: { accountUserId },
  });
}

async function produceArtistUpdatePublished(strapi, update) {
  const updateId = update?.id;
  const bandId = update?.band?.id || update?.band;
  if (!updateId || !bandId) return null;
  const occurredAt = update.publishedAt || new Date().toISOString();
  const eventId = update.event?.id || update.event || null;
  const campaignId = update.showRecap?.campaignId || update.showCampaignId || null;
  const visibility = update.visibility;

  const published = await recordRelationshipEventSafe(strapi, {
    type: 'artist_update_published',
    bandId,
    fanId: null,
    occurredAt,
    sourceType: 'artist_update',
    sourceId: String(updateId),
    visibility: 'derived_from_source',
    idempotencyKey: idempotencyKey('artist_update_published', updateId),
    metadata: {
      visibility,
      eventId: eventId || undefined,
      campaignId: campaignId || undefined,
      contentKind: update.contentKind || undefined,
    },
  });

  let gallery = null;
  const hasShowContext = !!(eventId || campaignId || update.showRecap?.id || update.showRecapId);
  if (hasShowContext) {
    gallery = await recordRelationshipEventSafe(strapi, {
      type: 'show_gallery_added',
      bandId,
      fanId: null,
      occurredAt,
      sourceType: 'artist_update',
      sourceId: String(updateId),
      visibility: 'derived_from_source',
      idempotencyKey: idempotencyKey('show_gallery_added', updateId),
      metadata: {
        visibility,
        eventId: eventId || undefined,
        campaignId: campaignId || undefined,
      },
    });
  }

  return { published, gallery };
}

module.exports = {
  produceFanJoined,
  produceFanUnsubscribed,
  produceShowAttendance,
  produceMessageEvent,
  producePassportClaimed,
  produceArtistUpdatePublished,
  bandIdOf,
  fanIdOf,
};
