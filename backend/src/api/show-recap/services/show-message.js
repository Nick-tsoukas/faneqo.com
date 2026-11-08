'use strict';

/**
 * Post-show messaging.
 *
 * The point of Show Mode is that a band can reach the people who were actually
 * in the room. This sends that message: scoped to one campaign, only to fans
 * who checked in to that show and are still subscribed, always with a working
 * one-click unsubscribe.
 *
 * Fans have no accounts. The email address they typed at check-in is the whole
 * relationship, which is why the unsubscribe token is minted per fan and why
 * nothing here ever requires them to log in.
 *
 * Email sending is limited per *fan*, not per show. A band can write as often
 * as it likes; an individual just won't be emailed twice inside the cooldown,
 * however many of that band's shows they attended. The constraint exists
 * because every band shares one sending domain — complaints earned by one band
 * degrade inbox placement for all of them. Private Faneqo Inbox delivery does
 * not share that deliverability risk and deliberately has no per-fan cooldown.
 */

const { shouldBypassFanCampaignCooldown } = require('../../../utils/messaging/campaignTestMode');
const {
  accountUserIdOf,
  visitorAccountUserIdOf,
  visitorIdOf,
  resolveShowInboxRecipient,
} = require('../../../utils/messaging/showInboxIdentity');

const FAN_COOLDOWN_HOURS = 24;
const MAX_SHOW_AGE_DAYS = 60;
const DOUBLE_SEND_GUARD_MS = 2 * 60 * 1000;
const MAX_NOTE_LENGTH = 1200;
const MAX_SUBJECT_LENGTH = 140;

const HOUR_MS = 60 * 60 * 1000;

function isCoolingDown(fan, bandId, channel = 'email') {
  if (channel === 'in_app') return false;
  if (shouldBypassFanCampaignCooldown({ email: fan?.email, bandId })) return false;
  if (!fan?.lastMessagedAt) return false;

  const last = new Date(fan.lastMessagedAt).getTime();
  if (Number.isNaN(last)) return false;

  return Date.now() - last < FAN_COOLDOWN_HOURS * HOUR_MS;
}

/** Days since the show, or null when the recap carries no usable date. */
function showAgeInDays(recap) {
  const raw = recap?.showEndedAt || recap?.showStartedAt || recap?.recapGeneratedAt;
  if (!raw) return null;

  const then = new Date(raw).getTime();
  if (Number.isNaN(then)) return null;

  return (Date.now() - then) / (24 * HOUR_MS);
}

function siteUrl() {
  if (process.env.PUBLIC_SITE_URL) return process.env.PUBLIC_SITE_URL.replace(/\/$/, '');
  return `https://${process.env.PUBLIC_HOSTNAME || 'faneqo.com'}`;
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Preserve the band's line breaks without letting them inject markup. */
function noteToHtml(note) {
  return escapeHtml(note)
    .split(/\n{2,}/)
    .map((para) => `<p style="margin:0 0 14px;">${para.replace(/\n/g, '<br>')}</p>`)
    .join('');
}

function showLabel(recap) {
  // Trim before join — venue/city often carry trailing spaces from event entry,
  // which used to render as "the happy place , millington".
  const parts = [recap.venue, recap.city]
    .map((part) => String(part || '').trim())
    .filter(Boolean);

  if (parts.length) return parts.join(' · ');

  const title = String(recap.showTitle || '').trim();
  return title || 'the show';
}

/**
 * Headers Gmail / Apple Mail use for native unsubscribe.
 * HTTPS URL must accept a one-click POST (RFC 8058); mailto is a fallback.
 */
function buildUnsubscribeHeaders(unsubscribeUrl) {
  return {
    'List-Unsubscribe': `<${unsubscribeUrl}>, <mailto:unsubscribe@faneqo.com>`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
  };
}

async function loadClaimedShowInboxTwins({ bandId, attendances }) {
  const visitorIds = [
    ...new Set(
      (attendances || [])
        .filter((row) => (
          row?.fan &&
          !accountUserIdOf(row.fan) &&
          visitorAccountUserIdOf(row.fan)
        ))
        .map((row) => visitorIdOf(row.fan))
        .filter(Boolean)
        .map((id) => Number(id))
        .filter((id) => Number.isFinite(id))
    ),
  ];
  if (!bandId || !visitorIds.length) return [];

  return strapi.entityService.findMany('api::fan.fan', {
    filters: {
      band: bandId,
      visitor: { id: { $in: visitorIds } },
      status: { $ne: 'removed' },
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
    ],
    populate: {
      accountUser: { fields: ['id'] },
      visitor: { fields: ['id'] },
    },
    limit: 10000,
  });
}

function showDateLabel(recap) {
  const raw = recap.showStartedAt || recap.showEndedAt;
  if (!raw) return '';

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return '';

  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: recap.timezone || 'UTC',
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    }).format(date);
  } catch (err) {
    return '';
  }
}

module.exports = {
  FAN_COOLDOWN_HOURS,
  MAX_SHOW_AGE_DAYS,
  MAX_SUBJECT_LENGTH,
  MAX_NOTE_LENGTH,

  /**
   * Band-to-fan mail should leave from its own sender when one is configured,
   * so bulk sending reputation cannot drag down account and billing email.
   * Falls back to the shared sender until `SHOW_MAIL_FROM` and its DNS exist.
   *
   * The display name is the band's, because a fan recognising the sender is
   * the single biggest factor in not being marked as spam.
   */
  buildFromHeader(bandName) {
    const configured =
      process.env.SHOW_MAIL_FROM ||
      process.env.EMAIL_DEFAULT_FROM ||
      'Faneqo <noreply@mail.faneqo.com>';

    const address = configured.match(/<([^>]+)>/)?.[1] || configured.trim();
    if (!bandName) return `Faneqo <${address}>`;

    // Quotes keep commas and other punctuation in band names from splitting the header.
    const safeName = bandName.replace(/["\\]/g, '').trim();
    return `"${safeName} via Faneqo" <${address}>`;
  },

  /**
   * Prefill only. Bands overwrite this constantly — a thank-you, a discount
   * code, and a tour announcement need different subjects.
   */
  defaultSubject({ recap, bandName }) {
    const place = recap?.venue || recap?.city;
    if (place) return `Thanks for coming out to ${place}`;
    return `Thanks for coming out — ${bandName}`;
  },

  /**
   * Split the room into who can be mailed right now and who was mailed too
   * recently. The band sees both numbers before writing anything.
   */
  partitionRecipients(fans, { bandId, channel = 'email' } = {}) {
    const sendable = [];
    const cooling = [];

    for (const fan of fans) {
      (isCoolingDown(fan, bandId, channel) ? cooling : sendable).push(fan);
    }

    return { sendable, cooling };
  },

  /**
   * Why a send is or isn't possible right now. The only hard blocks are an
   * empty room and a double-submit guard — there is no per-show quota.
   */
  getSendEligibility({ recap, sendableCount, coolingCount, channel = 'email' }) {
    const deliveryWord = channel === 'in_app' ? 'messaged' : 'emailed';
    const lastSentAt = recap?.lastMessageSentAt ? new Date(recap.lastMessageSentAt).getTime() : null;

    if (lastSentAt && !Number.isNaN(lastSentAt) && Date.now() - lastSentAt < DOUBLE_SEND_GUARD_MS) {
      return {
        canSend: false,
        reason: 'just_sent',
        message: 'That message just went out. Give it a minute before sending another.',
      };
    }

    // Mailing a crowd that no longer remembers the show is the fastest way to
    // earn spam complaints, and complaints follow the sending domain.
    const ageInDays = showAgeInDays(recap);
    if (ageInDays !== null && ageInDays > MAX_SHOW_AGE_DAYS) {
      return {
        canSend: false,
        reason: 'show_too_old',
        message: `This show was over ${MAX_SHOW_AGE_DAYS} days ago. Fans may not recognise the message, so messaging is closed for it.`,
      };
    }

    if (sendableCount === 0 && coolingCount > 0) {
      return {
        canSend: false,
        reason: 'all_cooling',
        message: `Everyone who checked in has been ${deliveryWord} in the last ${FAN_COOLDOWN_HOURS} hours. You can reach them again after that.`,
      };
    }

    if (sendableCount === 0) {
      return { canSend: false, reason: 'no_recipients', message: 'Nobody checked in to this show yet.' };
    }

    return { canSend: true, reason: null, message: null };
  },

  /**
   * Fans who checked in to this campaign and are still subscribed.
   * Attendance is the source of truth for "was actually there".
   */
  async getRecipients({ bandId, campaignId, channel = 'email', excludeAccountUserId = null }) {
    if (!bandId || !campaignId) return [];

    const attendances = await strapi.entityService.findMany(
      'api::fan-show-attendance.fan-show-attendance',
      {
        filters: { band: bandId, campaignId },
        fields: ['id', 'suppressedDuplicate'],
        populate: {
          fan: {
            fields: [
              'id',
              'email',
              'firstName',
              'status',
              'unsubscribeToken',
              'lastMessagedAt',
              'lastInboxBroadcastAt',
              'demo',
            ],
            populate: {
              accountUser: { fields: ['id'] },
              visitor: {
                fields: ['id'],
                populate: { accountUser: { fields: ['id'] } },
              },
            },
          },
        },
        limit: 10000,
      }
    );

    const isInbox = channel === 'in_app';
    const recipients = new Map();
    const claimedByVisitor = isInbox
      ? await loadClaimedShowInboxTwins({ bandId, attendances })
      : [];

    for (const attendance of attendances) {
      if (attendance.suppressedDuplicate === true) continue;

      const fan = attendance.fan;
      if (!fan?.id || fan.demo === true || fan.status === 'removed') continue;

      if (isInbox) {
        const inboxFan = resolveShowInboxRecipient(fan, {
          claimedByVisitor,
          excludeAccountUserId,
        });
        const accountUserId = inboxFan?.accountUser;
        if (!accountUserId || recipients.has(String(accountUserId))) continue;
        recipients.set(String(accountUserId), inboxFan);
        continue;
      }

      if (!fan.email || fan.status === 'unsubscribed') continue;
      if (recipients.has(String(fan.id))) continue;
      recipients.set(String(fan.id), fan);
    }

    return Array.from(recipients.values());
  },

  buildEmail({ recap, bandName, subject, note, unsubscribeUrl, fan }) {
    // Shared template (includes CAN-SPAM physical address).
    const emailContent = require('../../../utils/messaging/emailContent');
    return emailContent.buildShowMessageEmail({
      recap,
      bandName,
      subject,
      note,
      unsubscribeUrl,
      fan,
      defaultSubject: this.defaultSubject({ recap, bandName }),
    });
  },

  /**
   * Queue a Message the Room campaign (background delivery).
   * Preserves the previous return shape for the composer, plus campaignId/status.
   */
  async sendShowMessage({ recap, band, subject, note, replyTo, createdByUserId, channel = 'email', artistUpdateId = null }) {
    const campaignService = require('../../../utils/messaging/campaignService');
    return campaignService.queueShowRecapMessage({
      recap,
      band,
      subject,
      note,
      replyTo,
      createdByUserId,
      channel,
      artistUpdateId,
    });
  },
};
