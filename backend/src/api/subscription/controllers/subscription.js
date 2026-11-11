// path: src/api/subscription/controllers/subscription.js
'use strict';

// Resolved lazily so focused tests can run the real controller with a fake client.
const { lazyStripe: stripe } = require('../../../utils/billing/stripeClient');
const crypto = require('crypto');
const {
  END_TRIAL_INTENT,
  START_INTENT,
  pickSubscription,
  decideStartPro,
  returnUrls,
  computeUserBillingUpdate,
  applyEndTrial,
  findOpenSession,
} = require('../../../utils/billing/startPro');
const { allowSignup } = require('../../../utils/signupGuard');
const UNPARSED = Symbol.for('unparsedBody');
const confirmationToken = crypto.randomBytes(20).toString('hex');
const { normalizeSubscriptionStatusForUserRow } = require('../../../utils/billing/subscriptionStatus');
const { provisionStripeCustomerAndTrial } = require('../../../utils/billing/provisionStripeTrial');
const {
  planStripeSignupCleanup,
  runStripeSignupCleanup,
} = require('../../../utils/billing/stripeSignupCleanup');
const {
  buildArtistBillingFields,
  hasRequiredBillingMetadata,
} = require('../../../utils/billing/artistSignupBilling');
const {
  isBillingExemptLifetimePro,
  ambassadorSubscriptionStatusPayload,
} = require('../../../utils/billing/artistEntitlement');
const { describeStartPro, checkConsent, publicTerms } = require('../../../utils/billing/billingConsent');
const { recordConsent } = require('../../../utils/billing/consentRecord');
const { openBillingPortal, portalTerms, consentFailure } = require('../../../utils/billing/portalSession');


module.exports = {
  // GET /api/stripe/subscription-status
// GET /api/stripe/subscription-status
async subscriptionStatus(ctx) {
  strapi.log.debug('[subscriptionStatus] entry', { userId: ctx.state.user?.id });
  const jwtUser = ctx.state.user;
  if (!jwtUser) return ctx.unauthorized('You must be logged in.');

  // Load DB user (keep as-is; no schema changes)
  const [dbUser] = await strapi.entityService.findMany(
    'plugin::users-permissions.user',
    { filters: { id: jwtUser.id } }
  );

  if (isBillingExemptLifetimePro(dbUser)) {
    strapi.log.debug('[subscriptionStatus] Billing-exempt lifetime Pro, skipping Stripe', { userId: dbUser.id });
    return ctx.send(ambassadorSubscriptionStatusPayload());
  }

  if (!dbUser?.customerId) {
    strapi.log.warn('[subscriptionStatus] No Stripe customer on DB user', { userId: dbUser?.id });
    return ctx.badRequest('Stripe customer not found');
  }

  try {
    // Get latest sub from Stripe
    const subsList = await stripe.subscriptions.list({
      customer: dbUser.customerId,
      status: 'all',
      limit: 1,
    });
    const sub = subsList.data?.[0] || null;
    strapi.log.debug('[subscriptionStatus] Retrieved subscription', { subscription: sub?.id, status: sub?.status });

    // Derive live values (non-breaking)
    const planNickname =
      sub?.items?.data?.[0]?.price?.nickname ||
      sub?.items?.data?.[0]?.plan?.nickname || // legacy fallback
      null;

    // Keep frontend response in Stripe snake_case
    const liveStatusSnake = sub?.status || 'inactive';
    const liveTrialEndRaw = sub?.trial_end || null; // seconds
    const liveTrialEnd = liveTrialEndRaw ? new Date(liveTrialEndRaw * 1000) : null;

    const mapForUserRow = (s) => normalizeSubscriptionStatusForUserRow(s);

    // Prepare what's going to the user row (idempotent update)
    const nextData = {
      subscriptionStatus: mapForUserRow(liveStatusSnake),
      plan: planNickname,
      trialEndsAt: liveTrialEnd,
      // leave gracePeriodStart untouched here; webhooks control it
    };

    // Compute diff vs current dbUser to avoid unnecessary writes
    const needsUpdate =
      dbUser.subscriptionStatus !== nextData.subscriptionStatus ||
      dbUser.plan !== nextData.plan ||
      String(dbUser.trialEndsAt || '') !== String(nextData.trialEndsAt || '');

    if (needsUpdate) {
      await strapi.entityService.update('plugin::users-permissions.user', dbUser.id, { data: nextData });
      strapi.log.debug('[subscriptionStatus] user reconciled', { userId: dbUser.id, next: nextData });
    } else {
      strapi.log.debug('[subscriptionStatus] user already up-to-date', { userId: dbUser.id });
    }

    // Respond with the live truth (snake_case) for the frontend
    return ctx.send({
      status: liveStatusSnake,
      plan: planNickname,
      trialEndsAt: liveTrialEndRaw,                 // seconds (keeps your frontend math unchanged)
      gracePeriodStart: dbUser.gracePeriodStart || null,
    });
  } catch (err) {
    strapi.log.error('[subscriptionStatus] Stripe error', err);
    return ctx.throw(500, 'Error retrieving subscription status');
  }
},


  // POST /api/stripe/create-billing-portal-session
  async createBillingPortalSession(ctx) {
    // Consent is required where the portal can create charges (Billing A).
    return openBillingPortal({ ctx, strapi, stripe, returnUrl: process.env.BILLING_RETURN_URL });
  },

  // GET /api/stripe/billing-portal/terms: what opening the portal can charge, and whether consent is needed.
  async billingPortalTerms(ctx) {
    return portalTerms({ ctx, strapi, stripe });
  },

  // GET /api/stripe/start-pro/terms  ?bandId=
  // The server's own description of what Start Pro will charge, for the consent step.
  // Read-only: never creates a customer, subscription or session.
  async startProTerms(ctx) {
    const jwtUser = ctx.state.user;
    if (!jwtUser?.id) return ctx.unauthorized('You must be logged in.');
    const user = await strapi.entityService.findOne(UP_UID, jwtUser.id, {
      fields: ['id', 'customerId', 'subscriptionId', 'subscriptionStatus', 'plan', 'firstPaidAt'],
    });
    if (!user) return ctx.unauthorized('You must be logged in.');
    if (isBillingExemptLifetimePro(user)) return conflict(ctx, 'billing_exempt', 'Lifetime Pro includes payments; there is nothing to pay.');
    const priceId = process.env.STRIPE_DEFAULT_PRICE_ID;
    if (!priceId) return ctx.internalServerError('Billing is not available right now.');
    try {
      let subscription = null;
      if (user.customerId) {
        const listed = await stripe.subscriptions.list({ customer: user.customerId, status: 'all', limit: 20 });
        subscription = pickSubscription(listed?.data || []);
      }
      const decision = decideStartPro({ user, subscription });
      if (decision.action === 'refuse') {
        return conflict(ctx, decision.code, decision.code === 'already_active' ? 'Your Pro membership is already active.' : 'Nothing to pay.');
      }
      const defaultPrice = decision.action === 'new_subscription' ? await loadDefaultPrice(priceId) : null;
      return ctx.send(publicTerms(describeStartPro({ decision, subscription, defaultPrice })));
    } catch (err) {
      strapi.log.error('[start-pro] terms error', { userId: user.id, code: err?.code || err?.type || 'error' });
      return ctx.internalServerError('Billing is not available right now. Please try again.');
    }
  },

  // POST /api/stripe/webhook
  async webhook(ctx) {
    strapi.log.debug('[Webhook] Received event', { hasSignature: Boolean(ctx.request.headers['stripe-signature']) });
    const sig   = ctx.request.headers['stripe-signature'];
    const raw =
      ctx.request.body?.[UNPARSED] ||
      ctx.request.body?.data?.[UNPARSED];
    let event;

    try {
      if (!sig) return ctx.badRequest('Webhook Error: Missing stripe-signature header');

      if (!raw) {
        strapi.log.error('[Webhook] Missing raw body (unparsedBody)');
        return ctx.badRequest('Webhook Error: Missing raw body. Ensure strapi::body includeUnparsed: true and no middleware consumes the request stream.');
      }

      const secret = String(process.env.STRIPE_WEBHOOK_SECRET || '').trim();
      event = stripe.webhooks.constructEvent(raw, sig, secret);
      strapi.log.debug('[Webhook] event.type', event.type);
    } catch (e) {
      strapi.log.error('[Webhook] Signature verification failed', e.message);
      return ctx.badRequest(`Webhook Error: ${e.message}`);
    }

    // Every billing event re-reads the customer's subscriptions from Stripe and
    // stores what Stripe says now, so a late or out-of-order event can never
    // overwrite newer state, and an event about an old subscription can never
    // demote the artist's live one.
    const handler = {
      'checkout.session.completed':                  onCheckoutCompleted,
      'invoice.payment_succeeded':                   onInvoiceEvent,
      'invoice.payment_failed':                      onInvoiceEvent,
      'invoice.payment_action_required':             onInvoiceEvent,
      'payment_intent.payment_failed':               onCustomerEvent,
      'charge.failed':                               onCustomerEvent,
      'customer.subscription.updated':               onCustomerEvent,
      'customer.subscription.deleted':               onCustomerEvent,
      'customer.subscription.pending_update_applied': onCustomerEvent,
      'customer.subscription.pending_update_expired': onCustomerEvent,
      'customer.subscription.trial_will_end':        onTrialWillEnd,
    }[event.type] || onUnhandledEvent;

    try {
      await handler(event.data.object, event);
    } catch (err) {
      strapi.log.error('[Webhook] Handler error for', event.type, err);
      return ctx.internalServerError('Webhook handling failed');
    }

    ctx.send({ received: true });
  },

  // POST /api/stripe/start-pro  { bandId? }
  // Opens the right Stripe-hosted page to pay for Faneqo Pro (see utils/billing/startPro.js).
  async startPro(ctx) {
    const jwtUser = ctx.state.user;
    if (!jwtUser?.id) return ctx.unauthorized('You must be logged in.');

    const user = await strapi.entityService.findOne(UP_UID, jwtUser.id, {
      fields: ['id', 'email', 'username', 'customerId', 'subscriptionId', 'subscriptionStatus', 'plan', 'firstPaidAt', 'gracePeriodStart', 'trialEndsAt', 'cancelAt'],
    });
    if (!user) return ctx.unauthorized('You must be logged in.');
    if (isBillingExemptLifetimePro(user)) return conflict(ctx, 'billing_exempt', 'Lifetime Pro includes payments; there is nothing to pay.');

    // The return page is the artist's own editor; never another account's band.
    const rawBandId = ctx.request.body?.bandId;
    let bandId = null;
    if (rawBandId != null && rawBandId !== '') {
      bandId = Number(rawBandId);
      if (!Number.isInteger(bandId) || bandId <= 0) return ctx.badRequest('Invalid band.');
      const band = await strapi.entityService.findOne('api::band.band', bandId, {
        fields: ['id'],
        populate: { users_permissions_user: { fields: ['id'] } },
        publicationState: 'preview',
      });
      if (!band || String(band.users_permissions_user?.id) !== String(user.id)) return ctx.forbidden('Not your band.');
    }

    const priceId = process.env.STRIPE_DEFAULT_PRICE_ID;
    if (!priceId) {
      strapi.log.error('[start-pro] STRIPE_DEFAULT_PRICE_ID is not configured');
      return ctx.internalServerError('Billing is not available right now.');
    }

    try {
      // A customer is required; artists from before billing (no customer) get one now.
      let customerId = user.customerId;
      if (!customerId) {
        const found = await stripe.customers.list({ email: user.email, limit: 1 });
        const customer = found.data?.[0] || (await stripe.customers.create(
          { email: user.email, name: user.username, metadata: { appUserId: String(user.id) } },
          { idempotencyKey: `start-pro-customer-${user.id}` }
        ));
        customerId = customer.id;
        await strapi.entityService.update(UP_UID, user.id, { data: { customerId } });
      }

      const listed = await stripe.subscriptions.list({ customer: customerId, status: 'all', limit: 20, expand: ['data.latest_invoice'] });
      const subscription = pickSubscription(listed?.data || []);
      const decision = decideStartPro({ user, subscription });
      if (decision.action === 'refuse') {
        return conflict(ctx, decision.code, decision.code === 'already_active' ? 'Your Pro membership is already active.' : 'Nothing to pay.');
      }

      // Billing A: explicit consent to the server's own terms, never the client's price.
      const defaultPrice = decision.action === 'new_subscription' ? await loadDefaultPrice(priceId) : null;
      const terms = describeStartPro({ decision, subscription, defaultPrice });
      const verdict = checkConsent(ctx.request.body?.consent, terms);
      if (!verdict.ok) return consentFailure(ctx, verdict.code, terms);
      const consentFor = (referenceType, reference) =>
        recordConsent({ strapi, user, terms, referenceType, reference, subscriptionId: subscription?.id || null, bandId });
      // Billing B: Stripe Checkout shows the same server-built terms above its button.
      const customText = { submit: { message: terms.checkoutMessage } };

      const urls = returnUrls({ appUrl: process.env.PUBLIC_APP_URL, bandId });
      const bucket = Math.floor(Date.now() / (10 * 60 * 1000));

      if (decision.action === 'pay_invoice') {
        const invoice = subscription.latest_invoice && typeof subscription.latest_invoice === 'object' ? subscription.latest_invoice : null;
        if (invoice?.status === 'open' && invoice.hosted_invoice_url) {
          await consentFor('invoice', invoice.id);
          return ctx.send({ url: invoice.hosted_invoice_url, kind: 'invoice' });
        }
        // No payable invoice on file: the billing portal can update the card.
        const portal = await stripe.billingPortal.sessions.create({ customer: customerId, return_url: urls.cancel_url.replace('?billing=canceled', '?billing=return') });
        await consentFor('billing_portal_session', portal.id);
        return ctx.send({ url: portal.url, kind: 'portal' });
      }

      if (decision.action === 'end_trial') {
        const open = await findOpenSession({ stripe, customer: customerId, mode: 'setup', intent: END_TRIAL_INTENT, termsKey: terms.termsKey });
        if (open) {
          await consentFor('checkout_session', open.id);
          return ctx.send({ url: open.url, kind: 'end_trial' });
        }
        const session = await stripe.checkout.sessions.create(
          {
            mode: 'setup',
            customer: customerId,
            currency: 'usd',
            payment_method_types: ['card'],
            ...urls,
            custom_text: customText,
            metadata: { faneqo_intent: END_TRIAL_INTENT, userId: String(user.id), subscriptionId: subscription.id, consent_version: terms.version, terms_key: terms.termsKey },
          },
          { idempotencyKey: `start-pro-setup-v2-${user.id}-${bandId || 0}-${terms.termsKey}-${bucket}` }
        );
        await consentFor('checkout_session', session.id);
        strapi.log.info('[start-pro] setup session opened', { userId: user.id });
        return ctx.send({ url: session.url, kind: 'end_trial' });
      }

      // new_subscription: trial over, canceled, or never subscribed
      const open = await findOpenSession({ stripe, customer: customerId, mode: 'subscription', intent: START_INTENT, termsKey: terms.termsKey });
      if (open) {
        await consentFor('checkout_session', open.id);
        return ctx.send({ url: open.url, kind: 'subscription' });
      }
      const session = await stripe.checkout.sessions.create(
        {
          mode: 'subscription',
          customer: customerId,
          line_items: [{ price: priceId, quantity: 1 }],
          ...urls,
          custom_text: customText,
          metadata: { faneqo_intent: START_INTENT, userId: String(user.id), consent_version: terms.version, terms_key: terms.termsKey },
          subscription_data: { metadata: { userId: String(user.id), consent_version: terms.version, terms_key: terms.termsKey } },
        },
        { idempotencyKey: `start-pro-sub-v2-${user.id}-${bandId || 0}-${terms.termsKey}-${bucket}` }
      );
      await consentFor('checkout_session', session.id);
      strapi.log.info('[start-pro] subscription checkout opened', { userId: user.id });
      return ctx.send({ url: session.url, kind: 'subscription' });
    } catch (err) {
      strapi.log.error('[start-pro] Stripe error', { userId: user.id, code: err?.code || err?.type || 'error' });
      return ctx.internalServerError('Billing is not available right now. Please try again.');
    }
  },

  // GET /api/stripe/start-pro/confirm?session_id=cs_...
  // Called by the editor on return from Stripe. Verifies with Stripe, never the URL.
  async startProConfirm(ctx) {
    const jwtUser = ctx.state.user;
    if (!jwtUser?.id) return ctx.unauthorized('You must be logged in.');
    const sessionId = String(ctx.query?.session_id || '');
    if (!/^cs_[A-Za-z0-9_]{8,200}$/.test(sessionId)) return ctx.badRequest('Invalid session.');

    const user = await strapi.entityService.findOne(UP_UID, jwtUser.id, {
      fields: ['id', 'customerId', 'subscriptionStatus', 'plan', 'firstPaidAt'],
    });
    if (!user) return ctx.unauthorized('You must be logged in.');
    if (isBillingExemptLifetimePro(user)) return conflict(ctx, 'billing_exempt', 'Lifetime Pro includes payments.');

    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['setup_intent'] });
      const sessionCustomer = typeof session.customer === 'string' ? session.customer : session.customer?.id;
      if (!user.customerId || sessionCustomer !== user.customerId) return ctx.forbidden('Not your checkout.');

      let result = { outcome: session.status === 'expired' ? 'expired' : 'open' };
      if (session.status === 'complete') {
        if (session.mode === 'setup' && session.metadata?.faneqo_intent === END_TRIAL_INTENT) {
          result = await applyEndTrial({ stripe, session, log: strapi.log });
        } else if (session.mode === 'subscription') {
          result = { outcome: session.payment_status === 'paid' ? 'paid' : 'pending' };
        }
      }
      const synced = await syncCustomer(user.customerId);
      const fresh = synced?.user || user;
      ctx.set('Cache-Control', 'no-store');
      return ctx.send({
        outcome: result.outcome,
        invoiceUrl: result.invoiceUrl || null,
        subscriptionStatus: fresh.subscriptionStatus || null,
        paid: Boolean(fresh.firstPaidAt) && fresh.subscriptionStatus === 'active',
      });
    } catch (err) {
      strapi.log.error('[start-pro] confirm failed', { userId: user.id, code: err?.code || err?.type || 'error' });
      return ctx.internalServerError('We could not confirm with Stripe yet. Please check again shortly.');
    }
  },

// POST /api/stripe/register
async register(ctx) {
  // Never log the body: it carries the password
  const { name, email: rawEmail, password, refCode } = ctx.request.body || {};
  // Strapi's login lowercases the identifier, so store and compare lowercase
  const email = typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase() : '';
  if (!name || !email || !password) {
    strapi.log.warn('[register] missing parameters', { hasName: !!name, hasEmail: !!email, hasPassword: !!password });
    return ctx.badRequest('Missing name, email or password.');
  }

  if (!allowSignup(ctx)) {
    strapi.log.warn('[register] signup rate limit reached');
    ctx.status = 429;
    ctx.body = { error: { status: 429, name: 'TooManyRequestsError', message: 'Too many sign-up attempts. Please try again later.' } };
    return;
  }

  const existingUser = await strapi.db.query('plugin::users-permissions.user').findOne({
    where: { email: { $eqi: email } },
    select: ['id'],
  });
  if (existingUser) {
    strapi.log.warn('[register] User already exists');
    return ctx.badRequest('An account with this email already exists. Please login instead.');
  }

  const priceId = process.env.STRIPE_DEFAULT_PRICE_ID;
  if (!priceId) {
    strapi.log.error('[register] STRIPE_DEFAULT_PRICE_ID is not configured');
    return ctx.internalServerError('Stripe configuration error — missing default price ID.');
  }
  strapi.log.debug('[register] using Stripe price ID:', priceId);

  let provision;
  try {
    provision = await provisionStripeCustomerAndTrial({
      stripe,
      email,
      name,
      priceId,
      trialDays: Number(process.env.STRIPE_TRIAL_DAYS || 30),
      log: strapi.log,
    });
  } catch (err) {
    if (err?.code === 'missing_price_id') {
      return ctx.internalServerError('Stripe configuration error — missing default price ID.');
    }
    strapi.log.error('[register] Stripe customer/subscription provisioning failed', err);
    if (err?.createdCustomer && err?.customerId) {
      await runStripeSignupCleanup({
        stripe,
        plan: planStripeSignupCleanup({
          createdCustomer: true,
          createdSubscription: false,
          customerId: err.customerId,
        }),
        log: strapi.log,
      });
    }
    if (err?.code === 'stripe_customer') {
      return ctx.internalServerError('Failed to create Stripe customer.');
    }
    return ctx.internalServerError('Failed to create Stripe subscription.');
  }

  const billingFields = buildArtistBillingFields({
    customerId: provision.customerId,
    subscription: provision.subscription,
    subscriptionId: provision.subscriptionId,
  });

  const confirmationToken = crypto.randomBytes(20).toString('hex');
  let newUser;
  try {
    const authRole = await strapi
      .query('plugin::users-permissions.role')
      .findOne({ where: { type: 'authenticated' } });
    strapi.log.debug('[register] using authenticated role', { roleId: authRole.id });

    const createData = {
      username: email,
      email,
      password,
      provider: 'local',
      confirmed: true,
      confirmationToken,
      role: authRole.id,
      ...billingFields,
    };

    if (refCode) {
      const normalizedCode = refCode.trim().toLowerCase();
      try {
        const marketers = await strapi.entityService.findMany('api::marketer.marketer', {
          filters: { code: normalizedCode, isActive: true },
          limit: 1,
        });
        if (marketers.length > 0) {
          createData.referredByMarketer = marketers[0].id;
          createData.marketerCodeUsed = normalizedCode;
          createData.referredAt = new Date();
        }
      } catch (marketerErr) {
        strapi.log.error('[register] Marketer lookup failed, continuing', marketerErr);
      }
    }

    newUser = await strapi
      .plugin('users-permissions')
      .service('user')
      .add(createData);
    strapi.log.info('[register] Strapi user created', { userId: newUser.id });
  } catch (err) {
    strapi.log.error('[register] Strapi user creation failed', err);
    await runStripeSignupCleanup({
      stripe,
      plan: planStripeSignupCleanup({
        createdCustomer: provision.createdCustomer,
        createdSubscription: provision.createdSubscription,
        customerId: provision.customerId,
        subscriptionId: provision.subscriptionId,
      }),
      log: strapi.log,
    });
    return ctx.internalServerError('Failed to create user account.');
  }

  let persisted = newUser;
  if (!hasRequiredBillingMetadata(persisted)) {
    try {
      persisted = await strapi.entityService.update(
        'plugin::users-permissions.user',
        newUser.id,
        { data: billingFields }
      );
    } catch (err) {
      strapi.log.error('[register] required Stripe metadata persist failed', err);
      return ctx.internalServerError('Failed to persist billing information.');
    }
  }

  if (!hasRequiredBillingMetadata(persisted)) {
    strapi.log.error('[register] user exists without required Stripe metadata', { userId: newUser.id });
    return ctx.internalServerError('Failed to persist billing information.');
  }

  try {
    const confirmUrl = `https://qrserver-production.up.railway.app/api/auth/confirm-email?token=${confirmationToken}`;
    strapi.log.debug('[register] sending confirmation email', { to: email, confirmUrl });
    await strapi
      .plugin('email')
      .service('email')
      .send({
        to:      email,
        from:    process.env.EMAIL_DEFAULT_FROM || 'Faneqo <noreply@mail.faneqo.com>',
        subject: 'Confirm your Faneqo account',
        text:    `Hi ${name},\n\nWelcome to Faneqo! Please confirm your email address by clicking the link below:\n\n${confirmUrl}\n\nThank you,\nThe Faneqo Team`,
        html:    `<div style="font-family:ui-sans-serif,system-ui,Arial;line-height:1.5;"><h2>Welcome to Faneqo!</h2><p>Hi ${name},</p><p>Please confirm your email address to activate your account:</p><p><a href="${confirmUrl}" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;">Confirm Email</a></p><p style="margin-top:16px;color:#6b7280;font-size:13px;">Or paste this link into your browser:<br>${confirmUrl}</p><p>Thank you,<br>The Faneqo Team</p></div>`,
      });
    strapi.log.info('[register] confirmation email sent');
  } catch (err) {
    strapi.log.error('[register] failed to send confirmation email', err);
  }

  strapi.log.debug('[register] completed successfully');
  return ctx.send({
    user:    { id: persisted.id, email: persisted.email },
    message: 'Registration successful! Please check your email to confirm your account.',
  });
},

};

// ─── Handlers ────────────────────────────────────────────────────────────────

// Complimentary Lifetime Pro (plan or status "free") is never rewritten by a
// Stripe event: a leftover customer/subscription from before the grant must
// not mark the account active, past due or canceled.
/** The configured default Pro price from Stripe (for new subscriptions), or null if unreadable. */
async function loadDefaultPrice(priceId) {
  try {
    return await stripe.prices.retrieve(priceId);
  } catch {
    return null;
  }
}

function conflict(ctx, code, message) {
  ctx.status = 409;
  ctx.body = { error: { status: 409, name: 'ConflictError', message, details: { code } } };
}

function skipLifetimePro(user) {
  if (!isBillingExemptLifetimePro(user)) return false;
  strapi.log.info('[Webhook] Skipping billing-exempt lifetime Pro', { userId: user.id });
  return true;
}

const UP_UID = 'plugin::users-permissions.user';

/**
 * Bring one customer's user row in step with Stripe. Lifetime Pro is never
 * rewritten. `invoice` (from an invoice event) can prove the first payment.
 */
async function syncCustomer(customerId, { invoice = null } = {}) {
  if (!customerId) return null;
  const [user] = await strapi.entityService.findMany(UP_UID, { filters: { customerId } });
  if (!user) {
    strapi.log.warn('[Webhook] No user for customer');
    return null;
  }
  if (skipLifetimePro(user)) return { user, subscription: null };

  const listed = await stripe.subscriptions.list({ customer: customerId, status: 'all', limit: 20, expand: ['data.latest_invoice'] });
  const subscription = pickSubscription(listed?.data || []);
  const live = (listed?.data || []).filter((s) => ['active', 'past_due', 'unpaid', 'trialing'].includes(s.status));
  if (live.length > 1) {
    // Never cancel anything automatically: flag it for an operator.
    strapi.log.error('[billing] customer has more than one live subscription; review', { userId: user.id, count: live.length });
  }
  const data = computeUserBillingUpdate({ user, subscription, invoice });
  if (Object.keys(data).length) {
    await strapi.entityService.update(UP_UID, user.id, { data });
    strapi.log.info('[Webhook] Billing synced from Stripe', {
      userId: user.id,
      status: data.subscriptionStatus || user.subscriptionStatus,
      firstPaid: Boolean(data.firstPaidAt),
    });
  }
  return { user: { ...user, ...data }, subscription };
}

async function onCheckoutCompleted(session) {
  strapi.log.debug('[Webhook] checkout.session.completed', { mode: session.mode || null });
  if (session.mode === 'setup' && session.metadata?.faneqo_intent === END_TRIAL_INTENT) {
    const [owner] = await strapi.entityService.findMany(UP_UID, { filters: { customerId: session.customer } });
    if (owner && !skipLifetimePro(owner)) {
      const result = await applyEndTrial({ stripe, session, log: strapi.log });
      strapi.log.info('[start-pro] trial end from webhook', { userId: owner.id, outcome: result.outcome });
    }
  }
  if (!session.customer) return;
  await syncCustomer(typeof session.customer === 'string' ? session.customer : session.customer.id);
}

async function onInvoiceEvent(invoice) {
  await syncCustomer(invoice.customer, { invoice });
}

async function onCustomerEvent(object) {
  await syncCustomer(object.customer);
}

async function onTrialWillEnd(subscription) {
  strapi.log.info('[Webhook] trial ends soon', { subscription: subscription.id });
}

async function onUnhandledEvent(data, event) {
  strapi.log.info('[Webhook] Unhandled event', event.type);
}

