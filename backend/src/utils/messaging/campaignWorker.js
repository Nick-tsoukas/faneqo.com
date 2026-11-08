'use strict';

/**
 * Durable background delivery for message campaigns.
 *
 * Source of truth = message-recipient rows.
 * Restart-safe: only processes status=pending; never re-sends sent/delivered.
 * Cron overlap guarded by workerLockToken + stale lock reclaim.
 */

const crypto = require('crypto');
const showMessage = require('../../api/show-recap/services/show-message');
const resendProvider = require('./providers/resend');
const {
  siteUrl,
  buildUnsubscribeHeaders,
  buildShowMessageEmail,
  buildFanListEmail,
} = require('./emailContent');
const { AUDIENCE_TYPES, CAMPAIGN_CHANNELS, isValidEmail } = require('./audienceResolver');
const {
  createInboxServiceFromStrapi,
  requireArtistInboxAccess,
} = require('../inbox/directMessaging');

const BATCH_SIZE = 5;
const STALE_LOCK_MS = 2 * 60 * 1000;
const MAX_CAMPAIGNS_PER_TICK = 3;

function isTerminalCampaignStatus(status) {
  return ['completed', 'partially_failed', 'failed', 'canceled'].includes(status);
}

/**
 * Re-check critical email suppressions immediately before delivery.
 */
async function recheckSuppression(fanId) {
  if (!fanId) {
    return { suppress: true, reason: 'missing_fan' };
  }

  const fan = await strapi.entityService.findOne('api::fan.fan', fanId, {
    fields: ['id', 'email', 'status', 'suppressionReason', 'unsubscribeToken', 'firstName', 'lastMessagedAt'],
  });

  if (!fan) return { suppress: true, reason: 'fan_missing', fan: null };

  // Email announcements off — do not treat as permanent ban on future inbox channel.
  if (fan.status === 'unsubscribed') {
    return { suppress: true, reason: 'unsubscribed', fan };
  }
  if (fan.suppressionReason === 'bounced' || fan.suppressionReason === 'complained') {
    return { suppress: true, reason: fan.suppressionReason, fan };
  }
  if (!isValidEmail(fan.email)) {
    return { suppress: true, reason: 'invalid_email', fan };
  }

  return { suppress: false, reason: null, fan };
}

/**
 * Re-check in-app eligibility immediately before delivery. Email opt-out and
 * email deliverability do not disable a private Faneqo inbox conversation.
 */
async function recheckInboxEligibility(fanId, artistUserId) {
  if (!fanId) return { suppress: true, reason: 'missing_fan' };

  const fan = await strapi.entityService.findOne('api::fan.fan', fanId, {
    fields: ['id', 'status'],
    populate: { accountUser: { fields: ['id'] } },
  });
  if (!fan) return { suppress: true, reason: 'fan_missing', fan: null };
  if (fan.status === 'removed') return { suppress: true, reason: 'fan_removed', fan };

  const accountUserId = fan.accountUser?.id || fan.accountUser;
  if (!accountUserId) return { suppress: true, reason: 'not_on_faneqo', fan };
  if (Number(accountUserId) === Number(artistUserId)) {
    return { suppress: true, reason: 'self_message', fan };
  }

  return { suppress: false, reason: null, fan };
}

/**
 * After a crash, recipients can be left in `sending` with no worker holding them.
 * Reset those rows to `pending` so the campaign can finish.
 * Resend idempotency keys prevent duplicate delivery if the provider already accepted.
 */
async function reclaimStuckSendingRecipients(campaignId) {
  const stuck = await strapi.entityService.findMany('api::message-recipient.message-recipient', {
    filters: { campaign: campaignId, status: 'sending' },
    fields: ['id'],
    limit: 10000,
  });

  let reclaimed = 0;
  for (const row of stuck || []) {
    const updated = await strapi.db.query('api::message-recipient.message-recipient').update({
      where: { id: row.id, status: 'sending' },
      data: { status: 'pending' },
    });
    if (updated) reclaimed += 1;
  }

  if (reclaimed > 0) {
    strapi.log.warn('[MessageCampaignWorker] Reclaimed stuck sending recipients', {
      campaignId,
      reclaimed,
    });
  }

  return reclaimed;
}

async function claimCampaign(campaign) {
  const token = crypto.randomBytes(16).toString('hex');
  const now = new Date().toISOString();
  const lockAt = campaign.workerLockAt ? new Date(campaign.workerLockAt).getTime() : 0;
  const lockStale = !lockAt || Date.now() - lockAt > STALE_LOCK_MS;

  if (campaign.status === 'sending' && campaign.workerLockToken && !lockStale) {
    return null;
  }

  const updated = await strapi.entityService.update(
    'api::message-campaign.message-campaign',
    campaign.id,
    {
      data: {
        status: 'sending',
        startedAt: campaign.startedAt || now,
        workerLockAt: now,
        workerLockToken: token,
      },
    }
  );

  // Best-effort verify we own the lock
  if (updated.workerLockToken !== token) return null;

  // Only reclaim stuck rows when taking over a previously-sending campaign
  // (restart / stale lock). Fresh queued campaigns have no sending rows.
  if (campaign.status === 'sending' || lockStale) {
    await reclaimStuckSendingRecipients(campaign.id);
  }

  return updated;
}

async function refreshLock(campaignId, token) {
  const current = await strapi.entityService.findOne(
    'api::message-campaign.message-campaign',
    campaignId,
    { fields: ['id', 'workerLockToken', 'status'] }
  );
  if (!current || current.workerLockToken !== token) return false;
  if (isTerminalCampaignStatus(current.status)) return false;

  await strapi.entityService.update('api::message-campaign.message-campaign', campaignId, {
    data: { workerLockAt: new Date().toISOString() },
  });
  return true;
}

async function markRecipient(recipientId, data) {
  return strapi.entityService.update('api::message-recipient.message-recipient', recipientId, {
    data,
  });
}

async function rebuildCampaignCounters(campaignId) {
  const rows = await strapi.entityService.findMany('api::message-recipient.message-recipient', {
    filters: { campaign: campaignId },
    fields: ['id', 'status'],
    limit: 10000,
  });

  const counts = {
    sentCount: 0,
    deliveredCount: 0,
    failedCount: 0,
    suppressedCount: 0,
    bouncedCount: 0,
  };

  let pending = 0;

  for (const row of rows || []) {
    switch (row.status) {
      case 'sent':
        counts.sentCount += 1;
        break;
      case 'delivered':
        counts.sentCount += 1;
        counts.deliveredCount += 1;
        break;
      case 'failed':
        counts.failedCount += 1;
        break;
      case 'suppressed':
        counts.suppressedCount += 1;
        break;
      case 'bounced':
        counts.bouncedCount += 1;
        break;
      case 'pending':
      case 'sending':
        pending += 1;
        break;
      default:
        break;
    }
  }

  return { counts, pending, total: (rows || []).length };
}

async function finalizeCampaign(campaign, lockToken) {
  const current = await strapi.entityService.findOne(
    'api::message-campaign.message-campaign',
    campaign.id,
    {
      fields: ['id', 'workerLockToken', 'skippedCount'],
      populate: { showRecap: { fields: ['id', 'messagesSentCount'] } },
    }
  );
  if (!current || current.workerLockToken !== lockToken) return;

  const { counts, pending } = await rebuildCampaignCounters(campaign.id);
  if (pending > 0) return;

  let status = 'completed';
  if (counts.sentCount === 0 && counts.deliveredCount === 0) {
    status = 'failed';
  } else if (counts.failedCount > 0 || counts.bouncedCount > 0) {
    status = 'partially_failed';
  }

  const now = new Date().toISOString();
  await strapi.entityService.update('api::message-campaign.message-campaign', campaign.id, {
    data: {
      ...counts,
      status,
      completedAt: now,
      workerLockAt: null,
      workerLockToken: null,
    },
  });

  // Keep show-recap messaging counters in sync for Message the Room UI.
  const showRecapId = current.showRecap?.id || current.showRecap;
  if (showRecapId && counts.sentCount + counts.deliveredCount > 0) {
    const priorCount = current.showRecap?.messagesSentCount || 0;
    await strapi.entityService.update('api::show-recap.show-recap', showRecapId, {
      data: {
        messagesSentCount: priorCount + 1,
        lastMessageSentAt: now,
        lastMessageRecipientCount: counts.sentCount + counts.deliveredCount,
      },
    });
  }

  strapi.log.info('[MessageCampaignWorker] Campaign finished', {
    campaignId: campaign.id,
    status,
    ...counts,
  });
}

async function deliverRecipient({ campaign, band, recipient, lockToken, inboxService = null }) {
  // Claim row so overlapping workers don't double-send.
  const claimed = await strapi.db.query('api::message-recipient.message-recipient').update({
    where: { id: recipient.id, status: 'pending' },
    data: {
      status: 'sending',
      attemptCount: (recipient.attemptCount || 0) + 1,
    },
  });

  if (!claimed) return; // already claimed / terminal

  const fanId = recipient.fan?.id || recipient.fan;

  if (campaign.channel === CAMPAIGN_CHANNELS.IN_APP) {
    const artistUserId = campaign.createdByUser?.id || campaign.createdByUser;
    const check = await recheckInboxEligibility(fanId, artistUserId);
    if (check.suppress) {
      await markRecipient(recipient.id, {
        status: 'suppressed',
        suppressedAt: new Date().toISOString(),
        failureReason: check.reason,
        failureCode: check.reason,
      });
      return;
    }

    const inbox = inboxService || createInboxServiceFromStrapi(strapi);
    const result = await inbox.sendCampaignMessage({
      authorizedArtistUserId: artistUserId,
      bandId: band.id,
      fanId,
      campaignId: campaign.id,
      bodyText: campaign.bodyText,
      artistUpdateId: campaign.artistUpdate?.id || campaign.artistUpdate || null,
    });

    if (!result.ok) {
      const relationshipBlock = ['fan_not_available', 'conversation_not_available', 'gallery_not_available'].includes(result.error);
      await markRecipient(recipient.id, {
        status: relationshipBlock ? 'suppressed' : 'failed',
        ...(relationshipBlock
          ? { suppressedAt: new Date().toISOString() }
          : { failedAt: new Date().toISOString() }),
        failureReason: result.error || 'inbox_send_failed',
        failureCode: result.error || 'inbox_send_failed',
      });
      return;
    }

    await markRecipient(recipient.id, {
      status: 'sent',
      sentAt: new Date().toISOString(),
      providerMessageId: result.message?.id ? String(result.message.id) : null,
      failureReason: null,
      failureCode: null,
    });
    await strapi.entityService.update('api::fan.fan', fanId, {
      data: { lastInboxBroadcastAt: new Date().toISOString() },
    });
    return;
  }

  const check = await recheckSuppression(fanId);

  if (check.suppress) {
    await markRecipient(recipient.id, {
      status: 'suppressed',
      suppressedAt: new Date().toISOString(),
      failureReason: check.reason,
      failureCode: check.reason,
    });
    return;
  }

  const fan = check.fan;
  const fanService = strapi.service('api::fan.fan');
  const token = await fanService.ensureUnsubscribeToken(fan);
  if (!token) {
    await markRecipient(recipient.id, {
      status: 'failed',
      failedAt: new Date().toISOString(),
      failureReason: 'unsubscribe_token_failed',
      failureCode: 'unsubscribe_token_failed',
    });
    return;
  }

  const unsubscribeUrl = `${siteUrl()}/unsubscribe?token=${encodeURIComponent(token)}`;
  const bandName = band.name || 'The band';
  const from = showMessage.buildFromHeader(band.name);

  let email;
  if (campaign.audienceType === AUDIENCE_TYPES.SHOW_ATTENDEES) {
    let recap = null;
    const showRecapId = campaign.showRecap?.id || campaign.showRecap;
    if (showRecapId) {
      recap = await strapi.entityService.findOne('api::show-recap.show-recap', showRecapId, {});
    }
    email = buildShowMessageEmail({
      recap: recap || {},
      bandName,
      subject: campaign.subject,
      note: campaign.bodyText,
      unsubscribeUrl,
      fan: { firstName: recipient.firstName || fan.firstName },
      defaultSubject: showMessage.defaultSubject({ recap, bandName }),
    });
  } else {
    email = buildFanListEmail({
      bandName,
      subject: campaign.subject,
      note: campaign.bodyText,
      unsubscribeUrl,
      fan: { firstName: recipient.firstName || fan.firstName },
    });
  }

  const result = await resendProvider.sendOne({
    to: fan.email,
    from,
    replyTo: campaign.replyTo || from,
    subject: email.subject,
    text: email.text,
    html: email.html,
    headers: buildUnsubscribeHeaders(unsubscribeUrl),
    tags: [
      { name: 'lane', value: 'band_to_fan' },
      { name: 'kind', value: campaign.audienceType === AUDIENCE_TYPES.SHOW_ATTENDEES ? 'show_message' : 'fan_list_message' },
      { name: 'campaign', value: String(campaign.id) },
    ],
    idempotencyKey: recipient.idempotencyKey || `msg-campaign:${campaign.id}:fan:${fan.id}`,
  });

  // Confirm lock still ours before writing success (avoid double lastMessagedAt races).
  const stillOurs = await refreshLock(campaign.id, lockToken);
  if (!stillOurs) {
    strapi.log.warn(`[MessageCampaignWorker] Lost lock after send for campaign ${campaign.id}`);
  }

  if (!result.ok) {
    await markRecipient(recipient.id, {
      status: 'failed',
      failedAt: new Date().toISOString(),
      failureReason: result.error || 'send_failed',
      failureCode: String(result.status || 'error'),
      providerMessageId: result.id || null,
    });
    return;
  }

  await markRecipient(recipient.id, {
    status: 'sent',
    sentAt: new Date().toISOString(),
    providerMessageId: result.id || null,
    failureReason: null,
    failureCode: null,
  });

  await strapi.entityService.update('api::fan.fan', fan.id, {
    data: { lastMessagedAt: new Date().toISOString() },
  });
}

async function processCampaign(campaign) {
  const claimed = await claimCampaign(campaign);
  if (!claimed) return { skipped: true };

  const lockToken = claimed.workerLockToken;
  const bandId = claimed.band?.id || claimed.band || campaign.band?.id || campaign.band;

  const band = await strapi.entityService.findOne('api::band.band', bandId, {
    fields: ['id', 'name'],
  });

  if (!band) {
    await strapi.entityService.update('api::message-campaign.message-campaign', campaign.id, {
      data: {
        status: 'failed',
        completedAt: new Date().toISOString(),
        workerLockAt: null,
        workerLockToken: null,
      },
    });
    return { failed: true };
  }

  // Reload campaign with relations needed for email content
  const full = await strapi.entityService.findOne(
    'api::message-campaign.message-campaign',
    campaign.id,
    {
      populate: {
        showRecap: true,
        band: { fields: ['id', 'name'] },
        createdByUser: { fields: ['id'] },
        artistUpdate: { fields: ['id'] },
      },
    }
  );

  let inboxService = null;
  if (full.channel === CAMPAIGN_CHANNELS.IN_APP) {
    const artistUserId = full.createdByUser?.id || full.createdByUser;
    const access = artistUserId
      ? await requireArtistInboxAccess(strapi, artistUserId, bandId)
      : null;
    if (!access) {
      await strapi.entityService.update('api::message-campaign.message-campaign', campaign.id, {
        data: {
          status: 'failed',
          completedAt: new Date().toISOString(),
          workerLockAt: null,
          workerLockToken: null,
        },
      });
      strapi.log.warn('[MessageCampaignWorker] In-app campaign actor is no longer authorized', {
        campaignId: campaign.id,
        bandId,
      });
      return { failed: true, reason: 'artist_not_authorized' };
    }
    inboxService = createInboxServiceFromStrapi(strapi);
  }

  while (true) {
    const stillOurs = await refreshLock(campaign.id, lockToken);
    if (!stillOurs) return { lostLock: true };

    const pending = await strapi.entityService.findMany('api::message-recipient.message-recipient', {
      filters: { campaign: campaign.id, status: 'pending' },
      fields: [
        'id',
        'email',
        'firstName',
        'status',
        'attemptCount',
        'idempotencyKey',
        'providerMessageId',
      ],
      populate: { fan: { fields: ['id'] } },
      limit: BATCH_SIZE,
    });

    if (!pending.length) break;

    await Promise.all(
      pending.map((recipient) =>
        deliverRecipient({
          campaign: full,
          band,
          recipient,
          lockToken,
          inboxService,
        }).catch((err) => {
          strapi.log.warn(
            `[MessageCampaignWorker] Recipient ${recipient.id} error: ${err.message}`
          );
        })
      )
    );

    // Persist rolling counters for polling UI
    const { counts } = await rebuildCampaignCounters(campaign.id);
    await strapi.entityService.update('api::message-campaign.message-campaign', campaign.id, {
      data: { ...counts, workerLockAt: new Date().toISOString() },
    });
  }

  await finalizeCampaign(full, lockToken);
  return { done: true };
}

async function processCampaignById(campaignId) {
  const campaign = await strapi.entityService.findOne(
    'api::message-campaign.message-campaign',
    campaignId,
    {
      fields: [
        'id',
        'status',
        'workerLockAt',
        'workerLockToken',
        'audienceType',
        'subject',
        'bodyText',
        'channel',
        'replyTo',
        'startedAt',
      ],
      populate: {
        band: { fields: ['id'] },
        showRecap: { fields: ['id'] },
        createdByUser: { fields: ['id'] },
        artistUpdate: { fields: ['id'] },
      },
    }
  );

  if (!campaign) return;
  if (isTerminalCampaignStatus(campaign.status)) return;
  if (!['queued', 'sending'].includes(campaign.status)) return;

  return processCampaign(campaign);
}

/**
 * Cron entry — process a few queued/stale-sending campaigns.
 */
async function processDueCampaigns() {
  const staleBefore = new Date(Date.now() - STALE_LOCK_MS).toISOString();

  const queued = await strapi.entityService.findMany('api::message-campaign.message-campaign', {
    filters: {
      $or: [
        { status: 'queued' },
        {
          status: 'sending',
          $or: [
            { workerLockAt: { $null: true } },
            { workerLockAt: { $lt: staleBefore } },
          ],
        },
      ],
    },
    fields: [
      'id',
      'status',
      'workerLockAt',
      'workerLockToken',
      'audienceType',
      'subject',
      'bodyText',
      'channel',
      'replyTo',
      'startedAt',
    ],
    populate: {
      band: { fields: ['id'] },
      showRecap: { fields: ['id'] },
      createdByUser: { fields: ['id'] },
      artistUpdate: { fields: ['id'] },
    },
    sort: { queuedAt: 'asc' },
    limit: MAX_CAMPAIGNS_PER_TICK,
  });

  for (const campaign of queued || []) {
    try {
      await processCampaign(campaign);
    } catch (err) {
      strapi.log.error(`[MessageCampaignWorker] Campaign ${campaign.id} failed: ${err.message}`);
    }
  }

  return { processed: (queued || []).length };
}

module.exports = {
  processDueCampaigns,
  processCampaignById,
  processCampaign,
  recheckSuppression,
  recheckInboxEligibility,
  reclaimStuckSendingRecipients,
  STALE_LOCK_MS,
};
