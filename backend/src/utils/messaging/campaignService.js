'use strict';

/**
 * Create + snapshot + queue Faneqo message campaigns.
 *
 * HTTP handlers return after queueing. Delivery is durable via message-recipient
 * rows processed by the cron worker.
 */

const crypto = require('crypto');
const showMessage = require('../../api/show-recap/services/show-message');
const {
  resolveCampaignAudience,
  AUDIENCE_TYPES,
  CAMPAIGN_CHANNELS,
} = require('./audienceResolver');
const {
  isCampaignTestModeEnabled,
  isProductionNodeEnv,
  shouldBypassFanCampaignCooldown,
  getProdCampaignTestMisconfigReason,
  isProductionTestModeForBand,
  getProductionTestSkipReason,
  clampFansToProdTestEmails,
  newCampaignRequestId,
  prefixProdTestSubject,
} = require('./campaignTestMode');
const { positiveId, validateCampaignGallery } = require('./campaignGallery');

const MAX_NOTE_LENGTH = showMessage.MAX_NOTE_LENGTH;
const MAX_SUBJECT_LENGTH = showMessage.MAX_SUBJECT_LENGTH;

function validateContent({ subject, bodyText, hasGallery = false }) {
  const trimmedNote = String(bodyText || '').trim();
  const trimmedSubject = String(subject || '').trim();

  if (!trimmedSubject) {
    return { error: 'empty_subject', message: 'Add a subject line before sending.' };
  }
  if (!trimmedNote && !hasGallery) {
    return { error: 'empty_note', message: 'Write a short note before sending.' };
  }
  if (trimmedNote.length > MAX_NOTE_LENGTH) {
    return { error: 'note_too_long', message: `Keep it under ${MAX_NOTE_LENGTH} characters.` };
  }
  if (trimmedSubject.length > MAX_SUBJECT_LENGTH) {
    return { error: 'subject_too_long', message: `Keep the subject under ${MAX_SUBJECT_LENGTH} characters.` };
  }

  return { trimmedNote, trimmedSubject, error: null };
}

async function resolveCampaignGallery({
  bandId,
  audienceType,
  channel,
  showRecapId,
  artistUpdateId,
}) {
  const updateId = positiveId(artistUpdateId);
  if (artistUpdateId == null || artistUpdateId === '') return { error: null, gallery: null };
  if (!updateId) return { error: 'gallery_not_available', message: 'Gallery is not available.' };

  const gallery = await strapi.entityService.findOne('api::artist-update.artist-update', updateId, {
    fields: ['id', 'title', 'slug', 'visibility', 'status', 'publishedAt'],
    populate: {
      band: { fields: ['id'] },
      showRecap: { fields: ['id'] },
      media: { fields: ['id'] },
    },
  });
  if (gallery) gallery.photoCount = Array.isArray(gallery.media) ? gallery.media.length : 0;
  return validateCampaignGallery({ gallery, bandId, audienceType, channel, showRecapId });
}

/**
 * Show-specific hard blocks (double-submit, show age, empty sendable room).
 */
function getShowAttendeeEligibility({ recap, sendableCount, coolingCount, channel }) {
  return showMessage.getSendEligibility({ recap, sendableCount, coolingCount, channel });
}

function getAllFansEligibility({ sendableCount, coolingCount, channel = CAMPAIGN_CHANNELS.EMAIL }) {
  const deliveryWord = channel === CAMPAIGN_CHANNELS.IN_APP ? 'messaged' : 'emailed';
  if (sendableCount === 0 && coolingCount > 0) {
    return {
      canSend: false,
      reason: 'all_cooling',
      message: `Everyone eligible has been ${deliveryWord} in the last ${showMessage.FAN_COOLDOWN_HOURS} hours. Try again later.`,
    };
  }
  if (sendableCount === 0) {
    return {
      canSend: false,
      reason: 'no_recipients',
      message: 'No subscribed fans are available to message right now.',
    };
  }
  return { canSend: true, reason: null, message: null };
}

function countCooldownBypasses(fans, bandId) {
  let bypassed = 0;
  let missingEmail = 0;
  for (const fan of fans || []) {
    if (!fan?.email) missingEmail += 1;
    if (shouldBypassFanCampaignCooldown({ email: fan?.email, bandId })) bypassed += 1;
  }
  return { bypassed, missingEmail };
}

function campaignLog(event, fields = {}) {
  const parts = Object.entries(fields)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${key}=${value}`);
  const line = `[Faneqo Campaigns] ${event}${parts.length ? ` ${parts.join(' ')}` : ''}`;
  const logger = strapi?.log;
  if (String(event).includes('blocked') || String(event).includes('misconfigured')) {
    (logger?.warn || console.warn).call(logger || console, line);
    return;
  }
  (logger?.info || console.info).call(logger || console, line);
}

function logAudiencePartition({ audienceType, audience, bandId, requestId }) {
  if (isProductionNodeEnv()) return;
  const { bypassed, missingEmail } = countCooldownBypasses(audience.fans, bandId);
  const testMode = isCampaignTestModeEnabled();
  campaignLog('cooldown:partitioned', {
    requestId,
    sendable: audience.sendable.length,
    cooling: audience.cooling.length,
    cooldownBypassed: bypassed,
  });
  if (missingEmail > 0) {
    campaignLog('audience:missing-email', { requestId, missingEmail });
  }
  if (!testMode) {
    const warn = strapi?.log?.warn?.bind(strapi.log) || console.warn;
    warn(
      '[Faneqo Campaigns] cooldown bypass inactive in this process — restart Strapi after setting FANEQO_CAMPAIGN_TEST_MODE'
    );
  }
}

/**
 * Fail closed if prod test flag is on but incomplete.
 * For Message Fans on an approved band: clamp to test emails, then re-partition.
 * Message the Room (show_attendees) is not clamped.
 */
function applyProductionTestAudience({ bandId, audienceType, audience, requestId, channel = CAMPAIGN_CHANNELS.EMAIL }) {
  const misconfigured = getProdCampaignTestMisconfigReason();
  if (misconfigured) {
    campaignLog('production-test:blocked', { requestId, reason: misconfigured, bandId });
    return {
      error: 'production_test_mode_misconfigured',
      message:
        'Production campaign test mode is on but incomplete. Set FANEQO_PROD_CAMPAIGN_TEST_BAND_IDS and FANEQO_PROD_CAMPAIGN_TEST_EMAILS, or turn the flag off.',
      reason: misconfigured,
    };
  }

  const type = String(audienceType || '').trim();
  const active =
    type === AUDIENCE_TYPES.ALL_FANS && isProductionTestModeForBand(bandId);

  if (!active) {
    return { audience, productionTestMode: false, error: null };
  }

  const normalEligible = (audience.fans || []).length;
  const clampedFans = clampFansToProdTestEmails(audience.fans);
  const partitioned = showMessage.partitionRecipients(clampedFans, { bandId, channel });
  const next = {
    ...audience,
    fans: clampedFans,
    sendable: partitioned.sendable,
    cooling: partitioned.cooling,
  };

  campaignLog('production-test:audience-clamped', {
    requestId,
    bandId,
    normalEligible,
    testAllowlistMatches: clampedFans.length,
    finalRecipients: partitioned.sendable.length,
  });

  const { bypassed } = countCooldownBypasses(clampedFans, bandId);
  campaignLog('cooldown:partitioned', {
    requestId,
    sendable: partitioned.sendable.length,
    cooling: partitioned.cooling.length,
    cooldownBypassed: bypassed,
  });

  return { audience: next, productionTestMode: true, error: null };
}

/**
 * Block overlapping active campaigns for the same show recap.
 */
async function hasActiveShowCampaign({ bandId, showRecapId }) {
  if (!showRecapId) return false;

  const active = await strapi.entityService.findMany('api::message-campaign.message-campaign', {
    filters: {
      band: bandId,
      showRecap: showRecapId,
      status: { $in: ['queued', 'sending'] },
    },
    fields: ['id'],
    limit: 1,
  });

  return (active || []).length > 0;
}

async function hasActiveAudienceCampaign({ bandId, audienceType }) {
  if (!bandId || !audienceType) return false;

  const active = await strapi.entityService.findMany('api::message-campaign.message-campaign', {
    filters: {
      band: bandId,
      audienceType,
      status: { $in: ['queued', 'sending'] },
    },
    fields: ['id'],
    limit: 1,
  });

  return (active || []).length > 0;
}

async function resolveShowRecapContext({ bandId, audienceReference, recap = null }) {
  if (recap?.id) return recap;
  const campaignId = String(audienceReference || '').trim();
  if (!bandId || !campaignId) return null;

  const rows = await strapi.entityService.findMany('api::show-recap.show-recap', {
    filters: { band: bandId, campaignId },
    fields: [
      'id',
      'campaignId',
      'showTitle',
      'venue',
      'city',
      'timezone',
      'showStartedAt',
      'showEndedAt',
      'recapGeneratedAt',
      'lastMessageSentAt',
      'messagesSentCount',
    ],
    limit: 1,
  });
  return rows?.[0] || null;
}

/**
 * Informational audience preview — no snapshot, no send.
 * Never returns fan emails / PII.
 */
async function previewCampaignAudience({
  bandId,
  audienceType,
  audienceReference = null,
  audienceConfig = null,
  recap = null,
  channel = CAMPAIGN_CHANNELS.EMAIL,
  createdByUserId = null,
  artistUpdateId = null,
}) {
  const requestId = newCampaignRequestId();

  if (!bandId) {
    return { error: 'missing_band', message: 'Band is required.' };
  }

  const band = await strapi.entityService.findOne('api::band.band', bandId, {
    fields: ['id', 'name'],
  });
  if (!band) {
    return { error: 'band_not_found', message: 'Band not found.' };
  }

  const type = String(audienceType || '').trim();
  const deliveryChannel = String(channel || CAMPAIGN_CHANNELS.EMAIL).trim();
  if (!Object.values(CAMPAIGN_CHANNELS).includes(deliveryChannel)) {
    return { error: 'unsupported_channel', message: `Unsupported delivery channel: ${deliveryChannel}` };
  }
  campaignLog('preview:start', {
    requestId,
    bandId,
    audienceType: type || 'unknown',
    productionTestMode: isProductionTestModeForBand(bandId),
    productionTestSkipReason: getProductionTestSkipReason(bandId) || 'none',
  });

  let resolvedRef = audienceReference;

  if (type === AUDIENCE_TYPES.SHOW_ATTENDEES) {
    resolvedRef = resolvedRef || recap?.campaignId || null;
    if (!resolvedRef) {
      return { error: 'missing_reference', message: 'Show campaign id is required.' };
    }
    recap = await resolveShowRecapContext({
      bandId,
      audienceReference: resolvedRef,
      recap,
    });
    if (!recap) {
      return { error: 'show_not_found', message: 'Show not found for this band.' };
    }
  }

  const galleryResult = await resolveCampaignGallery({
    bandId,
    audienceType: type,
    channel: deliveryChannel,
    showRecapId: recap?.id || null,
    artistUpdateId,
  });
  if (galleryResult.error) return galleryResult;

  const audience = await resolveCampaignAudience({
    bandId,
    audienceType: type,
    audienceReference: resolvedRef,
    audienceConfig,
    channel: deliveryChannel,
    excludeAccountUserId: createdByUserId,
  });

  if (audience.error) {
    return { error: audience.error, message: audience.message };
  }

  const gated = applyProductionTestAudience({
    bandId,
    audienceType: type,
    audience,
    requestId,
    channel: deliveryChannel,
  });
  if (gated.error) {
    return { error: gated.error, message: gated.message };
  }

  const finalAudience = gated.audience;
  logAudiencePartition({
    audienceType: type,
    audience: finalAudience,
    bandId,
    requestId,
  });

  let eligibility;
  if (type === AUDIENCE_TYPES.SHOW_ATTENDEES) {
    eligibility = getShowAttendeeEligibility({
      recap: recap || {},
      sendableCount: finalAudience.sendable.length,
      coolingCount: finalAudience.cooling.length,
      channel: deliveryChannel,
    });
  } else if (type === AUDIENCE_TYPES.ALL_FANS) {
    eligibility = getAllFansEligibility({
      sendableCount: finalAudience.sendable.length,
      coolingCount: finalAudience.cooling.length,
      channel: deliveryChannel,
    });
  } else {
    return { error: 'unsupported_audience', message: `Unsupported audience type: ${type}` };
  }

  const audienceLabel =
    type === AUDIENCE_TYPES.ALL_FANS
      ? 'All Fans'
      : type === AUDIENCE_TYPES.SHOW_ATTENDEES
        ? 'Show attendees'
        : type;

  let defaultSubject =
    deliveryChannel === CAMPAIGN_CHANNELS.IN_APP
      ? `Inbox message from ${band.name || 'your band'}`
      : type === AUDIENCE_TYPES.SHOW_ATTENDEES
      ? showMessage.defaultSubject({ recap, bandName: band.name || '' })
      : `A note from ${band.name || 'your band'}`;
  if (gated.productionTestMode) {
    defaultSubject = prefixProdTestSubject(defaultSubject, MAX_SUBJECT_LENGTH);
  }

  campaignLog('preview:complete', {
    requestId,
    canSend: eligibility.canSend,
    recipientCount: finalAudience.sendable.length,
    cooling: finalAudience.cooling.length,
    productionTestMode: gated.productionTestMode,
  });

  return {
    audienceType: type,
    channel: deliveryChannel,
    audienceLabel,
    bandName: band.name || '',
    total: finalAudience.fans.length,
    eligible: finalAudience.sendable.length,
    suppressed: finalAudience.cooling.length,
    unavailable: finalAudience.cooling.length,
    cooldownHours: deliveryChannel === CAMPAIGN_CHANNELS.IN_APP ? 0 : showMessage.FAN_COOLDOWN_HOURS,
    maxSubjectLength: MAX_SUBJECT_LENGTH,
    maxNoteLength: MAX_NOTE_LENGTH,
    defaultSubject,
    canSend: eligibility.canSend,
    reason: eligibility.reason || null,
    message: eligibility.message || null,
    ...(isCampaignTestModeEnabled()
      ? {
          cooldownBypassedForTesting: true,
          testCooldownBypassed: countCooldownBypasses(finalAudience.fans, bandId).bypassed,
        }
      : {}),
    ...(gated.productionTestMode
      ? {
          productionTestMode: true,
          productionTestAudienceClamped: true,
          recipientCount: finalAudience.sendable.length,
        }
      : {}),
  };
}

async function snapshotRecipients({ campaignId, bandId, fans, channel = CAMPAIGN_CHANNELS.EMAIL }) {
  const now = new Date().toISOString();
  let created = 0;

  // Create in modest chunks to avoid huge single transactions.
  const CHUNK = 50;
  for (let i = 0; i < fans.length; i += CHUNK) {
    const slice = fans.slice(i, i + CHUNK);
    await Promise.all(
      slice.map(async (fan) => {
        const idempotencyKey = `msg-campaign:${campaignId}:fan:${fan.id}`;
        await strapi.entityService.create('api::message-recipient.message-recipient', {
          data: {
            campaign: campaignId,
            fan: fan.id,
            band: bandId,
            email: fan.email ? String(fan.email).trim().toLowerCase() : null,
            firstName: fan.firstName || null,
            channel,
            provider: channel === CAMPAIGN_CHANNELS.IN_APP ? 'faneqo_inbox' : 'resend',
            status: 'pending',
            queuedAt: now,
            attemptCount: 0,
            idempotencyKey,
          },
        });
        created += 1;
      })
    );
  }

  return created;
}

/**
 * Create campaign, snapshot sendable audience, mark queued.
 *
 * For Message the Room, pass showRecap + recap for eligibility / counters.
 */
async function createAndQueueCampaign({
  bandId,
  createdByUserId,
  audienceType,
  audienceReference = null,
  audienceConfig = null,
  subject,
  bodyText,
  name = null,
  replyTo = null,
  channel = 'email',
  showRecap = null,
  recap = null,
  artistUpdateId = null,
}) {
  const requestId = newCampaignRequestId();

  const deliveryChannel = String(channel || CAMPAIGN_CHANNELS.EMAIL).trim();
  if (!Object.values(CAMPAIGN_CHANNELS).includes(deliveryChannel)) {
    return { error: 'unsupported_channel', message: `Unsupported delivery channel: ${deliveryChannel}` };
  }

  const content = validateContent({
    subject: subject || (deliveryChannel === CAMPAIGN_CHANNELS.IN_APP ? 'Inbox message' : subject),
    bodyText,
    hasGallery: Boolean(positiveId(artistUpdateId)),
  });
  if (content.error) return content;

  const band = await strapi.entityService.findOne('api::band.band', bandId, {
    fields: ['id', 'name'],
  });
  if (!band) {
    return { error: 'band_not_found', message: 'Band not found.' };
  }

  const type = String(audienceType || '').trim();
  campaignLog('create:start', {
    requestId,
    bandId,
    audienceType: type || 'unknown',
    productionTestMode: isProductionTestModeForBand(bandId),
  });
  let resolvedRef = audienceReference;

  if (type === AUDIENCE_TYPES.SHOW_ATTENDEES) {
    if (!recap && showRecap) {
      recap = typeof showRecap === 'object' ? showRecap : null;
    }
    if (!recap?.campaignId && !resolvedRef) {
      return { error: 'missing_reference', message: 'Show campaign id is required.' };
    }
    resolvedRef = resolvedRef || recap.campaignId;
    recap = await resolveShowRecapContext({
      bandId,
      audienceReference: resolvedRef,
      recap,
    });
    if (!recap) {
      return { error: 'show_not_found', message: 'Show not found for this band.' };
    }

    if (recap?.id && (await hasActiveShowCampaign({ bandId, showRecapId: recap.id }))) {
      return {
        error: 'just_sent',
        message: 'That message is already sending. Give it a minute before sending another.',
      };
    }
  }

  if (type === AUDIENCE_TYPES.ALL_FANS) {
    if (await hasActiveAudienceCampaign({ bandId, audienceType: type })) {
      return {
        error: 'already_sending',
        message: 'A fan message is already sending. Give it a minute before sending another.',
      };
    }
  }

  const galleryResult = await resolveCampaignGallery({
    bandId,
    audienceType: type,
    channel: deliveryChannel,
    showRecapId: recap?.id || null,
    artistUpdateId,
  });
  if (galleryResult.error) return galleryResult;

  const audience = await resolveCampaignAudience({
    bandId,
    audienceType: type,
    audienceReference: resolvedRef,
    audienceConfig,
    channel: deliveryChannel,
    excludeAccountUserId: createdByUserId,
  });

  if (audience.error) {
    return { error: audience.error, message: audience.message };
  }

  const gated = applyProductionTestAudience({
    bandId,
    audienceType: type,
    audience,
    requestId,
    channel: deliveryChannel,
  });
  if (gated.error) {
    return { error: gated.error, message: gated.message };
  }

  const finalAudience = gated.audience;
  logAudiencePartition({
    audienceType: type,
    audience: finalAudience,
    bandId,
    requestId,
  });

  let eligibility;
  if (type === AUDIENCE_TYPES.SHOW_ATTENDEES) {
    eligibility = getShowAttendeeEligibility({
      recap: recap || {},
      sendableCount: finalAudience.sendable.length,
      coolingCount: finalAudience.cooling.length,
      channel: deliveryChannel,
    });
  } else {
    eligibility = getAllFansEligibility({
      sendableCount: finalAudience.sendable.length,
      coolingCount: finalAudience.cooling.length,
      channel: deliveryChannel,
    });
  }

  if (!eligibility.canSend) {
    return { error: eligibility.reason, message: eligibility.message };
  }

  const finalSubject = gated.productionTestMode
    ? prefixProdTestSubject(content.trimmedSubject, MAX_SUBJECT_LENGTH)
    : content.trimmedSubject;

  const now = new Date().toISOString();

  // Claim Message the Room double-submit slot before creating the campaign.
  if (type === AUDIENCE_TYPES.SHOW_ATTENDEES && recap?.id) {
    await strapi.entityService.update('api::show-recap.show-recap', recap.id, {
      data: {
        lastMessageSentAt: now,
      },
    });
  }

  const campaign = await strapi.entityService.create('api::message-campaign.message-campaign', {
    data: {
      band: bandId,
      createdByUser: createdByUserId || null,
      showRecap: recap?.id || showRecap?.id || null,
      artistUpdate: galleryResult.gallery?.id || null,
      name: name || (type === AUDIENCE_TYPES.SHOW_ATTENDEES ? 'Message the Room' : 'Fan List message'),
      subject: finalSubject,
      bodyText: content.trimmedNote,
      bodyHtml: null,
      audienceType: type,
      audienceReference: resolvedRef ? String(resolvedRef) : null,
      audienceConfig: audienceConfig || null,
      channel: deliveryChannel,
      status: 'queued',
      recipientCount: finalAudience.sendable.length,
      sentCount: 0,
      deliveredCount: 0,
      failedCount: 0,
      suppressedCount: 0,
      bouncedCount: 0,
      skippedCount: finalAudience.cooling.length,
      replyTo: replyTo || null,
      queuedAt: now,
    },
  });

  await snapshotRecipients({
    campaignId: campaign.id,
    bandId,
    fans: finalAudience.sendable,
    channel: deliveryChannel,
  });

  strapi.log.info('[MessageCampaign] Queued campaign', {
    campaignId: campaign.id,
    bandId,
    audienceType: type,
    channel: deliveryChannel,
    recipientCount: finalAudience.sendable.length,
    skippedCooling: finalAudience.cooling.length,
    artistUpdateId: galleryResult.gallery?.id || null,
  });

  campaignLog('create:complete', {
    requestId,
    campaignId: campaign.id,
    canSend: true,
    recipientCount: finalAudience.sendable.length,
    productionTestMode: gated.productionTestMode,
  });

  // Kick delivery without blocking the HTTP response for long.
  // Smoke/integration harnesses can set MESSAGING_DISABLE_IMMEDIATE_WORKER=1
  // and drive the worker explicitly (cron still processes queued campaigns).
  if (process.env.MESSAGING_DISABLE_IMMEDIATE_WORKER !== '1') {
    setImmediate(() => {
      try {
        const worker = require('./campaignWorker');
        worker.processCampaignById(campaign.id).catch((err) => {
          strapi.log.warn(`[MessageCampaign] Immediate worker failed for ${campaign.id}: ${err.message}`);
        });
      } catch (err) {
        strapi.log.warn(`[MessageCampaign] Could not start immediate worker: ${err.message}`);
      }
    });
  }

  return {
    campaignId: campaign.id,
    status: 'queued',
    queued: true,
    recipientCount: finalAudience.sendable.length,
    skipped: finalAudience.cooling.length,
    // Compatibility with existing Message the Room UI until polling takes over
    sent: 0,
    failed: 0,
    artistUpdateId: galleryResult.gallery?.id || null,
  };
}

/**
 * Message the Room entry: queue a show_attendees campaign for a recap.
 */
async function queueShowRecapMessage({ recap, band, subject, note, replyTo, createdByUserId, channel = CAMPAIGN_CHANNELS.EMAIL, artistUpdateId = null }) {
  return createAndQueueCampaign({
    bandId: band.id,
    createdByUserId,
    audienceType: AUDIENCE_TYPES.SHOW_ATTENDEES,
    audienceReference: recap.campaignId,
    subject,
    bodyText: note,
    replyTo,
    showRecap: recap,
    recap,
    name: 'Message the Room',
    channel,
    artistUpdateId,
  });
}

function audienceLabelFor(audienceType) {
  if (audienceType === AUDIENCE_TYPES.SHOW_ATTENDEES) return 'Show attendees';
  if (audienceType === AUDIENCE_TYPES.ALL_FANS) return 'All Fans';
  return audienceType || 'Audience';
}

function showContextFromRecap(recap) {
  if (!recap) return null;
  return {
    showTitle: recap.showTitle || null,
    venue: recap.venue || null,
    city: recap.city || null,
    showStartedAt: recap.showStartedAt || null,
    showEndedAt: recap.showEndedAt || null,
  };
}

/**
 * Safe history/detail DTO — aggregates + body only, never recipient rows/emails.
 */
function serializeCampaignForHistory(campaign, { includeBody = false } = {}) {
  const recap = campaign.showRecap && typeof campaign.showRecap === 'object'
    ? campaign.showRecap
    : null;
  const show = showContextFromRecap(recap);
  const audienceType = campaign.audienceType;
  const gallery = campaign.artistUpdate && typeof campaign.artistUpdate === 'object'
    ? campaign.artistUpdate
    : null;

  let audienceDetail = null;
  if (audienceType === AUDIENCE_TYPES.SHOW_ATTENDEES && show) {
    audienceDetail = show.venue || show.city || show.showTitle || null;
  }

  const dto = {
    id: campaign.id,
    subject: campaign.subject || null,
    name: campaign.name || null,
    audienceType,
    audienceLabel: audienceLabelFor(audienceType),
    audienceReference: campaign.audienceReference || null,
    audienceDetail,
    show,
    status: campaign.status,
    channel: campaign.channel || 'email',
    recipientCount: campaign.recipientCount || 0,
    sentCount: campaign.sentCount || 0,
    deliveredCount: campaign.deliveredCount || 0,
    failedCount: campaign.failedCount || 0,
    suppressedCount: campaign.suppressedCount || 0,
    bouncedCount: campaign.bouncedCount || 0,
    skippedCount: campaign.skippedCount || 0,
    createdAt: campaign.createdAt || null,
    queuedAt: campaign.queuedAt || null,
    startedAt: campaign.startedAt || null,
    completedAt: campaign.completedAt || null,
    gallery: gallery
      ? {
          id: gallery.id,
          title: gallery.title || null,
          slug: gallery.slug || null,
          visibility: gallery.visibility || null,
          photoCount: Array.isArray(gallery.media) ? gallery.media.length : 0,
        }
      : null,
  };

  if (includeBody) {
    dto.bodyText = campaign.bodyText || '';
  }

  return dto;
}

/**
 * Paginated campaign history for a band (newest first).
 * Excludes draft rows that never queued.
 */
async function listCampaignHistory({ bandId, page = 1, pageSize = 20 }) {
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeSize = Math.min(50, Math.max(1, parseInt(pageSize, 10) || 20));

  const filters = {
    band: bandId,
    status: { $ne: 'draft' },
  };

  const [rows, total] = await Promise.all([
    strapi.entityService.findMany('api::message-campaign.message-campaign', {
      filters,
      sort: { createdAt: 'desc' },
      start: (safePage - 1) * safeSize,
      limit: safeSize,
      fields: [
        'id',
        'subject',
        'name',
        'audienceType',
        'audienceReference',
        'status',
        'channel',
        'recipientCount',
        'sentCount',
        'deliveredCount',
        'failedCount',
        'suppressedCount',
        'bouncedCount',
        'skippedCount',
        'queuedAt',
        'startedAt',
        'completedAt',
        'createdAt',
      ],
      populate: {
        showRecap: {
          fields: ['id', 'showTitle', 'venue', 'city', 'showStartedAt', 'showEndedAt'],
        },
        artistUpdate: {
          fields: ['id', 'title', 'slug', 'visibility'],
          populate: { media: { fields: ['id'] } },
        },
      },
    }),
    strapi.entityService.count('api::message-campaign.message-campaign', { filters }),
  ]);

  const data = (rows || []).map((row) => serializeCampaignForHistory(row, { includeBody: false }));
  const pageCount = Math.max(1, Math.ceil(total / safeSize));

  return {
    data,
    meta: {
      pagination: {
        page: safePage,
        pageSize: safeSize,
        pageCount,
        total,
      },
    },
  };
}

/**
 * Single campaign detail for history UI (includes original bodyText).
 */
async function getCampaignDetail({ bandId, campaignId }) {
  const campaign = await strapi.entityService.findOne(
    'api::message-campaign.message-campaign',
    campaignId,
    {
      fields: [
        'id',
        'subject',
        'name',
        'bodyText',
        'audienceType',
        'audienceReference',
        'status',
        'channel',
        'recipientCount',
        'sentCount',
        'deliveredCount',
        'failedCount',
        'suppressedCount',
        'bouncedCount',
        'skippedCount',
        'queuedAt',
        'startedAt',
        'completedAt',
        'createdAt',
      ],
      populate: {
        band: { fields: ['id'] },
        showRecap: {
          fields: ['id', 'showTitle', 'venue', 'city', 'showStartedAt', 'showEndedAt'],
        },
        artistUpdate: {
          fields: ['id', 'title', 'slug', 'visibility'],
          populate: { media: { fields: ['id'] } },
        },
      },
    }
  );

  if (!campaign) return { error: 'not_found', message: 'Campaign not found.' };

  const campaignBandId = campaign.band?.id || campaign.band;
  if (String(campaignBandId) !== String(bandId)) {
    return { error: 'forbidden', message: 'Not allowed.' };
  }

  if (campaign.status === 'draft') {
    return { error: 'not_found', message: 'Campaign not found.' };
  }

  return {
    error: null,
    data: serializeCampaignForHistory(campaign, { includeBody: true }),
  };
}

module.exports = {
  createAndQueueCampaign,
  queueShowRecapMessage,
  previewCampaignAudience,
  validateContent,
  getAllFansEligibility,
  applyProductionTestAudience,
  listCampaignHistory,
  getCampaignDetail,
  serializeCampaignForHistory,
  audienceLabelFor,
  AUDIENCE_TYPES,
};
