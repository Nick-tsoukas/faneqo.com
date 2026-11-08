'use strict';

/**
 * Faneqo platform revenue, straight from Stripe (read-only).
 *
 *   node scripts/platform-revenue.js              # last 30 days
 *   node scripts/platform-revenue.js --days 90
 *   node scripts/platform-revenue.js --since 2026-10-25
 *
 * Totals the application fees Stripe actually collected on connected-account
 * payments (not a 2% estimate on volume), minus any fee refunds, plus the
 * volume those fees were taken on and how many artists processed payments.
 * Requires STRIPE_SECRET_KEY in the environment.
 */

const Stripe = require('stripe');

const arg = (name) => { const i = process.argv.indexOf(name); return i > -1 ? process.argv[i + 1] : null };
const days = Number(arg('--days')) || 30;
const since = arg('--since') ? new Date(`${arg('--since')}T00:00:00Z`) : new Date(Date.now() - days * 86400000);

async function main() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY is not set');
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const mode = process.env.STRIPE_SECRET_KEY.startsWith('sk_live_') ? 'LIVE' : 'TEST';

  let fees = 0, refundedFees = 0, count = 0, volume = 0;
  const accounts = new Set();
  const byDay = new Map();

  for await (const fee of stripe.applicationFees.list({ created: { gte: Math.floor(since.getTime() / 1000) }, limit: 100, expand: ['data.charge'] })) {
    count++;
    fees += fee.amount;
    refundedFees += fee.amount_refunded;
    accounts.add(fee.account);
    if (fee.charge && typeof fee.charge === 'object') volume += fee.charge.amount || 0;
    const day = new Date(fee.created * 1000).toISOString().slice(0, 10);
    byDay.set(day, (byDay.get(day) || 0) + fee.amount - fee.amount_refunded);
  }

  const $ = (c) => `$${(c / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  console.log(`Faneqo platform revenue (${mode} mode) since ${since.toISOString().slice(0, 10)}`);
  console.log(`  Fees collected        ${$(fees)}  on ${count} payments`);
  console.log(`  Fees refunded         ${$(refundedFees)}`);
  console.log(`  Net platform revenue  ${$(fees - refundedFees)}`);
  console.log(`  Volume with a fee     ${$(volume)}`);
  console.log(`  Artists paid          ${accounts.size}`);
  if (byDay.size) {
    console.log('\n  By day');
    for (const [day, cents] of [...byDay].sort()) console.log(`    ${day}  ${$(cents)}`);
  }
}

main().catch((e) => { console.error(e.message); process.exit(1) });
