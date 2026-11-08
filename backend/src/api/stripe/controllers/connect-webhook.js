"use strict";

const StripePackage = require("stripe");
const Stripe = StripePackage.default || StripePackage;
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");
const { createSupportMomentSync } = require("../../../utils/payments/supportMomentSync");
const {
  connectFlagsForBand,
  isFraudSignal,
  isOnApprovedList,
  suspendOnFraudSignal,
  suspendBandPayments,
} = require("../../../utils/payments/paymentAccess");

let syncInstance = null;
const supportSync = () => (syncInstance ||= createSupportMomentSync({ strapi, stripe }));

function safeJson(v) {
  if (!v) return null;
  if (typeof v === "object") return v;
  try {
    return JSON.parse(String(v));
  } catch {
    return null;
  }
}

function getDbClient() {
  try {
    return (
      strapi?.db?.connection?.client?.config?.client ||
      strapi?.db?.connection?.client?.dialect ||
      null
    );
  } catch {
    return null;
  }
}

function serializeJsonForDb(value) {
  const client = String(getDbClient() || "").toLowerCase();
  // In SQLite, Strapi stores json fields as TEXT and expects JSON strings.
  if (client.includes("sqlite")) return JSON.stringify(value ?? null);
  // In Postgres (json/jsonb), passing objects is fine.
  return value;
}

function makeOrderCode() {
  const n = Math.floor(1000 + Math.random() * 9000);
  return `MBQ-${n}`;
}

async function sendMerchEmail({ to, bandName, itemTitle, selectedSize, pickupInstructions, orderCode, pickupUrl }) {
  if (!to) return;
  const emailService = strapi.plugin("email").service("email");

  const sizeLine = selectedSize ? `Size: ${selectedSize}` : "";
  const subject = "Your merch is reserved — pickup details";
  const text =
    `Merch Reserved\n\n` +
    `Band: ${bandName || ""}\n` +
    `Item: ${itemTitle || ""}\n` +
    (sizeLine ? `${sizeLine}\n` : "") +
    `\nPickup: ${pickupInstructions || ""}\n\n` +
    `Order code: ${orderCode}\n` +
    `Pickup pass: ${pickupUrl}\n`;

  const html = `
    <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial; line-height: 1.5;">
      <h2 style="margin:0 0 12px 0;">Merch Reserved</h2>
      <div><strong>Band:</strong> ${bandName || ""}</div>
      <div><strong>Item:</strong> ${itemTitle || ""}</div>
      ${selectedSize ? `<div><strong>Size:</strong> ${selectedSize}</div>` : ""}
      <div style="margin-top: 12px; padding: 12px; border: 1px solid #e5e7eb; border-radius: 10px;">
        <div style="font-weight: 600;">Pickup instructions</div>
        <div>${(pickupInstructions || "").replace(/\n/g, "<br/>")}</div>
      </div>
      <div style="margin-top: 12px;"><strong>Order code:</strong> ${orderCode}</div>
      <div style="margin-top: 18px;">
        <a href="${pickupUrl}" style="display:inline-block; background:#7c3aed; color:#fff; text-decoration:none; padding:12px 16px; border-radius:10px;">View pickup pass</a>
      </div>
    </div>
  `;

  await emailService.send({
    to,
    subject,
    text,
    html,
  });
}

async function finalizeMerchOrderFromCheckout({ event, session }) {
  const merchOrderId = session?.metadata?.merchOrderId;
  if (!merchOrderId) return false;

  const debug = String(process.env.DEBUG || "").toLowerCase() === "true";

  const existing = await strapi.entityService.findOne(
    "api::merch-order.merch-order",
    merchOrderId,
    {
      populate: { band: { fields: ["id", "name", "slug", "stripeAccountId"] } },
      publicationState: "preview",
    }
  );

  if (!existing) {
    strapi.log.warn(`[merch webhook] No merch-order found for id=${merchOrderId}`);
    return true;
  }

  if (existing.status === "paid" || existing.status === "refunded") {
    if (debug) strapi.log.info(`[merch webhook] merch-order ${merchOrderId} already finalized (${existing.status})`);
    return true;
  }

  const bandId = existing?.band?.id || existing?.band;
  const stripeAccount = event.account || existing?.band?.stripeAccountId || null;

  let stripePaymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id || null;
  let stripeChargeId = null;

  if (stripePaymentIntentId && stripeAccount) {
    try {
      const pi = await stripe.paymentIntents.retrieve(
        stripePaymentIntentId,
        { expand: ["latest_charge"] },
        { stripeAccount }
      );
      stripePaymentIntentId = pi?.id || stripePaymentIntentId;
      stripeChargeId =
        (typeof pi?.latest_charge === "string"
          ? pi.latest_charge
          : pi?.latest_charge?.id) || null;
    } catch (e) {
      strapi.log.warn("[merch webhook] Unable to retrieve PaymentIntent", {
        merchOrderId,
        stripePaymentIntentId,
        stripeAccount,
        message: e?.message,
      });
    }
  }

  const customerName = session?.customer_details?.name || null;
  const customerEmail = session?.customer_details?.email || null;

  const publicAppUrl = String(process.env.PUBLIC_APP_URL || "").replace(/\/+$/, "");
  const pickupUrl = `${publicAppUrl}/pickup/${existing.orderCode}`;

  let soldOut = false;
  let updatedMerchConcierge = null;

  try {
    await strapi.db.connection.transaction(async (trx) => {
      const row = await trx("bands").where({ id: bandId }).forUpdate().first();
      if (!row) throw new Error("Band not found");

      const mc =
        safeJson(row.merch_concierge ?? row.merchConcierge ?? row.merchconcierge) || {};

      if (mc.enabled !== true || mc.staffReadyConfirmed !== true) {
        soldOut = true;
        return;
      }

      const items = Array.isArray(mc.merchItems) ? mc.merchItems : [];
      const idx = Number(existing.itemSlotIndex) - 1;
      const item = items[idx] || null;

      if (!item) {
        soldOut = true;
        return;
      }

      if (item.sizesEnabled === true) {
        const sz = String(existing.selectedSize || "").trim();
        const stock = item.sizeStock && typeof item.sizeStock === "object" ? item.sizeStock : {};
        const cur = Number(stock?.[sz] || 0);
        if (!sz || cur <= 0) {
          soldOut = true;
          return;
        }
        stock[sz] = cur - 1;
        item.sizeStock = stock;
      } else {
        const cur = Number(item.availableQty || 0);
        if (cur <= 0) {
          soldOut = true;
          return;
        }
        item.availableQty = cur - 1;
      }

      items[idx] = item;
      mc.merchItems = items;

      updatedMerchConcierge = mc;

      await trx("bands")
        .where({ id: bandId })
        .update({ merch_concierge: serializeJsonForDb(mc) });
    });
  } catch (e) {
    strapi.log.error("[merch webhook] transaction error", { merchOrderId, message: e?.message });
    soldOut = true;
  }

  if (soldOut) {
    await strapi.entityService.update("api::merch-order.merch-order", existing.id, {
      data: {
        status: "refund_pending",
        customerName,
        customerEmail,
        stripePaymentIntentId,
        stripeChargeId,
        errorMessage: "Sold out at checkout completion",
      },
    });

    if (stripePaymentIntentId && stripeAccount) {
      try {
        // Sold out is Faneqo's failure, not a sale: hand the platform fee back too
        await stripe.refunds.create(
          { payment_intent: stripePaymentIntentId, refund_application_fee: true },
          { stripeAccount }
        );
        await strapi.entityService.update("api::merch-order.merch-order", existing.id, {
          data: {
            status: "refunded",
            refundedAt: new Date().toISOString(),
          },
        });
      } catch (e) {
        strapi.log.warn("[merch webhook] refund failed", {
          merchOrderId,
          stripePaymentIntentId,
          stripeAccount,
          message: e?.message,
        });
      }
    }

    return true;
  }

  await strapi.entityService.update("api::merch-order.merch-order", existing.id, {
    data: {
      status: "paid",
      paidAt: new Date().toISOString(),
      customerName,
      customerEmail,
      stripeCheckoutSessionId: session?.id || existing.stripeCheckoutSessionId || null,
      stripePaymentIntentId,
      stripeChargeId,
    },
  });

  try {
    await sendMerchEmail({
      to: customerEmail,
      bandName: existing.bandNameSnapshot,
      itemTitle: existing.itemTitleSnapshot,
      selectedSize: existing.selectedSize,
      pickupInstructions: existing.pickupInstructionsSnapshot,
      orderCode: existing.orderCode,
      pickupUrl,
    });
  } catch (e) {
    strapi.log.warn("[merch webhook] email send failed", {
      merchOrderId,
      message: e?.message,
    });
  }

  return true;
}

module.exports = {
  async handle(ctx) {
    const sig = ctx.request.headers["stripe-signature"];
    const secret = String(
      process.env.STRIPE_CONNECT_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET || ""
    ).trim();
    const hasSecret = !!secret;

    const debug = String(process.env.DEBUG || "").toLowerCase() === "true";

    // Always-on, secret-free diagnostics so production webhook delivery can be
    // verified from Railway logs.
    strapi.log.info("[connect webhook] route hit", {
      hasSignature: !!sig,
      hasSecret,
      contentType: ctx.request.headers["content-type"],
    });

    if (!sig) {
      ctx.status = 400;
      ctx.body = "Webhook Error: No stripe-signature header value was provided.";
      return;
    }

    if (!hasSecret) {
      ctx.status = 500;
      ctx.body =
        "Webhook Error: STRIPE_CONNECT_WEBHOOK_SECRET (or STRIPE_WEBHOOK_SECRET) is not configured.";
      return;
    }

    // ✅ get raw body (requires includeUnparsed: true middleware)
    const rawBody =
      ctx.request.body?.[Symbol.for("unparsedBody")] ||
      ctx.request.body?.data?.[Symbol.for("unparsedBody")];

    strapi.log.info("[connect webhook] body check", { hasRawBody: !!rawBody });

    if (!rawBody) {
      strapi.log.error("[connect webhook] Missing raw body");
      ctx.status = 400;
      ctx.body = "Missing raw body. Check middlewares includeUnparsed: true.";
      return;
    }

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        sig,
        secret
      );

      strapi.log.info("[connect webhook] event", {
        type: event.type,
        account: event.account || null,
      });
    } catch (err) {
      strapi.log.error("[connect webhook] signature verification failed", err);
      ctx.status = 400;
      ctx.body = `Webhook Error: ${err.message}`;
      return;
    }

    // Helpful debug for what Stripe is sending
    if (event.type === "account.updated") {
      const account = event.data.object;

      strapi.log.info(
        `[connect webhook] acct=${account.id} details=${account.details_submitted} charges=${account.charges_enabled} payouts=${account.payouts_enabled}`
      );

      // Mirror Stripe on every update: payments stay on only while details are
      // submitted and Stripe allows charges, so a rejected or restricted account
      // switches off. An admin-suspended band never switches back on here.
      const bands = await strapi.entityService.findMany("api::band.band", {
        filters: { stripeAccountId: account.id },
        fields: ["id", "paymentsEnabled", "stripeOnboardingComplete"],
        limit: 1,
        publicationState: "preview",
      });

      const band = bands?.[0];

      if (!band) {
        strapi.log.warn(`[connect webhook] No band found for stripeAccountId=${account.id}`);
      } else {
        const flags = await connectFlagsForBand(strapi, band.id, account);
        if (
          flags.paymentsEnabled !== band.paymentsEnabled ||
          flags.stripeOnboardingComplete !== band.stripeOnboardingComplete
        ) {
          await strapi.entityService.update("api::band.band", band.id, { data: flags });
          strapi.log.info(
            `[connect webhook] band ${band.id} (${account.id}) paymentsEnabled=${flags.paymentsEnabled} onboarding=${flags.stripeOnboardingComplete}`
          );
        }
      }
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      const supportMomentId = session?.metadata?.supportMomentId;

      strapi.log.info("[connect webhook] checkout.session.completed", {
        sessionId: session?.id || null,
        paymentStatus: session?.payment_status || null,
        metadata: session?.metadata || null,
        supportMomentId: supportMomentId || null,
      });

      const didHandleMerch = await finalizeMerchOrderFromCheckout({ event, session });
      if (didHandleMerch) {
        ctx.body = { received: true };
        return;
      }

      if (!supportMomentId) {
        strapi.log.warn("[payments webhook] checkout.session.completed missing metadata.supportMomentId");
      } else {
        const result = await supportSync().applyCheckoutSession(session, event.account || null);
        strapi.log.info("[payments webhook] checkout.session.completed applied", { supportMomentId, ...result });
      }
    }

    // Delayed payment methods settle later; expired sessions never got paid
    if (event.type === "checkout.session.async_payment_succeeded" || event.type === "checkout.session.expired") {
      const session = event.data.object;
      if (session?.metadata?.supportMomentId) {
        const result = await supportSync().applyCheckoutSession(session, event.account || null);
        strapi.log.info(`[payments webhook] ${event.type} applied`, { supportMomentId: session.metadata.supportMomentId, ...result });
      }
    }

    if (event.type === "checkout.session.async_payment_failed") {
      const session = event.data.object;
      if (session?.metadata?.supportMomentId) await supportSync().markAsyncFailed(session, event.account || null);
    }

    if (event.type === "charge.refunded") {
      const result = await supportSync().applyChargeRefund(event.data.object, event.account || null);
      strapi.log.info("[payments webhook] charge.refunded", { chargeId: event.data.object?.id, ...result });
    }

    if (event.type === "charge.dispute.created" || event.type === "charge.dispute.updated" || event.type === "charge.dispute.closed") {
      const result = await supportSync().applyDispute(event.data.object, event.account || null);
      strapi.log.info(`[payments webhook] ${event.type}`, { disputeStatus: event.data.object?.status, ...result });
    }

    // A stolen-card signal on a connected account stops that band's payments
    // until an operator reviews it (October 2026 card-testing incident).
    if (isFraudSignal(event) && event.account) {
      const bands = await strapi.entityService.findMany("api::band.band", {
        filters: { stripeAccountId: event.account },
        fields: ["id"],
        limit: 1,
        publicationState: "preview",
      });
      const band = bands?.[0];
      if (!band) {
        strapi.log.warn(`[payments webhook] fraud signal ${event.type} for unknown account ${event.account}`);
      } else if (!suspendOnFraudSignal()) {
        strapi.log.warn(`[payments webhook] FRAUD SIGNAL ${event.type} band ${band.id}; auto-suspend disabled, review`);
      } else if (await isOnApprovedList(strapi, band.id)) {
        strapi.log.warn(`[payments webhook] FRAUD SIGNAL ${event.type} band ${band.id}; vetted band, not suspended, review`);
      } else {
        const { added } = await suspendBandPayments(strapi, band.id);
        strapi.log.warn(`[payments webhook] FRAUD SIGNAL ${event.type} band ${band.id}: payments suspended${added ? "" : " (already listed)"}`);
      }
    }

    ctx.body = { received: true };
  },
};
