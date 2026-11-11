'use strict';

// Faneqo 2% platform fee: the math, the on/off switch, and both fan checkout
// controllers. Stripe and Strapi are stubbed; nothing leaves this process.

const assert = require('node:assert/strict');
const path = require('node:path');
const Module = require('node:module');

const root = path.resolve(__dirname, '..');
const { platformFeeBps, platformFeeCents, platformFeePaymentIntentData } = require(path.join(root, 'src/utils/billing/platformFee'));

let passed = 0;
const test = (name, fn) => Promise.resolve().then(fn).then(() => { passed++; console.log('  ok ', name) })

// ---- Stubs: a fake Stripe that records Checkout Session params, and a fake strapi
const sessions = [];
class FakeStripe {
  constructor() {
    this.checkout = { sessions: { create: async (params, opts) => { sessions.push({ params, opts }); return { id: 'cs_test_1', url: 'https://checkout.stripe.test/cs_test_1', payment_intent: 'pi_test_1' } } } };
  }
}
const realLoad = Module._load;
Module._load = function (request, ...rest) { return request === 'stripe' ? FakeStripe : realLoad.call(this, request, ...rest) };

const band = {
  id: 7, name: 'Moon Dough', slug: 'moondough', stripeAccountId: 'acct_test_band',
  paymentsEnabled: true, stripeOnboardingComplete: true,
  users_permissions_user: { id: 3, blocked: false }, // checkout refuses bands without an active owner
  paymentButtons: [{ key: 'tip_band', enabled: true, title: 'Tip the Band', pricingMode: 'min', minAmount: 1 }],
  merchConcierge: { enabled: true, staffReadyConfirmed: true, pickupInstructions: 'Merch table', merchItems: [{ title: 'Tee', priceCents: 2500, availableQty: 5 }] },
};
global.strapi = {
  entityService: {
    findOne: async () => band,
    findMany: async (uid) => (uid === 'api::band.band' ? [band] : []),
    create: async (uid, { data }) => ({ id: 42, ...data }),
    update: async () => ({}),
  },
  log: { warn() {}, info() {}, error() {} },
};
const ctx = (body, params = {}) => {
  const c = { params, request: { body }, body: null, status: 200 }
  c.badRequest = (m) => { c.status = 400; c.body = m }
  c.notFound = (m) => { c.status = 404; c.body = m }
  c.forbidden = (m) => { c.status = 403; c.body = m }
  return c
};
const freshController = (rel) => { const p = path.join(root, rel); delete require.cache[require.resolve(p)]; return require(p) };

(async () => {
  console.log('platform fee')

  await test('$100 => $2.00 at 200 bps', () => assert.equal(platformFeeCents(10000, 200), 200))
  await test('$25 => $0.50 at 200 bps', () => assert.equal(platformFeeCents(2500, 200), 50))
  await test('$1 => $0.02 at 200 bps', () => assert.equal(platformFeeCents(100, 200), 2))
  await test('rounds to the nearest cent ($12.37 => 25¢, $0.75 => 2¢)', () => {
    assert.equal(platformFeeCents(1237, 200), 25)
    assert.equal(platformFeeCents(75, 200), 2)
  })
  await test('off unless FANEQO_PLATFORM_FEE_BPS is a sane positive integer', () => {
    assert.equal(platformFeeBps({}), 0)
    assert.equal(platformFeeBps({ FANEQO_PLATFORM_FEE_BPS: '0' }), 0)
    assert.equal(platformFeeBps({ FANEQO_PLATFORM_FEE_BPS: 'abc' }), 0)
    assert.equal(platformFeeBps({ FANEQO_PLATFORM_FEE_BPS: '2.5' }), 0)
    assert.equal(platformFeeBps({ FANEQO_PLATFORM_FEE_BPS: '5000' }), 0)
    assert.equal(platformFeeBps({ FANEQO_PLATFORM_FEE_BPS: '200' }), 200)
  })
  await test('disabled => application_fee_amount omitted entirely', () => {
    assert.deepEqual(platformFeePaymentIntentData(10000, 0), {})
  })

  for (const [label, bps, expectFee] of [['enabled (200)', '200', true], ['disabled (unset)', undefined, false]]) {
    if (bps === undefined) delete process.env.FANEQO_PLATFORM_FEE_BPS
    else process.env.FANEQO_PLATFORM_FEE_BPS = bps

    await test(`support checkout, ${label}`, async () => {
      sessions.length = 0
      const c = ctx({ buttonKey: 'tip_band', amount: 100 }, { id: '7' })
      await freshController('src/api/band/controllers/checkout.js').create(c)
      assert.equal(sessions.length, 1, `session created (status ${c.status}: ${JSON.stringify(c.body)})`)
      const { params, opts } = sessions[0]
      assert.equal(params.line_items[0].price_data.unit_amount, 10000, 'buyer price unchanged')
      assert.equal(opts.stripeAccount, 'acct_test_band', 'still a direct charge on the artist account')
      assert.deepEqual(params.metadata, { supportMomentId: '42', bandId: '7', buttonKey: 'tip_band' })
      assert.match(params.success_url, /\/moondough\/support\/receipt\?r=[A-Za-z0-9_-]{24}$/, 'receipt link uses an unguessable token')
      if (expectFee) assert.deepEqual(params.payment_intent_data, { application_fee_amount: 200 })
      else assert.equal('payment_intent_data' in params, false)
    })

    await test(`merch checkout, ${label}`, async () => {
      sessions.length = 0
      const c = ctx({ bandSlug: 'moondough', itemSlotIndex: 1 })
      await freshController('src/api/merch-concierge/controllers/merch-concierge.js').createCheckout(c)
      assert.equal(sessions.length, 1, `session created (status ${c.status}: ${JSON.stringify(c.body)})`)
      const { params, opts } = sessions[0]
      assert.equal(params.line_items[0].price_data.unit_amount, 2500, 'buyer price unchanged')
      assert.equal(opts.stripeAccount, 'acct_test_band')
      assert.equal(params.metadata.merchOrderId, '42')
      assert.equal(c.body.checkoutUrl, 'https://checkout.stripe.test/cs_test_1')
      if (expectFee) assert.deepEqual(params.payment_intent_data, { application_fee_amount: 50 })
      else assert.equal('payment_intent_data' in params, false)
    })
  }

  console.log(`test-platform-fee: ${passed} passed`)
})().catch((e) => { console.error(e); process.exit(1) })
