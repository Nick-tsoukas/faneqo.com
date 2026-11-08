// path: src/api/subscription/controllers/subscription.js
'use strict';

const { default: Stripe } = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
const crypto = require('crypto');
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
    strapi.log.debug('[createBillingPortalSession] entry', { user: ctx.state.user });
    const jwtUser = ctx.state.user;
    if (!jwtUser?.id) return ctx.unauthorized('You must be logged in.');

    let user;
    try {
      user = await strapi.entityService.findOne(
        'plugin::users-permissions.user',
        jwtUser.id,
        { fields: ['customerId'] }
      );
      strapi.log.debug('[createBillingPortalSession] loaded user', user);
    } catch (e) {
      strapi.log.error('[createBillingPortalSession] fetch error', e);
      return ctx.internalServerError('Error loading user data');
    }

    if (!user?.customerId) {
      strapi.log.warn('[createBillingPortalSession] no customerId', { userId: jwtUser.id });
      return ctx.badRequest('Stripe customer not found');
    }

    try {
      strapi.log.debug('[createBillingPortalSession] creating session for', user.customerId);
      const session = await stripe.billingPortal.sessions.create({
        customer:   user.customerId,
        return_url: process.env.BILLING_RETURN_URL,
      });
      strapi.log.debug('[createBillingPortalSession] session created', session);
      ctx.send({ url: session.url });
    } catch (err) {
      strapi.log.error('[createBillingPortalSession] Stripe error', err);
      ctx.throw(500,'Error creating billing portal session');
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

    const handler = {
      'checkout.session.completed':    onCheckoutCompleted,
      'invoice.payment_succeeded':     onInvoicePaid,
      'invoice.payment_failed':        onInvoiceFailed,
      'payment_intent.payment_failed': onInvoiceFailed,
      'charge.failed':                 onInvoiceFailed,
      'customer.subscription.updated': onSubscriptionUpdated,
      'customer.subscription.deleted': onSubscriptionCanceled,
    }[event.type] || onUnhandledEvent;

    try {
      await handler(event.data.object, event);
    } catch (err) {
      strapi.log.error('[Webhook] Handler error for', event.type, err);
      return ctx.internalServerError('Webhook handling failed');
    }

    ctx.send({ received: true });
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
function skipLifetimePro(user) {
  if (!isBillingExemptLifetimePro(user)) return false;
  strapi.log.info('[Webhook] Skipping billing-exempt lifetime Pro', { userId: user.id });
  return true;
}

async function onCheckoutCompleted(session) {
  strapi.log.debug('[Webhook] checkout.session.completed', session.id);
  if (!session.subscription) return;
  const [user] = await strapi.entityService.findMany('plugin::users-permissions.user', {
    filters: { customerId: session.customer }
  });
  if (!user) return strapi.log.warn('[Webhook] No user for customer', session.customer);
  if (skipLifetimePro(user)) return;

  const isTrial = Boolean(session.trial_end);
  await strapi.entityService.update('plugin::users-permissions.user', user.id, {
    data: {
      subscriptionStatus: isTrial ? 'trialing' : 'active',
      subscriptionId:     session.subscription,
      trialEndsAt:        isTrial ? new Date(session.trial_end * 1000) : null,
      gracePeriodStart:   null,
      cancelAt:           null
    }
  });
  strapi.log.info('[Webhook] User marked', { userId: user.id, status: isTrial ? 'trialing' : 'active' });
}

async function onInvoicePaid(invoice) {
  strapi.log.debug('[Webhook] invoice.payment_succeeded', invoice.id);

  const amountPaid = Number(invoice.amount_paid ?? 0);
  const amountTotal = Number(invoice.total ?? 0);
  const paidFlag = invoice.paid === true;
  const effectivePaid = amountPaid || amountTotal;

  // Skip truly $0 invoices (trial start, coupons, etc.)
  if (!paidFlag || effectivePaid <= 0) return;

  const [user] = await strapi.entityService.findMany('plugin::users-permissions.user', {
    filters: { customerId: invoice.customer }
  });
  if (!user) return;
  if (skipLifetimePro(user)) return;

  await strapi.entityService.update('plugin::users-permissions.user', user.id, {
    data: {
      subscriptionStatus:  'active',
      subscriptionId:      invoice.subscription,
      trialEndsAt:         null,
      gracePeriodStart:    null,
      cancelAt:            null
    }
  });
  strapi.log.info('[Webhook] User marked active', { userId: user.id });
}

async function onInvoiceFailed(data) {
  strapi.log.debug('[Webhook] invoice.payment_failed', data.id);
  const [user] = await strapi.entityService.findMany('plugin::users-permissions.user', {
    filters: { customerId: data.customer }
  });
  if (!user) return;
  if (skipLifetimePro(user)) return;

  const updates = { subscriptionStatus: 'pastDue' };
  if (!user.gracePeriodStart) updates.gracePeriodStart = new Date();

  await strapi.entityService.update('plugin::users-permissions.user', user.id, { data: updates });
  strapi.log.info('[Webhook] User marked pastDue', { userId: user.id });
}

async function onSubscriptionUpdated(subscription) {
  strapi.log.debug('[Webhook] customer.subscription.updated', {
    id:                   subscription.id,
    status:               subscription.status,
    customer:             subscription.customer,
    cancel_at_period_end: subscription.cancel_at_period_end,
    cancel_at:            subscription.cancel_at
  });

  // Try to find user by subscriptionId first
  let [user] = await strapi.entityService.findMany('plugin::users-permissions.user', {
    filters: { subscriptionId: subscription.id },
    limit: 1,
    fields: ['id', 'subscriptionStatus', 'subscriptionId', 'plan', 'trialEndsAt', 'gracePeriodStart', 'cancelAt']
  });

  // Fallback: find by customerId if subscriptionId lookup fails
  if (!user && subscription.customer) {
    strapi.log.debug('[Webhook] No user found by subscriptionId, trying customerId', subscription.customer);
    [user] = await strapi.entityService.findMany('plugin::users-permissions.user', {
      filters: { customerId: subscription.customer },
      limit: 1,
      fields: ['id', 'subscriptionStatus', 'subscriptionId', 'plan', 'trialEndsAt', 'gracePeriodStart', 'cancelAt']
    });
  }

  if (!user) {
    strapi.log.warn('[Webhook] No user for subscription', { subscriptionId: subscription.id, customerId: subscription.customer });
    return;
  }

  if (isBillingExemptLifetimePro(user)) {
    strapi.log.debug('[Webhook] Skipping billing-exempt lifetime Pro', { userId: user.id });
    return;
  }

  // Safely derive plan nickname from either price.nickname or legacy plan.nickname
  const planNickname =
    subscription.items?.data?.[0]?.price?.nickname ||
    subscription.items?.data?.[0]?.plan?.nickname ||
    null;

  // Convert Stripe epoch seconds -> Date for DB fields that are dates
  const trialEndsAtDate = subscription.trial_end ? new Date(subscription.trial_end * 1000) : null;

  // Build update payload (non-destructive, minimal)
  const data = {
    // Keep snake_case status as-is; you have existing code that reads snake and camel elsewhere
    subscriptionStatus: normalizeSubscriptionStatusForUserRow(subscription.status),
    plan:               planNickname,
    trialEndsAt:        trialEndsAtDate,
  };

  // Ensure subscriptionId is set (for users found by customerId fallback)
  if (!user.subscriptionId && subscription.id) {
    data.subscriptionId = subscription.id;
  }

  // If set to cancel at period end, persist cancelAt date
  if (subscription.cancel_at_period_end && subscription.cancel_at) {
    data.cancelAt = new Date(subscription.cancel_at * 1000);
  }

  // If subscription is active again, clear grace/cancel flags
  if (subscription.status === 'active') {
    data.gracePeriodStart = null;
    data.cancelAt = null;
  }

  // Idempotent write (avoid noise): only update if something actually changed
  const changed =
    user.subscriptionStatus !== data.subscriptionStatus ||
    user.plan !== data.plan ||
    String(user.trialEndsAt || '') !== String(data.trialEndsAt || '') ||
    String(user.gracePeriodStart || '') !== String(data.gracePeriodStart || '') ||
    String(user.cancelAt || '') !== String(data.cancelAt || '');

  if (changed) {
    await strapi.entityService.update('plugin::users-permissions.user', user.id, { data });
    strapi.log.info('[Webhook] User subscription updated', {
      userId: user.id,
      newStatus: subscription.status,
      plan: planNickname,
      trialEndsAt: trialEndsAtDate?.toISOString() || null
    });
  } else {
    strapi.log.debug('[Webhook] No changes to persist for user', { userId: user.id });
  }
}


async function onSubscriptionCanceled(subscription) {
  strapi.log.debug('[Webhook] customer.subscription.deleted', { subscriptionId: subscription.id, customerId: subscription.customer });
  
  // Try to find user by subscriptionId first
  let [user] = await strapi.entityService.findMany('plugin::users-permissions.user', {
    filters: { subscriptionId: subscription.id }
  });

  // Fallback: find by customerId if subscriptionId lookup fails
  if (!user && subscription.customer) {
    [user] = await strapi.entityService.findMany('plugin::users-permissions.user', {
      filters: { customerId: subscription.customer }
    });
  }

  if (!user) {
    strapi.log.warn('[Webhook] No user for canceled subscription', { subscriptionId: subscription.id, customerId: subscription.customer });
    return;
  }
  if (skipLifetimePro(user)) return;

  await strapi.entityService.update('plugin::users-permissions.user', user.id, {
    data: { subscriptionStatus: 'canceled', gracePeriodStart: null, cancelAt: null }
  });
  strapi.log.info('[Webhook] User marked canceled', { userId: user.id });
}



async function onUnhandledEvent(data, event) {
  strapi.log.info('[Webhook] Unhandled event', event.type);
}

