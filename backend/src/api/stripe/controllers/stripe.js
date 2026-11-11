// path: src/api/subscription/controllers/stripe.js
'use strict';

const { default: Stripe } = require('stripe');
const crypto = require('crypto');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
const { openBillingPortal } = require('../../../utils/billing/portalSession');
const UNPARSED = Symbol.for('unparsedBody');
const { normalizeSubscriptionStatusForUserRow } = require('../../../utils/billing/subscriptionStatus');
const {
  resolvePreferredSubscription,
  shapeBillingSubscription,
  hasUsablePaymentMethod,
} = require('../../../utils/billing/billingTruth');
const { provisionStripeCustomerAndTrial } = require('../../../utils/billing/provisionStripeTrial');
const {
  planStripeSignupCleanup,
  runStripeSignupCleanup,
} = require('../../../utils/billing/stripeSignupCleanup');
const { buildArtistBillingFields, hasRequiredBillingMetadata } = require('../../../utils/billing/artistSignupBilling');
const {
  isBillingExemptLifetimePro,
  ambassadorSubscriptionStatusPayload,
  ambassadorBillingInfoPayload,
} = require('../../../utils/billing/artistEntitlement');

module.exports = {
  // 1) Check subscription status
  // src/api/stripe/controllers/stripe.js
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



  // 2) Retrieve billing info from the current DB user + live Stripe subscription.
  // Price truth comes from subscription.items.data[0].price — never a hardcoded amount.
  async getBillingInfo(ctx) {
    strapi.log.debug('[getBillingInfo] entry', { userId: ctx.state.user?.id });
    const jwtUser = ctx.state.user;

    if (!jwtUser?.id) {
      return ctx.unauthorized('You must be logged in.');
    }

    const dbUser = await strapi.entityService.findOne(
      'plugin::users-permissions.user',
      jwtUser.id,
      { fields: ['id', 'customerId', 'subscriptionId', 'trialEndsAt', 'plan', 'subscriptionStatus'] }
    );

    if (!dbUser) {
      return ctx.unauthorized('You must be logged in.');
    }

    if (isBillingExemptLifetimePro(dbUser)) {
      strapi.log.debug('[getBillingInfo] Billing-exempt lifetime Pro, skipping Stripe', { userId: dbUser.id });
      return ctx.send(ambassadorBillingInfoPayload());
    }

    if (!dbUser.customerId) {
      strapi.log.warn('[getBillingInfo] No Stripe customer on DB user', { userId: dbUser.id });
      return ctx.badRequest('Stripe customer not found');
    }

    try {
      const customer = await stripe.customers.retrieve(dbUser.customerId);

      const subscription = await resolvePreferredSubscription({
        dbUser,
        retrieveSubscription: (id) => stripe.subscriptions.retrieve(id),
        listSubscriptions: (customerId) =>
          stripe.subscriptions.list({
            customer: customerId,
            status: 'all',
            limit: 20,
          }),
      });

      const safeSubscription = shapeBillingSubscription(subscription);
      const trialEndsAtSeconds = safeSubscription?.trial_end || null;
      const trialEndsAtIso = trialEndsAtSeconds
        ? new Date(trialEndsAtSeconds * 1000).toISOString()
        : null;

      const hasPaymentMethod = hasUsablePaymentMethod({ customer, subscription });

      strapi.log.debug('[getBillingInfo] Retrieved billing info', {
        userId: dbUser.id,
        hasPaymentMethod,
        subscriptionId: safeSubscription?.id || null,
        priceId: safeSubscription?.price?.id || null,
      });

      return ctx.send({
        hasPaymentMethod,
        trialEndsAt: trialEndsAtIso || dbUser.trialEndsAt || null,
        subscription: safeSubscription,
      });
    } catch (error) {
      strapi.log.error('[getBillingInfo] error', error);
      return ctx.throw(500, 'Error retrieving billing information');
    }
  },
  

  // 3) Create a Stripe Billing Portal session
  // The subscription API registers the same path; both use the same consent
  // gate (utils/billing/portalSession.js) so neither can bypass it (Billing A).
  async createBillingPortalSession(ctx) {
    return openBillingPortal({ ctx, strapi, stripe, returnUrl: process.env.BILLING_RETURN_URL });
  },

  // 4) Create a Stripe Customer (with deduplication)
  async createCustomer(ctx) {
    strapi.log.debug('[createCustomer] entry', { body: ctx.request.body });
    try {
      const { email, name } = ctx.request.body;
      if (!email || !name) {
        strapi.log.warn('[createCustomer] Missing email or name', { email, name });
        return ctx.badRequest('Missing email or name.');
      }
      
      // Check for existing Stripe customer by email (prevent duplicates)
      const existingCustomers = await stripe.customers.list({ email, limit: 1 });
      let customer;
      if (existingCustomers.data.length > 0) {
        customer = existingCustomers.data[0];
        strapi.log.info('[createCustomer] Found existing Stripe customer', { customerId: customer.id });
      } else {
        customer = await stripe.customers.create({ email, name });
        strapi.log.debug('[createCustomer] Stripe customer created', { customer });
      }
      return ctx.send({ customerId: customer.id });
    } catch (error) {
      strapi.log.error('[createCustomer] error', error);
      return ctx.throw(500, 'Failed to create Stripe customer');
    }
  },

  // 5) Create a Checkout Session (for card setup)
  async createCheckoutSession(ctx) {
    strapi.log.debug('[createCheckoutSession] entry', { body: ctx.request.body });
    try {
      const { customerId } = ctx.request.body;
      if (!customerId) {
        strapi.log.warn('[createCheckoutSession] Missing customerId');
        return ctx.badRequest('Missing customerId.');
      }
      const _appUrl = String(process.env.PUBLIC_APP_URL || 'https://musicbizqr.com').replace(/\/+$/, '');
      const session = await stripe.checkout.sessions.create({
        customer:             customerId,
        payment_method_types: ['card'],
        mode:                 'setup',
        success_url:          `${_appUrl}/signupSuccess?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url:           `${_appUrl}/signupCancelled`,
      });
      strapi.log.debug('[createCheckoutSession] Checkout session created', { session });
      return ctx.send({ url: session.url });
    } catch (error) {
      strapi.log.error('[createCheckoutSession] error', error);
      return ctx.throw(500, 'Failed to create checkout session');
    }
  },

  // 6) Confirm payment, create Stripe subscription & Strapi user
  async confirmPayment(ctx) {
    strapi.log.debug('[confirmPayment] entry', { body: ctx.request.body });
    try {
      const { session_id, email, password, name, refCode } = ctx.request.body;
      if (!session_id || !email || !password || !name) {
        strapi.log.warn('[confirmPayment] Missing required fields', { session_id, email, name });
        return ctx.badRequest('Missing required fields.');
      }

      // 1️⃣ Retrieve the Checkout Session
      strapi.log.debug('[confirmPayment] Retrieving Stripe session', { session_id });
      const session = await stripe.checkout.sessions.retrieve(session_id);
      strapi.log.debug('[confirmPayment] Session retrieved', { session });
      if (!session || !session.customer) {
        strapi.log.error('[confirmPayment] No customer in session', { session });
        return ctx.badRequest('Invalid session or no customer found.');
      }
      const customerId = typeof session.customer === 'string' ? session.customer : session.customer.id;

      // 2️⃣ Ensure they have a card on file
      strapi.log.debug('[confirmPayment] Listing payment methods', { customerId });
      const pmList = await stripe.paymentMethods.list({ customer: customerId, type: 'card' });
      strapi.log.debug('[confirmPayment] Payment methods count', { count: pmList.data.length });
      if (!pmList.data.length) {
        strapi.log.error('[confirmPayment] No payment method found', { customerId });
        return ctx.badRequest('No payment method found for this customer.');
      }

      // A retried or replayed confirmation must not leave a second trial subscription
      // that bills after 30 days: refuse known emails before touching Stripe, reuse a
      // live subscription, and make the create idempotent per Checkout Session.
      const existingUser = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { email: String(email).trim().toLowerCase() },
        select: ['id'],
      });
      if (existingUser) {
        return ctx.badRequest('An account with this email already exists. Please sign in.');
      }

      // 3️⃣ Create the Stripe subscription (30-day trial)
      const live = await stripe.subscriptions.list({ customer: customerId, status: 'all', limit: 10 });
      let subscription = live.data.find((s) => ['trialing', 'active', 'past_due'].includes(s.status));
      if (!subscription) {
        strapi.log.debug('[confirmPayment] Creating Stripe subscription', { customerId });
        subscription = await stripe.subscriptions.create(
          {
            customer:           customerId,
            items:              [{ price: process.env.STRIPE_DEFAULT_PRICE_ID }],
            trial_period_days:  30,
          },
          { idempotencyKey: `confirm-payment-${session_id}` }
        );
      }
      strapi.log.debug('[confirmPayment] Subscription created', { subscription });

      // 4️⃣ Create the Strapi user (core fields only)
      strapi.log.debug('[confirmPayment] Fetching authenticated role');
      const authRole = await strapi.db.query('plugin::users-permissions.role').findOne({
        where: { type: 'authenticated' },
      });
      if (!authRole) {
        strapi.log.error('[confirmPayment] Authenticated role not found');
        return ctx.badRequest('Authenticated role not found.');
      }
      const confirmationToken = crypto.randomBytes(20).toString('hex');
      strapi.log.debug('[confirmPayment] Creating Strapi user', { email });
      const billingFields = buildArtistBillingFields({
        customerId,
        subscription,
        subscriptionId: subscription.id,
      });
      const newUser = await strapi.plugin('users-permissions').service('user').add({
        email,
        password,
        username:          email,
        provider:          'local',
        confirmed:         false,
        confirmationToken,
        role:              authRole.id,
        ...billingFields,
      });
      strapi.log.debug('[confirmPayment] Strapi user created', { userId: newUser.id });

      // 5️⃣ Update user with Stripe fields
      const trialEndsAt = new Date(subscription.trial_end * 1000);
      
      // Build update data
      const updateData = {
        ...billingFields,
        trialEndsAt,
      };

      // 5a️⃣ Handle marketer attribution if refCode provided
      if (refCode) {
        const normalizedCode = refCode.trim().toLowerCase();
        strapi.log.debug('[confirmPayment] Processing refCode', { refCode: normalizedCode });
        
        try {
          const marketers = await strapi.entityService.findMany('api::marketer.marketer', {
            filters: { code: normalizedCode, isActive: true },
            limit: 1,
          });
          
          if (marketers.length > 0) {
            const marketer = marketers[0];
            updateData.referredByMarketer = marketer.id;
            updateData.marketerCodeUsed = normalizedCode;
            updateData.referredAt = new Date().toISOString();
            strapi.log.info('[confirmPayment] Marketer attribution saved', { 
              userId: newUser.id, 
              marketerId: marketer.id, 
              code: normalizedCode 
            });
          } else {
            strapi.log.warn('[confirmPayment] Invalid refCode, ignoring', { refCode: normalizedCode });
          }
        } catch (marketerErr) {
          strapi.log.error('[confirmPayment] Marketer lookup failed, continuing', marketerErr);
        }
      }

      strapi.log.debug('[confirmPayment] Updating user with Stripe data', {
        userId:             newUser.id,
        customerId,
        subscriptionId:     subscription.id,
        subscriptionStatus: 'trialing',
        trialEndsAt,
      });
      await strapi.entityService.update(
        'plugin::users-permissions.user',
        newUser.id,
        { data: updateData }
      );
      strapi.log.info('[confirmPayment] User updated with Stripe data', { userId: newUser.id });

      // 6️⃣ Send confirmation email
      strapi.log.debug('[confirmPayment] Sending confirmation email', { to: email });
      const _confirmUrl = `https://qrserver-production.up.railway.app/api/auth/confirm-email?token=${confirmationToken}`;
      await strapi.plugin('email').service('email').send({
        to:      email,
        from:    process.env.EMAIL_DEFAULT_FROM || 'Faneqo <noreply@mail.faneqo.com>',
        subject: 'Confirm your Faneqo account',
        text:    `Hi ${name},\n\nWelcome to Faneqo! Please confirm your email address by clicking the link below:\n\n${_confirmUrl}\n\nThank you,\nThe Faneqo Team`,
        html:    `<div style="font-family:ui-sans-serif,system-ui,Arial;line-height:1.5;"><h2>Welcome to Faneqo!</h2><p>Hi ${name},</p><p>Please confirm your email address to activate your account:</p><p><a href="${_confirmUrl}" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;">Confirm Email</a></p><p style="margin-top:16px;color:#6b7280;font-size:13px;">Or paste this link into your browser:<br>${_confirmUrl}</p><p>Thank you,<br>The Faneqo Team</p></div>`,
      });
      strapi.log.info('[confirmPayment] Confirmation email sent', { to: email });

      // 7️⃣ Return success
      strapi.log.debug('[confirmPayment] Responding to client', { userId: newUser.id });
      return ctx.send({
        message: 'Confirmation email sent. Please check your inbox.',
        user:    { id: newUser.id, email: newUser.email },
      });
    } catch (error) {
      strapi.log.error('[confirmPayment] Error in confirmPayment', error);
      return ctx.internalServerError('Payment confirmation failed.');
    }
  },

  // 9) RETIRED — this handler trusted a body email and issued a JWT for it,
  // which allowed account takeover by anyone who knew an email address. Its
  // route registration is removed and this guard makes the legacy body below
  // unreachable. Social login lives in the Nuxt confirm-social route, which
  // verifies a Firebase ID token and calls the secret-guarded
  // /user-admin/issue-jwt. Do not re-enable.
async confirmSocial(ctx) {
  strapi.log.warn('[confirmSocial] retired endpoint called')
  return ctx.gone
    ? ctx.gone('Endpoint retired.')
    : ctx.badRequest('Endpoint retired.')

  // eslint-disable-next-line no-unreachable
  const { email, name, uid, provider, refCode } = ctx.request.body

  if (!email || !name || !uid || !provider) {
    return ctx.badRequest('Missing required fields.')
  }

  // 1️⃣ Check if user already exists
  const existingUser = await strapi.db.query('plugin::users-permissions.user').findOne({
    where: { email }
  })

  if (existingUser) {
    strapi.log.debug('[confirmSocial] User exists, logging in', { id: existingUser.id })
    
    // Check if existing user needs Stripe customer (might have been created without one)
    if (isBillingExemptLifetimePro(existingUser)) {
      strapi.log.debug('[confirmSocial] Billing-exempt lifetime Pro, skipping Stripe', { id: existingUser.id });
      const jwt = strapi.plugins['users-permissions'].services.jwt.issue({ id: existingUser.id });
      return ctx.send({ jwt, billingReady: true, billingExempt: true });
    }

    let billingReady = Boolean(existingUser.customerId);

    if (!existingUser.customerId) {
      strapi.log.debug('[confirmSocial] Existing user has no Stripe customer, checking/creating')
      try {
        const provision = await provisionStripeCustomerAndTrial({
          stripe,
          email,
          name,
          priceId: process.env.STRIPE_DEFAULT_PRICE_ID,
          trialDays: 30,
          appUserId: existingUser.id,
          log: strapi.log,
        });
        const billingFields = buildArtistBillingFields({
          customerId: provision.customerId,
          subscription: provision.subscription,
          subscriptionId: provision.subscriptionId,
        });
        await strapi.entityService.update('plugin::users-permissions.user', existingUser.id, {
          data: billingFields,
        });
        billingReady = hasRequiredBillingMetadata({ ...existingUser, ...billingFields });
      } catch (stripeErr) {
        strapi.log.error('[confirmSocial] Stripe setup for existing user failed', stripeErr);
        if (existingUser.subscriptionStatus !== 'unpaid') {
          try {
            await strapi.entityService.update('plugin::users-permissions.user', existingUser.id, {
              data: { subscriptionStatus: 'unpaid' },
            });
          } catch (statusErr) {
            strapi.log.error('[confirmSocial] Failed to persist unpaid status', statusErr);
          }
        }
        billingReady = false;
      }
    }

    const jwt = strapi.plugins['users-permissions'].services.jwt.issue({ id: existingUser.id })
    return ctx.send({ jwt, billingReady })
  }

  const priceId = process.env.STRIPE_DEFAULT_PRICE_ID;
  if (!priceId) {
    strapi.log.error('[confirmSocial] STRIPE_DEFAULT_PRICE_ID is not configured');
    return ctx.internalServerError('Stripe configuration error — missing default price ID.');
  }

  let provision;
  try {
    provision = await provisionStripeCustomerAndTrial({
      stripe,
      email,
      name,
      priceId,
      trialDays: 30,
      log: strapi.log,
    });
  } catch (err) {
    strapi.log.error('[confirmSocial] Stripe customer lookup/creation failed', err);
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
    return ctx.internalServerError('Failed to create Stripe customer.');
  }

  const authRole = await strapi.db.query('plugin::users-permissions.role').findOne({
    where: { type: 'authenticated' },
  })

  const billingFields = buildArtistBillingFields({
    customerId: provision.customerId,
    subscription: provision.subscription,
    subscriptionId: provision.subscriptionId,
  });

  const userData = {
    email,
    username: email,
    provider,
    confirmed: true,
    role: authRole.id,
    ...billingFields,
  }

  // 4a️⃣ Handle marketer attribution if refCode provided
  if (refCode) {
    const normalizedCode = refCode.trim().toLowerCase();
    strapi.log.debug('[confirmSocial] Processing refCode', { refCode: normalizedCode });
    
    try {
      const marketers = await strapi.entityService.findMany('api::marketer.marketer', {
        filters: { code: normalizedCode, isActive: true },
        limit: 1,
      });
      
      if (marketers.length > 0) {
        const marketer = marketers[0];
        userData.referredByMarketer = marketer.id;
        userData.marketerCodeUsed = normalizedCode;
        userData.referredAt = new Date().toISOString();
        strapi.log.info('[confirmSocial] Marketer attribution saved', { 
          marketerId: marketer.id, 
          code: normalizedCode 
        });
      } else {
        strapi.log.warn('[confirmSocial] Invalid refCode, ignoring', { refCode: normalizedCode });
      }
    } catch (marketerErr) {
      strapi.log.error('[confirmSocial] Marketer lookup failed, continuing', marketerErr);
    }
  }

  let newUser;
  try {
    newUser = await strapi.plugins['users-permissions'].services.user.add(userData)
  } catch (err) {
    strapi.log.error('[confirmSocial] Strapi user creation failed', err);
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

  if (!hasRequiredBillingMetadata(newUser)) {
    strapi.log.error('[confirmSocial] new user missing required Stripe metadata', { userId: newUser.id });
    return ctx.internalServerError('Failed to persist billing information.');
  }

  const jwt = strapi.plugins['users-permissions'].services.jwt.issue({ id: newUser.id })

  strapi.log.debug('[confirmSocial] User created and JWT issued', { id: newUser.id })

  return ctx.send({ jwt, billingReady: true })
},


  // 8) A simple test route
  async testRoute(ctx) {
    return ctx.send({ message: 'This is a test route' });
  },
};

