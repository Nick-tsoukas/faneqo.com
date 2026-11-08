'use strict';

/**
 * Payment reporting for one artist (band), computed in the database.
 *
 * Money is integer cents. Rows written before amountCents existed fall back to
 * the legacy whole-dollar `amount` column. Revenue counts only payments that
 * actually succeeded (see SUCCEEDED); refunds are reported separately.
 *
 * Fees and net proceeds come only from Stripe balance transactions recorded by
 * the webhook. Older payments have none, so the report says how many payments
 * the fee figures cover instead of guessing.
 */

const { SUCCEEDED } = require('./supportMomentSync');

const UID = 'api::support-moment.support-moment';
const DAY = 86400000;
const PERIODS = { '7d': 7, '30d': 30, '90d': 90, '365d': 365, all: null };
const STATUSES = ['pending', 'paid', 'partially_refunded', 'refunded', 'disputed', 'failed', 'canceled'];
const MAX_PAGE_SIZE = 100;

// ---------------------------------------------------------------- pure helpers

function startOfUtcDay(d) {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

function parseDay(v) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(v || ''))) return null;
  const d = new Date(`${v}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Resolve the reporting window. `end` is exclusive.
 * period: 7d | 30d | 90d | 365d | all, or custom from/to (YYYY-MM-DD, inclusive).
 */
function resolveRange({ period, from, to, firstPaymentAt, now = new Date() } = {}) {
  const fromDay = parseDay(from);
  const toDay = parseDay(to);
  if (fromDay && toDay && fromDay <= toDay) {
    const end = new Date(toDay.getTime() + DAY);
    const days = Math.round((end - fromDay) / DAY);
    return { period: 'custom', start: fromDay, end, days, previous: { start: new Date(fromDay - days * DAY), end: fromDay } };
  }
  const key = Object.prototype.hasOwnProperty.call(PERIODS, period) ? period : '30d';
  const end = new Date(startOfUtcDay(now).getTime() + DAY);
  if (key === 'all') {
    const start = firstPaymentAt ? startOfUtcDay(firstPaymentAt) : new Date(end.getTime() - 30 * DAY);
    return { period: 'all', start, end, days: Math.max(1, Math.round((end - start) / DAY)), previous: null };
  }
  const days = PERIODS[key];
  const start = new Date(end.getTime() - days * DAY);
  return { period: key, start, end, days, previous: { start: new Date(start.getTime() - days * DAY), end: start } };
}

/** Day buckets up to ~5 weeks, weekly up to ~6 months, then monthly. */
function buildBuckets(start, end) {
  const days = Math.round((end - start) / DAY);
  const unit = days <= 35 ? 'day' : days <= 190 ? 'week' : 'month';
  const buckets = [];
  let cursor = new Date(start);
  if (unit === 'month') cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
  while (cursor < end) {
    let next;
    if (unit === 'day') next = new Date(cursor.getTime() + DAY);
    else if (unit === 'week') next = new Date(cursor.getTime() + 7 * DAY);
    else next = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1));
    buckets.push({ start: new Date(Math.max(cursor, start)), end: new Date(Math.min(next, end)) });
    cursor = next;
  }
  return { unit, buckets };
}

const n = (v) => (v == null ? 0 : Number(v) || 0);

/** Normalised transaction for the owner's dashboard (never shown publicly). */
function toTransaction(row) {
  const amountCents = Number.isInteger(row.amountCents) ? row.amountCents : Math.round(n(row.amount) * 100);
  const refundedCents = n(row.refundedAmountCents);
  const hasFees = row.netCents != null;
  return {
    id: row.id,
    reference: row.receiptToken ? `FQ-${String(row.receiptToken).slice(0, 8).toUpperCase()}` : `FQ-${String(row.id).padStart(6, '0')}`,
    createdAt: row.createdAt,
    paidAt: row.paidAt || null,
    refundedAt: row.refundedAt || null,
    status: row.status || 'pending',
    disputeStatus: row.disputeStatus || null,
    description: row.supportLabel || null,
    type: row.buttonKey || null,
    currency: (row.currency || 'usd').toLowerCase(),
    amountCents,
    refundedAmountCents: refundedCents,
    platformFeeCents: row.platformFeeCents ?? null,
    stripeFeeCents: row.stripeFeeCents ?? null,
    // What reaches the artist after fees and refunds, only when Stripe told us the fees
    netCents: hasFees ? n(row.netCents) - refundedCents : null,
    stripePaymentIntentId: row.stripePaymentIntentId || null,
    stripeChargeId: row.stripeChargeId || null,
  };
}

function csvCell(v) {
  if (v == null) return '';
  const s = String(v);
  return /[",\n\r]/.test(s) || /^[=+\-@]/.test(s) ? `"${s.replace(/"/g, '""').replace(/^([=+\-@])/, "'$1")}"` : s;
}

const dollars = (c) => (c == null ? '' : (c / 100).toFixed(2));

function transactionsToCsv(rows) {
  const head = ['Date', 'Reference', 'Description', 'Type', 'Status', 'Amount', 'Refunded', 'Faneqo fee', 'Stripe fee', 'Net', 'Currency'];
  const lines = rows.map((t) => [
    (t.paidAt || t.createdAt || '').slice(0, 19).replace('T', ' '),
    t.reference, t.description, t.type, t.status,
    dollars(t.amountCents), dollars(t.refundedAmountCents), dollars(t.platformFeeCents), dollars(t.stripeFeeCents), dollars(t.netCents),
    t.currency.toUpperCase(),
  ].map(csvCell).join(','));
  return [head.join(','), ...lines].join('\r\n') + '\r\n';
}

// ---------------------------------------------------------------- database

function createPaymentReport({ strapi }) {
  const meta = () => strapi.db.metadata.get(UID);

  /** knex base: rows for one band, via the relation's join table. */
  function base(bandId) {
    const knex = strapi.db.connection;
    const jt = meta().attributes.band.joinTable;
    const join = jt?.name || 'support_moments_band_links';
    const col = jt?.joinColumn?.name || 'support_moment_id';
    const inv = jt?.inverseJoinColumn?.name || 'band_id';
    return knex('support_moments as sm').join(`${join} as l`, `l.${col}`, 'sm.id').where(`l.${inv}`, bandId);
  }

  const knexRaw = (sql, b) => strapi.db.connection.raw(sql, b);
  const CENTS = 'COALESCE(sm.amount_cents, sm.amount * 100)';
  const WHEN = 'COALESCE(sm.paid_at, sm.created_at)';
  const okList = SUCCEEDED.map((s) => `'${s}'`).join(',');
  const OK = `sm.status IN (${okList})`;

  async function totals(bandId, start, end) {
    const row = await base(bandId)
      .where(knexRaw(`${WHEN} >= ?`, [start.toISOString()]))
      .andWhere(knexRaw(`${WHEN} < ?`, [end.toISOString()]))
      .first(
        knexRaw(`SUM(CASE WHEN ${OK} THEN 1 ELSE 0 END) AS paid_count`),
        knexRaw(`SUM(CASE WHEN ${OK} THEN ${CENTS} ELSE 0 END) AS gross_cents`),
        knexRaw(`SUM(CASE WHEN ${OK} THEN COALESCE(sm.refunded_amount_cents, 0) ELSE 0 END) AS refunded_cents`),
        knexRaw(`SUM(CASE WHEN sm.status = 'disputed' THEN ${CENTS} ELSE 0 END) AS disputed_cents`),
        knexRaw(`SUM(CASE WHEN ${OK} AND sm.net_cents IS NOT NULL THEN 1 ELSE 0 END) AS fee_covered_count`),
        knexRaw(`SUM(CASE WHEN ${OK} AND sm.net_cents IS NOT NULL THEN ${CENTS} ELSE 0 END) AS fee_covered_gross_cents`),
        knexRaw(`SUM(CASE WHEN ${OK} AND sm.net_cents IS NOT NULL THEN COALESCE(sm.refunded_amount_cents, 0) ELSE 0 END) AS fee_covered_refunded_cents`),
        knexRaw(`SUM(CASE WHEN ${OK} THEN COALESCE(sm.platform_fee_cents, 0) ELSE 0 END) AS platform_fee_cents`),
        knexRaw(`SUM(CASE WHEN ${OK} THEN COALESCE(sm.stripe_fee_cents, 0) ELSE 0 END) AS stripe_fee_cents`),
        knexRaw(`SUM(CASE WHEN ${OK} THEN COALESCE(sm.net_cents, 0) ELSE 0 END) AS net_cents`),
      );
    const paidCount = n(row?.paid_count);
    const gross = n(row?.gross_cents);
    const refunded = n(row?.refunded_cents);
    const covered = n(row?.fee_covered_count);
    const feesComplete = paidCount > 0 && covered === paidCount;
    return {
      paidCount,
      grossCents: gross,
      refundedCents: refunded,
      disputedCents: n(row?.disputed_cents),
      receivedCents: gross - refunded,
      averageCents: paidCount ? Math.round(gross / paidCount) : 0,
      fees: {
        coveredCount: covered,
        complete: feesComplete,
        platformFeeCents: n(row?.platform_fee_cents),
        stripeFeeCents: n(row?.stripe_fee_cents),
        // Net only over payments whose fees Stripe reported
        netProceedsCents: n(row?.net_cents) - n(row?.fee_covered_refunded_cents),
        coveredGrossCents: n(row?.fee_covered_gross_cents),
      },
    };
  }

  async function series(bandId, start, end) {
    const { unit, buckets } = buildBuckets(start, end);
    if (!buckets.length) return { unit, points: [] };
    const selects = [];
    const binds = [];
    buckets.forEach((b, i) => {
      selects.push(`SUM(CASE WHEN ${OK} AND ${WHEN} >= ? AND ${WHEN} < ? THEN ${CENTS} ELSE 0 END) AS v${i}`);
      selects.push(`SUM(CASE WHEN ${OK} AND ${WHEN} >= ? AND ${WHEN} < ? THEN 1 ELSE 0 END) AS c${i}`);
      binds.push(b.start.toISOString(), b.end.toISOString(), b.start.toISOString(), b.end.toISOString());
    });
    const row = await base(bandId)
      .where(knexRaw(`${WHEN} >= ?`, [start.toISOString()]))
      .andWhere(knexRaw(`${WHEN} < ?`, [end.toISOString()]))
      .first(knexRaw(selects.join(', '), binds));
    return {
      unit,
      points: buckets.map((b, i) => ({ start: b.start.toISOString(), end: b.end.toISOString(), grossCents: n(row?.[`v${i}`]), count: n(row?.[`c${i}`]) })),
    };
  }

  async function firstPaymentAt(bandId) {
    const row = await base(bandId).whereRaw(OK).first(knexRaw(`MIN(${WHEN}) AS first_at`));
    return row?.first_at ? new Date(row.first_at) : null;
  }

  async function report(bandId, query = {}) {
    const first = query.period === 'all' ? await firstPaymentAt(bandId) : null;
    const range = resolveRange({ period: query.period, from: query.from, to: query.to, firstPaymentAt: first });
    const [current, previous, chart] = await Promise.all([
      totals(bandId, range.start, range.end),
      range.previous ? totals(bandId, range.previous.start, range.previous.end) : null,
      series(bandId, range.start, range.end),
    ]);
    return {
      currency: 'usd',
      range: { period: range.period, start: range.start.toISOString(), end: range.end.toISOString(), days: range.days },
      totals: current,
      previous: previous ? { grossCents: previous.grossCents, paidCount: previous.paidCount, receivedCents: previous.receivedCents } : null,
      series: chart,
    };
  }

  /** Server-paginated, filtered transaction list (newest first, stable by id). */
  function listWhere(bandId, q = {}) {
    const where = { band: { id: bandId } };
    const statuses = String(q.status || '').split(',').map((s) => s.trim()).filter((s) => STATUSES.includes(s));
    if (statuses.length) where.status = { $in: statuses };
    const from = parseDay(q.from);
    const to = parseDay(q.to);
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.$gte = from.toISOString();
      if (to) where.createdAt.$lt = new Date(to.getTime() + DAY).toISOString();
    }
    if (q.type) where.buttonKey = String(q.type).slice(0, 64);
    const search = String(q.q || '').trim().slice(0, 80);
    if (search) where.$or = [{ supportLabel: { $containsi: search } }, { receiptToken: { $startsWithi: search.replace(/^FQ-/i, '') } }];
    return where;
  }

  const LIST_FIELDS = ['id', 'createdAt', 'paidAt', 'refundedAt', 'status', 'disputeStatus', 'supportLabel', 'buttonKey', 'currency', 'amount', 'amountCents', 'refundedAmountCents', 'platformFeeCents', 'stripeFeeCents', 'netCents', 'receiptToken', 'stripePaymentIntentId', 'stripeChargeId'];

  async function transactions(bandId, q = {}) {
    const pageSize = Math.max(1, Math.min(MAX_PAGE_SIZE, Number(q.pageSize) || 25));
    const page = Math.max(1, Number(q.page) || 1);
    const where = listWhere(bandId, q);
    const dbq = strapi.db.query(UID);
    const [total, rows, types] = await Promise.all([
      dbq.count({ where }),
      dbq.findMany({ where, select: LIST_FIELDS, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], offset: (page - 1) * pageSize, limit: pageSize }),
      base(bandId).distinct('sm.button_key as type').whereNotNull('sm.button_key'),
    ]);
    return {
      data: rows.map(toTransaction),
      pagination: { page, pageSize, total, pageCount: Math.max(1, Math.ceil(total / pageSize)) },
      filters: { types: types.map((t) => t.type).filter(Boolean).sort(), statuses: STATUSES },
    };
  }

  async function transaction(bandId, id) {
    const row = await strapi.db.query(UID).findOne({ where: { id: Number(id), band: { id: bandId } }, select: LIST_FIELDS });
    return row ? toTransaction(row) : null;
  }

  /** Every row matching the filters (paged internally), capped for safety. */
  async function exportRows(bandId, q = {}, cap = 20000) {
    const where = listWhere(bandId, q);
    const out = [];
    for (let offset = 0; offset < cap; offset += 500) {
      const rows = await strapi.db.query(UID).findMany({ where, select: LIST_FIELDS, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], offset, limit: 500 });
      out.push(...rows.map(toTransaction));
      if (rows.length < 500) break;
    }
    return out;
  }

  return { report, transactions, transaction, exportRows, totals };
}

module.exports = { PERIODS, STATUSES, resolveRange, buildBuckets, toTransaction, transactionsToCsv, createPaymentReport };
