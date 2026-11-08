'use strict';

/**
 * Generic campaign audience resolver.
 *
 * Controllers/senders must NOT embed Show Mode attendance queries.
 * All audience types resolve through this module with an explicit bandId.
 */

const showMessage = require('../../api/show-recap/services/show-message');

const AUDIENCE_TYPES = Object.freeze({
  SHOW_ATTENDEES: 'show_attendees',
  ALL_FANS: 'all_fans',
});

const CAMPAIGN_CHANNELS = Object.freeze({
  EMAIL: 'email',
  IN_APP: 'in_app',
});

const MAX_AUDIENCE = 10000;

function isValidEmail(email) {
  const value = String(email || '').trim();
  if (!value || value.length > 254) return false;
  // Practical guard — not a full RFC parser.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/**
 * Fans who checked in to a specific Show Mode campaign for this band.
 * Reuses existing attendance eligibility (dedupe, unsubscribed, suppressedDuplicate).
 */
async function resolveShowAttendees({
  bandId,
  audienceReference,
  channel = CAMPAIGN_CHANNELS.EMAIL,
  excludeAccountUserId = null,
}) {
  const campaignId = String(audienceReference || '').trim();
  if (!bandId || !campaignId) {
    return { fans: [], error: 'missing_reference', message: 'Show campaign id is required.' };
  }

  const fans = await showMessage.getRecipients({
    bandId,
    campaignId,
    channel,
    excludeAccountUserId,
  });
  return { fans, error: null, message: null };
}

/**
 * All eligible Fan List members for this band (email channel).
 * Band scoping is enforced in the query — never trust client-supplied fan IDs.
 */
async function resolveAllFans({ bandId, channel = CAMPAIGN_CHANNELS.EMAIL, excludeAccountUserId = null }) {
  if (!bandId) {
    return { fans: [], error: 'missing_band', message: 'Band is required.' };
  }

  const isInbox = channel === CAMPAIGN_CHANNELS.IN_APP;
  const rows = await strapi.entityService.findMany('api::fan.fan', {
    filters: {
      band: bandId,
      ...(isInbox ? { status: { $ne: 'removed' } } : { status: 'subscribed' }),
    },
    fields: [
      'id',
      'email',
      'firstName',
      'status',
      'unsubscribeToken',
      'lastMessagedAt',
      'lastInboxBroadcastAt',
      'demo',
      'suppressionReason',
    ],
    populate: isInbox ? { accountUser: { fields: ['id'] } } : undefined,
    limit: MAX_AUDIENCE,
  });

  const recipients = new Map();

  for (const fan of rows || []) {
    if (!fan?.id) continue;
    if (fan.demo === true) continue;
    if (fan.status === 'removed') continue;

    if (isInbox) {
      const accountUserId = fan.accountUser?.id || fan.accountUser;
      if (!accountUserId || Number(accountUserId) === Number(excludeAccountUserId)) continue;
      if (recipients.has(String(accountUserId))) continue;
      recipients.set(String(accountUserId), { ...fan, accountUser: accountUserId });
      continue;
    }

    if (!fan.email || fan.status === 'unsubscribed') continue;
    if (fan.suppressionReason === 'bounced' || fan.suppressionReason === 'complained') continue;
    if (!isValidEmail(fan.email)) continue;
    if (recipients.has(String(fan.id))) continue;
    recipients.set(String(fan.id), fan);
  }

  return { fans: Array.from(recipients.values()), error: null, message: null };
}

/**
 * @param {object} args
 * @param {number|string} args.bandId — required; security boundary
 * @param {string} args.audienceType
 * @param {string|null} [args.audienceReference] — e.g. Show Mode campaignId
 * @param {object|null} [args.audienceConfig]
 */
async function resolveCampaignAudience({
  bandId,
  audienceType,
  audienceReference = null,
  audienceConfig = null,
  channel = CAMPAIGN_CHANNELS.EMAIL,
  excludeAccountUserId = null,
}) {
  void audienceConfig;

  const type = String(audienceType || '').trim();
  const deliveryChannel = String(channel || CAMPAIGN_CHANNELS.EMAIL).trim();

  if (!bandId) {
    return {
      fans: [],
      sendable: [],
      cooling: [],
      error: 'missing_band',
      message: 'Band is required.',
    };
  }

  let resolved;

  if (type === AUDIENCE_TYPES.SHOW_ATTENDEES) {
    resolved = await resolveShowAttendees({
      bandId,
      audienceReference,
      channel: deliveryChannel,
      excludeAccountUserId,
    });
  } else if (type === AUDIENCE_TYPES.ALL_FANS) {
    resolved = await resolveAllFans({
      bandId,
      channel: deliveryChannel,
      excludeAccountUserId,
    });
  } else {
    return {
      fans: [],
      sendable: [],
      cooling: [],
      error: 'unsupported_audience',
      message: `Unsupported audience type: ${type}`,
    };
  }

  if (resolved.error) {
    return {
      fans: [],
      sendable: [],
      cooling: [],
      error: resolved.error,
      message: resolved.message,
    };
  }

  const fans = deliveryChannel === CAMPAIGN_CHANNELS.IN_APP && excludeAccountUserId
    ? resolved.fans.filter((fan) => {
        const accountUserId = fan.accountUser?.id || fan.accountUser;
        return Number(accountUserId) !== Number(excludeAccountUserId);
      })
    : resolved.fans;

  const { sendable, cooling } = showMessage.partitionRecipients(fans, {
    bandId,
    channel: deliveryChannel,
  });

  return {
    fans,
    sendable,
    cooling,
    error: null,
    message: null,
  };
}

module.exports = {
  AUDIENCE_TYPES,
  CAMPAIGN_CHANNELS,
  MAX_AUDIENCE,
  resolveCampaignAudience,
  resolveShowAttendees,
  resolveAllFans,
  isValidEmail,
};
