'use strict';

/**
 * Resend webhook receiver.
 *
 * Protects sending reputation (bounce/complaint → global fan suppression)
 * and updates message-recipient delivery rows when providerMessageId matches.
 *
 * Processing is idempotent: repeated webhooks re-apply the same terminal state.
 */

// Same accessor the Stripe webhook uses; `includeUnparsed` is set globally.
const UNPARSED = Symbol.for('unparsedBody');

const { verifySvixSignature } = require('../../../utils/svixSignature');

// Soft bounces (full mailbox, temporary failure) must not suppress anyone.
const HARD_BOUNCE_TYPES = new Set(['Permanent', 'permanent', 'hard', 'HardBounce']);

function extractRawBody(ctx) {
  const body = ctx.request.body;
  if (!body) return null;

  return body[UNPARSED] || body?.data?.[UNPARSED] || null;
}

function extractRecipients(data) {
  const to = data?.to;
  if (Array.isArray(to)) return to.filter(Boolean);
  if (typeof to === 'string' && to) return [to];
  return [];
}

async function findRecipientsByProviderId(providerMessageId) {
  if (!providerMessageId) return [];
  return strapi.entityService.findMany('api::message-recipient.message-recipient', {
    filters: { providerMessageId: String(providerMessageId) },
    fields: ['id', 'status', 'campaign', 'failureCode'],
    limit: 20,
  });
}

async function bumpCampaignCounter(campaignId, field) {
  if (!campaignId || !field) return;
  const campaign = await strapi.entityService.findOne(
    'api::message-campaign.message-campaign',
    campaignId,
    { fields: ['id', field] }
  );
  if (!campaign) return;
  await strapi.entityService.update('api::message-campaign.message-campaign', campaignId, {
    data: { [field]: (campaign[field] || 0) + 1 },
  });
}

/**
 * Map provider lifecycle events onto snapshot rows (idempotent).
 */
async function applyProviderEventToRecipients({ type, providerMessageId }) {
  const rows = await findRecipientsByProviderId(providerMessageId);
  if (!rows.length) return 0;

  const now = new Date().toISOString();
  let updated = 0;

  for (const row of rows) {
    const campaignId = row.campaign?.id || row.campaign;
    const data = {};

    if (type === 'email.delivered') {
      if (row.status === 'delivered') continue;
      data.status = 'delivered';
      data.deliveredAt = now;
      if (campaignId && row.status !== 'delivered') {
        await bumpCampaignCounter(campaignId, 'deliveredCount');
      }
    } else if (type === 'email.bounced') {
      if (row.status === 'bounced') continue;
      data.status = 'bounced';
      data.bouncedAt = now;
      data.failureCode = 'bounced';
      if (campaignId) await bumpCampaignCounter(campaignId, 'bouncedCount');
    } else if (type === 'email.complained') {
      if (row.status === 'suppressed' && row.failureCode === 'complained') continue;
      data.status = 'suppressed';
      data.suppressedAt = now;
      data.failureCode = 'complained';
      data.failureReason = 'complained';
      if (campaignId) await bumpCampaignCounter(campaignId, 'suppressedCount');
    } else if (type === 'email.opened') {
      data.openedAt = now;
    } else if (type === 'email.clicked') {
      data.clickedAt = now;
    } else {
      continue;
    }

    await strapi.entityService.update('api::message-recipient.message-recipient', row.id, {
      data,
    });
    updated += 1;
  }

  return updated;
}

module.exports = {
  /**
   * POST /api/email-events/resend
   * Public route — authenticated by webhook signature, not by a session.
   */
  async resend(ctx) {
    const secret = String(process.env.RESEND_WEBHOOK_SECRET || '').trim();

    if (!secret) {
      // Refuse rather than trusting an unsigned caller with suppression powers.
      strapi.log.error('[EmailEvent] RESEND_WEBHOOK_SECRET is not set; rejecting webhook');
      return ctx.badRequest('Webhook not configured');
    }

    const rawBody = extractRawBody(ctx);
    const result = verifySvixSignature({ secret, headers: ctx.request.headers, rawBody });

    if (!result.valid) {
      strapi.log.warn(`[EmailEvent] Rejected webhook: ${result.reason}`);
      return ctx.unauthorized('Invalid signature');
    }

    const event = ctx.request.body || {};
    const type = event.type;
    const data = event.data || {};
    const recipients = extractRecipients(data);
    const providerMessageId = data.email_id || data.emailId || data.id || null;

    // Always try recipient-row mapping when we have a provider id (idempotent).
    try {
      if (providerMessageId && type) {
        await applyProviderEventToRecipients({ type, providerMessageId });
      }
    } catch (err) {
      strapi.log.warn(`[EmailEvent] Recipient mapping failed: ${err.message}`);
    }

    if (!recipients.length) {
      return ctx.send({ received: true, handled: false });
    }

    const fanService = strapi.service('api::fan.fan');
    let suppressed = 0;

    try {
      if (type === 'email.bounced') {
        const bounceType = data.bounce?.type || data.bounce_type;

        // Only permanent failures. A full mailbox will accept mail next week.
        if (!bounceType || HARD_BOUNCE_TYPES.has(bounceType)) {
          for (const email of recipients) {
            const outcome = await fanService.suppressByEmail({ email, reason: 'bounced' });
            suppressed += outcome.suppressed;
          }
          strapi.log.info(`[EmailEvent] Hard bounce suppressed ${suppressed} fan record(s)`);
        } else {
          strapi.log.info(`[EmailEvent] Ignoring soft bounce (${bounceType})`);
        }
      } else if (type === 'email.complained') {
        for (const email of recipients) {
          const outcome = await fanService.suppressByEmail({ email, reason: 'complained' });
          suppressed += outcome.suppressed;
        }
        strapi.log.warn(`[EmailEvent] Spam complaint suppressed ${suppressed} fan record(s)`);
      }
    } catch (err) {
      strapi.log.error('[EmailEvent] Failed to process event:', err);
      // Swallow: a 500 makes Resend retry, and a retry will fail the same way.
    }

    return ctx.send({ received: true, handled: suppressed > 0, suppressed });
  },
};
