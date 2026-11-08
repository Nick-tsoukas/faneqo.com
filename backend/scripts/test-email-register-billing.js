'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const {
  hasRequiredBillingMetadata,
  canReturnRegisterSuccess,
  buildArtistBillingFields,
} = require('../src/utils/billing/artistSignupBilling');
const { provisionStripeCustomerAndTrial } = require('../src/utils/billing/provisionStripeTrial');

const registerSrc = fs.readFileSync(
  path.join(__dirname, '../src/api/subscription/controllers/subscription.js'),
  'utf8'
);
const registerFn = registerSrc.slice(
  registerSrc.indexOf('async register(ctx)'),
  registerSrc.indexOf('// ─── Handlers')
);

let passed = 0;
function test(name, fn) {
  return Promise.resolve()
    .then(fn)
    .then(() => {
      passed += 1;
      console.log(`  ✅ ${name}`);
    });
}

async function run() {
  console.log('\n=== Email register billing integrity ===\n');

  await test('missing STRIPE_DEFAULT_PRICE_ID fails', () => {
    assert.match(registerFn, /STRIPE_DEFAULT_PRICE_ID is not configured/);
    assert.match(registerFn, /missing default price ID/);
  });

  await test('Stripe customer failure fails the request', () => {
    assert.match(registerFn, /Failed to create Stripe customer/);
    assert.match(registerFn, /stripe_customer/);
  });

  await test('Stripe subscription failure fails the request', () => {
    assert.match(registerFn, /Failed to create Stripe subscription/);
  });

  await test('user creation failure triggers owned Stripe cleanup', () => {
    assert.match(registerFn, /Strapi user creation failed/);
    assert.match(registerFn, /runStripeSignupCleanup/);
    assert.match(registerFn, /createdCustomer: provision\.createdCustomer/);
    assert.match(registerFn, /createdSubscription: provision\.createdSubscription/);
  });

  await test('success requires persisted customerId, subscriptionId, status, trialEndsAt', () => {
    assert.match(registerFn, /\.\.\.billingFields/);
    assert.match(registerFn, /hasRequiredBillingMetadata/);
    assert.match(registerFn, /Failed to persist billing information/);
    const afterPersist = registerFn.slice(registerFn.lastIndexOf('hasRequiredBillingMetadata'));
    assert.match(afterPersist, /return ctx\.send/);
  });

  await test('metadata miss cannot return registration success', () => {
    assert.strictEqual(canReturnRegisterSuccess({
      id: 1,
      email: 'a@b.com',
    }), false);
    assert.strictEqual(canReturnRegisterSuccess({
      customerId: 'cus_1',
      subscriptionId: 'sub_1',
      subscriptionStatus: 'trialing',
    }), false);
    assert.strictEqual(canReturnRegisterSuccess({
      customerId: 'cus_1',
      subscriptionId: 'sub_1',
      subscriptionStatus: 'trialing',
      trialEndsAt: new Date(),
    }), true);
    assert.match(registerFn, /if \(!hasRequiredBillingMetadata\(persisted\)\)/);
    assert.doesNotMatch(registerFn, /best-effort/);
  });

  await test('confirmation email failure remains non-fatal', () => {
    const emailBlock = registerFn.slice(
      registerFn.indexOf('sending confirmation email'),
      registerFn.indexOf('completed successfully')
    );
    assert.match(emailBlock, /failed to send confirmation email/);
    assert.doesNotMatch(emailBlock, /return ctx\.(internalServerError|badRequest)/);
  });

  await test('existing reusable $7 subscription is reused and not created', async () => {
    const created = [];
    const canceled = [];
    const stripe = {
      customers: {
        list: async () => ({ data: [{ id: 'cus_old' }] }),
        create: async () => {
          throw new Error('should not create customer');
        },
      },
      subscriptions: {
        list: async () => ({
          data: [
            {
              id: 'sub_7',
              status: 'active',
              trial_end: null,
              items: { data: [{ price: { unit_amount: 700, currency: 'usd' } }] },
            },
          ],
        }),
        create: async () => {
          created.push('new');
          throw new Error('should not create subscription');
        },
        cancel: async (id) => canceled.push(id),
      },
    };
    const provision = await provisionStripeCustomerAndTrial({
      stripe,
      email: 'band@example.com',
      name: 'Band',
      priceId: 'price_new_12',
      log: { info() {} },
    });
    assert.strictEqual(provision.subscriptionId, 'sub_7');
    assert.strictEqual(provision.createdCustomer, false);
    assert.strictEqual(provision.createdSubscription, false);
    assert.deepStrictEqual(created, []);
    assert.deepStrictEqual(canceled, []);
    const fields = buildArtistBillingFields(provision);
    assert.strictEqual(fields.subscriptionStatus, 'active');
  });

  await test('hasRequiredBillingMetadata is the success gate', () => {
    assert.strictEqual(hasRequiredBillingMetadata(null), false);
    assert.strictEqual(hasRequiredBillingMetadata({
      customerId: 'cus',
      subscriptionId: 'sub',
      subscriptionStatus: 'active',
    }), true);
  });

  console.log(`\n=== email register billing: ${passed} passed ===`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
