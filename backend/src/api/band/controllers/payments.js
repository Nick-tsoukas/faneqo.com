"use strict";

const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const { createPaymentReport, transactionsToCsv } = require("../../../utils/payments/paymentReport");
const { connectFlagsForBand } = require("../../../utils/payments/paymentAccess");
const { onboardingUrls, payoutStage, requirementsDueCount } = require("../../../utils/payments/payoutOnboarding");

module.exports = {
  async onboard(ctx) {
    const bandId = ctx.params.id;

    const band = await strapi.entityService.findOne("api::band.band", bandId, {
      fields: ["id", "stripeAccountId"],
    });

    if (!band) return ctx.notFound("Band not found");

    // Ownership is enforced by the route policies (isAuthenticated + api::band.owns-band).

    let accountId = band.stripeAccountId;

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });

      accountId = account.id;

      await strapi.entityService.update("api::band.band", bandId, {
        data: { stripeAccountId: accountId },
      });
    }

    // If onboarding was completed previously (e.g. webhook missed), reconcile flags now.
    try {
      const acct = await stripe.accounts.retrieve(accountId);
      if (acct?.details_submitted === true) {
        // Same rule as the Connect webhook: Stripe charges allowed, not suspended.
        await strapi.entityService.update("api::band.band", bandId, {
          data: await connectFlagsForBand(strapi, bandId, acct),
        });
      }
    } catch (e) {
      strapi.log.warn("[payments.onboard] Unable to retrieve Stripe account", {
        bandId,
        accountId,
        message: e?.message,
      });
    }

    // Send the artist back to the band and page they started from.
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      ...onboardingUrls({ bandId, from: ctx.request.body?.from }),
      type: "account_onboarding",
    });

    ctx.body = {
      url: accountLink.url,
      accountId,
    };
  },

  /**
   * Payout setup stage for the owner, read fresh from Stripe so an artist
   * returning from onboarding sees the real state even before the webhook
   * lands. Stores the same flags the Connect webhook would.
   */
  async status(ctx) {
    const bandId = Number(ctx.params.id);
    const band = await strapi.entityService.findOne("api::band.band", bandId, {
      fields: ["id", "stripeAccountId", "paymentsEnabled", "stripeOnboardingComplete"],
    });
    if (!band) return ctx.notFound("Band not found");

    let flags = {
      paymentsEnabled: band.paymentsEnabled === true,
      stripeOnboardingComplete: band.stripeOnboardingComplete === true,
    };
    let account = null;
    if (band.stripeAccountId) {
      try {
        const retrieved = await stripe.accounts.retrieve(band.stripeAccountId);
        // Same rule as the Connect webhook: Stripe allows charges, not on the
        // suspension list, passes the approval gate.
        const fresh = await connectFlagsForBand(strapi, bandId, retrieved);
        if (
          fresh.paymentsEnabled !== flags.paymentsEnabled ||
          fresh.stripeOnboardingComplete !== flags.stripeOnboardingComplete
        ) {
          await strapi.entityService.update("api::band.band", bandId, { data: fresh });
        }
        flags = fresh;
        // Only now is the answer a fresh, stored check.
        account = retrieved;
      } catch (e) {
        strapi.log.warn("[payments.status] Unable to retrieve Stripe account", {
          bandId,
          message: e?.message,
        });
      }
    }

    ctx.set("Cache-Control", "no-store");
    ctx.body = {
      stage: payoutStage({ hasAccount: Boolean(band.stripeAccountId), account, ...flags }),
      ...flags,
      requirementsDue: requirementsDueCount(account),
      checkedWithStripe: Boolean(account),
    };
  },

  /**
   * Legacy summary (kept for older dashboards): all-time totals computed in the
   * database plus the most recent rows. New dashboards use report/transactions.
   */
  async summary(ctx) {
    const bandId = Number(ctx.params.id);
    if (!bandId) return ctx.badRequest("Band id is required");
    const recentLimit = Math.max(1, Math.min(50, Number(ctx.query.limit || 20)));
    const reports = createPaymentReport({ strapi });
    const all = await reports.totals(bandId, new Date(0), new Date(Date.now() + 86400000));
    const recent = await reports.transactions(bandId, { pageSize: recentLimit });
    ctx.body = {
      totals: {
        totalPaidCount: all.paidCount,
        totalPaidAmount: all.grossCents / 100,
        currency: "usd",
      },
      recent: recent.data.map((t) => ({
        id: t.id,
        amount: t.amountCents / 100,
        currency: t.currency,
        status: t.status,
        supportLabel: t.description,
        buttonKey: t.type,
        paidAt: t.paidAt,
        createdAt: t.createdAt,
      })),
    };
  },

  /** Financial overview for a period: totals, previous period, chart series. */
  async report(ctx) {
    const bandId = Number(ctx.params.id);
    if (!bandId) return ctx.badRequest("Band id is required");
    ctx.set("Cache-Control", "no-store");
    ctx.body = await createPaymentReport({ strapi }).report(bandId, ctx.query || {});
  },

  /** Server-paginated transaction history with filters. */
  async transactions(ctx) {
    const bandId = Number(ctx.params.id);
    if (!bandId) return ctx.badRequest("Band id is required");
    ctx.set("Cache-Control", "no-store");
    ctx.body = await createPaymentReport({ strapi }).transactions(bandId, ctx.query || {});
  },

  /** One transaction, only if it belongs to this band. */
  async transaction(ctx) {
    const bandId = Number(ctx.params.id);
    const row = await createPaymentReport({ strapi }).transaction(bandId, ctx.params.transactionId);
    if (!row) return ctx.notFound("Transaction not found");
    ctx.set("Cache-Control", "no-store");
    ctx.body = { data: row };
  },

  /** CSV of every transaction matching the filters (not just the visible page). */
  async exportCsv(ctx) {
    const bandId = Number(ctx.params.id);
    if (!bandId) return ctx.badRequest("Band id is required");
    const rows = await createPaymentReport({ strapi }).exportRows(bandId, ctx.query || {});
    ctx.set("Content-Type", "text/csv; charset=utf-8");
    ctx.set("Content-Disposition", `attachment; filename="faneqo-payments-${new Date().toISOString().slice(0, 10)}.csv"`);
    ctx.set("Cache-Control", "no-store");
    ctx.body = transactionsToCsv(rows);
  },
};
