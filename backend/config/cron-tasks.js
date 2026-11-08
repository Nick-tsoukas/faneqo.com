'use strict';

const { default: Stripe } = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
const { subDays } = require('date-fns');
const { isBillingExemptLifetimePro } = require('../src/utils/billing/artistEntitlement');

function normalizeSubscriptionStatusForUserRow(status) {
  const s = String(status || '').trim();
  if (s === 'past_due') return 'pastDue';
  if (s === 'active') return 'active';
  if (s === 'trialing') return 'trialing';
  if (s === 'canceled') return 'canceled';
  if (s === 'unpaid') return 'unpaid';
  if (s === 'incomplete' || s === 'incomplete_expired' || s === 'paused') return 'unpaid';
  return 'trialing';
}

module.exports = {
  // 🕒 Stripe subscription reconciliation — runs daily at 3 AM UTC
  // Safety net to catch any missed webhooks and keep user status in sync
  '0 3 * * *': async ({ strapi }) => {
    strapi.log.info('[cron] Reconciling Stripe subscriptions...');

    let processed = 0;
    let updated = 0;
    let errors = 0;

    try {
      // Fetch users with either subscriptionId OR customerId (covers all Stripe users)
      const users = await strapi.entityService.findMany('plugin::users-permissions.user', {
        filters: {
          $or: [
            { subscriptionId: { $notNull: true } },
            { customerId: { $notNull: true } },
          ],
        },
        fields: ['id', 'email', 'subscriptionId', 'customerId', 'plan', 'subscriptionStatus', 'trialEndsAt', 'cancelAt', 'gracePeriodStart'],
        limit: 5000,
      });

      for (const u of users) {
        processed++;
        try {
          if (isBillingExemptLifetimePro(u)) {
            strapi.log.debug('[cron] Skipping billing-exempt lifetime Pro', { userId: u.id });
            continue;
          }
          let sub = null;

          // Try to get subscription by subscriptionId first
          if (u.subscriptionId) {
            try {
              sub = await stripe.subscriptions.retrieve(u.subscriptionId);
            } catch (subErr) {
              // Subscription may have been deleted - try to find by customer
              if (subErr.code === 'resource_missing' && u.customerId) {
                strapi.log.debug('[cron] Subscription not found, checking customer', { userId: u.id });
              } else {
                throw subErr;
              }
            }
          }

          // Fallback: find latest subscription by customerId
          if (!sub && u.customerId) {
            const subs = await stripe.subscriptions.list({
              customer: u.customerId,
              status: 'all',
              limit: 1,
            });
            sub = subs.data?.[0] || null;
          }

          // No subscription found - mark as canceled if they had one before
          if (!sub) {
            if (u.subscriptionStatus && u.subscriptionStatus !== 'canceled') {
              await strapi.entityService.update('plugin::users-permissions.user', u.id, {
                data: { subscriptionStatus: 'canceled', gracePeriodStart: null, cancelAt: null },
              });
              strapi.log.info('[cron] Marked user as canceled (no subscription found)', { userId: u.id, email: u.email });
              updated++;
            }
            continue;
          }

          const planNickname =
            sub?.items?.data?.[0]?.price?.nickname ||
            sub?.items?.data?.[0]?.plan?.nickname ||
            null;

          const newStatus = normalizeSubscriptionStatusForUserRow(sub.status);

          const updates = {
            subscriptionStatus: newStatus,
            plan: planNickname,
            trialEndsAt: sub.trial_end ? new Date(sub.trial_end * 1000) : null,
            cancelAt: sub.cancel_at ? new Date(sub.cancel_at * 1000) : null,
          };

          // Ensure subscriptionId is set (for users found by customerId)
          if (!u.subscriptionId && sub.id) {
            updates.subscriptionId = sub.id;
          }

          // Clear grace period if subscription is active
          if (newStatus === 'active') {
            updates.gracePeriodStart = null;
          }

          // Only update if something changed
          const changed =
            u.subscriptionStatus !== updates.subscriptionStatus ||
            u.plan !== updates.plan ||
            u.subscriptionId !== (updates.subscriptionId || u.subscriptionId) ||
            String(u.trialEndsAt || '') !== String(updates.trialEndsAt || '') ||
            String(u.cancelAt || '') !== String(updates.cancelAt || '');

          if (changed) {
            await strapi.entityService.update('plugin::users-permissions.user', u.id, { data: updates });
            strapi.log.info('[cron] Updated user subscription', {
              userId: u.id,
              email: u.email,
              oldStatus: u.subscriptionStatus,
              newStatus: updates.subscriptionStatus,
            });
            updated++;
          }
        } catch (err) {
          errors++;
          strapi.log.error('[cron] Failed to reconcile user', {
            userId: u.id,
            email: u.email,
            error: err.message,
          });
        }
      }
    } catch (err) {
      strapi.log.error('[cron] Fatal error during reconciliation', err);
    }

    strapi.log.info('[cron] Stripe reconciliation complete', { processed, updated, errors });
  },

  // 🎤 Show Recap recovery — every 15 minutes.
  // Lightweight live-session expiry runs on the 1-minute job below.
  // Event creation must never auto-activate Show Mode. Artists start it.
  '*/15 * * * *': async ({ strapi }) => {
    strapi.log.info('[cron] Recovering missing show recaps...');

    try {
      const recapService = strapi.service('api::show-recap.show-recap');
      const campaignsNeedingRecap = await recapService.findCampaignsNeedingRecap();

      for (const { bandId, campaignId, showContext } of campaignsNeedingRecap) {
        try {
          await recapService.generateShowRecap({ bandId, campaignId, showContext });
          strapi.log.info('[cron] Generated missing show recap', { bandId, campaignId });
        } catch (recapErr) {
          strapi.log.error('[cron] Failed to generate recap', { bandId, campaignId, error: recapErr.message });
        }
      }

      if (campaignsNeedingRecap.length > 0) {
        strapi.log.info('[cron] Generated missing recaps', { count: campaignsNeedingRecap.length });
      }
    } catch (err) {
      strapi.log.error('[cron] Show recap recovery failed', err);
    }
  },

  // ✉️ Faneqo message campaigns + lightweight Show Mode expiry
  // Every minute. Two `* * * * *` object keys cannot coexist, so expiry shares
  // this proven slot instead of introducing a second named cron format.
  '* * * * *': async ({ strapi }) => {
    try {
      const showModeService = require('../src/api/band/services/showMode');
      const expiredResult = await showModeService.processExpiredShowModes();
      if (expiredResult?.deactivatedCount > 0) {
        strapi.log.info('[cron] Deactivated expired show modes', { count: expiredResult.deactivatedCount });
      }
    } catch (err) {
      strapi.log.error('[cron] Expired show mode processing failed', { error: err.message });
    }

    try {
      const worker = require('../src/utils/messaging/campaignWorker');
      const result = await worker.processDueCampaigns();
      if (result?.processed > 0) {
        strapi.log.info('[cron] Processed message campaigns', result);
      }
    } catch (err) {
      strapi.log.error('[cron] Message campaign worker failed', { error: err.message });
    }
  },

  // 🕛 New job — Band analytics daily rollup (runs every day at midnight)
  '10 0 * * *': async ({ strapi }) => {
    strapi.log.info('[cron] Running daily band analytics rollup...');
    try {
      const bands = await strapi.entityService.findMany('api::band.band', { fields: ['id', 'name'] });
const service = strapi.service('api::band-insight-daily.band-insight-daily');
      const yesterday = subDays(new Date(), 1);

      // Pulse snapshots + surge notifications used to be written as a side
      // effect of GET /analytics/pulse. A GET must not mutate state, so the
      // write path runs here instead.
      const { refreshBandPulseSnapshot } = require('../src/api/analytics/services/pulseSnapshot');

      for (const b of bands) {
        try {
          await service.computeDay({ bandId: b.id, day: yesterday });
          strapi.log.info(`[cron] ✅ Rolled up analytics for band: ${b.name}`);
        } catch (err) {
          strapi.log.error(`[cron] ❌ Rollup failed for band ${b.name}:`, err.message);
        }

        try {
          await refreshBandPulseSnapshot(strapi, { bandId: b.id });
        } catch (err) {
          // Never let snapshot/notification work break the rollup.
          strapi.log.error(`[cron] ❌ Pulse snapshot failed for band ${b.name}:`, err.message);
        }
      }
    } catch (err) {
      strapi.log.error('[cron] ❌ Fatal error during analytics rollup:', err);
    }
    strapi.log.info('[cron] Band analytics rollup complete.');
  },

  // 🧹 Protected media orphan cleanup — grace-period delete of unreferenced
  // conversation / ArtistUpdate protected objects, plus tagged staged gallery
  // files (public and protected) from abandoned draft sessions. Generic
  // unreferenced Strapi uploads are never touched.
  '20 4 * * *': async ({ strapi }) => {
    try {
      const { createProtectedMediaService } = require('../src/utils/artistUpdates/protectedMedia');
      const result = await createProtectedMediaService(strapi).cleanupOrphans();
      if (result?.examined || result?.deleted || result?.draftsDiscarded) {
        strapi.log.info('[cron] Protected media orphan cleanup', result);
      }
    } catch (err) {
      strapi.log.error('[cron] Protected media orphan cleanup failed', { error: err.message });
    }
  },
};
