"use strict";

const crypto = require("crypto");
const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const { platformFeePaymentIntentData } = require("../../../utils/billing/platformFee");
const { isPaymentsSuspended, isPaymentsApproved, storedFlagsAllowCheckout } = require("../../../utils/payments/paymentAccess");
const { resolveCheckoutCents } = require("../../../utils/payments/checkoutAmount");
const { createCheckoutGuard } = require("../../../utils/payments/checkoutGuard");

const guard = createCheckoutGuard();

const CANON_KEYS = new Set([
  "pay_entry",
  "tip_band",
  "pay_merch",
  "support_band",
  "help_get_home",
  "after_show_support",
  "merch_table",
]);

function getButton(band, key) {
  const btn = (band.paymentButtons || []).find((b) => b.key === key);
  return btn || null;
}

module.exports = {
  async create(ctx) {
    const bandId = ctx.params.id;
    const { buttonKey, amount, attemptId } = ctx.request.body || {};

    if (!CANON_KEYS.has(buttonKey)) {
      return ctx.badRequest("Invalid buttonKey");
    }

    const band = await strapi.entityService.findOne("api::band.band", bandId, {
      fields: ["id", "name", "slug", "stripeAccountId", "paymentsEnabled", "stripeOnboardingComplete", "paymentButtons"],
      publicationState: "preview",
    });

    if (!band) return ctx.notFound("Band not found");

    if (!storedFlagsAllowCheckout(band)) {
      return ctx.badRequest("Payments not enabled for this band");
    }

    // Admin suspension (and the optional approval gate) win over the stored flags.
    if ((await isPaymentsSuspended(strapi, band.id)) || !(await isPaymentsApproved(strapi, band.id))) {
      return ctx.forbidden("Payments are paused for this artist");
    }

    const btn = getButton(band, buttonKey);
    if (!btn || btn.enabled !== true) {
      return ctx.badRequest("This payment option is not enabled");
    }

    const resolved = resolveCheckoutCents(btn, amount);
    if (!resolved.ok) return ctx.badRequest(resolved.error);
    const cents = resolved.cents;

    // A repeat tap with the same attemptId gets the session already opened.
    const attemptKey = guard.attemptKey(band.id, attemptId, buttonKey, cents);
    const previous = guard.reuse(attemptKey);
    if (previous) {
      ctx.body = previous;
      return;
    }

    const limit = guard.check(band.id, ctx);
    if (!limit.ok) {
      strapi.log.warn("[checkout] rate limited", { bandId: band.id, scope: limit.scope });
      ctx.set("Retry-After", String(limit.retryAfterSec));
      return ctx.tooManyRequests("Too many checkout attempts. Please try again in a few minutes.");
    }
    guard.recordSession(band.id, ctx);

    // Unguessable reference for the public receipt (ids are sequential)
    const receiptToken = crypto.randomBytes(18).toString("base64url");

    // 1) Create Support Moment (pending)
    const support = await strapi.entityService.create("api::support-moment.support-moment", {
      data: {
        band: band.id,
        bandNameSnapshot: band.name,
        bandSlugSnapshot: band.slug,
        buttonKey,
        supportLabel: btn.title,
        badgeId: btn.badgeId || null,
        // amountCents is authoritative; the legacy integer amount is whole dollars for older readers
        amountCents: cents,
        amount: Math.round(cents / 100),
        receiptToken,
        currency: "usd",
        status: "pending",
        source: "band-profile",
        shareOptIn: false,
        showAmountOnShare: false,
        supporterWallOptIn: false,
      },
    });

    const publicAppUrl = String(process.env.PUBLIC_APP_URL || "").replace(/\/+$/, "");

    // 2) Create Stripe Checkout Session on the CONNECTED account
    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: `${band.name} — ${btn.title}`,
              },
              unit_amount: cents,
            },
            quantity: 1,
          },
        ],
        success_url: `${publicAppUrl}/${band.slug}/support/receipt?r=${receiptToken}`,
        cancel_url: `${publicAppUrl}/${band.slug}?canceled=1`,
        metadata: {
          supportMomentId: String(support.id),
          bandId: String(band.id),
          buttonKey,
        },
        // Faneqo's fee comes out of the artist's proceeds; omitted when off
        ...platformFeePaymentIntentData(cents),
      },
      {
        stripeAccount: band.stripeAccountId, // ✅ money goes to the band
      }
    );

    // (Optional now, useful later) store session id
    await strapi.entityService.update("api::support-moment.support-moment", support.id, {
      data: {
        stripeCheckoutSessionId: session.id || null,
        stripePaymentIntentId: session.payment_intent || null,
      },
    });

    ctx.body = { url: session.url, supportMomentId: support.id };
    guard.remember(attemptKey, ctx.body);
  },
};
