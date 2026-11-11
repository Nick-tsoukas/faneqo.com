'use strict';

/**
 * Writes the auditable consent record (Billing A). Append-only, server-side.
 *
 * Identity of a record = user + Stripe reference + consent version + termsKey
 * (`dedupeKey`):
 *   - the same agreement retried (same reference, same terms) → one record;
 *   - new terms accepted on the same reference (e.g. an invoice whose price
 *     changed, a reused session) → a NEW record, so every distinct
 *     agreement stays auditable.
 * Concurrent identical requests share one write (single-flight per dedupeKey
 * in this process). The `dedupeKey` attribute is also unique at the
 * application level. Faneqo's backend runs as one Railway instance; a
 * multi-instance deployment would need a database-level unique index.
 *
 * Stores only billing terms and ids. No card data, no IP address, no email,
 * no secrets. Any failure throws, and the caller returns no URL (fails closed).
 */

const crypto = require('crypto');

const UID = 'api::billing-consent.billing-consent';
const inflight = new Map();

function dedupeKeyFor({ userId, reference, version, termsKey }) {
  return crypto
    .createHash('sha256')
    .update(JSON.stringify([String(userId), String(reference), String(version), String(termsKey)]))
    .digest('hex')
    .slice(0, 40);
}

/**
 * @param {object} args
 * @param {object} args.strapi
 * @param {{ id: number }} args.user
 * @param {object} args.terms           from billingConsent.describeStartPro/describePortal
 * @param {'checkout_session'|'invoice'|'billing_portal_session'} args.referenceType
 * @param {string} args.reference       the Stripe id the consent authorized
 * @param {string|null} [args.subscriptionId]
 * @param {number|null} [args.bandId]
 * @param {Date} [args.now]
 * @returns {Promise<{ created: boolean, id: number|null, dedupeKey: string }>}
 */
async function recordConsent({ strapi, user, terms, referenceType, reference, subscriptionId = null, bandId = null, now = new Date() }) {
  if (!user?.id || !terms?.consentRequired || !reference || !terms.termsKey || !terms.version) {
    throw new Error('consent record is missing required data');
  }
  const dedupeKey = dedupeKeyFor({ userId: user.id, reference, version: terms.version, termsKey: terms.termsKey });

  const running = inflight.get(dedupeKey);
  if (running) {
    const r = await running;
    return { ...r, created: false };
  }

  const work = (async () => {
    const existing = await strapi.entityService.findMany(UID, {
      filters: { dedupeKey },
      fields: ['id'],
      limit: 1,
    });
    if (Array.isArray(existing) && existing.length) return { created: false, id: existing[0].id, dedupeKey };
    const price = terms.price || {};
    const row = await strapi.entityService.create(UID, {
      data: {
        user: user.id,
        dedupeKey,
        action: terms.action,
        consentVersion: terms.version,
        termsKey: terms.termsKey,
        disclosedText: terms.summary,
        priceLabel: price.label || null,
        amountCents: price.amountCents ?? null,
        currency: price.currency || null,
        interval: price.interval || null,
        intervalCount: price.intervalCount ?? null,
        previousPriceLabel: terms.previousLabel || null,
        immediateCharge: Boolean(terms.immediateCharge),
        stripeReferenceType: referenceType,
        stripeReference: reference,
        stripeSubscriptionId: subscriptionId || null,
        bandId: bandId ?? null,
        consentedAt: now.toISOString(),
      },
    });
    return { created: true, id: row?.id ?? null, dedupeKey };
  })();

  inflight.set(dedupeKey, work);
  try {
    return await work;
  } finally {
    inflight.delete(dedupeKey);
  }
}

module.exports = { recordConsent, dedupeKeyFor, CONSENT_UID: UID };
