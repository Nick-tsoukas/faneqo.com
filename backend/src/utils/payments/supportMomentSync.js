'use strict';

/**
 * Keeps a support-moment (one fan payment through an artist's payment button)
 * in step with Stripe. Stripe is the authority; every update writes absolute
 * values read from Stripe objects, so replays and out-of-order events converge.
 *
 * Internal statuses:
 *   pending             checkout created, not yet paid
 *   paid                Stripe reports the payment succeeded
 *   partially_refunded  succeeded, some of it refunded
 *   refunded            succeeded, fully refunded
 *   disputed            a dispute is open, or was lost (see disputeStatus)
 *   failed              an async payment method failed
 *   canceled            the Checkout Session expired unpaid
 *
 * Revenue counts only paid / partially_refunded / refunded / disputed rows
 * (money that actually moved), with refunds reported separately.
 */

const SUCCEEDED = ['paid', 'partially_refunded', 'refunded', 'disputed'];
const UID = 'api::support-moment.support-moment';
const OPEN_DISPUTE = new Set(['warning_needs_response', 'warning_under_review', 'needs_response', 'under_review']);

const idOf = (v) => (typeof v === 'string' ? v : v?.id || null);

/** Status from the charge's refund state (dispute handled separately). */
function statusFromRefunds(amountCents, refundedCents) {
  const refunded = Number(refundedCents) || 0;
  if (refunded <= 0) return 'paid';
  return refunded >= Number(amountCents) ? 'refunded' : 'partially_refunded';
}

/** Fee and net figures from a connected-account balance transaction (direct charge). */
function moneyFromBalanceTransaction(bt) {
  if (!bt || typeof bt !== 'object') return {};
  const details = Array.isArray(bt.fee_details) ? bt.fee_details : [];
  const sum = (type) => details.filter((d) => d.type === type).reduce((n, d) => n + (Number(d.amount) || 0), 0);
  return {
    stripeFeeCents: sum('stripe_fee'),
    platformFeeCents: sum('application_fee'),
    netCents: Number.isFinite(Number(bt.net)) ? Number(bt.net) : null,
  };
}

/** Fields to write once Stripe says the PaymentIntent succeeded. */
function paidFieldsFromPaymentIntent(pi, { amountTotal } = {}) {
  const charge = pi && typeof pi.latest_charge === 'object' ? pi.latest_charge : null;
  const amountCents = Number(charge?.amount ?? pi?.amount_received ?? amountTotal) || null;
  const refundedCents = Number(charge?.amount_refunded) || 0;
  const money = moneyFromBalanceTransaction(charge?.balance_transaction);
  const fields = {
    stripePaymentIntentId: pi?.id || null,
    stripeChargeId: charge?.id || idOf(pi?.latest_charge),
    amountCents,
    refundedAmountCents: refundedCents,
    platformFeeCents: money.platformFeeCents ?? (Number(pi?.application_fee_amount) || 0),
    ...('stripeFeeCents' in money ? { stripeFeeCents: money.stripeFeeCents, netCents: money.netCents } : {}),
  };
  if (amountCents) fields.status = statusFromRefunds(amountCents, refundedCents);
  return fields;
}

function createSupportMomentSync({ strapi, stripe }) {
  const db = () => strapi.entityService;
  const log = strapi.log;

  async function load(id) {
    if (!id) return null;
    return db().findOne(UID, id, {
      fields: ['id', 'status', 'amount', 'amountCents', 'refundedAmountCents', 'paidAt', 'stripeCheckoutSessionId', 'stripePaymentIntentId', 'stripeChargeId'],
      populate: { band: { fields: ['id', 'stripeAccountId'] } },
      publicationState: 'preview',
    });
  }

  async function findByCharge(chargeId, paymentIntentId) {
    const or = [];
    if (chargeId) or.push({ stripeChargeId: chargeId });
    if (paymentIntentId) or.push({ stripePaymentIntentId: paymentIntentId });
    if (!or.length) return null;
    const rows = await db().findMany(UID, { filters: { $or: or }, fields: ['id'], limit: 1, publicationState: 'preview' });
    return rows?.[0] ? load(rows[0].id) : null;
  }

  /** Only accept Stripe data from the artist's own connected account. */
  function accountMatches(sm, account) {
    const expected = sm?.band?.stripeAccountId || null;
    if (!expected || !account || expected !== account) {
      log.warn('[payments sync] connected account mismatch; ignoring', { supportMomentId: sm?.id, account, expected: expected ? 'set' : 'missing' });
      return false;
    }
    return true;
  }

  // Stripe attaches the balance transaction (which carries the fees) a moment
  // after the charge succeeds, so look again briefly before giving up. Rows that
  // still have no fees are filled later by scripts/backfill-payment-fees.js.
  async function retrievePaymentIntent(piId, account, { attempts = 3, delayMs = 1000 } = {}) {
    let pi = null;
    for (let i = 0; i < attempts; i++) {
      if (i) await new Promise((r) => setTimeout(r, delayMs));
      pi = await stripe.paymentIntents.retrieve(piId, { expand: ['latest_charge.balance_transaction'] }, { stripeAccount: account });
      const charge = pi?.latest_charge;
      if (!charge || typeof charge !== 'object' || (charge.balance_transaction && typeof charge.balance_transaction === 'object')) break;
    }
    return pi;
  }

  /**
   * A Checkout Session reported complete (webhook or receipt self-heal).
   * Marks the payment paid only when Stripe says payment_status is 'paid'.
   */
  async function applyCheckoutSession(session, account) {
    const sm = await load(session?.metadata?.supportMomentId);
    if (!sm) return { handled: false };
    if (!accountMatches(sm, account)) return { handled: true, ignored: true };

    const updates = { stripeCheckoutSessionId: session.id || sm.stripeCheckoutSessionId };

    if (session.status === 'expired') {
      if (sm.status === 'pending') updates.status = 'canceled';
    } else if (session.payment_status === 'paid') {
      let pi = typeof session.payment_intent === 'object' ? session.payment_intent : null;
      const piId = idOf(session.payment_intent);
      const hasFees = pi?.latest_charge && typeof pi.latest_charge === 'object' && pi.latest_charge.balance_transaction && typeof pi.latest_charge.balance_transaction === 'object';
      if (piId && !hasFees) {
        try { pi = await retrievePaymentIntent(piId, account) } catch (e) { log.warn('[payments sync] PaymentIntent lookup failed', { supportMomentId: sm.id, message: e?.message }) }
      }
      const paid = pi ? paidFieldsFromPaymentIntent(pi, { amountTotal: session.amount_total }) : { stripePaymentIntentId: piId, amountCents: Number(session.amount_total) || null, status: 'paid' };
      // Never move a refunded or disputed payment back to plain "paid"
      if (!['pending', 'failed', 'canceled'].includes(sm.status)) delete paid.status;
      Object.assign(updates, paid);
      if (!sm.paidAt) updates.paidAt = new Date().toISOString();
    } else {
      return { handled: true, status: sm.status }; // unpaid / async still processing: leave as is
    }

    await db().update(UID, sm.id, { data: updates });
    return { handled: true, status: updates.status || sm.status };
  }

  async function markAsyncFailed(session, account) {
    const sm = await load(session?.metadata?.supportMomentId);
    if (!sm || !accountMatches(sm, account)) return { handled: !!sm };
    if (sm.status === 'pending') await db().update(UID, sm.id, { data: { status: 'failed' } });
    return { handled: true };
  }

  /** Locate a payment from a charge, falling back to the Checkout Session's metadata. */
  async function findForCharge(charge, account) {
    let sm = await findByCharge(charge.id, idOf(charge.payment_intent));
    if (!sm && charge.payment_intent && account) {
      try {
        const list = await stripe.checkout.sessions.list({ payment_intent: idOf(charge.payment_intent), limit: 1 }, { stripeAccount: account });
        sm = await load(list?.data?.[0]?.metadata?.supportMomentId);
      } catch (e) { log.warn('[payments sync] session lookup by charge failed', { message: e?.message }) }
    }
    return sm;
  }

  /** charge.refunded: record the refunded amount as Stripe reports it. */
  async function applyChargeRefund(charge, account) {
    const sm = await findForCharge(charge, account);
    if (!sm) return { handled: false };
    if (!accountMatches(sm, account)) return { handled: true, ignored: true };
    const amountCents = Number(charge.amount) || sm.amountCents || Math.round(Number(sm.amount || 0) * 100);
    // amount_refunded is cumulative and refunds only grow, so a late, stale event never shrinks it
    const refunded = Math.max(Number(charge.amount_refunded) || 0, Number(sm.refundedAmountCents) || 0);
    const data = { refundedAmountCents: refunded, stripeChargeId: charge.id, amountCents };
    if (refunded > 0) data.refundedAt = new Date().toISOString();
    if (sm.status !== 'disputed') data.status = statusFromRefunds(amountCents, refunded);
    await db().update(UID, sm.id, { data });
    return { handled: true, status: data.status || sm.status };
  }

  /** charge.dispute.created / updated / closed. */
  async function applyDispute(dispute, account) {
    const chargeId = idOf(dispute.charge);
    const sm = await findByCharge(chargeId, idOf(dispute.payment_intent));
    if (!sm) return { handled: false };
    if (!accountMatches(sm, account)) return { handled: true, ignored: true };
    const data = { disputeStatus: dispute.status };
    if (OPEN_DISPUTE.has(dispute.status) || dispute.status === 'lost') {
      data.status = 'disputed';
    } else {
      // Won (or warning closed): back to the refund-derived status
      let refunded = 0
      try { refunded = Number((await stripe.charges.retrieve(chargeId, {}, { stripeAccount: account }))?.amount_refunded) || 0 } catch {}
      data.status = statusFromRefunds(sm.amountCents || Math.round(Number(sm.amount || 0) * 100), refunded);
    }
    await db().update(UID, sm.id, { data });
    return { handled: true, status: data.status };
  }

  /** Receipt self-heal: ask Stripe directly about a still-pending payment. */
  async function reconcilePending(id) {
    const sm = await load(id);
    if (!sm || sm.status !== 'pending' || !sm.stripeCheckoutSessionId) return sm;
    const account = sm.band?.stripeAccountId;
    if (!account) return sm;
    try {
      const session = await stripe.checkout.sessions.retrieve(sm.stripeCheckoutSessionId, { expand: ['payment_intent.latest_charge.balance_transaction'] }, { stripeAccount: account });
      await applyCheckoutSession(session, account);
    } catch (e) {
      log.warn('[payments sync] receipt reconcile failed', { supportMomentId: id, message: e?.message });
    }
    return load(id);
  }

  return { applyCheckoutSession, markAsyncFailed, applyChargeRefund, applyDispute, reconcilePending };
}

module.exports = { SUCCEEDED, statusFromRefunds, moneyFromBalanceTransaction, paidFieldsFromPaymentIntent, createSupportMomentSync };
