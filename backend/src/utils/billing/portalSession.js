'use strict';

/**
 * Billing portal with consent where it can create charges (Billing A).
 *
 * Both POST /stripe/create-billing-portal-session handlers (the stripe and
 * subscription APIs register the same path) call openBillingPortal, so neither
 * route can open the portal without the same check.
 *
 *   trialing, no card       → consent required (a saved card renews at trial end)
 *   past_due/unpaid/incomplete → consent required (paying can charge now)
 *   anything else           → opens as before (managing an existing authorization)
 *   intent "cancel"         → never needs consent and never opens the portal: the
 *                             server cancels the artist's own subscription at
 *                             period end (Stripe's portal cancel flow links back to
 *                             "Add payment method", verified in test mode)
 *
 * The customer comes from the signed-in user's own row, never the body.
 */

const { resolvePreferredSubscription, hasUsablePaymentMethod } = require('./billingTruth');
const { describePortal, checkConsent, publicTerms } = require('./billingConsent');
const { recordConsent } = require('./consentRecord');
const { isBillingExemptLifetimePro } = require('./artistEntitlement');

const UP_UID = 'plugin::users-permissions.user';
const CANCELLABLE = new Set(['trialing', 'active', 'past_due', 'unpaid', 'incomplete']);

async function loadPortalState({ strapi, stripe, userId }) {
  const user = await strapi.entityService.findOne(UP_UID, userId, {
    fields: ['id', 'customerId', 'subscriptionId', 'plan', 'subscriptionStatus'],
  });
  if (!user) return { error: 'unauthorized' };
  if (!user.customerId) return { user, error: 'no_customer' };
  const customer = await stripe.customers.retrieve(user.customerId);
  const subscription = await resolvePreferredSubscription({
    dbUser: user,
    // Subscription items include their Price object by default (same as /stripe/billing).
    retrieveSubscription: (id) => stripe.subscriptions.retrieve(id),
    listSubscriptions: (customerId) => stripe.subscriptions.list({ customer: customerId, status: 'all', limit: 20 }),
  });
  const hasPaymentMethod = hasUsablePaymentMethod({ customer, subscription });
  // Lifetime Pro never pays; nothing in the portal needs consent for them.
  const terms = isBillingExemptLifetimePro(user)
    ? { action: 'portal_manage', consentRequired: false }
    : describePortal({ subscription, hasPaymentMethod });
  return { user, subscription, hasPaymentMethod, terms };
}

function consentFailure(ctx, code, terms) {
  const required = code === 'consent_required';
  ctx.status = required ? 400 : 409;
  ctx.body = {
    error: {
      status: ctx.status,
      name: required ? 'ValidationError' : 'ConflictError',
      message: required ? 'Please confirm the billing terms first.' : 'The billing terms changed. Please review them again.',
      details: { code, terms: publicTerms(terms) },
    },
  };
}

/** GET /stripe/billing-portal/terms */
async function portalTerms({ ctx, strapi, stripe }) {
  const jwtUser = ctx.state.user;
  if (!jwtUser?.id) return ctx.unauthorized('You must be logged in.');
  try {
    const state = await loadPortalState({ strapi, stripe, userId: jwtUser.id });
    if (state.error === 'unauthorized') return ctx.unauthorized('You must be logged in.');
    if (state.error === 'no_customer') return ctx.badRequest('Stripe customer not found');
    const canCancel = Boolean(state.subscription && CANCELLABLE.has(state.subscription.status));
    return ctx.send({ ...publicTerms(state.terms), canCancel });
  } catch (err) {
    strapi.log.error('[billing-portal] terms error', { userId: jwtUser.id, code: err?.code || err?.type || 'error' });
    return ctx.internalServerError('Billing is not available right now. Please try again.');
  }
}

/** POST /stripe/create-billing-portal-session  { consent?, intent? } */
async function openBillingPortal({ ctx, strapi, stripe, returnUrl }) {
  const jwtUser = ctx.state.user;
  if (!jwtUser?.id) return ctx.unauthorized('You must be logged in.');
  let state;
  try {
    state = await loadPortalState({ strapi, stripe, userId: jwtUser.id });
  } catch (err) {
    strapi.log.error('[billing-portal] state error', { userId: jwtUser.id, code: err?.code || err?.type || 'error' });
    return ctx.internalServerError('Error creating billing portal session');
  }
  if (state.error === 'unauthorized') return ctx.unauthorized('You must be logged in.');
  if (state.error === 'no_customer') return ctx.badRequest('Stripe customer not found');

  const { user, subscription, terms } = state;
  const intent = ctx.request.body?.intent;

  try {
    if (intent === 'cancel') {
      // Cancel without the portal. VERIFIED in Stripe test mode (2026-11-11): the
      // portal's subscription_cancel flow has a "Go back" link to the portal home,
      // where "Add payment method" is offered (payment_method_update is enabled
      // live), which would bypass consent. So the server cancels the artist's OWN
      // live subscription at period end: the same mode the live portal uses
      // (at_period_end, no proration). No card form is ever shown; the
      // customer.subscription.updated webhook syncs the user row as for portal cancels.
      if (!subscription || !CANCELLABLE.has(subscription.status)) {
        ctx.status = 409;
        ctx.body = { error: { status: 409, name: 'ConflictError', message: 'There is no active membership to cancel.', details: { code: 'nothing_to_cancel' } } };
        return;
      }
      if (subscription.cancel_at_period_end) {
        return ctx.send({ canceled: true, cancelAt: subscription.cancel_at || subscription.current_period_end || null, already: true });
      }
      // Setting the flag is naturally idempotent; no idempotency key, so a cancel after
      // a renewal on the same day is never answered from a cached earlier response.
      const updated = await stripe.subscriptions.update(subscription.id, { cancel_at_period_end: true });
      strapi.log.info('[billing-portal] cancel at period end', { userId: user.id });
      return ctx.send({ canceled: true, cancelAt: updated?.cancel_at || updated?.current_period_end || null });
    }

    const verdict = checkConsent(ctx.request.body?.consent, terms);
    if (!verdict.ok) return consentFailure(ctx, verdict.code, terms);

    const session = await stripe.billingPortal.sessions.create({ customer: user.customerId, return_url: returnUrl });
    if (terms.consentRequired) {
      await recordConsent({
        strapi,
        user,
        terms,
        referenceType: 'billing_portal_session',
        reference: session.id,
        subscriptionId: subscription?.id || null,
      });
    }
    return ctx.send({ url: session.url });
  } catch (err) {
    strapi.log.error('[billing-portal] error', { userId: user.id, code: err?.code || err?.type || 'error' });
    return ctx.internalServerError('Error creating billing portal session');
  }
}

module.exports = { openBillingPortal, portalTerms, loadPortalState, consentFailure, CANCELLABLE };
