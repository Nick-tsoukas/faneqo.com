'use strict';

/**
 * support-moment controller: the public payment receipt.
 *
 * New receipts are looked up by an unguessable receiptToken. The old
 * /support-moments/:id/summary route stays for links issued before tokens
 * existed, but only for token-less payments from the last 30 days, so
 * sequential ids can no longer walk the payment history.
 */

const { createCoreController } = require('@strapi/strapi').factories;

const StripePackage = require('stripe');
const Stripe = StripePackage.default || StripePackage;
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
const { createSupportMomentSync } = require('../../../utils/payments/supportMomentSync');

const UID = 'api::support-moment.support-moment';
const LEGACY_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
const FIELDS = ['id', 'amount', 'amountCents', 'refundedAmountCents', 'currency', 'supportLabel', 'status', 'bandNameSnapshot', 'bandSlugSnapshot', 'paidAt', 'createdAt', 'receiptToken'];

/** The only shape the public ever sees: no Stripe ids, no customer data. */
function toPublic(sm) {
  if (!sm) return null;
  const amountCents = Number.isInteger(sm.amountCents) ? sm.amountCents : Math.round(Number(sm.amount || 0) * 100);
  const token = sm.receiptToken || '';
  return {
    reference: token ? `FQ-${token.slice(0, 8).toUpperCase()}` : `FQ-${String(sm.id).padStart(6, '0')}`,
    status: sm.status || 'pending',
    amountCents,
    refundedAmountCents: Number(sm.refundedAmountCents) || 0,
    currency: (sm.currency || 'usd').toLowerCase(),
    description: sm.supportLabel || null,
    recipientName: sm.bandNameSnapshot || null,
    recipientSlug: sm.bandSlugSnapshot || null,
    paidAt: sm.paidAt || null,
    createdAt: sm.createdAt || null,
    // Legacy fields kept for older frontends
    amount: amountCents / 100,
    supportLabel: sm.supportLabel || null,
    bandNameSnapshot: sm.bandNameSnapshot || null,
  };
}

module.exports = createCoreController(UID, ({ strapi }) => {
  const sync = createSupportMomentSync({ strapi, stripe });

  async function respond(ctx, sm) {
    if (!sm) return ctx.notFound('Receipt not found');
    // Still pending: ask Stripe directly once (idempotent, never creates charges)
    if (sm.status === 'pending') {
      await sync.reconcilePending(sm.id);
      sm = await strapi.entityService.findOne(UID, sm.id, { fields: FIELDS, publicationState: 'preview' });
    }
    ctx.set('Cache-Control', 'no-store');
    ctx.body = { data: toPublic(sm) };
  }

  return {
    async receipt(ctx) {
      const token = String(ctx.params.token || '').trim();
      if (!/^[A-Za-z0-9_-]{16,64}$/.test(token)) return ctx.notFound('Receipt not found');
      const rows = await strapi.entityService.findMany(UID, {
        filters: { receiptToken: token },
        fields: FIELDS,
        limit: 1,
        publicationState: 'preview',
      });
      return respond(ctx, rows?.[0] || null);
    },

    async summary(ctx) {
      const id = Number(ctx.params.id);
      if (!Number.isInteger(id) || id <= 0) return ctx.notFound('Receipt not found');
      const sm = await strapi.entityService.findOne(UID, id, { fields: FIELDS, publicationState: 'preview' });
      const recent = sm && Date.now() - new Date(sm.createdAt).getTime() < LEGACY_WINDOW_MS;
      if (!sm || sm.receiptToken || !recent) return ctx.notFound('Receipt not found');
      return respond(ctx, sm);
    },
  };
});

module.exports.toPublic = toPublic;
