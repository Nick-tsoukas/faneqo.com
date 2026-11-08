'use strict';

// Payments 2.0: payment-state sync (fake Stripe + fake store) and financial
// reporting (real SQL through knex on in-memory SQLite). Nothing leaves this
// process. Run: node scripts/test-payments-reporting.js

const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.resolve(__dirname, '..');

const { statusFromRefunds, moneyFromBalanceTransaction, createSupportMomentSync } = require(path.join(root, 'src/utils/payments/supportMomentSync'));
const { resolveRange, buildBuckets, transactionsToCsv, toTransaction, createPaymentReport } = require(path.join(root, 'src/utils/payments/paymentReport'));

let passed = 0;
const test = async (name, fn) => { await fn(); passed++; console.log('  ok ', name) };

// ---------------------------------------------------------------- fakes for sync

function makeStore(rows) {
  const db = new Map(rows.map((r) => [r.id, { refundedAmountCents: 0, ...r }]));
  const strapi = {
    log: { warn() {}, info() {}, error() {} },
    entityService: {
      findOne: async (uid, id) => { const r = db.get(Number(id)); return r ? { ...r, band: { id: r.bandId, stripeAccountId: r.account } } : null },
      findMany: async (uid, { filters }) => [...db.values()].filter((r) => filters.$or.some((f) => Object.entries(f).every(([k, v]) => r[k] === v))).slice(0, 1),
      update: async (uid, id, { data }) => { Object.assign(db.get(Number(id)), data); return db.get(Number(id)) },
    },
  };
  return { db, strapi };
}

const bt = { net: 9512, fee_details: [{ type: 'stripe_fee', amount: 288 }, { type: 'application_fee', amount: 200 }] };
const pi = (over = {}) => ({ id: 'pi_1', amount_received: 10000, application_fee_amount: 200, latest_charge: { id: 'ch_1', amount: 10000, amount_refunded: 0, balance_transaction: bt }, ...over });
const fakeStripe = (piObj = pi()) => ({
  paymentIntents: { retrieve: async () => piObj },
  checkout: { sessions: { list: async () => ({ data: [{ metadata: { supportMomentId: '1' } }] }), retrieve: async () => ({ id: 'cs_1', status: 'complete', payment_status: 'paid', payment_intent: piObj, metadata: { supportMomentId: '1' } }) } },
  charges: { retrieve: async () => ({ amount_refunded: 0 }) },
});

(async () => {
  console.log('payments: status and money mapping')

  await test('refund state maps to paid / partially_refunded / refunded', () => {
    assert.equal(statusFromRefunds(10000, 0), 'paid')
    assert.equal(statusFromRefunds(10000, 2500), 'partially_refunded')
    assert.equal(statusFromRefunds(10000, 10000), 'refunded')
  })
  await test('fees and net come from the balance transaction, split by type', () => {
    assert.deepEqual(moneyFromBalanceTransaction(bt), { stripeFeeCents: 288, platformFeeCents: 200, netCents: 9512 })
    assert.deepEqual(moneyFromBalanceTransaction(null), {})
  })

  console.log('payments: webhook / receipt sync')
  const session = (over = {}) => ({ id: 'cs_1', status: 'complete', payment_status: 'paid', amount_total: 10000, payment_intent: 'pi_1', metadata: { supportMomentId: '1' }, ...over })

  await test('completed + paid session marks the payment paid with fees and net', async () => {
    const { db, strapi } = makeStore([{ id: 1, status: 'pending', account: 'acct_A', bandId: 7 }])
    await createSupportMomentSync({ strapi, stripe: fakeStripe() }).applyCheckoutSession(session(), 'acct_A')
    const r = db.get(1)
    assert.equal(r.status, 'paid'); assert.equal(r.amountCents, 10000)
    assert.equal(r.platformFeeCents, 200); assert.equal(r.stripeFeeCents, 288); assert.equal(r.netCents, 9512)
    assert.ok(r.paidAt)
  })
  await test('completed but unpaid session (async method) stays pending', async () => {
    const { db, strapi } = makeStore([{ id: 1, status: 'pending', account: 'acct_A', bandId: 7 }])
    await createSupportMomentSync({ strapi, stripe: fakeStripe() }).applyCheckoutSession(session({ payment_status: 'unpaid' }), 'acct_A')
    assert.equal(db.get(1).status, 'pending')
  })
  await test('event from a different connected account is ignored', async () => {
    const { db, strapi } = makeStore([{ id: 1, status: 'pending', account: 'acct_A', bandId: 7 }])
    const res = await createSupportMomentSync({ strapi, stripe: fakeStripe() }).applyCheckoutSession(session(), 'acct_EVIL')
    assert.equal(res.ignored, true); assert.equal(db.get(1).status, 'pending')
  })
  await test('duplicate completed events are idempotent', async () => {
    const { db, strapi } = makeStore([{ id: 1, status: 'pending', account: 'acct_A', bandId: 7 }])
    const sync = createSupportMomentSync({ strapi, stripe: fakeStripe() })
    await sync.applyCheckoutSession(session(), 'acct_A'); const first = { ...db.get(1) }
    await sync.applyCheckoutSession(session(), 'acct_A')
    assert.equal(db.get(1).status, 'paid'); assert.equal(db.get(1).paidAt, first.paidAt)
  })
  await test('expired session cancels a pending payment', async () => {
    const { db, strapi } = makeStore([{ id: 1, status: 'pending', account: 'acct_A', bandId: 7 }])
    await createSupportMomentSync({ strapi, stripe: fakeStripe() }).applyCheckoutSession(session({ status: 'expired', payment_status: 'unpaid' }), 'acct_A')
    assert.equal(db.get(1).status, 'canceled')
  })
  await test('async payment failure marks failed', async () => {
    const { db, strapi } = makeStore([{ id: 1, status: 'pending', account: 'acct_A', bandId: 7 }])
    await createSupportMomentSync({ strapi, stripe: fakeStripe() }).markAsyncFailed(session(), 'acct_A')
    assert.equal(db.get(1).status, 'failed')
  })
  await test('partial then full refund are recorded from the charge', async () => {
    const { db, strapi } = makeStore([{ id: 1, status: 'paid', amountCents: 10000, stripeChargeId: 'ch_1', account: 'acct_A', bandId: 7 }])
    const sync = createSupportMomentSync({ strapi, stripe: fakeStripe() })
    await sync.applyChargeRefund({ id: 'ch_1', payment_intent: 'pi_1', amount: 10000, amount_refunded: 2500 }, 'acct_A')
    assert.equal(db.get(1).status, 'partially_refunded'); assert.equal(db.get(1).refundedAmountCents, 2500)
    await sync.applyChargeRefund({ id: 'ch_1', payment_intent: 'pi_1', amount: 10000, amount_refunded: 10000 }, 'acct_A')
    assert.equal(db.get(1).status, 'refunded'); assert.ok(db.get(1).refundedAt)
  })
  await test('refund events delivered out of order never shrink the refunded amount', async () => {
    const { db, strapi } = makeStore([{ id: 1, status: 'paid', amountCents: 10000, stripeChargeId: 'ch_1', account: 'acct_A', bandId: 7 }])
    const sync = createSupportMomentSync({ strapi, stripe: fakeStripe() })
    await sync.applyChargeRefund({ id: 'ch_1', payment_intent: 'pi_1', amount: 10000, amount_refunded: 10000 }, 'acct_A')
    await sync.applyChargeRefund({ id: 'ch_1', payment_intent: 'pi_1', amount: 10000, amount_refunded: 2500 }, 'acct_A')
    assert.equal(db.get(1).status, 'refunded'); assert.equal(db.get(1).refundedAmountCents, 10000)
  })
  await test('a refund or dispute from another (or no) connected account is ignored', async () => {
    const { db, strapi } = makeStore([{ id: 1, status: 'paid', amountCents: 10000, stripeChargeId: 'ch_1', account: 'acct_A', bandId: 7 }])
    const sync = createSupportMomentSync({ strapi, stripe: fakeStripe() })
    assert.equal((await sync.applyChargeRefund({ id: 'ch_1', payment_intent: 'pi_1', amount: 10000, amount_refunded: 10000 }, 'acct_EVIL')).ignored, true)
    assert.equal((await sync.applyDispute({ charge: 'ch_1', status: 'needs_response' }, 'acct_EVIL')).ignored, true)
    assert.equal((await sync.applyChargeRefund({ id: 'ch_1', payment_intent: 'pi_1', amount: 10000, amount_refunded: 10000 }, null)).ignored, true)
    assert.equal(db.get(1).status, 'paid'); assert.equal(db.get(1).refundedAmountCents, 0)
  })
  await test('delayed payment settles pending to paid; a later expiry or failure changes nothing', async () => {
    const { db, strapi } = makeStore([{ id: 1, status: 'pending', account: 'acct_A', bandId: 7 }])
    const sync = createSupportMomentSync({ strapi, stripe: fakeStripe() })
    await sync.applyCheckoutSession(session({ payment_status: 'unpaid' }), 'acct_A'); assert.equal(db.get(1).status, 'pending')
    await sync.applyCheckoutSession(session(), 'acct_A'); assert.equal(db.get(1).status, 'paid')
    await sync.applyCheckoutSession(session({ status: 'expired', payment_status: 'unpaid' }), 'acct_A'); assert.equal(db.get(1).status, 'paid')
    await sync.markAsyncFailed(session(), 'acct_A'); assert.equal(db.get(1).status, 'paid')
  })
  await test('a refund on a disputed payment records the amount but keeps it disputed', async () => {
    const { db, strapi } = makeStore([{ id: 1, status: 'disputed', amountCents: 10000, stripeChargeId: 'ch_1', account: 'acct_A', bandId: 7 }])
    await createSupportMomentSync({ strapi, stripe: fakeStripe() }).applyChargeRefund({ id: 'ch_1', payment_intent: 'pi_1', amount: 10000, amount_refunded: 4000 }, 'acct_A')
    assert.equal(db.get(1).status, 'disputed'); assert.equal(db.get(1).refundedAmountCents, 4000)
  })
  await test('a late completed event never turns a refunded payment back into paid', async () => {
    const { db, strapi } = makeStore([{ id: 1, status: 'refunded', amountCents: 10000, paidAt: '2026-10-01T00:00:00.000Z', account: 'acct_A', bandId: 7 }])
    await createSupportMomentSync({ strapi, stripe: fakeStripe(pi({ latest_charge: { id: 'ch_1', amount: 10000, amount_refunded: 10000, balance_transaction: bt } })) }).applyCheckoutSession(session(), 'acct_A')
    assert.equal(db.get(1).status, 'refunded')
  })
  await test('refund arriving before the payment is linked is found through the Checkout Session', async () => {
    const { db, strapi } = makeStore([{ id: 1, status: 'paid', amountCents: 5000, account: 'acct_A', bandId: 7 }])
    await createSupportMomentSync({ strapi, stripe: fakeStripe() }).applyChargeRefund({ id: 'ch_9', payment_intent: 'pi_9', amount: 5000, amount_refunded: 5000 }, 'acct_A')
    assert.equal(db.get(1).status, 'refunded'); assert.equal(db.get(1).stripeChargeId, 'ch_9')
  })
  await test('dispute opens as disputed; won returns to paid; lost stays disputed', async () => {
    const { db, strapi } = makeStore([{ id: 1, status: 'paid', amountCents: 10000, stripeChargeId: 'ch_1', account: 'acct_A', bandId: 7 }])
    const sync = createSupportMomentSync({ strapi, stripe: fakeStripe() })
    await sync.applyDispute({ charge: 'ch_1', status: 'needs_response' }, 'acct_A'); assert.equal(db.get(1).status, 'disputed')
    await sync.applyDispute({ charge: 'ch_1', status: 'won' }, 'acct_A'); assert.equal(db.get(1).status, 'paid')
    await sync.applyDispute({ charge: 'ch_1', status: 'lost' }, 'acct_A'); assert.equal(db.get(1).status, 'disputed'); assert.equal(db.get(1).disputeStatus, 'lost')
  })
  await test('receipt self-heal asks Stripe once and settles a pending payment', async () => {
    const { db, strapi } = makeStore([{ id: 1, status: 'pending', stripeCheckoutSessionId: 'cs_1', account: 'acct_A', bandId: 7 }])
    await createSupportMomentSync({ strapi, stripe: fakeStripe() }).reconcilePending(1)
    assert.equal(db.get(1).status, 'paid')
  })

  console.log('payments: reporting (SQL on SQLite)')

  await test('ranges: presets, custom dates and previous period', () => {
    const now = new Date('2026-10-25T15:00:00Z')
    const r = resolveRange({ period: '7d', now })
    assert.equal(r.days, 7); assert.equal(r.end.toISOString(), '2026-10-26T00:00:00.000Z'); assert.equal(r.previous.end.toISOString(), r.start.toISOString())
    const c = resolveRange({ from: '2026-10-01', to: '2026-10-10', now })
    assert.equal(c.period, 'custom'); assert.equal(c.days, 10)
    assert.equal(resolveRange({ period: 'bogus', now }).period, '30d')
  })
  await test('buckets: daily, weekly, monthly by length', () => {
    const d = (s) => new Date(s)
    assert.equal(buildBuckets(d('2026-10-01'), d('2026-10-08')).unit, 'day')
    assert.equal(buildBuckets(d('2026-07-01'), d('2026-10-01')).unit, 'week')
    const m = buildBuckets(d('2025-10-26'), d('2026-10-26'))
    assert.equal(m.unit, 'month'); assert.ok(m.buckets.length >= 12 && m.buckets.length <= 13)
  })

  const knex = require(path.join(root, 'node_modules/knex'))({ client: 'better-sqlite3', connection: { filename: ':memory:' }, useNullAsDefault: true })
  await knex.schema.createTable('support_moments', (t) => {
    t.increments('id'); t.integer('amount'); t.integer('amount_cents'); t.integer('refunded_amount_cents'); t.integer('platform_fee_cents'); t.integer('stripe_fee_cents'); t.integer('net_cents')
    t.string('status'); t.string('paid_at'); t.string('created_at'); t.string('button_key')
  })
  await knex.schema.createTable('support_moments_band_links', (t) => { t.integer('support_moment_id'); t.integer('band_id') })
  const rows = [
    // band 7, inside a 30-day window ending 2026-10-26
    { amount_cents: 10000, status: 'paid', paid_at: '2026-10-20T12:00:00.000Z', platform_fee_cents: 200, stripe_fee_cents: 320, net_cents: 9480, button_key: 'tip_band' },
    { amount_cents: 2500, status: 'partially_refunded', refunded_amount_cents: 1000, paid_at: '2026-10-21T12:00:00.000Z', platform_fee_cents: 50, stripe_fee_cents: 103, net_cents: 2347, button_key: 'tip_band' },
    { amount_cents: 1250, status: 'refunded', refunded_amount_cents: 1250, paid_at: '2026-10-22T12:00:00.000Z', button_key: 'pay_entry' },
    { amount: 20, status: 'paid', paid_at: '2026-10-23T12:00:00.000Z', button_key: 'pay_entry' }, // legacy whole dollars
    { amount_cents: 9900, status: 'pending', created_at: '2026-10-24T12:00:00.000Z' },
    { amount_cents: 9900, status: 'failed', created_at: '2026-10-24T13:00:00.000Z' },
    { amount_cents: 5000, status: 'paid', paid_at: '2026-09-10T12:00:00.000Z' }, // previous period
  ]
  for (const r of rows) {
    const [id] = await knex('support_moments').insert({ created_at: r.paid_at || r.created_at, ...r })
    await knex('support_moments_band_links').insert({ support_moment_id: id, band_id: 7 })
  }
  const [other] = await knex('support_moments').insert({ amount_cents: 777700, status: 'paid', paid_at: '2026-10-20T12:00:00.000Z', created_at: '2026-10-20T12:00:00.000Z' })
  await knex('support_moments_band_links').insert({ support_moment_id: other, band_id: 99 })

  const sqlStrapi = { db: { connection: knex, metadata: { get: () => ({ attributes: { band: { joinTable: { name: 'support_moments_band_links', joinColumn: { name: 'support_moment_id' }, inverseJoinColumn: { name: 'band_id' } } } } }) } } }
  const reports = createPaymentReport({ strapi: sqlStrapi })

  await test('totals count only succeeded payments, refunds separately, legacy dollars included', async () => {
    const t = await reports.totals(7, new Date('2026-09-26T00:00:00Z'), new Date('2026-10-26T00:00:00Z'))
    assert.equal(t.paidCount, 4)
    assert.equal(t.grossCents, 10000 + 2500 + 1250 + 2000)
    assert.equal(t.refundedCents, 1000 + 1250)
    assert.equal(t.receivedCents, 15750 - 2250)
    assert.equal(t.averageCents, Math.round(15750 / 4))
  })
  await test('fees are only reported for payments Stripe reported fees on', async () => {
    const t = await reports.totals(7, new Date('2026-09-26T00:00:00Z'), new Date('2026-10-26T00:00:00Z'))
    assert.equal(t.fees.coveredCount, 2); assert.equal(t.fees.complete, false)
    assert.equal(t.fees.platformFeeCents, 250); assert.equal(t.fees.stripeFeeCents, 423)
    assert.equal(t.fees.netProceedsCents, 9480 + 2347 - 1000)
  })
  await test("another band's payments never appear (cross-account)", async () => {
    const t = await reports.totals(7, new Date('2026-01-01T00:00:00Z'), new Date('2027-01-01T00:00:00Z'))
    assert.ok(t.grossCents < 777700)
    const t99 = await reports.totals(99, new Date('2026-01-01T00:00:00Z'), new Date('2027-01-01T00:00:00Z'))
    assert.equal(t99.grossCents, 777700); assert.equal(t99.paidCount, 1)
  })
  await test('chart series sums to the period total', async () => {
    const s = await reportsSeries()
    const sum = s.points.reduce((a, p) => a + p.grossCents, 0)
    assert.equal(sum, 15750); assert.equal(s.unit, 'day')
    assert.equal(s.points.reduce((a, p) => a + p.count, 0), 4)
  })
  async function reportsSeries() {
    // Same SQL path the report uses, with a fixed window
    const t = createPaymentReport({ strapi: sqlStrapi })
    const real = Date
    global.Date = class extends real { constructor(...a) { super(...(a.length ? a : ['2026-10-25T15:00:00Z'])) } static now() { return new real('2026-10-25T15:00:00Z').getTime() } }
    try { return (await t.report(7, { period: '30d' })).series } finally { global.Date = real }
  }
  await test('empty history returns zeros, not errors', async () => {
    const t = await reports.totals(12345, new Date('2026-01-01T00:00:00Z'), new Date('2027-01-01T00:00:00Z'))
    assert.equal(t.paidCount, 0); assert.equal(t.grossCents, 0); assert.equal(t.averageCents, 0); assert.equal(t.fees.complete, false)
  })

  await test('transactions: net shown only when fees are known, references never expose ids', () => {
    const a = toTransaction({ id: 41, amountCents: 2500, refundedAmountCents: 1000, netCents: 2347, receiptToken: 'abcdefghijklmnopqrstuvwx', status: 'partially_refunded', createdAt: '2026-10-21T12:00:00.000Z' })
    assert.equal(a.netCents, 1347); assert.equal(a.reference, 'FQ-ABCDEFGH')
    const b = toTransaction({ id: 42, amount: 20, status: 'paid', createdAt: '2026-10-23T12:00:00.000Z' })
    assert.equal(b.amountCents, 2000); assert.equal(b.netCents, null)
  })
  await test('CSV escapes quotes and formula-looking cells', () => {
    const csv = transactionsToCsv([toTransaction({ id: 1, amountCents: 1234, supportLabel: '=HYPERLINK("x")', status: 'paid', createdAt: '2026-10-21T12:00:00.000Z' })])
    assert.match(csv, /^Date,Reference,Description/)
    assert.match(csv, /"'=HYPERLINK\(""x""\)"/)
    assert.match(csv, /,12\.34,/)
  })

  await knex.destroy()
  console.log(`test-payments-reporting: ${passed} passed`)
})().catch((e) => { console.error(e); process.exit(1) })
