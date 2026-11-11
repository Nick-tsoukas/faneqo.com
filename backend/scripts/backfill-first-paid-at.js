'use strict';

/**
 * Record the first verified Pro payment (firstPaidAt) for artists who paid
 * before the field existed, reading Stripe. Payment eligibility requires it.
 *
 *   node scripts/backfill-first-paid-at.js           # dry run: counts only
 *   node scripts/backfill-first-paid-at.js --apply   # write firstPaidAt
 *
 * Read-only against Stripe (lists subscriptions and invoices; never charges,
 * changes or cancels anything). Lifetime Pro rows are skipped. Prints counts
 * and user ids only, never emails. Safe to re-run: rows that already have
 * firstPaidAt are skipped, and the value is the earliest paid, non-zero
 * subscription invoice for the artist's Stripe customer.
 */

const { isBillingExemptLifetimePro } = require('../src/utils/billing/artistEntitlement');

const UP = 'plugin::users-permissions.user';
const apply = process.argv.includes('--apply');

/** Earliest paid, non-zero subscription invoice among a customer's invoices. Pure. */
function earliestPaidAt(invoices) {
  let best = null;
  for (const inv of invoices || []) {
    const paid = inv.status === 'paid' || inv.paid === true;
    if (!paid || !(Number(inv.amount_paid) > 0) || !inv.subscription) continue;
    const t = inv.status_transitions?.paid_at || inv.created;
    if (t && (best === null || t < best)) best = t;
  }
  return best ? new Date(best * 1000) : null;
}

async function main() {
  const { createStrapi } = require('@strapi/strapi');
  const app = await (createStrapi ? createStrapi() : require('@strapi/strapi')()).load();
  const Stripe = require('stripe');
  const stripe = new (Stripe.default || Stripe)(process.env.STRIPE_SECRET_KEY);

  const users = await app.entityService.findMany(UP, {
    filters: { customerId: { $notNull: true }, firstPaidAt: { $null: true } },
    fields: ['id', 'customerId', 'plan', 'subscriptionStatus'],
    limit: -1,
  });

  const tally = { checked: 0, lifetime: 0, neverPaid: 0, found: 0, written: 0, failed: 0 };
  for (const u of users) {
    if (isBillingExemptLifetimePro(u)) { tally.lifetime++; continue; }
    tally.checked++;
    try {
      const invoices = [];
      for await (const inv of stripe.invoices.list({ customer: u.customerId, status: 'paid', limit: 100 })) invoices.push(inv);
      const at = earliestPaidAt(invoices);
      if (!at) { tally.neverPaid++; continue; }
      tally.found++;
      console.log(`user ${u.id}: first paid ${at.toISOString()} (status ${u.subscriptionStatus})`);
      if (apply) {
        await app.entityService.update(UP, u.id, { data: { firstPaidAt: at } });
        tally.written++;
      }
    } catch (err) {
      tally.failed++;
      console.warn(`user ${u.id}: Stripe lookup failed (${err.code || err.type || 'error'})`);
    }
  }
  console.log(apply ? 'APPLIED' : 'DRY RUN (no writes)', tally);
  await app.destroy();
}

if (require.main === module) {
  main().catch((e) => { console.error(e.message); process.exit(1); });
}

module.exports = { earliestPaidAt };
