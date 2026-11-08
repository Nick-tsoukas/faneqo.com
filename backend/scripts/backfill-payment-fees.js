'use strict';

/**
 * Backfill exact amounts, refunds and Stripe-reported fees onto existing
 * support-moments (fan payments), reading each one from Stripe.
 *
 *   node scripts/backfill-payment-fees.js            # dry run: report only
 *   node scripts/backfill-payment-fees.js --apply    # write the changes
 *   node scripts/backfill-payment-fees.js --apply --limit 200
 *
 * Read-only against Stripe (retrieves PaymentIntents and Charges; never
 * creates, captures or refunds anything). Safe to re-run: it writes absolute
 * values from Stripe, and skips rows that already have fees and no refund drift.
 */

const { paidFieldsFromPaymentIntent, SUCCEEDED } = require('../src/utils/payments/supportMomentSync');

const UID = 'api::support-moment.support-moment';
const apply = process.argv.includes('--apply');
const limitArg = process.argv.indexOf('--limit');
const limit = limitArg > -1 ? Number(process.argv[limitArg + 1]) || 100 : 1000;

async function main() {
  const { createStrapi } = require('@strapi/strapi');
  const app = await (createStrapi ? createStrapi() : require('@strapi/strapi')()).load();
  const Stripe = require('stripe');
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  const rows = await app.entityService.findMany(UID, {
    filters: { status: { $in: SUCCEEDED }, stripePaymentIntentId: { $notNull: true } },
    fields: ['id', 'status', 'amount', 'amountCents', 'netCents', 'refundedAmountCents', 'stripePaymentIntentId'],
    populate: { band: { fields: ['id', 'stripeAccountId'] } },
    sort: { id: 'desc' },
    limit,
    publicationState: 'preview',
  });

  let changed = 0;
  let skipped = 0;
  let failed = 0;
  for (const sm of rows) {
    const account = sm.band?.stripeAccountId;
    if (!account) { skipped++; continue }
    try {
      const pi = await stripe.paymentIntents.retrieve(sm.stripePaymentIntentId, { expand: ['latest_charge.balance_transaction'] }, { stripeAccount: account });
      if (pi.status !== 'succeeded') { skipped++; continue }
      const fields = paidFieldsFromPaymentIntent(pi);
      // Leave dispute state to the webhook; only correct refund-derived status
      if (sm.status === 'disputed') delete fields.status;
      const drift = sm.netCents == null || sm.amountCents == null || Number(sm.refundedAmountCents || 0) !== Number(fields.refundedAmountCents || 0) || (fields.status && fields.status !== sm.status);
      if (!drift) { skipped++; continue }
      changed++;
      console.log(`${apply ? 'update' : 'would update'} #${sm.id}: ${sm.status} -> ${fields.status || sm.status}, amount ${fields.amountCents}c, fee ${fields.platformFeeCents}c, stripe ${fields.stripeFeeCents ?? '?'}c, net ${fields.netCents ?? '?'}c, refunded ${fields.refundedAmountCents}c`);
      if (apply) await app.entityService.update(UID, sm.id, { data: fields });
    } catch (e) {
      failed++;
      console.warn(`#${sm.id}: ${e.message}`);
    }
  }
  console.log(`\n${rows.length} checked, ${changed} ${apply ? 'updated' : 'to update'}, ${skipped} unchanged/skipped, ${failed} failed${apply ? '' : ' (dry run: re-run with --apply to write)'}`);
  await app.destroy();
}

main().catch((e) => { console.error(e); process.exit(1) });
