'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const {
  pickBestCurrentSubscription,
  resolvePreferredSubscription,
  extractSafePrice,
  shapeBillingSubscription,
  hasUsablePaymentMethod,
} = require('../src/utils/billing/billingTruth');

const root = path.join(__dirname, '..');
const stripeCtrl = fs.readFileSync(path.join(root, 'src/api/stripe/controllers/stripe.js'), 'utf8');
const stripeRoutes = fs.readFileSync(path.join(root, 'src/api/stripe/routes/stripe.js'), 'utf8');

let passed = 0;
function test(name, fn) {
  return Promise.resolve()
    .then(fn)
    .then(() => {
      passed += 1;
      console.log(`  ✅ ${name}`);
    });
}

function makeSub({ id, status, unitAmount, currency = 'usd', interval = 'month', intervalCount = 1 }) {
  return {
    id,
    status,
    trial_end: status === 'trialing' ? 1700000000 : null,
    current_period_end: 1700000000,
    items: {
      data: [
        {
          price: {
            id: `price_${unitAmount}`,
            nickname: 'Monthly',
            unit_amount: unitAmount,
            currency,
            recurring: { interval, interval_count: intervalCount },
          },
        },
      ],
    },
    latest_invoice: { hosted_invoice_url: 'https://secret.example/invoice', payment_intent: { client_secret: 'pi_secret' } },
    default_payment_method: { card: { last4: '4242', brand: 'visa' } },
  };
}

async function run() {
  console.log('\n=== Billing API truth ===\n');

  await test('billing route stays authenticated and does not take customerId from query', () => {
    assert.match(stripeRoutes, /path: '\/stripe\/billing'/);
    // Standard users-permissions auth (config.auth = {}); auth: false would make it public
    assert.match(stripeRoutes, /path: '\/stripe\/billing',\s*handler: '[^']+',\s*config: \{ auth: \{\} \}/);
    assert.doesNotMatch(stripeRoutes, /auth:\s*false/);
    const billingFn = stripeCtrl.slice(
      stripeCtrl.indexOf('async getBillingInfo(ctx)'),
      stripeCtrl.indexOf('async createBillingPortalSession')
    );
    assert.match(billingFn, /ctx\.unauthorized/);
    assert.match(billingFn, /jwtUser\.id/);
    assert.match(billingFn, /entityService\.findOne/);
    assert.doesNotMatch(billingFn, /ctx\.query\.customerId|request\.body\.customerId/);
  });

  await test('billing uses current DB user, not JWT customerId alone', () => {
    const billingFn = stripeCtrl.slice(
      stripeCtrl.indexOf('async getBillingInfo(ctx)'),
      stripeCtrl.indexOf('async createBillingPortalSession')
    );
    assert.match(billingFn, /dbUser\.customerId/);
    assert.match(billingFn, /resolvePreferredSubscription/);
    assert.doesNotMatch(billingFn, /jwtUser\.customerId/);
  });

  await test('stored subscriptionId is preferred over list results', async () => {
    const stored = makeSub({ id: 'sub_stored', status: 'active', unitAmount: 700 });
    const listed = makeSub({ id: 'sub_listed', status: 'trialing', unitAmount: 1200 });
    const resolved = await resolvePreferredSubscription({
      dbUser: { customerId: 'cus_1', subscriptionId: 'sub_stored' },
      retrieveSubscription: async (id) => {
        assert.strictEqual(id, 'sub_stored');
        return stored;
      },
      listSubscriptions: async () => {
        throw new Error('list should not run when stored sub exists');
      },
    });
    assert.strictEqual(resolved.id, 'sub_stored');
    assert.strictEqual(resolved.items.data[0].price.unit_amount, 700);
    void listed;
  });

  await test('does not display an arbitrary canceled sub when picking current', () => {
    const canceled = makeSub({ id: 'sub_old', status: 'canceled', unitAmount: 700 });
    const active = makeSub({ id: 'sub_now', status: 'active', unitAmount: 1200 });
    const picked = pickBestCurrentSubscription([canceled, active]);
    assert.strictEqual(picked.id, 'sub_now');
    assert.strictEqual(pickBestCurrentSubscription([canceled]), null);
  });

  await test('safe price shape includes id, amount, currency, interval, intervalCount', () => {
    const shaped = shapeBillingSubscription(makeSub({ id: 'sub_12', status: 'active', unitAmount: 1200 }));
    assert.deepStrictEqual(shaped.price, {
      id: 'price_1200',
      unitAmount: 1200,
      currency: 'usd',
      interval: 'month',
      intervalCount: 1,
    });
    assert.strictEqual(shaped.id, 'sub_12');
    assert.ok(!('latest_invoice' in shaped));
    assert.ok(!('default_payment_method' in shaped));
    const json = JSON.stringify(shaped);
    assert.doesNotMatch(json, /client_secret/);
    assert.doesNotMatch(json, /4242/);
  });

  await test('grandfathered $7 sub yields 700 USD monthly', () => {
    const price = extractSafePrice(makeSub({ id: 'sub_7', status: 'active', unitAmount: 700 }));
    assert.strictEqual(price.unitAmount, 700);
    assert.strictEqual(price.currency, 'usd');
    assert.strictEqual(price.interval, 'month');
  });

  await test('current $12 sub yields 1200 USD monthly', () => {
    const price = extractSafePrice(makeSub({ id: 'sub_12', status: 'trialing', unitAmount: 1200 }));
    assert.strictEqual(price.unitAmount, 1200);
    assert.strictEqual(price.currency, 'usd');
    assert.strictEqual(price.interval, 'month');
  });

  await test('billing error / missing price does not fabricate an amount', () => {
    assert.strictEqual(extractSafePrice(null), null);
    assert.strictEqual(extractSafePrice({ items: { data: [] } }), null);
    assert.strictEqual(shapeBillingSubscription(null), null);
    const noAmount = shapeBillingSubscription({
      id: 'sub_x',
      status: 'active',
      items: { data: [{ price: { id: 'price_x', currency: 'usd', recurring: { interval: 'month' } } }] },
    });
    assert.strictEqual(noAmount.price.unitAmount, null);
  });

  await test('a card counts wherever Stripe keeps it: customer default, subscription, or legacy source', () => {
    assert.strictEqual(hasUsablePaymentMethod({ customer: { invoice_settings: { default_payment_method: 'pm_1' } } }), true);
    assert.strictEqual(hasUsablePaymentMethod({ customer: { invoice_settings: {} }, subscription: { default_payment_method: 'pm_2' } }), true);
    assert.strictEqual(hasUsablePaymentMethod({ customer: { default_source: 'card_3', invoice_settings: {} } }), true);
  });

  await test('no card anywhere, a deleted customer, or no customer means no card', () => {
    assert.strictEqual(hasUsablePaymentMethod({ customer: { invoice_settings: { default_payment_method: null } }, subscription: { default_payment_method: null } }), false);
    assert.strictEqual(hasUsablePaymentMethod({ customer: { deleted: true, invoice_settings: { default_payment_method: 'pm_1' } } }), false);
    assert.strictEqual(hasUsablePaymentMethod({}), false);
    assert.strictEqual(hasUsablePaymentMethod(), false);
  });

  await test('billing info uses the shared card check', () => {
    assert.ok(stripeCtrl.includes('hasUsablePaymentMethod({ customer, subscription })'));
  });

  console.log(`\n=== billing truth: ${passed} passed ===`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
